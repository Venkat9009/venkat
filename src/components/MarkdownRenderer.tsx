"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import xml from "highlight.js/lib/languages/xml";
import sql from "highlight.js/lib/languages/sql";
import markdown from "highlight.js/lib/languages/markdown";
import yaml from "highlight.js/lib/languages/yaml";
import ImageLightbox from "./ImageLightbox";
import { createHeadingSlugger } from "@/lib/slugify";
import type { ReactNode } from "react";

// Headings can contain nested markdown (bold, links, code, etc), not just
// plain text, so flatten their children down to a string before slugifying.
function flattenToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenToText).join("");
  if (typeof node === "object" && "props" in node) {
    return flattenToText((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);

interface MarkdownRendererProps {
  content: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <button onClick={handleCopy} className="code-copy-btn" aria-label="Copy code">
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  // Fresh per render so repeated headings ("Overview" appearing twice, say)
  // get deduped -2, -3, ... the same way the Table of Contents does.
  const slugger = createHeadingSlugger();
  const makeHeading = (Tag: "h1" | "h2" | "h3") =>
    function Heading({ children, ...props }: { children?: ReactNode }) {
      const id = slugger(flattenToText(children));
      return (
        <Tag id={id} style={{ scrollMarginTop: "100px" }} {...props}>
          {children}
        </Tag>
      );
    };

  return (
    <>
      <div className="prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: makeHeading("h1"),
            h2: makeHeading("h2"),
            h3: makeHeading("h3"),
            img: ({ src, alt, ...props }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={typeof src === "string" ? src : ""}
                alt={alt || ""}
                className="blog-image-left"
                style={{ borderRadius: "var(--radius)", maxWidth: "45%", margin: "0.5rem 1.5rem 1rem 0", cursor: "zoom-in", float: "left", clear: "left" }}
                onClick={() => { if (typeof src === "string") setLightbox({ src, alt: alt || "" }); }}
                {...props}
              />
            ),
            a: ({ href, children, ...props }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            ),
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const codeString = String(children).replace(/\n$/, "");

              if (match) {
                let highlighted: string;
                try {
                  highlighted = hljs.highlight(codeString, { language: match[1] }).value;
                } catch {
                  highlighted = hljs.highlightAuto(codeString).value;
                }
                return (
                  <div className="code-block">
                    <div className="code-block-header">
                      <span className="code-lang">{match[1]}</span>
                      <CopyButton text={codeString} />
                    </div>
                    <pre className={className} style={{ margin: 0, borderRadius: "0 0 var(--radius-sm) var(--radius-sm)" }}>
                      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
                    </pre>
                  </div>
                );
              }

              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
