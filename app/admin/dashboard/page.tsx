import { getAdminSessionFromCookies } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
  const session = await getAdminSessionFromCookies();

  return (
    <div className="mx-auto max-w-2xl space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground text-sm">
        Signed in as{" "}
        <span className="text-foreground font-medium">{session?.email}</span>.
        Creator management, snapshots, and milestones will be added here next.
      </p>
    </div>
  );
}
