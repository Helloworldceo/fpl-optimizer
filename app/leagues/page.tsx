import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateLeagueForm } from "./CreateLeagueForm";
import { JoinLeagueForm } from "./JoinLeagueForm";

export default async function LeaguesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await prisma.leagueMembership.findMany({
    where: { userId: session.user.id },
    include: { league: { include: { _count: { select: { members: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full">
      <h1 className="text-xl font-bold mb-1">Leagues</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        Create a private league and share the code, or join one you&apos;ve been invited to — the
        leaderboard inside is scoped to just that league&apos;s members.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <CreateLeagueForm />
        <JoinLeagueForm />
      </div>

      <h2 className="font-semibold text-sm mb-3">My leagues</h2>
      {memberships.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          You&apos;re not in any leagues yet.
        </p>
      ) : (
        <div className="space-y-2">
          {memberships.map((m) => (
            <Link
              key={m.league.id}
              href={`/leagues/${m.league.id}`}
              className="flex items-center justify-between rounded-lg border border-black/5 dark:border-white/10 px-4 py-3 hover:border-emerald-500/40 transition-colors"
            >
              <span className="font-medium text-sm">{m.league.name}</span>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                {m.league._count.members} member{m.league._count.members === 1 ? "" : "s"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
