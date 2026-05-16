"use client";

import { useState, useTransition } from "react";
import { signIn } from "./actions";

export default function LoginForm() {
  const [error, setError] = useState<string>("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        setError("");
        startTransition(async () => {
          const result = await signIn(fd);
          if (result?.error) setError(result.error);
        });
      }}
      className="space-y-3"
    >
      <label className="block text-xs font-medium text-gray-700">
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-doral-navy"
        />
      </label>
      <label className="block text-xs font-medium text-gray-700">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-doral-navy"
        />
      </label>
      {error && (
        <div
          role="alert"
          className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2"
        >
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-2 rounded bg-doral-navy text-white font-semibold disabled:opacity-50 border-b-2 border-doral-gold"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
