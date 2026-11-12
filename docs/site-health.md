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

## Search recovery route (2026-11-11, owner)
Owner's rule: search should come back without limiting the site, so nothing is hidden or removed. PR #191 (free
lessons noindex, out of the sitemap) was closed unmerged. Research behind the route is in the Project doc
`claude/levlprep-search-recovery-2026-11-11.md`: Google says a site recovers over months once its systems see the pattern is gone,
and that fewer pages alone does not lift the rest; quality is judged sitewide.
- Audit: a topic's notes and lesson share 3 to 14% of their wording (not copies). 403 of 2,281 listed pages had
  under 250 words of readable text; 137 of them were tool pages.
- Not done, on purpose: retitling lessons. "Interactive Lesson" fits the 60 character title on only about 80 of
  1,221 lessons, so the pages would be inconsistent for no gain. Notes and lesson titles already differ by label.
- Not done (owner): expert review is not available; new courses are not paused.

### Fuller tool pages
`scripts/lib/tool-about.mjs`: each AP® tool page (120, twelve courses) now carries the tool's own intro and
"how it works" (from `<course>/data/tools/<slug>.json`, math rendered) and a link to its notes page, inside the
mount as a closed "About this tool" line. The runtime replaces the mount's contents when it mounts and shows the
same text in its own About panel, so a student with JavaScript sees no change. Median 265 words a page, no new
wording. Still thin: A&P's 8 tools, ochem's 9 and the NREMT tools (other data formats), unit and chapter hubs.

### Bing and IndexNow
`scripts/indexnow.mjs` tells Bing and the other IndexNow engines which pages changed (sitemap `<lastmod>` in the
last 2 days) at the end of every deploy; the key is the file `/<key>.txt` at the site root. First run for every
page: Actions, "Deploy Worker and site", Run workflow with "indexnow_all" ticked. Google does not use IndexNow.
Owner step still open: Bing Webmaster Tools (sign in, add levlprep.com by importing from Search Console).

## Open (owner)
1. Search Console: request indexing for the main notes pages (about 10 a day by hand).
2. Workers Paid ($5 a month) removes the 100,000 a day limit; worth it near 20,000 page views a day (about 3,800
   on 2026-11-10).
3. Email: Resend free is 100 a day. One class signing in with emailed codes can use it up; Resend Pro ($20 a
   month) before teacher outreach, and raise Supabase's emails per hour (Authentication, Rate Limits).
4. Teachers: see the Project doc, section 4 (a real class trial, Google consent screen out of Testing, privacy
   agreement, Class Premium price).
Not done on purpose: long caching of CSS and scripts (file names carry no version, so a deploy would show late).
