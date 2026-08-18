const STEPS = [
  {
    title: "Set your constraints",
    body: "Budget, max players per club, and how many gameweeks ahead to weigh fixture difficulty.",
  },
  {
    title: "Pin your must-haves",
    body: "Optionally force specific players in or out — everything else is still filled by the optimizer, not randomly.",
  },
  {
    title: "Build squads",
    body: "Solves an integer linear program against live FPL data to maximize squad value under your constraints.",
  },
  {
    title: "Compare & pick",
    body: "Browse up to 10 distinct options, see cost/points/captain at a glance, and view each on a pitch.",
  },
];

export function Guide() {
  return (
    <section id="how-it-works" className="scroll-mt-20 mb-10">
      <h2 className="text-lg font-semibold mb-4">How it works</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((s, i) => (
          <div key={i} className="rounded-lg border border-black/10 dark:border-white/10 p-4">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mb-2.5">
              {i + 1}
            </div>
            <div className="font-medium text-sm mb-1">{s.title}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{s.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
