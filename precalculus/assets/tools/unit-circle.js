/* Unit circle (simulator, free; docs/apprecalc-spec.md section 6). OWNED BY THIS
   TOOL ONLY (builder T3, docs/apprecalc-briefs/t3.md). Model:
   ApPrecalcMath.unitCircle (precalculus/assets/tools/math/unit-circle.js); frame:
   ApPrecalcTools.modes and drill on the Tool Studio; animation: ApPrecalcPlot.loop.

   Explore: one SVG scene. The unit circle with the point P (drag it, or the
   slider, or the arrow keys), the arc from (1, 0) to P in the course green
   (radians are arc length), the reference triangle (cos θ the blue leg,
   sin θ the red leg) and, beside it on the same vertical scale, the graphs
   of sine and cosine unrolling up to θ; the arc is laid flat on the θ-axis.
   The "tan" view shows tan θ as the slope of OP, the line x = 1 it meets,
   and the tangent graph. Play unrolls one full turn (reduced motion: the
   end state). Why: radians, the reference triangle, the graphs. Details:
   the table of special angles (tap a row to go there), labels, degrees.

   Test yourself (ApPrecalcTools.drill): radians as arc length, sine and
   cosine as coordinates and tangent as slope, a ray through a point, exact
   values from the reference angle, the graphs from the circle. The figure
   fills in as each step is answered; a wrong number is drawn dashed. */
