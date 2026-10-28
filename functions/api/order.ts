interface Env {
  NOTION_TOKEN?: string;
  NOTION_ORDER_DB_ID?: string;
}

type PagesContext = {
  request: Request;
  env: Env;
};

type Order = {
  name: string;
  phone: string;
  lineId: string;
  deliveryType: string;
  deliveryPlace: string;
  plan: string;
  frequency: string;
  note: string;
  submittedAt: string;
};

const planLabels: Record<string, string> = {
  "3month": "一次訂購三個月，享9折價",
  "6month": "一次訂購6個月，享85折價",
  "trial": "單次訂購"
};

const notionVersion = "2022-06-28";

const unavailableMessage = "訂單系統暫時無法使用，請改用電話 0918-620092 或官方 LINE（https://lin.ee/xFMuRx5）訂購。";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function validPhone(value: string): boolean {
  return /^[0-9+\-\s()]{8,20}$/.test(value);
}

function jsonResponse(body: object, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

async function createNotionOrder(env: Env, order: Order): Promise<boolean> {
  const token = clean(env.NOTION_TOKEN);
  const databaseId = clean(env.NOTION_ORDER_DB_ID);
  if (!token || !databaseId) return false;

  const note = [
    order.note,
    order.lineId ? `Line ID：${order.lineId}` : "",
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

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const order = {
      name: clean(body.name),
      phone: clean(body.phone),
      lineId: clean(body.lineId),
      deliveryType: clean(body.deliveryType),
      deliveryPlace: clean(body.deliveryPlace),
      plan: planLabels[clean(body.plan)] ?? clean(body.plan),
      frequency: clean(body.frequency),
      note: clean(body.note),
      submittedAt: new Date().toISOString()
    };

    if (!order.name || !order.phone || !order.deliveryPlace) {
      return jsonResponse({ ok: false, message: "請填寫姓名、電話與配送地點或門市。" }, 400);
    }

    if (!validPhone(order.phone)) {
      return jsonResponse({ ok: false, message: "請確認電話格式。" }, 400);
    }

    if (await createNotionOrder(env, order)) {
      return jsonResponse({ ok: true, mode: "notion" });
    }

    return jsonResponse({ ok: false, message: unavailableMessage }, 503);
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error
      ? (error as { status?: unknown }).status
      : undefined;
    const message = error instanceof Error ? error.message : String(error);
    console.error("Order submission failed", { status, message });
    return jsonResponse({ ok: false, message: unavailableMessage }, 503);
  }
};
