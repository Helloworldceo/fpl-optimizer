import { NextRequest, NextResponse } from "next/server";
import { fetchPlayersAndGameweek, fetchTeamFixtureDifficulty } from "@/lib/fplData";
import { buildSquadOption, computeScores, selectTopSquads } from "@/lib/optimizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function parseIds(raw: string | null): Set<number> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n))
  );
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const budget = clamp(parseFloat(params.get("budget") ?? "100"), 60, 100);
  const maxPerTeam = clamp(parseInt(params.get("maxPerTeam") ?? "3", 10), 1, 3);
  const fixtureLookahead = clamp(parseInt(params.get("fixtureLookahead") ?? "5", 10), 0, 10);
  const numOptions = clamp(parseInt(params.get("numOptions") ?? "5", 10), 1, 10);
  const minDiff = clamp(parseInt(params.get("minDiff") ?? "3", 10), 1, 10);

  const mustExclude = parseIds(params.get("mustExclude"));
  const mustInclude = new Set(
    [...parseIds(params.get("mustInclude"))].filter((id) => !mustExclude.has(id))
  );

  try {
    const { players, gameweek } = await fetchPlayersAndGameweek();
    const fixtureDifficulty =
      fixtureLookahead > 0 ? await fetchTeamFixtureDifficulty(fixtureLookahead) : null;
    const scoredPlayers = computeScores(players, fixtureDifficulty);

    const squads = selectTopSquads(
      scoredPlayers,
      budget,
      maxPerTeam,
      numOptions,
      minDiff,
      mustInclude,
      mustExclude
    );
    if (squads.length === 0) {
      return NextResponse.json(
        {
          error:
            mustInclude.size > 0
              ? "No feasible squad includes all of your must-include players within the budget, formation, and club-limit constraints. Try a higher budget, a higher max-per-club, or fewer must-include picks."
              : "No feasible squad found with these settings.",
        },
        { status: 422 }
      );
    }

    const options = squads.map(buildSquadOption);
    return NextResponse.json({ options, budget, requestedOptions: numOptions, gameweek });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
