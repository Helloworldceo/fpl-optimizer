export function Header() {
  return (
    <header
      id="top"
      className="sticky top-0 z-20 border-b border-black/10 dark:border-white/10 bg-white/85 dark:bg-neutral-950/85 backdrop-blur"
    >
      <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-base shrink-0">
            ⚽
          </span>
          <span className="font-bold leading-tight">FPL Squad Optimizer</span>
        </a>
        <nav className="flex items-center gap-4 text-sm">
          <a
            href="#how-it-works"
            className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors hidden sm:inline"
          >
            How it works
          </a>
          <a
            href="https://github.com/Helloworldceo/fpl-optimizer"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
