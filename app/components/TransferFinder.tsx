"use client";

import { useState } from "react";
import type { BestTransferResponse, ErrorResponse } from "@/lib/apiTypes";
import { PlayerPicker, type PlayerOption } from "./PlayerPicker";
import { PlayerChip } from "./PlayerChip";

const REQUIRED_COUNTS: Record<"GK" | "DEF" | "MID" | "FWD", number> = {
  GK: 2,
  DEF: 5,
  MID: 5,
  FWD: 3,
};

export function TransferFinder({ playerOptions }: { playerOptions: PlayerOption[] }) {
  const [squadIds, setSquadIds] = useState<number[]>([]);
  const [bank, setBank] = useState(0);
  const [freeTransfers, setFreeTransfers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BestTransferResponse | null>(null);

  const counts: Record<"GK" | "DEF" | "MID" | "FWD", number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const id of squadIds) {
    const opt = playerOptions.find((p) => p.id === id);
    if (opt) counts[opt.position] += 1;
  }
  const isComplete =
    squadIds.length === 15 &&
    (Object.keys(REQUIRED_COUNTS) as (keyof typeof REQUIRED_COUNTS)[]).every(
      (pos) => counts[pos] === REQUIRED_COUNTS[pos]
    );

  async function findTransfer() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        squad: squadIds.join(","),
        bank: String(bank),
        freeTransfers: String(freeTransfers),
      });
      const resp = await fetch(`/api/best-transfer?${params.toString()}`);
      const json = (await resp.json()) as BestTransferResponse | ErrorResponse;
      if (!resp.ok || "error" in json) throw new Error("error" in json ? json.error : "Request failed");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 p-5 mb-10">
      <div className="mb-1 font-medium text-sm">Best Transfer Finder</div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
        Pick your current 15-man squad and we&apos;ll find the single best like-for-like swap.
      </p>

      <PlayerPicker
        label="My current squad"
        accent="green"
        options={playerOptions}
        selectedIds={squadIds}
        disabledIds={new Set()}
        onChange={setSquadIds}
      />

      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        {(Object.keys(REQUIRED_COUNTS) as (keyof typeof REQUIRED_COUNTS)[]).map((pos) => (
          <span
            key={pos}
            className={
              counts[pos] === REQUIRED_COUNTS[pos]
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-neutral-500 dark:text-neutral-400"
            }
          >
            {pos} {counts[pos]}/{REQUIRED_COUNTS[pos]}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-neutral-600 dark:text-neutral-300">Bank (£m)</span>
          <input
            type="number"
            min={0}
            max={20}
            step={0.1}
            value={bank}
            onChange={(e) => setBank(parseFloat(e.target.value) || 0)}
            className="rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-neutral-600 dark:text-neutral-300">Free transfers</span>
          <select
            value={freeTransfers}
            onChange={(e) => setFreeTransfers(parseInt(e.target.value, 10))}
            className="rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5"
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        onClick={findTransfer}
        disabled={!isComplete || loading}
        className="mt-4 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium px-4 py-2 text-sm transition-colors"
      >
        {loading ? "Finding..." : "Find best transfer"}
      </button>

      {!isComplete && squadIds.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          Pick exactly 2 GK / 5 DEF / 5 MID / 3 FWD to enable this.
        </p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>}

      {result && (
        <div className="mt-5 rounded-lg border border-black/10 dark:border-white/10 p-4">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-red-600 dark:text-red-400 font-semibold">OUT</span>
              <PlayerChip player={result.suggestion.transferOut} variant="bench" />
            </div>
            <span className="text-2xl text-neutral-400">→</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">IN</span>
              <PlayerChip player={result.suggestion.transferIn} variant="bench" />
            </div>
          </div>
          <div className="text-center mt-4 text-sm">
            <div>
              Expected gain:{" "}
              <strong>
                {result.suggestion.pointGain >= 0 ? "+" : ""}
                {result.suggestion.pointGain.toFixed(1)} pts/GW
              </strong>
            </div>
            {result.suggestion.transferCost > 0 && (
              <div className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">
                Net of -{result.suggestion.transferCost} transfer cost:{" "}
                {result.suggestion.netGain >= 0 ? "+" : ""}
                {result.suggestion.netGain.toFixed(1)} pts
              </div>
            )}
            {result.suggestion.netGain <= 0 && (
              <div className="text-amber-600 dark:text-amber-400 text-xs mt-2">
                This transfer doesn&apos;t pay for itself — you may be better off holding.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
