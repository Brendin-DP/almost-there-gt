import "server-only";

import type { Creator } from "@/lib/db/types";
import { normalizeCreator } from "@/lib/services/creators";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type CreatorLatestSnapshotRow = {
  creator: Creator;
  latestSubscriberCount: number | null;
  /** `recorded_at` on the latest snapshot (logical day). */
  latestRecordedAt: string | null;
  /** `created_at` on the latest snapshot (when the row was inserted / fetch time). */
  latestCreatedAt: string | null;
};

type SnapshotRow = {
  id: string;
  creator_id: string;
  subscriber_count: number;
  recorded_at: string;
  created_at: string;
};

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
 * All creators (active and inactive) with their most recent snapshot by
 * `recorded_at`, then `created_at`, then `id`.
 */
export async function listCreatorsWithLatestSnapshot(): Promise<
  CreatorLatestSnapshotRow[]
> {
  const supabase = createServiceRoleClient();

  const { data: creatorRows, error: creatorsError } = await supabase
    .from("creators")
    .select("*")
    .order("name", { ascending: true });

  if (creatorsError) throw new Error(creatorsError.message);

  const creators = (creatorRows ?? []).map((row) => normalizeCreator(row));
  if (creators.length === 0) return [];

  const ids = creators.map((c) => c.id).filter(Boolean);

  const { data: snapRows, error: snapsError } = await supabase
    .from("snapshots")
    .select("id, creator_id, subscriber_count, recorded_at, created_at")
    .in("creator_id", ids);

  if (snapsError) throw new Error(snapsError.message);

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

  return creators.map((creator) => {
    const snaps = byCreator.get(creator.id) ?? [];
    const latest = snaps[0] ?? null;
    return {
      creator,
      latestSubscriberCount: latest ? latest.subscriber_count : null,
      latestRecordedAt: latest ? latest.recorded_at : null,
      latestCreatedAt: latest ? latest.created_at : null,
    };
  });
}

export type SnapshotPivotColumn = {
  /** Unique key from `created_at` (insert / generation time). */
  createdAt: string;
  /** Short label for table header. */
  label: string;
};

export type SnapshotPivotRow = {
  creatorId: string;
  name: string;
  /** Subscriber counts aligned to `columns` (null = no snapshot that run). */
  counts: (number | null)[];
};

/**
 * Matrix: one row per creator (name), one column per distinct snapshot
 * `created_at` (generation time), sorted oldest → newest for horizontal timeline.
 */
export async function listSnapshotPivot(): Promise<{
  columns: SnapshotPivotColumn[];
  rows: SnapshotPivotRow[];
}> {
  const supabase = createServiceRoleClient();

  const { data: creatorRows, error: creatorsError } = await supabase
    .from("creators")
    .select("id, name")
    .order("name", { ascending: true });

  if (creatorsError) throw new Error(creatorsError.message);

  const creators = (creatorRows ?? [])
    .map((r) => ({
      id: typeof r.id === "string" ? r.id : "",
      name: typeof r.name === "string" ? r.name : "",
    }))
    .filter((c) => c.id);

  if (creators.length === 0) {
    return { columns: [], rows: [] };
  }

  const ids = creators.map((c) => c.id);

  const { data: snapRows, error: snapsError } = await supabase
    .from("snapshots")
    .select("creator_id, subscriber_count, created_at")
    .in("creator_id", ids)
    .order("created_at", { ascending: true });

  if (snapsError) throw new Error(snapsError.message);

  type Cell = { creator_id: string; subscriber_count: number; created_at: string };
  const cells: Cell[] = [];
  for (const raw of snapRows ?? []) {
    const r = raw as Record<string, unknown>;
    const creator_id = typeof r.creator_id === "string" ? r.creator_id : "";
    const sc = r.subscriber_count;
    const subscriber_count =
      typeof sc === "number" ? sc : sc != null ? Number(sc) : NaN;
    const created_at = typeof r.created_at === "string" ? r.created_at : "";
    if (
      !creator_id ||
      !created_at ||
      !Number.isFinite(subscriber_count)
    ) {
      continue;
    }
    cells.push({ creator_id, subscriber_count, created_at });
  }

  const uniqueCreated = Array.from(
    new Set(cells.map((c) => c.created_at))
  ).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const columns: SnapshotPivotColumn[] = uniqueCreated.map((createdAt) => ({
    createdAt,
    label: formatSnapshotDateTime(createdAt),
  }));

  const colIndex = new Map<string, number>();
  uniqueCreated.forEach((k, i) => colIndex.set(k, i));

  const lastByCreatorCol = new Map<string, Map<number, number>>();
  for (const cell of cells) {
    const idx = colIndex.get(cell.created_at);
    if (idx === undefined) continue;
    let byCol = lastByCreatorCol.get(cell.creator_id);
    if (!byCol) {
      byCol = new Map();
      lastByCreatorCol.set(cell.creator_id, byCol);
    }
    byCol.set(idx, cell.subscriber_count);
  }

  const rows: SnapshotPivotRow[] = creators.map((c) => {
    const byCol = lastByCreatorCol.get(c.id);
    const counts = uniqueCreated.map((_, i) => byCol?.get(i) ?? null);
    return { creatorId: c.id, name: c.name, counts };
  });

  return { columns, rows };
}

export function formatSnapshotDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
