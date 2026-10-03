/* AP® Biology Practice (docs/apbio-spec.md section 1, "Question bank";
   forked from anatomy-physiology/assets/apps/practice.js).

   A set builder over the course question bank: unit, topic, science practice
   (1-6), question type (standalone, stimulus sets, numeric) and difficulty.
   The page fetches the bank's index first (ApBioCore.loadIndex: ids and tags,
   enough to build a set), then only the units the set draws from
   (loadQuestions), and each explanation after its question is answered
   (loadWhy, inside ApBioQuestions).

   A STEP is one standalone question or one whole stimulus set: a set is
   always served whole, its items in authored order under one panel, never
   split or shuffled (spec decision 6). A filter picks items; any set holding
   a picked item comes in whole.

   Modes: build a set (the filters), my weakest topics, questions I missed
   (retried until right, three tries at most). Deep links: ?unit=, ?topic=,
   ?practice=, ?type=standalone|sets|numeric, ?diff=1-3, ?mode=missed|weak;
   the address bar follows the builder, so any set is a stable, shareable
   link (spec section 1, "Teachers"), and it prints as a worksheet.

   Free tier: ApBioCore.serve per question shown (free units always; others
   draw on the daily allowance). The summary ends with the Premium card.

   SKILLS HOOK: a branch that adds skills items (tools data) can mix them in
   by defining window.ApBioSkills.practiceItems(filters) -> Promise of full
   items in the bank's item format (id, type, unit, topic, practice, level,
   diff, q, options/numeric, why). They join the pool as standalone steps
   when they match the filters; nothing else here needs to change. */
