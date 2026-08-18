const FEATURES = [
  { icon: "📡", label: "Live FPL data" },
  { icon: "🧮", label: "Optimized by ILP, not guesswork" },
  { icon: "🎯", label: "Pin your must-have picks" },
];

export function Hero() {
  return (
    <section className="relative pt-10 pb-8 sm:pt-14 sm:pb-10 text-center overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-64 opacity-[0.08] dark:opacity-[0.14] pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 100% at 50% 0%, #22c55e, transparent 70%)" }}
      />
      <div className="text-4xl mb-4">⚽</div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">FPL Squad Optimizer</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mt-3 max-w-xl mx-auto">
        Build the highest-value Fantasy Premier League squad your budget allows —
        powered by live data and a real optimizer, not a hunch.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        {FEATURES.map((f) => (
          <span
            key={f.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300"
          >
            <span>{f.icon}</span>
            {f.label}
          </span>
        ))}
      </div>
    </section>
  );
}
