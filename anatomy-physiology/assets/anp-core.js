/* A&P core: the one store behind every A&P page — lessons, practice, exams and
   tools all record here — plus the shared glue (XP, analytics, sync, the
   figure arrow markers).

   STORAGE  localStorage['anp_progress_v1']
     { v: 1,
       q: { <itemId>: Rec },          one record per question or tool item
       lessons: { <topicId>: ts },    lessons completed
       tools: { <kind>: {n, c} },     running totals per tool (dashboard)
       updated: ts }

   Rec  { t: topic, k: [core ids], l: 'r'|'p'|'a' (level), d: 1-3 (difficulty),
          n: attempts, c: correct, right: 0|1 (the latest answer),
          seen: ts, due: ts|0, ivl: days, ease, lapses, src: 'q'|<tool kind> }

   Everything else — topic, chapter, core concept and overall mastery, the
   review queue, missed questions — is COMPUTED from these records, never
   stored. A computed number cannot drift from the evidence, and merging two
   devices' progress is just "keep the newer record per item".

   MASTERY IS NOT ACCURACY (the same rule ochem's mastery engine follows).
   A topic's mastery is the credit from its questions answered right, weighted
   by level and faded with time since you last saw each one, divided by what
   full mastery takes: min(12, questions the topic has). Ten easy questions
   right out of a bank of forty is not 100%. */
