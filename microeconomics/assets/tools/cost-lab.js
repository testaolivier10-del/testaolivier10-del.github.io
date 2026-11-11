/* Cost Curve Lab page (docs/apmicro-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T2). The model is ApMicroMath.costLab (tools/math/cost-lab.js);
   every curve comes from ApMicroGraph's `costs` model (G.curves and G.y,
   mic-graph.js), drawn here on a dollar scale that grows with the sliders, every
   table cell is computed by ApMicroCalc, and every graph step of Test
   yourself is graded by ApMicroGrade.graph.

   Explore: hire one worker at a time. Each new row of the cost table (TP, MP,
   TFC, TVC, TC, MC, AFC, AVC, ATC) appears, its points land on the cost
   curves, and the part of each curve the table has reached turns solid, so
   MC is seen crossing AVC and ATC at their lowest points. Two sliders change
   the fixed cost (ATC and AFC move; MC and AVC stay) and the cost of
   materials per unit (MC, AVC and ATC move); the old curves stay faded with
   an arrow. Tap or arrow through the rows: the row's points light up on the
   graph and the caption shows that row's arithmetic. The table is beside the
   graph on a wide stage; on a phone one row at a time sits under the graph
   (the whole table is in Details). Columns and curves share colors.

   Test yourself: ApMicroTools.drill with the model's five kinds. The
   problem's table is the stage figure; a graph step mounts its graph in the
   figure (graphHost), so drill grades it with ApMicroGrade.graph and records
   it as "cost-lab:<context>:graph". */
