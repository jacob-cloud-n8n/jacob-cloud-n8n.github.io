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
const productCategories = new Set(["鮮乳", "優酪乳", "甜點", "特調飲品", "贈品"]);

type NotionPage = {
  properties?: Record<string, any>;
};

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
    特調: "特調飲品"
  };
  if (aliases[value]) return aliases[value];
  return productCategories.has(value) ? (value as Product["category"]) : "鮮乳";
}

async function queryDatabase<T>(databaseId: string, mapper: (page: NotionPage) => T): Promise<T[]> {
  const token = import.meta.env.NOTION_TOKEN;
  if (!token || !databaseId) return [];

  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": notionVersion
    },
    body: JSON.stringify({ page_size: 50 })
  });

  if (!response.ok) {
    throw new Error(`Notion query failed: ${response.status}`);
  }

  const payload = await response.json();
  return (payload.results ?? []).map(mapper);
}

export async function getProducts(): Promise<Product[]> {
  try {
    const products = await queryDatabase<Product>(import.meta.env.NOTION_PRODUCT_DB_ID || defaultProductDatabaseId, (page) => {
      const props = page.properties ?? {};
      return {
        name: titleText(props.Name),
        price: Number(props.Price?.number ?? 0),
        category: productCategory(props.Category?.select?.name ?? "鮮乳"),
        image: fileUrl(props.Cover) || "/images/product-board.webp",
        desc: richText(props.Description),
        isActive: Boolean(props.IsActive?.checkbox)
      };
    });
    const activeProducts = products.filter((product) => product.isActive && product.name);
    return activeProducts.length > 0 ? activeProducts : fallbackProducts;
  } catch (error) {
    console.warn(error);
    return fallbackProducts;
  }
}

export async function getBrandContent(fallback: BrandEntry[] = fallbackBrandEntries): Promise<BrandEntry[]> {
  try {
    const entries = await queryDatabase<BrandEntry>(import.meta.env.NOTION_BRAND_DB_ID || defaultBrandDatabaseId, (page) => {
      const props = page.properties ?? {};
      return {
        title: titleText(props.Title),
        type: props.Type?.select?.name ?? "品牌介紹",
        date: props.Date?.date?.start ?? "",
        richContent: richText(props.RichContent),
        image: fileUrl(props.Cover) || fileUrl(props.Image),
        order: Number(props.Order?.number ?? 0)
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
  const entries = await getBrandContent(milestoneEntries);
  const milestones = entries.filter((entry) => entry.type === "大事記");
  return milestones.length > 0 ? milestones : milestoneEntries;
}

export async function getNews(): Promise<NewsItem[]> {
  try {
    const newsDatabaseId = import.meta.env.NOTION_NEWS_DB_ID;
    if (newsDatabaseId) {
      const items = await queryDatabase<NewsItem & { isActive?: boolean }>(newsDatabaseId, (page) => {
        const props = page.properties ?? {};
        const title = titleText(props.Title) || titleText(props.Name);
        const slug = richText(props.Slug) || slugify(title);
        return {
          slug,
          date: props.Date?.date?.start?.replaceAll("-", ".") ?? "",
          title,
          excerpt: richText(props.Excerpt) || richText(props.Description),
          category: selectName(props.Category) || "最新消息",
          image: fileUrl(props.Cover) || fileUrl(props.Image) || "/images/goat-field.webp",
          content: textList(richText(props.Content) || richText(props.RichContent)),
          highlightTitle: richText(props.HighlightTitle) || "小牧人提醒",
          highlightContent: richText(props.HighlightContent),
          youtubeUrl: richText(props.YoutubeUrl) || richText(props.YouTube),
          isActive: checkbox(props.IsActive)
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
        area: titleText(props.Area) || titleText(props.Name),
        schedule: richText(props.Schedule),
        method: richText(props.Method),
        minimum: richText(props.Minimum),
        note: richText(props.Note),
        isActive: checkbox(props.IsActive)
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

export async function getPageCopy(): Promise<PageCopy> {
  try {
    const entries = await getBrandContent([]);
    return entries
      .filter((entry) => entry.type === "頁面文案" && entry.title)
      .reduce<PageCopy>((copy, entry) => {
        copy[entry.title] = {
          text: entry.richContent,
          image: entry.image
        };
        return copy;
      }, {});
  } catch (error) {
    console.warn(error);
    return {};
  }
}
