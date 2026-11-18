/* Osmosis, tools v2 (docs/tools-v2-osmosis-brief.md; the standard: docs/tools-v2-standard.md). The first AP® Biology
   tool on the shared kit (assets/course/tool-kit2.js) through the course adapter ApBioTools.studioKit2.
   The model is ApBioMath.osmosis (bio-tool-math.js): equilibrium() for Explore, simulate() and trajectory() for the
   timed challenges; the cells, ranges, questions and the mini FRQ are data (bio/data/tools/osmosis.json).

   THE ONE IDEA: water moves toward the lower water potential (toward more solute), and what that does to a cell
   depends on whether it has a wall.

   Two modes (the rule for every tool): EXPLORE is for playing with it, TEST YOURSELF is where you get quizzed.
   Explore: nothing locked, nothing graded, no side panel. Two big tabs (Plant cell, Red blood cell), a purpose line
   with a small "Show me how" link, the beaker with the cell in it, ONE control on the picture ("Solute outside",
   0 to 1.0 M sucrose) and one line under it. INSTANT RESPONSE: dragging the solute shows, that instant, where the
   cell settles in that solution (no Play): solute dots fill the beaker, the cell swells, goes turgid, shrinks,
   plasmolyzes or bursts, the solution is named (hypotonic, isotonic,
   hypertonic) and so is the cell's state. The line under the picture is the CAUSE LINE (K.cause), one colour per
   idea: "More solute outside → lower water potential outside → water moves out → Plasmolyzed". Water arrows are
   drawn only while water is moving (the half second after a change, and the replay). The setting before
   the change stays as a dashed outline and a "before" mark on the track. A small "Watch it happen" button replays
   the change from a fresh cell (the arrows thin to nothing as the water potentials meet) and ends on a takeaway.
   A tab never moves the solute: both cells sit in the same solution, so they can be compared.
   Test yourself: one dropdown on the stage picks "Predict, then run" (a seeded challenge on the same picture with
   the potato core, the red blood cell or the dialysis bag: direction and end state, recorded as
   osmosis:predict-<system>:dir|state, as before) or the potato core questions and the mini FRQ.
   "?": how the model works, the numbers behind this setting, the lab graph and the link to the water potential
   calculations tool.
   One colour per idea, everywhere: water blue, solute amber, the wall and its push green, red for a burst cell
   only. Every value is also written, so colour is never the only cue. Reduced motion: no tween, no replay
   animation (Watch it happen goes straight to the result and the takeaway). */
