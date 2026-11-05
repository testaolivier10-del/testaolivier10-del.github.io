/* Read | Interactive: one switch at the top of a course textbook, of every notes page and of every interactive
   lesson, in place of the "Lesson" button each textbook section used to carry (Olivier, 2026-10-26: "it should be
   like a thing where you can toggle between the textbook non interactive and the entire textbook as interactive").

   Loaded with data attributes on its own script tag:
     data-rt="book"    on the course textbook (learn.html). Each section of the book is a
                       section.bk-sec[id] with data-lesson="lessons/<id>.html" (or data-lesson="" when the topic
                       has no interactive lesson yet; the section then says so in place, and the switch shows
                       Interactive as unavailable for it). data-lesson-premium="1" marks a lesson this reader
                       cannot open (the book scripts set it from the course's own lock rule).
     data-rt="notes"   on a notes page (<course>/notes/<id>.html, one topic): Read is this page, Interactive its
                       lesson (the page's own link to ../lessons/<id>.html, when it has one).
     data-rt="lesson"  on a lesson page; data-rt-book is the textbook's address from that page
                       (e.g. "../learn.html"). The topic is body[data-topic], else the page's file name.
     data-rt-course    the course folder, for the remembered choice (levl_book_mode_<folder>).
     data-rt-root      on a textbook page that is not at the course root (NREMT's nremt/notes/*.html: "../"),
                       the way back to it, so the remembered lesson (lessons/<id>.html) still resolves.
   All are optional (see the defaults below), so the builders load it as a plain script.

   Switching keeps the topic: Interactive opens the lesson of the section being read, Read opens the textbook at
   the lesson's topic. The choice is remembered per course (localStorage, best effort), so opening the textbook
   again goes straight to the last lesson while Interactive is the choice. Never into a locked lesson: a lesson
   that shows its Premium lock is not remembered, and the book never sends a reader to a data-lesson-premium
   lesson on its own (consistency audit 2026-11, A2 and A3). Going Back never redirects, so the back button is
   not trapped.

   The book also gets, at the end of each topic, "← Previous topic" and "Next topic →" (the .rt-end strip; the
   path's end card, assets/course/path.js, goes in the same strip), and the switch names the section in view. */
