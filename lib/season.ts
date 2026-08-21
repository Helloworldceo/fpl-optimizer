// Identifies which season a table prediction belongs to, so a fresh season
// doesn't inherit the previous one's predictions. Bump this each summer —
// there's no reliable "current season" field on FPL's API to derive it from
// automatically.
export const CURRENT_SEASON = "2026-27";
