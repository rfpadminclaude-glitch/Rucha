import Link from "next/link";
import { getAdminUserOrRedirect } from "@/lib/supabase-server";
import { signOut } from "../login/actions";
import AdminNav from "./AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUserOrRedirect();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-doral-navy text-white flex flex-col">
        <div className="p-4 border-b border-white/10">
          <Link href="/admin" className="block">
            <div className="text-xs text-doral-gold font-bold tracking-wider">
              CITY OF DORAL
            </div>
            <div className="text-sm font-semibold">Admin</div>
          </Link>
        </div>
        <AdminNav />
        <div className="p-3 border-t border-white/10 text-xs text-white/70 space-y-2">
          <div className="truncate" title={user.email ?? ""}>
            {user.email}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-doral-gold hover:underline text-xs"
            >
              Sign out
            </button>
          </form>
          <Link
            href="/"
            className="block text-white/60 hover:text-white text-xs"
          >
            ← Public site
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
