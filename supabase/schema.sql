-- Run this in your Supabase project's SQL Editor:
-- Dashboard -> SQL Editor -> New query -> paste this whole file -> Run

-- If you already ran an earlier version of this schema that created a
-- `habits` table, the habit-tracking feature has since been removed
-- from the app. Uncomment the next line to drop it:
-- drop table if exists habits;

-- ============================================================
-- articles
-- ============================================================
create extension if not exists "pgcrypto";

create table if not exists articles (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  content       text not null,
  excerpt       text not null default '',
  category      text not null default 'uncategorized',
  published     boolean not null default false,
  cover_image   text,
  tags          text[] not null default '{}',
  mood          text,
  series        text,
  word_count    integer,
  reading_time  integer,
  view_count    integer not null default 0,
  like_count    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists articles_published_created_at_idx
  on articles (published, created_at desc);
create index if not exists articles_category_idx
  on articles (category);

-- ============================================================
-- Row Level Security
-- The app reads with the anon key (public) and writes with the
-- service role key (admin-only, via ADMIN_USER/ADMIN_PASS auth),
-- which bypasses RLS entirely. So: allow public read of published
-- articles, and deny all writes at the DB level from the anon key.
-- ============================================================
alter table articles enable row level security;

create policy "Public can read published articles"
  on articles for select
  using (published = true);

-- Admin dashboard reads unpublished drafts too, but it only ever
-- calls this through server-side code using the service role key,
-- which bypasses RLS — so no separate policy is needed for that.

-- No insert/update/delete policies are defined for the anon role,
-- so all writes from the browser are rejected; only the service
-- role key (server-side, admin-authenticated) can write.

-- ============================================================
-- Atomic counter increment (eliminates read-then-write races)
-- ============================================================
create or replace function public.increment_article_counter(
  p_slug text,
  p_column text,
  p_delta integer
) returns integer
language plpgsql
volatile
set search_path = public
as $$
declare
  new_value integer;
begin
  -- Only these two columns may ever be incremented.
  if p_column not in ('like_count', 'view_count') then
    raise exception 'invalid counter column';
  end if;

  execute format(
    'update articles set %I = greatest(0, coalesce(%I, 0) + $1) where slug = $2 returning %I',
    p_column, p_column, p_column
  )
  into new_value
  using p_delta, p_slug;

  return coalesce(new_value, 0);
end;
$$;

-- ============================================================
-- Storage bucket for cover images / uploaded photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

create policy "Public can view blog images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

-- Uploads go through /api/upload, which checks admin auth itself
-- and writes with the service role key, bypassing this policy —
-- so no insert policy is needed for the anon/public role here.

-- ============================================================
-- Newsletter subscribers
-- ============================================================
create table if not exists newsletter_subscribers (
  email         text primary key,
  subscribed_at timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;

-- No public policies: only the service role (server-side) can read/write.
