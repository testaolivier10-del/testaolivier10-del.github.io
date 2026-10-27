/* Site redesign round 3, step B3 (docs/site-redesign.md, board R10-Progress): the progress page of the
   built courses (the six AP® courses and A&P), laid out like nremt/dashboard.html. Each course's own
   dashboard script still renders its panels (assets/pages/dashboard.js, assets/apps/mastery.js); this
   only moves them, after every render, into the round 3 order:
     what to do next beside the exam date, the numbers, then kicker sections
     (where you are weak, your exams, your level and practice detail) and the Premium card last.
   Panels are found by the end of their id (-db-weak, -db-u, -db-ch, -db-ex, -db-p, -db-f, -db-s, -db-t);
   anything it does not know stays in the last section, so nothing a course adds can disappear. */
/* Two-column sections fall back to one column whenever only one column has anything to show (a new
   student has no alerts yet, or a course fills only one side), so a lone panel uses the full width instead of
   sitting in half the page (Olivier, 2026-10-26). Runs on every progress page, including NREMT and ochem. */
(function(){
  function fit(){
    document.querySelectorAll('.r3-db-two').forEach(function(g){
      var shown = 0;
      for(var i = 0; i < g.children.length; i++){ var r = g.children[i].getBoundingClientRect(); if(r.height > 2) shown++; }
      g.classList.toggle('one', shown < 2);
    });
  }
  var t; function soon(){ clearTimeout(t); t = setTimeout(fit, 60); }
  function start(){ fit(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true }); window.addEventListener('resize', soon); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

(function(){
  var app = document.querySelector('.r3-dashboard [data-slug="dashboard"]');
  if(!app) return;
  var KICKER = { weak: 'Where you are weak', exams: 'Your exams', more: 'Your level and the detail' };

  function sec(key, left, right){
    left = left.filter(Boolean); right = right.filter(Boolean);
    if(!left.length && !right.length) return null;
    var s = document.createElement('section');
    s.className = 'r3-db-sec';
    s.setAttribute('aria-label', KICKER[key]);
    s.innerHTML = '<p class="kicker">' + KICKER[key] + ' <i></i></p><div class="r3-db-two"><div class="r3-db-side"></div><div class="r3-db-side"></div></div>';
    var cols = s.querySelectorAll('.r3-db-side');
    left.forEach(function(n){ cols[0].appendChild(n); });
    right.forEach(function(n){ cols[1].appendChild(n); });
    if(!right.length) cols[1].remove();
    if(!left.length) cols[0].remove();
    return s;
  }

  function arrange(){
    var db = app.querySelector(':scope > .cx-db');
    if(!db || db.getAttribute('data-r3')) return;
    db.setAttribute('data-r3', '1');
    db.classList.add('r3-db');
    var pick = function(sel){ return db.querySelector(sel); };
    var byId = function(end){ return pick('[id$="-db-' + end + '"]'); };
    var stats = pick('.cx-stats'), next = pick('.cx-next');
    var date = pick('[id$="ExamDate"]'), cram = pick('[class$="-db-cram"]');
    var level = pick('.cx-level');
    var weak = byId('weak'), weakc = byId('weakc'), units = byId('u') || byId('ch'), exams = byId('ex');
    var prac = byId('p'), frq = byId('f'), skills = byId('s'), tools = byId('t');
    var gates = Array.prototype.slice.call(db.querySelectorAll('.premium-card'));
    var known = [stats, next, date, cram, level, weak, weakc, units, exams, prac, frq, skills, tools].concat(gates);
    var rest = Array.prototype.slice.call(db.querySelectorAll('.cx-panel')).filter(function(p){
      return known.indexOf(p) < 0 && !known.some(function(k){ return k && k.contains(p); });
    });

    var lead = document.createElement('div');
    lead.className = 'r3-db-lead';
    var side = document.createElement('div');
    side.className = 'r3-db-side';
    if(date) side.appendChild(date);
    if(cram) side.appendChild(cram);
    if(next) lead.appendChild(next);
    lead.appendChild(side);

    var parts = [lead, stats,
      sec('weak', [weak, weakc, units], [prac, skills]),
      sec('exams', [exams], [frq, tools]),
      sec('more', [level].concat(rest), [])];
    var foot = document.createElement('div');
    foot.className = 'r3-db-premium';
    gates.forEach(function(g){ foot.appendChild(g); });
    if(gates.length) parts.push(foot);

    var grid = db.querySelector('.cx-db-grid');
    parts.forEach(function(p){ if(p) db.appendChild(p); });
    if(grid){
      /* whatever else the course put in its columns goes to the last section, then the empty grid goes */
      var left = Array.prototype.slice.call(grid.querySelectorAll('.cx-db-col > *'));
      if(left.length){ var last = sec('more', left, []); if(last) db.insertBefore(last, foot.parentNode ? foot : null); }
      grid.remove();
    }
  }

  new MutationObserver(arrange).observe(app, { childList: true });
  arrange();
})();
