/* The contents rail on unit, notes and learn pages (forked from anp-toc.js; the ochem textbook frame,
   theme.css tb-*): the phone "Contents" drawer, lessons-done progress, ticks
   on finished topics and mastery chips. Every number comes from ApHugCore. */
(function(){
  function tier(m){
    if(!m.answered) return ['', 'Not practiced'];
    var p = Math.round(m.value * 100);
    if(m.value >= 0.85) return ['mastered', 'Mastered'];
    return [m.value >= 0.3 ? 'learning' : 'started', (m.value >= 0.6 ? 'Strong' : m.value >= 0.3 ? 'Developing' : 'Learning') + ' · ' + p + '%'];
  }
  /* What the guided path marked done (assets/course/path.js, <course>_path_v1) ticks here too, so a topic
     shows done the same in every view (consistency audit 2026-11, A5). */
  function withPath(done){
    var out = {}, k;
    for(k in done) out[k] = done[k];
    try{ var s = JSON.parse(localStorage.getItem('aphug' + '_path_v1') || 'null'); if(s) [s.covered || {}, s.done || {}].forEach(function(m){ for(k in m) if(m[k] && !out[k]) out[k] = 1; }); }catch(e){}
    return out;
  }
  function paint(){
    var C = window.ApHugCore, CU = window.ApHugCurriculum;
    if(!C || !CU) return;
    var done = withPath(C.lessonsDone() || {});
    var built = CU.topics.filter(function(t){ return t.built; });
    document.querySelectorAll('[data-toc-t]').forEach(function(el){
      el.classList.toggle('read', !!done[el.getAttribute('data-toc-t')]);
    });
    function count(ch){ return built.filter(function(t){ return (!ch || t.unit === ch) && done[t.id]; }).length; }
    function total(ch){ return built.filter(function(t){ return !ch || t.unit === ch; }).length; }
    document.querySelectorAll('[data-toc-ch]').forEach(function(el){
      var ch = el.getAttribute('data-toc-ch'), n = count(ch), t = total(ch);
      el.textContent = n + '/' + t;
      el.classList.toggle('complete', t > 0 && n === t);
    });
    document.querySelectorAll('[data-toc-prog]').forEach(function(el){
      var ch = el.getAttribute('data-toc-prog'), n = count(ch), t = total(ch) || 1, p = Math.round(n / t * 100) + '%';
      // Each part checked: a cached page from an older layout can pair other
      // markup with this script (client_errors, bio-toc.js:29).
      var b = el.querySelector('b'), pct = el.querySelector('.bk-toc-pct'), fill = el.querySelector('.tb-progress-fill');
      if(b) b.textContent = n;
      if(pct) pct.textContent = p;
      if(fill) fill.style.width = p;
    });
    document.querySelectorAll('[data-chip-topic]').forEach(function(el){
      var k = tier(C.topicMastery(el.getAttribute('data-chip-topic')));
      el.className = 'bk-chip' + (k[0] ? ' ' + k[0] : '');
      el.textContent = k[1];
    });
    document.querySelectorAll('[data-unit-meta]').forEach(function(el){
      var u = el.getAttribute('data-unit-meta');
      var ms = built.filter(function(t){ return t.unit === u; }).map(function(t){ return C.topicMastery(t.id); });
      var answered = ms.some(function(m){ return m.answered; });
      var mastered = ms.filter(function(m){ return m.answered && m.value >= 0.85; }).length;
      el.textContent = answered ? mastered + ' mastered · ' + C.pct(C.unitMastery(u).value) + ' mastery' : 'not practiced yet';
    });
  }
  function start(){
    var btn = document.querySelector('.tb-toc-btn');
    if(btn) btn.addEventListener('click', function(){
      var open = document.body.classList.toggle('tb-toc-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    var c = document.querySelector('.tb-contents'), cur = c && c.querySelector('.open, .current');
    if(cur && c.scrollHeight > c.clientHeight) c.scrollTop = Math.max(0, cur.offsetTop - c.offsetTop - 120);
    paint();
    window.ApHugToc = { paint: paint };
    document.addEventListener('aphug:progress', paint);
    document.addEventListener('levl:pathchange', paint);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
