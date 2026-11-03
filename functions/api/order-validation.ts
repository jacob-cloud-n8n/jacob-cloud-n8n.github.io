export const PLAN_VALUES = ["3month", "6month", "trial"] as const;
export const FREQUENCY_VALUES = ["每月配送", "依客服確認"] as const;
export const DELIVERY_TYPE_VALUES = ["配送地點", "配送門市"] as const;

export const FIELD_LIMITS = {
  name: 40,
  phone: 20,
  lineId: 100,
  deliveryPlace: 120,
  note: 500
} as const;

export type ValidatedOrder = {
  name: string;
  phone: string;
  lineId: string;
  deliveryType: string;
  deliveryPlace: string;
  plan: string;
  frequency: string;
  note: string;
};

export type OrderValidationResult =
  | { status: "ok"; order: ValidatedOrder }
  | { status: "honeypot" }
  | { status: "invalid"; message: string };

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function toRecord(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  return input as Record<string, unknown>;
}

function tooLong(value: string, max: number): boolean {
  return value.length > max;
}

function validPhone(value: string): boolean {
  return /^[0-9+\-\s()]{8,20}$/.test(value);
}

function invalid(message: string): OrderValidationResult {
  return { status: "invalid", message };
}

export function validateOrderInput(input: unknown): OrderValidationResult {
  const body = toRecord(input);
  if (!body) return invalid("送出資料格式有誤，請重新整理後再試。");

  if (clean(body.website)) return { status: "honeypot" };

  const name = clean(body.name);
  const phone = clean(body.phone);
  const lineId = clean(body.lineId);
  const deliveryType = clean(body.deliveryType) || "配送地點";
  const deliveryPlace = clean(body.deliveryPlace);
  const plan = clean(body.plan) || "3month";
  const frequency = clean(body.frequency) || "每月配送";
  const note = clean(body.note);

  if (!name || !phone || !deliveryPlace) {
    return invalid("請填寫姓名、電話與配送地點或門市。");
  }

  if (tooLong(name, FIELD_LIMITS.name)) {
    return invalid(`姓名最多 ${FIELD_LIMITS.name} 個字。`);
  }
  if (tooLong(phone, FIELD_LIMITS.phone)) {
    return invalid(`電話最多 ${FIELD_LIMITS.phone} 個字。`);
  }
  if (tooLong(lineId, FIELD_LIMITS.lineId)) {
    return invalid(`Line ID 最多 ${FIELD_LIMITS.lineId} 個字。`);
  }
  if (tooLong(deliveryPlace, FIELD_LIMITS.deliveryPlace)) {
    return invalid(`地址或門市最多 ${FIELD_LIMITS.deliveryPlace} 個字。`);
  }
  if (tooLong(note, FIELD_LIMITS.note)) {
    return invalid(`備註最多 ${FIELD_LIMITS.note} 個字。`);
  }

  if (!validPhone(phone)) {
    return invalid("請確認電話格式。");
  }

  if (!(PLAN_VALUES as readonly string[]).includes(plan)) {
    return invalid("方案選項不正確，請回到配送方案頁重新選擇。");
  }
  if (!(FREQUENCY_VALUES as readonly string[]).includes(frequency)) {
    return invalid("配送頻率選項不正確，請回到配送方案頁重新選擇。");
  }
  if (!(DELIVERY_TYPE_VALUES as readonly string[]).includes(deliveryType)) {
    return invalid("配送方式選項不正確，請重新選擇。");
  }

  return {
    status: "ok",
    order: { name, phone, lineId, deliveryType, deliveryPlace, plan, frequency, note }
  };
}
