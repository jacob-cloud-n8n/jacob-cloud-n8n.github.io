import {
  deliveryMethods,
  fallbackBrandEntries,
  fallbackNews,
  fallbackProducts,
  milestoneEntries,
  type BrandEntry,
  type DeliveryMethod,
  type NewsItem,
  type PageCopy,
  type Product
} from "./content";

const notionVersion = "2022-06-28";
const defaultProductDatabaseId = "35089dd14f0a804480fad43c37044ef4";
const defaultBrandDatabaseId = "35089dd14f0a80e199d0e0e1c9254815";
const defaultHomeDatabaseId = "35589dd14f0a8047963cc81164e2d217";
const defaultNewsDatabaseId = "35589dd14f0a808a985bfd50291f3f9b";
const defaultDeliveryPageDatabaseId = "35589dd14f0a8065a1b2d288d16c547f";
const defaultLineDatabaseId = "35589dd14f0a80a784f3cfc3246f6813";
const productCategories = new Set(["鮮乳", "優酪乳", "甜點", "特調飲品", "贈品"]);
const defaultCacheSeconds = 60;

type CacheEntry<T> = {
  expiresAt: number;
  value: T[];
};

const databaseCache = new Map<string, CacheEntry<any>>();

type NotionPage = {
  properties?: Record<string, any>;
};

function cacheSeconds(): number {
  const parsed = Number(import.meta.env.NOTION_CACHE_SECONDS ?? defaultCacheSeconds);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultCacheSeconds;
}

function normalizePropertyName(value: string): string {
  return value.replace(/[\s_\-：:()（）]/g, "").toLowerCase();
}

function propertyByNames(props: Record<string, any>, names: string[]): any {
  for (const name of names) {
    if (props[name]) return props[name];
  }

  const normalizedEntries = Object.entries(props).map(([key, value]) => [normalizePropertyName(key), value] as const);
  for (const name of names) {
    const normalizedName = normalizePropertyName(name);
    const match = normalizedEntries.find(([key]) => key === normalizedName || key.includes(normalizedName));
    if (match) return match[1];
  }

  return undefined;
}

function titleText(prop: any): string {
  return prop?.title?.map((item: any) => item.plain_text).join("") ?? "";
}

function richText(prop: any): string {
  return prop?.rich_text?.map((item: any) => item.plain_text).join("") ?? "";
}

function fileUrl(prop: any): string {
  const file = prop?.files?.[0];
  return file?.file?.url ?? file?.external?.url ?? "";
}

function checkbox(prop: any, fallback = true): boolean {
  return typeof prop?.checkbox === "boolean" ? prop.checkbox : fallback;
}

function selectName(prop: any): string {
  return prop?.select?.name ?? "";
}

function firstText(props: Record<string, any>, names: string[], reader: (prop: any) => string): string {
  for (const name of names) {
    const value = reader(propertyByNames(props, [name]));
    if (value) return value;
  }
  return "";
}

function firstFile(props: Record<string, any>, names: string[]): string {
  for (const name of names) {
    const value = fileUrl(propertyByNames(props, [name]));
    if (value) return value;
  }
  return "";
}

function firstNumber(props: Record<string, any>, names: string[], fallback = 0): number {
  for (const name of names) {
    const value = propertyByNames(props, [name])?.number;
    if (typeof value === "number") return value;
  }
  return fallback;
}

function firstSelect(props: Record<string, any>, names: string[], fallback = ""): string {
  for (const name of names) {
    const value = selectName(propertyByNames(props, [name]));
    if (value) return value;
  }
  return fallback;
}

function firstCheckbox(props: Record<string, any>, names: string[], fallback = true): boolean {
  for (const name of names) {
    const prop = propertyByNames(props, [name]);
    if (typeof prop?.checkbox === "boolean") return prop.checkbox;
  }
  return fallback;
}

function firstOptionalCheckbox(props: Record<string, any>, names: string[]): boolean | undefined {
  for (const name of names) {
    const prop = propertyByNames(props, [name]);
    if (typeof prop?.checkbox === "boolean") return prop.checkbox;
    const selected = selectName(prop);
    if (selected) return selected !== "停用";
  }
  return undefined;
}

function firstDate(props: Record<string, any>, names: string[], fallback = ""): string {
  for (const name of names) {
    const value = propertyByNames(props, [name])?.date?.start;
    if (value) return value;
  }
  return fallback;
}

