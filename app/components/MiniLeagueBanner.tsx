export function MiniLeagueBanner() {
  return (
    <section className="rounded-xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 p-4 mb-8 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <div className="font-medium text-sm flex items-center gap-1.5">🏆 Join our FPL mini-league</div>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
          Open to anyone using this tool — come compete for the season, winner gets rewarded.
        </p>
      </div>
      <a
        href="https://fantasy.premierleague.com/leagues/auto-join/43lgb3"
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 transition-colors"
      >
        Join League
      </a>
    </section>
  );
}
