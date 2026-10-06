// Offline support for LevlPrep. Precaches the core pages/assets so the
// site works with no connection; everything else (the 3D body-map model,
// the three.js vendor bundle, the ochem course, the font files) is cached the
// first time it's actually requested, so a first visit isn't stuck
// downloading 15MB+ before it's usable.
//
// This lives at the site ROOT rather than under nremt/ because a service
// worker only sees fetches inside its own scope, and the shared account and
// progression modules (/assets/account.js, /assets/hub-progress.js) are
// loaded by every subject from outside nremt/. Registered from nremt/ this
// worker never saw those requests, so going offline silently cost the app
// its level, XP and streak. Root scope also means ochem pages get the same
// offline behavior for free.
//
// Pages/CSS/JS use network-first: when online, always fetch the latest
// version and update the cache, so a site update reaches every open tab on
// its next load instead of being stuck behind a stale cache indefinitely.
// The cached copy is served when the network fails, or when it has not
// answered in NETWORK_TIMEOUT_MS (weak campus wifi used to leave a blank page
// for as long as the browser cared to wait); the network answer still lands
// in the cache for next time.
// Bump CACHE_NAME whenever this file changes, so old cached entries are
// dropped instead of lingering forever.
//
// Two caches, not one. Bumping CACHE_NAME used to delete everything, so a
// one-line CSS change made every device re-download the 3.2 MB body-map
// model, the 670 KB three.js bundle and the fonts. Those never change with
// the shell, so they live in STATIC_CACHE, which activate leaves alone.
// They are served stale-while-revalidate: the cached copy at once, and a
// fresh fetch behind it replaces the copy, so a replaced image or figure
// (same path, new bytes) shows up on the next view instead of never.
const CACHE_NAME = 'levlprep-v56';
const STATIC_CACHE = 'levlprep-static';
/* Precached per course (site audit 2026-10, performance: about 110 URLs
   across all three courses were fetched on a first visit to any page). Install
   takes only the site shell below; a course's own shell (COURSE_URLS) is
   warmed in the background the first time a page of that course is opened,
   so someone studying only ochem never downloads the NREMT question bank. */
const PRECACHE_URLS = [
  'index.html',
  // Shown in place of an uncached page while offline. Precached rather than
  // cached on demand for the obvious reason: it is only ever needed at the
  // moment nothing can be fetched.
  'offline.html',
  'assets/theme.css',
  'assets/fonts/fonts.css',
  'assets/account.js',
  'assets/premium.js',
  'assets/hub-progress.js',
  'assets/site-chrome.js',
  'assets/tutor-launcher.js',
  'assets/tutor.js',
  'assets/announce.js',
  'assets/motion.js',
  // The end-of-session next step and the cross-course card, fetched on demand
  // by site-chrome.js. Precached so an end screen offline still has one.
  'assets/next-step.js',
  'assets/next-step.css',
  'assets/cross-course.js',
  'assets/analytics.js',
  'assets/chime.js',
  'assets/icon.svg',
  'assets/exam-date.js',
  'assets/flashcards.css',
  // Fetched on demand (site-chrome.js, LevlLazy) at the end of an exam or a
  // chapter, which is exactly when a student on a train has no signal.
  'assets/share.js',
  'assets/milestones.js',
  'assets/milestones.css',
  'certificate.html',
  'assets/certificate.js',
  'search.html',
  'assets/site-search-all.js',
  'assets/site-search.js',
];

// One entry per course folder in assets/courses.js (scripts/check-courses.mjs).
const COURSE_URLS = {};
COURSE_URLS.nremt = [
  'nremt/index.html',
  'nremt/practice.html',
  'nremt/body-map.html',
  'nremt/flowcharts.html',
  'nremt/glossary.html',
  'nremt/mnemonics.html',
  'nremt/scenario-sim.html',
  'nremt/skillsheets.html',
  'nremt/sound-trainer.html',
  'nremt/study-notes.html',
  // The forty chapters themselves. study-notes.html is a 58 KB shell since the
  // split, and without this file it is a shell that says "the notes did not
  // load" — so the data is content, not an optional extra.
  'nremt/assets/study-notes.json',
  'nremt/review.html',
  'nremt/exams.html',
  'nremt/practice-engine.js',
  'nremt/practice.css',
  'nremt/flashcards.html',
  'nremt/assets/flashcards-page.js',
  'nremt/assets/premium-gates.js',
  'nremt/assets/flashcards.json',
  'nremt/exam-day.html',
  'nremt/dashboard.html',
  'nremt/tools.html',
  'nremt/search.html',
  'nremt/manifest.json',
  'nremt/assets/nav.js',
  // What every stored record means. practice.html cannot resolve a single
  // saved question without it, so it is shell, not content.
  'nremt/assets/question-ids.js',
  'nremt/assets/icon.svg',
  // The three tool behaviours. Small, and each one is the difference between a
  // page that works offline and a page that renders as inert text offline —
  // flowcharts and skillsheets in particular are now drills rather than
  // documents, and a drill that will not start is worse than the document was.
  'nremt/assets/flow-drill.js',
  'nremt/assets/station-run.js',
  'nremt/assets/sound-bank.js',
];