function mergePageCopy(target: PageCopy, source: PageCopy): PageCopy {
  return {
    ...target,
    ...Object.fromEntries(Object.entries(source).filter(([, value]) => value.text || value.image))
  };
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function textList(value: string): string[] {
  return value
    .split(/\n{2,}|\r?\n- /)
    .map((item) => item.replace(/^- /, "").trim())
    .filter(Boolean);
}

function productCategory(value: string): Product["category"] {
  const aliases: Record<string, Product["category"]> = {
    鮮奶: "鮮乳",
    鮮乳系列: "鮮乳",
    甜點系列: "甜點",
    特調: "特調飲品"
  };
  if (aliases[value]) return aliases[value];
  return productCategories.has(value) ? (value as Product["category"]) : "鮮乳";
}

function milestoneFromChineseContent(page: NotionPage, order: number): BrandEntry | null {
  const props = page.properties ?? {};
  const rawTitle = titleText(props["品牌說明"]);
  const content = richText(props["內容"]) || richText(props["文字"]);
  const isMilestoneRow = rawTitle.includes("大事記") || (!rawTitle && Boolean(content));
  if (!isMilestoneRow || !content) return null;

  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] ?? rawTitle;
  const detail = lines.slice(1).join("\n") || content;

  return {
    title: firstLine || rawTitle || `小牧人大事記 ${order + 1}`,
    type: "大事記",
    date: "",
    richContent: detail || content,
    image: fileUrl(props["店面圖片"]) || "/images/goat-field.webp",
    order
  };
}

async function queryDatabase<T>(databaseId: string, mapper: (page: NotionPage, index: number) => T): Promise<T[]> {
  const token = import.meta.env.NOTION_TOKEN;
  if (!token || !databaseId) return [];
  const cacheKey = databaseId;
  const cached = databaseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value.map(mapper);

  const pages: NotionPage[] = [];
  let startCursor: string | undefined;

  do {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": notionVersion
      },
      body: JSON.stringify({ page_size: 100, start_cursor: startCursor })
    });

    if (!response.ok) {
      throw new Error(`Notion query failed: ${response.status}`);
    }

    const payload = await response.json();
    pages.push(...(payload.results ?? []));
    startCursor = payload.has_more ? payload.next_cursor : undefined;
  } while (startCursor);

  const ttl = cacheSeconds();
  if (ttl > 0) {
    databaseCache.set(cacheKey, {
      expiresAt: Date.now() + ttl * 1000,
      value: pages
    });
  }
  return pages.map(mapper);
}

export async function getProducts(): Promise<Product[]> {
  try {
    const products = await queryDatabase<Product>(import.meta.env.NOTION_PRODUCT_DB_ID || defaultProductDatabaseId, (page) => {
      const props = page.properties ?? {};
      const name = firstText(props, ["Name", "產品名稱", "商品名稱", "品名"], titleText);
      return {
        name,
        price: firstNumber(props, ["Price", "產品價格", "售價", "金額"]),
        category: productCategory(firstSelect(props, ["Category", "產品分類", "分類"], "鮮乳")),
        image: firstFile(props, ["Cover", "Image", "產品照片", "商品圖片", "照片", "圖片"]) || "/images/product-board.webp",
        desc: firstText(props, ["Description", "產品簡介", "商品介紹", "內容"], richText),
        isActive: firstCheckbox(props, ["IsActive", "上架狀況", "上架", "啟用"], true)
      };
    });
    const namedProducts = products.filter((product) => product.name && !product.name.includes("."));
    const activeProducts = namedProducts.filter((product) => product.isActive);
    return activeProducts.length > 0 ? activeProducts : namedProducts.length > 0 ? namedProducts : fallbackProducts;
  } catch (error) {
    console.warn(error);
    return fallbackProducts;
  }
}

export async function getBrandContent(fallback: BrandEntry[] = fallbackBrandEntries): Promise<BrandEntry[]> {
  try {
    const entries = await queryDatabase<BrandEntry>(import.meta.env.NOTION_BRAND_DB_ID || defaultBrandDatabaseId, (page, index) => {
      const props = page.properties ?? {};
      return {
        title: firstText(props, ["Title", "品牌說明", "標題", "名稱"], titleText),
        type: firstSelect(props, ["Type", "類型", "分類"], "品牌介紹") as BrandEntry["type"],
        date: firstDate(props, ["Date", "日期", "時間"]),
        richContent: firstText(props, ["RichContent", "Content", "內容", "文字"], richText),
        image: firstFile(props, ["Cover", "Image", "店面圖片", "圖片", "照片"]),
        order: firstNumber(props, ["Order", "排序", "順序"], index)
      };
    });
    const cleanEntries = entries.filter((entry) => entry.title).sort((a, b) => a.order - b.order);
    return cleanEntries.length > 0 ? cleanEntries : fallback;
  } catch (error) {
    console.warn(error);
    return fallback;
  }
}

