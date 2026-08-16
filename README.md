# 隙光（slit.light）

品牌內容策略與影像 IP 企劃的靜態網站。前台部署於 GitHub Pages，內容資料、管理後台與詢問表單使用 Supabase。

## 網址

- 前台：https://35wang35-ethan.github.io/slitlight/
- 後台：https://35wang35-ethan.github.io/slitlight/admin/login.html

## 專案結構

- `index.html`：前台頁面與搜尋／社群分享資訊
- `privacy.html`、`terms.html`：個資告知與合作／取消說明
- `assets/css`、`assets/js`：前台與後台樣式、互動
- `admin`：Supabase 驗證的內容管理後台
- `supabase/migrations`：資料表、RLS 與 API 權限
- `supabase/functions/submit-inquiry`：Turnstile 驗證、寫入詢問與 Resend 通知
- `scripts/optimize-images.ps1`：從 PNG 原稿產生壓縮 JPG 與 768px 手機版
- `scripts/validate_site.py`：部署前檢查本機資源與必要中繼資料

## 更新圖片

在 Windows PowerShell 執行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\optimize-images.ps1
```

## 部署

推送到 `main` 後，GitHub Actions 會建立乾淨的公開目錄、執行驗證，再部署至 GitHub Pages。舊版後台與 PNG 原稿不會被放進公開網站。

新增 Supabase migration 後，需在 Supabase 專案中套用，資料庫權限才會生效。`004_content_and_contact.sql` 會把公開 Email 更新為 `35slit.light@gmail.com`，並加入首頁 CMS 初始內容與「自有品牌示範」案例。

## 啟用安全表單與 Email 通知

目前 `assets/js/config.js` 保持 `secureInquiryEnabled: false`，讓尚未設定金鑰的正式網站仍能送出表單。完成以下步驟後再切換：

1. 在 Cloudflare Turnstile 建立 Widget，允許主機名稱 `35wang35-ethan.github.io`，取得 Site Key 與 Secret Key。
2. 以 `35slit.light@gmail.com` 註冊／登入 Resend 並建立 API Key。尚未購買網域時，可用 `onboarding@resend.dev` 寄到這個 Resend 帳號自己的 Gmail；要寄給其他收件人或寄客戶確認信，需先驗證自有網域。
3. 在 Supabase Edge Function Secrets 設定：

```text
TURNSTILE_SECRET_KEY=...
TURNSTILE_EXPECTED_HOSTNAME=35wang35-ethan.github.io
RESEND_API_KEY=...
INQUIRY_NOTIFICATION_EMAIL=35slit.light@gmail.com
RESEND_FROM=slit.light <onboarding@resend.dev>
```

4. 部署函式：

```powershell
supabase functions deploy submit-inquiry --no-verify-jwt
```

5. 將 `assets/js/config.js` 的 `turnstileSiteKey` 填入公開 Site Key，並把 `secureInquiryEnabled` 改為 `true`，部署並確認表單成功。
6. 確認安全表單上線後，在 Supabase SQL Editor 執行下列指令，關閉可繞過 Turnstile 的匿名資料庫直寫：

```sql
revoke insert on public.inquiries from anon, authenticated;
```

如果要暫時回復舊表單，可重新執行 `003_limit_public_inquiry_insert.sql` 的欄位級 `grant insert`，並將 `secureInquiryEnabled` 改回 `false`。

## 分析同意

Google Analytics 不再於頁面開啟時直接載入。訪客選擇「接受分析」後才會載入，選擇保存在瀏覽器的 `slit-consent-v1`；頁尾的「分析設定」可重新開啟選擇視窗。
