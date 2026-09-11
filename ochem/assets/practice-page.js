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

  function snapshotHtml(){
    var overall = M.overall();
    var counts = M.counts();
    var dueCount = M.due().length;
    var streak = M.streakDays();
    var cells = [];

    cells.push('<div class="cell"><div class="k">Concept mastery</div><div class="v accent">' +
      (overall ? pct(overall.value) + '%' : '—') + '</div><div class="s">' +
      (overall ? overall.touched + ' of ' + overall.total + ' concepts touched' : 'nothing practiced yet') +
      '</div></div>');
    cells.push('<div class="cell"><div class="k">Solid or better</div><div class="v">' +
      (counts.solid + counts.mastered) + '</div><div class="s">' + counts.shaky + ' shaky, ' +
      counts.developing + ' developing</div></div>');
    cells.push('<div class="cell"><div class="k">Due for review</div><div class="v' + (dueCount ? ' warn' : '') + '">' +
      dueCount + '</div><div class="s">' + (dueCount ? 'scheduled to resurface' : 'nothing overdue') + '</div></div>');
    cells.push('<div class="cell"><div class="k">Day streak</div><div class="v">' + streak +
      '</div><div class="s">' + (streak ? 'keep it going' : 'practice today to start one') + '</div></div>');

    return '<div class="snapshot">' + cells.join('') + '</div>';
  }

  function recommendationsHtml(recs){
    if(!recs.length) return '';
    var primary = recs[0];
    var html = '<div class="rec-card">' +
      '<div class="k">Recommended for you</div>' +
      '<h2>' + esc(primary.headline) + '</h2>' +
      '<p>' + esc(primary.detail) + '</p>' +
      '<div class="actions">' +
        (primary.plan ? '<button class="btn-press" data-rec="0">' + esc(primary.cta) + '</button>' : '') +
        (primary.href ? '<a class="btn-press alt" href="' + primary.href + '">' + esc(primary.cta) + '</a>' : '') +
      '</div></div>';

    var rest = recs.slice(1);
    if(rest.length){
      html += '<div class="rec-alt">' + rest.map(function(r, i){
        var inner = '<span class="t">' + esc(r.headline) + '<small class="d">' + esc(r.detail) + '</small></span>' +
                    '<span class="go" aria-hidden="true">&rarr;</span>';
        // A recommendation that points at a lesson is a link, not a session.
        return r.href
          ? '<a href="' + r.href + '" style="text-decoration:none;color:inherit;"><button type="button" tabindex="-1">' + inner + '</button></a>'
          : '<button type="button" data-rec="' + (i + 1) + '">' + inner + '</button>';
      }).join('') + '</div>';
    }
    return html;
  }

  var MODES = [
    { mode:'adaptive', title:'Adaptive practice', pill:'Default',
      desc:'The engine picks every question from your mastery profile as you go.', count:10 },
    { mode:'mistakes', title:'Review your mistakes',
      desc:'Only questions you got wrong and have not fixed since.', count:10 },
    // Flags are the student's own judgement rather than the engine's, which
    // is exactly why the mode exists: "I got this right and could not tell
    // you why" is invisible to every other signal on this page.
    { mode:'flagged', title:'Flagged questions',
      desc:'The ones you marked to come back to — right or wrong.' },
    // Spaced review is the Review page's job, not a mode here: it is a
    // finite, capped, daily queue rather than an open-ended session, and two
    // implementations of it would drift apart.
    { mode:'review', title:'Spaced review', href:'review.html',
      desc:'Your due queue, on the Review page. Finite — it drains to zero.' },
    { mode:'topic', title:'Pick a topic',
      desc:'Drill one topic on its own, at a difficulty you choose.' },
    { mode:'quick', title:'Quick 5',
      desc:'Five adaptive questions. Good for a gap between classes.', count:5 },
    { mode:'mixed', title:'Mixed practice',
      desc:'An even spread across every topic, with the adaptivity turned down.', count:10 }
  ];

  function modeGridHtml(){
    return '<div class="mode-grid">' + MODES.map(function(m, i){
      var disabled = '';
      var pill = m.pill;
      if(m.mode === 'mistakes' && !M.mistakes({ limit: 1 }).length) disabled = ' disabled';
      var countPill = false;
      if(m.mode === 'flagged'){
        var n = flaggedQuestions().length;
        if(!n) disabled = ' disabled';
        else { pill = String(n); countPill = true; }
      }
      // A one- or two-digit pill needs far less room reserved beside the
      // title than the word "Default" does.
      var inner = (pill ? '<span class="pill' + (countPill ? ' pill--count' : '') + '">' + esc(pill) + '</span>' : '') +
        '<span class="t">' + esc(m.title) + '</span>' +
        '<span class="d">' + esc(m.desc) + '</span>';
      if(m.href) return '<a class="mode-card" href="' + m.href + '">' + inner + '</a>';
      return '<button type="button" class="mode-card" data-mode="' + i + '"' + disabled + '>' + inner + '</button>';
    }).join('') + '</div>' +
    '<div class="drill-panel" id="drillPanel" hidden>' +
      '<div class="practice-field"><label for="topicFilter">Topic</label><select id="topicFilter"></select></div>' +
      '<div class="practice-field"><label for="tierFilter">Difficulty</label><select id="tierFilter">' +
        '<option value="">Any — let the engine choose</option>' +
        '<option value="1">Foundational — recognize and recall</option>' +
        '<option value="2">Intermediate — apply one concept</option>' +
        '<option value="3">Advanced — combine several concepts</option>' +
        '<option value="4">Challenge — little guidance</option>' +
      '</select></div>' +
      '<div class="practice-field"><label for="lengthFilter">Session length</label><select id="lengthFilter">' +
        '<option value="5">5 questions</option><option value="10" selected>10 questions</option><option value="20">20 questions</option>' +
      '</select></div>' +
      '<div class="actions" style="justify-content:flex-start;"><button class="btn-press" id="startDrill">Start drill</button></div>' +
    '</div>';
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

    var html = recommendationsHtml(recs) + snapshotHtml();

    if(weak.length){
      html += '<div class="section-head">Where you are weakest</div>' +
        '<div class="module-card">' + conceptRowsHtml(weak, { drill: true }) + '</div>';
    }
    if(strong.length){
      html += '<div class="section-head">Holding up well</div>' +
        '<div class="module-card">' + conceptRowsHtml(strong) + '</div>';
    }

    var flagged = flaggedQuestions();
    if(flagged.length){
      html += '<div class="section-head">Flagged to come back to</div>' +
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
        '</div>' +
        '<div class="actions" style="justify-content:flex-start;margin-top:12px;">' +
          '<button class="btn-press alt sm" id="startFlagged">Practice ' +
          esc(plural(flagged.length, 'flagged question')) + '</button>' +
        '</div>';
    }

    html += '<div class="section-head">Other ways to practice</div>' + modeGridHtml();

    html += '<p style="margin-top:18px;font:700 12.5px var(--font-ui);color:var(--muted);line-height:1.6;">' +
      esc(stats.total.toLocaleString() + ' questions across ' + stats.topics + ' topics, ' + stats.interactive +
      ' of them interactive (click an atom, push an arrow, rank a series, predict a product). ') +
      'Your concept map lives on <a href="mastery.html">Mastery</a>.</p>';

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

    var startFlagged = homeEl.querySelector('#startFlagged');
    if(startFlagged) startFlagged.addEventListener('click', function(){
      startSession(E.makePlan('flagged', {}));
    });

    /* Unflagging re-renders the whole home view rather than just removing the
       row: the count on the Flagged mode card and the section heading both
       have to follow, and a stale "4" next to three rows is worse than a
       repaint. */
    homeEl.querySelectorAll('[data-unflag]').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(!F) return;
        F.remove(btn.getAttribute('data-unflag'));
        renderHome();
      });
    });

    var drillPanel = homeEl.querySelector('#drillPanel');
    homeEl.querySelectorAll('[data-mode]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var m = MODES[parseInt(btn.getAttribute('data-mode'), 10)];
        if(m.mode === 'topic'){
          drillPanel.hidden = !drillPanel.hidden;
          if(!drillPanel.hidden) drillPanel.scrollIntoView({ behavior:'smooth', block:'nearest' });
          return;
        }
        if(m.mode === 'flagged' && !flaggedQuestions().length) return;
        startSession(E.makePlan(m.mode, { count: m.count }));
      });
    });

    // Topic picker, grouped by module, listing only topics that have questions.
    var topicSelect = homeEl.querySelector('#topicFilter');
    topicSelect.innerHTML = E.topicsWithQuestions().map(function(group){
      return '<optgroup label="' + esc(group.title) + '">' + group.topics.map(function(t){
        return '<option value="' + esc(t.id) + '">' + esc(t.title) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');

    homeEl.querySelector('#startDrill').addEventListener('click', function(){
      var tier = homeEl.querySelector('#tierFilter').value;
      var plan = E.makePlan('topic', {
        topic: topicSelect.value,
        count: parseInt(homeEl.querySelector('#lengthFilter').value, 10) || 10,
        tiers: tier ? [parseInt(tier, 10)] : null
      });
      if(!E.availableCount(plan)){
        alert('No questions match that topic and difficulty yet. Try "Any difficulty".');
        return;
      }
      startSession(plan);
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
      return E.checkQuestion(d.conceptId, q.tier || 2, S.askedIds, q.kind);
    },
    nextLabel: function(S){
      return S.isCheck ? 'Continue' : (S.index >= S.meta.count ? 'Finish session' : 'Next question');
    },
    onFinish: renderSummary
  });

  function startSession(plan){
    var available = E.availableCount(plan);
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
        ' They come back inside new problems on other topics, not as the same card — that is what makes the idea transfer.' +
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
        'They stay flagged until you clear them yourself — <a href="practice.html?mode=flagged">work through them</a>.' +
      '</div></div>';
    }

    var recs = E.recommendations();
    var lead = recs.filter(function(r){ return r.plan; })[0];
    if(lead){
      html += '<div class="summary-section"><h3>What the engine suggests next</h3>' +
        '<div class="next-up"><b>' + esc(lead.headline) + '.</b> ' + esc(lead.detail) + '</div></div>';
    }

    html += '<div class="actions" style="margin-top:20px;justify-content:flex-start;flex-wrap:wrap;">' +
      (lead ? '<button class="btn-press" id="sumNext">' + esc(lead.cta) + '</button>' : '') +
      '<button class="btn-press alt" id="sumAgain">Practice again</button>' +
      '<a href="mastery.html" class="btn-press alt">View mastery</a>' +
    '</div>';

    summaryEl.innerHTML = html;
    show('summary');

    var againBtn = summaryEl.querySelector('#sumAgain');
    if(againBtn) againBtn.addEventListener('click', renderHome);
    var nextBtn = summaryEl.querySelector('#sumNext');
    if(nextBtn) nextBtn.addEventListener('click', function(){ startSession(lead.plan); });
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
    if(params.mode && ['adaptive','mistakes','quick','mixed'].indexOf(params.mode) !== -1){
      return E.makePlan(params.mode, { count: count });
    }
    return null;
  }

  var deepLink = planFromQuery();
  if(deepLink && E.availableCount(deepLink)) startSession(deepLink);
  else renderHome();
})();
