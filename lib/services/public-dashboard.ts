import "server-only";

import { createClient } from "@/lib/supabase/server";
import { normalizeHttpsUrl } from "@/lib/utils";

export type PublicDashboardRow = {
  creator_id: string;
  creator_name: string;
  profile_image_url: string | null;
  current_subscriber_count: number | null;
  week_ago_subscriber_count: number | null;
};

export type PublicDashboardCreator = PublicDashboardRow & {
  delta: number | null;
  direction: "up" | "down" | "flat" | "unknown";
};

type SnapshotRow = {
  id: string;
  creator_id: string;
  subscriber_count: number;
  recorded_at: string;
  created_at: string;
};

function withTrend(row: PublicDashboardRow): PublicDashboardCreator {
  const current = row.current_subscriber_count;
  const week = row.week_ago_subscriber_count;
  if (
    current == null ||
    week == null ||
    !Number.isFinite(current) ||
    !Number.isFinite(week)
  ) {
    return { ...row, delta: null, direction: "unknown" };
  }
  const delta = current - week;
  if (delta > 0) return { ...row, delta, direction: "up" };
  if (delta < 0) return { ...row, delta, direction: "down" };
  return { ...row, delta: 0, direction: "flat" };
}

/** Newest snapshot first (matches prior SQL ordering). */
function compareSnapshotsDesc(a: SnapshotRow, b: SnapshotRow): number {
  const ta = new Date(a.recorded_at).getTime();
  const tb = new Date(b.recorded_at).getTime();
  if (tb !== ta) return tb - ta;
  const ca = new Date(a.created_at).getTime();
  const cb = new Date(b.created_at).getTime();
  if (cb !== ca) return cb - ca;
  return b.id.localeCompare(a.id);
}

function normalizeSnapshot(raw: unknown): SnapshotRow | null {
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : "";
  const creator_id = typeof r.creator_id === "string" ? r.creator_id : "";
  const sc = r.subscriber_count;
  const subscriber_count =
    typeof sc === "number" ? sc : sc != null ? Number(sc) : NaN;
  const recorded_at = typeof r.recorded_at === "string" ? r.recorded_at : "";
  const created_at =
    typeof r.created_at === "string" && r.created_at.trim() !== ""
      ? r.created_at
      : recorded_at;
  if (
    !id ||
    !creator_id ||
    !Number.isFinite(subscriber_count) ||
    !recorded_at
  ) {
    return null;
  }
  return {
    id,
    creator_id,
    subscriber_count,
    recorded_at,
    created_at,
  };
}

/**
 * Snapshot closest in time to (latest.recorded_at − 7 days), excluding the
 * latest row, among rows with recorded_at ≤ latest.recorded_at.
 */
function pickWeekAgoSnapshot(
  orderedNewestFirst: SnapshotRow[],
  latest: SnapshotRow
): SnapshotRow | null {
  const latestAt = new Date(latest.recorded_at).getTime();
  const targetMs = latestAt - 7 * 24 * 60 * 60 * 1000;

  const candidates = orderedNewestFirst.filter(
    (s) =>
      s.id !== latest.id && new Date(s.recorded_at).getTime() <= latestAt
  );
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const da = Math.abs(new Date(a.recorded_at).getTime() - targetMs);
    const db = Math.abs(new Date(b.recorded_at).getTime() - targetMs);
    if (da !== db) return da - db;
    return compareSnapshotsDesc(a, b);
  });

  return candidates[0] ?? null;
}

/**
 * Loads active creators and their snapshots via the anon server client (two
 * queries), then derives latest count, 7‑day baseline, and sort order in memory.
 */
export async function listPublicDashboardCreators(): Promise<
  PublicDashboardCreator[]
> {
  const supabase = await createClient();

  const { data: creatorRows, error: creatorsError } = await supabase
    .from("creators")
    .select("id, name, profile_image_url")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (creatorsError) {
    throw new Error(creatorsError.message);
  }

  const creators = creatorRows ?? [];
  if (creators.length === 0) {
    return [];
  }

  const ids = creators
    .map((c) => (typeof c.id === "string" ? c.id : ""))
    .filter(Boolean);
  if (ids.length === 0) {
    return [];
  }

  const { data: snapRows, error: snapsError } = await supabase
    .from("snapshots")
    .select("id, creator_id, subscriber_count, recorded_at, created_at")
    .in("creator_id", ids);

  if (snapsError) {
    throw new Error(snapsError.message);
  }

  const byCreator = new Map<string, SnapshotRow[]>();
  for (const raw of snapRows ?? []) {
    const row = normalizeSnapshot(raw);
    if (!row) continue;
    const list = byCreator.get(row.creator_id) ?? [];
    list.push(row);
    byCreator.set(row.creator_id, list);
  }
  for (const list of byCreator.values()) {
    list.sort(compareSnapshotsDesc);
  }

  const rows: PublicDashboardRow[] = creators.map((c) => {
    const id = typeof c.id === "string" ? c.id : "";
    const name = typeof c.name === "string" ? c.name : "";
    const profileRaw =
      typeof c.profile_image_url === "string" &&
      c.profile_image_url.trim() !== ""
        ? c.profile_image_url.trim()
        : null;
    const profile_image_url = profileRaw
      ? normalizeHttpsUrl(profileRaw)
      : null;

    const snaps = byCreator.get(id) ?? [];
    const latest = snaps[0] ?? null;
    const week = latest ? pickWeekAgoSnapshot(snaps, latest) : null;

    return {
      creator_id: id,
      creator_name: name,
      profile_image_url,
      current_subscriber_count: latest ? latest.subscriber_count : null,
      week_ago_subscriber_count: week ? week.subscriber_count : null,
    };
  });

  rows.sort((a, b) => {
    const ca = a.current_subscriber_count;
    const cb = b.current_subscriber_count;
    if (ca == null && cb == null) {
      return a.creator_name.localeCompare(b.creator_name);
    }
    if (ca == null) return 1;
    if (cb == null) return -1;
    if (cb !== ca) return cb - ca;
    return a.creator_name.localeCompare(b.creator_name);
  });

  return rows.map(withTrend);
}

export type PublicCreatorSummary = {
  id: string;
  name: string;
  channel_name: string;
  profile_image_url: string | null;
  youtube_channel_id: string;
};

/**
 * Single active creator for public detail pages (anon server client).
 */
export async function getPublicCreatorById(
  id: string
): Promise<PublicCreatorSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creators")
    .select("id, name, channel_name, profile_image_url, youtube_channel_id")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data || typeof data.id !== "string") return null;

  const name = typeof data.name === "string" ? data.name : "";
  const channel_name =
    typeof data.channel_name === "string" && data.channel_name.trim() !== ""
      ? data.channel_name.trim()
      : name;
  const profileRaw =
    typeof data.profile_image_url === "string" &&
    data.profile_image_url.trim() !== ""
      ? data.profile_image_url.trim()
      : null;
  const profile_image_url = profileRaw
    ? normalizeHttpsUrl(profileRaw)
    : null;
  const youtube_channel_id =
    typeof data.youtube_channel_id === "string" ? data.youtube_channel_id : "";

  return {
    id: data.id,
    name,
    channel_name,
    profile_image_url,
    youtube_channel_id,
  };
}
