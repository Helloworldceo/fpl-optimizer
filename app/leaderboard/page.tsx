import { LeaderboardTabs } from "./LeaderboardTabs";

export default function LeaderboardPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full">
      <h1 className="text-xl font-bold mb-1">Leaderboard</h1>
      <LeaderboardTabs />
    </div>
  );
}
