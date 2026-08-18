"use client";

import { useEffect, useState } from "react";
import type { TeamStanding } from "@/lib/types";
import type { StandingsResponse } from "@/lib/apiTypes";
import { TeamCrest } from "./TeamCrest";

export function StandingsTable() {
  const [standings, setStandings] = useState<TeamStanding[] | null>(null);

  useEffect(() => {
    fetch("/api/standings")
      .then((r) => r.json())
      .then((data: StandingsResponse) => setStandings(data.standings ?? []))
      .catch(() => setStandings([]));
  }, []);

  const seasonStarted = standings?.some((s) => s.played > 0) ?? false;

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 font-medium text-sm">
        Premier League Table
      </div>
      {!standings && (
        <div className="px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">Loading…</div>
      )}
      {standings && !seasonStarted && (
        <div className="px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 border-b border-black/5 dark:border-white/10">
          Season hasn&apos;t kicked off yet — this fills in automatically once matches are played.
        </div>
      )}
      {standings && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900">
                <th className="px-3 py-2 font-semibold">#</th>
                <th className="px-3 py-2 font-semibold">Team</th>
                <th className="px-3 py-2 font-semibold text-right">P</th>
                <th className="px-3 py-2 font-semibold text-right">W</th>
                <th className="px-3 py-2 font-semibold text-right">D</th>
                <th className="px-3 py-2 font-semibold text-right">L</th>
                <th className="px-3 py-2 font-semibold text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.teamId} className="border-t border-black/5 dark:border-white/10">
                  <td className="px-3 py-1.5 text-neutral-500 dark:text-neutral-400">
                    {seasonStarted ? s.position || i + 1 : i + 1}
                  </td>
                  <td className="px-3 py-1.5 font-medium">
                    <span className="flex items-center gap-2">
                      <TeamCrest teamCode={s.teamCode} size={18} />
                      {s.name}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right">{s.played}</td>
                  <td className="px-3 py-1.5 text-right">{s.win}</td>
                  <td className="px-3 py-1.5 text-right">{s.draw}</td>
                  <td className="px-3 py-1.5 text-right">{s.loss}</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
