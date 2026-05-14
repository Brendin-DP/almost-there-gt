import Link from "next/link";

import { toggleCreatorActiveAction } from "@/app/actions/creators";
import { SyncSnapshotCountsButton } from "@/components/admin/sync-snapshot-counts-button";
import { CreatorProfileImage } from "@/components/creator-profile-image";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatSnapshotDateTime,
  listCreatorsWithLatestSnapshot,
} from "@/lib/services/snapshots";

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    n
  );
}

export default async function AdminCreatorsPage() {
  const rows = await listCreatorsWithLatestSnapshot();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Creators</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage tracked GT7 creators (stored in Supabase).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SyncSnapshotCountsButton variant="secondary" label="Sync Count" />
          <Button asChild>
            <Link href="/admin/creators/new">Add creator</Link>
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No creators yet.{" "}
          <Link href="/admin/creators/new" className="text-foreground underline">
            Add your first creator
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14" />
                <TableHead>Name</TableHead>
                <TableHead>Channel name</TableHead>
                <TableHead>Channel ID</TableHead>
                <TableHead className="text-right tabular-nums">Sub count</TableHead>
                <TableHead className="text-right">Updated at</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(
                ({
                  creator: c,
                  latestSubscriberCount,
                  latestCreatedAt,
                }) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center overflow-hidden rounded-md text-xs font-medium">
                        {c.profile_image_url ? (
                          <CreatorProfileImage
                            src={c.profile_image_url}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          "—"
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="max-w-[12rem] truncate text-sm">
                      {c.channel_name}
                    </TableCell>
                    <TableCell>
                      <code className="text-muted-foreground text-xs">
                        {c.youtube_channel_id}
                      </code>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {latestSubscriberCount != null &&
                      Number.isFinite(latestSubscriberCount)
                        ? formatCount(latestSubscriberCount)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right text-sm whitespace-nowrap">
                      {formatSnapshotDateTime(latestCreatedAt)}
                    </TableCell>
                    <TableCell>
                      {c.is_active ? (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Active
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/creators/${c.id}/edit`}>Edit</Link>
                        </Button>
                        <form action={toggleCreatorActiveAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <input
                            type="hidden"
                            name="is_active"
                            value={String(!c.is_active)}
                          />
                          <Button type="submit" variant="secondary" size="sm">
                            {c.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
