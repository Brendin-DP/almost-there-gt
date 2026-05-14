import Link from "next/link";

import { SyncSnapshotCountsButton } from "@/components/admin/sync-snapshot-counts-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSnapshotPivot } from "@/lib/services/snapshots";

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    n
  );
}

export default async function AdminSnapshotsPage() {
  const { columns, rows } = await listSnapshotPivot();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Snapshots</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Each column is a snapshot run (insert time). Cells show subscriber
          count for that creator at that run. Use{" "}
          <strong className="text-foreground font-medium">Sync Counts</strong>{" "}
          to pull the latest numbers from YouTube for every active creator with
          a channel ID.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SyncSnapshotCountsButton />
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No creators yet.{" "}
          <Link
            href="/admin/creators/new"
            className="text-foreground font-medium underline underline-offset-2"
          >
            Add a creator
          </Link>{" "}
          first, then sync snapshots.
        </p>
      ) : columns.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No snapshot rows yet. Run <strong className="text-foreground">Sync Counts</strong>{" "}
          from the Creators or Snapshots tab to record subscriber counts.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-card text-card-foreground sticky left-0 z-20 min-w-[10rem] border-r shadow-[2px_0_8px_-4px_rgba(0,0,0,0.15)]">
                  Creator
                </TableHead>
                {columns.map((col) => (
                  <TableHead
                    key={col.createdAt}
                    title={col.createdAt}
                    className="text-muted-foreground max-w-[7rem] text-center text-xs font-normal whitespace-normal leading-tight"
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.creatorId}>
                  <TableCell className="bg-card sticky left-0 z-10 min-w-[10rem] border-r font-medium shadow-[2px_0_8px_-4px_rgba(0,0,0,0.15)]">
                    {row.name}
                  </TableCell>
                  {row.counts.map((n, i) => (
                    <TableCell
                      key={columns[i]?.createdAt ?? i}
                      className="text-center text-sm tabular-nums"
                    >
                      {n != null && Number.isFinite(n) ? formatCount(n) : "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
