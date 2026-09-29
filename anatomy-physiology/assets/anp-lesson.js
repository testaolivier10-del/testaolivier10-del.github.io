/* A lesson page (docs/anp-spec.md section 4): swaps the static questions for
   live ones, runs the prerequisite check (a wrong answer points at the topic to
   review), the anatomy panel's hide-labels toggle, and records completion
   once every check question has been answered. It also turns the page, which
   holds every part in one scroll, into one part per step. */
(function(){
  /* The stepped view: one part at a time, a step list in the rail, Previous and
     Continue, the part in the URL hash (#chain opens that step) and the last
     step remembered per topic. Focus moves to the part's heading on a change. */
  function steps(topic){
    var shell = document.querySelector('.anp-ls');
    var parts = shell ? [].slice.call(shell.querySelectorAll('.anp-step')) : [];
    if(parts.length < 2) return;
    var n = parts.length, cur = -1, seen = 0, key = 'anp_step_' + topic;
    var links = [].slice.call(shell.querySelectorAll('.anp-ls-steps a'));
    var card = shell.querySelector('.anp-ls-card'), bar = shell.querySelector('.anp-ls-actions');
    var back = bar.querySelector('.anp-ls-back'), gos = bar.querySelectorAll('.anp-ls-go');
    var prog = shell.querySelector('.anp-ls-prog');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch(e){}
    seen = Math.min(saved.seen | 0, n - 1);
    function fromHash(){
      var el = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
      var p = el && el.closest('.anp-step');
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
      prog.querySelector('.anp-ls-fill').style.width = (i / (n - 1) * 100) + '%';
      prog.querySelector('.anp-ls-count').textContent = 'Step ' + (i + 1) + ' / ' + n;
      back.hidden = i === 0; gos[0].hidden = i === n - 1; gos[1].hidden = i !== n - 1;
      try { localStorage.setItem(key, JSON.stringify({ step: i, seen: seen })); } catch(e){}
      if(how === 'user'){
        if(history.replaceState) history.replaceState(null, '', '#' + parts[i].id);
        parts[i].querySelector('h2').focus({ preventScroll: true });
        show(card);
      }
    }
    shell.classList.add('anp-stepped');
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
  }

  function start(){
    var dataEl = document.getElementById('anp-page-data');
    if(!dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var topic = data.topic;
    steps(topic);
    if(!window.AnpQuestions) return;

    var pre = document.querySelector('.anp-qs[data-set="prereq"]');
    if(pre && data.prereq.length){
      window.AnpQuestions.hydrate(pre, data.prereq, {
        record: false,
        onAnswer: function(res){
          if(res.correct) return;
          var q = res.q, el = pre.querySelector('[data-qid="' + q.id + '"] .anp-q-feedback');
          if(!el) return;
          el.insertAdjacentHTML('beforeend', '<p class="anp-small">Worth a quick look first: ' +
            (q.reviewHref ? '<a href="' + q.reviewHref + '">' + q.reviewTitle + '</a>' : q.reviewTitle + ' (coming in a later part of the course)') + '.</p>');
        }
      });
    }

    var chk = document.querySelector('.anp-qs[data-set="check"]');
    var answered = 0, right = 0, total = data.check.length;
    if(chk && total){
      window.AnpQuestions.hydrate(chk, data.check, {
        onAnswer: function(res){
          answered++; if(res.correct) right++;
          if(answered === total){
            var first = window.AnpCore && window.AnpCore.lessonComplete(topic);
            if(window.AnpCore) window.AnpCore.event('anp-session-finish', { mode: 'lesson', topic: topic, answered: total, correct: right });
            chk.insertAdjacentHTML('afterend', '<p class="anp-done" role="status"><b>Lesson complete.</b> ' + right + ' of ' + total + ' right' + (first ? ', +40 XP' : '') + '.</p>');
          }
        }
      });
    }

    var btn = document.querySelector('.anp-toggle-labels');
    var panel = document.querySelector('.anp-anatomy .anp-figimg');
    if(btn && panel){
      btn.addEventListener('click', function(){
        var hidden = panel.classList.toggle('anp-labels-hidden');
        btn.setAttribute('aria-pressed', hidden ? 'true' : 'false');
        btn.textContent = hidden ? 'Show labels' : 'Hide labels';
        panel.querySelectorAll('.anp-mask').forEach(function(m){ m.classList.remove('revealed'); m.querySelector('span').style.cssText = ''; });
      });
      panel.addEventListener('click', function(e){
        var m = e.target.closest('.anp-mask');
        if(!m || !panel.classList.contains('anp-labels-hidden')) return;
        m.classList.toggle('revealed');
      });
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
