"use client";

import { useEffect, useState } from "react";
import type { TableLeaderboardEntry, TableLeaderboardResponse } from "@/lib/apiTypes";

export function TableLeaderboardTable() {
  const [leaderboard, setLeaderboard] = useState<TableLeaderboardEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/table-predictions/leaderboard")
      .then((r) => r.json())
      .then((data: TableLeaderboardResponse) => setLeaderboard(data.leaderboard ?? []))
      .catch(() => setLeaderboard([]));
  }, []);

  if (!leaderboard) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>;
  }

  if (leaderboard.length === 0) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        No table predictions locked in yet.
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
            <th className="px-3 py-2 font-semibold text-right">Live score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, i) => (
            <tr key={entry.userId} className="border-t border-black/5 dark:border-white/10">
              <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400">{i + 1}</td>
              <td className="px-3 py-2 font-medium">{entry.name}</td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">{entry.points} / 400</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
