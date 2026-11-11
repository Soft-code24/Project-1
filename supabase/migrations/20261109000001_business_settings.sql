-- ============================================================================
-- business_settings — single-restaurant identity, branding & ordering settings
-- PRD §2E: configurable restaurant settings persisted in Supabase, single row.
-- Source-of-truth values are seeded from the existing src/data/site.js constants
-- so applying this migration causes no visual change until an admin edits them.
-- Singleton design: a fixed UUID primary key with a CHECK constraint guarantees
-- exactly one row can ever exist — no triggers required for cardinality.
-- ============================================================================

create table if not exists public.business_settings (
  id                 uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  restaurant_name    text not null default 'SavorBite',
  tagline            text default 'Freshly crafted meals, delivered fast',
  description        text default '',
  logo_url           text,
  favicon_url        text,
  contact_email      text default 'hello@savorbite.ng',
  contact_phone      text default '+234 801 234 5678',
  whatsapp           text,
  address            text default '24 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
  city               text default 'Lagos, NG',
  socials            jsonb not null default '[]'::jsonb,
  hours              jsonb not null default '[]'::jsonb,
  delivery_available boolean not null default true,
  pickup_available   boolean not null default true,
  delivery_fee       numeric(12, 2) not null default 1500 check (delivery_fee >= 0),
  free_delivery_threshold numeric(12, 2) not null default 20000 check (free_delivery_threshold >= 0),
  min_order_amount   numeric(12, 2) not null default 0 check (min_order_amount >= 0),
  estimated_prep_time text default '30 minutes',
  primary_color      text not null default '#F28C28' check (primary_color ~* '^#[0-9a-f]{6}$'),
  accent_color       text not null default '#3FA34D' check (accent_color ~* '^#[0-9a-f]{6}$'),
  updated_at         timestamptz not null default now(),

  -- Singleton guard: only the fixed UUID may ever be inserted.
  constraint business_settings_single_row check (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Maintain updated_at on settings row updates.
drop trigger if exists business_settings_set_updated_at on public.business_settings;
create trigger business_settings_set_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

-- Seed the single row with current hardcoded values.
-- ON CONFLICT (id) DO NOTHING guarantees idempotency: never overwrites existing
-- data and can never create a duplicate row because the PK + CHECK allow only one id.
insert into public.business_settings (
  restaurant_name, tagline, description, contact_email, contact_phone,
  address, city, delivery_fee, free_delivery_threshold, min_order_amount,
  estimated_prep_time, primary_color, accent_color,
  socials, hours
) values (
  'SavorBite',
  'Freshly crafted meals, delivered fast',
  '',
  'hello@savorbite.ng',
  '+234 801 234 5678',
  '24 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
  'Lagos, NG',
  1500,
  20000,
  0,
  '30 minutes',
  '#F28C28',
  '#3FA34D',
  '[
    {"label":"Instagram","href":"#"},
    {"label":"X","href":"#"},
    {"label":"TikTok","href":"#"}
  ]'::jsonb,
  '[
    {"day":"Monday – Friday","time":"9:00 AM – 10:00 PM"},
    {"day":"Saturday – Sunday","time":"10:00 AM – 11:00 PM"}
  ]'::jsonb
) on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Storage — brand-assets bucket (logos, favicon). Public read; admin write.
-- Backend uploads with the service-role key, bypassing RLS.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-assets',
  'brand-assets',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'image/x-icon']
)
on conflict (id) do nothing;

drop policy if exists "brand_assets_public_read" on storage.objects;
create policy "brand_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'brand-assets');

drop policy if exists "brand_assets_admin_insert" on storage.objects;
create policy "brand_assets_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'brand-assets' and public.is_admin());

drop policy if exists "brand_assets_admin_update" on storage.objects;
create policy "brand_assets_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'brand-assets' and public.is_admin())
  with check (bucket_id = 'brand-assets' and public.is_admin());

drop policy if exists "brand_assets_admin_delete" on storage.objects;
create policy "brand_assets_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'brand-assets' and public.is_admin());

-- ----------------------------------------------------------------------------
-- RLS — business_settings: public read, admin write
-- ----------------------------------------------------------------------------
alter table public.business_settings enable row level security;

drop policy if exists "business_settings_public_read" on public.business_settings;
create policy "business_settings_public_read"
  on public.business_settings for select
  using (true);

drop policy if exists "business_settings_admin_all" on public.business_settings;
create policy "business_settings_admin_all"
  on public.business_settings for all
  using (public.is_admin())
  with check (public.is_admin());
