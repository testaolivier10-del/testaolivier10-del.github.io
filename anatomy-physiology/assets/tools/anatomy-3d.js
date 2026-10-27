/* A&P 3D anatomy (docs/tools-upgrade.md "3D anatomy", docs/anp-spec.md
   section 8.1 and decision 91).

   The NREMT body map's model and engine (assets/body3d/viewer.js,
   LevlBodyViewer) with A&P content: data/tools/anatomy-3d.json, read from
   #app[data-src]. Each structure is one or more meshes of the BodyParts3D
   model, named by FMA id; the names were confirmed, never guessed, and the
   validator (scripts/lib/anp-tool-checks/anatomy-3d.mjs) keeps the data tied
   to the model.

   Modes, the same four as the virtual lab practical:
     Explore  tap any structure: its name on the model, and in Why what it is,
              where it is, its key features, related structures and the lesson
              and notes that teach it. Tapping one piece of a group (a carpal,
              a vertebra, a rib) also says which piece it is.
     Study    names hidden: tap a structure, name it to yourself, then reveal.
     Quiz     rounds of 10: "name it" (a structure is highlighted; type its
              name or choose it) and "point to it" (a name is given; tap it on
              the model, or pick it by name in Details). Scored.
     Timed    stations against the clock, no going back, a review of every
              station at the end.
   Filters (Details): by body system or by A&P chapter. Structures outside the
   filter stay as a faint ghost for orientation and are never asked.

   Scoring: AnpCore.toolResult('anatomy-3d', ...) (XP, mastery for the
   structure's topic, misses into the review queue, accuracy by chapter on the
   dashboard). Item ids, stable forever:
     anatomy-3d:<structure>:name    anatomy-3d:<structure>:point
   Review links back to tools/anatomy-3d.html#<structure>, which starts a quiz
   on that structure. Events: anp-lab-station { set: 'anatomy-3d', correct }
   per answer, anp-practical-finish { stations, correct } after Timed.
   Deep links: #explore #study #quiz #timed #<structure>, ?system=, ?chapter=
   (from the tools hub), ?focus=<structure id or name>. */
