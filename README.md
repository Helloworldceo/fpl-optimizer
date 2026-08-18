# FPL Squad Optimizer (Web)

A Next.js port of the FPL squad optimizer — a shareable, browser-based GUI
deployable to Vercel. Builds the highest-value Fantasy Premier League squad
within budget using live data from the official FPL API, and generates
multiple distinct squad options to choose from.

This mirrors the original Python/Streamlit tool (`../fpl-optimizer`) but with
the scoring + squad optimization ported to TypeScript (`javascript-lp-solver`
instead of PuLP/CBC), since Vercel's serverless functions can't run a
long-lived Python/Streamlit process or spawn the CBC solver binary.

## How it works

- `app/api/squads/route.ts` — a serverless API route that, per request:
  1. Fetches live player + fixture data from the FPL API (`lib/fplData.ts`).
  2. Scores every player: `0.5 × points_per_game + 0.3 × ep_next + 0.2 × fixture_score`.
     `points_per_game` is shrunk toward its position's average first, in
     proportion to how few minutes the player has (a full season of minutes
     = full trust, 0 minutes = fully the positional average) — so a new
     signing or fringe player with an optimistic `ep_next` and no track
     record doesn't get treated as equally reliable as a proven starter.
     Each player's `confidence` (0–1) is exposed in the API/UI.
  3. Solves an integer linear program (`lib/optimizer.ts`, via
     `javascript-lp-solver`) to pick the optimal 15-man squad within budget,
     formation, and max-per-club constraints — optionally forcing specific
     players in (`mustInclude`) or out (`mustExclude`). The objective is
     swappable (`optimizeBy=value|ownership`): "value" maximizes the score
     above; "ownership" maximizes `selectedByPercent` instead, building the
     squad most FPL managers are actually running (the "template" team) —
     same constraints, same ILP, just a different field being optimized.
     Each squad option reports `avgOwnership` either way, so you can see
     how differential or template a squad is regardless of which mode
     built it.
  4. Repeats with "no-good cuts" to generate N distinct squad options that
     each differ by a minimum number of players.
  5. Solves a second small ILP per squad to pick the best starting XI, then
     picks captain/vice-captain by a separate near-term-ceiling score
     (`0.3 × points_per_game + 0.7 × ep_next`) rather than the squad-selection
     score, since captaincy is a single-gameweek, points-doubled bet.
  6. Returns the current/next gameweek (id, name, deadline) alongside the
     squads, read fresh from the FPL API on every request — so the UI always
     reflects whichever gameweek is live when you hit "Build squads," with
     no separate update step needed as the season progresses.
  Each player also carries `selectedByPercent` (FPL's live "% of managers
  who own this player" ownership stat) — shown in the must-include/exclude
  search results and the per-squad details table, to help judge template
  vs. differential picks.
- `app/page.tsx` — client UI: a welcoming hero + "how it works" guide,
  sliders for budget/club/fixture-lookahead/options, must-include/exclude
  player search pickers, a comparison grid across squad options, and a
  pitch view of the starting XI.
- `app/api/standings/route.ts` — the real Premier League table, straight
  from FPL's own `teams` data (`played`/`win`/`draw`/`loss`/`points`/
  `position`) — no separate football-data source needed. Populates itself
  automatically as matches are played; shows all-zero rows before a
  season/gameweek has kicked off.
- `app/api/gameweeks/route.ts` — the full list of gameweeks with their
  `finished` status, used to drive the Team of the Week gameweek picker.
- `app/api/team-of-the-week/route.ts?event=<id>` — for a *finished*
  gameweek, fetches that event's live actual points
  (`event/{id}/live/`) for every player (unfiltered by current
  availability — a since-injured player still shows up in a week they
  played), then reuses the same best-XI ILP (`selectBestXi`) to pick the
  highest-scoring valid-formation XI by real points, i.e. FPL's "Team of
  the Week." Returns 422 if the requested gameweek hasn't finished yet.
- `app/api/transfer-targets/route.ts` — a "who to sign this week" leaderboard:
  the same scored player pool as the squad builder, sorted by score and
  optionally filtered by position/max cost, with `costChangeEvent`
  (whether a player's price rose/fell this gameweek) surfaced as a
  📈/📉 badge. Not tied to any particular squad — just this week's best
  value by the numbers.
- `app/layout.tsx` — sticky header + footer site chrome.
- `app/icon.tsx` / `app/apple-icon.tsx` / `app/opengraph-image.tsx` —
  generated favicon and social-preview card (via `next/og`), so links
  shared in chats/group texts render a proper card instead of a bare URL.

## Score model limitations

The scoring is a simple weighted blend of publicly available season/model
stats — not a trained predictive model. It doesn't yet know about ownership
(differentials vs. template), price-change timing, or a variance-aware
"ceiling" ranking outside of captaincy. Treat it as a strong, fast starting
point to sanity-check and adjust from — not an autopilot.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploying to Vercel

No environment variables or secrets are required — the FPL API is public.
Optionally set `NEXT_PUBLIC_SITE_URL` to your deployed domain (e.g.
`https://fpl-optimizer.vercel.app`) so the social-preview card resolves an
absolute image URL; without it, sharing still works but some link
unfurlers may not render the image.

**Option A — Vercel CLI:**
```bash
npx vercel        # first deploy, follow the prompts to link/create a project
npx vercel --prod # promote to production URL
```

**Option B — Git integration (recommended for sharing long-term):**
1. Push this repo to GitHub.
2. Go to https://vercel.com/new and import the repo.
3. Vercel auto-detects Next.js — no config needed. Deploy.
4. Share the resulting `*.vercel.app` URL with your friends.

Every push to the connected branch will auto-deploy a new version.
