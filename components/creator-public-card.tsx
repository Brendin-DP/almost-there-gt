import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreatorProfileImage } from "@/components/creator-profile-image";
import type { PublicDashboardCreator } from "@/lib/services/public-dashboard";
import { cn } from "@/lib/utils";

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    n
  );
}

function TrendLine({ creator }: { creator: PublicDashboardCreator }) {
  const { direction, delta } = creator;

  if (direction === "unknown" || delta == null) {
    return (
      <p className="text-muted-foreground text-sm font-medium tabular-nums">
        7d: —
      </p>
    );
  }

  if (direction === "flat") {
    return (
      <p className="text-muted-foreground text-sm font-medium tabular-nums">
        7d: Flat
      </p>
    );
  }

  const formatted = formatCount(Math.abs(delta));
  const prefix = direction === "up" ? "+" : "−";

  return (
    <p
      className={cn(
        "text-sm font-medium tabular-nums",
        direction === "up" && "text-emerald-600",
        direction === "down" && "text-red-600"
      )}
    >
      7d: {prefix}
      {formatted}
    </p>
  );
}

export function CreatorPublicCard({ creator }: { creator: PublicDashboardCreator }) {
  const href = `/creators/${creator.creator_id}`;
  const countLabel =
    creator.current_subscriber_count != null &&
    Number.isFinite(creator.current_subscriber_count)
      ? formatCount(creator.current_subscriber_count)
      : "—";

  return (
    <Link
      href={href}
      className="group block h-full focus-visible:ring-ring rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      aria-label={`${creator.creator_name}, ${countLabel} subscribers`}
    >
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
          <div className="bg-muted text-muted-foreground relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold">
            {creator.profile_image_url ? (
              <CreatorProfileImage
                src={creator.profile_image_url}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span aria-hidden>
                {creator.creator_name.trim().slice(0, 1).toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="truncate text-lg leading-tight group-hover:underline">
              {creator.creator_name}
            </CardTitle>
            <p className="text-muted-foreground text-sm tabular-nums">
              {countLabel === "—" ? "No snapshot yet" : `${countLabel} subscribers`}
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <TrendLine creator={creator} />
        </CardContent>
      </Card>
    </Link>
  );
}
