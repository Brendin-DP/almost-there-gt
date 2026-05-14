import "server-only";

import { normalizeHttpsUrl } from "@/lib/utils";

const LOG_PREFIX = "[youtube]";

type YouTubeChannelsResponse = {
  items?: Array<{
    statistics?: {
      subscriberCount?: string;
    };
    snippet?: {
      thumbnails?: {
        default?: { url?: string };
        medium?: { url?: string };
        high?: { url?: string };
      };
    };
  }>;
};

export type ChannelDetails = {
  subscriberCount: number;
  /** From `snippet.thumbnails.high.url` when present. */
  profileImageUrl: string | null;
};

/** Masks API key for logs: only last 4 characters visible. */
export function maskYoutubeApiKeyForLog(apiKey: string): string {
  const k = apiKey.trim();
  if (!k) return "(missing)";
  if (k.length <= 4) return `***(${k.length} chars)`;
  return `***…${k.slice(-4)}`;
}

/** Same request URL as used for fetch, but `key` is masked for safe logging. */
export function buildChannelsStatsUrlForLog(
  channelId: string,
  apiKey: string
): string {
  const id = channelId.trim();
  const u = new URL("https://www.googleapis.com/youtube/v3/channels");
  u.searchParams.set("part", "statistics");
  u.searchParams.set("id", id);
  u.searchParams.set("key", maskYoutubeApiKeyForLog(apiKey));
  return u.toString();
}

/** Log URL for `part=snippet,statistics` with masked key. */
export function buildChannelsSnippetStatsUrlForLog(
  channelId: string,
  apiKey: string
): string {
  const id = channelId.trim();
  const u = new URL("https://www.googleapis.com/youtube/v3/channels");
  u.searchParams.set("part", "snippet,statistics");
  u.searchParams.set("id", id);
  u.searchParams.set("key", maskYoutubeApiKeyForLog(apiKey));
  return u.toString();
}

function highThumbnailUrlFromSnippet(snippet: unknown): string | null {
  if (!snippet || typeof snippet !== "object") return null;
  const t = snippet as {
    thumbnails?: { high?: { url?: string } };
  };
  const high = t.thumbnails?.high?.url;
  if (typeof high !== "string" || high.trim() === "") return null;
  return normalizeHttpsUrl(high);
}

/**
 * Fetches subscriber count and channel avatar (`thumbnails.high.url`) via
 * Data API v3 (`part=snippet,statistics`). Returns `null` if the request
 * fails, the key is missing, or subscriber count cannot be read.
 */
export async function getChannelDetails(
  channelId: string,
  debugLabel?: string
): Promise<ChannelDetails | null> {
  const label = debugLabel?.trim() || channelId.trim() || "(unknown)";
  const id = channelId.trim();
  if (!id) {
    console.warn(`${LOG_PREFIX} empty channelId`, { label });
    return null;
  }

  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) {
    console.warn(`${LOG_PREFIX} YOUTUBE_API_KEY missing`, { label, channelId: id });
    return null;
  }

  const logUrl = buildChannelsSnippetStatsUrlForLog(id, apiKey);
  console.log(`${LOG_PREFIX} getChannelDetails request`, {
    label,
    channelId: id,
    url: logUrl,
  });

  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("id", id);
  url.searchParams.set("key", apiKey);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      next: { revalidate: 0 },
    });
  } catch (err) {
    console.error(`${LOG_PREFIX} fetch threw`, {
      label,
      channelId: id,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return null;
  }

  const status = res.status;
  const statusText = res.statusText;
  const rawText = await res.text();
  console.log(`${LOG_PREFIX} raw HTTP response`, {
    label,
    channelId: id,
    status,
    statusText,
    bodyLength: rawText.length,
    body: rawText,
  });

  if (!res.ok) {
    console.error(`${LOG_PREFIX} non-OK HTTP status`, {
      label,
      channelId: id,
      status,
      statusText,
    });
    return null;
  }

  let body: YouTubeChannelsResponse;
  try {
    body = JSON.parse(rawText) as YouTubeChannelsResponse;
  } catch (err) {
    console.error(`${LOG_PREFIX} JSON.parse failed`, {
      label,
      channelId: id,
      error: err instanceof Error ? err.message : String(err),
      snippet: rawText.slice(0, 500),
    });
    return null;
  }

  console.log(`${LOG_PREFIX} parsed JSON`, {
    label,
    channelId: id,
    json: body,
  });

  const item = body.items?.[0];
  const raw = item?.statistics?.subscriberCount;
  if (raw === undefined || raw === null) {
    console.warn(`${LOG_PREFIX} no subscriberCount in parsed body`, {
      label,
      channelId: id,
      itemsLength: body.items?.length ?? 0,
    });
    return null;
  }

  const subscriberCount = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(subscriberCount) || subscriberCount < 0) {
    console.warn(`${LOG_PREFIX} invalid subscriberCount number`, {
      label,
      channelId: id,
      raw,
      parsed: subscriberCount,
    });
    return null;
  }

  const profileImageUrl = highThumbnailUrlFromSnippet(item?.snippet);

  console.log(`${LOG_PREFIX} getChannelDetails success`, {
    label,
    channelId: id,
    subscriberCount,
    profileImageUrl: profileImageUrl ?? "(none)",
  });

  return { subscriberCount, profileImageUrl };
}

/**
 * Fetches subscriber count for a YouTube channel ID via Data API v3.
 * Returns null if the request fails, key is missing, or no statistics exist.
 *
 * @param debugLabel Optional label (e.g. creator id + name) included in server logs.
 */
export async function getSubscriberCount(
  channelId: string,
  debugLabel?: string
): Promise<number | null> {
  const d = await getChannelDetails(channelId, debugLabel);
  return d?.subscriberCount ?? null;
}
