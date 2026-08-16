-- Public inquiry submissions now go through the Turnstile-protected Edge Function.
-- Keep direct inserts available only to authenticated administrators.
revoke insert on table public.inquiries from anon;

revoke insert (
  name,
  email,
  social_contact,
  problem_type,
  problem_description,
  source,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term
) on public.inquiries from anon;

drop policy if exists "public creates inquiries" on public.inquiries;
drop policy if exists "admins create inquiries" on public.inquiries;

create policy "admins create inquiries"
on public.inquiries
for insert
to authenticated
with check (public.is_admin());
