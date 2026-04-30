import { defineConfig } from "astro/config";
import node from "@astrojs/node";

const isStaticBuild = process.env.ASTRO_OUTPUT === "static";

export default defineConfig({
  output: isStaticBuild ? "static" : "server",
  adapter: isStaticBuild
    ? undefined
    : node({
        mode: "standalone"
      }),
  site: "https://jacob-cloud-n8n.github.io",
  image: {
    domains: ["localhost"]
  },
  vite: {
    server: {
      host: "0.0.0.0"
    }
  }
});
