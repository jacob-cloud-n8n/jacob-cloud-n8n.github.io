import type { APIRoute } from "astro";

const planLabels: Record<string, string> = {
  "3month": "一次訂購三個月，享9折價",
  "6month": "一次訂購6個月，享85折價"
};

const notionVersion = "2022-06-28";
const defaultOrderDatabaseId = "34389dd14f0a80bfb525d029d67afa19";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function validPhone(value: string): boolean {
  return /^[0-9+\-\s()]{8,20}$/.test(value);
}

function lineFallbackUrl(order: Order): string {
  const message = [
    "小牧人羊奶訂單",
    `姓名：${order.name}`,
    `電話：${order.phone}`,
    `配送方式：${order.deliveryType}`,
    `配送地點/門市：${order.deliveryPlace}`,
    `方案：${order.plan}`,
    `配送頻率：${order.frequency}`,
    order.note ? `備註：${order.note}` : ""
  ].filter(Boolean).join("\n");

  return `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
}

type Order = {
  name: string;
  phone: string;
  deliveryType: string;
  deliveryPlace: string;
  plan: string;
  frequency: string;
  note: string;
  submittedAt: string;
};

async function createNotionOrder(order: Order): Promise<boolean> {
  const token = import.meta.env.NOTION_TOKEN;
  const databaseId = import.meta.env.NOTION_ORDER_DB_ID || defaultOrderDatabaseId;
  if (!token || !databaseId) return false;

  const note = [
    order.note,
    `配送方式：${order.deliveryType}`,
    `配送地點/門市：${order.deliveryPlace}`,
    `方案：${order.plan}`,
    `配送頻率：${order.frequency}`,
    `送出時間：${order.submittedAt}`
  ].filter(Boolean).join("\n");

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": notionVersion
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        "姓名": {
          title: [{ text: { content: order.name } }]
        },
        "電話": {
          rich_text: [{ text: { content: order.phone } }]
        },
        "7-11取貨門市": {
          rich_text: [{ text: { content: order.deliveryPlace } }]
        },
        "備註": {
          rich_text: [{ text: { content: note } }]
        },
        "狀態": {
          status: { name: "新訂單" }
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Notion order create failed: ${response.status}`);
  }

  return true;
}

export const POST: APIRoute = async ({ request }) => {
  let fallbackOrder: Order | null = null;

  try {
    const body = await request.json();
    const order = {
      name: clean(body.name),
      phone: clean(body.phone),
      deliveryType: clean(body.deliveryType),
      deliveryPlace: clean(body.deliveryPlace),
      plan: planLabels[clean(body.plan)] ?? clean(body.plan),
      frequency: clean(body.frequency),
      note: clean(body.note),
      submittedAt: new Date().toISOString()
    };
    fallbackOrder = order;

    if (!order.name || !order.phone || !order.deliveryPlace) {
      return new Response(JSON.stringify({ ok: false, message: "請填寫姓名、電話與配送地點或門市。" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!validPhone(order.phone)) {
      return new Response(JSON.stringify({ ok: false, message: "請確認電話格式。" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (await createNotionOrder(order)) {
      return new Response(JSON.stringify({ ok: true, mode: "notion" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      mode: "line-fallback",
      lineUrl: lineFallbackUrl(order)
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error(error);
    if (fallbackOrder) {
      return new Response(JSON.stringify({ ok: true, mode: "line-fallback", lineUrl: lineFallbackUrl(fallbackOrder) }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ ok: false, message: "訂單送出失敗，請稍後再試或改用官方 Line 聯繫。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
