/* LevlPrep accounts — one login for the whole site.

   This used to live inside nremt/assets/nav.js, which meant only NREMT pages
   knew whether you were signed in. The Supabase session was never actually
   NREMT-scoped (it lives in localStorage on this origin, which /ochem/ and /
   share), so an ochem page was already "logged in" and simply had no code
   that looked. Moving it here is what makes that true everywhere.

   Login stays entirely optional. Every subject works from localStorage alone;
   signing in only layers periodic sync on top, so progress follows you to a
   new browser or device instead of resetting.

   ---------------------------------------------------------------------
   NAMESPACED SYNC — why the row is shaped the way it is

   Sync writes one row per user in `user_progress` (id, data jsonb,
   updated_at). The old shape was a flat blob of nremt_* keys, upserted
   wholesale from a hard-coded NREMT-only allowlist. That shape does not
   survive a second subject: an ochem page pushing its own keys would
   replace the row and take every NREMT key with it.

   So `data` is now namespaced:

     { v: 2, ns: { hub: {...}, nremt: {...}, ochem: {...} } }

   Each subject calls registerNamespace() with the localStorage keys it owns.
   A sync reads the current row, reconciles it KEY BY KEY with this browser
   (see reconcileKey: a three-way merge against what the last sync saw), and
   writes it back only if nobody else wrote in between (updated_at is the
   version). Keys this page did not register pass through untouched, so an
   ochem page can never clobber NREMT data, two devices cannot erase each
   other's progress, and adding subject #3 is one registerNamespace() call.
   It runs on every page load, on coming back to the tab, every 30 seconds,
   shortly after a change (syncSoon) and on leaving the page.

   Legacy rows (no `v`) are read as if they were `ns.nremt`, which is exactly
   what they were. The next sync that writes rewrites them in the new shape.
   ------------------------------------------------------------------ */
