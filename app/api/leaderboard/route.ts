import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchFixturesForGameweek } from "@/lib/fplData";
import { scorePrediction } from "@/lib/scoring";
import type { LeaderboardEntry } from "@/lib/apiTypes";

export const runtime = "nodejs";

export async function GET() {
  try {
    const predictions = await prisma.prediction.findMany({
      include: { user: { select: { id: true, name: true } } },
    });

    if (predictions.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    const eventIds = [...new Set(predictions.map((p) => p.eventId))];
    const fixturesByEvent = await Promise.all(eventIds.map((id) => fetchFixturesForGameweek(id)));
    const resultsByFixtureId = new Map(
      fixturesByEvent.flat().map((f) => [f.fixtureId, f])
    );

    const totals = new Map<string, LeaderboardEntry>();

    for (const p of predictions) {
      const result = resultsByFixtureId.get(p.fixtureId);
      if (!result) continue;

      const points = scorePrediction(p.predictedHome, p.predictedAway, result.homeScore, result.awayScore, result.finished);
      if (points === null) continue;

      const existing = totals.get(p.userId) ?? {
        userId: p.userId,
        name: p.user.name,
        points: 0,
        predictionsScored: 0,
        exactScores: 0,
      };
      existing.points += points;
      existing.predictionsScored += 1;
      if (points === 3) existing.exactScores += 1;
      totals.set(p.userId, existing);
    }

    const leaderboard = [...totals.values()].sort(
      (a, b) => b.points - a.points || b.exactScores - a.exactScores
    );

    return NextResponse.json({ leaderboard });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
