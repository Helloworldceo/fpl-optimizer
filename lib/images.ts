// Official Premier League media CDN. Both patterns are keyed off the numeric
// `code` field FPL's own API returns per player/team — not a third-party or
// scraped source.
export function playerPhotoUrl(code: number): string {
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`;
}

export function teamCrestUrl(teamCode: number): string {
  return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`;
}
