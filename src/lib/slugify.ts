export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Minimal mdast node shape so this remark plugin needs no extra packages.
interface MdastNode {
  type?: string;
  value?: string;
  depth?: number;
  children?: MdastNode[];
  data?: Record<string, unknown>;
}

function collectHeadingText(node: MdastNode): string {
  if (node.type === "text" || node.type === "inlineCode") return node.value || "";
  // Images contribute their alt nowhere in the rendered text.
  if (node.type === "image" || node.type === "imageReference") return "";
  return (node.children || []).map(collectHeadingText).join("");
}

function walkMdast(node: MdastNode, fn: (n: MdastNode) => void): void {
  fn(node);
  (node.children || []).forEach((c) => walkMdast(c, fn));
}

// Remark plugin: stamps deterministic, deduped ids onto h1-h3 nodes.
//
// Why this exists: the old approach counted headings during React render,
// but StrictMode double-renders (and any later re-render, e.g. opening the
// lightbox) re-ran the same counter, shifting every id ("x" became "x-2")
// and breaking hydration + TOC anchors. The counter here lives inside the
// transformer, so it restarts fresh on every document pass — SSR,
// hydration, and re-renders all agree.
export function remarkHeadingIds() {
  return (tree: MdastNode) => {
    const seen = new Map<string, number>();
    walkMdast(tree, (node) => {
      if (node.type !== "heading" || (node.depth || 0) > 3) return;
      const base = slugifyHeading(collectHeadingText(node));
      if (!base) return;
      const count = seen.get(base) || 0;
      seen.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count + 1}`;
      const data = (node.data || {}) as Record<string, unknown>;
      const hProps = (data.hProperties || {}) as Record<string, unknown>;
      node.data = { ...data, hProperties: { ...hProps, id } };
    });
  };
}
