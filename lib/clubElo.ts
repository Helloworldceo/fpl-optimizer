// ClubElo (clubelo.com) — a free, publicly documented Elo rating API for
// football clubs, used here as the closest legitimate free alternative to
// Opta's (commercial, not publicly accessible) team power rankings.
//
// Note: at the time this was built, api.clubelo.com was unreachable from
// this project's dev/test network on every attempt (connects at the TCP/TLS
// level, then times out with no response — both directly and via a second,
// independent network path), while clubelo.com's own site was reachable
// fine. This could be an outage, or bot-defensive behavior specific to the
// api. subdomain — either way, it means this integration could not be
// exercised end-to-end before shipping. It's written against the
// documented, stable contract (not scraped HTML, which would be far more
// fragile) and every caller falls back to fixture-difficulty-based
// estimates (see predictions.ts) if a fetch fails or a club isn't found, so
// a ClubElo outage degrades this feature rather than breaking it — but this
// specific code path needs a real check against production traffic.

const CLUBELO_REVALIDATE_SECONDS = 3600;
const CLUBELO_TIMEOUT_MS = 2000;

// ClubElo's club names differ from FPL's for a handful of teams.
const FPL_TO_CLUBELO_NAME: Record<string, string> = {
  "Man Utd": "Man United",
  "Nott'm Forest": "Forest",
  Spurs: "Tottenham",
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Next's fetch cache only ever caches *successful* responses — a timed-out
// or failed request isn't cached, so as long as ClubElo stays unreachable,
// every single request to this app would otherwise re-pay the full timeout
// on every call. This in-memory backoff makes a warm serverless instance
// skip the doomed network attempt entirely for a few minutes after a
// failure, instead of every visitor waiting out a timeout that's already
// known to fail. Resets immediately on the next success.
let lastFailureAt: number | null = null;
const FAILURE_BACKOFF_MS = 3 * 60 * 1000;

/** Map of ClubElo club name -> current Elo rating, for English top-flight
 * clubs only. Returns null (rather than throwing) on any failure, so
 * callers can fall back cleanly instead of the whole prediction failing. */
export async function fetchClubEloRatings(): Promise<Map<string, number> | null> {
  if (lastFailureAt && Date.now() - lastFailureAt < FAILURE_BACKOFF_MS) {
    return null;
  }

  try {
    const res = await fetch(`http://api.clubelo.com/${todayIsoDate()}`, {
      headers: { "User-Agent": "fpl-optimizer-web" },
      next: { revalidate: CLUBELO_REVALIDATE_SECONDS },
      // ClubElo has been observed to hang (connect, then never respond)
      // rather than fail fast — without a timeout, that would stall the
      // whole fixture-predictions request instead of falling back quickly.
      signal: AbortSignal.timeout(CLUBELO_TIMEOUT_MS),
    });
    if (!res.ok) {
      lastFailureAt = Date.now();
      return null;
    }

    const csv = await res.text();
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return null;

    const header = lines[0].split(",");
    const clubIdx = header.indexOf("Club");
    const countryIdx = header.indexOf("Country");
    const levelIdx = header.indexOf("Level");
    const eloIdx = header.indexOf("Elo");
    if ([clubIdx, countryIdx, levelIdx, eloIdx].includes(-1)) return null;

    const ratings = new Map<string, number>();
    for (const line of lines.slice(1)) {
      const cols = line.split(",");
      if (cols[countryIdx] === "ENG" && cols[levelIdx] === "1") {
        const elo = parseFloat(cols[eloIdx]);
        if (Number.isFinite(elo)) ratings.set(cols[clubIdx], elo);
      }
    }
    return ratings;
  } catch {
    // The observed failure mode is a hang that AbortSignal.timeout() cuts
    // off, not an HTTP error — so this is the branch that actually needs to
    // arm the backoff above.
    lastFailureAt = Date.now();
    return null;
  }
}

export function resolveClubEloRating(fplTeamName: string, ratings: Map<string, number>): number | null {
  const clubEloName = FPL_TO_CLUBELO_NAME[fplTeamName] ?? fplTeamName;
  return ratings.get(clubEloName) ?? null;
}
