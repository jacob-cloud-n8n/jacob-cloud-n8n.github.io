# 小牧人羊奶官網

Astro 官網專案，依據 Stitch 設計稿與最新頁面截圖建立六個頁面：

- `/` 首頁
- `/milestones/` 小牧人大事記
- `/products/` 商品廚窗
- `/news/spring-chocolate-goat-milk/` 最新消息內頁
- `/delivery/` 配送方案
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
- `NOTION_PRODUCT_DB_ID`
- `NOTION_BRAND_DB_ID`
- `PUBLIC_SITE_URL`
- `PUBLIC_LINE_URL`
- `PUBLIC_NAVIGATION_NAME`
- `PUBLIC_NAVIGATION_ADDRESS`
- `N8N_REDEPLOY_WEBHOOK`

首頁「導航到小牧人羊奶」會使用 `PUBLIC_NAVIGATION_NAME` 與 `PUBLIC_NAVIGATION_ADDRESS` 組成 Google 地圖搜尋連結。市集活動時只要更新地址即可切換導航目的地。

Notion 沒有設定時會使用 `src/lib/content.ts` 的乾淨 fallback 資料，不會把 Notion 原始 JSON 傳到前端。

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
| Type | Select | 最新消息 / 大事記 / 品牌介紹 |
| Date | Date | 日期 |
| RichContent | Rich text | 詳細內容 |
| Order | Number | 顯示排序 |

## 圖片

Stitch 來源素材已輸出為 `public/images/*.webp`，用於提高載入速度。