COURSE_URLS.ochem = [
  // The ochem shell. That course was cached only as pages happened to be
  // visited, so the one page a reader opens specifically to FIND something was
  // the one most likely not to be there when they were offline.
  // (No apostrophes in this block: the precache test parses this list by
  // pulling quoted strings out of the file, and one would open a string.)
  'ochem/index.html',
  'ochem/learn.html',
  'ochem/search.html',
  'ochem/tools.html',
  'ochem/manifest.json',
  'ochem/assets/ochem.css',
  'ochem/assets/ochem-premium.js',
  'ochem/assets/ochem-nav.js',
  'ochem/assets/curriculum.js',
  'ochem/assets/tools-registry.js',
  // The flashcard deck, whole: the page, its scripts, the generated deck and
  // the concept teach strings its concept cards are built from. A deck is the
  // thing most likely to be opened on a train, and a deck that loads only
  // when the tunnel ends is not one. About 105 KB gzipped for all of it.
  'ochem/flashcards.html',
  'ochem/assets/flashcards-page.js',
  'ochem/assets/flashcard-scheduler.js',
  'ochem/assets/flashcards.json',
  'ochem/assets/concepts.js',
  'ochem/assets/concept-teach.json',
  'ochem/assets/mastery-engine.js',
  'ochem/assets/ochem-xp.js',
  'ochem/dashboard.html',
  'ochem/exams.html',
  'ochem/assets/exam-core.js',
  'ochem/assets/exams-page.js',
  'ochem/glossary.html',
  'ochem/assets/glossary-page.js',
  'ochem/assets/glossary-tip.js',
  'ochem/assets/glossary.json',
];

COURSE_URLS['anatomy-physiology'] = [
  // The A&P shell: the course home, the lesson list, search and the runtime
  // every A&P page loads. Lessons, notes and figures are cached as visited.
  'anatomy-physiology/index.html',
  'anatomy-physiology/learn.html',
  'anatomy-physiology/search.html',
  'anatomy-physiology/tools.html',
  'anatomy-physiology/manifest.json',
  'anatomy-physiology/assets/anp.css',
  'anatomy-physiology/assets/anp-curriculum.js',
  'anatomy-physiology/assets/anp-core.js',
  'anatomy-physiology/assets/anp-questions.js',
  'anatomy-physiology/assets/anp-nav.js',
  'anatomy-physiology/assets/anp-glossary.js',
  'anatomy-physiology/assets/glossary.json',
  'anatomy-physiology/dashboard.html',
];
COURSE_URLS.bio = [
  // The AP® Biology shell (key apbio, folder bio): home, learn, search, tools,
  // dashboard and the runtime every course page loads. Lessons, notes, the
  // bank and figures are cached as visited.
  'bio/index.html',
  'bio/learn.html',
  'bio/search.html',
  'bio/tools.html',
  'bio/dashboard.html',
  'bio/manifest.json',
  'bio/assets/bio.css',
  'bio/assets/bio-curriculum.js',
  'bio/assets/bio-core.js',
  'bio/assets/bio-questions.js',
  'bio/assets/bio-nav.js',
  'bio/assets/bio-glossary.js',
  'bio/assets/glossary.json',
];

// The question bank is 2.3 MB across its two files — an order of magnitude
// more than everything above put together — so it is NOT in PRECACHE_URLS:
// blocking install on it would stall the first visit on a slow connection. It
// is still essential offline (practice.html and search.html are both useless
// without it), so it is warmed separately, after install has already resolved.
//
// Core first. If the connection dies partway through warming these, the half
// that makes practice work at all is the half already in the cache.
const DEFERRED_URLS = {
  nremt: [
    'nremt/assets/questions-core.json',
    'nremt/assets/explanations.json',
  ],
};

