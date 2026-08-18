export type Position = "GK" | "DEF" | "MID" | "FWD";

export interface Player {
  id: number;
  webName: string;
  teamId: number;
  teamName: string;
  position: Position;
  cost: number;
  pointsPerGame: number;
  epNext: number;
  minutes: number;
  status: string;
  chanceOfPlayingNextRound: number | null;
  selectedByPercent: number;
  /** Price change (in £0.1m) since the start of the current gameweek event;
   * positive = risen, negative = fallen. */
  costChangeEvent: number;
  fixtureDifficulty: number | null;
  score: number;
  /** 0-1: how much of pointsPerGame is real track record vs. a positional
   * average filled in for low-minutes players (new signings, fringe players). */
  confidence: number;
}

export interface GameweekInfo {
  id: number;
  name: string;
  deadlineTime: string;
}

export interface GameweekSummary {
  id: number;
  name: string;
  deadlineTime: string;
  finished: boolean;
  isCurrent: boolean;
  isNext: boolean;
}

export interface TeamStanding {
  teamId: number;
  name: string;
  shortName: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  points: number;
  position: number;
}

export interface SquadOption {
  squad: Player[];
  startingXi: Player[];
  bench: Player[];
  captainId: number;
  viceCaptainId: number;
  totalCost: number;
  projectedPoints: number;
  avgOwnership: number;
}
