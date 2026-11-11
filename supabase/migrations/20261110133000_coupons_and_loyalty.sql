-- ============================================================================
-- coupons + loyalty — Phase 2G-B
--
-- Coupon management and loyalty rewards foundation.
-- Additive only: no existing tables modified.
--
-- Design decisions (per 2G-A improvement requirements):
--   * citext for case-insensitive coupon code uniqueness
--   * percentage discount capped at 100% via check constraint
--   * Atomic usage-limit increments (UPDATE ... WHERE usage_count < usage_limit)
--   * Unique (coupon_id, customer_id, order_id) where order_id is not null
--     prevents double redemption; NULL order_id allows manual adjustments
--   * ON DELETE RESTRICT / SET NULL preserves redemption/loyalty history
--   * loyalty_transactions is append-only: BEFORE UPDATE/DELETE triggers block
--     ALL roles including service_role
--   * RLS: customers read own data only; admins full CRUD on coupons
--   * Coupon codes are NOT publicly discoverable (admin-only read)
--   * No ON DELETE CASCADE on financial/redemption audit tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
--   citext — case-insensitive text for coupon codes
--   Verified to exist in the `extensions` schema before referencing
--   extensions.citext; never silently installs into another schema.
-- ----------------------------------------------------------------------------
do $$
begin
  -- Only create citext in extensions schema if not already there.
  -- If citext exists in a different schema, we do not move it or duplicate it;
  -- we reference extensions.citext only after confirming its location.
  if not exists (
    select 1
    from pg_extension e
    join pg_namespace n on e.extnamespace = n.oid
    where e.extname = 'citext' and n.nspname = 'extensions'
  ) then
    create extension if not exists citext with schema extensions;
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- coupons table — promotion definitions
-- ----------------------------------------------------------------------------
create table if not exists public.coupons (
  id                uuid primary key default gen_random_uuid(),
  code              extensions.citext not null,
  type              text not null check (type in ('percentage', 'fixed_amount')),
  discount_value    numeric(12, 2) not null check (discount_value > 0),
  min_order_amount  numeric(12, 2) not null default 0 check (min_order_amount >= 0),
  max_discount      numeric(12, 2) check (max_discount is null or max_discount > 0),
  starts_at         timestamptz not null default now(),
  expires_at        timestamptz, -- null = no expiry
  usage_limit       integer check (usage_limit is null or usage_limit > 0),
  usage_count       integer not null default 0 check (usage_count >= 0),
  per_customer_limit integer not null default 1 check (per_customer_limit >= 1),
  first_order_only  boolean not null default false,
  is_active         boolean not null default true,
  created_by        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Coupon code: 3–40 nonblank characters
alter table public.coupons
  drop constraint if exists coupons_code_length_check;
alter table public.coupons
  add constraint coupons_code_length_check
    check (length(trim(code)) between 3 and 40);

-- Expiry must be after start date
alter table public.coupons
  drop constraint if exists coupons_expiry_after_start_check;
alter table public.coupons
  add constraint coupons_expiry_after_start_check
    check (expires_at is null or expires_at > starts_at);

-- Usage count cannot exceed usage limit
alter table public.coupons
  drop constraint if exists coupons_usage_count_limit_check;
alter table public.coupons
  add constraint coupons_usage_count_limit_check
    check (usage_limit is null or usage_count <= usage_limit);

-- Percentage discount cannot exceed 100%
alter table public.coupons
  drop constraint if exists coupons_percentage_max_100;
alter table public.coupons
  add constraint coupons_percentage_max_100
    check ((type <> 'percentage') or (discount_value <= 100));

create unique index if not exists coupons_code_unique_idx
  on public.coupons (code);

create index if not exists coupons_active_idx on public.coupons (is_active, starts_at, expires_at);

-- Maintain updated_at on coupon edits
drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- coupon_redemptions table — redemption audit + idempotency
--   ON DELETE RESTRICT preserves history when referenced rows are removed
--   (admin must resolve dependent redemptions before deleting a coupon/customer)
--   order_id uses ON DELETE SET NULL so redemption history survives order removal
--   Unique (coupon_id, customer_id, order_id) where order_id is not null
--     prevents double redemption for order-tied redemptions
--   NULL order_id allows manual adjustments (multiple permitted)
-- ----------------------------------------------------------------------------
create table if not exists public.coupon_redemptions (
  id           uuid primary key default gen_random_uuid(),
  coupon_id    uuid not null
    references public.coupons (id) on delete restrict,
  customer_id  uuid not null
    references auth.users (id) on delete restrict,
  order_id     uuid
    references public.orders (id) on delete set null,
  discount     numeric(12, 2) not null check (discount >= 0),
  redeemed_at  timestamptz not null default now()
);

-- Idempotency: one redemption per coupon per customer per order (order-tied only)
create unique index if not exists coupon_redemptions_unique_idx
  on public.coupon_redemptions (coupon_id, customer_id, order_id)
  where order_id is not null;

create index if not exists coupon_redemptions_customer_idx on public.coupon_redemptions (customer_id);
create index if not exists coupon_redemptions_coupon_idx on public.coupon_redemptions (coupon_id);
create index if not exists coupon_redemptions_order_idx on public.coupon_redemptions (order_id);

-- ----------------------------------------------------------------------------
-- loyalty_accounts table — per-customer points balance
--   customer_id ON DELETE RESTRICT prevents deleting a customer with
--   an existing loyalty account; the account must be resolved first.
--   Admins read-only: balance changes occur only via secure backend workflow
--   that also writes the points ledger.
-- ----------------------------------------------------------------------------
create table if not exists public.loyalty_accounts (
  customer_id     uuid primary key
    references auth.users (id) on delete restrict,
  points_balance  integer not null default 0 check (points_balance >= 0),
  points_earned   integer not null default 0 check (points_earned >= 0),
  points_redeemed integer not null default 0 check (points_redeemed >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- loyalty_transactions table — append-only points ledger
--   ON DELETE RESTRICT preserves order references — orders linked to loyalty
--   transactions cannot be hard-deleted (append-only integrity).
--   Idempotent: one 'earned' entry per customer per order
--   Append-only: BEFORE UPDATE/DELETE triggers block ALL roles including
--   service_role. Admin adjustments must be new ledger entries (INSERT),
--   not edits/deletes. Exceptional maintenance requires direct superuser
--   intervention with a logged transaction, not application-layer edits.
-- ----------------------------------------------------------------------------
create table if not exists public.loyalty_transactions (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null
    references auth.users (id) on delete restrict,
  order_id      uuid
    references public.orders (id) on delete restrict,
  type          text not null check (type in ('earned', 'redeemed', 'adjusted')),
  points        integer not null, -- positive = earned, negative = redeemed/adjusted
  reason        text not null,
  balance_after integer not null,
  created_at    timestamptz not null default now()
);

-- Idempotency: one earned entry per customer per order
create unique index if not exists loyalty_transactions_earned_unique_idx
  on public.loyalty_transactions (customer_id, order_id)
  where type = 'earned';

create index if not exists loyalty_transactions_customer_idx on public.loyalty_transactions (customer_id, created_at desc);
create index if not exists loyalty_transactions_order_idx on public.loyalty_transactions (order_id);

-- Append-only guards: block UPDATE and DELETE for every role including service_role
create or replace function public.loyalty_transactions_deny_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'loyalty_transactions is append-only: UPDATE is not permitted';
end
$$;

create or replace function public.loyalty_transactions_deny_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'loyalty_transactions is append-only: DELETE is not permitted';
end
$$;

drop trigger if exists loyalty_transactions_deny_update_trg on public.loyalty_transactions;
create trigger loyalty_transactions_deny_update_trg
  before update on public.loyalty_transactions
  for each row execute function public.loyalty_transactions_deny_update();

drop trigger if exists loyalty_transactions_deny_delete_trg on public.loyalty_transactions;
create trigger loyalty_transactions_deny_delete_trg
  before delete on public.loyalty_transactions
  for each row execute function public.loyalty_transactions_deny_delete();

-- ----------------------------------------------------------------------------
-- RLS policies
--   All tables use drop/create pattern for idempotent re-application.
--   Customers: read own data only (RLS).
--   Admins: full CRUD on coupons; SELECT-only on coupon_redemptions and
--   loyalty_accounts; SELECT-only on loyalty_transactions.
--   service_role (backend API): bypasses RLS entirely; only INSERTs to
--   loyalty_transactions and updates loyalty_accounts via secure workflow.
-- ----------------------------------------------------------------------------
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_transactions enable row level security;

-- coupons: admin full CRUD; no public read access (codes are private)
drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all"
  on public.coupons for all
  using (public.is_admin())
  with check (public.is_admin());

-- coupon_redemptions: customers read own; admin SELECT-only
drop policy if exists "coupon_redemptions_select_own" on public.coupon_redemptions;
create policy "coupon_redemptions_select_own"
  on public.coupon_redemptions for select
  using (auth.uid() = customer_id);

drop policy if exists "coupon_redemptions_select_all_admin" on public.coupon_redemptions;
create policy "coupon_redemptions_select_all_admin"
  on public.coupon_redemptions for select
  using (public.is_admin());

-- loyalty_accounts: customers read own; admin SELECT-only
drop policy if exists "loyalty_accounts_select_own" on public.loyalty_accounts;
create policy "loyalty_accounts_select_own"
  on public.loyalty_accounts for select
  using (auth.uid() = customer_id);

drop policy if exists "loyalty_accounts_select_all_admin" on public.loyalty_accounts;
create policy "loyalty_accounts_select_all_admin"
  on public.loyalty_accounts for select
  using (public.is_admin());

-- loyalty_transactions: APPEND-ONLY for all roles
--   SELECT: customers read own; admins read all
--   INSERT: service_role backend only (no customer/admin INSERT policy)
--   UPDATE/DELETE: DENIED to all roles by triggers (including service_role)
drop policy if exists "loyalty_transactions_select_own" on public.loyalty_transactions;
create policy "loyalty_transactions_select_own"
  on public.loyalty_transactions for select
  using (auth.uid() = customer_id);

drop policy if exists "loyalty_transactions_select_all_admin" on public.loyalty_transactions;
create policy "loyalty_transactions_select_all_admin"
  on public.loyalty_transactions for select
  using (public.is_admin());

-- No INSERT policy for customers or admins — only service_role (backend) bypasses RLS
-- No UPDATE/DELETE policy exists for any role — triggers block all attempts
