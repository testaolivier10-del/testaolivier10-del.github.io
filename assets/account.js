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
   A push reads the current row, merges in ONLY the namespaces this page has
   registered, and writes the result back — so an ochem page can never clobber
   NREMT data, and adding subject #3 is one registerNamespace() call.

   Legacy rows (no `v`) are read as if they were `ns.nremt`, which is exactly
   what they were. The next push rewrites them in the new shape.
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

  function collect(){
    var out = {};
    Object.keys(namespaces).forEach(function(ns){
      var bucket = {};
      namespaces[ns].forEach(function(k){
        var v = localStorage.getItem(k);
        if(v !== null) bucket[k] = v;
      });
      out[ns] = bucket;
    });
    return out;
  }

  // Only ever writes keys the namespace actually declared. A tampered or
  // stale cloud row can't inject arbitrary localStorage keys this way.
  function applyNamespace(ns, bucket){
    if(!bucket || !namespaces[ns]) return;
    Object.keys(bucket).forEach(function(k){
      if(namespaces[ns].indexOf(k) === -1) return;
      var value = bucket[k];
      if(mergers[k]){
        try{ value = mergers[k](localStorage.getItem(k), bucket[k]); }
        catch(e){ value = bucket[k]; }
      }
      if(value !== null && value !== undefined) localStorage.setItem(k, value);
    });
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

  // Read-merge-write rather than a blind upsert: the row holds namespaces
  // this page may know nothing about, and they have to survive our write.
  function push(){
    var c = getClient();
    if(!c || !currentUser) return Promise.resolve();
    var mine = collect();
    return c.from('user_progress').select('data').eq('id', currentUser.id).maybeSingle()
      .then(function(res){
        var merged = (res && !res.error && res.data) ? unpack(res.data.data) : {};
        Object.keys(mine).forEach(function(ns){ merged[ns] = mine[ns]; });
        return c.from('user_progress').upsert({
          id: currentUser.id,
          data: { v: 2, ns: merged },
          updated_at: new Date().toISOString()
        });
      })
      .then(function(){}, function(){ /* best-effort; the next tick retries */ });
  }

  /* Progress used to reach the cloud only on the 30-second timer or when the
     page was hidden, and the hidden-page push is two round trips (read the
     row, then write it) that a closing tab rarely lives long enough to
     finish. Anything done in the last half minute of a visit could therefore
     stay on that one browser, and the next device to sign in would pull a row
     that had never heard of it. Calling this after a change starts the write
     while the page is still open and has a network. */
  function syncSoon(){
    if(!currentUser) return;
    if(soonTimer) clearTimeout(soonTimer);
    soonTimer = setTimeout(function(){ soonTimer = null; push(); }, 1500);
  }
  function flushSoon(){
    if(!soonTimer) return;
    clearTimeout(soonTimer);
    soonTimer = null;
  }

  // First sign-in on a device: for each namespace, the cloud wins if it has
  // one (the common case — syncing an existing account onto a new device),
  // otherwise this account has never synced that subject, so seed it from
  // whatever guest progress is already here rather than discarding it.
  function pullOrSeed(){
    var c = getClient();
    if(!c || !currentUser) return Promise.resolve(false);
    return c.from('user_progress').select('data').eq('id', currentUser.id).maybeSingle()
      .then(function(res){
        if(res.error) return false;
        var cloud = unpack(res.data && res.data.data);
        var appliedAny = false;
        var needsSeed = false;
        Object.keys(namespaces).forEach(function(ns){
          if(cloud[ns] && Object.keys(cloud[ns]).length){
            applyNamespace(ns, cloud[ns]);
            appliedAny = true;
          } else {
            needsSeed = true;
          }
        });
        if(needsSeed) push();
        return appliedAny;
      }, function(){ return false; });
  }

  function startSyncTimer(){
    stopSyncTimer();
    syncTimer = setInterval(push, SYNC_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
  }
  function stopSyncTimer(){
    if(syncTimer) clearInterval(syncTimer);
    syncTimer = null;
    flushSoon();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', onPageHide);
  }
  function onVisibilityChange(){
    if(document.visibilityState === 'hidden'){ flushSoon(); push(); }
  }
  // Safari on iOS often skips straight to pagehide when a tab is closed or
  // the app is swapped out, so visibilitychange alone loses that last write.
  function onPageHide(){ flushSoon(); push(); }

  /* ---- auth UI -------------------------------------------------------- */

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // The host page owns where the button goes; this only fills the slot if
  // one exists, so a page with no #accountSlot simply shows no account UI.
  function renderAccountUI(){
    var mount = document.getElementById('accountSlot');
    if(!mount) return;
    if(currentUser){
      var label = currentUser.email ? currentUser.email.split('@')[0] : 'Account';
      mount.innerHTML = '<button type="button" class="account-btn" id="accountBtn" title="' +
        escapeHtml(currentUser.email || '') + '">' + escapeHtml(label) + '</button>';
    } else {
      mount.innerHTML = '<button type="button" class="account-btn" id="accountBtn">Log in</button>';
    }
    var btn = document.getElementById('accountBtn');
    if(btn) btn.addEventListener('click', function(){
      if(currentUser) openAccountMenu(); else openAuthModal();
    });
  }

  function openAccountMenu(){
    if(confirm('Signed in as ' + currentUser.email + '.\n\nSign out?')){
      push();
      var c = getClient();
      if(c) c.auth.signOut();
    }
  }

  function ensureAuthModal(){
    if(document.getElementById('authModalOverlay')) return;
    var overlay = document.createElement('div');
    overlay.id = 'authModalOverlay';
    overlay.className = 'auth-modal-overlay';
    overlay.innerHTML =
      '<div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">' +
        '<button type="button" class="auth-modal-close" id="authModalClose" aria-label="Close">&times;</button>' +
        '<h2 id="authModalTitle">Sign in</h2>' +
        '<p class="auth-modal-sub">One account for every subject on LevlPrep. Sign in to sync your level, streak, and progress across devices. Everything still works without an account.</p>' +
        '<form id="authForm">' +
          '<label>Email<input type="email" id="authEmail" required autocomplete="email"></label>' +
          '<label>Password<input type="password" id="authPassword" required autocomplete="current-password" minlength="6"></label>' +
          '<label id="authConfirmLabel" hidden>Confirm password<input type="password" id="authConfirmPassword" autocomplete="new-password" minlength="6"></label>' +
          '<div class="auth-modal-msg" id="authModalMsg"></div>' +
          '<button type="submit" class="auth-modal-submit" id="authSubmitBtn">Sign in</button>' +
        '</form>' +
        '<p class="auth-modal-toggle">' +
          '<span id="authToggleText">Don’t have an account?</span> ' +
          '<button type="button" id="authToggleBtn">Create one</button>' +
        '</p>' +
      '</div>';
    document.body.appendChild(overlay);

    var mode = 'signin';
    function setMode(m){
      mode = m;
      var isSignup = m === 'signup';
      document.getElementById('authModalTitle').textContent = isSignup ? 'Create account' : 'Sign in';
      document.getElementById('authSubmitBtn').textContent = isSignup ? 'Create account' : 'Sign in';
      document.getElementById('authToggleText').textContent = isSignup ? 'Already have an account?' : 'Don’t have an account?';
      document.getElementById('authToggleBtn').textContent = isSignup ? 'Sign in instead' : 'Create one';
      document.getElementById('authPassword').autocomplete = isSignup ? 'new-password' : 'current-password';
      var confirmLabel = document.getElementById('authConfirmLabel');
      var confirmInput = document.getElementById('authConfirmPassword');
      confirmLabel.hidden = !isSignup;
      confirmInput.required = isSignup;
      if(!isSignup) confirmInput.value = '';
      var msgEl = document.getElementById('authModalMsg');
      msgEl.textContent = '';
      msgEl.className = 'auth-modal-msg';
    }

    document.getElementById('authModalClose').addEventListener('click', closeAuthModal);
    overlay.addEventListener('click', function(e){ if(e.target === overlay) closeAuthModal(); });
    document.getElementById('authToggleBtn').addEventListener('click', function(){
      setMode(mode === 'signin' ? 'signup' : 'signin');
    });

    document.getElementById('authForm').addEventListener('submit', function(e){
      e.preventDefault();
      var email = document.getElementById('authEmail').value.trim();
      var password = document.getElementById('authPassword').value;
      var msgEl = document.getElementById('authModalMsg');
      var submitBtn = document.getElementById('authSubmitBtn');
      var c = getClient();
      if(!c){
        msgEl.textContent = 'Accounts are unavailable right now — check your connection and try again.';
        msgEl.className = 'auth-modal-msg error';
        return;
      }
      if(mode === 'signup'){
        var confirmPassword = document.getElementById('authConfirmPassword').value;
        if(password !== confirmPassword){
          msgEl.textContent = 'Passwords do not match.';
          msgEl.className = 'auth-modal-msg error';
          return;
        }
      }
      submitBtn.disabled = true;
      msgEl.textContent = '';
      msgEl.className = 'auth-modal-msg';
      var action = mode === 'signin'
        ? c.auth.signInWithPassword({ email: email, password: password })
        : c.auth.signUp({ email: email, password: password, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
      action.then(function(res){
        submitBtn.disabled = false;
        if(res.error){
          msgEl.textContent = res.error.message;
          msgEl.className = 'auth-modal-msg error';
          return;
        }
        if(mode === 'signup' && res.data && res.data.user && !res.data.session){
          msgEl.textContent = 'Check your email to confirm your account, then sign in.';
          msgEl.className = 'auth-modal-msg success';
          setMode('signin');
          return;
        }
        closeAuthModal();
      }).catch(function(){
        submitBtn.disabled = false;
        msgEl.textContent = 'Something went wrong. Please try again.';
        msgEl.className = 'auth-modal-msg error';
      });
    });
  }

  function openAuthModal(){
    ensureAuthModal();
    document.getElementById('authModalOverlay').classList.add('open');
    document.getElementById('authEmail').focus();
  }
  function closeAuthModal(){
    var overlay = document.getElementById('authModalOverlay');
    if(overlay) overlay.classList.remove('open');
  }

  /* ---- lifecycle ------------------------------------------------------ */

  function notify(){
    authListeners.forEach(function(fn){ try{ fn(currentUser); }catch(e){} });
  }

  function handleAuthChange(event, session){
    var wasSignedOut = !currentUser;
    currentUser = session ? session.user : null;
    renderAccountUI();
    notify();
    if(event === 'SIGNED_IN' && wasSignedOut){
      pullOrSeed().then(function(applied){
        // One reload after the first sync of a session means every page's
        // already-rendered stats (level badge, streak, dashboards) reflect
        // the freshly-synced data, without every page separately listening
        // for a sync event. Skipped when nothing was pulled, since then
        // local storage is already what's on screen.
        if(applied && !sessionStorage.getItem(RELOAD_ONCE_KEY)){
          sessionStorage.setItem(RELOAD_ONCE_KEY, '1');
          location.reload();
        }
      });
      startSyncTimer();
    }
    if(event === 'SIGNED_OUT'){
      stopSyncTimer();
      sessionStorage.removeItem(RELOAD_ONCE_KEY);
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
      trackPageview();
      c.auth.onAuthStateChange(handleAuthChange);
      c.auth.getSession().then(function(res){
        var session = res.data && res.data.session;
        currentUser = session ? session.user : null;
        renderAccountUI();
        notify();
        if(currentUser) startSyncTimer();
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

     The rules are deliberately timid: signed-out only, once a week at most,
     three times ever, and never again once someone has waved it away twice.
     A prompt that appears a fourth time is not a reminder, it is nagging,
     and the answer was no. */
  var PROMPT_KEY = 'levlprep_save_prompt';
  var PROMPT_MAX_SHOWN = 3;
  var PROMPT_MAX_DISMISSED = 2;
  var PROMPT_COOLDOWN_DAYS = 7;

  function promptState(){
    try {
      var raw = JSON.parse(localStorage.getItem(PROMPT_KEY) || 'null');
      if(raw && typeof raw === 'object') return raw;
    } catch(e){ /* unreadable: treat as never shown */ }
    return { shown: 0, dismissed: 0, last: null };
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

  function mayPrompt(){
    if(currentUser) return false;               // already saved; nothing to offer
    if(!getClient()) return false;              // no backend configured on this build
    // Only ever one nudge on screen: site-chrome.js may have an install
    // prompt up, and two stacked boxes asking for things is a shakedown.
    if(document.querySelector('.levl-prompt')) return false;
    var st = promptState();
    if(st.shown >= PROMPT_MAX_SHOWN) return false;
    if(st.dismissed >= PROMPT_MAX_DISMISSED) return false;
    return daysSinceKey(st.last) >= PROMPT_COOLDOWN_DAYS;
  }

  /* reason is what just went well, in the student's own terms ("Level 7" or
     "that exam"), so the prompt is about the thing they just did rather than
     about us wanting an account. */
  function promptToSave(reason){
    if(!mayPrompt()) return false;

    var st = promptState();
    st.shown += 1;
    st.last = promptDayKey();
    writePromptState(st);

    var el = document.createElement('div');
    el.id = 'savePrompt';
    el.className = 'levl-prompt';
    el.setAttribute('role', 'status');
    el.innerHTML =
      '<div class="levl-prompt__text">' +
        '<b>' + escapeHtml(reason || 'Nice work') + '</b>' +
        '<small>This is saved in this browser only. Keep it on every device?</small>' +
      '</div>' +
      '<div class="levl-prompt__actions">' +
        '<button type="button" class="levl-prompt__yes" id="savePromptYes">Save my progress</button>' +
        '<button type="button" class="levl-prompt__no" id="savePromptNo">Not now</button>' +
      '</div>';
    document.body.appendChild(el);
    // Next frame, so the entry transition has a state to move away from.
    requestAnimationFrame(function(){ el.classList.add('show'); });

    function close(dismissed){
      if(dismissed){
        var s2 = promptState();
        s2.dismissed += 1;
        writePromptState(s2);
      }
      el.classList.remove('show');
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 350);
    }

    document.getElementById('savePromptYes').addEventListener('click', function(){
      if(window.LevlAnalytics) window.LevlAnalytics.event('save-prompt-accepted');
      close(false);
      openAuthModal();
    });
    document.getElementById('savePromptNo').addEventListener('click', function(){ close(true); });

    // Not a modal: it must never stand between a student and the next
    // question. Left alone it withdraws on its own, and that is not counted
    // as a refusal — they may simply have been reading.
    setTimeout(function(){ if(el.parentNode) close(false); }, 15000);

    if(window.LevlAnalytics) window.LevlAnalytics.event('save-prompt-shown');
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
      promptToSave('Level ' + (d.level || '') + (d.title ? ' \u2014 ' + d.title : ''));
    }, 5200);
  });

  window.StudyHubAccount = {
    registerNamespace: registerNamespace,
    start: start,
    push: push,
    syncSoon: syncSoon,
    // The pull's write path, exposed so the merge rules a namespace registers
    // can be tested without a Supabase round trip.
    applyNamespace: applyNamespace,
    user: function(){ return currentUser; },
    onAuthChange: function(fn){ authListeners.push(fn); fn(currentUser); },
    openAuthModal: openAuthModal,
    renderAccountUI: renderAccountUI,
    /* Offer to save what is in this browser, if the moment and the timid
       rules above both allow it. Returns whether anything was shown, so a
       caller can tell the difference between "asked" and "held back". */
    promptToSave: promptToSave,
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
