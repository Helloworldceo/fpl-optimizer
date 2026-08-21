"use client";

import { useEffect, useState } from "react";
import type { LeaderboardEntry, LeaderboardResponse } from "@/lib/apiTypes";

export function LeaderboardTable() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data: LeaderboardResponse) => setLeaderboard(data.leaderboard ?? []))
      .catch(() => setLeaderboard([]));
  }, []);

  if (!leaderboard) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>;
  }

  if (leaderboard.length === 0) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        No scored predictions yet — points show up here once fixtures finish.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900">
            <th className="px-3 py-2 font-semibold">#</th>
            <th className="px-3 py-2 font-semibold">Name</th>
            <th className="px-3 py-2 font-semibold text-right">Points</th>
            <th className="px-3 py-2 font-semibold text-right">Exact</th>
            <th className="px-3 py-2 font-semibold text-right">Scored</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, i) => (
            <tr key={entry.userId} className="border-t border-black/5 dark:border-white/10">
              <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400">{i + 1}</td>
              <td className="px-3 py-2 font-medium">{entry.name}</td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">{entry.points}</td>
              <td className="px-3 py-2 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                {entry.exactScores}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                {entry.predictionsScored}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
