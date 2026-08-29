# slit.light Lean Project OS

## Default

- 本檔是每次任務唯一預設控制檔；另讀任務相關程式碼即可。
- `PROJECT_MASTER.md`、`PROJECT_STATE.md`、`CHANGELOG.md` 與 Product Master 只能依下列規則 on-demand 載入。
- 舊聊天、舊文件與過期 Master 不得覆蓋 CURRENT。

## Context loading

| Level | On-demand context |
|---|---|
| A／TASK | 只讀本檔與任務相關程式碼。除非直接涉及品牌／產品正式規格，否則不讀 Product Master。 |
| B／DATA | 讀本檔與 `PROJECT_STATE.md`；只有判斷既有 KPI／stop-loss threshold 時才讀 Active Product Master。 |
| C／DECISION | 讀本檔、`PROJECT_MASTER.md` 與 Active Product Master；正式變更時讀寫 `CHANGELOG.md`。 |
| D／MAJOR CHANGE | 讀本檔、`PROJECT_MASTER.md` 與 Active Product Master；做 Impact Analysis 並等待確認。確認後才讀寫 `CHANGELOG.md`。 |

- 混合指令逐項分類；不確定 A 或 C 時預設 A，不更新 Master。
- 只載入完成判斷所需內容，不因方便而讀全部歷史。

## Instruction triage

- **A／TASK**：只執行任務；不更新 Master、state 或 changelog，除非產生明確狀態或正式規格變更。
- **B／DATA**：在 state／既有數據紀錄保存日期、數值與情境；單筆數據不改長期策略，只有達到 Master 門檻才可提出 ADJUST／PIVOT。
- **C／DECISION**：明確正式且非重大決策；先做必要 Impact Analysis，再更新 authoritative control，並記錄 changelog。
- **D／MAJOR CHANGE**：主產品、核心客群、商業模式、定價架構或品牌角色改變；先列 Major Change Candidate、做 Impact Analysis 並等待明確確認。
- AI 不得把建議、草稿、臨時任務或「覺得更好」寫成正式品牌／產品策略。

## Immutable Product Master

- `PROJECT_MASTER.md` 只是 CURRENT pointer；canonical 原文位於它指向的 versioned Product Master。
- 已存在的 versioned Master 是 immutable history，不得原地覆寫或刪除。
- C 級變更若涉及 Product Master：完整複製 CURRENT 為新 minor version，只改新檔，驗證後更新 pointer，並在 changelog 記錄前後版本、日期、原因與影響。
- D 級變更確認前不得建立新 Master；確認後才建立新 major version並更新 pointer／state／changelog。
- 沒有正式決策不得建立 Master；Project OS 與 Product Master 版本分開管理。

## Minimal scope

- 修改前確認需求、禁止區域、受影響檔案、未提交使用者變更，以及 on-demand context 中的限制。
- 優先沿用既有架構；不做無關重構、不因美化而重寫、不刪除任務未要求的功能。
- 保留使用者其他變更；若無法安全隔離或需要擴大範圍，先停止並說明。

## Self-QA

修改 → 執行適用 validation → 檢查完整 diff／scope → 若本次修改造成失敗，自動修復最多 3 次 → 再測 → regression check → 回報。

網站 HTML、CSS、JavaScript 或 data 修改至少執行：

```powershell
python scripts/validate_site.py .
git diff --check
```

- 執行 repository 其他既有且適用的 test／lint／build；未執行不得暗示通過。
- 修復只限本次原因；無關既有 failure 只回報。3 輪仍失敗則停止並標記 `BLOCKED`，說明測試、嘗試與所需決策。
- 不得刪除測試、放寬 validation、隱藏 error、註解問題或移除需求來過關；除非使用者明確要求修改 validation。
- Regression check 必須確認需求完成、無無關 diff、原功能仍在、無 obsolete／duplicated code、無 CURRENT 衝突，且 state／changelog 更新符合 A／B／C／D。
- 不能只以 exit code 0 宣稱完成。UI 任務若有 browser 能力則執行；若沒有，明確回報 `structural validation passed, visual/browser QA not executed`。

## Commit / Push

- 不自行 commit 或 push；只有使用者明確要求時才執行。
- Self-QA 通過不等於取得發布權限。
