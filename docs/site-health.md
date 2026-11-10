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
- Database: `2026-11k-progress-policies.sql` drops three duplicate `user_progress` policies. NOT applied yet (open step 5).

## Open (owner)
1. Search Console: resubmit `sitemap.xml`; request indexing for the main notes pages (about 10 a day by hand).
2. Cloudflare, Workers Routes, `levlprep.com/*`: set "Fail open", so past the 100,000 a day limit visitors get the
   GitHub Pages copy instead of error 1027. Workers Paid ($5 a month) removes the limit; worth it near 20,000
   page views a day (about 3,800 now).
3. Email: Resend free is 100 a day. One class signing in with emailed codes can use it up; Resend Pro ($20 a
   month) before teacher outreach, and raise Supabase's emails per hour (Authentication, Rate Limits).
4. Teachers: see the Project doc, section 4 (a real class trial, Google consent screen out of Testing, privacy
   agreement, Class Premium price).
5. Supabase SQL editor: run `scripts/sql/migrations/2026-11k-progress-policies.sql` (three `drop policy`
   lines; the policies schema.sql creates stay).
Not done on purpose: long caching of CSS and scripts (file names carry no version, so a deploy would show late).
