"use client";

import { useEffect, useState } from "react";
import type { Player, SquadOption } from "@/lib/types";
import type { SquadsErrorResponse, SquadsResponse } from "@/lib/apiTypes";
import { Controls, type ControlsState } from "./components/Controls";
import { OptionsCompare } from "./components/OptionsCompare";
import { Pitch } from "./components/Pitch";
import { BenchStrip } from "./components/BenchStrip";
import { PlayerPicker, type PlayerOption } from "./components/PlayerPicker";

const POSITION_ORDER: Player["position"][] = ["GK", "DEF", "MID", "FWD"];

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

function PlayerDetailRow({ player, tag }: { player: Player; tag?: "C" | "VC" }) {
  return (
    <div className="grid grid-cols-[3rem_1fr_1fr_4rem_5rem_4rem_2rem] items-center gap-2 py-1.5 px-2 text-sm border-b border-black/5 dark:border-white/10 last:border-b-0">
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

function SquadOptionView({ option, budget }: { option: SquadOption; budget: number }) {
  const captain = option.startingXi.find((p) => p.id === option.captainId)!;
  const viceCaptain = option.startingXi.find((p) => p.id === option.viceCaptainId)!;
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Metric label="Squad cost" value={`£${option.totalCost.toFixed(1)}m`} sub={`of £${budget.toFixed(1)}m`} />
        <Metric label="Projected XI points" value={option.projectedPoints.toFixed(1)} sub="captain doubled" />
        <Metric label="Captain" value={captain.webName} />
        <Metric label="Vice-captain" value={viceCaptain.webName} />
      </div>

      <Pitch startingXi={option.startingXi} captainId={option.captainId} viceCaptainId={option.viceCaptainId} />

      <div className="mt-4">
        <BenchStrip bench={option.bench} />
      </div>

      <button
        onClick={() => setShowDetails((v) => !v)}
        className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        {showDetails ? "Hide" : "Show"} full stats (cost, score, fixture difficulty)
      </button>

      {showDetails && (
        <div className="mt-3 rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
          {POSITION_ORDER.flatMap((pos) =>
            option.startingXi
              .filter((p) => p.position === pos)
              .map((p) => (
                <PlayerDetailRow
                  key={p.id}
                  player={p}
                  tag={p.id === option.captainId ? "C" : p.id === option.viceCaptainId ? "VC" : undefined}
                />
              ))
          )}
          <div className="bg-neutral-50 dark:bg-neutral-900 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Bench
          </div>
          {option.bench.map((p) => (
            <PlayerDetailRow key={p.id} player={p} />
          ))}
        </div>
      )}
    </div>
  );
}

const DEFAULT_STATE: ControlsState = {
  budget: 100,
  maxPerTeam: 3,
  fixtureLookahead: 5,
  numOptions: 5,
  minDiff: 3,
};

export default function Home() {
  const [controls, setControls] = useState<ControlsState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SquadsResponse | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const [playerOptions, setPlayerOptions] = useState<PlayerOption[]>([]);
  const [mustIncludeIds, setMustIncludeIds] = useState<number[]>([]);
  const [mustExcludeIds, setMustExcludeIds] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data: { players?: PlayerOption[] }) => setPlayerOptions(data.players ?? []))
      .catch(() => {});
  }, []);

  async function buildSquads() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        budget: String(controls.budget),
        maxPerTeam: String(controls.maxPerTeam),
        fixtureLookahead: String(controls.fixtureLookahead),
        numOptions: String(controls.numOptions),
        minDiff: String(controls.minDiff),
      });
      if (mustIncludeIds.length > 0) params.set("mustInclude", mustIncludeIds.join(","));
      if (mustExcludeIds.length > 0) params.set("mustExclude", mustExcludeIds.join(","));
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

      <Controls state={controls} onChange={(patch) => setControls((s) => ({ ...s, ...patch }))} onSubmit={buildSquads} loading={loading} />

      <div className="rounded-xl border border-black/10 dark:border-white/10 p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <PlayerPicker
          label="Must include"
          accent="green"
          options={playerOptions}
          selectedIds={mustIncludeIds}
          disabledIds={new Set(mustExcludeIds)}
          onChange={setMustIncludeIds}
        />
        <PlayerPicker
          label="Must exclude"
          accent="red"
          options={playerOptions}
          selectedIds={mustExcludeIds}
          disabledIds={new Set(mustIncludeIds)}
          onChange={setMustExcludeIds}
        />
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

          <OptionsCompare options={result.options} activeIndex={activeTab} onSelect={setActiveTab} />

          <SquadOptionView option={result.options[activeTab]} budget={result.budget} />
        </>
      )}
    </div>
  );
}
