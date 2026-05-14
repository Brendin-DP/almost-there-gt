"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { SyncSummary } from "@/app/api/snapshots/sync/route";
import { Button } from "@/components/ui/button";

export function SyncSnapshotCountsButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/snapshots/sync", {
        method: "POST",
        credentials: "include",
      });

      let body: unknown;
      try {
        body = await res.json();
      } catch {
        toast.error("Invalid response from server.");
        return;
      }

      if (res.status === 401) {
        toast.error("You are not signed in as admin.");
        return;
      }

      if (!res.ok) {
        const err =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof (body as { error?: unknown }).error === "string"
            ? (body as { error: string }).error
            : `Sync failed (${res.status}).`;
        toast.error(err);
        return;
      }

      const summary = body as SyncSummary;

      if (summary.attempted === 0) {
        toast.info("No active creators with a YouTube channel ID to sync.");
        return;
      }

      if (summary.ok) {
        toast.success(
          `Synced ${summary.succeeded} of ${summary.attempted} creator(s).`
        );
        return;
      }

      toast.warning(
        `Synced ${summary.succeeded} of ${summary.attempted}. ${summary.failed} failed.`
      );
      const preview = summary.failures
        .slice(0, 3)
        .map((f) => `${f.name ?? f.creatorId}: ${f.reason}`)
        .join(" · ");
      if (preview) {
        toast.message("Failures", { description: preview });
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Sync request failed unexpectedly."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" disabled={loading} onClick={handleClick}>
      {loading ? "Syncing…" : "Sync Counts"}
    </Button>
  );
}
