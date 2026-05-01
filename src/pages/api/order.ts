import type { APIRoute } from "astro";

const planLabels: Record<string, string> = {
  "3month": "一次訂購三個月，享9折價",
  "6month": "一次訂購6個月，享85折價"
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function validPhone(value: string): boolean {
  return /^[0-9+\-\s()]{8,20}$/.test(value);
}

export const POST: APIRoute = async ({ request }) => {
  const webhookUrl = import.meta.env.N8N_ORDER_WEBHOOK_URL;

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

    if (!webhookUrl) {
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

      return new Response(JSON.stringify({
        ok: true,
        mode: "line-fallback",
        lineUrl: `https://line.me/R/msg/text/?${encodeURIComponent(message)}`
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status}`);
    }

    return new Response(JSON.stringify({ ok: true, mode: "webhook" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ ok: false, message: "訂單送出失敗，請稍後再試或改用官方 Line 聯繫。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
