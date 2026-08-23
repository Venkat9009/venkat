import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PathnameLoader from "@/components/PathnameLoader";
import SmoothScroll from "@/components/SmoothScroll";
import PageTransition from "@/components/PageTransition";
import { getSiteUrl } from "@/lib/config";

const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Venkat — Developer & Writer",
  description: "Personal blog about web development, React, CSS, and data science.",
  openGraph: {
    title: "Venkat — Developer & Writer",
    description: "Personal blog about web development, React, CSS, and data science.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Venkat — Developer & Writer",
    description: "Personal blog about web development, React, CSS, and data science.",
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
};

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span style={{ fontWeight: 500 }}>venkat.</span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <a href="https://github.com/venkatanarayanareddyp2pai-ops" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
          <a href="mailto:nvnreddy9009@gmail.com" className="footer-link">Email</a>
          <Link href="/admin/login" className="footer-link">Admin</Link>
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
