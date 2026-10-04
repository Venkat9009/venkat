// Pure, dependency-free helpers shared by server code AND client components.
//
// Keep this module free of server-only imports (supabase, auth, node APIs).
// Client components must import from here — never from "@/lib/data", which
// pulls supabase-js (and its GoTrue auth clients) into the browser bundle.

export const JOURNAL_CATEGORY = "Journal";

export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_\-~]+/g, " ")
    .replace(/\|/g, " ");
}

export function countWords(content: string): number {
  return stripMarkdown(content).split(/\s+/).filter(Boolean).length;
}

export function calcReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}
