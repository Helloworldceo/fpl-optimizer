import type { SquadOption } from "@/lib/types";

export function OptionsCompare({
  options,
  activeIndex,
  onSelect,
}: {
  options: SquadOption[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const bestIndex = options.reduce(
    (best, opt, i) => (opt.projectedPoints > options[best].projectedPoints ? i : best),
    0
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
      {options.map((opt, i) => {
        const captain = opt.startingXi.find((p) => p.id === opt.captainId);
        const isActive = i === activeIndex;
        const isBest = i === bestIndex;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`relative text-left rounded-lg border px-3 py-2 transition-colors ${
              isActive
                ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40"
                : "border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25"
            }`}
          >
            {isBest && (
              <span className="absolute -top-2 -right-2 text-[9px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5">
                BEST
              </span>
            )}
            <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Option {i + 1}
            </div>
            <div className="text-sm font-semibold mt-0.5">{opt.projectedPoints.toFixed(1)} pts</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              £{opt.totalCost.toFixed(1)}m · {captain?.webName}
            </div>
          </button>
        );
      })}
    </div>
  );
}
