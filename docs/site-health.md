# Site health: search indexing, speed, capacity (status file)

Check of 2026-11-10 (owner asked: why is Google not indexing, is the site fast, can it take many users, are we
ready for teachers) and the fixes for it. Measurements: Project doc `claude/levlprep-site-health-2026-11-10.md`.

## What was found
- Google: nothing blocked. 796 pages indexed, 1,768 "Discovered, currently not indexed" (never crawled). Google
  crawls little (817 requests in two weeks, about 155 of them pages, 98% rechecks of known pages): the domain is
  8 weeks old with 12 links from other sites, and the sitemap grew from 671 to 2,700 URLs in five weeks.
- Our part: 751 Premium lesson stubs (a title and a sentence since the vault, 2026-11-08) were listed and
  indexable, and every sitewide change gave all pages the same `<lastmod>`.
- Speed: fine (edge answers in 30 to 45 ms, pages of 13 to 41 small files, scripts deferred).
- Capacity: static files are unlimited. Limits that matter, all free plans: Workers 100,000 script requests a day
  (directory URLs and every `api.levlprep.com` call), Resend 100 emails a day / 3,000 a month, Supabase 500 MB.

## Fixed in this change
- `scripts/build-sitemap.mjs` leaves out Premium lesson pages (`premiumCourse`, the vault's own rule) and takes
  `<lastmod>` from the page's text: `scripts/sitemap-dates.json` keeps each page's content hash and the day it
  last changed (seeded with the day each page was first added). 2,700 to 2,004 URLs.
- `scripts/build-deploy.mjs`: the stub carries `noindex, follow`; `_headers` caches fonts for a year and course
  covers for a week, and marks the `workers.dev` copy of the site noindex.
- `scripts/build-pricing.mjs`: the Premium Products carry `image`, `availability` and the 7-day return policy
  (Search Console's Product warnings).
- Database: `2026-11k-progress-policies.sql` drops three duplicate `user_progress` policies (applied 2026-11-10).

## Done 2026-11-10 (after the merge, PR #180)
- Sitemap resubmitted in Search Console: read the same day, 2,115 pages, status Success.
- `2026-11k-progress-policies.sql` applied; `user_progress` has only the three `user_progress_*_own` policies.
- Cloudflare, Workers Routes, `levlprep.com/*`: request limit failure mode set to "Fail open (proceed)". Past the
  100,000 a day limit visitors get the GitHub Pages copy (which has no vault) instead of error 1027.

## One page per topic in search (2026-11-11, owner: "just fix it now")
Audit of every page (owner asked why Google search is down and for the fix):
- Not found: copied text. A topic's notes page and lesson page share 3 to 14% of their wording (21% in
  AP® Precalculus); two random notes pages of one course share 1 to 6%. AP® Calculus BC's pages for AB topics
  already name the AB page as canonical. The paywall markup is the form Google documents (`isAccessibleForFree:
  false` with `hasPart`, held by site rule gated-structured-data), so it is not a defect.
- Found: every topic had two indexable pages whose titles differ by one word ("… Notes | LevlPrep" and
  "… Lesson | LevlPrep"). 292 free lessons were listed beside their notes page. On a domain two months old with
  few links, that is two URLs asking for the same search, 2,281 listed URLs in all.
- Fix: `scripts/lib/topic-twin.mjs`. A lesson whose topic has a notes page is left out of `sitemap.xml`
  (`build-sitemap.mjs`, 2,281 to 1,989 URLs) and carries `noindex, follow` in the deployed copy
  (`build-deploy.mjs`; the page itself is unchanged and stays linked from notes, path and textbook). check-site
  fails if such a lesson is listed. To undo: remove the two `notesTwin` branches.
- Not changed, for the owner to decide: 137 tool pages have about 18 words of readable text each (the tool is
  drawn by script), 98 unit pages about 200 words, 244 free-response pages about 320. They stay indexable; a short
  written explanation on each tool page would do more than hiding them.
- Expect: Google re-evaluates over months, not days. Nothing here guarantees a recovery; it removes the clearest
  pattern we control. Links from real sites (listings, teachers) are the other half.

## Open (owner)
1. Search Console: request indexing for the main notes pages (about 10 a day by hand).
2. Workers Paid ($5 a month) removes the 100,000 a day limit; worth it near 20,000 page views a day (about 3,800
   on 2026-11-10).
3. Email: Resend free is 100 a day. One class signing in with emailed codes can use it up; Resend Pro ($20 a
   month) before teacher outreach, and raise Supabase's emails per hour (Authentication, Rate Limits).
4. Teachers: see the Project doc, section 4 (a real class trial, Google consent screen out of Testing, privacy
   agreement, Class Premium price).
Not done on purpose: long caching of CSS and scripts (file names carry no version, so a deploy would show late).
