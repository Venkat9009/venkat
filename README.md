# venkat.

Personal blog and developer portfolio built with Next.js, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Database:** Supabase (PostgreSQL + Storage)
- **Styling:** Tailwind CSS 4 + inline styles
- **Languages:** TypeScript 5.9
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js >= 20.9
- A Supabase project ([supabase.com](https://supabase.com))
- An admin user set via environment variables

### Setup

```bash
# Clone the repository
git clone https://github.com/venkatanarayanareddyp2pai-ops/venkat-main.git
cd venkat-main

# Install dependencies
npm install

# Copy the example env file and fill in your values
cp .env.example .env.local
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (public, used for reads) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only, used for writes) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL (e.g. `https://venkat.dev`) |
| `ADMIN_USER` | Yes | Admin login username |
| `ADMIN_PASS` | Yes | Admin login password |
| `ADMIN_TOKEN_SECRET` | Optional | Separate secret for signing session tokens (falls back to `ADMIN_PASS`) |

### Database Schema

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor to create:

- `articles` table with RLS (public read of published articles only)
- `increment_article_counter` RPC function (atomic like/view counts)
- `blog-images` storage bucket (public, for cover images)

### Development

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run start      # Serve the production build
npm run lint       # ESLint
npm run type-check  # TypeScript type check
```

### Deployment

The project is configured for Vercel deployment. Push to GitHub and connect your repository in the Vercel dashboard.

Set all required environment variables in your Vercel project settings before deploying.

## Architecture

```
src/
├── app/          Next.js App Router pages and API routes
│   ├── api/      REST API (auth, articles CRUD, uploads, counters)
│   ├── blog/     Blog list and article pages (SSR)
│   ├── journal/  Mood-filtered journal entries (SSR)
│   ├── admin/    Login and admin dashboard (CMS)
│   └── ...       Home, About, sitemap, RSS, robots
├── components/   Reusable React components
├── lib/          Database access, auth, rate limiting, config
└── types/        TypeScript type definitions
```

## Security

- **Admin auth** uses HMAC-SHA256 signed tokens stored in httpOnly cookies
- **Rate limiting** on login, like, and view endpoints (per-IP)
- **Atomic counters** via Supabase RPC (no read-then-write races)
- **RLS** restricts public reads to published articles only
- **Security headers** including CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Lazy client initialization** — no environment variables required at build time
- Draft articles are invisible to non-admin users (page + API + metadata)

## License

Private — N. Venkata Narayana Reddy
