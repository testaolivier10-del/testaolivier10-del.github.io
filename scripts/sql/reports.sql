-- Reading what students report, and what the site breaks on.
--
-- Both tables are written through `security definer` functions and have RLS on
-- with no policies at all, so nothing reaching them through the API can read
-- them — including this website. The service role in the Supabase SQL editor
-- bypasses RLS, so these run there and only there:
--
--   Supabase dashboard -> SQL Editor -> New query -> paste -> Run
--
-- scripts/sql/schema.sql creates what these read. Nothing below writes
-- anything except section 4, which is the only way to close a report.

-- ===========================================================================
-- QUESTION REPORTS
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. The queue: what is open, worst first.
--
-- Sorted by how many people said the same thing, because a question three
-- separate readers flagged is far more likely to be genuinely wrong than one
-- somebody disagreed with once. A 'wrong-answer' report outranks a typo at the
-- same count for the obvious reason.
-- ---------------------------------------------------------------------------
select
  course,
  question_id,
  count(*)                                              as reports,
  count(*) filter (where reason = 'wrong-answer')       as says_key_is_wrong,
  array_agg(distinct reason)                            as reasons,
  max(created_at)                                       as last_reported,
  array_agg(note) filter (where note is not null)       as notes
from public.question_reports
where status = 'open'
group by course, question_id
order by says_key_is_wrong desc, reports desc, last_reported desc;

-- ---------------------------------------------------------------------------
-- 2. Resolving an NREMT report to the actual question.
--
-- question_id is the permanent id from nremt/assets/questions.json, not a
-- position in it, so this stays correct after the bank is edited. There is no
-- copy of the bank in the database, so this prints the id and you look it up:
--
--   grep -o '{"id":123,[^\n]*' nremt/assets/questions.json
--
-- For ochem the reference is '<engine id>:<hash of the stem>'. The engine id
-- locates it; if the hash no longer matches the stem there, the question has
-- been edited since and the report is probably already dealt with.
-- ---------------------------------------------------------------------------
select course, question_id, reason, note, created_at
from public.question_reports
where status = 'open'
order by created_at desc
limit 50;

-- ---------------------------------------------------------------------------
-- 3. Is reporting being used at all?
--
-- The number to watch after shipping it. Zero reports means either a very good
-- bank or a button nobody can find, and those look identical from here — check
-- it against the report-opened / report-sent analytics events, which say
-- whether people open the dialog and then abandon it.
-- ---------------------------------------------------------------------------
select
  date_trunc('week', created_at)::date as week,
  course,
  count(*)                             as reports,
  count(distinct question_id)          as distinct_questions
from public.question_reports
group by 1, 2
order by 1 desc, 2;

-- ---------------------------------------------------------------------------
-- 4. Closing one. The only write in this file.
--
-- 'fixed' if the question was corrected — and then add the correction to
-- changelog.html, dated, because that is what sources.html promises readers
-- happens. 'dismissed' if the question was right after all.
-- ---------------------------------------------------------------------------
-- update public.question_reports
--    set status = 'fixed'
--  where course = 'nremt' and question_id = '123' and status = 'open';

-- ===========================================================================
-- CLIENT ERRORS
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 5. What is broken, ranked by how many people hit it.
--
-- Grouped by message and position rather than listed raw: one bug on one page
-- produces one row here however many times it fired, which is the difference
-- between a list you read and a list you scroll past.
-- ---------------------------------------------------------------------------
select
  message,
  path,
  source,
  line,
  count(*)        as hits,
  min(created_at) as first_seen,
  max(created_at) as last_seen
from public.client_errors
where created_at > now() - interval '30 days'
group by message, path, source, line
order by hits desc
limit 50;

-- ---------------------------------------------------------------------------
-- 6. Did something break just now?
--
-- Run after a deploy. A new message appearing at the top of this with a
-- first_seen inside the last hour is the deploy.
-- ---------------------------------------------------------------------------
select created_at, path, message, source, line, col, agent
from public.client_errors
order by created_at desc
limit 40;

-- ---------------------------------------------------------------------------
-- 7. Is it one browser?
--
-- The reason the user-agent is collected at all. A bug that is 100% one engine
-- is a compatibility problem and is fixed differently from one that is
-- everywhere.
-- ---------------------------------------------------------------------------
select
  case
    when agent ilike '%firefox%'                      then 'Firefox'
    when agent ilike '%edg/%'                         then 'Edge'
    when agent ilike '%chrome%'                       then 'Chrome'
    when agent ilike '%safari%'                       then 'Safari'
    else 'other'
  end                                                 as browser,
  count(*)                                            as hits,
  count(distinct message)                             as distinct_errors
from public.client_errors
where created_at > now() - interval '30 days'
group by 1
order by hits desc;

-- ---------------------------------------------------------------------------
-- 8. Housekeeping.
--
-- Nothing expires these automatically. An error from four months ago on a page
-- that has been rewritten twice since is noise; delete it rather than letting
-- section 5 keep ranking it.
-- ---------------------------------------------------------------------------
-- delete from public.client_errors where created_at < now() - interval '90 days';
