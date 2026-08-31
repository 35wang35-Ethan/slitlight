# slit.light Project OS Changelog

本檔是歷史紀錄，只在正式 C／已確認 D 或 Project OS 正式變更時讀寫；A／B 日常工作不載入。

## Unreleased｜Case Sprint conversion and consistency refinement

- 類型：正式網站執行更新；Product Master 維持 v1.0。
- 首頁與 Case Sprint 產品頁統一為「提供案例、案例深訪、萃取角度、整理腳本」四步流程。
- Case Sprint 新增 Bootstrap Pre-brief Modal、Turnstile-protected inquiry client、UTM capture 與 inquiry analytics events，沿用既有 Supabase Edge Function／admin workflow。
- 首頁與 Case Sprint CTA 直接開啟同一套 Pre-brief Modal，分別保存 CTA source；analytics funnel 補齊 `case_sprint_view`、`prebrief_open`、`inquiry_start`、`inquiry_submit` 與安全的 `inquiry_error` stage。
- Pre-brief 補齊 Beta 必要欄位、Privacy consent、loading 防重送、完整 success／error state；error 保留已填內容並提供 retry／Instagram。
- 恢復 `submit-inquiry` Edge Function source，新增非破壞式 `007_case_sprint_prebrief_funnel.sql` migration、後端欄位長度／Turnstile 驗證與 insert confirmation。
- Admin inquiries 補齊 Submitted time、Name、Brand、Case Summary、Problem、Email、Contact、Source、Status，並保留既有 status 相容值；Privacy 同步說明實際表單資料用途與刪除方式。
- Bootstrap bundle 更新為完整官方 5.3.3，以支援 Modal、Offcanvas 與 ScrollSpy。
- Header、Footer、CTA 與 Beta 文案依 CURRENT Case Sprint 路徑收斂；未確認的 Threads、Facebook 連結不公開。
- 修正 mobile Offcanvas anchor 重複套用 `scroll-padding-top` 與 `scroll-margin-top` 的雙偏移。
- Validation：repository 通過，5 pages、137 references；375／390／430／1440px browser regression、Offcanvas → Modal、CTA source、ESC cleanup 與 failure data retention 通過；localhost 僅有預期的 Turnstile `110200`。
- Release status：local working tree only；Supabase Dashboard 尚未登入，migration／Edge Function、commit／push 與 production E2E 尚未完成。

## 2026-08-30｜Project OS v1.2 — Lean context loading

- 類型：正式 Project OS 設定優化。
- 決策：每次任務只預設讀 `AGENTS.md`；Master、state 與 changelog 依 A／B／C／D on-demand 載入，並壓縮重複治理文字。
- 原因：降低日常 Codex token／context 消耗，同時保留 immutable Master、minimal scope、Self-QA 與發布權限限制。
- 影響範圍：`AGENTS.md`、`PROJECT_MASTER.md`、`PROJECT_STATE.md`、`CHANGELOG.md`；Product Master、網站、data、validator 與 workflow 不變。
- 版本結果：Project OS 維持 v1.2；Product Master 維持 v1.0。

## 2026-08-29｜Project OS v1.2 — Self-QA Loop

- 類型：正式 Project OS 設定變更。
- 決策：所有 repository 修改採用 Before Change、Implementation、Mandatory QA、最多 3 輪 Self-Fix、Regression Check 與 Definition of Done 流程。
- 原因：避免修改寫完即停止，要求 Codex 以需求、diff、功能與 CURRENT 一致性共同判斷完成，不以單一 exit code 代替 QA。
- 產品影響：無；Product Master v1.0、Case Sprint、定價、客群與品牌策略不變。
- 網站影響：無；未修改 HTML、CSS、JavaScript、data 或公開內容。
- 文案影響：無對外文案變更。
- 流程影響：網站與 data 修改必跑基準 validation；QA failure 最多自動修復 3 輪；UI 任務在能力可用時增加 browser／visual QA；未達 Definition of Done 必須回報 PARTIAL／BLOCKED。
- KPI 影響：無；既有指標與門檻不變。
- 影響範圍：`AGENTS.md` 為主要規則；`PROJECT_MASTER.md`、`PROJECT_STATE.md` 同步 Project OS v1.2；`CHANGELOG.md` 記錄本次正式設定變更。
- 未修改範圍：Product Master canonical 原文、網站內容、`.github/workflows/pages.yml`、`scripts/validate_site.py`。
- 版本結果：Project OS v1.1 → v1.2；Product Master 維持 v1.0，兩套版本仍獨立管理。

## 2026-08-29｜Project OS v1.1 — Canonical Master version-history safeguard

- 類型：正式 Project OS 設定變更。
- 決策：versioned canonical Master 改採 immutable history；Product Master 只能以新 minor／major 檔案演進，不得原地覆寫或刪除舊版。
- 原因：保留可追溯的 canonical 歷史，避免內容已改但版本號不變，並防止 Project OS 與 Product Master 版本混淆。
- Previous Product Master：v1.0。
- New Product Master：無；本次沒有產品決策，也沒有建立或修改 Product Master。
- 產品影響：無；Case Sprint、定價、客群、商業模式與品牌角色不變。
- 網站影響：無；未修改 HTML、CSS、JavaScript 或公開內容。
- 文案影響：無對外文案變更。
- 流程影響：LEVEL C 修改 Product Master 時須複製完整上一版建立新 minor version；LEVEL D 確認後才可建立新 major version；pointer 僅在新版本驗證完成後切換。
- KPI 影響：無；既有門檻與數據紀錄方式不變。
- 影響範圍：`AGENTS.md`、`PROJECT_MASTER.md`、`PROJECT_STATE.md`、`CHANGELOG.md` 的 canonical governance 規則。
- 版本結果：Project OS 維持 v1.1；Product Master 維持 v1.0，兩套版本獨立管理。

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
