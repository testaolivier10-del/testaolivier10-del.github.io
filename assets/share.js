/* Sharing a result, a level, a streak or a milestone.

   A student who finishes a practice exam or a chapter is at the one moment
   they might tell somebody, and the site had no way to help them. A link
   pasted into a group chat is also how this site spreads at all (see the
   comment at the top of scripts/build-og-tags.mjs), so this is worth the one
   button.

   Two routes, picked by what the device can do:
     - navigator.share, the phone's own share sheet. A file goes with it (the
       certificate image) only where navigator.canShare({ files }) says the
       sheet will take one; otherwise the link alone.
     - Anywhere else, the link is copied and a small confirmation appears,
       spoken through assets/announce.js for screen readers.

   Every link handed out carries ?ref=share, merged into whatever query it
   already has, so analytics.js can tell a visit that came from a shared link
   from one that did not (README, Analytics). One `share` event per attempt,
   with how it went: native, copy, or cancel. Dismissing the share sheet is a
   cancel — the student changed their mind, and counting it as shared would
   make the number mean nothing.

   Wording is the caller's, through result() below or its own text, and has
   one rule: say what happened, plainly. A score appears only on the screen
   that shows the student their own score, where sharing it is their choice.
   Nothing here says "certified" or implies that anyone but LevlPrep stands
   behind it.

   Not loaded by any page directly: site-chrome.js fetches it the first time
   something asks, through window.LevlLazy('share', fn). Pure parts (shareUrl,
   resultText) are pinned by scripts/test/share.test.mjs. */
