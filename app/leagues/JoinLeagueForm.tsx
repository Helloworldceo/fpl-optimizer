"use client";

import { useActionState } from "react";
import { joinLeague, type LeagueActionState } from "@/lib/actions/leagues";

const initialState: LeagueActionState = {};

export function JoinLeagueForm() {
  const [state, formAction, pending] = useActionState(joinLeague, initialState);

  return (
    <form action={formAction} className="rounded-xl border border-black/10 dark:border-white/10 p-4">
      <div className="font-medium text-sm mb-3">Join a league</div>
      {state.error && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{state.error}</p>}
      <div className="flex gap-2">
        <input
          type="text"
          name="code"
          placeholder="League code"
          required
          maxLength={6}
          className="flex-1 rounded border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white disabled:opacity-50 text-white text-sm font-medium px-4 py-2 transition-colors whitespace-nowrap"
        >
          {pending ? "Joining..." : "Join"}
        </button>
      </div>
    </form>
  );
}
