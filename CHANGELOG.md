# slit.light Project OS Changelog

本檔只記錄正式設定、canonical 與 Project OS 變更。一次性 TASK 與尚未形成決策的單筆 DATA 不記錄於此。

## 2026-08-29｜Project OS v1.1 — Instruction Triage

- 類型：正式 Project OS 設定變更。
- 決策：新增 LEVEL A／TASK、LEVEL B／DATA、LEVEL C／DECISION、LEVEL D／MAJOR CHANGE 四級指令分類。
- 原因：區分臨時任務、新數據、正式設定變更與重大策略變更，避免每則指令直接污染 CURRENT Master。
- 產品影響：無；Case Sprint 與既有產品策略不變。
- 網站影響：無；未修改 HTML、CSS、JavaScript 或公開內容。
- 文案影響：無對外文案變更。
- 流程影響：正式決策修改前新增 Impact Analysis；重大變更先列候選案並等待確認。
- KPI 影響：不修改既有門檻；單筆資料僅更新 state／數據紀錄，達到 Master 門檻後才能提出 ADJUST／PIVOT 建議。
- 受影響檔案：`AGENTS.md`、`PROJECT_MASTER.md`、`PROJECT_STATE.md`、`CHANGELOG.md`。
- Canonical 結果：產品 Active Master 維持 `slit.light_Product_Execution_Master_2026-08-27_v1.0.md`，未修改內容或版本。
