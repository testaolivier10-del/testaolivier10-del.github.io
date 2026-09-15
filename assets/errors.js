/* Tells us when a page breaks.

   183 HTML pages of hand-written vanilla JS, no bundler and no framework —
   which is the point of the stack, and also means nothing checks that a page
   still runs before it ships. A typo in one lesson's bootstrap renders an
   inert page: the text is there, the buttons do nothing, no error is visible
   to the reader, and nobody finds out. The student assumes the site is broken
   and leaves, which is exactly the population least likely to email about it.

   So: an uncaught error or a rejected promise gets reported once, to our own
   Supabase, through the same `security definer` RPC shape as the page counter.

   WHAT IS SENT, AND WHY THAT AND NOTHING ELSE
   -------------------------------------------
   The path, the error message, the file/line/column, the first few stack
   frames, and the browser's user-agent string. That is what makes an error
   reproducible.

   Not sent: any storage value, any answer, any question, any email, any user
   or session id, any referrer. The report cannot be tied back to a person and
   is not meant to be. An error MESSAGE can in principle quote something the
   browser was chewing on ("Unexpected token } in JSON at position 41"), which
   is why messages are truncated and why privacy.html names this file. If a
   message ever turns out to carry something it should not, the fix is here,
   not in the policy.

   RULES IT FOLLOWS
   ----------------
   - Silent to the reader. A page that is half-broken should not also grow an
     error box; that is a decision for the page, not for a reporter.
   - Opt-out aware. It goes through the same per-browser switch on privacy.html
     that turns off analytics, checked BEFORE anything is sent rather than
     discarded at the far end.
   - Capped, hard, at 5 reports per page load, and deduplicated within a load.
     One error inside a requestAnimationFrame loop is sixty errors a second,
     and a reporter that faithfully forwards all of them is a self-inflicted
     denial of service against our own database.
   - Never throws. Everything below is inside a try, including the parts that
     look like they cannot fail, because a reporter that can throw turns one
     broken page into a broken page plus an infinite loop.

   LOADED FIRST, DELIBERATELY
   --------------------------
   It sits immediately above assets/account.js in every page's head, which
   makes it the first deferred script on the page and so the first thing that
   runs. That position is the whole value: the errors most worth hearing about
   are the ones that stop a page working at all, and those are thrown by page
   bootstraps at DOMContentLoaded — after the deferred scripts, but before
   anything mounted asynchronously by site-chrome.js could have registered a
   listener. A reporter that arrives late reports only the failures that were
   not fatal. check-site.mjs fails if a page loads account.js without it. */
