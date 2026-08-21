import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const predictionSchema = z.object({
  fixtureId: z.coerce.number().int().positive(),
  predictedHome: z.coerce.number().int().min(0).max(20),
  predictedAway: z.coerce.number().int().min(0).max(20),
});
