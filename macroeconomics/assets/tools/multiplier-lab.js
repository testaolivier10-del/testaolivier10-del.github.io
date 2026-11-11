/* Multiplier lab page (skills tool, Premium; docs/apmacro-spec.md section 6).
   OWNED BY THIS TOOL ONLY (builder T3, docs/apmacro-briefs/t3.md). Model:
   ApMacroMath.multiplierLab (macroeconomics/assets/tools/math/multiplier-lab.js);
   frame: ApMacroTools.modes and drill on the Tool Studio.

   Explore, three views (each shown once its topic is published):
     Multiplier   a change in purchases or taxes as money passing hand to
                  hand (cascade()): each round of income splits into the
                  spent part, which falls to become the next round, and the
                  saved part, which leaks into the Saved tank; the tank ends
                  at the injection. A tax change starts with a row of
                  disposable income that is not spending yet. The MPC chips
                  change every split at once.
     Close a gap  an AD-AS graph (ApMacroGraph, AD shifted by the effect of
                  the student's policy as a share of the gap) and a gap meter:
                  the gap closes exactly at gap / multiplier; multiplying the
                  gap overshoots.
     Money        limited reserves: banks in a row (banksSvg()), each
                  deposit split into the reserve kept and the loan, the loan
                  landing as the next bank's deposit, the running total of
                  new money; the first bank's balance sheet and the money
                  market graph (ApMacroGraph) with MS moving the way the
                  money supply changes.
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


  /* The multiplier as money passing hand to hand. Each row is one round of
     income; the spent part (MPC) drops straight down to become the next
     row's income, the saved part (MPS) leaks right into the Saved tank. The
     tank ends equal to the injection: spending stops when saving has
     absorbed it. o: { x, y, w, h, inj (the injection, > 0), mpc, tax (the
     first row is a tax change, not spending), title, sign (+1 / -1), rows,
     unit, id }. Returns svg markup (a <g>). */
  function cascade(o){
    var mpc = o.mpc, mps = 1 - mpc, inj = o.inj, sgn = o.sign < 0 ? '−' : '';
    var tankW = Math.max(54, Math.min(84, o.w * 0.16)), gapW = 22, labW = Math.max(54, Math.min(70, o.w * 0.12));
    var xa = o.x + labW, W = o.w - labW - gapW - tankW, xt = o.x + o.w - tankW;
    var head = 34, foot = 6, rowsN = o.rows, avail = o.h - head - foot, rh = Math.max(16, Math.min(40, avail / (rowsN + 0.9) * 0.62)), gap = (avail - rh * rowsN) / Math.max(1, rowsN);
    gap = Math.max(8, Math.min(gap, 22));
    var dq = Math.pow(10, o.dp == null ? 1 : o.dp), g = [], fm = function(v){ return sgn + '$' + n(Math.round(v * dq) / dq); };
    g.push('<text class="ml-ch" x="' + o.x + '" y="' + (o.y + 13) + '">' + esc(o.w < 560 && o.short ? o.short : o.title) + '</text>');
    g.push('<text class="ml-cs" x="' + f1(xa) + '" y="' + (o.y + 28) + '"><tspan class="ml-k-sp">■</tspan> ' + (o.sign < 0 ? 'spending lost, passed on' : 'spent, passed on') + '  <tspan class="ml-k-sv">■</tspan> ' + (o.sign < 0 ? 'saving lost' : 'saved, leaks out') + (o.tax && o.w >= 520 ? '  <tspan class="ml-k-tx">dashed: disposable income, not spending yet</tspan>' : '') + '</text>');
    var savedSoFar = 0, inc = inj, y = o.y + head, rowsSvg = [], tankSegs = [];
    for(var i = 0; i < rowsN; i++){
      var sp = inc * mpc, sv = inc * mps, wInc = W * inc / inj, wSp = W * sp / inj, wSv = wInc - wSp;
      var cls = 'ml-row' + (o.tax && i === 0 ? ' is-taxrow' : '');
      var r = ['<g class="' + cls + '" style="animation-delay:' + (i * 110) + 'ms">'];
      // the spent part falls to the next row: a band of the same width
      if(i < rowsN - 1) r.push('<rect class="ml-pass" x="' + f1(xa) + '" y="' + f1(y + rh) + '" width="' + f1(Math.max(0.5, wSp)) + '" height="' + f1(gap) + '"/>');
      r.push('<rect class="ml-sp" x="' + f1(xa) + '" y="' + f1(y) + '" width="' + f1(Math.max(0.5, wSp)) + '" height="' + f1(rh) + '" rx="3"/>');
      r.push('<rect class="ml-sv" x="' + f1(xa + wSp) + '" y="' + f1(y) + '" width="' + f1(Math.max(0.5, wSv)) + '" height="' + f1(rh) + '" rx="3"/>');
      // the leak: from the saved part to the tank
      r.push('<path class="ml-leak" d="M' + f1(xa + wInc + 3) + ' ' + f1(y + rh / 2) + 'H' + f1(xt - 6) + '" marker-end="url(#' + o.id + '-ah)"/>');
      // Pass 2: "Round" written on the first two rows, then the number alone (an axis, not a label each).
      var rn = o.tax ? i : i + 1, lab = o.tax && i === 0 ? 'Tax ' + (o.sign < 0 ? 'rise' : 'cut') : rn <= 2 ? 'Round ' + rn : String(rn);
      r.push('<text class="ml-rl' + (o.tax && i === 0 ? ' is-tax' : '') + '" x="' + f1(xa - 6) + '" y="' + f1(y + rh / 2 + 4) + '" text-anchor="end">' + lab + '</text>');
      // amounts (pass 2): the first round's split only; the bars show the rest shrinking, the table has every number
      if(wSp > 46 && i === (o.tax ? 1 : 0)) r.push('<text class="ml-in" x="' + f1(xa + 6) + '" y="' + f1(y + rh / 2 + 4) + '">' + fm(sp) + '</text>');
      if(wSv > 40 && i === (o.tax ? 1 : 0)) r.push('<text class="ml-in is-sv" x="' + f1(xa + wSp + 5) + '" y="' + f1(y + rh / 2 + 4) + '">' + fm(sv) + '</text>');
      r.push('</g>');
      rowsSvg.push(r.join(''));
      tankSegs.push(sv); savedSoFar += sv;
      inc = sp; y += rh + gap;
    }
    // the tank: every round's saving stacked, the rest of the rounds faded, the line at the injection
    var tTop = o.y + head, tBot = y - gap, tH = tBot - tTop, ty = tBot;
    g.push('<rect class="ml-tank" x="' + f1(xt) + '" y="' + f1(tTop) + '" width="' + f1(tankW) + '" height="' + f1(tH) + '" rx="6"/>');
    tankSegs.forEach(function(v, i){ var hh = tH * v / inj; ty -= hh; g.push('<rect class="ml-tseg' + (i % 2 ? ' is-alt' : '') + '" x="' + f1(xt + 3) + '" y="' + f1(ty) + '" width="' + f1(tankW - 6) + '" height="' + f1(Math.max(0.5, hh)) + '"/>'); });
    var rest = inj - savedSoFar;
    if(rest > 1e-9){ var rhh = tH * rest / inj; g.push('<rect class="ml-tseg is-rest" x="' + f1(xt + 3) + '" y="' + f1(ty - rhh) + '" width="' + f1(tankW - 6) + '" height="' + f1(rhh) + '"/>'); }
    g.push('<text class="ml-th" x="' + f1(xt + tankW / 2) + '" y="' + (o.y + 13) + '" text-anchor="middle">' + (o.sign < 0 ? 'Less saved' : 'Saved') + '</text>');
    g.push('<text class="ml-tv" x="' + f1(xt + tankW / 2) + '" y="' + f1(tTop + 16) + '" text-anchor="middle">' + fm(inj) + '</text>');
    g.push('<text class="ml-tn" x="' + f1(xt + tankW / 2) + '" y="' + f1(tTop + 29) + '" text-anchor="middle">in the end</text>');
    var defs = '<defs><marker id="' + o.id + '-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" class="ml-ahead"/></marker></defs>';
    return defs + g.join('') + rowsSvg.join('') + '<text class="ml-more" x="' + f1(xa) + '" y="' + f1(Math.min(o.y + o.h - 2, y + 4)) + '">… and on, each round ' + n(mpc) + ' of the last</text>';
  }

  /* Money creation as banks in a row: each bank's deposit is a vault split
     into the reserve it must keep (the required ratio) and the excess it
     lends; the loan is spent and lands as the next bank's deposit. Under
     the banks, the running total of new money against the most it can
     reach. A sale of bonds runs the same loop backward (less lending). */
  function bankIcon(x, y, w, cls){
    var h = w * 0.62, r = [];
    r.push('<path class="ml-bk-roof ' + cls + '" d="M' + f1(x) + ' ' + f1(y + h * 0.34) + 'L' + f1(x + w / 2) + ' ' + f1(y) + 'L' + f1(x + w) + ' ' + f1(y + h * 0.34) + 'Z"/>');
    for(var k = 0; k < 4; k++){ var cx = x + w * (0.16 + k * 0.226); r.push('<rect class="ml-bk-col ' + cls + '" x="' + f1(cx) + '" y="' + f1(y + h * 0.4) + '" width="' + f1(w * 0.09) + '" height="' + f1(h * 0.44) + '"/>'); }
    r.push('<rect class="ml-bk-base ' + cls + '" x="' + f1(x) + '" y="' + f1(y + h * 0.86) + '" width="' + f1(w) + '" height="' + f1(h * 0.14) + '"/>');
    return r.join('');
  }
  function banksSvg(box, m, scn, rr, X, hide){
    hide = hide || {};   // drills: { ex: true } hides the amounts kept and lent, { dm: true } the total, until they are found
    var w = Math.max(300, box.clientWidth || 600), h = Math.max(190, Math.min(420, box.clientHeight || 260));
    var nb = w >= 720 ? 5 : w >= 480 ? 4 : 3, neg = m.ex < 0, sg = neg ? '−' : '';
    var slot = (w - 60) / nb, bw = Math.min(64, slot * 0.42), top = 4, iconH = bw * 0.62, labY = top + iconH + 14;
    var vTop = labY + 22, vBot = h - 74, narrow = w < 480, vH = Math.max(40, vBot - vTop), big = Math.abs(scn === 'buyBank' || scn === 'sellBank' ? X : m.deposit) || 1;
    var g = [], fm = function(v){ return sg + '$' + n(Math.round(Math.abs(v))); };
    for(var k = 0; k < nb; k++){
      var cx = 8 + slot * k + slot / 2, x = cx - bw / 2;
      // bank 1's money: a deposit (cash, the public's bond sale) or new reserves from the Fed (or reserves lost to it)
      var dep = k === 0 ? (scn === 'buyBank' || scn === 'sellBank' ? 0 : m.deposit) : m.rounds[k - 1], lend = m.rounds[k], keep = k === 0 ? (scn === 'buyBank' || scn === 'sellBank' ? 0 : m.req) : Math.abs(dep) - Math.abs(lend);
      var inflow = k === 0 && (scn === 'buyBank' || scn === 'sellBank') ? X : Math.abs(dep);
      var hh = vH * inflow / big, hk = vH * Math.abs(keep) / big, hl = vH * Math.abs(lend) / big, y0 = vBot - hh;
      g.push('<g class="ml-bank" style="animation-delay:' + (k * 140) + 'ms">');
      g.push(bankIcon(x, top, bw, neg ? 'is-neg' : ''));
      g.push('<text class="ml-bk-name" x="' + f1(cx) + '" y="' + f1(labY) + '" text-anchor="middle">Bank ' + (k + 1) + '</text>');
      // the vault: kept at the bottom, lent on top
      g.push('<rect class="ml-vault" x="' + f1(x) + '" y="' + f1(y0) + '" width="' + f1(bw) + '" height="' + f1(Math.max(1, hh)) + '" rx="4"/>');
      if(hk > 0.5) g.push('<rect class="ml-keep" x="' + f1(x) + '" y="' + f1(vBot - hk) + '" width="' + f1(bw) + '" height="' + f1(hk) + '" rx="3"/>');
      g.push('<rect class="ml-lend' + (neg ? ' is-neg' : '') + '" x="' + f1(x) + '" y="' + f1(y0) + '" width="' + f1(bw) + '" height="' + f1(Math.max(1, hl)) + '" rx="3"/>');
      var top1 = k === 0 && scn === 'buyBank' ? '+' + fm(X) + ' reserves' : k === 0 && scn === 'sellBank' ? '−$' + n(X) + ' reserves' : (k === 0 && scn === 'cash' ? 'cash ' : '') + 'deposit ' + fm(dep);
      if(k < 2 && !(hide.ex && k > 0)) g.push('<text class="ml-bk-v" x="' + f1(cx) + '" y="' + f1(y0 - 5) + '" text-anchor="middle">' + top1 + '</text>');
      // pass 2: the split written on the first bank that keeps and lends; the next banks repeat it smaller
      if(k < 2 && hk > 13 && !narrow && !hide.ex) g.push('<text class="ml-bk-in" x="' + f1(cx) + '" y="' + f1(vBot - hk / 2 + 4) + '" text-anchor="middle">' + (bw >= 70 && !neg ? 'keeps ' : '') + fm(keep) + '</text>');
      if(k < 2 && hl > 13 && !narrow && !hide.ex) g.push('<text class="ml-bk-in is-l' + (neg ? ' is-neg' : '') + '" x="' + f1(cx) + '" y="' + f1(y0 + Math.min(hl / 2, 18) + 4) + '" text-anchor="middle">' + (bw >= 70 && !neg ? 'lends ' : '') + fm(lend) + '</text>');
      // the loan travels to the next bank as its deposit
      if(k < nb - 1){
        var nx = cx + slot - bw / 2, ly = y0 + Math.min(hl / 2, 18), ny = vBot - vH * Math.abs(m.rounds[k]) / big;
        g.push('<path class="ml-loan' + (neg ? ' is-neg' : '') + '" d="M' + f1(x + bw + 2) + ' ' + f1(ly) + 'C' + f1(x + bw + slot * 0.32) + ' ' + f1(ly) + ' ' + f1(nx - slot * 0.3) + ' ' + f1(ny + 12) + ' ' + f1(nx - 3) + ' ' + f1(ny + 12) + '" marker-end="url(#ml-bah)"/>');
      }
      g.push('</g>');
    }
    // more banks, then the running total of new money
    g.push('<text class="ml-bk-more" x="' + f1(w - 10) + '" y="' + f1(vBot - 8) + '" text-anchor="end">… more banks</text>');
    g.push('<text class="ml-bk-key" x="8" y="' + f1(vBot + 16) + '"><tspan class="ml-k-keep">■</tspan> ' + (narrow ? 'kept (' + n(rr * 100) + '%)' : 'kept as required reserves (' + n(rr * 100) + '%)') + '   <tspan class="ml-k-lend">■</tspan> ' + (neg ? 'lending cut' : narrow ? 'lent, then redeposited' : 'lent, spent, and deposited at the next bank') + '   ($ million)</text>');
    var tY = h - 30, tX = 8, tW = w - 16, shown = m.now + m.rounds.slice(0, nb).reduce(function(a, v){ return a + v; }, 0), sc = Math.abs(m.dm) || 1;
    if(hide.dm) g.push('<text class="ml-tot-h" x="' + tX + '" y="' + f1(tY - 6) + '">New money: up to ?</text>');
    else g.push('<text class="ml-tot-h" x="' + tX + '" y="' + f1(tY - 6) + '">' + (narrow ? 'New money so far: ' : 'New money from these ' + nb + ' banks: ') + sg + '$' + n(Math.round(Math.abs(shown))) + ' of up to ' + sg + '$' + n(Math.abs(m.dm)) + (scn === 'cash' && !narrow ? ' (the cash deposit itself is not new money)' : '') + '</text>');
    g.push('<rect class="ml-tot-o" x="' + tX + '" y="' + f1(tY) + '" width="' + f1(tW) + '" height="14" rx="7"/>');
    var off = 0;
    if(m.now){ var wn = tW * Math.abs(m.now) / sc; g.push('<rect class="ml-tot-now" x="' + f1(tX) + '" y="' + f1(tY) + '" width="' + f1(wn) + '" height="14" rx="7"/>'); off = wn; }
    m.rounds.slice(0, nb).forEach(function(v, i){ var ww = tW * Math.abs(v) / sc; g.push('<rect class="ml-tot-l' + (i % 2 ? ' is-alt' : '') + (neg ? ' is-neg' : '') + '" x="' + f1(tX + off) + '" y="' + f1(tY) + '" width="' + f1(ww) + '" height="14"/>'); off += ww; });
    var defs = '<defs><marker id="ml-bah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="ml-bahead"/></marker></defs>';
    var aria = 'Money creation, bank by bank: ' + (scn === 'buyBank' ? 'the Fed buys bonds from Bank 1, adding ' + usd(X, 'million') + ' of reserves, all excess; ' : scn === 'sellBank' ? 'the Fed sells bonds to Bank 1, which loses ' + usd(X, 'million') + ' of reserves and must cut lending; ' : 'Bank 1 gets a deposit of ' + usd(m.deposit, 'million') + ', keeps ' + usd(m.req, 'million') + ' and lends ' + usd(m.ex, 'million') + '; ') +
      'each loan is spent and deposited at the next bank, which keeps ' + n(rr * 100) + '% and lends the rest. The money supply can change by up to ' + usd(m.dm, 'million') + '.';
    return '<svg class="ml-banks" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(aria) + '">' + defs + g.join('') + '</svg>';
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
      var shown = R.rounds.reduce(function(s, rd){ return s + rd.net; }, 0);
      var box = figs.ripple.querySelector('.ml-barbox');
      var bw = Math.max(300, box.clientWidth || 600), bh = Math.max(240, Math.min(560, box.clientHeight || 360)), nr = bh < 330 ? 5 : bh < 430 ? 6 : bh < 520 ? 7 : 8;
      var cs = [];
      if(p.kind === 'BB'){
        var half = bw < 620;
        if(half){
          cs.push(cascade({ id: 'mlc1', x: 4, y: 2, w: bw - 8, h: bh / 2 - 6, inj: st.amt, mpc: st.mpc, tax: false, sign: 1, rows: Math.max(3, nr - 3), title: 'Purchases rise ' + usd(st.amt) + 'B: real GDP up ' + usd(st.amt * R.k) + 'B' }));
          cs.push('<g transform="translate(0,' + f1(bh / 2 + 4) + ')">' + cascade({ id: 'mlc2', x: 4, y: 2, w: bw - 8, h: bh / 2 - 6, inj: st.amt, mpc: st.mpc, tax: true, sign: -1, rows: Math.max(3, nr - 3), title: 'Taxes rise ' + usd(st.amt) + 'B: real GDP down ' + usd(-st.amt * R.kt) + 'B' }) + '</g>');
        } else {
          cs.push(cascade({ id: 'mlc1', x: 4, y: 2, w: bw / 2 - 14, h: bh - 4, inj: st.amt, mpc: st.mpc, tax: false, sign: 1, rows: nr, title: 'Purchases rise ' + usd(st.amt) + 'B: real GDP up ' + usd(st.amt * R.k) + 'B' }));
          cs.push(cascade({ id: 'mlc2', x: bw / 2 + 10, y: 2, w: bw / 2 - 14, h: bh - 4, inj: st.amt, mpc: st.mpc, tax: true, sign: -1, rows: nr, title: 'Taxes rise ' + usd(st.amt) + 'B: real GDP down ' + usd(-st.amt * R.kt) + 'B' }));
        }
      } else {
        cs.push(cascade({ id: 'mlc1', x: 4, y: 2, w: bw - 8, h: bh - 4, inj: st.amt, mpc: st.mpc, tax: p.kind === 'T', sign: p.kind === 'T' ? -amt / st.amt : amt / st.amt, rows: nr + (p.kind === 'T' ? 1 : 0),
          title: p.kind === 'G' ? (amt > 0 ? 'Purchases rise ' : 'Purchases fall ') + usd(st.amt) + ' billion: each round is income to someone' : (amt < 0 ? 'A tax cut of ' : 'A tax rise of ') + usd(st.amt) + ' billion: households first ' + (amt < 0 ? 'save part of it' : 'pay part of it from saving'),
          short: p.kind === 'G' ? (amt > 0 ? 'Purchases rise ' : 'Purchases fall ') + usd(st.amt) + ' billion' : (amt < 0 ? 'Tax cut of ' : 'Tax rise of ') + usd(st.amt) + ' billion' }));
      }
      box.innerHTML = '<svg class="ml-casc" viewBox="0 0 ' + bw + ' ' + bh + '" width="' + bw + '" height="' + bh + '" role="img" aria-label="' + esc('Spending rounds: ' + (p.kind === 'T' ? 'the tax change first changes disposable income, of which ' + n(st.mpc) + ' is spent; ' : 'the first round is ' + usd(Math.abs(R.rounds[0].net), 'billion') + ' of income; ') + 'each round, ' + n(st.mpc) + ' is spent and becomes the next round’s income and ' + n(1 - st.mpc) + ' is saved. The saving adds up to the original ' + usd(st.amt, 'billion') + ', and the rounds of spending add up to ' + usd(Math.abs(R.total), 'billion') + '.') + '">' + cs.join('') + '</svg>';
      if(reduced()) box.querySelector('svg').classList.add('is-still');
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
    /* The gap is drawn wide: AD starts 4 steps from full employment, so the
       economy sits 2 units (a fifth of the axis) from LRAS, and closing it
       takes AD all 4 steps back. A band on the axis shows the gap and how
       much of it the policy has closed. */
    var GAP_S = 4;
    var GAP_SPEC = function(){ return { kind: 'adas', start: { AD: st.gkind === 'recessionary' ? -GAP_S : GAP_S }, do: [] }; };
    function drawGap(){
      changeSlider();
      var g = ML.gap(st.gkind, st.gsize, st.mpc, st.tool, st.change), spec = GAP_SPEC(), rec = st.gkind === 'recessionary';
      var steps = Math.max(-0.9, Math.min(2.2, g.frac)) * GAP_S * (rec ? 1 : -1), shifts = steps ? { AD: steps } : {};
      var e = steps ? G.eq(spec, shifts) : null;
      var left = 1 - g.frac, closed = Math.abs(left) < 0.015, need = Math.abs(g.need), mSize = Math.abs(g.mult);
      var state = closed ? 'closed' : g.frac > 1 ? 'over' : g.frac < 0 ? 'wrong' : 'part';
      var lab = 'AD-AS graph: ' + (rec ? 'a recessionary gap, real GDP below full employment at LRAS' : 'an inflationary gap, real GDP above full employment at LRAS') + '. ' +
        (steps ? 'AD has shifted ' + (steps > 0 ? 'right' : 'left') + '; ' + (closed ? 'the new equilibrium is at full employment.' : state === 'over' ? 'it has gone past full employment.' : state === 'wrong' ? 'the gap is wider.' : 'part of the gap is left.') : 'AD has not moved.');
      var gsvg = G.svg(spec, { shifts: shifts, eq: e }, { label: lab });
      // the gap band just above the real GDP axis: Y1 to full employment, the closed part filled
      var e0 = G.eq(spec, {}), y1 = e0[0], yf = 5, y2 = e ? e[0] : y1, by = G.py(0) + 25, ann = [];
      var a = G.px(Math.min(y1, yf)), b = G.px(Math.max(y1, yf));
      ann.push('<rect class="ml-gband" x="' + f1(a) + '" y="' + f1(by - 5) + '" width="' + f1(b - a) + '" height="10" rx="3"/>');
      if(Math.abs(y2 - y1) > 1e-6){
        var c1 = G.px(Math.min(y1, y2)), c2 = G.px(Math.max(y1, y2));
        ann.push('<rect class="ml-gfill is-' + state + '" x="' + f1(c1) + '" y="' + f1(by - 5) + '" width="' + f1(c2 - c1) + '" height="10" rx="3"/>');
      }
      ann.push('<text class="ml-glab" x="' + f1((a + b) / 2) + '" y="' + f1(by + 17) + '" text-anchor="middle">gap ' + usd(st.gsize) + 'B</text>');
      if(Math.abs(y2 - yf) > 0.35) ann.push('<text class="ml-yf" x="' + f1(G.px(yf)) + '" y="' + f1(G.py(0) + 13) + '" text-anchor="middle">Y<tspan dy="3" font-size="8">F</tspan></text>');
      figs.gap.querySelector('.ml-graph').innerHTML = gsvg.replace('</svg>', ann.join('') + '</svg>');
      var pctClosed = Math.max(-100, Math.min(200, g.frac * 100));
      // Pass 2: two numbers beside the graph (the band under the axis already shows how much is closed).
      void pctClosed;
      figs.gap.querySelector('.ml-meter').innerHTML = '<dl class="ml-nums"><div><dt>' + usd(st.change) + 'B × ' + n(g.mult) + ' = change in real GDP</dt><dd>' + usd(g.effect, 'billion') + '</dd></div><div><dt>Gap left</dt><dd>' + usd(Math.round((g.gapNeeded - g.effect) * 100) / 100, 'billion') + '</dd></div></dl>';
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
      box.innerHTML = banksSvg(box, m, st.scn, st.rr, st.X);
      if(reduced()) box.querySelector('svg').classList.add('is-still');
      figs.money.querySelector('.ml-read').innerHTML = '<span class="ml-chip">Excess reserves ' + usd(m.ex, 'million') + '</span><span class="ml-op">×</span><span class="ml-chip">1 ÷ ' + n(st.rr) + ' = ' + n(m.mm) + '</span>' + (m.now ? '<span class="ml-op">+</span><span class="ml-chip">deposit ' + usd(m.now) + '</span>' : '') + '<span class="ml-op">=</span><span class="ml-chip is-total">ΔM up to ' + usd(m.dm, 'million') + '</span>';
      // Bank 1's balance sheet: the change this event makes.
      var dep = m.deposit, res = sell ? -st.X : st.scn === 'buyBank' ? st.X : st.X, bonds = st.scn === 'buyBank' ? -st.X : sell ? st.X : 0;
      var tacct = '<table class="ml-t"><caption>Bank 1: what changes</caption><thead><tr><th scope="col">Assets</th><th scope="col">Liabilities</th></tr></thead><tbody><tr><td>' +
        '<span>Required reserves</span><b>' + usd(m.req) + '</b><span>Excess reserves</span><b class="is-ex">' + usd(m.ex) + '</b>' + (bonds ? '<span>Bonds</span><b>' + usd(bonds) + '</b>' : '') + '</td><td><span>Checking deposits</span><b>' + usd(dep) + '</b></td></tr></tbody></table>';
      figs.money.querySelector('.ml-tacct').innerHTML = '';
      void res;
      // A shift of 2 keeps M1/M2 and i1/i2 apart in this small graph (it shows direction, not size).
      var mspec = { kind: 'money', do: [] }, msh = m.dm ? { MS: m.dm > 0 ? 2 : -2 } : {};
      figs.money.querySelector('.ml-mm').innerHTML = G.svg(mspec, { shifts: msh, eq: m.dm ? G.eq(mspec, msh) : null }, { label: 'Money market (limited reserves): money supply ' + (m.dm > 0 ? 'shifts right and the nominal interest rate falls' : 'shifts left and the nominal interest rate rises') + '.' });
      var head = { cash: 'A cash deposit: no new money at first, but loans can add up to <b>' + usd(m.dm, 'million') + '</b>.',
        buyBank: 'The Fed buys bonds from a bank: all ' + usd(st.X, 'million') + ' is excess, so the money supply can grow by <b>' + usd(m.dm, 'million') + '</b>.',
        buyPublic: 'The Fed buys bonds from the public: ' + usd(st.X, 'million') + ' of new deposits plus loans, up to <b>' + usd(m.dm, 'million') + '</b>.',
        sellBank: 'The Fed sells bonds to a bank: reserves fall ' + usd(st.X, 'million') + ', and the money supply can shrink by <b>' + usd(-m.dm, 'million') + '</b>.' }[st.scn];
      var body = '<p>The bank must keep ' + n(st.rr * 100) + '% of its deposits as required reserves and can lend the rest, its <b>excess reserves</b>. Each loan is spent and redeposited at the next bank, which keeps ' + n(st.rr * 100) + '% and lends the rest, so each round is ' + n(100 - st.rr * 100) + '% of the one before.</p>' +
        '<p><b>Money multiplier</b> = 1 ÷ ' + n(st.rr) + ' = ' + n(m.mm) + '. Largest change = excess reserves × ' + n(m.mm) + (m.now ? ', plus the ' + usd(m.now) + ' million of new deposits themselves' : '') + '.</p>' +
        (st.scn === 'cash' ? '<p class="mac-slip ml-rule"><b>Watch out:</b> the cash deposit itself is not new money: cash in a wallet and cash in a checking account are both money. Only the loans add to the money supply.</p>' : '') +
        '<p class="ml-rule">This is the <b>limited-reserves</b> model. The Fed now runs an <b>ample-reserves</b> framework: it sets its policy rate with administered rates (interest on reserves), and the money multiplier does not describe what banks do. The exam asks about both.</p>';
      var detH = tacct + '<h3 class="ls-title-l">This change</h3><table class="ls-tbl"><tbody><tr><th scope="row">Required reserves</th><td class="r">' + usd(m.req) + ' million</td></tr><tr><th scope="row">Excess reserves</th><td class="r">' + usd(m.ex) + ' million</td></tr><tr><th scope="row">Money multiplier</th><td class="r">' + n(m.mm) + '</td></tr><tr><th scope="row">New money right away</th><td class="r">' + usd(m.now) + ' million</td></tr><tr><th scope="row">Largest change in the money supply</th><td class="r"><b>' + usd(m.dm) + ' million</b></td></tr></tbody></table>' + data.howItWorks;
      return { head: head, body: body, det: detH, pills: [] };
    }
    var stageEl = host.querySelector('.ml-stage');
    if(window.ResizeObserver){ var lastK = ''; new ResizeObserver(function(){ var k = stageEl.clientWidth + 'x' + stageEl.clientHeight; if(k !== lastK){ lastK = k; update(false); } }).observe(stageEl); }
    function studio(p, s){
      LS = s;
      pane = T.studioPane(p, s, { stage: [stageEl], dock: [ctl], setup: live.gap ? 'Gap' : null, moreLabel: 'The gap', why: [sayEl], details: [det] });
      lastCap = ''; update(true);
      // The ring goes on an MPC that is not on yet, so the tap it asks for changes the rounds.
      var first = mpcA.el.querySelector('button[aria-pressed="false"]');
      if(s.mode() === 'explore' && first && st.view === 'ripple') T.hintSlot(s, first, 'Tap another MPC: every round changes', { before: polSel.el });
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
      // Pass 3: the same banks as Explore (the old bar chart is gone); amounts appear as they are found.
      var qb = fig.querySelector('.ml-qbars');
      qb.innerHTML = banksSvg(qb, m, v.scn, v.rr, v.X, { ex: !showEx, dm: !showDm });
      return;
    }
    // multiplier and total: the spending rounds
    var kind = p.type === 'total' ? (v.tool === 'T' ? 'T' : 'G') : 'G', amt = p.type === 'total' ? v.change : 1;
    var R = ML.ripple(kind, v.mpc, amt, 8), shown = p.type === 'total' ? !!done.dy : !!done.k;
    // Pass 3: the same spending rounds as Explore (spent falls to the next round, saved leaks to the tank).
    fig.innerHTML = '<div class="ml-qbars ml-qcasc"></div>';
    var qb2 = fig.querySelector('.ml-qcasc'), bw = Math.max(300, qb2.clientWidth || 600), bh = Math.max(220, Math.min(460, qb2.clientHeight || 300));
    var sg = kind === 'T' ? (amt > 0 ? -1 : 1) : (amt > 0 ? 1 : -1), inj = Math.abs(amt), tot = p.type === 'total' ? usd(Math.abs(R.total)) + ' billion' : '$' + n(Math.abs(R.total));
    var ttl = p.type === 'total'
      ? (kind === 'T' ? (amt < 0 ? 'A tax cut of ' : 'A tax rise of ') : (amt > 0 ? 'Spending rises ' : 'Spending falls ')) + usd(inj) + ' billion' + (shown ? ': real GDP ' + (R.total > 0 ? 'up ' : 'down ') + tot : ', round by round')
      : 'One extra dollar of spending' + (shown ? ': $1 becomes ' + tot : ', round by round');
    var sttl = p.type === 'total' ? (kind === 'T' ? (amt < 0 ? 'Tax cut ' : 'Tax rise ') : (amt > 0 ? 'Spending up ' : 'Spending down ')) + usd(inj) + 'B' + (shown ? ': GDP ' + (R.total > 0 ? '+' : '−') + usd(Math.abs(R.total)) + 'B' : '')
      : (shown ? '$1 becomes ' + tot : '$1 of new spending');
    qb2.innerHTML = '<svg class="ml-casc" viewBox="0 0 ' + bw + ' ' + bh + '" width="' + bw + '" height="' + bh + '" role="img" aria-label="' + esc('Spending rounds: each is ' + n(v.mpc) + ' of the one before' + (shown ? ', adding up to ' + tot + '.' : '; the total is to be found.')) + '">' +
      cascade({ id: 'mlq', x: 4, y: 2, w: bw - 8, h: bh - 4, inj: inj, mpc: v.mpc, tax: kind === 'T', sign: sg, rows: (bh < 300 ? 5 : 6) + (kind === 'T' ? 1 : 0), title: ttl, short: sttl, dp: 2 }) + '</svg>';
    if(reduced() || fig.done.painted) qb2.querySelector('svg').classList.add('is-still');
    fig.done.painted = 1;
  }
})();
