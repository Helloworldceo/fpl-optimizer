"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ErrorResponse, ProfilePrediction, ProfileResponse } from "@/lib/apiTypes";
import { TeamCrest } from "@/app/components/TeamCrest";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 text-center">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</div>
    </div>
  );
}

function PredictionRow({ prediction }: { prediction: ProfilePrediction }) {
  return (
    <div className="rounded-lg border border-black/5 dark:border-white/10 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm truncate">{prediction.homeTeam.shortName}</span>
          <TeamCrest teamCode={prediction.homeTeam.teamCode} size={20} />
        </div>

        <div className="shrink-0 px-2 text-center">
          <div className="text-xs text-neutral-400 dark:text-neutral-500">
            You: {prediction.predictedHome}-{prediction.predictedAway}
          </div>
          {prediction.finished ? (
            <div className="text-sm font-semibold tabular-nums">
              {prediction.homeScore} – {prediction.awayScore}
            </div>
          ) : (
            <div className="text-xs text-neutral-400 dark:text-neutral-500">Upcoming</div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamCrest teamCode={prediction.awayTeam.teamCode} size={20} />
          <span className="text-sm truncate">{prediction.awayTeam.shortName}</span>
        </div>

        <div className="w-10 text-right shrink-0">
          {prediction.points !== null && (
            <span
              className={`text-sm font-semibold tabular-nums ${
                prediction.points > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-neutral-400 dark:text-neutral-500"
              }`}
            >
              +{prediction.points}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProfileClient() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (r) => {
        const json = (await r.json()) as ProfileResponse | ErrorResponse;
        if (!r.ok || "error" in json) throw new Error("error" in json ? json.error : "Request failed");
        setData(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
  }, []);

  const grouped = useMemo(() => {
    const groups: { eventId: number; eventName: string; predictions: ProfilePrediction[] }[] = [];
    for (const p of data?.predictions ?? []) {
      const last = groups[groups.length - 1];
      if (last && last.eventId === p.eventId) {
        last.predictions.push(p);
      } else {
        groups.push({ eventId: p.eventId, eventName: p.eventName, predictions: [p] });
      }
    }
    return groups;
  }, [data]);

  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!data) return <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>;

  return (
    <div>
      <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 mb-6">
        <div className="font-semibold">{data.name}</div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          {data.email} · Member since {new Date(data.memberSince).toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        <StatCard label="Points" value={data.totalPoints} />
        <StatCard label="Exact scores" value={data.exactScores} />
        <StatCard label="Scored" value={data.predictionsScored} />
        <StatCard label="Pending" value={data.predictionsPending} />
      </div>

      <h2 className="font-semibold text-sm mb-3">Prediction history</h2>

      {grouped.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          You haven&apos;t locked in any predictions yet —{" "}
          <Link href="/predict" className="text-emerald-600 dark:text-emerald-400 font-medium">
            head to Predict
          </Link>{" "}
          to get started.
        </p>
      )}

      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.eventId}>
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
              {group.eventName}
            </div>
            <div className="space-y-2">
              {group.predictions.map((p) => (
                <PredictionRow key={p.fixtureId} prediction={p} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
