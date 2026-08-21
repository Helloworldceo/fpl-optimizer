"use client";

import { useState } from "react";
import { Tabs } from "@/app/components/Tabs";
import { LeaderboardTable } from "./LeaderboardTable";
import { TableLeaderboardTable } from "./TableLeaderboardTable";

const TABS = [
  { id: "gameweek", label: "Score Predictor" },
  { id: "table", label: "Final Table" },
];

export function LeaderboardTabs() {
  const [tab, setTab] = useState("gameweek");

  return (
    <div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === "gameweek" ? (
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            3 points for an exact score, 1 for correctly picking the result, across every scored
            prediction.
          </p>
          <LeaderboardTable />
        </div>
      ) : (
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            Predicted final league position vs. the current live table — 20 points per team for
            an exact position, minus 1 for every place off.
          </p>
          <TableLeaderboardTable />
        </div>
      )}
    </div>
  );
}
