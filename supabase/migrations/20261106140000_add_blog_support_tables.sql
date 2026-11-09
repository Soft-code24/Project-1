-- ============================================================================
-- blog_posts + support_tickets + orders.paystack_reference
-- SavorBite e-commerce upgrade (Step 2)
-- Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS columns / IF NOT EXISTS policies.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- blog_posts — published blog content (SEO-driven)
-- ---------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  cover_image text,
  excerpt     text not null default '',
  content     text not null default '',
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists blog_posts_slug_idx on public.blog_posts (slug);
create index if not exists blog_posts_published_idx on public.blog_posts (published);
create index if not exists blog_posts_created_at_idx on public.blog_posts (created_at desc);

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- support_tickets — customer support inbox (anyone can insert, admin reads)
-- ---------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  email     text not null,
  subject   text not null default '',
  message   text not null,
  status    text not null default 'open'
            check (status in ('open', 'replied', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_status_idx on public.support_tickets (status);
create index if not exists support_tickets_created_at_idx on public.support_tickets (created_at desc);

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- orders.paystack_reference (unique) — idempotent Paystack webhook matching
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists paystack_reference text unique;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.blog_posts enable row level security;
alter table public.support_tickets enable row level security;

-- blog_posts: public read published only; admin all
drop policy if exists "blog_posts_public_read" on public.blog_posts;
create policy "blog_posts_public_read"
  on public.blog_posts for select
  using (published = true);

drop policy if exists "blog_posts_admin_all" on public.blog_posts;
create policy "blog_posts_admin_all"
  on public.blog_posts for all
  using (public.is_admin())
  with check (public.is_admin());

-- support_tickets: anyone may insert; only admin may read/update
drop policy if exists "support_tickets_insert_public" on public.support_tickets;
create policy "support_tickets_insert_public"
  on public.support_tickets for insert
  to anon, authenticated
  with check (true);

drop policy if exists "support_tickets_admin_all" on public.support_tickets;
create policy "support_tickets_admin_all"
  on public.support_tickets for all
  using (public.is_admin())
  with check (public.is_admin());
