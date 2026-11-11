/* LevlPrep A&P: more live pictures for the worked-example calculators
   (tool review 2026-11, docs/tool-review/anatomy-physiology.md).

   70 of the 89 calculators showed only a result box. These families draw the
   formula happening, from the calculator's own computed values
   (data/calc-pictures.json names which value goes where; every key is checked
   by scripts/test/anp-calc-pictures.test.mjs):

     trace      membrane potential: inputs summing toward threshold; spikes and refractory periods
     axon       an impulse along an axon; a reflex arc with its timeline
     regrow     a cut nerve growing back along a limb
     burns      front and back body, regions painted by share burned; palm patches
     spun       a spun blood tube (hematocrit, blood volume)
     smear      white cells in a drop of blood, neutrophils picked out
     pool       a cell pool filled as fast as it empties (red cell turnover)
     score      score cards (Glasgow Coma Scale, Apgar) with the picked rows lit
     snellen    an eye chart with the line read
     ear        eardrum, ossicles and oval window to scale
     loud       a loudness ladder and the intensity ratio as squares
     gas        syringe (Boyle), lung balloon (compliance), alveolus (PCO2), air column (Dalton)
     scale      a value on a clinical ruler with its normal band (unit rulers, pH, BMI, ranges)
     calendar   a cycle or pregnancy laid out by day or week
     surface    folds, villi and microvilli; a fat drop split into droplets
     membrane   a cell membrane with the gradients across it (SGLT1), the placental barrier,
                carrier-bound and free hormone, potassium and water moving between compartments
     channel    a tube that loses water or solute at side exits (gut, nephron, calcium balance)
     sarcomere  thick and thin filaments, bands, sarcomeres in series
     lever      the forearm as a lever
     punnett    a Punnett square
     meiosis    chromosome pairs into gametes; one spermatocyte into four spermatids
     count      things counted: half-life vials, glucose per ATP, a fatty acid cut into
                acetyl groups, teaspoons of sugar, kilograms of fat, liters of urine
     sweat      sweat on skin: what evaporates (and carries heat) and what drips
     bulb       metabolic rate as a light bulb's watts

   Each draw(c, env, pic, H) returns { svg, cap } like the families in
   calculators.js; H carries that file's helpers. Loaded on first use. */
