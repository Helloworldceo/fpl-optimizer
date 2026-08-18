import type { Player } from "@/lib/types";

const POSITION_COLORS: Record<Player["position"], string> = {
  GK: "bg-amber-500",
  DEF: "bg-sky-500",
  MID: "bg-emerald-500",
  FWD: "bg-rose-500",
};

export function PlayerChip({
  player,
  tag,
  variant = "pitch",
}: {
  player: Player;
  tag?: "C" | "VC";
  variant?: "pitch" | "bench";
}) {
  const initials = player.webName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center w-[4.5rem] sm:w-20 text-center shrink-0">
      <div className="relative">
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${POSITION_COLORS[player.position]} shadow-md ring-2 ring-white dark:ring-neutral-950 flex items-center justify-center text-white font-bold text-xs`}
        >
          {initials}
        </div>
        {tag && (
          <span
            className={`absolute -top-1 -right-1 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center text-white ${
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
        £{player.cost.toFixed(1)}m
      </div>
    </div>
  );
}
