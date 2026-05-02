# 小牧人羊奶官網 Cockpit

Last updated: 2026-05-02

## Current Status

- Astro 官網專案已存在並有 Git 版本控制。
- Remote: `https://github.com/jacob-cloud-n8n/jacob-cloud-n8n.github.io.git`
- Branch: `main`
- README、`.gitignore`、`pnpm-lock.yaml`、Zeabur 設定與 GitHub Pages workflow 已存在。
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

## Deployment

- Zeabur: 使用 `zeabur.json`，預期為 server output。
- GitHub Pages: 使用 `.github/workflows/deploy-pages.yml`，預期為 static output。
- GitHub Pages workflow 目前包含產品與品牌 Notion 變數；若要讓 preview 也載入新聞、配送或訂單相關內容，需補上對應 secrets 或 vars。

## Environment Checklist

- `NOTION_TOKEN`
- `NOTION_PRODUCT_DB_ID`
- `NOTION_BRAND_DB_ID`
- `NOTION_NEWS_DB_ID`
- `NOTION_DELIVERY_DB_ID`
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
