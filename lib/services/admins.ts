import "server-only";

import type { Admin } from "@/lib/db/types";
import { createServiceRoleClient } from "@/lib/supabase/service";

function normalizeAdminRow(row: Record<string, unknown>): Admin {
  const createdRaw = row.created_at;
  const created_at =
    typeof createdRaw === "string" ? createdRaw : new Date().toISOString();
  return {
    id: String(row.id),
    email: String(row.email),
    password: String(row.password),
    created_at,
  };
}

export async function getAdminByEmail(email: string): Promise<Admin | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("admins")
    .select("id, email, password, created_at")
    .eq("email", normalized)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object") return null;
  return normalizeAdminRow(data as Record<string, unknown>);
}
