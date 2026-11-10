/* A lesson page (docs/hug-spec.md section 4): swaps the static questions for
   live ones, runs the prerequisite check (a wrong answer points at the topic to
   review), the figure's hide-labels toggle, and records completion
   once every check question has been answered. It also turns the page, which
   holds every part in one scroll, into one part per step. */
(function(){
  /* The stepped view: one part at a time, a step list in the rail, Previous and
     Continue, the part in the URL hash (#chain opens that step) and the last
     step remembered per topic. Focus moves to the part's heading on a change. */
  function steps(topic){
    var shell = document.querySelector('.hug-ls');
    var parts = shell ? [].slice.call(shell.querySelectorAll('.hug-step')) : [];
    if(parts.length < 2) return;
    var n = parts.length, cur = -1, seen = 0, key = 'aphug_step_' + topic;
    var links = [].slice.call(shell.querySelectorAll('.hug-ls-steps a'));
    var card = shell.querySelector('.hug-ls-card'), bar = shell.querySelector('.hug-ls-actions');
    var back = bar.querySelector('.hug-ls-back'), gos = bar.querySelectorAll('.hug-ls-go');
    var prog = shell.querySelector('.hug-ls-prog');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch(e){}
    seen = Math.min(saved.seen | 0, n - 1);
    function fromHash(){
      var el = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
      var p = el && el.closest('.hug-step');
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
      prog.querySelector('.hug-ls-fill').style.width = (i / (n - 1) * 100) + '%';
      prog.querySelector('.hug-ls-count').textContent = 'Step ' + (i + 1) + ' / ' + n;
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
       whose questions never went live (no ApHugQuestions), is never held. */
    var hint = document.createElement('span');
    hint.className = 'hug-ls-hint';
    hint.setAttribute('aria-live', 'polite');
    bar.insertBefore(hint, gos[0]);
    function gate(){
      var p = parts[cur];
      var open = p ? p.querySelectorAll('.hug-q:not(.is-answered)').length : 0;
      gos[0].disabled = open > 0;
      hint.textContent = open > 0 && !gos[0].hidden ? (open === 1 ? 'Answer the question to continue.' : 'Answer the ' + open + ' questions to continue.') : '';
    }
    shell.addEventListener('hug:answered', gate);
    shell.classList.add('hug-stepped');
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
    var dataEl = document.getElementById('hug-page-data');
    if(!dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var topic = data.topic, C = window.ApHugCore, ch = data.unit;
    // Premium: outside Units 1 and 2 and the skills lessons,
    // the interactive lesson is part of Premium.
    // Locked, the card and the step list give way to the gate and the notes.
    if(C && C.locked && !data.free && C.locked(ch, topic)){
      var card = document.querySelector('.hug-ls-card'), list = document.querySelector('.hug-ls-steps');
      if(card){
        /* The free notes are the primary action and the Premium card comes
           second (audit 2026-10: the card came first and the notes were a
           small link under it). The link moves out of the card into the
           button, so the screen carries one offer. */
        var box = document.createElement('div');
        box.innerHTML = C.gate('lessons', 'lesson', topic);
        var notes = box.querySelector('.hug-gate-notes a');
        var free = document.createElement('div');
        free.className = 'hug-free-first';
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
    var tags = C && C.badge && !data.free && document.querySelector('.hug-ls-hero .hug-tags');
    if(tags) tags.insertAdjacentHTML('beforeend', C.badge(ch));
    var regate = steps(topic) || function(){};
    if(!window.ApHugQuestions) return;

    var pre = document.querySelector('.hug-qs[data-set="prereq"]');
    if(pre && data.prereq.length){
      window.ApHugQuestions.hydrate(pre, data.prereq, {
        record: false,
        onAnswer: function(res){
          if(res.correct) return;
          var q = res.q, el = pre.querySelector('[data-qid="' + q.id + '"] .hug-q-feedback');
          if(!el) return;
          el.insertAdjacentHTML('beforeend', '<p class="hug-small">Worth a quick look first: ' +
            (q.reviewHref ? '<a href="' + q.reviewHref + '">' + q.reviewTitle + '</a>' : q.reviewTitle + ' (coming soon)') + '.</p>');
        }
      });
    }

    var chk = document.querySelector('.hug-qs[data-set="check"]');
    var answered = 0, right = 0, total = data.check.length;
    if(chk && total){
      window.ApHugQuestions.hydrate(chk, data.check, {
        onAnswer: function(res){
          answered++; if(res.correct) right++;
          if(answered === total){
            var first = window.ApHugCore && window.ApHugCore.lessonComplete(topic);
            if(window.ApHugCore) window.ApHugCore.event('aphug-session-finish', { mode: 'lesson', topic: topic, answered: total, correct: right });
            chk.insertAdjacentHTML('afterend', '<p class="hug-done" role="status"><b>Lesson complete.</b> ' + right + ' of ' + total + ' right' + (first ? ', +40 XP' : '') + '.</p>');
            // Sign in to keep it, or the Premium pitch when the next lesson is Premium (assets/course/lesson.js).
            if(window.LevlLesson) window.LevlLesson.checked(chk.parentNode.querySelector('.hug-done'));
          }
        }
      }, data.stimuli);
    }

    // The questions are live now, so the open step may need to hold Continue.
    regate();

    var btn = document.querySelector('.hug-toggle-labels');
    var panel = document.querySelector('.hug-lesson-fig .hug-figimg');
    if(btn && panel){
      btn.addEventListener('click', function(){
        var hidden = panel.classList.toggle('hug-labels-hidden');
        btn.setAttribute('aria-pressed', hidden ? 'true' : 'false');
        btn.textContent = hidden ? 'Show labels' : 'Hide labels';
        panel.querySelectorAll('.hug-mask').forEach(function(m){ m.classList.remove('revealed'); m.querySelector('span').style.cssText = ''; });
      });
      panel.addEventListener('click', function(e){
        var m = e.target.closest('.hug-mask');
        if(!m || !panel.classList.contains('hug-labels-hidden')) return;
        m.classList.toggle('revealed');
      });
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
