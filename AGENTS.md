# Slit.light Codex Rules

## Default

- 只讀本檔與完成目前任務需要的檔案。
- 不主動讀 PROJECT_MASTER.md、CHANGELOG.md、docs/source/ 或歷史文件。
- 只有任務明確涉及正式產品、價格、客群、品牌定位或商業規格時，才讀 PROJECT_MASTER.md 與其中指向的 CURRENT Product Master。
- 不做使用者未要求的重構、文案改寫、功能刪除或額外優化。
- 保留既有架構與其他未提交變更。
- 不得自行修改 Product Master；若實作與 CURRENT Master 衝突，先回報。

## QA

網站 HTML、CSS、JavaScript 或 data 修改完成後執行：

python scripts/validate_site.py .
git diff --check

- 若本次修改造成測試失敗，修正後重跑。
- 無法修正就回報，不擴大修改範圍。
- 不得刪除、放寬或繞過 validator 來讓測試通過。
- 未實際執行 browser／visual QA 時，不得宣稱已完成視覺驗證。

## Git

- 除非使用者明確要求，不 commit、不 push。
