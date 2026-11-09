-- ============================================================================
-- Row Level Security (PRD §9)
--   customers  → read/write only their own data
--   anon       → read public catalogue, submit contact messages
--   admins     → full access (profiles.role = 'admin')
--   service_role (the backend API) bypasses RLS entirely
-- ============================================================================

alter table public.profiles             enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.cart_items           enable row level security;
alter table public.banners              enable row level security;
alter table public.payments             enable row level security;
alter table public.contact_messages     enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: read/update own row; admins read all
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- categories: public read, admin write
-- ---------------------------------------------------------------------------
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select
  using (is_active or public.is_admin());

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- products: public read of active products, admin write
-- ---------------------------------------------------------------------------
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  using (is_active or public.is_admin());

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- orders: customers see/insert only their own; only admins can update
-- ---------------------------------------------------------------------------
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders for insert
  with check (auth.uid() = user_id);

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_items: accessible when the parent order belongs to the customer
-- ---------------------------------------------------------------------------
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_admin_all"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_status_history: customers read their own trail; admins read/manage
-- ---------------------------------------------------------------------------
drop policy if exists "order_status_history_select_own" on public.order_status_history;
create policy "order_status_history_select_own"
  on public.order_status_history for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_status_history_admin_all" on public.order_status_history;
create policy "order_status_history_admin_all"
  on public.order_status_history for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- cart_items: full CRUD for the owner; admins may read for support
-- ---------------------------------------------------------------------------
drop policy if exists "cart_items_own_all" on public.cart_items;
create policy "cart_items_own_all"
  on public.cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cart_items_admin_read" on public.cart_items;
create policy "cart_items_admin_read"
  on public.cart_items for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- banners: public read of live banners; admins manage
-- ---------------------------------------------------------------------------
drop policy if exists "banners_public_read" on public.banners;
create policy "banners_public_read"
  on public.banners for select
  using (
    is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );

drop policy if exists "banners_admin_all" on public.banners;
create policy "banners_admin_all"
  on public.banners for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- payments: customers see their own receipts; rows are written by the
-- backend/service-role only; admins manage
-- ---------------------------------------------------------------------------
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "payments_admin_all" on public.payments;
create policy "payments_admin_all"
  on public.payments for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- contact_messages: anyone may submit; only admins read/triage
-- ---------------------------------------------------------------------------
drop policy if exists "contact_messages_insert_public" on public.contact_messages;
create policy "contact_messages_insert_public"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "contact_messages_admin_all" on public.contact_messages;
create policy "contact_messages_admin_all"
  on public.contact_messages for all
  using (public.is_admin())
  with check (public.is_admin());
