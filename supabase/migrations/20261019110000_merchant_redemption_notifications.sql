-- Notify a partner in the app each time one of its codes is validated.
-- (WhatsApp / SMS delivery needs a messaging provider; this is the in-app
-- inbox every merchant account already has.)
create or replace function public.notify_merchant_redemption()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'REDEEMED' and old.status is distinct from 'REDEEMED' and new.merchant_id is not null then
    insert into public.notifications (user_id, type, title, body, link)
    select p.id, 'REDEMPTION', 'Code validé',
           coalesce('Remise accordée : ' || new.discount_applied::text || ' USD sur une addition de ' || new.bill_amount_usd::text || ' USD.',
                    'Un membre vient d''utiliser une de vos offres.'),
           '/merchant-dashboard'
      from public.profiles p
     where p.merchant_id = new.merchant_id;
  end if;
  return new;
end $$;

drop trigger if exists notify_merchant_redemption on public.redemptions;
create trigger notify_merchant_redemption after update on public.redemptions
  for each row execute function public.notify_merchant_redemption();
