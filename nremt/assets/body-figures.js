/* Loader for the rendered body figures (scripts/build-body-figures.mjs).

     LevlBodyFigs.load('body', function(F){ ... F.figs['adult-front'] ... });
     LevlBodyFigs.load('chest', cb)

   The data files (body-figs/body.js, body-figs/chest.js) are fetched on first
   use, so a page pays for them only when the figure is actually shown. Each
   figure: { src, w, h, outline, hitOutline, regions, anchors, lines, landmarks },
   in the image's own pixels; F.url(fig) is the image URL.

   The figures are derived from BodyParts3D, (c) 2008 Life Science Integrated
   Database Center, CC BY-SA 2.1 Japan; pages showing them credit it. */
(function(){
  'use strict';
  if(window.LevlBodyFigs && window.LevlBodyFigs.load) return;
  var s = document.currentScript;
  var base = s && s.src ? s.src.replace(/[^\/]*$/, '') : 'assets/';
  var F = { figs:{}, base: base, credit:'', sets:{}, waiting:{} };
  F.url = function(fig){ return base + fig.src; };
  F.add = function(d){
    for(var k in d.figs) F.figs[k] = d.figs[k];
    F.credit = d.credit;
  };
  F.load = function(set, cb){
    if(F.sets[set] === 'done'){ cb(F); return; }
    (F.waiting[set] = F.waiting[set] || []).push(cb);
    if(F.sets[set]) return;
    F.sets[set] = 'loading';
    var t = document.createElement('script');
    t.src = base + 'body-figs/' + set + '.js';
    t.onload = function(){ F.sets[set] = 'done'; var w = F.waiting[set]; F.waiting[set] = []; w.forEach(function(f){ f(F); }); };
    t.onerror = function(){ F.sets[set] = null; var w = F.waiting[set]; F.waiting[set] = []; w.forEach(function(f){ f(null); }); };
    document.head.appendChild(t);
  };
  window.LevlBodyFigs = F;
})();
