/* Air pollution trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T3). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.airPollution (environmental-science/assets/tools/math/air-pollution.js), the
   content environmental-science/data/tools/air-pollution.json (served filtered as
   assets/tool-data/air-pollution.json).

   Explore, two views:
     Smog day    A city in a valley at the chosen hour (sky color, sun or
                 moon, traffic, a brown NO2 haze and an ozone haze whose
                 strength is the model's value at that hour), the temperature
                 profile with the inversion lid when it is on, and under it
                 the day's NO, NO2, O3 and VOC curves with a clock cursor.
                 Controls: the clock (play runs the day; reduced motion shows
                 the end), Inversion on/off; More options: traffic, cloudy.
     Acid rain   A power plant's SO2 and NOx, the rain's pH, a lake on
                 granite or limestone, and the animals that live at its pH
                 (EPA's tolerance chart). Controls: emissions, bedrock.
   Test yourself: ApEnvTools.drill over the model's generate(). */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath;
  if(!T || !M || !M.airPollution) return;
  var A = M.airPollution, esc = T.esc;
  function n2(x){ return (+x).toFixed(1); }
  function f0(x){ return T.F(x, 0); }
  function f1(x){ return T.F(x, 1); }
  function txt(x, y, s, cls, anchor){ return '<text class="' + (cls || 'ap-t') + '" x="' + n2(x) + '" y="' + n2(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + s + '</text>'; }
  function line(x1, y1, x2, y2, cls){ return '<line class="' + cls + '" x1="' + n2(x1) + '" y1="' + n2(y1) + '" x2="' + n2(x2) + '" y2="' + n2(y2) + '"/>'; }
  var SP = [{ k: 'NO', label: 'NO', cls: 'ap-no' }, { k: 'NO2', label: 'NO₂', cls: 'ap-no2' }, { k: 'O3', label: 'O₃', cls: 'ap-o3' }, { k: 'VOC', label: 'VOCs', cls: 'ap-voc' }];

  T.mount('air-pollution', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'air-pollution',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* =================================================== the city scene */
  function mix(a, b, t){ return a.map(function(v, i){ return Math.round(v + (b[i] - v) * t); }); }
  function rgb(c, a){ return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')'; }
  var NIGHT = [20, 28, 52], DAWN = [242, 170, 120], DAY = [140, 196, 236];
  function skyColor(h){
    var s = A.sunAt(h);
    if(s <= 0) return NIGHT;
    if(s < 0.25) return mix(mix(NIGHT, DAWN, Math.min(1, s / 0.12)), DAY, Math.max(0, (s - 0.12) / 0.13));
    return DAY;
  }
  function cityScene(x0, y0, w, h, st, day, o){
    o = o || {};
    var out = [], hr = st.hour, sun = A.sunAt(hr) * (st.cloudy ? 0.3 : 1), sky = skyColor(hr), gy = y0 + h * 0.8, phone = w < 520;
    var no2 = day.at('NO2', hr), o3 = day.at('O3', hr), lid = st.inversion ? y0 + h * 0.36 : null;
    out.push('<clipPath id="ap-clip"><rect x="' + n2(x0) + '" y="' + n2(y0) + '" width="' + n2(w) + '" height="' + n2(h) + '" rx="12"/></clipPath><g clip-path="url(#ap-clip)">');
    out.push('<rect x="' + n2(x0) + '" y="' + n2(y0) + '" width="' + n2(w) + '" height="' + n2(h) + '" fill="' + rgb(sky) + '"/>');
    // sun or moon on an arc
    var sp = (hr - 6) / 13;
    if(sp > 0 && sp < 1){
      var sx = x0 + w * (0.08 + 0.84 * sp), sy = gy - Math.sin(Math.PI * sp) * h * 0.62;
      out.push('<circle class="ap-sunglow" cx="' + n2(sx) + '" cy="' + n2(sy) + '" r="' + n2(26) + '"/><circle class="ap-sun" cx="' + n2(sx) + '" cy="' + n2(sy) + '" r="13"/>');
      if(st.cloudy) for(var c = 0; c < 3; c++) out.push('<ellipse class="ap-ovc" cx="' + n2(x0 + w * (0.2 + c * 0.3)) + '" cy="' + n2(y0 + h * (0.15 + (c % 2) * 0.06)) + '" rx="' + n2(w * 0.2) + '" ry="' + n2(h * 0.07) + '"/>');
    } else {
      var mp = ((hr + 24 - 19) % 24) / 11, mx = x0 + w * (0.1 + 0.8 * mp), my = gy - Math.sin(Math.PI * Math.min(1, mp)) * h * 0.5;
      out.push('<circle class="ap-moon" cx="' + n2(mx) + '" cy="' + n2(my) + '" r="10"/><circle cx="' + n2(mx + 4) + '" cy="' + n2(my - 3) + '" r="9" fill="' + rgb(sky) + '"/>');
      for(var s = 0; s < 14; s++) out.push('<circle class="ap-star" cx="' + n2(x0 + ((s * 97) % 100) / 100 * w) + '" cy="' + n2(y0 + ((s * 53) % 60) / 100 * h * 0.8) + '" r="1.1"/>');
    }
    // mountains around the valley
    out.push('<path class="ap-mtn" d="M' + n2(x0) + ' ' + n2(gy) + 'L' + n2(x0) + ' ' + n2(y0 + h * 0.42) + 'L' + n2(x0 + w * 0.12) + ' ' + n2(y0 + h * 0.3) + 'L' + n2(x0 + w * 0.24) + ' ' + n2(y0 + h * 0.5) + 'L' + n2(x0 + w * 0.3) + ' ' + n2(gy) + 'Z"/>');
    out.push('<path class="ap-mtn" d="M' + n2(x0 + w) + ' ' + n2(gy) + 'L' + n2(x0 + w) + ' ' + n2(y0 + h * 0.38) + 'L' + n2(x0 + w * 0.86) + ' ' + n2(y0 + h * 0.26) + 'L' + n2(x0 + w * 0.74) + ' ' + n2(y0 + h * 0.48) + 'L' + n2(x0 + w * 0.68) + ' ' + n2(gy) + 'Z"/>');
    // buildings: a hazy far skyline, then the downtown in front, each tower
    // with a lit side, window rows (lit at night) and a roof detail
    var bx = x0 + w * 0.18, bwid = w * 0.64, n = phone ? 9 : 13;
    for(var fb = 0; fb < n + 3; fb++){
      var fw = bwid / (n + 3) * 0.9, fh = h * (0.18 + ((fb * 53) % 19) / 100), fx = bx - w * 0.02 + fb * (bwid + w * 0.04) / (n + 3);
      out.push('<rect class="ap-bldg-far" x="' + n2(fx) + '" y="' + n2(gy - fh) + '" width="' + n2(fw) + '" height="' + n2(fh) + '"/>');
    }
    // a few street trees between the towers
    for(var tr = 0; tr < (phone ? 3 : 5); tr++){ var tx = x0 + w * (0.26 + tr * (phone ? 0.22 : 0.12)), ty = gy - 2; out.push('<g class="ap-tree"><rect x="' + n2(tx - 1.2) + '" y="' + n2(ty - 8) + '" width="2.4" height="8"/><circle cx="' + n2(tx) + '" cy="' + n2(ty - 12) + '" r="6"/></g>'); }
    for(var b = 0; b < n; b++){
      var bw = bwid / n * 0.82, bh2 = h * (0.12 + ((b * 37) % 23) / 100), xx = bx + b * bwid / n, top2 = gy - bh2;
      out.push('<rect class="ap-bldg" x="' + n2(xx) + '" y="' + n2(top2) + '" width="' + n2(bw) + '" height="' + n2(bh2) + '"/>');
      out.push('<rect class="ap-bldg-lit" x="' + n2(xx) + '" y="' + n2(top2) + '" width="' + n2(bw * 0.28) + '" height="' + n2(bh2) + '"/>');
      if(b % 3 === 0) out.push('<line class="ap-mast" x1="' + n2(xx + bw * 0.6) + '" y1="' + n2(top2) + '" x2="' + n2(xx + bw * 0.6) + '" y2="' + n2(top2 - 9) + '"/>');
      else if(b % 3 === 1) out.push('<rect class="ap-bldg" x="' + n2(xx + bw * 0.25) + '" y="' + n2(top2 - 4) + '" width="' + n2(bw * 0.5) + '" height="4"/>');
      var night = sun < 0.15;
      for(var wy = top2 + 6; wy < gy - 6; wy += 9) for(var wx = xx + 3; wx < xx + bw - 4; wx += 6) if(!night || ((wx * 7 + wy * 3) | 0) % 3) out.push('<rect class="' + (night ? 'ap-win' : 'ap-win-d') + '" x="' + n2(wx) + '" y="' + n2(wy) + '" width="2.5" height="3.5"/>');
    }
    // the inversion lid: a warm layer drawn as a band
    if(lid != null){
      out.push('<rect class="ap-lid" x="' + n2(x0) + '" y="' + n2(lid - 14) + '" width="' + n2(w) + '" height="28"/>');
      out.push(txt(x0 + w - 8, lid + 4, 'Warm layer (inversion lid)', 'ap-t ap-s ap-b ap-on-lid ap-halo', 'end'));
    }
    // haze: NO2 brown, ozone pale, filling the mixed layer
    var top = lid != null ? lid : y0 + h * 0.1, hz = Math.min(0.75, no2 / 160), oz = Math.min(0.6, o3 / 220);
    out.push('<defs><linearGradient id="ap-haze" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8a5a2b" stop-opacity="' + hz.toFixed(2) + '"/><stop offset="1" stop-color="#8a5a2b" stop-opacity="0"/></linearGradient><linearGradient id="ap-oz" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#9fb6a8" stop-opacity="' + oz.toFixed(2) + '"/><stop offset="1" stop-color="#9fb6a8" stop-opacity="0"/></linearGradient></defs>');
    out.push('<rect x="' + n2(x0) + '" y="' + n2(top) + '" width="' + n2(w) + '" height="' + n2(gy - top) + '" fill="url(#ap-oz)"/>');
    out.push('<rect x="' + n2(x0) + '" y="' + n2(top + (gy - top) * 0.25) + '" width="' + n2(w) + '" height="' + n2((gy - top) * 0.75) + '" fill="url(#ap-haze)"/>');
    // road and cars (density from traffic)
    out.push('<rect class="ap-road" x="' + n2(x0) + '" y="' + n2(gy) + '" width="' + n2(w) + '" height="' + n2(h * 0.2) + '"/>');
    var cars = Math.round(A.trafficAt(hr) * st.cars * (phone ? 9 : 14));
    for(var k = 0; k < cars; k++){
      var cx = x0 + ((k * 61 + 13) % 100) / 100 * w, cy = gy + h * (k % 2 ? 0.12 : 0.05);
      out.push('<g class="ap-car"><rect x="' + n2(cx) + '" y="' + n2(cy) + '" width="14" height="6" rx="2"/><circle cx="' + n2(cx + 3) + '" cy="' + n2(cy + 6) + '" r="1.8"/><circle cx="' + n2(cx + 11) + '" cy="' + n2(cy + 6) + '" r="1.8"/></g>');
      if(k % 3 === 0) out.push('<circle class="ap-exh" cx="' + n2(cx - 3) + '" cy="' + n2(cy + 2) + '" r="3"/>');
    }
    out.push('</g>');
    // clock
    var hh = Math.floor(hr), ap = hh >= 12 ? 'p.m.' : 'a.m.';
    out.push('<g class="ap-tag"><rect x="' + n2(x0 + 8) + '" y="' + n2(y0 + 8) + '" width="' + (phone ? 98 : 112) + '" height="24" rx="12"/>' + txt(x0 + 8 + (phone ? 49 : 56), y0 + 25, A.clock(hr), 'ap-t ap-b ap-tag-t', 'middle') + '</g>');
    if(!o.noRead) out.push('<g class="ap-tag"><rect x="' + n2(x0 + w - (phone ? 120 : 150)) + '" y="' + n2(y0 + 8) + '" width="' + (phone ? 112 : 142) + '" height="24" rx="12"/>' + txt(x0 + w - (phone ? 64 : 79), y0 + 25, 'O₃ ' + f0(o3) + ' ppb', 'ap-t ap-b ap-tag-t ap-c-o3', 'middle') + '</g>');
    return out.join('');
  }
  /* temperature with height, the inversion's warm layer marked */
  function profile(x0, y0, w, h, on){
    var P = A.inversionProfile(on), out = [], L = x0 + 46, R = x0 + w - 10, Tp = y0 + 30, B = y0 + h - 22;
    function X(t){ return L + (t - 0) / 18 * (R - L); }
    function Y(z){ return B - z / 1200 * (B - Tp); }
    out.push(txt(x0 + 2, y0 + 14, 'Temperature with height', 'ap-t ap-s ap-b'));
    [0, 400, 800, 1200].forEach(function(z){ out.push(line(L, Y(z), R, Y(z), 'ap-grid')); out.push(txt(L - 4, Y(z) + 4, z + ' m', 'ap-t ap-tk', 'end')); });
    [0, 6, 12, 18].forEach(function(t){ out.push(txt(X(t), B + 14, t + '°', 'ap-t ap-tk', 'middle')); });
    if(on) out.push('<rect class="ap-lidband" x="' + n2(L) + '" y="' + n2(Y(P.top)) + '" width="' + n2(R - L) + '" height="' + n2(Y(P.lid) - Y(P.top)) + '"/>' + txt(L + 6, Y(P.lid) - 6, 'Warm layer: a lid', 'ap-t ap-s ap-b ap-on-lid'));
    else out.push(txt(R - 4, Tp + 12, 'Cooler with height: air mixes', 'ap-t ap-s ap-muted', 'end'));
    out.push('<polyline class="ap-prof" points="' + P.pts.map(function(p){ return n2(X(p[1])) + ',' + n2(Y(p[0])); }).join(' ') + '"/>');
    out.push(line(L, B, R, B, 'ap-axisl'));
    return out.join('');
  }
  /* the day's curves */
  function curves(x0, y0, w, h, day, hr, o){
    o = o || {};
    // kept clear of the stage's rounded corners: every axis label inside
    var out = [], L = x0 + 44, R = x0 + w - 26, Tp = y0 + 24, B = y0 + h - 30, ymax = o.ymax || Math.max(80, niceMax(Math.max(day.peaks.NO.value, day.peaks.NO2.value, day.peaks.O3.value) * 1.1));
    function X(t){ return L + t / 24 * (R - L); }
    function Y(v){ return B - v / ymax * (B - Tp); }
    // night shading
    out.push('<rect class="ap-nightbg" x="' + n2(L) + '" y="' + n2(Tp) + '" width="' + n2(X(6) - L) + '" height="' + n2(B - Tp) + '"/><rect class="ap-nightbg" x="' + n2(X(19)) + '" y="' + n2(Tp) + '" width="' + n2(R - X(19)) + '" height="' + n2(B - Tp) + '"/>');
    var step = ymax <= 100 ? 20 : ymax <= 200 ? 50 : 100;
    for(var v = 0; v <= ymax + 0.1; v += step){ out.push(line(L, Y(v), R, Y(v), 'ap-grid')); out.push(txt(L - 4, Y(v) + 4, String(v), 'ap-t ap-tk', 'end')); }
    [0, 6, 12, 18].forEach(function(t){ out.push(txt(X(t), B + 15, t === 0 ? '12 a.m.' : t === 12 ? 'noon' : (t > 12 ? t - 12 + ' p.m.' : t + ' a.m.'), 'ap-t ap-tk', t === 0 ? 'start' : 'middle')); });
    out.push(txt(L, y0 + 12, 'ppb', 'ap-t ap-tk'));
    var legendN = 0;
    (o.species || SP).forEach(function(s, i){
      if(s.k === 'VOC' && !o.voc) return;
      var pts = []; for(var j = 0; j < day.hours.length; j += 2) pts.push(n2(X(day.hours[j])) + ',' + n2(Y(Math.min(ymax, day[s.k][j] * (s.k === 'VOC' ? 0.5 : 1)))));
      out.push('<polyline class="ap-curve ' + s.cls + (o.mono ? ' ap-mono' + i : '') + '" points="' + pts.join(' ') + '"/>');
      // a legend row above the plot, so no label sits on a curve or the clock line
      var lx = R - (3 - legendN) * (w < 520 ? 70 : 84) - (o.voc ? (w < 520 ? 70 : 84) : 0); legendN++;
      out.push('<g class="ap-peaklab ' + s.cls + '">' + line(lx - 22, y0 + 8, lx - 6, y0 + 8, 'ap-curve ' + s.cls + (o.mono ? ' ap-mono' + i : '')) + txt(lx - 2, y0 + 12, o.labels ? o.labels[s.k] : s.label, 'ap-t ap-b ap-cl') + '</g>');
    });
    out.push(line(L, B, R, B, 'ap-axisl'));
    if(hr != null){
      out.push(line(X(hr), Tp - 4, X(hr), B, 'ap-cursor'));
      ['NO', 'NO2', 'O3'].forEach(function(k){ out.push('<circle class="ap-dot ' + SP.filter(function(s){ return s.k === k; })[0].cls + '" cx="' + n2(X(hr)) + '" cy="' + n2(Y(Math.min(ymax, day.at(k, hr)))) + '" r="4.5"/>'); });
    }
    return out.join('');
  }
  function niceMax(v){ var p = Math.pow(10, Math.floor(Math.log10(v))), m = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; for(var i = 0; i < m.length; i++) if(v <= m[i] * p) return m[i] * p; return 10 * p; }

  /* ============================================================ acid rain */
  function acidScene(W, H, st){
    var out = [], phone = W < 560, f = st.load, rain = A.rainPH(f), lake = A.lakePH(rain, st.lime), gy = H * (phone ? 0.44 : 0.52);
    out.push('<rect class="ap-acidsky" x="0" y="0" width="' + W + '" height="' + n2(gy) + '"/>');
    // the power plant and its plume
    var px = W * 0.08, pw = W * 0.14;
    out.push('<rect class="ap-bldg" x="' + n2(px) + '" y="' + n2(gy - 40) + '" width="' + n2(pw) + '" height="40"/><rect class="ap-stack" x="' + n2(px + pw * 0.62) + '" y="' + n2(gy - 100) + '" width="' + n2(pw * 0.2) + '" height="60"/>');
    var cx = W * 0.62, cy = gy * 0.34, sx = px + pw * 0.72, sy = gy - 104;
    for(var i = 0; i < 9; i++){ var t = i / 8, qx = sx + (cx - 70 - sx) * t, qy = sy - Math.sin(t * Math.PI * 0.5) * (sy - cy - 10); out.push('<circle class="ap-plume" cx="' + n2(qx) + '" cy="' + n2(qy) + '" r="' + n2(6 + t * 16) + '" opacity="' + (0.1 + 0.55 * f).toFixed(2) + '"/>'); }
    out.push(txt(px + pw / 2, gy + 16, 'Power plant', 'ap-t ap-s', 'middle'));
    out.push(txt(sx + 10, sy + 4, phone ? 'SO₂, NOx' : 'SO₂ and NOx', 'ap-t ap-s ap-b ap-halo', 'start'));
    // cloud and rain
    out.push('<path class="ap-raincloud" d="M' + n2(cx - 70) + ' ' + n2(cy + 16) + 'a22 22 0 0 1 18 -34a32 32 0 0 1 58 -10a26 26 0 0 1 48 16a18 18 0 0 1 0 28z"/>');
    for(var r = 0; r < 12; r++){ var rx = cx - 60 + r * 11, ry = cy + 24 + (r % 3) * 10; out.push('<line class="ap-drop" x1="' + n2(rx) + '" y1="' + n2(ry) + '" x2="' + n2(rx - 4) + '" y2="' + n2(ry + 14) + '" style="stroke:' + phColor(rain) + '"/>'); }
    out.push('<g class="ap-tag"><rect x="' + n2(cx - 54) + '" y="' + n2(cy - 46) + '" width="108" height="24" rx="12"/>' + txt(cx, cy - 29, 'Rain pH ' + f1(rain), 'ap-t ap-b ap-tag-t', 'middle') + '</g>');
    // ground, bedrock, lake
    out.push('<rect class="' + (st.lime ? 'ap-lime' : 'ap-granite') + '" x="0" y="' + n2(gy) + '" width="' + W + '" height="' + n2(H - gy) + '"/>');
    out.push(txt(8, H - 8, st.lime ? 'Limestone bedrock (buffers acid)' : 'Granite bedrock (no buffer)', 'ap-t ap-s ap-on-rock'));
    // the lake: wide and deep, its animals drawn in it at the lowest pH each survives
    var lx = phone ? W * 0.03 : W * 0.3, lw = phone ? W * 0.94 : W * 0.67, ly = gy + 1, D = Math.min((H - gy) * 0.66, H - gy - (phone ? 66 : 54));
    out.push(lakeAnimals(lx, ly, lw, D, lake, phone, true));
    return out.join('');
  }
  /* The lake with its animals (EPA tolerance chart): each at the x of the
     lowest pH it survives, faded and crossed out when the lake is more acidic
     than that; the lake's pH is a line across the same scale, the ruler under
     the lake. Rows keep neighbors' names apart at 390 px. */
  var ANIMAL_ROW = { Snails: 0, Clams: 1, Bass: 0, Mayfly: 1, Crayfish: 2, Salamanders: 0, Trout: 1, Perch: 1, Frogs: 0 };
  function lakeAnimals(lx, ly, lw, D, lake, phone, ruler){
    var out = [], c = lx + lw / 2;
    function X(ph){ return lx + lw * (0.09 + (6.5 - ph) / 2.5 * 0.82); }
    out.push('<path class="ap-lake" style="fill:' + phColor(lake) + '" d="M' + n2(lx) + ' ' + n2(ly) + ' C' + n2(lx + lw * 0.05) + ' ' + n2(ly + D * 0.9) + ' ' + n2(lx + lw * 0.12) + ' ' + n2(ly + D) + ' ' + n2(c) + ' ' + n2(ly + D) + ' C' + n2(lx + lw * 0.88) + ' ' + n2(ly + D) + ' ' + n2(lx + lw * 0.95) + ' ' + n2(ly + D * 0.9) + ' ' + n2(lx + lw) + ' ' + n2(ly) + 'Z"/>');
    out.push('<path class="ap-lakesurf" d="M' + n2(lx + 4) + ' ' + n2(ly + 1) + ' L' + n2(lx + lw - 4) + ' ' + n2(ly + 1) + '"/>');
    var sc = phone ? 1 : 1.45, rowH = Math.min(62, (D - 30 * sc) / 3), xl = Math.max(lx + 6, Math.min(lx + lw - 6, X(lake)));
    // the lake's pH across the scale
    out.push(line(xl, ly + 3, xl, ly + D + (ruler ? 12 : 0), 'ap-phline'));
    var edgeOk = null, edgeGone = null;
    A.TOLERANCE.forEach(function(a){ if(lake >= a.ph){ if(!edgeOk || a.ph > edgeOk.ph) edgeOk = a; } else if(!edgeGone || a.ph < edgeGone.ph) edgeGone = a; });
    A.TOLERANCE.forEach(function(a){
      var named = (edgeOk && a.ph === edgeOk.ph) || (edgeGone && a.ph === edgeGone.ph);   // the animals at the lake's edge: the next to go, the last lost
      var ok = lake >= a.ph, x = X(a.ph), y = ly + 12 * sc + 6 + (ANIMAL_ROW[a.name] || 0) * rowH;
      out.push('<g class="ap-ani' + (ok ? '' : ' is-gone') + '"><title>' + esc(a.name) + ': lives down to pH ' + a.ph.toFixed(1) + '</title><g transform="translate(' + n2(x) + ' ' + n2(y) + ') scale(' + sc + ')">' + (ANIMAL_ART[a.name] || '') + '</g>' +
        (named ? txt(x, y + 12 * sc + 9, esc(a.name), 'ap-t ap-ani-t' + (phone ? ' is-sm' : '') + ' ap-halo', 'middle') : '') +
        (ok ? '' : line(x - 9 * sc, y - 7 * sc, x + 9 * sc, y + 7 * sc, 'ap-ani-x') + line(x - 9 * sc, y + 7 * sc, x + 9 * sc, y - 7 * sc, 'ap-ani-x')) + '</g>');
    });
    out.push('<g class="ap-tag"><rect x="' + n2(Math.min(lx + lw - 106, Math.max(lx, xl - 52))) + '" y="' + n2(ly - 30) + '" width="104" height="24" rx="12"/>' + txt(Math.min(lx + lw - 54, Math.max(lx + 52, xl)), ly - 13, 'Lake pH ' + f1(lake), 'ap-t ap-b ap-tag-t', 'middle') + '</g>');
    if(ruler){
      var ry = ly + D + 14;
      out.push(line(X(6.5), ry, X(4), ry, 'ap-ruler'));
      [6.5, 6, 5.5, 5, 4.5, 4].forEach(function(v){ out.push(line(X(v), ry - 4, X(v), ry + 4, 'ap-ruler') + (false ? '' : txt(X(v), ry + 17, String(v), 'ap-t ap-tk ap-on-rock', 'middle'))); });
      out.push(txt(X(4) + 10, ry + 4, phone ? 'pH' : 'pH', 'ap-t ap-s ap-b ap-on-rock'));
    }
    return out.join('');
  }
  /* Small animals, each about 30 × 18, centered on 0,0. */
  function fishArt(body, fin, mark){ return '<path d="M-15 0 C-9 -9 7 -9 11 0 C7 9 -9 9 -15 0Z" style="fill:' + body + '"/><path d="M10 0 L18 -7 L16 0 L18 7Z" style="fill:' + fin + '"/><path d="M-4 -6 L2 -11 L5 -6Z" style="fill:' + fin + '"/>' + (mark || '') + '<circle cx="-10" cy="-1.5" r="1.4" class="ap-eye"/>'; }
  var ANIMAL_ART = {
    Snails: '<path d="M-14 7 C-14 3 -6 2 4 3 L13 5 L14 8 L-14 8Z" style="fill:#C9A27A"/><circle cx="-1" cy="-1" r="8" style="fill:#B5652E"/><path d="M-1 -1 m-5 0 a5 5 0 1 0 5 -5 a3 3 0 1 0 3 4" style="fill:none;stroke:#F2D3B0;stroke-width:1.4"/><path d="M12 4 L15 -3 M10 4 L12 -3" style="stroke:#8A6A48;stroke-width:1.2"/>',
    Clams: '<path d="M-13 5 C-13 -10 13 -10 13 5Z" style="fill:#D8CBB0;stroke:#8F7E5E;stroke-width:1"/><path d="M-13 5 L13 5 C9 9 -9 9 -13 5Z" style="fill:#BBA982"/><path d="M0 -6 L0 5 M-6 -4 L-4 5 M6 -4 L4 5" style="stroke:#8F7E5E;stroke-width:.9"/>',
    Bass: fishArt('#5E8C3A', '#3F6A22', '<path d="M-12 0 L9 0" style="stroke:#2E4F18;stroke-width:1.6;stroke-dasharray:3 2"/>'),
    Trout: fishArt('#9DB0A0', '#7A8E7D', '<path d="M-12 1 L9 1" style="stroke:#E07A7A;stroke-width:2"/><circle cx="-3" cy="-4" r=".9" style="fill:#3D3D3D"/><circle cx="3" cy="-3" r=".9" style="fill:#3D3D3D"/><circle cx="0" cy="4" r=".9" style="fill:#3D3D3D"/>'),
    Perch: fishArt('#E2B53B', '#D2683A', '<path d="M-6 -6 L-6 6 M-1 -7 L-1 7 M4 -6 L4 6" style="stroke:#55612A;stroke-width:1.8"/>'),
    Crayfish: '<path d="M-6 -2 C-6 -6 8 -6 9 -2 C8 2 -6 2 -6 -2Z" style="fill:#B8432E"/><path d="M9 -3 L15 -5 L15 1 L9 -1Z" style="fill:#9A3424"/><path d="M-6 -3 L-12 -9 L-16 -6 L-12 -5Z M-6 -1 L-12 4 L-16 2 L-12 0Z" style="fill:#B8432E"/><path d="M-2 1 L-4 6 M2 1 L1 6 M5 1 L5 6" style="stroke:#8A2E1E;stroke-width:1.2"/>',
    Mayfly: '<path d="M-8 0 C-8 -3 6 -3 8 0 C6 3 -8 3 -8 0Z" style="fill:#7D6A4A"/><circle cx="-9" cy="0" r="2.6" style="fill:#6A583A"/><path d="M8 0 L16 -4 M8 0 L17 0 M8 0 L16 4 M-4 2 L-6 6 M0 2 L0 6 M3 2 L5 6 M-4 -2 L-6 -6 M0 -2 L0 -6" style="stroke:#5A4A30;stroke-width:1"/>',
    Salamanders: '<path d="M-14 0 C-12 -4 -6 -3 0 -3 C6 -3 10 -1 16 2 C10 1 6 3 0 3 C-6 3 -12 4 -14 0Z" style="fill:#2F2F35"/><circle cx="-6" cy="-1" r="1.3" style="fill:#F2C230"/><circle cx="2" cy="0" r="1.3" style="fill:#F2C230"/><circle cx="8" cy="0" r="1.1" style="fill:#F2C230"/><path d="M-8 2 L-10 7 M-8 -2 L-10 -7 M4 2 L6 7 M4 -2 L6 -7" style="stroke:#2F2F35;stroke-width:1.6;stroke-linecap:round"/>',
    Frogs: '<path d="M-10 3 C-10 -6 10 -6 10 3 C6 7 -6 7 -10 3Z" style="fill:#4E9A3C"/><circle cx="-5" cy="-5" r="3" style="fill:#4E9A3C"/><circle cx="5" cy="-5" r="3" style="fill:#4E9A3C"/><circle cx="-5" cy="-5.5" r="1.3" class="ap-eye"/><circle cx="5" cy="-5.5" r="1.3" class="ap-eye"/><path d="M-10 4 L-15 8 L-11 8 M10 4 L15 8 L11 8" style="stroke:#3A7A2C;stroke-width:1.8;fill:none;stroke-linejoin:round"/>'
  };
  function phColor(ph){ var t = Math.max(0, Math.min(1, (ph - 4) / 3.6)); return rgb(mix([214, 120, 60], [70, 140, 200], t)); }

  /* ======================================================= explore */
  function explore(host, data){
    var LS = null, nid = T.nid('ap'), anim = null, touched = false;
    var st = { view: 'smog', hour: 8, inversion: false, cars: 1, cloudy: false, voc: false, load: 0.6, lime: false };
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem ap-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Air pollution explorer</h2>' +
      '<div class="ap-fig"><svg class="ap-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div class="ap-ctl">' +
        '<div class="ap-views ls-seg" role="group" aria-label="View"><button type="button" class="ap-view" data-v="smog" aria-pressed="true">Smog day</button><button type="button" class="ap-view" data-v="acid" aria-pressed="false">Acid rain</button></div>' +
        '<div class="ap-g" data-g="smog"><div class="ap-row"></div><div class="ap-btns ls-act"><button type="button" class="btn-press sm ls-btn ls-pri ap-play">Play the day</button><button type="button" class="tchip ap-inv" aria-pressed="false">Inversion</button></div></div>' +
        '<div class="ap-g" data-g="acid" hidden><div class="ap-row2"></div><div class="ap-rock ap-chips" role="group" aria-label="Bedrock"><button type="button" class="tchip ap-r" data-r="0" aria-pressed="true">Granite</button><button type="button" class="tchip ap-r" data-r="1" aria-pressed="false">Limestone</button></div></div>' +
      '</div>' +
      '<div class="ap-say"></div>' +
      T.moreHtml('<div class="ap-more"></div>', 'traffic, clouds, VOC curve') +
      '<div class="ap-nums"></div><p class="sr-only ap-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.ap-live'));
    var cue = T.cue('Drag the clock (or drag across the picture) from morning to night and watch ozone build after the rush hour.');
    $('.ap-ctl').insertBefore(cue.el, $('.ap-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var sH = T.slider({ label: 'Time of day', min: 0, max: 23.5, step: 0.5, value: st.hour, onInput: function(v){ stop(); st.hour = v; act(); draw(); speak(); } });
    var sCars = T.slider({ label: 'Traffic', min: 0.25, max: 1.5, step: 0.25, value: 1, onInput: function(v){ st.cars = v; draw(); speak(); } });
    var sLoad = T.slider({ label: 'SO₂ and NOx from the plant', min: 0, max: 1, step: 0.05, value: st.load, onInput: function(v){ st.load = v; act(); draw(); speak(); } });
    function relabel(sl, f){ var o = sl.el.querySelector('output'), inp = sl.input, up = function(){ o.textContent = f(+inp.value); inp.setAttribute('aria-valuetext', f(+inp.value)); }; inp.addEventListener('input', up); sl.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', up); }); up(); sl.relabel = up; }
    relabel(sH, A.clock); relabel(sCars, function(v){ return Math.round(v * 100) + '%'; }); relabel(sLoad, function(v){ return v === 0 ? 'none' : Math.round(v * 100) + '% of 1970s levels'; });
    $('.ap-row').appendChild(sH.el); $('.ap-row2').appendChild(sLoad.el);
    $('.ap-more').appendChild(sCars.el);
    $('.ap-more').insertAdjacentHTML('beforeend', '<label class="bt-radio"><input type="checkbox" class="ap-cloud"> A cloudy day (less sunlight)</label><label class="bt-radio"><input type="checkbox" class="ap-vocck"> Show the VOC curve (half scale)</label>');
    var svg = $('.ap-svg');
    // Drag across the picture: the smog day scrubs the clock (the scene and
    // the curves share one time axis); acid rain sets the plant's output.
    T.dragOn(svg, function(x, y, ph){
      var W = svg.viewBox.baseVal.width || 640;
      if(ph === 'start') stop();
      if(st.view === 'smog'){
        var h = Math.max(0, Math.min(23.5, Math.round((x - 44) / (W - 70) * 48) / 2));
        if(h !== st.hour || ph === 'start'){ st.hour = h; sH.set(h); sH.relabel(); act(); draw(); }
      } else {
        var v = Math.max(0, Math.min(1, Math.round((x - W * 0.08) / (W * 0.84) * 20) / 20));
        if(v !== st.load || ph === 'start'){ st.load = v; sLoad.set(v); sLoad.relabel(); act(); draw(); }
      }
      if(ph === 'end') speak();
    });
    function day(){ return A.smogDay({ cars: st.cars, cloudy: st.cloudy, inversion: st.inversion }); }
    function size(){ var rc = $('.ap-fig').getBoundingClientRect(), w = Math.round(rc.width) || 640, h = Math.round(rc.height) || 0; if(!h || h < 240) h = Math.round(Math.max(320, Math.min(560, w * 0.7))); return [Math.max(300, Math.min(1400, w)), Math.min(900, h)]; }
    function stop(){ if(anim){ anim.stop(); anim = null; var b = $('.ap-play'); if(b) b.textContent = 'Play the day'; } }
    function play(){
      if(anim){ stop(); return; }
      act(); var start = st.hour >= 23 ? 0 : st.hour;
      $('.ap-play').textContent = 'Pause';
      anim = window.ApEnvPlot.loop(function(dt, t){ st.hour = Math.min(23.5, start + t * 2.2); sH.set(st.hour); sH.relabel(); draw(); return st.hour < 23.5; },
        { duration: (23.5 - start) / 2.2, still: function(){ st.hour = 14; sH.set(14); sH.relabel(); draw(); }, onEnd: function(){ anim = null; var b = $('.ap-play'); if(b) b.textContent = 'Play the day'; speak(); } });
      anim.start();
    }
    function draw(){
      var wh = size(), W = wh[0], H = wh[1], phone = W < 560, inner, label;
      if(st.view === 'smog'){
        var d = day();
        if(!phone){
          // pass 2: the temperature profile appears when the inversion is switched on, to show the lid
          var sw = st.inversion ? W * 0.64 : W, sh = H * 0.52;
          inner = cityScene(0, 0, sw, sh, st, d, { noRead: true }) + (st.inversion ? profile(sw + 10, 0, W - sw - 10, sh, true) : '') + curves(0, sh + 6, W, H - sh - 6, d, st.hour, { voc: st.voc });
        } else {
          var sh2 = H * 0.46;
          inner = cityScene(0, 0, W, sh2, st, d, { noRead: true }) + curves(0, sh2 + 4, W, H - sh2 - 4, d, st.hour, { voc: st.voc });
        }
        label = A.clock(st.hour) + (st.inversion ? ', inversion on' : '') + (st.cloudy ? ', cloudy' : '') + ': NO ' + f0(d.at('NO', st.hour)) + ', NO₂ ' + f0(d.at('NO2', st.hour)) + ', ozone ' + f0(d.at('O3', st.hour)) + ' ppb. Today NO peaks at ' + A.clock(d.peaks.NO.hour) + ', NO₂ at ' + A.clock(d.peaks.NO2.hour) + ' and ozone at ' + A.clock(d.peaks.O3.hour) + ' (' + f0(d.peaks.O3.value) + ' ppb).';
      } else {
        inner = acidScene(W, H, st);
        var rain = A.rainPH(st.load), lake = A.lakePH(rain, st.lime), gone = A.TOLERANCE.filter(function(a){ return lake < a.ph; }).map(function(a){ return a.name.toLowerCase(); });
        label = 'Rain pH ' + f1(rain) + ' falls on a lake over ' + (st.lime ? 'limestone' : 'granite') + '; the lake’s pH is ' + f1(lake) + '. ' + (gone.length ? 'Too acidic for ' + gone.join(', ') + '.' : 'Every animal in the chart can live here.');
      }
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('aria-label', label); svg.innerHTML = inner;
      words();
    }
    function speak(){ say(svg.getAttribute('aria-label')); }
    function words(){
      var head, why, nums, pills = [], right = [];
      if(st.view === 'smog'){
        var d = day(), h = st.hour, no = d.at('NO', h), no2 = d.at('NO2', h), o3 = d.at('O3', h), pk = d.peaks;
        var phase = h < 6 ? 'Night: no sunlight, so no new ozone; NO from late traffic has used most of it up.' : h < 9.5 ? 'Morning rush: engines pour out NO (and VOCs). Not much ozone yet.' : h < 12 ? 'Late morning: NO is being turned into NO₂, the brown haze, and sunlight starts splitting NO₂ to make ozone.' : h < 16.5 ? 'Afternoon: strong sunlight and the morning’s NO₂ and VOCs make ozone peak.' : h < 19.5 ? 'Evening: the sun is lower and the evening rush adds NO, which destroys ozone.' : 'After sunset: ozone falls; no light, and NO reacts with it.';
        head = A.clock(h) + ': ' + phase.charAt(0).toLowerCase() + phase.slice(1);
        // pass 2: ozone is the readout; NO and NO2 now are in Numbers & setup and on the curves
        pills = [{ k: 'O₃', html: f0(o3) + ' ppb', tone: 'accent' }];
        right = st.inversion ? [{ html: 'Inversion: trapped', tone: 'warn' }] : [];
        why = '<p><b>Primary, then secondary.</b> Car engines and power plants emit NO (a primary pollutant) and VOCs (from gasoline and solvents). In the air NO becomes NO₂, the reddish-brown gas in the haze. Sunlight splits NO₂: NO₂ + light → NO + O, and O + O₂ → O₃. Ozone is a secondary pollutant: no one emits it.</p>' +
          '<p><b>Why ozone waits until afternoon.</b> NO destroys ozone (NO + O₃ → NO₂ + O₂), so in the morning rush any ozone is used up. As the sunny morning goes on, VOCs make radicals that turn NO into NO₂ without using ozone, so ozone piles up, peaking in the early afternoon (today at ' + A.clock(pk.O3.hour) + '). At night there is no light to make it and fresh NO removes it.</p>' +
          '<p><b>What makes it worse.</b> Sunny, hot, still days; heavy traffic; and a thermal inversion, which traps the pollutants near the ground. Fewer cars, cleaner engines (catalytic converters cut NOx and CO), and vapor recovery for VOCs make it better.</p>' +
          '<p><b>Thermal inversion.</b> Normally air cools with height, so warm polluted air near the ground rises and mixes away. In an inversion a layer of warm air sits on top of cooler, denser air, which cannot rise through it: the warm layer is a lid. Valleys and basins on calm, clear nights are most at risk.</p>' +
          '<p><b>Not the ozone layer.</b> Ground-level ozone is harmful to breathe and to plants. The ozone layer, 15 to 35 km up in the stratosphere, protects us from UV light and is thinned by CFCs, a different problem.</p>';
        nums = '<h3 class="ls-title-l">At ' + A.clock(h) + '</h3><p>NO ' + f0(no) + ' ppb, NO₂ ' + f0(no2) + ' ppb, O₃ ' + f0(o3) + ' ppb</p><h3 class="ls-title-l">Today’s peaks</h3><table class="ls-tbl"><thead><tr><th scope="col">Pollutant</th><th scope="col">Kind</th><th scope="col">Peak</th><th scope="col">At</th></tr></thead><tbody>' +
          '<tr><th scope="row">NO</th><td>Primary</td><td class="r">' + f0(pk.NO.value) + ' ppb</td><td>' + A.clock(pk.NO.hour) + '</td></tr><tr><th scope="row">NO₂</th><td>Primary and secondary</td><td class="r">' + f0(pk.NO2.value) + ' ppb</td><td>' + A.clock(pk.NO2.hour) + '</td></tr><tr><th scope="row">O₃</th><td>Secondary</td><td class="r">' + f0(pk.O3.value) + ' ppb</td><td>' + A.clock(pk.O3.hour) + '</td></tr><tr><th scope="row">VOCs</th><td>Primary</td><td class="r">' + f0(pk.VOC.value) + ' ppb</td><td>' + A.clock(pk.VOC.hour) + '</td></tr></tbody></table>' +
          '<p class="bt-small">The U.S. ozone standard is 70 ppb (8-hour average, EPA). Concentrations here come from a simple model and are illustrative.</p>' +
          '<h3 class="ls-title-l">Fixes, matched to the pollutant</h3><table class="ls-tbl"><tbody>' + ['NOx', 'SO2', 'PM', 'VOC', 'CO'].map(function(k){ var P = A.POLL[k]; return '<tr><th scope="row">' + esc(P.name) + '</th><td>' + esc(P.fix) + '</td></tr>'; }).join('') + '</tbody></table>';
      } else {
        var rain = A.rainPH(st.load), lake = A.lakePH(rain, st.lime), gone = A.TOLERANCE.filter(function(a){ return lake < a.ph; });
        // pass 2: the rain's and the lake's pH are on the picture, at the cloud and the lake
        head = (gone.length ? gone.length + ' of ' + A.TOLERANCE.length + ' animals cannot live in this lake.' : 'Every animal can live in this lake.') + (rain < 5.55 ? ' The rain is ' + T.F(Math.pow(10, 5.6 - rain), 0) + '× as acidic as clean rain.' : ' The rain is normal.');
        why = '<p><b>Clean rain is already slightly acidic</b> (pH about 5.6): CO₂ dissolves to make weak carbonic acid. Acid rain is rain below that.</p>' +
          '<p><b>SO₂ and NOx make it.</b> Burning coal releases sulfur dioxide; hot combustion in engines and power plants makes nitrogen oxides. In the air they form sulfuric and nitric acid, which fall in rain, snow and fog, often far downwind of the smokestacks. VOCs, particulates and CO₂ are not acid-rain gases.</p>' +
          '<p><b>The log scale.</b> Each pH unit is ten times the hydrogen ions: rain at pH 4.6 is 10 times more acidic than rain at 5.6, and pH 3.6 is 100 times more.</p>' +
          '<p><b>Damage.</b> Lakes and streams acidify (fish eggs fail below about pH 5), aluminum leaches from soil and poisons fish, calcium and magnesium wash out of forest soils, and limestone and marble buildings dissolve. Limestone bedrock (calcium carbonate) neutralizes acid, so its lakes resist; granite has no buffer.</p>' +
          '<p><b>Fixes.</b> Scrubbers and low-sulfur coal cut SO₂; catalytic converters and low-NOx burners cut NOx; the Clean Air Act’s cap-and-trade for SO₂ cut power plant emissions by more than 90%. Adding limestone to a lake treats the symptom, not the cause.</p>';
        nums = '<h3 class="ls-title-l">The lowest pH each animal tolerates</h3><p class="bt-small">In the lake each animal sits at that pH (EPA); left of the lake’s line, it dies out.</p><table class="ls-tbl"><tbody>' + A.TOLERANCE.map(function(a){ return '<tr><th scope="row">' + esc(a.name) + '</th><td class="r">' + a.ph.toFixed(1) + '</td><td>' + (lake >= a.ph ? 'lives here' : 'cannot live here') + '</td></tr>'; }).join('') + '</tbody></table><p class="bt-small">EPA, “Effects of Acid Rain: Surface Waters.” The lake’s response is a sketch.</p>';
      }
      T.explain($('.ap-say'), '<b>' + esc(head) + '</b>', why);
      $('.ap-nums').innerHTML = nums;
      if(LS){ LS.caption('<b>' + esc(head) + '</b>', 'explore'); LS.pills(pills, 'left', 'explore'); LS.pills(right, 'right', 'explore'); }
      sync();
    }
    function sync(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.ap-view').forEach(function(b){ var on = b.getAttribute('data-v') === st.view; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      root.querySelectorAll('.ap-g').forEach(function(g){ g.hidden = g.getAttribute('data-g') !== st.view; });
      var iv = root.querySelector('.ap-inv'); if(iv){ iv.setAttribute('aria-pressed', String(st.inversion)); iv.classList.toggle('on', st.inversion); iv.textContent = st.inversion ? 'Inversion: on' : 'Inversion: off'; }
      root.querySelectorAll('.ap-r').forEach(function(b){ var on = (+b.getAttribute('data-r') === 1) === st.lime; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      cue.el.querySelector('.bt-cue-t').textContent = st.view === 'smog' ? 'Drag the clock (or drag across the picture) from morning to night and watch ozone build after the rush hour.' : 'Turn up the power plant’s SO₂ and NOx (or drag across the picture), then switch the bedrock to limestone.';
    }
    function onClick(e){
      var v = e.target.closest('.ap-view'); if(v){ stop(); st.view = v.getAttribute('data-v'); act(); draw(); speak(); return; }
      if(e.target.closest('.ap-play')){ play(); return; }
      if(e.target.closest('.ap-inv')){ st.inversion = !st.inversion; act(); draw(); speak(); return; }
      var r = e.target.closest('.ap-r'); if(r){ st.lime = r.getAttribute('data-r') === '1'; act(); draw(); speak(); }
    }
    function onChange(e){
      if(e.target.classList.contains('ap-cloud')){ st.cloudy = e.target.checked; draw(); speak(); }
      if(e.target.classList.contains('ap-vocck')){ st.voc = e.target.checked; draw(); }
    }
    host.addEventListener('click', onClick); host.addEventListener('change', onChange);
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.ap-fig')], dock: [$('.ap-ctl')], primary: [sH.el, $('.ap-btns'), sLoad.el], why: [$('.ap-say')], details: [$('.ap-nums')] });
      host.removeEventListener('click', onClick); host.removeEventListener('change', onChange);
      s.root.addEventListener('click', onClick); s.root.addEventListener('change', onChange);
      draw();
      // The hint points at the slider itself; the picture is draggable too.
      if(s.mode() === 'explore') s.hint({ target: sH.input, text: 'Start here: drag the clock, or drag across the picture' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ if(!anim) draw(); }, 60); }).observe($('.ap-fig')); }
    }
    draw();
    return { stop: stop, studio: studio };
  }

  /* ================================================== test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'air-pollution', noun: 'drill',
      generate: function(r, ctx, type){ return A.generate(r, ctx, type); },
      types: [{ value: 'smog', label: 'Read the smog curves' }, { value: 'inversion', label: 'Thermal inversion' }, { value: 'ph', label: 'Acid rain and pH' }, { value: 'reduce', label: 'Match the fix to the pollutant' }, { value: 'pct', label: 'Percent change in emissions' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { smog: 'Which curve is which?', inversion: 'A lid on the valley', ph: 'How much more acidic?', reduce: 'The right fix', pct: 'How much did emissions change?' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; api.st.try = null; figure(api.fig, api.problem, api.st); },
      // a wrong 'how many times' is drawn on the pH scale: where that factor would put the rain
      onTry: function(s, att, api){ if(s.key === 'times'){ api.st.try = att.value; figure(api.fig, api.problem, api.st); } },
      refit: function(api){ figure(api.fig, api.problem, api.st); }
    });
  }
  function figure(el, p, st){
    var g = p.figure, phone = (window.innerWidth || 1280) <= 640, W = phone ? 360 : 640, H = phone ? 280 : 300, inner = '', label = '';
    if(!g){ el.innerHTML = ''; return; }
    if(g.kind === 'smog' || g.kind === 'inversion' || g.kind === 'pct') H = T.figSize(W, H, { max: 0.72 })[1];
    if(g.kind === 'smog'){
      var d = A.smogDay({ cars: g.cars }), labs = {}, sp = SP.filter(function(s){ return s.k !== 'VOC'; });
      g.order.forEach(function(k, i){ labs[k] = st.o3 ? (k === 'O3' ? 'O₃' : k === 'NO' && st.first ? 'NO' : k === 'NO2' && st.first ? 'NO₂' : 'Curve ' + (i + 1)) : 'Curve ' + (i + 1); });
      var ordered = g.order.map(function(k){ return sp.filter(function(s){ return s.k === k; })[0]; });
      inner = curves(0, 0, W, H, d, null, { labels: labs, species: st.o3 ? ordered : ordered.map(function(s, i){ return { k: s.k, label: s.label, cls: 'ap-neutral ap-n' + i }; }) });
      label = 'Three pollutant curves through a day, labeled curve 1, 2 and 3; they peak at ' + g.order.map(function(k, i){ return 'curve ' + (i + 1) + ' ' + A.clock(d.peaks[k].hour); }).join(', ') + '.';
    } else if(g.kind === 'inversion'){
      inner = profile(0, 0, W / 2 - 6, H - 18, false) + profile(W / 2 + 6, 0, W / 2 - 6, H - 18, true) + txt(W / 4, H - 2, 'Graph A', 'ap-t ap-s ap-b', 'middle') + txt(W * 0.75, H - 2, 'Graph B', 'ap-t ap-s ap-b', 'middle');
      label = 'Two temperature profiles: A cools steadily with height; B has a layer where temperature rises with height, from 150 m to 450 m.';
    } else if(g.kind === 'ph'){
      var hasBuf = p.steps.some(function(x){ return x.key === 'buffer'; });
      H = hasBuf ? 380 : 200;
      var L = 20, R = W - 20, y = hasBuf ? 64 : H * 0.45, X = function(v){ return L + v / 14 * (R - L); }, o = [];
      for(var v = 0; v < 14; v++) o.push('<rect x="' + n2(X(v)) + '" y="' + n2(y - 14) + '" width="' + n2(X(1) - X(0)) + '" height="28" style="fill:' + phColor(v + 0.5) + '"/>' + txt(X(v + 0.5), y + 30, String(v + (v ? 0 : 0)), 'ap-t ap-tk', 'middle'));
      o.push(txt(X(14), y + 30, '14', 'ap-t ap-tk', 'middle'));
      [[p.given.a, 'Rain here'], [p.given.b, p.given.b === 5.6 ? 'Clean rain' : 'Cleaner rain']].forEach(function(m, k){ o.push(line(X(m[0]), y - 26, X(m[0]), y + 16, 'ap-cursor')); o.push(txt(X(m[0]), y - 32 - k * 16, m[1] + ' ' + m[0].toFixed(1), 'ap-t ap-b', 'middle')); });
      o.push(txt(L, y + 54, 'More acidic', 'ap-t ap-s ap-b')); o.push(txt(R, y + 54, 'More basic', 'ap-t ap-s ap-b', 'end'));
      if(st.try != null && isFinite(st.try) && st.try > 0 && !st.times){
        // factor f = 10^(b - pH), so the student's factor puts the rain at pH b - log10(f)
        var tp = Math.max(0, Math.min(14, p.given.b - Math.log10(st.try)));
        o.push(line(X(tp), y - 26, X(tp), y + 16, 'ap-trym') + txt(X(tp), y + 70, 'Your ' + T.F(st.try, 0) + '× puts it at pH ' + T.F(tp, 1), 'ap-t ap-b ap-try-t', 'middle'));
      }
      if(st.times) o.push(txt((X(p.given.a) + X(p.given.b)) / 2, y + 78, '10^' + T.F(p.given.b - p.given.a, 1) + ' = ' + T.F(p.given.times, 0) + ' times', 'ap-t ap-b ap-c-o3', 'middle'));
      if(hasBuf){
        // the same rain on two lakes: granite (no buffer) and limestone; their pH shows once the buffer step is done
        var gy2 = y + 128, lw2 = (W - 60) / 2;
        [[false, 'Granite'], [true, 'Limestone']].forEach(function(b, k){
          var x0 = 20 + k * (lw2 + 20), lp = A.lakePH(p.given.a, b[0]), shown = st.buffer;
          o.push('<rect class="' + (b[0] ? 'ap-lime' : 'ap-granite') + '" x="' + n2(x0) + '" y="' + n2(gy2) + '" width="' + n2(lw2) + '" height="' + n2(H - gy2 - 8) + '" rx="8"/>');
          for(var r2 = 0; r2 < 8; r2++){ var rx2 = x0 + lw2 * 0.2 + r2 * lw2 * 0.085; o.push('<line class="ap-drop" x1="' + n2(rx2) + '" y1="' + n2(gy2 - 34 + (r2 % 2) * 8) + '" x2="' + n2(rx2 - 4) + '" y2="' + n2(gy2 - 20 + (r2 % 2) * 8) + '" style="stroke:' + phColor(p.given.a) + '"/>'); }
          o.push(txt(x0 + lw2 / 2, gy2 - 42, 'Rain pH ' + p.given.a.toFixed(1), 'ap-t ap-s ap-b', 'middle'));
          o.push('<path class="ap-lake" style="fill:' + (shown ? phColor(lp) : 'var(--paper)') + '" d="M' + n2(x0 + 14) + ' ' + n2(gy2) + ' C' + n2(x0 + 24) + ' ' + n2(gy2 + 90) + ' ' + n2(x0 + lw2 - 24) + ' ' + n2(gy2 + 90) + ' ' + n2(x0 + lw2 - 14) + ' ' + n2(gy2) + 'Z"/>');
          o.push('<g class="ap-tag"><rect x="' + n2(x0 + lw2 / 2 - 50) + '" y="' + n2(gy2 + 20) + '" width="100" height="24" rx="12"/>' + txt(x0 + lw2 / 2, gy2 + 37, shown ? 'Lake pH ' + f1(lp) : 'Lake pH ?', 'ap-t ap-b ap-tag-t', 'middle') + '</g>');
          o.push(txt(x0 + 10, H - 18, b[1] + ' bedrock', 'ap-t ap-s ap-on-rock'));
        });
      }
      inner = o.join(''); label = 'A pH scale from 0 to 14 with the rain at pH ' + p.given.a.toFixed(1) + ' and the comparison at ' + p.given.b.toFixed(1) + '.' + (hasBuf ? ' Below it the same rain falls on a lake on granite and a lake on limestone' + (st.buffer ? ': the granite lake reaches pH ' + f1(A.lakePH(p.given.a, false)) + ', the limestone lake ' + f1(A.lakePH(p.given.a, true)) + '.' : '.') : '');
    } else if(g.kind === 'reduce'){
      // the pollutant's real source, drawn; its fix appears on it once answered
      var P = A.POLL[g.id], o2 = [], stack = g.id === 'SO2' || g.id === 'PM', pump = g.id === 'VOC', gy = 150;
      H = 190;
      o2.push('<rect class="ap-ground2" x="0" y="' + gy + '" width="' + W + '" height="40"/>');
      if(stack){
        o2.push('<rect class="ap-bldg" x="40" y="80" width="120" height="70" rx="3"/><rect class="ap-stack" x="128" y="18" width="20" height="62"/>');
        if(st.fix) o2.push('<rect class="ap-fixbox" x="164" y="60" width="78" height="54" rx="6"/>' + txt(203, 92, g.id === 'SO2' ? 'Scrubber' : 'Precipitator', 'ap-t ap-s ap-b', 'middle') + line(148, 70, 164, 80, 'ap-pipe') + line(242, 80, 262, 46, 'ap-pipe'));
        for(var q = 0; q < 4; q++) o2.push('<circle class="ap-plume" cx="' + n2((st.fix ? 266 : 140) + q * 22) + '" cy="' + n2(14 - q * 3) + '" r="' + n2(8 + q * 4) + '" opacity="' + (st.fix ? 0.12 : 0.5) + '"/>');
      } else if(pump){
        o2.push('<rect class="ap-pump" x="70" y="62" width="54" height="88" rx="6"/><rect class="ap-pumpwin" x="80" y="74" width="34" height="22" rx="3"/><path class="ap-hose" d="M124 90 q30 6 34 40"/><rect class="ap-nozzle" x="150" y="128" width="18" height="10" rx="3"/>');
        o2.push('<g class="ap-car" transform="translate(180 108) scale(4)"><rect x="0" y="0" width="14" height="6" rx="2"/><circle cx="3" cy="6" r="1.8"/><circle cx="11" cy="6" r="1.8"/></g>');
        for(var vq = 0; vq < 3; vq++) o2.push('<path class="ap-vapor" d="M' + (162 + vq * 8) + ' 124 q-6 -10 0 -20 t0 -20" opacity="' + (st.fix ? 0.12 : 0.7) + '"/>');
        if(st.fix) o2.push(txt(159, 158 + 18, 'Vapor recovery', 'ap-t ap-s ap-b', 'middle'));
      } else {
        o2.push('<g class="ap-car" transform="translate(60 96) scale(8)"><rect x="0" y="0" width="14" height="6" rx="2"/><circle cx="3" cy="6" r="1.8"/><circle cx="11" cy="6" r="1.8"/></g>');
        o2.push('<rect class="ap-pipe2" x="20" y="134" width="44" height="6" rx="3"/>');
        if(st.fix) o2.push('<rect class="ap-fixbox" x="36" y="126" width="30" height="20" rx="5"/>' + txt(44, 176, 'Catalytic converter', 'ap-t ap-s ap-b'));
        for(var e2 = 0; e2 < 3; e2++) o2.push('<circle class="ap-exh2" cx="' + (14 - e2 * 10) + '" cy="' + (136 - e2 * 6) + '" r="' + (5 + e2 * 3) + '" opacity="' + (st.fix ? 0.15 : 0.6) + '"/>');
      }
      var tx = Math.max(W * 0.5, 290);
      o2.push(txt(tx, 50, esc(P.name), 'ap-t ap-b'));
      o2.push(txt(tx, 72, 'From ' + esc(P.src), 'ap-t ap-s ap-muted'));
      if(st.fix && W > 500) o2.push(txt(tx, 100, 'Fix: ' + esc(P.fix.split(' (')[0].split(', ')[0].replace(/^a /, '')), 'ap-t ap-s ap-b ap-c-o3'));
      inner = o2.join(''); label = 'The source of ' + P.name + ': ' + P.src + (st.fix ? ', with its fix: ' + P.fix : '') + '.';
    } else if(g.kind === 'pct'){
      var S = g.S, L2 = 70, R2 = W - 30, B2 = H - 40, T2 = 30, mx = S.from * 1.15, o3 = [];
      var Y2 = function(v){ return B2 - v / mx * (B2 - T2); };
      o3.push(txt(L2, 16, esc(S.unit), 'ap-t ap-tk'));
      [[S.y0, S.from], [S.y1, S.to]].forEach(function(b, k){ var x = L2 + (R2 - L2) * (0.2 + k * 0.45), bw = (R2 - L2) * 0.22; o3.push('<rect class="ap-bar' + (k ? ' is-new' : '') + '" x="' + n2(x) + '" y="' + n2(Y2(b[1])) + '" width="' + n2(bw) + '" height="' + n2(B2 - Y2(b[1])) + '" rx="4"/>' + txt(x + bw / 2, Y2(b[1]) - 6, String(b[1]), 'ap-t ap-b', 'middle') + txt(x + bw / 2, B2 + 18, String(b[0]), 'ap-t ap-tk', 'middle')); });
      o3.push(line(L2, B2, R2, B2, 'ap-axisl'));
      if(st.pct) o3.push(txt((L2 + R2) / 2 + 40, T2 + 20, T.F(p.given.pc, 1) + '%', 'ap-t ap-b ap-c-o3', 'middle'));
      inner = o3.join(''); label = 'Bar chart: ' + S.from + ' ' + S.unit + ' in ' + S.y0 + ' and ' + S.to + ' in ' + S.y1 + '.';
    }
    el.innerHTML = '<figure class="cd-fig ap-qfig"><svg class="ap-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + inner + '</svg></figure>';
  }
})();
