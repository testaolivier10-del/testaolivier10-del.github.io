/* A&P scene plates (tool redesign 2026-11, docs/tool-review/done/anp-redesign.md).

   A scene is a real figure (an OpenStax drawing, or one of LevlPrep's own)
   with places on it: where each step of a pathway happens, or where each
   variable of a Predict the change scenario lives in the body. The tools draw
   on it so the picture is the idea: numbered pins where things happen, the
   route between them in order, a moving token, and a callout for the step in
   focus.

     var v = AnpScene.make(plate, { kind: 'flows' | 'causes', label: '...' });
     host.appendChild(v.el);
     v.pins([{ pt: [x, y], n: '1', state: 'ok' | 'no' | 'marked' | '' , tone: 'o2' | 'deo2' }, null, { gap: true }, { hole: true }, ...]);
     v.focus(k, 'Label') / v.focus(-1);
     v.move(fromK, toK);           // the token runs along the route

   plate: { src, srcset, w, h, alt, attribution, covered: [[x, y, w, h]] },
   all in the figure's own pixels (data/scenes.json, published by
   scripts/build-anp.mjs). A pin list is in route order: null is a step with
   no place on this figure (the route runs on past it), { hole: true } an
   empty slot (the route breaks there), { gap: true } a missing step: a dashed
   leg with "?" between its neighbours, never at its true place. */
