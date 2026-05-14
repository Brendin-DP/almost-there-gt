import Link from "next/link";

import { PublicDashboardViews } from "@/components/public-dashboard-views";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminSessionFromCookies } from "@/lib/auth/session";
import { listPublicDashboardCreators } from "@/lib/services/public-dashboard";

export default async function HomePage() {
  const session = await getAdminSessionFromCookies();

  let creators: Awaited<ReturnType<typeof listPublicDashboardCreators>> = [];
  let loadError: string | null = null;
  try {
    creators = await listPublicDashboardCreators();
  } catch (e) {
    loadError =
      e instanceof Error ? e.message : "Could not load the public dashboard.";
  }

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 md:px-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Almost There
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            GT7 creators — live subscriber counts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/dashboard">Admin</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Admin sign in</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-8 md:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          {loadError ? (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Couldn&apos;t load creators
                </CardTitle>
                <CardDescription className="text-destructive/90 whitespace-pre-wrap">
                  {loadError}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : creators.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No creators yet</CardTitle>
                <CardDescription>
                  When active creators exist in Supabase, they&apos;ll show here
                  with their latest snapshot. Run a snapshot sync from admin to
                  populate subscriber counts.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <PublicDashboardViews creators={creators} />
          )}
        </div>
      </main>
    </div>
  );
}