(function(){
  'use strict';
  var SLUG = 'osmosis';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T || !M) return;
  var NF = 160; // samples in a challenge's trajectory
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function n1(v){ return (+v).toFixed(1); }

  /* ------------------------------------------------------------ drawing the specimen (unit space, centre 0,0) */
  function smooth(pts){
    var n = pts.length, d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for(var i = 0; i < n; i++){
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d + 'Z';
  }
  /* A plant cell's outline: a rounded, slightly irregular polygon (cells in a tissue press into many-sided shapes). */
  var CELL = [[0, 1], [0.9, 0.96], [1.75, 1.02], [2.6, 0.97], [3.3, 1], [4.15, 0.95], [5.05, 1.01]];
  function wallR(a){
    var best = 9;
    for(var i = 0; i < CELL.length; i++){ var f = CELL[i], c = Math.cos(a - f[0]); if(c > 0.05) best = Math.min(best, f[1] / c); }
    return Math.min(best, 1.22) * 0.92 + 0.08;
  }
  function ring(fn, n, ox, oy){ var pts = []; for(var i = 0; i < n; i++){ var a = i / n * Math.PI * 2, r = fn(a); pts.push([(ox || 0) + Math.cos(a) * r[0], (oy || 0) + Math.sin(a) * r[1]]); } return pts; }
  /* The specimen holding water W (1 = its starting water): parts (svg), its outline (for the "before" ghost), the
     half extents of its outside (ex, ey) and of the space its solute sits in (inner), and at(a): a point on the
     membrane (plant) or the edge at angle a. */
  function shape(sy, W, lysed, bp, st){
    var o = { parts: [], outline: '', ex: 0, ey: 0, inner: { x: 0, y: 0 }, kind: sy.kind };
    if(sy.kind === 'plant'){
      /* A plant cell: a wall with thickness, the membrane just inside it, cytoplasm with chloroplasts and a nucleus,
         and a large central vacuole that holds the water and the cell sap's solute. Areas are drawn true to the
         model: the vacuole's area follows the water W, the protoplast's follows its mass (the part that is not
         water does not shrink), so crowding inside can be compared with outside. Turgid: the wall bows out and its
         corners round. Flaccid: the membrane only touches the wall. Plasmolyzed: the protoplast rounds up and pulls
         away but still lies against the wall on one side; the gap fills with the outside solution. */
      var tg = W > sy.W0 ? clamp((W / sy.W0 - 1) / 0.1, 0, 1) : 0, bulge = 1 + 0.05 * tg, wt = 10, wf = Math.min(W / sy.W0, 1);
      var whx = 80 * bulge, why = 61 * bulge, s = clamp(Math.sqrt(sy.b + (1 - sy.b) * wf), 0.6, 1);
      var round = clamp((1 - s) * 9, 0, 1), phx = whx - wt - 1.2, phy = why - wt - 1.2;
      var wr = function(a){ return wallR(a) * (1 - 0.4 * tg) + 1.02 * 0.4 * tg; };
      var kk = function(a){ return wr(a) * (1 - round) + 0.88 * round; };
      var pr = function(a){ var k = kk(a); return [phx * k * s, phy * k * s]; };
      var vf = Math.min(Math.sqrt((1 - sy.b) * W / sy.W0), s - 0.12), vox = 3 * s, voy = 2 * s;
      var vr = function(a){ var k = kk(a); return [Math.max(4, phx * k * vf), Math.max(4, phy * k * vf)]; };
      // where the pulled away protoplast rests: against the wall, lower right
      var a0 = 0.62, pp0 = pr(a0), pcx = (Math.cos(a0) * ((whx - wt) * wr(a0) - pp0[0])) * 0.93, pcy = (Math.sin(a0) * ((why - wt) * wr(a0) - pp0[1])) * 0.93;
      if(round < 0.05){ pcx = 0; pcy = 0; }
      var outer = smooth(ring(function(a){ var k = wr(a); return [whx * k, why * k]; }, 42));
      var mid = smooth(ring(function(a){ var k = wr(a); return [(whx - wt / 2) * k, (why - wt / 2) * k]; }, 42));
      var inner = smooth(ring(function(a){ var k = wr(a); return [(whx - wt) * k, (why - wt) * k]; }, 42));
      var memb = smooth(ring(pr, 42)), vac = smooth(ring(vr, 36, vox, voy)), q = [];
      o.parts.push('<path class="os2-wall' + (tg > 0.05 ? ' is-taut' : '') + '" fill-rule="evenodd" d="' + outer + inner + '"/>');
      o.parts.push('<path class="os2-wallmid" d="' + mid + '"/><path class="os2-walledge" d="' + outer + '"/><path class="os2-walledge is-in" d="' + inner + '"/>');
      q.push('<path class="os2-cyto" d="' + memb + '"/>');
      var band = function(a, f){ var r = pr(a), v = vr(a); return [Math.cos(a) * (r[0] * (1 - f) + v[0] * f) + vox * f, Math.sin(a) * (r[1] * (1 - f) + v[1] * f) + voy * f, Math.min(r[0] - v[0], r[1] - v[1])]; };
      [0.32, 1.2, 2.02, 2.95, 4.45, 5.2, 5.92].forEach(function(a){
        var b = band(a, 0.5), ry = clamp(b[2] * 0.34, 2.2, 5.2), rx = ry * 1.85, rot = (Math.atan2(Math.sin(a) * whx, Math.cos(a) * why) * 57.3 + 90).toFixed(0);
        q.push('<g transform="translate(' + n1(b[0]) + ' ' + n1(b[1]) + ') rotate(' + rot + ')"><ellipse class="os2-chl" rx="' + n1(rx) + '" ry="' + n1(ry) + '"/><path class="os2-chl-l" d="M' + n1(-rx * 0.55) + ' 0H' + n1(rx * 0.55) + '"/></g>');
      });
      var nq = band(3.72, 0.5), nrad = clamp(nq[2] * 0.42, 3, 7.5);
      q.push('<circle class="os2-nuc" cx="' + n1(nq[0]) + '" cy="' + n1(nq[1]) + '" r="' + n1(nrad) + '"/><circle class="os2-nucl" cx="' + n1(nq[0] + nrad * 0.2) + '" cy="' + n1(nq[1] - nrad * 0.15) + '" r="' + n1(nrad * 0.36) + '"/>');
      q.push('<path class="os2-vac" d="' + vac + '"/>');
      var hv = vr(4.1); q.push('<path class="os2-vacshine" d="M' + n1(vox + Math.cos(3.5) * hv[0] * 0.72) + ' ' + n1(voy + Math.sin(3.5) * hv[1] * 0.72) + 'Q' + n1(vox + Math.cos(4.1) * hv[0] * 0.86) + ' ' + n1(voy + Math.sin(4.1) * hv[1] * 0.86) + ' ' + n1(vox + Math.cos(4.7) * hv[0] * 0.72) + ' ' + n1(voy + Math.sin(4.7) * hv[1] * 0.72) + '"/>');
      q.push('<path class="os2-memb" d="' + memb + '"/>');
      o.parts.push('<g transform="translate(' + n1(pcx) + ' ' + n1(pcy) + ')">' + q.join('') + '</g>');
      o.ex = whx; o.ey = why; o.gap = round > 0.05; // the gap between wall and membrane holds the outside solution (the wall lets it through)
      if(o.gap){ o.px = phx * s * 0.9; o.py = phy * s * 0.9; o.pcx = pcx; o.pcy = pcy; }
      var v0 = vr(0), v1 = vr(Math.PI / 2);
      o.inner = { x: v0[0] * 0.95, y: v1[1] * 0.95, ox: pcx + vox, oy: pcy + voy }; // the solute drawn is the cell sap's, in the vacuole
      o.at = function(a){ var r = pr(a); return [pcx + Math.cos(a) * r[0], pcy + Math.sin(a) * r[1]]; };
      o.wallAt = function(a, off){ var k = wr(a); return [Math.cos(a) * (whx * k + (off || 0)), Math.sin(a) * (why * k + (off || 0))]; };
      o.grow = tg;
    } else if(sy.kind === 'animal'){
      /* A red blood cell, face on. Its drawn area follows its water, so crowding inside can be compared with outside.
         Normal: a biconcave disc, plainly paler and dished in the middle where it is thinnest. Swollen: bigger, the
         dish fills in and it rounds into a ball. Shriveled (crenated): smaller, with a scalloped edge. Strained (st):
         stretched thin and a little larger, just before it tears. Burst (lysed, bp 0 to 1): the membrane tears and
         snaps back, what the cell held streams out through the tear and thins away, and a slack, torn, empty
         membrane is left. */
      var r0 = 54, R = r0 * Math.sqrt(Math.max(W, 0.05)), eo = function(x){ x = clamp(x, 0, 1); return 1 - (1 - x) * (1 - x); };
      if(lysed){
        var bq = bp == null ? 1 : clamp(bp, 0, 1), tc = -0.7, Rs = R * 1.07;
        R = 62 + (Rs - 62) * (1 - eo(bq / 0.14));
        var hg = 0.06 + 0.5 * eo(bq / 0.2) + 0.06 * bq, a1 = tc + hg, a2 = tc - hg + Math.PI * 2, sl = eo(bq / 0.5), pts = [], N = 44;
        var rad = function(a){ return R * (1 + sl * (0.05 * Math.sin(3 * a + 1) + 0.035 * Math.sin(5 * a + 2))); };
        for(var n = 0; n <= N; n++){ var aa = a1 + (a2 - a1) * n / N, rr = rad(aa); pts.push(n1(Math.cos(aa) * rr) + ' ' + n1(Math.sin(aa) * rr)); }
        var gx = Math.cos(tc), gy = Math.sin(tc), u = eo(bq / 0.6), fl = 18 * eo(bq / 0.2);
        // what it held: a plume that leaves through the tear, travels out and thins
        o.parts.push('<circle class="os2-hb" cx="' + n1(gx * R * (0.5 + 0.9 * u)) + '" cy="' + n1(gy * R * (0.5 + 0.9 * u)) + '" r="' + n1(R * (0.4 + 0.8 * bq)) + '" opacity="' + (Math.min(1, bq / 0.08) * (1 - 0.7 * bq)).toFixed(2) + '"/>');
        if(bq < 1) o.parts.push('<circle class="os2-rbc is-emptying" r="' + n1(R * 0.97) + '" opacity="' + (0.92 * Math.pow(1 - bq, 1.3)).toFixed(2) + '"/>');
        o.parts.push('<path class="os2-torn" d="M' + pts.join('L') + '"/>');
        var e1 = [Math.cos(a1) * rad(a1), Math.sin(a1) * rad(a1)], e2 = [Math.cos(a2) * rad(a2), Math.sin(a2) * rad(a2)];
        o.parts.push('<path class="os2-torn" d="M' + n1(e1[0]) + ' ' + n1(e1[1]) + 'q' + n1(gx * fl * 0.9 + 4) + ' ' + n1(gy * fl * 0.2) + ' ' + n1(gx * fl) + ' ' + n1(gy * fl - fl * 0.35) + 'M' + n1(e2[0]) + ' ' + n1(e2[1]) + 'q' + n1(gx * fl * 0.3) + ' ' + n1(gy * fl * 0.9) + ' ' + n1(gx * fl + fl * 0.3) + ' ' + n1(gy * fl) + '"/>');
        o.ex = R; o.ey = R; o.inner = { x: R * 0.8, y: R * 0.8 }; o.bp = bq;
        // each particle leaves through the tear, then spreads
        o.dot = function(j, n){
          var da = j * 2.39996 + 0.6, dq = Math.sqrt((j + 0.5) / n) * 0.86 * Rs, p0 = [Math.cos(da) * dq, Math.sin(da) * dq];
          var fa = tc + (((j * 0.618) % 1) - 0.5) * 1.9, fd = 62 * (1.4 + 0.95 * ((j * 0.377) % 1)), p1 = [Math.cos(fa) * fd, Math.sin(fa) * fd];
          var t = eo((bq - 0.3 * ((j * 0.754) % 1)) / 0.6), g0 = [gx * R * 0.98, gy * R * 0.98];
          return [(1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * g0[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * g0[1] + t * t * p1[1]];
        };
      } else {
        var stn = st ? eo(st) : 0; R *= 1 + 0.07 * stn;
        var amp = W < 0.97 ? Math.min(0.075, (1 - W) * 0.2) : 0, sp = 13, body;
        if(amp > 0) body = smooth(ring(function(a){ var k = 1 - amp + amp * Math.cos(a * sp + 0.4); return [R * k, R * k]; }, sp * 6));
        else body = smooth(ring(function(){ return [R, R]; }, 24));
        var sw = W > 1 ? clamp((W - 1) / 0.45, 0, 1) : 0, pal = (W >= 1 ? 1 - sw : Math.max(0.4, 1 - (1 - W) * 1.1)) * (1 - stn);
        o.parts.push('<path class="os2-rbc' + (stn > 0 ? ' is-strain' : '') + '" d="' + body + '"/>');
        if(pal > 0.03){
          o.parts.push('<circle class="os2-pallor" cy="1" r="' + n1(R * 0.6) + '" opacity="' + pal.toFixed(2) + '"/>');
          o.parts.push('<path class="os2-dish" d="M' + n1(-R * 0.5) + ' ' + n1(-R * 0.1) + 'A' + n1(R * 0.52) + ' ' + n1(R * 0.52) + ' 0 0 1 ' + n1(R * 0.12) + ' ' + n1(-R * 0.5) + '" opacity="' + (pal * 0.3).toFixed(2) + '"/>');
        }
        o.parts.push('<path class="os2-rbcrim" d="M' + n1(-R * 0.86) + ' ' + n1(-R * 0.2) + 'A' + n1(R * 0.88) + ' ' + n1(R * 0.88) + ' 0 0 1 ' + n1(-R * 0.2) + ' ' + n1(-R * 0.86) + '" opacity="' + (0.4 + 0.45 * sw).toFixed(2) + '"/>');
        if(sw > 0.1) o.parts.push('<ellipse class="os2-rbcshine" cx="' + n1(-R * 0.34) + '" cy="' + n1(-R * 0.4) + '" rx="' + n1(R * 0.2) + '" ry="' + n1(R * 0.11) + '" transform="rotate(-38 ' + n1(-R * 0.34) + ' ' + n1(-R * 0.4) + ')" opacity="' + (sw * 0.75).toFixed(2) + '"/>');
        o.ex = R; o.ey = R; o.inner = { x: R * (0.92 - amp), y: R * (0.92 - amp) };
      }
    } else {
      /* Dialysis tubing tied off at both ends: slack and creased when it has lost water, round and tight when full. */
      var f = Math.min(W, sy.W0 * 1.03), h = 118 * Math.pow(f, 0.6), w = 70 * Math.pow(f, 0.42), top = -h / 2, bot = top + h;
      var full = clamp((W - 0.7) / (sy.W0 - 0.7), 0, 1), bow = 4 + full * 9, neck = 9, L = -w / 2, Rr = w / 2;
      var body2 = 'M' + (-neck) + ' ' + n1(top) +
        'C' + n1(L - bow * 0.2) + ' ' + n1(top + 6) + ' ' + n1(L - bow) + ' ' + n1(top + h * 0.3) + ' ' + n1(L - bow * 0.6) + ' ' + n1(top + h * 0.55) +
        'C' + n1(L - bow * 0.2) + ' ' + n1(top + h * 0.82) + ' ' + n1(L + 4) + ' ' + n1(bot - 2) + ' ' + (-neck) + ' ' + n1(bot) +
        'L' + neck + ' ' + n1(bot) +
        'C' + n1(Rr - 4) + ' ' + n1(bot - 2) + ' ' + n1(Rr + bow * 0.2) + ' ' + n1(top + h * 0.82) + ' ' + n1(Rr + bow * 0.6) + ' ' + n1(top + h * 0.55) +
        'C' + n1(Rr + bow) + ' ' + n1(top + h * 0.3) + ' ' + n1(Rr + bow * 0.2) + ' ' + n1(top + 6) + ' ' + neck + ' ' + n1(top) + 'Z';
      o.parts.push('<path class="os2-string" d="M0 ' + n1(top - 12) + 'V-400"/>');
      o.parts.push('<path class="os2-bag' + (W >= sy.W0 ? ' is-taut' : '') + '" d="' + body2 + '"/>');
      var cr = (1 - full) * 0.9;
      if(cr > 0.05) o.parts.push('<path class="os2-crease" opacity="' + cr.toFixed(2) + '" d="M' + n1(-w * 0.18) + ' ' + n1(top + 10) + 'q-6 ' + n1(h * 0.4) + ' 2 ' + n1(h - 20) + 'M' + n1(w * 0.22) + ' ' + n1(top + 14) + 'q5 ' + n1(h * 0.35) + ' -3 ' + n1(h - 26) + '"/>');
      o.parts.push('<path class="os2-bagend" d="M' + (-neck) + ' ' + n1(top) + 'l-3 -10h' + (2 * neck + 6) + 'l-3 10zM' + (-neck) + ' ' + n1(bot) + 'l-4 12h' + (2 * neck + 8) + 'l-4 -12z"/>');
      o.parts.push('<rect class="os2-knot" x="' + (-neck - 3) + '" y="' + n1(top - 4) + '" width="' + (2 * neck + 6) + '" height="4" rx="2"/><rect class="os2-knot" x="' + (-neck - 2) + '" y="' + n1(bot + 1) + '" width="' + (2 * neck + 4) + '" height="4" rx="2"/>');
      o.outline = body2; o.ex = w / 2 + bow * 0.6; o.ey = h / 2; o.inner = { x: w / 2 - 6, y: h / 2 - 12 }; o.noTop = true;
    }
    return o;
  }
  /* A fixed scatter pattern (the same on every load, so a redraw never jumps). */
  var POOLS = {};
  function poolFor(aspect){
    // seeded, and each new point is the candidate farthest from those before it: evenly spread at every count, with
    // no rows, stripes or clumps, for a box of this shape (x counts for its real share of the distance)
    var key = Math.max(0.6, Math.min(4, Math.round(aspect * 4) / 4));
    if(POOLS[key]) return POOLS[key];
    var P = [], sd = 20261117, rnd = function(){ sd = (sd + 0x6D2B79F5) | 0; var t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    for(var i = 0; i < 1100; i++){
      var best = null, bd = -1;
      for(var c = 0; c < 8; c++){
        var x = rnd(), y = rnd(), d = 9;
        for(var j = 0; j < P.length; j++){ var dx = (x - P[j][0]) * key, dy = y - P[j][1], q = dx * dx + dy * dy; if(q < d) d = q; }
        if(d > bd){ bd = d; best = [x, y]; }
      }
      P.push(best);
    }
    return (POOLS[key] = P);
  }
  var KD = 0.006; // solute dots per unit area per osmol/L, the same inside and outside

  function boot(){
    var K = window.LevlKit2;
    T.mount(SLUG, function(app, data, ctx){
      var esc = T.esc, F = T.F, STATE = data.states, EX = data.explore;
      function short(k){ return STATE[k].split(':')[0]; }
      function solute(id){ return data.solutes.filter(function(s){ return s.id === id; })[0]; }
      function sysById(id){ return data.systems.filter(function(s){ return s.id === id; })[0]; }
      function td(sy, t){ return F(t, sy.time.step < 1 ? 2 : 0); }
      function dur(sy, t){ return t >= 120 && t % 60 === 0 ? (t / 60) + ' hours' : td(sy, t) + ' minutes'; }   // a potato core's 1440 minutes reads as 24 hours
      function clockText(sy, t, end){ return end >= 600 ? 't = ' + F(t / 60, 1) + ' of ' + F(end / 60, 0) + ' h' : 't = ' + td(sy, t) + ' of ' + td(sy, end) + ' min'; }
      var SOL = solute(EX.solute);
      /* The Explore cells: an idealized plant cell (just full in the isotonic solution) and the red blood cell. */
      var CELLS = EX.cells.map(function(c){ var sy = c.system ? Object.assign({}, sysById(c.system)) : Object.assign({}, c); sy.T = c.T; return { id: c.id, tab: c.tab, short: c.short, sys: sy }; });
      var S = { tab: CELLS[0].id, outC: EX.outside.value, mode: 'explore', part: null };
      var view = { W: 1, lysed: false, bp: 0, debris: 0, strain: 0, newUntil: 0, mark: null, play: null, clock: 0 }, prev = null, gest = false, took = false;
      function cellNow(){ return CELLS.filter(function(c){ return c.id === S.tab; })[0]; }
      var cache = {};
      function eq(cell, C){ var k = cell.id + '|' + C; return cache[k] || (cache[k] = M.osmosis.equilibrium(cell.sys, { outC: C, outI: SOL.i, T: cell.sys.T })); }
      function resNow(){ return eq(cellNow(), S.outC); }

      // The page's own blocks (the adapter moves them): About, the questions and the mini FRQ.
      app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
        '<section class="bt-card" aria-labelledby="os-q"><h2 id="os-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'os2';
      var tabs = K.tabs({ label: 'Which cell', items: CELLS.map(function(c){ return { value: c.id, label: c.tab, short: c.short }; }), value: S.tab, big: true, onChange: function(v){ setTab(v); } });
      stage.appendChild(tabs.el);
      var head = K.head({ purpose: '', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'os2-scene'; sceneBox.id = T.nid('os2');
      sceneBox.innerHTML = '<svg class="os2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="os2-static"></g><g class="os2-dyn"></g></svg>';
      stage.appendChild(sceneBox);
      tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
      var svg = sceneBox.querySelector('svg'), gStatic = svg.querySelector('.os2-static'), gDyn = svg.querySelector('.os2-dyn'), layer = K.layer(sceneBox), G = null;
      var lines = document.createElement('div'); lines.className = 'os2-lines';
      var cause = K.cause({ label: 'Why' });
      var clock = document.createElement('p'); clock.className = 'os2-clock'; clock.hidden = true;
      var player = K.player({ min: 0, max: 1, speed: 1 / 3.4, labels: { play: 'Watch it happen', pause: 'Pause', again: 'Watch again' },
        get: function(){ return view.play == null ? 0 : view.play; },
        set: function(v){ view.play = v; view.clock = (window.performance ? performance.now() : 0); syncWords(); draw(); },
        before: function(){ hideCue(true); tourDid('watch'); stopTween(); clearMarks(); took = false; view.play = 0; syncWords(); },
        onEnd: function(){ view.play = null; snap(); took = true; syncWords(); draw(); player.paint(); say(takeaway()); } });
      player.el.classList.add('is-sm');
      lines.appendChild(cause.el); lines.appendChild(clock); lines.appendChild(player.el);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

      /* ---- the one control, on the picture */
      var cSol = K.drag(layer, { key: 'apbio-osmosis-sol', label: 'Solute outside the cell: ' + SOL.name + ' in the beaker', min: 0, max: EX.outside.max, step: EX.outside.step, value: S.outC, track: [0, 0, 1, 0], chip: false,
        valuetext: function(v){ return F(v, 2) + ' molar ' + SOL.name + ' outside. ' + stateLine(eq(cellNow(), v)); }, tag: function(v){ return F(v, 2) + ' M'; },
        onInput: function(v){ begin(); player.stop(); view.play = null; S.outC = v; took = false; changed(); tourDid('drag'); },
        onEnd: function(){ gest = false; say(cause.text()); refHtml(); } });
      var cue = K.cue(layer, { key: 'apbio-osmosis', text: 'Drag the solute', side: 'right', at: function(){ return G ? [G.tx0 + (G.tx1 - G.tx0) * (S.outC / EX.outside.max), G.ty] : [0, 0]; } });
      function hideCue(used){ if(cue.active()) cue.hide(used); }
      stage.addEventListener('pointerdown', function(){ hideCue(true); }, true);
      stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End|Enter| )/.test(e.key)) hideCue(true); }, true);
      var tour = K.tour({ key: 'apbio-osmosis', label: 'Show me how', steps: [
        { id: 'drag', text: 'Drag the solute. The cell changes at once.', target: function(){ return cSol.el.querySelector('.tk2-knob'); } },
        { id: 'read', text: 'Read what happened to the cell, and why on the line below.', target: function(){ return sceneBox.querySelector('.os2-statep') || sceneBox; } },
        { id: 'watch', text: 'Press Watch it happen to see the water move.', target: function(){ return player.el; } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tour.start(true); }

      /* ---- the change before this one: a dashed outline and a mark on the track */
      function begin(){ if(gest) return; gest = true; var r = resNow(); prev = { tab: S.tab, outC: S.outC, W: r.W, lysed: r.lysed }; }
      /* ---- the picture follows the control at once, and every change of state is seen happening (owner round 2,
         review round 1). One loop chases the setting: the cell's water moves toward where it settles in this
         solution, so a drag of many steps is one smooth change; a red blood cell that must burst swells, strains,
         then tears and empties; a burst cell does not heal, so when the solute goes back up the torn cell fades
         while a new cell comes in ("new cell"), and that survives every further step of the same drag. Water
         arrows, and the words that depend on them, exist only while water is moving. Reduced motion: the result
         at once with a short cross fade and, for a moment, a still mark of the direction. */
      var tw = 0, lastTs = 0, newT = 0, markT = 0, wKey = '';
      function now(){ return window.performance ? performance.now() : Date.now(); }
      function stopTween(){ if(tw){ cancelAnimationFrame(tw); tw = 0; } lastTs = 0; view.strain = 0; view.debris = 0; }
      function snap(){ var r = resNow(); view.W = r.W; view.lysed = r.lysed; view.bp = r.lysed ? 1 : 0; view.debris = 0; view.strain = 0; }
      function clearMarks(){ clearTimeout(newT); clearTimeout(markT); view.newUntil = 0; view.mark = null; }
      function crossFade(old){
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'os2-fade'); g.innerHTML = old; svg.appendChild(g);
        var done = function(){ if(g.parentNode) g.parentNode.removeChild(g); };
        if(g.animate){ var an = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'linear' }); an.onfinish = done; setTimeout(done, 400); } else done();
      }
      /* What the picture shows right now (not where it will end): which way water is going, and the cell's state. */
      function flowNow(){
        if(view.play != null) return replayNow().dir;
        if(view.mark) return view.mark;
        if(!tw || view.lysed || view.debris > 0) return null;
        if(view.strain > 0) return 'in';
        var d = resNow().W - view.W;
        return d > 0.004 ? 'in' : d < -0.004 ? 'out' : null;
      }
      function busy(){ return view.play != null || !!tw || !!view.mark; }
      function stateShown(sy, W, lysed, bp, tW){
        if(lysed) return (bp == null ? 1 : bp) > 0.3 ? 'lysed' : '';
        var st = M.osmosis.state(sy, W, false);
        // a filling plant cell is called turgid once its wall is seen bowing (most of the way there), not at the first drop
        if(st === 'turgid' && sy.kind === 'plant' && tW != null && tW > sy.W0 && W - sy.W0 < 0.6 * (tW - sy.W0)) st = 'flaccid';
        return st;
      }
      function syncWords(){
        var k = S.tab + '|' + S.outC + '|' + flowNow() + '|' + busy() + '|' + (view.play != null ? replayNow().st : stateShown(cellNow().sys, view.W, view.lysed, view.bp, resNow().W)) + '|' + took;
        if(k !== wKey){ wKey = k; words(); }
      }
      function changed(){
        var r = resNow(), from = view.W, wasLysed = view.lysed;
        if(view.lysed && !r.lysed){ // a burst cell does not heal: a new cell goes into the new solution
          view.debris = 1; view.lysed = false; view.bp = 0; view.W = 1; view.strain = 0;
          view.newUntil = now() + 2600; clearTimeout(newT); newT = setTimeout(function(){ view.newUntil = 0; draw(); }, 2650);
        }
        if(K.reduced() || !window.requestAnimationFrame){
          var old = gDyn.innerHTML, base = wasLysed && !r.lysed ? 1 : from, dir = wasLysed && r.lysed ? null : r.lysed ? 'in' : r.W > base + 1e-6 ? 'in' : r.W < base - 1e-6 ? 'out' : null;
          snap(); view.mark = dir; clearTimeout(markT);
          if(dir) markT = setTimeout(function(){ view.mark = null; syncWords(); draw(); }, 2600);
          syncWords(); draw(); crossFade(old); return;
        }
        view.mark = null; syncWords();
        if(!tw){ lastTs = 0; tw = requestAnimationFrame(tick); }
      }
      function tick(ts){
        var dt = lastTs ? Math.min(50, ts - lastTs) : 16, r = resNow(), go = false; lastTs = ts; view.clock = ts;
        if(view.debris > 0){ view.debris = Math.max(0, view.debris - dt / 480); go = true; }   // the torn cell fades; the new one waits
        else if(view.lysed){ if(view.bp < 1){ view.bp = Math.min(1, view.bp + dt / 1000); go = true; } }
        else {
          var d = r.W - view.W;
          if(view.strain > 0 && !r.lysed) view.strain = 0;
          if(view.strain > 0){ view.strain = Math.min(1, view.strain + dt / 320); go = true; if(view.strain >= 1){ view.strain = 0; view.lysed = true; view.bp = 0; } }
          else if(Math.abs(d) > 0.002){ view.W += d * (1 - Math.exp(-dt / 150)); if(Math.abs(r.W - view.W) <= 0.002) view.W = r.W; go = true; }
          else { view.W = r.W; if(r.lysed){ view.strain = 0.001; go = true; } }
        }
        if(go){ syncWords(); draw(); tw = requestAnimationFrame(tick); }
        else { tw = 0; lastTs = 0; syncWords(); draw(); }
      }
      /* The replay (Watch it happen) at its place f: a fresh cell going to where it settles. */
      function replayNow(){
        var cell = cellNow(), r = resNow(), c = { outC: S.outC, outI: SOL.i, T: cell.sys.T }, f = view.play || 0, o = { W: 1, lysed: false, bp: 0, strain: 0 };
        if(r.lysed){ var g = Math.min(1, f / 0.5); o.W = 1 + (r.W - 1) * (1 - Math.pow(1 - g, 2)); o.strain = f >= 0.5 && f < 0.6 ? (f - 0.5) / 0.1 : 0; o.lysed = f >= 0.6; o.bp = o.lysed ? Math.min(1, (f - 0.6) / 0.36) : 0; }
        else { var e = (Math.exp(-4.5 * f) - Math.exp(-4.5)) / (1 - Math.exp(-4.5)); o.W = r.W + (1 - r.W) * e; }
        var d = r.psiO - M.osmosis.psiParts(cell.sys, c, o.W).psi;
        o.gap = Math.abs(d); o.dir = o.lysed ? null : o.strain ? 'in' : Math.abs(o.W - r.W) < 0.004 || Math.abs(d) < 0.05 ? null : d > 0 ? 'in' : 'out';
        o.st = stateShown(cell.sys, o.W, o.lysed, o.bp, r.W);
        return o;
      }
      function setTab(v){
        if(v === S.tab) return;
        player.stop(); view.play = null; stopTween(); clearMarks(); took = false; prev = null; gest = false;
        S.tab = v; snap(); syncWords(); layoutNow(); refHtml(); tourDid('tab');
      }

      /* ---- words: the purpose line, the cause line, the takeaway */
      var PURPOSE = { plant: 'What the solution outside does to a plant cell', animal: 'What the solution outside does to a red blood cell' };
      function tonicity(r){ return r.startDir === 'in' ? 'Hypotonic' : r.startDir === 'out' ? 'Hypertonic' : 'Isotonic'; }
      function stateWord(r, sy){ return r.lysed ? 'Burst (lysed)' : short(r.state); }
      function stateLine(r){ return tonicity(r) + ' solution: ' + (r.startDir === 'in' ? 'water moves in' : r.startDir === 'out' ? 'water moves out' : 'no net water movement') + ', the cell is ' + stateWord(r).toLowerCase() + '.'; }
      /* The cause line says what the picture shows at that moment. Settled: the whole story for this solution
         against the cell ("... → water moves out → Plasmolyzed"). While water is moving: only as far as the water
         ("... → water moves out"); the result is added when the cell is in that state. When a change sends water
         back the other way from that story, the line tells the change ("Less solute than before → water potential
         outside rises → water moves back in") for as long as the arrows show it, then returns to the settled
         story (so 0.30 M always ends on "no net water movement"). The first two pills are not kept through a
         reversal: they would give a cause that points the other way from the arrows. */
      function chain(){
        var r = resNow(), sy = cellNow().sys, a = [], fl = flowNow(), moving = busy(), inn = r.startDir === 'in';
        if(moving && fl && fl !== r.startDir){
          var bin = fl === 'in';
          return [{ t: (bin ? 'Less' : 'More') + ' solute than before', role: 'sol', say: (bin ? 'less' : 'more') + ' solute outside than before' }, { t: 'water potential outside ' + (bin ? 'rises' : 'falls'), role: 'water' },
            { t: 'water moves back ' + (bin ? 'in' : 'out'), role: 'water' }];
        }
        if(r.startDir === 'none') return [{ t: 'Same solute both sides', role: 'sol' }, { t: 'equal water potential', role: 'water' }, { t: 'no net water movement', role: 'water' }, { t: stateWord(r), role: 'ink' }];
        a.push({ t: inn ? (S.outC === 0 ? 'No solute outside' : 'Less solute outside') : 'More solute outside', role: 'sol' });
        a.push({ t: (inn ? 'higher' : 'lower') + ' water potential outside', role: 'water' });
        if(moving && !fl && view.play == null && view.debris > 0) return a;   // a new cell is still coming in
        a.push({ t: 'water moves ' + (inn ? 'in' : 'out'), role: 'water' });
        if(moving && fl) return a;
        if(inn && sy.kind === 'plant') a.push({ t: 'wall pushes back', role: 'wall' });
        if(r.lysed) a.push({ t: 'no wall to push back', role: 'ink' });
        a.push(r.lysed ? { t: 'Bursts (lysis)', role: 'bad', say: 'the cell bursts' } : { t: stateWord(r), role: 'ink' });
        return a;
      }
      function takeaway(){
        var r = resNow(), plant = cellNow().sys.kind === 'plant';
        if(r.startDir === 'none') return 'Equal water potential: water still crosses both ways, but with no net movement.';
        if(r.startDir === 'out') return plant ? 'Water left for the lower water potential outside, so the membrane pulled away from the wall.'
          : 'Water left for the lower water potential outside, so the cell shriveled.';
        if(plant) return 'Water came in until the wall’s push raised the cell’s water potential to match. It cannot burst.';
        return r.lysed ? 'With no wall to push back, water kept coming in until the membrane tore.' : 'Water came in and diluted the cell until the water potentials matched.';
      }
      function words(){
        head.purpose(PURPOSE[cellNow().sys.kind]);
        if(took) cause.take(takeaway()); else cause.set(chain());
      }

      /* ---------------------------------------------------- layout and drawing */
      function geo(Wd, H){
        var ph = Wd < 520, ex = S.mode === 'explore';
        var ctl = ex ? (ph ? 104 : 106) : 40, air = ph ? 24 : 34, gx = ph ? 5 : 9, gw = ph ? 5 : 8;
        var BX = gx + gw, BW = Wd - 2 * BX, BY = air, BH = Math.max(150, H - BY - ctl), y1 = BY + BH;
        var k = Math.min(BW / 322, BH / 192), half = Math.min(400, (Wd - (ph ? 64 : 150)) / 2);
        return { W: Wd, H: H, ph: ph, ex: ex, gx: gx, gw: gw, BX: BX, BY: BY, BW: BW, BH: BH, y1: y1, cx: Wd / 2, cy: BY + BH / 2 - (ph ? 10 : 4), k: k,
          pool: poolFor((BW - 24) / (BH - 28)), tx0: Wd / 2 - half, tx1: Wd / 2 + half, ty: y1 + (ph ? 50 : 50), fs: ph ? 13 : 15, fsS: ph ? 11.5 : 13 };
      }
      function pill(x, y, text, cls, anchor, fs){
        var w = text.length * fs * 0.56 + 18, h = fs + 10, x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
        return '<g class="os2-pill ' + cls + '"><rect x="' + n1(x0) + '" y="' + n1(y - h / 2) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="' + n1(h / 2) + '"/><text x="' + n1(x0 + w / 2) + '" y="' + n1(y + fs * 0.36) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(text) + '</text></g>';
      }
      function arrow(fx, fy, tx, ty, sw, cls){
        var ang = Math.atan2(ty - fy, tx - fx), hl = 7 + sw * 0.8, bx = tx - Math.cos(ang) * hl, by = ty - Math.sin(ang) * hl;
        return '<path class="' + cls + '" stroke-width="' + n1(sw) + '" d="M' + n1(fx) + ' ' + n1(fy) + 'L' + n1(bx) + ' ' + n1(by) + '"/>' +
          '<path class="' + cls + '-h" d="M' + n1(tx) + ' ' + n1(ty) + 'L' + n1(bx + Math.sin(ang) * hl * 0.75) + ' ' + n1(by - Math.cos(ang) * hl * 0.75) + 'L' + n1(bx - Math.sin(ang) * hl * 0.75) + ' ' + n1(by + Math.cos(ang) * hl * 0.75) + 'Z"/>';
      }
      /* What to draw now. Explore: the settled cell (or a frame of the replay). A challenge: its start (hidden),
         a frame of its timed run, or its end. */
      function sceneNow(){
        if(S.mode === 'explore'){
          var cell = cellNow(), r = resNow(), c = { outC: S.outC, outI: SOL.i, T: cell.sys.T };
          var sc = { sys: cell.sys, c: c, res: r, solute: SOL, view: 'result', W: view.W, lysed: view.lysed, bp: view.bp, debris: view.debris, strain: view.strain, dir: 'none', gap: 0,
            newCell: view.newUntil > now(), mark: view.play == null && !tw ? view.mark : null };
          if(view.play != null){
            var rp = replayNow();
            sc.view = 'live'; sc.replay = true; sc.debris = 0; sc.newCell = false; sc.W = rp.W; sc.lysed = rp.lysed; sc.bp = rp.bp; sc.strain = rp.strain; sc.gap = rp.gap; sc.dir = rp.dir || 'none'; sc.quiet = !rp.dir;
          } else {
            var fl = tw ? flowNow() : null;
            if(fl){ sc.view = 'live'; sc.dir = fl; sc.gap = Math.abs(r.psiO - M.osmosis.psiParts(cell.sys, c, view.W).psi); }
          }
          return sc;
        }
        if(!chal) return null;
        var i = clamp(Math.floor(chal.k), 0, NF), j = Math.min(NF, i + 1), ff = chal.k - i, a = chal.tr[i], b = chal.tr[j];
        var W2 = a.W + (b.W - a.W) * ff, ly2 = ff > 0.5 ? b.lysed : a.lysed, t = a.t + (b.t - a.t) * ff;
        var p2 = M.osmosis.psiParts(chal.sys, chal.c, W2), d2 = chal.r.psiO - p2.psi;
        return { sys: chal.sys, c: chal.c, res: chal.r, solute: chal.solute, view: chal.hide ? 'hide' : chal.playing ? 'live' : 'result', W: W2, lysed: ly2, bp: chal.playing ? chal.bp || 0 : 1, t: t, challenge: true,
          gap: Math.abs(d2), dir: ly2 || Math.abs(d2) < 0.05 ? 'none' : d2 > 0 ? 'in' : 'out' };
      }
      /* The scene that does not change with the control: the vessel of solution across the whole stage (air, a
         surface, depth), its glass, the bench it stands on and the control's own words. */
      function drawStatic(){
        var g = G, BX = g.BX, BY = g.BY, BW = g.BW, y1 = g.y1, R0 = BX + BW, p = [];
        p.push('<defs>' +
          '<linearGradient id="os2g-liq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="os2s-liq0"/><stop offset=".12" class="os2s-liq1"/><stop offset="1" class="os2s-liq2"/></linearGradient>' +
          '<linearGradient id="os2g-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="os2s-gl0"/><stop offset=".45" class="os2s-gl1"/><stop offset="1" class="os2s-gl0"/></linearGradient>' +
          '<linearGradient id="os2g-bench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="os2s-bn0"/><stop offset="1" class="os2s-bn1"/></linearGradient>' +
          '<radialGradient id="os2g-cyto" cx=".45" cy=".4" r=".75"><stop offset="0" class="os2s-cy0"/><stop offset="1" class="os2s-cy1"/></radialGradient>' +
          '<radialGradient id="os2g-vac" cx=".42" cy=".36" r=".8"><stop offset="0" class="os2s-va0"/><stop offset="1" class="os2s-va1"/></radialGradient>' +
          '<radialGradient id="os2g-rbc" cx=".5" cy=".5" r=".5"><stop offset="0" class="os2s-rb0"/><stop offset=".72" class="os2s-rb1"/><stop offset="1" class="os2s-rb2"/></radialGradient>' +
          '<radialGradient id="os2g-pal" cx=".5" cy=".5" r=".5"><stop offset="0" class="os2s-pa0"/><stop offset="1" class="os2s-pa1"/></radialGradient>' +
          '<radialGradient id="os2g-hb" cx=".5" cy=".5" r=".5"><stop offset="0" class="os2s-hb0"/><stop offset=".6" class="os2s-hb1"/><stop offset="1" class="os2s-hb2"/></radialGradient>' +
          '<radialGradient id="os2g-sol" cx=".35" cy=".3" r=".8"><stop offset="0" class="os2s-so0"/><stop offset="1" class="os2s-so1"/></radialGradient>' +
          '<clipPath id="os2c-liq"><path d="M' + n1(BX) + ' ' + n1(BY) + 'H' + n1(R0) + 'V' + n1(y1 - 12) + 'q0 12 -12 12H' + n1(BX + 12) + 'q-12 0 -12 -12Z"/></clipPath></defs>');
        // the bench the vessel stands on
        p.push('<rect class="os2-bench" x="0" y="' + n1(y1 + g.gw) + '" width="' + g.W + '" height="' + n1(g.H - y1 - g.gw) + '"/><path class="os2-benchedge" d="M0 ' + n1(y1 + g.gw + 0.5) + 'H' + g.W + '"/>');
        // the solution: a surface with a meniscus, lighter near the top, deeper below
        p.push('<path class="os2-sol" d="M' + n1(BX) + ' ' + n1(BY) + 'H' + n1(R0) + 'V' + n1(y1 - 12) + 'q0 12 -12 12H' + n1(BX + 12) + 'q-12 0 -12 -12Z"/>');
        p.push('<path class="os2-surface" d="M' + n1(BX) + ' ' + n1(BY - 5) + 'q4 6 18 6H' + n1(R0 - 18) + 'q14 0 18 -6V' + n1(BY + 9) + 'H' + n1(BX) + 'Z"/>');
        p.push('<path class="os2-menis" d="M' + n1(BX) + ' ' + n1(BY - 5) + 'q4 6 18 6H' + n1(R0 - 18) + 'q14 0 18 -6"/>');
        // the glass: two walls and a floor with thickness, a rolled rim and one long highlight
        var gy0 = Math.max(3, BY - (g.ph ? 19 : 28));
        p.push('<path class="os2-glass" d="M' + n1(g.gx) + ' ' + n1(gy0) + 'V' + n1(y1) + 'q0 ' + g.gw + ' ' + g.gw + ' ' + g.gw + 'H' + n1(R0) + 'q' + g.gw + ' 0 ' + g.gw + ' -' + g.gw + 'V' + n1(gy0) + 'h-' + g.gw + 'V' + n1(y1 - 12) + 'q0 12 -12 12H' + n1(BX + 12) + 'q-12 0 -12 -12V' + n1(gy0) + 'Z"/>');
        p.push('<path class="os2-rim" d="M' + n1(g.gx - 2) + ' ' + n1(gy0) + 'h' + (g.gw + 4) + 'M' + n1(R0 - 2) + ' ' + n1(gy0) + 'h' + (g.gw + 4) + '"/>');
        p.push('<path class="os2-shine" d="M' + n1(BX + 7) + ' ' + n1(BY + 16) + 'V' + n1(y1 - 30) + '"/>');
        if(g.ex){
          p.push(pill((g.tx0 + g.tx1) / 2, g.ty + 36, 'Solute outside', 'is-sol', 'middle', g.fs));
          p.push('<text class="os2-end" x="' + n1(g.tx0) + '" y="' + n1(g.ty + 40) + '" text-anchor="middle" style="font-size:' + g.fsS + 'px">0</text><text class="os2-end" x="' + n1(g.tx1) + '" y="' + n1(g.ty + 40) + '" text-anchor="middle" style="font-size:' + g.fsS + 'px">' + F(EX.outside.max, 1) + ' M</text>');
        }
        gStatic.innerHTML = p.join('');
      }
      function draw(){
        if(!G) return;
        var sc = sceneNow(); if(!sc) return;
        var sy = sc.sys, c = sc.c, k = G.k, cx = G.cx, cy = G.cy + (sy.kind === 'bag' ? 8 * k : 0), o = shape(sy, sc.W, sc.lysed, sc.bp, sc.strain), hide = sc.view === 'hide', bpN = sc.lysed ? (sc.bp == null ? 1 : sc.bp) : 0;
        var BX = G.BX, BY = G.BY, BW = G.BW, BH = G.BH, y1 = G.y1, R0 = BX + BW, p = [];
        // solute outside: one particle per bit of concentration, so crowding can be compared with the inside
        var POOL = G.pool, osmO = c.outC * c.outI, area = BW * BH / (k * k), nOut = Math.min(POOL.length, Math.round(osmO * KD * area)), dr = n1(Math.max(2.6, 2.9 * Math.sqrt(k))), dots = [];
        for(var i = 0; i < nOut; i++){
          var qx = BX + 12 + POOL[i][0] * (BW - 24), qy = BY + 16 + POOL[i][1] * (BH - 28), exx = (qx - cx - (o.pcx || 0) * k) / (((o.px || o.ex) + 5) * k), eyy = (qy - cy - (o.pcy || 0) * k) / (((o.py || o.ey) + 5) * k);
          var rr = exx * exx + eyy * eyy;
          if(rr < 1.12 * (1 - bpN) * (1 - bpN)) continue;
          if(o.px){ var wx = (qx - cx) / ((o.ex + 4) * k), wy = (qy - cy) / ((o.ey + 4) * k), wr2 = wx * wx + wy * wy; if(wr2 > 0.5 && wr2 < 1.32) continue; } // not on the wall itself
          dots.push('<circle cx="' + n1(qx) + '" cy="' + n1(qy) + '" r="' + dr + '"/>');
        }
        p.push('<g class="os2-dots" clip-path="url(#os2c-liq)">' + dots.join('') + '</g>');
        var deb = sc.debris > 0 ? sc.debris : 0, body = o.parts.join(''), o1 = shape(sy, 1, false), nInD = Math.min(90, Math.round((sy.kind === 'bag' ? c.inC * (c.inI || 1) : sy.osmIn) * KD * Math.PI * o1.inner.x * o1.inner.y));
        if(deb){ // the burst cell fades as a new cell goes in
          var od = shape(sy, 1.9, true, 1), sp0 = [];
          for(var q0 = 0; q0 < nInD; q0++){ var qd = od.dot(q0, nInD); sp0.push('<circle cx="' + n1(cx + qd[0] * k) + '" cy="' + n1(cy + qd[1] * k) + '" r="' + dr + '"/>'); }
          p.push('<g clip-path="url(#os2c-liq)" opacity="' + deb.toFixed(2) + '"><g transform="translate(' + n1(cx) + ' ' + n1(cy) + ') scale(' + k.toFixed(3) + ')">' + od.parts.join('') + '</g><g class="os2-dots is-in">' + sp0.join('') + '</g></g>');
        }
        p.push('<g class="os2-cell" clip-path="url(#os2c-liq)" opacity="' + (1 - deb).toFixed(2) + '"><g transform="translate(' + n1(cx) + ' ' + n1(cy) + ') scale(' + k.toFixed(3) + ')">' + body + '</g></g>');
        // solute inside: a fixed amount, crowded as the specimen shrinks, spilled when it has burst
        var nIn = nInD, ind = [];
        for(var j = 0; j < nIn; j++){
          var dp = o.dot ? o.dot(j, nIn) : [(o.inner.ox || 0) + Math.cos(j * 2.39996 + 0.6) * Math.sqrt((j + 0.5) / nIn) * 0.9 * o.inner.x, (o.inner.oy || 0) + Math.sin(j * 2.39996 + 0.6) * Math.sqrt((j + 0.5) / nIn) * 0.9 * o.inner.y];
          ind.push('<circle cx="' + n1(cx + dp[0] * k) + '" cy="' + n1(cy + dp[1] * k) + '" r="' + dr + '"/>');
        }
        p.push('<g class="os2-dots is-in" opacity="' + (1 - deb).toFixed(2) + '">' + ind.join('') + '</g>');
        // water, only while it is moving: arrows as wide as the water potential gap, with drops running along them
        var live = sc.view === 'live' && !sc.lysed && !sc.quiet, still = !live && !!sc.mark && !hide, dir = live ? sc.dir : still ? sc.mark : 'none', sw = (still ? 6 : 3 + Math.min(11, sc.gap * 0.7)) * clamp(k, 0.85, 1.5);
        if(live || still) [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function(d, n){
          if(n === 2 && o.noTop) return;
          var ax0 = cx + d[0] * (o.ex * k + 44 + sw), ay0 = cy + d[1] * (o.ey * k + 38 + sw), ax1 = cx + d[0] * (o.ex * k + 9), ay1 = cy + d[1] * (o.ey * k + 7);
          if(n > 1){ var lim = n === 2 ? BY + 12 : y1 - G.fs - 32; if(n === 2 ? ay0 < lim : ay0 > lim) ay0 = lim; if(Math.abs(ay1 - ay0) < 18) return; }
          if(dir === 'none'){ p.push('<path class="os2-eq" d="M' + n1(ax0) + ' ' + n1(ay0) + 'L' + n1(ax1) + ' ' + n1(ay1) + '"/>'); return; }
          var inn = dir === 'in', fx = inn ? ax0 : ax1, fy = inn ? ay0 : ay1, tx = inn ? ax1 : ax0, ty = inn ? ay1 : ay0;
          p.push(arrow(fx, fy, tx, ty, sw, 'os2-flow'));
          if(live && !K.reduced()){ var phs = ((sc.challenge ? chal.clock || 0 : view.clock) / 620) % 1; for(var w = 0; w < 3; w++){ var u = (phs + w / 3) % 1; p.push('<circle class="os2-w" cx="' + n1(fx + (tx - fx) * u * 0.8) + '" cy="' + n1(fy + (ty - fy) * u * 0.8) + '" r="' + n1(2.4 + sw * 0.14) + '"/>'); } }
        });
        if(live || still){ var wt = dir === 'none' ? 'no net movement' : still ? 'water moved ' + dir : 'water moving ' + dir; p.push(pill(R0 - 14, BY + 20 + G.fs * 0.5, wt, 'is-water', 'end', G.fsS)); }
        else if(sc.challenge && !hide && !sc.lysed && sc.dir === 'none') p.push(pill(R0 - 14, BY + 20 + G.fs * 0.5, 'no net movement', 'is-water', 'end', G.fsS));
        // the wall pushing back (a turgid plant cell), and the names of the two layers once they separate
        if(sy.kind === 'plant' && !hide && o.wallAt){
          var pp2 = M.osmosis.psiParts(sy, c, sc.W);
          if(pp2.psiP > 0.3 && (sc.challenge || sc.W - sy.W0 >= 0.6 * (Math.max(sc.res.W, sc.W) - sy.W0))){
            var len = 8 + Math.min(12, pp2.psiP * 1.7);
            [0.72, 2.42, 3.86, 5.56].forEach(function(a){ var q0 = o.wallAt(a, -4), q1 = o.wallAt(a, -4 - len); p.push(arrow(cx + q0[0] * k, cy + q0[1] * k, cx + q1[0] * k, cy + q1[1] * k, 3, 'os2-push')); });
            var wq = o.wallAt(0.72, 8); p.push(pill(Math.min(cx + wq[0] * k + 4, R0 - 8 - 17 * G.fsS * 0.56 - 18), cy + wq[1] * k + G.fsS, 'wall pushes back', 'is-wall', 'start', G.fsS));
          }
          if(o.gap){
            var w1 = o.wallAt(3.9, -2), w2 = o.wallAt(3.9, 16), m1 = o.at(2.5), m2 = o.wallAt(2.5, 16);
            p.push('<path class="os2-lead" d="M' + n1(cx + w1[0] * k) + ' ' + n1(cy + w1[1] * k) + 'L' + n1(cx + w2[0] * k) + ' ' + n1(cy + w2[1] * k) + 'M' + n1(cx + m1[0] * k) + ' ' + n1(cy + m1[1] * k) + 'L' + n1(cx + m2[0] * k) + ' ' + n1(cy + m2[1] * k) + '"/>');
            p.push(pill(Math.max(BX + 8 + 4 * G.fsS * 0.56 + 18, cx + w2[0] * k), cy + w2[1] * k - G.fsS * 0.6, 'wall', 'is-wall', 'end', G.fsS));
            p.push(pill(Math.max(BX + 8 + 8 * G.fsS * 0.56 + 18, cx + m2[0] * k), cy + m2[1] * k + G.fsS * 0.6, 'membrane', 'is-ink', 'end', G.fsS));
          }
        }
        // the solution's name, and the cell's state
        var now = sc.challenge ? (sc.lysed ? { lysed: true, state: 'lysed', startDir: sc.res.startDir } : M.osmosis.simulate(sy, Object.assign({}, c, { t: sc.t }))) : null;
        var topTxt = sc.challenge ? F(c.outC, 2) + ' M ' + sc.solute.name : tonicity(sc.res);
        p.push(pill(BX + 16, BY + 20 + G.fs * 0.5, topTxt, 'is-sol is-big', 'start', G.fs));
        var shown = stateShown(sy, sc.W, sc.lysed, sc.lysed ? bpN : 0, sc.challenge ? null : sc.res.W), stTxt = hide ? 'Predict first' : !shown ? '' : sc.challenge ? short(shown) : shown === 'lysed' ? 'Burst (lysed)' : short(shown);
        if(stTxt) p.push('<g class="os2-statep" data-state="' + (hide ? '' : shown) + '">' + pill(cx, y1 - 14 - G.fs * 0.5, stTxt, sc.lysed && !hide ? 'is-bad is-big' : 'is-ink is-big', 'middle', G.fs) + '</g>');
        if(sc.newCell) p.push(pill(cx, Math.max(BY + 24 + G.fs, cy - o.ey * k - 20), 'new cell', 'is-ink', 'middle', G.fsS));
        if(sc.challenge){
          var nm = sy.kind === 'plant' ? 'potato cell' : sy.kind === 'animal' ? 'red blood cell' : 'dialysis bag, ' + F(c.inC, 2) + ' M sucrose inside';
          p.push('<text class="os2-name" x="' + n1(G.W / 2) + '" y="' + n1(y1 + G.gw + 21) + '" text-anchor="middle" style="font-size:' + G.fsS + 'px">' + esc(nm) + '</text>');
        } else if(prev && prev.tab === S.tab && prev.outC !== S.outC && !sc.replay){
          // the setting before this change: a mark on the track (a mark, never a moved handle)
          var bxp = G.tx0 + (G.tx1 - G.tx0) * (prev.outC / EX.outside.max);
          var kx = G.tx0 + (G.tx1 - G.tx0) * (S.outC / EX.outside.max);
          p.push('<path class="os2-mark" d="M' + n1(bxp) + ' ' + n1(G.ty - 9) + 'V' + n1(G.ty + 9) + '"/>' + (Math.abs(bxp - kx) > 58 ? '<text class="os2-markt" x="' + n1(bxp) + '" y="' + n1(G.ty - 13) + '" text-anchor="middle" style="font-size:' + (G.fsS - 1) + 'px">before</text>' : ''));
        }
        gDyn.innerHTML = p.join('');
        var al = sc.challenge ? (hide ? sy.name + ' about to go into ' + F(c.outC, 2) + ' M ' + sc.solute.name + '. Make your prediction, then run it.'
            : sy.name + ' in ' + F(c.outC, 2) + ' M ' + sc.solute.name + ', at ' + td(sy, sc.t) + ' of ' + dur(sy, c.t) + ': ' + stTxt + '. Net water movement is ' + (sc.dir === 'in' ? 'into it' : sc.dir === 'out' ? 'out of it' : 'zero') + '.')
          : 'A ' + (sy.kind === 'plant' ? 'plant cell' : 'red blood cell') + ' in a beaker of ' + F(c.outC, 2) + ' molar ' + sc.solute.name + '. ' + stateLine(sc.res) + ' ' + cause.text();
        if(draw.al !== al){ draw.al = al; svg.setAttribute('aria-label', al); }
        if(sc.challenge) clock.textContent = hide ? '' : clockText(sy, sc.t, c.t);
      }
      function layoutNow(){
        if(stage.hidden) return;
        var r = sceneBox.getBoundingClientRect(), Wd = Math.max(280, Math.round(r.width)), H = Math.max(260, Math.round(r.height));
        svg.setAttribute('viewBox', '0 0 ' + Wd + ' ' + H); svg.setAttribute('width', Wd); svg.setAttribute('height', H);
        G = geo(Wd, H);
        cSol.place([G.tx0, G.ty, G.tx1, G.ty]);
        drawStatic(); draw();
        if(cue.active()) cue.place();
      }

      /* ---------------------------------------------------- "?": the numbers behind this setting */
      var ref = document.createElement('div'); ref.className = 'ls-sec os2-ref';
      function refHtml(){
        var cell = cellNow(), sy = cell.sys, r = resNow(), Kk = sy.T + M.K0, plant = sy.kind === 'plant';
        var curve = [], n = Math.round(EX.outside.max / EX.outside.step), rows = [];
        for(var i = 0; i <= n; i++){ var C = M.round(i * EX.outside.step, 2), x = eq(cell, C); if(!x.lysed) curve.push([C, x.pct]); if(i % 2 === 0) rows.push([F(C, 2), x.lysed ? 'burst' : F(x.pct, 1), F(x.psiO, 2), esc(x.lysed ? 'Burst (lysed)' : short(x.state))]); }
        var big = Math.max.apply(null, curve.map(function(q){ return Math.abs(q[1]); }).concat([5])), ym = T.niceMax(big * 1.1);
        ref.innerHTML = '<p class="os2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>' +
          '<h3 class="ls-title-l">This setting: ' + esc(cell.tab.toLowerCase()) + ' in ' + F(S.outC, 2) + ' M ' + esc(SOL.name) + ', ' + sy.T + ' °C</h3>' +
          '<dl class="bt-readout"><div><dt>ψ outside</dt><dd>' + F(r.psiO, 2) + ' bar</dd></div><div><dt>ψ in the cell, at first</dt><dd>' + F(r.start.psi, 2) + ' bar</dd></div>' +
          '<div><dt>ψ in the cell, settled</dt><dd>' + (r.lysed ? 'burst' : F(r.end.psi, 2) + ' bar') + '</dd></div>' + (plant ? '<div><dt>Pressure on the wall, ψp</dt><dd>' + F(r.end.psiP, 2) + ' bar</dd></div>' : '') +
          '<div><dt>Solution</dt><dd>' + tonicity(r) + '</dd></div><div><dt>Cell</dt><dd>' + esc(stateWord(r)) + '</dd></div></dl>' +
          '<p class="bt-eq">Beaker: ψ = ψs = −iCRT = −(' + SOL.i + ')(' + F(S.outC, 2) + ' mol/L)(0.0831 L·bar/(mol·K))(' + Kk + ' K) = ' + F(r.psiO, 2) + ' bar</p>' +
          '<p class="bt-eq">Cell at first: ψs = −(' + F(sy.osmIn, 2) + ' osmol/L)(0.0831)(' + Kk + ') = ' + F(r.start.psiS, 2) + ' bar; ψp = ' + F(r.start.psiP, 2) + ' bar; ψ = ψs + ψp = ' + F(r.start.psi, 2) + ' bar</p>' +
          '<p class="bt-small">Water moves from higher (less negative) to lower (more negative) water potential until the two are equal. <a class="os2-calc" href="water-potential.html">Practice the calculation: water potential <span aria-hidden="true">→</span></a></p>' +
          '<h3 class="ls-title-l">The three words</h3><ul class="os2-words"><li><b>Hypotonic</b> solution: less solute than the cell. Water moves in.</li><li><b>Isotonic</b> solution: the same solute concentration as the cell. No net water movement.</li><li><b>Hypertonic</b> solution: more solute than the cell. Water moves out.</li></ul>' +
          '<h3 class="ls-title-l">The lab graph: mass change against the solution</h3>' +
          T.plot({ title: 'Graph of percent mass change of the ' + cell.tab.toLowerCase() + ' once it settles, against ' + SOL.name + ' concentration in the beaker from 0 to ' + EX.outside.max + ' M.' + (curve.length <= n ? ' Where the cell bursts no mass is shown.' : '') + ' The table below lists the values.',
            x: { label: SOL.name + ' in the beaker', unit: 'M', min: 0, max: EX.outside.max, step: 0.2 }, y: { label: 'Mass change', unit: '%', min: -ym, max: ym, step: T.niceStep(2 * ym, 6) },
            curves: [{ points: curve, cls: 's1' }], points: r.lysed ? [] : [{ x: S.outC, y: r.pct, cls: 's1 os-now', square: true }], vline: { x: S.outC } }) +
          T.dataTable(['Beaker (M ' + esc(SOL.name) + ')', 'Mass change (%)', 'ψ of the beaker (bar)', 'Cell'], rows, 'The curve, sampled') +
          '<p class="bt-small">' + esc(EX.note) + '</p>';
      }
      ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(ctx.studio) ctx.studio.close(); if(S.mode !== 'explore' && ctx.studio && ctx.studio.kit2) ctx.studio.kit2.go('explore'); setTimeout(startTour, 60); });

      /* ---------------------------------------------------- Test yourself: predict, then run */
      var chal = null, chalN = 0, chalSeed = 1 + Math.floor(Math.random() * 99999), anim = 0;
      var dock = document.createElement('div'); dock.className = 'os2-predict';
      dock.innerHTML = '<div class="os-chal"></div><div class="os2-go"><button type="button" class="btn-press sm os-go">Run it and check</button></div>';
      var chalBox = dock.querySelector('.os-chal'), goBtn = dock.querySelector('.os-go'), goWrap = dock.querySelector('.os2-go');
      var DIRS = [['in', 'Into it'], ['out', 'Out of it'], ['none', 'No net movement']];
      var STATES = { plant: ['turgid', 'flaccid', 'plasmolyzed'], animal: ['normal', 'swollen', 'shriveled', 'lysed'], bag: ['swollen', 'unchanged', 'shrunken'] };
      function stopAnim(){ if(anim){ cancelAnimationFrame(anim); anim = 0; } if(chal) chal.playing = false; }
      /* A challenge whose answer is clear: nothing near a state boundary. */
      function makeChallenge(){
        var want = location.hash.replace(/^#predict-?/, '');
        for(var tries = 0; tries < 400; tries++){
          var g = M.rng(chalSeed + 7919 * (chalN * 400 + tries));
          var sy = (chalN === 0 && sysById(want)) || data.systems[chalN % data.systems.length];   // a deep link's specimen is the first challenge, whatever the draw
          var so = g.pick(data.solutes), C = M.round(g.int(0, Math.round(data.outside.max / data.outside.step)) * data.outside.step, 2);
          var inC = sy.kind === 'bag' ? M.round(g.int(2, Math.round(data.inside.max / data.inside.step)) * data.inside.step, 2) : data.inside.value;
          if(sy.kind === 'bag'){ so = data.solutes[0]; if(g() < 0.3) C = inC; } // real tubing lets NaCl through, so bag challenges use sucrose only
          var c = { outC: C, outI: so.i, inC: inC, inI: 1, T: sy.defaults.T, t: sy.time.value };
          var r = M.osmosis.simulate(sy, c), gap = Math.abs(r.psiO - r.start.psi);
          if(!(gap < 0.01 || gap > 1.2)) continue;
          if(r.startDir !== 'none' && (r.state === 'unchanged' || r.state === 'normal' || r.state === 'flaccid')) continue; // water moves but the size barely changes: not clear cut
          var ok = [-0.04, 0.04].every(function(d){ var c2 = Object.assign({}, c, { outC: Math.max(0, C + d) }); return M.osmosis.simulate(sy, c2).state === r.state; });
          if(!ok && gap >= 0.01) continue;
          return { sys: sy, solute: so, c: c, r: r };
        }
        return null;
      }
      function why(r, sy, c){
        var o = F(r.psiO, 2), i0 = F(r.start.psi, 2), i1 = F(r.end.psi, 2), gap = Math.abs(r.psiO - r.end.psi);
        var hd = r.startDir === 'none' ? 'ψ outside (' + o + ' bar) equals ψ inside (' + i0 + ' bar): water crosses both ways at the same rate, so there is no net movement. '
          : 'Water moves from higher to lower water potential: ψ outside is ' + o + ' bar and ψ inside starts at ' + i0 + ' bar, so net water moves ' + (r.startDir === 'in' ? 'in. ' : 'out. ');
        var body = '';
        if(r.lysed) body = 'With no wall, ψp stays 0, so only diluting the cytoplasm could raise its ψ. It would have to swell past ' + F(sy.lyseAt, 2) + '× its volume first, so the membrane tears: the cell lyses.';
        else if(sy.kind === 'plant'){
          if(r.state === 'turgid' && r.startDir === 'out') body = 'The cell loses a little water but stays pressed on its wall: ψp falls to ' + F(r.end.psiP, 2) + ' bar, which lowers ψ inside to ' + i1 + ' bar.';
          else if(r.state === 'turgid') body = 'As the cell fills, the wall pushes back: ψp rises to ' + F(r.end.psiP, 2) + ' bar, which lifts ψ inside to ' + i1 + ' bar. The wall, not the solute, stops the intake, so the cell stays whole.';
          else if(r.state === 'plasmolyzed') body = 'The cell loses water, its push on the wall (ψp) falls to 0, and the membrane pulls away from the wall. The gap fills with the outside solution, because the wall lets it through.';
          else body = 'The cell barely changes: ψp is about 0, so the cell is flaccid, neither pressing on its wall nor pulled away.';
        } else if(sy.kind === 'animal') body = r.state === 'swollen' ? 'Water dilutes the cytoplasm until its ψs matches the outside. No wall pushes back, so the cell swells but has not burst.'
          : r.state === 'shriveled' ? 'Losing water concentrates the cytoplasm until its ψ matches the outside; the shrinking membrane crinkles (crenation).' : 'The cell keeps its normal shape: the solution is about isotonic.';
        else body = r.startDir === 'none' ? 'The bag keeps its size.' : 'Sucrose cannot cross in this model, so only water moves: toward the side with more solute. ' + (r.end.psiP > 0.01 ? 'The bag fills until the tubing is tight and its pressure (ψp ' + F(r.end.psiP, 2) + ' bar) helps stop the intake.' : '');
        var tail = !r.lysed && !r.equilibrium ? ' Not at equilibrium yet after ' + dur(sy, c.t) + ': ψ still differs by ' + F(gap, 2) + ' bar, so the arrows have not thinned to nothing.' : (!r.lysed && r.startDir !== 'none' ? ' Now ψ inside equals ψ outside, so the arrows have thinned to nothing: no net flow.' : '');
        return hd + body + tail;
      }
      function showChallenge(){
        stopAnim();
        var c0 = makeChallenge(); chalN++;
        if(!c0) return;
        chal = c0; chal.tr = M.osmosis.trajectory(chal.sys, chal.c, NF); chal.k = 0; chal.hide = true; chal.done = false;
        var sy = chal.sys, id = 'os-c' + chalN;
        chalBox.innerHTML = '<p class="os-chal-q"><b>Challenge ' + chalN + '.</b> ' + esc(sy.name) + (sy.kind === 'bag' ? ' holding ' + F(chal.c.inC, 2) + ' M sucrose' : '') + ' goes into <b>' + F(chal.c.outC, 2) + ' M ' + esc(chal.solute.name) + '</b> at ' + chal.c.T + ' °C for ' + dur(sy, chal.c.t) + '.' + (sy.kind === 'plant' ? ' Its cell sap is about ' + F(sy.osmIn, 2) + ' osmol/L.' : sy.kind === 'animal' ? ' Its cytoplasm is about ' + F(sy.osmIn, 2) + ' osmol/L.' : '') + '</p>' +
          '<fieldset class="os-ask"><legend>1. At the start, net water moves…</legend>' + DIRS.map(function(d, i){ return '<div class="bt-radio"><input type="radio" name="' + id + 'd" id="' + id + 'd' + i + '" value="' + d[0] + '"><label for="' + id + 'd' + i + '">' + d[1] + '</label></div>'; }).join('') + '</fieldset>' +
          '<fieldset class="os-ask"><legend>2. After ' + dur(sy, chal.c.t) + ' it will be…</legend>' + STATES[sy.kind].map(function(k, i){ return '<div class="bt-radio"><input type="radio" name="' + id + 's" id="' + id + 's' + i + '" value="' + k + '"><label for="' + id + 's' + i + '">' + esc(STATE[k]) + '</label></div>'; }).join('') + '</fieldset>' +
          '<p class="os2-hint bt-small">Hint: compare ψ = −iCRT outside with ψ inside.</p><div class="os-chal-fb" role="status" aria-live="polite"></div>';
        goBtn.textContent = 'Run it and check'; goBtn.disabled = false; goWrap.hidden = false;
        draw();
      }
      function playRun(done){
        stopAnim();
        if(K.reduced() || !window.requestAnimationFrame){ chal.k = NF; chal.hide = false; draw(); if(done) done(); return; }
        var t0 = null, dur = 3200, lyT = null; chal.hide = false; chal.playing = true; chal.bp = 0;
        function step(ts){
          if(t0 == null) t0 = ts;
          var f = Math.min(1, (ts - t0) / dur);
          chal.k = NF * Math.pow(f, 2.2); chal.clock = ts; // slow start: most water moves early
          if(chal.tr[Math.min(NF, Math.round(chal.k))].lysed){ if(lyT == null) lyT = ts; chal.bp = Math.min(1, (ts - lyT) / 850); }
          if(f < 1 || (lyT != null && chal.bp < 1)){ draw(); anim = requestAnimationFrame(step); }
          else { anim = 0; chal.playing = false; chal.k = NF; draw(); if(done) done(); }
        }
        anim = requestAnimationFrame(step);
      }
      /* On a phone the question fills the screen and the picture is below it: bring the picture into view for the run. */
      function toScene(){
        var b = sceneBox.getBoundingClientRect(), vh = window.innerHeight || 800;
        if(b.top >= 0 && b.bottom <= vh) return false;
        try{ sceneBox.scrollIntoView({ block: 'center', behavior: K.reduced() ? 'auto' : 'smooth' }); }catch(e){ return false; }
        return true;
      }
      function submitPrediction(){
        var d = chalBox.querySelector('input[name$="d"]:checked'), s = chalBox.querySelector('input[name$="s"]:checked');
        var fb = chalBox.querySelector('.os-chal-fb');
        if(!d || !s){ fb.textContent = 'Pick an answer for both parts first.'; return; }
        chal.done = true;
        chalBox.querySelectorAll('input').forEach(function(x){ x.disabled = true; });
        goBtn.disabled = true;
        var r = chal.r, sy = chal.sys, okD = d.value === r.startDir, okS = s.value === r.state, cc = chal;
        var away = toScene();
        setTimeout(function(){ if(chal === cc) playRun(function(){
          if(chal !== cc) return;
          goBtn.disabled = false; goWrap.hidden = true;
          var dirWord = { in: 'into it', out: 'out of it', none: 'no net movement' }, hint = chalBox.querySelector('.os2-hint');
          if(hint) hint.hidden = true;
          fb.innerHTML = '<p><span class="bio-mark ' + (okD ? 'ok">Right' : 'no">Not quite') + '</span> Direction: ' + dirWord[r.startDir] + '. <span class="bio-mark ' + (okS ? 'ok">Right' : 'no">Not quite') + '</span> End state: ' + esc(STATE[r.state]) + '.</p><p>' + esc(why(r, sy, cc.c)) + '</p>' +
            '<div class="bt-actions"><button type="button" class="btn-press sm os-next">Next challenge</button><button type="button" class="bt-btn os2-replay">Replay</button>' + T.report(SLUG + ':predict-' + sy.id) + '</div>';
          fb.querySelector('.os2-replay').addEventListener('click', function(){ var aw = toScene(); setTimeout(function(){ if(chal === cc) playRun(); }, aw ? 450 : 0); });
          if(away) setTimeout(function(){ try{ fb.scrollIntoView({ block: 'start', behavior: K.reduced() ? 'auto' : 'smooth' }); }catch(e){} }, 900);
          fb.querySelector('.os-next').addEventListener('click', function(){ showChallenge(); var q = chalBox.querySelector('.os-chal-q'); q.setAttribute('tabindex', '-1'); q.focus(); });
          T.record(SLUG, [
            { id: SLUG + ':predict-' + sy.id + ':dir', correct: okD, topic: data.topic, level: 'apply', diff: 2, group: 'predict' },
            { id: SLUG + ':predict-' + sy.id + ':state', correct: okS, topic: data.topic, level: 'analyze', diff: 2, group: 'predict' }
          ]);
        }); }, away ? 450 : 0);
      }
      goBtn.addEventListener('click', function(){ if(chal && !chal.done) submitPrediction(); });

      /* ---------------------------------------------------- the two modes (the adapter calls shown) */
      function shown(mode, part){
        S.mode = mode; S.part = part;
        player.stop(); view.play = null; stopTween(); stopAnim(); tour.stop();
        var ex = mode === 'explore';
        stage.setAttribute('data-view', ex ? 'explore' : 'predict');
        tabs.el.hidden = !ex; head.el.hidden = !ex; cause.el.hidden = !ex; player.el.hidden = !ex; clock.hidden = ex; cSol.hide(!ex);
        if(ex){ prev = null; gest = false; took = false; clearMarks(); snap(); wKey = ''; syncWords(); refHtml(); }
        else { hideCue(false); if(part === 'predict' && (!chal || chal.done)) showChallenge(); }
        if(mode === 'quiz' && part !== 'predict') return;
        setTimeout(function(){ layoutNow(); if(ex && !tour.active()) cue.show(); }, 30);
      }
      ctx.kit2 = { stage: stage, ref: ref, questionsLabel: 'Potato core questions',
        parts: [{ value: 'predict', label: 'Predict, then run', dock: dock, task: { kicker: 'Predict, then run', title: 'What will the water do?', todo: 'Answer both parts, then run it to check.' } }],
        onShow: function(m, p){ shown(m, p); } };
      snap(); words(); refHtml();
      T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
      if(data.frq) T.frq(app, data.frq, SLUG);
      // Without the frame (no Tool Studio on the page) the stage still works on its own, above the questions.
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); stage.appendChild(dock); dock.hidden = true; shown('explore', null); }
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(layoutNow, 50); }).observe(sceneBox); }
      else window.addEventListener('resize', layoutNow);
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApBioBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var l2 = document.createElement('link'); l2.rel = 'stylesheet'; l2.href = (window.ApBioBase || '../') + 'assets/tools/osmosis.css'; document.head.appendChild(l2);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
