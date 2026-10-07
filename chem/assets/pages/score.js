/* AP® Chemistry score estimate (docs/apchem-architecture.md, "Exams and entry
   pages"). One method, used by the score calculator page and checked against
   the practice exam's readiness band (pages/exams.js) by a test:

     composite = 50 × (multiple-choice correct ÷ 60) + 50 × (free-response points ÷ 46)

   Each section is half the exam score (docs/apchem-research/framework.md,
   section 2): 60 four-option questions, then 7 free-response questions worth
   3 × 10 + 4 × 4 = 46 points. The bands below are the practice exam's
   (72, 58, 42 and 27 out of 100): the cut-offs reported for the 2014 exam (the first in the current
   format, also scored 50/50 out of 100) and used by the common third-party
   calculators; an estimate, not this year's scale,
   which is set after each exam and not published.

     ApChemScore.composite(mcq, frq, opts)  { mcqPct, frqPct, composite, band, next }
     ApChemScore.band(composite)            1-5
     ApChemScore.mount(el)                  the calculator form, on score-calculator.html */
(function(){
  var MCQ = 60, FRQ = [10, 10, 10, 4, 4, 4, 4];
  var FRQ_TOTAL = FRQ.reduce(function(a, b){ return a + b; }, 0);
  var CUTS = [72, 58, 42, 27];   // band 5, 4, 3, 2 from these composites up; below is 1

  function clamp(x, lo, hi){ x = Number(x); if(!isFinite(x)) x = 0; return Math.max(lo, Math.min(hi, x)); }
  function band(c){ return c >= CUTS[0] ? 5 : c >= CUTS[1] ? 4 : c >= CUTS[2] ? 3 : c >= CUTS[3] ? 2 : 1; }
  function round1(x){ return Math.round(x * 10) / 10; }

  /* mcq: questions right (0-60); frq: total points (0-46) or a list of the
     seven question scores. What it takes to reach the next band is worked out
     each way: more multiple-choice questions alone, or more points alone. */
  function composite(mcq, frq){
    var m = Math.round(clamp(mcq, 0, MCQ));
    var f = Array.isArray(frq) ? frq.reduce(function(s, v, i){ return s + clamp(v, 0, FRQ[i] || 0); }, 0) : clamp(frq, 0, FRQ_TOTAL);
    var c = 50 * m / MCQ + 50 * f / FRQ_TOTAL;
    var b = band(c), next = null;
    if(b < 5){
      var target = CUTS[4 - b];
      var needMcq = Math.ceil((target - c) * MCQ / 50 - 1e-9), needFrq = Math.ceil((target - c) * FRQ_TOTAL / 50 - 1e-9);
      next = { band: b + 1, at: target, mcq: m + needMcq <= MCQ ? needMcq : null, frq: f + needFrq <= FRQ_TOTAL ? needFrq : null };
    }
    return { mcq: m, frq: f, mcqPct: round1(100 * m / MCQ), frqPct: round1(100 * f / FRQ_TOTAL), composite: round1(c), band: b, next: next };
  }

  /* ------------------------------------------------------- the page */
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function mount(el){
    if(!el) return;
    var qs = FRQ.map(function(p, i){
      return '<label class="chem-sc-q"><span>Q' + (i + 1) + ' <small>(' + (i < 3 ? 'long' : 'short') + ', 0&ndash;' + p + ')</small></span><input type="number" inputmode="numeric" min="0" max="' + p + '" step="1" value="0" data-frq="' + i + '" aria-label="Free-response question ' + (i + 1) + ' points, 0 to ' + p + '"></label>';
    }).join('');
    el.innerHTML = '<form class="cx-card chem-sc-form" novalidate aria-label="Score calculator">' +
      '<fieldset class="chem-sc-part"><legend>Section I: multiple choice</legend>' +
        '<label class="chem-sc-mcq"><span>Questions right, out of 60</span><input type="number" inputmode="numeric" min="0" max="60" step="1" value="40" data-mcq></label>' +
        '<input type="range" min="0" max="60" step="1" value="40" data-mcq-range aria-label="Multiple-choice questions right, 0 to 60"></fieldset>' +
      '<fieldset class="chem-sc-part"><legend>Section II: free response (points)</legend><div class="chem-sc-frq">' + qs + '</div>' +
        '<p class="chem-small chem-sc-tot" aria-live="polite"></p></fieldset>' +
      '</form><section class="chem-sc-out" aria-live="polite" aria-atomic="true"></section>';
    var form = el.querySelector('form'), out = el.querySelector('.chem-sc-out');
    var num = form.querySelector('[data-mcq]'), range = form.querySelector('[data-mcq-range]');
    function read(){ return [].map.call(form.querySelectorAll('[data-frq]'), function(x){ return x.value === '' ? 0 : +x.value; }); }
    function paint(){
      var r = composite(num.value === '' ? 0 : +num.value, read());
      form.querySelector('.chem-sc-tot').textContent = 'Free-response total: ' + r.frq + ' of ' + FRQ_TOTAL + ' points.';
      var next = r.next ? '<p>To reach an estimated ' + r.next.band + ' (' + r.next.at + ' or more): ' +
        [r.next.mcq != null ? plural(r.next.mcq, 'more multiple-choice question') : '', r.next.frq != null ? plural(r.next.frq, 'more free-response point') : ''].filter(Boolean).join(', or ') + ', or a mix of the two.</p>' : '<p>That is in the top band of this estimate.</p>';
      out.innerHTML = '<div class="chem-pr-score"><span class="chem-pr-score-big">' + r.band + '<small>/5</small></span><span><b>Estimated score: ' + r.band + '</b><span class="chem-small">Composite ' + r.composite + ' of 100 &middot; multiple choice ' + r.mcqPct + '% &middot; free response ' + r.frqPct + '%</span></span></div>' +
        '<p class="chem-ex-band-warn"><b>An estimate, not a predicted score.</b> The cut-offs are ours; the real ones are set after each exam.</p>' + next;
    }
    form.addEventListener('input', function(e){
      if(e.target === range) num.value = range.value;
      if(e.target === num && num.value !== '') range.value = clamp(num.value, 0, MCQ);
      paint();
    });
    // Out-of-range typing is pulled back in when the field is left.
    form.addEventListener('change', function(e){
      var t = e.target; if(t.type !== 'number') return;
      t.value = String(Math.round(clamp(t.value, 0, +t.max)));
      if(t === num) range.value = t.value;
      paint();
    });
    form.addEventListener('submit', function(e){ e.preventDefault(); });
    paint();
  }

  window.ApChemScore = { MCQ: MCQ, FRQ: FRQ, FRQ_TOTAL: FRQ_TOTAL, CUTS: CUTS, band: band, composite: composite, mount: mount };
  if(typeof document !== 'undefined'){
    var go = function(){ var el = document.getElementById('chem-calc'); if(el) mount(el); };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }
})();
