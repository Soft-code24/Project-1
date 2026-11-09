-- ============================================================================
-- SavorBite — Supabase migrations (PRD: Food Selling & Marketing Website)
-- Stack: Supabase PostgreSQL · Auth · Storage (guide.md)
-- Run order is the timestamp prefix. Apply with the Supabase CLI:
--   supabase db push            (linked project)
--   supabase db reset           (local stack, applies all + seed)
-- or paste each file in order into the Supabase SQL editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
--   pgcrypto — gen_random_uuid() primary keys
--   pg_trgm  — fast fuzzy search for the food catalogue (PRD §4.1)
-- On Supabase these live in the `extensions` schema; the fallback keeps the
-- files portable for plain local Postgres.
-- ----------------------------------------------------------------------------
do $$
begin
  create schema if not exists extensions;
exception
  when duplicate_schema then null;
end
$$;

do $$
begin
  create extension if not exists pgcrypto with schema extensions;
exception when others then
  create extension if not exists pgcrypto;
end
$$;

do $$
begin
  create extension if not exists pg_trgm with schema extensions;
exception when others then
  create extension if not exists pg_trgm;
end
$$;
