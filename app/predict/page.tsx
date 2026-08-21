import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PredictClient } from "./PredictClient";

export default async function PredictPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full">
      <h1 className="text-xl font-bold mb-1">Predict the scores</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        Lock in your predicted scoreline for each match. A prediction locks the moment that
        specific match kicks off — 3 points for an exact score, 1 for correctly picking the
        result, 0 otherwise.
      </p>
      <PredictClient />
    </div>
  );
}
