import type { FixturePrediction, GameweekInfo, GameweekSummary, Player, Position, TeamStanding } from "./types";
import {
  computeLeagueAverageStrength,
  expectedGoals,
  expectedGoalsFromDifficulty,
  predictScoreline,
} from "./predictions";

const BOOTSTRAP_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";
// No ?future=1 filter: an explicit GW-range picker needs full-season fixture
// data (including already-played gameweeks), not just what's still ahead.
const FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/";
const EVENT_LIVE_URL = (eventId: number) =>
  `https://fantasy.premierleague.com/api/event/${eventId}/live/`;

// How long Next's Data Cache may serve a cached copy of each endpoint before
// re-fetching from FPL. Shares one fetch across concurrent/nearby requests
// instead of every route hitting FPL's API on every request.
const BOOTSTRAP_REVALIDATE_SECONDS = 60;
const FIXTURES_REVALIDATE_SECONDS = 300;
// A finished gameweek's live stats are effectively immutable; an in-progress
// one changes often but callers only ever request finished gameweeks here.
const EVENT_LIVE_REVALIDATE_SECONDS = 600;

const POSITION_MAP: Record<number, Position> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
const UNAVAILABLE_STATUSES = new Set(["i", "s", "u", "n"]);

interface BootstrapElement {
  id: number;
  code: number;
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
  cost_change_event: number;
}

interface BootstrapTeam {
  id: number;
  code: number;
  name: string;
  short_name: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  points: number;
  position: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
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
  id: number;
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string | null;
  finished: boolean;
}

interface EventLiveElement {
  id: number;
  stats?: { total_points?: number };
}

async function fetchJson<T>(url: string, revalidateSeconds: number): Promise<T> {
  const resp = await fetch(url, {
    headers: { "User-Agent": "fpl-optimizer-web" },
    next: { revalidate: revalidateSeconds },
  });
  if (!resp.ok) {
    throw new Error(`FPL API request failed (${resp.status}): ${url}`);
  }
  return resp.json() as Promise<T>;
}

function allPlayersFromBootstrap(data: BootstrapResponse): Player[] {
  const teamNames = new Map(data.teams.map((t) => [t.id, t.name]));
  const teamCodes = new Map(data.teams.map((t) => [t.id, t.code]));

  return data.elements.map((e) => ({
    id: e.id,
    code: e.code,
    webName: e.web_name,
    teamId: e.team,
    teamName: teamNames.get(e.team) ?? "Unknown",
    teamCode: teamCodes.get(e.team) ?? 0,
    position: POSITION_MAP[e.element_type],
    cost: e.now_cost / 10,
    pointsPerGame: parseFloat(e.points_per_game) || 0,
    epNext: parseFloat(e.ep_next) || 0,
    minutes: e.minutes,
    status: e.status,
    chanceOfPlayingNextRound: e.chance_of_playing_next_round,
    selectedByPercent: parseFloat(e.selected_by_percent) || 0,
    costChangeEvent: e.cost_change_event ?? 0,
    fixtureDifficulty: null,
    score: 0,
    confidence: 0,
  }));
}

export function isAvailablePlayer(p: Player): boolean {
  return (
    !UNAVAILABLE_STATUSES.has(p.status) &&
    (p.chanceOfPlayingNextRound === null || p.chanceOfPlayingNextRound >= 50)
  );
}

function playersFromBootstrap(data: BootstrapResponse): Player[] {
  return allPlayersFromBootstrap(data).filter(isAvailablePlayer);
}

function gameweekFromBootstrap(data: BootstrapResponse): GameweekInfo | null {
  const event =
    data.events.find((e) => e.is_current) ??
    data.events.find((e) => e.is_next) ??
    data.events.find((e) => !e.finished);
  if (!event) return null;
  return { id: event.id, name: event.name, deadlineTime: event.deadline_time };
}

function gameweeksFromBootstrap(data: BootstrapResponse): GameweekSummary[] {
  return data.events.map((e) => ({
    id: e.id,
    name: e.name,
    deadlineTime: e.deadline_time,
    finished: e.finished,
    isCurrent: e.is_current,
    isNext: e.is_next,
  }));
}

function standingsFromBootstrap(data: BootstrapResponse): TeamStanding[] {
  return [...data.teams]
    .map((t) => ({
      teamId: t.id,
      teamCode: t.code,
      name: t.name,
      shortName: t.short_name,
      played: t.played,
      win: t.win,
      draw: t.draw,
      loss: t.loss,
      points: t.points,
      position: t.position,
    }))
    .sort((a, b) => (a.position || 99) - (b.position || 99) || b.points - a.points);
}

export async function fetchPlayers(): Promise<Player[]> {
  const data = await fetchJson<BootstrapResponse>(BOOTSTRAP_URL, BOOTSTRAP_REVALIDATE_SECONDS);
  return playersFromBootstrap(data);
}

export async function fetchPlayersAndGameweek(): Promise<{
  players: Player[];
  gameweek: GameweekInfo | null;
}> {
  const data = await fetchJson<BootstrapResponse>(BOOTSTRAP_URL, BOOTSTRAP_REVALIDATE_SECONDS);
  return { players: playersFromBootstrap(data), gameweek: gameweekFromBootstrap(data) };
}

/** Unfiltered players (includes currently injured/unavailable ones), so a
 * user's real current squad can always be located — including whoever
 * they'd most want to transfer out. */
