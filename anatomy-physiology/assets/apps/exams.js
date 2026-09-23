/* A&P Exams (docs/anp-spec.md section 11).

     Unit quiz        one chapter (or some of its topics), ~15 questions, untimed
     System exam      one chapter, 40 questions or all available, a level mix, timed
     Cumulative final A&P I or A&P II, weighted by each chapter's share of the
                      course's topics (the Phase 0 distribution), with the
                      "include endocrine" switch (endocrine is tagged A&P II but
                      schools teach it in either course)
     Custom exam      chapters, question types, levels and difficulty you pick,
                      with the same endocrine switch
     TEAS A&P         18 questions over the 12 TEAS 7 A&P areas: one per area plus
                      six that rotate from attempt to attempt. Labeled an
                      estimate (ATI does not publish the per-area split) and,
                      while only some areas have content, scaled to those areas.

   An exam grades silently (AnpQuestions opts.exam): no feedback until the
   end, not even an XP toast. Every answer records through AnpCore when the
   exam ends, so misses reach the review queue; a question left unanswered is
   recorded as a miss.
   The end is a full review of every question with its explanation, and a
   score by topic, by system (or TEAS area), by core concept and by level.

   Timing: a clock with pause (the question hides while paused), extra-time
   settings and a no-timer option for accessibility. Finals and TEAS mode ask
   AnpCore.allowed('exams') first: spec section 14 says they may be premium
   later. Nothing is gated now. */
