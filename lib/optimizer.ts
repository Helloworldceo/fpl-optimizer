import solver from "javascript-lp-solver";
import type { Player, Position, SquadOption, TransferSuggestion } from "./types";

export const SQUAD_REQUIREMENTS: Record<Position, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const XI_MIN: Record<Position, number> = { GK: 1, DEF: 3, MID: 2, FWD: 1 };
const XI_MAX: Record<Position, number> = { GK: 1, DEF: 5, MID: 5, FWD: 3 };
const XI_SIZE = 11;
const POSITION_ORDER: Position[] = ["GK", "DEF", "MID", "FWD"];

// A player with a full season of minutes is treated as fully "proven";
// below that, pointsPerGame is shrunk toward their position's average
// (among proven players) so a handful of good/bad minutes — or a brand
// new signing with no Premier League track record — can't masquerade as
// a reliable stat. Avoids overrating small-sample outliers in either
// direction.
const FULL_SEASON_MINUTES = 2500;
const MIN_MINUTES_FOR_BASELINE = 450;
const DEFAULT_BASELINE_PPG = 2.0;

function computePositionBaselines(players: Player[]): Record<Position, number> {
  const totals: Record<Position, { sum: number; count: number }> = {
    GK: { sum: 0, count: 0 },
    DEF: { sum: 0, count: 0 },
    MID: { sum: 0, count: 0 },
    FWD: { sum: 0, count: 0 },
  };
  for (const p of players) {
    if (p.minutes >= MIN_MINUTES_FOR_BASELINE) {
      totals[p.position].sum += p.pointsPerGame;
      totals[p.position].count += 1;
    }
  }
  const baselines = {} as Record<Position, number>;
  for (const pos of POSITION_ORDER) {
    baselines[pos] = totals[pos].count > 0 ? totals[pos].sum / totals[pos].count : DEFAULT_BASELINE_PPG;
  }
  return baselines;
}

export function computeScores(
  players: Player[],
  fixtureDifficulty: Map<number, number> | null
): Player[] {
  const baselines = computePositionBaselines(players);

  return players.map((p) => {
    const confidence = Math.min(1, p.minutes / FULL_SEASON_MINUTES);
    const adjustedPpg = confidence * p.pointsPerGame + (1 - confidence) * baselines[p.position];

    if (!fixtureDifficulty) {
      return {
        ...p,
        fixtureDifficulty: null,
        confidence,
        score: 0.6 * adjustedPpg + 0.4 * p.epNext,
      };
    }
    const avgDiff = fixtureDifficulty.get(p.teamId) ?? 3.0;
    const fixtureScore = (5 - avgDiff) * 2.5; // 1 (easiest) -> 10, 5 (hardest) -> 0
    return {
      ...p,
      fixtureDifficulty: avgDiff,
      confidence,
      score: 0.5 * adjustedPpg + 0.3 * p.epNext + 0.2 * fixtureScore,
    };
  });
}

interface LpVariable {
  objective: number;
  budget: number;
  [key: string]: number;
}

export type ObjectiveField = "score" | "selectedByPercent";

function solveSquadLp(
  players: Player[],
  budget: number,
  maxPerTeam: number,
  excludeSquads: Set<number>[],
  minDiff: number,
  mustIncludeIds: Set<number>,
  objectiveField: ObjectiveField
): Player[] | null {
  const teamIds = Array.from(new Set(players.map((p) => p.teamId)));

  const constraints: Record<string, { max?: number; min?: number; equal?: number }> = {
    budget: { max: budget },
  };
  for (const pos of POSITION_ORDER) constraints[`pos_${pos}`] = { equal: SQUAD_REQUIREMENTS[pos] };
  for (const teamId of teamIds) constraints[`team_${teamId}`] = { max: maxPerTeam };
  excludeSquads.forEach((_, i) => {
    constraints[`prev_${i}`] = { max: 15 - minDiff };
  });
  for (const id of mustIncludeIds) {
    constraints[`must_${id}`] = { min: 1 };
  }

  const variables: Record<string, LpVariable> = {};
  const binaries: Record<string, 1> = {};
  for (const p of players) {
    const key = `p${p.id}`;
    const v: LpVariable = {
      objective: p[objectiveField],
      budget: p.cost,
      [`pos_${p.position}`]: 1,
      [`team_${p.teamId}`]: 1,
    };
    excludeSquads.forEach((prevIds, i) => {
      if (prevIds.has(p.id)) v[`prev_${i}`] = 1;
    });
    if (mustIncludeIds.has(p.id)) v[`must_${p.id}`] = 1;
    variables[key] = v;
    binaries[key] = 1;
  }

  const model = {
    optimize: "objective",
    opType: "max" as const,
    constraints,
    variables,
    binaries,
  };

  const result = solver.Solve(model) as Record<string, number | boolean>;
  if (!result.feasible) return null;

  const chosenIds = new Set(
    Object.keys(result)
      .filter((k) => k.startsWith("p") && result[k] === 1)
      .map((k) => parseInt(k.slice(1), 10))
  );
  return players.filter((p) => chosenIds.has(p.id));
}

