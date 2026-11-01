/* Umami analytics.

   The site kept a counter of its own long before this (account.js ->
   track_pageview): a per-path, per-day tally in our own database with no
   identifiers of any kind. That still runs. This sits alongside it and answers
   the question it never could — not "was this page opened" but "did the person
   who opened it finish what they started".

   Be honest about the trade. Umami is one of the respectful ones: no cookies,
   no cross-site tracking, no advertising. But it is a third party, and it does
   collect more than our own counter — referrer, country, browser, OS, device,
   and a daily visitor hash derived from IP and user agent so that visits can
   be told apart. privacy.html says so plainly; if what is collected here ever
   changes, that page changes with it.

   WEBSITE_ID is the one thing that has to be filled in. Until it is, this file
   does nothing at all: no script is loaded, no request is made, and every
   event() call is a no-op. That is deliberate — a half-configured tracker that
   quietly phones home would be the worst of both worlds.

   There is also a per-browser opt-out, offered on privacy.html. It exists for
   two different people who want the same thing: a visitor who would simply
   rather not be counted, and whoever runs the site, whose own testing is
   otherwise indistinguishable from real traffic and quietly inflates every
   number on the dashboard. Checked before the script tag is created, so
   opting out means no request to Umami rather than a request that is
   discarded at the far end. */
