# slit.light Project Master Control

- Project OS：v1.1
- 控制狀態：ACTIVE
- Active Master：[slit.light_Product_Execution_Master_2026-08-27_v1.0.md](docs/source/slit.light_Product_Execution_Master_2026-08-27_v1.0.md)
- Master 版本：v1.0（2026-08-27）
- Master 狀態：CURRENT／執行基準

## Role

本檔只提供穩定的 canonical pointer，不複製產品策略，也不構成第二份 Master。產品設計、變現、宣傳、內容與市場驗證若有衝突，以本檔指向的 Active Master 為準。

## Change routing

- LEVEL A／TASK：只執行任務，不更新 Master。
- LEVEL B／DATA：更新 state／KPI 或適合的數據紀錄，不用單筆資料改寫 Master。
- LEVEL C／DECISION：完成 Impact Analysis 後，更新真正受影響的 CURRENT 控制資料，並記錄 CHANGELOG。
- LEVEL D／MAJOR CHANGE：先列為 Major Change Candidate；明確確認後才建立新 Master 並更新本 pointer。

完整分類、Impact Analysis、版本與 CHANGELOG 規則見 [AGENTS.md](AGENTS.md)。

## Authority

- 已確認並完成 triage 的新正式決策，才能授權修改 CURRENT。
- 在正式變更完成前，Active Master 持續有效。
- `PROJECT_STATE.md` 記錄目前執行狀態、數據與候選案，不覆蓋 Master。
- `CHANGELOG.md` 記錄歷史，不覆蓋 Master。
- 舊聊天與舊文件不得覆蓋 CURRENT。
