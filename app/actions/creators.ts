"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { CreatorFormState } from "@/lib/types/creator-form";
import {
  createCreator,
  deleteCreator,
  parseCreatorForm,
  setCreatorActive,
  updateCreator,
} from "@/lib/services/creators";

export async function createCreatorAction(
  _prev: CreatorFormState,
  formData: FormData
): Promise<CreatorFormState> {
  const parsed = parseCreatorForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  await createCreator(parsed.value);
  revalidatePath("/admin/creators");
  redirect("/admin/creators");
}

export async function updateCreatorAction(
  id: string,
  _prev: CreatorFormState,
  formData: FormData
): Promise<CreatorFormState> {
  const trimmedId = id.trim();
  if (!trimmedId) return { error: "Missing creator id." };
  const parsed = parseCreatorForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const updated = await updateCreator(trimmedId, parsed.value);
  if (!updated) return { error: "Creator not found." };
  revalidatePath("/admin/creators");
  revalidatePath(`/admin/creators/${trimmedId}/edit`);
  redirect("/admin/creators");
}

export async function toggleCreatorActiveAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const nextRaw = formData.get("is_active");
  const is_active = nextRaw === "true" || nextRaw === "on";
  if (!id) return;
  await setCreatorActive(id, is_active);
  revalidatePath("/admin/creators");
  revalidatePath(`/admin/creators/${id}/edit`);
}

export async function deleteCreatorAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await deleteCreator(id);
  revalidatePath("/admin/creators");
  redirect("/admin/creators");
}
