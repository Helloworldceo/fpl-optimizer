"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }
      router.push("/predict");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-6 space-y-4">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded px-3 py-2">
          {error}
        </p>
      )}
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2.5 transition-colors"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-emerald-600 dark:text-emerald-400 font-medium">
          Register
        </Link>
      </p>
    </div>
  );
}
