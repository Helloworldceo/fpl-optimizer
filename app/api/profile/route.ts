import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchFixturesForGameweek, fetchGameweeks } from "@/lib/fplData";
import { scorePrediction } from "@/lib/scoring";
import type { ProfilePrediction } from "@/lib/apiTypes";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to see your profile." }, { status: 401 });
  }

  try {
    const [user, predictions, gameweeks] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
      prisma.prediction.findMany({ where: { userId: session.user.id } }),
      fetchGameweeks(),
    ]);

    const gameweekNameById = new Map(gameweeks.map((g) => [g.id, g.name]));
    const eventIds = [...new Set(predictions.map((p) => p.eventId))];
    const fixturesByEvent = await Promise.all(eventIds.map((id) => fetchFixturesForGameweek(id)));
    const resultsByFixtureId = new Map(fixturesByEvent.flat().map((f) => [f.fixtureId, f]));

    let totalPoints = 0;
    let exactScores = 0;
    let predictionsScored = 0;
    let predictionsPending = 0;

    const history: ProfilePrediction[] = predictions.flatMap((p) => {
      const result = resultsByFixtureId.get(p.fixtureId);
      if (!result) return [];

      const points = scorePrediction(p.predictedHome, p.predictedAway, result.homeScore, result.awayScore, result.finished);
      if (points === null) {
        predictionsPending += 1;
      } else {
        totalPoints += points;
        predictionsScored += 1;
        if (points === 3) exactScores += 1;
      }

      return [
        {
          fixtureId: p.fixtureId,
          eventId: p.eventId,
          eventName: gameweekNameById.get(p.eventId) ?? `Gameweek ${p.eventId}`,
          kickoffTime: result.kickoffTime,
          finished: result.finished,
          homeTeam: result.homeTeam,
          awayTeam: result.awayTeam,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          predictedHome: p.predictedHome,
          predictedAway: p.predictedAway,
          points,
        },
      ];
    });

    history.sort((a, b) => b.eventId - a.eventId || (b.kickoffTime ?? "").localeCompare(a.kickoffTime ?? ""));

    return NextResponse.json({
      name: user.name,
      email: user.email,
      memberSince: user.createdAt,
      totalPoints,
      exactScores,
      predictionsScored,
      predictionsPending,
      predictions: history,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
