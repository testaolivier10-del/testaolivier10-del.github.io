/* Firm and Market Lab page (docs/apmicro-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T2). The model is ApMicroMath.firmMarket (tools/math/firm-market.js);
   every graph is drawn by ApMicroGraph (kinds pc, monopoly, monocomp) and
   every graph step graded by ApMicroGrade.graph.

   Explore, three market structures behind one switch:
     Perfect competition  the market beside the firm (ApMicroGraph `pc`). A
                          change in demand moves the market price, carried
                          across as the firm's d = MR = AR = P; the firm makes
                          q where P = MC; the profit or loss box is shaded.
                          "Run the long run" shifts supply (entry or exit)
                          until P = minimum ATC. The old curves stay faded.
     Monopoly             Q where MR = MC, up to demand for P, the profit box;
                          consumer surplus and deadweight loss on request; a
                          demand slider.
     Monopolistic         the short-run profit, then the long run: entry shifts
     competition          the firm's demand left until it is tangent to ATC
                          (zero profit, excess capacity).
   Every point and area is read off the engine (named points, areas), and
   this script adds the marks the exam story needs (P_M, Q_M, the box and its
   name) in the engine's coordinates. Curves can be moved with the buttons
   and the arrow keys; colors link the market's supply to the firm's MC.
   On a narrow stage the market and the firm are two tabs.

   Test yourself: ApMicroTools.drill with the model's five kinds; each graph
   step is mounted on the stage figure (graphHost) and graded by
   ApMicroGrade.graph, recorded as "firm-market:<context>:<step>". */