export async function getMilestones(): Promise<BrandEntry[]> {
  try {
    const pages = await queryDatabase<NotionPage>(import.meta.env.NOTION_BRAND_DB_ID || defaultBrandDatabaseId, (page) => page);
    const milestones: BrandEntry[] = [];
    let inChineseMilestoneSection = false;

    pages.forEach((page, index) => {
      const props = page.properties ?? {};
      const rawTitle = titleText(props["品牌說明"]);
      if (rawTitle.includes("小牧人大事記")) {
        inChineseMilestoneSection = true;
      } else if (inChineseMilestoneSection && rawTitle) {
        inChineseMilestoneSection = false;
      }

      if (inChineseMilestoneSection) {
        const chineseMilestone = milestoneFromChineseContent(page, index);
        if (chineseMilestone) milestones.push(chineseMilestone);
        return;
      }

      if (props.Type?.select?.name === "大事記") {
        milestones.push({
          title: firstText(props, ["Title", "品牌說明", "標題"], titleText),
          type: "大事記",
          date: firstDate(props, ["Date", "日期", "時間"]),
          richContent: firstText(props, ["RichContent", "Content", "內容", "文字"], richText),
          image: firstFile(props, ["Cover", "Image", "店面圖片", "圖片", "照片"]),
          order: firstNumber(props, ["Order", "排序", "順序"], index)
        });
      }
    });

    milestones.sort((a, b) => a.order - b.order);
    return milestones.length > 0 ? milestones : milestoneEntries;
  } catch (error) {
    console.warn(error);
    return milestoneEntries;
  }
}

export async function getNews(): Promise<NewsItem[]> {
  try {
    const newsDatabaseId = import.meta.env.NOTION_NEWS_DB_ID || defaultNewsDatabaseId;
    if (newsDatabaseId) {
      const items = await queryDatabase<NewsItem & { isActive?: boolean }>(newsDatabaseId, (page) => {
        const props = page.properties ?? {};
        const type = firstSelect(props, ["Type", "類型"], "消息");
        const title = firstText(props, ["Title", "Name", "名稱", "標題", "消息標題"], titleText);
        const slug = firstText(props, ["Slug", "網址代碼", "代碼"], richText) || slugify(title);
        return {
          slug,
          date: firstDate(props, ["Date", "日期", "發布日期"])?.replaceAll("-", ".") ?? "",
          title,
          excerpt: firstText(props, ["Excerpt", "Description", "摘要", "簡介"], richText),
          category: firstSelect(props, ["Category", "分類", "類別"], "最新消息"),
          image: firstFile(props, ["Cover", "Image", "封面", "圖片", "照片"]) || "/images/goat-field.webp",
          content: textList(firstText(props, ["Content", "RichContent", "內容", "文章內容"], richText)),
          highlightTitle: firstText(props, ["HighlightTitle", "重點標題"], richText) || "小牧人提醒",
          highlightContent: firstText(props, ["HighlightContent", "重點內容"], richText),
          youtubeUrl: firstText(props, ["YoutubeUrl", "YouTube", "YouTube網址", "影片網址"], richText),
          sideImage: firstFile(props, ["SideImage", "側欄圖片", "右側圖片", "商品圖片"]),
          sideTitle: firstText(props, ["SideTitle", "側欄標題", "右側標題", "商品標題"], richText),
          sidePrice: firstText(props, ["SidePrice", "側欄價格", "右側價格", "商品價格"], richText),
          sideNote: firstText(props, ["SideNote", "側欄重點", "右側重點", "商品重點"], richText),
          isActive: type !== "頁面文案" && firstCheckbox(props, ["IsActive", "上架狀況", "發布", "啟用"], true)
        };
      });
      const activeItems = items
        .filter((item) => item.isActive && item.slug && item.title)
        .map(({ isActive, ...item }) => item)
        .sort((a, b) => b.date.localeCompare(a.date));
      if (activeItems.length > 0) return activeItems;
    }

    const brandEntries = await getBrandContent(fallbackBrandEntries);
    const newsEntries = brandEntries.filter((entry) => entry.type === "最新消息");
    if (newsEntries.length === 0) return fallbackNews;
    return newsEntries.map((entry) => ({
      slug: slugify(entry.title),
      date: entry.date.replaceAll("-", "."),
      title: entry.title,
      excerpt: entry.richContent.slice(0, 72),
      category: "最新消息",
      image: entry.image || "/images/goat-field.webp",
      content: textList(entry.richContent),
      highlightTitle: "小牧人提醒",
      highlightContent: "更多活動與供應狀態，請以官方 Line 回覆為準。"
    }));
  } catch (error) {
    console.warn(error);
    return fallbackNews;
  }
}

