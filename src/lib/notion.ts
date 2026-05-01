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

function firstText(props: Record<string, any>, names: string[], reader: (prop: any) => string): string {
  for (const name of names) {
    const value = reader(props[name]);
    if (value) return value;
  }
  return "";
}

function firstFile(props: Record<string, any>, names: string[]): string {
  for (const name of names) {
    const value = fileUrl(props[name]);
    if (value) return value;
  }
  return "";
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
      const name = firstText(props, ["Name", "產品名稱"], titleText);
      return {
        name,
        price: Number(props.Price?.number ?? props["產品價格"]?.number ?? 0),
        category: productCategory(props.Category?.select?.name ?? props["產品分類"]?.select?.name ?? "鮮乳"),
        image: firstFile(props, ["Cover", "產品照片"]) || "/images/product-board.webp",
        desc: firstText(props, ["Description", "產品簡介"], richText),
        isActive: props.IsActive?.checkbox ?? props["上架狀況"]?.checkbox ?? true
      };
    });
    const namedProducts = products.filter((product) => product.name);
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
        title: firstText(props, ["Title", "品牌說明"], titleText),
        type: props.Type?.select?.name ?? "品牌介紹",
        date: props.Date?.date?.start ?? "",
        richContent: firstText(props, ["RichContent", "內容", "文字"], richText),
        image: firstFile(props, ["Cover", "Image", "店面圖片"]),
        order: Number(props.Order?.number ?? index)
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
          title: titleText(props.Title),
          type: "大事記",
          date: props.Date?.date?.start ?? "",
          richContent: richText(props.RichContent),
          image: fileUrl(props.Cover) || fileUrl(props.Image),
          order: Number(props.Order?.number ?? index)
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