(function(){
  var KEY = 'anp_progress_v1';
  var DAY = 86400000;
  var FULL = 12;            // distinct correct answers that make a topic "mastered"
  var CORE_FULL = 20;       // the same for a core concept, across systems
  var HALF_LIFE = 45;       // days for unrefreshed credit to fade to half
  var FLOOR = 0.5;          // ...never below half of what you earned
  var LEVEL_W = { r: 0.8, p: 1, a: 1.2 };
  var XP = { r: 5, p: 8, a: 12, wrong: 1, lesson: 40 };

  function now(){ return Date.now(); }
  function blank(){ return { v: 1, q: {}, lessons: {}, tools: {}, updated: 0 }; }
  function load(){
    try{
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if(d && d.v === 1 && d.q) { d.lessons = d.lessons || {}; d.tools = d.tools || {}; return d; }
    }catch(e){}
    return blank();
  }
  function save(d){
    d.updated = now();
    try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){}
    try{ document.dispatchEvent(new CustomEvent('anp:progress')); }catch(e){}
  }
  function levelKey(level){ return level === 'recall' ? 'r' : level === 'analyze' ? 'a' : 'p'; }

  /* Record one answer. meta: { topic, core: [], level, diff, src } */
  function record(id, correct, meta){
    meta = meta || {};
    var d = load();
    var r = d.q[id] || { t: meta.topic, k: meta.core || [], l: levelKey(meta.level), d: meta.diff || 1, n: 0, c: 0, right: 0, seen: 0, due: 0, ivl: 0, ease: 2.3, lapses: 0, src: meta.src || 'q' };
    if(meta.topic) r.t = meta.topic;
    if(meta.core) r.k = meta.core;
    r.n++; if(correct) r.c++;
    var wasQueued = r.due > 0;
    r.right = correct ? 1 : 0;
    r.seen = now();
    // Scheduling: a miss puts the item in the review queue, due in ten
    // minutes; a correct answer to a queued item pushes it out, SM-2 style.
    if(!correct){
      if(r.ivl > 0) r.lapses++;
      r.ivl = 0; r.ease = Math.max(1.3, r.ease - 0.2);
      r.due = now() + 10 * 60000;
    } else if(wasQueued){
      r.ivl = r.ivl === 0 ? 1 : Math.round(r.ivl * r.ease);
      r.ease = Math.min(2.8, r.ease + 0.05);
      // Graduated: three weeks out and answered right, it leaves the queue.
      r.due = r.ivl >= 21 ? 0 : now() + r.ivl * DAY;
    }
    d.q[id] = r;
    save(d);
    var gained = correct ? XP[r.l] || XP.p : XP.wrong;
    if(window.HubProgress){
      window.HubProgress.award('anp', gained);
      window.HubProgress.recordActivity('anp', 1);
    }
    return { xp: gained, rec: r };
  }

  function credit(r, t){
    if(!r.right) return 0;
    var age = (t - r.seen) / DAY;
    var fade = Math.max(FLOOR, Math.pow(0.5, age / HALF_LIFE));
    return (LEVEL_W[r.l] || 1) * fade;
  }

  function curriculum(){ return window.AnpCurriculum || { chapters: [], topics: [], core: [] }; }
  function topicInfo(id){ var ts = curriculum().topics; for(var i = 0; i < ts.length; i++) if(ts[i].id === id) return ts[i]; return null; }

  /* { value 0..1, answered, full } */
  function topicMastery(id){
    var d = load(), t = now(), sum = 0, answered = 0;
    Object.keys(d.q).forEach(function(k){ var r = d.q[k]; if(r.t === id){ answered++; sum += credit(r, t); } });
    var info = topicInfo(id);
    var full = Math.max(1, Math.min(FULL, (info && info.qn) || FULL));
    return { value: Math.min(1, sum / full), answered: answered, full: full };
  }
  function chapterMastery(chId){
    var ts = curriculum().topics.filter(function(t){ return t.chapter === chId && t.built; });
    if(!ts.length) return { value: 0, answered: 0, topics: 0 };
    var s = 0, a = 0;
    ts.forEach(function(t){ var m = topicMastery(t.id); s += m.value; a += m.answered; });
    return { value: s / ts.length, answered: a, topics: ts.length };
  }
  function coreMastery(coreId){
    var d = load(), t = now(), sum = 0, answered = 0;
    Object.keys(d.q).forEach(function(k){ var r = d.q[k]; if((r.k || []).indexOf(coreId) > -1){ answered++; sum += credit(r, t); } });
    var n = (curriculum().coreCounts || {})[coreId] || CORE_FULL;
    var full = Math.max(1, Math.min(CORE_FULL, n));
    return { value: Math.min(1, sum / full), answered: answered, full: full };
  }
  /* Across every BUILT topic, including ones not yet touched: an untouched
     topic is 0, not left out, so the headline never overstates coverage. */
  function overallMastery(){
    var ts = curriculum().topics.filter(function(t){ return t.built; });
    if(!ts.length) return { value: 0, topics: 0 };
    var s = 0; ts.forEach(function(t){ s += topicMastery(t.id).value; });
    return { value: s / ts.length, topics: ts.length };
  }

  function reviewQueue(limit){
    var d = load(), t = now();
    var due = Object.keys(d.q).filter(function(k){ var r = d.q[k]; return r.due && r.due <= t; })
      .sort(function(a, b){ return d.q[a].due - d.q[b].due; });
    return typeof limit === 'number' ? due.slice(0, limit) : due;
  }
  function reviewCount(){ return reviewQueue().length; }
  function missed(){ var d = load(); return Object.keys(d.q).filter(function(k){ return d.q[k].n && !d.q[k].right; }); }
  function weakest(n){
    var ts = curriculum().topics.filter(function(t){ return t.built; })
      .map(function(t){ var m = topicMastery(t.id); return { id: t.id, title: t.title, value: m.value, answered: m.answered }; })
      .filter(function(x){ return x.answered > 0; })
      .sort(function(a, b){ return a.value - b.value; });
    return ts.slice(0, n || 5);
  }
  function weakestCore(n){
    return curriculum().core.map(function(c){ var m = coreMastery(c.id); return { id: c.id, name: c.name, value: m.value, answered: m.answered }; })
      .filter(function(x){ return x.answered > 0; })
      .sort(function(a, b){ return a.value - b.value; }).slice(0, n || 3);
  }

  function lessonComplete(topicId){
    var d = load();
    var first = !d.lessons[topicId];
    if(first){ d.lessons[topicId] = now(); save(d); }
    if(first && window.HubProgress) window.HubProgress.award('anp', XP.lesson);
    event('anp-lesson-complete', { topic: topicId });
    return first;
  }
  function lessonsDone(){ return load().lessons; }

  /* Tools report here: kind is the tool, items is what was scored. Every item
     is recorded like a question (so misses reach review and mastery counts
     them); the running tally feeds the dashboard's accuracy-by-tool rows. */
  function toolResult(kind, items, extra){
    var d = load();
    var tally = d.tools[kind] || { n: 0, c: 0, by: {} };
    (items || []).forEach(function(it){
      tally.n++; if(it.correct) tally.c++;
      if(it.group){ var g = tally.by[it.group] || { n: 0, c: 0 }; g.n++; if(it.correct) g.c++; tally.by[it.group] = g; }
    });
    d.tools[kind] = tally; save(d);
    (items || []).forEach(function(it){
      if(it.id) record(it.id, !!it.correct, { topic: it.topic, core: it.core, level: it.level || 'apply', diff: it.diff || 2, src: kind });
    });
    if(extra && extra.xp && window.HubProgress) window.HubProgress.award('anp', extra.xp);
  }
  function toolStats(kind){ return load().tools[kind] || { n: 0, c: 0, by: {} }; }

  function event(name, data){
    try{ if(window.LevlAnalytics) window.LevlAnalytics.event(name, data || {}); }catch(e){}
  }

  /* Premium, later (spec section 14): every feature that may be gated asks
     here. Nothing is gated now, so this always says yes. */
  function allowed(feature){ return true; }

  function pct(v){ return Math.round((v || 0) * 100) + '%'; }

  /* The arrowheads for the visual language's "causes" and "flows" lines,
     defined once per page (anp.css points marker-end at these ids). */
  function mountDefs(){
    if(document.getElementById('anp-defs')) return;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('id', 'anp-defs'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.innerHTML = '<defs>' +
      '<marker id="anp-head-causes" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--anp-causes)"/></marker>' +
      '<marker id="anp-head-flows" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="var(--anp-flows)" stroke-width="1.6"/></marker>' +
      '</defs>';
    document.body.insertBefore(svg, document.body.firstChild);
  }

  /* Two devices' progress: per item, the record with the later answer wins;
     lessons keep the earliest completion; tool tallies keep the larger. */
  function merge(localRaw, cloudRaw){
    var a, b;
    try{ a = JSON.parse(localRaw) || blank(); }catch(e){ a = blank(); }
    try{ b = JSON.parse(cloudRaw); }catch(e){ return localRaw; }
    if(!b || b.v !== 1) return localRaw;
    if(!a || a.v !== 1) return cloudRaw;
    var out = blank();
    [a, b].forEach(function(src){
      Object.keys(src.q || {}).forEach(function(k){ if(!out.q[k] || (src.q[k].seen || 0) > (out.q[k].seen || 0)) out.q[k] = src.q[k]; });
      Object.keys(src.lessons || {}).forEach(function(k){ if(!out.lessons[k] || src.lessons[k] < out.lessons[k]) out.lessons[k] = src.lessons[k]; });
      Object.keys(src.tools || {}).forEach(function(k){ if(!out.tools[k] || (src.tools[k].n || 0) > (out.tools[k].n || 0)) out.tools[k] = src.tools[k]; });
    });
    out.updated = Math.max(a.updated || 0, b.updated || 0);
    return JSON.stringify(out);
  }

  /* The flashcard schedule, merged card by card (newest review wins), so a
     sync pull on any A&P page never overwrites cards reviewed on this device.
     The flashcards page registers the same rule; this covers every other page. */
  function mergeCards(localRaw, cloudRaw){
    var mine = null, theirs = null;
    try{ mine = JSON.parse(localRaw); }catch(e){}
    try{ theirs = JSON.parse(cloudRaw); }catch(e){ return localRaw; }
    function ok(x){ return x && typeof x === 'object' && x.v === 1 && x.cards && typeof x.cards === 'object'; }
    if(!ok(theirs)) return localRaw;
    if(!ok(mine)) return cloudRaw;
    var out = { v: 1, cards: {}, fresh: theirs.fresh || { day: '', n: 0 }, paid: theirs.paid || { day: '', xp: 0 } };
    Object.keys(theirs.cards).forEach(function(id){ out.cards[id] = theirs.cards[id]; });
    Object.keys(mine.cards).forEach(function(id){
      var a = mine.cards[id], b = out.cards[id];
      if(!b || ((a && a.t) || 0) > ((b && b.t) || 0)) out.cards[id] = a;
    });
    [['fresh', 'n'], ['paid', 'xp']].forEach(function(p){
      var a = mine[p[0]] || { day: '' }, b = out[p[0]];
      if(String(a.day) > String(b.day)) out[p[0]] = a;
      else if(a.day === b.day){ var o = { day: a.day }; o[p[1]] = Math.max(a[p[1]] || 0, b[p[1]] || 0); out[p[0]] = o; }
    });
    return JSON.stringify(out);
  }

  if(window.StudyHubAccount){
    var mergers = {}; mergers[KEY] = merge; mergers['anp_flashcards_v1'] = mergeCards;
    window.StudyHubAccount.registerNamespace('anp', [KEY, 'anp_flashcards_v1', 'anp_prefs_v1'], mergers);
  }

  document.documentElement.classList.add('js');
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountDefs); else mountDefs();

  /* The question bank is split by chapter (scripts/build-anp.mjs). loadBank
     fetches the chapters asked for (default: every chapter with a built topic)
     and resolves to one array of questions, explanations merged in unless
     opts.why is false. A missing explanation file never blocks the questions. */
  function loadBank(base, opts){
    opts = opts || {};
    var cur = curriculum();
    var chs = opts.chapters || cur.chapters.filter(function(c){ return cur.topics.some(function(t){ return t.chapter === c.id && t.built; }); }).map(function(c){ return c.id; });
    function get(u){ return fetch(base + u).then(function(r){ if(!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }); }
    return Promise.all(chs.map(function(ch){
      return Promise.all([get('assets/bank/' + ch + '.json'), opts.why === false ? Promise.resolve({}) : get('assets/bank/' + ch + '-why.json').catch(function(){ return {}; })]);
    })).then(function(parts){
      var out = [];
      parts.forEach(function(p){
        var why = p[1] || {};
        p[0].forEach(function(q){
          var w = why[q.id];
          if(w){ if(w.why) q.why = w.why; if(w.variables) q.variables = w.variables; }
          out.push(q);
        });
      });
      return out;
    });
  }

  window.AnpCore = {
    loadBank: loadBank,
    KEY: KEY, record: record, topicMastery: topicMastery, chapterMastery: chapterMastery,
    coreMastery: coreMastery, overallMastery: overallMastery, reviewQueue: reviewQueue,
    reviewCount: reviewCount, missed: missed, weakest: weakest, weakestCore: weakestCore,
    lessonComplete: lessonComplete, lessonsDone: lessonsDone, toolResult: toolResult,
    toolStats: toolStats, event: event, allowed: allowed, pct: pct, merge: merge,
    levelKey: levelKey, load: load
  };
})();
