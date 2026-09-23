/* A lesson page (docs/anp-spec.md section 4): swaps the static questions for
   live ones, runs the prerequisite check (a wrong answer points at the topic to
   review), the anatomy panel's hide-labels toggle, and records completion
   once every check question has been answered. */
(function(){
  function start(){
    var dataEl = document.getElementById('anp-page-data');
    if(!dataEl || !window.AnpQuestions) return;
    var data = JSON.parse(dataEl.textContent);
    var topic = data.topic;

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
