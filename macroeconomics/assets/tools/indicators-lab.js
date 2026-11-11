/* Economic indicators lab page (skills tool, free; docs/apmacro-spec.md section 6).
   OWNED BY THIS TOOL ONLY (builder T3, docs/apmacro-briefs/t3.md). Model:
   ApMacroMath.indicatorsLab (macroeconomics/assets/tools/math/indicators-lab.js);
   frame: ApMacroTools.modes and drill on the Tool Studio; plots ApMacroPlot.

   Explore, four views (each once its topic is published):
     GDP       add an economy's transactions one at a time: each is a token
               sized by its dollars that drops into C, I, G or X (an import
               lands in C or I and its twin hangs under −M) or into Not
               counted with its reason; GDP is the sum (gdpTokens()).
     Prices    the basket itself as two receipts (base-year prices and this
               year's, the same quantities), the CPI as the ratio of their
               totals (choose the base year), then CPI and inflation by year,
               and a wage in base-year dollars.
     Real GDP  the same year's goods at this year's prices and at base-year
               prices (the gap is only price), then nominal and real GDP
               (nominal ÷ deflator × 100) by year.
     Jobs      100 adults as people standing in three places (employed,
               unemployed with its three kinds, not in the labor force),
               with the labor force bracket over the first two; events walk
               people between places and the bracket and rates follow.
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

  /* ------------------------------------------------ jobs: people in places
     The 100 adults are people standing in three places: Employed,
     Unemployed (looking; frictional, structural, cyclical) and Not in the
     labor force (discouraged, retired, students, others). A bracket over the
     first two is the labor force; it stretches and shrinks as people walk
     between places (each person keeps its own figure, so an event is seen as
     people walking). */
  var JOB_ORDER = ['E', 'uF', 'uS', 'uC', 'nDis', 'nRet', 'nStu', 'nOth'];
  var JOB_NAME = { E: 'Employed', uF: 'Frictional', uS: 'Structural', uC: 'Cyclical', nDis: 'Discouraged', nRet: 'Retired', nStu: 'Students', nOth: 'Others' };
  function peopleFrom(J){ var out = []; JOB_ORDER.forEach(function(g){ for(var k = 0; k < J[g]; k++) out.push(g); }); return out; }
  // Who walks: people leave the groups that shrank (the last to arrive first) and join the groups that grew.
  function movePeople(people, from, to){
    var leave = [], need = [];
    JOB_ORDER.forEach(function(g){ var d = (to[g] || 0) - (from[g] || 0); if(d < 0){ var idx = []; people.forEach(function(x, i){ if(x === g) idx.push(i); }); leave = leave.concat(idx.slice(d)); } else for(var k = 0; k < d; k++) need.push(g); });
    need.forEach(function(g, i){ if(leave[i] != null) people[leave[i]] = g; });
  }
  function jobLayout(J, W, H){
    var top = 58, A = Math.max(120, H - top - 6), gap = 12, R = Math.max(5, Math.round(Math.sqrt(66 * 0.62 * A / (0.4 * W)))), L;
    for(var tries = 0; tries < 14; tries++, R++){
      var ch = A / R, cw = ch * 0.62, pad = 6;
      var E = { x: 4, w: Math.max(84, Math.ceil(J.E / R) * cw + 2 * pad) };
      // a sub-group: a block of A / n height with a label line, people in rows that fill left to right
      // block heights follow the head counts (a bigger group gets more rows)
      var sub = function(ids, x){
        var wt = ids.map(function(g){ return Math.max(J[g], 1) + 3; }), tot = wt.reduce(function(a, b){ return a + b; }, 0), w = 0, hs = [], rows = [], base = 15 + ch + 2, spare = Math.max(0, A - base * ids.length);
        ids.forEach(function(g, j){ var bh = base + spare * wt[j] / tot, rr = Math.max(1, Math.floor((bh - 15) / ch)); hs.push(bh); rows.push(rr); w = Math.max(w, Math.ceil(Math.max(J[g], 1) / rr) * cw); });
        return { x: x, w: Math.max(W < 480 ? 66 : 92, w + 2 * pad), rows: rows, hs: hs, ids: ids };
      };
      var U = sub(['uF', 'uS', 'uC'], E.x + E.w + gap), N = sub(['nDis', 'nRet', 'nStu', 'nOth'], 0);
      N.x = U.x + U.w + gap * 1.6;
      L = { R: R, ch: ch, cw: cw, pad: pad, top: top, A: A, E: E, U: U, N: N };
      if(N.x + N.w <= W - 4) break;
    }
    return L;
  }
  function jobsScene(box, J, r, people, changed){
    changed = changed || {};
    var W = Math.max(300, box.clientWidth || 600), H = Math.max(230, Math.min(520, box.clientHeight || 340)), L = jobLayout(J, W, H), narrow = W < 480;
    var key = W + 'x' + H, svg = box.querySelector('svg.ind-jsvg');
    if(!svg || box.getAttribute('data-k') !== key){
      box.setAttribute('data-k', key);
      var figs = people.map(function(_, i){ return '<g class="ind-p" data-i="' + i + '"><use href="#ind-person"/></g>'; }).join('');
      box.innerHTML = '<svg class="ind-jsvg is-fresh" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img"><defs><g id="ind-person"><circle cx="0" cy="-0.83" r="0.15"/><path d="M-0.21 -0.02V-0.45Q-0.21 -0.64 0 -0.64Q0.21 -0.64 0.21 -0.45V-0.02Z"/></g></defs><g class="ind-zones"></g><g class="ind-people">' + figs + '</g></svg>';
      svg = box.querySelector('svg.ind-jsvg');
      svg.addEventListener('click', function(){ svg.classList.toggle('is-named'); });
      requestAnimationFrame(function(){ svg.classList.remove('is-fresh'); });
    }
    var z = [], f1x = f1, y0 = L.top, A = L.A;
    // zones
    function zone(x, w, cls, title){ z.push('<rect class="ind-zone ' + cls + '" x="' + f1x(x) + '" y="' + f1x(y0 - 4) + '" width="' + f1x(w) + '" height="' + f1x(A + 8) + '" rx="10"/>'); if(title) z.push('<text class="ind-zt ' + cls + '" x="' + f1x(x + 8) + '" y="' + f1x(y0 + 12) + '">' + title + '</text>'); }
    zone(L.E.x, L.E.w, 'is-e', '');
    zone(L.U.x, L.U.w, 'is-u', '');
    zone(L.N.x, L.N.w, 'is-n', '');
    // the labor force bracket over Employed and Unemployed
    var bx0 = L.E.x, bx1 = L.U.x + L.U.w, by = 16;
    z.push('<path class="ind-brk" d="M' + f1x(bx0) + ' ' + (by + 8) + 'V' + by + 'H' + f1x(bx1) + 'V' + (by + 8) + '"/>');
    z.push('<text class="ind-brt" x="' + f1x((bx0 + bx1) / 2) + '" y="' + (by - 4) + '" text-anchor="middle">Labor force ' + r.lf + '</text>');
    z.push('<text class="ind-brt is-n" x="' + f1x(L.N.x + L.N.w / 2) + '" y="' + (by - 4) + '" text-anchor="middle">' + (narrow ? 'Not in it ' : 'Not in the labor force ') + r.nilf + '</text>');
    z.push('<text class="ind-zh is-e" x="' + f1x(L.E.x + L.E.w / 2) + '" y="' + (y0 - 12) + '" text-anchor="middle">Employed ' + J.E + '</text>');
    z.push('<text class="ind-zh is-u" x="' + f1x(L.U.x + L.U.w / 2) + '" y="' + (y0 - 12) + '" text-anchor="middle">' + (narrow ? 'Looking ' : 'Unemployed ') + r.U + '</text>');
    // where each person stands
    var spot = {}, pos = {};
    spot.E = function(k){ return [L.E.x + L.pad + L.cw * (Math.floor(k / L.R) + 0.5), y0 + L.ch * (k % L.R + 1) - 2]; };
    [L.U, L.N].forEach(function(S){
      var acc = 0;
      S.ids.forEach(function(g, j){
        var by0 = y0 + acc, rows = S.rows[j]; acc += S.hs[j];
        // Pass 2: a kind is named when the last event moved people into or out of it; a tap on the picture names every kind.
        z.push('<text class="ind-sub is-' + g + (changed[g] ? '' : ' is-quiet') + '" x="' + f1x(S.x + 6) + '" y="' + f1x(by0 + 11) + '">' + JOB_NAME[g] + ' ' + J[g] + '</text>');
        if(j) z.push('<line class="ind-subl" x1="' + f1x(S.x + 4) + '" x2="' + f1x(S.x + S.w - 4) + '" y1="' + f1x(by0) + '" y2="' + f1x(by0) + '"/>');
        spot[g] = function(k){ return [S.x + L.pad + L.cw * (Math.floor(k / rows) + 0.5), by0 + 15 + L.ch * (k % rows + 1) - 2]; };
      });
    });
    var count = {};
    people.forEach(function(g, i){ var k = count[g] = (count[g] || 0) + 1; pos[i] = spot[g](k - 1); });
    svg.querySelector('.ind-zones').innerHTML = z.join('');
    var s = L.ch * 0.92;
    svg.querySelectorAll('.ind-p').forEach(function(el){
      var i = +el.getAttribute('data-i'), p = pos[i], g = people[i];
      if(!p) return;
      el.setAttribute('class', 'ind-p ' + JOB_CLS[g]);
      el.style.transform = 'translate(' + f1x(p[0]) + 'px,' + f1x(p[1]) + 'px) scale(' + f1x(s * 10) / 10 + ')';
    });
    svg.setAttribute('aria-label', '100 adults standing in three places: ' + J.E + ' employed; ' + r.U + ' unemployed and looking (' + J.uF + ' frictional, ' + J.uS + ' structural, ' + J.uC + ' cyclical); ' + r.nilf + ' not in the labor force (' + J.nDis + ' discouraged, ' + J.nRet + ' retired, ' + J.nStu + ' students, ' + J.nOth + ' others). The labor force is ' + r.lf + ', so the unemployment rate is ' + n(r.u, 1) + '%.');
  }

  /* ------------------------------------------------ GDP: transactions as tokens
     Each transaction is a token sized by its dollars that lands in its
     column, so C, I, G and X are stacks of the purchases that made them; an
     import lands in C (or I) and its twin hangs under −M; a transfer, a used
     good or a stock falls into Not counted with its reason. GDP is the sum. */
  var WHY_OUT = { socsec: 'transfer', ubenefit: 'transfer', stock: 'financial asset', bond: 'financial asset', usedcar: 'used good', flour: 'intermediate good', cooking: 'unpaid work', mexico: 'made abroad' };
  function gdpTokens(box, items, s, last){
    var w = Math.max(300, box.clientWidth || 600), h = Math.max(220, Math.min(520, box.clientHeight || 320)), narrow = w < 480;
    var cols = [{ id: 'C', t: 'C', l: 'Consumption' }, { id: 'I', t: 'I', l: 'Investment' }, { id: 'G', t: 'G', l: 'Government' }, { id: 'X', t: 'X', l: 'Exports' }, { id: 'M', t: '−M', l: 'Imports' }, { id: 'gdp', t: 'GDP', l: '= GDP' }, { id: 'none', t: 'Out', l: 'Not counted' }];
    var stacks = { C: [], I: [], G: [], X: [], M: [], none: [] };
    items.forEach(function(t){
      if(t.cat === 'CM'){ stacks.C.push({ t: t, im: true }); stacks.M.push({ t: t }); }
      else if(t.cat === 'IM'){ stacks.I.push({ t: t, im: true }); stacks.M.push({ t: t }); }
      else stacks[t.cat].push({ t: t });
    });
    var top = 38, bot = 30, hi = Math.max(160, s.C, s.I, s.G, s.X, s.gdp, s.none), lo = s.M ? Math.max(30, s.M) : 0;
    var ph = h - top - bot, y0 = top + ph * hi / (hi + lo), k = ph / (hi + lo), gapX = narrow ? 4 : 8, cw = (w - 8) / cols.length, tw = cw - gapX;
    var g = ['<line class="ind-zero" x1="4" x2="' + f1(w - 4 - cw) + '" y1="' + f1(y0) + '" y2="' + f1(y0) + '"/>'];
    cols.forEach(function(c, i){
      var x = 4 + cw * i + gapX / 2, cx = x + tw / 2, total = c.id === 'gdp' ? s.gdp : c.id === 'M' ? -s.M : c.id === 'none' ? s.none : s[c.id];
      if(c.id === 'none') g.push('<rect class="ind-bin" x="' + f1(x - 2) + '" y="' + f1(top - 4) + '" width="' + f1(tw + 4) + '" height="' + f1(h - top - bot + 8) + '" rx="8"/>');
      else if(c.id !== 'gdp') g.push('<rect class="ind-slot" x="' + f1(x) + '" y="' + f1(top) + '" width="' + f1(tw) + '" height="' + f1(y0 - top) + '" rx="6"/>');
      g.push('<text class="ind-ct' + (c.id === 'gdp' ? ' is-gdp' : '') + '" x="' + f1(cx) + '" y="' + (h - 12) + '" text-anchor="middle">' + (narrow ? c.t : c.l) + '</text>');
      // Pass 2: two totals at a time, GDP and the column the last transaction landed in (Details has every one).
      var hit = last && (c.id === 'gdp' || c.id === ({ CM: 'C', IM: 'I' }[last.cat] || last.cat) || (c.id === 'M' && (last.cat === 'CM' || last.cat === 'IM')));
      g.push('<text class="ind-ctot' + (c.id === 'gdp' ? ' is-gdp' : '') + '" x="' + f1(cx) + '" y="16" text-anchor="middle">' + (hit ? usd(total) : '') + '</text>');
      if(c.id === 'gdp'){
        if(s.gdp > 0) g.push('<rect class="ind-gdpbar" x="' + f1(x) + '" y="' + f1(y0 - s.gdp * k) + '" width="' + f1(tw) + '" height="' + f1(s.gdp * k) + '" rx="6"/>');
        return;
      }
      var acc = 0;
      stacks[c.id].forEach(function(o){
        var t = o.t, hh = Math.max(2, t.amt * k - 2), down = c.id === 'M', yy = down ? y0 + acc * k + 1 : y0 - (acc + t.amt) * k + 1, isNew = t === last;
        acc += t.amt;
        var cls = 'ind-tok is-' + (c.id === 'none' ? 'out' : c.id) + (o.im || down ? ' is-im' : '') + (isNew ? ' is-new' : '');
        var fits = hh >= 15 && !narrow, two = hh >= 32 && !narrow, room = Math.floor((tw - 10) / 6.1);
        var name = (down ? '−' : '') + (SHORT[t.id] || t.id) + (two ? '' : ' ' + usd(t.amt));
        if(name.length > room) name = name.slice(0, Math.max(3, room - 1)) + '…';
        g.push('<g class="' + cls + '"><rect x="' + f1(x) + '" y="' + f1(yy) + '" width="' + f1(tw) + '" height="' + f1(hh) + '" rx="4"/>' +
          (fits ? '<text x="' + f1(x + 5) + '" y="' + f1(yy + Math.min(hh / 2, 11) + 4) + '"><tspan class="ind-tn">' + esc(name) + '</tspan></text>' : '') +
          (two ? '<text class="ind-ta" x="' + f1(x + 5) + '" y="' + f1(yy + 28) + '">' + esc((function(l){ return l.length > room ? (c.id === 'none' ? (WHY_OUT[t.id] || '').slice(0, room) : l.slice(0, room)) : l; })((c.id === 'none' ? (WHY_OUT[t.id] || 'not counted') + ' · ' : '') + usd(t.amt))) + '</text>' : '') +
          (hh >= 13 && narrow ? '<text class="ind-ta" x="' + f1(cx) + '" y="' + f1(yy + hh / 2 + 4) + '" text-anchor="middle">' + usd(t.amt) + '</text>' : '') + '</g>');
      });
    });
    if(!items.length) g.push('<text class="ind-hint" x="' + f1(w / 2) + '" y="' + f1(top + (y0 - top) / 2) + '" text-anchor="middle">Each purchase lands in its column here</text>');
    box.innerHTML = '<svg class="ind-svg ind-tsvg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc('GDP by expenditure so far, each transaction a block in its column: consumption ' + usd(s.C) + ', investment ' + usd(s.I) + ', government purchases ' + usd(s.G) + ', exports ' + usd(s.X) + ', imports ' + usd(s.M) + ' subtracted, not counted ' + usd(s.none) + '; GDP ' + usd(s.gdp) + ' billion.') + '">' + g.join('') + '</svg>';
  }

  /* ------------------------------------------------ prices: the basket itself
     Two receipts for the same basket: base-year prices and this year's. The
     CPI is the ratio of the two totals (the chips under them). */
  var ICON = {
    pizza: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4Q10 1 17 4L10 18Z" class="ind-ic-a"/><path d="M3 4Q10 1 17 4" class="ind-ic-b"/><circle cx="8" cy="7" r="1.3" class="ind-ic-c"/><circle cx="12" cy="9" r="1.3" class="ind-ic-c"/><circle cx="10" cy="12.5" r="1.1" class="ind-ic-c"/></svg>',
    movie: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 6h16v3a1.5 1.5 0 0 0 0 3v3H2v-3a1.5 1.5 0 0 0 0-3Z" class="ind-ic-a"/><path d="M7 6v9" class="ind-ic-d"/></svg>',
    gas: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3h8v15H4Z" class="ind-ic-a"/><path d="M5.5 5h5v4h-5Z" class="ind-ic-e"/><path d="M12 7l3 2v6a1.2 1.2 0 0 0 2.4 0V8L15 5" class="ind-ic-b"/></svg>'
  };
  function basketHtml(Pr, i, b){
    var Y = IL.YEARS;
    function receipt(k, label, cls){
      return '<div class="ind-rcp ' + cls + '"><p class="ind-rh">' + label + '</p><ul>' + IL.BASKET.map(function(g){
        var up = k !== b && g.p[k] > g.p[b] + 1e-9, dn = k !== b && g.p[k] < g.p[b] - 1e-9;
        return '<li><span class="ind-ic">' + (ICON[g.id] || '') + '</span><span class="ind-q">' + g.q + '<span class="ind-qw"> ' + esc(g.name.toLowerCase()) + '</span></span><span class="ind-pp' + (up ? ' is-up' : dn ? ' is-dn' : '') + '">× ' + IL.money2(g.p[k]) + '</span><b>' + IL.money2(g.q * g.p[k]) + '</b></li>';
      }).join('') + '</ul><p class="ind-rt"><span>Basket cost</span><b>' + IL.money2(Pr.cost[k]) + '</b></p></div>';
    }
    return receipt(b, 'Base year ' + Y[b] + ' prices', 'is-base') + '<div class="ind-same-b" aria-hidden="true"><span>same basket</span></div>' + receipt(i, Y[i] + ' prices' + (i === b ? ' (the base year)' : ''), 'is-now');
  }
  /* Real: the same year's goods at this year's prices (nominal) and at
     base-year prices (real); the difference is only the price change. */
  // Pass 2: the two totals are written once, in the formula under the bars (not also at the bar ends).
  function sameGoods(box, R, i){
    var Y = IL.YEARS, nom = R.nominal[i], real = R.real[i], mx = Math.max.apply(null, R.nominal), wN = nom / mx * 100, wR = real / mx * 100;
    return '<p class="ind-sgh">The goods made in ' + Y[i] + ', counted two ways</p>' +
      '<div class="ind-sgrow"><span class="ind-sgl">At ' + Y[i] + ' prices <em>nominal</em></span><div class="ind-sgbar"><i class="is-goods" style="width:' + wR.toFixed(1) + '%"></i><i class="is-price" style="width:' + Math.max(0, wN - wR).toFixed(1) + '%"></i></div></div>' +
      '<div class="ind-sgrow"><span class="ind-sgl">At ' + Y[0] + ' prices <em>real</em></span><div class="ind-sgbar"><i class="is-goods" style="width:' + wR.toFixed(1) + '%"></i></div></div>' +
      '<p class="ind-sgk"><i class="is-goods"></i> the goods themselves <i class="is-price"></i> only higher prices' + (i ? ' (' + usd(f1(nom - real)) + 'B)' : '') + '</p>';
  }

  /* ============================================================ explore */
  function explore(host, data){
    var LS = null, live = {};
    (data.contexts || []).forEach(function(c){ live[c.id] = 1; });
    var views = [{ value: 'gdp', label: 'GDP' }, { value: 'prices', label: 'Prices' }, { value: 'real', label: 'Real' }, { value: 'jobs', label: 'Jobs' }].filter(function(v){ return live[v.value]; });
    if(!views.length) views = [{ value: 'prices', label: 'Prices' }];
    // Pass 3: the GDP view opens with the first transaction already placed, so the columns are never empty.
    var st = { view: views[0].value, seed: 1 + Math.floor(Math.random() * 9999), econ: null, added: 3, year: 4, base: 0, ryear: 3, jobs: IL.JOBS0, jobSay: '', touched: false };
    st.econ = IL.economy(M.rng(st.seed));
    st.people = peopleFrom(IL.JOBS0);
    var cue = T.cue('Tap Next transaction and watch where it goes.');
    host.innerHTML = '<section class="bt-problem ind-card" aria-label="Indicators explorer"><div class="ind-stage">' +
      '<div class="ind-fig" data-v="gdp"><div class="ind-tx"></div><div class="ind-gdpbox"></div><div class="ind-tray"></div></div>' +
      '<div class="ind-fig" data-v="prices" hidden><div class="ind-basket"></div><div class="ind-read"></div><button type="button" class="ind-yrs" aria-expanded="false">See every year</button><div class="ind-plots" hidden><div class="ind-plot ind-p1"></div><div class="ind-plot ind-p2"></div></div></div>' +
      '<div class="ind-fig" data-v="real" hidden><div class="ind-same"></div><div class="ind-read"></div><div class="ind-plot ind-p3"></div></div>' +
      '<div class="ind-fig" data-v="jobs" hidden><div class="ind-scene"></div><div class="ind-rates"></div></div>' +
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
    groups.gdp.querySelector('.ind-new').addEventListener('click', function(){ touch(); st.seed++; st.econ = IL.economy(M.rng(st.seed)); st.added = 1; update(true); });
    // Prices
    var yearSl = T.slider({ label: 'Year', min: IL.YEARS[0], max: IL.YEARS[IL.YEARS.length - 1], step: 1, value: IL.YEARS[st.year], decimals: 0, onInput: function(v){ st.year = v - IL.YEARS[0]; touch(); update(false); } });
    groups.prices.appendChild(yearSl.el);
    var baseSel = T.choiceSelect({ label: 'Base year', options: IL.YEARS.map(function(y, i){ return { value: i, label: String(y) }; }), value: 0, onChange: function(v){ st.base = +v; touch(); update(true); } });
    baseSel.el.classList.add('bt-inline');
    groups.prices.appendChild(baseSel.el);
    var ryearSl = T.slider({ label: 'Year', min: IL.YEARS[0], max: IL.YEARS[IL.YEARS.length - 1], step: 1, value: IL.YEARS[st.ryear], decimals: 0, onInput: function(v){ st.ryear = v - IL.YEARS[0]; touch(); update(false); } });
    groups.real.appendChild(ryearSl.el);
    // Jobs: the events
    // Pass 2: four events in view (a pair for each kind of change), the other four behind More events.
    var FIRST = { recession: 1, recovery: 1, grads: 1, giveup: 1 };
    var evs = IL.EVENTS.filter(function(e){ return FIRST[e.id]; }).concat(IL.EVENTS.filter(function(e){ return !FIRST[e.id]; }));
    groups.jobs.innerHTML = '<p class="ind-lbl">What happens</p><div class="ind-events" data-ls-primary>' + evs.map(function(e){ return '<button type="button" class="bt-btn ind-ev' + (FIRST[e.id] ? '' : ' is-more') + '" data-ev="' + e.id + '">' + esc(e.name) + '</button>'; }).join('') +
      '<button type="button" class="bt-btn ind-evmore" aria-expanded="false">More events</button></div><button type="button" class="bt-btn ind-reset">Start over</button>';
    // On a phone the events ride in the studio's sticky band (data-ls-primary), so listen on them, not on their home.
    function onJobs(e){
      var b = e.target.closest('[data-ev]');
      var mb = e.target.closest('.ind-evmore');
      if(mb){ var box = mb.parentNode, open = !box.classList.contains('is-open'); box.classList.toggle('is-open', open); mb.setAttribute('aria-expanded', String(open)); mb.textContent = open ? 'Fewer events' : 'More events'; return; }
      if(b){ touch(); st.jobPrev = st.jobs; var out = IL.jobEvent(st.jobs, b.getAttribute('data-ev')); st.jobSay = out.moved ? out.say : 'Nothing to move: no one is in that group right now.'; movePeople(st.people, st.jobs, out.st); st.jobs = out.st; update(true); }
      if(e.target.closest('.ind-reset')){ movePeople(st.people, st.jobs, IL.JOBS0); st.jobs = IL.JOBS0; st.jobPrev = null; st.jobSay = ''; update(true); }
    }
    groups.jobs.querySelector('.ind-events').addEventListener('click', onJobs);
    // Prices: the CPI and inflation charts by year open on a tap (the basket is the picture).
    var yrsBtn = figs.prices.querySelector('.ind-yrs');
    yrsBtn.addEventListener('click', function(){ var pl = figs.prices.querySelector('.ind-plots'), open = pl.hidden; pl.hidden = !open; yrsBtn.setAttribute('aria-expanded', String(open)); yrsBtn.textContent = open ? 'Hide the years' : 'See every year'; figs.prices.classList.toggle('is-yrs', open); touch(); update(false); });
    groups.jobs.querySelector('.ind-reset').addEventListener('click', onJobs);

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
      gdpTokens(figs.gdp.querySelector('.ind-gdpbox'), items, s, last);
      figs.gdp.querySelector('.ind-tray').innerHTML = '';
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
      figs.prices.querySelector('.ind-basket').innerHTML = basketHtml(Pr, i, b);
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
        lines: seg2(nom, 's2', true).concat(seg2(real, 's1')), points: nom.map(function(p){ return { at: p, cls: 's2', label: '' }; }).concat(real.map(function(p){ return { at: p, cls: 's1', label: '' }; })),
        legend: [{ name: 'Nominal GDP', cls: 's2' }, { name: 'Real GDP (' + Y[0] + ' prices)', cls: 's1' }] });
      figs.real.querySelector('.ind-same').innerHTML = sameGoods(figs.real.querySelector('.ind-same'), R, i);
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
      var J = st.jobs, r = IL.rates(J);
      var P = st.jobPrev, r0 = P ? IL.rates(P) : null, changed = {};
      if(P) JOB_ORDER.forEach(function(g){ if(P[g] !== J[g]) changed[g] = 1; });
      jobsScene(figs.jobs.querySelector('.ind-scene'), J, r, st.people, changed);
      // Pass 2: the unemployment rate always; another rate shows only when the last event changed it (was then now).
      var cards = [['Unemployment rate', 'u', 'unemployed ÷ labor force'], ['Participation rate', 'lfpr', 'labor force ÷ adults'], ['Natural rate', 'natural', 'frictional + structural'], ['Cyclical', 'cyclical', 'actual − natural']];
      figs.jobs.querySelector('.ind-rates').innerHTML = cards.filter(function(k, i){ return !i || (r0 && n(r0[k[1]], 1) !== n(r[k[1]], 1)); }).map(function(k){
        var was = r0 && n(r0[k[1]], 1) !== n(r[k[1]], 1) ? '<i>' + n(r0[k[1]], 1) + '% → </i>' : '';
        return '<div class="ind-rate"><span>' + k[0] + '</span><b>' + was + n(r[k[1]], 1) + '%</b><em>' + k[2] + '</em></div>'; }).join('');
      var head = st.jobSay || 'Unemployment ' + n(r.u, 1) + '%, participation ' + n(r.lfpr, 1) + '%. Tap an event to move people; tap the people to name each group.';
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
