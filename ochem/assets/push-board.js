/* The electron pushing board, shared by the Organic Chemistry tools v2 that move electrons on a molecule
   (Resonance: docs/tools-v2-resonance-brief.md; Arrow Pusher: docs/tools-v2-arrow-pusher-brief.md). One look and one
   feel for both: a ball and stick molecule on a lit wall, lone pairs as two violet dots in a glow, a π bond as a
   violet second stick, a charge as a red or blue glow with a badge; the student grabs electrons and drags them, a
   curved arrow follows from where they were, the nearest target that makes sense lights (forgiving), and on release
   the pair either glides into place or springs back along a red arrow.

   The class names (rs2-*) and the gradient ids (rs2g-*) are the ones Resonance first used; the colours are in
   ochem/assets/tools/push-board.css (on the root: class "pb2").

   window.OchemPushBoard
     Pure helpers (no page):  heavy, fc, bondKey, sign, sixRings, labelOf, flatLabel, angDist, slots, piSide, fitT, P,
                              radiusOf, draw, pairHtml, fitFlat, drawFlat, rawPos, anchorOf, bez, arrowPath, segDist,
                              lerpP, ease, seg, f1, esc, defs()
     board(ctx) -> the parts that touch the picture, bound to one svg:
       ctx = { svg, G: { mainA, mainB, arrows, fly, ui }, labsEl, waitEls: [els], reduced(), T(), A(), shown(),
               noCharge(st) -> [atom keys whose charge is not drawn], calm: [els] }
       curve(a, b), arrowHtml(ar, A, cls), tween(ms, fn, done), stopTween(), busy(), moveElectrons(from, to, arrows,
       o, done), springBack(fromPt, toPt, done), startDragVis(d), paintDrag(d, kindOf), endDragVis(keep),
       sourceAt(pt, o), targetsFor(src), snap(src, pt, list, rankOf), norm(st, key)

   draw(st, T, o): o.pieces { atomKey: piece index } groups every drawn part of an atom (and the bonds inside one
   piece) in <g data-p="i">, one per layer, and draws bonds between pieces as lines with data-l="a|b", so a step that
   moves whole fragments (a leaving group drifting off, a nucleophile coming in) can slide them without redrawing. */
