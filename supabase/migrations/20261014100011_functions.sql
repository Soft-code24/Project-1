-- ============================================================================
-- Stock operations — atomic reservations used by the order flow
-- (PRD §4.2: update availability/stock, §9: validate stock server-side)
-- ============================================================================

-- Reserves stock when an order is placed; never drops below zero
create or replace function public.decrement_product_stock(p_id uuid, p_qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set stock = greatest(stock - p_qty, 0)
  where id = p_id;

  if not found then
    raise exception 'Product % not found', p_id;
  end if;
end;
$$;

-- Returns stock when an admin cancels an order
create or replace function public.restore_product_stock(p_id uuid, p_qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set stock = stock + p_qty
  where id = p_id;

  if not found then
    raise exception 'Product % not found', p_id;
  end if;
end;
$$;

-- Server-side order total recomputation from line items
-- (defence in depth — the API also recalculates before inserting an order)
create or replace function public.recalculate_order_totals(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subtotal numeric(12, 2);
  v_total    numeric(12, 2);
  v_order    public.orders;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  select coalesce(sum(line_total), 0) into v_subtotal
  from public.order_items
  where order_id = p_order_id;

  v_total := v_subtotal + v_order.delivery_fee - v_order.discount;

  update public.orders
  set subtotal = v_subtotal,
      total = greatest(v_total, 0)
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

grant execute on function public.decrement_product_stock(uuid, integer) to authenticated, service_role;
grant execute on function public.restore_product_stock(uuid, integer) to authenticated, service_role;
grant execute on function public.recalculate_order_totals(uuid) to service_role;
