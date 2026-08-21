"use client";

import { useState } from "react";
import { Tabs } from "@/app/components/Tabs";
import { PredictClient } from "./PredictClient";
import { TablePredictionClient } from "./TablePredictionClient";

const TABS = [
  { id: "gameweek", label: "This Gameweek" },
  { id: "table", label: "Final Table" },
];

export function PredictTabs() {
  const [tab, setTab] = useState("gameweek");

  return (
    <div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === "gameweek" ? (
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            Predict before kickoff — a prediction locks the moment that specific match kicks off.
            3 points for an exact score, 1 for correctly picking the result, 0 otherwise.
          </p>
          <PredictClient />
        </div>
      ) : (
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            Rank all 20 teams from 1st to last for the season. Locks the moment Gameweek 1 kicks
            off. Scored live against the current table all season — 20 points per team for an
            exact position, minus 1 for every place off.
          </p>
          <TablePredictionClient />
        </div>
      )}
    </div>
  );
}
