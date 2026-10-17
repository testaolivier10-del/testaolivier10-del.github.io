/* Chi-square lab (simulator; docs/apstat-spec.md section 6). OWNED BY THIS TOOL
   ONLY. The model is ApStatMath.chiSquareLab (statistics/assets/tools/math/
   chi-square-lab.js); every expected count, component, χ² and p-value comes
   from ApStatDist through it; math text is ApStatTex; the frame is
   ApStatTools.modes on the Tool Studio. Styles: chi-square-lab.css.

   Explore: one stage, two linked pictures. Top: the two-way table, each cell
   with its observed count, its expected count and a heat color for its
   component (O - E)²/E, orange where O is above E and blue where it is below;
   row and column totals. Bottom: the χ² distribution for the table's df,
   the statistic marked, the p-value shaded, and a stacked bar along the axis
   made of the cells' components (the selected cell outlined in both
   pictures). Tap a cell and change its count (slider, − / +, or arrow keys
   on the cell); "Chance table" draws a table from H0 itself; "Step by step"
   hides the expected counts and fills them one cell at a time with the
   formula; the test switch (homogeneity or independence) changes the
   hypotheses and the conclusion and says when it does not fit the design.

   Test yourself: ApStatTools.drill on chiSquareLab.generate (an expected
   count, its component, df, χ², the p-value, the decision and the
   conclusion; or the test, its hypotheses and the expected counts
   condition). The table is on the stage and fills in as the steps are
   answered. */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath;
  if(!T || !M || !M.chiSquareLab) return;
  var CS = M.chiSquareLab, esc = T.esc, SLUG = 'chi-square-lab';
  var uid = 0;
  function D(){ return window.ApStatDist; }
  function TX(){ return window.ApStatTex; }
  function tx(s){ return TX() ? TX().html(String(s), { wrap: true }) : esc(s); }
  function F(x, d){ return T.F(x, d); }
  function P4(p){ return CS.P4(p); }
  // A p-value in a sentence or after "=": "< 0.0001" reads as words there.
  function PW(p){ var s = P4(p); return s.charAt(0) === '<' ? 'less than 0.0001' : s; }
  function PEQ(p){ var s = P4(p); return s.charAt(0) === '<' ? s : '= ' + s; }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function f2(v){ return (Math.round(v * 10) / 10).toFixed(1); }
  function txt(x, y, t, cls, anchor){ return '<text x="' + f2(x) + '" y="' + f2(y) + '" class="' + (cls || '') + '" text-anchor="' + (anchor || 'middle') + '">' + esc(t) + '</text>'; }
  // A label in at most two lines that fit width w (font about 7 px a letter).
  function wrap(x, y, t, w, cls, anchor, lh){
    var per = Math.max(4, Math.floor(w / 6.8)), words = String(t).split(' '), lines = [], cur = '';
    words.forEach(function(wd){ if((cur + ' ' + wd).trim().length > per && cur){ lines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); });
    if(cur) lines.push(cur);
    if(lines.length > 2){ lines = [lines[0], lines.slice(1).join(' ')]; if(lines[1].length > per) lines[1] = lines[1].slice(0, per - 1) + '…'; }
    lh = lh || 13;
    var y0 = y - (lines.length - 1) * lh / 2;
    return '<text class="' + (cls || '') + '" text-anchor="' + (anchor || 'middle') + '">' + lines.map(function(l, i){ return '<tspan x="' + f2(x) + '" y="' + f2(y0 + i * lh) + '">' + esc(l) + '</tspan>'; }).join('') + '</text>';
  }

  /* ================================================================ drawing */
  /* v: { obs, rows, cols, sel: [i, j] | null, showE: number of cells whose E
     is shown (Infinity = all), showComp: bool, curve: bool, W, H, alpha,
     rowVar, colVar } -> { svg, cells: [{ i, j, x, y, w, h }], tableH } */
  function figure(v){
    var obs = v.obs, R = obs.length, C = obs[0].length, W = v.W, H = v.H, small = W < 520;
    var t = CS.table(obs), all = R * C;
    var labW = Math.min(small ? 92 : 170, Math.max(70, W * 0.24)), totW = small ? 44 : 64, pad = small ? 4 : 12;
    var cw = (W - pad * 2 - labW - totW) / C, headH = small ? 34 : 38, ch = (small ? 46 : Math.min(58, Math.max(46, (H * 0.5 - headH) / (R + 1)))) + (v.compText ? 12 : 0);
    // Without the curve the table has the stage: bigger cells, centered.
    if(!v.curve) ch = Math.max(ch, Math.min(small ? 70 : 84, (H - headH - 12) / (R + 1)));
    var x0 = pad + labW, y0 = v.curve ? 4 : Math.max(4, (H - headH - ch * (R + 1)) / 2), out = [], cells = [], maxComp = 0, i, j;
    for(i = 0; i < R; i++) for(j = 0; j < C; j++) maxComp = Math.max(maxComp, t.components[i][j]);
    var scale = Math.max(maxComp, 2);
    // header
    for(j = 0; j < C; j++) out.push(wrap(x0 + cw * (j + 0.5), y0 + headH / 2 + 2, v.cols[j], cw - 4, 'cs-ch'));
    out.push(txt(x0 + C * cw + totW / 2, y0 + headH / 2 + 5, 'Total', 'cs-ch cs-tot'));
    var order = 0;
    for(i = 0; i < R; i++){
      var y = y0 + headH + i * ch;
      out.push(wrap(pad + labW - 10, y + ch / 2 + 4, v.rows[i], labW - 14, 'cs-rh', 'end'));
      for(j = 0; j < C; j++){
        var x = x0 + j * cw, shown = order < v.showE, comp = t.components[i][j], sg = t.signs[i][j];
        var heat = v.showComp && shown ? Math.min(1, comp / scale) : 0, sel = v.sel && v.sel[0] === i && v.sel[1] === j;
        out.push('<g class="cs-cell' + (sel ? ' is-sel' : '') + '" data-i="' + i + '" data-j="' + j + '"' + (v.interactive ? ' tabindex="0" role="button" aria-pressed="' + sel + '" aria-label="' + esc(v.rows[i] + ', ' + v.cols[j] + ': observed ' + obs[i][j] + (shown ? ', expected ' + F(t.expected[i][j], 1) : '') + (v.showComp && shown ? ', component ' + F(comp, 2) : '')) + '"' : '') + '>' +
          '<rect class="cs-box" x="' + f2(x + 2) + '" y="' + f2(y + 2) + '" width="' + f2(cw - 4) + '" height="' + f2(ch - 4) + '" rx="8"/>' +
          (heat > 0 ? '<rect class="cs-heat ' + (sg > 0 ? 'is-up' : 'is-down') + '" x="' + f2(x + 2) + '" y="' + f2(y + 2) + '" width="' + f2(cw - 4) + '" height="' + f2(ch - 4) + '" rx="8" style="fill-opacity:' + (0.12 + 0.6 * heat).toFixed(2) + '"/>' : '') +
          txt(x + cw / 2, y + ch / 2 + (shown ? (v.compText && v.showComp ? -7 : -1) : 6), String(obs[i][j]), 'cs-o') +
          (shown ? txt(x + cw / 2, y + ch / 2 + (v.compText && v.showComp ? 9 : 15), (small ? '' : 'E ') + F(t.expected[i][j], 2), 'cs-e') : '') +
          (shown && v.compText && v.showComp ? txt(x + cw / 2, y + ch / 2 + 22, (small ? '' : 'part ') + F(comp, 3), 'cs-cmp') : '') +
          (sel ? '<rect class="cs-selr" x="' + f2(x + 1) + '" y="' + f2(y + 1) + '" width="' + f2(cw - 2) + '" height="' + f2(ch - 2) + '" rx="9"/>' : '') + '</g>');
        cells.push({ i: i, j: j, x: x, y: y, w: cw, h: ch });
        order++;
      }
      out.push(txt(x0 + C * cw + totW / 2, y + ch / 2 + 5, String(t.rowTotals[i]), 'cs-t'));
    }
    var yT = y0 + headH + R * ch;
    out.push('<line class="cs-rule" x1="' + f2(pad) + '" y1="' + f2(yT + 2) + '" x2="' + f2(W - pad) + '" y2="' + f2(yT + 2) + '"/>');
    out.push(txt(pad + labW - 8, yT + ch / 2 + 6, 'Total', 'cs-rh cs-tot', 'end'));
    for(j = 0; j < C; j++) out.push(txt(x0 + cw * (j + 0.5), yT + ch / 2 + 6, String(t.colTotals[j]), 'cs-t'));
    out.push(txt(x0 + C * cw + totW / 2, yT + ch / 2 + 6, String(t.total), 'cs-t cs-gt'));
    var tableH = yT + ch;
    // the chi-square curve
    if(v.curve && H - tableH > 110){
      var top = tableH + 14, cb = H - (small ? 30 : 34), lft = pad + 6, rgt = W - (v.noEnl ? pad + 6 : 52);
      var df = t.df, crit = D().invChi2(1 - (v.alpha || 0.05), df), xmax = Math.max(crit * 1.45, Math.min(t.chi2 * 1.12, crit * 3), df + 3 * Math.sqrt(2 * df));
      var full = v.showComp && v.showE >= all, chi = t.chi2;
      var f = function(x){ return D().chi2Pdf(x, df); }, peak = 0, k;
      for(k = 1; k <= 200; k++){ var fx = f(xmax * k / 200); if(isFinite(fx) && fx > peak) peak = fx; }
      if(df <= 2) peak = Math.min(peak, f(xmax * 0.05));
      var sx = function(x){ return lft + x / xmax * (rgt - lft); }, sy = function(y){ return cb - 14 - Math.min(1.05, y / (peak * 1.15)) * (cb - 14 - top - 18); };
      var path = '', area = '';
      for(k = 0; k <= 200; k++){ var xx = xmax * Math.max(0.0005, k / 200), yy = f(xx); if(!isFinite(yy)) continue; path += (path ? 'L' : 'M') + f2(sx(xx)) + ' ' + f2(sy(yy)); }
      if(full && chi < xmax){
        area = 'M' + f2(sx(chi)) + ' ' + f2(sy(0));
        for(k = 0; k <= 80; k++){ var xa = chi + (xmax - chi) * k / 80; area += 'L' + f2(sx(xa)) + ' ' + f2(sy(f(xa))); }
        area += 'L' + f2(sx(xmax)) + ' ' + f2(sy(0)) + 'Z';
        out.push('<path class="cs-pshade" d="' + area + '"/>');
      }
      out.push('<path class="cs-curve" d="' + path + '"/>');
      // critical value at alpha
      out.push('<line class="cs-crit" x1="' + f2(sx(crit)) + '" y1="' + f2(top + 30) + '" x2="' + f2(sx(crit)) + '" y2="' + f2(sy(0)) + '"/>' + txt(sx(crit) + 4, top + 44, (small ? '' : 'α = ' + (v.alpha || 0.05) + ' cutoff ') + F(crit, 2), 'cs-critl', 'start'));
      // stacked components meter along the axis
      var my = sy(0), mh = 10, acc = 0;
      if(full){
        for(i = 0; i < R; i++) for(j = 0; j < C; j++){
          var c0 = t.components[i][j], a0 = acc, a1 = Math.min(xmax, acc + c0); acc += c0;
          if(a0 >= xmax || a1 - a0 <= 0) continue;
          var isSel = v.sel && v.sel[0] === i && v.sel[1] === j;
          out.push('<rect class="cs-seg ' + (t.signs[i][j] > 0 ? 'is-up' : 'is-down') + (isSel ? ' is-sel' : '') + '" x="' + f2(sx(a0)) + '" y="' + f2(my - mh) + '" width="' + f2(Math.max(0.5, sx(a1) - sx(a0))) + '" height="' + mh + '"/>');
        }
      }
      out.push('<line class="cs-axis" x1="' + f2(lft) + '" y1="' + f2(my) + '" x2="' + f2(rgt) + '" y2="' + f2(my) + '"/>');
      var st = xmax > 40 ? 10 : xmax > 16 ? 5 : xmax > 7 ? 2 : 1;
      for(k = 0; k <= xmax + 1e-9; k += st){ var tx0 = sx(k); out.push('<line class="cs-tick" x1="' + f2(tx0) + '" y1="' + f2(my) + '" x2="' + f2(tx0) + '" y2="' + f2(my + 5) + '"/>' + txt(tx0, my + 18, String(k), 'cs-tl')); }
      out.push(txt(rgt, top + 4, 'χ² with df = ' + df, 'cs-dfl', 'end'));
      if(full){
        var mx = sx(Math.min(chi, xmax));
        out.push('<line class="cs-obs" x1="' + f2(mx) + '" y1="' + f2(top + 26) + '" x2="' + f2(mx) + '" y2="' + f2(my) + '"/>');
        var lbl = 'χ² = ' + F(chi, 2) + (chi > xmax ? ' →' : ''), tw = lbl.length * 7.4 + 16, tl = Math.max(2, Math.min(W - 2 - tw, mx - tw / 2));
        out.push('<g class="cs-tag"><rect x="' + f2(tl) + '" y="' + f2(top + 4) + '" width="' + f2(tw) + '" height="22" rx="11"/>' + txt(tl + tw / 2, top + 19, lbl) + '</g>');
      } else out.push(txt((lft + rgt) / 2, (top + my) / 2, 'χ² appears when every expected count is filled in', 'cs-wait'));
    }
    return { svg: out.join(''), cells: cells, tableH: tableH, t: t };
  }

  // The problem text is also the plain caption: H₀ and Hₐ read as letters there.
  function hText(t){ return String(t).replace(/\$H_0\$/g, 'H₀').replace(/\$H_a\$/g, 'Hₐ').replace(/\$H_0: /g, 'H₀: $').replace(/\$H_a: /g, 'Hₐ: $'); }
  function texify(p){
    var q = {}; for(var k in p) q[k] = p[k];
    q.text = tx(hText(p.text)); q.solution = p.solution.map(tx);
    q.steps = p.steps.map(function(s){
      var t = {}; for(var k2 in s) t[k2] = s[k2];
      t.label = tx(s.label); if(s.hint) t.hint = tx(s.hint);
      if(s.options) t.options = s.options.map(tx);
      if(s.why) t.why = s.why.map(tx);
      if(s.cell){ t.cell = {}; for(var k3 in s.cell) t.cell[k3] = s.cell[k3]; t.cell.mistakes = s.cell.mistakes.map(function(m){ return { value: m.value, why: tx(m.why) }; }); }
      return t;
    });
    return q;
  }
  function fit(box, draw){
    var w0 = 0, h0 = 0, pending = false;
    function go(){ pending = false; var w = Math.round(box.clientWidth), h = Math.round(box.clientHeight); if(w < 50 || h < 50) return; if(w === w0 && h === h0) return; w0 = w; h0 = h; draw(w, h); }
    function later(){ if(pending) return; pending = true; (window.requestAnimationFrame || setTimeout)(go); }
    if(window.ResizeObserver) new ResizeObserver(later).observe(box);
    window.addEventListener('resize', later);
    later();
    return { redraw: function(){ if(w0) draw(w0, h0); }, size: function(){ return [w0, h0]; } };
  }
  function seg(label, items, value, onPick){
    var g = el('div', 'cs-segw');
    g.innerHTML = '<span class="cs-seglab" aria-hidden="true">' + label + '</span><div class="ls-seg cs-seg" role="group" aria-label="' + esc(label) + '">' + items.map(function(it){
      return '<button type="button" data-v="' + esc(it.value) + '" aria-pressed="' + (it.value === value) + '">' + it.label + '</button>';
    }).join('') + '</div>';
    g.addEventListener('click', function(e){ var b = e.target.closest('button[data-v]'); if(!b) return; set(b.getAttribute('data-v')); onPick(b.getAttribute('data-v')); });
    function set(v){ g.querySelectorAll('button[data-v]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === String(v))); }); }
    return { el: g, set: set };
  }

  /* ================================================================ EXPLORE */
  function explore(host, data){
    var id = 'cs' + (++uid), studies = (data.explore && data.explore.studies) || [];
    if(!studies.length){ host.innerHTML = '<p class="bt-small">The explore studies arrive with their unit.</p>'; return { studio: function(){} }; }
    var S = { st: null, obs: null, sel: [0, 0], test: 'homogeneity', walk: -1, alpha: 0.05, touched: false, seed: 1 };
    host.innerHTML = '<section class="bt-problem cs-ex" aria-labelledby="' + id + '-h"><h2 id="' + id + '-h" class="sr-only">Explore: a chi-square test from a two-way table</h2>' +
      '<div class="cs-stage"><div class="cs-fig"><svg class="cs-svg" role="group" aria-labelledby="' + id + '-t"><title id="' + id + '-t">Two-way table and chi-square distribution</title><g class="cs-layer"></g></svg></div><p class="sr-only cs-live"></p></div>' +
      '<div class="cs-dock"><div class="cs-cellbox"></div><div class="cs-btns"></div><div class="cs-testbox"></div></div>' +
      '<div class="cs-why"></div><div class="cs-det"></div></section>';
    var LS = null;
    var q = function(s){ return host.querySelector(s) || (LS ? LS.root.querySelector(s) : null); };
    var svg = q('.cs-svg'), layer = q('.cs-layer'), live = T.announcer(q('.cs-live'));
    var start = T.cue('Tap a cell and change its count: watch its expected count, its share of χ² and the p-value.');
    q('.cs-dock').insertBefore(start.el, q('.cs-dock').firstChild);
    function act(){ if(!S.touched){ S.touched = true; start.done(); } }

    var cellSl = null;
    function buildCell(){
      var i = S.sel[0], j = S.sel[1], v = S.obs[i][j], mx = Math.max(60, Math.ceil(Math.max.apply(null, S.obs.map(function(r){ return Math.max.apply(null, r); })) * 1.6 / 10) * 10);
      cellSl = T.slider({ label: 'Observed count: ' + S.st.rows[i] + ', ' + S.st.cols[j], min: 0, max: mx, step: 1, value: v, onInput: function(x){ act(); setCount(i, j, x); } });
      var box = q('.cs-cellbox'); box.innerHTML = ''; box.appendChild(cellSl.el);
    }
    function setCount(i, j, x){
      x = Math.max(0, Math.round(x));
      var trial = S.obs.map(function(r){ return r.slice(); }); trial[i][j] = x;
      // Keep every row and column total positive (an expected count must exist).
      var t = D().chi2table(trial);
      if(!(t.minExpected > 0)){ if(cellSl) cellSl.set(S.obs[i][j]); return; }
      S.obs = trial; draw();
    }
    var bChance = el('button', 'bt-btn cs-chance', 'Chance table'), bReset = el('button', 'bt-btn cs-reset', 'Reset'), bWalk = el('button', 'bt-btn cs-walk', 'Step by step');
    [bChance, bWalk, bReset].forEach(function(b){ b.type = 'button'; q('.cs-btns').appendChild(b); });
    bChance.setAttribute('aria-describedby', id + '-cd');
    q('.cs-btns').insertAdjacentHTML('beforeend', '<span class="sr-only" id="' + id + '-cd">Draws a new table from the null hypothesis: each row keeps its total.</span>');
    bChance.addEventListener('click', function(){ act(); S.walk = -1; walkBtn(); var r = M.rng(S.seed++ * 7919 + 17); S.obs = CS.chance(r, S.obs); buildCell(); draw(); say(true); });
    bReset.addEventListener('click', function(){ act(); setSt(S.st); });
    bWalk.addEventListener('click', function(){
      act();
      var all = S.obs.length * S.obs[0].length;
      if(S.walk < 0) S.walk = 1; else if(S.walk < all) S.walk++; else S.walk = -1;
      walkBtn(); draw();
      if(S.walk > 0) sayWalk();
    });
    function walkBtn(){
      var all = S.obs.length * S.obs[0].length;
      bWalk.textContent = S.walk < 0 ? 'Step by step' : S.walk < all ? 'Next expected count (' + S.walk + ' of ' + all + ')' : 'Done: show χ²';
      bWalk.setAttribute('aria-pressed', String(S.walk >= 0));
    }
    var testSeg = seg('Which test?', [{ value: 'homogeneity', label: 'Homogeneity' }, { value: 'independence', label: 'Independence' }], 'homogeneity', function(v){ act(); S.test = v; draw(); });
    q('.cs-testbox').appendChild(testSeg.el);

    /* --- Details --- */
    var det = q('.cs-det');
    det.innerHTML = '<h3 class="ls-title-l">The study</h3><div class="cs-pick"></div><p class="bt-small cs-story"></p><div class="cs-ad"></div><h3 class="ls-title-l">Every number</h3><div class="cs-nums"></div>';
    var pick = T.choiceSelect({ label: 'Study', options: studies.map(function(s){ return { value: s.id, label: s.name }; }), value: studies[0].id, onChange: function(v){ act(); setSt(studies.filter(function(s){ return s.id === v; })[0]); } });
    det.querySelector('.cs-pick').appendChild(pick.el);
    var aSeg = seg('Significance level α', [{ value: '0.01', label: '0.01' }, { value: '0.05', label: '0.05' }, { value: '0.1', label: '0.10' }], '0.05', function(v){ act(); S.alpha = +v; draw(); });
    det.querySelector('.cs-ad').appendChild(aSeg.el);

    function setSt(st){
      S.st = st; S.obs = st.obs.map(function(r){ return r.slice(); }); S.sel = [0, 0]; S.walk = -1; S.test = st.design;
      testSeg.set(S.test); pick.set(st.id); walkBtn();
      det.querySelector('.cs-story').textContent = st.story;
      buildCell(); draw();
    }

    /* --- the stage: tap a cell, arrow keys on a cell --- */
    var cells = [];
    function selectCell(i, j, focus){
      S.sel = [i, j]; buildCell(); draw();
      if(focus){ var g = layer.querySelector('.cs-cell[data-i="' + i + '"][data-j="' + j + '"]'); if(g) g.focus(); }
    }
    layer.addEventListener('click', function(e){ var g = e.target.closest('.cs-cell'); if(!g) return; act(); selectCell(+g.getAttribute('data-i'), +g.getAttribute('data-j'), true); say(true); });
    layer.addEventListener('keydown', function(e){
      var g = e.target.closest('.cs-cell'); if(!g) return;
      var i = +g.getAttribute('data-i'), j = +g.getAttribute('data-j'), k = e.key;
      if(k === 'Enter' || k === ' '){ e.preventDefault(); act(); selectCell(i, j, true); say(true); return; }
      if(k === 'ArrowUp' || k === 'ArrowDown'){ e.preventDefault(); act(); if(S.sel[0] !== i || S.sel[1] !== j) S.sel = [i, j]; setCount(i, j, S.obs[i][j] + (k === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1)); buildCell(); var g2 = layer.querySelector('.cs-cell[data-i="' + i + '"][data-j="' + j + '"]'); if(g2) g2.focus(); say(); return; }
      if(k === 'ArrowRight' || k === 'ArrowLeft'){ e.preventDefault(); var C = S.obs[0].length, R = S.obs.length, n = i * C + j + (k === 'ArrowRight' ? 1 : -1); n = (n + R * C) % (R * C); selectCell(Math.floor(n / C), n % C, true); }
    });

    var sized = null;
    function draw(){
      if(!sized) return;
      var wh = sized.size(); if(!wh[0]) return;
      var W = wh[0], H = wh[1], all = S.obs.length * S.obs[0].length;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      var f = figure({ obs: S.obs, rows: S.st.rows, cols: S.st.cols, sel: S.sel, showE: S.walk < 0 ? Infinity : S.walk, showComp: S.walk < 0 || S.walk >= all, curve: true, W: W, H: H, alpha: S.alpha, interactive: true });
      var had = document.activeElement && layer.contains(document.activeElement) ? [document.activeElement.getAttribute('data-i'), document.activeElement.getAttribute('data-j')] : null;
      layer.innerHTML = f.svg; cells = f.cells;
      if(had){ var g = layer.querySelector('.cs-cell[data-i="' + had[0] + '"][data-j="' + had[1] + '"]'); if(g) g.focus(); }
      tell(f.t);
    }
    function tell(t){
      var all = S.obs.length * S.obs[0].length, walking = S.walk >= 0 && S.walk < all;
      if(!LS){ numbers(t); why(t); return; }
      if(walking){ sayWalk(); LS.pills([{ k: 'Expected counts', html: S.walk + ' of ' + all, tone: 'ghost' }], 'left', 'explore'); numbers(t); why(t); return; }
      var big = [0, 0], bv = -1;
      for(var i = 0; i < S.obs.length; i++) for(var j = 0; j < S.obs[0].length; j++) if(t.components[i][j] > bv){ bv = t.components[i][j]; big = [i, j]; }
      var rej = t.p < S.alpha, bi = big[0], bj = big[1];
      LS.caption('χ² = <b>' + F(t.chi2, 2) + '</b> with df = ' + t.df + ': p-value <b>' + P4(t.p) + '</b>. The largest share, ' + F(bv, 2) + ', comes from ' + esc(S.st.rows[bi] + ', ' + S.st.cols[bj]) + ' (observed ' + S.obs[bi][bj] + ', expected ' + F(t.expected[bi][bj], 1) + ').', 'explore');
      var pills = [{ k: 'χ²', html: F(t.chi2, 2), tone: 'readout' }, { k: 'df', html: String(t.df), tone: 'ghost' }, { k: 'p-value', html: P4(t.p), tone: rej ? 'good' : 'warn' }];
      if(!t.ok) pills.push({ html: 'An expected count is below 5', tone: 'bad' });
      else if(S.test !== S.st.design) pills.push({ html: 'Check the test', tone: 'bad' });
      LS.pills(pills, 'left', 'explore');
      numbers(t); why(t);
    }
    function sayWalk(){
      var C = S.obs[0].length, n = S.walk - 1, i = Math.floor(n / C), j = n % C, t = CS.table(S.obs);
      var cap = tx('Expected count for <b>' + esc(S.st.rows[i] + ', ' + S.st.cols[j]) + '</b>: $\\frac{(' + t.rowTotals[i] + ')(' + t.colTotals[j] + ')}{' + t.total + '} = ' + F(t.expected[i][j], 2) + '$ (row total times column total over the grand total).');
      if(LS) LS.caption(cap, 'explore');
      live(S.st.rows[i] + ', ' + S.st.cols[j] + ': expected ' + t.rowTotals[i] + ' times ' + t.colTotals[j] + ' over ' + t.total + ' equals ' + F(t.expected[i][j], 2) + '.', true);
    }
    function say(now){
      var t = CS.table(S.obs), i = S.sel[0], j = S.sel[1];
      live(S.st.rows[i] + ', ' + S.st.cols[j] + ': observed ' + S.obs[i][j] + ', expected ' + F(t.expected[i][j], 1) + ', component ' + F(t.components[i][j], 2) + '. Chi-square ' + F(t.chi2, 2) + ', df ' + t.df + ', p-value ' + P4(t.p) + '.', now);
    }

    function openWhy(){ var d = whyEl.querySelector('details.bt-why'); if(d) d.open = true; }
    var whyEl = q('.cs-why');
    function why(t){
      var st = S.st, rej = t.p < S.alpha, c = { design: S.test, rowVar: st.rowVar, colVar: st.colVar, pop: st.pop, groups: st.groups }, h = CS.hyp(c);
      var fitNote = S.test === st.design ? '' : '<p class="cs-warn"><b>This study calls for the other test.</b> ' + (st.design === 'independence' ? 'It took one random sample and classified each person on two variables: a test for independence (no association).' : 'It compared separate samples or treatment groups on one variable: a test for homogeneity (the same distribution).') + ' The arithmetic is identical; the hypotheses and the conclusion change.</p>';
      var body = fitNote +
        '<p><b>Hypotheses.</b> ' + tx('$H_0$: ' + h.h0 + ' $H_a$: ' + h.ha) + '</p>' +
        '<p><b>Expected counts.</b> ' + tx('If $H_0$ is true, each cell should hold $\\frac{(\\text{row total})(\\text{column total})}{\\text{grand total}}$. The smallest here is ' + F(t.minExpected, 2) + (t.ok ? ', at least 5, so the large counts condition is met.' : ': below 5, so the chi-square distribution may not fit.')) + '</p>' +
        '<p><b>The statistic.</b> ' + tx('$\\chi^2 = \\sum \\frac{(O - E)^2}{E} = ' + F(t.chi2, 2) + '$; each colored segment of the bar on the axis is one cell\'s share. Orange cells hold more than expected, blue fewer.') + '</p>' +
        '<p><b>Decide and conclude.</b> ' + tx('$df = (' + S.obs.length + ' - 1)(' + S.obs[0].length + ' - 1) = ' + t.df + '$, p-value $= P(\\chi^2 \\ge ' + F(t.chi2, 2) + ') ' + PEQ(t.p) + '$. Because the p-value ' + (t.p < 0.00005 ? '(less than 0.0001)' : 'of ' + P4(t.p)) + ' is ' + (rej ? 'less' : 'greater') + ' than $\\alpha = ' + (S.alpha === 0.1 ? '0.10' : S.alpha) + '$, we ' + (rej ? 'reject' : 'fail to reject') + ' $H_0$. ' + CS.conclusions(c, rej)[0].t) + '</p>' +
        '<p class="bt-small">Press Chance table a few times: tables drawn from ' + tx('$H_0$') + ' itself still give χ² values around the df, and about ' + Math.round(S.alpha * 100) + ' in 100 land beyond the cutoff.</p>';
      T.explain(whyEl, 'χ² adds up how far each cell is from the count the null hypothesis predicts; a large χ² is evidence against the null.', body); openWhy();
    }
    function numbers(t){
      var st = S.st, R = S.obs.length, C = S.obs[0].length, i, j;
      function grid(cap, val){
        var h = '<table class="ls-tbl cs-tbl"><caption>' + cap + '</caption><thead><tr><th scope="col"><span class="sr-only">Row</span></th>' + st.cols.map(function(c){ return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
        for(i = 0; i < R; i++){ h += '<tr><th scope="row">' + esc(st.rows[i]) + '</th>'; for(j = 0; j < C; j++) h += '<td>' + val(i, j) + '</td>'; h += '</tr>'; }
        return h + '</tbody></table>';
      }
      var br = D().tableRoute('chi2bracket', t.chi2, t.df);
      q('.cs-nums').innerHTML = grid('Observed counts', function(a, b){ return S.obs[a][b]; }) + grid('Expected counts', function(a, b){ return F(t.expected[a][b], 2); }) + grid('Components (O − E)²/E', function(a, b){ return F(t.components[a][b], 3); }) +
        '<table class="ls-tbl"><tbody><tr><th scope="row">χ²</th><td>' + F(t.chi2, 3) + '</td></tr><tr><th scope="row">df</th><td>' + t.df + '</td></tr><tr><th scope="row">p-value</th><td>' + P4(t.p) + '</td></tr><tr><th scope="row">Table C</th><td>' + (br[0] === 0 ? 'less than ' + br[1] : br[1] >= 1 ? 'greater than ' + br[0] : 'between ' + br[0] + ' and ' + br[1]) + '</td></tr><tr><th scope="row">Smallest expected</th><td>' + F(t.minExpected, 2) + '</td></tr></tbody></table>';
    }

    function studio(pane, s){
      LS = s;
      if(s.detailsTitle) s.detailsTitle('Study & tables');
      var o = { mode: 'explore' };
      var stage = el('div', 'cs-ls-stage'); stage.appendChild(q('.cs-stage')); s.add('stage', stage, o);
      var dock = q('.cs-dock'); dock.classList.add('cs-ls-dock'); s.add('dock', dock, o);
      var w = el('div', 'ls-sec cs-ls-why'); w.appendChild(start.el); w.appendChild(whyEl); s.add('why', w, o);
      var d = el('div', 'ls-sec cs-ls-det'); d.appendChild(det);
      Array.prototype.slice.call(pane.querySelectorAll(':scope > *')).forEach(function(k){ if(k.textContent.trim() && !k.classList.contains('cs-ex')) d.appendChild(k); });
      s.add('details', d, o);
      boot();
      if(s.mode() === 'explore' && cellSl) s.hint({ target: cellSl.input, text: 'Change a count, or tap any cell' });
    }
    function boot(){ sized = fit(q('.cs-fig'), function(){ draw(); }); setSt(studies[0]); }
    if(!(window.LevlStudio && T.studioOf(host))) boot();
    return { studio: studio };
  }

  /* ================================================================ QUIZ */
  function quizFigure(host, p, api){
    var fg = p.fig;
    if(!fg) return;
    var box = el('div', 'cs-qfig');
    box.innerHTML = '<svg class="cs-svg" role="img"><title></title><g class="cs-layer"></g></svg>';
    host.appendChild(box);
    var svg = box.querySelector('svg'), layer = box.querySelector('.cs-layer'), title = box.querySelector('title');
    var all = fg.obs.length * fg.obs[0].length, st = { showE: 0, comp: false, curve: false };
    function draw(w, h){
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('width', w); svg.setAttribute('height', h);
      var f = figure({ obs: fg.obs, rows: fg.rows, cols: fg.cols, sel: fg.i >= 0 ? [fg.i, fg.j] : null, showE: st.showE, showComp: st.comp, curve: st.curve, W: w, H: h, alpha: 0.05, compText: true });
      layer.innerHTML = f.svg;
      title.textContent = 'Two-way table of observed counts' + (st.showE ? ' with expected counts' : '') + (st.curve ? ' and the chi-square distribution' : '');
    }
    var sized = fit(box, draw);
    api.csFig = { set: function(k){ if(k === 'E') st.showE = all; if(k === 'comp'){ st.showE = all; st.comp = true; } if(k === 'curve'){ st.showE = all; st.comp = true; st.curve = true; } sized.redraw(); } };
  }

  T.mount(SLUG, function(app, data){
    var ex = null;
    T.modes(app, {
      slug: SLUG,
      explore: function(pane){ ex = explore(pane, data); },
      quiz: function(pane){
        T.drill(pane, data, {
          slug: SLUG, noun: 'test',
          types: [{ value: 'expected', label: 'Carry out the test' }, { value: 'chooser', label: 'Choose and set up the test' }],
          generate: function(r, c, t){ return texify(CS.generate(r, c, t)); },
          extra: quizFigure,
          onStep: function(s, right, api){
            if(!api.csFig) return;
            if(s.key === 'E') api.csFig.set('E');
            if(s.key === 'comp') api.csFig.set('comp');
            if(s.key === 'chi2' || s.key === 'df') api.csFig.set(s.key === 'chi2' ? 'curve' : 'comp');
            if(s.key === 'hyp') api.csFig.set('E');
          }
        });
      },
      studio: { explore: function(pane, s){ if(ex) ex.studio(pane, s); } }
    });
  });
})();