(function(){
  var BASE = window.ANP_BASE || '';
  var app = document.getElementById('app');
  if(!app) return;
  var hero = document.querySelector('.anp-hero');
  var CUR = window.AnpCurriculum || { chapters: [], topics: [], core: [] };
  var Core = window.AnpCore, Q = window.AnpQuestions;

  /* Copied verbatim from TEAS_DISCLAIMER in scripts/lib/anp-build.mjs. */
  var TEAS_DISCLAIMER = 'LevlPrep is not affiliated with, endorsed by, or connected to Assessment Technologies Institute (ATI). TEAS and ATI TEAS are trademarks of ATI, used here only to say what the material is for.';

  /* The 12 A&P areas of the TEAS 7 outline, by name only (spec section 11).
     The ids match the chapters' "teas" tags in the dependency map. */
  var TEAS_AREAS = [
    { id: 'general orientation of human anatomy', name: 'General orientation of human anatomy' },
    { id: 'respiratory', name: 'Respiratory' },
    { id: 'cardiovascular', name: 'Cardiovascular' },
    { id: 'digestive', name: 'Digestive' },
    { id: 'nervous', name: 'Nervous' },
    { id: 'muscular', name: 'Muscular' },
    { id: 'male and female reproductive', name: 'Male and female reproductive' },
    { id: 'integumentary', name: 'Integumentary' },
    { id: 'endocrine', name: 'Endocrine' },
    { id: 'urinary', name: 'Urinary' },
    { id: 'immune', name: 'Immune' },
    { id: 'skeletal', name: 'Skeletal' }
  ];
  var TEAS_TOTAL = 18, TEAS_SEC = 72;          // 1.2 minutes a question
  var EXAM_SEC = 90;                            // system, final, custom: 1.5 minutes a question
  var LEVEL_MIX = { recall: 0.3, apply: 0.45, analyze: 0.25 };
  var LEVEL_NAME = { recall: 'Recall', apply: 'Apply', analyze: 'Analyze' };
  var TYPE_GROUPS = [
    { id: 'single', name: 'Single best answer', types: ['single', 'graph', 'image'] },
    { id: 'vignette', name: 'Clinical vignettes', types: ['vignette'] },
    { id: 'multi', name: 'Select all that apply', types: ['multi'] },
    { id: 'sequence', name: 'Sequencing, missing step, find the error', types: ['order', 'missing', 'error'] },
    { id: 'predict', name: 'Prediction tables', types: ['predict'] }
  ];
  var DIFF_NAME = { 1: 'Easier', 2: 'Medium', 3: 'Harder' };
  var TIMINGS = [
    { id: 'std', name: 'Standard time', k: 1 },
    { id: 'x15', name: 'Extra time (1.5×)', k: 1.5 },
    { id: 'x2', name: 'Double time', k: 2 },
    { id: 'off', name: 'No timer', k: 0 }
  ];
  var ENDOCRINE = 'endocrine';

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function html(s){ return String(s == null ? '' : s); }   // our own authored markup
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function shuffle(a){ return Q ? Q.shuffle(a) : a.slice(); }
  function byId(list){ var o = {}; list.forEach(function(x){ o[x.id] = x; }); return o; }
  function pctOf(c, n){ return n ? Math.round(c / n * 100) : 0; }
  function mmss(ms){ var s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60); s = s % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function minutes(sec){ var m = Math.round(sec / 6) / 10; return (m % 1 ? m.toFixed(1) : m) + ' min'; }
  var TOPIC = byId(CUR.topics), CHAPTER = byId(CUR.chapters), CORE = byId(CUR.core);
  var AREA = byId(TEAS_AREAS);

  function prefs(){ try{ return JSON.parse(localStorage.getItem('anp_prefs_v1') || '{}') || {}; }catch(e){ return {}; } }
  function setPref(k, v){ try{ var p = prefs(); p[k] = v; localStorage.setItem('anp_prefs_v1', JSON.stringify(p)); }catch(e){} }

  var bank = null;
  var run = null;

  function loadBank(){
    function get(u){ return fetch(BASE + u).then(function(r){ if(!r.ok) throw new Error(u); return r.json(); }); }
    return Promise.all([get('assets/bank-core.json'), get('assets/bank-why.json').catch(function(){ return {}; })]).then(function(res){
      var why = res[1] || {};
      return res[0].filter(function(q){ return TOPIC[q.topic] && TOPIC[q.topic].built; }).map(function(q){
        var w = why[q.id];
        if(w){ if(w.why) q.why = w.why; if(w.variables) q.variables = w.variables; }
        return q;
      });
    });
  }

  function builtTopics(chId){ return CUR.topics.filter(function(t){ return t.built && t.qn && (!chId || t.chapter === chId); }); }
  function builtChapters(){ var h = {}; builtTopics().forEach(function(t){ h[t.chapter] = 1; }); return CUR.chapters.filter(function(c){ return h[c.id]; }); }
  function chapterQs(chId){ return bank.filter(function(q){ return q.chapter === chId; }); }
  function chLabel(c){ return c.n + '. ' + c.title; }

  /* ------------------------------------------------------ picking */

  /* k questions spread as evenly as possible over topics. */
  function spread(list, k){
    var lanes = {}, order = [];
    shuffle(list).forEach(function(q){ if(!lanes[q.topic]){ lanes[q.topic] = []; order.push(q.topic); } lanes[q.topic].push(q); });
    var out = [];
    while(out.length < k && out.length < list.length){
      order.forEach(function(t){ if(out.length < k && lanes[t].length) out.push(lanes[t].shift()); });
    }
    return out;
  }
  /* n questions in the target level mix, each level spread over topics; any
     shortfall in one level is made up from the others. */
  function levelMix(pool, n){
    if(n >= pool.length) return shuffle(pool);
    var lv = { recall: [], apply: [], analyze: [] };
    pool.forEach(function(q){ (lv[q.level] || lv.apply).push(q); });
    var want = {}, got = 0;
    Object.keys(lv).forEach(function(l){ want[l] = Math.min(lv[l].length, Math.floor(n * LEVEL_MIX[l])); got += want[l]; });
    var guard = 0;
    while(got < n && guard++ < 1000){
      var best = null;
      Object.keys(lv).forEach(function(l){ if(want[l] < lv[l].length && (!best || want[l] / LEVEL_MIX[l] < want[best] / LEVEL_MIX[best])) best = l; });
      if(!best) break;
      want[best]++; got++;
    }
    var out = [];
    Object.keys(lv).forEach(function(l){ out = out.concat(spread(lv[l], want[l])); });
    return shuffle(out);
  }

  /* Chapters in a cumulative final. Foundations chapters are A&P I. */
  function finalChapters(course, endo){
    return CUR.chapters.filter(function(c){
      if(c.id === ENDOCRINE) return endo;
      return c.course === course;
    });
  }
  function finalPlan(course, endo, n){
    var chs = finalChapters(course, endo);
    var weight = {}, total = 0;
    chs.forEach(function(c){ weight[c.id] = CUR.topics.filter(function(t){ return t.chapter === c.id; }).length; total += weight[c.id]; });
    var built = chs.filter(function(c){ return chapterQs(c.id).length; });
    var bw = built.reduce(function(s, c){ return s + weight[c.id]; }, 0);
    var alloc = {}, sum = 0;
    if(!bw) return { chapters: chs, built: [], weight: weight, total: total, builtWeight: 0, alloc: alloc, n: 0 };
    built.forEach(function(c){ alloc[c.id] = Math.min(chapterQs(c.id).length, Math.floor(n * weight[c.id] / bw)); sum += alloc[c.id]; });
    var guard = 0;
    while(sum < n && guard++ < 1000){
      var best = null;
      built.forEach(function(c){ if(alloc[c.id] < chapterQs(c.id).length && (!best || alloc[c.id] / weight[c.id] < alloc[best] / weight[best])) best = c.id; });
      if(!best) break;
      alloc[best]++; sum++;
    }
    return { chapters: chs, built: built, weight: weight, total: total, builtWeight: bw, alloc: alloc, n: sum };
  }

  /* TEAS: one question per available area, plus the available share of the
     six rotating extras. The rotation pointer walks the 12 areas in outline
     order and is saved per attempt, so every area gets an equal share of the
     extras over time. */
  function teasAvailable(){
    var has = {}; bank.forEach(function(q){ if(q.type !== 'predict' && q.teas) has[q.teas] = (has[q.teas] || 0) + 1; });
    return TEAS_AREAS.filter(function(a){ return has[a.id]; });
  }
  function teasPlan(){
    var avail = teasAvailable(), k = avail.length;
    var extras = Math.round((TEAS_TOTAL - TEAS_AREAS.length) * k / TEAS_AREAS.length);
    var ptr = +prefs().teasRot || 0, extra = {}, placed = 0, steps = 0;
    var isAvail = byId(avail);
    while(placed < extras && steps < TEAS_AREAS.length * 2){
      var a = TEAS_AREAS[(ptr + steps) % TEAS_AREAS.length];
      steps++;
      if(isAvail[a.id] && !extra[a.id]){ extra[a.id] = 1; placed++; }
    }
    var per = {}; avail.forEach(function(a){ per[a.id] = 1 + (extra[a.id] || 0); });
    return { avail: avail, per: per, n: k + placed, extraAreas: Object.keys(extra), nextPtr: (ptr + steps) % TEAS_AREAS.length, scaled: k < TEAS_AREAS.length };
  }

  /* ------------------------------------------------------ setup */

  var cfg = {
    kind: 'system', chapter: '', unitTopics: null, sysLen: 40, course: 'I', endoI: false, endoII: true,
    finalLen: 50, custom: { chapters: null, endo: true, types: null, levels: null, diffs: null, len: 20 },
    timing: 'std'
  };
  var KINDS = [
    { id: 'unit', title: 'Unit quiz', desc: 'About 15 questions from one chapter. Untimed.' },
    { id: 'system', title: 'System exam', desc: 'A full, timed exam on one body system.' },
    { id: 'final', title: 'Cumulative final', desc: 'A&P I or A&P II, weighted by topic.' },
    { id: 'custom', title: 'Custom exam', desc: 'Your chapters, question types and levels.' },
    { id: 'teas', title: 'TEAS A&P practice', desc: 'The TEAS 7 A&P areas, at TEAS pace.' }
  ];

  var START_LABEL = { unit: 'Start unit quiz', system: 'Start system exam', final: 'Start the final', custom: 'Start custom exam', teas: 'Start TEAS practice' };

  function view(name){
    if(hero) hero.hidden = name !== 'setup';
    app.setAttribute('data-view', name);
    window.scrollTo(0, 0);
  }

  function timingField(){
    return '<label class="anp-pr-field"><span>Timing</span><select name="timing">' + TIMINGS.map(function(t){
      return '<option value="' + t.id + '"' + (t.id === cfg.timing ? ' selected' : '') + '>' + t.name + '</option>';
    }).join('') + '</select></label>';
  }
  function chapterField(){
    return '<label class="anp-pr-field"><span>Chapter</span><select name="chapter">' + builtChapters().map(function(c){
      return '<option value="' + c.id + '"' + (c.id === cfg.chapter ? ' selected' : '') + '>' + esc(chLabel(c)) + '</option>';
    }).join('') + '</select></label>';
  }
  function checks(name, list, on, label){
    return list.map(function(x){
      return '<label class="anp-ex-check"><input type="checkbox" name="' + name + '" value="' + esc(x.id) + '"' + (on.indexOf(String(x.id)) > -1 ? ' checked' : '') + '> <span>' + esc(label(x)) + '</span></label>';
    }).join('');
  }
  function endoSwitch(name, on, note){
    var built = chapterQs(ENDOCRINE).length;
    return '<label class="anp-ex-switch"><input type="checkbox" role="switch" name="' + name + '"' + (on ? ' checked' : '') + '> <span><b>Include endocrine</b> ' +
      '<span class="anp-small">' + esc(note) + (built ? '' : ' No endocrine questions are built yet, so this changes nothing today.') + '</span></span></label>';
  }

  function panelHtml(){
    var k = cfg.kind;
    if(k === 'unit'){
      var ts = builtTopics(cfg.chapter);
      if(!cfg.unitTopics) cfg.unitTopics = ts.map(function(t){ return t.id; });
      return chapterField() + '<fieldset class="anp-ex-group"><legend>Topics</legend>' + checks('unitTopic', ts, cfg.unitTopics, function(t){ return t.n + '. ' + t.title; }) + '</fieldset>';
    }
    if(k === 'system'){
      var n = chapterQs(cfg.chapter).length;
      return chapterField() + '<fieldset class="anp-ex-group anp-ex-inline"><legend>Length</legend>' +
        '<label class="anp-pr-chip"><input type="radio" name="sysLen" value="40"' + (cfg.sysLen === 40 ? ' checked' : '') + (n <= 40 ? ' disabled' : '') + '><span>40</span></label>' +
        '<label class="anp-pr-chip"><input type="radio" name="sysLen" value="0"' + (cfg.sysLen === 0 || n <= 40 ? ' checked' : '') + '><span>All ' + n + '</span></label></fieldset>' +
        timingField();
    }
    if(k === 'final'){
      var endo = cfg.course === 'I' ? cfg.endoI : cfg.endoII;
      var plan = finalPlan(cfg.course, endo, cfg.finalLen || 1e6);
      var cover = plan.total ? Math.round(plan.builtWeight / plan.total * 100) : 0;
      return '<fieldset class="anp-ex-group anp-ex-inline"><legend>Course</legend>' +
          '<label class="anp-pr-chip"><input type="radio" name="course" value="I"' + (cfg.course === 'I' ? ' checked' : '') + '><span>A&amp;P I</span></label>' +
          '<label class="anp-pr-chip"><input type="radio" name="course" value="II"' + (cfg.course === 'II' ? ' checked' : '') + '><span>A&amp;P II</span></label></fieldset>' +
        endoSwitch('endo', endo, cfg.course === 'I' ? 'Add it if your school teaches endocrine in A&P I.' : 'Turn it off if your school taught endocrine in A&P I.') +
        '<fieldset class="anp-ex-group anp-ex-inline"><legend>Length</legend>' + [50, 100, 0].map(function(v){
          return '<label class="anp-pr-chip"><input type="radio" name="finalLen" value="' + v + '"' + (cfg.finalLen === v ? ' checked' : '') + '><span>' + (v || 'All') + '</span></label>';
        }).join('') + '</fieldset>' + timingField() +
        '<div class="anp-ex-note"><p><b>What this final covers today.</b> ' + plural(plan.built.length, 'chapter') + ' of ' + plan.chapters.length + ' in ' + (cfg.course === 'I' ? 'A&amp;P I' : 'A&amp;P II') +
        (endo ? ' (with endocrine)' : '') + ' have questions so far, about ' + cover + '% of its topics. Questions are split across those chapters by their share of the course\'s topics; chapters still being written are left out, not filled in from elsewhere.</p>' +
        (plan.built.length ? '<ul class="anp-ex-alloc">' + plan.built.map(function(c){ return '<li><span>' + esc(chLabel(c)) + '</span><b>' + plan.alloc[c.id] + '</b></li>'; }).join('') + '</ul>' : '') + '</div>';
    }
    if(k === 'custom'){
      var c = cfg.custom, chs = builtChapters();
      if(!c.chapters) c.chapters = chs.map(function(x){ return x.id; });
      if(!c.types) c.types = TYPE_GROUPS.map(function(x){ return x.id; });
      if(!c.levels) c.levels = ['recall', 'apply', 'analyze'];
      if(!c.diffs) c.diffs = ['1', '2', '3'];
      return '<fieldset class="anp-ex-group"><legend>Chapters</legend>' + checks('cch', chs, c.chapters, chLabel) + '</fieldset>' +
        endoSwitch('cendo', c.endo, 'Endocrine is tagged A&P II; schools teach it in either course.') +
        '<fieldset class="anp-ex-group"><legend>Question types</legend>' + checks('ctype', TYPE_GROUPS, c.types, function(x){ return x.name; }) + '</fieldset>' +
        '<div class="anp-ex-row"><fieldset class="anp-ex-group"><legend>Level</legend>' + checks('clevel', [{ id: 'recall' }, { id: 'apply' }, { id: 'analyze' }], c.levels, function(x){ return LEVEL_NAME[x.id]; }) + '</fieldset>' +
        '<fieldset class="anp-ex-group"><legend>Difficulty</legend>' + checks('cdiff', [{ id: 1 }, { id: 2 }, { id: 3 }], c.diffs, function(x){ return DIFF_NAME[x.id]; }) + '</fieldset></div>' +
        '<fieldset class="anp-ex-group anp-ex-inline"><legend>Length</legend>' + [10, 20, 40, 0].map(function(v){
          return '<label class="anp-pr-chip"><input type="radio" name="clen" value="' + v + '"' + (c.len === v ? ' checked' : '') + '><span>' + (v || 'All') + '</span></label>';
        }).join('') + '</fieldset>' + timingField();
    }
    if(k === 'teas'){
      var p = teasPlan();
      return '<div class="anp-ex-note anp-ex-teas"><p><b>An estimate, not the real split.</b> The TEAS 7 has 18 scored A&amp;P questions across 12 areas. ATI does not publish how many come from each area, so this mode gives every area one question and rotates the other six from one attempt to the next, so each area gets an equal share over time.</p>' +
        (p.scaled ? '<p><b>Scaled to what is built.</b> Questions exist so far for ' + plural(p.avail.length, 'area') + ' of 12, so this set has ' + plural(p.n, 'question') + ': the share of 18 those areas would get. It grows to the full 18 as the course is written.</p>' : '') +
        '<ul class="anp-ex-areas">' + TEAS_AREAS.map(function(a){
          var on = p.per[a.id];
          return '<li class="' + (on ? 'is-on' : 'is-off') + '"><span>' + esc(a.name) + '</span><b>' + (on ? plural(on, 'question') : 'not built yet') + '</b></li>';
        }).join('') + '</ul>' +
        '<p class="anp-small">Timed at the TEAS science pace, about 1.2 minutes a question: ' + minutes(p.n * TEAS_SEC) + ' for this set.</p>' +
        '<p class="anp-disclaimer">' + esc(TEAS_DISCLAIMER) + '</p></div>' + timingField();
    }
    return '';
  }

  function poolFor(){
    var k = cfg.kind;
    if(k === 'unit'){ var on = {}; (cfg.unitTopics || []).forEach(function(t){ on[t] = 1; }); return bank.filter(function(q){ return on[q.topic]; }); }
    if(k === 'system') return chapterQs(cfg.chapter);
    if(k === 'custom'){
      var c = cfg.custom, types = {};
      TYPE_GROUPS.forEach(function(g){ if(c.types.indexOf(g.id) > -1) g.types.forEach(function(t){ types[t] = 1; }); });
      return bank.filter(function(q){
        if(q.chapter === ENDOCRINE && !c.endo) return false;
        return c.chapters.indexOf(q.chapter) > -1 && types[q.type] && c.levels.indexOf(q.level) > -1 && c.diffs.indexOf(String(q.diff)) > -1;
      });
    }
    return bank;
  }
  function planSummary(){
    var k = cfg.kind, pool = poolFor(), t = TIMINGS.filter(function(x){ return x.id === cfg.timing; })[0];
    var n, sec;
    if(k === 'unit'){ n = Math.min(15, pool.length); return n ? plural(n, 'question') + ', untimed.' : 'Pick at least one topic.'; }
    if(k === 'system'){ n = cfg.sysLen ? Math.min(cfg.sysLen, pool.length) : pool.length; sec = n * EXAM_SEC; }
    if(k === 'final'){ n = finalPlan(cfg.course, cfg.course === 'I' ? cfg.endoI : cfg.endoII, cfg.finalLen || 1e6).n; sec = n * EXAM_SEC; }
    if(k === 'custom'){ n = cfg.custom.len ? Math.min(cfg.custom.len, pool.length) : pool.length; sec = n * EXAM_SEC; if(!n) return 'No questions match those choices.'; }
    if(k === 'teas'){ n = teasPlan().n; sec = n * TEAS_SEC; }
    if(!n) return 'No questions are built for this yet.';
    return plural(n, 'question') + ', ' + (t.k ? minutes(sec * t.k) + (t.k > 1 ? ' with extra time' : '') : 'no timer') + '.';
  }

  function renderSetup(){
    view('setup');
    if(!cfg.chapter) cfg.chapter = builtChapters()[0].id;
    app.innerHTML = '<form class="anp-pr-setup anp-ex-setup" novalidate>' +
      '<fieldset class="anp-pr-modes"><legend>Choose an exam</legend>' + KINDS.map(function(k){
        return '<label class="anp-pr-mode"><input type="radio" name="kind" value="' + k.id + '"' + (k.id === cfg.kind ? ' checked' : '') + '><span class="anp-pr-mode-t">' + esc(k.title) + '</span><span class="anp-pr-mode-d">' + esc(k.desc) + '</span></label>';
      }).join('') + '</fieldset>' +
      '<div class="anp-ex-panel">' + panelHtml() + '</div>' +
      '<p class="anp-pr-avail" aria-live="polite"></p>' +
      '<p class="anp-small anp-ex-how">Exam mode shows no feedback until the end. Your first tap on an answer locks it in; you can skip a question and come back. At the end you review every question with its explanation, and anything you missed goes to your review queue.</p>' +
      '<button type="submit" class="btn-press anp-pr-start">Start</button></form>';
    var form = app.querySelector('form');
    function refresh(){
      app.querySelector('.anp-pr-avail').textContent = planSummary();
      var ok = !/^(No |Pick )/.test(app.querySelector('.anp-pr-avail').textContent);
      app.querySelector('.anp-pr-start').disabled = !ok;
      app.querySelector('.anp-pr-start').textContent = START_LABEL[cfg.kind];
    }
    function repaint(){ app.querySelector('.anp-ex-panel').innerHTML = panelHtml(); refresh(); }
    function vals(name){ return [].slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function(i){ return i.value; }); }
    form.addEventListener('change', function(e){
      var n = e.target.name, v = e.target.value;
      if(n === 'kind'){ cfg.kind = v; repaint(); return; }
      if(n === 'chapter'){ cfg.chapter = v; cfg.unitTopics = null; repaint(); return; }
      if(n === 'unitTopic') cfg.unitTopics = vals('unitTopic');
      if(n === 'sysLen') cfg.sysLen = +v;
      if(n === 'course'){ cfg.course = v; repaint(); return; }
      if(n === 'endo'){ if(cfg.course === 'I') cfg.endoI = e.target.checked; else cfg.endoII = e.target.checked; repaint(); return; }
      if(n === 'finalLen'){ cfg.finalLen = +v; repaint(); return; }
      if(n === 'cch') cfg.custom.chapters = vals('cch');
      if(n === 'cendo') cfg.custom.endo = e.target.checked;
      if(n === 'ctype') cfg.custom.types = vals('ctype');
      if(n === 'clevel') cfg.custom.levels = vals('clevel');
      if(n === 'cdiff') cfg.custom.diffs = vals('cdiff');
      if(n === 'clen') cfg.custom.len = +v;
      if(n === 'timing'){ cfg.timing = v; setPref('examTiming', v); }
      refresh();
    });
    form.addEventListener('submit', function(e){ e.preventDefault(); begin(); });
    refresh();
  }

  /* ------------------------------------------------------ building an exam */

  function begin(){
    var k = cfg.kind, qs = [], label = '', perQ = EXAM_SEC, meta = { kind: k };
    if((k === 'final' || k === 'teas') && !Core.allowed('exams')){
      app.querySelector('.anp-pr-avail').textContent = 'This exam mode is not available on your plan.';
      return;
    }
    if(k === 'unit'){
      qs = shuffle(spread(poolFor(), 15)); perQ = 0;
      var ch = CHAPTER[cfg.chapter];
      var allTopics = builtTopics(cfg.chapter).length === cfg.unitTopics.length;
      label = 'Unit quiz: ' + (allTopics || cfg.unitTopics.length > 1 ? ch.title : TOPIC[cfg.unitTopics[0]].title);
      meta.chapter = cfg.chapter;
    } else if(k === 'system'){
      var pool = poolFor();
      qs = levelMix(pool, cfg.sysLen ? Math.min(cfg.sysLen, pool.length) : pool.length);
      label = 'System exam: ' + CHAPTER[cfg.chapter].title; meta.chapter = cfg.chapter;
    } else if(k === 'final'){
      var endo = cfg.course === 'I' ? cfg.endoI : cfg.endoII;
      var plan = finalPlan(cfg.course, endo, cfg.finalLen || 1e6);
      plan.built.forEach(function(c){ qs = qs.concat(levelMix(chapterQs(c.id), plan.alloc[c.id])); });
      qs = shuffle(qs);
      label = (cfg.course === 'I' ? 'A&P I' : 'A&P II') + ' cumulative final' + (endo ? ' (with endocrine)' : '');
    } else if(k === 'custom'){
      var cp = poolFor();
      qs = levelMix(cp, cfg.custom.len ? Math.min(cfg.custom.len, cp.length) : cp.length);
      label = 'Custom exam';
    } else if(k === 'teas'){
      var tp = teasPlan();
      tp.avail.forEach(function(a){
        var ap = bank.filter(function(q){ return q.teas === a.id && q.type !== 'predict'; });
        qs = qs.concat(levelMix(ap, Math.min(tp.per[a.id], ap.length)));
      });
      qs = shuffle(qs); perQ = TEAS_SEC;
      setPref('teasRot', tp.nextPtr);
      label = 'TEAS A&P practice (estimate)';
    }
    if(!qs.length) return;
    var t = TIMINGS.filter(function(x){ return x.id === cfg.timing; })[0];
    var limit = perQ && t.k ? Math.round(qs.length * perQ * t.k * 1000) : 0;
    start(qs, label, limit, meta);
  }

  /* ------------------------------------------------------ running */

  function start(qs, label, limitMs, meta){
    run = {
      qs: qs, label: label, meta: meta, i: 0, els: {}, res: {}, limit: limitMs, left: limitMs,
      tick: null, last: 0, paused: false, warned: {}, startedAt: Date.now(), done: false
    };
    view('run');
    app.innerHTML = '<div class="anp-ex-run">' +
      '<div class="anp-ex-top">' +
        '<div class="anp-ex-title"><span class="anp-pr-label">' + esc(label) + '</span><span class="anp-small anp-ex-status" aria-live="polite"></span></div>' +
        (limitMs ? '<div class="anp-ex-clock"><span class="anp-ex-time" role="timer" aria-label="Time left">' + mmss(limitMs) + '</span>' +
          '<button type="button" class="btn-outline anp-ex-pause" aria-pressed="false">Pause</button></div>' : '<div class="anp-ex-clock"><span class="anp-small">Untimed</span></div>') +
      '</div>' +
      '<p class="anp-ex-sr" aria-live="assertive"></p>' +
      // The question map: open on wide screens; on a phone it starts folded so
      // the question is not pushed below the fold.
      '<details class="anp-ex-navwrap"' + (window.matchMedia && window.matchMedia('(min-width: 700px)').matches ? ' open' : '') + '><summary>All questions <span class="anp-ex-navcount"></span></summary>' +
      '<nav class="anp-ex-nav" aria-label="Questions">' + qs.map(function(q, i){ return '<button type="button" data-go="' + i + '" aria-label="Question ' + (i + 1) + ', not answered">' + (i + 1) + '</button>'; }).join('') + '</nav></details>' +
      '<div class="anp-ex-paused" hidden><p><b>Paused.</b> The question is hidden while the clock is stopped.</p><button type="button" class="btn-press anp-ex-resume">Resume</button></div>' +
      '<div class="anp-ex-stage"></div>' +
      '<div class="anp-ex-controls">' +
        '<button type="button" class="btn-outline anp-ex-prev">Previous</button>' +
        '<button type="button" class="btn-press anp-ex-next">Next</button>' +
        '<button type="button" class="btn-outline anp-ex-finish">Finish exam</button>' +
      '</div>' +
      '<div class="anp-ex-confirm" hidden role="alertdialog" aria-labelledby="anp-ex-confirm-t"><p id="anp-ex-confirm-t"></p>' +
        '<button type="button" class="btn-press anp-ex-yes">Finish now</button> <button type="button" class="btn-outline anp-ex-no">Keep working</button></div>' +
    '</div>';
    app.querySelector('.anp-ex-nav').addEventListener('click', function(e){ var b = e.target.closest('[data-go]'); if(b) go(+b.getAttribute('data-go')); });
    app.querySelector('.anp-ex-prev').addEventListener('click', function(){ go(run.i - 1); });
    app.querySelector('.anp-ex-next').addEventListener('click', nextUnanswered);
    app.querySelector('.anp-ex-finish').addEventListener('click', askFinish);
    app.querySelector('.anp-ex-yes').addEventListener('click', function(){ finish(false); });
    app.querySelector('.anp-ex-no').addEventListener('click', function(){ app.querySelector('.anp-ex-confirm').hidden = true; app.querySelector('.anp-ex-finish').focus(); });
    if(limitMs){
      app.querySelector('.anp-ex-pause').addEventListener('click', function(){ pause(!run.paused); });
      app.querySelector('.anp-ex-resume').addEventListener('click', function(){ pause(false); });
      run.last = Date.now();
      run.tick = setInterval(tick, 250);
    }
    window.addEventListener('beforeunload', guard);
    go(0);
  }
  function guard(e){ if(run && !run.done){ e.preventDefault(); e.returnValue = ''; } }

  function tick(){
    if(!run || run.done) return;
    var t = Date.now();
    if(!run.paused) run.left -= t - run.last;
    run.last = t;
    var el = app.querySelector('.anp-ex-time');
    if(el){ el.textContent = mmss(run.left); el.classList.toggle('is-low', run.left < 60000); }
    [[300000, '5 minutes left.'], [60000, '1 minute left.']].forEach(function(w){
      if(run.limit > w[0] * 2 && run.left <= w[0] && !run.warned[w[0]]){ run.warned[w[0]] = 1; app.querySelector('.anp-ex-sr').textContent = w[1]; }
    });
    if(run.left <= 0) finish(true);
  }

  function pause(on){
    run.paused = on;
    var b = app.querySelector('.anp-ex-pause');
    b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'Resume' : 'Pause';
    app.querySelector('.anp-ex-paused').hidden = !on;
    app.querySelector('.anp-ex-stage').hidden = on;
    app.querySelector('.anp-ex-navwrap').hidden = on;
    app.querySelector('.anp-ex-controls').hidden = on;
    (on ? app.querySelector('.anp-ex-resume') : app.querySelector('.anp-ex-pause')).focus();
  }

  function answeredCount(){ return Object.keys(run.res).length; }
  function status(){
    app.querySelector('.anp-ex-status').textContent = 'Question ' + (run.i + 1) + ' of ' + run.qs.length + ' · ' + answeredCount() + ' answered';
    app.querySelectorAll('.anp-ex-nav button').forEach(function(b, i){
      var done = !!run.res[run.qs[i].id];
      b.classList.toggle('is-done', done);
      if(i === run.i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.setAttribute('aria-label', 'Question ' + (i + 1) + ', ' + (done ? 'answered' : 'not answered'));
    });
    app.querySelector('.anp-ex-navcount').textContent = '(' + answeredCount() + ' of ' + run.qs.length + ' answered)';
    app.querySelector('.anp-ex-prev').disabled = run.i === 0;
    var nb = app.querySelector('.anp-ex-next');
    var left = run.qs.length - answeredCount();
    nb.textContent = !left ? 'Finish exam' : (run.res[run.qs[run.i].id] ? 'Next' : 'Skip for now');
  }

  function go(i){
    if(i < 0 || i >= run.qs.length) return;
    run.i = i;
    var stage = app.querySelector('.anp-ex-stage');
    Object.keys(run.els).forEach(function(k){ run.els[k].hidden = true; });
    var q = run.qs[i];
    if(!run.els[q.id]){
      var box = document.createElement('div');
      box.className = 'anp-ex-q';
      stage.appendChild(box);
      run.els[q.id] = box;
      // record: false keeps the exam silent: recording awards XP, and the XP
      // toast (+1 for a miss) would give the answer away. Everything is
      // recorded at the end instead.
      var ctl = Q.render(q, box, { n: i + 1, exam: true, record: false, onAnswer: function(res){ locked(q, box, res); } });
      var chk = ctl.el.querySelector('.anp-check');
      if(chk) chk.textContent = 'Lock in answer';
    }
    run.els[q.id].hidden = false;
    status();
    var stem = run.els[q.id].querySelector('.anp-q-stem');
    if(stem){ stem.setAttribute('tabindex', '-1'); try{ stem.focus({ preventScroll: true }); }catch(e){ stem.focus(); } }
    var top = app.querySelector('.anp-ex-run');
    if(top && top.getBoundingClientRect().top < 0) top.scrollIntoView();
  }

  /* What the student picked, read back from the rendered question, so the
     review can show "your answer" next to the key. */
  function capture(q, box){
    var body = box.querySelector('.anp-q-body');
    if(q.type === 'predict') return q.variables.map(function(v, k){ var b = body.querySelector('tr[data-k="' + k + '"] button[aria-pressed="true"]'); return b ? b.getAttribute('data-v') : null; });
    if(q.type === 'order'){
      var norm = q.options.map(function(o){ var s = document.createElement('span'); s.innerHTML = o; return s.innerHTML; });
      return [].map.call(body.querySelectorAll('.anp-order-text'), function(el){ return norm.indexOf(el.innerHTML); });
    }
    var picked = [].map.call(body.querySelectorAll('.anp-opt[aria-pressed="true"]'), function(b){ return +b.getAttribute('data-i'); });
    return q.type === 'multi' ? picked : (picked.length ? picked[0] : null);
  }

  function locked(q, box, res){
    run.res[q.id] = { correct: res.correct, score: res.score, pick: capture(q, box) };
    // The engine leaves the sequencing arrows live after grading; nothing
    // should look editable once an answer is locked in.
    box.querySelectorAll('.anp-q-body button').forEach(function(b){ b.disabled = true; });
    var fb = box.querySelector('.anp-q-feedback');
    if(fb) fb.innerHTML = '<p class="anp-small">Answer locked in.</p>';
    status();
    var nb = app.querySelector('.anp-ex-next');
    try{ nb.focus({ preventScroll: true }); }catch(e){ nb.focus(); }
  }

  function nextUnanswered(){
    var n = run.qs.length;
    if(answeredCount() === n) return askFinish();
    for(var s = 1; s <= n; s++){ var j = (run.i + s) % n; if(!run.res[run.qs[j].id]){ go(j); return; } }
  }

  function askFinish(){
    var left = run.qs.length - answeredCount();
    var box = app.querySelector('.anp-ex-confirm');
    box.querySelector('p').textContent = left ? plural(left, 'question') + ' not answered yet. Unanswered questions count as wrong. Finish anyway?' : 'All ' + run.qs.length + ' answered. Finish and see your results?';
    box.hidden = false;
    box.querySelector('.anp-ex-yes').focus();
  }

  /* ------------------------------------------------------ results */

  function finish(timeUp){
    if(!run || run.done) return;
    run.done = true;
    clearInterval(run.tick);
    window.removeEventListener('beforeunload', guard);
    var rows = run.qs.map(function(q){
      var r = run.res[q.id] || { correct: false, score: 0, pick: null, skipped: true };
      // An unanswered question is recorded as a miss, so it reaches review.
      Core.record(q.id, !!r.correct, { topic: q.topic, core: q.core, level: q.level, diff: q.diff, src: 'q' });
      return { q: q, r: r };
    });
    var right = rows.filter(function(x){ return x.r.correct; }).length, total = rows.length;
    var answered = rows.filter(function(x){ return !x.r.skipped; }).length;
    var k = run.meta.kind;
    Core.event('anp-session-finish', { mode: k === 'final' ? 'final' : k, answered: answered, correct: right });
    if(k === 'system') Core.event('anp-system-exam-finish', { chapter: run.meta.chapter, correct: right, total: total });
    if(k === 'teas') Core.event('anp-teas-finish', { correct: right, total: total });
    renderResults(rows, right, timeUp);
  }

  function tally(rows, keyFn){
    var out = {}, order = [];
    rows.forEach(function(x){
      [].concat(keyFn(x.q)).forEach(function(key){
        if(!key) return;
        if(!out[key]){ out[key] = { n: 0, c: 0 }; order.push(key); }
        out[key].n++; if(x.r.correct) out[key].c++;
      });
    });
    return order.map(function(key){ return { key: key, n: out[key].n, c: out[key].c }; });
  }
  function barTable(title, list, name, link){
    if(!list.length) return '';
    return '<section class="anp-ex-break"><h3>' + title + '</h3><ul class="anp-ex-bars">' + list.map(function(x){
      var p = pctOf(x.c, x.n), nm = esc(name(x.key)), href = link && link(x.key);
      return '<li><span class="anp-ex-bar-name">' + (href ? '<a href="' + href + '">' + nm + '</a>' : nm) + '</span>' +
        '<span class="track thin" aria-hidden="true"><i class="' + (p >= 80 ? 'is-hi' : p >= 60 ? 'is-mid' : 'is-lo') + '" style="width:' + p + '%"></i></span>' +
        '<span class="anp-ex-bar-v">' + x.c + '/' + x.n + '</span></li>';
    }).join('') + '</ul></section>';
  }

  function renderResults(rows, right, timeUp){
    var total = rows.length, k = run.meta.kind;
    var used = Date.now() - run.startedAt;
    var p = pctOf(right, total);
    var byTopic = tally(rows, function(q){ return q.topic; }).sort(function(a, b){ return a.c / a.n - b.c / b.n; });
    var bySystem = k === 'teas' ? tally(rows, function(q){ return q.teas; }) : tally(rows, function(q){ return q.chapter; });
    var byCore = tally(rows, function(q){ return q.core || []; }).sort(function(a, b){ return a.c / a.n - b.c / b.n; });
    var byLevel = tally(rows, function(q){ return q.level; });
    var weak = byTopic.filter(function(x){ return x.c < x.n; }).slice(0, 3);
    var missedN = total - right;
    view('results');
    app.innerHTML = '<div class="anp-ex-results">' +
      '<div class="anp-pr-score"><span class="anp-pr-score-big">' + right + '<small>/' + total + '</small></span>' +
        '<span><b>' + p + '%' + (k === 'teas' ? ' on this TEAS-style set' : '') + '</b><span class="anp-small">' + esc(run.label) +
        ' · ' + (timeUp ? 'time ran out' : 'finished in ' + mmss(used)) + '</span></span></div>' +
      (k === 'teas' ? '<p class="anp-ex-note">This is an estimate: the area mix is a guess at the real weighting, because ATI does not publish it, and ' + (teasPlan().scaled ? 'only the built areas are included. ' : '') + 'A score here is practice, not a prediction of your TEAS score.</p><p class="anp-disclaimer">' + esc(TEAS_DISCLAIMER) + '</p>' : '') +
      (missedN ? '<p>' + plural(missedN, 'missed question') + ' went to your <a href="' + BASE + 'review.html">review queue</a>.</p>' : '<p>Every question right.</p>') +
      (weak.length ? '<h2>Study next</h2><ul class="anp-pr-next-list">' + weak.map(function(x){
        return '<li><div><b>' + esc(TOPIC[x.key].title) + '</b><span class="anp-small">' + x.c + ' of ' + x.n + ' right</span></div>' +
          '<a class="btn-outline" href="' + BASE + 'lessons/' + x.key + '.html">Lesson</a><a class="btn-outline" href="' + BASE + 'notes/' + x.key + '.html">Notes</a></li>';
      }).join('') + '</ul>' : '') +
      '<h2>Your score, broken down</h2><div class="anp-ex-breaks">' +
        barTable(k === 'teas' ? 'By TEAS area' : 'By system', bySystem, function(key){ return k === 'teas' ? (AREA[key] ? AREA[key].name : key) : (CHAPTER[key] ? CHAPTER[key].title : key); }, function(key){ return k === 'teas' ? '' : BASE + 'chapters/' + key + '.html'; }) +
        barTable('By topic', byTopic, function(key){ return TOPIC[key] ? TOPIC[key].title : key; }, function(key){ return BASE + 'lessons/' + key + '.html'; }) +
        barTable('By core concept', byCore, function(key){ return CORE[key] ? CORE[key].name : key; }, function(key){ return BASE + 'concepts/' + key + '.html'; }) +
        barTable('By level', byLevel, function(key){ return LEVEL_NAME[key] || key; }) +
      '</div>' +
      '<div class="anp-pr-actions">' +
        (missedN ? '<a class="btn-press" href="' + BASE + 'practice.html?mode=missed">Practice your misses</a>' : '') +
        '<button type="button" class="btn-outline" data-act="again">Another exam</button></div>' +
      '<h2 id="anp-ex-review-h">Review every question</h2>' +
      '<div class="anp-ex-filter" role="group" aria-label="Show"><button type="button" class="anp-pr-chip-b" aria-pressed="true" data-f="all">All ' + total + '</button><button type="button" class="anp-pr-chip-b" aria-pressed="false" data-f="miss"' + (missedN ? '' : ' disabled') + '>Missed ' + missedN + '</button></div>' +
      '<ol class="anp-ex-review">' + rows.map(function(x, i){ return reviewItem(x.q, x.r, i + 1); }).join('') + '</ol>' +
      '<div class="anp-pr-actions"><button type="button" class="btn-outline" data-act="again">Another exam</button></div>' +
    '</div>';
    app.querySelectorAll('[data-act="again"]').forEach(function(b){ b.addEventListener('click', renderSetup); });
    app.querySelectorAll('[data-f]').forEach(function(b){
      b.addEventListener('click', function(){
        var miss = b.getAttribute('data-f') === 'miss';
        app.querySelectorAll('[data-f]').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        app.querySelectorAll('.anp-ex-ritem').forEach(function(li){ li.hidden = miss && li.classList.contains('is-ok'); });
      });
    });
    var h = app.querySelector('.anp-pr-score'); h.setAttribute('tabindex', '-1'); h.focus();
  }

  /* One question in the review: the stem, every option with "your answer"
     and "correct" marked and its own explanation, then the main explanation.
     Options appear in authored order; explanations never name a position. */
  function reviewItem(q, r, n){
    var cls = r.correct ? 'is-ok' : (r.score > 0 ? 'is-part' : 'is-no');
    var verdict = r.skipped ? 'Not answered' : r.correct ? 'Correct' : r.score > 0 ? 'Partly right' : 'Missed';
    var why = q.why || {}, opts = why.options || [];
    var body = '';
    function tag(t, c){ return '<span class="anp-ex-tag ' + c + '">' + t + '</span>'; }
    if(q.type === 'predict'){
      body = '<ul class="anp-ex-vars">' + q.variables.map(function(v, k){
        var mine = r.pick && r.pick[k], ok = mine === v.answer;
        function dir(d){ return d === 'up' ? 'Increases' : d === 'down' ? 'Decreases' : d === 'none' ? 'No change' : 'No answer'; }
        return '<li class="' + (ok ? 'is-ok' : 'is-no') + '"><span class="anp-ex-vname"><span class="anp-ex-mark" aria-hidden="true">' + (ok ? '✓' : '✗') + '</span>' + html(v.name) + '</span>' +
          '<span class="anp-ex-vpick">You: ' + dir(mine) + (ok ? '' : ' <span aria-hidden="true">&middot;</span> Answer: <b>' + dir(v.answer) + '</b>') + '<span class="anp-ex-sr"> (' + (ok ? 'right' : 'wrong') + ')</span></span>' +
          (v.why ? '<span class="anp-ex-vwhy">' + html(v.why) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    } else if(q.type === 'order'){
      var mine = r.pick || [];
      body = '<div class="anp-ex-orders">' +
        (mine.length ? '<div><p class="anp-small">Your order</p><ol class="anp-order">' + mine.map(function(i, k){ return '<li class="' + (i === k ? 'pos-ok' : 'pos-no') + '"><span class="anp-ex-mark" aria-hidden="true">' + (i === k ? '✓' : '✗') + '</span><span class="anp-order-text">' + html(q.options[i]) + '</span><span class="anp-ex-sr">' + (i === k ? ' (right place)' : ' (wrong place)') + '</span></li>'; }).join('') + '</ol></div>' : '') +
        '<div><p class="anp-small">Correct order</p><ol class="anp-order">' + q.options.map(function(o){ return '<li><span class="anp-order-text">' + html(o) + '</span></li>'; }).join('') + '</ol></div></div>';
    } else {
      var key = [].concat(q.correct), picks = r.pick == null ? [] : [].concat(r.pick);
      body = '<ul class="anp-ex-opts">' + (q.options || []).map(function(o, i){
        var isKey = key.indexOf(i) > -1, isPick = picks.indexOf(i) > -1;
        var c = isKey ? 'is-right' : isPick ? 'is-wrong' : '';
        return '<li class="' + c + '"><span class="anp-ex-otext">' + html(o) + '</span>' +
          (isPick ? tag('Your answer', isKey ? 'ok' : 'no') : '') + (isKey ? tag(q.type === 'multi' ? 'Correct' : 'Correct answer', 'key') : '') +
          (opts[i] ? '<span class="anp-opt-why">' + html(opts[i]) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    }
    var fig = q.fig ? '<div class="anp-q-fig anp-figimg"><img src="' + esc(BASE + q.fig.src) + '" alt="' + esc(q.fig.alt) + '" width="' + q.fig.w + '" height="' + q.fig.h + '" loading="lazy">' + (window.AnpQuestions && window.AnpQuestions.figMarks ? window.AnpQuestions.figMarks(q.fig) : '') + '</div>' : '';
    var t = TOPIC[q.topic];
    return '<li class="anp-q anp-ex-ritem ' + cls + '">' +
      '<p class="anp-ex-verdict"><span class="anp-ex-vtag">' + verdict + (r.score > 0 && !r.correct ? ' (' + Math.round(r.score * 100) + '%)' : '') + '</span>' +
        '<span class="anp-small">' + esc(t ? t.title : '') + ' · ' + esc(LEVEL_NAME[q.level] || '') + '</span></p>' +
      '<p class="anp-q-stem"><span class="anp-q-n">' + n + '.</span> ' + html(q.q) + '</p>' + fig + body +
      (why.correct ? '<p class="anp-ex-why"><b>Why:</b> ' + html(why.correct) + '</p>' : '') +
      '<p class="anp-ex-links"><a href="' + BASE + 'lessons/' + q.topic + '.html">Lesson</a> <span aria-hidden="true">&middot;</span> <a href="' + BASE + 'notes/' + q.topic + '.html">Notes</a>' +
        (window.LevlReport ? ' ' + window.LevlReport.button('anp', q.id) : '') + '</p>' +
    '</li>';
  }

  /* ------------------------------------------------------ boot */

  function boot(){
    if(!Q || !Core){ app.innerHTML = '<p>Exams could not start. Reload the page to try again.</p>'; return; }
    app.innerHTML = '<p class="anp-small">Loading the question bank…</p>';
    loadBank().then(function(b){
      bank = b;
      if(!bank.length || !builtChapters().length){ app.innerHTML = '<p>No exam questions are built yet.</p>'; return; }
      var p = new URLSearchParams(location.search);
      var saved = prefs().examTiming;
      if(TIMINGS.some(function(t){ return t.id === saved; })) cfg.timing = saved;
      if(builtChapters().some(function(c){ return c.id === p.get('chapter'); })) cfg.chapter = p.get('chapter');
      if(KINDS.some(function(k){ return k.id === p.get('mode'); })) cfg.kind = p.get('mode');
      renderSetup();
      if(p.toString()){ var s = app.querySelector('.anp-pr-start'); if(s && !s.disabled) s.focus(); }
    }).catch(function(){ app.innerHTML = '<p>The question bank did not load. Check your connection and reload.</p>'; });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
