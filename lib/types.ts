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
  fixtureDifficulty: number | null;
  score: number;
}

export interface SquadOption {
  squad: Player[];
  startingXi: Player[];
  bench: Player[];
  captainId: number;
  viceCaptainId: number;
  totalCost: number;
  projectedPoints: number;
}
