/* Symbolic steps (drill, Units 2-3, Premium; docs/apprecalc-spec.md section 6).
   OWNED BY THIS TOOL ONLY (builder T2, docs/apprecalc-briefs/t2.md). The model is
   ApPrecalcMath.symbolicSteps (precalculus/assets/tools/math/symbolic-steps.js);
   typed expressions ApPrecalcExpr; math text ApPrecalcTex; curve sampling
   ApPrecalcPlot; the frame ApPrecalcTools.modes and drill on the Tool Studio.

   Explore, "Is it the same?": type an expression and a rewrite of it (or tap
   an example). Both are graphed (the first green, the rewrite orange and
   dashed) over a band that says, piece by piece, where they are equal, where
   they differ, and where only one is defined: ln(x²) against 2 ln x shows
   the rewrite losing x < 0.
   Test yourself: the Q4 drill, one step at a time, each step graded by value
   on the problem's domain. Trig equations draw the graph and the line it
   meets (the second solution appears with the count); a quadratic in e^x
   draws the parabola in u with u ≤ 0 shaded off-limits; inverse trig draws
   the unit circle with the principal range lit. A wrong value is drawn
   dashed; a wrong expression is graphed against the right one. */
(function(){
  'use strict';
  (function(){ var app = document.getElementById('app'); if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Examples & settings'); })();
  var T = window.ApPrecalcTools, M = window.ApPrecalcMath, P = window.ApPrecalcPlot, XP = window.ApPrecalcExpr;
  if(!T || !M || !M.symbolicSteps || M.symbolicSteps.stub || !P || !XP) return;
  var SS = M.symbolicSteps, esc = T.esc;
  function X(){ return window.ApPrecalcTex; }
  function tx(s){ return X() ? X().html(String(s)) : esc(s); }
  function tm(t, d){ return X() ? X().render(t, { display: !!d }) : esc(t); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function mn(s){ return String(s).replace(/-/g, '−'); }
  var WORD = { same: 'equal', diff: 'different', a: 'only the first is defined', b: 'only the rewrite is defined', none: 'neither is defined' };

  function frameOf(w, h, xr, yr, o){
    o = o || {};
    var L = w < 420 ? 34 : 42, Rr = 12, T0 = 10, B = h - (o.bottom || 24);
    if(o.square){ var s = Math.min((w - L - Rr) / (xr[1] - xr[0]), (B - T0) / (yr[1] - yr[0])), pw = s * (xr[1] - xr[0]), ph = s * (yr[1] - yr[0]); L += ((w - L - Rr) - pw) / 2; Rr = w - L - pw; T0 += ((B - T0) - ph) / 2; B = T0 + ph; }
    var G = { w: w, h: h, L: L, R: w - Rr, T: T0, B: B, x: xr, y: yr, phone: w < 420 };
    G.sx = function(v){ return L + (v - xr[0]) / (xr[1] - xr[0]) * (G.R - L); };
    G.sy = function(v){ return T0 + (yr[1] - v) / (yr[1] - yr[0]) * (B - T0); };
    return G;
  }
  function axes(G, o){
    o = o || {}; var out = [], xt = o.piX ? P.piTicks(G.x[0], G.x[1]) : P.ticks(G.x[0], G.x[1], G.phone ? 5 : 8), yt = P.ticks(G.y[0], G.y[1], G.phone ? 4 : 6);
    out.push('<rect class="ss-bg" x="' + r1(G.L) + '" y="' + r1(G.T) + '" width="' + r1(G.R - G.L) + '" height="' + r1(G.B - G.T) + '" rx="8"/>');
    out.push('<g class="ss-grid">' + xt.map(function(v){ return '<line x1="' + r1(G.sx(v)) + '" y1="' + r1(G.T) + '" x2="' + r1(G.sx(v)) + '" y2="' + r1(G.B) + '"/>'; }).join('') + yt.map(function(v){ return '<line x1="' + r1(G.L) + '" y1="' + r1(G.sy(v)) + '" x2="' + r1(G.R) + '" y2="' + r1(G.sy(v)) + '"/>'; }).join('') + '</g>');
    var ax = G.y[0] <= 0 && G.y[1] >= 0 ? G.sy(0) : G.B, ay = G.x[0] <= 0 && G.x[1] >= 0 ? G.sx(0) : G.L;
    out.push('<g class="ss-axis"><line x1="' + r1(G.L) + '" y1="' + r1(ax) + '" x2="' + r1(G.R) + '" y2="' + r1(ax) + '"/><line x1="' + r1(ay) + '" y1="' + r1(G.T) + '" x2="' + r1(ay) + '" y2="' + r1(G.B) + '"/></g>');
    var pl = function(v){ var k = Math.round(v / (Math.PI / 2)); if(!k) return '0'; return (k % 2 ? (k === 1 ? '' : k) + 'π/2' : (k / 2 === 1 ? '' : k / 2) + 'π').replace('-', '−'); };
    out.push('<g class="ss-tk">' + xt.filter(function(v){ return Math.abs(v) > 1e-9 || ay === G.L; }).map(function(v){ return '<text x="' + r1(G.sx(v)) + '" y="' + r1(G.B + 15) + '" text-anchor="middle">' + (o.piX ? pl(v) : mn(+v.toPrecision(6))) + '</text>'; }).join('') +
      yt.filter(function(v){ return Math.abs(v) > 1e-9 || ax === G.B; }).map(function(v){ return '<text x="' + r1(G.L - 5) + '" y="' + r1(G.sy(v) + 4) + '" text-anchor="end">' + mn(+v.toPrecision(6)) + '</text>'; }).join('') + (o.xLabel ? '<text class="ss-axl" x="' + r1(G.R - 2) + '" y="' + r1(G.B - 6) + '" text-anchor="end">' + esc(o.xLabel) + '</text>' : '') + '</g>');
    return out.join('');
  }
  function path(G, f, a, b, cls, n){ var runs = P.sample(f, a, b, G, n || 400); return '<path class="' + cls + '" d="' + runs.map(function(rn){ return 'M' + rn.map(function(p){ return r1(G.sx(p[0])) + ' ' + r1(G.sy(p[1])); }).join('L'); }).join('') + '"/>'; }
  function dot(G, x, y, cls, r){ return '<circle class="' + cls + '" cx="' + r1(G.sx(x)) + '" cy="' + r1(G.sy(y)) + '" r="' + (r || 5) + '"/>'; }
  function lab(G, x, y, t, cls, anchor, dx, dy){ return '<text class="ss-lab ' + (cls || '') + '" x="' + r1(G.sx(x) + (dx || 0)) + '" y="' + r1(G.sy(y) + (dy || 0)) + '" text-anchor="' + (anchor || 'start') + '">' + esc(t) + '</text>'; }
  function observe(el, fn){ if(window.ResizeObserver){ var t = null, last = ''; new ResizeObserver(function(){ var k = el.clientWidth + 'x' + el.clientHeight; if(k === last) return; last = k; clearTimeout(t); t = setTimeout(fn, 40); }).observe(el); } }
  function size(el, w, h){ return [Math.max(260, Math.round(el.clientWidth || w)), Math.max(190, Math.round(el.clientHeight || h))]; }

  T.mount('symbolic-steps', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'symbolic-steps', labels: ['Is it the same?', 'Test yourself'],
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } },
      onShow: function(m){ if(m === 'explore' && ex) ex.redraw(); } });
  });

  /* ============================================================ explore */
  function explore(host, data){
    var st = { a: SS.EXAMPLES[0][0], b: SS.EXAMPLES[0][1], win: 4, touched: false }, LS = null, lastCap = '';
    var cue = T.cue('Type an expression and a rewrite of it, or tap an example. The band under the graph shows where they are equal.');
    host.innerHTML =
      '<section class="bt-problem ss-card" aria-label="Is the rewrite the same?">' +
        '<div class="ss-stage"><div class="ss-plotwrap"><svg class="ss-svg" role="img"></svg></div>' +
          '<p class="ss-legend" aria-hidden="true"><span class="ss-lg ss-lg-a">first</span><span class="ss-lg ss-lg-b">rewrite</span><span class="ss-lg ss-lg-same">equal</span><span class="ss-lg ss-lg-diff">different</span><span class="ss-lg ss-lg-one">one not defined</span></p></div>' +
        '<div class="ss-ctl">' +
          '<div class="ss-in"><label for="ss-a">Expression</label><input id="ss-a" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"><span class="ss-pv" id="ss-a-p" aria-live="polite"></span></div>' +
          '<div class="ss-in"><label for="ss-b">Rewrite</label><input id="ss-b" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"><span class="ss-pv" id="ss-b-p" aria-live="polite"></span></div>' +
          '<div class="ss-ex ls-scroll" role="group" aria-label="Examples">' + SS.EXAMPLES.slice(0, 4).map(function(e, i){ return '<button type="button" class="bt-btn ss-chip" data-i="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(e[0] + ' | ' + e[1]) + '</button>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="ss-say"></div><div class="ss-det"></div>' +
        T.moreHtml('<div class="ss-ex ss-ex-more" role="group" aria-label="More examples">' + SS.EXAMPLES.map(function(e, i){ return i < 4 ? '' : '<button type="button" class="bt-btn ss-chip" data-i="' + i + '" aria-pressed="false">' + esc(e[0] + ' | ' + e[1]) + '</button>'; }).join('') + '</div><div class="ss-wslot"></div>') +
        '<p class="sr-only ss-live"></p>' +
      '</section>';
    var card = host.querySelector('.ss-card'); card.insertBefore(cue.el, card.querySelector('.ss-say'));
    var svg = host.querySelector('.ss-svg'), wrap = host.querySelector('.ss-plotwrap'), ia = host.querySelector('#ss-a'), ib = host.querySelector('#ss-b'), say = T.announcer(host.querySelector('.ss-live'));
    ia.value = st.a; ib.value = st.b;
    var wsl = T.slider({ label: 'Window: x from −w to w', min: 1, max: 12, step: 1, value: st.win, decimals: 0, onInput: function(v){ st.win = v; draw(false); } });
    host.querySelector('.ss-wslot').appendChild(wsl.el);
    function $(s){ return host.querySelector(s) || (LS ? LS.root.querySelector(s) : null); }
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }
    function preview(input, out){ var v = input.value.trim(), r = v ? M.read(v, { vars: ['x'] }) : null; out.innerHTML = !r ? '' : r.ok ? '<span class="bt-small">Reads as</span> ' + tm(r.tex) : '<span class="pcalc-expr-err">' + esc(r.error) + '</span>'; }
    var tmr = null;
    [ia, ib].forEach(function(inp){ inp.addEventListener('input', function(){ touch(); clearTimeout(tmr); tmr = setTimeout(function(){ st.a = ia.value; st.b = ib.value; allChips().forEach(function(c){ c.setAttribute('aria-pressed', 'false'); }); draw(true); }, 220); }); });
    host.querySelectorAll('.ss-ex').forEach(function(box){ box.addEventListener('click', function(e){
      var b = e.target.closest('.ss-chip'); if(!b) return; touch();
      var ex2 = SS.EXAMPLES[+b.getAttribute('data-i')]; st.a = ia.value = ex2[0]; st.b = ib.value = ex2[1];
      allChips().forEach(function(c){ c.setAttribute('aria-pressed', String(c === b)); }); draw(true);
    }); });
    function allChips(){ var out = []; host.querySelectorAll('.ss-chip').forEach(function(c){ out.push(c); }); if(LS) LS.root.querySelectorAll('.ss-chip').forEach(function(c){ if(out.indexOf(c) < 0) out.push(c); }); return out; }
    function ival(p){ var f = function(v){ return mn(String(+M.fixed(v, 2))); }; return '(' + f(p.a) + ', ' + f(p.b) + ')'; }
    function draw(full){
      preview(ia, $('#ss-a-p')); preview(ib, $('#ss-b-p'));
      var sz = size(wrap, 600, 360), w = sz[0], h = sz[1], win = [-st.win, st.win];
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      var R = SS.compareForms(st.a, st.b, win), head, pills = [];
      if(!R.ok){
        svg.innerHTML = ''; head = esc(R.error); pills = [{ html: 'Check what you typed', tone: 'warn' }];
      } else {
        var ys = [];
        for(var i = 0; i <= 200; i++){ var x = win[0] + (win[1] - win[0]) * i / 200; [R.fa(x), R.fb(x)].forEach(function(y){ if(isFinite(y) && Math.abs(y) < 1e6) ys.push(Math.abs(y)); }); }
        ys.sort(function(p, q){ return p - q; });
        var Y = Math.max(2, (ys[Math.floor(ys.length * 0.9)] || 2) * 1.25), Yn = P.ticks(0, Y, 4); Y = Yn[Yn.length - 1] < Y ? Y : Yn[Yn.length - 1];
        var G = frameOf(w, h, win, [-Y, Y], { bottom: 52 }), o = [axes(G, { xLabel: 'x' })];
        o.push(path(G, R.fa, win[0], win[1], 'ss-curve ss-a', 600), path(G, R.fb, win[0], win[1], 'ss-curve ss-b', 600));
        // the band: what is true on each piece of the window
        var by = G.B + 24;
        o.push('<g class="ss-band">' + R.pieces.map(function(p){ var x1 = G.sx(p.a), x2 = G.sx(p.b); return '<rect class="ss-pc is-' + p.s + '" x="' + r1(x1) + '" y="' + r1(by) + '" width="' + r1(Math.max(2, x2 - x1)) + '" height="16" rx="5"><title>' + esc(WORD[p.s]) + '</title></rect>' + (x2 - x1 > 70 ? '<text class="ss-pct" x="' + r1((x1 + x2) / 2) + '" y="' + r1(by + 12) + '" text-anchor="middle">' + esc(p.s === 'same' ? 'equal' : p.s === 'diff' ? 'different' : p.s === 'none' ? '—' : p.s === 'a' ? 'rewrite not defined' : 'first not defined') + '</text>' : ''); }).join('') + '</g>');
        svg.innerHTML = o.join('');
        var same = R.pieces.filter(function(p){ return p.s === 'same'; }), other = R.pieces.filter(function(p){ return p.s !== 'same' && p.s !== 'none'; });
        if(!other.length && same.length){ head = 'Equal on the whole window: wherever either is defined, both are, with the same value.'; pills = [{ html: 'Equal', tone: 'good' }]; }
        else if(!same.length){ head = 'Not equal: ' + (R.pieces.some(function(p){ return p.s === 'diff'; }) ? 'where both are defined, the values differ.' : 'they are never both defined.'); pills = [{ html: 'Not equal', tone: 'bad' }]; }
        else { head = 'Equal only on ' + same.map(ival).join(' and ') + '. ' + other.map(function(p){ return 'On ' + ival(p) + ', ' + WORD[p.s] + '.'; }).join(' '); pills = [{ html: 'Equal on part', tone: 'warn' }]; }
        svg.setAttribute('aria-label', 'Graphs of ' + st.a + ' and ' + st.b + ' for x from −' + st.win + ' to ' + st.win + '. ' + head);
      }
      var why = '<p>Two expressions are equivalent only if they agree <b>wherever either is defined</b>. A rule like $\\ln(x^2) = 2\\ln x$ changes the domain: the left side is defined for every $x \\ne 0$, the right only for $x > 0$. On the exam, a rewrite must hold on the domain of the original.</p>' +
        '<p>Common slips: $\\ln(a + b)$ is not $\\ln a + \\ln b$; $(b^m)^n = b^{mn}$, not $b^{m + n}$; $\\sqrt{x^2} = |x|$; $\\sin^{-1}(\\sin x) = x$ only on $[-\\frac{\\pi}{2}, \\frac{\\pi}{2}]$.</p>';
      T.explain($('.ss-say'), head, tx(why));
      $('.ss-det').innerHTML = '<h3 class="ls-title-l">How to type</h3><p class="bt-small"><code>ln(x)</code>, <code>log_2(x)</code>, <code>log(x)</code> (base 10), <code>e^(2x)</code>, <code>sqrt(x)</code>, <code>sin(x)^2</code>, <code>arcsin(x)</code> or <code>sin^-1(x)</code>, <code>pi</code>, <code>abs(x)</code>.</p>' +
        (R.ok ? '<h3 class="ls-title-l">Piece by piece</h3><table class="ls-tbl"><caption class="sr-only">Where the two agree</caption><thead><tr><th scope="col">Interval</th><th scope="col">What happens</th></tr></thead><tbody>' + R.pieces.map(function(p){ return '<tr><td>' + ival(p) + '</td><td>' + esc(WORD[p.s]) + '</td></tr>'; }).join('') + '</tbody></table>' : '');
      if(LS){ if(head !== lastCap){ LS.caption(head, 'explore'); lastCap = head; } LS.pills(pills, 'left', 'explore'); }
      if(full) say(head);
    }
    observe(wrap, function(){ draw(false); });
    function studio(pane, s){
      LS = s; var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'pcalc-ls-stage'; stage.appendChild(host.querySelector('.ss-stage')); s.add('stage', stage, o);
      var dk = document.createElement('div'); dk.className = 'pcalc-ls-dock ss-ls-dock'; dk.appendChild(host.querySelector('.ss-ctl')); s.add('dock', dk, o);
      var why = document.createElement('div'); why.className = 'ls-sec pcalc-ls-why'; why.appendChild(cue.el); why.appendChild(host.querySelector('.ss-say')); s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var det = document.createElement('div'); det.className = 'ls-sec pcalc-ls-det'; det.appendChild(host.querySelector('.ss-det'));
      var more = host.querySelector('details.bt-more'); if(more){ more.open = true; more.classList.add('pcalc-ls-more'); det.appendChild(more); }
      s.add('details', det, o);
      lastCap = ''; draw(false);
      if(s.mode() === 'explore') s.hint({ target: ib, text: 'Type a rewrite', key: 'apprecalc-symbolic-steps-rewrite' });
    }
    draw(false);
    return { studio: studio, redraw: function(){ draw(false); } };
  }

  /* ============================================================ test yourself */
  function texify(p){
    p.text = '<p>' + tx(p.text) + '</p>'; p.solution = p.solution.map(tx);
    p.steps.forEach(function(s){
      s.label = tx(s.label); if(s.hint) s.hint = tx(s.hint);
      if(s.options) s.options = s.options.map(function(o){ return '<span class="ss-opt">' + tx(o) + '</span>'; });
      if(s.why) s.why = s.why.map(tx);
      if(s.cell && s.cell.mistakes) s.cell.mistakes.forEach(function(m){ m.why = tx(m.why); });
      if(s.cell && s.cell.expr && s.cell.expr.mistakes) s.cell.expr.mistakes.forEach(function(m){ m.why = tx(m.why); });
    });
    return p;
  }
  var METHOD = {
    A: 'Use one rule at a time: a power of a power multiplies exponents; a coefficient in front of a log becomes an exponent; match the identity term by term.',
    B: 'Products of powers add exponents, quotients subtract. Sums of logs multiply the insides, differences divide.',
    dom: 'The rewrite is only claimed where the ORIGINAL expression is defined: every log needs a positive input.',
    iso: 'Undo the outside operations first (add or subtract, then divide) until the power or trig function stands alone.',
    x: 'Undo the base with its log (ln for e). For a log equation, rewrite in exponential form, solve, then check each root in the original logs.',
    N: 'log_b M = c means M = b^c.',
    count: 'Check each candidate against the domain (log inputs positive, e^x > 0) or the interval.',
    u: 'e^(2x) = (e^x)^2 = u^2.',
    x1: 'Solve e^x = u for each positive u: x = ln u.',
    x2: 'Solve e^x = u for the other positive u: x = ln u.',
    tx1: 'Find the reference angle, then use the quadrants where the function has this sign; keep angles in [0, 2π).',
    tx2: 'The other quadrant where the function has this sign gives the second solution.',
    v: 'arcsin and arctan give angles in [−π/2, π/2]; arccos in [0, π].',
    comp: 'Let θ be the inner angle; draw a right triangle from the given ratio and choose the sign from θ\'s quadrant.',
    k: 'Factor out what the identity needs: 2 sin x cos x = sin(2x).',
    n: 'Use the double-angle or Pythagorean identity on this part only.',
    d: 'cos(2x) = 2cos²x − 1.'
  };
  function quiz(host, data){
    var cur = null;
    T.drill(host, data, { slug: 'symbolic-steps', noun: 'drill', typeLabel: 'Problem type', textOnStage: true,
      types: SS.KINDS.map(function(k){ return { value: k, label: SS.TITLE[k] }; }),
      generate: function(r, ctx, type){ return texify(SS.generate(r, ctx, type)); },
      title: function(p){ return p.title; },
      extra: function(el, p){ cur = p.fig ? figure(el, p) : null; },
      onStep: function(s){ if(cur) cur.done(s.key); },
      onTry: function(s, t){ if(!cur || t.ok || t.shown) return false; return cur.yours(s.key, t.value); },
      method: function(s, p){ return (p.type === 'trig-eq' && METHOD['t' + s.key]) || METHOD[s.key] || ''; }
    });
  }
  function figure(el, p){
    var F = p.fig, box = document.createElement('div'); box.className = 'ss-figwrap';
    box.innerHTML = '<div class="ss-plotwrap ss-fig-plot"><svg class="ss-svg" role="img"></svg></div>';
    el.appendChild(box);
    var svg = box.querySelector('svg'), wrap = box.querySelector('.ss-fig-plot'), got = {}, mine = null;
    function draw(){
      var sz = size(wrap, 420, 260), w = sz[0], h = sz[1], o = [], G;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      if(F.kind === 'trig'){
        var f = { sin: Math.sin, cos: Math.cos, tan: Math.tan }[F.f], Y = F.f === 'tan' ? 3 : 1.4;
        G = frameOf(w, h, [0, 2 * Math.PI], [-Y, Y]);
        o.push(axes(G, { piX: true }));
        o.push(path(G, f, 0, 2 * Math.PI, 'ss-curve ss-a', 700));
        if(got.iso || got.count) o.push('<line class="ss-hline" x1="' + r1(G.L) + '" y1="' + r1(G.sy(F.v)) + '" x2="' + r1(G.R) + '" y2="' + r1(G.sy(F.v)) + '"/>', lab(G, 2 * Math.PI, F.v, 'y = ' + mn(M.fixed(F.v, 3)), 'ss-mut', 'end', -4, F.v > 0 ? -6 : 14));
        if(got.count) F.sols.forEach(function(x, i){ o.push('<line class="ss-drop" x1="' + r1(G.sx(x)) + '" y1="' + r1(G.sy(F.v)) + '" x2="' + r1(G.sx(x)) + '" y2="' + r1(G.sy(0)) + '"/>', dot(G, x, F.v, 'ss-pt' + ((i === 0 && got.x1) || (i === 1 && got.x2) ? ' is-got' : ''), 6)); });
        o.push(lab(G, 0.15, Y * 0.85, 'y = ' + F.f + ' x', 'ss-a', 'start'));
        if(mine != null && isFinite(mine)){ var mx = Math.max(-0.2, Math.min(2 * Math.PI + 0.2, mine)); o.push('<line class="ss-yours" x1="' + r1(G.sx(mx)) + '" y1="' + r1(G.T) + '" x2="' + r1(G.sx(mx)) + '" y2="' + r1(G.B) + '"/>', lab(G, mx, -Y * 0.85, 'yours', 'ss-yours-t', 'start', 5)); }
      } else if(F.kind === 'quad'){
        var q = function(u){ return (u - F.u1) * (u - F.u2); }, lo = Math.min(F.u1, F.u2, 0) - 1.5, hi = Math.max(F.u1, F.u2) + 1.5, vy = q((F.u1 + F.u2) / 2);
        G = frameOf(w, h, [lo, hi], [Math.min(-1, vy * 1.2), Math.max(q(lo), q(hi)) * 0.8]);
        o.push('<rect class="ss-forbid" x="' + r1(G.L) + '" y="' + r1(G.T) + '" width="' + r1(G.sx(0) - G.L) + '" height="' + r1(G.B - G.T) + '"/>');
        o.push(axes(G, { xLabel: 'u = eˣ' }));
        o.push(lab(G, lo, G.y[1], 'u = eˣ > 0: nothing here', 'ss-forbid-t', 'start', 6, 16));
        o.push(path(G, q, lo, hi, 'ss-curve ss-a', 300));
        if(got.u || got.count) [F.u1, F.u2].forEach(function(u){ o.push(dot(G, u, 0, u > 0 ? 'ss-pt is-got' : 'ss-pt is-out', 6), lab(G, u, 0, 'u = ' + mn(u) + (u > 0 ? '' : ': rejected'), u > 0 ? 'ss-ok' : 'ss-no', 'middle', 0, -12)); });
        if(mine != null && isFinite(mine) && mine > lo && mine < hi){ o.push('<line class="ss-yours" x1="' + r1(G.sx(mine)) + '" y1="' + r1(G.T) + '" x2="' + r1(G.sx(mine)) + '" y2="' + r1(G.B) + '"/>', lab(G, mine, G.y[1], 'yours (u)', 'ss-yours-t', 'start', 5, 30)); }
      } else {
        G = frameOf(w, h, [-1.5, 1.5], [-1.3, 1.3], { square: true });
        var cx = G.sx(0), cy = G.sy(0), rr = G.sx(1) - G.sx(0), arc = function(a, b, cls){ var pts = []; for(var i = 0; i <= 60; i++){ var t = a + (b - a) * i / 60; pts.push(r1(cx + rr * Math.cos(t)) + ' ' + r1(cy - rr * Math.sin(t))); } return '<path class="' + cls + '" d="M' + pts.join('L') + '"/>'; };
        o.push('<line class="ss-axis-l" x1="' + r1(G.L) + '" y1="' + r1(cy) + '" x2="' + r1(G.R) + '" y2="' + r1(cy) + '"/><line class="ss-axis-l" x1="' + r1(cx) + '" y1="' + r1(G.T) + '" x2="' + r1(cx) + '" y2="' + r1(G.B) + '"/>');
        o.push('<circle class="ss-circle" cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(rr) + '"/>');
        var rg = F.fn === 'arccos' ? [0, Math.PI] : [-Math.PI / 2, Math.PI / 2];
        o.push(arc(rg[0], rg[1], 'ss-range'));
        o.push('<text class="ss-lab ss-ok" x="' + r1(F.fn === 'arccos' ? cx : cx + rr + 8) + '" y="' + r1(F.fn === 'arccos' ? cy - rr - 8 : cy + 4) + '" text-anchor="' + (F.fn === 'arccos' ? 'middle' : 'start') + '">' + (F.fn === 'arccos' ? 'range [0, π]' : 'range [−π/2, π/2]') + '</text>');
        var ray = function(t, cls){ return '<line class="' + cls + '" x1="' + r1(cx) + '" y1="' + r1(cy) + '" x2="' + r1(cx + rr * Math.cos(t)) + '" y2="' + r1(cy - rr * Math.sin(t)) + '"/><circle class="' + cls + '-d" cx="' + r1(cx + rr * Math.cos(t)) + '" cy="' + r1(cy - rr * Math.sin(t)) + '" r="5"/>'; };
        if(got.v) o.push(ray(F.ang, 'ss-ray'));
        if(mine != null && isFinite(mine)) o.push(ray(mine, 'ss-yours'), '<text class="ss-lab ss-yours-t" x="' + r1(cx + (rr + 12) * Math.cos(mine)) + '" y="' + r1(cy - (rr + 12) * Math.sin(mine) + 4) + '" text-anchor="middle">yours</text>');
      }
      svg.innerHTML = o.join('');
      svg.setAttribute('aria-label', F.kind === 'trig' ? 'Graph of y = ' + F.f + ' x on 0 to 2 pi' + (got.count ? ', meeting y = ' + M.fixed(F.v, 3) + ' twice' : '') : F.kind === 'quad' ? 'The parabola in u; the region u ≤ 0 is shaded because e to the x is always positive' : 'Unit circle with the principal range of ' + F.fn + ' highlighted');
    }
    observe(wrap, draw); draw(); setTimeout(draw, 0);
    return {
      done: function(k){ got[k] = true; mine = null; draw(); },
      yours: function(k, v){
        if(F.kind === 'trig' && (k === 'x1' || k === 'x2') && isFinite(v)){ mine = v; draw(); return true; }
        if(F.kind === 'circle' && k === 'v' && isFinite(v)){ mine = v; draw(); return true; }
        return false;
      }
    };
  }
})();
