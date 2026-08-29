# slit.light Repository Instructions

## Scope and authority

- 本規則適用於整個 repository，Project OS 版本為 v1.2。
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

## Self-QA Protocol

Repository 修改必須依序完成：理解任務 → 修改 → 驗證 → 找問題 → 修復 → 再驗證 → regression check → 回報。不得在寫入修改後直接宣稱完成。

### 1｜Before Change

每次修改前先確認：

- 指令屬於 LEVEL A、B、C 或 D；混合指令逐項分類。
- 使用者真正要求修改的結果與驗收條件。
- 明確禁止或不應修改的區域。
- 可能受影響的檔案與既有架構。
- working tree 是否有未提交的使用者變更；這些變更不得被覆蓋、重置或混入任務。
- Active Master 是否有相關限制、正式設定或版本要求。

先定義最小必要修改範圍，不做無關重構。若範圍與既有變更重疊且無法安全隔離，先停止並說明。

### 2｜Implementation

- 優先沿用既有架構、元件、資料格式與命名方式。
- 不因「可以寫得更漂亮」就重寫無關程式或文件。
- 不刪除既有功能，除非任務明確需要且刪除範圍已確認。
- 不修改品牌或產品正式設定，除非已通過 Instruction Triage 的 LEVEL C 或已確認 LEVEL D 流程。
- 保留使用者未提交的其他修改，只編輯任務核准範圍。
- 修改過程若發現需要擴大範圍，先重新判斷影響與授權，不自行延伸任務。

### 3｜Mandatory QA

任何網站 HTML、CSS、JavaScript 或 data 修改完成後，至少執行：

```powershell
python scripts/validate_site.py .
git diff --check
```

並且：

- 檢查本次完整 diff、changed files 與未提交狀態，確認只有核准範圍。
- 若 repository 另有已存在且適用的 test、lint、build 或 validation，也必須執行。
- 文件或控制規則修改仍須執行使用者指定及與風險相稱的檢查。
- 記錄實際執行的命令與結果；未執行的檢查不得暗示已通過。

### 4｜Self-Fix Loop

QA 失敗時，每一輪必須包含：分析 failure → 判斷是否由本次修改造成 → 只修復任務相關原因 → 重新執行適用 QA。

1. 第一次失敗：定位原因；若由本次修改造成，修復後重跑 QA。
2. 第二次仍失敗：再分析一次，只修復與任務相關的問題，再重跑 QA。
3. 第三次仍失敗：可進行最後一輪任務內修復與 QA；最多自動修復 3 輪。

3 輪後仍失敗時：

- 停止擴大修改，不得宣稱完成。
- 狀態使用 PARTIAL 或 BLOCKED。
- 回報失敗的測試、已嘗試的修復、最可能原因，以及是否需要使用者決策。
- 若 failure 是任務前已存在且與本次修改無關，只記錄證據與影響，不擅自修復無關問題。

不得為了讓測試變綠而：

- 刪除測試。
- 放寬既有 validation。
- 隱藏或吞掉 error。
- 註解掉問題程式。
- 移除原本要求的功能。

只有使用者明確要求修改 validation 本身時，才可把 validation 納入修改範圍；仍須說明其影響。

### 5｜Regression Check

修改與 QA 後，必須再確認：

- 使用者要求與驗收條件是否真的完成。
- 是否意外修改無關檔案或內容。
- 原有重要功能、設定與安全限制是否仍存在。
- 是否產生 obsolete、duplicated 或互相衝突的 code／data／control record。
- 結果是否與 Active Master 衝突。
- 是否依 LEVEL A／B／C／D 規則更新必要的 `PROJECT_STATE.md` 或 `CHANGELOG.md`，且沒有不必要更新。

不能只以 command exit code 等於 0 作為完成依據；必須結合 diff、需求、功能與 CURRENT 一致性判斷。

### 6｜UI / Website Tasks

涉及版面、responsive 或互動時，除了 repository validation，若目前環境具備 browser、screenshot、Playwright 或 equivalent capability，應主動檢查：

- desktop、tablet、mobile。
- horizontal overflow 與 obvious layout breakage。
- navigation、CTA、anchor links。
- console errors。
- image loading。

依任務保留可核對的 viewport、結果或截圖證據。若環境沒有瀏覽器測試能力，不得假裝完成 visual QA，回報中必須明確寫：`structural validation passed, visual/browser QA not executed`。

### 7｜Definition of Done

只有以下條件全部成立，狀態才可標為 DONE 或對使用者說「完成」：

- 使用者要求已實作。
- mandatory validation 與其他適用檢查全部通過。
- 本次修改造成的 regression 已排除。
- 沒有未處理的本次錯誤。
- 修改沒有超出核准範圍。
- 必要的 state／changelog 已依 LEVEL A／B／C／D 規則處理。

任一條件不成立時，使用 PARTIAL 或 BLOCKED，並清楚說明剩餘問題，不得使用 DONE。

### 8｜Commit / Push

- Self-QA 成功只代表修改可交付，不代表取得發布權限。
- 不自行 commit，不自行 push；只有使用者明確要求時才執行。
- commit 或 push 前再次確認範圍、validation 與 working tree，且不得混入無關變更。

## Repository safeguards

- 僅修改完成任務所需的檔案，保留使用者其他未提交變更。
- 未經要求不得修改或部署網站正式內容。
- 修改後執行與風險相稱的檢查；本 repository 的基準檢查為 `python scripts/validate_site.py .` 與 `git diff --check`。
- 不得自動 commit 或 push，除非使用者明確要求。
