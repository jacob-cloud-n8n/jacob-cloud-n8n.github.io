# 小牧人羊奶官網

Astro 官網專案，依據 Stitch 設計稿與最新頁面截圖建立六個頁面：

- `/` 首頁
- `/milestones/` 小牧人大事記
- `/products/` 商品廚窗
- `/news/` 最新消息列表
- `/news/spring-chocolate-goat-milk/` 最新消息內頁
- `/delivery/` 配送方案
- `/order/` 填寫訂單
- `/line/` 加入官方 Line
- `/meidi-home-stitch/` 美地居家收納獨立網站

`/brand-story/` 與 `/guangfu/` 保留為舊連結轉址。

## 本機啟動

```bash
pnpm install
pnpm run dev
```

此專案已提供 `pnpm-lock.yaml` 與 `packageManager` 設定。若本機沒有 pnpm，可先安裝 pnpm，或交由 Zeabur/GitHub CI 依 lockfile 安裝依賴。

## 環境變數

複製 `.env.example` 後填入：

- `NOTION_TOKEN`
- `NOTION_HOME_DB_ID`
- `NOTION_PRODUCT_DB_ID`
- `NOTION_BRAND_DB_ID`
- `NOTION_NEWS_DB_ID`
- `NOTION_DELIVERY_DB_ID`
- `NOTION_DELIVERY_PAGE_DB_ID`
- `NOTION_LINE_DB_ID`
- `NOTION_ORDER_DB_ID`
- `NOTION_CACHE_SECONDS`
- `PUBLIC_SITE_URL`
- `PUBLIC_SITE_VARIANT`：預設留空；美地 Zeabur 獨立服務可設為 `meidi`，讓根目錄導向 `/meidi-home-stitch/`
- `PUBLIC_LINE_URL`
- `PUBLIC_NAVIGATION_NAME`
- `PUBLIC_NAVIGATION_ADDRESS`
- `N8N_REDEPLOY_WEBHOOK`
- `NOTION_MEIDI_HOME_DB_ID`
- `NOTION_MEIDI_ABOUT_DB_ID`
- `NOTION_MEIDI_TEAM_DB_ID`
- `NOTION_MEIDI_SERVICES_DB_ID`
- `NOTION_MEIDI_PORTFOLIO_DB_ID`
- `NOTION_MEIDI_BOOKING_DB_ID`
- `NOTION_MEIDI_INQUIRY_DB_ID`

首頁「導航到小牧人羊奶」會使用 `PUBLIC_NAVIGATION_NAME` 與 `PUBLIC_NAVIGATION_ADDRESS` 組成 Google 地圖搜尋連結。市集活動時只要更新地址即可切換導航目的地。

Notion 沒有設定時會使用 `src/lib/content.ts` 的乾淨 fallback 資料，不會把 Notion 原始 JSON 傳到前端。

Zeabur SSR 模式會在伺服器端讀取 Notion。`NOTION_CACHE_SECONDS` 預設可設為 `60`，代表 Notion 圖文更新後最多約 60 秒內會同步到網站；若正在密集編輯，可暫時調低為 `10` 或 `0`。

首頁、最新消息列表、大事記、配送方案與加入 Line 頁面的區塊文案可由各自的頁面維護資料庫管理。每列的 `名稱` 或 `品牌說明` 欄位使用前台 key，例如 `home.hero.title`、`news.hero.description`、`line.benefits.1.title`；`前台位置` 說明該資料對應到網站哪個圖文位置。

配送方案的「確認訂閱」會前往 `/order/`。正式部署在 Zeabur 時，請設定 `NOTION_ORDER_DB_ID`，訂單會由網站後端寫入 Notion「訂單資訊」資料庫，後續通知 Line 由 Notion/n8n 自動化處理。若 Notion 寫入失敗，系統會開啟 Line 訊息備援，讓顧客手動送出。

