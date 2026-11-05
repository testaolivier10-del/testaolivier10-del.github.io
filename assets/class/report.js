/* The family progress report (teach/report.html, docs/teacher-classes.md stream C).

   Two ways in:
     #t=<token>         a share link a teacher or the student made: read only, no sign-in, expires (the Worker
                        answers POST /class/report with what that one student's report needs, nothing more)
     ?c=<class>&s=<id>  the teacher, signed in, printing from Settings (teach_class_report, teach_frq_work)
   Everything on the page is worked out from the student's own summary with assets/class/class-model.js, the same
   numbers the teacher sees. Print uses the browser's own print (or save as PDF). */
(function(){
  'use strict';
  var API = 'https://api.levlprep.com'; // site-config:API_URL
  var M = window.LevlClassModel, DAY = 86400000;
  var app = document.getElementById('rpApp');
  function A(){ return window.StudyHubAccount; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function pct(v){ return v == null ? '·' : Math.round(v * 100) + '%'; }
  function day(t){ return t ? new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }
  function say(html){ app.innerHTML = '<div class="lv-card">' + html + '</div>'; }

  function loadScript(src){ return new Promise(function(res, rej){ var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function curriculum(course){
    var C = M.COURSES[course];
    if(!C) return Promise.resolve({ units: [], topics: [] });
    if(window[C.g]) return Promise.resolve(window[C.g]);
    return loadScript('/' + C.cur).then(function(){ return window[C.g] || { units: [], topics: [] }; }, function(){ return { units: [], topics: [] }; });
  }

  var LABEL = { done: 'Done', progress: 'In progress', not: 'Not started', missing: 'Missing' };
  var KIND = { practice: 'Practice', review: 'Review', exam: 'Practice exam', frq: 'Free response', mastery: 'Mastery' };

  function render(d, cur){
    var now = Date.now(), sum = d.summary;
    var tm = M.topicMastery(sum, cur, now);
    var order = (d.class.unit_order && d.class.unit_order.length ? d.class.unit_order : cur.units.map(function(u){ return u.id; }))
      .filter(function(id){ return cur.units.some(function(u){ return u.id === id && (!u.part || u.part === 'course'); }); });
    var units = order.map(function(id){ var u = cur.units.filter(function(x){ return x.id === id; })[0]; return { u: u, v: M.unitMastery(tm, cur, id) }; });
    var last = M.lastActive(sum);
    var rows = (d.assignments || []).map(function(a){
      var s = M.status(a, sum, now), ts = a.teacher_score;
      var score = ts && ts.of ? ts.got + ' / ' + ts.of : (s.score != null && s.state !== 'not' ? pct(s.score) : '');
      return '<tr><td><b>' + esc(a.title) + '</b><br><span class="rp-mut">' + esc(KIND[a.kind] || a.kind) + (a.required ? '' : ' · optional') + (a.due_at ? ' · due ' + esc(day(Date.parse(a.due_at))) : '') + '</span>' +
        (ts && ts.comment ? '<p class="rp-comment">Teacher’s comment: ' + esc(ts.comment) + '</p>' : '') + '</td>' +
        '<td><span class="rp-st rp-' + s.state + '">' + LABEL[s.state] + (s.late ? ' (late)' : '') + '</span></td><td>' + esc(score) + '</td></tr>';
    }).join('');
    var counts = { done: 0, missing: 0 };
    (d.assignments || []).forEach(function(a){ var s = M.status(a, sum, now); if(s.state === 'done') counts.done++; if(s.state === 'missing') counts.missing++; });
    var C = M.COURSES[d.class.course] || {};
    app.innerHTML =
      '<article class="rp-doc">' +
        '<header class="rp-head"><p class="lv-kick">' + esc(C.name || '') + ' · progress report</p><h1 class="lv-h1">' + esc(d.student) + '</h1>' +
        '<p class="rp-mut">' + esc(d.teacher ? d.teacher + '’s ' : '') + esc(d.class.name) + ' · ' + esc(day(now)) + (last ? ' · last studied ' + esc(day(last)) : ' · no study recorded yet') + '</p></header>' +
        '<section class="rp-tiles"><div><b>' + pct(M.overall(tm, cur)) + '</b><span>mastery across the course</span></div><div><b>' + counts.done + ' of ' + (d.assignments || []).length + '</b><span>assignments done</span></div><div><b>' + counts.missing + '</b><span>missing</span></div></section>' +
        '<section><h2 class="lv-h2">Mastery by <span>unit</span></h2><ul class="rp-units">' + units.map(function(x){
          return '<li><span>' + esc(x.u ? (x.u.n ? 'Unit ' + x.u.n + ': ' : '') + x.u.title : '') + '</span><span class="rp-bar" aria-hidden="true"><i style="width:' + Math.round(x.v * 100) + '%"></i></span><b>' + pct(x.v) + '</b></li>';
        }).join('') + '</ul><p class="rp-mut">Mastery counts questions answered right recently, weighted by difficulty, out of what full mastery of each topic takes.</p></section>' +
        '<section><h2 class="lv-h2">Assignments</h2>' + (rows ? '<div class="table-wrap rp-tablewrap" tabindex="0"><table class="rp-table"><thead><tr><th>Assignment</th><th>Status</th><th>Score</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="rp-mut">No assignments yet.</p>') + '</section>' +
        '<div class="rp-foot"><p class="rp-mut">From LevlPrep (levlprep.com). Every number comes from this student’s own work in this course and is what their teacher sees. ' +
          (d.expires_at ? 'This link stops working on ' + esc(day(Date.parse(d.expires_at))) + '.' : '') + '</p></div>' +
      '</article>' +
      '<div class="lv-btns rp-noprint"><button type="button" class="lv-btn" id="rpPrint">Print or save as PDF</button></div>';
    document.getElementById('rpPrint').addEventListener('click', function(){ window.print(); });
    document.title = d.student + ' · progress report | LevlPrep';
  }

  function fromShare(t){
    fetch(API + '/class/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: t }) })
      .then(function(r){ return r.json().then(function(b){ if(!r.ok) throw b; return b; }); })
      .then(function(d){ if(!d || !d.class) throw {}; return curriculum(d.class.course).then(function(cur){ render(d, cur); }); })
      .catch(function(e){ say('<h1 class="lv-h2">This link does not <span>work</span></h1><p class="lv-mut">' + esc((e && e.error) || 'It may have expired.') + ' Ask the teacher or the student for a new one.</p>'); });
  }

  function fromTeacher(classId, studentId){
    var started = false;
    A().onAuthChange(function(u){
      if(!u){ say('<h1 class="lv-h2">Sign in to print a <span>report</span></h1><p class="lv-mut">Use the account that teaches this class.</p><p><button class="lv-btn" id="rpIn" type="button">Sign in</button></p>'); var b = document.getElementById('rpIn'); if(b) b.onclick = function(){ A().openAuthModal(); }; return; }
      if(started) return; started = true;
      Promise.all([A().rpcData('teach_class_report', { p_class: classId }), A().rpcData('teach_profile', {}).catch(function(){ return null; })]).then(function(r){
        var rep = r[0], prof = r[1];
        var m = rep && rep.members.filter(function(x){ return x.id === studentId; })[0];
        if(!m){ say('<p class="lv-mut">That student is not in this class.</p>'); return; }
        var extra = (m.extra_days || 0) * DAY;
        var mine = rep.assignments.filter(function(a){ return !a.students || a.students.indexOf(m.id) !== -1; }).map(function(a){
          var b = {}; for(var k in a) b[k] = a[k];
          b.due_at = a.due_at ? new Date(Date.parse(a.due_at) + extra).toISOString() : null;
          b.late_until = a.late_until ? new Date(Date.parse(a.late_until) + extra).toISOString() : null;
          return b;
        });
        var frqs = mine.filter(function(a){ return a.kind === 'frq'; });
        return Promise.all(frqs.map(function(a){ return A().rpcData('teach_frq_work', { p_assignment: a.id }).then(function(w){ var hit = (w || []).filter(function(x){ return x.student === m.id; })[0]; a.teacher_score = hit && hit.score; }, function(){}); }))
          .then(function(){ return curriculum(rep.class.course); })
          .then(function(cur){ render({ class: rep.class, teacher: prof && (prof.display_name || prof.name), student: m.name, summary: m.summary, assignments: mine }, cur); });
      }, function(){ say('<p class="lv-mut">Could not load the class. Check you are signed in as its teacher.</p>'); });
    });
  }

  function boot(){
    var t = (location.hash.match(/[#&]t=([A-Za-z0-9_-]+)/) || [])[1];
    var q = new URLSearchParams(location.search);
    if(t) fromShare(t);
    else if(q.get('c') && q.get('s') && A() && A().onAuthChange) fromTeacher(q.get('c'), q.get('s'));
    else say('<h1 class="lv-h2">No report <span>here</span></h1><p class="lv-mut">Open the link the teacher or student sent you, all of it.</p>');
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
