/** Subscriber range width for the public dashboard bar (e.g. 400K–500K). */
export const SUBSCRIBER_BAR_BAND = 100_000;

export type SubscriberBarBand = {
  lower: number;
  upper: number;
  /** 0–1 within [lower, upper]. */
  pct: number;
};

/**
 * Maps a subscriber count to the current 100K “milestone band” (upper is the
 * next round 100K, lower is 100K below it). Progress is how far through that
 * band the count sits (100% when count === upper).
 */
export function getSubscriberBarProgress(count: number): SubscriberBarBand {
  const upper = Math.max(
    SUBSCRIBER_BAR_BAND,
    Math.ceil(count / SUBSCRIBER_BAR_BAND) * SUBSCRIBER_BAR_BAND
  );
  const lower = upper - SUBSCRIBER_BAR_BAND;
  const pct = Math.min(1, Math.max(0, (count - lower) / SUBSCRIBER_BAR_BAND));
  return { lower, upper, pct };
}

export function formatSubscriberCompact(n: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(n);
}
