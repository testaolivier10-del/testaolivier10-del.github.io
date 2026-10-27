/* Earth and climate trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T3). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.earthClimate (environmental-science/assets/tools/math/earth-climate.js), the
   content environmental-science/data/tools/earth-climate.json (served filtered as
   assets/tool-data/earth-climate.json).

   Explore: four views of one planet, picked with chips; every picture is
   drawn from the model's numbers.
     Seasons      Earth seen side-on with sunlight from the left; the axis
                  tilt seen from the sun is the sun's declination, so the
                  overhead sun sits on the right latitude. A small orbit shows
                  the axis keeping its direction. The noon sky at the chosen
                  latitude (sun height, the beam spread over the ground, day
                  length) and, on wide screens, daily sunlight by latitude.
                  Controls: date, latitude.
     Winds        The globe with its belts and surface winds, and beside it
                  the six circulation cells (Hadley, Ferrel, polar) on a
                  latitude strip. Control: a weather balloon's latitude.
     Rain shadow  Ocean air over a mountain: dry rate to the cloud base, wet
                  rate in the cloud, dry rate down the far side; rain and
                  forest on one side, desert on the other. Controls: height,
                  humidity, "Send the air over" (animated; reduced motion
                  shows the end).
     El Niño      The equatorial Pacific in cross-section: trade winds, the
                  Walker circulation's rising rainy air, warm pool,
                  thermocline and upwelling off Peru. La Niña, neutral, El
                  Niño, or both side by side.
   Test yourself: ApEnvTools.drill over the model's generate(), each problem
   with a figure from its own numbers that never shows the answer before it
   is given. */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath;
  if(!T || !M || !M.earthClimate) return;
  var E = M.earthClimate, esc = T.esc, RAD = Math.PI / 180;
  // The geometry of the last explore picture, for dragging on it.
  var LAST = {};
  function f1(x){ return T.F(x, 1); }
  function f0(x){ return T.F(x, 0); }
  function n2(x){ return (+x).toFixed(1); }
  function txt(x, y, s, cls, anchor, extra){ return '<text class="' + (cls || 'ec-t') + '" x="' + n2(x) + '" y="' + n2(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + (extra || '') + '>' + s + '</text>'; }
  function line(x1, y1, x2, y2, cls){ return '<line class="' + cls + '" x1="' + n2(x1) + '" y1="' + n2(y1) + '" x2="' + n2(x2) + '" y2="' + n2(y2) + '"/>'; }
  /* an arrow from (x1,y1) to (x2,y2) with a solid head of size h */
  function arrow(x1, y1, x2, y2, cls, h, w){
    h = h || 9; var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L, bx = x2 - ux * h, by = y2 - uy * h, k = (w || h * 0.55);
    return '<g class="' + cls + '"><line x1="' + n2(x1) + '" y1="' + n2(y1) + '" x2="' + n2(bx) + '" y2="' + n2(by) + '"/><polygon points="' + n2(x2) + ',' + n2(y2) + ' ' + n2(bx - uy * k) + ',' + n2(by + ux * k) + ' ' + n2(bx + uy * k) + ',' + n2(by - ux * k) + '"/></g>';
  }
  function cloud(x, y, s, cls){
    return '<path class="' + (cls || 'ec-cloud') + '" d="M' + n2(x - 1.6 * s) + ' ' + n2(y + 0.5 * s) + 'a' + n2(0.6 * s) + ' ' + n2(0.6 * s) + ' 0 0 1 ' + n2(0.5 * s) + ' ' + n2(-1.0 * s) + 'a' + n2(0.8 * s) + ' ' + n2(0.8 * s) + ' 0 0 1 ' + n2(1.5 * s) + ' ' + n2(-0.3 * s) + 'a' + n2(0.65 * s) + ' ' + n2(0.65 * s) + ' 0 0 1 ' + n2(1.1 * s) + ' ' + n2(0.8 * s) + 'a' + n2(0.5 * s) + ' ' + n2(0.5 * s) + ' 0 0 1 ' + n2(0.0) + ' ' + n2(1.0 * s) + 'z"/>';
  }
  function rain(x, y, s, n, len){ var o = ''; for(var i = 0; i < n; i++){ var xx = x - s * 1.1 + i * (2.2 * s / Math.max(1, n - 1)); for(var d = 0; d + 10 < len; d += 18) o += line(xx - d * 0.08, y + d + (i % 2) * 7, xx - d * 0.08 - 2, y + d + (i % 2) * 7 + 9, 'ec-rain'); } return o; }
  function sunIcon(x, y, r){ var o = '<g class="ec-sunic"><circle cx="' + n2(x) + '" cy="' + n2(y) + '" r="' + n2(r) + '"/>'; for(var i = 0; i < 8; i++){ var a = i * Math.PI / 4; o += line(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35, x + Math.cos(a) * r * 1.8, y + Math.sin(a) * r * 1.8, ''); } return o + '</g>'; }
  function tag(x, y, s, cls, anchor){
    // a value label with a background pill, so it reads over any picture
    var w = s.replace(/<[^>]+>/g, '').length * 6.9 + 12, x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    x0 = Math.max(4, x0);   // never clipped at the left edge
    return '<g class="ec-tag ' + (cls || '') + '"><rect x="' + n2(x0) + '" y="' + n2(y - 13) + '" width="' + n2(w) + '" height="19" rx="9.5"/>' + txt(x0 + w / 2, y + 1, s, 'ec-tag-t', 'middle') + '</g>';
  }
  function svgWrap(W, H, label, inner){ return '<svg class="ec-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>'; }
  function trop(){ return E.TILT; }

  T.mount('earth-climate', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'earth-climate',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ================================================== the four pictures */

  /* Seasons: the Earth side-on. Sunlight comes from the left; the axis is
     drawn tilted by the declination toward the sun, so the left-most point
     of the globe (where the light hits square on) is at latitude decl. */
  function earthSide(x0, y0, w, h, decl, lat, o){
    o = o || {};
    var R = Math.min(w * 0.33, h * 0.38), cx = x0 + w * 0.6, cy = y0 + h * 0.53, th = decl * RAD, out = [];
    function rot(dx, dy){ return [cx + dx * Math.cos(th) + dy * Math.sin(th), cy - dx * Math.sin(th) + dy * Math.cos(th)]; }
    // sunlight
    for(var k = -4; k <= 4; k++){
      var yy = cy + k * R * 0.22, xe = cx - Math.sqrt(Math.max(0, R * R - (yy - cy) * (yy - cy)));
      out.push(arrow(x0 + 8, yy, xe - 2, yy, 'ec-ray', 7));
    }
    out.push(txt(x0 + 8, cy + R * 0.88 + 22, 'Sunlight', 'ec-t ec-b ec-c-sun'));
    out.push('<circle class="ec-globe" cx="' + n2(cx) + '" cy="' + n2(cy) + '" r="' + n2(R) + '"/>');
    // latitude lines: the tropics, polar circles, equator
    [[90 - trop(), 'polar'], [trop(), 'trop'], [0, 'eq'], [-trop(), 'trop'], [-(90 - trop()), 'polar']].forEach(function(L){
      var p = L[0] * RAD, a = rot(-R * Math.cos(p), -R * Math.sin(p)), b = rot(R * Math.cos(p), -R * Math.sin(p));
      out.push(line(a[0], a[1], b[0], b[1], 'ec-lat ec-lat-' + L[1]));
    });
    // the chosen latitude
    var pl = lat * RAD, A = rot(-R * Math.cos(pl), -R * Math.sin(pl)), B = rot(R * Math.cos(pl), -R * Math.sin(pl));
    out.push(line(A[0], A[1], B[0], B[1], 'ec-lat ec-lat-you'));
    // night half
    out.push('<path class="ec-night" d="M' + n2(cx) + ' ' + n2(cy - R) + 'A' + n2(R) + ' ' + n2(R) + ' 0 0 1 ' + n2(cx) + ' ' + n2(cy + R) + 'Z"/>');
    out.push('<circle class="ec-globe-edge" cx="' + n2(cx) + '" cy="' + n2(cy) + '" r="' + n2(R) + '"/>');
    // axis
    var np = rot(0, -R - 16), sp = rot(0, R + 16);
    out.push(line(sp[0], sp[1], np[0], np[1], 'ec-axis'));
    out.push(txt(np[0] + (decl > 0 ? -4 : 4), np[1] - 5, 'N', 'ec-t ec-b', 'middle'));
    // labels for the equator and tropics on the night side, kept upright
    if(!o.small){
      var lab = function(phi, s){ var q = rot(R * Math.cos(phi * RAD) + 6, -R * Math.sin(phi * RAD)); out.push(txt(q[0], q[1] + 4, s, 'ec-t ec-s ec-halo')); };
      lab(0, 'Equator'); lab(trop(), '23.5°N'); lab(-trop(), '23.5°S');
    }
    // the overhead sun: always the left-most point
    out.push('<circle class="ec-sub" cx="' + n2(cx - R) + '" cy="' + n2(cy) + '" r="5"/>');
    if(!o.hideOverhead) out.push(tag(cx - R - 8, cy + 24, 'Sun overhead ' + E.latText(M.round(decl, 1)), 'ec-tag-sun', 'end'));
    // you
    var ang = E.noonAngle(lat, decl), up = ang > 0;
    if(up){
      out.push(line(x0 + 8, A[1], A[0], A[1], 'ec-ray ec-ray-you'));
      // the local horizon: tangent at A
      var tx = -(A[1] - cy) / R, ty = (A[0] - cx) / R, L2 = Math.min(34, R * 0.5);
      out.push(line(A[0] - tx * L2, A[1] - ty * L2, A[0] + tx * L2, A[1] + ty * L2, 'ec-horizon'));
    }
    out.push('<circle class="ec-you" cx="' + n2(A[0]) + '" cy="' + n2(A[1]) + '" r="6"/>');
    // The tag sits up and to the left of the point, unless that would cover
    // the orbit inset (o.avoid, on a phone near the poles): then below and to
    // the right, on the globe, clear of the inset and the N label.
    var youText = !o.hideAngle ? (up ? 'Noon sun ' + f1(ang) + '°' : 'Sun below horizon') : E.latText(lat);
    var yw = youText.length * 6.9 + 12, av = o.avoid;
    var clash = av && A[1] - 25 < av[3] && A[1] - 6 > av[1] && A[0] - 10 - yw < av[2] && A[0] - 10 > av[0];
    out.push(clash ? tag(A[0] + 8, A[1] + 26, youText, 'ec-tag-you', 'start') : tag(A[0] - 10, A[1] - 12, youText, 'ec-tag-you', 'end'));
    if(!o.quiz) LAST.globe = { cx: cx, cy: cy, R: R, th: th };
    return { svg: out.join(''), R: R, cx: cx, cy: cy };
  }
  /* The orbit seen from above the North Pole: the axis keeps pointing the same
     way (toward the right of the picture's sun at the June solstice). */
  function orbit(x, y, r, day, small, handle){
    LAST.orbit = { x: x, y: y, r: r };
    var a = 2 * Math.PI * (day - 172) / 365, ex = x + Math.cos(a) * r, ey = y - Math.sin(a) * r * 0.62, out = [];
    out.push('<ellipse class="ec-orbit" cx="' + n2(x) + '" cy="' + n2(y) + '" rx="' + n2(r) + '" ry="' + n2(r * 0.62) + '"/>');
    out.push('<circle class="ec-sunball" cx="' + n2(x) + '" cy="' + n2(y) + '" r="' + n2(r * 0.16) + '"/>');
    [['Jun', 0], ['Sep', 90], ['Dec', 180], ['Mar', 270]].forEach(function(m){
      var b = m[1] * RAD; out.push(txt(x + Math.cos(b) * (r + (small ? 14 : 18)), y - Math.sin(b) * (r * 0.62 + 10) + 4, m[0], 'ec-t ec-s ec-muted', 'middle'));
    });
    // explore: Earth is the date handle (drag it around the orbit)
    if(handle) out.push('<circle class="ec-orbit-halo" cx="' + n2(ex) + '" cy="' + n2(ey) + '" r="' + n2(Math.max(11, r * 0.3)) + '"/>');
    out.push('<circle class="ec-earthball" cx="' + n2(ex) + '" cy="' + n2(ey) + '" r="' + n2(Math.max(5, r * 0.12)) + '"/>');
    out.push(arrow(ex, ey, ex - r * 0.3, ey - r * 0.18, 'ec-axisarrow', 5));
    return out.join('');
  }
  /* The noon sky at one latitude: the sun's height, a beam of fixed width and
     its footprint on the ground (1/sin(angle) times wider), the day length. */
  function sky(x0, y0, w, h, ang, dl, ins){
    var out = [], gy = y0 + h - 64, px = x0 + w * 0.6, Rr = Math.min(w * 0.5, (gy - y0) * 0.92);
    out.push('<rect class="ec-skybg" x="' + n2(x0) + '" y="' + n2(y0) + '" width="' + n2(w) + '" height="' + n2(gy - y0) + '" rx="10"/>');
    out.push('<rect class="ec-ground" x="' + n2(x0) + '" y="' + n2(gy) + '" width="' + n2(w) + '" height="14" rx="3"/>');
    out.push(txt(x0 + 10, y0 + 18, 'Noon sky here', 'ec-t ec-b'));
    if(ang > 0){
      var a = ang * RAD, sx = px - Math.cos(a) * Rr, sy = gy - Math.sin(a) * Rr, bw = Math.min(26, w * 0.09), foot = bw / Math.sin(a);
      var nx = -Math.sin(a) * bw / 2, ny = Math.cos(a) * bw / 2;   // half-width across the beam
      var g1 = px - foot / 2, g2 = px + foot / 2;
      out.push('<polygon class="ec-beam" points="' + [sx + nx, sy - ny, sx - nx, sy + ny, g2, gy, g1, gy].map(n2).join(' ').replace(/(\S+) (\S+)( |$)/g, '$1,$2$3') + '"/>');
      out.push('<path class="ec-arc" d="M' + n2(px - 30) + ' ' + n2(gy) + 'A30 30 0 0 1 ' + n2(px - 30 * Math.cos(a)) + ' ' + n2(gy - 30 * Math.sin(a)) + '"/>');
      out.push(txt(px - 38, gy - 8, f1(ang) + '°', 'ec-t ec-b ec-c-you', 'end'));
      out.push(sunIcon(sx, sy, 9));
      out.push(line(g1, gy + 6, g2, gy + 6, 'ec-foot'));
      out.push(txt(x0 + w - 6, gy - 8, 'Beam covers ' + T.F(1 / Math.sin(a), 2) + '× the ground', 'ec-t ec-s ec-halo', 'end'));
    } else {
      out.push(txt(x0 + w / 2, gy - 20, 'The sun does not rise today', 'ec-t ec-b', 'middle'));
    }
    // day length bar
    var by = gy + 50, bx = x0 + 6, bwid = w - 12, d0 = 12 - dl / 2;
    out.push('<rect class="ec-dbar-n" x="' + n2(bx) + '" y="' + n2(by - 8) + '" width="' + n2(bwid) + '" height="10" rx="5"/>');
    if(dl > 0) out.push('<rect class="ec-dbar-d" x="' + n2(bx + bwid * d0 / 24) + '" y="' + n2(by - 8) + '" width="' + n2(bwid * dl / 24) + '" height="10" rx="5"/>');
    out.push(txt(bx, by - 14, 'Daylight ' + f1(dl) + ' h of 24', 'ec-t ec-s ec-b'));
    out.push(txt(bx + 150, by - 14, 'Sunlight ' + f0(ins) + ' W/m²', 'ec-t ec-s ec-b ec-c-sun'));
    return out.join('');
  }
  /* Daily sunlight at the top of the atmosphere by latitude, for the date
     (solid) with the two solstices (dashed). */
  function insChart(x0, y0, w, h, decl, lat){
    var L = x0 + 40, Rt = x0 + w - 48, Tp = y0 + 22, B = y0 + h - 26, out = [];
    LAST.chart = { L: L, R: Rt, T: Tp, B: B };
    function X(l){ return L + (l + 90) / 180 * (Rt - L); }
    function Y(v){ return B - v / 560 * (B - Tp); }
    out.push(txt(x0 + 4, y0 + 12, 'Daily sunlight by latitude (W/m², top of the atmosphere)', 'ec-t ec-s ec-b'));
    [0, 100, 200, 300, 400, 500].forEach(function(v){ out.push(line(L, Y(v), Rt, Y(v), 'ec-grid')); out.push(txt(L - 5, Y(v) + 4, String(v), 'ec-t ec-tk', 'end')); });
    [-90, -60, -30, 0, 30, 60, 90].forEach(function(l){ out.push(txt(X(l), B + 15, l === 0 ? '0°' : Math.abs(l) + '°' + (l > 0 ? 'N' : 'S'), 'ec-t ec-tk', 'middle')); });
    function curve(d, cls){ var p = []; for(var l = -90; l <= 90; l += 2) p.push(n2(X(l)) + ',' + n2(Y(E.insolation(l, d)))); return '<polyline class="' + cls + '" points="' + p.join(' ') + '"/>'; }
    out.push(curve(trop(), 'ec-ins-ref')); out.push(curve(-trop(), 'ec-ins-ref'));
    out.push(curve(decl, 'ec-ins'));
    out.push(line(L, B, Rt, B, 'ec-axisl'));
    var v = E.insolation(lat, decl);
    out.push(line(X(lat), B, X(lat), Y(v), 'ec-guide'));
    out.push('<circle class="ec-you" cx="' + n2(X(lat)) + '" cy="' + n2(Y(v)) + '" r="5"/>');
    return out.join('');
  }

  /* Winds: a globe (latitude by sphere projection) and the cells on a strip
     beside it (latitude even), joined at 0°, 30° and 60°. */
  function windScene(W, H, lat, o){
    o = o || {};
    var phone = W < 560, out = [], R = Math.min(H * 0.44, W * (phone ? 0.3 : 0.26)), cx = R + 14, cy = H / 2;
    var sx0 = cx + R + (phone ? 22 : 40), sx1 = W - (phone ? 6 : 150), st = 22, sb = H - 22;
    /* Drill mode (o.quiz = the steps answered so far): an unlabelled globe with
       only the asked latitude marked; each answer appears once its step is done. */
    var q = o.quiz, end = q && q.cell, show = q ? { rise: q.air || end, belts: q.climate || end, winds: q.wind || end, names: q.cell } : { rise: 1, belts: 1, winds: 1, names: 1 };
    function SY(l){ return st + (90 - l) / 180 * (sb - st); }
    function GY(l){ return cy - R * Math.sin(l * RAD); }
    if(!o.quiz) LAST.wind = { cx: cx, cy: cy, R: R, sx0: sx0, sx1: sx1, st: st, sb: sb };
    // belts on the globe
    out.push('<circle class="ec-globe" cx="' + n2(cx) + '" cy="' + n2(cy) + '" r="' + n2(R) + '"/>');
    out.push('<clipPath id="ec-gclip"><circle cx="' + n2(cx) + '" cy="' + n2(cy) + '" r="' + n2(R) + '"/></clipPath><g clip-path="url(#ec-gclip)">');
    if(show.belts) [[-8, 8, 'wet'], [22, 38, 'dry'], [-38, -22, 'dry'], [52, 68, 'wet'], [-68, -52, 'wet']].forEach(function(b){
      out.push('<rect class="ec-belt-' + b[2] + '" x="' + n2(cx - R) + '" y="' + n2(GY(b[1])) + '" width="' + n2(2 * R) + '" height="' + n2(GY(b[0]) - GY(b[1])) + '"/>');
    });
    out.push('</g>');
    [0, 30, -30, 60, -60].forEach(function(l){ var hw = R * Math.cos(l * RAD); out.push(line(cx - hw, GY(l), cx + hw, GY(l), 'ec-lat' + (l ? '' : ' ec-lat-eq'))); });
    out.push('<circle class="ec-globe-edge" cx="' + n2(cx) + '" cy="' + n2(cy) + '" r="' + n2(R) + '"/>');
    // surface winds: trades toward the equator from the east, westerlies, polar easterlies
    if(show.winds) [[15, -1, 1], [45, 1, -1], [75, -1, 1], [-15, -1, -1], [-45, 1, 1], [-75, -1, -1]].forEach(function(b){
      var l = b[0], y = GY(l), hw = R * Math.cos(l * RAD), n = Math.abs(l) > 70 ? 1 : 2, dx = b[1] * Math.min(36, hw * 0.4), dy = b[2] * Math.min(12, (GY(Math.abs(l) - 10) - GY(Math.abs(l) + 10)) * 0.22);
      for(var i = 0; i < n; i++){ var xx = cx + (n === 1 ? 0 : (i ? 0.4 : -0.4) * hw); out.push(arrow(xx - dx / 2, y - dy / 2, xx + dx / 2, y + dy / 2, 'ec-wind', 10, 5.5)); }
    });
    // the cells on the strip
    var mid = (sx0 + sx1) / 2, cw = sx1 - sx0;
    out.push('<rect class="ec-strip" x="' + n2(sx0) + '" y="' + n2(st) + '" width="' + n2(cw) + '" height="' + n2(sb - st) + '" rx="10"/>');
    out.push(txt(sx0 + 6, st - 6, 'Surface', 'ec-t ec-s ec-muted')); out.push(txt(sx1 - 6, st - 6, 'High up', 'ec-t ec-s ec-muted', 'end'));
    // the probe first, so the cells' labels sit on top of it
    out.push(line(sx0 - 8, SY(lat), sx0 + 12, SY(lat), 'ec-probe') + line(sx1 - 12, SY(lat), sx1 + 8, SY(lat), 'ec-probe'));
    /* Each cell is a loop: up (to the right, "high up") along its rising
       edge, poleward or equatorward aloft, down at its sinking edge, back
       along the surface. rise: the latitude where its air rises. */
    [[0, 30, 'Hadley', 0], [30, 60, 'Ferrel', 60], [60, 90, 'Polar', 60], [-30, 0, 'Hadley', 0], [-60, -30, 'Ferrel', -60], [-90, -60, 'Polar', -60]].forEach(function(c){
      var ytop = SY(c[1]) + 7, ybot = SY(c[0]) - 7, xl = sx0 + 12, xr = sx1 - 12, sel = (lat >= c[0] && lat < c[1]) || (c[1] === 90 && lat >= 90);
      var riseY = SY(c[3]) === SY(c[1]) ? ytop : ybot, sinkY = riseY === ytop ? ybot : ytop, mx = (xl + xr) / 2, my = (ytop + ybot) / 2, aw = Math.min((xr - xl) * 0.18, 30), ah = Math.min((ybot - ytop) * 0.18, 16);
      var dirAloft = sinkY < riseY ? -1 : 1;    // screen direction from the rising edge to the sinking edge
      var g = '<g class="ec-cell' + (sel ? ' is-on' : '') + '"><rect class="ec-cellbox" x="' + n2(xl) + '" y="' + n2(ytop) + '" width="' + n2(xr - xl) + '" height="' + n2(Math.max(4, ybot - ytop)) + '" rx="' + n2(Math.min(14, (ybot - ytop) / 2)) + '"/>';
      if(show.rise){
        g += arrow(mx - aw, riseY, mx + aw, riseY, 'ec-cellarrow', 7);                        // rises: surface to aloft
        g += arrow(xr, my - dirAloft * ah, xr, my + dirAloft * ah, 'ec-cellarrow', 7);        // aloft: toward the sinking edge
        g += arrow(mx + aw, sinkY, mx - aw, sinkY, 'ec-cellarrow', 7);                        // sinks: aloft to surface
        g += arrow(xl, my + dirAloft * ah, xl, my - dirAloft * ah, 'ec-cellarrow', 7);        // surface: back to the rising edge
      }
      g += (show.names ? txt(mx, my + 4, c[2], 'ec-t ec-b ec-celln ec-halo', 'middle') : sel ? txt(mx, my + 4, '?', 'ec-t ec-b ec-celln', 'middle') : '') + '</g>';
      out.push(g);
    });
    // rising and sinking marks, joined to the globe
    [[90, 'sink'], [60, 'rise'], [30, 'sink'], [0, 'rise'], [-30, 'sink'], [-60, 'rise'], [-90, 'sink']].forEach(function(r){
      var y = SY(r[0]);
      if(Math.abs(r[0]) < 90) out.push(line(cx + R * Math.cos(r[0] * RAD), GY(r[0]), sx0, y, 'ec-lead'));
      out.push(txt(sx0 - 4, y + 4, Math.abs(r[0]) + '°', 'ec-t ec-tk', 'end'));
      if(!show.rise) return;
      // "rises"/"sinks" once the air step is done; "rain"/"dry" (and the phone's cloud and sun) once the climate step is
      var wet = show.belts, word = r[1] === 'rise' ? 'Air rises' + (wet ? ': rain' : '') : 'Air sinks' + (wet ? ': dry' : '');
      if(!phone) out.push(txt(sx1 + 10, y + 4, word, 'ec-t ec-s ' + (r[1] === 'rise' ? 'ec-c-wet' : 'ec-c-dry')));
      else if(wet && Math.abs(r[0]) < 90) out.push(r[1] === 'rise' ? cloud(sx1 - 14, y - 2, 5, 'ec-cloud ec-cloud-sm') : sunIcon(sx1 - 12, y, 3.5));
    });
    // the balloon
    var by = GY(lat), bx = cx - R * Math.cos(lat * RAD) - 2;
    out.push('<g class="ec-balloon"><line x1="' + n2(bx) + '" y1="' + n2(by) + '" x2="' + n2(bx - 10) + '" y2="' + n2(by - 12) + '"/><circle cx="' + n2(bx - 13) + '" cy="' + n2(by - 18) + '" r="7"/></g>');
    if(!o.noLabels) out.push(txt(cx, H - 4, 'Surface winds (arrows), wet and dry belts', 'ec-t ec-s ec-muted', 'middle'));
    return out.join('');
  }

  /* Rain shadow: a cross-section; altitude in km on the left. */
  function shadowScene(W, H, S, at, o){
    o = o || {};
    var out = [], L = 40, Rt = W - 10, Tp = 12, B = H - 16, zmax = Math.max(4.5, S.H + 1.8), phone = W < 560;
    function X(u){ return L + u * (Rt - L); }
    function Y(z){ return B - z / zmax * (B - Tp); }
    function ground(u){ var d = (u - 0.52) / 0.17; return S.H * Math.exp(-d * d * 0.9); }
    if(!o.quiz) LAST.shadow = { B: B, Tp: Tp, zmax: zmax };
    function pz(u){ return ground(u) + 0.2 * zmax / 4.5; }
    out.push('<rect class="ec-skybg" x="' + L + '" y="' + Tp + '" width="' + n2(Rt - L) + '" height="' + n2(B - Tp) + '"/>');
    for(var z = 0; z <= zmax + 0.01; z += 1){ out.push(line(L, Y(z), Rt, Y(z), 'ec-grid')); out.push(txt(L - 5, Y(z) + 4, z + ' km', 'ec-t ec-tk', 'end')); }
    // the cloud base
    var up = function(u){ return u < 0.52; };
    if(S.cloud) out.push(line(L, Y(S.lcl), X(0.6), Y(S.lcl), 'ec-cbase'));
    // terrain
    var g = [n2(X(0)) + ',' + n2(B)];
    for(var u = 0; u <= 1.0001; u += 0.01) g.push(n2(X(u)) + ',' + n2(Y(ground(u))));
    g.push(n2(X(1)) + ',' + n2(B));
    out.push('<rect class="ec-sea" x="' + L + '" y="' + n2(B - 2) + '" width="' + n2(X(0.16) - L) + '" height="8"/>');
    out.push('<polygon class="ec-mtn" points="' + g.join(' ') + '"/>');
    // windward: clouds, rain and forest; lee: desert
    if(S.cloud){
      for(var c = 0; c < 4; c++){
        var uc = 0.2 + c * 0.075, zc = Math.max(S.lcl + 0.3, pz(uc) + 0.4);
        if(pz(uc + 0.04) < S.lcl - 0.05 && c < 3) continue;
        out.push(cloud(X(uc), Y(zc), phone ? 8 : 10));
        out.push(rain(X(uc), Y(zc) + 8, phone ? 8 : 10, 4, Math.max(8, Y(ground(uc)) - Y(zc) - 12)));
      }
    }
    for(var t = 0; t < 6; t++){ var ut = 0.2 + t * 0.045, gz = Y(ground(ut)); out.push(S.cloud ? '<path class="ec-tree" d="M' + n2(X(ut)) + ' ' + n2(gz - 14) + 'l6 12h-12z"/>' : '<path class="ec-shrub" d="M' + n2(X(ut) - 4) + ' ' + n2(gz) + 'q4 -8 8 0z"/>'); }
    for(var d = 0; d < 4; d++){ var ud = 0.74 + d * 0.06, gd = Y(ground(ud)); out.push(S.cloud ? '<path class="ec-cactus" d="M' + n2(X(ud)) + ' ' + n2(gd) + 'v-12m0 5h-4v-4m4 2h4v-5"/>' : '<path class="ec-shrub" d="M' + n2(X(ud) - 4) + ' ' + n2(gd) + 'q4 -8 8 0z"/>'); }
    // the air's path
    var path = []; for(var v = 0.05; v <= 0.95; v += 0.01) path.push(n2(X(v)) + ',' + n2(Y(pz(v))));
    out.push('<polyline class="ec-path" points="' + path.join(' ') + '"/>');
    out.push(arrow(X(0.03), Y(pz(0.05)), X(0.1), Y(pz(0.1)), 'ec-wind', 8));
    // temperatures where they change
    var pts = [{ u: 0.06, T: S.T0, s: 'Start ' + f0(S.T0) + ' °C', a: 'start' }];
    if(S.cloud){ var ul = 0.52 - 0.17 * Math.sqrt(Math.log(S.H / Math.max(0.01, S.lcl)) / 0.9); if(isFinite(ul)) pts.push({ u: ul, s: 'Cloud base ' + f1(S.lcl) + ' km, ' + f1(S.Tc) + ' °C', a: 'end', cb: true }); }
    pts.push({ u: 0.52, s: 'Summit ' + f1(S.Ttop) + ' °C', a: 'middle', top: true });
    pts.push({ u: 0.95, s: 'Far side ' + f1(S.Tlee) + ' °C', a: 'end' });
    pts.forEach(function(p){
      var hide = o.hide && ((p.top && o.hide.top) || (p.u > 0.9 && o.hide.lee));
      var y = Y(pz(p.u)) - (p.top ? 14 : 10);
      // the summit on the summit; start, cloud base and far side in a column
      // under the leeward heading, clear of the air's path, the rain and Enlarge
      var txtS = hide ? (p.top ? 'Summit ? °C' : 'Far side ? °C') : p.s;
      if(p.top){ out.push(tag(X(p.u), y, txtS, 'ec-tag-you', 'middle')); return; }
      var row = p.cb ? 1 : p.u > 0.9 ? 2 : 0;
      var colY = Tp + 42 + row * 24, peakY = Y(pz(0.52)) - 14;
      if(phone && Math.abs(colY - peakY) < 22 + 48) colY = peakY + 30 + row * 24;
      out.push(tag(X(0.99), colY, txtS, p.cb ? 'ec-tag-wet' : p.u > 0.9 ? 'ec-tag-you' : '', 'end'));
    });
    if(at != null){
      var pu = 0.05 + at * 0.9;
      out.push('<circle class="ec-parcel" cx="' + n2(X(pu)) + '" cy="' + n2(Y(pz(pu))) + '" r="8"/>');
    }
    out.push(txt(X(0.01), Tp + 16, 'Ocean side (windward)', 'ec-t ec-s ec-b ec-c-wet ec-halo'));
    out.push(txt(X(0.99), Tp + 16, 'Rain shadow (leeward)', 'ec-t ec-s ec-b ec-c-dry ec-halo', 'end'));
    return out.join('');
  }
  /* temperature of the parcel at fraction at (0 to 1) along its path */
  function parcelT(S, at){
    var u = 0.05 + at * 0.9, d = (u - 0.52) / 0.17, z = S.H * Math.exp(-d * d * 0.9);
    if(u <= 0.52){ return z <= S.lcl ? S.T0 - 10 * z : S.Tc - 6 * (z - S.lcl); }
    return S.Ttop + 10 * (S.H - z);
  }

  /* El Niño: the equatorial Pacific, west (Indonesia) to east (Peru). */
  function ensoPanel(x0, y0, w, h, a, uid, o){
    o = o || {};
    var P = E.enso(a), out = [], sea = y0 + h * 0.52, bot = y0 + h - 4, xl = x0 + w * 0.12, xr = x0 + w * 0.9, phone = w < 520;
    function X(u){ return xl + u * (xr - xl); }
    var dS = (bot - sea - 6) / 260;
    function thermo(u){ return sea + dS * (P.dW + (P.dE - P.dW) * Math.pow(u, 1.4)); }
    var warmTo = Math.max(0.08, Math.min(0.92, 0.42 + 0.26 * a));
    out.push('<defs><linearGradient id="' + uid + '-w" x1="0" x2="1" y1="0" y2="0"><stop offset="0" class="ec-sst-hot"/><stop offset="' + n2(Math.max(0.02, warmTo - 0.18)) + '" class="ec-sst-hot"/><stop offset="' + n2(warmTo) + '" class="ec-sst-mid"/><stop offset="' + n2(Math.min(0.99, warmTo + 0.25)) + '" class="ec-sst-cool"/><stop offset="1" class="ec-sst-cool"/></linearGradient></defs>');
    out.push('<rect class="ec-skybg" x="' + n2(x0) + '" y="' + n2(y0) + '" width="' + n2(w) + '" height="' + n2(sea - y0) + '"/>');
    out.push('<rect class="ec-deep" x="' + n2(xl) + '" y="' + n2(sea) + '" width="' + n2(xr - xl) + '" height="' + n2(bot - sea) + '"/>');
    var tp = []; for(var u = 0; u <= 1.0001; u += 0.02) tp.push(n2(X(u)) + ',' + n2(thermo(u)));
    out.push('<polygon fill="url(#' + uid + '-w)" class="ec-warm" points="' + n2(X(0)) + ',' + n2(sea) + ' ' + tp.join(' ') + ' ' + n2(X(1)) + ',' + n2(sea) + '"/>');
    out.push('<polyline class="ec-thermo" points="' + tp.join(' ') + '"/>');
    if(!o.compact || !phone) out.push(txt(X(0.03), thermo(0.03) + 15, 'Thermocline', 'ec-t ec-s ec-on-deep'));
    // land: west (Indonesia, Australia) and east (South America)
    out.push('<path class="ec-land" d="M' + n2(x0) + ' ' + n2(bot) + 'V' + n2(sea - h * 0.05) + 'Q' + n2(x0 + w * 0.06) + ' ' + n2(sea - h * 0.1) + ' ' + n2(xl + 2) + ' ' + n2(sea) + 'V' + n2(bot) + 'Z"/>');
    out.push('<path class="ec-land" d="M' + n2(xr - 2) + ' ' + n2(bot) + 'V' + n2(sea) + 'L' + n2(xr + w * 0.03) + ' ' + n2(sea - h * 0.06) + 'L' + n2(xr + w * 0.06) + ' ' + n2(sea - h * 0.2) + 'L' + n2(x0 + w) + ' ' + n2(sea - h * 0.26) + 'V' + n2(bot) + 'Z"/>');
    out.push(txt(x0 + 4, sea + 16, phone ? 'Indonesia' : 'Indonesia, Australia', 'ec-t ec-s ec-b ec-halo'));
    out.push(txt(x0 + w - 4, sea - h * 0.06 + 16, 'Peru', 'ec-t ec-s ec-b ec-halo', 'end'));
    // upwelling off Peru
    var up = P.upwell, nU = Math.round(up * 2.2);
    for(var k = 0; k < nU; k++){ var ux = X(0.97 - k * 0.07); out.push(arrow(ux, Math.min(bot - 6, thermo(0.97 - k * 0.07) + 26), ux, sea + 6, 'ec-upwell', 7)); }
    var fish = Math.max(0, Math.round((up - 0.35) * 3.2));
    for(var fz = 0; fz < fish; fz++){ var fx = X(0.84 - fz * 0.07), fy = sea + 14 + (fz % 2) * 9; out.push('<path class="ec-fish" d="M' + n2(fx) + ' ' + n2(fy) + 'q6 -5 12 0q-6 5 -12 0zm12 0l5 -4v8z"/>'); }
    // Walker circulation: rising (rain) over rainX, east aloft, sinking in the east, trade winds west at the surface
    var rx = X(P.rainX), top = y0 + Math.max(36, h * 0.14), sinkX = X(Math.min(0.92, Math.max(P.rainX + 0.3, 0.8)));
    var thick = Math.max(0.8, 3.2 * P.trade);
    out.push(cloud(rx, top + 12, phone ? 9 : 12));
    out.push(rain(rx, top + 22, phone ? 9 : 12, 5, sea - top - 30));
    out.push(arrow(rx + 22, top + 2, sinkX - 6, top + 2, 'ec-walker', 7));
    out.push(arrow(sinkX, top + 8, sinkX, sea - 26, 'ec-walker', 7));
    out.push('<g style="stroke-width:' + n2(thick) + 'px">' + arrow(sinkX - 6, sea - 14, rx + 18, sea - 14, 'ec-trade', 6 + thick * 1.5, 3 + thick) + '</g>');
    // the label starts right of the rain, so it never sits on the streaks
    var tl = (P.trade < 0.55 ? 16 : P.trade > 1.4 ? 18 : 11) * 6.6, fits = sinkX - 12 - (rx + 18) >= tl;
    out.push(txt(rx + (phone ? 16 : 20), fits ? sea - 24 : sea + 16, P.trade < 0.55 ? 'Trade winds weak' : P.trade > 1.4 ? 'Trade winds strong' : 'Trade winds', 'ec-t ec-s ec-b ec-halo', 'start'));
    if(sinkX < x0 + w - 30) out.push(sunIcon(sinkX + 18, top + 22, 5));
    // what it means on land
    if(P.state === 'nino'){ out.push(tag(x0 + 4, sea - h * 0.13, 'Drought', 'ec-tag-dry')); out.push(tag(x0 + w - 4, sea - h * 0.3, 'Floods', 'ec-tag-wet', 'end')); }
    if(P.state === 'nina'){ out.push(tag(x0 + 4, sea - h * 0.13, 'Heavy rain', 'ec-tag-wet')); out.push(tag(x0 + w - 4, sea - h * 0.3, 'Dry', 'ec-tag-dry', 'end')); }
    out.push(tag(x0 + 6, y0 + 20, o.title || (P.name + ' (Niño 3.4 ' + (a > 0 ? '+' : a < 0 ? '−' : '') + f1(Math.abs(a)) + ' °C)'), P.state === 'nino' ? 'ec-tag-nino' : P.state === 'nina' ? 'ec-tag-nina' : ''));
    if(!o.compact) out.push(txt(X(0.5), bot - 8, 'Cold deep water', 'ec-t ec-s ec-on-deep', 'middle'));
    return out.join('');
  }

  /* ======================================================= explore */
  var SCENES = [{ id: 'sun', label: 'Seasons' }, { id: 'winds', label: 'Winds' }, { id: 'shadow', label: 'Rain shadow' }, { id: 'enso', label: 'El Niño' }];
  function explore(host, data){
    var X0 = data.explore || {}, LS = null, nid = T.nid('ec'), anim = null, touched = false;
    var st = { scene: 'sun', day: 172, lat: 40, wlat: 15, H: X0.H || 3, rh: X0.rh || 75, T0: X0.T0 || 25, at: null, a: 1.5, cmp: false };
    try{ var m = /scene=(\w+)/.exec(location.hash); if(m && SCENES.some(function(s){ return s.id === m[1]; })) st.scene = m[1]; }catch(e){}
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem ec-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Earth and climate explorer</h2>' +
      '<div class="ec-fig"><svg class="ec-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div class="ec-ctl">' +
        '<div class="ec-scenes ec-chips" role="group" aria-label="View">' + SCENES.map(function(s){ return '<button type="button" class="tchip ec-scene" data-s="' + s.id + '" aria-pressed="false">' + esc(s.label) + '</button>'; }).join('') + '</div>' +
        '<div class="ec-g" data-g="sun"></div><div class="ec-g" data-g="winds"></div><div class="ec-g" data-g="shadow"></div>' +
        '<div class="ec-g" data-g="enso"><div class="ec-enso ec-chips" role="group" aria-label="Pacific conditions">' +
          '<button type="button" class="tchip ec-es" data-a="-1.5" aria-pressed="false">La Niña</button><button type="button" class="tchip ec-es" data-a="0" aria-pressed="false">Neutral</button><button type="button" class="tchip ec-es" data-a="1.5" aria-pressed="false">El Niño</button><button type="button" class="tchip ec-cmp" aria-pressed="false">Side by side</button></div></div>' +
      '</div>' +
      '<div class="ec-say"></div>' +
      T.moreHtml('<div class="ec-more-sun"><p class="bt-small">Jump to a date</p><div class="bt-buttons"><button type="button" class="bt-btn ec-jump" data-d="80">March equinox</button><button type="button" class="bt-btn ec-jump" data-d="172">June solstice</button><button type="button" class="bt-btn ec-jump" data-d="266">September equinox</button><button type="button" class="bt-btn ec-jump" data-d="355">December solstice</button></div></div>' +
        '<div class="ec-more-shadow"></div><div class="ec-more-enso"></div>', 'dates, starting temperature, El Niño strength') +
      '<div class="ec-nums"></div><p class="sr-only ec-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.ec-live'));
    var cue = T.cue('Drag the date through the year and watch the noon sun climb and fall.');
    $('.ec-ctl').insertBefore(cue.el, $('.ec-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    function dateText(d){ return E.dateOf(d).text; }
    var sDay = T.slider({ label: 'Date', min: 1, max: 365, step: 1, value: st.day, onInput: function(v){ st.day = v; act(); draw(); speak(); } });
    var sLat = T.slider({ label: 'Latitude', min: -80, max: 80, step: 1, value: st.lat, onInput: function(v){ st.lat = v; act(); draw(); speak(); } });
    var sW = T.slider({ label: 'Balloon latitude', min: -88, max: 88, step: 1, value: st.wlat, onInput: function(v){ st.wlat = v; act(); draw(); speak(); } });
    var sH = T.slider({ label: 'Mountain height', min: 0.5, max: 5, step: 0.5, value: st.H, unit: 'km', onInput: function(v){ st.H = v; st.at = null; act(); draw(); speak(); } });
    var sRh = T.slider({ label: 'Humidity of the ocean air', min: 30, max: 95, step: 5, value: st.rh, unit: '%', onInput: function(v){ st.rh = v; st.at = null; act(); draw(); speak(); } });
    var sT0 = T.slider({ label: 'Starting temperature', min: 10, max: 32, step: 1, value: st.T0, unit: '°C', onInput: function(v){ st.T0 = v; st.at = null; draw(); speak(); } });
    var sA = T.slider({ label: 'Niño 3.4 anomaly', min: -2.5, max: 2.5, step: 0.1, value: st.a, unit: '°C', onInput: function(v){ st.a = v; st.cmp = false; act(); draw(); speak(); } });
    // the sliders show words, not raw numbers
    function relabel(sl, f){ var o = sl.el.querySelector('output'), inp = sl.input; var up = function(){ o.textContent = f(+inp.value); inp.setAttribute('aria-valuetext', f(+inp.value)); }; inp.addEventListener('input', up); sl.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', up); }); up(); sl.relabel = up; }
    relabel(sDay, dateText); relabel(sLat, E.latText); relabel(sW, E.latText);
    $('[data-g="sun"]').appendChild(sDay.el); $('[data-g="sun"]').appendChild(sLat.el);
    $('[data-g="winds"]').appendChild(sW.el);
    var go = document.createElement('div'); go.className = 'ls-act ec-go';
    go.innerHTML = '<button type="button" class="btn-press sm ls-btn ls-pri ec-send">Send the air over</button>';
    $('[data-g="shadow"]').appendChild(sH.el); $('[data-g="shadow"]').appendChild(sRh.el); $('[data-g="shadow"]').appendChild(go);
    $('.ec-more-shadow').appendChild(sT0.el); $('.ec-more-enso').appendChild(sA.el);
    var svg = $('.ec-svg');
    /* Drag on the picture. Seasons: drag Earth around the orbit inset to set
       the date (the inset is the date control), or drag on the globe or the
       latitude chart to set the latitude. Winds: drag the balloon up and
       down the globe. Rain shadow: drag the mountain's top. */
    var dragMode = null;
    T.dragOn(svg, function(x, y, ph){
      if(ph === 'start'){ stop(); dragMode = null; }
      var g = geo;
      if(st.scene === 'sun'){
        if(ph === 'start'){
          var o = g.orbit, gl = g.globe, ch = g.chart;
          if(o && Math.hypot((x - o.x) / o.r, (y - o.y) / (o.r * 0.62)) < 1.6) dragMode = 'date';
          else if(gl && Math.hypot(x - gl.cx, y - gl.cy) < gl.R * 1.15) dragMode = 'lat';
          else if(ch && x > ch.L - 10 && x < ch.R + 10 && y > ch.T - 10 && y < ch.B + 24) dragMode = 'chart';
          else return false;
        }
        if(dragMode === 'date'){
          var a = Math.atan2(-(y - g.orbit.y) / 0.62, x - g.orbit.x), d = Math.round(172 + a / (2 * Math.PI) * 365);
          d = ((d - 1) % 365 + 365) % 365 + 1;
          if(d !== st.day){ st.day = d; sDay.set(d); sDay.relabel(); act(); draw(); }
        } else if(dragMode === 'lat'){
          var R = g.globe.R, th = g.globe.th, dx = x - g.globe.cx, dy = y - g.globe.cy;
          // undo the tilt: latitude from the height along the axis
          var v = -(dx * Math.sin(th) + dy * Math.cos(th)) / R, lat = Math.round(Math.asin(Math.max(-1, Math.min(1, v))) * 180 / Math.PI);
          lat = Math.max(-80, Math.min(80, lat));
          if(lat !== st.lat){ st.lat = lat; sLat.set(lat); sLat.relabel(); act(); draw(); }
        } else if(dragMode === 'chart'){
          var l2 = Math.max(-80, Math.min(80, Math.round((x - g.chart.L) / (g.chart.R - g.chart.L) * 180 - 90)));
          if(l2 !== st.lat){ st.lat = l2; sLat.set(l2); sLat.relabel(); act(); draw(); }
        }
      } else if(st.scene === 'winds'){
        var w = g.wind; if(!w) return false;
        if(ph === 'start' && x > w.cx + w.R + 8 && !(x > w.sx0 && x < w.sx1)) return false;
        var wl = x > w.sx0 ? Math.round(90 - (y - w.st) / (w.sb - w.st) * 180) : Math.round(Math.asin(Math.max(-1, Math.min(1, (w.cy - y) / w.R))) * 180 / Math.PI);
        wl = Math.max(-88, Math.min(88, wl));
        if(wl !== st.wlat){ st.wlat = wl; sW.set(wl); sW.relabel(); act(); draw(); }
      } else if(st.scene === 'shadow'){
        var sh = g.shadow; if(!sh) return false;
        var hh = Math.max(0.5, Math.min(5, Math.round((sh.B - y) / (sh.B - sh.Tp) * sh.zmax * 2) / 2));
        if(hh !== st.H){ st.H = hh; st.at = null; sH.set(hh); act(); draw(); }
      } else return false;
      if(ph === 'end') speak();
    });

    function S(){ return E.rainShadow({ T0: st.T0, H: st.H, rh: st.rh }); }
    function size(){
      var rc = $('.ec-fig').getBoundingClientRect(), w = Math.round(rc.width) || 640, h = Math.round(rc.height) || 0;
      if(!h || h < 220) h = Math.round(Math.max(300, Math.min(520, w * 0.7)));
      return [Math.max(300, Math.min(1400, w)), Math.min(900, h)];
    }
    function stop(){ if(anim){ anim.stop(); anim = null; } }
    function send(){
      stop(); act();
      var P = window.ApEnvPlot;
      st.at = 0;
      anim = P.loop(function(dt, t){ st.at = Math.min(1, t / 4); draw(); return st.at < 1; }, { duration: 4, still: function(){ st.at = 1; draw(); }, onEnd: function(){ anim = null; st.at = 1; draw(); speak(); } });
      anim.start();
    }
    $('.ec-send').addEventListener('click', send);

    var geo = {};
    function draw(){
      var wh = size(), W = wh[0], H = wh[1], phone = W < 560, inner = '', label = '';
      LAST = {};
      if(st.scene === 'sun'){
        var d = E.declination(st.day), ang = E.noonAngle(st.lat, d), dl = E.dayLength(st.lat, d), ins = E.insolation(st.lat, d);
        if(!phone){
          var ew = W * 0.56;
          var es = earthSide(0, 0, ew, H, d, st.lat);
          inner = es.svg + orbit(ew - 70, 54, 46, st.day, false, true) + sky(ew + 12, 6, W - ew - 16, H * 0.5, ang, dl, ins) + insChart(ew + 6, H * 0.55, W - ew - 10, H * 0.45 - 4, d, st.lat);
        } else {
          var eh = H * 0.56, es2 = earthSide(0, 0, W, eh, d, st.lat, { avoid: [0, 0, 64 + 28 + 26, 36 + 28 * 0.62 + 14] });
          inner = es2.svg + orbit(64, 36, 28, st.day, true, true) + sky(4, eh + 4, W - 8, H - eh - 8, ang, dl, ins);
        }
        label = dateText(st.day) + ': the sun is overhead at ' + E.latText(M.round(d, 1)) + '. At ' + E.latText(st.lat) + ' the noon sun is ' + (ang > 0 ? f1(ang) + '° above the horizon' : 'below the horizon') + ', daylight lasts ' + f1(dl) + ' hours, and daily sunlight at the top of the atmosphere averages ' + f0(ins) + ' W/m².';
      } else if(st.scene === 'winds'){
        inner = windScene(W, H, st.wlat);
        var b = E.band(st.wlat), v = E.verticalAt(st.wlat);
        label = 'Globe with its circulation cells. A balloon at ' + E.latText(st.wlat) + ' is in the ' + b.cell + ' cell; the surface wind is the ' + b.wind.toLowerCase() + (v ? '; air ' + (v === 'rise' ? 'rises, so the climate is wet' : 'sinks, so the climate is dry') : '') + '.';
      } else if(st.scene === 'shadow'){
        var s = S();
        inner = shadowScene(W, H, s, st.at);
        label = 'Air at ' + f0(s.T0) + ' °C and ' + st.rh + '% humidity crosses a ' + f1(s.H) + ' km mountain. ' + (s.cloud ? 'Clouds form at ' + f1(s.lcl) + ' km and rain falls on the ocean side; the summit is ' + f1(s.Ttop) + ' °C and the air reaches the far side at ' + f1(s.Tlee) + ' °C and ' + f0(s.rhLee) + '% humidity: a rain shadow.' : 'The mountain is lower than the cloud base (' + f1(s.lcl) + ' km), so no cloud forms and the air comes down at its starting temperature.');
      } else {
        if(st.cmp){
          var hh = (H - 8) / 2;
          inner = '<g>' + ensoPanel(0, 0, W, hh, -1.5, nid + 'a', { compact: true, title: 'La Niña' }) + '</g><g>' + ensoPanel(0, hh + 8, W, hh, 1.5, nid + 'b', { compact: true, title: 'El Niño' }) + '</g>';
          label = 'La Niña above El Niño. La Niña: strong trade winds, warm water and rain over Indonesia, a shallow thermocline and strong upwelling off Peru. El Niño: weak trade winds, warm water and rain shifted east, a deep thermocline off Peru and little upwelling.';
        } else {
          inner = ensoPanel(0, 0, W, H, st.a, nid + 'c');
          var P = E.enso(st.a);
          label = P.name + ', Niño 3.4 anomaly ' + f1(st.a) + ' °C: trade winds ' + (P.trade < 0.8 ? 'weaker than normal' : P.trade > 1.2 ? 'stronger than normal' : 'normal') + ', upwelling off Peru ' + (P.upwell < 0.8 ? 'weak' : P.upwell > 1.2 ? 'strong' : 'normal') + ', rain centered ' + (P.rainX > 0.35 ? 'over the central Pacific' : 'over Indonesia') + '.';
        }
      }
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('aria-label', label);
      svg.innerHTML = inner;
      geo = LAST; LAST = {};
      words();
    }
    function speak(){ say(svg.getAttribute('aria-label')); }

    /* ---------------------------------------- caption, Why and Details */
    function words(){
      var head = '', why = '', nums = '', pills = [], right = [];
      if(st.scene === 'sun'){
        var d = E.declination(st.day), ang = E.noonAngle(st.lat, d), dl = E.dayLength(st.lat, d), ins = E.insolation(st.lat, d);
        var NH = d > 0.5 ? 'north' : d < -0.5 ? 'south' : '';
        head = dateText(st.day) + ': ' + (NH ? 'the ' + (NH === 'north' ? 'Northern' : 'Southern') + ' Hemisphere leans toward the sun.' : 'neither hemisphere leans toward the sun (near an equinox).') + ' At ' + E.latText(st.lat) + ' the noon sun is ' + (ang > 0 ? f1(ang) + '° up' : 'below the horizon') + ' and the day lasts ' + f1(dl) + ' h.';
        pills = [{ k: 'Noon sun', html: ang > 0 ? f1(ang) + '°' : 'below', tone: 'readout' }];
        right = [{ k: 'Day', html: f1(dl) + ' h', tone: 'readout' }];
        why = '<p><b>The tilt makes the seasons.</b> Earth’s axis is tilted 23.5° and keeps pointing the same way (toward Polaris) all year, as the small orbit shows. In June the Northern Hemisphere leans toward the sun; in December the Southern Hemisphere does.</p>' +
          '<p><b>Two effects, both from the tilt.</b> The hemisphere leaning toward the sun gets a higher noon sun, so each beam lands on less ground (the beam here covers ' + (ang > 0 ? T.F(1 / Math.sin(ang * RAD), 2) : '·') + ' times the area it would from overhead), and its days are longer than 12 hours. More energy per square meter, for more hours: summer.</p>' +
          '<p><b>Not the distance.</b> Earth is closest to the sun in early January, during the Northern Hemisphere’s winter, and the distance changes by only about 3%.</p>' +
          '<p><b>Where the sun is overhead.</b> Only between the Tropic of Cancer (23.5°N) and the Tropic of Capricorn (23.5°S): on the June solstice it is over 23.5°N, at the equinoxes over the equator, on the December solstice over 23.5°S. Noon sun angle = 90° − (degrees between your latitude and the overhead sun).</p>' +
          '<p><b>Insolation by latitude.</b> Averaged over the year the tropics get the most sunlight and the poles the least, which drives the winds and ocean currents that carry heat poleward.</p>';
        nums = '<h3 class="ls-title-l">Today’s numbers</h3><table class="ls-tbl"><tbody>' +
          '<tr><th scope="row">Sun overhead at</th><td class="r">' + E.latText(M.round(d, 1)) + '</td></tr>' +
          '<tr><th scope="row">Noon sun angle</th><td class="r">90 − |' + st.lat + ' − (' + f1(d) + ')| = ' + (ang > 0 ? f1(ang) + '°' : 'below the horizon') + '</td></tr>' +
          '<tr><th scope="row">Day length</th><td class="r">' + f1(dl) + ' h</td></tr>' +
          '<tr><th scope="row">Daily sunlight (top of the atmosphere)</th><td class="r">' + f0(ins) + ' W/m²</td></tr></tbody></table>' +
          '<div class="ec-detchart"></div>';
      } else if(st.scene === 'winds'){
        var b = E.band(st.wlat), v = E.verticalAt(st.wlat), A = Math.abs(st.wlat);
        head = E.latText(st.wlat) + ': ' + b.cell + ' cell, surface wind the ' + b.wind.toLowerCase() + '. ' + (v === 'rise' ? 'Air rises here: clouds and rain.' : v === 'sink' ? 'Air sinks here: dry' + (A > 80 ? ' and cold.' : ', a desert belt.') : 'Air flows along the surface here.');
        pills = [{ k: 'Cell', html: b.cell, tone: 'readout' }, { k: 'Wind', html: b.wind.replace(' winds', ''), tone: 'readout' }];
        right = v ? [{ k: 'Air', html: v === 'rise' ? 'rises: wet' : 'sinks: dry', tone: v === 'rise' ? 'good' : 'warn' }] : [];
        why = '<p><b>Uneven heating starts it.</b> The equator gets the most direct sunlight, so air there warms, rises, cools and drops its water as rain (the rainforest belt). High up it spreads toward the poles.</p>' +
          '<p><b>It sinks near 30°.</b> That air, now dry, sinks near 30°N and 30°S, warming as it is compressed: most of the great deserts (Sahara, Arabian, Australian, Kalahari) lie there. At the surface it flows back toward the equator: one loop is the <b>Hadley cell</b>.</p>' +
          '<p><b>Three cells in each hemisphere.</b> Between 30° and 60° the <b>Ferrel cell</b> turns the other way, with surface air flowing poleward; near 60° it meets cold polar air and rises (rainy, stormy belts). The <b>polar cell</b> sinks at the pole, a cold desert.</p>' +
          '<p><b>Why the winds blow at an angle.</b> Earth turns under moving air, so winds bend to the right in the Northern Hemisphere and to the left in the Southern (the Coriolis effect). Air flowing toward the equator becomes the trade winds from the northeast (north) and southeast (south); air flowing poleward becomes the westerlies. Winds are named for the direction they come from.</p>';
        nums = '<h3 class="ls-title-l">The belts</h3><table class="ls-tbl"><thead><tr><th scope="col">Latitude</th><th scope="col">Cell</th><th scope="col">Surface wind</th><th scope="col">Air</th></tr></thead><tbody>' +
          '<tr><td>0° to 30°</td><td>Hadley</td><td>Trade winds (NE north, SE south)</td><td>Rises at 0°, sinks at 30°</td></tr><tr><td>30° to 60°</td><td>Ferrel</td><td>Westerlies</td><td>Sinks at 30°, rises at 60°</td></tr><tr><td>60° to 90°</td><td>Polar</td><td>Polar easterlies</td><td>Rises at 60°, sinks at the pole</td></tr></tbody></table>';
      } else if(st.scene === 'shadow'){
        var s = S(), run = st.at != null && st.at < 1 ? parcelT(s, st.at) : null;
        head = s.cloud ? (run != null ? 'The air is at ' + f1(run) + ' °C. ' : '') + 'Clouds form at ' + f1(s.lcl) + ' km; the summit is ' + f1(s.Ttop) + ' °C and the far side ' + f1(s.Tlee) + ' °C, ' + f1(s.warmer) + ' °C warmer and drier: a rain shadow.' : 'The cloud base (' + f1(s.lcl) + ' km) is above the summit: no cloud forms, no rain falls, and the air returns at ' + f0(s.T0) + ' °C.';
        pills = [{ k: 'Summit', html: f1(s.Ttop) + ' °C', tone: 'readout' }, { k: 'Far side', html: f1(s.Tlee) + ' °C', tone: 'readout' }];
        right = [{ k: 'Far side RH', html: f0(s.rhLee) + '%', tone: s.cloud ? 'warn' : 'ghost' }];
        why = '<p><b>Rising air cools.</b> Ocean air pushed up a mountain expands and cools about 10 °C per km while it is dry. Moister air reaches its dew point sooner, so a higher humidity gives a lower cloud base.</p>' +
          '<p><b>In the cloud it cools more slowly.</b> Water vapor condenses and releases heat, so the air cools only about 6 °C per km. The water falls as rain or snow on the ocean (windward) side, which grows forests.</p>' +
          '<p><b>Sinking air warms.</b> Past the summit the air, now dry, sinks and warms 10 °C per km all the way down. It arrives warmer and much drier than it started, so the far (leeward) side is a <b>rain shadow</b> desert: Death Valley and the Great Basin behind the Sierra Nevada, the Atacama, Patagonia.</p>';
        nums = '<h3 class="ls-title-l">The air’s trip</h3><table class="ls-tbl"><tbody>' +
          '<tr><th scope="row">Dew point of the ocean air</th><td class="r">' + f1(s.Td) + ' °C</td></tr>' +
          '<tr><th scope="row">Cloud base</th><td class="r">' + (s.cloud ? f1(s.lcl) + ' km, ' + f1(s.Tc) + ' °C' : 'above the summit (' + f1(s.lcl) + ' km)') + '</td></tr>' +
          '<tr><th scope="row">Summit</th><td class="r">' + f1(s.Ttop) + ' °C</td></tr><tr><th scope="row">Far side</th><td class="r">' + f1(s.Tlee) + ' °C, ' + f0(s.rhLee) + '% humidity</td></tr></tbody></table>' +
          '<p class="bt-small">Cloud base from the dew point spread: about 125 m per °C between the temperature and the dew point. Rates rounded as the course uses them (10 °C/km dry, 6 °C/km in cloud).</p>';
      } else {
        var P = E.enso(st.cmp ? 1.5 : st.a);
        head = st.cmp ? 'La Niña above, El Niño below. Compare the trade winds, where the rain falls, the thermocline off Peru and the upwelling.' : P.name + ': ' + (P.state === 'nino' ? 'trade winds weaken, warm water spreads east, upwelling off Peru slows, and the rain moves to the central Pacific.' : P.state === 'nina' ? 'trade winds strengthen, warm water piles up in the west, more cold water upwells off Peru, and Indonesia and Australia get heavy rain.' : 'normal trade winds push warm water west; cold, nutrient-rich water upwells off Peru.');
        pills = st.cmp ? [{ html: 'La Niña vs El Niño', tone: 'readout' }] : [{ k: 'Niño 3.4', html: (st.a > 0 ? '+' : '') + f1(st.a) + ' °C', tone: 'readout' }];
        right = st.cmp ? [] : [{ html: P.name, tone: P.state === 'nino' ? 'warn' : P.state === 'nina' ? 'accent' : 'ghost' }];
        why = '<p><b>Normal years.</b> The trade winds blow west along the equator and pile warm surface water up near Indonesia (the sea there stands about half a meter higher). Warm, moist air rises over that warm pool and rains; it sinks over the cool east Pacific (the Walker circulation). Off Peru, cold, nutrient-rich water upwells and feeds one of the richest fisheries on Earth.</p>' +
          '<p><b>El Niño.</b> The trade winds weaken (or even reverse), warm water sloshes back east, the thermocline off South America deepens and upwelling brings up warm, nutrient-poor water. Plankton and anchovy decline. The rain follows the warm water east: floods in Peru and Ecuador, drought in Indonesia and Australia. Farther away: often a wetter winter in the southern United States and fewer Atlantic hurricanes.</p>' +
          '<p><b>La Niña.</b> The opposite: stronger trade winds, colder water and stronger upwelling off Peru, heavy rain over Indonesia and Australia, often a drier winter in the southern United States and a busier Atlantic hurricane season.</p>' +
          '<p><b>How it is called.</b> NOAA uses the sea surface temperature in the Niño 3.4 region of the central-east Pacific: a 3-month average at least 0.5 °C above normal is El Niño, at least 0.5 °C below is La Niña. Events come every 2 to 7 years and last about 9 to 12 months. Together they are ENSO, the El Niño Southern Oscillation.</p>';
        nums = '<h3 class="ls-title-l">Side by side</h3><table class="ls-tbl"><thead><tr><th scope="col"></th><th scope="col">La Niña</th><th scope="col">El Niño</th></tr></thead><tbody>' +
          '<tr><th scope="row">Trade winds</th><td>Stronger</td><td>Weaker</td></tr><tr><th scope="row">East Pacific surface</th><td>Cooler</td><td>Warmer</td></tr><tr><th scope="row">Upwelling off Peru</th><td>Stronger</td><td>Weaker</td></tr><tr><th scope="row">Fishing off Peru</th><td>Good</td><td>Poor</td></tr><tr><th scope="row">Indonesia, Australia</th><td>Wetter</td><td>Drier, fires</td></tr><tr><th scope="row">Peru, Ecuador</th><td>Drier</td><td>Floods</td></tr><tr><th scope="row">Southern US winter</th><td>Drier</td><td>Wetter</td></tr><tr><th scope="row">Atlantic hurricanes</th><td>More</td><td>Fewer</td></tr></tbody></table>' +
          '<p class="bt-small">Thresholds: NOAA Climate Prediction Center (Oceanic Niño Index). The picture is a sketch; temperatures and depths are typical, not measured.</p>';
      }
      T.explain($('.ec-say'), '<b>' + esc(head) + '</b>', why);
      $('.ec-nums').innerHTML = nums;
      var dc = $('.ec-detchart');
      if(dc){ var d2 = E.declination(st.day); dc.innerHTML = svgWrap(520, 230, 'Daily sunlight by latitude on ' + dateText(st.day) + ', with the two solstices dashed', insChart(0, 0, 520, 230, d2, st.lat)); }
      if(LS){ LS.caption('<b>' + esc(head) + '</b>', 'explore'); LS.pills(pills, 'left', 'explore'); LS.pills(right, 'right', 'explore'); }
      sync();
    }
    function sync(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.ec-scene').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-s') === st.scene)); b.classList.toggle('on', b.getAttribute('data-s') === st.scene); });
      root.querySelectorAll('.ec-g').forEach(function(g){ g.hidden = g.getAttribute('data-g') !== st.scene; });
      root.querySelectorAll('.ec-es').forEach(function(b){ var on = !st.cmp && Math.abs(+b.getAttribute('data-a') - st.a) < 0.05; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      var c = root.querySelector('.ec-cmp'); if(c){ c.setAttribute('aria-pressed', String(st.cmp)); c.classList.toggle('on', st.cmp); }
      ['sun', 'shadow', 'enso'].forEach(function(k){ var el = root.querySelector('.ec-more-' + k); if(el) el.hidden = k !== st.scene; });
      cue.el.querySelector('.bt-cue-t').textContent = ({ sun: 'Drag the date through the year and watch the noon sun climb and fall.', winds: 'Move the balloon from the equator to the pole.', shadow: 'Send the air over the mountain, then make the mountain taller.', enso: 'Switch between La Niña and El Niño, then compare them side by side.' })[st.scene];
    }
    function onClick(e){
      var b = e.target.closest('.ec-scene');
      if(b){ stop(); st.scene = b.getAttribute('data-s'); act(); if(st.scene === 'shadow') st.at = null; draw(); speak(); return; }
      var es = e.target.closest('.ec-es');
      if(es){ st.a = +es.getAttribute('data-a'); st.cmp = false; sA.set(st.a); act(); draw(); speak(); return; }
      if(e.target.closest('.ec-cmp')){ st.cmp = !st.cmp; act(); draw(); speak(); return; }
      var j = e.target.closest('.ec-jump');
      if(j){ st.day = +j.getAttribute('data-d'); sDay.set(st.day); sDay.relabel(); act(); draw(); speak(); }
    }
    host.addEventListener('click', onClick);

    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.ec-fig')], dock: [$('.ec-ctl')], primary: [sDay.el, sW.el, go, $('.ec-enso')], why: [$('.ec-say')], details: [$('.ec-nums')] });
      host.removeEventListener('click', onClick);
      s.root.addEventListener('click', onClick);
      draw();
      // The hint points at the control it names; the picture is draggable too.
      if(s.mode() === 'explore'){
        var ht = ({ sun: [sDay.input, 'Start here: drag the date, or Earth around its orbit'], winds: [sW.input, 'Start here: drag the balloon up the globe'], shadow: [$('.ec-send'), 'Start here: Send the air over'], enso: [$('.ec-cmp'), 'Start here: try Side by side'] })[st.scene];
        s.hint({ target: ht[0], text: ht[1] });
      }
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ if(!anim) draw(); }, 60); }).observe($('.ec-fig')); }
      window.addEventListener('resize', function(){ if(!anim) draw(); });
    }
    draw();
    return { stop: stop, studio: studio };
  }

  /* ================================================== test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'earth-climate', noun: 'drill',
      generate: function(r, ctx, type){ return E.generate(r, ctx, type); },
      types: [{ value: 'sun', label: 'Noon sun angle' }, { value: 'seasons', label: 'What causes the seasons' }, { value: 'cells', label: 'Winds and cells' }, { value: 'shadow', label: 'Rain shadow temperatures' }, { value: 'enso', label: 'El Niño or La Niña' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { sun: 'How high is the noon sun?', seasons: 'What makes the season?', cells: 'Which cell, which wind?', shadow: 'Over the mountain', enso: 'El Niño, La Niña or neutral?' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); }
    });
  }
  /* The drill's figure, from the problem's own numbers; an answer appears
     only after its step is done. */
  function figure(el, p, st){
    var g = p.figure, phone = (window.innerWidth || 1280) <= 640, W = phone ? 360 : 620, H = phone ? 330 : 330, inner = '', label = '';
    if(!g){ el.innerHTML = ''; return; }
    if(g.kind === 'sun'){
      var es = earthSide(0, 0, W, H, g.decl, g.lat, { hideAngle: !st.angle, small: phone });
      inner = es.svg; label = 'Earth side-on with sunlight from the left: the sun is overhead at ' + E.latText(g.decl) + ', and the place is marked at ' + E.latText(g.lat) + (st.angle ? '; its noon sun is ' + f1(g.angle) + '° up.' : '.');
    } else if(g.kind === 'seasons'){
      var day = g.month === 6 ? 196 : 15;
      inner = orbit(W / 2, H / 2 + 4, Math.min(W * 0.36, H * 0.58), day, phone) + txt(W / 2, 18, 'Seen from above the North Pole; the arrow is the axis tilt', 'ec-t ec-s ec-muted', 'middle');
      label = 'Earth’s orbit seen from above, with Earth in ' + (g.month === 6 ? 'July' : 'January') + ' and its axis tilt drawn as an arrow that keeps its direction.';
    } else if(g.kind === 'cells'){
      inner = windScene(W, H, g.lat, { noLabels: true, quiz: st });
      label = 'A globe and its three circulation cells on each side, with a balloon at ' + E.latText(g.lat) + (st.cell ? '; every cell, wind and belt now labeled.' : '; the labels appear as you answer.');
    } else if(g.kind === 'shadow'){
      var S0 = { T0: g.T0, H: g.H, lcl: g.hc, cloud: true, Tc: g.T0 - 10 * g.hc, Ttop: g.T0 - 10 * g.hc - 6 * (g.H - g.hc) };
      S0.Tlee = S0.Ttop + 10 * g.H;
      inner = shadowScene(W, H, S0, null, { hide: { top: !st.top, lee: !st.lee } });
      label = 'Air at ' + g.T0 + ' °C crosses a ' + g.H + ' km mountain with clouds forming at ' + g.hc + ' km' + (st.top ? '; the summit is ' + f1(S0.Ttop) + ' °C' : '') + (st.lee ? '; the far side ' + f1(S0.Tlee) + ' °C' : '') + '.';
    } else if(g.kind === 'enso'){
      var vals = p.given.vals, L = 46, Rt = W - 14, Tp = 30, B = H - 34;
      var Y = function(v){ return Tp + (2.5 - v) / 5 * (B - Tp); }, bw = (Rt - L) / 3;
      var o = [txt(L, 16, 'Niño 3.4 anomaly (°C), invented data', 'ec-t ec-s ec-muted')];
      [-2, -1, 0, 1, 2].forEach(function(v){ o.push(line(L, Y(v), Rt, Y(v), v ? 'ec-grid' : 'ec-axisl')); o.push(txt(L - 6, Y(v) + 4, (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v), 'ec-t ec-tk', 'end')); });
      if(st.mean){ o.push('<rect class="ec-band-nino" x="' + L + '" y="' + n2(Y(2.5)) + '" width="' + n2(Rt - L) + '" height="' + n2(Y(0.5) - Y(2.5)) + '"/><rect class="ec-band-nina" x="' + L + '" y="' + n2(Y(-0.5)) + '" width="' + n2(Rt - L) + '" height="' + n2(Y(-2.5) - Y(-0.5)) + '"/>'); o.push(txt(Rt - 4, Y(2.3), 'El Niño (+0.5 or more)', 'ec-t ec-s ec-c-nino', 'end')); o.push(txt(Rt - 4, Y(-2.2), 'La Niña (−0.5 or less)', 'ec-t ec-s ec-c-nina', 'end')); }
      vals.forEach(function(v, i){ var x = L + bw * i + bw * 0.25; o.push('<rect class="' + (v >= 0 ? 'ec-bar-w' : 'ec-bar-c') + '" x="' + n2(x) + '" y="' + n2(Math.min(Y(v), Y(0))) + '" width="' + n2(bw * 0.5) + '" height="' + n2(Math.abs(Y(v) - Y(0))) + '"/>'); o.push(txt(x + bw * 0.25, B + 16, 'Month ' + (i + 1), 'ec-t ec-tk', 'middle')); });
      if(st.mean){ o.push(line(L, Y(p.given.mean), Rt, Y(p.given.mean), 'ec-meanline')); o.push(tag(L + 6, Y(p.given.mean) - 8, 'Average ' + T.F(p.given.mean, 2) + ' °C', 'ec-tag-you')); }
      inner = o.join(''); label = 'Bar chart of three monthly Niño 3.4 anomalies: ' + vals.map(function(v){ return T.F(v, 1); }).join(', ') + ' °C' + (st.mean ? '; average ' + T.F(p.given.mean, 2) + ' °C with the ±0.5 °C thresholds shaded.' : '.');
    }
    el.innerHTML = '<figure class="cd-fig ec-qfig">' + svgWrap(W, H, label, inner) + '</figure>';
  }
})();
