grant usage on schema public to anon, authenticated;
grant select on public.site_settings, public.homepage_sections, public.pain_points, public.methods, public.services, public.cases, public.faqs to anon, authenticated;
grant insert on public.inquiries to anon, authenticated;
grant select, insert, update, delete on public.site_settings, public.homepage_sections, public.pain_points, public.methods, public.services, public.cases, public.faqs to authenticated;
grant select, update, delete on public.inquiries to authenticated;
grant select on public.admins to authenticated;
grant usage, select on all sequences in schema public to authenticated;
