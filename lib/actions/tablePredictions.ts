"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchGameweeks, fetchStandings } from "@/lib/fplData";
import { CURRENT_SEASON } from "@/lib/season";

export type TablePredictionState = {
  error?: string;
  success?: boolean;
};

export async function submitTablePrediction(
  _prevState: TablePredictionState,
  formData: FormData
): Promise<TablePredictionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be logged in to predict." };
  }
  const userId = session.user.id;

  const orderRaw = formData.get("order");
  if (typeof orderRaw !== "string" || orderRaw.length === 0) {
    return { error: "Missing prediction order." };
  }
  const teamIds = orderRaw.split(",").map((s) => parseInt(s, 10));
  if (teamIds.length !== 20 || teamIds.some((id) => !Number.isInteger(id))) {
    return { error: "A prediction must rank all 20 teams." };
  }
  if (new Set(teamIds).size !== 20) {
    return { error: "Each team can only appear once." };
  }

  // Re-check the real teams and lock deadline live, never trust the client.
  const [standings, gameweeks] = await Promise.all([fetchStandings(), fetchGameweeks()]);
  const validTeamIds = new Set(standings.map((t) => t.teamId));
  if (teamIds.some((id) => !validTeamIds.has(id))) {
    return { error: "Unrecognized team in prediction." };
  }

  const gw1 = gameweeks.find((g) => g.id === 1);
  if (gw1 && new Date(gw1.deadlineTime) <= new Date()) {
    return { error: "The season has already kicked off — table predictions are locked." };
  }

  await prisma.$transaction([
    prisma.tablePrediction.deleteMany({ where: { userId, season: CURRENT_SEASON } }),
    prisma.tablePrediction.createMany({
      data: teamIds.map((teamId, index) => ({
        userId,
        season: CURRENT_SEASON,
        teamId,
        position: index + 1,
      })),
    }),
  ]);

  revalidatePath("/predict");
  return { success: true };
}