(function(){
  'use strict';
  var F = {};
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function num(v){ return typeof v === 'number' && isFinite(v); }

  /* ------------------------------------------------------------ trace */
  F.trace = function(c, env, p, H){
    var S = H.S, W = 360, svg;
    if(p.mode === 'spikes'){
      var arp = env[p.arp], H0 = 170; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H0 });
      var L = 34, R = 350, T = 22, B = 128, n = 8, span = arp * n;
      function x(t){ return L + t / span * (R - L); }
      function y(v){ return B - (v + 80) / 120 * (B - T); }
      svg.appendChild(S('rect', { x: L, y: T, width: R - L, height: B - T, rx: 6, 'class': 'cp-plot' }));
      [-70, 0, 30].forEach(function(v){ svg.appendChild(S('line', { x1: L, x2: R, y1: y(v), y2: y(v), 'class': 'cp-grid' })); svg.appendChild(S('text', { x: L - 4, y: y(v) + 3.5, 'text-anchor': 'end', 'class': 'cp-tick' }, String(v))); });
      var d = 'M' + L + ',' + y(-70);
      for(var k = 0; k < n; k++){
        var t0 = k * arp, w = arp;
        svg.appendChild(S('rect', { x: x(t0), y: T, width: Math.max(1, x(t0 + w) - x(t0)), height: B - T, 'class': 'ca-arp' + (k % 2 ? ' alt' : '') }));
        // a spike: up fast, down, a small undershoot, back to rest at the end of the refractory period
        d += ' L' + x(t0 + w * 0.04).toFixed(1) + ',' + y(-70) + ' L' + x(t0 + w * 0.16).toFixed(1) + ',' + y(30) + ' L' + x(t0 + w * 0.34).toFixed(1) + ',' + y(-75) + ' L' + x(t0 + w * 0.6).toFixed(1) + ',' + y(-72) + ' L' + x(t0 + w).toFixed(1) + ',' + y(-70);
      }
      svg.appendChild(S('path', { d: d, 'class': 'ca-mv' }));
      svg.appendChild(S('path', { d: 'M' + x(0) + ',' + (T - 6) + ' H' + x(arp), 'class': 'ca-span' }));
      svg.appendChild(S('text', { x: x(arp / 2), y: T - 10, 'text-anchor': 'middle', 'class': 'cp-v' }, 'ARP ' + H.val(c, env, p.arp) + ' ms'));
      svg.appendChild(S('text', { x: (L + R) / 2, y: B + 18, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'time: ' + n + ' refractory periods, ' + H.fmt(span, span < 10 ? 1 : 0) + ' ms'));
      svg.appendChild(S('text', { x: 10, y: (T + B) / 2, 'text-anchor': 'middle', transform: 'rotate(-90 10 ' + (T + B) / 2 + ')', 'class': 'cp-tick' }, 'mV'));
      svg.appendChild(S('text', { x: (L + R) / 2, y: H0 - 8, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, 'at most ' + H.val(c, env, p.rate) + ' impulses per second'));
      return { svg: svg, cap: 'Each impulse is followed by its absolute refractory period (shaded), when no new impulse can start. Back to back, they fit <b>' + H.val(c, env, p.rate) + '</b> into one second.' };
    }
    // summation at the trigger zone
    var rest = env[p.rest], thr = env[p.thr], ne = Math.round(env[p.ne]), ni = Math.round(env[p.ni]), e = env[p.e], ii = env[p.i], vm = env[p.vm], fire = vm >= thr;
    var H1 = 200; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H1 });
    // the neuron: dendrites with excitatory (orange) and inhibitory (blue) endings, the trigger zone
    var nx = 64, ny = 120;
    svg.appendChild(S('path', { d: 'M' + nx + ',' + ny + ' C' + (nx - 30) + ',' + (ny - 40) + ' ' + (nx - 44) + ',' + (ny - 70) + ' ' + (nx - 50) + ',' + (ny - 96) + ' M' + nx + ',' + ny + ' C' + (nx - 4) + ',' + (ny - 50) + ' ' + (nx + 4) + ',' + (ny - 80) + ' ' + nx + ',' + (ny - 104) + ' M' + nx + ',' + ny + ' C' + (nx + 26) + ',' + (ny - 40) + ' ' + (nx + 44) + ',' + (ny - 70) + ' ' + (nx + 52) + ',' + (ny - 94), 'class': 'ca-dend' }));
    svg.appendChild(S('circle', { cx: nx, cy: ny, r: 20, 'class': 'ca-soma' }));
    svg.appendChild(S('path', { d: 'M' + (nx + 18) + ',' + (ny + 8) + ' L' + (nx + 30) + ',' + (ny + 14) + ' L' + (nx + 66) + ',' + (ny + 14), 'class': 'ca-axon' }));
    svg.appendChild(S('circle', { cx: nx + 28, cy: ny + 13, r: 4.5, 'class': 'ca-trig' + (fire ? ' is-fire' : '') }));
    svg.appendChild(S('text', { x: nx + 20, y: ny + 34, 'text-anchor': 'middle', 'class': 'cp-t' }, 'trigger zone'));
    var spots = [[-50, -96], [-42, -72], [-30, -48], [0, -104], [2, -76], [0, -50], [52, -94], [42, -70], [28, -46], [-20, -24], [20, -26]];
    for(var a = 0; a < Math.min(11, ne + ni); a++){
      var sp = spots[a], ex = a < Math.min(ne, 11 - Math.min(ni, 5));
      if(!ex && a - Math.min(ne, 11 - Math.min(ni, 5)) >= ni) break;
      svg.appendChild(S('circle', { cx: nx + sp[0], cy: ny + sp[1], r: 5.2, 'class': ex ? 'ca-exc' : 'ca-inh' }));
      svg.appendChild(S('text', { x: nx + sp[0], y: ny + sp[1] + 3.5, 'text-anchor': 'middle', 'class': 'ca-sign' }, ex ? '+' : '−'));
    }
    svg.appendChild(S('text', { x: 8, y: 14, 'class': 'cp-t' }, ne + ' excitatory, ' + ni + ' inhibitory'));
    // the trace
    var L = 150, R = 350, T = 16, B = 168, lo = Math.min(rest, vm) - 8, hi = Math.max(thr, vm) + (fire ? 50 : 10);
    if(fire) hi = Math.max(hi, 35);
    function yy(v){ return B - (v - lo) / (hi - lo) * (B - T); }
    svg.appendChild(S('rect', { x: L, y: T, width: R - L, height: B - T, rx: 6, 'class': 'cp-plot' }));
    svg.appendChild(S('line', { x1: L, x2: R, y1: yy(thr), y2: yy(thr), 'class': 'ca-thr' }));
    svg.appendChild(S('text', { x: R - 4, y: yy(thr) - 4, 'text-anchor': 'end', 'class': 'cp-t ca-thr-t' }, 'threshold ' + H.fmt(thr, 0)));
    svg.appendChild(S('line', { x1: L, x2: R, y1: yy(rest), y2: yy(rest), 'class': 'cp-grid' }));
    svg.appendChild(S('text', { x: L + 4, y: yy(rest) + (vm < rest ? -4 : 12), 'class': 'cp-tick' }, 'rest ' + H.fmt(rest, 0)));
    var t1 = L + 30, up = ne * e, dn = ni * ii, peakX = t1 + 30;
    var d2 = 'M' + L + ',' + yy(rest) + ' L' + t1 + ',' + yy(rest) + ' C' + (t1 + 12) + ',' + yy(rest) + ' ' + (t1 + 16) + ',' + yy(vm) + ' ' + peakX + ',' + yy(vm);
    if(fire) d2 += ' L' + (peakX + 6) + ',' + yy(thr) + ' L' + (peakX + 14) + ',' + yy(30) + ' L' + (peakX + 26) + ',' + yy(rest - 6) + ' C' + (peakX + 50) + ',' + yy(rest - 4) + ' ' + (peakX + 70) + ',' + yy(rest) + ' ' + R + ',' + yy(rest);
    else d2 += ' C' + (peakX + 40) + ',' + yy(vm) + ' ' + (peakX + 70) + ',' + yy(rest) + ' ' + R + ',' + yy(rest);
    svg.appendChild(S('path', { d: d2, 'class': 'ca-mv' }));
    // the summed pushes: one arrow per input, stacked, at the arrival time
    var ax = t1 - 14, cur = rest;
    for(var u = 0; u < ne && u < 20; u++){ svg.appendChild(S('path', { d: 'M' + ax + ',' + yy(cur) + ' V' + (yy(cur + e) + 1), 'class': 'ca-push ca-up' })); cur += e; }
    var ax2 = ax - 8;
    for(var q = 0; q < ni && q < 20; q++){ svg.appendChild(S('path', { d: 'M' + ax2 + ',' + yy(cur) + ' V' + (yy(cur - ii) - 1), 'class': 'ca-push ca-dn' })); cur -= ii; }
    svg.appendChild(S('circle', { cx: peakX, cy: yy(vm), r: 4, 'class': 'ca-dot' }));
    svg.appendChild(S('text', { x: peakX + 8, y: yy(vm) + (fire ? 14 : -6), 'class': 'cp-v' }, H.val(c, env, p.vm) + ' mV'));
    if(fire) svg.appendChild(S('text', { x: peakX + 18, y: yy(30) + 4, 'class': 'cp-v cp-big' }, H.hid(p.vm) ? '' : 'fires'));
    svg.appendChild(S('text', { x: (L + R) / 2, y: H1 - 8, 'text-anchor': 'middle', 'class': 'cp-tick' }, '+' + H.fmt(up, 1) + ' mV up, −' + H.fmt(dn, 1) + ' mV down'));
    return { svg: svg, cap: 'Each excitatory input pushes the trigger zone up ' + H.fmt(e, 1) + ' mV and each inhibitory input pulls it down ' + H.fmt(ii, 1) + ' mV, all at once. They sum to <b>' + H.val(c, env, p.vm) + ' mV</b>: ' + (fire ? 'at or past threshold, so an action potential fires.' : 'short of threshold by ' + H.fmt(thr - vm, 1) + ' mV, so it does not fire.') };
  };

  /* ------------------------------------------------------------ axon */
  F.axon = function(c, env, p, H){
    var S = H.S, W = 360, svg;
    if(p.mode === 'reflex'){
      var Hh = 210; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
      // spinal cord section top right, muscle with a stretch ending bottom left
      svg.appendChild(S('ellipse', { cx: 268, cy: 54, rx: 46, ry: 36, 'class': 'ca-cord' }));
      svg.appendChild(S('path', { d: 'M240,40 C250,58 258,62 268,54 C278,62 286,58 296,40 C292,58 290,70 296,78 C284,70 276,70 268,76 C260,70 252,70 240,78 C246,70 244,58 240,40 Z', 'class': 'ca-grey' }));
      svg.appendChild(S('text', { x: 268, y: 104, 'text-anchor': 'middle', 'class': 'cp-t' }, 'spinal cord'));
      svg.appendChild(S('path', { d: 'M24,128 C40,112 92,112 110,128 C92,144 40,144 24,128 Z', 'class': 'ca-muscle' }));
      svg.appendChild(S('text', { x: 66, y: 156, 'text-anchor': 'middle', 'class': 'cp-t' }, 'muscle'));
      var sens = 'M70,126 C110,96 170,40 248,48', mot = 'M262,64 C200,110 140,140 96,132';
      svg.appendChild(S('path', { d: sens, 'class': 'ca-nerve ca-aff' }));
      svg.appendChild(S('path', { d: mot, 'class': 'ca-nerve ca-eff' }));
      var n = Math.max(1, Math.round(env[p.n]));
      for(var i = 0; i < Math.min(n, 6); i++) svg.appendChild(S('circle', { cx: 250 + i * 4, cy: 50 + i * 2.5, r: 3.4, 'class': 'ca-syn' }));
      svg.appendChild(S('text', { x: 140, y: 62, 'text-anchor': 'middle', 'class': 'cp-t ca-aff-t' }, 'sensory ' + H.fmt(env[p.ls], 2) + ' m at ' + H.fmt(env[p.vs], 0) + ' m/s'));
      svg.appendChild(S('text', { x: 186, y: 140, 'text-anchor': 'middle', 'class': 'cp-t ca-eff-t' }, 'motor ' + H.fmt(env[p.lm], 2) + ' m at ' + H.fmt(env[p.vm], 0) + ' m/s'));
      // the timeline: sensory, synapses, motor, junction and contraction, to scale
      var parts = [[env[p.ts], 'ca-aff-f', 'sensory', p.ts], [n, 'ca-syn-f', n + ' synapse' + (n > 1 ? 's' : ''), null], [env[p.tm], 'ca-eff-f', 'motor', p.tm], [3, 'ca-nmj-f', 'junction', null]];
      var tot = parts.reduce(function(a, b){ return a + b[0]; }, 0), x0 = 14, x1 = 346, y0 = 168, xx = x0;
      parts.forEach(function(pt){
        var w = pt[0] / tot * (x1 - x0);
        svg.appendChild(S('rect', { x: xx, y: y0, width: Math.max(0.5, w - 1), height: 16, rx: 3, 'class': pt[1] }));
        if(w > pt[2].length * 5.4 + 8) svg.appendChild(S('text', { x: xx + 4, y: y0 + 12, 'class': 'ca-in' }, pt[2]));
        xx += w;
      });
      svg.appendChild(S('text', { x: x1, y: Hh - 6, 'text-anchor': 'end', 'class': 'cp-v cp-big' }, 'total ' + H.val(c, env, p.total) + ' ms'));
      svg.appendChild(S('text', { x: x0, y: Hh - 6, 'class': 'cp-tick' }, 'one reflex, start to twitch'));
      return { svg: svg, cap: 'The signal runs up the sensory axon (' + H.val(c, env, p.ts) + ' ms), crosses ' + n + ' synapse' + (n > 1 ? 's' : '') + ' (about 1 ms each), runs down the motor axon (' + H.val(c, env, p.tm) + ' ms) and takes about 3 ms at the junction and to start the contraction. The bar is that timeline to scale: <b>' + H.val(c, env, p.total) + ' ms</b>.' };
    }
    var d = env[p.d], v = env[p.v], ms = env[p.t], Hh2 = 150; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh2 });
    var x0b = 30, full = 300, len = clamp(d / 2, 0.02, 1) * full, y = 70, my = v > 10;
    svg.appendChild(S('circle', { cx: x0b - 6, cy: y, r: 14, 'class': 'ca-soma' }));
    svg.appendChild(S('line', { x1: x0b, x2: x0b + len, y1: y, y2: y, 'class': 'ca-axon' }));
    if(my) for(var s = x0b + 6; s < x0b + len - 10; s += 22) svg.appendChild(S('rect', { x: s, y: y - 6, width: 18, height: 12, rx: 6, 'class': 'ca-myelin' }));
    svg.appendChild(S('path', { d: 'M' + (x0b + len) + ',' + y + ' l8,-8 M' + (x0b + len) + ',' + y + ' l8,0 M' + (x0b + len) + ',' + y + ' l8,8', 'class': 'ca-axon ca-term' }));
    var imp = S('circle', { cx: x0b, cy: y, r: 6, 'class': 'ca-imp' }); svg.appendChild(imp);
    svg.appendChild(S('path', { d: 'M' + x0b + ',' + (y + 26) + ' H' + (x0b + len), 'class': 'ca-span' }));
    svg.appendChild(S('text', { x: x0b + len / 2, y: y + 42, 'text-anchor': 'middle', 'class': 'cp-t' }, H.fmt(d, d < 0.1 ? 3 : 2) + ' m at ' + H.fmt(v, v < 10 ? 1 : 0) + ' m/s' + (my ? ' (myelinated)' : '')));
    svg.appendChild(S('text', { x: 180, y: 24, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, 'time ' + H.val(c, env, p.t) + ' ms'));
    svg.appendChild(S('text', { x: 180, y: Hh2 - 8, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'the impulse moves 40 times slower than in life; drawn to 2 m'));
    if(!H.reduced()){
      var my2 = H.anim(), dur = clamp(ms * 40, 260, 7000), t0 = null;
      requestAnimationFrame(function f(ts){ if(!H.alive(my2)) return; if(t0 == null) t0 = ts; var u = ((ts - t0) % (dur + 500)) / dur; imp.setAttribute('cx', (x0b + len * clamp(u, 0, 1)).toFixed(1)); requestAnimationFrame(f); });
    } else imp.setAttribute('cx', x0b + len);
    return { svg: svg, cap: 'Time is distance ÷ speed: ' + H.fmt(d, 2) + ' m ÷ ' + H.fmt(v, 1) + ' m/s = <b>' + H.val(c, env, p.t) + ' ms</b>. A faster (often myelinated, wider) axon covers the same length sooner.' };
  };

  /* ------------------------------------------------------------ regrow */
  F.regrow = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 170, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
    var dcm = env[p.d], days = env[p.days], months = env[p.months];
    // an arm from shoulder to fingertips, 75 cm long in the drawing
    var x0 = 20, x1 = 340, k = (x1 - x0) / 75, y = 82;
    svg.appendChild(S('path', { d: 'M' + x0 + ',' + (y - 22) + ' C120,' + (y - 20) + ' 190,' + (y - 14) + ' 270,' + (y - 12) + ' L300,' + (y - 14) + ' C318,' + (y - 16) + ' 334,' + (y - 8) + ' 340,' + (y - 2) + ' C334,' + (y + 8) + ' 318,' + (y + 14) + ' 300,' + (y + 12) + ' L270,' + (y + 12) + ' C190,' + (y + 14) + ' 120,' + (y + 22) + ' ' + x0 + ',' + (y + 24) + ' Z', 'class': 'ca-limb' }));
    svg.appendChild(S('text', { x: x0 + 4, y: y - 30, 'class': 'cp-t' }, 'shoulder'));
    svg.appendChild(S('text', { x: x1, y: y - 30, 'text-anchor': 'end', 'class': 'cp-t' }, 'target'));
    var reach = clamp(dcm, 1, 75) * k, cut = x1 - reach;
    svg.appendChild(S('path', { d: 'M' + x0 + ',' + y + ' H' + cut, 'class': 'ca-nerve ca-ok' }));
    svg.appendChild(S('path', { d: 'M' + cut + ',' + y + ' H' + (x1 - 6), 'class': 'ca-nerve ca-gone' }));
    svg.appendChild(S('path', { d: 'M' + cut + ',' + (y - 12) + ' l-4,24 M' + (cut + 5) + ',' + (y - 12) + ' l-4,24', 'class': 'ca-cut' }));
    svg.appendChild(S('text', { x: cut, y: y + 40, 'text-anchor': 'middle', 'class': 'cp-t' }, 'repair'));
    var front = S('path', { d: 'M' + cut + ',' + y + ' H' + cut, 'class': 'ca-nerve ca-grow' }); svg.appendChild(front);
    var tip = S('circle', { cx: cut, cy: y, r: 4.5, 'class': 'ca-imp' }); svg.appendChild(tip);
    svg.appendChild(S('path', { d: 'M' + cut + ',' + (y + 52) + ' H' + (x1 - 4), 'class': 'ca-span' }));
    svg.appendChild(S('text', { x: (cut + x1) / 2, y: y + 68, 'text-anchor': 'middle', 'class': 'cp-t' }, H.fmt(dcm, 0) + ' cm to grow at ' + H.fmt(env[p.r], 1) + ' mm a day'));
    svg.appendChild(S('text', { x: 180, y: 20, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, H.val(c, env, p.days) + ' days, about ' + H.val(c, env, p.months) + ' months'));
    function set(f){ var x = cut + (x1 - 6 - cut) * f; front.setAttribute('d', 'M' + cut + ',' + y + ' H' + x.toFixed(1)); tip.setAttribute('cx', x.toFixed(1)); }
    if(!H.reduced()){ var my = H.anim(), t0 = null; requestAnimationFrame(function f(ts){ if(!H.alive(my)) return; if(t0 == null) t0 = ts; set(((ts - t0) % 4200) / 3600 > 1 ? 1 : ((ts - t0) % 4200) / 3600); requestAnimationFrame(f); }); }
    else set(1);
    return { svg: svg, cap: 'Below the cut the axons die back; the growth front (the dot) moves down the old nerve path about ' + H.fmt(env[p.r], 1) + ' mm a day. ' + H.fmt(dcm * 10, 0) + ' mm takes <b>' + H.val(c, env, p.days) + ' days</b>, about ' + H.val(c, env, p.months) + ' months, before the target gets its nerve back. (The drawing compresses that time to a few seconds.)' };
  };

  /* ------------------------------------------------------------ burns */
  // an original body outline, front and back, split into the rule of nines regions (patient's right on the viewer's left in front)
  function bodyParts(cx, top, big){
    var hr = big ? 17 : 12.5, hy = top + hr, ny = hy + hr, sh = ny + 6, ch = big ? 50 : 56, ab = big ? 18 : 22, leg = big ? 52 : 70;
    var tw = 21, tr = sh + ch, hip = tr + ab;
    return {
      head: 'M' + cx + ',' + top + ' a' + hr + ',' + hr + ' 0 1,0 0.1,0 Z M' + (cx - 6) + ',' + (ny - 2) + ' h12 v8 h-12 Z',
      trunk: 'M' + (cx - tw) + ',' + sh + ' Q' + cx + ',' + (sh - 5) + ' ' + (cx + tw) + ',' + sh + ' L' + (cx + tw - 2) + ',' + tr + ' L' + (cx + tw - 1) + ',' + hip + ' L' + (cx - tw + 1) + ',' + hip + ' L' + (cx - tw + 2) + ',' + tr + ' Z',
      armL: 'M' + (cx - tw) + ',' + sh + ' C' + (cx - tw - 12) + ',' + (sh + 2) + ' ' + (cx - tw - 14) + ',' + (sh + 30) + ' ' + (cx - tw - 16) + ',' + (sh + 58) + ' L' + (cx - tw - 18) + ',' + (sh + 84) + ' L' + (cx - tw - 8) + ',' + (sh + 86) + ' L' + (cx - tw - 6) + ',' + (sh + 58) + ' L' + (cx - tw - 2) + ',' + (sh + 26) + ' Z',
      armR: 'M' + (cx + tw) + ',' + sh + ' C' + (cx + tw + 12) + ',' + (sh + 2) + ' ' + (cx + tw + 14) + ',' + (sh + 30) + ' ' + (cx + tw + 16) + ',' + (sh + 58) + ' L' + (cx + tw + 18) + ',' + (sh + 84) + ' L' + (cx + tw + 8) + ',' + (sh + 86) + ' L' + (cx + tw + 6) + ',' + (sh + 58) + ' L' + (cx + tw + 2) + ',' + (sh + 26) + ' Z',
      legL: 'M' + (cx - tw + 1) + ',' + hip + ' L' + (cx - 1) + ',' + hip + ' L' + (cx - 3) + ',' + (hip + leg) + ' L' + (cx - 5) + ',' + (hip + leg + 6) + ' L' + (cx - 16) + ',' + (hip + leg + 6) + ' L' + (cx - 15) + ',' + (hip + leg) + ' Z',
      legR: 'M' + (cx + tw - 1) + ',' + hip + ' L' + (cx + 1) + ',' + hip + ' L' + (cx + 3) + ',' + (hip + leg) + ' L' + (cx + 5) + ',' + (hip + leg + 6) + ' L' + (cx + 16) + ',' + (hip + leg + 6) + ' L' + (cx + 15) + ',' + (hip + leg) + ' Z',
      gen: 'M' + (cx - 4) + ',' + (hip - 3) + ' h8 v7 h-8 Z',
      at: { head: [cx, hy + 4], trunk: [cx, sh + ch / 2 + 4], armL: [cx - tw - 12, sh + 50], armR: [cx + tw + 12, sh + 50], legL: [cx - 9, hip + leg / 2], legR: [cx + 9, hip + leg / 2] },
      box: { head: [top, ny + 8], trunk: [sh - 6, hip], armL: [sh, sh + 86], armR: [sh, sh + 86], legL: [hip, hip + leg + 6], legR: [hip, hip + leg + 6] },
      bottom: hip + leg + 6
    };
  }
  F.burns = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 230, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
    if(p.mode === 'palm'){
      var B = bodyParts(110, 14, false);
      ['head', 'trunk', 'armL', 'armR', 'legL', 'legR'].forEach(function(k){ svg.appendChild(S('path', { d: B[k], 'class': 'ca-skin' })); });
      var spots = [[96, 80], [124, 104], [92, 150], [134, 176], [86, 66], [118, 70]], pi = 0;
      [p.p1, p.p2, p.p3].forEach(function(key, j){
        var n = env[key]; if(!(n > 0)) return;
        var sp = spots[j * 2] || [110, 100], r = Math.sqrt(n) * 7;
        svg.appendChild(S('ellipse', { cx: sp[0], cy: sp[1], rx: r * 1.15, ry: r * 0.85, 'class': 'ca-burn' }));
        pi++;
      });
      // the patient's palm with fingers, the 1% measure
      var hx = 262, hy = 70;
      svg.appendChild(S('path', { d: 'M' + (hx - 22) + ',' + (hy + 40) + ' C' + (hx - 26) + ',' + (hy + 10) + ' ' + (hx - 22) + ',' + (hy - 6) + ' ' + (hx - 10) + ',' + (hy - 8) + ' L' + (hx + 14) + ',' + (hy - 8) + ' C' + (hx + 24) + ',' + (hy - 4) + ' ' + (hx + 26) + ',' + (hy + 14) + ' ' + (hx + 22) + ',' + (hy + 40) + ' C' + (hx + 16) + ',' + (hy + 56) + ' ' + (hx - 16) + ',' + (hy + 56) + ' ' + (hx - 22) + ',' + (hy + 40) + ' Z', 'class': 'ca-palm' }));
      [-15, -5, 5, 15].forEach(function(dx, i){ svg.appendChild(S('rect', { x: hx + dx - 4, y: hy - 34 + (i === 0 || i === 3 ? 6 : 0), width: 8, height: 28, rx: 4, 'class': 'ca-palm' })); });
      svg.appendChild(S('rect', { x: hx + 20, y: hy + 8, width: 8, height: 24, rx: 4, transform: 'rotate(-35 ' + (hx + 24) + ' ' + (hy + 20) + ')', 'class': 'ca-palm' }));
      svg.appendChild(S('text', { x: hx, y: hy + 74, 'text-anchor': 'middle', 'class': 'cp-t' }, 'the patient’s palm and fingers'));
      svg.appendChild(S('text', { x: hx, y: hy + 88, 'text-anchor': 'middle', 'class': 'cp-t' }, 'is about 1% of their body'));
      svg.appendChild(S('text', { x: hx, y: 200, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, H.fmt(env[p.palms], 1) + ' palms ≈ ' + H.val(c, env, p.tbsa) + '%'));
      return { svg: svg, cap: 'Scattered burns are measured with the patient’s own hand: palm and fingers together cover about 1% of their body surface. These patches add to ' + H.fmt(env[p.palms], 1) + ' palms, so about <b>' + H.val(c, env, p.tbsa) + '%</b>. (Patch sizes in the drawing follow the numbers; their places are only examples.)' };
    }
    var inf = env[p.inf] >= 0.5, F2 = bodyParts(90, 20, inf), Bk = bodyParts(250, 20, inf), uid = 'cab' + Math.random().toString(36).slice(2, 7);
    var defs = H.defsOf(svg);
    var hv = env[p.hv], lv = env[p.lv];
    // front view (patient's right arm and leg on the viewer's left)
    function view(V, back){
      var map = { head: [p.head, hv], trunk: [back ? p.bt : p.ft, 18], armL: [back ? p.la : p.ra, 9], armR: [back ? p.ra : p.la, 9], legL: [back ? p.ll : p.rl, lv], legR: [back ? p.rl : p.ll, lv] };
      Object.keys(map).forEach(function(k){
        var share = clamp((env[map[k][0]] || 0) / 100, 0, 1), sh = V[k];
        svg.appendChild(S('path', { d: sh, 'class': 'ca-skin' }));
        if(share > 0){
          var id = uid + k + (back ? 'b' : 'f'), cp = S('clipPath', { id: id }); cp.appendChild(S('path', { d: sh })); defs.appendChild(cp);
          var bb = V.box[k], hh = bb[1] - bb[0];
          svg.appendChild(S('rect', { x: 0, y: bb[0] + hh * (1 - share), width: W, height: hh * share + 1, 'class': 'ca-burn', 'clip-path': 'url(#' + id + ')' }));
        }
        var at = V.at[k], full = map[k][1], each = k === 'trunk' ? full : full / 2;
        svg.appendChild(S('text', { x: at[0], y: at[1], 'text-anchor': 'middle', 'class': 'ca-pct' }, H.fmt(each, each % 1 ? 2 : 0).replace(/\.?0+$/, '')));
      });
      if(!back){ svg.appendChild(S('path', { d: V.gen, 'class': 'ca-skin' + (env[p.gen] > 0 ? ' ca-burnfill' : '') })); }
    }
    view(F2, false); view(Bk, true);
    svg.appendChild(S('text', { x: 90, y: 12, 'text-anchor': 'middle', 'class': 'cp-t' }, 'front'));
    svg.appendChild(S('text', { x: 250, y: 12, 'text-anchor': 'middle', 'class': 'cp-t' }, 'back'));
    svg.appendChild(S('text', { x: 180, y: Hh - 8, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, (inf ? 'Infant' : 'Adult') + ': ' + H.val(c, env, p.tbsa) + '% of the body burned'));
    return { svg: svg, cap: 'Each region carries its share of the body (' + (inf ? 'an infant: head 18%, each leg 13.5%' : 'an adult: head 9%, each arm 9%, each leg 18%, front and back of the trunk 18% each') + '); the numbers are each view’s half. Red fills the share of each region burned. Total: <b>' + H.val(c, env, p.tbsa) + '%</b>.' };
  };

  /* ------------------------------------------------------------ spun tube */
  F.spun = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 200, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
    var hct, top = 22, bot = 172, tx = 60, tw = 34;
    if(p.mode === 'volume'){ hct = clamp(env[p.h] / 100, 0, 1); }
    else hct = clamp(env[p.r] / env[p.t], 0, 1);
    var colH = p.mode === 'volume' ? (bot - top - 10) : clamp(env[p.t] / 150, 0.1, 1) * (bot - top - 10);
    var bloodTop = bot - colH, redTop = bot - colH * hct;
    var cp = H.clipOf(svg, S('rect', { x: tx, y: top, width: tw, height: bot - top, rx: tw / 2 }));
    var g = S('g', { 'clip-path': cp }); svg.appendChild(g);
    g.appendChild(S('rect', { x: tx, y: top, width: tw, height: bot - top, 'class': 'ca-glassfill' }));
    g.appendChild(S('rect', { x: tx, y: bloodTop, width: tw, height: redTop - bloodTop, 'class': 'ca-plasma' }));
    g.appendChild(S('rect', { x: tx, y: redTop, width: tw, height: bot - redTop, 'class': 'ca-red' }));
    g.appendChild(S('rect', { x: tx, y: redTop - 1.5, width: tw, height: 2.5, 'class': 'ca-buffy' }));
    g.appendChild(S('rect', { x: tx + 5, y: top + 4, width: 5, height: bot - top - 10, rx: 2.5, 'class': 'cp-gloss' }));
    svg.appendChild(S('rect', { x: tx, y: top, width: tw, height: bot - top, rx: tw / 2, 'class': 'ca-glass' }));
    svg.appendChild(S('text', { x: tx + tw / 2, y: bot + 18, 'text-anchor': 'middle', 'class': 'cp-t' }, 'spun tube'));
    // brackets with readings
    function bracket(y1, y2, txt, cls, sub){
      var bx = tx + tw + 10;
      svg.appendChild(S('path', { d: 'M' + bx + ',' + (y1 + 1) + ' h6 V' + (y2 - 1) + ' h-6', 'class': 'ca-brk ' + cls }));
      svg.appendChild(S('text', { x: bx + 12, y: (y1 + y2) / 2 + (sub ? -2 : 4), 'class': 'cp-v ' + cls }, txt));
      if(sub) svg.appendChild(S('text', { x: bx + 12, y: (y1 + y2) / 2 + 12, 'class': 'cp-t' }, sub));
    }
    if(p.mode === 'volume'){
      bracket(bloodTop, redTop, 'plasma ' + H.val(c, env, p.pv) + ' L', 'ca-pl-t', H.fmt(100 - env[p.h], 0) + '% of the blood');
      bracket(redTop, bot, 'red cells ' + H.val(c, env, p.rcv) + ' L', 'ca-rd-t', H.fmt(env[p.h], 0) + '% (hematocrit)');
      svg.appendChild(S('text', { x: 250, y: 30, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, 'blood ' + H.val(c, env, p.bv) + ' L'));
      svg.appendChild(S('text', { x: 250, y: 46, 'text-anchor': 'middle', 'class': 'cp-t' }, 'about 70 mL per kg'));
      return { svg: svg, cap: 'Spin a sample and the red cells pack below the plasma. The hematocrit, ' + H.fmt(env[p.h], 0) + '%, is the red share of the whole column, so ' + H.val(c, env, p.bv) + ' L of blood holds <b>' + H.val(c, env, p.rcv) + ' L of red cells</b> and <b>' + H.val(c, env, p.pv) + ' L of plasma</b>.' };
    }
    bracket(bloodTop, bot, 'whole column ' + H.fmt(env[p.t], 0) + ' mm', 'ca-mut-t');
    var bx2 = tx - 10;
    svg.appendChild(S('path', { d: 'M' + bx2 + ',' + (redTop + 1) + ' h-6 V' + (bot - 1) + ' h6', 'class': 'ca-brk ca-rd-t' }));
    svg.appendChild(S('text', { x: bx2 - 10, y: (redTop + bot) / 2 + 4, 'text-anchor': 'end', 'class': 'cp-v ca-rd-t' }, H.fmt(env[p.r], 0) + ' mm'));
    svg.appendChild(S('path', { d: 'M' + (tx + tw + 2) + ',' + redTop + ' C' + (tx + tw + 40) + ',' + redTop + ' ' + (tx + tw + 50) + ',' + (bot - 4) + ' ' + (tx + tw + 74) + ',' + (bot - 4), 'class': 'ca-leader' }));
    svg.appendChild(S('text', { x: tx + tw + 78, y: bot, 'class': 'cp-t' }, 'buffy coat: white cells, platelets'));
    svg.appendChild(S('text', { x: 290, y: 52, 'text-anchor': 'middle', 'class': 'cp-v cp-huge' }, 'Hct ' + H.val(c, env, p.h) + '%'));
    svg.appendChild(S('text', { x: 290, y: 70, 'text-anchor': 'middle', 'class': 'cp-t' }, H.fmt(env[p.r], 0) + ' of ' + H.fmt(env[p.t], 0) + ' mm is red cells'));
    return { svg: svg, cap: 'Spun, the blood separates: red cells packed at the bottom, a thin buffy coat of white cells and platelets, plasma on top. The red column is ' + H.fmt(env[p.r], 0) + ' mm of ' + H.fmt(env[p.t], 0) + ' mm, so the hematocrit is <b>' + H.val(c, env, p.h) + '%</b>.' };
  };

  /* ------------------------------------------------------------ smear */
  F.smear = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 190, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
    var share = clamp(env[p.p] / 100, 0, 1), cx = 96, cy = 96, R = 82;
    svg.appendChild(S('circle', { cx: cx, cy: cy, r: R, 'class': 'ca-field' }));
    var cp = H.clipOf(svg, S('circle', { cx: cx, cy: cy, r: R })); var g = S('g', { 'clip-path': cp }); svg.appendChild(g);
    // red cells as background, then 20 white cells: neutrophils (lobed nuclei) in the differential's share
    var rbc = H.rbcFill(svg);
    for(var i = 0; i < 70; i++){ var a = i * 2.39996, r = Math.sqrt(i / 70) * R * 1.02; g.appendChild(S('circle', { cx: (cx + Math.cos(a) * r).toFixed(1), cy: (cy + Math.sin(a) * r).toFixed(1), r: 7, fill: rbc, 'class': 'ca-rbcbg' })); }
    var n = 20, k = Math.round(share * n), pos = [];
    for(var j = 0; j < n; j++){ var a2 = j * 2.39996 + 0.7, r2 = Math.sqrt((j + 0.5) / n) * (R - 12); pos.push([cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2]); }
    pos.forEach(function(q, j){
      var neu = j < k;
      g.appendChild(S('circle', { cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: 9.5, 'class': 'ca-wbc' + (neu ? ' is-neu' : '') }));
      if(neu) [-4, 0, 4].forEach(function(dx, t){ g.appendChild(S('circle', { cx: (q[0] + dx).toFixed(1), cy: (q[1] + (t === 1 ? -2 : 1.5)).toFixed(1), r: 2.8, 'class': 'ca-lobe' })); });
      else g.appendChild(S('circle', { cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: 6, 'class': 'ca-mono' }));
    });
    svg.appendChild(S('text', { x: cx, y: Hh - 2, 'text-anchor': 'middle', 'class': 'cp-t' }, '20 white cells, ' + k + ' neutrophils (' + H.fmt(env[p.p], 0) + '%)'));
    svg.appendChild(S('text', { x: 270, y: 50, 'text-anchor': 'middle', 'class': 'cp-t' }, 'all white cells'));
    svg.appendChild(S('text', { x: 270, y: 66, 'text-anchor': 'middle', 'class': 'cp-v' }, H.fmt(env[p.w], 0) + ' per µL'));
    svg.appendChild(S('text', { x: 270, y: 90, 'text-anchor': 'middle', 'class': 'cp-t' }, '× ' + H.fmt(env[p.p], 0) + '% neutrophils'));
    svg.appendChild(S('text', { x: 270, y: 124, 'text-anchor': 'middle', 'class': 'cp-v cp-huge' }, H.val(c, env, p.a)));
    svg.appendChild(S('text', { x: 270, y: 142, 'text-anchor': 'middle', 'class': 'cp-t' }, 'neutrophils per µL'));
    return { svg: svg, cap: 'In the differential, ' + H.fmt(env[p.p], 0) + '% of the white cells are neutrophils (lobed nuclei). That share of ' + H.fmt(env[p.w], 0) + ' white cells per µL is <b>' + H.val(c, env, p.a) + ' neutrophils per µL</b>.' };
  };

  /* ------------------------------------------------------------ pool (turnover) */
  F.pool = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 180, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
    // red marrow (left) feeds the circulating pool; the spleen and liver (right) take out the old cells
    svg.appendChild(S('rect', { x: 14, y: 58, width: 64, height: 62, rx: 22, 'class': 'ca-bonefill' }));
    svg.appendChild(S('rect', { x: 24, y: 68, width: 44, height: 42, rx: 14, 'class': 'ca-marrow' }));
    svg.appendChild(S('text', { x: 46, y: 136, 'text-anchor': 'middle', 'class': 'cp-t' }, 'red marrow'));
    svg.appendChild(S('ellipse', { cx: 180, cy: 90, rx: 78, ry: 46, 'class': 'ca-poolf' }));
    var rbc = H.rbcFill(svg), dots = [];
    for(var i = 0; i < 26; i++){ var a = i * 2.39996, r = Math.sqrt(i / 26); var d = S('ellipse', { cx: (180 + Math.cos(a) * r * 62).toFixed(1), cy: (90 + Math.sin(a) * r * 34).toFixed(1), rx: 6, ry: 5, fill: rbc, 'class': 'cp-rbc' }); svg.appendChild(d); dots.push(d); }
    svg.appendChild(S('text', { x: 180, y: 30, 'text-anchor': 'middle', 'class': 'cp-v' }, H.fmt(env[p.n], 0) + ' trillion red cells in the blood'));
    svg.appendChild(S('path', { d: 'M296,64 C318,56 340,70 336,92 C332,112 306,118 294,104 C286,94 288,72 296,64 Z', 'class': 'ca-spleen' }));
    svg.appendChild(S('text', { x: 316, y: 136, 'text-anchor': 'middle', 'class': 'cp-t' }, 'spleen, liver'));
    svg.appendChild(S('path', { d: 'M80,90 H100', 'class': 'ca-flow' })); svg.appendChild(S('path', { d: 'M94,84 l8,6 l-8,6', 'class': 'ca-flowh' }));
    svg.appendChild(S('path', { d: 'M260,90 H284', 'class': 'ca-flow' })); svg.appendChild(S('path', { d: 'M278,84 l8,6 l-8,6', 'class': 'ca-flowh' }));
    svg.appendChild(S('text', { x: 92, y: 160, 'text-anchor': 'middle', 'class': 'cp-v' }, 'in: ' + H.val(c, env, p.d) + ' billion a day'));
    svg.appendChild(S('text', { x: 272, y: 160, 'text-anchor': 'middle', 'class': 'cp-v' }, 'out: the same'));
    svg.appendChild(S('text', { x: 180, y: 176, 'text-anchor': 'middle', 'class': 'cp-t' }, 'each cell lasts about ' + H.fmt(env[p.l], 0) + ' days; ' + H.val(c, env, p.s) + ' million made each second'));
    return { svg: svg, cap: 'The count stays steady because the marrow makes cells as fast as the spleen and liver remove old ones. If each lasts ' + H.fmt(env[p.l], 0) + ' days, 1/' + H.fmt(env[p.l], 0) + ' of the ' + H.fmt(env[p.n], 0) + ' trillion are replaced each day: <b>' + H.val(c, env, p.d) + ' billion a day</b>.' };
  };

  /* ------------------------------------------------------------ score cards */
  F.score = function(c, env, p, H){
    var S = H.S, W = 360, cols = p.cols, ph = H.phone();
    var rows = Math.max.apply(null, cols.map(function(k){ return k.levels.length; })), rh = p.layout === 'rows' ? 0 : 19;
    var svg, Hh;
    if(p.layout === 'rows'){
      // Apgar: five signs, each scored 0, 1 or 2
      Hh = cols.length * 30 + 44; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
      [0, 1, 2].forEach(function(s){ svg.appendChild(S('text', { x: 150 + s * 70 + 30, y: 14, 'text-anchor': 'middle', 'class': 'cp-t' }, String(s))); });
      cols.forEach(function(k, i){
        var y = 22 + i * 30, v = Math.round(env[k.key]);
        svg.appendChild(S('text', { x: 6, y: y + 17, 'class': 'cp-v' }, k.name));
        k.levels.forEach(function(t, s){
          var on = s === v;
          svg.appendChild(S('rect', { x: 150 + s * 70, y: y, width: 64, height: 26, rx: 7, 'class': 'ca-cell' + (on ? ' is-on' : '') }));
          svg.appendChild(S('text', { x: 150 + s * 70 + 32, y: y + 17, 'text-anchor': 'middle', 'class': 'ca-cellt ca-sm' + (on ? ' is-on' : '') }, t));
        });
      });
      svg.appendChild(S('text', { x: W / 2, y: Hh - 6, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, p.name + ' ' + H.val(c, env, p.total) + ' of ' + p.max));
      return { svg: svg, cap: 'Each sign scores 0, 1 or 2; the lit box in each row is the one entered. They add to <b>' + H.val(c, env, p.total) + '</b>.' };
    }
    Hh = rows * rh + 64; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
    var cw = (W - 12) / cols.length;
    cols.forEach(function(k, i){
      var x = 6 + i * cw, v = Math.round(env[k.key]);
      svg.appendChild(S('text', { x: x + cw / 2, y: 14, 'text-anchor': 'middle', 'class': 'cp-v' }, k.name + ' ' + (H.hid(k.key) ? '?' : v)));
      k.levels.slice().reverse().forEach(function(t, j){
        var s = k.levels.length - j, on = s === v, y = 22 + j * rh;
        svg.appendChild(S('rect', { x: x + 2, y: y, width: cw - 4, height: rh - 3, rx: 5, 'class': 'ca-cell' + (on ? ' is-on' : '') }));
        svg.appendChild(S('text', { x: x + 7, y: y + 12, 'class': 'ca-cellt' + (on ? ' is-on' : '') }, s + '  ' + t));
      });
    });
    svg.appendChild(S('text', { x: W / 2, y: Hh - 8, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, p.name + ' ' + H.val(c, env, p.total) + ' (lowest 3, highest 15)'));
    return { svg: svg, cap: 'The three scales side by side, best response at the top; the lit row in each is the score entered. E + V + M = <b>' + H.val(c, env, p.total) + '</b>.' };
  };

  /* ------------------------------------------------------------ snellen */
  F.snellen = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 210, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
    var rowsFt = [200, 100, 70, 50, 40, 30, 25, 20, 15, 10], letters = ['E', 'F P', 'T O Z', 'L P E D', 'P E C F D', 'E D F C Z P', 'F E L O P Z D', 'D E F P O T E C', 'L E F O D P C T', 'F D P L T C E O'];
    var r = env[p.r], best = rowsFt.reduce(function(b, f){ return Math.abs(f - r) < Math.abs(b - r) ? f : b; }, rowsFt[0]);
    svg.appendChild(S('rect', { x: 20, y: 8, width: 170, height: Hh - 16, rx: 6, 'class': 'ca-chart' }));
    var y = 20;
    rowsFt.forEach(function(f, i){
      var size = clamp(28 * f / 200, 5.5, 28), on = f === best;
      y += size + 4;
      if(on) svg.appendChild(S('rect', { x: 24, y: y - size - 2, width: 162, height: size + 6, rx: 3, 'class': 'ca-rowhi' }));
      svg.appendChild(S('text', { x: 105, y: y, 'text-anchor': 'middle', 'class': 'ca-letters', style: 'font-size:' + size.toFixed(1) + 'px' }, letters[i]));
      svg.appendChild(S('text', { x: 182, y: y, 'text-anchor': 'end', 'class': 'ca-rowlbl' + (on ? ' is-on' : '') }, String(f)));
    });
    svg.appendChild(S('text', { x: 275, y: 50, 'text-anchor': 'middle', 'class': 'cp-v cp-huge' }, H.fmt(env[p.d], 0) + '/' + H.fmt(r, 0)));
    svg.appendChild(S('text', { x: 275, y: 76, 'text-anchor': 'middle', 'class': 'cp-t' }, 'you read at ' + H.fmt(env[p.d], 0) + ' ft'));
    svg.appendChild(S('text', { x: 275, y: 90, 'text-anchor': 'middle', 'class': 'cp-t' }, 'what a typical eye reads'));
    svg.appendChild(S('text', { x: 275, y: 104, 'text-anchor': 'middle', 'class': 'cp-t' }, 'at ' + H.fmt(r, 0) + ' ft'));
    svg.appendChild(S('text', { x: 275, y: 140, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, 'letters ' + H.val(c, env, p.f) + '×'));
    svg.appendChild(S('text', { x: 275, y: 156, 'text-anchor': 'middle', 'class': 'cp-t' }, 'the size a typical eye needs'));
    return { svg: svg, cap: 'The smallest line you can read is labeled with the distance at which a typical eye reads it (' + H.fmt(r, 0) + ' ft). Read from ' + H.fmt(env[p.d], 0) + ' ft, you need letters <b>' + H.val(c, env, p.f) + ' times</b> as large as a typical eye does.' };
  };

  /* ------------------------------------------------------------ ear */
  F.ear = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 180, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
    var ad = env[p.ad], af = env[p.af], kpx = 1.25;   // px per mm (diameter from area)
    var rd = Math.sqrt(ad / Math.PI) * 2 * kpx * 5, rf = Math.sqrt(af / Math.PI) * 2 * kpx * 5;
    // eardrum (an oval seen face on), the chain of three ossicles, the oval window
    svg.appendChild(S('ellipse', { cx: 70, cy: 86, rx: rd * 0.85, ry: rd, 'class': 'ca-drum' }));
    svg.appendChild(S('text', { x: 70, y: 86 + rd + 16, 'text-anchor': 'middle', 'class': 'cp-t' }, 'eardrum ' + H.fmt(ad, 0) + ' mm²'));
    svg.appendChild(S('path', { d: 'M76,80 C96,60 120,52 140,60 C150,66 156,70 170,70 L196,78 C210,84 214,92 226,92 L250,88', 'class': 'ca-oss' }));
    svg.appendChild(S('path', { d: 'M248,76 l14,0 l0,24 l-14,0 Z', 'class': 'ca-stapes' }));
    svg.appendChild(S('text', { x: 150, y: 44, 'text-anchor': 'middle', 'class': 'cp-t' }, 'ossicles: lever × ' + H.fmt(env[p.lv], 1)));
    svg.appendChild(S('ellipse', { cx: 276, cy: 88, rx: rf * 0.6, ry: rf, 'class': 'ca-window' }));
    svg.appendChild(S('text', { x: 276, y: 88 + Math.max(rf, 10) + 16, 'text-anchor': 'middle', 'class': 'cp-t' }, 'oval window ' + H.fmt(af, 1) + ' mm²'));
    svg.appendChild(S('text', { x: 180, y: 18, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, 'pressure × ' + H.val(c, env, p.gain)));
    svg.appendChild(S('text', { x: 180, y: Hh - 6, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'areas drawn to scale with each other'));
    return { svg: svg, cap: 'The force collected over the large eardrum is delivered to the small stapes footplate in the oval window, so pressure rises by the area ratio (' + H.val(c, env, p.area) + '×), and the ossicle lever adds × ' + H.fmt(env[p.lv], 1) + ': <b>about ' + H.val(c, env, p.gain) + ' times</b> the pressure, enough to move the fluid of the inner ear.' };
  };

  /* ------------------------------------------------------------ loudness */
  F.loud = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 200, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
    var l1 = env[p.l1], l2 = env[p.l2], T = 14, B = 186, x = 60;
    function y(db){ return B - db / 140 * (B - T); }
    svg.appendChild(S('rect', { x: x - 6, y: T, width: 12, height: B - T, rx: 6, 'class': 'ca-ladder' }));
    // everyday sounds, rough levels
    [[0, 'faintest heard'], [30, 'whisper'], [60, 'conversation'], [85, 'long exposure harms'], [110, 'rock concert'], [130, 'pain']].forEach(function(s){
      svg.appendChild(S('line', { x1: x - 6, x2: x + 6, y1: y(s[0]), y2: y(s[0]), 'class': 'cp-grid' }));
      svg.appendChild(S('text', { x: x - 10, y: y(s[0]) + 3.5, 'text-anchor': 'end', 'class': 'cp-tick' }, String(s[0])));
      svg.appendChild(S('text', { x: x + 12, y: y(s[0]) + 3.5, 'class': 'cp-tick' }, s[1]));
    });
    [[l1, 'ca-lo'], [l2, 'ca-hi']].forEach(function(m){ svg.appendChild(S('circle', { cx: x, cy: y(m[0]), r: 6, 'class': 'ca-mk ' + m[1] })); });
    svg.appendChild(S('path', { d: 'M' + (x - 20) + ',' + y(l1) + ' C' + (x - 34) + ',' + y(l1) + ' ' + (x - 34) + ',' + y(l2) + ' ' + (x - 20) + ',' + y(l2), 'class': 'ca-span' }));
    // the intensity ratio as squares: one square for the quieter sound, the louder as squares in tens
    var ratio = env[p.ratio], gx = 200, gy = 30;
    svg.appendChild(S('text', { x: 270, y: 20, 'text-anchor': 'middle', 'class': 'cp-v' }, '+' + H.fmt(l2 - l1, 0) + ' dB = ' + H.val(c, env, p.ratio) + ' × the intensity'));
    var steps = Math.floor((l2 - l1) / 10), rest = (l2 - l1) % 10;
    svg.appendChild(S('rect', { x: gx, y: gy + 10, width: 10, height: 10, 'class': 'ca-sq ca-lo' }));
    svg.appendChild(S('text', { x: gx + 16, y: gy + 19, 'class': 'cp-tick' }, 'quieter sound: 1'));
    var yy = gy + 34;
    for(var s = 1; s <= Math.min(steps, 6); s++){
      svg.appendChild(S('rect', { x: gx, y: yy, width: 10, height: 10, 'class': 'ca-sq ca-hi' }));
      svg.appendChild(S('text', { x: gx + 16, y: yy + 9, 'class': 'cp-tick' }, '+' + s * 10 + ' dB: × 10' + (s > 1 ? ' again = ' + H.fmt(Math.pow(10, s), 0) : '')));
      yy += 18;
    }
    if(steps > 6) svg.appendChild(S('text', { x: gx, y: yy + 8, 'class': 'cp-tick' }, '… each 10 dB multiplies by 10'));
    if(rest) svg.appendChild(S('text', { x: gx, y: Math.min(yy + 22, Hh - 8), 'class': 'cp-tick' }, 'and +' + rest + ' dB × ' + H.fmt(Math.pow(10, rest / 10), 2)));
    return { svg: svg, cap: 'Decibels count tens: every 10 dB multiplies the intensity by 10. From ' + H.fmt(l1, 0) + ' to ' + H.fmt(l2, 0) + ' dB is ' + H.fmt((l2 - l1) / 10, 1) + ' steps of ten, so <b>' + H.val(c, env, p.ratio) + ' times</b> the intensity. (The everyday levels are rough guides.)' };
  };

  /* ------------------------------------------------------------ gas */
  F.gas = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 190, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh }), cap = '';
    function molecules(x0, y0, w, h, n, cls, seed){
      var g = S('g', {}); for(var i = 0; i < n; i++){ var a = ((i + 1) * 0.7548776662 + (seed || 0)) % 1, b = ((i + 1) * 0.5698402910 + 0.3 + (seed || 0)) % 1; g.appendChild(S('circle', { cx: (x0 + 4 + a * (w - 8)).toFixed(1), cy: (y0 + 4 + b * (h - 8)).toFixed(1), r: 2.6, 'class': cls })); } return g;
    }
    if(p.mode === 'syringe'){
      var v1 = env[p.v1], v2 = env[p.v2], mx = Math.max(v1, v2) * 1.15, x0 = 40, len = 250, y = 40, h = 46;
      [[v1, env[p.p1], 'before', 0], [v2, env[p.p2], 'after', 1]].forEach(function(st, i){
        var yy = y + i * 74, wv = st[0] / mx * len;
        svg.appendChild(S('rect', { x: x0, y: yy, width: len + 10, height: h, rx: 6, 'class': 'ca-barrel' }));
        svg.appendChild(S('rect', { x: x0 + 2, y: yy + 2, width: wv, height: h - 4, rx: 4, 'class': 'ca-gasfill' }));
        svg.appendChild(molecules(x0 + 2, yy + 2, wv, h - 4, 30, 'ca-mol', i * 0.11));
        svg.appendChild(S('rect', { x: x0 + 2 + wv, y: yy - 4, width: 8, height: h + 8, rx: 2, 'class': 'ca-piston' }));
        svg.appendChild(S('rect', { x: x0 + 10 + wv, y: yy + h / 2 - 4, width: Math.max(0, len - wv + 30), height: 8, 'class': 'ca-piston' }));
        svg.appendChild(S('text', { x: x0, y: yy - 6, 'class': 'cp-t' }, st[2] + ': ' + H.fmt(st[0], 3) + ' L'));
        svg.appendChild(S('text', { x: x0 + len + 18, y: yy + h / 2 + 4, 'class': 'cp-v' }, (i ? H.val(c, env, p.p2) : H.fmt(st[1], 0)) + ' mm Hg'));
      });
      cap = 'The same gas molecules in a different volume: ' + (v2 > v1 ? 'more room, so they hit the walls less often and the pressure falls' : v2 < v1 ? 'less room, so they hit the walls more often and the pressure rises' : 'same room, same pressure') + '. P₁V₁ = P₂V₂ gives <b>' + H.val(c, env, p.p2) + ' mm Hg</b>' + (Math.abs(v2 - v1) / v1 < 0.01 ? '; a tiny volume change, as in a breath, makes the few mm Hg that move air.' : '.');
    } else if(p.mode === 'balloon'){
      var dv = env[p.dv], cmp = env[p.c], k = 30;
      svg.appendChild(S('ellipse', { cx: 120, cy: 100, rx: 50, ry: 62, 'class': 'ca-lungfill ca-before' }));
      var big = 1 + dv / 3;
      svg.appendChild(S('ellipse', { cx: 120, cy: 100, rx: 50 * Math.sqrt(big), ry: 62 * Math.sqrt(big), 'class': 'ca-lungline' }));
      svg.appendChild(S('text', { x: 120, y: 104, 'text-anchor': 'middle', 'class': 'cp-v' }, '+' + H.fmt(dv, 2) + ' L'));
      svg.appendChild(S('text', { x: 120, y: 184, 'text-anchor': 'middle', 'class': 'cp-t' }, 'the lungs before (filled) and after a breath in'));
      svg.appendChild(S('text', { x: 270, y: 60, 'text-anchor': 'middle', 'class': 'cp-t' }, 'pressure across the lung'));
      svg.appendChild(S('text', { x: 270, y: 76, 'text-anchor': 'middle', 'class': 'cp-v' }, H.fmt(env[p.pa], 0) + ' → ' + H.fmt(env[p.pb], 0) + ' mm Hg'));
      svg.appendChild(S('text', { x: 270, y: 118, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, 'C = ' + H.val(c, env, p.c) + ' L'));
      svg.appendChild(S('text', { x: 270, y: 134, 'text-anchor': 'middle', 'class': 'cp-t' }, 'per mm Hg'));
      cap = 'Compliance is how much the lungs stretch for each unit of pressure: ' + H.fmt(dv, 2) + ' L for a ' + H.fmt(env[p.pb] - env[p.pa], 1) + ' mm Hg change is <b>' + H.val(c, env, p.c) + ' L per mm Hg</b>. Stiff lungs (low compliance) need a bigger pressure change for the same breath.';
    } else if(p.mode === 'alveolus'){
      var p1 = env[p.p1], p2 = env[p.p2];
      [[env[p.va1], p1, 'before', 90], [env[p.va2], p2, 'after', 260]].forEach(function(st, i){
        var cx = st[3];
        svg.appendChild(S('circle', { cx: cx, cy: 90, r: 56, 'class': 'ca-alv' }));
        svg.appendChild(molecules(cx - 36, 54, 72, 72, Math.round(clamp(st[1] / 2, 2, 60)), 'ca-co2', i * 0.3));
        svg.appendChild(S('text', { x: cx, y: 22, 'text-anchor': 'middle', 'class': 'cp-t' }, st[2] + ': ' + H.fmt(st[0], 1) + ' L/min fresh air'));
        svg.appendChild(S('text', { x: cx, y: 168, 'text-anchor': 'middle', 'class': 'cp-v' }, 'PCO2 ' + (i ? H.val(c, env, p.p2) : H.fmt(p1, 0)) + ' mm Hg'));
      });
      svg.appendChild(S('text', { x: 180, y: 186, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'dots: CO2 left in the alveolus; the body adds it at the same rate'));
      cap = 'Cells keep adding CO2 at the same rate, so PCO2 depends on how fast fresh air washes it out: ' + H.fmt(env[p.fold], 2) + ' times the ventilation leaves <b>' + H.val(c, env, p.p2) + ' mm Hg</b>, 1/' + H.fmt(env[p.fold], 2) + ' of before.';
    } else if(p.mode === 'o2content'){
      // two columns to one scale: on hemoglobin and dissolved in plasma
      var bd = env[p.bound], ds = env[p.diss], top = 26, bot = 160, k3 = (bot - top) / Math.max(25, bd + ds);
      [[bd, 'on hemoglobin', 'ca-o2', 100], [ds, 'dissolved', 'ca-diss', 230]].forEach(function(col, i){
        svg.appendChild(S('rect', { x: col[3], y: top, width: 64, height: bot - top, rx: 6, 'class': 'ca-track2' }));
        var hh2 = Math.max(i ? 0.8 : 0, col[0] * k3);
        svg.appendChild(S('rect', { x: col[3], y: bot - hh2, width: 64, height: hh2, rx: 3, 'class': col[2] }));
        svg.appendChild(S('text', { x: col[3] + 32, y: bot + 16, 'text-anchor': 'middle', 'class': 'cp-t' }, col[1]));
        svg.appendChild(S('text', { x: col[3] + 32, y: bot - hh2 - 6, 'text-anchor': 'middle', 'class': 'cp-v' }, (i ? H.val(c, env, p.diss) : H.val(c, env, p.bound))));
      });
      svg.appendChild(S('text', { x: 262, y: 120, 'text-anchor': 'middle', 'class': 'cp-tick' }, H.hid(p.share) ? 'a sliver' : 'a sliver: ' + H.fmt(100 - env[p.share], 1) + '% of the total'));
      svg.appendChild(S('text', { x: 20, y: 14, 'class': 'cp-t' }, 'mL of O2 per 100 mL of blood, one scale'));
      svg.appendChild(S('text', { x: 20, y: Hh - 6, 'class': 'cp-v' }, 'total ' + H.val(c, env, p.total)));
      cap = 'Drawn to one scale: hemoglobin carries <b>' + H.val(c, env, p.bound) + '</b> mL of O2 per 100 mL of blood; only ' + H.val(c, env, p.diss) + ' mL is dissolved in the plasma, because O2 dissolves poorly. The PO2 sets how full the hemoglobin is.';
    } else {
      // Dalton: a column of air split by partial pressure
      var P = env[p.p], Wv = env[p.w], po2 = env[p.po2], x0b = 40, w = 70, top = 20, bot = 176, k2 = (bot - top) / Math.max(P, 760);
      var hW = Wv * k2, hO = po2 * k2, hR = (P - Wv - po2) * k2;
      svg.appendChild(S('rect', { x: x0b, y: bot - hW - hO - hR, width: w, height: hR, 'class': 'ca-n2' }));
      svg.appendChild(S('rect', { x: x0b, y: bot - hW - hO, width: w, height: hO, 'class': 'ca-o2' }));
      svg.appendChild(S('rect', { x: x0b, y: bot - hW, width: w, height: hW, 'class': 'ca-h2o' }));
      svg.appendChild(S('rect', { x: x0b, y: bot - hW - hO - hR, width: w, height: hW + hO + hR, 'class': 'ca-colline' }));
      function lab(y, t, cls){ svg.appendChild(S('text', { x: x0b + w + 10, y: y + 4, 'class': 'cp-v ' + cls }, t)); }
      if(hR > 14) lab(bot - hW - hO - hR / 2, 'other gases (mostly N2) ' + H.fmt(P - Wv - po2, 0), 'ca-n2-t');
      lab(bot - hW - hO / 2, 'O2 ' + H.val(c, env, p.po2) + ' mm Hg', 'ca-o2-t');
      if(Wv > 0) lab(bot - hW / 2 + (hW < 12 ? 6 : 0), 'water vapor ' + H.fmt(Wv, 0), 'ca-h2o-t');
      svg.appendChild(S('text', { x: x0b + w / 2, y: 14, 'text-anchor': 'middle', 'class': 'cp-t' }, 'total ' + H.fmt(P, 0) + ' mm Hg'));
      cap = 'Each gas in a mixture pushes in proportion to its share. Water vapor takes its ' + H.fmt(Wv, 0) + ' mm Hg first; oxygen is ' + H.fmt(env[p.f], 1) + '% of the dry rest: <b>' + H.val(c, env, p.po2) + ' mm Hg</b>.';
    }
    return { svg: svg, cap: cap };
  };

  /* ------------------------------------------------------------ scale */
  /* rows: [{ key, unit, min, max, bands:[{from,to,label,tone}], label, marks:[{key,label}] , dp }] */
  F.scale = function(c, env, p, H){
    var S = H.S, W = 360, rows = p.rows, rh = 84, Hh = rows.length * rh + (p.title ? 22 : 8), svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh }), L = 20, R = 340;
    if(p.title) svg.appendChild(S('text', { x: W / 2, y: 14, 'text-anchor': 'middle', 'class': 'cp-v' }, p.title));
    rows.forEach(function(r, i){
      var y = (p.title ? 22 : 8) + i * rh + 38, lo = r.min, hi = r.max;
      if(r.log){ var f0 = Math.log(lo), f1 = Math.log(hi); }
      function x(v){ v = clamp(v, lo, hi); return r.log ? L + (Math.log(v) - f0) / (f1 - f0) * (R - L) : L + (v - lo) / (hi - lo) * (R - L); }
      svg.appendChild(S('text', { x: L, y: y - 30, 'class': 'cp-t ca-rowt' }, r.label));
      svg.appendChild(S('rect', { x: L, y: y - 6, width: R - L, height: 12, rx: 6, 'class': 'ca-track' }));
      (r.bands || []).forEach(function(b){
        var from = b.fromKey ? env[b.fromKey] : b.from, to = b.toKey ? env[b.toKey] : b.to;
        var x1 = x(from), x2 = x(to);
        svg.appendChild(S('rect', { x: x1, y: y - 6, width: Math.max(1, x2 - x1), height: 12, rx: 3, 'class': 'ca-band tone-' + (b.tone || 'ok') }));
        if(b.label && x2 - x1 > b.label.length * 5.2) svg.appendChild(S('text', { x: (x1 + x2) / 2, y: y + 20, 'text-anchor': 'middle', 'class': 'cp-tick ca-bandt' }, b.label));
      });
      (r.ticks || []).forEach(function(t){ svg.appendChild(S('line', { x1: x(t), x2: x(t), y1: y + 6, y2: y + 10, 'class': 'cp-grid' })); svg.appendChild(S('text', { x: x(t), y: y + 31, 'text-anchor': 'middle', 'class': 'cp-tick' }, H.fmt(t, r.tdp || 0))); });
      var used = [];
      (r.marks || []).forEach(function(m, j){
        if(H.hid(m.key)){ svg.appendChild(S('text', { x: (L + R) / 2, y: y - 12, 'text-anchor': 'middle', 'class': 'cp-v cp-unk' }, m.label + ' ?')); return; }
        var v = env[m.key]; if(!num(v)) return;
        var mx = x(v), off = v < lo || v > hi;
        svg.appendChild(S('path', { d: 'M' + mx + ',' + (y - 9) + ' l-5,-8 h10 Z', 'class': 'ca-pin ' + (m.cls || (j ? 'ca-p2' : 'ca-p1')) }));
        svg.appendChild(S('line', { x1: mx, x2: mx, y1: y - 7, y2: y + 7, 'class': 'ca-pinl ' + (m.cls || (j ? 'ca-p2' : 'ca-p1')) }));
        var txt = m.label + ' ' + H.val(c, env, m.key) + (m.unit != null ? m.unit : r.unit ? ' ' + r.unit : '') + (off ? (v < lo ? ' ◂' : ' ▸') : '');
        var lw = r.label.length * 5.6 + 12, tw = txt.length * 5.8, tx = clamp(mx, L + tw / 2, R - tw / 2), clash = used.some(function(u){ return Math.abs(u - tx) < tw * 0.9; });
        // a pin's words sit just above it; when two pins are close, the second goes to the row label's line, after the label
        var ty = y - 18;
        if(clash){ ty = y - 30; tx = Math.max(tx, L + lw + tw / 2); }
        used.push(tx);
        svg.appendChild(S('text', { x: tx, y: ty, 'text-anchor': 'middle', 'class': 'cp-v ' + (m.cls || (j ? 'ca-p2' : 'ca-p1')) + '-t' }, txt));
      });
    });
    var cap = p.cap ? fillCap(p.cap, c, env, H) : 'Where the value falls on its scale; the shaded band is the usual range.';
    return { svg: svg, cap: cap };
  };
  function fillCap(t, c, env, H){ return t.replace(/\{(\w+)\}/g, function(m, k){ return env[k] == null ? m : '<b>' + H.val(c, env, k) + '</b>'; }); }

  /* ------------------------------------------------------------ calendar */
  F.calendar = function(c, env, p, H){
    var S = H.S, W = 360, svg;
    if(p.mode === 'pregnancy'){
      var D = env[p.d], Hh = 150; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
      var L = 16, R = 344, y = 70; function x(dd){ return L + clamp(dd, 0, 294) / 294 * (R - L); }
      [[0, 98, '1st trimester'], [98, 196, '2nd trimester'], [196, 294, '3rd trimester']].forEach(function(t, i){ svg.appendChild(S('rect', { x: x(t[0]), y: y - 14, width: x(t[1]) - x(t[0]) - 2, height: 28, rx: 6, 'class': 'ca-tri t' + i })); svg.appendChild(S('text', { x: (x(t[0]) + x(t[1])) / 2, y: y + 4, 'text-anchor': 'middle', 'class': 'ca-in' }, t[2])); });
      for(var w = 0; w <= 42; w += 4){ svg.appendChild(S('line', { x1: x(w * 7), x2: x(w * 7), y1: y + 16, y2: y + 20, 'class': 'cp-grid' })); svg.appendChild(S('text', { x: x(w * 7), y: y + 32, 'text-anchor': 'middle', 'class': 'cp-tick' }, String(w))); }
      svg.appendChild(S('text', { x: R, y: y + 46, 'text-anchor': 'end', 'class': 'cp-tick' }, 'weeks since the last period began'));
      svg.appendChild(S('path', { d: 'M' + x(14) + ',' + (y - 20) + ' v-10', 'class': 'ca-pinl ca-p2' })); svg.appendChild(S('text', { x: x(14), y: y - 34, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'fertilization ≈ day 14'));
      svg.appendChild(S('path', { d: 'M' + x(280) + ',' + (y - 20) + ' v-10', 'class': 'ca-pinl ca-p2' })); svg.appendChild(S('text', { x: x(280), y: y - 34, 'text-anchor': 'end', 'class': 'cp-tick' }, 'due: day 280'));
      if(!H.hid(p.wk)){ svg.appendChild(S('path', { d: 'M' + x(D) + ',' + (y - 16) + ' l-6,-10 h12 Z', 'class': 'ca-pin ca-p1' })); svg.appendChild(S('line', { x1: x(D), x2: x(D), y1: y - 14, y2: y + 14, 'class': 'ca-pinl ca-p1' })); }
      svg.appendChild(S('text', { x: W / 2, y: 18, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, 'day ' + H.fmt(D, 0) + ': ' + H.val(c, env, p.wk) + ' weeks ' + H.val(c, env, p.dd) + ' days'));
      svg.appendChild(S('text', { x: W / 2, y: Hh - 6, 'text-anchor': 'middle', 'class': 'cp-t' }, 'trimester ' + H.val(c, env, p.tri) + '; fetal age about ' + H.val(c, env, p.fwk) + ' weeks'));
      return { svg: svg, cap: 'Pregnancy is dated from the first day of the last period, about two weeks before fertilization; the due date is day 280 (40 weeks). Day ' + H.fmt(D, 0) + ' is <b>' + H.val(c, env, p.wk) + ' weeks ' + H.val(c, env, p.dd) + ' days</b>, in trimester ' + H.val(c, env, p.tri) + '.' };
    }
    // a menstrual cycle: days in a strip, ovulation lut days before the next period
    var Ln = Math.round(env[p.l]), lut = env[p.lut], ov = env[p.ov], Hh2 = 140; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh2 });
    var L2 = 12, R2 = 348, cw = (R2 - L2) / Ln, y2 = 52;
    for(var d = 1; d <= Ln; d++){
      var cls = d <= 5 ? 'ca-mens' : d <= ov ? 'ca-foll' : 'ca-lut';
      var isOv = Math.abs(d - ov) < 0.5 && !H.hid(p.ov);
      svg.appendChild(S('rect', { x: L2 + (d - 1) * cw + 0.5, y: y2, width: cw - 1, height: 26, rx: 2, 'class': 'ca-day ' + cls + (isOv ? ' is-ov' : '') }));
      if(d === 1 || d % 7 === 0 || d === Ln) svg.appendChild(S('text', { x: L2 + (d - 0.5) * cw, y: y2 + 40, 'text-anchor': 'middle', 'class': 'cp-tick' }, String(d)));
    }
    if(!H.hid(p.ov)) svg.appendChild(S('text', { x: clamp(L2 + (ov - 0.5) * cw, 40, W - 40), y: y2 - 8, 'text-anchor': 'middle', 'class': 'cp-v ca-p1-t' }, 'ovulation ≈ day ' + H.val(c, env, p.ov)));
    svg.appendChild(S('text', { x: L2, y: y2 + 58, 'class': 'cp-tick' }, 'period'));
    svg.appendChild(S('text', { x: L2 + (5 + (ov - 5) / 2) * cw, y: y2 + 58, 'text-anchor': 'middle', 'class': 'cp-tick' }, H.hid(p.ov) ? 'follicular phase: varies' : 'follicular: ' + H.fmt(env[p.fol], 0) + ' days, varies'));
    svg.appendChild(S('text', { x: R2, y: y2 + 58, 'text-anchor': 'end', 'class': 'cp-tick' }, 'luteal: about ' + H.fmt(lut, 0) + ' days'));
    svg.appendChild(S('text', { x: W / 2, y: 18, 'text-anchor': 'middle', 'class': 'cp-v' }, 'a ' + Ln + '-day cycle'));
    return { svg: svg, cap: 'The luteal phase after ovulation is the steadier part (about ' + H.fmt(lut, 0) + ' days); cycle length varies mostly in the follicular phase. Counting back from the next period puts ovulation near <b>day ' + H.val(c, env, p.ov) + '</b>.' };
  };

  /* ------------------------------------------------------------ surface */
  F.surface = function(c, env, p, H){
    var S = H.S, W = 360, svg;
    if(p.mode === 'drops'){
      var r = env[p.r], gain = env[p.gain], Hh = 180; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
      svg.appendChild(S('circle', { cx: 80, cy: 90, r: 56, 'class': 'ca-fat' }));
      svg.appendChild(S('text', { x: 80, y: 168, 'text-anchor': 'middle', 'class': 'cp-t' }, 'one drop, D = ' + H.fmt(env[p.D], 2) + ' mm'));
      svg.appendChild(S('path', { d: 'M146,90 H172', 'class': 'ca-flow' })); svg.appendChild(S('path', { d: 'M166,84 l8,6 l-8,6', 'class': 'ca-flowh' }));
      svg.appendChild(S('text', { x: 160, y: 76, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'bile salts'));
      // the same fat in small droplets: a sample of them at the matching size
      var k = Math.round(clamp(r, 2, 8)), sr = 56 / k, cnt = 0;
      for(var iy = 0; iy < k && cnt < 64; iy++) for(var ix = 0; ix < k && cnt < 64; ix++){ svg.appendChild(S('circle', { cx: 196 + sr + ix * sr * 2, cy: 34 + sr + iy * sr * 2, r: sr * 0.94, 'class': 'ca-fat' })); cnt++; }
      svg.appendChild(S('text', { x: 268, y: 168, 'text-anchor': 'middle', 'class': 'cp-t' }, r > 8 ? 'a sample: drawn at ' + k + ' per diameter' : k + ' droplets across'));
      svg.appendChild(S('text', { x: 268, y: 18, 'text-anchor': 'middle', 'class': 'cp-v' }, H.val(c, env, p.n) + ' droplets'));
      svg.appendChild(S('text', { x: 80, y: 20, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, 'surface × ' + H.val(c, env, p.gain)));
      return { svg: svg, cap: 'Splitting one drop into droplets 1/' + H.fmt(r, 0) + ' its diameter gives ' + H.fmt(r, 0) + '³ droplets, each with 1/' + H.fmt(r, 0) + '² the surface: in total <b>' + H.val(c, env, p.gain) + ' times</b> the surface for lipase to work on, from the same fat.' };
    }
    // folds, villi, microvilli: three zooms
    var Hh2 = 190; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh2 });
    function panel(x, title, val, draw){ svg.appendChild(S('rect', { x: x, y: 26, width: 104, height: 104, rx: 10, 'class': 'ca-zoom' })); draw(x); svg.appendChild(S('text', { x: x + 52, y: 18, 'text-anchor': 'middle', 'class': 'cp-t' }, title)); svg.appendChild(S('text', { x: x + 52, y: 150, 'text-anchor': 'middle', 'class': 'cp-v' }, '× ' + val)); }
    panel(8, 'circular folds', H.fmt(env[p.f], 0), function(x){ var d = 'M' + (x + 4) + ',100'; for(var i = 0; i < 4; i++){ d += ' C' + (x + 10 + i * 24) + ',100 ' + (x + 10 + i * 24) + ',44 ' + (x + 16 + i * 24) + ',44 C' + (x + 22 + i * 24) + ',44 ' + (x + 22 + i * 24) + ',100 ' + (x + 28 + i * 24) + ',100'; } svg.appendChild(S('path', { d: d + ' L' + (x + 100) + ',100 L' + (x + 100) + ',126 L' + (x + 4) + ',126 Z', 'class': 'ca-mucosa' })); });
    panel(128, 'villi', H.fmt(env[p.v], 0), function(x){ for(var i = 0; i < 6; i++) svg.appendChild(S('rect', { x: x + 8 + i * 16, y: 46, width: 11, height: 64, rx: 5.5, 'class': 'ca-villus' })); svg.appendChild(S('rect', { x: x + 4, y: 106, width: 96, height: 20, 'class': 'ca-mucosa' })); });
    panel(248, 'microvilli', H.fmt(env[p.m], 0), function(x){ svg.appendChild(S('rect', { x: x + 6, y: 70, width: 92, height: 56, rx: 8, 'class': 'ca-cellb' })); for(var i = 0; i < 18; i++) svg.appendChild(S('rect', { x: x + 9 + i * 5, y: 46, width: 3, height: 26, rx: 1.5, 'class': 'ca-mv2' })); svg.appendChild(S('circle', { cx: x + 52, cy: 102, r: 10, 'class': 'cp-nuc' })); });
    [112, 232].forEach(function(xx){ svg.appendChild(S('path', { d: 'M' + xx + ',78 h12', 'class': 'ca-flow' })); });
    svg.appendChild(S('text', { x: W / 2, y: 178, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, H.fmt(env[p.f], 0) + ' × ' + H.fmt(env[p.v], 0) + ' × ' + H.fmt(env[p.m], 0) + ' = ' + H.val(c, env, p.total) + ' times a flat tube'));
    return { svg: svg, cap: 'Each level of folding multiplies the surface the one before made: folds, then villi on the folds, then microvilli on each absorptive cell. Together: <b>' + H.val(c, env, p.total) + ' times</b> the inside of a smooth tube.' };
  };

  /* ------------------------------------------------------------ membrane */
  F.membrane = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 200, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh }), cap;
    function scatter(x0, y0, w, h, n, cls, seed, r){ for(var i = 0; i < n; i++){ var a = ((i + 1) * 0.7548776662 + (seed || 0)) % 1, b = ((i + 1) * 0.5698402910 + 0.2 + (seed || 0)) % 1; svg.appendChild(S('circle', { cx: (x0 + 5 + a * (w - 10)).toFixed(1), cy: (y0 + 5 + b * (h - 10)).toFixed(1), r: r || 3, 'class': cls })); } }
    function bilayer(x, y1, y2){ for(var y = y1; y < y2; y += 8){ svg.appendChild(S('circle', { cx: x - 5, cy: y + 4, r: 3.2, 'class': 'ca-head' })); svg.appendChild(S('circle', { cx: x + 5, cy: y + 4, r: 3.2, 'class': 'ca-head' })); } svg.appendChild(S('rect', { x: x - 2, y: y1, width: 4, height: y2 - y1, 'class': 'ca-tails' })); }
    if(p.mode === 'sglt'){
      var nao = env[p.nao], nai = env[p.nai], go = env[p.go], gi = env[p.gi];
      svg.appendChild(S('rect', { x: 0, y: 20, width: 175, height: 150, 'class': 'ca-lumen' })); svg.appendChild(S('rect', { x: 185, y: 20, width: 175, height: 150, 'class': 'ca-cyto' }));
      bilayer(180, 20, 170);
      svg.appendChild(S('rect', { x: 170, y: 80, width: 20, height: 34, rx: 6, 'class': 'ca-transp' }));
      svg.appendChild(S('path', { d: 'M150,90 C170,92 186,92 206,96 M150,104 C170,104 186,104 206,108', 'class': 'ca-span' }));
      scatter(4, 24, 160, 140, Math.round(clamp(nao / 5, 1, 32)), 'ca-na', 0); scatter(194, 24, 160, 140, Math.round(clamp(nai / 5, 1, 32)), 'ca-na', 0.3);
      scatter(4, 24, 160, 140, Math.round(clamp(go * 2, 1, 24)), 'ca-gl', 0.5, 3.6); scatter(194, 24, 160, 140, Math.round(clamp(gi * 2, 1, 24)), 'ca-gl', 0.7, 3.6);
      svg.appendChild(S('text', { x: 88, y: 14, 'text-anchor': 'middle', 'class': 'cp-t' }, 'gut lumen'));
      svg.appendChild(S('text', { x: 272, y: 14, 'text-anchor': 'middle', 'class': 'cp-t' }, 'inside the cell'));
      svg.appendChild(S('text', { x: 88, y: 188, 'text-anchor': 'middle', 'class': 'cp-v' }, 'Na+ ' + H.fmt(nao, 0) + ', glucose ' + H.fmt(go, 1) + ' mM'));
      svg.appendChild(S('text', { x: 272, y: 188, 'text-anchor': 'middle', 'class': 'cp-v' }, 'Na+ ' + H.fmt(nai, 0) + ', glucose ' + H.fmt(gi, 1) + ' mM'));
      svg.appendChild(S('text', { x: 180, y: 76, 'text-anchor': 'middle', 'class': 'cp-t' }, 'SGLT1'));
      cap = 'Purple: Na+; gold: glucose. Na+ is ' + H.val(c, env, p.nar) + ' times higher in the lumen, a downhill push SGLT1 uses to carry glucose in with it, even though glucose is already ' + H.val(c, env, p.gr) + ' times higher inside the cell (uphill).';
    } else if(p.mode === 'placenta'){
      var a = env[p.a] / 100, g = env[p.g] / 100, t = env[p.t];
      svg.appendChild(S('rect', { x: 0, y: 20, width: 360, height: 60, 'class': 'ca-mat' })); svg.appendChild(S('rect', { x: 0, y: 120, width: 360, height: 60, 'class': 'ca-fet' }));
      var bw = clamp(a, 0.1, 1.5) / 1.5 * 340, th = clamp(t, 0.5, 3) * 12;
      svg.appendChild(S('rect', { x: 10, y: 100 - th / 2, width: 340, height: th, 'class': 'ca-scar' }));
      svg.appendChild(S('rect', { x: 10, y: 100 - th / 2, width: bw, height: th, 'class': 'ca-barrier' }));
      var n = Math.round(clamp(env[p.rate] / 10, 0, 16));
      for(var i = 0; i < n; i++){ var xx = 20 + (i + 0.5) * (bw - 20) / Math.max(1, n); svg.appendChild(S('path', { d: 'M' + xx.toFixed(1) + ',60 V' + (128 + 6) , 'class': 'ca-o2arrow' })); svg.appendChild(S('path', { d: 'M' + (xx - 4).toFixed(1) + ',' + (128) + ' l4,8 l4,-8', 'class': 'ca-o2head' })); }
      svg.appendChild(S('text', { x: 10, y: 14, 'class': 'cp-t' }, 'mother’s blood (PO2 difference ' + H.fmt(env[p.g], 0) + '% of normal)'));
      svg.appendChild(S('text', { x: 10, y: 196, 'class': 'cp-t' }, 'fetal blood'));
      svg.appendChild(S('text', { x: 350, y: 196, 'text-anchor': 'end', 'class': 'cp-v' }, 'transfer ' + H.val(c, env, p.rate) + '% of normal'));
      svg.appendChild(S('text', { x: 350, y: 116 - th / 2 - 22, 'text-anchor': 'end', 'class': 'cp-t ca-halo2' }, 'barrier: area ' + H.fmt(env[p.a], 0) + '%, thickness × ' + H.fmt(t, 1)));
      cap = 'Diffusion across the barrier grows with its working area (the green length) and the oxygen pressure difference, and shrinks with its thickness. Here: ' + H.fmt(a, 2) + ' × ' + H.fmt(g, 2) + ' ÷ ' + H.fmt(t, 1) + ' = <b>' + H.val(c, env, p.rate) + '% of normal</b> (each arrow about 10%).';
    } else if(p.mode === 'bound'){
      var tot = env[p.t];
      [[env[p.f1], env[p.b1], 'before', 0], [env[p.f2], env[p.b2], 'after', 1]].forEach(function(st, i){
        var x0 = 14 + i * 176, freeN = Math.round(clamp((100 - st[1]) / 100 * 60, 0, 60)), boundN = 60 - freeN;
        svg.appendChild(S('rect', { x: x0, y: 24, width: 160, height: 130, rx: 10, 'class': 'ca-plasmabg' }));
        for(var k = 0; k < 60; k++){
          var cx = x0 + 12 + (k % 10) * 15, cy = 38 + Math.floor(k / 10) * 19;
          if(k < boundN){ svg.appendChild(S('rect', { x: cx - 6, y: cy - 4, width: 12, height: 9, rx: 4, 'class': 'ca-carrier' })); svg.appendChild(S('circle', { cx: cx, cy: cy - 4, r: 3, 'class': 'ca-horm' })); }
          else svg.appendChild(S('circle', { cx: cx, cy: cy, r: 3.6, 'class': 'ca-horm ca-free' }));
        }
        svg.appendChild(S('text', { x: x0 + 80, y: 16, 'text-anchor': 'middle', 'class': 'cp-t' }, st[2] + ': ' + H.fmt(st[1], 1) + '% bound'));
        svg.appendChild(S('text', { x: x0 + 80, y: 172, 'text-anchor': 'middle', 'class': 'cp-v' }, 'free ' + (i ? H.val(c, env, p.f2) : H.val(c, env, p.f1))));
      });
      svg.appendChild(S('text', { x: W / 2, y: 192, 'text-anchor': 'middle', 'class': 'cp-t' }, '60 dots stand for all ' + H.fmt(tot, 0) + ' units; ringed: free, can act'));
      cap = 'Only free hormone leaves the blood and binds its target cells; bound hormone rides on carrier proteins. A small change in the bound share is a big change in the free part: <b>' + H.val(c, env, p.ratio) + ' times</b> as much free hormone.';
    } else {
      // compartments: potassium shift or a water load
      var icfW = 220, ecfW = 110;
      if(p.mode === 'kshift'){
        var mov = env[p.mov];
        svg.appendChild(S('rect', { x: 10, y: 30, width: icfW, height: 120, rx: 18, 'class': 'ca-icf' })); svg.appendChild(S('rect', { x: 240, y: 30, width: ecfW, height: 120, rx: 18, 'class': 'ca-ecf' }));
        scatter(16, 36, icfW - 12, 108, 50, 'ca-k', 0); scatter(246, 36, ecfW - 12, 108, 4, 'ca-k', 0.4);
        svg.appendChild(S('text', { x: 120, y: 22, 'text-anchor': 'middle', 'class': 'cp-t' }, 'inside cells: ' + H.fmt(env[p.kc], 0) + ' mmol K+'));
        svg.appendChild(S('text', { x: 295, y: 22, 'text-anchor': 'middle', 'class': 'cp-t' }, 'ECF: ' + H.fmt(env[p.v], 0) + ' L'));
        var outw = mov >= 0;
        svg.appendChild(S('path', { d: outw ? 'M210,90 H262' : 'M262,90 H210', 'class': 'ca-flow' }));
        svg.appendChild(S('path', { d: outw ? 'M256,84 l8,6 l-8,6' : 'M216,84 l-8,6 l8,6', 'class': 'ca-flowh' }));
        svg.appendChild(S('text', { x: 236, y: 112, 'text-anchor': 'middle', 'class': 'cp-v' }, H.fmt(Math.abs(mov), 0) + ' mmol'));
        svg.appendChild(S('text', { x: 295, y: 170, 'text-anchor': 'middle', 'class': 'cp-v' }, H.fmt(env[p.k0], 1) + ' → ' + H.val(c, env, p.k1) + ' mmol/L'));
        svg.appendChild(S('text', { x: 120, y: 170, 'text-anchor': 'middle', 'class': 'cp-t' }, 'a ' + H.fmt(Math.abs(env[p.f]), 1) + '% share of it moves'));
        cap = 'Nearly all the body’s potassium is inside cells; the ECF holds very little. Moving just ' + H.fmt(Math.abs(env[p.f]), 1) + '% of the cell store (' + H.fmt(Math.abs(mov), 0) + ' mmol) into ' + H.fmt(env[p.v], 0) + ' L of ECF changes plasma K+ by ' + H.fmt(Math.abs(env[p.dk]), 2) + ' mmol/L, to <b>' + H.val(c, env, p.k1) + '</b>.';
      } else {
        var Wt = env[p.w], Dd = env[p.d];
        // each compartment as a tank filled to its level; the new water (pale) adds the same share to each level
        var add = clamp(Dd / Wt, 0, 0.3), base = 92, top0 = 150 - base, rise = base * add;
        [[10, icfW, 'ca-icf'], [240, ecfW, 'ca-ecf']].forEach(function(t){
          svg.appendChild(S('rect', { x: t[0], y: 24, width: t[1], height: 126, rx: 14, 'class': 'ca-tank' }));
          svg.appendChild(S('rect', { x: t[0] + 3, y: top0, width: t[1] - 6, height: base - 3, rx: 10, 'class': t[2] }));
          svg.appendChild(S('rect', { x: t[0] + 3, y: top0 - rise, width: t[1] - 6, height: rise + 1, rx: 3, 'class': 'ca-newwater' }));
        });
        svg.appendChild(S('text', { x: 120, y: 112, 'text-anchor': 'middle', 'class': 'cp-v' }, 'cells: +' + H.val(c, env, p.inc) + ' L'));
        svg.appendChild(S('text', { x: 295, y: 112, 'text-anchor': 'middle', 'class': 'cp-v' }, 'ECF: +' + H.val(c, env, p.ine) + ' L'));
        svg.appendChild(S('text', { x: 120, y: 16, 'text-anchor': 'middle', 'class': 'cp-t' }, 'inside cells: about 2/3'));
        svg.appendChild(S('text', { x: 295, y: 16, 'text-anchor': 'middle', 'class': 'cp-t' }, 'ECF: about 1/3'));
        svg.appendChild(S('text', { x: 180, y: 172, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, 'osmolality ' + H.fmt(env[p.o], 0) + ' → ' + H.val(c, env, p.o2) + ' mOsm/kg'));
        svg.appendChild(S('text', { x: 180, y: 190, 'text-anchor': 'middle', 'class': 'cp-t' }, H.fmt(Dd, 1) + ' L of water spreads through all ' + H.fmt(Wt, 0) + ' L of body water'));
        cap = 'Water crosses cell membranes freely, so a drink of plain water spreads through all the body water, about two thirds into cells and one third into the ECF (the pale tops). The same solute in more water: osmolality falls to <b>' + H.val(c, env, p.o2) + '</b>.';
      }
    }
    return { svg: svg, cap: cap };
  };

  /* ------------------------------------------------------------ channel */
  /* stages: [{ in:[{key,label}], out:[{key,label}] }] drawn along a tube whose width is the flow */
  F.channel = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 210, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh }), y = 104, x = 16;
    function v(f){ return f.expr ? H.evaluate(f.expr, env) : env[f.key]; }
    var flow = 0, maxF = 0, segs = [], st = p.steps;
    st.forEach(function(s){ (s['in'] || []).forEach(function(f){ flow += Math.max(0, v(f)); }); maxF = Math.max(maxF, flow); (s.out || []).forEach(function(f){ flow -= Math.max(0, v(f)); }); });
    var k = 70 / Math.max(maxF, 1e-9), segW = (W - 40) / st.length;
    flow = 0;
    st.forEach(function(s, i){
      var x0 = x + i * segW;
      var firstOnly = i === 0 && (s['in'] || []).length === 1;
      (s['in'] || []).forEach(function(f, j){ var a = Math.max(0, v(f)); flow += a; var w = clamp(a * k, 1.5, 12);
        if(!firstOnly) svg.appendChild(S('path', { d: 'M' + (x0 + 10 + j * 12) + ',' + (y - 62) + ' C' + (x0 + 10 + j * 12) + ',' + (y - 36) + ' ' + (x0 + 20 + j * 10) + ',' + (y - 26) + ' ' + (x0 + 34 + j * 6) + ',' + (y - 10), 'class': 'ca-inflow', style: 'stroke-width:' + w.toFixed(1) })); });
      var before = flow;
      (s.out || []).forEach(function(f){ flow -= Math.max(0, v(f)); });
      var h0 = Math.max(2, before * k), h1 = Math.max(2, flow * k);
      svg.appendChild(S('path', { d: 'M' + x0 + ',' + (y - h0 / 2) + ' C' + (x0 + segW * 0.6) + ',' + (y - h0 / 2) + ' ' + (x0 + segW * 0.5) + ',' + (y - h1 / 2) + ' ' + (x0 + segW) + ',' + (y - h1 / 2) + ' L' + (x0 + segW) + ',' + (y + h1 / 2) + ' C' + (x0 + segW * 0.5) + ',' + (y + h1 / 2) + ' ' + (x0 + segW * 0.6) + ',' + (y + h0 / 2) + ' ' + x0 + ',' + (y + h0 / 2) + ' Z', 'class': 'ca-stream ' + (p.tone || '') }));
      (s.out || []).forEach(function(f, j){ var a = Math.max(0, v(f)), w = clamp(a * k, 1.5, 14);
        svg.appendChild(S('path', { d: 'M' + (x0 + segW * 0.45 + j * 12) + ',' + (y + h0 / 2 - 4) + ' C' + (x0 + segW * 0.45 + j * 12) + ',' + (y + 40) + ' ' + (x0 + segW * 0.6 + j * 12) + ',' + (y + 52) + ' ' + (x0 + segW * 0.7 + j * 12) + ',' + (y + 66), 'class': 'ca-outflow', style: 'stroke-width:' + w.toFixed(1) }));
        svg.appendChild(S('text', { x: x0 + segW * 0.5, y: y + 84 + j * 13, 'text-anchor': 'middle', 'class': 'cp-tick ca-out-t' }, f.label + ' ' + (H.hid(f.key) ? '?' : H.fmt(a, f.dp != null ? f.dp : H.dpOf(c, f.key)))));
      });
      if(s.name) svg.appendChild(S('text', { x: x0 + segW / 2, y: y - (s['in'] && s['in'].length && !firstOnly ? 72 : Math.max(h0, h1) / 2 + 10), 'text-anchor': 'middle', 'class': 'cp-t' }, s.name));
      var ins = firstOnly ? [] : s['in'] || [], two = ins.length > 3;
      ins.forEach(function(f, j){ svg.appendChild(S('text', { x: x0 + 4 + (two ? (j % 2) * 112 : 0), y: 12 + (two ? Math.floor(j / 2) : j) * 12, 'class': 'cp-tick ca-in-t' }, f.label + ' ' + (H.hid(f.key) ? '?' : H.fmt(v(f), H.dpOf(c, f.key))))); });
    });
    var endX = x + st.length * segW;
    svg.appendChild(S('path', { d: 'M' + endX + ',' + y + ' h10 m-6,-5 l6,5 l-6,5', 'class': 'ca-endarrow' }));
    svg.appendChild(S('text', { x: W - 4, y: y + Math.max(4, flow * k / 2) + 16, 'text-anchor': 'end', 'class': 'cp-v' }, p.end + ' ' + H.val(c, env, p.endKey) + (p.unit ? ' ' + p.unit : '')));
    return { svg: svg, cap: fillCap(p.cap, c, env, H) };
  };

  /* ------------------------------------------------------------ sarcomere */
  F.sarcomere = function(c, env, p, H){
    var S = H.S, W = 360, svg;
    function sarc(g, x0, y0, sl, thick, thin, k, labels){
      // Z discs, thin filaments from each disc, thick filament centered with M line
      var z1 = x0, z2 = x0 + sl * k, mid = (z1 + z2) / 2;
      g.appendChild(S('path', { d: 'M' + z1 + ',' + (y0 - 20) + ' l5,10 l-5,10 l5,10 l-5,10', 'class': 'ca-z' }));
      g.appendChild(S('path', { d: 'M' + z2 + ',' + (y0 - 20) + ' l5,10 l-5,10 l5,10 l-5,10', 'class': 'ca-z' }));
      var tl = Math.min(thin, sl / 2) * k;
      [-12, -4, 4, 12].forEach(function(dy){ g.appendChild(S('line', { x1: z1 + 2, x2: z1 + tl, y1: y0 + dy, y2: y0 + dy, 'class': 'ca-thin' })); g.appendChild(S('line', { x1: z2 + 2, x2: z2 - tl, y1: y0 + dy, y2: y0 + dy, 'class': 'ca-thin' })); });
      [-8, 0, 8].forEach(function(dy){ g.appendChild(S('rect', { x: mid - thick * k / 2, y: y0 + dy - 2.6, width: thick * k, height: 5.2, rx: 2.6, 'class': 'ca-thick' })); });
      g.appendChild(S('line', { x1: mid, x2: mid, y1: y0 - 16, y2: y0 + 16, 'class': 'ca-mline' }));
      if(labels){
        var A1 = mid - thick * k / 2, A2 = mid + thick * k / 2, Hz = Math.max(0, sl - 2 * thin) * k;
        g.appendChild(S('path', { d: 'M' + A1 + ',' + (y0 + 26) + ' H' + A2, 'class': 'ca-span' })); g.appendChild(S('text', { x: mid, y: y0 + 38, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'A ' + H.fmt(thick, 2)));
        g.appendChild(S('path', { d: 'M' + z1 + ',' + (y0 - 26) + ' H' + A1 + ' M' + A2 + ',' + (y0 - 26) + ' H' + z2, 'class': 'ca-span ca-i' }));
        g.appendChild(S('text', { x: mid, y: y0 - 30, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'I band ' + H.fmt(Math.max(0, sl - thick), 2) + ' (a half at each end)'));
        if(Hz > 0){ g.appendChild(S('path', { d: 'M' + (mid - Hz / 2) + ',' + (y0 + 46) + ' H' + (mid + Hz / 2), 'class': 'ca-span ca-h' })); }
        g.appendChild(S('text', { x: mid, y: y0 + 58, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'H ' + H.fmt(Math.max(0, sl - 2 * thin), 2)));
      }
    }
    if(p.mode === 'bands'){
      var Hh = 220; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
      var s1 = env[p.s1], s2 = env[p.s2], th = env[p.thick], tn = env[p.thin], k = 300 / Math.max(s1, s2, 3);
      var g1 = S('g', {}), g2 = S('g', {}); svg.appendChild(g1); svg.appendChild(g2);
      sarc(g1, 180 - s1 * k / 2, 46, s1, th, tn, k, true); sarc(g2, 180 - s2 * k / 2, 152, s2, th, tn, k, true);
      svg.appendChild(S('text', { x: 4, y: 12, 'class': 'cp-t' }, 'before: ' + H.fmt(s1, 2) + ' µm'));
      svg.appendChild(S('text', { x: 4, y: 118, 'class': 'cp-t' }, 'after: ' + H.fmt(s2, 2) + ' µm'));
      return { svg: svg, cap: 'The filaments keep their length; the thin ones slide past the thick ones toward the M line. So the A band (thick filament) stays ' + H.fmt(th, 2) + ' µm while the I band and H zone shrink as the Z discs come closer: the I band goes from ' + H.val(c, env, p.i1) + ' to <b>' + H.val(c, env, p.i2) + ' µm</b>.' };
    }
    if(p.mode === 'series' || p.mode === 'fiber'){
      var Hh2 = p.mode === 'fiber' ? 196 : 170; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh2 });
      var sl1 = env[p.s1 || p.s], n = env[p.n];
      // a fiber, then a zoom on a myofibril with sarcomeres end to end
      svg.appendChild(S('rect', { x: 14, y: 20, width: 332, height: 30, rx: 15, 'class': 'ca-fiber' }));
      for(var i = 0; i < 40; i++) svg.appendChild(S('line', { x1: 20 + i * 8.2, x2: 20 + i * 8.2, y1: 22, y2: 48, 'class': 'ca-stri' }));
      svg.appendChild(S('text', { x: 180, y: 14, 'text-anchor': 'middle', 'class': 'cp-t' }, 'one fiber, ' + H.fmt(env[p.l], 1) + ' cm'));
      svg.appendChild(S('path', { d: 'M150,50 L20,76 M210,50 L340,76', 'class': 'ca-zoomline' }));
      var k2 = 52 / sl1, g = S('g', {}); svg.appendChild(g);
      for(var j = 0; j < 6; j++) sarc(g, 24 + j * sl1 * k2, 104, sl1, 1.6, 1.0, k2, false);
      if(p.mode === 'fiber'){ var sl2 = env[p.s2], g3 = S('g', {}); svg.appendChild(g3); for(var m = 0; m < 6; m++) sarc(g3, 24 + m * sl2 * k2, 154, sl2, 1.6, 1.0, k2, false); svg.appendChild(S('text', { x: 346, y: 134, 'text-anchor': 'end', 'class': 'cp-t' }, 'after: each ' + H.fmt(sl2, 2) + ' µm')); }
      svg.appendChild(S('text', { x: 346, y: 80, 'text-anchor': 'end', 'class': 'cp-t' }, (p.mode === 'fiber' ? 'at rest: ' : '') + 'each ' + H.fmt(sl1, 2) + ' µm'));
      svg.appendChild(S('text', { x: 180, y: p.mode === 'fiber' ? Hh2 - 4 : 140, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, H.val(c, env, p.n) + ' sarcomeres in series' + (p.mode === 'fiber' ? ': shortens ' + H.val(c, env, p.cm) + ' cm' : '')));
      return { svg: svg, cap: p.mode === 'fiber' ? 'Every sarcomere along the fiber shortens by the same ' + H.fmt(env[p.d], 2) + ' µm, and they are in series, so the shortenings add: ' + H.val(c, env, p.n) + ' sarcomeres × ' + H.fmt(env[p.d], 2) + ' µm = <b>' + H.val(c, env, p.cm) + ' cm</b> (' + H.val(c, env, p.pct) + '% of its length).' : 'A myofibril is sarcomeres end to end along the whole fiber: ' + H.fmt(env[p.l], 1) + ' cm ÷ ' + H.fmt(sl1, 2) + ' µm = <b>' + H.val(c, env, p.n) + '</b> of them.' };
    }
  };

  /* ------------------------------------------------------------ lever */
  F.lever = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 190, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
    var dE = env[p.de], dL = env[p.dl], k = 290 / Math.max(dL, dE, 1), jx = 40, y = 110;
    // upper arm bone and the elbow joint, forearm as the lever with the hand at the load arm
    svg.appendChild(S('path', { d: 'M' + jx + ',' + (y - 8) + ' L' + (jx - 14) + ',' + (y - 96), 'class': 'ca-humerus' }));
    svg.appendChild(S('circle', { cx: jx, cy: y, r: 8, 'class': 'ca-joint' }));
    var ex = jx + dE * k, lx = jx + dL * k;
    svg.appendChild(S('line', { x1: jx, x2: lx + 10, y1: y, y2: y, 'class': 'ca-forearm' }));
    // biceps from the shoulder to its insertion
    svg.appendChild(S('path', { d: 'M' + (jx - 10) + ',' + (y - 92) + ' C' + (jx + 14) + ',' + (y - 70) + ' ' + (ex + 6) + ',' + (y - 40) + ' ' + ex + ',' + (y - 4), 'class': 'ca-biceps' }));
    svg.appendChild(S('text', { x: ex + 8, y: y - 50, 'class': 'cp-t' }, p.mode === 'range' ? 'muscle (insertion)' : 'muscle pull ' + H.val(c, env, p.e) + ' N'));
    // the load in the hand
    svg.appendChild(S('rect', { x: lx - 12, y: y + 6, width: 24, height: 24, rx: 4, 'class': 'ca-load' }));
    svg.appendChild(S('text', { x: lx, y: y + 46, 'text-anchor': 'middle', 'class': 'cp-t' }, p.mode === 'range' ? 'hand' : 'load ' + H.fmt(env[p.l], 0) + ' N'));
    svg.appendChild(S('path', { d: 'M' + jx + ',' + (y + 58) + ' H' + ex, 'class': 'ca-span ca-p2-s' }));
    svg.appendChild(S('text', { x: (jx + ex) / 2, y: y + 72, 'text-anchor': 'middle', 'class': 'cp-tick' }, H.fmt(dE, 1) + ' cm'));
    svg.appendChild(S('path', { d: 'M' + jx + ',' + (y + 80) + ' H' + lx, 'class': 'ca-span' }));
    svg.appendChild(S('text', { x: (jx + lx) / 2, y: y + 76 + 18, 'text-anchor': 'middle', 'class': 'cp-tick' }, H.fmt(dL, 1) + ' cm to the load'));
    svg.appendChild(S('text', { x: jx, y: y + 24, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'elbow'));
    if(p.mode === 'range'){
      var s = env[p.s], h = env[p.h], ang = Math.atan2(s, dE);
      var lx2 = jx + Math.cos(ang) * dL * k, ly2 = y - Math.sin(ang) * dL * k, ex2 = jx + Math.cos(ang) * dE * k, ey2 = y - Math.sin(ang) * dE * k;
      svg.appendChild(S('line', { x1: jx, x2: lx2, y1: y, y2: ly2, 'class': 'ca-forearm ca-ghost2' }));
      svg.appendChild(S('path', { d: 'M' + ex + ',' + y + ' L' + ex2.toFixed(1) + ',' + ey2.toFixed(1), 'class': 'ca-move ca-p2-s' }));
      svg.appendChild(S('path', { d: 'M' + lx + ',' + y + ' L' + lx2.toFixed(1) + ',' + ly2.toFixed(1), 'class': 'ca-move' }));
      svg.appendChild(S('text', { x: Math.min(lx2, 330), y: Math.max(14, ly2 - 8), 'text-anchor': 'end', 'class': 'cp-v' }, 'hand moves ' + H.val(c, env, p.h) + ' cm'));
      svg.appendChild(S('text', { x: 180, y: 14, 'text-anchor': 'middle', 'class': 'cp-t' }, 'insertion moves ' + H.fmt(s, 1) + ' cm'));
      return { svg: svg, cap: 'Both points turn through the same angle at the elbow, so the hand, ' + H.val(c, env, p.k) + ' times farther from the joint than the insertion, moves ' + H.val(c, env, p.k) + ' times as far: <b>' + H.val(c, env, p.h) + ' cm</b> for ' + H.fmt(s, 1) + ' cm of muscle shortening.' };
    }
    svg.appendChild(S('text', { x: 180, y: 14, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, 'pull ' + H.val(c, env, p.e) + ' N to hold ' + H.fmt(env[p.l], 0) + ' N'));
    return { svg: svg, cap: 'Torques balance at the elbow: pull × ' + H.fmt(dE, 1) + ' cm = load × ' + H.fmt(dL, 1) + ' cm. The muscle inserts close to the joint, so it pulls <b>' + H.val(c, env, p.e) + ' N</b>, ' + H.val(c, env, p.times) + ' times the load, and in return the hand moves fast and far.' };
  };

  /* ------------------------------------------------------------ punnett */
  F.punnett = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 200, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
    var g1, g2, cells, labelOf, tone;
    if(p.mode === 'x'){
      var m = Math.round(env[p.m]), f = Math.round(env[p.f]);
      g1 = [m >= 1 ? 'Xᵃ' : 'X', m >= 2 ? 'Xᵃ' : 'X'];   // mother's two X
      g2 = [f ? 'Xᵃ' : 'X', 'Y'];
      cells = [[g1[0], g2[0]], [g1[0], g2[1]], [g1[1], g2[0]], [g1[1], g2[1]]];
      labelOf = function(a, b){ var son = b === 'Y', n = (a === 'Xᵃ') + (b === 'Xᵃ'); return son ? (n ? 'affected son' : 'unaffected son') : n === 2 ? 'affected daughter' : n === 1 ? 'carrier daughter' : 'unaffected daughter'; };
      tone = function(t){ return /affected (son|daughter)/.test(t) && !/unaffected/.test(t) ? 'ca-aff' : /carrier/.test(t) ? 'ca-car' : 'ca-ok2'; };
    } else {
      var a1 = Math.round(env[p.a1]), a2 = Math.round(env[p.a2]);
      g1 = [a1 >= 1 ? 'A' : 'a', a1 >= 2 ? 'A' : 'a']; g2 = [a2 >= 1 ? 'A' : 'a', a2 >= 2 ? 'A' : 'a'];
      cells = [[g1[0], g2[0]], [g1[0], g2[1]], [g1[1], g2[0]], [g1[1], g2[1]]];
      labelOf = function(a, b){ var s = [a, b].sort().join(''); return s === 'AA' ? 'AA' : s === 'aa' ? 'aa' : 'Aa'; };
      tone = function(t){ return t === 'aa' ? 'ca-aff' : t === 'Aa' ? 'ca-car' : 'ca-ok2'; };
    }
    var x0 = 70, y0 = 40, cs = 66;
    svg.appendChild(S('text', { x: x0 + cs, y: 14, 'text-anchor': 'middle', 'class': 'cp-t' }, p.mode === 'x' ? 'father’s sperm' : 'parent 2’s gametes'));
    svg.appendChild(S('text', { x: 16, y: y0 + cs, 'text-anchor': 'middle', 'class': 'cp-t', transform: 'rotate(-90 16 ' + (y0 + cs) + ')' }, p.mode === 'x' ? 'mother’s eggs' : 'parent 1’s gametes'));
    g2.forEach(function(gm, j){ svg.appendChild(S('text', { x: x0 + j * cs + cs / 2, y: y0 - 8, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, gm)); });
    g1.forEach(function(gm, i){ svg.appendChild(S('text', { x: x0 - 12, y: y0 + i * cs + cs / 2 + 5, 'text-anchor': 'end', 'class': 'cp-v cp-big' }, gm)); });
    cells.forEach(function(cl, k){
      var i = Math.floor(k / 2), j = k % 2, t = labelOf(cl[0], cl[1]);
      svg.appendChild(S('rect', { x: x0 + j * cs + 2, y: y0 + i * cs + 2, width: cs - 4, height: cs - 4, rx: 8, 'class': 'ca-pcell ' + tone(t) }));
      var gt = p.mode === 'x' ? (cl[1] === 'Y' ? cl[0] + cl[1] : [cl[0], cl[1]].sort(function(a, b){ return a.length - b.length; }).join('')) : [cl[0], cl[1]].sort().join('');
      svg.appendChild(S('text', { x: x0 + j * cs + cs / 2, y: y0 + i * cs + cs / 2 - 2, 'text-anchor': 'middle', 'class': 'cp-v' }, gt));
      t.split(' ').forEach(function(w, q){ if(p.mode === 'x') svg.appendChild(S('text', { x: x0 + j * cs + cs / 2, y: y0 + i * cs + cs / 2 + 12 + q * 11, 'text-anchor': 'middle', 'class': 'cp-tick' }, w)); });
    });
    var rx = 226, ry = 56;
    (p.lines || []).forEach(function(l, q){ svg.appendChild(S('text', { x: rx, y: ry + q * 22, 'class': 'cp-v ' + (l.cls || '') }, l.label + ' ' + H.val(c, env, l.key) + '%')); });
    return { svg: svg, cap: 'Each parent passes one of their two copies, each with an even chance, so each of the four boxes is a 25% chance. ' + (p.mode === 'x' ? 'A son gets his only X from his mother, so his risk is her chance of passing the allele.' : 'Count the boxes for each genotype.') };
  };

  /* ------------------------------------------------------------ meiosis */
  F.meiosis = function(c, env, p, H){
    var S = H.S, W = 360, svg;
    if(p.mode === 'tree'){
      var P = env[p.p], Hh = 190; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
      function cell(x, y, r, cls, t){ svg.appendChild(S('circle', { cx: x, cy: y, r: r, 'class': 'ca-gcell ' + cls })); if(t) svg.appendChild(S('text', { x: x, y: y + 4, 'text-anchor': 'middle', 'class': 'ca-in' }, t)); }
      cell(60, 96, 22, 'ca-c1', '2n'); svg.appendChild(S('text', { x: 60, y: 136, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'primary'));
      [[150, 56], [150, 136]].forEach(function(q){ svg.appendChild(S('path', { d: 'M82,96 L' + (q[0] - 18) + ',' + q[1], 'class': 'ca-link' })); cell(q[0], q[1], 17, 'ca-c2', 'n'); });
      svg.appendChild(S('text', { x: 150, y: 176, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'secondary'));
      [[240, 30], [240, 76], [240, 116], [240, 162]].forEach(function(q, i){ svg.appendChild(S('path', { d: 'M' + (150 + 17) + ',' + (i < 2 ? 56 : 136) + ' L' + (q[0] - 13) + ',' + q[1], 'class': 'ca-link' })); cell(q[0], q[1], 13, 'ca-c3', ''); svg.appendChild(S('path', { d: 'M' + (q[0] + 13) + ',' + q[1] + ' c10,-4 18,4 28,0', 'class': 'ca-tail' })); });
      svg.appendChild(S('text', { x: 300, y: 14, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'spermatids'));
      svg.appendChild(S('text', { x: 300, y: 112, 'text-anchor': 'middle', 'class': 'cp-v' }, '× ' + H.fmt(P, 0) + ' primary'));
      svg.appendChild(S('text', { x: 300, y: 130, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, '= ' + H.val(c, env, p.t)));
      return { svg: svg, cap: 'Meiosis I splits each primary spermatocyte into 2 secondary spermatocytes; meiosis II splits each again: 4 spermatids, each maturing into one sperm. ' + H.fmt(P, 0) + ' primary cells give <b>' + H.val(c, env, p.t) + '</b>.' };
    }
    var n = Math.round(env[p.n]), Hh2 = 190; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh2 });
    var show = Math.min(n, 6), pal = ['#C8322B', '#3D88C9'];
    for(var i = 0; i < show; i++){
      var x = 20 + i * 28;
      svg.appendChild(S('rect', { x: x, y: 40, width: 9, height: 50 - i * 4, rx: 4.5, fill: pal[0], 'class': 'ca-chrom' }));
      svg.appendChild(S('rect', { x: x + 11, y: 40, width: 9, height: 50 - i * 4, rx: 4.5, fill: pal[1], 'class': 'ca-chrom' }));
    }
    svg.appendChild(S('text', { x: 20, y: 28, 'class': 'cp-t' }, n + ' pairs (2n = ' + H.fmt(env[p.twoN], 0) + ')' + (n > show ? ', ' + show + ' drawn' : '')));
    svg.appendChild(S('text', { x: 20, y: 110, 'class': 'cp-t' }, 'red: one parent; blue: the other'));
    // a few gametes, each taking one of each pair at random
    for(var gmt = 0; gmt < 4; gmt++){
      var gx = 210 + (gmt % 2) * 72, gy = 40 + Math.floor(gmt / 2) * 62;
      svg.appendChild(S('circle', { cx: gx + 26, cy: gy + 22, r: 28, 'class': 'ca-gamete' }));
      for(var j = 0; j < show; j++){ var pick = ((gmt * 7 + j * 3 + (gmt >> 1) * j) % 2); svg.appendChild(S('rect', { x: gx + 6 + j * 7.4, y: gy + 8, width: 5, height: 26 - j * 2, rx: 2.5, fill: pal[pick], 'class': 'ca-chrom' })); }
    }
    var tt = S('text', { x: 180, y: 160, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, '2 choices for each of ' + n + ' pairs: 2');
    tt.appendChild(S('tspan', { dy: -6, 'font-size': '70%' }, String(n))); tt.appendChild(S('tspan', { dy: 6 }, ' = ' + H.val(c, env, p.g) + ' gametes')); svg.appendChild(tt);
    svg.appendChild(S('text', { x: 180, y: 178, 'text-anchor': 'middle', 'class': 'cp-t' }, 'four of them drawn'));
    return { svg: svg, cap: 'In meiosis each pair lines up independently, so a gamete takes either member of each pair: 2 × 2 × … for ' + n + ' pairs, <b>' + H.val(c, env, p.g) + '</b> different gametes (before crossing over adds more).' };
  };

  /* ------------------------------------------------------------ count */
  F.count = function(c, env, p, H){
    var S = H.S, W = 360, svg, Hh, cap;
    if(p.mode === 'halflife'){
      var n = env[p.n], L0 = env[p.l0]; Hh = 180; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
      var steps = Math.min(5, Math.max(1, Math.ceil(n))), vw = 300 / (steps + 1);
      for(var i = 0; i <= steps; i++){
        var share = Math.pow(0.5, i), x = 20 + i * vw, last = i === steps;
        svg.appendChild(S('rect', { x: x, y: 40, width: vw - 14, height: 100, rx: 8, 'class': 'ca-vial' }));
        var dots = Math.round(32 * share);
        for(var d = 0; d < dots; d++) svg.appendChild(S('circle', { cx: (x + 6 + (((d + 1) * 0.7548776662) % 1) * (vw - 26)).toFixed(1), cy: (48 + (((d + 1) * 0.5698402910 + 0.1) % 1) * 84).toFixed(1), r: 2.8, 'class': 'ca-horm' }));
        svg.appendChild(S('text', { x: x + (vw - 14) / 2, y: 30, 'text-anchor': 'middle', 'class': 'cp-tick' }, i === 0 ? 'start' : i + ' half-li' + (i > 1 ? 'ves' : 'fe')));
        svg.appendChild(S('text', { x: x + (vw - 14) / 2, y: 156, 'text-anchor': 'middle', 'class': 'cp-tick' }, H.fmt(100 * share, share < 0.1 ? 1 : 0) + '%'));
      }
      svg.appendChild(S('text', { x: 180, y: 176, 'text-anchor': 'middle', 'class': 'cp-v' }, H.fmt(n, 2) + ' half-lives: ' + H.val(c, env, p.pct) + '% left: ' + H.val(c, env, p.l) + ' of ' + H.fmt(L0, 0)));
      cap = 'Each half-life clears half of what is left, never a fixed amount. After ' + H.fmt(env[p.t], 0) + ' min, ' + H.fmt(n, 2) + ' half-lives, <b>' + H.val(c, env, p.pct) + '%</b> of the starting ' + H.fmt(L0, 0) + ' remains.';
    } else if(p.mode === 'glucose'){
      var gA = env[p.ga], gO = env[p.go]; Hh = 170; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
      function hexes(n, y, cls){ var shown = Math.min(Math.ceil(n), 40); for(var i = 0; i < shown; i++){ var x = 20 + (i % 20) * 16, yy = y + Math.floor(i / 20) * 16, part = Math.min(1, n - i); svg.appendChild(S('path', { d: 'M' + x + ',' + yy + ' l6,-4 l6,4 v7 l-6,4 l-6,-4 Z', 'class': 'ca-hex ' + cls, opacity: part < 1 ? 0.45 : 1 })); } if(n > 40) svg.appendChild(S('text', { x: 345, y: y + 12, 'text-anchor': 'end', 'class': 'cp-tick' }, '… ' + H.fmt(n, 0))); }
      svg.appendChild(S('text', { x: 20, y: 18, 'class': 'cp-t' }, 'without oxygen (2 ATP each): ' + H.val(c, env, p.ga) + ' glucose'));
      hexes(gA, 34, 'ca-anaer');
      svg.appendChild(S('text', { x: 20, y: 100, 'class': 'cp-t' }, 'with oxygen (' + H.fmt(env[p.aer], 0) + ' ATP each): ' + H.val(c, env, p.go) + ' glucose'));
      hexes(gO, 116, 'ca-aer');
      cap = 'The same ' + H.fmt(env[p.need], 0) + ' ATP costs ' + H.val(c, env, p.ga) + ' glucose without oxygen but only ' + H.val(c, env, p.go) + ' with it: aerobic metabolism gets about <b>' + H.val(c, env, p.ratio) + ' times</b> as much ATP from each glucose.';
    } else if(p.mode === 'chain'){
      var C = Math.round(env[p.c]); Hh = 170; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
      var step = Math.min(14, 320 / C), y = 60;
      for(var k = 0; k < C; k++){
        var x2 = 20 + k * step, yy2 = y + (k % 2 ? 8 : -8);
        if(k) svg.appendChild(S('line', { x1: 20 + (k - 1) * step, y1: y + ((k - 1) % 2 ? 8 : -8), x2: x2, y2: yy2, 'class': 'ca-bond' }));
        svg.appendChild(S('circle', { cx: x2, cy: yy2, r: 3.6, 'class': 'ca-carbon ' + (Math.floor(k / 2) % 2 ? 'alt' : '') }));
        if(k % 2 === 1 && k < C - 1) svg.appendChild(S('path', { d: 'M' + (x2 + step / 2) + ',' + (y - 22) + ' v44', 'class': 'ca-cutline' }));
      }
      svg.appendChild(S('text', { x: 20, y: 24, 'class': 'cp-t' }, C + ' carbons: ' + H.val(c, env, p.turns) + ' cuts (beta-oxidation turns) make ' + H.val(c, env, p.ac) + ' acetyl groups'));
      svg.appendChild(S('text', { x: 20, y: 106, 'class': 'cp-tick' }, 'each cut: 1 NADH + 1 FADH2'));
      svg.appendChild(S('text', { x: 20, y: 122, 'class': 'cp-tick' }, 'each acetyl group through the citric acid cycle: 3 NADH, 1 FADH2, 1 ATP (GTP)'));
      svg.appendChild(S('text', { x: 20, y: 140, 'class': 'cp-tick' }, 'minus 2 ATP to activate the fatty acid'));
      svg.appendChild(S('text', { x: 340, y: 162, 'text-anchor': 'end', 'class': 'cp-v cp-big' }, H.val(c, env, p.total) + ' ATP'));
      cap = 'Beta-oxidation cuts the chain two carbons at a time. ' + C + ' carbons make ' + H.val(c, env, p.ac) + ' acetyl groups with ' + H.val(c, env, p.turns) + ' cuts; add up what the cuts and the cycles yield and subtract activation: <b>' + H.val(c, env, p.total) + ' ATP</b>.';
    } else if(p.mode === 'spoons'){
      var tsp = env[p.tsp]; Hh = 150; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
      var shown = Math.min(Math.ceil(tsp), 24);
      for(var s = 0; s < shown; s++){ var xs = 20 + (s % 12) * 28, ys = 40 + Math.floor(s / 12) * 50, part = Math.min(1, tsp - s);
        svg.appendChild(S('rect', { x: xs + 9, y: ys + 18, width: 4, height: 22, rx: 2, 'class': 'ca-spoon' })); svg.appendChild(S('ellipse', { cx: xs + 11, cy: ys + 11, rx: 11, ry: 8.5, 'class': 'ca-spoon' }));
        svg.appendChild(S('path', { d: 'M' + (xs + 11 - 9 * part) + ',' + (ys + 12) + ' Q' + (xs + 11) + ',' + (ys + 12 - 11 * part) + ' ' + (xs + 11 + 9 * part) + ',' + (ys + 12) + ' Z', 'class': 'ca-sugar' })); }
      svg.appendChild(S('text', { x: 20, y: 22, 'class': 'cp-v' }, H.fmt(env[p.kcal], 0) + ' kcal ÷ ' + H.fmt(env[p.per], 0) + ' kcal/g = ' + H.val(c, env, p.g) + ' g'));
      svg.appendChild(S('text', { x: 20, y: Hh - 8, 'class': 'cp-t' }, 'as teaspoons (about 4 g each): ' + H.val(c, env, p.tsp) + (tsp > 24 ? ', 24 drawn' : '')));
      cap = 'Grams are energy ÷ energy per gram: <b>' + H.val(c, env, p.g) + ' g</b>. At about 4 g a level teaspoon that is ' + H.val(c, env, p.tsp) + ' teaspoons' + (env[p.per] === 4 ? ' of sugar, if the carbohydrate is all sugar.' : ' of that nutrient.');
    } else if(p.mode === 'fat'){
      var kg = env[p.kg]; Hh = 150; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
      var gain = kg >= 0, a = Math.abs(kg), whole = Math.min(Math.floor(a), 20);
      for(var b = 0; b < whole; b++) svg.appendChild(S('rect', { x: 20 + (b % 10) * 32, y: 36 + Math.floor(b / 10) * 34, width: 28, height: 26, rx: 5, 'class': 'ca-fatblock' + (gain ? '' : ' lost') }));
      var frac = a - Math.floor(a); if(whole < 20 && frac > 0.01) svg.appendChild(S('rect', { x: 20 + (whole % 10) * 32, y: 36 + Math.floor(whole / 10) * 34, width: 28 * frac, height: 26, rx: 5, 'class': 'ca-fatblock' + (gain ? '' : ' lost') }));
      svg.appendChild(S('text', { x: 20, y: 22, 'class': 'cp-v' }, (gain ? 'stored: ' : 'lost: ') + H.val(c, env, p.kg) + ' kg of fat (each block 1 kg)'));
      svg.appendChild(S('text', { x: 20, y: Hh - 8, 'class': 'cp-t' }, H.fmt(env[p.bal], 0) + ' kcal a day × ' + H.fmt(env[p.days], 0) + ' days = ' + H.fmt(env[p.tot], 0) + ' kcal'));
      cap = 'A steady ' + (gain ? 'surplus' : 'deficit') + ' adds up: ' + H.fmt(Math.abs(env[p.tot]), 0) + ' kcal ÷ ' + H.fmt(env[p.kpk], 0) + ' kcal per kg of fat ≈ <b>' + H.val(c, env, p.kg) + ' kg</b>. (A rough guide: real changes include water and lean tissue, and the body adapts.)';
    } else if(p.mode === 'jugs'){
      var V = env[p.v]; Hh = 170; svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
      var shownJ = Math.min(Math.ceil(V), 30);
      for(var j = 0; j < shownJ; j++){ var jx = 18 + (j % 15) * 22, jy = 40 + Math.floor(j / 15) * 52, part2 = Math.min(1, V - j);
        svg.appendChild(S('rect', { x: jx, y: jy, width: 16, height: 40, rx: 4, 'class': 'ca-jug' })); svg.appendChild(S('rect', { x: jx + 1, y: jy + 40 - 39 * part2, width: 14, height: 39 * part2, rx: 3, 'class': 'ca-urinefill' })); }
      svg.appendChild(S('text', { x: 18, y: 24, 'class': 'cp-v' }, p.title + ' ' + H.val(c, env, p.v) + ' L' + (V > 30 ? ' (30 drawn)' : '')));
      svg.appendChild(S('text', { x: 18, y: Hh - 6, 'class': 'cp-t' }, p.foot ? fillCap(p.foot, c, env, H).replace(/<\/?b>/g, '') : 'each bottle 1 L'));
      cap = fillCap(p.cap, c, env, H);
    }
    return { svg: svg, cap: cap };
  };

  /* ------------------------------------------------------------ sweat */
  F.sweat = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 180, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
    var share = clamp(env[p.share] / 100, 0, 1), ev = env[p.ev], drip = env[p.drip];
    svg.appendChild(S('rect', { x: 0, y: 92, width: W, height: 88, 'class': 'ca-skinbg' }));
    svg.appendChild(S('rect', { x: 0, y: 92, width: W, height: 8, 'class': 'ca-epi' }));
    for(var g = 0; g < 4; g++){ var gx = 40 + g * 90; svg.appendChild(S('path', { d: 'M' + gx + ',94 C' + (gx - 6) + ',112 ' + (gx + 6) + ',124 ' + gx + ',140', 'class': 'ca-duct' })); svg.appendChild(S('ellipse', { cx: gx, cy: 148, rx: 11, ry: 6, 'class': 'ca-gland' })); }
    var n = 12, ne = Math.round(share * n);
    for(var i = 0; i < n; i++){
      var x = 20 + i * 27, isEv = i < ne;
      if(isEv){ svg.appendChild(S('path', { d: 'M' + x + ',80 c-5,-8 5,-12 0,-20 c-5,-8 5,-12 0,-20', 'class': 'ca-vapor' })); svg.appendChild(S('path', { d: 'M' + (x + 6) + ',78 c-3,-6 3,-9 0,-15', 'class': 'ca-heatwave' })); }
      else svg.appendChild(S('path', { d: 'M' + x + ',96 c-4,6 -4,12 0,14 c4,-2 4,-8 0,-14 Z', 'class': 'ca-drip', transform: 'translate(0,' + (i % 2 ? 14 : 22) + ')' }));
    }
    var rate = p.mode === 'rate', u = rate ? ' L/h' : ' L';
    svg.appendChild(S('text', { x: 6, y: 14, 'class': 'cp-v' }, 'evaporates: ' + H.val(c, env, p.ev) + u + ', carries ' + H.val(c, env, p.heat) + ' kcal' + (rate ? '/h' : '')));
    svg.appendChild(S('text', { x: 6, y: 30, 'class': 'cp-t' }, 'drips off: ' + H.val(c, env, p.drip) + u + ', carries no heat away'));
    svg.appendChild(S('text', { x: W - 6, y: 172, 'text-anchor': 'end', 'class': 'ca-in' }, 'glands secrete ' + (rate ? H.val(c, env, p.sec) : H.fmt(env[p.v], 2)) + u));
    return { svg: svg, cap: 'Only sweat that evaporates takes heat with it, about 580 kcal per liter; sweat that drips off is lost water without cooling. ' + (rate ? 'To shed ' + H.fmt(env[p.heat], 0) + ' kcal an hour, ' + H.val(c, env, p.ev) + ' L/h must evaporate; with ' + H.fmt(env[p.share], 0) + '% evaporating, the glands must secrete <b>' + H.val(c, env, p.sec) + ' L/h</b>.' : 'Here ' + H.val(c, env, p.ev) + ' L evaporates: <b>' + H.val(c, env, p.heat) + ' kcal</b>.') };
  };

  /* ------------------------------------------------------------ bulb */
  F.bulb = function(c, env, p, H){
    var S = H.S, W = 360, Hh = 180, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh });
    var w = env[p.w], glow = clamp(w / 150, 0.15, 1);
    svg.appendChild(S('circle', { cx: 250, cy: 76, r: 30 + glow * 34, 'class': 'ca-glow', opacity: (0.25 + glow * 0.5).toFixed(2) }));
    svg.appendChild(S('path', { d: 'M250,34 C274,34 288,52 286,72 C284,88 272,96 268,108 L232,108 C228,96 216,88 214,72 C212,52 226,34 250,34 Z', 'class': 'ca-bulb' }));
    svg.appendChild(S('path', { d: 'M238,98 C238,80 244,74 250,82 C256,74 262,80 262,98', 'class': 'ca-filament' }));
    svg.appendChild(S('rect', { x: 234, y: 108, width: 32, height: 20, rx: 3, 'class': 'ca-cap' }));
    svg.appendChild(S('text', { x: 250, y: 150, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, H.val(c, env, p.w) + ' W'));
    svg.appendChild(S('text', { x: 20, y: 40, 'class': 'cp-t' }, 'oxygen used'));
    svg.appendChild(S('text', { x: 20, y: 56, 'class': 'cp-v' }, H.fmt(env[p.vo2], 0) + ' mL/min = ' + H.val(c, env, p.l) + ' L/day'));
    svg.appendChild(S('text', { x: 20, y: 86, 'class': 'cp-t' }, '× ' + H.fmt(env[p.eq], 1) + ' kcal per liter'));
    svg.appendChild(S('text', { x: 20, y: 102, 'class': 'cp-v' }, '= ' + H.val(c, env, p.day) + ' kcal/day'));
    svg.appendChild(S('path', { d: 'M170,90 H206', 'class': 'ca-flow' })); svg.appendChild(S('path', { d: 'M200,84 l8,6 l-8,6', 'class': 'ca-flowh' }));
    svg.appendChild(S('text', { x: 180, y: Hh - 6, 'text-anchor': 'middle', 'class': 'cp-t' }, 'the body’s heat output, as steady as a bulb of that power'));
    return { svg: svg, cap: 'Nearly every liter of oxygen you use releases about ' + H.fmt(env[p.eq], 1) + ' kcal. ' + H.val(c, env, p.day) + ' kcal a day is <b>' + H.val(c, env, p.w) + ' watts</b> of heat, about what a light bulb of that rating gives off.' };
  };

  window.AnpCalcArt = { draw: function(kind, c, env, pic, H){ return F[kind] ? F[kind](c, env, pic, H) : null; }, kinds: Object.keys(F) };
})();
