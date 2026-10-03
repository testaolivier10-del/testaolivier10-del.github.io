/* The course registry: the one list of LevlPrep's courses and their basic
   facts. Everything else that needs "which courses are there" reads it.

   No page loads this file. Most pages load site-chrome.js, premium.js and the
   rest deferred and on their own, so instead of a script tag on 860 pages,
   scripts/build-courses.mjs copies the fields each browser script needs into
   a generated block inside that script (between `// courses:begin` and
   `// courses:end`), and its --check fails CI when a copy is stale. Build
   scripts read it through scripts/lib/courses.mjs, and
   scripts/check-courses.mjs compares it with what cannot read it: the
   Worker (worker/src) and the database (scripts/sql). See README, "Adding a
   course".

   Fields (all required):
     key            the course's id everywhere: sync namespace, analytics,
                    ?course=, premium_passes.course, data-course on <body>
     short          the header's name for it on a phone ("A&P")
     name           its name in lists: the hub, search, offline page
     productName    its name on a receipt: the purchase dialog, the Worker's
                    emails (premium.js COURSES[key].name, COURSE_NAMES)
     path           its home, root-relative with both slashes ("/nremt/")
     dir            its folder, which is also path without the slashes
     storagePrefix  the localStorage prefix it owns ("nremt_"); account
                    deletion clears it and progress backup exports it
     rankLabel      what its rank is called ("A&P rank")
     searchLabel    its chip in site search ("Organic Chem")
     aliases        other ?course= spellings site search accepts
     paid           true when it sells passes (premium.js, Worker, SQL)
     status         'live' | 'beta' | 'hidden'. A hidden course works at its
                    own path but is left out of the hub's Continue links, site
                    search and premium.html
     order          position in every list, lowest first

   The first course in order is the fallback for a page that names no course
   (site-chrome.js, tutor.js): NREMT, the original course. Keep it first. */
(function (root) {
  'use strict';

  var LIST = [
    {
      key: 'nremt', short: 'NREMT', name: 'NREMT-EMT', productName: 'NREMT-EMT Prep',
      path: '/nremt/', dir: 'nremt', storagePrefix: 'nremt_', rankLabel: 'NREMT rank',
      searchLabel: 'NREMT', aliases: [], paid: true, status: 'live', order: 1,
    },
    {
      key: 'ochem', short: 'Ochem', name: 'Organic Chemistry', productName: 'Organic Chemistry',
      path: '/ochem/', dir: 'ochem', storagePrefix: 'ochem_', rankLabel: 'Ochem rank',
      searchLabel: 'Organic Chem', aliases: ['organic-chemistry'], paid: true, status: 'live', order: 2,
    },
    {
      key: 'anp', short: 'A&P', name: 'Anatomy & Physiology', productName: 'Anatomy & Physiology',
      path: '/anatomy-physiology/', dir: 'anatomy-physiology', storagePrefix: 'anp_', rankLabel: 'A&P rank',
      searchLabel: 'A&P', aliases: ['a&p', 'ap', 'anatomy-physiology'], paid: true, status: 'beta', order: 3,
    },
  ];

  var list = LIST.slice().sort(function (a, b) { return a.order - b.order; });

  function byKey(key) {
    for (var i = 0; i < list.length; i++) if (list[i].key === key) return list[i];
    return null;
  }

  /* The course a root-relative path belongs to ("/ochem/x.html", "/ochem"),
     or null for the hub and the site pages. */
  function keyOfPath(pathname) {
    var p = String(pathname || '');
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (p.indexOf(c.path) === 0 || p === '/' + c.dir) return c.key;
    }
    return null;
  }

  root.LevlCourses = {
    list: list,
    keys: function () { return list.map(function (c) { return c.key; }); },
    paid: function () { return list.filter(function (c) { return c.paid; }); },
    listed: function () { return list.filter(function (c) { return c.status !== 'hidden'; }); },
    byKey: byKey,
    keyOfPath: keyOfPath,
    defaultKey: list[0].key,
  };
})(typeof window !== 'undefined' ? window : this);
