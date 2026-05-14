import Link from "next/link";

import { CreatorProfileImage } from "@/components/creator-profile-image";
import { TrendLine } from "@/components/creator-public-card";
import type { PublicDashboardCreator } from "@/lib/services/public-dashboard";
import {
  formatSubscriberCompact,
  getSubscriberBarProgress,
} from "@/lib/subscriber-bar";
import { cn } from "@/lib/utils";

function formatFullCount(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

export function CreatorDashboardBarRow({
  creator,
}: {
  creator: PublicDashboardCreator;
}) {
  const href = `/creators/${creator.creator_id}`;
  const count = creator.current_subscriber_count;
  const hasCount = count != null && Number.isFinite(count) && count >= 0;
  const band = hasCount && count != null ? getSubscriberBarProgress(count) : null;
  const pct = band?.pct ?? 0;
  /** Keep thumb slightly inset at extremes so it doesn’t clip. */
  const thumbLeftPct = Math.min(96, Math.max(4, pct * 100));
  const fillWidthPct = Math.min(100, Math.max(0, pct * 100));

  const countLabel =
    count != null && Number.isFinite(count) ? formatFullCount(count) : "—";

  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-amber-50/40 p-4 shadow-sm transition-all",
        "hover:border-violet-300 hover:shadow-md focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      )}
      aria-label={`${creator.creator_name}, ${countLabel} subscribers`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="min-w-0 shrink-0 sm:w-40">
          <p className="truncate text-base font-semibold tracking-tight text-violet-950 group-hover:underline">
            {creator.creator_name}
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm tabular-nums">
            {countLabel === "—" ? "No snapshot yet" : `${countLabel} subscribers`}
          </p>
          <div className="mt-1">
            <TrendLine creator={creator} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative pt-1 pb-6">
            <div
              className={cn(
                "relative h-11 overflow-visible rounded-full shadow-inner",
                "bg-gradient-to-b from-violet-900 via-violet-800 to-violet-950 ring-1 ring-violet-950/30"
              )}
            >
              {band ? (
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-700 ease-out"
                  style={{
                    width: `${fillWidthPct}%`,
                    backgroundImage: `repeating-linear-gradient(
                      -52deg,
                      #facc15 0px,
                      #facc15 9px,
                      #eab308 9px,
                      #eab308 18px
                    )`,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                />
              ) : (
                <div className="absolute inset-y-0 left-0 w-[3%] rounded-full bg-violet-600/40" />
              )}

              <div
                className="absolute top-1/2 z-10 size-[3.25rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[3px] border-white bg-violet-950 shadow-lg ring-2 ring-black/15 transition-[left] duration-700 ease-out"
                style={{ left: `${thumbLeftPct}%` }}
              >
                {creator.profile_image_url ? (
                  <CreatorProfileImage
                    src={creator.profile_image_url}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-lg font-bold text-amber-200">
                    {creator.creator_name.trim().slice(0, 1).toUpperCase() || "?"}
                  </span>
                )}
              </div>
            </div>

            <div className="text-violet-950/90 pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-0.5">
              <span className="text-xs font-bold italic tracking-wide drop-shadow-sm">
                {band ? formatSubscriberCompact(band.lower) : "—"}
              </span>
              <span className="text-xs font-bold italic tracking-wide drop-shadow-sm">
                {band ? formatSubscriberCompact(band.upper) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
