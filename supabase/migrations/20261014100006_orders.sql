-- ============================================================================
-- orders — checkout, delivery details, order history (PRD §4.1 / §4.2)
-- order_items — line items with denormalized name/price so historical
--              orders survive catalogue edits
-- order_status_history — audit trail of admin status updates (PRD §4.2)
-- ============================================================================

create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique default public.generate_order_number(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  status             text not null default 'pending'
                     check (status in ('pending', 'paid', 'preparing',
                                       'out-for-delivery', 'delivered', 'cancelled')),
  subtotal           numeric(12, 2) not null check (subtotal >= 0),
  discount           numeric(12, 2) not null default 0 check (discount >= 0),
  delivery_fee       numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  total              numeric(12, 2) not null check (total >= 0),
  promo_code         text,
  payment_method     text not null default 'cod'
                     check (payment_method in ('paystack-card', 'paystack-transfer',
                                               'flutterwave', 'cod')),
  payment_status     text not null default 'unpaid'
                     check (payment_status in ('unpaid', 'paid', 'refunded', 'failed')),
  paid_at            timestamptz,
  contact            jsonb not null default '{}'::jsonb,
  delivery           jsonb not null default '{}'::jsonb,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  product_name  text not null,
  unit_price    numeric(12, 2) not null check (unit_price >= 0),
  quantity      integer not null check (quantity > 0),
  line_total    numeric(12, 2) not null check (line_total >= 0),
  created_at    timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

create table if not exists public.order_status_history (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  from_status  text,
  to_status    text not null,
  changed_by   uuid references auth.users (id) on delete set null,
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists order_status_history_order_id_idx on public.order_status_history (order_id);

-- Records every status transition for the admin audit trail
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (old.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists orders_log_status_change on public.orders;
create trigger orders_log_status_change
  after update on public.orders
  for each row execute function public.log_order_status_change();

-- Cancelling an order returns its stock to the catalogue (PRD §4.2)
create or replace function public.restore_stock_on_order_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    for item in
      select product_id, quantity from public.order_items where order_id = new.id
    loop
      update public.products
      set stock = stock + item.quantity
      where id = item.product_id;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_restore_stock_on_cancel on public.orders;
create trigger orders_restore_stock_on_cancel
  after update on public.orders
  for each row execute function public.restore_stock_on_order_cancel();