(function(){
  if(window.LevlShare) return;

  var COURSES = {
    nremt: { name: 'NREMT-EMT prep', home: '/nremt/' },
    ochem: { name: 'Organic Chemistry', home: '/ochem/' },
    anp: { name: 'Anatomy & Physiology', home: '/anatomy-physiology/' }
  };

  var ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"/></svg>';

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(ch){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch];
    });
  }

  function courseOf(path){
    path = String(path || '');
    if(path.indexOf('/nremt') > -1) return 'nremt';
    if(path.indexOf('/ochem') > -1) return 'ochem';
    if(path.indexOf('/anatomy-physiology') > -1) return 'anp';
    return 'site';
  }

  /* The link to hand out: absolute (it is going to someone else's phone, where
     a relative path means nothing), with ref=share set exactly once and every
     other parameter and the #fragment kept as they were. Written with string
     operations rather than URL so it behaves the same in every browser this
     site supports and in the test sandbox. */
  var ABS = /^[a-z][a-z0-9+.-]*:\/\//i;
  function shareUrl(url, base, code){
    base = String(base || '');
    url = String(url || base || '/');
    if(!ABS.test(url)){
      var origin = (base.match(/^[a-z][a-z0-9+.-]*:\/\/[^\/?#]+/i) || [''])[0];
      url = url.charAt(0) === '/' ? origin + url
          : base.replace(/[?#].*$/, '').replace(/[^\/]*$/, '') + url;
    }
    var hash = '', i = url.indexOf('#');
    if(i > -1){ hash = url.slice(i); url = url.slice(0, i); }
    var query = '', j = url.indexOf('?');
    if(j > -1){ query = url.slice(j + 1); url = url.slice(0, j); }
    var parts = query.split('&').filter(function(p){ var k = p.split('=')[0]; return p && k !== 'ref' && k !== 'r'; });
    parts.push('ref=share');
    if(code && CODE_RE.test(code)) parts.push('r=' + code);
    return url + '?' + parts.join('&') + hash;
  }

  /* ---- invite code (docs/invites.md) -----------------------------------

     Every link this file hands out also carries the sharer's invite code,
     r=<8 characters>, so any share (a result, a level, a certificate, the
     invite card) can earn the invite reward. The code is made here, the first
     time something is shared, so it exists before the link leaves: 8
     characters for the link and a secret that never leaves this browser.
     Registering it is anonymous (referral_register); signing in later binds
     it to the account, and only a browser holding the secret can do that
     (referral_adopt, assets/invite.js), so a friend who saw the link cannot
     claim the code. Signed in when it is made, it is bound at once. */
  var MINE_KEY = 'levlprep_invite_mine_v1';
  var CODE_RE = /^[a-z2-9]{8}$/;
  // No 0/o, 1/l/i: a code read aloud or retyped survives.
  var ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';
  function randomText(n, alpha){
    var out = '', bytes = new Uint8Array(n);
    var c = window.crypto || window.msCrypto;
    if(c && c.getRandomValues) c.getRandomValues(bytes);
    else for(var i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
    for(var j = 0; j < n; j++) out += alpha.charAt(bytes[j] % alpha.length);
    return out;
  }
  function readMine(){
    try {
      var m = JSON.parse(localStorage.getItem(MINE_KEY) || 'null');
      return m && CODE_RE.test(m.code) ? m : null;
    } catch(e){ return null; }
  }
  function writeMine(m){
    try { localStorage.setItem(MINE_KEY, JSON.stringify(m)); } catch(e){ /* private mode: the code lives for this page only */ }
  }
  function registerMine(m){
    var A = window.StudyHubAccount;
    if(!A || !A.rpc || m.reg || !m.secret) return;
    A.rpc('referral_register', { p_code: m.code, p_secret: m.secret }).then(function(ok){
      if(!ok) return;
      var cur = readMine();
      if(cur && cur.code === m.code){
        cur.reg = true;
        if(A.user && A.user()) cur.bound = true;
        writeMine(cur);
      }
    });
  }
  /* This browser's code, made on first use. Null only where storage and
     crypto are both missing, in which case links go out without one. */
  var pageMine = null;
  function myInvite(){
    var m = readMine() || pageMine;
    if(!m){
      m = { code: randomText(8, ALPHA), secret: randomText(32, ALPHA + 'ABCDEFGHJKMNPQRSTUVWXYZ'), reg: false, at: Date.now() };
      pageMine = m;
      writeMine(m);
    }
    if(!m.reg) registerMine(m);
    return m.code;
  }

  /* The sentence a results screen shares. The student is looking at their own
     score when they press this, so it is theirs to send; the label says what
     kind of attempt it was so "82%" is not read as more than it is. */
  function resultText(r){
    var total = Math.max(0, r.total | 0), right = Math.max(0, r.right | 0);
    var pct = total ? Math.round(right / total * 100) : 0;
    return 'I scored ' + pct + '% on ' + (r.label || 'a practice set') + ' on LevlPrep (' + right + ' of ' + total + ' right).';
  }

  /* ---- copy fallback --------------------------------------------------- */

  function copyText(text){
    var nav = window.navigator;
    if(nav.clipboard && nav.clipboard.writeText && window.isSecureContext !== false){
      return nav.clipboard.writeText(text).then(function(){ return true; }, function(){ return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  // execCommand is deprecated but is the only copy an older Safari or a
  // non-secure preview has; a failure here falls through to showing the link.
  function legacyCopy(text){
    try{
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.top = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      ta.remove();
      return !!ok;
    }catch(e){ return false; }
  }

  /* The confirmation: the level-up toast's shape, under its own id so the two
     never fight over one element. Hidden from assistive tech because the
     announcer says the same thing once, politely, rather than twice. */
  var toastTimer;
  function confirmToast(msg){
    var el = document.getElementById('levlShareToast');
    if(!el){
      el = document.createElement('div');
      el.id = 'levlShareToast';
      el.className = 'levl-toast levl-toast--share';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    clearTimeout(toastTimer);
    requestAnimationFrame(function(){ el.classList.add('show'); });
    toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 3200);
    if(window.LevlAnnounce) window.LevlAnnounce.say(msg);
  }

  /* ---- share ----------------------------------------------------------- */

  /* o: { what, course, title, text, url, file }
       what    'exam' | 'level' | 'streak' | 'milestone' — the analytics label
       file    an optional File (a PNG); only sent where the sheet accepts one
     Resolves to 'native', 'copy', 'cancel' or 'none' (nothing worked; the link
     was shown instead). Never rejects: a share that fails must not break the
     results screen it was pressed on. */
  function share(o){
    o = o || {};
    var url = shareUrl(o.url || location.href, location.href, o.noInvite ? null : myInvite());
    var nav = window.navigator;

    function done(method){
      if(method !== 'none' && window.LevlAnalytics){
        window.LevlAnalytics.event('share', { what: o.what || 'page', course: o.course || courseOf(location.pathname), method: method });
      }
      return method;
    }
    function copy(){
      return copyText(url).then(function(ok){
        if(ok){ confirmToast('Link copied. Paste it anywhere to share.'); return done('copy'); }
        confirmToast('Copy this link to share it: ' + url);
        return done('none');
      });
    }

    if(nav.share){
      var data = { title: o.title || 'LevlPrep', text: o.text || '', url: url };
      if(o.file && nav.canShare){
        try{ if(nav.canShare({ files: [o.file] })) data.files = [o.file]; }catch(e){ /* no file sharing here */ }
      }
      return nav.share(data).then(function(){ return done('native'); }, function(err){
        if(err && err.name === 'AbortError') return done('cancel');
        // NotAllowedError and friends: the sheet would not open (lost user
        // activation, an embedded frame). The link still gets out.
        return copy();
      });
    }
    return copy();
  }

  /* A share button placed straight after `anchor`. Re-running a results
     screen (a retry, a second exam) replaces the button rather than stacking
     a second one. `o` may be a function, read at click time, for callers whose
     share text depends on state that changes after the button is drawn. */
  function button(anchor, o, label){
    if(!anchor || !anchor.parentNode) return null;
    var row = anchor.nextElementSibling;
    if(!(row && row.classList && row.classList.contains('levl-share-row'))){
      row = document.createElement('p');
      row.className = 'levl-share-row';
      anchor.insertAdjacentElement('afterend', row);
    }
    row.innerHTML = '<button type="button" class="levl-share-btn">' + ICON + '<span>' + esc(label || 'Share') + '</span></button>';
    var b = row.firstChild;
    b.addEventListener('click', function(){ share(typeof o === 'function' ? o() : o); });
    return b;
  }

  /* The results-screen hook: one call from each course's finish screen.
     r: { course, right, total, label } */
  function result(anchor, r){
    var c = COURSES[r.course] || {};
    return button(anchor, {
      what: 'exam',
      course: r.course,
      title: 'LevlPrep ' + (c.name || ''),
      text: resultText(r),
      url: c.home || '/'
    }, 'Share result');
  }

  window.LevlShare = {
    share: share,
    button: button,
    result: result,
    shareUrl: shareUrl,
    myInvite: myInvite,
    copyText: copyText,
    confirmToast: confirmToast,
    resultText: resultText,
    ICON: ICON,
    COURSES: COURSES
  };
})();
