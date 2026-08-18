"use client";

import { useEffect, useState } from "react";
import type { Player, Position } from "@/lib/types";
import type { ErrorResponse, TransferTargetsResponse } from "@/lib/apiTypes";

const POSITIONS: { value: Position | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "GK", label: "GK" },
  { value: "DEF", label: "DEF" },
  { value: "MID", label: "MID" },
  { value: "FWD", label: "FWD" },
];

function TargetRow({ player, rank }: { player: Player; rank: number }) {
  return (
    <div className="grid grid-cols-[1.5rem_3rem_1fr_1fr_4rem_5rem_4rem_3rem] items-center gap-2 py-1.5 px-2 text-sm border-b border-black/5 dark:border-white/10 last:border-b-0">
      <span className="text-neutral-400 dark:text-neutral-500 text-xs">{rank}</span>
      <span className="font-semibold text-xs text-neutral-500 dark:text-neutral-400">
        {player.position}
      </span>
      <span className="truncate">{player.webName}</span>
      <span className="truncate text-neutral-500 dark:text-neutral-400">{player.teamName}</span>
      <span>£{player.cost.toFixed(1)}m</span>
      <span className="text-neutral-500 dark:text-neutral-400">score {player.score.toFixed(1)}</span>
      <span className="text-neutral-500 dark:text-neutral-400">
        {player.selectedByPercent.toFixed(1)}%
      </span>
      <span className="text-xs">
        {player.costChangeEvent > 0 && <span title="Price risen this gameweek">📈</span>}
        {player.costChangeEvent < 0 && <span title="Price fallen this gameweek">📉</span>}
      </span>
    </div>
  );
}

export function TransferTargets() {
  const [position, setPosition] = useState<Position | "ALL">("ALL");
  const [targets, setTargets] = useState<Player[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      try {
        const params = new URLSearchParams({ limit: "15", fixtureLookahead: "5" });
        if (position !== "ALL") params.set("position", position);
        const resp = await fetch(`/api/transfer-targets?${params.toString()}`);
        const json = (await resp.json()) as TransferTargetsResponse | ErrorResponse;
        if (!resp.ok || "error" in json) throw new Error("error" in json ? json.error : "Request failed");
        if (!cancelled) setTargets(json.targets);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [position]);

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden mb-10">
      <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-medium text-sm">This Week&apos;s Transfer Targets</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Top players by score right now — same model as the squad builder.
          </div>
        </div>
        <div className="flex gap-1">
          {POSITIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPosition(p.value)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                position === p.value
                  ? "bg-blue-600 text-white"
                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!targets && !error && (
        <p className="px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
      )}

      {targets && !error && (
        <div>
          <div className="grid grid-cols-[1.5rem_3rem_1fr_1fr_4rem_5rem_4rem_3rem] items-center gap-2 py-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 border-b border-black/5 dark:border-white/10">
            <span>#</span>
            <span>Pos</span>
            <span>Name</span>
            <span>Team</span>
            <span>Cost</span>
            <span>Score</span>
            <span>Owned</span>
            <span></span>
          </div>
          {targets.map((p, i) => (
            <TargetRow key={p.id} player={p} rank={i + 1} />
          ))}
        </div>
      )}
    </section>
  );
}
