import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  validateOrderInput,
  PLAN_VALUES,
  FREQUENCY_VALUES,
  DELIVERY_TYPE_VALUES
} from "../functions/api/order-validation.ts";
import { onRequestPost } from "../functions/api/order.ts";
import { TURNSTILE_FAILURE_MESSAGE, TURNSTILE_VERIFY_URL } from "../functions/api/turnstile.ts";

const base = {
  name: "王小明",
  phone: "0912-345-678",
  lineId: "@LittleShepherd",
  deliveryType: "配送地點",
  deliveryPlace: "台中市西區公益路 1 號",
  plan: "3month",
  frequency: "每月配送",
  note: "晚上 7 點後聯絡"
};

function post(body, env = {}) {
  return onRequestPost({
    request: new Request("https://example.test/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }),
    env
  });
}

function postWithHeaders(body, env = {}, headers = {}) {
  return onRequestPost({
    request: new Request("https://example.test/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body)
    }),
    env
  });
}

describe("前端合法組合", () => {
  for (const plan of PLAN_VALUES) {
    for (const frequency of FREQUENCY_VALUES) {
      for (const deliveryType of DELIVERY_TYPE_VALUES) {
        test(`plan=${plan} frequency=${frequency} deliveryType=${deliveryType}`, () => {
          const result = validateOrderInput({ ...base, plan, frequency, deliveryType });
          assert.equal(result.status, "ok");
          assert.equal(result.order.plan, plan);
          assert.equal(result.order.frequency, frequency);
          assert.equal(result.order.deliveryType, deliveryType);
        });
      }
    }
  }

  test("選填欄位留空仍可送出", () => {
    const result = validateOrderInput({
      name: "王小明",
      phone: "0912345678",
      deliveryPlace: "台中市西區公益路 1 號",
      plan: "3month",
      frequency: "每月配送",
      deliveryType: "配送地點"
    });
    assert.equal(result.status, "ok");
    assert.equal(result.order.lineId, "");
    assert.equal(result.order.note, "");
  });

  test("方案與頻率缺省時帶入頁面預設值", () => {
    const result = validateOrderInput({
      name: "王小明",
      phone: "0912345678",
      deliveryPlace: "台中市西區公益路 1 號"
    });
    assert.equal(result.status, "ok");
    assert.equal(result.order.plan, "3month");
    assert.equal(result.order.frequency, "每月配送");
    assert.equal(result.order.deliveryType, "配送地點");
  });

  test("18 組前端組合皆能通過 handler 驗證（未設定 Notion 時回 503 而非 400）", async () => {
    for (const plan of PLAN_VALUES) {
      for (const frequency of FREQUENCY_VALUES) {
        for (const deliveryType of DELIVERY_TYPE_VALUES) {
          const response = await post({ ...base, plan, frequency, deliveryType });
          assert.equal(response.status, 503);
          const payload = await response.json();
          assert.equal(payload.ok, false);
          assert.equal(typeof payload.message, "string");
        }
      }
    }
  });
});

describe("非法輸入被拒", () => {
  test("缺必填欄位", () => {
    const result = validateOrderInput({ ...base, name: "" });
    assert.equal(result.status, "invalid");
  });

  test("非白名單方案", () => {
    const result = validateOrderInput({ ...base, plan: "1year" });
    assert.equal(result.status, "invalid");
  });

  test("配送頻率改成 Notion 新文案仍接受", () => {
    const result = validateOrderInput({ ...base, frequency: "每月配送一次" });
    assert.equal(result.status, "ok");
  });

  test("配送頻率空白時預設每月配送、超長被拒", () => {
    const empty = validateOrderInput({ ...base, frequency: "" });
    assert.equal(empty.status, "ok");
    assert.equal(empty.order.frequency, "每月配送");
    assert.equal(validateOrderInput({ ...base, frequency: "字".repeat(21) }).status, "invalid");
  });

  test("非白名單配送方式", () => {
    const result = validateOrderInput({ ...base, deliveryType: "自取" });
    assert.equal(result.status, "invalid");
  });

  test("姓名超長", () => {
    const result = validateOrderInput({ ...base, name: "王".repeat(41) });
    assert.equal(result.status, "invalid");
  });

  test("電話超長", () => {
    const result = validateOrderInput({ ...base, phone: "0".repeat(21) });
    assert.equal(result.status, "invalid");
  });

  test("Line ID 超長", () => {
    const result = validateOrderInput({ ...base, lineId: "a".repeat(101) });
    assert.equal(result.status, "invalid");
  });

  test("地址超長", () => {
    const result = validateOrderInput({ ...base, deliveryPlace: "台".repeat(121) });
    assert.equal(result.status, "invalid");
  });

  test("備註超長", () => {
    const result = validateOrderInput({ ...base, note: "備".repeat(501) });
    assert.equal(result.status, "invalid");
  });

  test("電話格式錯誤", () => {
    const result = validateOrderInput({ ...base, phone: "abc" });
    assert.equal(result.status, "invalid");
  });

  test("非物件 body", () => {
    assert.equal(validateOrderInput(null).status, "invalid");
    assert.equal(validateOrderInput([]).status, "invalid");
  });
});

