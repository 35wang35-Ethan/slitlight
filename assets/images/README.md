# 圖片資源

## 目前網站使用

- `slow-take-hero`：首頁 Hero，16:9
- `perspective-choice`：CHOICE，4:5
- `perspective-second-look`：SECOND LOOK，4:5
- `perspective-frame`：FRAME，4:5
- `about`：關於隙光，4:5

上述圖片的 PNG 是最新版來源原稿；JPG／WebP 與 `-768` 是正式網站使用的輸出。GitHub Pages 只會部署這些目前使用中的輸出，不會部署 PNG 原稿。

## 歷史資料相容檔

`hero-main.jpg`、`experience.jpg`、`method-*.jpg` 與 `case-placeholder.jpg` 只供既有 Supabase migration 的歷史資料參照，不屬於目前首頁，也不會部署到公開網站。除非同步整理資料庫歷史，否則不要單獨刪除。

圖片生成方向記錄在 `IMAGEGEN-PROMPTS.md`。從 PNG 重新輸出 JPG 時可執行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\optimize-images.ps1
```

