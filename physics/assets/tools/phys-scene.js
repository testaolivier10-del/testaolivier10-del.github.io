/* AP® Physics 1 scene helpers: window.ApPhysScene (docs/apphys-architecture.md,
   "Tools", "Scene helpers"). Shared drawing for the trainers so every force
   arrow, velocity vector and animated cart looks and behaves the same:

     ApPhysScene.svg(w, h, label, inner?)    an <svg> string, viewBox 0 0 w h,
                                            role="img" and aria-label (20+ characters)
     ApPhysScene.el(tag, attrs, parent?)     an SVG element (for live redraws)
     ApPhysScene.arrow(x, y, dx, dy, o?)     an arrow from (x, y) to (x+dx, y+dy)
                                            as an SVG string: o.cls ("f-grav",
                                            "f-normal", "f-tension", "f-friction",
                                            "f-spring", "f-applied", "f-buoy",
                                            "vel", "acc", "net"), o.label (text at
                                            the tip, e.g. "F_g"), o.width, o.dashed,
                                            o.head (px, default 9). A zero-length
                                            arrow draws a dot (a force of zero).
     ApPhysScene.vector(origin, v, scale, o?) arrow() from a physics vector
                                            { x, y } (y up) at scale px per unit,
                                            in SVG coordinates (y down)
     ApPhysScene.forceLabel(type, agent, on) "F_g, Earth on block": the authoring
                                            guide's FBD label convention
     ApPhysScene.loop(step, o?) -> { start(), stop(), running(), once(t) }
                                            requestAnimationFrame loop calling
                                            step(dt, t) with dt in seconds (capped
                                            at 0.05 s so a background tab does not
                                            jump). With reduced motion (the site
                                            toggle or the OS setting) start() does
                                            not animate: it calls o.still(t) (or
                                            step once with the whole o.duration)
                                            so the scene shows its end state and
                                            the controls still work.
     ApPhysScene.reduced()                  true when motion is off
     ApPhysScene.toSvg(x, y, frame)         physics coordinates (m, y up) to SVG
                                            pixels: frame = { x0, y0, ppm } with
                                            (x0, y0) the pixel of the origin

   Colours come from phys-tools.css (.phys-scene .f-grav ...), so dark mode
   and print need no code here. Pure string builders except el() and loop(),
   so node tests can call them without a DOM. */
(function(){
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function n(x){ return Math.round(x * 10) / 10; }

  function svg(w, h, label, inner){
    if(String(label || '').length < 20) throw new Error('ApPhysScene.svg: the aria-label must say what the scene shows (20+ characters)');
    return '<svg class="phys-scene" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(label) + '">' + (inner || '') + '</svg>';
  }
  function el(tag, attrs, parent){
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function(k){ e.setAttribute(k, attrs[k]); });
    if(parent) parent.appendChild(e);
    return e;
  }
  /* "F_g" -> F<tspan sub>g</tspan>: a subscript after an underscore. */
  function subText(t){
    var m = /^([^_]*)_(.+)$/.exec(String(t));
    return m ? esc(m[1]) + '<tspan class="sub" dy="4" font-size="0.75em">' + esc(m[2]) + '</tspan>' : esc(t);
  }
  function arrow(x, y, dx, dy, o){
    o = o || {};
    var cls = 'phys-arrow' + (o.cls ? ' ' + o.cls : ''), L = Math.sqrt(dx * dx + dy * dy), w = o.width || 3;
    if(L < 0.5) return '<circle class="' + cls + '" cx="' + n(x) + '" cy="' + n(y) + '" r="' + (w + 1) + '"/>';
    var hd = Math.min(o.head || 9, L * 0.6), ux = dx / L, uy = dy / L;
    var bx = x + dx - ux * hd, by = y + dy - uy * hd, px = -uy * hd * 0.55, py = ux * hd * 0.55;
    var out = '<g class="' + cls + '"><line x1="' + n(x) + '" y1="' + n(y) + '" x2="' + n(bx) + '" y2="' + n(by) + '" stroke-width="' + w + '"' + (o.dashed ? ' stroke-dasharray="6 4"' : '') + '/>' +
      '<polygon points="' + n(x + dx) + ',' + n(y + dy) + ' ' + n(bx + px) + ',' + n(by + py) + ' ' + n(bx - px) + ',' + n(by - py) + '"/>';
    if(o.label) out += '<text x="' + n(x + dx + ux * 12 + (Math.abs(uy) > 0.7 ? 8 : 0)) + '" y="' + n(y + dy + uy * 12 + 4) + '" text-anchor="' + (ux < -0.3 ? 'end' : ux > 0.3 ? 'start' : 'start') + '">' + subText(o.label) + '</text>';
    return out + '</g>';
  }
  function toSvg(x, y, f){ return { x: f.x0 + x * f.ppm, y: f.y0 - y * f.ppm }; }
  function vector(origin, v, scale, o){ return arrow(origin.x, origin.y, v.x * scale, -v.y * scale, o); }
  function forceLabel(type, agent, on){ return type + ', ' + agent + ' on ' + on; }

  function reduced(){
    try{ if(window.LevlMotion && window.LevlMotion.reduced) return !!window.LevlMotion.reduced(); return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; }
  }
  function loop(step, o){
    o = o || {};
    var raf = null, last = 0, t = 0, on = false;
    var req = window.requestAnimationFrame || function(f){ return setTimeout(function(){ f(Date.now()); }, 16); };
    var cancel = window.cancelAnimationFrame || clearTimeout;
    function frame(now){
      if(!on) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now; t += dt;
      if(step(dt, t) === false || (o.duration && t >= o.duration)){ on = false; raf = null; if(o.onEnd) o.onEnd(t); return; }
      raf = req(frame);
    }
    return {
      start: function(){
        if(on) return;
        if(reduced()){ if(o.still) o.still(o.duration || t); else step(o.duration || 0, o.duration || t); if(o.onEnd) o.onEnd(o.duration || t); return; }
        on = true; last = 0; raf = req(frame);
      },
      stop: function(){ on = false; if(raf != null) cancel(raf); raf = null; },
      reset: function(){ this.stop(); t = 0; },
      running: function(){ return on; },
      once: function(dt){ t += dt; step(dt, t); },
      time: function(){ return t; }
    };
  }

  window.ApPhysScene = { svg: svg, el: el, arrow: arrow, subText: subText, vector: vector, toSvg: toSvg, forceLabel: forceLabel, loop: loop, reduced: reduced, esc: esc };
})();
