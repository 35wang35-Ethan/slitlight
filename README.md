# 隙光（slit.light）

「慢看 SLOW TAKE」的影像／創意品牌入口。前台部署於 GitHub Pages；舊版服務資料與管理後台仍保留於 Supabase，但不再作為首頁內容。

## 網址

- 前台：https://35wang35-ethan.github.io/slitlight/
- 後台：https://35wang35-ethan.github.io/slitlight/admin/login.html
- GitHub：https://github.com/35wang35-Ethan/slitlight

## 在另一台電腦開始修改

先安裝 Git 與 Visual Studio Code，再於終端機執行。若要在本機執行網站驗證，另需安裝 Python 3；沒有 Python 仍可修改網站，推送後 GitHub Actions 會執行正式驗證。

完整流程請見 [`EDITING.md`](EDITING.md)。

```powershell
git clone https://github.com/35wang35-Ethan/slitlight.git
cd slitlight
code .
```

每次開始修改前，先取得最新正式版本：

```powershell
git switch main
git pull --ff-only origin main
```

建議每次修改建立獨立分支，完成後推送到 GitHub 並合併 Pull Request：

```powershell
git switch -c update/修改內容
python .\scripts\validate_site.py
git add .
git commit -m "說明這次修改"
git push -u origin update/修改內容
```

請勿把 Supabase、Cloudflare 或 Resend 的 Secret／API Key 寫入原始碼。這些敏感設定只保存在各服務後台。

## 專案結構

- `index.html`：品牌首頁與搜尋／社群分享資訊
- `takes/index.html`：Selected Takes Archive 與分類篩選
- `assets/data/takes.json`：CHOICE、SECOND LOOK、FRAME 共用內容資料
- `privacy.html`、`terms.html`：個資告知與合作／取消說明
- `assets/css`、`assets/js`：前台與後台樣式、互動
- `assets/vendor/bootstrap`：前台實際使用的 Bootstrap 5 結構與元件模組
- `assets/brand-symbol.svg`：Header 與 Footer 使用的正式品牌 Symbol
- `assets/images`：最新版圖片原稿、正式輸出與必要的歷史資料相容檔；清單見 `assets/images/README.md`
- `admin`：使用 Supabase 驗證的內容管理後台
- `supabase/migrations`：資料表、RLS 與 API 權限版本紀錄
- `supabase/functions/submit-inquiry`：Turnstile 驗證、寫入詢問與 Resend 通知
- `scripts/optimize-images.ps1`：從 PNG 原稿產生壓縮 JPG 與 768px 手機版
- `scripts/validate_site.py`：部署前檢查本機資源與必要中繼資料

## 目前正式設定

- 對外聯絡信箱與詢問通知：`35slit.light@gmail.com`
- 正式品牌：「隙光 slit.light」；內容母題：「慢看 SLOW TAKE」
- 公開職稱：「影像內容企劃・創意觀察」
- 舊 Services 與價格保留於 Supabase，首頁不顯示
- Google Analytics：`G-JG1RP94Q9J`
- Google Ads：`AW-18389054487`
- 網站會直接載入上述 Google tag，不顯示分析同意視窗
- Cloudflare Turnstile：已啟用，用於阻擋表單機器人
- Supabase `submit-inquiry`：已部署，匿名使用者不能繞過安全表單直接新增詢問
- Resend：已啟用，詢問通知寄至 `35slit.light@gmail.com`
- Facebook：目前連到隙光的 Facebook

網站不保存上述服務的 Secret／API Key。若換電腦，只需從 GitHub 下載原始碼；若要重新部署後端函式或調整服務設定，需登入原本的 Supabase、Cloudflare 與 Resend 帳戶。

## 尚待確認

- [ ] 更換「關於隙光」目前的人物示意照。建議使用本人工作照，或沒有可辨識人物的工作空間／拍攝現場照片，並確認圖片使用權與替代文字。

## 更新圖片

替換 `assets/images` 中的 PNG 原稿後，可用既有腳本產生 JPG；正式首頁也應同步準備 WebP：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\optimize-images.ps1
```

這會重新產生 JPG 與 768px 手機版；WebP 可使用 Google 官方 `cwebp` 產生。GitHub Pages 只部署目前頁面使用的 JPG／WebP，不會部署 PNG 原稿或歷史相容檔。

## 新增 Take

在 `assets/data/takes.json` 新增一筆資料即可同時更新首頁 Selected Takes 與 Archive。必填欄位為 `title`、`slug`、`category`、`excerpt`、`cover_image`、`date`、`external_url`、`film_title`、`film_year`、`featured`、`published`；`category` 只能是 `choice`、`second-look` 或 `frame`。

## 驗證與部署

本機驗證：

```powershell
python .\scripts\validate_site.py
```

Pull Request 合併到 `main` 後，GitHub Actions 會建立乾淨的公開目錄、再次執行驗證，再部署至 GitHub Pages。後台原始碼、Supabase 檔案與 PNG 原稿不會被放進公開網站。

新增 Supabase migration 後，仍需在 Supabase 專案中套用，資料庫變更才會生效。目前 `001` 至 `006` 的正式設定均已套用。

## 網站分析

原有 Google Analytics 與 Google Ads 代碼會在所有公開頁面載入；網站不顯示「允許匿名網站分析」提示。資料處理方式記載於隱私權頁面。
