// A simplified Poisson goal-scoring model, using FPL's own team strength
// ratings (strength_attack_home/away, strength_defence_home/away) rather
// than a separately trained model. This is a standard, transparent approach
// in football analytics — not a black box — but it's still a statistical
// estimate: treat it as a directional read on two teams' relative strength,
// not a real prediction of what will happen. Football has genuine variance
// no model this simple (or, frankly, any model) fully captures.

export interface TeamStrength {
  attackHome: number;
  attackAway: number;
  defenceHome: number;
  defenceAway: number;
}

// Approximate recent Premier League per-team-per-game averages.
const LEAGUE_AVG_HOME_GOALS = 1.5;
const LEAGUE_AVG_AWAY_GOALS = 1.2;

const MAX_GOALS = 6;
const MIN_EXPECTED_GOALS = 0.2;
const MAX_EXPECTED_GOALS = 4.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function poissonPmf(k: number, lambda: number): number {
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return (lambda ** k * Math.exp(-lambda)) / factorial;
}

export interface LeagueAverageStrength {
  attackHome: number;
  attackAway: number;
  defenceHome: number;
  defenceAway: number;
}

export function computeLeagueAverageStrength(teams: TeamStrength[]): LeagueAverageStrength {
  const n = teams.length || 1;
  const sum = teams.reduce(
    (acc, t) => ({
      attackHome: acc.attackHome + t.attackHome,
      attackAway: acc.attackAway + t.attackAway,
      defenceHome: acc.defenceHome + t.defenceHome,
      defenceAway: acc.defenceAway + t.defenceAway,
    }),
    { attackHome: 0, attackAway: 0, defenceHome: 0, defenceAway: 0 }
  );
  return {
    attackHome: sum.attackHome / n,
    attackAway: sum.attackAway / n,
    defenceHome: sum.defenceHome / n,
    defenceAway: sum.defenceAway / n,
  };
}

export function expectedGoals(
  home: TeamStrength,
  away: TeamStrength,
  leagueAvg: LeagueAverageStrength
): { homeGoals: number; awayGoals: number } {
  const homeAttackRatio = home.attackHome / leagueAvg.attackHome;
  const awayDefenceRatio = away.defenceAway / leagueAvg.defenceAway;
  const awayAttackRatio = away.attackAway / leagueAvg.attackAway;
  const homeDefenceRatio = home.defenceHome / leagueAvg.defenceHome;

  const homeGoals = clamp(
    LEAGUE_AVG_HOME_GOALS * (homeAttackRatio / awayDefenceRatio),
    MIN_EXPECTED_GOALS,
    MAX_EXPECTED_GOALS
  );
  const awayGoals = clamp(
    LEAGUE_AVG_AWAY_GOALS * (awayAttackRatio / homeDefenceRatio),
    MIN_EXPECTED_GOALS,
    MAX_EXPECTED_GOALS
  );
  return { homeGoals, awayGoals };
}

/** Fallback for when FPL hasn't published team strength ratings yet (all
 * zero, which happens league-wide before a season's first ball is kicked) —
 * derive expected goals from the fixture's difficulty ratings (1-5,
 * opponent-relative, populated even pre-season) instead of producing NaN
 * from a division by zero. Cruder than the strength-based model, but honest
 * about what data actually exists right now. */
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
