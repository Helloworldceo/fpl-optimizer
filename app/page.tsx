"use client";

import { useState } from "react";
import type { Player, SquadOption } from "@/lib/types";
import type { SquadsErrorResponse, SquadsResponse } from "@/lib/apiTypes";

const POSITION_ORDER: Player["position"][] = ["GK", "DEF", "MID", "FWD"];

function PlayerRow({ player, tag }: { player: Player; tag?: "C" | "VC" }) {
  return (
    <div className="grid grid-cols-[3rem_1fr_1fr_4rem_5rem_4rem_2rem] items-center gap-2 py-1.5 px-2 text-sm border-b border-black/5 dark:border-white/10">
      <span className="font-semibold text-xs text-neutral-500 dark:text-neutral-400">
        {player.position}
      </span>
      <span className="truncate">
        {player.webName}
        {tag && <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">({tag})</span>}
      </span>
      <span className="truncate text-neutral-500 dark:text-neutral-400">{player.teamName}</span>
      <span>£{player.cost.toFixed(1)}m</span>
      <span className="text-neutral-500 dark:text-neutral-400">score {player.score.toFixed(1)}</span>
      <span className="text-neutral-500 dark:text-neutral-400">
        {player.fixtureDifficulty ? `FDR ${player.fixtureDifficulty.toFixed(1)}` : ""}
      </span>
      <span>{tag === "C" ? "👑" : tag === "VC" ? "🅥" : ""}</span>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div className="text-xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function SquadOptionView({ option, budget }: { option: SquadOption; budget: number }) {
  const captain = option.startingXi.find((p) => p.id === option.captainId)!;
  const viceCaptain = option.startingXi.find((p) => p.id === option.viceCaptainId)!;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Metric label="Squad cost" value={`£${option.totalCost.toFixed(1)}m`} sub={`of £${budget.toFixed(1)}m`} />
        <Metric label="Projected XI points" value={option.projectedPoints.toFixed(1)} sub="captain doubled" />
        <Metric label="Captain" value={captain.webName} />
        <Metric label="Vice-captain" value={viceCaptain.webName} />
      </div>

      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
        Starting XI
      </h3>
      <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden mb-6">
        {POSITION_ORDER.flatMap((pos) =>
          option.startingXi
            .filter((p) => p.position === pos)
            .map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                tag={p.id === option.captainId ? "C" : p.id === option.viceCaptainId ? "VC" : undefined}
              />
            ))
        )}
      </div>

      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
        Bench
      </h3>
      <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
        {option.bench.map((p) => (
          <PlayerRow key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [budget, setBudget] = useState(100);
  const [maxPerTeam, setMaxPerTeam] = useState(3);
  const [fixtureLookahead, setFixtureLookahead] = useState(5);
  const [numOptions, setNumOptions] = useState(5);
  const [minDiff, setMinDiff] = useState(3);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SquadsResponse | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  async function buildSquads() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        budget: String(budget),
        maxPerTeam: String(maxPerTeam),
        fixtureLookahead: String(fixtureLookahead),
        numOptions: String(numOptions),
        minDiff: String(minDiff),
      });
      const resp = await fetch(`/api/squads?${params.toString()}`);
      const data = (await resp.json()) as SquadsResponse | SquadsErrorResponse;
      if (!resp.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Request failed");
      }
      setResult(data);
      setActiveTab(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">⚽ FPL Squad Optimizer</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Live data from the official Fantasy Premier League API. Score blends
          points-per-game, ep_next, and upcoming fixture difficulty (FDR).
        </p>
      </header>

      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Budget (£m)
          <input
            type="number"
            min={60}
            max={100}
            step={0.5}
            value={budget}
            onChange={(e) => setBudget(parseFloat(e.target.value))}
            className="rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Max players/club
          <select
            value={maxPerTeam}
            onChange={(e) => setMaxPerTeam(parseInt(e.target.value, 10))}
            className="rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5"
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Fixture lookahead (GWs)
          <input
            type="number"
            min={0}
            max={10}
            value={fixtureLookahead}
            onChange={(e) => setFixtureLookahead(parseInt(e.target.value, 10))}
            className="rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Squad options
          <input
            type="number"
            min={1}
            max={8}
            value={numOptions}
            onChange={(e) => setNumOptions(parseInt(e.target.value, 10))}
            className="rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Min. players different
          <input
            type="number"
            min={1}
            max={10}
            value={minDiff}
            onChange={(e) => setMinDiff(parseInt(e.target.value, 10))}
            className="rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5"
          />
        </label>
        <button
          onClick={buildSquads}
          disabled={loading}
          className="sm:col-span-2 lg:col-span-5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 transition-colors"
        >
          {loading ? "Building squads..." : "Build squads"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {result && (
        <>
          {result.options.length < result.requestedOptions && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-4 py-2 mb-4 text-sm">
              Only {result.options.length} distinct option(s) found — try lowering
              &quot;Min. players different&quot; for more.
            </div>
          )}

          <div className="flex gap-1 mb-6 border-b border-black/10 dark:border-white/10 overflow-x-auto">
            {result.options.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === i
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                Option {i + 1}
              </button>
            ))}
          </div>

          <SquadOptionView option={result.options[activeTab]} budget={result.budget} />
        </>
      )}
    </div>
  );
}
