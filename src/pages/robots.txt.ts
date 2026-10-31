import type { APIRoute } from "astro";
import { getSiteUrl } from "../lib/site-url";

export const GET: APIRoute = ({ site, url }) => {
  const siteUrl = getSiteUrl(site, url);
  const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl.replace(/\/$/, "")}/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
};
