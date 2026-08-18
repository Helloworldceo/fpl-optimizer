import type { GameweekInfo, Player, Position } from "./types";

const BOOTSTRAP_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";
const FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/?future=1";

const POSITION_MAP: Record<number, Position> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
const UNAVAILABLE_STATUSES = new Set(["i", "s", "u", "n"]);

interface BootstrapElement {
  id: number;
  web_name: string;
  team: number;
  element_type: number;
  now_cost: number;
  points_per_game: string;
  form: string;
  ep_next: string;
  minutes: number;
  status: string;
  chance_of_playing_next_round: number | null;
  selected_by_percent: string;
}

interface BootstrapTeam {
  id: number;
  name: string;
}

interface BootstrapEvent {
  id: number;
  name: string;
  deadline_time: string;
  finished: boolean;
  is_current: boolean;
  is_next: boolean;
}

interface BootstrapResponse {
  elements: BootstrapElement[];
  teams: BootstrapTeam[];
  events: BootstrapEvent[];
}

interface Fixture {
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const resp = await fetch(url, {
    headers: { "User-Agent": "fpl-optimizer-web" },
    cache: "no-store",
  });
  if (!resp.ok) {
    throw new Error(`FPL API request failed (${resp.status}): ${url}`);
  }
  return resp.json() as Promise<T>;
}

function playersFromBootstrap(data: BootstrapResponse): Player[] {
  const teamNames = new Map(data.teams.map((t) => [t.id, t.name]));

  const players: Player[] = data.elements.map((e) => ({
    id: e.id,
    webName: e.web_name,
    teamId: e.team,
    teamName: teamNames.get(e.team) ?? "Unknown",
    position: POSITION_MAP[e.element_type],
    cost: e.now_cost / 10,
    pointsPerGame: parseFloat(e.points_per_game) || 0,
    epNext: parseFloat(e.ep_next) || 0,
    minutes: e.minutes,
    status: e.status,
    chanceOfPlayingNextRound: e.chance_of_playing_next_round,
    selectedByPercent: parseFloat(e.selected_by_percent) || 0,
    fixtureDifficulty: null,
    score: 0,
    confidence: 0,
  }));

  return players.filter(
    (p) =>
      !UNAVAILABLE_STATUSES.has(p.status) &&
      (p.chanceOfPlayingNextRound === null || p.chanceOfPlayingNextRound >= 50)
  );
}

function gameweekFromBootstrap(data: BootstrapResponse): GameweekInfo | null {
  const event =
    data.events.find((e) => e.is_current) ??
    data.events.find((e) => e.is_next) ??
    data.events.find((e) => !e.finished);
  if (!event) return null;
  return { id: event.id, name: event.name, deadlineTime: event.deadline_time };
}

export async function fetchPlayers(): Promise<Player[]> {
  const data = await fetchJson<BootstrapResponse>(BOOTSTRAP_URL);
  return playersFromBootstrap(data);
}

export async function fetchPlayersAndGameweek(): Promise<{
  players: Player[];
  gameweek: GameweekInfo | null;
}> {
  const data = await fetchJson<BootstrapResponse>(BOOTSTRAP_URL);
  return { players: playersFromBootstrap(data), gameweek: gameweekFromBootstrap(data) };
}

export async function fetchTeamFixtureDifficulty(
  numGameweeks: number
): Promise<Map<number, number>> {
  const fixtures = await fetchJson<Fixture[]>(FIXTURES_URL);

  const events = Array.from(
    new Set(fixtures.map((f) => f.event).filter((e): e is number => e !== null))
  ).sort((a, b) => a - b);
  const cutoff = new Set(events.slice(0, numGameweeks));
  const relevant = fixtures.filter((f) => f.event !== null && cutoff.has(f.event));

  const byTeam = new Map<number, number[]>();
  for (const f of relevant) {
    if (!byTeam.has(f.team_h)) byTeam.set(f.team_h, []);
    if (!byTeam.has(f.team_a)) byTeam.set(f.team_a, []);
    byTeam.get(f.team_h)!.push(f.team_h_difficulty);
    byTeam.get(f.team_a)!.push(f.team_a_difficulty);
  }

  const result = new Map<number, number>();
  for (const [teamId, diffs] of byTeam) {
    result.set(teamId, diffs.reduce((a, b) => a + b, 0) / diffs.length);
  }
  return result;
}
