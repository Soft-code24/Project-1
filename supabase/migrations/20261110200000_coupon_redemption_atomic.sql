-- ============================================================================
-- Phase 2G-C2B: Atomic order + coupon redemption
-- Additive migration: no existing tables modified, no existing data changed.
-- NOT EXECUTED against production — preparation only.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- coupon_redemptions: redemption lifecycle status
--   pending  — redemption recorded, order created but not yet paid/confirmed
--   consumed — order paid/confirmed; coupon discount finalized (terminal)
--   voided   — order cancelled / payment failed; coupon returned to pool
-- ----------------------------------------------------------------------------
alter table public.coupon_redemptions
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'consumed', 'voided'));

create index if not exists coupon_redemptions_status_idx
  on public.coupon_redemptions (status);

-- ----------------------------------------------------------------------------
-- orders: idempotency key scoped to customer, with payload hash
-- ----------------------------------------------------------------------------
alter table public.orders
  add column if not exists idempotency_key text;

alter table public.orders
  add column if not exists idempotency_hash text;

create unique index if not exists orders_idempotency_key_unique_idx
  on public.orders (user_id, idempotency_key)
  where idempotency_key is not null;

-- ----------------------------------------------------------------------------
-- orders: add payment_reference column
-- ----------------------------------------------------------------------------
alter table public.orders
  add column if not exists payment_reference text;

-- ----------------------------------------------------------------------------
-- RPC: create_order_with_coupon — single transaction, all-or-nothing
-- ----------------------------------------------------------------------------
create or replace function public.create_order_with_coupon(
  p_user_id uuid,
  p_contact jsonb,
  p_delivery jsonb,
  p_notes text default null,
  p_payment_method text default 'cod',
  p_promo_code text default null,
  p_idempotency_key text default null,
  p_idempotency_hash text default null,
  p_items jsonb default '[]'::jsonb
) returns public.orders
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  -- Order computation
  v_subtotal numeric(12, 2) := 0;
  v_discount numeric(12, 2) := 0;
  v_delivery_fee_val numeric(12, 2) := 0;
  v_total numeric(12, 2) := 0;
  v_order public.orders;

  -- Coupon
  v_coupon public.coupons;
  v_redemption_id uuid;
  v_coupon_used boolean := false;

  -- Counters (separate variables, never reused across purposes)
  v_cart_item_count integer;
  v_used_count integer;

  -- Idempotency
  v_existing_order uuid;
  v_existing_hash text;

  -- Customer validation
  v_account_status text;

  -- Product locking and validation (aggregated)
  v_product_ids uuid[];
  v_agg_items jsonb;
  v_agg_len integer;
  v_qty integer;
  i integer;
  v_product_id uuid;
  v_product_name text;
  v_product_price numeric(12,2);
  v_product_stock integer;
  v_product_is_active boolean;

  -- Business settings (single row)
  v_delivery_fee_setting numeric(12,2);
  v_free_delivery_threshold numeric(12,2);

  -- Discount kobo arithmetic
  v_discount_kobo numeric(15,0);
