/* AP® Statistics free-response practice (docs/apbio-spec.md section 1, "FRQ
   practice, all 6 types"). Two jobs, by where it runs:

   frq.html             the list, filtered by type and unit, each with your
                        best self-score; every question links to its page.
   frq/<id>.html        one question (the page, its prompt and data are
                        static HTML from scripts/build-apstat.mjs, printable
                        with lined space). This script adds the workspace:
                        write (a textarea per part, saved on this device
                        only), reveal the rubric, check each point you
                        earned, read the full-credit sample, save the score.
                        A checkbox prints the rubric on a separate page.

   Premium: an FRQ in a locked unit (ApStatCore.locked) keeps its prompt and
   printable sheet; the workspace shows the Premium card instead. No AI
   grading anywhere. Shared code: pages/frq-kit.js (window.ApStatFrq). */
(function(){
  var BASE = window.ApStatBase || '';
  var app = document.getElementById('app');
  if(!app) return;
  var Core = window.ApStatCore;
  var CUR = window.ApStatCurriculum || { units: [], topics: [] };
  var UNIT = {}; CUR.units.forEach(function(u){ UNIT[u.id] = u; });
  var TOPIC = {}; CUR.topics.forEach(function(t){ TOPIC[t.id] = t; });
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function unitName(u){ var c = UNIT[u]; return c ? (c.part === 'course' ? 'Unit ' + c.n : c.title) : u; }

  function kit(){
    if(window.ApStatFrq) return Promise.resolve(window.ApStatFrq);
    return new Promise(function(res, rej){
      var s = document.createElement('script');
      s.src = BASE + 'assets/pages/frq-kit.js';
      s.onload = function(){ window.ApStatFrq ? res(window.ApStatFrq) : rej(); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* -------------------------------------------------------------- list */
  var filter = { type: '', unit: '' };
  function list(K){
    var esc = K.esc;
    app.innerHTML = '<p class="stat-small">Loading the questions…</p>';
    K.index(BASE).then(function(all){
      if(!all.length){ app.innerHTML = '<p>No free-response questions are published yet. Meanwhile, read the <a href="' + BASE + 'learn.html">free notes</a>.</p>'; return; }
      var p = new URLSearchParams(location.search);
      if(K.TYPES[p.get('type')]) filter.type = p.get('type');
      if(UNIT[p.get('unit')]) filter.unit = p.get('unit');
      var units = []; all.forEach(function(f){ f.units.forEach(function(u){ if(units.indexOf(u) < 0) units.push(u); }); });
      units.sort(function(a, b){ return CUR.units.findIndex(function(x){ return x.id === a; }) - CUR.units.findIndex(function(x){ return x.id === b; }); });
      var have = {}; all.forEach(function(f){ have[f.type] = (have[f.type] || 0) + 1; });
      function opt(v, label, cur){ return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>'; }
      app.innerHTML = '<form class="stat-fq-filters" aria-label="Filter free-response questions">' +
        '<label class="stat-pr-field"><span>Question type</span><select id="stat-fq-type">' + opt('', 'All types', filter.type) + K.ORDER.map(function(t){ return opt(t, K.TYPES[t] + ' (' + (have[t] || 0) + ')', filter.type); }).join('') + '</select></label>' +
        '<label class="stat-pr-field"><span>Unit</span><select id="stat-fq-unit">' + opt('', 'Every unit', filter.unit) + units.map(function(u){ return opt(u, unitName(u) + (UNIT[u] ? ': ' + UNIT[u].title : ''), filter.unit); }).join('') + '</select></label>' +
        '</form><p class="stat-small" id="stat-fq-count" role="status" aria-live="polite"></p><ul class="stat-fq-list"></ul>' +
        '<p class="stat-small stat-fq-how">How it works: read the prompt and the data, write your answer (it stays on this device), then reveal the rubric and check each point you earned. Every question has a printable answer sheet with lined space.</p>';
      function paint(){
        var sc = K.scores();
        var shown = all.filter(function(f){ return (!filter.type || f.type === filter.type) && (!filter.unit || f.units.indexOf(filter.unit) > -1); });
        app.querySelector('#stat-fq-count').textContent = plural(shown.length, 'question') + (filter.type || filter.unit ? ' match.' : '.');
        var missing = K.ORDER.filter(function(t){ return !have[t]; });
        app.querySelector('.stat-fq-list').innerHTML = shown.map(function(f){
          var s = sc[f.id];
          return '<li><a class="stat-fq-card" href="' + BASE + 'frq/' + f.id + '.html"><span class="stat-fq-card-k">' + esc(K.TYPES[f.type]) + ' &middot; ' + plural(f.points, 'point') + '</span>' +
            '<b>' + esc(f.title) + '</b><span class="stat-small">' + esc(f.units.map(unitName).join(', ')) + (f.placeholder ? ' &middot; placeholder, not checked for accuracy' : '') +
            (s ? ' &middot; your best: ' + s.best + ' of ' + s.of : '') + '</span></a></li>';
        }).join('') + (missing.length && !filter.type ? '<li class="stat-small stat-fq-missing">Not written yet: ' + missing.map(function(t){ return esc(K.TYPES[t]); }).join('; ') + '.</li>' : '');
        try{ var q = new URLSearchParams(); if(filter.type) q.set('type', filter.type); if(filter.unit) q.set('unit', filter.unit); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '')); }catch(e){}
      }
      app.querySelector('form').addEventListener('change', function(e){ if(e.target.id === 'stat-fq-type') filter.type = e.target.value; else filter.unit = e.target.value; paint(); });
      paint();
    }).catch(function(){ app.innerHTML = '<p>The questions did not load. Check your connection and reload.</p>'; });
  }

  /* --------------------------------------------------------- one FRQ */
  function one(K, id){
    var unit = app.getAttribute('data-unit'), topic = app.getAttribute('data-topic');
    var locked = Core && Core.locked && Core.locked(unit, topic);
    if(locked){ app.innerHTML = Core.gate('exams', 'frq', topic) || ''; return; }
    app.innerHTML = '<p class="stat-small">Loading…</p>';
    K.load(BASE, id).then(function(f){
      var saved = K.scores()[id];
      app.innerHTML = '<section class="stat-fq-work" aria-labelledby="stat-fq-w-h">' +
        '<h2 id="stat-fq-w-h">Write your answer</h2>' +
        '<p class="stat-small">Your answers save on this device as you type. They are never sent anywhere.</p>' +
        '<div class="stat-fq-write">' + f.parts.map(function(p, i){
          var tid = 'fqw-' + p.label;
          return '<div class="stat-fq-part"><label class="stat-fq-alabel" for="' + tid + '">Part (' + K.esc(p.label) + '), ' + plural(p.points, 'point') + '</label>' +
            '<textarea id="' + tid + '" class="stat-fq-answer" rows="' + Math.min(10, 3 + p.points * 2) + '" data-part="' + K.esc(p.label) + '">' + K.esc(K.draft(id)[p.label] || '') + '</textarea></div>';
        }).join('') + '</div>' +
        '<div class="stat-pr-actions"><button type="button" class="btn-press" data-act="reveal">Show the rubric and score yourself</button></div>' +
        '<div class="stat-fq-scorebox" hidden></div>' +
        '<label class="stat-ex-check stat-fq-printopt"><input type="checkbox" id="stat-fq-printrub"> <span>When I print, add the rubric and sample answers on a separate page</span></label>' +
        (saved ? '<p class="stat-small">Last saved self-score: ' + saved.got + ' of ' + saved.of + ' (best ' + saved.best + ').</p>' : '') +
      '</section>';
      app.querySelectorAll('.stat-fq-answer').forEach(function(t){
        var timer = 0;
        t.addEventListener('input', function(){ clearTimeout(timer); timer = setTimeout(function(){ K.saveDraft(id, t.getAttribute('data-part'), t.value); }, 300); });
      });
      var box = app.querySelector('.stat-fq-scorebox');
      app.querySelector('[data-act="reveal"]').addEventListener('click', function(){
        this.hidden = true;
        box.hidden = false;
        box.innerHTML = '<h2 id="stat-fq-r-h" tabindex="-1">Score yourself, point by point</h2>' +
          '<p class="stat-small">Check a point only if your answer says it, in your own words. The sample under each part is one full-credit answer, not the only one.</p>' +
          K.rubricHtml(f) +
          '<p class="stat-fq-total" role="status" aria-live="polite"></p>' +
          '<div class="stat-pr-actions"><button type="button" class="btn-press" data-act="save">Save my score</button><a class="btn-outline" href="' + BASE + 'frq.html">More free-response questions</a></div>';
        function total(){ var s = K.score(box); box.querySelector('.stat-fq-total').textContent = 'Your score: ' + s.got + ' of ' + s.of + ' points.'; return s; }
        box.addEventListener('change', total);
        total();
        box.querySelector('[data-act="save"]').addEventListener('click', function(){
          var s = total();
          K.saveScore(id, { got: s.got, of: s.of, parts: s.parts, title: f.title, type: f.type, units: f.units });
          if(Core) Core.event('apstat-frq-score', { frq: id, got: s.got, of: s.of });
          this.textContent = 'Saved';
          this.disabled = true;
        });
        box.querySelector('#stat-fq-r-h').focus();
      });
      // Print the rubric on its own page only when asked.
      window.addEventListener('beforeprint', function(){
        var old = document.querySelector('.stat-frq-rubric-print'); if(old) old.remove();
        if(!(document.getElementById('stat-fq-printrub') || {}).checked) return;
        var sec = document.createElement('section');
        sec.className = 'stat-frq-rubric-print';
        sec.innerHTML = '<h2>Rubric and sample answers: ' + K.esc(f.title) + '</h2>' + K.rubricHtml(f, { readonly: true }).replace(/<input [^>]*>/g, '<span class="stat-bk-box" aria-hidden="true"></span>');
        document.querySelector('.stat-frq').appendChild(sec);
      });
      window.addEventListener('afterprint', function(){ var old = document.querySelector('.stat-frq-rubric-print'); if(old) old.remove(); });
    }).catch(function(){ app.innerHTML = '<p>The rubric did not load. Check your connection and reload; the question above still prints.</p>'; });
  }

  kit().then(function(K){
    var id = app.getAttribute('data-frq');
    if(id) one(K, id); else list(K);
  }, function(){ app.innerHTML = '<p>This page did not load fully. Reload to try again.</p>'; });
})();
