// Tombstone. The real service worker moved to the site root (/sw.js) so its
// scope covers the shared /assets/ modules every subject loads — see the
// comment at the top of that file.
//
// A more specific scope wins, so as long as a browser still has THIS worker
// registered for /nremt/, the root worker would never control the app's
// pages. Rather than rely on the browser noticing a 404 and cleaning up, this
// stands in its place and stands down explicitly: drop the old caches,
// unregister, and reload any page it still controls so the root worker takes
// over on the spot. Safe to delete once no installs remain in the wild.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('levlprep-')).map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => clients.forEach(c => c.navigate(c.url)))
  );
});
