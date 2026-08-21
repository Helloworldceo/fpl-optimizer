// A simplified Poisson goal-scoring model. Primary signal is ClubElo's club
// Elo ratings (lib/clubElo.ts); when a club's rating can't be resolved
// (fetch failure, or a club ClubElo doesn't carry at English top-flight
// level), falls back to FPL's own fixture difficulty ratings instead. This
// is a standard, transparent statistical approach — not a black box — but
// it's still an estimate: treat it as a directional read on two teams'
// relative strength, not a real prediction of what will happen. Football
// has genuine variance no model this simple (or, frankly, any model) fully
// captures.

const LEAGUE_AVG_HOME_GOALS = 1.5;
const LEAGUE_AVG_AWAY_GOALS = 1.2;

const MAX_GOALS = 6;
const MIN_EXPECTED_GOALS = 0.2;
const MAX_EXPECTED_GOALS = 4.5;

// clubelo.com's own commonly-cited approximate home-advantage constant, in
// Elo points.
const ELO_HOME_ADVANTAGE = 65;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function poissonPmf(k: number, lambda: number): number {
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return (lambda ** k * Math.exp(-lambda)) / factorial;
}

/** Expected goals from each side's Elo rating, using Elo's own well-known
 * exponential expected-score form (the same base-10/400 structure behind
 * the standard `1 / (1 + 10^(-diff/400))` win-probability formula) applied
 * multiplicatively to a league-average goals baseline, rather than an
 * arbitrary invented scaling constant. */
export function expectedGoalsFromElo(homeElo: number, awayElo: number): { homeGoals: number; awayGoals: number } {
  const adjustedHomeElo = homeElo + ELO_HOME_ADVANTAGE;
  const homeGoals = clamp(
    LEAGUE_AVG_HOME_GOALS * 10 ** ((adjustedHomeElo - awayElo) / 400),
    MIN_EXPECTED_GOALS,
    MAX_EXPECTED_GOALS
  );
  const awayGoals = clamp(
    LEAGUE_AVG_AWAY_GOALS * 10 ** ((awayElo - adjustedHomeElo) / 400),
    MIN_EXPECTED_GOALS,
    MAX_EXPECTED_GOALS
  );
  return { homeGoals, awayGoals };
}

/** Fallback for when a club's Elo rating can't be resolved — derive expected
 * goals from the fixture's FPL difficulty ratings (1-5, opponent-relative,
 * populated even pre-season) instead. Cruder, but honest about what data
 * actually exists for that fixture. */
export function expectedGoalsFromDifficulty(
  homeDifficulty: number,
  awayDifficulty: number
): { homeGoals: number; awayGoals: number } {
  // team_h_difficulty is how hard *this match* is for the home side (i.e. a
  // function of the away side's strength) — high difficulty for the home
  // team means fewer expected home goals, and symmetrically for the away
  // side via team_a_difficulty.
  const homeGoals = clamp(LEAGUE_AVG_HOME_GOALS * ((6 - homeDifficulty) / 3), MIN_EXPECTED_GOALS, MAX_EXPECTED_GOALS);
  const awayGoals = clamp(LEAGUE_AVG_AWAY_GOALS * ((6 - awayDifficulty) / 3), MIN_EXPECTED_GOALS, MAX_EXPECTED_GOALS);
  return { homeGoals, awayGoals };
}

export interface ScorelinePrediction {
  predictedHomeGoals: number;
  predictedAwayGoals: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
}

/** Most likely exact scoreline (mode of the joint Poisson distribution,
 * assuming independent home/away goal counts — a standard simplification),
 * plus win/draw/loss probabilities from the same distribution. */
export function predictScoreline(homeGoals: number, awayGoals: number): ScorelinePrediction {
  let bestHome = 0;
  let bestAway = 0;
  let bestProb = -1;
  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;

  for (let i = 0; i <= MAX_GOALS; i++) {
    const pHome = poissonPmf(i, homeGoals);
    for (let j = 0; j <= MAX_GOALS; j++) {
      const pAway = poissonPmf(j, awayGoals);
      const joint = pHome * pAway;
      if (joint > bestProb) {
        bestProb = joint;
        bestHome = i;
        bestAway = j;
      }
      if (i > j) homeWinProb += joint;
      else if (i === j) drawProb += joint;
      else awayWinProb += joint;
    }
  }

  // The grid is truncated at MAX_GOALS, so probabilities don't sum to
  // exactly 1 — normalize across the truncated mass rather than over-claim
  // precision from an artificially low total.
  const total = homeWinProb + drawProb + awayWinProb;
  return {
    predictedHomeGoals: bestHome,
    predictedAwayGoals: bestAway,
    homeWinProb: homeWinProb / total,
    drawProb: drawProb / total,
    awayWinProb: awayWinProb / total,
  };
}
