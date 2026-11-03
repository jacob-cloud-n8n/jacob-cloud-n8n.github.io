export const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const TURNSTILE_FAILURE_MESSAGE = "驗證未通過，請重新整理後再試一次。";

type TurnstileEnv = {
  TURNSTILE_SECRET_KEY?: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export async function verifyTurnstile(
  env: TurnstileEnv,
  token: unknown,
  remoteIp?: string | null
): Promise<boolean> {
  const secret = clean(env.TURNSTILE_SECRET_KEY);
  if (!secret) {
    console.warn("turnstile secret missing");
    return true;
  }

  const responseToken = clean(token);
  if (!responseToken) return false;

  const body = new URLSearchParams({
    secret,
    response: responseToken
  });
  const ip = clean(remoteIp);
  if (ip) body.set("remoteip", ip);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });

    if (!response.ok) return false;
    const result = await response.json();
    return result?.success === true;
  } catch (error) {
    console.error("Turnstile verification failed", error);
    return false;
  }
}
