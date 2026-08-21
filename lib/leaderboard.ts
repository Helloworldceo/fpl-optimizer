import { prisma } from "@/lib/prisma";
import { fetchFixturesForGameweek, fetchStandings } from "@/lib/fplData";
import { scorePrediction, scoreTablePosition } from "@/lib/scoring";
import { CURRENT_SEASON } from "@/lib/season";
import type { LeaderboardEntry, TableLeaderboardEntry } from "@/lib/apiTypes";

/** Points-ranked leaderboard from every scored prediction. Pass `userIds`
 * to scope it to a specific league's membership; omit for the global
 * leaderboard. */
export async function computeLeaderboard(userIds?: string[]): Promise<LeaderboardEntry[]> {
  const predictions = await prisma.prediction.findMany({
    where: userIds ? { userId: { in: userIds } } : undefined,
    include: { user: { select: { id: true, name: true } } },
  });

  if (predictions.length === 0) return [];

  const eventIds = [...new Set(predictions.map((p) => p.eventId))];
  const fixturesByEvent = await Promise.all(eventIds.map((id) => fetchFixturesForGameweek(id)));
  const resultsByFixtureId = new Map(fixturesByEvent.flat().map((f) => [f.fixtureId, f]));

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

  return [...totals.values()].sort((a, b) => b.points - a.points || b.exactScores - a.exactScores);
}

/** Table-prediction leaderboard, scored live against FPL's current
 * standings rather than waiting for the season to end. Pass `userIds` to
 * scope it to a league's membership; omit for the global leaderboard. */
export async function computeTableLeaderboard(userIds?: string[]): Promise<TableLeaderboardEntry[]> {
  const predictions = await prisma.tablePrediction.findMany({
    where: { season: CURRENT_SEASON, ...(userIds ? { userId: { in: userIds } } : {}) },
    include: { user: { select: { id: true, name: true } } },
  });

  if (predictions.length === 0) return [];

  const standings = await fetchStandings();
  const currentPositionByTeamId = new Map(standings.map((t) => [t.teamId, t.position]));

  const totals = new Map<string, TableLeaderboardEntry>();

  for (const p of predictions) {
    const currentPosition = currentPositionByTeamId.get(p.teamId);
    if (currentPosition === undefined) continue;

    const existing = totals.get(p.userId) ?? { userId: p.userId, name: p.user.name, points: 0 };
    existing.points += scoreTablePosition(p.position, currentPosition);
    totals.set(p.userId, existing);
  }

  return [...totals.values()].sort((a, b) => b.points - a.points);
}
