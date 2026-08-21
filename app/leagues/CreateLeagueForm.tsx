"use client";

import { useActionState } from "react";
import { createLeague, type LeagueActionState } from "@/lib/actions/leagues";

const initialState: LeagueActionState = {};

export function CreateLeagueForm() {
  const [state, formAction, pending] = useActionState(createLeague, initialState);

  return (
    <form action={formAction} className="rounded-xl border border-black/10 dark:border-white/10 p-4">
      <div className="font-medium text-sm mb-3">Create a league</div>
      {state.error && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{state.error}</p>}
      <div className="flex gap-2">
        <input
          type="text"
          name="name"
          placeholder="League name"
          required
          className="flex-1 rounded border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 transition-colors whitespace-nowrap"
        >
          {pending ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
