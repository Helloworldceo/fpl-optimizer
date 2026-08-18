"use client";

import { useState } from "react";
import { playerPhotoUrl } from "@/lib/images";
import { TeamCrest } from "./TeamCrest";

interface FeaturedPlayer {
  name: string;
  code: number;
  teamCode: number;
}

// A handful of recognizable current stars, spread across different clubs.
// Purely decorative — not tied to any live squad data.
const FEATURED_PLAYERS: FeaturedPlayer[] = [
  { name: "Haaland", code: 223094, teamCode: 43 }, // Man City
  { name: "Saka", code: 223340, teamCode: 3 }, // Arsenal
  { name: "B.Fernandes", code: 141746, teamCode: 1 }, // Man Utd
  { name: "Palmer", code: 244851, teamCode: 8 }, // Chelsea
  { name: "Isak", code: 219168, teamCode: 14 }, // Liverpool
  { name: "Watkins", code: 178301, teamCode: 7 }, // Aston Villa
];

function FeaturedPlayerCard({ player }: { player: FeaturedPlayer }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0 w-20 sm:w-24">
      <div className="relative">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ring-black/5 dark:ring-white/10 shadow-md bg-neutral-100 dark:bg-neutral-800">
          {!failed ? (
            <img
              src={playerPhotoUrl(player.code)}
              alt={player.name}
              loading="lazy"
              onError={() => setFailed(true)}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-xs font-bold">
              {player.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <span className="absolute -bottom-1 -right-1 rounded-full bg-white dark:bg-neutral-950 p-0.5 shadow ring-1 ring-black/5 dark:ring-white/10">
          <TeamCrest teamCode={player.teamCode} size={18} />
        </span>
      </div>
      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 text-center truncate w-full">
        {player.name}
      </span>
    </div>
  );
}

export function PlayerBanner() {
  return (
    <div className="flex justify-center flex-wrap gap-x-5 gap-y-4 sm:gap-x-7 mt-7">
      {FEATURED_PLAYERS.map((p) => (
        <FeaturedPlayerCard key={p.code} player={p} />
      ))}
    </div>
  );
}
