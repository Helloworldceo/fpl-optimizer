"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerUser, type RegisterState } from "@/lib/actions/auth";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerUser, initialState);

  if (state.success) {
    return (
      <div className="rounded-xl border border-black/10 dark:border-white/10 p-6 text-center">
        <h2 className="font-semibold mb-2">You&apos;re registered!</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          Log in to start locking in your predictions.
        </p>
        <Link
          href="/login"
          className="inline-block rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 transition-colors"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-black/10 dark:border-white/10 p-6 space-y-4">
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      <Field label="Name" name="name" required error={state.fieldErrors?.name} />
      <Field label="Email" name="email" type="email" required error={state.fieldErrors?.email} />
      <Field
        label="Password"
        name="password"
        type="password"
        required
        hint="At least 8 characters"
        error={state.fieldErrors?.password}
      />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2.5 transition-colors"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-medium">
          Log in
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  error,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string[];
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      {hint && !error && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error[0]}</p>}
    </div>
  );
}
