-- Admin-only deposit queue for the NAUKHEJ SHOP dashboard.
create or replace function public.admin_get_deposits()
returns table (
  id bigint,
  user_id uuid,
  amount_paise bigint,
  utr_number text,
  payment_status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.admin_users
    where id = auth.uid()
      and lower(email) = 'alamnaukhej305@gmail.com'
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  select d.id, d.user_id, d.amount_paise, d.utr_number,
         d.payment_status::text, d.created_at
  from public.deposit_requests d
  order by d.created_at desc;
end;
$$;

revoke all on function public.admin_get_deposits() from public;
grant execute on function public.admin_get_deposits() to authenticated;