describe("蜜罐", () => {
  test("website 有值時回 honeypot", () => {
    const result = validateOrderInput({ ...base, website: "https://spam.example" });
    assert.equal(result.status, "honeypot");
  });

  test("website 空白不觸發", () => {
    const result = validateOrderInput({ ...base, website: "   " });
    assert.equal(result.status, "ok");
  });

  test("handler 對蜜罐回 200 假成功且不寫入 Notion", async () => {
    const response = await post({ ...base, website: "https://spam.example" }, {});
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.deepEqual(payload, { ok: true, mode: "notion" });
  });
});

describe("Turnstile", () => {
  test("secret 已設定且 siteverify 成功：帶 secret、token、remoteip 驗證後才繼續", async () => {
    const originalFetch = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return Response.json({ success: true });
    };
    try {
      const response = await postWithHeaders(
        { ...base, turnstileToken: "token-ok" },
        { TURNSTILE_SECRET_KEY: "secret-key" },
        { "CF-Connecting-IP": "203.0.113.7" }
      );
      assert.equal(response.status, 503);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].url, TURNSTILE_VERIFY_URL);
      const params = new URLSearchParams(calls[0].init.body);
      assert.equal(params.get("secret"), "secret-key");
      assert.equal(params.get("response"), "token-ok");
      assert.equal(params.get("remoteip"), "203.0.113.7");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("siteverify 失敗：回 400 中文訊息且不寫入 Notion", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return Response.json({ success: false });
    };
    try {
      const response = await post(
        { ...base, turnstileToken: "token-bad" },
        { TURNSTILE_SECRET_KEY: "secret-key" }
      );
      assert.equal(response.status, 400);
      const payload = await response.json();
      assert.deepEqual(payload, { ok: false, message: TURNSTILE_FAILURE_MESSAGE });
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("secret 未設定：略過驗證、不呼叫 siteverify、印出警告且照舊處理", async () => {
    const originalFetch = globalThis.fetch;
    const originalWarn = console.warn;
    let calls = 0;
    let warned = false;
    globalThis.fetch = async () => {
      calls += 1;
      return Response.json({ success: false });
    };
    console.warn = () => {
      warned = true;
    };
    try {
      const response = await post({ ...base }, {});
      assert.equal(response.status, 503);
      assert.equal(calls, 0);
      assert.equal(warned, true);
    } finally {
      globalThis.fetch = originalFetch;
      console.warn = originalWarn;
    }
  });

  test("蜜罐優先：有值時回假成功且完全不呼叫 siteverify", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return Response.json({ success: true });
    };
    try {
      const response = await post(
        { ...base, website: "https://spam.example" },
        { TURNSTILE_SECRET_KEY: "secret-key" }
      );
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.deepEqual(payload, { ok: true, mode: "notion" });
      assert.equal(calls, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("secret 已設定但缺少 token：回 400", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return Response.json({ success: true });
    };
    try {
      const response = await post({ ...base }, { TURNSTILE_SECRET_KEY: "secret-key" });
      assert.equal(response.status, 400);
      const payload = await response.json();
      assert.deepEqual(payload, { ok: false, message: TURNSTILE_FAILURE_MESSAGE });
      assert.equal(calls, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
