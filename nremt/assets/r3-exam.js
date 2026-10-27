/* Site redesign round 3, step B3 (docs/site-redesign.md, boards R10-Exam-Live and R10-Exam-Results):
   the timed exam page's two other states, on top of what practice-engine.js renders.
   - While the exam runs, the site's top bar and course tabs give way to the slim exam bar
     (.r3-focusbar in exams.html, shown by r3-inner.css); its buttons press the engine's own Exit and
     Submit buttons.
   - When the results show, a short cover band with the score goes above them, its buttons press the
     engine's own Review your misses, Back to Start and Print, and the domain breakdown moves out of the
     score card into a card of its own beside it. The engine keeps filling every element by its id. */
(function(){
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-r3-click]');
    if(!b) return;
    var t = document.querySelector(b.getAttribute('data-r3-click'));
    if(t){ e.preventDefault(); t.click(); }
  });

  function ready(){
    var res = document.getElementById('resultsScreen');
    if(!res) return false;
    var band = document.createElement('section');
    band.className = 'band short r3-results-band';
    band.setAttribute('aria-labelledby', 'r3ResTitle');
    band.hidden = true;
    band.innerHTML = '<div class="hwrap"><div>' +
      '<nav class="r3-crumb" aria-label="Breadcrumb"><a href="../index.html">LevlPrep</a> <span aria-hidden="true">&rsaquo;</span> <a href="index.html">NREMT-EMT Prep</a> <span aria-hidden="true">&rsaquo;</span> <a href="exams.html">Exams</a> <span aria-hidden="true">&rsaquo;</span> <span aria-current="page">Results</span></nav>' +
      '<p class="issue">NREMT-EMT &middot; Timed exam &middot; Results <i></i></p>' +
      '<h1 class="deck" id="r3ResTitle" tabindex="-1"><span class="r3-res-score"></span> <span>Here is where.</span></h1>' +
      '<p class="hand">every question, with its explanation</p>' +
      '<p class="lede">Scored by domain in the order the exam outline lists them, with the topic areas each domain&rsquo;s questions came from.</p>' +
      '<div class="hero-ctas"><button type="button" class="btn-chan" data-r3-click="#reviewMissesBtn">Review your misses</button><button type="button" class="btn-ghost" data-r3-click="#retryBtnTop">Back to Start</button><button type="button" class="btn-ghost" data-r3-click="#printResultBtn">Print or save as PDF</button></div>' +
      '</div><div class="art" aria-hidden="true"><img src="../assets/covers/art/nremt.svg" alt="" width="640" height="400" decoding="async"></div></div>';
    res.parentNode.insertBefore(band, res);

    var dom = document.getElementById('domainBreakdown');
    if(dom && !document.getElementById('r3DomCard')){
      var card = document.createElement('section');
      card.className = 'r3-domcard';
      card.id = 'r3DomCard';
      card.setAttribute('aria-labelledby', 'r3DomH');
      card.innerHTML = '<h2 class="r3-h2" id="r3DomH">By <span>exam domain</span></h2><p class="sub">Your score in each of the five domains, and the topic areas under it.</p>';
      card.appendChild(dom);
      res.insertBefore(card, res.firstChild);
    }

    var main = res.querySelector('.results-main'), filters = main && main.querySelector('.filter-row');
    if(filters && !document.getElementById('r3EveryH')){
      var h = document.createElement('div');
      h.className = 'ruled-h';
      h.innerHTML = '<h2 id="r3EveryH">Every <span>question</span></h2><p>Your answer, the right one, and why.</p>';
      main.insertBefore(h, filters);
    }

    function sync(){
      var on = res.style.display && res.style.display !== 'none';
      band.hidden = !on;
      if(!on) return;
      var big = (document.getElementById('scoreBig') || {}).textContent || '';
      var m = big.match(/(\d+)\s*\/\s*(\d+)/);
      band.querySelector('.r3-res-score').textContent = m ? m[1] + ' of ' + m[2] + '.' : big;
      var rev = document.getElementById('reviewMissesBtn');
      var first = band.querySelector('[data-r3-click="#reviewMissesBtn"]');
      first.hidden = !rev;
      if(rev) first.textContent = rev.textContent;
    }
    new MutationObserver(sync).observe(res, { attributes: true, attributeFilter: ['style'], subtree: false });
    new MutationObserver(sync).observe(document.getElementById('scoreBig') || res, { childList: true, characterData: true, subtree: true });
    sync();
    return true;
  }
  if(!ready()) document.addEventListener('DOMContentLoaded', function(){ setTimeout(ready, 0); });
})();
