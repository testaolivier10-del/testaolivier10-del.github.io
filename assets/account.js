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

  // Social sign-in. Each provider must first be enabled in the Supabase
  // dashboard (Authentication → Providers) with its OAuth client id and
  // secret; a button for a provider that is not configured only produces a
  // dead end, so an unconfigured build lists none and shows the email form
  // alone. Adding Google is one entry here plus that dashboard step.
  var OAUTH_PROVIDERS = [];  // e.g. [{ id:'google', label:'Continue with Google' }]

  // Which address signed in last, so the next visit on this browser starts
  // with the email already filled. Never the password.
  var LAST_EMAIL_KEY = 'levlprep_last_email';

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
        '<small id="accountMenuState">Progress syncs automatically.</small>' +
      '</div>' +
      '<button type="button" role="menuitem" id="accountSyncBtn">Sync now</button>' +
      '<button type="button" role="menuitem" id="accountSignOutBtn">Sign out</button>';
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
    document.getElementById('accountSyncBtn').addEventListener('click', function(){
      state.textContent = 'Syncing…';
      push().then(function(){ state.textContent = 'Saved to your account just now.'; });
    });
    document.getElementById('accountSignOutBtn').addEventListener('click', function(){
      var b = this;
      b.disabled = true;
      state.textContent = 'Saving your progress first…';
      // Sign out only once the last write is away. Dropping the session
      // first would strand whatever happened since the last tick in a
      // browser that is about to look signed-out.
      push().then(function(){
        var c = getClient();
        if(c) c.auth.signOut();
        closeAccountMenu();
      });
    });
    var first = menu.querySelector('button');
    if(first) first.focus();
  }

  /* ---- auth modal ------------------------------------------------------ */

  var authMode = 'signin';       // signin | signup | reset | newpassword
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

    var social = OAUTH_PROVIDERS.length
      ? '<div class="auth-social" id="authSocial">' +
          OAUTH_PROVIDERS.map(function(p){
            return '<button type="button" class="auth-social__btn" data-provider="' +
              escapeHtml(p.id) + '">' + escapeHtml(p.label) + '</button>';
          }).join('') +
        '</div><div class="auth-or" id="authOr"><span>or</span></div>'
      : '';

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
          '<label id="authPasswordLabel">' +
            '<span class="auth-label-row">' +
              '<span id="authPasswordText">Password</span>' +
              '<button type="button" class="auth-reveal" id="authReveal" aria-pressed="false" tabindex="-1">Show</button>' +
            '</span>' +
            '<input type="password" id="authPassword" autocomplete="current-password" aria-describedby="authPwHint">' +
          '</label>' +
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
      el.authModalSub.textContent = c.sub;
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

      var socialRow = document.getElementById('authSocial');
      var orRow = document.getElementById('authOr');
      if(socialRow) socialRow.hidden = !c.social;
      if(orRow) orRow.hidden = !c.social;

      setHint(el.authEmailHint, '');
      setHint(el.authPwHint, '');
      setReveal(false);
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

    Array.prototype.forEach.call(overlay.querySelectorAll('.auth-social__btn'), function(b){
      b.addEventListener('click', function(){
        var c = getClient();
        if(!c) return setMsg('Accounts are unavailable right now — check your connection.', 'error');
        setMsg('Opening ' + b.textContent + '…');
        c.auth.signInWithOAuth({
          provider: b.getAttribute('data-provider'),
          options: { redirectTo: location.origin + location.pathname }
        }).then(function(res){
          if(res && res.error) setMsg(authMessage(res.error), 'error');
        });
      });
    });

    /* --- magic link ------------------------------------------------------ */

    // The password nobody has to remember. Worth offering first-class rather
    // than as a fallback: for a study site checked on a phone and a laptop,
    // "send me a link" is the whole ceremony, and a link that arrives beats a
    // password that has to be invented, stored and recalled.
    el.authMagicBtn.addEventListener('click', function(){
      var email = el.authEmail.value.trim();
      if(!email){ setMsg('Enter your email first, then we’ll send the link.', 'error'); el.authEmail.focus(); return; }
      var c = getClient();
      if(!c) return setMsg('Accounts are unavailable right now — check your connection.', 'error');
      el.authMagicBtn.disabled = true;
      setMsg('Sending…');
      c.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + location.pathname } })
        .then(function(res){
          el.authMagicBtn.disabled = false;
          if(res.error) return setMsg(authMessage(res.error), 'error');
          rememberEmail(email);
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
      var c = getClient();
      if(!c) return setMsg('Accounts are unavailable right now — check your connection and try again.', 'error');

      if(authMode !== 'newpassword'){
        if(!email || email.indexOf('@') < 1) { setMsg('Enter the email you use for your account.', 'error'); el.authEmail.focus(); return; }
      }
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
        if(res && res.error) return setMsg(authMessage(res.error), 'error');

        if(authMode === 'reset'){
          // Deliberately the same sentence whether or not that address has an
          // account. Saying "no account with that email" hands anyone with a
          // list of addresses a free check for which ones study here.
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

  function openAuthModal(mode){
    ensureAuthModal();
    var overlay = document.getElementById('authModalOverlay');
    lastFocused = document.activeElement;
    overlay._reset();
    overlay._setMode(mode || 'signin');
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
    pullOrSeed().then(function(applied){
      if(applied && !sessionStorage.getItem(RELOAD_ONCE_KEY)){
        sessionStorage.setItem(RELOAD_ONCE_KEY, '1');
        location.reload();
      }
    });
    startSyncTimer();
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
      // Straight to "create account": someone answering this prompt has no
      // account by definition, and landing them on a sign-in form they cannot
      // complete is one wasted step at exactly the wrong moment.
      openAuthModal('signup');
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
