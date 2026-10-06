/* Drives practice.html.

   Kept out of an inline <script> for the same reason as learn-page.js and
   mastery-page.js: the site's CI checker textually scans .html files for
   href="..."/src="..." and would misfire on a path built by string
   concatenation rather than written as a literal.

   This file is only the UI. The thinking lives in four engines it wires
   together, and the split is deliberate — each one is testable on its own and
   none of them knows about the DOM:

     concepts.js          the concept graph: what "knowing something" is made
                          of, and which concepts depend on which
     mastery-engine.js    per-concept strength, decay, and the spaced
                          repetition schedule
     question-engine.js   picks the single best next question out of ~1900,
                          given the mastery profile and what was just asked
     diagnostic-engine.js grades an answer and works out which concept a
                          wrong one actually reveals a gap in

   Three views share the page: the home dashboard (recommendations, mastery
   snapshot, modes), a running session, and the summary. Only one is visible
   at a time.

   Relationship to lesson progress: practice writes to its own mastery store
   and never calls OchemCurriculum.recordAttempt. That boundary predates this
   rewrite and still holds — answering practice questions on a topic must not
   silently change the score of a lesson run in progress on that topic. Learn
   and Mastery keep reporting lesson scores; this page reports concept
   mastery, which is a different quantity measured a different way. */
