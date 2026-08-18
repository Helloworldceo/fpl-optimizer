function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <div className="flex justify-between items-baseline">
        <span className="text-neutral-600 dark:text-neutral-300">{label}</span>
        <span className="font-semibold tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-600"
      />
    </label>
  );
}

export type OptimizeBy = "value" | "ownership";

export interface ControlsState {
  budget: number;
  maxPerTeam: number;
  fixtureFrom: number;
  fixtureTo: number;
  numOptions: number;
  minDiff: number;
  optimizeBy: OptimizeBy;
}

const GAMEWEEKS = Array.from({ length: 38 }, (_, i) => i + 1);

export function Controls({
  state,
  onChange,
  onSubmit,
  loading,
}: {
  state: ControlsState;
  onChange: (patch: Partial<ControlsState>) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-5 mb-8">
      <div className="mb-5">
        <span className="text-sm text-neutral-600 dark:text-neutral-300 block mb-1.5">
          Optimize by
        </span>
        <div className="flex w-full sm:inline-flex sm:w-auto rounded-lg border border-black/15 dark:border-white/15 p-0.5 text-sm">
          {(
            [
              { value: "value" as const, label: "Value", hint: "Best expected points for the budget" },
              { value: "ownership" as const, label: "Ownership", hint: "Most-picked squad by FPL managers (the template team)" },
            ]
          ).map((opt) => (
            <button
              key={opt.value}
              title={opt.hint}
              onClick={() => onChange({ optimizeBy: opt.value })}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition-colors ${
                state.optimizeBy === opt.value
                  ? "bg-blue-600 text-white"
                  : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-5">
        <SliderField
          label="Budget"
          value={state.budget}
          min={60}
          max={100}
          step={0.5}
          unit="m"
          onChange={(v) => onChange({ budget: v })}
        />
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-neutral-600 dark:text-neutral-300">Max players/club</span>
          <select
            value={state.maxPerTeam}
            onChange={(e) => onChange({ maxPerTeam: parseInt(e.target.value, 10) })}
            className="rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5"
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-neutral-600 dark:text-neutral-300">Fixture difficulty window</span>
          <div className="flex items-center gap-1.5">
            <select
              value={state.fixtureFrom}
              onChange={(e) => {
                const from = parseInt(e.target.value, 10);
                onChange({ fixtureFrom: from, fixtureTo: Math.max(from, state.fixtureTo) });
              }}
              className="rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5 w-full"
            >
              {GAMEWEEKS.map((gw) => (
                <option key={gw} value={gw}>
                  GW{gw}
                </option>
              ))}
            </select>
            <span className="text-neutral-400 shrink-0">to</span>
            <select
              value={state.fixtureTo}
              onChange={(e) => {
                const to = parseInt(e.target.value, 10);
                onChange({ fixtureTo: to, fixtureFrom: Math.min(to, state.fixtureFrom) });
              }}
              className="rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5 w-full"
            >
              {GAMEWEEKS.map((gw) => (
                <option key={gw} value={gw}>
                  GW{gw}
                </option>
              ))}
            </select>
          </div>
        </div>
        <SliderField
          label="Squad options"
          value={state.numOptions}
          min={1}
          max={10}
          onChange={(v) => onChange({ numOptions: v })}
        />
        <SliderField
          label="Min. players different"
          value={state.minDiff}
          min={1}
          max={10}
          onChange={(v) => onChange({ minDiff: v })}
        />
      </div>
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full mt-5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 transition-colors"
      >
        {loading ? "Building squads..." : "Build squads"}
      </button>
    </div>
  );
}
