-- ============================================================================
-- Generic helpers. is_admin()/current_app_role() live in the profiles
-- migration because they query the profiles table (SQL function bodies are
-- validated at creation time).
-- ============================================================================

-- Maintains updated_at on every table that has the column
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Human-friendly, unique order numbers: SB-10000, SB-10001, …
create sequence if not exists public.order_number_seq start with 10000;

create or replace function public.generate_order_number()
returns text
language sql
as $$
  select 'SB-' || nextval('public.order_number_seq');
$$;

grant usage on sequence public.order_number_seq to authenticated, service_role;
