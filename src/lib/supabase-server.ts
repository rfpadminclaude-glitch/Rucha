import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";

// SSR-aware client tied to the request's cookies. Use inside RSC + Server Actions.
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // setting cookies from a RSC is fine to ignore — the middleware
            // owns session refresh.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // see above
          }
        },
      },
    },
  );
}

// Service-role client, server only. Used by the admin gate to check the
// allowlist (admin_users) without RLS getting in the way.
export function createServiceClient() {
  return createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// Returns the authenticated admin user (membership in admin_users) or
// redirects to /admin/login. Use at the top of every protected admin page.
export async function getAdminUserOrRedirect() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const svc = createServiceClient();
  const { data: row } = await svc
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) redirect("/admin/login?denied=1");

  return user;
}
