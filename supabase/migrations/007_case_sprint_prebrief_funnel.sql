-- Incremental Case Sprint Pre-brief fields. Preserve all legacy inquiry records and columns.
alter table public.inquiries
  add column if not exists website_or_social text,
  add column if not exists case_summary text,
  add column if not exists problem text,
  add column if not exists contact text,
  add column if not exists privacy_consent boolean not null default false,
  add column if not exists consented_at timestamptz,
  add column if not exists quoted_amount numeric(12,2),
  add column if not exists payment_status text not null default 'not_requested',
  add column if not exists payment_method text,
  add column if not exists payment_reference text,
  add column if not exists payment_requested_at timestamptz,
  add column if not exists paid_at timestamptz;

update public.inquiries
set
  website_or_social = coalesce(website_or_social, website, instagram, social_contact),
  case_summary = coalesce(case_summary, problem_description),
  problem = coalesce(problem, problem_type),
  contact = coalesce(contact, social_contact)
where website_or_social is null
   or case_summary is null
   or problem is null
   or contact is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inquiries_brand_length_check') then
    alter table public.inquiries add constraint inquiries_brand_length_check
      check (brand is null or char_length(brand) <= 150);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inquiries_website_or_social_length_check') then
    alter table public.inquiries add constraint inquiries_website_or_social_length_check
      check (website_or_social is null or char_length(website_or_social) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inquiries_case_summary_length_check') then
    alter table public.inquiries add constraint inquiries_case_summary_length_check
      check (case_summary is null or char_length(case_summary) <= 3000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inquiries_problem_length_check') then
    alter table public.inquiries add constraint inquiries_problem_length_check
      check (problem is null or char_length(problem) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inquiries_contact_length_check') then
    alter table public.inquiries add constraint inquiries_contact_length_check
      check (contact is null or char_length(contact) <= 300);
  end if;
end $$;

do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname from pg_constraint
    where conrelid = 'public.inquiries'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.inquiries drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.inquiries
  add constraint inquiries_status_check
  check (status in ('new','qualified','payment_pending','paid','scheduled','completed','not_fit','contacted','discovery','quoted','active','declined')),
  add constraint inquiries_payment_status_check
  check (payment_status in ('not_requested','pending','paid','failed','refunded')),
  add constraint inquiries_quoted_amount_check
  check (quoted_amount is null or quoted_amount >= 0);

comment on column public.inquiries.website_or_social is 'Optional website, Instagram, or social profile supplied in Case Sprint Pre-brief.';
comment on column public.inquiries.case_summary is 'Short real-case summary supplied in Case Sprint Pre-brief.';
comment on column public.inquiries.problem is 'Selected primary content problem.';
comment on column public.inquiries.contact is 'Optional alternate contact such as LINE or Instagram.';
comment on column public.inquiries.privacy_consent is 'Whether the sender consented to use of the submitted data for this inquiry.';
comment on column public.inquiries.payment_status is 'Manual Beta payment state; no payment API or webhook is connected.';
