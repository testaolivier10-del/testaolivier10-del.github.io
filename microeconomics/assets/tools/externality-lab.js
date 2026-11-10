/* Externality Lab page (docs/apmicro-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T4). Mounts into #app with ApMicroTools.mount; the model is
   ApMicroMath.externalityLab (assets/tools/math/externality-lab.js), the
   content data/tools/externality-lab.json. Frame: ApMicroTools.modes on the
   Tool Studio.

   Explore, externalities: the `externality` graph (ApMicroGraph.svg) for the
   chosen type, the efficient point E* marked, the deadweight loss shaded.
   The size slider moves the social curve; the corrective tax or subsidy
   slider shifts the private curve (the old one kept faded) toward it; the
   loss shrinks to nothing when the policy equals the external cost or
   benefit per unit and reopens on the other side past it. The shading is
   a second ApMicroGraph.svg of the same market (model specB) stacked under
   the picture with only its shaded cells shown, until the engine's areas()
   follows a shown shift (a request to the lead, docs/apmicro-reviews/self-t4.md).
   Explore, public goods: three residents' marginal benefits stacked into
   the marginal social benefit, against the marginal cost; together vs
   each alone (the free rider).

   Test yourself: ApMicroTools.drill over the model's generate(); graph
   steps mount ApMicroGraph on the stage figure, graded by ApMicroGrade.graph. */
