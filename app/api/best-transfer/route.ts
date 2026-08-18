import { NextRequest, NextResponse } from "next/server";
import { fetchAllPlayersAndGameweek, fetchTeamFixtureDifficulty, isAvailablePlayer } from "@/lib/fplData";
import { computeScores, SQUAD_REQUIREMENTS, suggestBestTransfer } from "@/lib/optimizer";
import { clamp, parseFixtureRange } from "@/lib/apiParams";
import type { Player, Position } from "@/lib/types";

export const runtime = "nodejs";

const MAX_PER_TEAM = 3;

function parseIds(raw: string | null): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n));
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const squadIds = parseIds(params.get("squad"));
  const bank = clamp(parseFloat(params.get("bank") ?? "0"), 0, 20);
  const freeTransfers = clamp(parseInt(params.get("freeTransfers") ?? "1", 10), 0, 5);

  if (squadIds.length !== 15) {
    return NextResponse.json(
      { error: `A full 15-man squad is required — got ${squadIds.length} player(s).` },
      { status: 400 }
    );
  }

  try {
    const { players, gameweek } = await fetchAllPlayersAndGameweek();
    const { fixtureFrom, fixtureTo } = parseFixtureRange(params, gameweek?.id ?? null);
    const fixtureDifficulty = await fetchTeamFixtureDifficulty(fixtureFrom, fixtureTo);
    const scored = computeScores(players, fixtureDifficulty);

    const byId = new Map(scored.map((p) => [p.id, p]));
    const currentSquad = squadIds
      .map((id) => byId.get(id))
      .filter((p): p is Player => p !== undefined);
    if (currentSquad.length !== 15) {
      return NextResponse.json(
        { error: "Some of the given player ids couldn't be found." },
        { status: 422 }
      );
    }

    const counts: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const p of currentSquad) counts[p.position] += 1;
    const mismatch = (Object.keys(SQUAD_REQUIREMENTS) as Position[]).find(
      (pos) => counts[pos] !== SQUAD_REQUIREMENTS[pos]
    );
    if (mismatch) {
      return NextResponse.json(
        {
          error: `Squad must be exactly 2 GK / 5 DEF / 5 MID / 3 FWD — got ${counts.GK} GK / ${counts.DEF} DEF / ${counts.MID} MID / ${counts.FWD} FWD.`,
        },
        { status: 422 }
      );
    }

    const squadIdSet = new Set(squadIds);
    const candidatePool = scored.filter((p) => isAvailablePlayer(p) && !squadIdSet.has(p.id));
    const transferCost = freeTransfers >= 1 ? 0 : 4;

    const suggestion = suggestBestTransfer(currentSquad, candidatePool, bank, MAX_PER_TEAM, transferCost);
    if (!suggestion) {
      return NextResponse.json(
        { error: "No valid transfer found within your budget and club-limit constraints." },
        { status: 422 }
      );
    }

    return NextResponse.json({ suggestion, gameweek, freeTransfers, bank });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
