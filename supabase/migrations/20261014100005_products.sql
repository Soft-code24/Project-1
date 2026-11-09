-- ============================================================================
-- products — the food catalogue (PRD §4.1 / §4.2)
-- Prices are stored in naira; availability = is_active + stock.
-- Full-text + trigram indexes power the catalogue search (PRD §4.1).
-- ============================================================================

create table if not exists public.products (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,
  category_id        uuid references public.categories (id) on delete set null,
  price              numeric(12, 2) not null check (price >= 0),
  compare_at_price   numeric(12, 2) check (compare_at_price is null or compare_at_price >= price),
  stock              integer not null default 0 check (stock >= 0),
  short_description  text not null default '',
  description        text not null default '',
  image_url          text,
  serving            text,
  prep_time          text,
  tags               text[] not null default '{}',
  rating             numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  reviews_count      integer not null default 0 check (reviews_count >= 0),
  is_featured        boolean not null default false,
  is_active          boolean not null default true,
  search_vector      tsvector generated always as (
                       to_tsvector(
                         'simple'::regconfig,
                         coalesce(name, '') || ' ' ||
                         coalesce(short_description, '') || ' ' ||
                         coalesce(description, '')
                       )
                     ) stored,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_is_active_idx on public.products (is_active);
create index if not exists products_is_featured_idx on public.products (is_featured);
create index if not exists products_tags_idx on public.products using gin (tags);
create index if not exists products_search_vector_idx on public.products using gin (search_vector);
create index if not exists products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);
create index if not exists products_price_idx on public.products (price);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();
