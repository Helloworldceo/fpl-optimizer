import type { Player } from "@/lib/types";
import { PlayerChip } from "./PlayerChip";

export function BenchStrip({ bench }: { bench: Player[] }) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-3">
        Bench
      </div>
      <div className="flex justify-evenly flex-wrap gap-4">
        {bench.map((p) => (
          <PlayerChip key={p.id} player={p} variant="bench" />
        ))}
      </div>
    </div>
  );
}
