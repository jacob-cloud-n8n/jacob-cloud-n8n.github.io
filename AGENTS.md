# Project Working Rules

## Project

- Name: 小牧人羊奶官網
- Folder: `/Users/jacob/Documents/New project 2`
- Runtime: Astro 5, Node adapter, pnpm
- Primary deploy target: Zeabur server build
- Preview deploy target: GitHub Pages static workflow
- Project cockpit: `docs/project-cockpit.md`

## Commands

- Install dependencies: `pnpm install`
- Local development: `pnpm run dev`
- Production build: `pnpm run build`
- Production start after build: `pnpm run start`
- Static GitHub Pages build: `ASTRO_OUTPUT=static pnpm run build`

## Content And Data

- Editable content comes from Notion when the relevant environment variables are present.
- Fallback content lives in `src/lib/content.ts` and must stay clean enough for local builds without Notion credentials.
- Page copy mapping lives in `src/lib/page-copy.ts`.
- Notion access code lives in `src/lib/notion.ts`.
- Order submissions are handled by `src/pages/api/order.ts` and write to `NOTION_ORDER_DB_ID` when configured.

## Environment

- Keep real secrets out of Git. `.env` is ignored.
- Document required variables in `.env.example` and `README.md` when adding new integrations.
- Current known variables:
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

## Deployment Notes

- Zeabur uses `zeabur.json` with `pnpm run build` and `node ./dist/server/entry.mjs`.
- GitHub Pages uses `.github/workflows/deploy-pages.yml` and sets `ASTRO_OUTPUT=static`.
- Keep server-only behavior behind runtime checks or fallback paths so static preview builds remain usable.

## Git Hygiene

- Preserve user changes and existing Git history.
- Before edits, inspect current status and relevant files.
- Keep changes scoped to the requested task.
- Do not commit or push unless the user asks.

## Privacy

- Do not commit real customer information, private Notion data, tokens, or webhook URLs.
- If any student/classroom feature is added later, store student data by class code and seat number only, never real names.
