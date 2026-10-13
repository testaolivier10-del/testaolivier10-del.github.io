/* Scaling drills (skills tool, free; docs/apphys-spec.md section 6). OWNED BY
   THIS TOOL ONLY. Job: see how one quantity scales when another is
   multiplied, before computing it.

   Explore: pick a relation the student has reached (contexts unlock with
   their topics), drag a factor slider for each variable, and watch a
   before/after picture (squares, cubes, circles, two pendulums swinging with
   their real period ratio, two blocks on springs, two cars, two moons, two
   drops, a narrowing pipe) and a pair of bars for every quantity, with the
   factor written as a power ("× 3² = × 9").

   Test yourself: ApPhysTools.drill on ApPhysMath.scalingDrills.generate:
   factor problems (how it depends, then the factor), two changes at once,
   unit checks in kg, m and s, and SI conversions. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath, S = window.ApPhysScene;
  if(!T || !M || !M.scalingDrills) return;
  var SD = M.scalingDrills, PI = Math.PI;
  var here = document.currentScript && document.currentScript.src;
  if(here && !document.querySelector('link[data-sd-css], link[href$="tools/scaling-drills.css"]')){
    var ln = document.createElement('link'); ln.rel = 'stylesheet'; ln.href = here.replace(/scaling-drills\.js(\?.*)?$/, 'scaling-drills.css'); ln.setAttribute('data-sd-css', '1');
    document.head.appendChild(ln);
  }
  var esc = T.esc, F = T.F, sub = SD.sub;
  function nice(x){ var r = M.round(x, 3); return Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : Math.abs(x - 0.5) < 1e-9 ? '½' : Math.abs(x - 0.25) < 1e-9 ? '¼' : M.fmt(x, 3); }
  function pw(p){ return p === 0.5 ? '<sup>½</sup>' : p === -0.5 ? '<sup>−½</sup>' : p === 1 ? '' : '<sup>' + String(p).replace('-', '−') + '</sup>'; }
  function svgOut(w, h, label, inner){ return S.svg(w, h, label, inner).replace('class="phys-scene"', 'class="phys-scene sd-svg"'); }

  /* ------------------------------------------------------ the pictures
     pic(rel, k, t) -> SVG: "before" on the left, "after" on the right.
     k: { sym: factor } for every variable; t: animation time (s). */
  function head(){ return '<text x="100" y="22" text-anchor="middle" class="sd-h">Before</text><text x="300" y="22" text-anchor="middle" class="sd-h">After</text><line x1="200" x2="200" y1="34" y2="250" class="sd-div"/>'; }
  function kOf(k, sym){ return k[sym] == null ? 1 : k[sym]; }
  function pic(rel, k, t, f){
    var inner = head(), L = rel.pic, lab = '';
    if(L === 'square' || L === 'circle'){
      var s0 = 60, s1 = s0 * kOf(k, L === 'square' ? 's' : 'r'), mx = Math.max(s0, s1), sc = Math.min(1, 150 / mx);
      [[100, s0 * sc], [300, s1 * sc]].forEach(function(q, i){
        inner += L === 'square' ? '<rect x="' + (q[0] - q[1] / 2).toFixed(1) + '" y="' + (140 - q[1] / 2).toFixed(1) + '" width="' + q[1].toFixed(1) + '" height="' + q[1].toFixed(1) + '" class="sd-fill"/>'
          : '<circle cx="' + q[0] + '" cy="140" r="' + (q[1] / 2).toFixed(1) + '" class="sd-fill"/>';
        if(i === 1 && L === 'square'){ // tiles of the original size show the area factor
          var n = kOf(k, 's'); if(n >= 1 && Math.abs(n - Math.round(n)) < 1e-9 && n <= 4) for(var a = 1; a < n; a++){ var x = q[0] - q[1] / 2 + a * q[1] / n, y = 140 - q[1] / 2 + a * q[1] / n; inner += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + (140 - q[1] / 2).toFixed(1) + '" y2="' + (140 + q[1] / 2).toFixed(1) + '" class="sd-tile"/><line y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" x1="' + (q[0] - q[1] / 2).toFixed(1) + '" x2="' + (q[0] + q[1] / 2).toFixed(1) + '" class="sd-tile"/>'; }
        }
      });
      lab = L === 'square' ? 'Two squares: the side is scaled by ' + nice(kOf(k, 's')) + ' and the area by ' + nice(f) + '.' : 'Two circles: the radius is scaled by ' + nice(kOf(k, 'r')) + ' and the area by ' + nice(f) + '.';
    } else if(L === 'cube'){
      var e0 = 46, e1 = e0 * kOf(k, 's'), sc2 = Math.min(1, 120 / Math.max(e0, e1));
      [[100, e0 * sc2], [300, e1 * sc2]].forEach(function(q){
        var e = q[1], d = e * 0.45, x = q[0] - (e + d) / 2, y = 150 + e / 2;
        inner += '<path d="M' + x.toFixed(1) + ' ' + (y - e).toFixed(1) + 'l' + d.toFixed(1) + ' ' + (-d * 0.6).toFixed(1) + 'h' + e.toFixed(1) + 'l' + (-d).toFixed(1) + ' ' + (d * 0.6).toFixed(1) + 'z" class="sd-top"/>' +
          '<path d="M' + (x + e).toFixed(1) + ' ' + y.toFixed(1) + 'v' + (-e).toFixed(1) + 'l' + d.toFixed(1) + ' ' + (-d * 0.6).toFixed(1) + 'v' + e.toFixed(1) + 'z" class="sd-side"/>' +
          '<rect x="' + x.toFixed(1) + '" y="' + (y - e).toFixed(1) + '" width="' + e.toFixed(1) + '" height="' + e.toFixed(1) + '" class="sd-fill"/>';
      });
      lab = 'Two cubes: the edge is scaled by ' + nice(kOf(k, 's')) + ' and the volume by ' + nice(f) + '.';
    } else if(L === 'pendulum'){
      var Lk = kOf(k, 'L'), mk = kOf(k, 'm'), gk = kOf(k, 'g'), L0 = 90, sc3 = Math.min(1, 190 / Math.max(L0, L0 * Lk));
      [[100, L0 * sc3, 1, 1], [300, L0 * Lk * sc3, mk, Math.sqrt(Lk / gk)]].forEach(function(q){
        var Tn = 1.4 * q[3], a = 22 * Math.cos(2 * PI * t / Tn) * PI / 180, bx = q[0] + q[1] * Math.sin(a), by = 40 + q[1] * Math.cos(a), br = 7 + 5 * Math.cbrt(q[2]);
        inner += '<rect x="' + (q[0] - 30) + '" y="34" width="60" height="6" rx="2" class="sd-steel"/><line x1="' + q[0] + '" y1="40" x2="' + bx.toFixed(1) + '" y2="' + by.toFixed(1) + '" class="sd-string"/><circle cx="' + bx.toFixed(1) + '" cy="' + by.toFixed(1) + '" r="' + br.toFixed(1) + '" class="sd-bob"/>';
      });
      if(gk !== 1) inner += '<text x="300" y="250" text-anchor="middle" class="sd-mut">g × ' + nice(gk) + '</text>';
      lab = 'Two pendulums swinging side by side; the right one has length × ' + nice(Lk) + ', bob mass × ' + nice(mk) + ', g × ' + nice(gk) + ', so its period is × ' + nice(f) + '.';
    } else if(L === 'spring'){
      var mk2 = kOf(k, 'm'), kk = kOf(k, 'k'), Ak = kOf(k, 'A'), Tk = rel.Y.sym === 'T' ? f : 1;
      [[100, 1, 1, 1, 1], [300, mk2, kk, Ak, Tk]].forEach(function(q){
        var A = 22 * q[3], y = 150 + A * Math.cos(2 * PI * t / (1.2 * q[4])), top = 40, coils = 'M' + q[0] + ' ' + top + 'v6', N = 10, w = 8 + 4 * Math.min(2, Math.sqrt(q[2]));
        for(var i = 0; i < N; i++) coils += 'L' + (q[0] + (i % 2 ? -w : w)) + ' ' + (top + 6 + (y - top - 12) * (i + 0.5) / N).toFixed(1);
        coils += 'L' + q[0] + ' ' + (y - 6).toFixed(1) + 'V' + y.toFixed(1);
        var bs = 26 * Math.cbrt(q[1]);
        inner += '<rect x="' + (q[0] - 30) + '" y="34" width="60" height="6" rx="2" class="sd-steel"/><path d="' + coils + '" class="sd-spring" style="stroke-width:' + (1.6 + 0.8 * Math.min(2.5, q[2])).toFixed(1) + '"/><rect x="' + (q[0] - bs / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bs.toFixed(1) + '" height="' + bs.toFixed(1) + '" rx="3" class="sd-block"/>';
        inner += '<line x1="' + (q[0] + 40) + '" x2="' + (q[0] + 52) + '" y1="' + (150 - A).toFixed(1) + '" y2="' + (150 - A).toFixed(1) + '" class="sd-mark"/><line x1="' + (q[0] + 40) + '" x2="' + (q[0] + 52) + '" y1="' + (150 + A).toFixed(1) + '" y2="' + (150 + A).toFixed(1) + '" class="sd-mark"/>';
      });
      lab = 'Two blocks on springs oscillating side by side; the right one has mass × ' + nice(mk2) + ', spring constant × ' + nice(kk) + ', amplitude × ' + nice(Ak) + '.';
    } else if(L === 'car'){
      var vk = kOf(k, 'v'), mk3 = kOf(k, 'm');
      [[100, 1, 1], [300, vk, mk3]].forEach(function(q){
        var s = Math.cbrt(q[2]), w = 56 * Math.min(1.6, s), h = 18 * Math.min(1.6, s), x = q[0] - w / 2, y = 150;
        inner += '<path d="M' + x + ' ' + y + 'h' + w + 'v' + (-h) + 'l' + (-w * 0.2) + ' ' + (-h * 0.8) + 'h' + (-w * 0.5) + 'l' + (-w * 0.2) + ' ' + (h * 0.8) + 'h' + (-w * 0.1) + 'z" class="sd-car"/><circle cx="' + (x + w * 0.22) + '" cy="' + y + '" r="' + (h * 0.45).toFixed(1) + '" class="sd-wheel"/><circle cx="' + (x + w * 0.78) + '" cy="' + y + '" r="' + (h * 0.45).toFixed(1) + '" class="sd-wheel"/>';
        inner += S.arrow(q[0] - 40, 192, Math.min(90, 26 * q[1]), 0, { cls: 'vel', label: 'v', head: 8 });
      });
      lab = 'Two cars; the right one has speed × ' + nice(vk) + ' and mass × ' + nice(mk3) + '.';
    } else if(L === 'orbit'){
      var rk = kOf(k, 'r'), Mk = kOf(k, rel.vars[1].sym), r0 = 44, sc4 = Math.min(1, 88 / Math.max(r0, r0 * rk));
      [[100, r0 * sc4, 1, 1], [300, r0 * rk * sc4, Mk, rel.Y.sym === 'v' ? f : f]].forEach(function(q, i){
        inner += '<circle cx="' + q[0] + '" cy="145" r="' + (9 * Math.cbrt(rel.Y.sym === 'v' ? q[2] : 1)).toFixed(1) + '" class="sd-planet"/>';
        if(rel.Y.sym === 'v'){
          var ang = -t * 1.2 * (i ? f / rk : 1), sx = q[0] + q[1] * Math.cos(ang), sy = 145 + q[1] * Math.sin(ang);
          inner += '<circle cx="' + q[0] + '" cy="145" r="' + q[1].toFixed(1) + '" class="sd-orbit"/><circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="5" class="sd-sat"/>';
        } else {
          var mx2 = q[0] + q[1] + 16;
          inner += '<circle cx="' + Math.min(q[0] + 95, mx2).toFixed(1) + '" cy="145" r="' + (7 * Math.cbrt(q[2])).toFixed(1) + '" class="sd-sat"/>' + S.arrow(Math.min(q[0] + 95, mx2), 120, -Math.min(70, 26 * (i ? f : 1)), 0, { cls: 'f-grav', head: 8 });
        }
      });
      lab = rel.Y.sym === 'v' ? 'Two satellites in circular orbits; the right orbit has radius × ' + nice(rk) + '.' : 'A moon and the body it orbits; on the right the distance is × ' + nice(rk) + ' and the force arrow is × ' + nice(f) + '.';
    } else if(L === 'drop'){
      var hk = kOf(k, 'h'), gk2 = kOf(k, 'g'), h0 = 80, sc5 = Math.min(1, 200 / Math.max(h0, h0 * hk));
      [[100, h0 * sc5, 1, 1], [300, h0 * hk * sc5, gk2, f]].forEach(function(q){
        var fall = Math.min(1, ((t % 3.2) / (1.3 * q[3]))), yb = 245 - q[1] + q[1] * fall * fall;
        inner += '<line x1="' + (q[0] - 40) + '" x2="' + (q[0] + 40) + '" y1="252" y2="252" class="sd-ground"/><line x1="' + (q[0] - 30) + '" x2="' + (q[0] - 30) + '" y1="' + (245 - q[1]).toFixed(1) + '" y2="245" class="sd-dim"/><circle cx="' + q[0] + '" cy="' + yb.toFixed(1) + '" r="7" class="sd-bob"/>';
      });
      lab = 'Two balls dropped from rest; on the right the height is × ' + nice(hk) + ' and g is × ' + nice(gk2) + ', so the fall time is × ' + nice(f) + '.';
    } else if(L === 'pipe'){
      var dk = kOf(k, 'd'), off = (t * 40) % 24;
      [[100, 1, 1], [300, dk, f]].forEach(function(q){
        var r = 34 * Math.min(1, q[1]) * (q[1] > 1 ? 1 : 1), rr = Math.min(60, 26 * q[1]);
        inner += '<rect x="' + (q[0] - 80) + '" y="' + (145 - rr).toFixed(1) + '" width="160" height="' + (2 * rr).toFixed(1) + '" class="sd-water"/><path d="M' + (q[0] - 80) + ' ' + (145 - rr).toFixed(1) + 'h160M' + (q[0] - 80) + ' ' + (145 + rr).toFixed(1) + 'h160" class="sd-pipe"/>';
        var sp = 24, o = (off * Math.min(8, q[2])) % sp;
        for(var x = q[0] - 80 + o; x < q[0] + 80; x += sp) inner += '<circle cx="' + x.toFixed(1) + '" cy="145" r="3" class="sd-dot"/>';
      });
      lab = 'Water in a full pipe; on the right the diameter is × ' + nice(dk) + ' and the water moves × ' + nice(f) + ' as fast.';
    } else {
      inner = '';
      lab = '';
    }
    return lab ? svgOut(400, 260, lab, inner) : '';
  }
  /* Bars: for each variable and the result, a "before" bar of 1 and an
     "after" bar of its factor, on one linear scale. */
  function bars(rel, k, f){
    var hide = f == null;
    var items = rel.vars.map(function(v){ return { sym: v.sym, k: kOf(k, v.sym), p: v.p, name: v.name }; }).concat([{ sym: rel.Y.sym, k: hide ? 1 : f, y: true, name: rel.Y.name, hide: hide }]);
    var top = Math.max(1, Math.max.apply(null, items.map(function(x){ return x.k; })));
    var W = 400, rowH = 46, H = 22 + items.length * rowH, x0 = 92, bw = W - x0 - 72, out = '';
    items.forEach(function(it, i){
      var y = 16 + i * rowH, b1 = bw / top, b2 = bw * it.k / top;
      out += '<text x="' + (x0 - 10) + '" y="' + (y + 24) + '" text-anchor="end" class="sd-sym' + (it.y ? ' sd-y' : '') + '">' + sub(it.sym).replace(/<sub>/g, '<tspan dy="4" font-size=".7em">').replace(/<\/sub>/g, '</tspan><tspan dy="-4"></tspan>') + '</text>';
      out += '<rect x="' + x0 + '" y="' + (y + 4) + '" width="' + b1.toFixed(1) + '" height="14" rx="3" class="sd-b0"/>' + (it.hide ? '<rect x="' + x0 + '" y="' + (y + 21) + '" width="' + bw + '" height="14" rx="3" class="sd-bq"/>' : '<rect x="' + x0 + '" y="' + (y + 21) + '" width="' + Math.max(1.5, b2).toFixed(1) + '" height="14" rx="3" class="sd-b1' + (it.y ? ' y' : '') + '"/>');
      out += '<text x="' + (it.hide ? x0 + bw / 2 : x0 + Math.max(b1, b2) + 8).toFixed(1) + '" y="' + (y + 33) + '"' + (it.hide ? ' text-anchor="middle"' : '') + ' class="sd-k' + (it.y ? ' sd-y' : '') + '">' + (it.hide ? '× ?' : '× ' + esc(nice(it.k))) + '</text>';
    });
    var lab = 'Bars before (light) and after (dark): ' + items.map(function(it){ return it.sym.replace(/_/g, '') + (it.hide ? ' × ? (to find)' : ' × ' + nice(it.k)); }).join(', ') + '.';
    return S.svg(W, H, lab, out).replace('class="phys-scene"', 'class="phys-scene sd-svg sd-bars"');
  }

  /* -------------------------------------------------------------- mount */
  T.mount('scaling-drills', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'scaling-drills', labels: ['Explore', 'Test yourself'],
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(ex){ if(m === 'explore') ex.go(); else ex.stop(); } },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function explore(host, data){
    var keys = [];
    (data.contexts || []).forEach(function(c){ (c.relations || []).forEach(function(k){ if(keys.indexOf(k) < 0 && SD.REL[k]) keys.push(k); }); });
    if(!keys.length) keys = ['square'];
    // Open on the pendulum when it is live: it is the classic.
    var st = { rel: keys.indexOf('pendulum') > -1 ? 'pendulum' : keys.indexOf('ke') > -1 ? 'ke' : keys[0], k: {} }, LS = null, loop = null, t = 0, sliders = [];
    host.innerHTML = '<section class="bt-problem sd-card"><div class="sd-dock"><div class="sd-relsel"></div><div class="sd-sl"></div><div class="bt-buttons"><button type="button" class="bt-btn sd-reset">Reset to × 1</button></div></div>' +
      '<div class="sd-view show-pic"><div class="sd-vtoggle tseg" role="group" aria-label="Show"><button type="button" data-v="pic" aria-pressed="true" class="on">Picture</button><button type="button" data-v="bar" aria-pressed="false">Bars</button></div><div class="sd-pic"></div><div class="sd-bar"></div><p class="sd-eq"></p></div><div class="sd-say"></div><p class="sr-only sd-live"></p>' +
      T.moreHtml('<div class="sd-table"></div>', 'the formula and the numbers') + '</section>';
    var $ = function(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); };
    var dock = host.querySelector('.sd-dock'), view = host.querySelector('.sd-view'), say = T.announcer(host.querySelector('.sd-live'));
    var cue = T.cue('Drag a slider to scale one quantity and watch the other one change.');
    dock.insertBefore(cue.el, dock.firstChild);
    var relSel = T.choiceSelect({ label: 'Relation', options: keys.map(function(k){ var r = SD.REL[k]; return { value: k, label: r.Y.name.charAt(0).toUpperCase() + r.Y.name.slice(1) + ': ' + r.formula.replace(/_/g, '') }; }), value: st.rel, onChange: function(v){ setRel(v); } });
    host.querySelector('.sd-relsel').appendChild(relSel.el);
    view.querySelectorAll('.sd-vtoggle button').forEach(function(b){ b.addEventListener('click', function(){ var v = b.getAttribute('data-v'); view.classList.toggle('show-pic', v === 'pic'); view.classList.toggle('show-bar', v === 'bar'); view.querySelectorAll('.sd-vtoggle button').forEach(function(x){ var on = x === b; x.setAttribute('aria-pressed', String(on)); x.classList.toggle('on', on); }); }); });
    host.querySelector('.sd-reset').addEventListener('click', function(){ sliders.forEach(function(x){ x.sl.set(1); st.k[x.v.sym] = 1; }); draw(); });
    function range(p){ var a = Math.abs(p) || 1; return { min: Math.max(0.25, Math.pow(16, -1 / a)), max: Math.min(4, Math.pow(16, 1 / a)) }; }
    function setRel(key){
      st.rel = key; st.k = {};
      var rel = SD.REL[key], h = $('.sd-sl'); h.innerHTML = ''; sliders = [];
      rel.vars.forEach(function(v){
        var rg = range(v.p); st.k[v.sym] = 1;
        var sl = T.slider({ label: cap(v.name) + ', ' + v.sym + ': times', min: M.round(rg.min, 2), max: M.round(rg.max, 2), step: 0.05, value: 1, decimals: 2, onInput: function(x){ cue.done(); st.k[v.sym] = snap(x); draw(); } });
        h.appendChild(sl.el); sliders.push({ v: v, sl: sl });
      });
      draw();
      animate();
    }
    // A factor close to a simple fraction snaps to it (⅓, ½, 2, 3...).
    function snap(x){ var c = [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.5, 2, 2.5, 3, 4].filter(function(q){ return Math.abs(q - x) < 0.026; })[0]; return c != null ? c : x; }
    function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
    function fac(){ var rel = SD.REL[st.rel]; return rel.vars.reduce(function(a, v){ return a * Math.pow(st.k[v.sym], v.p); }, 1); }
    function animate(){
      if(loop) loop.stop();
      var p = SD.REL[st.rel].pic;
      if(['pendulum', 'spring', 'orbit', 'drop', 'pipe'].indexOf(p) < 0 || S.reduced()){ loop = null; t = 0; drawPic(); return; }
      loop = S.loop(function(dt){ t += dt; drawPic(); }, {});
      loop.start();
    }
    function drawPic(){ var rel = SD.REL[st.rel], el = $('.sd-pic'), svg = pic(rel, st.k, t, fac()); el.innerHTML = svg; el.hidden = !svg; view.classList.toggle('no-pic', !svg); }
    var lastHead = '';
    function draw(){
      var rel = SD.REL[st.rel], f = fac();
      drawPic();
      $('.sd-bar').innerHTML = bars(rel, st.k, f);
      var changed = rel.vars.filter(function(v){ return Math.abs(st.k[v.sym] - 1) > 1e-9; });
      var parts = changed.map(function(v){ return '(' + nice(st.k[v.sym]) + ')' + pw(v.p); });
      var eq = sub(rel.Y.sym) + ' × ' + (changed.length ? parts.join(' × ') + ' = <b>× ' + nice(f) + '</b>' : '<b>1</b>');
      $('.sd-eq').innerHTML = eq;
      var hd;
      if(!changed.length) hd = 'Drag a slider: how does ' + sub(rel.Y.sym) + ' change?';
      else if(changed.length === 1 && changed[0].p === 0) hd = sub(rel.Y.sym) + ' does not change: it does not depend on ' + sub(changed[0].sym) + '.';
      else hd = changed.map(function(v){ return sub(v.sym) + ' × ' + nice(st.k[v.sym]); }).join(', ') + ' → ' + sub(rel.Y.sym) + ' × ' + nice(f) + '.';
      var body = '<p><b>' + rel.formula.replace(/_([A-Za-z]+)/g, '<sub>$1</sub>') + '</b>, for ' + rel.say + '.</p><ul class="sd-list">' + rel.vars.map(function(v){
        return '<li>' + (v.p === 0 ? sub(rel.Y.sym) + ' does not depend on ' + sub(v.sym) + ' (the ' + v.name + '): changing it changes nothing.' : sub(rel.Y.sym) + ' ∝ ' + SD.powText(v.sym, v.p) + ': scaling the ' + v.name + ' by k scales ' + sub(rel.Y.sym) + ' by k' + pw(v.p) + (v.p === 0.5 ? ' = √k (4 times as much gives twice as much).' : v.p === -2 ? ' = 1/k² (twice as far gives a quarter).' : v.p === 2 ? ' (three times as much gives nine times).' : v.p === -1 ? ' = 1/k.' : '.')) + '</li>';
      }).join('') + '</ul>' + (changed.length > 1 ? '<p>Two changes at once: the factors multiply.</p>' : '');
      T.explain(host.querySelector('.sd-say') || $('.sd-say'), hd, body);
      $('.sd-table').innerHTML = T.dataTable(['Quantity', 'Power in the formula', 'Scaled by', 'Effect on ' + sub(rel.Y.sym)], rel.vars.map(function(v){ return [sub(v.sym) + ' (' + v.name + ')', v.p === 0.5 ? '½' : v.p === -0.5 ? '−½' : String(v.p).replace('-', '−'), '× ' + nice(st.k[v.sym]), '× ' + nice(Math.pow(st.k[v.sym], v.p))]; }).concat([['<b>' + sub(rel.Y.sym) + '</b>', '', '', '<b>× ' + nice(f) + '</b>']]), rel.formula.replace(/_([A-Za-z]+)/g, '<sub>$1</sub>'));
      if(LS){ LS.pills([{ k: rel.Y.sym.replace(/_([A-Za-z]+)/, '<sub>$1</sub>'), html: '× ' + nice(f), tone: f > 1 + 1e-9 ? 'accent' : f < 1 - 1e-9 ? 'warn' : 'ghost' }], 'left', 'explore'); LS.caption(hd, 'explore'); }
      if(hd !== lastHead){ lastHead = hd; say(hd.replace(/<[^>]+>/g, '')); }
    }
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [view], dock: [dock], why: [host.querySelector('.sd-say')], details: [] });
      s.detailsTitle('Formula & numbers');
      draw();
      if(s.mode() === 'explore'){ var r = s.root.querySelector('.sd-sl input[type=range]'); if(r) s.hint({ target: r, text: 'Drag to scale it', round: 999 }); }
    }
    setRel(st.rel);
    return { studio: studio, stop: function(){ if(loop) loop.stop(); loop = null; }, go: function(){ animate(); } };
  }

  /* --------------------------------------------------------------- quiz */
  var KINDS = [{ value: 'factor', label: 'One quantity scaled' }, { value: 'combo', label: 'Two changes at once' }, { value: 'units', label: 'Unit check' }, { value: 'convert', label: 'SI conversions' }];
  function quiz(host, data){
    T.drill(host, data, {
      slug: 'scaling-drills', noun: 'drill',
      generate: function(r, ctx, t){ return SD.generate(r, ctx, t); },
      types: KINDS, typeLabel: 'Kind of problem',
      title: function(p){ var k = KINDS.filter(function(x){ return x.value === p.type; })[0]; return k ? k.label : 'Scaling'; },
      extra: function(el, p){
        var v = p.values;
        if(p.type !== 'factor' && p.type !== 'combo'){ el.innerHTML = ''; return; }
        var rel = SD.REL[v.rel], k = {};
        rel.vars.forEach(function(x){ k[x.sym] = 1; });
        if(p.type === 'factor') k[v.v] = v.k; else { k[v.a] = v.ka; k[v.b] = v.kb; }
        // The picture and the bars show the change; the result's bar is a "?" until the end.
        var svg = pic(rel, k, 0, rel.vars.reduce(function(a, x){ return a * Math.pow(k[x.sym], x.p); }, 1));
        if(svg && rel.pic !== 'square' && rel.pic !== 'circle' && rel.pic !== 'cube') svg = '';
        el.innerHTML = '<figure class="sd-fig cd-fig">' + (svg ? svg.replace(/aria-label="[^"]*"/, 'aria-label="Before and after for ' + esc(rel.say) + '. The result is for you to find."') : '') + bars(rel, k, null) + '</figure>';
      }
    });
  }
})();
