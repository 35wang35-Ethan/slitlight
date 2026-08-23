# 隙光網站編輯指南

這個專案的完整最新版保存在 GitHub。換電腦時不需要複製舊資料夾，只要取得 `main` 分支，就能編輯、預覽與部署同一份網站。

## 第一次在新電腦設定

安裝 Git、Visual Studio Code 與 Python 3，然後執行：

```powershell
git clone https://github.com/35wang35-Ethan/slitlight.git
cd slitlight
code .
```

敏感資料不在專案內。網站內容與部署版本以 GitHub `main` 分支為準。

## 每次修改前

```powershell
git switch main
git pull --ff-only origin main
git switch -c update/簡短修改名稱
```

主要編輯位置：

- 首頁文字與結構：`index.html`
- 首頁精選內容：`assets/data/selected.json`
- 舊網址保留頁：`takes/index.html`（不在主要導覽中）
- 視覺樣式：`assets/css/`
- 圖片：`assets/images/`
- 網站設定：`assets/js/config.js`

`assets/js/config.js` 內的 Google Analytics 與 Google Ads ID 是目前正式追蹤設定。修改版面時不要移除 `assets/js/analytics.js`；公開頁面需在 `config.js` 之後載入它，但網站不顯示分析同意視窗。

## 本機預覽與檢查

不要直接雙擊 HTML；用本機伺服器開啟，JSON 內容才會正常載入：

```powershell
python -m http.server 4174
```

瀏覽 `http://127.0.0.1:4174/`。修改完成後另開終端機執行：

```powershell
python .\scripts\validate_site.py
```

## 儲存到 GitHub

```powershell
git add .
git commit -m "說明這次修改"
git push -u origin update/簡短修改名稱
```

在 GitHub 建立 Pull Request 並合併到 `main`。GitHub Actions 會驗證並自動更新正式網站；只有 `main` 是正式最新版。

## 更新 Selected Take

編輯 `assets/data/selected.json`。每筆資料需保留：

- `slug`、`category`、`title`、`description`
- `cover`、`coverAlt`、`coverWidth`、`coverHeight`
- `selected`、`order`
- `workTitle`、`year`、`director`、`creator`、`sourceNote`
- `externalUrl`、`instagramUrl`、`internalSlug`

`category` 只能是 `choice`、`second-look` 或 `frame`。首頁依 `order` 顯示 `selected: true` 的前 3–5 筆，不依日期排序；沒有連結的項目會保留為單純的觀點樣本。

## 更新圖片

圖片清單與命名方式請看 `assets/images/README.md`。PNG 是目前視覺的來源原稿，不會部署；JPG／WebP 才是網站載入檔。替換圖片後務必維持既有檔名與尺寸比例，再執行網站檢查。
