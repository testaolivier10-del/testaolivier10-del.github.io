/* The Premium vault, browser half (docs/premium-vault.md).

   The deploy (scripts/build-deploy.mjs) replaces every Premium lesson page on
   the public site with a stub that keeps the page's head (title, description,
   canonical, styles) and loads only this file. The real page lives in the
   Worker (worker/src/vault.js), which sends it only to a signed-in reader whose
   pass covers the page's course.

   - A reader with a session: ask the Worker. On 200, the stub is replaced by
     the real page (document.open/write), which then runs exactly as if it had
     been loaded directly. Nothing else has run on the stub, so nothing runs twice.
   - No session, no pass, or the Worker says no: show the course's own Premium
     card (assets/premium.js gate) inside the normal site header, plus a link to
     the free notes for the topic. If the reader signs in or buys from that
     card, the page reloads and the first branch takes over.
   - The Worker cannot be reached: say so, with a Try again button. Never a
     blank page.

   The session is read straight from the Supabase SDK's own storage key, and
   refreshed here when it has expired, so the SDK does not have to load first. */
(function () {
  var me = document.currentScript;
  var COURSE = me.getAttribute('data-course');
  var PATH = me.getAttribute('data-path');
  var API = me.getAttribute('data-api') || 'https://api.levlprep.com';
  var NOTES = me.getAttribute('data-notes') || '';
  var SUPABASE_URL = 'https://bsfcqrczehbcctwhxmrj.supabase.co';
  var PUBLISHABLE = 'sb_publishable_CuqCLCy8R9PL6ARZJ9TCow_ba0XySYI';
  var KEY = 'sb-bsfcqrczehbcctwhxmrj-auth-token';
  var card = document.getElementById('vault-card');

  function readSession() {
    try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.access_token ? s : null; }
    catch (e) { return null; }
  }
  function fresh(s) { return !!s && (s.expires_at || 0) * 1000 > Date.now() + 60000; }

  function refreshed(s) {
    if (!s || !s.refresh_token) return Promise.resolve(null);
    return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: PUBLISHABLE, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (n) {
      if (!n || !n.access_token) return null;
      // Another tab may have refreshed first; its session is the one to keep.
      var now = readSession();
      if (now && now.refresh_token !== s.refresh_token && fresh(now)) return now;
      if (!n.expires_at) n.expires_at = Math.floor(Date.now() / 1000) + (n.expires_in || 3600);
      try { localStorage.setItem(KEY, JSON.stringify(n)); } catch (e) { /* storage full or blocked: use it once */ }
      return n;
    }).catch(function () { return null; });
  }

  function token() {
    var s = readSession();
    if (!s) return Promise.resolve(null);
    if (fresh(s)) return Promise.resolve(s.access_token);
    return refreshed(s).then(function (n) { return n ? n.access_token : null; });
  }

  function show(html) {
    if (card) card.innerHTML = html;
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function notesLink() {
    return NOTES ? '<p class="vault-notes"><a href="' + esc(NOTES) + '">Read the free notes for this topic &rarr;</a></p>' : '';
  }

  // Scripts the locked view needs (header, sign-in, the Premium card), one after another.
  function load(srcs, done) {
    if (!srcs.length) { done(); return; }
    var s = document.createElement('script');
    s.src = srcs[0];
    s.onload = s.onerror = function () { load(srcs.slice(1), done); };
    document.body.appendChild(s);
  }

  // Reload once access changes, but never more than twice a minute (a flaky session cannot loop).
  function reloadOnce() {
    var k = 'levl_vault_reloads', now = Date.now(), list = [];
    try { list = JSON.parse(sessionStorage.getItem(k) || '[]').filter(function (t) { return now - t < 60000; }); } catch (e) { list = []; }
    if (list.length >= 2) return;
    list.push(now);
    try { sessionStorage.setItem(k, JSON.stringify(list)); } catch (e) { return; }
    location.reload();
  }

  function locked(why) {
    show('<p class="vault-why">' + esc(why) + '</p>' + notesLink());
    load(['/assets/errors.js', '/assets/account.js', '/assets/site-chrome.js', '/assets/premium.js'], function () {
      var P = window.LevlPremium, g = '';
      try { g = P && P.gate ? P.gate(COURSE, 'lessons', 'vault') : ''; } catch (e) { g = ''; }
      if (g) show(g + notesLink());
      var had = false;
      try { had = !!(P && P.has && P.has(COURSE)); } catch (e) { had = false; }
      try {
        if (P && P.onChange) P.onChange(function () {
          var has = false;
          try { has = P.has(COURSE); } catch (e) { has = false; }
          // A pass that appears after this view opened (signed in, bought, restored): try the vault again.
          if (has && !had) reloadOnce();
        });
      } catch (e) { /* the card still works on its own */ }
    });
  }

  function failed() {
    show('<p class="vault-why">This lesson couldn’t load. Check your connection and try again.</p>' +
      '<p><button type="button" class="btn-press sm" id="vault-retry">Try again</button></p>' + notesLink());
    var b = document.getElementById('vault-retry');
    if (b) b.addEventListener('click', function () { location.reload(); });
  }

  function open() {
    token().then(function (t) {
      if (!t) { locked('This lesson is part of Premium.'); return; }
      return fetch(API + '/vault?p=' + encodeURIComponent(PATH), { headers: { Authorization: 'Bearer ' + t }, credentials: 'omit', cache: 'no-store' })
        .then(function (r) {
          if (r.status === 200) return r.text().then(function (html) {
            document.open('text/html', 'replace');
            document.write(html);
            document.close();
          });
          if (r.status === 401) { locked('Sign in to open this lesson.'); return; }
          if (r.status === 403) { locked('This lesson is part of Premium.'); return; }
          if (r.status === 429) { failed(); return; }
          failed();
        });
    }).catch(failed);
  }

  open();
}());
