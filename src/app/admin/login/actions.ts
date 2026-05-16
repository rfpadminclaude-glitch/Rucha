"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase-server";

export async function signIn(formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    return { error: error?.message ?? "Sign in failed." };
  }

  // Check allowlist
  const svc = createServiceClient();
  const { data: row } = await svc
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!row) {
    await supabase.auth.signOut();
    return {
      error:
        "Signed in, but this account is not on the admin allowlist. Ask an existing admin to add you.",
    };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
