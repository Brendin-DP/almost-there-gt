import { SyncSnapshotCountsButton } from "@/components/admin/sync-snapshot-counts-button";

export default function AdminSnapshotsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Snapshots</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Log subscriber counts per creator. Use{" "}
          <strong className="text-foreground font-medium">Sync Counts</strong>{" "}
          to pull the latest numbers from YouTube for every active creator that
          has a channel ID (today’s date is used as{" "}
          <code className="text-foreground">recorded_at</code>).
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SyncSnapshotCountsButton />
      </div>
    </div>
  );
}
