import type { PageCopy } from "./content";

export function copyText(copy: PageCopy, key: string, fallback: string): string {
  return copy[key]?.text || fallback;
}

export function copyImage(copy: PageCopy, key: string, fallback: string): string {
  return copy[key]?.image || fallback;
}
