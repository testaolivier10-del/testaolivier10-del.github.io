/* Multiplier lab page (skills tool, Premium; docs/apmacro-spec.md section 6).
   OWNED BY THIS TOOL ONLY (builder T3, docs/apmacro-briefs/t3.md). Model:
   ApMacroMath.multiplierLab (macroeconomics/assets/tools/math/multiplier-lab.js);
   frame: ApMacroTools.modes and drill on the Tool Studio.

   Explore, three views (each shown once its topic is published):
     Multiplier   a change in purchases or taxes and its spending rounds, as
                  bars, adding up to the total (change x multiplier); the
                  MPC chips change every round at once.
     Close a gap  an AD-AS graph (ApMacroGraph, AD shifted by the effect of
                  the student's policy as a share of the gap) and a gap meter:
                  the gap closes exactly at gap / multiplier; multiplying the
                  gap overshoots.
     Money        limited reserves: the first bank's balance sheet, the loan
                  rounds, and the money market graph (ApMacroGraph) with MS
                  moving the way the money supply changes.
   Test yourself: the multipliers from an MPC, a change times its
   multiplier, closing a gap (direction first, divide), money creation. */
(function(){
  'use strict';
  var T = window.ApMacroTools, M = window.ApMacroMath, G = window.ApMacroGraph;
  (function(){ var app = document.getElementById('app'); if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Numbers & formulas'); })();
  if(!T || !M || !M.multiplierLab || M.multiplierLab.stub || !G) return;
  var ML = M.multiplierLab, esc = T.esc, n = ML.n, usd = ML.usd;
  function reduced(){ return T.reduced(); }

  T.mount('multiplier-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'multiplier-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------------ helpers */
  function seg(label, items, value, onChange, cls){
    var el = document.createElement('div');
    el.className = 'ls-seg ml-seg' + (cls ? ' ' + cls : '');
    el.setAttribute('role', 'group'); el.setAttribute('aria-label', label);
    el.innerHTML = '<span class="ml-seg-l" aria-hidden="true">' + esc(label) + '</span>' + items.map(function(it){ return '<button type="button" class="bt-mode" data-v="' + esc(it.value) + '" aria-pressed="' + (String(it.value) === String(value)) + '"' + (it.aria ? ' aria-label="' + esc(it.aria) + '"' : '') + '>' + esc(it.label) + '</button>'; }).join('');
    el.addEventListener('click', function(e){ var b = e.target.closest('button[data-v]'); if(!b) return; set(b.getAttribute('data-v')); onChange(b.getAttribute('data-v')); });
    function set(v){ el.querySelectorAll('button[data-v]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === String(v))); }); }
    return { el: el, set: set };
  }
  function f1(v){ return Math.round(v * 10) / 10; }
  /* Signed bars with a zero line: cols [{ label, parts: [{ v, cls }], dot?, note? }].
     Drawn at the box's pixel size so the text stays readable at 360 px. */
  function bars(box, cols, o){
    var w = Math.max(280, box.clientWidth || 560), h = Math.max(170, Math.min(520, box.clientHeight || 260));
    var L = 46, R = 10, Tp = 22, B = 34, pw = w - L - R, ph = h - Tp - B;
    var hi = 0, lo = 0;
    cols.forEach(function(c){ var pos = 0, neg = 0; c.parts.forEach(function(p){ if(p.v > 0) pos += p.v; else neg += p.v; }); if(c.outline != null){ pos = Math.max(pos, c.outline); neg = Math.min(neg, c.outline); } hi = Math.max(hi, pos); lo = Math.min(lo, neg); });
    if(o.scale){ if(hi > 0 || lo === 0) hi = Math.max(hi, o.scale); else lo = Math.min(lo, -o.scale); }
    if(hi === 0 && lo === 0) hi = 1;
    var span = hi - lo, sy = function(v){ return Tp + (hi - v) / span * ph; }, cw = pw / cols.length, bw = Math.min(46, cw * 0.62);
    // Narrow: value labels only where they fit (the first and the strong columns).
    var tight = cw < 44;
    var g = ['<line class="ml-zero" x1="' + L + '" x2="' + (w - R) + '" y1="' + f1(sy(0)) + '" y2="' + f1(sy(0)) + '"/>'];
    g.push('<text class="ml-ax" x="' + (L - 6) + '" y="' + f1(sy(hi) + 4) + '" text-anchor="end">' + esc(o.fmt(hi)) + '</text>');
    if(lo < 0) g.push('<text class="ml-ax" x="' + (L - 6) + '" y="' + f1(sy(lo) + 4) + '" text-anchor="end">' + esc(o.fmt(lo)) + '</text>');
    g.push('<text class="ml-ax" x="' + (L - 6) + '" y="' + f1(sy(0) + 4) + '" text-anchor="end">0</text>');
    cols.forEach(function(c, i){
      var cx = L + cw * (i + 0.5), x = cx - bw / 2, up = 0, dn = 0;
      if(c.outline != null){ var oy = Math.min(sy(0), sy(c.outline)), oh = Math.abs(sy(c.outline) - sy(0)); g.push('<rect class="ml-outline" x="' + f1(x - 3) + '" y="' + f1(oy) + '" width="' + f1(bw + 6) + '" height="' + f1(Math.max(1, oh)) + '" rx="4"/>'); }
      c.parts.forEach(function(p){
        if(!p.v) return;
        var y0 = p.v > 0 ? up : dn, y1 = y0 + p.v;
        if(p.v > 0) up = y1; else dn = y1;
        var top = Math.min(sy(y0), sy(y1)), hh = Math.max(0.5, Math.abs(sy(y1) - sy(y0)));
        g.push('<rect class="ml-bar ' + (p.cls || '') + '" x="' + f1(x) + '" y="' + f1(top) + '" width="' + f1(bw) + '" height="' + f1(hh) + '" rx="3"' + (p.op != null ? ' style="opacity:' + p.op + '"' : '') + '/>');
      });
      var labV = c.value != null ? c.value : up + dn, labY = labV >= 0 ? sy(Math.max(up, c.outline || 0)) - 6 : sy(Math.min(dn, c.outline || 0)) + 14;
      if(c.q) g.push('<text class="ml-val is-strong ml-q" x="' + f1(cx) + '" y="' + f1(sy(0) - 8) + '" text-anchor="middle">?</text>');
      else if(c.show !== false && (!tight || i === 0 || c.strong)) g.push('<text class="ml-val' + (c.strong ? ' is-strong' : '') + '" x="' + f1(cx) + '" y="' + f1(labY) + '" text-anchor="middle">' + esc(o.fmt(labV)) + '</text>');
      if(c.dot != null) g.push('<circle class="ml-dot" cx="' + f1(cx) + '" cy="' + f1(sy(c.dot)) + '" r="4.5"/>');
      g.push('<text class="ml-xl' + (c.strong ? ' is-strong' : '') + '" x="' + f1(cx) + '" y="' + (h - B + 16) + '" text-anchor="middle">' + esc(tight && c.short != null ? c.short : c.label) + '</text>');
    });
    g.push('<text class="ml-axname" x="' + f1(L + pw / 2) + '" y="' + (h - 4) + '" text-anchor="middle">' + esc(o.xName) + '</text>');
    g.push('<text class="ml-axname" x="4" y="13">' + esc(o.yName) + '</text>');
    box.innerHTML = '<svg class="ml-bars" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(o.label) + '">' + g.join('') + '</svg>';
  }

  /* ============================================================ explore */
  var POLICY = [
    { value: 'G+', label: 'Purchases rise', kind: 'G', sign: 1 }, { value: 'G-', label: 'Purchases fall', kind: 'G', sign: -1 },
    { value: 'T-', label: 'Tax cut', kind: 'T', sign: -1 }, { value: 'T+', label: 'Tax rise', kind: 'T', sign: 1 },
    { value: 'BB', label: 'Purchases and taxes both rise', kind: 'BB', sign: 1 }
  ];
  function explore(host, data){
    var LS = null, live = {}, ctxs = data.contexts || [];
    ctxs.forEach(function(c){ live[c.id] = 1; });
    var views = [{ value: 'ripple', label: 'Multiplier', ok: live.spending }, { value: 'gap', label: 'Close a gap', ok: live.gap }, { value: 'money', label: 'Money', ok: live.money }].filter(function(v){ return v.ok; });
    if(!views.length) views = [{ value: 'ripple', label: 'Multiplier' }];
    var st = { view: views[0].value, mpc: 0.8, pol: 'G+', amt: 20, gkind: 'recessionary', gsize: 80, tool: 'G', change: 0, rr: 0.1, scn: 'buyBank', X: 1000, touched: false };
    var cue = T.cue('Tap an MPC. Every round of spending changes, and so does the total.');
    host.innerHTML = '<section class="bt-problem ml-card" aria-label="Multiplier explorer">' +
      '<div class="ml-stage">' +
        '<div class="ml-fig" data-v="ripple"><div class="ml-read"></div><div class="ml-barbox"></div></div>' +
        '<div class="ml-fig" data-v="gap" hidden><div class="ml-gapgrid"><div class="ml-graph"></div><div class="ml-meter"></div></div></div>' +
        '<div class="ml-fig" data-v="money" hidden><div class="ml-read"></div><div class="ml-barbox"></div><div class="ml-moneyrow"><div class="ml-tacct"></div><div class="ml-graph ml-mm"></div></div></div>' +
      '</div>' +
      '<div class="ml-ctl"></div><div class="ml-say"></div><div class="ml-det"></div><p class="sr-only ml-live"></p></section>';
    var card = host.querySelector('.ml-card'), ctl = host.querySelector('.ml-ctl'), det = host.querySelector('.ml-det'), sayEl = host.querySelector('.ml-say');
    card.insertBefore(cue.el, sayEl);
    var figs = {}; host.querySelectorAll('.ml-fig').forEach(function(f){ figs[f.getAttribute('data-v')] = f; });
    var say = T.announcer(host.querySelector('.ml-live'));
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }

    /* -------------------------------------------------- controls */
    var viewSeg = views.length > 1 ? seg('View', views, st.view, function(v){ st.view = v; touch(); update(true); }, 'ml-views') : null;
    if(viewSeg) ctl.appendChild(viewSeg.el);
    var groups = { ripple: document.createElement('div'), gap: document.createElement('div'), money: document.createElement('div') };
    Object.keys(groups).forEach(function(k){ groups[k].className = 'ml-group'; groups[k].setAttribute('data-v', k); ctl.appendChild(groups[k]); });
    var mpcItems = ML.MPCS.map(function(m){ return { value: m, label: n(m), aria: 'MPC ' + n(m) }; });
    var mpcA = seg('MPC', mpcItems, st.mpc, function(v){ st.mpc = +v; mpcB.set(v); touch(); update(true); });
    var mpcB = seg('MPC', mpcItems, st.mpc, function(v){ st.mpc = +v; mpcA.set(v); touch(); update(true); });
    groups.ripple.appendChild(mpcA.el);
    var polSel = T.choiceSelect({ label: 'The change', options: POLICY.map(function(p){ return { value: p.value, label: p.label }; }), value: st.pol, onChange: function(v){ st.pol = v; touch(); update(true); } });
    polSel.el.classList.add('bt-inline');
    groups.ripple.appendChild(polSel.el);
    var amtSl = T.slider({ label: 'Size of the change ($ billion)', min: 5, max: 100, step: 5, value: st.amt, onInput: function(v){ st.amt = v; touch(); update(false); } });
    groups.ripple.appendChild(amtSl.el);
    groups.gap.appendChild(mpcB.el);
    var toolSeg = seg('Tool', [{ value: 'G', label: 'Purchases' }, { value: 'T', label: 'Taxes' }], st.tool, function(v){ st.tool = v; touch(); update(true); });
    groups.gap.appendChild(toolSeg.el);
    /* The policy slider is rebuilt for each gap, tool and MPC: it runs to 2.5
       times the change needed, in steps fine enough to land on it. */
    var chSl = null, chKey = '';
    function changeSlider(){
      var key = [st.tool, st.mpc, st.gkind, st.gsize].join('|');
      if(key === chKey) return;
      chKey = key; st.change = 0;
      var need = Math.abs(ML.gap(st.gkind, st.gsize, st.mpc, st.tool, 0).need), step = need < 10 ? 0.05 : need < 40 ? 0.1 : 0.5;
      var max = Math.ceil(need * 2.5 / 5) * 5;
      var sl = T.slider({ label: st.tool === 'G' ? 'Change in purchases ($ billion)' : 'Change in taxes ($ billion)', min: -max, max: max, step: step, value: 0, onInput: function(v){ st.change = v; touch(); update(false); } });
      if(chSl) groups.gap.replaceChild(sl.el, chSl.el); else groups.gap.appendChild(sl.el);
      chSl = sl;
    }
    var rrSeg = seg('Reserve ratio', ML.RRS.map(function(r){ return { value: r, label: n(r * 100) + '%', aria: 'Required reserve ratio ' + n(r * 100) + ' percent' }; }), st.rr, function(v){ st.rr = +v; touch(); update(true); });
    groups.money.appendChild(rrSeg.el);
    var scnSel = T.choiceSelect({ label: 'What happens', options: Object.keys(ML.SCN).map(function(k){ return { value: k, label: ML.SCN[k] }; }), value: st.scn, onChange: function(v){ st.scn = v; touch(); update(true); } });
    scnSel.el.classList.add('bt-inline');
    groups.money.appendChild(scnSel.el);
    var xSl = T.slider({ label: 'Amount ($ million)', min: 100, max: 2000, step: 100, value: st.X, onInput: function(v){ st.X = v; touch(); update(false); } });
    groups.money.appendChild(xSl.el);
    // The gap's setup: in More options (Details)
    var more = document.createElement('div');
    more.innerHTML = T.moreHtml('<div class="ml-gapset"></div>', 'the gap');
    host.querySelector('.ml-card').appendChild(more.firstChild);
    var gapset = host.querySelector('.ml-gapset');
    var gkSeg = seg('Gap', [{ value: 'recessionary', label: 'Recessionary' }, { value: 'inflationary', label: 'Inflationary' }], st.gkind, function(v){ st.gkind = v; update(true); });
    gapset.appendChild(gkSeg.el);
    var gsSl = T.slider({ label: 'Size of the gap ($ billion)', min: 20, max: 200, step: 10, value: st.gsize, onInput: function(v){ st.gsize = v; update(false); } });
    gapset.appendChild(gsSl.el);

    /* -------------------------------------------------- drawing */
    var lastCap = '', pane = null;
    function update(full){
      Object.keys(figs).forEach(function(k){ figs[k].hidden = k !== st.view; });
      Object.keys(groups).forEach(function(k){ groups[k].hidden = k !== st.view; });
      if(viewSeg) viewSeg.set(st.view);
      var r = st.view === 'ripple' ? drawRipple() : st.view === 'gap' ? drawGap() : drawMoney();
      T.explain(sayEl, r.head, r.body);
      det.innerHTML = r.det;
      if(LS){ var row = LS.root.querySelector('.mac-ls-setup'); if(row) row.hidden = st.view !== 'gap';
        if(r.head !== lastCap){ LS.caption(r.head, 'explore'); lastCap = r.head; } LS.pills(r.pills || [], 'left', 'explore'); if(pane) pane.setup(st.gkind === 'recessionary' ? 'Recessionary, ' + usd(st.gsize) + ' billion' : 'Inflationary, ' + usd(st.gsize) + ' billion'); }
      if(full) say(r.head.replace(/<[^>]+>/g, ''));
    }
    function drawRipple(){
      var p = POLICY.filter(function(x){ return x.value === st.pol; })[0], amt = p.sign * st.amt;
      var R = ML.ripple(p.kind, st.mpc, amt, 8), kName = p.kind === 'G' ? 'spending multiplier' : p.kind === 'T' ? 'tax multiplier' : 'two multipliers together';
      var box = figs.ripple.querySelector('.ml-barbox');
      var cols = R.rounds.map(function(rd, i){
        if(p.kind === 'BB') return { label: String(i + 1), parts: [{ v: rd.g, cls: 'is-g' }, { v: rd.t, cls: 'is-t' }], dot: rd.net, value: rd.net };
        return { label: String(i + 1), parts: [{ v: rd.net, cls: p.kind === 'T' ? 'is-t' : 'is-g' }] };
      });
      var shown = R.rounds.reduce(function(s, rd){ return s + rd.net; }, 0);
      cols.push({ label: '…', parts: [], show: false });
      cols.push({ label: 'Total', strong: true, parts: R.rounds.map(function(rd, i){ return { v: rd.net, cls: 'is-sum', op: Math.max(0.35, 1 - i * 0.08) }; }), outline: R.total, value: R.total });
      bars(box, cols, { fmt: function(v){ return usd(Math.round(v * 10) / 10); }, xName: 'Round of spending', yName: 'Change in spending ($ billion)',
        label: 'Spending rounds: the first round is ' + usd(R.rounds[0].net, 'billion') + ', each later round is ' + n(st.mpc) + ' of the one before, and they add up to ' + usd(R.total, 'billion') + '.' });
      var read = figs.ripple.querySelector('.ml-read');
      read.innerHTML = '<span class="ml-chip">' + (p.kind === 'BB' ? 'ΔG = ΔT = ' + usd(st.amt) + ' billion' : (p.kind === 'G' ? 'ΔG' : 'ΔT') + ' = ' + usd(amt) + ' billion') + '</span><span class="ml-op">×</span><span class="ml-chip">' + (p.kind === 'BB' ? 'net 1' : n(R.mult)) + '</span><span class="ml-op">=</span><span class="ml-chip is-total">ΔY = ' + usd(R.total, 'billion') + '</span>';
      var head = p.kind === 'BB' ? 'Purchases and taxes both up ' + usd(st.amt) + ' billion: real GDP rises by <b>' + usd(R.total, 'billion') + '</b>, the size of the change.'
        : (p.kind === 'G' ? 'Purchases ' : 'Taxes ') + (amt > 0 ? 'up ' : 'down ') + usd(st.amt) + ' billion × ' + kName + ' ' + n(R.mult) + ': real GDP ' + (R.total > 0 ? 'rises' : 'falls') + ' by up to <b>' + usd(Math.abs(R.total), 'billion') + '</b>.';
      var mps = 1 - st.mpc, body = '<p>Each dollar spent is someone\'s income. They spend ' + n(st.mpc * 100) + ' cents of it (the MPC) and save ' + n(mps * 100) + ' cents, so each round is ' + n(st.mpc) + ' of the one before. Eight rounds add to ' + usd(Math.round(shown * 10) / 10, 'billion') + '; the rest of the rounds bring the total to ' + usd(R.total, 'billion') + '.</p>' +
        (p.kind === 'G' ? '<p><b>Spending multiplier</b> = 1 ÷ MPS = 1 ÷ ' + n(mps) + ' = ' + n(R.k) + '. The whole change is spent in the first round.</p>'
          : p.kind === 'T' ? '<p><b>Tax multiplier</b> = −MPC ÷ MPS = ' + n(R.kt) + '. A tax change first changes disposable income, and only the MPC share of it is spent, so the first round is ' + usd(R.rounds[0].net, 'billion') + ', not the whole change: the tax multiplier is one smaller in size than the spending multiplier.</p>'
          : '<p>The purchases add ' + usd(st.amt) + ' × ' + n(R.k) + ' and the tax rise takes away ' + usd(st.amt) + ' × ' + n(-R.kt) + '. The difference is exactly the change: purchases and taxes rising together raise real GDP by that amount.</p>') +
        '<p class="ml-rule">These are the <b>largest</b> changes: the simple model holds the price level constant and has no income taxes or imports.</p>';
      var detH = '<h3 class="ls-title-l">The rounds</h3><table class="ls-tbl"><thead><tr><th scope="col">Round</th>' + (p.kind === 'BB' ? '<th scope="col" class="r">Purchases</th><th scope="col" class="r">Taxes</th>' : '') + '<th scope="col" class="r">Change in spending</th></tr></thead><tbody>' +
        R.rounds.map(function(rd, i){ return '<tr><td>' + (i + 1) + '</td>' + (p.kind === 'BB' ? '<td class="r">' + usd(rd.g) + '</td><td class="r">' + usd(rd.t) + '</td>' : '') + '<td class="r">' + usd(rd.net) + '</td></tr>'; }).join('') +
        '<tr><th scope="row">All rounds</th>' + (p.kind === 'BB' ? '<td></td><td></td>' : '') + '<td class="r"><b>' + usd(R.total) + '</b></td></tr></tbody></table>' +
        '<h3 class="ls-title-l">Formulas</h3><ul class="ml-forms"><li>MPS = 1 − MPC = ' + n(mps) + '</li><li>Spending multiplier = 1 ÷ MPS = ' + n(R.k) + '</li><li>Tax multiplier = −MPC ÷ MPS = ' + n(R.kt) + '</li><li>Change in real GDP = change × multiplier</li></ul>' + data.howItWorks;
      return { head: head, body: body, det: detH, pills: [] };
    }
    var GAP_SPEC = function(){ return { kind: 'adas', start: { AD: st.gkind === 'recessionary' ? -1 : 1 }, do: [] }; };
    function drawGap(){
      changeSlider();
      var g = ML.gap(st.gkind, st.gsize, st.mpc, st.tool, st.change), spec = GAP_SPEC(), rec = st.gkind === 'recessionary';
      var steps = Math.max(-2.6, Math.min(2.6, g.frac * (rec ? 1 : -1))), shifts = steps ? { AD: steps } : {};
      var e = steps ? G.eq(spec, shifts) : null;
      var left = 1 - g.frac, closed = Math.abs(left) < 0.015, need = Math.abs(g.need), mSize = Math.abs(g.mult);
      var state = closed ? 'closed' : g.frac > 1 ? 'over' : g.frac < 0 ? 'wrong' : 'part';
      var lab = 'AD-AS graph: ' + (rec ? 'a recessionary gap, real GDP below full employment at LRAS' : 'an inflationary gap, real GDP above full employment at LRAS') + '. ' +
        (steps ? 'AD has shifted ' + (steps > 0 ? 'right' : 'left') + '; ' + (closed ? 'the new equilibrium is at full employment.' : state === 'over' ? 'it has gone past full employment.' : state === 'wrong' ? 'the gap is wider.' : 'part of the gap is left.') : 'AD has not moved.');
      figs.gap.querySelector('.ml-graph').innerHTML = G.svg(spec, { shifts: shifts, eq: e }, { label: lab });
      var pctClosed = Math.max(-100, Math.min(200, g.frac * 100));
      figs.gap.querySelector('.ml-meter').innerHTML = '<p class="ml-mh">Gap: ' + usd(st.gsize, 'billion') + ' ' + (rec ? 'below' : 'above') + ' full employment</p>' +
        '<div class="ml-track" aria-hidden="true"><span class="ml-fill is-' + state + '" style="width:' + Math.max(0, Math.min(100, pctClosed / 2)) + '%"></span><i class="ml-goal"></i></div>' +
        '<dl class="ml-nums"><div><dt>Your change</dt><dd>' + usd(st.change, 'billion') + '</dd></div><div><dt>× multiplier</dt><dd>' + n(g.mult) + '</dd></div><div><dt>= change in real GDP</dt><dd>' + usd(g.effect, 'billion') + '</dd></div><div><dt>Gap left</dt><dd>' + usd(Math.round((g.gapNeeded - g.effect) * 100) / 100, 'billion') + '</dd></div></dl>';
      var dirWord = st.tool === 'G' ? (rec ? 'raise purchases' : 'cut purchases') : (rec ? 'cut taxes' : 'raise taxes');
      var head = st.change === 0 ? 'A ' + st.gkind + ' gap of ' + usd(st.gsize, 'billion') + '. Direction first: ' + dirWord + '. Then move the slider.'
        : closed ? '<b>Gap closed.</b> ' + usd(need) + ' billion × ' + n(mSize) + ' = ' + usd(st.gsize) + ' billion: the gap divided by the multiplier.'
        : state === 'wrong' ? '<b>Wrong way.</b> That moves AD ' + (rec ? 'left' : 'right') + ' and widens the gap: ' + dirWord + ' instead.'
        : state === 'over' ? '<b>Too far.</b> AD overshoots full employment by ' + usd(Math.round((g.effect - g.gapNeeded) * (rec ? 1 : -1) * 100) / 100, 'billion') + '. Try the gap ÷ the multiplier.'
        : 'AD moves ' + n(Math.round(g.frac * 100)) + '% of the way. ' + usd(Math.round(Math.abs(g.gapNeeded - g.effect) * 100) / 100, 'billion') + ' of the gap is left.';
      var mult = usd(st.gsize * mSize, 'billion');
      var body = '<ol class="ls-steps"><li><b>Find the gap:</b> ' + usd(st.gsize, 'billion') + (rec ? ' (recessionary: real GDP is below full employment).' : ' (inflationary: real GDP is above full employment).') + '</li>' +
        '<li><b>Direction first:</b> ' + (rec ? 'more' : 'less') + ' aggregate demand, so ' + dirWord + '.</li>' +
        '<li><b>The multiplier:</b> ' + (st.tool === 'G' ? 'spending, 1 ÷ MPS = ' + n(mSize) : 'tax, MPC ÷ MPS = ' + n(mSize) + ' in size') + '.</li>' +
        '<li><b>Divide the gap:</b> ' + usd(st.gsize) + ' ÷ ' + n(mSize) + ' = <b>' + usd(need, 'billion') + '</b>.</li></ol>' +
        '<p class="mac-slip ml-rule"><b>The slip readers see most:</b> multiplying the gap (' + usd(st.gsize) + ' × ' + n(mSize) + ' = ' + mult + ') instead of dividing it. Set the slider past the needed change and AD shoots past full employment.</p>' +
        (st.tool === 'T' ? '<p>Taxes must change by more than purchases would, because the tax multiplier is smaller: only the MPC share of a tax change is spent.</p>' : '') +
        '<p>The multiplier gives the largest effect, as on the exam; with the price level rising along SRAS, real GDP grows a little less.</p>';
      var detH = '<h3 class="ls-title-l">This gap</h3><table class="ls-tbl"><tbody><tr><th scope="row">Gap</th><td class="r">' + usd(st.gsize) + ' billion, ' + st.gkind + '</td></tr><tr><th scope="row">MPC, MPS</th><td class="r">' + n(st.mpc) + ', ' + n(1 - st.mpc) + '</td></tr><tr><th scope="row">' + (st.tool === 'G' ? 'Spending' : 'Tax') + ' multiplier</th><td class="r">' + n(g.mult) + '</td></tr><tr><th scope="row">Change needed</th><td class="r"><b>' + (rec === (st.tool === 'G') ? '+' : '−') + usd(need) + ' billion</b></td></tr></tbody></table>' + data.howItWorks;
      return { head: head, body: body, det: detH, pills: [{ html: closed ? 'Closed' : state === 'wrong' ? 'Wrong way' : state === 'over' ? 'Too far' : n(Math.max(0, Math.round(g.frac * 100))) + '% closed', tone: closed ? 'good' : state === 'part' ? 'readout' : 'warn' }] };
    }
    function drawMoney(){
      var m = ML.money(st.scn, st.rr, st.X, 8), sell = st.scn === 'sellBank';
      var box = figs.money.querySelector('.ml-barbox');
      var cols = m.rounds.map(function(v, i){ return { label: 'Bank ' + (i + 1), parts: [{ v: v, cls: 'is-g' }] }; });
      if(m.now) cols.unshift({ label: 'Deposit', parts: [{ v: m.now, cls: 'is-now' }] });
      cols.push({ label: 'Total', strong: true, parts: (m.now ? [{ v: m.now, cls: 'is-now' }] : []).concat(m.rounds.map(function(v, i){ return { v: v, cls: 'is-sum', op: Math.max(0.35, 1 - i * 0.08) }; })), outline: m.dm, value: m.dm });
      cols.forEach(function(c){ c.short = c.label.replace('Bank ', '').replace('Deposit', 'D'); });
      bars(box, cols, { fmt: function(v){ return usd(Math.round(v)); }, xName: 'Each bank lends its excess reserves; the loan is redeposited', yName: 'New money ($ million)',
        label: 'Money creation: ' + (m.now ? 'a new deposit of ' + usd(m.now, 'million') + ', then ' : '') + 'loans of ' + usd(m.rounds[0], 'million') + ', ' + usd(m.rounds[1], 'million') + ' and so on, up to ' + usd(m.dm, 'million') + ' in all.' });
      figs.money.querySelector('.ml-read').innerHTML = '<span class="ml-chip">Excess reserves ' + usd(m.ex, 'million') + '</span><span class="ml-op">×</span><span class="ml-chip">1 ÷ ' + n(st.rr) + ' = ' + n(m.mm) + '</span>' + (m.now ? '<span class="ml-op">+</span><span class="ml-chip">deposit ' + usd(m.now) + '</span>' : '') + '<span class="ml-op">=</span><span class="ml-chip is-total">ΔM up to ' + usd(m.dm, 'million') + '</span>';
      // Bank 1's balance sheet: the change this event makes.
      var dep = m.deposit, res = sell ? -st.X : st.scn === 'buyBank' ? st.X : st.X, bonds = st.scn === 'buyBank' ? -st.X : sell ? st.X : 0;
      figs.money.querySelector('.ml-tacct').innerHTML = '<table class="ml-t"><caption>Bank 1: what changes</caption><thead><tr><th scope="col">Assets</th><th scope="col">Liabilities</th></tr></thead><tbody><tr><td>' +
        '<span>Required reserves</span><b>' + usd(m.req) + '</b><span>Excess reserves</span><b class="is-ex">' + usd(m.ex) + '</b>' + (bonds ? '<span>Bonds</span><b>' + usd(bonds) + '</b>' : '') + '</td><td><span>Checking deposits</span><b>' + usd(dep) + '</b></td></tr></tbody></table>';
      void res;
      var mspec = { kind: 'money', do: [] }, msh = m.dm ? { MS: m.dm > 0 ? 1 : -1 } : {};
      figs.money.querySelector('.ml-mm').innerHTML = G.svg(mspec, { shifts: msh, eq: m.dm ? G.eq(mspec, msh) : null }, { label: 'Money market (limited reserves): money supply ' + (m.dm > 0 ? 'shifts right and the nominal interest rate falls' : 'shifts left and the nominal interest rate rises') + '.' });
      var head = { cash: 'A cash deposit: no new money at first, but loans can add up to <b>' + usd(m.dm, 'million') + '</b>.',
        buyBank: 'The Fed buys bonds from a bank: all ' + usd(st.X, 'million') + ' is excess, so the money supply can grow by <b>' + usd(m.dm, 'million') + '</b>.',
        buyPublic: 'The Fed buys bonds from the public: ' + usd(st.X, 'million') + ' of new deposits plus loans, up to <b>' + usd(m.dm, 'million') + '</b>.',
        sellBank: 'The Fed sells bonds to a bank: reserves fall ' + usd(st.X, 'million') + ', and the money supply can shrink by <b>' + usd(-m.dm, 'million') + '</b>.' }[st.scn];
      var body = '<p>The bank must keep ' + n(st.rr * 100) + '% of its deposits as required reserves and can lend the rest, its <b>excess reserves</b>. Each loan is spent and redeposited at the next bank, which keeps ' + n(st.rr * 100) + '% and lends the rest, so each round is ' + n(100 - st.rr * 100) + '% of the one before.</p>' +
        '<p><b>Money multiplier</b> = 1 ÷ ' + n(st.rr) + ' = ' + n(m.mm) + '. Largest change = excess reserves × ' + n(m.mm) + (m.now ? ', plus the ' + usd(m.now) + ' million of new deposits themselves' : '') + '.</p>' +
        (st.scn === 'cash' ? '<p class="mac-slip ml-rule"><b>Watch out:</b> the cash deposit itself is not new money: cash in a wallet and cash in a checking account are both money. Only the loans add to the money supply.</p>' : '') +
        '<p class="ml-rule">This is the <b>limited-reserves</b> model. The Fed now runs an <b>ample-reserves</b> framework: it sets its policy rate with administered rates (interest on reserves), and the money multiplier does not describe what banks do. The exam asks about both.</p>';
      var detH = '<h3 class="ls-title-l">This change</h3><table class="ls-tbl"><tbody><tr><th scope="row">Required reserves</th><td class="r">' + usd(m.req) + ' million</td></tr><tr><th scope="row">Excess reserves</th><td class="r">' + usd(m.ex) + ' million</td></tr><tr><th scope="row">Money multiplier</th><td class="r">' + n(m.mm) + '</td></tr><tr><th scope="row">New money right away</th><td class="r">' + usd(m.now) + ' million</td></tr><tr><th scope="row">Largest change in the money supply</th><td class="r"><b>' + usd(m.dm) + ' million</b></td></tr></tbody></table>' + data.howItWorks;
      return { head: head, body: body, det: detH, pills: [] };
    }
    var stageEl = host.querySelector('.ml-stage');
    if(window.ResizeObserver){ var lastK = ''; new ResizeObserver(function(){ var k = stageEl.clientWidth + 'x' + stageEl.clientHeight; if(k !== lastK){ lastK = k; update(false); } }).observe(stageEl); }
    function studio(p, s){
      LS = s;
      pane = T.studioPane(p, s, { stage: [stageEl], dock: [ctl], setup: live.gap ? 'Gap' : null, moreLabel: 'The gap', why: [sayEl], details: [det] });
      lastCap = ''; update(true);
      var first = mpcA.el.querySelector('button[aria-pressed="true"]');
      if(s.mode() === 'explore' && first && st.view === 'ripple') T.hintSlot(s, first, 'Tap an MPC to see every round change', { before: polSel.el });
    }
    update(true);
    return { studio: studio };
  }

  /* ============================================================ test yourself */
  /* Every problem has a picture on the stage: the AD-AS graph of the gap
     (AD shifts once the policy is found), the spending rounds of the change
     (the total shows once it is found), or the first bank's balance sheet and
     its loan rounds. */
  function quiz(host, data){
    var fig = null, prob = null;
    var kinds = [];
    (data.contexts || []).forEach(function(c){ (c.types || []).forEach(function(t){ if(kinds.indexOf(t) < 0) kinds.push(t); }); });
    T.drill(host, data, { slug: 'multiplier-lab', noun: 'drill',
      types: kinds.map(function(k){ return { value: k, label: ML.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: ML.generate, title: function(p){ return p.title; },
      extra: function(el, p){
        prob = p;
        fig = document.createElement('div'); fig.className = 'ml-qfig ml-qfig-' + p.type;
        el.appendChild(fig);
        fig.done = {};
        fig.paint = function(){ paintFig(fig, p); };
        requestAnimationFrame(fig.paint);
        if(window.ResizeObserver){ var k0 = ''; new ResizeObserver(function(){ var k = fig.clientWidth + 'x' + fig.clientHeight; if(k !== k0 && fig.isConnected){ k0 = k; fig.paint(); } }).observe(fig); }
      },
      onStep: function(s){ if(fig && prob){ fig.done[s.key] = 1; fig.paint(); } }
    });
  }
  function paintFig(fig, p){
    var v = p.values, done = fig.done;
    if(p.type === 'gap'){
      var rec = v.kind === 'recessionary', closed = !!done.size;
      var spec = { kind: 'adas', start: { AD: rec ? -1 : 1 }, do: [] }, sh = closed ? { AD: rec ? 1 : -1 } : {};
      fig.innerHTML = '<div class="ml-qgraph">' + G.svg(spec, { shifts: sh, eq: closed ? G.eq(spec, sh) : null }, { label: 'AD-AS graph: real GDP of ' + usd(v.y, 'billion') + ' is ' + (rec ? 'below' : 'above') + ' full employment (' + usd(v.yf, 'billion') + ', at LRAS).' + (closed ? ' AD has shifted to close the gap.' : '') }) + '</div>' +
        '<p class="ml-qcap">Real GDP ' + usd(v.y, 'billion') + ' · full employment ' + usd(v.yf, 'billion') + (closed ? ' · AD shifted ' + (rec ? 'right' : 'left') + ' by ' + (v.tool === 'G' ? 'purchases' : 'taxes') + ' of ' + usd(Math.abs(v.need), 'billion') : '') + '</p>';
      return;
    }
    if(p.type === 'money'){
      var m = ML.money(v.scn, v.rr, v.X, 8), showEx = !!done.ex, showDm = !!done.dm;
      var bonds = v.scn === 'buyBank' ? -v.X : v.scn === 'sellBank' ? v.X : 0;
      fig.innerHTML = '<table class="ml-t"><caption>Bank 1: what changes</caption><thead><tr><th scope="col">Assets</th><th scope="col">Liabilities</th></tr></thead><tbody><tr><td>' +
        '<span>Required reserves</span><b>' + (showEx ? usd(m.req) : '?') + '</b><span>Excess reserves</span><b class="is-ex">' + (showEx ? usd(m.ex) : '?') + '</b>' + (bonds ? '<span>Bonds</span><b>' + usd(bonds) + '</b>' : '') + '</td><td><span>Checking deposits</span><b>' + usd(m.deposit) + '</b></td></tr></tbody></table>' +
        '<div class="ml-qbars"></div>';
      var cols = m.rounds.map(function(x, i){ return { label: 'Bank ' + (i + 1), short: String(i + 1), parts: showEx ? [{ v: x, cls: 'is-g' }] : [], show: showEx }; });
      if(m.now) cols.unshift({ label: 'Deposit', short: 'D', parts: [{ v: m.now, cls: 'is-now' }] });
      cols.push(showDm ? { label: 'Total', strong: true, parts: (m.now ? [{ v: m.now, cls: 'is-now' }] : []).concat(m.rounds.map(function(x, i){ return { v: x, cls: 'is-sum', op: Math.max(0.35, 1 - i * 0.08) }; })), outline: m.dm, value: m.dm } : { label: 'Total', strong: true, parts: [], q: true });
      bars(fig.querySelector('.ml-qbars'), cols, { fmt: function(x){ return usd(Math.round(x)); }, xName: 'Loans, bank by bank', yName: 'New money ($ million)',
        label: showDm ? 'Loan rounds adding up to ' + usd(m.dm, 'million') + '.' : 'Loan rounds, to be found.', scale: showEx ? null : Math.abs(v.X / v.rr) });
      return;
    }
    // multiplier and total: the spending rounds
    var kind = p.type === 'total' ? (v.tool === 'T' ? 'T' : 'G') : 'G', amt = p.type === 'total' ? v.change : 1;
    var R = ML.ripple(kind, v.mpc, amt, 8), shown = p.type === 'total' ? !!done.dy : !!done.k;
    var cols2 = R.rounds.map(function(rd, i){ return { label: String(i + 1), parts: [{ v: rd.net, cls: kind === 'T' ? 'is-t' : 'is-g' }] }; });
    cols2.push({ label: '…', parts: [], show: false });
    cols2.push(shown ? { label: 'Total', strong: true, parts: R.rounds.map(function(rd, i){ return { v: rd.net, cls: 'is-sum', op: Math.max(0.35, 1 - i * 0.08) }; }), outline: R.total, value: R.total } : { label: 'Total', strong: true, parts: [], q: true });
    fig.innerHTML = '<p class="ml-qcap">' + (p.type === 'total' ? 'The rounds of spending from this change' : 'One extra dollar of spending, round by round') + '</p><div class="ml-qbars"></div>';
    bars(fig.querySelector('.ml-qbars'), cols2, { fmt: function(x){ return p.type === 'total' ? usd(Math.round(x * 10) / 10) : '$' + n(x); }, xName: 'Round of spending', yName: p.type === 'total' ? 'Change in spending ($ billion)' : 'Dollars',
      label: 'Spending rounds: each is ' + n(v.mpc) + ' of the one before' + (shown ? ', adding up to ' + (p.type === 'total' ? usd(R.total, 'billion') : '$' + n(R.total)) + '.' : '; the total is to be found.'), scale: shown ? null : Math.abs(R.total) });
  }
})();
