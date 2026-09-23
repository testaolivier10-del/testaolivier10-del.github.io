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
  var SCRIPT_URL = 'https://cloud.umami.is/script.js';
  var OPT_OUT_KEY = 'levlprep_analytics_opt_out';

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

    if(alreadySentToday) return; // nine pages in one evening is still one visit

    event('visit', {
      cohort: cohort(age, isFirst),
      day: age,          // days since first ever visit
      visits: v.days,    // distinct days studied, all time
      course: courseOf(location.pathname)
    });

    // The 1 -> 2 conversion, called out on its own because it is the number
    // worth moving and the one that gets lost inside a property filter.
    if(v.days === 2) event('returned-second-day', { day: age });
  }

  function courseOf(path){
    if(path.indexOf('/nremt') > -1) return 'nremt';
    if(path.indexOf('/ochem') > -1) return 'ochem';
    if(path.indexOf('/anatomy-physiology') > -1) return 'anp';
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

  function mount(){
    if(!enabled || optedOut() || window.__levlAnalyticsMounted) return;
    window.__levlAnalyticsMounted = true;
    var s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.defer = true;
    s.setAttribute('data-website-id', WEBSITE_ID);
    // Honor the browser's Do Not Track setting. The site's whole posture is
    // that the student's preference wins, and a visitor who has asked not to
    // be measured has asked clearly enough.
    s.setAttribute('data-do-not-track', 'true');
    s.addEventListener('load', flush);
    document.head.appendChild(s);

    // Queued, then flushed by the listener above once the script lands.
    trackVisit();
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
    enabled: enabled,
    optedOut: optedOut,
    /* Takes effect immediately for events, and from the next page load for
       pageviews: the Umami script, once appended, is in the page for as long
       as the page is. Opting out mid-visit therefore stops everything except
       the one pageview already sent, which is the honest promise to make. */
    setOptedOut: setOptedOut
  };
})();
