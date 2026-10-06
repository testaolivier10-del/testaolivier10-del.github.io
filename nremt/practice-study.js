/* The NREMT study-page shells (docs/course-shell.md, W-C): practice.html's
   step builder and the "Your numbers" rail on practice, review and exams.
   practice-engine.js does the work; this file only maps the shared builder
   onto the engine's own controls (one start button per mode, the length
   selects it caps to the free allowance) and fills the rail. It reads the
   same storage keys the engine writes and never writes any. */
(function(){
  function $(id){ return document.getElementById(id); }
  function read(k, d){ try{ var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; }catch(e){ return d; } }
  function count(x){ return Array.isArray(x) ? x.length : x && typeof x === 'object' ? Object.keys(x).length : 0; }

  /* The rail: answered, due, to fix, streak. Due is the engine's own figure
     (renderDueSummary writes it into [data-due="all"]). */
  function paintStats(){
    var box = $('nrStats');
    if(!box || !window.LevlStudy) return;
    var answered = count(read('nremt_mastery', {}));
    var missed = count(read('nremt_exam100_missed', []));
    var dueEl = document.querySelector('[data-due="all"]');
    var due = dueEl ? parseInt(String(dueEl.textContent).replace(/\D/g, ''), 10) || 0 : 0;
    var streak = LevlStudy.streak();
    box.innerHTML = LevlStudy.stat('Answered', answered.toLocaleString(), answered ? 'questions so far' : 'nothing yet') +
      LevlStudy.stat('Due for review', due.toLocaleString(), due ? 'waiting in your queue' : 'nothing due now', due ? 'is-due' : '') +
      LevlStudy.stat('To fix', missed, missed ? 'missed, not yet right' : 'no open misses') +
      LevlStudy.stat('Day streak', streak, streak ? 'keep it going' : 'practice today to start one');
  }

  /* practice.html: the builder. */
  function builder(){
    var form = $('nrBuilder');
    if(!form) return;
    var BTN = { weak: 'adaptiveStartBtn', domain: 'domainStartBtn', missed: 'reviewBtn', flagged: 'flaggedReviewBtn' };
    var LEN = { weak: 'adaptiveLength', domain: 'domainLength' };
    function mode(){ var r = form.querySelector('input[name="nrMode"]:checked'); return r ? r.value : 'weak'; }
    function n(id){ var el = $(id); return el ? parseInt(String(el.textContent).replace(/\D/g, ''), 10) || 0 : 0; }
    function setStep(name, on, num){
      var el = form.querySelector('[data-nr-step="' + name + '"]');
      if(!el) return;
      el.hidden = !on;
      var k = el.querySelector('.cx-step-n'); if(k && num) k.textContent = num;
    }
    /* The length pills follow the engine's (possibly capped) select. */
    function paintCounts(m){
      var sel = $(LEN[m]), pills = $('nrCounts');
      if(!sel || !pills) return;
      var vals = [].map.call(sel.options, function(o){ return +o.value; });
      pills.innerHTML = vals.map(function(v){
        return '<label class="cx-pill"><input type="radio" name="nrCount" value="' + v + '"' + (+sel.value === v ? ' checked' : '') + '><span>' + v + '</span></label>';
      }).join('');
    }
    function sync(){
      var m = mode();
      // Empty queues stay visible but cannot be chosen, as in the other courses.
      [['missed', 'missedCount', 'Nothing missed. Nice.'], ['flagged', 'flaggedCount', 'Nothing flagged.']].forEach(function(x){
        var input = form.querySelector('input[value="' + x[0] + '"]');
        var empty = n(x[1]) === 0;
        input.disabled = empty;
        if(empty && input.checked){ form.querySelector('input[value="weak"]').checked = true; m = 'weak'; }
      });
      var queue = m === 'missed' || m === 'flagged';
      setStep('topic', m === 'domain');
      setStep('weak', m === 'weak');
      setStep('count', !queue, '3');
      Object.keys(BTN).forEach(function(k){ var b = $(BTN[k]); if(b) b.hidden = k !== m; });
      if(!queue) paintCounts(m);
      var sum = $('nrSum');
      if(sum){
        var len = LEN[m] && $(LEN[m]) ? $(LEN[m]).value : '';
        var dom = $('domainSelect');
        sum.textContent = m === 'weak' ? len + ' questions, weak spots'
          : m === 'domain' ? len + ' questions, ' + (dom ? dom.options[dom.selectedIndex].text : '')
          : m === 'missed' ? n('missedCount') + ' missed questions, until each is right'
          : n('flaggedCount') + ' flagged questions';
      }
    }
    form.addEventListener('change', function(e){
      var t = e.target;
      if(t.name === 'nrCount'){ var sel = $(LEN[mode()]); if(sel){ sel.value = t.value; } }
      sync();
    });
    // The engine repaints counts and caps the length selects whenever the
    // intro screen refreshes (sign-in, a pass, the allowance); follow it.
    ['missedCount', 'flaggedCount', 'adaptiveLength', 'domainLength'].forEach(function(id){
      var el = $(id); if(el && window.MutationObserver) new MutationObserver(sync).observe(el, { childList: true, characterData: true, subtree: true });
    });
    sync();
  }

  function boot(){
    builder();
    paintStats();
    var dueEl = document.querySelector('[data-due="all"]');
    if(dueEl && window.MutationObserver) new MutationObserver(paintStats).observe(dueEl, { childList: true, characterData: true, subtree: true });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
