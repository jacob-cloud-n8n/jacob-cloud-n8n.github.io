# 小牧人羊奶官網 Cockpit

Last updated: 2026-05-03

## Current Status

- Astro 官網專案已存在並有 Git 版本控制。
- Remote: `https://github.com/jacob-cloud-n8n/jacob-cloud-n8n.github.io.git`
- Branch: `main`
- README、`.gitignore`、`pnpm-lock.yaml`、Zeabur 設定與 GitHub Pages workflow 已存在。
- 最新部署：`7d2b953 Stabilize Notion SSR content updates` 已推送並部署到 Zeabur `untitled`，正式服務狀態為 `RUNNING`。
- 正式網址：`https://xiaomuren-untitled-20260501.zeabur.app/`
- Firebase CLI 已登入，但此專案目前沒有 `firebase.json`、Firebase alias 或 active project。若未使用 Firebase，無需初始化。

## Runbook

- 本機開發：`pnpm run dev`
- 一般建置：`pnpm run build`
- 建置後啟動：`pnpm run start`
- GitHub Pages 靜態建置：`ASTRO_OUTPUT=static pnpm run build`

## Content Sources

- Notion 產品、品牌、新聞、配送與訂單資料由 `.env` 變數控制。
- 未設定 Notion 時，網站使用 `src/lib/content.ts` fallback 資料。
- 頁面文案 key 與圖片覆蓋邏輯在 `src/lib/page-copy.ts`。
- 訂單 API 在 `src/pages/api/order.ts`。
- Zeabur SSR 會在伺服器端讀取 Notion，並以 `NOTION_CACHE_SECONDS` 控制短快取。
- 產品與小牧人大事記已驗證可由 Notion 更新後呈現在正式網站。
- 首頁、最新消息列表、配送方案與加入 Line 已建立獨立 Notion 維護資料庫，用 `名稱` 欄位存放前台 key、`前台位置` 欄位註記網站位置。
- 最新消息資料庫同時管理列表頁文案與消息資料；`類型=消息` 會顯示在最新消息列表與首頁最新三則。
- 商品廚窗底部文案、甜點補充圖片、文章內頁右側卡片、Line QR 圖片與配送第三方案已補成 Notion 可維護欄位。

## Work Log

### 2026-05-02

- 依 `astro調整.md` 採用穩定版 SSR CMS 調整方向。
- 增加 Notion 短快取與欄位別名容錯，降低欄位命名差異造成的更新失敗。
- 將最新消息內頁改為 Zeabur SSR 動態讀取；靜態預覽模式仍可 prerender。
- 新增 CMS 圖片防呆樣式，避免全域圖片裁切影響 Logo、QR Code 或商品圖。
- 更新 README、AGENTS、專案 cockpit 與 `astro-notion-zeabur-site` 技能流程。
- 本機與正式 Zeabur 驗證商品頁、大事記頁、首頁與訂單頁均正常回應。

## Deployment

- Zeabur: 使用 `zeabur.json`，預期為 server output。
- GitHub Pages: 使用 `.github/workflows/deploy-pages.yml`，預期為 static output。
- GitHub Pages workflow 目前包含產品與品牌 Notion 變數；若要讓 preview 也載入新聞、配送或訂單相關內容，需補上對應 secrets 或 vars。

## Environment Checklist

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

## Next Steps

- 確認正式 Zeabur 環境已填入所有必要 Notion 與公開網址變數。
- 視需求補齊 GitHub Pages workflow 的新聞、配送與訂單資料庫變數。
- 每次調整 Notion schema 後，同步更新 README 與本 cockpit。
- Notion 密集編輯期間可把 `NOTION_CACHE_SECONDS` 調低；正式環境建議維持短快取以兼顧速度與即時性。

## Troubleshooting Notes

- Notion 未設定或讀取失敗時，先確認頁面是否仍可用 fallback content 建置。
- Zeabur 啟動失敗時，先確認 build output 為 server 並存在 `dist/server/entry.mjs`。
- GitHub Pages 預覽異常時，先確認 workflow 有設定 `ASTRO_OUTPUT=static`。
