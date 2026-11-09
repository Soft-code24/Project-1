-- ============================================================================
-- payments — payment transaction audit (PRD §4.1, §9)
-- Every Paystack / Flutterwave attempt is recorded so orders can only be
-- marked paid after a server-side verification (PRD §11).
-- Rows are written by the backend with the service-role key only.
-- ============================================================================

create table if not exists public.payments (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders (id) on delete cascade,
  provider           text not null check (provider in ('paystack', 'flutterwave')),
  reference          text not null unique,
  status             text not null default 'initialized'
                     check (status in ('initialized', 'pending', 'success', 'failed', 'abandoned')),
  amount             numeric(12, 2) not null check (amount >= 0),
  currency           text not null default 'NGN',
  channel            text,
  provider_response  jsonb not null default '{}'::jsonb,
  verified_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_status_idx on public.payments (status);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- Keep orders.payment_status in sync with the payments ledger
create or replace function public.sync_order_payment_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'success' then
    -- A verified payment moves the order from 'pending' to 'paid'
    update public.orders
    set payment_status = 'paid',
        status = case when status = 'pending' then 'paid' else status end,
        paid_at = coalesce(new.verified_at, now())
    where id = new.order_id
      and payment_status <> 'paid';
  elsif new.status in ('failed', 'abandoned') then
    update public.orders
    set payment_status = 'failed'
    where id = new.order_id
      and payment_status = 'unpaid';
  end if;
  return new;
end;
$$;

drop trigger if exists payments_sync_order_status on public.payments;
create trigger payments_sync_order_status
  after insert or update of status on public.payments
  for each row execute function public.sync_order_payment_status();
