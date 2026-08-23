# slit.light Supabase backend

這個網站重新使用原本的 Supabase 專案 `ptruiafyvqhyeodvkiub`，不建立第二個資料庫。

目前後台使用既有資料表：

- `admins`：允許登入後台的 Auth user ID 白名單。
- `cases`：保存 Selected Takes；只有 `client_type` 為 `choice`、`second-look`、`frame` 的資料會被新版網站讀取。
- `homepage_sections`：`section_key = editorial_copy` 保存 Hero、About 與 Collaborate JSON。
- `inquiries`：保留原有詢問資料及狀態。
- Storage bucket `site-images`：管理員圖片上傳。

公開網站只使用 anon key，資料存取仍由既有 RLS 控制。不要把 service-role key、管理員密碼或 Auth token 加入 repository。

## 原管理員登入與密碼重設

後台沿用原本的 Supabase Auth 使用者與 `admins` 白名單，不建立第二個管理員帳號。Supabase Dashboard 的 Authentication → URL Configuration 必須保留：

- Site URL：`https://35wang35-ethan.github.io/slitlight/admin/`
- Redirect URL：`https://35wang35-ethan.github.io/slitlight/admin/`

後台的「忘記密碼」會把重設信導回同一個 `/admin/` 頁面；頁面會讀取 Supabase recovery session，讓原使用者更新密碼。密碼與 recovery token 都只停留在使用者瀏覽器，不寫入 GitHub。

`assets/data/selected.json` 與 `index.html` 是公開網站的穩定備援；Supabase 暫時無法連線時仍會顯示。
