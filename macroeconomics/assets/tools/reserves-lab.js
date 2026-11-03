/* Bank Reserves Lab page (docs/apmacro-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T2). Mounts into #app with ApMacroTools.mount; the model is
   ApMacroMath.reservesLab (macroeconomics/assets/tools/math/reserves-lab.js),
   the content macroeconomics/data/tools/reserves-lab.json (served filtered as
   assets/tool-data/reserves-lab.json). Frame: ApMacroTools.modes (Explore,
   then Test yourself) on the Tool Studio.

   Explore: three linked graphs, every one drawn by ApMacroGraph.svg (no
   second renderer; this file only adds shift arrows and the PR / i / PL / Y
   axis marks on top of its SVG): the reserve market (the policy rate), the
   money market (the nominal interest rate) and AD-AS (real output and the
   price level). The dock holds the framework switch (ample | limited), the
   five Fed tools and the tool's two actions. A shift glides from the old
   curve (kept faded and dashed, subscript 1) to the new one; the chain
   under the graphs lights link by link (policy rate, interest rates,
   investment, AD, output and prices). The rate colour is shared by the
   reserve market's policy rate, the money market's interest rate and the
   chain's rate chips, so the eye follows it across views. A tool that does
   nothing in the framework says so, with the reason (the reader-report
   slip). On a phone the three graphs are tabs over one picture.
   Details: every tool in both frameworks (a table) and the money multiplier
   worked from ApMacroCalc.

   Test yourself: ApMacroTools.drill over the model's generate(). A graph
   step (problem.steps[i].graph) is drawn with ApMacroGraph.mount on the
   stage and graded through ApMacroGrade.graph: the model lists the end
   states the step tells apart (one per curve and way, "several"), each an
   option of a choice step whose radios are hidden; dragging or arrow-keying
   a curve selects the option that matches the drawn graph, so Check grades
   exactly what was drawn and names the grader's slip. (A `graph` step kind
   in ApMacroTools.drill would replace this bridge; see docs/apmacro-briefs
   report.) */
