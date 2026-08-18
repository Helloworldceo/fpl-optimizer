import solver from "javascript-lp-solver";
import type { Player, Position, SquadOption } from "./types";

const SQUAD_REQUIREMENTS: Record<Position, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const XI_MIN: Record<Position, number> = { GK: 1, DEF: 3, MID: 2, FWD: 1 };
const XI_MAX: Record<Position, number> = { GK: 1, DEF: 5, MID: 5, FWD: 3 };
const XI_SIZE = 11;
const POSITION_ORDER: Position[] = ["GK", "DEF", "MID", "FWD"];

export function computeScores(
  players: Player[],
  fixtureDifficulty: Map<number, number> | null
): Player[] {
  return players.map((p) => {
    if (!fixtureDifficulty) {
      return { ...p, fixtureDifficulty: null, score: 0.6 * p.pointsPerGame + 0.4 * p.epNext };
    }
    const avgDiff = fixtureDifficulty.get(p.teamId) ?? 3.0;
    const fixtureScore = (5 - avgDiff) * 2.5; // 1 (easiest) -> 10, 5 (hardest) -> 0
    return {
      ...p,
      fixtureDifficulty: avgDiff,
      score: 0.5 * p.pointsPerGame + 0.3 * p.epNext + 0.2 * fixtureScore,
    };
  });
}

interface LpVariable {
  score: number;
  budget: number;
  [key: string]: number;
}

function solveSquadLp(
  players: Player[],
  budget: number,
  maxPerTeam: number,
  excludeSquads: Set<number>[],
  minDiff: number
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

  const variables: Record<string, LpVariable> = {};
  const binaries: Record<string, 1> = {};
  for (const p of players) {
    const key = `p${p.id}`;
    const v: LpVariable = { score: p.score, budget: p.cost, [`pos_${p.position}`]: 1, [`team_${p.teamId}`]: 1 };
    excludeSquads.forEach((prevIds, i) => {
      if (prevIds.has(p.id)) v[`prev_${i}`] = 1;
    });
    variables[key] = v;
    binaries[key] = 1;
  }

  const model = {
    optimize: "score",
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
  minDiff: number
): Player[][] {
  const squads: Player[][] = [];
  const excludeSquads: Set<number>[] = [];
  for (let i = 0; i < numOptions; i++) {
    const squad = solveSquadLp(players, budget, maxPerTeam, excludeSquads, minDiff);
    if (!squad) break;
    squads.push(squad);
    excludeSquads.push(new Set(squad.map((p) => p.id)));
  }
  return squads;
}

export function selectBestXi(squad: Player[]): { startingXi: Player[]; bench: Player[] } {
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
      score: p.score,
      budget: 0,
      size: 1,
      [`min_${p.position}`]: 1,
      [`max_${p.position}`]: 1,
    };
    binaries[`p${p.id}`] = 1;
  }

  const model = { optimize: "score", opType: "max" as const, constraints, variables, binaries };
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

export function buildSquadOption(squad: Player[]): SquadOption {
  const { startingXi, bench } = selectBestXi(squad);
  const ranked = [...startingXi].sort((a, b) => b.score - a.score);
  const captain = ranked[0];
  const viceCaptain = ranked[1];

  const totalCost = squad.reduce((sum, p) => sum + p.cost, 0);
  const projectedPoints = startingXi.reduce((sum, p) => sum + p.score, 0) + captain.score;

  return {
    squad: sortByPosition(squad),
    startingXi,
    bench,
    captainId: captain.id,
    viceCaptainId: viceCaptain.id,
    totalCost,
    projectedPoints,
  };
}
