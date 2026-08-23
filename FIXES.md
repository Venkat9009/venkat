# Fixes applied

I read through the entire codebase (every route, page, and component) and fixed
the real bugs I found. No network access was available in my environment, so I
could not run `npm install` or a live build — everything below was verified by
tracing the logic by hand, not by a compiler. Please run `npm install && npm run
build` yourself before deploying, just in case.

## Security

1. **Draft articles were publicly viewable.** `/api/articles/[slug]` correctly
   checked `published` before returning data, but the actual page users hit —
   `src/app/blog/[slug]/page.tsx` — never did. Anyone who guessed or found a
   draft's slug/ID could read it, and its title/excerpt leaked into `<meta>`
   tags (search engines, link previews) regardless of auth.
   → Added a shared `getViewableArticle()` gate used by both the page and
   `generateMetadata`, backed by a new `checkAuthFromCookie()` in `lib/auth.ts`
   for use in Server Components.

2. **Login had no rate limiting** (`/api/auth`), leaving it open to
   brute-forcing. → Added a 5-attempts/minute-per-IP limit.

3. **View/like rate limiters used one global key** (`"view"`, `"like"`)
   shared by every visitor to the entire site — meaning any real traffic
   would trip the 30/minute cap for everyone, not just abusive clients.
   → Added `getClientIp()` in `lib/rate-limit.ts`; limiters are now keyed
   per-IP.

4. **"Logout" didn't actually log you out.** It only cleared `localStorage`;
   the real session was an httpOnly cookie that stayed valid up to 24h
   regardless. → Added `DELETE /api/auth` to clear the cookie server-side,
   and the dashboard's logout button now calls it.

5. **The admin token was duplicated into `localStorage`** and replayed via a
   manual `Authorization: Basic` header on every request — this is exactly
   the kind of long-lived secret an XSS bug would love to steal, and it was
   entirely redundant since the httpOnly cookie already authenticates
   same-origin requests automatically. → Removed the token from
   `localStorage`/JSON responses entirely. The login page, admin dashboard,
   and `HabitTracker` now only store a non-secret `is_admin` flag for
   toggling UI, while the httpOnly cookie does the actual authenticating.

6. **Upload trusted the filename's extension** rather than the validated
   MIME type. → Extension is now derived from `file.type` via a fixed map.

## Functional bugs

7. **Homepage had no loading state** — it briefly showed "No articles
   published yet." before the fetch resolved (the `/blog` page did this
   correctly; the homepage didn't). → Added the same loading-skeleton
   pattern.

8. **Like count never loaded correctly.** The GET handler on
   `/api/articles/like` ignored the `slug` query param and returned an
   unrelated list shape, so `LikeButton`'s initial count was always 0 until
   you clicked it. → Fixed GET to look up and return the count for the
   requested slug.

9. **Table of Contents was decorative only.** Headings rendered by
   `MarkdownRenderer` never got `id` attributes (no `rehype-slug`, no custom
   heading renderer), so `document.getElementById()` in `TableOfContents`
   never found anything — clicking a TOC entry or scrolling through the
   article did nothing. → Added a shared, dedup-aware slugger
   (`lib/slugify.ts`) used by both `MarkdownRenderer` (to assign ids) and
   `TableOfContents` (to link to them), plus `scroll-margin-top` so the
   sticky navbar doesn't cover the heading you jump to.

10. **"Copy Link" permanently broke itself after first use.** It set
    `btnRef.current.textContent = "Copied!"` then `""` — directly wiping out
    the button's child `<svg>` node, which never came back.
    → Replaced with React state driving the label.

11. **Dark mode flashed light on reload** (FOUC) — the theme class was only
    applied after a client-side `useEffect` ran, so there was always a flash
    of the wrong theme on first paint. → Added a small blocking script as
    the first thing in `<body>` that applies the class before anything
    else renders.

12. **The splash loader replayed on every page navigation**, not just the
    first load, because `PathnameLoader` was keyed by `pathname` and forced
    a remount (and a fresh ~1.3s animation) on every click.
    → Removed the pathname key; the root layout doesn't remount between
    pages, so the loader now runs once per session as intended.

13. Removed an unused import in `MoodIcon.tsx`.

14. **View counts inflated on every refresh.** → Added a session-scoped
    dedup (`sessionStorage`) so refreshing a page you've already viewed this
    session shows the current count instead of incrementing it again; added
    a matching `GET` handler on `/api/articles/view` for that case.

## Files touched

```
src/app/admin/dashboard/page.tsx
src/app/admin/login/page.tsx
src/app/api/articles/like/route.ts
src/app/api/articles/view/route.ts
src/app/api/auth/route.ts
src/app/api/upload/route.ts
src/app/blog/[slug]/page.tsx
src/app/layout.tsx
src/app/page.tsx
src/components/HabitTracker.tsx
src/components/MarkdownRenderer.tsx
src/components/MoodIcon.tsx
src/components/PathnameLoader.tsx
src/components/ShareButtons.tsx
src/components/TableOfContents.tsx
src/components/ViewCounter.tsx
src/lib/auth.ts
src/lib/rate-limit.ts
src/lib/slugify.ts   (new)
```

