/* Read | Interactive: one switch at the top of a course textbook and of every interactive lesson, in place of
   the "Lesson" button each textbook section used to carry (Olivier, 2026-10-26: "it should be like a thing where
   you can toggle between the textbook non interactive and the entire textbook as interactive").

   Loaded with data attributes on its own script tag:
     data-rt="book"    on the course textbook (learn.html). Each section of the book is a
                       section.bk-sec[id] with data-lesson="lessons/<id>.html" (or data-lesson="" when the topic
                       has no interactive lesson yet; the section then says so in place, and the switch shows
                       Interactive as unavailable for it). data-lesson-premium="1" adds the Premium tag.
     data-rt="lesson"  on a lesson page; data-rt-book is the textbook's address from that page
                       (e.g. "../learn.html"). The topic is body[data-topic], else the page's file name.
     data-rt-course    the course key, for the remembered choice.
   All three are optional (see the defaults below), so the builders load it as a plain script.

   Switching keeps the topic: Interactive opens the lesson of the section being read, Read opens the textbook at
   the lesson's topic. The choice is remembered per course (localStorage, best effort), so opening the textbook
   again goes straight to the last lesson while Interactive is the choice. Going Back never redirects, so the
   back button is not trapped. Premium gating is untouched: a locked lesson shows its own locked state. */
(function(){
  var me = document.currentScript;
  if(!me) return;
  // Without attributes: a page with the book's main column is the book, anything else a lesson; the course is
  // the first folder of the address (/bio/, /ochem/, ...), and a lesson's book is ../learn.html.
  var mode = me.getAttribute('data-rt') || (document.querySelector('main.tb-main') ? 'book' : 'lesson');
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

  function bar(cap, read, inter){
    var el = document.createElement('div');
    el.className = 'rt-bar rt-' + mode;
    el.innerHTML = '<div class="rt-pill" role="group" aria-label="How to study this textbook">' +
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
    // The section being read: the last one whose top has passed the switch.
    var pick = function(){
      var list = sections();
      if(!list.length){ paint(null); return; }
      var line = el.getBoundingClientRect().bottom + 24, at = list[0];
      for(var i = 0; i < list.length; i++){ if(list[i].getBoundingClientRect().top <= line) at = list[i]; else break; }
      paint(at);
    };
    var queued = false;
    var soon = function(){ if(queued) return; queued = true; requestAnimationFrame(function(){ queued = false; pick(); }); };
    window.addEventListener('scroll', soon, { passive: true });
    window.addEventListener('resize', soon);
    window.addEventListener('hashchange', function(){ setTimeout(pick, 60); });
    new MutationObserver(soon).observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });

    el.addEventListener('click', function(e){
      var a = e.target.closest('[data-rt-go]');
      if(a) save({ mode: 'lesson', href: a.getAttribute('href') });
    });

    /* Interactive was the last choice: open the lesson instead. A topic in the address is honoured (once its
       section is drawn); otherwise the last lesson. A reader who came back with Back stays here. */
    var hash = decodeURIComponent(location.hash.slice(1));
    if(state.mode === 'lesson' && !backForward()){
      var go = function(href){ if(href){ document.documentElement.classList.add('rt-leaving'); location.replace(href); } };
      if(hash){
        var waited = 0;
        var tryHash = function(){
          var s = document.getElementById(hash);
          var drawn = main.querySelector('section.bk-sec[data-lesson]');
          if(!drawn && (waited += 100) <= 3000){ setTimeout(tryHash, 100); return; }
          if(s && s.matches('section.bk-sec[data-lesson]')){
            // a topic without a lesson stays in the book, which says so
            if(s.getAttribute('data-lesson')) go(s.getAttribute('data-lesson'));
            return;
          }
          // the address names a chapter: its first section with a lesson
          var first = [].filter.call(main.querySelectorAll('section.bk-sec[data-lesson]'), function(x){ return x.getAttribute('data-lesson'); })[0];
          if(first) go(first.getAttribute('data-lesson'));
        };
        tryHash();
      } else if(state.href && /^lessons\/[\w-]+\.html$/.test(state.href)){
        go(state.href);
      }
    }
    pick();
    return;
  }

  /* ---- a lesson ---- */
  if(mode === 'lesson'){
    var host = document.querySelector('main#main') || document.querySelector('.lesson-shell') || document.querySelector('.r3-lesson');
    if(!host) return;
    var file = location.pathname.split('/').pop().replace(/\.html$/, '');
    var topic = (document.body && document.body.getAttribute('data-topic')) || file;
    var book = (me.getAttribute('data-rt-book') || '../learn.html') + '#' + encodeURIComponent(topic);
    save({ mode: 'lesson', href: 'lessons/' + file + '.html' });
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
  }
})();
