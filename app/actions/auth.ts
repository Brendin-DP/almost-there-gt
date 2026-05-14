"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcrypt";

import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
  signAdminSession,
} from "@/lib/auth/session";
import { getAdminByEmail } from "@/lib/services/admins";

export type LoginState = {
  error: string | null;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const emailRaw = formData.get("email");
  const passwordRaw = formData.get("password");

  const email =
    typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const password = typeof passwordRaw === "string" ? passwordRaw : "";

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const admin = await getAdminByEmail(email);

  if (!admin) {
    return { error: "Invalid email or password." };
  }

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) {
    return { error: "Invalid email or password." };
  }

  const token = await signAdminSession({
    sub: admin.id,
    email: admin.email,
  });
  await setAdminSessionCookie(token);
  redirect("/admin/dashboard");
}

export async function logoutAction() {
  await clearAdminSessionCookie();
  redirect("/");
}
