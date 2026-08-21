import Link from "next/link";
import { auth, signOut } from "@/auth";
import { ThemeToggle } from "./ThemeToggle";
import { ZoomControl } from "./ZoomControl";

function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}

export async function Header() {
  const session = await auth();
  const linkClass =
    "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors";

  return (
    <header
      id="top"
      className="sticky top-0 z-20 border-b border-black/10 dark:border-white/10 bg-white/85 dark:bg-neutral-950/85 backdrop-blur"
    >
      <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <Link href="/#top" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-base shrink-0">
            ⚽
          </span>
          <span className="font-bold leading-tight">FPL Squad Optimizer</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/#how-it-works" className={`${linkClass} hidden sm:inline`}>
            How it works
          </Link>
          <Link href="/predict" className={linkClass}>
            Predict
          </Link>
          <Link href="/leaderboard" className={linkClass}>
            Leaderboard
          </Link>
          <a
            href="https://github.com/Helloworldceo/fpl-optimizer"
            target="_blank"
            rel="noreferrer"
            className={`${linkClass} hidden sm:inline`}
          >
            GitHub
          </a>
          {session?.user ? (
            <>
              <Link href="/leagues" className={linkClass}>
                Leagues
              </Link>
              <Link href="/profile" className={linkClass}>
                My Profile
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className={linkClass}>
              Log in
            </Link>
          )}
          <ZoomControl />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
