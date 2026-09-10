import type { Metadata } from "next";
import JournalListClient from "@/components/JournalListClient";
import { getArticles } from "@/lib/data";

export const metadata: Metadata = {
  title: "Journal — Venkat",
  description: "A daily record of what I learn, build, and think about.",
};

export const revalidate = 60;

export default async function JournalPage() {
  let entries: Awaited<ReturnType<typeof getArticles>> = [];
  try {
    entries = await getArticles(true, "Journal");
  } catch {
    entries = [];
  }

  return <JournalListClient initialEntries={entries} />;
}
