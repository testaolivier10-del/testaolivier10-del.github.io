/* AP® Biology free unit practice test (unit-tests/<unit>.html, written by
   scripts/lib/apbio-entry.mjs). The page carries its questions as static
   HTML, readable and printable without JavaScript; this swaps in the live
   versions from #bio-page-data, with feedback and an explanation for every
   option, and ends with a score and the way into practice. Answers are
   recorded like any question, so misses reach the review queue. */
(function(){
  var box = document.querySelector('.bio-qs[data-set="check"]');
  var el = document.getElementById('bio-page-data');
  if(!box || !el || !window.ApBioQuestions) return;
  var data;
  try{ data = JSON.parse(el.textContent); }catch(e){ return; }
  var total = (data.check || []).length, answered = 0, right = 0;
  var base = window.ApBioBase || '';
  window.ApBioQuestions.hydrate(box, data.check, {
    onAnswer: function(res){
      answered++; if(res.correct) right++;
      if(answered !== total) return;
      if(window.ApBioCore) window.ApBioCore.event('apbio-session-finish', { mode: 'unit-sample', unit: data.unit, answered: total, correct: right });
      box.insertAdjacentHTML('afterend', '<div class="bio-pr-score bio-sample-done" role="status" tabindex="-1"><span class="bio-pr-score-big">' + right + '<small>/' + total + '</small></span>' +
        '<span><b>Sample test done.</b><span class="bio-small">Missed questions are in your <a href="' + base + 'review.html">review queue</a>. Next: <a href="' + base + 'practice.html?unit=' + data.unit + '">practice the whole unit</a>.</span></span></div>');
    }
  }, data.stimuli);
})();
