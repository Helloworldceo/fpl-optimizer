import type { SquadOption } from "./types";

export interface SquadsResponse {
  options: SquadOption[];
  budget: number;
  requestedOptions: number;
}

export interface SquadsErrorResponse {
  error: string;
}
