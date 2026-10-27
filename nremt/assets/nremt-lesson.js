/* An NREMT lesson page (scripts/build-nremt-lessons.mjs, docs/nremt-lessons-spec.md).
   Turns the page, which holds every part in one scroll, into one part per step
   (the same rules as the A&P and ochem lessons: a step list, Previous and
   Continue, the part in the URL hash, the last step remembered per lesson,
   Continue held until the step's questions are answered), runs the check
   questions, and records the lesson as done once every question is answered
   (+40 XP the first time, like the other courses' lessons). */
(function(){
  var shell = document.querySelector('.nl');
  if(!shell) return;
  var id = shell.getAttribute('data-lesson');
  var DONE_KEY = 'nremt_lessons_v1', STEP_KEY = 'nremt_lesson_step_' + id, XP = 40;
  function read(k){ try { return JSON.parse(localStorage.getItem(k)) || {}; } catch(e){ return {}; } }
  function write(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }

  /* Premium: chapters 1 to 8 are free (assets/premium.js COURSES.nremt.freeChapters); a later lesson is part of
     Premium. Locked, the card and the step list give way to the free notes first and then the Premium card, as on
     the A&P and ochem lessons. A pass that arrives later (sign-in, purchase) unlocks the page in place. */
  var chapter = shell.getAttribute('data-chapter');
  function locked(){
    var P = window.LevlPremium;
    return !!P && !P.isFreeChapter('nremt', chapter) && !P.has('nremt');
  }
  var started = false, lockBox = null;
  var card0 = shell.querySelector('.nl-card'), steps0 = shell.querySelector('.nl-steps'), prog0 = shell.querySelector('.nl-prog');
  function lock(){
    if(lockBox) return;
    lockBox = document.createElement('div');
    lockBox.className = 'nl-locked';
    lockBox.innerHTML = '<div class="nl-free-first"><p>This lesson&rsquo;s interactive steps are part of Premium. Everything it teaches is in the textbook, free.</p>' +
      '<a class="btn-press" href="' + (shell.getAttribute('data-notes') || '../study-notes.html') + '">Read it free in the textbook &rarr;</a></div>' +
      window.LevlPremium.gate('nremt', 'lessons', 'lesson');
    card0.parentNode.insertBefore(lockBox, card0);
    card0.hidden = true; if(steps0) steps0.hidden = true; if(prog0) prog0.hidden = true;
  }
  function unlock(){
    if(lockBox){ lockBox.remove(); lockBox = null; card0.hidden = false; if(steps0) steps0.hidden = false; }
    if(!started){ started = true; run(); }
  }
  function check(){ if(locked()) lock(); else unlock(); }
  if(window.LevlPremium && LevlPremium.onChange) LevlPremium.onChange(check); else check();

  function run(){
    var parts = [].slice.call(shell.querySelectorAll('.nl-part'));
    var links = [].slice.call(shell.querySelectorAll('.nl-steps a'));
    var bar = shell.querySelector('.nl-actions'), back = bar.querySelector('.nl-back'), go = bar.querySelector('.nl-go'), hint = bar.querySelector('.nl-hint');
    var prog = shell.querySelector('.nl-prog'), card = shell.querySelector('.nl-card');
    var n = parts.length, cur = 0, saved = read(STEP_KEY), seen = Math.min(saved.seen | 0, n - 1);
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    function gate(){
      var open = parts[cur].querySelectorAll('.nl-q:not(.is-answered)').length;
      go.disabled = open > 0;
      hint.textContent = open > 0 && !go.hidden ? (open === 1 ? 'Answer the question to continue.' : 'Answer the ' + open + ' questions to continue.') : '';
    }
    function show(i, user){
      cur = Math.max(0, Math.min(n - 1, i)); seen = Math.max(seen, cur);
      parts.forEach(function(p, j){ p.classList.toggle('is-on', j === cur); });
      links.forEach(function(a, j){
        a.parentNode.className = j === cur ? 'current' : j <= seen ? 'done' : '';
        if(j === cur) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      });
      prog.querySelector('.nl-fill').style.width = (cur / (n - 1) * 100) + '%';
      prog.querySelector('.nl-count').textContent = 'Step ' + (cur + 1) + ' / ' + n;
      back.hidden = cur === 0; go.hidden = cur === n - 1;
      gate();
      write(STEP_KEY, { step: cur, seen: seen });
      if(user){
        if(history.replaceState) history.replaceState(null, '', '#' + parts[cur].id);
        parts[cur].querySelector('h2').focus({ preventScroll: true });
        var top = card.getBoundingClientRect().top;
        if(top < 0 || top > innerHeight * 0.6) card.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    shell.classList.add('nl-stepped');
    prog.hidden = bar.hidden = false;
    links.forEach(function(a, j){
      a.addEventListener('click', function(e){
        if(e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault(); show(j, true);
      });
    });
    back.addEventListener('click', function(){ show(cur - 1, true); });
    go.addEventListener('click', function(){ show(cur + 1, true); });
    function fromHash(){
      var el = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
      var p = el && el.closest('.nl-part');
      return p ? parts.indexOf(p) : -1;
    }
    window.addEventListener('hashchange', function(){ var h = fromHash(); if(h > -1) show(h); });

    /* The check questions: one answer each, the explanation revealed, the
       right option marked either way. */
    var qs = [].slice.call(shell.querySelectorAll('.nl-q')), answered = 0, right = 0;
    qs.forEach(function(q){
      var ok = +q.getAttribute('data-correct');
      var opts = [].slice.call(q.querySelectorAll('.nl-opt'));
      opts.forEach(function(b){
        b.addEventListener('click', function(){
          if(q.classList.contains('is-answered')) return;
          var pick = +b.getAttribute('data-i'), good = pick === ok;
          q.classList.add('is-answered', good ? 'is-right' : 'is-wrong');
          opts.forEach(function(o, j){
            o.disabled = true;
            if(j === ok) o.classList.add('is-correct');
            if(j === pick && !good) o.classList.add('is-picked');
          });
          var why = q.querySelector('.nl-q-why');
          why.insertAdjacentHTML('afterbegin', '<b>' + (good ? 'Right. ' : 'Not quite. ') + '</b>');
          why.hidden = false;
          if(window.LevlSound && LevlSound.answer) try { LevlSound.answer(good); } catch(e){}
          answered++; if(good) right++;
          gate();
          if(answered === qs.length) finish();
        });
      });
    });
    function finish(){
      var done = read(DONE_KEY), first = !done[id];
      if(first){ done[id] = new Date().toISOString(); write(DONE_KEY, done); }
      if(first && window.HubProgress) try { HubProgress.award('nremt', XP); } catch(e){}
      var box = shell.querySelector('.nl-qs');
      box.insertAdjacentHTML('afterend', '<p class="nl-done" role="status"><b>Lesson complete.</b> ' + right + ' of ' + qs.length + ' right' + (first ? ', +' + XP + ' XP' : '') + '.</p>');
    }

    var h = fromHash();
    show(h > -1 ? h : saved.step | 0);

  }
})();
