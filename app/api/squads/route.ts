import { NextRequest, NextResponse } from "next/server";
import { fetchPlayers, fetchTeamFixtureDifficulty } from "@/lib/fplData";
import { buildSquadOption, computeScores, selectTopSquads } from "@/lib/optimizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const budget = clamp(parseFloat(params.get("budget") ?? "100"), 60, 100);
  const maxPerTeam = clamp(parseInt(params.get("maxPerTeam") ?? "3", 10), 1, 3);
  const fixtureLookahead = clamp(parseInt(params.get("fixtureLookahead") ?? "5", 10), 0, 10);
  const numOptions = clamp(parseInt(params.get("numOptions") ?? "5", 10), 1, 10);
  const minDiff = clamp(parseInt(params.get("minDiff") ?? "3", 10), 1, 10);

  try {
    const players = await fetchPlayers();
    const fixtureDifficulty =
      fixtureLookahead > 0 ? await fetchTeamFixtureDifficulty(fixtureLookahead) : null;
    const scoredPlayers = computeScores(players, fixtureDifficulty);

    const squads = selectTopSquads(scoredPlayers, budget, maxPerTeam, numOptions, minDiff);
    if (squads.length === 0) {
      return NextResponse.json(
        { error: "No feasible squad found with these settings." },
        { status: 422 }
      );
    }

    const options = squads.map(buildSquadOption);
    return NextResponse.json({ options, budget, requestedOptions: numOptions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
