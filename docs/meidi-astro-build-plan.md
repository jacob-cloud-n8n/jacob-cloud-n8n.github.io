# 美地居家收納 Astro 建置準備

## 目前方向

- 客戶已確認 Stitch 版本作為正式設計方向。
- 舊版 `public/meidi-home/` 已移除，保留 `public/meidi-home-stitch/` 作為目前唯一美地預覽。
- 小牧人既有 Astro routes、Notion CMS、Zeabur 設定與正式站路由不應因美地建置被改動。

## 建置邊界

- 先保留靜態預覽路徑：`/meidi-home-stitch/`。
- 若進入正式 Astro 化，建議建立獨立路由命名空間，不與小牧人頁面共用內容資料。
- 下一階段準備將文案、圖片與服務分類抽成結構化資料，再接 Notion 維護資料庫。

## 已有頁面

- `index.html`：首頁、品牌主張、空間分類、心動馬上行動。
- `about.html`：關於美地、空間規劃邏輯、納爺體系。
- `team.html`：收納團隊、華琍老師背書、社群與培訓資訊。
- `services.html`：服務項目、搬家打包、全屋整理與擴充服務佔位。
- `portfolio.html`：精選案例與 Before / After 分類佔位。
- `booking.html`：流程、報價、預約聯繫。
- `review.html`：審稿註記板，不掛主選單。

## 待補資料

- 正式 LINE URL。
- 服務區域與交通/加價規則。
- 可公開的證書圖片。
- 已授權且去識別化的 Before / After 案例照片。
- FB、IG、Threads 正式連結。
- Notion workspace 與每個資料庫的正式名稱。
- 是否需要表單寫入 Notion 訂單/諮詢資料庫。
- 正式網域與 Zeabur 專案名稱。
- 隱私權政策、表單同意文字與個資用途說明。

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

## 驗證清單

- 靜態預覽建置：`ASTRO_OUTPUT=static pnpm run build`
- 確認 `/meidi-home-stitch/` 與 `/meidi-home-stitch/review.html` 可正常開啟。
- 搜尋不得殘留舊版 `/meidi-home/` 對外導流。
- 發布 GitHub Pages 前確認沒有新增秘密、私人聯絡資料或未授權案例照片。
