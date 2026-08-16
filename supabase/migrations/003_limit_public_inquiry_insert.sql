-- Keep anonymous inquiry submissions limited to fields used by the public form.
-- Row level security still controls which rows may be inserted.
revoke insert on public.inquiries from anon, authenticated;

grant insert (
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
) on public.inquiries to anon, authenticated;
