# 圖片資源

## 目前網站使用

- `slow-take-hero`：首頁 Hero，16:9
- `perspective-choice`：CHOICE，4:5
- `perspective-second-look`：SECOND LOOK，4:5
- `perspective-frame`：FRAME，4:5
- `selected-frame`：精選 FRAME，自有街景攝影，4:3
- `selected-choice`：精選 CHOICE，自有桌面照片攝影，寬幅
- `about`：Ethan 提供的 About 人物照，4:5

上述圖片的 PNG 是最新版來源原稿；JPG／WebP 與 `-768` 是正式網站使用的輸出。GitHub Pages 只會部署這些目前使用中的輸出，不會部署 PNG 原稿。

## 歷史資料相容檔

圖片生成方向記錄在 `IMAGEGEN-PROMPTS.md`。從 PNG 重新輸出 JPG 時可執行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\optimize-images.ps1
```

