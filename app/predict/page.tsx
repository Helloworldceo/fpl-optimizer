import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PredictTabs } from "./PredictTabs";

export default async function PredictPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full">
      <h1 className="text-xl font-bold mb-1">Predict the scores</h1>
      <PredictTabs />
    </div>
  );
}
