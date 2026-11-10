/* Study reminders.

   The site has a real spaced-repetition scheduler. ochem/assets/mastery-engine.js
   computes a due date per concept; nremt/practice.html builds a due queue from
   the same idea; hub-progress.js keeps a streak, a freeze that bridges one
   missed day, and a goal that eases off after a bad week. Every bit of that
   machinery assumed the student CHOOSES to open the site.

   A scheduler that knows forty items are due today and has no way to say so is
   doing half its job. And the day somebody loses a twelve-day streak is very
   often the last day they open the site at all — the run was the reason to come
   back, and nothing was ever going to tell them it was about to end.

   WHAT THIS IS, AND WHAT IT DELIBERATELY IS NOT
   ---------------------------------------------
   It is one notification a day, at an hour the student picked, saying what is
   actually waiting. It is not engagement: there is no streak-panic at 11pm, no
   "we miss you", no second notification because the first was ignored. Three
   unanswered sends and it goes quiet until they come back on their own
   (MAX_UNANSWERED, in worker/src/reminders.js).

   THE BROWSER DECIDES EVERYTHING
   ------------------------------
   Whether to remind, when, and what the words say are all worked out here and
   written into one row. The server is a courier. That is not a shortcut — the
   due counts live in localStorage and never leave it, so a server that decided
   when to remind would first have to be told everything the student has ever
   answered. This way it is told a number and a sentence.

   WHEN IT ASKS
   ------------
   Never on a first visit, and never at the door. A notification permission
   prompt is the single most expensive thing a site can spend on a stranger:
   there is exactly one, a "no" is usually permanent, and most browsers will
   not let you ask twice. So it follows the same rules as the other two nudges
   on this site (see "Two nudges, one shape" in the README): a high point
   rather than an arrival, only when there is genuinely something to remind
   them about, at most three times ever, and silent for good after two
   refusals. The browser prompt itself only ever appears after the student has
   pressed a button that says what it is for.

   Tested in scripts/test/reminders.test.mjs. */