美地居家收納使用獨立路徑 `/meidi-home-stitch/`，內容由「收納天地」頁面底下的六個資料庫維護：首頁、關於美地、收納團隊、服務項目、精選案例、預約聯繫。每列以 `名稱` 欄位存放前台 key，例如 `home.hero.title`、`team.social.facebook`、`booking.qr.image`；文字放在 `文字內容`，圖片放在 `圖片` 或 `圖片網址`，按鈕放在 `按鈕文字` 與 `按鈕連結`。預約表單會寫入 `NOTION_MEIDI_INQUIRY_DB_ID` 指定的「美地諮詢表單」資料庫。

若要把同一份程式部署成美地獨立 Zeabur 服務，請在該服務設定 `PUBLIC_SITE_VARIANT=meidi`；原小牧人服務不要設定此值，即可維持小牧人首頁。

## Notion Schema

### Product_DB

| 屬性 | 型別 | 用途 |
| --- | --- | --- |
| Name | Title | 產品名稱 |
| Price | Number | 產品定價 |
| Category | Select | 鮮乳 / 優酪乳 / 特調飲品 / 甜點 / 贈品 |
| Cover | Files & media | 產品主圖 |
| Description | Text | 卡片短描述 |
| IsActive | Checkbox | 是否顯示 |

### Brand_DB

| 屬性 | 型別 | 用途 |
| --- | --- | --- |
| Title | Title | 標題 |
| Type | Select | 最新消息 / 大事記 / 品牌介紹 / 頁面文案 |
| Date | Date | 日期 |
| RichContent | Rich text | 詳細內容 |
| Cover / Image | Files & media | 圖片 |
| Order | Number | 顯示排序 |

### Page Copy

若要讓各頁主標、副文案或重點圖片由 Notion 替換，請在 `Brand_DB` 新增：

| 屬性 | 值 |
| --- | --- |
| Type | 頁面文案 |
| Title | 文案 key，例如 `home.hero.title` |
| RichContent | 顯示文字 |
| Cover / Image | 替換圖片，可選 |

常用 key 包含：`home.hero.title`、`home.hero.description`、`products.hero.title`、`delivery.hero.title`、`news.hero.title`、`milestones.hero.title`、`line.hero.title`、`order.hero.title`。

### News_DB

若設定 `NOTION_NEWS_DB_ID`，新聞列表與首頁最新三則會由此資料庫讀取：`名稱`、`類型`、`Slug`、`Date`、`Excerpt`、`Category`、`Cover`、`Content`、`HighlightTitle`、`HighlightContent`、`YoutubeUrl`、`SideImage`、`SideTitle`、`SidePrice`、`SideNote`、`IsActive`。`類型=消息` 會顯示為文章；`類型=頁面文案` 僅供列表頁標題與說明使用。文章內頁右側卡片可透過 `Side*` 欄位替換圖片與文案。

商品廚窗的頁面文案也可放在產品資料庫中，使用 `產品名稱` 欄位存放前台 key，例如 `products.note.title`、`products.note.image`、`products.sweets.extra.title`；文字放在 `產品簡介`，圖片放在 `產品照片`。

網站已支援常見中文欄位別名，例如產品可使用 `產品名稱`、`產品價格`、`產品分類`、`產品照片`、`產品簡介`；新聞可使用 `標題`、`摘要`、`內容`、`影片網址`。仍建議固定欄位命名，避免多人編輯時混淆。

### Delivery_DB

可選。若設定 `NOTION_DELIVERY_DB_ID`，配送方式會由此資料庫讀取：`Area`、`Schedule`、`Method`、`Minimum`、`Note`、`IsActive`。

### Order_DB

訂單送出後會寫入 `NOTION_ORDER_DB_ID` 指定的 Notion 資料庫。小牧人目前使用「訂單資訊」資料庫：

| 屬性 | 型別 | 用途 |
| --- | --- | --- |
| 姓名 | Title | 顧客姓名 |
| 電話 | Text | 聯絡電話 |
| 7-11取貨門市 | Text | 配送地點或配送門市 |
| 備註 | Text | 方案、頻率、配送方式與顧客備註 |
| 狀態 | Status | 預設寫入「新訂單」 |

## 圖片

Stitch 來源素材已輸出為 `public/images/*.webp`，用於提高載入速度。
