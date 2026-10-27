/* Neuron trainer page (docs/appsych-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T2). Mounts into #app with ApPsychTools.mount; the model is
   ApPsychMath.neuron (psychology/assets/tools/math/neuron.js), the content
   psychology/data/tools/neuron.json (served filtered as
   assets/tool-data/neuron.json). The frame is ApPsychTools.modes (Explore,
   then Test yourself) on the Tool Studio.

   Explore: one picture, two scenes (the Scene switch):
     Fire     an illustrated neuron (dendrites, cell body with its nucleus,
              axon hillock, a myelinated axon with nodes, axon terminals)
              over its membrane potential trace. Set the stimulus and press
              Stimulate: the stimulus reaches the dendrites, the cell body
              charges toward threshold, and if it gets there the action
              potential runs down the axon, jumping node to node, while the
              trace draws the spike (the model's own numbers), the
              refractory period shaded after it. Below threshold the bump
              fades and nothing travels. More options: two pulses (the gap
              decides whether the refractory period blocks the second) or a
              held stimulus (stronger fires more often, never bigger). Tap a
              part of the neuron to see what it does.
     Synapse  a close-up of one synapse: the axon terminal with its vesicles
              and reuptake transporters, the cleft, the receiving neuron's
              receptors. Choose one of the eight neurotransmitters the CED
              lists and a drug (none, agonist, antagonist, reuptake
              inhibitor) and press Release: molecules cross, bind and are
              taken back up; the graph under it is the share of receptors
              activated with the drug against no drug (dashed), from the
              model's synapse().
   Colors by role, the same in both scenes and in the drills: the neuron and
   the trace in the course cerulean, the travelling signal and the
   threshold vermillion, neurotransmitter green, drugs reddish purple (all
   Okabe-Ito based; lighter in dark mode). Every value is also written, so
   color is never the only cue.
   Reduced motion: Stimulate and Release show the end state at once
   (ApPsychPlot.loop).
   Test yourself: ApPsychTools.drill over the model's generate(), with a
   stage figure drawn from the problem's own numbers; a figure never shows
   an answer before its step is answered. */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath, P = window.ApPsychPlot;
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
    function branch(x, y, ang, len, wd, depth){
      var bend = (rng() - 0.5) * 0.5, ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
      ex = Math.max(x0 + 4, Math.min(sx - rs * 0.2, ex)); ey = Math.max(y0 + 6, Math.min(y0 + h - 6, ey));
      var cx = (x + ex) / 2 + Math.cos(ang + Math.PI / 2) * len * bend * 0.4, cy = (y + ey) / 2 + Math.sin(ang + Math.PI / 2) * len * bend * 0.4;
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
    for(var t = 0; t <= dur; t += 5) g.push('<text class="nr-tk" x="' + r1(X(t)) + '" y="' + r1(bot + 15) + '" text-anchor="middle" font-size="' + fs + '">' + t + '</text>');
    g.push('<text class="nr-axl" x="' + r1(R) + '" y="' + r1(bot + 27) + '" text-anchor="end" font-size="' + fs + '">time (ms)</text>');
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
    var tw = Math.min(w * 0.82, 520), tl = cx - tw / 2, tr = cx + tw / 2, tBot = y0 + h * 0.5, cleft = Math.max(26, h * 0.15), rTop = tBot + cleft;
    // the sending terminal: a rounded bulb from the top
    g.push('<defs><linearGradient id="' + id + 'T" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="nr-soma1"/><stop offset="1" class="nr-soma0"/></linearGradient><linearGradient id="' + id + 'R" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="nr-rcv0"/><stop offset="1" class="nr-rcv1"/></linearGradient></defs>');
    g.push('<path class="nr-sterm" d="M' + pt(cx - tw * 0.16, y0) + ' C' + pt(cx - tw * 0.18, y0 + h * 0.12) + ' ' + pt(tl, y0 + h * 0.14) + ' ' + pt(tl, tBot - 24) + ' Q' + pt(tl, tBot) + ' ' + pt(tl + 26, tBot) + ' L' + pt(tr - 26, tBot) + ' Q' + pt(tr, tBot) + ' ' + pt(tr, tBot - 24) + ' C' + pt(tr, y0 + h * 0.14) + ' ' + pt(cx + tw * 0.18, y0 + h * 0.12) + ' ' + pt(cx + tw * 0.16, y0) + 'Z" fill="url(#' + id + 'T)"/>');
    // the receiving neuron: a dendrite seen side on, a band under the synapse
    var rBot = Math.min(y0 + h, rTop + Math.max(56, h * 0.3));
    g.push('<path class="nr-rcv" d="M' + pt(x0, rTop + 10) + ' Q' + pt(cx, rTop - 10) + ' ' + pt(x0 + w, rTop + 10) + ' L' + pt(x0 + w, rBot - 14) + ' Q' + pt(x0 + w, rBot) + ' ' + pt(x0 + w - 14, rBot) + ' L' + pt(x0 + 14, rBot) + ' Q' + pt(x0, rBot) + ' ' + pt(x0, rBot - 14) + 'Z" fill="url(#' + id + 'R)"/>');
    var fs = w < 520 ? 11.5 : 13;
    g.push('<text class="nr-lab" x="' + r1(cx + tw * 0.2) + '" y="' + r1(y0 + fs + 2) + '" font-size="' + fs + '">Sending neuron</text>');
    g.push('<text class="nr-lab" x="' + r1(cx) + '" y="' + r1(rBot - 10) + '" text-anchor="middle" font-size="' + fs + '">Receiving neuron</text>');
    g.push('<text class="nr-tk nr-cleft-t" x="' + r1(x0 + 4) + '" y="' + r1(tBot + cleft / 2 + 4) + '" font-size="' + (fs - 0.5) + '">synapse</text>');
    // receptors along the receiving membrane
    var rx = function(i){ return tl + 30 + i * (tw - 60) / (REC - 1); }, ry = function(x){ var u = (x - x0) / w; return rTop + 10 - 20 * 4 * u * (1 - u); };
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
      g.push('<g class="nr-rec' + (on ? ' is-on' : '') + (hd === 'block' ? ' is-blocked' : '') + '" transform="translate(' + pt(x, y) + ')"><path d="M-9 -3 L-9 9 Q-9 14 -4 14 L4 14 Q9 14 9 9 L9 -3 L5 -3 L5 7 L-5 7 L-5 -3 Z"/></g>');
      if(hd === 'block') g.push('<rect class="nr-drug" x="' + r1(x - 4.5) + '" y="' + r1(y - 4) + '" width="9" height="9" rx="1.5"/>');
      else if(hd === 'drug') g.push('<path class="nr-drug" d="M' + pt(x, y - 6) + ' l5.5 6 l-5.5 6 l-5.5 -6 z"/>');
      else if(hd === 'nt') g.push('<circle class="nr-nt" cx="' + r1(x) + '" cy="' + r1(y + 1) + '" r="4.2"/>');
    }
    // reuptake transporters at both sides of the terminal's lower edge
    var trs = [tl + 14, tr - 14];
    trs.forEach(function(x){
      g.push('<g class="nr-trans" transform="translate(' + pt(x, tBot - 4) + ')"><rect x="-7" y="-10" width="14" height="18" rx="4"/><path d="M0 -6 v10 m-3 -7 l3 -3 l3 3"/></g>');
      if(cls === 'reuptake') g.push('<path class="nr-drug" d="M' + pt(x - 6, tBot + 10) + ' l6 -10 l6 10 z"/>');
    });
    // vesicles and the molecules in the cleft
    var vr = M.rng(9), vN = 5;
    for(var v = 0; v < vN; v++){
      var vx = cx + (v - (vN - 1) / 2) * Math.min(46, tw / 7), vy = tBot - 30 - (v % 2) * 22, open = S && v === 2 && t < 1.5;
      g.push('<circle class="nr-ves" cx="' + r1(vx) + '" cy="' + r1(vy) + '" r="13"/>');
      var inside = S && v === 2 ? 0 : 5;
      for(var d = 0; d < inside; d++) g.push('<circle class="nr-nt" cx="' + r1(vx + (vr() - 0.5) * 12) + '" cy="' + r1(vy + (vr() - 0.5) * 12) + '" r="2.6"/>');
      if(open) g.push('<path class="nr-fuse" d="M' + pt(vx - 9, tBot - 2) + ' q9 8 18 0"/>');
    }
    if(S){
      var MOL = 22, inCleft = Math.round(MOL * cleftAmt), mr = M.rng(23);
      for(var m = 0; m < MOL; m++){
        var tx = tl + 34 + mr() * (tw - 68), ty = tBot + 6 + mr() * (cleft - 4), sx0 = cx + (mr() - 0.5) * 16;
        var u = Math.min(1, t / 0.6);
        if(m < inCleft){
          var px = sx0 + (tx - sx0) * u, py = tBot + (ty - tBot) * u;
          g.push('<circle class="nr-nt" cx="' + r1(px) + '" cy="' + r1(py) + '" r="3.2"/>');
        } else if(t > 0.4 && m < inCleft + 4 && cls !== 'reuptake'){
          var side = trs[m % 2], k2 = 0.6;
          g.push('<circle class="nr-nt is-back" cx="' + r1(tx + (side - tx) * k2) + '" cy="' + r1(ty + (tBot - 6 - ty) * k2) + '" r="3"/>');
        }
      }
    }
    return { svg: g.join(''), cleftAmt: cleftAmt, active: active };
  }
  /* Receptor activation against time, with the no-drug curve dashed. */
  function activationArt(x0, y0, w, h, o){
    var g = [], L = x0 + 42, R = x0 + w - (o.enl ? 50 : 8), top = y0 + 26, bot = y0 + h - 30, D = N.SYN.dur, fs = 12;
    var X = function(t){ return L + t / D * (R - L); }, Y = function(v){ return bot - v * (bot - top); };
    g.push('<rect class="nr-plotbg" x="' + r1(L) + '" y="' + r1(top) + '" width="' + r1(R - L) + '" height="' + r1(bot - top) + '" rx="4"/>');
    [0, 0.5, 1].forEach(function(v){ g.push('<line class="nr-grid" x1="' + r1(L) + '" x2="' + r1(R) + '" y1="' + r1(Y(v)) + '" y2="' + r1(Y(v)) + '"/><text class="nr-tk" x="' + r1(L - 6) + '" y="' + r1(Y(v) + 4) + '" text-anchor="end" font-size="' + fs + '">' + (v * 100) + '%</text>'); });
    for(var t = 0; t <= D; t += 3) g.push('<text class="nr-tk" x="' + r1(X(t)) + '" y="' + r1(bot + 15) + '" text-anchor="middle" font-size="' + fs + '">' + t + '</text>');
    g.push('<text class="nr-axl" x="' + r1(R) + '" y="' + r1(bot + 27) + '" text-anchor="end" font-size="' + fs + '">time after release (ms)</text>');
    g.push('<text class="nr-axl" x="' + r1(x0 + 2) + '" y="' + r1(top - 12) + '" font-size="' + fs + '">receptors activated</text>');
    var base = N.synapse('none'), cur = N.synapse(o.cls), upto = o.t == null ? D : o.t;
    var line = function(S, lim){ var p = []; for(var i = 0; i < S.t.length && S.t[i] <= lim + 1e-9; i++) p.push(r1(X(S.t[i])) + ',' + r1(Y(S.act[i]))); return p; };
    if(o.cls !== 'none'){ g.push('<polyline class="nr-base" points="' + line(base, D).join(' ') + '"/>'); }
    var pc = line(cur, upto);
    if(pc.length > 1){ g.push('<polygon class="nr-actarea" points="' + r1(X(0)) + ',' + r1(Y(0)) + ' ' + pc.join(' ') + ' ' + pc[pc.length - 1].split(',')[0] + ',' + r1(Y(0)) + '"/><polyline class="nr-act" points="' + pc.join(' ') + '"/>'); }
    if(o.cls !== 'none') g.push('<text class="nr-base-t" x="' + r1(X(D * 0.58)) + '" y="' + r1(Y(0.32)) + '" font-size="' + fs + '">dashed: no drug</text>');
    return { svg: g.join('') };
  }

  /* ------------------------------------------------------------ mount */
  T.mount('neuron', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'neuron',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* The first-run tip sits just above its target; an empty slot is opened
     there while the tip shows, so it never covers another control. */
  function hintSlot(s, target, text, before){
    if(!target) return;
    var slot = document.createElement('div');
    slot.className = 'nr-tipslot'; slot.setAttribute('aria-hidden', 'true');
    (before || target).parentNode.insertBefore(slot, before || target);
    var h = s.hint({ target: target, text: text });
    if(!h){ slot.remove(); return; }
    var EV = ['pointerdown', 'keydown', 'input', 'change'];
    function done(e){ if(e && e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return; slot.remove(); EV.forEach(function(t){ s.root.removeEventListener(t, done, true); }); if(h.place) h.place(); }
    EV.forEach(function(t){ s.root.addEventListener(t, done, true); });
    if(h.place) h.place();
  }

  /* ------------------------------------------------------------ explore */
  var PATTERNS = [{ value: 'pulse', label: 'One brief pulse' }, { value: 'pair', label: 'Two pulses' }, { value: 'held', label: 'Held on' }];
  var DRUGS = [{ v: 'none', label: 'No drug' }, { v: 'agonist', label: 'Agonist' }, { v: 'antagonist', label: 'Antagonist' }, { v: 'reuptake', label: 'Reuptake inhibitor' }];
  function explore(host, data){
    var X = data.explore || {};
    var view = 'fire', S = X.strength || 22, mode = 'pulse', gap = 6, run = null, upto = null, anim = null, part = null;
    var nt = X.nt || 'dopamine', cls = 'none', synT = null, touched = false, LS = null, nid = T.nid('nr');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem nr-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">The neuron</h2>' +
      '<div class="nr-fig"><svg class="nr-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div class="nr-ctl">' +
        '<div class="ls-seg nr-views" role="group" aria-label="Scene"><button type="button" data-v="fire" aria-pressed="true">Fire</button><button type="button" data-v="synapse" aria-pressed="false">Synapse</button></div>' +
        '<div class="nr-grp nr-grp-fire"></div>' +
        '<div class="nr-grp nr-grp-synapse" hidden><div class="nr-drugs" role="group" aria-label="Drug at the synapse">' + DRUGS.map(function(d){ return '<button type="button" class="bt-btn" data-d="' + d.v + '" aria-pressed="' + (d.v === cls) + '">' + d.label + '</button>'; }).join('') + '</div></div>' +
        '<div class="nr-go"><button type="button" class="btn-press sm ls-btn ls-pri nr-play">Stimulate</button></div>' +
      '</div>' +
      '<div class="nr-say"></div>' +
      T.moreHtml('<div class="nr-more-fire"></div><div class="nr-more-syn" hidden></div>', 'stimulus pattern and neurotransmitter') +
      '<div class="nr-nums"></div><p class="sr-only nr-live"></p></section>';
    var say = T.announcer($('.nr-live'));
    var cue = T.cue('Press Stimulate, then try a weaker stimulus.');
    $('.nr-ctl').insertBefore(cue.el, $('.nr-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var svg = $('.nr-svg');
    var sS = T.slider({ label: 'Stimulus strength', min: 0, max: 40, step: 1, value: S, unit: 'mV', onInput: function(v){ act(); stop(); S = v; run = null; upto = null; draw(); words(); say('Stimulus ' + v + ' millivolts. Press Stimulate.'); } });
    $('.nr-grp-fire').appendChild(sS.el);
    var sPat = T.choiceSelect({ label: 'Stimulus pattern', options: PATTERNS, value: mode, onChange: function(v){ act(); stop(); mode = v; run = null; upto = null; syncView(); draw(); words(); } });
    var sGap = T.slider({ label: 'Time between the two pulses', min: 1, max: 10, step: 0.5, value: gap, unit: 'ms', onInput: function(v){ act(); stop(); gap = v; run = null; upto = null; draw(); words(); } });
    $('.nr-more-fire').appendChild(sPat.el); $('.nr-more-fire').appendChild(sGap.el);
    var sNt = T.choiceSelect({ label: 'Neurotransmitter', options: N.NT_KEYS.map(function(k){ return { value: k, label: ntName(k) }; }), value: nt, onChange: function(v){ act(); stop(); nt = v; synT = null; draw(); words(); say(ntName(v) + '. ' + N.NT[v].does); } });
    $('.nr-more-syn').appendChild(sNt.el);

    function onClick(e){
      var b = e.target.closest('.nr-views button');
      if(b){ setView(b.getAttribute('data-v')); return; }
      var d = e.target.closest('.nr-drugs button');
      if(d){ act(); stop(); cls = d.getAttribute('data-d'); synT = null; syncView(); draw(); words(); say(drugLine()); return; }
      if(e.target.closest('.nr-play')){ act(); play(); return; }
      var p = e.target.closest('[data-part]');
      if(p){ act(); pickPart(p.getAttribute('data-part')); }
    }
    function onKey(e){ var p = e.target.closest && e.target.closest('[data-part]'); if(p && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); act(); pickPart(p.getAttribute('data-part')); } }
    host.addEventListener('click', onClick); host.addEventListener('keydown', onKey);
    function pickPart(p){ part = part === p ? null : p; draw(); words(); if(part) say(N.PARTS[part].name + ': ' + N.PARTS[part].does + '.'); var el = svg.querySelector('[data-part="' + p + '"]'); if(el) el.focus(); }
    function setView(v){
      if(v === view) return;
      act(); stop(); view = v; part = null; syncView(); draw(); words();
      say(v === 'fire' ? 'Fire scene. ' + fireLine() : 'Synapse scene. ' + drugLine());
    }
    function syncView(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.nr-views button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === view)); });
      root.querySelectorAll('.nr-drugs button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-d') === cls)); });
      var gf = $('.nr-grp-fire'), gs = $('.nr-grp-synapse'), mf = $('.nr-more-fire'), ms = $('.nr-more-syn');
      if(gf) gf.hidden = view !== 'fire'; if(gs) gs.hidden = view !== 'synapse';
      if(mf) mf.hidden = view !== 'fire'; if(ms) ms.hidden = view !== 'synapse';
      sGap.el.hidden = mode !== 'pair';
      var b = $('.nr-play'); if(b && !anim) b.textContent = view === 'fire' ? 'Stimulate' : 'Release';
      if(LS && LS.setupRow) LS.setupRow.setup(view === 'fire' ? PATTERNS.filter(function(x){ return x.value === mode; })[0].label + (mode === 'pair' ? ', ' + gap + ' ms apart' : '') : ntName(nt));
    }
    function stop(){ if(anim){ anim.stop(); anim = null; } var b = $('.nr-play'); if(b) b.textContent = view === 'fire' ? 'Stimulate' : 'Release'; }
    function play(){
      if(anim){ stop(); return; }
      if(view === 'fire'){
        run = N.simulate({ mode: mode, S: S, gap: gap });
        var dur = run.dur, secs = 4.2;
        upto = 0;
        anim = P.loop(function(dt, t){ upto = Math.min(dur, t / secs * dur); draw(); return upto < dur; }, { duration: secs, still: function(){ upto = dur; draw(); }, onEnd: function(){ upto = dur; anim = null; stop(); draw(); words(); say(fireLine()); } });
      } else {
        var D = N.SYN.dur, secs2 = 3.4;
        synT = 0;
        anim = P.loop(function(dt, t){ synT = Math.min(D, t / secs2 * D); draw(); return synT < D; }, { duration: secs2, still: function(){ synT = 2.2; draw(); }, onEnd: function(){ if(P.reduced()) synT = 2.2; anim = null; stop(); draw(); words(); say(drugLine()); } });
      }
      var b = $('.nr-play'); if(b) b.textContent = 'Pause';
      anim.start();
    }

    /* ---- words: caption, Why, pills, Details */
    function fired(){ return run && run.spikes.length; }
    function fireLine(){
      if(!run || upto == null) return 'Stimulus ' + S + ' mV. Threshold is ' + (N.THRESH - N.REST) + ' mV above rest.';
      var n = run.spikes.length;
      if(mode === 'held') return n ? 'Held at ' + S + ' mV: ' + n + ' action potentials in 25 ms, all the same size.' : 'Held at ' + S + ' mV: never reaches threshold, no action potential.';
      if(mode === 'pair'){ var e = run.events; return n === 2 ? 'Two pulses ' + gap + ' ms apart: two action potentials.' : n === 1 ? 'Two pulses ' + gap + ' ms apart: only one fires. The second came in the ' + (e[1].effect === 'absolute' ? 'absolute' : 'relative') + ' refractory period.' : 'Two pulses of ' + S + ' mV: neither reaches threshold alone.'; }
      return n ? S + ' mV pushes the membrane past threshold: one full action potential.' : S + ' mV is not enough: the membrane rises ' + S + ' mV and drifts back. No action potential.';
    }
    function drugLine(){
      var lower = ntLower(nt), ex = cls === 'none' ? null : N.exampleOf(nt, cls);
      if(cls === 'none') return ntName(nt) + ' is released, binds receptors on the receiving neuron, then is cleared' + (/reuptake/.test(N.NT[nt].clear) ? ' by reuptake.' : ': ' + N.NT[nt].clear + '.');
      var base = { agonist: 'An agonist activates ' + lower + ' receptors itself: more signal.', antagonist: 'An antagonist sits in ' + lower + ' receptors without activating them: less signal.', reuptake: 'A reuptake inhibitor keeps ' + lower + ' in the synapse longer: more signal.' }[cls];
      return base + (ex ? ' Example: ' + ex.name + '.' : '');
    }
    function words(){
      var head, sub = '', why = '';
      if(view === 'fire'){
        if(part){ head = N.PARTS[part].name + ': ' + N.PARTS[part].does + '.'; sub = part === 'myelin' ? 'In multiple sclerosis the immune system damages myelin, so signals slow down.' : part === 'terminal' ? 'Switch to Synapse to see what happens there.' : 'Tap it again to go back.'; }
        else if(!run || upto == null){ head = 'Stimulus ' + S + ' mV. Press Stimulate.'; sub = 'The neuron rests at ' + mv(N.REST) + '; it fires only if the membrane reaches ' + mv(N.THRESH) + '.'; }
        else if(upto < run.dur) head = 'Recording: ' + f1(upto) + ' ms.';
        else { head = fireLine(); sub = fired() ? (mode === 'held' ? 'A stronger stimulus fires sooner after each refractory period: more spikes, never bigger ones.' : 'All-or-none: a stronger stimulus makes the same spike.') : 'Raise the stimulus until the membrane reaches threshold.'; }
        why = fireWhy();
      } else {
        head = drugLine();
        var pc = N.signalPct(cls);
        sub = cls === 'none' ? 'Press Release, then add a drug.' : 'Signal: ' + pc + '% of the signal with no drug (model).';
        if(cls === 'reuptake' && !/^reuptake/.test(N.NT[nt].clear)) sub += ' ' + ntName(nt) + ' is cleared mainly by enzymes, so drugs that block those enzymes play this role.';
        why = synWhy();
      }
      T.explain($('.nr-say'), '<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), why);
      nums();
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), 'explore');
        if(view === 'fire'){
          LS.pills([{ k: 'Stimulus', html: S + ' mV', tone: 'readout' }], 'left', 'explore');
          var res = !run || upto == null || upto < run.dur ? null : run.spikes.length;
          LS.pills(res == null ? [] : [{ html: res ? (res === 1 ? 'Fired: 1 spike' : 'Fired: ' + res + ' spikes') : 'No spike', tone: res ? 'good' : 'warn' }], 'right', 'explore');
        } else {
          LS.pills([{ html: DRUGS.filter(function(d){ return d.v === cls; })[0].label, tone: 'readout' }], 'left', 'explore');
          LS.pills(cls === 'none' ? [] : [{ k: 'Signal', html: N.signalPct(cls) + '%', tone: N.signalPct(cls) > 100 ? 'good' : 'warn' }], 'right', 'explore');
        }
      }
    }
    function fireWhy(){
      return '<ul class="ls-steps"><li><span><b>Resting potential.</b> At rest the inside of the neuron is about 70 mV more negative than the outside (' + mv(N.REST) + ').</span></li>' +
        '<li><span><b>Threshold.</b> Messages from other neurons push the charge up. If it reaches ' + mv(N.THRESH) + ', channels open, positive sodium ions rush in and the neuron fires: depolarization to about +40 mV.</span></li>' +
        '<li><span><b>All-or-none.</b> A neuron fires completely or not at all. A stronger stimulus does not make a bigger spike; held on, it makes the neuron fire more often.</span></li>' +
        '<li><span><b>Repolarization and the refractory period.</b> Potassium ions flow out and the charge falls, briefly below rest. For about ' + N.ABS + ' ms the neuron cannot fire at all (absolute refractory period), then for a few more ms it needs a stronger push (relative).</span></li>' +
        '<li><span><b>Down the axon.</b> The action potential travels to the terminals; myelin makes it jump from node to node, which is much faster.</span></li></ul>';
    }
    function synWhy(){
      var lower = ntLower(nt);
      return '<ul class="ls-steps"><li><span><b>Release.</b> When the action potential reaches the axon terminal, vesicles release ' + lower + ' into the synapse (the tiny gap between neurons).</span></li>' +
        '<li><span><b>Binding.</b> ' + ntName(nt) + ' binds to receptors on the receiving neuron like a key in a lock. ' + N.NT[nt].does + '</span></li>' +
        '<li><span><b>Clearing.</b> ' + (/^reuptake/.test(N.NT[nt].clear) ? 'Reuptake: the sending neuron takes the neurotransmitter back in, ending the signal.' : 'Here ' + N.NT[nt].clear + '.') + '</span></li>' +
        '<li><span><b>Agonist</b>: activates the receptors itself, so the effect grows. <b>Antagonist</b>: binds without activating, blocking the neurotransmitter. <b>Reuptake inhibitor</b>: blocks reuptake, so the neurotransmitter keeps acting.</span></li>' +
        '<li><span>' + N.NT[nt].low + '</span></li></ul>';
    }
    function nums(){
      var el = $('.nr-nums'); if(!el) return;
      var rows;
      if(view === 'fire'){
        rows = '<tr><th scope="row">Resting potential</th><td>' + mv(N.REST) + '</td></tr><tr><th scope="row">Threshold</th><td>' + mv(N.THRESH) + ' (' + (N.THRESH - N.REST) + ' mV above rest)</td></tr><tr><th scope="row">Peak of a spike</th><td>+' + N.PEAK + ' mV</td></tr><tr><th scope="row">Refractory period</th><td>absolute ' + N.ABS + ' ms, relative to ' + N.REL + ' ms</td></tr>';
        if(run && upto != null && upto >= run.dur) rows += '<tr><th scope="row">This run</th><td>' + esc(PATTERNS.filter(function(x){ return x.value === mode; })[0].label) + ', ' + S + ' mV: ' + (run.spikes.length ? 'spikes at ' + run.spikes.map(function(s){ return M.fixed(s, 1) + ' ms'; }).join(', ') : 'no spike') + '</td></tr>';
        el.innerHTML = '<h3 class="ls-title-l">The numbers</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Membrane numbers"><table class="ls-tbl"><tbody>' + rows + '</tbody></table></div>' +
          '<p class="bt-small">Typical textbook values, drawn from a simple model (not a recording). Rates for a held stimulus: ' + [16, 20, 30, 40].map(function(v){ return v + ' mV, ' + N.rate(v) + ' spikes'; }).join('; ') + ' in 25 ms.</p>' +
          '<h3 class="ls-title-l">Parts of a neuron</h3><ul class="nr-plist">' + Object.keys(N.PARTS).map(function(k){ return '<li><b>' + esc(N.PARTS[k].name) + '</b>: ' + esc(N.PARTS[k].does) + '.</li>'; }).join('') + '</ul>';
      } else {
        el.innerHTML = '<h3 class="ls-title-l">The eight neurotransmitters</h3><ul class="nr-plist">' + N.NT_KEYS.map(function(k){ return '<li><b>' + esc(ntName(k)) + '</b>: ' + esc(N.NT[k].does) + '</li>'; }).join('') + '</ul>' +
          '<h3 class="ls-title-l">Real drugs</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Drug examples"><table class="ls-tbl"><thead><tr><th scope="col">Drug</th><th scope="col">Acts on</th><th scope="col">Kind</th></tr></thead><tbody>' +
          N.DRUGS.map(function(d){ return '<tr><td>' + esc(d.name) + '</td><td>' + esc(ntName(d.nt)) + '</td><td>' + esc(N.CLASSES[d.cls].name) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
          '<p class="bt-small">The synapse graph is an explanatory model in relative units: signal with an agonist ' + N.signalPct('agonist') + '%, an antagonist ' + N.signalPct('antagonist') + '%, a reuptake inhibitor ' + N.signalPct('reuptake') + '% of no drug.</p>';
      }
    }

    /* ---- the picture */
    function size(){ var rc = $('.nr-fig').getBoundingClientRect(); return [Math.max(300, Math.min(1500, Math.round(rc.width) || 640)), Math.max(320, Math.min(1000, Math.round(rc.height) || 480))]; }
    function draw(){
      var wh = size(), Wd = wh[0], H = wh[1];
      svg.setAttribute('viewBox', '0 0 ' + Wd + ' ' + H); svg.setAttribute('width', Wd); svg.setAttribute('height', H);
      var out = view === 'fire' ? fireScene(Wd, H) : synScene(Wd, H);
      svg.innerHTML = out.svg;
      svg.setAttribute('aria-label', out.label);
      svg.setAttribute('role', 'group');
    }
    function fireScene(Wd, H){
      var phone = Wd < 560, pad = phone ? 6 : 16, nh = Math.round(H * (phone ? 0.4 : 0.44));
      var art = neuronArt(pad, 6, Wd - pad * 2, nh - 12, { part: part, parts: true, id: 'nrx' });
      var g = [art.svg], geo = art.geo, ends = run && upto != null;
      // where the run is: charge in the cell body, travelling signals
      if(ends){
        var i = Math.min(run.v.length - 1, Math.round(upto / N.DT)), V = run.v[i];
        var charge = Math.max(0, Math.min(1, (V - N.REST) / (N.THRESH - N.REST)));
        if(charge > 0.02) g.push('<circle class="nr-charge" cx="' + r1(geo.sx) + '" cy="' + r1(geo.sy) + '" r="' + r1(geo.rs * (0.9 + 0.5 * charge)) + '" opacity="' + r1(Math.min(0.9, charge) * 10) / 10 + '" fill="url(#nrxGlow)"/>');
        run.events.forEach(function(e){ var a = upto - e.t; if(a >= 0 && a < 1.2) geo.tips.forEach(function(tp, k){ if(k % 2 === 0) g.push('<circle class="nr-in" cx="' + r1(tp[0]) + '" cy="' + r1(tp[1]) + '" r="' + r1(3 + a * 4) + '" opacity="' + r1((1.2 - a) / 1.2 * 10) / 10 + '"/>'); }); });
        if(mode === 'held' && upto >= 2) geo.tips.forEach(function(tp, k){ if(k % 3 === 0) g.push('<circle class="nr-in is-held" cx="' + r1(tp[0]) + '" cy="' + r1(tp[1]) + '" r="3.5"/>'); });
        var TRAVEL = 3.2;
        run.spikes.forEach(function(sp){
          var a = upto - sp; if(a < 0 || a > TRAVEL + 0.8) return;
          if(a <= TRAVEL){
            // saltatory: the signal sits at a node, then jumps to the next
            var nodes = geo.nodes, k = Math.min(nodes.length - 1, Math.floor(a / TRAVEL * nodes.length)), x = nodes[k];
            g.push('<circle class="nr-ap" cx="' + r1(x) + '" cy="' + r1(geo.sy) + '" r="' + r1(geo.axR * 3.4) + '" fill="url(#nrxGlow)"/><circle class="nr-apc" cx="' + r1(x) + '" cy="' + r1(geo.sy) + '" r="' + r1(geo.axR * 1.4) + '"/>');
          } else geo.fan.forEach(function(fb){ g.push('<circle class="nr-ap" cx="' + r1(fb.end[0]) + '" cy="' + r1(fb.end[1]) + '" r="' + r1(geo.axR * 3) + '" fill="url(#nrxGlow)"/>'); });
        });
      }
      var tr = traceArt(pad, nh, Wd - pad * 2, H - nh, { series: run ? N.series(run, 0.1) : [[0, N.REST], [25, N.REST]], upto: ends ? upto : null, rest: N.REST, thresh: N.THRESH, spikes: run && ends ? run.spikes : [], pulses: run && ends && mode !== 'held' ? run.events.map(function(e){ return e.t; }) : [], held: run && ends && mode === 'held' ? 2 : null, small: phone, enl: true });
      g.push(tr.svg);
      var label = 'A neuron: dendrites on the left, the cell body, a myelinated axon and the axon terminals on the right. Below, its membrane potential over 25 ms: resting at ' + mv(N.REST) + ', threshold ' + mv(N.THRESH) + '. ' + (ends ? fireLine() : 'No stimulus yet.') + (part ? ' Selected: ' + N.PARTS[part].name + '.' : '') + ' Tap a part of the neuron to see what it does.';
      return { svg: g.join(''), label: label };
    }
    function synScene(Wd, H){
      var phone = Wd < 560, pad = phone ? 6 : 16, sh = Math.round(H * 0.56);
      var art = synapseArt(pad, 6, Wd - pad * 2, sh - 10, { nt: nt, cls: cls, t: synT, id: 'syx' });
      var gr = activationArt(pad, sh, Wd - pad * 2, H - sh, { cls: cls, t: anim ? synT : null, enl: true });
      return { svg: art.svg + gr.svg, label: 'A synapse: the axon terminal above releases ' + ntLower(nt) + ' into the synapse; receptors on the receiving neuron below; reuptake transporters at the terminal’s edges. Drug: ' + DRUGS.filter(function(d){ return d.v === cls; })[0].label + '. ' + drugLine() + ' The graph below shows the share of receptors activated over 12 ms' + (cls === 'none' ? '.' : ', with no drug dashed.') };
    }

    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.nr-fig')], dock: [$('.nr-ctl')], setup: 'Settings', moreLabel: 'Stimulus pattern and neurotransmitter', why: [$('.nr-say')], details: [$('.nr-nums')] });
      s.root.addEventListener('click', onClick); s.root.addEventListener('keydown', onKey);
      host.removeEventListener('click', onClick); host.removeEventListener('keydown', onKey);
      LS.setupRow = sp;
      syncView(); draw(); words();
      if(s.mode() === 'explore') hintSlot(s, s.root.querySelector('.nr-play'), 'Start here: fire the neuron', s.root.querySelector('.nr-go'));
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ draw(); }, 60); }).observe($('.nr-fig')); }
      try{ new MutationObserver(function(){ draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
    }
    syncView(); draw(); words();
    return { stop: stop, studio: studio };
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
})();
