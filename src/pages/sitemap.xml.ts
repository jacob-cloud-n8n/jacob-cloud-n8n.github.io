import type { APIRoute } from "astro";
import { getNews } from "../lib/notion";

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = process.env.SITE_URL || (site ? site.origin : "https://shepherd.zeabur.app");
  const baseUrl = siteUrl.replace(/\/$/, "");

  const staticPages = [
    "",
    "/products/",
    "/delivery/",
    "/news/",
    "/milestones/",
    "/line/",
    "/brand-story/",
  ];

  let newsSlugs: string[] = [];
  try {
    const news = await getNews();
    newsSlugs = news.map((item) => `/news/${item.slug}/`);
  } catch (e) {
    console.error("Failed to get news for sitemap:", e);
  }

  const allPages = [...staticPages, ...newsSlugs];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>${page === "" ? "daily" : "weekly"}</changefreq>
    <priority>${page === "" ? "1.0" : page.startsWith("/news/") && page !== "/news/" ? "0.6" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
};
