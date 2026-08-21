"use client";

import { useActionState } from "react";
import type { FixtureResult } from "@/lib/types";
import { submitPrediction, type PredictionState } from "@/lib/actions/predictions";
import { scorePrediction } from "@/lib/scoring";
import { TeamCrest } from "@/app/components/TeamCrest";

const initialState: PredictionState = {};

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PredictionRow({
  fixture,
  eventId,
  existing,
}: {
  fixture: FixtureResult;
  eventId: number;
  existing?: { predictedHome: number; predictedAway: number };
}) {
  const action = submitPrediction.bind(null, eventId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const locked = fixture.finished || (fixture.kickoffTime !== null && new Date(fixture.kickoffTime) <= new Date());
  const points =
    existing && fixture.finished
      ? scorePrediction(existing.predictedHome, existing.predictedAway, fixture.homeScore, fixture.awayScore, true)
      : null;

  return (
    <div className="rounded-lg border border-black/5 dark:border-white/10 px-3 py-2.5">
      {fixture.kickoffTime && !fixture.finished && (
        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-1.5 text-center">
          {locked ? "Locked — kicked off " : "Predict until kickoff: "}
          {formatKickoff(fixture.kickoffTime)}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm truncate">{fixture.homeTeam.shortName}</span>
          <TeamCrest teamCode={fixture.homeTeam.teamCode} size={20} />
        </div>

        {locked ? (
          <div className="shrink-0 px-2 text-sm text-center">
            {fixture.finished ? (
              <span className="font-semibold tabular-nums">
                {fixture.homeScore} – {fixture.awayScore}
              </span>
            ) : (
              <span className="text-neutral-400 dark:text-neutral-500 text-xs">Locked</span>
            )}
            {existing && (
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                You: {existing.predictedHome}-{existing.predictedAway}
                {points !== null && <span className="ml-1 font-medium text-emerald-600 dark:text-emerald-400">+{points}</span>}
              </div>
            )}
          </div>
        ) : (
          <form action={formAction} className="flex items-center gap-1.5 shrink-0">
            <input type="hidden" name="fixtureId" value={fixture.fixtureId} />
            <input
              type="number"
              name="predictedHome"
              min={0}
              max={20}
              defaultValue={existing?.predictedHome}
              required
              className="w-11 text-center rounded border border-black/15 dark:border-white/15 bg-transparent py-1 text-sm"
            />
            <span className="text-neutral-400">-</span>
            <input
              type="number"
              name="predictedAway"
              min={0}
              max={20}
              defaultValue={existing?.predictedAway}
              required
              className="w-11 text-center rounded border border-black/15 dark:border-white/15 bg-transparent py-1 text-sm"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium px-2.5 py-1.5 transition-colors"
            >
              {pending ? "..." : existing ? "Update" : "Lock in"}
            </button>
          </form>
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamCrest teamCode={fixture.awayTeam.teamCode} size={20} />
          <span className="text-sm truncate">{fixture.awayTeam.shortName}</span>
        </div>
      </div>
      {state.error && <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{state.error}</p>}
      {state.success && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5">Saved.</p>
      )}
    </div>
  );
}
