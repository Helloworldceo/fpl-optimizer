"use client";

import { useState } from "react";

const DRAFT_MESSAGE = "Hey! I tried out the FPL Squad Optimizer and had a question about ";
const INSTAGRAM_URL = "https://www.instagram.com/amberlane_st";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.3" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.6" cy="6.4" r="1.15" fill="currentColor" />
    </svg>
  );
}

export function Contact() {
  const [copied, setCopied] = useState(false);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(DRAFT_MESSAGE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (unsupported browser / no permission) — the
      // draft text is still visible on screen for the user to select manually.
    }
  }

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 p-5 mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="font-medium text-sm">Have a question or feedback?</div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Copy the draft message, then send it over on Instagram.
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <code className="text-xs bg-neutral-100 dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded px-2 py-1.5 text-neutral-600 dark:text-neutral-300 max-w-full">
            {DRAFT_MESSAGE}
          </code>
          <button
            onClick={copyMessage}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-white text-sm font-medium px-4 py-2.5 shrink-0 hover:opacity-90 transition-opacity"
      >
        <InstagramIcon className="w-4 h-4" />
        Message @amberlane_st
      </a>
    </section>
  );
}
