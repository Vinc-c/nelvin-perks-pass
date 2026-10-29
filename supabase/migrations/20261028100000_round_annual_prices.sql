-- Clean annual prices (no odd figures like $91 / $1315): roughly two months free.
update public.plans set price_annual = case code
  when 'PASS_BASIC' then 90
  when 'PASS_PREMIUM' then 190
  when 'PASS_VIP' then 390
  when 'STARTER' then 800
  when 'GROWTH' then 1300
  when 'ENTERPRISE' then 1900
  when 'MERCHANT_BASIC' then 290
  when 'MERCHANT_PRO' then 490
  else price_annual end
where code in ('PASS_BASIC','PASS_PREMIUM','PASS_VIP','STARTER','GROWTH','ENTERPRISE','MERCHANT_BASIC','MERCHANT_PRO');
