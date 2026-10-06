/* Drives review.html — the spaced repetition queue.

   Review and Practice both ask questions, but they are not the same product,
   and the difference is completability. Practice never ends: the adaptive
   engine always has another question, which is right for learning and wrong
   for a daily habit, because there is no moment where you are done. Review
   has a queue that drains to zero. Open it, clear it, close it.

   That gives it four rules Practice deliberately does not have:

     1. Nothing new. Only concepts already met (attempts > 0). Practice probes
        unseen concepts to find your level; Review exists purely for
        retention, so anything unfamiliar here would mean the queue is wrong.
     2. Ordered by overdueness, not weakness. Practice asks what teaches the
        most; Review asks what is closest to being forgotten.
     3. Difficulty holds. A review question is served at the highest tier the
        student has answered correctly on that concept and no higher
        (mastery.reachedTier). Review checks that something still holds; it
        does not promote.
     4. Capped per day, leeches removed. See mastery-engine.js for why.

   The question loop is session-runner.js, shared with Practice, so the two
   pages cannot drift in how an answer is graded or written to mastery. What
   this file owns is the queue, the stopping condition, and the ending —
   "queue cleared", which is the thing worth coming back for.

   Kept out of an inline <script> for the same reason as the other page
   scripts: the CI checker scans .html files for literal href/src paths. */
