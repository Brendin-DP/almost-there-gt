import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parse and coerce to https. Returns null if not a valid absolute http(s) URL. */
export function normalizeHttpsUrl(url: string): string | null {
  const t = url.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.protocol = "https:";
    return u.href;
  } catch {
    return null;
  }
}