(function(){
  var me = document.currentScript;
  if(!me) return;
  // Without attributes: a notes page is notes, a page with the book's main column is the book, anything else a
  // lesson; the course is the first folder of the address (/bio/, /ochem/, ...), and a lesson's book ../learn.html.
  var mode = me.getAttribute('data-rt') || (/\/notes\/[\w-]+\.html$/.test(location.pathname) && !document.querySelector('section.bk-sec[data-lesson]') ? 'notes' : document.querySelector('main.tb-main') ? 'book' : 'lesson');
  var course = me.getAttribute('data-rt-course') || location.pathname.split('/')[1] || 'course';
  var KEY = 'levl_book_mode_' + course;

  function load(){ try{ return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; }catch(e){ return {}; } }
  function save(v){ try{ localStorage.setItem(KEY, JSON.stringify(v)); }catch(e){} }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function backForward(){
    try{
      var n = performance.getEntriesByType('navigation')[0];
      if(n) return n.type === 'back_forward';
      return performance.navigation && performance.navigation.type === 2;
    }catch(e){ return false; }
  }
  // The reader holds this course's pass: premium.js when the page has it, else its saved copy.
  function hasPass(){
    var k = document.body && document.body.getAttribute('data-course');
    try{ if(window.LevlPremium && k) return !!window.LevlPremium.has(k); }catch(e){}
    try{ var a = JSON.parse(localStorage.getItem('levlprep_premium_v1') || '{}'), t = a.courses && k ? Date.parse(a.courses[k]) : NaN; return t > Date.now(); }catch(e){ return false; }
  }

  function bar(cap, read, inter){
    var el = document.createElement('div');
    el.className = 'rt-bar rt-' + mode;
    el.innerHTML = '<div class="rt-pill" role="group" aria-label="How to study this topic">' +
      '<span class="rt-cap" aria-live="polite"></span>' + read + inter + '</div>';
    if(cap) el.querySelector('.rt-cap').textContent = cap;
    return el;
  }

  /* ---- the textbook ---- */
  if(mode === 'book'){
    var main = document.querySelector('main.tb-main') || document.getElementById('main');
    if(!main) return;
    var state = load();
    var el = bar('', '<span class="rt-opt on" aria-current="true">Read</span>', '<span class="rt-slot"></span>');
    main.insertBefore(el, main.firstChild);
    var slot = el.querySelector('.rt-slot'), cap = el.querySelector('.rt-cap');
    var current = null;

    var sections = function(){
      return [].filter.call(main.querySelectorAll('section.bk-sec[id][data-lesson]'), function(s){ return !s.hidden && s.offsetParent !== null; });
    };
    var titleOf = function(s){
      var h = s.querySelector('h2');
      if(!h) return s.id;
      var n = h.querySelector('.bk-toc-n'), whole = h.textContent;
      if(n) whole = n.textContent + ' ' + whole.slice(n.textContent.length);
      return whole.replace(/\s+/g, ' ').trim();
    };
    var paint = function(s){
      if(s === current && slot.firstChild) return;
      current = s;
      var href = s ? s.getAttribute('data-lesson') : '';
      var t = s ? titleOf(s) : '';
      if(href){
        var prem = s.getAttribute('data-lesson-premium') === '1' ? '<span class="rt-tag">Premium</span>' : '';
        slot.innerHTML = '<a class="rt-opt" href="' + esc(href) + '" data-rt-go="lesson" aria-label="Interactive lesson: ' + esc(t) + '">Interactive' + prem + '</a>';
        cap.textContent = t;
      } else {
        slot.innerHTML = '<span class="rt-opt off" aria-disabled="true" title="This section has no interactive lesson yet">Interactive</span>';
        cap.textContent = s ? 'No interactive lesson for this section yet' : '';
      }
    };
    /* The section being read: the last one whose top has passed the reading line. The line is where a section
       lands when the contents or a link opens it (its scroll-margin-top), so a jump to a topic names that topic
       and not the one before it (audit 2026-11, A4: the switch's bar is 0 px tall, so its bottom was too high). */
    var lineY = function(list){
      var m = parseFloat(getComputedStyle(list[0]).scrollMarginTop) || 0, de = document.documentElement;
      // At the foot of the page the last topics can never reach the line: the upper half of the screen counts.
      var foot = window.scrollY + window.innerHeight >= de.scrollHeight - 4 ? window.innerHeight * 0.5 : 0;
      return Math.max(el.getBoundingClientRect().bottom + 24, m + 12, foot);
    };
    var pick = function(){
      var list = sections();
      if(!list.length){ paint(null); return; }
      var line = lineY(list), at = list[0];
      for(var i = 0; i < list.length; i++){ if(list[i].getBoundingClientRect().top <= line) at = list[i]; else break; }
      // A topic the address opened stays named while it is on screen, until the reader scrolls on their own.
      var pin = pinned && document.getElementById(pinned);
      if(pin && list.indexOf(pin) >= 0){ var r = pin.getBoundingClientRect(); if(r.top < window.innerHeight * 0.6 && r.bottom > line) at = pin; }
      paint(at);
    };
    var pinned = decodeURIComponent(location.hash.slice(1));
    ['wheel', 'touchmove', 'keydown', 'mousedown'].forEach(function(ev){ window.addEventListener(ev, function(){ pinned = ''; }, { passive: true }); });
    // The address names a section: name it straight away, before any scroll settles.
    var fromHash = function(){
      var id = decodeURIComponent(location.hash.slice(1)), s = id && document.getElementById(id);
      pinned = id;
      if(s && s.matches && s.matches('section.bk-sec[data-lesson]') && !s.hidden){ paint(s); return true; }
      return false;
    };

    /* End of each topic: Previous topic / Next topic, in a strip the path's end card also uses. Neighbours are
       the visible sections of this page; at a chapter's end, the chapter link that follows. A book that shows one
       section at a time (ochem) has its own pager below the section, so it gets the strip without links. */
    var pager = !!main.querySelector('.tb-section-pager');
    var link = function(dir, s, href){
      var lbl = dir === 'prev' ? '&larr; Previous topic' : 'Next topic &rarr;';
      return '<a class="rt-' + dir + '" href="' + esc(href) + '"><span>' + lbl + '</span><b>' + esc(s) + '</b></a>';
    };
    /* Adding strips above the section being read would push it down the screen: keep it where it is. */
    var keep = function(fn){
      var a = [].filter.call(main.querySelectorAll('section.bk-sec[id]'), function(x){ return !x.hidden && x.getBoundingClientRect().bottom > 90; })[0];
      var y = a && a.getBoundingClientRect().top;
      fn();
      if(a){ var d = a.getBoundingClientRect().top - y; if(Math.abs(d) > 1) window.scrollBy(0, d); }
    };
    var ends = function(){ keep(endsNow); };
    var endsNow = function(){
      var all = [].filter.call(main.querySelectorAll('section.bk-sec[id]'), function(s){ return !s.hidden; });
      var navNext = main.querySelector('.tb-chapter-nav:not(.tb-section-pager) .tb-chapter-link.next');
      all.forEach(function(s, i){
        var strip = s.querySelector(':scope > .rt-end');
        if(!strip){ strip = document.createElement('div'); strip.className = 'rt-end'; var mark = s.querySelector(':scope > .tb-section-end'); if(mark) s.insertBefore(strip, mark); else s.appendChild(strip); }
        var nav = strip.querySelector(':scope > .rt-nav');
        if(pager){ if(nav) nav.remove(); return; }
        var p = all[i - 1], n = all[i + 1], html = '';
        if(p) html += link('prev', titleOf(p), '#' + p.id);
        if(n) html += link('next', titleOf(n), '#' + n.id);
        else if(navNext){ var b = navNext.querySelector('b'); html += link('next', b ? b.textContent : navNext.textContent, navNext.getAttribute('href')); }
        if(!html){ if(nav) nav.remove(); return; }
        if(!nav){ nav = document.createElement('nav'); nav.className = 'rt-nav'; nav.setAttribute('aria-label', 'Topics'); strip.appendChild(nav); }
        if(nav.getAttribute('data-k') !== html){ nav.setAttribute('data-k', html); nav.innerHTML = html; }
      });
    };

    var queued = false;
    var soon = function(){ if(queued) return; queued = true; requestAnimationFrame(function(){ queued = false; pick(); }); };
    var endsQ = false;
    var endsSoon = function(){ if(endsQ) return; endsQ = true; setTimeout(function(){ endsQ = false; ends(); }, 60); };
    window.addEventListener('scroll', soon, { passive: true });
    window.addEventListener('resize', soon);
    window.addEventListener('hashchange', function(){ fromHash(); setTimeout(function(){ if(!fromHash()) pick(); }, 120); });
    new MutationObserver(function(ms){
      // Our own strips changing must not loop back here.
      if(ms.every(function(m){ return m.target.closest && m.target.closest('.rt-end'); })) return;
      soon(); endsSoon();
    }).observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });

    el.addEventListener('click', function(e){
      var a = e.target.closest('[data-rt-go]');
      if(a) save({ mode: 'lesson', href: open(current) ? a.getAttribute('href') : '' });
    });

    /* Interactive was the last choice: open the lesson instead. A topic in the address is honoured (once its
       section is drawn); otherwise the last lesson. A reader who came back with Back stays here, and so does one
       whose lesson is locked (it says Premium in the switch; the notes are right here, free). */
    var hash = decodeURIComponent(location.hash.slice(1));
    function open(s){ return !!(s && s.getAttribute('data-lesson') && (s.getAttribute('data-lesson-premium') !== '1' || hasPass())); }
    if(state.mode === 'lesson' && !backForward()){
      var go = function(href){ if(href){ document.documentElement.classList.add('rt-leaving'); location.replace(href); } };
      if(hash){
        var waited = 0;
        var tryHash = function(){
          var s = document.getElementById(hash);
          var drawn = main.querySelector('section.bk-sec[data-lesson]');
          if(!drawn && (waited += 100) <= 3000){ setTimeout(tryHash, 100); return; }
          if(s && s.matches('section.bk-sec[data-lesson]')){
            // a topic without a lesson, or a locked one, stays in the book
            if(open(s)) go(s.getAttribute('data-lesson'));
            return;
          }
          // the address names a chapter: its first section with a lesson, if this reader can open it
          var first = [].filter.call(main.querySelectorAll('section.bk-sec[data-lesson]'), function(x){ return x.getAttribute('data-lesson'); })[0];
          if(open(first)) go(first.getAttribute('data-lesson'));
        };
        tryHash();
      } else if(state.href && /^lessons\/[\w-]+\.html$/.test(state.href)){
        // The remembered lesson, once the book has drawn it and only if this reader can open it (a choice saved
        // before 2026-11 may name a lesson that is locked now). Not in the chapter shown: stay in the book.
        var waitedL = 0, asked = false, lid = state.href.replace(/^lessons\/|\.html$/g, '');
        var tryLast = function(){
          var drawn = main.querySelector('section.bk-sec[data-lesson]');
          if(!drawn && (waitedL += 100) <= 3000){ setTimeout(tryLast, 100); return; }
          var s = [].filter.call(main.querySelectorAll('section.bk-sec[data-lesson]'), function(x){ return x.getAttribute('data-lesson').replace(/^(\.\.\/)+/, '') === state.href; })[0];
          if(s){ if(open(s)) go(s.getAttribute('data-lesson')); return; }
          // Another chapter: ask the book for that topic, then look again once it is drawn.
          if(!asked && course !== 'nremt' && !document.getElementById(lid)){ asked = true; waitedL = 0; history.replaceState(null, '', '#' + lid); window.dispatchEvent(new HashChangeEvent('hashchange')); setTimeout(tryLast, 150); }
        };
        tryLast();
      }
    }
    if(!fromHash()) pick();
    ends();
    return;
  }

  /* ---- a notes page: Read is here, Interactive is the topic's lesson ---- */
  if(mode === 'notes'){
    var nmain = document.querySelector('main.tb-main') || document.querySelector('main');
    if(!nmain) return;
    var nfile = location.pathname.split('/').pop().replace(/\.html$/, '');
    var les = document.querySelector('a[href$="lessons/' + nfile + '.html"]');
    var nh1 = nmain.querySelector('h1');
    var ntitle = nh1 ? nh1.textContent.replace(/\s+/g, ' ').trim() : '';
    var inter = les ? '<a class="rt-opt" href="' + esc(les.getAttribute('href')) + '" data-rt-go="lesson" aria-label="Interactive lesson: ' + esc(ntitle) + '">Interactive</a>'
      : '<span class="rt-opt off" aria-disabled="true" title="This topic has no interactive lesson yet">Interactive</span>';
    var nb = bar('', '<span class="rt-opt on" aria-current="true">Read</span>', inter);
    nb.classList.add('rt-book');
    // In place of the old "Practice this lesson" pill, which went to the same lesson.
    var pill = nmain.querySelector('.bk-pillbar');
    if(pill) pill.hidden = true;
    nmain.insertBefore(nb, nmain.firstChild);
    return;
  }

  /* ---- a lesson ---- */
  if(mode === 'lesson'){
    var host = document.querySelector('main#main') || document.querySelector('.lesson-shell') || document.querySelector('.r3-lesson');
    if(!host) return;
    var file = location.pathname.split('/').pop().replace(/\.html$/, '');
    var topic = (document.body && document.body.getAttribute('data-topic')) || file;
    var book = (me.getAttribute('data-rt-book') || '../learn.html') + '#' + encodeURIComponent(topic);
    // NREMT's book opens a chapter by its section id; the others by topic id. Both are the topic here.
    /* Remember Interactive only for a lesson that opened: a locked lesson shows its Premium card (and its free
       notes first), so remembering it would send the textbook straight back to the lock (audit 2026-11, A2). */
    var isLocked = function(){ return !!document.querySelector('.premium-lock[data-premium-feature^="lesson"], .nl-locked, [class$="-free-first"]'); };
    var remember = function(){
      var here = 'lessons/' + file + '.html', st = load();
      if(!isLocked()) save({ mode: 'lesson', href: here });
      else if(st.href === here) save({ mode: st.mode || 'lesson', href: '' });
    };
    if(document.readyState === 'complete') setTimeout(remember, 50); else window.addEventListener('load', function(){ setTimeout(remember, 50); });
    var h1 = host.querySelector('h1');
    var title = h1 ? h1.textContent.replace(/\s+/g, ' ').replace(/\.$/, '').trim() : '';
    var lb = bar(title, '<a class="rt-opt" href="' + esc(book) + '" data-rt-go="read" aria-label="Read: ' + esc(title || 'this topic') + ' in the textbook">Read</a>',
      '<span class="rt-opt on" aria-current="true">Interactive</span>');
    // In the lesson's hero band, above the eyebrow. No class goes
    // on the hero itself: its band is matched by [class$="-ls-hero"].
    var hero = host.querySelector('header[class*="-ls-hero"], .hero');
    if(hero){ lb.classList.add('rt-inhero'); hero.insertBefore(lb, hero.firstChild); }
    else host.insertBefore(lb, host.firstChild);
    lb.addEventListener('click', function(e){
      if(e.target.closest('[data-rt-go="read"]')) save({ mode: 'read', href: 'lessons/' + file + '.html' });
    });

    /* Ochem lessons end on "Builds on / Leads to": give them the same "Next lesson →" every other course's
       lesson ends with, the next topic in the course that has a lesson (audit 2026-11, A7). */
    var OC = window.OchemCurriculum, rows = document.querySelector('nav.lesson-links');
    if(OC && OC.MODULES && rows && !document.querySelector('.rt-nextlesson')){
      var all = [], at = -1;
      OC.MODULES.forEach(function(m){ m.topics.forEach(function(t){ if(t.href && /^lessons\//.test(t.href) && (!OC.hasLesson || OC.hasLesson(t))) all.push(t); }); });
      all.forEach(function(t, i){ if(t.href === 'lessons/' + file + '.html') at = i; });
      var nx = at >= 0 ? all[at + 1] : null;
      if(nx){
        var p = document.createElement('p');
        p.className = 'rt-nextlesson';
        p.innerHTML = '<a class="btn-press sm" href="' + esc(nx.href.replace(/^lessons\//, '')) + '">Next lesson &rarr;</a> <span>' + esc(nx.title) + '</span>';
        rows.parentNode.insertBefore(p, rows);
      }
    }
  }
})();