(function(){
  var M  = window.OchemMastery;
  var CO = window.OchemConcepts;
  var E  = window.OchemQuestionEngine;

  var homeEl    = document.getElementById('reviewBody');
  var heroEl    = document.getElementById('reviewHero');
  var sessionEl = document.getElementById('reviewSession');
  var doneEl    = document.getElementById('reviewDone');
  var cardEl    = document.getElementById('reviewCard');
  var progFill  = document.getElementById('reviewProgFill');
  var progLabel = document.getElementById('reviewProgLabel');
  var modeLabel = document.getElementById('reviewMode');
  var quitBtn   = document.getElementById('reviewQuit');
  if(!homeEl) return;

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function pct(x){ return Math.round((x || 0) * 100); }
  function fillClass(s){ return s < 0.45 ? 'low' : s < 0.70 ? 'mid' : s < 0.88 ? '' : 'high'; }
  function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }

  function show(view){
    homeEl.hidden    = view !== 'home';
    sessionEl.hidden = view !== 'session';
    doneEl.hidden    = view !== 'done';
    if(heroEl) heroEl.hidden = view !== 'home';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function conceptRows(profiles, whenLabel, opts){
    opts = opts || {};
    return profiles.map(function(p){
      var s = p.strength === null ? 0 : p.strength;
      return '<div class="concept-row">' +
        '<span class="name">' + esc(p.concept.title) +
          '<small>' + esc(p.band.label + ' · ' + p.correct + '/' + p.attempts + ' · ' + whenLabel(p)) + '</small></span>' +
        '<span class="track"><span class="fill ' + fillClass(s) + '" style="width:' + pct(s) + '%"></span></span>' +
        '<span class="pct">' + pct(s) + '%</span>' +
        (opts.lesson && CO.lessonTopicFor(p.id)
          ? '<a class="drill" href="' + CO.lessonTopicFor(p.id).href + '">Relearn</a>' : '') +
      '</div>';
    }).join('');
  }

  function overdueLabel(p){
    var over = p.dueIn === null ? 0 : -p.dueIn;
    return over >= 1 ? plural(over, 'day') + ' overdue' : 'due today';
  }
  function upcomingLabel(p){
    // A concept missed just now has had its interval reset to zero and is
    // scheduled minutes out, not tomorrow — rounding that to "back tomorrow"
    // would contradict the summary line right above it.
    if(p.interval === 0) return 'reset — back soon';
    return p.dueIn <= 1 ? 'back tomorrow' : 'back in ' + plural(p.dueIn, 'day');
  }

  /* ---- the session ----------------------------------------------------

     The queue is fixed when the session starts, so the bar can count down
     against a number that does not move under the student. A missed concept
     is not re-queued into the same session — the mastery engine has already
     reset its interval, so it comes back on a later day, which is the point
     of spacing rather than cramming. */

  var queue = null;   // concept ids still to ask
  var total = 0;

  var runner = window.OchemSessionRunner({
    els: { card: cardEl, progFill: progFill, progLabel: progLabel, modeLabel: modeLabel },
    limitSource: 'review',
    next: function(S){
      while(queue.length){
        var conceptId = queue.shift();
        // Ceiling is snapshotted at session start, not read live: answering
        // correctly during the session would otherwise raise reachedTier and
        // let the difficulty climb mid-queue, which is the promotion Review
        // is specifically not supposed to do.
        var q = E.reviewQuestion(conceptId, S.meta.ceiling[conceptId] || 1, S.askedIds, S.recentTopics);
        if(q){ S.meta.conceptFor[q.id] = conceptId; return q; }
        // No usable question for that concept; drop it and take the next.
      }
      return null;
    },
    progress: function(S){
      var left = queue.length + 1;
      return {
        pct: Math.round(((total - left) / total) * 100),
        label: left === 1 ? 'Last one' : left + ' left in queue'
      };
    },
    // A miss during review still earns the "now apply the correction"
    // follow-up — the teaching is the same, and it does not lengthen the
    // queue, which stays at whatever it was.
    checkFor: function(d, q, S){
      return E.checkQuestion(d.conceptId, q.tier || 2, S.askedIds, q.kind, q.topic);
    },
    nextLabel: function(S){
      return S.isCheck ? 'Continue' : (queue.length ? 'Next' : 'Finish');
    },
    onAnswer: function(q, d, S){
      // Only the scheduled questions count against the daily budget; the
      // remediation checks are teaching, not extra workload.
      if(!S.isCheck) M.noteReview();
    },
    onFinish: renderDone
  });

  function startSession(){
    var q = E.reviewQueue();
    if(!q.today.length){ render(); return; }
    queue = q.today.map(function(p){ return p.id; });
    total = queue.length;
    var ceiling = {};
    queue.forEach(function(id){ ceiling[id] = M.reachedTier(id); });
    show('session');
    runner.start({ title: 'Spaced review', meta: { conceptFor: {}, ceiling: ceiling, deferred: q.deferred } });
  }

  function renderDone(S){
    M.recordSession({
      mode: 'review', asked: S.asked, correct: S.correct,
      concepts: Object.keys(S.conceptsTouched)
    });

    // Same closing flourish Practice ends on, pitched to how the run went.
    if(window.LevlSound) window.LevlSound.flourish(S.asked ? S.correct / S.asked : 0);

    var cleared = queue.length === 0;
    var touched = Object.keys(S.conceptsTouched).map(M.profile)
      .filter(function(p){ return p.attempts > 0; });
    var missed = touched.filter(function(p){ return p.isDue || p.interval === 0; });
    var next = M.allProfiles().filter(function(p){ return p.attempts > 0 && p.due && !p.isDue; })
      .sort(function(a, b){ return a.due - b.due; })[0];
    var stillDue = E.reviewQueue();

    // What the session just earned, rendered by the game layer so Practice
    // and Review report it identically.
    var xpHtml = window.OchemXP ? window.OchemXP.summaryHtml() : '';

    var html = xpHtml + '<div class="rec-card">' +
      '<div class="k">' + (cleared ? 'Queue cleared' : 'Session ended') + '</div>' +
      '<h2>' + esc(cleared
        ? (S.correct === S.asked ? 'Cleared, and you got everything right.' : 'That\'s today\'s queue done.')
        : 'Stopped early — the rest is still queued.') + '</h2>' +
      '<p>' + esc(S.correct + ' of ' + S.asked + ' correct across ' + plural(touched.length, 'concept') + '. ') +
      esc(missed.length
        ? plural(missed.length, 'concept') + ' reset and will come back soon; the rest moved further out.'
        : 'Every interval moved further out.') + '</p>';

    var lines = [];
    if(S.meta.deferred) lines.push(plural(S.meta.deferred, 'concept') + ' held back by today\'s cap — they lead tomorrow\'s queue.');
    if(stillDue.today.length) lines.push(plural(stillDue.today.length, 'concept') + ' still due if you want to keep going.');
    if(!stillDue.today.length && !S.meta.deferred && next){
      lines.push('Next batch: ' + (next.dueIn <= 1 ? 'tomorrow' : 'in ' + plural(next.dueIn, 'day')) + '.');
    }
    if(lines.length) html += '<p>' + esc(lines.join(' ')) + '</p>';

    // One next step (assets/next-step.js): what is still due here comes first.
    html += (window.LevlNextStep ? LevlNextStep('ochem', { concepts: Object.keys(S.conceptsTouched),
      due: { n: stillDue.today.length, noun: 'concept', act: startSession }, also: [{ label: 'Back to the queue', act: render }] }) : '') + '</div>';

    if(touched.length){
      html += '<div style="font:900 11px var(--font-ui);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:26px 0 10px;">Where those concepts stand</div>' +
        '<div class="module-card">' + conceptRows(
          touched.sort(function(a, b){ return a.strength - b.strength; }),
          function(p){ return p.isDue ? 'back in this queue' : upcomingLabel(p); }) + '</div>';
    }

    doneEl.innerHTML = html;
    show('done');
  }

  /* ---- the queue view -------------------------------------------------- */

  function render(){
    var q = E.reviewQueue();
    var leechIds = q.leeches.map(function(p){ return p.id; });

    /* Tell the reminder scheduler what is waiting. This is the page that knows
       — the queue is computed right here for its own display — and an honest
       number is the whole difference between a reminder people act on and one
       they turn off. Reported even when it is zero, which is how a reminder
       that was queued yesterday stops being sent once the queue is cleared. */
    if(window.LevlReminders){
      window.LevlReminders.report('ochem', {
        // today, not dueTotal: the queue is capped by a daily budget, and the
        // number in a reminder has to be the number of questions they will
        // actually be asked when they tap it.
        due: (q.today || []).length,
        label: 'Organic Chemistry',
        url: '/ochem/review.html'
      });
    }
    // Leeches are held out of the queue entirely, so they must not also show
    // up under "coming back later" — they are not coming back until the
    // lesson has been re-read, and listing them twice says the opposite.
    var scheduled = M.allProfiles()
      .filter(function(p){ return p.attempts > 0 && !p.isDue && p.due && leechIds.indexOf(p.id) === -1; })
      .sort(function(a, b){ return a.due - b.due; });
    var everPracticed = M.allProfiles().some(function(p){ return p.attempts > 0; });

    var acts3 = [{ href: 'practice.html', label: 'Practice', primary: true }, { href: 'learn.html', label: 'Next lesson' }, { href: 'flashcards.html', label: 'Flashcards' }];
    var main = '';
    if(!everPracticed){
      main = '<section class="cx-card cx-queue">' + LevlStudy.empty({ num: 0, unit: 'due now', h: 'Nothing scheduled yet',
        p: 'Fills in as you practice. Each right answer pushes a concept further out; a wrong one brings it back.', actions: acts3 }) + '</section>';
    } else if(q.today.length){
      main = '<section class="cx-card cx-queue">' + LevlStudy.empty({ num: q.today.length, unit: 'due today',
        h: plural(q.today.length, 'concept') + ' to clear',
        p: q.deferred
          ? esc(plural(q.dueTotal, 'concept') + ' are actually due, but the daily cap is ' + M.DAILY_REVIEW_CAP +
            ': the ' + q.today.length + ' most overdue are today\'s batch; the other ' + q.deferred + ' lead tomorrow\'s.')
          : 'Each comes back inside a fresh problem, not the same card.',
        actions: [{ act: 'start', attrs: ' id="startReview"', label: 'Review ' + plural(q.today.length, 'concept'), primary: true }] }) +
        // Without Premium: what is left of today's shared question allowance.
        (window.OchemPremium ? window.OchemPremium.quotaNote() : '') +
        '</section>' +
        // The batch can be twenty concepts; listing all of them buries
        // everything below it. Show the most overdue few and count the rest.
        '<section><h2 class="cx-h2">Today\'s batch</h2><div class="module-card">' + conceptRows(q.today.slice(0, 8), overdueLabel) +
        (q.today.length > 8
          ? '<div class="concept-row"><span class="name" style="color:var(--muted);font-weight:700;">' +
            esc('+ ' + (q.today.length - 8) + ' more in this batch') + '</span></div>'
          : '') + '</div></section>';
    } else if(q.capReached){
      main = '<section class="cx-card cx-queue">' + LevlStudy.empty({ num: 0, unit: 'left today', h: 'You have cleared today\'s ' + M.DAILY_REVIEW_CAP,
        p: esc(plural(q.dueTotal, 'concept') + ' are still due, held back on purpose. Spacing over days is the point.'), actions: acts3 }) + '</section>';
    } else {
      main = '<section class="cx-card cx-queue">' + LevlStudy.empty({ num: 0, unit: 'due now', h: 'You are all caught up',
        p: 'Nothing is due today. Adaptive practice fills the gaps meanwhile.', actions: acts3 }) + '</section>';
    }
    var html = main;

    /* Leeches. A concept that keeps failing does not need another question,
       so it is held out of the queue and shown here with a route back to the
       lesson instead. Without this the queue accumulates a permanent core of
       things you always get wrong and stops being clearable. */
    if(q.leeches.length){
      html += '<section><h2 class="cx-h2">Go back to the lesson</h2>' +
        '<p class="cx-small" style="margin:-4px 0 12px;">' + esc('Failed too often for drilling to help. Out of the queue until you re-read them.') + '</p>' +
        '<div class="module-card">' + conceptRows(q.leeches, function(p){
          return (p.attempts - p.correct) + ' wrong of ' + p.attempts;
        }, { lesson: true }) + '</div></section>';
    }

    if(scheduled.length){
      html += '<section><h2 class="cx-h2">Coming back later</h2>' +
        '<div class="module-card">' + conceptRows(scheduled.slice(0, 15), upcomingLabel) + '</div>' +
        (scheduled.length > 15 ? '<p class="cx-small">' + esc('+ ' + plural(scheduled.length - 15, 'more concept') + ' scheduled further out.') + '</p>' : '') +
        '</section>';
    }

    /* Flags and unresolved misses are practice's modes, not review's, but the
       queue is where people notice the backlog, so the pointers belong here. */
    var flagged = window.OchemFlags ? window.OchemFlags.questions() : [];
    var mistakes = M.mistakes({ limit: 50 });
    if(flagged.length || mistakes.length){
      html += '<section><h2 class="cx-h2">Also waiting</h2><ul class="cx-list">' +
        (mistakes.length ? '<li><div>' + esc(plural(mistakes.length, 'question')) + ' you missed<span>They stay in rotation until you answer them correctly.</span></div><a class="btn-outline" href="practice.html?mode=mistakes">Work through them</a></li>' : '') +
        (flagged.length ? '<li><div>' + esc(plural(flagged.length, 'question')) + ' you flagged<span>They stay until you unflag them.</span></div><a class="btn-outline" href="practice.html?mode=flagged">Work through them</a></li>' : '') +
        '</ul></section>';
    }

    var answered = 0;
    M.allProfiles().forEach(function(p){ answered += p.attempts || 0; });
    html = '<div class="cx-body has-rail"><div class="cx-main">' + html + '</div>' +
      LevlStudy.rail({
        stats: [
          ['Answered', answered, answered ? 'questions so far' : 'nothing yet'],
          ['Due for review', q.dueTotal, q.dueTotal ? 'concepts to resurface' : 'nothing overdue', q.dueTotal ? 'is-due' : ''],
          ['To fix', mistakes.length, mistakes.length ? 'missed, not fixed since' : 'no open misses'],
          ['Day streak', M.streakDays(), M.streakDays() ? 'keep it going' : 'practice today to start one']
        ],
        links: [
          { href: 'flashcards.html', title: 'Flashcards', sub: 'pKa, IR and NMR values and reagents.' },
          { href: 'exams.html', title: 'Exams', sub: 'Timed tests on a chapter, a range or the course.' }
        ]
      }) + '</div>';

    homeEl.innerHTML = html;
    var start = homeEl.querySelector('#startReview');
    if(start) start.addEventListener('click', startSession);
    show('home');
  }

  quitBtn.addEventListener('click', function(){
    var S = runner.state();
    if(!S || S.asked === 0){ render(); return; }
    runner.finish();
  });

  // Waits on the question bank for the same reason practice-page.js does.
  window.OchemPracticeBankReady.then(render);
})();
