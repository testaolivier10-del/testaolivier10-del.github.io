/* Teacher classes v2, stream A2: a teacher's assignment run on a course's own practice or exam page
   (docs/teacher-classes.md, "v2 build"). window.LevlClassRun, also loadable in node for
   scripts/test/class-run.test.mjs (the pure parts).

   A course page loads this file only when its address has ?la=<assignment id> (practice.js and exams.js
   in each course; review.js sends ?la= on to practice.html). Without la= nothing here is loaded and the
   page is exactly what it was.

   The assignment comes from localStorage['levlprep_classes_v1'] (class_mine, cached by class-student.js).
   Its spec.controls, all optional:
     timeLimit  minutes, times the class's extra_time. Practice: a clock in the strip, the set hands itself
                in at zero, and a reload keeps the clock (it runs from the first Start). Exams: the exam's own
                clock, its pace scaled so Section I takes the limit (Section II keeps the same pace).
                No limit on an exam: the exam's standard pace times extra_time. Exams cannot be paused here.
     shuffle    questions in a random order (stimulus sets kept whole) with the teacher's questions mixed
                in, and the teacher's options shuffled. Bank options are shuffled on every page already
                (except items whose order matters).
     release    'now': feedback after each answer (the course's normal practice).
                'after_submit': no right/wrong or explanations until the set is handed in.
                'after_due': not until the due date has passed (no due date: after handing in).
                A mastery assignment always gives feedback: it runs on what the student learns from it.
     questions  teacher question ids, read through the RPC class_questions_for(p_assignment). Quiet when
                the RPC is missing or fails: the set runs without them.
   Kinds: practice (spec.count questions in spec.topics or spec.unit), review (redo questions missed in the
   topics), mastery (spec.topics, spec.target, spec.min: keeps serving until every topic is at the target
   with at least min answers since it opened), exam (spec.unit: unit test, else a practice exam).

   The attempt is kept on this device in localStorage['levlprep_class_att_v1']:
     { <assignment id>: { start, end, n, c, tabs, answers: { <question id>: pick } } }
   start: first Start; end: last hand-in; n and c: questions answered and right on the first try (an exam:
   its questions and score); tabs: times the page was hidden during timed work; answers: first pick per
   question (at most 300). class-model.js summarize carries it to the teacher as summary.att, and
   class-student.js push sends it (the push is forced at hand-in). */
