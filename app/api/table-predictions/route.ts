import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchGameweeks, fetchStandings } from "@/lib/fplData";
import { scoreTablePosition } from "@/lib/scoring";
import { CURRENT_SEASON } from "@/lib/season";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to see or make a table prediction." }, { status: 401 });
  }

  try {
    const [standings, gameweeks, predictions] = await Promise.all([
      fetchStandings(),
      fetchGameweeks(),
      prisma.tablePrediction.findMany({
        where: { userId: session.user.id, season: CURRENT_SEASON },
        select: { teamId: true, position: true },
      }),
    ]);

    const gw1 = gameweeks.find((g) => g.id === 1);
    const deadlineTime = gw1?.deadlineTime ?? null;
    const locked = deadlineTime !== null && new Date(deadlineTime) <= new Date();

    const currentPositionByTeamId = new Map(standings.map((t) => [t.teamId, t.position]));
    const liveScore =
      predictions.length === 20
        ? predictions.reduce((sum, p) => {
            const currentPosition = currentPositionByTeamId.get(p.teamId);
            return currentPosition === undefined ? sum : sum + scoreTablePosition(p.position, currentPosition);
          }, 0)
        : null;

    return NextResponse.json({
      teams: standings,
      myPrediction: predictions.length > 0 ? predictions : null,
      locked,
      deadlineTime,
      liveScore,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
