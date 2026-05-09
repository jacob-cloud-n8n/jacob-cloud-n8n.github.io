# 小牧人羊奶官網 Cockpit

Last updated: 2026-05-09

## Current Status

- Astro 官網專案已存在並有 Git 版本控制。
- Remote: `https://github.com/jacob-cloud-n8n/jacob-cloud-n8n.github.io.git`
- Branch: `main`
- README、`.gitignore`、`pnpm-lock.yaml`、Zeabur 設定與 GitHub Pages workflow 已存在。
- 最新部署：`2907721 Fix Notion milestone parsing` 已推送並部署到 Zeabur `untitled`，正式服務狀態為 `RUNNING`。
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
- 最新消息內頁右側卡片目前顯示下一則消息的圖片、標題與摘要，按鈕導向下一則消息。

## Work Log

### 2026-05-09

- 客戶確認採用 Stitch 版本作為「美地居家收納」正式設計方向。
- 已刪除舊版美地靜態預覽 `public/meidi-home/`，目前只保留 `public/meidi-home-stitch/`。
- 依 `astro-notion-zeabur-site` 技能整理正式建置準備文件：`docs/meidi-astro-build-plan.md`。
- 新增審稿註記板 `public/meidi-home-stitch/review.html`，可逐頁檢視首頁、關於美地、收納團隊、服務項目、精選案例、預約聯繫並輸入調整註記。
- 美地建置仍維持獨立靜態路徑，不改動小牧人 Astro routes、Notion CMS、Zeabur 設定或正式站路由。
- 依審稿註記調整 Stitch 版：首頁刪除「/ 方法論」、搬家打包獨立成分類、首頁導流標題改為「心動馬上行動」、服務頁新增搬家打包與 2 個擴充服務佔位、關於美地師承區標籤改為「師承研究室」。
- 已補充 `docs/meidi-astro-build-plan.md` 的 Notion 串接建議步驟，包含資料庫規劃、fallback content、表單寫入、Zeabur env vars、隱私與授權檢查。
- 已補入美地官方 LINE QR、LINE 連結、Facebook 連結、服務證書、車馬費另報與表單隱私提醒；IG / Threads 暫保留待補。
- 客戶已建立美地 Notion 入口頁，已新增 `docs/meidi-notion-schema.md` 規劃各頁文案、圖片、服務、案例、團隊與諮詢表單資料庫。
- 已將六個美地頁面資料庫補齊可維護欄位，並新增 `美地諮詢表單` Notion database；Astro 版 `/meidi-home-stitch/` 會讀取美地專用資料庫，表單寫入美地諮詢資料庫。

### 2026-05-08

- 依客戶確認流程，將 Stitch 視覺設計初稿整理成第二套「美地居家收納」客戶預覽。
- 新版採獨立靜態路徑 `public/meidi-home-stitch/`，與當時既有 `public/meidi-home/` 並存，不影響小牧人 Astro 頁面、Notion CMS、Zeabur 設定或正式站路由。
- Stitch 版已拆成多頁式結構：首頁、關於美地、收納團隊、服務項目、精選案例、預約聯繫。
- 已依規劃資料修正：導覽列改為繁中；首頁移除內部「網站架構藍圖 / 導流動線」內容，改為客戶可見的六大空間分類；關於美地刪除與收納團隊重複的資歷與社群區塊。
- 已納入客戶提供素材與內容：美地 logo、華琍老師形象照、納爺體系培訓照片、流程與報價圖、品牌方法論、服務分類、流程與報價。
- 已提交並推送 `bcff254 Add Meidi Stitch preview`，手動觸發 GitHub Pages workflow 成功完成部署。
- Stitch 版客戶預覽網址：`https://jacob-cloud-n8n.github.io/meidi-home-stitch/`，已確認公開網址回應 `200`。

### 2026-05-07

- 使用 `huashu-design` 技能替「美地居家收納」建立客戶確認用網站初稿。
- 美地預覽採獨立靜態路徑 `public/meidi-home/`，不改動小牧人既有 Astro 頁面、Notion CMS、Zeabur 設定或正式站路由。
- 已拆成多頁式結構：首頁、服務項目、理念與師承、華琍老師、案例展示、流程與報價、預約諮詢。
- 已納入客戶提供素材：美地 logo、華琍老師形象照、納爺體系培訓照片、流程與報價圖。
- 已將客戶預覽部署到 GitHub Pages：`https://jacob-cloud-n8n.github.io/meidi-home/`。
- 已提交並推送 `5d0342c Add Meidi Home client preview`，GitHub Pages workflow 已成功完成部署並確認預覽網址回應 `200`。
- 本機 `design-drafts/` 僅作草稿工作區，已加入 `.gitignore`，避免後續收工或部署時誤提交工作草稿。

### 2026-05-05

