import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Venkat",
  description: "Learn more about Venkata Narayana Reddy — developer, data science student, and builder.",
};

const skills = [
  { category: "Languages", items: ["JavaScript", "TypeScript", "Python", "SQL", "HTML/CSS"] },
  { category: "Frameworks", items: ["Next.js", "React"] },
  { category: "Tools", items: ["Git", "Supabase", "GitHub", "VS Code"] },
];

const timeline = [
  { year: "2026", title: "Intern — Prompt 2 Prod AI", desc: "Feb 28 \u2013 Jun 14, 2026" },
  { year: "2024", title: "Started B.Tech in Data Science", desc: "Sri Indu College of Engineering (JNTUH)" },
  { year: "2023", title: "Intermediate Completion", desc: "Narayana Junior College \u2014 900 marks" },
  { year: "2021", title: "Schooling Completed", desc: "Bhashyam High School \u2014 GPA 9.2" },
];

const stats = [
  { value: "3+", label: "Projects Built" },
  { value: "10K+", label: "Lines of Code" },
  { value: "4", label: "Technologies" },
  { value: "1", label: "Internship" },
];

export default function AboutPage() {
  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "4rem 0 3rem" }}>
      <div className="animate-in">
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
            fontWeight: 700,
            color: "var(--text)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "0.75rem",
          }}
        >
          About
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          A little bit about who I am and what I do.
        </p>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", margin: "2.5rem 0" }} />

      {/* Stats */}
      <div
        className="animate-in animate-in-delay-1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.75rem",
          marginBottom: "2.5rem",
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.25rem 0.75rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--accent)",
                fontFamily: "'Playfair Display', Georgia, serif",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "0.65rem",
                color: "var(--text-tertiary)",
                marginTop: "0.2rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 500,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="animate-in animate-in-delay-1" style={{ marginBottom: "2.5rem" }}>
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            marginBottom: "1.25rem",
          }}
        >
          Journey
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {timeline.map((item, i) => (
            <div
              key={item.year}
              style={{
                display: "flex",
                gap: "1rem",
                position: "relative",
                paddingBottom: i < timeline.length - 1 ? "1.5rem" : 0,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    flexShrink: 0,
                  }}
                />
                {i < timeline.length - 1 && (
                  <div style={{ width: "1px", flex: 1, background: "var(--border)", marginTop: "4px" }} />
                )}
              </div>
              <div style={{ paddingTop: "0" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--accent)", letterSpacing: "0.05em" }}>
                  {item.year}
                </span>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text)", marginTop: "0.15rem" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", marginTop: "0.1rem" }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="animate-in animate-in-delay-2" style={{ marginBottom: "2.5rem" }}>
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            marginBottom: "1.25rem",
          }}
        >
          Skills
        </h2>
        <div className="skills-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
          {skills.map((group) => (
            <div
              key={group.category}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "1.25rem",
              }}
            >
              <h3
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  marginBottom: "0.6rem",
                }}
              >
                {group.category}
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {group.items.map((item) => (
                  <span
                    key={item}
                    style={{
                      padding: "0.25rem 0.6rem",
                      borderRadius: "980px",
                      background: "color-mix(in srgb, var(--text) 8%, transparent)",
                      color: "var(--text-secondary)",
                      fontSize: "0.78rem",
                      fontWeight: 500,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Info */}
      <div
        className="animate-in animate-in-delay-3"
        style={{
          fontSize: "0.95rem",
          color: "var(--text-secondary)",
          lineHeight: 1.85,
          marginBottom: "2.5rem",
        }}
      >
        <p style={{ marginBottom: "1.25rem" }}>
          I&apos;m <strong style={{ color: "var(--text)", fontWeight: 600 }}>Venkata Narayana</strong>, an undergraduate student
          passionate about technology and building real things. I believe in learning by doing — every
          project, every line of code, every mistake teaches something new.
        </p>

        <p style={{ marginBottom: "1.25rem" }}>
          I completed my schooling at <strong style={{ color: "var(--text)", fontWeight: 600 }}>Bhashyam High School</strong> with
          a GPA of 9.2, and my intermediate at <strong style={{ color: "var(--text)", fontWeight: 600 }}>Narayana Junior College</strong> scoring
          900 marks. Currently, I&apos;m pursuing my degree in <strong style={{ color: "var(--text)", fontWeight: 600 }}>Data Science</strong> at{" "}
          <strong style={{ color: "var(--text)", fontWeight: 600 }}>Sri Indu College of Engineering and Technology</strong>, affiliated with JNTUH.
        </p>

        <p style={{ marginBottom: "2.5rem" }}>
          When I&apos;m not writing code, I&apos;m reading about it. This blog is where I document what I learn,
          what I build, and what I believe in — the process of growing, one project at a time.
        </p>
      </div>

      <div className="animate-in animate-in-delay-2">
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            marginBottom: "1.25rem",
          }}
        >
          Connect
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { label: "GitHub", href: "https://github.com/venkatanarayanareddyp2pai-ops" },
            { label: "Email", href: "mailto:nvnreddy9009@gmail.com" },
            { label: "View Resume", href: "/resume.pdf" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="card-hover"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.85rem 1rem",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                background: "var(--bg-card)",
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "var(--text)",
              }}
            >
              <span>{link.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7v10"/>
              </svg>
            </a>
          ))}
        </div>
      </div>

      <div className="animate-in animate-in-delay-3" style={{ marginTop: "2rem" }}>
        <Link href="/blog" className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Read My Articles
        </Link>
      </div>
    </div>
  );
}
