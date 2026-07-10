# 最新消息發布 Runbook

本文件給 agent 在 Jacob 透過 Telegram 拍板後發布小牧人官網公告使用。目標是「新增一則消息，不改頁面程式碼」。

## 一、發布邊界

- 正式站：`https://shepherd.zeabur.app/`
- 最新消息列表：`/news/`
- 最新消息內頁：`/news/<slug>/`
- 主要內容來源：Notion `News_DB`，由 `NOTION_NEWS_DB_ID` 指定。
- fallback 內容：`src/lib/content.ts` 的 `fallbackNews`，只在 Notion 不可用或需要離線 build fixture 時使用。
- 禁止事項：不碰訂單 workflow、不碰 Line OA 設定、不改 Notion DB schema、不發布未經 Jacob 明確 OK 的內容。

## 二、Notion 發布欄位

新增一列消息時，至少填以下欄位：

| 欄位 | 建議型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `名稱` / `Title` | title | 是 | 文章標題 |
| `類型` / `Type` | select | 是 | 填 `消息`；`頁面文案` 不會出現在列表 |
| `Slug` | rich text | 是 | URL 代碼，使用小寫英文與連字號，例如 `holiday-delivery-2026-07-10` |
| `Date` / `日期` | date | 是 | 發布日期 |
| `Excerpt` / `摘要` | rich text | 是 | 列表卡片短摘要 |
| `Category` / `分類` | select | 建議 | 例如 `配送公告`、`新品上市`、`活動通知` |
| `Cover` / `圖片` | files | 建議 | 未填時使用 `/images/goat-field.webp` |
| `Content` / `內容` | rich text | 是 | 內文段落；每段用空行或換行分隔 |
| `HighlightTitle` | rich text | 建議 | 文章重點標題 |
| `HighlightContent` | rich text | 建議 | 文章重點內容 |
| `IsActive` / `發布` | checkbox | 是 | 勾選才發布 |

可選欄位：

| 欄位 | 用途 |
| --- | --- |
| `YoutubeUrl` / `影片網址` | 文章內頁嵌入 YouTube |
| `SideImage` / `SideTitle` / `SidePrice` / `SideNote` | 舊欄位；目前文章側欄改顯示下一則消息，可保留不用 |

## 三、Telegram 拍板流程

目前 n8n 事件工作流已支援：

1. Jacob 發 `公告 <內容>`。
2. n8n 建立草稿回覆，內容標示尚未發布。
3. Jacob 回 `公告OK` 或 `公告取消`。

在正式自動寫入 Notion/Git 前，agent 必須把 `公告OK` 當成發布授權，然後依本 runbook 進行 Notion 新增與驗收。不得在 `公告OK` 前發布。

## 四、發布步驟

### A. Notion 正式發布

1. 依 Telegram 草稿整理標題、摘要、內文與 slug。
2. 在 News_DB 新增一列，`類型=消息`，`IsActive=true`。
3. 等待 `NOTION_CACHE_SECONDS`，預設約 60 秒。
4. 驗收列表與內頁。

### B. fallback 檔案發布

只有在 Notion 不可用、Jacob 明確同意用 Git fallback 發布時才使用。

1. 編輯 `src/lib/content.ts` 的 `fallbackNews`，新增一筆 `NewsItem`。
2. slug 必須穩定，不可使用中文空白或日期以外的臨時字串。
3. 跑 build。
4. 需要上正式站時，走 Zeabur direct deploy，不靠 GitHub push 自動部署。

## 五、驗收指令

把 `<slug>` 與 `<keyword>` 換成實際內容：

```bash
pnpm run build
curl -sI https://shepherd.zeabur.app/news/ | head
curl -s https://shepherd.zeabur.app/news/ | grep '<keyword>'
curl -sI https://shepherd.zeabur.app/news/<slug>/ | head
curl -s https://shepherd.zeabur.app/news/<slug>/ | grep '<keyword>'
```

若只是 Notion 更新，通常不需要 redeploy；若改了 fallback 程式碼才需要部署。

## 六、Zeabur 部署

正式部署只使用既有 service：

```bash
npx zeabur deploy --project-id 69b3aa82da87c2b9576efd83 --service-id service-69f4a2e29df7668d96a5b52f -i=false
```

部署後驗收：

```bash
curl -sI https://shepherd.zeabur.app/
curl -sI https://shepherd.zeabur.app/news/
curl -sI https://shepherd.zeabur.app/news/<slug>/
```

## 七、完成回報

回報至少包含：

- Jacob 拍板來源：Telegram `公告OK` 的時間或 execution ID。
- 發布方式：Notion 或 fallback Git。
- slug 與正式 URL。
- 驗收結果：列表 200、內頁 200、關鍵字命中。
- 未完成項：例如等待圖片、等待 Notion 權限或等待正式部署。
