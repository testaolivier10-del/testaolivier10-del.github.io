/* Sample class for /teach/?demo=1: made-up students in the middle of an AP® Biology term, built in the
   browser from real question ids so every teacher view shows what a full class looks like. Nothing is
   sent anywhere; edits live in memory until the page reloads. Loaded only by teach.js in demo mode. */
(function(){
  'use strict';
  var M = window.LevlClassModel, DAY = 86400000, now = Date.now();
  var seed = 7; function rnd(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  var NAMES = ['Dev L.', 'Nora C.', 'Theo B.', 'Rosa G.', 'Marcus O.', 'Sam T.', 'Priya K.', 'Kai S.', 'Ava M.', 'Jordan P.', 'Leo W.', 'Eli H.', 'Mia R.', 'Omar F.', 'Grace Y.', 'Lucas D.', 'Zoe N.', 'Ben A.'];
  var HARD = { 'signal-transduction-pathways': 1, 'photosynthesis': 1, 'feedback': 1, 'cellular-respiration': 1 };
  var UNITS = ['unit-1', 'unit-2', 'unit-3', 'unit-4'];
  var rep = null, building = null, nextId = 10;
  function iso(t){ return new Date(t).toISOString(); }

  function load(src){ return new Promise(function(res, rej){ var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function build(){
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
          opens_at: iso(now - 2 * DAY), due_at: iso(now + 4 * DAY), late_until: null, required: true, students: ['u9', 'u10', 'u11'] }
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
        var store = { apbio_progress_v1: JSON.stringify({ v: 1, q: q, lessons: lessons }), apbio_picks_v1: JSON.stringify(picks),
                      apbio_flagged_v1: JSON.stringify(flags), apbio_prefs_v1: JSON.stringify({ examHistory: hist }) };
        return { id: 'u' + i, name: name, joined_at: iso(now - 60 * DAY), extra_days: name === 'Sam T.' ? 1 : 0, extra_time: name === 'Sam T.' ? 1.5 : 1,
                 summary: M.summarize('apbio', function(k){ return store[k] == null ? null : store[k]; }, now), summary_at: iso(now - idle * DAY) };
      });
      rep = { class: { id: 'demo', course: 'apbio', name: 'Period 3 (sample)', code: 'SAMPLE01', unit_order: ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-6', 'unit-5', 'unit-7', 'unit-8'],
                       current_unit: 'unit-4', archived: false, created_at: iso(now - 62 * DAY) }, members: members, assignments: A };
      return rep;
    });
  }
  function ready(){ if(rep) return Promise.resolve(rep); if(!building) building = build(); return building; }
  function copy(x){ return JSON.parse(JSON.stringify(x)); }

  function call(name, a){
    a = a || {};
    return ready().then(function(){
      switch(name){
        case 'teach_profile': return { name: 'Ms. Rivera', school: 'Sample High School' };
        case 'teach_my_classes': return [{ id: 'demo', course: 'apbio', name: rep.class.name, code: rep.class.code, members: rep.members.length, archived: false }];
        case 'teach_class_report': return copy(rep);
        case 'teach_save_assignment':
          var d = a.p_data || {}, id = a.p_id || ('a' + (nextId++)), old = rep.assignments.filter(function(x){ return x.id === id; })[0];
          var row = Object.assign({ id: id, opens_at: iso(Date.now()) }, old || {}, d, { id: id });
          if(old) rep.assignments[rep.assignments.indexOf(old)] = row; else rep.assignments.unshift(row);
          return id;
        case 'teach_delete_assignment': rep.assignments = rep.assignments.filter(function(x){ return x.id !== a.p_id; }); return true;
        case 'teach_update_class':
          var p = a.p_patch || {};
          ['name', 'unit_order', 'current_unit', 'archived'].forEach(function(k){ if(k in p) rep.class[k] = p[k]; });
          if(p.new_code) rep.class.code = 'SAMPLE0' + (nextId++ % 10);
          return copy(rep.class);
        case 'teach_set_member':
          var pp = a.p_patch || {};
          if(pp.remove){ rep.members = rep.members.filter(function(m){ return m.id !== a.p_student; }); return true; }
          rep.members.forEach(function(m){ if(m.id === a.p_student){ if('extra_days' in pp) m.extra_days = pp.extra_days; if('extra_time' in pp) m.extra_time = pp.extra_time; } });
          return true;
        case 'teach_delete_class': return true;
        default: return null;
      }
    });
  }
  window.LevlTeachDemo = { call: call };
})();
