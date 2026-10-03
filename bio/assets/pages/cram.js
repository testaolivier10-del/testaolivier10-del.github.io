/* The AP® Biology cram kit (docs/apbio-spec.md section 1, "Cram kit", and
   decision 26; docs/apbio-architecture.md, "App pages").

   Two parts in one file:

   1. window.ApBioCramPlan, the plan generator. Pure: no DOM, no storage, no
      clock (the page passes today's date), so scripts/test/apbio-cram.test.mjs
      runs it in Node. build(opts) counts a 3-week or 2-week plan back from
      the exam date, day by day, from a fixed template of study, practice-exam,
      exam-review, rest and exam-eve days, and shares the study sessions out
      over the course units by the midpoint of each unit's exam weight range,
      times a weakness factor (1.5 − unit mastery) when the student has data
      and the personalised plan is allowed (Premium).

   2. The cram.html page: the plan picker (exam date, 3 or 2 weeks), the plan
      as a printable day list with "done" ticks kept in localStorage
      apbio_cram_v1, and the timed mixed sets, which are the exams page's
      "mixed" kind (exams.html?mode=mixed&n=10|20|30; bio/assets/pages/
      exams.js), not a second engine.

   Premium (ApBioCore.allowed('cram')): the personalised plan and the timed
   sets. Free users get the outline, weighted by exam weight only, and can
   print it. While premium.js has the course off sale everything is open. */
