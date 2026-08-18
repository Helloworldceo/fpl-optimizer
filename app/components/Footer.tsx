export function Footer() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10 mt-16">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
        <p className="text-center sm:text-left">
          Not affiliated with the Premier League or Fantasy Premier League. Player
          data comes from the official FPL API, fetched live on every build.
          <br className="hidden sm:block" />
          Questions? Message{" "}
          <a
            href="https://www.instagram.com/amberlane_st"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white underline underline-offset-2 transition-colors"
          >
            @amberlane_st
          </a>{" "}
          on Instagram.
        </p>
        <div className="flex items-center gap-4 shrink-0">
          <a
            href="https://github.com/Helloworldceo/fpl-optimizer"
            target="_blank"
            rel="noreferrer"
            className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            GitHub
          </a>
          <a href="#top" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
