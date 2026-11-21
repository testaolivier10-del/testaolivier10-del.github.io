# Simulated students (status file)

`scripts/sim-students.mjs` runs many headless browser "students" through a local copy of the site and reports what
breaks. Nothing reaches levlprep.com, Supabase or Umami: every request to another host is counted, then blocked. CI's
check-console only proves each page loads; this follows students through whole sessions.

Personas: practice set, phone (iPhone size, 4x slower CPU, slow network), full exam, random clicking, damaged saved
progress, storage full, going offline, the guided path, flashcards, review.

## First run, 2026-11-12 (all 15 courses, 10 personas each, about 150 sessions)

- Found and fixed: NREMT practice broke on damaged saved progress. Four loaders in `nremt/practice-engine.js`
  (mastery, domain stats, streak, missed list) parsed saved data with no fallback, so the page stopped at
  "Loading the settings..." and Start did nothing. They now read through `readSaved()`. The other 14 courses
  already survived the same test.
- Held up: no JavaScript errors in any other session, no sideways scrolling on the phone, visited pages work
  offline, a full storage does not stop practice, and full exams reach the results screen in Biology, Chemistry,
  Physics 1, Psychology, Macro, Micro and Human Geography.
- Not exercised (the bot's limits, not site bugs): graph questions that need dragging, the "End Part A" step in the
  calculus and precalculus exams, the ochem and A&P chapter tests, order questions.
- Small: the exam shows three "End Section I" buttons at once when the end confirmation is open.
- Size: the ochem and NREMT practice pages load a 1.1 MB question file (about 250 to 300 KB compressed). On a
  slow connection ochem practice was ready after 4.7 s, the other courses after about 2.8 s.
- Capacity: with analytics allowed (`SPOOF=1`), a visit makes about 1.5 Worker requests per page viewed (one
  Umami event per page through `api.levlprep.com`, plus directory URLs) and one Supabase `track_pageview` call per
  page. A 10 page visit is about 15 Worker requests, so the 100,000 a day free limit is about 6,500 such visits a
  day. Signed in students and Premium vault pages add more; this run was signed out.
