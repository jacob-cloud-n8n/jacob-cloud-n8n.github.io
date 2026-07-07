import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const host = context.request.headers.get("host") || url.host;

  const siteUrl = process.env.SITE_URL || "https://shepherd.zeabur.app";
  const targetHost = new URL(siteUrl).host;

  // 301 Redirect old domain to the primary domain
  if (host === "xiaomuren-untitled-20260501.zeabur.app" && host !== targetHost) {
    const targetUrl = new URL(url.pathname + url.search, siteUrl);
    return context.redirect(targetUrl.toString(), 301);
  }

  return next();
});