(function(){
  var BASE = window.ApBioBase || '';
  var app = document.getElementById('app');
  if(!app) return;
  var hero = document.querySelector('.bio-hero');
  var CUR = window.ApBioCurriculum || { units: [], topics: [], practices: [] };
  var Core = window.ApBioCore, Q = window.ApBioQuestions;
  var SITE = 'https://levlprep.com/bio/';

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function shuffle(a){ return Q ? Q.shuffle(a) : a.slice(); }
  function byId(list){ var o = {}; list.forEach(function(x){ o[x.id] = x; }); return o; }
  var TOPIC = byId(CUR.topics), UNIT = byId(CUR.units);
  var PRACTICE = {}; (CUR.practices || []).forEach(function(p){ PRACTICE[String(p.id)] = p; });
  function unitName(u){ var c = UNIT[u]; return c ? (c.part === 'course' ? 'Unit ' + c.n + ': ' : '') + c.title : u; }
  function lessonHref(t){ return BASE + 'lessons/' + t + '.html'; }
  function notesHref(t){ return BASE + 'notes/' + t + '.html'; }

  var KINDS = [
    { id: 'all', name: 'All types' },
    { id: 'standalone', name: 'Standalone questions' },
    { id: 'sets', name: 'Stimulus sets' },
    { id: 'numeric', name: 'Numeric answers' }
  ];
  var DIFFS = [{ id: '', name: 'Any' }, { id: '1', name: 'Easier' }, { id: '2', name: 'Medium' }, { id: '3', name: 'Harder' }];
  var MODES = [
    { id: 'build', title: 'Build a set', desc: 'Pick the unit, topic, practice, type and difficulty.' },
    { id: 'weak', title: 'My weakest topics', desc: 'Your lowest-mastery topics, mixed.' },
    { id: 'missed', title: 'Questions I missed', desc: 'Retried until you get each one right.' }
  ];
  var MODE = byId(MODES);
  var COUNTS = [5, 10, 20, 0];

  var stubs = null;      // index stubs, built topics only
  var blocks = null;     // steps: { stimulus, items: [stub], topic, unit }
  var skills = [];       // full items from the skills hook (if any)
  var state = { mode: 'build', unit: '', topic: '', practice: '', kind: 'all', diff: '', count: 10 };
  var session = null;

  /* ------------------------------------------------------------ data */

  function store(){ return Core ? Core.load() : { q: {}, lessons: {} }; }
  function builtTopics(){ return CUR.topics.filter(function(t){ return t.built && t.qn; }); }
  function builtUnits(){ var h = {}; builtTopics().forEach(function(t){ h[t.unit] = 1; }); return CUR.units.filter(function(u){ return h[u.id]; }); }
  function pill(){ return Core && Core.badge ? Core.badge() : ''; }

  /* Index order is authored order; a run of items sharing a stimulus in one
     topic is one set. */
  function makeBlocks(list){
    var out = [];
    list.forEach(function(q){
      var last = out[out.length - 1];
      if(q.stimulus && last && last.stimulus === q.stimulus && last.topic === q.topic) last.items.push(q);
      else out.push({ stimulus: q.stimulus || null, items: [q], topic: q.topic, unit: q.unit });
    });
    return out;
  }

  function matches(q, f){
    if(f.unit && q.unit !== f.unit) return false;
    if(f.topic && q.topic !== f.topic) return false;
    if(f.practice && String(q.practice || '').split('.')[0] !== f.practice) return false;
    if(f.diff && String(q.diff) !== f.diff) return false;
    if(f.kind === 'standalone' && q.stimulus) return false;
    if(f.kind === 'sets' && !q.stimulus) return false;
    if(f.kind === 'numeric' && q.type !== 'numeric') return false;
    return true;
  }
  function missedIds(){ var o = {}; (Core ? Core.missed() : []).forEach(function(id){ o[id] = 1; }); return o; }
  function weakTopics(){ return Core ? Core.weakest(3).filter(function(x){ return x.value < 0.8; }) : []; }

  /* The steps a mode and the filters select: whole sets, in index order. */
  function poolFor(mode){
    var pick;
    if(mode === 'missed'){ var m = missedIds(); pick = function(q){ return m[q.id]; }; }
    else if(mode === 'weak'){ var w = {}; weakTopics().forEach(function(x){ w[x.id] = 1; }); pick = function(q){ return w[q.topic]; }; }
    else pick = function(q){ return matches(q, state); };
    var out = blocks.filter(function(b){ return b.items.some(pick); });
    if(mode === 'build') skills.forEach(function(q){ if(matches(q, state) && state.kind !== 'sets') out.push({ stimulus: null, items: [q], topic: q.topic, unit: q.unit, skill: true }); });
    return out;
  }
  function itemCount(bs){ return bs.reduce(function(n, b){ return n + b.items.length; }, 0); }

  /* Never tried first, then missed, then the longest ago; a set counts as
     fresh when any of its items is. Mixed sets interleave topics. */
  function pickOrder(pool, mixed){
    var d = store(), fresh = [], wrong = [], right = [];
    function rec(b){ return b.items.map(function(q){ return d.q[q.id]; }); }
    shuffle(pool).forEach(function(b){
      var rs = rec(b);
      if(rs.some(function(r){ return !r || !r.n; })) fresh.push(b);
      else if(rs.some(function(r){ return !r.right; })) wrong.push(b);
      else right.push(b);
    });
    function seen(b){ return Math.max.apply(null, rec(b).map(function(r){ return (r && r.seen) || 0; })); }
    right.sort(function(a, b){ return seen(a) - seen(b); });
    var ordered = fresh.concat(wrong, right);
    if(!mixed) return ordered;
    var lanes = {}, order = [];
    ordered.forEach(function(b){ if(!lanes[b.topic]){ lanes[b.topic] = []; order.push(b.topic); } lanes[b.topic].push(b); });
    var out = [];
    while(out.length < ordered.length) order.forEach(function(t){ if(lanes[t].length) out.push(lanes[t].shift()); });
    return out;
  }
  /* Whole steps until the count is reached (a set may take it a little over). */
  function take(ordered, count){
    if(!count) return ordered;
    var out = [], n = 0;
    for(var i = 0; i < ordered.length && n < count; i++){ out.push(ordered[i]); n += ordered[i].items.length; }
    return out;
  }

  /* ------------------------------------------------------------ links */

  function query(){
    var p = new URLSearchParams();
    if(state.mode !== 'build') p.set('mode', state.mode);
    else ['unit', 'topic', 'practice', 'diff'].forEach(function(k){ if(state[k]) p.set(k, state[k]); });
    if(state.mode === 'build' && state.kind !== 'all') p.set('type', state.kind);
    return p.toString();
  }
  function syncUrl(){ try{ var q = query(); history.replaceState(null, '', location.pathname + (q ? '?' + q : '')); }catch(e){} }
  function shareHtml(){
    var url = SITE + 'practice.html' + (query() ? '?' + query() : '');
    var title = setLabel() + ': biology question set';
    return '<div class="bio-share" role="group" aria-label="Share or print this question set">' +
      '<a class="bio-share-btn" href="https://classroom.google.com/share?url=' + encodeURIComponent(url) + '&amp;title=' + encodeURIComponent(title) + '" target="_blank" rel="noopener">Share to Google Classroom<span class="sr-only"> (opens in a new tab)</span></a>' +
      '<button type="button" class="bio-share-btn" data-copy="' + esc(url) + '">Copy link</button>' +
      '<button type="button" class="bio-share-btn" data-act="worksheet">Print as a worksheet</button></div>' +
      '<label class="bio-ex-check bio-pr-keyopt"><input type="checkbox" id="bio-ws-key"> <span>Add the answer key on a separate page</span></label>';
  }

  /* ------------------------------------------------------------ setup */

  function view(name){
    if(hero) hero.classList.toggle('bio-hero-min', name !== 'setup');
    app.setAttribute('data-view', name);
    window.scrollTo(0, 0);
  }
  function setLabel(){
    if(state.mode !== 'build') return MODE[state.mode].title;
    var bits = [];
    if(state.topic && TOPIC[state.topic]) bits.push(TOPIC[state.topic].title);
    else if(state.unit && UNIT[state.unit]) bits.push(unitName(state.unit));
    else bits.push('Every published unit');
    if(state.practice) bits.push('Practice ' + state.practice);
    if(state.kind !== 'all') bits.push(KINDS.filter(function(k){ return k.id === state.kind; })[0].name.toLowerCase());
    if(state.diff) bits.push(DIFFS.filter(function(d){ return d.id === state.diff; })[0].name.toLowerCase());
    return bits.join(' · ');
  }
  function modeUnavailable(id){
    if(id === 'missed' && !poolFor('missed').length) return 'Nothing missed. Nice.';
    if(id === 'weak' && !poolFor('weak').length) return Core && Core.weakest(1).length ? 'No topic below 80% mastery.' : 'Answer some questions first.';
    return '';
  }
  function select(id, label, opts, val){
    return '<label class="bio-pr-field"><span>' + label + '</span><select id="' + id + '">' + opts.map(function(o){
      return o.group ? '<optgroup label="' + esc(o.group) + '">' + o.list.map(function(x){ return '<option value="' + esc(x.id) + '"' + (x.id === val ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</optgroup>'
        : '<option value="' + esc(o.id) + '"' + (o.id === val ? ' selected' : '') + '>' + esc(o.name) + '</option>';
    }).join('') + '</select></label>';
  }
  function filtersHtml(){
    var units = [{ id: '', name: 'Every published unit' }].concat(builtUnits().map(function(u){ return { id: u.id, name: unitName(u.id) }; }));
    var ts = builtTopics().filter(function(t){ return !state.unit || t.unit === state.unit; });
    var topics = [{ id: '', name: state.unit ? 'Every topic in the unit' : 'Every topic' }].concat(ts.map(function(t){ return { id: t.id, name: (t.ced ? t.ced + ' ' : '') + t.title }; }));
    var practices = [{ id: '', name: 'Every science practice' }].concat((CUR.practices || []).map(function(p){ return { id: String(p.id), name: p.id + '. ' + p.name }; }));
    return '<div class="bio-pr-filters">' + select('bio-pr-unit', 'Unit', units, state.unit) + select('bio-pr-topic', 'Topic', topics, state.topic) +
      select('bio-pr-practice', 'Science practice', practices, state.practice) + select('bio-pr-kind', 'Question type', KINDS, state.kind) +
      select('bio-pr-diff', 'Difficulty', DIFFS, state.diff) + '</div>';
  }
  function railHtml(){
    var d = store(), answered = 0;
    Object.keys(d.q || {}).forEach(function(k){ if(d.q[k].n) answered++; });
    var due = Core ? Core.reviewCount() : 0, miss = Object.keys(missedIds()).length;
    function tile(k, v, s){ return '<div class="bio-pr-stat"><span class="bio-pr-stat-k">' + k + '</span><span class="bio-pr-stat-v">' + v + '</span><span class="bio-pr-stat-s">' + s + '</span></div>'; }
    return '<aside class="bio-pr-rail" aria-labelledby="bio-pr-rail-h">' +
      '<h2 class="bio-pr-rail-k" id="bio-pr-rail-h">Your numbers</h2>' +
      '<div class="bio-pr-stats">' + tile('Answered', answered, answered ? 'questions and tool items' : 'nothing yet') +
        tile('Due for review', due, due ? 'waiting in your queue' : 'nothing due now') + tile('To fix', miss, miss ? 'missed, not yet right' : 'no open misses') +
        tile('Topics', builtTopics().length, 'published so far') + '</div>' +
      '<div class="bio-pr-rcard"><p class="bio-pr-rcard-k">Due for review' + pill() + '</p><h3>' + (due ? plural(due, 'item') + ' due now' : 'Your queue is clear') + '</h3>' +
        '<p>Questions you miss come back on a spacing schedule, so they stick.</p><a class="bio-pr-rcard-more" href="' + BASE + 'review.html">' + (due ? 'Start your review' : 'Open review') + ' <span aria-hidden="true">&rarr;</span></a></div>' +
      '<a class="bio-pr-exam bio-pr-fc" href="' + BASE + 'frq.html"><span class="bio-pr-exam-t">Free-response practice<small>All six types, with rubrics.</small></span><span class="bio-pr-exam-go" aria-hidden="true">&rarr;</span></a>' +
      '<a class="bio-pr-exam" href="' + BASE + 'exams.html"><span class="bio-pr-exam-t">Ready for a timed test?<small>Unit tests and full practice exams.</small></span><span class="bio-pr-exam-go" aria-hidden="true">&rarr;</span></a>' +
    '</aside>';
  }
  function allowanceHtml(){
    var a = Core && Core.quota ? Core.quota() : null;
    if(!a || a.limit === Infinity) return '';
    return '<p class="bio-small bio-pr-allow">Free: Units 1 and 2 are unlimited. Questions from other units: <b>' + a.left + ' of ' + a.limit + '</b> left today, shared with review.' + pill() + '</p>';
  }
  function sumText(){
    var pool = poolFor(state.mode), n = itemCount(pool);
    if(!n) return 'No questions match yet. Loosen a filter.';
    var sets = pool.filter(function(b){ return b.stimulus; }).length;
    var k = state.count ? Math.min(state.count, n) : n;
    return (state.count && state.count < n ? 'About ' : 'All ') + plural(k, 'question') + ' of ' + n + ' that match' + (sets ? ' (' + plural(sets, 'stimulus set') + ' among them, each kept whole)' : '') + '.';
  }

  function renderSetup(){
    view('setup');
    if(modeUnavailable(state.mode)) state.mode = 'build';
    app.innerHTML = '<div class="bio-pr-grid">' +
      '<form class="bio-pr-setup" novalidate aria-label="Build a practice set">' +
        '<fieldset class="bio-pr-step bio-pr-modes"><legend class="bio-pr-step-h"><span class="bio-pr-n" aria-hidden="true">1</span>What do you want to practice?</legend><div class="bio-pr-mode-grid">' +
          MODES.map(function(m){
            var why = modeUnavailable(m.id);
            return '<label class="bio-pr-mode' + (why ? ' is-off' : '') + '"><input type="radio" name="mode" value="' + m.id + '"' + (m.id === state.mode ? ' checked' : '') + (why ? ' disabled' : '') + '><span class="bio-pr-mode-t">' + esc(m.title) + '</span><span class="bio-pr-mode-d">' + esc(why || m.desc) + '</span></label>';
          }).join('') + '</div></fieldset>' +
        '<div class="bio-pr-step bio-pr-pickstep"><h2 class="bio-pr-step-h"><span class="bio-pr-n" aria-hidden="true">2</span><span class="bio-pr-pick-h"></span></h2><div class="bio-pr-pick"></div></div>' +
        '<fieldset class="bio-pr-step bio-pr-count"><legend class="bio-pr-step-h"><span class="bio-pr-n" aria-hidden="true">3</span>How many questions?</legend><div class="bio-pr-chips">' +
          COUNTS.map(function(n){ return '<label class="bio-pr-chip"><input type="radio" name="count" value="' + n + '"' + (n === state.count ? ' checked' : '') + '><span>' + (n || 'All') + '</span></label>'; }).join('') + '</div></fieldset>' +
        '<div class="bio-pr-go"><p class="bio-pr-sum" aria-live="polite"><span class="bio-pr-sum-main"></span><small>Feedback after every answer. Stimulus sets stay whole and in order. Misses go to your review queue.</small></p>' +
          '<button type="submit" class="btn-press bio-pr-start">Start practice</button></div>' +
        '<div class="bio-pr-sharewrap"></div>' + allowanceHtml() +
      '</form>' + railHtml() + '</div>';
    var form = app.querySelector('form');
    function paintPick(){
      var stepEl = app.querySelector('.bio-pr-pickstep'), h = '', html = '';
      if(state.mode === 'build'){ h = 'Choose the questions'; html = filtersHtml(); }
      else if(state.mode === 'weak'){ var w = weakTopics(); h = 'Where you are weakest'; html = '<p class="bio-small">' + (w.length ? 'Lowest mastery right now: ' + w.map(function(x){ return esc(x.title) + ' (' + Core.pct(x.value) + ')'; }).join(', ') + '.' : '') + '</p>'; }
      app.querySelector('.bio-pr-pick-h').textContent = h;
      app.querySelector('.bio-pr-pick').innerHTML = html;
      stepEl.hidden = !html;
      app.querySelector('.bio-pr-count .bio-pr-n').textContent = html ? '3' : '2';
    }
    function refresh(){
      var n = itemCount(poolFor(state.mode));
      app.querySelector('.bio-pr-sum-main').textContent = sumText();
      app.querySelector('.bio-pr-start').disabled = !n;
      app.querySelector('.bio-pr-sharewrap').innerHTML = n ? shareHtml() : '';
      syncUrl();
    }
    form.addEventListener('change', function(e){
      var t = e.target;
      if(t.name === 'mode'){ state.mode = t.value; paintPick(); }
      else if(t.name === 'count') state.count = +t.value;
      else if(t.id === 'bio-pr-unit'){ state.unit = t.value; if(state.topic && TOPIC[state.topic].unit !== state.unit && state.unit) state.topic = ''; paintPick(); var u = app.querySelector('#bio-pr-unit'); if(u) u.focus(); }
      else if(t.id === 'bio-pr-topic') state.topic = t.value;
      else if(t.id === 'bio-pr-practice') state.practice = t.value;
      else if(t.id === 'bio-pr-kind') state.kind = t.value;
      else if(t.id === 'bio-pr-diff') state.diff = t.value;
      if(t.id !== 'bio-ws-key') refresh();
    });
    form.addEventListener('click', function(e){ var b = e.target.closest('[data-act="worksheet"]'); if(b){ e.preventDefault(); worksheet(b); } });
    form.addEventListener('submit', function(e){ e.preventDefault(); start(state.mode, state.count); });
    paintPick(); refresh();
  }

  /* ------------------------------------------------------------ worksheet */

  var LETTERS = 'ABCDEFGH';
  function strip(h){ return String(h || '').replace(/<[^>]+>/g, ''); }
  function wsItem(q, n){
    var body = '', key = '';
    if(q.type === 'numeric'){
      var N = q.numeric || {};
      body = '<p class="bio-ws-blank">Answer: ____________ ' + esc(N.unit || '') + (N.decimals != null ? ' (round to ' + plural(N.decimals, 'decimal place') + ')' : '') + '</p>';
      key = Number(N.answer).toFixed(N.decimals != null ? N.decimals : 2) + (N.unit ? ' ' + N.unit : '');
    } else if(q.type === 'predict'){
      body = '<table class="bio-ws-pred"><thead><tr><th scope="col">Variable</th><th scope="col">Increases, decreases or no change</th></tr></thead><tbody>' + q.variables.map(function(v){ return '<tr><th scope="row">' + v.name + '</th><td></td></tr>'; }).join('') + '</tbody></table>';
      key = q.variables.map(function(v){ return strip(v.name) + ': ' + (v.answer === 'up' ? 'increases' : v.answer === 'down' ? 'decreases' : 'no change'); }).join('; ');
    } else if(q.type === 'order'){
      var cur = Q.orderStart(q.options.length);
      body = '<p class="bio-small">Number these in order.</p><ul class="bio-ws-order">' + cur.map(function(i){ return '<li>____ ' + q.options[i] + '</li>'; }).join('') + '</ul>';
      key = q.options.map(function(o, i){ return (i + 1) + '. ' + strip(o); }).join(' ');
    } else {
      var ord = Q.displayOrder(q), keyIdx = [].concat(q.correct);
      body = (q.type === 'multi' ? '<p class="bio-small">Select all that apply.</p>' : '') + '<ol class="bio-ws-opts" type="A">' + ord.map(function(i){ return '<li>' + q.options[i] + '</li>'; }).join('') + '</ol>';
      key = ord.map(function(i, k){ return keyIdx.indexOf(i) > -1 ? LETTERS[k] : ''; }).filter(Boolean).join(', ');
    }
    return { html: '<div class="bio-ws-q"><p class="bio-ws-stem"><b>' + n + '.</b> ' + q.q + '</p>' + body + '</div>', key: '<li value="' + n + '">' + esc(key) + '</li>' };
  }
  function printOnly(html){
    var box = document.getElementById('bio-print');
    if(!box){ box = document.createElement('div'); box.id = 'bio-print'; document.body.appendChild(box); }
    box.innerHTML = html;
    document.body.classList.add('bio-printing');
    var done = function(){ document.body.classList.remove('bio-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  }
  function worksheet(btn){
    var picked = take(pickOrder(poolFor(state.mode), state.mode !== 'build' || !state.topic), state.count);
    var withKey = !!(app.querySelector('#bio-ws-key') || {}).checked;
    var list = [];
    picked.forEach(function(b){ if(!b.skill) b.items.forEach(function(q){ list.push(q); }); });
    var free = Core && Core.locked ? list.filter(function(q){ return !Core.locked(q.unit, q.topic); }) : list;
    var left = list.length - free.length;
    if(!free.length){ app.querySelector('.bio-pr-sharewrap').insertAdjacentHTML('beforeend', Core.gate('question-bank', 'practice-print')); return; }
    btn.disabled = true;
    Core.loadQuestions(BASE, free).then(function(qs){
      btn.disabled = false;
      var n = 0, keys = [];
      var html = Q.group(qs).map(function(g){
        var items = g.items.map(function(q){ var w = wsItem(q, ++n); keys.push(w.key); return w.html; }).join('');
        var s = g.stimulus && g.items[0].stim;
        return s ? '<div class="bio-set">' + Q.stimulusPanel(g.stimulus, s) + items + '</div>' : items;
      }).join('');
      printOnly('<div class="bio-ws"><p class="bio-ws-head">Name: ________________________ &nbsp; Date: ____________</p>' +
        '<h1 class="bio-ws-title">' + esc(setLabel()) + '</h1><p class="bio-small">LevlPrep biology question set &middot; ' + plural(n, 'question') + (left ? ' &middot; ' + plural(left, 'Premium question') + ' left out' : '') + '</p>' + html +
        (withKey ? '<section class="bio-ws-key"><h2>Answer key</h2><ol>' + keys.join('') + '</ol></section>' : '') + '</div>');
    }).catch(function(){ btn.disabled = false; });
  }

  /* ------------------------------------------------------------ session */

  function start(mode, count, fixed){
    var pool = fixed || poolFor(mode);
    if(!pool.length) return;
    var picked = fixed ? fixed : take(pickOrder(pool, mode !== 'build' || !state.topic), count);
    var btn = app.querySelector('.bio-pr-start');
    if(btn){ btn.disabled = true; btn.textContent = 'Loading questions…'; }
    var bankStubs = [];
    picked.forEach(function(b){ if(!b.skill) b.items.forEach(function(q){ bankStubs.push(q); }); });
    Core.loadQuestions(BASE, bankStubs).then(function(full){
      var by = {}; full.forEach(function(q){ by[q.id] = q; });
      var steps = picked.map(function(b){ return { stimulus: b.stimulus, items: b.skill ? b.items : b.items.map(function(q){ return by[q.id]; }).filter(Boolean) }; })
        .filter(function(s){ return s.items.length; });
      if(!steps.length) throw new Error('empty');
      begin(mode, steps);
    }).catch(function(){
      if(btn){ btn.disabled = false; btn.textContent = 'Start practice'; }
      var sum = app.querySelector('.bio-pr-sum-main');
      if(sum) sum.textContent = 'Those questions did not load. Check your connection and try again.';
    });
  }

  function begin(mode, steps){
    session = { mode: mode, label: mode === 'retry' ? 'Retrying your misses' : setLabel(), steps: steps, i: 0, results: [], firstTry: {}, tries: {}, retry: mode === 'missed' || mode === 'retry', finished: false };
    session.total = itemCount(steps);
    view('session');
    app.innerHTML = '<div class="bio-pr-session">' +
      '<div class="bio-pr-bar"><span class="bio-pr-label">' + esc(session.label) + '</span><span class="bio-pr-count-l" aria-live="polite"></span>' +
        '<button type="button" class="btn-outline bio-pr-quit">End session</button></div>' +
      '<div class="track thin bio-pr-track" aria-hidden="true"><i style="width:0%"></i></div>' +
      '<h2 class="sr-only">Questions</h2><div class="bio-pr-stage"></div><div class="bio-pr-after" hidden></div></div>';
    app.querySelector('.bio-pr-quit').addEventListener('click', finish);
    ask();
  }
  function done(){ return session.results.length; }
  function progress(){
    var total = itemCount(session.steps);
    app.querySelector('.bio-pr-count-l').textContent = done() + ' of ' + plural(total, 'question') + ' answered';
    app.querySelector('.bio-pr-track i').style.width = Math.round(Math.min(1, done() / total) * 100) + '%';
  }

  function ask(){
    if(session.i >= session.steps.length) return finish();
    var step = session.steps[session.i];
    var stage = app.querySelector('.bio-pr-stage'), after = app.querySelector('.bio-pr-after');
    stage.innerHTML = ''; after.hidden = true; after.innerHTML = '';
    progress();
    // The whole set is served or none of it (free tier, ApBioCore.serve).
    var ok = step.items.every(function(q){ return Core.serve(q); });
    if(!ok){
      stage.innerHTML = Core.gate('daily-limit', 'practice-limit', step.items[0].topic) +
        '<div class="bio-pr-actions">' + (session.results.length ? '<button type="button" class="btn-press" data-act="results">See your results</button>' : '') +
        '<a class="btn-outline" href="' + BASE + 'practice.html?unit=unit-1">Practice Unit 1</a></div>';
      var r = stage.querySelector('[data-act="results"]');
      if(r) r.addEventListener('click', finish);
      return;
    }
    var left = step.items.length, n0 = done();
    Q.hydrate(stage, step.items, { onAnswer: function(res){ answered(res.q, res); if(--left === 0) stepDone(step); } });
    // Number the questions across the session.
    stage.querySelectorAll('.bio-q-n').forEach(function(el, k){ el.textContent = (n0 + k + 1) + '.'; });
    var first = stage.querySelector('.bio-stim h3') || stage.querySelector('.bio-q-stem');
    if(first){ first.setAttribute('tabindex', '-1'); try{ first.focus({ preventScroll: true }); }catch(e){ first.focus(); } }
    window.scrollTo(0, 0);
  }

  function answered(q, res){
    session.tries[q.id] = (session.tries[q.id] || 0) + 1;
    if(!(q.id in session.firstTry)){ session.firstTry[q.id] = res.correct; session.results.push({ q: q, correct: res.correct, score: res.score }); }
    progress();
  }
  function stepDone(step){
    // Missed mode: a step with a miss comes back at the end (three tries at most).
    var again = session.retry && step.items.some(function(q){ return !store().q[q.id] || !store().q[q.id].right; }) && step.items.every(function(q){ return session.tries[q.id] < 3; });
    if(again) session.steps.push(step);
    var t = TOPIC[step.items[0].topic];
    var after = app.querySelector('.bio-pr-after');
    var last = session.i + 1 >= session.steps.length;
    after.innerHTML = '<p class="bio-pr-from">' + (t ? 'From <a href="' + lessonHref(t.id) + '">' + esc(t.title) + '</a> <span aria-hidden="true">&middot;</span> <a href="' + notesHref(t.id) + '">notes</a>' : '') +
      (again ? ' <span class="bio-pr-again">This comes back later in the session.</span>' : '') + '</p>' +
      '<button type="button" class="btn-press bio-pr-next">' + (last ? 'See your results' : 'Next') + '</button>';
    after.hidden = false;
    var next = after.querySelector('.bio-pr-next');
    next.addEventListener('click', function(){ session.i++; ask(); });
    try{ next.focus({ preventScroll: true }); }catch(e){ next.focus(); }
  }

  /* ------------------------------------------------------------ summary */

  function tally(res, key){
    var out = {}, order = [];
    res.forEach(function(r){ var k = key(r.q); if(!k) return; if(!out[k]){ out[k] = { n: 0, c: 0 }; order.push(k); } out[k].n++; if(r.correct) out[k].c++; });
    return order.map(function(k){ return { key: k, n: out[k].n, c: out[k].c }; });
  }
  function finish(){
    if(!session || session.finished) return;
    session.finished = true;
    var res = session.results, right = res.filter(function(r){ return r.correct; }).length;
    if(res.length && Core) Core.event('apbio-session-finish', { mode: session.mode === 'retry' ? 'missed' : session.mode, answered: res.length, correct: right });
    if(!res.length){ renderSetup(); return; }
    var byTopic = tally(res, function(q){ return q.topic; });
    var byPractice = tally(res, function(q){ return String(q.practice || '').split('.')[0]; }).sort(function(a, b){ return a.key - b.key; });
    var stillWrong = [];
    session.steps.forEach(function(s){ if(stillWrong.indexOf(s) < 0 && s.items.some(function(q){ var r = store().q[q.id]; return q.id in session.firstTry && (!r || !r.right); })) stillWrong.push(s); });
    var weak = byTopic.filter(function(x){ return x.c < x.n; }).sort(function(a, b){ return a.c / a.n - b.c / b.n; });
    var pctRight = Math.round(right / res.length * 100);
    view('summary');
    app.innerHTML = '<div class="bio-pr-summary">' +
      '<div class="bio-pr-score"><span class="bio-pr-score-big">' + right + '<small>/' + res.length + '</small></span>' +
        '<span><b>' + pctRight + '% right on the first try</b><span class="bio-small">' + esc(session.label) + '</span></span></div>' +
      '<h2>What to study next</h2>' + (weak.length ? '<ul class="bio-pr-next-list">' + weak.slice(0, 4).map(function(x){
          return '<li><div><b>' + esc(TOPIC[x.key] ? TOPIC[x.key].title : x.key) + '</b><span class="bio-small">' + (x.n - x.c) + ' of ' + x.n + ' missed</span></div>' +
            '<a class="btn-outline" href="' + lessonHref(x.key) + '">Lesson</a><a class="btn-outline" href="' + notesHref(x.key) + '">Notes</a></li>';
        }).join('') + '</ul>' : '<p>Everything right. Try a timed <a href="' + BASE + 'exams.html">unit test</a> to test it under time.</p>') +
      '<h2>By topic</h2><div class="table-wrap" tabindex="0" role="region" aria-label="Results by topic"><table class="bio-pr-table"><thead><tr><th scope="col">Topic</th><th scope="col">Right</th><th scope="col">Mastery now</th></tr></thead><tbody>' +
        byTopic.map(function(x){ var m = Core.topicMastery(x.key); return '<tr><th scope="row"><a href="' + lessonHref(x.key) + '">' + esc(TOPIC[x.key] ? TOPIC[x.key].title : x.key) + '</a></th><td>' + x.c + '/' + x.n + '</td><td>' + Core.pct(m.value) + '</td></tr>'; }).join('') +
      '</tbody></table></div>' +
      '<h2>By science practice</h2><div class="table-wrap" tabindex="0" role="region" aria-label="Results by science practice"><table class="bio-pr-table"><thead><tr><th scope="col">Practice</th><th scope="col">Right</th></tr></thead><tbody>' +
        byPractice.map(function(x){ var p = PRACTICE[x.key]; return '<tr><th scope="row">' + esc(x.key + (p ? '. ' + p.name : '')) + '</th><td>' + x.c + '/' + x.n + '</td></tr>'; }).join('') +
      '</tbody></table></div>' +
      '<div class="bio-pr-actions">' +
        (stillWrong.length ? '<button type="button" class="btn-press" data-act="retry">Retry the ' + plural(stillWrong.length, 'miss', 'misses') + '</button>' : '') +
        '<button type="button" class="btn-press' + (stillWrong.length ? ' alt' : '') + '" data-act="again">Another set like this</button>' +
        '<button type="button" class="btn-outline" data-act="setup">Change the set</button>' +
        (Core.reviewCount() ? '<a class="btn-outline" href="' + BASE + 'review.html">Review queue (' + Core.reviewCount() + ' due)</a>' : '') +
      '</div>' +
      (window.LevlPremium && window.LevlPremium.card && res.length >= 5 ? window.LevlPremium.card('apbio', 'summary') : '') +
      '</div>';
    var mode = session.mode;
    app.querySelectorAll('[data-act]').forEach(function(b){
      b.addEventListener('click', function(){
        var a = b.getAttribute('data-act');
        if(a === 'retry') start('retry', 0, stillWrong);
        else if(a === 'again'){ if(mode === 'retry' || !poolFor(mode).length) renderSetup(); else start(mode, state.count); }
        else renderSetup();
      });
    });
    var h = app.querySelector('.bio-pr-score'); h.setAttribute('tabindex', '-1'); h.focus();
  }

  /* ------------------------------------------------------------ boot */

  function boot(){
    if(!Q || !Core){ app.innerHTML = '<p>Practice could not start. Reload the page to try again.</p>'; return; }
    app.innerHTML = '<p class="bio-small bio-pr-loading">Loading the question bank…</p>';
    var hook = window.ApBioSkills && typeof window.ApBioSkills.practiceItems === 'function'
      ? Promise.resolve(window.ApBioSkills.practiceItems()).then(function(x){ return Array.isArray(x) ? x : []; }, function(){ return []; }) : Promise.resolve([]);
    Promise.all([Core.loadIndex(BASE), hook]).then(function(r){
      stubs = r[0].filter(function(q){ return TOPIC[q.topic] && TOPIC[q.topic].built; });
      skills = r[1].filter(function(q){ return q && q.id && q.topic && q.unit; });
      blocks = makeBlocks(stubs);
      if(!blocks.length && !skills.length){ app.innerHTML = '<p>No practice questions are published yet. Meanwhile, read the <a href="' + BASE + 'learn.html">free notes</a>.</p>'; return; }
      var p = new URLSearchParams(location.search);
      if(UNIT[p.get('unit')] && builtUnits().some(function(u){ return u.id === p.get('unit'); })) state.unit = p.get('unit');
      if(TOPIC[p.get('topic')] && TOPIC[p.get('topic')].built){ state.topic = p.get('topic'); state.unit = TOPIC[state.topic].unit; }
      if(PRACTICE[p.get('practice')]) state.practice = p.get('practice');
      if(KINDS.some(function(k){ return k.id === p.get('type'); })) state.kind = p.get('type');
      if(/^[123]$/.test(p.get('diff') || '')) state.diff = p.get('diff');
      if(MODE[p.get('mode')]) state.mode = p.get('mode');
      renderSetup();
      if(p.toString()){ var s = app.querySelector('.bio-pr-start'); if(s && !s.disabled) s.focus(); }
    }).catch(function(){
      app.innerHTML = '<p>The question bank did not load. Check your connection and reload; once a page has loaded online it also works offline.</p>';
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
