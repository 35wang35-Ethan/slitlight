# slit.light Repository Instructions

## Scope and authority

- 本規則適用於整個 repository，Project OS 版本為 v1.1。
- 每次工作先讀本檔，再由 `PROJECT_MASTER.md` 找到 Active Master，並查看 `PROJECT_STATE.md` 的目前狀態與 `CHANGELOG.md` 的正式變更紀錄。
- `PROJECT_MASTER.md` 是 canonical pointer，不是第二份 Master；產品與品牌的 CURRENT 內容只以它指向的 Active Master 為準。
- 舊聊天、舊文件、舊服務架構與過期 Master 只能作參考，不得覆蓋 CURRENT。
- 一則訊息若含多項指令，逐項分類後分別處理，不得因其中一項層級較高，就把其他臨時任務一併寫入 Master。

## Mandatory instruction triage

修改控制資料前，必須先把每項新指令歸類為 LEVEL A、B、C 或 D。分類依據是指令造成的治理效果，不只是使用者用了哪些字。

### LEVEL A｜TASK

適用於一次性執行任務，例如：

- 修改 About 排版。
- 檢查手機版。
- 提供三個標題。

規則：

- 只執行任務與必要驗證。
- 不修改 Active Master、`PROJECT_MASTER.md` 或 `CHANGELOG.md`。
- 不因一次性文案、版面、分析或建議更新 `PROJECT_STATE.md`，除非任務同時產生需要保存的狀態或數據。
- 只有任務本身明確改變正式規格時，才重新分類為 LEVEL C 或 D。
- 不確定是 TASK 還是 DECISION 時，一律先當 TASK，不更新 Master。

### LEVEL B｜DATA

適用於新觀測值或執行結果，例如 Reel 觀看數、留存、Beta 完成數或實際工時。

規則：

- 更新 `PROJECT_STATE.md` 的 KPI／observations，或 repository 既有且更合適的數據紀錄。
- 記錄日期、指標、數值、樣本或情境；資料不足時明確標示限制。
- repository 尚無合適紀錄時，先在 `PROJECT_STATE.md` 做最小記錄，不為單筆數據建立新文件。
- 單筆數據不得自動修改 Active Master、長期策略、產品定位或正式設定。
- 只有累積資料達到 Active Master 已設定的樣本數、判斷門檻或止損線，才能提出 ADJUST／PIVOT 建議；提出建議仍不等於正式決策。
- 新資料與 Master 衝突時，先指出衝突並保留兩者，不得用新資料直接覆蓋 Master。
- DATA 若導致使用者作出正式設定變更，後續部分改按 LEVEL C 或 D 處理。

### LEVEL C｜DECISION

適用於使用者明確表示「確定」、「正式」、「以後都用」、「改成」、「取消」、「不再」等，且內容是非重大、可在目前版本內成立的正式決策。

規則：

1. 修改前先完成 Impact Analysis。
2. 只更新決策真正控制的 authoritative location：
   - 長期產品、品牌、服務或定價規格：依 Canonical Master version protocol 建立下一個 minor version，不得原地修改 Active Master。
   - 當前進度、KPI、觀測或 blocker：`PROJECT_STATE.md`。
   - 技術或網站設定：相應設定檔或正式內容；不得擴大到未被授權的區域。
3. 同步更新受影響的 CURRENT 控制資料，避免 Master、state 與實作互相矛盾。
4. 每項正式設定變更都必須寫入 `CHANGELOG.md`。
5. 修改 Master 時，必須記錄原因、日期、影響範圍與版本處理方式。
6. 若 Impact Analysis 顯示符合 LEVEL D，停止 LEVEL C 流程並改列 Major Change Candidate。

### LEVEL D｜MAJOR CHANGE

下列任一情況屬重大變更：

- 主產品改變。
- 核心客群改變。
- 商業模式改變。
- 定價架構重大改變。
- 品牌角色改變。

規則：