(function(){
  // From the Umami dashboard: Settings -> Websites -> the site -> "Website ID".
  var WEBSITE_ID = 'cc421df1-3f32-40f1-bd08-d7f6666de3ac';
  // A pinned copy served from this site. Events go to HOST_URL/api/send, the
  // site's Worker, which drops bots and forwards to Umami (worker/src/umami.js);
  // cloud.umami.is is on ad-block lists, so students were the ones not counted.
  var SCRIPT_URL = '/assets/vendor/umami-2.10.0.js';
  var HOST_URL = 'https://api.levlprep.com'; // site-config:API_URL
  var OPT_OUT_KEY = 'levlprep_analytics_opt_out';
  // Which course a page is in, for the visit event (courseOf).
  // courses:begin COURSE_LIST key,dir (generated from assets/courses.js by scripts/build-courses.mjs; edit there)
  var COURSE_LIST = [
    { key: 'nremt', dir: 'nremt' },
    { key: 'ochem', dir: 'ochem' },
    { key: 'anp', dir: 'anatomy-physiology' },
    { key: 'apbio', dir: 'bio' },
    { key: 'apchem', dir: 'chem' },
    { key: 'apphys', dir: 'physics' },
    { key: 'apcalc', dir: 'calculus' },
    { key: 'apstat', dir: 'statistics' },
    { key: 'apenv', dir: 'environmental-science' },
    { key: 'appsych', dir: 'psychology' },
    { key: 'apprecalc', dir: 'precalculus' },
  ];
  // courses:end

  /* Read fresh on every call rather than cached at load: the toggle on
     privacy.html flips this, and the answer has to change without a reload.
     A browser that refuses localStorage (Safari in private mode, site data
     blocked) throws on read — treated as "not opted out", because the
     visitor has not asked for anything, and the opposite reading would
     silently disable the toggle for everyone in that state. */
  function optedOut(){
    try { return localStorage.getItem(OPT_OUT_KEY) === '1'; }
    catch(e){ return false; }
  }

  function setOptedOut(value){
    try {
      if(value) localStorage.setItem(OPT_OUT_KEY, '1');
      else localStorage.removeItem(OPT_OUT_KEY);
    } catch(e){ return false; }
    return true;
  }

  var enabled = !!WEBSITE_ID;

  /* Record a milestone. Deliberately not a general-purpose event firehose:
     Umami's free tier counts every event against a monthly total, and the
     difference between tracking milestones and tracking keystrokes is the
     difference between a few events per visit and a hundred. One 100-question
     exam should cost two events — started, finished — not a hundred.

     Safe to call whether or not analytics is configured, loaded, or blocked;
     a blocked script leaves window.umami undefined and this simply returns. */
  /* Events raised before the Umami script has finished loading used to be
     dropped on the floor. That was harmless while every call site was a
     student finishing an exam minutes in, and became a real hole the moment
     anything fired on page load: the visit event below would have been lost
     on exactly the slow connections whose retention we most want to read.
     So hold them, briefly, and flush once the script arrives.

     Bounded, because an unbounded queue on a page where the script is blocked
     by an extension is just a memory leak that never drains. */
  var pending = [];
  var PENDING_MAX = 20;

  function send(name, data){
    if(data) window.umami.track(name, data);
    else window.umami.track(name);
  }

  function flush(){
    if(!(window.umami && typeof window.umami.track === 'function')) return;
    var queued = pending;
    pending = [];
    for(var i = 0; i < queued.length; i++){
      try { send(queued[i].name, queued[i].data); }
      catch(e){ /* analytics must never break a study session */ }
    }
  }

  function event(name, data){
    if(!enabled || optedOut()) return;
    data = withSource(data);
    try {
      if(window.umami && typeof window.umami.track === 'function'){
        flush();
        send(name, data);
      } else if(pending.length < PENDING_MAX){
        pending.push({ name: name, data: data });
      }
    } catch(e){ /* analytics must never break a study session */ }
  }


  /* ---- Return-rate measurement ----------------------------------------

     Pageviews answer "was this opened". They cannot answer the only question
     that matters for a study app: did the person come back tomorrow. That
     needs a small amount of per-browser history, which is kept here rather
     than at the far end, because Umami deliberately does not give us a stable
     visitor id to join on across days.

     What is stored is three dates and two counters in this browser's own
     localStorage. No identifier of any kind is generated, nothing is sent
     that could pick this browser out of a crowd, and the numbers that leave
     are coarse on purpose: a bucket like "d2-7", not a date. The opt-out on
     privacy.html covers all of it, because everything here goes through
     event() and event() returns early when opted out.

     Cost control matters too: one 'visit' event per browser per day, not per
     page load. A student who opens nine pages in an evening is one event. */
  var VISITS_KEY = 'levlprep_visits';
  var ONCE_KEY = 'levlprep_once';
  var DAY = 86400000;

  function today(){
    // Local midnight, not UTC: "did they come back the next day" is a question
    // about the student's day, and a UTC key rolls over mid-evening in the US.
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function parseDay(key){
    var p = String(key || '').split('-');
    if(p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  function daysBetween(fromKey, toKey){
    var a = parseDay(fromKey), b = parseDay(toKey);
    if(!a || !b) return 0;
    return Math.max(0, Math.round((b - a) / DAY));
  }

  function readVisits(){
    try {
      var raw = JSON.parse(localStorage.getItem(VISITS_KEY) || 'null');
      if(raw && typeof raw === 'object') return raw;
    } catch(e){ /* unreadable or blocked — start fresh, never throw */ }
    return null;
  }

  function writeVisits(v){
    try { localStorage.setItem(VISITS_KEY, JSON.stringify(v)); } catch(e){ /* private mode */ }
  }

  /* How long since this browser's first visit, as a bucket rather than a
     number, so the dashboard groups without post-processing and so nothing
     precise enough to be identifying ever leaves. */
  function cohort(days, isFirst){
    if(isFirst) return 'new';
    if(days <= 1) return 'd1';
    if(days <= 7) return 'd2-7';
    if(days <= 30) return 'd8-30';
    return 'd31+';
  }

  /* Fired at most once per browser per day, from mount(). The properties are
     what every retention question is built from: how many distinct days this
     browser has studied, how long since the first one, and whether this is
     the second day — the single steepest drop in any study app. */
  function trackVisit(){
    var t = today();
    var v = readVisits();
    var isFirst = !v;

    if(isFirst) v = { first: t, last: t, days: 1, sent: null };
    else if(v.last !== t){ v.days = (v.days || 1) + 1; v.last = t; }

    var age = daysBetween(v.first, t);
    var alreadySentToday = v.sent === t;
    v.sent = t;
    writeVisits(v);

    // Before the once-a-day guard: an evening return still counts.
    if(landedRef){
      event('ref-open', { ref: landedRef, course: courseOf(location.pathname) });
      // The same landing, counted where the weekly report can read it.
      var acct = window.StudyHubAccount;
      if(acct && acct.trackRef) acct.trackRef(landedRef, 'visit');
    }

    if(alreadySentToday) return; // nine pages in one evening is still one visit

    event('visit', {
      cohort: cohort(age, isFirst),
      day: age,          // days since first ever visit
      visits: v.days,    // distinct days studied, all time
      course: courseOf(location.pathname),
      ref: landedRef || 'none'
    });

    // The 1 -> 2 conversion, called out on its own because it is the number
    // worth moving and the one that gets lost inside a property filter.
    if(v.days === 2) event('returned-second-day', { day: age });
  }

  /* ?ref= on the links the site sends students back on (sw.js push,
     worker email, share.js): none of the three carries a usable referrer.
     Read once, reported only if known, stripped from the address bar.
     Video links carry their own tag, <platform>-<topic> (tt-sn2, yt-nremt-cardiac),
     so Umami can tell which TikTok or YouTube video a visit came from. */
  var REFS = { push: 1, email: 1, share: 1 };
  var VIDEO_REF = /^(tt|yt|ig)-[a-z0-9-]{1,40}$/;
  var landedRef = takeRef();

  /* The last video that brought this browser here, kept for 30 days in this
     browser only, so a visit from a TikTok on Monday that buys on Thursday
     is still credited to that TikTok. Counted per day in Supabase
     (track_ref, scripts/sql/migrations/2026-10d-ref-tracking.sql) as
     anonymous totals, never with a user or browser id. */
  var ATTR_KEY = 'levlprep_ref';
  var ATTR_DAYS = 30;
  if(landedRef && VIDEO_REF.test(landedRef)){
    try { localStorage.setItem(ATTR_KEY, JSON.stringify({ ref: landedRef, at: Date.now() })); } catch(e){ /* private mode */ }
  }
  function attributedRef(){
    try {
      var v = JSON.parse(localStorage.getItem(ATTR_KEY) || 'null');
      if(v && v.ref && VIDEO_REF.test(v.ref) && Date.now() - v.at < ATTR_DAYS * 86400000) return v.ref;
    } catch(e){ /* nothing kept */ }
    return null;
  }

  function takeRef(){
    try {
      var url = new URL(location.href);
      var ref = url.searchParams.get('ref');
      if(ref === null) return null;
      url.searchParams.delete('ref');
      if(history.replaceState) history.replaceState(history.state, '', url.pathname + url.search + url.hash);
      return REFS[ref] || VIDEO_REF.test(ref) ? ref : null;
    } catch(e){ return null; }
  }

  function courseOf(path){
    for(var i = 0; i < COURSE_LIST.length; i++){
      if(path.indexOf('/' + COURSE_LIST[i].dir) > -1) return COURSE_LIST[i].key;
    }
    return 'site';
  }

  /* Fire an event at most once in this browser's lifetime. For the milestones
     that only mean something the first time — the first question ever
     answered, and how long the student had to hunt for it. */
  function once(name, data){
    var seen;
    try { seen = JSON.parse(localStorage.getItem(ONCE_KEY) || '{}'); }
    catch(e){ seen = {}; }
    if(seen && seen[name]) return;
    seen[name] = 1;
    try { localStorage.setItem(ONCE_KEY, JSON.stringify(seen)); } catch(e){ /* private mode: may re-fire, acceptable */ }
    event(name, data);
  }

  /* Seconds from this page's navigation to now, rounded, for time-to-first-
     question. performance.timeOrigin is the honest start; Date-based fallback
     for anything that lacks it. */
  function secondsIn(){
    try {
      if(window.performance && performance.now) return Math.round(performance.now() / 1000);
    } catch(e){ /* fall through */ }
    return null;
  }

  // Honor Do Not Track (this tracker version has no option for it).
  function doNotTrack(){
    try {
      var v = (navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack || '') + '';
      return v === '1' || v === 'yes';
    } catch(e){ return false; }
  }

  function mount(){
    takeNoTrack();
    if(!enabled || optedOut() || doNotTrack() || automated() || window.__levlAnalyticsMounted) return;
    window.__levlAnalyticsMounted = true;
    noteFirstTouch();
    var s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.defer = true;
    s.setAttribute('data-website-id', WEBSITE_ID);
    s.setAttribute('data-host-url', HOST_URL);
    s.addEventListener('load', function(){ flush(); flushIdentify(); });
    document.head.appendChild(s);

    // Queued, then flushed by the listener above once the script lands.
    trackVisit();
    watchPage();
  }

  /* ---- Not people: automation and the owner (docs/analytics-plan.md) ---- */
  var OWNER_EMAIL_SHA256 = [ // same list as worker/src/umami.js
    '6ac353e37000f38dc54cdee3ed28f34e498f6978b33ad16409471cd7c2441154',
    '7662e6de54cf228c5781e9b65b74ea942b2fc1156dbc3517fe20a9ca5f3e5d55'
  ];
  var AUTOMATED_UA = /HeadlessChrome|PhantomJS|Playwright|Puppeteer|Lighthouse|PageSpeed|GTmetrix|Prerender|bot\b|crawler|spider/i;

  function automated(){
    try {
      if(navigator.webdriver === true) return true;
      return AUTOMATED_UA.test(navigator.userAgent || '');
    } catch(e){ return false; }
  }

  // The tracker's own off switch, read by umami-2.10.0.js before every send.
  function setTrackerDisabled(value){
    try {
      if(value) localStorage.setItem('umami.disabled', '1');
      else localStorage.removeItem('umami.disabled');
    } catch(e){ /* private mode */ }
  }

  // ?notrack=1 on any page opts this browser out; ?notrack=0 opts back in.
  function takeNoTrack(){
    try {
      var url = new URL(location.href);
      var v = url.searchParams.get('notrack');
      if(v === null) return;
      setOptedOut(v !== '0');
      setTrackerDisabled(v !== '0');
      url.searchParams.delete('notrack');
      if(history.replaceState) history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    } catch(e){ /* nothing to do */ }
  }

  function sha256Hex(text){
    try {
      if(!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.resolve(null);
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function(buf){
        var bytes = new Uint8Array(buf), hex = '';
        for(var i = 0; i < bytes.length; i++) hex += ('0' + bytes[i].toString(16)).slice(-2);
        return hex;
      }, function(){ return null; });
    } catch(e){ return Promise.resolve(null); }
  }

  /* account.js, whenever a session is known: the owner's browsers opt out;
     anyone else gets an account tag (hash of the id, never the email). */
  var identified = false;
  function signedIn(user){
    if(!user || identified) return;
    identified = true;
    var email = String(user.email || '').trim().toLowerCase();
    sha256Hex(email).then(function(h){
      if(h && OWNER_EMAIL_SHA256.indexOf(h) > -1){
        setOptedOut(true);
        setTrackerDisabled(true);
        return;
      }
      if(!enabled || optedOut() || !user.id) return;
      sha256Hex('levlprep:' + user.id).then(function(id){
        if(!id) return;
        pendingIdentify = { acct: id.slice(0, 16), signed_in: 'yes' };
        flushIdentify();
      });
    });
  }
  var pendingIdentify = null;
  function flushIdentify(){
    if(!pendingIdentify || optedOut()) return;
    if(!(window.umami && typeof window.umami.identify === 'function')) return;
    try { window.umami.identify(pendingIdentify); } catch(e){ /* never break a page */ }
    pendingIdentify = null;
  }


  /* ---- First touch: one word, kept in this browser, sent as `src` --------
     From the video ref, utm_source, the referrer, or an in-app browser's user
     agent (TikTok and Instagram send no referrer). Also sent with checkout. */
  var FIRST_KEY = 'levlprep_first';
  var REFERRERS = [
    [/(^|\.)gemini\.google\./, 'gemini'],
    [/(^|\.)google\./, 'google'],
    [/(^|\.)bing\.com$/, 'bing'],
    [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
    [/(^|\.)yahoo\.com$/, 'yahoo'],
    [/(^|\.)ecosia\.org$/, 'ecosia'],
    [/(^|\.)search\.brave\.com$/, 'brave'],
    [/(^|\.)(chatgpt\.com|openai\.com)$/, 'chatgpt'],
    [/(^|\.)perplexity\.ai$/, 'perplexity'],
    [/(^|\.)copilot\.microsoft\.com$/, 'copilot'],
    [/(^|\.)claude\.ai$/, 'claude'],
    [/(^|\.)reddit\.com$/, 'reddit'],
    [/(^|\.)tiktok\.com$/, 'tiktok'],
    [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
    [/(^|\.)instagram\.com$/, 'instagram'],
    [/(^|\.)facebook\.com$/, 'facebook'],
    [/(^|\.)(t\.co|x\.com|twitter\.com)$/, 'x'],
    [/(^|\.)discord(app)?\.com$/, 'discord'],
    [/(^|\.)quizlet\.com$/, 'quizlet']
  ];
  var IN_APP = [
    [/musical_ly|TikTok|BytedanceWebview/i, 'tiktok'],
    [/Instagram/i, 'instagram'],
    [/FBAN|FBAV|FB_IAB/i, 'facebook'],
    [/Snapchat/i, 'snapchat'],
    [/Reddit/i, 'reddit']
  ];
  var CLEAN_SRC = /^[a-z0-9][a-z0-9.-]{0,39}$/;

  function sourceFromRef(ref){
    if(!ref) return null;
    if(/^tt-/.test(ref)) return 'tiktok';
    if(/^yt-/.test(ref)) return 'youtube';
    if(/^ig-/.test(ref)) return 'instagram';
    return REFS[ref] ? ref : null;
  }

  function sourceFromUtm(){
    try {
      var v = new URL(location.href).searchParams.get('utm_source');
      if(!v) return null;
      v = String(v).toLowerCase().replace(/^www\./, '').slice(0, 40);
      if(/chatgpt|openai/.test(v)) return 'chatgpt';
      if(/perplexity/.test(v)) return 'perplexity';
      return CLEAN_SRC.test(v) ? v : null;
    } catch(e){ return null; }
  }

  function sourceFromReferrer(){
    try {
      if(!document.referrer) return null;
      var host = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '');
      if(!host || host === location.hostname.replace(/^www\./, '')) return null;
      for(var i = 0; i < REFERRERS.length; i++) if(REFERRERS[i][0].test(host)) return REFERRERS[i][1];
      host = host.split('.').slice(-2).join('.');
      return CLEAN_SRC.test(host) ? host : null;
    } catch(e){ return null; }
  }

  function sourceFromApp(){
    try {
      var ua = navigator.userAgent || '';
      for(var i = 0; i < IN_APP.length; i++) if(IN_APP[i][0].test(ua)) return IN_APP[i][1];
    } catch(e){ /* fall through */ }
    return null;
  }

  function detectSource(){
    return sourceFromRef(landedRef) || sourceFromUtm() || sourceFromReferrer() || sourceFromApp() || 'direct';
  }

  function noteFirstTouch(){
    try {
      if(localStorage.getItem(FIRST_KEY)) return;
      localStorage.setItem(FIRST_KEY, JSON.stringify({ src: detectSource(), at: today() }));
    } catch(e){ /* private mode: source() still answers for this page */ }
  }

  function source(){
    try {
      var v = JSON.parse(localStorage.getItem(FIRST_KEY) || 'null');
      if(v && CLEAN_SRC.test(v.src)) return v.src;
    } catch(e){ /* fall through */ }
    return detectSource();
  }

  function withSource(data){
    var out = {};
    if(data && typeof data === 'object') for(var k in data) if(Object.prototype.hasOwnProperty.call(data, k)) out[k] = data[k];
    if(!out.src) out.src = source();
    return out;
  }


  /* ---- Sent as the page closes: a beacon, since a fetch would be cancelled. */
  function beacon(name, data){
    if(!enabled || optedOut() || doNotTrack() || automated() || !window.__levlAnalyticsMounted) return;
    var body;
    try {
      body = JSON.stringify({ type: 'event', payload: {
        website: WEBSITE_ID,
        hostname: location.hostname,
        screen: (window.screen ? screen.width + 'x' + screen.height : ''),
        language: navigator.language || '',
        title: encodeURIComponent(document.title || ''),
        url: encodeURI(location.pathname + location.search),
        referrer: '',
        name: name,
        data: withSource(data)
      } });
    } catch(e){ return; }
    try {
      if(navigator.sendBeacon && navigator.sendBeacon(HOST_URL + '/api/send', new Blob([body], { type: 'text/plain' }))) return;
    } catch(e){ /* fall through */ }
    try { fetch(HOST_URL + '/api/send', { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }); }
    catch(e){ /* the visit is over either way */ }
  }


  /* ---- Every answer as anonymous per-day tallies (track_answers), not Umami.
     Fed by LevlPremium.noteAnswer from every course's answer check. */
  var ANSWER_BATCH = 20;
  var answerBuf = {};
  var lastAnswerAt = Date.now();
  var QID = /^[A-Za-z0-9_.:-]{1,64}$/;
  var TOPIC = /^[A-Za-z0-9_.:-]{1,48}$/;

  // Answers checked together (one "Check answers" grades every part of a
  // problem) arrive within a moment of each other. Without this the first
  // part got all the time and the rest 0 seconds (2026-10-25 report), so the
  // time is shared evenly across the parts of one check.
  var BURST_MS = 1500;
  var burst = null;

  // secs: optional (an exam scored at once passes its average).
  function answer(course, qid, correct, topic, secs){
    if(exam && exam.course === course) exam.answered++;
    if(!enabled || optedOut() || automated()) return;
    qid = String(qid == null ? '' : qid);
    if(!QID.test(qid) || !/^[a-z]{2,8}$/.test(String(course))) return;
    var now = Date.now(), given = typeof secs === 'number' && isFinite(secs);
    var clamp = function(x){ return Math.min(900, Math.max(0, Math.round(x))); };
    var inBurst = !given && burst && burst.course === course && now - burst.last < BURST_MS;
    if(!given && !inBurst) secs = (now - lastAnswerAt) / 1000;
    secs = clamp(given || !inBurst ? secs : 0);
    lastAnswerAt = now;
    topic = String(topic || '').toLowerCase().replace(/[^a-z0-9.:]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
    var buf = answerBuf[course] || (answerBuf[course] = []);
    var item = { q: qid, c: correct ? 1 : 0, s: secs, t: TOPIC.test(topic) ? topic : '' };
    buf.push(item);
    if(given) burst = null;
    else if(inBurst){
      burst.items.push(item);
      burst.last = now;
      var share = burst.total / burst.items.length;
      burst.items.forEach(function(it){ it.s = clamp(share); });
    } else burst = { course: course, last: now, total: secs, items: [item] };
    if(buf.length >= ANSWER_BATCH){ flushAnswers(course); burst = null; }
  }

  function flushAnswers(only){
    var acct = window.StudyHubAccount;
    if(!acct || !acct.postRpc) return;
    for(var course in answerBuf){
      if(!Object.prototype.hasOwnProperty.call(answerBuf, course)) continue;
      if(only && course !== only) continue;
      var items = answerBuf[course];
      if(!items.length) continue;
      answerBuf[course] = [];
      try { acct.postRpc('track_answers', { p_course: course, p_items: items }); } catch(e){ /* best effort */ }
    }
  }


  /* ---- Exams left halfway: exam-quit with the question it stopped at. */
  var exam = null;
  // progress: optional count of answered questions (exams not checked one by one).
  function examStart(course, mode, total, progress){
    exam = { course: String(course || ''), mode: String(mode || ''), total: Number(total) || 0, answered: 0, at: Date.now(),
      progress: typeof progress === 'function' ? progress : null };
  }
  function examEnd(){ exam = null; }
  function examQuit(){
    if(exam && exam.progress){
      try { exam.answered = Math.max(exam.answered, Number(exam.progress()) || 0); } catch(err){ /* keep the count */ }
    }
    if(!exam || !exam.total || exam.answered >= exam.total) return;
    var e = exam;
    exam = null;
    beacon('exam-quit', {
      course: e.course,
      mode: e.mode,
      at: e.answered,
      of: e.total,
      pct: Math.round(100 * e.answered / e.total),
      mins: Math.round((Date.now() - e.at) / 60000)
    });
  }


  /* ---- Per page: reading depth, rage clicks, speed (assets/analytics-page.js,
     loaded after the page is idle so it never delays anything). The page
     closing also flushes answer tallies and reports an exam left halfway. */
  var pageWatched = false;
  function watchPage(){
    if(pageWatched || automated()) return;
    pageWatched = true;
    function closing(){
      flushAnswers();
      examQuit();
    }
    document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'hidden') closing(); });
    window.addEventListener('pagehide', closing);
    var load = function(){ if(window.LevlLazy) window.LevlLazy('analytics-page', function(P){ P.watch(); }); };
    if(window.requestIdleCallback) requestIdleCallback(load, { timeout: 4000 });
    else setTimeout(load, 2000);
  }

  /* ---- "How did you find LevlPrep?" ------------------------------------
     Once per browser, after a finished session, only when the save prompt is
     not showing (account.js promptToSave calls this when it stays quiet). */
  var HEARD_KEY = 'levlprep_heard';
  function askSource(){
    if(!enabled || optedOut() || automated() || !window.LevlLazy) return false;
    try { if(localStorage.getItem(HEARD_KEY)) return false; } catch(e){ return false; }
    if(document.getElementById('savePrompt') || document.getElementById('levlHeard')) return false;
    // The card itself (assets/heard-from.js) loads only now: at most once per browser.
    window.LevlLazy('heard-from', function(H){
      H.show(function(answerValue){
        try { localStorage.setItem(HEARD_KEY, answerValue); } catch(e){ /* asked again next time */ }
        event('heard-from', { answer: answerValue, course: courseOf(location.pathname) });
      });
    });
    return true;
  }


  function bucket(v, edges, labels){
    for(var i = 0; i < edges.length; i++) if(v < edges[i]) return labels[i];
    return labels[labels.length - 1];
  }

  // Exam date as weeks away; the date stays in the browser (exam-date.js).
  function examDateSet(course, days){
    var d = Number(days);
    if(!isFinite(d)) return;
    event('exam-date-set', {
      course: String(course || ''),
      weeks: bucket(d / 7, [1, 2, 4, 8, 16], ['<1', '1-2', '2-4', '4-8', '8-16', '16+'])
    });
  }


  window.LevlAnalytics = {
    event: event,
    /* Fires at most once per browser, ever. For "first question answered"
       and friends, where the second occurrence is not the same fact. */
    once: once,
    /* Whole seconds since this page started loading, or null where the
       browser has no performance clock. */
    secondsIn: secondsIn,
    mount: mount,
    /* The ref this page was opened with (null if none), and the video this
       browser was last sent by within 30 days (null if none). */
    landedRef: function(){ return landedRef; },
    attributedRef: attributedRef,
    enabled: enabled,
    optedOut: optedOut,
    /* Takes effect immediately for events, and from the next page load for
       pageviews: the Umami script, once appended, is in the page for as long
       as the page is. Opting out mid-visit therefore stops everything except
       the one pageview already sent, which is the honest promise to make. */
    setOptedOut: setOptedOut,
    /* First-touch channel for this browser ('tiktok', 'google', 'direct'...). */
    source: source,
    /* One answered question: course, question id, right or wrong, topic. */
    answer: answer,
    examStart: examStart,
    examEnd: examEnd,
    examDateSet: examDateSet,
    /* After a finished session when no other prompt is showing. */
    askSource: askSource,
    /* account.js, whenever a session is known. */
    signedIn: signedIn,
    _automated: automated,
    // For assets/analytics-page.js.
    _beacon: beacon,
    _courseOf: courseOf
  };
})();
