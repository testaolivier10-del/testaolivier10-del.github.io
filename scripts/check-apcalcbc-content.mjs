/* The AP® Calculus BC content check: AB's check (scripts/check-apcalc-content.mjs) run
   with the BC profile on BC's own files, calculus-bc/data/ (docs/apcalcbc-architecture.md,
   docs/apcalcbc-authoring-guide.md). What BC adds: ids cbc-<topic>-<n>, the interval
   answer type, BC's FRQ types (parametric, techniques, series) and Section II slots,
   BC's tool validators (scripts/lib/apcalcbc-tool-checks/), and a near-duplicate check
   of every BC item against AB's bank. An AB topic's file under calculus-bc/data/ fails:
   AB's topics are read from calculus/data/, never copied.

     node scripts/check-apcalcbc-content.mjs                every BC topic with content
     node scripts/check-apcalcbc-content.mjs --topic <id>   one topic (for authors)
     node scripts/check-apcalcbc-content.mjs --tools        with --topic: the tool validators too
     node scripts/check-apcalcbc-content.mjs --check        exit 1 on a failure in a PUBLISHED chapter
     APCALCBC_DATA=<dir>                                    check another data folder (tests) */
process.env.APCALC_COURSE = 'bc';
process.env.APCALC_CONTENT_MAIN = '1';
await import('./check-apcalc-content.mjs');
