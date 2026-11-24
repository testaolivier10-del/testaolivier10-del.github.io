/* The neuron, tools v2 (docs/tools-v2-neuron-brief.md; the standard: docs/tools-v2-standard.md). On the shared kit
   (assets/course/tool-kit2.js) through the course adapter ApPsychTools.kit2 (psy-tools.js, from the brain map). The model is
   ApPsychMath.neuron (psychology/assets/tools/math/neuron.js); the content psychology/data/tools/neuron.json (served
   filtered as assets/tool-data/neuron.json).

   THE ONE IDEA: a neuron fires only when its input passes threshold, and then it fires all the way.
   Two modes (the rule for every tool): EXPLORE is for playing with it, TEST YOURSELF is where you get quizzed.
   Explore: four tabs, each one idea, on one drawn neuron (and, in Synapse, a close-up of one synapse):
     1 Threshold          drag the excitatory input (and, quieter, the inhibitory one) on the input axons at the
                          left. The cell body warms as its charge nears threshold; past it, Na+ rushes in through the
                          channel in the membrane close-up, the trace spikes to +40 mV (always the same size: all or
                          none), K+ flows out, and the action potential jumps along the myelinated axon node to node
                          to the terminals, which release neurotransmitter.
     2 Refractory period  drag the second pulse along the time axis: inside the shaded refractory period the Na+
                          channel is locked and the second pulse cannot fire the neuron.
     3 Myelin             tap stretches of myelin to strip them (as in multiple sclerosis) or restore them: the
                          signal jumps node to node where there is myelin and creeps where there is none, and the bar
                          below times its trip to the terminals.
     4 Synapse            tap a drug (none, agonist, antagonist, reuptake inhibitor): the action potential reaches
                          the terminal, a vesicle releases the neurotransmitter (eight to pick from), it binds the
                          receptors and reuptake pulls it back; the graph is the share of receptors activated.
   INSTANT RESPONSE: while a control moves, the picture holds the moment that matters for that setting (the peak of
   the push or the spike) and the graph the whole run; when it is let go, the run plays (Watch it happen replays
   it). The words on the picture, the cause line (K.cause) and the numbers are all read from the drawn frame
   (frameAt), so they never disagree, also in the middle of a run. One colour per idea: the signal and threshold
   vermillion, Na+ amber, K+ blue, excitatory and neurotransmitter green, inhibitory pink (GABA too), myelin cream,
   drugs grey. Reduced motion: the end of the run at once, with a short cross fade.
   Test yourself: the drills (ApPsychTools.drill over the model's generate(): read a trace, drugs at the synapse,
   name the neurotransmitter, parts of a neuron), unchanged, with their figures drawn from each problem's numbers;
   a figure never shows an answer before its step is answered. */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.neuron || M.neuron.stub) return;
  var N = M.neuron, esc = T.esc, uidN = 0;
  function f1(x){ return M.minus(M.fixed(x, 1)); }
  function mv(x){ return M.minus(String(Math.round(x))) + ' mV'; }
  function r1(v){ return Math.round(v * 10) / 10; }
  function pt(x, y){ return r1(x) + ' ' + r1(y); }
  function ntName(k){ return N.NT[k].name; }
  function ntLower(k){ return k === 'gaba' ? 'GABA' : N.NT[k].name.toLowerCase(); }

  /* ------------------------------------------------------------ art */
  /* The neuron, drawn into the box (x0, y0, w, h). Returns { svg, geo }.
     o: { part (highlighted), labels (true), parts (tappable), id } */
  function neuronArt(x0, y0, w, h, o){
    o = o || {};
    var g = [], id = o.id || ('nr' + (++uidN)), my = y0 + h * 0.5;
    var rs = Math.max(16, Math.min(h * 0.2, w * 0.06, 36)), sx = x0 + Math.max(w * 0.2, rs * 3.2), sy = my;
    var axR = Math.max(3.2, rs * 0.2), ax0 = sx + rs * 1.55, ax1 = x0 + w * 0.84, segN = w < 520 ? 4 : 6, gap = Math.max(5, w * 0.012);
    var segW = (ax1 - ax0 - gap * (segN + 1)) / segN;
    // dendrites: a seeded tree from the cell body
    var rng = M.rng(o.seed || 41), dend = [], tips = [];
    // With labels on, the top band belongs to the words "Dendrites" and "Terminals": no branch grows into it,
    // so no branch runs through a label (it did at phone width).
    var topPad = o.labels !== false ? (w < 520 ? 11.5 : 13) + 10 : 6;
    function branch(x, y, ang, len, wd, depth){
      var bend = (rng() - 0.5) * 0.5, ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
      ex = Math.max(x0 + 4, Math.min(sx - rs * 0.2, ex)); ey = Math.max(y0 + topPad, Math.min(y0 + h - 6, ey));
      var cx = (x + ex) / 2 + Math.cos(ang + Math.PI / 2) * len * bend * 0.4, cy = Math.max(y0 + topPad, (y + ey) / 2 + Math.sin(ang + Math.PI / 2) * len * bend * 0.4);
      dend.push({ d: 'M' + pt(x, y) + ' Q' + pt(cx, cy) + ' ' + pt(ex, ey), w: wd });
      if(depth > 0){
        branch(ex, ey, ang - 0.42 - rng() * 0.2, len * 0.66, wd * 0.62, depth - 1);
        branch(ex, ey, ang + 0.36 + rng() * 0.2, len * 0.6, wd * 0.62, depth - 1);
      } else tips.push([ex, ey]);
    }
    var L0 = Math.min(sx - x0 - rs, h * 0.42) * 0.62;
    [-2.35, -1.75, 3.14, 2.4, 1.85].forEach(function(a, i){
      var bx = sx + Math.cos(a) * rs * 0.86, by = sy + Math.sin(a) * rs * 0.86;
      branch(bx, by, a + (rng() - 0.5) * 0.2, L0 * (i === 2 ? 1.05 : 0.86), Math.max(2.4, rs * 0.26), 2);
    });
    // the cell body: a soft blob with the hillock tapering into the axon
    var bumps = 7, bp = [];
    for(var b = 0; b <= bumps; b++){ var a = b / bumps * Math.PI * 2, rr = rs * (1 + 0.08 * Math.sin(a * 3 + 1)); bp.push([sx + Math.cos(a) * rr, sy + Math.sin(a) * rr * 0.92]); }
    var soma = 'M' + pt(bp[0][0], bp[0][1]);
    for(var k = 1; k < bp.length; k++){ var p0 = bp[k - 1], p1 = bp[k], mx = (p0[0] + p1[0]) / 2, mY = (p0[1] + p1[1]) / 2, ox = (mx - sx) * 0.12, oy = (mY - sy) * 0.12; soma += ' Q' + pt(mx + ox, mY + oy) + ' ' + pt(p1[0], p1[1]); }
    soma += 'Z';
    var hill = 'M' + pt(sx + rs * 0.7, sy - rs * 0.48) + ' Q' + pt(sx + rs * 1.25, sy - axR * 1.6) + ' ' + pt(ax0 + 2, sy - axR) + ' L' + pt(ax0 + 2, sy + axR) + ' Q' + pt(sx + rs * 1.25, sy + axR * 1.6) + ' ' + pt(sx + rs * 0.7, sy + rs * 0.48) + 'Z';
    // terminals: a fan of branches ending in buttons
    var termX = ax1, fan = [], tn = 4, spread = Math.min(h * 0.36, 70);
    for(var j = 0; j < tn; j++){
      var ty = sy + (j - (tn - 1) / 2) * spread / (tn - 1) * 2, tx = x0 + w - Math.max(10, rs * 0.5) - (j % 2) * 8;
      fan.push({ d: 'M' + pt(termX, sy) + ' C' + pt(termX + (tx - termX) * 0.45, sy) + ' ' + pt(termX + (tx - termX) * 0.5, ty) + ' ' + pt(tx - 6, ty), end: [tx, ty] });
    }
    var segs = [];
    for(var s = 0; s < segN; s++){ var sx0 = ax0 + gap + s * (segW + gap); segs.push([sx0, sx0 + segW]); }
    var hi = function(p){ return o.part === p ? ' is-hi' : ''; };
    var tap = function(p, label){ return o.parts ? ' data-part="' + p + '" tabindex="0" role="button" aria-label="' + esc(label) + '"' : ''; };
    g.push('<defs><radialGradient id="' + id + 'Soma" cx="40%" cy="38%" r="70%"><stop offset="0" class="nr-soma0"/><stop offset="1" class="nr-soma1"/></radialGradient>' +
      '<linearGradient id="' + id + 'My" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="nr-my0"/><stop offset="0.5" class="nr-my1"/><stop offset="1" class="nr-my2"/></linearGradient>' +
      '<radialGradient id="' + id + 'Glow"><stop offset="0" class="nr-glow0"/><stop offset="1" class="nr-glow1"/></radialGradient></defs>');
    g.push('<g class="nr-part nr-dend' + hi('dendrite') + '"' + tap('dendrite', 'Dendrites') + '>' + dend.map(function(d){ return '<path class="nr-edge" d="' + d.d + '" stroke-width="' + r1(d.w + 2.6) + '"/>'; }).join('') + dend.map(function(d){ return '<path d="' + d.d + '" stroke-width="' + r1(d.w) + '"/>'; }).join('') + '</g>');
    g.push('<g class="nr-part nr-axon' + hi('axon') + '"' + tap('axon', 'Axon') + '><line class="nr-edge" x1="' + r1(ax0) + '" y1="' + r1(sy) + '" x2="' + r1(termX + 1) + '" y2="' + r1(sy) + '" stroke-width="' + r1(axR * 2 + 2.6) + '"/><line class="nr-axcore" x1="' + r1(ax0) + '" y1="' + r1(sy) + '" x2="' + r1(termX + 1) + '" y2="' + r1(sy) + '" stroke-width="' + r1(axR * 2) + '"/></g>');
    g.push('<g class="nr-part nr-term' + hi('terminal') + '"' + tap('terminal', 'Axon terminals') + '>' + fan.map(function(t){ return '<path class="nr-edge" d="' + t.d + '" stroke-width="' + r1(axR * 1.3 + 2.6) + '"/><path class="nr-tbr" d="' + t.d + '" stroke-width="' + r1(axR * 1.3) + '"/><ellipse class="nr-btn" cx="' + r1(t.end[0]) + '" cy="' + r1(t.end[1]) + '" rx="' + r1(axR * 2.1) + '" ry="' + r1(axR * 1.7) + '"/>'; }).join('') + '</g>');
    g.push('<g class="nr-part nr-myel' + hi('myelin') + '"' + tap('myelin', 'Myelin sheath') + '>' + segs.map(function(q){ return '<rect x="' + r1(q[0]) + '" y="' + r1(sy - axR * 2.1) + '" width="' + r1(q[1] - q[0]) + '" height="' + r1(axR * 4.2) + '" rx="' + r1(axR * 2.1) + '" fill="url(#' + id + 'My)"/>'; }).join('') + '</g>');
    g.push('<g class="nr-part nr-somag' + hi('soma') + '"' + tap('soma', 'Cell body') + '><path class="nr-hill" d="' + hill + '" fill="url(#' + id + 'Soma)"/><path class="nr-soma" d="' + soma + '" fill="url(#' + id + 'Soma)"/><ellipse class="nr-nuc" cx="' + r1(sx - rs * 0.08) + '" cy="' + r1(sy - rs * 0.05) + '" rx="' + r1(rs * 0.42) + '" ry="' + r1(rs * 0.38) + '"/><circle class="nr-nucl" cx="' + r1(sx - rs * 0.02) + '" cy="' + r1(sy - rs * 0.1) + '" r="' + r1(rs * 0.13) + '"/></g>');
    var nodes = [ax0 + gap / 2].concat(segs.map(function(q){ return q[1] + gap / 2; }));
    var geo = { sx: sx, sy: sy, rs: rs, ax0: ax0, ax1: termX, axR: axR, segs: segs, nodes: nodes, fan: fan, tips: tips, x0: x0, y0: y0, w: w, h: h, id: id };
    if(o.labels !== false){
      var fs = w < 520 ? 11.5 : 13, lb = function(x, y, t, a, p){ return '<text class="nr-lab' + (o.part === p ? ' is-hi' : '') + '" x="' + r1(x) + '" y="' + r1(y) + '" text-anchor="' + (a || 'middle') + '" font-size="' + fs + '">' + t + '</text>'; };
      var top = y0 + fs + 2;
      g.push(lb(x0 + 2, top, 'Dendrites', 'start', 'dendrite'));
      g.push(lb(sx + rs * 0.95, sy + rs * 0.92 + fs * 0.6, 'Cell body', 'start', 'soma'));
      var s1 = segs[Math.min(1, segs.length - 1)];
      g.push(lb((s1[0] + s1[1]) / 2, sy - axR * 2.1 - 7, 'Myelin', 'middle', 'myelin'));
      g.push(lb((segs[segs.length - 2][0] + segs[segs.length - 2][1]) / 2, sy + axR * 2.1 + fs + 4, 'Axon', 'middle', 'axon'));
      g.push(lb(x0 + w - 2, top, w < 520 ? 'Terminals' : 'Axon terminals', 'end', 'terminal'));
    }
    return { svg: g.join(''), geo: geo };
  }
  /* A point along the axon, u in [0, 1] from the hillock to the terminals. */
  function alongAxon(geo, u){ return [geo.ax0 + (geo.ax1 - geo.ax0) * u, geo.sy]; }

  /* The membrane potential trace in the box. o: { run | series, upto (ms),
     pulses, thresh, rest, refr (shade refractory periods), compact } */
  function traceArt(x0, y0, w, h, o){
    var g = [], L = x0 + (o.compact ? 40 : 46), R = x0 + w - (o.enl ? 50 : 8), top = y0 + 26, bot = y0 + h - 30, dur = o.dur || 25;
    var X = function(t){ return L + t / dur * (R - L); }, Y = function(v){ return bot - (v + 90) / 140 * (bot - top); };
    var fs = o.small ? 11 : 12;
    g.push('<rect class="nr-plotbg" x="' + r1(L) + '" y="' + r1(top) + '" width="' + r1(R - L) + '" height="' + r1(bot - top) + '" rx="4"/>');
    // refractory periods after each spike drawn so far
    var spikes = (o.spikes || []).filter(function(s){ return s <= (o.upto == null ? dur : o.upto); });
    if(o.refr !== false) spikes.forEach(function(s){
      var a = X(s), b = X(Math.min(dur, s + N.ABS)), c = X(Math.min(dur, s + N.REL));
      g.push('<rect class="nr-abs" x="' + r1(a) + '" y="' + r1(top) + '" width="' + r1(b - a) + '" height="' + r1(bot - top) + '"/><rect class="nr-relp" x="' + r1(b) + '" y="' + r1(top) + '" width="' + r1(Math.max(0, c - b)) + '" height="' + r1(bot - top) + '"/>');
    });
    [40, 0, -40, -80].forEach(function(v){ g.push('<line class="nr-grid" x1="' + r1(L) + '" x2="' + r1(R) + '" y1="' + r1(Y(v)) + '" y2="' + r1(Y(v)) + '"/><text class="nr-tk" x="' + r1(L - 6) + '" y="' + r1(Y(v) + 4) + '" text-anchor="end" font-size="' + fs + '">' + (v > 0 ? '+' : '') + M.minus(String(v)) + '</text>'); });
    for(var t = 0; t <= dur; t += 5) g.push('<text class="nr-tk" x="' + r1(t + 5 > dur ? X(t) + 6 : X(t)) + '" y="' + r1(bot + 15) + '" text-anchor="' + (t + 5 > dur ? 'end' : 'middle') + '" font-size="' + fs + '">' + t + (t + 5 > dur ? ' ms' : '') + '</text>');
    g.push('<text class="nr-axl" x="' + r1(x0 + 2) + '" y="' + r1(top - 6) + '" font-size="' + fs + '">mV</text>');
    // rest and threshold
    g.push('<line class="nr-rest" x1="' + r1(L) + '" x2="' + r1(R) + '" y1="' + r1(Y(o.rest)) + '" y2="' + r1(Y(o.rest)) + '"/>');
    g.push('<line class="nr-thr" x1="' + r1(L) + '" x2="' + r1(R) + '" y1="' + r1(Y(o.thresh)) + '" y2="' + r1(Y(o.thresh)) + '"/>');
    // the key above the plot, so no label ever sits on the trace
    var ky = top - 6, kx = R, tw1 = (fs * 0.56) * ('resting ' + mv(o.rest)).length;
    g.push('<text class="nr-rest-t" x="' + r1(kx) + '" y="' + r1(ky) + '" text-anchor="end" font-size="' + fs + '">resting ' + mv(o.rest) + '</text><line class="nr-rest" x1="' + r1(kx - tw1 - 26) + '" x2="' + r1(kx - tw1 - 6) + '" y1="' + r1(ky - 4) + '" y2="' + r1(ky - 4) + '"/>');
    var kx2 = kx - tw1 - 36, tw2 = (fs * 0.56) * ('threshold ' + mv(o.thresh)).length;
    g.push('<text class="nr-thr-t" x="' + r1(kx2) + '" y="' + r1(ky) + '" text-anchor="end" font-size="' + fs + '">threshold ' + mv(o.thresh) + '</text><line class="nr-thr" x1="' + r1(kx2 - tw2 - 26) + '" x2="' + r1(kx2 - tw2 - 6) + '" y1="' + r1(ky - 4) + '" y2="' + r1(ky - 4) + '"/>');
    // stimulus marks
    (o.pulses || []).forEach(function(p){ if(o.upto == null || p <= o.upto) g.push('<path class="nr-stim" d="M' + pt(X(p), bot - 2) + ' l-5 9 h10 z"/>'); });
    if(o.held != null && (o.upto == null || o.upto >= o.held)) g.push('<line class="nr-heldbar" x1="' + r1(X(o.held)) + '" x2="' + r1(X(o.upto == null ? dur : o.upto)) + '" y1="' + r1(bot - 3) + '" y2="' + r1(bot - 3) + '"/>');
    // the trace itself
    var ser = o.series || [], pts = [];
    for(var i = 0; i < ser.length; i++){ if(o.upto != null && ser[i][0] > o.upto + 1e-9) break; pts.push(r1(X(ser[i][0])) + ',' + r1(Y(ser[i][1]))); }
    if(pts.length > 1) g.push('<polyline class="nr-trace" points="' + pts.join(' ') + '"/>');
    if(o.upto != null && o.upto < dur) g.push('<line class="nr-now" x1="' + r1(X(o.upto)) + '" x2="' + r1(X(o.upto)) + '" y1="' + r1(top) + '" y2="' + r1(bot) + '"/>');
    if(o.upto != null && o.upto < dur && pts.length){ var last = ser[pts.length - 1]; g.push('<circle class="nr-head" cx="' + r1(X(last[0])) + '" cy="' + r1(Y(last[1])) + '" r="4"/>'); }
    // label the first spike's peak and refractory period once there is room
    var roomy = spikes.length && (spikes.length === 1 || X(spikes[1]) - X(spikes[0]) > 150);
    if(roomy && !o.compact){
      var s0 = spikes[0], px = X(s0 + 0.5);
      g.push('<text class="nr-peak-t" x="' + r1(px + 7) + '" y="' + r1(Y(40) + 4) + '" font-size="' + fs + '">+40 mV peak</text>');
      if(o.refr !== false && (R - X(s0)) > 120) g.push('<text class="nr-ref-t" x="' + r1(X(s0 + N.REL) + 4) + '" y="' + r1(bot - 8) + '" font-size="' + fs + '">← refractory</text>');
    }
    return { svg: g.join(''), X: X, Y: Y, L: L, R: R, top: top, bot: bot };
  }

  /* The synapse close-up in the box. o: { nt, cls, t (ms since release, or
     null before any), id } */
  var REC = 8;
  var ANTAG = [0, 1, 3, 4, 6, 7].slice(0, Math.round(REC * 0.7)), AGON = [1, 4, 6];
  function synapseArt(x0, y0, w, h, o){
    var g = [], id = o.id || ('sy' + (++uidN)), cx = x0 + w / 2, cls = o.cls || 'none';
    // z: how much bigger than the base drawing the parts are, so the molecules read in a large stage (tool review 2026-11)
    var z = o.z || Math.max(1, Math.min(2.2, Math.min(w / 420, h / 210)));
    var tw = Math.min(w * 0.86, 520 * Math.min(z, 1.35)), tl = cx - tw / 2, tr = cx + tw / 2, tBot = y0 + h * 0.46, cleft = Math.max(26 * z, h * 0.17), rTop = tBot + cleft;
    // the sending terminal: a rounded bulb from the top
    g.push('<defs><linearGradient id="' + id + 'T" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="nr-soma1"/><stop offset="1" class="nr-soma0"/></linearGradient><linearGradient id="' + id + 'R" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="nr-rcv0"/><stop offset="1" class="nr-rcv1"/></linearGradient></defs>');
    g.push('<path class="nr-sterm" d="M' + pt(cx - tw * 0.16, y0) + ' C' + pt(cx - tw * 0.18, y0 + h * 0.12) + ' ' + pt(tl, y0 + h * 0.14) + ' ' + pt(tl, tBot - 24) + ' Q' + pt(tl, tBot) + ' ' + pt(tl + 26, tBot) + ' L' + pt(tr - 26, tBot) + ' Q' + pt(tr, tBot) + ' ' + pt(tr, tBot - 24) + ' C' + pt(tr, y0 + h * 0.14) + ' ' + pt(cx + tw * 0.18, y0 + h * 0.12) + ' ' + pt(cx + tw * 0.16, y0) + 'Z" fill="url(#' + id + 'T)"/>');
    // the receiving neuron: a dendrite seen side on, a band under the synapse
    var rBot = Math.min(y0 + h, rTop + Math.max(56, h * 0.26));
    g.push('<path class="nr-rcv" d="M' + pt(x0, rTop + 10) + ' Q' + pt(cx, rTop - 10) + ' ' + pt(x0 + w, rTop + 10) + ' L' + pt(x0 + w, rBot - 14) + ' Q' + pt(x0 + w, rBot) + ' ' + pt(x0 + w - 14, rBot) + ' L' + pt(x0 + 14, rBot) + ' Q' + pt(x0, rBot) + ' ' + pt(x0, rBot - 14) + 'Z" fill="url(#' + id + 'R)"/>');
    var fs = w < 520 ? 11.5 : 13;
    g.push('<text class="nr-lab" x="' + r1(cx + tw * 0.2) + '" y="' + r1(y0 + fs + 2) + '" font-size="' + fs + '">Sending neuron</text>');
    g.push('<text class="nr-lab" x="' + r1(cx) + '" y="' + r1(rBot - 10) + '" text-anchor="middle" font-size="' + fs + '">Receiving neuron</text>');
    g.push('<text class="nr-tk nr-cleft-t" x="' + r1(x0 + 4) + '" y="' + r1(tBot + cleft / 2 + 4) + '" font-size="' + (fs - 0.5) + '">synapse</text>');
    // receptors along the receiving membrane
    var rx = function(i){ return tl + 30 * z + i * (tw - 60 * z) / (REC - 1); }, ry = function(x){ var u = (x - x0) / w; return rTop + 10 - 20 * 4 * u * (1 - u); };
    var t = o.t, S = t == null ? null : N.synapse(cls), idx = S ? Math.min(S.t.length - 1, Math.round(t / N.SYN.dt)) : 0;
    var cleftAmt = S ? S.cleft[idx] : 0, active = S ? S.act[idx] : (cls === 'agonist' ? N.SYN.agonist : 0);
    // each receptor: blocked by an antagonist, held by an agonist, bound by
    // the neurotransmitter, or empty; the active count follows the model
    var nActive = Math.round(active * REC), blocked = cls === 'antagonist' ? ANTAG : [], agon = cls === 'agonist' ? AGON : [];
    var holder = {}, ntLeft = Math.max(0, nActive - agon.length);
    for(var q = 0; q < REC; q++){
      if(blocked.indexOf(q) > -1) holder[q] = 'block';
      else if(agon.indexOf(q) > -1) holder[q] = 'drug';
      else if(ntLeft > 0){ holder[q] = 'nt'; ntLeft--; }
      else holder[q] = null;
    }
    for(var r = 0; r < REC; r++){
      var x = rx(r), y = ry(x), hd = holder[r], on = hd === 'nt' || hd === 'drug';
      g.push('<g class="nr-rec' + (on ? ' is-on' : '') + (hd === 'block' ? ' is-blocked' : '') + '" transform="translate(' + pt(x, y) + ') scale(' + r1(z) + ')"><path d="M-9 -3 L-9 9 Q-9 14 -4 14 L4 14 Q9 14 9 9 L9 -3 L5 -3 L5 7 L-5 7 L-5 -3 Z"/></g>');
      if(hd === 'block') g.push('<rect class="nr-drug" x="' + r1(x - 4.5 * z) + '" y="' + r1(y - 4 * z) + '" width="' + r1(9 * z) + '" height="' + r1(9 * z) + '" rx="1.5"/>');
      else if(hd === 'drug') g.push('<path class="nr-drug" d="M' + pt(x, y - 6 * z) + ' l' + r1(5.5 * z) + ' ' + r1(6 * z) + ' l' + r1(-5.5 * z) + ' ' + r1(6 * z) + ' l' + r1(-5.5 * z) + ' ' + r1(-6 * z) + ' z"/>');
      else if(hd === 'nt') g.push('<circle class="nr-nt" cx="' + r1(x) + '" cy="' + r1(y + z) + '" r="' + r1(4.2 * z) + '"/>');
    }
    // reuptake transporters at both sides of the terminal's lower edge
    var trs = [tl + 14 * z, tr - 14 * z];
    trs.forEach(function(x){
      g.push('<g class="nr-trans" transform="translate(' + pt(x, tBot - 4 * z) + ') scale(' + r1(z) + ')"><rect x="-7" y="-10" width="14" height="18" rx="4"/><path d="M0 -6 v10 m-3 -7 l3 -3 l3 3"/></g>');
      if(cls === 'reuptake') g.push('<path class="nr-drug" d="M' + pt(x - 6 * z, tBot + 10 * z) + ' l' + r1(6 * z) + ' ' + r1(-10 * z) + ' l' + r1(6 * z) + ' ' + r1(10 * z) + ' z"/>');
    });
    // vesicles and the molecules in the cleft
    var vr = M.rng(9), vN = 5;
    for(var v = 0; v < vN; v++){
      var vx = cx + (v - (vN - 1) / 2) * Math.min(46 * z, tw / 6), vy = tBot - 30 * z - (v % 2) * 22 * z, open = S && v === 2 && t < 1.5;
      g.push('<circle class="nr-ves" cx="' + r1(vx) + '" cy="' + r1(vy) + '" r="' + r1(13 * z) + '"/>');
      var inside = S && v === 2 ? 0 : 5;
      for(var d = 0; d < inside; d++) g.push('<circle class="nr-nt" cx="' + r1(vx + (vr() - 0.5) * 12 * z) + '" cy="' + r1(vy + (vr() - 0.5) * 12 * z) + '" r="' + r1(2.6 * z) + '"/>');
      if(open) g.push('<path class="nr-fuse" d="M' + pt(vx - 9 * z, tBot - 2) + ' q' + r1(9 * z) + ' ' + r1(8 * z) + ' ' + r1(18 * z) + ' 0"/>');
    }
    if(S){
      var MOL = 22, inCleft = Math.round(MOL * cleftAmt), mr = M.rng(23);
      for(var m = 0; m < MOL; m++){
        var tx = tl + 34 * z + mr() * (tw - 68 * z), ty = tBot + 6 * z + mr() * (cleft - 12 * z), sx0 = cx + (mr() - 0.5) * 16 * z;
        var u = Math.min(1, t / 0.6);
        if(m < inCleft){
          var px = sx0 + (tx - sx0) * u, py = tBot + (ty - tBot) * u;
          g.push('<circle class="nr-nt" cx="' + r1(px) + '" cy="' + r1(py) + '" r="' + r1(3.4 * z) + '"/>');
        } else if(t > 0.4 && m < inCleft + 4 && cls !== 'reuptake'){
          var side = trs[m % 2], k2 = 0.6;
          g.push('<circle class="nr-nt is-back" cx="' + r1(tx + (side - tx) * k2) + '" cy="' + r1(ty + (tBot - 6 - ty) * k2) + '" r="' + r1(3 * z) + '"/>');
        }
      }
    }
    return { svg: g.join(''), cleftAmt: cleftAmt, active: active };
  }
  /* Receptor activation against time, with the no-drug curve dashed. */

  /* ================================================================ tools v2: Explore */
  var NS = 'http://www.w3.org/2000/svg';
  function n1(v){ return (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, ''); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function sm(u){ u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function sgn(v){ v = Math.round(v); return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v); }
  function mvT(v){ return sgn(v) + ' mV'; }
  var TABS = [{ value: 'fire', label: 'Threshold' }, { value: 'refr', label: 'Refractory period', short: 'Refractory' },
    { value: 'myel', label: 'Myelin' }, { value: 'syn', label: 'Synapse' }];
  var PURPOSE = { fire: 'A neuron fires only when its input passes threshold', refr: 'Right after it fires, a neuron cannot fire again',
    myel: 'Myelin makes the signal jump, so it travels faster', syn: 'How drugs change the message at a synapse' };
  var T0 = 2, DUR = { fire: 12, refr: 22 }, SREFR = 22, SMYEL = 22, EMAX = 40, IMAX = 20;
  var DRUGS2 = [{ v: 'none', label: 'No drug', short: 'No drug' }, { v: 'agonist', label: 'Agonist', short: 'Agonist' },
    { v: 'antagonist', label: 'Antagonist', short: 'Antagonist' }, { v: 'reuptake', label: 'Reuptake inhibitor', short: 'Reuptake inhibitor' }];

  /* The pace of a run: real seconds per model ms, slow where something happens (a pulse arriving, a spike and its
     ions, the signal on the axon), quick through the quiet stretches. speed(t) is model ms per second. */
  function paceFor(run, travel){
    var slow = [];
    run.events.forEach(function(e){ slow.push([e.t - 0.15, e.t + 0.6, 1.4]); });
    run.spikes.forEach(function(s){ slow.push([s - 0.1, s + Math.max(2.2, travel + 0.5), 0.9]); slow.push([s + 2.2, s + 5, 2.6]); });
    return function(t){ var r = 7; slow.forEach(function(w){ if(t >= w[0] && t <= w[1]) r = Math.min(r, w[2]); }); return r; };
  }

  function explore2(app, data, ctx, K){
    var X = data.explore || {};
    var S = { tab: 'fire', E: X.strength2 != null ? X.strength2 : 12, I: 0, gap: 4, myel: [true, true, true, true, true, true], cls: 'none', nt: X.nt || 'dopamine', mode: 'explore' };
    var view = { t: 0, preview: true, clock: 0 }, prev = null, gest = null, G = null, runs = {}, playing = false, arrivedSay = '';
    var hashTab = (location.hash.match(/^#(threshold|refractory|myelin|synapse)\b/) || [])[1];
    if(hashTab) S.tab = { threshold: 'fire', refractory: 'refr', myelin: 'myel', synapse: 'syn' }[hashTab];

    /* ---- the stage */
    var stage = document.createElement('div'); stage.className = 'nr2'; stage.setAttribute('data-tab', S.tab);
    var tabs = K.tabs({ label: 'What to explore', big: true, value: S.tab, items: TABS.map(function(t){ return { value: t.value, label: t.label, short: t.short }; }), onChange: function(v){ setTab(v); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: PURPOSE[S.tab], how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var sceneBox = document.createElement('div'); sceneBox.className = 'nr2-scene';
    sceneBox.innerHTML = '<svg class="nr2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="nr2-static"></g><g class="nr2-dyn"></g><g class="nr2-fade"></g></svg>';
    stage.appendChild(sceneBox);
    var svg = sceneBox.querySelector('svg'), gStatic = svg.querySelector('.nr2-static'), gDyn = svg.querySelector('.nr2-dyn'), gFade = svg.querySelector('.nr2-fade'), layer = K.layer(sceneBox);
    var lines = document.createElement('div'); lines.className = 'nr2-lines';
    var cause = K.cause({ label: 'Why' });
    lines.appendChild(cause.el);
    var side = document.createElement('div'); side.className = 'nr2-side';
    // the neurotransmitter (Synapse only): a quiet setting beside the play button
    var ntBox = document.createElement('label'); ntBox.className = 'nr2-nt';
    ntBox.innerHTML = '<span>Neurotransmitter</span><select>' + N.NT_KEYS.map(function(k){ return '<option value="' + k + '"' + (k === S.nt ? ' selected' : '') + '>' + esc(N.NT[k].name) + '</option>'; }).join('') + '</select>';
    var ntSel = ntBox.querySelector('select');
    ntSel.addEventListener('change', function(){ S.nt = ntSel.value; hideCue(true); restart(true); refHtml(); say(sentence()); });
    side.appendChild(ntBox);
    var player = null, pO = { min: 0, max: 12, speed: function(v){ return pace(v); }, get: function(){ return view.t; }, set: function(v){ setT(v, false); },
      onStart: function(){ playing = true; view.preview = false; }, onEnd: function(){ playing = false; ended(); }, labels: { play: 'Watch it happen', again: 'Watch it again' } };
    player = K.player(pO);
    player.el.classList.add('is-sm');
    var playOrig = player.stop;
    side.appendChild(player.el);
    lines.appendChild(side);
    stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    /* ---- runs (cached): what the model says for this setting */
    function fireRun(E, I){ var k = 'f' + E + '|' + I; return runs[k] || (runs[k] = N.simulate({ mode: 'pulse', S: E - I, net: true, t0: T0, dur: DUR.fire })); }
    function refrRun(g){ var k = 'r' + g; return runs[k] || (runs[k] = N.simulate({ mode: 'pair', S: SREFR, gap: g, t0: T0, dur: DUR.refr })); }
    function myelRun(){ var k = 'm'; return runs[k] || (runs[k] = N.simulate({ mode: 'pulse', S: SMYEL, t0: T0, dur: 12 })); }
    function cond(){ return N.conduction(S.tab === 'myel' ? S.myel : null); }
    function run(){ return S.tab === 'fire' ? fireRun(S.E, S.I) : S.tab === 'refr' ? refrRun(S.gap) : S.tab === 'myel' ? myelRun() : null; }
    function synRun(){ var k = 's' + S.cls; return runs[k] || (runs[k] = N.synapse(S.cls)); }
    function synBase(){ return runs.snone || (runs.snone = N.synapse('none')); }
    var SYN_PRE = 0.8;   // ms before release: the action potential comes down the terminal
    function tMax(){
      if(S.tab === 'syn') return N.SYN.dur;
      if(S.tab === 'myel'){ var r = myelRun(); return r.spikes[0] + cond().total + 1.2; }
      return DUR[S.tab];
    }
    function tMin(){ return S.tab === 'syn' ? -SYN_PRE : S.tab === 'myel' ? T0 - 0.3 : 0; }
    function pace(t){
      if(S.tab === 'syn') return t < 0 ? 1.1 : t < 3 ? 1.5 : 4.5;
      if(S.tab === 'myel'){ var sp = myelRun().spikes[0]; return t < sp ? 1.4 : t < sp + cond().total + 0.2 ? 0.95 : 2; }
      return paceFor(run(), cond().total)(t);
    }
    /* The frame the instant view shows for a setting: the moment that says the most (the peak of the push, or of
       the spike; the second pulse; the signal arrived; the neurotransmitter bound). */
    function keyT(){
      if(S.tab === 'syn') return 1.6;
      if(S.tab === 'myel') return tMax();
      var r = run();
      if(S.tab === 'fire') return r.spikes.length ? r.spikes[0] + 0.45 : T0 + 0.4;
      var e = r.events[1];
      return e.effect === 'spike' ? r.spikes[1] + 0.45 : e.t + 0.4;
    }

    /* ---- what is drawn at model time t: every word and number is read from this */
    function vAt(r, t){ var i = clamp(Math.round(t / N.DT), 0, r.v.length - 1); return r.v[i]; }
    function frameAt(t){
      var f = { tab: S.tab, t: t };
      if(S.tab === 'syn'){
        var sr = synRun(), i = clamp(Math.round(t / N.SYN.dt), 0, sr.t.length - 1);
        f.cleft = t < 0 ? 0 : sr.cleft[i]; f.act = t < 0 ? (S.cls === 'agonist' ? N.SYN.agonist : 0) : sr.act[i];
        f.base = t < 0 ? 0 : synBase().act[i]; f.arrive = t < 0 ? 1 + t / SYN_PRE : null;
        return f;
      }
      var r = run(), c = cond();
      f.V = vAt(r, t); f.run = r;
      f.since = null; f.spikeIdx = -1;
      r.spikes.forEach(function(s, k){ if(t >= s){ f.since = t - s; f.spikeIdx = k; } });
      var s = f.since;
      f.na = s == null || s >= N.ABS ? 'closed' : s < 0.5 ? 'open' : 'locked';
      f.k = s != null && s >= 0.5 && s < 3.2 ? 'open' : 'closed';
      // the signal on the axon, one per spike still travelling; and the terminals once it arrives
      f.aps = []; f.term = 0;
      r.spikes.forEach(function(sp){
        var a = t - sp;
        if(a < 0) return;
        var at = N.travelAt(S.tab === 'myel' ? S.myel : null, a);
        if(at) f.aps.push(at);
        else if(a - c.total < 0.9) f.term = Math.max(f.term, 1 - (a - c.total) / 0.9);
      });
      f.arrived = r.spikes.length && t >= r.spikes[0] + c.total ? r.spikes[0] + c.total : null;
      // inputs: how long ago each pulse arrived
      f.pulses = r.events.map(function(e){ return { t: e.t, age: t - e.t, effect: e.effect }; });
      return f;
    }

    /* ---- the cause line, from the frame (labels wait for the picture) */
    function partsAt(f){
      var p = [];
      if(f.tab === 'fire'){
        var net = S.E - S.I, peak = N.REST + net, fired = f.run.spikes.length > 0;
        p.push({ t: '+' + S.E + ' mV excitatory', role: 'ex', say: S.E + ' millivolts of excitatory input' });
        if(S.I) p.push({ t: '−' + S.I + ' mV inhibitory', role: 'in', join: '+', say: S.I + ' millivolts of inhibitory input' });
        if(f.t >= T0 + 0.4 || (fired && f.t >= f.run.spikes[0])){
          if(fired) p.push({ t: 'passes threshold', role: 'sig', say: 'the charge reaches the threshold of minus 55 millivolts' });
          else p.push({ t: 'reaches ' + mvT(peak), role: 'ink', say: 'the charge only reaches ' + sgn(peak) + ' millivolts' });
        }
        if(fired && f.t >= f.run.spikes[0] + 0.45) p.push({ t: 'fires: +40 mV spike', role: 'sig', say: 'it fires a full action potential to plus 40 millivolts' });
        if(!fired && f.t >= T0 + 0.4) p.push({ t: net < 0 ? 'pushed away: no spike' : 'below threshold: no spike', role: 'ink', say: 'it is below threshold, so there is no action potential' });
      } else if(f.tab === 'refr'){
        var e2 = f.run.events[1];
        p.push({ t: '2nd pulse ' + n1(S.gap) + ' ms later', role: 'ex', say: 'a second pulse ' + n1(S.gap) + ' milliseconds after the first' });
        if(f.t >= e2.t + 0.4 || (e2.effect === 'spike' && f.t >= f.run.spikes[1])){
          if(e2.effect === 'spike'){ p.push({ t: 'refractory period over', role: 'ink' }); if(f.t >= f.run.spikes[1] + 0.45) p.push({ t: 'fires again', role: 'sig' }); }
          else if(e2.effect === 'absolute') p.push({ t: 'still refractory', role: 'refr', say: 'the neuron is still in its refractory period' }, { t: 'no 2nd spike', role: 'ink' });
          else p.push({ t: 'still refractory: too weak', role: 'refr', say: 'the neuron is near the end of its refractory period and the push is too weak' }, { t: 'no 2nd spike', role: 'ink' });
        }
      } else if(f.tab === 'myel'){
        var nm = S.myel.filter(Boolean).length, c = cond();
        p.push({ t: nm === 6 ? 'all 6 myelinated' : nm === 0 ? 'no myelin' : nm + ' of 6 myelinated', role: 'my', say: nm + ' of the 6 stretches are myelinated' });
        p.push({ t: nm === 6 ? 'jumps node to node' : nm === 0 ? 'creeps the whole way' : 'creeps where bare', role: 'sig', say: nm === 6 ? 'the signal jumps from node to node' : nm === 0 ? 'the signal creeps the whole way' : 'the signal creeps along the bare stretches' });
        if(f.arrived != null) p.push({ t: 'arrives in ' + c.total.toFixed(2) + ' ms', role: 'ink', say: 'it reaches the terminals in ' + c.total.toFixed(2) + ' milliseconds' });
      } else {
        var nt = N.NT[S.nt].name, cls = S.cls;
        p.push({ t: nt + ' released', role: 'nt' });
        if(cls === 'agonist') p.push({ t: 'agonist activates receptors', role: 'drug' });
        else if(cls === 'antagonist') p.push({ t: 'antagonist blocks receptors', role: 'drug' });
        else if(cls === 'reuptake') p.push({ t: 'reuptake blocked: it stays', role: 'drug' });
        else p.push({ t: 'reuptake clears it', role: 'ink' });
        if(view.preview || f.t >= N.SYN.dur - 1e-6){ var pc = N.signalPct(cls); p.push({ t: 'signal ' + pc + '%', role: pc > 100 ? 'nt' : pc < 100 ? 'drug' : 'ink', say: 'the receiving neuron gets ' + pc + ' percent of the normal signal' }); }
      }
      return p;
    }
    function takeaway(){
      if(S.tab === 'fire'){
        var r = fireRun(S.E, S.I);
        if(r.spikes.length) return 'All or none: any push past threshold fires the same full spike.';
        if(S.E - S.I < 0) return 'Inhibitory input pushed the charge down, away from firing.';
        if(S.E >= 15 && S.I) return 'The inhibitory input cancelled part of the push, so no spike.';
        return 'Too weak: the charge faded before it reached threshold.';
      }
      if(S.tab === 'refr') return refrRun(S.gap).spikes.length > 1 ? 'The 2nd pulse came after the refractory period, so it fired again.' : 'Right after a spike, the neuron needs a moment before it can fire again.';
      if(S.tab === 'myel') return S.myel.every(Boolean) ? 'Myelin lets the signal jump from node to node, so it arrives fast.' : 'Where myelin is lost, as in multiple sclerosis, the signal slows down.';
      return { none: 'Reuptake pulls the neurotransmitter back in, which ends the signal.', agonist: 'An agonist mimics the neurotransmitter, so more receptors are activated.',
        antagonist: 'An antagonist blocks the receptors, so less of the signal gets through.', reuptake: 'Blocking reuptake leaves the neurotransmitter in the synapse longer.' }[S.cls];
    }
    var wKey = '';
    function syncWords(f){
      var p = partsAt(f), k = JSON.stringify(p);
      if(k !== wKey){ wKey = k; cause.set(p); }
    }
    function sentence(){ return cause.text(); }

    /* ---- time: the instant view, a played run, a scrub */
    function setT(t, pre){
      view.t = clamp(t, tMin(), tMax());
      if(pre != null) view.preview = pre;
      if(scrub) scrub.value(Math.round(view.t * 20) / 20);
      paint();
    }
    function ended(){
      playing = false; view.preview = false; paint();
      cause.take(takeaway());
      wKey = 'take';
      say(takeaway());
    }
    function restart(play){
      if(player.playing()) player.stop();
      playing = false;
      pO.min = tMin(); pO.max = tMax();
      if(!play){ setT(keyT(), true); return; }
      if(K.reduced()){ var old = gDyn.innerHTML; setT(tMax(), false); crossFade(old); ended(); return; }
      view.preview = false; view.t = pO.min; player.reset(); player.start();
    }
    function crossFade(old){
      gFade.innerHTML = old;
      var g = gFade, done = function(){ g.innerHTML = ''; };
      if(g.animate){ var an = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'linear' }); an.onfinish = done; setTimeout(done, 400); } else done();
    }
    var scrub = null;

    /* ---- the controls on the picture */
    function begin(k, v){ if(gest === k) return; gest = k; prev = { k: k, v: v, run: S.tab === 'fire' ? fireRun(S.E, S.I) : S.tab === 'refr' ? refrRun(S.gap) : null, total: cond().total, tab: S.tab }; }
    function changed(){ if(player.playing()) player.stop(); playing = false; pO.min = tMin(); pO.max = tMax(); setT(keyT(), true); refHtml(); }
    function released(){ gest = null; restart(true); }
    var cE = K.drag(layer, { key: 'appsych-neuron-ex', label: 'Excitatory input, in millivolts of push', min: 0, max: EMAX, step: 1, value: S.E, track: [0, 1, 0, 0], chip: false,
      valuetext: function(v){ var r = fireRun(v, S.I); return '+' + v + ' millivolts excitatory. ' + (r.spikes.length ? 'Passes threshold: the neuron fires.' : 'Below threshold: no spike.'); },
      tag: function(v){ return '+' + v + ' mV'; }, tagSide: 'down',
      onInput: function(v){ begin('E', S.E); S.E = v; changed(); tourDid('ex'); },
      onEnd: function(){ released(); } });
    cE.el.classList.add('nr2-kE');
    var cI = K.drag(layer, { label: 'Inhibitory input, in millivolts of push down', min: 0, max: IMAX, step: 1, value: S.I, track: [0, 1, 0, 0], quiet: true,
      valuetext: function(v){ var r = fireRun(S.E, v); return 'Minus ' + v + ' millivolts inhibitory. ' + (r.spikes.length ? 'Still passes threshold: the neuron fires.' : 'Below threshold: no spike.'); },
      tag: function(v){ return v ? '−' + v + ' mV' : '0 mV'; }, tagSide: 'up',
      onInput: function(v){ begin('I', S.I); S.I = v; changed(); tourDid('in'); },
      onEnd: function(){ released(); } });
    cI.el.classList.add('nr2-kI');
    var hGap = K.handle(layer, { key: 'appsych-neuron-gap', label: 'Second pulse: milliseconds after the first', min: 1, max: 10, step: 0.5, value: S.gap, chip: false,
      at: function(v){ return G && G.plot ? [G.plot.X(T0 + v), G.plot.stimY] : [0, 0]; },
      pick: function(x){ if(!G || !G.plot) return null; return clamp(Math.round((G.plot.T(x) - T0) * 2) / 2, 1, 10); },
      dir: function(){ return 0; },
      valuetext: function(v){ var r = refrRun(v), e = r.events[1].effect; return n1(v) + ' milliseconds after the first pulse. ' + (e === 'spike' ? 'It fires again.' : 'Still in the refractory period: no second spike.'); },
      tag: function(v){ return n1(v) + ' ms'; }, tagSide: function(){ return 'right'; },
      onStart: function(v){ begin('gap', S.gap); },
      onInput: function(v){ begin('gap', S.gap); S.gap = v; changed(); tourDid('gap'); },
      onEnd: function(){ released(); } });
    hGap.el.classList.add('nr2-kG');
    var segTaps = S.myel.map(function(m, i){
      var tp = K.tap(layer, { key: i === 0 ? 'appsych-neuron-myelin' : null, label: '', box: [0, 0, 1, 1], pressed: true, chip: i === 0 ? true : false,
        onClick: function(){ hideCue(true); peel(i); } });
      tp.el.classList.add('nr2-seg');
      return tp;
    });
    function segLabel(i){ return 'Myelin stretch ' + (i + 1) + ' of 6: ' + (S.myel[i] ? 'myelinated. Tap to strip it.' : 'bare. Tap to restore its myelin.'); }
    var peelAt = {};
    function peel(i){
      begin('myel', null); prev.myel = S.myel.slice();
      S.myel[i] = !S.myel[i]; peelAt[i] = now();
      segTaps.forEach(function(tp, j){ tp.pressed(S.myel[j]); tp.el.setAttribute('aria-label', segLabel(j)); });
      drawStatic(); tourDid('seg');
      gest = null; refHtml();
      restart(true);
    }
    var drugTaps = DRUGS2.map(function(d, i){
      var tp = K.tap(layer, { key: i === 1 ? 'appsych-neuron-drug' : null, label: d.label + (d.v === 'none' ? '' : ' at the synapse'), box: [0, 0, 1, 1], pressed: d.v === S.cls, chip: false,
        onClick: function(){ hideCue(true); if(S.cls === d.v){ restart(true); return; } begin('cls', S.cls); prev.cls = S.cls; S.cls = d.v; gest = null; drugTaps.forEach(function(x, j){ x.pressed(DRUGS2[j].v === S.cls); }); drawStatic(); refHtml(); tourDid('drug'); restart(true); } });
      tp.el.classList.add('nr2-drug');
      return tp;
    });
    scrub = K.scrub(sceneBox, { key: null, label: 'Time', min: -1, max: 22, step: 0.05, value: 0, knob: false,
      rect: [0, 0, 1, 1], valuetext: function(v){ return n1(v) + ' ms'; },
      onStart: function(){ if(player.playing()) player.stop(); playing = false; hideCue(true); },
      onInput: function(v){ view.preview = false; view.t = clamp(v, tMin(), tMax()); paint(); } });

    var CUE = { fire: { text: 'Drag the excitatory input', at: function(){ return G ? kPos(cE, G.kE) : [0, 0]; }, side: 'right' },
      refr: { text: (window.innerWidth || 1000) < 400 ? 'Drag it closer' : 'Drag the 2nd pulse', at: function(){ return G && G.plot ? [G.plot.X(T0 + S.gap), G.plot.stimY] : [0, 0]; }, side: 'above' },
      myel: { text: 'Tap the myelin', at: function(){ var i = G && G.ph ? 3 : 2; return G ? [G.segs[i][0] + (G.segs[i][1] - G.segs[i][0]) / 2, G.sy + G.myR] : [0, 0]; }, side: 'below' },
      syn: { text: 'Tap a drug', at: function(){ var i = G && G.ph ? 2 : 1; return G && G.drugs ? [G.drugs[i].x + G.drugs[i].w / 2, G.drugs[i].y + G.drugs[i].h] : [0, 0]; }, side: 'below' } };
    function kPos(c, tr){ var f = (c.value() - c.input.min) / (c.input.max - c.input.min); return [tr[0] + (tr[2] - tr[0]) * f, tr[1] + (tr[3] - tr[1]) * f]; }
    var cues = {};
    TABS.forEach(function(t){ cues[t.value] = K.cue(layer, { key: 'appsych-neuron-' + t.value, text: CUE[t.value].text, side: CUE[t.value].side, at: function(){ return CUE[t.value].at(); } }); });
    function hideCue(used){ var c = cues[S.tab]; if(c && c.active()) c.hide(used); stage.classList.remove('is-cue'); }
    stage.addEventListener('pointerdown', function(e){ if(sceneBox.contains(e.target)) hideCue(true); }, true);
    stage.addEventListener('keydown', function(e){ if(sceneBox.contains(e.target) && /^(Arrow|Page|Home|End|Enter| )/.test(e.key)) hideCue(true); }, true);
    var TOUR = {
      fire: [{ id: 'ex', text: 'Drag the excitatory input. Past threshold, the neuron fires.', target: function(){ return cE.el.querySelector('.tk2-knob'); } },
        { id: 'in', text: 'Inhibitory input pushes the other way.', target: function(){ return cI.el.querySelector('.tk2-knob'); } },
        { id: 'read', text: 'The line shows the charge. It fires only above the threshold line.', target: function(){ return G && G.plot ? rectOf(G.plot.x0, G.plot.y0, G.plot.x1, G.plot.y1) : sceneBox; } }],
      refr: [{ id: 'gap', text: 'Drag the 2nd pulse closer to the first.', target: function(){ return hGap.knob; } },
        { id: 'read', text: 'Inside the shaded refractory period, it cannot fire.', target: function(){ return G && G.plot ? rectOf(G.plot.x0, G.plot.y0, G.plot.x1, G.plot.y1) : sceneBox; } }],
      myel: [{ id: 'seg', text: 'Tap a stretch of myelin to strip it.', target: function(){ return segTaps[1].el; } },
        { id: 'read', text: 'Watch the signal creep there, and the time it takes.', target: function(){ return G && G.bar ? rectOf(G.bar.x0, G.bar.y - 20, G.bar.x1, G.bar.y + 20) : sceneBox; } }],
      syn: [{ id: 'drug', text: 'Tap a drug and watch the synapse.', target: function(){ return drugTaps[1].el; } },
        { id: 'read', text: 'The graph shows how many receptors are activated.', target: function(){ return G && G.plot ? rectOf(G.plot.x0, G.plot.y0, G.plot.x1, G.plot.y1) : sceneBox; } }] };
    function rectOf(x0, y0, x1, y1){ var r = sceneBox.getBoundingClientRect(), k = layer.scale(); return { left: r.left + x0 * k, top: r.top + y0 * k, right: r.left + x1 * k, bottom: r.top + y1 * k, width: (x1 - x0) * k, height: (y1 - y0) * k }; }
    var tours = {};
    TABS.forEach(function(t){ tours[t.value] = K.tour({ key: 'appsych-neuron-' + t.value, label: 'Show me how', steps: TOUR[t.value], onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } }); });
    function tourDid(id){ var tr = tours[S.tab]; if(tr && tr.active()) tr.did(id); }
    function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tours[S.tab].start(true); }

    function setTab(v){
      if(v === S.tab) return;
      var old = gDyn.innerHTML + gStatic.innerHTML;
      if(player.playing()) player.stop();
      TABS.forEach(function(t){ var tr = tours[t.value]; if(tr.active()) tr.stop(); var c = cues[t.value]; if(c.active()) c.hide(false); });
      S.tab = v; prev = null; gest = null; wKey = '';
      stage.setAttribute('data-tab', v); head.purpose(PURPOSE[v]);
      try{ history.replaceState(null, '', location.pathname + location.search + '#' + { fire: 'threshold', refr: 'refractory', myel: 'myelin', syn: 'synapse' }[v]); }catch(e){}
      layoutNow(true);
      if(!K.reduced()) crossFade(old);
      restart(false);
      showCue();
      refHtml();
    }
    function showCue(){ if(S.mode === 'explore' && cues[S.tab].show()) cues[S.tab].place(); cueCls(); }
    function cueCls(){ stage.classList.toggle('is-cue', !!(cues[S.tab] && cues[S.tab].active())); }
    function now(){ return window.performance ? performance.now() : Date.now(); }

    /* ================================================================ layout */
    function pillW(t, fs){ return t.length * fs * 0.58 + 18; }
    function geo(W, H){
      var ph = W < 600, tab = S.tab, g = { W: W, H: H, ph: ph, tab: tab };
      var fs = ph ? 12 : 13.5, fsS = ph ? 11.5 : 12.5, pad = ph ? 8 : 16;
      g.fs = fs; g.fsS = fsS; g.pad = pad;
      if(tab === 'syn') return geoSyn(g);
      var gh = tab === 'myel' ? (ph ? 118 : 124) : ph ? 176 : W < 900 ? 180 : clamp(H * 0.4, 196, 260);
      g.gTop = H - gh; g.nTop = pad; g.nBot = g.gTop - (ph ? 4 : 8);
      var nH = g.nBot - g.nTop;
      g.ctlW = tab === 'fire' ? (ph ? 112 : clamp(W * 0.13, 150, 200)) : 0;
      g.rs = tab === 'myel' && !ph ? clamp(nH * 0.15, 24, 52) : ph ? 21 : clamp(nH * 0.13, 24, 40);
      g.sy = g.nTop + nH * (tab === 'myel' ? 0.5 : 0.64);
      if(ph && tab !== 'myel'){ g.inY1 = g.nTop + 104; g.sy = g.inY1 + g.rs * 2.8 + 52; g.nBot = g.sy + g.rs * 2.3 + 52; var room = H - gh - 4 - g.nBot; if(room > 0){ g.sy += room * 0.45; g.nBot += room; } g.gTop = g.nBot + 4; nH = g.nBot - g.nTop; }
      var reach = g.rs * (ph ? 2.2 : 2.5);
      g.sx = pad + g.ctlW + reach + g.rs * 0.5;
      g.termR = ph ? 40 : clamp(W * 0.065, 64, 104);
      g.ax0 = g.sx + g.rs * 1.45; g.ax1 = W - pad - g.termR;
      g.axR = ph ? 3.2 : clamp(g.rs * 0.16, 4, tab === 'myel' ? 7.5 : 5.6); g.myR = g.axR * (tab === 'myel' ? (ph ? 3.4 : 3.2) : 2.3);
      var nodeGap = ph ? 7 : 10, segW = (g.ax1 - g.ax0 - nodeGap * (N.NSEG + 1)) / N.NSEG;
      g.segs = []; for(var s = 0; s < N.NSEG; s++){ var a = g.ax0 + nodeGap + s * (segW + nodeGap); g.segs.push([a, a + segW]); }
      g.nodes = [g.ax0 + nodeGap / 2].concat(g.segs.map(function(q){ return q[1] + nodeGap / 2; }));
      g.nodeGap = nodeGap;
      // the inputs (Threshold): an excitatory and an inhibitory axon from the left, ending on two dendrites
      g.yE = g.sy - g.rs * (ph ? 2.8 : 2.4); g.yI = g.sy + g.rs * (ph ? 2.3 : 2.1);
      g.dE = [g.sx - reach, g.yE]; g.dI = [g.sx - reach * 0.92, g.yI];
      if(tab === 'fire'){
        g.kE = [pad + (ph ? 30 : 34), g.yE, pad + g.ctlW - 12, g.yE];
        g.kI = [pad + (ph ? 30 : 34), g.yI, pad + g.ctlW - 12, g.yI];
      } else { g.dS = [g.sx - reach, g.sy - g.rs * 1.6]; }
      // the membrane close-up (tabs 1 and 2): above the axon, tied to the start of the axon
      if(tab !== 'myel'){
        var iw = ph ? W - pad * 2 : clamp((g.ax1 - g.ax0) * 0.62, 300, 440);
        g.in = { x0: ph ? pad : g.ax0 + 40, y0: g.nTop + (ph ? 0 : 6) };
        g.in.x1 = g.in.x0 + iw;
        if(!ph && g.in.x1 > g.ax1 - 30) { g.in.x1 = g.ax1 - 30; }
        g.in.y1 = ph ? g.inY1 : g.sy - g.myR - 34;
      }
      // the graph
      if(tab === 'myel'){
        g.bar = { x0: pad + (ph ? 12 : 22), x1: W - pad - (ph ? 12 : 22), y: g.gTop + (ph ? 72 : 76), max: N.NSEG * N.CRAWL + 0.2 };
      } else {
        var px0 = pad + (ph ? 42 : 46), px1 = W - pad - (ph ? 4 : 10), py0 = g.gTop + (ph ? 34 : 40), py1 = H - (ph ? 26 : 30);
        var vLo = -138, vHi = 52, dur = DUR[tab];
        var P = { x0: px0, x1: px1, y0: py0, y1: py1, dur: dur, lo: vLo, hi: vHi };
        P.X = function(t){ return px0 + t / dur * (px1 - px0); };
        P.T = function(x){ return (x - px0) / (px1 - px0) * dur; };
        P.Y = function(v){ return py1 - (v - vLo) / (vHi - vLo) * (py1 - py0); };
        P.stimY = P.Y(-112);
        g.plot = P;
      }
      return g;
    }
    function geoSyn(g){
      var W = g.W, H = g.H, ph = g.ph, pad = g.pad;
      var gh = ph ? 176 : clamp(H * 0.34, 176, 220);
      g.gTop = H - gh;
      // the drugs: four pills along the top (two rows on a phone)
      var fsD = ph ? 12.5 : 14, dh = ph ? 40 : 44, gapD = ph ? 8 : 12;
      var widths = DRUGS2.map(function(d){ return pillW(d.label, fsD) + (ph ? 22 : 30); });
      g.drugs = [];
      if(ph){
        var cw = (W - pad * 2 - gapD) / 2;
        DRUGS2.forEach(function(d, i){ g.drugs.push({ x: pad + (i % 2) * (cw + gapD), y: pad + Math.floor(i / 2) * (dh + 6), w: cw, h: dh }); });
      } else {
        var tot = widths.reduce(function(a, b){ return a + b; }, 0) + gapD * 3, x = (W - tot) / 2;
        DRUGS2.forEach(function(d, i){ g.drugs.push({ x: x, y: pad, w: widths[i], h: dh }); x += widths[i] + gapD; });
      }
      g.fsD = fsD;
      var top = g.drugs[g.drugs.length - 1].y + dh + (ph ? 10 : 14), bot = g.gTop - (ph ? 6 : 10), sh = bot - top;
      g.sTop = top; g.sBot = bot;
      var z = clamp(Math.min(W / 520, sh / 250), ph ? 0.78 : 1, 1.9);
      g.z = z;
      g.tw = Math.min(W - pad * 2 - (ph ? 10 : 160), 620 * Math.min(z, 1.3)); g.cx = W / 2;
      g.tl = g.cx - g.tw / 2; g.tr = g.cx + g.tw / 2;
      g.tBot = top + sh * 0.5; g.cleft = clamp(sh * 0.2, 30, 70); g.rTop = g.tBot + g.cleft; g.rBot = bot;
      var px0 = pad + (ph ? 40 : 50), px1 = W - pad - (ph ? 4 : 10), py0 = g.gTop + (ph ? 38 : 44), py1 = H - (ph ? 26 : 30), dur = N.SYN.dur;
      var P = { x0: px0, x1: px1, y0: py0, y1: py1, dur: dur };
      P.X = function(t){ return px0 + t / dur * (px1 - px0); };
      P.T = function(x){ return (x - px0) / (px1 - px0) * dur; };
      P.Y = function(v){ return py1 - v * (py1 - py0); };
      g.plot = P;
      return g;
    }

    /* ================================================================ drawing */
    function pill(x, y, t, cls, anchor, fs, solid){
      var w = pillW(t, fs), h = fs + 10, x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
      return '<g class="nr2-pill ' + (cls || '') + (solid ? ' is-solid' : '') + '" data-lab="' + esc(t) + '"><rect x="' + n1(x0) + '" y="' + n1(y - h / 2) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="' + n1(h / 2) + '"/><text x="' + n1(x0 + w / 2) + '" y="' + n1(y + fs * 0.36) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(t) + '</text></g>';
    }
    function txt(x, y, t, cls, anchor, fs){ return '<text class="' + cls + '" x="' + n1(x) + '" y="' + n1(y) + '" text-anchor="' + (anchor || 'start') + '" style="font-size:' + fs + 'px" data-lab="' + esc(t) + '">' + esc(t) + '</text>'; }
    var DEFS = '<defs>' +
      '<radialGradient id="nr2g-soma" cx=".4" cy=".36" r=".72"><stop offset="0" class="nr2s-c0"/><stop offset=".7" class="nr2s-c1"/><stop offset="1" class="nr2s-c2"/></radialGradient>' +
      '<linearGradient id="nr2g-my" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="nr2s-m0"/><stop offset=".45" class="nr2s-m1"/><stop offset="1" class="nr2s-m2"/></linearGradient>' +
      '<linearGradient id="nr2g-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="nr2s-b0"/><stop offset="1" class="nr2s-b1"/></linearGradient>' +
      '<radialGradient id="nr2g-ap"><stop offset="0" class="nr2s-a0"/><stop offset=".45" class="nr2s-a1"/><stop offset="1" class="nr2s-a2"/></radialGradient>' +
      '<radialGradient id="nr2g-glow"><stop offset="0" class="nr2s-g0"/><stop offset="1" class="nr2s-g1"/></radialGradient>' +
      '<radialGradient id="nr2g-calm"><stop offset="0" class="nr2s-q0"/><stop offset="1" class="nr2s-q1"/></radialGradient>' +
      '<linearGradient id="nr2g-term" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="nr2s-c2"/><stop offset=".6" class="nr2s-c1"/><stop offset="1" class="nr2s-c0"/></linearGradient>' +
      '<linearGradient id="nr2g-rcv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="nr2s-c0"/><stop offset="1" class="nr2s-c2"/></linearGradient>' +
      '<linearGradient id="nr2g-out" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="nr2s-o0"/><stop offset="1" class="nr2s-o1"/></linearGradient>' +
      '<linearGradient id="nr2g-cyt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="nr2s-y0"/><stop offset="1" class="nr2s-y1"/></linearGradient>' +
      '</defs>';

    /* The neuron: dendrites (a seeded tree), the cell body with its nucleus, the hillock, the axon with its myelin
       and nodes, and a fan of terminals. Everything from G, so the controls and the moving parts line up. */
    function neuronSvg(g){
      var p = [], rng = M.rng(41), sx = g.sx, sy = g.sy, rs = g.rs, reach = g.rs * (g.ph ? 2.2 : 2.5), dend = [];
      g.tips = [];
      function branch(x, y, ang, len, wd, depth, toward){
        var ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
        if(toward){ ex = toward[0]; ey = toward[1]; }
        ex = Math.max(g.pad + g.ctlW + 2, ex); ey = clamp(ey, g.nTop + 4, g.nBot - 4);
        var bend = (rng() - 0.5) * 0.5, cx = (x + ex) / 2 + Math.cos(ang + Math.PI / 2) * len * bend * 0.4, cy = (y + ey) / 2 + Math.sin(ang + Math.PI / 2) * len * bend * 0.4;
        dend.push({ d: 'M' + n1(x) + ' ' + n1(y) + 'Q' + n1(cx) + ' ' + n1(cy) + ' ' + n1(ex) + ' ' + n1(ey), w: wd });
        if(depth > 0 && !toward){
          branch(ex, ey, ang - 0.45 - rng() * 0.2, len * 0.64, wd * 0.6, depth - 1);
          branch(ex, ey, ang + 0.38 + rng() * 0.2, len * 0.58, wd * 0.6, depth - 1);
        } else if(!toward) g.tips.push([ex, ey]);
      }
      var L0 = reach * 0.55;
      [-2.2, -1.65, 2.75, 2.15, 1.7].forEach(function(a, i){
        var bx = sx + Math.cos(a) * rs * 0.86, by = sy + Math.sin(a) * rs * 0.86;
        branch(bx, by, a + (rng() - 0.5) * 0.2, L0 * (i === 2 ? 1.05 : 0.9), Math.max(2.4, rs * 0.26), g.ph ? 1 : 2);
      });
      // the two (or one) dendrites that the inputs reach
      var ins = g.tab === 'fire' ? [g.dE, g.dI] : [g.dS];
      ins.forEach(function(d){
        var a = Math.atan2(d[1] - sy, d[0] - sx), bx = sx + Math.cos(a) * rs * 0.9, by = sy + Math.sin(a) * rs * 0.9;
        branch(bx, by, a, 0, Math.max(2.6, rs * 0.24), 0, [d[0] + 6, d[1]]);
      });
      p.push('<g class="nr2-dend">' + dend.map(function(d){ return '<path class="nr2-edge" d="' + d.d + '" stroke-width="' + n1(d.w + 2.4) + '"/>'; }).join('') +
        dend.map(function(d){ return '<path class="nr2-den" d="' + d.d + '" stroke-width="' + n1(d.w) + '"/>'; }).join('') + '</g>');
      // the axon core, under the myelin
      p.push('<line class="nr2-edge" x1="' + n1(g.ax0 - 4) + '" y1="' + n1(sy) + '" x2="' + n1(g.ax1 + 2) + '" y2="' + n1(sy) + '" stroke-width="' + n1(g.axR * 2 + 2.4) + '"/>');
      p.push('<line class="nr2-ax" x1="' + n1(g.ax0 - 4) + '" y1="' + n1(sy) + '" x2="' + n1(g.ax1 + 2) + '" y2="' + n1(sy) + '" stroke-width="' + n1(g.axR * 2) + '"/>');
      // terminals: a fan of branches ending in round buttons
      var tn = 4, spread = Math.min((g.nBot - g.nTop) * 0.34, g.ph ? 46 : 70);
      g.fan = [];
      for(var j = 0; j < tn; j++){
        var ty = sy + (j - (tn - 1) / 2) * spread / (tn - 1) * 2, tx = g.W - g.pad - g.axR * 2.4 - (j % 2) * (g.ph ? 5 : 9);
        g.fan.push({ d: 'M' + n1(g.ax1) + ' ' + n1(sy) + 'C' + n1(g.ax1 + (tx - g.ax1) * 0.45) + ' ' + n1(sy) + ' ' + n1(g.ax1 + (tx - g.ax1) * 0.5) + ' ' + n1(ty) + ' ' + n1(tx - 5) + ' ' + n1(ty), end: [tx, ty] });
      }
      p.push('<g class="nr2-term">' + g.fan.map(function(t){
        return '<path class="nr2-edge" d="' + t.d + '" stroke-width="' + n1(g.axR * 1.3 + 2.4) + '"/><path class="nr2-ax" d="' + t.d + '" stroke-width="' + n1(g.axR * 1.3) + '"/>' +
          '<ellipse class="nr2-btn" cx="' + n1(t.end[0]) + '" cy="' + n1(t.end[1]) + '" rx="' + n1(g.axR * 2.3) + '" ry="' + n1(g.axR * 1.9) + '"/>' +
          '<circle class="nr2-vdot" cx="' + n1(t.end[0] + g.axR * 0.5) + '" cy="' + n1(t.end[1] - g.axR * 0.4) + '" r="' + n1(g.axR * 0.45) + '"/><circle class="nr2-vdot" cx="' + n1(t.end[0] - g.axR * 0.7) + '" cy="' + n1(t.end[1] + g.axR * 0.5) + '" r="' + n1(g.axR * 0.45) + '"/>';
      }).join('') + '</g>');
      // myelin: wrapped sheaths with nodes between (in Myelin a stripped stretch shows its bare axon)
      var my = [];
      g.segs.forEach(function(q, i){
        var on = S.tab !== 'myel' || S.myel[i], age = peelAt[i] != null ? (now() - peelAt[i]) / 380 : 1;
        if(!on && age >= 1) return;
        var k = on ? (age < 1 ? sm(age) : 1) : 1 - sm(age), hh = g.myR * (0.55 + 0.45 * k), op = on ? 1 : k;
        my.push('<g class="nr2-myel' + (on ? '' : ' is-going') + '" opacity="' + op.toFixed(2) + '"><rect x="' + n1(q[0]) + '" y="' + n1(sy - hh) + '" width="' + n1(q[1] - q[0]) + '" height="' + n1(hh * 2) + '" rx="' + n1(hh) + '"/>' +
          wraps(q[0], q[1], sy, hh) + '</g>');
      });
      p.push('<g class="nr2-mys">' + my.join('') + '</g>');
      // the cell body: a soft blob, the hillock tapering into the axon, the nucleus
      var bumps = 7, bp = [];
      for(var b = 0; b <= bumps; b++){ var a = b / bumps * Math.PI * 2, rr = rs * (1 + 0.08 * Math.sin(a * 3 + 1)); bp.push([sx + Math.cos(a) * rr, sy + Math.sin(a) * rr * 0.92]); }
      var soma = 'M' + n1(bp[0][0]) + ' ' + n1(bp[0][1]);
      for(var k2 = 1; k2 < bp.length; k2++){ var p0 = bp[k2 - 1], p1 = bp[k2], mx = (p0[0] + p1[0]) / 2, mY = (p0[1] + p1[1]) / 2; soma += 'Q' + n1(mx + (mx - sx) * 0.12) + ' ' + n1(mY + (mY - sy) * 0.12) + ' ' + n1(p1[0]) + ' ' + n1(p1[1]); }
      soma += 'Z';
      var hill = 'M' + n1(sx + rs * 0.7) + ' ' + n1(sy - rs * 0.5) + 'Q' + n1(sx + rs * 1.2) + ' ' + n1(sy - g.axR * 1.6) + ' ' + n1(g.ax0) + ' ' + n1(sy - g.axR) + 'L' + n1(g.ax0) + ' ' + n1(sy + g.axR) + 'Q' + n1(sx + rs * 1.2) + ' ' + n1(sy + g.axR * 1.6) + ' ' + n1(sx + rs * 0.7) + ' ' + n1(sy + rs * 0.5) + 'Z';
      g.hill = [sx + rs * 1.15, sy];
      p.push('<path class="nr2-soma" d="' + hill + '"/><path class="nr2-soma" d="' + soma + '"/>');
      var er = M.rng(7);
      for(var q2 = 0; q2 < 14; q2++){ var aa = er() * Math.PI * 2, dd = rs * (0.55 + er() * 0.32); p.push('<circle class="nr2-nissl" cx="' + n1(sx + Math.cos(aa) * dd) + '" cy="' + n1(sy + Math.sin(aa) * dd * 0.9) + '" r="' + n1(Math.max(0.9, rs * 0.045)) + '"/>'); }
      p.push('<ellipse class="nr2-nuc" cx="' + n1(sx - rs * 0.1) + '" cy="' + n1(sy - rs * 0.04) + '" rx="' + n1(rs * 0.4) + '" ry="' + n1(rs * 0.36) + '"/><circle class="nr2-nucl" cx="' + n1(sx - rs * 0.04) + '" cy="' + n1(sy - rs * 0.1) + '" r="' + n1(rs * 0.12) + '"/>');
      return p.join('');
    }
    function wraps(a, b, y, hh){
      var w = b - a, n = Math.max(2, Math.round(w / 14)), s = [];
      for(var i = 1; i < n; i++){ var x = a + w * i / n; s.push('M' + n1(x - hh * 0.35) + ' ' + n1(y - hh * 0.86) + 'Q' + n1(x + hh * 0.3) + ' ' + n1(y) + ' ' + n1(x - hh * 0.35) + ' ' + n1(y + hh * 0.86)); }
      return '<path class="nr2-wrap" d="' + s.join('') + '"/>';
    }
    /* An input axon from the left edge ending in a terminal button on the dendrite at d. */
    function inputSvg(g, d, y, cls){
      var x0 = g.tab === 'fire' ? g.pad : g.pad, bx = d[0] - 2, p = [];
      p.push('<path class="nr2-edge" d="M' + n1(x0) + ' ' + n1(y) + 'H' + n1(bx - 10) + '" stroke-width="' + n1(g.axR * 1.7 + 2.4) + '"/>');
      p.push('<path class="nr2-inax ' + cls + '" d="M' + n1(x0) + ' ' + n1(y) + 'H' + n1(bx - 10) + '" stroke-width="' + n1(g.axR * 1.7) + '"/>');
      p.push('<ellipse class="nr2-inbtn ' + cls + '" cx="' + n1(bx - 6) + '" cy="' + n1(y) + '" rx="' + n1(g.axR * 2.6) + '" ry="' + n1(g.axR * 2.2) + '"/>');
      return p.join('');
    }
    /* The membrane close-up's fixed parts: the two fluids, the bilayer, and its labels. */
    function insetStatic(g){
      var I = g.in, p = [], w = I.x1 - I.x0, h = I.y1 - I.y0, mid = I.y0 + h * 0.55, th = g.ph ? 11 : 14;
      I.mid = mid; I.th = th; I.na = I.x0 + w * (g.ph ? 0.42 : 0.32); I.k = I.x0 + w * (g.ph ? 0.8 : 0.68);
      p.push('<path class="nr2-lead" d="M' + n1(I.x0 + 18) + ' ' + n1(I.y1) + 'L' + n1(g.ax0 + 2) + ' ' + n1(g.sy - g.axR - 2) + '"/>');
      p.push('<circle class="nr2-leaddot" cx="' + n1(g.ax0 + 2) + '" cy="' + n1(g.sy - g.axR - 1) + '" r="3"/>');
      p.push('<clipPath id="nr2c-in"><rect x="' + n1(I.x0) + '" y="' + n1(I.y0) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="14"/></clipPath>');
      p.push('<g clip-path="url(#nr2c-in)"><rect class="nr2-outf" x="' + n1(I.x0) + '" y="' + n1(I.y0) + '" width="' + n1(w) + '" height="' + n1(mid - I.y0) + '"/><rect class="nr2-cyt" x="' + n1(I.x0) + '" y="' + n1(mid) + '" width="' + n1(w) + '" height="' + n1(I.y1 - mid) + '"/>');
      // the bilayer: two rows of heads with tails
      var heads = [], step = g.ph ? 6.5 : 7.5;
      for(var x = I.x0 + 3; x < I.x1; x += step){
        if(Math.abs(x - I.na) < (g.ph ? 13 : 16) || Math.abs(x - I.k) < (g.ph ? 13 : 16)) continue;
        heads.push('<circle cx="' + n1(x) + '" cy="' + n1(mid - th / 2) + '" r="' + n1(step * 0.36) + '"/><circle cx="' + n1(x) + '" cy="' + n1(mid + th / 2) + '" r="' + n1(step * 0.36) + '"/>');
      }
      p.push('<rect class="nr2-tails" x="' + n1(I.x0) + '" y="' + n1(mid - th / 2) + '" width="' + n1(w) + '" height="' + n1(th) + '"/><g class="nr2-heads">' + heads.join('') + '</g></g>');
      p.push('<rect class="nr2-inframe" x="' + n1(I.x0) + '" y="' + n1(I.y0) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="14"/>');
      var fsS = g.fsS;
      p.push(txt(I.x1 - 10, I.y0 + fsS + 5, 'outside', 'nr2-side-t', 'end', fsS - 0.5));
      p.push(g.ph ? txt(I.x0 + 12, I.y1 - 8, 'inside', 'nr2-side-t', 'start', fsS - 0.5) : txt(I.x1 - 10, I.y1 - 8, 'inside', 'nr2-side-t', 'end', fsS - 0.5));
      p.push(txt(I.x0 + 12, I.y0 + fsS + 5, g.ph ? 'Close-up' : 'Membrane close-up', 'nr2-in-t', 'start', fsS));
      return p.join('');
    }
    /* Ions in the close-up: where each sits at model time t (Na+ above, K+ below; a few cross at each spike). */
    var IONS = null;
    function ionSeats(g){
      var I = g.in, w = I.x1 - I.x0, r = M.rng(5), na = [], k = [], tries = 0;
      function free(list, x, y){ return list.every(function(q){ return Math.hypot(q[0] - x, q[1] - y) > (g.ph ? 15 : 19); }); }
      function seat(top, list, n){
        while(list.length < n && tries < 4000){
          tries++;
          var x = I.x0 + 14 + r() * (w - 28), y = top ? I.y0 + 22 + r() * (I.mid - I.th - I.y0 - 30) : I.mid + I.th + 8 + r() * (I.y1 - I.mid - I.th - 18);
          if(Math.abs(x - I.na) < 18 || Math.abs(x - I.k) < 18) continue;
          if(top && x < I.x0 + (g.ph ? 74 : 150) && y < I.y0 + 26) continue;   // the title
          if(x > I.x1 - 62 && (top ? y < I.y0 + 26 : y > I.y1 - 22)) continue; // outside / inside words
          if(free(na.concat(k), x, y)) list.push([x, y]);
        }
      }
      seat(true, na, g.ph ? 7 : 10); seat(false, na, g.ph ? 9 : 12); seat(false, k, g.ph ? 7 : 10); seat(true, k, g.ph ? 9 : 12);
      var nOut = g.ph ? 7 : 10;
      return { na: na, k: k, naOut: nOut, kIn: g.ph ? 7 : 10 };
    }
    function chan(x, mid, th, state, cls, g){
      var h = th + (g.ph ? 10 : 12), wd = g.ph ? 7 : 8.5, open = state === 'open' || state === 'locked', gap = open ? (g.ph ? 6 : 8) : 1.5, p = [];
      p.push('<g class="nr2-chan ' + cls + (open ? ' is-open' : '') + '">');
      p.push('<rect x="' + n1(x - gap / 2 - wd) + '" y="' + n1(mid - h / 2) + '" width="' + n1(wd) + '" height="' + n1(h) + '" rx="' + n1(wd / 2) + '"/>');
      p.push('<rect x="' + n1(x + gap / 2) + '" y="' + n1(mid - h / 2) + '" width="' + n1(wd) + '" height="' + n1(h) + '" rx="' + n1(wd / 2) + '"/>');
      if(state === 'locked') p.push('<circle class="nr2-plug" cx="' + n1(x) + '" cy="' + n1(mid + h / 2 - 1) + '" r="' + n1(gap * 0.62 + 1) + '"/><path class="nr2-chain" d="M' + n1(x) + ' ' + n1(mid + h / 2 - 1) + 'Q' + n1(x + wd * 1.4) + ' ' + n1(mid + h / 2 + 4) + ' ' + n1(x + gap / 2 + wd) + ' ' + n1(mid + h / 4) + '"/>');
      p.push('</g>');
      return p.join('');
    }
    function ionSvg(x, y, rr, cls){ return '<g class="nr2-ion ' + cls + '"><circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + n1(rr) + '"/><path d="M' + n1(x - rr * 0.5) + ' ' + n1(y) + 'h' + n1(rr) + 'M' + n1(x) + ' ' + n1(y - rr * 0.5) + 'v' + n1(rr) + '"/></g>'; }
    /* Where ion i of a kind is at time t: its seat, or on its way through its channel during a spike. Returns
       [x, y, crossed]. Na+ crosses in the rising phase, K+ in the falling phase; 2 of each per spike. */
    function ionAt(kind, i, f, g){
      var I = g.in, seats = IONS[kind], s0 = seats[i], spikes = f.run ? f.run.spikes : [], nOut = kind === 'na' ? IONS.naOut : IONS.kIn;
      if(i >= nOut) return [s0[0], s0[1], false];
      var k = Math.floor(i / 2), j = i % 2;
      if(k >= spikes.length) return [s0[0], s0[1], false];
      var a = f.t - spikes[k], w0 = kind === 'na' ? 0.02 + j * 0.14 : 0.55 + j * 0.45, dur = kind === 'na' ? 0.3 : 0.8;
      var u = (a - w0) / dur;
      if(u <= 0) return [s0[0], s0[1], false];
      var cx = kind === 'na' ? I.na : I.k, dir = kind === 'na' ? 1 : -1;
      var mouthA = [cx, I.mid - dir * (I.th / 2 + 12)], mouthB = [cx, I.mid + dir * (I.th / 2 + 12)];
      var dest = [cx + (j ? 1 : -1) * (g.ph ? 22 : 34) + (kind === 'na' ? 6 : -6), kind === 'na' ? I.mid + I.th / 2 + (I.y1 - I.mid - I.th / 2) * 0.5 : I.y0 + (I.mid - I.th / 2 - I.y0) * 0.55];
      if(u >= 1) return [dest[0], dest[1], true];
      var pts = [s0, mouthA, mouthB, dest], seg = Math.min(2, Math.floor(u * 3)), v = sm(u * 3 - seg), A = pts[seg], B = pts[seg + 1];
      return [A[0] + (B[0] - A[0]) * v, A[1] + (B[1] - A[1]) * v, u > 0.5];
    }

    function drawStatic(){
      if(!G) return;
      var g = G, p = [DEFS];
      p.push('<rect class="nr2-bg" x="0" y="0" width="' + g.W + '" height="' + g.H + '"/>');
      if(g.tab === 'syn'){ gStatic.innerHTML = p.join('') + synStatic(g); return; }
      p.push('<rect class="nr2-gband" x="0" y="' + n1(g.gTop) + '" width="' + g.W + '" height="' + n1(g.H - g.gTop) + '"/>');
      if(g.tab === 'fire'){ p.push(inputSvg(g, g.dE, g.yE, 'is-ex')); p.push(inputSvg(g, g.dI, g.yI, 'is-in')); }
      else p.push(inputSvg(g, g.dS, g.dS[1], 'is-ex'));
      p.push(neuronSvg(g));
      if(g.in){ p.push(insetStatic(g)); IONS = ionSeats(g); }
      p.push(labelsSvg(g));
      if(g.plot) p.push(plotStatic(g));
      if(g.bar) p.push(barStatic(g));
      gStatic.innerHTML = p.join('');
    }
    /* The names on the picture: each attached to the part it names, kept clear of each other. */
    function labelsSvg(g){
      var fs = g.fsS, p = [];
      g.labs = [];
      function L(x, y, t, cls, anchor){ var w = pillW(t, fs), x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2; x0 = clamp(x0, 3, g.W - 3 - w); g.labs.push({ x: x0, y: y, t: t, w: w, anchor: 'start' }); p.push(pill(x0, y, t, cls, 'start', fs)); }
      var dTop = Math.min.apply(null, g.tips.map(function(q){ return q[1]; }));
      if(g.tab === 'fire'){
        L(g.pad + 2, g.yE - (g.ph ? 36 : 36), 'Excitatory', 'is-ex', 'start');
        L(g.pad + 2, g.yI + (g.ph ? 34 : 36), 'Inhibitory', 'is-in', 'start');
        L(g.sx - g.rs * 1.5, g.sy + g.rs * (g.ph ? 3.3 : 2.9), 'Dendrites', 'is-cell', 'middle');
      } else if(g.tab === 'refr' || !g.ph){
        L(g.pad + 2, g.dS[1] - (g.ph ? 22 : 26), g.ph ? 'Input' : 'Input from a neuron', 'is-ex', 'start');
        if(!g.ph) L(g.sx - g.rs * 1.2, g.sy + g.rs + 58, 'Dendrites', 'is-cell', 'middle');
      }
      L(g.sx + (g.tab === 'fire' ? 0 : g.rs * 0.8), g.sy + g.rs + (g.ph ? 22 : 24), 'Cell body', 'is-cell', 'middle');
      var s1 = g.segs[g.ph ? 2 : 1], sL = g.segs[g.ph ? 5 : 4], my = g.tab === 'myel';
      L((s1[0] + s1[1]) / 2, my || g.ph ? g.sy - g.myR - (g.ph ? 18 : 22) : g.sy + g.myR + (g.ph ? 17 : 20), 'Myelin', 'is-my', 'middle');
      if(!my) L((sL[0] + sL[1]) / 2, g.sy + g.myR + (g.ph ? 17 : 22), 'Axon', 'is-cell', 'middle');
      if(my){ var nd = g.nodes[g.ph ? 5 : 4]; L(nd, g.sy - g.myR - (g.ph ? 18 : 22), 'Node', 'is-cell', 'middle'); }
      var fr = g.fan[g.fan.length - 1].end;
      var fr0 = g.fan[0].end;
      L(g.W - g.pad, my ? fr0[1] - g.axR * 2 - (g.ph ? 18 : 20) : Math.min(g.nBot - 12, fr[1] + g.axR * 2 + (g.ph ? 18 : 20)), g.ph ? 'Terminals' : 'Axon terminals', 'is-cell', 'end');
      return p.join('');
    }
    function plotStatic(g){
      var P = g.plot, p = [], fs = g.fsS, tab = g.tab;
      p.push(txt(g.pad + 2, g.gTop + (g.ph ? 20 : 24), g.ph ? 'Charge at the start of the axon (mV)' : 'Charge at the start of the axon (mV)', 'nr2-gt', 'start', g.fs));
      p.push('<rect class="nr2-plotbg" x="' + n1(P.x0) + '" y="' + n1(P.y0) + '" width="' + n1(P.x1 - P.x0) + '" height="' + n1(P.Y(-86) - P.y0) + '" rx="4"/>');
      [40, 0, -70].forEach(function(v){ p.push('<line class="nr2-grid" x1="' + n1(P.x0) + '" x2="' + n1(P.x1) + '" y1="' + n1(P.Y(v)) + '" y2="' + n1(P.Y(v)) + '"/>' + txt(P.x0 - 6, P.Y(v) + 4, sgn(v), 'nr2-tk', 'end', fs)); });
      var step = tab === 'fire' ? 2 : 4;
      for(var t = 0; t <= P.dur + 1e-9; t += step){ var last = t + step > P.dur + 1e-9; p.push(txt(last ? P.X(t) + 6 : P.X(t), P.y1 + 18, last ? t + ' ms' : String(t), 'nr2-tk', last ? 'end' : 'middle', fs)); }
      p.push('<line class="nr2-thr" x1="' + n1(P.x0) + '" x2="' + n1(P.x1) + '" y1="' + n1(P.Y(N.THRESH)) + '" y2="' + n1(P.Y(N.THRESH)) + '"/>');
      p.push(txt(P.x1 - 4, P.Y(N.THRESH) - 5, 'threshold ' + mvT(N.THRESH), 'nr2-thr-t', 'end', fs));
      p.push(txt(P.x1 - 4, P.Y(N.REST) + fs + 3, g.ph ? 'resting' : 'resting ' + mvT(N.REST), 'nr2-rest-t', 'end', fs));
      p.push('<line class="nr2-stimrow" x1="' + n1(P.x0) + '" x2="' + n1(P.x1) + '" y1="' + n1(P.stimY) + '" y2="' + n1(P.stimY) + '"/>');
      return p.join('');
    }
    function barStatic(g){
      var B = g.bar, p = [], fs = g.fsS, X = function(t){ return B.x0 + t / B.max * (B.x1 - B.x0); };
      B.X = X;
      p.push(txt(g.pad + 2, g.gTop + (g.ph ? 22 : 26), 'Time to reach the terminals', 'nr2-gt', 'start', g.fs));
      p.push('<rect class="nr2-track" x="' + n1(B.x0) + '" y="' + n1(B.y - 5) + '" width="' + n1(B.x1 - B.x0) + '" height="10" rx="5"/>');
      for(var t = 0; t <= Math.floor(B.max); t++) p.push('<line class="nr2-grid" x1="' + n1(X(t)) + '" x2="' + n1(X(t)) + '" y1="' + n1(B.y + 7) + '" y2="' + n1(B.y + 12) + '"/>' + txt(X(t), B.y + 12 + fs + 2, t + (t === Math.floor(B.max) ? ' ms' : ''), 'nr2-tk', 'middle', fs));
      return p.join('');
    }

    /* The synapse close-up's fixed parts. */
    function synStatic(g){
      var p = [], z = g.z, tl = g.tl, tr = g.tr, tBot = g.tBot, cx = g.cx, top = g.sTop;
      p.push('<rect class="nr2-gband" x="0" y="' + n1(g.gTop) + '" width="' + g.W + '" height="' + n1(g.H - g.gTop) + '"/>');
      // the drug pills
      g.drugs.forEach(function(b, i){
        var d = DRUGS2[i], on = d.v === S.cls, t = g.ph ? d.short : d.label, cyy = b.y + b.h / 2, ix = b.x + (g.ph ? 16 : 20);
        p.push('<g class="nr2-dpill' + (on ? ' is-on' : '') + '" data-drug="' + d.v + '"><rect x="' + n1(b.x) + '" y="' + n1(b.y) + '" width="' + n1(b.w) + '" height="' + n1(b.h) + '" rx="' + n1(b.h / 2) + '"/>' +
          drugIcon(d.v, ix, cyy, g.ph ? 6 : 7) + '<text x="' + n1(ix + (g.ph ? 12 : 16)) + '" y="' + n1(cyy + g.fsD * 0.36) + '" style="font-size:' + g.fsD + 'px">' + esc(t) + '</text></g>');
      });
      // the sending terminal: a bulb from the top
      var shoulder = top + (tBot - top) * 0.3;
      g.termPath = 'M' + n1(cx - g.tw * 0.16) + ' ' + n1(top) + 'C' + n1(cx - g.tw * 0.18) + ' ' + n1(shoulder * 0.5 + top * 0.5) + ' ' + n1(tl) + ' ' + n1(shoulder) + ' ' + n1(tl) + ' ' + n1(tBot - 26) + 'Q' + n1(tl) + ' ' + n1(tBot) + ' ' + n1(tl + 26) + ' ' + n1(tBot) +
        'L' + n1(tr - 26) + ' ' + n1(tBot) + 'Q' + n1(tr) + ' ' + n1(tBot) + ' ' + n1(tr) + ' ' + n1(tBot - 26) + 'C' + n1(tr) + ' ' + n1(shoulder) + ' ' + n1(cx + g.tw * 0.18) + ' ' + n1(shoulder * 0.5 + top * 0.5) + ' ' + n1(cx + g.tw * 0.16) + ' ' + n1(top) + 'Z';
      p.push('<path class="nr2-sterm" d="' + g.termPath + '"/>');
      // the receiving neuron: a dendrite seen side on
      var rT = g.rTop, rB = g.rBot, x0 = g.pad, x1 = g.W - g.pad;
      p.push('<path class="nr2-rcv" d="M' + n1(x0) + ' ' + n1(rT + 10) + 'Q' + n1(cx) + ' ' + n1(rT - 10) + ' ' + n1(x1) + ' ' + n1(rT + 10) + 'L' + n1(x1) + ' ' + n1(rB - 14) + 'Q' + n1(x1) + ' ' + n1(rB) + ' ' + n1(x1 - 14) + ' ' + n1(rB) + 'L' + n1(x0 + 14) + ' ' + n1(rB) + 'Q' + n1(x0) + ' ' + n1(rB) + ' ' + n1(x0) + ' ' + n1(rB - 14) + 'Z"/>');
      var fs = g.fsS;
      // receptors and transporters (their positions are used by the moving parts)
      g.rec = []; for(var i = 0; i < 8; i++){ var x = tl + 30 * z + i * (g.tw - 60 * z) / 7, u = (x - x0) / (x1 - x0); g.rec.push([x, rT + 10 - 20 * 4 * u * (1 - u)]); }
      g.trs = [[tl + 16 * z, tBot - 4 * z], [tr - 16 * z, tBot - 4 * z]];
      g.ves = []; for(var v = 0; v < 5; v++) g.ves.push([cx + (v - 2) * Math.min(46 * z, g.tw / 6), tBot - 32 * z - (v % 2) * 22 * z]);
      g.labs = [];
      function L(x, y, t, cls, anchor){ var w = pillW(t, fs), x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2; x0 = clamp(x0, 3, g.W - 3 - w); g.labs.push({ x: x0, y: y, t: t, w: w, anchor: 'start' }); p.push(pill(x0, y, t, cls, 'start', fs)); }
      L(cx + g.tw * 0.2, top + (tBot - top) * 0.28, g.ph ? 'Sending' : 'Sending neuron', 'is-cell', 'start');
      L(cx, rB - fs - 2, 'Receiving neuron', 'is-cell', 'middle');
      L(g.pad + 2, tBot + g.cleft / 2, 'Synapse', 'is-cell', 'start');
      L(g.trs[1][0] + 12 * z, g.trs[1][1] - 22 * z - 6, 'Reuptake', 'is-ink', 'middle');
      L(g.rec[1][0], g.rec[1][1] + 26 * z + 10, 'Receptors', 'is-ink', 'middle');
      // the graph
      var P = g.plot;
      p.push(txt(g.pad + 2, g.gTop + (g.ph ? 20 : 24), 'Receptors activated (%)', 'nr2-gt', 'start', g.fs));
      p.push('<rect class="nr2-plotbg" x="' + n1(P.x0) + '" y="' + n1(P.y0) + '" width="' + n1(P.x1 - P.x0) + '" height="' + n1(P.y1 - P.y0) + '" rx="4"/>');
      [0, 0.5, 1].forEach(function(v){ p.push('<line class="nr2-grid" x1="' + n1(P.x0) + '" x2="' + n1(P.x1) + '" y1="' + n1(P.Y(v)) + '" y2="' + n1(P.Y(v)) + '"/>' + txt(P.x0 - 6, P.Y(v) + 4, String(v * 100), 'nr2-tk', 'end', fs)); });
      for(var t = 3; t <= P.dur; t += 3){ var last = t + 3 > P.dur; p.push(txt(last ? P.X(t) + 6 : P.X(t), P.y1 + 16, last ? t + ' ms' : String(t), 'nr2-tk', last ? 'end' : 'middle', fs)); }
      return p.join('');
    }
    function drugIcon(cls, x, y, r){
      if(cls === 'agonist') return '<path class="nr2-dmol" d="M' + n1(x) + ' ' + n1(y - r * 1.1) + 'l' + n1(r) + ' ' + n1(r * 1.1) + 'l' + n1(-r) + ' ' + n1(r * 1.1) + 'l' + n1(-r) + ' ' + n1(-r * 1.1) + 'z"/>';
      if(cls === 'antagonist') return '<rect class="nr2-dmol" x="' + n1(x - r * 0.9) + '" y="' + n1(y - r * 0.9) + '" width="' + n1(r * 1.8) + '" height="' + n1(r * 1.8) + '" rx="1.5"/>';
      if(cls === 'reuptake') return '<path class="nr2-dmol" d="M' + n1(x - r) + ' ' + n1(y + r * 0.85) + 'L' + n1(x) + ' ' + n1(y - r) + 'L' + n1(x + r) + ' ' + n1(y + r * 0.85) + 'z"/>';
      return '<circle class="nr2-nomol" cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + n1(r * 0.85) + '"/><path class="nr2-nomol-x" d="M' + n1(x - r * 0.6) + ' ' + n1(y + r * 0.6) + 'L' + n1(x + r * 0.6) + ' ' + n1(y - r * 0.6) + '"/>';
    }

    /* ---- the moving parts, from the frame */
    var lastF = null;
    function paint(){
      if(!G || stage.hidden) return;
      var f = frameAt(view.t);
      lastF = f;
      view.clock = now();
      gDyn.innerHTML = S.tab === 'syn' ? synDyn(G, f) : neuronDyn(G, f);
      if(S.mode === 'explore' && !(wKey === 'take' && !playing && view.t >= tMax() - 1e-6)) syncWords(f);
      var al = altText(f);
      if(paint.al !== al){ paint.al = al; svg.setAttribute('aria-label', al); }
      if(scrub){ var sv = Math.round(view.t * 20) / 20; if(+scrub.input.value !== sv) scrub.value(sv); }
    }
    function chargeOf(V){ return clamp((V - N.REST) / (N.THRESH - N.REST), -1, 1); }
    function neuronDyn(g, f){
      var p = [], sx = g.sx, sy = g.sy, rs = g.rs, t = f.t, jit = playing && !K.reduced();
      // the inputs arriving: neurotransmitter puffs at the input button, then a ripple of charge to the cell body
      f.pulses.forEach(function(pu){
        if(pu.age < 0 || pu.age > 0.9) return;
        var list = g.tab === 'fire' ? [['is-ex', g.dE, S.E], ['is-in', g.dI, S.I]] : [['is-ex', g.dS, SREFR]];
        list.forEach(function(L){
          if(!L[2]) return;
          var d = L[1], u = pu.age / 0.9, n = Math.max(2, Math.min(7, Math.round(L[2] / 4)));
          for(var i = 0; i < n; i++){ var a = (i / n - 0.5) * 1.6, rr = 4 + u * 14; p.push('<circle class="nr2-puff ' + L[0] + '" cx="' + n1(d[0] - 2 + Math.cos(a) * rr * 0.5) + '" cy="' + n1(d[1] + Math.sin(a) * rr) + '" r="' + n1(g.ph ? 2.1 : 2.6) + '" opacity="' + (1 - u).toFixed(2) + '"/>'); }
          var rip = clamp(pu.age / 0.4, 0, 1), rx = d[0] + (sx - rs - d[0]) * rip, ry = d[1] + (sy - d[1]) * rip;
          if(pu.age < 0.45) p.push('<circle class="nr2-rip ' + L[0] + '" cx="' + n1(rx) + '" cy="' + n1(ry) + '" r="' + n1(5 + rip * 4) + '" opacity="' + (0.9 - rip * 0.5).toFixed(2) + '"/>');
        });
      });
      // the cell body's charge: how close to threshold (warm), or pushed down (cool)
      var ch = chargeOf(f.V), spiking = f.since != null && f.since < 1.9;
      if(ch > 0.02 && !spiking) p.push('<circle class="nr2-charge" cx="' + n1(sx + rs * 0.4) + '" cy="' + n1(sy) + '" r="' + n1(rs * (1.2 + 0.7 * ch)) + '" opacity="' + (0.3 + 0.7 * Math.min(1, ch)).toFixed(2) + '"/>');
      if(ch < -0.02) p.push('<circle class="nr2-calm" cx="' + n1(sx) + '" cy="' + n1(sy) + '" r="' + n1(rs * 1.35) + '" opacity="' + (0.3 + 0.5 * Math.min(1, -ch)).toFixed(2) + '"/>');
      if(spiking){ var sp = f.since < 0.5 ? f.since / 0.5 : 1 - (f.since - 0.5) / 1.4; p.push('<circle class="nr2-ap" cx="' + n1(g.hill[0]) + '" cy="' + n1(sy) + '" r="' + n1(rs * (0.9 + 0.5 * sp)) + '" opacity="' + clamp(0.35 + sp * 0.65, 0, 1).toFixed(2) + '"/>'); }
      // the action potential on the axon: at a node (jumping) or creeping along a bare stretch
      f.aps.forEach(function(ap){
        var x;
        if(ap.bare){ x = g.segs[ap.seg][0] + (g.segs[ap.seg][1] - g.segs[ap.seg][0]) * ap.f; p.push('<line class="nr2-apline" x1="' + n1(g.segs[ap.seg][0]) + '" x2="' + n1(x) + '" y1="' + n1(sy) + '" y2="' + n1(sy) + '" stroke-width="' + n1(g.axR * 2) + '"/>'); }
        else x = g.nodes[ap.f < 0.5 ? ap.seg : ap.seg + 1];
        p.push('<circle class="nr2-ap" data-ap="' + n1(x) + '" cx="' + n1(x) + '" cy="' + n1(sy) + '" r="' + n1(g.myR * 1.7) + '"/><circle class="nr2-apc" cx="' + n1(x) + '" cy="' + n1(sy) + '" r="' + n1(g.axR * 1.3) + '"/>');
      });
      if(f.term > 0) g.fan.forEach(function(fb){
        p.push('<circle class="nr2-ap" cx="' + n1(fb.end[0]) + '" cy="' + n1(fb.end[1]) + '" r="' + n1(g.axR * 3.4) + '" opacity="' + f.term.toFixed(2) + '"/>');
        var u = 1 - f.term; for(var q = 0; q < 3; q++) p.push('<circle class="nr2-puff is-ex" cx="' + n1(fb.end[0] + g.axR * 2.4 + u * (6 + q * 4)) + '" cy="' + n1(fb.end[1] + (q - 1) * (3 + u * 5)) + '" r="' + n1(g.ph ? 1.9 : 2.3) + '" opacity="' + f.term.toFixed(2) + '"/>');
      });
      // the membrane close-up: the two channels and the ions
      if(g.in){
        var I = g.in, rr = g.ph ? 5 : 6.2, q2 = [];
        q2.push(chan(I.na, I.mid, I.th, f.na, 'is-na', g));
        q2.push(chan(I.k, I.mid, I.th, f.k, 'is-k', g));
        ['na', 'k'].forEach(function(kind){
          IONS[kind].forEach(function(s0, i){
            var at = ionAt(kind, i, f, g), x = at[0], y = at[1];
            if(jit){ var ph = view.clock / 700 + i * 1.7 + (kind === 'k' ? 0.9 : 0); x += Math.sin(ph) * 1.6; y += Math.cos(ph * 1.3) * 1.4; }
            q2.push(ionSvg(x, y, rr, 'is-' + kind));
          });
        });
        // what the channels are doing, said where it happens
        var fs = g.fsS;
        var yA = I.mid - I.th / 2 - (g.ph ? 19 : 22), yB = I.mid + I.th / 2 + (g.ph ? 19 : 22);
        if(f.na === 'open') q2.push(pill(I.na, yA, 'Na⁺ rushes in', 'is-na', 'middle', fs, true));
        else if(f.na === 'locked' && g.tab === 'refr') q2.push(pill(I.na, yB, 'Na⁺ locked', 'is-sig', 'middle', fs, true));
        else q2.push(pill(I.na, yA, 'Na⁺', 'is-na', 'middle', fs));
        if(f.k === 'open') q2.push(pill(I.k, yB, 'K⁺ flows out', 'is-k', 'middle', fs, true));
        else q2.push(pill(I.k, yB, 'K⁺', 'is-k', 'middle', fs));
        p.push('<g clip-path="url(#nr2c-in)">' + q2.join('') + '</g>');
      }
      // the graph: the whole run faint, solid up to now, the cursor; the pulses; the refractory periods
      if(g.plot) p.push(plotDyn(g, f));
      if(g.bar) p.push(barDyn(g, f));
      // Threshold: the setting before the change, as a tick on its track (a mark, never a moved handle)
      if(prev && prev.tab === 'fire' && g.tab === 'fire' && (prev.k === 'E' || prev.k === 'I')){
        var tr = prev.k === 'E' ? g.kE : g.kI, mx = prev.k === 'E' ? EMAX : IMAX, cur = prev.k === 'E' ? S.E : S.I;
        if(prev.v !== cur){ var bx = tr[0] + (tr[2] - tr[0]) * prev.v / mx; p.push('<path class="nr2-mark" d="M' + n1(bx) + ' ' + n1(tr[1] - 9) + 'V' + n1(tr[1] + 9) + '"/>'); }
      }
      return p.join('');
    }
    var trCache = {};
    function tracePts(g, r){
      var key = g.W + 'x' + g.H + g.tab + r.S + '|' + r.gap + '|' + r.mode;
      if(trCache.key === key) return trCache.pts;
      var P = g.plot, ser = N.series(r, 0.05), pts = ser.map(function(q){ return [q[0], P.X(q[0]), P.Y(q[1])]; });
      trCache = { key: key, pts: pts };
      return pts;
    }
    function polyStr(pts, from, to){ var s = []; for(var i = from; i < to; i++) s.push(n1(pts[i][1]) + ',' + n1(pts[i][2])); return s.join(' '); }
    function plotDyn(g, f){
      var P = g.plot, p = [], r = f.run, pts = tracePts(g, r), t = f.t, fs = g.fsS;
      // refractory periods after each spike drawn so far
      r.spikes.forEach(function(sp){
        if(t < sp) return;
        var a = P.X(sp), b = P.X(Math.min(P.dur, sp + Math.min(N.ABS, t - sp))), c = P.X(Math.min(P.dur, sp + Math.min(N.REL, t - sp)));
        p.push('<rect class="nr2-refa" x="' + n1(a) + '" y="' + n1(P.y0) + '" width="' + n1(b - a) + '" height="' + n1(P.Y(-86) - P.y0) + '"/>');
        if(c > b) p.push('<rect class="nr2-refb" x="' + n1(b) + '" y="' + n1(P.y0) + '" width="' + n1(c - b) + '" height="' + n1(P.Y(-86) - P.y0) + '"/>');
        if(g.tab === 'refr' && t >= sp + 1 && sp === r.spikes[0]) p.push(txt(P.X(sp + 1.2), P.Y(10), 'refractory', 'nr2-refr-t', 'start', fs));
      });
      // the setting before the change (Threshold): its whole trace, faint
      if(prev && prev.run && prev.tab === g.tab && prev.run !== r){ var pp = tracePts(g, prev.run); trCache = { key: '' }; p.push('<polyline class="nr2-before" points="' + polyStr(pp, 0, pp.length) + '"/>'); }
      var k = 0; while(k < pts.length && pts[k][0] <= t + 1e-9) k++;
      p.push('<polyline class="nr2-ghost" points="' + polyStr(pts, Math.max(0, k - 1), pts.length) + '"/>');
      if(k > 1) p.push('<polyline class="nr2-trace" points="' + polyStr(pts, 0, k) + '"/>');
      var vx = P.X(t), vy = P.Y(f.V);
      p.push('<line class="nr2-now" x1="' + n1(vx) + '" x2="' + n1(vx) + '" y1="' + n1(P.y0) + '" y2="' + n1(P.Y(-86)) + '"/><circle class="nr2-head" cx="' + n1(vx) + '" cy="' + n1(vy) + '" r="4.5" data-v="' + f.V.toFixed(1) + '"/>');
      // the peak, once drawn
      if(g.tab === 'fire' && r.spikes.length && t >= r.spikes[0] + 0.45){ var px = P.X(r.spikes[0] + 0.5); p.push(txt(px + 9, P.Y(N.PEAK) + 4, '+40 mV spike', 'nr2-peak-t', 'start', fs)); }
      // the pulses: marks on the stimulus row (the second one carries the knob in Refractory period)
      r.events.forEach(function(e, i){
        var x = P.X(e.t), on = t >= e.t;
        if(g.tab === 'refr' && i === 1) return;
        p.push('<path class="nr2-stim' + (on ? ' is-on' : '') + '" d="M' + n1(x) + ' ' + n1(P.stimY - 8) + 'l-7 12h14z"/>');
        p.push(g.tab === 'refr' ? txt(x - 11, P.stimY + 5, g.ph ? '1st' : '1st pulse', 'nr2-stim-t', 'end', fs) : txt(x + 11, P.stimY + 5, 'pulse', 'nr2-stim-t', 'start', fs));
      });
      if(g.tab === 'refr'){
        var x2 = P.X(r.events[1].t);
        p.push('<line class="nr2-stimlink" x1="' + n1(P.X(r.events[0].t)) + '" x2="' + n1(x2) + '" y1="' + n1(P.stimY) + '" y2="' + n1(P.stimY) + '"/>');
        if(prev && prev.k === 'gap' && prev.v !== S.gap){ var bx = P.X(T0 + prev.v); p.push('<path class="nr2-mark" d="M' + n1(bx) + ' ' + n1(P.stimY - 10) + 'V' + n1(P.stimY + 10) + '"/>'); }
      }
      return p.join('');
    }
    function barDyn(g, f){
      var B = g.bar, p = [], c = cond(), r = f.run, sp = r.spikes[0], el = clamp(f.t - sp, 0, c.total), fs = g.fsS;
      if(f.t >= sp) p.push('<rect class="nr2-barfill" x="' + n1(B.x0) + '" y="' + n1(B.y - 5) + '" width="' + n1(B.X(el) - B.x0) + '" height="10" rx="5"/>');
      if(prev && prev.k === 'myel' && prev.total !== c.total){ var bx = B.X(prev.total); p.push('<path class="nr2-mark" d="M' + n1(bx) + ' ' + n1(B.y - 12) + 'V' + n1(B.y + 12) + '"/>'); if(Math.abs(bx - B.X(c.total)) > 60) p.push(txt(bx, B.y - 16, 'before', 'nr2-mark-t', 'middle', fs)); }
      if(f.t >= sp){
        var x = B.X(el);
        p.push('<circle class="nr2-bardot" cx="' + n1(x) + '" cy="' + n1(B.y) + '" r="8" data-ms="' + el.toFixed(3) + '"/>');
        if(f.arrived != null) p.push(pill(clamp(x, B.x0 + 60, B.x1 - 60), B.y - (g.ph ? 24 : 26), c.total.toFixed(2) + ' ms', 'is-ink', 'middle', g.fs, true));
      }
      return p.join('');
    }

    /* The synapse's moving parts: the signal arriving, vesicles opening, the neurotransmitter crossing and binding,
       the drug in its place, reuptake. Receptor counts follow the model's activation (8 receptors). */
    var REC2 = 8, ANT = [0, 1, 3, 4, 6, 7], AGO = [1, 4, 6];
    function synDyn(g, f){
      var p = [], z = g.z, cls = S.cls, t = f.t, tBot = g.tBot, cx = g.cx, ntc = S.nt === 'gaba' ? 'is-in' : 'is-nt', jit = playing && !K.reduced(), fs = g.fsS;
      // the action potential coming down the terminal
      if(f.arrive != null){ var ay = g.sTop + (tBot - 40 * z - g.sTop) * f.arrive; p.push('<circle class="nr2-ap" cx="' + n1(cx) + '" cy="' + n1(ay) + '" r="' + n1(26 * Math.min(z, 1.3)) + '" opacity=".85"/>'); }
      else if(t < 0.8) p.push('<circle class="nr2-ap" cx="' + n1(cx) + '" cy="' + n1(tBot - 40 * z) + '" r="' + n1(26 * Math.min(z, 1.3)) + '" opacity="' + (0.85 * (1 - t / 0.8)).toFixed(2) + '"/>');
      // vesicles: the middle one moves down, fuses and empties
      var vr = M.rng(9);
      g.ves.forEach(function(v, i){
        var x = v[0], y = v[1], open = i === 2 && t >= 0, k = open ? sm((t + 0.2) / 0.5) : 0, r0 = 13 * z, full = !open;
        if(i === 2 && t > -0.3){ var dn = sm((t + 0.3) / 0.35); y = y + (tBot - r0 - y) * dn; }
        if(open && t > 0.15){ p.push('<path class="nr2-fuse" d="M' + n1(x - r0 * 0.9) + ' ' + n1(tBot - 1) + 'q' + n1(r0 * 0.9) + ' ' + n1(-r0 * 0.9 * (1 - k * 0.6)) + ' ' + n1(r0 * 1.8) + ' 0"/>'); }
        else p.push('<circle class="nr2-ves" cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + n1(r0) + '"/>');
        if(full) for(var d = 0; d < 5; d++) p.push('<circle class="nr2-ntm ' + ntc + '" cx="' + n1(x + (vr() - 0.5) * 12 * z) + '" cy="' + n1(y + (vr() - 0.5) * 12 * z) + '" r="' + n1(2.7 * z) + '"/>');
        else for(var d2 = 0; d2 < 5; d2++){ vr(); vr(); }
      });
      // receptors: blocked (antagonist), held by an agonist, bound by the neurotransmitter, or empty
      var nActive = Math.round(f.act * REC2), blocked = cls === 'antagonist' ? ANT : [], agon = cls === 'agonist' ? AGO : [], holder = {}, left = Math.max(0, nActive - agon.length);
      for(var q = 0; q < REC2; q++){
        if(blocked.indexOf(q) > -1) holder[q] = 'block';
        else if(agon.indexOf(q) > -1) holder[q] = 'drug';
        else if(left > 0){ holder[q] = 'nt'; left--; }
        else holder[q] = null;
      }
      var bound = 0;
      g.rec.forEach(function(rp, i){
        var x = rp[0], y = rp[1], hd = holder[i], on = hd === 'nt' || hd === 'drug';
        if(on) bound++;
        p.push('<g class="nr2-rec' + (on ? ' is-on' : '') + (hd === 'block' ? ' is-blocked' : '') + '" transform="translate(' + n1(x) + ' ' + n1(y) + ') scale(' + n1(z) + ')"><path d="M-9 -3 L-9 9 Q-9 14 -4 14 L4 14 Q9 14 9 9 L9 -3 L5 -3 L5 7 L-5 7 L-5 -3 Z"/></g>');
        if(on) p.push('<path class="nr2-recglow" d="M' + n1(x - 4 * z) + ' ' + n1(y + 16 * z) + 'q' + n1(4 * z) + ' ' + n1(8 * z) + ' ' + n1(8 * z) + ' 0"/>');
        if(hd === 'block') p.push('<rect class="nr2-dmol" x="' + n1(x - 4.5 * z) + '" y="' + n1(y - 4 * z) + '" width="' + n1(9 * z) + '" height="' + n1(9 * z) + '" rx="1.5"/>');
        else if(hd === 'drug') p.push('<path class="nr2-dmol" d="M' + n1(x) + ' ' + n1(y - 6 * z) + 'l' + n1(5.5 * z) + ' ' + n1(6 * z) + 'l' + n1(-5.5 * z) + ' ' + n1(6 * z) + 'l' + n1(-5.5 * z) + ' ' + n1(-6 * z) + 'z"/>');
        else if(hd === 'nt') p.push('<circle class="nr2-ntm ' + ntc + '" cx="' + n1(x) + '" cy="' + n1(y + z) + '" r="' + n1(4.2 * z) + '"/>');
      });
      // the receiving neuron answers: a glow as strong as the share of receptors activated
      if(f.act > 0.02) p.push('<rect class="nr2-rglow" x="' + n1(g.pad + 4) + '" y="' + n1(g.rTop + 14) + '" width="' + n1(g.W - g.pad * 2 - 8) + '" height="' + n1(Math.max(4, g.rBot - g.rTop - 40)) + '" rx="12" opacity="' + (0.6 * f.act).toFixed(2) + '"/>');
      // transporters at the terminal's edges (plugged by a reuptake inhibitor)
      g.trs.forEach(function(tp){
        p.push('<g class="nr2-trans" transform="translate(' + n1(tp[0]) + ' ' + n1(tp[1]) + ') scale(' + n1(z) + ')"><rect x="-7" y="-10" width="14" height="18" rx="4"/><path d="M0 6 V-4 m-3 3 l3 -3 l3 3"/></g>');
        if(cls === 'reuptake') p.push('<path class="nr2-dmol" d="M' + n1(tp[0] - 6 * z) + ' ' + n1(tp[1] + 12 * z) + 'l' + n1(6 * z) + ' ' + n1(-10 * z) + 'l' + n1(6 * z) + ' ' + n1(10 * z) + 'z"/>');
      });
      // free drug molecules in the cleft
      if(cls !== 'none'){
        var dr = M.rng(31);
        for(var m2 = 0; m2 < 4; m2++){
          var dx = g.tl + 40 * z + dr() * (g.tw - 80 * z), dy = tBot + 8 * z + dr() * (g.cleft - 16 * z);
          if(jit){ dx += Math.sin(view.clock / 520 + m2) * 3; dy += Math.cos(view.clock / 610 + m2) * 2; }
          p.push(drugIcon(cls, dx, dy, 4.6 * z));
        }
      }
      // the neurotransmitter in the cleft (as many as the model's amount), and the ones going back
      if(t >= 0){
        var MOL = 22, inCleft = Math.round(MOL * f.cleft), mr = M.rng(23), u = Math.min(1, t / 0.6), going = [];
        for(var m = 0; m < MOL; m++){
          var tx = g.tl + 34 * z + mr() * (g.tw - 68 * z), ty = tBot + 7 * z + mr() * (g.cleft - 14 * z), sx0 = cx + (mr() - 0.5) * 16 * z;
          if(jit){ tx += Math.sin(view.clock / 400 + m * 1.3) * 2.2; ty += Math.cos(view.clock / 470 + m) * 1.8; }
          if(m < inCleft) p.push('<circle class="nr2-ntm is-free ' + ntc + '" cx="' + n1(sx0 + (tx - sx0) * u) + '" cy="' + n1(tBot + (ty - tBot) * u) + '" r="' + n1(3.4 * z) + '"/>');
          else if(t > 0.4 && m < inCleft + 4) going.push([tx, ty, m]);
        }
        going.forEach(function(q){
          if(cls === 'reuptake'){ var sd = q[0] < cx ? -1 : 1; p.push('<circle class="nr2-ntm ' + ntc + ' is-away" cx="' + n1(q[0] + sd * 30 * z) + '" cy="' + n1(q[1]) + '" r="' + n1(3 * z) + '"/>'); }
          else { var tp = g.trs[q[2] % 2]; p.push('<circle class="nr2-ntm ' + ntc + ' is-away" cx="' + n1(q[0] + (tp[0] - q[0]) * 0.65) + '" cy="' + n1(q[1] + (tp[1] - 6 - q[1]) * 0.65) + '" r="' + n1(3 * z) + '"/>'); }
        });
      }
      // the neurotransmitter's name, beside the cleft
      p.push(pill(g.tr + (g.ph ? -4 : 14), tBot + g.cleft / 2, N.NT[S.nt].name, ntc === 'is-in' ? 'is-in' : 'is-nt', g.ph ? 'end' : 'start', fs));
      // the graph
      var P = g.plot, sr = synRun(), base = synBase(), upto = view.preview ? N.SYN.dur : t, line = function(R, a, b){ var q = []; for(var i = 0; i < R.t.length; i++){ if(R.t[i] < a - 1e-9 || R.t[i] > b + 1e-9) continue; q.push(n1(P.X(R.t[i])) + ',' + n1(P.Y(R.act[i]))); } return q.join(' '); };
      if(cls !== 'none'){ p.push('<polyline class="nr2-before" points="' + line(base, 0, N.SYN.dur) + '"/>'); p.push(txt(P.X(7.6), P.Y(0.16), 'no drug', 'nr2-mark-t', 'start', fs)); }
      p.push('<polyline class="nr2-ghost is-syn" points="' + line(sr, Math.max(0, upto), N.SYN.dur) + '"/>');
      if(upto > 0){ var pc = line(sr, 0, upto); p.push('<polygon class="nr2-actarea" points="' + n1(P.X(0)) + ',' + n1(P.Y(0)) + ' ' + pc + ' ' + n1(P.X(Math.min(upto, N.SYN.dur))) + ',' + n1(P.Y(0)) + '"/><polyline class="nr2-act" points="' + pc + '"/>'); }
      if(t >= 0){ var vx = P.X(t); p.push('<line class="nr2-now" x1="' + n1(vx) + '" x2="' + n1(vx) + '" y1="' + n1(P.y0) + '" y2="' + n1(P.y1) + '"/><circle class="nr2-head is-syn" cx="' + n1(vx) + '" cy="' + n1(P.Y(f.act)) + '" r="4.5" data-act="' + f.act.toFixed(3) + '"/>'); }
      g.bound = bound;
      return p.join('');
    }
    function altText(f){
      if(S.tab === 'syn') return 'A synapse close up: the sending neuron’s terminal above, the receiving neuron below with 8 receptors. ' + N.NT[S.nt].name + '. ' + (DRUGS2.filter(function(d){ return d.v === S.cls; })[0].label) + '. ' + (lastBound()) + ' of 8 receptors activated now.';
      var w = 'A neuron: dendrites, the cell body, a myelinated axon and its terminals. ';
      if(S.tab === 'fire') w += 'Excitatory input +' + S.E + ' millivolts, inhibitory input ' + S.I + ' millivolts. ';
      if(S.tab === 'refr') w += 'Two pulses ' + n1(S.gap) + ' milliseconds apart. ';
      if(S.tab === 'myel') w += S.myel.filter(Boolean).length + ' of 6 stretches myelinated. ';
      if(f.V != null) w += 'Charge at the start of the axon now ' + Math.round(f.V) + ' millivolts; threshold minus 55.';
      return w;
    }
    function lastBound(){ return G && G.bound != null ? G.bound : 0; }

    /* ---- placing the controls */
    function layoutNow(force){
      if(stage.hidden) return;
      var r = sceneBox.getBoundingClientRect(), Wd = Math.max(300, Math.round(r.width)), H = Math.max(360, Math.round(r.height));
      if(!force && G && G.W === Wd && G.H === H && G.tab === S.tab) return;
      svg.setAttribute('viewBox', '0 0 ' + Wd + ' ' + H); svg.setAttribute('width', Wd); svg.setAttribute('height', H);
      G = geo(Wd, H); trCache = {};
      drawStatic();
      var t = S.tab;
      cE.hide(t !== 'fire'); cI.hide(t !== 'fire'); hGap.hide(t !== 'refr');
      segTaps.forEach(function(tp){ tp.el.hidden = t !== 'myel'; });
      drugTaps.forEach(function(tp){ tp.el.hidden = t !== 'syn'; });
      ntBox.hidden = t !== 'syn';
      if(t === 'fire'){ cE.place(G.kE); cI.place(G.kI); }
      if(t === 'refr') hGap.place();
      if(t === 'myel') G.segs.forEach(function(q, i){ var hh = Math.max(44, G.myR * 2 + 16); segTaps[i].place([q[0] - 2, G.sy - hh / 2, q[1] - q[0] + 4, hh]); segTaps[i].el.setAttribute('aria-label', segLabel(i)); });
      if(t === 'syn') G.drugs.forEach(function(b, i){ drugTaps[i].place([b.x, b.y, b.w, b.h]); });
      if(G.plot){ var P = G.plot; scrub.el.hidden = false; scrub.place([P.x0, P.y0, P.x1, t === 'syn' ? P.y1 : P.Y(-86)], t === 'syn' ? -SYN_PRE : 0, t === 'syn' ? N.SYN.dur : P.dur); }
      else scrub.el.hidden = true;
      paint();
      var c = cues[t]; if(c && c.active()) c.place();
    }
    function animatePeel(){
      var go = Object.keys(peelAt).some(function(i){ return now() - peelAt[i] < 400; });
      if(go){ drawStatic(); requestAnimationFrame(animatePeel); }
    }
    var peel0 = peel;
    peel = function(i){ peel0(i); if(!K.reduced()) requestAnimationFrame(animatePeel); else { peelAt[i] = 0; drawStatic(); } };

    /* ================================================================ "?" */
    var ref = document.createElement('div'); ref.className = 'ls-sec nr2-ref';
    function refHtml(){
      var rates = [16, 20, 30, 40].map(function(v){ return v + ' mV: ' + N.rate(v) + ' spikes'; }).join('; '), ex = S.cls === 'none' ? null : N.exampleOf(S.nt, S.cls);
      ref.innerHTML = '<p class="nr2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use this tab, step by step.</p>' +
        '<h3 class="ls-title-l">How it works</h3>' +
        '<p>The neuron rests at ' + mvT(N.REST) + ' (inside more negative than outside). Messages from other neurons push its charge up (excitatory) or down (inhibitory); the neuron adds them up at the start of its axon. If the total reaches the threshold, ' + mvT(N.THRESH) + ', sodium channels open, positive sodium ions (Na⁺) rush in and the neuron fires an action potential, up to +' + N.PEAK + ' mV. Then potassium ions (K⁺) flow out and the charge falls, briefly below rest.</p>' +
        '<p><b>All or none.</b> A push past threshold always fires the same full spike; a stronger push does not make a bigger one. Held on, a stronger stimulus makes the neuron fire more often (in this model, 25 ms of ' + rates + ').</p>' +
        '<p><b>Refractory period.</b> For about ' + N.ABS + ' ms after a spike the sodium channels are locked and nothing can fire the neuron; until about ' + N.REL + ' ms it needs a stronger push than usual.</p>' +
        '<p><b>Myelin.</b> The fatty myelin sheath insulates the axon, so the signal jumps from one node (gap in the myelin) to the next. This is called saltatory conduction, and it is much faster. Where myelin is damaged, as in multiple sclerosis, signals slow down or fail.</p>' +
        '<p><b>At the synapse.</b> When the signal reaches the terminals, vesicles release neurotransmitter into the synapse. It binds to receptors on the receiving neuron, then reuptake pulls it back into the sending neuron (some, like acetylcholine, are broken down by enzymes instead). An agonist activates the receptors itself; an antagonist sits in them without activating them; a reuptake inhibitor keeps the neurotransmitter in the synapse longer.</p>' +
        (ex ? '<p class="bt-small">Example: ' + esc(ex.name) + ' ' + esc(ex.mech) + '.</p>' : '') +
        '<h3 class="ls-title-l">Parts of a neuron</h3><ul class="nr-plist">' + Object.keys(N.PARTS).map(function(k){ return '<li><b>' + esc(N.PARTS[k].name) + '</b>: ' + esc(N.PARTS[k].does) + '.</li>'; }).join('') + '</ul>' +
        '<h3 class="ls-title-l">The eight neurotransmitters</h3><ul class="nr-plist">' + N.NT_KEYS.map(function(k){ return '<li><b>' + esc(N.NT[k].name) + '</b>: ' + esc(N.NT[k].does) + ' ' + esc(N.NT[k].low) + '</li>'; }).join('') + '</ul>' +
        '<h3 class="ls-title-l">Real drugs</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Drug examples"><table class="ls-tbl"><thead><tr><th scope="col">Drug</th><th scope="col">Acts on</th><th scope="col">Kind</th></tr></thead><tbody>' +
          N.DRUGS.map(function(d){ return '<tr><td>' + esc(d.name) + '</td><td>' + esc(N.NT[d.nt].name) + '</td><td>' + esc(N.CLASSES[d.cls].name) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<h3 class="ls-title-l">About the model</h3>' +
        '<p class="bt-small">A teaching model, not a recording. Rest ' + mvT(N.REST) + ', threshold ' + mvT(N.THRESH) + ' and peak +' + N.PEAK + ' mV are typical textbook values; real neurons vary. The close-up shows only a few of the ions that cross: real concentrations barely change during one spike. The sodium-potassium pump is left out (it is outside the course). Myelin: a myelinated stretch takes ' + N.JUMP + ' ms here and a bare one ' + N.CRAWL + ' ms; real myelin speeds a signal far more, up to about 50 to 100 times, but a bigger gap could not be watched. The synapse is in relative units: with an agonist the signal is ' + N.signalPct('agonist') + '% of no drug, an antagonist ' + N.signalPct('antagonist') + '%, a reuptake inhibitor ' + N.signalPct('reuptake') + '%. Colors: the signal and threshold vermillion, sodium amber, potassium blue, excitatory green, inhibitory pink, myelin cream, drugs grey.</p>' +
        '<p class="bt-small">Sources: OpenStax Psychology 2e, 3.2 (threshold, all or none, nodes of Ranvier, reuptake, agonists and antagonists); OpenStax Biology 2e, 35.2 (excitatory and inhibitory potentials added at the axon hillock, sodium in and potassium out, saltatory conduction); the AP® Psychology course framework, topic 1.3.</p>' +
        '<p class="nr-notes">Notes for this topic: <a href="../notes/neural-firing.html">The Neuron and Neural Firing</a></p>';
    }
    ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(ctx.studio && ctx.studio.close) try{ ctx.studio.close(); }catch(x){} if(S.mode !== 'explore' && ctx.go) ctx.go('explore'); setTimeout(startTour, 60); });
    refHtml();

    /* ---- modes, hiding, resizing */
    function stopAll(){ if(player.playing()) player.stop(); playing = false; TABS.forEach(function(t){ if(tours[t.value].active()) tours[t.value].stop(); }); }
    function shown(mode){
      S.mode = mode;
      if(mode !== 'explore'){ stopAll(); hideCue(false); return; }
      setTimeout(function(){ layoutNow(true); if(!lastF || view.preview) restart(false); showCue(); }, 30);
    }
    if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(function(){ var was = player.playing(); layoutNow(false); if(!was && !playing) paint(); }, 60); }).observe(sceneBox); }
    else window.addEventListener('resize', function(){ layoutNow(false); });
    if(window.IntersectionObserver) new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting && player.playing()){ player.stop(); playing = false; setT(tMax(), false); ended(); } }); }).observe(sceneBox);
    document.addEventListener('visibilitychange', function(){ if(document.hidden && player.playing()){ player.stop(); playing = false; setT(tMax(), false); ended(); } });
    try{ new MutationObserver(function(){ if(G){ drawStatic(); paint(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ layoutNow(true); });

    // for the sweep and the frame check (scripts/tools-v2/neuron-sweep.mjs): the state, the drawn frame, the geometry
    window.__nr2 = { S: S, view: view, G: function(){ return G; }, F: function(){ return lastF; }, N: N, T0: T0, tMax: tMax, keyT: keyT, cond: cond,
      parts: function(){ return lastF ? partsAt(lastF) : []; }, playing: function(){ return player.playing(); },
      tab: function(v){ tabs.value(v); setTab(v); }, set: function(o){ stopAll(); if(o.E != null){ S.E = o.E; cE.value(o.E); } if(o.I != null){ S.I = o.I; cI.value(o.I); } if(o.gap != null){ S.gap = o.gap; hGap.value(o.gap); } if(o.myel){ S.myel = o.myel.slice(); segTaps.forEach(function(tp, j){ tp.pressed(S.myel[j]); }); peelAt = {}; } if(o.cls){ S.cls = o.cls; drugTaps.forEach(function(x, j){ x.pressed(DRUGS2[j].v === S.cls); }); } if(o.nt){ S.nt = o.nt; ntSel.value = o.nt; } prev = null; layoutNow(true); restart(false); },
      at: function(t){ stopAll(); setT(t, false); }, play: function(){ restart(true); }, preview: function(){ restart(false); } };

    return { stage: stage, ref: ref, shown: shown, start: function(){ layoutNow(true); restart(false); showCue(); } };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'neuron', noun: 'drill',
      generate: function(r, ctx, type){ return N.generate(r, ctx, type); },
      types: [{ value: 'trace', label: 'Read a membrane trace' }, { value: 'drug', label: 'Drugs at the synapse' }, { value: 'transmitter', label: 'Name the neurotransmitter' }, { value: 'parts', label: 'Parts of a neuron' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { trace: 'Read the recording', drug: 'A drug at the synapse', transmitter: 'Which neurotransmitter?', parts: 'Parts of a neuron' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); }
    });
  }
  /* The drill's figure, drawn from the problem's own numbers. It never
     shows an answer before its step is answered: the drug is drawn only
     once its kind is named, the part highlighted once it is named. */
  function figure(el, p, st){
    st = st || {};
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, Wd = phone ? 340 : 600, H, out = '', label = '';
    if(g.kind === 'trace'){
      H = phone ? 250 : 300;
      var spikes = []; g.series.forEach(function(q, i){ if(i && q[1] >= 0 && g.series[i - 1][1] < 0) spikes.push(q[0]); });
      out = traceArt(4, 4, Wd - 8, H - 8, { series: g.series, rest: g.rest, thresh: g.thresh, spikes: st.count ? spikes : [], refr: !!st.count, pulses: g.mode === 'held' ? [] : g.pulses, held: g.mode === 'held' ? 2 : null, small: phone, compact: !st.count }).svg;
      label = 'Membrane potential of one neuron over 25 ms (invented, from a model). Resting ' + mv(g.rest) + ', threshold dashed at ' + mv(g.thresh) + '. ' + (g.mode === 'held' ? 'A steady stimulus is held on from 2 ms.' : 'Stimulus marks at ' + g.pulses.map(function(x){ return M.fixed(x, 1) + ' ms'; }).join(' and ') + '.') + ' Values every 1 ms: ' + g.series.filter(function(q){ return Math.abs(q[0] - Math.round(q[0])) < 1e-6; }).map(function(q){ return q[0] + ' ms ' + M.minus(M.fixed(q[1], 0)); }).join(', ') + ' mV.';
    } else if(g.kind === 'synapse'){
      H = phone ? 260 : 300;
      var shown = st.cls ? g.cls : 'none';
      out = synapseArt(4, 4, Wd - 8, H - 8, { nt: g.nt, cls: shown, t: 1.6, id: 'syq' }).svg;
      label = 'A synapse: the axon terminal above, receptors on the receiving neuron below, neurotransmitter in the cleft.' + (st.cls && g.cls !== 'none' ? ' The drug is drawn: ' + N.CLASSES[g.cls].name.toLowerCase() + '.' : '');
    } else {
      H = phone ? 180 : 220;
      out = neuronArt(8, 8, Wd - 16, H - 16, { part: st.part ? g.part : null, labels: !!st.part, id: 'nrq' }).svg;
      label = 'A neuron: dendrites, cell body, myelinated axon and axon terminals' + (st.part ? '; highlighted: ' + N.PARTS[g.part].name + '.' : '.');
    }
    el.innerHTML = '<figure class="cd-fig nr-qfig"><svg class="nr-svg" viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + out + '</svg></figure>';
  }

  /* ------------------------------------------------------------ mount */
  function boot(){
    var K = window.LevlKit2;
    T.mount('neuron', function(app, data){
      // the course adapter (T.kit2, psy-tools.js): Explore is this stage, full width; Test yourself the drills
      var ctx = { studio: null, go: null }, ex = null;
      var md = T.kit2(app, { slug: 'neuron',
        explore: function(host){
          ex = explore2(app, data, ctx, K);
          host.appendChild(ex.stage); host.appendChild(ex.ref);
          return { stage: ex.stage, ref: ex.ref, shown: function(m){ ex.shown(m); }, ready: function(s){ ctx.studio = s; } };
        },
        quiz: function(host){ quiz(host, data); } });
      ctx.go = function(m){ md.show(m, true); };
    });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApPsychBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
