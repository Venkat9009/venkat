import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PathnameLoader from "@/components/PathnameLoader";
import SmoothScroll from "@/components/SmoothScroll";
import PageTransition from "@/components/PageTransition";
import { getSiteUrl } from "@/lib/config";

const SITE_URL = getSiteUrl();

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  // Matches :root --bg #ffffff and body.dark --bg #000000 in globals.css.
  // Tints native form controls + scrollbars to theme (normal-user polish,
  // HR sees attention to detail).
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Venkat — Developer & Writer",
    template: "%s — Venkat",
  },
  description: "Personal blog about web development, React, CSS, and data science.",
  authors: [{ name: "Venkata Narayana Reddy", url: `${SITE_URL}/about` }],
  creator: "Venkata Narayana Reddy",
  openGraph: {
    title: "Venkat — Developer & Writer",
    description: "Personal blog about web development, React, CSS, and data science.",
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "venkat.",
    images: [{ url: `${SITE_URL}/api/og?title=Venkat%20—%20Developer%20%26%20Writer`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Venkat — Developer & Writer",
    description: "Personal blog about web development, React, CSS, and data science.",
    images: [`${SITE_URL}/api/og?title=Venkat%20—%20Developer%20%26%20Writer`],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: "Venkat RSS Feed" }],
    },
  },
  icons: {
    // Single source asset today (public/profile.jpg). Sizes declared so
    // browsers don't guess; TODO (HR-visible polish): add public/icon.svg
    // + apple-touch-icon 180x180 for crisp tabs/masks.
    icon: [{ url: "/profile.jpg", type: "image/jpeg" }],
    shortcut: "/profile.jpg",
    apple: [{ url: "/profile.jpg", type: "image/jpeg" }],
  },
};

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span style={{ fontWeight: 500 }}>venkat.</span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <a href="https://github.com/venkatanarayanareddyp2pai-ops" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
          <Link href="/journal" className="footer-link">Journal</Link>
          <a href="mailto:nvnreddy9009@gmail.com" className="footer-link">Email</a>
          <Link href="/admin/login" rel="nofollow" className="footer-link">Admin</Link>
        </div>
      </div>
    </footer>
  );
}

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem("theme");
    var dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.body.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="alternate" type="application/rss+xml" title="Venkat RSS Feed" href="/rss.xml" />
      </head>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <SmoothScroll>
          <a href="#main-content" className="skip-to-content">Skip to content</a>
          <PathnameLoader />
          <div className="container">
            <Navbar />
            <main id="main-content">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </div>
        </SmoothScroll>
      </body>
    </html>
  );
}
