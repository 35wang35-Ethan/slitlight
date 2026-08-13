# 一線之光（Slit Light）

使用 HTML、CSS、JavaScript 與 Bootstrap 5 製作的靜態品牌網站，透過 GitHub Pages 發布。

## 常用連結

- 公開網站：https://35wang35-ethan.github.io/slitlight/
- 後台頁面：https://35wang35-ethan.github.io/slitlight/admin.html
- GitHub 專案：https://github.com/35wang35-Ethan/slitlight
- 部署紀錄：https://github.com/35wang35-Ethan/slitlight/actions

## 專案位置

本機資料夾：

```text
C:\Users\Administrator\Desktop\WEB
```

遠端 repository：

```text
https://github.com/35wang35-Ethan/slitlight.git
```

主要分支：`main`

## 更新網站並發布

開啟 PowerShell，進入專案資料夾：

```powershell
cd C:\Users\Administrator\Desktop\WEB
```

查看修改內容：

```powershell
git status
git diff
```

提交並推送：

```powershell
git add -A
git commit -m "更新網站"
git push origin main
```

推送到 `main` 後，`.github/workflows/pages.yml` 會自動部署以下檔案：

- `index.html`
- `style.css`
- `app.js`
- `admin.html`
- `admin.js`
- `assets/hero.png`

通常等待幾分鐘後即可看到新版網站。若仍看到舊內容，請按 `Ctrl + F5` 強制重新整理。

## GitHub CLI 登入

GitHub 網頁登入和電腦上的 GitHub CLI 授權是兩套不同的登入狀態。無法推送時，在 PowerShell 執行：

```powershell
gh auth login -h github.com -p https -w
```

依照畫面在瀏覽器完成授權，再確認：

```powershell
gh auth status
```

成功時會顯示：

```text
Logged in to github.com
```

正常情況下授權會保存在 Windows Credential Manager，不需要每次重新登入。若 token 失效，可先登出再重新授權：

```powershell
gh auth logout -h github.com -u 35wang35-Ethan
gh auth login -h github.com -p https -w
```

請勿把 GitHub token、密碼或驗證碼寫進 README 或提交到 repository。

## 後台說明

後台可修改主標題、說明文字、按鈕文字及聯絡資料。儲存後，內容會寫入目前瀏覽器的 LocalStorage；回到前台重新整理即可查看。

目前後台是純前端示範功能，不是安全的正式 CMS：

- 登入判斷位於前端 JavaScript，不能保護敏感資料。
- 修改只保存在同一台裝置、同一個瀏覽器中。
- 修改不會同步到 GitHub，也不會影響其他訪客。
- 清除瀏覽器資料後，後台修改會消失。

若要多人共同管理並讓所有訪客看到相同內容，需要另外串接正式登入、伺服器端 API 與資料庫。

## 常見問題

### 網站或後台出現 404

先到 GitHub Actions 檢查最新的 `Deploy frontend to GitHub Pages` 是否成功，再等待幾分鐘並按 `Ctrl + F5`。

### `git push` 顯示尚未登入

執行 `gh auth status`。若不是 `Logged in to github.com`，依照上方「GitHub CLI 登入」重新授權。

### 推送後內容沒有改變

確認修改已經 commit 並推送到 `main`，再查看 GitHub Actions 的部署結果。瀏覽器可能保留快取，可按 `Ctrl + F5`。
