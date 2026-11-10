/* Cost Curve Lab page (docs/apmicro-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T2). The model is ApMicroMath.costLab (tools/math/cost-lab.js);
   every curve is drawn by ApMicroGraph (the `costs` kind, mic-graph.js), every
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
  var esc = T.esc, px = G.px, py = G.py, money = CL.money, m0 = CL.m0;
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

    /* -------- the graph: ApMicroGraph's costs curves, plus the table's points */
    function graphSvg(t){
      var now = offs(), base = st.prev || now, k = st.anim ? st.k : 1;
      var shifts = {}, start = {};
      ['MC', 'ATC'].forEach(function(c){ start[c] = base[c]; var d = (now[c] - base[c]) * k; if(Math.abs(d) > 1e-6) shifts[c] = d; });
      var spec = { kind: 'costs', afc: st.afc, start: start };
      var label = 'Cost curves of the firm: ' + G.describe(spec, { shifts: shifts }) + ' ' + st.rows + ' of 8 workers hired.' + (st.mins ? ' Marginal cost crosses AVC and ATC at their lowest points.' : '');
      var svg = G.svg(spec, { shifts: shifts, focus: st.focus }, { label: label });
      svg = svg.replace(/<g class="mic-gr-c" data-curve="(\w+)">/g, '<g class="mic-gr-c cl-g-$1" data-curve="$1">').replace(/(<text class="mic-gr-clabel )(?!is-old)/g, '$1');
      // tag each live curve label with its curve's color, in drawing order
      var order = []; svg.replace(/data-curve="(\w+)"/g, function(_, c){ order.push(c); return _; });
      var n = 0; svg = svg.replace(/<\/g><text class="mic-gr-clabel /g, function(m){ var c = order[n++]; return '</g><text class="mic-gr-clabel cl-t-' + c + ' '; });
      var x = [], xmax = t.tp[st.rows - 1] / 10, live = G.curves(spec, shifts);
      // the stretch the table has reached, solid; the rest of each curve stays faint
      if(xmax > 0){
        x.push('<defs><clipPath id="cl-reach"><rect x="' + px(0) + '" y="0" width="' + f1(px(xmax) - px(0)) + '" height="300"/></clipPath></defs>');
        live.forEach(function(c){ var m = new RegExp('<g class="mic-gr-c cl-g-' + c.id + '" data-curve="' + c.id + '"><path class="mic-gr-curve[^"]*" d="([^"]+)"').exec(svg); if(m) x.push('<path class="cl-reach cl-s-' + c.id + '" clip-path="url(#cl-reach)" d="' + m[1] + '"/>'); });
        x.push('<path class="cl-front" d="M' + f1(px(xmax)) + ' ' + py(10) + 'V' + py(0) + '"/>');
      }
      if(st.mins){
        var A = G.named(spec, shifts, 'min-avc'), B = G.named(spec, shifts, 'min-atc');
        [[A, 'AVC', 'Shutdown: min AVC'], [B, 'ATC', 'Break-even: min ATC']].forEach(function(q){
          if(!q[0] || q[0][1] > 9.8) return;
          var X = px(q[0][0]), Y = py(q[0][1]);
          x.push('<circle class="cl-min cl-s-' + q[1] + '" cx="' + f1(X) + '" cy="' + f1(Y) + '" r="7"/>');
          x.push('<path class="cl-minguide" d="M' + px(0) + ' ' + f1(Y) + 'H' + f1(X) + '"/>');
        });
        if(A && B){
          // the two key prices on the price axis, kept apart
          var ya = py(A[1]), yb = py(B[1]); if(ya - yb < 12){ var mid = (ya + yb) / 2; ya = mid + 6; yb = mid - 6; }
          x.push('<text class="cl-amark cl-t-AVC" x="' + (G.BOX.L - 4) + '" y="' + f1(ya + 4) + '" text-anchor="end">P<tspan dy="3" class="mic-gr-sub">SD</tspan></text>');
          x.push('<text class="cl-amark cl-t-ATC" x="' + (G.BOX.L - 4) + '" y="' + f1(yb + 4) + '" text-anchor="end">P<tspan dy="3" class="mic-gr-sub">BE</tspan></text>');
        }
      }
      // the table's rows as points (MC between two rows, at the middle of the step)
      for(var i = 1; i < st.rows; i++){
        var q = t.tp[i] / 10, on = i === st.sel;
        [['ATC', t.atc[i], q], ['AVC', t.avc[i], q], ['AFC', st.afc ? t.afc[i] : null, q], ['MC', t.mc[i], (t.tp[i - 1] + t.tp[i]) / 20]].forEach(function(d){
          if(d[1] == null || d[1] > 10) return;
          x.push('<circle class="cl-dot cl-f-' + d[0] + (on ? ' is-sel' : '') + '" cx="' + f1(px(d[2])) + '" cy="' + f1(py(d[1])) + '" r="' + (on ? 5.5 : 3.6) + '"/>');
        });
      }
      if(st.sel > 0){
        var qs = t.tp[st.sel] / 10;
        x.push('<path class="cl-selq" d="M' + f1(px(qs)) + ' ' + py(10) + 'V' + py(0) + '"/><text class="cl-qmark" x="' + f1(px(qs)) + '" y="' + (G.BOX.T + G.BOX.PH + 13) + '" text-anchor="middle">' + t.tp[st.sel] + '</text>');
      }
      return svg.replace('</svg>', x.join('') + '</svg>');
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
      var cells = COLS.slice(2).map(function(c){ var v = cellText(t, c, i); return '<div class="cl-cc ' + (c.curve ? 'cl-c-' + c.curve : '') + '"><span class="cl-cc-k">' + c.h + '</span><span class="cl-cc-v">' + (v || '·') + '</span></div>'; }).join('');
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
      st.prev = before; st.tfc = tfc; st.mats = mats;
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
    function fit(){ fig.classList.toggle('is-narrow', fig.clientWidth > 0 && fig.clientWidth < 760); }
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
