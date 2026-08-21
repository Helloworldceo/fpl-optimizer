import { NextResponse } from "next/server";
import { computeLeaderboard } from "@/lib/leaderboard";

export const runtime = "nodejs";

export async function GET() {
  try {
    const leaderboard = await computeLeaderboard();
    return NextResponse.json({ leaderboard });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
