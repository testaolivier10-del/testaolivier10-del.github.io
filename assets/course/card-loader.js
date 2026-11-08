/* The shared score card (docs/score-card.md) on pages that do not ship study.js and study.css: a saved FRQ
   self-score, a saved justify check and the end of an NREMT scenario. Both files load the first time a page asks,
   so the pages stay as light as they were until a result is drawn.
     LevlCard.ready(fn)               fn(LevlStudy) once both have loaded (at once when they already have)
     LevlCard.show(host, o, handlers, drawn) draws LevlStudy.end(o) in host and wires its buttons (LevlStudy.wire), then calls drawn(host)
   If either file fails to load, nothing is drawn and the page keeps what it showed before. */
(function(){
  if(window.LevlCard) return;
  var me = (document.currentScript && document.currentScript.src) || '';
  var root = me.replace(/assets\/course\/card-loader\.js(?:[?#].*)?$/, '');
  var waits = [], started = false, left = 0;
  function have(){ return !!(window.LevlStudy && window.LevlStudy.end); }
  function flush(){
    if(left > 0 || !have()) return;
    var w = waits; waits = [];
    w.forEach(function(fn){ try{ fn(window.LevlStudy); }catch(e){ try{ console.error(e); }catch(x){} } });
  }
  function one(){ left--; flush(); }
  function start(){
    if(started) return;
    started = true;
    if(!document.querySelector('link[href*="assets/course/study.css"]')){
      left++;
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = root + 'assets/course/study.css';
      l.onload = one; l.onerror = one;
      document.head.appendChild(l);
    }
    if(!have()){
      left++;
      var s = document.createElement('script');
      s.src = root + 'assets/course/study.js';
      s.onload = one; s.onerror = function(){ left--; waits = []; };
      document.head.appendChild(s);
    }
    flush();
  }
  function ready(fn){ if(fn) waits.push(fn); start(); flush(); }
  function show(host, o, handlers, drawn){
    ready(function(S){
      if(!host || !host.isConnected) return;
      host.innerHTML = S.end(o);
      S.wire(host, handlers || {});
      if(drawn) drawn(host);
      host.style.scrollMarginTop = '124px';
      try{ host.scrollIntoView({ block: 'start', behavior: 'smooth' }); }catch(e){}
    });
  }
  function plain(h){ var d = document.createElement('div'); d.innerHTML = String(h == null ? '' : h); return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
  function pts(n){ return n + ' point' + (n === 1 ? '' : 's'); }

  /* One free-response question, scored by the student against its rubric. Each part with a point left unticked
     is one miss: the part's prompt, the points it still needs and the part's full-credit sample. The chip names
     the part that lost the most points, when one part lost more than any other. o: { host, f, box (the rubric's container), course, href (notes), step,
     also }. */
  function frq(o){
    var f = o.f, lost = [], got = 0, of = 0;
    [].forEach.call(o.box.querySelectorAll('[data-frq] input[type="checkbox"][data-part][data-k]'), function(c){
      var i = +c.getAttribute('data-part'), k = +c.getAttribute('data-k');
      of++;
      if(c.checked){ got++; return; }
      (lost[i] = lost[i] || []).push(k);
    });
    var missed = [], worst = -1, tie = false;
    f.parts.forEach(function(p, i){
      var ks = lost[i];
      if(!ks) return;
      if(worst < 0 || ks.length > lost[worst].length){ worst = i; tie = false; } else if(ks.length === lost[worst].length) tie = true;
      missed.push({ stem: 'Part (' + p.label + '). ' + plain(p.prompt), you: '',
        ans: ks.map(function(k){ return plain(p.rubric[k] && p.rubric[k].point); }).join(' '),
        why: p.sample ? '<b>A full-credit answer:</b> ' + p.sample : '', youWhy: '', href: o.href || '' });
    });
    var pct = of ? got / of : 0;
    show(o.host, {
      course: o.course, kind: 'Free response', right: got, total: of, unit: 'points',
      hand: pct === 1 ? 'Full credit!' : pct >= 0.7 ? 'Close to full credit.' : pct >= 0.4 ? 'Points left to pick up.' : 'The rubric shows what earns each point.',
      chips: missed.length && !tie && f.parts.length > 1 ? ['Most lost: part (' + plain(f.parts[worst].label) + '), ' + pts(lost[worst].length)] : [],
      missed: missed, missedTitle: missed.length ? (missed.length === 1 ? '1 part short of full credit' : missed.length + ' parts short of full credit') : '',
      step: o.step, also: o.also
    });
  }

  /* One justify prompt, checked by the student: right/total is the checklist points the answer makes; each point
     it does not make is a miss, with the model answer that earns it. o: { host, p, box, course, step, retry,
     also, onRetry }. */
  function justify(o){
    var p = o.p, got = 0, missed = [];
    [].forEach.call(o.box.querySelectorAll('input[type="checkbox"][data-k]'), function(c){
      if(c.checked){ got++; return; }
      missed.push({ stem: p.checklist[+c.getAttribute('data-k')], you: '', ans: '',
        why: p.earns ? '<b>An answer that earns the point:</b> ' + p.earns.answer : '', youWhy: '', href: o.href || '' });
    });
    var of = p.checklist.length;
    show(o.host, {
      course: o.course, kind: 'Justify', right: got, total: of, unit: 'sound reasons',
      hand: got === of ? 'Every point made!' : got ? 'Add what is missing and check again.' : 'The model answers show the way.',
      missed: missed, missedTitle: missed.length ? (missed.length === 1 ? '1 point your answer did not make' : missed.length + ' points your answer did not make') : '',
      step: o.step, retry: o.onRetry ? { act: 'retry', label: 'Rewrite my answer' } : null, also: o.also
    }, { retry: o.onRetry });
  }
  window.LevlCard = { ready: ready, show: show, frq: frq, justify: justify };
})();
