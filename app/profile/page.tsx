import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full">
      <h1 className="text-xl font-bold mb-1">My Profile</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        Every prediction you&apos;ve locked in, and how it scored once the match finished.
      </p>
      <ProfileClient />
    </div>
  );
}
