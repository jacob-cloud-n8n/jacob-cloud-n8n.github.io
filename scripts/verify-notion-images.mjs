import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import http from "node:http";
import { join } from "node:path";

const pngA = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);
const pngB = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8zwAAAgEBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

let scenario = "success";
const imageRequests = new Map();
let databaseRequests = 0;

function file(name, url) {
  return { name, type: "file", file: { url, expiry_time: "2026-10-18T10:00:00.000Z" } };
}

function external(name, url) {
  return { name, type: "external", external: { url } };
}

function productPage(origin) {
  const imageUrl = scenario === "failure"
    ? `${origin}/prod-files-secure/broken.png?X-Amz-Signature=broken`
    : `${origin}/prod-files-secure/shared.png?X-Amz-Signature=product`;
  return {
    id: "mock-product",
    properties: {
      "產品名稱": { title: [{ plain_text: "驗收羊奶" }] },
      "產品價格": { number: 225 },
      "產品分類": { select: { name: "鮮乳" } },
      "產品簡介": { rich_text: [{ plain_text: "本機模擬商品" }] },
      "產品照片": { files: [file("mock-product.png", imageUrl)] },
      "啟用": { checkbox: true }
    }
  };
}

function homePages(origin) {
  return [
    {
      id: "mock-home-shared",
      properties: {
        "名稱": { title: [{ plain_text: "home.hero.image" }] },
        "圖片": { files: [file("same-image.png", `${origin}/prod-files-secure/shared.png?X-Amz-Signature=home`)] },
        "啟用": { checkbox: true }
      }
    },
    {
      id: "mock-home-second",
      properties: {
        "名稱": { title: [{ plain_text: "home.products.1.image" }] },
        "圖片": { files: [file("second-image.png", `${origin}/prod-files-secure/second.png?X-Amz-Signature=second`)] },
        "啟用": { checkbox: true }
      }
    },
    {
      id: "mock-home-external",
      properties: {
        "名稱": { title: [{ plain_text: "home.products.2.image" }] },
        "圖片": { files: [external("external.png", "https://example.com/external.png?keep=1")] },
        "啟用": { checkbox: true }
      }
    }
  ];
}

const server = http.createServer((request, response) => {
  const origin = `http://127.0.0.1:${server.address().port}`;
  if (request.method === "POST" && request.url?.startsWith("/v1/databases/")) {
    databaseRequests += 1;
    const databaseId = request.url.split("/")[3];
    const results = databaseId === "mock-products"
      ? [productPage(origin)]
      : databaseId === "mock-home" && scenario === "success"
        ? homePages(origin)
        : [];
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ results, has_more: false, next_cursor: null }));
    return;
  }

  if (request.url?.startsWith("/prod-files-secure/")) {
    const pathname = request.url.split("?", 1)[0];
    imageRequests.set(pathname, (imageRequests.get(pathname) ?? 0) + 1);
    if (pathname.endsWith("/broken.png")) {
      response.writeHead(503, { "content-type": "text/plain" });
      response.end("intentional test failure");
      return;
    }
    const body = pathname.endsWith("/second.png") ? pngB : pngA;
    response.writeHead(200, { "content-type": "image/png" });
    response.end(body);
    return;
  }

  response.writeHead(404);
  response.end();
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;

function runBuild(extraEnv) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["run", "build:cloudflare"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NOTION_TOKEN: "test-only",
        NOTION_API_BASE_URL: `http://127.0.0.1:${port}/v1`,
        NOTION_PRODUCT_DB_ID: "mock-products",
        NOTION_HOME_DB_ID: "mock-home",
        NOTION_BRAND_DB_ID: "mock-empty",
        NOTION_NEWS_DB_ID: "mock-empty",
        NOTION_DELIVERY_PAGE_DB_ID: "mock-empty",
        NOTION_LINE_DB_ID: "mock-empty",
        ...extraEnv
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  }));
  return files.flat();
}

try {
  const success = await runBuild({});
  assert.equal(success.code, 0, `mock success build failed:\n${success.stderr}\n${success.stdout}`);

  const htmlFiles = (await filesBelow(join(process.cwd(), "dist"))).filter((path) => path.endsWith(".html"));
  const html = (await Promise.all(htmlFiles.map((path) => readFile(path, "utf8")))).join("\n");
  const localizedImages = await filesBelow(join(process.cwd(), "dist", "_notion"));
  assert.equal(html.includes("prod-files-secure"), false, "signed Notion host path remained in generated HTML");
  assert.equal(html.includes("X-Amz-Signature"), false, "signed Notion query remained in generated HTML");
  assert.equal(localizedImages.length, 2, "expected exactly two unique localized Notion images");
  assert.equal(imageRequests.get("/prod-files-secure/shared.png"), 1, "same canonical image URL was downloaded more than once");
  assert.equal(imageRequests.get("/prod-files-secure/second.png"), 1, "second image download count was not one");
  assert.match(html, /\/_notion\/[a-f0-9]{64}\.png/, "localized image path was not rendered");
  assert.ok(html.includes("https://example.com/external.png?keep=1"), "external.url was unexpectedly rewritten");
  for (const path of localizedImages) {
    const bytes = await readFile(path);
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${path} is not a readable PNG`);
  }

  scenario = "failure";
  imageRequests.clear();
  const failure = await runBuild({ NOTION_HOME_DB_ID: "mock-empty" });
  const failureOutput = `${failure.stderr}\n${failure.stdout}`;
  assert.notEqual(failure.code, 0, "failed image download unexpectedly produced a successful build");
  for (const expected of ["mock-products", "mock-product", "產品照片", "broken.png", "HTTP 503"]) {
    assert.ok(failureOutput.includes(expected), `failure output did not identify ${expected}`);
  }

  // Keep the API base on the local mock so a leaked .env token could never reach api.notion.com.
  databaseRequests = 0;
  const withoutToken = await runBuild({
    NOTION_TOKEN: "",
    NOTION_PRODUCT_DB_ID: "",
    NOTION_HOME_DB_ID: "",
    NOTION_BRAND_DB_ID: "",
    NOTION_NEWS_DB_ID: "",
    NOTION_DELIVERY_PAGE_DB_ID: "",
    NOTION_LINE_DB_ID: ""
  });
  assert.equal(withoutToken.code, 0, `build without Notion token failed:\n${withoutToken.stderr}\n${withoutToken.stdout}`);
  assert.equal(databaseRequests, 0, "build without Notion token still queried the Notion API");

  console.log("mock static build: exit 0");
  console.log("signed Notion URLs in HTML: 0");
  console.log(`localized images: ${localizedImages.length} (mock unique images: 2; readable PNG: 2)`);
  console.log("canonical URL dedupe: shared image downloaded once");
  console.log("external.url unchanged: yes");
  console.log(`failed download build: exit ${failure.code}; context includes database/page/field/file and HTTP 503`);
  console.log("build without Notion token: exit 0; Notion API requests: 0");
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
