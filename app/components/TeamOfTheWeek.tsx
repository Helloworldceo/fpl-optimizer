"use client";

import { useEffect, useMemo, useState } from "react";
import type { GameweekSummary } from "@/lib/types";
import type { ErrorResponse, GameweeksResponse, TeamOfTheWeekResponse } from "@/lib/apiTypes";
import { Pitch } from "./Pitch";

export function TeamOfTheWeek() {
  const [gameweeks, setGameweeks] = useState<GameweekSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [data, setData] = useState<TeamOfTheWeekResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const finishedGameweeks = useMemo(
    () => (gameweeks ?? []).filter((g) => g.finished).sort((a, b) => b.id - a.id),
    [gameweeks]
  );

  useEffect(() => {
    fetch("/api/gameweeks")
      .then((r) => r.json())
      .then((res: GameweeksResponse) => {
        const list = res.gameweeks ?? [];
        setGameweeks(list);
        const mostRecentFinished = [...list].filter((g) => g.finished).sort((a, b) => b.id - a.id)[0];
        if (mostRecentFinished) setSelectedId(mostRecentFinished.id);
      })
      .catch(() => setGameweeks([]));
  }, []);

  useEffect(() => {
    if (selectedId === null) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/team-of-the-week?event=${selectedId}`);
        const json = (await r.json()) as TeamOfTheWeekResponse | ErrorResponse;
        if (!r.ok || "error" in json) throw new Error("error" in json ? json.error : "Request failed");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="font-medium text-sm">Team of the Week</div>
        {finishedGameweeks.length > 0 && (
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(parseInt(e.target.value, 10))}
            className="text-xs rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1"
          >
            {finishedGameweeks.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {gameweeks !== null && finishedGameweeks.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No completed gameweeks yet — check back once Gameweek 1 finishes.
        </p>
      )}

      {gameweeks === null && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading && !error && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
      )}

      {data && !loading && !error && (
        <>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            Highest-scoring valid XI by actual points — {data.totalPoints} total.
          </p>
          <Pitch
            startingXi={data.startingXi}
            captainId={data.topPerformerId ?? -1}
            viceCaptainId={-1}
            subtitleFor={(p) => `${p.score} pts`}
          />
        </>
      )}
    </div>
  );
}
