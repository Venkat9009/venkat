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
import { remarkHeadingIds } from "@/lib/slugify";
import type { ReactNode } from "react";

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

  // Heading ids arrive via the remarkHeadingIds plugin (stamped onto the
  // mdast before render), so this is a pure function of props — no
  // render-phase counting that could disagree between SSR and hydration.
  const makeHeading = (Tag: "h1" | "h2" | "h3") =>
    function Heading({ children, id, node, ...props }: { children?: ReactNode; id?: string; node?: unknown } & React.HTMLAttributes<HTMLHeadingElement>) {
      void node;
      return (
        <Tag id={id} style={{ scrollMarginTop: "100px" }} {...props}>
          {children}
        </Tag>
      );
    };

  const components = {
    h1: makeHeading("h1"),
    h2: makeHeading("h2"),
    h3: makeHeading("h3"),
    img: ({ src, alt, node, title, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }) => {
      void node;
      const url = typeof src === "string" ? src : "";
      if (!url) return null;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt || ""}
          title={title}
          loading="lazy"
          decoding="async"
          className="blog-image"
          style={{ borderRadius: "var(--radius)", maxWidth: "100%", height: "auto", margin: "1.5rem auto", display: "block", cursor: "zoom-in" }}
          onClick={() => setLightbox({ src: url, alt: alt || "" })}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = "none";
            el.style.margin = "0";
          }}
          {...props}
        />
      );
    },
    a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      const isExternal = typeof href === "string" && /^(https?:)?\/\//i.test(href);
      if (!isExternal) {
        return <a href={href} {...props}>{children}</a>;
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    code({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { className?: string }) {
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
  };

  return (
    <>
      <div className="prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkHeadingIds]}
          components={components}
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
