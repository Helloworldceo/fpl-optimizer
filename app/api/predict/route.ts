import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchFixturesForGameweek, fetchGameweeks } from "@/lib/fplData";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to see or make predictions." }, { status: 401 });
  }

  const eventId = parseInt(req.nextUrl.searchParams.get("event") ?? "", 10);
  if (!Number.isInteger(eventId) || eventId < 1) {
    return NextResponse.json({ error: "Missing or invalid 'event' gameweek id." }, { status: 400 });
  }

  try {
    const gameweeks = await fetchGameweeks();
    const gameweek = gameweeks.find((g) => g.id === eventId);
    if (!gameweek) {
      return NextResponse.json({ error: "Unknown gameweek." }, { status: 404 });
    }

    const fixtures = await fetchFixturesForGameweek(eventId);
    const predictions = await prisma.prediction.findMany({
      where: { userId: session.user.id, eventId },
      select: { fixtureId: true, predictedHome: true, predictedAway: true },
    });

    return NextResponse.json({ gameweek, fixtures, myPredictions: predictions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