begin
  -- 1. Require nonempty idempotency key and hash
  if p_idempotency_key is null or trim(p_idempotency_key) = '' then
    raise exception 'Idempotency key is required';
  end if;
  if p_idempotency_hash is null or trim(p_idempotency_hash) = '' then
    raise exception 'Idempotency hash is required';
  end if;

  -- 2. Serialize concurrent same-key submissions via advisory lock
  --    Cast UUID to text before trimming for stable, comparable identity
  perform pg_advisory_xact_lock(
    hashtext(trim(p_user_id::text) || ':' || trim(p_idempotency_key))
  );

  -- 3. Check existing order for this customer + key
  select id, idempotency_hash into v_existing_order, v_existing_hash
  from public.orders
  where user_id = p_user_id
    and idempotency_key = trim(p_idempotency_key)
  limit 1;

  if v_existing_order is not null then
    if v_existing_hash is distinct from trim(p_idempotency_hash) then
      raise exception 'Idempotency key reused with different request payload';
    end if;
    select * into v_order from public.orders where id = v_existing_order;
    return v_order;
  end if;

  -- 4. Validate customer
  select account_status into v_account_status
  from public.profiles
  where id = p_user_id and role = 'customer';

  if not found then
    raise exception 'Customer not found';
  end if;
  if v_account_status = 'suspended' then
    raise exception 'Account is suspended';
  end if;

  -- 5. Validate payment method
  if p_payment_method not in ('cod', 'paystack-card', 'paystack-transfer', 'flutterwave') then
    raise exception 'Unsupported payment method';
  end if;

  -- 6. Validate each item quantity is a positive integer
  v_cart_item_count := jsonb_array_length(p_items);
  if v_cart_item_count = 0 then
    raise exception 'Cart is empty';
  end if;
  if v_cart_item_count > 30 then
    raise exception 'Cart exceeds maximum of 30 items';
  end if;

  for i in 0 .. v_cart_item_count - 1 loop
    v_qty := (p_items->i->>'quantity')::integer;
    if v_qty is null or v_qty < 1 then
      raise exception 'Quantity must be a positive integer';
    end if;
  end loop;

  -- 7. Aggregate duplicate product IDs: sum quantities per product, sorted
  v_agg_items := (
    select jsonb_agg(
      jsonb_build_object('product_id', product_id, 'quantity', total_qty)
      order by product_id
    )
    from (
      select (elem->>'product_id')::uuid as product_id,
             sum((elem->>'quantity')::integer) as total_qty
      from jsonb_array_elements(p_items) as elem
      group by (elem->>'product_id')::uuid
      having sum((elem->>'quantity')::integer) > 0
    ) sub
  );
  v_agg_len := jsonb_array_length(v_agg_items);
  if v_agg_len = 0 then
    raise exception 'Cart is empty';
  end if;

  -- 8. Collect sorted product IDs for deterministic lock order
  select array_agg(product_id order by product_id)
  into v_product_ids
  from (
    select distinct (elem->>'product_id')::uuid as product_id
    from jsonb_array_elements(p_items) as elem
  ) sub;

  -- 9. Lock all products in deterministic order (ORDER BY id + FOR UPDATE)
  for i in 0 .. v_agg_len - 1 loop
    v_product_id := (v_agg_items->i->>'product_id')::uuid;
    v_qty := (v_agg_items->i->>'quantity')::integer;

    select p.name, p.price, p.stock, p.is_active
    into v_product_name, v_product_price, v_product_stock, v_product_is_active
    from public.products p
    where p.id = v_product_id
    order by p.id
    for update;

    if not found then
      raise exception 'Product not found';
    end if;
    if not v_product_is_active then
      raise exception 'Product % is not available', v_product_name;
    end if;
    if v_product_stock < v_qty then
      raise exception 'Product % only has % left in stock', v_product_name, v_product_stock;
    end if;

    v_subtotal := v_subtotal + (v_product_price * v_qty);
  end loop;

  -- 10. Delivery fee from business_settings (single row; fail if missing)
  select delivery_fee, free_delivery_threshold
  into v_delivery_fee_setting, v_free_delivery_threshold
  from public.business_settings
  where id = '00000000-0000-0000-0000-000000000001'::uuid;

  if not found then
    raise exception 'Business settings not configured';
  end if;

  if v_subtotal = 0 or v_subtotal >= v_free_delivery_threshold then
    v_delivery_fee_val := 0;
  else
    v_delivery_fee_val := v_delivery_fee_setting;
  end if;

  -- 11. Coupon validation (server-authoritative)
  if p_promo_code is not null and trim(p_promo_code) <> '' then
    select * into v_coupon
    from public.coupons
    where code = trim(p_promo_code)::extensions.citext
    for update;

    if not found then
      raise exception 'Invalid coupon code';
    end if;
    v_coupon_used := true;

    if not v_coupon.is_active then
      raise exception 'Coupon is no longer active';
    end if;
    if v_coupon.starts_at > now() then
      raise exception 'Coupon is not yet valid';
    end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
      raise exception 'Coupon has expired';
    end if;
    if v_coupon.min_order_amount is not null and v_subtotal < v_coupon.min_order_amount then
      raise exception 'Minimum order of % required for this coupon', v_coupon.min_order_amount;
    end if;

    -- Total usage limit: pending + consumed count toward limit
    if v_coupon.usage_limit is not null then
      select count(*) into v_used_count
      from public.coupon_redemptions
      where coupon_id = v_coupon.id
        and status in ('pending', 'consumed');
      if v_used_count >= v_coupon.usage_limit then
        raise exception 'Coupon has reached its total usage limit';
      end if;
    end if;

    -- Per-customer limit: pending + consumed count toward limit
    if v_coupon.per_customer_limit is not null then
      select count(*) into v_used_count
      from public.coupon_redemptions
      where coupon_id = v_coupon.id
        and customer_id = p_user_id
        and status in ('pending', 'consumed');
      if v_used_count >= v_coupon.per_customer_limit then
        raise exception 'You have reached the usage limit for this coupon';
      end if;
    end if;

    -- First-order-only: serialized via coupon FOR UPDATE lock + customer advisory lock above
    if v_coupon.first_order_only then
      select count(*) into v_used_count
      from public.orders
      where user_id = p_user_id;
      if v_used_count > 0 then
        raise exception 'Coupon is for first-time customers only';
      end if;
    end if;

    -- Discount calculation using integer-kobo arithmetic
    if v_coupon.type = 'percentage' then
      v_discount_kobo := round(v_subtotal * 100 * v_coupon.discount_value / 100);
      v_discount := v_discount_kobo / 100;
    elsif v_coupon.type = 'fixed_amount' then
      v_discount_kobo := round(v_coupon.discount_value * 100);
      v_discount := v_discount_kobo / 100;
    else
      v_discount := 0;
    end if;

    if v_coupon.max_discount is not null then
      v_discount := least(v_discount, v_coupon.max_discount);
    end if;
    v_discount := greatest(least(v_discount, v_subtotal), 0);
  end if;

  -- 12. Compute total
  v_total := greatest(v_subtotal + v_delivery_fee_val - v_discount, 0);

  -- 13. Create order
  insert into public.orders (
    user_id, status, subtotal, discount, delivery_fee, total,
    payment_method, contact, delivery, notes, promo_code,
    idempotency_key, idempotency_hash
  ) values (
    p_user_id, 'pending', v_subtotal, v_discount, v_delivery_fee_val, v_total,
    p_payment_method, p_contact, p_delivery, p_notes, p_promo_code,
    trim(p_idempotency_key), trim(p_idempotency_hash)
  ) returning * into v_order;

  -- 14. Create order items from DB-validated data only
  for i in 0 .. v_agg_len - 1 loop
    v_product_id := (v_agg_items->i->>'product_id')::uuid;
    v_qty := (v_agg_items->i->>'quantity')::integer;

    select p.name, p.price
    into v_product_name, v_product_price
    from public.products p
    where p.id = v_product_id;

    insert into public.order_items (
      order_id, product_id, product_name, unit_price, quantity, line_total
    ) values (
      v_order.id, v_product_id, v_product_name, v_product_price, v_qty,
      v_product_price * v_qty
    );
  end loop;

  -- 15. Reserve stock (products already locked under FOR UPDATE)
  for i in 0 .. v_agg_len - 1 loop
    v_product_id := (v_agg_items->i->>'product_id')::uuid;
    v_qty := (v_agg_items->i->>'quantity')::integer;
    perform public.decrement_product_stock(v_product_id, v_qty);
  end loop;

  -- 16. Record coupon redemption as pending (usage_count NOT incremented yet;
  --     pending reservations count toward limits but do not increment usage_count)
  if v_coupon_used then
    insert into public.coupon_redemptions (
      coupon_id, customer_id, order_id, discount, status
    ) values (
      v_coupon.id, p_user_id, v_order.id, v_discount, 'pending'
    ) returning id into v_redemption_id;
  end if;

  return v_order;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: transition_coupon_redemption — pending → consumed / voided
