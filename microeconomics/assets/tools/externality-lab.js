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
   benefit per unit and reopens on the other side past it. The engine shades
   the deadweight loss left on the picture itself (areas() follows the shown
   policy shift) and labels the shifted curve with showLabel ("S + tax").
   Explore, public goods: a street with the lights that get built; three
   residents' marginal benefits stacked upright into the marginal social
   benefit (steps), against the MC line; together vs each alone (each
   person's own steps beside the summed ones: the free rider).

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
      '<div class="xl-fig"><p class="xl-story"></p><div class="xl-g"><div class="xl-pic"></div></div><div class="xl-pg"></div><ul class="xl-read"></ul></div>' +
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
      if(view === 'pub'){ var t = XL.publicTable(XL.PEOPLE, mc); return alone ? 'Each alone: Ana buys ' + t.alone[0] + ', Ben ' + t.alone[1] + ', Cy ' + t.alone[2] + ' streetlights. Together they would want ' + t.efficient + '.' : (t.efficient ? 'Efficient: ' + t.efficient + ' streetlight' + (t.efficient === 1 ? '' : 's') + ', the last one whose summed benefit covers its ' + money(mc) + ' cost.' : 'Efficient: none. Even the first streetlight’s summed benefit is below its ' + money(mc) + ' cost.'); }
      var s = XL.state(type, gap, pol), k = K();
      var q = function(x){ return M.fmt(x * QK, 3); };
      if(Math.abs(s.market - s.efficient) < 1e-9) return polName() + ' of ' + money(pol * PK) + ' equals the external ' + (k.cost ? 'cost' : 'benefit') + ': the market makes the efficient ' + q(s.efficient) + ' ' + EX[type].unit + '. No deadweight loss.';
      return 'Market ' + q(s.market) + ', efficient ' + q(s.efficient) + ' ' + EX[type].unit + ': the market makes too ' + (s.market > s.efficient ? 'much' : 'little') + '. Deadweight loss ' + money(s.dwl * QK * PK) + ' thousand.';
    }
    function graphs(){
      var A = XL.specA(type, gap, pol), B = XL.specB(type, gap, pol), st = XL.state(type, gap, pol);
      A.pointLabel = 'E*';   // shown beside E2 too: the engine keeps point labels clear of each other (integration 12)
      var eff = G.named(A, {}, 'efficient'), e1 = pol ? G.eq(A, G.fixedOffsets(A)) : null, k = K();
      // The shifted private curve is the private curve plus the policy: name it so (the engine would call it MPC2).
      var base = k.curve === 'S' ? 'S = MPC' : 'D = MPB', now = k.curve + (k.cost ? (k.curve === 'S' ? ' + tax' : ' \u2212 tax') : (k.curve === 'S' ? ' \u2212 subsidy' : ' + subsidy'));
      if(pol){ A.showLabel = {}; A.showLabel[k.curve] = now; }
      $('.xl-pic').innerHTML = G.svg(A, { point: eff, eq: e1, labelsShown: true, shade: B ? G.regionCells(B, 'dwl') : [] }, { label: 'Externality graph: ' + G.describe(A, { shifts: G.fixedOffsets(A) }) + ' ' + line() });
      void base;
      void st;
    }
    /* Public goods, drawn the way the exam draws them (tools review 2026-11-10): a
       street with the lights that get built; under it, each light's marginal
       benefits stacked upright (Ana + Ben + Cy, the summed steps are MSB) against
       the MC line, the efficient number where MSB meets MC. Each alone: every
       person's own steps against the same MC, beside the summed one, so the free
       rider is the gap between the pictures. The table is in Details. */
    var PC = ['xl-c0', 'xl-c1', 'xl-c2'];
    function narrowPub(){ var f = $('.xl-fig'); return f && f.clientWidth > 0 && f.clientWidth < 560; }
    function streetSvg(built, n, alone, t){
      var W = n ? 380 : 640, H = n ? 96 : 112, road = H - 26, lamps = 5, out = [];
      out.push('<rect class="xl-sky" x="0" y="0" width="' + W + '" height="' + road + '" rx="10"/>');
      out.push('<rect class="xl-road" x="0" y="' + road + '" width="' + W + '" height="26" rx="6"/><path class="xl-lane" d="M8 ' + (road + 13) + 'H' + (W - 8) + '"/>');
      // three houses between the lamps
      XL.PEOPLE.forEach(function(p, i){
        var cx = W * [0.155, 0.385, 0.845][i], hw = n ? 44 : 60, hh = n ? 30 : 38, y0 = road - hh;
        out.push('<g class="xl-house ' + PC[i] + '"><path d="M' + (cx - hw / 2) + ' ' + road + 'V' + y0 + 'L' + cx + ' ' + (y0 - hh * 0.55) + 'L' + (cx + hw / 2) + ' ' + y0 + 'V' + road + 'Z"/><rect class="xl-door" x="' + (cx - 5) + '" y="' + (road - 14) + '" width="10" height="14"/>' +
          '<text x="' + cx + '" y="' + (y0 - hh * 0.55 - 6) + '" text-anchor="middle">' + esc(p.name) + (alone ? (n ? ': ' : ' buys ') + t.alone[i] : '') + '</text></g>');
      });
      // a tree in the gap with no house
      var tx = W * 0.615, th = n ? 30 : 38;
      out.push('<g class="xl-tree"><path class="xl-trunk" d="M' + tx + ' ' + road + 'v-' + (th * 0.45) + '"/><circle cx="' + tx + '" cy="' + (road - th * 0.7) + '" r="' + (th * 0.36) + '"/></g>');
      for(var k = 0; k < lamps; k++){
        var x = W * (0.04 + k * 0.23), on = k < built, top = n ? 18 : 22;
        if(on) out.push('<path class="xl-glow" d="M' + (x - 2) + ' ' + (top + 6) + 'L' + (x - 26) + ' ' + (road + 22) + 'H' + (x + 26) + 'Z"/>');
        out.push('<g class="xl-lamp' + (on ? ' is-on' : '') + '"><path class="xl-pole" d="M' + x + ' ' + (road + 2) + 'V' + top + '"/><path class="xl-arm" d="M' + x + ' ' + top + 'q0 -6 8 -6"/><circle class="xl-bulb" cx="' + (x + 9) + '" cy="' + (top - 4) + '" r="' + (on ? 6 : 5) + '"/></g>');
      }
      return '<svg class="xl-street" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('The street: ' + built + ' of 5 streetlights built' + (alone ? ', when each neighbor decides alone.' : ', the efficient number.')) + '">' + out.join('') + '</svg>';
    }
    /* one panel: steps for units 1-5, stacked (people = which of the three), MC line */
    function panel(o){
      var t = o.t, X = function(u){ return o.x + u / 5 * o.w; }, Y = function(v){ return o.y + (80 - v) / 80 * o.h; }, out = [];
      for(var v = 20; v <= 80; v += 20) out.push('<path class="xl-grid" d="M' + o.x + ' ' + f1(Y(v)) + 'H' + (o.x + o.w) + '"/>');
      var tops = [];
      t.rows.forEach(function(r, ui){
        var base = 0, x0 = X(ui) + (o.small ? 2 : 4), x1 = X(ui + 1) - (o.small ? 2 : 4), keep = o.lit(r.unit);
        o.people.forEach(function(pi){
          var val = r.mbs[pi];
          out.push('<rect class="xl-step ' + PC[pi] + (keep ? '' : ' is-off') + '" x="' + f1(x0) + '" y="' + f1(Y(base + val)) + '" width="' + f1(x1 - x0) + '" height="' + f1(Y(base) - Y(base + val)) + '"/>');
          if(!o.small && Y(base) - Y(base + val) > 17) out.push('<text class="xl-sv' + (keep ? '' : ' is-off') + '" x="' + f1((x0 + x1) / 2) + '" y="' + f1((Y(base) + Y(base + val)) / 2 + 4) + '" text-anchor="middle">$' + val + '</text>');
          base += val;
        });
        tops.push(base);
        if(o.sumLabels) out.push('<text class="xl-sum' + (keep ? '' : ' is-off') + '" x="' + f1((x0 + x1) / 2) + '" y="' + f1(Y(base) - 6) + '" text-anchor="middle">$' + base + '</text>');
      });
      // the top of the steps: MB (one person) or MSB (the sum)
      var d = 'M' + o.x + ' ' + f1(Y(tops[0])); tops.forEach(function(tv, ui){ d += 'H' + f1(X(ui + 1)) + (ui < 4 ? 'V' + f1(Y(tops[ui + 1])) : ''); });
      out.push('<path class="xl-msb' + (o.people.length === 1 ? ' ' + PC[o.people[0]] : '') + '" d="' + d + '"/>');
      // MC
      out.push('<path class="xl-mcl" d="M' + o.x + ' ' + f1(Y(mc)) + 'H' + (o.x + o.w) + '"/>');
      // axes
      out.push('<path class="xl-axis" d="M' + o.x + ' ' + o.y + 'V' + (o.y + o.h) + 'H' + (o.x + o.w) + '"/>');
      for(var u = 0; u <= 5; u++) if(!o.small || u % 5 === 0 || u === o.q) out.push('<text class="xl-tick' + (u === o.q ? ' is-q' : '') + '" x="' + f1(X(u)) + '" y="' + (o.y + o.h + 15) + '" text-anchor="middle">' + u + '</text>');
      if(!o.small) for(v = 0; v <= 80; v += 20) out.push('<text class="xl-tick" x="' + (o.x - 6) + '" y="' + f1(Y(v) + 4) + '" text-anchor="end">$' + v + '</text>');
      if(o.q != null){
        out.push('<path class="xl-qline" d="M' + f1(X(o.q)) + ' ' + (o.y - 4) + 'V' + (o.y + o.h) + '"/>');
        if(o.q > 0) out.push('<circle class="xl-qdot" cx="' + f1(X(o.q)) + '" cy="' + f1(Y(mc)) + '" r="' + (o.small ? 4 : 6) + '"/>');
      }
      if(o.title) out.push('<text class="xl-ptitle ' + (o.people.length === 1 ? PC[o.people[0]] : '') + '" x="' + (o.x + o.w / 2) + '" y="' + (o.y - 10) + '" text-anchor="middle">' + o.title + '</text>');
      return out.join('');
    }
    function f1(v){ return Math.round(v * 10) / 10; }
    function pub(){
      var t = XL.publicTable(XL.PEOPLE, mc), n = narrowPub(), all = [0, 1, 2], built = alone ? Math.max.apply(null, t.alone) : t.efficient, svg;
      if(!alone){
        var W = n ? 380 : 640, H = n ? 300 : 360, L = n ? 46 : 56, R = n ? 66 : 110, T0 = 26, B = 42, pw = W - L - R, ph = H - T0 - B, Y = function(v){ return T0 + (80 - v) / 80 * ph; };
        svg = '<svg class="xl-pgraph" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Marginal benefit of each streetlight stacked: Ana, Ben and Cy. The summed steps are the marginal social benefit: ' + t.rows.map(function(r){ return money(r.sum); }).join(', ') + '. Marginal cost ' + money(mc) + ' a light. Efficient quantity ' + t.efficient + '.') + '">' +
          panel({ t: t, x: L, y: T0, w: pw, h: ph, people: all, q: t.efficient, sumLabels: true, lit: function(u){ return u <= t.efficient; } }) +
          '<text class="xl-lab is-mc" x="' + (L + pw + 6) + '" y="' + f1(Y(mc) + 4) + '">MC ' + money(mc) + '</text>' +
          '<text class="xl-lab" x="' + (L + pw + 6) + '" y="' + f1(Math.abs(Y(t.rows[4].sum) - Y(mc)) < 18 ? Y(mc) + 20 : Y(t.rows[4].sum) + 4) + '">MSB</text>' +
          '<text class="xl-axt" x="' + (L + pw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">Number of streetlights</text>' +
          '<text class="xl-axt" x="4" y="14">Benefit or cost of one more light</text>' +
          (t.efficient ? '<text class="xl-qlab" x="' + f1(L + t.efficient / 5 * pw + 6) + '" y="' + (T0 + 12) + '">Efficient: ' + t.efficient + '</text>' : '<text class="xl-qlab" x="' + (L + 8) + '" y="' + (T0 + 12) + '">Efficient: none</text>') + '</svg>';
      } else {
        var cols = n ? 2 : 4, PW2 = n ? 150 : 140, PH2 = n ? 120 : 170, gx = n ? 30 : 38, gy = 62, L2 = n ? 62 : 66, T2 = 34;
        var W2 = L2 + cols * PW2 + (cols - 1) * gx + 14, rows2 = n ? 2 : 1, H2 = T2 + rows2 * PH2 + (rows2 - 1) * gy + 30;
        var parts = [], Y2 = function(v){ return T2 + (80 - v) / 80 * PH2; };
        // the price axis of each row, with the cost of a light marked on it in MC's color
        for(var rr = 0; rr < rows2; rr++){
          var dy = rr * (PH2 + gy);
          for(var v = 0; v <= 80; v += 40) if(Math.abs(Y2(v) - Y2(mc)) > 13) parts.push('<text class="xl-tick" x="' + (L2 - 6) + '" y="' + f1(Y2(v) + dy + 4) + '" text-anchor="end">$' + v + '</text>');
          parts.push('<text class="xl-lab is-mc" x="' + (L2 - 6) + '" y="' + f1(Y2(mc) + dy + 4) + '" text-anchor="end">MC $' + mc + '</text>');
        }
        [0, 1, 2, 'sum'].forEach(function(who, i){
          var cx = L2 + (i % cols) * (PW2 + gx), cy = T2 + Math.floor(i / cols) * (PH2 + gy), sum = who === 'sum';
          var q = sum ? t.efficient : t.alone[who];
          parts.push((sum ? '<rect class="xl-sumbox" x="' + (cx - 8) + '" y="' + (cy - 30) + '" width="' + (PW2 + 16) + '" height="' + (PH2 + 52) + '" rx="10"/>' : '') +
            panel({ t: t, x: cx, y: cy, w: PW2, h: PH2, people: sum ? all : [who], q: q, small: true, title: sum ? 'Together: ' + q : esc(XL.PEOPLE[who].name) + ' alone: ' + q, lit: function(u){ return !sum || u <= q; } }));
        });
        svg = '<svg class="xl-pgraph is-alone" viewBox="0 0 ' + W2 + ' ' + H2 + '" role="img" aria-label="' + esc('Each alone: ' + XL.PEOPLE.map(function(p, i){ return p.name + ' compares only their own marginal benefit with the ' + money(mc) + ' cost and buys ' + t.alone[i]; }).join('; ') + '. Summed, the three want ' + t.efficient + '.') + '">' + parts.join('') + '</svg>';
      }
      var who = XL.PEOPLE.map(function(p, i){ return '<span class="xl-key ' + PC[i] + '">' + esc(p.name) + '</span>'; }).join('');
      $('.xl-pg').innerHTML = streetSvg(built, n, alone, t) + '<div class="xl-pgw">' + svg + '</div><p class="xl-keys">' + who + '<span class="xl-key is-mc">Cost of a light (MC)</span></p>';
      var det = $('.xl-det-pub');
      if(det) det.innerHTML = '<h3 class="ls-title-l">Marginal benefit of each streetlight</h3>' + T.wrapTables('<table class="ls-tbl xl-ptbl"><caption class="sr-only">Marginal benefits</caption><thead><tr><th scope="col">Light</th>' + XL.PEOPLE.map(function(p){ return '<th scope="col">' + esc(p.name) + '</th>'; }).join('') + '<th scope="col">Sum (MSB)</th></tr></thead><tbody>' +
          t.rows.map(function(r){ return '<tr' + (!alone && r.unit <= t.efficient ? ' class="hl"' : '') + '><th scope="row">' + r.unit + '</th>' + r.mbs.map(function(v){ return '<td>' + money(v) + '</td>'; }).join('') + '<td>' + money(r.sum) + '</td></tr>'; }).join('') + '</tbody></table>');
    }
    function redraw(){
      var fig = $('.xl-fig'); fig.setAttribute('data-view', view);
      if(view === 'ext'){ graphs(); var dp = $('.xl-det-pub'); if(dp) dp.innerHTML = ''; } else pub();
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
      $('.xl-det').innerHTML = '<div class="xl-det-pub"></div><h3 class="ls-title-l">The four externalities</h3>' + T.wrapTables('<table class="ls-tbl"><caption class="sr-only">Externalities</caption><thead><tr><th scope="col">Kind</th><th scope="col">Social curve</th><th scope="col">Market makes</th><th scope="col">Fix</th></tr></thead><tbody>' +
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
    var wasN = null;
    if(window.ResizeObserver) new ResizeObserver(function(){ var nn = narrowPub(); if(wasN !== null && nn !== wasN && view === 'pub') pub(); wasN = nn; }).observe($('.xl-fig'));
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
