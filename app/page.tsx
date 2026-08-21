"use client";

import { useEffect, useState } from "react";
import type { Player, SquadOption } from "@/lib/types";
import type { ErrorResponse, GameweeksResponse, SquadsResponse } from "@/lib/apiTypes";
import { Controls, type ControlsState } from "./components/Controls";
import { OptionsCompare } from "./components/OptionsCompare";
import { Pitch } from "./components/Pitch";
import { BenchStrip } from "./components/BenchStrip";
import { PlayerPicker, type PlayerOption } from "./components/PlayerPicker";
import { Hero } from "./components/Hero";
import { Guide } from "./components/Guide";
import { Contact } from "./components/Contact";
import { StandingsTable } from "./components/StandingsTable";
import { TeamOfTheWeek } from "./components/TeamOfTheWeek";
import { TransferTargets } from "./components/TransferTargets";
import { TransferFinder } from "./components/TransferFinder";
import { FixturePredictions } from "./components/FixturePredictions";
import { MiniLeagueBanner } from "./components/MiniLeagueBanner";
import { TeamCrest } from "./components/TeamCrest";

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
    <div className="grid grid-cols-[3rem_1fr_1fr_4rem_4rem_5rem_4rem_2rem] items-center gap-2 py-1.5 px-2 text-sm border-b border-black/5 dark:border-white/10 last:border-b-0">
      <span className="font-semibold text-xs text-neutral-500 dark:text-neutral-400">
        {player.position}
      </span>
      <span className="truncate">
        {player.webName}
        {tag && <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">({tag})</span>}
        {player.confidence < 0.2 && (
          <span
            title="Limited track record: under ~5 games' worth of minutes, score leans on a positional average rather than proven form"
            className="ml-1 text-xs text-amber-600 dark:text-amber-400 cursor-help"
          >
            ⚠︎
          </span>
        )}
      </span>
      <span className="flex items-center gap-1.5 truncate text-neutral-500 dark:text-neutral-400">
        <TeamCrest teamCode={player.teamCode} size={14} />
        <span className="truncate">{player.teamName}</span>
      </span>
      <span>£{player.cost.toFixed(1)}m</span>
      <span className="text-neutral-500 dark:text-neutral-400" title="Selected by this % of FPL managers">
        {player.selectedByPercent.toFixed(1)}%
      </span>
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <Metric label="Squad cost" value={`£${option.totalCost.toFixed(1)}m`} sub={`of £${budget.toFixed(1)}m`} />
        <Metric label="Projected XI points" value={option.projectedPoints.toFixed(1)} sub="captain doubled" />
        <Metric label="Avg. ownership" value={`${option.avgOwnership.toFixed(1)}%`} sub="across squad" />
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
        {showDetails ? "Hide" : "Show"} full stats (cost, ownership, score, fixture difficulty)
      </button>

      {showDetails && (
        <div className="mt-3 rounded-lg border border-black/10 dark:border-white/10 overflow-hidden overflow-x-auto">
          <div className="min-w-[34rem]">
            <div className="grid grid-cols-[3rem_1fr_1fr_4rem_4rem_5rem_4rem_2rem] items-center gap-2 py-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 border-b border-black/5 dark:border-white/10">
              <span>Pos</span>
              <span>Name</span>
              <span>Team</span>
              <span>Cost</span>
              <span>Owned</span>
              <span>Score</span>
              <span>FDR</span>
              <span></span>
            </div>
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
        </div>
      )}
    </div>
  );
}

const DEFAULT_STATE: ControlsState = {
  budget: 100,
  maxPerTeam: 3,
  fixtureFrom: 1,
  fixtureTo: 5,
  numOptions: 5,
  minDiff: 3,
  optimizeBy: "value",
};

function squadParams(
  controls: ControlsState,
  mustIncludeIds: number[],
  mustExcludeIds: number[]
): URLSearchParams {
  const params = new URLSearchParams({
    budget: String(controls.budget),
    maxPerTeam: String(controls.maxPerTeam),
    fixtureFrom: String(controls.fixtureFrom),
    fixtureTo: String(controls.fixtureTo),
    numOptions: String(controls.numOptions),
    minDiff: String(controls.minDiff),
    optimizeBy: controls.optimizeBy,
  });
  if (mustIncludeIds.length > 0) params.set("mustInclude", mustIncludeIds.join(","));
  if (mustExcludeIds.length > 0) params.set("mustExclude", mustExcludeIds.join(","));
  return params;
}

