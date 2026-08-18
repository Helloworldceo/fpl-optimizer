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
  3. Solves an integer linear program (`lib/optimizer.ts`, via
     `javascript-lp-solver`) to pick the optimal 15-man squad within budget,
     formation, and max-per-club constraints.
  4. Repeats with "no-good cuts" to generate N distinct squad options that
     each differ by a minimum number of players.
  5. Solves a second small ILP per squad to pick the best starting XI +
     captain/vice-captain.
- `app/page.tsx` — client UI: budget/club/fixture-lookahead controls, tabs
  for each squad option, player tables with FDR and captain/vice markers.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploying to Vercel

No environment variables or secrets are required — the FPL API is public.

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