(function(){
  var C  = window.OchemCurriculum;
  var CO = window.OchemConcepts;
  var M  = window.OchemMastery;
  var D  = window.OchemDiagnostics;
  var E  = window.OchemQuestionEngine;
  var Mo = window.OchemMolecules;
  var F  = window.OchemFlags;

  var homeEl    = document.getElementById('practiceHome');
  var sessionEl = document.getElementById('practiceSession');
  var summaryEl = document.getElementById('practiceSummary');
  var heroEl    = document.getElementById('practiceHero');
  var cardEl    = document.getElementById('practiceCard');
  var progFill  = document.getElementById('practiceProgFill');
  var progLabel = document.getElementById('practiceProgLabel');
  var modeLabel = document.getElementById('sessionMode');
  var quitBtn   = document.getElementById('sessionQuit');

  /* ---- small helpers -------------------------------------------------- */

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function pct(x){ return Math.round((x || 0) * 100); }
  function fillClass(s){ return s < 0.45 ? 'low' : s < 0.70 ? 'mid' : s < 0.88 ? '' : 'high'; }
  function plural(n, word){ return n + ' ' + word + (n === 1 ? '' : 's'); }

  function show(view){
    homeEl.hidden    = view !== 'home';
    sessionEl.hidden = view !== 'session';
    summaryEl.hidden = view !== 'summary';
    if(heroEl) heroEl.hidden = view !== 'home';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* Flagged questions, resolved to real question objects (flags.js drops any
     id the bank no longer has). Guarded so the page still works if flags.js
     is missing. */
  function flaggedQuestions(){ return F ? F.questions() : []; }

  function shuffled(arr){
    var a = arr.slice();
    for(var i=a.length-1;i>0;i--){ var j = Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  }

  /* =====================================================================
     HOME — recommendations, snapshot, modes, weak concepts
     ===================================================================== */

  /* The rail (assets/course/study.js): the same tiles as every course. */
  function railHtml(){
    var answered = 0;
    M.allProfiles().forEach(function(p){ answered += p.attempts || 0; });
    var dueCount = E.reviewQueue().dueTotal;   // only concepts with a question in a reached topic
    var toFix = M.mistakes({ limit: 999 }).length;
    var streak = M.streakDays();
    var G = window.OchemPremium;
    return LevlStudy.rail({
      stats: [
        ['Answered', answered, answered ? 'questions so far' : 'nothing yet'],
        ['Due for review', dueCount, dueCount ? 'concepts to resurface' : 'nothing overdue', dueCount ? 'is-due' : ''],
        ['To fix', toFix, toFix ? 'missed, not fixed since' : 'no open misses'],
        ['Day streak', streak, streak ? 'keep it going' : 'practice today to start one']
      ],
      due: { n: dueCount, noun: 'concept', href: 'review.html', pill: G && G.badge ? '' : '',
        text: dueCount ? 'Each comes back inside a fresh problem, not the same card.' : 'Concepts come back here when they are closest to being forgotten.' },
      links: [
        { href: 'flashcards.html', title: 'Flashcards', sub: 'Concepts, pKa, IR and NMR values and reagents.' },
        { href: 'exams.html', title: 'Exams', sub: 'Timed tests on a chapter, a range or the course.' }
      ]
    });
  }

  /* The modes, in the shared builder's step 1. Spaced review and flashcards
     are their own pages (Review owns the capped daily queue; two copies
     would drift), linked from the rail. */
  var MODES = [
    { mode:'adaptive', title:'Adaptive practice', desc:'Every question picked from your profile.' },
    { mode:'topic', title:'One topic', desc:'One topic, at a difficulty you choose.' },
    { mode:'quick', title:'Quick 5', desc:'Five adaptive questions.', count:5 },
    // The one mode that mixes topics on purpose, and only finished ones.
    { mode:'cumulative', title:'Cumulative review', desc:'Mixes questions from every topic you\'ve completed.' },
    { mode:'mistakes', title:'Questions I missed', desc:'Wrong, and not fixed since.' },
    // Flags are the student's own judgement rather than the engine's: "I got
    // this right and could not tell you why" is invisible to every other signal.
    { mode:'flagged', title:'Flagged questions', desc:'The ones you marked to revisit.' }
  ];
  var MODE = {}; MODES.forEach(function(m){ MODE[m.mode] = m; });
  var COUNTS = [5, 10, 20];
  var pick = { mode: 'adaptive', count: 10 };

  function modeOff(m){
    if(m === 'mistakes' && !M.mistakes({ limit: 1 }).length) return 'Nothing missed. Nice.';
    if(m === 'flagged' && !flaggedQuestions().length) return 'Nothing flagged yet.';
    return '';
  }
  function modeTitle(m){
    // Before any answer, adaptive practice has no profile to adapt to: it is
    // a diagnostic, and says so (audit 2026-10).
    if(m.mode === 'adaptive' && !M.overall()) return { t: 'Diagnostic', d: 'Ten questions across the course to find where to start.' };
    if(m.mode === 'flagged' && flaggedQuestions().length) return { t: m.title, d: plural(flaggedQuestions().length, 'question') + ' you marked to revisit.' };
    return { t: m.title, d: m.desc };
  }

  function builderHtml(recs){
    var step = function(n){ return '<span class="cx-step-n" aria-hidden="true">' + n + '</span>'; };
    return '<form class="cx-card cx-builder" id="ocBuilder" novalidate aria-label="Build a practice set">' +
      '<fieldset class="cx-step"><legend>' + step(1) + 'What do you want to practice?</legend><div class="cx-choices">' +
        MODES.map(function(m){
          var off = modeOff(m.mode), lab = modeTitle(m);
          return '<label class="cx-choice"><input type="radio" name="ocMode" value="' + m.mode + '"' + (m.mode === pick.mode ? ' checked' : '') + (off ? ' disabled' : '') + '>' +
            '<span><b>' + esc(lab.t) + (m.mode === 'adaptive' ? ' <small class="cx-tag">Default</small>' : '') + '</b><span>' + esc(off || lab.d) + '</span></span></label>';
        }).join('') +
      '</div></fieldset>' +
      '<div class="cx-step" id="ocPickStep"><h2 class="cx-step-h">' + step(2) + '<span id="ocPickH">Which topic?</span></h2><div id="ocPick"></div></div>' +
      '<fieldset class="cx-step" id="ocCountStep"><legend>' + step(3) + 'How many questions?</legend><div class="cx-pills">' +
        COUNTS.map(function(n){ return '<label class="cx-pill"><input type="radio" name="ocCount" value="' + n + '"' + (n === pick.count ? ' checked' : '') + '><span>' + n + '</span></label>'; }).join('') +
      '</div></fieldset>' +
      '<div class="cx-start"><p class="cx-sum" aria-live="polite"><span id="ocSum"></span><small>Feedback after every answer, with the concept behind a miss. Misses go to your review queue.</small></p>' +
        '<button type="submit" class="btn-press" id="startDrill">Start practice</button></div>' +
      (window.OchemPremium ? window.OchemPremium.quotaNote() : '') +
    '</form>';
  }

  function pickHtml(recs){
    var m = pick.mode;
    if(m === 'topic'){
      return '<div class="cx-fields">' +
        '<label class="cx-field"><span>Topic</span><select id="topicFilter">' + E.topicsWithQuestions().map(function(group){
          return '<optgroup label="' + esc(group.title) + '">' + group.topics.map(function(t){
            return '<option value="' + esc(t.id) + '"' + (t.id === pick.topic ? ' selected' : '') + '>' + esc(t.title) + '</option>';
          }).join('') + '</optgroup>';
        }).join('') + '</select></label>' +
        '<label class="cx-field"><span>Difficulty</span><select id="tierFilter">' +
          '<option value="">Any: let the engine choose</option>' +
          '<option value="1">Foundational: recognize and recall</option>' +
          '<option value="2">Intermediate: apply one concept</option>' +
          '<option value="3">Advanced: combine several concepts</option>' +
          '<option value="4">Challenge: little guidance</option>' +
        '</select></label></div>';
    }
    if(m === 'adaptive'){
      var r = recs[0];
      return r ? '<p class="cx-small"><b>' + esc(r.headline) + '.</b> ' + esc(r.detail) + '</p>' : '';
    }
    if(m === 'cumulative') return '<p class="cx-small">Only topics you have completed are mixed in, so nothing you have not been taught turns up.</p>';
    return '';
  }

  function conceptRowsHtml(profiles, opts){
    opts = opts || {};
    return profiles.map(function(p){
      var s = p.strength === null ? 0 : p.strength;
      var sub = p.strength === null
        ? 'not practiced yet'
        : p.band.label + ' · ' + p.correct + '/' + p.attempts +
          (p.isDue ? ' · due now' : (p.dueIn !== null && p.dueIn > 0 ? ' · back in ' + plural(p.dueIn, 'day') : ''));
      return '<div class="concept-row">' +
        '<span class="name">' + esc(p.concept.title) + '<small>' + esc(sub) + '</small></span>' +
        '<span class="track"><span class="fill ' + fillClass(s) + '" style="width:' + pct(s) + '%"></span></span>' +
        '<span class="pct">' + (p.strength === null ? '—' : pct(s) + '%') + '</span>' +
        (opts.drill ? '<button type="button" class="drill" data-concept="' + esc(p.id) + '">Drill</button>' : '') +
      '</div>';
    }).join('');
  }

  function renderHome(){
    var recs = E.recommendations();
    var weak = M.weakest(6, 2);
    var strong = M.strongest(3);
    var stats = E.stats();

    // The shared study layout: the builder on the left, your numbers on the
    // right (docs/course-shell.md, W-C).
    if(modeOff(pick.mode)) pick.mode = 'adaptive';
    var html = '<div class="cx-body has-rail"><div class="cx-main">' + builderHtml(recs);

    var rest = recs.slice(1);
    if(rest.length){
      html += '<div class="rec-alt">' + rest.map(function(r, i){
        var inner = '<span class="t">' + esc(r.headline) + '<small class="d">' + esc(r.detail) + '</small></span>' +
                    '<span class="go" aria-hidden="true">&rarr;</span>';
        // A recommendation that points at a lesson is a link, not a session.
        return r.href
          ? '<a href="' + r.href + '" class="rec-alt-link">' + inner + '</a>'
          : '<button type="button" data-rec="' + (i + 1) + '">' + inner + '</button>';
      }).join('') + '</div>';
    }
    html += '<p class="cx-small">' + esc(stats.total.toLocaleString() + ' questions across ' + stats.topics + ' topics, ' + stats.interactive + ' interactive. ') +
      'Your concept map is on the <a href="dashboard.html">Dashboard</a>.</p>';

    if(weak.length){
      html += '<section><h2 class="cx-h2">Where you are weakest</h2>' +
        '<div class="module-card">' + conceptRowsHtml(weak, { drill: true }) + '</div></section>';
    }
    if(strong.length){
      html += '<section><h2 class="cx-h2">Holding up well</h2>' +
        '<div class="module-card">' + conceptRowsHtml(strong) + '</div></section>';
    }

    var flagged = flaggedQuestions();
    if(flagged.length){
      html += '<section><h2 class="cx-h2">Flagged to come back to</h2>' +
        '<div class="module-card">' + flagged.slice(0, 8).map(function(q){
          return '<div class="flag-row">' +
            '<span class="name">' + esc(q.prompt || q.q) +
              '<small>' + esc(E.topicTitle(q.topic)) + ' · ' +
              esc((M.TIERS[q.tier || 2] || M.TIERS[2]).label) + '</small></span>' +
            '<button type="button" class="unflag" data-unflag="' + esc(q.id) + '">Unflag</button>' +
          '</div>';
        }).join('') +
        (flagged.length > 8
          ? '<div class="flag-row"><span class="name" style="color:var(--muted);font-weight:700;">' +
            esc('+ ' + (flagged.length - 8) + ' more flagged') + '</span></div>'
          : '') +
        '</div></section>';
    }

    html += '</div>' + railHtml() + '</div>';

    homeEl.innerHTML = html;

    // --- wiring ---
    homeEl.querySelectorAll('[data-rec]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var r = recs[parseInt(btn.getAttribute('data-rec'), 10)];
        if(r && r.plan) startSession(r.plan);
      });
    });

    homeEl.querySelectorAll('[data-concept]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = btn.getAttribute('data-concept');
        var c = CO.get(id);
        startSession(E.makePlan('weak', { concepts: [id], conceptTitle: c ? c.title : id, count: 8 }));
      });
    });

    var form = homeEl.querySelector('#ocBuilder');
    function syncTopic(){ var t = homeEl.querySelector('#topicFilter'); if(t) pick.topic = t.value; }
    function paintPick(){
      var h = pickHtml(recs), stepEl = homeEl.querySelector('#ocPickStep');
      homeEl.querySelector('#ocPick').innerHTML = h;
      homeEl.querySelector('#ocPickH').textContent = pick.mode === 'topic' ? 'Which topic?' : pick.mode === 'adaptive' ? 'What the engine suggests' : 'What goes in';
      stepEl.hidden = !h;
      var fixed = pick.mode === 'quick' || pick.mode === 'flagged';
      homeEl.querySelector('#ocCountStep').hidden = fixed;
      homeEl.querySelector('#ocCountStep .cx-step-n').textContent = h ? '3' : '2';
      syncTopic();
    }
    function planNow(){
      var m = pick.mode;
      if(m === 'topic'){
        var tier = homeEl.querySelector('#tierFilter').value;
        return E.makePlan('topic', { topic: pick.topic, count: pick.count, tiers: tier ? [parseInt(tier, 10)] : null });
      }
      if(m === 'quick') return E.makePlan('quick', { count: 5 });
      if(m === 'flagged') return E.makePlan('flagged', {});
      if(m === 'adaptive' && !M.overall() && recs[0] && recs[0].plan) return recs[0].plan;
      return E.makePlan(m, { count: pick.count });
    }
    function paintSum(){
      var m = pick.mode, n = m === 'quick' ? 5 : m === 'flagged' ? flaggedQuestions().length : pick.count;
      var lab = m === 'topic' && C.findTopic(pick.topic) ? (C.findTopic(pick.topic).title || '') : modeTitle(MODE[m]).t;
      homeEl.querySelector('#ocSum').textContent = plural(n, 'question') + ' · ' + lab;
    }
    form.addEventListener('change', function(e){
      if(e.target.name === 'ocMode'){ pick.mode = e.target.value; paintPick(); }
      else if(e.target.name === 'ocCount') pick.count = +e.target.value;
      else syncTopic();
      paintSum();
    });
    form.addEventListener('submit', function(e){
      e.preventDefault(); syncTopic();
      var plan = planNow();
      if(pick.mode === 'topic'){
        E.resetLimited();
        if(!E.availableCount(plan) && !E.wasLimited()){
          alert('No questions match that topic and difficulty yet. Try "Any difficulty".');
          return;
        }
      }
      if(pick.mode === 'flagged' && !flaggedQuestions().length) return;
      startSession(plan);
    });
    paintPick(); paintSum();

    homeEl.querySelectorAll('[data-unflag]').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(!F) return;
        F.remove(btn.getAttribute('data-unflag'));
        renderHome();
      });
    });

    show('home');
  }

  /* =====================================================================
     SESSION
     ===================================================================== */

  /* The question loop itself lives in session-runner.js, shared with the
     Review page. Practice supplies the two things that are its own: which
     question comes next (the adaptive engine, filtered by the plan) and when
     to stop (a fixed session length). */
  var currentPlan = null;
  var runner = window.OchemSessionRunner({
    els: { card: cardEl, progFill: progFill, progLabel: progLabel, modeLabel: modeLabel },
    limitSource: 'practice',
    next: function(S){
      if(S.index >= S.meta.count) return null;
      return E.next(currentPlan, S);
    },
    progress: function(S){
      return {
        pct: Math.round((Math.min(S.index, S.meta.count) / S.meta.count) * 100),
        label: 'Question ' + Math.min(S.index + 1, S.meta.count) + ' / ' + S.meta.count
      };
    },
    checkFor: function(d, q, S){
      return E.checkQuestion(d.conceptId, q.tier || 2, S.askedIds, q.kind, q.topic);
    },
    nextLabel: function(S){
      return S.isCheck ? 'Continue' : (S.index >= S.meta.count ? 'Finish session' : 'Next question');
    },
    onFinish: renderSummary
  });

  function startSession(plan){
    E.resetLimited();
    var available = E.availableCount(plan);
    if(!available && E.wasLimited() && window.OchemPremium){
      // Everything this plan would ask is past the free chapters, and today's
      // allowance is spent.
      show('session');
      cardEl.innerHTML = window.OchemPremium.limitGate('practice') +
        '<div class="actions" style="justify-content:flex-start;margin-top:14px;">' +
          '<button type="button" class="btn-press alt sm" data-limit-back>Back to practice</button></div>';
      cardEl.querySelector('[data-limit-back]').addEventListener('click', renderHome);
      return;
    }
    if(!available){
      alert('There are no questions available for that right now.');
      return;
    }
    currentPlan = plan;
    show('session');
    runner.start({
      title: plan.label || 'Practice',
      meta: { count: Math.min(plan.count || 10, available) }
    });
  }

  quitBtn.addEventListener('click', function(){
    var S = runner.state();
    if(!S || S.asked === 0){ renderHome(); return; }
    renderSummary(S);
  });

  /* =====================================================================
     SUMMARY
     ===================================================================== */

  function renderSummary(S){
    var asked = S.asked;
    var score = asked ? Math.round((S.correct / asked) * 100) : 0;

    M.recordSession({
      mode: currentPlan ? currentPlan.mode : 'adaptive', asked: asked, correct: S.correct,
      concepts: Object.keys(S.conceptsTouched)
    });

    // The score landing gets the longer version of the answer chime, pitched to
    // how the run actually went.
    if(window.LevlSound) window.LevlSound.flourish(asked ? S.correct / asked : 0);

    var touched = Object.keys(S.conceptsTouched).map(M.profile)
      .filter(function(p){ return p.attempts > 0; })
      .sort(function(a, b){ return a.strength - b.strength; });

    var comingBack = touched.filter(function(p){ return p.interval > 0; })
      .sort(function(a, b){ return a.due - b.due; });

    // What the session just earned, rendered by the game layer so Practice
    // and Review report it identically.
    var xpHtml = window.OchemXP ? window.OchemXP.summaryHtml() : '';

    var html = xpHtml + '<div class="overall-card" style="margin-bottom:6px;">' +
        '<div><div class="k">Session score</div><div class="big">' + score + '%</div></div>' +
        '<div style="max-width:320px;font-size:13.5px;font-weight:700;opacity:.85;line-height:1.55;">' +
          esc(S.correct + ' of ' + asked + ' correct, across ' + plural(touched.length, 'concept') + '.') +
        '</div>' +
      '</div>';

    if(touched.length){
      html += '<div class="summary-section"><h3>Where those concepts stand now</h3>' +
        '<div class="module-card">' + conceptRowsHtml(touched, { drill: true }) + '</div></div>';
    }

    if(comingBack.length){
      var soonest = comingBack[0];
      html += '<div class="summary-section"><h3>Scheduled to come back</h3><div class="next-up">' +
        esc(plural(comingBack.length, 'concept') + ' from this session ' +
        (comingBack.length === 1 ? 'is' : 'are') + ' queued for spaced review, the soonest being ') +
        '<b>' + esc(soonest.concept.title.toLowerCase()) + '</b>' +
        esc(soonest.interval <= 1 ? ' tomorrow.' : ' in ' + plural(soonest.interval, 'day') + '.') +
        ' They come back inside new problems, not the same card.' +
      '</div></div>';
    }

    /* Flags set during this session are the most likely thing the student
       wants next, and unlike everything else on this screen they are not
       something the engine would ever suggest on its own. */
    var flaggedNow = flaggedQuestions().filter(function(q){ return S.askedIds.indexOf(q.id) !== -1; });
    if(flaggedNow.length){
      html += '<div class="summary-section"><h3>Flagged in this session</h3><div class="next-up">' +
        esc(plural(flaggedNow.length, 'question') + ' from this session ' +
          (flaggedNow.length === 1 ? 'is' : 'are') + ' flagged, out of ' +
          plural(flaggedQuestions().length, 'flagged question') + ' in total. ') +
        '<a href="practice.html?mode=flagged">Work through them</a>.' +
      '</div></div>';
    }

    var recs = E.recommendations();
    var lead = recs.filter(function(r){ return r.plan; })[0];
    if(lead){
      html += '<div class="summary-section"><h3>What the engine suggests next</h3>' +
        '<div class="next-up"><b>' + esc(lead.headline) + '.</b> ' + esc(lead.detail) + '</div></div>';
    }

    // One next step (assets/next-step.js); the engine's own pick stays as a quiet alternative.
    html += window.LevlNextStep ? LevlNextStep('ochem', { concepts: Object.keys(S.conceptsTouched),
      also: [lead ? { label: lead.cta, act: function(){ startSession(lead.plan); } } : { label: 'Practice again', act: renderHome }] }) : '';

    // The Premium waitlist; see assets/premium.js. Asks, locks nothing.
    if(window.LevlPremium && asked >= 8) html += window.LevlPremium.card('ochem', 'summary');

    summaryEl.innerHTML = html;
    show('summary');

    summaryEl.querySelectorAll('[data-concept]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = btn.getAttribute('data-concept');
        var c = CO.get(id);
        startSession(E.makePlan('weak', { concepts: [id], conceptTitle: c ? c.title : id, count: 8 }));
      });
    });
  }

  /* Deep links. Other pages route into a specific practice session rather
     than re-implementing one: review.html sends people to ?mode=due, and a
     concept link anywhere can send them to ?concept=<id>. Unrecognised or
     currently-empty modes fall through to the normal home view instead of
     erroring, since a bookmarked ?mode=due is meaningless on a day when
     nothing is due. */
  function planFromQuery(){
    var params = {};
    location.search.replace(/^\?/, '').split('&').forEach(function(pair){
      if(!pair) return;
      var bits = pair.split('=');
      params[decodeURIComponent(bits[0])] = decodeURIComponent((bits[1] || '').replace(/\+/g, ' '));
    });
    var count = parseInt(params.count, 10) || undefined;
    if(params.concept && CO.get(params.concept)){
      return E.makePlan('weak', {
        concepts: [params.concept], conceptTitle: CO.get(params.concept).title, count: count || 8
      });
    }
    if(params.topic && C.findTopic(params.topic)){
      return E.makePlan('topic', { topic: params.topic, count: count });
    }
    // ?mode=due used to run a spaced-review session here; Review owns that
    // now, so an old bookmark is sent there rather than quietly doing
    // something subtly different.
    if(params.mode === 'due'){ location.replace('review.html'); return null; }
    // ?mode=flagged is how Review and the summary route here; an empty flag
    // list falls through to the home view like any other empty mode.
    if(params.mode === 'flagged'){
      var fq = flaggedQuestions();
      return fq.length ? E.makePlan('flagged', { count: count }) : null;
    }
    if(params.mode && ['adaptive','mistakes','quick','cumulative','mixed'].indexOf(params.mode) !== -1){
      return E.makePlan(params.mode, { count: count });
    }
    return null;
  }

  /* The first view either branch renders reports counts drawn from the whole
     question pool, so both wait for the legacy bank to arrive rather than
     rendering a number that would change under the user a moment later. See
     assets/bank-loader.js. */
  window.OchemPracticeBankReady.then(function(){
    var deepLink = planFromQuery();
    E.resetLimited();
    if(deepLink && (E.availableCount(deepLink) || E.wasLimited())) startSession(deepLink);
    else renderHome();
  });
})();