(function(){
  'use strict';
  var KIND = 'anatomy-3d';
  var app = document.getElementById('app');
  if(!app) return;   // a Premium gate replaced the mount (AnpCore.mountPremium)
  var BASE = window.ANP_BASE || '../';
  var SRC = app.getAttribute('data-src') || (BASE + 'assets/tool-data/anatomy-3d.json');
  var PREFS_KEY = 'anp_3d_prefs_v1';
  var Q = new URLSearchParams(location.search);

  /* ------------------------------------------------------------ helpers */
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function cur(){ return window.AnpCurriculum || { chapters: [], topics: [] }; }
  function topicInfo(id){ var ts = cur().topics; for(var i = 0; i < ts.length; i++) if(ts[i].id === id) return ts[i]; return null; }
  function chapterInfo(id){ var cs = cur().chapters; for(var i = 0; i < cs.length; i++) if(cs[i].id === id) return cs[i]; return null; }
  function core(){ return window.AnpCore || null; }
  function report(id){ return window.LevlReport ? window.LevlReport.button('anp', id) : ''; }
  function loadPrefs(){ try{ return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {}; }catch(e){ return {}; } }
  var PREFS = loadPrefs();
  function pref(k, d){ return PREFS[k] == null ? d : PREFS[k]; }
  function setPref(k, v){ PREFS[k] = v; try{ localStorage.setItem(PREFS_KEY, JSON.stringify(PREFS)); }catch(e){} }
  var touch = (function(){ try{ return matchMedia('(pointer: coarse)').matches; }catch(e){ return false; } })();
  function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }

  /* --------------------------------------------------------------- data */
  var DATA = null, BY = {}, LIST = [], viewer = null;
  function chapterOf(s){ var t = topicInfo(s.topic); return t ? t.chapter : ''; }
  function hex(c){ return c ? parseInt(String(c).replace('#', ''), 16) : undefined; }
  function content(){
    var groups = {}, parts = {};
    LIST.forEach(function(s){
      groups[s.id] = { name: s.name, system: s.system, kind: s.kind, color: hex(s.color), opacity: s.opacity, inner: s.inner };
      s.parts.forEach(function(p){ parts[p] = s.id; });
    });
    if((DATA.context || []).length){
      groups._context = { name: 'Unconfirmed mesh', system: 'skeletal', kind: 'bone', color: 0xD9E2E6, context: true };
      DATA.context.forEach(function(p){ parts[p] = '_context'; });
    }
    return { groups: groups, parts: parts, points: [], systems: DATA.systems, order: DATA.order };
  }

  /* ------------------------------------------------------------ answers
     Forgiving but not sloppy (the lab practical's rule): case, punctuation,
     a leading "the", a parenthetical and a plural s do not matter; a slip of
     one letter (two in a long name) is accepted with the right spelling shown;
     an answer closer to another structure's name is that structure. */
  function norm(s){
    s = String(s == null ? '' : s).toLowerCase();
    if(s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    s = s.replace(/\([^)]*\)/g, ' ').replace(/&/g, ' and ').replace(/[’'`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/^the /, '');
    return s.split(' ').filter(Boolean).map(function(w){ return w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w; }).join(' ');
  }
  function dist(a, b){
    var m = a.length, n = b.length, d = [], i, j;
    if(Math.abs(m - n) > 3) return 99;
    for(i = 0; i <= m; i++) d[i] = [i];
    for(j = 0; j <= n; j++) d[0][j] = j;
    for(i = 1; i <= m; i++) for(j = 1; j <= n; j++){
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if(i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[m][n];
  }
  function tol(k){ var n = k.replace(/ /g, '').length; return n <= 4 ? 0 : n <= 9 ? 1 : 2; }
  function variants(s){
    var v = [norm(s.name)];
    (s.accept || []).forEach(function(a){ var k = norm(a); if(k && v.indexOf(k) < 0) v.push(k); });
    return v;
  }
  function grade(answer, s){
    var key = norm(answer);
    if(!key) return { ok: false, empty: true };
    var mine = variants(s);
    if(mine.indexOf(key) > -1) return { ok: true, exact: true };
    var best = 99, bestOther = 99, other = null;
    mine.forEach(function(k){ best = Math.min(best, dist(key, k)); });
    LIST.forEach(function(o){
      if(o === s) return;
      variants(o).forEach(function(k){ var d = k === key ? -1 : dist(key, k); if(d < bestOther){ bestOther = d; other = o; } });
    });
    if(bestOther === -1) return { ok: false, near: other };
    var tk = mine.reduce(function(t, k){ return Math.max(t, tol(k)); }, 0);
    if(best <= tk && best < bestOther) return { ok: true, exact: false };
    if(other && bestOther <= tol(norm(other.name)) && bestOther < best) return { ok: false, near: other };
    return { ok: false };
  }

  /* ------------------------------------------------------------ filters */
  var filter = { system: '', chapter: '' };
  function inFilter(s){
    if(filter.system && s.system !== filter.system) return false;
    if(filter.chapter && chapterOf(s) !== filter.chapter) return false;
    return true;
  }
  function inPlay(){ return LIST.filter(inFilter); }
  function askable(){ return inPlay().filter(function(s){ return s.quiz !== false; }); }
  function filterLabel(){
    if(filter.system) return DATA.systems[filter.system];
    if(filter.chapter){ var c = chapterInfo(filter.chapter); return c ? c.title : filter.chapter; }
    return 'the whole body';
  }
  function applyFilter(){
    var only = (filter.system || filter.chapter) ? inPlay().map(function(s){ return s.id; }).concat(['skin']) : null;
    if(viewer) viewer.setOnly(only);
    if(filterInfo) filterInfo.textContent = plural(inPlay().length, 'structure') + ' in play, ' + askable().length + ' in the quizzes.';
    paintFilterPill();
  }

  /* ------------------------------------------------------------- studio */
  var ST = window.AnpToolKit && window.AnpToolKit.studio ? window.AnpToolKit.studio({ detailsTitle: 'Filter & options' }) : null;
  function put(region, els, o){
    if(ST) ST.put(region, els, o);
    else [].concat(els).forEach(function(x){ app.appendChild(x); });
  }
  function caption(html){ if(ST) ST.caption(html); else capFallback.innerHTML = html; }
  function pills(list, side){ if(ST) ST.pills(list || [], side || 'left'); }
  var capFallback = el('p', 'a3-cap-fb');
  if(!ST){ app.classList.remove('kt-staging'); app.appendChild(capFallback); }

  var stage = el('div', 'a3-stage');
  stage.innerHTML = '<noscript>The 3D model needs JavaScript.</noscript>';
  var anchor = el('span', 'a3-anchor'); anchor.setAttribute('aria-hidden', 'true');
  stage.appendChild(anchor);
  var dockRow = el('div', 'ls-row a3-row');
  var dockQ = el('div', 'a3-q');            // the current question, answer box, verdict
  var live = el('p', 'a3-sr'); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
  var why = el('div', 'a3-why');            // the card for the selected structure, or the round review
  var det = el('div', 'a3-det');
  var filterInfo = null;
  put('stage', stage);
  put('dock', [dockRow, dockQ, live]);
  put('why', why);
  put('details', det);
  if(ST) ST.root.classList.add('a3-ls');
  caption('Loading the 3D body…');

  var MODE = 'explore';
  if(ST) ST.modes({ items: [{ value: 'explore', label: 'Explore' }, { value: 'study', label: 'Study' }, { value: 'quiz', label: 'Quiz' }, { value: 'timed', label: 'Timed' }],
    value: 'explore', onChange: function(v){ go(v); } });

  /* --------------------------------------------------------- the card */
  function topicLinks(s){
    var t = topicInfo(s.topic);
    if(!t) return '';
    var ch = chapterInfo(t.chapter);
    return '<p class="a3-taught">Taught in <b>' + esc(t.title) + '</b>' + (ch ? ' <span class="a3-muted">(' + esc(ch.n + '. ' + ch.title) + ')</span>' : '') + '</p>';
  }
  function card(s, part){
    var pn = part && DATA.partNames[part];
    var rel = (s.related || []).map(function(r){ return BY[r]; }).filter(Boolean);
    return '<article class="a3-card">' +
      '<p class="a3-cat">' + esc(DATA.systems[s.system] || s.system) + '</p>' +
      '<h3 class="a3-name">' + esc(s.name) + '</h3>' +
      (pn && pn !== s.name ? '<p class="a3-part">You tapped: <b>' + esc(pn) + '</b></p>' : '') +
      '<dl class="a3-dl"><dt>What it is</dt><dd>' + esc(s.what) + '</dd><dt>Where it is</dt><dd>' + esc(s.where) + '</dd><dt>Key features</dt><dd>' + esc(s.features) + '</dd></dl>' +
      (s.note ? '<p class="a3-muted">' + esc(s.note) + '</p>' : '') +
      (rel.length ? '<p class="a3-k">Related structures</p><div class="a3-rel">' + rel.map(function(r){ return '<button type="button" class="a3-chip" data-go="' + esc(r.id) + '">' + esc(r.name) + '</button>'; }).join('') + '</div>' : '') +
      topicLinks(s) + '<div class="a3-kg"></div>' +
    '</article>';
  }
  function showCard(s, part){
    why.innerHTML = card(s, part);
    if(window.AnpToolKit && window.AnpToolKit.strip) window.AnpToolKit.strip(why.querySelector('.a3-kg'), { topic: s.topic, text: s.name + ' ' + s.what, max: 2 });
  }
  why.addEventListener('click', function(e){
    var b = e.target.closest('[data-go]');
    if(!b) return;
    var s = BY[b.getAttribute('data-go')];
    if(!s) return;
    if(!inFilter(s)){ filter.system = ''; filter.chapter = ''; syncFilterUi(); applyFilter(); }
    if(MODE !== 'explore') go('explore');
    selectStructure(s, null, true);
    if(ST) ST.close();
  });

  /* ----------------------------------------------------- selection glue */
  var quiet = false;   // our own select() calls do not count as answers
  function selectStructure(s, part, flyOnly){
    quiet = true; viewer.select(s.id); quiet = false;
    onSelected(s, part);
  }
  function onSelected(s, part){
    if(MODE === 'explore'){
      viewer.tag(DATA.partNames[part] && s.parts.length > 1 ? DATA.partNames[part] : s.name);
      showCard(s, part);
      caption('<b>' + esc(s.name) + '.</b> ' + esc(s.what));
      live.textContent = s.name + '. ' + s.what;
    } else if(MODE === 'study'){
      study.cur = s; study.part = part; study.shown = false;
      viewer.tag('?');
      why.innerHTML = '<p class="a3-muted">Name it to yourself, then reveal it.</p>';
      paintStudy();
    }
  }
  function onCleared(){
    viewer.tag(null);
    if(MODE === 'explore'){ caption(exploreCap()); why.innerHTML = whyIntro(); }
    if(MODE === 'study'){ study.cur = null; paintStudy(); }
  }
  function exploreCap(){ return touch ? 'Tap any part of the body to see what it is. Drag to turn it.' : 'Click any part of the body to see what it is. Drag to turn it.'; }
  function whyIntro(){
    return '<p>Tap a bone, organ or vessel and its card shows here: what it is, where it is, its key features, related structures and the lesson that teaches it.</p>' +
      '<p class="a3-muted">To clear the way to something deep, filter by body system or chapter in <b>Filter &amp; options</b>.</p>' + modelNote();
  }
  function modelNote(){
    return '<details class="a3-model"><summary>What this model has, and what it lacks</summary><p>' + esc(DATA.model.contains) + '</p><p>' + esc(DATA.model.missing) + '</p></details>';
  }

  /* ---------------------------------------------------------- explore */
  function paintExplore(){
    dockRow.innerHTML = '';
    var reset = el('button', 'ls-btn', 'Reset view'); reset.type = 'button';
    reset.addEventListener('click', function(){ viewer.reset(); });
    var quiz = el('button', 'ls-btn ls-pri', 'Quiz me'); quiz.type = 'button';
    quiz.addEventListener('click', function(){ go('quiz'); });
    dockRow.append(quiz, reset);
    dockQ.innerHTML = '';
    var sel = viewer && viewer.selected() && BY[viewer.selected()];
    if(sel){ onSelected(sel); } else { caption(exploreCap()); why.innerHTML = whyIntro(); }
  }

  /* ------------------------------------------------------------ study */
  var study = { cur: null, shown: false, part: null };
  function paintStudy(){
    dockRow.innerHTML = '';
    var any = el('button', 'ls-btn', 'Show me one'); any.type = 'button';
    any.addEventListener('click', function(){
      var pool = askable().filter(function(s){ return !study.cur || s !== study.cur; });
      if(pool.length) selectStructure(pool[Math.floor(Math.random() * pool.length)]);
    });
    if(study.cur && !study.shown){
      var rev = el('button', 'ls-btn ls-pri', 'Reveal the name'); rev.type = 'button';
      rev.addEventListener('click', function(){
        study.shown = true;
        viewer.tag(study.cur.name);
        showCard(study.cur, study.part);
        caption('<b>' + esc(study.cur.name) + '.</b> Did you have it? Tap another structure.');
        live.textContent = study.cur.name;
        paintStudy();
      });
      dockRow.append(rev, any);
      caption('<b>What is this?</b> Name it to yourself, then reveal.');
    } else {
      dockRow.append(any);
      if(!study.cur) caption('Names are hidden. Tap a structure, name it to yourself, then reveal it.');
    }
    dockQ.innerHTML = '';
  }

  /* ------------------------------------------------------- quiz rounds */
  var round = null;   // { items: [{ s, kind }], i, right, results: [], timed, secs, left, timer }
  function stopTimer(){ if(round && round.timer){ clearInterval(round.timer); round.timer = null; } }
  function kindFor(i){
    var k = pref('kind', 'mixed');
    return k === 'mixed' ? (i % 2 ? 'point' : 'name') : k;
  }
  function newRound(opts){
    stopTimer();
    var pool = shuffle(askable());
    if(opts.first){ pool = pool.filter(function(s){ return s !== opts.first; }); pool.unshift(opts.first); }
    var n = Math.min(opts.n || 10, pool.length);
    round = { items: pool.slice(0, n).map(function(s, i){ return { s: s, kind: kindFor(i) }; }), i: 0, right: 0, results: [], timed: !!opts.timed, secs: opts.secs || 0 };
    ask();
  }
  function cleanModel(){
    viewer.marks({}); viewer.tag(null); viewer.highlight([]);
    quiet = true; viewer.clear(); quiet = false;
  }
  function ask(){
    var it = round.items[round.i];
    it.done = false;
    cleanModel();
    pills([], 'left');
    pills([{ html: (round.i + 1) + ' of ' + round.items.length, tone: 'ghost' }], 'right');
    why.innerHTML = '<p class="a3-muted">' + (it.kind === 'point' ? 'Turn the body and tap the structure. Something in the way? Filter by system in Filter &amp; options, or pick it by name there.' : 'The highlighted structure is the one to name.') + '</p>' + modelNote();
    if(it.kind === 'name'){
      viewer.setPickSelects(false);
      var sameSys = inPlay().filter(function(x){ return x.system === it.s.system; }).map(function(x){ return x.id; });
      viewer.setOnly(sameSys.concat(['skin']));
      quiet = true; viewer.select(it.s.id); quiet = false;
      viewer.tag('?');
      caption('<b>Name the highlighted structure.</b>');
      live.textContent = 'Question ' + (round.i + 1) + ': name the highlighted structure. It is in the ' + (DATA.systems[it.s.system] || '') + ' system.';
    } else {
      viewer.setPickSelects(false);
      // Only the target's own system is in play, so a rib in front cannot
      // block a lung; the rest of the body stays as a ghost for orientation.
      var sys = inPlay().filter(function(x){ return x.system === it.s.system; }).map(function(x){ return x.id; });
      viewer.setOnly(sys.concat(['skin']));
      viewer.frame(sys);
      caption('<b>Find the ' + esc(it.s.name) + '</b> and tap it.');
      live.textContent = 'Question ' + (round.i + 1) + ': find the ' + it.s.name + ' and tap it, or pick it by name in Filter and options.';
    }
    paintQ();
    if(round.timed) startClock();
  }
  function startClock(){
    stopTimer();
    if(!round.secs) return;
    round.left = round.secs;
    tick();
    round.timer = setInterval(function(){ round.left--; tick(); if(round.left <= 0){ stopTimer(); answer(null, { timeout: true }); } }, 1000);
  }
  function tick(){
    var t = dockQ.querySelector('.a3-clock');
    if(t){ t.textContent = round.left + ' s'; t.classList.toggle('is-low', round.left <= 10); }
  }
  function choices(s){
    var same = shuffle(askable().filter(function(x){ return x !== s && x.system === s.system; }));
    var others = shuffle(askable().filter(function(x){ return x !== s && x.system !== s.system; }));
    return shuffle([s].concat(same.concat(others).slice(0, 3)));
  }
  function paintQ(){
    var it = round.items[round.i];
    dockRow.innerHTML = '';
    var html = '';
    if(round.timed) html += '<p class="a3-stn">Station ' + (round.i + 1) + ' of ' + round.items.length + (round.secs ? ' <span class="a3-clock" aria-hidden="true">' + round.secs + ' s</span>' : '') + '</p>';
    if(it.kind === 'name'){
      if(pref('style', touch ? 'choose' : 'type') === 'choose'){
        it.opts = it.opts || choices(it.s);
        html += '<div class="a3-choices" role="group" aria-label="Choose the name">' + it.opts.map(function(o){ return '<button type="button" class="a3-choice" data-pick="' + esc(o.id) + '">' + esc(o.name) + '</button>'; }).join('') + '</div>';
      } else {
        html += '<form class="a3-form"><label class="a3-sr" for="a3-ans">Name of the highlighted structure</label>' +
          '<input id="a3-ans" class="a3-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type its name">' +
          '<button type="submit" class="ls-btn ls-pri">Check</button></form>';
      }
    }
    html += '<div class="ls-row a3-qrow"><button type="button" class="ls-btn a3-show">' + (it.kind === 'point' ? 'Show me' : 'I don’t know') + '</button>' +
      (round.timed ? '' : '<button type="button" class="ls-btn a3-end">End quiz</button>') + '</div>';
    dockQ.innerHTML = html;
    var inp = dockQ.querySelector('.a3-input');
    if(inp && !touch) setTimeout(function(){ try{ inp.focus({ preventScroll: true }); }catch(e){} }, 30);
  }
  dockQ.addEventListener('submit', function(e){
    e.preventDefault();
    var inp = dockQ.querySelector('.a3-input');
    if(!inp || !inp.value.trim()) return;
    answer(inp.value, { typed: true });
  });
  dockQ.addEventListener('click', function(e){
    var b = e.target.closest('button');
    if(!b || !round) return;
    if(b.hasAttribute('data-pick')) answer(BY[b.getAttribute('data-pick')], { chose: true });
    else if(b.classList.contains('a3-show')) answer(null, { gaveUp: true });
    else if(b.classList.contains('a3-end')) endRound(true);
    else if(b.classList.contains('a3-next')) next();
    else if(b.classList.contains('a3-again')) newRound({ n: round.items.length, timed: round.timed, secs: round.secs });
    else if(b.classList.contains('a3-retry')) retryMissed();
  });
  // A tap on the model (point questions) or a name picked in Details.
  function onPicked(key, part){
    if(!round || MODE === 'explore' || MODE === 'study') return false;
    var it = round.items[round.i];
    if(!it || it.done || it.kind !== 'point') return false;
    if(!BY[key]) return true;
    answer(BY[key], { part: part });
    return true;
  }

  function record(it, ok){
    var s = it.s, t = topicInfo(s.topic);
    if(core()){
      core().toolResult(KIND, [{ id: KIND + ':' + s.id + ':' + it.kind, correct: !!ok, topic: s.topic, core: t ? t.core : [],
        level: 'recall', diff: it.kind === 'name' && it.chose ? 1 : 2, group: chapterOf(s) }]);
      core().event('anp-lab-station', { set: KIND, correct: !!ok });
    }
  }
  function answer(given, how){
    var it = round.items[round.i];
    if(it.done) return;
    it.done = true; stopTimer();
    var s = it.s, ok = false, msg = '', g = null;
    if(it.kind === 'name'){
      if(how.typed){ g = grade(given, s); ok = g.ok; it.typed = given; }
      else if(how.chose){ ok = given === s; it.chose = true; it.picked = given; g = { near: ok ? null : given }; }
    } else if(given){ ok = given === s; it.picked = given; }
    it.ok = ok;
    if(ok) round.right++;
    record(it, ok);
    round.results.push(it);
    // Show the answer on the model.
    var marks = {}; marks[s.id] = ok ? 'good' : 'bad';
    if(it.kind === 'point' && it.picked && !ok) { marks[it.picked.id] = 'bad'; marks[s.id] = 'good'; }
    if(!ok && it.kind === 'point') viewer.setOnly(inPlay().filter(function(x){ return x.system === s.system || x === it.picked; }).map(function(x){ return x.id; }).concat(['skin']));
    quiet = true; viewer.select(s.id); quiet = false;
    viewer.marks(marks);
    viewer.tag(s.name);
    if(ok) msg = 'Right: <b>' + esc(s.name) + '</b>.' + (g && g.exact === false ? ' Spelling: ' + esc(s.name) + '.' : '');
    else if(how.timeout) msg = 'Time. It is the <b>' + esc(s.name) + '</b>.';
    else if(how.gaveUp) msg = 'It is the <b>' + esc(s.name) + '</b>.';
    else if(it.kind === 'point') msg = 'That is the <b>' + esc(it.picked.name) + '</b>. The ' + esc(s.name) + ' is shown in green.';
    else if(g && g.near) msg = 'That names the ' + esc(g.near.name) + '. This is the <b>' + esc(s.name) + '</b>.';
    else msg = 'Not quite. This is the <b>' + esc(s.name) + '</b>.';
    pills([{ html: ok ? 'Right' : 'Missed', tone: ok ? 'good' : 'bad' }], 'left');
    caption(msg);
    live.textContent = msg.replace(/<[^>]+>/g, '');
    if(window.LevlSound) try{ window.LevlSound.answer(ok); }catch(e){}
    showCard(s, how.part && it.picked === s ? how.part : null);
    why.querySelector('.a3-card').insertAdjacentHTML('beforeend', '<div class="a3-rep">' + report(KIND + ':' + s.id + ':' + it.kind) + '</div>');
    var last = round.i === round.items.length - 1;
    dockQ.innerHTML = '<p class="a3-verdict ' + (ok ? 'ok' : 'no') + '">' + msg + '</p>' +
      '<div class="ls-row"><button type="button" class="ls-btn ls-pri a3-next">' + (last ? 'See the results' : 'Next') + '</button></div>';
    var nb = dockQ.querySelector('.a3-next'); if(nb) try{ nb.focus({ preventScroll: true }); }catch(e){}
  }
  function next(){
    if(round.i < round.items.length - 1){ round.i++; ask(); }
    else endRound(false);
  }
  function endRound(early){
    stopTimer();
    var r = round, n = r.results.length;
    cleanModel(); applyFilter(); viewer.setPickSelects(true); viewer.frame(null);
    var missed = r.results.filter(function(x){ return !x.ok; });
    viewer.highlight(missed.map(function(x){ return x.s.id; }));
    if(r.timed && core()) core().event('anp-practical-finish', { stations: n, correct: r.right });
    pills(n ? [{ html: r.right + ' of ' + n, tone: r.right === n ? 'good' : 'accent' }] : [], 'right');
    pills([], 'left');
    caption(n ? '<b>' + r.right + ' of ' + n + ' right.</b>' + (missed.length ? ' Missed structures glow on the model and go into your review queue.' : ' Nothing missed.') : 'Quiz ended.');
    dockRow.innerHTML = '';
    dockQ.innerHTML = '<div class="ls-row">' +
      (missed.length ? '<button type="button" class="ls-btn ls-pri a3-retry">Retry ' + (missed.length === 1 ? 'the miss' : 'the ' + missed.length + ' misses') + '</button>' : '') +
      '<button type="button" class="ls-btn' + (missed.length ? '' : ' ls-pri') + ' a3-again">New ' + (r.timed ? 'practical' : 'round') + '</button></div>';
    why.innerHTML = n ? '<h3 class="a3-h">Every ' + (r.timed ? 'station' : 'question') + '</h3><ol class="a3-review">' + r.results.map(function(x){
      var yours = x.kind === 'point' ? (x.picked ? 'You tapped the ' + esc(x.picked.name) + '.' : 'No tap.') : (x.typed ? 'You wrote “' + esc(x.typed) + '”.' : x.picked ? 'You chose ' + esc(x.picked.name) + '.' : 'No answer.');
      return '<li class="' + (x.ok ? 'is-ok' : 'is-no') + '"><b>' + (x.ok ? 'Right' : 'Missed') + ':</b> ' + (x.kind === 'point' ? 'Find the ' : 'Name: ') +
        '<button type="button" class="a3-link" data-go="' + esc(x.s.id) + '">' + esc(x.s.name) + '</button> <span class="a3-muted">' + yours + '</span></li>';
    }).join('') + '</ol>' + (missed.length ? '<p class="a3-muted">Misses are in your <a href="' + esc(BASE + 'review.html') + '">review queue</a>; your accuracy by chapter is on the <a href="' + esc(BASE + 'dashboard.html') + '">dashboard</a>.</p>' : '') : '';
    live.textContent = n ? r.right + ' of ' + n + ' right.' : 'Quiz ended.';
    round = { items: r.items, results: r.results, right: r.right, timed: r.timed, secs: r.secs, over: true, i: 0 };
    if(early && !n) go('explore');
  }
  function retryMissed(){
    var missed = round.results.filter(function(x){ return !x.ok; });
    round = { items: missed.map(function(x){ return { s: x.s, kind: x.kind }; }), i: 0, right: 0, results: [], timed: false };
    if(MODE !== 'quiz'){ MODE = 'quiz'; if(ST) ST.mode('quiz'); }
    ask();
  }

  /* --------------------------------------------------------- timed setup */
  function paintTimedSetup(){
    cleanModel(); applyFilter(); viewer.setPickSelects(true);
    pills([], 'left'); pills([], 'right');
    var n = pref('stations', 10), secs = pref('secs', 60);
    caption('<b>Timed practical.</b> Stations against the clock, no going back, then a review of every station.');
    dockRow.innerHTML = '';
    dockQ.innerHTML = '<div class="a3-setup">' +
      '<label>Stations <select class="a3-sel" data-p="stations">' + [5, 10, 15, 20].map(function(v){ return '<option' + (v === n ? ' selected' : '') + '>' + v + '</option>'; }).join('') + '</select></label>' +
      '<label>Time each <select class="a3-sel" data-p="secs">' + [[30, '30 s'], [60, '60 s'], [90, '90 s'], [0, 'No limit']].map(function(v){ return '<option value="' + v[0] + '"' + (v[0] === secs ? ' selected' : '') + '>' + v[1] + '</option>'; }).join('') + '</select></label>' +
      '</div><div class="ls-row"><button type="button" class="ls-btn ls-pri a3-start">Start (' + esc(filterLabel()) + ')</button></div>';
    why.innerHTML = '<p>A practical in the style of a lab exam: each station shows one structure to name or one name to find. When a station’s time runs out it counts as missed, and you cannot go back. Choose which structures can come up with the filter in <b>Filter &amp; options</b>.</p>' + modelNote();
  }
  dockQ.addEventListener('change', function(e){
    var s = e.target.closest('.a3-sel');
    if(s) setPref(s.getAttribute('data-p'), +s.value);
  });
  dockQ.addEventListener('click', function(e){
    if(e.target.closest('.a3-start')) newRound({ n: pref('stations', 10), timed: true, secs: pref('secs', 60) });
  });

  /* ------------------------------------------------------------- modes */
  function go(m, opts){
    opts = opts || {};
    stopTimer();
    if(round && !round.over && round.results.length && (MODE === 'quiz' || MODE === 'timed') && m !== MODE) endRound(true);
    MODE = m;
    if(ST) ST.mode(m);
    try{ history.replaceState(null, '', location.pathname + location.search + '#' + (opts.first ? opts.first.id : m)); }catch(e){}
    viewer.marks({}); viewer.highlight([]); viewer.tag(null);
    pills([], 'left'); pills([], 'right');
    applyFilter();
    viewer.setPickSelects(true);
    if(m === 'explore') paintExplore();
    else if(m === 'study'){ quiet = true; viewer.clear(); quiet = false; study.cur = null; paintStudy(); why.innerHTML = '<p class="a3-muted">Names are hidden in Study. Nothing is scored.</p>' + modelNote(); }
    else if(m === 'quiz'){
      if(!askable().length){ caption('Nothing to ask with this filter. Choose another in Filter &amp; options.'); dockQ.innerHTML = ''; dockRow.innerHTML = ''; return; }
      newRound({ n: 10, first: opts.first });
    }
    else if(m === 'timed') paintTimedSetup();
  }

  /* ----------------------------------------------------------- details */
  var sysSel, chSel;
  function syncFilterUi(){ if(sysSel) sysSel.value = filter.system; if(chSel) chSel.value = filter.chapter; }
  function paintFilterPill(){
    if(!ST || MODE === 'quiz' || MODE === 'timed') return;
    pills(filter.system || filter.chapter ? [{ html: esc(filterLabel()), tone: 'ghost' }] : [], 'right');
  }
  function buildDetails(){
    var chapters = [];
    LIST.forEach(function(s){ var c = chapterOf(s); if(c && chapters.indexOf(c) < 0) chapters.push(c); });
    chapters.sort(function(a, b){ return (chapterInfo(a) || {}).n - (chapterInfo(b) || {}).n; });
    det.innerHTML =
      '<section class="ls-sec"><h3 class="ls-h">Show</h3>' +
        '<label class="a3-lab">Body system<select class="a3-sel a3-sys"><option value="">Every system</option>' + DATA.order.map(function(k){ return '<option value="' + esc(k) + '">' + esc(DATA.systems[k]) + '</option>'; }).join('') + '</select></label>' +
        '<label class="a3-lab">A&amp;P chapter<select class="a3-sel a3-ch"><option value="">Every chapter</option>' + chapters.map(function(c){ var ch = chapterInfo(c); return '<option value="' + esc(c) + '">' + esc(ch ? ch.n + '. ' + ch.title : c) + '</option>'; }).join('') + '</select></label>' +
        '<p class="a3-muted a3-count"></p>' +
        '<label class="a3-check"><input type="checkbox" class="a3-skin"> Show the skin</label>' +
      '</section>' +
      '<section class="ls-sec"><h3 class="ls-h">Quiz</h3>' +
        '<label class="a3-lab">Questions<select class="a3-sel a3-kind"><option value="mixed">Mixed: name it and point to it</option><option value="name">Name it</option><option value="point">Point to it</option></select></label>' +
        '<label class="a3-lab">Answer names by<select class="a3-sel a3-style"><option value="type">Typing them</option><option value="choose">Choosing from four</option></select></label>' +
      '</section>' +
      '<section class="ls-sec"><h3 class="ls-h">Pick a structure by name</h3><div class="a3-list" role="group" aria-label="Structures by name"></div></section>' +
      '<section class="ls-sec"><h3 class="ls-h">About the model</h3><p>' + esc(DATA.model.contains) + '</p><p>' + esc(DATA.model.missing) + '</p><p class="a3-credit">' + DATA.model.credit + ' 3D rendering: three.js (MIT).</p></section>';
    sysSel = det.querySelector('.a3-sys'); chSel = det.querySelector('.a3-ch'); filterInfo = det.querySelector('.a3-count');
    sysSel.addEventListener('change', function(){ filter.system = sysSel.value; filter.chapter = ''; syncFilterUi(); refilter(); });
    chSel.addEventListener('change', function(){ filter.chapter = chSel.value; filter.system = ''; syncFilterUi(); refilter(); });
    var skin = det.querySelector('.a3-skin'); skin.checked = !!pref('skin', false);
    skin.addEventListener('change', function(){ setPref('skin', skin.checked); viewer.setSkin(skin.checked); });
    var kind = det.querySelector('.a3-kind'); kind.value = pref('kind', 'mixed');
    kind.addEventListener('change', function(){ setPref('kind', kind.value); });
    var style = det.querySelector('.a3-style'); style.value = pref('style', touch ? 'choose' : 'type');
    style.addEventListener('change', function(){ setPref('style', style.value); if(round && !round.over && round.items[round.i] && !round.items[round.i].done) paintQ(); });
  }
  function refilter(){
    applyFilter();
    if(MODE === 'quiz') go('quiz');
    else if(MODE === 'timed') paintTimedSetup();
    else viewer.frame(filter.system || filter.chapter ? inPlay().map(function(s){ return s.id; }) : null);
  }

  /* -------------------------------------------------------------- boot */
  function boot(){
    fetch(SRC).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){
      DATA = d; LIST = d.structures; LIST.forEach(function(s){ BY[s.id] = s; });
      if(!window.LevlBodyViewer) throw new Error('viewer');
      buildDetails();
      if(Q.get('system') && DATA.systems[Q.get('system')]) filter.system = Q.get('system');
      else if(Q.get('chapter')) filter.chapter = Q.get('chapter');
      syncFilterUi();
      viewer = window.LevlBodyViewer.mount(stage, {
        content: content(), skin: !!pref('skin', false), hint: false,
        list: det.querySelector('.a3-list'),
        label: '3D model of the human body for anatomy. Drag to turn it; pick a structure by name in Filter and options to select it with the keyboard.',
        onSelect: function(key, c, part){
          if(quiet) return;
          if(key && onPicked(key, part)) return;
          if(round && !round.over && (MODE === 'quiz' || MODE === 'timed')) return;
          if(key && BY[key]) onSelected(BY[key], part); else onCleared();
        },
        onPick: function(key, c, part){ if(key) onPicked(key, part); },
        // A filter from the link (?system=, ?chapter=) frames its structures
        // once the model is in, so they fill the view instead of the whole body.
        onLoad: function(){ if((filter.system || filter.chapter) && MODE === 'explore' && !viewer.selected()) viewer.frame(inPlay().map(function(s){ return s.id; })); },
      });
      if(window.ResizeObserver) new ResizeObserver(function(){ window.dispatchEvent(new Event('resize')); }).observe(stage);
      applyFilter();
      var h = (location.hash || '').replace(/^#/, '');
      var focus = Q.get('focus') && (BY[Q.get('focus')] || LIST.filter(function(s){ return norm(s.name) === norm(Q.get('focus')); })[0]);
      if(BY[h]){ filter.system = ''; filter.chapter = ''; syncFilterUi(); applyFilter(); go('quiz', { first: BY[h] }); }
      else if(['study', 'quiz', 'timed'].indexOf(h) > -1) go(h);
      else { go('explore'); if(focus) selectStructure(focus); }
      if(ST && MODE === 'explore') ST.hint({ target: anchor, text: touch ? 'Tap any part of the body' : 'Click any part of the body', key: 'anp-anatomy-3d', inside: true });
      app.classList.add('is-ready');
    }).catch(function(e){
      console.error(e);
      if(ST){ ST.suspend(true); app.classList.remove('kt-staging'); }
      app.innerHTML = '<p class="a3-error">The 3D anatomy tool could not load. Check your connection and reload the page.</p>';
      app.classList.add('is-ready');
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
