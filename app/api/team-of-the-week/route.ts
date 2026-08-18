import { NextRequest, NextResponse } from "next/server";
import { fetchGameweekPerformances } from "@/lib/fplData";
import { selectBestXi } from "@/lib/optimizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const eventId = parseInt(req.nextUrl.searchParams.get("event") ?? "", 10);
  if (!Number.isInteger(eventId) || eventId < 1) {
    return NextResponse.json({ error: "Missing or invalid 'event' gameweek id." }, { status: 400 });
  }

  try {
    const { players, gameweek } = await fetchGameweekPerformances(eventId);
    if (!gameweek) {
      return NextResponse.json({ error: "Unknown gameweek." }, { status: 404 });
    }
    if (!gameweek.finished) {
      return NextResponse.json(
        { error: `${gameweek.name} hasn't finished yet — check back once it's complete.` },
        { status: 422 }
      );
    }

    const { startingXi } = selectBestXi(players);
    const ranked = [...startingXi].sort((a, b) => b.score - a.score);
    const topPerformerId = ranked[0]?.id ?? null;
    const totalPoints = startingXi.reduce((sum, p) => sum + p.score, 0);

    return NextResponse.json({ gameweek, startingXi, topPerformerId, totalPoints });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
