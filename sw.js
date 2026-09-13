// Offline support for LevlPrep. Precaches the core pages/assets so the
// site works with no connection; everything else (the 3D body-map model,
// the three.js vendor bundle, the ochem course, Google Fonts) is cached the
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
// The cached copy is only served as a fallback when the network fails.
// Bump CACHE_NAME whenever this file changes, so old cached entries are
// dropped instead of lingering forever.
const CACHE_NAME = 'levlprep-v17';
const PRECACHE_URLS = [
  'index.html',
  // Shown in place of an uncached page while offline. Precached rather than
  // cached on demand for the obvious reason: it is only ever needed at the
  // moment nothing can be fetched.
  'offline.html',
  'assets/theme.css',
  'assets/account.js',
  'assets/hub-progress.js',
  'assets/site-chrome.js',
  'assets/tutor.js',
  'assets/announce.js',
  'assets/analytics.js',
  'assets/chime.js',
  'assets/icon.svg',
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
  'nremt/study-plan.html',
  'nremt/dashboard.html',
  'nremt/tools.html',
  'nremt/search.html',
  'nremt/manifest.json',
  'nremt/assets/nav.js',
  'nremt/assets/icon.svg',
  // The three tool behaviours. Small, and each one is the difference between a
  // page that works offline and a page that renders as inert text offline —
  // flowcharts and skillsheets in particular are now drills rather than
  // documents, and a drill that will not start is worse than the document was.
  'nremt/assets/flow-drill.js',
  'nremt/assets/station-run.js',
  'nremt/assets/sound-bank.js',
];

// The question bank is 2.3 MB across its two files — an order of magnitude
// more than everything above put together — so it is NOT in PRECACHE_URLS:
// blocking install on it would stall the first visit on a slow connection. It
// is still essential offline (practice.html and search.html are both useless
// without it), so it is warmed separately, after install has already resolved.
//
// Core first. If the connection dies partway through warming these, the half
// that makes practice work at all is the half already in the cache.
const DEFERRED_URLS = [
  'nremt/assets/questions-core.json',
  'nremt/assets/explanations.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Warm the deferred entries in the background — install resolves as
        // soon as the core shell is cached, and a failure here (offline mid
        // install, say) must not fail the installation.
        cache.addAll(DEFERRED_URLS).catch(() => {});
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

const NETWORK_FIRST_EXTENSIONS = /\.(html|css|js|json)$/;

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isNetworkFirst = event.request.mode === 'navigate' || NETWORK_FIRST_EXTENSIONS.test(url.pathname);

  if(isNetworkFirst){
    event.respondWith(
      fetch(event.request).then(response => {
        if(response && response.ok){
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() =>
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

  // Everything else (3D model, vendor JS, fonts, images): cache-first, since
  // these are large/static and don't need to be re-fetched on every visit.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if(cached) return cached;
      return fetch(event.request).then(response => {
        if(response && response.ok){
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
