/* Factor Market Lab page (docs/apmicro-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T4). Mounts into #app with ApMicroTools.mount; the model is
   ApMicroMath.factorLab (assets/tools/math/factor-lab.js), the content
   data/tools/factor-lab.json. Frame: ApMicroTools.modes on the Tool Studio.

   Explore: a hiring table beside its graph (tabs on a phone), linked by
   color: the MRP column is the MRP curve's color, the wage (or MFC) column
   the line's. Competitive: product price and wage sliders; the table's MRP
   recomputes (ApMicroCalc) and the firm's MRP curve shifts on the two-panel
   labor graph (ApMicroGraph, the old curve kept faded), the hired rows light
   up. Monopsony: the town's only employer; MFC above the wage, hiring where
   MRP = MFC, the wage read from supply, the wage bill shaded on the
   monopsony graph; a minimum wage slider draws the W_min line and moves the
   hiring point. Details: the least-cost rule worked, the numbers.

   Test yourself: ApMicroTools.drill over the model's generate(); graph
   steps mount ApMicroGraph on the stage figure, graded by ApMicroGrade.graph. */
(function(){
  'use strict';
  var T = window.ApMicroTools, M = window.ApMicroMath, G = window.ApMicroGraph;
  if(!T || !M || !M.factorLab || M.factorLab.stub || !G) return;
  var FL = M.factorLab, esc = T.esc, money = FL.money;

  T.mount('factor-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'factor-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var nid = T.nid('fl'), LS = null, touched = false, tip = null, anim = null;
    var view = 'comp', tab = 'table', P = FL.P0, W = FL.W0, MW = 0, shown = FL.competitive(P, W).shifts;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem fl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Factor market lab</h2>' +
      '<div class="fl-fig" data-tab="table">' +
        '<div class="ls-seg fl-tabs" role="group" aria-label="Show"><button type="button" data-t="table" aria-pressed="true">Hiring table</button><button type="button" data-t="graph" aria-pressed="false">Graph</button></div>' +
        '<div class="fl-body"><div class="fl-tbl"></div><div class="fl-g"></div></div>' +
      '</div>' +
      '<div class="fl-ctl"><div class="ls-seg fl-view" role="group" aria-label="Labor market"><button type="button" data-v="comp" aria-pressed="true">Competitive</button><button type="button" data-v="mono" aria-pressed="false">Monopsony</button></div><div class="fl-sl"></div></div>' +
      '<div class="fl-say"></div><div class="fl-det"></div><p class="sr-only fl-live"></p></section>';
    var say = T.announcer($('.fl-live'));
    var cue = T.cue('Raise the price of bread and watch hiring change.');
    $('.fl-ctl').insertBefore(cue.el, $('.fl-ctl').firstChild);
    var sP = T.slider({ label: 'Price of a loaf ($)', min: 2, max: 7, step: 1, value: P, decimals: 0, onInput: function(v){ act(); P = v; glide(); say(line()); } });
    var sW = T.slider({ label: 'Daily wage ($)', min: 12, max: 32, step: 4, value: W, decimals: 0, onInput: function(v){ act(); W = v; glide(); say(line()); } });
    var sM = T.slider({ label: 'Minimum wage ($, 0 is none)', min: 0, max: 24, step: 2, value: 0, decimals: 0, onInput: function(v){ act(); MW = v; redraw(); say(line()); } });
    [sP, sW, sM].forEach(function(s){ $('.fl-sl').appendChild(s.el); });
    function act(){ if(!touched){ touched = true; cue.done(); if(tip && tip.dismiss) tip.dismiss(); } }

    function glide(){
      var to = FL.competitive(P, W).shifts, from = { MRP: shown.MRP || 0, SL: shown.SL || 0 };
      if(anim) cancelAnimationFrame(anim);
      if(T.reduced() || !window.requestAnimationFrame){ shown = to; redraw(); return; }
      var t0 = null;
      function stepF(ts){ if(t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / 380), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        shown = { MRP: from.MRP + (to.MRP - from.MRP) * e, SL: from.SL + (to.SL - from.SL) * e }; redraw(true);
        if(k < 1) anim = requestAnimationFrame(stepF); else { anim = null; shown = to; redraw(); } }
      anim = requestAnimationFrame(stepF);
    }
    function line(){
      if(view === 'comp'){ var c = FL.competitive(P, W), last = c.rows[c.hire - 1], nx = c.rows[c.hire];
        return 'Hire ' + c.hire + ' workers: worker ' + c.hire + '’s MRP ' + money(last.mrp) + ' covers the ' + money(W) + ' wage' + (nx ? '; worker ' + nx.L + ' would add only ' + money(nx.mrp) + '.' : '.'); }
      var m = FL.monopsony(MW);
      return 'Hire ' + m.hire + ' workers where MRP ≥ MFC and pay ' + money(m.wage) + (MW > 16 ? ' (the minimum wage)' : ', read from labor supply') + '. A competitive market would hire ' + m.comp + ' at ' + money(m.compWage) + '.';
    }
    function table(){
      if(view === 'comp'){
        var c = FL.competitive(P, W);
        return T.wrapTables('<table class="ls-tbl fl-t"><caption>Rise Bakery: bread at ' + money(P) + ', wage ' + money(W) + ' a day</caption><thead><tr><th scope="col">Workers</th><th scope="col">Loaves</th><th scope="col">MP</th><th scope="col" class="fl-c-mrp">MRP = MP × P</th><th scope="col" class="fl-c-w">Wage</th></tr></thead><tbody>' +
          c.rows.map(function(r){ var on = r.L <= c.hire; return '<tr class="' + (on ? 'is-hired' : 'is-not') + (r.L === c.hire ? ' hl' : '') + '"><th scope="row">' + r.L + '</th><td>' + r.tp + '</td><td>' + r.mp + '</td><td class="fl-c-mrp">' + money(r.mrp) + '</td><td class="fl-c-w">' + money(W) + '</td></tr>'; }).join('') + '</tbody></table>') +
          '<p class="fl-note"><b>Hire ' + c.hire + '.</b> Wage bill ' + money(W) + ' × ' + c.hire + ' = ' + money(c.bill) + '.</p>';
      }
      var m = FL.monopsony(MW);
      return T.wrapTables('<table class="ls-tbl fl-t"><caption>Northwood Mill, the only employer in Pine Ridge' + (MW ? ', minimum wage ' + money(MW) : '') + '</caption><thead><tr><th scope="col">Workers</th><th scope="col" class="fl-c-w">Wage from supply</th><th scope="col">Labor cost</th><th scope="col" class="fl-c-mfc">MFC</th><th scope="col" class="fl-c-mrp">MRP</th></tr></thead><tbody>' +
        m.rows.map(function(r){ var on = r.L <= m.hire; return '<tr class="' + (on ? 'is-hired' : 'is-not') + (r.L === m.hire ? ' hl' : '') + '"><th scope="row">' + r.L + '</th><td class="fl-c-w">' + money(r.paid) + '</td><td>' + money(r.tlc) + '</td><td class="fl-c-mfc">' + money(r.mfc) + '</td><td class="fl-c-mrp">' + money(r.mrp) + '</td></tr>'; }).join('') + '</tbody></table>') +
        '<p class="fl-note"><b>Hire ' + m.hire + ', pay ' + money(m.wage) + '.</b> Wage bill ' + money(m.bill) + '. Competitive: ' + m.comp + ' workers at ' + money(m.compWage) + '.</p>';
    }
    function graph(fast){
      if(view === 'comp'){
        var spec = { kind: 'labor', do: ['label'] }, sh = {};
        if(Math.abs(shown.MRP) > 1e-6) sh.MRP = shown.MRP; if(Math.abs(shown.SL) > 1e-6) sh.SL = shown.SL;
        var e1 = sh.SL ? G.eq(spec, sh) : null;
        return G.svg(spec, { shifts: sh, eq: e1, labelsShown: true, curveN: '2', n0: '1', n1: '2' }, { label: 'Labor market and firm: ' + G.describe(spec, { shifts: round(sh) }) + ' ' + line() });
      }
      // The hiring point, labeled and marked on both axes (integration 12, T4-4).
      var ms = { kind: 'monopsony', do: ['shade'], key: { shade: 'wage-bill' }, pointLabel: 'Hire' }, bind = MW > 16;
      if(!bind) ms.pointMarks = { x: 'L_M', y: 'W_M' };
      if(MW) ms.line = { id: 'MW', at: MW / 4 };
      var pt = G.named(ms, {}, bind ? 'min-wage' : 'hire');
      return G.svg(ms, { shade: bind ? [] : G.regionCells(ms, ['wage-bill', 'dwl']), labelsShown: true, point: pt }, { label: 'Monopsony graph: labor supply, MFC above it, MRP. ' + line() }).replace('class="mic-graph-svg"', 'class="mic-graph-svg' + (bind ? ' fl-nobill' : '') + '"');
    }
    function round(o){ var r = {}; for(var k in o){ var v = Math.round(o[k]); if(v) r[k] = v; } return r; }
    function redraw(fast){
      $('.fl-g').innerHTML = graph(fast);
      if(fast) return;
      $('.fl-tbl').innerHTML = table();
      sync();
    }
    function sync(){
      $('.fl-fig').setAttribute('data-tab', tab); $('.fl-fig').setAttribute('data-view', view);
      $('.fl-tabs').querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-t') === tab)); });
      $('.fl-view').querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === view)); });
      sP.el.hidden = sW.el.hidden = view !== 'comp'; sM.el.hidden = view === 'comp';
      cue.el.querySelector('.bt-cue-t').textContent = view === 'comp' ? 'Raise the price of bread and watch hiring change.' : 'Add a minimum wage and watch employment.';
      var head, body;
      if(view === 'comp'){
        var c = FL.competitive(P, W);
        head = esc(line());
        body = '<p>A firm hires while the next worker adds at least as much revenue as she costs: <b>MRP = MRC</b>. In a competitive labor market the MRC is the wage, the same for every worker.</p>' +
          '<p><b>Derived demand.</b> MRP = MP × P. When the demand for bread rises, its price rises, so every worker’s MRP rises, the bakery’s labor demand (its MRP curve) shifts right, and it hires more at the same wage. Every link counts on the exam: product demand, product price, MRP, labor demand, hiring.</p>' +
          '<p><b>The wage.</b> A competitive firm takes the wage from the market (S = MFC = W on its panel). Fewer workers in the market shift market supply left and raise the wage; the bakery then moves along its MRP and hires fewer.</p>' + (c.hire >= 8 ? '<p>At this price every worker in the table pays off.</p>' : '');
      } else {
        var m = FL.monopsony(MW);
        head = esc(line());
        body = '<p>A monopsonist is the only buyer of labor, so it faces the upward-sloping market labor supply. To hire one more worker it must raise the wage for everyone, so its <b>marginal factor cost</b> is above the wage (MFC lies above S<sub>L</sub>).</p>' +
          '<p>It hires where <b>MRP = MFC</b>, then pays the lowest wage that attracts that many workers, read down on the <b>labor supply</b> curve (not on MRP or MFC). It hires fewer workers at a lower wage than a competitive market; the hatched triangle is the deadweight loss.</p>' +
          '<p><b>A minimum wage</b> between the monopsony wage (' + money(16) + ') and the competitive wage (' + money(22) + ') makes the MFC flat at the minimum wage up to the supply curve, so the firm hires <b>more</b> workers. Above the competitive wage, employment falls. Below ' + money(16) + ' it does not bind.</p>';
        void m;
      }
      T.explain($('.fl-say'), head, body);
      if(LS){ LS.caption(head, 'explore'); var c2 = view === 'comp' ? FL.competitive(P, W) : FL.monopsony(MW); LS.pills([{ html: 'Hire ' + c2.hire, tone: 'accent' }], 'left', 'explore'); }
    }
    function details(){
      var C = M.Calc(), lc = function(k){ return C.evaluate({ fn: 'leastCost', args: [60, 20, 100, 50], pick: k }); };
      $('.fl-det').innerHTML = '<h3 class="ls-title-l">The least-cost rule</h3><p>A firm making a given output at the least cost spends so that the last dollar on each input adds the same output: <b>MP<sub>L</sub> / w = MP<sub>K</sub> / r</b>.</p>' +
        '<div class="worked"><p>The last worker adds 60 loaves and costs $20 an hour: 60 ÷ 20 = ' + M.fmt(lc('labor'), 3) + ' loaves per dollar. The last oven adds 100 loaves and rents for $50 an hour: 100 ÷ 50 = ' + M.fmt(lc('capital'), 3) + ' loaves per dollar.</p><p>Labor gives more per dollar, so the bakery should shift spending toward workers until the two are equal (the marginal product of labor falls as it hires more).</p></div>' +
        '<h3 class="ls-title-l">Profit-maximizing hiring</h3><p>The least-cost rule says how to combine inputs; MRP = MRC for every input (MRP<sub>L</sub> / w = MRP<sub>K</sub> / r = 1) also says how much to use.</p>' +
        '<p class="bt-small">The graphs show directions, not the table’s exact numbers. The monopsony table is drawn to scale: worker numbers are twice the graph’s, dollars four times.</p>';
    }
    function onClick(e){
      var b;
      if((b = e.target.closest('.fl-view button'))){ act(); view = b.getAttribute('data-v'); redraw(); say(line()); return; }
      if((b = e.target.closest('.fl-tabs button'))){ tab = b.getAttribute('data-t'); sync(); }
    }
    host.addEventListener('click', onClick);
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.fl-fig')], dock: [$('.fl-ctl')], why: [$('.fl-say')], details: [$('.fl-det')] });
      s.root.addEventListener('click', onClick); host.removeEventListener('click', onClick);
      redraw();
      if(s.mode() === 'explore' && !touched) tip = T.hintSlot(s, sP.el, 'Start here: raise the price', { before: sP.el });
      try{ new MutationObserver(function(){ redraw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
    }
    details(); redraw();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  var TITLES = { hire: 'How many to hire', derived: 'Derived demand', monopsony: 'Monopsony', leastcost: 'The least-cost rule' };
  function quiz(host, data){
    T.drill(host, data, { slug: 'factor-lab', noun: 'drill',
      generate: function(r, ctx, type){ return FL.generate(r, ctx, type); },
      types: [{ value: 'hire', label: 'MRP and how many to hire' }, { value: 'derived', label: 'Derived demand' }, { value: 'monopsony', label: 'Monopsony' }, { value: 'leastcost', label: 'The least-cost rule' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return TITLES[p.type] || 'Practice problem'; },
      extra: function(el, p, api){
        if(p.type === 'leastcost'){
          var g = p.given, card = function(k, name, mp, pr, unit){ return '<div class="fl-lc-c" data-k="' + k + '"><b>' + name + '</b><span>adds ' + mp + ' ' + esc(unit) + '</span><span>costs ' + money(pr) + ' an hour</span><span class="fl-pd">? per dollar</span></div>'; };
          var ctx = data.contexts.filter(function(c){ return c.id === p.ctx; })[0] || { unit: '' };
          el.innerHTML = '<figure class="cd-fig fl-lc"><figcaption>The last worker and the last machine</figcaption><div class="fl-lc-row">' + card('labor', 'Worker', g.mpl, g.w, ctx.unit) + card('capital', 'Machine', g.mpk, g.r, ctx.unit) + '</div></figure>';
          api.lc = el; return;
        }
        if(!p.table && !p.steps.some(function(s){ return s.kind === 'graph'; })) return;
        el.innerHTML = '<figure class="cd-fig fl-qfig">' + (p.table ? '<div class="fl-qtbl">' + T.wrapTables(p.table) + '</div>' : '') + '<div class="fl-qg"></div></figure>';
        api.g = el.querySelector('.fl-qg');
      },
      onStep: function(s, right, api){
        if(!api.lc || (s.key !== 'labor' && s.key !== 'capital')) return;
        var c = api.lc.querySelector('[data-k="' + s.key + '"]'); c.classList.add('is-done');
        c.querySelector('.fl-pd').textContent = M.fmt(s.cell.answer, 3) + ' per dollar';
        if(s.key === 'capital'){ var a = api.problem.given.mpl / api.problem.given.w, b = api.problem.given.mpk / api.problem.given.r; if(Math.abs(a - b) > 1e-9) api.lc.querySelector('[data-k="' + (a > b ? 'labor' : 'capital') + '"]').classList.add('is-best'); }
      },
      graphHost: function(s, api){ var t = api.g && api.g.parentNode.querySelector('.fl-qtbl'); if(t) t.classList.add('is-small'); return api.g; }
    });
  }
})();
