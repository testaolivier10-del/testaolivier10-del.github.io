/* Chi-square lab, tools v2 (docs/tools-v2-stat-chi-square-lab-brief.md; the standard: docs/tools-v2-standard.md), on the
   shared kit (assets/course/tool-kit2.js) through the course adapter ApStatTools.studioKit2. OWNED BY THIS TOOL ONLY.
   The model is ApStatMath.chiSquareLab (statistics/assets/tools/math/chi-square-lab.js); every expected count,
   component, χ² and p-value comes from ApStatDist through it; math text is ApStatTex. Styles: chi-square-lab.css.

   EXPLORE (free play, nothing graded, no side panel), one screen:
     The two-way table is drawn as stacks: one stack of trays (cards, seedling flats) per cell, standing on its row's
     counter, a tray for a fixed number of people or plants, so a stack's height is the cell's observed count. A line
     across each stack is its expected count, (row total)(column total)/(grand total); the gap between the top and the
     line is orange (more than expected) or blue (fewer), and the cell's tint grows with its part (O − E)²/E. Below,
     the chi-square curve for the table's df: the parts end to end as a bar along its axis, χ² marked where the bar
     ends, the p-value shaded to its right, the α cutoff.
     Main control: the selected stack's knob (drag it up or down; a press anywhere on a cell picks that cell and drags
     its stack; arrow keys on the knob). Trays go on or come off one at a time; the totals, every expected line, the
     bar, the marker and the shading follow. Quiet: Chance table (a table drawn as if H0 were true, each row keeps its
     total), Start over, the study picker. Every number, line and word is read from the stacks AS DRAWN in that frame.
   TEST YOURSELF (unchanged): ApStatTools.drill on chiSquareLab.generate (an expected count, its component, df, χ², the
   p-value, the decision and the conclusion; or the test, its hypotheses and the expected counts condition), the table
   on the stage filling in as the steps are answered; records chi-square-lab:<context>:<step>; ?seed= and #quiz. */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath;
  if(!T || !M || !M.chiSquareLab) return;
  var CS = M.chiSquareLab, esc = T.esc, SLUG = 'chi-square-lab';
  function D(){ return window.ApStatDist; }
  function TX(){ return window.ApStatTex; }
  function tx(s){ return TX() ? TX().html(String(s), { wrap: true }) : esc(s); }
  function F(x, d){ return T.F(x, d); }
  function P4(p){ return CS.P4(p); }
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

  /* ================================================================ the drill's figure (Test yourself, unchanged) */
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
      var hlR = v.hlTotals && v.sel && v.sel[0] === i;
      if(hlR) out.push('<rect class="cs-hl" x="' + f2(x0 + C * cw + 3) + '" y="' + f2(y + 6) + '" width="' + f2(totW - 6) + '" height="' + f2(ch - 12) + '" rx="8"/>');
      out.push(txt(x0 + C * cw + totW / 2, y + ch / 2 + 5, String(t.rowTotals[i]), 'cs-t' + (hlR ? ' is-hl' : '')));
    }
    var yT = y0 + headH + R * ch;
    out.push('<line class="cs-rule" x1="' + f2(pad) + '" y1="' + f2(yT + 2) + '" x2="' + f2(W - pad) + '" y2="' + f2(yT + 2) + '"/>');
    out.push(txt(pad + labW - 8, yT + ch / 2 + 6, 'Total', 'cs-rh cs-tot', 'end'));
    for(j = 0; j < C; j++){
      var hlC = v.hlTotals && v.sel && v.sel[1] === j;
      if(hlC) out.push('<rect class="cs-hl" x="' + f2(x0 + cw * j + 6) + '" y="' + f2(yT + 8) + '" width="' + f2(cw - 12) + '" height="' + f2(ch - 12) + '" rx="8"/>');
      out.push(txt(x0 + cw * (j + 0.5), yT + ch / 2 + 6, String(t.colTotals[j]), 'cs-t' + (hlC ? ' is-hl' : '')));
    }
    if(v.hlTotals) out.push('<rect class="cs-hl" x="' + f2(x0 + C * cw + 3) + '" y="' + f2(yT + 8) + '" width="' + f2(totW - 6) + '" height="' + f2(ch - 12) + '" rx="8"/>');
    out.push(txt(x0 + C * cw + totW / 2, yT + ch / 2 + 6, String(t.total), 'cs-t cs-gt' + (v.hlTotals ? ' is-hl' : '')));
    // The rows and columns counted for df (no totals): their headers outlined.
    if(v.hlHeads){
      for(j = 0; j < C; j++) out.push('<rect class="cs-hlh" x="' + f2(x0 + cw * j + 3) + '" y="' + f2(y0 + 2) + '" width="' + f2(cw - 6) + '" height="' + f2(headH - 4) + '" rx="7"/>');
      for(i = 0; i < R; i++) out.push('<rect class="cs-hlh" x="' + f2(pad + 2) + '" y="' + f2(y0 + headH + i * ch + 4) + '" width="' + f2(labW - 8) + '" height="' + f2(ch - 8) + '" rx="7"/>');
    }
    // The student's answer on the chosen cell, in red, next to the formula.
    if(v.yours && (v.sel || v.yours.at === 'table')){
      var yc = v.yours.at === 'table' ? null : cells.filter(function(c){ return c.i === v.sel[0] && c.j === v.sel[1]; })[0];
      if(yc || v.yours.at === 'table'){
        if(!yc) yc = { x: pad, y: y0, w: labW, h: headH };
        var yt = 'Yours ' + v.yours.text, yw = yt.length * 7.2 + 14, yx = Math.max(2, Math.min(W - yw - 2, yc.x + yc.w / 2 - yw / 2)), yy = yc.y - 2 < 24 ? yc.y + yc.h - 2 : yc.y - 24;
        out.push('<g class="cs-yours"><rect x="' + f2(yx) + '" y="' + f2(yy) + '" width="' + f2(yw) + '" height="22" rx="11"/>' + txt(yx + yw / 2, yy + 15.5, yt) + '</g>');
      }
    }
    var tableH = yT + ch;
    // the chi-square curve
    if(v.curve && H - tableH > 110){
      var full = v.showComp && v.showE >= all && !v.hideObs, chi = t.chi2;
      // pass 3: the strip along the axis gets its own name under the axis numbers, so room is kept for it
      var top = tableH + 14, cb = H - (small ? 30 : 34) - (full ? 16 : 0), lft = pad + 6, rgt = W - (v.noEnl ? pad + 6 : 52);
      var df = t.df, crit = D().invChi2(1 - (v.alpha || 0.05), df), xmax = Math.max(crit * 1.45, Math.min(t.chi2 * 1.12, crit * 3), df + 3 * Math.sqrt(2 * df));
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
      if(full && acc > 0) out.push(txt(sx(0), my + 36, 'Strip on the axis: each cell\'s share of χ², end to end', 'cs-stripl', 'start'));
      out.push('<line class="cs-axis" x1="' + f2(lft) + '" y1="' + f2(my) + '" x2="' + f2(rgt) + '" y2="' + f2(my) + '"/>');
      var st = xmax > 40 ? 10 : xmax > 16 ? 5 : xmax > 7 ? 2 : 1;
      for(k = 0; k <= xmax + 1e-9; k += st){ var tx0 = sx(k); out.push('<line class="cs-tick" x1="' + f2(tx0) + '" y1="' + f2(my) + '" x2="' + f2(tx0) + '" y2="' + f2(my + 5) + '"/>' + txt(tx0, my + 18, String(k), 'cs-tl')); }
      out.push(txt(rgt, top + 4, 'χ² with df = ' + df, 'cs-dfl', 'end'));
      // The student's χ² (a wrong try), dashed, before the right one is shown.
      if(v.yoursX != null && isFinite(v.yoursX) && v.yoursX >= 0){
        var yxx = sx(Math.min(v.yoursX, xmax));
        out.push('<line class="stat-yours" x1="' + f2(yxx) + '" y1="' + f2(top + 50) + '" x2="' + f2(yxx) + '" y2="' + f2(my) + '"/>' + txt(Math.max(lft + 40, Math.min(rgt - 40, yxx)), top + 64, 'yours ' + F(v.yoursX, 2) + (v.yoursX > xmax ? ' →' : ''), 'stat-yours-t'));
      }
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
  /* ================================================================ EXPLORE (tools v2) */
  var NS = 'http://www.w3.org/2000/svg';
  function n1(v){ return Math.round(v * 10) / 10; }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function mk(tag, cls, attrs, parent){ var e = document.createElementNS(NS, tag); if(cls) e.setAttribute('class', cls); if(attrs) for(var k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; }
  function at(e, attrs){ for(var k in attrs){ var v = typeof attrs[k] === 'number' ? String(n1(attrs[k])) : attrs[k]; if(e.getAttribute(k) !== v) e.setAttribute(k, v); } }
  function stx(e, s){ if(e.textContent !== s) e.textContent = s; }
  function easeOut(k){ return 1 - Math.pow(1 - k, 3); }
  function easeIO(k){ return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  var mctx = null, mCache = {}, FONT = 'Nunito, "Segoe UI", system-ui, sans-serif';
  function tw(s, px, wt){
    var k = (wt || 800) + '|' + px + '|' + s;
    if(mCache[k] != null) return mCache[k];
    if(!mctx){ var c = document.createElement('canvas'); mctx = c.getContext('2d'); }
    mctx.font = (wt || 800) + ' ' + px + 'px ' + FONT;
    return (mCache[k] = mctx.measureText(s).width);
  }
  function copyT(t){ return t.map(function(r){ return r.slice(); }); }
  function sameT(a, b){ for(var i = 0; i < a.length; i++) for(var j = 0; j < a[0].length; j++) if(a[i][j] !== b[i][j]) return false; return true; }
  /* words that fit width w at px, in at most two lines */
  function lines2(s, w, px, wt){
    var words = String(s).split(' '), out = [], cur = '';
    words.forEach(function(wd){ var t = cur ? cur + ' ' + wd : wd; if(cur && tw(t, px, wt) > w){ out.push(cur); cur = wd; } else cur = t; });
    if(cur) out.push(cur);
    if(out.length > 2) out = [out[0], out.slice(1).join(' ')];
    return out;
  }
  function wtext(g, cls, x, y, ls, lh, anchor){
    g.textContent = '';
    var t = mk('text', cls, { 'text-anchor': anchor || 'middle' }, g);
    ls.forEach(function(l, i){ var s = mk('tspan', null, { x: n1(x), y: n1(y + (i - (ls.length - 1) / 2) * lh) }, t); s.textContent = l; });
    return t;
  }

  /* Small drawn icons for each category (about 20 px, centred on 0 0): what was counted. */
  var ICONS = {
    pizza: '<path class="ic-cheese" d="M-8 -6Q0 -10 8 -6L0 9Z"/><path class="ic-crust" d="M-8.5 -6Q0 -10.5 8.5 -6"/><circle class="ic-pep" cx="-2.2" cy="-2.6" r="1.7"/><circle class="ic-pep" cx="2.4" cy="-1" r="1.5"/><circle class="ic-pep" cx="-0.2" cy="3.2" r="1.3"/>',
    salad: '<circle class="ic-leaf" cx="-4.5" cy="-1.5" r="3.8"/><circle class="ic-leaf2" cx="0.8" cy="-3.5" r="4.2"/><circle class="ic-leaf" cx="5" cy="-1" r="3.4"/><circle class="ic-tom" cx="-1" cy="-0.6" r="1.8"/><path class="ic-bowl" d="M-9.5 0H9.5A9.5 8 0 0 1 -9.5 0Z"/>',
    sandwich: '<path class="ic-bread" d="M-9 7L9 7L-9 -8Z"/><path class="ic-lett" d="M-9 3.2L4.6 3.2"/><path class="ic-ham" d="M-9 5.2L7 5.2"/><path class="ic-crusto" d="M-9 7L9 7L-9 -8Z"/>',
    hot: '<path class="ic-steam" d="M-4 -9q2 2 0 4t0 4M0 -10q2 2 0 4t0 4M4 -9q2 2 0 4t0 4"/><path class="ic-soup" d="M-9.5 0H9.5A9.5 8 0 0 1 -9.5 0Z"/><path class="ic-rim" d="M-10 0H10"/>',
    social: '<rect class="ic-dev" x="-5.5" y="-9.5" width="11" height="19" rx="2.4"/><rect class="ic-scr" x="-4" y="-7.5" width="8" height="13.5" rx="1"/><path class="ic-bub" d="M-2.6 -4.6h5.2a1.2 1.2 0 0 1 1.2 1.2v2a1.2 1.2 0 0 1 -1.2 1.2h-3.2l-2 1.6v-1.6a1.2 1.2 0 0 1 -1.2 -1.2v-2a1.2 1.2 0 0 1 1.2 -1.2z"/>',
    tv: '<rect class="ic-dev" x="-10" y="-8" width="20" height="13.5" rx="1.8"/><rect class="ic-scr2" x="-8.4" y="-6.4" width="16.8" height="10.3"/><path class="ic-stand" d="M-4 9H4M0 5.5V9"/>',
    web: '<rect class="ic-dev" x="-8" y="-8.5" width="16" height="11.5" rx="1.4"/><rect class="ic-page" x="-6.6" y="-7.1" width="13.2" height="8.7"/><path class="ic-bar" d="M-6.6 -5.2H6.6"/><path class="ic-base" d="M-10 4H10L8 7H-8Z"/>',
    many: '<path class="ic-stem" d="M-5 9V0M0 9V-3M5 9V0"/><g class="ic-bloom"><circle cx="-5" cy="-1" r="3.4"/><circle cx="0" cy="-5" r="3.6"/><circle cx="5" cy="-1" r="3.4"/></g><g class="ic-ctr"><circle cx="-5" cy="-1" r="1.2"/><circle cx="0" cy="-5" r="1.3"/><circle cx="5" cy="-1" r="1.2"/></g>',
    some: '<path class="ic-stem" d="M0 9V-2"/><path class="ic-lf" d="M0 5q-6 -1 -7 -5q5 0 7 3zM0 3q6 -1 7 -5q-5 0 -7 3z"/><circle class="ic-bloom1" cx="0" cy="-4" r="3.8"/><circle class="ic-ctr1" cx="0" cy="-4" r="1.4"/>',
    none: '<path class="ic-stem" d="M0 9V-6"/><path class="ic-lf" d="M0 6q-7 -1 -8 -6q6 0 8 4zM0 2q7 -1 8 -6q-6 0 -8 4zM0 -2q-5 -2 -5 -7q4 1 5 5z"/>'
  };

  function explore2(host, data){
    var K = window.LevlKit2, E = data.explore || {}, studies = E.studies || [];
    var S = { st: null, T: null, D: null, base: null, sel: [0, 0], alpha: 0.05, mode: 'explore', cap: 60, u: 5, takeKey: {} };
    var seed = 1 + Math.floor(Math.random() * 99999), rngN = 0;
    function calm(){ return K.reduced() || !window.requestAnimationFrame; }
    function R(){ return S.T.length; } function C(){ return S.T[0].length; }

    /* ---------------------------------------------------- the stage */
    var stage = el('div', 'cs2');
    var head = K.head({ purpose: E.purpose || 'See how far each count is from expected', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    var pickWrap = el('label', 'cs2-pick'), pick = el('select', 'cs2-sel');
    pickWrap.innerHTML = '<span class="cs2-pick-k">Study</span>';
    pick.setAttribute('aria-label', 'Study');
    pick.innerHTML = studies.map(function(s){ return '<option value="' + esc(s.id) + '">' + esc(s.short || s.name) + '</option>'; }).join('');
    pickWrap.appendChild(pick);
    head.el.insertBefore(pickWrap, head.how);
    stage.appendChild(head.el);
    var sceneBox = el('div', 'cs2-scene');
    sceneBox.innerHTML = '<svg class="cs2-svg" role="img" xmlns="' + NS + '" data-ls-text="keep"><title></title><defs></defs><g class="cs2-back"></g><g class="cs2-cells"></g><g class="cs2-tots"></g><g class="cs2-plot"></g><g class="cs2-plotf"></g></svg>';
    stage.appendChild(sceneBox);
    var svg = sceneBox.querySelector('svg'), sTitle = svg.querySelector('title'), sDefs = svg.querySelector('defs'), sBack = svg.querySelector('.cs2-back'), sCells = svg.querySelector('.cs2-cells'),
      sTots = svg.querySelector('.cs2-tots'), sPlot = svg.querySelector('.cs2-plot'), sPlotF = svg.querySelector('.cs2-plotf');
    var layer = K.layer(sceneBox);
    // the table's cells: a press anywhere on a cell picks it and drags its stack (no jump: the top follows the finger)
    var pad = el('div', 'cs2-pad'); layer.el.appendChild(pad);
    var lines = el('div', 'cs2-lines'), cause = K.cause({ label: 'Why' });
    var acts = el('div', 'cs2-acts');
    acts.innerHTML = '<button type="button" class="tk2-btn cs2-chance">Chance table</button><button type="button" class="tk2-link cs2-reset">Start over</button>';
    var bChance = acts.querySelector('.cs2-chance'), bReset = acts.querySelector('.cs2-reset');
    bChance.setAttribute('aria-describedby', 'cs2-cd-' + seed);
    acts.insertAdjacentHTML('beforeend', '<span class="tk2-sr" id="cs2-cd-' + seed + '">Draws a new table as if the null hypothesis were true: each row keeps its total.</span>');
    lines.appendChild(cause.el); lines.appendChild(acts);
    stage.appendChild(lines);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    var lastSaid = '';
    function say(t){ if(!t || t === lastSaid) return; lastSaid = t; live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }
    var ref = el('div', 'cs2-ref');

    /* ---------------------------------------------------- the model as drawn */
    var Z = null, Zkey = '';
    // Every number on screen comes from the DRAWN table S.D (the stacks as they stand in this frame).
    function derive(){
      var key = S.D.map(function(r){ return r.join(','); }).join(';');
      if(key === Zkey && Z) return Z;
      var t = CS.table(S.D);
      if(!(t.minExpected > 0) && Z) return Z;   // a passing frame with an empty row or column: keep the last whole table
      Zkey = key; Z = t; return Z;
    }
    function rangeOf(i, j){
      var t = S.T, rs = 0, cs = 0, k;
      for(k = 0; k < C(); k++) if(k !== j) rs += t[i][k];
      for(k = 0; k < R(); k++) if(k !== i) cs += t[k][j];
      return [rs === 0 || cs === 0 ? 1 : 0, S.cap];
    }

    /* ---------------------------------------------------- geometry (picture units = CSS px of the scene) */
    var G = null;
    function layout(){
      var W = sceneBox.clientWidth, H = sceneBox.clientHeight;
      if(!W || !H || !S.st) return null;
      var g = { W: W, H: H, phone: W < 600, wide: W >= 900 }, padp = g.phone ? 6 : 12, gap = g.phone ? 8 : 12;
      if(g.wide){
        // wide screens: the stacks on the left, the curve beside them, both the full height
        var cw0 = Math.round(clamp(W * 0.36, 330, 540));
        g.tb = { x: padp, y: padp, w: W - 2 * padp - gap - cw0, h: H - 2 * padp };
        g.cv = { x: g.tb.x + g.tb.w + gap, y: padp, w: cw0, h: H - 2 * padp };
      } else {
        var chh = clamp(H * (g.phone ? 0.29 : 0.33), g.phone ? 138 : 170, 236);
        g.tb = { x: padp, y: padp, w: W - 2 * padp, h: H - 2 * padp - gap - chh };
        g.cv = { x: padp, y: g.tb.y + g.tb.h + gap, w: W - 2 * padp, h: chh };
      }
      var tb = g.tb, r = R(), c = C();
      tb.labW = g.phone ? clamp(tb.w * 0.19, 56, 74) : clamp(tb.w * 0.14, 92, 140);
      tb.totW = g.phone ? 40 : 66;
      tb.headH = g.phone ? 46 : 54; tb.footH = g.phone ? 26 : 30;
      tb.x0 = tb.x + tb.labW; tb.cw = (tb.w - tb.labW - tb.totW) / c;
      tb.rowH = (tb.h - tb.headH - tb.footH) / r;
      g.band = g.phone ? 16 : 22; g.knobRoom = g.phone ? 12 : 18; g.ctr = g.phone ? 6 : 8;
      g.fO = g.phone ? 13 : 16; g.fE = g.phone ? 11 : 12.5;
      g.sw = clamp(tb.cw * (g.phone ? 0.5 : 0.46), 16, 84);
      g.rows = [];
      for(var i = 0; i < r; i++){
        var ry = tb.y + tb.headH + i * tb.rowH, sBot = ry + tb.rowH - g.ctr - (g.phone ? 3 : 5);
        g.rows.push({ y: ry, sTop: ry + g.band + g.knobRoom, sBot: sBot });
      }
      g.pxc = (g.rows[0].sBot - g.rows[0].sTop) / S.cap;
      // one tray stands for u counts: the smallest of 1, 2, 5, 10 that keeps a tray at least 4 px tall
      var us = [1, 2, 5, 10]; g.u = 10; for(var q = 0; q < us.length; q++) if(us[q] * g.pxc >= 4){ g.u = us[q]; break; }
      g.cx = function(j){ return tb.x0 + (j + 0.5) * tb.cw; };
      g.y = function(i, v){ return g.rows[i].sBot - v * g.pxc; };
      // the χ² panel
      var cv = g.cv;
      cv.l = cv.x + (g.phone ? 12 : 20); cv.r = cv.x + cv.w - (g.phone ? 12 : 20);
      cv.tY = cv.y + 18; cv.top = cv.y + 54; cv.ax = cv.y + cv.h - (g.phone ? 38 : 40);
      return g;
    }
    var PL = null;   // the plot's scale for this study: df, xmax, the cutoff, the curve's peak
    function plotScale(){
      var t = CS.table(S.st.obs), df = t.df, D = Dist();
      var crit1 = D.invChi2(0.99, df), x0 = Math.max(crit1 * 1.3, df + 4.2 * Math.sqrt(2 * df)), xmax = Math.max(x0, Math.min(t.chi2 * 1.12, x0 * 4));   // the study's own χ² fits on the axis
      var f = function(x){ return D.chi2Pdf(x, df); }, peak = 0;
      for(var k = 1; k <= 200; k++){ var fx = f(xmax * k / 200); if(isFinite(fx) && fx > peak) peak = fx; }
      if(df === 1) peak = Math.min(peak, f(xmax * 0.06)); else if(df === 2) peak = 0.5;   // df 1 runs off to infinity at 0; df 2 starts at its peak, 1/2
      PL = { df: df, xmax: xmax, peak: peak, f: f };
    }
    function Dist(){ return window.ApStatDist; }
    function xs(x){ var c = G.cv; return c.l + clamp(x / PL.xmax, 0, 1) * (c.r - c.l); }
    function ys(y){ var c = G.cv; return c.ax - Math.min(1.04, y / (PL.peak * 1.08)) * (c.ax - c.top); }

    /* ---------------------------------------------------- the static picture (on a layout or a new study) */
    var Ce = [], Te = {}, Pe = {};
    function drawStatic(){
      var g = G, tb = g.tb, cv = g.cv, r = R(), c = C(), st = S.st, i, j;
      svg.setAttribute('class', 'cs2-svg tok-' + (st.token || 'tray') + (g.phone ? ' is-ph' : ''));
      sDefs.innerHTML = '<linearGradient id="cs2-wall-' + seed + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="cs2s-w0"/><stop offset="1" class="cs2s-w1"/></linearGradient>' +
        '<linearGradient id="cs2-wood-' + seed + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="cs2s-c0"/><stop offset="1" class="cs2s-c1"/></linearGradient>' +
        '<linearGradient id="cs2-tok-' + seed + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="cs2s-t1"/><stop offset=".35" class="cs2s-t0"/><stop offset="1" class="cs2s-t2"/></linearGradient>' +
        g.rows.map(function(rw, i2){ var h = g.u * g.pxc; return '<pattern id="cs2-tr-' + seed + '-' + i2 + '" patternUnits="userSpaceOnUse" x="0" y="' + n1(rw.sBot) + '" width="40" height="' + h.toFixed(3) + '"><rect class="cs2-trl" x="0" y="' + (h - 1.1).toFixed(3) + '" width="40" height="1.1"/><rect class="cs2-trh" x="0" y="0" width="40" height="' + Math.min(1.2, h * 0.25).toFixed(3) + '"/></pattern>'; }).join('');
      sBack.textContent = '';
      // the cafeteria wall behind the counters, the χ² panel
      mk('rect', 'cs2-wall', { x: tb.x, y: tb.y, width: tb.w, height: tb.h, rx: g.phone ? 12 : 16, fill: 'url(#cs2-wall-' + seed + ')' }, sBack);
      var tiles = mk('g', 'cs2-tiles', null, sBack), tsz = g.phone ? 22 : 30;
      for(var ty = tb.y + tb.headH + tsz; ty < tb.y + tb.h - tb.footH - 4; ty += tsz) mk('line', 'cs2-tile', { x1: tb.x + 8, y1: n1(ty), x2: tb.x + tb.w - 8, y2: n1(ty) }, tiles);
      mk('rect', 'cs2-panel', { x: cv.x, y: cv.y, width: cv.w, height: cv.h, rx: g.phone ? 12 : 16 }, sBack);
      // column heads: what was counted, drawn and named
      for(j = 0; j < c; j++){
        var hx = g.cx(j), hg = mk('g', 'cs2-head', null, sBack);
        var ic = mk('g', 'cs2-ic', { transform: 'translate(' + n1(hx) + ' ' + n1(tb.y + (g.phone ? 13 : 17)) + ') scale(' + (g.phone ? 0.9 : 1.25) + ')' }, hg);
        ic.innerHTML = ICONS[(st.icons || [])[j]] || '';
        var hl = lines2(st.cols[j], tb.cw - 6, g.phone ? 11.5 : 12.5, 800);
        wtext(mk('g', null, null, hg), 'cs2-ch', hx, tb.y + (g.phone ? 33 : 42) + (hl.length > 1 ? 2 : 0), hl, g.phone ? 11.5 : 13);
      }
      var th = mk('text', 'cs2-tk', { x: n1(tb.x + tb.w - tb.totW / 2), y: n1(tb.y + (g.phone ? 33 : 42)), 'text-anchor': 'middle' }, sBack); th.textContent = 'Total';
      // the rows: a sign with the group's name, a counter the stacks stand on
      for(i = 0; i < r; i++){
        var rw = g.rows[i], sy = (rw.sTop + rw.sBot) / 2 - 4;
        var nl = lines2(st.rows[i], tb.labW - 16, g.phone ? 11.5 : 13, 900), sw2 = Math.max.apply(null, nl.map(function(l){ return tw(l, g.phone ? 11.5 : 13, 900); })) + (g.phone ? 10 : 16), sh = nl.length * (g.phone ? 13 : 15) + 10;
        mk('rect', 'cs2-sign', { x: n1(tb.x0 - 8 - sw2), y: n1(sy - sh / 2), width: n1(sw2), height: n1(sh), rx: 7 }, sBack);
        wtext(mk('g', null, null, sBack), 'cs2-rh', tb.x0 - 8 - sw2 / 2, sy + 4, nl, g.phone ? 13 : 15);
        mk('rect', 'cs2-ctr', { x: n1(tb.x0 - 4), y: n1(rw.sBot), width: n1(tb.cw * c + 8), height: g.ctr, rx: 2, fill: 'url(#cs2-wood-' + seed + ')' }, sBack);
        mk('rect', 'cs2-ctrsh', { x: n1(tb.x0 - 4), y: n1(rw.sBot + g.ctr), width: n1(tb.cw * c + 8), height: 3 }, sBack);
      }
      var fy = tb.y + tb.h - tb.footH / 2 + 5;
      mk('line', 'cs2-rule', { x1: n1(tb.x + 8), y1: n1(tb.y + tb.h - tb.footH), x2: n1(tb.x + tb.w - 8), y2: n1(tb.y + tb.h - tb.footH) }, sBack);
      var tf = mk('text', 'cs2-tk', { x: n1(tb.x0 - 10), y: n1(fy), 'text-anchor': 'end' }, sBack); tf.textContent = 'Total';
      // the cells: what changes every frame
      sCells.textContent = ''; Ce = [];
      for(i = 0; i < r; i++){ Ce.push([]); for(j = 0; j < c; j++){
        var ce = { g: mk('g', 'cs2-cell', null, sCells) };
        ce.heat = mk('rect', 'cs2-bay', { x: n1(tb.x0 + j * tb.cw + 2), y: n1(g.rows[i].y + 2), width: n1(tb.cw - 4), height: n1(g.rows[i].sBot - g.rows[i].y - 2), rx: 8 }, ce.g);
        ce.base = mk('rect', 'cs2-stk', { rx: 2, fill: 'url(#cs2-tok-' + seed + ')' }, ce.g);
        ce.lines = mk('rect', 'cs2-stkl', { fill: 'url(#cs2-tr-' + seed + '-' + i + ')' }, ce.g);
        ce.gap = mk('rect', 'cs2-gap', null, ce.g);
        ce.lip = mk('rect', 'cs2-lip', { height: 2, rx: 1 }, ce.g);
        ce.eLine = mk('line', 'cs2-eline', null, ce.g);
        ce.eTri = mk('path', 'cs2-etri', null, ce.g);
        ce.o = mk('text', 'cs2-o', { 'text-anchor': 'start' }, ce.g);
        ce.eg = mk('line', 'cs2-eglyph', null, ce.g);
        ce.e = mk('text', 'cs2-e', { 'text-anchor': 'end' }, ce.g);
        ce.sel = mk('rect', 'cs2-selr', { x: n1(tb.x0 + j * tb.cw + 1), y: n1(g.rows[i].y + 1), width: n1(tb.cw - 2), height: n1(g.rows[i].sBot + g.ctr - g.rows[i].y + 1), rx: 9 }, ce.g);
        Ce[i].push(ce);
      } }
      sTots.textContent = ''; Te = { rows: [], cols: [] };
      for(i = 0; i < r; i++){ var rt = mk('text', 'cs2-tot', { x: n1(tb.x + tb.w - tb.totW / 2), y: n1((g.rows[i].sTop + g.rows[i].sBot) / 2 + 5), 'text-anchor': 'middle' }, sTots); Te.rows.push(rt); }
      for(j = 0; j < c; j++){ var ct = mk('text', 'cs2-tot', { x: n1(g.cx(j)), y: n1(fy), 'text-anchor': 'middle' }, sTots); Te.cols.push(ct); }
      Te.all = mk('text', 'cs2-tot cs2-gt', { x: n1(tb.x + tb.w - tb.totW / 2), y: n1(fy), 'text-anchor': 'middle' }, sTots);
      drawPlot();
    }
    function drawPlot(){
      var g = G, cv = g.cv, df = PL.df, k;
      sPlot.textContent = ''; sPlotF.textContent = ''; Pe = {};
      // the title (left) and the p-value's key (right) on the panel's first row
      Pe.title = mk('text', 'cs2-ptitle', { x: n1(cv.l - 4), y: n1(cv.tY + 4) }, sPlot);
      Pe.title.textContent = (g.phone ? 'χ² if H₀ is true, df = ' : 'χ² if H₀ is true (no difference), df = ') + df;
      if(!g.phone && cv.l + tw(Pe.title.textContent, 13, 900) + 150 > cv.r) Pe.title.textContent = 'χ² if H₀ is true, df = ' + df;
      Pe.shade = mk('path', 'cs2-shade', null, sPlot);
      var path = '';
      for(k = 0; k <= 220; k++){ var xx = PL.xmax * Math.max(0.0004, k / 220), yy = PL.f(xx); if(!isFinite(yy)) continue; path += (path ? 'L' : 'M') + n1(xs(xx)) + ' ' + n1(ys(yy)); }
      mk('path', 'cs2-curve', { d: path }, sPlot);
      Pe.bar = []; for(k = 0; k < R() * C(); k++) Pe.bar.push(mk('rect', 'cs2-seg', { height: g.phone ? 8 : 10 }, sPlot));
      mk('line', 'cs2-axis', { x1: n1(cv.l), y1: n1(cv.ax), x2: n1(cv.r), y2: n1(cv.ax) }, sPlot);
      var stp = PL.xmax > 40 ? 10 : PL.xmax > 16 ? (g.phone && PL.xmax > 24 ? 10 : 5) : PL.xmax > 7 ? 2 : 1;
      for(k = 0; k <= PL.xmax + 1e-9; k += stp){ var tx0 = xs(k); mk('line', 'cs2-tick', { x1: n1(tx0), y1: n1(cv.ax), x2: n1(tx0), y2: n1(cv.ax + 5) }, sPlot); var tt = mk('text', 'cs2-tl', { x: n1(tx0), y: n1(cv.ax + 18), 'text-anchor': 'middle' }, sPlot); tt.textContent = String(k); }
      Pe.parts = mk('text', 'cs2-partsl', { x: n1(cv.l), y: n1(cv.ax + 33) }, sPlot);
      Pe.parts.textContent = R() * C() + ' cell parts, end to end = χ²';
      Pe.crit = mk('line', 'cs2-crit', null, sPlot);
      Pe.critT = mk('text', 'cs2-critl', null, sPlot);
      Pe.mark = mk('line', 'cs2-mark', null, sPlotF);
      Pe.pill = mk('g', 'cs2-pill', null, sPlotF); Pe.pillR = mk('rect', null, { height: 24, rx: 12 }, Pe.pill); Pe.pillT = mk('text', null, { 'text-anchor': 'middle' }, Pe.pill);
      Pe.pk = mk('g', 'cs2-pk', null, sPlotF); Pe.pkR = mk('rect', 'cs2-pksw', { width: 12, height: 12, rx: 3 }, Pe.pk); Pe.pkT = mk('text', 'cs2-pkt', { 'text-anchor': 'end' }, Pe.pk);
    }

    /* ---------------------------------------------------- one frame: everything from the drawn table */
    function paint(){
      if(!G) return;
      var g = G, tb = g.tb, cv = g.cv, t = derive(), r = R(), c = C(), i, j, sel = S.sel;
      for(i = 0; i < r; i++) for(j = 0; j < c; j++){
        var ce = Ce[i][j], O = S.D[i][j], Ex = t.expected[i][j], cp = t.components[i][j], sg = O > Ex + 1e-9 ? 1 : O < Ex - 1e-9 ? -1 : 0;
        var cx = g.cx(j), sw = g.sw, x0 = cx - sw / 2, yb = g.rows[i].sBot, yO = g.y(i, O), yE = g.y(i, Ex), isSel = sel[0] === i && sel[1] === j;

        at(ce.base, { x: x0, y: yO, width: sw, height: Math.max(0, yb - yO) });
        at(ce.lines, { x: x0, y: yO, width: sw, height: Math.max(0, yb - yO) });
        at(ce.lip, { x: x0 + 1, y: yO, width: Math.max(0, sw - 2), 'class': 'cs2-lip' + (O > 0 ? '' : ' is-off') });
        if(sg > 0) at(ce.gap, { x: x0, y: yO, width: sw, height: Math.max(0, yE - yO), 'class': 'cs2-gap is-up' });
        else if(sg < 0) at(ce.gap, { x: x0, y: yE, width: sw, height: Math.max(0, yO - yE), 'class': 'cs2-gap is-down' });
        else at(ce.gap, { x: x0, y: yE, width: 0, height: 0, 'class': 'cs2-gap' });
        at(ce.eLine, { x1: x0 - 4, y1: yE, x2: x0 + sw + 4, y2: yE, 'class': 'cs2-eline' + (Ex < 5 ? ' is-low' : '') });
        // two small pointers at the line's ends: a mark on the stack, not a tray's rim
        at(ce.eTri, { d: 'M' + n1(x0 - 10) + ' ' + n1(yE - 4.5) + 'l6 4.5l-6 4.5zM' + n1(x0 + sw + 10) + ' ' + n1(yE - 4.5) + 'l-6 4.5l6 4.5z', 'class': 'cs2-etri' + (Ex < 5 ? ' is-low' : '') });
        var bx = tb.x0 + j * tb.cw, by = g.rows[i].y + g.band - (g.phone ? 3 : 5);
        at(ce.o, { x: bx + (g.phone ? 4 : 6), y: by, 'class': 'cs2-o' + (sg > 0 ? ' is-up' : sg < 0 ? ' is-down' : '') }); stx(ce.o, String(O));
        var eTxt = (g.wide && tb.cw > 150 ? 'expected ' : '') + F(Ex, 1);
        at(ce.e, { x: bx + tb.cw - (g.phone ? 4 : 6), y: by - (g.phone ? 0.5 : 1), 'class': 'cs2-e' + (Ex < 5 ? ' is-low' : '') }); stx(ce.e, eTxt);
        var ew = tw(eTxt, g.fE, 800), gx1 = bx + tb.cw - (g.phone ? 4 : 6) - ew - (g.phone ? 3 : 4);
        at(ce.eg, { x1: gx1 - (g.phone ? 6 : 10), y1: by - 4, x2: gx1, y2: by - 4 });
        at(ce.sel, { 'class': 'cs2-selr' + (isSel ? ' is-on' : '') });
      }
      for(i = 0; i < r; i++){ stx(Te.rows[i], String(t.rowTotals[i])); at(Te.rows[i], { 'class': 'cs2-tot' + (sel[0] === i ? ' is-hl' : '') }); }
      for(j = 0; j < c; j++){ stx(Te.cols[j], String(t.colTotals[j])); at(Te.cols[j], { 'class': 'cs2-tot' + (sel[1] === j ? ' is-hl' : '') }); }
      stx(Te.all, String(t.total));
      // the plot: the shaded p-value, the parts bar, the marker, the cutoff
      var chi = t.chi2, mxX = xs(Math.min(chi, PL.xmax)), sh = '';
      if(chi < PL.xmax){
        sh = 'M' + n1(xs(chi)) + ' ' + n1(cv.ax);
        for(var k = 0; k <= 70; k++){ var xa = chi + (PL.xmax - chi) * k / 70; sh += 'L' + n1(xs(xa)) + ' ' + n1(ys(PL.f(Math.max(xa, 1e-4)))); }
        sh += 'L' + n1(xs(PL.xmax)) + ' ' + n1(cv.ax) + 'Z';
      }
      at(Pe.shade, { d: sh || 'M0 0' });
      var acc = 0, n = 0, bh = g.phone ? 8 : 10;
      for(i = 0; i < r; i++) for(j = 0; j < c; j++){
        var c0 = t.components[i][j], a0 = acc; acc += c0;
        var x1 = xs(a0), x2 = xs(acc), bs = t.signs[i][j], seg = Pe.bar[n++];
        at(seg, { x: x1, y: cv.ax - bh, width: Math.max(0, x2 - x1), 'class': 'cs2-seg ' + (bs > 0 ? 'is-up' : 'is-down') + (sel[0] === i && sel[1] === j ? ' is-sel' : '') });
      }
      var crit = Dist().invChi2(1 - S.alpha, PL.df), cx2 = xs(crit);
      at(Pe.crit, { x1: cx2, y1: cv.top + 2, x2: cx2, y2: cv.ax });
      var ctext = (g.phone ? 'cutoff ' : 'α = ' + A2(S.alpha) + ' cutoff ') + F(crit, 2), cwid = tw(ctext, 11.5, 800), left = mxX > cx2;
      if(left && cx2 - 6 - cwid < cv.l) left = false; if(!left && cx2 + 6 + cwid > cv.r) left = true;
      at(Pe.critT, { x: cx2 + (left ? -6 : 6), y: cv.top + 14, 'text-anchor': left ? 'end' : 'start' }); stx(Pe.critT, ctext);
      at(Pe.mark, { x1: mxX, y1: cv.y + 50, x2: mxX, y2: cv.ax });
      var ptxt = 'χ² = ' + F(chi, 2) + (chi > PL.xmax ? ' →' : ''), pw = tw(ptxt, 13, 900) + 20, pl = clamp(mxX - pw / 2, cv.x + 6, cv.x + cv.w - 6 - pw);
      at(Pe.pillR, { x: pl, y: cv.y + 27, width: pw }); at(Pe.pillT, { x: pl + pw / 2, y: cv.y + 43.5 }); stx(Pe.pillT, ptxt);
      var pv = P4(t.p), ktxt = 'p-value ' + (pv.charAt(0) === '<' ? pv : '= ' + pv), kw = tw(ktxt, 12.5, 900);
      at(Pe.pkT, { x: cv.r, y: cv.tY + 4 }); stx(Pe.pkT, ktxt); at(Pe.pkR, { x: cv.r - kw - 18, y: cv.tY - 6 });
      at(Pe.pk, { 'class': 'cs2-pk' + (t.p < S.alpha ? ' is-low' : '') });
      // the title gives way to the key when both do not fit on one row
      var tWide = tw(Pe.title.textContent, 13, 900);
      Pe.title.style.display = cv.l - 4 + tWide + 10 > cv.r - kw - 20 ? 'none' : '';
      placeKnob();
      words(t);
    }
    function A2(a){ return a === 0.1 ? '0.10' : String(a); }

    /* ---------------------------------------------------- the cause line, the live region, the title */
    var settledKey = '';
    function words(t){
      var i = S.sel[0], j = S.sel[1], O = S.D[i][j], Ex = t.expected[i][j], sg = t.signs[i][j], role = sg > 0 ? 'up' : sg < 0 ? 'down' : 'ink';
      var pv = P4(t.p), cellName = S.st.cols[j] + ', ' + S.st.rows[i];
      var parts = [{ t: cellName + ': ' + O + ' vs ' + F(Ex, 1), role: role, say: cellName + ': observed ' + O + ', expected ' + F(Ex, 1) },
        { t: 'part ' + F(t.components[i][j], 2), role: role, say: 'its part of chi-square ' + F(t.components[i][j], 2) },
        { t: 'χ² ' + F(t.chi2, 2), role: 'chi', say: 'chi-square ' + F(t.chi2, 2) },
        { t: 'p ' + (pv.charAt(0) === '<' ? pv : '= ' + pv), role: 'p', say: 'p-value ' + (pv.charAt(0) === '<' ? 'less than 0.0001' : pv) }];
      if(!t.ok) parts.push({ t: 'an expected count under 5', role: 'bad' });
      var key = parts.map(function(p){ return p.t; }).join('|');
      if(S.take && !busy()){ var tk = S.take; S.take = null; cause.take(tk); say(tk); settledKey = key; }
      else if(key !== settledKey){ settledKey = key; cause.set(parts); }
      if(!busy()) say(cause.el.classList.contains('is-take') ? cause.el.textContent : cause.text());
      sTitle.textContent = 'Stacks of ' + (S.st.noun || 'counts') + ' for each ' + S.st.rowVar + ' and ' + S.st.colVar + ', each with a line at its expected count; below, the chi-square curve with df ' + t.df + ', chi-square ' + F(t.chi2, 2) + ' and the p-value ' + (pv.charAt(0) === '<' ? 'less than 0.0001' : pv) + ' shaded.';
      knobText();
    }

    /* ---------------------------------------------------- animation */
    var A = null, raf = 0;
    function busy(){ return !!A; }
    function kick(){ if(!raf && A) raf = requestAnimationFrame(frame); }
    function frame(){
      raf = 0;
      if(S.mode !== 'explore' || !G){ return; }
      var t = now();
      if(A){
        var k = A.dur > 0 ? clamp((t - A.t0) / A.dur, 0, 1) : 1, e = A.ease(k);
        for(var i = 0; i < R(); i++) for(var j = 0; j < C(); j++) S.D[i][j] = Math.round(A.from[i][j] + (A.to[i][j] - A.from[i][j]) * e);
        if(k >= 1){ S.D = copyT(A.to); A = null; }
      }
      paint();
      if(A) kick(); else settled();
    }
    // Move the drawn table toward a new one: trays go on or come off one at a time, every cell together.
    function go(tbl, dur, ease){
      S.T = copyT(tbl);
      if(calm() || !dur){ A = null; S.D = copyT(tbl); paint(); settled(); return; }
      A = { from: copyT(S.D), to: copyT(tbl), t0: now(), dur: dur, ease: ease || easeIO };
      kick();
    }
    function settled(){ if(!S.take) { refHtml(); return; } paint(); refHtml(); }
    function stopAll(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } if(A){ S.D = copyT(A.to); A = null; } }

    /* ---------------------------------------------------- the main control: the selected stack's top */
    var grabOff = 0, dragFrom = null;
    var hopt = { key: 'apstat-chi-square-lab', label: 'Count', value: 0, min: 0, max: 60, step: 1, chip: false,
      at: function(){ if(!G) return null; var i = S.sel[0], j = S.sel[1]; return [G.cx(j), G.y(i, S.D[i][j])]; },
      pick: function(x, y){ if(!G) return null; var i = S.sel[0], rg = rangeOf(i, S.sel[1]); return clamp(Math.round((G.rows[i].sBot - (y - grabOff)) / G.pxc), rg[0], rg[1]); },
      dir: function(){ return 90; },
      keys: function(v, k){ if(k === 'ArrowLeft' || k === 'ArrowRight') return null; return undefined; },
      valuetext: function(v){ return knobVal(v); },
      onStart: function(){ hideCue(true); if(!dragFrom) dragFrom = { chi: derive().chi2, p: derive().p }; },
      onInput: function(v){ setCount(v); tourDid('drag'); },
      onEnd: function(){ endDrag(); } };
    var knob = K.handle(layer, hopt);
    knob.el.classList.add('cs2-knob');
    function knobVal(v){ var i = S.sel[0], j = S.sel[1], t = derive(); return v + ' ' + (S.st ? S.st.noun || '' : '') + ', expected ' + F(t.expected[i][j], 1); }
    function knobText(){
      if(!S.st) return;
      var i = S.sel[0], j = S.sel[1], rg = rangeOf(i, j);
      hopt.min = rg[0]; hopt.max = rg[1];
      knob.knob.setAttribute('aria-label', 'Count for ' + S.st.cols[j] + ', ' + S.st.rows[i] + ': drag up or down. Left and right arrows pick another cell.');
      knob.knob.setAttribute('aria-valuemin', String(rg[0])); knob.knob.setAttribute('aria-valuemax', String(rg[1]));
    }
    function placeKnob(){ knob.place(); if(cue.active()) cue.place(); }
    function setCount(v){
      var i = S.sel[0], j = S.sel[1], rg = rangeOf(i, j); v = clamp(Math.round(v), rg[0], rg[1]);
      if(v === S.T[i][j] && !A) return;
      var nt = copyT(S.T); nt[i][j] = v;
      var gapN = Math.abs(v - S.D[i][j]);
      S.take = null;
      go(nt, clamp(40 + gapN * 9, 60, 340), easeOut);
    }
    function endDrag(){
      var from = dragFrom; dragFrom = null;
      if(!from) return;
      // the takeaway waits for the stacks to stop (S.take is shown by words() once nothing moves)
      var t = CS.table(S.T), was = from.p < S.alpha, is = t.p < S.alpha;
      if(was !== is) S.take = decisionTake(is);
      else if(!S.takeKey.gap && Math.abs(t.chi2 - from.chi) > 1.5){ S.takeKey.gap = 1; S.take = t.chi2 > from.chi ? 'Bigger gaps from expected make χ² bigger and the p-value smaller.' : 'Smaller gaps from expected make χ² smaller and the p-value bigger.'; }
      if(S.take){ if(!A) { paint(); } }
    }
    function decisionTake(rej){ return 'p ' + (rej ? '<' : '>') + ' ' + A2(S.alpha) + ': ' + (rej ? '' : 'not ') + 'convincing evidence ' + (S.st.claim || 'of a difference') + '.'; }
    function select(i, j){
      if(i === S.sel[0] && j === S.sel[1]) return;
      S.sel = [i, j]; knob.value(S.T[i][j]); settledKey = ''; paint();
    }
    knob.knob.addEventListener('keydown', function(e){
      if(e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault(); hideCue(true);
      var n = S.sel[0] * C() + S.sel[1] + (e.key === 'ArrowRight' ? 1 : -1), all = R() * C(); n = (n + all) % all;
      select(Math.floor(n / C()), n % C());
    });
    // a press on the knob keeps the spot under the finger (no jump)
    layer.el.addEventListener('pointerdown', function(e){
      if(!G || !e.target.closest('.cs2-knob')) return;
      var p = local(e), i = S.sel[0], j = S.sel[1]; grabOff = p[1] - G.y(i, S.D[i][j]);
    }, true);
    function local(e){ var r = sceneBox.getBoundingClientRect(), k = (r.width / G.W) || 1; return [(e.clientX - r.left) / k, (e.clientY - r.top) / k]; }
    // the cell under the finger (the drawn cell, from its column and its row band)
    function cellAt(x, y){
      var tb = G.tb, j = Math.floor((x - tb.x0) / tb.cw);
      if(j < 0 || j >= C()) return null;
      for(var i = 0; i < R(); i++) if(y >= G.rows[i].y && y <= G.rows[i].sBot + G.ctr + 2) return [i, j];
      return null;
    }
    pad.addEventListener('pointerdown', function(e){
      if(!G || S.mode !== 'explore' || (e.pointerType === 'mouse' && e.button !== 0)) return;
      var p = local(e), ij = cellAt(p[0], p[1]); if(!ij) return;
      hideCue(true);
      select(ij[0], ij[1]);
      grabOff = p[1] - G.y(ij[0], S.D[ij[0]][ij[1]]);
      knob.grab(e);
    });

    /* ---------------------------------------------------- chance, start over, the study */
    bChance.addEventListener('click', function(){
      hideCue(true); tourDid('chance');
      var r = M.rng(seed * 7919 + (++rngN) * 104729), nt = CS.chance(r, S.T);
      // a table from H0 with an empty column has no expected count there: draw again
      for(var g2 = 0; g2 < 20 && !(CS.table(nt).minExpected > 0); g2++) nt = CS.chance(r, S.T);
      var t = CS.table(nt);
      S.take = 'A chance table (H₀ true): p ' + (P4(t.p).charAt(0) === '<' ? P4(t.p) : '= ' + P4(t.p)) + '. About 95 in 100 of these give p above 0.05.';
      if(S.alpha !== 0.05) S.take = 'A chance table (H₀ true): p ' + (P4(t.p).charAt(0) === '<' ? P4(t.p) : '= ' + P4(t.p)) + '. About ' + Math.round((1 - S.alpha) * 100) + ' in 100 of these give p above ' + A2(S.alpha) + '.';
      go(nt, 700, easeIO);
    });
    bReset.addEventListener('click', function(){ hideCue(true); S.take = null; go(S.base, 600, easeIO); });
    pick.addEventListener('change', function(){ hideCue(true); setStudy(pick.value, true); });
    function setStudy(idv, fade){
      var st = studies.filter(function(s){ return s.id === idv; })[0] || studies[0];
      stopAll();
      S.st = st; pick.value = st.id;
      S.base = copyT(st.obs); S.T = copyT(st.obs); S.D = copyT(st.obs); Z = null; Zkey = ''; S.take = null; settledKey = '';
      var mxo = 0; st.obs.forEach(function(r){ r.forEach(function(v){ mxo = Math.max(mxo, v); }); });
      S.cap = Math.max(30, Math.ceil(mxo * 1.15 / 5) * 5);
      // start on the cell with the biggest part of χ²
      var t = CS.table(st.obs), b = -1; for(var i = 0; i < st.obs.length; i++) for(var j = 0; j < st.obs[0].length; j++) if(t.components[i][j] > b){ b = t.components[i][j]; S.sel = [i, j]; }
      plotScale();
      knob.value(S.T[S.sel[0]][S.sel[1]]);
      if(fade){ sceneBox.classList.remove('is-fade'); void sceneBox.offsetWidth; sceneBox.classList.add('is-fade'); }
      relayout(true); refHtml();
    }

    /* ---------------------------------------------------- the first visit cue and "Show me how" */
    var cueO = { key: 'apstat-chi-square-lab', text: 'Drag a stack', side: 'right',
      // beside the knob, on the side where the bubble stays off the row signs and the totals (else under the cell)
      at: function(){
        if(!G) return [0, 0];
        var i = S.sel[0], j = S.sel[1], x = G.cx(j), y = G.y(i, S.D[i][j]), bw = tw(cueO.text, 15, 800) + 52, tb = G.tb, kr = G.phone ? 13 : 19;
        if(x + kr + 4 + bw <= tb.x + tb.w - tb.totW) { cueO.side = 'right'; return [x + kr + 4, y]; }
        if(x - kr - 4 - bw >= tb.x0) { cueO.side = 'left'; return [x - kr - 4, y]; }
        cueO.side = 'right'; return [x + kr + 4, y]; } };
    var cue = K.cue(layer, cueO);
    function hideCue(used){ if(used) S.touched = true; if(cue.active()) cue.hide(used); }
    var tour = K.tour({ key: 'apstat-chi-square-lab', label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag a stack up or down. The line on it is the count we would expect if H₀ were true.', target: function(){ return knob.knob; } },
      { id: 'curve', text: 'Every cell’s gap adds a part to χ². A bigger χ² leaves a smaller shaded p-value.', target: function(){ return G ? rectOf(G.cv) : sceneBox; } },
      { id: 'chance', text: 'Chance table draws counts as if H₀ were true. Most give a p-value above 0.05.', target: function(){ return bChance; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function rectOf(b){ var rc = sceneBox.getBoundingClientRect(); return { left: rc.left + b.x, top: rc.top + b.y, width: b.w, height: b.h, right: rc.left + b.x + b.w, bottom: rc.top + b.y + b.h }; }
    function tourDid(x){ if(tour.active()) tour.did(x); }
    function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tour.start(true); }
    stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End)/.test(e.key)) hideCue(true); }, true);

    /* ---------------------------------------------------- layout */
    function relayout(force){
      var g = layout(); if(!g) return;
      var key = g.W + 'x' + g.H + ':' + S.st.id;
      if(!force && G && key === G.key) return;
      g.key = key; G = g;
      svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H); svg.setAttribute('width', g.W); svg.setAttribute('height', g.H);
      drawStatic();
      var tb = g.tb;
      pad.style.left = tb.x0 + 'px'; pad.style.top = (tb.y + tb.headH) + 'px'; pad.style.width = (tb.cw * C()) + 'px'; pad.style.height = (tb.rowH * R()) + 'px';
      Zkey = ''; settledKey = '';
      paint();
      if(A) kick();
    }
    /* the scene's height comes from the room left on screen, so the stacks, the curve and the cause line show together */
    function fitHeight(){
      var vw = window.innerWidth || 1024, vh = window.innerHeight || 800;
      if(vw >= 1000){ sceneBox.style.height = ''; return; }
      var top = sceneBox.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
      var below = lines.offsetHeight || 120;
      var hh = Math.round(vh - Math.min(top, vh * 0.32) - below - 18);
      sceneBox.style.height = clamp(hh, vw < 600 ? (vh < 700 ? 400 : 440) : 520, vw < 600 ? 720 : 860) + 'px';
    }
    var roT = 0;
    function onResize(){ clearTimeout(roT); roT = setTimeout(function(){ fitHeight(); relayout(); }, 40); }
    try{ if(window.ResizeObserver) new ResizeObserver(function(){ relayout(); }).observe(sceneBox); }catch(e){}
    window.addEventListener('resize', onResize);

    /* ---------------------------------------------------- the reference behind "?" */
    function refHtml(){
      if(!S.st) return;
      var st = S.st, t = CS.table(S.T), i = S.sel[0], j = S.sel[1], ind = st.design === 'independence', rej = t.p < S.alpha;
      var c = { design: st.design, rowVar: st.rowVar, colVar: st.colVar, pop: st.pop, groups: st.groups }, h = CS.hyp(c), r = S.T.length, cc = S.T[0].length;
      var pv = P4(t.p), pw = pv.charAt(0) === '<' ? 'less than 0.0001' : pv;
      var x = '<p class="cs2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>';
      x += '<h3>What you are looking at</h3><p><b>The study.</b> ' + esc(st.story) + '</p>';
      x += '<p><b>One stack per cell</b> of the two-way table: ' + esc(st.rowVar) + ' (rows) by ' + esc(st.colVar) + ' (columns). Each ' + esc(st.unit || 'tray') + ' in a stack is ' + G_u() + ' ' + esc(st.noun || 'counts') + ', so a stack’s height is its observed count (the top ' + esc(st.unit || 'tray') + ' can be part of one). The line across each stack is its <b>expected count</b>: what that cell would hold if ' + tx('$H_0$') + ' were true. Orange above the line: more than expected. Blue below it: fewer.</p>';
      x += '<p><b>Expected count</b> = (row total)(column total) / (grand total). For ' + esc(st.cols[j] + ', ' + st.rows[i]) + ': ' + tx('$\\frac{(' + t.rowTotals[i] + ')(' + t.colTotals[j] + ')}{' + t.total + '} = ' + F(t.expected[i][j], 2) + '$') + '. Change one count and its row total, its column total and the grand total change, so every expected count moves a little: watch the lines.</p>';
      x += '<p><b>Its part of χ².</b> ' + tx('$\\frac{(O - E)^2}{E} = \\frac{(' + S.T[i][j] + ' - ' + F(t.expected[i][j], 2) + ')^2}{' + F(t.expected[i][j], 2) + '} = ' + F(t.components[i][j], 3) + '$') + '. ' + tx('$\\chi^2 = \\sum \\frac{(O - E)^2}{E} = ' + F(t.chi2, 2) + '$') + ' adds the parts of all ' + (r * cc) + ' cells: the coloured bar on the curve’s axis, cell by cell, ends at χ².</p>';
      x += '<p><b>The curve</b> is the chi-square distribution with ' + tx('$df = (r - 1)(c - 1) = (' + r + ' - 1)(' + cc + ' - 1) = ' + t.df + '$') + ': the χ² values tables would give if ' + tx('$H_0$') + ' were true. The <b>p-value</b> is the shaded area to the right of χ²: assuming ' + tx('$H_0$') + ' is true, the probability of a χ² of ' + F(t.chi2, 2) + ' or larger, here ' + pw + '. It is not the probability that ' + tx('$H_0$') + ' is true.</p>';
      x += '<h3>This study’s test</h3><p><b>' + (ind ? 'A chi-square test for independence.' : 'A chi-square test for homogeneity.') + '</b> ' + (ind ? 'One random sample, each person classified on two categorical variables (' + esc(st.rowVar) + ' and ' + esc(st.colVar) + ').' : (st.experiment ? 'Treatment groups made by random assignment, compared on one categorical variable (' + esc(st.colVar) + ').' : 'Separate random samples from ' + esc(st.groups) + ', compared on one categorical variable (' + esc(st.colVar) + ').')) + ' The arithmetic is the same for both tests; the hypotheses and the conclusion are not. ' + (ind ? 'A test for homogeneity would not fit: there were not separate samples for each ' + esc(st.rowVar) + '.' : 'A test for independence would not fit: the groups were ' + (st.experiment ? 'assigned' : 'sampled') + ' separately, not one sample classified two ways.') + '</p>';
      x += '<p>' + tx('$H_0$: ' + h.h0) + '<br>' + tx('$H_a$: ' + h.ha) + '</p>';
      x += '<p><b>Conditions.</b> Random: ' + esc(st.random || 'the study used random sampling or random assignment.') + (st.experiment ? '' : ' 10%: the sample is less than 10% of the population.') + ' Large counts: every expected count is at least 5. The smallest here is ' + F(t.minExpected, 2) + (t.ok ? ', so the condition is met.' : ', under 5, so the chi-square curve may not fit (its line is drawn red).') + '</p>';
      x += '<p><b>Conclusion at α = ' + A2(S.alpha) + '.</b> Because the p-value of ' + pw + ' is ' + (rej ? 'less' : 'greater') + ' than α = ' + A2(S.alpha) + ', we ' + (rej ? 'reject' : 'fail to reject') + ' ' + tx('$H_0$') + '. ' + esc(CS.conclusions(c, rej)[0].t) + (st.experiment && rej ? ' Because the fertilizers were randomly assigned, this is evidence that the fertilizer causes the difference.' : '') + (ind && rej ? ' An association in an observational sample is not cause and effect.' : '') + '</p>';
      x += '<p class="cs2-small"><b>Going further.</b> With one categorical variable and one sample, a chi-square goodness of fit test compares the counts with a claimed distribution (df = categories − 1). The revised AP® Statistics course leaves it out.</p>';
      x += '<h3>More settings</h3><div class="cs2-set"><label for="cs2-n-' + seed + '">Type a count for ' + esc(st.cols[j] + ', ' + st.rows[i]) + '</label><input type="text" id="cs2-n-' + seed + '" class="cs2-type" inputmode="numeric" autocomplete="off" spellcheck="false" value="' + S.T[i][j] + '"></div>';
      x += '<div class="cs2-set" role="group" aria-label="Significance level α"><span class="cs2-setk">Significance level α</span>' + [0.01, 0.05, 0.1].map(function(a){ return '<button type="button" class="tk2-btn cs2-a" data-a="' + a + '" aria-pressed="' + (a === S.alpha) + '">' + A2(a) + '</button>'; }).join('') + '</div>';
      function grid(cap, val){
        var hh = '<div class="table-wrap" tabindex="0" role="region" aria-label="' + esc(cap) + '"><table class="ls-tbl cs-tbl"><caption>' + cap + '</caption><thead><tr><th scope="col"><span class="sr-only">Row</span></th>' + st.cols.map(function(cn){ return '<th scope="col">' + esc(cn) + '</th>'; }).join('') + '</tr></thead><tbody>';
        for(var a = 0; a < r; a++){ hh += '<tr><th scope="row">' + esc(st.rows[a]) + '</th>'; for(var b = 0; b < cc; b++) hh += '<td>' + val(a, b) + '</td>'; hh += '</tr>'; }
        return hh + '</tbody></table></div>';
      }
      var br = Dist().tableRoute('chi2bracket', t.chi2, t.df);
      x += '<h3>Every number</h3>' + grid('Observed counts', function(a, b){ return S.T[a][b]; }) + grid('Expected counts', function(a, b){ return F(t.expected[a][b], 2); }) + grid('Parts of χ², (O − E)²/E', function(a, b){ return F(t.components[a][b], 3); }) +
        '<table class="ls-tbl"><tbody><tr><th scope="row">χ²</th><td>' + F(t.chi2, 3) + '</td></tr><tr><th scope="row">df</th><td>' + t.df + '</td></tr><tr><th scope="row">p-value</th><td>' + pv + '</td></tr><tr><th scope="row">Table C</th><td>' + (br[0] === 0 ? 'less than ' + br[1] : br[1] >= 1 ? 'greater than ' + br[0] : 'between ' + br[0] + ' and ' + br[1]) + '</td></tr><tr><th scope="row">Smallest expected</th><td>' + F(t.minExpected, 2) + '</td></tr></tbody></table>';
      x += '<h3>Keys</h3><p>The knob on a stack: up and down arrows change the count by 1, Shift or Page Up and Down by 10, Home and End to the ends. Left and right arrows pick the next cell. Step by step expected counts are in Test yourself.</p>';
      x += '<div class="cs2-about">' + (data.intro || '') + '<h3>' + esc(data.howItWorksTitle || 'How it works') + '</h3>' + tx(data.howItWorks || '') + '</div>';
      if(ref._h !== x){ ref._h = x; ref.innerHTML = x; bindRef(); }
    }
    function G_u(){ return G ? (G.u === 1 ? 'one of the' : G.u) : 5; }
    function bindRef(){
      var hw = ref.querySelector('[data-how]'); if(hw) hw.addEventListener('click', function(){ startTour(); });
      var inp = ref.querySelector('.cs2-type');
      if(inp){
        var typed = function(){ var v = parseInt(String(inp.value).replace(/[^0-9]/g, ''), 10), i = S.sel[0], j = S.sel[1]; if(!isFinite(v)){ inp.value = String(S.T[i][j]); return; } hideCue(true); var rg = rangeOf(i, j); v = clamp(v, rg[0], rg[1]); knob.value(v); setCount(v); inp.value = String(v); };
        inp.addEventListener('change', typed);
        inp.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); typed(); } });
      }
      Array.prototype.forEach.call(ref.querySelectorAll('.cs2-a'), function(b){ b.addEventListener('click', function(){ S.alpha = +b.getAttribute('data-a'); settledKey = ''; paint(); refHtml(); var nb = ref.querySelector('.cs2-a[data-a="' + b.getAttribute('data-a') + '"]'); if(nb) try{ nb.focus(); }catch(e){} }); });
    }

    function boot(){
      setStudy(studies[0].id, false);
      fitHeight();
      relayout(true);
      setTimeout(function(){ fitHeight(); relayout(); cueShow(); }, 60);
    }
    /* On the first visit the cue sits beside the knob: start on the cell with the biggest part of χ² among those where
       it fits beside the knob without covering a sign, a total or a number (phones have little room beside a cell). */
    function cueFits(i, j){ var x = G.cx(j), bw = tw(cueO.text, 15, 800) + 52, kr = G.phone ? 13 : 19, tb = G.tb; return x + kr + 4 + bw <= tb.x + tb.w - tb.totW || x - kr - 4 - bw >= tb.x0; }
    function cueShow(){
      if(S.mode !== 'explore' || !G || S.touched) return;
      try{ if(localStorage.getItem('tk2c:' + cueO.key)) return; }catch(e){}
      if(!cueFits(S.sel[0], S.sel[1])){
        var t = CS.table(S.T), b = -1, best = null;
        for(var i = 0; i < R(); i++) for(var j = 0; j < C(); j++) if(cueFits(i, j) && t.components[i][j] > b){ b = t.components[i][j]; best = [i, j]; }
        if(best) select(best[0], best[1]);
      }
      if(cueFits(S.sel[0], S.sel[1])) cue.show();
    }
    function shown(m){
      S.mode = m;
      if(m !== 'explore'){ stopAll(); tour.stop(); hideCue(false); return; }
      setTimeout(function(){ fitHeight(); relayout(true); cueShow(); }, 40);
    }
    if(!studies.length) return { kit2: function(){ return { stage: el('p', 'bt-small', 'The explore studies arrive with their unit.'), ref: null }; }, plain: function(){}, shown: function(){}, _t: {} };
    return {
      kit2: function(){ boot(); return { stage: stage, ref: ref }; },
      plain: function(){ host.appendChild(stage); host.appendChild(ref); boot(); },
      shown: shown,
      // for the sweep test only: window.ApStatChiSquareLab when the test sets window.LevlToolTest before the page loads
      _t: { S: S, G: function(){ return G; }, Z: function(){ return derive(); }, Ce: function(){ return Ce; }, Pe: function(){ return Pe; }, PL: function(){ return PL; }, busy: busy, xs: function(v){ return xs(v); }, ys: function(v){ return ys(v); },
        setStudy: function(id){ setStudy(id, true); }, select: select, setCount: function(v){ knob.value(v); setCount(v); }, chance: function(){ bChance.click(); }, reset: function(){ bReset.click(); },
        knob: knob, cause: cause, alpha: function(a){ S.alpha = a; settledKey = ''; paint(); refHtml(); }, relayout: relayout, finish: function(){ stopAll(); paint(); }, cue: cue, tour: tour,
        go: function(m){ var b = document.querySelector('.bt-mode[data-m="' + m + '"]'); if(b) b.click(); } }
    };
  }
  /* ================================================================ QUIZ */
  function quizFigure(host, p, api){
    var fg = p.fig;
    if(!fg) return;
    var box = el('div', 'cs-qfig');
    box.innerHTML = '<svg class="cs-svg" role="img"><title></title><g class="cs-layer"></g></svg>';
    host.appendChild(box);
    var svg = box.querySelector('svg'), layer = box.querySelector('.cs-layer'), title = box.querySelector('title');
    var all = fg.obs.length * fg.obs[0].length, st = { showE: 0, comp: false, curve: false, hideObs: false, hlTotals: false, hlHeads: false, yours: null, yoursX: null };
    function draw(w, h){
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('width', w); svg.setAttribute('height', h);
      var f = figure({ obs: fg.obs, rows: fg.rows, cols: fg.cols, sel: fg.i >= 0 ? [fg.i, fg.j] : null, showE: st.showE, showComp: st.comp, curve: st.curve, hideObs: st.hideObs, W: w, H: h, alpha: p.data && p.data.alpha || 0.05, compText: true,
        hlTotals: st.hlTotals, hlHeads: st.hlHeads, yours: st.yours, yoursX: st.yoursX });
      layer.innerHTML = f.svg;
      title.textContent = 'Two-way table of observed counts' + (st.showE ? ' with expected counts' : '') + (st.curve ? ' and the chi-square distribution' : '') + (st.yours ? '. Your answer: ' + st.yours.text : '');
    }
    var sized = fit(box, draw);
    api.csFig = {
      set: function(k){ st.yours = null; st.yoursX = null; st.hlTotals = false; st.hlHeads = false; st.hideObs = false; if(k === 'E') st.showE = all; if(k === 'comp'){ st.showE = all; st.comp = true; } if(k === 'curve'){ st.showE = all; st.comp = true; st.curve = true; } sized.redraw(); },
      // A step became current: draw what it needs (the totals for E, the
      // headers for df, the curve without the answer for chi-square).
      start: function(key){
        st.yours = null; st.yoursX = null; st.hlTotals = key === 'E'; st.hlHeads = key === 'df';
        if(key === 'chi2'){ st.showE = all; st.comp = true; st.curve = true; st.hideObs = true; }
        sized.redraw();
      },
      // A wrong try: the student's number on the picture.
      yours: function(key, v){
        if(!isFinite(v)) return;
        if(key === 'chi2'){ st.yoursX = v; st.yours = null; }
        else st.yours = { text: F(v, key === 'df' ? 0 : key === 'comp' ? 3 : key === 'p' ? 4 : 2), at: key === 'df' || key === 'p' ? 'table' : 'cell' };
        sized.redraw();
      }
    };
  }

  function quiz(pane, data){
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
      },
      onStepStart: function(s, api){ if(api.csFig) api.csFig.start(s.key); },
      onTry: function(s, t, api){ if(api.csFig && !t.right && s.kind === 'num') api.csFig.yours(s.key, t.value); },
      // The method with this problem's own numbers.
      method: function(s, p){
        var d = p.data, f = p.fig;
        var CH = { test: 'Ask how the data were collected: one sample classified on two variables is independence; separate samples or groups compared on one variable is homogeneity.',
          hyp: tx('$H_0$ is the "nothing going on" claim: no association (independence) or the same distribution in every group (homogeneity).'),
          cond: 'The condition is about expected counts, the small numbers in each cell: every one must be at least 5.',
          decide: 'Reject $H_0$ only when the p-value is less than α.', conclude: tx('Use evidence language ("convincing evidence"), state $H_a$ in context, and talk about the population, not the sample.') };
        if(CH[s.key]) return s.key === 'decide' ? tx(CH.decide) : CH[s.key];
        if(!d || !d.obs || f.i < 0) return null;
        var t = CS.table(d.obs), R = d.obs.length, C = d.obs[0].length;
        if(s.key === 'E') return tx('The highlighted totals: $E = \\frac{(\\text{row total})(\\text{column total})}{\\text{grand total}} = \\frac{(' + t.rowTotals[f.i] + ')(' + t.colTotals[f.j] + ')}{' + t.total + '}$.');
        if(s.key === 'comp') return tx('Use the observed count $O = ' + d.obs[f.i][f.j] + '$ and the expected count $E$ from step 1: square $O - E$, then divide by $E$.');
        if(s.key === 'df') return tx('Count the outlined categories, not the totals: ' + R + ' rows and ' + C + ' columns, so $df = (r - 1)(c - 1)$.');
        if(s.key === 'chi2') return tx('Add the component shown in every one of the ' + (R * C) + ' cells. Your sum is the dashed line.');
        if(s.key === 'p') return tx('The p-value is the shaded area to the right of $\\chi^2$ under the curve with $df = ' + t.df + '$: technology gives $P(\\chi^2 \\ge ' + F(t.chi2, 2) + ')$.');
        return null;
      }
    });
  }

  function boot(){
    T.mount(SLUG, function(app, data){
      var ex = null, kit = !!(window.LevlKit2 && window.LevlStudio && app.getAttribute('data-studio'));
      T.modes(app, { slug: SLUG,
        explore: function(pane){ ex = explore2(pane, data); if(window.LevlToolTest) window.ApStatChiSquareLab = ex._t; },
        quiz: function(pane){ quiz(pane, data); },
        onShow: function(m){ if(ex) ex.shown(m); },
        studio: kit ? { kit2: function(pane, s){ return ex.kit2(pane, s); } } : {} });
      // Without the frame (no Tool Studio, or no kit) the stage still works on its own, above Test yourself.
      if(!kit || !T.studioOf(app)) ex.plain();
    });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApStatBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; sc.onerror = boot; document.head.appendChild(sc);
  }
})();