export function selectTopSquads(
  players: Player[],
  budget: number,
  maxPerTeam: number,
  numOptions: number,
  minDiff: number,
  mustIncludeIds: Set<number> = new Set(),
  mustExcludeIds: Set<number> = new Set(),
  objectiveField: ObjectiveField = "score"
): Player[][] {
  const pool = players.filter((p) => !mustExcludeIds.has(p.id));
  const squads: Player[][] = [];
  const excludeSquads: Set<number>[] = [];
  for (let i = 0; i < numOptions; i++) {
    const squad = solveSquadLp(
      pool,
      budget,
      maxPerTeam,
      excludeSquads,
      minDiff,
      mustIncludeIds,
      objectiveField
    );
    if (!squad) break;
    squads.push(squad);
    excludeSquads.push(new Set(squad.map((p) => p.id)));
  }
  return squads;
}

export function selectBestXi(
  squad: Player[],
  objectiveField: ObjectiveField = "score"
): { startingXi: Player[]; bench: Player[] } {
  const constraints: Record<string, { max?: number; min?: number; equal?: number }> = {
    size: { equal: XI_SIZE },
  };
  for (const pos of POSITION_ORDER) {
    constraints[`min_${pos}`] = { min: XI_MIN[pos] };
    constraints[`max_${pos}`] = { max: XI_MAX[pos] };
  }

  const variables: Record<string, LpVariable> = {};
  const binaries: Record<string, 1> = {};
  for (const p of squad) {
    variables[`p${p.id}`] = {
      objective: p[objectiveField],
      budget: 0,
      size: 1,
      [`min_${p.position}`]: 1,
      [`max_${p.position}`]: 1,
    };
    binaries[`p${p.id}`] = 1;
  }

  const model = { optimize: "objective", opType: "max" as const, constraints, variables, binaries };
  const result = solver.Solve(model) as Record<string, number | boolean>;

  const startingIds = new Set(
    Object.keys(result)
      .filter((k) => k.startsWith("p") && result[k] === 1)
      .map((k) => parseInt(k.slice(1), 10))
  );

  const startingXi = squad.filter((p) => startingIds.has(p.id));
  const bench = squad.filter((p) => !startingIds.has(p.id));
  return { startingXi: sortByPosition(startingXi), bench: sortByPosition(bench) };
}

function sortByPosition(players: Player[]): Player[] {
  const order: Record<Position, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
  return [...players].sort((a, b) => order[a.position] - order[b.position]);
}

// Captaincy is a single-gameweek bet where points get doubled, so it should
// be ranked by near-term ceiling rather than the same season-long blended
// score used to pick the squad. ep_next (this gameweek's model projection)
// is weighted heavily; pointsPerGame only breaks ties/damps outliers.
function captainScore(p: Player): number {
  return 0.3 * p.pointsPerGame + 0.7 * p.epNext;
}

export function buildSquadOption(
  squad: Player[],
  objectiveField: ObjectiveField = "score"
): SquadOption {
  const { startingXi, bench } = selectBestXi(squad, objectiveField);
  const ranked = [...startingXi].sort((a, b) => captainScore(b) - captainScore(a));
  const captain = ranked[0];
  const viceCaptain = ranked[1];

  const totalCost = squad.reduce((sum, p) => sum + p.cost, 0);
  // Always reported using the value score, even in ownership/template mode,
  // so you can see what a "safe" squad costs you in expected points.
  const projectedPoints = startingXi.reduce((sum, p) => sum + p.score, 0) + captain.score;
  const avgOwnership = squad.reduce((sum, p) => sum + p.selectedByPercent, 0) / squad.length;

  return {
    squad: sortByPosition(squad),
    startingXi,
    bench,
    captainId: captain.id,
    viceCaptainId: viceCaptain.id,
    totalCost,
    projectedPoints,
    avgOwnership,
  };
}

/**
 * Finds the single best like-for-like swap (same position) for an existing
 * 15-man squad: the pairing that maximizes score gain minus transfer cost,
 * respecting budget (outgoing player's value + bank) and the max-per-club
 * limit. This is a small enough search space (squad size × candidate pool)
 * that an exhaustive pairwise scan is simpler and just as fast as an ILP.
 */
export function suggestBestTransfer(
  currentSquad: Player[],
  candidatePool: Player[],
  bank: number,
  maxPerTeam: number,
  transferCost: number
): TransferSuggestion | null {
  const squadIds = new Set(currentSquad.map((p) => p.id));
  const teamCounts = new Map<number, number>();
  for (const p of currentSquad) teamCounts.set(p.teamId, (teamCounts.get(p.teamId) ?? 0) + 1);

  let best: TransferSuggestion | null = null;

  for (const out of currentSquad) {
    const budgetForIn = out.cost + bank;
    const teamCountWithoutOut = (teamCounts.get(out.teamId) ?? 0) - 1;

    for (const inP of candidatePool) {
      if (squadIds.has(inP.id) || inP.position !== out.position) continue;
      if (inP.cost > budgetForIn + 1e-9) continue;

      const teamCountIn =
        inP.teamId === out.teamId ? teamCountWithoutOut + 1 : (teamCounts.get(inP.teamId) ?? 0) + 1;
      if (teamCountIn > maxPerTeam) continue;

      const pointGain = inP.score - out.score;
      const netGain = pointGain - transferCost;
      if (!best || netGain > best.netGain) {
        best = { transferOut: out, transferIn: inP, pointGain, netGain, transferCost };
      }
    }
  }

  return best;
}
