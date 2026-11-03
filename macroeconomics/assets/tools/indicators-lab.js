/* Economic indicators lab page (skills tool, free; docs/apmacro-spec.md section 6).
   OWNED BY THIS TOOL ONLY (builder T3, docs/apmacro-briefs/t3.md). Model:
   ApMacroMath.indicatorsLab (macroeconomics/assets/tools/math/indicators-lab.js);
   frame: ApMacroTools.modes and drill on the Tool Studio; plots ApMacroPlot.

   Explore, four views (each once its topic is published):
     GDP       add an economy's transactions one at a time: each lands in C, I,
               G, X or M (an import is counted, then subtracted) or in "Not
               counted", with the reason; the columns and GDP follow.
     Prices    a basket's cost, the CPI (choose the base year) and inflation by
               year, and a wage in base-year dollars.
     Real GDP  nominal GDP and real GDP (nominal ÷ deflator × 100) by year.
     Jobs      100 adults; events move them between employed, the three kinds
               of unemployment and out of the labor force; the rates follow.
   Test yourself: what counts in GDP, GDP by expenditure, CPI and inflation,
   real versus nominal, the labor force rates, the kinds of unemployment. */
(function(){
  'use strict';
  var T = window.ApMacroTools, M = window.ApMacroMath, P = window.ApMacroPlot;
  (function(){ var app = document.getElementById('app'); if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Numbers & formulas'); })();
  if(!T || !M || !M.indicatorsLab || M.indicatorsLab.stub || !P) return;
  var IL = M.indicatorsLab, esc = T.esc, n = IL.n, usd = IL.usd;

  T.mount('indicators-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'indicators-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function seg(label, items, value, onChange, cls){
    var el = document.createElement('div');
    el.className = 'ls-seg ind-seg' + (cls ? ' ' + cls : '');
    el.setAttribute('role', 'group'); el.setAttribute('aria-label', label);
    el.innerHTML = items.map(function(it){ return '<button type="button" class="bt-mode" data-v="' + esc(it.value) + '" aria-pressed="' + (it.value === value) + '">' + esc(it.label) + '</button>'; }).join('');
    el.addEventListener('click', function(e){ var b = e.target.closest('button[data-v]'); if(b){ set(b.getAttribute('data-v')); onChange(b.getAttribute('data-v')); } });
    function set(v){ el.querySelectorAll('button[data-v]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); }); }
    return { el: el, set: set };
  }
  function f1(v){ return Math.round(v * 10) / 10; }
  var SHORT = { fridge: 'New refrigerator', haircut: 'Haircut', rent: 'Apartment rent', groceries: 'Groceries', dentist: 'Dentist visit', trucks: 'New trucks', house: 'Newly built house',
    inventory: 'Unsold sofas (inventory)', datacenter: 'New data center', firefighters: 'Firefighters\' pay', bridge: 'New bridge', ship: 'Navy ship', soybeans: 'Soybeans sold to Japan',
    tourist: 'Hotel stay by a visitor', plane: 'Airplane sold to India', laptops: 'Imported laptops', scanner: 'Imported scanners', socsec: 'Social Security checks',
    ubenefit: 'Unemployment benefits', stock: 'Shares of stock', bond: 'Savings bond', usedcar: 'Used car', flour: 'Flour for bread', cooking: 'Cooking at home', mexico: 'US-owned factory in Mexico' };
  var COMP = [{ id: 'C', name: 'C', long: 'Consumption' }, { id: 'I', name: 'I', long: 'Investment' }, { id: 'G', name: 'G', long: 'Government purchases' }, { id: 'X', name: 'X', long: 'Exports' }, { id: 'M', name: '−M', long: 'Imports (subtracted)' }];
  var PLACE = { C: 'Consumption (C)', I: 'Investment (I)', G: 'Government purchases (G)', X: 'Exports (X)', CM: 'Consumption, then subtracted as an import', IM: 'Investment, then subtracted as an import', none: 'Not counted in GDP' };
  // Dot colors for the jobs view, in GROUPS order.
  var JOB_CLS = { E: 'is-emp', uF: 'is-uf', uS: 'is-us', uC: 'is-uc', nDis: 'is-dis', nRet: 'is-out', nStu: 'is-out', nOth: 'is-out' };

  /* ============================================================ explore */
  function explore(host, data){
    var LS = null, live = {};
    (data.contexts || []).forEach(function(c){ live[c.id] = 1; });
    var views = [{ value: 'gdp', label: 'GDP' }, { value: 'prices', label: 'Prices' }, { value: 'real', label: 'Real' }, { value: 'jobs', label: 'Jobs' }].filter(function(v){ return live[v.value]; });
    if(!views.length) views = [{ value: 'prices', label: 'Prices' }];
    var st = { view: views[0].value, seed: 1 + Math.floor(Math.random() * 9999), econ: null, added: 0, year: 4, base: 0, ryear: 3, jobs: IL.JOBS0, jobSay: '', touched: false };
    st.econ = IL.economy(M.rng(st.seed));
    var cue = T.cue('Tap Next transaction and watch where it goes.');
    host.innerHTML = '<section class="bt-problem ind-card" aria-label="Indicators explorer"><div class="ind-stage">' +
      '<div class="ind-fig" data-v="gdp"><div class="ind-tx"></div><div class="ind-gdpbox"></div><div class="ind-tray"></div></div>' +
      '<div class="ind-fig" data-v="prices" hidden><div class="ind-read"></div><div class="ind-plot ind-p1"></div><div class="ind-plot ind-p2"></div></div>' +
      '<div class="ind-fig" data-v="real" hidden><div class="ind-read"></div><div class="ind-plot ind-p3"></div></div>' +
      '<div class="ind-fig" data-v="jobs" hidden><div class="ind-jobgrid"><div class="ind-waffle"></div><div class="ind-legend"></div></div><div class="ind-rates"></div></div>' +
      '</div><div class="ind-ctl"></div><div class="ind-say"></div><div class="ind-det"></div><p class="sr-only ind-live"></p></section>';
    var card = host.querySelector('.ind-card'), ctl = host.querySelector('.ind-ctl'), det = host.querySelector('.ind-det'), sayEl = host.querySelector('.ind-say'), stageEl = host.querySelector('.ind-stage');
    card.insertBefore(cue.el, sayEl);
    var figs = {}; host.querySelectorAll('.ind-fig').forEach(function(f){ figs[f.getAttribute('data-v')] = f; });
    var say = T.announcer(host.querySelector('.ind-live'));
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }
    var viewSeg = views.length > 1 ? seg('View', views, st.view, function(v){ st.view = v; touch(); update(true); }, 'ind-views') : null;
    if(viewSeg) ctl.appendChild(viewSeg.el);
    var groups = {};
    ['gdp', 'prices', 'real', 'jobs'].forEach(function(k){ var g = document.createElement('div'); g.className = 'ind-group'; groups[k] = g; ctl.appendChild(g); });
    // GDP: one primary button and a reset
    groups.gdp.innerHTML = '<div class="ind-row"><button type="button" class="btn-press sm ind-next">Next transaction</button><button type="button" class="bt-btn ind-new">New economy</button></div>';
    var nextBtn = groups.gdp.querySelector('.ind-next');
    nextBtn.addEventListener('click', function(){ touch(); if(st.added < st.econ.length) st.added++; update(true); });
    groups.gdp.querySelector('.ind-new').addEventListener('click', function(){ touch(); st.seed++; st.econ = IL.economy(M.rng(st.seed)); st.added = 0; update(true); });
    // Prices
    var yearSl = T.slider({ label: 'Year', min: IL.YEARS[0], max: IL.YEARS[IL.YEARS.length - 1], step: 1, value: IL.YEARS[st.year], decimals: 0, onInput: function(v){ st.year = v - IL.YEARS[0]; touch(); update(false); } });
    groups.prices.appendChild(yearSl.el);
    var baseSel = T.choiceSelect({ label: 'Base year', options: IL.YEARS.map(function(y, i){ return { value: i, label: String(y) }; }), value: 0, onChange: function(v){ st.base = +v; touch(); update(true); } });
    baseSel.el.classList.add('bt-inline');
    groups.prices.appendChild(baseSel.el);
    var ryearSl = T.slider({ label: 'Year', min: IL.YEARS[0], max: IL.YEARS[IL.YEARS.length - 1], step: 1, value: IL.YEARS[st.ryear], decimals: 0, onInput: function(v){ st.ryear = v - IL.YEARS[0]; touch(); update(false); } });
    groups.real.appendChild(ryearSl.el);
    // Jobs: the events
    groups.jobs.innerHTML = '<p class="ind-lbl">What happens</p><div class="ind-events">' + IL.EVENTS.map(function(e){ return '<button type="button" class="bt-btn ind-ev" data-ev="' + e.id + '">' + esc(e.name) + '</button>'; }).join('') + '</div><button type="button" class="bt-btn ind-reset">Start over</button>';
    groups.jobs.addEventListener('click', function(e){
      var b = e.target.closest('[data-ev]');
      if(b){ touch(); var out = IL.jobEvent(st.jobs, b.getAttribute('data-ev')); st.jobSay = out.moved ? out.say : 'Nothing to move: no one is in that group right now.'; st.jobs = out.st; update(true); }
      if(e.target.closest('.ind-reset')){ st.jobs = IL.JOBS0; st.jobSay = ''; update(true); }
    });

    var lastCap = '';
    function update(full){
      Object.keys(figs).forEach(function(k){ figs[k].hidden = k !== st.view; });
      Object.keys(groups).forEach(function(k){ groups[k].hidden = k !== st.view; });
      if(viewSeg) viewSeg.set(st.view);
      var r = { gdp: drawGdp, prices: drawPrices, real: drawReal, jobs: drawJobs }[st.view]();
      T.explain(sayEl, r.head, r.body);
      det.innerHTML = r.det + data.howItWorks;
      if(LS){ if(r.head !== lastCap){ LS.caption(r.head, 'explore'); lastCap = r.head; } LS.pills([], 'left', 'explore'); }
      if(full) say(r.head.replace(/<[^>]+>/g, ''));
    }

    /* ---------------------------------------------------- GDP */
    function drawGdp(){
      var items = st.econ.slice(0, st.added), s = IL.totals(items), last = items[items.length - 1];
      nextBtn.disabled = st.added >= st.econ.length;
      nextBtn.textContent = st.added >= st.econ.length ? 'All added' : st.added ? 'Next transaction (' + (st.added + 1) + ' of ' + st.econ.length + ')' : 'Next transaction';
      var tx = figs.gdp.querySelector('.ind-tx');
      tx.innerHTML = last ? '<p class="ind-txk">Transaction ' + st.added + ' of ' + st.econ.length + ' · ' + usd(last.amt, 'billion') + '</p><p class="ind-txt">' + esc(last.text) + '</p><p class="ind-txp is-' + (last.cat === 'none' ? 'none' : 'in') + '">' + esc(PLACE[last.cat]) + '</p>'
        : '<p class="ind-txk">' + st.econ.length + ' transactions this year</p><p class="ind-txt">Add them one at a time. Each lands in C, I, G or net exports, or is left out of GDP.</p>';
      // columns
      var box = figs.gdp.querySelector('.ind-gdpbox'), w = Math.max(280, box.clientWidth || 520), h = Math.max(170, Math.min(420, box.clientHeight || 240));
      var cols = COMP.map(function(c){ return { id: c.id, name: c.name, v: c.id === 'M' ? -s.M : s[c.id] }; }).concat([{ id: 'gdp', name: 'GDP', v: s.gdp }]);
      var hi = Math.max(100, s.C + s.I + s.G + s.X, s.gdp), lo = Math.min(0, -s.M), L = 34, R = 8, Tp = 22, B = s.M ? 50 : 30, pw = w - L - R, ph = h - Tp - B;
      var sy = function(v){ return Tp + (hi - v) / (hi - lo) * ph; }, cw = pw / cols.length, bw = Math.min(56, cw * 0.62);
      var g = ['<line class="ml-zero ind-zero" x1="' + L + '" x2="' + (w - R) + '" y1="' + f1(sy(0)) + '" y2="' + f1(sy(0)) + '"/>'];
      cols.forEach(function(c, i){
        var cx = L + cw * (i + 0.5), top = Math.min(sy(0), sy(c.v)), hh = Math.abs(sy(c.v) - sy(0));
        var hit = last && (c.id === last.cat || (last.cat === 'CM' && (c.id === 'C' || c.id === 'M')) || (last.cat === 'IM' && (c.id === 'I' || c.id === 'M')));
        g.push('<rect class="ind-col is-' + c.id + (hit ? ' is-hit' : '') + '" x="' + f1(cx - bw / 2) + '" y="' + f1(top) + '" width="' + f1(bw) + '" height="' + f1(Math.max(hh, 0.5)) + '" rx="4"/>');
        g.push('<text class="ind-cv" x="' + f1(cx) + '" y="' + f1(c.v >= 0 ? sy(c.v) - 6 : sy(c.v) + 14) + '" text-anchor="middle">' + esc(usd(c.v)) + '</text>');
        g.push('<text class="ind-cn' + (c.id === 'gdp' ? ' is-gdp' : '') + '" x="' + f1(cx) + '" y="' + (h - 10) + '" text-anchor="middle">' + esc(c.name) + '</text>');
        if(i === cols.length - 2) g.push('<text class="ind-cn" x="' + f1(cx + cw / 2) + '" y="' + f1(sy(0) - 4) + '" text-anchor="middle">=</text>');
      });
      g.push('<text class="ind-axn" x="4" y="13">$ billion this year</text>');
      box.innerHTML = '<svg class="ind-svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="GDP by expenditure so far: consumption ' + usd(s.C) + ', investment ' + usd(s.I) + ', government purchases ' + usd(s.G) + ', exports ' + usd(s.X) + ', imports ' + usd(s.M) + ' subtracted; GDP ' + usd(s.gdp) + ' billion.">' + g.join('') + '</svg>';
      var outs = items.filter(function(t){ return t.cat === 'none'; });
      figs.gdp.querySelector('.ind-tray').innerHTML = '<p class="ind-trayh">Not counted in GDP</p>' + (outs.length ? '<ul>' + outs.map(function(t){ return '<li' + (t === last ? ' class="is-hit"' : '') + '>' + esc(SHORT[t.id] || t.id) + ' <span>' + usd(t.amt) + '</span></li>'; }).join('') + '</ul>' : '<p class="ind-empty">Nothing yet</p>');
      var head = last ? (last.cat === 'none' ? '<b>Not counted:</b> ' : '<b>' + esc(PLACE[last.cat]) + ':</b> ') + esc(last.why) : 'GDP adds spending on new final goods and services made in the country this year. Tap Next transaction.';
      var body = '<p>GDP = C + I + G + (X − M) = ' + usd(s.C) + ' + ' + usd(s.I) + ' + ' + usd(s.G) + ' + (' + usd(s.X) + ' − ' + usd(s.M) + ') = <b>' + usd(s.gdp, 'billion') + '</b>.</p>' +
        '<p>An import is part of what households or firms buy, so it shows up in C or I; it was made abroad, so it is subtracted as M and adds nothing to US GDP.</p>' +
        '<p class="mac-slip"><b>Common slips:</b> a newly built house is investment, not consumption; Social Security and unemployment benefits are transfers, not government purchases; stocks and bonds are not investment in GDP.</p>';
      var detH = '<h3 class="ls-title-l">This economy</h3><table class="ls-tbl"><thead><tr><th scope="col">Transaction</th><th scope="col">Where</th><th scope="col" class="r">$ billion</th></tr></thead><tbody>' +
        items.map(function(t){ return '<tr><td>' + esc(SHORT[t.id] || t.id) + '</td><td>' + esc(PLACE[t.cat]) + '</td><td class="r">' + t.amt + '</td></tr>'; }).join('') + '<tr><th scope="row" colspan="2">GDP</th><td class="r"><b>' + usd(s.gdp) + '</b></td></tr></tbody></table>';
      return { head: head, body: body, det: detH };
    }

    /* ---------------------------------------------------- prices */
    function plotBox(el, spec){
      var w = Math.max(260, el.clientWidth || 520), h = Math.max(140, Math.min(360, el.clientHeight || 200));
      spec.width = w; spec.height = h - (spec.legend ? 22 : 0) - (spec.xLabel ? 16 : 0);
      el.innerHTML = P.svg(spec);
    }
    function drawPrices(){
      var Pr = IL.prices(st.base), Y = IL.YEARS, i = st.year, b = st.base;
      var cpiPts = Y.map(function(y, k){ return [y, Pr.cpi[k]]; });
      var ylo = Math.floor(Math.min.apply(null, Pr.cpi) / 10) * 10 - 10, yhi = Math.ceil(Math.max.apply(null, Pr.cpi) / 10) * 10 + 5;
      plotBox(figs.prices.querySelector('.ind-p1'), { label: 'Consumer price index by year, base year ' + Y[b] + ' equal to 100', x: [Y[0] - 0.4, Y[4] + 0.4], y: [ylo, yhi], xStep: 1, xLabel: 'Year', yLabel: 'CPI (' + Y[b] + ' = 100)',
        lines: cpiPts.slice(1).map(function(p, k){ return { seg: true, through: [cpiPts[k], p], cls: 's1' }; }).concat([{ seg: true, through: [[Y[0] - 0.4, 100], [Y[4] + 0.4, 100]], cls: 's3', dashed: true }]),
        points: cpiPts.map(function(p, k){ return { at: p, cls: k === i ? 's2' : 's1', label: k === i ? n(p[1], 1) : '' }; }) });
      var infl = Pr.infl.slice(1), ih = Math.max(2, Math.ceil(Math.max.apply(null, infl) + 1));
      plotBox(figs.prices.querySelector('.ind-p2'), { label: 'Inflation rate each year, percent', x: [Y[0] - 0.4, Y[4] + 0.4], y: [0, ih], xStep: 1, yLabel: 'Inflation (%)',
        rects: infl.map(function(v, k){ return { x0: Y[k + 1] - 0.28, x1: Y[k + 1] + 0.28, y0: 0, y1: v, cls: k + 1 === i ? 's2' : 's1' }; }),
        labels: infl.map(function(v, k){ return { at: [Y[k + 1], v + ih * 0.06], text: n(v, 1) + '%' }; }) });
      figs.prices.querySelector('.ind-read').innerHTML = '<span class="ml-chip">' + Y[i] + ' basket ' + IL.money2(Pr.cost[i]) + '</span><span class="ml-op">÷</span><span class="ml-chip">' + Y[b] + ' basket ' + IL.money2(Pr.cost[b]) + '</span><span class="ml-op">× 100 =</span><span class="ml-chip is-total">CPI ' + n(Pr.cpi[i], 1) + '</span>';
      var head = i === b ? Y[i] + ' is the base year: its CPI is 100 by definition.' : 'In ' + Y[i] + ' the basket costs ' + IL.money2(Pr.cost[i]) + ': CPI <b>' + n(Pr.cpi[i], 1) + '</b>' + (i ? ', inflation <b>' + n(Pr.infl[i], 1) + '%</b> since ' + Y[i - 1] + '.' : '.');
      var body = '<p>The CPI compares the cost of the same basket each year with its cost in the base year. Change the base year: every CPI changes, but the <b>inflation rates do not</b>, because inflation compares two years with each other.</p>' +
        (i ? '<p>Inflation from ' + Y[i - 1] + ' to ' + Y[i] + ' = (' + n(Pr.cpi[i], 1) + ' − ' + n(Pr.cpi[i - 1], 1) + ') ÷ ' + n(Pr.cpi[i - 1], 1) + ' × 100 = ' + n(Pr.infl[i], 1) + '%.</p>' : '') +
        (i === 2 ? '<p class="mac-slip">Gas got cheaper in 2023, yet the CPI still rose: inflation fell to ' + n(Pr.infl[2], 1) + '% (disinflation), it did not turn negative (deflation).</p>' : '') +
        '<p>A wage of ' + IL.money2(Pr.wage[i]) + ' an hour in ' + Y[i] + ' buys what ' + IL.money2(Pr.realWage[i]) + ' bought in ' + Y[b] + ': real wage = nominal ÷ CPI × 100.</p>';
      var detH = '<h3 class="ls-title-l">The basket</h3><table class="ls-tbl"><thead><tr><th scope="col">Good</th><th scope="col" class="r">Qty</th>' + Y.map(function(y){ return '<th scope="col" class="r">' + y + '</th>'; }).join('') + '</tr></thead><tbody>' +
        IL.BASKET.map(function(g){ return '<tr><td>' + esc(g.name) + '</td><td class="r">' + g.q + '</td>' + g.p.map(function(x){ return '<td class="r">' + IL.money2(x) + '</td>'; }).join('') + '</tr>'; }).join('') +
        '<tr><th scope="row" colspan="2">Basket cost</th>' + Pr.cost.map(function(c){ return '<td class="r">' + IL.money2(c) + '</td>'; }).join('') + '</tr>' +
        '<tr><th scope="row" colspan="2">CPI</th>' + Pr.cpi.map(function(c){ return '<td class="r">' + n(c, 1) + '</td>'; }).join('') + '</tr>' +
        '<tr><th scope="row" colspan="2">Real wage</th>' + Pr.realWage.map(function(c){ return '<td class="r">' + IL.money2(c) + '</td>'; }).join('') + '</tr></tbody></table>';
      return { head: head, body: body, det: detH };
    }
    function drawReal(){
      var R = IL.realGdp(), Y = IL.YEARS, i = st.ryear;
      var nom = Y.map(function(y, k){ return [y, R.nominal[k]]; }), real = Y.map(function(y, k){ return [y, R.real[k]]; });
      var seg2 = function(pts, cls, dashed){ return pts.slice(1).map(function(p, k){ return { seg: true, through: [pts[k], p], cls: cls, dashed: dashed }; }); };
      plotBox(figs.real.querySelector('.ind-p3'), { label: 'Nominal and real GDP by year, in base-year dollars for real GDP', x: [Y[0] - 0.4, Y[4] + 0.4], y: [900, 1350], xStep: 1, xLabel: 'Year', yLabel: '$ billion',
        lines: seg2(nom, 's2', true).concat(seg2(real, 's1')), points: nom.map(function(p, k){ return { at: p, cls: 's2', label: k === i ? usd(p[1]) : '' }; }).concat(real.map(function(p, k){ return { at: p, cls: 's1', label: k === i ? usd(f1(p[1])) : '' }; })),
        legend: [{ name: 'Nominal GDP', cls: 's2' }, { name: 'Real GDP (' + Y[0] + ' prices)', cls: 's1' }] });
      figs.real.querySelector('.ind-read').innerHTML = '<span class="ml-chip">Nominal ' + usd(R.nominal[i]) + '</span><span class="ml-op">÷</span><span class="ml-chip">deflator ' + n(R.deflator[i]) + '</span><span class="ml-op">× 100 =</span><span class="ml-chip is-total">Real ' + usd(f1(R.real[i]), 'billion') + '</span>';
      var head = i === 0 ? Y[0] + ' is the base year: real and nominal GDP are equal.' : 'In ' + Y[i] + ' nominal GDP grew ' + n(R.gNom[i], 1) + '% but real GDP ' + (R.gReal[i] < 0 ? '<b>fell ' + n(-R.gReal[i], 1) + '%</b>' : 'grew <b>' + n(R.gReal[i], 1) + '%</b>') + '.';
      var body = '<p>Nominal GDP counts output at this year\'s prices, so it rises when prices rise even if output does not. Real GDP divides out the price level: real = nominal ÷ deflator × 100 (divide, never multiply).</p>' +
        (i ? '<p>Prices rose ' + n(R.infl[i], 1) + '% (the deflator went from ' + n(R.deflator[i - 1]) + ' to ' + n(R.deflator[i]) + '). Nominal growth ≈ real growth + inflation: ' + n(R.gNom[i], 1) + '% ≈ ' + n(R.gReal[i], 1) + '% + ' + n(R.infl[i], 1) + '%.</p>' : '') +
        (i === 3 ? '<p class="mac-slip">A year when nominal GDP rose and real GDP fell: the economy made less, and higher prices hid it.</p>' : '');
      var detH = '<h3 class="ls-title-l">Nominal and real GDP</h3><table class="ls-tbl"><thead><tr><th scope="col">Year</th><th scope="col" class="r">Nominal</th><th scope="col" class="r">Deflator</th><th scope="col" class="r">Real</th><th scope="col" class="r">Real growth</th></tr></thead><tbody>' +
        Y.map(function(y, k){ return '<tr><td>' + y + '</td><td class="r">' + usd(R.nominal[k]) + '</td><td class="r">' + R.deflator[k] + '</td><td class="r">' + usd(f1(R.real[k])) + '</td><td class="r">' + (k ? n(R.gReal[k], 1) + '%' : '') + '</td></tr>'; }).join('') + '</tbody></table>';
      return { head: head, body: body, det: detH };
    }

    /* ---------------------------------------------------- jobs */
    function drawJobs(){
      var J = st.jobs, r = IL.rates(J), dots = [];
      IL.GROUPS.forEach(function(g){ for(var k = 0; k < J[g.id]; k++) dots.push(g.id); });
      var c = [];
      dots.forEach(function(id, k){ var x = k % 10, y = Math.floor(k / 10); c.push('<circle class="ind-dot ' + JOB_CLS[id] + '" cx="' + (14 + x * 26) + '" cy="' + (14 + y * 26) + '" r="10"/>'); });
      figs.jobs.querySelector('.ind-waffle').innerHTML = '<svg class="ind-wsvg" viewBox="0 0 262 262" role="img" aria-label="100 adults: ' + J.E + ' employed, ' + r.U + ' unemployed (' + J.uF + ' frictional, ' + J.uS + ' structural, ' + J.uC + ' cyclical), ' + n(r.nilf) + ' not in the labor force, ' + J.nDis + ' of them discouraged workers.">' + c.join('') + '</svg>';
      var leg = [['is-emp', 'Employed', J.E], ['is-uf', 'Frictional', J.uF], ['is-us', 'Structural', J.uS], ['is-uc', 'Cyclical', J.uC], ['is-dis', 'Discouraged (out)', J.nDis], ['is-out', 'Retired, students, others (out)', J.nRet + J.nStu + J.nOth]];
      figs.jobs.querySelector('.ind-legend').innerHTML = '<ul>' + leg.map(function(l){ return '<li><i class="ind-sw ' + l[0] + '"></i>' + esc(l[1]) + ' <b>' + l[2] + '</b></li>'; }).join('') + '</ul><p class="ind-small">Each dot is one in 100 adults. Unemployed means without a job and looking.</p>';
      var cards = [['Unemployment rate', r.u, 'unemployed ÷ labor force'], ['Participation rate', r.lfpr, 'labor force ÷ adults'], ['Natural rate', r.natural, 'frictional + structural'], ['Cyclical', r.cyclical, 'actual − natural']];
      figs.jobs.querySelector('.ind-rates').innerHTML = cards.map(function(k){ return '<div class="ind-rate"><span>' + k[0] + '</span><b>' + n(k[1], 1) + '%</b><em>' + k[2] + '</em></div>'; }).join('');
      var head = st.jobSay || 'Unemployment ' + n(r.u, 1) + '%, participation ' + n(r.lfpr, 1) + '%. Tap an event to move people.';
      var body = '<p>Labor force = employed + unemployed = ' + J.E + ' + ' + r.U + ' = ' + r.lf + '. Unemployment rate = ' + r.U + ' ÷ ' + r.lf + ' × 100 = ' + n(r.u, 1) + '%. Participation = ' + r.lf + ' ÷ 100 × 100 = ' + n(r.lfpr, 1) + '%.</p>' +
        '<p>The natural rate (' + n(r.natural, 1) + '%) is frictional plus structural unemployment; cyclical unemployment (' + n(r.cyclical, 1) + '%) is what a downturn adds on top.</p>' +
        '<p class="mac-slip">Discouraged workers have stopped looking, so they are not counted as unemployed: when they give up, the unemployment rate falls even though no one found a job.</p>';
      var detH = '<h3 class="ls-title-l">The 100 adults</h3><table class="ls-tbl"><tbody>' + IL.GROUPS.map(function(g){ return '<tr><td>' + esc(g.name) + '</td><td class="r">' + J[g.id] + '</td></tr>'; }).join('') + '<tr><th scope="row">Labor force</th><td class="r"><b>' + r.lf + '</b></td></tr></tbody></table>';
      return { head: head, body: body, det: detH };
    }
    if(window.ResizeObserver){ var k0 = ''; new ResizeObserver(function(){ var k = stageEl.clientWidth + 'x' + stageEl.clientHeight; if(k !== k0){ k0 = k; update(false); } }).observe(stageEl); }
    function studio(p, s){
      LS = s;
      T.studioPane(p, s, { stage: [stageEl], dock: [ctl], why: [sayEl], details: [det] });
      lastCap = ''; update(true);
      if(s.mode() === 'explore' && st.view === 'gdp') T.hintSlot(s, nextBtn, 'Tap to add a transaction');
    }
    update(true);
    return { studio: studio };
  }

  /* ============================================================ test yourself */
  function quiz(host, data){
    var kinds = [];
    (data.contexts || []).forEach(function(c){ (c.types || []).forEach(function(t){ if(kinds.indexOf(t) < 0) kinds.push(t); }); });
    T.drill(host, data, { slug: 'indicators-lab', noun: 'drill',
      types: kinds.map(function(k){ return { value: k, label: IL.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: IL.generate, title: function(p){ return p.title; },
      extra: function(el, p){
        if(!p.fig || !p.fig.html) return;
        var box = document.createElement('div'); box.className = 'ind-qfig'; box.innerHTML = p.fig.html;
        el.appendChild(box);
      }
    });
  }
})();
