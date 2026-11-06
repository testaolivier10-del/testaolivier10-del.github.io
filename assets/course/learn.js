/* The Learn tab's textbook (course redesign r4, decision 4; docs/course-redesign-r4.md). Loaded, plain and before
   the reader's own scripts, by every course textbook (learn.html; NREMT study-notes.html), from
   scripts/lib/learn-band.mjs learnScript():
     <script src="/assets/course/learn.js" data-course="<path key>" data-last="<reader's own last-chapter key>"
             [data-classroom="1"]>

   1. Opens the book at the student's current topic. With no topic in the address: the last topic read here
      (levl_learn_last_<course>, kept by this file), else the reader's own last chapter (it opens that itself),
      else the path's current stop (assets/path/<course>.json and <course>_path_v1, read only; the same rule as
      assets/course/path.js), else the reader's first topic. Not while Interactive is the remembered choice
      (levl_book_mode_<folder>, assets/course/read-toggle.js): that choice opens the last lesson, as before.
   2. Remembers the topic being read: the section of the book whose top has passed the upper third of the screen.
   3. "Practice this lesson" at the head of each topic (AP® and A&P; ochem and NREMT carry their own practice
      links), to the course's practice page for that topic, as the path's practice stops do.
   4. Share to Google Classroom (AP® courses), Copy link and Print in one "⋯" menu beside the Read | Interactive
      switch, for the topic in view (assets/course/more-menu.js runs the menu). NREMT's chapter header has its own
      Copy link and Print, which more-menu.js folds into a menu; it gets no second one. */
