update public.homepage_sections
set
  title = E'不只提出想法，\n也理解內容如何真正被完成。',
  content = '從影像現場到內容整理，累積的是把模糊問題釐清，並轉成可執行方向的工作經驗。',
  updated_at = now()
where section_key = 'experience';