export async function fetchAllPlayersAndGameweek(): Promise<{
  players: Player[];
  gameweek: GameweekInfo | null;
}> {
  const data = await fetchJson<BootstrapResponse>(BOOTSTRAP_URL, BOOTSTRAP_REVALIDATE_SECONDS);
  return { players: allPlayersFromBootstrap(data), gameweek: gameweekFromBootstrap(data) };
}

export async function fetchStandings(): Promise<TeamStanding[]> {
  const data = await fetchJson<BootstrapResponse>(BOOTSTRAP_URL, BOOTSTRAP_REVALIDATE_SECONDS);
  return standingsFromBootstrap(data);
}

export async function fetchGameweeks(): Promise<GameweekSummary[]> {
  const data = await fetchJson<BootstrapResponse>(BOOTSTRAP_URL, BOOTSTRAP_REVALIDATE_SECONDS);
  return gameweeksFromBootstrap(data);
}

/** All players (no availability filter) with that gameweek's actual FPL
 * points, for building a historical "team of the week" — a player who is
 * currently injured should still show up in a past gameweek they played. */
export async function fetchGameweekPerformances(
  eventId: number
): Promise<{ players: Player[]; gameweek: GameweekSummary | null }> {
  const [bootstrap, live] = await Promise.all([
    fetchJson<BootstrapResponse>(BOOTSTRAP_URL, BOOTSTRAP_REVALIDATE_SECONDS),
    fetchJson<{ elements: EventLiveElement[] }>(EVENT_LIVE_URL(eventId), EVENT_LIVE_REVALIDATE_SECONDS),
  ]);

  const pointsById = new Map(live.elements.map((e) => [e.id, e.stats?.total_points ?? 0]));
  const players = allPlayersFromBootstrap(bootstrap).map((p) => ({
    ...p,
    score: pointsById.get(p.id) ?? 0,
  }));
  const gameweek = gameweeksFromBootstrap(bootstrap).find((g) => g.id === eventId) ?? null;
  return { players, gameweek };
}

/** Average fixture difficulty per team across an explicit gameweek range
 * (inclusive), e.g. GW3-GW7 — not just "next N from now". */
export async function fetchTeamFixtureDifficulty(
  fromGw: number,
  toGw: number
): Promise<Map<number, number>> {
  const fixtures = await fetchJson<Fixture[]>(FIXTURES_URL, FIXTURES_REVALIDATE_SECONDS);
  const relevant = fixtures.filter(
    (f) => f.event !== null && f.event >= fromGw && f.event <= toGw
  );

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

/** Predicted scoreline + win/draw/loss probabilities for every fixture in a
 * gameweek, via a Poisson model built on FPL's own team strength ratings
 * (see lib/predictions.ts). Works for past, current, or future gameweeks —
 * the model doesn't know or care whether a fixture has been played yet.
 * `usingFallback` is true when FPL hasn't published strength ratings yet
 * (pre-season) and fixture difficulty was used as a cruder substitute. */
export async function fetchFixturePredictions(
  eventId: number
): Promise<{ predictions: FixturePrediction[]; usingFallback: boolean }> {
  const [bootstrap, fixtures] = await Promise.all([
    fetchJson<BootstrapResponse>(BOOTSTRAP_URL, BOOTSTRAP_REVALIDATE_SECONDS),
    fetchJson<Fixture[]>(FIXTURES_URL, FIXTURES_REVALIDATE_SECONDS),
  ]);

  const teamsById = new Map(bootstrap.teams.map((t) => [t.id, t]));
  const leagueAvg = computeLeagueAverageStrength(
    bootstrap.teams.map((t) => ({
      attackHome: t.strength_attack_home,
      attackAway: t.strength_attack_away,
      defenceHome: t.strength_defence_home,
      defenceAway: t.strength_defence_away,
    }))
  );

  // FPL zeroes every team's strength ratings out league-wide until the
  // season's first ball is kicked. Detect that rather than let it silently
  // produce division-by-zero / NaN, and fall back to fixture difficulty
  // (which is populated even pre-season) instead.
  const strengthDataReady =
    leagueAvg.attackHome > 0 &&
    leagueAvg.attackAway > 0 &&
    leagueAvg.defenceHome > 0 &&
    leagueAvg.defenceAway > 0;

  const relevant = fixtures
    .filter((f) => f.event === eventId)
    .sort((a, b) => (a.kickoff_time ?? "").localeCompare(b.kickoff_time ?? ""));

  const predictions = relevant.flatMap((f) => {
    const home = teamsById.get(f.team_h);
    const away = teamsById.get(f.team_a);
    if (!home || !away) return [];

    const { homeGoals, awayGoals } = strengthDataReady
      ? expectedGoals(
          {
            attackHome: home.strength_attack_home,
            attackAway: home.strength_attack_away,
            defenceHome: home.strength_defence_home,
            defenceAway: home.strength_defence_away,
          },
          {
            attackHome: away.strength_attack_home,
            attackAway: away.strength_attack_away,
            defenceHome: away.strength_defence_home,
            defenceAway: away.strength_defence_away,
          },
          leagueAvg
        )
      : expectedGoalsFromDifficulty(f.team_h_difficulty, f.team_a_difficulty);
    const prediction = predictScoreline(homeGoals, awayGoals);

    return [
      {
        fixtureId: f.id,
        kickoffTime: f.kickoff_time,
        homeTeam: { teamId: home.id, teamCode: home.code, name: home.name, shortName: home.short_name },
        awayTeam: { teamId: away.id, teamCode: away.code, name: away.name, shortName: away.short_name },
        ...prediction,
      },
    ];
  });

  return { predictions, usingFallback: !strengthDataReady };
}
