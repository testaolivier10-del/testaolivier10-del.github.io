/* Premium — the free/premium split for every course, in one file.

   docs/premium.md has the plan and the research behind it. The rule is the
   same in every course: teaching and reference stay free, the first part of
   each course stays fully open, and Premium is serious practice — volume,
   exam simulation and the analytics on top. Passes are one-time and never
   auto-renew. Progress someone has earned is never locked.

   THE LAUNCH SWITCH
   -----------------
   LAUNCHED below is false until the checkout is connected (Polar products,
   the Worker's /premium routes and the premium_passes table; docs/premium.md
   lists the steps). Until then:
     - has() is true for everyone, so nothing anywhere is locked;
     - badge() still marks what will be Premium, so the split is visible
       from day one and the launch takes nothing away by surprise;
     - the dialog collects launch-email sign-ups, as before.
   Flipping it to true is the launch: gates lock for free users, and the
   dialog sells passes instead.

   It is a soft gate. GitHub Pages serves every file to anyone, so a
   determined visitor can always read the data; what this controls is the
   app. That is the plan's deliberate first step.

   API (window.LevlPremium)
   ------------------------
   has(course)                 true if this browser may use that course's Premium
   isFreeChapter(course, ch)   true if a chapter id is in the always-open part
   gate(course, feature, src)  '' when allowed, else the HTML of a locked card
   badge(course)               a small "Premium" pill to put next to a feature
   card(course, source)        the end-of-session upsell card ('' for members)
   open(course, source)        open the dialog directly
   quota(course)               daily free allowance: {limit, used, left, take()}
   freeExam(course)            the one free exam: {available, used, use()}
   onChange(fn)                called (now and) whenever access changes
   Locked cards and pills open the dialog through one delegated listener
   ([data-premium-open]), so a page only renders HTML. */
