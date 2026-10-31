/* AP® Precalculus free unit practice test (unit-tests/<unit>.html, written by
   scripts/lib/apprecalc-entry.mjs). The page carries its questions as static
   HTML, readable and printable without JavaScript; this swaps in the live
   versions from #pcalc-page-data, with feedback and an explanation for every
   option, and ends with a score and the way into practice. Answers are
   recorded like any question, so misses reach the review queue. */
(function(){
  var box = document.querySelector('.pcalc-qs[data-set="check"]');
  var el = document.getElementById('pcalc-page-data');
  if(!box || !el || !window.ApPrecalcQuestions) return;
  var data;
  try{ data = JSON.parse(el.textContent); }catch(e){ return; }
  var total = (data.check || []).length, answered = 0, right = 0;
  var base = window.ApPrecalcBase || '';
  window.ApPrecalcQuestions.hydrate(box, data.check, {
    onAnswer: function(res){
      answered++; if(res.correct) right++;
      if(answered !== total) return;
      if(window.ApPrecalcCore) window.ApPrecalcCore.event('apprecalc-session-finish', { mode: 'unit-sample', unit: data.unit, answered: total, correct: right });
      box.insertAdjacentHTML('afterend', '<div class="pcalc-pr-score pcalc-sample-done" role="status" tabindex="-1"><span class="pcalc-pr-score-big">' + right + '<small>/' + total + '</small></span>' +
        '<span><b>Sample test done.</b><span class="pcalc-small">Missed questions are in your <a href="' + base + 'review.html">review queue</a>. Next: <a href="' + base + 'practice.html?unit=' + data.unit + '">practice the whole unit</a>.</span></span></div>');
    }
  }, data.stimuli);
})();
