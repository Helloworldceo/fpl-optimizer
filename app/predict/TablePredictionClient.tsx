"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { TablePredictionsResponse } from "@/lib/apiTypes";
import { submitTablePrediction, type TablePredictionState } from "@/lib/actions/tablePredictions";
import { TeamCrest } from "@/app/components/TeamCrest";

const initialState: TablePredictionState = {};

export function TablePredictionClient() {
  const [data, setData] = useState<TablePredictionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [state, formAction, pending] = useActionState(submitTablePrediction, initialState);

  // Drag-to-reorder state. dragIndex is the row currently being dragged,
  // used only for the shadow/z-index styling — it changes once per row
  // crossed, not per pixel. The live pointer-following offset is applied
  // straight to the DOM via draggedElRef instead of React state: pointermove
  // can fire dozens of times a second, and routing that through setState
  // re-rendered all 20 rows on every single pixel of movement, which is what
  // was actually causing the lag.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const draggedElRef = useRef<HTMLLIElement | null>(null);
  const rowHeightRef = useRef(44);
  const pointerStartYRef = useRef(0);

  useEffect(() => {
    fetch("/api/table-predictions")
      .then((r) => r.json())
      .then((json: TablePredictionsResponse & { error?: string }) => {
        if (json.error) throw new Error(json.error);
        setData(json);
        if (json.myPrediction) {
          const byPosition = [...json.myPrediction].sort((a, b) => a.position - b.position);
          setOrder(byPosition.map((p) => p.teamId));
        } else if (!json.locked) {
          setOrder(json.teams.map((t) => t.teamId));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
  }, []);

  function move(index: number, direction: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function onHandlePointerDown(e: React.PointerEvent<HTMLButtonElement>, index: number) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerStartYRef.current = e.clientY;
    const li = e.currentTarget.closest("li");
    draggedElRef.current = li;
    rowHeightRef.current = li?.getBoundingClientRect().height ?? 44;
    setDragIndex(index);
  }

  function onHandlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (dragIndex === null || !draggedElRef.current) return;
    const delta = e.clientY - pointerStartYRef.current;
    draggedElRef.current.style.transform = `translateY(${delta}px)`;

    const rowsToMove = Math.round(delta / rowHeightRef.current);
    if (rowsToMove === 0) return;
    const target = Math.min(order.length - 1, Math.max(0, dragIndex + rowsToMove));
    if (target === dragIndex) return;

    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(target, 0, moved);
      return next;
    });
    setDragIndex(target);
    pointerStartYRef.current = e.clientY;
    draggedElRef.current.style.transform = "translateY(0px)";
  }

  function onHandlePointerUp() {
    if (draggedElRef.current) draggedElRef.current.style.transform = "";
    draggedElRef.current = null;
    setDragIndex(null);
  }

  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!data) return <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>;

  const teamsById = new Map(data.teams.map((t) => [t.teamId, t]));

  if (data.locked) {
    if (order.length === 0) {
      return (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          You didn&apos;t lock in a table prediction before the season kicked off.
        </p>
      );
    }
    return (
      <div>
        {data.liveScore !== null && (
          <p className="text-sm mb-4">
            Your live score: <span className="font-semibold">{data.liveScore}</span> / 400
          </p>
        )}
        <ol className="space-y-1.5">
          {order.map((teamId, i) => {
            const team = teamsById.get(teamId);
            if (!team) return null;
            return (
              <li
                key={teamId}
                className="flex items-center gap-2.5 rounded-lg border border-black/5 dark:border-white/10 px-3 py-2"
              >
                <span className="w-6 text-sm text-neutral-400 dark:text-neutral-500 tabular-nums">{i + 1}</span>
                <TeamCrest teamCode={team.teamCode} size={20} />
                <span className="text-sm">{team.name}</span>
                <span className="ml-auto text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
                  currently {team.position}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="order" value={order.join(",")} />
      <ol className="space-y-1.5">
        {order.map((teamId, i) => {
          const team = teamsById.get(teamId);
          if (!team) return null;
          const dragging = i === dragIndex;
          return (
            <li
              key={teamId}
              className={`flex items-center gap-2.5 rounded-lg border border-black/5 dark:border-white/10 px-3 py-2 bg-white dark:bg-neutral-950 ${
                dragging ? "relative z-10 shadow-lg" : ""
              }`}
            >
              <button
                type="button"
                onPointerDown={(e) => onHandlePointerDown(e, i)}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
                onPointerCancel={onHandlePointerUp}
                aria-label={`Drag ${team.name} to reorder`}
                style={{ touchAction: "none" }}
                className="shrink-0 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing select-none px-0.5"
              >
                ⠿
              </button>
              <span className="w-6 text-sm text-neutral-400 dark:text-neutral-500 tabular-nums">{i + 1}</span>
              <TeamCrest teamCode={team.teamCode} size={20} />
              <span className="text-sm flex-1">{team.name}</span>
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${team.name} up`}
                className="w-6 h-6 rounded text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-20 transition-colors"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                aria-label={`Move ${team.name} down`}
                className="w-6 h-6 rounded text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-20 transition-colors"
              >
                ▼
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 transition-colors"
        >
          {pending ? "Saving..." : data.myPrediction ? "Update prediction" : "Lock in prediction"}
        </button>
        {state.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}
        {state.success && <p className="text-xs text-emerald-600 dark:text-emerald-400">Saved.</p>}
      </div>
    </form>
  );
}
