/* Stats lab trainer page (docs/appsych-spec.md section 6). OWNED BY THIS
   TOOL ONLY (builder T3). Mounts into #app with ApPsychTools.mount; the model
   is ApPsychMath.statsLab (psychology/assets/tools/math/stats-lab.js), the
   content psychology/data/tools/stats-lab.json (served filtered as
   assets/tool-data/stats-lab.json). The frame is ApPsychTools.modes
   (Explore, then Test yourself) on the Tool Studio.

   Explore: one stage, three scenes (the Scene switch), each drawn at the
   stage's real pixel size so text stays crisp at 360 px and at 1440 px:
     Normal curve  the curve with its 68-95-99.7 bands (34%, 13.5%, 2.35%,
                   0.15% each side), ticks at the mean and every SD with the
                   raw score and z under each, and a score you drag along the
                   axis (or step with the arrow keys): everything below it is
                   shaded and the bubble gives its z and percentile rank.
                   At a whole SD the rule's exact percent is shown; between
                   marks, the normal CDF (both from ApPsychStats).
     Center        a dot plot of a small data set on a balance beam: the mean
                   is the fulcrum, the median a dashed line, the range a
                   bracket. Drag one value far away: the mean chases it, the
                   median barely moves, and the shape is named (skew).
     Correlation   a scatterplot you set by its correlation: r from −1 to 1,
                   the points recomputed (seeded) and r recomputed from the
                   very points drawn; optional line of best fit; the
                   strength and direction in words, and why it is not cause.
   Colors by role, the same in every scene and in the drills: the course
   cerulean for the score, the shaded share and the mean; vermillion for the
   median and the line of best fit. Every value is also written, so color is
   never the only cue. Reduced motion: no point tweening.
   Test yourself: ApPsychTools.drill over the model's generate(), with stage
   figures from ApPsychPlot (normal, histogram, scatter) drawn from the
   problem's own numbers; band shares appear once that step is answered. */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath, P = window.ApPsychPlot;
  if(!T || !M || !M.statsLab || M.statsLab.stub) return;
  var SL = M.statsLab, S = M.Stats(), esc = T.esc;
  var VIEWS = [{ v: 'curve', label: 'Curve' }, { v: 'center', label: 'Center' }, { v: 'corr', label: 'Correlation' }];
  var NS = 'http://www.w3.org/2000/svg';
  function mi(s){ return String(s).replace(/-/g, '−'); }
  function n2(x){ return mi(String(M.round(x, 2))); }
  function f1(x){ return mi(M.fixed(x, 1)); }
  function zTxt(z){ var v = M.round(z, 2); return (v > 0 ? '+' : '') + mi(String(v)); }
  function ord(n){ return SL.ord(n); }
  function pctTxt(p){ return p < 1 ? (p < 0.1 ? 'under 0.1' : n2(p)) : p > 99 ? (p > 99.9 ? 'over 99.9' : n2(p)) : String(Math.round(p)); }
  function reduced(){ return T.reduced(); }
  var MEAS = null;
  function tw(t, size, weight){
    try{
      if(!MEAS) MEAS = document.createElement('canvas').getContext('2d');
      MEAS.font = (weight || 800) + ' ' + size + 'px ' + ((getComputedStyle(document.body).getPropertyValue('--font-ui') || '').trim() || 'sans-serif');
      return MEAS.measureText(String(t)).width;
    }catch(e){ return String(t).length * size * 0.58; }
  }
  function txt(x, y, s, cls, anchor){ return '<text class="' + cls + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (anchor || 'middle') + '">' + esc(s) + '</text>'; }
  function clampX(x, w, L, R){ return Math.max(L + w / 2, Math.min(R - w / 2, x)); }
  function niceStep(span, n){ var raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }

  /* Room kept clear at the stage's foot on a phone for the Enlarge button (bottom right, about 48 px). */
  var ENL = 46;
  T.mount('stats-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'stats-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var view = 'curve', sc = 0, x = 115, set = 0, moved = null, pair = 0, rT = 0.6, seed = 7, showLine = true;
    var LS = null, touched = false, nid = T.nid('sl'), pts = null, shownPts = null, tween = null;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem sl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Stats lab</h2>' +
      '<div class="sl-fig"><svg class="sl-svg" xmlns="http://www.w3.org/2000/svg" role="group" aria-roledescription="interactive figure"><g class="sl-art"></g>' +
        '<g class="sl-handle" tabindex="0" role="slider"><circle class="sl-halo" r="22"/><circle class="sl-knob" r="10"/><path class="sl-grip" d="M-3 -4V4M3 -4V4"/></g></svg></div>' +
      '<div class="sl-ctl">' +
        '<div class="ls-seg sl-views" role="group" aria-label="Scene">' + VIEWS.map(function(v){ return '<button type="button" data-v="' + v.v + '" aria-pressed="false">' + v.label + '</button>'; }).join('') + '</div>' +
        '<div class="sl-grp sl-grp-curve"><div class="sl-marks" role="group" aria-label="Jump to a whole standard deviation"></div></div>' +
        '<div class="sl-grp sl-grp-center"></div>' +
        '<div class="sl-grp sl-grp-corr"></div>' +
      '</div>' +
      '<div class="sl-say"></div>' +
      T.moreHtml('<div class="sl-o sl-o-curve"></div><div class="sl-o sl-o-center"></div><div class="sl-o sl-o-corr"></div>', 'test, data set, variables') +
      '<div class="sl-nums"></div><p class="sr-only sl-live"></p></section>';
    var say = T.announcer($('.sl-live'));
    var cue = T.cue('Drag the score along the curve and watch its percentile rank.');
    $('.sl-ctl').insertBefore(cue.el, $('.sl-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var svg = $('.sl-svg'), art = svg.querySelector('.sl-art'), handle = svg.querySelector('.sl-handle');
    function SC(){ var b = SL.SCALES[sc]; return b; }

    // Normal curve controls
    var sX = T.slider({ label: 'Score', min: SC().min, max: SC().max, step: 1, value: x, onInput: function(v){ act(); x = v; redraw(); say(curveLine()); } });
    $('.sl-grp-curve').insertBefore(sX.el, $('.sl-marks'));
    function marks(){
      var b = SC();
      $('.sl-marks').innerHTML = '<span class="sl-mk-l" aria-hidden="true">Jump to z</span>' + [-3, -2, -1, 0, 1, 2, 3].map(function(k){ return '<button type="button" class="sl-mk" data-k="' + k + '" aria-label="' + (k === 0 ? 'The mean, ' + b.mean : Math.abs(k) + ' SD ' + (k > 0 ? 'above' : 'below') + ' the mean, ' + (b.mean + k * b.sd)) + '">' + (k === 0 ? '0' : (k > 0 ? '+' : '−') + Math.abs(k)) + '</button>'; }).join('');
    }
    marks();
    var selScale = T.choiceSelect({ label: 'Test', value: '0', options: SL.SCALES.map(function(b, i){ return { value: String(i), label: b.name + ' (mean ' + b.mean + ', SD ' + b.sd + ')' }; }), onChange: function(v){
      act(); sc = +v; var b = SC(); x = b.mean + b.sd; sX.input.min = b.min; sX.input.max = b.max; sX.set(x); marks(); redraw(); say(curveLine()); } });
    $('.sl-o-curve').appendChild(selScale.el);

    // Center controls
    function SET(){ return SL.SETS[set]; }
    function values(){ var v = SET().values.slice(); var i = moverIdx(); v[i] = moved; return v; }
    function moverIdx(){ var s = SET(); return s.move < 0 ? 0 : s.values.length - 1; }
    function resetMoved(){ moved = SET().values[moverIdx()]; }
    resetMoved();
    var sM = T.slider({ label: 'Move one value', min: SET().lo, max: SET().hi, step: 1, value: moved, onInput: function(v){ act(); moved = v; redraw(); say(centerLine()); } });
    $('.sl-grp-center').appendChild(sM.el);
    var resetBtn = document.createElement('button'); resetBtn.type = 'button'; resetBtn.className = 'bt-btn sl-reset'; resetBtn.textContent = 'Put it back';
    $('.sl-grp-center').appendChild(resetBtn);
    resetBtn.addEventListener('click', function(){ act(); resetMoved(); sM.set(moved); redraw(); say(centerLine()); });
    var selSet = T.choiceSelect({ label: 'Data set', value: '0', options: SL.SETS.map(function(s, i){ return { value: String(i), label: s.name }; }), onChange: function(v){
      act(); set = +v; resetMoved(); sM.input.min = SET().lo; sM.input.max = SET().hi; sM.set(moved); redraw(); say(centerLine()); } });
    $('.sl-o-center').appendChild(selSet.el);

    // Correlation controls
    var sR = T.slider({ label: 'Correlation you aim for', min: -1, max: 1, step: 0.1, value: rT, decimals: 1, onInput: function(v){ act(); rT = M.round(v, 1); newPoints(true); say(corrLine()); } });
    $('.sl-grp-corr').appendChild(sR.el);
    var againBtn = document.createElement('button'); againBtn.type = 'button'; againBtn.className = 'bt-btn sl-again'; againBtn.textContent = 'New sample';
    $('.sl-grp-corr').appendChild(againBtn);
    againBtn.addEventListener('click', function(){ act(); seed = 1 + Math.floor(Math.random() * 99998); newPoints(false); say(corrLine()); });
    var selPair = T.choiceSelect({ label: 'Variables', value: '0', options: SL.PAIRS.map(function(p, i){ return { value: String(i), label: p.x + ' and ' + p.y.toLowerCase() }; }), onChange: function(v){ act(); pair = +v; newPoints(false); say(corrLine()); } });
    $('.sl-o-corr').appendChild(selPair.el);
    $('.sl-o-corr').insertAdjacentHTML('beforeend', '<label class="bt-radio sl-opt"><input type="checkbox" class="sl-line" checked> Show the line of best fit</label>');
    $('.sl-line').addEventListener('change', function(e){ showLine = e.target.checked; redraw(); });

    function onClick(e){
      var b = e.target.closest('.sl-views button');
      if(b){ setView(b.getAttribute('data-v')); return; }
      var mk = e.target.closest('.sl-mk');
      if(mk){ act(); var bb = SC(); x = bb.mean + (+mk.getAttribute('data-k')) * bb.sd; sX.set(x); redraw(); say(curveLine()); }
    }
    host.addEventListener('click', onClick);
    function setView(v){
      if(v === view) return;
      act(); view = v; syncView(); redraw();
      say({ curve: 'Normal curve. ', center: 'Center and spread. ', corr: 'Correlation. ' }[v] + line());
    }
    function syncView(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.sl-views button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === view)); });
      ['curve', 'center', 'corr'].forEach(function(k){ var g = $('.sl-grp-' + k), o = $('.sl-o-' + k); if(g) g.hidden = k !== view; if(o) o.hidden = k !== view; });
      if(LS && LS.setupRow) LS.setupRow.setup(view === 'curve' ? SC().name : view === 'center' ? SET().name : SL.PAIRS[pair].x);
    }

    /* --------------------------- the drag: on the curve or the dot plot */
    var dragging = false;
    function px2val(e){
      var rc = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, sx = vb && vb.width ? vb.width / rc.width : 1;
      return (e.clientX - rc.left) * sx;
    }
    var geo = null;   // the scene's x mapping: { inv(px), lo, hi, step }
    function dragTo(e){
      if(!geo) return;
      var v = Math.round(geo.inv(px2val(e)) / geo.step) * geo.step;
      v = Math.max(geo.lo, Math.min(geo.hi, v));
      if(view === 'curve'){ if(v === x) return; x = v; sX.set(x); }
      else if(view === 'center'){ if(v === moved) return; moved = v; sM.set(moved); }
      redraw();
    }
    svg.addEventListener('pointerdown', function(e){
      if(view === 'corr' || !geo) return;
      act(); dragging = true; try{ svg.setPointerCapture(e.pointerId); }catch(err){}
      handle.classList.add('is-drag'); dragTo(e); e.preventDefault();
    });
    svg.addEventListener('pointermove', function(e){ if(dragging) dragTo(e); });
    function up(){ if(!dragging) return; dragging = false; handle.classList.remove('is-drag'); say(line()); }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    handle.addEventListener('keydown', function(e){
      var k = e.key, d = 0, big = e.shiftKey ? 10 : 1;
      if(k === 'ArrowRight' || k === 'ArrowUp') d = 1; else if(k === 'ArrowLeft' || k === 'ArrowDown') d = -1;
      else if(k === 'PageUp') d = 10; else if(k === 'PageDown') d = -10;
      else if(k === 'Home' || k === 'End'){ e.preventDefault(); act(); if(view === 'curve'){ x = k === 'Home' ? SC().min : SC().max; sX.set(x); } else { moved = k === 'Home' ? SET().lo : SET().hi; sM.set(moved); } redraw(); say(line()); return; }
      else return;
      e.preventDefault(); act();
      if(view === 'curve'){ x = Math.max(SC().min, Math.min(SC().max, x + d * big)); sX.set(x); }
      else { moved = Math.max(SET().lo, Math.min(SET().hi, moved + d * big)); sM.set(moved); }
      redraw(); say(line());
    });

    /* ------------------------------------------------ numbers and words */
    function cur(){ var b = SC(); return SL.normalAt(x, b.mean, b.sd); }
    function curveLine(){
      var b = SC(), n = cur();
      return 'Score ' + x + ': z = ' + zTxt(n.z) + '. ' + (n.whole ? 'By the 68-95-99.7 rule, ' + n2(n.rule) + '% score lower' : 'About ' + pctTxt(n.pct) + '% score lower') + ' (the ' + ord(Math.max(1, Math.min(99, Math.round(n.whole ? n.rule : n.pct)))) + ' percentile).';
    }
    function cst(){ return SL.center(values()); }
    function shape(c){ var d = c.mean - c.median, s = c.sd || 1; return Math.abs(d) < 0.15 * s ? 'roughly symmetric' : d > 0 ? 'positively skewed (tail to the right)' : 'negatively skewed (tail to the left)'; }
    function centerLine(){ var c = cst(); return 'Mean ' + f1(c.mean) + ', median ' + f1(c.median) + ', range ' + c.range + '. The data are ' + shape(c) + '.'; }
    function rNow(){ return S.r(pts); }
    function corrLine(){ var r = rNow(); return 'r = ' + n2(r) + ': ' + S.describe(r) + '.'; }
    function line(){ return view === 'curve' ? curveLine() : view === 'center' ? centerLine() : corrLine(); }

    function words(){
      var head, sub = '', why = '';
      if(view === 'curve'){
        var b = SC(), n = cur(), p = n.whole ? n.rule : n.pct, k = Math.round(n.z);
        head = x + ' is ' + (Math.abs(n.z) < 1e-9 ? 'the mean' : n2(Math.abs(n.z)) + ' SD ' + (n.z > 0 ? 'above' : 'below') + ' the mean') + ': about ' + pctTxt(p) + '% of scores are lower.';
        sub = n.whole ? 'At a whole SD, add the bands: ' + SL.ruleSum(k) + ' = ' + n2(n.rule) + '%.' : 'Between whole SDs the exam does not ask for the exact share; the lab shows it from the curve.';
        why = '<p><b>z score.</b> z = (score − mean) ÷ SD = (' + x + ' − ' + b.mean + ') ÷ ' + b.sd + ' = ' + zTxt(n.z) + '. It counts standard deviations from the mean, so scores on different tests can be compared.</p>' +
          '<p><b>Percentile rank.</b> The percent of scores below this one. It is not the percent of questions answered correctly.</p>' +
          '<p><b>The 68-95-99.7 rule.</b> In a normal distribution about 68% of scores fall within 1 SD of the mean, 95% within 2 SD and 99.7% within 3 SD. Band by band from the mean: 34%, 13.5%, 2.35%, 0.15% on each side.</p>' +
          '<p><b>Do not mix up.</b> Within 1 SD is 68% (both sides). Below +1 SD is 50% + 34% = 84%. Above +1 SD is 16%.</p>';
      } else if(view === 'center'){
        var c = cst(), s0 = SL.center(SET().values), dm = c.mean - s0.mean, dd = c.median - s0.median;
        head = 'Mean ' + f1(c.mean) + ', median ' + f1(c.median) + '.';
        sub = Math.abs(dm) < 1e-9 ? 'Drag the ' + (SET().move < 0 ? 'lowest' : 'highest') + ' value far away and watch which one moves.' : 'The mean moved ' + f1(Math.abs(dm)) + ', the median ' + f1(Math.abs(dd)) + '. The data are ' + shape(c) + '.';
        why = '<p><b>Mean.</b> The sum divided by how many: ' + c.sum + ' ÷ ' + c.n + ' = ' + f1(c.mean) + '. It is the balance point of the dots, so one far value pulls it.</p>' +
          '<p><b>Median.</b> The middle value once the values are in order. It only cares about order, so an outlier barely moves it. With an outlier or a skew, the median is the better typical value.</p>' +
          '<p><b>Mode and range.</b> The mode is the most frequent value (' + c.modes.join(' and ') + '). The range is highest minus lowest (' + c.max + ' − ' + c.min + ' = ' + c.range + '), so one outlier stretches it.</p>' +
          '<p><b>Skew.</b> A skew is named for its tail. A few very high values make a positive skew (mean above the median); a few very low values, a negative skew (mean below the median).</p>';
      } else {
        var r = rNow(), pr = SL.PAIRS[pair];
        head = 'r = ' + n2(r) + ': ' + S.describe(r) + '.';
        sub = Math.abs(r) < 0.1 ? 'No line fits: knowing one variable tells you little about the other.' : 'As ' + pr.x.replace(/ \(.*\)/, '').toLowerCase() + ' goes up, ' + pr.y.toLowerCase() + ' tends to go ' + (r > 0 ? 'up' : 'down') + '.';
        why = '<p><b>Direction.</b> The sign: positive when the points rise to the right, negative when they fall.</p>' +
          '<p><b>Strength.</b> The size of r, from 0 (no linear pattern) to 1 (a perfect line). −0.9 is stronger than +0.6. The words strong (|r| of .7 or more), moderate (.4 to .7) and weak (.1 to .4) are a rule of thumb.</p>' +
          '<p><b>Not cause.</b> A correlation shows that two variables vary together. A third variable could drive both, or the direction could run the other way. Only an experiment with random assignment can show cause.</p>' +
          '<p><b>The aim and the result.</b> The slider sets the correlation you aim for; a real sample never matches it exactly. The r shown is always computed from the points drawn.</p>';
      }
      T.explain($('.sl-say'), '<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), why);
      nums();
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), 'explore');
        if(view === 'curve'){
          var nn = cur();
          LS.pills([{ k: 'z', html: zTxt(nn.z), tone: 'readout' }], 'left', 'explore');
          LS.pills([{ k: 'Percentile', html: ord(Math.max(1, Math.min(99, Math.round(nn.whole ? nn.rule : nn.pct)))), tone: 'accent' }], 'right', 'explore');
        } else if(view === 'center'){
          var cc = cst();
          LS.pills([{ k: 'Mean', html: f1(cc.mean), tone: 'accent' }], 'left', 'explore');
          LS.pills([{ k: 'Median', html: f1(cc.median), tone: 'readout' }], 'right', 'explore');
        } else {
          var rr = rNow();
          LS.pills([{ k: 'r', html: n2(rr), tone: 'accent' }], 'left', 'explore');
          LS.pills([{ k: 'Strength', html: S.strength(rr) === 'none' ? 'none' : S.strength(rr), tone: 'readout' }], 'right', 'explore');
        }
      }
    }
    function nums(){
      var h = '';
      if(view === 'curve'){
        var b = SC(), n = cur();
        h = T.dataTable(['', 'Value'], [['Score', String(x)], ['Mean', String(b.mean)], ['Standard deviation', String(b.sd)], ['z score', zTxt(n.z)],
          ['Percent below (normal curve)', n2(n.pct) + '%'], ['Percent below (68-95-99.7 rule)', n.whole ? n2(n.rule) + '%' : 'only at a whole SD']], 'The score on the curve');
      } else if(view === 'center'){
        var c = cst(), v = values().slice().sort(function(a, bb){ return a - bb; });
        h = T.dataTable(['', 'Value'], [['Values in order', v.join(', ')], ['Count', String(c.n)], ['Sum', String(c.sum)], ['Mean', f1(c.mean)], ['Median', f1(c.median)], ['Mode', c.modes.join(', ')], ['Range', String(c.range)], ['Standard deviation', f1(c.sd)]], SET().name);
      } else {
        var r = rNow(), pr = SL.PAIRS[pair];
        h = T.dataTable(['', 'Value'], [['Points', String(pts.length)], ['Correlation you aimed for', n2(rT)], ['r of these points', n2(r)], ['In words', S.describe(r)]], pr.x + ' and ' + pr.y.toLowerCase()) +
          T.dataTable([esc(pr.x), esc(pr.y)], pts.map(function(q){ return [String(q[0]), String(q[1])]; }), 'Every point');
      }
      $('.sl-nums').innerHTML = h;
    }

    /* ------------------------------------------------------- drawing */
    function size(){ var rc = $('.sl-fig').getBoundingClientRect(); return [Math.max(300, Math.min(1600, Math.round(rc.width) || 640)), Math.max(300, Math.min(1000, Math.round(rc.height) || 460))]; }
    function redraw(){
      // Drawn in a box at most 760 units wide, so on a large screen the whole
      // scene (text included) scales up instead of floating small.
      var wh = size(), k = Math.max(1, wh[0] / 760), W = Math.round(wh[0] / k), H = Math.round(wh[1] / k);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', wh[0]); svg.setAttribute('height', wh[1]);
      var out = view === 'curve' ? curveScene(W, H) : view === 'center' ? centerScene(W, H) : corrScene(W, H);
      art.innerHTML = out.svg;
      svg.setAttribute('aria-label', out.label);
      handle.style.display = out.handle ? '' : 'none';
      if(out.handle){
        handle.setAttribute('transform', 'translate(' + out.handle.x.toFixed(1) + ' ' + out.handle.y.toFixed(1) + ')');
        handle.setAttribute('aria-label', out.handle.label);
        handle.setAttribute('aria-valuemin', out.handle.min); handle.setAttribute('aria-valuemax', out.handle.max);
        handle.setAttribute('aria-valuenow', out.handle.now); handle.setAttribute('aria-valuetext', out.handle.text);
      } else handle.removeAttribute('aria-valuenow');
      handle.setAttribute('tabindex', out.handle ? '0' : '-1');
      words();
    }

    function curveScene(W, H){
      // Side margins keep the +3 label clear of the Enlarge button (bottom right).
      var b = SC(), phone = W < 560, L = phone ? 44 : 56, R = W - (phone ? 44 : 56), base = H - (phone ? 62 + ENL : 70), top = phone ? 64 : 72;
      var lo = b.mean - 3.5 * b.sd, hi = b.mean + 3.5 * b.sd;
      var sx = function(v){ return L + (v - lo) / (hi - lo) * (R - L); }, peak = SL.pdf(b.mean, b.mean, b.sd), sy = function(d){ return base - d / peak * (base - top); };
      geo = { inv: function(px){ return lo + (px - L) / (R - L) * (hi - lo); }, lo: b.min, hi: b.max, step: 1 };
      var g = [], n = cur();
      function area(a, c){ var pts = [], k = 80; for(var i = 0; i <= k; i++){ var v = a + (c - a) * i / k; pts.push(sx(v).toFixed(1) + ',' + sy(SL.pdf(v, b.mean, b.sd)).toFixed(1)); } return 'M' + sx(a).toFixed(1) + ',' + base + ' L' + pts.join(' L') + ' L' + sx(c).toFixed(1) + ',' + base + ' Z'; }
      // the bands, darker toward the middle
      [[-3.5, -3, 4], [-3, -2, 3], [-2, -1, 2], [-1, 0, 1], [0, 1, 1], [1, 2, 2], [2, 3, 3], [3, 3.5, 4]].forEach(function(q){
        g.push('<path class="sl-band b' + q[2] + '" d="' + area(b.mean + q[0] * b.sd, b.mean + q[1] * b.sd) + '"/>');
      });
      // the share below the score
      var xs = Math.max(lo, Math.min(hi, x));
      g.push('<path class="sl-below" d="' + area(lo, xs) + '"/>');
      // SD lines
      [-3, -2, -1, 1, 2, 3].forEach(function(k){ var v = b.mean + k * b.sd; g.push('<line class="sl-sdl" x1="' + sx(v).toFixed(1) + '" x2="' + sx(v).toFixed(1) + '" y1="' + base + '" y2="' + sy(SL.pdf(v, b.mean, b.sd)).toFixed(1) + '"/>'); });
      g.push('<line class="sl-meanl" x1="' + sx(b.mean).toFixed(1) + '" x2="' + sx(b.mean).toFixed(1) + '" y1="' + base + '" y2="' + top + '"/>');
      // the curve
      var cp = []; for(var i = 0; i <= 240; i++){ var v = lo + (hi - lo) * i / 240; cp.push(sx(v).toFixed(1) + ',' + sy(SL.pdf(v, b.mean, b.sd)).toFixed(1)); }
      g.push('<polyline class="sl-curve" points="' + cp.join(' ') + '"/>');
      // band labels
      var fs = phone ? 12 : 13, unit = (R - L) / 7;
      var BL = [['34%', 0.5, 0.42], ['13.5%', 1.5, 0.12]];
      BL.forEach(function(q){ [1, -1].forEach(function(sg){ var cx = sx(b.mean + sg * q[1] * b.sd), fit = tw(q[0], fs) < unit - 2; g.push(txt(cx, sy(peak * q[2]) + 4, q[0], 'sl-bl' + (fit ? '' : ' sl-bl-xs'))); }); });
      // the thin tails: labels above, with a short leader
      [[2.5, '2.35%', 0.17], [3.3, '0.15%', 0.07]].forEach(function(q){ [1, -1].forEach(function(sg){
        var vx = b.mean + sg * q[0] * b.sd, cx = sx(vx), ty = sy(peak * q[2]) - 6, cy = sy(SL.pdf(vx, b.mean, b.sd)) - 2;
        if(phone && q[1] === '0.15%') return;
        g.push('<line class="sl-lead" x1="' + cx.toFixed(1) + '" x2="' + cx.toFixed(1) + '" y1="' + (ty + 4).toFixed(1) + '" y2="' + cy.toFixed(1) + '"/>' + txt(cx, ty, q[1], 'sl-bl sl-bl-s'));
      }); });
      // axis and ticks: raw score, then z
      g.push('<line class="sl-axis" x1="' + L + '" x2="' + R + '" y1="' + base + '" y2="' + base + '"/>');
      [-3, -2, -1, 0, 1, 2, 3].forEach(function(k){
        var v = b.mean + k * b.sd, cx = sx(v);
        g.push('<line class="sl-tick" x1="' + cx.toFixed(1) + '" x2="' + cx.toFixed(1) + '" y1="' + base + '" y2="' + (base + 6) + '"/>');
        g.push(txt(cx, base + 22, String(v), 'sl-tv'));
        g.push(txt(cx, base + 40, k === 0 ? 'z 0' : (k > 0 ? '+' : '−') + Math.abs(k), 'sl-tz'));
      });
      if(!phone) g.push(txt(L, base + 40, 'z', 'sl-tz sl-tz-k', 'start'));
      // the score: a line up to the curve and a bubble above
      var hx = sx(xs), hy = sy(SL.pdf(xs, b.mean, b.sd));
      g.push('<line class="sl-score" x1="' + hx.toFixed(1) + '" x2="' + hx.toFixed(1) + '" y1="' + base + '" y2="' + (top - 6) + '"/><circle class="sl-onc" cx="' + hx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="5"/>');
      var pct = n.whole ? n.rule : n.pct, t1 = x + '  ·  z ' + zTxt(n.z), t2 = pctTxt(pct) + '% score lower';
      var bw = Math.max(tw(t1, 15, 900), tw(t2, 13, 700)) + 24, bh = 44, bx = clampX(hx, bw, L, R), by = top - bh - 12;
      g.push('<g class="sl-bub"><rect x="' + (bx - bw / 2).toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh + '" rx="10"/>' +
        (Math.abs(bx - hx) < bw / 2 - 10 ? '<path d="M' + (hx - 7).toFixed(1) + ' ' + (by + bh).toFixed(1) + ' L' + hx.toFixed(1) + ' ' + (by + bh + 8).toFixed(1) + ' L' + (hx + 7).toFixed(1) + ' ' + (by + bh).toFixed(1) + 'Z"/>' : '') +
        txt(bx, by + 19, t1, 'sl-bt1') + txt(bx, by + 36, t2, 'sl-bt2') + '</g>');
      var label = 'Normal curve of ' + b.name.toLowerCase() + ' scores, mean ' + b.mean + ', standard deviation ' + b.sd + ', with the 68-95-99.7 bands: 34%, 13.5%, 2.35% and 0.15% on each side. ' + curveLine();
      return { svg: g.join(''), label: label, handle: { x: hx, y: base, label: 'Score on the curve', min: b.min, max: b.max, now: x, text: curveLine() } };
    }

    function centerScene(W, H){
      var s = SET(), v = values(), c = SL.center(v), phone = W < 560, L = phone ? 18 : 40, R = W - (phone ? 18 : 40);
      var lo = s.lo, hi = s.hi, sx = function(q){ return L + (q - lo) / (hi - lo) * (R - L); };
      geo = { inv: function(px){ return lo + (px - L) / (R - L) * (hi - lo); }, lo: lo, hi: hi, step: 1 };
      var g = [], unit = (R - L) / (hi - lo), mi_ = moverIdx();
      // stacks: the moved value is drawn last, on top of its stack
      var seen = {}, dots = [];
      v.map(function(q, i){ return i; }).filter(function(i){ return i !== mi_; }).concat([mi_]).forEach(function(i){ var q = v[i]; seen[q] = (seen[q] || 0) + 1; dots.push({ i: i, q: q, k: seen[q] }); });
      var maxK = Math.max.apply(null, dots.map(function(d){ return d.k; }));
      var rad = Math.max(6, Math.min(16, unit * 0.48, (H - 220) / (maxK * 2.2))), dy = rad * 2 + 2;
      // Three rows, centered in the stage: the values in order (the median is
      // the middle chip), the dot plot on its beam, the mean worked out.
      var sorted = v.slice().sort(function(a, b){ return a - b; }), n = sorted.length, cw = Math.max(26, tw(String(hi), 14, 900) + 14), gap = phone ? 4 : 8;
      var rowW = n * cw + (n - 1) * gap, chipsY, eqY;
      var block = 50 + 64 + maxK * dy + 86 + 44, top0 = Math.max(phone ? 56 : 64, Math.round((H - block) / 2));
      chipsY = top0; var axisY = top0 + 50 + 64 + maxK * dy, topY = axisY - maxK * dy - 58; eqY = axisY + 90;
      var x0 = (W - rowW) / 2, midA = (n - 1) >> 1, midB = n >> 1;
      g.push(txt(W / 2, chipsY - 8, 'In order', 'sl-rowk'));
      sorted.forEach(function(q, i){
        var cx = x0 + i * (cw + gap), mid = i === midA || i === midB, mv = q === moved && i === sorted.lastIndexOf(moved);
        g.push('<rect class="sl-chip' + (mid ? ' is-mid' : '') + (mv ? ' is-mv' : '') + '" x="' + cx.toFixed(1) + '" y="' + chipsY + '" width="' + cw + '" height="28" rx="7"/>' + txt(cx + cw / 2, chipsY + 19, String(q), 'sl-chipt' + (mid ? ' is-mid' : '')));
      });
      var eq = 'Mean = ' + c.sum + ' ÷ ' + n + ' = ' + f1(c.mean);
      // range bracket (top row), median (second row), mean (fulcrum under the beam)
      var rY = topY + 2, mY = topY + 32;
      g.push('<path class="sl-range" d="M' + sx(c.min).toFixed(1) + ' ' + (rY + 8) + 'V' + rY + 'H' + sx(c.max).toFixed(1) + 'V' + (rY + 8) + '"/>');
      var rt = 'Range ' + c.range, rw = tw(rt, 13), rx = clampX((sx(c.min) + sx(c.max)) / 2, rw + 10, L, R);
      g.push('<rect class="sl-lbg" x="' + (rx - rw / 2 - 5).toFixed(1) + '" y="' + (rY - 13) + '" width="' + (rw + 10).toFixed(1) + '" height="18" rx="5"/>' + txt(rx, rY + 1, rt, 'sl-rt'));
      var mdx = sx(c.median), mt = 'Median ' + f1(c.median), mw = tw(mt, 13);
      g.push('<line class="sl-medl" x1="' + mdx.toFixed(1) + '" x2="' + mdx.toFixed(1) + '" y1="' + (mY + 6) + '" y2="' + axisY + '"/>');
      g.push(txt(clampX(mdx, mw, L, R), mY, mt, 'sl-mdt'));
      dots.forEach(function(d){
        var cx = sx(d.q), cy = axisY - rad - 2 - (d.k - 1) * dy, mv = d.i === mi_;
        g.push('<circle class="sl-dot' + (mv ? ' is-mv' : '') + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + rad.toFixed(1) + '"/>');
      });
      // the beam balances on the mean (the fulcrum under it)
      g.push('<line class="sl-beam" x1="' + L + '" x2="' + R + '" y1="' + axisY + '" y2="' + axisY + '"/>');
      var step = niceStep(hi - lo, phone ? 5 : 10), fx = sx(c.mean), fy = axisY + 44;
      // A tick number the fulcrum would cover is left out (the mean is written below).
      for(var t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) g.push('<line class="sl-tick" x1="' + sx(t).toFixed(1) + '" x2="' + sx(t).toFixed(1) + '" y1="' + axisY + '" y2="' + (axisY + 5) + '"/>' + (Math.abs(sx(t) - fx) < 13 + tw(String(t), 12.5) / 2 ? '' : txt(sx(t), axisY + 19, String(M.round(t, 2)), 'sl-tv')));
      g.push(txt((L + R) / 2, axisY + 38, s.name, 'sl-axn'));
      g.push('<path class="sl-fulcrum" d="M' + fx.toFixed(1) + ' ' + (axisY + 2) + ' L' + (fx - 11).toFixed(1) + ' ' + (axisY + 20) + ' L' + (fx + 11).toFixed(1) + ' ' + (axisY + 20) + 'Z"/>');
      var mt2 = 'Mean ' + f1(c.mean) + ' (balance point)', mw2 = tw(mt2, 13);
      g.push('<rect class="sl-lbg" x="' + (clampX(fx, mw2 + 10, L, R) - mw2 / 2 - 5).toFixed(1) + '" y="' + (fy + 2) + '" width="' + (mw2 + 10).toFixed(1) + '" height="18" rx="5"/>' + txt(clampX(fx, mw2 + 10, L, R), fy + 16, mt2, 'sl-mnt'));
      g.push(txt(W / 2, eqY + 22, eq, 'sl-eq'));
      var hx = sx(moved), hy = axisY - rad - 2 - (dots.filter(function(d){ return d.i === mi_; })[0].k - 1) * dy;
      var label = s.name + ': a dot plot of ' + v.length + ' values (' + v.slice().sort(function(a, b){ return a - b; }).join(', ') + '). ' + centerLine();
      return { svg: g.join(''), label: label, handle: { x: hx, y: hy, label: 'The value you can move', min: lo, max: hi, now: moved, text: moved + ' ' + s.short + '. ' + centerLine() } };
    }

    function newPoints(tweenIt){
      var next = SL.corrPoints(rT, 20, seed, SL.PAIRS[pair]);
      var from = shownPts && shownPts.length === next.length && tweenIt && !reduced() ? shownPts.map(function(q){ return q.slice(); }) : null;
      pts = next;
      if(tween){ cancelAnimationFrame(tween); tween = null; }
      if(!from){ shownPts = next; redraw(); return; }
      var t0 = null;
      function frame(t){
        if(t0 == null) t0 = t;
        var u = Math.min(1, (t - t0) / 260), e = 1 - Math.pow(1 - u, 3);
        shownPts = next.map(function(q, i){ return [from[i][0] + (q[0] - from[i][0]) * e, from[i][1] + (q[1] - from[i][1]) * e]; });
        redraw();
        if(u < 1) tween = requestAnimationFrame(frame); else { tween = null; shownPts = next; redraw(); }
      }
      tween = requestAnimationFrame(frame);
    }
    function corrScene(W, H){
      geo = null;
      var pr = SL.PAIRS[pair], phone = W < 560, L = phone ? 46 : 64, R = W - (phone ? 14 : 28), T0 = phone ? 22 : 28, B = H - (phone ? 52 + ENL : 58);
      var sx = function(q){ return L + (q - pr.xs[0]) / (pr.xs[1] - pr.xs[0]) * (R - L); }, sy = function(q){ return B - (q - pr.ys[0]) / (pr.ys[1] - pr.ys[0]) * (B - T0); };
      var g = [], xstep = niceStep(pr.xs[1] - pr.xs[0], phone ? 5 : 8), ystep = niceStep(pr.ys[1] - pr.ys[0], phone ? 5 : 6);
      for(var a = Math.ceil(pr.xs[0] / xstep) * xstep; a <= pr.xs[1] + 1e-9; a += xstep) g.push('<line class="sl-grid" x1="' + sx(a).toFixed(1) + '" x2="' + sx(a).toFixed(1) + '" y1="' + T0 + '" y2="' + B + '"/>' + txt(sx(a), B + 18, String(M.round(a, 2)), 'sl-tv'));
      for(var bq = Math.ceil(pr.ys[0] / ystep) * ystep; bq <= pr.ys[1] + 1e-9; bq += ystep) g.push('<line class="sl-grid" x1="' + L + '" x2="' + R + '" y1="' + sy(bq).toFixed(1) + '" y2="' + sy(bq).toFixed(1) + '"/>' + txt(L - 7, sy(bq) + 4, String(M.round(bq, 2)), 'sl-tv', 'end'));
      g.push('<line class="sl-axis" x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '"/><line class="sl-axis" x1="' + L + '" x2="' + L + '" y1="' + T0 + '" y2="' + B + '"/>');
      g.push(txt((L + R) / 2, B + 40, pr.x, 'sl-axn'));
      g.push('<text class="sl-axn" transform="translate(' + (phone ? 13 : 18) + ' ' + ((T0 + B) / 2).toFixed(1) + ') rotate(-90)" text-anchor="middle">' + esc(pr.y) + '</text>');
      var r = rNow();
      if(showLine && Math.abs(r) >= 0.1){
        var b1 = S.slope(pts), b0 = S.intercept(pts), x0 = pr.xs[0], x1 = pr.xs[1], y0 = b0 + b1 * x0, y1 = b0 + b1 * x1;
        // clip to the box
        function clipX(yv){ return (yv - b0) / b1; }
        if(y0 < pr.ys[0]){ x0 = clipX(pr.ys[0]); y0 = pr.ys[0]; } if(y0 > pr.ys[1]){ x0 = clipX(pr.ys[1]); y0 = pr.ys[1]; }
        if(y1 < pr.ys[0]){ x1 = clipX(pr.ys[0]); y1 = pr.ys[0]; } if(y1 > pr.ys[1]){ x1 = clipX(pr.ys[1]); y1 = pr.ys[1]; }
        g.push('<line class="sl-fit" x1="' + sx(x0).toFixed(1) + '" x2="' + sx(x1).toFixed(1) + '" y1="' + sy(y0).toFixed(1) + '" y2="' + sy(y1).toFixed(1) + '"/>');
      }
      var rad = phone ? 6 : 7;
      (shownPts || pts).forEach(function(q){ g.push('<circle class="sl-pt" cx="' + sx(q[0]).toFixed(1) + '" cy="' + sy(q[1]).toFixed(1) + '" r="' + rad + '"/>'); });
      // the r badge sits in the top corner the points avoid
      var bt = 'r = ' + n2(r), bw = tw(bt, 16, 900) + 22, corner = r >= 0 ? L + 10 : R - 10 - bw;
      g.push('<g class="sl-bub sl-rbadge"><rect x="' + corner.toFixed(1) + '" y="' + (T0 + 8) + '" width="' + bw.toFixed(1) + '" height="32" rx="9"/>' + txt(corner + bw / 2, T0 + 30, bt, 'sl-bt1') + '</g>');
      var label = 'Scatterplot of ' + pts.length + ' invented points, ' + pr.x.toLowerCase() + ' against ' + pr.y.toLowerCase() + '. ' + corrLine() + (showLine && Math.abs(r) >= 0.1 ? ' The line of best fit is drawn.' : '');
      return { svg: g.join(''), label: label, handle: null };
    }

    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.sl-fig')], dock: [$('.sl-ctl')], setup: 'Setup', moreLabel: 'Test, data set and variables', why: [$('.sl-say')], details: [$('.sl-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      syncView(); redraw();
      if(s.mode() === 'explore') s.hint({ target: handle, text: 'Start here: drag the score along the curve', inside: false });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(redraw, 60); }).observe($('.sl-fig')); }
      try{ new MutationObserver(function(){ redraw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
    }
    pts = SL.corrPoints(rT, 20, seed, SL.PAIRS[pair]); shownPts = pts;
    syncView(); redraw();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'stats-lab', noun: 'drill',
      generate: function(r, ctx, type){ return SL.generate(r, ctx, type); },
      types: [{ value: 'rule', label: 'Percentile by the 68-95-99.7 rule' }, { value: 'between', label: 'Share between two scores' }, { value: 'zcompare', label: 'Compare with z scores' },
        { value: 'center', label: 'Mean, median and range' }, { value: 'outlier', label: 'An outlier and skew' }, { value: 'scatter', label: 'Read a scatterplot' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { rule: 'A score on the normal curve', between: 'The share between two scores', zcompare: 'Two tests, two z scores', center: 'Central tendency by hand', outlier: 'What one outlier does', scatter: 'Reading a scatterplot' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); }
    });
  }
  /* The drill's figure, from the problem's own numbers (ApPsychPlot). A
     share is written on it only once its step is answered. */
  function figure(el, p, st){
    var g = p.figure, html = '', wide = (window.innerWidth || 1280) > 900, PW = wide ? 680 : 380, PH = wide ? 400 : 250;
    if(!g){ el.innerHTML = ''; return; }
    if(g.kind === 'normal'){
      var reveal = st.below || st.pct, spec = { label: 'Normal curve, mean ' + g.mean + ', standard deviation ' + g.sd + ', ticks at the mean and every standard deviation' + (g.show === 'below' ? ', shaded below ' + g.marks[0] : ', shaded between ' + g.marks[0] + ' and ' + g.marks[1]) + '.',
        kind: 'normal', mean: g.mean, sd: g.sd, bands: !!reveal, region: g.region, width: PW, height: PH };
      html = P.svg(spec);
    } else if(g.kind === 'normal2'){
      html = '<div class="sl-two">' + g.tests.map(function(t, i){
        var on = i === 0 ? st.z1 : st.z2;
        return '<div><p class="sl-two-h">' + esc(t.name.charAt(0).toUpperCase() + t.name.slice(1)) + ': ' + t.x + '</p>' + P.svg({ label: 'Normal curve of the ' + t.name + ', mean ' + t.mean + ', standard deviation ' + t.sd + (on ? ', shaded below the score ' + t.x : '') + '.', kind: 'normal', mean: t.mean, sd: t.sd, width: wide ? 560 : 380, height: wide ? 210 : 150, region: on ? { from: null, to: t.x } : null, points: [{ at: [t.x, 0], cls: 's2', label: on ? 'z = ' + zTxt((t.x - t.mean) / t.sd) : String(t.x) }] }) + '</div>';
      }).join('') + '</div>';
    } else if(g.kind === 'dots'){
      var d = g.data, lo = Math.min.apply(null, d), hi = Math.max.apply(null, d), w = Math.max(1, niceStep(hi - lo + 1, 10)), start = Math.floor(lo / w) * w, bins = [];
      for(var a = start; a <= hi; a += w) bins.push([a, a + w, d.filter(function(v){ return v >= a && v < a + w; }).length]);
      html = P.svg({ label: 'Histogram of the ' + d.length + ' values, ' + d.join(', ') + ', in bins of ' + w + '.', kind: 'histogram', bins: bins, xLabel: g.unit, yLabel: 'Count', width: PW, height: PH, y: [0, Math.max(3, Math.max.apply(null, bins.map(function(b){ return b[2]; })) + 1)] });
    } else if(g.kind === 'scatter'){
      html = P.svg({ label: 'Scatterplot of ' + g.points.length + ' invented points, ' + g.x.toLowerCase() + ' against ' + g.y.toLowerCase() + '.', kind: 'scatter', points: g.points, x: g.xs, y: g.ys, xLabel: g.x, yLabel: g.y, width: PW, height: wide ? 440 : 280 });
    }
    el.innerHTML = '<figure class="cd-fig sl-qfig">' + html + '</figure>';
  }
})();
