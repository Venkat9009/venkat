"use client";

import Loader from "./Loader";

// Shows the splash animation once, on initial load. Previously this was
// keyed by pathname, which remounted the loader (replaying its ~1.3s
// animation) on every single client-side navigation — a needless delay
// added to every page transition on the site.
export default function PathnameLoader() {
  return <Loader />;
}
