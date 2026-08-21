"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { predictionSchema } from "@/lib/validations";
import { fetchFixturesForGameweek } from "@/lib/fplData";

export type PredictionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function submitPrediction(
  eventId: number,
  _prevState: PredictionState,
  formData: FormData
): Promise<PredictionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be logged in to predict." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = predictionSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { fixtureId, predictedHome, predictedAway } = parsed.data;

  // Re-fetch the fixture's real kickoff time from FPL rather than trusting
  // anything the client sent — a prediction locks the moment its own match
  // kicks off, not the whole gameweek, and kickoff times do get rescheduled.
  const fixtures = await fetchFixturesForGameweek(eventId);
  const fixture = fixtures.find((f) => f.fixtureId === fixtureId);
  if (!fixture) {
    return { error: "Unknown fixture." };
  }
  if (fixture.finished || (fixture.kickoffTime && new Date(fixture.kickoffTime) <= new Date())) {
    return { error: "This match has already kicked off — predictions are locked." };
  }

  await prisma.prediction.upsert({
    where: { userId_fixtureId: { userId: session.user.id, fixtureId } },
    update: { predictedHome, predictedAway },
    create: { userId: session.user.id, fixtureId, eventId, predictedHome, predictedAway },
  });

  revalidatePath("/predict");
  revalidatePath("/leaderboard");
  return { success: true };
}