(function (window, document) {
  'use strict';

  var MAX_PER_LOAD = 5;
  var MAX_MESSAGE = 300;
  var MAX_STACK = 600;
  var OPT_OUT_KEY = 'levlprep_analytics_opt_out';

  var sent = 0;
  var seen = {};
  var queue = [];

  function optedOut() {
    try {
      // window.localStorage, not the bare global: this file takes window as a
      // parameter and reaches everything else through it, and in a private
      // window or with site data blocked the ACCESS itself throws rather than
      // returning null.
      return window.localStorage.getItem(OPT_OUT_KEY) === '1';
    } catch (e) {
      // A browser that will not hand over localStorage is one we cannot ask
      // for consent, so assume the answer is no.
      return true;
    }
  }

  /* Strip the origin off frame URLs, so a stack reads as the site's own file
     list rather than 600 characters of repeated hostname, and keep only the
     first few frames — the top of a stack is where the bug is. */
  function tidyStack(stack) {
    if (typeof stack !== 'string') return '';
    var origin = '';
    try { origin = window.location.origin; } catch (e) { /* ignore */ }
    return stack
      .split('\n')
      .slice(0, 6)
      .map(function (line) {
        var out = String(line).trim();
        if (origin) out = out.split(origin).join('');
        return out;
      })
      .join('\n')
      .slice(0, MAX_STACK);
  }

  function report(message, source, line, column, stack) {
    try {
      if (sent >= MAX_PER_LOAD || optedOut()) return;

      var msg = String(message || '').slice(0, MAX_MESSAGE);
      if (!msg) return;

      // A cross-origin script reports as a bare "Script error." with no file,
      // no line and no stack. There is nothing in it to act on and it is
      // usually an extension or a blocked CDN rather than this site, so it is
      // noise that would drown the reports that are real.
      if (/^script error\.?$/i.test(msg)) return;

      var where = String(source || '');
      try { where = where.split(window.location.origin).join(''); } catch (e) { /* ignore */ }

      var key = msg + '@' + where + ':' + line;
      if (seen[key]) return;
      seen[key] = true;
      sent++;

      queue.push({
        p_path: String(window.location.pathname).slice(0, 200),
        p_message: msg,
        p_source: where.slice(0, 200),
        p_line: typeof line === 'number' ? line : null,
        p_column: typeof column === 'number' ? column : null,
        p_stack: tidyStack(stack),
        // Coarse and already public in every request header. A layout bug that
        // only exists in one browser is invisible without it.
        p_agent: String(window.navigator && window.navigator.userAgent || '').slice(0, 200),
      });
      flush();
    } catch (e) {
      /* A reporter that throws makes a bad page worse. */
    }
  }

  /* Reports are queued before they are sent, because this file runs BEFORE
     account.js — which is the point of where it sits, and means the thing that
     does the sending does not exist yet at the moment the earliest and most
     interesting errors are thrown. Without the queue, being early would cost
     exactly the reports being early was for.

     The queue is bounded by MAX_PER_LOAD above it, so it cannot grow. */
  function flush() {
    var account = window.StudyHubAccount;
    if (!account || !account.rpc || !queue.length) return;
    var pending = queue.splice(0, queue.length);
    for (var i = 0; i < pending.length; i++) account.rpc('report_client_error', pending[i]);
  }

  function mount() {
    if (window.__levlErrorsMounted) return;
    window.__levlErrorsMounted = true;

    // addEventListener rather than assigning window.onerror, so this cannot
    // quietly replace a handler a page set for itself — or be replaced by one.
    window.addEventListener('error', function (event) {
      try {
        // Also fires for a failed <img>/<script>/<link>, which is a load
        // failure rather than a thrown error: no message, and a target that is
        // an element. Those are reported by the resource path instead, since a
        // module that 404s is exactly the kind of break worth hearing about.
        if (event && event.target && event.target !== window && event.target.tagName) {
          var src = event.target.src || event.target.href || '';
          if (!src) return;
          // Same-origin only. A blocked third party is the normal condition of
          // the web, not a bug in this site: an ad blocker stops Umami and the
          // Supabase CDN on a large share of visits, and reporting each one
          // would bury the reports that are ours under noise we already expect
          // and have already designed around. One of our own files failing to
          // load is the opposite — it means a page just lost a module.
          if (src.indexOf('/') !== 0 && src.indexOf(window.location.origin) !== 0) return;
          report('Failed to load ' + event.target.tagName.toLowerCase(), src, null, null, '');
          return;
        }
        report(
          event && (event.message || (event.error && event.error.message)),
          event && event.filename,
          event && event.lineno,
          event && event.colno,
          event && event.error && event.error.stack
        );
      } catch (e) { /* see above */ }
    }, true); // capture, because a resource error does not bubble

    window.addEventListener('unhandledrejection', function (event) {
      try {
        var reason = event && event.reason;
        var msg = reason && reason.message ? reason.message : String(reason);
        report('Unhandled rejection: ' + msg, '', null, null, reason && reason.stack);
      } catch (e) { /* see above */ }
    });

    // account.js starts on DOMContentLoaded and its Supabase client arrives
    // some time after that, so anything queued before then needs a second
    // chance that is not tied to another error being thrown.
    window.addEventListener('load', function () {
      try { flush(); setTimeout(flush, 4000); } catch (e) { /* see above */ }
    });
  }

  window.LevlErrors = {
    mount: mount,
    /* Exported for scripts/test/errors.test.mjs. The throttle, the dedupe, the
       opt-out and the queue are the whole behaviour, and every one of them
       fails silently — a broken cap floods the database, a broken queue
       reports nothing at all, and neither says a word either way. */
    report: report,
    flush: flush,
    _pending: function () { return queue.slice(); },
    _reset: function () { sent = 0; seen = {}; queue.length = 0; },
    _sent: function () { return sent; },
  };

  // At parse time, not on DOMContentLoaded: everything this exists to catch
  // happens after this line and before that event.
  mount();
})(window, document);