-- Idempotent: repeating the same transition is a no-op.
--   pending -> consumed: increment usage_count exactly once (completed usage)
--   pending -> voided:   do NOT touch usage_count (pending never incremented it)
--   consumed -> consumed / voided -> voided: no-op
-- ----------------------------------------------------------------------------
create or replace function public.transition_coupon_redemption(
  p_redemption_id uuid,
  p_new_status text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status text;
  v_coupon_id uuid;
begin
  select status, coupon_id into v_old_status, v_coupon_id
  from public.coupon_redemptions
  where id = p_redemption_id
  for update;

  if not found then
    raise exception 'Redemption not found';
  end if;

  -- Idempotent: same status is a no-op
  if v_old_status = p_new_status then
    return;
  end if;

  -- Validate transition: only pending -> consumed or pending -> voided
  if p_new_status = 'consumed' then
    if v_old_status <> 'pending' then
      raise exception 'Cannot transition from % to consumed', v_old_status;
    end if;
    -- Consume: increment completed usage exactly once
    update public.coupons
    set usage_count = usage_count + 1
    where id = v_coupon_id;
  elsif p_new_status = 'voided' then
    if v_old_status <> 'pending' then
      raise exception 'Cannot transition from % to voided', v_old_status;
    end if;
    -- Void: do NOT decrement usage_count (pending never incremented it)
  else
    raise exception 'Invalid target status: %', p_new_status;
  end if;

  update public.coupon_redemptions
  set status = p_new_status
  where id = p_redemption_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: confirm_order_payment — atomically mark order paid + consume coupon
-- Called after provider payment verification succeeds.
--   1. Verify order exists and is not already paid
--   2. Transition coupon redemption pending -> consumed (idempotent)
--   3. Mark order status = 'paid', set payment_reference and paid_at
-- All changes succeed or fail together in one transaction.
-- ----------------------------------------------------------------------------
create or replace function public.confirm_order_payment(
  p_order_id uuid,
  p_reference text
) returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_redemption_id uuid;
  v_coupon_id uuid;
begin
  -- Lock the order row
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  -- Idempotent: already paid
  if v_order.status = 'paid' then
    return v_order;
  end if;

  -- Only pending orders can be paid
  if v_order.status <> 'pending' then
    raise exception 'Order is not in pending status';
  end if;

  -- Transition coupon redemption from pending -> consumed (idempotent)
  select id, coupon_id into v_redemption_id, v_coupon_id
  from public.coupon_redemptions
  where order_id = p_order_id
    and status = 'pending'
  for update;

  if found then
    -- transition_coupon_redemption handles the idempotency check
    perform public.transition_coupon_redemption(v_redemption_id, 'consumed');
  end if;

  -- Mark order as paid
  update public.orders
  set status = 'paid',
      payment_reference = p_reference,
      paid_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: cancel_order_atomic — atomically cancel order + void coupon + restore stock
-- Called when customer cancels a pending order.
--   1. Verify order exists, is pending, and belongs to the customer
--   2. Transition coupon redemption pending -> voided (idempotent)
--   3. Mark order status = 'cancelled' (trigger restores stock exactly once)
-- All changes succeed or fail together in one transaction.
-- ----------------------------------------------------------------------------
create or replace function public.cancel_order_atomic(
  p_order_id uuid,
  p_user_id uuid
) returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_redemption_id uuid;
begin
  -- Lock the order row
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  -- Verify ownership
  if v_order.user_id <> p_user_id then
    raise exception 'Order does not belong to this customer';
  end if;

  -- Only pending orders can be cancelled
  if v_order.status <> 'pending' then
    raise exception 'Order is not in pending status';
  end if;

  -- Transition coupon redemption from pending -> voided (idempotent)
  select id into v_redemption_id
  from public.coupon_redemptions
  where order_id = p_order_id
    and status = 'pending'
  for update;

  if found then
    perform public.transition_coupon_redemption(v_redemption_id, 'voided');
  end if;

  -- Mark order as cancelled (trigger restores stock exactly once)
  update public.orders
  set status = 'cancelled',
      payment_status = 'failed'
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- ----------------------------------------------------------------------------
-- Privileges: revoke from all, grant only to service_role (atomic)
-- ----------------------------------------------------------------------------
revoke all on function public.create_order_with_coupon(
  uuid, jsonb, jsonb, text, text, text, text, text, jsonb
) from public, anon, authenticated;

revoke all on function public.transition_coupon_redemption(
  uuid, text
) from public, anon, authenticated;

revoke all on function public.confirm_order_payment(
  uuid, text
) from public, anon, authenticated;

revoke all on function public.cancel_order_atomic(
  uuid, uuid
) from public, anon, authenticated;

grant execute on function public.create_order_with_coupon(
  uuid, jsonb, jsonb, text, text, text, text, text, jsonb
) to service_role;

grant execute on function public.transition_coupon_redemption(
  uuid, text
) to service_role;

grant execute on function public.confirm_order_payment(
  uuid, text
) to service_role;

grant execute on function public.cancel_order_atomic(
  uuid, uuid
) to service_role;
