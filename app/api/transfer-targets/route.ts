import { NextRequest, NextResponse } from "next/server";
import { fetchPlayersAndGameweek, fetchTeamFixtureDifficulty } from "@/lib/fplData";
import { computeScores } from "@/lib/optimizer";
import type { Position } from "@/lib/types";

export const runtime = "nodejs";

const VALID_POSITIONS = new Set<Position>(["GK", "DEF", "MID", "FWD"]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const positionParam = params.get("position");
  const position = positionParam && VALID_POSITIONS.has(positionParam as Position)
    ? (positionParam as Position)
    : null;
  const maxCostParam = params.get("maxCost");
  const maxCost = maxCostParam ? parseFloat(maxCostParam) : null;
  const fixtureLookahead = clamp(parseInt(params.get("fixtureLookahead") ?? "5", 10), 0, 10);
  const limit = clamp(parseInt(params.get("limit") ?? "15", 10), 1, 30);

  try {
    const { players, gameweek } = await fetchPlayersAndGameweek();
    const fixtureDifficulty =
      fixtureLookahead > 0 ? await fetchTeamFixtureDifficulty(fixtureLookahead) : null;

    let scored = computeScores(players, fixtureDifficulty);
    if (position) scored = scored.filter((p) => p.position === position);
    if (maxCost !== null && !Number.isNaN(maxCost)) scored = scored.filter((p) => p.cost <= maxCost);

    scored.sort((a, b) => b.score - a.score);
    const targets = scored.slice(0, limit);

    return NextResponse.json({ targets, gameweek });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
