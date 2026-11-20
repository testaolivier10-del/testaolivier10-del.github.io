/* Chi-square test, tools v2 (docs/tools-v2-chi-square-brief.md; the standard: docs/tools-v2-standard.md). On the shared
   kit (assets/course/tool-kit2.js) through the course adapter ApBioTools.studioKit2. The solver and the seeded
   problem generator are ApBioProblems.solve.chi and generate.chi (bio-skill-problems.js); the choice chamber, the
   contexts and the fixed problems are data (bio/data/tools/chi-square.json).

   THE ONE IDEA: χ² adds up how far each observed count is from the count the null hypothesis expects; only when it
   is past the critical value for the test's degrees of freedom (p = 0.05) is the gap too big to blame on chance.

   EXPLORE: nothing locked or graded, no side panel. The picture is the classic AP® Biology behavior lab: a choice
   chamber on a lab bench with pill bugs in it, seen from above. Two tabs: two chambers (wet, dry: df = 1) and four
   (wet or dry, light or dark: df = 3). The null hypothesis is "no preference", so every chamber expects the same
   share of the bugs. ONE control on the picture: drag a bug into another chamber (keys: each chamber is a button;
   Enter brings one bug in, Delete sends one out). Each chamber's sign counts the bugs DRAWN in it and gives the
   expected count. Under the scene the χ² graph: a bar along the χ² axis made of one coloured piece per chamber
   ((o − e)² / e), the chance curve for this df with its 5% tail past the critical value, and dots for the chance
   runs. "Let them wander" lets every bug pick a chamber at random (the null is true): they walk there through the
   doorways, and a dot lands on the graph; about 1 run in 20 lands past the line. "40 bugs | 80 bugs"
   doubles every count (same shares, twice the χ²). Every number is read from the bugs as drawn at that frame; the
   decision waits until the bugs have stopped. Reduced motion: the new places at once with a short cross fade.
   TEST YOURSELF, one dropdown on the stage:
     "Problems" (the old Practice, unchanged in content, grading and record ids): new numbers every time or the
       worked set; the figure shows the problem's counts with the student's expected counts, df, critical value and
       χ², and the formula sheet's table of critical values.
     "Challenges" (the old Explore goals): flip the decision, double the bugs, add chambers, 20 chance runs. On the
       same picture, from the opening chamber; Explore keeps its own bugs.
   "?": this sample worked out (o, e, o − e, (o − e)² / e), what the decision means and what it does not, and the
   critical value table.
   One colour per chamber everywhere (its sign, its piece of the bar, its pill in the cause line); χ² purple; the
   critical value and the 5% tail magenta; "fail to reject" teal. Every value is also written. */