- 修正首頁精選商品：改用固定首頁商品槽位，不再直接取產品資料庫前三筆，避免 Notion 產品排序或新增商品時自動換掉首頁圖文。
- 修正首頁訂閱區：移除沒有送出功能的 Email/電話輸入框，改為「前往商品廚窗」與「導航到小牧人羊奶」兩顆按鈕。
- 導航按鈕使用 `PUBLIC_NAVIGATION_NAME` 與 `PUBLIC_NAVIGATION_ADDRESS` 產生 Google Maps 連結，未來參加市集活動可改變定位目的地。
- 已在 Notion「新官網首頁」資料庫補齊首頁三張精選商品卡維護欄位：`home.products.1.*`、`home.products.2.*`、`home.products.3.*`，每張卡包含 `sourceName`、`name`、`desc`、`price`、`image`。
- 修正大事記資料不足時的 fallback：當 Notion 只讀到 1 筆大事記時，不再覆蓋完整 timeline，會回到原本 5 筆完整列表。
- 再次修正大事記資料來源：改由品牌介紹資料庫中符合大事記圖文格式的 Notion 列產生 timeline，不再假設資料列必須連續排列在「小牧人大事記」標題下。
- 補充專案規則：修特定頁面時不得動到無關頁面；若需調整共用程式或同步影響其他頁面，需先說明原因並取得確認。
- 已將這次問題更新到 `astro-notion-zeabur-site` 技能，提醒後續專案首頁精選商品不可使用 `getProducts().slice(0, 3)`，CTA 區塊也不能保留無功能輸入欄，大事記不可用連續區段假設判斷 Notion 資料。
- Server build 與 Static preview build 均已驗證通過。

### 2026-05-04

- 修正配送方案頁：選擇「單次訂購」時，訂單摘要會同步更新瓶數、單瓶均價與總金額，確認訂閱連結會帶入正確方案與配送頻率。
- 修正訂單頁：已選方案會依 URL 參數更新，新增 `Line ID` 欄位，送出時會一起寫入 Notion 訂單備註與 LINE 備援訊息。
- 補齊配送方案與訂單表單的 Notion 可維護欄位，包含配送方式卡片、摘要標籤、按鈕文字、表單 label 與 placeholder。
- 修正 Notion database query 分頁讀取，避免頁面維護資料超過 50/100 筆後，新欄位無法被前台讀到。
- 已將這次問題更新到 `astro-notion-zeabur-site` 技能，避免後續專案再次漏掉配送/訂單狀態同步與 Notion 分頁查詢。
- Server build 通過，提交 `9a11ae2` 已推送並部署到 Zeabur，正式服務狀態為 `RUNNING`。
- 修正加入官方 Line 頁的「立即掃描加入」按鈕：按鈕改連到官方 LINE 加好友連結 `https://lin.ee/xFMuRx5`，QR 圖仍使用官方 QR 圖網址。
- 修正 Notion `line.cta.url` 欄位誤貼官方 HTML 片段造成 `/line/<a...>` 404 的問題；前台已加入 URL 正規化，會自動從官方 HTML 中抽出 `lin.ee` 或 `line.me` 連結。
- 同步更新 Notion `line.cta.url` 為乾淨 URL，並更新 `astro-notion-zeabur-site` 技能，將此流程納入後續同類專案規則。
- Server build、Static preview build 與 Zeabur 正式部署均已驗證通過。

### 2026-05-03

- 建立並串接首頁、最新消息、配送方案、加入官方 Line 的獨立 Notion 頁面維護資料庫。
- 商品廚窗保留原產品資料庫，新增 `products.note.*` 與 `products.sweets.extra.title` 等可維護前台欄位。
- 最新消息資料庫新增文章內頁右側卡片欄位：`SideImage`、`SideTitle`、`SidePrice`、`SideNote`。
- 配送方案新增可維護的「單次訂購」方案欄位，前台會同步更新訂單摘要。
- 加入官方 Line 頁改為讀取 Notion 的 QR 圖片，避免使用假圖。
- Server build、Static preview build 與 Zeabur 正式部署均已驗證通過。
- 依最新標示修正消息內頁右側卡片與商品廚窗甜點補充圖片欄位：側欄改為下一則消息導覽，甜點補充圖改為 90% 欄位置中顯示。
- 修正後已重新建置、推送並部署到 Zeabur，部署狀態為 `RUNNING`。

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

- 美地居家：客戶已確認採用 Stitch 版預覽 `https://jacob-cloud-n8n.github.io/meidi-home-stitch/`；下一步依 `public/meidi-home-stitch/review.html` 標註修改點，正式上線前需補 LINE 官方 URL、服務區域、證書圖片與已授權且去識別化的案例照片。
- 確認正式 Zeabur 環境已填入所有必要 Notion 與公開網址變數。
- 視需求補齊 GitHub Pages workflow 的新聞、配送與訂單資料庫變數。
- 每次調整 Notion schema 後，同步更新 README 與本 cockpit。
- Notion 密集編輯期間可把 `NOTION_CACHE_SECONDS` 調低；正式環境建議維持短快取以兼顧速度與即時性。

## Troubleshooting Notes

- Notion 未設定或讀取失敗時，先確認頁面是否仍可用 fallback content 建置。
- Zeabur 啟動失敗時，先確認 build output 為 server 並存在 `dist/server/entry.mjs`。
- GitHub Pages 預覽異常時，先確認 workflow 有設定 `ASTRO_OUTPUT=static`。
