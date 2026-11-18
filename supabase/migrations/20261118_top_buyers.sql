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


-- Public catalog RPC: product_durations has no direct public SELECT policy,
-- so return active products and their active durations through a read-only
-- SECURITY DEFINER function instead of exposing the table.
create or replace function public.get_shop_products()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'description', p.description,
        'price', p.price,
        'category', p.category,
        'image_url', p.image_url,
        'video_url', p.video_url,
        'product_type', p.product_type,
        'stock', p.stock,
        'is_active', p.is_active,
        'durations', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', d.id,
              'product_id', d.product_id,
              'duration_name', d.duration_name,
              'duration_value', d.duration_value,
              'duration_unit', d.duration_unit,
              'price_paise', d.price_paise,
              'is_active', d.is_active
            ) order by d.duration_value
          )
          from public.product_durations d
          where d.product_id = p.id and d.is_active = true
        ), '[]'::jsonb)
      ) order by p.created_at desc
    ),
    '[]'::jsonb
  )
  from public.products p
  where p.is_active = true;
$$;

revoke all on function public.get_shop_products() from public;
grant execute on function public.get_shop_products() to anon, authenticated;
