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

-- Recreate cleanly on re-run (idempotent upgrades).
drop policy if exists "Public can read published articles" on articles;
create policy "Public can read published articles"
  on articles for select
  to anon, authenticated
  using (published = true);

-- Explicit deny-by-default: even if a permissive policy is added later by
-- mistake, these make anon writes fail closed. Normal user never sees this;
-- dev sees clear "policy" errors instead of silent writes.
drop policy if exists "No anon inserts" on articles;
create policy "No anon inserts"
  on articles for insert
  to anon, authenticated
  with check (false);

drop policy if exists "No anon updates" on articles;
create policy "No anon updates"
  on articles for update
  to anon, authenticated
  using (false);

drop policy if exists "No anon deletes" on articles;
create policy "No anon deletes"
  on articles for delete
  to anon, authenticated
  using (false);

-- Admin dashboard reads unpublished drafts too, but it only ever
-- calls this through server-side code using the service role key,
-- which bypasses RLS — so no separate policy is needed for that.

-- No insert/update/delete policies are defined for the anon role,
-- so all writes from the browser are rejected; only the service
-- role key (server-side, admin-authenticated) can write.

-- ============================================================
-- Atomic counter increment (eliminates read-then-write races)
--
-- Hardened: SECURITY DEFINER + revoked from anon/public so the anon key
-- (which is public via NEXT_PUBLIC_*) cannot call it directly with an
-- arbitrary p_delta. Only the service-role client (server-side API routes,
-- which enforce rate limits + published checks) may increment.
-- The function itself also enforces published=true and delta IN (-1,1).
-- After running this, re-run it on your existing project to upgrade.
-- ============================================================
create or replace function public.increment_article_counter(
  p_slug text,
  p_column text,
  p_delta integer
) returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  new_value integer;
begin
  -- Only these two columns may ever be incremented.
  if p_column not in ('like_count', 'view_count') then
    raise exception 'invalid counter column';
  end if;

  -- Clamp delta: likes may +1/-1, views may only +1.
  if p_delta not in (-1, 1) then
    raise exception 'invalid delta';
  end if;
  if p_column = 'view_count' and p_delta <> 1 then
    raise exception 'invalid delta';
  end if;

  -- Never count drafts or missing articles.
  if not exists (select 1 from articles where slug = p_slug and published = true) then
    return 0;
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

-- Only service_role (server-side) may execute. Revoke from anon/public
-- so a leaked anon key cannot bypass API rate limits.
revoke all on function public.increment_article_counter(text, text, integer) from public, anon, authenticated;
grant execute on function public.increment_article_counter(text, text, integer) to service_role;
-- Pin owner so a dump restored under a low-priv role can't escalate via
-- SECURITY DEFINER. Run once as postgres / project owner.
do $$ begin
  begin
    alter function public.increment_article_counter(text, text, integer) owner to postgres;
  exception when others then null;
  end;
end $$;

-- ============================================================
-- Storage bucket for cover images / uploaded photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view blog images" on storage.objects;
create policy "Public can view blog images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'blog-images');

-- Explicit deny writes from anon: uploads must go via /api/upload.
drop policy if exists "No anon image inserts" on storage.objects;
create policy "No anon image inserts"
  on storage.objects for insert
  to anon, authenticated
  with check (false);

drop policy if exists "No anon image updates" on storage.objects;
create policy "No anon image updates"
  on storage.objects for update
  to anon, authenticated
  using (false);

drop policy if exists "No anon image deletes" on storage.objects;
create policy "No anon image deletes"
  on storage.objects for delete
  to anon, authenticated
  using (false);

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

-- ============================================================
-- Categories (create-first, then select in the article editor)
-- ============================================================
-- Categories live in their own table so the article form can offer
-- a fixed dropdown instead of free text. That stops accidental
-- duplicates like "Tech" vs "tech" vs "tech " from appearing as
-- separate filters on the blog page.
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

alter table categories enable row level security;

-- Public (anon) can read the list for blog filters; writes only go
-- through /api/categories with admin auth + service role key.
drop policy if exists "Public can read categories" on categories;
create policy "Public can read categories"
  on categories for select
  to anon, authenticated
  using (true);

drop policy if exists "No anon category writes" on categories;
create policy "No anon category writes"
  on categories for insert
  to anon, authenticated
  with check (false);

drop policy if exists "No anon category updates" on categories;
create policy "No anon category updates"
  on categories for update
  to anon, authenticated
  using (false);

drop policy if exists "No anon category deletes" on categories;
create policy "No anon category deletes"
  on categories for delete
  to anon, authenticated
  using (false);
