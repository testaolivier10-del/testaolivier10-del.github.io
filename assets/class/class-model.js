/* Teacher classes: the one model both sides share (docs/teacher-classes.md).

   window.LevlClassModel, also loadable in node for scripts/test/class-model.test.mjs.

   The student's browser turns its own progress in a course into a SUMMARY
   (summarize) and class_push stores it in each of its classes in that course.
   The teacher's page computes everything from those summaries: mastery by
   topic and unit, last active, assignment status, the most missed questions
   and the answers picked. Nothing here is stored on the teacher's side, so a
   number on the teacher's page is always the student's own evidence.

   SUMMARY  { v: 1, at: ms,
              items: { <questionId>: [topic, unit, n, c, right, seenSec, level] },
              picks: { <questionId>: <last answer picked> },   single choice: option index
              flags: { <questionId>: ts },
              exams: [ { ts, kind, label, unit, c, n, fg, fo } ],  newest last
              frq:   { <frqId>: { got, of, ts } },
              lessons: <count>,
              done:  { <assignmentId>: ms } }    when the student's own browser first saw each assignment done

   ASSIGNMENT  { id, kind: practice|review|exam|frq, title, required, opens_at, due_at, late_until,
                 spec: { topics: [..], count, unit, frq } } */
(function(root){
  'use strict';
  var DAY = 86400000, FULL = 12, HALF_LIFE = 45, FLOOR = 0.5, LEVEL_W = { r: 0.8, p: 1, a: 1.2 };
  var MAX_ITEMS = 1500;

  // The courses a class can be for: the mastery courses on the shared engine.
  var COURSES = {
    apbio:     { dir: 'bio', name: 'AP® Biology', cur: 'bio/assets/bio-curriculum.js', g: 'ApBioCurriculum' },
    apchem:    { dir: 'chem', name: 'AP® Chemistry', cur: 'chem/assets/chem-curriculum.js', g: 'ApChemCurriculum' },
    apphys:    { dir: 'physics', name: 'AP® Physics 1', cur: 'physics/assets/phys-curriculum.js', g: 'ApPhysCurriculum' },
    apcalc:    { dir: 'calculus', name: 'AP® Calculus AB', cur: 'calculus/assets/calc-curriculum.js', g: 'ApCalcCurriculum' },
    apcalcbc:  { dir: 'calculus-bc', name: 'AP® Calculus BC', cur: 'calculus-bc/assets/calc-curriculum.js', g: 'ApCalcBCCurriculum' },
    apstat:    { dir: 'statistics', name: 'AP® Statistics', cur: 'statistics/assets/stat-curriculum.js', g: 'ApStatCurriculum' },
    apenv:     { dir: 'environmental-science', name: 'AP® Environmental Science', cur: 'environmental-science/assets/env-curriculum.js', g: 'ApEnvCurriculum' },
    appsych:   { dir: 'psychology', name: 'AP® Psychology', cur: 'psychology/assets/psy-curriculum.js', g: 'ApPsychCurriculum' },
    apprecalc: { dir: 'precalculus', name: 'AP® Precalculus', cur: 'precalculus/assets/pcalc-curriculum.js', g: 'ApPrecalcCurriculum' },
    apmacro:   { dir: 'macroeconomics', name: 'AP® Macroeconomics', cur: 'macroeconomics/assets/mac-curriculum.js', g: 'ApMacroCurriculum' }
  };
  var ORDER = ['apbio', 'apchem', 'apphys', 'apcalc', 'apcalcbc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apmacro'];

  function readJson(get, k){ try{ var v = JSON.parse(get(k) || 'null'); return v && typeof v === 'object' ? v : null; }catch(e){ return null; } }

  /* get: a localStorage.getItem-like function. */
  function summarize(course, get, now){
    now = now || Date.now();
    var prog = readJson(get, course + '_progress_v1') || {}, q = prog.q || {};
    var ids = Object.keys(q).filter(function(id){ var r = q[id]; return r && r.n > 0; });
    ids.sort(function(a, b){ return (q[b].seen || 0) - (q[a].seen || 0); });
    if(ids.length > MAX_ITEMS) ids = ids.slice(0, MAX_ITEMS);
    var items = {};
    ids.forEach(function(id){ var r = q[id]; items[id] = [r.t || '', r.u || '', r.n | 0, r.c | 0, r.right ? 1 : 0, Math.round((r.seen || 0) / 1000), r.l || 'p']; });
    var picksAll = readJson(get, course + '_picks_v1') || {}, picks = {};
    ids.forEach(function(id){ if(Object.prototype.hasOwnProperty.call(picksAll, id)) picks[id] = picksAll[id]; });
    var flags = readJson(get, course + '_flagged_v1') || {};
    var prefs = readJson(get, course + '_prefs_v1') || {};
    var exams = (prefs.examHistory || []).slice(-15).map(function(x){
      return { ts: x.ts, kind: x.kind || '', label: x.label || '', unit: x.unit || null,
               partial: !!x.partial, c: x.mcq ? x.mcq.c : 0, n: x.mcq ? x.mcq.n : 0, fg: x.frq ? x.frq.got : 0, fo: x.frq ? x.frq.of : 0 };
    });
    var frq = {};
    Object.keys(prefs.frqScores || {}).forEach(function(id){ var s = prefs.frqScores[id]; if(s) frq[id] = { got: +s.got || 0, of: +s.of || 0, ts: s.ts || 0 }; });
    var done = readJson(get, 'levlprep_class_done_v1') || {};
    return { v: 1, at: now, items: items, picks: picks, flags: flags, exams: exams, frq: frq, lessons: Object.keys(prog.lessons || {}).length, done: done };
  }

  function rows(sum){ var it = (sum && sum.items) || {}; return Object.keys(it).map(function(id){ var a = it[id]; return { id: id, t: a[0], u: a[1], n: a[2], c: a[3], right: a[4], seen: a[5] * 1000, l: a[6] }; }); }
  function credit(r, now){ if(!r.right) return 0; return (LEVEL_W[r.l] || 1) * Math.max(FLOOR, Math.pow(0.5, (now - r.seen) / DAY / HALF_LIFE)); }

  /* Mastery of each topic, 0..1, the course cores' formula: credit over what full mastery takes. */
  function topicMastery(sum, cur, now){
    now = now || Date.now();
    var qn = {}, out = {};
    ((cur && cur.topics) || []).forEach(function(t){ qn[t.id] = Math.min(FULL, t.qn || FULL); out[t.id] = { value: 0, answered: 0, wrong: 0 }; });
    rows(sum).forEach(function(r){
      var o = out[r.t] || (out[r.t] = { value: 0, answered: 0, wrong: 0 });
      o.answered++; if(!r.right) o.wrong++;
      o.value += credit(r, now);
    });
    Object.keys(out).forEach(function(k){ out[k].value = Math.min(1, out[k].value / (qn[k] || FULL)); });
    return out;
  }
  function unitMastery(tm, cur, unitId){
    var ts = ((cur && cur.topics) || []).filter(function(t){ return t.unit === unitId && t.built !== false; });
    if(!ts.length) return 0;
    return ts.reduce(function(a, t){ return a + ((tm[t.id] && tm[t.id].value) || 0); }, 0) / ts.length;
  }
  function overall(tm, cur){
    var ts = ((cur && cur.topics) || []).filter(function(t){ return t.built !== false; });
    if(!ts.length) return 0;
    return ts.reduce(function(a, t){ return a + ((tm[t.id] && tm[t.id].value) || 0); }, 0) / ts.length;
  }
  function lastActive(sum){
    var m = 0; rows(sum).forEach(function(r){ if(r.seen > m) m = r.seen; });
    ((sum && sum.exams) || []).forEach(function(x){ if(x.ts > m) m = x.ts; });
    return m || null;
  }
  function answeredSince(sum, since){ return rows(sum).filter(function(r){ return r.seen >= since; }).length; }

  function ts(v){ return v ? (typeof v === 'number' ? v : Date.parse(v)) : null; }

  /* Where one student stands on one assignment.
     -> { state: done|progress|not|missing, late: bool, answered, total, score: 0..1|null, doneAt } */
  function status(a, sum, now){
    now = now || Date.now();
    var spec = a.spec || {}, opens = ts(a.opens_at) || 0, due = ts(a.due_at), lateUntil = ts(a.late_until);
    var topics = spec.topics && spec.topics.length ? spec.topics : null;
    var inScope = function(r){ return !topics || topics.indexOf(r.t) !== -1; };
    var out = { state: 'not', late: false, answered: 0, total: 0, score: null, doneAt: null };
    if(a.kind === 'practice' || a.kind === 'review'){
      var rs = rows(sum).filter(inScope);
      // Review counts only questions missed at some point and redone since it opened; practice counts any answer.
      var after = rs.filter(function(r){ return r.seen >= opens && (a.kind === 'practice' || (r.n >= 2 && r.c < r.n)); }).sort(function(x, y){ return x.seen - y.seen; });
      if(a.kind === 'practice'){
        out.total = Math.max(1, spec.count || 10);
      } else {
        var pending = rs.filter(function(r){ return r.seen < opens && !r.right; }).length;
        out.total = Math.min(spec.count || 25, pending + after.length);  // 0: nothing to redo, so it counts as done
      }
      out.answered = Math.min(after.length, out.total);
      if(after.length){ var right = after.slice(0, out.total).filter(function(r){ return r.right; }).length; out.score = right / out.answered; }
      if(!out.total){ if(rs.length){ out.state = 'done'; out.doneAt = opens; } }  // nothing to redo; no answers at all is not done
      else if(after.length >= out.total){ out.state = 'done'; out.doneAt = after[out.total - 1].seen; }
      else if(after.length) out.state = 'progress';
    } else if(a.kind === 'exam'){
      out.total = 1;
      var ex = ((sum && sum.exams) || []).filter(function(x){ return x.ts >= opens && !x.partial && (spec.unit ? x.unit === spec.unit : x.kind === 'full'); })[0];
      if(ex){ out.state = 'done'; out.answered = 1; out.doneAt = ex.ts; out.score = ex.n ? ex.c / ex.n : null; out.exam = ex; }
    } else if(a.kind === 'frq'){
      out.total = 1;
      var f = sum && sum.frq && spec.frq && sum.frq[spec.frq];
      if(f && f.ts >= opens){ out.state = 'done'; out.answered = 1; out.doneAt = f.ts; out.score = f.of ? f.got / f.of : null; out.frq = f; }
    }
    // The first time the student's own browser saw it done beats the questions' last-seen times (a redo later is not lateness).
    var first = sum && sum.done && a.id && sum.done[a.id];
    if(out.state === 'done' && first && first < out.doneAt) out.doneAt = first;
    if(out.state === 'done' && due && out.doneAt > due){
      // Done after the due date: late inside the late window, missing when late work is not accepted or the window closed.
      if(lateUntil && out.doneAt <= lateUntil) out.late = true;
      else { out.state = 'missing'; out.lateDone = true; }
    }
    else if(out.state !== 'done' && due && now > due && (!lateUntil || now > lateUntil)) out.state = 'missing';
    else if(out.state !== 'done' && out.state !== 'missing' && due && now > due) out.late = true;
    return out;
  }

  /* Across a class: each question's misses and the answers picked, worst first.
     filter(row) limits which answers count (an assignment's topics and window). */
  function itemStats(members, filter){
    var by = {};
    (members || []).forEach(function(m){
      var sum = m.summary; if(!sum) return;
      rows(sum).forEach(function(r){
        if(filter && !filter(r)) return;
        var o = by[r.id] || (by[r.id] = { id: r.id, t: r.t, u: r.u, n: 0, wrong: 0, picks: {}, flags: 0, who: [] });
        o.n++; if(!r.right){ o.wrong++; o.who.push(m.name); }
        var p = sum.picks && sum.picks[r.id];
        if(typeof p === 'number') o.picks[p] = (o.picks[p] || 0) + 1;
      });
      Object.keys(sum.flags || {}).forEach(function(id){ if(by[id]) by[id].flags++; });
    });
    return Object.keys(by).map(function(k){ return by[k]; })
      .filter(function(o){ return o.n >= 2; })
      .sort(function(x, y){ return (y.wrong / y.n) - (x.wrong / x.n) || y.n - x.n; });
  }
  function flagCounts(members){
    var out = {};
    (members || []).forEach(function(m){ Object.keys((m.summary && m.summary.flags) || {}).forEach(function(id){ out[id] = (out[id] || 0) + 1; }); });
    return out;
  }

  var api = { COURSES: COURSES, ORDER: ORDER, summarize: summarize, rows: rows, topicMastery: topicMastery, unitMastery: unitMastery,
              overall: overall, lastActive: lastActive, answeredSince: answeredSince, status: status, itemStats: itemStats,
              flagCounts: flagCounts, DAY: DAY };
  if(typeof module === 'object' && module.exports) module.exports = api;
  root.LevlClassModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
