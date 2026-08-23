import type { Metadata } from "next";
import JournalListClient from "@/components/JournalListClient";
import { getArticles } from "@/lib/data";

export const metadata: Metadata = {
  title: "Journal — Venkat",
  description: "A daily record of what I learn, build, and think about.",
};

export const revalidate = 300;

export default async function JournalPage() {
  let entries: Awaited<ReturnType<typeof getArticles>> = [];
  try {
    entries = await getArticles(true);
    entries = entries.filter((a) => a.category === "Journal" || a.category === "journal");
  } catch {
    entries = [];
  }

  return <JournalListClient initialEntries={entries} />;
}
