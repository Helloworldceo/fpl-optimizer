import type { Player } from "@/lib/types";
import { PlayerChip } from "./PlayerChip";

const ROW_ORDER: Player["position"][] = ["FWD", "MID", "DEF", "GK"];

export function Pitch({
  startingXi,
  captainId,
  viceCaptainId,
}: {
  startingXi: Player[];
  captainId: number;
  viceCaptainId: number;
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-black/10 dark:border-white/10"
      style={{
        background:
          "repeating-linear-gradient(180deg, #2f8f4e 0, #2f8f4e 40px, #2b8548 40px, #2b8548 80px)",
      }}
    >
      <div className="absolute inset-4 border border-white/25 rounded-lg pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/25 rounded-full pointer-events-none" />
      <div className="absolute left-4 right-4 top-1/2 border-t border-white/25 pointer-events-none" />

      <div className="relative flex flex-col justify-between py-6 gap-5 min-h-[380px] sm:min-h-[420px]">
        {ROW_ORDER.map((pos) => (
          <div key={pos} className="flex justify-evenly flex-wrap gap-x-2 gap-y-4 px-2">
            {startingXi
              .filter((p) => p.position === pos)
              .map((p) => (
                <PlayerChip
                  key={p.id}
                  player={p}
                  tag={p.id === captainId ? "C" : p.id === viceCaptainId ? "VC" : undefined}
                  variant="pitch"
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
