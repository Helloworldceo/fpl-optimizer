import type {
  GameweekInfo,
  GameweekSummary,
  Player,
  SquadOption,
  TeamStanding,
  TransferSuggestion,
} from "./types";

export interface SquadsResponse {
  options: SquadOption[];
  budget: number;
  requestedOptions: number;
  gameweek: GameweekInfo | null;
  fixtureFrom: number;
  fixtureTo: number;
}

export interface StandingsResponse {
  standings: TeamStanding[];
}

export interface GameweeksResponse {
  gameweeks: GameweekSummary[];
}

export interface TeamOfTheWeekResponse {
  gameweek: GameweekSummary;
  startingXi: Player[];
  topPerformerId: number | null;
  totalPoints: number;
}

export interface TransferTargetsResponse {
  targets: Player[];
  gameweek: GameweekInfo | null;
  fixtureFrom: number;
  fixtureTo: number;
}

export interface BestTransferResponse {
  suggestion: TransferSuggestion;
  gameweek: GameweekInfo | null;
  freeTransfers: number;
  bank: number;
}

export interface ErrorResponse {
  error: string;
}