/* A course's shell, warmed once per worker the first time one of its pages is
   opened: entries already cached are skipped, nothing here can fail a page,
   and the course's deferred files follow its shell. */
const warmed = new Set();
function warmCourse(course) {
  if (!COURSE_URLS[course] || warmed.has(course)) return Promise.resolve();
  warmed.add(course);
  return caches.open(CACHE_NAME).then(cache => {
    const missing = url => cache.match(url).then(hit => (hit ? null : precache(cache, url)));
    return Promise.allSettled(COURSE_URLS[course].map(missing))
      .then(() => Promise.allSettled((DEFERRED_URLS[course] || []).map(missing)));
  }).catch(() => {});
}

const NETWORK_TIMEOUT_MS = 3500;

/* Fetched past the browser's HTTP cache (cache: 'reload'), so a new worker
   never precaches a stale copy the HTTP cache still held from the old site.
   Each URL is added on its own: one missing or failing file used to reject
   cache.addAll() and with it the whole install, forever. Only the two pages
   the offline fallback depends on are required. */
const REQUIRED_URLS = ['index.html', 'offline.html'];

function precache(cache, url) {
  return fetch(new Request(url, { cache: 'reload' })).then(res => {
    if (!cacheable(res)) throw new Error('precache ' + url + ' ' + res.status);
    return cache.put(url, res);
  });
}

/* Only a complete, same-origin 200 is stored: a 206 (a range request for
   audio or video) makes cache.put() throw, and an error page or a redirect
   stored under a real URL would be served offline as if it were the page. */
function cacheable(res) {
  return !!res && res.status === 200 && res.type === 'basic';
}

function putLater(cacheName, request, res) {
  if (!cacheable(res)) return;
  const copy = res.clone();
  caches.open(cacheName).then(cache => cache.put(request, copy)).catch(() => {});
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.allSettled(PRECACHE_URLS.map(u => precache(cache, u))).then(results => {
          const failedRequired = PRECACHE_URLS.filter((u, i) => results[i].status === 'rejected' && REQUIRED_URLS.includes(u));
          if (failedRequired.length) throw new Error('precache failed: ' + failedRequired.join(', '));
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== STATIC_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

const NETWORK_FIRST_EXTENSIONS = /\.(html|css|js|json)$/;

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  /* The Cache API only accepts http and https. A browser extension fetching
     through the page arrives here as chrome-extension:// and made cache.put()
     throw — an uncaught promise rejection on every page load for anybody with
     the wrong extension installed, and nothing this site can do anything about
     except decline to touch it.

     Extensions are also not ours to cache even where the scheme allows it. */
  if(url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if(url.origin !== self.location.origin) return;
  const isNetworkFirst = event.request.mode === 'navigate' || NETWORK_FIRST_EXTENSIONS.test(url.pathname);
  if(event.request.mode === 'navigate'){
    const course = url.pathname.split('/')[1];
    if(COURSE_URLS[course]) event.waitUntil(warmCourse(course));
  }

  if(isNetworkFirst){
    const network = fetch(event.request).then(response => {
      putLater(CACHE_NAME, event.request, response);
      return response;
    });
    // Whichever comes first: the network, or (after NETWORK_TIMEOUT_MS) a
    // cached copy. With nothing cached, keep waiting for the network.
    const slow = new Promise(resolve => setTimeout(resolve, NETWORK_TIMEOUT_MS))
      .then(() => caches.match(event.request))
      .then(cached => cached || network);
    event.waitUntil(network.catch(() => {}));
    event.respondWith(
      Promise.race([network, slow]).catch(() =>
        caches.match(event.request).then(cached => {
          if(cached) return cached;
          if(event.request.mode !== 'navigate') return undefined;
          // This used to quietly serve the home page instead. It worked, in
          // that something rendered — but from the visitor's side they tapped
          // "Practice", landed on a home page, and were given no reason. The
          // failure was invisible, so it read as the app being broken.
          //
          // offline.html says what happened, keeps the address bar pointed at
          // the page they asked for so a reload retries it, and lists what is
          // actually cached on this device. The old behavior stays as the
          // fallback's fallback, for a device whose cache predates this
          // worker and has no copy of offline.html in it.
          return caches.match('/offline.html').then(page => {
            if(page) return page;
            const home = url.pathname.startsWith('/nremt/') ? '/nremt/index.html'
                       : url.pathname.startsWith('/ochem/') ? '/ochem/index.html'
                       : '/index.html';
            return caches.match(home).then(p => p || caches.match('/index.html'));
          });
        })
      )
    );
    return;
  }

  // Everything else (3D model, vendor JS, fonts, images): stale-while-
  // revalidate in STATIC_CACHE, which survives a CACHE_NAME bump. The cached
  // copy answers at once; a fetch behind it refreshes the copy (a 200 only),
  // so a replaced figure under the same path is current on the next view.
  // Range requests (audio, video) go straight to the network: their 206
  // answers cannot be cached and a cached 200 cannot answer them.
  if(event.request.headers.has('range')) return;
  //
  // If the network fails for something not yet cached, fall back to a match
  // that ignores the query string (a font or model fetched under a cache-
  // busting suffix is still the same bytes) before giving up, so a partly
  // warmed cache can still answer.
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fresh = fetch(event.request).then(response => {
        putLater(STATIC_CACHE, event.request, response);
        return response;
      });
      if(cached){
        event.waitUntil(fresh.catch(() => {}));
        return cached;
      }
      return fresh.catch(() =>
        caches.match(event.request, { ignoreSearch: true }).then(fallback => fallback || Response.error())
      );
    })
  );
});

