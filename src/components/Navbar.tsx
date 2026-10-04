"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </svg>
  );
}

function ArticlesIcon({ active }: { active: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      {active ? (
        <path d="M4 4h16v16H4z M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth={2} fill="none" />
      ) : (
        <>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </>
      )}
    </svg>
  );
}

function JournalIcon({ active }: { active: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" />
      <path d="M5 4a2 2 0 0 1 2-2h12v16H7a2 2 0 0 0-2 2" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

function AboutIcon({ active }: { active: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  );
}

export default function Navbar() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    queueMicrotask(() => {
      setDark(isDark);
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.body.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark, mounted]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => setDark((d) => !d);

  const navLinks = [
    { href: "/", label: "Home", active: pathname === "/", Icon: HomeIcon },
    { href: "/blog", label: "Articles", active: pathname.startsWith("/blog"), Icon: ArticlesIcon },
    { href: "/journal", label: "Journal", active: pathname.startsWith("/journal"), Icon: JournalIcon },
    { href: "/about", label: "About", active: pathname === "/about", Icon: AboutIcon },
  ];

  return (
    <>
      {/* Top — slim brand bar only (iPhone style: title up top, tabs at bottom) */}
      <nav
        className={scrolled ? "navbar-scrolled" : "navbar-idle"}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "0",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          style={{
            maxWidth: "1060px",
            margin: "0 auto",
            padding: "0.45rem 1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.03em",
            }}
          >
            venkat.
          </Link>

          <button
            onClick={toggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="theme-toggle"
            style={{
              background: "color-mix(in srgb, var(--text) 8%, transparent)",
              border: "1px solid var(--border)",
              padding: "7px",
              borderRadius: "980px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
          >
            {!mounted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Bottom — iPhone floating dock (compact) */}
      <nav
        aria-label="Primary"
        className="iphone-dock"
        style={{
          position: "fixed",
          bottom: "max(0.75rem, env(safe-area-inset-bottom))",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200,
          width: "min(400px, calc(100% - 2rem))",
          background: "color-mix(in srgb, var(--bg) 62%, transparent)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
          borderRadius: "22px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 0.5px 0 rgba(255,255,255,0.12)",
          padding: "0.3rem 0.4rem",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        {navLinks.map(({ href, label, active, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1px",
              minWidth: "56px",
              padding: "0.3rem 0.5rem",
              borderRadius: "16px",
              textDecoration: "none",
              color: active ? "var(--accent)" : "var(--text-secondary)",
              background: active
                ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                : "transparent",
              transition: "all 0.25s ease",
              fontSize: "0.58rem",
              lineHeight: 1.1,
              fontWeight: active ? 600 : 500,
              letterSpacing: "0.01em",
            }}
          >
            <Icon active={active} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
