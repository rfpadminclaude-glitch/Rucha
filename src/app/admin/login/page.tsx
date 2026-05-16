import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = { title: "Admin login · City of Doral" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { denied?: string };
}) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 rounded bg-doral-navy text-doral-gold text-xs font-bold tracking-wider mb-3">
            CITY OF DORAL
          </div>
          <h1 className="text-xl font-semibold text-doral-navy">
            Admin sign in
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Staff only. Public site at{" "}
            <Link href="/" className="text-doral-navy underline">
              /
            </Link>
            .
          </p>
        </div>
        {searchParams.denied && (
          <div
            role="alert"
            className="mb-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2"
          >
            Your session is not on the admin allowlist. Please sign in again.
          </div>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
