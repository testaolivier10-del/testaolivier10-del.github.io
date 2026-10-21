/* "Grade my answer": the AI free-response grader's page half, shared by the
   six AP® courses (docs/frq-grader.md). Each course's pages/frq.js loads it
   on one question's page and calls

     LevlFrqGrader.mount(box, {
       course: 'apbio', f: <the question JSON>,
       answers: function(){ return { a: '...', b: '...' }; },  // the textareas
       reveal: function(){ return <the self-score box, rubric shown>; }
     })

   It never replaces the self-score. The rubric and the checkboxes stay where
   they are; the AI's marks are an estimate the student can copy into them and
   then change. If the grader cannot answer (not set up, credits used up,
   both models down), the box says so and opens the rubric instead.

   OFF until the accuracy eval passes (docs/frq-grader.md, "Launch rule"):
   ENABLED below, and the Worker's FRQ_GRADER variable. Before launch the
   owner can see it on his own browser with
     localStorage.setItem('levlprep_frq_grader_try', '1')
   (or by opening any FRQ page with ?frqtry=1) and the Worker (FRQ_GRADER = "owner") grades for his account only. The
   Worker is the real gate either way: Premium, the daily cap and the
   sign-in are all checked there. */
(function(){
  'use strict';
  var ENABLED = true;
  var ENDPOINT = 'https://api.levlprep.com'; // site-config:API_URL
  var TRY_KEY = 'levlprep_frq_grader_try';

  // ?frqtry=1 (or 0) sets the same flag, so the owner can try it from a
  // phone, where there is no console. Only shows the button; the Worker
  // still grades for his account only while FRQ_GRADER = "owner".
  function enabled(){
    if(ENABLED) return true;
    try{
      var m = /[?&]frqtry=([01])/.exec(location.search);
      if(m){ if(m[1] === '1') localStorage.setItem(TRY_KEY, '1'); else localStorage.removeItem(TRY_KEY); }
      return localStorage.getItem(TRY_KEY) === '1';
    }catch(e){ return false; }
  }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }

  var CSS = '' +
    '.fg-box{margin:18px 0 6px;padding:14px 16px;border:2px solid var(--line);border-radius:var(--radius-lg,16px);background:var(--white);}' +
    '.fg-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;}' +
    '.fg-head .btn-press{min-height:44px;}' +
    '.fg-note{font:600 13px/1.5 var(--font-ui);color:var(--muted);margin:8px 0 0;}' +
    '.fg-status{font:700 14px/1.5 var(--font-ui);margin:10px 0 0;}' +
    '.fg-status:empty{display:none;}' +
    '.fg-total{font:900 18px var(--font-ui);color:var(--ink);margin:14px 0 2px;}' +
    '.fg-who{font:700 12.5px/1.5 var(--font-ui);color:var(--muted);margin:0 0 10px;}' +
    '.fg-who.is-backup{color:var(--amber-text);}' +
    '.fg-part{border:0;padding:0;margin:12px 0 0;min-width:0;}' +
    '.fg-part h4{font:900 14px var(--font-ui);margin:0 0 6px;}' +
    '.fg-pt{list-style:none;margin:0 0 8px;padding:10px 12px;border-radius:12px;background:var(--surface2,var(--paper));border-left:5px solid var(--line);}' +
    '.fg-pt.is-on{border-left-color:var(--good);}' +
    '.fg-pt.is-off{border-left-color:var(--bad);}' +
    '.fg-pts{margin:0;padding:0;}' +
    '.fg-mark{font:900 13px var(--font-ui);}' +
    '.fg-pt.is-on .fg-mark{color:var(--good-text);}' +
    '.fg-pt.is-off .fg-mark{color:var(--bad-text);}' +
    '.fg-rub{display:block;font:600 13px/1.5 var(--font-ui);color:var(--muted);margin:2px 0 4px;}' +
    '.fg-quote{display:block;margin:4px 0;padding:4px 10px;border-left:3px solid var(--cink,var(--accent));font:600 14px/1.5 var(--font-ui);overflow-wrap:anywhere;}' +
    '.fg-why{display:block;font:600 14px/1.5 var(--font-ui);overflow-wrap:anywhere;}' +
    '.fg-sum{font:700 14px/1.5 var(--font-ui);margin:10px 0 0;}' +
    '.fg-actions{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0 0;}' +
    '.fg-actions .btn-press,.fg-actions .btn-outline{min-height:44px;}' +
    '@media (max-width:480px){.fg-box{padding:12px;}.fg-head .btn-press{width:100%;}}' +
    '@media print{.fg-box{display:none;}}';
  function style(){
    if(document.getElementById('fg-style')) return;
    var s = document.createElement('style');
    s.id = 'fg-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function account(){ return window.StudyHubAccount; }
  function signedIn(){ var A = account(); return !!(A && A.user && A.user()); }
  function premium(course){ var P = window.LevlPremium; return !P || !P.has || P.has(course); }

  function post(body){
    var A = account();
    if(!A || !A.accessToken) return Promise.reject({ fallback: true, msg: 'Sign in to use the AI grader.' });
    return A.accessToken().then(function(t){
      if(!t) throw { signin: true };
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = setTimeout(function(){ if(ctrl) ctrl.abort(); }, 100000);
      return fetch(ENDPOINT + '/frq/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
        body: JSON.stringify(body),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function(r){
        clearTimeout(timer);
        return r.json().catch(function(){ return {}; }).then(function(data){
          if(r.ok && data && Array.isArray(data.parts)) return data;
          throw { status: r.status, data: data || {} };
        });
      }, function(){ clearTimeout(timer); throw { status: 0, data: {} }; });
    });
  }

  function resultHtml(f, g){
    var backup = g.grader === 'backup';
    var html = '<p class="fg-total" tabindex="-1">AI estimate: ' + g.got + ' of ' + g.of + ' points</p>' +
      '<p class="fg-who' + (backup ? ' is-backup' : '') + '">' +
      (backup ? 'Graded by the backup grader, which is less accurate than the main one. Check each point against the rubric.'
              : 'Graded by Claude, an AI model, against this question’s rubric.') +
      ' It is an estimate, not an official score.</p>';
    g.parts.forEach(function(p, i){
      var part = f.parts[i] || { rubric: [] };
      html += '<section class="fg-part" aria-label="Part (' + esc(p.label) + ')"><h4>Part (' + esc(p.label) + ')</h4><ul class="fg-pts">' +
        p.points.map(function(pt, k){
          var r = part.rubric[k] || {};
          var rub = String(r.point || '').replace(/<[^>]+>/g, '');
          return '<li class="fg-pt ' + (pt.earned ? 'is-on' : 'is-off') + '">' +
            '<span class="fg-mark">' + (pt.earned ? 'Earned' : 'Not earned') + ': point ' + (k + 1) + '</span>' +
            '<span class="fg-rub">' + esc(rub.length > 220 ? rub.slice(0, 217) + '…' : rub) + '</span>' +
            (pt.earned && pt.quote ? '<q class="fg-quote">' + esc(pt.quote) + '</q>' : '') +
            '<span class="fg-why">' + esc(pt.reason) + '</span></li>';
        }).join('') + '</ul></section>';
    });
    if(g.summary) html += '<p class="fg-sum">' + esc(g.summary) + '</p>';
    html += '<div class="fg-actions"><button type="button" class="btn-press sm" data-fg="apply">Copy these marks to my self-score</button></div>' +
      '<p class="fg-note">Disagree with a mark? Copy the marks, then change that point’s checkbox in the rubric. The score you save is your own.' +
      (typeof g.left === 'number' ? ' AI grades left today: ' + g.left + '.' : '') + '</p>';
    return html;
  }

  function mount(box, o){
    if(!box || !o || !o.f || !enabled()) return false;
    style();
    var course = o.course, f = o.f, busy = false;
    box.className = (box.className ? box.className + ' ' : '') + 'fg-box';
    box.innerHTML = '<div class="fg-head"><button type="button" class="btn-press alt" data-fg="go">Grade my answer</button>' +
      (window.LevlPremium && window.LevlPremium.badge ? window.LevlPremium.badge(course) : '') + '</div>' +
      '<p class="fg-note">An AI estimate, point by point against the rubric, quoting your own words for each point it gives. Up to 10 a day with Premium. The rubric and your self-score stay right below.</p>' +
      '<p class="fg-status" role="status" aria-live="polite"></p><div class="fg-result"></div>';
    var btn = box.querySelector('[data-fg="go"]');
    var status = box.querySelector('.fg-status');
    var out = box.querySelector('.fg-result');
    var last = null;

    function selfScore(msg){
      status.textContent = msg;
      if(o.reveal) o.reveal();
    }

    btn.addEventListener('click', function(){
      if(busy) return;
      var A = account();
      if(!signedIn()){
        status.textContent = 'Sign in to use the AI grader. Your answer stays saved on this device.';
        if(A && A.openAuthModal) A.openAuthModal('signin');
        return;
      }
      if(!premium(course)){
        status.textContent = 'The AI grader is part of Premium. You can still score yourself with the rubric.';
        if(window.LevlPremium && window.LevlPremium.open) window.LevlPremium.open(course, 'frq-grader', btn);
        return;
      }
      var answers = o.answers(), any = false, tooLong = false;
      f.parts.forEach(function(p){ var t = String(answers[p.label] || '').trim(); if(t) any = true; if(t.length > 3000) tooLong = true; });
      if(!any){ status.textContent = 'Write your answer above first.'; return; }
      if(tooLong){ status.textContent = 'Each part can be at most 3,000 characters for the AI grader.'; return; }
      busy = true;
      btn.disabled = true;
      btn.textContent = 'Grading…';
      status.textContent = 'Grading your answer against the rubric. This takes up to a minute.';
      out.innerHTML = '';
      post({ course: course, id: f.id, answers: answers }).then(function(g){
        last = g;
        status.textContent = '';
        out.innerHTML = resultHtml(f, g);
        var t = out.querySelector('.fg-total'); if(t) t.focus();
        out.querySelector('[data-fg="apply"]').addEventListener('click', function(){
          var sb = o.reveal ? o.reveal() : null;
          if(!sb || !last) return;
          last.parts.forEach(function(p, i){
            p.points.forEach(function(pt, k){
              var c = sb.querySelector('input[data-part="' + i + '"][data-k="' + k + '"]');
              if(c && !c.disabled) c.checked = !!pt.earned;
            });
          });
          sb.dispatchEvent(new Event('change', { bubbles: true }));
          this.textContent = 'Copied. Change any point you disagree with, then save.';
          this.disabled = true;
        });
        if(window.LevlAnalytics && window.LevlAnalytics.event) try{ window.LevlAnalytics.event('frq-ai-grade', { course: course, grader: g.grader, cached: g.cached ? 'yes' : 'no' }); }catch(e){}
      }, function(err){
        err = err || {};
        var d = err.data || {};
        if(err.signin || err.status === 401){ status.textContent = 'Your session has ended. Sign in again to use the AI grader.'; if(A && A.openAuthModal) A.openAuthModal('signin'); return; }
        if(err.status === 403 && d.premium){ status.textContent = 'The AI grader is part of Premium. You can still score yourself with the rubric.'; if(window.LevlPremium && window.LevlPremium.open) window.LevlPremium.open(course, 'frq-grader', btn); return; }
        if(err.status === 429 && d.capped){ selfScore(String(d.error || 'You have used today’s AI grades.') + ' Score yourself with the rubric below.'); return; }
        if(err.status === 429){ status.textContent = 'Too many requests at once. Wait a minute and try again.'; return; }
        if(err.status === 400 && d.error){ status.textContent = String(d.error).slice(0, 200); return; }
        if(err.status === 0){ selfScore('The AI grader didn’t answer in time (or you are offline), so here is the rubric to score yourself. This try may have used one of today’s grades.'); return; }
        selfScore('The AI grader isn’t available right now, so here is the rubric to score yourself. Your daily grades were not used.');
      }).then(function(){
        busy = false;
        btn.disabled = false;
        btn.textContent = last ? 'Grade my answer again' : 'Grade my answer';
      });
    });
    return true;
  }

  window.LevlFrqGrader = { mount: mount, enabled: enabled };
})();