(function(root){
  'use strict';
  var CACHE = 'levlprep_classes_v1', ATT = 'levlprep_class_att_v1', HOLD = 'levlprep_class_hold_v1', MAX_ANS = 300;
  // Course id -> the class prefix its pages use (the exam engine finds its Start button and message by it).
  var PREFIX = { apbio: 'bio', apchem: 'chem', apphys: 'phys', apcalc: 'calc', apcalcbc: 'calc', apstat: 'stat', apenv: 'env', appsych: 'psy', apprecalc: 'pcalc', apmacro: 'mac', apmicro: 'mic', aphug: 'hug' };
  var RELEASES = { now: 1, after_submit: 1, after_due: 1 };

  function ts(v){ return v ? (typeof v === 'number' ? v : Date.parse(v)) : null; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ------------------------------------------------------------ pure parts */

  /* The assignment and its class from the cached class list ({ at, list } or a bare list). */
  function find(cache, id){
    var list = cache && (Array.isArray(cache) ? cache : cache.list);
    if(!id || !Array.isArray(list)) return null;
    for(var i = 0; i < list.length; i++){
      var as = list[i] && list[i].assignments || [];
      for(var j = 0; j < as.length; j++) if(as[j] && String(as[j].id) === String(id)) return { a: as[j], cls: list[i] };
    }
    return null;
  }

  function controls(a, cls){
    var c = (a && a.spec && a.spec.controls) || {}, x = +(cls && cls.extra_time);
    var extra = x > 0 && x < 10 ? x : 1, tl = +c.timeLimit > 0 ? +c.timeLimit : 0;
    return { timeLimit: tl, limitMs: tl ? Math.round(tl * 60000 * extra) : 0, extra: extra, shuffle: !!c.shuffle,
             release: RELEASES[c.release] ? c.release : 'now', questions: Array.isArray(c.questions) ? c.questions.map(String) : [] };
  }
  /* Feedback withheld while answering. */
  function held(kind, ctl){ return kind !== 'mastery' && ctl.release !== 'now'; }
  /* Right/wrong and explanations may be shown now. */
  function released(a, ctl, att, now){
    if(a.kind === 'mastery' || ctl.release === 'now') return true;
    var due = ts(a.due_at);
    if(ctl.release === 'after_due' && due) return now > due;
    return !!(att && att.end);
  }
  /* Timed work: tab leaves count, and a hand-in is final. */
  function timed(kind, ctl){ return !!ctl.limitMs || kind === 'exam'; }
  /* Time left on the class clock, ms; null when there is no class clock. */
  function remaining(ctl, att, now){
    if(!ctl.limitMs) return null;
    if(!att || !att.start) return ctl.limitMs;
    return Math.max(0, att.start + ctl.limitMs - now);
  }
  /* An exam's time budget, ms: the class limit, or the exam's standard time times extra time. */
  function examBudget(ctl, stdSec){ return ctl.limitMs || Math.round((stdSec > 0 ? stdSec : 0) * 1000 * ctl.extra); }
  /* An exam's pace multiplier: what is left of the budget over the exam's standard seconds. A running attempt
     (a reload) keeps its clock: the budget it started with (att.limit), from att.start. */
  function examK(ctl, att, now, stdSec){
    if(!(stdSec > 0)) return ctl.extra;
    var budget = att && att.start && !att.end && att.limit ? att.limit : examBudget(ctl, stdSec);
    var left = att && att.start && !att.end ? Math.max(0, att.start + budget - now) : budget;
    return Math.max(0.01, left / 1000 / stdSec);
  }
  /* The clock of a running attempt is gone (the class limit, or an exam's stored budget). */
  function timeGone(ctl, att, now){
    if(!att || !att.start || att.end) return false;
    var lim = ctl.limitMs || att.limit;
    return !!lim && att.start + lim <= now;
  }

  /* Attempt records (store: the parsed levlprep_class_att_v1 object; each returns it). */
  function rec(store, id){ return store[id] || (store[id] = { start: 0, end: 0, n: 0, c: 0, tabs: 0, answers: {} }); }
  function attStart(store, id, now){ var r = rec(store, id); if(!r.start) r.start = now; return store; }
  function attAnswer(store, id, qid, pick, correct){
    var r = rec(store, id); r.answers = r.answers || {};
    if(Object.prototype.hasOwnProperty.call(r.answers, qid) || Object.keys(r.answers).length >= MAX_ANS) return store;
    r.answers[qid] = pick === undefined ? null : pick; r.n++; if(correct) r.c++;
    return store;
  }
  function attTab(store, id){ rec(store, id).tabs++; return store; }
  function attEnd(store, id, now, score){
    var r = rec(store, id); r.end = now;
    if(score){ r.n = score.n; r.c = score.c; }
    return store;
  }

  /* Teacher questions (class_questions_for rows) as items of the course's own format. Their text is the
     teacher's, so it is escaped; own: true keeps them out of the course's progress, review and mastery.
     class_questions_for leaves out correct and why until the release allows them: such an item is ungraded
     (correct -1, never matched); class_submit grades it at hand-in (gradeTeacher). */
  function hasKey(t){ return t.correct != null && t.correct !== '' && +t.correct >= 0 && +t.correct < t.options.length; }
  /* topic and unit only when they are this course's own ids (they go into links on the page); else the
     fallback topic (the assignment's first) and its unit. cur: the course curriculum { topics, units }. */
  function place(t, cur, fallback){
    var T = {}, U = {};
    ((cur && cur.topics) || []).forEach(function(x){ T[x.id] = x; });
    ((cur && cur.units) || []).forEach(function(x){ U[x.id] = x; });
    var topic = typeof t.topic === 'string' && Object.prototype.hasOwnProperty.call(T, t.topic) ? t.topic : (fallback && T[fallback] ? fallback : '');
    var unit = typeof t.unit === 'string' && Object.prototype.hasOwnProperty.call(U, t.unit) && (!topic || T[topic].unit === t.unit) ? t.unit : (topic ? T[topic].unit || '' : '');
    return { topic: topic, unit: unit };
  }
  function teacherItems(rows, course, fixed, cur, fallback){
    return (Array.isArray(rows) ? rows : []).filter(function(t){
      return t && t.id != null && (!t.course || t.course === course) && Array.isArray(t.options) && t.options.length >= 2 && t.options.length <= 8 &&
        (t.correct == null || t.correct === '' || hasKey(t)) && t.q;
    }).map(function(t){
      var key = hasKey(t), at = place(t, cur, fallback);
      return { id: String(t.id), type: 'single', topic: at.topic, unit: at.unit, q: esc(t.q), options: t.options.map(esc),
               correct: key ? +t.correct : -1, ungraded: !key, why: key ? { correct: t.why ? esc(t.why) : 'Your teacher wrote this question.' } : null,
               fixed: !!fixed, level: 'apply', diff: 2, own: true, teacher: true };
    });
  }
  /* class_submit's answer -> { <id>: { correct, why } }. A1's shape is { recorded, at, answers: [{ id, correct, why }] }
     (answers only once the release allows); a bare list or a map keyed by id also work. */
  function submitted(res){
    var out = {};
    if(res && !Array.isArray(res) && typeof res === 'object' && 'recorded' in res) res = Array.isArray(res.answers) ? res.answers : [];
    if(Array.isArray(res)) res.forEach(function(r){ if(r && r.id != null) out[String(r.id)] = r; });
    else if(res && typeof res === 'object') Object.keys(res).forEach(function(k){ if(res[k] && typeof res[k] === 'object') out[k] = res[k]; });
    return out;
  }
  /* The attempt's right count once the teacher's questions are graded: c minus their first-try picks counted
     as wrong while ungraded, plus those that match the key now known (once each: rec.graded). ids: the
     ungraded question ids. */
  function gradeTeacher(rec, keys, ids){
    rec.graded = rec.graded || {};
    (ids || []).forEach(function(id){
      var k = keys[id], pick = rec.answers && rec.answers[id];
      if(!k || k.correct == null || rec.graded[id]) return;
      rec.graded[id] = 1;
      if(pick != null && +pick === +k.correct) rec.c = (rec.c || 0) + 1;
    });
    return rec;
  }

  /* Practice steps with the teacher's single questions: shuffled together, or the teacher's at the end. */
  function mixSteps(steps, items, shuffle, rnd){
    rnd = rnd || Math.random;
    var extra = (items || []).map(function(q){ return { stimulus: null, items: [q], topic: q.topic, unit: q.unit, teacher: true }; });
    var all = steps.concat(extra);
    if(!shuffle) return all;
    for(var i = all.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = all[i]; all[i] = all[j]; all[j] = t; }
    return all;
  }
  /* An exam's flat question list with the teacher's questions put in at set boundaries (never inside a set). */
  function mixFlat(list, items, shuffle, rnd){
    rnd = rnd || Math.random;
    var out = list.slice();
    (items || []).forEach(function(q){
      if(!shuffle){ out.push(q); return; }
      var cuts = [0];
      for(var i = 1; i <= out.length; i++) if(i === out.length || !out[i].stimulus || out[i].stimulus !== out[i - 1].stimulus) cuts.push(i);
      out.splice(cuts[Math.floor(rnd() * cuts.length)], 0, q);
    });
    return out;
  }

  /* Answers since the assignment opened in its topics (progress: the course's <course>_progress_v1). */
  function answeredSince(progress, topics, since){
    var q = (progress && progress.q) || {}, T = {}, n = 0;
    (topics || []).forEach(function(t){ T[t] = 1; });
    Object.keys(q).forEach(function(id){ var r = q[id]; if(r && r.n && T[r.t] && (r.seen || 0) >= since) n++; });
    return n;
  }
  /* Where a mastery assignment stands: value(topic) -> 0..1. */
  function masteryState(spec, value, n){
    var target = +spec.target > 0 && +spec.target <= 1 ? +spec.target : 0.8, min = spec.min != null ? Math.max(0, +spec.min | 0) : 10;
    var topics = (spec.topics || []).map(function(t){ var v = Math.max(0, Math.min(1, +value(t) || 0)); return { id: t, value: v, ok: v >= target }; });
    return { topics: topics, target: target, min: min, n: n, met: topics.length > 0 && topics.every(function(t){ return t.ok; }) && n >= min };
  }

  var pure = { find: find, controls: controls, held: held, released: released, timed: timed, remaining: remaining, examK: examK, examBudget: examBudget, timeGone: timeGone, place: place,
               attStart: attStart, attAnswer: attAnswer, attTab: attTab, attEnd: attEnd, teacherItems: teacherItems,
               mixSteps: mixSteps, mixFlat: mixFlat, answeredSince: answeredSince, masteryState: masteryState,
               submitted: submitted, gradeTeacher: gradeTeacher };
  if(typeof module === 'object' && module.exports){ module.exports = pure; return; }
  if(root.LevlClassRun) return;

  /* ------------------------------------------------------------ the page */

  function read(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } }
  function write(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function att(id){ var s = read(ATT); return s && s[id] || null; }
  function change(fn){ var s = read(ATT) || {}; fn(s); write(ATT, s); return s; }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function mmss(ms){ var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; s = s % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function mins(ms){ var m = Math.round(ms / 6000) / 10; return (m % 1 ? m.toFixed(1) : m) + ' min'; }
  function day(t){ return new Date(t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
  function pct(v){ return Math.round(v * 100) + '%'; }
  function laParam(){ try{ return new URLSearchParams(location.search).get('la'); }catch(e){ return null; } }
  function A(){ return root.StudyHubAccount; }

  function css(){
    [['lvClassCss', 'class.css'], ['lvRunCss', 'class-run.css']].forEach(function(f){
      if(document.getElementById(f[0])) return;
      var l = document.createElement('link'); l.id = f[0]; l.rel = 'stylesheet'; l.href = '/assets/class/' + f[1];
      document.head.appendChild(l);
    });
  }

  /* The class list: the cache, else class-student.js's fresh read, waited for a few seconds. */
  function lookup(id){
    var hit = find(read(CACHE), id);
    if(hit) return Promise.resolve(hit);
    return new Promise(function(done){
      var tries = 0;
      (function wait(){
        var S = root.LevlClassStudent;
        if(S && S.refresh) return S.refresh(true).then(function(){ done(find(read(CACHE), id)); }, function(){ done(null); });
        if(++tries > 16) return done(null);
        setTimeout(wait, 250);
      })();
    });
  }
  /* The teacher's questions, once the account is signed in; [] on any failure (A1 adds the RPC). */
  function teacherRows(a){
    var ids = controls(a, {}).questions;
    if(!ids.length || !A()) return Promise.resolve([]);
    return new Promise(function(done){
      var settled = false, t = setTimeout(function(){ finish(null); }, 6000);
      function finish(v){ if(settled) return; settled = true; clearTimeout(t); done(Array.isArray(v) ? v : []); }
      function go(){ if(!A().rpcData) return finish(null); A().rpcData('class_questions_for', { p_assignment: a.id }).then(finish, function(){ finish(null); }); }
      if(A().onAuthChange) A().onAuthChange(function(u){ if(u) go(); }); else go();
    });
  }
  function pushNow(course){
    var S = root.LevlClassStudent;
    if(!S || !S.refresh) return;
    S.refresh(false).then(function(){ if(S.noteDone) S.noteDone(course); S.push(course, true); }, function(){});
  }

  /* One run: the context the engine hooks call (CLS in practice.js and exams.js). */
  function Run(ad, hit, rows){
    var a = hit.a, cls = hit.cls, spec = a.spec || {}, ctl = controls(a, cls), self = this;
    var opens = ts(a.opens_at) || 0, strip = null, tick = null, on = false, tabsOn = false, listening = false;
    this.a = a; this.cls = cls; this.ctl = ctl; this.title = a.title || 'Assignment';
    this.kind = a.kind; this.held = held(a.kind, ctl);
    this.items = teacherItems(rows, ad.course, !ctl.shuffle, ad.cur, (spec.topics || [])[0]);

    function topicName(t){ var x = (ad.cur.topics || []).filter(function(y){ return y.id === t; })[0]; return x ? x.title : t; }
    function unitName(u){ var x = (ad.cur.units || []).filter(function(y){ return y.id === u; })[0]; return x ? (x.n ? 'Unit ' + x.n + ': ' : '') + x.title : u; }
    this.topicName = topicName;
    function mastery(){
      var C = ad.core;
      return masteryState(spec, function(t){ var m = C.topicMastery && C.topicMastery(t); return m ? m.value : 0; }, answeredSince(C.load ? C.load() : {}, spec.topics, opens));
    }
    this.mastery = mastery;
    // Leaving the page itself (a reload, a link) is not a tab leave.
    var leaving = false;
    window.addEventListener('beforeunload', function(){ leaving = true; });
    function onHide(){ if(tabsOn && !leaving && document.visibilityState === 'hidden'){ change(function(s){ attTab(s, a.id); }); paint(); } }
    function listen(){ tabsOn = timed(a.kind, ctl); if(!listening){ listening = true; document.addEventListener('visibilitychange', onHide); } }
    function unlisten(){ tabsOn = false; listening = false; document.removeEventListener('visibilitychange', onHide); }
    // A timed attempt already running (a reload): its tab leaves count from page load, not from Start.
    (function(){ var r = att(a.id); if(timed(a.kind, ctl) && r && r.start && !r.end && !timeGone(ctl, r, Date.now())) listen(); })();

    /* Answers held until release stay out of the course's progress (where the review queue and missed mode
       would show right and wrong): kept in levlprep_class_hold_v1, recorded into it at release. */
    function keep(q, correct, pick){
      var h = read(HOLD) || {}, m = h[a.id] || (h[a.id] = {});
      if(!Object.prototype.hasOwnProperty.call(m, q.id)) m[q.id] = [correct ? 1 : 0, q.topic, q.unit, q.practice || '', q.level || '', q.diff || 1, pick === undefined ? null : pick];
      write(HOLD, h);
    }
    function flush(){
      var h = read(HOLD) || {}, m = h[a.id], C = ad.core;
      if(!m) return;
      delete h[a.id]; write(HOLD, h);
      var pk = ad.course + '_picks_v1', picks = read(pk) || {};
      Object.keys(m).forEach(function(id){
        var x = m[id];
        if(C.record) C.record(id, !!x[0], { topic: x[1], unit: x[2], practice: x[3], level: x[4], diff: x[5], src: 'q' });
        if(typeof x[6] === 'number') picks[id] = x[6];
      });
      write(pk, picks);
    }
    this.flush = flush;

    function paint(){
      if(!strip) return;
      var r = att(a.id) || {}, bits = [];
      if(on && ctl.limitMs && ad.page === 'practice'){
        var left = remaining(ctl, r, Date.now());
        bits.push('<span class="lvr-time' + (left < 60000 ? ' is-low' : '') + '" role="timer" aria-label="Time left">' + mmss(left) + '</span>');
      }
      if(a.kind === 'mastery'){
        var m = mastery();
        bits.push('<span class="lvr-mast">' + m.topics.map(function(t){
          return '<span class="lvr-mt' + (t.ok ? ' is-ok' : '') + '"><b>' + esc(topicName(t.id)) + '</b> ' + pct(t.value) + '<i style="width:' + Math.round(Math.min(1, t.value / m.target) * 100) + '%"></i></span>';
        }).join('') + '<span class="lvr-mn">' + Math.min(m.n, m.min) + ' of ' + m.min + ' answers' + (m.met ? ' · goal reached' : '') + '</span></span>');
      }
      if(timed(a.kind, ctl) && (on || r.tabs)) bits.push('<span class="lvr-tabs">' + (r.tabs ? 'Left this tab ' + plural(r.tabs, 'time') : 'Leaving this tab is counted') + '</span>');
      if(r.end && !on) bits.push('<span class="lvr-done">Handed in ' + esc(day(r.end)) + '</span>');
      strip.innerHTML = '<p class="lvr-t"><span>From ' + esc(cls.teacher || 'your teacher') + '</span> ' + esc(self.title) + '</p>' + (bits.length ? '<div class="lvr-m">' + bits.join('') + '</div>' : '');
    }
    this.paint = paint;
    this.mountStrip = function(){
      css();
      if(!strip){
        strip = document.createElement('div');
        strip.className = 'lvr-strip'; strip.id = 'lvRunStrip'; strip.setAttribute('role', 'status');
        strip.setAttribute('data-cover', ad.course);
        ad.app.parentNode.insertBefore(strip, ad.app);
      }
      paint();
    };

    /* Started: the clock, tab counting. */
    this.begin = function(){
      on = true;
      change(function(s){ attStart(s, a.id, Date.now()); });
      listen();
      if(ctl.limitMs && ad.page === 'practice'){
        var warned = {};
        clearInterval(tick);
        tick = setInterval(function(){
          var left = remaining(ctl, att(a.id), Date.now());
          paint();
          [[300000, '5 minutes left.'], [60000, '1 minute left.']].forEach(function(w){
            if(ctl.limitMs > w[0] * 2 && left <= w[0] && !warned[w[0]]){ warned[w[0]] = 1; say(w[1]); }
          });
          if(left <= 0){ clearInterval(tick); say('Time is up. Your answers are handed in.'); ad.end(); }
        }, 500);
      }
      self.mountStrip();
    };
    function say(t){ var sr = document.getElementById('lvRunSr'); if(!sr){ sr = document.createElement('p'); sr.id = 'lvRunSr'; sr.className = 'sr-only'; sr.setAttribute('aria-live', 'assertive'); document.body.appendChild(sr); } sr.textContent = t; }

    /* Engine hooks. */
    this.opts = function(step, stage){
      var own = step && step.items && step.items[0] && step.items[0].own, o = {};
      if(own) o.record = false;
      if(self.held){
        o.exam = true; o.record = false;
        // Labels after the engine has drawn the step (hydrate is synchronous).
        setTimeout(function(){ if(stage) [].forEach.call(stage.querySelectorAll('button[class*="-check"]'), function(b){ b.textContent = 'Save answer'; }); }, 0);
      }
      return o;
    };
    this.answer = function(q, res){
      if(!on) return;
      change(function(s){ attAnswer(s, a.id, q.id, res.pick, !!res.correct); });
      if(self.held && ad.page === 'practice' && !q.own) keep(q, res.correct, res.pick);
      if(self.held && ad.page === 'practice'){
        var box = ad.app.querySelector('[data-qid="' + (root.CSS && CSS.escape ? CSS.escape(q.id) : q.id) + '"] .cx-fb');
        if(box) box.innerHTML = '<p class="lvr-saved">Answer saved. ' + (ctl.release === 'after_due' && ts(a.due_at) ? 'Answers come out after the due date.' : 'Answers come out when you hand in.') + '</p>';
      }
      paint();
    };
    /* Practice, after each step: a mastery run ends at the goal and refills until then. */
    this.step = function(session){
      if(a.kind !== 'mastery' || !on) return;
      paint();
      if(mastery().met){ session.steps.length = session.i + 1; return; }
      if(session.i + 1 >= session.steps.length && self.pool && self.pool.length){
        var last = session.steps[session.i], more = ad.order(self.pool.slice()).filter(function(s){ return s !== last; });
        Array.prototype.push.apply(session.steps, more.length ? more : self.pool.slice());
      }
    };
    /* Exams. */
    this.started = function(){ return on; };
    this.mix = function(list){ return mixFlat(list, self.items, ctl.shuffle); };
    /* The exam's questions have loaded and it starts now: the attempt starts here (never before a load), with
       its time budget kept so a reload resumes the same clock. */
    this.k = function(stdSec){
      if(!on) self.begin();
      change(function(s){ var r = s[a.id]; if(r && !r.limit) r.limit = examBudget(ctl, stdSec); });
      return examK(ctl, att(a.id), Date.now(), stdSec);
    };
    /* exams.js finish: a held answer stays out of progress (true) until release. */
    this.keep = function(x){ if(!self.held) return false; keep(x.q, x.r && x.r.correct, x.r ? x.r.pick : null); return true; };

    /* The picks on the teacher's questions go to class_submit (once per question, A1), which answers with the
       key when the release allows; the attempt's right count then takes them in. Quiet when it is missing. */
    function submit(r){
      var picks = {}, any = false;
      self.items.forEach(function(q){ if(r.answers && Object.prototype.hasOwnProperty.call(r.answers, q.id)){ picks[q.id] = r.answers[q.id]; any = true; } });
      pushNow(ad.course);
      if(!any || !A() || !A().rpcData) return;
      A().rpcData('class_submit', { p_assignment: a.id, p_picks: picks }).then(function(res){
        var keys = submitted(res), ids = self.items.filter(function(q){ return q.ungraded; }).map(function(q){ return q.id; });
        if(!Object.keys(keys).length) return;
        self.items.forEach(function(q){ var k = keys[q.id]; if(k && k.correct != null){ q.correct = +k.correct; q.ungraded = false; if(k.why) q.why = { correct: esc(k.why) }; } });
        change(function(s){ if(s[a.id]) gradeTeacher(s[a.id], keys, ids); });
        pushNow(ad.course);
      }, function(){});
    }

    /* Handed in: record, push, and say whether the engine may show its summary (false) or this held it (true). */
    this.done = function(list){
      if(!on) return false;
      on = false; clearInterval(tick);
      unlisten();
      var score = null;
      if(ad.page === 'exam'){ score = { n: list.length, c: list.filter(function(x){ return x.r && x.r.correct; }).length }; }
      var r = change(function(s){ attEnd(s, a.id, Date.now(), score); })[a.id];
      ad.clear();
      paint();
      submit(r);
      // The teacher's questions not yet graded here leave the page's own summary (class_submit grades them).
      for(var i = list.length - 1; i >= 0; i--) if(list[i].q && list[i].q.ungraded) list.splice(i, 1);
      if(released(a, ctl, r, Date.now())){ flush(); return false; }
      ad.view('summary');
      ad.app.innerHTML = '<div class="lvr-card"><h2 tabindex="-1">Handed in</h2><p>' + plural(r.n, 'question') + ' answered for <b>' + esc(self.title) + '</b>. ' +
        (ctl.release === 'after_due' && ts(a.due_at) ? 'Your teacher shows the answers and your score after the due date, ' + esc(day(ts(a.due_at))) + '. Open this assignment again then to see them.' : 'Your teacher shows the answers later.') + '</p>' +
        '<p class="lvr-acts"><a class="btn-press" href="./">Back to the course</a></p></div>';
      var h = ad.app.querySelector('h2'); if(h) h.focus();
      return true;
    };
  }

  /* What the set is, in words, for the start card. */
  function describe(run, ad){
    var a = run.a, s = a.spec || {}, c = run.ctl, out = [];
    var topics = (s.topics || []).map(run.topicName);
    var where = topics.length ? topics.slice(0, 4).join(', ') + (topics.length > 4 ? ' and ' + (topics.length - 4) + ' more' : '') : '';
    if(a.kind === 'practice') out.push(plural(s.count || 10, 'question') + (where ? ' from ' + esc(where) : ''));
    else if(a.kind === 'review') out.push('Redo up to ' + plural(s.count || 25, 'question') + ' you missed' + (where ? ' in ' + esc(where) : ''));
    else if(a.kind === 'mastery'){ var m = run.mastery(); out.push('Keep going until every topic is at ' + pct(m.target) + ' mastery, with at least ' + plural(m.min, 'answer') + ': ' + esc(where)); }
    else if(a.kind === 'exam') out.push(s.unit ? 'A unit test' : 'A full practice exam');
    if(run.items.length) out.push('Includes ' + plural(run.items.length, 'question') + ' written by your teacher');
    if(c.limitMs) out.push('Time limit: ' + mins(c.limitMs) + (c.extra !== 1 ? ' (your extra time included)' : '') + '. The clock starts when you press Start and keeps running if you leave or reload the page');
    else if(a.kind === 'exam') out.push('Timed at the exam\'s pace' + (c.extra !== 1 ? ', with your extra time (×' + c.extra + ')' : '') + '. The clock cannot be paused');
    if(timed(a.kind, c)) out.push('Leaving this tab while the clock runs is counted, and your teacher sees the count');
    out.push(a.kind === 'mastery' || c.release === 'now' ? 'Right or wrong, with the explanation, after each answer'
      : c.release === 'after_due' && ts(a.due_at) ? 'Answers and explanations after the due date (' + esc(day(ts(a.due_at))) + ')' : 'Answers and explanations after you hand in');
    if(a.due_at) out.push('Due ' + esc(day(ts(a.due_at))));
    return out;
  }

  /* The released answers: each question, the student's pick and the key, with the explanation. */
  function reviewHtml(run, qs, r){
    var L = 'ABCDEFGH';
    return '<div class="lvr-card lvr-review"><h2 tabindex="-1">Your answers: ' + esc(run.title) + '</h2><p>' + r.c + ' of ' + plural(r.n, 'question') + ' right on the first try.</p><ol>' + qs.map(function(q){
      var pick = r.answers ? r.answers[q.id] : null, key = [].concat(q.correct), body = '';
      if(Array.isArray(q.options) && typeof q.correct !== 'undefined' && q.type !== 'order'){
        var picks = pick == null ? [] : [].concat(pick);
        body = '<ul class="lvr-opts">' + q.options.map(function(o, i){
          var isKey = key.indexOf(i) > -1, isPick = picks.indexOf(i) > -1;
          return '<li class="' + (isKey ? 'is-key' : isPick ? 'is-no' : '') + '"><span class="lvr-l">' + L[i] + '</span><span>' + o + '</span>' + (isPick ? ' <b class="lvr-tag">Your answer</b>' : '') + (isKey ? ' <b class="lvr-tag is-key">Correct</b>' : '') + '</li>';
        }).join('') + '</ul>';
      } else body = '<p>You answered: <b>' + esc(pick == null ? 'no answer' : typeof pick === 'object' ? JSON.stringify(pick) : pick) + '</b></p>';
      return '<li><p class="lvr-stem">' + q.q + '</p>' + body + (q.why && q.why.correct ? '<p class="lvr-why"><b>Why:</b> ' + q.why.correct + '</p>' : '') + '</li>';
    }).join('') + '</ol><p class="lvr-acts"><a class="btn-press" href="./">Back to the course</a></p></div>';
  }
  function showAnswers(run, ad){
    var r = att(run.a.id) || {}, ids = Object.keys(r.answers || {}), mine = {};
    run.items.forEach(function(q){ mine[q.id] = q; });
    var bank = ids.filter(function(id){ return !mine[id]; });
    ad.app.innerHTML = '<p class="lvr-note">Loading your answers…</p>';
    ad.core.loadQuestions(ad.base, bank).then(function(full){
      return Promise.all(full.map(function(q){ return ad.core.loadWhy ? ad.core.loadWhy(ad.base, q) : q; })).then(function(){ return full; });
    }).then(function(full){
      var by = {}; full.forEach(function(q){ by[q.id] = q; });
      var qs = ids.map(function(id){ return mine[id] || by[id]; }).filter(Boolean);
      ad.view('summary');
      ad.app.innerHTML = reviewHtml(run, qs, r);
      var h = ad.app.querySelector('h2'); if(h) h.focus();
    }, function(){ ad.app.innerHTML = '<p class="lvr-note">Your answers did not load. Check your connection and reload.</p>'; });
  }

  function note(ad, html){
    css();
    var n = document.createElement('div');
    n.className = 'lvr-strip is-note'; n.setAttribute('role', 'status'); n.innerHTML = '<p class="lvr-t">' + html + '</p>';
    ad.app.parentNode.insertBefore(n, ad.app);
  }

  /* The start card: what the set is, then Start (or where it stands when it is handed in). */
  function intro(run, ad, go){
    var a = run.a, r = att(a.id), now = Date.now(), ended = r && r.end, final = ended && timed(a.kind, run.ctl);
    var gone = timeGone(run.ctl, r, now);
    if(gone){ change(function(s){ attEnd(s, a.id, r.start + (run.ctl.limitMs || r.limit), null); }); r = att(a.id); final = true; pushNow(ad.course); }
    var rel = r && r.end && released(a, run.ctl, r, now) && Object.keys(r.answers || {}).length;
    if(r && r.end && released(a, run.ctl, r, now)){
      run.flush();
      // Released: the teacher's keys came with the questions; grade their picks into the attempt once.
      var keys = {}; run.items.forEach(function(q){ if(!q.ungraded) keys[q.id] = { correct: q.correct }; });
      var before = r.c;
      change(function(s){ gradeTeacher(s[a.id], keys, run.items.map(function(q){ return q.id; })); });
      r = att(a.id); if(r.c !== before) pushNow(ad.course);
    }
    var noExam = a.kind === 'exam' && !final && !(r && r.start && !r.end) && ad.core.freeExam && ad.core.freeExam().available === false;
    var P = PREFIX[ad.course] || 'x';
    var startWord = r && r.start && !r.end ? 'Keep going' : ended ? 'Practice it again' : 'Start';
    ad.view('setup');
    ad.app.innerHTML = '<div class="lvr-card" data-cover="' + esc(ad.course) + '"><p class="lvr-k">From ' + esc(run.cls.teacher || 'your teacher') + ' · ' + esc(run.cls.name || '') + '</p>' +
      '<h2 tabindex="-1">' + esc(run.title) + '</h2>' +
      (noExam ? '<p class="lvr-st">You have used the one free practice exam in this course, so this exam cannot start. Exams are part of Premium: ask your teacher about Class Premium.</p>' : '') +
      (final ? '<p class="lvr-st">' + (gone ? 'The time ran out' : 'Handed in ' + esc(day(r.end))) + '. ' + plural(r.n || 0, 'question') + ' answered.' +
        (rel ? '' : run.ctl.release === 'after_due' && ts(a.due_at) ? ' Answers come out after the due date.' : '') + '</p>'
        : ended ? '<p class="lvr-st">Handed in ' + esc(day(r.end)) + '. You can practice it again; it adds to the same assignment.</p>' : '') +
      '<ul class="lvr-list">' + describe(run, ad).map(function(x){ return '<li>' + x + '.</li>'; }).join('') + '</ul>' +
      '<p class="lvr-acts">' + (final || noExam ? '' : '<button type="button" class="btn-press ' + P + '-pr-start" data-lvr="start">' + startWord + '</button>') +
      (rel ? '<button type="button" class="' + (final ? 'btn-press' : 'btn-outline') + '" data-lvr="answers">See your answers</button>' : '') +
      '<button type="button" class="btn-outline" data-lvr="own">Practice on your own instead</button></p>' +
      '<p class="lvr-note ' + P + '-pr-avail" role="status"></p><p class="lvr-note">Your teacher sees your work in this course only.</p></div>';
    var st = ad.app.querySelector('[data-lvr="start"]');
    if(st) st.addEventListener('click', function(){ st.disabled = true; st.textContent = 'Loading questions…'; go(st); });
    var an = ad.app.querySelector('[data-lvr="answers"]');
    if(an) an.addEventListener('click', function(){ showAnswers(run, ad); });
    ad.app.querySelector('[data-lvr="own"]').addEventListener('click', function(){ try{ history.replaceState(null, '', location.pathname); }catch(e){} ad.fallback(); });
    run.mountStrip();
    var h = ad.app.querySelector('h2'); if(h) h.focus();
  }

  function prepare(ad){
    var id = laParam();
    ad.app.innerHTML = '<p class="lvr-note">Loading your assignment…</p>';
    return lookup(id).then(function(hit){
      if(!hit){ note(ad, 'This assignment is not in your classes on this device. Sign in with the account you joined the class with. Until then, this page works as usual.'); ad.fallback(); return null; }
      var C = root.LevlClassModel && root.LevlClassModel.COURSES, dir = C && C[hit.cls.course] && C[hit.cls.course].dir;
      if(hit.cls.course !== ad.course && !(dir && location.pathname.split('/')[1] === dir)){ note(ad, 'This assignment is for another course.'); ad.fallback(); return null; }
      if(ts(hit.a.opens_at) > Date.now()){ note(ad, esc(hit.a.title) + ' opens ' + esc(day(ts(hit.a.opens_at))) + '.'); ad.fallback(); return null; }
      return teacherRows(hit.a).then(function(rows){ return new Run(ad, hit, rows); });
    });
  }

  /* What the page hands over (the hooks there stay small: they weigh on every visit). Both: { app, cur, core,
     base, view, begin, set(run|null), fallback }; practice.js adds blocks, pick (pickOrder), take, finish;
     exams.js adds cfg and units (builtUnits). */
  function wire(ad, page){
    ad.page = page; ad.course = ad.core.COURSE;
    ad.clear = function(){ ad.set(null); };
    if(page === 'practice'){
      ad.order = function(bs){ return ad.pick(bs, true); };
      ad.run = function(c, steps){ ad.set(c); ad.begin('class', steps); };
      ad.end = function(){ ad.finish(); };
    } else ad.start = function(c){
      var sp = c.a.spec || {}, cfg = ad.cfg;
      ad.set(c); cfg.form = ''; cfg.section = '';
      if(sp.unit && ad.units().some(function(u){ return u.id === sp.unit; })){ cfg.kind = 'unit'; cfg.unit = sp.unit; } else cfg.kind = 'full';
      if(sp.count) cfg.len = sp.count;
      ad.begin();
    };
    return ad;
  }
  function safe(ad, p){ return p.then(null, function(){ ad.fallback(); return null; }); }

  /* Practice, review and mastery on practice.js. */
  function practice(ad){
    wire(ad, 'practice');
    return safe(ad, prepare(ad).then(function(run){
      if(!run) return null;
      var a = run.a, s = a.spec || {}, T = {};
      (s.topics || []).forEach(function(t){ T[t] = 1; });
      var inScope = function(b){ return s.topics && s.topics.length ? T[b.topic] : s.unit ? b.unit === s.unit : true; };
      intro(run, ad, function(btn){
        var pool;
        if(a.kind === 'review'){
          var miss = {}; (ad.core.missed ? ad.core.missed() : []).forEach(function(id){ miss[id] = 1; });
          pool = ad.take(ad.order(ad.blocks.filter(function(b){ return inScope(b) && b.items.some(function(q){ return miss[q.id]; }); })), s.count || 25);
        } else if(a.kind === 'mastery') pool = ad.order(ad.blocks.filter(inScope));
        else pool = ad.take(ad.order(ad.blocks.filter(inScope)), s.count || 10);
        if(run.ctl.shuffle) pool = mixSteps(pool, [], true);
        var stubs = []; pool.forEach(function(b){ b.items.forEach(function(q){ stubs.push(q); }); });
        ad.core.loadQuestions(ad.base, stubs).then(function(full){
          var by = {}; full.forEach(function(q){ by[q.id] = q; });
          var steps = pool.map(function(b){ return { stimulus: b.stimulus, items: b.items.map(function(q){ return by[q.id]; }).filter(Boolean), topic: b.topic, unit: b.unit }; })
            .filter(function(x){ return x.items.length; });
          if(a.kind === 'mastery') run.pool = steps.slice();
          steps = mixSteps(steps, run.items, run.ctl.shuffle);
          if(!steps.length){
            btn.textContent = 'Nothing to do';
            btn.insertAdjacentHTML('afterend', '<span class="lvr-note"> ' + (a.kind === 'review' ? 'Nothing to redo in these topics right now: no missed questions there.' : 'No questions are published for these topics yet.') + '</span>');
            return;
          }
          run.begin();
          ad.run(run, steps);
        }).catch(function(){ btn.disabled = false; btn.textContent = 'Try again'; });
      });
      return run;
    }));
  }

  /* Exams on exams.js. */
  function exam(ad){
    wire(ad, 'exam');
    return safe(ad, prepare(ad).then(function(run){
      if(!run) return null;
      intro(run, ad, function(btn){
        // Resuming a started exam (a reload) uses the same free exam it started with, not a second one.
        var r = att(run.a.id);
        if(r && r.start && !r.end){ var fe = read('levlprep_free_exam_v1'); if(fe && fe[ad.course]){ delete fe[ad.course]; write('levlprep_free_exam_v1', fe); } }
        ad.start(run);
        // The engine re-enables the button with a message when the questions fail to load; a start that never
        // comes (nothing to draw) gets the same.
        setTimeout(function(){
          if(run.started() || !btn.disabled || !btn.isConnected) return;
          btn.disabled = false; btn.textContent = 'Start';
          var m = ad.app.querySelector('.lvr-card [role="status"]'); if(m) m.textContent = 'The exam did not start. Check your connection and try again.';
        }, 20000);
      });
      return run;
    }));
  }

  root.LevlClassRun = { practice: practice, exam: exam, pure: pure };
})(typeof window !== 'undefined' ? window : globalThis);
