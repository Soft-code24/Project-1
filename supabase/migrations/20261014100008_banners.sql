-- ============================================================================
-- banners — promotional homepage banners (PRD §4.1)
-- Drives the hero promo and seasonal specials; activated by admins.
-- ============================================================================

create table if not exists public.banners (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  subtitle     text not null default '',
  image_url    text,
  badge_text   text,
  cta_label    text not null default 'Order Now',
  cta_link     text not null default '/shop',
  promo_code   text,
  placement    text not null default 'home-hero'
               check (placement in ('home-hero', 'home-secondary', 'shop-top', 'popup')),
  is_active    boolean not null default true,
  starts_at    timestamptz,
  ends_at      timestamptz,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists banners_active_idx on public.banners (is_active, sort_order);

drop trigger if exists banners_set_updated_at on public.banners;
create trigger banners_set_updated_at
  before update on public.banners
  for each row execute function public.set_updated_at();
