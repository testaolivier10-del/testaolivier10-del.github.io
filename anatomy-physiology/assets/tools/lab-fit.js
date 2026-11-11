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
      if(got.length < cap) out = out.concat(got);
    });
    return out;
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
  window.AnpLabFit = { eraseLeaders: eraseLeaders, inkBox: inkBox };
})();