(function(){
  'use strict';
  var T = window.ApMacroTools, M = window.ApMacroMath, G = window.ApMacroGraph;
  if(!T || !M || !M.reservesLab || M.reservesLab.stub || !G) return;
  var RL = M.reservesLab, esc = T.esc;
  var GW = 320, GH = 300, GL = 50, GT = 14, PW = 250, PH = 226;
  function px(x){ return GL + x / 10 * PW; }
  function py(v){ return GT + (10 - v) / 10 * PH; }
  function f1(v){ return (Math.round(v * 10) / 10).toFixed(1); }
  var ARROW = 'rl-arrow';

  T.mount('reserves-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'reserves-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------ drawing helpers */
  /* An arrow from (x1, y1) to (x2, y2) in graph units, drawn over the SVG. */
  function arrow(x1, y1, x2, y2, cls){
    var a = [px(x1), py(y1)], b = [px(x2), py(y2)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if(L < 6) return '';
    var ux = dx / L, uy = dy / L, h = 7, w = 4.5, bx = b[0] - ux * h, by = b[1] - uy * h;
    return '<g class="' + ARROW + (cls ? ' ' + cls : '') + '"><path d="M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(bx) + ' ' + f1(by) + '"/>' +
      '<path class="rl-head" d="M' + f1(b[0]) + ' ' + f1(b[1]) + 'L' + f1(bx - uy * w) + ' ' + f1(by + ux * w) + 'L' + f1(bx + uy * w) + ' ' + f1(by - ux * w) + 'Z"/></g>';
  }
  function mark(t, x, y, cls, anchor){ return '<text class="rl-mark ' + (cls || '') + '" x="' + f1(x) + '" y="' + f1(y) + '" text-anchor="' + (anchor || 'start') + '">' + t + '</text>'; }
  function sub(main, n){ return esc(main) + '<tspan class="rl-sub" dy="3">' + n + '</tspan>'; }
  /* A graph from ApMacroGraph.svg with its shifts (fractional while it
     glides), the new equilibrium, the arrow and the axis marks. */
  function graphSvg(kind, spec, shifts, t, label){
    var moved = Object.keys(shifts).some(function(c){ return Math.abs(shifts[c]) > 1e-6; });
    var e0 = G.eq(spec, {}), e1 = moved ? G.eq(spec, shifts) : null;
    var html = G.svg(spec, { shifts: shifts, eq: e1 }, { label: label }).replace('<svg class="mac-graph-svg"', '<svg class="mac-graph-svg is-' + kind + '"');
    var extra = [];
    var base = G.curves(spec, {}), now = G.curves(spec, shifts);
    now.forEach(function(c, i){
      var b = base[i]; if(Math.abs(c.at - b.at) < 0.15) return;
      if(c.shape === 'vertical') extra.push(arrow(b.at, 8.3, c.at, 8.3));
      else if(c.shape === 'rdemand') extra.push(arrow(5.4, b.at, 5.4, c.at));
      else if(c.shape === 'down') extra.push(arrow(b.at - 3, 8, c.at - 3, 8));
      else if(c.shape === 'up') extra.push(arrow(b.at + 3, 8, c.at + 3, 8));
    });
    html = nudgeOld(html, base, now);
    var names = { reserves: ['PR', 'Q'], money: ['i', 'M'], adas: ['PL', 'Y'] }[kind];
    if(e0){
      var hi = e1 && Math.abs(e1[1] - e0[1]) > 0.2, right = e1 && Math.abs(e1[0] - e0[0]) > 0.2;
      extra.push(mark(sub(names[0], e1 ? '1' : ''), px(0) + 4, py(e0[1]) + (hi && e1[1] > e0[1] ? 14 : -4), 'is-y' + (e1 ? ' is-old' : '')));
      if(kind === 'adas') extra.push(mark(sub(names[1], e1 ? '1' : ''), px(e0[0]) + (right && e1[0] < e0[0] ? 4 : -4), py(0) - 5, 'is-x' + (e1 ? ' is-old' : ''), right && e1[0] < e0[0] ? 'start' : 'end'));
      if(e1 && hi) extra.push(mark(sub(names[0], '2'), px(0) + 4, py(e1[1]) + (e1[1] > e0[1] ? -4 : 14), 'is-y'));
      if(e1 && right && kind === 'adas') extra.push(mark(sub(names[1], '2'), px(e1[0]) + (e1[0] < e0[0] ? -4 : 4), py(0) - 5, 'is-x', e1[0] < e0[0] ? 'end' : 'start'));
    }
    if(kind === 'reserves' && t && t.ample){
      var rd = G.find(now, 'RD');
      extra.push(mark('IORB rate', px(4.05), py(rd.at) + 15, 'is-note'));
    }
    return html.replace('<svg class="mac-graph-svg"', '<svg class="mac-graph-svg" preserveAspectRatio="xMidYMin meet"').replace('</svg>', extra.join('') + '</svg>');
  }
  /* Where ApMacroGraph puts a curve's label (mac-graph.js labelAt), so the
     old curve's label can be moved off the new one when the two sit a step
     apart (both vertical labels at the top, both demand labels at the foot). */
  function r1(v){ return String(Math.round(v * 10) / 10); }
  function labelAt(c){
    if(c.shape === 'vertical') return [px(c.at) + 4, py(10) + 10];
    if(c.shape === 'up'){ var x1 = Math.min(10, c.at + 5); return [px(x1) - 4, py(G.y(c, x1)) - 4]; }
    if(c.shape === 'down'){ var x2 = Math.min(10, c.at + 5); return [px(x2) - 2, py(G.y(c, x2)) + 2]; }
    return null;
  }
  function nudgeOld(html, base, now){
    now.forEach(function(c, i){
      var b = base[i]; if(Math.abs(c.at - b.at) < 0.15) return;
      var at = labelAt(b), to = labelAt(c); if(!at || !to) return;
      if(Math.abs(at[1] - to[1]) > 12 || Math.abs(at[0] - to[0]) > 30) return;
      var from = 'class="mac-gr-clabel is-old" x="' + r1(at[0]) + '" y="' + r1(at[1]) + '"';
      var dy = c.shape === 'vertical' ? 16 : -13;
      html = html.replace(from, 'class="mac-gr-clabel is-old" x="' + r1(at[0]) + '" y="' + r1(at[1] + dy) + '"');
    });
    return html;
  }
  var TITLE = { reserves: 'Reserve market', money: 'Money market', adas: 'AD-AS' };
  var SUBT = { reserves: 'sets the policy rate', money: 'the nominal interest rate', adas: 'real output and the price level' };

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var fw = 'ample', tool = 'iorb', stance = 0, view = 'reserves', LS = null, touched = false, nid = T.nid('rl');
    var shown = { reserves: {}, money: {}, adas: {} }, anim = null;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem rl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Bank reserves lab</h2>' +
      '<div class="rl-fig">' +
        '<div class="ls-seg rl-tabs" role="group" aria-label="Graph">' + ['reserves', 'money', 'adas'].map(function(k){ return '<button type="button" data-g="' + k + '" aria-pressed="false">' + TITLE[k] + '</button>'; }).join('') + '</div>' +
        '<div class="rl-panels">' + ['reserves', 'money', 'adas'].map(function(k){ return '<figure class="rl-panel" data-g="' + k + '"><figcaption><b>' + TITLE[k] + '</b> <span>' + SUBT[k] + '</span></figcaption><div class="rl-g"></div></figure>'; }).join('') + '<ol class="rl-chain" aria-label="What follows"></ol></div>' +
      '</div>' +
      '<div class="rl-ctl">' +
        '<div class="ls-seg rl-fw" role="group" aria-label="Framework">' + RL.FRAMEWORKS.map(function(f){ return '<button type="button" data-fw="' + f.id + '" aria-pressed="false">' + f.name + '</button>'; }).join('') + '</div>' +
        '<div class="rl-tools ls-scroll" role="group" aria-label="Fed tool">' + RL.TOOLS.map(function(t){ return '<button type="button" class="ls-btn rl-tool" data-t="' + t.id + '" aria-pressed="false">' + esc(t.short) + '</button>'; }).join('') + '</div>' +
        '<div class="rl-acts" role="group" aria-label="Action"><button type="button" class="ls-btn rl-act" data-s="1"></button><button type="button" class="ls-btn rl-act" data-s="-1"></button></div>' +
      '</div>' +
      '<div class="rl-say"></div>' +
      T.moreHtml('<button type="button" class="bt-btn rl-reset">Start over</button><p class="bt-small">Start over puts every curve back where it began.</p>', 'start over') +
      '<div class="rl-nums"></div><p class="sr-only rl-live"></p></section>';
    var say = T.announcer($('.rl-live'));
    var cue = T.cue('Pick an action and watch the policy rate move.');
    $('.rl-ctl').insertBefore(cue.el, $('.rl-ctl').firstChild);
    var tip = null;
    function act(){ if(!touched){ touched = true; cue.done(); if(tip && tip.dismiss) tip.dismiss(); } }

    function onClick(e){
      var b;
      if((b = e.target.closest('.rl-fw button'))){ act(); fw = b.getAttribute('data-fw'); stance = 0; snap(); sync(); redraw(); say(line()); return; }
      if((b = e.target.closest('.rl-tool'))){ act(); tool = b.getAttribute('data-t'); stance = 0; glide(); sync(); say(line()); return; }
      if((b = e.target.closest('.rl-act'))){ act(); stance = +b.getAttribute('data-s'); glide(); sync(); say(line()); return; }
      if((b = e.target.closest('.rl-tabs button'))){ view = b.getAttribute('data-g'); sync(); return; }
      if(e.target.closest('.rl-reset')){ act(); stance = 0; glide(); sync(); say('Start over: every curve is back where it began.'); }
    }
    host.addEventListener('click', onClick);

    function effect(){ return stance ? RL.effect(fw, tool, stance) : null; }
    function target(){ var e = effect(); return e ? e.shifts : { reserves: {}, money: {}, adas: {} }; }
    function snap(){ var t = target(); shown = { reserves: copy(t.reserves), money: copy(t.money), adas: copy(t.adas) }; }
    function copy(o){ var r = {}; for(var k in o) r[k] = o[k]; return r; }
    function glide(){
      var to = target(), from = { reserves: copy(shown.reserves), money: copy(shown.money), adas: copy(shown.adas) };
      if(anim) cancelAnimationFrame(anim);
      if(T.reduced() || !window.requestAnimationFrame){ snap(); redraw(); return; }
      var t0 = null, D = 420;
      function step(ts){
        if(t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / D), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        ['reserves', 'money', 'adas'].forEach(function(g){
          var o = {}, keys = Object.keys(from[g]).concat(Object.keys(to[g]));
          keys.forEach(function(c){ var a = from[g][c] || 0, b = to[g][c] || 0, v = a + (b - a) * e; if(Math.abs(v) > 1e-6) o[c] = v; });
          shown[g] = o;
        });
        redraw();
        if(k < 1) anim = requestAnimationFrame(step); else { anim = null; snap(); redraw(); }
      }
      anim = requestAnimationFrame(step);
    }

    function line(){
      var e = effect(), t = RL.toolOf(tool);
      if(!e) return RL.fwOf(fw).name + ', ' + t.name.toLowerCase() + ': choose ' + t.acts[0].toLowerCase() + ' or ' + t.acts[1].toLowerCase() + '.';
      if(!e.works && e.rate === 'same') return e.act + ' with ' + RL.fwOf(fw).name.toLowerCase() + ': the policy rate does not change. ' + (e.slip || '');
      return e.act + ' with ' + RL.fwOf(fw).name.toLowerCase() + ': the policy rate ' + word(e.rate) + ', investment ' + word(e.inv) + ', AD shifts ' + e.ad + ', real output ' + word(e.output) + ' and the price level ' + word(e.price) + '.';
    }
    function word(d){ return d === 'up' ? 'rises' : d === 'down' ? 'falls' : 'stays the same'; }
    function arrowOf(d){ return d === 'up' ? '↑' : d === 'down' ? '↓' : '–'; }

    function chain(){
      var e = effect(), el = $('.rl-chain');
      var links = [['rate', 'Policy rate', e ? e.rate : null], ['rate', 'Interest rates', e ? e.i : null], ['spend', 'Investment', e ? e.inv : null],
        ['ad', 'AD', e ? (e.ad === 'none' ? 'same' : e.ad === 'left' ? 'down' : 'up') : null], ['out', 'Real GDP', e ? e.output : null], ['out', 'Price level', e ? e.price : null]];
      el.innerHTML = links.map(function(l, i){
        var d = l[2], on = d && d !== 'same';
        var sym = !d ? '' : l[1] === 'AD' ? (d === 'up' ? '→' : d === 'down' ? '←' : '–') : arrowOf(d);
        var short = { 'Policy rate': 'PR', 'Interest rates': 'i', 'Investment': 'I', 'AD': 'AD', 'Real GDP': 'Y', 'Price level': 'PL' }[l[1]];
        var words = !d ? 'not yet' : l[1] === 'AD' ? (d === 'up' ? 'shifts right' : d === 'down' ? 'shifts left' : 'no shift') : word(d);
        return '<li class="rl-link is-' + l[0] + (on ? ' is-on' : d ? ' is-flat' : '') + '" style="--i:' + i + '"><span class="rl-link-n" aria-hidden="true"><span class="rl-long">' + l[1] + '</span><span class="rl-short">' + short + '</span></span><span class="rl-link-d" aria-hidden="true">' + (sym || '·') + '</span><span class="sr-only">' + l[1] + ': ' + words + '</span></li>';
      }).join('');
    }
    function redraw(){
      var sp = RL.specs(fw), ample = fw === 'ample';
      ['reserves', 'money', 'adas'].forEach(function(k){
        var p = $('.rl-panel[data-g="' + k + '"] .rl-g');
        var spec = sp[k];
        var lab = TITLE[k] + ' graph: ' + G.describe(spec, { shifts: roundShifts(shown[k]) });
        p.innerHTML = graphSvg(k, spec, shown[k], { ample: ample }, lab);
      });
      chain();
    }
    function roundShifts(o){ var r = {}; for(var k in o){ var v = Math.round(o[k]); if(v) r[k] = v; } return r; }
    function sync(){
      var t = RL.toolOf(tool), e = effect();
      ($('.rl-fw') ? $('.rl-fw').querySelectorAll('button') : []).forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-fw') === fw)); });
      ($('.rl-tools') ? $('.rl-tools').querySelectorAll('.rl-tool') : []).forEach(function(b){
        var id = b.getAttribute('data-t'), on = id === tool, off = RL.toolOf(id).fw !== fw;
        b.setAttribute('aria-pressed', String(on)); b.classList.toggle('is-other', off);
        b.setAttribute('aria-label', RL.toolOf(id).name + (off ? ' (a ' + RL.fwOf(RL.toolOf(id).fw).name.toLowerCase() + ' tool)' : ''));
      });
      var acts = $('.rl-acts').querySelectorAll('.rl-act');
      acts[0].textContent = t.acts[0]; acts[1].textContent = t.acts[1];
      acts.forEach(function(b){ b.setAttribute('aria-pressed', String(+b.getAttribute('data-s') === stance)); b.classList.toggle('ls-pri', +b.getAttribute('data-s') === stance); });
      $('.rl-fig').setAttribute('data-view', view);
      ($('.rl-tabs') ? $('.rl-tabs').querySelectorAll('button') : []).forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-g') === view)); });
      // Why: what the action does, then the chain in words.
      var whyHead = e ? (e.works ? '<b>' + esc(e.act) + '.</b> ' : '<b>' + esc(e.act) + ': the policy rate does not move.</b> ') : '<b>' + esc(RL.fwOf(fw).name) + '.</b> ' + esc(RL.fwOf(fw).line);
      var body = e ? '<p>' + esc(e.why) + '</p>' + (e.rate !== 'same' ? '<p>Then: interest rates ' + word(e.i) + ', so investment and other interest-sensitive spending ' + word(e.inv) + ', AD shifts ' + e.ad + ', and real output ' + word(e.output) + ' while the price level ' + word(e.price) + ' (unemployment ' + word(e.unemp) + ').</p>' : '') +
        (e.slip ? '<p class="mac-slip"><b>The slip readers see:</b> ' + esc(e.slip) + '</p>' : '')
        : '<p>' + esc(t.name) + (t.fw === fw ? ' is a ' + RL.fwOf(fw).name.toLowerCase() + ' tool.' : ' is a ' + RL.fwOf(t.fw).name.toLowerCase() + ' tool; try it here to see why the Fed does not use it in this framework.') + '</p>';
      T.explain($('.rl-say'), whyHead, body);
      if(LS){
        LS.caption(e ? esc(line()) : '<b>' + esc(RL.fwOf(fw).name) + ':</b> ' + esc(RL.fwOf(fw).line) + ' Pick an action.', 'explore');
        LS.pills(e && !LS.root.classList.contains('ls-phone') ? [{ html: 'Policy rate ' + arrowOf(e.rate) + ' \u00b7 AD ' + (e.ad === 'none' ? 'no shift' : e.ad === 'left' ? '\u2190' : '\u2192'), tone: e.rate === 'same' ? 'ghost' : 'accent' }] : [], 'left', 'explore');
      }
    }
    function nums(){
      var C = M.Calc(), rows = RL.TOOLS.map(function(t){
        var a = RL.effect('ample', t.id, -1), l = RL.effect('limited', t.id, -1);
        var cell = function(e){ return e.rate === 'same' ? 'No change in the policy rate' : 'Policy rate falls; AD shifts right'; };
        return '<tr><th scope="row">' + esc(t.acts[1]) + '</th><td>' + cell(a) + '</td><td>' + cell(l) + '</td></tr>';
      }).join('');
      var mm = C.evaluate({ fn: 'moneyMultiplier', args: [0.1] }), mx = C.evaluate({ fn: 'maxMoneyChange', args: [10, 0.1] });
      $('.rl-nums').innerHTML = '<h3 class="ls-title-l">Every tool, both frameworks</h3>' + T.wrapTables('<table class="ls-tbl rl-tbl"><caption>Easing with each tool (tightening is the mirror image)</caption><thead><tr><th scope="col">Action</th><th scope="col">Ample reserves</th><th scope="col">Limited reserves</th></tr></thead><tbody>' + rows + '</tbody></table>') +
        '<h3 class="ls-title-l">The money multiplier (limited reserves)</h3><p>If the Fed buys $10 million of bonds from a bank and the required reserve ratio is 0.10, the bank gains $10 million of excess reserves. Money multiplier = 1 / 0.10 = ' + M.fmt(mm, 3) + ', so the money supply can grow by up to 10 × ' + M.fmt(mm, 3) + ' = $' + M.fmt(mx, 3) + ' million. It is a maximum: reserves banks keep and cash people hold make it smaller.</p>' +
        '<p class="bt-small">The graphs show directions, not sizes. The money market follows the policy rate (other short-term rates move with it); with ample reserves the exam asks for the reserve market graph.</p>';
    }

    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.rl-fig')], dock: [$('.rl-ctl')], why: [$('.rl-say')], details: [$('.rl-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      sync(); redraw();
      if(s.mode() === 'explore' && !touched) tip = T.hintSlot(s, s.root.querySelector('.rl-act'), 'Start here: raise the rate', { before: s.root.querySelector('.rl-acts') });
      try{ new MutationObserver(function(){ redraw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
    }
    nums(); sync(); redraw();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'reserves-lab', noun: 'drill',
      generate: function(r, ctx, type){ return RL.generate(r, ctx, type); },
      types: [{ value: 'tool', label: 'Pick the tool for the framework' }, { value: 'shift', label: 'Shift the right graph' }, { value: 'multiplier', label: 'The money multiplier' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { tool: 'The right tool for the framework', shift: 'Shift the right curve', multiplier: 'Money multiplier' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.st = {}; figure(el, p, api); },
      onStep: function(s, right, api){ api.st[s.key] = true; if(s.graph && api.g){ if(!right){ api.g.showKey(true); } api.g.lock(); } after(api); }
    });
    // A graph step with nothing drawn yet: say so (instead of "Choose an answer first").
    host.addEventListener('submit', function(e){
      var f = e.target; if(!f.querySelector || !f.querySelector('.rl-gmark')) return;
      if(f.querySelector('.cd-opts input:checked')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      var fb = f.querySelector('.cd-fb'); if(fb) fb.innerHTML = '<span class="bt-small">Shift a curve first: drag it on the graph, or tab to its button and use the arrow keys.</span>';
    }, true);
  }
  function stepForm(api){ var m = api.area.querySelector('.rl-gmark'); return m ? m.closest('form') : null; }
  function figure(el, p, api){
    var g = p.figure;
    if(g.kind === 'graph'){
      var st = p.steps.filter(function(s){ return s.graph; })[0];
      el.innerHTML = '<figure class="cd-fig rl-qfig"><figcaption class="rl-qcap"><b>' + TITLE[g.spec.kind] + '</b> <span>' + (g.spec.kind === 'reserves' ? 'ample reserves' : 'limited reserves') + '</span></figcaption><div class="rl-mount"></div><div class="rl-after"></div></figure>';
      api.g = G.mount(el.querySelector('.rl-mount'), g.spec, { onChange: function(resp){
        var f = stepForm(api); if(!f) return;
        var k = RL.optionOf(st, resp.shifts), mk = f.querySelector('.rl-gmark');
        f.querySelectorAll('.cd-opts input').forEach(function(x){ x.checked = +x.value === k; });
        if(mk) mk.textContent = k < 0 ? 'Your graph: nothing shifted yet.' : 'Your graph: ' + st.options[k].replace(/\.$/, '').toLowerCase() + '.';
      } });
      var f0 = function(){ var f = stepForm(api), mk = f && f.querySelector('.rl-gmark'); if(mk && !mk.textContent) mk.textContent = 'Your graph: nothing shifted yet.'; };
      setTimeout(f0, 0);
    } else if(g.kind === 'show'){
      el.innerHTML = '<figure class="cd-fig rl-qfig rl-qshow"><div class="rl-qrow"></div></figure>';
    } else if(g.kind === 'bank'){
      el.innerHTML = '<figure class="cd-fig rl-qfig"><figcaption class="rl-qcap"><b>The bank’s balance sheet</b> <span>after the sale</span></figcaption>' +
        T.wrapTables('<table class="ls-tbl rl-taccount"><caption class="sr-only">Balance sheet changes</caption><thead><tr><th scope="col">Assets</th><th scope="col">Liabilities</th></tr></thead><tbody><tr><td>Reserves +$' + g.x + ' million</td><td>Deposits: no change</td></tr><tr><td>Bonds −$' + g.x + ' million</td><td></td></tr></tbody></table>', 'Balance sheet') +
        '<div class="rl-after"></div></figure>';
    }
    api.fig = el;
    after(api);
  }
  /* The figure catches up with the answers: the shift, then AD-AS. */
  function after(api){
    var p = api.problem, g = p.figure, st = api.st || {}, el = api.fig;
    if(!el) return;
    var e = g.stance ? RL.effect(g.fw, g.tool, g.stance) : null;
    if(g.kind === 'show'){
      var row = el.querySelector('.rl-qrow'), sp = RL.specs(g.fw), main = g.fw === 'ample' ? 'reserves' : 'money', parts = [];
      var sh = st.graph ? e.shifts[main] : {};
      parts.push(panel(main, sp[main], sh, g.fw));
      if(st.chain) parts.push(panel('adas', sp.adas, e.shifts.adas, g.fw));
      row.innerHTML = parts.join('');
    } else if(g.kind === 'graph'){
      var box = el.querySelector('.rl-after');
      box.innerHTML = st.chain && e && e.rate !== 'same' ? panel('adas', RL.specs(g.fw).adas, e.shifts.adas, g.fw) : '';
    } else if(g.kind === 'bank'){
      var b2 = el.querySelector('.rl-after');
      b2.innerHTML = st.max ? panel('money', RL.specs('limited').money, { MS: 1 }, 'limited') : '';
    }
  }
  function panel(k, spec, shifts, fw){
    var lab = TITLE[k] + ' graph: ' + G.describe(spec, { shifts: shifts });
    return '<div class="rl-qpanel"><p class="rl-qcap"><b>' + TITLE[k] + '</b> <span>' + SUBT[k] + '</span></p>' + graphSvg(k, spec, shifts, { ample: fw === 'ample' }, lab) + '</div>';
  }
})();
