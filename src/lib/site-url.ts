import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

export interface SiteUrlEnvironment {
  SITE_URL?: string;
  PUBLIC_SITE_URL?: string;
}

interface ResolveSiteUrlOptions {
  command: "build" | "dev";
  env: SiteUrlEnvironment;
}

const BUILD_ERROR_PREFIX = "[site-url]";

export function loadSiteUrlEnvironment(cwd = process.cwd()): SiteUrlEnvironment {
  const envPath = resolve(cwd, ".env");
  if (existsSync(envPath)) {
    loadEnvFile(envPath);
  }

  return {
    SITE_URL: process.env.SITE_URL,
    PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL
  };
}

function clean(value: string | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

function validateBuildUrl(variableName: keyof SiteUrlEnvironment, value: string): string {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${BUILD_ERROR_PREFIX} ${variableName} must be a valid absolute URL for astro build.`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname)) {
    throw new Error(`${BUILD_ERROR_PREFIX} ${variableName} must not use a loopback hostname for astro build.`);
  }

  if (hostname === "zeabur.app" || hostname.endsWith(".zeabur.app")) {
    throw new Error(`${BUILD_ERROR_PREFIX} ${variableName} must not use a zeabur.app hostname for astro build.`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`${BUILD_ERROR_PREFIX} ${variableName} must use https: for astro build.`);
  }

  return value;
}

export function resolveSiteUrlForCommand({ command, env }: ResolveSiteUrlOptions): string | undefined {
  const siteUrl = clean(env.SITE_URL);
  const publicSiteUrl = clean(env.PUBLIC_SITE_URL);

  if (command !== "build") {
    return publicSiteUrl ?? siteUrl;
  }

  if (!siteUrl) {
    throw new Error(`${BUILD_ERROR_PREFIX} SITE_URL is required for astro build.`);
  }

  if (!publicSiteUrl) {
    throw new Error(`${BUILD_ERROR_PREFIX} PUBLIC_SITE_URL is required for astro build.`);
  }

  if (siteUrl !== publicSiteUrl) {
    throw new Error(`${BUILD_ERROR_PREFIX} SITE_URL and PUBLIC_SITE_URL must match for astro build.`);
  }

  validateBuildUrl("SITE_URL", siteUrl);
  validateBuildUrl("PUBLIC_SITE_URL", publicSiteUrl);

  return siteUrl;
}

export function getSiteUrl(site: URL | undefined, requestUrl: URL): string {
  return (site ?? requestUrl).origin;
}
