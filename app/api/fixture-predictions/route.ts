import { NextRequest, NextResponse } from "next/server";
import { fetchFixturePredictions, fetchGameweeks } from "@/lib/fplData";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
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

    const { predictions, usingFallback } = await fetchFixturePredictions(eventId);
    return NextResponse.json({ gameweek, predictions, usingFallback });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
