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
- `PUBLIC_LINE_URL`
- `PUBLIC_NAVIGATION_NAME`
- `PUBLIC_NAVIGATION_ADDRESS`
- `N8N_REDEPLOY_WEBHOOK`

首頁「導航到小牧人羊奶」會使用 `PUBLIC_NAVIGATION_NAME` 與 `PUBLIC_NAVIGATION_ADDRESS` 組成 Google 地圖搜尋連結。市集活動時只要更新地址即可切換導航目的地。

Notion 沒有設定時會使用 `src/lib/content.ts` 的乾淨 fallback 資料，不會把 Notion 原始 JSON 傳到前端。Cloudflare Pages 版會在建置時讀取 Notion，因此 Notion 內容變更後必須重新觸發一次 Pages 建置才會更新；舊 Zeabur SSR 模式則仍可使用 `NOTION_CACHE_SECONDS` 做短快取。

首頁、最新消息列表、大事記、配送方案與加入 Line 頁面的區塊文案可由各自的頁面維護資料庫管理。每列的 `名稱` 或 `品牌說明` 欄位使用前台 key，例如 `home.hero.title`、`news.hero.description`、`line.benefits.1.title`；`前台位置` 說明該資料對應到網站哪個圖文位置。

配送方案的「確認訂閱」會前往 `/order/`。Cloudflare Pages 正式環境請同時設定 `NOTION_TOKEN` 與 `NOTION_ORDER_DB_ID`；`/api/order` 由 Pages Function 寫入 Notion「訂單資訊」資料庫，後續通知 Line 由 Notion/n8n 自動化處理。若變數未設定或 Notion 寫入失敗，回應格式不變，系統會開啟 Line 訊息備援，讓顧客手動送出。

## 部署到 Cloudflare Pages

本專案採「Astro 靜態頁面 + Cloudflare Pages Function」：網站內容在建置時從 Notion 取回並輸出成靜態檔，只有 `/api/order` 使用 Functions。因為目前唯一需要執行期後端的功能是訂單 API，所以不需要把整站改成 Cloudflare SSR adapter；一般頁面不會產生 Functions invocation。

在 Cloudflare Pages 後台填入：

| 設定 | 值 |
| --- | --- |
| Production branch | `main`（完成 Claude 驗收並合併後才使用） |
| Build command | `pnpm run build:cloudflare` |
| Build output directory | `dist` |
| Root directory | 留空（代表 repo 根目錄） |
| Node.js | `22.16.0`，以環境變數 `NODE_VERSION=22.16.0` 固定 |
| pnpm | `10.33.2`，以環境變數 `PNPM_VERSION=10.33.2` 固定 |

Cloudflare Pages 的環境變數名稱如下。`NOTION_TOKEN` 必須設為加密 secret；資料庫 ID 與公開網址可設為一般變數，但仍不應寫入程式碼。Production 與 Preview 環境請分別確認：

- 建置時 Notion 內容：`NOTION_TOKEN`、`NOTION_HOME_DB_ID`、`NOTION_PRODUCT_DB_ID`、`NOTION_BRAND_DB_ID`、`NOTION_NEWS_DB_ID`、`NOTION_DELIVERY_DB_ID`、`NOTION_DELIVERY_PAGE_DB_ID`、`NOTION_LINE_DB_ID`
- 訂單 Function 執行時：`NOTION_TOKEN`、`NOTION_ORDER_DB_ID`
- 公開網站設定：`PUBLIC_SITE_URL`、`PUBLIC_LINE_URL`、`PUBLIC_NAVIGATION_NAME`、`PUBLIC_NAVIGATION_ADDRESS`
- 過渡相容／選用：`NOTION_CACHE_SECONDS`（靜態建置不會在建置後自動刷新）、`N8N_REDEPLOY_WEBHOOK`（目前程式未直接使用）
- 建置工具：`NODE_VERSION`、`PNPM_VERSION`；可另設 `ASTRO_TELEMETRY_DISABLED=1`

本機建置與 Pages Functions 預覽：

```bash
pnpm run build:cloudflare
pnpm run preview:cloudflare
```

`public/_routes.json` 只讓 `/api/*` 進入 Functions；其他路徑直接使用 `dist` 靜態檔。`public/_redirects` 保留下列舊連結：

| 舊路徑 | 新路徑 | 狀態碼 |
| --- | --- | --- |
| `/brand-story`、`/brand-story/` | `/milestones/` | `301` |
| `/guangfu`、`/guangfu/` | `/delivery/` | `302` |

### Notion 更新後讓網站重新建置

靜態網站不會在 Notion 儲存後立即改變。可在 Cloudflare Pages 的 Deployments 頁面手動重試／建立部署；日後也可在 Pages 專案的 Settings → Builds 建立綁定 `main` 的 Deploy Hook，再由 n8n 在內容發布後對該 hook 發送 `POST`。Deploy Hook URL 等同部署密鑰，必須放在 n8n credential 或 secret 中，不可寫入 repo。本分支只保留操作說明，沒有建立或呼叫任何 hook。

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

最新消息發布流程請見 [`docs/news-publishing-runbook.md`](docs/news-publishing-runbook.md)。這份 runbook 是給 agent 依 Jacob 拍板後發布公告用，包含 Notion 欄位、fallback 檔案、驗收指令與 Zeabur 部署邊界。

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
