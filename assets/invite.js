/* Invite friends (docs/invites.md).

   A friend who opens a link with r=<code> and makes a free account within 3
   days gets 3 days of Premium in the course the link pointed at. When that
   friend has answered 20 questions, the person who shared it gets 7 days of
   Premium in the same course, at most 8 times a year. The database decides
   all of it (scripts/sql/migrations/2026-10m-referrals.sql); this file only
   asks, and says what happened.

   Where the pieces live:
     share.js      makes this browser's code and puts it on every shared link
     account.js    remembers the r= a visitor landed with (levlprep_invited_v1)
                   and loads this file when a signed-in visitor has invite work
     premium.js    noteAnswer() hands each answer here while a claim is open
     account.html  "Invite friends" panel, filled by render()
     account.js    promptToSave() offers maybeCard() after a good session when
                   it has nothing of its own to say

   Loaded lazily: LevlLazy('invite', function(I){ ... }). It needs LevlShare,
   which it loads itself. Pure parts (cardEligible, statusText) are pinned by
   scripts/test/invite.test.mjs. */
(function(){
  if(window.LevlInvite) return;

  // courses:begin COURSE_LIST key,path,productName (generated from assets/courses.js by scripts/build-courses.mjs; edit there)
  var COURSE_LIST = [
    { key: 'nremt', path: '/nremt/', productName: 'NREMT-EMT Prep' },
    { key: 'ochem', path: '/ochem/', productName: 'Organic Chemistry' },
    { key: 'anp', path: '/anatomy-physiology/', productName: 'Anatomy & Physiology' },
    { key: 'apbio', path: '/bio/', productName: 'AP® Biology' },
    { key: 'apchem', path: '/chem/', productName: 'AP® Chemistry' },
    { key: 'apphys', path: '/physics/', productName: 'AP® Physics 1' },
    { key: 'apcalc', path: '/calculus/', productName: 'AP® Calculus AB' },
    { key: 'apstat', path: '/statistics/', productName: 'AP® Statistics' },
    { key: 'apenv', path: '/environmental-science/', productName: 'AP® Environmental Science' },
    { key: 'appsych', path: '/psychology/', productName: 'AP® Psychology' },
  ];
  // courses:end

  var INVITED_KEY = 'levlprep_invited_v1';
  var MINE_KEY = 'levlprep_invite_mine_v1';
  var COUNT_KEY = 'levlprep_invite_counting_v1';
  var PROMPT_KEY = 'levlprep_invite_prompt_v1';
  var CHECKED_KEY = 'levlprep_invite_checked_v1';
  var DAY = 86400000;
  var CODE_RE = /^[a-z2-9]{8}$/;
  var GIFT_DAYS = 3, REWARD_DAYS = 7, NEED = 20, CAP = 8;

  function readJson(k){ try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch(e){ return null; } }
  function writeJson(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){ /* private mode */ } }
  function drop(k){ try { localStorage.removeItem(k); } catch(e){ /* nothing kept */ } }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(ch){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch];
    });
  }
  function event(name, data){ if(window.LevlAnalytics && window.LevlAnalytics.event) window.LevlAnalytics.event(name, data || {}); }
  function acct(){ return window.StudyHubAccount || null; }
  function user(){ var A = acct(); return A && A.user ? A.user() : null; }
  function share(cb){ if(window.LevlLazy) window.LevlLazy('share', cb); }

  function courseByKey(key){
    for(var i = 0; i < COURSE_LIST.length; i++) if(COURSE_LIST[i].key === key) return COURSE_LIST[i];
    return null;
  }
  function courseOfPath(path){
    path = String(path || '');
    for(var i = 0; i < COURSE_LIST.length; i++) if(path.indexOf(COURSE_LIST[i].path) === 0) return COURSE_LIST[i].key;
    return null;
  }
  function courseName(key){ var c = courseByKey(key); return c ? c.productName : 'the first course you study'; }

  /* ---- signed-in work ------------------------------------------------- */

  /* Run when a signed-in visitor has something pending (account.js decides,
     with cheap reads, before loading this file). Each step is idempotent on
     the server, so a reload in the middle (the first-sync reload) repeats
     nothing harmful. */
  function onUser(u){
    if(!u) return;
    var A = acct();
    if(!A || !A.rpcData) return;
    var mine = readJson(MINE_KEY);
    if(mine && CODE_RE.test(mine.code) && mine.secret && !mine.bound){
      A.rpcData('referral_adopt', { p_code: mine.code, p_secret: mine.secret }).then(function(ok){
        if(ok === true){ mine.bound = true; mine.reg = true; writeJson(MINE_KEY, mine); }
      });
    } else if(!mine && !readJson(CHECKED_KEY)){
      // Signed in on a new device: reuse the account's code, so the panel and
      // every share show the same link.
      A.rpcData('referral_my_code', {}).then(function(code){
        if(typeof code === 'string' && CODE_RE.test(code) && !readJson(MINE_KEY)){
          writeJson(MINE_KEY, { code: code, secret: null, reg: true, bound: true, at: Date.now() });
        }
        writeJson(CHECKED_KEY, { at: Date.now() });
      });
    }
    var inv = readJson(INVITED_KEY);
    if(inv && CODE_RE.test(inv.code) && !inv.done){
      if(mine && mine.code === inv.code){ drop(INVITED_KEY); return; }
      A.rpcData('referral_claim', { p_code: inv.code, p_course: inv.course || null }).then(function(status){
        if(typeof status !== 'string') return; // offline or not applied yet: try on the next page
        inv.done = status;
        writeJson(INVITED_KEY, inv);
        event('invite-claim', { status: status, course: inv.course || 'none' });
        if(status === 'claimed' || status === 'already') writeJson(COUNT_KEY, { at: Date.now() });
        if(status === 'claimed') welcomeToast(inv.course);
      });
    }
  }

  function welcomeToast(course){
    var msg = 'A friend’s invite gave you ' + GIFT_DAYS + ' days of Premium in ' + courseName(course) + '.';
    share(function(S){ S.confirmToast(msg); });
    // Premium state is cached per page: let premium.js look again.
    if(window.LevlPremium && window.LevlPremium.refresh) window.LevlPremium.refresh();
  }

  /* One answer from a signed-in friend with an open claim (premium.js). */
  var inFlight = false;
  function answer(course){
    var A = acct();
    if(!A || !A.rpcData || !user() || inFlight) return;
    inFlight = true;
    A.rpcData('referral_note_answer', { p_course: course || null }).then(function(res){
      inFlight = false;
      if(!res) return;
      if(res.claim === false || res.done){
        drop(COUNT_KEY);
        if(res.done) event('invite-qualified', { course: course || 'none' });
      }
    }, function(){ inFlight = false; });
  }

  /* ---- the card after a good session ---------------------------------- */

  /* ctx is promptToSave's: { kind: 'exam', score, total } | { kind: 'session',
     answered } | { level }. A good moment is a finished exam at 70% or
     better, a set of 8 or more, or a level-up; never mid-question. At most
     once every 4 days, and after 3 "Not now"s, not for 30 days. */
  function cardEligible(ctx, state, now){
    ctx = ctx || {};
    state = state || {};
    var good = (ctx.kind === 'exam' && ctx.total >= 5 && ctx.score / ctx.total >= 0.7)
      || (ctx.kind === 'session' && ctx.answered >= 8)
      || (ctx.level > 1);
    if(!good) return false;
    if(state.last && now - state.last < 4 * DAY) return false;
    if((state.dismissed || 0) >= 3 && state.last && now - state.last < 30 * DAY) return false;
    return true;
  }

  function cardCopy(signedIn){
    return {
      title: 'Studying with anyone?',
      sub: 'Send them your link. They get ' + GIFT_DAYS + ' days of Premium free, and you get ' + REWARD_DAYS +
        ' days once they’ve answered ' + NEED + ' questions' + (signedIn ? '.' : ' (free account to collect).')
    };
  }

  function maybeCard(ctx){
    if(document.getElementById('savePrompt') || document.getElementById('invitePrompt') || document.getElementById('levlHeard')) return false;
    var state = readJson(PROMPT_KEY) || {};
    var now = Date.now();
    if(!cardEligible(ctx, state, now)) return false;
    state.last = now;
    state.shown = (state.shown || 0) + 1;
    writeJson(PROMPT_KEY, state);
    var course = courseOfPath(location.pathname);
    var copy = cardCopy(!!user());
    var el = document.createElement('div');
    el.id = 'invitePrompt';
    el.className = 'levl-prompt';
    el.setAttribute('role', 'status');
    el.innerHTML =
      '<div class="levl-prompt__text"><b>' + esc(copy.title) + '</b><small>' + esc(copy.sub) + '</small></div>' +
      '<div class="levl-prompt__actions">' +
        '<button type="button" class="levl-prompt__yes" id="invitePromptYes">Share my link</button>' +
        '<button type="button" class="levl-prompt__no" id="invitePromptNo">Not now</button>' +
      '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function(){ el.classList.add('show'); });
    event('invite-card', { course: course || 'site' });

    var settled = false;
    function close(){
      settled = true;
      el.classList.remove('show');
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 350);
    }
    document.getElementById('invitePromptYes').addEventListener('click', function(){
      close();
      shareLink(course, 'card');
    });
    document.getElementById('invitePromptNo').addEventListener('click', function(){
      var s = readJson(PROMPT_KEY) || {};
      s.dismissed = (s.dismissed || 0) + 1;
      writeJson(PROMPT_KEY, s);
      event('invite-card-dismissed', {});
      close();
    });
    // Like the save prompt: never in the way, gone on its own.
    setTimeout(function(){ if(!settled) close(); }, 15000);
    return true;
  }

  function shareLink(course, from){
    var c = courseByKey(course);
    share(function(S){
      S.share({
        what: 'invite',
        course: course || 'site',
        title: 'LevlPrep',
        text: 'I’ve been studying' + (c ? ' ' + c.productName : '') + ' on LevlPrep. Free practice, and this link gets you ' + GIFT_DAYS + ' days of Premium.',
        url: c ? c.path : '/'
      }).then(function(method){ event('invite-share', { from: from, method: method, course: course || 'site' }); });
    });
  }

  /* ---- landing with an invite ----------------------------------------- */

  /* account.js stored the invite; signed-out visitors see one small offer to
     make the free account the gift needs. Once per invite. */
  function landing(){
    var inv = readJson(INVITED_KEY);
    if(!inv || inv.offered || inv.done || user()) return;
    inv.offered = Date.now();
    writeJson(INVITED_KEY, inv);
    if(document.getElementById('savePrompt') || document.getElementById('invitePrompt')) return;
    var el = document.createElement('div');
    el.id = 'invitePrompt';
    el.className = 'levl-prompt';
    el.setAttribute('role', 'status');
    el.innerHTML =
      '<div class="levl-prompt__text"><b>A friend sent you ' + GIFT_DAYS + ' days of Premium</b>' +
      '<small>Make a free account in the next 3 days to unlock it' + (inv.course ? ' in ' + esc(courseName(inv.course)) : '') + '.</small></div>' +
      '<div class="levl-prompt__actions">' +
        '<button type="button" class="levl-prompt__yes" id="invitePromptYes">Get my 3 days</button>' +
        '<button type="button" class="levl-prompt__no" id="invitePromptNo">Later</button>' +
      '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function(){ el.classList.add('show'); });
    function close(){
      el.classList.remove('show');
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 350);
    }
    document.getElementById('invitePromptYes').addEventListener('click', function(){
      close();
      event('invite-landing', { action: 'signup' });
      var A = acct();
      if(A && A.openAuthModal) A.openAuthModal('signup');
    });
    document.getElementById('invitePromptNo').addEventListener('click', function(){
      close();
      event('invite-landing', { action: 'later' });
    });
  }

  /* ---- account page panel --------------------------------------------- */

  function statusText(s){
    s = s || {};
    var joined = s.joined | 0, studying = s.studying | 0, rewarded = s.rewarded | 0;
    var days = rewarded * (s.days_each || REWARD_DAYS);
    if(!joined) return 'Nobody has joined from your link yet.';
    var out = joined + (joined === 1 ? ' friend joined' : ' friends joined') + ', ' +
      studying + ' answered ' + NEED + '+ questions. You’ve earned ' + days + ' days of Premium.';
    if(s.waiting) out += ' ' + s.waiting + ' more ' + (s.waiting === 1 ? 'reward is' : 'rewards are') + ' over this year’s limit of ' + (s.cap || CAP) + '.';
    return out;
  }

  function render(el){
    if(!el) return;
    share(function(S){
      var code = S.myInvite();
      var link = S.shareUrl('/', location.href, code);
      el.innerHTML =
        '<p>Share your link. A friend who makes a free account gets <strong>' + GIFT_DAYS + ' days of Premium</strong>. ' +
        'When they’ve answered ' + NEED + ' questions, you get <strong>' + REWARD_DAYS + ' days of Premium</strong> in that course (up to ' + CAP + ' times a year).</p>' +
        '<div class="inv-link"><input type="text" readonly id="invLink" aria-label="Your invite link" value="' + esc(link) + '">' +
        '<button type="button" class="btn-chan" id="invShare">Share</button></div>' +
        '<p class="ac-small" id="invStatus">Checking your invites…</p>';
      document.getElementById('invShare').addEventListener('click', function(){ shareLink(null, 'account'); });
      document.getElementById('invLink').addEventListener('focus', function(e){ e.target.select(); });
      var A = acct();
      var out = document.getElementById('invStatus');
      if(!A || !A.rpcData || !user()){ out.textContent = 'Sign in to see who joined and collect rewards.'; return; }
      // A code made here while signed in is bound on registration; one made
      // earlier while signed out is bound by onUser. Either way, ask after.
      setTimeout(function(){
        A.rpcData('referral_summary', {}).then(function(s){
          out.textContent = s ? statusText(s) : 'Invite numbers aren’t available right now.';
        });
      }, 800);
    });
  }

  window.LevlInvite = {
    onUser: onUser,
    answer: answer,
    maybeCard: maybeCard,
    landing: landing,
    render: render,
    shareLink: shareLink,
    // Pure, for scripts/test/invite.test.mjs.
    cardEligible: cardEligible,
    cardCopy: cardCopy,
    statusText: statusText,
    courseOfPath: courseOfPath
  };
})();
