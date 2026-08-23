"use client";

import { useMemo } from "react";
import type { ArticleListItem } from "@/types";

const CELL = 13;
const GAP = 3;
const WEEKS = 53;

const LEVEL_VARS = ["var(--heat-0)", "var(--heat-1)", "var(--heat-2)", "var(--heat-3)", "var(--heat-4)"];

function levelFor(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export default function CalendarHeatmap({ articles }: { articles: ArticleListItem[] }) {
  const { weeks, monthLabels, totalDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (WEEKS * 7 - 1));

    const countByDate = new Map<string, number>();
    const timesByDate = new Map<string, Date[]>();
    for (const a of articles) {
      const d = new Date(a.createdAt);
      const key = d.toDateString();
      countByDate.set(key, (countByDate.get(key) || 0) + 1);
      const arr = timesByDate.get(key) || [];
      arr.push(d);
      timesByDate.set(key, arr);
    }

    const weeks: { date: Date | null; count: number; times: Date[] }[][] = [];
    const cursor = new Date(startDate);
    let totalDays = 0;

    for (let w = 0; w < WEEKS; w++) {
      const week: { date: Date | null; count: number; times: Date[] }[] = [];
      for (let d = 0; d < 7; d++) {
        if (cursor > today) {
          week.push({ date: null, count: 0, times: [] });
        } else {
          const key = cursor.toDateString();
          week.push({ date: new Date(cursor), count: countByDate.get(key) || 0, times: timesByDate.get(key) || [] });
          totalDays++;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    const monthLabels: { week: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, w) => {
      const firstValid = week.find((d) => d.date)?.date;
      if (!firstValid) return;
      const month = firstValid.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ week: w, label: firstValid.toLocaleDateString("en-US", { month: "short" }) });
        lastMonth = month;
      }
    });

    return { weeks, monthLabels, totalDays };
  }, [articles]);

  const colors = LEVEL_VARS;
  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
  const step = CELL + GAP;

  return (
    <div style={{ overflowX: "auto", userSelect: "none" }}>
      <div style={{ position: "relative", height: "14px", marginLeft: "32px", fontSize: "10px", color: "var(--text-tertiary)", lineHeight: 1 }}>
        {monthLabels.map(({ week, label }) => (
          <span key={`${week}-${label}`} style={{ position: "absolute", left: `${week * step}px` }}>
            {label}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: "2px", marginTop: "2px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: `${GAP}px`, paddingTop: "0", flexShrink: 0 }}>
          {dayLabels.map((label, i) => (
            <div key={i} style={{ height: `${CELL}px`, fontSize: "9px", lineHeight: `${CELL}px`, color: "var(--text-tertiary)", width: "30px", textAlign: "right", paddingRight: "4px" }}>
              {label}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridAutoFlow: "column", gridTemplateRows: `repeat(7, ${CELL}px)`, gap: `${GAP}px` }}>
          {weeks.map((week, w) =>
            week.map((day, d) => {
              const level = levelFor(day.count);
              return (
                <div
                  key={`${w}-${d}`}
                  data-cursor-magnetic
                  title={
                    day.date
                      ? `${day.count} ${day.count === 1 ? "post" : "posts"}\n${day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}\n${day.times.length > 0 ? day.times.map(t => t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })).join(", ") : ""}\nWeek ${w + 1}`
                      : ""
                  }
                  style={{
                    width: `${CELL}px`,
                    height: `${CELL}px`,
                    borderRadius: "2px",
                    background: day.date ? colors[level] : "transparent",
                    outline: day.date && level === 0 ? "1px solid var(--border)" : "none",
                    outlineOffset: "-1px",
                    transition: "background 0.15s ease",
                  }}
                />
              );
            })
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "10px", fontSize: "9px", color: "var(--text-tertiary)" }}>
        <span>Less</span>
        {colors.map((c, i) => (
          <div key={i} style={{ width: `${CELL}px`, height: `${CELL}px`, borderRadius: "2px", background: c }} />
        ))}
        <span>More</span>
        <span style={{ marginLeft: "auto" }}>{totalDays} days</span>
      </div>
    </div>
  );
}