(function(){
  var W = typeof window !== 'undefined' ? window : this;
  var DAY = 86400000;
  var DEFAULT_EXAM = '2027-05-03';

  /* ------------------------------------------------ the generator */

  function pad(n){ return (n < 10 ? '0' : '') + n; }
  /* Dates are calendar days, worked in UTC so a daylight-saving change can
     never add or drop a day. */
  function parse(s){ var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; }
  function iso(ms){ var d = new Date(ms); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function addDays(s, n){ return iso(parse(s) + n * DAY); }
  function daysBetween(a, b){ return Math.round((parse(b) - parse(a)) / DAY); }

  /* The day templates, by position (1 = the first day). s: a study day in
     course order; w: a study day on the weakest (or, without data, the
     heaviest) units; x: a full practice exam; r: review of the exam before
     it; o: rest; e: the day before the exam. The first practice exam comes
     early enough to steer the plan, the second four or five days before the
     real one, each followed by a day to go through it. */
  var TEMPLATES = {
    3: 'sssssxorsssssosxrwwwe',
    2: 'ssssxrossxrwwe'
  };
  var KIND = { s: 'study', w: 'weak', x: 'exam', r: 'review', o: 'rest', e: 'eve' };
  var SLOTS_PER_DAY = 2;

  function mid(u){ return Array.isArray(u.weight) ? (u.weight[0] + u.weight[1]) / 2 : 0; }

  /* Largest-remainder split of `n` over keys by weight, each key at least
     `min` (as exams.js splits Section I). */
  function split(n, weights, min){
    var keys = Object.keys(weights), out = {}, used = 0;
    keys.forEach(function(k){ out[k] = min || 0; used += out[k]; });
    var rest = n - used, tw = keys.reduce(function(s, k){ return s + weights[k]; }, 0);
    if(rest <= 0 || !tw) return out;
    var got = 0;
    keys.forEach(function(k){ var f = Math.floor(rest * weights[k] / tw); out[k] += f; got += f; });
    var rem = keys.map(function(k){ return { k: k, r: rest * weights[k] / tw - Math.floor(rest * weights[k] / tw) }; })
      .sort(function(a, b){ return b.r - a.r || keys.indexOf(a.k) - keys.indexOf(b.k); });
    for(var i = 0; got < rest; i++, got++) out[rem[i % rem.length].k]++;
    return out;
  }

  /* opts: {
       exam: 'YYYY-MM-DD',
       weeks: 3 | 2,
       units: [{ id, n, title, weight: [lo, hi], part }]   course units (others ignored)
       topics: [{ id, unit, title, ced, built }]           course order
       mastery: null | { units: { id: { value, answered } }, topics: { id: { value, answered } } }
       frqs: [{ id, type, title, units }]                  optional
     } */
  function build(opts){
    var weeks = opts.weeks === 2 ? 2 : 3;
    var tpl = TEMPLATES[weeks], L = tpl.length;
    var exam = parse(opts.exam) ? opts.exam : DEFAULT_EXAM;
    var start = addDays(exam, -L);
    var units = (opts.units || []).filter(function(u){ return u.part === 'course' || (u.part == null && Array.isArray(u.weight)); });
    var M = opts.mastery || null;
    var personal = !!(M && Object.keys(M.units || {}).some(function(k){ return (M.units[k] || {}).answered > 0; }));
    function um(id){ var m = personal && M.units[id]; return m ? m.value || 0 : 0; }
    function tm(id){ var m = personal && M.topics && M.topics[id]; return m ? { value: m.value || 0, answered: m.answered || 0 } : { value: 0, answered: 0 }; }

    // Weight per unit: exam weight, times the weakness factor when personal.
    var weights = {};
    units.forEach(function(u){ weights[u.id] = mid(u) * (personal ? 1.5 - Math.min(1, Math.max(0, um(u.id))) : 1); });
    var tw = units.reduce(function(s, u){ return s + weights[u.id]; }, 0);
    var shares = {};
    units.forEach(function(u){ shares[u.id] = tw ? weights[u.id] / tw : 0; });

    // Course-order study sessions: every unit at least one.
    var studyDays = tpl.split('').filter(function(c){ return c === 's'; }).length;
    var slots = split(studyDays * SLOTS_PER_DAY, weights, units.length <= studyDays * SLOTS_PER_DAY ? 1 : 0);
    var seq = [];
    units.forEach(function(u){
      var k = slots[u.id] || 0;
      var ts = (opts.topics || []).filter(function(t){ return t.unit === u.id; });
      for(var i = 0; i < k; i++){
        // The unit's topics shared over its sessions in course order.
        var a = Math.floor(ts.length * i / k), b = Math.floor(ts.length * (i + 1) / k);
        seq.push({ unit: u.id, topics: ts.slice(a, b).map(function(t){ return t.id; }), part: i + 1, of: k });
      }
    });

    // The weak-spot days: lowest mastery first, or heaviest exam weight.
    var ranked = units.slice().sort(function(a, b){
      return personal ? (um(a.id) - um(b.id)) || (mid(b) - mid(a)) : (mid(b) - mid(a)) || (a.n - b.n);
    }).map(function(u){ return u.id; });
    function weakTopics(us){
      if(!personal) return [];
      return (opts.topics || []).filter(function(t){ return us.indexOf(t.unit) > -1 && t.built !== false; })
        .map(function(t){ return { id: t.id, m: tm(t.id) }; })
        .filter(function(x){ return x.m.value < 0.6; })
        .sort(function(a, b){ return a.m.value - b.m.value; }).slice(0, 4).map(function(x){ return x.id; });
    }

    // One free-response question per study day, matched to its units when
    // one is left, cycling through the types otherwise.
    var frqs = (opts.frqs || []).slice(), usedF = {};
    function pickFrq(us){
      var free = frqs.filter(function(f){ return !usedF[f.id]; });
      if(!free.length){ usedF = {}; free = frqs.slice(); }
      var f = free.filter(function(f){ return (f.units || []).some(function(u){ return us.indexOf(u) > -1; }); })[0] || free[0];
      if(f) usedF[f.id] = 1;
      return f ? f.id : null;
    }

    var days = [], si = 0, wi = 0, examN = 0;
    for(var n = 1; n <= L; n++){
      var c = tpl.charAt(n - 1), d = { n: n, date: addDays(start, n - 1), kind: KIND[c], units: [], topics: [], weak: [], set: 0, frq: null };
      if(c === 's' || c === 'w'){
        if(c === 's'){
          var part = seq.slice(si, si + SLOTS_PER_DAY); si += SLOTS_PER_DAY;
          d.sessions = part;
          part.forEach(function(p){ if(d.units.indexOf(p.unit) < 0) d.units.push(p.unit); d.topics = d.topics.concat(p.topics); });
          d.weak = weakTopics(d.units).filter(function(t){ return d.topics.indexOf(t) > -1; });
        } else {
          d.units = [ranked[(wi * 2) % ranked.length], ranked[(wi * 2 + 1) % ranked.length]].filter(function(u, i, a){ return u && a.indexOf(u) === i; });
          wi++;
          d.weak = weakTopics(d.units);
          d.topics = d.weak.slice();
        }
        // Set length grows through the plan: 10, then 20, then 30.
        d.set = c === 'w' || n > L * 2 / 3 ? 30 : n > L / 3 ? 20 : 10;
        d.frq = pickFrq(d.units);
      } else if(c === 'x'){ d.exam = ++examN; }
      else if(c === 'r'){ d.exam = examN; }
      else if(c === 'e'){ d.units = ranked.slice(0, 2); }
      days.push(d);
    }
    return { weeks: weeks, length: L, exam: exam, start: start, end: addDays(exam, -1), personal: personal, shares: shares, slots: slots, ranked: ranked, days: days };
  }

  var API = { build: build, parse: parse, iso: iso, addDays: addDays, daysBetween: daysBetween, TEMPLATES: TEMPLATES, DEFAULT_EXAM: DEFAULT_EXAM };
  W.ApBioCramPlan = API;

  /* ------------------------------------------------ the page */

  if(typeof document === 'undefined') return;
  var app = document.getElementById('app');
  if(!app || app.getAttribute('data-slug') !== 'cram') return;
  var BASE = W.ApBioBase || '';
  var Core = W.ApBioCore, CUR = W.ApBioCurriculum || { units: [], topics: [] };
  var STORE = 'apbio_cram_v1', DATE_KEY = 'apbio_exam_date';
  var frqList = [];
  var UNIT = {}, TOPIC = {}, FRQ = {};
  CUR.units.forEach(function(u){ UNIT[u.id] = u; });
  CUR.topics.forEach(function(t){ TOPIC[t.id] = t; });

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function load(){ try{ var s = JSON.parse(localStorage.getItem(STORE) || '{}'); return s && typeof s === 'object' ? s : {}; }catch(e){ return {}; } }
  function save(s){ try{ localStorage.setItem(STORE, JSON.stringify(s)); }catch(e){} }
  function todayIso(){ var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function nice(s, long){ var o = { weekday: long ? 'long' : 'short', month: long ? 'long' : 'short', day: 'numeric', timeZone: 'UTC' }; if(long) o.year = 'numeric'; return new Date(parse(s)).toLocaleDateString('en-US', o); }
  function examDate(){
    var D = W.LevlExamDate, v = D && D.read ? D.read('apbio') : null;
    if(!v){ try{ v = localStorage.getItem(DATE_KEY); }catch(e){} }
    return /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : DEFAULT_EXAM;
  }
  function unitLabel(id){ var u = UNIT[id]; return u ? 'Unit ' + u.n + ': ' + u.title : id; }
  function unitShort(id){ var u = UNIT[id]; return u ? 'Unit ' + u.n : id; }
  function allowed(){ return !Core || !Core.allowed || Core.allowed('cram'); }
  function mins(n){ return Math.round(n * 1.5) + ' min'; }

  var state = load();
  if(state.weeks !== 2 && state.weeks !== 3) state.weeks = 3;
  if(!state.done || typeof state.done !== 'object') state.done = {};

  function mastery(){
    if(!Core || !allowed()) return null;
    var out = { units: {}, topics: {} };
    CUR.units.forEach(function(u){ if(u.part === 'course') out.units[u.id] = Core.unitMastery(u.id); });
    CUR.topics.forEach(function(t){ if(t.built) out.topics[t.id] = Core.topicMastery(t.id); });
    return out;
  }
  function plan(){
    return API.build({ exam: examDate(), weeks: state.weeks, units: CUR.units, topics: CUR.topics.filter(function(t){ return UNIT[t.unit] && UNIT[t.unit].part === 'course'; }), mastery: mastery(), frqs: frqList });
  }

  function link(href, label, extra){ return '<a href="' + esc(BASE + href) + '"' + (extra || '') + '>' + label + '</a>'; }
  function topicLinks(ids, weak){
    return ids.map(function(id){
      var t = TOPIC[id]; if(!t) return '';
      var name = esc((t.ced ? t.ced + ' ' : '') + t.title) + (weak && weak.indexOf(id) > -1 ? ' <span class="bio-cr-weak">weak spot</span>' : '');
      return '<li>' + (t.built ? link('notes/' + id + '.html', name) : name + ' <span class="bio-small">(coming soon)</span>') + '</li>';
    }).join('');
  }
  function sheet(u){ var x = UNIT[u]; return x && x.built ? link('unit-sheets/' + u + '.html', esc(unitLabel(u)) + ' unit sheet') : esc(unitLabel(u)) + ' <span class="bio-small">(unit sheet coming soon)</span>'; }
  function setLink(n){ return link('exams.html?mode=mixed&n=' + n, 'Timed mixed set: ' + n + ' questions in ' + mins(n)) + (allowed() ? '' : ' <span class="bio-small">(Premium)</span>'); }
  function frqLink(id){ var f = id && FRQ[id]; return f ? link('frq/' + id + '.html', 'One free-response question: ' + esc(f.title)) : link('frq.html', 'One free-response question of your choice'); }

  var TITLE = { study: 'Study', weak: 'Weak spots', exam: 'Practice exam', review: 'Go through the exam', rest: 'Rest', eve: 'The day before' };
  function dayBody(d, p){
    var li = [];
    if(d.kind === 'study'){
      li.push('<li>' + d.units.map(sheet).join(' &middot; ') + '</li>');
      var ts = topicLinks(d.topics, d.weak);
      if(ts) li.push('<li>Notes, then the lesson where a topic is shaky:<ul class="bio-cr-topics">' + ts + '</ul></li>');
      li.push('<li>' + setLink(d.set) + '</li>', '<li>' + frqLink(d.frq) + '</li>');
    } else if(d.kind === 'weak'){
      li.push('<li>' + d.units.map(sheet).join(' &middot; ') + '</li>');
      li.push(d.topics.length ? '<li>Your weakest topics here:<ul class="bio-cr-topics">' + topicLinks(d.topics, d.topics) + '</ul></li>'
        : '<li>' + (p.personal ? 'The topics you missed in the practice exams' : 'The units worth the most on the exam') + ': ' + link('practice.html?mode=missed', 'practice your misses') + ' or ' + link('practice.html?mode=weak', 'your weakest topics') + '</li>');
      li.push('<li>' + setLink(d.set) + '</li>', '<li>' + frqLink(d.frq) + '</li>');
    } else if(d.kind === 'exam'){
      li.push('<li>' + link('exams.html?mode=full', 'Practice exam ' + d.exam + ': 60 multiple-choice questions in 90 min, then 6 free-response questions in 90 min') + '</li>');
      li.push('<li>' + (d.exam === 1 ? 'Take it as a baseline, under exam conditions, even if you have not reviewed every unit yet.' : 'Same time of day as the real exam if you can. Then score Section II with the rubrics.') + '</li>');
    } else if(d.kind === 'review'){
      li.push('<li>Go through every question you missed in practice exam ' + d.exam + ', with its explanation: ' + link('review.html', 'your review queue') + ' and ' + link('practice.html?mode=missed', 'practice your misses') + '.</li>');
      li.push('<li>Check which units and science practices pulled your score down on ' + link('dashboard.html', 'your dashboard') + '; ' + (d.exam === 1 ? 'the plan’s weak-spot days use it.' : 'the last days go there.') + '</li>');
    } else if(d.kind === 'rest'){
      li.push('<li>No new questions today. If you want something, ten minutes of ' + link('flashcards.html', 'flashcards') + '.</li>');
    } else if(d.kind === 'eve'){
      li.push('<li>Skim two unit sheets: ' + d.units.map(sheet).join(' and ') + '.</li>');
      li.push('<li>A few ' + link('flashcards.html', 'flashcards') + ' and the formula sheet. No timed sets. Sleep.</li>');
    }
    return '<ul class="bio-cr-todo">' + li.join('') + '</ul>';
  }

  function render(){
    var p = plan(), today = todayIso(), ok = allowed();
    var doneN = p.days.filter(function(d){ return state.done[d.date]; }).length;
    var toStart = API.daysBetween(today, p.start), toExam = API.daysBetween(today, p.exam);
    var when = toExam < 0 ? 'That exam date has passed. Set your next one above.'
      : toStart > 0 ? 'Starts ' + nice(p.start, true) + ', in ' + plural(toStart, 'day') + '.'
      : toExam === 0 ? 'Your exam is today. Good luck.'
      : 'Day ' + (1 - toStart) + ' of ' + p.length + '. Your exam is in ' + plural(toExam, 'day') + '.';
    var fit = p.personal ? '<p class="bio-cr-note"><b>Fitted to you.</b> Study sessions lean toward your weakest units (' + p.ranked.slice(0, 3).map(unitShort).join(', ') + '), and weak-spot days list your weakest topics.</p>'
      : ok ? '<p class="bio-cr-note">Weighted by each unit’s share of the exam. Answer some practice questions and the plan leans toward your weakest units and topics.</p>'
      : '<p class="bio-cr-note">This outline is weighted by each unit’s share of the exam. Premium fits it to your weakest units and topics, and opens the timed mixed sets.</p>' + (Core && Core.gate ? Core.gate('cram', 'cram') : '');
    var rows = CUR.units.filter(function(u){ return u.part === 'course'; }).map(function(u){
      return '<tr><th scope="row">' + esc(unitLabel(u.id)) + '</th><td>' + (Array.isArray(u.weight) ? u.weight[0] + '–' + u.weight[1] + '%' : '') + '</td><td>' + (p.slots[u.id] || 0) + '</td><td>' + Math.round((p.shares[u.id] || 0) * 100) + '%</td></tr>';
    }).join('');
    var html = '<section class="bio-cr-pick bio-cr-noprint" aria-labelledby="bio-cr-pick-h"><h2 id="bio-cr-pick-h">Your plan</h2>' +
      '<form class="bio-cr-form" novalidate><label class="bio-pr-field bio-cr-date"><span>Exam date</span><input type="date" name="exam" value="' + esc(p.exam) + '"></label>' +
      '<fieldset class="bio-cr-weeks"><legend>Plan length</legend>' +
        [3, 2].map(function(w){ return '<label class="bio-pr-mode"><input type="radio" name="weeks" value="' + w + '"' + (p.weeks === w ? ' checked' : '') + '><span class="bio-pr-mode-t">' + w + '-week plan</span><span class="bio-pr-mode-d">' + (w === 3 ? '21 days: 14 study days, two practice exams, two rest days.' : '14 days: 8 study days, two practice exams, one rest day.') + '</span></label>'; }).join('') +
      '</fieldset></form></section>' +
      '<div class="bio-cr-head"><h2 class="bio-cr-title">The ' + p.weeks + '-week plan to ' + esc(nice(p.exam, true)) + '</h2>' +
      '<p class="bio-cr-when">' + esc(when) + '</p>' + fit +
      '<div class="bio-cr-bar bio-cr-noprint"><p class="bio-cr-progress" aria-live="polite">' + doneN + ' of ' + p.length + ' days done</p>' +
        '<button type="button" class="btn-outline" data-act="print">Print the plan</button>' + (doneN ? '<button type="button" class="link-quiet bio-cr-clear" data-act="clear">Clear the ticks</button>' : '') + '</div></div>' +
      '<details class="bio-cr-split"><summary>How the study sessions are shared out</summary><div class="table-wrap" tabindex="0" role="region" aria-label="Study sessions per unit"><table><caption class="sr-only">Study sessions per unit</caption><thead><tr><th scope="col">Unit</th><th scope="col">Exam weight</th><th scope="col">Sessions</th><th scope="col">Share</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="bio-small">Each study day has two sessions. Every unit gets at least one; the rest go by the middle of each unit’s exam weight range' + (p.personal ? ', times a factor that grows as your mastery of the unit falls (1.5 minus your mastery)' : '') + '. Skills practice comes inside the units’ questions and the free-response questions.</p></details>' +
      '<ol class="bio-cr-days">' + p.days.map(function(d){
        var done = !!state.done[d.date], isToday = d.date === today;
        return '<li class="bio-cr-day is-' + d.kind + (done ? ' is-done' : '') + (isToday ? ' is-today' : '') + '"' + (isToday ? ' aria-current="date"' : '') + '>' +
          '<div class="bio-cr-dhead"><h3><span class="bio-cr-dn">Day ' + d.n + '</span> <span class="bio-cr-dd">' + esc(nice(d.date)) + '</span> <span class="bio-cr-dk">' + TITLE[d.kind] + (d.kind === 'exam' ? ' ' + d.exam : '') + (d.kind === 'study' || d.kind === 'weak' ? ': ' + esc(d.units.map(unitShort).join(' + ')) : '') + '</span>' + (isToday ? ' <span class="bio-cr-today">Today</span>' : '') + '</h3>' +
          '<label class="bio-cr-check bio-cr-noprint"><input type="checkbox" data-day="' + d.date + '"' + (done ? ' checked' : '') + '> Done<span class="sr-only">: day ' + d.n + '</span></label></div>' +
          dayBody(d, p) + '</li>';
      }).join('') + '</ol>' +
      '<p class="bio-cr-examday"><b>' + esc(nice(p.exam, true)) + ': exam day.</b> Eat, bring pencils, a calculator and your ID; the formula sheet is provided.</p>' +
      '<section class="bio-cr-sets bio-cr-noprint" aria-labelledby="bio-cr-sets-h"><h2 id="bio-cr-sets-h">Timed mixed sets</h2>' +
        '<p>Questions from every published unit, in proportion to each unit’s exam weight, with stimulus sets kept whole. Timed at the real exam’s pace: 90 minutes for 60 questions, so 1.5 minutes a question. No feedback until the end, then every question with its explanation.</p>' +
        (ok ? '<div class="bio-cr-setbtns">' + [10, 20, 30].map(function(n){ return '<a class="btn-press" href="' + esc(BASE + 'exams.html?mode=mixed&n=' + n) + '">' + n + ' questions <span class="bio-cr-min">' + mins(n) + '</span></a>'; }).join('') + '</div>'
          : (Core && Core.gate ? Core.gate('cram', 'cram-sets') : '')) +
      '</section>';
    app.innerHTML = html;
  }

  function announce(msg){ var el = app.querySelector('.bio-cr-progress'); if(el) el.textContent = msg; }
  app.addEventListener('change', function(e){
    var t = e.target;
    if(t.name === 'weeks'){ state.weeks = +t.value; save(state); render(); var r = app.querySelector('input[name="weeks"][value="' + state.weeks + '"]'); if(r) r.focus(); }
    else if(t.name === 'exam'){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(t.value)) return;
      try{ localStorage.setItem(DATE_KEY, t.value); }catch(x){}
      render(); var i = app.querySelector('input[name="exam"]'); if(i) i.focus();
    } else if(t.hasAttribute && t.hasAttribute('data-day')){
      var k = t.getAttribute('data-day');
      if(t.checked) state.done[k] = 1; else delete state.done[k];
      save(state);
      var li = t.closest('.bio-cr-day'); if(li) li.classList.toggle('is-done', t.checked);
      var p = plan(), n = p.days.filter(function(d){ return state.done[d.date]; }).length, day = p.days.filter(function(d){ return d.date === k; })[0];
      announce((day ? 'Day ' + day.n + (t.checked ? ' done. ' : ' not done. ') : '') + n + ' of ' + p.length + ' days done');
    }
  });
  app.addEventListener('submit', function(e){ e.preventDefault(); });
  app.addEventListener('click', function(e){
    var b = e.target.closest('[data-act]'); if(!b) return;
    if(b.getAttribute('data-act') === 'print') W.print();
    if(b.getAttribute('data-act') === 'clear'){ state.done = {}; save(state); render(); var pb = app.querySelector('[data-act="print"]'); if(pb) pb.focus(); }
  });

  function boot(){
    render();
    fetch(BASE + 'assets/frq/index.json').then(function(r){ return r.ok ? r.json() : []; }).then(function(l){
      frqList = (l || []).filter(function(f){ return !f.placeholder; });
      frqList.forEach(function(f){ FRQ[f.id] = f; });
      render();
    }).catch(function(){});
  }
  W.addEventListener('storage', function(e){ if(e.key === STORE || e.key === DATE_KEY){ state = load(); if(state.weeks !== 2 && state.weeks !== 3) state.weeks = 3; if(!state.done) state.done = {}; render(); } });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
