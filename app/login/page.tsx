import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getAdminSessionFromCookies } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getAdminSessionFromCookies();
  if (session) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Almost There — GT7 creator tracking.{" "}
          <Link href="/" className="text-foreground font-medium underline underline-offset-2">
            Back to public dashboard
          </Link>
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
