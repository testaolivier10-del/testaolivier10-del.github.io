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
              done:  { <assignmentId>: ms },     when the student's own browser first saw each assignment done
              att:   { <assignmentId>: { start, end, n, c, tabs, answers } } }   timed or controlled attempts, written by
                                                 the course engines (levlprep_class_att_v1, v2 contract)

   ASSIGNMENT  { id, kind: practice|review|mastery|exam|frq, title, required, opens_at, due_at, late_until,
                 spec: { topics: [..], count, unit, frq, target, min,
                         controls: { timeLimit, shuffle, release, questions } } } */
(function(root){
  'use strict';
  var DAY = 86400000, FULL = 12, HALF_LIFE = 45, FLOOR = 0.5, LEVEL_W = { r: 0.8, p: 1, a: 1.2 };
  var MAX_ITEMS = 1500;

  // The courses a class can be for. The ten AP® courses share one engine and one progress shape
  // (<course>_progress_v1 and friends); NREMT, organic chemistry and A&P keep progress their own way and have
  // their own reader (READ below) and curriculum adapter (curriculum()). Flags for the teacher's page:
  //   ap: false       no AP® skills, score band or AP® wording
  //   frq: false      no free-response assignments (the course has none)
  //   unitExams       false: only a full exam exists (NREMT)
  //   unitWord        what the curriculum's numbered units are called on the teacher's page
  //   need            a script the student's page must load before summarize (NREMT's topic map)
  //   topicFilter     false: the practice page drills a whole unit, not one topic (said in the builder)
  //   bank            one question file for the whole course (else <dir>/assets/bank/<unit>.json)
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
    apmacro:   { dir: 'macroeconomics', name: 'AP® Macroeconomics', cur: 'macroeconomics/assets/mac-curriculum.js', g: 'ApMacroCurriculum' },
    // Registered hidden (docs/apmicro-spec.md): known to the model and the
    // database; added to ORDER, the teacher's course list, at launch.
    apmicro:   { dir: 'microeconomics', name: 'AP® Microeconomics', cur: 'microeconomics/assets/mic-curriculum.js', g: 'ApMicroCurriculum' },
    nremt:     { dir: 'nremt', name: 'EMT (NREMT)', cur: 'assets/class/nremt-map.js', g: 'LevlClassNremt', ap: false, frq: false, unitExams: false,
                 unitWord: 'Area', need: 'assets/class/nremt-map.js', topicFilter: false, bank: 'nremt/assets/questions-core.json' },
    ochem:     { dir: 'ochem', name: 'Organic Chemistry', cur: 'ochem/assets/curriculum.js', g: 'OchemCurriculum', ap: false, frq: false,
                 unitWord: 'Chapter', bank: 'ochem/assets/practice-bank-core.json' },
    anp:       { dir: 'anatomy-physiology', name: 'Anatomy & Physiology', cur: 'anatomy-physiology/assets/anp-curriculum.js', g: 'AnpCurriculum', ap: false, frq: false,
                 unitWord: 'Chapter' }
  };
  var ORDER = ['apbio', 'apchem', 'apphys', 'apcalc', 'apcalcbc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apmacro', 'nremt', 'ochem', 'anp'];

  function readJson(get, k){ try{ var v = JSON.parse(get(k) || 'null'); return v && typeof v === 'object' ? v : null; }catch(e){ return null; } }
  function isAp(course){ var C = COURSES[course]; return !!C && C.ap !== false; }

  /* The course's curriculum in the one shape the teacher's page reads:
       { units: [{ id, n?, title, weight?, part? }], topics: [{ id, unit, title, qn?, built?, ced?, bank? }], practices? }
     raw is what the course's own file defines (COURSES[course].g); the AP® curricula already have this shape. */
  function curriculum(course, raw){
    if(!raw) return { units: [], topics: [] };
    if(course === 'anp') return {
      units: (raw.chapters || []).map(function(c){ return { id: c.id, n: c.n, title: c.title }; }),
      topics: (raw.topics || []).map(function(t){ return { id: t.id, unit: t.chapter, title: t.title, qn: t.qn, built: !!t.built }; }) };
    if(course === 'ochem'){
      var units = [], topics = [];
      (raw.MODULES || []).forEach(function(m, i){
        units.push({ id: m.id, n: i + 1, title: m.title });
        (m.topics || []).forEach(function(t){ topics.push({ id: t.id, unit: m.id, title: t.title }); });
      });
      return { units: units, topics: topics };
    }
    if(course === 'nremt') return { units: (raw.units || []).map(function(u, i){ return { id: u.id, n: i + 1, title: u.title }; }),
      topics: (raw.topics || []).map(function(t){ return { id: t.id, unit: t.unit, title: t.title, qn: t.qn }; }) };
    return raw;
  }
  /* topic id -> unit id, from the curriculum the page has loaded (A&P and ochem records carry only the topic). */
  var unitCache = {};
  function topicUnits(course, cur){
    if(!cur && unitCache[course]) return unitCache[course];
    var C = COURSES[course], c = cur || (C && root[C.g] ? curriculum(course, root[C.g]) : null), out = {};
    if(!c) return out;
    (c.topics || []).forEach(function(t){ out[t.id] = t.unit; });
    if(!cur) unitCache[course] = out;
    return out;
  }

  /* NREMT: the bank's topic and difficulty for one question id, from assets/class/nremt-map.js. */
  var NR_LEVEL = ['r', 'p', 'a', 'a'];
  function nremtInfo(map, id){
    var i = +id, ch = map && map.q && i >= 0 && i === Math.floor(i) ? map.q.substr(i * 2, 2) : '';
    var t = ch && ch !== '..' ? map.topics[ch.charCodeAt(0) - 97] : null;
    return t ? { t: t.id, u: t.unit, l: NR_LEVEL[+ch.charAt(1)] || 'p' } : null;
  }
  var TIER_LEVEL = { 1: 'r', 2: 'p', 3: 'a', 4: 'a' };

  /* One reader per progress shape. Each returns the raw parts of a summary:
       { q: { <id>: { t, u, n, c, right, seen, l } }, picks, flags: { <id>: ts }, exams: [summary exam rows, oldest first],
         frq: { <id>: { got, of, ts } }, lessons: <count> }
     opts.cur: an adapted curriculum (tests, the sample class); without it the page's own curriculum is used. */
  function apExams(list){
    return (Array.isArray(list) ? list : []).map(function(x){
      return { ts: x.ts, kind: x.kind || '', label: x.label || '', unit: x.unit || null,
               partial: !!x.partial, c: x.mcq ? x.mcq.c : 0, n: x.mcq ? x.mcq.n : 0, fg: x.frq ? x.frq.got : 0, fo: x.frq ? x.frq.of : 0 };
    });
  }
  var READ = {
    // The AP® courses and A&P (anp-core.js keeps the same record, without the unit; its exams page writes
    // anp_prefs_v1.examHistory in the AP® shape).
    ap: function(course, get, opts){
      var prog = readJson(get, course + '_progress_v1') || {}, q = prog.q || {}, prefs = readJson(get, course + '_prefs_v1') || {};
      var tu = course === 'anp' ? topicUnits(course, opts.cur) : {}, out = {};
      Object.keys(q).forEach(function(id){ var r = q[id]; if(r && r.n > 0) out[id] = r.u ? r : Object.assign({}, r, { u: tu[r.t] || '' }); });
      var frq = {};
      Object.keys(prefs.frqScores || {}).forEach(function(id){ var s = prefs.frqScores[id]; if(s) frq[id] = { got: +s.got || 0, of: +s.of || 0, ts: s.ts || 0 }; });
      return { q: out, picks: readJson(get, course + '_picks_v1') || {}, flags: readJson(get, course + '_flagged_v1') || {},
               exams: apExams(prefs.examHistory), frq: frq, lessons: Object.keys(prog.lessons || {}).length };
    },
    /* NREMT (practice-engine.js): nremt_mastery { <id>: { level 0-5, timesCorrect, timesWrong, lastSeen } }. A right
       answer raises the level, a wrong one sets it to 0, so the latest answer was right exactly when level > 0.
       Flags are a list of ids; exams are the timed exam (nremt_exam100_history) and the adaptive exam (nremt_cat_history). */
    nremt: function(course, get, opts){
      var map = opts.nremtMap || root.LevlClassNremt, m = readJson(get, 'nremt_mastery') || {}, out = {};
      Object.keys(m).forEach(function(id){
        var r = m[id]; if(!r || typeof r !== 'object') return;
        var c = r.timesCorrect | 0, n = c + (r.timesWrong | 0); if(!n) return;
        var info = nremtInfo(map, id) || { t: '', u: '', l: 'p' };
        out[id] = { t: info.t, u: info.u, n: n, c: c, right: r.level > 0 ? 1 : 0, seen: +r.lastSeen || 0, l: info.l };
      });
      var flags = {}, fl = readJson(get, 'nremt_exam100_flagged');
      if(Array.isArray(fl)) fl.forEach(function(id){ flags[id] = 0; });
      var hist = readJson(get, 'nremt_exam100_history'), cat = readJson(get, 'nremt_cat_history'), exams = [];
      (Array.isArray(hist) ? hist : []).forEach(function(x){ if(x && x.total) exams.push({ ts: +x.date || 0, kind: 'full', label: 'Timed exam', unit: null, partial: false, c: x.score | 0, n: x.total | 0, fg: 0, fo: 0 }); });
      (Array.isArray(cat) ? cat : []).forEach(function(x){ if(x && x.n) exams.push({ ts: +x.date || 0, kind: 'full', label: 'Adaptive exam', unit: null, partial: false, c: x.right | 0, n: x.n | 0, fg: 0, fo: 0 }); });
      exams.sort(function(a, b){ return a.ts - b.ts; });
      return { q: out, picks: readJson(get, 'nremt_picks_v1') || {}, flags: flags, exams: exams, frq: {}, lessons: Object.keys(readJson(get, 'nremt_lessons_v1') || {}).length };
    },
    /* Organic chemistry: the mastery engine tracks concepts, not questions, so diagnostic-engine.js applyResult also
       writes ochem_items_v1 { q: { <id>: { t, n, c, right, seen, l } } } (from this change on). Misses from before it,
       still in ochem_mastery_v1.mistakes, fill in what they can: a miss, or a miss later fixed (missed, then right).
       Exams: ochem_exam_history_v1 (a chapter test is that chapter's unit test, the cumulative final the full exam). */
    ochem: function(course, get, opts){
      var tu = topicUnits(course, opts.cur), items = (readJson(get, 'ochem_items_v1') || {}).q || {}, out = {};
      Object.keys(items).forEach(function(id){ var r = items[id]; if(r && r.n > 0) out[id] = Object.assign({}, r, { u: tu[r.t] || '' }); });
      ((readJson(get, 'ochem_mastery_v1') || {}).mistakes || []).forEach(function(x){
        if(!x || !x.qid || out[x.qid] || !x.topicId) return;
        out[x.qid] = x.fixed ? { t: x.topicId, u: tu[x.topicId] || '', n: 2, c: 1, right: 1, seen: +x.fixedTs || +x.ts || 0, l: TIER_LEVEL[x.tier] || 'p' }
                             : { t: x.topicId, u: tu[x.topicId] || '', n: 1, c: 0, right: 0, seen: +x.ts || 0, l: TIER_LEVEL[x.tier] || 'p' };
      });
      var hist = readJson(get, 'ochem_exam_history_v1'), exams = [];
      (Array.isArray(hist) ? hist : []).forEach(function(x){
        if(!x || !x.total) return;
        var ch = x.kind === 'chapter' && x.chapters && x.chapters[0] ? x.chapters[0][0] : null;
        exams.push({ ts: +x.ts || 0, kind: x.kind === 'final' ? 'full' : x.kind || '', label: x.label || '', unit: ch, partial: false, c: x.right | 0, n: x.total | 0, fg: 0, fo: 0 });
      });
      exams.sort(function(a, b){ return a.ts - b.ts; });
      var prog = readJson(get, 'ochem_progress') || {};
      return { q: out, picks: readJson(get, 'ochem_picks_v1') || {}, flags: readJson(get, 'ochem_flagged_v1') || {}, exams: exams, frq: {},
               lessons: Object.keys(prog).filter(function(k){ return prog[k] && prog[k].completed; }).length };
    }
  };

  /* get: a localStorage.getItem-like function. opts (optional): { cur: adapted curriculum, nremtMap }. */
  function summarize(course, get, now, opts){
    now = now || Date.now(); opts = opts || {};
    var part = (READ[course] || READ.ap)(course, get, opts), q = part.q;
    var ids = Object.keys(q);
    ids.sort(function(a, b){ return (q[b].seen || 0) - (q[a].seen || 0); });
    if(ids.length > MAX_ITEMS) ids = ids.slice(0, MAX_ITEMS);
    var items = {};
    ids.forEach(function(id){ var r = q[id]; items[id] = [r.t || '', r.u || '', r.n | 0, r.c | 0, r.right ? 1 : 0, Math.round((r.seen || 0) / 1000), r.l || 'p']; });
    var picksAll = part.picks || {}, picks = {};
    ids.forEach(function(id){ if(Object.prototype.hasOwnProperty.call(picksAll, id)) picks[id] = picksAll[id]; });
    var done = readJson(get, 'levlprep_class_done_v1') || {};
    // Attempts the engines record for timed or controlled assignments: the 40 newest, at most 60 answers each.
    var attAll = readJson(get, 'levlprep_class_att_v1') || {}, att = {};
    Object.keys(attAll).filter(function(k){ return attAll[k] && typeof attAll[k] === 'object'; })
      .sort(function(x, y){ return (attAll[y].start || 0) - (attAll[x].start || 0); }).slice(0, 40).forEach(function(k){
        var x = attAll[k], ans = {};
        Object.keys(x.answers || {}).slice(0, 60).forEach(function(q){ ans[q] = x.answers[q]; });
        att[k] = { start: +x.start || 0, end: +x.end || 0, n: x.n | 0, c: x.c | 0, tabs: x.tabs | 0, answers: ans };
      });
    return { v: 1, at: now, items: items, picks: picks, flags: part.flags || {}, exams: (part.exams || []).slice(-15), frq: part.frq || {},
             lessons: part.lessons | 0, done: done, att: att };
  }

  /* Where a student does an assignment: a link relative to the course's home page. Each course's pages take
     different parameters (docs/teacher-classes.md, "Links"); the closest page when one has no filter. */
  function q1(k, v){ return '?' + k + '=' + encodeURIComponent(v); }
  function nremtArea(topicOrUnit){
    var map = root.LevlClassNremt; if(!map) return null;
    var t = (map.topics || []).filter(function(x){ return x.id === topicOrUnit; })[0], uid = t ? t.unit : topicOrUnit;
    var u = (map.units || []).filter(function(x){ return x.id === uid; })[0];
    return u ? u.system || u.title : null;
  }
  function topicHref(course, t){
    if(course === 'nremt'){ var s = nremtArea(t); return 'practice.html' + (s ? q1('system', s) : ''); }
    return 'practice.html' + q1('topic', t);
  }
  function href(course, a){
    var s = a.spec || {}, t = s.topics || [];
    if(course === 'nremt'){
      if(a.kind === 'review') return 'review.html?start=review';
      if(a.kind === 'exam') return 'exams.html';
      return t.length ? topicHref(course, t[0]) : 'practice.html';
    }
    if(course === 'ochem'){
      if(a.kind === 'review') return 'practice.html?mode=mistakes';
      if(a.kind === 'exam') return 'exams.html' + (s.unit ? '?kind=chapter&chapter=' + encodeURIComponent(s.unit) : '?kind=final');
      return t.length ? topicHref(course, t[0]) + (a.kind === 'practice' && s.count ? '&count=' + (s.count | 0) : '') : 'practice.html';
    }
    if(course === 'anp'){
      if(a.kind === 'review') return 'review.html';
      if(a.kind === 'exam') return 'exams.html' + (s.unit ? '?mode=system&chapter=' + encodeURIComponent(s.unit) : '?mode=final');
      return t.length ? topicHref(course, t[0]) : 'practice.html';
    }
    if(a.kind === 'review') return 'review.html';
    if(a.kind === 'exam') return 'exams.html' + (s.unit ? '?unit=' + encodeURIComponent(s.unit) : '?mode=full');
    if(a.kind === 'frq') return s.frq ? 'frq/' + encodeURIComponent(s.frq) + '.html' : 'frq.html';
    if(s.unit && !t.length) return 'practice.html' + q1('unit', s.unit);
    if(t.length) return topicHref(course, t[0]);
    return 'practice.html';
  }

  /* The teacher's page: where a unit's questions are (question text, options and answer for the most missed list,
     live mode and print), and how to read that file into [{ id, type, q, options, correct, topic, ... }]. */
  function bankUrl(course, unit){ var C = COURSES[course]; return C.bank ? '/' + C.bank : '/' + C.dir + '/assets/bank/' + unit + '.json'; }
  function bankItems(course, json){
    if(course === 'nremt') return (Array.isArray(json) ? json : []).map(function(x){
      var info = nremtInfo(root.LevlClassNremt, x.id);
      return { id: String(x.id), type: x.type || 'single', q: x.q, options: x.options, correct: x.correct, topic: info ? info.t : '' };
    });
    if(course === 'ochem'){
      var out = [];
      Object.keys(json || {}).forEach(function(t){ (Array.isArray(json[t]) ? json[t] : []).forEach(function(x, i){
        out.push({ id: 'lb:' + t + ':' + i, type: !x.type || x.type === 'mcq' || x.type === 'tf' ? 'single' : x.type, q: x.q, options: x.options, correct: x.correct, topic: t });
      }); });
      return out;
    }
    if(Array.isArray(json)) return json;   // A&P: one array per chapter
    return (json && json.items) || [];
  }
  // The explanations beside a unit's bank (AP® and A&P: <unit>-why.json); none for a one-file bank.
  function whyUrl(course, unit){ var C = COURSES[course]; return C.bank ? null : '/' + C.dir + '/assets/bank/' + unit + '-why.json'; }

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

  /* Where one student stands on one assignment. cur (the course curriculum) is optional: mastery
     assignments use its question counts per topic, and fall back to the full-mastery default without it.
     -> { state: done|progress|not|missing, late: bool, answered, total, score: 0..1|null, doneAt }
        mastery also: { mastery: 0..1 mean over its topics, since: answers since it opened, min, target, met }
        timed (spec.controls.timeLimit, with an attempt in summary.att): { att, used: ms, tabs } */
  function status(a, sum, now, cur){
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
    } else if(a.kind === 'mastery'){
      // Done when every listed topic is at the target mastery, with at least min answers in them since it opened.
      // Questions per topic come from spec.qn (saved by the teacher's builder), so the student's browser,
      // which has no curriculum loaded, gets the same answer; cur fills in older assignments without it.
      var mt = topics || [], target = spec.target || 0.8, min = spec.min == null ? 10 : spec.min, qn = {};
      ((cur && cur.topics) || []).forEach(function(t){ qn[t.id] = t.qn; });
      Object.keys(spec.qn || {}).forEach(function(t){ qn[t] = spec.qn[t]; });
      var mine = rows(sum).filter(inScope).sort(function(x, y){ return x.seen - y.seen; });
      var valsAt = function(t){ return mt.map(function(id){
        var v = 0; mine.forEach(function(r){ if(r.t === id && r.seen <= t) v += credit(r, t); });
        return Math.min(1, v / (Math.min(FULL, qn[id] || FULL))); }); };
      var since = mine.filter(function(r){ return r.seen >= opens; });
      var vals = valsAt(now);
      out.total = mt.length; out.met = out.answered = vals.filter(function(v){ return v >= target; }).length;
      out.mastery = vals.length ? vals.reduce(function(x, y){ return x + y; }, 0) / vals.length : 0;
      out.score = out.mastery; out.since = since.length; out.min = min; out.target = target;
      if(mt.length && out.met === mt.length && since.length >= min){
        // Done at the first answer after which every topic was at the target with the minimum answered.
        out.state = 'done'; out.doneAt = since[since.length - 1].seen;
        for(var i = min - 1; i < since.length; i++){
          if(valsAt(since[i].seen).every(function(v){ return v >= target; })){ out.doneAt = since[i].seen; break; }
        }
      } else if(since.length) out.state = 'progress';
    } else if(a.kind === 'frq'){
      out.total = 1;
      var f = sum && sum.frq && spec.frq && sum.frq[spec.frq];
      if(f && f.ts >= opens){ out.state = 'done'; out.answered = 1; out.doneAt = f.ts; out.score = f.of ? f.got / f.of : null; out.frq = f; }
    }
    // Timed work: the engine's own record of the attempt beats the answers' times (the clock and tab leaves live there).
    var ctl = spec.controls || {}, at = ctl.timeLimit && sum && sum.att && a.id ? sum.att[a.id] : null;
    if(at && at.start){
      out.att = at; out.tabs = at.tabs || 0; out.used = at.end ? at.end - at.start : now - at.start;
      if(at.end){ out.state = 'done'; out.doneAt = at.end; out.answered = at.n; out.total = Math.max(out.total, at.n); out.score = at.n ? at.c / at.n : null; }
      else if(out.state !== 'done'){ out.state = 'progress'; out.answered = at.n; out.total = Math.max(out.total, at.n, 1); }
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

  var api = { COURSES: COURSES, ORDER: ORDER, isAp: isAp, curriculum: curriculum, summarize: summarize, href: href, topicHref: topicHref,
              bankUrl: bankUrl, bankItems: bankItems, whyUrl: whyUrl, rows: rows, topicMastery: topicMastery, unitMastery: unitMastery,
              overall: overall, lastActive: lastActive, answeredSince: answeredSince, status: status, itemStats: itemStats,
              flagCounts: flagCounts, DAY: DAY };
  if(typeof module === 'object' && module.exports) module.exports = api;
  root.LevlClassModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
