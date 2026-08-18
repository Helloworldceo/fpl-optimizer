import { NextResponse } from "next/server";
import { fetchGameweeks } from "@/lib/fplData";

export const runtime = "nodejs";

export async function GET() {
  try {
    const gameweeks = await fetchGameweeks();
    return NextResponse.json({ gameweeks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
