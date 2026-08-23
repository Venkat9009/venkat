export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Returns a slugger function that appends -2, -3, ... to repeated headings,
// so two sections with the same title don't collide on the same #id.
// Create a fresh instance per render pass (per article) so both the
// rendered markdown and the Table of Contents dedupe identically, in the
// same top-to-bottom order.
export function createHeadingSlugger() {
  const seen = new Map<string, number>();
  return (text: string): string => {
    const base = slugifyHeading(text);
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}