(function(){
  var me = document.currentScript;
  if(!me) return;
  var KEY = me.getAttribute('data-course'), OWN = me.getAttribute('data-last') || '', CLASSROOM = me.getAttribute('data-classroom') === '1';
  if(!KEY) return;
  var LAST = 'levl_learn_last_' + KEY;
  var DIR = location.pathname.split('/')[1] || KEY;
  function get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
  function parse(k){ try{ return JSON.parse(get(k) || 'null'); }catch(e){ return null; } }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function interactiveChosen(){ var m = parse('levl_book_mode_' + DIR); return !!(m && m.mode === 'lesson'); }

  /* ---- 1. where to open ---- */
  var touched = false;
  ['wheel', 'touchmove', 'keydown', 'mousedown'].forEach(function(ev){ window.addEventListener(ev, function(){ touched = true; }, { passive: true, once: true }); });
  window.addEventListener('hashchange', function(){ touched = true; }, { once: true });
  function go(id){
    if(!id || location.hash) return;
    history.replaceState(null, '', '#' + id);
  }
  var PATH = null;
  function pathData(){
    if(!PATH) PATH = fetch('/assets/path/' + KEY + '.json', { credentials: 'same-origin' }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
    return PATH;
  }
  if(!location.hash && !interactiveChosen()){
    var last = get(LAST);
    if(last && /^[\w-]+$/.test(last)) go(last);
    else if(!(OWN && get(OWN))){
      var S = parse(KEY + '_path_v1');
      if(S && S.v === 1 && S.mode){
        pathData().then(function(d){
          if(!d || touched || location.hash) return;
          var id = currentStop(d, S);
          if(!id) return;
          var hash = d.kind === 'nremt' ? 'chapter-' + id.replace(/^ch/, '') : id;
          history.replaceState(null, '', '#' + hash);
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        });
      }
    }
  }

  /* The path's current topic, by path.js's rule, read only: done is the course's own record or the student's mark. */
  function currentStop(d, S){
    var T = d.topics, BY = {};
    T.forEach(function(t, i){ t.i = i; BY[t.id] = t; });
    var prog = parse(d.progress) || {}, oc = d.kind === 'ochem' ? (parse('ochem_textbook_read') || {}) : {};
    function courseDone(id){
      if(d.kind === 'ap' || d.kind === 'anp') return !!(prog.lessons && prog.lessons[id]);
      if(d.kind === 'ochem') return !!((prog[id] && prog[id].completed) || oc[id]);
      var t = BY[id]; return !!(t && (t.lessons || []).some(function(l){ return prog[l]; }));
    }
    function isF(id){ return !!((S.done || {})[id] || (S.covered || {})[id] || courseDone(id)); }
    var todo = function(t){ return t && !isF(t.id); };
    if(S.mode === 'class' && BY[S.anchor]){
      var a = BY[S.anchor];
      var pre = (a.p || []).map(function(p){ return BY[p[0]]; }).filter(todo).sort(function(x, y){ return x.i - y.i; })[0];
      if(pre) return pre.id;
      if(todo(a)) return a.id;
      var after = T.filter(function(t){ return t.i > a.i && todo(t); })[0];
      return after ? after.id : null;
    }
    if(S.mode === 'cram'){
      var list = S.cram && S.cram.kind === 'test' ? (S.cram.topics || []).map(function(id){ return BY[id]; }) : T;
      var c = list.filter(todo).sort(function(x, y){ return x.i - y.i; })[0];
      return c ? c.id : null;
    }
    var first = T.filter(todo)[0];
    return first ? first.id : null;
  }

  /* ---- 2 to 4, once the page is there ---- */
  function main(){ return document.querySelector('main.tb-main') || document.getElementById('main'); }
  function sections(){
    var m = main();
    return m ? [].filter.call(m.querySelectorAll('section.bk-sec[id]'), function(s){ return !s.hidden && s.offsetParent !== null; }) : [];
  }
  function inView(){
    var list = sections(), line = window.innerHeight / 3, at = null;
    for(var i = 0; i < list.length; i++){ if(list[i].getBoundingClientRect().top <= line) at = list[i]; else break; }
    return at || list[0] || null;
  }
  var saveQ = false;
  function remember(){
    if(saveQ) return; saveQ = true;
    setTimeout(function(){ saveQ = false; var s = inView(); if(s && s.id) set(LAST, s.id); }, 400);
  }
  function titleOf(s){
    var h = s && s.querySelector('h2');
    return h ? h.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  /* Practice this lesson, in each topic's head beside its practice chip. */
  var practiceBase = null;
  function practiceLinks(){
    if(!practiceBase) return;
    sections().concat([].slice.call((main() || document).querySelectorAll('section.bk-sec[id][hidden]'))).forEach(function(s){
      var acts = s.querySelector(':scope > .bk-sec-head > .bk-sec-acts');
      if(!acts || acts.querySelector('.lr-practice')) return;
      var a = document.createElement('a');
      a.className = 'lr-practice';
      a.href = practiceBase + '?topic=' + encodeURIComponent(s.id);
      a.textContent = 'Practice this lesson';
      a.setAttribute('aria-label', 'Practice this lesson: ' + titleOf(s));
      acts.appendChild(a);
    });
  }

  /* The ⋯ menu beside the Read | Interactive switch. */
  function topicUrl(){
    var s = inView(), canon = document.querySelector('link[rel="canonical"]');
    var base = (canon && canon.href) || location.href.split('#')[0];
    return base + (s && s.id ? '#' + s.id : '');
  }
  function menu(){
    if(KEY === 'nremt') return;
    var bar = document.querySelector('.rt-bar.rt-book .rt-pill, .rt-bar .rt-pill');
    if(!bar || bar.parentNode.querySelector('.lmore')) return;
    var label = CLASSROOM ? 'Share, copy link or print' : 'Copy link or print';
    var box = document.createElement('div');
    box.className = 'lmore lmore-end';
    box.innerHTML = '<button type="button" class="lmore-btn" aria-haspopup="menu" aria-expanded="false" aria-label="' + label + '"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></button>' +
      '<div class="lmore-menu" role="menu" aria-label="' + label + '" hidden>' +
      (CLASSROOM ? '<a role="menuitem" class="lmore-item" data-lm-classroom href="https://classroom.google.com/" target="_blank" rel="noopener">Share to Google Classroom<span class="sr-only"> (opens in a new tab)</span></a>' : '') +
      '<button type="button" role="menuitem" class="lmore-item" data-lm-copy="">Copy link</button>' +
      '<button type="button" role="menuitem" class="lmore-item" data-lm-print>Print</button></div>';
    bar.parentNode.appendChild(box);
    // Each opening points the items at the topic in view.
    box.querySelector('.lmore-btn').addEventListener('click', function(){
      var url = topicUrl(), s = inView(), title = (titleOf(s) || document.title).replace(/^[\d.]+\s*/, '').replace(/®/g, '');
      box.querySelector('[data-lm-copy]').setAttribute('data-lm-copy', url);
      var gc = box.querySelector('[data-lm-classroom]');
      if(gc) gc.href = 'https://classroom.google.com/share?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title);
    }, true);
  }

  function start(){
    var m = main();
    if(!m) return;
    if(KEY !== 'ochem' && KEY !== 'nremt'){
      pathData().then(function(d){ if(d && d.practice){ practiceBase = d.practice; practiceLinks(); } });
    }
    var q = false;
    new MutationObserver(function(ms){
      if(ms.every(function(x){ return x.target.closest && x.target.closest('.lmore, .lr-practice, .rt-end'); })) return;
      if(q) return; q = true;
      setTimeout(function(){ q = false; practiceLinks(); menu(); }, 60);
    }).observe(m, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    window.addEventListener('scroll', remember, { passive: true });
    window.addEventListener('hashchange', function(){ var id = decodeURIComponent(location.hash.slice(1)); if(/^[\w-]+$/.test(id) && document.getElementById(id) && document.getElementById(id).matches('section.bk-sec')) set(LAST, id); });
    setTimeout(menu, 0);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