(function(){
  'use strict';
  var T = window.ApPrecalcTools, M = window.ApPrecalcMath, P = window.ApPrecalcPlot, X = window.ApPrecalcTex;
  (function(){
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Exact values');
  })();
  if(!T || !M || !M.unitCircle || M.unitCircle.stub || !P) return;
  var UC = M.unitCircle, esc = T.esc, PI = Math.PI, TAU = 2 * PI;
  function tex(s){ return X ? X.render(s) : esc(s); }
  function html(s){ return X ? X.html(s) : s; }
  function r1(v){ return Math.round(v * 10) / 10; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function div(cls, kids){ var d = document.createElement('div'); d.className = cls; (kids || []).forEach(function(k){ if(k) d.appendChild(k); }); return d; }
  function studioNow(){ var app = document.getElementById('app'); return window.LevlStudio && app && app.getAttribute('data-studio') ? window.LevlStudio.get() : null; }
  function txt(x, y, s, cls, anchor, extra){ return '<text x="' + r1(x) + '" y="' + r1(y) + '" class="' + cls + '" text-anchor="' + (anchor || 'middle') + '"' + (extra || '') + '>' + s + '</text>'; }
  /* A value as the student reads it: exact at a special angle, else three decimals. */
  function valText(a, k, theta){
    if(a.special){ var v = a.special[k]; return v.undef ? 'undefined' : v.text; }
    var n = k === 'cos' ? a.cos : k === 'sin' ? a.sin : a.tan;
    return isFinite(n) ? '≈ ' + UC.n3(n) : 'undefined';
  }
  function eqText(a, k){ var v = valText(a, k); return v.charAt(0) === '≈' || v === 'undefined' ? (v === 'undefined' ? ' is undefined' : ' ' + v) : ' = ' + v; }
  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>';

  T.mount('unit-circle', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'unit-circle',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.pause(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ============================================================ explore */
  function explore(host){
    var id = T.nid('uc');
    var st = { th: PI / 6, view: 'trig', labels: false, deg: false, touched: false };
    var LS = null, L = null, lastCap = '';
    var cue = T.cue('Drag the point <b>P</b> around the circle, or press <b>Unroll one turn</b>.');
    host.innerHTML =
      '<section class="bt-problem uc-card" aria-label="Unit circle explorer">' +
        '<div class="uc-stage"><div class="uc-wrap"><svg class="uc-svg" role="group" aria-label="The unit circle beside the graphs of sine and cosine"><g class="uc-static" aria-hidden="true"></g><g class="uc-dyn" aria-hidden="true"></g></svg></div></div>' +
        '<div class="uc-ctl">' +
          '<div class="bt-ctl bt-slider uc-angle"><label for="' + id + '-a">Angle θ</label><div class="bt-slider-row">' +
            '<button type="button" class="bt-step" data-d="-1" aria-label="Previous special angle">−</button>' +
            '<input type="range" id="' + id + '-a" min="0" max="' + TAU.toFixed(4) + '" step="0.001" value="' + st.th + '">' +
            '<button type="button" class="bt-step" data-d="1" aria-label="Next special angle">+</button>' +
            '<output class="bt-out uc-out" for="' + id + '-a" aria-hidden="true"></output></div></div>' +
          '<div class="uc-row">' +
            '<button type="button" class="bt-btn uc-play" aria-pressed="false">' + ICON_PLAY + '<span>Unroll one turn</span></button>' +
            '<div class="ls-seg uc-view" role="group" aria-label="What the scene shows"><button type="button" class="bt-mode" data-v="trig" aria-pressed="true">sin and cos</button><button type="button" class="bt-mode" data-v="tan" aria-pressed="false">tan</button></div>' +
          '</div>' +
        '</div>' +
        '<div class="uc-say"></div>' +
        '<div class="uc-det"></div>' +
        '<p class="sr-only uc-live"></p>' +
      '</section>';
    var card = host.querySelector('.uc-card');
    card.insertBefore(cue.el, card.querySelector('.uc-say'));
    var wrap = host.querySelector('.uc-wrap'), svg = host.querySelector('.uc-svg'), gS = svg.querySelector('.uc-static'), gD = svg.querySelector('.uc-dyn');
    var range = host.querySelector('#' + id + '-a'), out = host.querySelector('.uc-out'), playBtn = host.querySelector('.uc-play');
    var say = host.querySelector('.uc-say'), det = host.querySelector('.uc-det'), ctl = host.querySelector('.uc-ctl');
    var announce = T.announcer(host.querySelector('.uc-live'));

    /* ---------------------------------------------------- layout */
    function layout(){
      var w = wrap.clientWidth || 900, h = wrap.clientHeight || 460, wide = w / Math.max(1, h) > 1.05, H, R;
      if(wide){
        H = Math.round(clamp(1000 * h / Math.max(1, w), 470, 760)); R = Math.min(185, Math.floor((H - 130) / 2));
        var cx = 44 + R + 40;
        var cyw = Math.round(H / 2 + 18);
        return { wide: true, W: 1000, H: H, cx: cx, cy: cyw, R: R, gx0: cx + R + 92, gx1: 976, gy: cyw, fs: 21, tk: 15, read: Math.max(32, cyw - R - 62) };
      }
      H = Math.round(clamp(400 * h / Math.max(1, w), 560, 900)); R = Math.floor(clamp((H - 200) / 4, 92, 150));
      var cy = R + 36, read = cy + R + 46, gy = read + 22 + 18 + R;
      return { wide: false, W: 400, H: Math.max(H, gy + R + 104), cx: 200, cy: cy, R: R, gx0: 46, gx1: 386, gy: gy, fs: 16, tk: 13, read: read };
    }
    function sx(t){ return L.gx0 + t / TAU * (L.gx1 - L.gx0); }
    function gyv(v){ return L.gy - L.R * v; }
    function px(c){ return L.cx + L.R * c; } function py(s){ return L.cy - L.R * s; }

    /* ---------------------------------------------------- the handle (P) */
    var NS = 'http://www.w3.org/2000/svg';
    var hd = document.createElementNS(NS, 'g');
    hd.setAttribute('class', 'uc-handle'); hd.setAttribute('tabindex', '0'); hd.setAttribute('role', 'slider');
    hd.setAttribute('aria-label', 'Point P on the unit circle, at angle θ');
    hd.setAttribute('aria-valuemin', '0'); hd.setAttribute('aria-valuemax', TAU.toFixed(3));
    hd.innerHTML = '<circle class="uc-halo" r="22"></circle><circle class="uc-dot" r="10"></circle>';
    svg.appendChild(hd);

    function curve(f, a, b, n, clipV){
      var d = '', on = false;
      for(var i = 0; i <= n; i++){
        var t = a + (b - a) * i / n, v = f(t);
        if(!isFinite(v) || (clipV && Math.abs(v) > clipV)){ on = false; continue; }
        d += (on ? 'L' : 'M') + r1(sx(t)) + ' ' + r1(gyv(v)); on = true;
      }
      return d;
    }
    function tanF(t){ var c = Math.cos(t); return Math.abs(c) < 1e-9 ? NaN : Math.sin(t) / c; }

    /* ---------------------------------------------------- static layer */
    function drawStatic(){
      L = layout();
      svg.setAttribute('viewBox', '0 0 ' + L.W + ' ' + L.H);
      svg.classList.toggle('is-tall', !L.wide);
      var o = [], R = L.R, cx = L.cx, cy = L.cy, ext = R + (L.wide ? 34 : 26);
      // quadrant numerals
      ['I', 'II', 'III', 'IV'].forEach(function(q, i){
        var a = PI / 4 + i * PI / 2;
        o.push(txt(cx + Math.cos(a) * R * 0.62, cy - Math.sin(a) * R * 0.62 + L.fs * 0.35, q, 'uc-quad uc-q' + (i + 1)));
      });
      o.push('<line class="uc-axis" x1="' + r1(cx - ext) + '" y1="' + cy + '" x2="' + r1(cx + ext) + '" y2="' + cy + '"/>');
      o.push('<line class="uc-axis" x1="' + cx + '" y1="' + r1(cy - ext) + '" x2="' + cx + '" y2="' + r1(cy + ext) + '"/>');
      o.push(txt(cx + ext, cy - 8, 'x', 'uc-axl', 'end'), txt(cx - 8, cy - ext + 12, 'y', 'uc-axl', 'end'));
      o.push('<circle class="uc-circle" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>');
      UC.SPECIAL.forEach(function(m){
        var t = m * PI / 12;
        o.push('<circle class="uc-sp' + (m % 6 === 0 ? ' is-ax' : '') + '" cx="' + r1(cx + R * Math.cos(t)) + '" cy="' + r1(cy - R * Math.sin(t)) + '" r="' + (m % 6 === 0 ? 4 : 3) + '"/>');
      });
      // the graph frame: y = ±1 on the same scale as the circle, the θ-axis with π/2 ticks
      var g0 = L.gx0, g1 = L.gx1, gy = L.gy;
      o.push('<g class="uc-graph">');
      [1, -1].forEach(function(v){ o.push('<line class="uc-grid" x1="' + g0 + '" y1="' + r1(gyv(v)) + '" x2="' + g1 + '" y2="' + r1(gyv(v)) + '"/>', txt(g0 - 8, gyv(v) + L.tk * 0.35, v > 0 ? '1' : '−1', 'uc-tk', 'end')); });
      for(var k = 1; k <= 4; k++) o.push('<line class="uc-grid" x1="' + r1(sx(k * PI / 2)) + '" y1="' + r1(gy - R - 8) + '" x2="' + r1(sx(k * PI / 2)) + '" y2="' + r1(gy + R + 8) + '"/>');
      o.push('<line class="uc-axis" x1="' + g0 + '" y1="' + gy + '" x2="' + (g1 + 8) + '" y2="' + gy + '"/>');
      o.push('<line class="uc-axis" x1="' + g0 + '" y1="' + r1(gy - R - 14) + '" x2="' + g0 + '" y2="' + r1(gy + R + 14) + '"/>');
      ['0', 'π/2', 'π', '3π/2', '2π'].forEach(function(s, k){ o.push(txt(sx(k * PI / 2), gy + R + 14 + L.tk + 4, s, 'uc-tk')); });
      o.push(txt(g1 + 4, gy - 8, 'θ', 'uc-axl', 'end'));
      o.push('</g>');
      gS.innerHTML = o.join('');
    }

    /* ---------------------------------------------------- dynamic layer */
    function draw(){
      if(!L) drawStatic();
      var th = st.th, a = UC.at(th), sp = a.special, R = L.R, cx = L.cx, cy = L.cy, o = [];
      var Px = px(a.cos), Py = py(a.sin), tan = st.view === 'tan';
      var big = th > PI ? 1 : 0;
      // the arc from (1, 0) to P: radians are arc length
      if(th > 1e-6){
        var arcEnd = th >= TAU - 1e-6 ? th - 1e-4 : th;
        o.push('<path class="uc-arc" d="M' + (cx + R) + ' ' + cy + ' A' + R + ' ' + R + ' 0 ' + big + ' 0 ' + r1(px(Math.cos(arcEnd))) + ' ' + r1(py(Math.sin(arcEnd))) + '"/>');
        // a small angle mark at O
        var rr = R * 0.2;
        o.push('<path class="uc-amark" d="M' + (cx + rr) + ' ' + cy + ' A' + rr + ' ' + rr + ' 0 ' + big + ' 0 ' + r1(cx + rr * Math.cos(arcEnd)) + ' ' + r1(cy - rr * Math.sin(arcEnd)) + '"/>');
        var mid = th / 2;
        o.push(txt(cx + (rr + L.fs * 0.8) * Math.cos(mid), cy - (rr + L.fs * 0.8) * Math.sin(mid) + L.fs * 0.35, 'θ', 'uc-thl'));
      }
      if(!tan){
        // reference triangle: the cos leg (blue) along the x-axis, the sin leg (red) up to P
        if(Math.abs(a.sin) > 1e-9 && Math.abs(a.cos) > 1e-9){
          var q = Math.min(12, R * 0.08), sxg = a.cos > 0 ? -1 : 1, syg = a.sin > 0 ? 1 : -1;
          o.push('<path class="uc-right" d="M' + r1(Px + sxg * q) + ' ' + cy + ' V' + r1(cy - syg * q) + ' H' + r1(Px) + '"/>');
          // the reference angle, a soft wedge at O measured to the x-axis
          var base = a.cos > 0 ? 0 : PI, ra = R * 0.34, s0 = base, s1 = Math.atan2(a.sin, a.cos);
          o.push('<path class="uc-ref" d="M' + cx + ' ' + cy + ' L' + r1(cx + ra * Math.cos(s0)) + ' ' + r1(cy - ra * Math.sin(s0)) + ' A' + ra + ' ' + ra + ' 0 0 ' + ((a.sin > 0) === (a.cos > 0) ? 0 : 1) + ' ' + r1(cx + ra * Math.cos(s1)) + ' ' + r1(cy - ra * Math.sin(s1)) + ' Z"/>');
        }
        o.push('<line class="uc-cos" x1="' + cx + '" y1="' + cy + '" x2="' + r1(Px) + '" y2="' + cy + '"/>');
        o.push('<line class="uc-sin" x1="' + r1(Px) + '" y1="' + cy + '" x2="' + r1(Px) + '" y2="' + r1(Py) + '"/>');
        if(Math.abs(a.cos) > 0.18) o.push(txt((cx + Px) / 2, cy + (a.sin >= 0 ? L.fs + 2 : -8), 'cos θ', 'uc-lab uc-c-cos'));
        if(Math.abs(a.sin) > 0.18) o.push(txt(Px + (a.cos >= 0 ? 26 : -26), (cy + Py) / 2 + L.fs * 0.35, 'sin θ', 'uc-lab uc-c-sin', a.cos >= 0 ? 'start' : 'end'));
      } else {
        // tan θ: the line through O and P meets x = 1 at height tan θ
        var x1 = cx + R, top = 1.5;
        o.push('<line class="uc-tline" x1="' + x1 + '" y1="' + r1(cy - R * top) + '" x2="' + x1 + '" y2="' + r1(cy + R * top) + '"/>');
        o.push(txt(x1 + 6, cy - R * top + L.fs, 'x = 1', 'uc-lab uc-c-tan', 'start'));
        if(isFinite(a.tan)){
          var tv = clamp(a.tan, -top, top), tx = Math.abs(a.tan) > top ? cx + R * top / Math.abs(a.tan) : x1, ty = cy - R * tv;
          var back = a.cos < 0;
          o.push('<line class="uc-ext' + (back ? ' is-back' : '') + '" x1="' + (back ? cx : r1(Px)) + '" y1="' + (back ? cy : r1(Py)) + '" x2="' + r1(tx) + '" y2="' + r1(ty) + '"/>');
          if(Math.abs(a.tan) <= top){
            o.push('<line class="uc-tseg" x1="' + x1 + '" y1="' + cy + '" x2="' + x1 + '" y2="' + r1(ty) + '"/>');
            o.push('<circle class="uc-tpt" cx="' + x1 + '" cy="' + r1(ty) + '" r="6"/>');
            o.push(txt(x1 + 10, ty + (a.tan >= 0 ? -6 : L.fs), 'tan θ', 'uc-lab uc-c-tan', 'start'));
          }
        }
      }
      // the radius OP
      o.push('<line class="uc-rad" x1="' + cx + '" y1="' + cy + '" x2="' + r1(Px) + '" y2="' + r1(Py) + '"/>');
      // P's coordinates, outward from the circle
      var lr = R + (L.wide ? 40 : 32), lx = cx + lr * a.cos, ly = cy - lr * a.sin + L.fs * 0.35;
      var anc = a.cos > 0.3 ? 'start' : a.cos < -0.3 ? 'end' : 'middle';
      if(anc === 'middle') ly += a.sin > 0 ? -6 : 10;
      var coord = sp ? '(' + sp.cos.text + ', ' + sp.sin.text + ')' : '(' + UC.n3(a.cos) + ', ' + UC.n3(a.sin) + ')';
      var plab = tan ? (isFinite(a.tan) ? 'slope ' + (sp ? sp.tan.text : UC.n3(a.tan)) : 'vertical') : coord;
      // quadrantal labels, hidden where P's own label sits
      [['0', 0], ['π/2', PI / 2], ['π', PI], ['3π/2', 3 * PI / 2]].concat(st.labels ? UC.SPECIAL.filter(function(m){ return m % 6; }).map(function(m){ return [UC.angle(m).text, m * PI / 12]; }) : []).forEach(function(q){
        var d = Math.abs(((q[1] - th) % TAU + TAU + PI) % TAU - PI);
        if(d < (st.labels ? 0.2 : 0.36)) return;
        var ax0 = Math.abs(q[1] % (PI / 2)) < 1e-9, lr2 = R + (ax0 ? 8 : 18), ax = cx + lr2 * Math.cos(q[1]), ay = cy - lr2 * Math.sin(q[1]);
        var an = Math.cos(q[1]) > 0.3 ? 'start' : Math.cos(q[1]) < -0.3 ? 'end' : 'middle';
        if(ax0){ an = Math.cos(q[1]) < -0.5 ? 'end' : 'start'; ax += Math.cos(q[1]) < -0.5 ? -4 : 6; ay += Math.sin(q[1]) > 0.5 ? -6 : Math.sin(q[1]) < -0.5 ? L.tk + 6 : Math.cos(q[1]) > 0.5 ? L.tk + 6 : -8; }
        else { ax += an === 'start' ? 4 : an === 'end' ? -4 : 0; ay += Math.sin(q[1]) > 0.3 ? -2 : Math.sin(q[1]) < -0.3 ? L.tk + 2 : L.tk * 0.35; }
        o.push(txt(ax, ay, q[0], 'uc-alab', an));
      });
      o.push(txt(lx, ly, esc(plab), 'uc-plab', anc));
      o.push(txt(Px + (a.cos >= 0 ? -22 : 22), Py + (a.sin >= 0 ? -18 : 30), 'P', 'uc-pname', a.cos >= 0 ? 'end' : 'start'));
      // the graphs: ghosts of one full turn, then the part traced so far
      var g = [];
      if(!tan){
        g.push('<path class="uc-ghost uc-sin-c" d="' + curve(Math.sin, 0, TAU, 160) + '"/>', '<path class="uc-ghost uc-cos-c" d="' + curve(Math.cos, 0, TAU, 160) + '"/>');
        if(th > 1e-6){
          var n = Math.max(2, Math.round(160 * th / TAU));
          g.push('<path class="uc-trace uc-cos-c" d="' + curve(Math.cos, 0, th, n) + '"/>', '<path class="uc-trace uc-sin-c" d="' + curve(Math.sin, 0, th, n) + '"/>');
        }
      } else {
        [PI / 2, 3 * PI / 2].forEach(function(z){ g.push('<line class="uc-asym" x1="' + r1(sx(z)) + '" y1="' + r1(L.gy - R * 1.12) + '" x2="' + r1(sx(z)) + '" y2="' + r1(L.gy + R * 1.12) + '"/>'); });
        g.push('<path class="uc-ghost uc-tan-c" d="' + curve(tanF, 0, TAU, 400, 1.12) + '"/>');
        if(th > 1e-6) g.push('<path class="uc-trace uc-tan-c" d="' + curve(tanF, 0, th, Math.max(2, Math.round(400 * th / TAU)), 1.12) + '"/>');
      }
      // the arc laid flat on the θ-axis: the input of the graph is the arc length
      if(th > 1e-6) g.push('<line class="uc-flat" x1="' + L.gx0 + '" y1="' + L.gy + '" x2="' + r1(sx(th)) + '" y2="' + L.gy + '"/>');
      var gx = sx(th);
      g.push('<line class="uc-cur" x1="' + r1(gx) + '" y1="' + r1(L.gy - R * 1.08) + '" x2="' + r1(gx) + '" y2="' + r1(L.gy + R * 1.08) + '"/>');
      if(!tan){
        g.push('<line class="uc-sin uc-bar" x1="' + r1(gx) + '" y1="' + L.gy + '" x2="' + r1(gx) + '" y2="' + r1(gyv(a.sin)) + '"/>');
        g.push('<circle class="uc-gpt uc-cos-f" cx="' + r1(gx) + '" cy="' + r1(gyv(a.cos)) + '" r="6"/>', '<circle class="uc-gpt uc-sin-f" cx="' + r1(gx) + '" cy="' + r1(gyv(a.sin)) + '" r="6.5"/>');
        if(L.wide) o.push('<line class="uc-link" x1="' + r1(Px) + '" y1="' + r1(Py) + '" x2="' + r1(gx) + '" y2="' + r1(gyv(a.sin)) + '"/>');
        // curve names at the right end
        g.push(txt(L.gx1 + 2, gyv(Math.sin(TAU)) - 10, 'sin θ', 'uc-lab uc-c-sin', 'end'), txt(L.gx1 + 2, gyv(1) - 8, 'cos θ', 'uc-lab uc-c-cos', 'end'));
      } else if(isFinite(a.tan) && Math.abs(a.tan) <= 1.12){
        g.push('<circle class="uc-gpt uc-tan-f" cx="' + r1(gx) + '" cy="' + r1(gyv(a.tan)) + '" r="6.5"/>');
      }
      o.push('<g class="uc-gdyn">' + g.join('') + '</g>');
      // the readout: θ, then the values in their colors
      var thT = (sp ? 'θ = ' + sp.text + (sp.m ? ' ≈ ' + UC.n3(th) : '') : 'θ ≈ ' + UC.n3(th)) + (st.deg ? ' (' + Math.round(th * 180 / PI * 10) / 10 + '°)' : '');
      var vals = tan ? '<tspan class="uc-c-tan">tan θ' + esc(eqText(a, 'tan')) + '</tspan>'
        : '<tspan class="uc-c-cos">cos θ' + esc(eqText(a, 'cos')) + '</tspan><tspan dx="' + (L.wide ? 22 : 12) + '" class="uc-c-sin">sin θ' + esc(eqText(a, 'sin')) + '</tspan>';
      if(L.wide){
        o.push(txt(L.gx0, L.read, '<tspan class="uc-c-th">' + esc(thT) + '</tspan>', 'uc-read', 'start'));
        o.push(txt(L.gx0, L.read + L.fs * 1.35, vals, 'uc-read', 'start'));
      } else {
        o.push(txt(L.W / 2, L.read, '<tspan class="uc-c-th">' + esc(thT) + '</tspan>', 'uc-read'));
        o.push(txt(L.W / 2, L.read + L.fs * 1.3, vals, 'uc-read'));
      }
      gD.innerHTML = o.join('');
      // quadrant numeral in focus
      gS.querySelectorAll('.uc-quad').forEach(function(q, i){ q.classList.toggle('is-on', a.quadrant === i + 1); });
      hd.setAttribute('transform', 'translate(' + r1(Px) + ' ' + r1(Py) + ')');
      hd.setAttribute('aria-valuenow', th.toFixed(3));
      hd.setAttribute('aria-valuetext', srText(a));
      range.value = String(th); range.setAttribute('aria-valuetext', srText(a));
      out.textContent = sp ? sp.text : UC.n3(th);
      words(a);
      syncTable(a);
    }
    function srText(a){
      var sp = a.special;
      return 'θ = ' + (sp ? sp.text : UC.n3(a.theta)) + ' radians' + (st.deg ? ', ' + Math.round(a.theta * 180 / PI) + ' degrees' : '') + ', ' + (a.quadrant ? UC.QNAME[a.quadrant] : 'on an axis') +
        '. cos θ' + eqText(a, 'cos') + ', sin θ' + eqText(a, 'sin') + ', tan θ' + eqText(a, 'tan') + '.';
    }

    /* ---------------------------------------------------- words (caption, Why) */
    function words(a){
      var sp = a.special, tan = st.view === 'tan', thS = sp ? '$\\theta = ' + sp.tex + '$' : '$\\theta \\approx ' + M.fixed(a.theta, 3) + '$';
      var where = a.quadrant ? 'is in ' + UC.QNAME[a.quadrant] : 'is on ' + (sp && sp.axis ? sp.axis.replace(/x-axis/, '$x$-axis').replace(/y-axis/, '$y$-axis') : 'an axis');
      var Ptex = sp ? '\\left(' + sp.cos.tex + ', ' + sp.sin.tex + '\\right)' : '(' + M.fixed(a.cos, 3) + ', ' + M.fixed(a.sin, 3) + ')';
      var sg = function(v){ return v > 1e-12 ? '> 0' : v < -1e-12 ? '< 0' : '= 0'; };
      var head;
      if(tan) head = isFinite(a.tan) ? thS + ': $\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta} ' + (sp ? '= ' + sp.tan.tex : '\\approx ' + M.fixed(a.tan, 3)) + '$, the slope of $OP$.' : thS + ': $OP$ is vertical, so $\\tan\\theta$ is undefined.';
      else head = thS + ' ' + where + '. $P ' + (sp ? '=' : '\\approx') + ' ' + Ptex + '$, so $\\cos\\theta ' + sg(a.cos) + '$ and $\\sin\\theta ' + sg(a.sin) + '$.';
      var ref = a.quadrant && sp ? UC.refOf(sp) : null;
      var body = '<p><b>Radians are arc length.</b> P has moved along an arc of length ' + (sp ? '$' + sp.tex + (sp.m ? ' \\approx ' + M.fixed(a.theta, 3) : '') + '$' : '$' + M.fixed(a.theta, 3) + '$') + ' from $(1, 0)$. The radius is 1, so the arc length is the angle; the green bar on the θ-axis is that arc, laid flat. A full turn is $2\\pi \\approx 6.283$.</p>' +
        (ref ? '<p><b>Reference angle $' + ref.tex + '$.</b> The triangle under $OP$ has hypotenuse 1 and the angle $' + ref.tex + '$ at $O$, so its legs are $' + ref.cos.tex + '$ and $' + ref.sin.tex + '$. ' + UC.QNAME[a.quadrant] + ' gives the signs: $x$ ' + (a.cos > 0 ? 'positive' : 'negative') + ', $y$ ' + (a.sin > 0 ? 'positive' : 'negative') + '.</p>'
          : a.quadrant ? '<p><b>Reference angle.</b> The acute angle between $OP$ and the $x$-axis is about $' + M.fixed(a.ref, 3) + '$. Drag to a special angle (the dots) for exact values.</p>' : '') +
        (tan ? '<p><b>Tangent is a slope.</b> $\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}$ is rise over run along $OP$. Extend the line through $O$ and $P$ to the line $x = 1$: it meets it at height $\\tan\\theta$. Where $\\cos\\theta = 0$ the line is vertical and has no slope, so the graph has a vertical asymptote there. The tangent graph repeats every $\\pi$.</p>'
          : '<p><b>The graphs unroll from the circle.</b> The height of P is $\\sin\\theta$ (red); its $x$-coordinate is $\\cos\\theta$ (blue). Both stay between $-1$ and $1$ and repeat every $2\\pi$, the length of one turn.</p>');
      var box = T.explain(say, html(head), html(body));
      if(box) box.querySelectorAll('details.bt-why').forEach(function(d){ if(LS) d.open = true; });
      if(LS){
        var cap = T.sayHead(say);
        if(cap !== lastCap){ LS.caption(cap, 'explore'); lastCap = cap; }
        LS.pills([{ html: a.quadrant ? UC.QNAME[a.quadrant] : 'On an axis', tone: 'accent' }], 'left', 'explore');
      }
    }

    /* ---------------------------------------------------- Details: the table */
    function buildDetails(){
      var rows = UC.SPECIAL.concat([24]).map(function(m){
        var a = UC.angle(m);
        return '<tr data-m="' + m + '"><th scope="row"><button type="button" class="uc-go" data-m="' + m + '" aria-label="Go to θ = ' + esc(a.text) + '">' + tex(a.tex) + '</button></th><td class="uc-degc">' + a.deg + '°</td><td>' + tex(a.cos.tex) + '</td><td>' + tex(a.sin.tex) + '</td><td>' + (a.tan.undef ? '<span class="uc-nd">undefined</span>' : tex(a.tan.tex)) + '</td></tr>';
      }).join('');
      det.innerHTML = '<h3 class="ls-title-l">Settings</h3>' +
        '<label class="bt-check-row"><input type="checkbox" class="uc-labels"> <span>Label every special angle on the circle</span></label>' +
        '<label class="bt-check-row"><input type="checkbox" class="uc-degs"> <span>Show degrees too</span></label>' +
        '<h3 class="ls-title-l">The special angles</h3><p class="bt-small">Tap an angle to move P there. Each value comes from the 30-60-90 or 45-45-90 triangle and the signs of the quadrant.</p>' +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Exact values at the special angles"><table class="pcalc-data uc-table"><thead><tr><th scope="col">θ</th><th scope="col" class="uc-degc">degrees</th><th scope="col">cos θ</th><th scope="col">sin θ</th><th scope="col">tan θ</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
      det.querySelector('.uc-labels').addEventListener('change', function(e){ st.labels = e.target.checked; draw(); });
      det.querySelector('.uc-degs').addEventListener('change', function(e){ st.deg = e.target.checked; card.classList.toggle('uc-deg', st.deg); if(LS) LS.root.classList.toggle('uc-deg', st.deg); draw(); });
      det.addEventListener('click', function(e){ var b = e.target.closest('.uc-go'); if(b){ stop(); setTh(+b.getAttribute('data-m') * PI / 12, true); if(LS && LS.close && window.matchMedia && matchMedia('(max-width: 999.98px)').matches) LS.close(); } });
    }
    var lastRow = null;
    function syncTable(a){
      var m = a.special ? ((a.special.m % 24) + 24) % 24 : null;
      if(a.special && Math.abs(a.theta - TAU) < 1e-9) m = 24;
      var row = m == null ? null : det.querySelector('tr[data-m="' + m + '"]');
      if(row === lastRow) return;
      if(lastRow){ lastRow.classList.remove('is-on'); lastRow.removeAttribute('aria-current'); }
      if(row){ row.classList.add('is-on'); row.setAttribute('aria-current', 'true'); }
      lastRow = row;
    }

    /* ---------------------------------------------------- input */
    function setTh(t, say2){
      st.th = clamp(t, 0, TAU);
      if(!st.touched){ st.touched = true; cue.done(); }
      draw();
      if(say2) announce(srText(UC.at(st.th)));
    }
    function local(e){
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var m = svg.getScreenCTM(); var p = m ? pt.matrixTransform(m.inverse()) : pt;
      return [p.x, p.y];
    }
    var drag = null;
    function fromPoint(p){
      if(drag === 'circle'){
        var t = Math.atan2(L.cy - p[1], p[0] - L.cx); if(t < 0) t += TAU;
        // keep the turn continuous: past 2π it stays at 2π, below 0 at 0
        if(st.th - t > PI) t = st.th > 3 * PI / 2 ? TAU : t + TAU;
        if(t - st.th > PI) t = 0;
        return UC.snap(clamp(t, 0, TAU), 0.06);
      }
      return UC.snap(clamp((p[0] - L.gx0) / (L.gx1 - L.gx0) * TAU, 0, TAU), 0.04);
    }
    svg.addEventListener('pointerdown', function(e){
      if(!L) return;
      var p = local(e), dx = p[0] - L.cx, dy = p[1] - L.cy;
      var inCircle = Math.sqrt(dx * dx + dy * dy) < L.R * 1.45 && (L.wide ? p[0] < L.gx0 - 24 : p[1] < L.gy - L.R - 20);
      var inGraph = L.wide ? p[0] >= L.gx0 - 24 : p[1] >= L.gy - L.R - 20;
      if(!inCircle && !inGraph) return;
      stop();
      drag = inCircle ? 'circle' : 'graph';
      try{ svg.setPointerCapture(e.pointerId); }catch(err){}
      svg.classList.add('is-drag');
      e.preventDefault();
      setTh(fromPoint(p));
    });
    svg.addEventListener('pointermove', function(e){ if(drag) setTh(fromPoint(local(e))); });
    function up(){ if(drag){ drag = null; svg.classList.remove('is-drag'); announce(srText(UC.at(st.th))); } }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    hd.addEventListener('keydown', function(e){
      var k = e.key, t = st.th;
      if(k === 'ArrowRight' || k === 'ArrowUp') t = e.shiftKey ? t + PI / 180 : UC.nextSpecial(t, 1);
      else if(k === 'ArrowLeft' || k === 'ArrowDown') t = e.shiftKey ? t - PI / 180 : UC.nextSpecial(t, -1);
      else if(k === 'PageUp') t += PI / 2; else if(k === 'PageDown') t -= PI / 2;
      else if(k === 'Home') t = 0; else if(k === 'End') t = TAU;
      else return;
      e.preventDefault(); stop(); setTh(t);
    });
    range.addEventListener('input', function(){ stop(); setTh(UC.snap(+range.value, 0.05)); });
    ctl.querySelectorAll('.bt-step').forEach(function(b){
      b.addEventListener('click', function(){ stop(); setTh(UC.nextSpecial(st.th, +b.getAttribute('data-d')), true); });
    });
    ctl.querySelector('.uc-view').addEventListener('click', function(e){
      var b = e.target.closest('.bt-mode'); if(!b) return;
      st.view = b.getAttribute('data-v');
      ctl.querySelectorAll('.uc-view .bt-mode').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
      svg.setAttribute('aria-label', st.view === 'tan' ? 'The unit circle with tan θ as the slope of OP, beside the graph of tangent' : 'The unit circle beside the graphs of sine and cosine');
      draw(); announce(srText(UC.at(st.th)));
    });

    /* ---------------------------------------------------- Play: unroll one turn */
    var DUR = 7, anim = P.loop(function(dt, t){ st.th = TAU * Math.min(1, t / DUR); draw(); }, {
      duration: DUR,
      still: function(){ st.th = TAU; draw(); },
      onEnd: function(){ playing(false); announce('One full turn: θ = 2π. ' + srText(UC.at(st.th))); }
    });
    function playing(on){
      playBtn.setAttribute('aria-pressed', String(on));
      playBtn.innerHTML = (on ? ICON_PAUSE : ICON_PLAY) + '<span>' + (on ? 'Pause' : 'Unroll one turn') + '</span>';
    }
    function stop(){ if(anim.running()){ anim.stop(); playing(false); } }
    playBtn.addEventListener('click', function(){
      if(anim.running()){ stop(); return; }
      if(!st.touched){ st.touched = true; cue.done(); }
      var from = st.th >= TAU - 1e-6 ? 0 : st.th;
      anim.reset(); anim.once(from / TAU * DUR);
      playing(true); anim.start();
      if(!anim.running()) playing(false);
    });

    if(window.ResizeObserver){
      var lastKey = '';
      new ResizeObserver(function(){
        var n = layout(), key = n.wide + ':' + n.H;
        if(key !== lastKey && wrap.clientWidth){ lastKey = key; L = null; drawStatic(); draw(); }
      }).observe(wrap);
    }

    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      s.add('stage', div('pcalc-ls-stage uc-ls-stage', [host.querySelector('.uc-stage')]), o);
      s.add('dock', div('pcalc-ls-dock uc-ls-dock', [ctl]), o);
      var why = div('ls-sec pcalc-ls-why uc-ls-why', [cue.el, say]);
      s.add('why', why, o);
      s.add('details', div('ls-sec pcalc-ls-det uc-ls-det', [det]), o);
      lastCap = ''; L = null;
      drawStatic(); draw();
      if(s.mode() === 'explore') s.hint({ target: hd, text: 'Drag P around the circle', key: 'apprecalc-unit-circle-drag' });
    }
    buildDetails();
    drawStatic(); draw();
    return { pause: stop, studio: studio };
  }

  /* ============================================================ test yourself */
  var METHOD = {
    'radian:theta': 'Radians count the arc in radii: θ = s / r. Divide, then simplify the fraction of π.',
    'radian:quad': 'Compare θ with π/2, π and 3π/2: a quarter, a half and three quarters of a turn.',
    ref: 'The reference angle is the acute angle to the x-axis: π − θ in Quadrant II, θ − π in III, 2π − θ in IV.',
    'coords:cos': 'Draw the reference triangle: cos θ is the horizontal leg, with the sign x has in this quadrant.',
    'coords:sin': 'Draw the reference triangle: sin θ is the vertical leg, with the sign y has in this quadrant.',
    'coords:tan': 'Divide your two coordinates: tan θ = sin θ / cos θ, rise over run.',
    'ray:r': 'r is the distance from the origin: r = √(x² + y²).',
    'ray:sin': 'sin θ = y / r: the y-coordinate over the distance.',
    'ray:cos': 'cos θ = x / r: the x-coordinate over the distance.',
    'ray:tan': 'tan θ = y / x: the slope of the ray.',
    signs: 'Quadrant I: both positive. II: cos negative. III: both negative. IV: sin negative.',
    'values:sin': 'Take sine of the reference angle, then give it the sign y has in this quadrant.',
    'values:cos': 'Take cosine of the reference angle, then give it the sign x has in this quadrant.',
    rc: 'On a circle of radius r the point is (r cos θ, r sin θ): multiply the unit-circle value by r.',
    val: 'Find the point at θ on the unit circle; the graph is its matching coordinate.',
    inc: 'Picture the point turning: on which quarter turn does that coordinate grow?',
    zero: 'The coordinate is 0 where the point sits on an axis.',
    rate: 'First the direction: rising or falling. Then the bend: concave up means the rate of change is increasing.'
  };
  /* The drill figure: a circle (or a ray through a point, or a graph) that
     fills in as each step is answered; a wrong number is drawn dashed. */
  function drillFig(el, p){
    var f = p.fig, done = {}, yours = {}, box = document.createElement('figure');
    box.className = 'cd-fig uc-fig';
    el.appendChild(box);
    var W = 360, Hh = 360, cx = 180, cy = 180;
    function circleSvg(){
      var o = [], R = 124, ray = f.kind === 'ray', a = ray ? null : UC.angle(f.m);
      var t = ray ? Math.atan2(f.y, f.x) : a.theta, c = Math.cos(t), s = Math.sin(t);
      var show = !f.hide || done.theta, Px = cx + R * c, Py = cy - R * s;
      o.push('<line class="uc-axis" x1="18" y1="' + cy + '" x2="342" y2="' + cy + '"/><line class="uc-axis" x1="' + cx + '" y1="18" x2="' + cx + '" y2="342"/>');
      o.push(txt(346, cy - 6, 'x', 'uc-axl', 'end'), txt(cx + 8, 26, 'y', 'uc-axl', 'start'));
      if(f.kind === 'circle' && f.r && p.type === 'values'){
        // the unit circle inside the circle of radius r (not to scale)
        var R0 = 72;
        o.push('<circle class="uc-circle is-r" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/><circle class="uc-circle" cx="' + cx + '" cy="' + cy + '" r="' + R0 + '"/>');
        o.push(txt(cx + R0 * 0.72 + 4, cy + R0 * 0.72 + 14, '1', 'uc-alab', 'start'), txt(cx + R * 0.72 + 4, cy + R * 0.72 + 14, 'r = ' + f.r, 'uc-alab', 'start'));
        if(done.rc){ o.push('<circle class="uc-tpt" cx="' + r1(Px) + '" cy="' + r1(Py) + '" r="6"/>'); o.push(txt(Px + (c >= 0 ? 10 : -10), Py + (s >= 0 ? -10 : 20), '(' + f.r + ' cos θ, ' + f.r + ' sin θ)', 'uc-plab', c >= 0 ? 'start' : 'end')); }
        Px = cx + R0 * c; Py = cy - R0 * s; R = R0;
      } else if(ray){
        o.push('<circle class="uc-circle is-r" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>');
      } else {
        o.push('<circle class="uc-circle" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>');
        if(f.r && p.type === 'radian') o.push(txt(cx + 6, cy + 20, 'radius ' + f.r + ' cm', 'uc-alab', 'start'));
      }
      if(show){
        var tt = t < 0 ? t + 2 * PI : t, big = tt > PI ? 1 : 0;
        o.push('<path class="uc-arc" d="M' + (cx + R) + ' ' + cy + ' A' + R + ' ' + R + ' 0 ' + big + ' 0 ' + r1(cx + R * c) + ' ' + r1(cy - R * s) + '"/>');
        var rr = 26;
        o.push('<path class="uc-amark" d="M' + (cx + rr) + ' ' + cy + ' A' + rr + ' ' + rr + ' 0 ' + big + ' 0 ' + r1(cx + rr * c) + ' ' + r1(cy - rr * s) + '"/>');
        o.push(txt(cx + 40 * Math.cos(tt / 2), cy - 40 * Math.sin(tt / 2) + 5, 'θ', 'uc-thl'));
        if(done.ref || (done.quad && p.type === 'radian')){
          var base = c > 0 ? 0 : PI, ra = 54, s1 = Math.atan2(s, c);
          if(Math.abs(s) > 1e-9 && Math.abs(c) > 1e-9) o.push('<path class="uc-ref is-on" d="M' + cx + ' ' + cy + ' L' + r1(cx + ra * Math.cos(base)) + ' ' + cy + ' A' + ra + ' ' + ra + ' 0 0 ' + ((s > 0) === (c > 0) ? 0 : 1) + ' ' + r1(cx + ra * Math.cos(s1)) + ' ' + r1(cy - ra * Math.sin(s1)) + ' Z"/>');
        }
        if(done.cos || (ray && done.cos)) o.push('<line class="uc-cos" x1="' + cx + '" y1="' + cy + '" x2="' + r1(Px) + '" y2="' + cy + '"/>');
        if(done.sin) o.push('<line class="uc-sin" x1="' + r1(Px) + '" y1="' + cy + '" x2="' + r1(Px) + '" y2="' + r1(Py) + '"/>');
        if(p.type === 'values' && done[p.given.fn]){ var fn = p.given.fn; if(fn === 'cos') o.push('<line class="uc-cos" x1="' + cx + '" y1="' + cy + '" x2="' + r1(Px) + '" y2="' + cy + '"/>'); else o.push('<line class="uc-sin" x1="' + r1(Px) + '" y1="' + cy + '" x2="' + r1(Px) + '" y2="' + r1(Py) + '"/>'); }
        o.push('<line class="uc-rad" x1="' + cx + '" y1="' + cy + '" x2="' + r1(ray ? cx + 1.25 * R * c : Px) + '" y2="' + r1(ray ? cy - 1.25 * R * s : Py) + '"/>');
        o.push('<circle class="uc-pfix" cx="' + r1(Px) + '" cy="' + r1(Py) + '" r="7"/>');
        var lab = ray ? '(' + f.x + ', ' + f.y + ')' : 'P';
        if(!ray && a && done.sin && done.cos) lab = 'P(' + a.cos.text + ', ' + a.sin.text + ')';
        o.push(txt(Px + (c >= 0 ? 12 : -12), Py + (s >= 0 ? -12 : 24), esc(lab), 'uc-plab', c >= 0 ? 'start' : 'end'));
        if(ray && done.r) o.push(txt((cx + Px) / 2 - 10 * s, (cy + Py) / 2 - 10 * c, 'r = ' + f.r, 'uc-lab', 'middle'));
        if(done.tan && (ray || (a && !a.tan.undef))) o.push(txt(cx + R * 0.55 * c + (c >= 0 ? -14 : 14) * Math.abs(s), cy - R * 0.55 * s - 14 * Math.abs(c) - 4, 'slope ' + (ray ? (f.y / f.x > 0 ? '' : '−') + Math.abs(f.y) / gcd(Math.abs(f.y), Math.abs(f.x)) + '/' + Math.abs(f.x) / gcd(Math.abs(f.y), Math.abs(f.x)) : a.tan.text), 'uc-lab uc-c-tan', c >= 0 ? 'end' : 'start'));
        if(done.quad || done.signs){ var q = ray ? 0 : a.quadrant; if(q) o.push(txt(cx + Math.cos(PI / 4 + (q - 1) * PI / 2) * R * 0.6, cy - Math.sin(PI / 4 + (q - 1) * PI / 2) * R * 0.6 + 6, ['', 'I', 'II', 'III', 'IV'][q], 'uc-quad is-on')); }
      }
      // yours, dashed: a coordinate as a line, an angle as a ray
      Object.keys(yours).forEach(function(k){
        var v = yours[k];
        if(!isFinite(v)) return;
        if(k === 'cos' && Math.abs(v) <= 1.4) o.push('<line class="cd-yours" x1="' + r1(cx + R * v) + '" y1="24" x2="' + r1(cx + R * v) + '" y2="336"/>', txt(cx + R * v + 4, 40, 'yours: x = ' + T.numText(v), 'cd-yours cd-mlab', 'start'));
        if(k === 'sin' && Math.abs(v) <= 1.4) o.push('<line class="cd-yours" x1="24" y1="' + r1(cy - R * v) + '" x2="336" y2="' + r1(cy - R * v) + '"/>', txt(28, cy - R * v - 6, 'yours: y = ' + T.numText(v), 'cd-yours cd-mlab', 'start'));
        if((k === 'theta' || k === 'ref') && v > 0 && v < 7) o.push('<line class="cd-yours" x1="' + cx + '" y1="' + cy + '" x2="' + r1(cx + R * 1.12 * Math.cos(v)) + '" y2="' + r1(cy - R * 1.12 * Math.sin(v)) + '"/>', txt(cx + R * 1.16 * Math.cos(v), cy - R * 1.16 * Math.sin(v), 'yours', 'cd-yours cd-mlab', Math.cos(v) >= 0 ? 'start' : 'end'));
      });
      return '<svg class="uc-dsvg" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + esc(figLabel()) + '">' + o.join('') + '</svg>';
    }
    function gcd(a, b){ while(b){ var t = a % b; a = b; b = t; } return a || 1; }
    function graphSvg(){
      var wideFig = (window.innerWidth || 1280) > 999, Wg = wideFig ? 640 : 360, Hg = wideFig ? 400 : 330;
      var fn = f.fn === 'sin' ? Math.sin : Math.cos, G0 = 46, G1 = Wg - 16, R = Math.round((Hg - 110) / 2), gy = R + 60, o = [];
      var gx = function(t){ return G0 + t / TAU * (G1 - G0); }, gv = function(v){ return gy - R * v; };
      [1, -1].forEach(function(v){ o.push('<line class="uc-grid" x1="' + G0 + '" y1="' + gv(v) + '" x2="' + G1 + '" y2="' + gv(v) + '"/>', txt(G0 - 8, gv(v) + 5, v > 0 ? '1' : '−1', 'uc-tk', 'end')); });
      for(var k = 1; k <= 4; k++) o.push('<line class="uc-grid" x1="' + r1(gx(k * PI / 2)) + '" y1="' + (gy - R - 8) + '" x2="' + r1(gx(k * PI / 2)) + '" y2="' + (gy + R + 8) + '"/>');
      o.push('<line class="uc-axis" x1="' + G0 + '" y1="' + gy + '" x2="' + (G1 + 6) + '" y2="' + gy + '"/><line class="uc-axis" x1="' + G0 + '" y1="' + (gy - R - 14) + '" x2="' + G0 + '" y2="' + (gy + R + 14) + '"/>');
      ['0', 'π/2', 'π', '3π/2', '2π'].forEach(function(s, k){ o.push(txt(gx(k * PI / 2), gy + R + 34, s, 'uc-tk')); });
      if(done.inc){ (f.fn === 'sin' ? [[0, PI / 2], [3 * PI / 2, TAU]] : [[PI, 3 * PI / 2], [3 * PI / 2, TAU]]).forEach(function(iv){ o.push('<rect class="uc-band" x="' + r1(gx(iv[0])) + '" y="' + (gy + R + 4) + '" width="' + r1(gx(iv[1]) - gx(iv[0])) + '" height="8" rx="4"/>'); }); o.push(txt(G1, gy + R - 2, 'increasing', 'uc-lab uc-c-ok', 'end')); }
      var d = '';
      for(var i = 0; i <= 200; i++){ var t = TAU * i / 200; d += (i ? 'L' : 'M') + r1(gx(t)) + ' ' + r1(gv(fn(t))); }
      o.push('<path class="uc-trace ' + (f.fn === 'sin' ? 'uc-sin-c' : 'uc-cos-c') + '" d="' + d + '"/>');
      o.push(txt(G1, gv(fn(TAU)) - 10, 'y = ' + f.fn + ' θ', 'uc-lab ' + (f.fn === 'sin' ? 'uc-c-sin' : 'uc-c-cos'), 'end'));
      var Q = [f.q * PI / 2, (f.q + 1) * PI / 2];
      o.push('<rect class="uc-qiv" x="' + r1(gx(Q[0])) + '" y="' + (gy - R - 8) + '" width="' + r1(gx(Q[1]) - gx(Q[0])) + '" height="' + (2 * R + 16) + '"/>');
      if(done.rate){
        var m0 = (Q[0] + Q[1]) / 2;
        [[Q[0], m0], [m0, Q[1]]].forEach(function(h, j){ o.push('<line class="uc-sec" x1="' + r1(gx(h[0])) + '" y1="' + r1(gv(fn(h[0]))) + '" x2="' + r1(gx(h[1])) + '" y2="' + r1(gv(fn(h[1]))) + '"/>'); void j; });
        o.push(txt(gx(m0), gy - R - 14, 'secant slopes on the two halves', 'uc-lab', 'middle'));
      }
      if(done.zero) [0, 1, 2, 3, 4].map(function(k){ return k * PI / 2; }).filter(function(x){ return Math.abs(fn(x)) < 1e-9; }).forEach(function(x){ o.push('<circle class="uc-zero" cx="' + r1(gx(x)) + '" cy="' + gy + '" r="6"/>'); });
      var a = UC.angle(f.m);
      if(done.val){ o.push('<line class="uc-cur" x1="' + r1(gx(a.theta)) + '" y1="' + gy + '" x2="' + r1(gx(a.theta)) + '" y2="' + r1(gv(fn(a.theta))) + '"/><circle class="uc-pfix" cx="' + r1(gx(a.theta)) + '" cy="' + r1(gv(fn(a.theta))) + '" r="6.5"/>', txt(gx(a.theta) + 8, gv(fn(a.theta)) + (fn(a.theta) >= 0 ? -10 : 22), esc('(' + a.text + ', ' + a[f.fn].text + ')'), 'uc-plab', a.theta > PI * 1.4 ? 'end' : 'start')); }
      else o.push('<line class="uc-cur" x1="' + r1(gx(a.theta)) + '" y1="' + (gy - R - 8) + '" x2="' + r1(gx(a.theta)) + '" y2="' + (gy + R + 8) + '"/>', txt(gx(a.theta), gy - R - 14, 'θ = ' + esc(a.text), 'uc-lab'));
      if(isFinite(yours.val) && Math.abs(yours.val) <= 1.4) o.push('<line class="cd-yours" x1="' + G0 + '" y1="' + r1(gv(yours.val)) + '" x2="' + G1 + '" y2="' + r1(gv(yours.val)) + '"/>', txt(G0 + 6, gv(yours.val) - 6, 'yours: ' + T.numText(yours.val), 'cd-yours cd-mlab', 'start'));
      return '<svg class="uc-dsvg" viewBox="0 0 ' + Wg + ' ' + Hg + '" role="img" aria-label="' + esc(figLabel()) + '">' + o.join('') + '</svg>';
    }
    function figLabel(){
      if(f.kind === 'graph') return 'The graph of y = ' + f.fn + ' θ for θ from 0 to 2π, with the interval in the last step shaded.';
      if(f.kind === 'ray') return 'A ray from the origin through the point (' + f.x + ', ' + f.y + ') on a circle of radius ' + f.r + '.';
      return f.hide && !done.theta ? 'A circle of radius ' + f.r + ' centered at the origin.' : 'The unit circle with the terminal ray of θ = ' + UC.angle(f.m).text + ' and the point P.';
    }
    function redraw(){ box.innerHTML = f.kind === 'graph' ? graphSvg() : circleSvg(); }
    redraw();
    return {
      done: function(k){ done[k] = true; delete yours[k]; redraw(); },
      tryOn: function(s, t){
        if(s.kind !== 'num') return false;
        if(t.ok || t.shown){ delete yours[s.key]; return false; }
        var k = s.key, v = t.value;
        if(f.kind === 'graph' && k === 'val'){ yours.val = v; redraw(); return true; }
        if(f.kind !== 'graph' && ['cos', 'sin', 'theta', 'ref'].indexOf(k) > -1 && p.type !== 'ray' && p.type !== 'values'){ yours[k] = v; redraw(); return true; }
        return false;
      }
    };
  }
  function quiz(host, data){
    var fig = null;
    T.drill(host, data, { slug: 'unit-circle', noun: 'drill',
      types: UC.KINDS.map(function(k){ return { value: k, label: UC.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: UC.generate, title: function(p){ return p.title; },
      extra: function(el, p){ fig = drillFig(el, p); },
      onStep: function(s){ if(fig) fig.done(s.key); },
      onTry: function(s, t){ return fig ? fig.tryOn(s, t) : false; },
      method: function(s, p){ return METHOD[p.type + ':' + s.key] || METHOD[s.key]; } });
  }
})();
