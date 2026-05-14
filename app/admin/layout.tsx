import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { getAdminSessionFromCookies } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSessionFromCookies();

  return (
    <div className="bg-background min-h-svh flex flex-col">
      <header className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/admin/dashboard" className="text-foreground">
            Admin
          </Link>
          <nav className="text-muted-foreground flex flex-wrap gap-4">
            <Link href="/admin/creators" className="hover:text-foreground">
              Creators
            </Link>
            <Link href="/admin/snapshots" className="hover:text-foreground">
              Snapshots
            </Link>
            <Link href="/admin/milestones" className="hover:text-foreground">
              Milestones
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <span className="text-muted-foreground hidden text-sm sm:inline">
              {session.email}
            </span>
          ) : null}
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
