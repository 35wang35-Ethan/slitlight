-- Additive Case Sprint Pre-brief fields. Preserve all existing inquiry data and constraints.
alter table public.inquiries
  add column if not exists website_or_social text,
  add column if not exists case_summary text,
  add column if not exists problem text,
  add column if not exists contact text,
  add column if not exists privacy_consent boolean,
  add column if not exists consented_at timestamptz;
