"use client";

import { useState } from "react";

const LEAGUE_CODE = "43lgb3";
const LEAGUE_URL = "https://fantasy.premierleague.com/leagues/auto-join/43lgb3";

export function MiniLeagueBanner() {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(LEAGUE_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the code is still visible to copy by hand.
    }
  }

  return (
    <section className="rounded-xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 p-4 mb-8 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <div className="font-medium text-sm flex items-center gap-1.5">🏆 Join our FPL mini-league</div>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
          Open to anyone using this tool — come compete for the season, winner gets rewarded.
          Use the link, or enter the code in the FPL app.
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <code className="text-xs bg-white dark:bg-neutral-900 border border-amber-300/60 dark:border-amber-700/50 rounded px-2 py-1 font-medium">
            {LEAGUE_CODE}
          </code>
          <button
            onClick={copyCode}
            className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
          >
            {copied ? "Copied!" : "Copy code"}
          </button>
        </div>
      </div>
      <a
        href={LEAGUE_URL}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 transition-colors"
      >
        Join League
      </a>
    </section>
  );
}