1. 先做 Impact Analysis。
2. 在 `PROJECT_STATE.md` 標記為 Major Change Candidate，說明與 CURRENT 的衝突、影響及可能需要升級 v2.0 的原因。
3. 第一次提出候選案時，即使語氣像正式決策，也不得默默修改 CURRENT v1.x、canonical pointer 或 Active Master。
4. 等待使用者在看過影響與版本建議後明確確認。
5. 確認前不得建立新的 Product Master；確認後才從目前 Active Master 完整複製出新的 major version（通常為 v2.0），在新檔套用變更，再更新 `PROJECT_MASTER.md` pointer、`PROJECT_STATE.md` 與 `CHANGELOG.md`。不得把重大變更偽裝成 v1.x 小修。
6. 不確定是否為重大變更時，不自行升版本；先保留 CURRENT 並提出風險與版本建議。

## Impact Analysis

LEVEL C 與 D 在修改前必須列出：

- 分類與擬議決策。
- 產品影響。
- 網站與技術實作影響。
- 對外文案與品牌語言影響。
- 交付／營運流程影響。
- KPI、門檻與數據紀錄影響。
- 受影響的控制檔與實作檔。
- 與 CURRENT Master 或既有設定的衝突。
- 建議維持 v1.x、升級 v2.0，或暫不變更的理由。

沒有影響的項目也要明確標示「無」，避免默認擴大修改範圍。

## Changelog requirements

- LEVEL C 的正式設定變更、確認後的 LEVEL D，以及 Project OS 規則變更，都必須記錄在 `CHANGELOG.md`。
- 每筆紀錄至少包含日期、類型、決策／變更、原因、影響範圍、受影響檔案及版本結果。
- LEVEL A 不寫 CHANGELOG。
- LEVEL B 只記錄在 state／數據紀錄；除非它觸發並完成正式決策，否則不寫成設定變更。
- CHANGELOG 是歷史紀錄，不可反向覆蓋 Active Master。
- Product Master 版本切換的紀錄必須另外標示 previous version、new version、原因、日期與影響範圍。

## Master safeguards

- AI 不得因「覺得比較好」自行更改品牌、產品、客群、商業模式、定價或策略。
- 不得把建議、草稿、候選案、單筆數據或臨時任務寫成 CURRENT 決策。
- 已存在且檔名帶版本號的 canonical Master 是 immutable history；不得原地覆寫、改名取代或刪除。
- LEVEL C 若正式決策需要修改 Product Master，必須保留舊版，將上一版完整內容複製到新的 minor version，僅在新檔套用變更；完成檢查後才更新 `PROJECT_MASTER.md` CURRENT pointer。
- LEVEL D 在使用者正式確認前不得建立新 Product Master；確認後才建立新的 major version，保留舊版並在新檔套用已確認的重大變更。
- 禁止修改 v1.0 內容但仍沿用 v1.0 版本號。
- 禁止刪除舊版而只保留最新版。
- 禁止在沒有正式 LEVEL C 決策或已確認 LEVEL D 的情況下自行建立新 Product Master。
- `PROJECT_MASTER.md` 只是 CURRENT pointer／control record，不取代、摘要覆蓋或充當 canonical 原文。
- 新版本完成並生效後才更新 canonical pointer。舊版原文內的版本與當時狀態屬歷史快照，不回寫；是否 CURRENT 以 pointer 為準。
- Project OS 版本與 Product Master 版本是兩個獨立序列；任一方升版不得推定另一方也升版。
- 若資料、實作與 Master 不一致，先報告衝突及影響，未獲授權前不自行選擇新策略。

## Repository safeguards

- 僅修改完成任務所需的檔案，保留使用者其他未提交變更。
- 未經要求不得修改或部署網站正式內容。
- 修改後執行與風險相稱的檢查；本 repository 的基準檢查為 `python scripts/validate_site.py .` 與 `git diff --check`。
- 不得自動 commit 或 push，除非使用者明確要求。
