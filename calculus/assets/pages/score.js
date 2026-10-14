/* AP® Calculus AB score estimate (docs/apcalc-architecture.md, "Exams and entry
   pages"). One method, used by the score calculator page and checked against
   the practice exam's readiness band (pages/exams.js) by a test:

     composite = 50 × (multiple-choice correct ÷ 42) + 50 × (free-response points ÷ 54)

   Each section is half the exam score (docs/apcalc-research/framework.md,
   section 5): 42 four-option questions (29 without a calculator, 13 with),
   then 6 free-response questions of 9 points each. The bands (66, 49, 40
   and 23 out of 100) are ESTIMATES: the College Board publishes no cut-offs
   for the current calculus exam, so they are the composites that reproduce
   the published 2024-2026 score distributions under a model of the
   composite built from the 2024 and 2025 free-response statistics
   (docs/apcalc-needs-author.md, score-cutoffs, has the method). A test
   holds this file and the readiness band in pages/exams.js equal.

     ApCalcScore.composite(mcq, frq, opts)  { mcqPct, frqPct, composite, band, next }
     ApCalcScore.band(composite)            1-5
     ApCalcScore.mount(el)                  the calculator form, on score-calculator.html */
(function(){
  var MCQ = 42, FRQ = [9, 9, 9, 9, 9, 9];   // Part A (calculator) 2, Part B (no calculator) 4
  var FRQ_TOTAL = FRQ.reduce(function(a, b){ return a + b; }, 0);
  var CUTS = [66, 49, 40, 23];   // band 5, 4, 3, 2 from these composites up; below is 1

  function clamp(x, lo, hi){ x = Number(x); if(!isFinite(x)) x = 0; return Math.max(lo, Math.min(hi, x)); }
  function band(c){ return c >= CUTS[0] ? 5 : c >= CUTS[1] ? 4 : c >= CUTS[2] ? 3 : c >= CUTS[3] ? 2 : 1; }
  function round1(x){ return Math.round(x * 10) / 10; }

  /* mcq: questions right (0-42); frq: total points (0-54) or a list of the
     six question scores. What it takes to reach the next band is worked out
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
      return '<label class="calc-sc-q"><span>Q' + (i + 1) + ' <small>(' + (i < 2 ? 'Part A, calculator' : 'Part B, no calculator') + ', 0&ndash;' + p + ')</small></span><input type="number" inputmode="numeric" min="0" max="' + p + '" step="1" value="0" data-frq="' + i + '" aria-label="Free-response question ' + (i + 1) + ' points, 0 to ' + p + '"></label>';
    }).join('');
    el.innerHTML = '<form class="cx-card calc-sc-form" novalidate aria-label="Score calculator">' +
      '<fieldset class="calc-sc-part"><legend>Section I: multiple choice</legend>' +
        '<label class="calc-sc-mcq"><span>Questions right, out of 42</span><input type="number" inputmode="numeric" min="0" max="42" step="1" value="28" data-mcq></label>' +
        '<input type="range" min="0" max="42" step="1" value="28" data-mcq-range aria-label="Multiple-choice questions right, 0 to 42"></fieldset>' +
      '<fieldset class="calc-sc-part"><legend>Section II: free response (points)</legend><div class="calc-sc-frq">' + qs + '</div>' +
        '<p class="calc-small calc-sc-tot" aria-live="polite"></p></fieldset>' +
      '</form><section class="calc-sc-out" aria-live="polite" aria-atomic="true"></section>';
    var form = el.querySelector('form'), out = el.querySelector('.calc-sc-out');
    var num = form.querySelector('[data-mcq]'), range = form.querySelector('[data-mcq-range]');
    function read(){ return [].map.call(form.querySelectorAll('[data-frq]'), function(x){ return x.value === '' ? 0 : +x.value; }); }
    function paint(){
      var r = composite(num.value === '' ? 0 : +num.value, read());
      form.querySelector('.calc-sc-tot').textContent = 'Free-response total: ' + r.frq + ' of ' + FRQ_TOTAL + ' points.';
      var next = r.next ? '<p>To reach an estimated ' + r.next.band + ' (' + r.next.at + ' or more): ' +
        [r.next.mcq != null ? plural(r.next.mcq, 'more multiple-choice question') : '', r.next.frq != null ? plural(r.next.frq, 'more free-response point') : ''].filter(Boolean).join(', or ') + ', or a mix of the two.</p>' : '<p>That is in the top band of this estimate.</p>';
      out.innerHTML = '<div class="calc-pr-score"><span class="calc-pr-score-big">' + r.band + '<small>/5</small></span><span><b>Estimated score: ' + r.band + '</b><span class="calc-small">Composite ' + r.composite + ' of 100 &middot; multiple choice ' + r.mcqPct + '% &middot; free response ' + r.frqPct + '%</span></span></div>' +
        '<p class="calc-ex-band-warn"><b>An estimate, not a predicted score.</b> The cut-offs are ours; the real ones are set after each exam.</p>' + next;
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

  window.ApCalcScore = { MCQ: MCQ, FRQ: FRQ, FRQ_TOTAL: FRQ_TOTAL, CUTS: CUTS, band: band, composite: composite, mount: mount };
  if(typeof document !== 'undefined'){
    var go = function(){ var el = document.getElementById('calc-calc'); if(el) mount(el); };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }
})();
