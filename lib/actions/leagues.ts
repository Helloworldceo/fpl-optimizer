"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L — easy to read aloud

function generateCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

async function uniqueLeagueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const existing = await prisma.league.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique league code — try again.");
}

export type LeagueActionState = { error?: string };

export async function createLeague(_prevState: LeagueActionState, formData: FormData): Promise<LeagueActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be logged in to create a league." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 3 || name.length > 60) {
    return { error: "League name must be 3-60 characters." };
  }

  const code = await uniqueLeagueCode();

  const league = await prisma.league.create({
    data: {
      name,
      code,
      ownerId: session.user.id,
      members: { create: { userId: session.user.id } },
    },
  });

  revalidatePath("/leagues");
  redirect(`/leagues/${league.id}`);
}

export async function joinLeague(_prevState: LeagueActionState, formData: FormData): Promise<LeagueActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be logged in to join a league." };
  }

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  if (!code) {
    return { error: "Enter a league code." };
  }

  const league = await prisma.league.findUnique({ where: { code } });
  if (!league) {
    return { error: "No league found with that code." };
  }

  await prisma.leagueMembership.upsert({
    where: { leagueId_userId: { leagueId: league.id, userId: session.user.id } },
    update: {},
    create: { leagueId: league.id, userId: session.user.id },
  });

  revalidatePath("/leagues");
  redirect(`/leagues/${league.id}`);
}
