import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import { loadSiteUrlEnvironment, resolveSiteUrlForCommand } from "./src/lib/site-url.ts";

const isStaticBuild = process.env.ASTRO_OUTPUT === "static";
const command = process.argv.slice(2).includes("build") ? "build" : "dev";
const site = resolveSiteUrlForCommand({
  command,
  env: loadSiteUrlEnvironment()
});

export default defineConfig({
  output: isStaticBuild ? "static" : "server",
  adapter: isStaticBuild
    ? undefined
    : node({
        mode: "standalone"
      }),
  site,
  image: {
    domains: ["localhost"]
  },
  vite: {
    server: {
      host: "0.0.0.0"
    }
  }
});
