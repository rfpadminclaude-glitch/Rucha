"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase-server";

type SaveResult = { error?: string };

export async function saveFaq(formData: FormData): Promise<SaveResult> {
  const originalKey = String(formData.get("original_topic_key") ?? "").trim();
  const topic_key = String(formData.get("topic_key") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const domain = String(formData.get("domain") ?? "").trim() || null;
  const source_url = String(formData.get("source_url") ?? "").trim() || null;

  if (!topic_key) return { error: "Topic key is required." };
  if (!/^[a-z0-9-]+$/.test(topic_key))
    return { error: "Topic key must be lowercase letters, digits, and dashes." };

  const en_question = String(formData.get("en_question") ?? "").trim();
  const en_answer = String(formData.get("en_answer") ?? "").trim();
  const es_question = String(formData.get("es_question") ?? "").trim();
  const es_answer = String(formData.get("es_answer") ?? "").trim();
  if (!en_question || !en_answer || !es_question || !es_answer) {
    return { error: "All four EN/ES fields are required." };
  }

  const svc = createServiceClient();

  // If the topic_key changed, delete the old rows so the rename is clean.
  if (originalKey && originalKey !== topic_key) {
    const { error: delErr } = await svc
      .from("faqs")
      .delete()
      .eq("topic_key", originalKey);
    if (delErr) return { error: `Rename failed: ${delErr.message}` };
  }

  const rows = [
    {
      topic_key,
      lang: "en",
      question: en_question,
      answer: en_answer,
      category,
      domain,
      source_url,
    },
    {
      topic_key,
      lang: "es",
      question: es_question,
      answer: es_answer,
      category,
      domain,
      source_url,
    },
  ];

  const { error } = await svc
    .from("faqs")
    .upsert(rows, { onConflict: "topic_key,lang" });
  if (error) return { error: error.message };

  revalidatePath("/admin/faqs");
  revalidatePath(`/admin/faqs/${topic_key}`);
  redirect("/admin/faqs");
}

export async function deleteFaq(formData: FormData): Promise<SaveResult> {
  const topic_key = String(formData.get("topic_key") ?? "").trim();
  if (!topic_key) return { error: "topic_key required" };
  const svc = createServiceClient();
  const { error } = await svc.from("faqs").delete().eq("topic_key", topic_key);
  if (error) return { error: error.message };
  revalidatePath("/admin/faqs");
  redirect("/admin/faqs");
}
