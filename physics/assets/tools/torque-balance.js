/* Torque balance, tools v2 (docs/tools-v2-phys-torque-balance-brief.md; the standard: docs/tools-v2-standard.md).
   The first AP® Physics 1 tool on the shared kit (assets/course/tool-kit2.js), through the course adapter
   ApPhysTools.studioKit2 (phys-tools.js). OWNED BY THIS TOOL ONLY. Model: ApPhysMath.torqueBalance
   (tools/math/torque-balance.js), unchanged.

   EXPLORE, three tabs, one idea each (rule 11):
   1 Balance. A wooden meter stick on a knife edge on a lab bench, brass masses on hooks, a tray of masses at the
     bench's end. Drag a mass along the stick: two supports come up and hold it level while you move it, and the
     curl arrows around the fulcrum (one per sense, a piece per mass) resize at once. Let go: the supports drop and
     the stick turns to the side with the bigger torque until it rests on a support, or stays level when the
     torques balance. Quiet controls: the fulcrum (drag its base), the tray (tap to hang 100, 200 or 500 g),
     "Hold level". Cause line: "100 g at 30 cm → ↺ 0.39 vs ↻ 0.29 N·m → left end down".
   2 Angle. The same stick, a 200 g mass, and a spring scale hooked near the left end, pulled by a hand. Drag the
     scale: its direction and its size. The pull is one whole arrow from its point of application; its line of
     action and the lever arm (the perpendicular from the fulcrum to that line) are thin solid lines; the lever arm
     shortens as the pull slants.
   3 Inertia. Two rotational inertia stands with the same mass (a cross arm with two brass sliders on a vertical
     axle; a string from the step pulley over a pulley at the table's edge to a 200 g weight). Drag the sliders on
     B (A's are quiet): let go and both weights drop; the stand with its mass farther out spins up more slowly.
   Every change is animated (the supports, the turn, a mass flying from the tray and back, the weights winding up
   and falling); the words follow what is drawn. Reduced motion: the end state with a short cross fade.

   TEST YOURSELF is unchanged: ApPhysTools.drill over the model's five problem kinds, each with its own drawing,
   recorded as torque-balance:<context>:<step>; ?seed= and #quiz open it. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath, S = window.ApPhysScene;
  if(!T || !M || !M.torqueBalance || !S) return;
  var TB = M.torqueBalance, esc = T.esc, F = T.F, G = M.C.g;
  var uid = 0;
  function nid(p){ return (p || 'tb') + (++uid); }
  function n1(x){ return Math.round(x * 10) / 10; }
  function nm(x){ return F(x, Math.abs(x) < 0.995 ? 3 : 2); }
  function gv(x){ return M.fmt(x, Number(Number(x).toPrecision(2)) === x ? 2 : 3); }   // a given value, as the problem writes it

  /* This tool's own stylesheet (the generator loads only phys-tools.css). */
  (function(){ var me = document.currentScript, href = me && me.src ? me.src.replace(/\.js(\?.*)?$/, '.css') : '';
    if(href && !document.querySelector('link[href$="tools/torque-balance.css"]')){ var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); } })();
  var appEl = document.getElementById('app');
  if(appEl) appEl.setAttribute('data-details-title', 'How it works');
  function boot(){
    T.mount('torque-balance', function(app, data){
      document.body.classList.add('tb-root');
      var ex = null, kit = !!(window.LevlKit2 && window.LevlStudio && app.getAttribute('data-studio'));
      T.modes(app, { slug: 'torque-balance', explore: function(pane){ ex = explore(pane, data); },
        quiz: function(pane){ quiz(pane, data); },
        onShow: function(m){ if(ex) ex.shown(m); },
        studio: kit ? { kit2: function(pane, s){ return ex.kit2(pane, s); } } : {} });
      // Without the frame (no Tool Studio, or no kit) the stage still works on its own, above Test yourself.
      if(!kit || !T.studioOf(app)) ex.plain();
    });
  }

  /* ------------------------------------------------------------ art */
  function defs(id){
    return '<defs>' +
      '<linearGradient id="' + id + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="tb-w1"/><stop offset="1" class="tb-w2"/></linearGradient>' +
      '<linearGradient id="' + id + 'm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="tb-m2"/><stop offset=".45" class="tb-m1"/><stop offset="1" class="tb-m2"/></linearGradient>' +
      '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="tb-b2"/><stop offset=".4" class="tb-b1"/><stop offset="1" class="tb-b2"/></linearGradient>' +
      '<radialGradient id="' + id + 'r" cx=".35" cy=".35" r=".7"><stop offset="0" class="tb-m1"/><stop offset="1" class="tb-m2"/></radialGradient>' +
      '</defs>';
  }
  var Z = 1;   // hardware zoom: bigger masses and labels on a narrow stage
  function massSize(m){ var z = m >= 0.45 ? { w: 42, h: 44 } : m >= 0.18 ? { w: 36, h: 30 } : { w: 30, h: 22 }; return { w: z.w * Z, h: z.h * Z }; }
  function gLabel(m){ return m < 1 ? Math.round(m * 1000) + ' g' : F(m, 1) + ' kg'; }
  /* A slotted brass weight hanging from a hook clamp at (x, y): string, hook, body. */
  function massArt(id, x, y, m, label){
    // The body is at least as wide as its label (about 7.4 px a character at 12 px, bold).
    var z = massSize(m), lab = label || gLabel(m), top = y + 18;
    z = { w: Math.max(z.w, Math.ceil(lab.length * 7.4 * Z + 10)), h: z.h };
    var l = x - z.w / 2;
    return '<line class="tb-string" x1="' + n1(x) + '" y1="' + n1(y) + '" x2="' + n1(x) + '" y2="' + n1(top - 4) + '"/>' +
      '<path class="tb-metal" fill="none" stroke-width="2" d="M' + n1(x) + ' ' + n1(top - 6) + 'q0 4 0 6"/>' +
      '<rect class="tb-body" x="' + n1(l) + '" y="' + n1(top) + '" width="' + z.w + '" height="' + z.h + '" rx="5" fill="url(#' + id + 'b)" stroke="#6B4E12" stroke-width="1.2"/>' +
      '<rect x="' + n1(l + 3) + '" y="' + n1(top + 3) + '" width="' + (z.w - 6) + '" height="3" rx="1.5" fill="#fff" opacity=".35"/>' +
      '<text class="tb-label" x="' + n1(x) + '" y="' + n1(top + z.h / 2 + 4.5 * Z) + '" text-anchor="middle"' + (Z !== 1 ? ' style="font-size:' + n1(12 * Z) + 'px"' : '') + '>' + esc(lab) + '</text>';
  }
  /* The meter stick, level, from x0 (px) with ppm, centred on y; ticks every
     cm, numbers every 10 cm. */
  function stickArt(id, x0, y, ppm, len, thick){
    len = len || 1; thick = thick || 15;
    var out = '<rect class="tb-wood" x="' + x0 + '" y="' + n1(y - thick / 2) + '" width="' + n1(len * ppm) + '" height="' + thick + '" rx="2" fill="url(#' + id + 'w)"/>';
    for(var c = 0; c <= len * 100; c++){
      var X = x0 + c / 100 * ppm, big = c % 10 === 0, mid = c % 5 === 0;
      if(c === 0 || c === len * 100) continue;
      out += '<line class="tb-tick' + (big ? ' big' : '') + '" x1="' + n1(X) + '" y1="' + n1(y - thick / 2) + '" x2="' + n1(X) + '" y2="' + n1(y - thick / 2 + (big ? 7 : mid ? 5 : 3)) + '"/>';
      if(big && (Z === 1 || c % 20 === 0) && ppm * 0.1 > 34) out += '<text class="tb-num" x="' + n1(X) + '" y="' + n1(y + thick / 2 - 2) + '" text-anchor="middle"' + (Z !== 1 ? ' style="font-size:' + n1(12 * Z) + 'px"' : '') + '>' + c + '</text>';
    }
    return out;
  }
  /* Knife-edge stand: base plate on the bench, a post, a V cradle at (x, y). */
  function standArt(id, x, y, bench, stops){
    var out = '';
    if(stops) stops.forEach(function(s){ out += '<rect class="tb-metal" x="' + n1(s.x - 4) + '" y="' + n1(s.y) + '" width="8" height="' + n1(bench - s.y) + '" rx="2" fill="url(#' + id + 'm)"/><rect x="' + n1(s.x - 5) + '" y="' + n1(s.y - 3) + '" width="10" height="5" rx="2" fill="#333" opacity=".75"/>'; });
    out += '<path class="tb-metal" fill="url(#' + id + 'm)" d="M' + n1(x - 46) + ' ' + bench + 'L' + n1(x - 8) + ' ' + n1(y + 18) + 'L' + n1(x + 8) + ' ' + n1(y + 18) + 'L' + n1(x + 46) + ' ' + bench + 'Z"/>' +
      '<path class="tb-metal" fill="url(#' + id + 'm)" d="M' + n1(x - 13) + ' ' + n1(y + 18) + 'L' + n1(x - 13) + ' ' + n1(y + 6) + 'L' + n1(x) + ' ' + n1(y + 13) + 'L' + n1(x + 13) + ' ' + n1(y + 6) + 'L' + n1(x + 13) + ' ' + n1(y + 18) + 'Z"/>';
    return out;
  }
  function clampArt(id, x, y, thick){
    return '<rect class="tb-metal" x="' + n1(x - 7) + '" y="' + n1(y - thick / 2 - 4) + '" width="14" height="' + (thick + 8) + '" rx="3" fill="url(#' + id + 'm)"/>' +
      '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="3.2" fill="#2E3438"/>';
  }
  function hookArt(id, x, y, thick){
    return '<rect class="tb-metal" x="' + n1(x - 5) + '" y="' + n1(y - thick / 2 - 3) + '" width="10" height="' + (thick + 6) + '" rx="2" fill="url(#' + id + 'm)"/>';
  }
  function benchArt(W, y){ return '<rect class="tb-bench" x="0" y="' + y + '" width="' + W + '" height="14"/><rect class="tb-bench-e" x="0" y="' + (y + 10) + '" width="' + W + '" height="4"/>'; }


  /* ================================================================ EXPLORE (tools v2) */
  /* Three tabs, one idea each (docs/tools-v2-phys-torque-balance-brief.md):
       bal  "Balance": a meter stick on a knife edge on a lab bench, brass masses on hooks. Drag a mass along the
            stick (its knob, or the mass itself): the two supports come up and hold the stick level while you move
            it; let go and they drop, so the stick turns to the side whose torque is bigger and comes to rest on a
            support, or stays level when the torques balance. Curl arrows around the fulcrum, one per sense,
            made of one piece per mass, are sized by the torques.
       ang  "Angle": the same stick with a 200 g mass, and a spring scale hooked near the left end, pulled by a hand.
            Drag the scale: its direction and how hard. The pull is one whole arrow (no components); its line of
            action and the lever arm (the perpendicular from the fulcrum to that line) are thin solid lines.
       ine  "Inertia": two rotational inertia stands (a cross arm with two brass sliders on a vertical axle; a string
            from the step pulley over a pulley at the table's edge to a 200 g weight). Drag the sliders on B (or A):
            let go and both weights drop; the stand with its mass farther out spins up more slowly.
     Torques are the ones about the fulcrum with the stick level (the moment it starts to turn); tilted, every
     weight's lever arm shrinks by the same cos θ, so which way it turns never changes. Counterclockwise is +. */
  var MB = 0.12, STOP = 10 * Math.PI / 180, RAD = 180 / Math.PI;
  var RA = { I0: 0.0015, ms: 0.25, m: 0.20, r: 0.040, h: 0.80 };
  function ease(t){ return t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function f2(x){ return F(x, 2); }
  /* Two torques side by side: 2 decimals, or 3 when 2 would hide a difference. */
  function pairTxt(a, b){ var d = Math.abs(a - b) > 1e-9 && F(a, 2) === F(b, 2) ? 3 : 2; return [F(a, d), F(b, d)]; }
  var BODY = { 0.1: [44, 40], 0.2: [50, 46], 0.5: [58, 56] };
  function bodySize(m, k){ var z = BODY[m] || BODY[0.2]; return { w: Math.round(z[0] * k), h: Math.round(z[1] * k) }; }
  /* A slotted brass weight, its top centre at (0, 0): a hook loop, the cylinder, a slot, the label. */
  function brass(gid, m, k, lab){
    var z = bodySize(m, k), w = z.w, h = z.h, l = -w / 2;
    return '<path class="tb2-hook" d="M0 -3v6"/>' +
      '<rect class="tb2-brass" x="' + l + '" y="3" width="' + w + '" height="' + (h - 3) + '" rx="' + Math.round(6 * k) + '" fill="url(#' + gid + 'b)"/>' +
      '<rect class="tb2-rim" x="' + (l + 3) + '" y="6" width="' + (w - 6) + '" height="4" rx="2"/>' +
      '<path class="tb2-slot" d="M' + n1(l) + ' ' + n1(3 + h * 0.42) + 'h' + n1(w * 0.28) + '"/>' +
      '<text class="tb2-mlab" x="0" y="' + n1(h - 8 * k) + '" text-anchor="middle">' + esc((lab || gLabel(m))) + '</text>';
  }

  function explore(host, data){
    var K = window.LevlKit2, kit = !!K, LS = null;
    var st = {
      tab: 'bal', mode: 'explore',
      bal: { pivot: 50, useMb: true, masses: [{ id: 1, m: 0.2, x: 30, lev: 0, ly: 0 }, { id: 2, m: 0.1, x: 80, lev: 0, ly: 0 }], active: 2,
        th: 0, om: 0, postT: 0, held: false, lock: false, scale: 0, fly: [] },
      ang: { pivot: 50, useMb: true, masses: [{ id: 1, m: 0.2, x: 30, lev: 0, ly: 0 }], pull: { F: 1.5, x: 10, ang: 60 }, active: 0,
        th: 0, om: 0, postT: 0, held: false, lock: false, scale: 0, fly: [] },
      ine: { dA: 6, dB: 18, t: 0, phase: 'ready', wind: 1, rewind: null }
    };
    var nextId = 3, G0 = M.C.g;
    // Settle each stick where its masses leave it (the landing picture is already at rest).
    ['bal', 'ang'].forEach(function(k){ var s = st[k], n = netOf(s); s.th = Math.abs(n) < 1e-9 ? 0 : n > 0 ? STOP : -STOP; });

    /* ---------------------------------------------------- the stage */
    var stage = document.createElement('div'); stage.className = 'tb2';
    var tabs = kit ? K.tabs({ label: 'Which idea', big: true, value: 'bal', items: [{ value: 'bal', label: 'Balance' }, { value: 'ang', label: 'Angle' }, { value: 'ine', label: 'Inertia' }],
      onChange: function(v){ setTab(v, true); } }) : null;
    if(tabs) stage.appendChild(tabs.el);
    var head = kit ? K.head({ purpose: '', how: { label: 'Show me how', onClick: function(){ startTour(true); } } }) : null;
    if(head) stage.appendChild(head.el);
    var box = document.createElement('div'); box.className = 'tb2-scene'; box.id = T.nid('tb2');
    box.innerHTML = '<svg class="tb2-svg" xmlns="http://www.w3.org/2000/svg" role="img" data-ls-text="keep"></svg>';
    stage.appendChild(box);
    if(tabs) tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', box.id); });
    var svg = box.querySelector('svg'), layer = kit ? K.layer(box) : { el: document.createElement('div'), scale: function(){ return 1; } };
    var lines = document.createElement('div'); lines.className = 'tb2-lines';
    var cause = kit ? K.cause({ label: 'Why' }) : { el: document.createElement('p'), set: function(){}, take: function(){}, text: function(){ return ''; } };
    var again = document.createElement('button'); again.type = 'button'; again.className = 'tk2-btn tb2-again'; again.textContent = 'Start over';
    again.addEventListener('click', function(){ hideCue(true); startOver(); });
    lines.appendChild(cause.el); lines.appendChild(again);
    stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
    stage.appendChild(live);
    var sayT = 0;
    function say(t){ clearTimeout(sayT); sayT = setTimeout(function(){ live.textContent = t; }, 60); }
    var gid = T.nid('tb2g');

    /* ---------------------------------------------------- "?" */
    var ref = document.createElement('div'); ref.className = 'ls-sec tb2-ref';
    ref.innerHTML = '<p><button type="button" class="tk2-btn tb2-how" data-how>Show me how</button></p>' +
      '<h3 class="ls-title-l">' + esc(data.howItWorksTitle || 'How it works') + '</h3><div class="tb2-howit">' + (data.howItWorks || '') + '</div>' +
      '<h3 class="ls-title-l tb2-nums-h">The torques about the fulcrum</h3><div class="tb2-nums"></div>' +
      '<div class="tb2-set"><h3 class="ls-title-l">Setting</h3><label class="tb-check"><input type="checkbox" class="tb2-usemb" checked> <span>Count the stick’s own mass (0.12 kg, acting at its 50 cm mark)</span></label></div>' +
      '<h3 class="ls-title-l">How this picture is drawn</h3><ul class="tb2-list"><li>The torques shown are about the fulcrum with the stick level, the moment it starts to turn. Tilted, every weight’s lever arm shrinks by the same factor (cos θ), so the side that wins never changes.</li>' +
      '<li>Angle: the angle marked at the hook is between the stick and the pull. sin θ is the same for θ and 180° − θ, so either angle gives the torque r F sin θ; the lever arm r sin θ is the perpendicular distance from the fulcrum to the pull\u2019s line.</li>' +
      '<li>A hanging weight pulls straight down on its hook, so its lever arm is its distance from the fulcrum along the level stick. How long its string is does not matter.</li>' +
      '<li>While you move something, the two supports hold the stick level. Let go and they drop: an unbalanced stick turns with α = τ<sub>net</sub> / I until it rests on a support; a balanced one stays level.</li>' +
      '<li>Counterclockwise (↺) and clockwise (↻) are the only directions used, as on the AP® exam. g = 9.8 m/s².</li>' +
      '<li>Inertia: each stand’s rotational inertia is I = I<sub>hub</sub> + 2 m d² (I<sub>hub</sub> = 0.0015 kg·m², two 0.25 kg sliders at d from the axle). The 0.20 kg weight falls 0.80 m with a = m g / (m + I / r²), r = 0.040 m (the pulley’s radius). Friction is neglected.</li></ul>' +
      '<h3 class="ls-title-l">Keys</h3><p class="bt-small">Tab to a knob. Arrow keys move a mass 1 cm (Page Up and Page Down 10 cm), Delete takes it off the stick. On the scale, left and right turn the pull 5°, up and down change it by 0.1 N. On a slider, arrows move it 1 cm; the race starts a moment after the last key.</p>';
    ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(LS) LS.close(); setTimeout(function(){ startTour(true); }, 60); });
    ref.querySelector('.tb2-usemb').addEventListener('change', function(e){ var on = e.target.checked; ['bal', 'ang'].forEach(function(k){ st[k].useMb = on; }); if(st.tab !== 'ine'){ grabStick(); letGo(400); } else paintRef(); });

    /* ---------------------------------------------------- geometry */
    var G = null, W = 640, H = 420, phone = false, built = '';
    function geoStick(W, Hin, tab){
      var ph = W < 600, two = W < 1000, band = two ? 96 : 84, mx = ph ? 16 : Math.max(44, Math.round(W * 0.05));
      var ppm = W - 2 * mx, ang = tab === 'ang';
      // the masses, the stick's thickness and the hooks' strings scale with the stick on a wide stage
      function kOf(p){ return ph ? 1 : clamp(p / 1000, 0.95, 1.25); }
      function need(p){
        var k = kOf(p), thick = ph ? 15 : Math.round(18 * k), str0 = Math.round(34 * k);
        var R = clamp(p * (ang ? 0.075 : 0.1), ph ? 46 : 64, ang ? 90 : 118), drop = 0.5 * p * Math.sin(STOP), bh = bodySize(0.5, k).h + 30;
        // Balance: room for the masses to hang one below the other (three rows only when hooks 8 cm apart can touch)
        var rows = ang ? 1 : 0.08 * p >= bodySize(0.5, k).w + 6 ? 2 : 3;
        // Angle: one mass at 20 cm from the fulcrum; the stick's ends still need to clear the bench
        var below = ang ? Math.max(drop + 24, 0.2 * p * Math.sin(STOP) + thick / 2 + str0 + bh + 10) : drop + thick / 2 + str0 + rows * bh + 10;
        below += 14;   // the fulcrum's quiet knob sits on the stand's base, just over the bench
        // above: the curl arrows and their two numbers; Angle: the spring scale and the hand, at the stick's left end
        var above = ang ? Math.max(R + 40, 0.4 * p * Math.sin(STOP) + pullReach(ph, k) + 10) : Math.max(R + 40, drop + 26) + (ph ? 14 : 22);
        return { k: k, thick: thick, str0: str0, R: R, below: below, above: above, H: above + below + band, rows: rows };
      }
      var n = need(ppm);
      // a short stage gives up some of the stick's length (a desktop keeps the whole tool in view; a tablet, which
      // scrolls like a phone, gives up at most a fifth and then grows taller)
      var p0 = ppm;
      if(!ph){ while(n.H > Hin && ppm > p0 * (two ? 0.8 : 0.55)){ ppm *= 0.97; n = need(ppm); } }
      var Hh = ph ? Math.round(n.H) : Math.max(Hin, Math.ceil(n.H)), benchY = Hh - band;
      var py = benchY - n.below, x0 = Math.round((W - ppm) / 2);
      return { W: W, H: Hh, ph: ph, k: n.k, thick: n.thick, ppm: ppm, x0: x0, py: Math.round(py), benchY: benchY, band: band, two: two, R: Math.round(n.R), str0: n.str0, rows: n.rows };
    }
    function geoIne(W, Hin){
      var ph = W < 600, band = ph ? 36 : 48, k = ph ? 0.9 : clamp(W / 1100, 0.95, 1.15);
      var H = ph ? Math.round(clamp(W * 1.3, 450, 540)) : Hin, floorY = H - band;
      var tl = ph ? 58 : Math.round(W * 0.2), tr = W - tl, cxA = Math.round(tl + (tr - tl) * 0.26), cxB = Math.round(tl + (tr - tl) * 0.74);
      var arm = Math.round(Math.min((tr - tl) * 0.2, ph ? 62 : 175)), pxpm = arm / 0.22;
      var axleY = Math.round(ph ? 134 : clamp(H * 0.22, 132, 160)), armH = Math.round(ph ? 84 : clamp(H * 0.2, 100, 150));
      var tableY = axleY + armH, sY = axleY + Math.round((ph ? 22 : 30) * k);
      return { W: W, H: H, ph: ph, k: k, floorY: floorY, tableY: tableY, tl: tl, tr: tr, cx: [cxA, cxB], arm: arm, pxpm: pxpm, axleY: axleY, tilt: 0.3,
        pulY: sY, hubR: Math.max(10, Math.round(0.04 * pxpm)), band: band };
    }

    /* ---------------------------------------------------- the stick model */
    function stickModel(s, only){
      return { L: 1, mb: s.useMb ? MB : 0, pivot: s.pivot / 100, h: 0.26, stop: 10,
        masses: s.masses.map(function(q){ return { m: q.m, x: q.x / 100 }; }), force: s.pull && s.pull.F > 0 ? { F: s.pull.F, x: s.pull.x / 100, ang: s.pull.ang } : null };
    }
    function torquesOf(s){ return TB.torques(stickModel(s), G0); }
    function netOf(s){ var t = torquesOf(s); return Math.abs(t.net) < 1e-9 ? 0 : t.net; }
    function stickBusy(s){ return s.postT !== (s.held ? 1 : 0) || Math.abs(s.om) > 1e-7 || s.fly.length > 0 || Math.abs((s.scaleT || s.scale) - s.scale) > 0.05 || s.masses.some(function(q){ return Math.abs(q.ly - q.lev) > 0.01; }) || !resting(s); }
    function limitOf(s){ return STOP * (1 - ease(s.postT)); }
    function resting(s){
      var L = limitOf(s), n = netOf(s);
      if(Math.abs(s.om) > 1e-7) return false;
      if(n === 0) return true;
      return n > 0 ? s.th >= L - 1e-9 : s.th <= -L + 1e-9;
    }
    function stepStick(s, dt){
      var want = s.held ? 1 : 0;
      if(s.postT !== want) s.postT = want ? Math.min(1, s.postT + dt / 0.3) : Math.max(0, s.postT - dt / 0.3);
      var L = limitOf(s);
      if(s.th > L){ s.th = L; if(s.om > 0) s.om = 0; } else if(s.th < -L){ s.th = -L; if(s.om < 0) s.om = 0; }
      var m = stickModel(s), n = netOf(s);
      // held: the supports carry it (it only moves as they push it level); free: it turns with α = τ / I
      if(s.held){ s.om = 0; }
      else if(n === 0 && Math.abs(s.om) < 1e-9){ s.om = 0; }
      else {
        var steps = Math.max(1, Math.ceil(dt / 0.002)), h = dt / steps;
        for(var i = 0; i < steps; i++){
          var r = TB.tip(m, s.th, s.om, h, G0); s.th = r.th; s.om = r.om;
          if(s.th >= L){ s.th = L; s.om = Math.min(0, s.om); }
          if(s.th <= -L){ s.th = -L; s.om = Math.max(0, s.om); }
        }
        if(Math.abs(s.om) < 1e-7 && resting(s)) s.om = 0;
      }
      // arcs scale and the masses' hanging levels ease toward their targets
      var tgt = arcScale(s);
      if(!s.scaleT) s.scaleT = tgt;
      if(s.scale === 0) s.scale = tgt;
      s.scaleT = tgt;
      s.scale += (s.scaleT - s.scale) * Math.min(1, dt * 7);
      s.masses.forEach(function(q){ q.ly += (q.lev - q.ly) * Math.min(1, dt * 10); if(Math.abs(q.ly - q.lev) < 0.01) q.ly = q.lev; });
    }
    /* Degrees of curl per N·m: the bigger side fills 68°. While a drag is on, it only shrinks (never jumps up). */
    function arcScale(s){
      var t = torquesOf(s), big = Math.max(t.ccw, t.cw, 0.25), want = 68 / big;
      if(dragging && s.scale) return Math.min(s.scale, want);
      return want;
    }
    function resultOf(s){
      var n = netOf(s);
      if(s.held) return s.postT > 0.98 || Math.abs(s.th) < 1e-4 ? 'held' : 'lift';
      if(Math.abs(s.om) > 1e-4) return s.om > 0 ? 'turn-ccw' : 'turn-cw';
      if(s.th > 1e-4) return 'down-left';
      if(s.th < -1e-4) return 'down-right';
      if(n === 0) return 'level';
      return 'held';
    }

    /* ---------------------------------------------------- drawing: shared */
    function defs(){
      return '<defs><linearGradient id="' + gid + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="tb-w1"/><stop offset="1" class="tb-w2"/></linearGradient>' +
        '<linearGradient id="' + gid + 'm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="tb-m2"/><stop offset=".45" class="tb-m1"/><stop offset="1" class="tb-m2"/></linearGradient>' +
        '<linearGradient id="' + gid + 'b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="tb-b2"/><stop offset=".38" class="tb-b1"/><stop offset="1" class="tb-b2"/></linearGradient>' +
        '<radialGradient id="' + gid + 'r" cx=".35" cy=".35" r=".7"><stop offset="0" class="tb-m1"/><stop offset="1" class="tb-m2"/></radialGradient>' +
        '<linearGradient id="' + gid + 'top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="tb2-t1"/><stop offset="1" class="tb2-t2"/></linearGradient>' +
        '<linearGradient id="' + gid + 'wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="tb2-wall1"/><stop offset="1" class="tb2-wall2"/></linearGradient></defs>';
    }
    function wallArt(W, H, y){
      var out = '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#' + gid + 'wall)"/>';
      for(var yy = 40; yy < y - 10; yy += 58) out += '<line class="tb2-tile" x1="0" x2="' + W + '" y1="' + yy + '" y2="' + yy + '"/>';
      return out;
    }
    function benchArt(W, H, y){
      return '<rect class="tb2-bench-f" x="0" y="' + (y + 12) + '" width="' + W + '" height="' + (H - y - 12) + '"/>' +
        '<rect x="0" y="' + y + '" width="' + W + '" height="14" fill="url(#' + gid + 'top)"/><rect class="tb2-bench-l" x="0" y="' + (y + 12) + '" width="' + W + '" height="2"/>';
    }

    /* ---------------------------------------------------- drawing: the stick tabs */
    var D = {};   // live nodes
    function buildStick(){
      var g = G, s = st[st.tab], P = px(s.pivot), id = gid;
      var ticks = '', nums = '';
      for(var c = 1; c < 100; c++){
        var X = g.x0 + c / 100 * g.ppm, big = c % 10 === 0, mid = c % 5 === 0;
        if(!big && !mid && g.ppm < 500) continue;
        ticks += 'M' + n1(X) + ' ' + n1(-g.thick / 2) + 'v' + (big ? 6 : mid ? 4 : 2.5);
        if(big) nums += '<text class="tb2-num" x="' + n1(X) + '" y="' + n1(g.thick / 2 - 3) + '" text-anchor="middle">' + c + '</text>';
      }
      svg.innerHTML = defs() + wallArt(g.W, g.H, g.benchY) + benchArt(g.W, g.H, g.benchY) +
        '<g class="tb2-standg"></g>' +
        '<g class="tb2-posts"><rect class="tb2-post" data-s="-1"/><rect class="tb2-post" data-s="1"/><rect class="tb2-pad" data-s="-1"/><rect class="tb2-pad" data-s="1"/></g>' +
        '<g class="tb2-arcs" aria-hidden="true"></g>' +
        '<g class="tb2-loa" aria-hidden="true"></g>' +
        '<g class="tb2-strings"></g>' +
        '<g class="tb2-stick"><g class="tb2-stickin"><rect class="tb2-wood" x="' + g.x0 + '" y="' + n1(-g.thick / 2) + '" width="' + n1(g.ppm) + '" height="' + g.thick + '" rx="2" fill="url(#' + id + 'w)"/>' +
          '<path class="tb2-ticks" d="' + ticks + '"/>' + nums + '<g class="tb2-clamps"></g><g class="tb2-com"></g><g class="tb2-dim"></g></g></g>' +
        '<g class="tb2-dimtg" aria-hidden="true"></g><g class="tb2-masses"></g><g class="tb2-flyg"></g><g class="tb2-pullg"></g>' +
        '<g class="tb2-tray"></g>' +
        '<g class="tb2-labs" aria-hidden="true"><text class="tb2-tq is-ccw" text-anchor="end"></text><text class="tb2-tq is-cw" text-anchor="start"></text></g>';
      D = { stick: svg.querySelector('.tb2-stick'), stickin: svg.querySelector('.tb2-stickin'), clamps: svg.querySelector('.tb2-clamps'), com: svg.querySelector('.tb2-com'), dim: svg.querySelector('.tb2-dim'), dimt: svg.querySelector('.tb2-dimtg'),
        masses: svg.querySelector('.tb2-masses'), strings: svg.querySelector('.tb2-strings'), fly: svg.querySelector('.tb2-flyg'), arcs: svg.querySelector('.tb2-arcs'), loa: svg.querySelector('.tb2-loa'),
        pull: svg.querySelector('.tb2-pullg'), tray: svg.querySelector('.tb2-tray'), stand: svg.querySelector('.tb2-standg'), posts: svg.querySelectorAll('.tb2-post'), pads: svg.querySelectorAll('.tb2-pad'),
        tqL: svg.querySelector('.tb2-tq.is-ccw'), tqR: svg.querySelector('.tb2-tq.is-cw'), mg: {} };
      svg.setAttribute('aria-label', 'A meter stick on a fulcrum on a lab bench');
      drawTray();
      buildControls();
    }
    function px(cm){ return G.x0 + cm / 100 * G.ppm; }
    function hookAt(s, cm){ var r = (cm - s.pivot) / 100 * G.ppm; return [px(s.pivot) + r * Math.cos(s.th), G.py - r * Math.sin(s.th)]; }
    function postX(s, side){ var r = side * Math.min(30, side < 0 ? s.pivot - 4 : 96 - s.pivot); return { r: r, x: px(s.pivot + r) }; }
    function postTop(s, side){ var p = postX(s, side), drop = Math.abs(p.r) / 100 * G.ppm * Math.sin(STOP) * (1 - ease(s.postT)); return G.py + G.thick / 2 + drop; }
    function standHtml(P){
      var g = G, y = g.py, b = g.benchY, w = Math.round(50 * (g.ph ? 0.8 : g.k)), rw = g.ph ? 9 : 11;
      return '<ellipse class="tb2-shadow" cx="' + n1(P) + '" cy="' + (b + 1) + '" rx="' + (w + 34) + '" ry="5"/>' +
        '<path class="tb2-base" fill="url(#' + gid + 'm)" d="M' + n1(P - w - 28) + ' ' + b + 'L' + n1(P - w - 20) + ' ' + (b - 13) + 'H' + n1(P + w + 20) + 'L' + n1(P + w + 28) + ' ' + b + 'Z"/>' +
        '<rect class="tb2-metal" x="' + n1(P - rw / 2) + '" y="' + n1(y + 20) + '" width="' + rw + '" height="' + n1(b - 13 - y - 20) + '" fill="url(#' + gid + 'm)"/>' +
        '<rect class="tb2-metal" x="' + n1(P - rw / 2 - 4) + '" y="' + n1(b - 40) + '" width="' + (rw + 8) + '" height="12" rx="3" fill="url(#' + gid + 'm)"/>' +
        '<path class="tb2-metal" fill="url(#' + gid + 'm)" d="M' + n1(P - 12) + ' ' + n1(y + 21) + 'L' + n1(P - 12) + ' ' + n1(y + 8) + 'L' + n1(P) + ' ' + n1(y + 2) + 'L' + n1(P + 12) + ' ' + n1(y + 8) + 'L' + n1(P + 12) + ' ' + n1(y + 21) + 'Z"/>' +
        '<text class="tb2-name" x="' + n1(P) + '" y="' + (b + (g.two ? 32 : 46)) + '" text-anchor="middle">fulcrum</text>';
    }
    function drawStand(s){
      var P = px(s.pivot);
      D.stand.innerHTML = standHtml(P);
      [-1, 1].forEach(function(side, i){
        var p = postX(s, side), x = p.x, top = postTop(s, side), w = G.ph ? 8 : 10;
        D.posts[i].setAttribute('x', n1(x - w / 2)); D.posts[i].setAttribute('width', w); D.posts[i].setAttribute('y', n1(top + 3)); D.posts[i].setAttribute('height', n1(Math.max(0, G.benchY - 10 - top - 3)));
        D.posts[i].setAttribute('fill', 'url(#' + gid + 'm)');
        D.pads[i].setAttribute('x', n1(x - w / 2 - 3)); D.pads[i].setAttribute('width', w + 6); D.pads[i].setAttribute('y', n1(top)); D.pads[i].setAttribute('height', 5); D.pads[i].setAttribute('rx', 2);
      });
    }
    /* The masses' hanging levels: neighbours whose bodies would touch hang one below the other. */
    function levels(s){
      var list = s.masses.slice().sort(function(a, b){ return a.x - b.x; }), rows = [];
      list.forEach(function(q){
        var w = bodySize(q.m, G.k).w, x = q.x / 100 * G.ppm, L = 0;
        while(rows[L] && rows[L].some(function(o){ return Math.abs(o.x - x) < (o.w + w) / 2 + 6; })) L++;
        (rows[L] = rows[L] || []).push({ x: x, w: w }); q.lev = Math.min(L, G.rows - 1);
      });
    }
    function rowY(lev){ var big = bodySize(0.5, G.k).h + 30; return lev * big; }
    function massNode(s, q){
      var g = D.mg[q.id];
      if(g) return g;
      g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'tb2-mass'); g.setAttribute('data-id', q.id);
      g.innerHTML = brass(gid, q.m, G.k);
      D.masses.appendChild(g);
      var str = document.createElementNS('http://www.w3.org/2000/svg', 'line'); str.setAttribute('class', 'tb2-string'); D.strings.appendChild(str);
      var cl = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); cl.setAttribute('class', 'tb2-clamp'); D.clamps.appendChild(cl);
      g.__str = str; g.__cl = cl;
      if(st.tab === 'bal') g.addEventListener('pointerdown', function(e){ var h = HD[q.id]; if(h) h.grab(e); });
      D.mg[q.id] = g;
      return g;
    }
    function paintStick(){
      var s = st[st.tab], deg = -s.th * RAD, P = px(s.pivot);
      D.stick.setAttribute('transform', 'translate(0 ' + G.py + ') rotate(' + n1(deg * 100) / 100 + ' ' + n1(P) + ' 0)');
      D.stick.setAttribute('data-th', (s.th * RAD).toFixed(4));
      drawStand(s);
      // clamps on the stick (stick frame) and the knife edge
      var have = {};
      s.masses.forEach(function(q){
        have[q.id] = 1;
        var g = massNode(s, q), h = hookAt(s, q.x), dy = G.str0 + rowY(q.ly), bx = h[0], by = h[1] + G.thick / 2;
        g.setAttribute('transform', 'translate(' + n1(bx) + ' ' + n1(by + dy) + ')');
        g.setAttribute('data-x', q.x);
        g.__str.setAttribute('x1', n1(bx)); g.__str.setAttribute('x2', n1(bx)); g.__str.setAttribute('y1', n1(by)); g.__str.setAttribute('y2', n1(by + dy));
        var cx = px(q.x);
        g.__cl.setAttribute('x', n1(cx - 5)); g.__cl.setAttribute('y', n1(-G.thick / 2 - 3)); g.__cl.setAttribute('width', 10); g.__cl.setAttribute('height', G.thick + 6); g.__cl.setAttribute('rx', 2);
        g.__cl.setAttribute('fill', 'url(#' + gid + 'm)');
        g.classList.toggle('is-off', !!(drag && drag.id === q.id && drag.off));
      });
      Object.keys(D.mg).forEach(function(k){ if(!have[k]){ var g = D.mg[k]; g.__str.remove(); g.__cl.remove(); g.remove(); delete D.mg[k]; } });
      // the knife edge (a clamp at the pivot) and the stick's centre of mass when it counts
      var com = '<rect class="tb2-clamp" x="' + n1(P - 8) + '" y="' + n1(-G.thick / 2 - 4) + '" width="16" height="' + (G.thick + 8) + '" rx="3" fill="url(#' + gid + 'm)"/><circle cx="' + n1(P) + '" cy="0" r="3" class="tb2-pin"/>';
      if(s.useMb && s.pivot !== 50){
        var C = px(50), up = -G.thick / 2 - 12;
        com += '<circle class="tb2-cm" cx="' + n1(C) + '" cy="0" r="' + (G.ph ? 4.5 : 5.5) + '"/><path class="tb2-cmx" d="M' + n1(C - 5) + ' 0h10M' + n1(C) + ' -5v10"/>';
      }
      if(D.comHtml !== com){ D.com.innerHTML = com; D.comHtml = com; }
      paintDim(s);
      paintArcs(s);
      if(st.tab === 'ang') paintPull(s);
      placeControls();
    }
    /* The distance from the fulcrum of the mass last moved: a thin dimension line on the stick. */
    function paintDim(s){
      var q = s.masses.filter(function(m){ return m.id === s.active; })[0], html = '', txt = '';
      if(q && q.x !== s.pivot && st.tab === 'bal'){
        var a = px(s.pivot), b = px(q.x), y = -G.thick / 2 - (G.ph ? 9 : 11), d = Math.abs(q.x - s.pivot);
        // its number sits over the line's middle, or past the curl arrows when the middle is under them
        var tw = (String(d).length + 3) * 7.6, sg = b > a ? 1 : -1, mid = (a + b) / 2, clear = G.R + tw / 2 + 8;
        if(Math.abs(mid - a) < clear) mid = a + sg * (Math.abs(b - a) >= clear + tw / 2 ? clear : Math.abs(b - a) + tw / 2 + 10);
        html = '<path class="tb2-dimln" d="M' + n1(a) + ' ' + n1(y) + 'H' + n1(b) + 'M' + n1(a) + ' ' + n1(y - 4) + 'v8M' + n1(b) + ' ' + n1(y - 4) + 'v8"/>';
        // the number stays upright: its middle rides the tilted stick, a little above the line
        var lx = mid - a, ly = y - 13, c = Math.cos(s.th), sn = Math.sin(s.th);
        txt = '<text class="tb2-dimt" x="' + n1(a + lx * c + ly * sn) + '" y="' + n1(G.py - lx * sn + ly * c + 4.5) + '" text-anchor="middle">' + d + ' cm</text>';
      }
      if(D.dimHtml !== html){ D.dim.innerHTML = html; D.dimHtml = html; }
      if(D.dimtHtml !== txt){ D.dimt.innerHTML = txt; D.dimtHtml = txt; }
    }
    /* The curl arrows: one per sense around the fulcrum, a piece per mass (the active one strong), the bigger side
       68° long; the sizes are proportional to the torques. */
    function arcPt(cx, cy, R, a){ var r = a / RAD; return [cx + R * Math.sin(r), cy - R * Math.cos(r)]; }
    function paintArcs(s){
      var t = torquesOf(s), cx = px(s.pivot), cy = G.py, R = G.R, k = Math.min(s.scale || arcScale(s), 68 / Math.max(t.ccw, t.cw, 1e-9)), html = '';
      var act = activeItem(s, t);
      [['ccw', -1], ['cw', 1]].forEach(function(sd){
        var list = t.items.filter(function(it){ return sd[1] < 0 ? it.tau > 1e-12 : it.tau < -1e-12; });
        // nearest the fulcrum first
        list.sort(function(a, b){ return Math.abs(a.r) - Math.abs(b.r); });
        var a0 = 3 * sd[1], tot = 0;
        list.forEach(function(it){
          var sw = Math.abs(it.tau) * k, a1 = a0 + sd[1] * sw, p0 = arcPt(cx, cy, R, a0), p1 = arcPt(cx, cy, R, a1);
          if(sw > 0.3) html += '<path class="tb2-arc is-' + sd[0] + (it === act ? ' is-act' : '') + (it.kind === 'beam' ? ' is-beam' : '') + '" d="M' + n1(p0[0]) + ' ' + n1(p0[1]) + 'A' + R + ' ' + R + ' 0 0 ' + (sd[1] > 0 ? 1 : 0) + ' ' + n1(p1[0]) + ' ' + n1(p1[1]) + '"/>';
          a0 = a1; tot += sw;
        });
        if(tot > 0.3){
          var e = arcPt(cx, cy, R, a0), r = a0 / RAD, tx = Math.cos(r) * sd[1], ty = Math.sin(r) * sd[1], nx = -ty, ny = tx, L = G.ph ? 10 : 12, Wd = G.ph ? 6 : 7;
          html += '<path class="tb2-head is-' + sd[0] + '" d="M' + n1(e[0] + tx * L) + ' ' + n1(e[1] + ty * L) + 'L' + n1(e[0] + nx * Wd) + ' ' + n1(e[1] + ny * Wd) + 'L' + n1(e[0] - nx * Wd) + ' ' + n1(e[1] - ny * Wd) + 'Z"/>';
        }
        D.arcs.setAttribute('data-' + sd[0], tot.toFixed(3));
      });
      D.arcs.setAttribute('data-k', k.toFixed(4));
      if(D.arcHtml !== html){ D.arcs.innerHTML = html; D.arcHtml = html; }
      // the two numbers sit side by side over the top of the curls, where the arrows start
      var pr = pairTxt(t.ccw, t.cw), lx = cx - (G.ph ? 7 : 10), ly = cy - R - (G.ph ? 20 : 16), rx = cx + (G.ph ? 7 : 10);
      // Angle: the numbers are in the cause line (the scale and the lever arm need the room over the fulcrum)
      setText(D.tqL, st.tab === 'ang' ? '' : '↺ ' + pr[0] + ' N·m', lx, ly); setText(D.tqR, st.tab === 'ang' ? '' : '↻ ' + pr[1] + ' N·m', rx, ly);
    }
    function setText(el, t, x, y){ if(el.__t !== t){ el.textContent = t; el.__t = t; } el.setAttribute('x', n1(x)); el.setAttribute('y', n1(y)); }
    function activeItem(s, t){
      if(st.tab === 'ang') return t.items.filter(function(it){ return it.kind === 'pull'; })[0];
      var i = -1; s.masses.forEach(function(q, j){ if(q.id === s.active) i = j; });
      return t.items.filter(function(it){ return it.kind === 'mass' && it.i === i; })[0];
    }

    /* ---------------------------------------------------- the pull (Angle) */
    /* The scale's parts along the pull (px): string, the spring's stretch, the tube, the ring; the hand beyond. */
    function pullScale(ph, k){ return ph ? 0.85 : Math.min(k, 1.15); }
    function pullReach(ph, k){ return Math.round(196 * pullScale(ph, k)); }
    var FMAX = 3;
    function pullGeo(s){
      var p = s.pull, h = hookAt(s, p.x), a = p.ang / RAD + s.th, ux = Math.cos(a), uy = -Math.sin(a), sc = pullScale(G.ph, G.k);
      var fpx = 46 * sc, str = Math.round(72 * sc), body = Math.round(58 * sc), stretch = p.F * 8 * sc;
      var top = str + body + stretch;   // the ring
      return { h: h, ux: ux, uy: uy, fpx: fpx, str: str, body: body, stretch: stretch, top: top, ring: [h[0] + ux * top, h[1] + uy * top], hand: [h[0] + ux * (top + 26 * sc), h[1] + uy * (top + 26 * sc)], sc: sc };
    }
    function paintPull(s){
      var g = pullGeo(s), h = g.h, ux = g.ux, uy = g.uy, P = [px(s.pivot), G.py], sc = g.sc, p = s.pull;
      function at(d){ return [h[0] + ux * d, h[1] + uy * d]; }
      var a0 = at(g.str), a1 = at(g.str + g.body + g.stretch), ang = Math.atan2(uy, ux) * RAD;
      // the scale: a tube with marks, the hook rod drawn out by the stretch, the ring and the hand
      var bw = Math.round(16 * sc), html = '<line class="tb2-pstr" x1="' + n1(h[0]) + '" y1="' + n1(h[1]) + '" x2="' + n1(a0[0]) + '" y2="' + n1(a0[1]) + '"/>' +
        '<g transform="translate(' + n1(a0[0]) + ' ' + n1(a0[1]) + ') rotate(' + n1(ang) + ')">' +
        '<line class="tb2-prod" x1="0" y1="0" x2="' + n1(g.stretch + 6) + '" y2="0"/>' +
        '<rect class="tb2-ptube" x="' + n1(g.stretch) + '" y="' + (-bw / 2) + '" width="' + g.body + '" height="' + bw + '" rx="' + (bw / 2) + '" fill="url(#' + gid + 'm)"/>' +
        '<path class="tb2-pmarks" d="' + [0.2, 0.35, 0.5, 0.65, 0.8].map(function(f){ return 'M' + n1(g.stretch + g.body * f) + ' ' + (-bw / 2 + 3) + 'v' + (bw / 2 - 2); }).join('') + '"/>' +
        '<circle class="tb2-pring" cx="' + n1(g.stretch + g.body + 8 * sc) + '" cy="0" r="' + n1(7 * sc) + '"/></g>';
      // the hand holding the ring (a simple fist, drawn in the scale's direction)
      var hp = at(g.top + 26 * sc);
      html += '<g class="tb2-hand" transform="translate(' + n1(hp[0]) + ' ' + n1(hp[1]) + ') rotate(' + n1(ang + 90) + ')"><path d="M' + n1(-13 * sc) + ' ' + n1(4 * sc) + 'q0 -16 13 -16q13 0 13 16v8q0 6 -6 6h-14q-6 0 -6 -6z"/><path class="tb2-hand-l" d="M' + n1(-6 * sc) + ' ' + n1(-8 * sc) + 'v10M0 ' + n1(-10 * sc) + 'v12M' + n1(6 * sc) + ' ' + n1(-8 * sc) + 'v10"/></g>';
      // the force: one whole arrow from the hook (its point of application), its size and label
      var Lf = p.F * g.fpx, tip = at(Lf);
      html += S.arrow(h[0], h[1], ux * Lf, uy * Lf, { cls: 'f-applied', width: 4, head: 12 });
      // the reading on the scale's face: F on a pill on the tube
      // (a shallow pull lies close to the stick: its reading moves up off the tube, away from the stick's numbers)
      var mid = at(g.str + g.stretch + g.body / 2), rw = G.ph ? 44 : 50, lift = Math.max(0, 14 * (1 - 2 * Math.abs(Math.sin(p.ang / RAD))));
      if(lift){ var nx0 = -uy, ny0 = ux; if(ny0 > 0){ nx0 = -nx0; ny0 = -ny0; } mid = [mid[0] + nx0 * lift * 1.6, mid[1] + ny0 * lift * 1.6]; }
      var rd = F(p.F, 1) + ' N';
      html += '<g class="tb2-read" transform="translate(' + n1(mid[0]) + ' ' + n1(mid[1]) + ')"><rect x="-' + (rw / 2) + '" y="-12" width="' + rw + '" height="24" rx="12"/><text x="0" y="5" text-anchor="middle">' + rd + '</text></g>';
      // the angle between the stick and the pull at the hook
      var sa = (p.ang <= 90 ? 0 : 180) + s.th * RAD, ea = p.ang + s.th * RAD, ar = G.ph ? 26 : 34;
      var q0 = [h[0] + ar * Math.cos(sa / RAD), h[1] - ar * Math.sin(sa / RAD)], q1 = [h[0] + ar * Math.cos(ea / RAD), h[1] - ar * Math.sin(ea / RAD)];
      var th = p.ang <= 90 ? p.ang : 180 - p.ang, mida = ea + (p.ang <= 90 ? 30 : -30), ra = ar + (G.ph ? 14 : 12), tl = [h[0] + ra * Math.cos(mida / RAD), h[1] - ra * Math.sin(mida / RAD) + 4];
      html += '<path class="tb2-angle" d="M' + n1(q0[0]) + ' ' + n1(q0[1]) + 'A' + ar + ' ' + ar + ' 0 0 ' + (p.ang <= 90 ? 0 : 1) + ' ' + n1(q1[0]) + ' ' + n1(q1[1]) + '"/>' +
        '<text class="tb2-anglet" x="' + n1(tl[0]) + '" y="' + n1(tl[1]) + '" text-anchor="middle">' + Math.round(th) + '°</text>';
      if(D.pullHtml !== html){ D.pull.innerHTML = html; D.pullHtml = html; }
      D.pull.setAttribute('data-f', p.F); D.pull.setAttribute('data-ang', p.ang);
      // the line of action through the hook, and the lever arm from the fulcrum, perpendicular to it
      var tt = (P[0] - h[0]) * ux + (P[1] - h[1]) * uy, foot = [h[0] + ux * tt, h[1] + uy * tt], arm = Math.abs((p.x - s.pivot) / 100 * Math.sin(p.ang / RAD));
      var e1 = Math.min(tt, 0) - 26, e2 = Math.max(tt, 0) + 26, lo = '';
      lo += '<line class="tb2-loaln" x1="' + n1(h[0] + ux * e1) + '" y1="' + n1(h[1] + uy * e1) + '" x2="' + n1(h[0] + ux * Math.max(e2, Lf + 4)) + '" y2="' + n1(h[1] + uy * Math.max(e2, Lf + 4)) + '"/>';
      var vx = foot[0] - P[0], vy = foot[1] - P[1], vl = Math.hypot(vx, vy) || 1, k9 = 9, sg = tt > 0 ? -1 : 1;
      var c1 = [foot[0] - vx / vl * k9, foot[1] - vy / vl * k9];
      lo += '<line class="tb2-arm" x1="' + n1(P[0]) + '" y1="' + n1(P[1]) + '" x2="' + n1(foot[0]) + '" y2="' + n1(foot[1]) + '"/>';
      if(vl > 14) lo += '<path class="tb2-ra" d="M' + n1(c1[0]) + ' ' + n1(c1[1]) + 'l' + n1(sg * ux * k9) + ' ' + n1(sg * uy * k9) + 'l' + n1(vx / vl * k9) + ' ' + n1(vy / vl * k9) + '"/>';
      // its name and length, beside its middle, on the side away from the stick
      // its name: beside the line, past the curl arrows, clear of the stick, the hanging mass, the scale and the hand
      var lt = 'lever arm ' + F(arm, 2) + ' m', tw = lt.length * (G.ph ? 7.1 : 7.6), hw = tw / 2 + 3, hh = 9, best = null;
      var mq = s.masses[0], mh = mq ? hookAt(s, mq.x) : null, mz = mq ? bodySize(mq.m, G.k) : null, kn = pullGeo(s).hand;
      var stx = Math.cos(s.th), sty = -Math.sin(s.th);
      function clearOf(cx2, cy2){
        // the box's distance from the stick's line, from the mass's box, from the hand's knob, from the stage's edges
        var dn = Math.abs((cx2 - P[0]) * sty - (cy2 - P[1]) * stx) - (hw * Math.abs(sty) + hh * Math.abs(stx)) - G.thick / 2;
        var dm = mq ? Math.max(Math.abs(cx2 - mh[0]) - hw - mz.w / 2, Math.abs(cy2 - (mh[1] + G.str0 + mz.h / 2)) - hh - mz.h / 2 - G.str0 / 2) : 99;
        var dk = Math.max(Math.abs(cx2 - kn[0]) - hw - 22, Math.abs(cy2 - kn[1]) - hh - 22);
        var de = Math.min(cx2 - hw - 4, G.W - 4 - cx2 - hw, cy2 - hh - 4, G.benchY - 4 - cy2 - hh);
        var dr = Math.max(Math.abs(cx2 - mid[0]) - hw - rw / 2, Math.abs(cy2 - mid[1]) - hh - 12) - 4;
        var da = Math.max(Math.abs(cx2 - tl[0]) - hw - 14, Math.abs(cy2 - (tl[1] - 4)) - hh - 8) - 4;
        // on a first visit the cue stands to the right of the hand: the name keeps off it
        var dc = cue && cue.active() ? Math.max(cx2 - hw - (kn[0] + 196), kn[0] + 30 - (cx2 + hw), Math.abs(cy2 - kn[1]) - hh - 22) - 4 : 99;
        return Math.min(dn - 4, dm - 4, dk, de, dr, da, dc, 30);
      }
      [0.3, 0.5, (G.R + 34) / vl, 0.7, 0.9, 1.15, 1.4].forEach(function(f){
        [-1, 1, -2, 2].forEach(function(sd){
          var ox = -vy / vl * Math.sign(sd), oy = vx / vl * Math.sign(sd), gp = (hh + 6 + hw * Math.abs(ox) + 3) * Math.abs(sd);
          var cx2 = P[0] + vx * f + ox * gp, cy2 = P[1] + vy * f + oy * gp, sc2 = clearOf(cx2, cy2) - (Math.abs(f - 0.6) * 4);
          if(!best || sc2 > best.s) best = { s: sc2, x: cx2, y: cy2 };
        });
      });
      var lx = best.x, ly = best.y + 4, ox = 0;
      lo += '<text class="tb2-armt" x="' + n1(lx) + '" y="' + n1(ly) + '" text-anchor="middle">' + lt + '</text>';
      if(D.loaHtml !== lo){ D.loa.innerHTML = lo; D.loaHtml = lo; }
      D.loa.setAttribute('data-arm', arm.toFixed(4));
    }

    /* ---------------------------------------------------- the tray of masses (Balance) */
    var TRAY = [0.1, 0.2, 0.5];
    function trayPos(i){ var g = G, sc = g.ph ? 0.86 : 0.9, step = g.ph ? 54 : 70, x = g.W - (g.ph ? 32 : 60) - (2 - i) * step; return { x: x, y: g.benchY + (g.two ? 40 : 18), sc: sc }; }
    function drawTray(){
      if(st.tab !== 'bal'){ D.tray.innerHTML = ''; return; }
      var html = '', p0 = trayPos(0), p2 = trayPos(2), full = st.bal.masses.length >= 4;
      html += '<rect class="tb2-trayb" x="' + n1(p0.x - (G.ph ? 24 : 32)) + '" y="' + n1(p0.y + bodySize(0.5, G.k * p0.sc).h + 2) + '" width="' + n1(p2.x - p0.x + (G.ph ? 48 : 64)) + '" height="5" rx="2"/>';
      TRAY.forEach(function(m, i){ var p = trayPos(i), z = bodySize(m, G.k * p.sc), big = bodySize(0.5, G.k * p.sc); html += '<g class="tb2-tm' + (full ? ' is-off' : '') + '" transform="translate(' + n1(p.x) + ' ' + n1(p.y + big.h - z.h) + ')">' + brass(gid, m, G.k * p.sc, Math.round(m * 1000) + ' g') + '</g>'; });
      D.tray.innerHTML = html;
    }

    /* ---------------------------------------------------- controls on the picture */
    var HD = {}, fulK = null, holdB = null, trayB = [], pullH = null, slH = {}, drag = null, dragging = false;
    function clearControls(){ layer.el.querySelectorAll('.tk2-handle, .tk2-drag, .tk2-tap, .tb2-hold').forEach(function(e){ e.remove(); }); HD = {}; fulK = null; holdB = null; trayB = []; pullH = null; slH = {}; }
    function buildControls(){
      clearControls();
      if(!kit) return;
      var s = st[st.tab];
      if(st.tab === 'bal'){
        s.masses.forEach(function(q){ massHandle(s, q); });
        TRAY.forEach(function(m, i){
          var t = K.tap(layer, { label: 'Hang a ' + Math.round(m * 1000) + ' g mass on the stick', box: [0, 0, 10, 10], chip: false, onClick: function(){ hideCue(true); addMass(m, i); } });
          t.el.classList.add('tb2-traytap'); trayB.push(t);
        });
      }
      if(st.tab === 'ang'){
        pullH = K.handle(layer, { key: 'apphys-tb-pull', label: 'Spring scale: drag to aim the pull and change its size', value: s.pull.ang, min: 15, max: 165, step: 5,
          at: function(){ return pullGeo(s).hand; }, dir: function(){ var g = pullGeo(s); return Math.atan2(g.uy, g.ux) * RAD + 90; }, chip: false,
          pick: function(x, y){ return pickPull(s, x, y); },
          keys: function(v, key){ return keyPull(s, key); },
          valuetext: function(){ return pullText(s); },
          onStart: function(){ hideCue(true); tourDid('drag'); startDrag(); }, onInput: function(){ changed(); }, onEnd: function(){ endDrag(); } });
      }
      if(st.tab === 'bal' || st.tab === 'ang'){
        fulK = K.drag(layer, { label: 'Fulcrum position', min: 25, max: 75, step: 1, value: s.pivot, quiet: true, track: [0, 0, 1, 0],
          valuetext: function(v){ return 'at the ' + v + ' cm mark'; },
          onInput: function(v){ hideCue(true); startDrag(); s.pivot = v; changed(); }, onEnd: function(){ endDrag(); } });
        fulK.el.classList.add('tb2-ful');
        holdB = document.createElement('button'); holdB.type = 'button'; holdB.className = 'tb2-hold';
        holdB.addEventListener('click', function(){ hideCue(true); var s2 = st[st.tab]; s2.lock = !s2.lock; if(s2.lock){ s2.held = true; } else letGo(0); paintHold(); kick(); });
        layer.el.appendChild(holdB); paintHold();
      }
      if(st.tab === 'ine'){
        ['A', 'B'].forEach(function(w, i){
          slH[w] = K.handle(layer, { key: w === 'B' ? 'apphys-tb-slider' : null, quiet: w === 'A', chip: false, label: 'Stand ' + w + ': sliders’ distance from the axle', value: s['d' + w], min: 4, max: 20, step: 1,
            at: function(){ return sliderPt(i, 1); }, dir: function(){ return armDir(i); },
            pick: function(x, y){ return pickSlider(i, x, y); },
            valuetext: function(v){ return v + ' cm from the axle'; }, tag: function(v){ return v + ' cm'; }, tagSide: function(){ return 'up'; },
            onStart: function(){ hideCue(true); tourDid('drag'); raceHold(); }, onInput: function(v){ s['d' + w] = v; raceHold(); changedIne(); }, onEnd: function(){ raceGoSoon(byPointer() ? 220 : 700); } });
        });
      }
      placeControls();
    }
    function paintHold(){ if(!holdB) return; var s = st[st.tab]; holdB.textContent = s.lock ? 'Let go' : 'Hold level'; holdB.setAttribute('aria-pressed', String(!!s.lock)); holdB.setAttribute('aria-label', s.lock ? 'Supports holding the stick level: let go' : 'Hold the stick level on its supports'); }
    function placeControls(){
      if(!kit || !G) return;
      var s = st[st.tab];
      if(st.tab !== 'ine'){
        Object.keys(HD).forEach(function(id){ HD[id].place(); });
        if(pullH) pullH.place();
        if(fulK){ var a = px(25), b = px(75), y = G.benchY - 5; fulK.place([a, y, b, y]); }
        if(holdB){ holdB.style.left = (G.ph ? 8 : 14) + 'px'; holdB.style.top = n1(G.benchY + (G.two ? 44 : 20)) + 'px'; }
        trayB.forEach(function(t, i){ var p = trayPos(i), z = bodySize(0.5, G.k * p.sc), w = Math.max(44, z.w + 6); var th2 = Math.max(44, z.h + 10); t.place([p.x - w / 2, Math.min(p.y - 6, G.H - th2 - 1), w, th2]); t.el.disabled = st.bal.masses.length >= 4; });
      } else { if(slH.A) slH.A.place(); if(slH.B) slH.B.place(); }
      if(cue && cue.active()) cue.place();
    }
    function massHandle(s, q){
      var h = K.handle(layer, { key: q.id === 2 ? 'apphys-tb-mass' : null, chip: false, label: gLabel(q.m) + ' mass', value: q.x, min: 2, max: 98, step: 1,
        at: function(){ var hk = hookAt(s, q.x); return [hk[0], hk[1] + G.thick / 2 + G.str0 + rowY(q.ly) - 4]; },
        pick: function(x, y){ return pickMass(s, q, x, y); },
        keys: function(v, key, big){ return keyMass(s, q, key, big); },
        valuetext: function(){ return massText(s, q); },
        onStart: function(){ hideCue(true); tourDid('drag'); s.active = q.id; startDrag(); drag = { id: q.id, off: false }; },
        onInput: function(v){ q.x = v; levels(s); changed(); },
        onEnd: function(){ var off = drag && drag.id === q.id && drag.off; drag = null; if(off) removeMass(s, q); else endDrag(); } });
      h.knob.addEventListener('keydown', function(e){ if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); hideCue(true); removeMass(s, q, true); } });
      h.el.classList.add('tb2-mk');
      HD[q.id] = h;
      return h;
    }
    function massText(s, q){ var r = q.x - s.pivot; return 'at the ' + q.x + ' cm mark, ' + (r === 0 ? 'right over the fulcrum' : Math.abs(r) + ' cm ' + (r < 0 ? 'left' : 'right') + ' of the fulcrum') + '. Arrow keys move it, Delete takes it off.'; }
    /* A mass snaps to whole centimetres and keeps 4 cm from any other hook; pulled below the bench it comes off. */
    function freeNear(s, q, cm){
      cm = clamp(Math.round(cm), 2, 98);
      function ok(c){ return c >= 2 && c <= 98 && !s.masses.some(function(o){ return o !== q && Math.abs(o.x - c) < 4; }); }
      if(ok(cm)) return cm;
      for(var d = 1; d < 100; d++){ if(ok(cm - d)) return cm - d; if(ok(cm + d)) return cm + d; }
      return q.x;
    }
    function pickMass(s, q, x, y){
      var off = y > G.benchY - 4;
      if(drag && drag.id === q.id){ drag.off = off; }
      return freeNear(s, q, (x - G.x0) / G.ppm * 100);
    }
    function keyMass(s, q, key, big){
      var d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10 }[key];
      if(key === 'Home') return freeNear(s, q, 2); if(key === 'End') return freeNear(s, q, 98);
      if(d == null) return null;
      if(big) d *= 10;
      var to = clamp(q.x + d, 2, 98), c = to;
      // jump over a neighbour in the way, in the direction pressed
      while(c >= 2 && c <= 98 && s.masses.some(function(o){ return o !== q && Math.abs(o.x - c) < 4; })) c += d > 0 ? 1 : -1;
      return c >= 2 && c <= 98 ? c : q.x;
    }
    function pickPull(s, x, y){
      var h = hookAt(s, s.pull.x), dx = x - h[0], dy = h[1] - y, g = pullGeo(s);
      var a = Math.atan2(dy, dx) * RAD - s.th * RAD, ang = clamp(Math.round(a / 5) * 5, 15, 165);
      var len = Math.hypot(dx, dy), Fv = clamp(Math.round((len - 26 * g.sc - g.str - g.body) / (8 * g.sc) * 10) / 10, 0.2, FMAX);
      ang = fitAng(s, ang, Fv);
      s.pull.F = Fv; s.pull.ang = ang;
      return ang;
    }
    function keyPull(s, key){
      var p = s.pull;
      if(key === 'ArrowLeft'){ p.ang = fitAng(s, clamp(p.ang + 5, 15, 165), p.F); return p.ang; }
      if(key === 'ArrowRight'){ p.ang = fitAng(s, clamp(p.ang - 5, 15, 165), p.F); return p.ang; }
      if(key === 'ArrowUp'){ p.F = clamp(Math.round((p.F + 0.1) * 10) / 10, 0.2, FMAX); changed(); return p.ang; }
      if(key === 'ArrowDown'){ p.F = clamp(Math.round((p.F - 0.1) * 10) / 10, 0.2, FMAX); changed(); return p.ang; }
      return null;
    }
    /* A pull leaning far out would take the scale and the hand off a narrow stage: the angle stops where they still
       fit, with the stick at either stop. */
    function fitAng(s, ang, Fv){
      var keep = { F: s.pull.F, ang: s.pull.ang, th: s.th };
      function fits(a){
        s.pull.F = Fv; s.pull.ang = a;
        return [-STOP, 0, STOP].every(function(t){ s.th = t; var g = pullGeo(s), e = 30 * g.sc, x = g.hand[0], y = g.hand[1]; return x > e && x < G.W - e && y > e; });
      }
      var a = ang;
      while(!fits(a) && a !== 90) a += a > 90 ? -5 : 5;
      s.pull.F = keep.F; s.pull.ang = keep.ang; s.th = keep.th;
      return a;
    }
    function pullText(s){ var p = s.pull, th = p.ang <= 90 ? p.ang : 180 - p.ang; return F(p.F, 1) + ' newtons at ' + th + ' degrees to the stick, ' + (p.ang < 90 ? 'leaning toward the fulcrum' : p.ang > 90 ? 'leaning away from the fulcrum' : 'straight up') + '. Left and right turn it, up and down change its size.'; }

    /* ---------------------------------------------------- changes: hold while you move, let go to see */
    var relT = 0, raf = 0, lastT = 0;
    function startDrag(){
      var s = st[st.tab];
      clearTimeout(relT);
      dragging = true; s.held = true; cause.take(null);
      kick();
    }
    // a pointer let go shows the result at once; keys wait a moment after the last press
    var ptrUpT = 0;
    window.addEventListener('pointerup', function(){ ptrUpT = now(); if(dragging) setTimeout(function(){ if(dragging && !layer.el.querySelector('.is-drag')) endDrag(); }, 60); }, true);
    window.addEventListener('pointercancel', function(){ ptrUpT = now(); }, true);
    function byPointer(){ return now() - ptrUpT < 120; }
    function endDrag(){ dragging = false; letGo(byPointer() ? 140 : 650); }
    // let go only once the supports are all the way up (the stick is level), so a quick touch never leaves it askew
    function letGo(ms){ clearTimeout(relT); relT = setTimeout(function go(){ var s = st[st.tab]; if(st.tab === 'ine' || s.lock) { kick(); return; } if(s.postT < 1 && s.held){ relT = setTimeout(go, 40); return; } dragging = false; s.held = false; kick(); }, ms); }
    function grabStick(){ var s = st[st.tab]; s.held = true; kick(); }
    function changed(){ var s = st[st.tab]; paintStick(); paintCause(); kick(); }
    function addMass(m, i){
      var s = st.bal; if(s.masses.length >= 4) return;
      var spots = [10, 90, 20, 80, 15, 85, 35, 65, 5, 95, 40, 60, 25, 75, 45, 55];
      var x = spots.filter(function(c){ return !s.masses.some(function(o){ return Math.abs(o.x - c) < 4; }) && Math.abs(c - s.pivot) > 3; })[0] || 50;
      var q = { id: nextId++, m: m, x: x, lev: 0, ly: 0 };
      var from = trayPos(i), big = bodySize(0.5, G.k * from.sc), z = bodySize(m, G.k * from.sc);
      s.held = true; clearTimeout(relT); cause.take(null);
      s.fly.push({ q: q, t0: now(), dur: red() ? 0 : 520, from: [from.x, from.y + big.h - z.h], sc0: from.sc, add: true });
      drawTray(); kick();
    }
    function removeMass(s, q, byKey){
      var i = s.masses.indexOf(q); if(i < 0) return;
      var hk = hookAt(s, q.x), from = [hk[0], hk[1] + G.thick / 2 + G.str0 + rowY(q.ly)], slot = TRAY.indexOf(q.m), to = trayPos(slot < 0 ? 1 : slot);
      s.masses.splice(i, 1);
      if(HD[q.id]){ HD[q.id].el.remove(); delete HD[q.id]; }
      if(s.active === q.id) s.active = s.masses.length ? s.masses[s.masses.length - 1].id : 0;
      levels(s);
      s.fly.push({ q: q, t0: now(), dur: red() ? 0 : 420, from: from, to: [to.x, to.y + bodySize(0.5, G.k * to.sc).h - bodySize(q.m, G.k * to.sc).h], sc1: to.sc, add: false });
      say(gLabel(q.m) + ' mass taken off the stick.');
      drawTray(); changed();
      if(byKey){ var f = layer.el.querySelector('.tb2-mk .tk2-knob'); if(f) f.focus(); }
      letGo(byKey ? 650 : 160);
    }
    function paintFly(s){
      var html = '', t = now(), left = [];
      s.fly.forEach(function(f){
        var k = f.dur ? ease((t - f.t0) / f.dur) : 1, to = f.to, sc;
        if(f.add){ var hk = hookAt(s, f.q.x); to = [hk[0], hk[1] + G.thick / 2 + G.str0]; sc = f.sc0 + (1 - f.sc0) * k; }
        else sc = 1 + (f.sc1 - 1) * k;
        var x = f.from[0] + (to[0] - f.from[0]) * k, y = f.from[1] + (to[1] - f.from[1]) * k - Math.sin(Math.PI * k) * 60;
        if(k < 1) { html += '<g class="tb2-flym" transform="translate(' + n1(x) + ' ' + n1(y) + ')">' + brass(gid, f.q.m, G.k * sc) + '</g>'; left.push(f); }
        else if(f.add){ s.masses.push(f.q); s.active = f.q.id; levels(s); if(kit) { massHandle(s, f.q); } say(gLabel(f.q.m) + ' mass hung at the ' + f.q.x + ' cm mark.'); letGo(350); }
      });
      s.fly = left;
      if(D.flyHtml !== html){ D.fly.innerHTML = html; D.flyHtml = html; }
      if(!left.length) drawTray();
    }

    /* ---------------------------------------------------- the animation loop */
    function kick(){ if(raf) return; lastT = now(); raf = requestAnimationFrame(frame); }
    function frame(){
      raf = 0;
      if(stage.hidden || st.mode !== 'explore' || !G){ return; }
      var t = now(), dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
      var more = false;
      if(st.tab !== 'ine'){
        var s = st[st.tab];
        if(red()){ // reduced motion: the end state at once, with a short cross fade
          var was = resultOf(s);
          s.postT = s.held ? 1 : 0;
          var n = netOf(s); s.om = 0; s.th = s.held ? 0 : n === 0 ? (Math.abs(s.th) < 1e-9 ? 0 : s.th) : n > 0 ? STOP : -STOP;
          s.scale = arcScale(s); s.masses.forEach(function(q){ q.ly = q.lev; });
          if(resultOf(s) !== was) fade();
        } else stepStick(s, dt);
        paintFly(s);
        paintStick(); paintCause();
        more = stickBusy(s);
      } else {
        more = stepIne(dt);
        paintIne(); paintCauseIne();
      }
      if(more) raf = requestAnimationFrame(frame);
      else settled();
    }
    function fade(){ box.classList.remove('is-fade'); void box.offsetWidth; box.classList.add('is-fade'); }
    var lastSettle = '';
    function settled(){
      paintRef();
      if(st.tab === 'ine') return;
      var s = st[st.tab], r = resultOf(s), t = torquesOf(s), key = st.tab + r + t.ccw.toFixed(5) + t.cw.toFixed(5);
      if(key === lastSettle) return; lastSettle = key;
      var pr = pairTxt(t.ccw, t.cw), word = { held: 'Held level', 'down-left': 'Let go: the left end went down', 'down-right': 'Let go: the right end went down', level: 'Let go: it stays level, balanced' }[r];
      if(word) say(word + '. Counterclockwise ' + pr[0] + ' newton meters, clockwise ' + pr[1] + '.');
      // the takeaway, once a let go has shown the result
      if(r === 'level' && st.tab === 'bal'){
        var L = s.masses.filter(function(q){ return q.x < s.pivot; }), R = s.masses.filter(function(q){ return q.x > s.pivot; });
        if(L.length === 1 && R.length === 1 && L[0].m !== R[0].m){
          var ra = Math.max(L[0].m, R[0].m) / Math.min(L[0].m, R[0].m);
          cause.take(Math.abs(ra - 2) < 1e-9 ? 'Twice the distance, half the mass: the same torque.' : 'A smaller mass farther out balances a bigger mass closer in.');
        } else if(L.length + R.length > 1) cause.take('Balanced: the counterclockwise and clockwise torques are equal.');
      } else if(r === 'level' && st.tab === 'ang' && s.pull.ang !== 90) cause.take('A slanted pull has a shorter lever arm, so it needs more force.');
    }

    /* ---------------------------------------------------- the cause line */
    var lastCause = '';
    function paintCause(){
      if(st.tab === 'ine') return;
      var s = st[st.tab], t = torquesOf(s), r = resultOf(s), pr = pairTxt(t.ccw, t.cw), parts = [];
      if(st.tab === 'bal'){
        var q = s.masses.filter(function(m){ return m.id === s.active; })[0];
        if(q){ var rr = q.x - s.pivot; parts.push({ t: gLabel(q.m) + ' at ' + Math.abs(rr) + ' cm', role: rr < 0 ? 'ccw' : rr > 0 ? 'cw' : 'ink', say: gLabel(q.m) + ' ' + Math.abs(rr) + ' cm from the fulcrum' }); }
      } else {
        var p = s.pull, th = p.ang <= 90 ? p.ang : 180 - p.ang, arm = Math.abs((p.x - s.pivot) / 100 * Math.sin(p.ang / RAD));
        parts.push({ t: F(p.F, 1) + ' N at ' + th + '°', role: 'pull', say: 'a ' + F(p.F, 1) + ' newton pull at ' + th + ' degrees' });
        parts.push({ t: 'lever arm ' + F(arm, 2) + ' m', role: 'arm' });
      }
      parts.push({ t: '↺ ' + pr[0] + ' vs ↻ ' + pr[1] + ' N·m', role: 'vs', say: 'counterclockwise ' + pr[0] + ' against clockwise ' + pr[1] + ' newton meters' });
      var res = { held: ['held level', 'ink'], lift: ['lifting level', 'ink'], 'turn-ccw': ['turning ↺', 'ccw'], 'turn-cw': ['turning ↻', 'cw'], 'down-left': ['left end down', 'ccw'], 'down-right': ['right end down', 'cw'], level: ['balanced', 'good'] }[r];
      parts.push({ t: res[0], role: res[1] });
      var key = JSON.stringify(parts);
      if(key === lastCause && !cause.el.classList.contains('is-take')) return;
      if(cause.el.classList.contains('is-take')) return;
      lastCause = key;
      cause.set(parts);
      var vs = cause.el.querySelector('.tk2-cz.is-vs');
      if(vs) vs.innerHTML = '<span class="tb2-c-ccw">↺ ' + pr[0] + '</span> vs <span class="tb2-c-cw">↻ ' + pr[1] + '</span> N·m';
      cause.el.setAttribute('data-res', r);
    }

    /* ---------------------------------------------------- the Inertia tab */
    function wheelI(d){ return TB.race.inertia(RA.I0, RA.ms, d / 100); }
    function wheel(d){ return { m: RA.m, r: RA.r, I: wheelI(d), h: RA.h, g: G0 }; }
    var rT = 0;
    var takeT = 0;
    function raceHold(){
      var s = st.ine; clearTimeout(rT); clearTimeout(takeT); s.took = false;
      if(s.phase === 'ready' || s.phase === 'wind') return;
      s.rewind = { from: s.t, t0: now(), dur: red() ? 0 : 450 }; s.phase = 'wind'; kick();
    }
    function raceGoSoon(ms){ clearTimeout(rT); rT = setTimeout(function go(){ var s = st.ine; if(s.phase === 'wind'){ rT = setTimeout(go, 100); return; } s.phase = 'race'; s.t = 0; s.t0 = now(); kick(); }, ms || 220); }
    function raceState(i){ var s = st.ine, d = i ? s.dB : s.dA, t = s.phase === 'race' || s.phase === 'done' ? s.t : s.phase === 'wind' && s.rewind ? s.rewind.from * (1 - ease((now() - s.rewind.t0) / (s.rewind.dur || 1))) : 0; return TB.race.at(wheel(d), t); }
    function stepIne(dt){
      var s = st.ine;
      if(s.phase === 'wind'){
        if(!s.rewind || now() - s.rewind.t0 >= s.rewind.dur){ s.rewind = null; s.t = 0; s.phase = 'ready'; return false; }
        return true;
      }
      if(s.phase === 'race'){
        if(red()){ var a = TB.race.at(wheel(s.dA), 0), b = TB.race.at(wheel(s.dB), 0); s.t = Math.max(a.tEnd, b.tEnd); s.phase = 'done'; fade(); return false; }
        s.t = (now() - s.t0) / 1000;
        var A = TB.race.at(wheel(s.dA), s.t), B = TB.race.at(wheel(s.dB), s.t);
        if(A.done && B.done){ s.phase = 'done'; s.t = Math.max(A.tEnd, B.tEnd); announceRace(); return false; }
        return true;
      }
      return false;
    }
    function announceRace(){ var a = TB.race.at(wheel(st.ine.dA), 0), b = TB.race.at(wheel(st.ine.dB), 0); say(Math.abs(a.tEnd - b.tEnd) < 1e-6 ? 'A tie: both weights land after ' + f2(a.tEnd) + ' seconds.' : 'Stand ' + (a.tEnd < b.tEnd ? 'A' : 'B') + '’s weight lands first, after ' + f2(Math.min(a.tEnd, b.tEnd)) + ' seconds; the other after ' + f2(Math.max(a.tEnd, b.tEnd)) + ' seconds.'); }
    /* A slider's point: the cross arm turns in a horizontal plane, seen from a little above (its circle is an ellipse). */
    function sliderPt(i, sgn, d){
      var g = G, s = st.ine, dd = (d != null ? d : i ? s.dB : s.dA) / 100 * g.pxpm, a = raceState(i).theta;
      return [g.cx[i] + sgn * dd * Math.cos(a), g.axleY + sgn * dd * Math.sin(a) * g.tilt];
    }
    function armDir(i){ var a = raceState(i).theta, dx = Math.cos(a), dy = Math.sin(a) * G.tilt; return Math.atan2(dy, dx) * RAD; }
    function pickSlider(i, x, y){
      var a = raceState(i).theta, ux = Math.cos(a), uy = Math.sin(a) * G.tilt, L = Math.hypot(ux, uy) || 1;
      var d = ((x - G.cx[i]) * ux + (y - G.axleY) * uy) / (L * L) / G.pxpm * 100;
      return clamp(Math.round(d), 4, 20);
    }
    function changedIne(){ paintIne(); paintCauseIne(); }
    /* The bench's cupboard: doors with handles (calm, the weights fall outside it). */
    function cabinet(g){
      var x0 = g.tl + 10, w = g.tr - g.tl - 20, y0 = g.tableY + 42, h = g.floorY - y0, n = g.ph ? 2 : 4, out = '';
      for(var i = 0; i < n; i++){
        var x = x0 + 8 + i * (w - 16) / n, dw = (w - 16) / n - 8;
        out += '<rect class="tb2-door" x="' + n1(x) + '" y="' + (y0 + 8) + '" width="' + n1(dw) + '" height="' + (h - 16) + '" rx="3"/><rect class="tb2-knobd" x="' + n1(i % 2 ? x + 8 : x + dw - 14) + '" y="' + n1(y0 + 8 + (h - 16) / 2 - 12) + '" width="6" height="24" rx="3"/>';
      }
      return out;
    }
    function buildIne(){
      var g = G;
      svg.innerHTML = defs() + wallArt(g.W, g.H, g.floorY) +
        '<rect class="tb2-floor" x="0" y="' + g.floorY + '" width="' + g.W + '" height="' + (g.H - g.floorY) + '"/>' +
        // the table: top, a front board for the names, two legs; the floor the weights fall to
        '<rect x="' + g.tl + '" y="' + g.tableY + '" width="' + (g.tr - g.tl) + '" height="14" fill="url(#' + gid + 'top)"/><rect class="tb2-bench-f" x="' + (g.tl + 6) + '" y="' + (g.tableY + 14) + '" width="' + (g.tr - g.tl - 12) + '" height="28"/><rect class="tb2-bench-l" x="' + (g.tl + 6) + '" y="' + (g.tableY + 14) + '" width="' + (g.tr - g.tl - 12) + '" height="2"/>' +
        '<rect class="tb2-cab" x="' + (g.tl + 10) + '" y="' + (g.tableY + 42) + '" width="' + (g.tr - g.tl - 20) + '" height="' + (g.floorY - g.tableY - 42) + '"/>' + cabinet(g) +
        '<g class="tb2-ine"></g><g class="tb2-ilab" aria-hidden="true"></g>';
      D = { ine: svg.querySelector('.tb2-ine'), ilab: svg.querySelector('.tb2-ilab') };
      svg.setAttribute('aria-label', 'Two rotational inertia stands on a table, each with a weight on a string over a pulley at the table’s edge');
      buildControls();
    }
    function paintIne(){
      var g = G, s = st.ine, html = '', lab = '', sc = g.ph ? 0.85 : g.k;
      [0, 1].forEach(function(i){
        var name = i ? 'B' : 'A', cx = g.cx[i], ay = g.axleY, rs = raceState(i), a = rs.theta, d = i ? s.dB : s.dA, side = i ? 1 : -1;
        var edge = i ? g.tr : g.tl, pr = Math.round(11 * sc), wbw = bodySize(0.2, sc).w, pulX = edge + side * Math.round(wbw / 2 - pr + 10), sy = g.pulY, hr = g.hubR, bw = Math.round(34 * sc);
        // the stand: a tripod foot on the table, the axle, and the step pulley the string is wound on
        html += '<ellipse class="tb2-shadow" cx="' + cx + '" cy="' + (g.tableY + 1) + '" rx="' + (bw + 14) + '" ry="4"/>' +
          '<path class="tb2-base" fill="url(#' + gid + 'm)" d="M' + (cx - bw) + ' ' + g.tableY + 'L' + n1(cx - 9) + ' ' + (g.tableY - 16) + 'H' + n1(cx + 9) + 'L' + (cx + bw) + ' ' + g.tableY + 'Z"/>' +
          '<rect class="tb2-metal" x="' + n1(cx - 3.5) + '" y="' + n1(ay - 10) + '" width="7" height="' + n1(g.tableY - 16 - ay + 10) + '" fill="url(#' + gid + 'm)"/>' +
          '<rect class="tb2-drum" x="' + (cx - hr) + '" y="' + n1(sy - 6) + '" width="' + (2 * hr) + '" height="12" fill="url(#' + gid + 'm)"/><ellipse class="tb2-drum" cx="' + cx + '" cy="' + n1(sy - 6) + '" rx="' + hr + '" ry="' + n1(hr * g.tilt) + '" fill="url(#' + gid + 'r)"/>' +
          '<path class="tb2-dmark" d="M' + n1(cx + hr * Math.cos(a) * 0.8) + ' ' + n1(sy - 6 + hr * g.tilt * Math.sin(a) * 0.8) + 'L' + cx + ' ' + n1(sy - 6) + '"/>';
        // the string: from the pulley's rim to the pulley at the table's edge, then down to the weight
        var top = sy + pr + 4, bh = bodySize(0.2, sc).h, wy = top + rs.y / RA.h * (g.floorY - 2 - bh - top), wx = pulX + side * pr;
        html += '<rect class="tb2-metal" x="' + n1(edge - side * 6 - 3) + '" y="' + n1(sy - 3) + '" width="6" height="' + n1(g.tableY + 3 - sy) + '" fill="url(#' + gid + 'm)"/><rect class="tb2-metal" x="' + n1(Math.min(edge - side * 6, pulX) - 3) + '" y="' + n1(sy - 3) + '" width="' + n1(Math.abs(pulX - edge + side * 6) + 6) + '" height="6" rx="2" fill="url(#' + gid + 'm)"/>' +
          '<path class="tb2-string" d="M' + n1(cx + side * hr) + ' ' + n1(sy - pr) + 'H' + n1(pulX) + 'M' + n1(wx) + ' ' + n1(sy) + 'V' + n1(wy) + '"/>' +
          '<circle class="tb2-pul" cx="' + n1(pulX) + '" cy="' + n1(sy) + '" r="' + pr + '" fill="url(#' + gid + 'r)"/><circle class="tb2-pin" cx="' + n1(pulX) + '" cy="' + n1(sy) + '" r="2.5"/>' +
          '<g class="tb2-wt" data-y="' + rs.y.toFixed(4) + '" transform="translate(' + n1(wx) + ' ' + n1(wy) + ')">' + brass(gid, 0.2, sc, '200 g') + '</g>';
        // the cross arm turning in a horizontal plane (seen from a little above), its sliders in depth order
        var ends = [sliderPt(i, -1, 22), sliderPt(i, 1, 22)], sl = [sliderPt(i, -1, d), sliderPt(i, 1, d)];
        var sw = Math.round(24 * sc), sh = Math.round(18 * sc), back = Math.sin(a) < 0 ? 1 : 0, dir = armDir(i);
        function slider(p){ return '<g transform="translate(' + n1(p[0]) + ' ' + n1(p[1]) + ') rotate(' + n1(dir) + ')"><rect class="tb2-brass" x="' + (-sw / 2) + '" y="' + (-sh / 2) + '" width="' + sw + '" height="' + sh + '" rx="4" fill="url(#' + gid + 'b)"/><rect class="tb2-rim" x="' + (-sw / 2 + 3) + '" y="' + (-sh / 2 + 3) + '" width="' + (sw - 6) + '" height="3" rx="1.5"/><circle class="tb2-pin" cx="0" cy="' + n1(-sh / 2) + '" r="2"/></g>'; }
        function cap(p){ return '<circle class="tb2-cap" cx="' + n1(p[0]) + '" cy="' + n1(p[1]) + '" r="' + n1(4.5 * sc) + '"/>'; }
        html += '<line class="tb2-armr" x1="' + n1(ends[back][0]) + '" y1="' + n1(ends[back][1]) + '" x2="' + cx + '" y2="' + ay + '"/>' + cap(ends[back]) + slider(sl[back]) +
          '<ellipse class="tb2-hub" cx="' + cx + '" cy="' + ay + '" rx="' + n1(10 * sc) + '" ry="' + n1(7 * sc) + '" fill="url(#' + gid + 'r)"/>' +
          '<line class="tb2-armr" x1="' + cx + '" y1="' + ay + '" x2="' + n1(ends[1 - back][0]) + '" y2="' + n1(ends[1 - back][1]) + '"/>' + cap(ends[1 - back]) + slider(sl[1 - back]);
        // labels: the stand's name on the table's front, and the landing time over its weight once it is down
        lab += '<text class="tb2-wname" x="' + cx + '" y="' + n1(g.tableY + 32) + '" text-anchor="middle">' + name + '</text>';
        if(s.phase !== 'wind' && rs.done && (s.phase === 'done' || s.phase === 'race')) lab += '<text class="tb2-time" x="' + n1(wx) + '" y="' + n1(wy - 10) + '" text-anchor="middle">' + f2(rs.tEnd) + ' s</text>';
      });
      if(D.ineHtml !== html){ D.ine.innerHTML = html; D.ineHtml = html; }
      if(D.ilabHtml !== lab){ D.ilab.innerHTML = lab; D.ilabHtml = lab; }
      placeControls();
    }
    var lastCI = '';
    function paintCauseIne(){
      var s = st.ine, IA = wheelI(s.dA), IB = wheelI(s.dB), a = TB.race.at(wheel(s.dA), 0), b = TB.race.at(wheel(s.dB), 0), parts = [];
      var ra = IB / IA, more = ra >= 1 ? 'B' : 'A', rr = ra >= 1 ? ra : 1 / ra;
      parts.push({ t: 'A ' + s.dA + ' cm, B ' + s.dB + ' cm out', role: 'ink', say: 'sliders ' + s.dA + ' centimeters out on A and ' + s.dB + ' on B' });
      parts.push(Math.abs(ra - 1) < 1e-9 ? { t: 'same I', role: 'inert' } : { t: 'I of ' + more + ' ' + F(rr, 1) + '×', role: 'inert', say: more + '’s rotational inertia is ' + F(rr, 1) + ' times the other’s' });
      var done = s.phase === 'done', res;
      if(s.phase === 'race') res = { t: 'racing', role: 'ink' };
      else if(done) res = Math.abs(a.tEnd - b.tEnd) < 1e-6 ? { t: 'a tie', role: 'good' } : { t: (a.tEnd < b.tEnd ? 'A' : 'B') + ' lands ' + F(Math.abs(a.tEnd - b.tEnd), 2) + ' s sooner', role: 'good' };
      else res = { t: 'let go to race', role: 'ink' };
      parts.push(res);
      var key = JSON.stringify(parts);
      if(cause.el.classList.contains('is-take')){ if(done) return; cause.take(null); lastCI = ''; }
      if(key === lastCI) return;
      lastCI = key;
      cause.set(parts);
      cause.el.setAttribute('data-res', s.phase);
      if(done && Math.abs(ra - 1) > 1e-9 && !s.took){ s.took = true; clearTimeout(takeT); takeT = setTimeout(function(){ if(st.tab === 'ine' && st.ine.phase === 'done' && st.mode === 'explore') cause.take('Same mass, farther out: more rotational inertia, so it spins up more slowly.'); }, 2600); }
    }

    /* ---------------------------------------------------- "?" numbers */
    function paintRef(){
      var nums = ref.querySelector('.tb2-nums'), hh = ref.querySelector('.tb2-nums-h');
      ref.querySelector('.tb2-set').hidden = st.tab === 'ine';
      if(st.tab === 'ine'){
        var s = st.ine, A = wheel(s.dA), B = wheel(s.dB), a = TB.race.at(A, 0), b = TB.race.at(B, 0);
        hh.textContent = 'The two stands';
        nums.innerHTML = '<table class="tb-tbl"><caption class="sr-only">The two stands</caption><thead><tr><th></th><th class="r">A</th><th class="r">B</th></tr></thead><tbody>' +
          '<tr><th scope="row">Sliders from the axle</th><td class="r">' + F(s.dA / 100, 2) + ' m</td><td class="r">' + F(s.dB / 100, 2) + ' m</td></tr>' +
          '<tr><th scope="row">I = I<sub>hub</sub> + 2 m d²</th><td class="r">' + F(A.I, 4) + ' kg·m²</td><td class="r">' + F(B.I, 4) + ' kg·m²</td></tr>' +
          '<tr><th scope="row">Weight’s acceleration</th><td class="r">' + F(a.a, 3) + ' m/s²</td><td class="r">' + F(b.a, 3) + ' m/s²</td></tr>' +
          '<tr><th scope="row">String tension</th><td class="r">' + F(a.T, 3) + ' N</td><td class="r">' + F(b.T, 3) + ' N</td></tr>' +
          '<tr><th scope="row">Time to fall 0.80 m</th><td class="r">' + F(a.tEnd, 2) + ' s</td><td class="r">' + F(b.tEnd, 2) + ' s</td></tr>' +
          '<tr><th scope="row">At the floor: K of the weight, K<sub>rot</sub> of the stand</th><td class="r">' + F(TB.race.at(A, a.tEnd).K, 3) + ' J, ' + F(TB.race.at(A, a.tEnd).Krot, 3) + ' J</td><td class="r">' + F(TB.race.at(B, b.tEnd).K, 3) + ' J, ' + F(TB.race.at(B, b.tEnd).Krot, 3) + ' J</td></tr></tbody></table>' +
          '<p class="bt-small">Both stands have the same mass; only where it sits differs. The weight’s lost m g h (' + F(RA.m * G0 * RA.h, 3) + ' J) is shared between its own K and the stand’s K<sub>rot</sub> = ½ I ω²: the stand with the larger I takes the bigger share, so its weight moves more slowly.</p>';
        return;
      }
      var s2 = st[st.tab], t = torquesOf(s2), bal = Math.abs(t.net) < 1e-9;
      hh.textContent = 'The torques about the fulcrum (stick level)';
      function name(it){ return it.kind === 'beam' ? 'The stick’s weight' : it.kind === 'pull' ? 'The pull' : gLabel(s2.masses[it.i].m) + ' at the ' + s2.masses[it.i].x + ' cm mark'; }
      var rows = t.items.map(function(it){ return '<tr><th scope="row">' + esc(name(it)) + '</th><td class="r">' + F(it.F, 3) + ' N</td><td class="r">' + F(it.arm, 3) + ' m</td><td class="r">' + (Math.abs(it.tau) < 1e-12 ? '0' : (it.tau > 0 ? '↺ ' : '↻ ') + F(Math.abs(it.tau), 3)) + '</td></tr>'; }).join('');
      nums.innerHTML = '<table class="tb-tbl"><caption class="sr-only">Every torque about the fulcrum with the stick level</caption><thead><tr><th>Force</th><th class="r">Size</th><th class="r">Lever arm</th><th class="r">τ (N·m)</th></tr></thead><tbody>' + rows +
        '<tr class="hl"><th scope="row">Net</th><td></td><td></td><td class="r">' + (bal ? '0' : (t.net > 0 ? '↺ ' : '↻ ') + F(Math.abs(t.net), 3)) + '</td></tr></tbody></table>' +
        '<p class="bt-small">Fulcrum at the ' + s2.pivot + ' cm mark. I about the fulcrum ' + F(t.I, 4) + ' kg·m² (each mass m r², the stick (1/12) M L² + M d²), so α = τ<sub>net</sub> / I = ' + F(Math.abs(t.alpha), 3) + ' rad/s² the moment it is let go. ' +
        'Held level, the supports and the fulcrum together push up with ' + F(t.support.y, 3) + ' N' + (Math.abs(t.support.x) > 1e-6 ? ' and sideways with ' + F(Math.abs(t.support.x), 3) + ' N' : '') + ': translational equilibrium is a separate condition from rotational equilibrium.</p>';
    }

    /* ---------------------------------------------------- tabs, layout, cue, tour */
    var PURPOSE = { bal: 'See how mass and distance make a torque.', ang: 'See why a slanted pull turns the stick less.', ine: 'See why mass farther out spins up slower.' };
    var CUE = { bal: 'Drag the 100 g mass', ang: 'Drag the scale', ine: 'Drag a slider on B' };
    var cues = {}, cue = null;
    function setTab(v, user){
      if(tour) tour.stop();
      hideCue(false);
      st.tab = v; lastCause = ''; lastCI = ''; lastSettle = '';
      if(tabs && tabs.value() !== v) tabs.value(v);
      if(head) head.purpose(PURPOSE[v]);
      cause.take(null);
      stage.setAttribute('data-tab', v);
      built = '';
      layout();
      if(v === 'ine'){ st.ine.took = false; paintCauseIne(); } else paintCause();
      paintRef();
      if(st.mode === 'explore') setTimeout(function(){ if(cue && !(tour && tour.active())) cue.show(); }, 30);
      if(user) T.event('apphys-tool-scene', { tool: 'torque-balance', scene: v });
    }
    function layout(){
      if(stage.hidden || !box.isConnected) return;
      var r = box.getBoundingClientRect();
      if(!r.width) return;
      W = Math.max(280, Math.round(r.width)); phone = W < 600;
      if(phone){
        var need = st.tab === 'ine' ? geoIne(W, 0).H : geoStick(W, 0, st.tab).H;
        box.style.height = need + 'px';
      } else {
        box.style.height = ''; box.style.minHeight = '';
        var r0 = box.getBoundingClientRect(), nd = st.tab === 'ine' ? 0 : geoStick(W, Math.max(360, Math.round(r0.height)), st.tab).H;
        box.style.minHeight = nd > Math.round(r0.height) ? nd + 'px' : '';
      }
      r = box.getBoundingClientRect();
      H = phone ? parseFloat(box.style.height) : Math.max(360, Math.round(r.height));
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      var sig = st.tab + W + 'x' + H;
      if(sig === built){ placeControls(); return; }
      built = sig;
      if(st.tab === 'ine'){ G = geoIne(W, H); buildIne(); paintIne(); }
      else { G = geoStick(W, H, st.tab); var s = st[st.tab]; levels(s); s.masses.forEach(function(q){ q.ly = q.lev; }); buildStick(); paintStick(); }
      if(cue && cue.active()) cue.place();
    }
    if(kit){
      ['bal', 'ang', 'ine'].forEach(function(k){
        cues[k] = K.cue(layer, { key: 'apphys-torque-balance-' + k, text: CUE[k], side: k === 'ang' ? 'right' : k === 'ine' ? 'above' : 'below', at: function(){
          if(!G) return [0, 0];
          if(k === 'bal'){ var s = st.bal, q = s.masses.filter(function(m){ return m.id === 2; })[0] || s.masses[0]; if(!q) return [G.W / 2, G.py]; var hk = hookAt(s, q.x); return [hk[0], hk[1] + G.thick / 2 + G.str0 + rowY(q.ly) + bodySize(q.m, G.k).h + 6]; }
          if(k === 'ang'){ var r = pullGeo(st.ang).hand; return [r[0] + 14, r[1]]; }
          var p = sliderPt(1, 1); return [p[0], p[1] - 46];
        } });
      });
      cue = { show: function(){ var r = cues[st.tab].show(); if(r && st.tab === 'ang' && G && D.loa) paintStick(); return r; }, hide: function(u){ cues[st.tab].hide(u); }, place: function(){ cues[st.tab].place(); }, active: function(){ return cues[st.tab].active(); } };
    }
    function hideCue(used){ Object.keys(cues).forEach(function(k){ if(cues[k].active()) cues[k].hide(used && k === st.tab); }); }
    var tour = null, tours = {};
    function knobRect(sel){ var e = layer.el.querySelector(sel); return e ? e.getBoundingClientRect() : box.getBoundingClientRect(); }
    if(kit){
      tours.bal = K.tour({ key: 'apphys-torque-balance-bal', label: 'Show me how', steps: [
        { id: 'drag', text: 'Drag a mass along the stick. The supports hold it level while you move it.', target: function(){ return knobRect('.tb2-mk .tk2-knob'); } },
        { id: 'arcs', text: 'The curl arrows compare the turning effects: counterclockwise against clockwise.', target: function(){ return D.arcs ? D.arcs.getBoundingClientRect() : box.getBoundingClientRect(); } },
        { id: 'go', text: 'Let go: the bigger torque wins, or it stays level when they are equal.', target: function(){ return D.stick ? D.stick.getBoundingClientRect() : box.getBoundingClientRect(); } }] });
      tours.ang = K.tour({ key: 'apphys-torque-balance-ang', label: 'Show me how', steps: [
        { id: 'drag', text: 'Drag the scale to aim the pull and change how hard it is.', target: function(){ return knobRect('.tk2-handle .tk2-knob'); } },
        { id: 'arm', text: 'The lever arm is the distance from the fulcrum to the pull’s line, square to it.', target: function(){ return D.loa ? D.loa.getBoundingClientRect() : box.getBoundingClientRect(); } },
        { id: 'go', text: 'Let go to see whether the stick balances.', target: function(){ return D.stick ? D.stick.getBoundingClientRect() : box.getBoundingClientRect(); } }] });
      tours.ine = K.tour({ key: 'apphys-torque-balance-ine', label: 'Show me how', steps: [
        { id: 'drag', text: 'Drag a slider in or out along the arm.', target: function(){ return knobRect('.tk2-handle:not(.is-quiet) .tk2-knob'); } },
        { id: 'go', text: 'Let go: both weights drop at once.', target: function(){ return D.ine ? D.ine.getBoundingClientRect() : box.getBoundingClientRect(); } },
        { id: 'end', text: 'Same mass on each stand: the one with its mass closer in spins up faster.', target: function(){ return cause.el.getBoundingClientRect(); } }] });
      tour = { start: function(f){ return tours[st.tab].start(f); }, stop: function(){ Object.keys(tours).forEach(function(k){ tours[k].stop(); }); }, active: function(){ return Object.keys(tours).some(function(k){ return tours[k].active(); }); }, did: function(id){ tours[st.tab].did(id); } };
    }
    function tourDid(id){ if(tour) tour.did(id); }
    function startTour(force){ if(!tour) return; hideCue(false); tour.start(force); }
    function startOver(){
      var k = st.tab;
      if(k === 'bal'){ st.bal.masses = [{ id: nextId++, m: 0.2, x: 30, lev: 0, ly: 0 }, { id: nextId++, m: 0.1, x: 80, lev: 0, ly: 0 }]; st.bal.active = st.bal.masses[1].id; st.bal.pivot = 50; st.bal.lock = false; }
      if(k === 'ang'){ st.ang.pull = { F: 1.5, x: 10, ang: 60 }; st.ang.pivot = 50; st.ang.lock = false; }
      if(k === 'ine'){ st.ine.dA = 6; st.ine.dB = 18; raceHold(); }
      built = ''; cause.take(null); layout();
      if(k !== 'ine'){ st[k].held = true; letGo(350); paintCause(); } else { paintCauseIne(); }
      kick();
    }

    /* ---------------------------------------------------- mode switches and sizing */
    function shown(m){
      st.mode = m;
      if(m !== 'explore'){ if(raf){ cancelAnimationFrame(raf); raf = 0; } clearTimeout(relT); clearTimeout(rT); if(tour) tour.stop(); hideCue(false); dragging = false;
        ['bal', 'ang'].forEach(function(k){ var s = st[k]; s.fly.forEach(function(f){ if(f.add){ s.masses.push(f.q); } }); s.fly = []; if(!s.lock){ s.held = false; } s.postT = s.held ? 1 : 0; s.om = 0; var n = netOf(s); s.th = s.held ? 0 : n === 0 ? 0 : n > 0 ? STOP : -STOP; levels(s); s.masses.forEach(function(q){ q.ly = q.lev; }); });
        if(st.ine.phase !== 'ready'){ var a = TB.race.at(wheel(st.ine.dA), 0), b = TB.race.at(wheel(st.ine.dB), 0); st.ine.t = Math.max(a.tEnd, b.tEnd); st.ine.phase = 'done'; st.ine.rewind = null; }
        built = ''; return; }
      setTimeout(function(){ layout(); if(cue && !(tour && tour.active())) cue.show(); kick(); }, 30);
    }
    if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(layout, 50); }).observe(box); }
    else window.addEventListener('resize', function(){ layout(); });
    function red(){ return kit ? K.reduced() : T.reduced(); }

    // tests and the frame checks read the drawn state here (no behaviour hangs on it)
    stage.__tb = { st: st, torques: function(k){ return torquesOf(st[k || st.tab]); }, result: function(k){ return resultOf(st[k || st.tab]); }, geo: function(){ return G; },
      race: function(i){ return raceState(i); }, pullGeo: function(){ return pullGeo(st.ang); } };

    head && head.purpose(PURPOSE.bal);
    stage.setAttribute('data-tab', 'bal');
    return {
      stop: function(){ shown('quiz'); },
      shown: shown,
      kit2: function(pane, s){ LS = s; setTimeout(function(){ layout(); paintCause(); paintRef(); if(cue) cue.show(); }, 30); return { stage: stage, ref: ref, about: [(function(){ var d = document.createElement('div'); d.className = 'bt-intro'; d.innerHTML = data.intro || ''; return d; })()] }; },
      plain: function(){ host.appendChild(stage); host.appendChild(ref); setTimeout(function(){ layout(); paintCause(); paintRef(); }, 30); }
    };
  }

  /* ------------------------------------------------------------ quiz */
  function phoneNow(){ try{ return matchMedia('(max-width:640px), (max-width:999.98px) and (max-height:540px)').matches; }catch(e){ return false; } }
  /* On a phone the problem drawings use bigger masses and labels (Z 1.5: 12 px text at 0.68 scale). */
  function figure(p){
    var z0 = Z; Z = phoneNow() ? 1.5 : 1;
    try{ return figureAt(p); } finally { Z = z0; }
  }
  function figureAt(p){
    var f = p.fig, id = nid('tbq'), W = 520, out = '', label = '', H = 240;
    if(f.kind === 'lever'){
      H = 220;
      var px0 = 90, py = 120, ppm = f.obj === 'door' ? 380 : f.obj === 'stick' ? 420 : 900, len = Math.min(380, f.r * ppm + 70), ax = px0 + f.r * ppm;
      if(f.obj === 'wrench'){
        out += '<polygon points="' + [0, 60, 120, 180, 240, 300].map(function(a){ return n1(px0 + 22 * Math.cos(M.rad(a))) + ',' + n1(py + 22 * Math.sin(M.rad(a))); }).join(' ') + '" fill="url(#' + id + 'm)" class="tb-metal"/>' +
          '<path class="tb-metal" fill="url(#' + id + 'm)" d="M' + (px0 + 18) + ' ' + (py - 11) + 'L' + n1(px0 + len) + ' ' + (py - 9) + 'a9 9 0 0 1 0 18L' + (px0 + 18) + ' ' + (py + 11) + 'Z"/><circle cx="' + px0 + '" cy="' + py + '" r="5" fill="#2E3438"/>';
      } else if(f.obj === 'door'){
        out += '<rect x="20" y="' + (py - 60) + '" width="' + (px0 - 30) + '" height="120" fill="var(--track)"/><rect class="tb-wood" x="' + px0 + '" y="' + (py - 8) + '" width="' + n1(len) + '" height="16" rx="2" fill="url(#' + id + 'w)"/>' +
          '<circle cx="' + px0 + '" cy="' + py + '" r="8" fill="url(#' + id + 'r)" class="tb-metal"/>' + '<text class="tb-hint" x="24" y="' + (py - 66) + '">wall</text>';
      } else {
        out += '<rect class="tb-wood" x="' + (px0 - 10) + '" y="' + (py - 8) + '" width="' + n1(len + 10) + '" height="16" rx="2" fill="url(#' + id + 'w)"/><circle cx="' + px0 + '" cy="' + py + '" r="6" fill="url(#' + id + 'r)" class="tb-metal"/><circle cx="' + px0 + '" cy="' + py + '" r="2" fill="#2E3438"/>';
      }
      var a = M.rad(f.ang), L = 92, dx = Math.cos(a) * L, dy = -Math.sin(a) * L;
      out += '<path class="tb-angle" d="M' + n1(ax + 34) + ' ' + py + 'A34 34 0 0 ' + (f.up ? 0 : 1) + ' ' + n1(ax + 34 * Math.cos(a)) + ' ' + n1(py - 34 * Math.sin(a)) + '"/>' +
        '<text class="tb-angle-t" x="' + n1(ax + 46 * Math.cos(a / 2)) + '" y="' + n1(py - 46 * Math.sin(a / 2) + 5) + '">' + f.th + '°</text>' +
        '<line class="tb-loa" x1="' + ax + '" y1="' + py + '" x2="' + n1(ax + 60) + '" y2="' + py + '" stroke-dasharray="3 4"/>' +
        S.arrow(ax, py, dx, dy, { cls: 'f-applied', label: 'F = ' + gv(f.F) + ' N', width: 3.5, head: 12 }) +
        '<circle cx="' + n1(ax) + '" cy="' + py + '" r="4" fill="var(--ink)"/>' +
        '<g class="tb-dim"><line x1="' + px0 + '" x2="' + n1(ax) + '" y1="' + (py + (f.up ? 40 : -40)) + '" y2="' + (py + (f.up ? 40 : -40)) + '" stroke="var(--ink)" stroke-width="1.3"/>' +
        '<line x1="' + px0 + '" x2="' + px0 + '" y1="' + (py + (f.up ? 33 : -47)) + '" y2="' + (py + (f.up ? 47 : -33)) + '" stroke="var(--ink)" stroke-width="1.3"/><line x1="' + n1(ax) + '" x2="' + n1(ax) + '" y1="' + (py + (f.up ? 33 : -47)) + '" y2="' + (py + (f.up ? 47 : -33)) + '" stroke="var(--ink)" stroke-width="1.3"/>' +
        '<text class="tb-angle-t" x="' + n1((px0 + ax) / 2) + '" y="' + (py + (f.up ? 60 : -48)) + '" text-anchor="middle">r = ' + gv(f.r) + ' m</text></g>';
      // Room on the right for the arrow and its label (a long lever clipped "F = 40 N").
      W = Math.max(W, Math.ceil(Math.max(ax + Math.max(dx, 0) + 24 + ('F = ' + gv(f.F) + ' N').length * (Z > 1 ? 11 : 8.5), px0 + len + 20) / 10) * 10);
      label = 'Top or side view of ' + (f.obj === 'door' ? 'a door on its hinge' : f.obj === 'wrench' ? 'a wrench on a bolt' : 'a stick on a pin') + ': a ' + gv(f.F) + ' N force at ' + f.th + ' degrees to it, ' + gv(f.r) + ' m from the pivot, pointing ' + (f.up ? 'up' : 'down') + ' and outward.';
    } else if(f.kind === 'stick'){
      H = 230; var x0 = 30, pp = 440, y = 100, bench = 200;
      out += benchArt(W, bench) + standArt(id, x0 + f.pivot * pp, y, bench) + stickArt(id, x0, y, pp, 1, 14) + clampArt(id, x0 + f.pivot * pp, y, 14) +
        f.masses.map(function(q){ return hookArt(id, x0 + q.x * pp, y, 14) + massArt(id, x0 + q.x * pp, y + 7, q.m, gv(q.m) + ' kg'); }).join('') +
        (Z > 1 ? '<g opacity=".9"><rect class="tb-ghost" x="' + (W - 110) + '" y="14" width="88" height="40" rx="5"/><text class="tb-angle-t" x="' + (W - 66) + '" y="40" text-anchor="middle">' + gv(f.ghost.m) + ' kg</text><text class="tb-hint" x="' + (W - 118) + '" y="40" text-anchor="end">where?</text></g>'
          : '<g opacity=".9"><rect class="tb-ghost" x="' + (W - 92) + '" y="18" width="62" height="34" rx="5"/><text class="tb-angle-t" x="' + (W - 61) + '" y="40" text-anchor="middle">' + gv(f.ghost.m) + ' kg</text><text class="tb-hint" x="' + (W - 100) + '" y="40" text-anchor="end">where?</text></g>');
      label = 'A meter stick on a fulcrum at the ' + Math.round(f.pivot * 100) + ' cm mark with a ' + gv(f.masses[0].m) + ' kg mass hanging at ' + Math.round(f.masses[0].x * 100) + ' cm; a ' + gv(f.ghost.m) + ' kg mass is still to be placed.';
    } else if(f.kind === 'plank'){
      H = 230; var lx = 50, pw = W - 100, sc = pw / f.L, yp = 140, bench2 = 206, xx = lx + f.x * sc;
      out += benchArt(W, bench2) + [lx, lx + pw].map(function(sx){ return '<path class="tb-metal" fill="url(#' + id + 'm)" d="M' + (sx - 22) + ' ' + bench2 + 'L' + (sx - 8) + ' ' + (yp + 8) + 'L' + (sx + 8) + ' ' + (yp + 8) + 'L' + (sx + 22) + ' ' + bench2 + 'Z"/>'; }).join('') +
        '<rect class="tb-wood" x="' + (lx - 12) + '" y="' + (yp - 8) + '" width="' + (pw + 24) + '" height="16" rx="2" fill="url(#' + id + 'w)"/>';
      if(f.who === 'A crate') out += '<rect x="' + n1(xx - 30) + '" y="' + (yp - 62) + '" width="60" height="54" rx="3" fill="url(#' + id + 'w)" class="tb-wood"/><path d="M' + n1(xx - 30) + ' ' + (yp - 62) + 'l60 54M' + n1(xx + 30) + ' ' + (yp - 62) + 'l-60 54" stroke="var(--tb-wood-ink)" stroke-width="1.5" opacity=".5"/>';
      else out += '<g fill="var(--phys-s1)"><circle cx="' + n1(xx) + '" cy="' + (yp - 84) + '" r="11"/><rect x="' + n1(xx - 13) + '" y="' + (yp - 70) + '" width="26" height="34" rx="9"/><rect x="' + n1(xx - 12) + '" y="' + (yp - 40) + '" width="10" height="32" rx="4"/><rect x="' + n1(xx + 2) + '" y="' + (yp - 40) + '" width="10" height="32" rx="4"/></g>';
      out += '<line x1="' + lx + '" x2="' + n1(xx) + '" y1="' + (yp + 24) + '" y2="' + (yp + 24) + '" stroke="var(--ink)" stroke-width="1.3"/><text class="tb-angle-t" x="' + n1((lx + xx) / 2) + '" y="' + (yp + 40) + '" text-anchor="middle">' + gv(f.x) + ' m</text>' +
        '<text class="tb-angle-t" x="' + (W / 2) + '" y="24" text-anchor="middle">L = ' + gv(f.L) + ' m, plank ' + gv(f.mb) + ' kg, load ' + gv(f.m) + ' kg</text>';
      label = 'A plank ' + gv(f.L) + ' m long on a support under each end, with ' + f.who.toLowerCase() + ' ' + gv(f.x) + ' m from the left end.';
    } else if(f.kind === 'rod'){
      H = 200; var cx = W / 2, cy = 90, ps = 420;
      out += '<rect class="tb-metal" x="' + (cx - 5) + '" y="' + cy + '" width="10" height="90" fill="url(#' + id + 'm)"/><rect class="tb-metal" x="' + (cx - 50) + '" y="178" width="100" height="10" rx="3" fill="url(#' + id + 'm)"/>' +
        '<rect x="' + n1(cx - 0.55 * ps) + '" y="' + (cy - 3) + '" width="' + n1(1.1 * ps) + '" height="6" rx="3" fill="var(--muted)"/>' +
        [[-f.r1, f.m1], [f.r2, f.m2]].map(function(b){ var rr = 9 + 7 * Math.sqrt(b[1]); return '<circle cx="' + n1(cx + b[0] * ps) + '" cy="' + cy + '" r="' + n1(rr) + '" fill="url(#' + id + 'r)" class="tb-metal"/><text class="tb-angle-t" x="' + n1(cx + b[0] * ps) + '" y="' + n1(cy - rr - 8) + '" text-anchor="middle">' + gv(b[1]) + ' kg</text>' +
          '<line x1="' + cx + '" x2="' + n1(cx + b[0] * ps) + '" y1="' + (cy + 34) + '" y2="' + (cy + 34) + '" stroke="var(--ink)" stroke-width="1.3"/><text class="tb-angle-t" x="' + n1(cx + b[0] * ps / 2) + '" y="' + (cy + 52) + '" text-anchor="middle">' + gv(Math.abs(b[0])) + ' m</text>'; }).join('') +
        '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="url(#' + id + 'r)" class="tb-metal"/><circle cx="' + cx + '" cy="' + cy + '" r="2.5" fill="#2E3438"/>';
      label = 'A light rod on a central pivot, held level: ' + gv(f.m1) + ' kg at ' + gv(f.r1) + ' m to the left and ' + gv(f.m2) + ' kg at ' + gv(f.r2) + ' m to the right.';
    } else {
      H = 210; var ps2 = 320;
      [['A', f.dA, W * 0.27], ['B', f.dB, W * 0.73]].forEach(function(w){
        var cx2 = w[2], cy2 = 70, dd = w[1] * ps2;
        out += '<rect class="tb-metal" x="' + n1(cx2 - 0.27 * ps2) + '" y="' + (cy2 - 3) + '" width="' + n1(0.54 * ps2) + '" height="6" rx="3" fill="url(#' + id + 'm)"/>' +
          [-1, 1].map(function(sg){ return '<rect x="' + n1(cx2 + sg * dd - 9) + '" y="' + (cy2 - 11) + '" width="18" height="22" rx="4" fill="url(#' + id + 'b)" stroke="#6B4E12" stroke-width="1.2"/>'; }).join('') +
          '<circle cx="' + cx2 + '" cy="' + cy2 + '" r="13" fill="url(#' + id + 'r)" class="tb-metal"/><line class="tb-string" x1="' + (cx2 + 13) + '" y1="' + cy2 + '" x2="' + (cx2 + 13) + '" y2="150"/>' + massArt(id, cx2 + 13, 132, 0.2, '0.20 kg') +
          '<text class="tb-angle-t" x="' + cx2 + '" y="' + (cy2 - 30) + '" text-anchor="middle">' + (Z > 1 ? w[0] + ': sliders ' : 'Wheel ' + w[0] + ': sliders ') + gv(w[1]) + ' m out</text>';
      });
      label = 'Two race wheels: A with its sliders ' + gv(f.dA) + ' m from the axle, B with them ' + gv(f.dB) + ' m out; a weight hangs from a string on each hub.';
    }
    return '<figure class="cd-fig tb-fig"><svg viewBox="0 0 ' + W + ' ' + H + '" class="phys-scene" role="img" aria-label="' + esc(label) + '">' + defs(id) + out + '</svg></figure>';
  }
  function quiz(pane, data){
    T.drill(pane, data, {
      slug: 'torque-balance', generate: TB.generate,
      types: [{ value: 'torque', label: 'Torque with an angle' }, { value: 'balance', label: 'Where to hang a mass' }, { value: 'support', label: 'Support forces' }, { value: 'alpha', label: 'Angular acceleration' }, { value: 'inertia', label: 'Rotational inertia race' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { torque: 'Torque with an angle', balance: 'Balance the stick', support: 'Two supports', alpha: 'Released from rest', inertia: 'Rotational inertia race' }[p.type]; },
      extra: function(host, p){ host.innerHTML = figure(p); }
    });
  }

  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApPhysBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; sc.onerror = boot; document.head.appendChild(sc);
  }
})();