(function (window, document) {
  'use strict';

  var LAUNCHED = true;

  // The Cloudflare Worker that creates checkouts and receives Polar's
  // webhooks (worker/src/premium.js).
  var ENDPOINT = 'https://api.levlprep.com'; // site-config:API_URL

  var STORE_KEY = 'levlprep_waitlist_v1';
  var ACCESS_KEY = 'levlprep_premium_v1';
  var QUOTA_KEY = 'levlprep_quota_v1';
  var SCORE_KEY = 'levlprep_today_score_v1';
  // Every answer ever, per course, so a locked card can show a student how far
  // they have come (this browser only, like the daily score).
  var TALLY_KEY = 'levlprep_course_tally_v1';
  var DAILY_KEY = 'hub_daily_v1';

  /* Founding-member offer: shown in the dialog, applied at checkout by the
     Worker (its FOUNDING_DISCOUNT_ID). Set `until` to null to end it. */
  var FOUNDING = { off: 30, until: '2027-01-31' };

  // Pass-or-extend; must match the Worker's GUARANTEE (rule premium-copy).
  var GUARANTEE = { minExams: 2, claimDays: 30, extendDays: 90 };

  /* The split, per course. `free` and `premium` are what the dialog lists, so
     what someone pays for is exactly what is written here. `passes` must match
     PASSES in worker/src/premium.js; `freeChapters` is the always-open part.
     `dailyFree` is the free daily practice allowance, where a course has one.
     One entry per paid course in assets/courses.js, and `name` is that
     course's productName (scripts/check-courses.mjs checks both). */
  var COURSES = {
    nremt: {
      name: 'NREMT-EMT Prep',
      dailyFree: 15,
      // The interactive lessons of chapters 1 to 8 (docs/nremt-lessons-spec.md, owner 2026-10-26); the notes are
      // always free. Ids are 'ch' + the chapter number in nremt/assets/study-notes.json.
      freeChapters: ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8'],
      compare: 'Pocket Prep EMS is $39.99 for 3 months (checked October 2026).',
      passes: [
        { id: 'nremt-90', label: '90 days', price: 29 },
      ],
      guarantee: true, // Pass-or-extend; the wording is guaranteeText()
      free: [
        'Study notes, glossary, flowcharts, mnemonics, flashcards and the body map',
        '15 practice or review questions a day, any topic',
        'One full timed exam and one adaptive exam',
        'Your progress, XP, streak and weak topics',
      ],
      premium: [
        'The full 2,093-question bank, unlimited', // count:nremt
        'Unlimited timed and adaptive exams',
        'Unlimited missed-question review and spaced repetition',
        'Readiness score and domain breakdowns',
        'The clinical scenario simulator',
        'The interactive lessons after chapter 8',
      ],
      // The comparison table on premium.html and in the dialog: [what, Free, Premium],
      // each cell 'yes', 'no' or a short limit. Keep it true to `free` and `premium` above.
      rows: [
        ['Study notes, glossary, flashcards, flowcharts and the body map', 'yes', 'yes'],
        ['Practice and review questions', '15 a day', 'Unlimited, with spaced repetition'],
        ['Timed and adaptive exams', 'One of each', 'Unlimited'],
        ['Interactive lessons', 'Chapters 1 to 8', 'Every chapter'],
        ['Readiness score and domain breakdowns', 'no', 'yes'],
        ['Clinical scenario simulator', 'no', 'yes'],
        ['Pass-or-extend', 'no', 'yes'],
        ['Your progress, XP, streak and weak topics', 'yes', 'yes'],
      ],
    },
    ochem: {
      name: 'Organic Chemistry',
      dailyFree: 15,
      freeChapters: ['foundations', 'electron-movement', 'nomenclature', 'acids-bases'],
      passes: [
        { id: 'ochem-semester', label: 'Semester (5 months)', price: 29 },
        { id: 'ochem-year', label: 'Full year', price: 49 },
      ],
      free: [
        'The textbook section for every topic, and the flashcards',
        'The first four chapters, fully interactive',
        '15 practice or review questions a day from any chapter',
        'One full exam, and three of the interactive tools',
        'Your progress, XP, streak and weak topics',
      ],
      premium: [
        'Every interactive lesson and mechanism walkthrough',
        'The full 3,675-question bank, unlimited practice and review', // count:ochem
        'Unlimited exams',
        'Mastery dashboard and gap detection',
        'All nine interactive tools',
      ],
      // The comparison table on premium.html and in the dialog: [what, Free, Premium],
      // each cell 'yes', 'no' or a short limit. Keep it true to `free` and `premium` above.
      rows: [
        ['Textbook sections and flashcards', 'yes', 'yes'],
        ['Interactive lessons', 'First four chapters', 'Every chapter, with mechanism walkthroughs'],
        ['Practice and review questions', '15 a day', 'Unlimited'],
        ['Full exams', 'One', 'Unlimited'],
        ['Interactive tools', 'Three', 'Every tool'],
        ['Mastery dashboard and gap detection', 'no', 'yes'],
        ['Your progress, XP, streak and weak topics', 'yes', 'yes'],
      ],
    },
    anp: {
      name: 'Anatomy & Physiology',
      dailyFree: 15,
      freeChapters: ['orientation', 'chem-physics', 'cells', 'tissues', 'cell-communication'],
      passes: [
        { id: 'anp-semester', label: 'Semester (5 months)', price: 29 },
        { id: 'anp-year', label: 'Full year (A&P I and II)', price: 49 },
      ],
      free: [
        'The notes page for every topic, the glossary and the flashcards',
        'The Foundations chapters, fully interactive',
        '15 practice or review questions a day from any chapter',
        'One full exam, and three of the interactive tools',
        'Your progress, XP, streak and weak topics',
      ],
      premium: [
        'Every interactive lesson',
        'The full 3,321-question bank, unlimited practice and review', // count:anp
        'Unlimited exams',
        'All the interactive tools, including the lab practical',
        'Detailed dashboard analytics',
      ],
      // The comparison table on premium.html and in the dialog: [what, Free, Premium],
      // each cell 'yes', 'no' or a short limit. Keep it true to `free` and `premium` above.
      rows: [
        ['Notes, glossary and flashcards', 'yes', 'yes'],
        ['Interactive lessons', 'Foundations chapters', 'Every chapter'],
        ['Practice and review questions', '15 a day', 'Unlimited'],
        ['Full exams', 'One', 'Unlimited'],
        ['Interactive tools', 'Three', 'Every tool, with the lab practical'],
        ['Detailed dashboard analytics', 'no', 'yes'],
        ['Your progress, XP, streak and weak topics', 'yes', 'yes'],
      ],
    },
    apbio: {
      name: 'AP® Biology',
      dailyFree: 15,
      // Units 1 and 2 are fully open. Every skills lesson is free too, per
      // topic rather than per chapter (topic.free in bio-curriculum.js, from
      // isFreeTopic in scripts/lib/apbio-build.mjs), so skills practice still
      // counts against the daily allowance (docs/apbio-spec.md decision 10).
      freeChapters: ['unit-1', 'unit-2'],
      // A fixed-date pass: it lasts until `until` whenever it is bought, and
      // the Worker never ends it sooner (PASSES in worker/src/premium.js).
      compare: 'Fiveable is $79 a year (checked October 2026).',
      passes: [
        { id: 'bio-2027', label: 'Through June 30, 2027', price: 25, until: '2027-06-30' },
      ],
      free: [
        'Every notes page, the glossary, the flashcards and the printable unit sheets',
        'The cram-kit study plan outline, printable',
        'Every lesson in Units 1 and 2, and every skills lesson',
        'One simulator',
        '15 practice or review questions a day from any unit',
        'One full practice exam',
        'Your progress, XP, streak and weak topics',
      ],
      premium: [
        'Every interactive lesson',
        'Unlimited practice and review from the whole question bank',
        'Every simulator',
        'All free-response questions, unit tests and practice exams',
        'The cram kit: a study plan fitted to your weakest units, and timed mixed sets',
        'The full dashboard: mastery by unit, topic and science practice',
      ],
      // The comparison table on premium.html and in the dialog: [what, Free, Premium],
      // each cell 'yes', 'no' or a short limit. Keep it true to `free` and `premium` above.
      rows: [
        ['Notes, glossary, flashcards and unit sheets', 'yes', 'yes'],
        ['Interactive lessons', 'Units 1 and 2, and skills lessons', 'Every unit'],
        ['Practice and review questions', '15 a day', 'Unlimited'],
        ['Simulators', 'One', 'Every simulator'],
        ['Free-response questions and unit tests', 'no', 'yes'],
        ['Full practice exams', 'One', 'Every one'],
        ['Cram kit study plan', 'Outline', 'Fitted to your weakest units'],
        ['Mastery dashboard', 'no', 'By unit, topic and science practice'],
        ['Your progress, XP, streak and weak topics', 'yes', 'yes'],
      ],
    },
    apchem: {
      name: 'AP® Chemistry',
      dailyFree: 15,
      // As AP® Biology: Units 1 and 2 open, and every math-skills lesson
      // (topic.free in chem-curriculum.js, isFreeTopic in scripts/lib/apchem-build.mjs).
      freeChapters: ['unit-1', 'unit-2'],
      compare: 'Fiveable is $79 a year (checked October 2026).',
      passes: [
        { id: 'chem-2027', label: 'Through June 30, 2027', price: 25, until: '2027-06-30' },
      ],
      free: [
        'Every notes page, the glossary, the flashcards and the printable unit sheets',
        'The cram-kit study plan outline, printable',
        'Every lesson in Units 1 and 2, and every math refresher lesson',
        'Five tools: periodic trends, particle diagrams, ICE tables, titration curves and units and sig figs',
        '15 practice or review questions a day from any unit',
        'One full practice exam',
        'Your progress, XP, streak and weak topics',
      ],
      premium: [
        'Every interactive lesson',
        'Unlimited practice and review from the whole question bank',
        'Every tool, adding Q vs K, the buffer drills and equilibrium and kinetics, plus the justification trainer',
        'All free-response questions, unit tests and practice exams',
        'The cram kit: a study plan fitted to your weakest units, and timed mixed sets',
        'The full dashboard: mastery by unit, topic and science practice',
      ],
      // The comparison table on premium.html and in the dialog: [what, Free, Premium],
      // each cell 'yes', 'no' or a short limit. Keep it true to `free` and `premium` above.
      rows: [
        ['Notes, glossary, flashcards and unit sheets', 'yes', 'yes'],
        ['Interactive lessons', 'Units 1 and 2, and math refreshers', 'Every unit'],
        ['Practice and review questions', '15 a day', 'Unlimited'],
        ['Interactive tools', 'Five', 'Every tool'],
        ['Justification trainer', 'no', 'yes'],
        ['Free-response questions and unit tests', 'no', 'yes'],
        ['Full practice exams', 'One', 'Every one'],
        ['Cram kit study plan', 'Outline', 'Fitted to your weakest units'],
        ['Mastery dashboard', 'no', 'By unit, topic and science practice'],
        ['Your progress, XP, streak and weak topics', 'yes', 'yes'],
      ],
    },
    apphys: {
      name: 'AP® Physics 1',
      dailyFree: 15,
      // As AP® Chemistry (docs/apphys-spec.md decision 3): Units 1 and 2 open,
      // and every "Math you need" lesson (isFreeTopic in scripts/lib/apphys-build.mjs).
      freeChapters: ['unit-1', 'unit-2'],
      compare: 'Fiveable is $79 a year (checked October 2026).',
      passes: [
        { id: 'phys-2027', label: 'Through June 30, 2027', price: 25, until: '2027-06-30' },
      ],
      free: [
        'Every notes page, the glossary, the flashcards and the printable unit sheets',
        'The cram-kit study plan outline, printable',
        'Every lesson in Units 1 and 2, and every "Math you need" lesson',
        '15 practice or review questions a day from any unit',
        'One full practice exam',
        'Three trainers: free-body diagrams, motion graphs and the scaling drills',
        'Your progress, XP, streak and weak topics',
      ],
      premium: [
        'Every interactive lesson',
        'Unlimited practice and review from the whole question bank',
        'Every trainer: free-body diagrams, motion graphs, energy bar charts, collisions, lab design and more',
        'All free-response questions, unit tests and practice exams',
        'The cram kit: a study plan fitted to your weakest units, and timed mixed sets',
        'The full dashboard: mastery by unit, topic and science practice',
      ],
      // The comparison table on premium.html and in the dialog: [what, Free, Premium],
      // each cell 'yes', 'no' or a short limit. Keep it true to `free` and `premium` above.
      rows: [
        ['Notes, glossary, flashcards and unit sheets', 'yes', 'yes'],
        ['Interactive lessons', 'Units 1 and 2, and math lessons', 'Every unit'],
        ['Practice and review questions', '15 a day', 'Unlimited'],
        ['Trainers', 'Three', 'Every trainer'],
        ['Free-response questions and unit tests', 'no', 'yes'],
        ['Full practice exams', 'One', 'Every one'],
        ['Cram kit study plan', 'Outline', 'Fitted to your weakest units'],
        ['Mastery dashboard', 'no', 'By unit, topic and science practice'],
        ['Your progress, XP, streak and weak topics', 'yes', 'yes'],
      ],
    },
    apcalc: {
      name: 'AP® Calculus AB',
      dailyFree: 15,
      // As AP® Physics 1 (docs/apcalc-spec.md decision 3): Units 1 and 2 open,
      // and every "Math you need" lesson (isFreeTopic in scripts/lib/apcalc-build.mjs).
      freeChapters: ['unit-1', 'unit-2'],
      compare: 'Fiveable is $79 a year (checked October 2026).',
      passes: [
        { id: 'calc-2027', label: 'Through June 30, 2027', price: 25, until: '2027-06-30' },
      ],
      free: [
        'Every notes page, the glossary, the flashcards and the printable unit sheets',
        'The cram-kit study plan outline, printable',
        'Every lesson in Units 1 and 2, and every "Math you need" lesson',
        '15 practice or review questions a day from any unit',
        'One full practice exam',
        'Three trainers: the tangent tracer, the limit explorer and the rule drills',
        'Your progress, XP, streak and weak topics',
      ],
      premium: [
        'Every interactive lesson',
        'Unlimited practice and review from the whole question bank',
        'Every trainer: related rates, motion, curve analysis, Riemann sums, accumulation, slope fields, area and volume',
        'All free-response questions, unit tests and practice exams',
        'The cram kit: a study plan fitted to your weakest units, and timed mixed sets',
        'The full dashboard: mastery by unit, topic and mathematical practice',
      ],
      // The comparison table on premium.html and in the dialog: [what, Free, Premium],
      // each cell 'yes', 'no' or a short limit. Keep it true to `free` and `premium` above.
      rows: [
        ['Notes, glossary, flashcards and unit sheets', 'yes', 'yes'],
        ['Interactive lessons', 'Units 1 and 2, and math lessons', 'Every unit'],
        ['Practice and review questions', '15 a day', 'Unlimited'],
        ['Trainers', 'Three', 'Every trainer'],
        ['Free-response questions and unit tests', 'no', 'yes'],
        ['Full practice exams', 'One', 'Every one'],
        ['Cram kit study plan', 'Outline', 'Fitted to your weakest units'],
        ['Mastery dashboard', 'no', 'By unit, topic and mathematical practice'],
        ['Your progress, XP, streak and weak topics', 'yes', 'yes'],
      ],
    },
    apstat: {
      name: 'AP® Statistics',
      dailyFree: 15,
      // The free tier (docs/apstat-spec.md decision 10, proposed): Unit 1 and
      // every "Math you need" lesson. Keep in step with FREE_UNITS in
      // scripts/lib/apstat-build.mjs (build-pricing --check compares them).
      freeChapters: ['unit-1'],
      compare: 'Fiveable is $79 a year (checked October 2026).',
      passes: [
        { id: 'stat-2027', label: 'Through June 30, 2027', price: 25, until: '2027-06-30' },
      ],
      free: [
        'Every notes page, the glossary, the flashcards and the printable unit sheets',
        'The reference sheet, explained, and the cram-kit study plan outline',
        'Every lesson in Unit 1, and every "Math you need" lesson',
        '15 practice or review questions a day from any unit',
        'One full practice exam',
        'Three trainers: the sampling distribution machine, the data explorer and probability trees',
        'Your progress, XP, streak and weak topics',
      ],
      premium: [
        'Every interactive lesson',
        'Unlimited practice and review from the whole question bank',
        'Every trainer: sampling, experiments, distribution areas, interval capture, p-values and power, chi-square and regression',
        'All free-response questions, unit tests and practice exams',
        'The cram kit: a study plan fitted to your weakest units, and timed mixed sets',
        'The full dashboard: mastery by unit, topic and skill',
      ],
      // The comparison table on premium.html and in the dialog: [what, Free, Premium],
      // each cell 'yes', 'no' or a short limit. Keep it true to `free` and `premium` above.
      rows: [
        ['Notes, glossary, flashcards and unit sheets', 'yes', 'yes'],
        ['The reference sheet, explained', 'yes', 'yes'],
        ['Interactive lessons', 'Unit 1, and math lessons', 'Every unit'],
        ['Practice and review questions', '15 a day', 'Unlimited'],
        ['Trainers', 'Three', 'Every trainer'],
        ['Free-response questions and unit tests', 'no', 'yes'],
        ['Full practice exams', 'One', 'Every one'],
        ['Cram kit study plan', 'Outline', 'Fitted to your weakest units'],
        ['Mastery dashboard', 'no', 'By unit, topic and skill'],
        ['Your progress, XP, streak and weak topics', 'yes', 'yes'],
      ],
    },
    apenv: {
      name: 'AP® Environmental Science',
      // On sale since 2026-10-20: Polar product 5741d35c-eab1-4601-805d-3821981e36c8
      // ("env-2027" in the Worker's POLAR_PRODUCTS; docs/apenv-spec.md checklist).
      dailyFree: 15,
      // The free tier (docs/apenv-spec.md decision 9, proposed): Units 1 and 2
      // and every "Math you need" lesson. Keep in step with FREE_UNITS in
      // scripts/lib/apenv-build.mjs.
      freeChapters: ['unit-1', 'unit-2'],
      compare: 'Fiveable is $79 a year (checked October 2026).',
      passes: [
        { id: 'env-2027', label: 'Through June 30, 2027', price: 25, until: '2027-06-30' },
      ],
      free: [
        'Every notes page, the glossary, the flashcards and the printable unit sheets',
        'The formulas you must memorize, explained, and the cram-kit study plan outline',
        'Every lesson in Units 1 and 2, and every "Math you need" lesson',
        '15 practice or review questions a day from any unit',
        'One full practice exam',
        'Three trainers: the calculation studio, energy flow and the nutrient cycles',
        'Your progress, XP, streak and weak topics',
      ],
      premium: [
        'Every interactive lesson',
        'Unlimited practice and review from the whole question bank',
        'Every trainer: population growth, age structure, soil, climate, energy, pollution, dose-response and climate change',
        'All free-response questions, unit tests and practice exams',
        'The cram kit: a study plan fitted to your weakest units, and timed mixed sets',
        'The full dashboard: mastery by unit, topic and science practice',
      ],
      // The comparison table on premium.html and in the dialog: [what, Free, Premium],
      // each cell 'yes', 'no' or a short limit. Keep it true to `free` and `premium` above.
      rows: [
        ['Notes, glossary, flashcards and unit sheets', 'yes', 'yes'],
        ['The formulas to memorize, explained', 'yes', 'yes'],
        ['Interactive lessons', 'Units 1 and 2, and math lessons', 'Every unit'],
        ['Practice and review questions', '15 a day', 'Unlimited'],
        ['Trainers', 'Three', 'Every trainer'],
        ['Free-response questions and unit tests', 'no', 'yes'],
        ['Full practice exams', 'One', 'Every one'],
        ['Cram kit study plan', 'Outline', 'Fitted to your weakest units'],
        ['Mastery dashboard', 'no', 'By unit, topic and science practice'],
        ['Your progress, XP, streak and weak topics', 'yes', 'yes'],
      ],
    },
    appsych: {
      name: 'AP® Psychology',
      // On sale since 2026-10-27 (docs/appsych-spec.md, launch checklist):
      // Polar product 409e7c83-6820-441d-867d-eb10cc320507.
      dailyFree: 15,
      // The free tier (docs/appsych-spec.md decision 9, proposed): Unit 1 and
      // every "Research skills you need" lesson. Keep in step with FREE_UNITS
      // in scripts/lib/appsych-build.mjs.
      freeChapters: ['unit-1'],
      compare: 'Fiveable is $79 a year (checked October 2026).',
      passes: [
        { id: 'psy-2027', label: 'Through June 30, 2027', price: 25, until: '2027-06-30' },
      ],
      free: [
        'Every notes page, the glossary, the flashcards and the printable unit sheets',
        'The statistics you must know, explained, and the cram-kit study plan outline',
        'Every lesson in Unit 1, and every "Research skills you need" lesson',
        '15 practice or review questions a day from any unit',
        'One full practice exam',
        'Three trainers: the article analysis studio, the neuron and the brain map',
        'Your progress, XP, streak and weak topics',
      ],
      premium: [
        'Every interactive lesson',
        'Unlimited practice and review from the whole question bank',
        'Every trainer: the evidence builder, sensation, memory, conditioning, development, social influence and the stats lab',
        'All free-response questions, unit tests and practice exams',
        'The cram kit: a study plan fitted to your weakest units, and timed mixed sets',
        'The full dashboard: mastery by unit, topic and science practice',
      ],
      // The comparison table on premium.html and in the dialog: [what, Free, Premium],
      // each cell 'yes', 'no' or a short limit. Keep it true to `free` and `premium` above.
      rows: [
        ['Notes, glossary, flashcards and unit sheets', 'yes', 'yes'],
        ['The statistics to know, explained', 'yes', 'yes'],
        ['Interactive lessons', 'Unit 1, and research skills lessons', 'Every unit'],
        ['Practice and review questions', '15 a day', 'Unlimited'],
        ['Trainers', 'Three', 'Every trainer'],
        ['Free-response questions and unit tests', 'no', 'yes'],
        ['Full practice exams', 'One', 'Every one'],
        ['Cram kit study plan', 'Outline', 'Fitted to your weakest units'],
        ['Mastery dashboard', 'no', 'By unit, topic and science practice'],
        ['Your progress, XP, streak and weak topics', 'yes', 'yes'],
      ],
    },
  };

  // Which course a page belongs to, for returnCourse().
  // courses:begin COURSE_LIST key,path (generated from assets/courses.js by scripts/build-courses.mjs; edit there)
  var COURSE_LIST = [
    { key: 'nremt', path: '/nremt/' },
    { key: 'ochem', path: '/ochem/' },
    { key: 'anp', path: '/anatomy-physiology/' },
    { key: 'apbio', path: '/bio/' },
    { key: 'apchem', path: '/chem/' },
    { key: 'apphys', path: '/physics/' },
    { key: 'apcalc', path: '/calculus/' },
    { key: 'apstat', path: '/statistics/' },
    { key: 'apenv', path: '/environmental-science/' },
    { key: 'appsych', path: '/psychology/' },
  ];
  // courses:end

  var overlay = null;
  var lastFocused = null;
  var active = null; // { course, source }
  var listeners = [];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function readJson(key) {
    try { return JSON.parse(window.localStorage.getItem(key)) || {}; }
    catch (e) { return {}; }
  }
  function writeJson(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { /* private mode: nothing to remember, nothing breaks */ }
  }

  /* ---- access ---------------------------------------------------------- */

  /* { userId, courses: { nremt: '2027-01-01T…Z' } }, cached so a page knows on
     first paint, and tied to the user it was read for so signing out (or in as
     somebody else) never inherits another person's pass. */
  function access() { return readJson(ACCESS_KEY); }

  function currentUserId() {
    var a = window.StudyHubAccount;
    var u = a && a.user ? a.user() : null;
    if (u) return u.id;
    /* Before the session is restored, the id of the session this browser
       holds, so a Premium member's page is unlocked at first paint instead of
       rendering locked and reloading (account.js, pendingUserId). Only ever
       paired with the cached pass of that same id, and dropped the moment the
       real session is known. */
    return a && a.pendingUserId ? a.pendingUserId() : null;
  }

  /* Signed out is never Premium: the cache counts only for the loaded user
     it was read for (refresh() unlocks once the session is restored).
     Trusting it before then was a one-line console unlock. */
  function expiry(course) {
    var uid = currentUserId();
    if (!uid) return null;
    var a = access();
    if (!a.courses || a.userId !== uid) return null;
    var t = a.courses[course] ? Date.parse(a.courses[course]) : NaN;
    return isNaN(t) ? null : t;
  }

  /* A course can wait for its own checkout after the site has launched:
     `onSale: false` in COURSES keeps it as before launch (nothing locked,
     "Coming soon" cards, launch-email sign-ups) until its product exists. */
  function live(course) {
    return LAUNCHED && !(COURSES[course] && COURSES[course].onSale === false);
  }

  function has(course) {
    if (!live(course)) return true;
    var t = expiry(course);
    return t !== null && t > Date.now();
  }

  function isFreeChapter(course, chapter) {
    var c = COURSES[course];
    return !!c && c.freeChapters.indexOf(chapter) !== -1;
  }

  function notify() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](); } catch (e) { /* one page's bug is not another's */ }
    }
  }
  function onChange(fn) { listeners.push(fn); fn(); }

  /* Asks my_premium() (scripts/sql/schema.sql) which started passes this
     user holds. An empty answer clears the cache, so a refund locks the next
     page; a failed call keeps it (offline is not a refund) and is reported
     once after REFRESH_REPORT_AFTER in a row. */
  var REFRESH_REPORT_AFTER = 3;
  var refreshFailures = 0;
  var refreshReported = false;
  var seenUser = false;
  function refresh() {
    var a = window.StudyHubAccount;
    var uid = currentUserId();
    if (!uid) {
      if (seenUser) { seenUser = false; clearAccess(); notify(); }
      return Promise.resolve(false);
    }
    seenUser = true;
    // The cached pass belongs to this user: unlock now, confirm below.
    if (access().userId === uid) notify();
    if (!a || !a.rpcData) return Promise.resolve(false);
    /* The id came from the session hint, not a restored session: asking the
       database now would run as nobody and clear a real pass. onAuthChange
       calls refresh() again once the session is known. */
    if (!(a.user && a.user()) && !(a.settled && a.settled())) return Promise.resolve(false);
    return a.rpcData('my_premium', {}).then(function (rows) {
      if (!Array.isArray(rows)) { refreshFailed(); return false; }
      refreshFailures = 0;
      if (currentUserId() !== uid) return false; // signed out or switched meanwhile
      var courses = {};
      rows.forEach(function (r) { if (r && r.course && r.expires_at) courses[r.course] = r.expires_at; });
      writeJson(ACCESS_KEY, { userId: uid, courses: courses, syncedAt: Date.now() });
      notify();
      return true;
    });
  }

  function clearAccess() {
    try { window.localStorage.removeItem(ACCESS_KEY); }
    catch (e) { /* private mode: nothing was cached */ }
  }

  function refreshFailed() {
    refreshFailures++;
    if (refreshFailures < REFRESH_REPORT_AFTER || refreshReported) return;
    refreshReported = true;
    var errs = window.LevlErrors;
    if (errs && errs.report) {
      try { errs.report('premium: my_premium failed ' + refreshFailures + ' times in a row', 'assets/premium.js', null, null, ''); }
      catch (e) { /* reporting must never break a page */ }
    }
  }

  // When access was last confirmed for the signed-in user (ms), or null.
  function lastSynced() {
    var a = access();
    var uid = currentUserId();
    return uid && a.userId === uid && typeof a.syncedAt === 'number' ? a.syncedAt : null;
  }

  /* A finished timed exam, stamped by the database (record_exam_completion),
     which the NREMT guarantee counts instead of browser-written history. */
  function recordExam(course, questions) {
    var a = window.StudyHubAccount;
    if (!COURSES[course] || !currentUserId() || !a || !a.rpc) return Promise.resolve(false);
    return a.rpc('record_exam_completion', { p_course: course, p_questions: Math.round(Number(questions) || 0) });
  }

  /* ---- the daily free allowance ----------------------------------------- */

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /* Counted in this browser, reset at local midnight. Members and courses
     without an allowance get an unlimited quota, so callers never branch. */
  function quota(course) {
    var c = COURSES[course];
    var unlimited = !c || !c.dailyFree || has(course);
    var store = readJson(QUOTA_KEY);
    var mine = store[course] && store[course].day === today() ? store[course].used : 0;
    var limit = unlimited ? Infinity : c.dailyFree;
    return {
      limit: limit,
      used: mine,
      left: Math.max(0, limit - mine),
      take: function (n) {
        if (unlimited) return true;
        n = n || 1;
        var s = readJson(QUOTA_KEY);
        var used = s[course] && s[course].day === today() ? s[course].used : 0;
        if (used + n > limit) return false;
        s[course] = { day: today(), used: used + n };
        writeJson(QUOTA_KEY, s);
        return true;
      },
    };
  }

  /* Today's score per course, so the daily-limit card can show the student
     what they did before asking them to pay (trust plan, 2026-10-08). Every
     course's answer check calls noteAnswer; it is kept in this browser only
     and reset at local midnight. */
  function noteAnswer(course, correct, qid, topic) {
    // Every answer, for the per-question tallies (analytics.js answer()).
    var an = window.LevlAnalytics;
    if (an && an.answer && qid != null) an.answer(course, qid, correct, topic);
    if (!COURSES[course]) return;
    // A friend who joined from an invite: their first 20 answers earn the sharer's reward (assets/invite.js).
    try {
      if (localStorage.getItem('levlprep_invite_counting_v1') && window.LevlLazy) {
        window.LevlLazy('invite', function (I) { I.answer(course); });
      }
    } catch (e) { /* storage blocked: nothing to count */ }
    var s = readJson(SCORE_KEY);
    var t = s[course] && s[course].day === today() ? s[course] : { day: today(), right: 0, total: 0 };
    t.total++;
    if (correct) t.right++;
    s[course] = t;
    writeJson(SCORE_KEY, s);
    var all = readJson(TALLY_KEY);
    var a = all[course] || { right: 0, total: 0 };
    a.total++;
    if (correct) a.right++;
    all[course] = a;
    writeJson(TALLY_KEY, all);
    // Right and total per course per day, for the dashboard's weekly accuracy line (assets/course/dash.js,
    // docs/dashboard.md). 180 days kept. hub_ prefix: progress-backup.js keeps it; not synced, like the exam date.
    var log = readJson(DAILY_KEY);
    if (!log.days) log = { v: 1, days: {} };
    var d = new Date(), k = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    var day = log.days[k] || (log.days[k] = {});
    // A course's first logged answer today starts from today's score, which already counts this answer, so a
    // day that began before the log existed is not undercounted.
    if (day[course]) { day[course][1]++; if (correct) day[course][0]++; }
    else day[course] = [t.right, t.total];
    var keys = Object.keys(log.days).sort();
    while (keys.length > 180) delete log.days[keys.shift()];
    writeJson(DAILY_KEY, log);
  }
  function courseTally(course) {
    var a = readJson(TALLY_KEY)[course];
    return a ? { right: a.right, total: a.total } : { right: 0, total: 0 };
  }
  function todayScore(course) {
    var t = readJson(SCORE_KEY)[course];
    return t && t.day === today() ? { right: t.right, total: t.total } : { right: 0, total: 0 };
  }

  /* The Premium funnel: Umami gets the event as before, and an anonymous
     daily count goes to the database (count_premium_step in
     scripts/sql/schema.sql), so the funnel can be read back without Umami:
     card seen -> dialog opened -> checkout started -> paid. No user, no
     browser id, just a number per day; skipped when analytics is turned off. */
  var funnelSeen = {};
  function funnel(step, course, data) {
    var an = window.LevlAnalytics;
    if (an) an.event('premium-' + step, data);
    if (step === 'gate-shown' || step === 'limit-hit') {
      var k = course + ':' + (data && data.feature);
      if (funnelSeen[k]) return;
      funnelSeen[k] = true;
    }
    if (an && an.optedOut && an.optedOut()) return;
    // Paid is counted by the Worker's webhook, not by a browser.
    if (step === 'checkout-paid') return;
    var a = window.StudyHubAccount;
    if (a && a.rpc && course) a.rpc('count_premium_step', { p_course: course, p_step: step });
    // The same step credited to the video that sent this browser, if any.
    var ref = an && an.attributedRef ? an.attributedRef() : null;
    if (ref && a && a.trackRef) a.trackRef(ref, step);
  }

  /* ---- the free exam -------------------------------------------------------

     One full exam per course for free users. Used up when it starts (an
     attempt in progress can always be finished); remembered in this browser.
     Members and pre-launch visitors are never limited. NREMT keeps its own
     synced flag (nremt/assets/premium-gates.js) and does not use this. */
  var EXAM_KEY = 'levlprep_free_exam_v1';
  function freeExam(course) {
    var unlimited = !COURSES[course] || has(course);
    var used = !unlimited && readJson(EXAM_KEY)[course] === true;
    return {
      unlimited: unlimited,
      used: used,
      available: unlimited || !used,
      use: function () {
        if (unlimited) return true;
        var s = readJson(EXAM_KEY);
        if (s[course] === true) return false;
        s[course] = true;
        writeJson(EXAM_KEY, s);
        return true;
      },
    };
  }

  /* ---- what a page renders ---------------------------------------------- */

  function openAttrs(course, source) {
    return ' data-premium-open="' + esc(course) + '" data-premium-source="' + esc(source || '') + '"';
  }

  function badge(course) {
    if (!COURSES[course]) return '';
    if (live(course) && has(course)) return '';
    return '<button type="button" class="premium-badge"' + openAttrs(course, 'badge') +
      ' title="' + (live(course) ? 'Part of Premium' : 'Part of Premium — free until it launches') + '">Premium</button>';
  }

  // The lowest pass price, at the founding price while it runs, so the cards
  // show what someone would actually pay.
  function fromPrice(c) {
    var low = Math.min.apply(null, c.passes.map(function (x) { return x.price; }));
    if (!foundingLive()) return '$' + low;
    return '$' + money(low * (100 - FOUNDING.off) / 100) + ' (founding price, then $' + low + ')';
  }

  // How long the cheapest pass lasts, so the price line says what it buys
  // (audit 2026-10, A&P "Premium box": the price had no pass length).
  function passLength(c) {
    var low = c.passes.reduce(function (a, b) { return b.price < a.price ? b : a; });
    if (low.until) return 'a pass valid through ' + untilText(low.until);
    var m = /(\d+\s*(?:days?|months?))/i.exec(low.label);
    return m ? m[1] : (/year/i.test(low.label) ? 'a year' : low.label);
  }

  function money(n) {
    return (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '');
  }

  /* The price per day of access under each pass. A small one-time price reads
     smaller per day than as one total (Gourville 1998; Atlas & Bartels 2018;
     docs/trust-conversion-plan.md, 2026-10-25). Days match the Worker's PASSES;
     a dated pass counts the days it has left. */
  var PASS_DAYS = { '-90': 90, '-semester': 150, '-year': 365 };
  function passDays(p) {
    if (p.until) return Math.max(1, Math.ceil((Date.parse(p.until + 'T23:59:59-10:00') - Date.now()) / 864e5));
    for (var k in PASS_DAYS) if (p.id.slice(-k.length) === k) return PASS_DAYS[k];
    return 0;
  }
  function nowPrice(p) { return foundingLive() ? p.price * (100 - FOUNDING.off) / 100 : p.price; }
  function dayText(p) {
    var d = passDays(p);
    if (!d) return '';
    var cents = Math.max(1, Math.round(nowPrice(p) * 100 / d));
    return 'about ' + (cents < 100 ? cents + '¢' : '$' + money(cents / 100)) + ' a day';
  }
  function perDay(passId) {
    for (var k in COURSES) {
      var hit = COURSES[k].passes.filter(function (p) { return p.id === passId; })[0];
      if (hit) return dayText(hit);
    }
    return '';
  }

  /* ---- the Free vs Premium table (owner 2026-10-28) ----------------------
     One row per thing a student gets, Free on the left and Premium on the
     right, so the upgrade reads at a glance: every Premium cell is a check or
     "more", and Free shows its real limit rather than an empty X (a fairer
     picture of how much is free). Used by premium.html and the dialog. */
  var ICON_YES = '<svg class="pc-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var ICON_NO = '<svg class="pc-ic pc-ic--no" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10"/></svg>';
  function cellHtml(v) {
    if (v === 'yes') return ICON_YES + '<span class="sr-only">Included</span>';
    if (v === 'no') return ICON_NO + '<span class="sr-only">Not included</span>';
    return esc(v);
  }
  function tableHtml(course, priceHtml) {
    var c = COURSES[course];
    if (!c || !c.rows) return '';
    return '<div class="table-wrap pc-wrap"><table class="pc-table"><caption class="sr-only">Free and Premium in ' + esc(c.name) + '</caption>' +
      '<thead><tr><th scope="col" class="pc-what">What you get</th>' +
      '<th scope="col" class="pc-free"><span class="pc-plan">Free</span><span class="pc-amt">$0</span></th>' +
      '<th scope="col" class="pc-prem"><span class="pc-plan">Premium</span><span class="pc-amt">' + (priceHtml || '') + '</span></th></tr></thead><tbody>' +
      c.rows.map(function (r) {
        return '<tr><th scope="row">' + esc(r[0]) + '</th><td class="pc-free">' + cellHtml(r[1]) + '</td><td class="pc-prem">' + cellHtml(r[2]) + '</td></tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  /* The one reassurance line, said once under every buy button instead of in
     several places (research 2026-10-28: repeating one offer makes people
     look for the catch). */
  var SURE = 'Full refund within 7 days · Never renews · Secure checkout by Polar';

  function lowestPass(c) { return c.passes.reduce(function (a, b) { return b.price < a.price ? b : a; }); }
  /* The founding price says when the full price starts instead of striking
     through a price nobody has paid yet (FTC 16 CFR 233). */
  function dayAfter(iso) {
    var t = Date.parse(iso + 'T12:00:00Z');
    return isNaN(t) ? '' : untilText(new Date(t + 864e5).toISOString().slice(0, 10));
  }
  function foundingLine(p) {
    return foundingLive() ? 'Founding price · $' + money(p.price) + ' from ' + dayAfter(FOUNDING.until) : '';
  }
  function buyLabel(p) { return 'Unlock for $' + money(nowPrice(p)); }
  function ctaLabel(c) {
    return c.passes.length === 1 ? buyLabel(c.passes[0]) : 'See Premium, from $' + money(nowPrice(lowestPass(c)));
  }

  function gate(course, feature, source) {
    var c = COURSES[course];
    if (!c || has(course)) return '';
    return '<div class="premium-card premium-lock" data-premium-course="' + esc(course) + '" data-premium-feature="' + esc(feature || '') + '">' +
      '<span class="premium-card__tag">Premium</span>' +
      '<b>' + esc(lockTitle(feature)) + '</b>' +
      scoreLine(course, feature) +
      progressLine(course, feature) +
      '<p>' + esc(c.premium.slice(0, 3).join(' · ')) + '.</p>' +
      '<span class="premium-card__price">From ' + fromPrice(c) + ' for ' + passLength(c) + ', one-time. No subscription.</span>' +
      yearLine(c) +
      (c.guarantee ? '<p class="premium-card__guarantee">Includes Pass-or-extend: don’t pass the NREMT, and you can claim a free extension (conditions apply).</p>' : '') +
      '<button type="button" class="btn-press sm"' + openAttrs(course, source || feature) + '>' + esc(ctaLabel(c)) + '</button>' +
      tomorrowLine(course, feature) +
    '</div>';
  }

  /* The other honest answer at the daily limit: the free questions come
     back. A student who is not buying today should leave knowing there is a
     reason to return tomorrow, not that the door is shut. */
  function tomorrowLine(course, feature) {
    if (feature !== 'daily-limit') return '';
    return '<p class="premium-card__tomorrow">Not today? You get ' + COURSES[course].dailyFree +
      ' free questions again tomorrow, and the study notes stay open now.</p>';
  }

  function scoreLine(course, feature) {
    if (feature !== 'daily-limit') return '';
    var t = todayScore(course);
    if (!t.total) return '';
    return '<p class="premium-card__score">You got <strong>' + t.right + ' of ' + t.total + '</strong> right today. Keep going with unlimited practice.</p>';
  }

  /* On every other locked card: the student's own work in this course so far,
     shown once there is enough of it to mean something. Their numbers, not a
     sales claim (docs/trust-conversion-plan.md, 2026-10-20). */
  var PROGRESS_MIN = 10;
  function progressLine(course, feature) {
    if (feature === 'daily-limit') return '';
    var a = courseTally(course);
    if (a.total < PROGRESS_MIN) return '';
    return '<p class="premium-card__progress">So far you’ve answered <strong>' + a.total + ' questions</strong> here, ' +
      Math.round(a.right * 100 / a.total) + '% right. Premium picks up from there.</p>';
  }

  /* A dated pass (the AP® ones) ends on the same day whenever it is bought,
     so starting earlier simply covers more of the school year. */
  function yearLine(c) {
    var low = c.passes.reduce(function (a, b) { return b.price < a.price ? b : a; });
    if (!low.until) return '';
    return '<p class="premium-card__year">It runs through ' + untilText(low.until) +
      ' whenever you buy it, so the sooner you start, the more of this school year it covers.</p>';
  }

  function lockTitle(feature) {
    if (feature === 'daily-limit') return 'That’s today’s 15 free questions';
    if (feature === 'exam') return 'You’ve used your free timed exam';
    if (feature === 'cat') return 'You’ve used your free adaptive exam';
    return 'This is part of Premium';
  }

  function joined(course) { return readJson(STORE_KEY)[course] === true; }
  function markJoined(course) {
    var s = readJson(STORE_KEY);
    s[course] = true;
    writeJson(STORE_KEY, s);
  }

  /* The card under a finished session. Before launch it asks for a launch
     email; after, it offers the passes. Members see nothing. */
  function card(course, source) {
    var c = COURSES[course];
    if (!c) return '';
    if (live(course) && has(course)) return '';
    if (!live(course) && joined(course)) {
      return '<div class="premium-card is-joined">' +
        '<b>You’re on the Premium list</b>' +
        '<p>We’ll email you once, when it launches.</p>' +
      '</div>';
    }
    return '<div class="premium-card">' +
      '<span class="premium-card__tag">' + (live(course) ? 'Premium' : 'Coming soon') + '</span>' +
      '<b>Premium for ' + esc(c.name) + '</b>' +
      '<span class="premium-card__price">From ' + fromPrice(c) + ' for ' + passLength(c) + ', one-time</span>' +
      '<p>' + esc(c.premium.slice(0, 3).join(' · ')) + '.</p>' +
      (live(course) ? yearLine(c) : '') +
      '<button type="button" class="btn-press sm"' + openAttrs(course, source) + '>' +
        (live(course) ? esc(ctaLabel(c)) : 'Get notified') + '</button>' +
    '</div>';
  }

  /* ---- the dialog ------------------------------------------------------- */

  // Shown by the dialog, the account page and premium.html alike.
  function guaranteeText() {
    var g = GUARANTEE;
    return 'Pass-or-extend: take the NREMT cognitive exam during an NREMT pass you bought and don’t pass, ' +
      'and you can claim one free ' + g.extendDays + '-day extension from your Account page within ' +
      g.claimDays + ' days of the exam. It needs at least ' + g.minExams + ' full timed or adaptive exams on LevlPrep, ' +
      'finished while signed in, during your pass and before the real exam, and the legal name and state you tested under. ' +
      'Once per account and email address. It extends your access; it is not a refund.';
  }

  function foundingLive() {
    return !!(FOUNDING.until && Date.now() < Date.parse(FOUNDING.until + 'T23:59:59Z'));
  }

  /* "June 30, 2027" from a pass's `until` ("2027-06-30"), the day as written. */
  function untilText(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return String(iso || '');
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1];
  }

  function passHtml(course, p) {
    var f = foundingLine(p);
    return '<li class="premium-pass">' +
      '<span><b>' + esc(p.until ? 'One pass, valid through ' + untilText(p.until) : p.label) + '</b>' +
      ' <b class="premium-pass__now">$' + money(nowPrice(p)) + '</b>' +
      (f ? '<small class="premium-pass__founding">' + esc(f) + '</small>' : '') +
      (dayText(p) ? '<small class="premium-pass__day">' + dayText(p) + '</small>' : '') +
      '</span>' +
      '<button type="button" class="auth-modal-submit premium-buy" data-premium-buy="' + esc(p.id) + '" data-label="' + esc(buyLabel(p)) + '">' + esc(buyLabel(p)) + '</button>' +
    '</li>';
  }

  function ensureDialog() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'auth-modal-overlay premium-overlay';
    overlay.id = 'premiumOverlay';
    overlay.innerHTML =
      '<div class="auth-modal premium-modal" role="dialog" aria-modal="true" aria-labelledby="premiumTitle" aria-describedby="premiumSub">' +
        '<button type="button" class="auth-modal-close" id="premiumClose" aria-label="Close">&times;</button>' +
        '<h2 id="premiumTitle">Premium</h2>' +
        '<p class="auth-modal-sub" id="premiumSub"></p>' +
        '<div class="premium-lists" id="premiumLists"></div>' +
        '<div id="premiumBody"></div>' +
        '<div class="auth-modal-msg" id="premiumMsg" role="alert" aria-live="polite"></div>' +
        '<div class="premium-fine" id="premiumFine"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { close(); return; }
      var buy = e.target.closest && e.target.closest('[data-premium-buy]');
      if (buy) checkout(buy.getAttribute('data-premium-buy'), buy);
    });
    document.getElementById('premiumClose').addEventListener('click', close);
    overlay.addEventListener('submit', submitWaitlist);

    // On the document, not the overlay, for the reason report-question.js
    // gives: a disabled submit blurs focus to <body> and an overlay-bound
    // handler would stop hearing Escape at exactly that moment.
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var list = Array.prototype.filter.call(
        overlay.querySelectorAll('button:not([disabled]), input:not([disabled]), summary, a[href]'),
        function (n) { return n.offsetParent !== null || n === document.activeElement; }
      );
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    return overlay;
  }

  function listHtml(title, items) {
    return '<div><h3>' + esc(title) + '</h3><ul>' +
      items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
  }

  /* In the dialog when it is open; otherwise next to the page's own buy
     button ([data-premium-msg] in the same [data-premium-scope]), or read out. */
  function setMsg(text, kind, button) {
    var open_ = overlay && overlay.classList.contains('open');
    var msg = open_ ? document.getElementById('premiumMsg') : null;
    if (!msg && button && button.closest) {
      var scope = button.closest('[data-premium-scope]');
      msg = scope && scope.querySelector('[data-premium-msg]');
    }
    if (!msg) { if (text && window.LevlAnnounce) window.LevlAnnounce.say(text); return; }
    msg.className = (open_ ? 'auth-modal-msg' : 'pp-msg') + (kind ? ' ' + kind : '');
    msg.textContent = text || '';
  }

  function open(course, source, button) {
    var c = COURSES[course];
    if (!c) return;
    ensureDialog();
    active = { course: course, source: source || '' };
    lastFocused = button || document.activeElement;
    setMsg('');

    document.getElementById('premiumTitle').textContent =
      live(course) ? 'Premium for ' + c.name : 'Premium is coming';
    var low = lowestPass(c);
    document.getElementById('premiumLists').className = 'premium-lists' + (c.rows ? ' has-table' : '');
    document.getElementById('premiumLists').innerHTML = c.rows
      ? tableHtml(course, (c.passes.length > 1 ? '<small>from</small> ' : '') + '$' + money(nowPrice(low)))
      : listHtml('Premium', c.premium) + listHtml('Always free', c.free);

    var body = document.getElementById('premiumBody');
    var fine = document.getElementById('premiumFine');
    if (live(course)) {
      var dated = c.passes.filter(function (p) { return p.until; })[0];
      document.getElementById('premiumSub').textContent =
        (dated
          ? 'One payment, valid through ' + untilText(dated.until) + ' whenever you buy it, so the sooner you start, the more of the school year it covers.'
          : 'One payment per pass.') +
        (foundingLive() ? ' Founding price until ' + untilText(FOUNDING.until) + '.' : '');
      // A fixed-date pass is off sale once its day is over (the Worker refuses
      // it too); Hawaii time, the last US day to end.
      var sale = c.passes.filter(function (p) { return !p.until || Date.now() <= Date.parse(p.until + 'T23:59:59-10:00'); });
      body.innerHTML = (sale.length
        ? '<ul class="premium-passes">' + sale.map(function (p) { return passHtml(course, p); }).join('') + '</ul>'
        : '<p>This pass is no longer on sale.</p>') +
        // Next to the buttons, once: what removes the risk (research 2026-10-28).
        '<p class="premium-sure">' + esc(SURE) + '</p>' +
        (c.compare ? '<p class="premium-compare">For comparison: ' + esc(c.compare) + '</p>' : '') +
        (c.guarantee ? '<p class="premium-guarantee">Pass-or-extend: if you don’t pass the NREMT during your pass, you can claim ' +
          GUARANTEE.extendDays + ' more days free. <a href="/terms.html#pass-or-extend" target="_blank" rel="noopener">Conditions</a></p>' : '');
      // Folded, not removed: every rule is still one tap away.
      fine.innerHTML = '<details><summary>Fine print and terms</summary><p>' + esc(
        'When a pass ends, your progress stays; only the Premium parts lock again. ' +
        'The refund is once per account and email address. ' +
        'Prices in US dollars; any sales tax or VAT is shown before you pay. Polar is our merchant of record. ' +
        'Under 18? You need a parent or guardian’s permission, and they accept the terms for you; under 16, they should make the purchase. ' +
        (course === 'nremt' ? 'Not affiliated with or endorsed by the National Registry of EMTs. ' : '') +
        (/^ap/.test(course) ? 'AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site. ' : '')) +
        '<a href="/premium.html" target="_blank" rel="noopener">Free vs Premium</a> &middot; ' +
        '<a href="/terms.html#premium" target="_blank" rel="noopener">Terms and refunds</a></p></details>';
    } else {
      document.getElementById('premiumSub').textContent =
        'Premium for ' + c.name + ' (from ' + fromPrice(c) + ', one-time, no subscription) isn’t on sale yet, ' +
        'and until it is, everything marked Premium is free. Leave your email and we’ll tell you when it launches.';
      body.innerHTML =
        '<form id="premiumForm" novalidate>' +
          '<label for="premiumEmail">Email' +
            '<input type="email" id="premiumEmail" autocomplete="email" maxlength="254" required>' +
          '</label>' +
          '<button type="submit" class="auth-modal-submit" id="premiumSubmit">Tell me when it launches</button>' +
        '</form>';
      fine.textContent = 'One email when it launches. No newsletter.';
      var input = document.getElementById('premiumEmail');
      var a = window.StudyHubAccount;
      var user = a && a.user ? a.user() : null;
      if (user && user.email) input.value = user.email;
    }

    overlay.classList.add('open');
    document.documentElement.classList.add('auth-modal-open');
    var first = overlay.querySelector('#premiumEmail, .premium-buy');
    if (first) first.focus();

    funnel('interest', course, { course: course, source: active.source });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.documentElement.classList.remove('auth-modal-open');
    if (lastFocused && lastFocused.focus) { try { lastFocused.focus(); } catch (e) { /* gone from the DOM */ } }
    lastFocused = null;
    active = null;
  }

  /* Buying needs an account: the pass is attached to it, so it follows the
     student to every device. Not signed in → the one-step checkout sign-in
     (Google, or an emailed code; account.js 'checkout' mode), and the pass
     they picked is remembered so payment opens by itself once they are in,
     whether that happens in this tab (a code) or after Google's redirect
     brings them back to this page. Signed in → the Worker makes a Polar
     checkout and it opens over the page. */
  /* The course a pass belongs to. Not the part before the dash: the AP®
     passes are bio-2027, chem-2027, phys-2027, calc-2027 and stat-2027 while their courses are
     apbio, apchem, apphys, apcalc and apstat, so splitting sent "bio" to the funnel counter, which drops any
     course it does not know (AP® checkout starts were never counted). */
  function courseOfPass(passId) {
    for (var k in COURSES) {
      if (!Object.prototype.hasOwnProperty.call(COURSES, k)) continue;
      var list = COURSES[k].passes || [];
      for (var i = 0; i < list.length; i++) if (list[i].id === passId) return k;
    }
    return '';
  }

  // Sent with a checkout so the paid webhook can credit the video (never
  // when analytics is turned off in this browser).
  // The channel this browser first came from (analytics.js source()), so a
  // purchase is credited to it; null when analytics is off.
  function firstSource() {
    var an = window.LevlAnalytics;
    if (!an || !an.source || (an.optedOut && an.optedOut())) return null;
    return an.source();
  }
  function attributedRef() {
    var an = window.LevlAnalytics;
    if (!an || !an.attributedRef || (an.optedOut && an.optedOut())) return null;
    return an.attributedRef();
  }

  var PENDING_KEY = 'levlprep_pending_buy';
  var PENDING_MINUTES = 30;

  function checkout(passId, button, source) {
    var a = window.StudyHubAccount;
    var inDialog = !!(overlay && overlay.classList.contains('open'));
    var src = source || (active ? active.source : '');
    if (!a) { setMsg('Couldn’t reach checkout just now. Try again in a moment.', 'error', button); return; }
    if (!currentUserId()) {
      writeJson(PENDING_KEY, { pass: passId, source: src, at: Date.now(), via: inDialog ? 'dialog' : 'page' });
      funnel('signin-for-checkout', courseOfPass(passId), { course: courseOfPass(passId), pass: passId });
      close();
      /* An account.js cached from before the checkout mode existed has no
         'checkout' to switch to; the full form still gets them in. */
      try { a.openAuthModal('checkout', { purpose: 'checkout' }); }
      catch (e) { a.openAuthModal('signup', { purpose: 'checkout' }); }
      return;
    }
    funnel('checkout-start', courseOfPass(passId), { course: courseOfPass(passId), pass: passId });
    var label = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Opening…';
    var course = courseOfPass(passId);
    a.accessToken().then(function (token) {
      if (!token) throw new Error('no session');
      return fetch(ENDPOINT + '/premium/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ pass: passId, returnTo: window.location.href, ref: attributedRef(), src: firstSource() }),
      });
    }).then(function (res) {
      return res.json().then(function (body) { return { ok: res.ok, body: body }; });
    }).then(function (r) {
      if (!r.ok || !r.body || !r.body.url) throw new Error((r.body && r.body.error) || 'checkout failed');
      var url = r.body.url;
      /* Pay on top of this page in Polar's own checkout frame. If that frame
         can't load (blocked script, old browser), fall back to Polar's page. */
      return loadEmbed().then(function (Embed) {
        close();
        button.disabled = false;
        button.innerHTML = label;
        openEmbedded(Embed, url, function () {
          funnel('checkout-paid', course, { course: course, pass: passId });
          if (window.LevlAnnounce) window.LevlAnnounce.say('Payment received. Unlocking Premium…');
          pollForPass(course);
        });
      }, function () { window.location.href = url; });
    }).catch(function () {
      button.disabled = false;
      button.innerHTML = label;
      setMsg('Checkout didn’t open. You may be offline. Nothing was charged. Try again in a moment.', 'error', button);
    });
  }

  /* Polar's checkout over the page, with our own way out.

     Polar's embed script only trusts messages from polar.sh and
     sandbox.polar.sh, but checkouts are now served from buy.polar.sh, so its
     own close button and its "paid" message never reach it: the frame could
     not be closed and create() never resolved. So this listens for Polar's
     messages itself (any *.polar.sh origin), adds a close button and Escape,
     and tears the frame down directly rather than waiting on the library.
     While a payment is processing ("confirmed") closing is held, as Polar
     intends. */
  var POLAR_ORIGIN = /^https:\/\/([a-z0-9-]+\.)?polar\.sh$/;
  function openEmbedded(Embed, url, onPaid) {
    var done = false, processing = false, paid = false, lib = null;
    var created = Embed.create(url, { theme: pageTheme() });
    created.then(function (embed) {
      lib = embed;
      // If Polar's own handler does hear the success, stay on this page.
      embed.addEventListener('success', function (ev) { ev.preventDefault(); });
      if (done) { try { embed.close(); } catch (e) { /* already gone */ } }
    }, function () { /* the frame still exists; our button closes it */ });

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'premium-embed-close';
    btn.setAttribute('aria-label', 'Close checkout');
    btn.textContent = '\u00d7';
    btn.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647;width:40px;height:40px;' +
      'border:0;border-radius:50%;background:rgba(0,0,0,.65);color:#fff;font:700 24px/40px system-ui,sans-serif;cursor:pointer;';
    document.body.appendChild(btn);

    function teardown() {
      if (done) return;
      done = true;
      window.removeEventListener('message', onMessage);
      document.removeEventListener('keydown', onKey, true);
      btn.remove();
      if (lib) { try { lib.close(); } catch (e) { /* fall through to manual removal */ } }
      Array.prototype.forEach.call(document.querySelectorAll('iframe'), function (f) {
        if (/^https:\/\/([a-z0-9-]+\.)?polar\.sh\//.test(f.src || '')) f.remove();
      });
      Array.prototype.forEach.call(document.querySelectorAll('.polar-loader-spinner'), function (sp) {
        (sp.parentNode && sp.parentNode !== document.body ? sp.parentNode : sp).remove();
      });
      document.body.classList.remove('polar-no-scroll');
    }
    function tryClose() {
      if (processing) return; // a payment is going through; Polar will finish it
      teardown();
    }
    function succeed() {
      if (paid) return;
      paid = true;
      processing = false;
      teardown();
      onPaid();
    }
    function onMessage(ev) {
      if (!POLAR_ORIGIN.test(ev.origin || '')) return;
      var d = ev.data || {};
      if (d.type !== 'POLAR_CHECKOUT') return;
      if (d.event === 'confirmed') { processing = true; btn.style.display = 'none'; }
      else if (d.event === 'close') tryClose();
      else if (d.event === 'success') succeed();
    }
    function onKey(ev) { if (ev.key === 'Escape') tryClose(); }
    btn.addEventListener('click', tryClose);
    window.addEventListener('message', onMessage);
    document.addEventListener('keydown', onKey, true);
    return created;
  }

  /* Polar's embed script, pinned with its hash like the Supabase SDK in
     account.js, and loaded only when someone actually buys. The pages' CSP
     allows the frame it opens (frame-src polar.sh). */
  var EMBED_SRC = 'https://cdn.jsdelivr.net/npm/@polar-sh/checkout@0.4.1/dist/embed.global.js';
  var EMBED_INTEGRITY = 'sha384-e+NbGcSWhyE0uyrB+P19KffckB1jt91+Jk0PrKhB/hqpFXVT5bgULrccH8Xyz3jT';
  var embedPromise = null;
  function loadEmbed() {
    if (window.Polar && window.Polar.EmbedCheckout) return Promise.resolve(window.Polar.EmbedCheckout);
    if (embedPromise) return embedPromise;
    embedPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = EMBED_SRC;
      s.integrity = EMBED_INTEGRITY;
      s.crossOrigin = 'anonymous';
      s.async = true;
      var timer = setTimeout(function () { reject(new Error('timeout')); }, 8000);
      s.onload = function () {
        clearTimeout(timer);
        if (window.Polar && window.Polar.EmbedCheckout) resolve(window.Polar.EmbedCheckout);
        else reject(new Error('no embed'));
      };
      s.onerror = function () { clearTimeout(timer); reject(new Error('load failed')); };
      document.head.appendChild(s);
    });
    embedPromise.catch(function () { embedPromise = null; });
    return embedPromise;
  }

  function pageTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /* The webhook that records the pass can land a few seconds after payment,
     so ask a few times before giving up quietly. */
  function pollForPass(course) {
    var tries = 0;
    (function poll() {
      refresh();
      if (course && expiry(course) && expiry(course) > Date.now()) {
        if (window.LevlAnnounce) window.LevlAnnounce.say('Premium is unlocked. Thank you!');
        notify();
        return;
      }
      if (++tries < 8) setTimeout(poll, 2500);
    })();
  }

  /* Coming back from Polar. Our success_url carries ?premium=success&course=,
     but Polar can send the buyer back with only ?customer_session_token=,
     so that counts too, with the course read from the page's folder.
     Payment is confirmed by the webhook, which can land a few seconds after
     the redirect, so ask again a few times before saying anything is wrong. */
  function returnCourse(search, pathname) {
    var q = {};
    String(search || '').replace(/^\?/, '').split('&').forEach(function (pair) {
      if (!pair) return;
      var i = pair.indexOf('=');
      var k = i === -1 ? pair : pair.slice(0, i);
      try { q[decodeURIComponent(k)] = i === -1 ? '' : decodeURIComponent(pair.slice(i + 1)); } catch (e) { /* skip */ }
    });
    if (q.premium !== 'success' && !Object.prototype.hasOwnProperty.call(q, 'customer_session_token')) return null;
    var course = q.course;
    if (course && Object.prototype.hasOwnProperty.call(COURSES, course)) return course;
    // A course whose key may not appear in a URL (apbio, apchem, apphys, apcalc, apstat;
    // docs/apbio-spec.md decision 2) comes back named by its folder ("bio", "chem", "physics", "calculus", "statistics").
    for (var j = 0; course && j < COURSE_LIST.length; j++) {
      if (COURSE_LIST[j].path === '/' + course + '/') return COURSE_LIST[j].key;
    }
    var path = String(pathname || '');
    for (var i = 0; i < COURSE_LIST.length; i++) {
      if (path.indexOf(COURSE_LIST[i].path) !== -1) return COURSE_LIST[i].key;
    }
    return '';
  }

  /* Signed in with a pass still waiting: reopen the dialog and start that
     checkout, so "sign in" and "pay" feel like one step. Only within
     PENDING_MINUTES of choosing it, and only once. */
  function resumePending() {
    var p = readJson(PENDING_KEY);
    if (!p || !p.pass) return;
    if (!currentUserId() || !(window.StudyHubAccount && window.StudyHubAccount.user && window.StudyHubAccount.user())) return;
    writeJson(PENDING_KEY, {});
    var course = courseOfPass(String(p.pass));
    if (!COURSES[course] || !live(course) || !(Date.now() - (p.at || 0) < PENDING_MINUTES * 60000)) return;
    var id = String(p.pass).replace(/[^a-z0-9-]/g, '');
    /* Started from a page's own buy button (premium.html, a course home's
       ?buy= link): go straight back to paying, without the dialog. */
    if (p.via === 'page') {
      var own = document.querySelector('[data-premium-scope] [data-premium-buy="' + id + '"]');
      checkout(id, own || document.createElement('button'), p.source || 'resume');
      return;
    }
    open(course, p.source || 'resume');
    var btn = overlay && overlay.querySelector('[data-premium-buy="' + id + '"]');
    if (btn) checkout(p.pass, btn);
  }

  /* A course home's buy link: premium.html?buy=<pass>. The course opens on
     the page behind and checkout (or the one-step sign-in) starts at once,
     so "Unlock" on a course home is one click, with the full comparison
     right there if they close it. */
  function handleBuyLink() {
    var id = null;
    try { id = new URLSearchParams(window.location.search).get('buy'); } catch (e) { return; }
    if (!id) return;
    id = String(id).replace(/[^a-z0-9-]/g, '');
    try {
      var params = new URLSearchParams(window.location.search);
      params.delete('buy');
      var q = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (q ? '?' + q : '') + window.location.hash);
    } catch (e) { /* old browser: the query just stays */ }
    var course = courseOfPass(id);
    if (!course || !live(course) || has(course)) return;
    funnel('interest', course, { course: course, source: 'course-home' });
    writeJson(PENDING_KEY, { pass: id, source: 'course-home', at: Date.now(), via: 'page' });
    // Signed in: onAuthChange runs resumePending once the session is known.
    // Signed out: once that is certain, start checkout, which asks to sign in.
    var tries = 0;
    (function wait() {
      var a = window.StudyHubAccount;
      var known = a && a.settled && a.settled();
      if (!known && ++tries < 40) { setTimeout(wait, 150); return; }
      if (a && a.user && a.user()) { resumePending(); return; }
      if (!readJson(PENDING_KEY).pass) return;
      var own = document.querySelector('[data-premium-scope] [data-premium-buy="' + id + '"]');
      checkout(id, own || document.createElement('button'), 'course-home');
    })();
  }

  function handleReturn() {
    var course = returnCourse(window.location.search, window.location.pathname);
    if (course === null) return;
    try {
      var params = new URLSearchParams(window.location.search);
      ['premium', 'course', 'checkout_id', 'customer_session_token'].forEach(function (k) { params.delete(k); });
      var q = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (q ? '?' + q : '') + window.location.hash);
    } catch (e) { /* old browser: the query just stays */ }
    pollForPass(course);
  }

  function validEmail(s) {
    return typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function submitWaitlist(e) {
    e.preventDefault();
    if (!active) return;
    var submitBtn = document.getElementById('premiumSubmit');
    var email = document.getElementById('premiumEmail').value.trim();
    if (!validEmail(email)) { setMsg('That doesn’t look like an email address.', 'error'); return; }
    var a = window.StudyHubAccount;
    if (!a || !a.rpc) { setMsg('Couldn’t send that just now. Try again in a moment.', 'error'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    setMsg('');
    var sending = active;
    a.rpc('join_waitlist', {
      p_course: sending.course,
      p_email: email,
      p_source: sending.source || null,
    }).then(function (ok) {
      if (!ok) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Tell me when it launches';
        setMsg('That didn’t send — you may be offline. Try again when you’re back.', 'error');
        return;
      }
      markJoined(sending.course);
      repaint(sending.course);
      if (window.LevlAnalytics) window.LevlAnalytics.event('premium-waitlist-joined', { course: sending.course, source: sending.source });
      close();
      if (window.LevlAnnounce) window.LevlAnnounce.say('You’re on the list.');
    });
  }

  function repaint(course) {
    var all = document.querySelectorAll('.premium-card [data-premium-open="' + course + '"]');
    for (var i = 0; i < all.length; i++) {
      var box = all[i].closest('.premium-card');
      if (box && !box.classList.contains('premium-lock')) box.outerHTML = card(course);
    }
  }

  // Count a locked card only once a person sees it (docs/trust-conversion-plan.md).
  var LIMIT_FEATURES = { 'daily-limit': 1, 'exam': 1, 'exams': 1 }, interacted = false;
  function watchGates() {
    if (!window.IntersectionObserver || !window.MutationObserver) return;
    var sel = '.premium-lock[data-premium-course]';
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var el = e.target;
        clearTimeout(el._lpT);
        if (e.intersectionRatio < 0.5 || !interacted) return;
        el._lpT = setTimeout(function () {
          if (document.visibilityState !== 'visible' || !el.isConnected) return;
          io.unobserve(el);
          var c = el.dataset.premiumCourse, f = el.dataset.premiumFeature || '';
          if (!has(c)) funnel(LIMIT_FEATURES[f] ? 'limit-hit' : 'gate-shown', c, { course: c, feature: f });
        }, 1000);
      });
    }, { threshold: [0, 0.5] });
    function scan() {
      var cs = document.querySelectorAll(sel);
      for (var i = 0; i < cs.length; i++) if (!cs[i]._lpW) { cs[i]._lpW = 1; io.observe(cs[i]); }
    }
    ['scroll', 'pointerdown', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, function () {
        if (interacted) return;
        interacted = true;
        var cs = document.querySelectorAll(sel);
        for (var i = 0; i < cs.length; i++) { io.unobserve(cs[i]); io.observe(cs[i]); }
      }, true);
    });
    scan();
    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  }

  function mount() {
    if (window.__levlPremiumMounted) return;
    window.__levlPremiumMounted = true;
    watchGates();
    document.addEventListener('click', function (e) {
      // A buy button on the page itself (premium.html): straight to checkout.
      var buy = e.target && e.target.closest && e.target.closest('[data-premium-scope] [data-premium-buy]');
      if (buy && !(overlay && overlay.contains(buy))) {
        e.preventDefault();
        var passId = buy.getAttribute('data-premium-buy');
        var src = buy.getAttribute('data-premium-source') || 'pricing-page';
        funnel('interest', courseOfPass(passId), { course: courseOfPass(passId), source: src });
        checkout(passId, buy, src);
        return;
      }
      var btn = e.target && e.target.closest && e.target.closest('[data-premium-open]');
      if (!btn) return;
      e.preventDefault();
      open(btn.getAttribute('data-premium-open'), btn.getAttribute('data-premium-source'), btn);
    });
    var a = window.StudyHubAccount;
    if (a && a.onAuthChange) a.onAuthChange(function (u) { refresh(); if (u) resumePending(); });
    handleReturn();
    handleBuyLink();
  }

  window.LevlPremium = {
    // launched(course): that course's passes are on sale; launched(): the site has launched.
    launched: function (course) { return course ? live(course) : LAUNCHED; },
    COURSES: COURSES,
    FOUNDING: FOUNDING,
    GUARANTEE: GUARANTEE,
    guaranteeText: guaranteeText,
    has: has,
    isFreeChapter: isFreeChapter,
    gate: gate,
    badge: badge,
    card: card,
    open: open,
    quota: quota,
    noteAnswer: noteAnswer,
    perDay: perDay,
    tableHtml: tableHtml,
    courseTally: courseTally,
    todayScore: todayScore,
    freeExam: freeExam,
    onChange: onChange,
    refresh: refresh,
    lastSynced: lastSynced,
    recordExam: recordExam,
  };

  /* Test internals, never on window: only the test harness's VM sandbox
     defines __levlTestHooks (scripts/test/harness.mjs). */
  if (typeof __levlTestHooks === 'object' && __levlTestHooks) {
    __levlTestHooks.premium = {
      joined: joined,
      markJoined: markJoined,
      validEmail: validEmail,
      returnCourse: returnCourse,
      setLaunched: function (v) { LAUNCHED = !!v; },
      openEmbedded: function (url, onPaid) { return loadEmbed().then(function (E) { return openEmbedded(E, url, onPaid); }); },
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})(window, document);
