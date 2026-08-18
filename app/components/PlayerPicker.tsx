"use client";

import { useMemo, useState } from "react";
import type { Position } from "@/lib/types";
import { playerPhotoUrl } from "@/lib/images";

export interface PlayerOption {
  id: number;
  code: number;
  webName: string;
  teamName: string;
  teamCode: number;
  position: Position;
  cost: number;
  selectedByPercent: number;
}

function SuggestionAvatar({ code }: { code: number }) {
  const [failed, setFailed] = useState(false);
  if (!code || failed) {
    return <span className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 shrink-0" />;
  }
  return (
    <img
      src={playerPhotoUrl(code)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-6 h-6 rounded-full object-cover object-top shrink-0 bg-neutral-200 dark:bg-neutral-700"
    />
  );
}

export function PlayerPicker({
  label,
  accent,
  options,
  selectedIds,
  disabledIds,
  onChange,
}: {
  label: string;
  accent: "green" | "red";
  options: PlayerOption[];
  selectedIds: number[];
  disabledIds: Set<number>;
  onChange: (ids: number[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = options.filter((o) => selectedIds.includes(o.id));

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return options
      .filter(
        (o) =>
          !selectedIds.includes(o.id) &&
          !disabledIds.has(o.id) &&
          (o.webName.toLowerCase().includes(q) || o.teamName.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [query, options, selectedIds, disabledIds]);

  function add(id: number) {
    onChange([...selectedIds, id]);
    setQuery("");
  }
  function remove(id: number) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  const chipClasses =
    accent === "green"
      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
      : "border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300";

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="text-neutral-600 dark:text-neutral-300">{label}</span>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span
              key={p.id}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${chipClasses}`}
            >
              {p.webName}
              <button
                onClick={() => remove(p.id)}
                aria-label={`Remove ${p.webName}`}
                className="font-bold leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search player or team..."
          className="w-full rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-lg max-h-56 overflow-auto">
            {suggestions.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
              >
                <SuggestionAvatar code={p.code} />
                <span className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0 sm:gap-2">
                  <span className="truncate">
                    {p.webName} <span className="text-neutral-400 text-xs">({p.position})</span>
                  </span>
                  <span className="text-neutral-500 text-xs truncate sm:shrink-0">
                    {p.teamName} · £{p.cost.toFixed(1)}m · {p.selectedByPercent.toFixed(1)}% owned
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
