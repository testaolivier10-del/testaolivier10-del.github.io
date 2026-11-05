/* A student's free responses for their teacher (docs/teacher-classes.md, stream C), on join.html ("Your classes").

   Free-response drafts stay in the student's browser (<course>_frq_drafts_v1, written by each course's
   frq-kit.js); the teacher sees one only when the student presses Send here. Sending again replaces it and
   clears any score, so the teacher scores what is there now. The teacher's points and comment come back
   through class_frq_mine and show under the assignment.

   window.LevlClassFrq.submit(assignmentId, course, frqId) is there for a course's FRQ page to offer the same
   button later (stream A2's files); it resolves true when the answer reached the teacher. */
(function(){
  'use strict';
  function A(){ return window.StudyHubAccount; }
  var M = window.LevlClassModel;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function draft(course, frqId){
    try{ var d = JSON.parse(localStorage.getItem(course + '_frq_drafts_v1') || '{}') || {}; return d[frqId] || {}; }catch(e){ return {}; }
  }
  function hasText(d){ return Object.keys(d).some(function(k){ return String(d[k] || '').trim(); }); }
  function day(t){ return t ? new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''; }

  function submit(assignmentId, course, frqId){
    var d = draft(course, frqId), answers = {};
    Object.keys(d).forEach(function(k){ if(/^[A-Za-z0-9]{1,3}$/.test(k) && typeof d[k] === 'string') answers[k] = d[k].slice(0, 3000); });
    if(!hasText(answers)) return Promise.resolve(false);
    return A().rpcData('class_frq_submit', { p_assignment: assignmentId, p_answers: answers }).then(function(ok){ return ok === true; });
  }

  function render(classes, mine){
    var sec = document.getElementById('jFrqSec'), box = document.getElementById('jFrq');
    if(!sec || !box) return;
    var by = {}; (mine || []).forEach(function(w){ by[w.assignment] = w; });
    var rows = [];
    (classes || []).forEach(function(c){
      var C = M.COURSES[c.course] || {};
      (c.assignments || []).filter(function(a){ return a.kind === 'frq' && a.spec && a.spec.frq; }).forEach(function(a){
        var w = by[a.id], d = draft(c.course, a.spec.frq), ready = hasText(d), sc = w && w.score;
        var state = sc ? '<p class="lv-h3">' + esc(c.teacher || 'Your teacher') + ' scored it: ' + esc(sc.got + ' / ' + sc.of) + '</p>' + (sc.comment ? '<p class="lv-mut" style="font-style:italic">“' + esc(sc.comment) + '”</p>' : '')
          : w ? '<p class="lv-mut">Sent ' + esc(day(Date.parse(w.submitted_at))) + '. Your teacher has not scored it yet.</p>'
          : '<p class="lv-mut">' + (ready ? 'Your answer is saved on this device. Send it when it is ready.' : 'Write your answer on the question page first; it saves on this device.') + '</p>';
        rows.push('<div class="lv-card" data-cover="' + esc(c.course) + '"><p class="lv-kick">' + esc(C.name || c.course) + ' · ' + esc(c.name) + '</p>' +
          '<p class="lv-h3">' + esc(a.title) + '</p>' + state +
          '<div class="lv-btns" style="margin-top:12px"><a class="lv-btn is-sm is-ghost" href="/' + esc(C.dir) + '/frq/' + encodeURIComponent(a.spec.frq) + '.html">Open the question</a>' +
          (ready ? '<button type="button" class="lv-btn is-sm" data-frq-send="' + esc(a.id) + '" data-course="' + esc(c.course) + '" data-frq="' + esc(a.spec.frq) + '">' + (w ? 'Send my new answer' : 'Send my answer to ' + esc(c.teacher || 'my teacher')) + '</button>' : '') +
          '</div><p class="lv-msg" role="status" aria-live="polite"></p></div>');
      });
    });
    sec.hidden = !rows.length;
    box.innerHTML = rows.join('') + (rows.length ? '<p class="lv-mut">Your teacher sees an answer only when you send it. Sending again replaces it.</p>' : '');
  }

  function load(){
    Promise.all([A().rpcData('class_mine', {}), A().rpcData('class_frq_mine', {}).catch(function(){ return []; })])
      .then(function(r){ render(r[0], r[1]); }, function(){});
  }

  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-frq-send]');
    if(!b) return;
    var out = b.closest('.lv-card').querySelector('.lv-msg');
    if(!confirm('Send this answer to your teacher? They will see exactly what you wrote.')) return;
    b.disabled = true;
    submit(b.getAttribute('data-frq-send'), b.getAttribute('data-course'), b.getAttribute('data-frq')).then(function(ok){
      if(ok){ out.textContent = 'Sent.'; load(); } else { out.textContent = 'Not sent. Check the assignment is still open, then try again.'; b.disabled = false; }
    }, function(){ out.textContent = 'Not sent. Try again.'; b.disabled = false; });
  });

  function boot(){
    if(!A() || !A().onAuthChange || !M) return;
    A().onAuthChange(function(u){ if(u) load(); });
  }
  window.LevlClassFrq = { submit: submit, reload: load };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
