"use client";

import { useEffect, useMemo, useState } from "react";
import type { GameweekSummary } from "@/lib/types";
import type { ErrorResponse, PredictResponse } from "@/lib/apiTypes";
import { PredictionRow } from "./PredictionRow";

export function PredictClient() {
  const [gameweeks, setGameweeks] = useState<GameweekSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [data, setData] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sortedGameweeks = useMemo(() => [...(gameweeks ?? [])].sort((a, b) => a.id - b.id), [gameweeks]);

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
        const r = await fetch(`/api/predict?event=${selectedId}`);
        const json = (await r.json()) as PredictResponse | ErrorResponse;
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

  const predictionsByFixture = useMemo(
    () => new Map((data?.myPredictions ?? []).map((p) => [p.fixtureId, p])),
    [data]
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="font-medium text-sm">Gameweek</div>
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

      {(gameweeks === null || (loading && !data)) && !error && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {data && !error && (
        <div className={`space-y-2 transition-opacity duration-150 ${loading ? "opacity-50" : "opacity-100"}`}>
          {data.fixtures.map((f) => (
            <PredictionRow
              key={f.fixtureId}
              fixture={f}
              eventId={data.gameweek.id}
              existing={predictionsByFixture.get(f.fixtureId)}
            />
          ))}
          {data.fixtures.length === 0 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No fixtures scheduled for this gameweek.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
