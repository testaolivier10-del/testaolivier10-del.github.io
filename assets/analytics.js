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
   quietly phones home would be the worst of both worlds. */
(function(){
  // From the Umami dashboard: Settings -> Websites -> the site -> "Website ID".
  var WEBSITE_ID = '';
  var SCRIPT_URL = 'https://cloud.umami.is/script.js';

  var enabled = !!WEBSITE_ID;

  /* Record a milestone. Deliberately not a general-purpose event firehose:
     Umami's free tier counts every event against a monthly total, and the
     difference between tracking milestones and tracking keystrokes is the
     difference between a few events per visit and a hundred. One 100-question
     exam should cost two events — started, finished — not a hundred.

     Safe to call whether or not analytics is configured, loaded, or blocked;
     a blocked script leaves window.umami undefined and this simply returns. */
  function event(name, data){
    if(!enabled) return;
    try {
      if(window.umami && typeof window.umami.track === 'function'){
        if(data) window.umami.track(name, data);
        else window.umami.track(name);
      }
    } catch(e){ /* analytics must never break a study session */ }
  }

  function mount(){
    if(!enabled || window.__levlAnalyticsMounted) return;
    window.__levlAnalyticsMounted = true;
    var s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.defer = true;
    s.setAttribute('data-website-id', WEBSITE_ID);
    // Honor the browser's Do Not Track setting. The site's whole posture is
    // that the student's preference wins, and a visitor who has asked not to
    // be measured has asked clearly enough.
    s.setAttribute('data-do-not-track', 'true');
    document.head.appendChild(s);
  }

  window.LevlAnalytics = { event: event, mount: mount, enabled: enabled };
})();
