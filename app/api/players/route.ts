import { NextResponse } from "next/server";
import { fetchPlayers } from "@/lib/fplData";

export const runtime = "nodejs";

export async function GET() {
  try {
    const players = await fetchPlayers();
    const slim = players.map((p) => ({
      id: p.id,
      webName: p.webName,
      teamName: p.teamName,
      position: p.position,
      cost: p.cost,
      selectedByPercent: p.selectedByPercent,
    }));
    return NextResponse.json({ players: slim });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
