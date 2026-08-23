"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
    { href: "/", label: "Home", active: pathname === "/" },
    { href: "/blog", label: "Articles", active: pathname.startsWith("/blog") },
    { href: "/about", label: "About", active: pathname === "/about" },
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
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
          padding: "0.6rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left — Logo */}
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

        {/* Center — Nav Links (desktop pill) */}
        <div
          className="nav-desktop"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            background: scrolled
              ? "color-mix(in srgb, var(--bg) 60%, transparent)"
              : "color-mix(in srgb, var(--bg) 40%, transparent)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderRadius: "980px",
            padding: "0.3rem 0.35rem",
            border: "1px solid color-mix(in srgb, var(--border) 50%, transparent)",
            boxShadow: scrolled
              ? "0 2px 12px rgba(0,0,0,0.06), inset 0 0.5px 0 rgba(255,255,255,0.1)"
              : "none",
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                padding: "0.4rem 1rem",
                borderRadius: "980px",
                color: link.active ? "var(--text)" : "var(--text-secondary)",
                background: link.active
                  ? "color-mix(in srgb, var(--text) 10%, transparent)"
                  : "transparent",
                transition: "all 0.25s ease",
                letterSpacing: "0.01em",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right — Theme Toggle + Hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
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
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            style={{
              background: "none",
              border: "none",
              padding: "6px",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
            }}
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="nav-mobile-menu"
          style={{
            display: "none",
            flexDirection: "column",
            gap: "0.25rem",
            padding: "0.75rem 1.5rem 1.25rem",
            background: "color-mix(in srgb, var(--bg) 70%, transparent)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            borderTop: "1px solid var(--border)",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              onClick={closeMenu}
              style={{
                fontSize: "0.9rem",
                fontWeight: 500,
                padding: "0.6rem 0.75rem",
                borderRadius: "12px",
                color: link.active ? "var(--text)" : "var(--text-secondary)",
                background: link.active
                  ? "color-mix(in srgb, var(--text) 8%, transparent)"
                  : "transparent",
                transition: "all 0.2s ease",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
