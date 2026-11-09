-- ============================================================================
-- collections — Shopify-style collections that group products
-- A product can belong to MANY collections via collection_products.
-- ============================================================================

create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  handle      text not null unique,
  description text not null default '',
  image_url   text,
  type        text not null default 'manual' check (type in ('manual', 'smart')),
  rules       jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists collections_handle_idx on public.collections (handle);
create index if not exists collections_is_published_idx on public.collections (is_published);

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

-- Join table: product -> many collections
create table if not exists public.collection_products (
  id           uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id   uuid not null references public.products (id) on delete cascade,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (collection_id, product_id)
);

create index if not exists collection_products_collection_id_idx on public.collection_products (collection_id);
create index if not exists collection_products_product_id_idx on public.collection_products (product_id);

drop trigger if exists collection_products_set_updated_at on public.collection_products;
create trigger collection_products_set_updated_at
  before update on public.collection_products
  for each row execute function public.set_updated_at();

-- ============================================================================
-- product_images — multiple images per product (Shopify-like gallery)
-- ============================================================================

create table if not exists public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url        text not null,
  alt_text   text,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on public.product_images (product_id);
