const MIN_GW = 1;
const MAX_GW = 38;
const DEFAULT_WINDOW = 5;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Parses an explicit GW range (fixtureFrom/fixtureTo) from query params,
 * defaulting to a 5-gameweek window starting at the current gameweek. */
export function parseFixtureRange(
  params: URLSearchParams,
  currentGameweekId: number | null
): { fixtureFrom: number; fixtureTo: number } {
  const defaultFrom = currentGameweekId ?? MIN_GW;
  const fixtureFrom = clamp(
    parseInt(params.get("fixtureFrom") ?? String(defaultFrom), 10) || defaultFrom,
    MIN_GW,
    MAX_GW
  );
  const fixtureTo = clamp(
    parseInt(params.get("fixtureTo") ?? String(fixtureFrom + DEFAULT_WINDOW - 1), 10) ||
      fixtureFrom + DEFAULT_WINDOW - 1,
    fixtureFrom,
    MAX_GW
  );
  return { fixtureFrom, fixtureTo };
}
