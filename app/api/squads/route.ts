import { NextRequest, NextResponse } from "next/server";
import { fetchPlayersAndGameweek, fetchTeamFixtureDifficulty } from "@/lib/fplData";
import { buildSquadOption, computeScores, type ObjectiveField, selectTopSquads } from "@/lib/optimizer";
import { clamp, parseFixtureRange } from "@/lib/apiParams";

export const runtime = "nodejs";

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
  const numOptions = clamp(parseInt(params.get("numOptions") ?? "5", 10), 1, 10);
  const minDiff = clamp(parseInt(params.get("minDiff") ?? "3", 10), 1, 10);

  const mustExclude = parseIds(params.get("mustExclude"));
  const mustInclude = new Set(
    [...parseIds(params.get("mustInclude"))].filter((id) => !mustExclude.has(id))
  );
  const objectiveField: ObjectiveField =
    params.get("optimizeBy") === "ownership" ? "selectedByPercent" : "score";

  try {
    const { players, gameweek } = await fetchPlayersAndGameweek();
    const { fixtureFrom, fixtureTo } = parseFixtureRange(params, gameweek?.id ?? null);
    const fixtureDifficulty = await fetchTeamFixtureDifficulty(fixtureFrom, fixtureTo);
    const scoredPlayers = computeScores(players, fixtureDifficulty);

    const squads = selectTopSquads(
      scoredPlayers,
      budget,
      maxPerTeam,
      numOptions,
      minDiff,
      mustInclude,
      mustExclude,
      objectiveField
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

    const options = squads.map((squad) => buildSquadOption(squad, objectiveField));
    return NextResponse.json({
      options,
      budget,
      requestedOptions: numOptions,
      gameweek,
      fixtureFrom,
      fixtureTo,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
