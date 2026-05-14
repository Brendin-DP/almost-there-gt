import { NextResponse } from "next/server";

import { getAdminSessionFromCookies } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { buildChannelsStatsUrlForLog, getSubscriberCount } from "@/lib/youtube";

/** Creators list and snapshot writes use the service role client (bypasses RLS). */

const LOG_PREFIX = "[snapshots/sync]";

export type SyncFailure = {
  creatorId: string;
  name?: string;
  reason: string;
};

export type SyncSummary = {
  ok: boolean;
  attempted: number;
  succeeded: number;
  failed: number;
  failures: SyncFailure[];
};

function todayUtcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function logSupabaseError(context: string, err: object) {
  const message =
    "message" in err && typeof err.message === "string" ? err.message : undefined;
  const code =
    "code" in err && typeof err.code === "string" ? err.code : undefined;
  const details =
    "details" in err && typeof err.details === "string" ? err.details : undefined;
  const hint =
    "hint" in err && typeof err.hint === "string" ? err.hint : undefined;

  console.error(`${LOG_PREFIX} ${context}`, {
    message,
    code,
    details,
    hint,
    full: JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
    raw: err,
  });
}

export async function POST() {
  console.log(`${LOG_PREFIX} POST started`);

  const session = await getAdminSessionFromCookies();
  if (!session) {
    console.warn(`${LOG_PREFIX} unauthorized — no admin session cookie`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const youtubeKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!youtubeKey) {
    console.error(`${LOG_PREFIX} YOUTUBE_API_KEY missing`);
    return NextResponse.json(
      { error: "YouTube API is not configured (missing YOUTUBE_API_KEY)." },
      { status: 503 }
    );
  }

  const supabaseService = createServiceRoleClient();

  const { data: rows, error: listError } = await supabaseService
    .from("creators")
    .select("id, name, youtube_channel_id")
    .eq("is_active", true);

  if (listError) {
    logSupabaseError("creators list query failed", listError);
    return NextResponse.json(
      { error: listError.message, ok: false } satisfies Partial<SyncSummary> & {
        error: string;
      },
      { status: 500 }
    );
  }

  const rowList = rows ?? [];
  console.log(`${LOG_PREFIX} Supabase creators fetched`, {
    count: rowList.length,
    creators: rowList.map((c) => ({
      id: c.id,
      name: c.name,
      youtube_channel_id: c.youtube_channel_id,
    })),
  });

  const creators = rowList.filter((c) => {
    const ch =
      typeof c.youtube_channel_id === "string"
        ? c.youtube_channel_id.trim()
        : "";
    return ch.length > 0;
  });

  console.log(`${LOG_PREFIX} after youtube_channel_id filter`, {
    count: creators.length,
    channelIds: creators.map((c) => ({
      id: c.id,
      name: c.name,
      youtube_channel_id:
        typeof c.youtube_channel_id === "string"
          ? c.youtube_channel_id.trim()
          : c.youtube_channel_id,
    })),
  });

  const failures: SyncFailure[] = [];
  let succeeded = 0;
  const recordedAt = todayUtcDateString();
  const createdAt = new Date().toISOString();

  for (const c of creators) {
    const creatorId = String(c.id);
    const name = typeof c.name === "string" ? c.name : undefined;
    const channelId = String(c.youtube_channel_id).trim();
    const debugLabel = `${creatorId}${name ? ` (${name})` : ""}`;

    const maskedUrl = buildChannelsStatsUrlForLog(channelId, youtubeKey);
    console.log(`${LOG_PREFIX} YouTube API URL (masked key, last 4 visible)`, {
      creatorId,
      name,
      channelId,
      url: maskedUrl,
    });

    const count = await getSubscriberCount(channelId, debugLabel);
    if (count === null) {
      console.warn(`${LOG_PREFIX} YouTube returned no subscriber count`, {
        creatorId,
        name,
        channelId,
      });
      failures.push({
        creatorId,
        name,
        reason: "Could not read subscriber count from YouTube.",
      });
      continue;
    }

    console.log(`${LOG_PREFIX} inserting snapshot`, {
      creatorId,
      name,
      subscriber_count: count,
      recorded_at: recordedAt,
      created_at: createdAt,
    });

    const { error: insertError, data: insertData } = await supabaseService
      .from("snapshots")
      .insert({
        creator_id: creatorId,
        subscriber_count: count,
        recorded_at: recordedAt,
        created_at: createdAt,
      })
      .select();

    if (insertError) {
      logSupabaseError(`snapshot insert failed creator=${creatorId}`, insertError);
      failures.push({
        creatorId,
        name,
        reason: insertError.message,
      });
      continue;
    }

    console.log(`${LOG_PREFIX} snapshot insert OK`, {
      creatorId,
      name,
      returnedRow: insertData,
    });

    succeeded += 1;
  }

  const summary: SyncSummary = {
    ok: failures.length === 0,
    attempted: creators.length,
    succeeded,
    failed: failures.length,
    failures,
  };

  console.log(`${LOG_PREFIX} POST finished`, summary);

  return NextResponse.json(summary);
}
