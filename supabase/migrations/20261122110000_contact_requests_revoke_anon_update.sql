revoke execute on function public.staff_update_contact_request(uuid, text, text) from anon, public;
grant execute on function public.staff_update_contact_request(uuid, text, text) to authenticated;
