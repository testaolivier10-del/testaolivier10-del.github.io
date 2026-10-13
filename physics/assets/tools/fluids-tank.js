/* Fluids tank (Unit 8 trainer; docs/apphys-spec.md section 6). OWNED BY THIS
   TOOL ONLY. Job: see why things float or sink, what a spring scale reads
   under water, how pressure grows with depth and how an ideal fluid speeds up
   and loses pressure in a narrowing pipe.

   Explore (five scenes, one fluid switch: water, light oil, salt water):
     Float or sink   drop a wood block, an ice cube, an aluminum block or a
                     hollow ball; ApPhysMath.fluidsTank.sim integrates the
                     fall, the splash and the bobbing; the forces are drawn to
                     scale; drag the object to push it under and let go
     Spring scale    lower an object on a spring scale; the reading is
                     F_g − F_b, plotted against depth
     Pressure        drag a probe down a 10 m tank; gauge and absolute
                     pressure, P against depth for the fluid
     Pipe flow       a full pipe narrows and rises; continuity sets the speed,
                     Bernoulli the pressure; energy-per-volume bars that add up
     Hole in a tank  speed from energy (v = √(2gh)), the jet and its range
   Test yourself: ApPhysTools.drill on ApPhysMath.fluidsTank.generate
   (density, buoyant force, float fraction, apparent weight, pressure at
   depth, continuity, Bernoulli, hole), each with a figure. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath, S = window.ApPhysScene;
  if(!T || !M || !M.fluidsTank) return;
  var FT = M.fluidsTank, G = M.C.g, ATM = M.C.ATM;
  var here = document.currentScript && document.currentScript.src;
  if(here && !document.querySelector('link[data-ft-css]')){
    var ln = document.createElement('link'); ln.rel = 'stylesheet'; ln.href = here.replace(/fluids-tank\.js(\?.*)?$/, 'fluids-tank.css'); ln.setAttribute('data-ft-css', '1');
    document.head.appendChild(ln);
  }
  var esc = T.esc, F = T.F;
  function fm(x, n){ return M.fmt(x, n || 3); }
  var SCENES = [
    { id: 'float', label: 'Float or sink', topic: 'buoyancy' },
    { id: 'scale', label: 'Spring scale', topic: 'buoyancy' },
    { id: 'pressure', label: 'Pressure', topic: 'fluid-pressure' },
    { id: 'pipe', label: 'Pipe flow', topic: 'fluid-flow' },
    { id: 'hole', label: 'Hole in a tank', topic: 'fluid-flow' }
  ];

  /* ---------------------------------------------------------- drawing */
  // Gradients and patterns, written once per SVG (ids are unique per call).
  var gid = 0;
  function defs(p){
    return '<defs>' +
      '<linearGradient id="' + p + 'al" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9EDF0"/><stop offset=".45" stop-color="#AEB7BE"/><stop offset=".55" stop-color="#C9D0D5"/><stop offset="1" stop-color="#7D878F"/></linearGradient>' +
      '<linearGradient id="' + p + 'wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E2B878"/><stop offset="1" stop-color="#B98544"/></linearGradient>' +
      '<linearGradient id="' + p + 'ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4FBFF" stop-opacity=".95"/><stop offset="1" stop-color="#BFE0F2" stop-opacity=".85"/></linearGradient>' +
      '<radialGradient id="' + p + 'ball" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FFB38A"/><stop offset=".6" stop-color="#E5622A"/><stop offset="1" stop-color="#A63E14"/></radialGradient>' +
      '<linearGradient id="' + p + 'wat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>' +
      '<pattern id="' + p + 'hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" class="ft-hatch"/></pattern>' +
      '</defs>';
  }
  /* An object of size hPx (box side or ball diameter), bottom-centre at (cx, by). */
  function objSvg(o, cx, by, ppm, p, label){
    var h = FT.height(o) * ppm, out = '';
    if(o.shape === 'ball'){
      var r = h / 2, cy = by - r;
      out = '<circle cx="' + cx + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="url(#' + p + 'ball)" stroke="#7A2E0E" stroke-width="2"/>' +
        '<circle cx="' + cx + '" cy="' + cy.toFixed(1) + '" r="' + (r * 0.78).toFixed(1) + '" fill="none" stroke="#FFD9C4" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="4 4"/>' +
        '<ellipse cx="' + (cx - r * 0.35).toFixed(1) + '" cy="' + (cy - r * 0.4).toFixed(1) + '" rx="' + (r * 0.22).toFixed(1) + '" ry="' + (r * 0.13).toFixed(1) + '" fill="#fff" fill-opacity=".55"/>';
    } else {
      var x = cx - h / 2, y = by - h, fill = o.key === 'wood' ? p + 'wd' : o.key === 'ice' ? p + 'ice' : p + 'al';
      var stroke = o.key === 'wood' ? '#7A4E1C' : o.key === 'ice' ? '#7FB4CF' : '#59636B';
      out = '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + h.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + (o.key === 'ice' ? 6 : 2.5) + '" fill="url(#' + fill + ')" stroke="' + stroke + '" stroke-width="2"/>';
      if(o.key === 'wood') for(var i = 1; i < 4; i++) out += '<path d="M' + (x + 3).toFixed(1) + ' ' + (y + h * i / 4).toFixed(1) + ' q' + (h * 0.3).toFixed(1) + ' ' + (i % 2 ? -4 : 4) + ' ' + (h * 0.55).toFixed(1) + ' 0 t' + (h * 0.4 - 6).toFixed(1) + ' 0" fill="none" stroke="#8C5A22" stroke-opacity=".45" stroke-width="1.4"/>';
      if(o.key === 'ice') out += '<path d="M' + (x + 6).toFixed(1) + ' ' + (y + 8).toFixed(1) + 'h' + (h * 0.35).toFixed(1) + 'M' + (x + 6).toFixed(1) + ' ' + (y + 8).toFixed(1) + 'v' + (h * 0.35).toFixed(1) + '" stroke="#fff" stroke-width="3" stroke-linecap="round"/>';
      if(o.key === 'aluminum') out += '<path d="M' + (x + 4).toFixed(1) + ' ' + (y + h - 5).toFixed(1) + 'L' + (x + h - 5).toFixed(1) + ' ' + (y + 4).toFixed(1) + '" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>';
    }
    if(label) out += '<text x="' + cx + '" y="' + (by - h / 2 + 5).toFixed(1) + '" text-anchor="middle" class="ft-mut" style="font-size:11px">' + esc(label) + '</text>';
    return out;
  }
  /* A glass tank: inner box x0..x1, rim at yRim, floor at yFloor, fluid surface at ySurf. */
  function tankSvg(fl, x0, x1, yRim, yFloor, ySurf, front){
    var w = x1 - x0;
    var water = '<rect class="ft-water ' + fl + '" x="' + x0 + '" y="' + ySurf.toFixed(1) + '" width="' + w + '" height="' + (yFloor - ySurf).toFixed(1) + '"/>' +
      '<rect x="' + x0 + '" y="' + ySurf.toFixed(1) + '" width="' + w + '" height="' + (yFloor - ySurf).toFixed(1) + '" fill="url(#' + front + 'wat)"/>';
    var glass = '<rect class="ft-glassfill" x="' + (x0 - 5) + '" y="' + yRim + '" width="' + (w + 10) + '" height="' + (yFloor - yRim + 5) + '" rx="6"/>' +
      '<path class="ft-glass" d="M' + (x0 - 3) + ' ' + yRim + 'V' + (yFloor + 3) + 'H' + (x1 + 3) + 'V' + yRim + '"/>' +
      '<path class="ft-glass-hi" d="M' + (x0 + 6) + ' ' + (yRim + 12) + 'V' + (yFloor - 20) + '"/>' +
      '<rect class="ft-base" x="' + (x0 - 14) + '" y="' + (yFloor + 5) + '" width="' + (w + 28) + '" height="7" rx="3"/>';
    return { back: glass + water, surf: '<line class="ft-surf ' + fl + '" x1="' + x0 + '" x2="' + x1 + '" y1="' + ySurf.toFixed(1) + '" y2="' + ySurf.toFixed(1) + '"/>' };
  }
  // Force arrows: pixels per newton chosen so the largest force fits.
  function forceArrows(f, cx, cy, kN, onFloorY){
    var out = '', fb = f.Fb * kN, fg = f.Fg * kN, n = f.N * kN;
    out += S.arrow(cx, cy, 0, fg, { cls: 'f-grav', label: 'F_g', width: 3.5 });
    out += S.arrow(cx - (n > 0.5 ? 9 : 0), cy, 0, -fb, { cls: 'f-buoy', label: fb > 2 ? 'F_b' : '', width: 3.5 });
    if(n > 0.5) out += S.arrow(cx + 9, cy, 0, -n, { cls: 'f-normal', label: 'F_N', width: 3.5 });
    return out + '<circle cx="' + cx + '" cy="' + cy.toFixed(1) + '" r="3.5" fill="var(--ink)"/>';
  }

  /* A free-body diagram (the course conventions: the object as a box with a
     dot, each force an arrow starting on it, labeled with type and agent,
     lengths to scale). list: [{ cls, sym, agent, value, up }]. */
  function fbdSvg(list, on, note, h){
    var W = 280, H = h || 380, cx = 92, cy = H / 2, bx = 26, max = Math.max.apply(null, list.map(function(f){ return f.value; }).concat([1e-9])), k = (H / 2 - 40) / max;
    var ups = list.filter(function(f){ return f.up && f.value > 1e-9; }), downs = list.filter(function(f){ return !f.up && f.value > 1e-9; });
    var inner = '<rect x="' + (cx - bx) + '" y="' + (cy - bx) + '" width="' + (2 * bx) + '" height="' + (2 * bx) + '" rx="5" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>';
    function put(arr, sgn){
      var tips = [];
      arr.forEach(function(f, i){
        var dx = arr.length === 1 ? 0 : (i - (arr.length - 1) / 2) * 18, L = Math.max(6, f.value * k), x = cx + dx;
        inner += S.arrow(x, cy, 0, sgn * L, { cls: f.cls, width: 4, head: 11 });
        tips.push({ f: f, y: cy + sgn * L });
      });
      // labels at the tips, pushed apart so they never overlap
      tips.sort(function(a, b){ return sgn < 0 ? a.y - b.y : b.y - a.y; });
      var last = null;
      tips.forEach(function(t){
        var y = sgn < 0 ? Math.max(16, t.y + 6) : Math.min(H - 22, t.y - 6);
        if(last != null) y = sgn < 0 ? Math.max(y, last + 38) : Math.min(y, last - 38);
        last = y;
        inner += '<text x="' + (cx + 40) + '" y="' + y.toFixed(1) + '" class="ft-fbdl">' + t.f.html + '<tspan x="' + (cx + 40) + '" dy="17" class="ft-mut">' + F(t.f.value, 2) + ' N, ' + t.f.agent + '</tspan></text>';
      });
    }
    put(ups, -1); put(downs, 1);
    inner += '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="var(--ink)"/>';
    var lab = 'Free-body diagram of the ' + on + ', to scale: ' + list.filter(function(f){ return f.value > 1e-9; }).map(function(f){ return f.text + ' ' + F(f.value, 2) + ' N ' + (f.up ? 'up' : 'down') + ' (' + f.agent + ')'; }).join(', ') + '.';
    return S.svg(W, H, lab, inner).replace('class="phys-scene"', 'class="phys-scene ft-svg ft-fbd"') + (note ? '<p class="ft-cap ft-note">' + note + '</p>' : '');
  }
  function sub(t, s2){ return t + '<tspan dy="4" font-size=".75em">' + s2 + '</tspan><tspan dy="-4"> </tspan>'; }
  function fbdList(f, fluidName, objName, scale){
    var l = [{ cls: 'f-grav', html: sub('F', 'g'), text: 'gravitational force', agent: 'Earth', value: f.Fg, up: false },
      { cls: 'f-buoy', html: sub('F', 'b'), text: 'buoyant force', agent: fluidName, value: f.Fb, up: true }];
    if(f.N > 1e-9) l.push({ cls: 'f-normal', html: sub('F', 'N'), text: 'normal force', agent: 'floor', value: f.N, up: true });
    if(scale && f.T > 1e-9) l.push({ cls: 'f-tension', html: sub('F', 'T'), text: 'tension', agent: 'string', value: f.T, up: true });
    return l;
  }

  /* Float or sink. st: { fluid, obj, y (bottom depth, m), forces?, quiz?, dims? } */
  var TK = { x0: 80, x1: 320, rim: 96, floor: 330, depth: 0.30, ppm: 600 };
  function surfY(){ return TK.floor - TK.depth * TK.ppm; }
  function floatSvg(st){
    var p = 'ft' + (++gid), o = st.obj, ys = surfY(), by = ys + st.y * TK.ppm, cx = 200, h = FT.height(o) * TK.ppm;
    var t = tankSvg(st.fluid, TK.x0, TK.x1, TK.rim, TK.floor, ys, p), inner = defs(p) + t.back + objSvg(o, cx, by, TK.ppm, p) + t.surf;
    if(st.dims){
      var dy = Math.max(0, Math.min(h, st.y * TK.ppm));
      inner += '<path class="ft-dim" d="M' + (cx + h / 2 + 10) + ' ' + ys.toFixed(1) + 'v' + dy.toFixed(1) + 'm-5 0h10m-10 ' + (-dy).toFixed(1) + 'h10"/><text x="' + (cx + h / 2 + 18) + '" y="' + (ys + dy / 2 + 5).toFixed(1) + '" class="ft-mut">' + esc(st.dims) + '</text>';
    }
    if(st.forces){
      var f = st.forces, max = Math.max(f.Fg, f.Fb, f.N, 1e-9), kN = 110 / Math.max(max, 9);
      inner += forceArrows(f, cx, by - h / 2, kN);
    }
    // a depth ruler on the tank's right wall
    for(var d = 0; d <= TK.depth + 1e-9; d += 0.05){
      var yy = ys + d * TK.ppm; inner += '<line class="ft-rule" x1="' + (TK.x1 - 10) + '" x2="' + TK.x1 + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/>' + (Math.round(d * 100) % 10 === 0 ? '<text x="' + (TK.x1 + 12) + '" y="' + (yy + 4).toFixed(1) + '" class="ft-mut">' + Math.round(d * 100) + '</text>' : '');
    }
    inner += '<text x="' + (TK.x1 + 12) + '" y="' + (ys - 10) + '" class="ft-mut">cm</text>';
    return S.svg(400, 350, st.label || 'A glass tank of fluid with an object in it.', inner).replace('class="phys-scene"', 'class="phys-scene ft-svg"').replace('viewBox="0 0 400 350"', 'viewBox="56 58 316 290"');
  }

  /* Spring scale. st: { fluid, obj, hook (bottom depth on a taut string), res: FT.scale(...), max (N), quiz? } */
  var SK = { x0: 90, x1: 310, rim: 260, floor: 460, depth: 0.28, ppm: 600 };
  function scaleSvg(st){
    var p = 'ft' + (++gid), o = st.obj, ys = SK.floor - SK.depth * SK.ppm, r = st.res, h = FT.height(o) * SK.ppm, cx = 200;
    var by = ys + r.y * SK.ppm, top = by - h;
    var t = tankSvg(st.fluid, SK.x0, SK.x1, SK.rim, SK.floor, ys, p), inner = defs(p);
    // stand: base beside the tank, post, arm over the tank
    inner += '<rect class="ft-steel" x="340" y="' + (SK.floor + 5) + '" width="50" height="8" rx="3"/><rect class="ft-steel" x="361" y="14" width="8" height="' + (SK.floor - 9) + '"/><rect class="ft-steel" x="186" y="12" width="183" height="8" rx="3"/>';
    // scale body: tube 30..150, the spring stretches with the reading
    var x = cx, ty = 28, tl = 128, frac = Math.min(1, r.reading / st.max), sp = 20 + frac * (tl - 34), hookY = ty + sp + 8;
    inner += '<line class="ft-string" x1="' + x + '" x2="' + x + '" y1="20" y2="' + ty + '"/><rect class="ft-tube" x="' + (x - 17) + '" y="' + ty + '" width="34" height="' + tl + '" rx="8"/>';
    for(var n = 0; n <= st.max + 1e-9; n += st.max / 10){
      var yy = ty + 20 + n / st.max * (tl - 34);
      inner += '<line class="ft-tick" x1="' + (x + 6) + '" x2="' + (x + 15) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/>' + (st.quiz ? '' : Math.round(n / st.max * 10) % 2 === 0 ? '<text x="' + (x + 22) + '" y="' + (yy + 4).toFixed(1) + '" class="ft-mut" style="font-size:11px">' + F(n, st.max < 6 ? 1 : 0) + '</text>' : '');
    }
    var coils = '', nC = 9, c0 = ty + 8, c1 = ty + sp;
    for(var i = 0; i <= nC; i++) coils += (i ? 'L' : 'M') + (x + (i % 2 ? -8 : 8) * (i && i < nC ? 1 : 0)) + ' ' + (c0 + (c1 - c0) * i / nC).toFixed(1);
    inner += '<path class="ft-spring" d="' + coils + '"/><path class="ft-ptr" d="M' + (x - 4) + ' ' + (ty + sp).toFixed(1) + 'h14l4 -4v8l-4 -4z"/>';
    inner += '<line class="ft-string" x1="' + x + '" x2="' + x + '" y1="' + (ty + tl) + '" y2="' + (ty + tl + 6) + '"/><path class="ft-string" d="M' + x + ' ' + (ty + tl + 6) + 'a5 5 0 1 0 5 5"/>';
    // string from the hook to the object (slack: a sagging curve)
    var sy = ty + tl + 16, hookTop = top;
    if(r.slack){ inner += '<path class="ft-string" d="M' + x + ' ' + sy + 'Q' + (x + 28) + ' ' + ((sy + top) / 2).toFixed(1) + ' ' + x + ' ' + hookTop.toFixed(1) + '"/>'; }
    else inner += '<line class="ft-string" x1="' + x + '" x2="' + x + '" y1="' + sy + '" y2="' + hookTop.toFixed(1) + '"/>';
    inner += t.back + objSvg(o, cx, by, SK.ppm, p) + t.surf;
    if(!st.quiz){
      inner += '<text x="' + (x - 26) + '" y="' + (ty + tl / 2) + '" text-anchor="end" class="ft-big">' + F(r.reading, 2) + ' N</text>';
    }
    return S.svg(400, 480, st.label || 'An object hanging from a spring scale over a tank of fluid.', inner).replace('class="phys-scene"', 'class="phys-scene ft-svg"');
  }

  /* Pressure in a deep tank. st: { fluid, depth (m), H (m, default 10), quiz?, above? } */
  function pressureSvg(st){
    var p = 'ft' + (++gid), H = st.H || 10, x0 = 140, x1 = 300, ys = 52, yf = 330, ppm = (yf - ys) / H, py = ys + st.depth * ppm;
    var t = tankSvg(st.fluid, x0, x1, 30, yf, ys, p), inner = defs(p) + t.back + t.surf;
    var step = H > 6 ? 1 : H > 3 ? 0.5 : 0.25, lab = H > 6 ? 2 : H > 3 ? 1 : 0.5;
    for(var d = 0; d <= H + 1e-9; d += step){
      var yy = ys + d * ppm;
      inner += '<line class="ft-rule" x1="' + (x0 - 22) + '" x2="' + (x0 - 12) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/>' + (Math.abs(d / lab - Math.round(d / lab)) < 1e-6 ? '<text x="' + (x0 - 28) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end" class="ft-mut">' + F(d, lab < 1 ? 1 : 0) + '</text>' : '');
    }
    inner += '<text x="' + (x0 - 28) + '" y="' + (ys - 16) + '" text-anchor="end" class="ft-mut">depth (m)</text>';
    inner += '<text x="' + (x1 + 10) + '" y="' + (ys - 4) + '" class="ft-mut">air above:</text><text x="' + (x1 + 10) + '" y="' + (ys + 12) + '" class="ft-mut">P<tspan dy="4" font-size=".75em">atm</tspan><tspan dy="-4"> = 100 kPa</tspan></text>';
    // the probe on its cable, with pressure pushing on it from every side
    inner += '<line class="ft-string" x1="' + (x1 - 50) + '" x2="' + (x1 - 50) + '" y1="14" y2="' + (py - 10).toFixed(1) + '"/><rect class="ft-steel" x="' + (x1 - 64) + '" y="6" width="28" height="12" rx="4"/>';
    if(!st.quiz){
      var P = FT.pressure(st.depth, FT.FLUIDS[st.fluid].rho), L = 6 + P.abs / 250000 * 26, c = { x: x1 - 50, y: py };
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function(v){ inner += S.arrow(c.x + v[0] * (14 + L), c.y + v[1] * (14 + L), -v[0] * L, -v[1] * L, { cls: 'ft-parr', width: 2.5, head: 7 }); });
    }
    inner += '<circle class="ft-probe" cx="' + (x1 - 50) + '" cy="' + py.toFixed(1) + '" r="10"/><circle cx="' + (x1 - 50) + '" cy="' + py.toFixed(1) + '" r="4" fill="var(--phys-s2)"/>';
    if(st.above != null){
      var yb = yf; inner += '<path class="ft-dim" d="M' + (x1 - 28) + ' ' + py.toFixed(1) + 'V' + yb + 'm-5 0h10m-10 ' + (py - yb).toFixed(1) + 'h10"/><text x="' + (x1 - 22) + '" y="' + ((py + yb) / 2 + 4).toFixed(1) + '" class="ft-mut">' + esc(st.aboveLabel || '') + '</text>';
    }
    if(!st.quiz) inner += '<rect class="ft-probe-hit" x="' + x0 + '" y="' + (ys - 6) + '" width="' + (x1 - x0) + '" height="' + (yf - ys + 12) + '"/>';
    return S.svg(400, 345, st.label || 'A deep tank of fluid with a pressure probe at a depth.', inner).replace('class="phys-scene"', 'class="phys-scene ft-svg"');
  }

  /* A pipe that narrows (d1 to d2, cm) and rises dy (m). st: { fluid, d1, d2, dy, res?, dots?, quiz?, labels? } */
  var PP = { xa: 16, xb: 165, xc: 225, xd: 350, y0: 200, cmPx: 9.5, mPx: 34 };
  function pipeGeom(st){
    var r1 = st.d1 * PP.cmPx / 2, r2 = st.d2 * PP.cmPx / 2, c1 = PP.y0, c2 = PP.y0 - st.dy * PP.mPx;
    function at(x){ // centre and radius at x
      if(x <= PP.xb) return { c: c1, r: r1 };
      if(x >= PP.xc) return { c: c2, r: r2 };
      var u = (x - PP.xb) / (PP.xc - PP.xb), s = u * u * (3 - 2 * u);
      return { c: c1 + (c2 - c1) * s, r: r1 + (r2 - r1) * s };
    }
    return { at: at, r1: r1, r2: r2, c1: c1, c2: c2 };
  }
  function dial(cx, cy, Pabs, label, quiz){
    var a = -210 + Math.max(0, Math.min(1, Pabs / 300000)) * 240, rad = a * Math.PI / 180, out = '<circle class="ft-dial" cx="' + cx + '" cy="' + cy + '" r="27"/>';
    for(var k = 0; k <= 6; k++){ var b = (-210 + k * 40) * Math.PI / 180; out += '<line class="ft-tick" x1="' + (cx + 21 * Math.cos(b)).toFixed(1) + '" y1="' + (cy + 21 * Math.sin(b)).toFixed(1) + '" x2="' + (cx + 26 * Math.cos(b)).toFixed(1) + '" y2="' + (cy + 26 * Math.sin(b)).toFixed(1) + '"/>'; }
    if(!quiz) out += '<line class="ft-needle" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + 20 * Math.cos(rad)).toFixed(1) + '" y2="' + (cy + 20 * Math.sin(rad)).toFixed(1) + '"/>';
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="var(--ink)"/><text x="' + cx + '" y="' + (cy - 34) + '" text-anchor="middle" class="ft-mut">' + label + '</text>';
    return out;
  }
  function pipeSvg(st){
    var g = pipeGeom(st), top = [], bot = [], N = 48;
    for(var i = 0; i <= N; i++){ var x = PP.xa + (PP.xd - PP.xa) * i / N, q = g.at(x); top.push(x.toFixed(1) + ' ' + (q.c - q.r).toFixed(1)); bot.push(x.toFixed(1) + ' ' + (q.c + q.r).toFixed(1)); }
    var fluid = '<path class="ft-water ' + st.fluid + '" d="M' + top.join('L') + 'L' + bot.slice().reverse().join('L') + 'Z"/>';
    var walls = '<path class="ft-pipe" d="M' + top.join('L') + '"/><path class="ft-pipe" d="M' + bot.join('L') + '"/>' +
      '<path class="ft-glass-hi" d="M' + (PP.xa + 8) + ' ' + (g.c1 - g.r1 + 6).toFixed(1) + 'H' + (PP.xb - 10) + '"/>';
    var inner = fluid + (st.dots || '') + walls;
    // gauges on short risers at 1 and 2
    var x1 = 90, x2 = 290, t1 = g.c1 - g.r1, t2 = g.c2 - g.r2, res = st.res;
    inner += '<rect class="ft-steel" x="' + (x1 - 4) + '" y="' + (t1 - 26) + '" width="8" height="26"/><rect class="ft-steel" x="' + (x2 - 4) + '" y="' + (t2 - 26) + '" width="8" height="26"/>';
    inner += dial(x1, t1 - 52, res ? res.P1 : 0, st.quiz ? 'P₁' : 'P₁ ' + F(res.P1 / 1000, 0) + ' kPa', st.quiz) + dial(x2, t2 - 52, res ? res.P2 : 0, st.quiz ? 'P₂' : 'P₂ ' + F(res.P2 / 1000, 0) + ' kPa', st.quiz);
    if(!st.quiz && res){
      var k = 9;
      var vk = 70 / Math.max(res.v1, res.v2);
      inner += S.arrow(x1 - 40, g.c1, res.v1 * vk, 0, { cls: 'vel', label: 'v₁', head: 9, width: 3.5 });
      inner += S.arrow(x2 - 40, g.c2, res.v2 * vk, 0, { cls: 'vel', label: 'v₂', head: 9, width: 3.5 });
    }
    // labels and the height
    inner += '<text x="' + x1 + '" y="' + (g.c1 + g.r1 + 22).toFixed(1) + '" text-anchor="middle" class="ft-mut">' + esc(st.quiz ? '1: d₁ = ' + F(st.d1, 1) + ' cm' : 'point 1') + '</text><text x="' + x2 + '" y="' + (g.c2 + g.r2 + 22).toFixed(1) + '" text-anchor="middle" class="ft-mut">' + esc(st.quiz ? '2: d₂ = ' + F(st.d2, 1) + ' cm' : 'point 2') + '</text>';
    if(st.dy > 0){ inner += '<line class="ft-wl" x1="' + (PP.xd - 4) + '" x2="' + (PP.xd + 14) + '" y1="' + g.c1 + '" y2="' + g.c1 + '" opacity=".5"/><line class="ft-wl" x1="' + (PP.xd - 4) + '" x2="' + (PP.xd + 14) + '" y1="' + g.c2.toFixed(1) + '" y2="' + g.c2.toFixed(1) + '" opacity=".5"/><path class="ft-dim" d="M' + (PP.xd + 10) + ' ' + g.c1 + 'V' + g.c2.toFixed(1) + '"/><text x="' + (PP.xd + 16) + '" y="' + ((g.c1 + g.c2) / 2 + 4).toFixed(1) + '" class="ft-mut">' + F(st.dy, 1) + ' m</text>'; }
    return S.svg(400, 300, st.label || 'A full pipe that narrows and rises, with pressure gauges at two points.', inner).replace('class="phys-scene"', 'class="phys-scene ft-svg"');
  }

  /* Hole in a tank. st: { fluid, H (m), yh (m), quiz?, t (jet phase) } */
  var HS = { x0: 40, x1: 120, ground: 300, ppm: 120 };
  function holeSvg(st){
    var p = 'ft' + (++gid), ys = HS.ground - st.H * HS.ppm, yhP = HS.ground - st.yh * HS.ppm, rim = HS.ground - 2.25 * HS.ppm, res = FT.hole(st.H, st.yh);
    var t = tankSvg(st.fluid, HS.x0, HS.x1, rim, HS.ground - 4, ys, p), inner = defs(p) + t.back + t.surf;
    inner += '<line class="ft-ground" x1="10" x2="395" y1="' + (HS.ground + 12) + '" y2="' + (HS.ground + 12) + '"/>';
    for(var gx = 16; gx < 395; gx += 14) inner += '<line class="ft-hatch" x1="' + gx + '" x2="' + (gx - 8) + '" y1="' + (HS.ground + 12) + '" y2="' + (HS.ground + 20) + '"/>';
    // the jet: x = v t, y = ½ g t² (to the ground line)
    var pts = [], n = 40, tt = res.t;
    for(var i = 0; i <= n; i++){ var s = tt * i / n; pts.push((HS.x1 + 3 + res.v * s * HS.ppm).toFixed(1) + ' ' + (yhP + 0.5 * G * s * s * HS.ppm).toFixed(1)); }
    if(!st.quiz && res.h > 0.005){
      inner += '<path class="ft-jet ' + st.fluid + '" stroke-width="' + (st.thin ? 4 : 6) + '" d="M' + pts.join('L') + '"/>';
      if(st.drops) inner += st.drops;
      inner += S.arrow(HS.x1 + 6, yhP, Math.min(90, res.v * 14), 0, { cls: 'vel', label: 'v', head: 8 });
      var R = HS.x1 + 3 + res.range * HS.ppm;
      inner += '<path class="ft-dim" d="M' + (HS.x1 + 3) + ' ' + (HS.ground + 30) + 'H' + R.toFixed(1) + 'm0 -5v10M' + (HS.x1 + 3) + ' ' + (HS.ground + 25) + 'v10"/><text x="' + ((HS.x1 + R) / 2).toFixed(1) + '" y="' + (HS.ground + 45) + '" text-anchor="middle" class="ft-mut">' + F(res.range, 2) + ' m</text>';
    }
    inner += '<circle cx="' + HS.x1 + '" cy="' + yhP.toFixed(1) + '" r="3.5" fill="var(--ink)"/>';
    // depth h from the surface to the hole, and the hole's height
    inner += '<path class="ft-dim" d="M' + (HS.x0 - 14) + ' ' + ys.toFixed(1) + 'V' + yhP.toFixed(1) + 'm-5 0h10m-10 ' + (ys - yhP).toFixed(1) + 'h10"/><text x="' + (HS.x0 - 20) + '" y="' + ((ys + yhP) / 2 + 4).toFixed(1) + '" text-anchor="end" class="ft-mut">h</text>';
    inner += '<path class="ft-dim" d="M' + (HS.x1 + 16) + ' ' + (yhP + 6).toFixed(1) + 'V' + (HS.ground) + '" stroke-dasharray="3 3"/><text x="' + (HS.x1 + 22) + '" y="' + ((yhP + HS.ground) / 2 + 4).toFixed(1) + '" class="ft-mut">' + F(st.yh, 2) + ' m</text>';
    return S.svg(400, 350, st.label || 'A tank of water with a small hole near the bottom and the jet it makes.', inner).replace('class="phys-scene"', 'class="phys-scene ft-svg"');
  }

  /* ------------------------------------------------------------ mount */
  T.mount('fluids-tank', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'fluids-tank', labels: ['Explore', 'Test yourself'],
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(ex){ if(m === 'explore') ex.resume(); else ex.pause(); } },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ---------------------------------------------------------- explore */
  function explore(host, data){
    var live = (data.scenes || SCENES.map(function(s){ return s.id; }));
    var scenes = SCENES.filter(function(s){ return live.indexOf(s.id) > -1 || live.some(function(x){ return x && x.id === s.id; }); });
    if(!scenes.length) scenes = SCENES.slice(0, 2);
    var st = { scene: scenes[0].id, fluid: 'water', obj: 'wood', hook: -0.05, probe: 3.0, d1: 6, d2: 3, dy: 1.0, v1: 1.0, P1: 150000, H: 1.5, yh: 0.5 };
    var sim = null, loop = null, flow = null, flowT = 0, LS = null, paused = false, started = false;
    host.classList.add('ft-root');
    host.innerHTML = '<section class="bt-problem ft-card">' +
      '<div class="ft-dock"><div class="ft-pair"><div class="ft-scenesel"></div><div class="ft-fluidsel"></div></div>' +
      '<div class="ft-grp" data-g="obj"><div class="ft-chips ls-scroll" role="group" aria-label="Object">' + Object.keys(FT.OBJECTS).map(function(k){ return '<button type="button" class="bt-btn" data-obj="' + k + '" aria-pressed="false">' + esc(FT.OBJECTS[k].name) + '</button>'; }).join('') + '</div></div>' +
      '<div class="ft-grp" data-g="float"><div class="bt-buttons"><button type="button" class="btn-press sm ft-drop">Drop it in</button><button type="button" class="bt-btn ft-push">Push it under</button></div></div>' +
      '<div class="ft-grp" data-g="scale"></div><div class="ft-grp" data-g="pressure"></div><div class="ft-grp" data-g="pipe"></div><div class="ft-grp" data-g="hole"></div></div>' +
      '<div class="ft-view show-scene"><div class="ft-vtoggle tseg" role="group" aria-label="Show"><button type="button" data-v="scene" aria-pressed="true" class="on">Tank</button><button type="button" data-v="panel" aria-pressed="false">Graph</button></div><div class="ft-scene"></div><div class="ft-panel"></div></div>' +
      '<div class="ft-say"></div><p class="sr-only ft-live"></p>' +
      T.moreHtml('<div class="ft-grp" data-g="pipe-more"></div><p class="bt-small">g = 9.8 m/s². P<sub>atm</sub> = 1.0 × 10⁵ Pa. The fluids are ideal: incompressible, no viscosity, and the pipe runs full.</p><div class="ft-nums"></div>', 'flow speed and pressure, the numbers') + '</section>';
    var $ = function(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); };
    var $$ = function(sel){ var a = Array.prototype.slice.call(host.querySelectorAll(sel)); return LS ? a.concat(Array.prototype.slice.call(LS.root.querySelectorAll(sel))) : a; };
    var dock = host.querySelector('.ft-dock'), view = host.querySelector('.ft-view'), sceneEl = host.querySelector('.ft-scene'), panelEl = host.querySelector('.ft-panel');
    var say = T.announcer(host.querySelector('.ft-live'));
    var cue = T.cue('Pick an object, then press <b>Drop it in</b>.');
    dock.insertBefore(cue.el, dock.firstChild);
    var grp = function(g){ return host.querySelector('.ft-grp[data-g="' + g + '"]') || $('.ft-grp[data-g="' + g + '"]'); };
    var sl = {};
    function addSlider(g, key, o){ o.onInput = function(v){ touched(); st[key] = v; if(key === 'hook' || key === 'probe') draw(); else draw(); }; sl[key] = T.slider(o); grp(g).appendChild(sl[key].el); }
    addSlider('scale', 'hook', { label: 'Lower the object (depth of its bottom)', min: -0.05, max: 0.25, step: 0.005, value: st.hook, unit: 'm', decimals: 3 });
    addSlider('pressure', 'probe', { label: 'Depth of the probe', min: 0, max: 10, step: 0.1, value: st.probe, unit: 'm', decimals: 1 });
    addSlider('pipe', 'd2', { label: 'Diameter of the narrow end', min: 2.5, max: 6, step: 0.1, value: st.d2, unit: 'cm', decimals: 1 });
    addSlider('pipe', 'dy', { label: 'Rise of the narrow end', min: 0, max: 3, step: 0.1, value: st.dy, unit: 'm', decimals: 1 });
    addSlider('pipe-more', 'v1', { label: 'Speed in the wide part, v₁', min: 0.2, max: 2, step: 0.1, value: st.v1, unit: 'm/s', decimals: 1 });
    addSlider('pipe-more', 'P1', { label: 'Absolute pressure at 1, P₁', min: 120000, max: 250000, step: 5000, value: st.P1, unit: 'Pa', decimals: 0 });
    addSlider('hole', 'H', { label: 'Water level in the tank', min: 0.3, max: 2, step: 0.05, value: st.H, unit: 'm', decimals: 2 });
    addSlider('hole', 'yh', { label: 'Height of the hole', min: 0.05, max: 1.9, step: 0.05, value: st.yh, unit: 'm', decimals: 2 });
    sl.P1.el.querySelector('output').setAttribute('data-k', 'kPa');

    function touched(){ if(!started){ started = true; cue.done(); } }
    function obj(){ return FT.OBJECTS[st.obj]; }
    function rhoF(){ return FT.FLUIDS[st.fluid].rho; }
    function fname(){ return FT.FLUIDS[st.fluid].name.toLowerCase(); }

    /* -------- float: the drop */
    function newSim(y0){ stopLoop(); sim = FT.sim(obj(), rhoF(), TK.depth, y0); }
    function drop(y0){
      touched(); newSim(y0 == null ? -0.10 : y0);
      loop = S.loop(function(dt){ if(paused) return; sim.step(dt); draw(); return !sim.state.still; }, { duration: 9, still: function(){ sim.end(); draw(); }, onEnd: function(){ loop = null; if(!sim.state.still){ sim.end(); } draw(); } });
      loop.start();
    }
    function stopLoop(){ if(loop){ loop.stop(); loop = null; } }
    function floatEnd(){ var s = FT.settle(obj(), rhoF()); return s; }

    /* -------- pipe / hole: the moving dots */
    function flowTick(){
      if(flow) return;
      flow = S.loop(function(dt){ if(paused) return; flowT += dt; drawScene(); }, {});
      flow.start();
    }
    function flowStop(){ if(flow){ flow.stop(); flow = null; } }

    /* -------- controls */
    var sceneSel = T.choiceSelect({ label: 'Scene', options: scenes.map(function(x){ return { value: x.id, label: x.label }; }), value: st.scene, onChange: function(v){ touched(); setScene(v); } });
    host.querySelector('.ft-scenesel').appendChild(sceneSel.el);
    var fluidSel = T.choiceSelect({ label: 'Fluid', options: Object.keys(FT.FLUIDS).map(function(k){ return { value: k, label: FT.FLUIDS[k].name }; }), value: st.fluid, onChange: function(v){ touched(); st.fluid = v; if(st.scene === 'float') drop(); else draw(); } });
    host.querySelector('.ft-fluidsel').appendChild(fluidSel.el);
    $$('[data-obj]').forEach(function(b){ b.addEventListener('click', function(){ st.obj = b.getAttribute('data-obj'); if(st.scene === 'float') drop(); else { touched(); draw(); } }); });
    host.querySelector('.ft-drop').addEventListener('click', function(){ drop(); });
    view.querySelectorAll('.ft-vtoggle button').forEach(function(b){ b.addEventListener('click', function(){
      var v = b.getAttribute('data-v'); view.classList.toggle('show-scene', v === 'scene'); view.classList.toggle('show-panel', v === 'panel');
      view.querySelectorAll('.ft-vtoggle button').forEach(function(x){ var on = x === b; x.setAttribute('aria-pressed', String(on)); x.classList.toggle('on', on); });
    }); });
    host.querySelector('.ft-push').addEventListener('click', function(){ touched(); newSim(Math.min(TK.depth - 0.002, FT.height(obj()) + 0.1)); drop(sim.state.y); });

    function setScene(id){
      st.scene = id; stopLoop(); flowStop();
      sceneSel.set(id);
      ['obj', 'float', 'scale', 'pressure', 'pipe', 'hole'].forEach(function(g){ var e = grp(g); if(e) e.hidden = !(g === id || g === 'obj' && (id === 'float' || id === 'scale')); });
      var pm = grp('pipe-more'); if(pm) pm.hidden = id !== 'pipe';
      if(id === 'float'){ if(!sim) newSim(-0.10); else newSim(sim.state.y); if(!started) sim.state.y = -0.10; }
      if(id === 'pipe' || id === 'hole') flowTick();
      draw();
      if(LS) LS.detailsTitle(id === 'pipe' ? 'Flow & numbers' : 'Numbers');
    }

    /* -------- the scene and the panel */
    var lastSvg = '';
    function dotsPipe(res){
      var g = pipeGeom(st), out = '', lanes = [0.2, 0.5, 0.8], A1 = Math.PI * st.d1 * st.d1 / 4;
      // a dot's "volume coordinate" u moves at Q; x from u through ∫A dx
      var xs = [], acc = [0], n = 120;
      for(var i = 0; i <= n; i++) xs.push(PP.xa + (PP.xd - PP.xa) * i / n);
      for(i = 1; i <= n; i++){ var a = g.at(xs[i]).r, b = g.at(xs[i - 1]).r; acc.push(acc[i - 1] + (a * a + b * b) / 2 * (xs[i] - xs[i - 1])); }
      var tot = acc[n], spacing = tot / 26, speed = (g.r1 * g.r1) * st.v1 * 30;
      function xOf(u){ var lo = 0, hi = n; while(hi - lo > 1){ var m = (lo + hi) >> 1; if(acc[m] < u) lo = m; else hi = m; } var f = (u - acc[lo]) / Math.max(1e-9, acc[hi] - acc[lo]); return xs[lo] + f * (xs[hi] - xs[lo]); }
      var off = (flowT * speed) % spacing;
      for(var u = off; u < tot; u += spacing){
        var x = xOf(u), q = g.at(x);
        lanes.forEach(function(l, j){ out += '<circle class="ft-dot" cx="' + x.toFixed(1) + '" cy="' + (q.c - q.r + 2 * q.r * l).toFixed(1) + '" r="' + (j === 1 ? 3.2 : 2.6) + '"/>'; });
      }
      return out;
    }
    function dropsHole(){
      var res = FT.hole(st.H, st.yh); if(res.h < 0.005) return '';
      var yhP = HS.ground - st.yh * HS.ppm, out = '', k = 6;
      for(var i = 0; i < k; i++){ var s = ((flowT * 0.6 + i / k) % 1) * res.t; out += '<circle class="ft-dot" cx="' + (HS.x1 + 3 + res.v * s * HS.ppm).toFixed(1) + '" cy="' + (yhP + 0.5 * G * s * s * HS.ppm).toFixed(1) + '" r="2.2"/>'; }
      return out;
    }
    function pipeRes(){
      var r = FT.pipe({ rho: rhoF(), v1: st.v1, d1: st.d1 / 100, d2: st.d2 / 100, y1: 0, y2: st.dy, P1: st.P1 });
      r.v1 = st.v1; r.P1 = st.P1; return r;
    }
    function drawScene(){
      var svg = '', o = obj();
      if(st.scene === 'float'){
        var y = sim ? sim.state.y : -0.10, f = FT.forces(o, rhoF(), y, TK.depth);
        svg = floatSvg({ fluid: st.fluid, obj: o, y: y, label: o.name + ' in ' + fname() + ': ' + stateWords(y, f) });
      } else if(st.scene === 'scale'){
        var r = FT.scale(o, rhoF(), st.hook);
        svg = scaleSvg({ fluid: st.fluid, obj: o, hook: st.hook, res: r, max: scaleMax(o), label: o.name + ' on a spring scale, bottom ' + F(r.y * 100, 1) + ' cm below the surface of ' + fname() + '. The scale reads ' + F(r.reading, 2) + ' N.' });
      } else if(st.scene === 'pressure'){
        var P = FT.pressure(st.probe, rhoF());
        svg = pressureSvg({ fluid: st.fluid, depth: st.probe, label: 'A 10 m deep tank of ' + fname() + '. The probe is ' + F(st.probe, 1) + ' m down: gauge pressure ' + F(P.gauge / 1000, 1) + ' kPa, absolute ' + F(P.abs / 1000, 1) + ' kPa.' });
      } else if(st.scene === 'pipe'){
        var pr = pipeRes();
        svg = pipeSvg({ fluid: st.fluid, d1: st.d1, d2: st.d2, dy: st.dy, res: pr, dots: dotsPipe(pr), label: 'A full pipe of ' + fname() + ' narrows from ' + F(st.d1, 1) + ' cm to ' + F(st.d2, 1) + ' cm and rises ' + F(st.dy, 1) + ' m. Speed ' + F(st.v1, 1) + ' m/s then ' + F(pr.v2, 2) + ' m/s; pressure ' + F(pr.P1 / 1000, 0) + ' kPa then ' + F(pr.P2 / 1000, 1) + ' kPa.' });
      } else {
        var hr = FT.hole(st.H, st.yh);
        svg = holeSvg({ fluid: st.fluid, H: st.H, yh: st.yh, drops: dropsHole(), label: 'A tank of ' + fname() + ' filled to ' + F(st.H, 2) + ' m with a hole ' + F(st.yh, 2) + ' m above the floor. The jet leaves at ' + F(hr.v, 2) + ' m/s and lands ' + F(hr.range, 2) + ' m away.' });
      }
      if(svg !== lastSvg){ sceneEl.innerHTML = svg; lastSvg = svg; bindScene(); }
    }
    function scaleMax(o){ var w = FT.mass(o) * G; return w <= 4 ? 4 : w <= 5 ? 5 : 10; }
    function stateWords(y, f){
      if(y < 0) return 'held above the tank.';
      var e = floatEnd(), still = sim && sim.state.still;
      if(!still) return 'moving: weight ' + F(f.Fg, 2) + ' N, buoyant force ' + F(f.Fb, 2) + ' N.';
      return e.state === 'floats' ? 'floats with ' + F(e.frac * 100, 0) + '% of its volume under the surface.' : e.state === 'sinks' ? 'sinks and rests on the bottom.' : 'hovers: it stays at whatever depth it is.';
    }

    /* Drag in the scene: the probe (pressure), the object (float), the scale's object (scale). */
    var dragging = false;
    function svgY(e, svg){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()).y : 0; }
    function bindScene(){
      var svg = sceneEl.querySelector('svg'); if(!svg) return;
      svg.onpointerdown = function(e){
        if(st.scene !== 'pressure' && st.scene !== 'float' && st.scene !== 'scale') return;
        dragging = true; touched(); try{ svg.setPointerCapture(e.pointerId); }catch(x){}
        if(st.scene === 'float') stopLoop();
        move(e); e.preventDefault();
      };
      svg.onpointermove = function(e){ if(dragging) move(e); };
      svg.onpointerup = svg.onpointercancel = function(){ if(!dragging) return; dragging = false; if(st.scene === 'float') drop(sim.state.y); };
    }
    function move(e){
      var svg = sceneEl.querySelector('svg'), y = svgY(e, svg);
      if(st.scene === 'pressure'){ var d = Math.max(0, Math.min(10, (y - 52) / ((330 - 52) / 10))); st.probe = M.round(d, 1); sl.probe.set(st.probe); draw(); }
      else if(st.scene === 'scale'){ var h = FT.height(obj()), ys = SK.floor - SK.depth * SK.ppm, b = (y - ys) / SK.ppm + h / 2; st.hook = Math.max(-0.05, Math.min(0.25, M.round(b, 3))); sl.hook.set(st.hook); draw(); }
      else { var hh = FT.height(obj()), bb = (y - surfY()) / TK.ppm + hh / 2; if(!sim) newSim(-0.1); sim.state.y = Math.max(-0.10, Math.min(TK.depth, bb)); sim.state.v = 0; sim.state.still = false; draw(); }
    }

    function plotPanel(){
      var o = obj(), rf = rhoF(), out = '';
      if(st.scene === 'float'){
        var y = sim ? sim.state.y : -0.1, f = FT.forces(o, rf, y, TK.depth), fbMax = rf * FT.volume(o) * G, nm = o.name.toLowerCase().replace(/^hollow /, '');
        out = '<figure class="ft-fbdfig"><figcaption class="ft-cap">Forces on the ' + esc(nm) + ', to scale</figcaption>' + fbdSvg(fbdList(f, FT.FLUIDS[st.fluid].name.toLowerCase(), nm), nm, 'Arrows start on the object; the agent is named with each force. Fully under, F_b would be ' + F(fbMax, 2) + ' N (F_g = ' + F(f.Fg, 2) + ' N).') + '</figure>';
        out = out.replace(/F_b would/, 'F<sub>b</sub> would').replace(/\(F_g =/, '(F<sub>g</sub> =');
      } else if(st.scene === 'scale'){
        var pts = [], mx = scaleMax(o);
        for(var d = -0.05; d <= 0.25 + 1e-9; d += 0.0025) pts.push([d * 100, FT.scale(o, rf, d).reading]);
        var r = FT.scale(o, rf, st.hook), nm2 = o.name.toLowerCase().replace(/^hollow /, '');
        out = '<div class="ft-two"><figure class="ft-fbdfig"><figcaption class="ft-cap">Forces on the ' + esc(nm2) + '</figcaption>' + fbdSvg(fbdList({ Fg: r.Fg, Fb: r.Fb, N: 0, T: r.reading }, FT.FLUIDS[st.fluid].name.toLowerCase(), nm2, true), nm2, '', 260) + '</figure>' + T.plot({ w: 360, h: 300, title: 'Scale reading against depth of the bottom of the ' + o.name.toLowerCase() + ', from 5 cm above the surface to 25 cm below. Now ' + F(r.reading, 2) + ' N.',
          x: { label: 'Depth of its bottom', unit: 'cm', min: -5, max: 25, step: 5 }, y: { label: 'Scale reading', unit: 'N', min: 0, max: mx, step: mx / 5 },
          curves: [{ cls: 's1', points: pts }], points: [{ x: st.hook * 100, y: r.reading, cls: 's2' }], vline: { x: 0, cls: '' } }) + '</div>';
      } else if(st.scene === 'pressure'){
        var g = [], a = [];
        for(var z = 0; z <= 10.001; z += 0.5){ var P = FT.pressure(z, rf); g.push([z, P.gauge / 1000]); a.push([z, P.abs / 1000]); }
        var Pn = FT.pressure(st.probe, rf);
        out = T.plot({ w: 360, h: 330, title: 'Pressure against depth in ' + fname() + ': absolute (solid) and gauge (dashed), both straight lines with slope ρg. At ' + F(st.probe, 1) + ' m: ' + F(Pn.abs / 1000, 1) + ' and ' + F(Pn.gauge / 1000, 1) + ' kPa.',
          x: { label: 'Depth', unit: 'm', min: 0, max: 10, step: 2 }, y: { label: 'Pressure', unit: 'kPa', min: 0, max: 250, step: 50 },
          curves: [{ cls: 's1', points: a }, { cls: 's3', points: g, dashed: true }], points: [{ x: st.probe, y: Pn.abs / 1000, cls: 's2' }, { x: st.probe, y: Pn.gauge / 1000, cls: 's2', square: true }] });
        var ly = function(P0){ return (16 + 258 * (1 - (P0 + rf * G * 8.6 / 1000) / 250) - 9).toFixed(0); };
        out = out.replace('</svg>', '<text class="tick" x="305" y="' + ly(100) + '" text-anchor="middle">absolute</text><text class="tick" x="305" y="' + ly(0) + '" text-anchor="middle">gauge</text></svg>');
      } else if(st.scene === 'pipe'){
        out = bernoulliBars(pipeRes());
      } else {
        var c = [], hr = FT.hole(st.H, st.yh);
        for(var hh = 0; hh <= 2.0001; hh += 0.05) c.push([hh, Math.sqrt(2 * G * hh)]);
        out = T.plot({ w: 360, h: 330, title: 'Exit speed against depth of the hole below the surface: v = √(2gh), a curve that flattens. Now h = ' + F(hr.h, 2) + ' m, v = ' + F(hr.v, 2) + ' m/s.',
          x: { label: 'Depth of the hole, h', unit: 'm', min: 0, max: 2, step: 0.5 }, y: { label: 'Exit speed', unit: 'm/s', min: 0, max: 7, step: 1 },
          curves: [{ cls: 's1', points: c }], points: [{ x: hr.h, y: hr.v, cls: 's2' }] });
      }
      panelEl.innerHTML = out;
    }
    /* Energy per unit volume at 1 and 2 (gauge pressure, so the bars compare):
       P_gauge + ½ρv² + ρgy is the same at both points. */
    function bernoulliBars(r){
      var rho = rhoF(), K1 = 0.5 * rho * st.v1 * st.v1, K2 = 0.5 * rho * r.v2 * r.v2, U2 = rho * G * st.dy, P1 = r.P1 - ATM, P2 = r.P2 - ATM, E = P1 + K1;
      var W = 360, H = 330, L = 60, B = 290, Tp = 24, top = T.niceMax(Math.max(E, K2 + U2) * 1.1) / 1000, sy = function(v){ return B - v / 1000 / top * (B - Tp); };
      var out = '<svg class="phys-svg bt-plot ft-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Energy per unit volume at points 1 and 2. At 1: gauge pressure ' + F(P1 / 1000, 1) + ' kPa plus ½ρv² ' + F(K1 / 1000, 2) + ' kPa. At 2: gauge pressure ' + F(P2 / 1000, 1) + ' kPa, ½ρv² ' + F(K2 / 1000, 2) + ' kPa, ρgy ' + F(U2 / 1000, 1) + ' kPa. Both add to ' + F(E / 1000, 1) + ' kPa.">';
      var step = T.niceStep(top, 5);
      for(var v = 0; v <= top + 1e-9; v += step){ var yy = sy(v * 1000); out += '<line class="grid" x1="' + L + '" x2="' + (W - 12) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/><text class="tick" x="' + (L - 7) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end">' + F(v, step < 1 ? 1 : 0) + '</text>'; }
      out += '<line class="axis" x1="' + L + '" x2="' + (W - 12) + '" y1="' + B + '" y2="' + B + '"/><line class="axis" x1="' + L + '" x2="' + L + '" y1="' + Tp + '" y2="' + B + '"/>';
      function seg(x, from, to, cls, lab){ if(Math.abs(to - from) < 1) return ''; var y1 = sy(Math.max(from, to)), y2 = sy(Math.min(from, to)); return '<rect class="ft-bar ' + cls + '" x="' + x + '" y="' + y1.toFixed(1) + '" width="70" height="' + Math.max(0.5, y2 - y1).toFixed(1) + '"' + '/>' + (y2 - y1 > 16 ? '<text class="ft-bar-t" x="' + (x + 35) + '" y="' + ((y1 + y2) / 2 + 5).toFixed(1) + '" text-anchor="middle">' + lab + '</text>' : ''); }
      var xA = 100, xB = 230;
      out += seg(xA, 0, K1, 'k', '½ρv²') + seg(xA, K1, K1 + P1, 'p', 'P gauge') + seg(xB, 0, U2, 'u', 'ρgy') + seg(xB, U2, U2 + K2, 'k', '½ρv²') + (P2 >= 0 ? seg(xB, U2 + K2, U2 + K2 + P2, 'p', 'P gauge') : '<rect x="' + xB + '" y="' + sy(U2 + K2).toFixed(1) + '" width="70" height="' + (sy(E) - sy(U2 + K2)).toFixed(1) + '" fill="var(--white)" fill-opacity=".55" stroke="var(--phys-s1)" stroke-dasharray="4 3"/>');
      out += '<line class="ft-eqline" x1="' + (xA - 12) + '" x2="' + (xB + 82) + '" y1="' + sy(E).toFixed(1) + '" y2="' + sy(E).toFixed(1) + '"/>';
      out += '<text class="lbl" x="' + (xA + 35) + '" y="' + (B + 20) + '" text-anchor="middle">Point 1</text><text class="lbl" x="' + (xB + 35) + '" y="' + (B + 20) + '" text-anchor="middle">Point 2</text>';
      out += '<text class="lbl" transform="translate(15 ' + ((Tp + B) / 2) + ') rotate(-90)" text-anchor="middle">Energy per volume (kPa)</text>';
      out += '<text class="tick" x="' + (xB + 84) + '" y="' + (sy(E) - 6).toFixed(1) + '" text-anchor="end">same total</text>';
      return out + '</svg>';
    }

    function readouts(){
      var o = obj(), rf = rhoF(), rows = [], pills = [], head = '', body = '';
      if(st.scene === 'float'){
        var y = sim ? sim.state.y : -0.1, f = FT.forces(o, rf, y, TK.depth), e = floatEnd(), still = sim && sim.state.still, V = FT.volume(o), m = FT.mass(o), fbMax = rf * V * G;
        var frac = FT.submerged(o, Math.max(0, y)) / V;
        pills = [{ k: 'Under', html: F(frac * 100, 0) + '%', tone: 'readout' }, { k: 'F_b', html: F(f.Fb, 2) + ' N', tone: 'readout' }];
        if(still || y >= 0 && loop == null) pills.push({ html: e.state === 'floats' ? 'Floats' : e.state === 'sinks' ? 'Sinks' : 'Hovers', tone: e.state === 'sinks' ? 'warn' : 'good' });
        var cmp = o.rho + ' kg/m³ against ' + rf + ' kg/m³';
        if(y < 0 && !loop){ head = 'Will the ' + o.name.toLowerCase() + ' float in ' + fname() + '? Drop it in.'; body = '<p>Compare densities: ' + cmp + '. Then watch the buoyant force grow as it goes under.</p>'; }
        else if(e.state === 'floats'){ head = o.name + ' floats with ' + F(e.frac * 100, 0) + '% under.'; body = '<p>It stops when the buoyant force equals its weight. The buoyant force is the weight of the fluid it pushes aside, so ρ<sub>fluid</sub>·V<sub>under</sub>·g = ρ<sub>object</sub>·V·g and V<sub>under</sub>/V = ρ<sub>object</sub>/ρ<sub>fluid</sub> = ' + o.rho + '/' + rf + ' = ' + F(e.frac, 3) + '.</p><p>Push it under and let go: fully under, F<sub>b</sub> = ' + F(fbMax, 2) + ' N is more than its ' + F(m * G, 2) + ' N weight, so the net force is up until it floats again.</p>'; }
        else if(e.state === 'sinks'){ head = o.name + ' sinks: even fully under, F<sub>b</sub> < F<sub>g</sub>.'; body = '<p>Its density is greater than the fluid\'s (' + cmp + '). Fully under, the fluid it displaces weighs ' + F(fbMax, 2) + ' N, less than its ' + F(m * G, 2) + ' N weight. On the bottom the floor supplies the rest: F<sub>N</sub> = F<sub>g</sub> − F<sub>b</sub> = ' + F(m * G - fbMax, 2) + ' N.</p><p>The buoyant force does not depend on the object\'s density, only on the fluid\'s density and the volume pushed aside.</p>'; }
        else { head = 'The hollow ball hovers: F<sub>b</sub> = F<sub>g</sub> once it is fully under.'; body = '<p>Its average density (shell plus air) equals the fluid\'s: ' + cmp + '. Fully under, the displaced fluid weighs exactly what the ball weighs, so the net force is zero at any depth. It drifts to a stop where the fluid\'s drag halts it. In salt water the same ball floats; in oil it sinks.</p>'; }
        if(!still && y >= 0 && loop) head = 'Going in: F<sub>b</sub> = ' + F(f.Fb, 2) + ' N, F<sub>g</sub> = ' + F(f.Fg, 2) + ' N.';
        rows = [['Object', o.name], ['Volume V', fm(V) + ' m³'], ['Density ρ<sub>object</sub>', o.rho + ' kg/m³'], ['Mass m', fm(m) + ' kg'], ['Weight F<sub>g</sub> = mg', F(m * G, 2) + ' N'], ['Fluid', FT.FLUIDS[st.fluid].name + ', ' + rf + ' kg/m³'], ['F<sub>b</sub> if fully under = ρ<sub>fluid</sub>Vg', F(fbMax, 2) + ' N'], ['Under the surface now', F(frac * 100, 1) + '%'], ['F<sub>b</sub> now', F(f.Fb, 2) + ' N']];
        if(e.state === 'floats') rows.push(['Fraction under at rest = ρ<sub>object</sub>/ρ<sub>fluid</sub>', F(e.frac, 3)]);
      } else if(st.scene === 'scale'){
        var r = FT.scale(o, rf, st.hook);
        pills = [{ k: 'Scale', html: F(r.reading, 2) + ' N', tone: 'readout' }, { k: 'F_b', html: F(r.Fb, 2) + ' N', tone: 'readout' }];
        if(r.slack){ head = 'The string is slack: the ' + o.name.toLowerCase() + ' floats, so the scale reads 0.'; body = '<p>Less dense than ' + fname() + ', it needs only ' + F(r.frac * 100, 0) + '% under to make F<sub>b</sub> = F<sub>g</sub>. Lower the hook more and the string just goes slack.</p>'; }
        else if(r.frac <= 0){ head = 'In air the scale reads its weight: ' + F(r.Fg, 2) + ' N.'; body = '<p>The scale pulls up with F<sub>T</sub> = F<sub>g</sub> = mg. Lower it into ' + fname() + ' and watch the reading drop.</p>'; }
        else if(r.frac < 0.999){ head = 'Partly under: the scale reads ' + F(r.Fg, 2) + ' − ' + F(r.Fb, 2) + ' = ' + F(r.reading, 2) + ' N.'; body = '<p>At rest, F<sub>T</sub> + F<sub>b</sub> = F<sub>g</sub>. F<sub>b</sub> = ρ<sub>fluid</sub>V<sub>under</sub>g grows as more of it goes under, so the reading falls.</p>'; }
        else { head = 'Fully under, the reading stays at ' + F(r.reading, 2) + ' N however deep.'; body = '<p>The displaced volume cannot grow any more, so F<sub>b</sub> = ρ<sub>fluid</sub>Vg = ' + F(r.Fb, 2) + ' N is the same at every depth: the pressure is larger deeper down, but larger on the top AND the bottom by the same amount. The scale reads F<sub>g</sub> − F<sub>b</sub> (the "apparent weight"); its mass has not changed.</p>'; }
        rows = [['Object', o.name + ', ' + fm(FT.mass(o)) + ' kg'], ['Weight F<sub>g</sub>', F(r.Fg, 2) + ' N'], ['Under the surface', F(r.frac * 100, 1) + '%'], ['Buoyant force F<sub>b</sub>', F(r.Fb, 2) + ' N'], ['Scale reading F<sub>g</sub> − F<sub>b</sub>', F(r.reading, 2) + ' N']];
      } else if(st.scene === 'pressure'){
        var P = FT.pressure(st.probe, rf);
        pills = [{ k: 'Gauge', html: F(P.gauge / 1000, 1) + ' kPa', tone: 'readout' }, { k: 'Absolute', html: F(P.abs / 1000, 1) + ' kPa', tone: 'readout' }];
        head = 'At ' + F(st.probe, 1) + ' m: gauge ' + F(P.gauge / 1000, 1) + ' kPa, absolute ' + F(P.abs / 1000, 1) + ' kPa.';
        body = '<p>P = P<sub>atm</sub> + ρgh. The gauge pressure is the part from the fluid above the probe, ρgh = ' + rf + ' × 9.8 × ' + F(st.probe, 1) + ' = ' + fm(P.gauge) + ' Pa; the absolute pressure adds the air pushing on the surface.</p><p>Pressure pushes equally in every direction at one depth, and depends only on depth and the fluid\'s density, not on the tank\'s shape. In water it goes up by about 1 atmosphere every 10 m; oil, being less dense, needs about 12.8 m.</p>';
        rows = [['Fluid', FT.FLUIDS[st.fluid].name + ', ρ = ' + rf + ' kg/m³'], ['Depth h', F(st.probe, 1) + ' m'], ['Gauge pressure ρgh', fm(P.gauge) + ' Pa'], ['Atmospheric P<sub>atm</sub>', '1.0 × 10⁵ Pa'], ['Absolute P<sub>atm</sub> + ρgh', fm(P.abs) + ' Pa']];
      } else if(st.scene === 'pipe'){
        var pr = pipeRes(), ratio = pr.v2 / st.v1, low = pr.P2 < 10000;
        pills = [{ k: 'v₂', html: F(pr.v2, 2) + ' m/s', tone: 'readout' }, { k: 'P₂', html: F(pr.P2 / 1000, 1) + ' kPa', tone: low ? 'bad' : 'readout' }];
        head = 'Narrow end: ' + F(ratio, 2) + '× faster, pressure ' + F((pr.P1 - pr.P2) / 1000, 1) + ' kPa ' + (pr.P2 <= pr.P1 ? 'lower' : 'higher') + '.';
        body = '<p><b>Continuity:</b> the pipe runs full and the fluid is incompressible, so the same volume passes every point each second: A₁v₁ = A₂v₂, so v₂ = v₁(d₁/d₂)² = ' + F(st.v1, 1) + ' × (' + F(st.d1, 1) + '/' + F(st.d2, 1) + ')² = ' + F(pr.v2, 2) + ' m/s. Watch the dots speed up.</p>' +
          '<p><b>Bernoulli:</b> along the flow P + ½ρv² + ρgy is constant (energy per unit volume). Speeding up and rising both cost pressure: P₂ = P₁ + ½ρ(v₁² − v₂²) + ρg(y₁ − y₂) = ' + F(pr.P2 / 1000, 1) + ' kPa. The bars add to the same total at both points.</p>' + (low ? '<p>The pressure here is so low that a real liquid would start to boil (cavitate); the ideal model stops being a good one.</p>' : '');
        rows = [['Fluid', FT.FLUIDS[st.fluid].name + ', ρ = ' + rf + ' kg/m³'], ['A₁ (d₁ = ' + F(st.d1, 1) + ' cm)', fm(pr.A1) + ' m²'], ['A₂ (d₂ = ' + F(st.d2, 1) + ' cm)', fm(pr.A2) + ' m²'], ['Flow rate Q = A₁v₁', fm(pr.Q) + ' m³/s'], ['v₁, v₂', F(st.v1, 2) + ' m/s, ' + F(pr.v2, 2) + ' m/s'], ['Rise y₂ − y₁', F(st.dy, 1) + ' m'], ['P₁, P₂ (absolute)', F(pr.P1 / 1000, 1) + ' kPa, ' + F(pr.P2 / 1000, 1) + ' kPa']];
      } else {
        var hr = FT.hole(st.H, st.yh);
        pills = [{ k: 'v', html: F(hr.v, 2) + ' m/s', tone: 'readout' }, { k: 'Lands', html: F(hr.range, 2) + ' m', tone: 'readout' }];
        if(hr.h <= 0.005){ head = 'The hole is above the water: nothing comes out.'; body = '<p>Raise the water level above the hole.</p>'; }
        else { head = 'The jet leaves at ' + F(hr.v, 2) + ' m/s, as fast as a drop falling ' + F(hr.h, 2) + ' m.'; body = '<p>The surface and the jet are both at atmospheric pressure, and the wide surface barely moves, so Bernoulli between them leaves ρgh = ½ρv²: v = √(2gh) = √(2 × 9.8 × ' + F(hr.h, 2) + ') = ' + F(hr.v, 2) + ' m/s. The density cancels: oil and salt water leave at the same speed.</p><p>Then it is a projectile: it falls ' + F(st.yh, 2) + ' m in t = √(2y/g) = ' + F(hr.t, 3) + ' s and lands ' + F(hr.range, 2) + ' m away. Four times the depth only doubles the speed.</p>'; }
        rows = [['Water level H', F(st.H, 2) + ' m'], ['Hole height', F(st.yh, 2) + ' m'], ['Depth of hole h', F(hr.h, 2) + ' m'], ['Exit speed √(2gh)', F(hr.v, 2) + ' m/s'], ['Fall time √(2y/g)', F(hr.t, 3) + ' s'], ['Range v·t', F(hr.range, 2) + ' m']];
      }
      return { pills: pills, head: head, body: body, rows: rows };
    }
    var lastHead = '';
    function draw(){
      drawScene(); plotPanel();
      $$('[data-obj]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-obj') === st.obj)); });
      if(st.scene === 'hole' && st.yh > st.H - 0.05 && sl.yh){ /* allowed: a hole above the water gives no jet */ }
      var r = readouts();
      T.explain(host.querySelector('.ft-say') || $('.ft-say'), r.head, r.body);
      var nums = $('.ft-nums');
      if(nums) nums.innerHTML = '<table class="ls-tbl"><caption class="sr-only">The numbers</caption><tbody>' + r.rows.map(function(x){ return '<tr><th scope="row">' + x[0] + '</th><td class="r">' + x[1] + '</td></tr>'; }).join('') + '</tbody></table>';
      if(LS){ LS.pills(r.pills.map(function(p){ return { k: p.k ? p.k.replace(/_([a-z])/, '<sub>$1</sub>') : p.k, html: p.html, tone: p.tone }; }), 'left', 'explore'); LS.caption(r.head, 'explore'); }
      if(r.head !== lastHead){ lastHead = r.head; say(r.head.replace(/<[^>]+>/g, '')); }
    }
    sl.P1.el.querySelector('output').textContent = F(st.P1 / 1000, 0) + ' kPa';
    var P1in = sl.P1.input;
    function P1show(){ var o = sl.P1.el.querySelector('output'); o.textContent = F(+P1in.value / 1000, 0) + ' kPa'; P1in.setAttribute('aria-valuetext', o.textContent); }
    P1in.addEventListener('input', P1show); sl.P1.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', P1show); }); P1show();

    /* Tool Studio: the tank and the graph on the stage; scene, fluid and the
       scene's controls in the dock; the reasoning in Why; numbers in Details. */
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [view], dock: [dock], why: [host.querySelector('.ft-say')], details: [] });
      s.detailsTitle('Numbers');
      draw();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.ft-drop'), text: 'Drop it in and watch the forces' });
    }
    setScene(st.scene);
    return {
      studio: studio,
      pause: function(){ paused = true; stopLoop(); flowStop(); },
      resume: function(){ paused = false; if(st.scene === 'pipe' || st.scene === 'hole') flowTick(); draw(); }
    };
  }

  /* -------------------------------------------------------------- quiz */
  var KINDS = [{ value: 'density', label: 'Density: float or sink' }, { value: 'buoyant', label: 'Buoyant force' }, { value: 'float', label: 'Floating: fraction under' }, { value: 'apparent', label: 'Spring scale under water' },
    { value: 'pressure', label: 'Pressure at depth' }, { value: 'continuity', label: 'Continuity' }, { value: 'bernoulli', label: 'Bernoulli' }, { value: 'hole', label: 'Hole in a tank' }];
  function quizFigure(p){
    var v = p.values, fl = v.rhoF === 800 ? 'oil' : v.rhoF === 1025 ? 'salt' : 'water';
    var cube = function(rho, side){ return { key: rho > 2000 ? 'aluminum' : rho > 900 && rho < 960 ? 'ice' : 'wood', shape: 'box', side: side, rho: rho }; };
    if(p.type === 'density'){
      var dm = (p.text.match(/(\d+) cm × (\d+) cm × (\d+) cm/) || []).slice(1).map(Number), id = 'ft' + (++gid), a = dm[0], b = dm[1], c = dm[2], k = Math.min(16, 200 / (a + b * 0.5), 110 / (c + b * 0.5));
      var W = a * k, Hh = c * k, D = b * k * 0.5, x0 = 200 - (W + D) / 2, y0 = 222, light = v.rho < 1000;
      var top = light ? '#E7C28A' : '#D5DBDF', front = light ? 'url(#' + id + 'wd)' : 'url(#' + id + 'al)', side = light ? '#A87438' : '#8D979E', st2 = light ? '#7A4E1C' : '#59636B';
      var inner = defs(id) + '<rect x="90" y="226" width="220" height="16" rx="5" class="ft-steel"/><rect x="70" y="242" width="260" height="56" rx="10" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/><rect x="150" y="256" width="100" height="30" rx="5" fill="#1F2A28"/><text x="200" y="278" text-anchor="middle" style="fill:#9FF2C6;font:700 18px var(--font-mono)">' + F(v.m * 1000, 0) + ' g</text>';
      inner += '<path d="M' + x0 + ' ' + (y0 - Hh) + 'l' + D + ' ' + (-D * 0.6) + 'h' + W + 'l' + (-D) + ' ' + (D * 0.6) + 'z" fill="' + top + '" stroke="' + st2 + '" stroke-width="2"/>' +
        '<path d="M' + (x0 + W) + ' ' + y0 + 'v' + (-Hh) + 'l' + D + ' ' + (-D * 0.6) + 'v' + Hh + 'z" fill="' + side + '" stroke="' + st2 + '" stroke-width="2"/>' +
        '<rect x="' + x0 + '" y="' + (y0 - Hh) + '" width="' + W + '" height="' + Hh + '" fill="' + front + '" stroke="' + st2 + '" stroke-width="2"/>';
      inner += '<text x="' + (x0 + W / 2) + '" y="' + (y0 - Hh - D * 0.6 - 10) + '" text-anchor="middle" class="ft-mut" style="font-size:14px">' + a + ' cm</text><text x="' + (x0 - 8) + '" y="' + (y0 - Hh / 2 + 5) + '" text-anchor="end" class="ft-mut" style="font-size:14px">' + c + ' cm</text><text x="' + (x0 + W + D + 8) + '" y="' + (y0 - Hh - D * 0.3 + 5) + '" class="ft-mut" style="font-size:14px">' + b + ' cm</text>';
      return S.svg(400, 310, 'A rectangular block, ' + a + ' cm by ' + b + ' cm by ' + c + ' cm, on an electronic balance reading ' + F(v.m * 1000, 0) + ' grams.', inner).replace('class="phys-scene"', 'class="phys-scene ft-svg"');
    }
    if(p.type === 'buoyant'){ var c = cube(v.rhoO, 0.08); return floatSvg({ fluid: fl, obj: c, y: TK.depth, label: 'A cube resting on the bottom of a tank, fully under the fluid.' }); }
    if(p.type === 'float'){ var o = cube(v.rhoO, 0.10); return floatSvg({ fluid: fl, obj: o, y: v.frac * 0.10, dims: 'depth?', label: 'A cube floating upright in a tank, part of it under the surface.' }); }
    if(p.type === 'apparent'){ var a = { key: 'aluminum', shape: 'box', side: 0.06, rho: 2700 }; return scaleSvg({ fluid: fl, obj: a, hook: 0.15, res: { reading: 0.6, Fg: 1, Fb: 0.4, y: 0.15, slack: false }, max: 1, quiz: true, label: 'A block hanging from a spring scale, fully under the fluid, not touching the bottom.' }); }
    if(p.type === 'pressure'){ return pressureSvg({ fluid: fl, depth: v.d, H: v.H, quiz: true, above: v.above, aboveLabel: F(v.above, 2) + ' m', label: 'A tank filled to ' + F(v.H, 2) + ' m with a pressure sensor ' + F(v.above, 2) + ' m above the bottom.' }); }
    if(p.type === 'continuity' || p.type === 'bernoulli'){ return pipeSvg({ fluid: 'water', d1: v.d1, d2: v.d2, dy: v.dy || 0, quiz: true, label: 'A full pipe that narrows from point 1 to point 2' + (v.dy ? ' and rises ' + F(v.dy, 1) + ' m' : '') + '.' }); }
    if(p.type === 'hole'){ return holeSvg({ fluid: 'water', H: v.H, yh: v.yHole, quiz: true, label: 'A tank of water with a small hole near the bottom.' }); }
    return '';
  }
  function quiz(host, data){
    T.drill(host, data, {
      slug: 'fluids-tank', noun: 'drill',
      generate: function(r, ctx, t){ return FT.generate(r, ctx, t); },
      types: KINDS, typeLabel: 'Kind of problem',
      title: function(p){ var k = KINDS.filter(function(x){ return x.value === p.type; })[0]; return k ? k.label : 'Fluids'; },
      extra: function(el, p){ var svg = quizFigure(p); el.classList.add('ft-root'); el.innerHTML = svg ? '<figure class="ft-fig cd-fig">' + svg + '</figure>' : ''; }
    });
  }
})();
