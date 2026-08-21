"use client";

import { useState } from "react";
import { teamCrestUrl } from "@/lib/images";

export function TeamCrest({ teamCode, size = 16 }: { teamCode: number; size?: number }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (failed || !teamCode) return null;
  return (
    <img
      src={teamCrestUrl(teamCode)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
      className="inline-block shrink-0 object-contain transition-opacity duration-200"
      style={{ width: size, height: size, opacity: loaded ? 1 : 0 }}
    />
  );
}
