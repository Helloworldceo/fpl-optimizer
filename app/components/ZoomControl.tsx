"use client";

import { useEffect, useState } from "react";

const MIN_ZOOM = 80;
const MAX_ZOOM = 150;
const STEP = 10;
const DEFAULT_ZOOM = 100;

function applyZoom(value: number) {
  document.documentElement.style.zoom = `${value}%`;
}

export function ZoomControl() {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    function syncFromStorage() {
      const stored = parseInt(localStorage.getItem("zoom") ?? "", 10);
      if (Number.isFinite(stored) && stored >= MIN_ZOOM && stored <= MAX_ZOOM) {
        setZoom(stored);
      }
    }
    syncFromStorage();
  }, []);

  function update(next: number) {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    applyZoom(clamped);
    try {
      localStorage.setItem("zoom", String(clamped));
    } catch {
      // Storage unavailable (private browsing, etc.) — zoom still applies
      // for this page load, it just won't persist across visits.
    }
    setZoom(clamped);
  }

  return (
    <div className="hidden sm:flex items-center gap-0.5 text-neutral-600 dark:text-neutral-300">
      <button
        onClick={() => update(zoom - STEP)}
        disabled={zoom <= MIN_ZOOM}
        aria-label="Zoom out"
        title="Zoom out"
        className="hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-neutral-600 dark:disabled:hover:text-neutral-300 transition-colors w-5 text-center"
      >
        −
      </button>
      <button
        onClick={() => update(DEFAULT_ZOOM)}
        aria-label="Reset zoom"
        title="Reset zoom"
        className="text-xs tabular-nums w-9 text-center hover:text-neutral-900 dark:hover:text-white transition-colors"
      >
        {zoom}%
      </button>
      <button
        onClick={() => update(zoom + STEP)}
        disabled={zoom >= MAX_ZOOM}
        aria-label="Zoom in"
        title="Zoom in"
        className="hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-neutral-600 dark:disabled:hover:text-neutral-300 transition-colors w-5 text-center"
      >
        +
      </button>
    </div>
  );
}
