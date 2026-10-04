"use client";

import { useState, useMemo } from "react";
import type { ArticleWithContent } from "@/types";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import MoodIcon from "@/components/MoodIcon";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { formatMonthKey, formatDayParts, formatDateTime } from "@/lib/format";
import { countWords } from "@/lib/text";

const moodIcons: Record<string, string> = {
  happy: "smile",
  motivated: "flame",
  focused: "target",
  learning: "book",
  creative: "palette",
  tired: "moon",
  grateful: "heart",
  excited: "zap",
  calm: "wind",
  determined: "shield",
};

interface JournalListClientProps {
  // Server passes full Articles (with content/word_count); ListItem alone
  // only has excerpt, which undercounts words ~10x. Accept both — data
  // fix only, no visual change.
  initialEntries: ArticleWithContent[];
}

export default function JournalListClient({ initialEntries }: JournalListClientProps) {
  const entries = initialEntries;
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  // Same-page reading: entries expand inline instead of navigating away.
  const [openId, setOpenId] = useState<string | null>(null);
  const [contents, setContents] = useState<Record<string, string>>({});
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [failedSlug, setFailedSlug] = useState<string | null>(null);

  const toggleEntry = (entry: ArticleWithContent) => {
    if (openId === entry.id) {
      setOpenId(null);
      return;
    }
    setOpenId(entry.id);
    setFailedSlug(null);
    if (contents[entry.slug]) return;
    setLoadingSlug(entry.slug);
    fetch(`/api/articles/${entry.slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((data) => {
        setContents((prev) => ({ ...prev, [entry.slug]: data.content || "" }));
      })
      .catch(() => setFailedSlug(entry.slug))
      .finally(() => setLoadingSlug(null));
  };

  // Heatmap day clicks open the entry inline on this same page, then scroll
  // to it — never navigate away.
  const openEntryBySlug = (slug: string) => {
    const entry = entries.find((e) => e.slug === slug);
    if (!entry) return;
    if (openId !== entry.id) toggleEntry(entry);
    requestAnimationFrame(() => {
      document.getElementById(`journal-entry-${entry.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const filtered = selectedMood
    ? entries.filter((e) => e.mood === selectedMood)
    : entries;

  const groupedByMonth = useMemo(() => filtered.reduce<Record<string, ArticleWithContent[]>>((acc, entry) => {
    const key = formatMonthKey(entry.createdAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {}), [filtered]);

  const monthlySummaries = useMemo(() => {
    return Object.entries(groupedByMonth).map(([month, monthEntries]) => {
      // Prefer stored word_count, then full content, then excerpt fallback.
      // countWords strips markdown internally so code fences don't inflate.
      const wordCount = monthEntries.reduce(
        (sum, e) => sum + (e.word_count || countWords(e.content || e.excerpt || "")),
        0
      );
      const moods = monthEntries.map((e) => e.mood).filter(Boolean) as string[];
      const topMood = [...moods]
        .sort((a, b) => moods.filter((v) => v === a).length - moods.filter((v) => v === b).length)
        .pop();
      return { month, count: monthEntries.length, wordCount, topMood };
    });
  }, [groupedByMonth]);

  const currentStreak = useMemo(() => {
    if (entries.length === 0) return 0;
    const dates = [...new Set(entries.map((e) => new Date(e.createdAt).toDateString()))]
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dates[0].getTime() !== today.getTime() && dates[0].getTime() !== yesterday.getTime()) return 0;
    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const diff = (dates[i].getTime() - dates[i + 1].getTime()) / 86400000;
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  }, [entries]);

  const statCards = [
    { value: entries.length, label: "Entries" },
    { value: new Set(entries.map((e) => new Date(e.createdAt).toDateString())).size, label: "Active Days" },
    { value: currentStreak, label: "Streak" },
  ];

  const perWeek = useMemo(() => {
    if (entries.length === 0) return "—";
    const times = entries.map((e) => new Date(e.createdAt).getTime()).sort((a, b) => a - b);
    const spanDays = Math.max(7, (times[times.length - 1] - times[0]) / 86400000 + 1);
    return (entries.length / (spanDays / 7)).toFixed(1);
  }, [entries]);

  return (
    <>
      <section className="animate-in" style={{ padding: "3.5rem 0 1.5rem", textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <MoodIcon name="edit" size={18} />
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.25em",
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
            }}
          >
            Daily Journal
          </span>
        </div>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2.2rem, 4.5vw, 3rem)",
            fontWeight: 700,
            color: "var(--text)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "0.6rem",
          }}
        >
          My Journey
        </h1>
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            maxWidth: "420px",
            margin: "0 auto",
          }}
        >
          A daily record of what I learn, build, and think about.
        </p>
      </section>

      <div
        className="animate-in animate-in-delay-1 journal-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.75rem",
          margin: "0 0 1.5rem",
        }}
      >
        {[...statCards, { value: perWeek, label: "Per Week" }].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.25rem 1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "1.6rem",
                fontWeight: 700,
                color: "var(--text)",
                fontFamily: "'Playfair Display', Georgia, serif",
                lineHeight: 1.1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "0.65rem",
                color: "var(--text-tertiary)",
                marginTop: "0.3rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 500,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div
        className="animate-in animate-in-delay-1 heatmap-card"
        data-lenis-prevent
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          overflowX: "auto",
        }}
      >
        <h3
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}
        >
          Writing Activity
        </h3>
        <CalendarHeatmap articles={entries} onDayClick={(slugs) => openEntryBySlug(slugs[0])} />
      </div>

      {entries.some((e) => e.mood) && (
        <div
          className="animate-in animate-in-delay-1"
          style={{
            display: "flex",
            gap: "0.35rem",
            flexWrap: "wrap",
            padding: "0 0 1.25rem",
            marginBottom: "1.5rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => setSelectedMood(null)}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: "980px",
              border: "1px solid var(--border)",
              background: selectedMood === null ? "var(--text)" : "transparent",
              color: selectedMood === null ? "var(--bg)" : "var(--text-secondary)",
              fontSize: "0.78rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "inherit",
            }}
          >
            all
          </button>
          {Object.entries(moodIcons).map(([mood, iconName]) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.4rem 0.9rem",
                borderRadius: "980px",
                border: "1px solid var(--border)",
                background: selectedMood === mood ? "var(--text)" : "transparent",
                color: selectedMood === mood ? "var(--bg)" : "var(--text-secondary)",
                fontSize: "0.78rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
              }}
            >
              <MoodIcon name={iconName} size={13} />
              {mood}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: "3rem 0", textAlign: "center", color: "var(--text-tertiary)" }}>
          <MoodIcon name="edit" size={28} />
          <p style={{ fontSize: "0.88rem", marginTop: "0.5rem" }}>No journal entries yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {Object.entries(groupedByMonth).map(([month, monthEntries]) => {
            const summary = monthlySummaries.find((s) => s.month === month);
            return (
              <div key={month}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.75rem",
                    marginBottom: "0.6rem",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color: "var(--text)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {month}
                  </h2>
                  {summary && (
                    <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                      {summary.count} {summary.count === 1 ? "entry" : "entries"} · {summary.wordCount.toLocaleString()} words
                      {summary.topMood && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.2rem",
                            marginLeft: "0.5rem",
                          }}
                        >
                          {"\u00b7"} <MoodIcon name={moodIcons[summary.topMood] || "book"} size={11} />{" "}
                          {summary.topMood}
                        </span>
                      )}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {monthEntries.map((entry, i) => {
                    const { dayName, dayNum } = formatDayParts(entry.createdAt);
                    const mood = entry.mood || "learning";
                    const iconName = moodIcons[mood] || "book";
                    const isOpen = openId === entry.id;

                    return (
                      <div
                        key={entry.id}
                        id={`journal-entry-${entry.id}`}
                        className="card-hover"
                        style={{
                          padding: "0.85rem 1rem",
                          border: isOpen ? "1px solid var(--border-hover)" : "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          background: "var(--bg-card)",
                          animation: `fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.04 * i}s both`,
                        }}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? "Collapse" : "Expand"} entry from ${formatDateTime(entry.createdAt)}`}
                          onClick={() => toggleEntry(entry)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleEntry(entry); } }}
                          style={{
                            display: "flex",
                            gap: "0.85rem",
                            alignItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              minWidth: "44px",
                              height: "44px",
                              borderRadius: "10px",
                              background: "var(--bg-secondary)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.55rem",
                                fontWeight: 600,
                                color: "var(--text-tertiary)",
                                textTransform: "uppercase",
                                lineHeight: 1,
                              }}
                            >
                              {dayName}
                            </span>
                            <span
                              style={{
                                fontSize: "1rem",
                                fontWeight: 700,
                                color: "var(--text)",
                                lineHeight: 1.2,
                              }}
                            >
                              {dayNum}
                            </span>
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                marginBottom: "0.2rem",
                              }}
                            >
                              <MoodIcon name={iconName} size={14} />
                              <h3
                                style={{
                                  fontSize: "0.9rem",
                                  fontWeight: 600,
                                  color: "var(--text)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {entry.title}
                              </h3>
                            </div>
                            {!isOpen && (
                              <p
                                style={{
                                  fontSize: "0.78rem",
                                  color: "var(--text-tertiary)",
                                  lineHeight: 1.4,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {entry.excerpt}
                              </p>
                            )}
                            <p
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--text-tertiary)",
                                marginTop: "0.2rem",
                              }}
                            >
                              {formatDateTime(entry.createdAt)}
                            </p>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              flexShrink: 0,
                              color: "var(--text-tertiary)",
                              transform: isOpen ? "rotate(90deg)" : "none",
                              transition: "transform 0.25s ease",
                            }}
                          >
                            <MoodIcon name="arrow" size={14} />
                          </div>
                        </div>

                        {isOpen && (
                          <div
                            style={{
                              borderTop: "1px solid var(--border)",
                              marginTop: "0.85rem",
                              paddingTop: "1rem",
                              animation: "fadeIn 0.25s ease",
                            }}
                          >
                            {loadingSlug === entry.slug ? (
                              <p style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>Loading entry...</p>
                            ) : failedSlug === entry.slug ? (
                              <p style={{ fontSize: "0.85rem", color: "#ef4444" }}>Could not load this entry. Check your connection and try again.</p>
                            ) : (
                              <MarkdownRenderer content={contents[entry.slug] || ""} />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
