/* A lesson page (docs/phys-spec.md section 4): swaps the static questions for
   live ones, runs the prerequisite check (a wrong answer points at the topic to
   review), the figure's hide-labels toggle, and records completion
   once every check question has been answered. It also turns the page, which
   holds every part in one scroll, into one part per step. */
(function(){
  /* The stepped view: one part at a time, a step list in the rail, Previous and
     Continue, the part in the URL hash (#chain opens that step) and the last
     step remembered per topic. Focus moves to the part's heading on a change. */
  function steps(topic){
    var shell = document.querySelector('.phys-ls');
    var parts = shell ? [].slice.call(shell.querySelectorAll('.phys-step')) : [];
    if(parts.length < 2) return;
    var n = parts.length, cur = -1, seen = 0, key = 'apphys_step_' + topic;
    var links = [].slice.call(shell.querySelectorAll('.phys-ls-steps a'));
    var card = shell.querySelector('.phys-ls-card'), bar = shell.querySelector('.phys-ls-actions');
    var back = bar.querySelector('.phys-ls-back'), gos = bar.querySelectorAll('.phys-ls-go');
    var prog = shell.querySelector('.phys-ls-prog');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch(e){}
    seen = Math.min(saved.seen | 0, n - 1);
    function fromHash(){
      var el = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
      var p = el && el.closest('.phys-step');
      return p ? { i: parts.indexOf(p), el: el } : null;
    }
    function show(el){
      var top = card.getBoundingClientRect().top;
      if(el !== card || top < 0 || top > innerHeight * 0.6) el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    }
    function go(i, how){
      cur = i = Math.max(0, Math.min(n - 1, i)); seen = Math.max(seen, i);
      parts.forEach(function(p, j){ p.classList.toggle('is-on', j === i); });
      links.forEach(function(a, j){
        a.parentNode.className = j === i ? 'current' : j <= seen ? 'done' : '';
        if(j === i) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      });
      prog.querySelector('.phys-ls-fill').style.width = (i / (n - 1) * 100) + '%';
      prog.querySelector('.phys-ls-count').textContent = 'Step ' + (i + 1) + ' / ' + n;
      back.hidden = i === 0; gos[0].hidden = i === n - 1; gos[1].hidden = i !== n - 1;
      gate();
      try { localStorage.setItem(key, JSON.stringify({ step: i, seen: seen })); } catch(e){}
      if(how === 'user'){
        if(history.replaceState) history.replaceState(null, '', '#' + parts[i].id);
        parts[i].querySelector('h2').focus({ preventScroll: true });
        show(card);
      }
    }
    /* The same rule as the ochem lessons (audit 2026-10): Continue opens once
       the step's questions are answered. A step without questions, or one
       whose questions never went live (no ApPhysQuestions), is never held. */
    var hint = document.createElement('span');
    hint.className = 'phys-ls-hint';
    hint.setAttribute('aria-live', 'polite');
    bar.insertBefore(hint, gos[0]);
    function gate(){
      var p = parts[cur];
      var open = p ? p.querySelectorAll('.phys-q:not(.is-answered)').length : 0;
      gos[0].disabled = open > 0;
      hint.textContent = open > 0 && !gos[0].hidden ? (open === 1 ? 'Answer the question to continue.' : 'Answer the ' + open + ' questions to continue.') : '';
    }
    shell.addEventListener('phys:answered', gate);
    shell.classList.add('phys-stepped');
    prog.hidden = bar.hidden = false;
    links.forEach(function(a, j){
      a.addEventListener('click', function(e){
        if(e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault(); go(j, 'user');
      });
    });
    back.addEventListener('click', function(){ go(cur - 1, 'user'); });
    gos[0].addEventListener('click', function(){ go(cur + 1, 'user'); });
    window.addEventListener('hashchange', function(){
      var h = fromHash();
      if(h){ go(h.i); show(h.el === parts[h.i] ? card : h.el); }
    });
    var h = fromHash();
    go(h ? h.i : saved.step | 0);
    if(h) show(h.el === parts[h.i] ? card : h.el);
    return gate;
  }

  function start(){
    var dataEl = document.getElementById('phys-page-data');
    if(!dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var topic = data.topic, C = window.ApPhysCore, ch = data.unit;
    // Premium: outside Units 1 and 2 and the skills lessons,
    // the interactive lesson is part of Premium.
    // Locked, the card and the step list give way to the gate and the notes.
    if(C && C.locked && !data.free && C.locked(ch, topic)){
      var card = document.querySelector('.phys-ls-card'), list = document.querySelector('.phys-ls-steps');
      if(card){
        /* The free notes are the primary action and the Premium card comes
           second (audit 2026-10: the card came first and the notes were a
           small link under it). The link moves out of the card into the
           button, so the screen carries one offer. */
        var box = document.createElement('div');
        box.innerHTML = C.gate('lessons', 'lesson', topic);
        var notes = box.querySelector('.phys-gate-notes a');
        var free = document.createElement('div');
        free.className = 'phys-free-first';
        if(notes){
          free.innerHTML = '<p>This lesson&rsquo;s interactive steps are part of Premium. Everything it teaches is in its notes, free.</p>' +
            '<a class="btn-press" href="' + notes.getAttribute('href') + '">Read the free notes &rarr;</a>';
          notes.parentNode.remove();
        }
        card.parentNode.insertBefore(free, card);
        while(box.firstChild) card.parentNode.insertBefore(box.firstChild, card);
        card.style.display = 'none';
      }
      if(list) list.style.display = 'none';
      return;
    }
    var tags = C && C.badge && !data.free && document.querySelector('.phys-ls-hero .phys-tags');
    if(tags) tags.insertAdjacentHTML('beforeend', C.badge(ch));
    var regate = steps(topic) || function(){};
    if(!window.ApPhysQuestions) return;

    var pre = document.querySelector('.phys-qs[data-set="prereq"]');
    if(pre && data.prereq.length){
      window.ApPhysQuestions.hydrate(pre, data.prereq, {
        record: false,
        onAnswer: function(res){
          if(res.correct) return;
          var q = res.q, el = pre.querySelector('[data-qid="' + q.id + '"] .phys-q-feedback');
          if(!el) return;
          el.insertAdjacentHTML('beforeend', '<p class="phys-small">Worth a quick look first: ' +
            (q.reviewHref ? '<a href="' + q.reviewHref + '">' + q.reviewTitle + '</a>' : q.reviewTitle + ' (coming soon)') + '.</p>');
        }
      });
    }

    var chk = document.querySelector('.phys-qs[data-set="check"]');
    var answered = 0, right = 0, total = data.check.length;
    if(chk && total){
      window.ApPhysQuestions.hydrate(chk, data.check, {
        onAnswer: function(res){
          answered++; if(res.correct) right++;
          if(answered === total){
            var first = window.ApPhysCore && window.ApPhysCore.lessonComplete(topic);
            if(window.ApPhysCore) window.ApPhysCore.event('apphys-session-finish', { mode: 'lesson', topic: topic, answered: total, correct: right });
            chk.insertAdjacentHTML('afterend', '<p class="phys-done" role="status"><b>Lesson complete.</b> ' + right + ' of ' + total + ' right' + (first ? ', +40 XP' : '') + '.</p>');
            // Sign in to keep it, or the Premium pitch when the next lesson is Premium (assets/course/lesson.js).
            if(window.LevlLesson) window.LevlLesson.checked(chk.parentNode.querySelector('.phys-done'));
          }
        }
      }, data.stimuli);
    }

    // The questions are live now, so the open step may need to hold Continue.
    regate();

    var btn = document.querySelector('.phys-toggle-labels');
    var panel = document.querySelector('.phys-lesson-fig .phys-figimg');
    if(btn && panel){
      btn.addEventListener('click', function(){
        var hidden = panel.classList.toggle('phys-labels-hidden');
        btn.setAttribute('aria-pressed', hidden ? 'true' : 'false');
        btn.textContent = hidden ? 'Show labels' : 'Hide labels';
        panel.querySelectorAll('.phys-mask').forEach(function(m){ m.classList.remove('revealed'); m.querySelector('span').style.cssText = ''; });
      });
      panel.addEventListener('click', function(e){
        var m = e.target.closest('.phys-mask');
        if(!m || !panel.classList.contains('phys-labels-hidden')) return;
        m.classList.toggle('revealed');
      });
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
