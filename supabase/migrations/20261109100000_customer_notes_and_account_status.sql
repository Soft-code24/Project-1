-- ============================================================================
-- customer_notes + account_status — Phase 2F-E
--
-- Adds internal customer notes (admin-only, never exposed to customers) and
-- an account_status column on profiles so admins can suspend/reactivate
-- customer accounts securely.
--
-- Additive only: no existing tables or columns are modified except the new
-- account_status column on profiles, which defaults to 'active' for all
-- existing rows so no customer is affected until an admin acts.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- customer_notes table — internal admin notes on customer profiles
-- ----------------------------------------------------------------------------
create table if not exists public.customer_notes (
  id         uuid primary key default gen_random_uuid(),
  customer_id uuid not null
    references public.profiles (id) on delete cascade,
  author_id   uuid not null
    references public.profiles (id),
  content    text not null
    check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_notes_customer_id_idx
  on public.customer_notes (customer_id, created_at desc);

create index if not exists customer_notes_author_id_idx
  on public.customer_notes (author_id);

-- Maintain updated_at on note edits.
drop trigger if exists customer_notes_set_updated_at on public.customer_notes;
create trigger customer_notes_set_updated_at
  before update on public.customer_notes
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- account_status column on profiles — active / suspended
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists account_status text not null default 'active'
  check (account_status in ('active', 'suspended'));

create index if not exists profiles_account_status_idx
  on public.profiles (account_status);

-- ----------------------------------------------------------------------------
-- RLS policies — customer_notes
--   customers:   no access at all (notes are internal-only)
--   admins:      full CRUD
--   service_role: bypasses RLS (backend API)
-- ----------------------------------------------------------------------------
alter table public.customer_notes enable row level security;

drop policy if exists "customer_notes_admin_all" on public.customer_notes;
create policy "customer_notes_admin_all"
  on public.customer_notes for all
  using (public.is_admin())
  with check (public.is_admin());

-- Explicitly deny all access to non-admins (defense in depth).
drop policy if exists "customer_notes_no_customer_access" on public.customer_notes;
create policy "customer_notes_no_customer_access"
  on public.customer_notes for all
  using (false)
  with check (false);

-- ----------------------------------------------------------------------------
-- Prevent admins from suspending their own account — enforced in backend
-- controller logic (not at DB level, since the caller's identity is known
-- from the JWT via requireAuth).
-- ----------------------------------------------------------------------------