(function(){
  var C = window.OchemChem;
  if(!C || window.OchemPushBoard) return;

  function f1(x){ return Math.round(x * 10) / 10; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function heavy(st, k){ var a = st.atoms[k]; return a && a.el && a.el !== 'H'; }
  // heavy, or (g) a group drawn as one unit (Et, OEt): the small drawings of Arrow Pusher draw those too
  function hvy(st, k, g){ return heavy(st, k) || !!(g && st.atoms[k] && st.atoms[k].group); }
  function fc(st, k){ var a = st.atoms[k]; return a && a.el && !a.group ? C.formalCharge(st, k) : 0; }
  function bondKey(b){ return 'bond:' + b.a + '-' + b.b; }
  function sign(q){ return q < 0 ? (q === -1 ? '−' : -q + '−') : (q === 1 ? '+' : q + '+'); }

  /* Rings of six heavy atoms (benzene, phenoxide, the benzyl cation). */
  function sixRings(st){
    var adj = {}, out = [], seen = {};
    Object.keys(st.atoms).forEach(function(k){ if(heavy(st, k)) adj[k] = C.neighbors(st, k).filter(function(n){ return heavy(st, n); }); });
    Object.keys(adj).forEach(function(s){
      (function walk(path){
        var last = path[path.length - 1];
        adj[last].forEach(function(n){
          if(path.length === 6){ if(n === s){ var id = path.slice().sort().join(','); if(!seen[id]){ seen[id] = 1; out.push(path.slice()); } } return; }
          if(path.indexOf(n) < 0 && n > s) walk(path.concat([n]));
        });
      })([s]);
    });
    return out;
  }

  /* A transform that fits a structure's atoms (with room for lone pairs and charges) into a region. o.flat: heavy
     atoms only. o.keys: fit these atoms (e.g. the union of every state of a mechanism, passed as a structure). */
  function fitT(st, box, opts){
    opts = opts || {};
    var ks = Object.keys(st.atoms).filter(function(k){ return opts.flat ? hvy(st, k, opts.groups) : true; });
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    ks.forEach(function(k){ var a = st.atoms[k]; x0 = Math.min(x0, a.x); x1 = Math.max(x1, a.x); y0 = Math.min(y0, a.y); y1 = Math.max(y1, a.y); });
    if(opts.extra) opts.extra.forEach(function(a){ x0 = Math.min(x0, a.x); x1 = Math.max(x1, a.x); y0 = Math.min(y0, a.y); y1 = Math.max(y1, a.y); });
    // sizes are set from the bond length, so a structure drawn at another scale (Build your own) looks the same
    var bl = st.bonds.filter(function(b){ return b.order > 0 && heavy(st, b.a) && heavy(st, b.b); }).map(function(b){ var a = st.atoms[b.a], z = st.atoms[b.b]; return Math.hypot(z.x - a.x, z.y - a.y); }).sort(function(a, b){ return a - b; });
    var u = bl.length ? bl[Math.floor(bl.length / 2)] / 70 : 1;
    var m = (opts.margin == null ? 34 : opts.margin) * u;
    var bw = x1 - x0 + m * 2, bh = y1 - y0 + m * 2;
    var s = Math.min(box.w / bw, box.h / bh, (opts.cap || 2.1) / u);
    return { s: s, k: s * u, ox: box.x + box.w / 2 - (x0 + x1) / 2 * s, oy: box.y + box.h / 2 - (y0 + y1) / 2 * s };
  }
  function P(T, a){ return [T.ox + a.x * T.s, T.oy + a.y * T.s]; }

  var BALL = { C:'c', H:'h', O:'o', N:'n' };
  function labelOf(st, k){
    var a = st.atoms[k];
    if(!a.el || a.group || a.el === 'H') return a.label;
    var h = (a.hImplicit || 0);
    if(!h) return a.el;
    return a.el + 'H' + (h > 1 ? '₀₁₂₃₄'[h] : '');
  }
  function radiusOf(st, k, T){
    var a = st.atoms[k], base = a.el === 'H' ? 10 : 16.5;
    var lab = labelOf(st, k);
    // the smallest ball keeps its letters readable, but shrinks with a small drawing so balls never overlap
    var fl = Math.min(1, T.k / 1.1);
    return Math.max((a.el === 'H' ? 7.5 : 11.5) * fl, base * T.k * 0.8) * (lab.length > 2 ? 1.16 : lab.length > 1 ? 1.07 : 1);
  }
  // folded hydrogens, for the small drawings (explicit H atoms counted into the label); a halogen's H goes first (HBr)
  function flatLabel(st, k){
    var a = st.atoms[k];
    if(!a.el || a.group) return a.label;
    var h = (a.hImplicit || 0) + C.neighbors(st, k).filter(function(n){ return st.atoms[n].el === 'H'; }).length;
    if(a.el === 'C' && h === 0) return 'C';
    if(h && /^(F|Cl|Br|I)$/.test(a.el)) return 'H' + a.el;
    return a.el + (h ? 'H' + (h > 1 ? '₀₁₂₃₄'[h] : '') : '');
  }
  function angDist(a, b){ var d = Math.abs(a - b) % (Math.PI * 2); return d > Math.PI ? Math.PI * 2 - d : d; }
  /* Where an atom's lone pairs (and then its charge badge and its octet tag) sit: greedy, into the widest gaps
     between its bonds, the same for the same bonds in every form. */
  function slots(st, k, n){
    var a = st.atoms[k], occ = C.neighbors(st, k).map(function(o){ var b = st.atoms[o]; return Math.atan2(b.y - a.y, b.x - a.x); });
    var out = [], cand = [];
    for(var i = 0; i < 36; i++) cand.push(-Math.PI / 2 + i * Math.PI / 18);
    for(var j = 0; j < n; j++){
      var best = null, bd = -1;
      cand.forEach(function(c){
        var d = Math.min.apply(null, occ.concat(out).map(function(o){ return angDist(c, o); }).concat([Math.PI]));
        if(d > bd + 1e-6){ bd = d; best = c; }
      });
      out.push(best);
    }
    return out;
  }
  function piSide(st, b){
    // the π stick goes inside a ring, otherwise to the side with fewer neighbours
    var A = st.atoms[b.a], Z = st.atoms[b.b], dx = Z.x - A.x, dy = Z.y - A.y, L0 = Math.hypot(dx, dy) || 1, nx = -dy / L0, ny = dx / L0;
    var rings = sixRings(st), ring = rings.filter(function(r){ return r.indexOf(b.a) >= 0 && r.indexOf(b.b) >= 0; })[0];
    var score = 0;
    if(ring){
      var cx = 0, cy = 0; ring.forEach(function(k){ cx += st.atoms[k].x; cy += st.atoms[k].y; }); cx /= 6; cy /= 6;
      score = (cx - (A.x + Z.x) / 2) * nx + (cy - (A.y + Z.y) / 2) * ny;
    } else {
      [b.a, b.b].forEach(function(e){ C.neighbors(st, e).forEach(function(o){ if(o === b.a || o === b.b) return; var q = st.atoms[o]; score -= ((q.x - (A.x + Z.x) / 2) * nx + (q.y - (A.y + Z.y) / 2) * ny) > 0 ? 1 : -1; }); });
      if(score === 0) score = ny <= 0 ? 1 : -1;   // up, when nothing decides
    }
    return score >= 0 ? 1 : -1;
  }

  /* draw(st, T, o) -> { html, A: anchors }
     o.omitLp {atomKey: [{x, y}]}  lone pairs not drawn (they are in flight): the slot nearest each point
     o.omitPi {bondKey: 1}      π sticks not drawn
     o.noCharge {atomKey: 1}    charge not drawn (an atom over its octet, held)
     o.hybrid  {atoms, bonds}   draw a resonance hybrid: shared π electrons and shared charge, no lone pairs
     o.pieces  {atomKey: i}     group by rigid piece (see the header) */
  function draw(st, T, o){
    o = o || {};
    var A = { atoms: {}, lps: {}, pis: {}, bonds: {} }, s = T.k, pc = o.pieces || null;
    var L = { bg: {}, sh: {}, bo: {}, at: {}, lp: {}, ch: {} }, links = '';
    function put(layer, key, h){ var p = pc ? (pc[key] == null ? 'x' : pc[key]) : 0; L[layer][p] = (L[layer][p] || '') + h; }
    var stickW = Math.max(3.2, 4.2 * s), piW = Math.max(2.6, 3.2 * s), off = Math.max(5, 6.4 * s);
    var keys = Object.keys(st.atoms);
    keys.forEach(function(k){ var p = P(T, st.atoms[k]); A.atoms[k] = { x: p[0], y: p[1], r: radiusOf(st, k, T) }; });
    // bonds
    st.bonds.forEach(function(b){
      if(b.order < 1) return;
      var a = A.atoms[b.a], z = A.atoms[b.b], bk = bondKey(b), dx = z.x - a.x, dy = z.y - a.y, L0 = Math.hypot(dx, dy) || 1, nx = -dy / L0, ny = dx / L0;
      A.bonds[bk] = { x1: a.x, y1: a.y, x2: z.x, y2: z.y, mx: (a.x + z.x) / 2, my: (a.y + z.y) / 2, nx: nx, ny: ny };
      var cross = pc && pc[b.a] !== pc[b.b];
      var sig = '<line class="rs2-sig"' + (cross ? ' data-l="' + esc(b.a + '|' + b.b) + '"' : '') + ' x1="' + f1(a.x) + '" y1="' + f1(a.y) + '" x2="' + f1(z.x) + '" y2="' + f1(z.y) + '" stroke-width="' + f1(stickW) + '"/>';
      if(cross) links += sig; else put('bo', b.a, sig);
      var side = piSide(st, b), ox = nx * off * side, oy = ny * off * side;
      var hb = o.hybrid && o.hybrid.bonds[bk], extra = hb ? hb.lo - 1 : b.order - 1, partial = hb && hb.hi > hb.lo;
      var sx = a.x + dx * 0.2 + ox, sy = a.y + dy * 0.2 + oy, ex = a.x + dx * 0.8 + ox, ey = a.y + dy * 0.8 + oy;
      A.pis[bk] = { x1: sx, y1: sy, x2: ex, y2: ey, mx: (sx + ex) / 2, my: (sy + ey) / 2 };
      if(partial){
        put('bg', b.a, '<line class="rs2-deloc" x1="' + f1(a.x) + '" y1="' + f1(a.y) + '" x2="' + f1(z.x) + '" y2="' + f1(z.y) + '" stroke-width="' + f1(off * 3.6) + '"/>');
        put('bo', b.a, '<line class="rs2-pi is-part" x1="' + f1(sx) + '" y1="' + f1(sy) + '" x2="' + f1(ex) + '" y2="' + f1(ey) + '" stroke-width="' + f1(piW) + '"/>');
      }
      for(var i = 0; i < extra; i++){
        if(i === 0 && o.omitPi && o.omitPi[bk]) continue;
        var m = i === 0 ? 1 : -1;
        put('bo', b.a, '<line class="rs2-pi" x1="' + f1(a.x + dx * 0.2 + ox * m) + '" y1="' + f1(a.y + dy * 0.2 + oy * m) + '" x2="' + f1(a.x + dx * 0.8 + ox * m) + '" y2="' + f1(a.y + dy * 0.8 + oy * m) + '" stroke-width="' + f1(piW) + '"/>');
      }
    });
    // atoms, lone pairs, charges
    keys.forEach(function(k){
      var a = st.atoms[k], p = A.atoms[k], r = p.r, q = fc(st, k), n = o.hybrid ? 0 : (a.lp || 0);
      var sl = slots(st, k, n + 2);
      A.lps[k] = [];
      for(var i = 0; i < n; i++){
        var ang = sl[i], d = r + Math.max(7, 5.2 * s);
        A.lps[k].push({ x: p.x + Math.cos(ang) * d, y: p.y + Math.sin(ang) * d, ang: ang });
      }
      var skip = {};
      ((o.omitLp && o.omitLp[k]) || []).forEach(function(pt){
        var bi = -1, bd = Infinity;
        A.lps[k].forEach(function(l, j){ if(skip[j]) return; var dd = Math.hypot(l.x - pt.x, l.y - pt.y); if(dd < bd){ bd = dd; bi = j; } });
        if(bi >= 0) skip[bi] = 1;
      });
      A.lps[k].forEach(function(l, j){ if(!skip[j]) put('lp', k, pairHtml(l.x, l.y, l.ang, s)); });
      A.atoms[k].free = [sl[n], sl[n + 1]];
      var hq = o.hybrid && o.hybrid.atoms[k];
      var showQ = !o.noCharge || !o.noCharge[k];
      if(!o.hybrid && q && showQ) put('bg', k, '<circle class="rs2-glow" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(r * 2.3) + '" fill="url(#rs2g-' + (q < 0 ? 'neg' : 'pos') + ')"/>');
      if(hq){
        if(hq.fixed) put('bg', k, '<circle class="rs2-glow" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(r * 2.2) + '" fill="url(#rs2g-' + (hq.fixed < 0 ? 'neg' : 'pos') + ')"/>');
        else put('bg', k, '<circle class="rs2-glow' + (hq.big ? '' : ' is-small') + '" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(r * (hq.big ? 2.3 : 1.65)) + '" fill="url(#rs2g-' + (hq.neg ? 'neg' : 'pos') + ')"/>');
      }
      put('sh', k, '<circle class="rs2-shadow" cx="' + f1(p.x + r * 0.18) + '" cy="' + f1(p.y + r * 0.42) + '" r="' + f1(r * 1.12) + '"/>');
      var lab = labelOf(st, k), fs = Math.min(r * 1.02, r * 2.5 / Math.max(1, lab.length * 0.78));
      // no letters under 11 px: an 11 px label is used when it still fits across the ball; else a ring CH may drop to
      // its bare symbol; a group (CH₂, CH₃, NH₂) is never lettered as a bare atom ("C" for CH₃ would disagree with the
      // board): the ball keeps only its colour (the board names it)
      function fits(t){ return 0.62 * 11 * t.length <= 2 * r * 0.98; }
      if(fs < 11){ if(fits(lab)) fs = 11; else if((a.hImplicit || 0) < 2 && fits(a.el)){ lab = a.el; fs = 11; } else lab = ''; }
      put('at', k, '<circle class="rs2-ball is-' + (BALL[a.el] || 'x') + '" data-k="' + esc(k) + '" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(r) + '" fill="url(#rs2g-' + (BALL[a.el] || 'x') + ')"/>' +
        '<ellipse class="rs2-shine" cx="' + f1(p.x - r * 0.32) + '" cy="' + f1(p.y - r * 0.38) + '" rx="' + f1(r * 0.34) + '" ry="' + f1(r * 0.22) + '"/>' +
        '<text class="rs2-al is-' + (BALL[a.el] || 'x') + '" x="' + f1(p.x) + '" y="' + f1(p.y + fs * 0.36) + '" font-size="' + f1(fs) + '" text-anchor="middle">' + esc(lab) + '</text>');
      var badge = null;
      if(!o.hybrid && q && showQ) badge = { q: q, t: sign(q) };
      if(hq && hq.fixed) badge = { q: hq.fixed, t: sign(hq.fixed) };
      if(badge){
        var ba = sl[n], br = Math.max(7.6, 6.4 * s), bd = r + br * 0.55, bx = p.x + Math.cos(ba) * bd, by = p.y + Math.sin(ba) * bd;
        A.atoms[k].badge = { x: bx, y: by, r: br };
        put('ch', k, '<g class="rs2-badge is-' + (badge.q < 0 ? 'neg' : 'pos') + '"><circle cx="' + f1(bx) + '" cy="' + f1(by) + '" r="' + f1(br) + '"/>' +
          '<text x="' + f1(bx) + '" y="' + f1(by + br * 0.42) + '" font-size="' + f1(Math.max(11, br * (badge.t.length > 1 ? 1.05 : 1.45))) + '" text-anchor="middle">' + badge.t + '</text></g>');
      }
    });
    function layer(n){
      if(!pc) return L[n][0] || '';
      return Object.keys(L[n]).map(function(p){ return '<g data-p="' + p + '">' + L[n][p] + '</g>'; }).join('');
    }
    return { html: '<g class="rs2-bgl">' + layer('bg') + '</g><g class="rs2-shl">' + layer('sh') + '</g><g class="rs2-bol">' + (pc ? '<g class="rs2-links">' + links + '</g>' : '') + layer('bo') +
      '</g><g class="rs2-atl">' + layer('at') + '</g><g class="rs2-lpl">' + layer('lp') + '</g><g class="rs2-chl">' + layer('ch') + '</g>', A: A };
  }
  function pairHtml(cx, cy, ang, s){
    var dr = Math.max(2.4, 2.2 * s), sp = Math.max(3.4, 2.9 * s), px = -Math.sin(ang) * sp, py = Math.cos(ang) * sp;
    return '<g class="rs2-lp"><circle class="rs2-lpglow" cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(sp * 2.1) + '"/>' +
      '<circle class="rs2-e" cx="' + f1(cx + px) + '" cy="' + f1(cy + py) + '" r="' + f1(dr) + '"/><circle class="rs2-e" cx="' + f1(cx - px) + '" cy="' + f1(cy - py) + '" r="' + f1(dr) + '"/></g>';
  }

  /* The small drawings (a forms row, a steps row): lines and letters, the charge in its colour, the π line violet. */
  function flatSizes(st, T, g){
    var b = st.bonds.filter(function(x){ return x.order > 0 && hvy(st, x.a, g) && hvy(st, x.b, g); })[0], bl = 40;
    if(b){ var a = P(T, st.atoms[b.a]), z = P(T, st.atoms[b.b]); bl = Math.hypot(z[0] - a[0], z[1] - a[1]); }
    return { bl: bl, lw: Math.max(1.5, Math.min(2.6, bl * 0.06)), fsz: Math.max(11, Math.min(15, bl * 0.42)), off: Math.max(2.6, Math.min(5.5, bl * 0.14)) };
  }
  /* Fit a small drawing so its letters, not only its atom centres, stay inside the box: fit, measure the letters at
     that size, shrink the box by how far they reach, fit again. ref: the structure whose atoms set the scale (the
     same for every card of one species); o.cap: largest scale. */
  function fitFlat(ref, st, box, o){
    o = o || {};
    var cap = o.cap || 1.2, g = !!o.groups;
    var T = fitT(ref, box, { flat: true, margin: 0, cap: cap, groups: g });
    for(var it = 0; it < 2; it++){
      var z = flatSizes(st, T, g), ex = 0, ey = z.fsz * 0.55;
      var inR = {}; sixRings(st).forEach(function(r){ r.forEach(function(k){ inR[k] = 1; }); });
      Object.keys(st.atoms).forEach(function(k){ if(!hvy(st, k, g) || (st.atoms[k].el === 'C' && (inR[k] || C.neighbors(st, k).some(function(n){ return inR[n]; })))) return; var l = flatLabel(st, k); if(l !== 'C') ex = Math.max(ex, z.fsz * 0.33 * l.length); });
      T = fitT(ref, { x: box.x + ex, y: box.y + ey, w: Math.max(10, box.w - ex * 2), h: Math.max(10, box.h - ey * 2) }, { flat: true, margin: 0, cap: cap, groups: g });
    }
    return T;
  }
  /* o.groups: draw groups (Et) as their letters; o.clear: a badge also keeps 2 px (on a phone) clear of every letter and
     badge, and sits on the far side of its own atom from every neighbouring letter (both Arrow Pusher's only, so the
     Resonance cards do not change). */
  function drawFlat(st, T, box, o){
    o = o || {};
    var g = !!o.groups;
    /* drawn as on paper: a ring carbon is a plain corner (no letters), so the ring's double bonds have room; letters
       only on heteroatoms and groups. box: where every mark must stay (the card above its tag). */
    var out = '', hk = Object.keys(st.atoms).filter(function(k){ return hvy(st, k, g); });
    var inRing = {}; sixRings(st).forEach(function(r){ r.forEach(function(k){ inRing[k] = 1; }); });
    // a ring carbon, and a CH₂ hanging off a ring (the benzyl carbon), are line ends as on paper
    function bare(k){ var l = flatLabel(st, k); return l === 'C' || (st.atoms[k].el === 'C' && (inRing[k] || (l === 'CH₂' && C.neighbors(st, k).some(function(n){ return inRing[n]; })))); }
    var z0 = flatSizes(st, T, g), lw = z0.lw, fsz = z0.fsz, off = z0.off;
    // every letter's box (for o.clear)
    var lbox = {}, placed = [];
    if(o.clear) hk.forEach(function(k){ if(bare(k)) return; var p = P(T, st.atoms[k]), w = fsz * 0.7 * flatLabel(st, k).replace(/[₀-₉]/g, '').length + fsz * 0.3 * (flatLabel(st, k).match(/[₀-₉]/g) || []).length; lbox[k] = { x0: p[0] - w / 2, x1: p[0] + w / 2, y0: p[1] - fsz * 0.5, y1: p[1] + fsz * 0.5 }; });
    function clearOf(k, bx, by, br){
      if(!o.clear) return true;
      // 3.2 units: the cards are drawn at about 0.65 of their size on a phone, so this is still 2 px on screen
      var hit = function(b){ return !(bx + br + 3.2 <= b.x0 || bx - br - 3.2 >= b.x1 || by + br + 3.2 <= b.y0 || by - br - 3.2 >= b.y1); };
      return !Object.keys(lbox).some(function(j){ return hit(lbox[j]); }) && !placed.some(hit);
    }
    st.bonds.forEach(function(b){
      if(b.order < 1 || !hvy(st, b.a, g) || !hvy(st, b.b, g)) return;
      var a = P(T, st.atoms[b.a]), z = P(T, st.atoms[b.b]), dx = z[0] - a[0], dy = z[1] - a[1], L0 = Math.hypot(dx, dy) || 1, nx = -dy / L0, ny = dx / L0;
      // a line stops just short of a letter: wider labels need more room, and more along a level bond than a steep one
      // (o.clear: a tighter gap from the letters' measured width, so a short bond on a small card keeps its π line)
      function gap(k){ if(bare(k)) return 0; var n = flatLabel(st, k).replace(/[₀-₉]/g, '').length, hx = o.clear ? fsz * (0.08 + 0.32 * n) : fsz * (0.2 + 0.17 * flatLabel(st, k).length), hy = o.clear ? fsz * 0.38 : fsz * 0.42; return Math.min(hx / Math.max(0.01, Math.abs(dx / L0)), hy / Math.max(0.01, Math.abs(dy / L0))) + (o.clear ? 1 : 1.5); }
      var ga = gap(b.a), gz = gap(b.b);
      var ax = a[0] + dx / L0 * ga, ay = a[1] + dy / L0 * ga, zx = z[0] - dx / L0 * gz, zy = z[1] - dy / L0 * gz;
      out += '<line class="rs2-fsig" x1="' + f1(ax) + '" y1="' + f1(ay) + '" x2="' + f1(zx) + '" y2="' + f1(zy) + '" stroke-width="' + f1(lw) + '"/>';
      var side = piSide(st, b), o2 = off * side, ll = Math.hypot(zx - ax, zy - ay) || 1, cut = (o.clear ? Math.min(2, ll * 0.1) : Math.max(2, Math.min(4, ll * 0.12))) / ll, ua = ga ? 0 : cut, uz = gz ? 0 : cut;
      for(var i = 1; i < b.order; i++){
        var m = i === 1 ? 1 : -1;
        out += '<line class="rs2-fpi" x1="' + f1(ax + (zx - ax) * ua + nx * o2 * m) + '" y1="' + f1(ay + (zy - ay) * ua + ny * o2 * m) + '" x2="' + f1(zx - (zx - ax) * uz + nx * o2 * m) + '" y2="' + f1(zy - (zy - ay) * uz + ny * o2 * m) + '" stroke-width="' + f1(lw) + '"/>';
      }
    });
    hk.forEach(function(k){
      var p = P(T, st.atoms[k]), lab = flatLabel(st, k), q = fc(st, k), c = bare(k);
      if(!c) out += '<text class="rs2-fal" x="' + f1(p[0]) + '" y="' + f1(p[1] + fsz * 0.36) + '" font-size="' + f1(fsz) + '" text-anchor="middle">' + esc(lab) + '</text>';
      if(q){
        // a badge in the widest gap between the atom's bonds, kept inside the card and above its tag
        var br = Math.max(7.6, fsz * 0.55), dd = (c ? 2 : fsz * 0.32 * lab.length) + br + 1, bx, by;
        // the widest gap first; if that leaves the card, the next direction that stays inside it
        var angs = slots(st, k, 1); for(var ai = 0; ai < 16; ai++) angs.push(-Math.PI / 2 + ai * Math.PI / 8);
        var bdirs = C.neighbors(st, k).filter(function(n){ return hvy(st, n, g); }).map(function(n){ var o = st.atoms[n], me = st.atoms[k]; return Math.atan2(o.y - me.y, o.x - me.x); });
        angs = angs.filter(function(t, i){ return i === 0 || bdirs.every(function(d){ return angDist(t, d) > 0.6; }); });
        // (o.clear: the badge goes on the far side of its own atom from every neighbouring letter, bonded or not, so it
        // never sits between two atoms and reads as the other one's; review recheck 1, the Claisen alkoxide on a phone)
        var near = [];
        if(o.clear){
          hk.forEach(function(j){ if(j === k) return; var pj = P(T, st.atoms[j]), d = Math.hypot(pj[0] - p[0], pj[1] - p[1]); if(d < dd * 3.2) near.push({ a: Math.atan2(pj[1] - p[1], pj[0] - p[0]), p: pj }); });
          var far = function(t){ return near.reduce(function(m, n){ return Math.min(m, angDist(t, n.a)); }, Math.PI); };
          angs = angs.map(function(t, i){ return { t: t, i: i, f: far(t) }; }).sort(function(a, b){ return (b.f - a.f) || (a.i - b.i); }).map(function(x){ return x.t; });
        }
        // nearer its own atom than any other (o.clear)
        function own(bx, by){ var d0 = Math.hypot(bx - p[0], by - p[1]); return near.every(function(n){ return Math.hypot(bx - n.p[0], by - n.p[1]) > d0 + 2; }); }
        // (o.clear: a little further out too, before giving up)
        var tries = []; (o.clear ? [0, 3, 6, 10] : [0]).forEach(function(e){ angs.forEach(function(t){ tries.push([t, e]); }); });
        if(o.clear){
          // the best place, not the first: inside the card, nearer its own atom than any other, then the most room from
          // every letter and badge (up to 3.2 units, 2 px on a phone), then closest to its atom, then the far side from
          // neighbouring letters
          var room = function(cx, cy){ var m = 99; Object.keys(lbox).map(function(j){ return lbox[j]; }).concat(placed).forEach(function(b){ var gx = Math.max(b.x0 - (cx + br), (cx - br) - b.x1), gy = Math.max(b.y0 - (cy + br), (cy - br) - b.y1); m = Math.min(m, Math.max(gx, gy)); }); return m; };
          var best = null;
          for(var ai2 = 0; ai2 < 32; ai2++) angs.push(ai2 * Math.PI / 16);
          [0, 2, 4, 7, 10, 14].forEach(function(e){ angs.forEach(function(t){
            var cx = p[0] + Math.cos(t) * (dd + e), cy = p[1] + Math.sin(t) * (dd + e);
            if(box && !(cx - br - 1 >= box.x && cx + br + 1 <= box.x + box.w && cy - br - 1 >= box.y && cy + br + 5 <= box.y + box.h)) return;
            // (close to its own atom before the far side: a badge right against its letter reads as that atom's)
            var sc = [own(cx, cy) ? 1 : 0, Math.min(3.2, room(cx, cy)), -e, near.length ? near.reduce(function(m, n){ return Math.min(m, angDist(t, n.a)); }, Math.PI) : 0];
            if(!best || sc[0] > best.s[0] || (sc[0] === best.s[0] && (sc[1] > best.s[1] + 0.01 || (Math.abs(sc[1] - best.s[1]) <= 0.01 && (sc[2] > best.s[2] || (sc[2] === best.s[2] && sc[3] > best.s[3] + 0.05)))))) best = { s: sc, x: cx, y: cy };
          }); });
          if(best){ bx = best.x; by = best.y; tries = []; }
          else { bx = p[0] + Math.cos(angs[0]) * dd; by = p[1] + Math.sin(angs[0]) * dd; tries = []; }
        }
        for(var aj = 0; aj < tries.length; aj++){
          bx = p[0] + Math.cos(tries[aj][0]) * (dd + tries[aj][1]); by = p[1] + Math.sin(tries[aj][0]) * (dd + tries[aj][1]);
          if((!box || (bx - br - 1 >= box.x && bx + br + 1 <= box.x + box.w && by - br - 1 >= box.y && by + br + 5 <= box.y + box.h)) && clearOf(k, bx, by, br) && own(bx, by)) break;
          bx = p[0] + Math.cos(angs[0]) * dd; by = p[1] + Math.sin(angs[0]) * dd;
        }
        if(box){ bx = Math.max(box.x + br + 1, Math.min(box.x + box.w - br - 1, bx)); by = Math.max(box.y + br + 1, Math.min(box.y + box.h - br - 5, by)); }
        placed.push({ x0: bx - br, x1: bx + br, y0: by - br, y1: by + br });
        out += '<g class="rs2-badge is-' + (q < 0 ? 'neg' : 'pos') + '"><circle cx="' + f1(bx) + '" cy="' + f1(by) + '" r="' + f1(br) + '"/><text x="' + f1(bx) + '" y="' + f1(by + br * 0.45) + '" font-size="' + f1(Math.max(11, br * 1.55)) + '" text-anchor="middle">' + sign(q) + '</text></g>';
      }
    });
    return out;
  }

  /* ---- arrows ---- */
  function rawPos(key, A){
    if(C.isBondKey(key)){ var bk = C.parseBondKey(key), x = A.bonds[key] || A.bonds['bond:' + bk.b + '-' + bk.a]; if(x) return { x: x.mx, y: x.my }; var a = A.atoms[bk.a], z = A.atoms[bk.b]; return { x: (a.x + z.x) / 2, y: (a.y + z.y) / 2 }; }
    var p = A.atoms[key]; return p ? { x: p.x, y: p.y } : { x: 0, y: 0 };
  }
  function anchorOf(ar, A, end){
    var key = end === 'from' ? ar.from : ar.to;
    if(C.isBondKey(key)){
      var bk = C.parseBondKey(key), x = A.pis[key] || A.pis['bond:' + bk.b + '-' + bk.a], y = A.bonds[key] || A.bonds['bond:' + bk.b + '-' + bk.a];
      if(end === 'from' && x && !ar.sigma) return { x: x.mx, y: x.my };
      if(y) return { x: y.mx, y: y.my };
      var a = A.atoms[bk.a], b = A.atoms[bk.b];
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
    var p = A.atoms[key];
    if(end === 'from' && A.lps[key] && A.lps[key].length){
      // the lone pair nearest the arrow's other end
      var o = rawPos(ar.to, A);
      var best = A.lps[key].slice().sort(function(u, v){ return Math.hypot(u.x - o.x, u.y - o.y) - Math.hypot(v.x - o.x, v.y - o.y); })[0];
      return { x: best.x, y: best.y, ang: best.ang };
    }
    if(end === 'to' && p){
      // onto an atom: end just outside it, on the side the arrow comes from
      var f = rawPos(ar.from, A), dx = f.x - p.x, dy = f.y - p.y, dl = Math.hypot(dx, dy) || 1;
      return { x: p.x + dx / dl * (p.r + 6), y: p.y + dy / dl * (p.r + 6), atom: true };
    }
    return p ? { x: p.x, y: p.y } : { x: 0, y: 0 };
  }
  function bez(cv, t){ var u = 1 - t; return { x: u * u * cv.a.x + 2 * u * t * cv.c.x + t * t * cv.b.x, y: u * u * cv.a.y + 2 * u * t * cv.c.y + t * t * cv.b.y }; }
  function arrowPath(cv){
    var b = cv.b, c = cv.c, dx = b.x - c.x, dy = b.y - c.y, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, hl = 11, hw = 6;
    var bx = b.x - ux * hl * 0.6, by = b.y - uy * hl * 0.6;
    return { line: 'M' + f1(cv.a.x) + ' ' + f1(cv.a.y) + ' Q' + f1(c.x) + ' ' + f1(c.y) + ' ' + f1(bx) + ' ' + f1(by),
      head: 'M' + f1(b.x) + ' ' + f1(b.y) + ' L' + f1(b.x - ux * hl - uy * hw) + ' ' + f1(b.y - uy * hl + ux * hw) + ' L' + f1(b.x - ux * hl + uy * hw) + ' ' + f1(b.y - uy * hl - ux * hw) + 'Z' };
  }
  function segDist(p, b){
    var dx = b.x2 - b.x1, dy = b.y2 - b.y1, l2 = dx * dx + dy * dy || 1, t = Math.max(0.15, Math.min(0.85, ((p.x - b.x1) * dx + (p.y - b.y1) * dy) / l2));
    return Math.hypot(p.x - (b.x1 + dx * t), p.y - (b.y1 + dy * t));
  }
  function lerpP(a, b, t){ return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
  function ease(f){ return f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; }
  function seg(f, a, b){ return Math.max(0, Math.min(1, (f - a) / (b - a))); }
  function norm(st, key){ if(!C.isBondKey(key)) return key; var bk = C.parseBondKey(key), b = C.findBond(st, bk.a, bk.b); return b ? bondKey(b) : key; }

  function grad(id){ return '<radialGradient id="rs2g-' + id + '" cx="0.36" cy="0.32" r="0.75"><stop offset="0" class="rs2s-' + id + '0"/><stop offset="0.55" class="rs2s-' + id + '1"/><stop offset="1" class="rs2s-' + id + '2"/></radialGradient>'; }
  /* The gradients every board uses (balls, wall, tray, light, charge glows, electrons, shadow). */
  function defs(){
    return ['c', 'h', 'o', 'n', 'x'].map(grad).join('') +
      '<linearGradient id="rs2g-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="rs2s-bg0"/><stop offset="1" class="rs2s-bg1"/></linearGradient>' +
      '<linearGradient id="rs2g-tray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="rs2s-tr0"/><stop offset="1" class="rs2s-tr1"/></linearGradient>' +
      '<radialGradient id="rs2g-spot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" class="rs2s-sp0"/><stop offset="1" class="rs2s-sp1"/></radialGradient>' +
      '<radialGradient id="rs2g-neg"><stop offset="0.2" class="rs2s-ng0"/><stop offset="1" class="rs2s-ng1"/></radialGradient>' +
      '<radialGradient id="rs2g-pos"><stop offset="0.2" class="rs2s-ps0"/><stop offset="1" class="rs2s-ps1"/></radialGradient>' +
      '<radialGradient id="rs2g-el"><stop offset="0" class="rs2s-el0"/><stop offset="1" class="rs2s-el1"/></radialGradient>' +
      '<radialGradient id="rs2g-sh"><stop offset="0" class="rs2s-sh0"/><stop offset="1" class="rs2s-sh1"/></radialGradient>';
  }

  /* ====================================================================== */
  /* The parts bound to one picture                                          */
  /* ====================================================================== */
  function board(ctx){
    var G = ctx.G, svg = ctx.svg;
    function noQ(st){ var o = {}; (ctx.noCharge ? ctx.noCharge(st) : []).forEach(function(k){ o[k] = 1; }); return o; }

    // a curved arrow from a to b, bowed away from the molecule's middle
    function curve(a, b){
      var dx = b.x - a.x, dy = b.y - a.y, L0 = Math.hypot(dx, dy) || 1, nx = -dy / L0, ny = dx / L0;
      var cx = 0, cy = 0, n = 0, mainA = ctx.A();
      if(mainA) Object.keys(mainA.atoms).forEach(function(k){ cx += mainA.atoms[k].x; cy += mainA.atoms[k].y; n++; });
      cx = n ? cx / n : a.x; cy = n ? cy / n : a.y;
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, side = (mx - cx) * nx + (my - cy) * ny >= 0 ? 1 : -1;
      var bow = Math.max(18, Math.min(46, L0 * 0.5));
      return { a: a, b: b, c: { x: mx + nx * bow * side, y: my + ny * bow * side } };
    }
    function arrowHtml(ar, A, cls){
      var p = arrowPath(curve(anchorOf(ar, A, 'from'), anchorOf(ar, A, 'to')));
      return '<g class="rs2-arrow ' + (cls || '') + '"><path class="rs2-al-l" d="' + p.line + '"/><path class="rs2-al-h" d="' + p.head + '"/></g>';
    }

    /* ---- motion */
    var tw = 0, twEnd = null;
    function stopTween(){ if(tw){ cancelAnimationFrame(tw); tw = 0; } if(twEnd){ var f = twEnd; twEnd = null; f(); } }
    function calm(){ if(!svg.animate) return; try{ (ctx.calm || []).forEach(function(n){ n.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' }); }); }catch(e){} }
    function tween(ms, fn, done){
      stopTween();
      twEnd = done || null;
      if(ctx.reduced() || !window.requestAnimationFrame){ fn(1); stopTween(); calm(); return; }
      var t0 = null;
      function step(ts){
        if(t0 == null) t0 = ts;
        var f = Math.min(1, (ts - t0) / ms);
        fn(f);
        if(f < 1) tw = requestAnimationFrame(step); else { tw = 0; var d = twEnd; twEnd = null; if(d) d(); }
      }
      tw = requestAnimationFrame(step);
    }
    function busy(){ return !!tw; }
    function wait(on){ (ctx.waitEls || []).forEach(function(e){ e.classList.toggle('is-wait', on); }); }

    /* Electrons move from one drawn structure to the next along the arrows. from: the structure drawn now; to: the
       one to draw; arrows: all of them (the held ones and the new one); o.start: where the new pair is (the finger's
       drop point) or null to draw every arrow in first; o.from: where the new pair was grabbed; o.fresh: the arrows
       whose pairs move now; o.T: the transform (default ctx.T()). Labels and words wait for the end. */
    function moveElectrons(from, to, arrows, o, done){
      o = o || {};
      var T = o.T || ctx.T(), Afrom = draw(from, T).A, Ato = draw(to, T).A;
      var fresh = o.fresh || arrows;
      var omitLpA = {}, omitPiA = {}, omitLpB = {}, omitPiB = {};
      var ends = fresh.map(function(ar, i){
        var a = o.from && i === fresh.length - 1 ? o.from : anchorOf(ar, Afrom, 'from'), b = anchorOf(ar, Ato, 'to');
        if(C.isBondKey(ar.to)){ var pi = Ato.pis[norm(to, ar.to)]; if(pi) b = { x: pi.mx, y: pi.my }; else if(Ato.bonds[norm(to, ar.to)]){ var bb = Ato.bonds[norm(to, ar.to)]; b = { x: bb.mx, y: bb.my }; } }
        else { var lps = Ato.lps[ar.to] || []; if(lps.length && !ar.bond) b = lps.slice().sort(function(u, v){ return Math.hypot(u.x - a.x, u.y - a.y) - Math.hypot(v.x - a.x, v.y - a.y); })[0]; }
        if(o.ends && o.ends[i]) b = o.ends[i];
        return { a: a, b: b };
      });
      fresh.forEach(function(ar, i){
        if(C.isBondKey(ar.from)) omitPiA[ar.from] = 1; else (omitLpA[ar.from] = omitLpA[ar.from] || []).push(ends[i].a);
        if(C.isBondKey(ar.to)) omitPiB[norm(to, ar.to)] = 1; else if(!o.ends || !o.ends[i]) (omitLpB[ar.to] = omitLpB[ar.to] || []).push(ends[i].b);
      });
      G.mainA.innerHTML = draw(from, T, { omitLp: omitLpA, omitPi: omitPiA, noCharge: noQ(from) }).html;
      G.mainB.innerHTML = draw(to, T, { omitLp: omitLpB, omitPi: omitPiB, noCharge: noQ(to) }).html;
      G.mainA.style.opacity = '1'; G.mainB.style.opacity = '0';
      G.ui.innerHTML = ''; wait(true);
      var curves = ends.map(function(e){ return curve(e.a, e.b); });
      var held = arrows.filter(function(ar){ return fresh.indexOf(ar) < 0; });
      G.arrows.innerHTML = held.map(function(ar){ return arrowHtml(ar, Afrom, 'is-held'); }).join('') +
        curves.map(function(cv){ var p = arrowPath(cv); return '<g class="rs2-arrow is-run"><path class="rs2-al-l" d="' + p.line + '"/><path class="rs2-al-h" d="' + p.head + '"/></g>'; }).join('');
      var runs = [].slice.call(G.arrows.querySelectorAll('.is-run')), heldEls = [].slice.call(G.arrows.querySelectorAll('.is-held'));
      runs.forEach(function(g){ var l = g.querySelector('.rs2-al-l'), len = l.getTotalLength ? l.getTotalLength() : 200; g.__len = len; l.style.strokeDasharray = len; l.style.strokeDashoffset = o.start ? 0 : len; g.querySelector('.rs2-al-h').style.opacity = o.start ? 1 : 0; });
      G.fly.innerHTML = curves.map(function(){ return '<g class="rs2-flyp"><circle class="rs2-lpglow" r="9"/><circle class="rs2-e" r="3"/><circle class="rs2-e" r="3"/></g>'; }).join('');
      var flyEls = [].slice.call(G.fly.children);
      var s = T.k, dr = Math.max(2.4, 2.2 * s), sp = Math.max(3.4, 2.9 * s);
      flyEls.forEach(function(g){ g.children[0].setAttribute('r', f1(sp * 2.1)); g.children[1].setAttribute('r', f1(dr)); g.children[2].setAttribute('r', f1(dr)); });
      var ms = o.ms || (o.start ? 520 : 1100), drawIn = o.start ? 0 : 0.3;
      tween(ms, function(f){
        var a = ease(seg(f, 0, drawIn || 0.0001)), m = ease(seg(f, drawIn, 0.82)), x = ease(seg(f, drawIn + (0.82 - drawIn) * 0.55, 0.9)), z = seg(f, 0.84, 1);
        runs.forEach(function(g){ if(!o.start){ g.querySelector('.rs2-al-l').style.strokeDashoffset = f1(g.__len * (1 - a)); g.querySelector('.rs2-al-h').style.opacity = a > 0.95 ? 1 : 0; } g.style.opacity = f1(1 - z); });
        heldEls.forEach(function(g){ g.style.opacity = f1(1 - z); });
        curves.forEach(function(cv, i){
          var p = o.start && i === fresh.length - 1 ? lerpP(o.start, cv.b, m) : bez(cv, m), d = bez(cv, Math.min(1, m + 0.02)), ang = Math.atan2(d.y - p.y, d.x - p.x) + Math.PI / 2;
          var g = flyEls[i], px = -Math.sin(ang) * sp, py = Math.cos(ang) * sp;
          g.children[0].setAttribute('cx', f1(p.x)); g.children[0].setAttribute('cy', f1(p.y));
          g.children[1].setAttribute('cx', f1(p.x + px)); g.children[1].setAttribute('cy', f1(p.y + py));
          g.children[2].setAttribute('cx', f1(p.x - px)); g.children[2].setAttribute('cy', f1(p.y - py));
          g.style.opacity = f1(1 - seg(f, 0.86, 1));
        });
        G.mainA.style.opacity = f1(1 - x); G.mainB.style.opacity = f1(x);
      }, function(){
        G.fly.innerHTML = ''; G.arrows.innerHTML = ''; G.mainB.innerHTML = ''; G.mainB.style.opacity = '0';
        wait(false);
        if(done) done();
      });
    }

    /* A pair that does not make what was asked springs back to where it came from; the arrow fades red. */
    function springBack(fromPt, toPt, done){
      G.fly.innerHTML = '<g class="rs2-flyp is-bad"><circle class="rs2-lpglow" r="9"/><circle class="rs2-e" r="3"/><circle class="rs2-e" r="3"/></g>';
      var g = G.fly.firstChild, a = G.arrows.querySelector('.is-drag');
      if(a) a.classList.add('is-bad');
      tween(380, function(f){
        var m = ease(f), p = lerpP(fromPt, toPt, m);
        g.children[0].setAttribute('cx', f1(p.x)); g.children[0].setAttribute('cy', f1(p.y));
        g.children[1].setAttribute('cx', f1(p.x + 4)); g.children[1].setAttribute('cy', f1(p.y));
        g.children[2].setAttribute('cx', f1(p.x - 4)); g.children[2].setAttribute('cy', f1(p.y));
        g.style.opacity = f1(1 - seg(f, 0.7, 1));
        if(a) a.style.opacity = f1(1 - f);
      }, function(){ G.fly.innerHTML = ''; if(a) a.remove(); if(done) done(); });
    }

    /* ---- what the finger grabs and where it lands */
    /* Every place an arrow from this source could end, with where it sits. */
    function targetsFor(src){
      var st = ctx.shown(), out = [], A = ctx.A();
      Object.keys(st.atoms).forEach(function(k){ if(k !== src && A.atoms[k]) out.push({ key: k, x: A.atoms[k].x, y: A.atoms[k].y }); });
      st.bonds.forEach(function(b){ if(b.order < 1) return; var bk = bondKey(b); if(bk === src) return; var m = A.bonds[bk]; if(m) out.push({ key: bk, x: m.mx, y: m.my, bond: b }); });
      return out;
    }
    /* Forgiving: the arrow lands on the nearest target that makes sense within reach (rankOf(t): lower is better); a
       target almost under the finger is taken as meant, whatever it does. */
    function snap(src, pt, list, rankOf){
      var T = ctx.T(), A = ctx.A();
      var reach = Math.max(58, 44 * T.k), near = list.map(function(t){
        var d = t.bond ? segDist(pt, A.bonds[t.key]) : Math.hypot(t.x - pt.x, t.y - pt.y) - A.atoms[t.key].r * 0.6;
        return { t: t, d: d };
      }).filter(function(x){ return x.d < reach; }).sort(function(a, b){ return a.d - b.d; });
      if(!near.length) return null;
      if(near[0].d < Math.max(12, 9 * T.k)) return near[0].t;
      var best = null, br = 9;
      near.forEach(function(x){ var r = rankOf(x.t); if(r < br){ br = r; best = x.t; } });
      return best;
    }
    /* What the finger grabbed: a lone pair (or the atom that holds it), a π bond, or (o.sigma) a single bond; or (to
       be told why not) an atom with no lone pair, or a single bond when single bonds cannot move. Returns
       { key, x, y, real, sigma }. */
    function sourceAt(pt, o){
      o = o || {};
      var st = ctx.shown(), A = ctx.A(), T = ctx.T(), best = null, bd = Infinity;
      function take(key, d, x, y, real, sigma){ if(d < bd){ bd = d; best = { key: key, x: x, y: y, real: real, sigma: !!sigma }; } }
      Object.keys(A.lps).forEach(function(k){ A.lps[k].forEach(function(l){ take(k, Math.hypot(l.x - pt.x, l.y - pt.y) - 6, l.x, l.y, true); }); });
      st.bonds.forEach(function(b){ if(b.order >= 2){ var bk = bondKey(b), pi = A.pis[bk]; if(pi) take(bk, segDist(pt, pi) - 4, pi.mx, pi.my, true); } });
      Object.keys(A.atoms).forEach(function(k){ var a = A.atoms[k], d = Math.hypot(a.x - pt.x, a.y - pt.y) - a.r;
        if((st.atoms[k].lp || 0) > 0 && A.lps[k] && A.lps[k].length){ var l = A.lps[k][0]; take(k, d + 2, l.x, l.y, true); } else take(k, d + 10, a.x, a.y, false); });
      st.bonds.forEach(function(b){
        var m = A.bonds[bondKey(b)]; if(!m) return;
        if(b.order === 1) take(bondKey(b), segDist(pt, m) + (o.sigma ? 2 : 10), m.mx, m.my, !!o.sigma, true);
        // the σ part of a double bond, grabbed on its own line (o.sigma)
        else if(o.sigma) take(bondKey(b), segDist(pt, m) + 3, m.mx, m.my, true, true);
      });
      var reach = Math.max(26, 20 * T.k);
      return bd < reach ? best : null;
    }

    // what is shown while dragging: the source dimmed, the pair on the finger, the arrow to the lit target
    var dv = null;
    function startDragVis(d){
      var key = d.src.key, omitLp = {}, omitPi = {};
      if(d.src.real){ if(C.isBondKey(key)){ if(!d.src.sigma) omitPi[key] = 1; } else omitLp[key] = [{ x: d.src.x, y: d.src.y }]; }
      var st = ctx.shown();
      G.mainA.innerHTML = draw(st, ctx.T(), { omitLp: omitLp, omitPi: omitPi, noCharge: noQ(st), pieces: ctx.pieces ? ctx.pieces(st) : null }).html;
      if(d.src.sigma) [].forEach.call(G.mainA.querySelectorAll('.rs2-sig'), function(l){ var b = ctx.A().bonds[key]; if(b && Math.abs(+l.getAttribute('x1') - f1(b.x1)) < 0.2 && Math.abs(+l.getAttribute('y1') - f1(b.y1)) < 0.2 && Math.abs(+l.getAttribute('x2') - f1(b.x2)) < 0.2) l.classList.add('is-lift'); });
      G.fly.innerHTML = '<g class="rs2-flyp is-drag"><circle class="rs2-lpglow" r="10"/><circle class="rs2-e" r="3"/><circle class="rs2-e" r="3"/></g>';
      G.arrows.insertAdjacentHTML('beforeend', '<g class="rs2-arrow is-drag"><path class="rs2-al-l"/><path class="rs2-al-h"/></g><circle class="rs2-tgt" r="0"/><line class="rs2-tgtb"/>');
      var s = ctx.T().k, dr = Math.max(2.4, 2.2 * s), sp = Math.max(3.4, 2.9 * s), fp = G.fly.firstChild;
      fp.children[0].setAttribute('r', f1(sp * 2.1)); fp.children[1].setAttribute('r', f1(dr)); fp.children[2].setAttribute('r', f1(dr));
      dv = { pair: fp, arrow: G.arrows.querySelector('.is-drag'), tgt: G.arrows.querySelector('.rs2-tgt'), tgtb: G.arrows.querySelector('.rs2-tgtb'), sp: sp };
      if(ctx.labsEl) ctx.labsEl.classList.add('is-drag');
    }
    // kindOf(t): 'reject' tints the arrow and the lit target red
    function paintDrag(d, kindOf){
      if(!dv) return;
      var p = d.pt, sp = dv.sp, g = dv.pair, mainA = ctx.A();
      g.children[0].setAttribute('cx', f1(p.x)); g.children[0].setAttribute('cy', f1(p.y));
      g.children[1].setAttribute('cx', f1(p.x + sp)); g.children[1].setAttribute('cy', f1(p.y));
      g.children[2].setAttribute('cx', f1(p.x - sp)); g.children[2].setAttribute('cy', f1(p.y));
      var end = d.t ? (d.t.bond ? { x: d.t.x, y: d.t.y } : anchorOf({ from: d.src.key, to: d.t.key }, mainA, 'to')) : p;
      var a = arrowPath(curve({ x: d.src.x, y: d.src.y }, end));
      dv.arrow.children[0].setAttribute('d', a.line); dv.arrow.children[1].setAttribute('d', a.head);
      var kind = d.t ? kindOf(d.t) : null;
      dv.arrow.setAttribute('class', 'rs2-arrow is-drag' + (kind === 'reject' ? ' is-no' : ''));
      if(d.t && !d.t.bond){ var at = mainA.atoms[d.t.key]; dv.tgt.setAttribute('cx', f1(at.x)); dv.tgt.setAttribute('cy', f1(at.y)); dv.tgt.setAttribute('r', f1(at.r + 7)); dv.tgtb.setAttribute('class', 'rs2-tgtb'); }
      else dv.tgt.setAttribute('r', '0');
      if(d.t && d.t.bond){ var b = mainA.bonds[d.t.key]; ['x1', 'y1', 'x2', 'y2'].forEach(function(n){ dv.tgtb.setAttribute(n, f1(b[n])); }); dv.tgtb.setAttribute('class', 'rs2-tgtb is-on'); }
      else dv.tgtb.setAttribute('class', 'rs2-tgtb');
      dv.tgt.setAttribute('class', 'rs2-tgt' + (kind === 'reject' ? ' is-no' : ''));
    }
    function endDragVis(keepArrow){
      if(dv){ dv.tgt.remove(); dv.tgtb.remove(); if(!keepArrow) dv.arrow.remove(); }
      G.fly.innerHTML = ''; dv = null; if(ctx.labsEl) ctx.labsEl.classList.remove('is-drag');
    }

    return { curve: curve, arrowHtml: arrowHtml, tween: tween, stopTween: stopTween, busy: busy, moveElectrons: moveElectrons,
      springBack: springBack, targetsFor: targetsFor, snap: snap, sourceAt: sourceAt, startDragVis: startDragVis, paintDrag: paintDrag,
      endDragVis: endDragVis };
  }

  window.OchemPushBoard = {
    f1: f1, esc: esc, heavy: heavy, fc: fc, bondKey: bondKey, sign: sign, sixRings: sixRings, labelOf: labelOf, flatLabel: flatLabel,
    angDist: angDist, slots: slots, piSide: piSide, fitT: fitT, P: P, radiusOf: radiusOf, draw: draw, pairHtml: pairHtml,
    fitFlat: fitFlat, drawFlat: drawFlat, rawPos: rawPos, anchorOf: anchorOf, bez: bez, arrowPath: arrowPath, segDist: segDist,
    lerpP: lerpP, ease: ease, seg: seg, norm: norm, defs: defs, board: board
  };
})();