(function(){
  'use strict';
  var T = window.ApMicroTools, M = window.ApMicroMath, G = window.ApMicroGraph;
  if(!T || !M || !M.externalityLab || M.externalityLab.stub || !G) return;
  var XL = M.externalityLab, esc = T.esc, money = XL.money;
  var EX = {
    'neg-prod': { short: 'Pollution', good: 'paper', unit: 'thousand tons', story: 'A paper mill dumps waste into a river: each ton costs the town downstream.' },
    'pos-cons': { short: 'Flu shots', good: 'flu shots', unit: 'thousand shots', story: 'A flu shot also protects the people around you.' },
    'pos-prod': { short: 'Bees', good: 'honey', unit: 'thousand jars', story: 'A honey farm’s bees pollinate the orchards nearby.' },
    'neg-cons': { short: 'Loud music', good: 'speaker rentals', unit: 'thousand rentals', story: 'Late-night speaker rentals keep the neighbors awake.' }
  };
  var ORDER = ['neg-prod', 'pos-cons', 'pos-prod', 'neg-cons'], QK = 10, PK = 2;

  T.mount('externality-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'externality-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var nid = T.nid('xl'), LS = null, touched = false, tip = null;
    var view = 'ext', type = 'neg-prod', gap = 2, pol = 0, mc = 40, alone = false;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem xl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Externality lab</h2>' +
      '<div class="xl-fig"><p class="xl-story"></p><div class="xl-g"><div class="xl-shade" aria-hidden="true"></div><div class="xl-pic"></div></div><div class="xl-pg"></div><ul class="xl-read"></ul></div>' +
      '<div class="xl-ctl"><div class="ls-seg xl-view" role="group" aria-label="View"><button type="button" data-v="ext" aria-pressed="true">Externalities</button><button type="button" data-v="pub" aria-pressed="false">Public goods</button></div>' +
        '<div class="xl-types ls-scroll" role="group" aria-label="Externality">' + ORDER.map(function(t){ return '<button type="button" class="ls-btn xl-type" data-x="' + t + '" aria-pressed="false">' + EX[t].short + '</button>'; }).join('') + '</div>' +
        '<div class="ls-seg xl-who" role="group" aria-label="Who decides" hidden><button type="button" data-w="0" aria-pressed="true">Together</button><button type="button" data-w="1" aria-pressed="false">Each alone</button></div>' +
        '<div class="xl-sl"></div></div>' +
      '<div class="xl-say"></div><div class="xl-det"></div><p class="sr-only xl-live"></p></section>';
    var say = T.announcer($('.xl-live'));
    var cue = T.cue('Add the corrective tax and watch the deadweight loss shrink.');
    $('.xl-ctl').insertBefore(cue.el, $('.xl-ctl').firstChild);
    var sGap = T.slider({ label: 'External cost per unit ($)', min: 2, max: 6, step: 2, value: gap * PK, decimals: 0, onInput: function(v){ act(); gap = v / PK; if(pol > gap + 1) pol = gap + 1; polRange(); redraw(); say(line()); } });
    var sPol = T.slider({ label: 'Tax on sellers ($ per unit)', min: 0, max: (gap + 1) * PK, step: PK, value: 0, decimals: 0, onInput: function(v){ act(); pol = v / PK; redraw(); say(line()); } });
    var sMc = T.slider({ label: 'Cost of each streetlight ($)', min: 20, max: 80, step: 10, value: mc, decimals: 0, onInput: function(v){ act(); mc = v; redraw(); say(line()); } });
    [sGap, sPol, sMc].forEach(function(s){ $('.xl-sl').appendChild(s.el); });
    function act(){ if(!touched){ touched = true; cue.done(); if(tip && tip.dismiss) tip.dismiss(); } }
    function polRange(){ var inp = sPol.input; inp.max = String((gap + 1) * PK); sPol.set(pol * PK); }
    function K(){ return XL.KINDS[type]; }
    function polName(){ var k = K(); return (k.cost ? 'Tax on ' : 'Subsidy to ') + (k.curve === 'S' ? 'sellers' : 'buyers'); }

    function line(){
      if(view === 'pub'){ var t = XL.publicTable(XL.PEOPLE, mc); return alone ? 'Each alone: Ana buys ' + t.alone[0] + ', Ben ' + t.alone[1] + ', Cy ' + t.alone[2] + ' streetlights. Together they would want ' + t.efficient + '.' : 'Efficient: ' + t.efficient + ' streetlights, the last one whose summed benefit covers its ' + money(mc) + ' cost.'; }
      var s = XL.state(type, gap, pol), k = K();
      var q = function(x){ return M.fmt(x * QK, 3); };
      if(Math.abs(s.market - s.efficient) < 1e-9) return polName() + ' of ' + money(pol * PK) + ' equals the external ' + (k.cost ? 'cost' : 'benefit') + ': the market makes the efficient ' + q(s.efficient) + ' ' + EX[type].unit + '. No deadweight loss.';
      return 'Market ' + q(s.market) + ', efficient ' + q(s.efficient) + ' ' + EX[type].unit + ': the market makes too ' + (s.market > s.efficient ? 'much' : 'little') + '. Deadweight loss ' + money(s.dwl * QK * PK) + ' thousand.';
    }
    function graphs(){
      var A = XL.specA(type, gap, pol), B = XL.specB(type, gap, pol), st = XL.state(type, gap, pol);
      A.pointLabel = pol ? ' ' : 'E*';
      var eff = G.named(A, {}, 'efficient'), e1 = pol ? G.eq(A, G.fixedOffsets(A)) : null, k = K();
      // The shifted private curve is the private curve plus the policy: name it so (the engine would call it MPC2).
      var base = k.curve === 'S' ? 'S = MPC' : 'D = MPB', now = k.curve + (k.cost ? (k.curve === 'S' ? ' + tax' : ' \u2212 tax') : (k.curve === 'S' ? ' \u2212 subsidy' : ' + subsidy'));
      $('.xl-pic').innerHTML = G.svg(A, { point: eff, eq: e1, labelsShown: true }, { label: 'Externality graph: ' + G.describe(A, { shifts: G.fixedOffsets(A) }) + ' ' + line() })
        .replace('>' + base + '<tspan class="mic-gr-sub" dy="3">2</tspan></text>', '>' + now + '</text>');
      $('.xl-shade').innerHTML = B ? G.svg(B, { shade: G.regionCells(B, 'dwl'), labelsShown: true }, { label: 'Deadweight loss' }) : '';
      void st;
    }
    function pub(){
      var t = XL.publicTable(XL.PEOPLE, mc), top = 80;
      var bars = t.rows.map(function(r){
        var segs = r.mbs.map(function(v, i){ return '<span class="xl-seg is-p' + i + '" style="width:' + (v / top * 100).toFixed(2) + '%" title="' + esc(XL.PEOPLE[i].name) + ' ' + money(v) + '"></span>'; }).join('');
        var on = alone ? false : r.unit <= t.efficient;
        return '<li class="xl-bar' + (on ? ' is-on' : '') + '"><span class="xl-bl">Light ' + r.unit + '</span><span class="xl-track">' + segs + '<span class="xl-mc" style="left:' + (mc / top * 100).toFixed(2) + '%"></span></span><span class="xl-bv">' + money(r.sum) + '</span></li>';
      }).join('');
      var who = XL.PEOPLE.map(function(p, i){ return '<span class="xl-key is-p' + i + '">' + esc(p.name) + (alone ? ': buys ' + t.alone[i] : '') + '</span>'; }).join('');
      $('.xl-pg').innerHTML = '<p class="xl-pcap">Marginal benefit of each streetlight, stacked: Ana + Ben + Cy = marginal social benefit. The line is the cost, ' + money(mc) + '.</p><ul class="xl-bars" aria-label="Summed marginal benefit by streetlight">' + bars + '</ul><p class="xl-keys">' + who + '<span class="xl-key is-mc">Cost per light</span></p>' +
        T.wrapTables('<table class="ls-tbl xl-ptbl"><caption class="sr-only">Marginal benefits</caption><thead><tr><th scope="col">Light</th>' + XL.PEOPLE.map(function(p){ return '<th scope="col">' + esc(p.name) + '</th>'; }).join('') + '<th scope="col">Sum (MSB)</th></tr></thead><tbody>' +
          t.rows.map(function(r){ return '<tr' + (!alone && r.unit <= t.efficient ? ' class="hl"' : '') + '><th scope="row">' + r.unit + '</th>' + r.mbs.map(function(v){ return '<td>' + money(v) + '</td>'; }).join('') + '<td>' + money(r.sum) + '</td></tr>'; }).join('') + '</tbody></table>');
    }
    function redraw(){
      var fig = $('.xl-fig'); fig.setAttribute('data-view', view);
      if(view === 'ext') graphs(); else pub();
      sync();
    }
    function sync(){
      $('.xl-view').querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === view)); });
      $('.xl-types').querySelectorAll('.xl-type').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-x') === type)); });
      $('.xl-who').querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(+b.getAttribute('data-w') === (alone ? 1 : 0))); });
      $('.xl-types').hidden = sGap.el.hidden = sPol.el.hidden = view !== 'ext';
      $('.xl-who').hidden = sMc.el.hidden = view === 'ext';
      var k = K(), st = XL.state(type, gap, pol), head = esc(line()), body, rows = [];
      sGap.el.querySelector('label').textContent = 'External ' + (k.cost ? 'cost' : 'benefit') + ' per unit ($)';
      sPol.el.querySelector('label').textContent = polName() + ' ($ per unit)';
      cue.el.querySelector('.bt-cue-t').textContent = view === 'ext' ? 'Add the corrective ' + (k.cost ? 'tax' : 'subsidy') + ' and watch the deadweight loss shrink.' : 'Switch to Each alone: who pays for the lights?';
      if(view === 'ext'){
        $('.xl-story').innerHTML = '<b>' + esc(EX[type].short) + '.</b> ' + esc(EX[type].story) + ' Each step on the graph is ' + QK + ' thousand units and ' + money(PK) + '.';
        rows.push('<li><span class="xl-rk">Market</span> ' + M.fmt(st.market * QK, 3) + '</li>', '<li><span class="xl-rk">Efficient (E*)</span> ' + M.fmt(st.efficient * QK, 3) + '</li>', '<li class="' + (st.dwl ? 'is-dwl' : 'is-zero') + '"><span class="xl-rk">Deadweight loss</span> ' + (st.dwl ? money(st.dwl * QK * PK) + 'K' : 'none') + '</li>');
        body = '<p>A <b>' + esc(k.name) + '</b>: ' + (k.curve === 'S' ? 'producing' : 'using') + ' ' + esc(EX[type].good) + ' ' + (k.cost ? 'harms' : 'helps') + ' people outside the sale, so ' + k.social + ' lies ' + (k.social === 'MSC' ? (k.cost ? 'above' : 'below') + ' supply (MPC)' : (k.cost ? 'below' : 'above') + ' demand (MPB)') + ' by ' + money(gap * PK) + ' a unit.</p>' +
          '<p>The market stops where MPB = MPC; the efficient quantity is where <b>MSB = MSC</b> (E*). The market makes too ' + (k.more ? 'much' : 'little') + '. The deadweight loss is the triangle between the social and private curves from the market quantity to the efficient one; its tip points toward E*.</p>' +
          '<p><b>The fix:</b> ' + esc(k.policy) + ' equal to the external ' + (k.cost ? 'cost' : 'benefit') + ', ' + money(gap * PK) + ' a unit (a Pigouvian ' + (k.cost ? 'tax' : 'subsidy') + '). It shifts ' + (k.curve === 'S' ? 'supply' : 'demand') + ' ' + (k.dir < 0 ? 'left' : 'right') + ' onto ' + k.social + '. Too ' + (k.cost ? 'big a tax' : 'big a subsidy') + ' overshoots and makes a new loss.</p>';
      } else {
        var t = XL.publicTable(XL.PEOPLE, mc);
        $('.xl-story').innerHTML = '<b>Public goods.</b> Three neighbors share a street. A streetlight is <b>nonrival</b> (one person’s light is everyone’s) and <b>nonexcludable</b> (no one can be kept from it).';
        rows.push('<li><span class="xl-rk">Efficient</span> ' + t.efficient + ' lights</li>', '<li><span class="xl-rk">Bought alone</span> ' + Math.max.apply(null, t.alone) + ' at most</li>');
        body = '<p>Because everyone enjoys the same light, its marginal social benefit is the <b>sum</b> of everyone’s marginal benefit (stack them). Provide lights while that sum is at least the cost: ' + t.efficient + ' here.</p>' +
          '<p>Alone, each person compares only their own benefit with the whole cost and buys ' + (Math.max.apply(null, t.alone) ? 'few' : 'none') + '; each also hopes the others pay, since no one can be kept from the light (the <b>free-rider problem</b>). So a private market underprovides public goods, and they are usually paid for with taxes.</p>';
      }
      $('.xl-read').innerHTML = rows.join('');
      T.explain($('.xl-say'), head, body);
      if(LS){ LS.caption(head, 'explore'); LS.pills(view === 'ext' ? [{ html: st.dwl ? 'DWL ' + money(st.dwl * QK * PK) + 'K' : 'No DWL', tone: st.dwl ? 'accent' : 'good' }] : [], 'left', 'explore'); }
    }
    function details(){
      $('.xl-det').innerHTML = '<h3 class="ls-title-l">The four externalities</h3>' + T.wrapTables('<table class="ls-tbl"><caption class="sr-only">Externalities</caption><thead><tr><th scope="col">Kind</th><th scope="col">Social curve</th><th scope="col">Market makes</th><th scope="col">Fix</th></tr></thead><tbody>' +
        ORDER.map(function(t){ var k = XL.KINDS[t]; return '<tr><th scope="row">' + esc(k.name) + ' (' + esc(EX[t].short.toLowerCase()) + ')</th><td>' + k.social + (k.social === 'MSC' ? (k.cost ? ' above S' : ' below S') : (k.cost ? ' below D' : ' above D')) + '</td><td>too ' + (k.more ? 'much' : 'little') + '</td><td>' + esc(k.policy) + '</td></tr>'; }).join('') + '</tbody></table>') +
        '<h3 class="ls-title-l">Goods by rivalry and excludability</h3>' + T.wrapTables('<table class="ls-tbl"><caption class="sr-only">Kinds of goods</caption><thead><tr><th scope="col"></th><th scope="col">Excludable</th><th scope="col">Nonexcludable</th></tr></thead><tbody><tr><th scope="row">Rival</th><td>Private goods: a sandwich</td><td>Common resources: fish in the ocean</td></tr><tr><th scope="row">Nonrival</th><td>Club goods: a streaming service</td><td>Public goods: national defense, a streetlight</td></tr></tbody></table>') +
        '<p class="bt-small">The deadweight loss in Explore is ½ × (market quantity − efficient quantity) × the external cost or benefit per unit left after the policy, from ApMicroCalc.</p>';
    }
    function onClick(e){
      var b;
      if((b = e.target.closest('.xl-view button'))){ act(); view = b.getAttribute('data-v'); redraw(); say(line()); return; }
      if((b = e.target.closest('.xl-type'))){ act(); type = b.getAttribute('data-x'); pol = 0; sPol.set(0); redraw(); say(line()); return; }
      if((b = e.target.closest('.xl-who button'))){ act(); alone = b.getAttribute('data-w') === '1'; redraw(); say(line()); }
    }
    host.addEventListener('click', onClick);
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.xl-fig')], dock: [$('.xl-ctl')], why: [$('.xl-say')], details: [$('.xl-det')] });
      s.root.addEventListener('click', onClick); host.removeEventListener('click', onClick);
      redraw();
      if(s.mode() === 'explore' && !touched) tip = T.hintSlot(s, sPol.el, 'Start here: add the tax', { before: sPol.el });
      try{ new MutationObserver(function(){ redraw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
    }
    details(); redraw();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  var TITLES = { quantity: 'Market vs efficient', dwl: 'The deadweight loss', fix: 'The corrective policy', public: 'Public goods' };
  function quiz(host, data){
    T.drill(host, data, { slug: 'externality-lab', noun: 'drill', studioAsk: true,
      generate: function(r, ctx, type){ return XL.generate(r, ctx, type); },
      types: [{ value: 'quantity', label: 'Market vs efficient quantity' }, { value: 'dwl', label: 'Shade and size the deadweight loss' }, { value: 'fix', label: 'The corrective tax or subsidy' }, { value: 'public', label: 'Public goods' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return TITLES[p.type] || 'Practice problem'; },
      extra: function(el, p, api){
        var ctx = data.contexts.filter(function(c){ return c.id === p.ctx; })[0] || {};
        var scale = p.given && p.given.qk ? '<p class="xl-qscale">Each step on the graph: ' + p.given.qk + ' ' + esc(ctx.unit || '') + ' and ' + money(p.given.pk) + '.</p>' : '';
        el.innerHTML = '<figure class="cd-fig xl-qfig"><div class="xl-qtext">' + p.text + '</div>' + (p.table ? '<div class="xl-qtbl">' + T.wrapTables(p.table) + '</div>' : '') + scale + '<div class="xl-qg"></div></figure>';
        api.g = el.querySelector('.xl-qg');
      },
      graphHost: function(s, api){ var f = api.g.parentNode; f.classList.add('has-graph'); return api.g; }
    });
  }
})();
