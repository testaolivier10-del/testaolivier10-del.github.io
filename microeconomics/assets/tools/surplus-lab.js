/* Surplus and Policy Lab page (docs/apmicro-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T3). The model is ApMicroMath.surplusLab (tools/math/surplus-lab.js);
   every graph is drawn by ApMicroGraph (mic-graph.js) and every shade step
   graded by ApMicroGrade.graph.

   Explore: one market (iced tea, a bottle a unit, $2 a graph step), a policy
   picker (none, ceiling, floor, tax, subsidy, world price, tariff) and one
   slider for its level. ApMicroGraph.svg draws the graph with its area
   cells; this script colors each cell by the area it belongs to (the
   model's partition of ApMicroGraph.areas), with the same color on the
   area's value chip under the graph, so a chip and its area are one thing.
   Tap a chip or an area to show that area alone; tap again for all. The
   numbers (ApMicroCalc, through the model) are in the chips, the caption and
   Details, where "Who pays a tax" splits a tax by elasticity (a linear
   market of its own: the engine's curves are equally steep).

   Test yourself: ApMicroTools.drill with the model's seven kinds. A shade
   step is drill's "graph" kind mounted on the stage figure (graphHost), so
   the student shades the graph the problem drew. */
(function(){
  'use strict';
  var T = window.ApMicroTools, M = window.ApMicroMath, S = M && M.surplusLab, G = window.ApMicroGraph;
  var app = document.getElementById('app');
  if(!T || !S || !G || !app) return;
  if(S.stub){ app.innerHTML = '<p class="mic-soon">This trainer is being built. Meanwhile, read the <a href="../learn.html">free notes</a>.</p>'; return; }
  var esc = T.esc, money = S.money, units = S.units;
  function reduced(){ return T.reduced ? T.reduced() : false; }
  function ease(t){ return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  T.mount('surplus-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'surplus-lab',
      explore: function(host){ ex = explore(host); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* The areas, their names and colors (CSS .sl-r-<id>). */
  var AREA = { cs: 'Consumer surplus', ps: 'Producer surplus', rev: 'Tax revenue', gain: 'Gain from trade', dwl: 'Deadweight loss' };
  function revName(t){ return t === 'subsidy' ? 'Subsidy cost' : t === 'tariff' ? 'Tariff revenue' : 'Tax revenue'; }
  function revRegion(t){ return t === 'subsidy' ? 'subsidy-cost' : t === 'tariff' ? 'tariff-revenue' : 'tax-revenue'; }
  /* Color the engine's cells: each by the area it is part of; with a focus,
     the focused area's cells in its color and the rest faint. */
  function paintCells(svg, part, focusCells, focusCls, outline){
    return svg.replace(/class="mic-gr-cell([^"]*)" data-cell="([a-z])"/g, function(all, extra, id){
      var cls = focusCells ? (focusCells.indexOf(id) > -1 ? focusCls : 'none') : (part[id] || 'none');
      var o = !focusCells && outline && outline.indexOf(id) > -1 ? ' sl-outline' : '';
      return 'class="mic-gr-cell' + extra + ' sl-r-' + cls + o + '" data-cell="' + id + '"';
    });
  }


  /* Axis marks close in value are spread by the engine itself (integration T3-1). */

  /* ------------------------------------------------------------ explore */
  var MKT = { sD: 0, sS: 0, kP: 2, kQ: 10 };
  // Each policy's one setting, in dollars. The ranges keep the graph's marks apart.
  var WORLD = [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17];
  var POL = {
    none: { label: 'No policy' },
    ceiling: { label: 'Price ceiling', set: 'Ceiling price', field: 'at', min: 3, max: 8.5, step: 0.5, def: 6, from: 10 },
    floor: { label: 'Price floor', set: 'Floor price', field: 'at', min: 11.5, max: 17, step: 0.5, def: 14, from: 10 },
    tax: { label: 'Tax', set: 'Tax per unit', field: 'amount', min: 3, max: 6, step: 0.5, def: 4, from: 0 },
    subsidy: { label: 'Subsidy', set: 'Subsidy per unit', field: 'amount', min: 4.5, max: 6, step: 0.5, def: 5, from: 0 },
    world: { label: 'World price', set: 'World price', field: 'at', index: WORLD, def: 6, from: 10 },
    tariff: { label: 'Tariff', set: 'Tariff per unit', field: 'amount', min: 3, max: 5, step: 0.5, def: 3, from: 0, world: 4 }
  };
  function polOf(t, v){
    var P = POL[t], o = { type: t };
    if(t === 'none') return o;
    o[P.field] = v;
    if(t === 'tariff') o.at = P.world;
    return o;
  }

  function explore(host){
    var st = { t: 'tax', v: {}, focus: null, letters: false, anim: null, shown: null };
    Object.keys(POL).forEach(function(k){ if(POL[k].def != null) st.v[k] = POL[k].def; });
    var LS = null, sp = null;
    host.innerHTML =
      '<figure class="sl-fig"><div class="sl-graph" aria-describedby="sl-live"></div>' +
        '<div class="sl-vals" role="group" aria-label="Areas: tap one to show it alone"></div>' +
        '<figcaption class="sr-only" id="sl-live"></figcaption></figure>' +
      '<div class="sl-ctl"><div class="sl-pols ls-scroll" role="group" aria-label="Policy">' +
        Object.keys(POL).map(function(k){ return '<button type="button" class="tchip sl-pol" data-p="' + k + '" aria-pressed="false">' + esc(POL[k].label) + '</button>'; }).join('') +
      '</div><div class="sl-slot"></div></div>' +
      '<div class="sl-say"></div><div class="sl-nums"></div><div class="sl-inc"></div>' +
      T.moreHtml('<div class="bt-radio"><input type="checkbox" id="sl-let"><label for="sl-let">Letter the areas (a, b, c …) as the exam does</label></div>' +
        '<p class="bt-small">The market: iced tea, by the bottle. Demand meets the price axis at $20 and supply starts at $0; without a policy 50 bottles sell at $10.</p>', 'letters, the market');
    var fig = host.querySelector('.sl-fig'), gEl = host.querySelector('.sl-graph'), vals = host.querySelector('.sl-vals');
    var say = T.announcer(host.querySelector('#sl-live'));
    var cue = T.cue('Pick a policy, then slide its level: watch each area change size.');
    host.insertBefore(cue.el, host.firstChild);
    var slider = null, slot = host.querySelector('.sl-slot');

    function cur(){ return polOf(st.t, st.shown != null ? st.shown : st.v[st.t]); }
    function buildSlider(){
      slot.innerHTML = '';
      var P = POL[st.t];
      if(!P.set){ slot.innerHTML = '<p class="bt-small sl-none">No policy: the market clears where demand meets supply. Pick a policy to change it.</p>'; slider = null; return; }
      if(P.index){
        var idx = P.index.indexOf(st.v[st.t]);
        slider = T.slider({ id: 'sl-level', label: P.set, min: 0, max: P.index.length - 1, step: 1, value: idx < 0 ? 0 : idx, decimals: 0, onInput: function(i){ setLevel(P.index[Math.round(i)]); } });
        var txt = function(i){ var w = P.index[Math.round(i)]; return money(w) + (w < 10 ? ' (imports)' : ' (exports)'); };
        var out = slider.el.querySelector('output'), inp = slider.input;
        var show = function(){ out.textContent = txt(+inp.value); inp.setAttribute('aria-valuetext', txt(+inp.value)); };
        inp.addEventListener('input', show); slider.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', show); }); show();
      } else {
        slider = T.slider({ id: 'sl-level', label: P.set, min: P.min, max: P.max, step: P.step, value: st.v[st.t], decimals: 2, unit: '', onInput: setLevel });
        var o2 = slider.el.querySelector('output'), i2 = slider.input, fx = function(){ o2.textContent = money(+i2.value); i2.setAttribute('aria-valuetext', money(+i2.value)); };
        i2.addEventListener('input', fx); slider.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', fx); }); fx();
      }
      slot.appendChild(slider.el);
      if(st.t === 'tariff') slot.insertAdjacentHTML('beforeend', '<p class="bt-small sl-note">World price fixed at ' + money(P.world) + '.</p>');
    }
    function setLevel(v){ stop(); cue.done(); st.v[st.t] = v; st.shown = null; draw(); words(); }

    /* -------- the picture */
    function chipsFor(t, v){
      var out = [['cs', v.cs], ['ps', v.ps]];
      if(t === 'tax' || t === 'subsidy' || t === 'tariff') out.push(['rev', v.rev]);
      if(t === 'world') out.push(['gain', v.gain]);
      if(t !== 'none' && t !== 'world') out.push(['dwl', v.dwl]);
      return out;
    }
    function draw(){
      var pol = cur(), spec = S.spec(MKT, pol), v = S.values(MKT, pol), part = S.partition(spec), A = G.areas(spec);
      var focusCells = null, focusCls = st.focus;
      if(st.focus){
        var reg = st.focus === 'rev' ? revRegion(st.t) : st.focus;
        focusCells = A.regions[reg] || [];
      }
      var outline = st.t === 'subsidy' ? (A.regions['subsidy-cost'] || []) : null;
      var label = 'Market for iced tea. ' + G.describe(spec, {}) + ' ' + caption(v);
      var svg = G.svg(spec, { letters: true }, { label: label });
      gEl.innerHTML = paintCells(svg, part, focusCells, focusCls, outline);
      gEl.classList.toggle('sl-noletters', !st.letters);
      var chips = chipsFor(st.t, v);
      vals.innerHTML = chips.map(function(c){
        var name = c[0] === 'rev' ? revName(st.t) : AREA[c[0]], on = st.focus === c[0];
        return '<button type="button" class="sl-val sl-v-' + c[0] + (on ? ' is-on' : '') + (st.focus && !on ? ' is-dim' : '') + '" data-a="' + c[0] + '" aria-pressed="' + on + '"><span class="sl-sw" aria-hidden="true"></span><span class="sl-vn">' + esc(name) + '</span><b class="sl-vv">' + money(c[1]) + '</b></button>';
      }).join('') + '<p class="sl-ts"><span>Total surplus</span> <b>' + money(v.ts) + '</b>' + (st.t !== 'none' ? ' <span class="sl-was">(' + money(v.ts0) + ' with no policy)</span>' : '') + '</p>';
      [].slice.call(host.querySelectorAll('.sl-pol')).concat(LS ? [].slice.call(LS.root.querySelectorAll('.sl-pol')) : []).forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-p') === st.t)); b.classList.toggle('on', b.getAttribute('data-p') === st.t); });
      return v;
    }
    function caption(v){
      var t = v.type;
      if(t === 'none') return 'No policy: 50 bottles sell at $10. Consumer and producer surplus are ' + money(v.cs) + ' each; total surplus is as large as it can be.';
      if(t === 'ceiling') return 'Ceiling at ' + money(v.at) + ': buyers want ' + units(v.qd) + ', sellers offer ' + units(v.qs) + ', a shortage of ' + units(v.shortage) + '. Deadweight loss ' + money(v.dwl) + '.';
      if(t === 'floor') return 'Floor at ' + money(v.at) + ': sellers offer ' + units(v.qs) + ', buyers want ' + units(v.qd) + ', a surplus of ' + units(v.surplusQty) + '. Deadweight loss ' + money(v.dwl) + '.';
      if(t === 'tax') return 'Tax of ' + money(v.amount) + ': buyers pay ' + money(v.pb) + ', sellers keep ' + money(v.psell) + ', ' + units(v.q) + ' sold. Revenue ' + money(v.rev) + ', deadweight loss ' + money(v.dwl) + '.';
      if(t === 'subsidy') return 'Subsidy of ' + money(v.amount) + ': buyers pay ' + money(v.pb) + ', sellers get ' + money(v.psell) + ', ' + units(v.q) + ' sold. It costs ' + money(v.rev) + '; deadweight loss ' + money(v.dwl) + '.';
      if(t === 'world') return 'World price ' + money(v.at) + ': ' + (v.imports != null ? 'imports of ' + units(v.imports) : 'exports of ' + units(v.exports)) + '. Total surplus rises by ' + money(v.gain) + ', the gain from trade.';
      return 'Tariff of ' + money(v.amount) + ': the price rises to ' + money(v.pt) + ', imports fall from ' + units(v.imports1) + ' to ' + units(v.imports) + '. Revenue ' + money(v.rev) + ', deadweight loss ' + money(v.dwl) + '.';
    }
    function words(){
      var v = S.values(MKT, cur()), t = v.type, body = [], head = caption(v);
      if(t === 'none'){ body.push('Consumer surplus is the area under demand and above the price: what buyers would have paid, minus what they pay.'); body.push('Producer surplus is the area above supply and below the price: what sellers receive, minus the least they would accept.'); body.push('At the equilibrium every bottle worth more to a buyer than it costs to make is sold, so total surplus is as large as it can be.'); }
      if(t === 'ceiling'){ body.push('A ceiling below the equilibrium price binds: the price cannot rise to clear the market, so quantity demanded is greater than quantity supplied.'); body.push('Only ' + units(v.q) + ' bottles are traded (the smaller quantity). Buyers who still get one gain the rectangle between ' + money(10) + ' and ' + money(v.at) + ' from sellers.'); body.push('The deadweight loss is the triangle of the ' + units(50 - v.q) + ' bottles worth more to buyers than they cost, that are no longer sold.'); }
      if(t === 'floor'){ body.push('A floor above the equilibrium price binds: quantity supplied is greater than quantity demanded.'); body.push('Only ' + units(v.q) + ' bottles are bought. Sellers who still sell gain the rectangle between ' + money(v.at) + ' and ' + money(10) + ' from buyers.'); body.push('The deadweight loss is the triangle of trades that no longer happen.'); }
      if(t === 'tax'){ body.push('A per-unit tax on sellers shifts supply up by the tax: S₂ is ' + money(v.amount) + ' above S₁ at every quantity.'); body.push('Tax revenue is the rectangle between the price buyers pay and the price sellers keep, over the ' + units(v.q) + ' bottles still sold, not the 50 sold before.'); body.push('The deadweight loss is the triangle between demand and supply from ' + units(v.q) + ' to 50 bottles.'); body.push('Here the curves are equally steep, so buyers and sellers each bear ' + money(v.buyers) + ' of the tax. Details shows how the split follows elasticity.'); }
      if(t === 'subsidy'){ body.push('A per-unit subsidy to sellers shifts supply down by the subsidy.'); body.push('Its cost is the whole rectangle between the price sellers get and the price buyers pay, out to the new, larger quantity (' + units(v.q) + '): the outlined area.'); body.push('Most of the cost becomes surplus for buyers and sellers. The triangle past 50 bottles is the deadweight loss: those bottles cost more to make than buyers value them.'); }
      if(t === 'world'){ body.push(v.imports != null ? 'A world price below the domestic price: buyers want ' + units(v.qd) + ', domestic sellers offer ' + units(v.qs) + ', and imports fill the gap.' : 'A world price above the domestic price: domestic sellers offer ' + units(v.qs) + ', buyers here want ' + units(v.qd) + ', and the rest is exported.'); body.push(v.imports != null ? 'Consumers gain more than domestic producers lose: the difference is the gain from trade, the triangle above the world price.' : 'Producers gain more than domestic consumers lose: the difference is the gain from trade.'); }
      if(t === 'tariff'){ body.push('A tariff raises the domestic price from the world price to the world price plus the tariff.'); body.push('Domestic sellers offer more, buyers want less, so imports shrink to ' + units(v.imports) + '. Tariff revenue is the tariff times those imports.'); body.push('Two deadweight loss triangles: on the left, bottles now made at home at a cost above the world price; on the right, purchases buyers give up.'); }
      T.explain(host.querySelector('.sl-say') || (LS && LS.root.querySelector('.sl-say')), head, '<ol class="ls-steps">' + body.map(function(b){ return '<li><span>' + b + '</span></li>'; }).join('') + '</ol>');
      nums(v);
      if(LS){ LS.caption(esc(head), 'explore'); if(sp) sp.open(); }
      say(head);
    }
    function nums(v){
      var t = v.type, rows = [['Consumer surplus', v.cs0, v.cs], ['Producer surplus', v.ps0, v.ps]];
      if(t === 'tax' || t === 'tariff') rows.push([revName(t), 0, v.rev]);
      if(t === 'subsidy') rows.push(['Subsidy cost (subtracted)', 0, -v.rev]);
      rows.push(['Total surplus', v.ts0, v.ts]);
      if(t !== 'none' && t !== 'world') rows.push(['Deadweight loss', 0, v.dwl]);
      var how = [];
      if(t === 'none') how.push('CS = ½ × 50 × ($20 − $10) = ' + money(v.cs) + '; PS = ½ × 50 × ($10 − $0) = ' + money(v.ps) + '.');
      if(t === 'ceiling' || t === 'floor') how.push('DWL = ½ × (50 − ' + units(v.q) + ') × ' + money(t === 'ceiling' ? v.pdem - v.at : v.at - v.psup) + ' = ' + money(v.dwl) + '.');
      if(t === 'tax') how.push('Revenue = ' + money(v.amount) + ' × ' + units(v.q) + ' = ' + money(v.rev) + '. DWL = ½ × (50 − ' + units(v.q) + ') × ' + money(v.amount) + ' = ' + money(v.dwl) + '.');
      if(t === 'subsidy') how.push('Cost = ' + money(v.amount) + ' × ' + units(v.q) + ' = ' + money(v.rev) + '. DWL = ½ × (' + units(v.q) + ' − 50) × ' + money(v.amount) + ' = ' + money(v.dwl) + '.');
      if(t === 'world') how.push('Gain = ½ × ' + units(v.imports != null ? v.imports : v.exports) + ' × ' + money(Math.abs(10 - v.at)) + ' = ' + money(v.gain) + '.');
      if(t === 'tariff') how.push('Revenue = ' + money(v.amount) + ' × ' + units(v.imports) + ' = ' + money(v.rev) + '. DWL = ½ × ' + units(v.qs2 - v.qs1) + ' × ' + money(v.amount) + ' + ½ × ' + units(v.qd1 - v.qd2) + ' × ' + money(v.amount) + ' = ' + money(v.dwl) + '.');
      var el = host.querySelector('.sl-nums') || (LS && LS.root.querySelector('.sl-nums'));
      el.innerHTML = '<h3 class="ls-title-l">The areas in dollars</h3><table class="ls-tbl sl-ntbl"><thead><tr><th scope="col">Area</th><th scope="col">No policy</th><th scope="col">Now</th></tr></thead><tbody>' +
        rows.map(function(r){ return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + money(r[1]) + '</td><td>' + money(r[2]) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<p class="bt-small">' + how.join(' ') + '</p>';
    }

    /* -------- who pays a tax: incidence by elasticity (a linear market of its own) */
    var IC = { less: { b: 1, d: 3, text: 'less elastic than supply' }, same: { b: 2, d: 2, text: 'as elastic as supply' }, more: { b: 3, d: 1, text: 'more elastic than supply' } };
    var inc = 'less';
    function incDraw(){
      var o = IC[inc], q0 = 80, p0 = 10, mk = { a: q0 + o.b * p0, b: o.b, c: q0 - o.d * p0, d: o.d, t: 4 }, I = S.incidence(mk);
      var el = host.querySelector('.sl-inc') || (LS && LS.root.querySelector('.sl-inc'));
      var bw = Math.round(I.buyerShare);
      el.innerHTML = '<h3 class="ls-title-l">Who pays a tax</h3><p class="bt-small">A $4 tax on sellers in a market of its own (Q<sub>d</sub> = ' + mk.a + ' − ' + (o.b === 1 ? '' : o.b) + 'P, Q<sub>s</sub> = ' + (mk.c < 0 ? '−' + (-mk.c) : mk.c) + ' + ' + (o.d === 1 ? '' : o.d) + 'P, $10 before the tax). The less elastic side bears more.</p>' +
        '<div class="sl-incpick" role="group" aria-label="Demand is">' + Object.keys(IC).map(function(k){ return '<button type="button" class="tchip sl-ic' + (k === inc ? ' on' : '') + '" data-k="' + k + '" aria-pressed="' + (k === inc) + '">Demand ' + IC[k].text + '</button>'; }).join('') + '</div>' +
        '<div class="sl-split" role="img" aria-label="Buyers pay ' + money(I.buyers) + ' and sellers ' + money(I.sellers) + ' of the $4 tax"><span class="sl-sb" style="width:' + bw + '%"><span>Buyers ' + money(I.buyers) + '</span></span><span class="sl-ss" style="width:' + (100 - bw) + '%"><span>Sellers ' + money(I.sellers) + '</span></span></div>' +
        '<p class="bt-small">Buyers pay ' + money(I.pb) + ' instead of $10 and sellers keep ' + money(I.ps) + '. At $10, |Ed| = ' + M.fmt(I.ed, 3) + ' and Es = ' + M.fmt(I.es, 3) + '.</p>';
    }
    host.addEventListener('click', function(e){
      var ic = e.target.closest('.sl-ic'); if(ic){ inc = ic.getAttribute('data-k'); incDraw(); var nb = (LS ? LS.root : host).querySelector('.sl-ic[data-k="' + inc + '"]'); if(nb) nb.focus(); }
    });

    /* -------- events */
    function pick(t){
      if(t === st.t) return;
      cue.done(); stop();
      st.t = t; st.focus = null; buildSlider();
      var P = POL[t];
      if(!P.set || reduced() || !window.requestAnimationFrame){ st.shown = null; draw(); words(); return; }
      // grow the policy in from where it has no effect
      var to = st.v[t], from = P.from, t0 = null;
      st.anim = { id: 0 };
      var step = function(ts){
        if(!st.anim) return;
        if(t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / 550), x = from + (to - from) * ease(k);
        // a world price never sits on the domestic one
        if(t === 'world' && Math.abs(x - 10) < 0.6) x = 10 + (to < 10 ? -0.6 : 0.6);
        if(t === 'ceiling') x = Math.min(x, 9.4); if(t === 'floor') x = Math.max(x, 10.6);
        st.shown = k < 1 ? x : null; draw();
        if(k < 1) st.anim.id = requestAnimationFrame(step); else { st.anim = null; words(); }
      };
      st.anim.id = requestAnimationFrame(step);
      words();
    }
    function stop(){ if(st.anim){ try{ cancelAnimationFrame(st.anim.id); }catch(e){} st.anim = null; st.shown = null; } }
    function focusArea(a){ cue.done(); st.focus = st.focus === a ? null : a; draw(); var b = vals.querySelector('[data-a="' + a + '"]'); if(b) b.focus(); say(st.focus ? (b ? b.textContent : '') + ' shown alone.' : 'All areas shown.'); }
    host.querySelector('.sl-pols').addEventListener('click', function(e){ var b = e.target.closest('.sl-pol'); if(b) pick(b.getAttribute('data-p')); });
    vals.addEventListener('click', function(e){ var b = e.target.closest('.sl-val'); if(b) focusArea(b.getAttribute('data-a')); });
    gEl.addEventListener('click', function(e){
      var c = e.target.closest('[data-cell]'); if(!c) return;
      var m = /sl-r-(\w+)/.exec(c.getAttribute('class') || ''), a = m && m[1];
      if(st.focus) { st.focus = null; draw(); return; }
      if(a && a !== 'none') focusArea(a);
    });
    host.querySelector('#sl-let').addEventListener('change', function(e){ st.letters = e.target.checked; draw(); if(sp) sp.setup(st.letters ? 'Areas lettered' : 'Areas unlettered'); });

    function studio(pane, s){
      LS = s;
      sp = T.studioPane(pane, s, { stage: [fig], dock: [host.querySelector('.sl-ctl')], setup: 'Options', moreLabel: 'Letters and the market', why: [host.querySelector('.sl-say')], details: [host.querySelector('.sl-nums'), host.querySelector('.sl-inc')] });
      sp.setup('Areas unlettered');
      draw(); words(); incDraw();
      // The policy row has moved into the studio's dock by now: find it there.
      var pols = (s.root && s.root.querySelector('.sl-pols')) || host.querySelector('.sl-pols') || pane.querySelector('.sl-pols');
      if(s.mode() === 'explore' && pols) T.hintSlot(s, pols, 'Start here: pick a policy', { before: pols });
    }
    buildSlider(); draw(); words(); incDraw();
    return { studio: studio, stop: stop };
  }

  /* ------------------------------------------------------ test yourself */
  function legendHtml(rows){
    return '<dl class="sl-leg" aria-label="Values on the graph (prices in dollars, quantities in units)">' + rows.map(function(r){ return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';
  }
  function quiz(host, data){
    T.drill(host, data, { slug: 'surplus-lab', noun: 'drill',
      generate: function(r, ctx, type){ return S.generate(r, ctx, type); },
      types: [{ value: 'surplus', label: 'Surplus at equilibrium' }, { value: 'control', label: 'Price ceilings and floors' }, { value: 'tax', label: 'Taxes' }, { value: 'incidence', label: 'Who pays a tax' },
        { value: 'subsidy', label: 'Subsidies' }, { value: 'trade', label: 'Free trade' }, { value: 'tariff', label: 'Tariffs' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { surplus: 'Surplus at equilibrium', control: 'A price control', tax: 'A per-unit tax', incidence: 'Who pays a tax', subsidy: 'A per-unit subsidy', trade: 'Free trade', tariff: 'A tariff' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){
        api.gbox = null;
        var f = document.createElement('figure');
        f.className = 'cd-fig sl-qfig';
        el.appendChild(f);
        if(p.table){ f.innerHTML = T.wrapTables(p.table); return; }
        if(!p.figure) return;
        // The graph sits straight in the figure (the shared stage styles size
        // a .cd-fig > .mic-graph), the legend under it.
        var g = document.createElement('div');
        // the same structure a mounted graph has, so the stage sizes it the same way
        g.className = 'mic-graph sl-qgraph';
        g.innerHTML = '<div class="mic-gr-stage">' + G.svg(Object.assign({}, p.figure.spec, { do: ['shade'] }), { letters: true }, { label: p.figure.alt }) + '</div>';
        f.appendChild(g);
        f.insertAdjacentHTML('beforeend', legendHtml(p.figure.legend));
        api.gbox = g; api.fig = f;
      },
      // Each shade step gets a fresh graph in the figure, so the shading of
      // one step never carries into the next.
      graphHost: function(s, api){
        if(!api.gbox) return null;
        var d = document.createElement('div');
        api.fig.replaceChild(d, api.gbox);
        api.gbox = d;
        return d;
      }
    });
  }
})();
