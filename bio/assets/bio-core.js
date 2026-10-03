/* AP® Biology core: the one store behind every course page (lessons, practice,
   exams, tools), forked from the A&P core (docs/apbio-spec.md decision 1).

   STORAGE  localStorage['apbio_progress_v1']
     { v: 1,
       q: { <itemId>: Rec },          one record per question or tool item
       lessons: { <topicId>: ts },    lessons completed
       tools: { <kind>: {n, c, by} }, running totals per tool (dashboard)
       updated: ts }

   Rec  { t: topic, u: unit, p: practice skill ("4.B"), l: 'r'|'p'|'a',
          d: 1-3, n: attempts, c: correct, right: 0|1 (the latest answer),
          seen: ts, due: ts|0, ivl: days, ease, lapses, src: 'q'|<tool kind> }

   Mastery by topic, unit and science practice is COMPUTED from the records,
   never stored, so it cannot drift from the evidence and two devices merge by
   keeping the newer record per item. Mastery is not accuracy: credit from
   questions answered right, weighted by level and faded with time, over what
   full mastery takes (min(12, the topic's questions)). */
(function(){
  var KEY = 'apbio_progress_v1';
  var COURSE = 'apbio';
  var DAY = 86400000;
  var FULL = 12, PRACTICE_FULL = 20, HALF_LIFE = 45, FLOOR = 0.5;
  var LEVEL_W = { r: 0.8, p: 1, a: 1.2 };
  var XP = { r: 5, p: 8, a: 12, wrong: 1, lesson: 40 };

  function now(){ return Date.now(); }
  function blank(){ return { v: 1, q: {}, lessons: {}, tools: {}, updated: 0 }; }
  function load(){
    try{
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if(d && d.v === 1 && d.q){ d.lessons = d.lessons || {}; d.tools = d.tools || {}; return d; }
    }catch(e){}
    return blank();
  }
  function save(d){
    d.updated = now();
    try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){}
    try{ document.dispatchEvent(new CustomEvent('apbio:progress')); }catch(e){}
  }
  function levelKey(level){ return level === 'recall' ? 'r' : level === 'analyze' ? 'a' : 'p'; }
  // HubProgress is shared; the course may not be registered with it yet.
  function hub(fn, a, b){ try{ var H = window.HubProgress; if(H && H[fn]) H[fn](COURSE, a, b); }catch(e){} }

  function curriculum(){ return window.ApBioCurriculum || { units: [], topics: [], practices: [] }; }
  function topicInfo(id){ var ts = curriculum().topics; for(var i = 0; i < ts.length; i++) if(ts[i].id === id) return ts[i]; return null; }
  function unitOf(topic){ var t = topicInfo(topic); return t ? t.unit : ''; }

  /* Record one answer. meta: { topic, unit, practice, level, diff, src } */
  function record(id, correct, meta){
    meta = meta || {};
    var d = load();
    var r = d.q[id] || { t: meta.topic, u: meta.unit || unitOf(meta.topic), p: meta.practice || '', l: levelKey(meta.level), d: meta.diff || 1, n: 0, c: 0, right: 0, seen: 0, due: 0, ivl: 0, ease: 2.3, lapses: 0, src: meta.src || 'q' };
    if(meta.topic) r.t = meta.topic;
    if(meta.unit) r.u = meta.unit;
    if(meta.practice) r.p = meta.practice;
    r.n++; if(correct) r.c++;
    var wasQueued = r.due > 0;
    r.right = correct ? 1 : 0;
    r.seen = now();
    // A miss enters the review queue, due in ten minutes; a right answer to a
    // queued item pushes it out SM-2 style, and three weeks out it graduates.
    if(!correct){
      if(r.ivl > 0) r.lapses++;
      r.ivl = 0; r.ease = Math.max(1.3, r.ease - 0.2);
      r.due = now() + 10 * 60000;
    } else if(wasQueued){
      r.ivl = r.ivl === 0 ? 1 : Math.round(r.ivl * r.ease);
      r.ease = Math.min(2.8, r.ease + 0.05);
      r.due = r.ivl >= 21 ? 0 : now() + r.ivl * DAY;
    }
    d.q[id] = r;
    save(d);
    var gained = correct ? XP[r.l] || XP.p : XP.wrong;
    hub('award', gained);
    hub('recordActivity', 1);
    return { xp: gained, rec: r };
  }

  function credit(r, t){
    if(!r.right) return 0;
    var fade = Math.max(FLOOR, Math.pow(0.5, (t - r.seen) / DAY / HALF_LIFE));
    return (LEVEL_W[r.l] || 1) * fade;
  }
  function sumWhere(pred){
    var d = load(), t = now(), sum = 0, answered = 0;
    Object.keys(d.q).forEach(function(k){ var r = d.q[k]; if(pred(r)){ answered++; sum += credit(r, t); } });
    return { sum: sum, answered: answered };
  }

  /* { value 0..1, answered, full } */
  function topicMastery(id){
    var s = sumWhere(function(r){ return r.t === id; });
    var info = topicInfo(id);
    var full = Math.max(1, Math.min(FULL, (info && info.qn) || FULL));
    return { value: Math.min(1, s.sum / full), answered: s.answered, full: full };
  }
  /* A unit: the mean over its built topics, untouched ones counting 0. */
  function unitMastery(unitId){
    var ts = curriculum().topics.filter(function(t){ return t.unit === unitId && t.built; });
    if(!ts.length) return { value: 0, answered: 0, topics: 0 };
    var s = 0, a = 0;
    ts.forEach(function(t){ var m = topicMastery(t.id); s += m.value; a += m.answered; });
    return { value: s / ts.length, answered: a, topics: ts.length };
  }
  /* A science practice: "4" counts every 4.x skill, "4.B" only that skill. */
  function practiceMastery(pid){
    pid = String(pid);
    var whole = pid.indexOf('.') < 0;
    var s = sumWhere(function(r){ var p = String(r.p || ''); return whole ? p.split('.')[0] === pid : p === pid; });
    var n = whole ? (curriculum().practiceCounts || {})[pid] : 0;
    var full = Math.max(1, Math.min(PRACTICE_FULL, n || PRACTICE_FULL));
    return { value: Math.min(1, s.sum / full), answered: s.answered, full: full };
  }
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
    return curriculum().topics.filter(function(t){ return t.built; })
      .map(function(t){ var m = topicMastery(t.id); return { id: t.id, title: t.title, unit: t.unit, value: m.value, answered: m.answered }; })
      .filter(function(x){ return x.answered > 0; })
      .sort(function(a, b){ return a.value - b.value; }).slice(0, n || 5);
  }
  function weakestPractice(n){
    return curriculum().practices.map(function(p){ var m = practiceMastery(p.id); return { id: p.id, name: p.name, value: m.value, answered: m.answered }; })
      .filter(function(x){ return x.answered > 0; })
      .sort(function(a, b){ return a.value - b.value; }).slice(0, n || 3);
  }

  function lessonComplete(topicId){
    var d = load(), first = !d.lessons[topicId];
    if(first){ d.lessons[topicId] = now(); save(d); hub('award', XP.lesson); }
    event('apbio-lesson-complete', { topic: topicId });
    return first;
  }
  function lessonsDone(){ return load().lessons; }

  /* Tools report a batch: every item is recorded like a question (misses
     reach review), and the tally feeds the dashboard's accuracy rows. */
  function toolResult(kind, items, extra){
    var d = load();
    var tally = d.tools[kind] || { n: 0, c: 0, by: {} };
    (items || []).forEach(function(it){
      tally.n++; if(it.correct) tally.c++;
      if(it.group){ var g = tally.by[it.group] || { n: 0, c: 0 }; g.n++; if(it.correct) g.c++; tally.by[it.group] = g; }
    });
    d.tools[kind] = tally; save(d);
    (items || []).forEach(function(it){
      if(it.id) record(it.id, !!it.correct, { topic: it.topic, unit: it.unit, practice: it.practice, level: it.level || 'apply', diff: it.diff || 2, src: kind });
    });
    if(extra && extra.xp) hub('award', extra.xp);
  }
  function toolStats(kind){ return load().tools[kind] || { n: 0, c: 0, by: {} }; }

  function event(name, data){ try{ if(window.LevlAnalytics) window.LevlAnalytics.event(name, data || {}); }catch(e){} }

  /* Premium (assets/premium.js), mirroring AnpCore. Nothing is locked unless
     premium.js is present, has launched, knows this course (the course
     registry adds it) and this browser has no pass. Free: every notes page,
     Units 1 and 2 and every skills lesson (topic.free, from the
     generator; isFreeTopic in scripts/lib/apbio-build.mjs), 15 practice questions a day, one full exam. */
  function prem(){ var P = window.LevlPremium; return P && P.COURSES && P.COURSES[COURSE] ? P : null; }
  function locked(unit, topic){
    var P = prem();
    try{ if(!P || !P.launched || !P.launched() || P.has(COURSE)) return false; }catch(e){ return false; }
    var t = topic && topicInfo(topic);
    if(t && t.free) return false;
    try{ return !(unit && P.isFreeChapter(COURSE, unit)); }catch(e){ return true; }
  }
  var WHOLE = { tools: 1, analytics: 1 };
  function allowed(feature){ return !(WHOLE[feature] && locked()); }
  var UNLIMITED = { limit: Infinity, used: 0, left: Infinity, take: function(){ return true; } };
  function quota(){ var P = prem(); return P && P.quota && locked() ? P.quota(COURSE) : UNLIMITED; }
  /* May this question be shown? A free unit's always; any other takes one
     from today's allowance the first time it is shown on this page. */
  var served = {};
  function serve(q){
    var u = q && (q.unit || unitOf(q.topic));
    if(!locked(u) || served[q.id]) return true;
    if(!quota().take(1)) return false;
    served[q.id] = 1;
    return true;
  }
  function freeExam(){
    var P = prem();
    return P && P.freeExam && locked() ? P.freeExam(COURSE) : { unlimited: true, used: false, available: true, use: function(){ return true; } };
  }
  function badge(unit){ var P = prem(); try{ return P && !(unit && P.isFreeChapter(COURSE, unit)) ? P.badge(COURSE) : ''; }catch(e){ return ''; } }
  function gate(feature, source, topic){
    var P = prem(), g = '';
    try{ g = P ? P.gate(COURSE, feature, source || feature) : ''; }catch(e){ g = ''; }
    if(!g) return '';
    var t = topic && topicInfo(topic), b = window.ApBioBase || '';
    return '<div class="bio-gate">' + g + '<p class="bio-gate-notes"><a href="' + b + (t ? 'notes/' + t.id + '.html">Read the free notes on ' + t.title.replace(/</g, '&lt;') : 'learn.html">Read the free notes for every topic') + ' &rarr;</a></p></div>';
  }
  function mountPremium(){
    var P = prem(), app = document.getElementById('app'), f = app && app.getAttribute('data-premium');
    if(!P) return;
    var was = locked();
    try{ P.onChange(function(){ if(locked() !== was) location.reload(); }); }catch(e){}
    if(f && was && WHOLE[f]){ app.removeAttribute('id'); app.innerHTML = gate(f, app.getAttribute('data-slug')); }
  }

  function pct(v){ return Math.round((v || 0) * 100) + '%'; }

  /* Two devices: per item the later answer wins; lessons keep the earliest
     completion; tool tallies keep the larger. */
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
  try{
    if(window.StudyHubAccount && window.StudyHubAccount.registerNamespace){
      var mergers = {}; mergers[KEY] = merge;
      window.StudyHubAccount.registerNamespace(COURSE, [KEY, 'apbio_flashcards_v1', 'apbio_prefs_v1'], mergers);
    }
  }catch(e){}

  /* The bank, split per unit (scripts/build-apbio.mjs): assets/bank/<unit>.json
     holds { stimuli, items } without explanations, <unit>-why.json the
     explanations, index.json every item's tags. loadIndex -> stubs;
     loadQuestions -> full items (stimulus attached as q.stim), fetching only
     their units; loadWhy -> merges an explanation after the answer. */
  var files = {};
  function getOnce(base, u){
    var k = base + u;
    if(!files[k]){
      files[k] = fetch(base + u).then(function(r){ if(!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
      files[k].catch(function(){ delete files[k]; });
    }
    return files[k];
  }
  function loadIndex(base){
    var T = {};
    curriculum().topics.forEach(function(t){ T[t.id] = t; });
    return getOnce(base, 'assets/bank/index.json').then(function(ix){
      var out = [];
      Object.keys(ix.t).forEach(function(topic){
        var t = T[topic];
        if(!t || !t.built || !ix.t[topic]) return;
        ix.t[topic].split(',').forEach(function(e){
          var f = e.split('.');
          out.push({ id: 'bio-' + topic + '-' + f[0], topic: topic, unit: t.unit, type: ix.ty[+f[1]], level: ix.lv[+f[2]], diff: +f[3],
            practice: ix.pr[+f[4]], stimulus: f[5] === '' || f[5] === undefined ? null : ix.st[+f[5]], stub: true });
        });
      });
      return out;
    });
  }
  function loadQuestions(base, xs){
    var ids = {}, units = {}, T = {};
    curriculum().topics.forEach(function(t){ T[t.id] = t; });
    (xs || []).forEach(function(x){
      var id = typeof x === 'string' ? x : x.id;
      ids[id] = 1;
      var u = typeof x === 'object' && x.unit;
      if(!u){ var m = /^bio-(.+)-\d+$/.exec(id); u = m && T[m[1]] && T[m[1]].unit; }
      if(u) units[u] = 1;
    });
    return Promise.all(Object.keys(units).map(function(u){ return getOnce(base, 'assets/bank/' + u + '.json'); })).then(function(parts){
      var by = {};
      parts.forEach(function(p){ p.items.forEach(function(q){ if(ids[q.id]){ if(q.stimulus && p.stimuli[q.stimulus]) q.stim = p.stimuli[q.stimulus]; by[q.id] = q; } }); });
      return (xs || []).map(function(x){ return by[typeof x === 'string' ? x : x.id]; }).filter(Boolean);
    });
  }
  function loadWhy(base, q){
    if(!q || (q.why && q.why.correct) || !q.unit) return Promise.resolve(q);
    return getOnce(base, 'assets/bank/' + q.unit + '-why.json').then(function(why){
      var w = why[q.id];
      if(w){ if(w.why) q.why = w.why; if(w.variables) q.variables = w.variables; }
      return q;
    }, function(){ return q; });
  }

  try{ document.documentElement.classList.add('js'); }catch(e){}
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountPremium); else mountPremium();

  window.ApBioCore = {
    KEY: KEY, COURSE: COURSE, load: load, record: record, levelKey: levelKey,
    topicMastery: topicMastery, unitMastery: unitMastery, practiceMastery: practiceMastery, overallMastery: overallMastery,
    reviewQueue: reviewQueue, reviewCount: reviewCount, missed: missed, weakest: weakest, weakestPractice: weakestPractice,
    lessonComplete: lessonComplete, lessonsDone: lessonsDone, toolResult: toolResult, toolStats: toolStats, event: event,
    locked: locked, allowed: allowed, quota: quota, serve: serve, freeExam: freeExam, badge: badge, gate: gate,
    unitOf: unitOf, pct: pct, merge: merge, loadIndex: loadIndex, loadQuestions: loadQuestions, loadWhy: loadWhy
  };
})();