(function(){
  var SUPABASE_URL = 'https://bsfcqrczehbcctwhxmrj.supabase.co';
  // Publishable (anon) key — meant to be public. It only grants what the
  // database's row-level security policies allow: each user can read and
  // write their own row and nothing else.
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_CuqCLCy8R9PL6ARZJ9TCow_ba0XySYI';

  // Pinned to an exact version (rather than a floating "@2") with a matching
  // SRI hash: a jsdelivr compromise or MITM'd response can't run arbitrary
  // code here — the browser refuses to execute anything that doesn't
  // hash-match, and accounts just stay unavailable for that page load.
  var SDK_VERSION = '2.116.0';
  var SDK_INTEGRITY = 'sha384-iLddHTLokph6Omwoyid4XKxHaWa6w41BnoEj0q5oOrzmYPpHIKt1wyjReA7s//pP';

  var SYNC_INTERVAL_MS = 30000;
  var RELOAD_ONCE_KEY = 'hub_sync_reloaded';

  var namespaces = {};      // name -> [localStorage keys]
  var mergers = {};         // localStorage key -> function(localRaw, cloudRaw) -> raw
  var client = null;
  var currentUser = null;
  var syncTimer = null;
  var soonTimer = null;
  var authListeners = [];

  /* ---- namespace registry ------------------------------------------- */

  // Called by each subject's nav/bootstrap script before the SDK loads.
  // Registering the same namespace twice unions the key lists, so a page that
  // pulls in two modules of the same subject doesn't drop either one's keys.
  // `merge`, when given, maps a key to a function(localRaw, cloudRaw) that
  // reconciles the two copies instead of letting the cloud's win outright.
  // Anything that is a set of things you have done — sections read, lessons
  // finished — belongs in there: a union across devices is always the honest
  // answer, whereas overwriting loses whatever this browser did since its
  // last push.
  function registerNamespace(name, keys, merge){
    var existing = namespaces[name] || [];
    (keys || []).forEach(function(k){
      if(existing.indexOf(k) === -1) existing.push(k);
    });
    namespaces[name] = existing;
    if(merge) Object.keys(merge).forEach(function(k){ mergers[k] = merge[k]; });
  }

  /* A ready-made merge for a flashcard schedule written by the shared
     scheduler (ochem/assets/flashcard-scheduler.js): { v: 1, cards: { id:
     { ..., t } }, fresh: { day, n }, paid?: { day, xp } }. Card by card, the
     copy graded more recently wins, so a second device cannot un-review an
     evening's cards; the day counters keep the later day, or the larger count
     on the same day. A malformed copy never wins. Here rather than in a
     course's deck script so every page of the course merges the key the
     same way, whichever page happens to sync it. */
  function mergeCardSchedules(localRaw, cloudRaw){
    var mine = null, theirs = null;
    try{ mine = JSON.parse(localRaw); }catch(e){}
    try{ theirs = JSON.parse(cloudRaw); }catch(e){ return localRaw; }
    function ok(x){ return x && typeof x === 'object' && x.v === 1 && x.cards && typeof x.cards === 'object'; }
    if(!ok(theirs)) return localRaw;
    if(!ok(mine)) return cloudRaw;
    var out = { v: 1, cards: {} };
    Object.keys(theirs.cards).forEach(function(id){ out.cards[id] = theirs.cards[id]; });
    Object.keys(mine.cards).forEach(function(id){
      var a = mine.cards[id], b = out.cards[id];
      if(!b || ((a && a.t) || 0) > ((b && b.t) || 0)) out.cards[id] = a;
    });
    [['fresh', 'n'], ['paid', 'xp']].forEach(function(p){
      var f = p[0], n = p[1];
      var m = mine[f] && typeof mine[f] === 'object' ? mine[f] : null;
      var t = theirs[f] && typeof theirs[f] === 'object' ? theirs[f] : null;
      if(!m && !t) return;
      if(!m || !t){ out[f] = m || t; return; }
      if(String(m.day) > String(t.day)) out[f] = m;
      else if(String(m.day) < String(t.day)) out[f] = t;
      else { out[f] = { day: t.day }; out[f][n] = Math.max(m[n] || 0, t[n] || 0); }
    });
    return JSON.stringify(out);
  }

  /* ---- merging two copies of one key ---------------------------------

     One set of rules wherever two copies of the progress meet: a sync (this
     browser vs the account) and a restore (this browser vs a backup file,
     progress-backup.js). Raw localStorage strings in:

       - a key only one side has is kept;
       - a key with a merge rule from registerNamespace() uses that rule;
       - otherwise two JSON values merge structurally: numbers take the larger
         (XP, counts, bests), booleans OR, arrays the union (answered, missed
         and flagged ids, attempts), date strings the later, an object that
         carries its own timestamp (t, ts, updatedAt, day...) is taken whole
         from the side that touched it last, any other object key by key;
       - what is left (two settings, two in-progress exams: wholeValue()) is a
         CONFLICT, settled by `prefer` ('local', or 'other' / 'backup'). */
  function wholeValue(key){
    return key === 'nremt_inprogress_exam' || /(_theme|_prefs(_v\d+)?|_sound|_opt_out|_ai_met)$/.test(key);
  }
  var STAMPS = ['updatedAt', 'updated', 'ts', 't', 'at', 'time', 'lastSeen', 'last', 'date', 'day'];
  var DATE_RE = /^\d{4}-\d{2}-\d{2}/;
  function isObj(x){ return x !== null && typeof x === 'object' && !Array.isArray(x); }
  function stampOf(o){
    for(var i = 0; i < STAMPS.length; i++){
      var v = o[STAMPS[i]];
      if(typeof v === 'number' || (typeof v === 'string' && v)) return { name: STAMPS[i], v: v };
    }
    return null;
  }
  function mergeValue(a, b, ctx){
    if(JSON.stringify(a) === JSON.stringify(b)) return a;
    if(typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if(typeof a === 'boolean' && typeof b === 'boolean') return a || b;
    if(typeof a === 'string' && typeof b === 'string' && DATE_RE.test(a) && DATE_RE.test(b)) return a > b ? a : b;
    if(Array.isArray(a) && Array.isArray(b)){
      var out = a.slice(), seen = {};
      a.forEach(function(x){ seen[JSON.stringify(x)] = 1; });
      b.forEach(function(x){ var k = JSON.stringify(x); if(!seen[k]){ seen[k] = 1; out.push(x); } });
      return out;
    }
    if(isObj(a) && isObj(b)){
      var sa = stampOf(a), sb = stampOf(b);
      if(sa && sb && sa.name === sb.name && typeof sa.v === typeof sb.v && sa.v !== sb.v){
        return sa.v > sb.v ? a : b;
      }
      var o = {};
      Object.keys(a).forEach(function(k){ o[k] = a[k]; });
      Object.keys(b).forEach(function(k){
        o[k] = Object.prototype.hasOwnProperty.call(a, k) ? mergeValue(a[k], b[k], ctx) : b[k];
      });
      return o;
    }
    ctx.conflict = true;
    return ctx.other ? b : a;
  }
  // -> { value, conflict }
  function mergeRaw(key, localRaw, otherRaw, prefer){
    if(localRaw === null || localRaw === undefined) return { value: otherRaw, conflict: false };
    if(otherRaw === null || otherRaw === undefined || localRaw === otherRaw) return { value: localRaw, conflict: false };
    if(mergers[key]){
      try { var r = mergers[key](localRaw, otherRaw); if(typeof r === 'string') return { value: r, conflict: false }; }
      catch(e){}
    }
    var other = prefer === 'other' || prefer === 'backup';
    var pick = { value: other ? otherRaw : localRaw, conflict: true };
    if(wholeValue(key)) return pick;
    var a, b;
    try { a = JSON.parse(localRaw); b = JSON.parse(otherRaw); } catch(e){ return pick; }
    var ctx = { other: other, conflict: false };
    var merged = mergeValue(a, b, ctx);
    return { value: JSON.stringify(merged), conflict: ctx.conflict };
  }

  /* ---- sync state -----------------------------------------------------

     Per browser, in levlprep_sync_v1 (cleared with the progress, never in a
     backup): whose it is, when a sync last succeeded, how many have failed in
     a row since, and `base`, a hash of each key's value at the last sync. The
     base makes a sync a three-way merge instead of a guess: a side whose copy
     still matches it has not changed, so the other side's copy wins outright,
     which is how a reset, an un-flag or a finished exam reaches the other
     device. Only when both changed do the rules above run. */
  var STATE_KEY = 'levlprep_sync_v1';
  var FAIL_REPORT_AFTER = 3;
  var FOCUS_THROTTLE_MS = 20000;
  var MAX_TRIES = 4;

  function hash(s){
    var h = 0x811c9dc5;
    for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(36) + ':' + s.length;
  }
  function loadState(){
    var s = null;
    try { s = JSON.parse(localStorage.getItem(STATE_KEY)); } catch(e){}
    var uid = currentUser && currentUser.id;
    if(!isObj(s) || s.uid !== uid || !isObj(s.base)) s = { uid: uid, at: 0, fails: 0, base: {} };
    return s;
  }
  function saveState(s){ try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch(e){} }

  /* One key. L local, C cloud (null = absent), B its base hash, undefined if
     this browser never synced it. Returns the value both sides end up with
     (null = deleted on both). */
  var touched = {};   // keys a sync wrote into this browser during this page
  function reconcileKey(k, L, C, B){
    if(L === C) return L;
    var known = B !== undefined;
    if(C === null) return (known && B === hash(L)) ? null : L;   // deleted there, or new here
    if(L === null) return (known && B === hash(C)) ? null : C;   // deleted here, or new there
    if(known && B === hash(L)) return C;                         // only the cloud changed
    // Only this browser changed: its copy wins (an un-flag or a reset is a
    // real edit), unless a sync rewrote this key under the open page. A page
    // that read its state at load and keeps it in memory then writes a stale
    // copy back, and merging is what stops that erasing the other device's
    // progress.
    if(known && B === hash(C) && !touched[k]) return L;
    // Both changed, or first sync on this device: merge. A first sync lets
    // the account win true conflicts, as it always has.
    return mergeRaw(k, L, C, known ? 'local' : 'other').value;
  }

  /* Every registered key against the cloud row. Cloud keys this page did not
     register (another page of the same subject did) pass through untouched:
     nothing here replaces a whole namespace. */
  function reconcile(cloud, base){
    var out = {}, local = {}, newBase = {}, changed = false;
    Object.keys(cloud).forEach(function(n){ out[n] = cloud[n]; });   // untouched namespaces pass through
    Object.keys(namespaces).forEach(function(ns){
      var src = isObj(cloud[ns]) ? cloud[ns] : {}, bucket = {};
      Object.keys(src).forEach(function(k){ bucket[k] = src[k]; });
      namespaces[ns].forEach(function(k){
        var L = localStorage.getItem(k);
        var C = typeof bucket[k] === 'string' ? bucket[k] : null;
        var v = reconcileKey(k, L, C, base[k]);
        if(v === null) delete bucket[k]; else { bucket[k] = v; newBase[k] = hash(v); }
        if(v !== C) changed = true;
        if(v !== L) local[k] = { was: L, v: v };
      });
      if(Object.keys(bucket).length || cloud[ns]) out[ns] = bucket;
    });
    return { ns: out, local: local, base: newBase, changed: changed };
  }

  // Writes only keys a namespace declared, and only where the page has not
  // changed the key since it was read (the next sync merges that change).
  function applyLocal(local){
    var applied = [];
    Object.keys(local).forEach(function(k){
      var w = local[k];
      // Skipped: the next sync must merge, not take this page's copy as is.
      if(localStorage.getItem(k) !== w.was){ touched[k] = true; return; }
      try {
        if(w.v === null) localStorage.removeItem(k); else localStorage.setItem(k, w.v);
        applied.push(k);
        touched[k] = true;
      } catch(e){}
    });
    return applied;
  }

  // What a first sync on a device does with one cloud bucket, without the
  // round trip. Exported for scripts/test/account-sync.test.mjs.
  function applyNamespace(ns, bucket){
    if(!bucket || !namespaces[ns]) return;
    var local = {};
    namespaces[ns].forEach(function(k){
      if(typeof bucket[k] !== 'string') return;
      var L = localStorage.getItem(k), v = reconcileKey(k, L, bucket[k], undefined);
      if(v !== L) local[k] = { was: L, v: v };
    });
    applyLocal(local);
  }

  // Reads a row of either shape. Pre-v2 rows were a flat bag of nremt_* keys.
  function unpack(data){
    if(!data) return {};
    if(data.v === 2 && data.ns) return data.ns;
    return { nremt: data };
  }

  /* ---- sync ---------------------------------------------------------- */

  function getClient(){
    if(!client && window.supabase) client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    return client;
  }

  /* The row's updated_at is its version. A write names the version it read
     (update ... where updated_at = what was read; an insert when there was no
     row), and a write that matched nothing means another device wrote in
     between: re-read, re-merge, try again, up to MAX_TRIES. The new stamp is
     always later than the one read, even from a device whose clock is behind. */
  function nextStamp(readAt){
    var t = Date.now(), r = readAt ? Date.parse(readAt) : NaN;
    if(r >= t) t = r + 1;
    return new Date(t).toISOString();
  }
  function writeRow(c, uid, data, row){
    var stamp = nextStamp(row && row.updated_at), q;
    if(!row){
      q = c.from('user_progress').insert({ id: uid, data: data, updated_at: stamp });
    } else {
      q = c.from('user_progress').update({ data: data, updated_at: stamp }).eq('id', uid);
      q = row.updated_at == null ? q.is('updated_at', null) : q.eq('updated_at', row.updated_at);
    }
    return q.select('updated_at').then(function(res){
      if(res.error){
        if(!row && res.error.code === '23505') return 'conflict';   // a row appeared meanwhile
        throw res.error;
      }
      return res.data && res.data.length ? 'ok' : 'conflict';
    });
  }

  function attempt(c, uid, tries){
    return c.from('user_progress').select('data, updated_at').eq('id', uid).maybeSingle()
      .then(function(res){
        if(res.error) throw res.error;
        var row = res.data || null;
        var rec = reconcile(unpack(row && row.data), loadState().base);
        var write = rec.changed ? writeRow(c, uid, { v: 2, ns: rec.ns }, row) : Promise.resolve('ok');
        return write.then(function(outcome){
          if(outcome === 'conflict'){
            if(tries + 1 >= MAX_TRIES) throw new Error('sync conflict: the row kept changing');
            return attempt(c, uid, tries + 1);
          }
          var applied = applyLocal(rec.local);
          var state = loadState();
          Object.keys(namespaces).forEach(function(ns){
            namespaces[ns].forEach(function(k){
              if(k in rec.base) state.base[k] = rec.base[k]; else delete state.base[k];
            });
          });
          state.at = Date.now();
          state.fails = 0;
          saveState(state);
          return { ok: true, applied: applied, wrote: rec.changed };
        });
      });
  }

  var inflight = null, again = false, lastStart = 0, reported = false;

  /* Pull and push in one: read the row, reconcile it key by key with this
     browser, write it back if it changed (conditionally, above), and write
     the merged values here if they changed. Single-flight: a call made while
     one runs queues one more. Resolves { ok, applied: [keys], wrote }; never
     rejects. A failure is counted; after FAIL_REPORT_AFTER in a row it shows
     on the account button and menu and is reported once per page. */
  function sync(){
    var c = getClient();
    if(!c || !currentUser) return Promise.resolve({ ok: false, applied: [] });
    if(inflight){ again = true; return inflight; }
    lastStart = Date.now();
    inflight = attempt(c, currentUser.id, 0).then(null, function(err){
      var state = loadState();
      state.fails = (state.fails || 0) + 1;
      saveState(state);
      if(state.fails >= FAIL_REPORT_AFTER && !reported && navigator.onLine !== false && window.LevlErrors && window.LevlErrors.report){
        reported = true;
        try { window.LevlErrors.report('progress sync failed ' + state.fails + ' times in a row: ' + String((err && (err.code || err.message)) || err).slice(0, 120), 'account.js'); } catch(e){}
      }
      return { ok: false, applied: [], error: err };
    }).then(function(r){
      inflight = null;
      renderSyncState();
      if(r.applied.length) announceApplied(r.applied);
      if(again){ again = false; sync(); }
      return r;
    });
    return inflight;
  }

  /* Pages that already listen for another tab's writes (A&P's dashboards)
     re-render on a synced write the same way; anything else picks the new
     values up on its next read or the next page. */
  function announceApplied(keys){
    keys.forEach(function(k){
      try { window.dispatchEvent(new StorageEvent('storage', { key: k })); } catch(e){}
    });
    try { window.dispatchEvent(new CustomEvent('levlprep:synced', { detail: { keys: keys } })); } catch(e){}
  }

  function syncStatus(){
    var s = loadState(), f = s.fails || 0;
    return { lastSynced: s.at || 0, failures: f, failing: f >= FAIL_REPORT_AFTER };
  }
  function ago(ms){
    var m = Math.round((Date.now() - ms) / 60000);
    if(m < 1) return 'just now';
    if(m < 60) return m + ' min ago';
    var h = Math.round(m / 60);
    if(h < 48) return h + (h === 1 ? ' hour ago' : ' hours ago');
    return Math.round(h / 24) + ' days ago';
  }
  function syncStatusText(){
    var s = syncStatus();
    var last = s.lastSynced ? 'Last synced ' + ago(s.lastSynced) + '.' : 'Not synced from this browser yet.';
    if(!s.failing) return last;
    return 'Sync has failed ' + s.failures + ' times in a row. ' + last +
      ' Your progress is safe in this browser and will sync once the connection is back.';
  }
  // The button carries the failing state so it shows without opening the
  // menu; the menu line says the rest.
  function renderSyncState(){
    var btn = document.getElementById('accountBtn');
    var failing = !!currentUser && syncStatus().failing;
    if(btn && currentUser){
      btn.setAttribute('title', (currentUser.email || '') + (failing ? ' (progress sync is failing)' : ''));
      if(failing){
        btn.setAttribute('data-sync', 'error');
        btn.setAttribute('aria-label', btn.textContent + ', progress sync is failing');
      } else { btn.removeAttribute('data-sync'); btn.removeAttribute('aria-label'); }
    }
    var state = document.getElementById('accountMenuState');
    if(state && !state.getAttribute('data-busy')) state.textContent = syncStatusText();
  }

  /* Progress used to reach the cloud only on the 30-second timer or when the
     page was hidden, and the hidden-page sync is two round trips a closing
     tab rarely lives to finish. Calling this after a change starts the write
     while the page is still open and has a network. */
  function syncSoon(){
    if(!currentUser) return;
    if(soonTimer) clearTimeout(soonTimer);
    soonTimer = setTimeout(function(){ soonTimer = null; sync(); }, 1500);
  }
  function flushSoon(){
    if(!soonTimer) return;
    clearTimeout(soonTimer);
    soonTimer = null;
  }

  /* A sync that brought another device's progress in, before anybody has
     touched the page (or right after signing in), reloads it once per tab
     session so the level, streak and dashboards on screen show it. Later
     ones only announce the keys: reloading under somebody mid-question is
     worse than a stale badge until the next page. */
  var interacted = false;
  function markInteracted(){ interacted = true; }
  function reloadOnceIf(r, force){
    if(!r.ok || !r.applied.length || (!force && interacted)) return;
    if(sessionStorage.getItem(RELOAD_ONCE_KEY)) return;
    sessionStorage.setItem(RELOAD_ONCE_KEY, '1');
    location.reload();
  }

  // Signed in on this page: sync now (the pull on every page load), then on
  // the timer, on coming back to the tab, and on leaving it.
  function startSyncTimer(reason){
    stopSyncTimer();
    syncTimer = setInterval(sync, SYNC_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('pointerdown', markInteracted, true);
    document.addEventListener('keydown', markInteracted, true);
    return sync().then(function(r){ reloadOnceIf(r, reason === 'signin'); return r; });
  }
  function stopSyncTimer(){
    if(syncTimer) clearInterval(syncTimer);
    syncTimer = null;
    flushSoon();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('pagehide', onPageHide);
  }
  // Back on the tab: the other device may have moved on. Throttled, since
  // focus and visibilitychange arrive together and alt-tabbing is common.
  function onFocus(){
    if(Date.now() - lastStart < FOCUS_THROTTLE_MS) return;
    flushSoon();
    sync();
  }
  function onVisibilityChange(){
    if(document.visibilityState === 'hidden'){ flushSoon(); sync(); }
    else onFocus();
  }
  // Safari on iOS often skips straight to pagehide when a tab is closed or
  // the app is swapped out, so visibilitychange alone loses that last write.
  function onPageHide(){ flushSoon(); sync(); }

  /* ---- auth UI --------------------------------------------------------

     What a login is for, here: keeping a level and a streak that already
     exist. Nobody arrives wanting an account, so every step that is not
     load-bearing is friction charged against work the student has already
     done. That shapes the whole section — one screen, the fewest fields
     that can work, a way back in when the password is gone, and errors
     that say what to do next instead of what the server called it.
     ------------------------------------------------------------------ */

  // Eight, not six. Six characters is inside the range a commodity GPU
  // walks through offline, and it is the floor Supabase ships rather than
  // a considered one. Length is also the only rule here: forced symbols
  // and digits reliably produce P@ssw0rd1 and a sticky note, which is why
  // NIST stopped recommending them. The strength meter below advises,
  // and only length is actually enforced.
  var MIN_PASSWORD = 8;

  /* ---- social sign-in -------------------------------------------------

     The fastest sign-in is the one with no form in it: two taps on a phone,
     an address that cannot be typo'd, and no password to invent now or
     recall in March.

     Which providers exist is NOT hardcoded here. A provider only works once
     it has an OAuth client id and secret in the Supabase dashboard, and a
     button for one that doesn't is a dead end that looks like a bug — but a
     hardcoded list has the matching failure, where the dashboard is switched
     on and the site keeps hiding the button until someone remembers to edit
     and redeploy this file. So the row asks the project what is actually
     enabled (GoTrue publishes it at /auth/v1/settings, unauthenticated) and
     renders exactly that. Turning Google on in the dashboard turns it on
     here, with no commit and no deploy.

     PROVIDERS is only presentation: the label and mark to use IF the project
     reports one enabled, in the order they should appear. A provider enabled
     upstream that isn't listed here is ignored rather than rendered blank. */

  // Marks are each provider's own; their brand guidelines require the real
  // logo rather than a lookalike, and all three ship as flat SVG paths.
  var MARKS = {
    google:
      '<svg viewBox="0 0 18 18" width="17" height="17" aria-hidden="true" focusable="false">' +
      '<path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>' +
      '<path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>' +
      '<path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>' +
      '<path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>',
    apple:
      '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false" fill="currentColor">' +
      '<path d="M16.37 12.78c.02 2.6 2.28 3.46 2.3 3.47-.02.06-.36 1.24-1.19 2.45-.72 1.05-1.47 2.1-2.64 2.12-1.15.02-1.52-.68-2.84-.68-1.31 0-1.72.66-2.81.7-1.13.05-1.99-1.13-2.72-2.18-1.48-2.15-2.62-6.08-1.09-8.73.76-1.31 2.11-2.15 3.58-2.17 1.11-.02 2.15.75 2.83.75.68 0 1.95-.93 3.28-.79.56.02 2.13.22 3.14 1.7-.08.05-1.87 1.1-1.85 3.27M14.2 4.6c.6-.73 1.01-1.75.9-2.76-.87.03-1.92.58-2.55 1.31-.56.64-1.05 1.68-.92 2.67.97.07 1.96-.49 2.57-1.22"/></svg>',
    github:
      '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false" fill="currentColor">' +
      '<path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.26.8-.57v-2c-3.34.72-4.04-1.6-4.04-1.6-.54-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.2.68.82.56A12 12 0 0 0 12 .3"/></svg>'
  };

  // Order is deliberate: Google covers the overwhelming majority of student
  // addresses, so it goes first whenever it is on.
  var PROVIDERS = [
    { id: 'google', name: 'Google' },
    { id: 'apple',  name: 'Apple' },
    { id: 'github', name: 'GitHub' }
  ];

  var PROVIDERS_CACHE_KEY = 'levlprep_auth_providers';
  var PROVIDERS_CACHE_HOURS = 12;
  var enabledProviders = null;   // ids the project reports, once known

  /* Cached so the second visit renders the buttons in the same frame as the
     rest of the dialog. A row of sign-in buttons that pops in a beat late is
     worse than useless: the student has already started typing, and the
     layout jumps under their hands. The cache is revalidated in the
     background every open, so a dashboard change lands within a day at the
     outside and usually on the next page load. */
  function cachedProviders(){
    try {
      var raw = JSON.parse(localStorage.getItem(PROVIDERS_CACHE_KEY) || 'null');
      if(raw && raw.at && (Date.now() - raw.at) < PROVIDERS_CACHE_HOURS * 3600000 && raw.ids) return raw.ids;
    } catch(e){ /* unreadable: treat as unknown */ }
    return null;
  }

  function forgetProviders(){
    try { localStorage.removeItem(PROVIDERS_CACHE_KEY); } catch(e){ /* nothing cached */ }
  }

  function fetchProviders(){
    if(!window.fetch) return Promise.resolve(null);
    return fetch(SUPABASE_URL + '/auth/v1/settings', {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY }
    }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
      if(!j || !j.external) return null;
      var ids = PROVIDERS.filter(function(p){ return j.external[p.id] === true; })
                         .map(function(p){ return p.id; });
      try { localStorage.setItem(PROVIDERS_CACHE_KEY, JSON.stringify({ at: Date.now(), ids: ids })); }
      catch(e){ /* private mode: just re-ask next time */ }
      return ids;
    }, function(){ return null; });   // offline: fall back to whatever is cached
  }

  /* ---- what this browser used last -------------------------------------

     Three ways in means a returning student has to remember which one was
     theirs, and the failure when they guess wrong is the worst error in the
     whole form: an account created with Google has no password, so typing
     one returns "invalid credentials" forever with no hint that the answer
     is the button above. Remembering the method turns that dead end into a
     sentence, and lets the button they actually use carry a "last time"
     mark. The email is remembered for the same reason and never the
     password. */
  var LAST_EMAIL_KEY = 'levlprep_last_email';
  var LAST_METHOD_KEY = 'levlprep_last_method';   // 'password' | 'magiclink' | provider id

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  /* Backend error text is written for whoever is reading the logs. Supabase's
     leaks its own vocabulary ("AuthApiError", "otp_expired") and, in the case
     that matters most, is actively unhelpful: a mistyped password comes back
     as "Invalid login credentials", which tells a student neither which of
     the two fields was wrong nor that the fix is a reset link ten pixels
     away. So every failure reachable from this form gets a sentence naming
     what happened and what to do next. Anything unrecognised falls through
     to the original text rather than a shrug, because a real message we have
     not seen yet still beats "Something went wrong". */
  function authMessage(error){
    var raw = String((error && (error.message || error.error_description)) || '');
    var code = String((error && error.code) || '').toLowerCase();
    var status = (error && error.status) || 0;
    var m = raw.toLowerCase();
    function has(s){ return m.indexOf(s) !== -1; }

    /* The mail cap is not the sign-in cap and must not borrow its wording:
       it is counted per hour and across the whole project rather than per
       minute and per person, so "wait a minute and try again" would be a
       straightforwardly false promise to someone who has done nothing wrong
       and whose only real option is a different way in. */
    if(code === 'over_email_send_rate_limit' || (code.indexOf('email') !== -1 && code.indexOf('rate') !== -1))
      return 'We can only send a few emails an hour, and that limit is used up right now. Try again later, or sign in with your password.';
    if(status === 429 || code.indexOf('rate_limit') !== -1 || has('rate limit') || has('too many'))
      return 'Too many tries just now. Wait a minute, then try again.';
    if(code === 'invalid_credentials' || has('invalid login credentials'))
      return 'That email and password don’t match an account. Check the password — or reset it below.';
    if(code === 'email_not_confirmed' || has('email not confirmed'))
      return 'Confirm your email first. We sent a link when you signed up — check spam too.';
    if(code === 'user_already_exists' || has('already registered') || has('already been registered'))
      return 'There’s already an account with that email. Sign in instead, or reset the password.';
    if(code === 'weak_password' || has('password should be'))
      return 'That password is too short — use at least ' + MIN_PASSWORD + ' characters.';
    if(code === 'same_password' || has('should be different'))
      return 'That’s the password you already have. Pick a different one.';
    if(code === 'validation_failed' || has('unable to validate email') || has('invalid email'))
      return 'That email address doesn’t look right.';
    if(code === 'otp_expired' || has('expired') || has('invalid or has expired'))
      return 'That link has expired. Request a new one below.';
    if(has('failed to fetch') || has('networkerror') || has('network request'))
      return 'Couldn’t reach the server. Check your connection and try again.';
    return raw || 'Something went wrong. Please try again.';
  }

  // The handful of passwords that turn up first in every breach corpus, plus
  // this site's own name — a domain word is the first thing an attacker
  // guesses and the first thing a student reaches for. Not a filter (the
  // meter advises, it does not block), just the one case where "12 characters
  // long" is a lie the bar shouldn't tell.
  var WEAK_PASSWORDS = ['password','password1','password123','12345678','123456789','1234567890',
    'qwertyuiop','qwerty123','letmein','iloveyou','admin123','welcome1','levlprep','levlprep1'];

  /* Strength as advice, not as a gate. The scale is length-first because
     that is what actually costs an attacker time; character variety only
     moves the bar once the password is already long enough for variety to
     multiply anything. */
  function passwordScore(pw){
    pw = String(pw || '');
    if(!pw) return { score: 0, label: '', hint: 'At least ' + MIN_PASSWORD + ' characters — length beats symbols.' };
    if(WEAK_PASSWORDS.indexOf(pw.toLowerCase()) !== -1)
      return { score: 0, label: 'Too common', hint: 'This one is in every leaked-password list. Pick another.' };
    if(pw.length < MIN_PASSWORD)
      return { score: 0, label: 'Too short', hint: (MIN_PASSWORD - pw.length) + ' more character' + (MIN_PASSWORD - pw.length === 1 ? '' : 's') + ' to go.' };

    var variety = 0;
    if(/[a-z]/.test(pw)) variety++;
    if(/[A-Z]/.test(pw)) variety++;
    if(/[0-9]/.test(pw)) variety++;
    if(/[^A-Za-z0-9]/.test(pw)) variety++;

    var score = 1;
    if(pw.length >= 10 && variety >= 2) score = 2;
    if(pw.length >= 12 && variety >= 2) score = 3;
    if(pw.length >= 14 || (pw.length >= 12 && variety >= 3)) score = 4;

    var labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
    var hints = ['', 'Works, but a longer one is much harder to guess.',
      'Fine. A few more characters would make it strong.', 'Good password.', 'Strong password.'];
    return { score: score, label: labels[score], hint: hints[score] };
  }

  // A confirmation email sent to gmial.com is not bounced — it is delivered
  // nowhere and silently, and the student waits for it. One keystroke away
  // from the six domains that cover nearly every address is worth catching.
  var DOMAIN_FIXES = {
    'gmial.com':'gmail.com','gmai.com':'gmail.com','gmail.co':'gmail.com','gmail.con':'gmail.com',
    'gmail.cm':'gmail.com','gnail.com':'gmail.com','gmaill.com':'gmail.com','gmail.om':'gmail.com',
    'yahoo.con':'yahoo.com','yaho.com':'yahoo.com','yahooo.com':'yahoo.com','yahoo.co':'yahoo.com',
    'hotmai.com':'hotmail.com','hotmial.com':'hotmail.com','hotmail.con':'hotmail.com','hotmail.co':'hotmail.com',
    'outlok.com':'outlook.com','outloo.com':'outlook.com','outlook.con':'outlook.com',
    'iclod.com':'icloud.com','icloud.co':'icloud.com','icoud.com':'icloud.com',
    'protonmai.com':'protonmail.com','protonmail.co':'protonmail.com'
  };
  function emailTypo(email){
    var s = String(email || '').trim();
    var at = s.lastIndexOf('@');
    if(at < 1 || at === s.length - 1) return null;
    var fix = DOMAIN_FIXES[s.slice(at + 1).toLowerCase()];
    return fix ? s.slice(0, at + 1) + fix : null;
  }

  /* ---- account button + menu ------------------------------------------ */

  // The host page owns where the button goes; this only fills the slot if
  // one exists, so a page with no #accountSlot simply shows no account UI.
  function renderAccountUI(){
    var mount = document.getElementById('accountSlot');
    if(!mount) return;
    if(currentUser){
      var label = currentUser.email ? currentUser.email.split('@')[0] : 'Account';
      mount.innerHTML = '<button type="button" class="account-btn" id="accountBtn" aria-haspopup="menu" ' +
        'aria-expanded="false" title="' + escapeHtml(currentUser.email || '') + '">' + escapeHtml(label) + '</button>';
    } else {
      mount.innerHTML = '<button type="button" class="account-btn" id="accountBtn">Log in</button>';
    }
    var btn = document.getElementById('accountBtn');
    if(btn) btn.addEventListener('click', function(){
      if(currentUser) toggleAccountMenu(btn); else openAuthModal('signin');
    });
    renderSyncState();
  }

  /* This was a window.confirm(), which is the wrong shape twice over: it
     asks a yes/no question when the useful answer is usually neither ("is
     my work actually saved?"), and a native dialog can't say when the last
     sync was. Signing out with unsynced work in the browser is the one way
     to lose progress here, so the menu shows the state and pushes before it
     goes. */
  function closeAccountMenu(){
    var m = document.getElementById('accountMenu');
    if(m && m.parentNode) m.parentNode.removeChild(m);
    var btn = document.getElementById('accountBtn');
    if(btn) btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClickForMenu, true);
    document.removeEventListener('keydown', onMenuKeydown, true);
  }
  function onDocClickForMenu(e){
    var m = document.getElementById('accountMenu');
    var btn = document.getElementById('accountBtn');
    if(!m) return;
    if(m.contains(e.target) || (btn && btn.contains(e.target))) return;
    closeAccountMenu();
  }
  function onMenuKeydown(e){
    if(e.key === 'Escape'){
      closeAccountMenu();
      var btn = document.getElementById('accountBtn');
      if(btn) btn.focus();
    }
  }

  function toggleAccountMenu(btn){
    if(document.getElementById('accountMenu')){ closeAccountMenu(); return; }
    var menu = document.createElement('div');
    menu.id = 'accountMenu';
    menu.className = 'account-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML =
      '<div class="account-menu__who">' +
        '<b>' + escapeHtml(currentUser.email || 'Signed in') + '</b>' +
        '<small id="accountMenuState" aria-live="polite">' + escapeHtml(syncStatusText()) + '</small>' +
      '</div>' +
      '<a role="menuitem" href="/account.html" id="accountPageLink">Account &amp; Premium</a>' +
      '<button type="button" role="menuitem" id="accountSyncBtn">Sync now</button>' +
      '<button type="button" role="menuitem" id="accountSignOutBtn">Sign out</button>' +
      '<button type="button" role="menuitem" class="account-menu__danger" id="accountDeleteBtn">Delete account</button>';
    document.body.appendChild(menu);

    // Anchored to the button rather than fixed to a corner, so it lands under
    // the account button wherever a page's header happens to put it.
    var r = btn.getBoundingClientRect();
    menu.style.top = (r.bottom + window.scrollY + 8) + 'px';
    menu.style.left = Math.max(8, Math.min(
      r.right + window.scrollX - menu.offsetWidth,
      window.scrollX + document.documentElement.clientWidth - menu.offsetWidth - 8
    )) + 'px';

    btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', onDocClickForMenu, true);
    document.addEventListener('keydown', onMenuKeydown, true);

    var state = document.getElementById('accountMenuState');
    function busy(text){ state.setAttribute('data-busy', '1'); state.textContent = text; }
    function idle(text){ state.removeAttribute('data-busy'); state.textContent = text || syncStatusText(); }
    document.getElementById('accountSyncBtn').addEventListener('click', function(){
      busy('Syncing…');
      sync().then(function(r){
        idle(r.ok ? 'Synced just now.' : 'That sync didn\u2019t go through. Your progress is safe in this browser; try again in a moment.');
      });
    });
    var signOutAnyway = false;
    document.getElementById('accountSignOutBtn').addEventListener('click', function(){
      var b = this;
      b.disabled = true;
      busy('Saving your progress first…');
      // Sign out only once the last write is away. Dropping the session
      // first would strand whatever happened since the last sync in a
      // browser that is about to look signed-out. If it cannot be saved,
      // say so and let a second click sign out anyway.
      sync().then(function(r){
        if(!r.ok && !signOutAnyway){
          signOutAnyway = true;
          b.disabled = false;
          idle('Couldn\u2019t save your latest progress to your account, so it is only in this browser for now. Choose Sign out again to sign out anyway.');
          return;
        }
        var c = getClient();
        if(c) c.auth.signOut();
        closeAccountMenu();
      });
    });
    document.getElementById('accountDeleteBtn').addEventListener('click', function(){
      closeAccountMenu();
      openDeleteModal();
    });
    var first = menu.querySelector('button');
    if(first) first.focus();
  }

  /* ---- deleting an account --------------------------------------------- */

  /* privacy.html invoked GDPR and CCPA and then asked people to send an email,
     which is a deletion right in the same sense that a locked door with a
     doorbell is an exit. This is the button.

     Three things this screen has to get right, and only the first is obvious.

     1. It is irreversible, so it asks properly. Not window.confirm() — the
        sign-out menu exists because that dialog was the wrong shape for a
        decision — and not a single OK either. The word has to be typed.

     2. THE ACCOUNT AND THE BROWSER ARE TWO DIFFERENT THINGS, and almost
        nobody expects that. Progress lives in localStorage and the account is
        a copy of it for syncing; deleting the account deletes the copy. Left
        alone, "delete my account" would silently leave every streak, level and
        answered question sitting in the browser the person is looking at —
        which is either exactly what they wanted or the opposite, and they are
        the only one who knows. So it is a checkbox, on by default because
        somebody asking to be deleted usually means all of it, and named
        plainly enough that turning it off is a real option.

     3. It offers the backup first. This is the one action on the site that
        destroys work on purpose, and the export already exists on
        privacy.html; making someone go and find it, in a dialog they cannot
        leave without starting over, is how a person loses four months of
        study to a change of mind. progress-backup.js is loaded on demand
        here rather than on all 101 pages that carry this file.

     The delete itself is one RPC that takes no arguments: delete_own_account()
     reads auth.uid() from the caller's verified token, so there is no id to
     pass and therefore no id to tamper with. */
  var deleteOverlay = null;
  var deleteLastFocused = null;

  function ensureBackupModule(cb){
    if(window.LevlBackup){ cb(); return; }
    var el = document.createElement('script');
    el.src = '/assets/progress-backup.js';
    el.onload = cb;
    el.onerror = function(){ cb(); };  // the button below just stays disabled
    document.head.appendChild(el);
  }

  function ensureDeleteModal(){
    if(deleteOverlay) return deleteOverlay;
    deleteOverlay = document.createElement('div');
    deleteOverlay.className = 'auth-modal-overlay';
    deleteOverlay.id = 'deleteOverlay';
    deleteOverlay.innerHTML =
      '<div class="auth-modal delete-modal" role="dialog" aria-modal="true" aria-labelledby="deleteTitle" aria-describedby="deleteSub">' +
        '<button type="button" class="auth-modal-close" id="deleteClose" aria-label="Close">&times;</button>' +
        '<h2 id="deleteTitle">Delete your account</h2>' +
        '<p class="auth-modal-sub" id="deleteSub">This removes your account, your email address and the synced copy of your progress. Any Premium pass on the account ends too, without a refund. It cannot be undone and we cannot get it back for you.</p>' +
        '<form id="deleteForm">' +
          '<div class="delete-backup">' +
            '<p>This is the one thing on the site that deletes your work on purpose. Take a copy first — it is a single file and it can be restored later.</p>' +
            '<button type="button" class="btn-press alt" id="deleteBackupBtn">Download a backup</button>' +
            '<small id="deleteBackupNote" role="status" aria-live="polite"></small>' +
          '</div>' +
          '<label class="delete-local">' +
            '<input type="checkbox" id="deleteLocal" checked>' +
            '<span><b>Also erase everything saved in this browser.</b> Your streak, level, answered questions and lesson progress are stored on this device as well as in your account. Leave this on to clear both; turn it off to keep studying on this device without an account.</span>' +
          '</label>' +
          '<label class="delete-confirm" for="deleteConfirm">Type DELETE to confirm' +
            '<input type="text" id="deleteConfirm" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="DELETE">' +
          '</label>' +
          '<div class="auth-modal-msg" id="deleteMsg" role="alert" aria-live="polite"></div>' +
          '<button type="submit" class="auth-modal-submit delete-submit" id="deleteSubmit" disabled>Delete my account</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(deleteOverlay);

    deleteOverlay.addEventListener('click', function(e){
      if(e.target === deleteOverlay) closeDeleteModal();
    });
    document.getElementById('deleteClose').addEventListener('click', closeDeleteModal);

    var confirmInput = document.getElementById('deleteConfirm');
    confirmInput.addEventListener('input', function(){
      // The submit stays dead until the word is right. Accepting a near miss
      // would make the typing ceremonial, which is the one thing it must not
      // be.
      document.getElementById('deleteSubmit').disabled = confirmInput.value.trim().toUpperCase() !== 'DELETE';
    });

    document.getElementById('deleteBackupBtn').addEventListener('click', function(){
      var note = document.getElementById('deleteBackupNote');
      var btn = this;
      btn.disabled = true;
      note.textContent = 'Preparing\u2026';
      ensureBackupModule(function(){
        btn.disabled = false;
        if(!window.LevlBackup){ note.textContent = 'Couldn\u2019t load the backup tool. privacy.html has it too.'; return; }
        var res = window.LevlBackup.download();
        note.textContent = res.ok
          ? 'Saved ' + res.keys + ' items. Keep that file somewhere you will find it.'
          : res.error;
      });
    });

    document.getElementById('deleteForm').addEventListener('submit', submitDelete);

    document.addEventListener('keydown', function(e){
      if(!deleteOverlay.classList.contains('open')) return;
      if(e.key === 'Escape'){ closeDeleteModal(); return; }
      if(e.key !== 'Tab') return;
      var list = Array.prototype.filter.call(
        deleteOverlay.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'),
        function(n){ return n.offsetParent !== null || n === document.activeElement; });
      if(!list.length) return;
      var f = list[0], l = list[list.length - 1];
      if(e.shiftKey && document.activeElement === f){ e.preventDefault(); l.focus(); }
      else if(!e.shiftKey && document.activeElement === l){ e.preventDefault(); f.focus(); }
    });

    return deleteOverlay;
  }

  function openDeleteModal(){
    if(!currentUser) return;
    ensureDeleteModal();
    deleteLastFocused = document.activeElement;
    document.getElementById('deleteConfirm').value = '';
    document.getElementById('deleteLocal').checked = true;
    document.getElementById('deleteSubmit').disabled = true;
    document.getElementById('deleteSubmit').textContent = 'Delete my account';
    document.getElementById('deleteMsg').textContent = '';
    document.getElementById('deleteMsg').className = 'auth-modal-msg';
    document.getElementById('deleteBackupNote').textContent = '';
    deleteOverlay.classList.add('open');
    document.documentElement.classList.add('auth-modal-open');
    document.getElementById('deleteBackupBtn').focus();
    authEvent('account-delete-opened');
  }

  function closeDeleteModal(){
    if(!deleteOverlay) return;
    deleteOverlay.classList.remove('open');
    document.documentElement.classList.remove('auth-modal-open');
    if(deleteLastFocused && deleteLastFocused.focus){ try { deleteLastFocused.focus(); } catch(e){} }
    deleteLastFocused = null;
  }

  function submitDelete(e){
    e.preventDefault();
    var msg = document.getElementById('deleteMsg');
    var btn = document.getElementById('deleteSubmit');
    var alsoLocal = document.getElementById('deleteLocal').checked;
    var c = getClient();
    if(!c || !currentUser){
      msg.className = 'auth-modal-msg error';
      msg.textContent = 'You are not signed in any more. Reload the page and try again.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Deleting\u2026';
    msg.className = 'auth-modal-msg';
    msg.textContent = '';

    c.rpc('delete_own_account').then(function(res){
      if(res && res.error){
        // Never say "deleted" about something that is still there. Someone who
        // believes their account is gone will not check, and will not ask.
        btn.disabled = false;
        btn.textContent = 'Delete my account';
        msg.className = 'auth-modal-msg error';
        msg.textContent = 'That didn\u2019t go through, and your account is untouched. ' +
          'Check your connection and try again — if it keeps failing, email the address on the privacy page.';
        return;
      }

      // Local erasure happens only AFTER the account is confirmed gone. The
      // other order risks wiping the device for a delete that then failed,
      // which is the worst outcome available here.
      if(alsoLocal) clearLocalProgress();

      // Sign out without pushing first. push() before signOut is the rule
      // everywhere else in this file, and here it would be re-creating the row
      // that was just deleted.
      authEvent('account-deleted', { local: alsoLocal ? 'cleared' : 'kept' });
      c.auth.signOut().then(function(){ location.reload(); }, function(){ location.reload(); });
    }, function(){
      btn.disabled = false;
      btn.textContent = 'Delete my account';
      msg.className = 'auth-modal-msg error';
      msg.textContent = 'That didn\u2019t go through, and your account is untouched. Check your connection and try again.';
    });
  }

  /* An allow-list, for the same reason progress-backup.js exports by one: a
     deny-list would quietly stop covering whatever a future feature stores.
     Here the stakes are reversed — this is the side that destroys data — so it
     also means a key nobody added on purpose survives, which is the failure
     worth having.

     KEEP is the part that is easy to get wrong. levlprep_analytics_opt_out is
     a standing instruction not to collect something, not progress; wiping it
     would turn "delete my account" into "and start tracking me again", which
     is the exact opposite of what was asked for. It is the one key that
     outlives the account on purpose. */
  var CLEAR_PREFIXES = ['hub_', 'nremt_', 'ochem_', 'anp_', 'levlprep_'];
  var CLEAR_EXACT = ['levl_sound'];
  var CLEAR_KEEP = ['levlprep_analytics_opt_out'];

  function clearLocalProgress(store){
    var ls = store || localStorage;
    try {
      var doomed = [];
      for(var i = 0; i < ls.length; i++){
        var k = ls.key(i);
        if(!k || CLEAR_KEEP.indexOf(k) !== -1) continue;
        var hit = CLEAR_EXACT.indexOf(k) !== -1;
        for(var j = 0; !hit && j < CLEAR_PREFIXES.length; j++){
          if(k.indexOf(CLEAR_PREFIXES[j]) === 0) hit = true;
        }
        if(hit) doomed.push(k);
      }
      // Collected first, then removed: removing inside the loop renumbers the
      // keys under the index it is walking and skips every other one.
      doomed.forEach(function(k){ ls.removeItem(k); });
      return doomed;
    } catch(e){ return []; /* nothing was stored to begin with */ }
  }

  /* ---- auth modal ------------------------------------------------------ */

  var authMode = 'signin';       // signin | signup | reset | newpassword
  /* Why the dialog was opened. From a Premium "Get it" button the account
     is for attaching a pass, and the usual "free, only so your progress
     survives a new phone" line contradicted the purchase in progress
     (audit 2026-10). */
  var authPurpose = '';
  var PURPOSE_SUB = {
    checkout: {
      signup: 'Create an account to attach your pass. You’ll pay next.',
      signin: 'Sign in to attach your pass to your account. You’ll pay next.'
    }
  };
  var lastFocused = null;        // restored when the modal closes
  var pendingEmail = '';         // address a confirmation mail just went to

  function msgEl(){ return document.getElementById('authModalMsg'); }
  function setMsg(text, kind){
    var el = msgEl();
    if(!el) return;
    el.textContent = text || '';
    el.className = 'auth-modal-msg' + (kind ? ' ' + kind : '');
  }

  function ensureAuthModal(){
    if(document.getElementById('authModalOverlay')) return;
    var overlay = document.createElement('div');
    overlay.id = 'authModalOverlay';
    overlay.className = 'auth-modal-overlay';

    // Empty until the project's enabled providers are known — from cache on
    // the same tick, or from the network a moment later on a first visit.
    var social = '<div class="auth-social" id="authSocial" hidden></div>' +
                 '<div class="auth-or" id="authOr" hidden><span>or</span></div>';

    overlay.innerHTML =
      '<div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="authModalTitle" aria-describedby="authModalSub">' +
        '<button type="button" class="auth-modal-close" id="authModalClose" aria-label="Close">&times;</button>' +
        '<h2 id="authModalTitle">Sign in</h2>' +
        '<p class="auth-modal-sub" id="authModalSub"></p>' +
        social +
        '<form id="authForm" novalidate>' +
          '<label id="authEmailLabel">Email' +
            '<input type="email" id="authEmail" required autocomplete="email" inputmode="email" ' +
              'autocapitalize="none" autocorrect="off" spellcheck="false" aria-describedby="authEmailHint">' +
          '</label>' +
          '<p class="auth-hint" id="authEmailHint" hidden></p>' +
          '<div class="auth-field" id="authPasswordLabel">' +
            '<span class="auth-label-row">' +
              '<label for="authPassword" id="authPasswordText">Password</label>' +
              '<button type="button" class="auth-reveal" id="authReveal" aria-pressed="false" aria-label="Show password" aria-controls="authPassword">Show</button>' +
            '</span>' +
            '<input type="password" id="authPassword" autocomplete="current-password" aria-describedby="authPwHint">' +
          '</div>' +
          '<div class="auth-strength" id="authStrength" hidden>' +
            '<div class="auth-strength__bar"><i id="authStrengthFill"></i></div>' +
            '<span class="auth-strength__label" id="authStrengthLabel"></span>' +
          '</div>' +
          '<p class="auth-hint" id="authPwHint" hidden></p>' +
          '<p class="auth-forgot" id="authForgotRow">' +
            '<button type="button" id="authForgotBtn">Forgot your password?</button>' +
          '</p>' +
          // role=alert rather than a plain <p>: a screen reader otherwise
          // gets no signal at all that the submit it just made failed.
          '<div class="auth-modal-msg" id="authModalMsg" role="alert" aria-live="polite"></div>' +
          '<button type="submit" class="auth-modal-submit" id="authSubmitBtn">Sign in</button>' +
        '</form>' +
        '<p class="auth-alt" id="authAltRow">' +
          '<button type="button" id="authMagicBtn">Email me a sign-in link instead</button>' +
        '</p>' +
        '<p class="auth-modal-toggle" id="authToggleRow">' +
          '<span id="authToggleText">Don’t have an account?</span> ' +
          '<button type="button" id="authToggleBtn">Create one</button>' +
        '</p>' +
      '</div>';
    document.body.appendChild(overlay);

    var el = {};
    ['authModalTitle','authModalSub','authForm','authEmail','authEmailLabel','authEmailHint',
     'authPassword','authPasswordLabel','authPasswordText','authPwHint','authReveal',
     'authStrength','authStrengthFill','authStrengthLabel','authForgotRow','authForgotBtn',
     'authSubmitBtn','authAltRow','authMagicBtn','authToggleRow','authToggleText','authToggleBtn',
     'authModalClose'].forEach(function(id){ el[id] = document.getElementById(id); });

    /* --- mode ---------------------------------------------------------- */

    var COPY = {
      signin: {
        title: 'Sign in',
        sub: 'One account for every subject on LevlPrep. Your level, streak and progress follow you to any device.',
        submit: 'Sign in',
        toggleText: 'Don’t have an account?',
        toggleBtn: 'Create one',
        password: true, forgot: true, magic: true, strength: false, social: true
      },
      signup: {
        title: 'Create account',
        sub: 'Free, and only so your progress survives a new phone or a cleared browser. Everything on the site works without one.',
        submit: 'Create account',
        toggleText: 'Already have an account?',
        toggleBtn: 'Sign in instead',
        password: true, forgot: false, magic: true, strength: true, social: true
      },
      reset: {
        title: 'Reset your password',
        sub: 'Enter the email you signed up with and we’ll send a link to set a new password.',
        submit: 'Send reset link',
        toggleText: 'Remembered it?',
        toggleBtn: 'Back to sign in',
        password: false, forgot: false, magic: false, strength: false, social: false
      },
      newpassword: {
        title: 'Set a new password',
        sub: 'Almost done — choose the password you’ll use from now on.',
        submit: 'Save new password',
        toggleText: '', toggleBtn: '',
        password: true, forgot: false, magic: false, strength: true, social: false
      }
    };

    function setMode(m){
      authMode = m;
      var c = COPY[m];
      el.authModalTitle.textContent = c.title;
      el.authModalSub.textContent = (PURPOSE_SUB[authPurpose] && PURPOSE_SUB[authPurpose][m]) || c.sub;
      el.authSubmitBtn.textContent = c.submit;
      el.authSubmitBtn.disabled = false;

      el.authEmailLabel.hidden = (m === 'newpassword');
      el.authEmail.required = (m !== 'newpassword');
      el.authPasswordLabel.hidden = !c.password;
      el.authPassword.required = c.password;
      el.authPasswordText.textContent = (m === 'newpassword') ? 'New password' : 'Password';
      el.authPassword.autocomplete = (m === 'signin') ? 'current-password' : 'new-password';
      el.authForgotRow.hidden = !c.forgot;
      el.authAltRow.hidden = !c.magic;
      el.authToggleRow.hidden = !c.toggleBtn;
      el.authToggleText.textContent = c.toggleText;
      el.authToggleBtn.textContent = c.toggleBtn;
      el.authStrength.hidden = true;

      // The row is shown only where it belongs (never on reset or recovery)
      // AND only if the project actually has a provider to put in it.
      var hasProviders = !!(enabledProviders && enabledProviders.length);
      var socialRow = document.getElementById('authSocial');
      var orRow = document.getElementById('authOr');
      if(socialRow) socialRow.hidden = !(c.social && hasProviders);
      if(orRow) orRow.hidden = !(c.social && hasProviders);

      setHint(el.authEmailHint, '');
      setHint(el.authPwHint, '');
      setReveal(false);
      unsuggestMagicLink();
      setMsg('');
      if(c.strength) renderStrength();
    }

    function setHint(node, html){
      node.innerHTML = html || '';
      node.hidden = !html;
    }

    /* --- password reveal + caps lock ------------------------------------ */

    // A reveal toggle is why this form has no "confirm password" field. The
    // second field exists only to catch a typo you cannot see; being able to
    // look at what you typed catches the same typo without doubling the
    // work, and a forgotten password is now recoverable either way.
    function setReveal(on){
      el.authPassword.type = on ? 'text' : 'password';
      el.authReveal.textContent = on ? 'Hide' : 'Show';
      el.authReveal.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    el.authReveal.addEventListener('click', function(){
      setReveal(el.authPassword.type === 'password');
      el.authPassword.focus();
    });

    // "Invalid login credentials" while caps lock is on is the single most
    // maddening login failure there is, and the browser will never mention it.
    el.authPassword.addEventListener('keyup', function(e){
      var on = e.getModifierState && e.getModifierState('CapsLock');
      if(on) setHint(el.authPwHint, 'Caps Lock is on.');
      else if(el.authPwHint.textContent === 'Caps Lock is on.') setHint(el.authPwHint, '');
    });

    /* --- live feedback --------------------------------------------------- */

    function renderStrength(){
      var res = passwordScore(el.authPassword.value);
      el.authStrength.hidden = false;
      el.authStrengthFill.className = 'score-' + res.score;
      el.authStrengthFill.style.width = (res.score * 25) + '%';
      el.authStrengthLabel.textContent = res.label;
      if(el.authPwHint.textContent !== 'Caps Lock is on.') setHint(el.authPwHint, escapeHtml(res.hint));
    }
    el.authPassword.addEventListener('input', function(){
      if(COPY[authMode].strength) renderStrength();
    });

    // Checked on blur, not on every keystroke: "did you mean gmail.com?"
    // while someone is still halfway through typing gmail.com is a scold.
    el.authEmail.addEventListener('blur', function(){
      var fix = emailTypo(el.authEmail.value);
      if(!fix){ if(el.authEmailHint.dataset.kind === 'typo') setHint(el.authEmailHint, ''); return; }
      el.authEmailHint.dataset.kind = 'typo';
      setHint(el.authEmailHint, 'Did you mean <button type="button" class="auth-hint__fix" id="authTypoFix">' +
        escapeHtml(fix) + '</button>?');
      document.getElementById('authTypoFix').addEventListener('click', function(){
        el.authEmail.value = fix;
        setHint(el.authEmailHint, '');
        el.authPassword.focus();
      });
    });

    /* --- navigation ------------------------------------------------------ */

    el.authModalClose.addEventListener('click', closeAuthModal);
    overlay.addEventListener('click', function(e){
      // Never dismiss the recovery screen by a stray click: the token in the
      // URL is single-use, and closing here means asking for a whole new email.
      if(e.target === overlay && authMode !== 'newpassword') closeAuthModal();
    });
    el.authToggleBtn.addEventListener('click', function(){
      setMode(authMode === 'signin' ? 'signup' : 'signin');
      el.authEmail.focus();
    });
    el.authForgotBtn.addEventListener('click', function(){
      setMode('reset');
      el.authEmail.focus();
    });

    /* --- social ---------------------------------------------------------- */

    var socialRow = document.getElementById('authSocial');
    var orRow = document.getElementById('authOr');

    function renderProviders(ids){
      enabledProviders = ids || [];
      var list = PROVIDERS.filter(function(p){ return enabledProviders.indexOf(p.id) !== -1; });
      var last = lastMethod();
      socialRow.innerHTML = list.map(function(p){
        return '<button type="button" class="auth-social__btn" data-provider="' + escapeHtml(p.id) + '">' +
          '<span class="auth-social__mark">' + (MARKS[p.id] || '') + '</span>' +
          '<span class="auth-social__label"><span class="auth-social__verb">Continue with </span>' +
            escapeHtml(p.name) + '</span>' +
          (last === p.id ? '<span class="auth-social__last">Last time</span>' : '') +
        '</button>';
      }).join('');
      // Both the row and its "or" divider hide together when nothing is
      // enabled, so an email-only project shows a plain form with no seam.
      var show = list.length > 0 && COPY[authMode].social;
      socialRow.hidden = !show;
      orRow.hidden = !show;
    }

    // Delegated: the buttons are written after this listener exists, and are
    // rewritten whenever the provider list is revalidated.
    socialRow.addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('.auth-social__btn') : null;
      if(!b) return;
      var id = b.getAttribute('data-provider');
      var meta = PROVIDERS.filter(function(p){ return p.id === id; })[0];
      var c = getClient();
      if(!c) return setMsg('Accounts are unavailable right now — check your connection.', 'error');
      setMsg('Opening ' + (meta ? meta.name : 'provider') + '…');
      // Written before leaving the page, not after coming back: the redirect
      // replaces this document, so there is no "after" to run code in.
      rememberMethod(id);
      authEvent('auth-provider-chosen', { provider: id });
      c.auth.signInWithOAuth({
        provider: id,
        options: { redirectTo: location.origin + location.pathname }
      }).then(function(res){
        if(res && res.error){
          setMsg(authMessage(res.error), 'error');
          /* The cached provider list is up to 12 hours old, so the likeliest
             reason this failed is that the provider was switched off after
             this browser last looked. Drop the cache and re-ask rather than
             leaving a button that cannot work sitting there for the rest of
             the day. */
          forgetProviders();
          fetchProviders().then(function(ids){ if(ids) renderProviders(ids); });
        }
      }, function(){
        setMsg('Could not open ' + (meta ? meta.name : 'that provider') + '. Check your connection and try again.', 'error');
      });
    });

    overlay._renderProviders = renderProviders;
    renderProviders(cachedProviders());

    /* --- magic link ------------------------------------------------------ */

    // The password nobody has to remember. Worth offering first-class rather
    // than as a fallback: for a study site checked on a phone and a laptop,
    // "send me a link" is the whole ceremony, and a link that arrives beats a
    // password that has to be invented, stored and recalled.
    function suggestMagicLink(){
      el.authAltRow.classList.add('is-suggested');
      el.authMagicBtn.textContent = 'Not sure? Email me a sign-in link — it works either way';
    }
    function unsuggestMagicLink(){
      el.authAltRow.classList.remove('is-suggested');
      el.authMagicBtn.textContent = 'Email me a sign-in link instead';
    }

    el.authMagicBtn.addEventListener('click', function(){
      var email = el.authEmail.value.trim();
      if(!email){ setMsg('Enter your email first, then we’ll send the link.', 'error'); el.authEmail.focus(); return; }
      if(!looksLikeEmail(email)){ setMsg('That doesn’t look like an email address. Check it and try again.', 'error'); el.authEmail.focus(); return; }
      var c = getClient();
      if(!c) return setMsg('Accounts are unavailable right now — check your connection.', 'error');
      el.authMagicBtn.disabled = true;
      setMsg('Sending…');
      c.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + location.pathname } })
        .then(function(res){
          el.authMagicBtn.disabled = false;
          if(res.error) return setMsg(authMessage(res.error), 'error');
          rememberEmail(email);
          rememberMethod('magiclink');
          authEvent('auth-link-sent');
          setMsg('Link sent to ' + email + '. Open it on this device and you’re in.', 'success');
        }, function(){
          el.authMagicBtn.disabled = false;
          setMsg('Couldn’t send the link. Check your connection and try again.', 'error');
        });
    });

    /* --- submit ---------------------------------------------------------- */

    el.authForm.addEventListener('submit', function(e){
      e.preventDefault();
      var email = el.authEmail.value.trim();
      var password = el.authPassword.value;
      if(authMode !== 'newpassword'){
        if(!email) { setMsg('Enter the email you use for your account.', 'error'); el.authEmail.focus(); return; }
        if(!looksLikeEmail(email)) { setMsg('That doesn’t look like an email address. Check it and try again.', 'error'); el.authEmail.focus(); return; }
      }
      var c = getClient();
      if(!c) return setMsg('Accounts are unavailable right now — check your connection and try again.', 'error');

      if(COPY[authMode].password && password.length < MIN_PASSWORD && authMode !== 'signin'){
        setMsg('Use at least ' + MIN_PASSWORD + ' characters.', 'error');
        el.authPassword.focus();
        return;
      }
      if(authMode === 'signin' && !password){ setMsg('Enter your password.', 'error'); el.authPassword.focus(); return; }

      el.authSubmitBtn.disabled = true;
      var restore = el.authSubmitBtn.textContent;
      el.authSubmitBtn.textContent = { signin:'Signing in…', signup:'Creating…', reset:'Sending…', newpassword:'Saving…' }[authMode];
      setMsg('');

      function done(){ el.authSubmitBtn.disabled = false; el.authSubmitBtn.textContent = restore; }

      var run;
      if(authMode === 'signin') run = c.auth.signInWithPassword({ email: email, password: password });
      else if(authMode === 'signup') run = c.auth.signUp({ email: email, password: password,
        options: { emailRedirectTo: location.origin + location.pathname } });
      else if(authMode === 'reset') run = c.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/' });
      else run = c.auth.updateUser({ password: password });

      run.then(function(res){
        done();
        if(res && res.error){
          setMsg(authMessage(res.error), 'error');
          /* The worst dead end in a form that offers more than one way in:
             an account created with Google has no password at all, so every
             password attempt fails identically and forever, and nothing on
             screen connects that to the button two inches above. If this
             browser last got into this same address with a provider, say so
             — it is the answer often enough to be worth one sentence, and it
             is phrased as a reminder rather than a claim about the account,
             which this code cannot see. */
          var wrongPassword = res.error.code === 'invalid_credentials'
            || /invalid login credentials/i.test(res.error.message || '');
          if(authMode === 'signin' && wrongPassword){
            var meta = PROVIDERS.filter(function(p){ return p.id === lastMethod(); })[0];
            if(meta && email && email === lastEmail()){
              setHint(el.authPwHint, 'You used <b>' + escapeHtml(meta.name) +
                '</b> on this browser last time. An account made that way has no password — ' +
                'use the ' + escapeHtml(meta.name) + ' button above.');
            }
            /* And the version that works on a device this browser has never
               seen — which is the whole reason accounts exist here, and the
               one case the memory above is no help at all in. A sign-in link
               is addressed to the account's email, so it lets someone in
               whichever way they originally signed up: Google, password, or
               a link last time. It is the only answer that is right without
               knowing anything, so a failed password attempt is exactly when
               to stop hiding it at the bottom of the dialog. */
            authEvent('auth-wrong-password', { knownMethod: (meta && meta.id) || 'none' });
            suggestMagicLink();
          }
          return;
        }

        if(authMode === 'reset'){
          // Deliberately the same sentence whether or not that address has an
          // account. Saying "no account with that email" hands anyone with a
          // list of addresses a free check for which ones study here.
          authEvent('auth-reset-requested');
          setMsg('If that email has an account, a reset link is on its way. Check spam too.', 'success');
          return;
        }
        if(authMode === 'newpassword'){
          setMsg('Password updated. You’re signed in.', 'success');
          setTimeout(function(){ closeAuthModal(); afterRecovery(); }, 1200);
          return;
        }
        if(authMode === 'signup' && res.data && res.data.user && !res.data.session){
          pendingEmail = email;
          rememberEmail(email);
          // The one place a signup silently dies: the confirmation mail goes
          // to spam or to a typo'd address and there is no way to ask again.
          setHint(el.authPwHint, '');
          setMsg('', '');
          showConfirmSent(email);
          return;
        }
        rememberEmail(email);
        rememberMethod('password');
        authEvent('auth-succeeded', authMode === 'signup'
          ? { method: 'signup', variant: takeSignupSource() }
          : { method: 'password' });
        closeAuthModal();
      }, function(){
        done();
        setMsg('Something went wrong. Please try again.', 'error');
      });
    });

    function showConfirmSent(email){
      el.authModalTitle.textContent = 'Check your email';
      el.authModalSub.textContent = 'We sent a confirmation link to ' + email +
        '. Open it and you’re done — it may take a minute, and it sometimes lands in spam.';
      el.authForm.hidden = true;
      el.authAltRow.hidden = true;
      var socialRow = document.getElementById('authSocial');
      var orRow = document.getElementById('authOr');
      if(socialRow) socialRow.hidden = true;
      if(orRow) orRow.hidden = true;
      el.authToggleRow.hidden = false;
      el.authToggleText.textContent = 'Didn’t arrive?';
      el.authToggleBtn.textContent = 'Send it again';
      el.authToggleBtn.onclick = function(){
        var c = getClient();
        if(!c) return;
        el.authToggleBtn.disabled = true;
        c.auth.resend({ type: 'signup', email: email,
          options: { emailRedirectTo: location.origin + location.pathname } })
          .then(function(res){
            el.authToggleBtn.disabled = false;
            el.authToggleBtn.focus();
            el.authModalSub.textContent = (res && res.error)
              ? authMessage(res.error)
              : 'Sent again to ' + email + '.';
          }, function(){ el.authToggleBtn.disabled = false; el.authToggleBtn.focus(); });
      };
    }

    /* --- keyboard + focus ------------------------------------------------ */

    /* Two things the old modal got wrong for anyone not using a mouse:
       Escape did nothing, and Tab walked straight out of an "aria-modal"
       dialog into the page behind it, which is still there and still
       focusable. Both are table stakes for a dialog.

       Bound on the document rather than on the overlay, because focus can
       legitimately be outside it for a moment — disabling the button you
       just pressed (the resend) blurs it to <body>, and an Escape handler
       that lives on the overlay would go deaf exactly then. */
    document.addEventListener('keydown', function(e){
      if(!overlay.classList.contains('open')) return;
      if(e.key === 'Escape' && authMode !== 'newpassword'){ closeAuthModal(); return; }
      if(e.key !== 'Tab') return;
      var focusable = overlay.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [href], select, textarea, [tabindex]:not([tabindex="-1"])');
      var list = Array.prototype.filter.call(focusable, function(n){
        return n.offsetParent !== null || n === document.activeElement;
      });
      if(!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    });

    overlay._setMode = setMode;
    overlay._reset = function(){
      el.authForm.hidden = false;
      el.authToggleBtn.onclick = null;
      el.authPassword.value = '';
    };
    setMode('signin');
  }

  function rememberEmail(email){
    try { localStorage.setItem(LAST_EMAIL_KEY, email); } catch(e){ /* private mode */ }
  }
  function lastEmail(){
    try { return localStorage.getItem(LAST_EMAIL_KEY) || ''; } catch(e){ return ''; }
  }
  function rememberMethod(m){
    try { localStorage.setItem(LAST_METHOD_KEY, m); } catch(e){ /* private mode */ }
  }
  function lastMethod(){
    try { return localStorage.getItem(LAST_METHOD_KEY) || ''; } catch(e){ return ''; }
  }
  function forgetLastUser(){
    try {
      localStorage.removeItem(LAST_EMAIL_KEY);
      localStorage.removeItem(LAST_METHOD_KEY);
    } catch(e){ /* private mode: nothing was stored to begin with */ }
  }

  /* Milestone-level only. analytics.js is explicit that every event counts
     against a monthly total, so this records the shape of the funnel — opened,
     got in, asked for a reset, hit the passwordless dead end — and nothing
     per-keystroke. No email address or provider identity is ever sent: the
     method name is the whole payload. */
  function authEvent(name, data){
    if(window.LevlAnalytics) window.LevlAnalytics.event(name, data);
  }

  // Something@something.tld: enough to catch a typo before any network call.
  function looksLikeEmail(s){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '')); }

  function openAuthModal(mode, opts){
    authPurpose = (opts && opts.purpose) || '';
    ensureAuthModal();
    var overlay = document.getElementById('authModalOverlay');

    /* Ask the project what is enabled, every time the dialog opens. The
       cached answer is already on screen by now, so this is only ever a
       correction — it costs nothing visible when nothing changed, and it is
       what makes enabling Google in the Supabase dashboard enough on its own,
       with no edit here and no deploy. */
    fetchProviders().then(function(ids){
      if(!ids) return;
      var before = (enabledProviders || []).join(',');
      if(ids.join(',') !== before) overlay._renderProviders(ids);
    });

    lastFocused = document.activeElement;
    overlay._reset();
    overlay._setMode(mode || 'signin');
    authEvent('auth-opened', { mode: mode || 'signin' });
    overlay.classList.add('open');
    // The page behind a modal must not scroll under it — on iOS especially,
    // a touch-drag over the backdrop otherwise scrolls the page away.
    document.documentElement.classList.add('auth-modal-open');

    var email = document.getElementById('authEmail');
    var pw = document.getElementById('authPassword');
    if(mode === 'newpassword'){ pw.focus(); return; }
    // Prefilling the address someone signed in with last time turns the
    // common case into one field. Password managers still fill both.
    if(!email.value) email.value = lastEmail();
    if(email.value) pw.focus(); else email.focus();
  }

  function closeAuthModal(){
    var overlay = document.getElementById('authModalOverlay');
    if(overlay) overlay.classList.remove('open');
    document.documentElement.classList.remove('auth-modal-open');
    // Focus has to go back where it came from, or a keyboard user lands at
    // the top of the document with no idea where they were.
    if(lastFocused && lastFocused.focus) { try { lastFocused.focus(); } catch(e){} }
    lastFocused = null;
  }

  // After a recovery link is used the session is real but no pull has run,
  // because PASSWORD_RECOVERY is not SIGNED_IN. Do the first sync here.
  function afterRecovery(){
    startSyncTimer('signin');
  }

  /* ---- lifecycle ------------------------------------------------------ */

  function notify(){
    authListeners.forEach(function(fn){ try{ fn(currentUser); }catch(e){} });
  }

  /* A signup that needs its email confirmed finishes on another page load:
     the student clicks the link and lands back here with it in the URL hash.
     Nothing else marks that moment, so without this the last step of the
     signup funnel was invisible. Read now, before the SDK parses the hash
     and clears it. */
  var arrivedFromEmail = (function(){
    var m = /[#&]type=(signup|magiclink)(&|$)/.exec(location.hash || '');
    return m ? m[1] : null;
  })();

  function handleAuthChange(event, session){
    var wasSignedOut = !currentUser;
    if(event === 'SIGNED_IN' && wasSignedOut && arrivedFromEmail){
      authEvent('auth-confirmed', { type: arrivedFromEmail, variant: takeSignupSource() });
      arrivedFromEmail = null;
    }
    currentUser = session ? session.user : null;
    renderAccountUI();
    notify();
    if(event === 'SIGNED_IN' && wasSignedOut){
      // One reload after the first sync of a session (see reloadOnceIf) means
      // every page's already-rendered stats reflect the synced data. Skipped
      // when nothing came down, since then what's on screen is current.
      startSyncTimer('signin');
    }
    /* The recovery link signs you in and fires this instead of SIGNED_IN, so
       without a branch here the link "works" and then silently does nothing
       visible — you are left on the homepage with no password set and no way
       to know it. Open the set-a-new-password screen the moment it lands. */
    if(event === 'PASSWORD_RECOVERY'){
      openAuthModal('newpassword');
    }
    if(event === 'SIGNED_OUT'){
      stopSyncTimer();
      closeAccountMenu();
      sessionStorage.removeItem(RELOAD_ONCE_KEY);
      /* Forget who was here. The prefilled address is a convenience for one
         person on their own laptop and a small leak on a shared one — a
         campus or library machine shows the next student the last one's
         email — and signing out is exactly the signal that says which of
         those this is. Closing the tab is not; that is why this hangs off
         SIGNED_OUT and not off pagehide. */
      forgetLastUser();
    }
  }

  // A single privacy-respecting aggregate counter. No IP, user id, cookie or
  // session identifier is ever recorded — this only increments a per-page,
  // per-day view count via the track_pageview RPC, which is the only way to
  // write to page_views (the table has no RLS policies, so nothing can read
  // or write it directly).
  function trackPageview(){
    var c = getClient();
    if(!c) return;
    c.rpc('track_pageview', { p_path: location.pathname }).then(function(){}, function(){});
  }

  function loadSdk(cb){
    if(window.supabase && window.supabase.createClient){ cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@' + SDK_VERSION + '/dist/umd/supabase.js';
    s.integrity = SDK_INTEGRITY;
    s.crossOrigin = 'anonymous';
    s.onload = cb;
    s.onerror = function(){ /* offline, blocked, or integrity mismatch — accounts stay unavailable this load */ };
    document.head.appendChild(s);
  }

  var started = false;
  // Deferred so every subject gets its registerNamespace() call in before the
  // first push or pull decides which keys exist.
  function start(){
    if(started) return;
    started = true;
    renderAccountUI();
    loadSdk(function(){
      var c = getClient();
      if(!c) return;
      flushRpcQueue();
      trackPageview();
      c.auth.onAuthStateChange(handleAuthChange);
      c.auth.getSession().then(function(res){
        var session = res.data && res.data.session;
        currentUser = session ? session.user : null;
        renderAccountUI();
        notify();
        // The pull on every page load, not only on a fresh sign-in.
        if(currentUser) startSyncTimer('load');
      });
    });
  }


  /* ---- "save your progress" prompt ------------------------------------

     Every subject works from localStorage alone, and that is a deliberate
     promise: no account, nothing to install, start answering. It has one
     sharp edge. Progress that lives only in a browser dies with it — clear
     your site data, switch to the phone, reinstall, and a level, a streak
     and weeks of mastery data are simply gone, with no warning and nothing
     to recover. The student does not come back to find out; they conclude
     the site lost their work, which is exactly what happened.

     So there has to be a moment where saving it is offered. Not the door:
     asking someone to make an account before they have anything worth
     saving is the thing free study sites are rightly disliked for, and it
     would trade the promise above for a signup funnel. The right moment is
     straight after something went well — a level earned, an exam finished —
     when the progress is real, the student is pleased with it, and "keep
     this" is an obvious yes rather than a toll.

     The rules are deliberately timid: signed-out only, three answered asks
     ever, never again once someone has waved it away twice, and at least two
     days between asks. After a "Not now" it only asks again once there is
     more at stake — a longer streak or a higher level than last time — so the
     second ask carries a reason the first did not. A prompt nobody answered
     (it withdraws itself after 15 seconds) is not counted as one of the three:
     they may simply have been reading. It is still capped, so a browser that
     never looks does not get asked forever. */
  var PROMPT_KEY = 'levlprep_save_prompt';
  var PROMPT_MAX_ANSWERED = 3;
  var PROMPT_MAX_IGNORED = 4;
  var PROMPT_MAX_DISMISSED = 2;
  var PROMPT_GAP_DAYS = 2;
  // Where a signup started, so the account it produces can be credited to the
  // prompt wording that asked for it. Read back on confirmation, then dropped.
  var SIGNUP_SOURCE_KEY = 'levlprep_signup_source';

  function promptState(){
    var st = null;
    try {
      var raw = JSON.parse(localStorage.getItem(PROMPT_KEY) || 'null');
      if(raw && typeof raw === 'object') st = raw;
    } catch(e){ /* unreadable: treat as never shown */ }
    st = st || {};
    // Records written before `ignored` existed counted every show as asked,
    // which is the conservative reading, so they keep it.
    return {
      shown: st.shown || 0,
      dismissed: st.dismissed || 0,
      ignored: st.ignored || 0,
      last: st.last || null,
      stake: st.stake || null,
    };
  }

  function writePromptState(st){
    try { localStorage.setItem(PROMPT_KEY, JSON.stringify(st)); } catch(e){ /* private mode */ }
  }

  function promptDayKey(){
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function daysSinceKey(key){
    if(!key) return Infinity;
    var p = String(key).split('-');
    if(p.length !== 3) return Infinity;
    var then = new Date(+p[0], +p[1] - 1, +p[2]);
    var now = new Date();
    now = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((now - then) / 86400000);
  }

  /* What this browser stands to lose right now, from the shared progress
     module. Zeros when it is not on the page, which only ever makes the
     prompt fall back to its plain wording. */
  function currentStake(){
    var hp = window.HubProgress, out = { streak: 0, level: 0, xp: 0, freezes: 0, metToday: false };
    try {
      if(hp && hp.streak){ var s = hp.streak(); out.streak = s.current || 0; out.freezes = s.freezes || 0; out.metToday = !!s.metToday; }
      if(hp && hp.levelInfo){ var l = hp.levelInfo(); out.level = l.level || 0; out.xp = l.total || 0; }
    } catch(e){ /* progress unreadable: plain wording */ }
    return out;
  }

  /* The eligibility rules, as a pure function of the stored state, the days
     since the last ask and what is at stake now — so they can be tested
     without a browser. */
  function eligible(st, days, stake){
    if(st.dismissed >= PROMPT_MAX_DISMISSED) return false;
    if(st.shown - st.ignored >= PROMPT_MAX_ANSWERED) return false;
    if(st.ignored >= PROMPT_MAX_IGNORED) return false;
    if(days < PROMPT_GAP_DAYS) return false;
    if(st.dismissed > 0){
      // "Not now" was an answer. Ask again only with a new reason to.
      var before = st.stake || { streak: 0, level: 0 };
      if(!(stake.streak > (before.streak || 0) || stake.level > (before.level || 0))) return false;
    }
    return true;
  }

  function mayPrompt(){
    if(currentUser) return false;               // already saved; nothing to offer
    if(!getClient()) return false;              // no backend configured on this build
    // Only ever one nudge on screen: site-chrome.js may have an install
    // prompt up, and two stacked boxes asking for things is a shakedown.
    if(document.querySelector('.levl-prompt')) return false;
    var st = promptState();
    return eligible(st, daysSinceKey(st.last), currentStake());
  }

  function plural(n, one, many){ return n + ' ' + (n === 1 ? one : (many || one + 's')); }

  /* The wording: name what this student would actually lose, from the
     strongest thing they have. Every line has to be literally true for this
     browser — it is signed out, so the progress really is only here — and
     none of them invents urgency. A streak is only mentioned from three days,
     so a one-day run is never made into a big deal.

     ctx is what just happened: { kind: 'exam', score, total, missed },
     { kind: 'session', answered } or { kind: 'level', level, title }.
     Returns { id, title, sub, yes }; id tags the analytics events so the
     wordings can be compared. */
  function saveCopy(ctx, stake, fallback){
    ctx = ctx || {};
    stake = stake || {};
    var n = stake.streak || 0;
    if(n >= 3){
      if(stake.freezes > 0) return {
        id: 'freeze', yes: 'Save it',
        title: 'You’ve earned a streak freeze',
        sub: 'It’s saved on this device only, along with your ' + n + '-day streak. Keep both on every device?'
      };
      if(stake.metToday) return {
        id: 'goal', yes: 'Keep my streak',
        title: 'Goal done for today · ' + n + '-day streak',
        sub: 'It’s stored on this device only. Don’t lose it to a cleared browser or a new phone.'
      };
      return {
        id: 'streak', yes: 'Keep my streak',
        title: n + '-day streak — kept only in this browser',
        sub: 'A new phone or cleared history and it’s gone. Saving it is free.'
      };
    }
    if(ctx.kind === 'exam' && ctx.total){
      return {
        id: 'exam', yes: 'Save my progress',
        title: ctx.score + '/' + ctx.total + (ctx.missed ? ' — and ' + plural(ctx.missed, 'missed question') + ' queued for review' : ''),
        sub: 'All of it lives in this browser only. Keep it on every device?'
      };
    }
    var level = ctx.level || stake.level;
    if(level > 1){
      return {
        id: 'level', yes: 'Keep my level',
        title: 'Level ' + level + (ctx.title ? ' — ' + ctx.title : '') + (stake.xp ? ' · ' + stake.xp.toLocaleString('en-US') + ' XP' : ''),
        sub: 'Earned here, stored only here. Keep it if you switch devices.'
      };
    }
    return {
      id: 'generic', yes: 'Save my progress',
      title: fallback || 'Nice work',
      sub: 'This is saved in this browser only. Keep it on every device?'
    };
  }

  function rememberSignupSource(id){
    try { localStorage.setItem(SIGNUP_SOURCE_KEY, JSON.stringify({ variant: id, at: Date.now() })); } catch(e){}
  }

  /* The wording a signup came from, if it started at the prompt within the
     last two days. Read once: the account is credited to it and it is gone. */
  function takeSignupSource(){
    try {
      var raw = JSON.parse(localStorage.getItem(SIGNUP_SOURCE_KEY) || 'null');
      localStorage.removeItem(SIGNUP_SOURCE_KEY);
      if(raw && raw.variant && Date.now() - raw.at < 2 * 86400000) return raw.variant;
    } catch(e){}
    return 'none';
  }

  /* reason is the old one-line summary ("Exam finished — 78/100"), kept as
     the fallback title; ctx lets the wording name what is at stake. */
  function promptToSave(reason, ctx){
    if(!mayPrompt()) return false;

    var stake = currentStake();
    var copy = saveCopy(ctx, stake, reason);
    var st = promptState();
    st.shown += 1;
    st.last = promptDayKey();
    st.stake = { streak: stake.streak, level: stake.level };
    writePromptState(st);

    var el = document.createElement('div');
    el.id = 'savePrompt';
    el.className = 'levl-prompt';
    el.setAttribute('role', 'status');
    el.innerHTML =
      '<div class="levl-prompt__text">' +
        '<b>' + escapeHtml(copy.title) + '</b>' +
        '<small>' + escapeHtml(copy.sub) + '</small>' +
      '</div>' +
      '<div class="levl-prompt__actions">' +
        '<button type="button" class="levl-prompt__yes" id="savePromptYes">' + escapeHtml(copy.yes) + '</button>' +
        '<button type="button" class="levl-prompt__no" id="savePromptNo">Not now</button>' +
      '</div>';
    document.body.appendChild(el);
    // Next frame, so the entry transition has a state to move away from.
    requestAnimationFrame(function(){ el.classList.add('show'); });

    var answered = false;
    function close(outcome){
      var s2 = promptState();
      if(outcome === 'dismissed') s2.dismissed += 1;
      if(outcome === 'ignored') s2.ignored += 1;
      writePromptState(s2);
      el.classList.remove('show');
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 350);
    }

    document.getElementById('savePromptYes').addEventListener('click', function(){
      answered = true;
      if(window.LevlAnalytics) window.LevlAnalytics.event('save-prompt-accepted', { variant: copy.id });
      rememberSignupSource(copy.id);
      close('accepted');
      // Straight to "create account": someone answering this prompt has no
      // account by definition, and landing them on a sign-in form they cannot
      // complete is one wasted step at exactly the wrong moment.
      openAuthModal('signup');
    });
    document.getElementById('savePromptNo').addEventListener('click', function(){
      answered = true;
      if(window.LevlAnalytics) window.LevlAnalytics.event('save-prompt-dismissed', { variant: copy.id });
      close('dismissed');
    });

    // Not a modal: it must never stand between a student and the next
    // question. Left alone it withdraws on its own, and that is not counted
    // as a refusal or as one of the three asks — they may simply have been
    // reading.
    setTimeout(function(){ if(!answered && el.parentNode) close('ignored'); }, 15000);

    if(window.LevlAnalytics) window.LevlAnalytics.event('save-prompt-shown', { variant: copy.id });
    return true;
  }

  /* A level-up is the same high point in both courses, and hub-progress.js
     already announces it site-wide, so this needs no per-course wiring.
     Delayed past the celebration motion.js runs for the same event: landing
     a signup ask on top of the confetti would read as billing someone for
     the fireworks. */
  document.addEventListener('levl:levelup', function(e){
    var d = (e && e.detail) || {};
    setTimeout(function(){
      promptToSave('Level ' + (d.level || '') + (d.title ? ' \u2014 ' + d.title : ''),
        { kind: 'level', level: d.level, title: d.title });
    }, 5200);
  });

  /* One-way write to a `security definer` RPC, for the small number of things
     the site records that are not a user's progress: the page counter, a
     report that a question is wrong, a client-side error.

     Queued rather than dropped when the SDK has not arrived yet. Every caller
     of this fires on page load or on an event moments after it, which is
     exactly when the SDK is still in flight — the analytics module learned the
     same lesson the hard way, and its events were being lost on precisely the
     slow connections whose problems are most worth hearing about.

     Resolves to true only when the write actually landed, and never rejects:
     nothing here is important enough to break a page over. */
  var rpcQueue = [];
  function rpc(name, args){
    var c = getClient();
    if(!c){
      if(rpcQueue.length < 10) rpcQueue.push([name, args]);
      return Promise.resolve(false);
    }
    return c.rpc(name, args).then(function(res){
      return !(res && res.error);
    }, function(){ return false; });
  }
  /* The same call for the few RPCs whose answer matters (premium.js asks which
     passes this user holds). Resolves to the data, or null when there is no
     client yet, the call failed or the browser is offline. */
  function rpcData(name, args){
    var c = getClient();
    if(!c) return Promise.resolve(null);
    return c.rpc(name, args || {}).then(function(res){
      return res && !res.error ? res.data : null;
    }, function(){ return null; });
  }
  /* The signed-in user's access token, for the Worker routes that act on
     their behalf (premium checkout). Null when signed out. */
  function accessToken(){
    var c = getClient();
    if(!c || !currentUser) return Promise.resolve(null);
    return c.auth.getSession().then(function(res){
      var s = res && res.data && res.data.session;
      return s ? s.access_token : null;
    }, function(){ return null; });
  }
  function flushRpcQueue(){
    var queued = rpcQueue.splice(0, rpcQueue.length);
    queued.forEach(function(call){ rpc(call[0], call[1]); });
  }

  window.StudyHubAccount = {
    rpc: rpc,
    rpcData: rpcData,
    accessToken: accessToken,
    /* Exported for scripts/test/account-delete.test.mjs. This one function
       erases a student's work on purpose, so what it does and does not touch
       is worth a test rather than a careful read. */
    _clearLocalProgress: clearLocalProgress,
    registerNamespace: registerNamespace,
    mergeCardSchedules: mergeCardSchedules,
    start: start,
    // push is the old name; a sync is a pull and a push in one.
    push: sync,
    sync: sync,
    syncSoon: syncSoon,
    // { lastSynced (ms, 0 = never), failures, failing } for this browser.
    syncStatus: syncStatus,
    // A first sync's write path, exposed so the merge rules a namespace
    // registers can be tested without a Supabase round trip.
    applyNamespace: applyNamespace,
    // The same rules, for progress-backup.js: restoring a file is one more
    // copy of the progress to reconcile, and it should reconcile the same way.
    mergeRaw: mergeRaw,
    mergerFor: function(k){ return mergers[k] || null; },
    // For scripts/test/account-sync.test.mjs: drive sync with a fake client.
    _test: {
      setClient: function(c){ client = c; },
      setUser: function(u){ currentUser = u; },
      startSyncTimer: startSyncTimer,
      stopSyncTimer: stopSyncTimer,
      onFocus: onFocus,
      onVisibilityChange: onVisibilityChange,
      reconcileKey: reconcileKey,
      hash: hash
    },
    user: function(){ return currentUser; },
    onAuthChange: function(fn){ authListeners.push(fn); fn(currentUser); },
    openAuthModal: openAuthModal,
    renderAccountUI: renderAccountUI,
    // Pure helpers behind the form's copy and its live feedback, exported so
    // the wording and the thresholds can be tested without a browser or a
    // Supabase round trip.
    authMessage: authMessage,
    passwordScore: passwordScore,
    emailTypo: emailTypo,
    /* Offer to save what is in this browser, if the moment and the timid
       rules above both allow it. Returns whether anything was shown, so a
       caller can tell the difference between "asked" and "held back". */
    promptToSave: promptToSave,
    // Pure pieces of the prompt, exported for scripts/test/save-prompt.test.mjs.
    _saveCopy: saveCopy,
    _promptEligible: eligible,
  };

  // Wait for DOMContentLoaded rather than a zero timer: every subject's
  // bootstrap script (nav.js, ochem-nav.js) is guaranteed to have run its
  // registerNamespace() call by then, whereas a timer can fire mid-parse on a
  // large page and start syncing before a namespace is known.
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