export async function getDeliveryMethods(): Promise<DeliveryMethod[]> {
  try {
    const databaseId = import.meta.env.NOTION_DELIVERY_DB_ID;
    if (!databaseId) return deliveryMethods;
    const methods = await queryDatabase<DeliveryMethod & { isActive?: boolean }>(databaseId, (page) => {
      const props = page.properties ?? {};
      return {
        area: firstText(props, ["Area", "Name", "配送地區", "地區", "名稱"], titleText),
        schedule: firstText(props, ["Schedule", "配送日", "配送時間", "時間"], richText),
        method: firstText(props, ["Method", "配送方式", "方式"], richText),
        minimum: firstText(props, ["Minimum", "最低數量", "最低瓶數"], richText),
        note: firstText(props, ["Note", "備註", "說明"], richText),
        isActive: firstCheckbox(props, ["IsActive", "上架狀況", "啟用"], true)
      };
    });
    const activeMethods = methods
      .filter((method) => method.isActive && method.area)
      .map(({ isActive, ...method }) => method);
    return activeMethods.length > 0 ? activeMethods : deliveryMethods;
  } catch (error) {
    console.warn(error);
    return deliveryMethods;
  }
}

async function getCopyFromDatabase(databaseId: string, titleNames: string[] = ["名稱"]): Promise<PageCopy> {
  if (!databaseId) return {};
  const entries = await queryDatabase<[string, PageCopy[string], boolean]>(databaseId, (page) => {
    const props = page.properties ?? {};
    const key = firstText(props, [...titleNames, "Title", "Name", "標題", "品牌說明"], titleText);
    const text = firstText(props, ["文字內容", "內容", "RichContent", "Content", "文字", "產品簡介"], richText);
    const image = firstFile(props, ["圖片", "Cover", "Image", "店面圖片", "照片", "產品照片"]);
    const type = firstSelect(props, ["類型", "Type"], "");
    const enabled = firstOptionalCheckbox(props, ["啟用"]);
    const publishState = firstOptionalCheckbox(props, ["IsActive", "上架狀況", "發布"]);
    const isActive = enabled ?? (type === "頁面文案" ? true : publishState ?? true);
    return [key, { text, image }, isActive];
  });

  return entries
    .filter(([key, value, isActive]) => isActive && key.includes(".") && (value.text || value.image))
    .reduce<PageCopy>((copy, [key, value]) => {
      copy[key] = value;
      return copy;
    }, {});
}

export async function getPageCopy(): Promise<PageCopy> {
  try {
    let copy: PageCopy = {};
    const sources = [
      { id: import.meta.env.NOTION_HOME_DB_ID || defaultHomeDatabaseId, titles: ["名稱"] },
      { id: import.meta.env.NOTION_NEWS_DB_ID || defaultNewsDatabaseId, titles: ["名稱"] },
      { id: import.meta.env.NOTION_BRAND_DB_ID || defaultBrandDatabaseId, titles: ["品牌說明"] },
      { id: import.meta.env.NOTION_PRODUCT_DB_ID || defaultProductDatabaseId, titles: ["產品名稱"] },
      { id: import.meta.env.NOTION_DELIVERY_PAGE_DB_ID || defaultDeliveryPageDatabaseId, titles: ["名稱"] },
      { id: import.meta.env.NOTION_LINE_DB_ID || defaultLineDatabaseId, titles: ["名稱"] }
    ];

    for (const source of sources) {
      try {
        copy = mergePageCopy(copy, await getCopyFromDatabase(source.id, source.titles));
      } catch (error) {
        console.warn(error);
      }
    }

    return copy;
  } catch (error) {
    console.warn(error);
    return {};
  }
}
