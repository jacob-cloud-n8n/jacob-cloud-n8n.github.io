import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

type NotionFile = {
  name?: string;
  file?: {
    url?: string;
  };
  external?: {
    url?: string;
  };
};

type NotionPageWithFiles = {
  id?: string;
  url?: string;
  properties?: Record<string, { files?: NotionFile[] }>;
};

const localizedFiles = new Map<string, Promise<string>>();
const contentTypeExtensions: Record<string, string> = {
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/svg+xml": ".svg",
  "image/webp": ".webp"
};

export class NotionImageBuildError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "NotionImageBuildError";
  }
}

export function rethrowNotionImageBuildError(error: unknown): void {
  if (error instanceof NotionImageBuildError || (error instanceof Error && error.name === "NotionImageBuildError")) {
    throw error;
  }
}

function isStaticBuild(): boolean {
  return process.env.ASTRO_OUTPUT === "static";
}

function canonicalUrl(url: string): string {
  const parsed = new URL(url);
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

function safeExtension(url: string, fileName: string | undefined, contentType: string | null): string {
  const candidates = [extname(new URL(url).pathname), extname(fileName ?? "")];
  for (const candidate of candidates) {
    if (/^\.[a-z0-9]{1,8}$/i.test(candidate)) return candidate.toLowerCase();
  }

  return contentTypeExtensions[contentType?.split(";", 1)[0].trim().toLowerCase() ?? ""] ?? ".bin";
}

function pageLabel(page: NotionPageWithFiles): string {
  return page.id || page.url || "unknown-page";
}

async function downloadNotionFile(url: string, fileName: string | undefined, context: string): Promise<string> {
  let canonical: string;
  try {
    canonical = canonicalUrl(url);
  } catch (error) {
    throw new NotionImageBuildError(`[Notion image] Invalid file URL (${context}): ${url}`, { cause: error });
  }

  const existing = localizedFiles.get(canonical);
  if (existing) return existing;

  const download = (async () => {
    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new NotionImageBuildError(`[Notion image] Download failed (${context}): ${url}`, { cause: error });
    }

    if (!response.ok) {
      throw new NotionImageBuildError(
        `[Notion image] Download failed (${context}): HTTP ${response.status} ${response.statusText} for ${url}`
      );
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0) {
      throw new NotionImageBuildError(`[Notion image] Download returned an empty file (${context}): ${url}`);
    }

    const digest = createHash("sha256").update(bytes).digest("hex");
    const extension = safeExtension(url, fileName, response.headers.get("content-type"));
    const publicPath = `/_notion/${digest}${extension}`;
    const outputDirectory = resolve(process.cwd(), "dist", "_notion");

    await mkdir(outputDirectory, { recursive: true });
    await writeFile(resolve(outputDirectory, `${digest}${extension}`), bytes);
    return publicPath;
  })();

  localizedFiles.set(canonical, download);
  try {
    return await download;
  } catch (error) {
    localizedFiles.delete(canonical);
    throw error;
  }
}

export async function localizeNotionFiles(pages: NotionPageWithFiles[], databaseId: string): Promise<void> {
  if (!isStaticBuild()) return;

  await Promise.all(
    pages.flatMap((page) =>
      Object.entries(page.properties ?? {}).flatMap(([propertyName, property]) =>
        (property?.files ?? []).flatMap((file) => {
          const url = file.file?.url;
          if (!url || url.startsWith("/_notion/")) return [];

          const context = `database "${databaseId}", page "${pageLabel(page)}", field "${propertyName}", file "${file.name || "unnamed"}"`;
          return [
            downloadNotionFile(url, file.name, context).then((localPath) => {
              if (file.file) file.file.url = localPath;
            })
          ];
        })
      )
    )
  );
}
