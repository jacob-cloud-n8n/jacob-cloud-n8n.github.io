# 美地居家收納 Astro 建置準備

## 目前方向

- 客戶已確認 Stitch 版本作為正式設計方向。
- 舊版 `public/meidi-home/` 已移除，保留 `public/meidi-home-stitch/` 作為目前唯一美地預覽。
- 小牧人既有 Astro routes、Notion CMS、Zeabur 設定與正式站路由不應因美地建置被改動。

## 建置邊界

- 先保留靜態預覽路徑：`/meidi-home-stitch/`。
- 若進入正式 Astro 化，建議建立獨立路由命名空間，不與小牧人頁面共用內容資料。
- 下一階段準備將文案、圖片與服務分類抽成結構化資料，再接 Notion 維護資料庫。
- 美地正式站需視為獨立網站與獨立 Zeabur 服務，不共用小牧人正式服務、路由或既有 Notion database env vars。

## 已有頁面

- `index.html`：首頁、品牌主張、空間分類、心動馬上行動。
- `about.html`：關於美地、空間規劃邏輯、納爺體系。
- `team.html`：收納團隊、華琍老師背書、社群與培訓資訊。
- `services.html`：服務項目、搬家打包、全屋整理與擴充服務佔位。
- `portfolio.html`：精選案例與 Before / After 分類佔位。
- `booking.html`：流程、報價、預約聯繫。
- `review.html`：審稿註記板，不掛主選單。

## 已確認資料

- Notion 入口頁：`https://www.notion.so/2aa89dd14f0a80649344fd1c4a39017d?source=copy_link`
- Notion 頁面標題：`收納天地`，已包含 `美地官網維護區` 與六個頁面資料庫。
- 官方 LINE QR：`https://qr-official.line.me/gs/M_135hliju_GW.png?oat_content=qr`
- 官方 LINE 加好友連結：`https://line.me/R/ti/p/@135hliju`
- Facebook：`https://www.facebook.com/profile.php?id=61587447119551`
- IG、Threads：先保留欄位，待客戶補正式連結。
- 服務區域與車馬費：另行報價。
- 可公開的證書圖片：`public/meidi-home-stitch/assets/naye-certificate.jpg`
- 表單：正式版需寫入 Notion 諮詢資料庫，作為後續通知與追蹤來源。
- 隱私提醒：表單資料僅作預約聯繫與服務評估使用。

## 待補資料

- 已授權且去識別化的 Before / After 案例照片。
- Notion 每個資料庫的正式欄位 schema；目前六個頁面資料庫已建立，但只含 `名稱` title 欄位。
- IG、Threads 正式連結。
- 正式網域與 Zeabur 專案名稱。
- 正式隱私權政策頁文案與表單同意文字。
- Zeabur 空間與方案容量確認；若容量不足，需先請客戶增開或升級。

## Notion 串接建議步驟

1. 先確認正式網站路徑與部署形狀：美地是否維持獨立路徑，或改成獨立網域 / Zeabur 專案。
2. 將目前靜態 HTML 拆成 Astro layout、共用導覽、頁尾、服務卡片、CTA、案例卡、表單區塊。
3. 建立 local fallback content，先讓網站不靠 Notion 也能完整建置。
4. 規劃 Notion 資料庫：
   - 頁面文案與圖片：首頁、關於美地、收納團隊、服務項目、案例、預約聯繫。
   - 服務項目：分類名稱、描述、icon、排序、啟用狀態。
   - 案例資料：分類、Before/After 圖、摘要、授權狀態、是否公開。
   - 團隊/資歷：照片、證書、社群連結、排序。
   - 諮詢表單：姓名、電話、LINE ID、服務區域、空間類型、困擾描述、狀態。
5. 接 Notion adapter：讀 env var、短快取、欄位別名、失敗時 fallback。
6. 決定表單流程：先寫 Notion，再由 n8n/LINE 通知；靜態預覽保留 LINE/Facebook fallback。
7. 補 `.env.example`、README 與 Zeabur env var 文件。
8. 驗證 server build 與 static preview build，確認沒有 secret 或未授權照片進 Git。

## Notion 頁面對應

正式 Astro 版需讓每個頁面都可由 Notion 維護文案與圖片：

- 首頁：hero、品牌主張、三個價值卡、服務分類摘要、CTA。
- 關於美地：品牌方法論、華琍老師介紹、納爺體系說明、圖片。
- 收納團隊：形象照、證書、社群連結、資歷卡、動態牆設定。
- 服務項目：服務分類、說明、icon、排序、是否啟用。
- 精選案例：分類、Before/After 圖片、摘要、授權與隱私狀態。
- 預約聯繫：流程、報價、LINE QR、FB 連結、表單欄位、隱私文字。
- 審稿註記板：僅供內部審稿，不建議進正式網站主選單。

實際 database ID 與建議欄位記錄在 `docs/meidi-notion-schema.md`。

## 驗證清單

- 靜態預覽建置：`ASTRO_OUTPUT=static pnpm run build`
- 確認 `/meidi-home-stitch/` 與 `/meidi-home-stitch/review.html` 可正常開啟。
- 搜尋不得殘留舊版 `/meidi-home/` 對外導流。
- 發布 GitHub Pages 前確認沒有新增秘密、私人聯絡資料或未授權案例照片。