## What I didn't touch, and why

- The overall visual design, layout, and copy are untouched — you didn't ask
  for a redesign, and I didn't want to introduce risk by rewriting things
  that already worked.
- `toggleHabitDate`'s read-then-write isn't atomic (a race is theoretically
  possible under concurrent toggles), but this is a single-admin habit
  tracker, so the risk is negligible — flagging it rather than adding
  complexity for a scenario that won't occur in practice.
- I couldn't run a real build/lint/type-check (no network access to install
  dependencies), so please run `npm install && npm run build` before
  deploying to catch anything my manual review missed.

---

## Hardening pass #2 — security, performance, UX

### Security

1. **Added Content-Security-Policy header** (`next.config.js`). Scripts are
   `self` + `unsafe-inline` only; images allow Supabase storage + any HTTPS
   source (needed for markdown-authored content); `object-src` blocked;
   `frame-ancestors` set to `none`.

2. **Enabled `reactStrictMode`** to surface side-effects and deprecated APIs
   earlier.

3. **Atomic counters** — like/view increments now call the
   `increment_article_counter` Supabase RPC function, eliminating the
   read-then-write race. The RPC function also whitelists counter columns to
   prevent injection.

4. **Session cookie name** is now a shared constant (`SESSION_COOKIE` in
   `lib/auth.ts`) imported everywhere magic strings were used before. Added
   `isAdminConfigured()` guard — login returns 503 when no admin credentials
   are set, failing closed instead of allowing infinite brute-force.

5. **Removed dead `lib/env.ts`** and created `lib/config.ts` with
   lazy/deferred env access. `supabase.ts` now uses a `Proxy`-based lazy
   client so importing the module never throws at module-load time — builds
   succeed without env vars, and env problems surface only at the call site
   that needs them.

6. **Rate limiter hardened** — tracked-key count is now capped at 10,000;
   when exceeded, the soonest-to-expire entry is evicted first, preventing
   memory exhaustion from cycling spoofed IPs.

### Performance / UX

7. **Home, blog list, and journal pages converted to server-side rendering**
   with `revalidate = 300`. Articles are now fetched at build/request time
   via `lib/data` directly, removing the extra client-side `fetch("/api/...")`
   round-trip. Interactive filtering/search/pagination lives in extracted
   client components (`BlogListClient`, `JournalListClient`).

8. **Created `.env.example`** documenting every required environment variable,
   and `.nvmrc` pinned to Node 24.

9. **Rewrote `README.md`** from the default create-next-app boilerplate to a
   proper setup guide with env var table, architecture overview, and security
   notes.

10. **sitemap.ts and rss.ts wrapped in try/catch** so build-time DB
    connectivity failures return empty results instead of crashing the build.

### Dependencies updated

- next: 16.2.11 -> 16.3.2
- react / react-dom: 19.2.4 -> 19.2.8
- @supabase/supabase-js: 2.110.7 -> 2.112.3
- typescript: 5 -> 5.9.3
- engines.node: >=18 -> >=20.9.0

### Files touched

```
next.config.js                        # CSP + reactStrictMode
package.json                          # dependency bumps + engines
README.md                             # full rewrite
.env.example                          # new
.nvmrc                                # new
src/app/admin/dashboard/page.tsx      # (no changes needed — uses API)
src/app/api/auth/route.ts             # SESSION_COOKIE constant, isAdminConfigured guard
src/app/api/articles/like/route.ts    # atomic RPC increment
src/app/api/articles/view/route.ts    # atomic RPC increment
src/app/blog/[slug]/page.tsx          # SESSION_COOKIE + centralized SITE_URL
src/app/blog/page.tsx                 # SSR + BlogListClient
src/app/journal/page.tsx              # SSR + JournalListClient
src/app/layout.tsx                    # metadataBase + centralized SITE_URL
src/app/page.tsx                      # SSR (server component)
src/app/sitemap.ts                    # try/catch fallback
src/app/rss.ts                        # try/catch fallback
src/app/robots.tsx                    # centralized SITE_URL
src/app/globals.css                   # .link-muted class
src/components/Typewriter.tsx         # extracted from page.tsx
src/components/BlogListClient.tsx     # extracted interactive filtering
src/components/JournalListClient.tsx  # extracted interactive filtering
src/lib/auth.ts                       # SESSION_COOKIE constant, isAdminConfigured()
src/lib/config.ts                     # new: centralized env access
src/lib/supabase.ts                   # lazy Proxy-based clients
src/lib/rate-limit.ts                 # bounded memory, eviction
supabase/schema.sql                   # increment_article_counter RPC
```
