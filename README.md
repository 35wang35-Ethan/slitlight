# 隙光 slit.light

以「慢看 SLOW TAKE」為核心的品牌內容網站。前台部署於 GitHub Pages，內容後台沿用原本的 Supabase 專案。

## 網址

- 前台：https://35wang35-ethan.github.io/slitlight/
- 內容後台：https://35wang35-ethan.github.io/slitlight/admin/
- GitHub：https://github.com/35wang35-Ethan/slitlight

## 在其他電腦使用

### 只修改網站內容

直接開啟內容後台，使用原本的管理員 Email／Password 登入即可，不需要下載程式或安裝 Git。

目前可管理：

- Selected Takes（3–5 筆、分類、排序、封面與連結）
- Hero、About、Collaborate 文字
- 圖片上傳
- 原有詢問資料與處理狀態

內容會儲存到 Supabase，重新整理公開網站後即可看到。瀏覽器會保存登入狀態；登出後清除。

### 修改版型或程式

新電腦安裝 Git、Visual Studio Code 與 Python 3，然後執行：

```powershell
git clone https://github.com/35wang35-Ethan/slitlight.git
cd slitlight
git switch main
git pull --ff-only origin main
code .
```

本機預覽：

```powershell
python -m http.server 4174
```

開啟 `http://127.0.0.1:4174/`。完整編輯流程見 [`EDITING.md`](EDITING.md)。

## 驗證與部署

修改程式後先執行：

```powershell
python .\scripts\validate_site.py
```

提交並推送至 `main` 後，GitHub Actions 會自動驗證並部署 GitHub Pages：

```powershell
git add .
git commit -m "說明這次修改"
git push origin main
```

`main` 是唯一正式版本；其他電腦開始工作前務必先執行 `git pull --ff-only origin main`。

## 內容與備援

- Supabase：管理員帳號、後台內容、圖片與詢問資料
- GitHub `main`：網站程式、正式圖片及離線備援內容
- `assets/data/selected.json`：Supabase 無法連線時的 Selected Takes 備援
- `index.html`：首頁文字的穩定備援

後台無法連線時，公開網站仍會顯示 GitHub 中的備援版本。後台內容不會自動修改 GitHub repository。

## 主要檔案

- `index.html`：品牌首頁
- `takes/index.html`：Selected Takes 保留頁
- `admin/index.html`：Supabase 內容後台
- `assets/js/admin.js`：後台操作與內容儲存
- `assets/js/supabase.js`：原 Supabase 登入與資料連線
- `assets/data/selected.json`：精選內容備援
- `assets/css/`：前台與後台樣式
- `assets/images/`：目前正式圖片與來源原稿
- `.github/workflows/pages.yml`：GitHub Pages 自動部署
- `scripts/validate_site.py`：部署前網站檢查

## 安全與既有設定

- 不要把管理員密碼、Supabase service-role key 或其他 Secret 寫進 GitHub。
- 前台的 Supabase anon key 是供瀏覽器使用的公開設定，資料權限由 RLS 保護。
- 保留既有 Google Analytics `G-JG1RP94Q9J` 與 Google Ads `AW-18389054487`。
- 網站不顯示「允許匿名網站分析」提示。
- 舊 Services、Pricing、FAQ 與銷售式首頁功能不恢復。

## 2026-08-23 更新紀錄

- 完成 SLOW TAKE 品牌入口首頁與最新版圖片整理。
- 恢復原 Supabase Email／Password 後台及 `admins` 管理員白名單。
- 修正 Supabase 登入／密碼重設的正式跳轉網址為 `/slitlight/admin/`。
- 修正重新整理後 session、登入後錯誤判斷及同源備援內容載入。
- 確認後台可從其他電腦登入，內容資料集中儲存在原 Supabase 專案。
- 保留原有 Google Analytics／Google Ads 程式碼與 GitHub Pages 自動部署。
