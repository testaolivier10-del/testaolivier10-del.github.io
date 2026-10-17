/* Design randomizer (simulator; docs/apstat-spec.md section 6). OWNED BY
   THIS TOOL ONLY. The model is ApStatMath.designRandomizer (statistics/
   assets/tools/math/design-randomizer.js); the frame is ApStatTools.modes on
   the Tool Studio.

   Explore: an illustrated experiment (tomato seedlings on a greenhouse
   bench, one row by the window; volunteers in a memory study, younger and
   older). Pick a design (completely randomized, blocked, matched pairs, or
   no random assignment), Randomize: each unit gets its treatment marker in
   the order chance picks it, then the experiment runs (the plants grow to
   their measured height, the volunteers show their scores). The estimate,
   mean of A minus mean of B, lands on a dotplot with one row per design,
   against the true effect built into the model. "Run 100" fills a row:
   random assignment centers on the truth, blocks and pairs narrow it, a
   person choosing shifts it (confounding), and in the memory study an
   unblinded run shifts it by the placebo effect. Colors: treatment A in the
   second series color, B in the first, estimates in the third.
   Test yourself: ApStatTools.drill over the model's generate(). */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath, P = window.ApStatPlot;
  if(!T || !M || !M.designRandomizer) return;
  var D = M.designRandomizer, esc = T.esc;

  T.mount('design-randomizer', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'design-randomizer',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ T.drill(host, data, { slug: 'design-randomizer', noun: 'drill', generate: D.generate,
        types: [{ value: 'design', label: 'Name the design' }, { value: 'variables', label: 'Variables and units' }, { value: 'scope', label: 'Cause and effect, or generalize?' }, { value: 'procedure', label: 'Random assignment, step by step' }, { value: 'confound', label: 'Confounding and blinding' }],
        typeLabel: 'Kind of problem',
        title: function(p){ return { design: 'Name the design', variables: 'Variables and units', scope: 'What can we conclude?', procedure: 'Random assignment', confound: 'Confounding and blinding' }[p.type] || 'Practice problem'; },
        extra: function(el, p, api){ api.fig = el; qfig(el, p, false); },
        onStep: function(st, right, api){ if(st.key === 'cause') qfig(api.fig, api.problem, true); } }); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function fx(x, d){ return T.F(x, d == null ? 2 : d); }
  function hash(i, k){ var h = Math.imul(i + 1, 2654435761) ^ Math.imul(k + 7, 40503); h ^= h >>> 13; return Math.abs(h) % 997; }

  /* ------------------------------------------------------- the scene */
  function layout(sc, U){
    var L = { at: [], blocks: [], pairs: [] }, bg = [];
    if(sc.kind === 'plants'){
      var W = 1000, cw = 118, x0 = (W - sc.cols * cw) / 2, shelf = [318, 612];
      L.W = W; L.H = 660;
      bg.push('<rect class="dr-wall" x="0" y="0" width="' + W + '" height="' + L.H + '"/>');
      bg.push('<rect class="dr-window" x="40" y="14" width="' + (W - 80) + '" height="66" rx="8"/><path class="dr-mullion" d="M' + (W / 2) + ' 14 V 80 M 40 47 H ' + (W - 40) + '"/>');
      bg.push('<circle class="dr-sun" cx="118" cy="47" r="20"/>');
      bg.push('<path class="dr-light" d="M60 80 L ' + (W - 60) + ' 80 L ' + (W - 10) + ' ' + (shelf[0] + 4) + ' L 10 ' + (shelf[0] + 4) + ' Z"/>');
      shelf.forEach(function(y, k){
        bg.push('<rect class="dr-shelf" x="16" y="' + y + '" width="' + (W - 32) + '" height="14" rx="3"/><rect class="dr-leg" x="40" y="' + (y + 14) + '" width="12" height="' + (k ? 30 : 16) + '"/><rect class="dr-leg" x="' + (W - 52) + '" y="' + (y + 14) + '" width="12" height="' + (k ? 30 : 16) + '"/>');
      });
      U.forEach(function(u){ L.at.push({ x: x0 + u.col * cw, y: shelf[u.row] - 52, w: cw, h: 52, base: shelf[u.row] }); });
      [1, 0].forEach(function(b){ var rows = U.filter(function(u){ return u.block === b; }), r0 = rows[0].row; L.blocks[b] = { x: x0 - 8, y: shelf[r0] - 250, w: sc.cols * cw + 16, h: 270, name: sc.lurk.names[b], ty: shelf[r0] - 228 }; });
    } else {
      var W2 = 1000, cw2 = 150, rh = 150, x2 = (W2 - sc.cols * cw2) / 2, top = 40;
      L.W = W2; L.H = top + sc.rows * rh + 30;
      bg.push('<rect class="dr-room" x="0" y="0" width="' + W2 + '" height="' + L.H + '"/>');
      U.forEach(function(u){ L.at.push({ x: x2 + u.col * cw2, y: top + u.row * rh + (u.row >= sc.lurk.rows[0] ? 20 : 0), w: cw2, h: rh - 10 }); });
      [0, 1].forEach(function(b){ var rows = U.filter(function(u){ return u.block === b; }), ys = rows.map(function(u){ return L.at[u.i].y; }); var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys) + rh - 10; L.blocks[b] = { x: x2 - 10, y: y0 - 28, w: sc.cols * cw2 + 20, h: y1 - y0 + 34, name: sc.lurk.names[b], ty: y0 - 9 }; });
    }
    var pairs = {};
    U.forEach(function(u){ (pairs[u.pair] = pairs[u.pair] || []).push(u.i); });
    Object.keys(pairs).forEach(function(k){ var p = pairs[k], a = L.at[p[0]], b = L.at[p[1]]; L.pairs.push({ x: a.x + 8, y: (sc.kind === 'plants' ? a.base + 18 : a.y + a.h - 6), w: b.x + b.w - a.x - 16 }); });
    L.bg = bg.join('');
    return L;
  }
  /* grow: 0 (seedling) to 1 (the measured height); y the response or null */
  function unitSvg(sc, u, a, tr, y, grow, lim, o){
    var g = '<g class="dr-u' + (tr ? ' is-' + tr : '') + '" data-i="' + u.i + '">';
    if(sc.kind === 'plants'){
      var cx = a.x + a.w / 2, base = a.base, potT = base - 48;
      var h0 = 34, h1 = y == null ? h0 : 44 + (y - lim[0]) / (lim[1] - lim[0]) * 170, h = h0 + (h1 - h0) * grow, top = potT - h;
      var leaves = '', nL = Math.max(2, Math.round(h / 28));
      for(var k = 0; k < nL; k++){
        var ly = potT - (k + 0.7) * h / (nL + 0.4), side = k % 2 ? 1 : -1, len = 15 + Math.min(10, h / 14);
        leaves += '<path class="dr-leaf" d="M' + cx + ' ' + ly.toFixed(1) + ' q ' + (side * len * 0.6).toFixed(1) + ' ' + (-len * 0.55).toFixed(1) + ' ' + (side * len).toFixed(1) + ' ' + (-len * 0.15).toFixed(1) + ' q ' + (-side * len * 0.45).toFixed(1) + ' ' + (len * 0.42).toFixed(1) + ' ' + (-side * len).toFixed(1) + ' ' + (len * 0.15).toFixed(1) + ' Z"/>';
      }
      var fruit = y != null && grow > 0.95 && h > 120 ? '<circle class="dr-fruit" cx="' + (cx + 9) + '" cy="' + (top + h * 0.38).toFixed(1) + '" r="6.5"/>' + (h > 170 ? '<circle class="dr-fruit" cx="' + (cx - 10) + '" cy="' + (top + h * 0.55).toFixed(1) + '" r="6"/>' : '') : '';
      g += '<path class="dr-stem" d="M' + cx + ' ' + potT + ' V ' + top.toFixed(1) + '"/>' + leaves + '<path class="dr-leaf dr-tip" d="M' + cx + ' ' + (top + 2).toFixed(1) + ' q -9 -10 0 -16 q 9 6 0 16 Z"/>' + fruit +
        '<path class="dr-pot" d="M' + (cx - 30) + ' ' + potT + ' h 60 l -7 46 h -46 Z"/><rect class="dr-rim" x="' + (cx - 33) + '" y="' + (potT - 4) + '" width="66" height="10" rx="3"/>';
      if(tr) g += '<g class="dr-tag"><path class="dr-stake" d="M' + (cx + 22) + ' ' + (potT + 4) + ' V ' + (potT - 30) + '"/><rect x="' + (cx + 10) + '" y="' + (potT - 52) + '" width="24" height="22" rx="4"/><text x="' + (cx + 22) + '" y="' + (potT - 35.5) + '" text-anchor="middle">' + tr + '</text></g>';
      if(y != null && grow > 0.95) g += '<text class="dr-val" x="' + cx + '" y="' + (base - 16) + '" text-anchor="middle">' + fx(y, sc.decimals) + '</text>';
      g += '<text class="dr-lab" x="' + (a.x + 10) + '" y="' + (base - 4) + '">' + u.label + '</text>';
    } else {
      var cx2 = a.x + a.w / 2 - 14, b2 = a.y + a.h * 0.72, hy = b2 - 34, old = u.block === 1;
      var skin = hash(u.i, 5) % 4, hair = old ? 'old' + (hash(u.i, 6) % 2) : String(hash(u.i, 6) % 4);
      g += '<rect class="dr-chair" x="' + (cx2 - 30) + '" y="' + (b2 - 36) + '" width="60" height="44" rx="10"/>' +
        '<path class="dr-shirt dr-shirt-' + (hash(u.i, 7) % 4) + '" d="M' + (cx2 - 23) + ' ' + b2 + ' Q ' + (cx2 - 23) + ' ' + (b2 - 25) + ' ' + cx2 + ' ' + (b2 - 25) + ' Q ' + (cx2 + 23) + ' ' + (b2 - 25) + ' ' + (cx2 + 23) + ' ' + b2 + ' Z"/>' +
        '<circle class="dr-skin dr-skin-' + skin + '" cx="' + cx2 + '" cy="' + hy + '" r="14"/>' +
        '<path class="dr-hair dr-hair-' + hair + '" d="M' + (cx2 - 14.6) + ' ' + (hy + 1) + ' A 14.6 14.6 0 0 1 ' + (cx2 + 14.6) + ' ' + (hy + 1) + ' Q ' + (cx2 + 5) + ' ' + (hy - (old ? 4 : 9)) + ' ' + (cx2 - 14.6) + ' ' + (hy + 1) + ' Z"/>' +
        (old && hash(u.i, 8) % 2 ? '<path class="dr-glasses" d="M' + (cx2 - 10) + ' ' + (hy + 2) + ' h 7 M ' + (cx2 + 3) + ' ' + (hy + 2) + ' h 7 M ' + (cx2 - 3) + ' ' + (hy + 2) + ' h 6"/>' : '') +
        '<rect class="dr-table" x="' + (cx2 - 34) + '" y="' + (b2 - 2) + '" width="68" height="12" rx="3"/>' +
        '<text class="dr-age" x="' + cx2 + '" y="' + (b2 + 27) + '" text-anchor="middle">' + (u.age != null ? 'Age ' + u.age : '') + '</text>';
      if(tr) g += '<g class="dr-tag dr-pill"><rect x="' + (cx2 + 30) + '" y="' + (b2 - 26) + '" width="34" height="18" rx="9"/><path class="dr-pill-mid" d="M' + (cx2 + 47) + ' ' + (b2 - 26) + ' v 18"/><text x="' + (cx2 + 47) + '" y="' + (b2 - 46) + '" text-anchor="middle">' + tr + '</text></g>';
      if(y != null && grow > 0.95) g += '<g class="dr-score"><rect x="' + (cx2 + 26) + '" y="' + (hy - 30) + '" width="42" height="26" rx="8"/><text x="' + (cx2 + 47) + '" y="' + (hy - 11.5) + '" text-anchor="middle">' + fx(y, 0) + '</text></g>';
      g += '<text class="dr-lab" x="' + (a.x + 6) + '" y="' + (a.y + 18) + '">' + u.label + '</text>';
    }
    return g + '<rect class="dr-hit" x="' + a.x + '" y="' + a.y + '" width="' + a.w + '" height="' + a.h + '"/></g>';
  }

  /* --------------------------------------------- the dotplot of estimates */
  function estSvg(rows, dom, truth, w, h, o){
    var padL = 14, padR = 14, top = 18, axis = 40, W = Math.max(240, w), H = Math.max(110, h);
    var pw = W - padL - padR, sx = function(v){ return padL + (v - dom[0]) / (dom[1] - dom[0]) * pw; };
    var n = Math.max(1, rows.length), rh = (H - top - axis) / n, ticks = P.ticks(dom[0], dom[1], W < 420 ? 4 : 7), g = [];
    ticks.forEach(function(t){ g.push('<line class="sl-grid dr-grid" x1="' + sx(t).toFixed(1) + '" x2="' + sx(t).toFixed(1) + '" y1="' + top + '" y2="' + (H - axis) + '"/><text class="dr-tick" x="' + sx(t).toFixed(1) + '" y="' + (H - axis + 15) + '" text-anchor="middle">' + esc(M.fmt(t, 4)) + '</text>'); });
    if(dom[0] < 0 && dom[1] > 0) g.push('<line class="dr-zero" x1="' + sx(0).toFixed(1) + '" x2="' + sx(0).toFixed(1) + '" y1="' + top + '" y2="' + (H - axis) + '"/>');
    g.push('<line class="dr-axis" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + (H - axis) + '" y2="' + (H - axis) + '"/>');
    if(!rows.length) g.push('<text class="dr-empty" x="' + (padL + pw * 0.22) + '" y="' + (top + (H - top - axis) / 2 + 5) + '" text-anchor="middle">' + esc(o.empty) + '</text>');
    var bins = Math.max(24, Math.min(64, Math.round(pw / 8)));
    rows.forEach(function(r, k){
      var y0 = top + k * rh, base = y0 + rh - 5, cnt = {}, maxC = 1, bw = pw / bins;
      var binOf = function(v){ return Math.max(0, Math.min(bins - 1, Math.floor((v - dom[0]) / (dom[1] - dom[0]) * bins))); };
      r.vals.forEach(function(v){ var b = binOf(v); cnt[b] = (cnt[b] || 0) + 1; maxC = Math.max(maxC, cnt[b]); });
      var rad = Math.max(1.4, Math.min(bw / 2 - 0.4, (rh - 18) / maxC / 2 - 0.2, 3.8)), step = Math.min(rad * 2 + 0.6, (rh - 18) / maxC), seen = {};
      g.push('<text class="dr-rowt' + (r.key === o.cur ? ' is-cur' : '') + '" x="' + (padL + 2) + '" y="' + (y0 + 14) + '">' + esc(r.name) + ' <tspan class="dr-rown">' + r.vals.length + '</tspan></text>');
      if(k) g.push('<line class="dr-rowsep" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y0 + '" y2="' + y0 + '"/>');
      r.vals.forEach(function(v){ var b = binOf(v), lvl = seen[b] = (seen[b] || 0) + 1; g.push('<circle class="dr-dot" cx="' + (padL + (b + 0.5) * bw).toFixed(1) + '" cy="' + (base - rad - (lvl - 1) * step).toFixed(1) + '" r="' + rad.toFixed(2) + '"/>'); });
      if(r.last != null && r.key === o.cur){ var bl = binOf(r.last); g.push('<circle class="dr-last" cx="' + (padL + (bl + 0.5) * bw).toFixed(1) + '" cy="' + (base - rad - (cnt[bl] - 1) * step).toFixed(1) + '" r="' + Math.max(4.4, rad + 1.6).toFixed(2) + '"/>'); }
    });
    var mx = sx(truth);
    g.push('<line class="dr-truth" x1="' + mx.toFixed(1) + '" x2="' + mx.toFixed(1) + '" y1="' + (top - 2) + '" y2="' + (H - axis) + '"/><text class="dr-trutht" x="' + mx.toFixed(1) + '" y="' + (top - 6) + '" text-anchor="middle">true effect ' + esc(o.truth) + '</text>');
    g.push('<text class="dr-axl" x="' + (padL + pw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(o.axis) + '</text>');
    return '<svg class="dr-est" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(o.label) + '">' + g.join('') + '</svg>';
  }

  /* --------------------------------------------------------- explore */
  function explore(host, data){
    var scenes = (data.explore && data.explore.scenes) || [];
    var LS = null, nid = T.nid('dr'), sc, U, L, lim, design = 'cr', blind = true, rows = {}, cur = null, anim = null, touched = false, sel = -1, dom = [0, 1];
    var rng = M.rng(1000 + Math.floor(Math.random() * 9000));
    function $(s){ return host.querySelector(s) || (LS ? LS.root.querySelector(s) : null); }
    function seg(d){ return '<button type="button" data-d="' + d + '" aria-pressed="false"' + (d === 'none' ? ' aria-label="Not random: someone chooses"' : '') + '>' + esc({ cr: 'Completely random', block: 'Blocked', pairs: 'Matched pairs', none: 'Someone chooses' }[d]) + '</button>'; }
    host.innerHTML = '<section class="bt-problem dr-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Design randomizer</h2>' +
      '<div class="sl-fig dr-fig"><div class="sl-scenebox dr-scenebox"></div><div class="sl-side"><div class="sl-strip dr-strip" aria-hidden="true" hidden></div>' +
      '<p class="sl-legend dr-legend" aria-hidden="true"><span class="dr-lg-t">True effect</span><span class="dr-lg-cur">This experiment</span><span class="dr-lg-dot">Other runs</span></p><div class="sl-meansbox dr-estbox"></div></div></div>' +
      '<div class="sl-ctl dr-ctl"><div class="sl-seg dr-seg" role="group" aria-label="Design"><div class="ls-seg">' + ['cr', 'block', 'pairs'].map(seg).join('') + '</div>' +
      '<div class="sl-seg-b"><span class="sl-seg-k" aria-hidden="true">Not random</span><div class="ls-seg">' + seg('none') + '</div></div></div>' +
      '<div class="bt-buttons sl-btns"><button type="button" class="btn-press ls-pri dr-go">Randomize and run</button><button type="button" class="bt-btn dr-go100" aria-label="Run 100 experiments">Run 100</button></div></div>' +
      '<div class="dr-say"></div>' +
      T.moreHtml('<div class="dr-pick"></div><div class="bt-ctl dr-blind-c"><label class="sl-check"><input type="checkbox" class="dr-unblind"> The volunteers know which pill they took (not blind)</label></div><div class="bt-buttons"><button type="button" class="bt-btn dr-clear">Clear the dots</button></div>', 'experiment, blinding, clear') +
      '<div class="dr-now"></div><div class="dr-table"></div><p class="sr-only dr-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.dr-live'));
    var cue = T.cue('Pick a design, then Randomize and run.');
    $('.dr-ctl').insertBefore(cue.el, $('.dr-ctl').firstChild);
    var pick = T.choiceSelect({ label: 'Experiment', options: scenes.map(function(s, i){ return { value: i, label: s.name }; }), value: 0, onChange: function(v){ setScene(scenes[+v]); } });
    $('.dr-pick').appendChild(pick.el);
    host.querySelectorAll('.dr-seg button').forEach(function(b){ b.addEventListener('click', function(){ act(); stop(); design = b.getAttribute('data-d'); cur = null; sel = -1; syncSeg(); drawScene(); drawEst(); text(); }); });
    $('.dr-go').addEventListener('click', function(){ act(); once(); });
    $('.dr-go100').addEventListener('click', function(){ act(); hundred(); });
    $('.dr-unblind').addEventListener('change', function(e){ act(); stop(); blind = !e.target.checked; cur = null; drawScene(); drawEst(); text(); });
    $('.dr-clear').addEventListener('click', function(){ stop(); rows = {}; cur = null; drawScene(); drawEst(); text(); say('The dots are cleared.'); });
    function act(){ if(!touched){ touched = true; cue.done(); } }
    function key(){ return design + (sc.placebo && !blind ? '-u' : ''); }
    function rowName(k){ var d = k.replace(/-u$/, ''); return D.SHORT[d] + (/-u$/.test(k) ? ', not blind' : ''); }

    function setScene(s){
      stop(); sc = s; U = D.units(sc); L = layout(sc, U); rows = {}; cur = null; sel = -1;
      // the plant heights' scale and the estimate axis, from a quick look at
      // what these units can do
      var r0 = M.rng(31), all = [sc.effect];
      [['cr', false], ['none', false], ['none', true], ['cr', true]].forEach(function(x){ if(x[1] && !sc.placebo) return; all = all.concat(D.many(r0, U, x[0], sc, 200, { unblind: x[1] }).diffs); });
      var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all), tk = P.ticks(lo, hi, 6), stp = tk.length > 1 ? tk[1] - tk[0] : 1;
      dom = [Math.floor(lo / stp) * stp, Math.ceil(hi / stp) * stp];
      var b0 = U.map(function(u){ return u.base; });
      lim = [Math.min.apply(null, b0) - 2, Math.max.apply(null, b0) + sc.effect + (sc.placebo || 0) + 2];
      var bc = $('.dr-blind-c'); if(bc) bc.hidden = !sc.placebo;
      if(!sc.placebo) blind = true;
      syncSeg(); drawScene(); drawEst(); text();
      var sv = LS && LS.root.querySelector('.stat-ls-setup .ls-v'); if(sv) sv.textContent = sc.name;
    }
    function syncSeg(){ [host, LS && LS.root].forEach(function(r){ if(r) r.querySelectorAll('.dr-seg button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-d') === design)); }); }); }
    function drawScene(shown, grow){
      var box = $('.dr-scenebox'); if(!box) return;
      var tr = cur ? cur.tr : null, y = cur && (grow == null || grow > 0) ? cur.res.y : null, on = {};
      if(cur && shown != null) cur.order.slice(0, shown).forEach(function(i){ on[i] = true; });
      var lab = sc.name + ': ' + U.length + ' ' + sc.units + (cur ? ', ' + U.filter(function(u){ return tr[u.i] === 'A'; }).length + ' given ' + sc.tA.toLowerCase() + ' and the rest ' + sc.tB.toLowerCase() : '') + '.';
      var over = [];
      if(design === 'block') L.blocks.forEach(function(b){ over.push('<rect class="dr-block" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="12"/><text class="dr-block-t" x="' + (b.x + 12) + '" y="' + b.ty + '">Block: ' + esc(b.name) + '</text>'); });
      else L.blocks.forEach(function(b){ over.push('<text class="dr-zone" x="' + (b.x + 12) + '" y="' + b.ty + '">' + esc(b.name) + '</text>'); });
      if(design === 'pairs') L.pairs.forEach(function(p){ over.push('<path class="dr-pair" d="M' + p.x + ' ' + (p.y - 6) + ' v 6 h ' + p.w + ' v -6"/>'); });
      box.innerHTML = '<svg class="dr-scene dr-' + sc.kind + '" viewBox="0 0 ' + L.W + ' ' + L.H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(lab) + '"><g aria-hidden="true">' + L.bg + over.join('') +
        U.map(function(u){ var t = tr && (shown == null || on[u.i]) ? tr[u.i] : null; return unitSvg(sc, u, L.at[u.i], t, y ? y[u.i] : null, grow == null ? 1 : grow, lim, {}); }).join('') +
        (sel > -1 ? '<rect class="dr-sel" x="' + (L.at[sel].x + 2) + '" y="' + (L.at[sel].y - (sc.kind === 'plants' ? 190 : 0)) + '" width="' + (L.at[sel].w - 4) + '" height="' + (L.at[sel].h + (sc.kind === 'plants' ? 190 : 0)) + '" rx="10"/>' : '') + '</g></svg>';
      box.querySelector('svg').addEventListener('click', function(e){ var g = e.target.closest('.dr-u'); if(!g) return; act(); sel = +g.getAttribute('data-i'); drawScene(); text(); });
    }
    function drawEst(){
      var box = $('.dr-estbox'); if(!box) return;
      var fig = $('.dr-fig'); if(fig){ var fr = fig.getBoundingClientRect(); fig.classList.toggle('is-wide', fr.width > 1.25 * fr.height && fr.width > 640); }
      var r = box.getBoundingClientRect(), w = Math.round(r.width) || 600, h = Math.round(r.height) || 150;
      var order = []; D.DESIGNS.forEach(function(d){ order.push(d); order.push(d + '-u'); });
      var list = order.filter(function(k){ return rows[k]; }).map(function(k){ return { key: k, name: rowName(k), vals: rows[k].vals, last: rows[k].last }; });
      box.innerHTML = estSvg(list, dom, sc.effect, w, h, { cur: key(), truth: fx(sc.effect, 1) + ' ' + sc.unitOf, axis: 'Estimated effect: mean of A minus mean of B (' + sc.unitOf + ')', empty: 'Estimates land here',
        label: list.length ? 'Dotplot of estimated effects by design: ' + list.map(function(x){ return x.name + ', ' + x.vals.length + ' runs centered at ' + fx(D.mean(x.vals)); }).join('; ') + '. True effect ' + fx(sc.effect) + '.' : 'No runs yet. The true effect is ' + fx(sc.effect) + ' ' + sc.unitOf + '.' });
      strip();
      if(LS){ LS.pills(cur ? [{ k: 'Estimate', html: fx(cur.res.diff, 1), tone: 'readout' }] : [], 'left', 'explore'); LS.pills([{ k: 'True', html: fx(sc.effect, 1), tone: 'ghost' }], 'right', 'explore'); }
    }
    function strip(){
      var el = $('.dr-strip'); if(!el) return;
      if(!cur){ el.hidden = true; el.innerHTML = ''; return; }
      el.hidden = false;
      var b = cur.res.bal, nb = U.filter(function(u){ return u.block === 1; }).length;
      el.innerHTML = '<span class="sl-k">' + esc(sc.lurk.names[1]) + ' ' + esc(sc.units) + '</span><span class="sl-num dr-a">A: ' + b.A + '</span><span class="sl-num dr-b">B: ' + b.B + '</span><span class="sl-k">of ' + nb + '</span>' +
        '<span class="sl-k">Means</span><span class="sl-num dr-a">A ' + fx(cur.res.meanA, 1) + '</span><span class="sl-num dr-b">B ' + fx(cur.res.meanB, 1) + '</span>';
    }
    function add(k, v){ var r = rows[k] || (rows[k] = { vals: [], last: null }); r.vals.push(v); r.last = v; }
    function experiment(){ var tr = D.assign(rng, U, design, sc), res = D.run(rng, U, tr, sc, { unblind: !!sc.placebo && !blind }); var order = M.shuffle(rng, U.map(function(u){ return u.i; })); return { tr: tr, res: res, order: order, key: key(), design: design }; }
    function once(){
      stop();
      cur = experiment(); sel = -1;
      var N = U.length;
      if(T.reduced()){ add(cur.key, cur.res.diff); drawScene(); drawEst(); text(); return; }
      var shown = 0, per = Math.min(0.07, 1.1 / N);
      text(true);
      anim = P.loop(function(dt, t){
        if(t < N * per){ var k = Math.min(N, Math.floor(t / per) + 1); if(k !== shown){ shown = k; drawScene(k, 0); } return true; }
        var g = Math.min(1, (t - N * per) / 0.9); drawScene(null, g < 0.05 ? 0.05 : g); return g < 1;
      }, { onEnd: function(){ anim = null; add(cur.key, cur.res.diff); drawScene(); drawEst(); text(); } });
      anim.start();
    }
    function hundred(){
      stop();
      var last = null;
      for(var j = 0; j < 100; j++){ last = experiment(); add(last.key, last.res.diff); }
      cur = last; sel = -1; drawScene(); drawEst(); text();
      say('100 experiments run. ' + summary(key()));
    }
    function stop(){ if(anim){ anim.stop(); anim = null; if(cur){ add(cur.key, cur.res.diff); drawScene(); drawEst(); } } }
    function summary(k){
      var r = rows[k]; if(!r || r.vals.length < 2) return '';
      var c = D.mean(r.vals), s = D.sd(r.vals), off = c - sc.effect;
      return rowName(k) + ': ' + r.vals.length + ' estimates centered at ' + fx(c, 1) + ' (true ' + fx(sc.effect, 1) + '), SD ' + fx(s) + '. ' +
        (r.vals.length >= 20 ? (Math.abs(off) > 3 * s / Math.sqrt(r.vals.length) && Math.abs(off) > 0.3 ? 'Centered ' + (off > 0 ? 'above' : 'below') + ' the true effect: ' + (/-u$/.test(k) ? 'the placebo effect is mixed in.' : 'confounded.') : 'Centered on the true effect.') : 'Run more to see the center.');
    }
    function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
    function text(running){
      var head, tail;
      if(sel > -1){ var u = U[sel]; head = cap(sc.unit) + ' ' + u.label + ' (' + sc.lurk.names[u.block].toLowerCase() + (u.age != null ? ', age ' + u.age : '') + ')' + (cur ? ': ' + (cur.tr[sel] === 'A' ? sc.tA : sc.tB) + ', ' + fx(cur.res.y[sel], sc.decimals) + ' ' + sc.unitOf + '.' : '.'); tail = cur ? '' : 'Randomize to give it a treatment.'; }
      else if(!cur){ head = U.length + ' ' + sc.units + ': ' + sc.tA + ' (A) or ' + sc.tB + ' (B)?'; tail = 'Pick a design, then randomize and run.'; }
      else if(running){ head = 'Assigning treatments by chance…'; tail = ''; }
      else { head = 'Estimated effect ' + fx(cur.res.diff, 1) + ' ' + sc.unitOf + ' (A ' + fx(cur.res.meanA, 1) + ', B ' + fx(cur.res.meanB, 1) + ').'; tail = rows[cur.key] && rows[cur.key].vals.length >= 20 ? summary(cur.key).split('. ').slice(-1)[0] : 'The true effect is ' + fx(sc.effect, 1) + '. Run 100 to see the pattern.'; }
      T.explain($('.dr-say'), '<b>' + esc(head) + '</b> ' + esc(tail), why());
      if(LS) LS.caption('<b>' + esc(head) + '</b> ' + esc(tail), 'explore');
      nowBox(); tableBox();
      if(!running) say(head + ' ' + tail);
    }
    function why(){
      var HOW = {
        cr: 'Chance alone splits the ' + U.length + ' ' + sc.units + ' in half: label them 1 to ' + U.length + ', pick ' + U.length / 2 + ' different random labels for ' + sc.tA.toLowerCase() + ', the rest get ' + sc.tB.toLowerCase() + '. ' + cap(sc.lurk.what) + ' ends up roughly balanced, but not exactly: that is why the estimates spread.',
        block: 'Split by ' + sc.lurk.what + ' first (' + sc.lurk.names.join(' and ').toLowerCase() + '), then randomize half of each block to each treatment. ' + sc.blockWhy + ' The balance is exact every time, so the estimates vary less.',
        pairs: 'Pair neighbors in the same block; a coin flip in each pair decides which one gets ' + sc.tA.toLowerCase() + '. ' + sc.pairWhy + ' Another form of matched pairs gives each unit both treatments, in random order.',
        none: sc.none.note + ' ' + sc.noneWhy + ' Without random assignment there is no cause and effect conclusion.'
      };
      var w = '<p>' + esc(HOW[design]) + '</p><p><b>Reading the dots.</b> Each dot is one experiment’s estimate of the treatment effect. The dashed line is the true effect built into the simulation. Random assignment centers the dots on it (no bias); blocking and pairing make them hug it (less variability); a person choosing pushes them off it (confounding).</p>';
      if(sc.placebo) w += '<p><b>Blinding.</b> ' + esc(sc.blindWhy) + ' Turn on "The volunteers know which pill they took" under ' + esc('Numbers & setup') + ' to see it.</p>';
      w += '<p>Random assignment allows a cause and effect conclusion. Generalizing to a larger population needs random sampling, which these volunteers and plants did not have.</p>';
      return w;
    }
    function nowBox(){
      var el = $('.dr-now'); if(!el) return;
      if(!cur){ el.innerHTML = '<h3 class="ls-title-l">This experiment</h3><p class="bt-small">Not run yet.</p>'; return; }
      var tr = cur.tr, y = cur.res.y;
      el.innerHTML = '<h3 class="ls-title-l">This experiment: ' + esc(D.NAME[cur.design]) + '</h3>' +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Each unit, its treatment and response"><table class="ls-tbl"><thead><tr><th scope="col">' + esc(cap(sc.unit)) + '</th><th scope="col">' + esc(cap(sc.lurk.what)) + '</th><th scope="col">Treatment</th><th scope="col">' + esc(cap(sc.unitOf)) + '</th></tr></thead><tbody>' +
        U.map(function(u){ return '<tr><th scope="row">' + u.label + '</th><td>' + esc(sc.lurk.names[u.block]) + (u.age != null ? ' (' + u.age + ')' : '') + '</td><td>' + (tr[u.i] === 'A' ? 'A: ' + esc(sc.tA) : 'B: ' + esc(sc.tB)) + '</td><td class="r">' + fx(y[u.i], sc.decimals) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<p class="bt-small">Mean of A ' + fx(cur.res.meanA) + ', mean of B ' + fx(cur.res.meanB) + ': estimate ' + fx(cur.res.diff) + ' ' + esc(sc.unitOf) + '. True effect ' + fx(sc.effect) + '.</p>';
    }
    function tableBox(){
      var el = $('.dr-table'); if(!el) return;
      var ks = Object.keys(rows);
      el.innerHTML = '<h3 class="ls-title-l">Every design so far</h3>' + (ks.length ? '<div class="table-wrap" tabindex="0" role="region" aria-label="Estimates by design"><table class="ls-tbl"><thead><tr><th scope="col">Design</th><th scope="col">Runs</th><th scope="col">Mean estimate</th><th scope="col">SD</th></tr></thead><tbody>' +
        ks.map(function(k){ var r = rows[k]; return '<tr' + (k === key() ? ' class="hl"' : '') + '><th scope="row">' + esc(rowName(k)) + '</th><td class="r">' + r.vals.length + '</td><td class="r">' + fx(D.mean(r.vals)) + '</td><td class="r">' + (r.vals.length > 1 ? fx(D.sd(r.vals)) : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="bt-small">No runs yet.</p>');
    }
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.dr-fig')], dock: [$('.dr-ctl')], setup: 'Experiment', moreLabel: 'Experiment, blinding and the dots', why: [$('.dr-say')], details: [$('.dr-now'), $('.dr-table')] });
      sp.setup(sc.name);
      syncSeg(); drawEst(); text();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.dr-go'), text: 'Randomize and run' });
      watch();
    }
    function watch(){ var el = $('.dr-estbox'); if(window.ResizeObserver && el){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(drawEst, 60); }).observe(el); } }
    setScene(scenes[0]);
    if(!window.LevlStudio) watch();
    return { stop: function(){ if(anim){ anim.stop(); anim = null; } }, studio: studio };
  }

  /* A scope problem's picture, once its first step is answered: the 2 x 2
     table of what random sampling and random assignment allow, with this
     study's cell marked (feedback on the stage, never before the answer). */
  function qfig(el, p, show){
    if(!el) return;
    if(p.type !== 'scope' || !show){ el.innerHTML = ''; return; }
    var f = p.figure, cell = function(s, a, t){ return '<td' + (s === f.sampled && a === f.assigned ? ' class="is-here"' : '') + '>' + t + (s === f.sampled && a === f.assigned ? ' <b>This study</b>' : '') + '</td>'; };
    el.innerHTML = '<figure class="dr-scope"><table class="dr-scope-t"><caption>What a study allows</caption><thead><tr><th scope="col"><span class="sr-only">How units were chosen</span></th><th scope="col">Random assignment</th><th scope="col">No random assignment</th></tr></thead><tbody>' +
      '<tr><th scope="row">Random sample</th>' + cell(true, true, 'Cause and effect, and generalize') + cell(true, false, 'Generalize, but no cause and effect') + '</tr>' +
      '<tr><th scope="row">No random sample</th>' + cell(false, true, 'Cause and effect, for units like these') + cell(false, false, 'Neither') + '</tr></tbody></table></figure>';
  }
})();
