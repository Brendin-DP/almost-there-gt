import { redirect } from "next/navigation";

import { getAdminSessionFromCookies } from "@/lib/auth/session";
import { LoginForm } from "@/components/login-form";

export default async function HomePage() {
  const session = await getAdminSessionFromCookies();
  if (session) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Almost There</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Admin sign-in. Public dashboard and predictor will live on separate
          routes later.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
