"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase-server";

type Result = { error?: string };

export async function createAnnouncement(formData: FormData): Promise<Result> {
  const title_en = String(formData.get("title_en") ?? "").trim();
  const title_es = String(formData.get("title_es") ?? "").trim();
  const body_en = String(formData.get("body_en") ?? "").trim();
  const body_es = String(formData.get("body_es") ?? "").trim();
  const priority = parseInt(String(formData.get("priority") ?? "0"), 10) || 0;
  const active = formData.get("active") === "on";
  if (!title_en || !title_es || !body_en || !body_es) {
    return { error: "All four EN/ES fields are required." };
  }
  const svc = createServiceClient();
  const { error } = await svc.from("announcements").insert({
    title_en,
    title_es,
    body_en,
    body_es,
    priority,
    active,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/announcements");
  return {};
}

export async function toggleActive(formData: FormData): Promise<Result> {
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return { error: "id required" };
  const svc = createServiceClient();
  const { error } = await svc
    .from("announcements")
    .update({ active: !active })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/announcements");
  return {};
}

export async function bumpPriority(formData: FormData): Promise<Result> {
  const id = String(formData.get("id") ?? "");
  const delta = parseInt(String(formData.get("delta") ?? "0"), 10) || 0;
  if (!id) return { error: "id required" };
  const svc = createServiceClient();
  const { data: row } = await svc
    .from("announcements")
    .select("priority")
    .eq("id", id)
    .single();
  const next = (row?.priority ?? 0) + delta;
  const { error } = await svc
    .from("announcements")
    .update({ priority: next })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/announcements");
  return {};
}

export async function deleteAnnouncement(formData: FormData): Promise<Result> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "id required" };
  const svc = createServiceClient();
  const { error } = await svc.from("announcements").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/announcements");
  return {};
}
