# 美地居家收納 Astro 建置準備

## 目前方向

- 客戶已確認 Stitch 版本作為正式設計方向。
- 舊版 `public/meidi-home/` 已移除，保留 `public/meidi-home-stitch/` 作為目前唯一美地預覽。
- 小牧人既有 Astro routes、Notion CMS、Zeabur 設定與正式站路由不應因美地建置被改動。

## 建置邊界

- 先保留靜態預覽路徑：`/meidi-home-stitch/`。
- 若進入正式 Astro 化，建議建立獨立路由命名空間，不與小牧人頁面共用內容資料。
- 視後續需求再把文案抽成結構化資料；正式上線前可再評估 Notion 維護欄位。

## 已有頁面

- `index.html`：首頁、品牌主張、空間分類、核心導流。
- `about.html`：關於美地、方法論、納爺體系。
- `team.html`：收納團隊、華琍老師背書、社群與培訓資訊。
- `services.html`：服務項目與六大空間分類。
- `portfolio.html`：精選案例與 Before / After 分類佔位。
- `booking.html`：流程、報價、預約聯繫。
- `review.html`：審稿註記板，不掛主選單。

## 待補資料

- 正式 LINE URL。
- 服務區域與交通/加價規則。
- 可公開的證書圖片。
- 已授權且去識別化的 Before / After 案例照片。
- FB、IG、Threads 正式連結。

## 驗證清單

- 靜態預覽建置：`ASTRO_OUTPUT=static pnpm run build`
- 確認 `/meidi-home-stitch/` 與 `/meidi-home-stitch/review.html` 可正常開啟。
- 搜尋不得殘留舊版 `/meidi-home/` 對外導流。
- 發布 GitHub Pages 前確認沒有新增秘密、私人聯絡資料或未授權案例照片。