function readControlsFromUrl(search: URLSearchParams): {
  controls: ControlsState;
  mustIncludeIds: number[];
  mustExcludeIds: number[];
  option: number;
} | null {
  if (!search.has("budget")) return null;
  const ids = (key: string) =>
    (search.get(key) ?? "")
      .split(",")
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isInteger(n));
  const fixtureFrom = parseInt(search.get("fixtureFrom") ?? "", 10) || DEFAULT_STATE.fixtureFrom;

  return {
    controls: {
      budget: parseFloat(search.get("budget") ?? "") || DEFAULT_STATE.budget,
      maxPerTeam: parseInt(search.get("maxPerTeam") ?? "", 10) || DEFAULT_STATE.maxPerTeam,
      fixtureFrom,
      fixtureTo: parseInt(search.get("fixtureTo") ?? "", 10) || fixtureFrom,
      numOptions: parseInt(search.get("numOptions") ?? "", 10) || DEFAULT_STATE.numOptions,
      minDiff: parseInt(search.get("minDiff") ?? "", 10) || DEFAULT_STATE.minDiff,
      optimizeBy: search.get("optimizeBy") === "ownership" ? "ownership" : "value",
    },
    mustIncludeIds: ids("mustInclude"),
    mustExcludeIds: ids("mustExclude"),
    option: parseInt(search.get("option") ?? "0", 10) || 0,
  };
}

function updateUrl(
  controls: ControlsState,
  mustIncludeIds: number[],
  mustExcludeIds: number[],
  option: number
) {
  const params = squadParams(controls, mustIncludeIds, mustExcludeIds);
  params.set("option", String(option));
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard API unavailable — nothing to fall back to here since
          // the URL bar already reflects the shareable link.
        }
      }}
      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
    >
      {copied ? "Link copied!" : "🔗 Copy shareable link"}
    </button>
  );
}

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

  // A shared link encodes the build settings + which option was selected in
  // the URL's query string (see updateUrl below) — restore and rebuild from
  // it on load so a friend opening the link sees the same squad, not a
  // blank page they have to rebuild themselves.
  useEffect(() => {
    function init() {
      const shared = readControlsFromUrl(new URLSearchParams(window.location.search));
      if (shared) {
        setControls(shared.controls);
        setMustIncludeIds(shared.mustIncludeIds);
        setMustExcludeIds(shared.mustExcludeIds);
        buildSquads(shared.controls, shared.mustIncludeIds, shared.mustExcludeIds, shared.option);
        return;
      }
      // No shared link — default the fixture window to the current gameweek
      // through +4, rather than the arbitrary GW1-5 placeholder in DEFAULT_STATE.
      fetch("/api/gameweeks")
        .then((r) => r.json())
        .then((data: GameweeksResponse) => {
          const list = data.gameweeks ?? [];
          const current =
            list.find((g) => g.isCurrent) ?? list.find((g) => g.isNext) ?? list.find((g) => !g.finished);
          if (!current) return;
          setControls((s) => ({ ...s, fixtureFrom: current.id, fixtureTo: Math.min(current.id + 4, 38) }));
        })
        .catch(() => {});
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once on mount
  }, []);

  async function buildSquads(
    controlsOverride: ControlsState = controls,
    mustIncludeOverride: number[] = mustIncludeIds,
    mustExcludeOverride: number[] = mustExcludeIds,
    optionOverride?: number
  ) {
    setLoading(true);
    setError(null);
    try {
      const params = squadParams(controlsOverride, mustIncludeOverride, mustExcludeOverride);
      const resp = await fetch(`/api/squads?${params.toString()}`);
      const data = (await resp.json()) as SquadsResponse | ErrorResponse;
      if (!resp.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Request failed");
      }
      setResult(data);
      const tab = optionOverride !== undefined && optionOverride < data.options.length ? optionOverride : 0;
      setActiveTab(tab);
      updateUrl(controlsOverride, mustIncludeOverride, mustExcludeOverride, tab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function selectTab(index: number) {
    setActiveTab(index);
    updateUrl(controls, mustIncludeIds, mustExcludeIds, index);
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 pb-8">
      <Hero />

      <MiniLeagueBanner />

      <Guide />

      <Controls state={controls} onChange={(patch) => setControls((s) => ({ ...s, ...patch }))} onSubmit={() => buildSquads()} loading={loading} />

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
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            {result.gameweek ? (
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>
                  Live for{" "}
                  <strong className="text-neutral-700 dark:text-neutral-300">
                    {result.gameweek.name}
                  </strong>
                  {" · Deadline "}
                  {new Date(result.gameweek.deadlineTime).toLocaleString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ) : (
              <span />
            )}
            <CopyLinkButton />
          </div>

          {result.options.length < result.requestedOptions && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-4 py-2 mb-4 text-sm">
              Only {result.options.length} distinct option(s) found — try lowering
              &quot;Min. players different&quot; for more.
            </div>
          )}

          <OptionsCompare options={result.options} activeIndex={activeTab} onSelect={selectTab} />

          <SquadOptionView option={result.options[activeTab]} budget={result.budget} />
        </>
      )}

      {!result && !error && !loading && (
        <div className="rounded-xl border border-dashed border-black/15 dark:border-white/15 p-10 text-center">
          <div className="text-3xl mb-2">⚽</div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Set your constraints above and hit <strong>Build squads</strong> to see your
            optimized options.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-10 mb-10">
        <StandingsTable />
        <TeamOfTheWeek />
      </div>

      <div className="mb-10">
        <FixturePredictions />
      </div>

      <TransferTargets />

      <TransferFinder playerOptions={playerOptions} />

      <Contact />
    </div>
  );
}
