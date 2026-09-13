-- Reading the anonymous page counter.
--
-- assets/account.js has called the track_pageview RPC on every page load since
-- long before Umami existed, so there is a history here that Umami has no
-- knowledge of and never will: it only knows about traffic since the day it was
-- installed. This is the only way to see the rest.
--
-- The table is deliberately unreadable from the website. It has no RLS policies
-- at all, which in Postgres-with-RLS means no role reaching it through the API
-- can select from it — that is what lets privacy.html promise the counter
-- cannot be read back. The service role in the Supabase SQL editor bypasses
-- RLS, so these run there and only there:
--
--   Supabase dashboard -> SQL Editor -> New query -> paste -> Run
--
-- Nothing below writes anything.

-- ---------------------------------------------------------------------------
-- 0. What the table actually looks like.
--
-- Run this first. Everything after it assumes the shape the counter was built
-- with — one row per (path, day) with a running count — and if the column names
-- differ, this is what tells you, rather than five queries failing one at a
-- time.
-- ---------------------------------------------------------------------------
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'page_views'
order by ordinal_position;

-- ---------------------------------------------------------------------------
-- 1. The headline: total views, distinct pages, and the range covered.
-- ---------------------------------------------------------------------------
select
  sum(count)                       as total_views,
  count(distinct path)             as pages,
  min(day)                         as first_day,
  max(day)                         as last_day,
  max(day) - min(day) + 1          as days_covered
from public.page_views;

-- ---------------------------------------------------------------------------
-- 2. Most-viewed pages, all time.
--
-- The one thing the counter is genuinely good at. Umami answers this too, but
-- only for the period since it was installed.
-- ---------------------------------------------------------------------------
select path, sum(count) as views
from public.page_views
group by path
order by views desc
limit 40;

-- ---------------------------------------------------------------------------
-- 3. Views per day, most recent first.
--
-- Useful for spotting the days something was shared somewhere.
-- ---------------------------------------------------------------------------
select day, sum(count) as views
from public.page_views
group by day
order by day desc
limit 90;

-- ---------------------------------------------------------------------------
-- 4. Which course the traffic goes to.
--
-- The paths carry this: /nremt/... , /ochem/... , and everything else is the
-- hub and its standalone pages.
-- ---------------------------------------------------------------------------
select
  case
    when path like '/nremt/%' then 'NREMT'
    when path like '/ochem/%' then 'Organic Chemistry'
    else 'Hub and other'
  end as area,
  sum(count) as views
from public.page_views
group by area
order by views desc;

-- ---------------------------------------------------------------------------
-- 5. Which ochem lessons actually get opened.
--
-- Fifty-eight lessons is a lot to maintain. This says which ones earn it, and
-- a lesson sitting at the bottom is either badly linked or badly titled.
-- ---------------------------------------------------------------------------
select
  replace(replace(path, '/ochem/lessons/', ''), '.html', '') as lesson,
  sum(count) as views
from public.page_views
where path like '/ochem/lessons/%'
group by lesson
order by views desc;

-- ---------------------------------------------------------------------------
-- 6. Month over month, to see the trend without the daily noise.
-- ---------------------------------------------------------------------------
select
  date_trunc('month', day)::date as month,
  sum(count)                     as views,
  count(distinct path)           as pages_touched
from public.page_views
group by month
order by month desc;

-- ---------------------------------------------------------------------------
-- 7. Export the lot, to keep outside Supabase.
--
-- Run this one and use the SQL editor's "Download CSV". The counter holds no
-- identifiers of any kind, so there is nothing sensitive in the result — it is
-- a list of paths, dates and integers.
-- ---------------------------------------------------------------------------
select path, day, count
from public.page_views
order by day desc, count desc;