/* ---- study reminders ----------------------------------------------------
   A push wakes this worker. The push itself carries NO payload: the words are
   fetched here, from the Worker, at the moment the notification is shown.

   Two reasons, and the second is the better one. It skips the whole RFC 8291
   encryption path (ECDH against the browser's key, HKDF, AES128GCM), which is
   a few hundred lines whose failure mode is a push that silently never
   arrives. And it means the text cannot be stale: a reminder queued last night
   saying "12 due" is fetched fresh, so if the row changed, the notification
   changed with it.

   A service worker that receives a push and shows nothing gets its
   permission revoked on most platforms, so every path below ends in a
   notification — including the paths where the fetch failed. */
const REMINDER_ENDPOINT = 'https://api.levlprep.com'; // site-config:API_URL

/* A notification only ever opens a page on this site. The text comes from
   the Worker, which already limits it to a path, but this is the last place
   it can be checked. */
function sitePath(raw) {
  try {
    const u = new URL(String(raw || '/'), self.location.origin);
    return u.origin === self.location.origin ? u.pathname + u.search + u.hash : '/';
  } catch (e) {
    return '/';
  }
}

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let text = { title: 'Time to study', body: 'Pick up where you left off.', url: '/' };
    try {
      const sub = await self.registration.pushManager.getSubscription();
      if (sub && REMINDER_ENDPOINT) {
        const res = await fetch(
          REMINDER_ENDPOINT + '/reminders/text?endpoint=' + encodeURIComponent(sub.endpoint),
          { cache: 'no-store' });
        if (res.ok) {
          const body = await res.json();
          if (body && body.title) text = body;
        }
      }
    } catch (e) {
      // Fall through to the default above rather than showing nothing.
    }

    await self.registration.showNotification(text.title, {
      body: text.body,
      icon: '/assets/icon-192.png',
      badge: '/assets/icon-192.png',
      // One reminder at a time. Without a tag, a device that was offline for
      // two days delivers both at once, which is exactly the experience this
      // is supposed to avoid.
      tag: 'levlprep-reminder',
      renotify: false,
      data: { url: sitePath(text.url) },
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = sitePath(event.notification.data && event.notification.data.url);
  const want = new URL(target, self.location.origin);
  event.waitUntil((async () => {
    const all = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .filter(c => { try { return new URL(c.url).origin === self.location.origin; } catch (e) { return false; } });
    // Reuse a tab that is already on exactly that page rather than stacking
    // another copy of it. (A substring match made "/" match every tab.)
    for (const client of all) {
      if (new URL(client.url).pathname === want.pathname && 'focus' in client) {
        return client.focus();
      }
    }
    // Only a page that actually loads is tagged (?ref=push, read by
    // assets/analytics.js). Focusing a tab that is already open does not
    // reload it, and must not: it may be mid-exam. Those clicks go uncounted.
    const tagged = new URL(want.href);
    tagged.searchParams.set('ref', 'push');
    if (all.length && 'navigate' in all[0]) {
      await all[0].focus();
      return all[0].navigate(tagged.href);
    }
    return self.clients.openWindow(tagged.href);
  })());
});
