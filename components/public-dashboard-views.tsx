"use client";

import { LayoutGrid, Rows3 } from "lucide-react";
import { startTransition, useEffect, useState } from "react";

import { CreatorDashboardBarRow } from "@/components/creator-dashboard-bar-row";
import { CreatorPublicCard } from "@/components/creator-public-card";
import { Button } from "@/components/ui/button";
import type { PublicDashboardCreator } from "@/lib/services/public-dashboard";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "at-dashboard-view";

type DashboardView = "bar" | "grid";

type Props = {
  creators: PublicDashboardCreator[];
};

export function PublicDashboardViews({ creators }: Props) {
  const [view, setView] = useState<DashboardView>("bar");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "grid" || stored === "bar") {
        startTransition(() => setView(stored));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">Choose how you browse creators.</p>
        <div
          className="bg-muted/60 flex rounded-lg border p-0.5"
          role="group"
          aria-label="Dashboard layout"
        >
          <Button
            type="button"
            variant={view === "bar" ? "default" : "ghost"}
            size="sm"
            className={cn("gap-1.5 rounded-md px-3", view === "bar" && "shadow-sm")}
            onClick={() => setView("bar")}
            aria-pressed={view === "bar"}
          >
            <Rows3 className="size-4" aria-hidden />
            Bar view
          </Button>
          <Button
            type="button"
            variant={view === "grid" ? "default" : "ghost"}
            size="sm"
            className={cn("gap-1.5 rounded-md px-3", view === "grid" && "shadow-sm")}
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
          >
            <LayoutGrid className="size-4" aria-hidden />
            Grid view
          </Button>
        </div>
      </div>

      {view === "bar" ? (
        <div className="flex flex-col gap-4">
          {creators.map((c) => (
            <CreatorDashboardBarRow key={c.creator_id} creator={c} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c) => (
            <CreatorPublicCard key={c.creator_id} creator={c} />
          ))}
        </div>
      )}
    </div>
  );
}
