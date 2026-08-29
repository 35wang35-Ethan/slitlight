# slit.light Project Master Control

- Project OS：v1.2
- 控制狀態：ACTIVE
- Active Master：[slit.light_Product_Execution_Master_2026-08-27_v1.0.md](docs/source/slit.light_Product_Execution_Master_2026-08-27_v1.0.md)
- Master 版本：v1.0（2026-08-27）
- Master 狀態：CURRENT／執行基準

## Role

本檔只提供穩定的 canonical pointer，不複製產品策略，也不構成第二份 Master。產品設計、變現、宣傳、內容與市場驗證若有衝突，以本檔指向的 Active Master 為準。

本檔是 CURRENT pointer／control record，不取代、摘要覆蓋或充當 canonical 原文。舊版 Master 內的狀態文字保留為歷史快照；實際 CURRENT 版本只由本檔的 Active Master pointer 決定。

## Separate version domains

- Project OS 版本：v1.2，管理 instruction triage、Self-QA Loop、控制流程與 repository safeguards。
- Product Master 版本：v1.0，管理產品、品牌、變現、內容與市場驗證策略。
- 兩套版本獨立管理；Project OS 升版不代表 Product Master 升版，Product Master 升版也不代表 Project OS 升版。

## Canonical Master version protocol

- 所有已存在且帶版本號的 canonical Master 都是 immutable history，不得原地覆寫或刪除。
- LEVEL C 正式決策需要修改 Product Master 時：
  1. 保留上一版原檔。
  2. 將上一版完整內容複製成下一個 minor version。
  3. 只在新版本套用已確認變更，並更新新檔自己的版本與日期。
  4. 驗證完成後，將本檔 Active Master pointer 切換到新版本。
  5. 在 `CHANGELOG.md` 記錄 previous version、new version、原因、日期與影響範圍。
- LEVEL D Major Change 在使用者正式確認前不得建立新 Product Master；確認後才依相同保留歷史原則建立新的 major version。
- 沒有正式 LEVEL C 決策或已確認 LEVEL D，不得自行建立 Product Master 版本。

## Change routing

- LEVEL A／TASK：只執行任務，不更新 Master。
- LEVEL B／DATA：更新 state／KPI 或適合的數據紀錄，不用單筆資料改寫 Master。
- LEVEL C／DECISION：完成 Impact Analysis 後，若影響 Product Master，建立新 minor version並更新本 pointer；所有正式變更記錄 CHANGELOG。
- LEVEL D／MAJOR CHANGE：先列為 Major Change Candidate；明確確認後才建立新 major version並更新本 pointer。

完整分類、Impact Analysis、版本與 CHANGELOG 規則見 [AGENTS.md](AGENTS.md)。

## Authority

- 已確認並完成 triage 的新正式決策，才能授權修改 CURRENT。
- 在正式變更完成前，Active Master 持續有效。
- `PROJECT_STATE.md` 記錄目前執行狀態、數據與候選案，不覆蓋 Master。
- `CHANGELOG.md` 記錄歷史，不覆蓋 Master。
- 舊聊天與舊文件不得覆蓋 CURRENT。
