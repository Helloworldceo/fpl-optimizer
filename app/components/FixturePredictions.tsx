"use client";

import { useEffect, useMemo, useState } from "react";
import type { FixturePrediction, GameweekSummary } from "@/lib/types";
import type { ErrorResponse, FixturePredictionsResponse } from "@/lib/apiTypes";
import { TeamCrest } from "./TeamCrest";

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function ProbabilityBar({ prediction }: { prediction: FixturePrediction }) {
  const { homeWinProb, drawProb, awayWinProb } = prediction;
  return (
    <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-1.5">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden flex bg-neutral-100 dark:bg-neutral-800">
        <div className="bg-emerald-500" style={{ width: pct(homeWinProb) }} />
        <div className="bg-neutral-400 dark:bg-neutral-600" style={{ width: pct(drawProb) }} />
        <div className="bg-sky-500" style={{ width: pct(awayWinProb) }} />
      </div>
      <span className="tabular-nums whitespace-nowrap">
        {pct(homeWinProb)} / {pct(drawProb)} / {pct(awayWinProb)}
      </span>
    </div>
  );
}

export function FixturePredictions() {
  const [gameweeks, setGameweeks] = useState<GameweekSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [data, setData] = useState<FixturePredictionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sortedGameweeks = useMemo(
    () => [...(gameweeks ?? [])].sort((a, b) => a.id - b.id),
    [gameweeks]
  );

  useEffect(() => {
    fetch("/api/gameweeks")
      .then((r) => r.json())
      .then((res: { gameweeks: GameweekSummary[] }) => {
        const list = res.gameweeks ?? [];
        setGameweeks(list);
        const defaultGw = list.find((g) => g.isCurrent) ?? list.find((g) => g.isNext) ?? list[0];
        if (defaultGw) setSelectedId(defaultGw.id);
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
        const r = await fetch(`/api/fixture-predictions?event=${selectedId}`);
        const json = (await r.json()) as FixturePredictionsResponse | ErrorResponse;
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
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="font-medium text-sm">Fixture Predictions</div>
        {sortedGameweeks.length > 0 && (
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(parseInt(e.target.value, 10))}
            className="text-xs rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1"
          >
            {sortedGameweeks.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
        Predicted scorelines from a Poisson model built on ClubElo&apos;s club ratings — a
        statistical read on relative strength, not a real forecast. Treat it as a talking point,
        not a guarantee.
      </p>

      {data?.usingFallback && !loading && !error && (
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded px-2.5 py-1.5 mb-3">
          At least one fixture below fell back to FPL&apos;s own fixture-difficulty ratings, since
          a ClubElo rating wasn&apos;t available for one of the clubs (e.g. newly promoted sides,
          or a temporary ClubElo outage) — expect those specific predictions to be rougher than
          the rest.
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
        <div className="space-y-2">
          {data.predictions.map((p) => (
            <div
              key={p.fixtureId}
              className="rounded-lg border border-black/5 dark:border-white/10 px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-sm truncate">{p.homeTeam.shortName}</span>
                  <TeamCrest teamCode={p.homeTeam.teamCode} size={20} />
                </div>
                <div className="shrink-0 font-semibold text-sm tabular-nums px-2">
                  {p.predictedHomeGoals} – {p.predictedAwayGoals}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <TeamCrest teamCode={p.awayTeam.teamCode} size={20} />
                  <span className="text-sm truncate">{p.awayTeam.shortName}</span>
                </div>
              </div>
              <ProbabilityBar prediction={p} />
            </div>
          ))}
          {data.predictions.length === 0 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No fixtures scheduled for this gameweek.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