(function(){
  'use strict';
  var T = window.ApMicroTools, M = window.ApMicroMath, FM = M && M.firmMarket, G = window.ApMicroGraph, GR = window.ApMicroGrade;
  var app = document.getElementById('app');
  if(!T || !FM || !G || !app) return;
  if(FM.stub){ app.innerHTML = '<p class="mic-soon">This trainer is being built. Meanwhile, read the <a href="../learn.html">free notes</a>.</p>'; return; }
  var esc = T.esc, px = G.px, py = G.py, BOX = G.BOX;
  function f1(v){ return Math.round(v * 10) / 10; }
  function reduced(){ return T.reduced ? T.reduced() : false; }
  function ease(t){ return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function sub(m, s){ return m + '<tspan class="mic-gr-sub" dy="3">' + s + '</tspan>'; }

  T.mount('firm-market', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'firm-market',
      explore: function(host){ ex = explore(host); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------ annotation helpers */
  function polyPath(poly){ return 'M' + poly.map(function(p){ return f1(px(p[0])) + ' ' + f1(py(p[1])); }).join('L') + 'Z'; }
  function cellsOf(spec, off, names, panel){
    var A = G.areas(spec, off), ids = [];
    names.forEach(function(n){ (A.regions[n] || []).forEach(function(c){ if(ids.indexOf(c) < 0) ids.push(c); }); });
    return A.cells.filter(function(c){ return ids.indexOf(c.id) > -1 && (!panel || c.panel === panel); });
  }
  function boxOf(cells, cls, word){
    if(!cells.length) return '';
    var out = cells.map(function(c){ return '<path class="fm-area ' + cls + '" d="' + polyPath(c.poly) + '"/>'; }).join('');
    if(word){
      var c = cells[0], xs = c.poly.map(function(p){ return p[0]; }), ys = c.poly.map(function(p){ return p[1]; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      var hpx = (y1 - y0) / 10 * BOX.PH;
      if(hpx >= 14 && x1 - x0 > 1.6) out += '<text class="fm-aword ' + cls + '" x="' + f1(px((x0 + x1) / 2)) + '" y="' + f1(py((y0 + y1) / 2) + 4) + '" text-anchor="middle">' + word + '</text>';
    }
    return out;
  }
  // insert under the curves (after the axis) of the panel's svg
  function under(svg, panel, extra){
    var at = panel ? svg.indexOf('data-panel="' + panel + '"') : 0;
    var i = svg.indexOf('<path class="mic-gr-axis"', at);
    return i < 0 ? svg : svg.slice(0, i) + extra + svg.slice(i);
  }
  function over(svg, panel, extra){
    var at = panel ? svg.indexOf('data-panel="' + panel + '"') : 0, i = svg.indexOf('</svg>', at);
    return svg.slice(0, i) + extra + svg.slice(i);
  }

  /* Each live curve's label takes its curve's color (CSS fm-t-<id>). */
  function tag(svg){ return svg.replace(/(<g class="mic-gr-c" data-curve="(\w+)">[\s\S]*?<\/g>)<text class="mic-gr-clabel /g, '$1<text class="mic-gr-clabel fm-t-$2 '); }
  /* ------------------------------------------------------------ explore */
  var SHOCKS = [
    { id: 'up', d: 2, label: 'Demand rises (a fad, higher incomes)', short: 'Demand rises' },
    { id: 'down', d: -2, label: 'Demand falls (a cheaper substitute)', short: 'Demand falls' }
  ];
  function explore(host){
    var st = { kind: 'pc', pc: { d0: 0, s0: 0, d: 0, s: 0, phase: 'start' }, mono: { d: 0, show: { profit: 1, cs: 0, dwl: 0 } }, mcomp: { d0: 0, d: 0, phase: 'short' }, anim: null, panel: 'market' };
    var LS = null, sp = null;
    host.innerHTML =
      '<figure class="fm-fig"><div class="fm-tabs" role="group" aria-label="Which graph"><button type="button" class="fm-tab on" data-p="market" aria-pressed="true">Market</button><button type="button" class="fm-tab" data-p="firm" aria-pressed="false">Firm</button></div>' +
        '<div class="fm-svg"></div><figcaption class="sr-only fm-live"></figcaption></figure>' +
      '<div class="fm-ctl"><div class="fm-kinds" role="group" aria-label="Market structure">' +
        '<button type="button" class="tchip fm-kind on" data-k="pc" aria-pressed="true">Perfect competition</button><button type="button" class="tchip fm-kind" data-k="monopoly" aria-pressed="false">Monopoly</button><button type="button" class="tchip fm-kind" data-k="monocomp" aria-pressed="false">Monopolistic competition</button></div>' +
        '<div class="fm-row fm-pc"><div class="bt-ctl bt-select fm-shock"><label for="fm-shock">Change in the market</label><select id="fm-shock"><option value="">Choose a change…</option>' + SHOCKS.map(function(s){ return '<option value="' + s.id + '">' + esc(s.label) + '</option>'; }).join('') + '</select></div>' +
          '<div class="fm-btns"><button type="button" class="btn-press sm fm-long" disabled>Run the long run</button><button type="button" class="bt-btn fm-reset">Start over</button></div></div>' +
        '<div class="fm-row fm-mono" hidden><div class="fm-dslider"></div><div class="fm-shows" role="group" aria-label="Show areas"><button type="button" class="tchip fm-show on" data-a="profit" aria-pressed="true">Profit</button><button type="button" class="tchip fm-show" data-a="cs" aria-pressed="false">Consumer surplus</button><button type="button" class="tchip fm-show" data-a="dwl" aria-pressed="false">Deadweight loss</button></div></div>' +
        '<div class="fm-row fm-mcomp" hidden><div class="fm-btns"><button type="button" class="btn-press sm fm-mlong">Run the long run</button><button type="button" class="bt-btn fm-mreset">Back to the short run</button></div></div>' +
      '</div><div class="fm-say"></div><div class="fm-nums"></div>' +
      T.moreHtml('<div class="fm-handles"><p class="bt-small">Move the market curves yourself (perfect competition): press a button, or tab to it and use the left and right arrow keys (Home starts over).</p>' +
        '<div class="fm-hrow"><button type="button" class="bt-btn fm-h" data-c="D" data-v="-0.5">Demand left</button><button type="button" class="bt-btn fm-h" data-c="D" data-v="0.5">Demand right</button>' +
        '<button type="button" class="bt-btn fm-h" data-c="S" data-v="-0.5">Supply left</button><button type="button" class="bt-btn fm-h" data-c="S" data-v="0.5">Supply right</button></div></div>', 'move the market curves yourself');
    var fig = host.querySelector('.fm-fig'), svgEl = host.querySelector('.fm-svg'), say = T.announcer(host.querySelector('.fm-live'));
    var sayEl = host.querySelector('.fm-say'), numsEl = host.querySelector('.fm-nums'), ctl = host.querySelector('.fm-ctl');
    var select = host.querySelector('#fm-shock'), longBtn = host.querySelector('.fm-long');
    var dS = T.slider({ label: 'Demand for the monopolist’s product', min: -1, max: 1.5, step: 0.5, value: 0, decimals: 1, onInput: function(v){ cue.done(); st.mono.d = v; draw(); } });
    dS.el.querySelector('output').classList.add('fm-out');
    var outText = function(v){ return v === 0 ? '0' : v > 0 ? '+' + v : '−' + Math.abs(v); };
    (function(){ var inp = dS.input, out = dS.el.querySelector('output'), f = function(){ out.textContent = outText(+inp.value); inp.setAttribute('aria-valuetext', outText(+inp.value)); }; inp.addEventListener('input', f); dS.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', f); }); f(); })();
    host.querySelector('.fm-dslider').appendChild(dS.el);
    var cue = T.cue('Pick a change in the market, then run the long run.');
    host.insertBefore(cue.el, host.firstChild);

    /* -------- perfect competition */
    function pcSvg(){
      var P = st.pc, spec = { kind: 'pc', start: {} }, shifts = {};
      if(P.d0) spec.start.D = P.d0; if(P.s0) spec.start.S = P.s0;
      if(Math.abs(P.d - P.d0) > 1e-6) shifts.D = P.d - P.d0;
      if(Math.abs(P.s - P.s0) > 1e-6) shifts.S = P.s - P.s0;
      var S = FM.pcState(P.d, P.s), x = [];
      var label = 'Market and firm graphs. ' + G.describe(spec, { shifts: shifts }) + ' ' + pcWords(S);
      // Long run: the points go E2 to E3, supply S1 to S2 (curveN0, integration T2-3).
      var svg = G.svg(spec, { shifts: shifts, showEq: true, n1: P.phase === 'long' ? '3' : '2', n0: P.phase === 'long' ? '2' : '1', curveN0: '1' }, { label: label });
      if(P.phase === 'long'){
        // Demand already moved in the short run and is drawn unshifted here; the engine has no
        // number for an unshifted curve, so it is labeled D2 by hand.
        if(Math.abs(P.d) > 1e-6) svg = svg.replace(/(<g class="mic-gr-c" data-curve="D">[\s\S]*?<\/g><text class="mic-gr-clabel [^"]*"[^>]*>)D<\/text>/, '$1D<tspan class="mic-gr-sub" dy="3">2</tspan></text>');
      }
      var cells = cellsOf(spec, shifts, [S.kind === 'loss' ? 'loss' : 'profit'], 'firm');
      if(S.kind !== 'zero') svg = under(svg, 'firm', boxOf(cells, 'fm-a-' + S.kind, S.kind === 'profit' ? 'Profit' : 'Loss'));
      // ATC at q, on the price axis, when it differs from P (the box's other edge)
      if(S.kind !== 'zero' && Math.abs(S.atc - S.P) > 0.25) x.push('<text class="mic-gr-mark fm-atcmark" x="' + (BOX.L - 4) + '" y="' + f1(py(S.atc) + 4) + '" text-anchor="end">ATC</text>');
      if(S.kind === 'zero'){ var m = S.minAtc; x.push('<circle class="fm-ring" cx="' + f1(px(m[0])) + '" cy="' + f1(py(m[1])) + '" r="8"/>'); }
      svg = over(svg, 'firm', x.join(''));
      return svg;
    }
    function pcWords(S){
      return 'The market price is ' + (Math.abs(S.P - 5) < 0.05 ? 'at the minimum of ATC' : S.P > 5 ? 'above the minimum of ATC' : 'below the minimum of ATC') + '; the firm makes q where P = MC and ' + (S.kind === 'zero' ? 'earns zero economic profit.' : S.kind === 'profit' ? 'earns an economic profit (shaded).' : 'takes an economic loss (shaded).');
    }
    /* -------- monopoly and monopolistic competition */
    function monoSvg(kind){
      var spec = kind === 'monopoly' ? { kind: 'monopoly' } : { kind: 'monocomp', run: 'short' };
      var d = kind === 'monopoly' ? st.mono.d : st.mcomp.d, d0 = kind === 'monopoly' ? d : st.mcomp.d0;
      if(Math.abs(d0) > 1e-6) spec.start = { D: d0 };
      var shifts = {}; if(Math.abs(d - d0) > 1e-6) shifts.D = d - d0;
      var off = {}; if(Math.abs(d) > 1e-6) off.D = d;
      var S = FM.monoState(kind === 'monopoly' ? { kind: 'monopoly' } : { kind: 'monocomp', run: 'short' }, off);
      var label = (kind === 'monopoly' ? 'Monopoly graph. ' : 'Monopolistic competition graph. ') + G.describe(spec, { shifts: shifts }) + ' ' + monoWords(kind, S);
      // MR moves with D: its faded old label only crowds the axis (D1 says where demand was).
      var svg = G.svg(spec, { shifts: shifts, followerOld: false }, { label: label }), lay = [], x = [];
      var show = kind === 'monopoly' ? st.mono.show : { profit: 1 };
      if(show.cs) lay.push(boxOf(cellsOf(spec, shifts, ['cs']), 'fm-a-cs', 'CS'));
      if(show.dwl) lay.push(boxOf(cellsOf(spec, shifts, ['dwl']), 'fm-a-dwl', ''));
      if(show.profit && S.kind !== 'zero') lay.push(boxOf(cellsOf(spec, shifts, [S.kind]), 'fm-a-' + S.kind, S.kind === 'profit' ? 'Profit' : 'Loss'));
      svg = under(svg, null, lay.join(''));
      // the three moves: Q where MR = MC, up to demand, across to the price axis
      var X = px(S.Q), Ym = py(S.mc), Yp = py(S.P);
      x.push('<path class="fm-up" d="M' + f1(X) + ' ' + f1(py(0)) + 'V' + f1(Yp) + 'H' + px(0) + '"/>');
      x.push('<circle class="fm-mrmc" cx="' + f1(X) + '" cy="' + f1(Ym) + '" r="4.5"/>');
      x.push('<circle class="mic-gr-eq fm-pm" cx="' + f1(X) + '" cy="' + f1(Yp) + '" r="6"/>');
      var mk = kind === 'monopoly' ? 'M' : '';
      x.push('<text class="mic-gr-mark fm-mk" x="' + f1(X) + '" y="' + (BOX.T + BOX.PH + 13) + '" text-anchor="middle">' + (mk ? sub('Q', mk) : 'Q') + '</text>');
      x.push('<text class="mic-gr-mark fm-mk" x="' + (BOX.L - 4) + '" y="' + f1(Yp + 4) + '" text-anchor="end">' + (mk ? sub('P', mk) : 'P') + '</text>');
      if(S.kind !== 'zero' && Math.abs(S.atc - S.P) > 0.3) x.push('<text class="mic-gr-mark fm-atcmark" x="' + (BOX.L - 4) + '" y="' + f1(py(S.atc) + 4) + '" text-anchor="end">ATC</text>');
      if(show.dwl && S.alloc){ x.push('<circle class="fm-alloc" cx="' + f1(px(S.alloc[0])) + '" cy="' + f1(py(S.alloc[1])) + '" r="4.5"/><text class="fm-tag" x="' + f1(px(S.alloc[0]) + 8) + '" y="' + f1(py(S.alloc[1]) + 14) + '">P = MC</text>'); }
      if(kind === 'monocomp' && S.kind === 'zero'){
        var mn = G.named(spec, shifts, 'min-atc'), y0 = BOX.T + BOX.PH + 20;
        x.push('<circle class="fm-ring" cx="' + f1(X) + '" cy="' + f1(Yp) + '" r="10"/>');
        // the excess capacity bracket under the axis, from Q to the output at minimum ATC
        x.push('<path class="fm-up" d="M' + f1(px(mn[0])) + ' ' + f1(py(mn[1])) + 'V' + f1(py(0)) + '"/><path class="fm-cap" d="M' + f1(X) + ' ' + f1(y0) + 'H' + f1(px(mn[0])) + 'M' + f1(X) + ' ' + f1(y0 - 4) + 'v8M' + f1(px(mn[0])) + ' ' + f1(y0 - 4) + 'v8"/>');
        x.push('<text class="fm-tag" x="' + f1((X + px(mn[0])) / 2) + '" y="' + f1(y0 + 15) + '" text-anchor="middle">Excess capacity</text>');
      }
      return over(svg, null, x.join(''));
    }
    function monoWords(kind, S){
      return 'MR = MC at Q' + 'ₘ' + '; the price is read up on demand, above MC' + (S.kind === 'zero' ? '; demand just touches ATC, so profit is zero.' : '; P is ' + (S.kind === 'profit' ? 'above' : 'below') + ' ATC: an economic ' + S.kind + ' (shaded).');
    }

    function draw(){
      fig.setAttribute('data-kind', st.kind);
      svgEl.innerHTML = tag(st.kind === 'pc' ? pcSvg() : monoSvg(st.kind));
      if(!st.anim) words();
      longBtn.disabled = !!st.anim || Math.abs(FM.pcState(st.pc.d, st.pc.s).P - 5) < 0.05;
      ctl.querySelector('.fm-mlong').disabled = !!st.anim || st.mcomp.phase === 'long';
    }
    function words(){
      var head, body = [], rows = [];
      if(st.kind === 'pc'){
        var P = st.pc, S = FM.pcState(P.d, P.s), up = S.P > 5;
        if(P.phase === 'start') head = 'Long-run equilibrium: P = minimum ATC, so the firm earns zero economic profit. <b>Choose a change</b> in the market.';
        else if(P.phase === 'long') head = '<b>Long run:</b> ' + (P.d > 0 ? 'profits drew new firms in, so supply shifted right' : 'losses pushed firms out, so supply shifted left') + ' until P is back at the minimum of ATC. Zero profit again, with ' + (P.d > 0 ? 'more' : 'fewer') + ' firms.';
        else if(S.kind === 'zero') head = 'The price is at the minimum of ATC: zero economic profit, so no firm enters or exits.';
        else head = '<b>Short run:</b> the price ' + (up ? 'rises' : 'falls') + ', the firm’s d = MR = AR = P line ' + (up ? 'rises' : 'falls') + ' with it, and the firm ' + (up ? 'earns a profit' : 'takes a loss') + ' (shaded). Now press <b>Run the long run</b>.';
        body.push('The market sets the price where demand meets supply. Each firm takes that price: its demand is horizontal, d = MR = AR = P, carried across from the market.');
        body.push('The firm produces where P = MC, on the rising part of MC. Profit or loss = (P − ATC) × q: the shaded box between the price line and ATC.');
        if(S.kind === 'loss') body.push('The price is still above the minimum of AVC (the shutdown point), so in the short run the firm keeps producing: each unit pays its variable cost and part of the fixed cost.');
        body.push('With economic profit, new firms enter (no barriers) and market supply shifts right; with losses, firms exit and supply shifts left. It stops when P = minimum ATC: zero economic profit, each firm at the lowest ATC (productive efficiency) and P = MC (allocative efficiency).');
        rows = [['Market price', fmt(S.P)], ['Firm output q', fmt(S.q)], ['ATC at q', fmt(S.atc)], ['Profit (P − ATC) × q', fmt(S.profit)], ['Shutdown price (min AVC)', fmt(S.minAvc[1])], ['Break-even price (min ATC)', fmt(S.minAtc[1])]];
      } else {
        var kind = st.kind, d = kind === 'monopoly' ? st.mono.d : st.mcomp.d, off = {}; if(d) off.D = d;
        var S2 = FM.monoState(kind === 'monopoly' ? { kind: 'monopoly' } : { kind: 'monocomp', run: 'short' }, off);
        if(kind === 'monopoly') head = '<b>Q<sub>M</sub> where MR = MC</b>, then straight up to demand for the price P<sub>M</sub>. P<sub>M</sub> is above ATC: ' + (S2.kind === 'profit' ? 'an economic profit (shaded), kept by barriers to entry.' : S2.kind === 'zero' ? 'zero profit.' : 'a loss.');
        else if(st.mcomp.phase === 'long') head = '<b>Long run:</b> entry shifted the firm’s demand left until it just touches ATC. P = ATC (zero profit), P &gt; MC, and output is left of minimum ATC: excess capacity.';
        else head = '<b>Short run:</b> like a monopoly, Q where MR = MC and P up on demand: an economic profit (shaded). Press <b>Run the long run</b>.';
        body.push('Demand slopes down, so to sell one more unit the firm lowers its price on every unit: MR lies below demand (twice as steep for a straight line).');
        body.push('Produce where MR = MC. The price comes from the demand curve above that quantity, never from MR or MC.');
        body.push('P is above MC, so the firm makes less than the allocatively efficient quantity (where demand meets MC): the deadweight loss.');
        if(kind === 'monocomp') body.push('In monopolistic competition entry is easy, so profit draws in firms with similar products. Each firm’s demand shifts left until it is tangent to ATC: zero economic profit, but P &gt; MC and excess capacity remain.');
        rows = [['Quantity Q (MR = MC)', fmt(S2.Q)], ['Price P (on demand)', fmt(S2.P)], ['MC at Q', fmt(S2.mc)], ['ATC at Q', fmt(S2.atc)], ['Profit (P − ATC) × Q', fmt(S2.profit)], ['Efficient quantity (P = MC)', fmt(S2.alloc ? S2.alloc[0] : null)]];
      }
      T.explain(sayEl, head, '<ol class="ls-steps">' + body.map(function(b){ return '<li><span>' + b + '</span></li>'; }).join('') + '</ol>');
      numsEl.innerHTML = '<h3 class="ls-title-l">Read off the graph</h3><table class="ls-tbl"><tbody>' + rows.map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<p class="bt-small">In graph units (both axes 0 to 10). The model counts directions and areas, not dollars.</p>';
      if(LS){ LS.caption(head, 'explore'); if(sp) sp.open(); }
      say(String(head).replace(/<[^>]+>/g, ''));
    }
    function fmt(v){ return v == null ? '·' : (Math.round(v * 100) / 100).toFixed(2).replace(/^-/, '−'); }

    /* -------- motion */
    function tween(set, ms, done){
      stop();
      if(reduced() || !window.requestAnimationFrame){ set(1); draw(); if(done) done(); return; }
      var t0 = null; st.anim = { id: 0 };
      var fr = function(ts){ if(!st.anim) return; if(t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / ms); set(ease(k)); svgEl.innerHTML = tag(st.kind === 'pc' ? pcSvg() : monoSvg(st.kind)); if(k < 1) st.anim.id = requestAnimationFrame(fr); else { st.anim = null; draw(); if(done) done(); } };
      st.anim.id = requestAnimationFrame(fr);
    }
    function stop(){ if(st.anim){ try{ cancelAnimationFrame(st.anim.id); }catch(e){} st.anim = null; } }
    function shock(id){
      var s = SHOCKS.filter(function(x){ return x.id === id; })[0]; if(!s) return;
      cue.done();
      var P = st.pc; P.d0 = 0; P.s0 = 0; P.d = 0; P.s = 0; P.phase = 'short';
      tween(function(k){ P.d = s.d * k; }, 650, function(){ if(fig.classList.contains('is-narrow')) setPanel('firm'); });
    }
    function runLong(){
      var P = st.pc, to = FM.pcLongRun(P.d);
      cue.done(); P.d0 = P.d; P.s0 = P.s; P.phase = 'long';
      if(fig.classList.contains('is-narrow')) setPanel('market');
      if(LS) LS.caption((P.d > 0 ? 'Profit draws new firms in: supply shifts right…' : 'Losses push firms out: supply shifts left…'), 'explore');
      var from = P.s;
      tween(function(k){ P.s = from + (to - from) * k; }, 1500, function(){ if(fig.classList.contains('is-narrow')) setTimeout(function(){ setPanel('firm'); }, 400); });
    }
    function resetPc(){ stop(); st.pc = { d0: 0, s0: 0, d: 0, s: 0, phase: 'start' }; select.value = ''; setPanel('market'); draw(); }
    function nudge(c, v){
      cue.done(); stop();
      var P = st.pc; P.d0 = P.d; P.s0 = P.s; P.phase = 'short';
      var clamp = function(x){ return Math.max(-2, Math.min(2, x)); };
      if(c === 'D') P.d = clamp(P.d + v); else P.s = clamp(P.s + v);
      // the engine's firm stays above the shutdown price within these steps
      select.value = ''; draw();
    }
    function setKind(k){
      stop(); st.kind = k;
      ctl.querySelectorAll('.fm-kind').forEach(function(b){ var on = b.getAttribute('data-k') === k; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      ctl.querySelector('.fm-pc').hidden = k !== 'pc'; ctl.querySelector('.fm-mono').hidden = k !== 'monopoly'; ctl.querySelector('.fm-mcomp').hidden = k !== 'monocomp';
      if(LS) LS.pills([], 'left', 'explore');
      draw();
    }
    function setPanel(p){
      st.panel = p; fig.setAttribute('data-panel', p);
      fig.querySelectorAll('.fm-tab').forEach(function(t){ var on = t.getAttribute('data-p') === p; t.classList.toggle('on', on); t.setAttribute('aria-pressed', String(on)); });
    }
    ctl.addEventListener('click', function(e){
      var k = e.target.closest('.fm-kind'); if(k){ cue.done(); setKind(k.getAttribute('data-k')); return; }
      var sh = e.target.closest('.fm-show'); if(sh){ var a = sh.getAttribute('data-a'); st.mono.show[a] = st.mono.show[a] ? 0 : 1; sh.classList.toggle('on', !!st.mono.show[a]); sh.setAttribute('aria-pressed', String(!!st.mono.show[a])); draw(); return; }
      if(e.target.closest('.fm-long')) runLong();
      if(e.target.closest('.fm-reset')) resetPc();
      if(e.target.closest('.fm-mlong')){ cue.done(); var to = FM.longRunD(); st.mcomp.d0 = 0; st.mcomp.phase = 'long'; tween(function(kk){ st.mcomp.d = to * kk; }, 1400); }
      if(e.target.closest('.fm-mreset')){ stop(); st.mcomp = { d0: 0, d: 0, phase: 'short' }; draw(); }
    });
    select.addEventListener('change', function(){ if(select.value) shock(select.value); });
    host.querySelectorAll('.fm-h').forEach(function(b){
      b.addEventListener('click', function(){ if(st.kind !== 'pc') setKind('pc'); nudge(b.getAttribute('data-c'), +b.getAttribute('data-v')); });
      // arrow keys move the same curve either way; Home puts the market back
      b.addEventListener('keydown', function(e){
        var c = b.getAttribute('data-c'), v = /Right|Up/.test(e.key) ? 0.5 : /Left|Down/.test(e.key) ? -0.5 : null;
        if(e.key === 'Home'){ e.preventDefault(); resetPc(); return; }
        if(v === null) return;
        e.preventDefault(); if(st.kind !== 'pc') setKind('pc'); nudge(c, v);
      });
    });
    fig.addEventListener('click', function(e){ var t = e.target.closest('.fm-tab'); if(t) setPanel(t.getAttribute('data-p')); });
    function fit(){ fig.classList.toggle('is-narrow', fig.clientWidth > 0 && fig.clientWidth < 600); }
    if(window.ResizeObserver) new ResizeObserver(fit).observe(fig);
    window.addEventListener('resize', fit);
    setPanel('market');

    function studio(pane, s){
      LS = s;
      sp = T.studioPane(pane, s, { stage: [fig], dock: [ctl], setup: 'Curves', moreLabel: 'Move the market curves yourself', why: [sayEl], details: [numsEl] });
      sp.setup('Demand and supply');
      draw(); fit();
      if(s.mode() === 'explore') T.hintSlot(s, select, 'Start here: change the market', { before: select.parentNode });
    }
    draw(); fit();
    return { studio: studio, stop: stop };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'firm-market', noun: 'drill',
      generate: function(r, ctx, type){ return FM.generate(r, ctx, type); },
      types: [{ value: 'quantity', label: 'A price taker’s output and profit' }, { value: 'shutdown', label: 'Profit, loss or shut down' }, { value: 'longrun', label: 'The long run, link by link' }, { value: 'monopoly', label: 'Monopoly: MR = MC, price from demand' }, { value: 'monocomp', label: 'Monopolistic competition' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { quantity: 'A price taker’s best output', shutdown: 'Profit, loss or shut down', longrun: 'From the short run to the long run', monopoly: 'A monopoly’s price and profit', monocomp: 'Monopolistic competition' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){
        var f = document.createElement('figure');
        f.className = 'cd-fig fm-qfig';
        f.innerHTML = '<div class="fm-qgraph"></div>' + (p.figure.table ? '<div class="table-wrap fm-qtw" tabindex="0" role="region" aria-label="The problem’s data">' + p.figure.table + '</div>' : '');
        el.appendChild(f);
        api.gslot = f.querySelector('.fm-qgraph');
        // With no table, the first graph is on the stage from the start (as a picture).
        var g0 = p.steps.filter(function(s){ return s.kind === 'graph'; })[0];
        if(!p.figure.table && g0){
          var sp = {}; for(var k in g0.spec) if(k !== 'do' && k !== 'key' && k !== 'slips' && k !== 'movable') sp[k] = g0.spec[k];
          api.gslot.innerHTML = G.svg(sp, { showEq: true }, {});
        } else api.gslot.hidden = true;
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