(function(){
  'use strict';
  var T = window.ApMicroTools, M = window.ApMicroMath, CL = M && M.costLab, G = window.ApMicroGraph, GR = window.ApMicroGrade;
  var app = document.getElementById('app');
  if(!T || !CL || !G || !app) return;
  if(CL.stub){ app.innerHTML = '<p class="mic-soon">This trainer is being built. Meanwhile, read the <a href="../learn.html">free notes</a>.</p>'; return; }
  var esc = T.esc, money = CL.money, m0 = CL.m0, clipN = 0;
  function f1(v){ return Math.round(v * 10) / 10; }
  function reduced(){ return T.reduced ? T.reduced() : false; }
  function ease(t){ return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  T.mount('cost-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'cost-lab',
      explore: function(host){ ex = explore(host); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  var COLS = [
    { k: 'labor', h: 'L', name: 'Workers' }, { k: 'tp', h: 'Q', name: 'Output (total product)' }, { k: 'mp', h: 'MP', name: 'Marginal product' },
    { k: 'tfc', h: 'TFC', name: 'Total fixed cost', money: 1 }, { k: 'tvc', h: 'TVC', name: 'Total variable cost', money: 1 }, { k: 'tc', h: 'TC', name: 'Total cost', money: 1 },
    { k: 'mc', h: 'MC', name: 'Marginal cost', money: 2, curve: 'MC' }, { k: 'afc', h: 'AFC', name: 'Average fixed cost', money: 2, curve: 'AFC' },
    { k: 'avc', h: 'AVC', name: 'Average variable cost', money: 2, curve: 'AVC' }, { k: 'atc', h: 'ATC', name: 'Average total cost', money: 2, curve: 'ATC' }
  ];
  function cellText(t, c, i){
    var v = c.k === 'tfc' ? t.tfc : t[c.k][i];
    if(v == null) return '';
    if(c.money === 1) return m0(v);
    if(c.money === 2) return money(v);
    return String(v);
  }

  /* ------------------------------------------------------------ explore */
  function explore(host){
    var st = { rows: 1, sel: 0, tfc: CL.EXPLORE.tfc, mats: 0, prev: null, from: null, k: 1, anim: null, afc: true, mins: true };
    var LS = null, sp = null;
    host.innerHTML =
      '<figure class="cl-fig"><div class="cl-gwrap"><div class="cl-svg"></div><p class="cl-key" aria-hidden="true"><span class="cl-k cl-c-MC">MC</span><span class="cl-k cl-c-ATC">ATC</span><span class="cl-k cl-c-AVC">AVC</span><span class="cl-k cl-c-AFC">AFC</span><span class="cl-k cl-k-dot">dots: the table’s rows</span></p></div>' +
        '<div class="cl-side"><div class="cl-tablewrap" tabindex="-1"></div><div class="cl-card"></div></div>' +
        '<figcaption class="sr-only cl-live"></figcaption></figure>' +
      '<div class="cl-ctl"><div class="cl-hire-row"><button type="button" class="btn-press sm cl-hire">Hire worker 1</button><button type="button" class="bt-btn cl-all">Fill every row</button></div><div class="cl-sliders"></div></div>' +
      '<div class="cl-say"></div><div class="cl-nums"></div>' +
      T.moreHtml('<div class="bt-radio"><input type="checkbox" id="cl-afc" checked><label for="cl-afc">Draw AFC (average fixed cost)</label></div>' +
        '<div class="bt-radio"><input type="checkbox" id="cl-min" checked><label for="cl-min">Mark the lowest points of AVC and ATC</label></div>' +
        '<div class="bt-actions"><button type="button" class="bt-btn cl-reset">Start over</button></div>' +
        '<p class="bt-small">Tap a row of the table (or use the up and down arrow keys on it) to see its arithmetic and its points on the graph.</p>', 'curves to draw, start over');
    var fig = host.querySelector('.cl-fig'), svgEl = host.querySelector('.cl-svg'), tw = host.querySelector('.cl-tablewrap'), card = host.querySelector('.cl-card');
    var say = T.announcer(host.querySelector('.cl-live')), sayEl = host.querySelector('.cl-say'), numsEl = host.querySelector('.cl-nums');
    var hire = host.querySelector('.cl-hire'), all = host.querySelector('.cl-all');
    var sF = T.slider({ label: 'Fixed cost (rent, a day)', min: 40, max: 160, step: 10, value: st.tfc, unit: '', decimals: 0, onInput: function(v){ change(v, st.mats); } });
    var sM = T.slider({ label: 'Materials per unit of output', min: 0, max: 3, step: 0.5, value: 0, decimals: 2, onInput: function(v){ change(st.tfc, v); } });
    [sF, sM].forEach(function(s){ s.el.querySelector('output').classList.add('cl-out'); });
    fixOut(sF, function(v){ return '$' + v; }); fixOut(sM, function(v){ return money(v); });
    host.querySelector('.cl-sliders').appendChild(sF.el); host.querySelector('.cl-sliders').appendChild(sM.el);
    var cue = T.cue('Hire workers one at a time and watch each row land on the curves.');
    host.insertBefore(cue.el, host.firstChild);
    function fixOut(s, f){
      var inp = s.input, out = s.el.querySelector('output');
      var show = function(){ out.textContent = f(+inp.value); inp.setAttribute('aria-valuetext', f(+inp.value)); };
      inp.addEventListener('input', show); s.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', show); }); show();
    }

    function tbl(){ return CL.table({ tfc: st.tfc, mats: st.mats }); }
    function offs(){ return CL.offsets(st.tfc, st.mats); }

    /* -------- the graph: ApMicroGraph's cost curves (the `costs` model, G.curves
       and G.y, so the table's rows land on them), drawn here at a size of their own
       with a dollar scale: the price axis grows with the sliders, so a costly firm's
       MC and ATC stay on the graph (tools review 2026-11-10). One graph unit is $1
       of cost a unit and 10 units of output. */
    function topOf(tfc, mats){
      // the highest point of any row of the whole table (all 8 workers), so the scale never jumps while hiring
      var t = CL.table({ tfc: tfc, mats: mats }), hi = 10;
      for(var i = 1; i < t.tp.length; i++) ['mc', 'atc', 'avc'].forEach(function(k){ if(t[k][i] != null) hi = Math.max(hi, t[k][i]); });
      return 2 * Math.ceil((hi + 0.8) / 2);
    }
    function dims(){
      // a phone (the figure is one column): a shorter, wider graph; else a tall one beside the table
      var narrow = fig && fig.clientWidth > 0 && fig.clientWidth < 760;
      return narrow ? { W: 400, H: 352, L: 88, R: 44, T: 26, B: 52, fs: 13, narrow: true } : { W: 470, H: 520, L: 78, R: 54, T: 30, B: 46, fs: 13, narrow: false };
    }
    function graphSvg(t){
      var now = offs(), base = st.prev || now, k = st.anim ? st.k : 1;
      var shifts = {}, start = {}, moved = false;
      ['MC', 'ATC'].forEach(function(c){ start[c] = base[c]; var d = (now[c] - base[c]) * k; if(Math.abs(d) > 1e-6){ shifts[c] = d; moved = true; } });
      var spec = { kind: 'costs', afc: st.afc, start: start };
      var D = dims(), PWd = D.W - D.L - D.R, PHd = D.H - D.T - D.B;
      var yTop = st.top0 != null && st.anim ? st.top0 + (topOf(st.tfc, st.mats) - st.top0) * k : topOf(st.tfc, st.mats);
      var X = function(x){ return D.L + x / 10 * PWd; }, Y = function(v){ return D.T + (yTop - v) / yTop * PHd; };
      var live = G.curves(spec, shifts), old = moved ? G.curves(spec, {}) : [];
      var out = [], uid = 'cl' + (++clipN);
      var label = 'Cost curves of the firm, cost per unit in dollars from $0 to $' + Math.round(yTop) + ' against output from 0 to 100 units: ' + G.describe(spec, { shifts: shifts }) + ' ' + st.rows + ' of 8 workers hired.' + (st.mins ? ' Marginal cost crosses AVC and ATC at their lowest points.' : '');
      function path(c, x0, x1){
        var pts = [];
        for(var x = Math.max(0, x0); x <= x1 + 1e-9; x += 0.04){ var v = G.y(c, x); if(v == null || !isFinite(v)) continue; pts.push(f1(X(x)) + ' ' + f1(Y(Math.min(v, yTop * 1.6)))); }
        return pts.length > 1 ? 'M' + pts.join('L') : '';
      }
      // grid and dollar ticks
      var step = yTop > 16 ? 4 : 2, g = [], lab = [];
      for(var v = 0; v <= yTop + 1e-9; v += step) g.push('<path class="cl-grid" d="M' + D.L + ' ' + f1(Y(v)) + 'H' + (D.L + PWd) + '"/>');
      for(var q = 10; q <= 100; q += 10) g.push('<path class="cl-grid" d="M' + f1(X(q / 10)) + ' ' + D.T + 'V' + (D.T + PHd) + '"/>');
      out.push(g.join(''));
      // P_SD and P_BE: the two key prices, as tags on the price axis
      var tags = [], A = G.named(spec, shifts, 'min-avc'), B = G.named(spec, shifts, 'min-atc');
      if(st.mins){
        if(A) tags.push({ y: Y(A[1]), v: A[1], c: 'AVC', s: 'SD', p: A });
        if(B) tags.push({ y: Y(B[1]), v: B[1], c: 'ATC', s: 'BE', p: B });
        if(tags.length === 2 && tags[0].y - tags[1].y < 17){ var mid = (tags[0].y + tags[1].y) / 2; tags[0].ty = mid + 8.5; tags[1].ty = mid - 8.5; }
      }
      for(v = 0; v <= yTop + 1e-9; v += step){
        var yv = Y(v); if(tags.some(function(tg){ return Math.abs((tg.ty || tg.y) - yv) < 14; })) continue;
        lab.push('<text class="cl-tick" x="' + (D.L - 7) + '" y="' + f1(yv + 4) + '" text-anchor="end">$' + v + '</text>');
      }
      var qSel = st.sel > 0 ? X(t.tp[st.sel] / 10) : null;
      for(q = 0; q <= 100; q += D.narrow ? 20 : 10) if(qSel == null || Math.abs(X(q / 10) - qSel) > (D.narrow ? 34 : 30)) lab.push('<text class="cl-tick" x="' + f1(X(q / 10)) + '" y="' + (D.T + PHd + 17) + '" text-anchor="middle">' + q + '</text>');
      lab.push('<text class="cl-axt" x="' + (D.L + PWd / 2) + '" y="' + (D.H - 6) + '" text-anchor="middle">Output (units a day)</text>');
      lab.push('<text class="cl-axt" x="6" y="' + (D.T - 12) + '" text-anchor="start">Cost per unit ($)</text>');
      out.push('<defs><clipPath id="' + uid + '"><rect x="' + D.L + '" y="' + (D.T - 2) + '" width="' + PWd + '" height="' + (PHd + 2) + '"/></clipPath>' +
        '<clipPath id="' + uid + 'r"><rect x="' + D.L + '" y="' + (D.T - 2) + '" width="' + f1(Math.max(0, t.tp[st.rows - 1] / 100 * PWd)) + '" height="' + (PHd + 2) + '"/></clipPath>' +
        '<marker id="' + uid + 'a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="cl-arrowhead"/></marker></defs>');
      // the old curves (before a slider moved them), faded, with an arrow to the new ones
      var plot = [];
      old.forEach(function(c){
        var n = G.find(live, c.id); if(!n) return;
        var d = path(c, 0, 10); if(d) plot.push('<path class="cl-old" d="' + d + '"/>');
        var ax = c.id === 'AFC' ? 3.2 : c.id === 'MC' ? 6.4 : 7.6, y0 = G.y(c, ax), y1 = G.y(n, ax);
        if(y0 != null && y1 != null && Math.abs(Y(y0) - Y(y1)) > 14 && Math.max(y0, y1) < yTop) plot.push('<path class="cl-shift cl-s-' + c.id + '" marker-end="url(#' + uid + 'a)" d="M' + f1(X(ax)) + ' ' + f1(Y(y0) + (y1 > y0 ? -3 : 3)) + 'V' + f1(Y(y1) + (y1 > y0 ? 6 : -6)) + '"/>');
      });
      // each curve: faint over its whole length, solid over the stretch the table has reached
      var xmax = t.tp[st.rows - 1] / 10;
      live.forEach(function(c){
        var d = path(c, 0, 10); if(!d) return;
        plot.push('<path class="cl-faint cl-s-' + c.id + '" d="' + d + '"/>');
        if(xmax > 0) plot.push('<path class="cl-reach cl-s-' + c.id + '" clip-path="url(#' + uid + 'r)" d="' + d + '"/>');
      });
      if(xmax > 0) plot.push('<path class="cl-front" d="M' + f1(X(xmax)) + ' ' + D.T + 'V' + (D.T + PHd) + '"/>');
      tags.forEach(function(tg){
        plot.push('<path class="cl-minguide" d="M' + D.L + ' ' + f1(tg.y) + 'H' + f1(X(tg.p[0])) + '"/><circle class="cl-min cl-s-' + tg.c + '" cx="' + f1(X(tg.p[0])) + '" cy="' + f1(tg.y) + '" r="8"/>');
      });
      // the table's rows as points (MC between two rows, at the middle of the step)
      for(var i = 1; i < st.rows; i++){
        var qq = t.tp[i] / 10, on = i === st.sel;
        [['ATC', t.atc[i], qq], ['AVC', t.avc[i], qq], ['AFC', st.afc ? t.afc[i] : null, qq], ['MC', t.mc[i], (t.tp[i - 1] + t.tp[i]) / 20]].forEach(function(dd){
          if(dd[1] == null || dd[1] > yTop) return;
          plot.push('<circle class="cl-dot cl-f-' + dd[0] + (on ? ' is-sel' : '') + '" cx="' + f1(X(dd[2])) + '" cy="' + f1(Y(dd[1])) + '" r="' + (on ? 6.5 : 4.2) + '"/>');
        });
      }
      out.push('<g clip-path="url(#' + uid + ')">' + plot.join('') + '</g>');
      out.push('<path class="cl-axis" d="M' + D.L + ' ' + D.T + 'V' + (D.T + PHd) + 'H' + (D.L + PWd) + '"/>');
      out.push(lab.join(''));
      tags.forEach(function(tg){
        out.push('<text class="cl-amark cl-t-' + tg.c + '" x="' + (D.L - 7) + '" y="' + f1((tg.ty || tg.y) + 4) + '" text-anchor="end">P<tspan dy="3" class="cl-sub">' + tg.s + '</tspan><tspan dy="-3"> ' + money(tg.v) + '</tspan></text>');
      });
      if(st.sel > 0){
        var qs = t.tp[st.sel] / 10, xs = X(qs);
        out.push('<path class="cl-selq" d="M' + f1(xs) + ' ' + D.T + 'V' + (D.T + PHd) + '"/>');
        var tw0 = String(t.tp[st.sel]).length * 8 + 42;
        out.push('<g class="cl-qtag"><rect x="' + f1(xs - tw0 / 2) + '" y="' + (D.T + PHd + 4) + '" width="' + tw0 + '" height="19" rx="9.5"/><text x="' + f1(xs) + '" y="' + (D.T + PHd + 18) + '" text-anchor="middle">Q = ' + t.tp[st.sel] + '</text></g>');
      }
      // curve names at the right end of what is drawn, kept apart
      var names = live.map(function(c){
        var px0 = null;
        for(var x = 10; x >= 0.3; x -= 0.02){ var vv = G.y(c, x); if(vv != null && vv <= yTop * 0.985 && vv >= 0){ px0 = [x, vv]; break; } }
        return px0 && { id: c.id, x: X(px0[0]), y: Y(px0[1]) };
      }).filter(Boolean).sort(function(a, b){ return a.y - b.y; });
      for(var n = 1; n < names.length; n++) if(names[n].y - names[n - 1].y < 16) names[n].y = names[n - 1].y + 16;
      names.forEach(function(nm){
        var right = nm.x > D.L + PWd - 30;
        out.push('<text class="cl-cname cl-t-' + nm.id + '" x="' + f1(right ? D.L + PWd + 5 : nm.x + 6) + '" y="' + f1(Math.max(D.T + 10, nm.y + 4)) + '">' + nm.id + '</text>');
      });
      return '<svg class="cl-graph" viewBox="0 0 ' + D.W + ' ' + D.H + '" role="img" aria-label="' + esc(label) + '" style="font-size:' + D.fs + 'px">' + out.join('') + '</svg>';
    }
    function tableHtml(t){
      return '<table class="cl-table"><caption>The firm’s cost table (wage $' + t.wage + ' a day' + (st.mats ? ', materials ' + money(st.mats) + ' a unit' : '') + ')</caption><thead><tr>' +
        COLS.map(function(c){ return '<th scope="col" class="' + (c.curve ? 'cl-c-' + c.curve : '') + '"><abbr title="' + esc(c.name) + '">' + c.h + '</abbr></th>'; }).join('') + '</tr></thead><tbody>' +
        t.labor.map(function(l, i){
          var shown = i < st.rows;
          return '<tr data-r="' + i + '" class="' + (shown ? 'is-in' : 'is-out') + (i === st.sel ? ' is-sel' : '') + (i === st.rows - 1 && st.fresh ? ' is-new' : '') + '"' + (shown ? ' tabindex="' + (i === st.sel ? 0 : -1) + '" aria-selected="' + (i === st.sel) + '"' : ' aria-hidden="true"') + '>' +
            COLS.map(function(c, k){ var v = shown ? cellText(t, c, i) : ''; return k ? '<td class="' + (c.curve ? 'cl-c-' + c.curve : '') + '">' + (v || (shown ? '<span class="cl-na" aria-label="none">·</span>' : '')) + '</td>' : '<th scope="row">' + (shown ? l : '') + '</th>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table>';
    }
    function cardHtml(t){
      var i = st.sel;
      var order = ['mc', 'avc', 'atc', 'afc', 'mp', 'tvc', 'tc', 'tfc'];
      var cells = order.map(function(k){ return COLS.filter(function(c){ return c.k === k; })[0]; }).map(function(c){ var v = cellText(t, c, i); return '<div class="cl-cc ' + (c.curve ? 'cl-c-' + c.curve : '') + '"><span class="cl-cc-k">' + c.h + '</span><span class="cl-cc-v">' + (v || '·') + '</span></div>'; }).join('');
      return '<div class="cl-card-head"><button type="button" class="bt-btn cl-prev" aria-label="Previous row"' + (i <= 0 ? ' disabled' : '') + '>‹</button><p class="cl-card-t"><b>' + t.labor[i] + (t.labor[i] === 1 ? ' worker' : ' workers') + '</b>, Q = ' + t.tp[i] + '</p><button type="button" class="bt-btn cl-next" aria-label="Next row"' + (i >= st.rows - 1 ? ' disabled' : '') + '>›</button></div><div class="cl-cards">' + cells + '</div>';
    }
    function rowWords(t, i){
      if(i === 0) return 'With no workers the firm makes nothing, but it still pays its fixed cost of ' + m0(t.tfc) + ': TC = TFC.';
      var dq = t.tp[i] - t.tp[i - 1], dtc = t.tc[i] - t.tc[i - 1];
      return '<b>Worker ' + i + '</b> adds ' + dq + ' units (MP). MC = ΔTC ÷ ΔQ = ' + m0(dtc) + ' ÷ ' + dq + ' = <b>' + money(t.mc[i]) + '</b>. AVC = ' + m0(t.tvc[i]) + ' ÷ ' + t.tp[i] + ' = ' + money(t.avc[i]) + ', ATC = ' + m0(t.tc[i]) + ' ÷ ' + t.tp[i] + ' = ' + money(t.atc[i]) + '.';
    }
    function draw(){
      var t = tbl();
      svgEl.innerHTML = graphSvg(t);
      if(!st.anim){
        tw.innerHTML = tableHtml(t);
        card.innerHTML = cardHtml(t);
        hire.textContent = st.rows >= t.labor.length ? 'All 8 workers hired' : 'Hire worker ' + st.rows;
        hire.disabled = all.disabled = st.rows >= t.labor.length;
        words(t);
      }
    }
    function words(t){
      var i = st.sel, head = rowWords(t, i), body = [];
      var ra = CL.minRow(t.avc), rt = CL.minRow(t.atc);
      if(st.note) head = st.note + ' ' + (i ? '' : '');
      if(i > 0 && !st.note){
        var below = function(c){ return t.mc[i] < t[c][i - 1] ? 'below' : 'above'; };
        if(i > 1) head += ' MC is ' + below('avc') + ' AVC and ' + below('atc') + ' ATC, so ' + (below('atc') === 'below' ? 'ATC is still falling.' : 'ATC is rising.');
      }
      body.push('Marginal product rises for the first workers (they specialize), then falls: diminishing marginal returns. Since MC = wage ÷ MP, MC falls while MP rises and rises once MP falls.');
      body.push('While MC is below an average, the next unit pulls that average down; once MC is above it, it pulls the average up. So MC crosses AVC and ATC at their lowest points.');
      if(st.rows - 1 >= rt + 1) body.push('In this table AVC is lowest at Q = ' + t.tp[ra] + ' (' + money(t.avc[ra]) + ') and ATC at Q = ' + t.tp[rt] + ' (' + money(t.atc[rt]) + '). ATC bottoms out at a larger output because AFC keeps falling.');
      body.push('The lowest AVC is the shutdown price (P<sub>SD</sub>): below it a price-taking firm makes nothing. The lowest ATC is the break-even price (P<sub>BE</sub>): zero economic profit.');
      body.push('A fixed cost (the rent slider) moves ATC and AFC only. A cost on every unit (the materials slider) moves MC, AVC and ATC up by that amount.');
      T.explain(sayEl, head, '<ol class="ls-steps">' + body.map(function(b){ return '<li><span>' + b + '</span></li>'; }).join('') + '</ol>');
      nums(t);
      if(LS){ LS.caption(head, 'explore'); if(sp) sp.open(); }
      say(String(head).replace(/<[^>]+>/g, ''));
    }
    function nums(t){
      var el = numsEl;
      el.innerHTML = '<h3 class="ls-title-l">Every formula</h3><table class="ls-tbl"><tbody>' +
        [['MP', 'ΔTP ÷ ΔL'], ['TVC', 'wage × L + materials × Q'], ['TC', 'TFC + TVC'], ['MC', 'ΔTC ÷ ΔQ (divide by the change in output)'], ['AFC', 'TFC ÷ Q'], ['AVC', 'TVC ÷ Q'], ['ATC', 'TC ÷ Q = AVC + AFC']]
          .map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<h3 class="ls-title-l">The whole table</h3><div class="table-wrap cl-dettable" tabindex="0" role="region" aria-label="The firm’s cost table">' + tableHtml(t).replace(/ tabindex="-?\d"/g, '').replace(/ aria-selected="\w+"/g, '') + '</div>' +
        '<p class="bt-small">Each row’s points sit on the curves the graph engine draws for this firm, within rounding (output is counted in whole units).</p>';
    }

    /* -------- actions */
    function hireNext(n){
      var t = tbl();
      if(st.rows >= t.labor.length) return;
      cue.done(); st.note = '';
      st.rows = Math.min(t.labor.length, st.rows + (n || 1)); st.sel = st.rows - 1; st.fresh = true;
      draw(); st.fresh = false;
      if(st.rows >= t.labor.length && LS) LS.pills([{ html: 'MC crosses AVC and ATC at their minimums', tone: 'good' }], 'left', 'explore');
    }
    function change(tfc, mats){
      cue.done(); stop();
      var before = offs(), wasF = st.tfc, wasM = st.mats;
      st.top0 = topOf(st.tfc, st.mats); st.prev = before; st.tfc = tfc; st.mats = mats;
      var moved = tfc !== wasF ? 'fixed' : mats !== wasM ? 'mats' : '';
      st.note = moved === 'fixed' ? '<b>Fixed cost ' + (tfc > wasF ? 'up' : 'down') + ' to $' + tfc + ':</b> ATC and AFC shift ' + (tfc > wasF ? 'up' : 'down') + '. MC and AVC do not move: a fixed cost adds nothing to the cost of one more unit.'
        : moved === 'mats' ? '<b>Materials ' + money(mats) + ' a unit:</b> every unit costs ' + money(Math.abs(mats - wasM)) + (mats > wasM ? ' more' : ' less') + ', so MC, AVC and ATC all shift ' + (mats > wasM ? 'up' : 'down') + '. AFC does not move.' : '';
      if(reduced() || !window.requestAnimationFrame){ draw(); return; }
      var t0 = null; st.anim = { id: 0 }; st.k = 0;
      var fr = function(ts){ if(!st.anim) return; if(t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / 450); st.k = ease(k); svgEl.innerHTML = graphSvg(tbl()); if(k < 1) st.anim.id = requestAnimationFrame(fr); else { st.anim = null; draw(); } };
      st.anim.id = requestAnimationFrame(fr);
      draw();
    }
    function stop(){ if(st.anim){ try{ cancelAnimationFrame(st.anim.id); }catch(e){} st.anim = null; } }
    function select(i, focus){
      var t = tbl(); i = Math.max(0, Math.min(st.rows - 1, i));
      st.sel = i; st.note = ''; draw();
      if(focus){ var tr = tw.querySelector('tr[data-r="' + i + '"]'); if(tr) tr.focus(); }
    }
    function reset(){ stop(); st.rows = 1; st.sel = 0; st.tfc = CL.EXPLORE.tfc; st.mats = 0; st.prev = null; st.note = ''; sF.set(st.tfc); sM.set(0); fixShow(); if(LS) LS.pills([], 'left', 'explore'); draw(); }
    function fixShow(){ [sF, sM].forEach(function(s){ s.input.dispatchEvent(new Event('input')); }); }
    hire.addEventListener('click', function(){ hireNext(1); });
    all.addEventListener('click', function(){ hireNext(8); });
    host.querySelector('.cl-reset').addEventListener('click', reset);
    host.querySelector('#cl-afc').addEventListener('change', function(e){ st.afc = e.target.checked; draw(); });
    host.querySelector('#cl-min').addEventListener('change', function(e){ st.mins = e.target.checked; draw(); });
    tw.addEventListener('click', function(e){ var tr = e.target.closest('tr[data-r].is-in'); if(tr) select(+tr.getAttribute('data-r'), true); });
    tw.addEventListener('keydown', function(e){
      var tr = e.target.closest('tr[data-r]'); if(!tr) return;
      var i = +tr.getAttribute('data-r'), d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : e.key === 'Home' ? -99 : e.key === 'End' ? 99 : 0;
      if(d){ e.preventDefault(); select(i + d, true); }
    });
    card.addEventListener('click', function(e){ if(e.target.closest('.cl-prev')) select(st.sel - 1); if(e.target.closest('.cl-next')) select(st.sel + 1); });
    var wasNarrow = null;
    function fit(){ var n = fig.clientWidth > 0 && fig.clientWidth < 760; fig.classList.toggle('is-narrow', n); if(wasNarrow !== null && n !== wasNarrow && !st.anim) svgEl.innerHTML = graphSvg(tbl()); wasNarrow = n; }
    if(window.ResizeObserver) new ResizeObserver(fit).observe(fig);
    window.addEventListener('resize', fit);

    function studio(pane, s){
      LS = s;
      sp = T.studioPane(pane, s, { stage: [fig], dock: [host.querySelector('.cl-ctl')], setup: 'Curves', moreLabel: 'Curves to draw and start over', why: [sayEl], details: [numsEl] });
      sp.setup('MC, ATC, AVC, AFC');
      draw(); fit();
      if(s.mode() === 'explore') T.hintSlot(s, hire, 'Start here: hire the first worker', { before: hire.parentNode });
    }
    draw(); fit();
    return { studio: studio, stop: stop };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'cost-lab', noun: 'drill',
      generate: function(r, ctx, type){ return CL.generate(r, ctx, type); },
      types: [{ value: 'table', label: 'MP and MC from a labor table' }, { value: 'mc', label: 'MC and averages from total cost' }, { value: 'min', label: 'The minimums of AVC and ATC' }, { value: 'shutdown', label: 'Shutdown and break-even prices' }, { value: 'fixed', label: 'Fixed cost or per-unit cost' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { table: 'Costs from a labor table', mc: 'Marginal cost from a table', min: 'The lowest averages', shutdown: 'Shutdown or keep going', fixed: 'Which curves move' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){
        var f = document.createElement('figure');
        f.className = 'cd-fig cl-qfig';
        f.innerHTML = '<div class="cl-qgraph" hidden></div><div class="table-wrap cl-qtw" tabindex="0" role="region" aria-label="The problem’s table">' + p.figure.table + '</div>';
        el.appendChild(f);
        api.gslot = f.querySelector('.cl-qgraph');
      },
      graphHost: function(s, api){
        var d = api.gslot; d.hidden = false; d.innerHTML = '';
        var box = document.createElement('div'); d.appendChild(box);
        api.gr = G.mount(box, s.spec, {});
        return api.gr;
      },
      onStep: function(s, right, api){
        if(s.kind !== 'graph' || !api.gr) return;
        if(!GR.graph(s.spec, api.gr.get()).correct) api.gr.set(G.keyResponse(s.spec));
      }
    });
  }
})();