(function (window, document) {
  'use strict';

  /* The public half of the VAPID pair, from `node scripts/vapid-keys.mjs`.
     Public on purpose: the browser has to send it when subscribing, and the
     same value is in worker/wrangler.toml.

     Empty means reminders are off entirely — no prompt, no button, no request.
     Same rule as analytics.js: a half-configured feature that quietly does
     something is worse than one that does nothing. */
  var VAPID_PUBLIC_KEY = 'BJQrCo49iKi_sn7czvlq2nNFI1G_uy9IJSo_0KruVHaz3Iu9h7Nug8ay2JXbzlaiqFJuULZ1d1Y2Qqbzp_2Psfk';

  /* Where the service worker asks what to say when a push wakes it. Same
     Worker as the study assistant; empty means reminders stay off.

     Filled in, but reminders are still inert: configured() needs BOTH this and
     a VAPID key, and the key above is still blank. */
  var ENDPOINT = 'https://api.levlprep.com'; // site-config:API_URL

  var ENABLED_KEY = 'levlprep_reminders';        // { hour, subscribed }
  var STATE_KEY = 'levlprep_reminder_state';     // what is waiting, per course
  var ASK_KEY = 'levlprep_reminder_ask';         // { shown, refused, last }
  var VISITS_KEY = 'levlprep_visits';            // written by analytics.js

  var SCAN_KEY = 'levlprep_reminder_scan';       // when scanCourses() last rewrote the queued reminder
  var SIGNUP_KEY = 'levlprep_reminder_signup';   // { id, at, asked }: the one question after a new account

  // courses:begin REMINDER_COURSES key,name,path,storagePrefix (generated from assets/courses.js by scripts/build-courses.mjs; edit there)
  var REMINDER_COURSES = [
    { key: 'nremt', name: 'NREMT-EMT', path: '/nremt/', storagePrefix: 'nremt_' },
    { key: 'ochem', name: 'Organic Chemistry', path: '/ochem/', storagePrefix: 'ochem_' },
    { key: 'anp', name: 'Anatomy & Physiology', path: '/anatomy-physiology/', storagePrefix: 'anp_' },
    { key: 'apbio', name: 'AP® Biology', path: '/bio/', storagePrefix: 'apbio_' },
    { key: 'apchem', name: 'AP® Chemistry', path: '/chem/', storagePrefix: 'apchem_' },
    { key: 'apphys', name: 'AP® Physics 1', path: '/physics/', storagePrefix: 'apphys_' },
    { key: 'apcalc', name: 'AP® Calculus AB', path: '/calculus/', storagePrefix: 'apcalc_' },
    { key: 'apstat', name: 'AP® Statistics', path: '/statistics/', storagePrefix: 'apstat_' },
    { key: 'apenv', name: 'AP® Environmental Science', path: '/environmental-science/', storagePrefix: 'apenv_' },
    { key: 'appsych', name: 'AP® Psychology', path: '/psychology/', storagePrefix: 'appsych_' },
    { key: 'apprecalc', name: 'AP® Precalculus', path: '/precalculus/', storagePrefix: 'apprecalc_' },
    { key: 'apcalcbc', name: 'AP® Calculus BC', path: '/calculus-bc/', storagePrefix: 'apcalcbc_' },
    { key: 'apmacro', name: 'AP® Macroeconomics', path: '/macroeconomics/', storagePrefix: 'apmacro_' },
    { key: 'apmicro', name: 'AP® Microeconomics', path: '/microeconomics/', storagePrefix: 'apmicro_' },
  ];
  // courses:end

  /* NREMT and ochem report their own numbers. Every other course keeps one
     record per question in <storagePrefix>progress_v1 with the time it comes
     due, so scanCourses() reads them all (docs/reminders.md). */
  var SELF_REPORTING = { nremt: 1, ochem: 1 };

  var DEFAULT_HOUR = 19;      // early evening, when studying actually happens
  var MAX_ASKS = 3;
  var MAX_REFUSALS = 2;
  var ASK_GAP_DAYS = 7;

  function read(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  function configured() {
    return !!(VAPID_PUBLIC_KEY && ENDPOINT);
  }

  /* Push needs three things, and iOS only grew the last one in 16.4 — and only
     for a site added to the home screen. Everything below has to survive being
     run in a browser that has none of them. */
  function supported() {
    return !!(window.Notification && window.PushManager &&
              window.navigator && window.navigator.serviceWorker);
  }

  function settings() {
    var s = read(ENABLED_KEY, null);
    return {
      hour: s && typeof s.hour === 'number' ? s.hour : DEFAULT_HOUR,
      subscribed: !!(s && s.subscribed),
    };
  }

  /* ---- what is waiting ------------------------------------------------- */

  /* Courses call this when they know what a student has outstanding. Kept as a
     plain per-course record rather than one number so the sentence can name
     the course — "12 questions due in NREMT-EMT" is a reason to open the site
     and "you have items due" is not. */
  function report(course, data) {
    if (!course) return;
    var state = read(STATE_KEY, {});
    state[course] = {
      due: Math.max(0, Number(data && data.due) || 0),
      label: String((data && data.label) || course).slice(0, 40),
      url: String((data && data.url) || '/').slice(0, 120),
      at: Date.now(),
    };
    write(STATE_KEY, state);
    // Rescheduling on every report keeps the queued sentence true. A reminder
    // that says "12 due" to somebody who cleared them this morning is worse
    // than no reminder: it is a reason to distrust the next one.
    if (settings().subscribed) schedule();
    else if (emailSettings().on) enableEmail();
  }

  /* What will be waiting when the reminder arrives, in every such course:
     counted up to the next send time, since a question missed five minutes ago
     is due by then. Runs on every page; reschedules at most once, when a
     number changed or once a day (which also shows the student came back). */
  function scanCourses() {
    var state = read(STATE_KEY, {});
    var by = nextSendAt(settings().hour).getTime();
    var changed = false;
    REMINDER_COURSES.forEach(function (c) {
      if (SELF_REPORTING[c.key]) return;
      var d = read(c.storagePrefix + 'progress_v1', null);
      var had = state[c.key];
      if (!d || !d.q) { return; }
      var due = 0;
      Object.keys(d.q).forEach(function (k) {
        var r = d.q[k];
        if (r && r.due && r.due <= by) due++;
      });
      if (!had && !due) return;              // never studied, or nothing coming: no record to keep
      if (!had || had.due !== due) changed = true;
      state[c.key] = { due: due, label: String(c.name).slice(0, 40), url: c.path + 'review.html', at: Date.now() };
    });
    write(STATE_KEY, state);

    var on = settings().subscribed || emailSettings().on;
    if (!on) return changed;
    var last = Number(read(SCAN_KEY, 0)) || 0;
    if (changed || Date.now() - last > 20 * 3600000) {
      write(SCAN_KEY, Date.now());
      if (settings().subscribed) schedule();
      else enableEmail();
    }
    return changed;
  }

  /* A record older than a week is about a course this browser has not opened in
     a week. It is not evidence of anything current, and letting it into the
     sentence is how a reminder ends up quoting a number from last month. */
  function currentState() {
    var state = read(STATE_KEY, {});
    var fresh = {};
    var cutoff = Date.now() - 7 * 86400000;
    Object.keys(state).forEach(function (k) {
      if (state[k] && state[k].at > cutoff && state[k].due > 0) fresh[k] = state[k];
    });
    return fresh;
  }

  /* The notification's words, and where it goes. Built from what is actually
     waiting rather than from a template with a number dropped in, because the
     two-course case and the nothing-due case are genuinely different messages
     and a template covering all three says nothing in particular. */
  function compose() {
    var state = currentState();
    var courses = Object.keys(state).sort(function (a, b) { return state[b].due - state[a].due; });

    if (!courses.length) {
      // Nothing due is not nothing to say: the streak is the other thing worth
      // protecting, and it is the one with a deadline.
      var streak = streakDays();
      if (streak >= 3) {
        return {
          title: 'Keep your ' + streak + '-day streak',
          body: 'A few minutes today is enough to hold it.',
          url: '/',
        };
      }
      return null;   // nothing waiting and no run to protect: say nothing
    }

    var top = state[courses[0]];
    if (courses.length === 1) {
      return {
        title: top.due + (top.due === 1 ? ' question' : ' questions') + ' due',
        body: top.label + ' — ready when you are.',
        url: top.url,
      };
    }
    var total = courses.reduce(function (n, k) { return n + state[k].due; }, 0);
    return {
      title: total + ' due for review',
      body: courses.map(function (k) { return state[k].due + ' in ' + state[k].label; }).join(', ') + '.',
      url: '/',
    };
  }

  function streakDays() {
    try {
      if (window.HubProgress && window.HubProgress.streak) {
        var s = window.HubProgress.streak();
        return (s && s.current) || 0;
      }
    } catch (e) { /* the engine is not on this page */ }
    return 0;
  }

  /* The next occurrence of the chosen hour, in the student's own local time.
     Computed here and stored as an absolute instant, so the server never needs
     to know a time zone — which is also why the cron runs every fifteen
     minutes rather than once a day. */
  function nextSendAt(hour) {
    var d = new Date();
    d.setHours(hour, 0, 0, 0);
    // Past that hour already, or within the next few minutes: tomorrow. The
    // few-minutes guard stops somebody who studies at 18:58 getting a reminder
    // at 19:00 about the session they are still in.
    if (d.getTime() <= Date.now() + 10 * 60 * 1000) d.setDate(d.getDate() + 1);
    return d;
  }

  /* ---- subscribing ----------------------------------------------------- */

  function urlBase64ToUint8Array(base64) {
    var padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
      .replace(/-/g, '+').replace(/_/g, '/');
    var raw = window.atob(padded);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function getSubscription() {
    if (!supported()) return Promise.resolve(null);
    return window.navigator.serviceWorker.ready.then(function (reg) {
      return reg.pushManager.getSubscription();
    }).catch(function () { return null; });
  }

  /* Ask the browser, then the push service, then write the row. Returns a
     reason on failure rather than a boolean, because "you said no" and "your
     browser cannot do this" need different sentences and the caller is the
     only thing that can put them on screen. */
  function enable(hour) {
    if (!configured()) return Promise.resolve({ ok: false, reason: 'unconfigured' });
    if (!supported()) return Promise.resolve({ ok: false, reason: 'unsupported' });

    return window.Notification.requestPermission().then(function (permission) {
      if (permission !== 'granted') {
        // Denied is usually permanent and cannot be asked again from script.
        // Record it so nothing here ever asks a second time.
        var ask = read(ASK_KEY, {});
        ask.denied = true;
        write(ASK_KEY, ask);
        return { ok: false, reason: permission === 'denied' ? 'denied' : 'dismissed' };
      }
      return window.navigator.serviceWorker.ready.then(function (reg) {
        return reg.pushManager.subscribe({
          // Required, and required to be true: a browser will not issue a
          // subscription that might be used for anything the user does not see.
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }).then(function (sub) {
        write(ENABLED_KEY, { hour: typeof hour === 'number' ? hour : DEFAULT_HOUR, subscribed: true, email: false });
        // Push wins: it is immediate, it costs nothing to send, and it does not
        // sit in an inbox. Somebody who has both on would get the same sentence
        // twice, which is the fastest way to make both channels unwelcome.
        if (emailSettings().on) disableEmail();
        return schedule(sub).then(function (saved) {
          if (!saved) {
            describe('the subscription was created but save_push_subscription ' +
                     'did not accept it — check that scripts/sql/schema.sql has been ' +
                     'run, and that PostgREST has reloaded its schema cache');
            // The subscription exists in the browser but we could not record
            // it, so nothing will ever be sent to it. Undo, rather than leave
            // a switch that says on and does nothing.
            return sub.unsubscribe().then(function () {
              write(ENABLED_KEY, { hour: DEFAULT_HOUR, subscribed: false });
              return { ok: false, reason: 'offline' };
            }, function () { return { ok: false, reason: 'offline' }; });
          }
          if (window.LevlAnalytics) window.LevlAnalytics.event('reminders-enabled');
          return { ok: true };
        });
      }).catch(function (err) {
        return { ok: false, reason: 'failed', error: describe(err) };
      });
    }).catch(function (err) {
      return { ok: false, reason: 'failed', error: describe(err) };
    });
  }

  /* The reader gets "that did not work"; whoever has to fix it gets the cause.

     Every failure path here used to swallow its error, which made the one
     message on screen the only record that anything had happened — and that
     message is deliberately vague, because a student cannot act on
     "AbortError: Registration failed - push service error". Logged rather than
     shown, and console.warn rather than console.error so it is not mistaken
     for a page that crashed. */
  function describe(err) {
    var text = err && (err.name ? err.name + ': ' + err.message : String(err));
    try {
      window.console.warn('[LevlReminders] could not enable reminders —', text || err);
    } catch (e) { /* no console */ }
    return text || 'unknown';
  }

  function disable() {
    write(ENABLED_KEY, { hour: settings().hour, subscribed: false });
    if (window.LevlAnalytics) window.LevlAnalytics.event('reminders-disabled');
    return getSubscription().then(function (sub) {
      if (!sub) return true;
      var endpoint = sub.endpoint;
      return sub.unsubscribe().then(function () {
        // Delete the row too. A switch that leaves the endpoint sitting in a
        // table is not the switch the person thought they were pressing.
        var account = window.StudyHubAccount;
        if (account && account.rpc) account.rpc('delete_push_subscription', { p_endpoint: endpoint });
        return true;
      });
    }).catch(function () { return false; });
  }

  /* Write (or rewrite) the queued reminder. Called whenever what is waiting
     changes, which is the only thing that keeps the sentence honest.

     Resolves false when nothing was written, so enable() can tell the
     difference between "subscribed" and "subscribed and will actually hear
     from us". */
  function schedule(existingSub) {
    if (!configured() || !settings().subscribed) return Promise.resolve(false);

    var p = existingSub ? Promise.resolve(existingSub) : getSubscription();
    return p.then(function (sub) {
      if (!sub) return false;
      var account = window.StudyHubAccount;
      if (!account || !account.rpc) return false;

      var text = compose();
      var json = sub.toJSON ? sub.toJSON() : null;
      var keys = (json && json.keys) || {};
      if (!keys.p256dh || !keys.auth) return false;

      // The email row carries the same sentence, so it is rewritten here too —
      // otherwise a student with both channels gets a fresh push and a
      // week-old email saying different numbers.
      if (emailSettings().on) enableEmail();

      return account.rpc('save_push_subscription', {
        p_endpoint: sub.endpoint,
        p_p256dh: keys.p256dh,
        p_auth: keys.auth,
        // No text means nothing is waiting and no streak is at risk. Clearing
        // the time is how this says "do not send anything" — rather than
        // sending something empty, which is how a study app teaches people to
        // ignore it.
        p_next_send_at: text ? nextSendAt(settings().hour).toISOString() : null,
        p_title: text ? text.title : '',
        p_body: text ? text.body : '',
        p_url: text ? text.url : '/',
      });
    }).catch(function () { return false; });
  }

  /* ---- asking ---------------------------------------------------------- */

  function visits() {
    var v = read(VISITS_KEY, null);
    return (v && Number(v.days)) || 0;
  }

  /* Which channel can be offered: push where the browser can; where it cannot
     (most iPhones) or it is blocked, email for a signed-in student; else null,
     because the site does not ask a visitor for an address. */
  function channel() {
    if (!configured()) return null;
    if (settings().subscribed || emailSettings().on) return null;
    var ask = read(ASK_KEY, {});
    var push = supported() && window.Notification.permission === 'default' && !ask.denied;
    if (push) return 'push';
    return emailAvailable() ? 'email' : null;
  }

  /* Every reason not to ask, in one place. Permission is the scarcest thing
     this site can spend and there is exactly one of it.

     opts.earned: a real session was just finished, the only thing that lets a
     first visit be asked (most students come once; owner 2026-11-10). The
     browser's own prompt still appears only after they press the button. */
  function mayAsk(opts) {
    if (!channel()) return false;

    var ask = read(ASK_KEY, {});
    if ((ask.refused || 0) >= MAX_REFUSALS) return false;
    if ((ask.shown || 0) >= MAX_ASKS) return false;
    if (ask.last && Date.now() - ask.last < ASK_GAP_DAYS * 86400000) return false;

    // Never a stranger. analytics.js keeps the visit history this reads.
    if (visits() < 2 && !(opts && opts.earned)) return false;

    // And never when there is nothing to remind them about — an offer to be
    // told about work that does not exist is just a permission prompt.
    return !!compose();
  }

  /* The offer. Same shape as the other two things on this site that ask the
     student for anything (.levl-prompt in theme.css), and only one of those is
     ever in the DOM at once. */
  function offer(context, opts) {
    scanCourses();
    if (!mayAsk(opts)) return false;
    if (document.querySelector('.levl-prompt')) return false;   // save/install is showing

    var ask = read(ASK_KEY, {});
    ask.shown = (ask.shown || 0) + 1;
    ask.last = Date.now();
    write(ASK_KEY, ask);

    return prompt(channel(), context || 'session', true);
  }

  /* Draws the question. counts: whether "No thanks" spends a refusal. */
  function prompt(via, context, counts) {
    var email = via === 'email';
    var el = document.createElement('div');
    el.className = 'levl-prompt';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Study reminders');
    // The markup the other two nudges use, class for class.
    var yes = email ? 'Email me' : 'Remind me';
    el.innerHTML =
      '<div class="levl-prompt__text">' +
        '<b>' + (email ? 'An email when something is due?' : 'A nudge when something is due?') + '</b>' +
        '<small>' + (email ? 'One email a day at most' : 'One notification a day at ' + hourLabel(DEFAULT_HOUR)) +
        ', only when you have work waiting. It stops on its own if you stop studying.</small>' +
      '</div>' +
      '<div class="levl-prompt__actions">' +
        '<button type="button" class="levl-prompt__yes" data-act="yes">' + yes + '</button>' +
        '<button type="button" class="levl-prompt__no" data-act="no">No thanks</button>' +
      '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });

    var settled = false;
    function close(refused) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (refused && counts) {
        var a = read(ASK_KEY, {});
        a.refused = (a.refused || 0) + 1;
        write(ASK_KEY, a);
      }
      el.classList.remove('show');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    }

    el.querySelector('[data-act="no"]').addEventListener('click', function () { close(true); });
    el.querySelector('[data-act="yes"]').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      btn.textContent = 'Just a moment…';
      (email ? enableEmail(DEFAULT_HOUR) : enable(DEFAULT_HOUR)).then(function (res) {
        if (res.ok) {
          btn.textContent = email ? 'Done. Check your inbox when work is due' : 'Done — see you at ' + hourLabel(DEFAULT_HOUR);
          setTimeout(function () { close(false); }, 2200);
        } else {
          // Never close on a failure as though it worked.
          btn.disabled = false;
          btn.textContent = yes;
          var span = el.querySelector('.levl-prompt__text small');
          span.textContent = res.reason === 'denied'
            ? 'Your browser has blocked notifications for this site. You can turn them back on in its site settings.'
            : res.reason === 'unsupported'
              ? 'This browser cannot do reminders. On an iPhone, add the site to your home screen first.'
              : res.reason === 'signed-out'
                ? 'Sign in first, then turn reminders on from your account.'
                : 'That did not work just now — try again in a moment.';
        }
      });
    });

    // Withdraws itself rather than sitting there. Not counted as a refusal:
    // ignoring something that appeared mid-sentence is not an answer.
    var timer = setTimeout(function () { close(false); }, 20000);

    if (window.LevlAnalytics) window.LevlAnalytics.event('reminder-prompt-shown', { at: context, via: email ? 'email' : 'push' });
    return true;
  }

  /* ---- the one question after a new account ---------------------------- */

  /* Asked once per account, about email, outside the three asks above. A new
     account is often made on the way to paying, and nothing may land on top
     of a payment: the question waits until no dialog is open, on this page or
     a later one, for up to two days (docs/reminders.md). */
  var SIGNUP_FRESH_MS = 15 * 60000, SIGNUP_KEEP_MS = 2 * 86400000;

  function busy() {
    return !!document.querySelector('.levl-prompt, .auth-modal-overlay.open, iframe[src*="polar.sh"], .polar-loader-spinner');
  }

  function noteAccount(user) {
    if (!user || !user.id) return;
    var p = read(SIGNUP_KEY, null);
    if (p && p.id === user.id) return;                 // already noted (and maybe asked)
    var made = Date.parse(user.created_at || '') || 0;
    if (!made || Date.now() - made > SIGNUP_FRESH_MS) return;   // an old account signing in
    write(SIGNUP_KEY, { id: user.id, at: Date.now(), asked: false });
  }

  function askAfterSignup(tries) {
    var p = read(SIGNUP_KEY, null);
    var account = window.StudyHubAccount;
    var user = account && account.user && account.user();
    if (!p || p.asked || !user || user.id !== p.id) return false;
    if (Date.now() - p.at > SIGNUP_KEEP_MS) { p.asked = true; write(SIGNUP_KEY, p); return false; }
    if (!configured() || settings().subscribed || emailSettings().on) { p.asked = true; write(SIGNUP_KEY, p); return false; }
    if (busy()) {
      if ((tries || 0) < 6) setTimeout(function () { askAfterSignup((tries || 0) + 1); }, 5000);
      return false;                                     // still pending: the next page tries again
    }
    p.asked = true;
    write(SIGNUP_KEY, p);
    // Starts the one week gap; does not count toward the three.
    var ask = read(ASK_KEY, {});
    ask.last = Date.now();
    write(ASK_KEY, ask);
    return prompt('email', 'signup', false);
  }

  function hourLabel(h) {
    var suffix = h >= 12 ? 'pm' : 'am';
    var display = h % 12 === 0 ? 12 : h % 12;
    return display + suffix;
  }

  /* ---- email, for browsers that cannot do push ------------------------- */

  /* iOS Safari only allows notifications for a site added to the home screen,
     which is a large share of the people this site is for. Email reaches them.

     Signed in only, because we have no other way to know an address and asking
     for one would turn a free tool into a mailing list with a study app
     attached. And never alongside push: somebody with both on would get the
     same sentence twice, so enabling one turns the other off. */
  function emailAvailable() {
    var account = window.StudyHubAccount;
    return !!(account && account.user && account.user());
  }

  function emailSettings() {
    var s = read(ENABLED_KEY, null);
    return { on: !!(s && s.email) };
  }

  function enableEmail(hour) {
    if (!emailAvailable()) return Promise.resolve({ ok: false, reason: 'signed-out' });
    var account = window.StudyHubAccount;
    var text = compose();
    var when = settings().hour;
    if (typeof hour === 'number') when = hour;

    return account.rpc('save_email_reminder', {
      p_next_send_at: text ? nextSendAt(when).toISOString() : null,
      p_title: text ? text.title : '',
      p_body: text ? text.body : '',
      p_url: text ? text.url : '/',
    }).then(function (ok) {
      if (!ok) return { ok: false, reason: 'failed' };
      write(ENABLED_KEY, { hour: when, subscribed: settings().subscribed, email: true });
      if (window.LevlAnalytics) window.LevlAnalytics.event('reminders-enabled', { via: 'email' });
      return { ok: true };
    });
  }

  function disableEmail() {
    var account = window.StudyHubAccount;
    write(ENABLED_KEY, { hour: settings().hour, subscribed: settings().subscribed, email: false });
    if (!account || !account.rpc) return Promise.resolve(true);
    return account.rpc('delete_email_reminder').then(function () { return true; });
  }

  window.LevlReminders = {
    configured: configured,
    supported: supported,
    emailAvailable: emailAvailable,
    emailSettings: emailSettings,
    enableEmail: enableEmail,
    disableEmail: disableEmail,
    settings: settings,
    report: report,
    enable: enable,
    disable: disable,
    schedule: schedule,
    offer: offer,
    compose: compose,
    scanCourses: scanCourses,
    /* Exported for scripts/test/reminders.test.mjs — the asking rules and the
       composed sentence are the whole product here, and both fail silently:
       a rule that is too loose burns a permission that cannot be asked for
       again, and a sentence quoting a stale number teaches people to ignore
       the next one. */
    _mayAsk: mayAsk,
    _channel: channel,
    _noteAccount: noteAccount,
    _askAfterSignup: askAfterSignup,
    _setCourses: function (list) { REMINDER_COURSES = list; },
    _nextSendAt: nextSendAt,
    _setKeys: function (vapid, endpoint) { VAPID_PUBLIC_KEY = vapid; ENDPOINT = endpoint; },
  };

  /* On every page: keep the numbers true and watch for a new account. */
  function boot() {
    try { scanCourses(); } catch (e) { /* a malformed record must not stop the page */ }
    var account = window.StudyHubAccount;
    if (account && account.onAuthChange) {
      account.onAuthChange(function (user) {
        if (!user) return;
        noteAccount(user);
        setTimeout(function () { askAfterSignup(0); }, 3500);
      });
    }
  }
  if (document.readyState === 'complete') setTimeout(boot, 0);
  else window.addEventListener('load', function () { setTimeout(boot, 0); });
})(window, document);
