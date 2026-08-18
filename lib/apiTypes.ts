import type { GameweekInfo, SquadOption } from "./types";

export interface SquadsResponse {
  options: SquadOption[];
  budget: number;
  requestedOptions: number;
  gameweek: GameweekInfo | null;
}

export interface SquadsErrorResponse {
  error: string;
}
