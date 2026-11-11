/* LevlPrep A&P lab practical: figure helpers that read the figure's own pixels
   (tool review 2026-11), loaded on first use by lab-practical.js.
     eraseLeaders(root)  paints out the leader lines of labels covered for a later topic
     inkBox(src, cb)     the drawn extent of a figure, as fractions, for fitting a tall figure to the width */
(function(){
  'use strict';
  /* Leader lines of covered labels (tool review 2026-11). A label covered
     because it names a later topic left its printed leader line pointing at
     a white box. From the figure's own pixels, each line is followed from the
     cover's edge across the white background (dark, grey, thin pixels with
     white around them) and painted white; it stops where the line meets the
     drawing, so at most a short stub stays on the structure. Worked out once
     per figure and cover set. */
  var LEAD = {};
  function eraseLeaders(root){
    [].forEach.call(root.querySelectorAll('canvas.lp-lines'), function(cv){
      var src = cv.getAttribute('data-src'), key = src + '|' + cv.getAttribute('data-boxes');
      function draw(px){
        var g = cv.getContext('2d'); g.fillStyle = '#fff';
        for(var i = 0; i < px.length; i += 2) g.fillRect(px[i] - 2, px[i + 1] - 2, 4, 4);
      }
      if(LEAD[key]){ if(LEAD[key].px) draw(LEAD[key].px); else LEAD[key].wait.push(draw); return; }
      LEAD[key] = { wait: [draw] };
      var img = new Image();
      img.onload = function(){
        var px = [];
        try{ px = traceLeaders(img, +cv.width, +cv.height, cv.getAttribute('data-boxes').split(';').map(function(b){ return b.split(',').map(Number); })); }catch(e){ px = []; }
        LEAD[key].px = px;
        LEAD[key].wait.forEach(function(fn){ fn(px); });
        LEAD[key].wait = [];
      };
      img.src = src;
    });
  }
  function traceLeaders(img, W, H, boxes){
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'); g.drawImage(img, 0, 0, W, H);
    var d = g.getImageData(0, 0, W, H).data, n = W * H;
    var white = new Uint8Array(n), ink = new Uint8Array(n);
    for(var i = 0; i < n; i++){
      var r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      if(mn > 232) white[i] = 1;
      else if(mx - mn < 40) ink[i] = 1;     // a grey or black line pixel, its soft edge too
    }
    // white share in a 7 x 7 window, from a summed-area table
    var sat = new Int32Array((W + 1) * (H + 1));
    for(var y = 0; y < H; y++){ var row = 0; for(var x = 0; x < W; x++){ row += white[y * W + x]; sat[(y + 1) * (W + 1) + x + 1] = sat[y * (W + 1) + x + 1] + row; } }
    function wshare(x, y){
      var x0 = Math.max(0, x - 3), y0 = Math.max(0, y - 3), x1 = Math.min(W, x + 4), y1 = Math.min(H, y + 4);
      var s = sat[y1 * (W + 1) + x1] - sat[y0 * (W + 1) + x1] - sat[y1 * (W + 1) + x0] + sat[y0 * (W + 1) + x0];
      return s / ((x1 - x0) * (y1 - y0));
    }
    function inBox(x, y){ for(var k = 0; k < boxes.length; k++){ var b = boxes[k]; if(x >= b[0] - 1 && x < b[0] + b[2] + 1 && y >= b[1] - 1 && y < b[1] + b[3] + 1) return true; } return false; }
    var seen = new Uint8Array(n), out = [];
    boxes.forEach(function(b){
      // seeds: line pixels within 12 px of the cover's left or right edge, at its height
      var seeds = [];
      for(var y = Math.max(0, b[1] - 2); y < Math.min(H, b[1] + b[3] + 2); y++){
        for(var dx = 1; dx <= 12; dx++){
          [b[0] - dx, b[0] + b[2] - 1 + dx].forEach(function(x){ if(x >= 0 && x < W && ink[y * W + x] && !inBox(x, y) && wshare(x, y) > 0.55) seeds.push(y * W + x); });
        }
      }
      var stack = seeds.slice(), got = [], cap = 6000;
      seeds.forEach(function(p){ seen[p] = 1; });
      while(stack.length && got.length < cap){
        var p = stack.pop(), px = p % W, py = (p - px) / W;
        got.push(px, py);
        for(var oy = -1; oy <= 1; oy++) for(var ox = -1; ox <= 1; ox++){
          var qx = px + ox, qy = py + oy;
          if(qx < 0 || qy < 0 || qx >= W || qy >= H) continue;
          var q = qy * W + qx;
          if(seen[q] || !ink[q] || inBox(qx, qy)) continue;
          seen[q] = 1;
          if(wshare(qx, qy) > 0.55) stack.push(q);
        }
      }
      // a run that big is not a leader line (it reached text or the drawing): leave it
      // Pass 3: nor is a straight upright run that passes the label's side, above and below it (a drawing's
      // outline, as the elbow's skin beside "Tendon of triceps muscle"): a leader line leaves its label
      var side = alongSide(got, b);
      if(got.length < cap && !side) out = out.concat(got);
      /* Pass 3: the flood stops where white thins out (beside the drawing, or where it leaked along an
         outline and was dropped), which left stubs and whole lines on the white. From the line's first
         stretch its direction is read and the line is followed straight on in a narrow corridor, re-aiming
         along its own centre; it is painted out only where no other stroke comes within 7 px, so an outline
         it crosses keeps every pixel; the walk steps over the crossing and stops at the drawing's colour or
         where the line ends or bends. */
      if(seeds.length && !side) out = out.concat(corridor(seeds, b));
    });
    return out;
    function alongSide(g, b){
      // a near-upright straight run that passes the label, reaching above its top and below its foot
      var n = g.length / 2; if(n < 20) return false;
      var ylo = 1e9, yhi = -1e9; for(var j = 1; j < g.length; j += 2){ if(g[j] < ylo) ylo = g[j]; if(g[j] > yhi) yhi = g[j]; }
      if(!(ylo < b[1] - 4 && yhi > b[1] + b[3] + 4)) return false;
      var mx = 0, my = 0, i; for(i = 0; i < g.length; i += 2){ mx += g[i]; my += g[i + 1]; } mx /= n; my /= n;
      var sxx = 0, syy = 0, sxy = 0; for(i = 0; i < g.length; i += 2){ var a = g[i] - mx, c = g[i + 1] - my; sxx += a * a; syy += c * c; sxy += a * c; }
      var ang = 0.5 * Math.atan2(2 * sxy, sxx - syy), l1 = (sxx + syy) / 2 + Math.sqrt(Math.pow((sxx - syy) / 2, 2) + sxy * sxy), l2 = sxx + syy - l1;
      return l1 > 0 && l2 / l1 < 0.05 && Math.abs(Math.cos(ang)) < 0.35;
    }
    function isInk(x, y){ return x >= 0 && y >= 0 && x < W && y < H && ink[y * W + x] === 1; }
    function isColour(x, y){ if(x < 0 || y < 0 || x >= W || y >= H) return true; var i = y * W + x; return !ink[i] && !white[i]; }
    function corridor(seeds, b){
      // the line's first stretch: a flood from the seeds over line pixels on white, at most 50 steps out
      var depth = {}, st = [], pts = [];
      seeds.forEach(function(p){ depth[p] = 0; st.push(p); });
      for(var h = 0; h < st.length; h++){
        var p = st[h], px = p % W, py = (p - px) / W;
        pts.push([px, py]);
        if(depth[p] >= 50) continue;
        for(var oy = -1; oy <= 1; oy++) for(var ox = -1; ox <= 1; ox++){
          var qx = px + ox, qy = py + oy, q = qy * W + qx;
          if(depth[q] != null || !isInk(qx, qy) || inBox(qx, qy) || wshare(qx, qy) <= 0.55) continue;
          depth[q] = depth[p] + 1; st.push(q);
        }
      }
      var x0 = 0, y0 = 0; seeds.forEach(function(p){ x0 += p % W; y0 += (p - p % W) / W; }); x0 /= seeds.length; y0 /= seeds.length;
      // each branch leaving the label (one line, or two that fork at the label): a peak of directions
      var bins = [], NB = 36, k, sm = [], res = [], bcx = b[0] + b[2] / 2;
      for(k = 0; k < NB; k++) bins.push([]);
      pts.forEach(function(q){ var dx = q[0] - x0, dy = q[1] - y0, r = Math.sqrt(dx * dx + dy * dy); if(r < 14 || r > 52) return; bins[Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * NB) % NB].push([dx / r, dy / r]); });
      for(k = 0; k < NB; k++) sm.push(bins[(k + NB - 1) % NB].length + bins[k].length + bins[(k + 1) % NB].length);
      for(k = 0; k < NB; k++){
        var c = sm[k];
        if(c < 8 || c < sm[(k + NB - 1) % NB] || c < sm[(k + 1) % NB] || (c === sm[(k + 1) % NB] && k < NB - 1)) continue;
        var vx = 0, vy = 0; [k - 1, k, k + 1].forEach(function(j){ bins[(j + NB) % NB].forEach(function(u){ vx += u[0]; vy += u[1]; }); });
        var n = Math.sqrt(vx * vx + vy * vy); if(!n) continue; vx /= n; vy /= n;
        if((x0 - bcx) * vx < 0 && Math.abs(vx) > 0.5) continue;   // back into the label
        res = res.concat(walk(x0 + vx * 14, y0 + vy * 14, vx, vy));
      }
      return res;
    }
    function walk(ox0, oy0, dx, dy, level){
      level = level || 0;
      var nx = -dy, ny = dx, res = [], miss = 0, painted = 0, run = 0, cen = [], steps = [], pm = 0, why = '', endx = ox0, endy = oy0;
      for(var t = 0; t < 1400; t++){
        var cx = ox0 + dx * t, cy = oy0 + dy * t;
        if(cx < 0 || cy < 0 || cx >= W || cy >= H || inBox(Math.round(cx), Math.round(cy))){ why = 'out'; break; }
        var near = [], wide = false, col = false;
        for(var sx = -7; sx <= 7; sx++){
          var qx = Math.round(cx + nx * sx), qy = Math.round(cy + ny * sx);
          if(Math.abs(sx) <= 3 && isColour(qx, qy)) col = true;
          if(!isInk(qx, qy)) continue;
          var off = Math.abs(sx - pm);
          if(off <= 2.5) near.push([qx, qy, sx]);
          else if(off >= 4) wide = true;               // ink clear of the line's own width: another stroke is close
        }
        if(col){ why = 'colour'; break; }              // the drawing's colour: stop before it
        if(!near.length){ if(++miss > 3){ why = 'end'; break; } steps.push(null); continue; }
        miss = 0;
        steps.push({ near: near, wide: wide });
        if(wide){ if(++run > 90){ why = 'cross'; break; } continue; }   // keep going over a crossing stroke
        run = 0;
        var ms = 0, mw = 0; near.forEach(function(q){ var w = Math.abs(q[2] - pm) <= 1.6 ? 1 : 0.2; ms += q[2] * w; mw += w; }); ms /= mw; painted++;
        var ex = cx + nx * ms, ey = cy + ny * ms;
        cen.push([ex, ey]); endx = ex; endy = ey;
        // follow the line: re-aim along the last stretch of its own centre
        if(cen.length >= 18 && cen.length % 6 === 0){
          var a0 = cen[cen.length - 18], ax = ex - a0[0], ay = ey - a0[1], al = Math.sqrt(ax * ax + ay * ay);
          if(al > 8){ dx = 0.5 * dx + 0.5 * ax / al; dy = 0.5 * dy + 0.5 * ay / al; var dl = Math.sqrt(dx * dx + dy * dy); dx /= dl; dy /= dl; nx = -dy; ny = dx; ox0 = ex - dx * t; oy0 = ey - dy * t; pm = 0; }
        } else pm = Math.max(-1, Math.min(1, ms));
        if(painted > 1200) break;
      }
      /* A bend (a leader often runs level from its label, then turns, or forks, toward its structure): from
         where the line ended, rays are tried from 60 degrees one side to 60 the other; a ray that runs on a
         thin dark line for 30 px is followed. What a bend finds is kept only if it ends on the drawing's
         colour, as a leader line does, so an outline is never taken for a line. */
      if(why === 'end' && level < 2 && painted > 4){
        var base = Math.atan2(dy, dx), score = [], A = [];
        for(var a = -60; a <= 60; a += 3){
          var th = base + a * Math.PI / 180, ux = Math.cos(th), uy = Math.sin(th), hit = 0, bad = false;
          for(var r = 3; r <= 32; r++){
            var rx = Math.round(endx + ux * r), ry = Math.round(endy + uy * r);
            if(isColour(rx, ry) || inBox(rx, ry)){ bad = true; break; }
            if(isInk(rx, ry) || isInk(Math.round(rx - uy), Math.round(ry + ux)) || isInk(Math.round(rx + uy), Math.round(ry - ux))) hit++;
          }
          A.push(th); score.push(bad ? 0 : hit);
        }
        for(var i = 0; i < score.length; i++){
          if(score[i] < 27 || (i && score[i - 1] > score[i]) || (i < score.length - 1 && score[i + 1] >= score[i]) || Math.abs(A[i] - base) < 0.06) continue;
          var w = walk(endx + Math.cos(A[i]) * 4, endy + Math.sin(A[i]) * 4, Math.cos(A[i]), Math.sin(A[i]), level + 1);
          if(w.ok) res = res.concat(w);
        }
      }
      // painted only where no other stroke comes within 7 px for 5 steps either side
      steps.forEach(function(st, i){
        if(!st) return;
        for(var j = Math.max(0, i - 5); j <= Math.min(steps.length - 1, i + 5); j++) if(steps[j] && steps[j].wide) return;
        st.near.forEach(function(q){ res.push(q[0], q[1]); });
      });
      if(level) res.ok = why === 'colour' && painted > 10;
      return res;
    }
  }
  var INK = {};
  function inkBox(src, cb){
    // the figure's drawn extent (non-white pixels) as fractions of its size, once per figure
    if(INK[src]){ if(INK[src].box) cb(INK[src].box); else INK[src].wait.push(cb); return; }
    INK[src] = { wait: [cb] };
    var img = new Image();
    img.onload = function(){
      var box = [0, 0, 1, 1];
      try{
        var w = 400, h = Math.max(1, Math.round(400 * img.naturalHeight / img.naturalWidth)), c = document.createElement('canvas'); c.width = w; c.height = h;
        var g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
        var d = g.getImageData(0, 0, w, h).data, x0 = w, y0 = h, x1 = -1, y1 = -1;
        for(var y = 0; y < h; y++) for(var x = 0; x < w; x++){ var i = (y * w + x) * 4; if(Math.min(d[i], d[i + 1], d[i + 2]) < 225){ if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; } }
        if(x1 > x0 && y1 > y0) box = [Math.max(0, x0 / w - 0.015), Math.max(0, y0 / h - 0.015), Math.min(1, (x1 + 1) / w + 0.015), Math.min(1, (y1 + 1) / h + 0.015)];
      }catch(e){}
      INK[src].box = box; INK[src].wait.forEach(function(fn){ fn(box); }); INK[src].wait = [];
    };
    img.src = src;
  }
  /* Scene plates (pass 2, 2026-11-10): a covered label takes the colour of the drawing around it, so a
     hidden word reads as background, not as a blank white box: the most common colour on a thin ring just
     outside the cover. */
  function blendCovers(img, plate){
    if(!img) return;
    function run(){
      try{
        var W = plate.w, H = plate.h, c = document.createElement('canvas');
        c.width = W; c.height = H;
        var x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(img, 0, 0, W, H);
        var spans = img.closest('.scn-pic').querySelectorAll('.scn-cover');
        plate.covered.forEach(function(b, k){
          if(!spans[k]) return;
          var x0 = Math.max(0, Math.floor(b[0]) - 4), y0 = Math.max(0, Math.floor(b[1]) - 4);
          var x1 = Math.min(W, Math.ceil(b[0] + b[2]) + 4), y1 = Math.min(H, Math.ceil(b[1] + b[3]) + 4);
          if(x1 <= x0 || y1 <= y0) return;
          var d = x.getImageData(x0, y0, x1 - x0, y1 - y0).data, w = x1 - x0, h = y1 - y0, count = {}, best = null, bestN = 0;
          for(var yy = 0; yy < h; yy++) for(var xx = 0; xx < w; xx++){
            if(xx > 2 && xx < w - 3 && yy > 2 && yy < h - 3) continue;   // the ring only
            var i = (yy * w + xx) * 4;
            if(d[i + 3] < 128) continue;
            var key = (d[i] >> 3) + ',' + (d[i + 1] >> 3) + ',' + (d[i + 2] >> 3);
            var n = count[key] = (count[key] || 0) + 1;
            if(n > bestN){ bestN = n; best = [d[i], d[i + 1], d[i + 2]]; }
          }
          if(best) spans[k].style.background = 'rgb(' + best.join(',') + ')';
          spans[k].classList.add('is-blended');
        });
      }catch(e){}
    }
    if(img.complete && img.naturalWidth) run(); else img.addEventListener('load', run, { once: true });
  }
  /* Views (pass 3): a figure that prints two or three drawings one above the other (the heart from the
     front, then from behind) splits at the blank band between them, so Explore and Study can show one
     view at a time. A split needs a band with no ink right across the figure, at least three labels on
     each side and no label box across it. cb(null) when the figure is one view. */
  var VIEWS = {}, VCSS = '.lp-figbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 4px;} .lp-figbar .lp-zoom{margin:0;} .lp-views{display:inline-flex;gap:2px;padding:3px;border-radius:999px;background:var(--tint, #EEF2F1);} .lp-vbtn{border:0;background:transparent;font:800 13px var(--font-ui);color:var(--muted);padding:7px 14px;border-radius:999px;min-height:36px;cursor:pointer;} .lp-vbtn[aria-pressed="true"]{background:var(--white, #fff);color:var(--cink);box-shadow:0 1px 3px rgba(20,40,35,.15);} .lp-vbtn:focus-visible{outline:3px solid var(--accent);outline-offset:1px;} .lp-ls .lp-ls-fig .lp-figbar{flex:none;} .lp-scroll.lp-view .lp-fig{--lp-W:calc(var(--lp-z, 1) * min(100% / var(--lp-vw, 1), 76vh * var(--lp-ratio, 1) / var(--lp-vh, 1)));} .lp-ls .lp-ls-fig .lp-scroll.lp-view .lp-fig{--lp-W:calc(var(--lp-z, 1) * min(100cqw / var(--lp-vw, 1), 100cqh * var(--lp-ratio, 1) / var(--lp-vh, 1)));} .lp-scroll.lp-view .lp-fig,.lp-ls .lp-ls-fig .lp-scroll.lp-view.lp-view .lp-fig{width:var(--lp-W);max-width:none;flex:none; margin:calc(-1 * var(--lp-vy, 0) * var(--lp-W) / var(--lp-ratio, 1)) calc(-1 * (1 - var(--lp-vx, 0) - var(--lp-vw, 1)) * var(--lp-W)) calc(-1 * (1 - var(--lp-vy, 0) - var(--lp-vh, 1)) * var(--lp-W) / var(--lp-ratio, 1)) calc(-1 * var(--lp-vx, 0) * var(--lp-W)); clip-path:inset(calc(var(--lp-vy, 0) * 100%) calc((1 - var(--lp-vx, 0) - var(--lp-vw, 1)) * 100%) calc((1 - var(--lp-vy, 0) - var(--lp-vh, 1)) * 100%) calc(var(--lp-vx, 0) * 100%));} .lp-ls .lp-ls-fig .lp-scroll.lp-view{overflow:hidden;} .lp-ls .lp-ls-fig .lp-scroll.lp-view.is-zoomed{overflow:auto;} .lp-box[data-off]{pointer-events:none;}';
  function views(src, fig, boxes, cb){
    if(!document.getElementById('lp-view-css')){ var st = document.createElement('style'); st.id = 'lp-view-css'; st.textContent = VCSS; document.head.appendChild(st); }
    if(!fig || fig.h / fig.w < 0.8){ cb(null); return; }
    if(VIEWS[src]){ if(VIEWS[src].done) cb(VIEWS[src].v); else VIEWS[src].wait.push(cb); return; }
    VIEWS[src] = { wait: [cb] };
    var img = new Image();
    img.onload = function(){
      var out = null;
      try{
        var w = 400, h = Math.max(1, Math.round(400 * img.naturalHeight / img.naturalWidth)), c = document.createElement('canvas'); c.width = w; c.height = h;
        var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
        var d = g.getImageData(0, 0, w, h).data, ink = [];
        for(var y = 0; y < h; y++){ var n = 0; for(var x = 0; x < w; x++){ var i = (y * w + x) * 4; if(Math.min(d[i], d[i + 1], d[i + 2]) < 225) n++; } ink.push(n); }
        var top = 0, bot = h - 1;
        while(top < h && !ink[top]) top++;
        while(bot > 0 && !ink[bot]) bot--;
        var runs = [];
        for(y = top; y <= bot; y++){
          if(ink[y] > 1) continue;
          var s0 = y; while(y <= bot && ink[y] <= 1) y++;
          if(y - s0 >= Math.max(4, 0.012 * h)) runs.push({ c: (s0 + y) / 2 / h, n: y - s0 });
        }
        var cy = boxes.map(function(b){ return (b[1] + b[3] / 2) / fig.h; });
        var across = function(t){ return boxes.some(function(b){ return b[1] / fig.h < t && (b[1] + b[3]) / fig.h > t; }); };
        var cut = function(a, b){
          var best = null;
          runs.forEach(function(r){
            if(r.c < a + 0.25 * (b - a) || r.c > b - 0.25 * (b - a) || across(r.c)) return;
            var up = cy.filter(function(v){ return v >= a && v < r.c; }).length, dn = cy.filter(function(v){ return v >= r.c && v < b; }).length;
            if(up < 3 || dn < 3) return;
            if(!best || r.n > best.n) best = r;
          });
          return best;
        };
        var parts = [[0, 1]], again = true;
        while(again && parts.length < 3){
          again = false;
          for(var k = 0; k < parts.length && parts.length < 3; k++){
            var p = parts[k];
            if((p[1] - p[0]) * fig.h / fig.w < 0.8) continue;
            var r = cut(p[0], p[1]);
            if(r){ parts.splice(k, 1, [p[0], r.c], [r.c, p[1]]); again = true; break; }
          }
        }
        out = parts.length > 1 ? parts : null;
      }catch(e){ out = null; }
      VIEWS[src].v = out; VIEWS[src].done = true;
      VIEWS[src].wait.forEach(function(fn){ fn(out); }); VIEWS[src].wait = [];
    };
    img.onerror = function(){ VIEWS[src].done = true; VIEWS[src].v = null; VIEWS[src].wait.forEach(function(fn){ fn(null); }); VIEWS[src].wait = []; };
    img.src = src;
  }
  // one view of a station: its band, and its labels' and covers' columns, so the printed words reach the stage's edges
  function viewOf(st, VW, k){
    var y0 = VW[k][0], y1 = VW[k][1], f = st.fig, x0 = 1, x1 = 0;
    st.labels.concat(st.covered || []).forEach(function(l){ var b = l.box, cy = (b[1] + b[3] / 2) / f.h; if(cy >= y0 && cy < y1){ x0 = Math.min(x0, b[0] / f.w); x1 = Math.max(x1, (b[0] + b[2]) / f.w); } });
    x0 = Math.max(0, x0 - 0.02); x1 = Math.min(1, x1 + 0.02);
    if(x1 - x0 < 0.5){ x0 = 0; x1 = 1; }
    return { k: k, n: VW.length, y0: y0, y1: y1, x0: x0, x1: x1 };
  }
  function viewBar(vw){
    var N = vw.n === 2 ? ['Upper view', 'Lower view'] : ['Upper view', 'Middle view', 'Lower view'];
    return '<div class="lp-views kt-seg" role="group" aria-label="Which view of the figure">' + N.map(function(nm, i){
      return '<button type="button" class="lp-vbtn" data-v="' + i + '" aria-pressed="' + (i === vw.k ? 'true' : 'false') + '">' + nm + '</button>'; }).join('') + '</div>';
  }
  function cyOf(b, f){ return (b[1] + b[3] / 2) / f.h; }
  function off(vw, b, f){ var c = cyOf(b, f); return c < vw.y0 || c >= vw.y1; }
  function viewAt(VW, b, f){ var c = cyOf(b, f), k = 0; VW.forEach(function(r, i){ if(c >= r[0] && c < r[1]) k = i; }); return k; }
  function viewAttr(vw){ return ' lp-view" style="--lp-vy:' + vw.y0.toFixed(4) + ';--lp-vh:' + (vw.y1 - vw.y0).toFixed(4) + ';--lp-vx:' + vw.x0.toFixed(4) + ';--lp-vw:' + (vw.x1 - vw.x0).toFixed(4) + '"'; }
  window.AnpLabFit = { eraseLeaders: eraseLeaders, inkBox: inkBox, blendCovers: blendCovers, views: views, viewOf: viewOf, viewBar: viewBar, off: off, viewAt: viewAt, viewAttr: viewAttr };
})();
