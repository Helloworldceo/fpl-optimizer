import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeLeaderboard } from "@/lib/leaderboard";
import { CopyCodeButton } from "./CopyCodeButton";

export default async function LeagueDetailPage(props: PageProps<"/leagues/[id]">) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const league = await prisma.league.findUnique({
    where: { id },
    include: { members: { include: { user: { select: { id: true, name: true } } }, orderBy: { joinedAt: "asc" } } },
  });
  if (!league) notFound();

  const isMember = league.members.some((m) => m.userId === session.user.id);
  if (!isMember) redirect("/leagues");

  const memberIds = league.members.map((m) => m.userId);
  const leaderboard = await computeLeaderboard(memberIds);
  const leaderboardByUserId = new Map(leaderboard.map((e) => [e.userId, e]));

  const rankedMembers = [...league.members].sort((a, b) => {
    const aPoints = leaderboardByUserId.get(a.userId)?.points ?? 0;
    const bPoints = leaderboardByUserId.get(b.userId)?.points ?? 0;
    return bPoints - aPoints;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full">
      <Link href="/leagues" className="text-sm text-neutral-400 dark:text-neutral-500 hover:underline mb-4 inline-block">
        ← All leagues
      </Link>

      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-xl font-bold">{league.name}</h1>
        <CopyCodeButton code={league.code} />
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        {league.members.length} member{league.members.length === 1 ? "" : "s"} — share the code
        above to invite more.
      </p>

      <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900">
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold text-right">Points</th>
              <th className="px-3 py-2 font-semibold text-right">Exact</th>
              <th className="px-3 py-2 font-semibold text-right">Scored</th>
            </tr>
          </thead>
          <tbody>
            {rankedMembers.map((m, i) => {
              const entry = leaderboardByUserId.get(m.userId);
              return (
                <tr key={m.userId} className="border-t border-black/5 dark:border-white/10">
                  <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">
                    {m.user.name}
                    {m.userId === league.ownerId && (
                      <span className="ml-1.5 text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                        Owner
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{entry?.points ?? 0}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                    {entry?.exactScores ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                    {entry?.predictionsScored ?? 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