(function(){
  'use strict';
  if(window.AnpScene) return;
  var NS = 'http://www.w3.org/2000/svg';
  var BASE = function(){ return window.ANP_BASE || '../'; };
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function plain(s){ return String(s == null ? '' : s).replace(/<[^>]+>/g, ''); }
  function el(name, attrs, text){
    var e = document.createElementNS(NS, name);
    for(var a in attrs) if(attrs.hasOwnProperty(a) && attrs[a] != null) e.setAttribute(a, attrs[a]);
    if(text != null) e.textContent = text;
    return e;
  }
  function reduced(){ try{ return window.LevlMotion ? window.LevlMotion.reduced() : window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
  var uid = 0;

  /* Covered labels (pass 2, 2026-11-10): lab-fit.js (loaded on first use) gives each cover the colour of
     the drawing around it and paints out its printed leader line. */
  function blend(img, plate){
    var pic = img && img.closest('.scn-pic');
    if(!pic) return;
    var cv = document.createElement('canvas');
    cv.className = 'lp-lines scn-lines'; cv.setAttribute('aria-hidden', 'true');
    cv.width = plate.w; cv.height = plate.h;
    cv.setAttribute('data-src', img.getAttribute('src'));
    cv.setAttribute('data-boxes', plate.covered.map(function(b){ return b.map(Math.round).join(','); }).join(';'));
    pic.insertBefore(cv, pic.querySelector('.scn-cover'));
    if(window.AnpLabFit) return go();
    var sc = document.createElement('script');
    sc.src = BASE() + 'assets/tools/lab-fit.js';
    sc.onload = go;
    document.head.appendChild(sc);
    function go(){ var F = window.AnpLabFit; if(!F) return; F.blendCovers(img, plate); F.eraseLeaders(pic); }
  }

  function make(plate, opt){
    opt = opt || {};
    var W = plate.w, H = plate.h, M = Math.max(W, H);
    var R = Math.max(11, M * 0.024), FS = R * 1.15, SW = Math.max(2, M * 0.0045);
    var pct = function(v, of){ return (100 * v / of).toFixed(3) + '%'; };
    var at = function(b){ return 'left:' + pct(b[0], W) + ';top:' + pct(b[1], H) + ';width:' + pct(b[2], W) + ';height:' + pct(b[3], H); };
    var fig = document.createElement('figure');
    fig.className = 'scn' + (opt.cls ? ' ' + opt.cls : '');
    fig.style.setProperty('--scn-r', (W / H).toFixed(4));
    var src = BASE() + plate.src;
    fig.innerHTML = '<div class="scn-pic" style="aspect-ratio:' + W + ' / ' + H + ';--scn-r:' + (W / H).toFixed(4) + '">' +
      (plate.srcset ? '<picture><source type="image/avif" srcset="' + esc(plate.srcset) + '" sizes="(max-width: 760px) 100vw, 640px"><img src="' + esc(src) + '" alt="' + esc(plate.alt) + '" width="' + W + '" height="' + H + '" decoding="async"></picture>'
        : '<img src="' + esc(src) + '" alt="' + esc(plate.alt) + '" width="' + W + '" height="' + H + '" decoding="async">') +
      (plate.covered || []).map(function(b){ return '<span class="scn-cover" aria-hidden="true" style="' + at(b) + '"></span>'; }).join('') +
      '</div>' + (plate.attribution && opt.credit !== false ? '<figcaption class="scn-cred">' + plate.attribution + '</figcaption>' : '');
    var pic = fig.querySelector('.scn-pic');
    if(plate.covered && plate.covered.length) blend(pic.querySelector('img'), plate);
    var id = 'scn' + (++uid);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'scn-ov', 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'none' });
    svg.style.setProperty('--scn-sw', SW);
    var defs = el('defs', {});
    ['', 'o2', 'deo2', 'no'].forEach(function(t){
      var m = el('marker', { id: id + '-a' + t, viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '3.4', markerHeight: '3.4', orient: 'auto-start-reverse' });
      m.appendChild(el('path', { d: 'M0 0 L10 5 L0 10 z', 'class': 'scn-ah' + (t ? ' tone-' + t : '') }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);
    var gRoute = el('g', { 'class': 'scn-route' }), gPins = el('g', { 'class': 'scn-pins' }), gTag = el('g', { 'class': 'scn-tag' }), gTok = el('g', { 'class': 'scn-tokg' });
    var gGhost = el('g', { 'class': 'scn-ghosts' });
    svg.appendChild(gGhost); svg.appendChild(gRoute); svg.appendChild(gPins); svg.appendChild(gTok); svg.appendChild(gTag);
    pic.appendChild(svg);
    var pos = [], list = [];

    /* Pins at one place sit side by side (a row, two rows past five), so
       steps that happen at the same structure are all visible and the route
       still reads in order. */
    function layout(items){
      var groups = {}, out = [];
      items.forEach(function(it, k){
        if(!it || !it.pt || it.hole) return;
        var key = Math.round(it.pt[0] / (R * 1.6)) + ':' + Math.round(it.pt[1] / (R * 1.6));
        (groups[key] = groups[key] || []).push(k);
      });
      Object.keys(groups).forEach(function(key){
        var ks = groups[key], m = ks.length, per = m > 5 ? Math.ceil(m / 2) : m;
        ks.forEach(function(k, j){
          var row = Math.floor(j / per), col = j % per, inRow = row ? m - per : per;
          var x = items[k].pt[0] + (col - (inRow - 1) / 2) * R * 2.15;
          var y = items[k].pt[1] + (m > per ? (row - 0.5) * R * 2.15 : 0);
          out[k] = [Math.max(R + 2, Math.min(W - R - 2, x)), Math.max(R + 2, Math.min(H - R - 2, y))];
        });
      });
      return out;
    }
    function leg(a, b, cls, marker){
      var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy);
      if(d < R * 2.3) return null;
      var ux = dx / d, uy = dy / d, bend = Math.min(d * 0.14, R * 2.2);
      var x1 = a[0] + ux * (R + SW), y1 = a[1] + uy * (R + SW), x2 = b[0] - ux * (R + SW * 2.5), y2 = b[1] - uy * (R + SW * 2.5);
      var cx = (x1 + x2) / 2 - uy * bend, cy = (y1 + y2) / 2 + ux * bend;
      return el('path', { d: 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1), 'class': cls, 'marker-end': marker ? 'url(#' + marker + ')' : null });
    }
    function pins(items){
      list = items.slice();
      pos = layout(items);
      while(gRoute.firstChild) gRoute.removeChild(gRoute.firstChild);
      while(gPins.firstChild) gPins.removeChild(gPins.firstChild);
      var kind = opt.kind === 'flows' ? 'flows' : 'causes';
      // the route: each placed pin to the next placed one; a gap is a dashed leg with "?"
      var last = -1;
      for(var k = 0; k < items.length && opt.route !== false; k++){
        var it = items[k];
        if(!it || it.gap) continue;        // a step with no place, or the gap: the route runs on past it
        if(it.hole){ last = -1; continue; } // an empty slot: the route breaks
        if(!pos[k]) continue;
        if(last > -1){
          var gapBetween = false;
          for(var j = last + 1; j < k; j++) if(items[j] && items[j].gap) gapBetween = true;
          var tone = it.tone ? it.tone : '';
          var p = leg(pos[last], pos[k], 'scn-leg ' + kind + (tone ? ' tone-' + tone : '') + (gapBetween ? ' is-gap' : '') + (it.state === 'no' ? ' is-no' : ''), id + '-a' + (it.state === 'no' ? 'no' : tone));
          if(p){ p.setAttribute('data-k', k); gRoute.appendChild(p); }
          if(gapBetween){
            var mx = (pos[last][0] + pos[k][0]) / 2, my = (pos[last][1] + pos[k][1]) / 2;
            var g0 = el('g', { 'class': 'scn-q' });
            g0.appendChild(el('circle', { cx: mx, cy: my, r: R * 0.9 }));
            g0.appendChild(el('text', { x: mx, y: my + FS * 0.36, 'text-anchor': 'middle', 'font-size': FS }, '?'));
            gRoute.appendChild(g0);
          }
        }
        last = k;
      }
      items.forEach(function(it, k){
        if(!it || it.gap || it.hole || !pos[k]) return;
        var g = el('g', { 'class': 'scn-pin' + (it.state ? ' is-' + it.state : '') + (it.tone ? ' tone-' + it.tone : ''), 'data-k': k });
        g.appendChild(el('circle', { cx: pos[k][0], cy: pos[k][1], r: R * 1.55, 'class': 'scn-halo' }));
        g.appendChild(el('circle', { cx: pos[k][0], cy: pos[k][1], r: R, 'class': 'scn-dot' }));
        g.appendChild(el('text', { x: pos[k][0], y: pos[k][1] + FS * 0.36, 'text-anchor': 'middle', 'font-size': FS * (String(it.n).length > 1 ? 0.86 : 1) }, it.n == null ? '' : String(it.n)));
        if(it.glyph){
          // an answer badge (Predict the change): ↑ ↓ = beside the pin
          var bx = pos[k][0] + R * 0.95, by = pos[k][1] - R * 0.95;
          g.appendChild(el('circle', { cx: bx, cy: by, r: R * 0.72, 'class': 'scn-badge b-' + it.glyphTone }));
          g.appendChild(el('text', { x: bx, y: by + FS * 0.28, 'text-anchor': 'middle', 'font-size': FS * 0.78, 'class': 'scn-badge-t' }, it.glyph));
        }
        if(it.title){ var t = el('title', {}, plain(it.title)); g.insertBefore(t, g.firstChild); }
        gPins.appendChild(g);
      });
      if(focusK > -1) focus(focusK, focusLabel);
    }
    /* Places still waiting for a step (Put in order): small open rings, so
       the student sees every stop before choosing the order. */
    function ghosts(pts){
      while(gGhost.firstChild) gGhost.removeChild(gGhost.firstChild);
      var seen = {};
      (pts || []).forEach(function(pt){
        if(!pt) return;
        var key = Math.round(pt[0]) + ':' + Math.round(pt[1]);
        if(seen[key]) return; seen[key] = 1;
        gGhost.appendChild(el('circle', { cx: pt[0], cy: pt[1], r: R * 0.55, 'class': 'scn-ghost' }));
      });
    }
    var focusK = -1, focusLabel = '';
    /* A callout for the step in focus: its words beside its pin, kept
       inside the picture. */
    function focus(k, label){
      focusK = k; focusLabel = label || '';
      [].forEach.call(gPins.querySelectorAll('.scn-pin'), function(g){ g.classList.toggle('is-focus', +g.getAttribute('data-k') === k); });
      while(gTag.firstChild) gTag.removeChild(gTag.firstChild);
      if(k < 0 || !pos[k] || !label) return;
      var text = plain(label), fs = FS * 0.98, pad = fs * 0.5;
      var t = el('text', { 'font-size': fs, x: 0, y: 0 }, text);
      var g = el('g', {});
      var bg = el('rect', { rx: fs * 0.45 });
      g.appendChild(bg); g.appendChild(t); gTag.appendChild(g);
      var tw = text.length * fs * 0.55;
      try{ if(svg.isConnected){ var m = t.getComputedTextLength(); if(m > 0) tw = m; } }catch(e){}
      var bw = tw + pad * 2, bh = fs * 1.6;
      var x = pos[k][0] - bw / 2, y = pos[k][1] - R * 1.7 - bh;
      if(y < 2) y = pos[k][1] + R * 1.7;
      x = Math.max(2, Math.min(W - bw - 2, x));
      bg.setAttribute('x', x); bg.setAttribute('y', y); bg.setAttribute('width', bw); bg.setAttribute('height', bh);
      t.setAttribute('x', x + pad); t.setAttribute('y', y + bh / 2 + fs * 0.35);
    }
    /* The token runs from pin a to pin b (or sits at b): a drop, an
       impulse, a signal. Reduced motion shows it at the end. */
    var tok = null, raf = 0;
    function move(a, b, tone){
      if(raf) cancelAnimationFrame(raf);
      if(b < 0 || !pos[b]){ if(tok){ gTok.removeChild(tok); tok = null; } return; }
      if(!tok){ tok = el('circle', { r: R * 0.62, 'class': 'scn-tok' }); gTok.appendChild(tok); }
      tok.setAttribute('class', 'scn-tok' + (tone ? ' tone-' + tone : '') + (opt.token ? ' tok-' + opt.token : ''));
      var from = a > -1 && pos[a] ? pos[a] : pos[b], to = pos[b];
      var path = gRoute.querySelector('.scn-leg[data-k="' + b + '"]');
      if(reduced() || from === to){ tok.setAttribute('cx', to[0]); tok.setAttribute('cy', to[1]); return; }
      var t0 = 0, dur = 900, len = 0;
      try{ len = path ? path.getTotalLength() : 0; }catch(e){ len = 0; }
      function frame(ts){
        if(!t0) t0 = ts;
        var f = Math.min(1, (ts - t0) / dur), e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2, x, y;
        if(path && len){ var pt = path.getPointAtLength(e * len); x = pt.x; y = pt.y; if(f >= 1){ x = to[0]; y = to[1]; } }
        else { x = from[0] + (to[0] - from[0]) * e; y = from[1] + (to[1] - from[1]) * e; }
        tok.setAttribute('cx', x); tok.setAttribute('cy', y);
        if(f < 1) raf = requestAnimationFrame(frame); else raf = 0;
      }
      raf = requestAnimationFrame(frame);
    }
    function stop(){ if(raf) cancelAnimationFrame(raf); raf = 0; }
    // the player: pins and legs after k fade (k < 0: none)
    function stage(k){
      [].forEach.call(gPins.querySelectorAll('.scn-pin'), function(g){ g.classList.toggle('is-dim', k >= 0 && +g.getAttribute('data-k') > k); });
      [].forEach.call(gRoute.querySelectorAll('.scn-leg'), function(g){ g.classList.toggle('is-dim', k >= 0 && +g.getAttribute('data-k') > k); });
    }
    return { el: fig, svg: svg, pins: pins, ghosts: ghosts, focus: focus, move: move, stop: stop, stage: stage, pos: function(k){ return pos[k]; }, R: R, w: W, h: H,
      // a free arrow between two picture points (Predict the change draws its chain with these)
      arrow: function(a, b, cls){ var p = leg(a, b, 'scn-leg causes ' + (cls || ''), id + '-a' + (cls && /tone-(o2|deo2|no)/.test(cls) ? cls.match(/tone-(o2|deo2|no)/)[1] : '')); if(p) gRoute.appendChild(p); return p; },
      clearArrows: function(){ [].forEach.call(gRoute.querySelectorAll('.scn-leg.is-free'), function(x){ x.parentNode.removeChild(x); }); } };
  }
  window.AnpScene = { make: make };
})();
