import "server-only";

import type { Creator } from "@/lib/db/types";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type CreatorWriteInput = {
  name: string;
  channel_name: string;
  youtube_channel_id: string;
  profile_image_url: string | null;
  youtube_url: string | null;
  twitch_url: string | null;
  twitter_url: string | null;
  is_active: boolean;
};

function trimStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function optionalUrlOrNull(
  label: string,
  v: unknown
): { ok: true; value: string | null } | { ok: false; error: string } {
  const t = trimStr(v);
  if (t === "") return { ok: true, value: null };
  if (!isValidUrl(t)) {
    return { ok: false, error: `${label} must be empty or a valid URL.` };
  }
  return { ok: true, value: t };
}

/**
 * Map a Supabase `creators` row (or legacy mock shape) into our `Creator` type.
 */
export function normalizeCreator(record: unknown): Creator {
  const c = record as Partial<Creator> & { id?: string };
  const id = typeof c.id === "string" ? c.id : "";
  const name = typeof c.name === "string" ? c.name : "";
  const channelNameRaw =
    typeof c.channel_name === "string" ? c.channel_name.trim() : "";
  const channel_name = channelNameRaw || name;
  const youtube_channel_id =
    typeof c.youtube_channel_id === "string" ? c.youtube_channel_id : "";
  const profile =
    typeof c.profile_image_url === "string" && c.profile_image_url.trim() !== ""
      ? c.profile_image_url.trim()
      : null;
  const youtube =
    typeof c.youtube_url === "string" && c.youtube_url.trim() !== ""
      ? c.youtube_url.trim()
      : null;
  const twitch =
    typeof c.twitch_url === "string" && c.twitch_url.trim() !== ""
      ? c.twitch_url.trim()
      : null;
  const twitter =
    typeof c.twitter_url === "string" && c.twitter_url.trim() !== ""
      ? c.twitter_url.trim()
      : null;
  const is_active = typeof c.is_active === "boolean" ? c.is_active : true;
  const createdRaw = c.created_at;
  const created_at =
    typeof createdRaw === "string" ? createdRaw : new Date().toISOString();

  return {
    id,
    name,
    channel_name,
    youtube_channel_id,
    profile_image_url: profile,
    youtube_url: youtube,
    twitch_url: twitch,
    twitter_url: twitter,
    is_active,
    created_at,
  };
}

export function parseCreatorForm(
  formData: FormData
): { ok: true; value: CreatorWriteInput } | { ok: false; error: string } {
  const name = trimStr(formData.get("name"));
  const channel_name = trimStr(formData.get("channel_name"));
  const youtube_channel_id = trimStr(formData.get("youtube_channel_id"));

  if (!name) return { ok: false, error: "Name is required." };
  if (!channel_name) {
    return { ok: false, error: "Channel name is required." };
  }
  if (!youtube_channel_id) {
    return { ok: false, error: "YouTube channel ID is required." };
  }

  const profile = optionalUrlOrNull(
    "Profile image URL",
    formData.get("profile_image_url")
  );
  if (!profile.ok) return profile;

  const youtube = optionalUrlOrNull("YouTube URL", formData.get("youtube_url"));
  if (!youtube.ok) return youtube;

  const twitch = optionalUrlOrNull("Twitch URL", formData.get("twitch_url"));
  if (!twitch.ok) return twitch;
  const twitter = optionalUrlOrNull(
    "Twitter / X URL",
    formData.get("twitter_url")
  );
  if (!twitter.ok) return twitter;

  const is_active =
    formData.get("is_active") === "on" ||
    formData.get("is_active") === "true" ||
    formData.get("is_active") === "1";

  return {
    ok: true,
    value: {
      name,
      channel_name,
      youtube_channel_id,
      profile_image_url: profile.value,
      youtube_url: youtube.value,
      twitch_url: twitch.value,
      twitter_url: twitter.value,
      is_active,
    },
  };
}

export async function listCreators(options?: {
  includeInactive?: boolean;
}): Promise<Creator[]> {
  const supabase = createServiceRoleClient();
  let query = supabase.from("creators").select("*").order("name", {
    ascending: true,
  });
  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeCreator(row));
}

export async function getCreatorById(id: string): Promise<Creator | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("creators")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeCreator(data) : null;
}

export async function createCreator(input: CreatorWriteInput): Promise<Creator> {
  const supabase = createServiceRoleClient();
  const insertRow = {
    name: input.name,
    channel_name: input.channel_name,
    youtube_channel_id: input.youtube_channel_id,
    profile_image_url: input.profile_image_url,
    youtube_url: input.youtube_url,
    twitch_url: input.twitch_url,
    twitter_url: input.twitter_url,
    is_active: input.is_active,
  };
  const { data, error } = await supabase
    .from("creators")
    .insert(insertRow)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return normalizeCreator(data);
}

export async function updateCreator(
  id: string,
  input: CreatorWriteInput
): Promise<Creator | null> {
  const supabase = createServiceRoleClient();
  const updateRow = {
    name: input.name,
    channel_name: input.channel_name,
    youtube_channel_id: input.youtube_channel_id,
    profile_image_url: input.profile_image_url,
    youtube_url: input.youtube_url,
    twitch_url: input.twitch_url,
    twitter_url: input.twitter_url,
    is_active: input.is_active,
  };
  const { data, error } = await supabase
    .from("creators")
    .update(updateRow)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeCreator(data) : null;
}

export async function setCreatorActive(
  id: string,
  is_active: boolean
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("creators")
    .update({ is_active })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data != null;
}

export async function deleteCreator(id: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error: snapErr } = await supabase
    .from("snapshots")
    .delete()
    .eq("creator_id", id);
  if (snapErr) throw new Error(snapErr.message);

  const { error: msErr } = await supabase
    .from("milestones")
    .delete()
    .eq("creator_id", id);
  if (msErr) throw new Error(msErr.message);

  const { data, error } = await supabase
    .from("creators")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  return Array.isArray(data) && data.length > 0;
}
