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
    { mode:'due', title:'Spaced review',
      desc:'Concepts scheduled to come back today, inside fresh problems.', count:10 },
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
      if(m.mode === 'mistakes' && !M.mistakes({ limit: 1 }).length) disabled = ' disabled';
      if(m.mode === 'due' && !M.due(1).length) disabled = ' disabled';
      return '<button type="button" class="mode-card" data-mode="' + i + '"' + disabled + '>' +
        (m.pill ? '<span class="pill">' + m.pill + '</span>' : '') +
        '<span class="t">' + esc(m.title) + '</span>' +
        '<span class="d">' + esc(m.desc) + '</span>' +
      '</button>';
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

    var drillPanel = homeEl.querySelector('#drillPanel');
    homeEl.querySelectorAll('[data-mode]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var m = MODES[parseInt(btn.getAttribute('data-mode'), 10)];
        if(m.mode === 'topic'){
          drillPanel.hidden = !drillPanel.hidden;
          if(!drillPanel.hidden) drillPanel.scrollIntoView({ behavior:'smooth', block:'nearest' });
          return;
        }
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

  var S = null;

  function startSession(plan){
    var available = E.availableCount(plan);
    if(!available){
      alert('There are no questions available for that right now.');
      return;
    }
    S = {
      plan: plan,
      count: Math.min(plan.count || 10, available),
      index: 0,              // how many main questions have been answered
      correct: 0,
      asked: 0,              // including remediation checks
      askedIds: [],
      recentTopics: [], recentConcepts: [], recentKinds: [],
      conceptsTouched: {},
      pendingCheck: null,    // a remediation question queued after a miss
      checkConcept: null,    // the concept that check is re-testing
      fixed: 0,              // previously-missed questions redeemed this session
      current: null,
      isCheck: false
    };
    modeLabel.textContent = plan.label || 'Practice';
    show('session');
    advance();
  }

  function advance(){
    // A queued remediation check jumps the line — the whole point is that it
    // arrives immediately after the teaching, while the correction is fresh.
    if(S.pendingCheck){
      var cq = S.pendingCheck;
      S.pendingCheck = null;
      S.isCheck = true;
      renderQuestion(cq);
      return;
    }
    if(S.index >= S.count){ renderSummary(); return; }
    var q = E.next(S.plan, S);
    if(!q){ renderSummary(); return; }
    S.isCheck = false;
    S.checkConcept = null;
    renderQuestion(q);
  }

  function updateProgress(){
    var done = Math.min(S.index, S.count);
    progFill.style.width = Math.round((done / S.count) * 100) + '%';
    progLabel.textContent = S.isCheck
      ? 'Check — apply the fix'
      : 'Question ' + Math.min(S.index + 1, S.count) + ' / ' + S.count;
  }

  function tierChipHtml(tier){
    var t = M.TIERS[tier] || M.TIERS[2];
    var pips = '';
    for(var i=1;i<=4;i++) pips += '<span class="pip' + (i <= tier ? ' on' : '') + '"></span>';
    return '<span class="tier-pips" title="' + esc(t.blurb) + '">' + pips + '</span>' +
           '<span class="tier-label">' + esc(t.label) + '</span>';
  }

  /* ---- per-kind rendering --------------------------------------------
     Each renderer returns { html, attach(submit) }. `submit(response)` is
     called with the kind-specific response object the diagnostic engine
     expects. Renderers never grade anything themselves. */

  function renderMcq(q){
    var opts = q.options || [];
    return {
      html: '<div class="choice-row">' + opts.map(function(o, i){
        return '<button class="choice-btn" data-i="' + i + '">' + esc(o) + '</button>';
      }).join('') + '</div>',
      attach: function(submit){
        cardEl.querySelectorAll('.choice-btn').forEach(function(btn){
          btn.addEventListener('click', function(){
            submit({ choice: parseInt(btn.getAttribute('data-i'), 10) });
          });
        });
      },
      lock: function(response, correct){
        cardEl.querySelectorAll('.choice-btn').forEach(function(b, i){
          b.disabled = true;
          if(i === q.answer) b.classList.add('correct');
          else if(i === response.choice) b.classList.add('wrong');
        });
      }
    };
  }

  function renderClickAtom(q){
    return {
      html: '<div class="click-hint">Click an atom on the molecule.</div>' +
            Mo.svg(q.molecule, { clickable: 'all' }),
      attach: function(submit){
        cardEl.querySelectorAll('.atom').forEach(function(el){
          function go(){ submit({ key: el.getAttribute('data-key') }); }
          el.addEventListener('click', go);
          el.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
        });
      },
      lock: function(response, correct){
        var ok = D.acceptedKeys(q);
        cardEl.querySelector('.scene').classList.add('scene--locked');
        cardEl.querySelectorAll('.atom').forEach(function(el){
          var k = el.getAttribute('data-key');
          el.classList.add('atom--static');
          if(ok.indexOf(k) !== -1) el.classList.add('atom--correct');
          else if(k === response.key) el.classList.add('atom--wrong');
        });
      }
    };
  }

  function renderMultiClick(q){
    var picked = [];
    return {
      html: '<div class="click-hint">Click every atom that applies, then check your answer.</div>' +
            Mo.svg(q.molecule, { clickable: 'all' }) +
            '<div class="multi-note" id="multiNote">Nothing selected yet.</div>' +
            '<div class="actions" style="justify-content:flex-start;"><button class="btn-press" id="checkBtn" disabled>Check answer</button></div>',
      attach: function(submit){
        var note = cardEl.querySelector('#multiNote');
        var check = cardEl.querySelector('#checkBtn');
        cardEl.querySelectorAll('.atom').forEach(function(el){
          function toggle(){
            var k = el.getAttribute('data-key');
            var at = picked.indexOf(k);
            if(at === -1){ picked.push(k); el.classList.add('chosen'); }
            else { picked.splice(at, 1); el.classList.remove('chosen'); }
            note.textContent = picked.length ? plural(picked.length, 'position') + ' selected.' : 'Nothing selected yet.';
            check.disabled = !picked.length;
          }
          el.addEventListener('click', toggle);
          el.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); } });
        });
        check.addEventListener('click', function(){ submit({ keys: picked.slice() }); });
      },
      lock: function(response, correct){
        var ok = D.acceptedKeys(q);
        cardEl.querySelector('#checkBtn').remove();
        cardEl.querySelector('.scene').classList.add('scene--locked');
        cardEl.querySelectorAll('.atom').forEach(function(el){
          var k = el.getAttribute('data-key');
          el.classList.remove('chosen');
          el.classList.add('atom--static');
          if(ok.indexOf(k) !== -1) el.classList.add('atom--correct');
          else if((response.keys || []).indexOf(k) !== -1) el.classList.add('atom--wrong');
        });
      }
    };
  }

  function renderArrow(q){
    var from = null;
    return {
      html: '<div class="click-hint">Click where the arrow starts, then where it ends.</div>' +
            Mo.svg(q.molecule, { clickable: 'all' }) +
            '<div class="multi-note" id="arrowNote">Start at a source of electrons.</div>',
      attach: function(submit){
        var note = cardEl.querySelector('#arrowNote');
        cardEl.querySelectorAll('.atom').forEach(function(el){
          function go(){
            var k = el.getAttribute('data-key');
            if(from === null){
              from = k;
              el.classList.add('chosen');
              note.textContent = 'Tail on ' + Mo.labelFor(q.molecule, k) + '. Now click where those electrons go.';
            } else if(k !== from){
              submit({ from: from, to: k });
            }
          }
          el.addEventListener('click', go);
          el.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
        });
      },
      lock: function(response, correct){
        // Redraw the scene showing the student's arrow in red when wrong and
        // the correct one in green alongside it, so the mistake is visible
        // rather than described.
        var arrows = [];
        if(!correct) arrows.push({ from: response.from, to: response.to, color: 'var(--bad)' });
        arrows.push({ from: q.answer.from, to: q.answer.to, color: correct ? 'var(--good)' : 'var(--accent)' });
        var scene = cardEl.querySelector('.scene');
        scene.outerHTML = Mo.svg(q.molecule, { clickable: [], arrows: arrows });
        cardEl.querySelector('.scene').classList.add('scene--locked');
        var note = cardEl.querySelector('#arrowNote');
        if(note) note.remove();
      }
    };
  }

  function renderOrder(q){
    // Start from a shuffled arrangement that isn't already the answer.
    var order = shuffled(q.items.map(function(_, i){ return i; }));
    var tries = 0;
    while(order.join() === q.answer.join() && tries++ < 8) order = shuffled(order);

    function listHtml(state){
      return order.map(function(itemIdx, pos){
        var cls = '';
        if(state) cls = itemIdx === q.answer[pos] ? ' class="ok"' : ' class="no"';
        return '<li' + cls + ' data-pos="' + pos + '">' +
          '<span class="rank">' + (pos + 1) + '</span>' +
          '<span class="txt">' + esc(q.items[itemIdx]) + '</span>' +
          (state ? '' : '<span class="mv">' +
            '<button type="button" data-mv="up" data-pos="' + pos + '" aria-label="Move up"' + (pos === 0 ? ' disabled' : '') + '>&#9650;</button>' +
            '<button type="button" data-mv="down" data-pos="' + pos + '" aria-label="Move down"' + (pos === order.length - 1 ? ' disabled' : '') + '>&#9660;</button>' +
          '</span>') +
        '</li>';
      }).join('');
    }

    function rewire(submit){
      cardEl.querySelector('#orderList').innerHTML = listHtml(false);
      cardEl.querySelectorAll('[data-mv]').forEach(function(b){
        b.addEventListener('click', function(){
          var pos = parseInt(b.getAttribute('data-pos'), 10);
          var to = b.getAttribute('data-mv') === 'up' ? pos - 1 : pos + 1;
          if(to < 0 || to >= order.length) return;
          var tmp = order[pos]; order[pos] = order[to]; order[to] = tmp;
          rewire(submit);
        });
      });
    }

    return {
      html: '<ul class="order-list" id="orderList"></ul>' +
            '<div class="actions" style="justify-content:flex-start;"><button class="btn-press" id="checkBtn">Check answer</button></div>',
      attach: function(submit){
        rewire(submit);
        cardEl.querySelector('#checkBtn').addEventListener('click', function(){ submit({ order: order.slice() }); });
      },
      lock: function(){
        cardEl.querySelector('#checkBtn').remove();
        cardEl.querySelector('#orderList').innerHTML = listHtml(true);
        // Then show the correct ordering underneath, spelled out.
        cardEl.querySelector('#orderList').insertAdjacentHTML('afterend',
          '<div class="multi-note">Correct order: ' +
          esc(q.answer.map(function(i){ return q.items[i]; }).join('  ›  ')) + '</div>');
      }
    };
  }

  function rendererFor(q){
    switch(q.kind){
      case 'click-atom':  return renderClickAtom(q);
      case 'multi-click': return renderMultiClick(q);
      case 'arrow':       return renderArrow(q);
      case 'order':       return renderOrder(q);
      default:            return renderMcq(q);
    }
  }

  var KIND_LABEL = {
    'click-atom':'Identify on the molecule', 'multi-click':'Identify all that apply',
    'arrow':'Push the arrow', 'order':'Rank these',
    'predict':'Predict the product', 'mechanism':'Choose the mechanism',
    'mcq':'', 'tf':'True or false'
  };

  function renderQuestion(q){
    S.current = q;
    updateProgress();
    E.markSeen(q.id);

    var conceptId = (S.isCheck && S.checkConcept) ? S.checkConcept : E.primaryConcept(q);
    var concept = CO.get(conceptId);
    var kindLabel = KIND_LABEL[q.kind] || '';

    var head = '<div class="step-eyebrow">' +
      (S.isCheck ? 'Check &middot; ' : '') +
      esc(E.topicTitle(q.topic)) + (concept ? ' &middot; ' + esc(concept.title) : '') +
      '</div>' +
      '<div class="q-meta">' + tierChipHtml(q.tier || 2) +
        (kindLabel ? '<span class="tier-label">&middot; ' + esc(kindLabel) + '</span>' : '') +
      '</div>' +
      '<h2 class="step-title">' + esc(q.prompt || q.q) + '</h2>' +
      (q.sub ? '<p class="q-sub">' + esc(q.sub) + '</p>' : '') +
      (q.reaction ? '<div class="formula">' + esc(q.reaction) + '</div>' : '');

    var r = rendererFor(q);
    cardEl.innerHTML = head + r.html + '<div id="afterAnswer"></div>';

    var answered = false;
    r.attach(function(response){
      if(answered) return;
      answered = true;
      handleAnswer(q, response, r);
    });
  }

  function handleAnswer(q, response, renderer){
    var d = D.applyResult(q, response);
    renderer.lock(response, d.correct);

    S.asked++;
    if(!S.isCheck) S.index++;
    if(d.correct) S.correct++;
    var cid = E.primaryConcept(q);
    S.conceptsTouched[cid] = true;
    if(d.conceptId) S.conceptsTouched[d.conceptId] = true;
    S.askedIds.push(q.id);
    S.recentTopics.unshift(q.topic); S.recentTopics = S.recentTopics.slice(0, 4);
    S.recentConcepts.unshift(cid);   S.recentConcepts = S.recentConcepts.slice(0, 4);
    S.recentKinds.unshift(q.kind);   S.recentKinds = S.recentKinds.slice(0, 4);

    // Queue the "now apply the correction" question. Only after a real miss,
    // and never after a check question — otherwise a bad run turns into an
    // infinite corridor of remediation.
    var check = null;
    if(!d.correct && !S.isCheck){
      check = E.checkQuestion(d.conceptId, q.tier || 2, S.askedIds, q.kind);
      S.pendingCheck = check;
      // Remember what the check is FOR. A check question often lives under a
      // different topic and has its own primary concept — labelling it with
      // that would hide the fact that this is the same idea coming back.
      S.checkConcept = check ? d.conceptId : null;
    }

    document.getElementById('afterAnswer').innerHTML = feedbackHtml(q, d, check);
    wireFeedback();
  }

  function feedbackHtml(q, d, check){
    var html = '';

    if(d.correct){
      html += '<div class="diag good"><div class="k">Correct</div>' +
        '<p class="msg">' + esc(d.why) + '</p></div>';
    } else {
      html += '<div class="diag"><div class="k">' +
        (d.precise ? 'Here is what went wrong' : 'Not quite') + '</div>' +
        (d.whatYouDid ? '<div class="did">' + esc(d.whatYouDid) + '</div>' : '') +
        '<p class="msg">' + esc(d.diagnosis) + '</p>' +
        (d.why ? '<p class="msg">' + esc(d.why) + '</p>' : '') +
      '</div>';

      // The micro-lesson on the concept the mistake revealed, plus a route to
      // the full lesson if they want more than three sentences.
      if(d.concept){
        html += '<div class="teach-box">' +
          '<div class="k">The concept behind it</div>' +
          '<h3>' + esc(d.concept.title) + '</h3>' +
          '<p>' + esc(d.teach) + '</p>';
        var links = [];
        if(d.lessonTopic) links.push('<a href="' + d.lessonTopic.href + '">Full lesson: ' + esc(d.lessonTopic.title) + '</a>');
        if(d.lessonTopic) links.push('<a href="' + d.lessonTopic.href + '?notes=1">Just the notes</a>');
        if(links.length) html += '<div class="links">' + links.join('') + '</div>';
        if(d.prereqs && d.prereqs.length){
          html += '<div class="prereq-warn"><b>Worth checking first:</b> this builds on ' +
            esc(d.prereqs.map(function(p){ return CO.phrase(p.id); }).join(' and ')) +
            ', and you\'re at ' + pct(d.prereqs[0].strength) + '% there. Drilling this concept will keep stalling until that is solid.</div>';
        }
        html += '</div>';
      }
    }

    // What this answer did to the mastery profile — the engine's reasoning,
    // shown rather than hidden.
    if(d.moved && d.moved.length){
      html += '<div class="delta-row">' + d.moved.map(function(m){
        var c = CO.get(m.id);
        var up = m.before === null || m.after >= m.before;
        var arrow = m.before === null
          ? '→ ' + pct(m.after) + '% (first look)'
          : pct(m.before) + '% → ' + pct(m.after) + '%';
        return '<span class="delta-chip ' + (up ? 'up' : 'down') + '">' +
          esc(c ? c.title : m.id) + ' ' + esc(arrow) + '</span>';
      }).join('') + '</div>';
    }

    var lastMain = !S.isCheck && S.index >= S.count;
    var label = check ? 'Try a similar one'
              : (S.isCheck ? 'Continue' : (lastMain ? 'Finish session' : 'Next question'));
    html += '<div class="actions"><button class="btn-press" id="nextBtn">' + label + '</button></div>';
    return html;
  }

  function wireFeedback(){
    var btn = cardEl.querySelector('#nextBtn');
    if(btn) btn.addEventListener('click', advance);
  }

  quitBtn.addEventListener('click', function(){
    if(!S) { renderHome(); return; }
    if(S.asked === 0){ renderHome(); return; }
    renderSummary();
  });

  /* =====================================================================
     SUMMARY
     ===================================================================== */

  function renderSummary(){
    var asked = S.asked;
    var score = asked ? Math.round((S.correct / asked) * 100) : 0;

    M.recordSession({
      mode: S.plan.mode, asked: asked, correct: S.correct,
      concepts: Object.keys(S.conceptsTouched)
    });

    var touched = Object.keys(S.conceptsTouched).map(M.profile)
      .filter(function(p){ return p.attempts > 0; })
      .sort(function(a, b){ return a.strength - b.strength; });

    var comingBack = touched.filter(function(p){ return p.interval > 0; })
      .sort(function(a, b){ return a.due - b.due; });

    var html = '<div class="overall-card" style="margin-bottom:6px;">' +
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
    if(params.mode && ['adaptive','mistakes','due','quick','mixed'].indexOf(params.mode) !== -1){
      return E.makePlan(params.mode, { count: count });
    }
    return null;
  }

  var deepLink = planFromQuery();
  if(deepLink && E.availableCount(deepLink)) startSession(deepLink);
  else renderHome();
})();
