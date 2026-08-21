// 3 points for an exact scoreline, 1 point for correctly picking the result
// (home win / draw / away win), 0 otherwise — standard score-predictor
// rules. Returns null if the fixture hasn't finished yet (nothing to score
// against).
export function scorePrediction(
  predictedHome: number,
  predictedAway: number,
  actualHome: number | null,
  actualAway: number | null,
  finished: boolean
): number | null {
  if (!finished || actualHome === null || actualAway === null) return null;

  if (predictedHome === actualHome && predictedAway === actualAway) return 3;

  const predictedResult = Math.sign(predictedHome - predictedAway);
  const actualResult = Math.sign(actualHome - actualAway);
  return predictedResult === actualResult ? 1 : 0;
}

// Full marks (20) for an exact position match, tapering off by 1 point per
// place away, floored at 0 — so a near-miss still scores something instead
// of an all-or-nothing exact match, which would be brutal across 20 teams.
export function scoreTablePosition(predictedPosition: number, currentPosition: number): number {
  return Math.max(0, 20 - Math.abs(predictedPosition - currentPosition));
}
