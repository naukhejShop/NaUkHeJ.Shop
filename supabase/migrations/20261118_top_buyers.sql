-- Top Buyers leaderboard for NAUKHEJ SHOP.
-- Shows display names only; no email, phone, or user ID is exposed.
create or replace function public.get_top_buyers()
returns table (
  buyer_name text,
  purchase_count bigint,
  total_spent numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(trim(o.customer_name), ''), 'Customer') as buyer_name,
    count(*)::bigint as purchase_count,
    coalesce(sum(o.total_amount), 0)::numeric as total_spent
  from public.orders o
  where o.user_id is not null
  group by o.user_id, coalesce(nullif(trim(o.customer_name), ''), 'Customer')
  order by count(*) desc, sum(o.total_amount) desc
  limit 10;
$$;

revoke all on function public.get_top_buyers() from public;
grant execute on function public.get_top_buyers() to anon, authenticated;

-- Safety check: purchases must only take keys that are not sold.
-- The existing purchase_shop_key RPC uses row locking and marks the chosen
-- inventory_keys row is_sold = true in the same transaction. Keep that update.
