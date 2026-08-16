update public.site_settings
set email = '35slit.light@gmail.com', updated_at = now()
where id = 1;

insert into public.homepage_sections
  (section_key, title, content, image_url, cta_text, cta_url, sort_order, enabled)
values
  ('hero', E'有專業、有內容，\n為什麼觀眾看完\n還是不知道要找你？', '隙光透過訪談、內容診斷與企劃，幫你把說不清楚的專業，整理成觀眾聽得懂、記得住，也願意繼續靠近你的內容。', 'assets/images/hero-main.jpg', '聊聊你的卡點', '#contact', 1, true),
  ('pain', E'你可能不是沒有內容，\n而是內容沒有接到下一步。', null, null, null, null, 2, true),
  ('approach', '不是先問下一支影片拍什麼。', '我們會先釐清：你真正想說的是什麼、觀眾現在卡在哪裡，以及內容在哪一步沒有接上。', null, null, null, 3, true),
  ('services', '先看看適合哪一種方式', '從一次釐清，到完整的內容系統，依照你現在的卡點開始。', null, null, null, 4, true),
  ('experience', E'不只提出想法，\n也理解內容如何真正被完成。', '從影像現場到內容整理，累積的是把模糊問題釐清，並轉成可執行方向的工作經驗。', 'assets/images/experience.jpg', null, null, 5, true),
  ('about', E'從廣告片場走到品牌內容，\n我現在更在意，觀眾最後記住了什麼。', '過去參與廣告、TVC、MV 與商業影像製作，也做過社群短影音企劃、拍攝與內容營運。', 'assets/images/about.jpg', null, null, 6, true)
on conflict (section_key) do nothing;

insert into public.pain_points (title, description, sort_order, enabled)
select title, description, sort_order, true
from (values
  ('影片有人看', '但私訊和詢問沒有增加。', 1),
  ('明明很有專業', '真正要做內容時卻不知道該講什麼。', 2),
  ('內容做了很多', '觀眾還是不知道你到底能幫他什麼。', 3),
  ('每一次發文、拍影片', '都像重新從零開始。', 4),
  ('流量增加了', '商業成果卻沒有跟著增加。', 5),
  ('拍攝、剪輯都有了', '卻少了「為什麼做」的策略。', 6)
) as seed(title, description, sort_order)
where not exists (select 1 from public.pain_points);

insert into public.methods (title, description, image_url, sort_order, enabled)
select title, description, image_url, sort_order, true
from (values
  ('核心挖掘', '從經驗、專業、客戶問題、過往內容與個人觀點中，找出真正具有差異性的內容核心。不是硬想一句漂亮的品牌標語。', 'assets/images/method-discovery.jpg', 1),
  ('卡點拆解', '沿著「看到內容 → 理解 → 信任 → 產生需求 → 詢問」逐步分析，確認目前中斷在哪一段。', 'assets/images/method-diagnosis.jpg', 2),
  ('內容轉譯', '把抽象的專業、經驗與品牌價值，轉成題目、IG 貼文、Reels、系列內容、腳本與 CTA，讓策略真正能被執行。', 'assets/images/method-translation.jpg', 3)
) as seed(title, description, image_url, sort_order)
where not exists (select 1 from public.methods);

insert into public.cases
  (title, slug, cover_image, client_name, client_type, problem, insight, strategy, execution, result, publish_status, sort_order)
values
  (
    '隙光品牌定位與內容轉換示範',
    'slit-light-self-demo',
    'assets/images/case-placeholder.jpg',
    '隙光 slit.light',
    '自有品牌示範',
    '有影像製作經驗與畫面質感，但品牌到底能幫誰、提供什麼服務，以及觀眾看完後如何進入合作，還不夠清楚。',
    '真正的卡點不是缺少影像作品，而是經驗、服務與受眾問題之間沒有形成一條容易理解的路徑。',
    '聚焦「有專業卻說不清楚」與「有流量卻沒有詢問」兩類問題，建立內容診斷、IP 核心企劃、內容轉換企劃三層服務。',
    '重整首頁訊息層級、服務方案、流程、FAQ、詢問表單、隱私與合作說明，並建立可由後台更新的內容結構。',
    '完成一套可公開驗證的品牌網站與詢問流程。這是方法示範，尚未宣稱客戶營收、轉換率或見證成果。',
    'published',
    1
  )
on conflict (slug) do nothing;
