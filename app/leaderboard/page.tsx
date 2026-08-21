import { LeaderboardTable } from "./LeaderboardTable";

export default function LeaderboardPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full">
      <h1 className="text-xl font-bold mb-1">Leaderboard</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        3 points for an exact score, 1 for correctly picking the result, across every scored
        prediction.
      </p>
      <LeaderboardTable />
    </div>
  );
}