(function(){
  'use strict';
  var SLUG = 'chi-square';
  var T = window.ApBioTools, S = window.ApBioSkillStage, M = window.ApBioMath;
  if(!T || !S || !M) return;
  var F = T.F, esc = T.esc;
  var CLS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'];
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function f2(v){ return F(v, 2); }

  /* The formula sheet's table of critical values at p = 0.05 and 0.01 (behind "?", and under each problem). */
  function critRows(){
    var cols = ['p'], r5 = ['0.05'], r1_ = ['0.01'];
    for(var df = 1; df <= 8; df++){ cols.push('df = ' + df); r5.push(M.CHI_CRIT['0.05'][df].toFixed(2)); r1_.push(M.CHI_CRIT['0.01'][df].toFixed(2)); }
    return { cols: cols, rows: [r5, r1_] };
  }
  function critTable(){
    var t = critRows();
    return '<section class="bt-card" aria-labelledby="chi-crit-h"><h2 id="chi-crit-h">Critical values of χ²</h2>' + T.dataTable(t.cols, t.rows, 'From the AP® Biology formula sheet. Reject the null hypothesis when χ² is greater than the critical value for your degrees of freedom (df). This course uses p = 0.05.') + '</section>';
  }
  function critMini(df){
    var c = '';
    for(var d = 1; d <= 8; d++) c += '<td' + (d === df ? ' class="is-df"' : '') + '>' + M.CHI_CRIT['0.05'][d].toFixed(2) + '</td>';
    var c1 = '';
    for(var e = 1; e <= 8; e++) c1 += '<td>' + M.CHI_CRIT['0.01'][e].toFixed(2) + '</td>';
    var h = '';
    for(var k = 1; k <= 8; k++) h += '<th scope="col">' + k + '</th>';
    return '<div class="cs2-ctab"><table><caption>Critical values (AP® Biology formula sheet)</caption><thead><tr><th scope="col">p \\ df</th>' + h + '</tr></thead><tbody><tr><th scope="row">0.05</th>' + c + '</tr><tr><th scope="row">0.01</th>' + c1 + '</tr></tbody></table></div>';
  }

  /* ======================================================= the practice figure (Test yourself, Problems) */
  /* Small drawings of what was counted, under each category: a die face, a coin, a flower, a feeder, a candy, a
     yeast colony. Only drawn when the category's name says what it is. */
  function glyph(name, x, y){
    var n = String(name).toLowerCase(), h = '', X = function(v){ return (x + v).toFixed(1); }, Y = function(v){ return (y + v).toFixed(1); };
    var pips = { '1': [[0, 0]], '2': [[-4, -4], [4, 4]], '3': [[-4, -4], [0, 0], [4, 4]], '4': [[-4, -4], [4, -4], [-4, 4], [4, 4]], '5': [[-4, -4], [4, -4], [0, 0], [-4, 4], [4, 4]], '6': [[-4, -4.5], [4, -4.5], [-4, 0], [4, 0], [-4, 4.5], [4, 4.5]] };
    if(pips[n]){
      h = '<rect class="cs2-g-die" x="' + X(-8) + '" y="' + Y(-8) + '" width="16" height="16" rx="3.5"/>' + pips[n].map(function(p){ return '<circle class="cs2-g-pip" cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="1.7"/>'; }).join('');
    } else if(n === 'heads' || n === 'tails'){
      h = '<circle class="cs2-g-coin" cx="' + X(0) + '" cy="' + Y(0) + '" r="8"/><circle class="cs2-g-coin-in" cx="' + X(0) + '" cy="' + Y(0) + '" r="5.8"/>' +
        (n === 'heads' ? '<circle class="cs2-g-coin-m" cx="' + X(0.4) + '" cy="' + Y(-1.6) + '" r="2.3"/><path class="cs2-g-coin-m" d="M' + X(-3.6) + ' ' + Y(4) + 'Q' + X(0.4) + ' ' + Y(-0.6) + ' ' + X(4) + ' ' + Y(4) + 'Z"/>'
          : '<path class="cs2-g-coin-m" d="M' + X(0) + ' ' + Y(-4) + 'L' + X(1.2) + ' ' + Y(-1.2) + 'L' + X(4) + ' ' + Y(-1) + 'L' + X(1.8) + ' ' + Y(0.9) + 'L' + X(2.6) + ' ' + Y(3.8) + 'L' + X(0) + ' ' + Y(2.2) + 'L' + X(-2.6) + ' ' + Y(3.8) + 'L' + X(-1.8) + ' ' + Y(0.9) + 'L' + X(-4) + ' ' + Y(-1) + 'L' + X(-1.2) + ' ' + Y(-1.2) + 'Z"/>');
    } else if(n === 'poppy' || n === 'daisy' || n === 'cornflower'){
      var k = n === 'poppy' ? 4 : n === 'daisy' ? 10 : 8, pr = n === 'poppy' ? 4.6 : 3.2, pd = n === 'poppy' ? 3.4 : 5;
      for(var i = 0; i < k; i++){ var a = i / k * Math.PI * 2; h += '<ellipse class="cs2-g-' + n + '" cx="' + X(Math.cos(a) * pd) + '" cy="' + Y(Math.sin(a) * pd) + '" rx="' + (n === 'daisy' ? 3.2 : pr).toFixed(1) + '" ry="' + (n === 'poppy' ? 4.2 : 1.8) + '" transform="rotate(' + (a * 180 / Math.PI).toFixed(0) + ' ' + X(Math.cos(a) * pd) + ' ' + Y(Math.sin(a) * pd) + ')"/>'; }
      h += '<circle class="cs2-g-' + n + '-c" cx="' + X(0) + '" cy="' + Y(0) + '" r="' + (n === 'daisy' ? 2.8 : 2.2) + '"/>';
    } else if(/^(north|east|south|west)$/.test(n)){
      var rot = { north: 0, east: 90, south: 180, west: 270 }[n];
      h = '<circle class="cs2-g-feed" cx="' + X(0) + '" cy="' + Y(0) + '" r="8"/><path class="cs2-g-arrow" transform="rotate(' + rot + ' ' + X(0) + ' ' + Y(0) + ')" d="M' + X(0) + ' ' + Y(-6) + 'L' + X(3.6) + ' ' + Y(-0.5) + 'L' + X(1.2) + ' ' + Y(-0.5) + 'L' + X(1.2) + ' ' + Y(5) + 'L' + X(-1.2) + ' ' + Y(5) + 'L' + X(-1.2) + ' ' + Y(-0.5) + 'L' + X(-3.6) + ' ' + Y(-0.5) + 'Z"/>';
    } else if(n === 'colony-white' || n === 'colony-red'){
      h = '<circle class="cs2-g-agar" cx="' + X(0) + '" cy="' + Y(0) + '" r="8.5"/><circle class="cs2-g-' + n + '" cx="' + X(-1) + '" cy="' + Y(0.5) + '" r="4.6"/><circle class="cs2-g-' + n + '" cx="' + X(3.4) + '" cy="' + Y(-3) + '" r="2.2"/>';
    } else if(/^(red|orange|yellow|green|purple)$/.test(n)){
      h = '<ellipse class="cs2-g-candy cs2-g-' + n + '" cx="' + X(0) + '" cy="' + Y(0) + '" rx="8" ry="6"/><ellipse class="cs2-g-shine" cx="' + X(-2.6) + '" cy="' + Y(-2.2) + '" rx="2.6" ry="1.4"/>';
    }
    return h ? '<g class="cs2-glyph" aria-hidden="true">' + h + '</g>' : '';
  }
  /* v: { cats, obs, exp (true expected, or null), expMine (typed, or null), terms, df, crit, critMine, chi2,
     chi2Mine (each may be null), ymax, label, yeast } */
  var W = 380, L = 36, R = 10, BT = 34, BH = 150, GY = 22, MY = 240 + GY, MH = 16, CT = 262 + GY, CH = 100, H = 410 + GY;
  function draw(v){
    var p = [], n = v.cats.length, pw = W - L - R;
    var cx = function(i){ return L + pw * (i + 0.5) / n; }, bw = Math.min(46, pw / n * 0.56);
    var by = function(c){ return BT + BH - Math.min(1, c / v.ymax) * BH; };
    var step = T.niceStep(v.ymax, 4);
    for(var g = 0; g <= v.ymax + 1e-9; g += step) p.push('<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + by(g).toFixed(1) + '" y2="' + by(g).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (by(g) + 4).toFixed(1) + '" text-anchor="end">' + M.round(g, 6) + '</text>');
    p.push('<text class="sk-ph" x="' + L + '" y="' + (BT - 22) + '">Bars: observed. Outlines: expected.</text>');
    p.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (BT + BH) + '" y2="' + (BT + BH) + '"/>');
    v.cats.forEach(function(c, i){
      var x = cx(i), o = v.obs[i], top = by(o);
      p.push('<path class="sk-obs ' + CLS[i] + '" d="' + T.barPath(x - bw / 2, top, bw, BT + BH - top) + '"/>');
      var e = v.exp ? v.exp[i] : v.expMine && isFinite(v.expMine[i]) ? v.expMine[i] : null;
      if(e != null){
        var ey = by(e);
        p.push('<rect class="sk-exp' + (v.exp ? '' : ' mine') + '" x="' + (x - bw / 2 - 5).toFixed(1) + '" y="' + ey.toFixed(1) + '" width="' + (bw + 10).toFixed(1) + '" height="' + (BT + BH - ey).toFixed(1) + '"/>');
        if(Math.abs(top - ey) > 5) p.push('<line class="sk-gap" x1="' + (x + bw / 2 + 9).toFixed(1) + '" x2="' + (x + bw / 2 + 9).toFixed(1) + '" y1="' + top.toFixed(1) + '" y2="' + ey.toFixed(1) + '"/>');
      }
      var ly = top - 7, side = ly < BT - 8;
      p.push('<text class="sk-val" x="' + (side ? x - bw / 2 - 6 : x).toFixed(1) + '" y="' + (side ? top + 12 : ly).toFixed(1) + '" text-anchor="' + (side ? 'end' : 'middle') + '">' + o + '</text>');
      p.push('<text class="tick sk-cat" x="' + x.toFixed(1) + '" y="' + (BT + BH + 17) + '" text-anchor="middle">' + esc(c) + '</text>');
      p.push(glyph(v.yeast && /^(white|red)$/i.test(c) ? 'colony-' + c.toLowerCase() : c, x, BT + BH + 32));
    });
    var df = v.df, crit = v.crit != null ? v.crit : v.critMine;
    var far = Math.max(crit || 0, v.chi2Mine || 0, v.chi2 || 0);
    var xmax = T.niceMax(Math.max(df ? M.CHI_CRIT['0.05'][df] * 1.9 : 10, Math.min(far, 60) * 1.12));
    var sx = function(x){ return L + Math.min(1, Math.max(0, x / xmax)) * pw; };
    p.push('<text class="sk-ph" x="' + L + '" y="' + (MY - 8) + '">χ² = Σ (o − e)² / e</text>');
    p.push('<rect class="sk-track" x="' + L + '" y="' + MY + '" width="' + pw + '" height="' + MH + '"/>');
    if(v.terms){
      var acc = 0;
      v.terms.forEach(function(t, i){
        var x0 = sx(acc), x1 = sx(acc + t); acc += t;
        if(x1 - x0 < 0.4) return;
        p.push('<rect class="sk-seg ' + CLS[i] + '" x="' + x0.toFixed(1) + '" y="' + MY + '" width="' + (x1 - x0).toFixed(1) + '" height="' + MH + '"/>');
      });
    }
    var base = CT + CH;
    if(df){
      var pts = [], top2 = 0, NP = 160;
      for(var k = 1; k <= NP; k++){ var xx = xmax * k / NP; pts.push([xx, M.chiPdf(xx, df)]); if(df > 1 || xx >= 0.5) top2 = Math.max(top2, pts[k - 1][1]); }
      if(df === 2) top2 = Math.max(top2, 0.5);
      var cy = function(y){ return base - Math.min(1, y / (top2 * 1.08)) * CH; };
      if(crit){
        var tail = pts.filter(function(q){ return q[0] >= crit; });
        if(tail.length) p.push('<path class="sk-tail" d="M' + sx(crit).toFixed(1) + ' ' + base + ' L' + sx(crit).toFixed(1) + ' ' + cy(M.chiPdf(crit, df)).toFixed(1) + ' ' + tail.map(function(q){ return 'L' + sx(q[0]).toFixed(1) + ' ' + cy(q[1]).toFixed(1); }).join(' ') + ' L' + sx(xmax).toFixed(1) + ' ' + base + 'Z"/>');
      }
      p.push('<path class="sk-curve" d="M' + L + ' ' + (df > 2 ? base : df === 2 ? cy(0.5) : CT).toFixed(1) + ' ' + pts.map(function(q){ return 'L' + sx(q[0]).toFixed(1) + ' ' + cy(q[1]).toFixed(1); }).join(' ') + '"/>');
      p.push('<text class="sk-ph" x="' + (W - R) + '" y="' + (MY - 8) + '" text-anchor="end">curve: chance alone, df = ' + df + '</text>');
    } else {
      var fam = [1, 2, 3, 4], ctop = 0.5, cy0 = function(y){ return base - Math.min(1, y / (ctop * 1.08)) * CH; };
      fam.forEach(function(d){
        var q = [], NP2 = 120;
        for(var k2 = 1; k2 <= NP2; k2++){ var x2 = xmax * k2 / NP2; q.push(sx(x2).toFixed(1) + ' ' + cy0(M.chiPdf(x2, d)).toFixed(1)); }
        p.push('<path class="sk-curve sk-fam" d="M' + q.join(' L') + '"/>');
        if(d === 1 || d === 4) p.push('<text class="sk-ph sk-dim sk-faml" x="' + (sx(d === 1 ? 1.2 : 3.6) + 4).toFixed(1) + '" y="' + (cy0(M.chiPdf(d === 1 ? 1.2 : 3.6, d)) - 6).toFixed(1) + '">df ' + d + '</text>');
      });
      p.push('<text class="sk-ph sk-dim" x="' + (L + pw / 2) + '" y="' + (CT + 10) + '" text-anchor="middle">chance curves for df 1 to 4: type df to pick yours</text>');
    }
    p.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + base + '" y2="' + base + '"/>');
    var xs = T.niceStep(xmax, 5);
    for(var q2 = 0; q2 <= xmax + 1e-9; q2 += xs) p.push('<text class="tick" x="' + sx(q2).toFixed(1) + '" y="' + (base + 15) + '" text-anchor="middle">' + M.round(q2, 6) + '</text>');
    if(crit){
      var cX = sx(crit), right = cX > W - 120;
      p.push('<line class="sk-crit' + (v.crit == null ? ' mine' : '') + '" x1="' + cX.toFixed(1) + '" x2="' + cX.toFixed(1) + '" y1="' + (MY - 4) + '" y2="' + base + '"/>');
      p.push('<text class="sk-critl" x="' + (cX + (right ? -5 : 5)).toFixed(1) + '" y="' + (CT + 22) + '" text-anchor="' + (right ? 'end' : 'start') + '">' + (v.crit == null ? 'your ' : '') + 'critical ' + F(crit, 2) + '</text>');
      if(df){
        var tx0 = right ? cX - 60 : cX + 5, tyc = cy(M.chiPdf(Math.max(1e-6, (tx0 - L) / pw * xmax), df));
        p.push('<text class="sk-ph sk-dim" x="' + (cX + (right ? -5 : 5)).toFixed(1) + '" y="' + Math.min(base - 6, tyc - 6).toFixed(1) + '" text-anchor="' + (right ? 'end' : 'start') + '">5% tail</text>');
      }
    }
    var narrow = !!document.querySelector('.ls-root.ls-phone');
    function marker(x, cls, label, dy){
      var X = sx(x), off = x > xmax;
      p.push('<line class="sk-mark ' + cls + '" x1="' + X.toFixed(1) + '" x2="' + X.toFixed(1) + '" y1="' + (MY - 3) + '" y2="' + base + '"/>');
      p.push('<text class="sk-markl ' + cls + '" x="' + X.toFixed(1) + '" y="' + (base + (narrow ? 35 : 31) + (dy || 0)) + '" text-anchor="' + (X > W - 70 ? 'end' : X < L + 40 ? 'start' : 'middle') + '">' + label + (off ? ' →' : '') + '</text>');
    }
    if(v.chi2Mine != null && (v.chi2 == null || Math.abs(v.chi2Mine - v.chi2) > 0.005)) marker(v.chi2Mine, 'mine', 'your χ² ' + F(v.chi2Mine, 2), v.chi2 != null ? 16 : 0);
    if(v.chi2 != null) marker(v.chi2, 'real', 'χ² = ' + F(v.chi2, 2));
    return '<svg class="bio-svg sk-chi cs2-pfig" viewBox="0 0 ' + W + ' ' + (H + (v.chi2Mine != null && v.chi2 != null ? 14 : 0) + (narrow ? 4 : 0)) + '" role="img" aria-label="' + esc(v.label) + '">' + p.join('') + '</svg>';
  }
  function practiceStage(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked';
    var N = M.sum(x.obs), exp = x.props.map(function(q){ return q * N; }), res = M.chiSquare(x.obs, exp);
    var mineE = x.cats.map(function(c, i){ var e = S.num(a['exp-' + i]); return e >= 0 ? e : NaN; });
    var dfT = S.num(a.df), df = chk ? res.df : (dfT >= 1 && dfT <= 8 && dfT === Math.round(dfT) ? dfT : null);
    var cT = S.num(a.crit), xT = S.num(a.chi2);
    var v = { cats: x.cats, obs: x.obs, ymax: T.niceMax(Math.max.apply(null, x.obs.concat(exp)) * 1.2), yeast: /colon/i.test(x.text || ''),
      exp: chk ? exp : null, expMine: chk ? null : mineE, terms: chk ? res.terms : null, df: df,
      crit: chk ? res.crit : null, critMine: chk ? null : (cT > 0 && cT < 60 ? cT : null),
      chi2: chk ? res.chi2 : null, chi2Mine: xT >= 0 ? xT : null };
    v.label = 'The observed counts' + (chk ? ', the expected counts, and χ² = ' + F(res.chi2, 2) + ' against the critical value ' + F(res.crit, 2) : '') + '.';
    var cap;
    if(chk){
      var big = 0; res.terms.forEach(function(t, i){ if(t > res.terms[big]) big = i; });
      cap = 'Each coloured piece is one category’s (o − e)²/e; together they make χ² = <b>' + F(res.chi2, 2) + '</b>, and the biggest share comes from <b>' + esc(x.cats[big]) + '</b>. χ² lands ' + (res.reject ? '<b>past</b>' : '<b>short of</b>') + ' the critical value ' + F(res.crit, 2) + ', so ' + (res.reject ? 'reject' : 'fail to reject') + ' the null.' +
        (v.chi2Mine != null && Math.abs(v.chi2Mine - res.chi2) > Math.max(0.01, res.chi2 * 0.01) ? ' Your χ² is the grey marker.' : '');
    } else {
      var typed = mineE.filter(isFinite).length;
      cap = typed ? 'Your expected counts are the grey outlines; each gap between a bar and its outline adds to χ².' + (v.chi2Mine != null ? ' Your χ² is the grey marker' + (df ? ' on the curve.' : '.') : '')
        : 'These are the observed counts. Type the expected counts and they appear as outlines; type df and its χ² curve appears.';
    }
    S.redraw(host, '<div class="sk-fig">' + draw(v) + '</div><p class="sk-cap">' + cap + '</p>' + critMini(chk ? res.df : df));
  }

  /* ======================================================= Explore: the choice chamber */
  /* The pill bug, seen from above, head toward +x, 40 units long: the shadow, seven pairs of legs, the domed body
     with its plates, the head with two antennae and the two tail prongs. */
  var BUG = '<g id="cs2-bug"><ellipse class="cs2-b-sh" cx="2.5" cy="3.2" rx="19" ry="11.5"/>' +
    (function(){ var h = ''; for(var i = 0; i < 7; i++){ var x = -11 + i * 3.6; h += '<path class="cs2-b-leg" d="M' + x + ' -9.5L' + (x + 1.4) + ' -13.2M' + x + ' 9.5L' + (x + 1.4) + ' 13.2"/>'; } return h; })() +
    '<path class="cs2-b-ant" d="M17.5 -2.4C21.5 -4.2 23.5 -7.6 25.5 -9.4M17.5 2.4C21.5 4.2 23.5 7.6 25.5 9.4"/>' +
    '<path class="cs2-b-uro" d="M-17.5 -3.4L-20.8 -4.6M-17.5 3.4L-20.8 4.6"/>' +
    '<ellipse class="cs2-b-body" cx="-1" cy="0" rx="18" ry="11.2"/>' +
    (function(){ var h = ''; for(var i = 0; i < 7; i++){ var x = -13 + i * 3.7, ry = 10.6 * Math.sqrt(Math.max(0.05, 1 - Math.pow((x + 1) / 18, 2))); h += '<path class="cs2-b-plate" d="M' + x.toFixed(1) + ' ' + (-ry).toFixed(1) + 'Q' + (x + 1.6).toFixed(1) + ' 0 ' + x.toFixed(1) + ' ' + ry.toFixed(1) + '"/>'; } return h; })() +
    '<ellipse class="cs2-b-head" cx="16" cy="0" rx="4.4" ry="6.2"/><ellipse class="cs2-b-hi" cx="-2" cy="-4.4" rx="12.5" ry="3.2"/></g>';

  function boot(){
    var K = window.LevlKit2;
    T.mount(SLUG, function(app, data, ctx){
      var EX = data.explore;
      var CASES = EX.cases, NB = [EX.N, EX.N * 2];
      var St = { mode: 'explore', part: null };
      /* the model: which case, how many bugs, each case's counts (kept when the other tab is open) */
      var MD = { ci: 0, big: false, counts: CASES.map(function(c){ return c.start.slice(); }) };
      function C(){ return CASES[MD.ci]; }
      function nBugs(){ return NB[MD.big ? 1 : 0]; }
      function rng(seed){ return M.rng(seed); }
      var rnd = rng(Date.now() % 100000 + 7);

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'cs2';
      var tabs = K.tabs({ label: 'How many chambers', items: CASES.map(function(c){ return { value: c.id, label: c.tab, short: c.short }; }), value: CASES[0].id, big: true, onChange: function(v){ setCase(v, true); } });
      stage.appendChild(tabs.el);
      var head = K.head({ purpose: EX.purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'cs2-scene'; sceneBox.id = T.nid('cs2');
      sceneBox.innerHTML = '<svg class="cs2-svg cs2-under" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><defs>' +
        '<linearGradient id="cs2g-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="cs2s-b0"/><stop offset="1" class="cs2s-b1"/></linearGradient>' + BUG + '</defs><g class="cs2-static"></g></svg>' +
        '<svg class="cs2-svg cs2-bugs" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="cs2-bugg"></g></svg>' +
        '<svg class="cs2-svg cs2-over" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="cs2-lids"></g><g class="cs2-signs"></g></svg>';
      stage.appendChild(sceneBox);
      tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
      var under = sceneBox.querySelector('.cs2-under'), gStatic = under.querySelector('.cs2-static'), bugSvg = sceneBox.querySelector('.cs2-bugs'), gBugs = bugSvg.querySelector('.cs2-bugg');
      var over = sceneBox.querySelector('.cs2-over'), gLids = over.querySelector('.cs2-lids'), gSigns = over.querySelector('.cs2-signs');
      var layer = K.layer(sceneBox), G = null;
      // The bugs' own symbol: the bug layer refers to the one in the layer under it (same document).
      var hit = document.createElement('div'); hit.className = 'cs2-hit'; layer.el.appendChild(hit);
      var chBtns = [];
      /* the χ² graph */
      var graphBox = document.createElement('div'); graphBox.className = 'cs2-graph';
      graphBox.innerHTML = '<svg class="cs2-gsvg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="cs2-gstatic"></g><g class="cs2-runs"></g><g class="cs2-meter"></g><g class="cs2-gmark"></g></svg>';
      stage.appendChild(graphBox);
      var gsvg = graphBox.querySelector('svg'), gGs = gsvg.querySelector('.cs2-gstatic'), gRuns = gsvg.querySelector('.cs2-runs'), gMeter = gsvg.querySelector('.cs2-meter'), gMark = gsvg.querySelector('.cs2-gmark'), GG = null;
      var lines = document.createElement('div'); lines.className = 'cs2-lines';
      var cause = K.cause({ label: 'Why' });
      var acts = document.createElement('div'); acts.className = 'cs2-acts';
      acts.innerHTML = '<button type="button" class="tk2-btn tk2-btn-pri cs2-wander">' + esc(EX.wander) + '</button>' +
        '<span class="cs2-n" role="group" aria-label="How many bugs"><button type="button" class="cs2-nb" data-b="0" aria-pressed="true">' + NB[0] + ' bugs</button><button type="button" class="cs2-nb" data-b="1" aria-pressed="false">' + NB[1] + ' bugs</button></span>' +
        '<button type="button" class="tk2-link cs2-reset">Start over</button>';
      var bWander = acts.querySelector('.cs2-wander'), bReset = acts.querySelector('.cs2-reset'), nBtns = Array.prototype.slice.call(acts.querySelectorAll('.cs2-nb'));
      lines.appendChild(cause.el); lines.appendChild(acts);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }
      function calm(){ return K.reduced() || !window.requestAnimationFrame; }

      /* ---------------------------------------------------- the geometry (picture units = CSS px of the scene) */
      function layout(){
        var Wd = sceneBox.clientWidth, Hd = sceneBox.clientHeight;
        if(!Wd || !Hd) return null;
        var phone = Wd < 600, k = C().chambers.length;
        var pad = phone ? 10 : clamp(Wd * 0.035, 18, 48), padY = phone ? 12 : clamp(Hd * 0.06, 14, 30);
        var x0 = pad, y0 = padY, x1 = Wd - pad, y1 = Hd - padY - (phone ? 4 : 8), rim = phone ? 7 : 11, wt = phone ? 5 : 7;
        var ix0 = x0 + rim, iy0 = y0 + rim, ix1 = x1 - rim, iy1 = y1 - rim, mx = (ix0 + ix1) / 2, my = (iy0 + iy1) / 2;
        var side = k === 2 && (ix1 - ix0) > (iy1 - iy0) * 1.05, ch = [], walls = [];
        if(k === 2){
          if(side){ ch.push({ x0: ix0, y0: iy0, x1: mx - wt / 2, y1: iy1, col: 0, row: 0 }, { x0: mx + wt / 2, y0: iy0, x1: ix1, y1: iy1, col: 1, row: 0 }); walls.push({ v: true, c: mx, a: iy0, b: iy1, between: [0, 1] }); }
          else { ch.push({ x0: ix0, y0: iy0, x1: ix1, y1: my - wt / 2, col: 0, row: 0 }, { x0: ix0, y0: my + wt / 2, x1: ix1, y1: iy1, col: 0, row: 1 }); walls.push({ v: false, c: my, a: ix0, b: ix1, between: [0, 1] }); }
        } else {
          for(var r = 0; r < 2; r++) for(var c = 0; c < 2; c++) ch.push({ x0: c ? mx + wt / 2 : ix0, y0: r ? my + wt / 2 : iy0, x1: c ? ix1 : mx - wt / 2, y1: r ? iy1 : my - wt / 2, col: c, row: r });
          walls.push({ v: true, c: mx, a: iy0, b: my, between: [0, 1] }, { v: true, c: mx, a: my, b: iy1, between: [2, 3] }, { v: false, c: my, a: ix0, b: mx, between: [0, 2] }, { v: false, c: my, a: mx, b: ix1, between: [1, 3] });
        }
        // the bug's size from the room in the smallest chamber: about 46 bugs fit one chamber in a loose grid
        var area = Math.min.apply(null, ch.map(function(q){ return (q.x1 - q.x0) * (q.y1 - q.y0); }));
        var bugL = clamp(Math.sqrt(area / 30) * 0.66, phone ? 16 : 18, phone ? 26 : 34);
        var door = Math.max(bugL * 2.3, 36);
        walls.forEach(function(w){ w.d = (w.a + w.b) / 2; w.d0 = w.d - door / 2; w.d1 = w.d + door / 2; });
        return { W: Wd, H: Hd, phone: phone, k: k, side: side, x0: x0, y0: y0, x1: x1, y1: y1, rim: rim, wt: wt, ix0: ix0, iy0: iy0, ix1: ix1, iy1: iy1, mx: mx, my: my, ch: ch, walls: walls, bugL: bugL, door: door };
      }
      function chamberOf(x, y){
        if(!G) return 0;
        if(G.k === 2) return G.side ? (x < G.mx ? 0 : 1) : (y < G.my ? 0 : 1);
        return (x < G.mx ? 0 : 1) + (y < G.my ? 0 : 2);
      }
      function inTray(x, y){ return x > G.ix0 && x < G.ix1 && y > G.iy0 && y < G.iy1; }

      /* the signs: one per chamber, in its outer corner (away from the doorways) */
      var MCAN = document.createElement('canvas').getContext('2d'), mCache = {};
      function tw(t, px, wgt){ var key = t + '|' + px + '|' + wgt; if(mCache[key] == null){ MCAN.font = wgt + ' ' + px + 'px ' + (getComputedStyle(stage).getPropertyValue('--font-ui') || 'sans-serif'); mCache[key] = MCAN.measureText(t).width; } return mCache[key]; }
      function signSizes(){
        var ph = G.phone, fN = ph ? 13 : 14, fC = ph ? 20 : 24, fE = ph ? 12 : 13;
        return { fN: fN, fC: fC, fE: fE, padX: ph ? 8 : 10, h: ph ? 58 : 66 };
      }
      function signBox(i){
        var c = G.ch[i], z = signSizes(), cs = C().chambers[i], n = nBugs(), e = n / G.k;
        var w = Math.max(tw(cs.name, z.fN, 800), tw('expected ' + r1(e), z.fE, 700), tw('80', z.fC, 900) + tw(' bugs', z.fE, 700) + 4) + z.padX * 2 + 6;
        var m = G.phone ? 6 : 9, x = c.col ? c.x1 - m - w : c.x0 + m, y = (G.k === 2 && !G.side ? c.row : c.row) ? c.y1 - m - z.h : c.y0 + m;
        return { x: x, y: y, w: w, h: z.h };
      }
      /* the places a bug can sit: a loose grid in each chamber, clear of its sign, the walls and the rim */
      var slots = [];
      function makeSlots(){
        slots = G.ch.map(function(c, i){
          var sb = signBox(i), m = G.bugL * 0.62, cs = G.bugL * 1.22, out = [], rr = rng(31 + i * 17 + G.k), row = 0;
          for(var y = c.y0 + m; y <= c.y1 - m + 0.1; y += cs * 0.92, row++){
            for(var x = c.x0 + m + (row % 2 ? cs * 0.5 : 0); x <= c.x1 - m + 0.1; x += cs){
              var px = x + (rr() - 0.5) * cs * 0.3, py = y + (rr() - 0.5) * cs * 0.24;
              px = clamp(px, c.x0 + m, c.x1 - m); py = clamp(py, c.y0 + m, c.y1 - m);
              if(px > sb.x - G.bugL * 0.62 && px < sb.x + sb.w + G.bugL * 0.62 && py > sb.y - G.bugL * 0.55 && py < sb.y + sb.h + G.bugL * 0.55) continue;
              out.push({ x: px, y: py, a: rr() * 360, used: -1 });
            }
          }
          // shuffle, so a few bugs scatter over the whole chamber instead of filling it row by row
          for(var j = out.length - 1; j > 0; j--){ var q = Math.floor(rr() * (j + 1)), t = out[j]; out[j] = out[q]; out[q] = t; }
          return out;
        });
      }
      function freeSlot(ci, near){
        var list = slots[ci], best = null, bd = 1e9;
        if(!near){
          // a free place anywhere in the chamber, at random (bugs spread out instead of queueing at a door)
          var free = []; for(var f = 0; f < list.length; f++) if(list[f].used < 0) free.push(list[f]);
          if(free.length) return free[Math.floor(rnd() * free.length)];
        }
        for(var i = 0; i < list.length; i++){
          if(list[i].used > -1) continue;
          var d = Math.hypot(list[i].x - near[0], list[i].y - near[1]);
          if(d < bd){ bd = d; best = list[i]; }
        }
        if(best) return best;
        // a full chamber: a place on top of the others (bugs do pile up)
        var c = G.ch[ci], m = G.bugL * 0.6, sb = signBox(ci), px, py, tries = 0;
        do { px = c.x0 + m + rnd() * (c.x1 - c.x0 - 2 * m); py = c.y0 + m + rnd() * (c.y1 - c.y0 - 2 * m); tries++; }
        while(tries < 30 && px > sb.x - m && px < sb.x + sb.w + m && py > sb.y - m && py < sb.y + sb.h + m);
        return { x: px, y: py, a: rnd() * 360, used: -1, extra: true };
      }
      function firstSlot(ci){ var list = slots[ci]; for(var i = 0; i < list.length; i++) if(list[i].used < 0) return list[i]; return freeSlot(ci); }
      function take(slot, b){ if(slot && !slot.extra) slot.used = b.id; b.slot = slot; }
      function leave(b){ if(b.slot && !b.slot.extra && b.slot.used === b.id) b.slot.used = -1; b.slot = null; }

      /* ---------------------------------------------------- the bugs (one <use> each; only moving ones repaint) */
      var bugs = [], nextId = 0, raf = 0, moving = 0, drag = null, after = null;
      function newBug(){ var u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#cs2-bug'); u.setAttribute('class', 'cs2-bug'); gBugs.appendChild(u); return { id: nextId++, el: u, x: 0, y: 0, a: 0, s: 1, o: 1, on: true, path: null, fx: null, slot: null, k: '' }; }
      function put(b){
        var sc = G.bugL / 40 * b.s, key = r1(b.x) + ',' + r1(b.y) + ',' + Math.round(b.a) + ',' + sc.toFixed(3) + ',' + b.o.toFixed(2);
        if(key === b.k) return;
        b.k = key;
        b.el.setAttribute('transform', 'translate(' + r1(b.x) + ' ' + r1(b.y) + ') rotate(' + Math.round(b.a) + ') scale(' + sc.toFixed(3) + ')');
        b.el.setAttribute('opacity', b.o < 1 ? b.o.toFixed(2) : '1');
      }
      /* Place the bugs for these counts at once (a new layout, a mode switch). */
      function placeCounts(counts){
        stopAll();
        makeSlots();
        while(bugs.length < M.sum(counts)) bugs.push(newBug());
        while(bugs.length > M.sum(counts)){ var x = bugs.pop(); x.el.remove(); }
        var i = 0;
        counts.forEach(function(n, ci){ for(var j = 0; j < n; j++, i++){ var b = bugs[i]; b.slot = null; var s = firstSlot(ci); take(s, b); b.x = s.x; b.y = s.y; b.a = s.a; b.s = 1; b.o = 1; b.on = true; b.k = ''; put(b); } });
        paint(true);
      }
      /* The way from where a bug is to a place: through the doorway(s) between the chambers. */
      function doorOf(a, b){
        for(var i = 0; i < G.walls.length; i++){ var w = G.walls[i]; if(w.between[0] === a && w.between[1] === b || w.between[0] === b && w.between[1] === a) return w; }
        return null;
      }
      function through(w, from){
        // the two points either side of the doorway, from chamber `from`'s side first
        var o = G.bugL * 0.9, sgn = (w.v ? (G.ch[from].x0 < w.c ? -1 : 1) : (G.ch[from].y0 < w.c ? -1 : 1)), j = (rnd() - 0.5) * (w.d1 - w.d0) * 0.5;
        return w.v ? [[w.c + sgn * o, w.d + j], [w.c - sgn * o, w.d + j]] : [[w.d + j, w.c + sgn * o], [w.d + j, w.c - sgn * o]];
      }
      function route(b, to, toCi){
        var from = chamberOf(b.x, b.y), pts = [[b.x, b.y]];
        if(from !== toCi){
          var w = doorOf(from, toCi);
          if(w) pts = pts.concat(through(w, from));
          else {
            // across the corner of the four chamber tray: through one of the two chambers next to both
            var mids = [0, 1, 2, 3].filter(function(m){ return m !== from && m !== toCi && doorOf(from, m) && doorOf(m, toCi); }), mid = mids[rnd() < 0.5 ? 0 : mids.length - 1];
            pts = pts.concat(through(doorOf(from, mid), from), through(doorOf(mid, toCi), mid));
          }
        }
        pts.push([to.x, to.y]);
        return pts;
      }
      function lengthOf(pts){ var s = 0; for(var i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; }
      function walk(b, slot, ci, o){
        o = o || {};
        leave(b); take(slot, b);
        var pts = route(b, slot, ci), len = lengthOf(pts);
        if(len < 0.5){ b.a = slot.a; put(b); return; }
        b.path = { pts: pts, len: len, t0: now() + (o.delay || 0), dur: o.dur || clamp(len / (G.bugL * 9) * 1000, 260, 1500), endA: slot.a, wig: rnd() * 6 };
      }
      function advance(b, t){
        var P = b.path, u = (t - P.t0) / P.dur;
        if(u < 0) return true;
        if(u >= 1){ var e = P.pts[P.pts.length - 1]; b.x = e[0]; b.y = e[1]; b.a = P.endA; b.path = null; put(b); return false; }
        var ease = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, d = ease * P.len, i = 1;
        while(i < P.pts.length - 1 && d > Math.hypot(P.pts[i][0] - P.pts[i - 1][0], P.pts[i][1] - P.pts[i - 1][1])){ d -= Math.hypot(P.pts[i][0] - P.pts[i - 1][0], P.pts[i][1] - P.pts[i - 1][1]); i++; }
        var a = P.pts[i - 1], z = P.pts[i], sl = Math.hypot(z[0] - a[0], z[1] - a[1]) || 1, f = Math.min(1, d / sl);
        b.x = a[0] + (z[0] - a[0]) * f; b.y = a[1] + (z[1] - a[1]) * f;
        var head = Math.atan2(z[1] - a[1], z[0] - a[0]) * 180 / Math.PI + Math.sin(t / 90 + P.wig) * 7;
        if(u > 0.9){ var tt = (u - 0.9) / 0.1, dA = ((P.endA - head) % 360 + 540) % 360 - 180; head += dA * tt; }
        b.a = head; put(b);
        return true;
      }
      function fxStep(b, t){
        var X = b.fx, u = clamp((t - X.t0) / X.dur, 0, 1);
        if(t < X.t0) return true;
        if(X.kind === 'in'){ b.s = 0.4 + 0.6 * u; b.o = u; b.on = u >= 0.5; }
        else { b.s = 1 + 0.25 * u; b.o = 1 - u; b.on = u < 0.5; }
        put(b);
        if(u >= 1){ b.fx = null; if(X.kind === 'out'){ b.el.remove(); b.dead = true; } return false; }
        return true;
      }
      function loop(){
        if(raf) return;
        var step = function(){
          var t = now(), any = false;
          for(var i = 0; i < bugs.length; i++){ var b = bugs[i]; if(b.path && advance(b, t)) any = true; if(b.fx && fxStep(b, t)) any = true; }
          if(bugs.some(function(b){ return b.dead; })) bugs = bugs.filter(function(b){ return !b.dead; });
          paint();
          if(any) raf = requestAnimationFrame(step); else { raf = 0; settled(); }
        };
        raf = requestAnimationFrame(step);
      }
      function busy(){ return !!raf || bugs.some(function(b){ return b.path || b.fx; }); }
      function stopAll(){
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        bugs.forEach(function(b){ if(b.path){ var e = b.path.pts[b.path.pts.length - 1]; b.x = e[0]; b.y = e[1]; b.a = b.path.endA; b.path = null; } if(b.fx){ if(b.fx.kind === 'out'){ b.el.remove(); b.dead = true; } else { b.s = 1; b.o = 1; b.on = true; } b.fx = null; } b.k = ''; });
        bugs = bugs.filter(function(b){ return !b.dead; });
        bugs.forEach(put);
      }
      /* Run a change: the bugs move (or fade, with reduced motion), then fn runs when they have stopped. */
      function run(then){
        after = then || null;
        if(calm()){
          stopAll();
          bugSvg.classList.remove('is-fade'); void bugSvg.getBoundingClientRect(); bugSvg.classList.add('is-fade');
          paint(); settled();
          return;
        }
        paint(); loop();
      }

      /* ---------------------------------------------------- what the picture says: read from the bugs as drawn */
      function drawnCounts(){
        var c = G ? G.ch.map(function(){ return 0; }) : [];
        bugs.forEach(function(b){ if(b.on && !b.dead && G) c[chamberOf(b.x, b.y)]++; });
        return c;
      }
      function stats(counts){
        var n = M.sum(counts), k = counts.length, e = counts.map(function(){ return n / k; }), r = n ? M.chiSquare(counts, e) : { terms: counts.map(function(){ return 0; }), chi2: 0, df: k - 1, crit: M.CHI_CRIT['0.05'][k - 1], reject: false };
        r.n = n; r.e = n / k; r.counts = counts; return r;
      }
      var shownKey = '', lastR = null;
      function paint(force){
        if(!G) return;
        var c = drawnCounts(), key = c.join(',') + '|' + (busy() ? 1 : 0) + '|' + St.mode;
        if(key === shownKey && !force) return;
        shownKey = key;
        var r = stats(c); lastR = r;
        drawSigns(r); drawMeter(r); words(r);
      }
      function settled(){
        var fn = after; after = null;
        shownKey = ''; paint();
        if(fn) fn();
        refHtml();
      }

      /* ---------------------------------------------------- the static scene: bench, tray, floors, walls */
      function drawStatic(){
        var h = [], r = rng(11), i, Wd = G.W, Hd = G.H;
        h.push('<rect class="cs2-bench" x="0" y="0" width="' + Wd + '" height="' + Hd + '"/>');
        for(i = 0; i < Math.ceil(Hd / 26) + 2; i++){ var y = i * 26 + r() * 10; h.push('<path class="cs2-grain" d="M0 ' + r1(y) + 'C' + r1(Wd * 0.3) + ' ' + r1(y + (r() - 0.5) * 12) + ' ' + r1(Wd * 0.6) + ' ' + r1(y + (r() - 0.5) * 12) + ' ' + Wd + ' ' + r1(y + (r() - 0.5) * 8) + '"/>'); }
        // the tray: a shadow on the bench, the clear plastic rim, then the floors
        h.push('<rect class="cs2-tshadow" x="' + r1(G.x0 + 6) + '" y="' + r1(G.y0 + 9) + '" width="' + r1(G.x1 - G.x0) + '" height="' + r1(G.y1 - G.y0) + '" rx="' + (G.rim + 8) + '"/>');
        h.push('<rect class="cs2-rim" x="' + r1(G.x0) + '" y="' + r1(G.y0) + '" width="' + r1(G.x1 - G.x0) + '" height="' + r1(G.y1 - G.y0) + '" rx="' + (G.rim + 8) + '"/>');
        G.ch.forEach(function(c, ci){
          var wet = C().chambers[ci].wet, rr = rng(50 + ci);
          h.push('<rect class="cs2-floor ' + (wet ? 'is-wet' : 'is-dry') + '" x="' + r1(c.x0) + '" y="' + r1(c.y0) + '" width="' + r1(c.x1 - c.x0) + '" height="' + r1(c.y1 - c.y0) + '"/>');
          var area = (c.x1 - c.x0) * (c.y1 - c.y0), nT = Math.round(area / (wet ? 700 : 420));
          for(var t = 0; t < nT; t++){
            var px = c.x0 + rr() * (c.x1 - c.x0), py = c.y0 + rr() * (c.y1 - c.y0);
            if(wet){
              if(t % 9 === 0) h.push('<ellipse class="cs2-drop" cx="' + r1(px) + '" cy="' + r1(py) + '" rx="' + r1(2 + rr() * 3) + '" ry="' + r1(1.6 + rr() * 2) + '"/>');
              else h.push('<circle class="cs2-quilt" cx="' + r1(px) + '" cy="' + r1(py) + '" r="1.3"/>');
            } else h.push('<circle class="cs2-grit' + (t % 3 ? '' : ' is-d') + '" cx="' + r1(px) + '" cy="' + r1(py) + '" r="' + r1(0.7 + rr() * 1.1) + '"/>');
          }
          if(wet){ for(var q = 0; q < 2; q++){ var wy = c.y0 + (0.3 + q * 0.4) * (c.y1 - c.y0); h.push('<path class="cs2-damp" d="M' + r1(c.x0 + 6) + ' ' + r1(wy) + 'C' + r1(c.x0 + (c.x1 - c.x0) * 0.35) + ' ' + r1(wy - 14) + ' ' + r1(c.x0 + (c.x1 - c.x0) * 0.65) + ' ' + r1(wy + 14) + ' ' + r1(c.x1 - 6) + ' ' + r1(wy) + '"/>'); } }
        });
        // the dividers, each with its doorway
        G.walls.forEach(function(w){
          var t = G.wt, segs = [[w.a - (w.v ? 0 : 0), w.d0], [w.d1, w.b]];
          segs.forEach(function(s){ if(s[1] - s[0] < 1) return; h.push(w.v ? '<rect class="cs2-wall" x="' + r1(w.c - t / 2) + '" y="' + r1(s[0]) + '" width="' + t + '" height="' + r1(s[1] - s[0]) + '" rx="2"/>' : '<rect class="cs2-wall" x="' + r1(s[0]) + '" y="' + r1(w.c - t / 2) + '" width="' + r1(s[1] - s[0]) + '" height="' + t + '" rx="2"/>'); });
        });
        h.push('<rect class="cs2-rim-hi" x="' + r1(G.x0 + 3) + '" y="' + r1(G.y0 + 3) + '" width="' + r1(G.x1 - G.x0 - 6) + '" height="' + r1(G.y1 - G.y0 - 6) + '" rx="' + (G.rim + 6) + '"/>');
        under.setAttribute('viewBox', '0 0 ' + Wd + ' ' + Hd);
        gStatic.innerHTML = h.join('');
        // the dark chambers: a card laid over them (still see-through enough to count the bugs)
        var lh = [];
        G.ch.forEach(function(c, ci){ if(C().chambers[ci].dark) lh.push('<rect class="cs2-lid" x="' + r1(c.x0) + '" y="' + r1(c.y0) + '" width="' + r1(c.x1 - c.x0) + '" height="' + r1(c.y1 - c.y0) + '"/>'); });
        gLids.innerHTML = lh.join('');
      }
      /* each chamber's sign: its name, the bugs drawn in it, the count the null expects */
      var signEls = [];
      function buildSigns(){
        var z = signSizes(), h = '';
        G.ch.forEach(function(c, ci){
          var b = signBox(ci), cs = C().chambers[ci];
          h += '<g class="cs2-sign is-' + cs.role + '" data-ci="' + ci + '"><rect class="cs2-sign-bg" x="' + r1(b.x) + '" y="' + r1(b.y) + '" width="' + r1(b.w) + '" height="' + b.h + '" rx="9"/>' +
            '<rect class="cs2-sign-tab" x="' + r1(b.x) + '" y="' + r1(b.y) + '" width="5" height="' + b.h + '" rx="2.5"/>' +
            '<text class="cs2-sign-n" x="' + r1(b.x + z.padX + 3) + '" y="' + r1(b.y + z.fN + 3) + '" font-size="' + z.fN + '">' + esc(cs.name) + '</text>' +
            '<text class="cs2-sign-c" x="' + r1(b.x + z.padX + 3) + '" y="' + r1(b.y + z.fN + z.fC + 4) + '" font-size="' + z.fC + '"><tspan class="cs2-sign-cv"></tspan><tspan class="cs2-sign-cu" font-size="' + z.fE + '" dx="3"> bugs</tspan></text>' +
            '<text class="cs2-sign-e" x="' + r1(b.x + z.padX + 3) + '" y="' + r1(b.y + b.h - 7) + '" font-size="' + z.fE + '"></text></g>';
        });
        over.setAttribute('viewBox', '0 0 ' + G.W + ' ' + G.H);
        gSigns.innerHTML = h;
        signEls = Array.prototype.slice.call(gSigns.querySelectorAll('.cs2-sign')).map(function(g){ return { cv: g.querySelector('.cs2-sign-cv'), e: g.querySelector('.cs2-sign-e'), g: g }; });
      }
      function drawSigns(r){
        signEls.forEach(function(s, i){
          var t = String(r.counts[i]); if(s.cv.textContent !== t) s.cv.textContent = t;
          var e = 'expected ' + F(r.e, r.e % 1 ? 1 : 0); if(s.e.textContent !== e) s.e.textContent = e;
        });
      }
      /* the keyboard: each chamber is a button over its floor (the pointer is read from the bugs as drawn) */
      function buildBtns(){
        chBtns.forEach(function(b){ b.remove(); });
        chBtns = G.ch.map(function(c, ci){
          var b = document.createElement('button'); b.type = 'button'; b.className = 'cs2-chb'; b.setAttribute('data-ci', ci);
          b.style.left = c.x0 + 'px'; b.style.top = c.y0 + 'px'; b.style.width = (c.x1 - c.x0) + 'px'; b.style.height = (c.y1 - c.y0) + 'px';
          layer.el.appendChild(b); return b;
        });
        hit.style.left = G.ix0 + 'px'; hit.style.top = G.iy0 + 'px'; hit.style.width = (G.ix1 - G.ix0) + 'px'; hit.style.height = (G.iy1 - G.iy0) + 'px';
        labelBtns();
      }
      function labelBtns(){
        if(!lastR) return;
        chBtns.forEach(function(b, i){ b.setAttribute('aria-label', C().chambers[i].name + ': ' + lastR.counts[i] + ' bugs, expected ' + F(lastR.e, 1) + '. Enter moves a bug in, Delete moves one out.'); });
      }

      /* ---------------------------------------------------- the χ² graph */
      function gLayout(){
        var Wd = graphBox.clientWidth, Hd = graphBox.clientHeight;
        if(!Wd || !Hd) return null;
        var ph = Wd < 600, df = C().chambers.length - 1, xmax = df === 1 ? 10 : 18;
        var L0 = ph ? 14 : 22, R0 = ph ? 14 : 22, top = ph ? 62 : 62, base = Hd - (ph ? 50 : 48);
        return { W: Wd, H: Hd, ph: ph, df: df, xmax: xmax, L: L0, R: Wd - R0, top: top, base: base, mT: base + 6, mH: ph ? 13 : 14, fs: ph ? 13 : 13.5 };
      }
      function gx(v){ return GG.L + clamp(v / GG.xmax, 0, 1) * (GG.R - GG.L); }
      var curveTop = 0;
      function cyv(y){ return GG.base - Math.min(1, y / curveTop) * (GG.base - GG.top); }
      function drawGraph(){
        var h = [], df = GG.df, crit = M.CHI_CRIT['0.05'][df], NP = 140, pts = [], i;
        curveTop = 0;
        for(i = 1; i <= NP; i++){ var x = GG.xmax * i / NP, y = M.chiPdf(x, df); pts.push([x, y]); if(df > 1 || x >= 0.6) curveTop = Math.max(curveTop, y); }
        curveTop *= 1.05;
        h.push('<defs><linearGradient id="cs2g-chance" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="cs2s-c0"/><stop offset="1" class="cs2s-c1"/></linearGradient></defs><rect class="cs2-paper" x="0" y="0" width="' + GG.W + '" height="' + GG.H + '" rx="14"/>');
        var area = 'M' + gx(0) + ' ' + GG.base + (df === 1 ? ' L' + gx(0) + ' ' + GG.top : '') + ' ' + pts.map(function(q){ return 'L' + r1(gx(q[0])) + ' ' + r1(cyv(q[1])); }).join(' ') + ' L' + r1(gx(GG.xmax)) + ' ' + GG.base + 'Z';
        h.push('<path class="cs2-chance" d="' + area + '"/>');
        var tail = pts.filter(function(q){ return q[0] >= crit; });
        h.push('<path class="cs2-tail" d="M' + r1(gx(crit)) + ' ' + GG.base + ' L' + r1(gx(crit)) + ' ' + r1(cyv(M.chiPdf(crit, df))) + ' ' + tail.map(function(q){ return 'L' + r1(gx(q[0])) + ' ' + r1(cyv(q[1])); }).join(' ') + ' L' + r1(gx(GG.xmax)) + ' ' + GG.base + 'Z"/>');
        // df 1: the density rises without limit at 0, so the curve comes in from the top edge
        var cpts = df === 1 ? pts.filter(function(q){ return q[1] <= curveTop; }) : pts;
        h.push('<path class="cs2-curve" d="M' + (df === 1 ? r1(gx(cpts[0][0])) + ' ' + GG.top : r1(gx(0)) + ' ' + GG.base) + ' ' + cpts.map(function(q){ return 'L' + r1(gx(q[0])) + ' ' + r1(cyv(q[1])); }).join(' ') + '"/>');
        h.push('<line class="cs2-axis" x1="' + GG.L + '" x2="' + GG.R + '" y1="' + GG.base + '" y2="' + GG.base + '"/>');
        h.push('<rect class="cs2-track" x="' + GG.L + '" y="' + GG.mT + '" width="' + r1(GG.R - GG.L) + '" height="' + GG.mH + '" rx="' + (GG.mH / 2) + '"/>');
        var step = df === 1 ? 2 : 4;
        for(var t = 0; t <= GG.xmax + 1e-9; t += step) h.push('<text class="cs2-tick" x="' + r1(gx(t)) + '" y="' + r1(GG.mT + GG.mH + 17) + '" text-anchor="' + (t === 0 ? 'start' : t >= GG.xmax ? 'end' : 'middle') + '" font-size="' + GG.fs + '">' + t + '</text>');
        // the critical value: a line through the curve and the bar, named at the top
        var cX = gx(crit);
        h.push('<line class="cs2-crit" x1="' + r1(cX) + '" x2="' + r1(cX) + '" y1="' + (GG.top - 4) + '" y2="' + r1(GG.mT + GG.mH + 3) + '"/>');
        var cl = 'critical value ' + F(crit, 2), clw = tw(cl, GG.fs, 800);
        h.push('<text class="cs2-critl" x="' + r1(cX + 6) + '" y="' + (GG.top + 8) + '" font-size="' + GG.fs + '">' + cl + '</text>');
        var tl = '5% tail', tlx = cX + 6, tly = Math.min(GG.base - 6, cyv(M.chiPdf(crit + (GG.xmax - crit) * 0.15, df)) - 6);
        h.push('<text class="cs2-taill" x="' + r1(tlx) + '" y="' + r1(Math.max(GG.top + 26, tly)) + '" font-size="' + (GG.fs - 1) + '">' + tl + '</text>');
        // what the curve is, in its own empty corner
        var ttl = GG.ph ? 'χ²; curve: chance alone' : 'χ²: the curve is chance alone (df ' + df + ')';
        h.push('<text class="cs2-gtitle" x="' + GG.L + '" y="' + (GG.ph ? 17 : 19) + '" font-size="' + (GG.fs + 0.5) + '">' + ttl + '</text>');
        gsvg.setAttribute('viewBox', '0 0 ' + GG.W + ' ' + GG.H);
        gGs.innerHTML = h.join('');
        GG.critX = cX; GG.critLabelR = cX + 6 + clw;
        meterEls = null; drawRuns();
      }
      /* the bar: one piece per chamber, (o − e)² / e, end to end, and the χ² it adds up to */
      var meterEls = null, tally = { n: 0, over: 0, list: [] };
      function drawMeter(r){
        if(!GG) return;
        if(!meterEls){
          gMeter.innerHTML = G.ch.map(function(c, i){ return '<rect class="cs2-seg is-' + C().chambers[i].role + '" y="' + GG.mT + '" height="' + GG.mH + '"/>'; }).join('');
          gMark.innerHTML = '<line class="cs2-mark" y1="' + (27 + GG.fs + 9) + '" y2="' + r1(GG.mT + GG.mH + 2) + '"/><g class="cs2-markl"><rect class="cs2-markbg" rx="8" height="' + (GG.fs + 9) + '"/><text class="cs2-markt" font-size="' + (GG.fs + 1) + '"></text></g><text class="cs2-tally" font-size="' + (GG.fs - 0.5) + '" text-anchor="end"></text>';
          meterEls = { segs: Array.prototype.slice.call(gMeter.querySelectorAll('.cs2-seg')), line: gMark.querySelector('.cs2-mark'), lab: gMark.querySelector('.cs2-markl'), bg: gMark.querySelector('.cs2-markbg'), t: gMark.querySelector('.cs2-markt'), tally: gMark.querySelector('.cs2-tally') };
        }
        var acc = 0;
        meterEls.segs.forEach(function(s, i){
          var x0 = gx(acc), x1 = gx(acc + r.terms[i]); acc += r.terms[i];
          s.setAttribute('x', r1(x0)); s.setAttribute('width', Math.max(0, r1(x1 - x0 - (x1 - x0 > 2 ? 1 : 0))));
        });
        var X = gx(r.chi2), off = r.chi2 > GG.xmax, txt = 'χ² = ' + f2(r.chi2) + (off ? ' →' : '');
        meterEls.line.setAttribute('x1', r1(X)); meterEls.line.setAttribute('x2', r1(X));
        meterEls.t.textContent = txt;
        var w = tw(txt, GG.fs + 1, 900) + 16, lx = clamp(X - w / 2, GG.L, GG.R - w), ly = 27;
        // the χ² pill has its own row above the curve, over the marker
        meterEls.bg.setAttribute('x', r1(lx)); meterEls.bg.setAttribute('y', r1(ly)); meterEls.bg.setAttribute('width', r1(w));
        meterEls.t.setAttribute('x', r1(lx + 8)); meterEls.t.setAttribute('y', r1(ly + GG.fs + 3));
        meterEls.lab.setAttribute('class', 'cs2-markl' + (r.chi2 > M.CHI_CRIT['0.05'][r.counts.length - 1] ? ' is-past' : ''));
        paintTally();
      }
      function paintTally(){
        if(!meterEls) return;
        var t = tally.n ? (GG.ph ? 'runs ' + tally.n + ' · past ' + tally.over : 'chance runs ' + tally.n + ' · past the line ' + tally.over) : '';
        meterEls.tally.textContent = t;
        meterEls.tally.setAttribute('x', r1(GG.R)); meterEls.tally.setAttribute('y', GG.ph ? 17 : 19);
      }
      /* each chance run is a dot over its χ²: the dots pile up into the shape of the curve */
      function drawRuns(){
        if(!GG) return;
        var bins = {}, bw = (GG.R - GG.L) / (GG.ph ? 26 : 44), rr = Math.min(4.5, bw * 0.36), h = '';
        tally.list.forEach(function(v){
          var b = Math.min(Math.floor(clamp(v, 0, GG.xmax * 0.999) / GG.xmax * (GG.R - GG.L) / bw), 999), k = bins[b] || 0; bins[b] = k + 1;
          var y = GG.base - rr - 1.5 - k * (rr * 2 + 1);
          if(y < GG.top + 30) return;
          h += '<circle class="cs2-run' + (v > M.CHI_CRIT['0.05'][GG.df] ? ' is-past' : '') + '" cx="' + r1(GG.L + (b + 0.5) * bw) + '" cy="' + r1(y) + '" r="' + r1(rr) + '"/>';
        });
        gRuns.innerHTML = h;
      }

      /* ---------------------------------------------------- the cause line and the words (from the bugs as drawn) */
      function chain(r){
        var parts = [], crit = r.crit, moving = busy() && !drag;
        if(!r.n) return { parts: [{ t: 'no bugs', role: 'ink' }], pre: '' };
        // two chambers: each gap in its chamber's colour; four: the gaps are on the signs and in the bar, the line counts them
        if(r.counts.length > 2) parts.push({ t: r.counts.length + ' gaps', role: 'ink', say: r.counts.map(function(o, i){ var d = o - r.e; return C().chambers[i].name + ' ' + (d > 0 ? F(d, 1) + ' over' : d < 0 ? F(-d, 1) + ' under' : 'on'); }).join(', ') });
        else r.counts.forEach(function(o, i){ var d = o - r.e; parts.push({ t: C().chambers[i].short + ' ' + (d > 0 ? '+' : d < 0 ? '−' : '±') + F(Math.abs(d), d % 1 ? 1 : 0), role: C().chambers[i].role, join: i ? '+' : '', say: C().chambers[i].name + ' ' + (d > 0 ? F(d, 1) + ' over' : d < 0 ? F(-d, 1) + ' under' : 'on') + ' expected' }); });
        parts.push({ t: 'χ² = ' + f2(r.chi2), role: 'chi' });
        if(!moving){
          parts.push({ t: (r.reject ? 'past ' : 'under ') + F(crit, 2), role: 'crit', say: (r.reject ? 'past the critical value ' : 'under the critical value ') + F(crit, 2) });
          parts.push({ t: r.reject ? 'reject the null' : 'fail to reject', role: r.reject ? 'rej' : 'keep', say: r.reject ? 'reject the null hypothesis' : 'fail to reject the null hypothesis' });
        }
        return { parts: parts, pre: 'vs expected:' };
      }
      var takeText = null;
      function words(r){
        var ch = chain(r);
        if(takeText && !busy()){ cause.take(takeText); }
        else cause.set(ch.parts, ch.pre);
        gsvg.setAttribute('aria-label', 'χ² = ' + f2(r.chi2) + ', critical value ' + F(r.crit, 2) + ' for df ' + r.df + (busy() ? '.' : ': ' + (r.reject ? 'reject' : 'fail to reject') + ' the null hypothesis.'));
        bugSvg.setAttribute('aria-label', 'A choice chamber with ' + r.n + ' pill bugs: ' + r.counts.map(function(o, i){ return C().chambers[i].name + ' ' + o; }).join(', ') + '. Expected ' + F(r.e, 1) + ' in each.');
        labelBtns();
      }
      function sayNow(){ if(lastR) say(cause.text() || ''); }

      /* ---------------------------------------------------- the one control: drag a bug to another chamber */
      function bugAt(x, y){
        var best = null, bd = Math.max(G.bugL * 0.85, 22);
        bugs.forEach(function(b){ if(b.dead || b.fx) return; var d = Math.hypot(b.x - x, b.y - y); if(d < bd){ bd = d; best = b; } });
        return best;
      }
      function ptOf(e){ var r = sceneBox.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      hit.addEventListener('pointerdown', function(e){
        if(!G || e.button > 0) return;
        var p = ptOf(e), b = bugAt(p[0], p[1]);
        hideCue(true);
        if(!b) return;
        e.preventDefault();
        if(b.path){ b.path = null; }
        takeText = null;
        drag = { b: b, id: e.pointerId, from: chamberOf(b.x, b.y), dx: b.x - p[0], dy: b.y - p[1], moved: false };
        try{ hit.setPointerCapture(e.pointerId); }catch(er){}
        gBugs.appendChild(b.el);
        b.el.classList.add('is-held'); b.s = 1.18; b.k = ''; put(b);
        tourDid('drag');
      });
      hit.addEventListener('pointermove', function(e){
        if(!drag || e.pointerId !== drag.id) return;
        var p = ptOf(e), b = drag.b, m = G.bugL * 0.45;
        var nx = clamp(p[0] + drag.dx, G.ix0 + m, G.ix1 - m), ny = clamp(p[1] + drag.dy, G.iy0 + m, G.iy1 - m);
        if(Math.hypot(nx - b.x, ny - b.y) > 0.5){ drag.moved = true; var ang = Math.atan2(ny - b.y, nx - b.x) * 180 / Math.PI, dA = ((ang - b.a) % 360 + 540) % 360 - 180; b.a += dA * 0.35; }
        b.x = nx; b.y = ny; put(b);
        paint();
      });
      function drop(e){
        if(!drag || e && e.pointerId !== drag.id) return;
        var d = drag; drag = null;
        var b = d.b, ci = chamberOf(b.x, b.y);
        b.el.classList.remove('is-held'); b.s = 1; b.k = '';
        var s = freeSlot(ci, [b.x, b.y]);
        walk(b, s, ci, { dur: 220 });
        var was = lastR ? lastR.reject : null;
        run(function(){
          if(ci !== d.from) moved(was);
        });
      }
      hit.addEventListener('pointerup', drop);
      hit.addEventListener('pointercancel', drop);
      hit.addEventListener('lostpointercapture', function(e){ if(drag && e.pointerId === drag.id) drop(e); });
      /* keys: Enter (or + or Up) brings a bug in from the fullest other chamber; Delete (or − or Down) sends one
         out to the emptiest */
      layer.el.addEventListener('keydown', function(e){
        var b = e.target.closest && e.target.closest('.cs2-chb'); if(!b || !G) return;
        var ci = +b.getAttribute('data-ci'), into = /^(Enter| |\+|=|ArrowUp)$/.test(e.key), outOf = /^(Delete|Backspace|-|ArrowDown)$/.test(e.key);
        if(!into && !outOf) return;
        e.preventDefault(); hideCue(true);
        moveOne(into ? null : ci, into ? ci : null);
      });
      function moveOne(fromCi, toCi){
        stopAll();
        var c = drawnCounts(), i;
        if(fromCi == null){ fromCi = -1; for(i = 0; i < c.length; i++) if(i !== toCi && c[i] > 0 && (fromCi < 0 || c[i] > c[fromCi])) fromCi = i; }
        if(toCi == null){ toCi = -1; for(i = 0; i < c.length; i++) if(i !== fromCi && (toCi < 0 || c[i] < c[toCi])) toCi = i; }
        if(fromCi < 0 || toCi < 0 || !c[fromCi]) return;
        // the bug nearest the way between them
        var w = doorOf(fromCi, toCi), aim = w ? (w.v ? [w.c, w.d] : [w.d, w.c]) : [G.mx, G.my], best = null, bd = 1e9;
        bugs.forEach(function(b){ if(chamberOf(b.x, b.y) !== fromCi) return; var dd = Math.hypot(b.x - aim[0], b.y - aim[1]); if(dd < bd){ bd = dd; best = b; } });
        if(!best) return;
        takeText = null;
        var was = lastR ? lastR.reject : null;
        walk(best, freeSlot(toCi), toCi);
        run(function(){ moved(was); });
      }
      function moved(was){
        var r = lastR; if(!r) return;
        sayNow();
        if(St.mode === 'quiz' && St.part === 'goals' && was === false && r.reject) goal('flip', 'Reject: χ² = ' + f2(r.chi2) + ' is past ' + F(r.crit, 2) + '. A gap this big would come by chance less than 5% of the time if the bugs had no preference.');
      }

      /* ---------------------------------------------------- Let them wander: the null is true */
      bWander.addEventListener('click', function(){ wander(); });
      function wander(){
        if(!G) return;
        hideCue(true); tourDid('wander');
        stopAll(); takeText = null;
        var k = G.k, rr = rnd;
        bugs.forEach(function(b){ leave(b); });
        // each bug picks a chamber with equal chance, on its own
        var picks = bugs.map(function(){ return Math.min(k - 1, Math.floor(rr() * k)); });
        bugs.forEach(function(b, i){ var s = freeSlot(picks[i]); walk(b, s, picks[i], { delay: rr() * 380, dur: 900 + rr() * 650 }); });
        if(G.phone) setTimeout(function(){ try{ var r = sceneBox.getBoundingClientRect(); if(r.top < 0 || r.bottom > window.innerHeight) sceneBox.scrollIntoView({ block: 'start', behavior: calm() ? 'auto' : 'smooth' }); }catch(e){} }, 0);
        run(function(){
          var r = lastR;
          tally.n++; if(r.reject) tally.over++; tally.list.push(r.chi2); if(tally.list.length > 400) tally.list.shift();
          drawRuns(); paintTally();
          takeText = r.reject ? 'No preference, yet χ² = ' + f2(r.chi2) + ' landed past the line by chance alone: a false alarm (a type I error).' : 'No preference: χ² = ' + f2(r.chi2) + ', under the line, as most chance runs are (' + tally.over + ' of ' + tally.n + ' past it so far).';
          shownKey = ''; paint();
          say(takeText);
          if(St.mode === 'quiz' && St.part === 'goals'){ Q.runs++; if(Q.runs >= 20) goal('chance', Q.runs + ' chance runs, ' + tally.over + ' of all runs past the line. With no preference at all, about 1 run in 20 still crosses it: that is what p = 0.05 means.'); }
        });
      }

      /* ---------------------------------------------------- 40 or 80 bugs: same shares, twice the counts */
      nBtns.forEach(function(b){ b.addEventListener('click', function(){ setBig(b.getAttribute('data-b') === '1'); }); });
      function setBig(big){
        if(big === MD.big || !G) return;
        stopAll(); hideCue(true); takeText = null;
        var c0 = drawnCounts(), r0 = stats(c0), was = r0;
        MD.big = big; paintN();
        var t = now();
        if(big){
          c0.forEach(function(n, ci){ for(var j = 0; j < n; j++){ var b = newBug(), s = freeSlot(ci); take(s, b); b.x = s.x; b.y = s.y; b.a = s.a; b.s = 0.4; b.o = 0; b.on = false; b.fx = { kind: 'in', t0: t + (bugs.length % 40) * 16, dur: 260 }; put(b); bugs.push(b); } });
        } else {
          var want = M.apportion(c0.map(function(n){ return n / (M.sum(c0) || 1); }), NB[0]), gone = c0.map(function(n, i){ return n - want[i]; }), q = 0;
          bugs.slice().reverse().forEach(function(b){ var ci = chamberOf(b.x, b.y); if(gone[ci] > 0){ gone[ci]--; leave(b); b.fx = { kind: 'out', t0: t + (q++) * 16, dur: 240 }; } });
        }
        run(function(){
          var r = lastR;
          takeText = big ? 'Same shares, twice the bugs: χ² went from ' + f2(was.chi2) + ' to ' + f2(r.chi2) + '. With more data, the same lopsided split is harder to blame on chance.' + (r.reject && !was.reject ? ' The decision flipped to reject.' : '')
            : 'Back to ' + NB[0] + ' bugs in the same shares: χ² went from ' + f2(was.chi2) + ' to ' + f2(r.chi2) + '.';
          shownKey = ''; paint(); say(takeText);
          if(big && St.mode === 'quiz' && St.part === 'goals' && was.chi2 > 0.3 && !was.reject) goal('double', 'Same shares, twice the bugs: χ² went from ' + f2(was.chi2) + ' to ' + f2(r.chi2) + '. χ² grows with the sample, so a small lean in a big sample can be real.');
        });
      }
      function paintN(){ nBtns.forEach(function(b){ b.setAttribute('aria-pressed', String((b.getAttribute('data-b') === '1') === MD.big)); }); }

      /* ---------------------------------------------------- the tabs: two or four chambers */
      function setCase(id, user){
        var i = CASES.map(function(c){ return c.id; }).indexOf(id); if(i < 0 || i === MD.ci) return;
        stopAll(); takeText = null;
        MD.counts[MD.ci] = drawnCounts();
        var oldPos = bugs.map(function(b){ return [b.x, b.y]; });
        MD.ci = i;
        relayout(true);
        var want = scaled(MD.counts[i]);
        // the bugs walk from where they were into the new chambers
        while(bugs.length < M.sum(want)) bugs.push(newBug());
        bugs.forEach(function(b, j){ if(oldPos[j]){ b.x = oldPos[j][0]; b.y = oldPos[j][1]; b.k = ''; put(b); } });
        var j = 0;
        if(!calm()) want.forEach(function(n, ci){ for(var q = 0; q < n; q++, j++){ var b = bugs[j]; b.x = clamp(b.x, G.ix0 + 4, G.ix1 - 4); b.y = clamp(b.y, G.iy0 + 4, G.iy1 - 4); walk(b, freeSlot(ci), ci, { delay: rnd() * 200, dur: 700 + rnd() * 400 }); } });
        else placeCounts(want);
        run(function(){ sayNow(); if(user && St.mode === 'quiz' && St.part === 'goals' && C().chambers.length > 2) goal('df', 'Four chambers: df = 4 − 1 = 3, so the critical value moved right, from 3.84 to 7.82. More categories give χ² more pieces to add up, so it takes a bigger total to stand out from chance.'); });
        if(user) tourDid('tab');
      }
      function scaled(counts){ var n = M.sum(counts); return n === nBugs() ? counts.slice() : M.apportion(counts.map(function(x){ return x / (n || 1); }), nBugs()); }

      /* ---------------------------------------------------- Start over: the opening chamber */
      bReset.addEventListener('click', function(){ startOver(true); });
      function startOver(anim){
        stopAll(); takeText = null; tally = { n: 0, over: 0, list: [] }; drawRuns(); paintTally();
        var want = C().start.slice();
        if(MD.big){ MD.big = false; paintN(); var t = now(), q = 0, keep = want.slice(); bugs.slice().forEach(function(b){ var ci = chamberOf(b.x, b.y); if(keep[ci] > 0) keep[ci]--; else { leave(b); b.fx = { kind: 'out', t0: t + (q++) * 10, dur: 220 }; } }); }
        if(!anim || calm()){ placeCounts(want); settled(); return; }
        // the bugs that are in the wrong chamber walk to where the opening has room
        var have = drawnCounts(), need = want.map(function(n, i){ return n - have[i]; }), live_ = bugs.filter(function(b){ return !b.fx; });
        if(MD.big === false && live_.length > M.sum(want)) need = want.map(function(n, i){ return n - Math.min(have[i], n); });
        live_.forEach(function(b){ var ci = chamberOf(b.x, b.y); if(need[ci] < 0){ var to = need.findIndex(function(x){ return x > 0; }); if(to > -1){ need[ci]++; need[to]--; walk(b, freeSlot(to), to, { delay: rnd() * 150 }); } } });
        run(function(){ sayNow(); });
      }

      /* ---------------------------------------------------- first visit cue and "Show me how" */
      function cueBug(){
        if(!G || !bugs.length) return null;
        var c = drawnCounts(), full = c[0] >= c[1] ? 0 : 1, w = G.walls[0], aim = w.v ? [w.c, w.d] : [w.d, w.c], best = null, bd = 1e9;
        bugs.forEach(function(b){ if(chamberOf(b.x, b.y) !== full) return; var d = Math.hypot(b.x - aim[0], b.y - aim[1]); if(d < bd){ bd = d; best = b; } });
        return best;
      }
      var cue = K.cue(layer, { key: 'apbio-chi', text: EX.cue, side: 'below', at: function(){ var b = cueBug(); return b ? [b.x, b.y + G.bugL * 0.55] : [0, 0]; } });
      function hideCue(used){ if(cue.active()) cue.hide(used); }
      stage.addEventListener('keydown', function(e){ if(/^(Arrow|Enter| |Delete|Backspace)/.test(e.key) && e.target.closest && e.target.closest('.cs2-chb')) hideCue(true); }, true);
      var tour = K.tour({ key: 'apbio-chi', label: 'Show me how', steps: [
        { id: 'drag', text: 'Drag a bug into another chamber. Each sign counts the bugs in its chamber and gives the count the null expects.', target: function(){ var b = cueBug(); return b ? b.el : sceneBox; } },
        { id: 'graph', text: 'Each chamber’s gap adds a piece to χ². Past the critical value, reject the null.', target: function(){ return graphBox; } },
        { id: 'wander', text: 'Let them wander: bugs with no preference. See how often chance alone crosses the line.', target: function(){ return bWander; } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(St.mode !== 'explore') return; hideCue(false); tour.start(true); }

      /* ---------------------------------------------------- layout */
      function relayout(keep){
        var g = layout(); if(!g) return false;
        var counts = keep ? null : (G ? drawnCounts() : null);
        G = g; mCache = {};
        drawStatic(); makeSlots(); buildSigns(); buildBtns();
        bugSvg.setAttribute('viewBox', '0 0 ' + G.W + ' ' + G.H);
        if(!keep){ placeCounts(counts && M.sum(counts) === nBugs() && counts.length === G.k ? counts : scaled(MD.counts[MD.ci])); }
        var gg = gLayout(); if(gg){ GG = gg; drawGraph(); }
        shownKey = ''; paint(true);
        if(cue.active()) cue.place();
        return true;
      }
      var lastWH = '';
      function layoutNow(){
        var key = sceneBox.clientWidth + 'x' + sceneBox.clientHeight + ':' + graphBox.clientWidth + 'x' + graphBox.clientHeight;
        if(key === lastWH || !sceneBox.clientWidth) return;
        lastWH = key;
        stopAll(); relayout(false);
      }

      /* ---------------------------------------------------- "?": this sample worked out */
      var ref = document.createElement('div'); ref.className = 'cs2-ref';
      ref.innerHTML = '<p class="cs2-ref-how"><button type="button" class="tk2-how cs2-ref-tour">Show me how</button></p><div class="cs2-ref-live"></div>' + EX.refHtml;
      ref.querySelector('.cs2-ref-tour').addEventListener('click', function(){ if(St.mode !== 'explore') return; var x = document.querySelector('.ls-sheet-x, .ls-sheet .ls-x'); if(x) x.click(); setTimeout(startTour, 60); });
      var refLive = ref.querySelector('.cs2-ref-live');
      function refHtml(){
        var r = lastR; if(!r) return;
        var rows = r.counts.map(function(o, i){ var d = o - r.e; return '<tr><th scope="row"><span class="cs2-sw is-' + C().chambers[i].role + '"></span>' + esc(C().chambers[i].name) + '</th><td>' + o + '</td><td>' + F(r.e, 1) + '</td><td>' + (d < 0 ? '−' : '') + F(Math.abs(d), 1) + '</td><td>' + F(d * d, 1) + '</td><td>' + f2(r.terms[i]) + '</td></tr>'; }).join('');
        refLive.innerHTML = '<h3>This chamber, worked out</h3><p>Null hypothesis: ' + esc(C().null) + '. ' + r.n + ' bugs in ' + r.counts.length + ' chambers, so each expects ' + r.n + ' ÷ ' + r.counts.length + ' = ' + F(r.e, 1) + '.</p>' +
          '<div class="bt-tablewrap"><table class="cs2-tab"><thead><tr><th scope="col">Chamber</th><th scope="col">o</th><th scope="col">e</th><th scope="col">o − e</th><th scope="col">(o − e)²</th><th scope="col">(o − e)² / e</th></tr></thead><tbody>' + rows +
          '</tbody><tfoot><tr><th scope="row" colspan="5">χ² = Σ (o − e)² / e</th><td><b>' + f2(r.chi2) + '</b></td></tr></tfoot></table></div>' +
          '<p>df = ' + r.counts.length + ' chambers − 1 = <b>' + r.df + '</b>. The critical value at p = 0.05 for df ' + r.df + ' is <b>' + F(r.crit, 2) + '</b>. χ² is ' + (r.reject ? '<b>greater</b>, so <b>reject the null hypothesis</b>: a gap this big would happen by chance less than 5% of the time if the bugs had no preference.' : '<b>not greater</b>, so <b>fail to reject the null hypothesis</b>: chance alone could easily give gaps this size. That is not proof the bugs have no preference.') + '</p>';
      }

      /* ---------------------------------------------------- Test yourself, "Challenges": the old Explore goals */
      var dock = document.createElement('div'); dock.className = 'cs2-dock';
      var Q = { runs: 0, ex: null };
      var chal = K.challenges({ store: 'apbio-chi-goals', items: EX.goals,
        done: { title: 'All four done.', text: 'χ² grows with every gap and with the sample; df sets where the line is; and chance alone crosses it about 1 time in 20.' },
        onShow: function(){ if(St.mode === 'quiz' && St.part === 'goals') fresh(); }, onReset: function(){ fresh(); } });
      dock.appendChild(chal.el);
      function goal(id, html){ var c = chal.current(); if(!c || c.id !== id || chal.isMet(id)) return; chal.met(id, html); setTimeout(function(){ try{ var r = chal.el.getBoundingClientRect(); if(r.top < 0 || r.bottom > (window.innerHeight || 0)) chal.el.scrollIntoView({ block: 'nearest', behavior: calm() ? 'auto' : 'smooth' }); }catch(e){} }, 450); }
      function fresh(){
        Q.runs = 0; tally = { n: 0, over: 0, list: [] };
        MD.ci = 0; MD.big = false; MD.counts = CASES.map(function(c){ return c.start.slice(); }); paintN(); tabs.value(CASES[0].id);
        takeText = null; relayout(true); placeCounts(MD.counts[0].slice()); drawRuns(); paintTally(); settled();
      }

      /* ---------------------------------------------------- the two modes (the adapter calls this) */
      function shown(mode, part){
        var was = St.mode === 'explore' ? 'explore' : St.part === 'goals' ? 'goals' : 'other';
        St.mode = mode; St.part = part;
        var ex = mode === 'explore', goals = mode === 'quiz' && part === 'goals';
        stage.setAttribute('data-view', ex ? 'explore' : 'goals');
        head.el.hidden = !ex;
        if(!ex){ hideCue(false); if(tour.active()) tour.stop(); }
        if(was === 'explore' && !ex){ stopAll(); MD.counts[MD.ci] = drawnCounts(); Q.ex = { ci: MD.ci, big: MD.big, counts: MD.counts.map(function(c){ return c.slice(); }), tally: tally }; }
        if(!ex && !goals){ stopAll(); return; }
        if(ex && Q.ex){ stopAll(); MD.ci = Q.ex.ci; MD.big = Q.ex.big; MD.counts = Q.ex.counts; tally = Q.ex.tally; Q.ex = null; paintN(); tabs.value(CASES[MD.ci].id); takeText = null; lastWH = ''; }
        if(goals && was !== 'goals'){ lastWH = ''; setTimeout(function(){ layoutNow(); fresh(); }, 30); return; }
        setTimeout(function(){ layoutNow(); if(ex){ relayout(true); placeCounts(scaled(MD.counts[MD.ci])); drawRuns(); settled(); if(!tour.active()) cue.show(); } }, 30);
      }
      ctx.kit2 = { stage: stage, ref: ref, othersLabel: 'In the chamber',
        parts: [{ value: 'practice', label: 'Problems', practice: true },
          { value: 'goals', label: 'Challenges', dock: dock, task: { kicker: 'Challenges', title: 'Change the chamber to meet each challenge.', todo: 'Drag bugs, switch tabs or let them wander.' } }],
        onShow: function(m, p){ shown(m, p); } };
      // The practice problems (unchanged): the adapter puts them in Test yourself. The table goes behind "?".
      T.skillTool(app, data, { slug: SLUG, kind: 'chi', stage: practiceStage });
      app.insertAdjacentHTML('beforeend', critTable());
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); shown('explore', null); }
      // the whole stage stops when it is hidden (Test yourself, "?" on a phone, another page tab)
      if(window.IntersectionObserver) new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting && busy() && !drag){ stopAll(); settled(); } }); }).observe(sceneBox);
      document.addEventListener('visibilitychange', function(){ if(document.hidden && busy()){ stopAll(); settled(); } });
      if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ mCache = {}; lastWH = ''; layoutNow(); });
      if(window.ResizeObserver){ var tm = null; var ro = new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(layoutNow, 60); }); ro.observe(sceneBox); ro.observe(graphBox); }
      else window.addEventListener('resize', layoutNow);
      window.__cs2 = { counts: function(){ return drawnCounts(); }, busy: busy, G: function(){ return G; }, GG: function(){ return GG; }, bugs: function(){ return bugs.map(function(b){ return { x: b.x, y: b.y, on: b.on, s: b.s, held: drag && drag.b === b }; }); }, r: function(){ return lastR; }, tally: function(){ return tally; }, chamberOf: chamberOf, move: moveOne, wander: wander };
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApBioBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var l2 = document.createElement('link'); l2.rel = 'stylesheet'; l2.href = (window.ApBioBase || '../') + 'assets/tools/chi-square.css'; document.head.appendChild(l2);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
