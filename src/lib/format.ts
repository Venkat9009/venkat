export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function formatMonthKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

export function formatDayParts(iso: string): { dayName: string; dayNum: string } {
  const d = new Date(iso);
  return {
    dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
    dayNum: d.toLocaleDateString("en-US", { day: "numeric" }),
  };
}

export function formatMonthShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short" });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDateTime(iso: string): string {
  return `${formatDateLong(iso)} · ${formatTime(iso)}`;
}
