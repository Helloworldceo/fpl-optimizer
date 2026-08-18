"use client";

import { useState } from "react";
import type { Player } from "@/lib/types";
import { playerPhotoUrl } from "@/lib/images";

const POSITION_COLORS: Record<Player["position"], string> = {
  GK: "bg-amber-500",
  DEF: "bg-sky-500",
  MID: "bg-emerald-500",
  FWD: "bg-rose-500",
};

const POSITION_BORDERS: Record<Player["position"], string> = {
  GK: "border-amber-500",
  DEF: "border-sky-500",
  MID: "border-emerald-500",
  FWD: "border-rose-500",
};

export function PlayerChip({
  player,
  tag,
  variant = "pitch",
  subtitle,
}: {
  player: Player;
  tag?: "C" | "VC";
  variant?: "pitch" | "bench";
  /** Overrides the default "£cost m" line, e.g. to show gameweek points instead. */
  subtitle?: string;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const initials = player.webName.slice(0, 2).toUpperCase();
  const showPhoto = player.code > 0 && !photoFailed;

  return (
    <div className="flex flex-col items-center w-[4.5rem] sm:w-20 text-center shrink-0">
      <div className="relative">
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 shadow-md bg-neutral-200 dark:bg-neutral-800 ${POSITION_BORDERS[player.position]}`}
        >
          {showPhoto ? (
            <img
              src={playerPhotoUrl(player.code)}
              alt={player.webName}
              width={44}
              height={44}
              loading="lazy"
              onError={() => setPhotoFailed(true)}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center text-white font-bold text-xs ${POSITION_COLORS[player.position]}`}
            >
              {initials}
            </div>
          )}
        </div>
        {tag && (
          <span
            className={`absolute -top-1 -right-1 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center text-white ring-2 ring-white dark:ring-neutral-950 ${
              tag === "C" ? "bg-amber-400 text-amber-950" : "bg-slate-300 text-slate-800"
            }`}
          >
            {tag}
          </span>
        )}
      </div>
      <div
        className={`mt-1 text-[11px] font-medium rounded px-1.5 py-0.5 truncate max-w-full ${
          variant === "pitch"
            ? "bg-black/65 text-white"
            : "bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-black/10 dark:border-white/10"
        }`}
      >
        {player.webName}
      </div>
      <div
        className={`text-[10px] mt-0.5 ${
          variant === "pitch" ? "text-white/85" : "text-neutral-500 dark:text-neutral-400"
        }`}
      >
        {subtitle ?? `£${player.cost.toFixed(1)}m`}
      </div>
    </div>
  );
}
