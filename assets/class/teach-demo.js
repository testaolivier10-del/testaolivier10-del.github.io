/* Sample class for /teach/?demo=1: made-up students in the middle of an AP® Biology term, built in the
   browser from real question ids so every teacher view shows what a full class looks like. Nothing is
   sent anywhere; edits live in memory until the page reloads. Loaded only by teach.js in demo mode.
   /teach/?demo=1&course=nremt is a second sample: an EMT (NREMT) class, built from NREMT's own records. */
(function(){
  'use strict';
  var M = window.LevlClassModel, DAY = 86400000, now = Date.now();
  var seed = 7; function rnd(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  var NAMES = ['Dev L.', 'Nora C.', 'Theo B.', 'Rosa G.', 'Marcus O.', 'Sam T.', 'Priya K.', 'Kai S.', 'Ava M.', 'Jordan P.', 'Leo W.', 'Eli H.', 'Mia R.', 'Omar F.', 'Grace Y.', 'Lucas D.', 'Zoe N.', 'Ben A.'];
  var HARD = { 'signal-transduction-pathways': 1, 'photosynthesis': 1, 'feedback': 1, 'cellular-respiration': 1 };
  var UNITS = ['unit-1', 'unit-2', 'unit-3', 'unit-4'];
  var COURSE = new URLSearchParams(location.search).get('course') === 'nremt' ? 'nremt' : 'apbio';
  var rep = null, building = null, nextId = 10, live = null, dept = COURSE === 'apbio', myQs = [];
  function iso(t){ return new Date(t).toISOString(); }

  function load(src){ return new Promise(function(res, rej){ var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  /* ?demo=1&course=nremt: an EMT class four weeks into a twelve-week course, built the same way from the real NREMT
     bank. Its students' records are written in NREMT's own shapes (nremt_mastery, nremt_exam100_history,
     nremt_exam100_flagged, nremt_picks_v1) and read through LevlClassModel's NREMT reader, as a real class would be. */
  function buildNremt(){
    var map = window.LevlClassNremt ? Promise.resolve() : load('/assets/class/nremt-map.js');
    return map.then(function(){
      return fetch('/nremt/assets/questions-core.json').then(function(r){ return r.ok ? r.json() : []; }, function(){ return []; });
    }).then(function(bank){
      var NM = window.LevlClassNremt, cur = M.curriculum('nremt', NM), ids = {};
      cur.topics.forEach(function(t){ ids[t.id] = t; });
      var info = function(id){ var ch = NM.q.substr(id * 2, 2); return ch === '..' ? null : NM.topics[ch.charCodeAt(0) - 97]; };
      var DONE = ['assessment', 'airway-respiratory'], NOW_U = 'cardiac-medical', HARDN = { cardiac: 1, pharmacology: 1, 'airway-management': 1 };
      var names = function(ts){ return ts.map(function(t){ return ids[t].title; }); };
      var cardiac = ['cardiac', 'pharmacology'], air = ['respiratory-emergencies'], assess = cur.topics.filter(function(t){ return t.unit === 'assessment'; }).map(function(t){ return t.id; });
      var A = [
        { id: 'a1', kind: 'practice', title: 'Cardiac emergencies and medications', spec: { topics: cardiac, topicNames: names(cardiac), count: 20 },
          opens_at: iso(now - 3 * DAY), due_at: iso(now + 1.2 * DAY), late_until: iso(now + 3 * DAY), required: true, students: null },
        { id: 'a2', kind: 'review', title: 'Redo your missed assessment questions', spec: { topics: assess, topicNames: names(assess), count: 15 },
          opens_at: iso(now - 6 * DAY), due_at: null, late_until: null, required: false, students: null },
        { id: 'a3', kind: 'exam', title: 'Full practice exam: midterm', spec: { unit: null },
          opens_at: iso(now - 9 * DAY), due_at: iso(now - 2 * DAY), late_until: null, required: true, students: null },
        { id: 'a4', kind: 'mastery', title: 'Master respiratory emergencies', spec: { topics: air, topicNames: names(air), target: 0.6, min: 10, qn: { 'respiratory-emergencies': ids['respiratory-emergencies'].qn } },
          opens_at: iso(now - 5 * DAY), due_at: iso(now + 4 * DAY), late_until: null, required: true, students: null }
      ];
      myQs = [
        { id: 'q-demo-1', course: 'nremt', topic: 'cardiac', unit: 'cardiac-medical', type: 'single', q: 'Our protocol: aspirin for suspected cardiac chest pain unless the patient has which of these?',
          options: ['A known aspirin allergy', 'A history of high blood pressure', 'Pain for more than ten minutes', 'An age over 65'], correct: 0, why: 'A true allergy is the contraindication our medical director lists; the others are not.' }
      ];
      var members = NAMES.map(function(name, i){
        var skill = 0.9 - i * 0.03, idle = name === 'Jordan P.' ? 9 : i % 4;
        var m = {}, picks = {}, flagged = [], hist = [];
        bank.forEach(function(it){
          var t = info(it.id); if(!t) return;
          var area = t.unit, inNow = area === NOW_U;
          if(DONE.indexOf(area) === -1 && !inNow) return;
          if(rnd() > (inNow ? (cardiac.indexOf(t.id) !== -1 ? 0.3 : 0.12) : 0.3)) return;
          if(name === 'Jordan P.' && inNow) return;
          var right = rnd() < skill - (HARDN[t.id] ? 0.22 : 0), seen = inNow ? now - (idle + rnd() * 2.5) * DAY : now - (6 + rnd() * 20) * DAY;
          var redo = !right && area === 'assessment' && rnd() < skill - 0.2;
          m[it.id] = { level: right || redo ? 1 + Math.floor(rnd() * 3) : 0, timesCorrect: redo ? 1 : (right ? 1 : 0), timesWrong: redo || !right ? 1 : 0, lastSeen: redo ? now - rnd() * 4 * DAY : seen };
          if(!it.type && it.options) picks[it.id] = right ? it.correct : (rnd() < 0.65 ? (it.correct + 1) % it.options.length : (it.correct + 2) % it.options.length);
          if(!right && HARDN[t.id] && rnd() < 0.06) flagged.push(it.id);
        });
        if(i !== 15 && i !== 16) hist.push({ score: Math.round(100 * Math.min(0.95, skill - 0.05)), total: 100, timeMs: 5400000, date: now - (i === 6 ? 1.5 : 4) * DAY });
        var store = { nremt_mastery: JSON.stringify(m), nremt_picks_v1: JSON.stringify(picks), nremt_exam100_flagged: JSON.stringify(flagged),
                      nremt_exam100_history: JSON.stringify(hist), nremt_lessons_v1: JSON.stringify(i < 10 ? { 'primary-assessment': now - 20 * DAY, 'airway': now - 12 * DAY } : {}) };
        return { id: 'u' + i, name: name, joined_at: iso(now - 30 * DAY), extra_days: name === 'Sam T.' ? 1 : 0, extra_time: name === 'Sam T.' ? 1.5 : 1,
                 summary: M.summarize('nremt', function(k){ return store[k] == null ? null : store[k]; }, now), summary_at: iso(now - idle * DAY) };
      });
      rep = { class: { id: 'demo', course: 'nremt', name: 'EMT-B, spring cohort (sample)', code: 'SAMPLE02', unit_order: cur.units.map(function(u){ return u.id; }),
                       current_unit: NOW_U, archived: false, created_at: iso(now - 32 * DAY), role: 'owner', owner_name: 'Ms. Rivera', coteach_code: 'CO7KQ4MD', dept_shared: false },
              coteachers: [],
              announcements: [{ id: 'n1', body: 'Skills night is Thursday: bring your BVM checklist. Finish the cardiac practice first.', created_at: iso(now - 0.4 * DAY), author: 'Ms. Rivera', mine: true }],
              members: members, assignments: A };
      return rep;
    });
  }
  function build(){
    if(COURSE === 'nremt') return buildNremt();
    var cur = window.ApBioCurriculum ? Promise.resolve() : load('/bio/assets/bio-curriculum.js');
    return cur.then(function(){
      return Promise.all(UNITS.map(function(u){ return fetch('/bio/assets/bank/' + u + '.json').then(function(r){ return r.ok ? r.json() : { items: [] }; }, function(){ return { items: [] }; }); }));
    }).then(function(banks){
      var cur = window.ApBioCurriculum, ids = {};
      cur.topics.forEach(function(t){ ids[t.id] = t; });
      var u4 = cur.topics.filter(function(t){ return t.unit === 'unit-4' && /signal/.test(t.id); }).map(function(t){ return t.id; }).slice(0, 3);
      var u3 = cur.topics.filter(function(t){ return t.unit === 'unit-3'; }).map(function(t){ return t.id; });
      var frq = cur.topics.filter(function(t){ return t.unit === 'unit-2'; }).map(function(t){ return t.id; }).slice(0, 2);
      var A = [
        { id: 'a1', kind: 'practice', title: 'Unit 4 practice: signal transduction', spec: { topics: u4, topicNames: u4.map(function(t){ return ids[t].title; }), count: 20 },
          opens_at: iso(now - 3 * DAY), due_at: iso(now + 0.8 * DAY), late_until: iso(now + 2.8 * DAY), required: true, students: null },
        { id: 'a2', kind: 'review', title: 'Redo your missed Unit 3 questions', spec: { topics: u3, topicNames: u3.map(function(t){ return ids[t].title; }), count: 15 },
          opens_at: iso(now - 6 * DAY), due_at: null, late_until: null, required: false, students: null },
        { id: 'a3', kind: 'exam', title: 'Unit 3 test: Cellular Energetics', spec: { unit: 'unit-3' },
          opens_at: iso(now - 10 * DAY), due_at: iso(now - 4 * DAY), late_until: null, required: true, students: null },
        { id: 'a4', kind: 'practice', title: 'Unit 2 catch-up: membranes', spec: { topics: frq, topicNames: frq.map(function(t){ return ids[t].title; }), count: 10 },
          opens_at: iso(now - 2 * DAY), due_at: iso(now + 4 * DAY), late_until: null, required: true, students: ['u9', 'u10', 'u11'] },
        { id: 'a5', kind: 'mastery', title: 'Master signal transduction', spec: { topics: u4, topicNames: u4.map(function(t){ return ids[t].title; }), target: 0.6, min: 10, qn: u4.reduce(function(o, t){ o[t] = ids[t].qn; return o; }, {}) },
          opens_at: iso(now - 5 * DAY), due_at: iso(now + 5 * DAY), late_until: iso(now + 7 * DAY), required: true, students: null },
        { id: 'a6', kind: 'practice', title: 'Unit 3 timed quiz', spec: { topics: u3.slice(0, 4), topicNames: u3.slice(0, 4).map(function(t){ return ids[t].title; }), count: 10,
          controls: { timeLimit: 20, shuffle: true, release: 'after_due', questions: ['q-demo-1'] } },
          opens_at: iso(now - 2 * DAY), due_at: iso(now - 0.5 * DAY), late_until: iso(now + 1 * DAY), required: true, students: null },
        // A free response, so the sample shows its scores and the scoring card (assets/class/teach-integrations.js).
        { id: 'a7', kind: 'frq', title: 'Free response: heat and beet membranes', spec: { frq: 'frq-beet-membrane-heat', points: 9 },
          opens_at: iso(now - 4 * DAY), due_at: iso(now + 2 * DAY), late_until: null, required: true, students: null }
      ];
      myQs = [
        { id: 'q-demo-1', course: 'apbio', topic: u3[0], unit: 'unit-3', type: 'single', q: 'An enzyme is heated to 80 °C and then cooled. Its activity stays low. What best explains this?',
          options: ['Its shape changed and did not return', 'Its substrate was used up', 'Cooling slowed every reaction', 'It gained a cofactor'], correct: 0, why: 'Heat breaks the bonds that hold the active site in shape; cooling does not rebuild them.' },
        { id: 'q-demo-2', course: 'apbio', topic: u4[0], unit: 'unit-4', type: 'single', q: 'A drug blocks a receptor’s ligand site. What happens to the signal inside the cell?',
          options: ['It is not started', 'It is amplified', 'It reverses direction', 'It starts without the ligand'], correct: 0, why: 'No ligand binding means no change in the receptor, so no relay starts.' },
        { id: 'q-demo-3', course: 'apbio', topic: u4[1] || u4[0], unit: 'unit-4', type: 'single', q: 'Why can one hormone molecule change thousands of molecules inside a cell?',
          options: ['Each step of the cascade activates many of the next', 'Hormones are very large', 'The hormone is copied inside the cell', 'Receptors divide'], correct: 0, why: 'Signal cascades amplify: each active enzyme activates many of the next.' }
      ];
      var members = NAMES.map(function(name, i){
        var skill = 0.93 - i * 0.035, idle = name === 'Jordan P.' ? 9 : i % 4;
        var q = {}, picks = {}, flags = {}, lessons = {};
        banks.forEach(function(b, bi){
          var u = UNITS[bi];
          (b.items || []).forEach(function(it){
            if(u === 'unit-4' && u4.indexOf(it.topic) === -1 && rnd() > 0.2) return;
            if(rnd() > (u === 'unit-4' ? 0.7 : 0.85)) return;
            var p = skill - (HARD[it.topic] ? 0.25 : 0) - (u === 'unit-4' ? 0.03 : 0);
            var right = rnd() < p, seen = u === 'unit-4' ? now - (idle + rnd() * 2.5) * DAY : now - (5 + rnd() * 40) * DAY;
            var redo = !right && u === 'unit-3' && rnd() < skill - 0.2;
            q[it.id] = { t: it.topic, u: u, n: redo ? 2 : 1, c: redo ? 1 : (right ? 1 : 0), right: right || redo ? 1 : 0, seen: redo ? now - rnd() * 4 * DAY : (u === 'unit-2' && (i === 10 || i === 11) && frq.indexOf(it.topic) !== -1 ? now - rnd() * 1.5 * DAY : seen), l: 'p' };
            if(it.type === 'single' && it.options) picks[it.id] = right ? it.correct : (rnd() < 0.65 ? (it.correct + 1) % it.options.length : (it.correct + 2) % it.options.length);
            if(!right && HARD[it.topic] && rnd() < 0.08) flags[it.id] = now - rnd() * 5 * DAY;
          });
        });
        if(name === 'Jordan P.') Object.keys(q).forEach(function(k){ if(q[k].u === 'unit-4') delete q[k]; });
        if(i > 13) Object.keys(q).forEach(function(k){ if(q[k].u === 'unit-4' && rnd() < 0.8) delete q[k]; });
        var hist = i === 15 ? [] : [{ ts: now - (i === 6 ? 3.5 : 6) * DAY, kind: 'unit', label: 'Unit 3 test', unit: 'unit-3', mcq: { c: Math.round(20 * Math.min(0.97, skill + 0.02)), n: 20 } }];
        // The timed quiz (a6): attempts as the course pages record them, with tab leaves for the integrity column.
        var att = {};
        if(i < 15 && name !== 'Jordan P.'){
          var st0 = now - 1.4 * DAY - i * 900000, mins = 11 + (i * 3) % 9;
          att.a6 = { start: st0, end: i === 13 ? 0 : st0 + mins * 60000, n: i === 13 ? 4 : 10, c: Math.round((i === 13 ? 4 : 10) * Math.min(0.95, skill)), tabs: i === 4 ? 5 : i === 9 ? 3 : i % 5 === 0 ? 1 : 0, answers: {} };
          if(name === 'Sam T.') att.a6.end = st0 + 27 * 60000;
          if(i === 12) { att.a6.start = now - 0.2 * DAY; att.a6.end = att.a6.start + 14 * 60000; }
        }
        // The free response (a7): most of the class has scored theirs against the rubric.
        var frqScores = i < 12 && name !== 'Jordan P.' ? { 'frq-beet-membrane-heat': { got: Math.max(2, Math.min(9, Math.round(9 * skill - (i % 3)))), of: 9, ts: now - (0.5 + (i % 3)) * DAY } } : {};
        var store = { apbio_progress_v1: JSON.stringify({ v: 1, q: q, lessons: lessons }), apbio_picks_v1: JSON.stringify(picks),
                      apbio_flagged_v1: JSON.stringify(flags), apbio_prefs_v1: JSON.stringify({ examHistory: hist, frqScores: frqScores }), levlprep_class_att_v1: JSON.stringify(att) };
        return { id: 'u' + i, name: name, joined_at: iso(now - 60 * DAY), extra_days: name === 'Sam T.' ? 1 : 0, extra_time: name === 'Sam T.' ? 1.5 : 1,
                 summary: M.summarize('apbio', function(k){ return store[k] == null ? null : store[k]; }, now), summary_at: iso(now - idle * DAY) };
      });
      rep = { class: { id: 'demo', course: 'apbio', name: 'Period 3 (sample)', code: 'SAMPLE01', unit_order: ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-6', 'unit-5', 'unit-7', 'unit-8'],
                       current_unit: 'unit-4', archived: false, created_at: iso(now - 62 * DAY), role: 'owner', owner_name: 'Ms. Rivera', coteach_code: 'CO7KQ4MD', dept_shared: true },
              coteachers: [{ id: 't2', name: 'Mr. Chen (student teacher)', added_at: iso(now - 40 * DAY) }],
              announcements: [{ id: 'n1', body: 'Unit 4 test moves to Friday. Finish the signal transduction mastery first, it is the best review.', created_at: iso(now - 0.3 * DAY), author: 'Ms. Rivera', mine: true },
                              { id: 'n2', body: 'Lab notebooks are due Monday at the start of class.', created_at: iso(now - 4 * DAY), author: 'Mr. Chen (student teacher)', mine: false }],
              members: members, assignments: A };
      return rep;
    });
  }
  function ready(){ if(rep) return Promise.resolve(rep); if(!building) building = build(); return building; }
  function copy(x){ return JSON.parse(JSON.stringify(x)); }

  /* Live mode: answers trickle in from the sample students after a question goes up. */
  function liveState(){
    if(!live) return { open: false };
    var want = Math.min(rep.members.length - 2, Math.floor((Date.now() - live.shownAt) / 700));
    while(!live.reveal && live.answers.length < want){
      var m = rep.members[live.answers.length], skill = 0.93 - live.answers.length * 0.035, n = live.item.options.length;
      var pick = rnd() < skill ? live.item.correct : (live.item.correct + 1 + Math.floor(rnd() * (n - 1))) % n;
      live.answers.push({ id: m.id, name: m.name, pick: pick, at: iso(Date.now()) });
    }
    return { open: true, idx: live.idx, item: live.item, reveal: live.reveal, started_at: iso(live.shownAt), members: rep.members.length, answers: copy(live.answers) };
  }
  function deptView(){
    if(!dept) return null;
    var mine = { n: rep.members.length, active7: 15, order: rep.class.unit_order, current: 'unit-4', units: { 'unit-1': 0.71, 'unit-2': 0.64, 'unit-3': 0.52, 'unit-4': 0.31 }, onTime: 0.82, overall: 0.37, assigned: rep.assignments.length };
    return { code: 'DEPT4SCI', name: 'Sample High School Science', teachers: ['Mr. Chen (student teacher)', 'Ms. Okafor', 'Ms. Rivera', 'Mr. Torres'],
      classes: [
        { id: 'demo', name: rep.class.name, course: 'apbio', teacher: 'Ms. Rivera', mine: true, members: rep.members.length, stats: mine, stats_at: iso(now) },
        { id: 'x2', name: 'Period 5', course: 'apbio', teacher: 'Ms. Rivera', mine: true, members: 24, stats: Object.assign({}, mine, { n: 24, active7: 21, units: { 'unit-1': 0.78, 'unit-2': 0.69, 'unit-3': 0.6, 'unit-4': 0.42 }, onTime: 0.9, overall: 0.44 }), stats_at: iso(now - DAY) },
        { id: 'x3', name: 'AP Chem A', course: 'apchem', teacher: 'Mr. Torres', mine: false, members: 27, stats: { n: 27, active7: 19, order: ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5'], current: 'unit-3', units: { 'unit-1': 0.66, 'unit-2': 0.58, 'unit-3': 0.29, 'unit-4': 0.05, 'unit-5': 0.02 }, onTime: 0.74, overall: 0.25 }, stats_at: iso(now - 2 * DAY) },
        { id: 'x4', name: 'APES 2', course: 'apenv', teacher: 'Ms. Okafor', mine: false, members: 31, stats: { n: 31, active7: 12, order: ['unit-1', 'unit-2', 'unit-3', 'unit-4'], current: 'unit-2', units: { 'unit-1': 0.55, 'unit-2': 0.33, 'unit-3': 0.04, 'unit-4': 0 }, onTime: 0.61, overall: 0.16 }, stats_at: iso(now - 3 * DAY) }
      ] };
  }

  function call(name, a){
    a = a || {};
    return ready().then(function(){
      switch(name){
        case 'teach_profile': return { name: 'Ms. Rivera', school: 'Sample High School' };
        case 'teach_my_classes':
          if(COURSE === 'nremt') return [{ id: 'demo', course: 'nremt', name: rep.class.name, code: rep.class.code, members: rep.members.length, archived: false, role: 'owner' },
                                         { id: 'demo5', course: 'nremt', name: 'EMT-B, evening cohort (sample)', code: 'SAMPLE06', members: 16, archived: false, role: 'owner' }];
          return [{ id: 'demo', course: 'apbio', name: rep.class.name, code: rep.class.code, members: rep.members.length, archived: false, role: 'owner' },
                                         { id: 'demo5', course: 'apbio', name: 'Period 5 (sample)', code: 'SAMPLE05', members: 24, archived: false, role: 'owner' },
                                         { id: 'demo7', course: 'apchem', name: 'AP Chem (sample, co-teaching)', code: 'SAMPLE07', members: 27, archived: false, role: 'co', teacher: 'Mr. Torres' }];
        case 'teach_class_report': return copy(rep);
        case 'teach_save_assignment':
          if(a.p_class !== 'demo') return 'other' + (nextId++);   // another sample class: pretend it saved
          var d = a.p_data || {}, id = a.p_id || ('a' + (nextId++)), old = rep.assignments.filter(function(x){ return x.id === id; })[0];
          var row = Object.assign({ id: id, opens_at: iso(Date.now()) }, old || {}, d, { id: id });
          if(old) rep.assignments[rep.assignments.indexOf(old)] = row; else rep.assignments.unshift(row);
          return id;
        case 'teach_delete_assignment': rep.assignments = rep.assignments.filter(function(x){ return x.id !== a.p_id; }); return true;
        case 'teach_update_class':
          var p = a.p_patch || {};
          ['name', 'unit_order', 'current_unit', 'archived', 'dept_shared'].forEach(function(k){ if(k in p) rep.class[k] = p[k]; });
          if(p.new_code) rep.class.code = 'SAMPLE0' + (nextId++ % 10);
          return copy(rep.class);
        case 'teach_set_member':
          var pp = a.p_patch || {};
          if(pp.remove){ rep.members = rep.members.filter(function(m){ return m.id !== a.p_student; }); return true; }
          rep.members.forEach(function(m){ if(m.id === a.p_student){ if('extra_days' in pp) m.extra_days = pp.extra_days; if('extra_time' in pp) m.extra_time = pp.extra_time; } });
          return true;
        case 'teach_delete_class': return true;
        case 'teach_copy_class': return { id: 'demo-copy', code: 'COPY' + (2345 + nextId++) };
        case 'teach_post_announcement':
          var nid = 'n' + (nextId++); rep.announcements.unshift({ id: nid, body: String(a.p_body || '').trim(), created_at: iso(Date.now()), author: 'Ms. Rivera', mine: true }); return nid;
        case 'teach_delete_announcement': rep.announcements = rep.announcements.filter(function(n){ return n.id !== a.p_id; }); return true;
        case 'teach_coteach_code': rep.class.coteach_code = 'CO' + (100000 + nextId++); return rep.class.coteach_code;
        case 'teach_coteach_remove': rep.coteachers = rep.coteachers.filter(function(t){ return t.id !== a.p_user; }); return true;
        case 'teach_coteach_join': return null;
        case 'teach_questions': case 'teach_class_questions': return copy(myQs);
        case 'teach_save_question':
          var qd = Object.assign({ type: 'single' }, a.p_data || {}), qid = a.p_id || ('q-demo-' + (nextId++)), qo = myQs.filter(function(x){ return x.id === qid; })[0];
          qd.id = qid; if(qo) myQs[myQs.indexOf(qo)] = qd; else myQs.push(qd); return qid;
        case 'teach_delete_question': myQs = myQs.filter(function(x){ return x.id !== a.p_id; }); return true;
        case 'teach_live_show': live = { idx: live ? live.idx + 1 : 1, item: copy(a.p_item), reveal: false, shownAt: Date.now(), answers: [] }; return live.idx;
        case 'teach_live_reveal': if(live) live.reveal = a.p_reveal !== false; return !!live;
        case 'teach_live_stop': live = null; return true;
        case 'teach_live_state': return liveState();
        case 'teach_dept_view': return deptView();
        case 'teach_dept_create': case 'teach_dept_join': dept = true; return name === 'teach_dept_create' ? 'DEPT4SCI' : true;
        case 'teach_dept_leave': dept = false; return true;
        default: return null;
      }
    });
  }
  window.LevlTeachDemo = { call: call };
})();
