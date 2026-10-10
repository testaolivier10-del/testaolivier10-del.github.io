/* AP® Biology tools: small organism illustrations shared by the visuals
   (energy flow, population growth, Simpson's quadrat). Pure strings, no DOM.

     ApBioArt.icon(name, x, y, size, cls) -> SVG <g> of the organism named
       (case-insensitive, singular or plural), centered at x, y, about size
       units across. Its body takes the color of cls (fill: currentColor via
       .ba-b; details .ba-d use the ink color), so one species keeps one color
       wherever it is drawn. Unknown names fall back to a plain dot.
     ApBioArt.has(name) -> true if there is a drawing for that name.

   Every drawing is on a 24-unit grid centered on 0 (-12..12). Bodies are
   filled shapes with a soft outline; details are thin strokes. Silhouettes
   are distinct, so a species is never told apart by color alone. */
(function(){
  'use strict';
  function b(d){ return '<path class="ba-b" d="' + d + '"/>'; }   // body: species color
  function d(dd){ return '<path class="ba-d" d="' + dd + '"/>'; } // detail strokes
  function f(dd){ return '<path class="ba-f" d="' + dd + '"/>'; } // dark filled detail (eyes, spots)
  function w(dd){ return '<path class="ba-w" d="' + dd + '"/>'; } // light filled detail (belly, shine)
  function wing(dd){ return '<path class="ba-w wing" d="' + dd + '"/>'; } // translucent wings
  function c(x, y, r){ return 'M' + (x - r) + ' ' + y + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0'; }
  var ART = {
    /* ---- plants and producers */
    grass: function(){ return b('M-8 10C-8 2-6-4-3-10C-4-3-4 3-3 10ZM-3 10C-2 0 1-6 5-11C2-4 1 2 2 10ZM1 10C3 3 6-1 10-4C6 0 5 5 6 10Z') + d('M-10 10H10'); },
    clover: function(){ return b(c(-4.5, -3, 4.6) + c(4.5, -3, 4.6) + c(0, 4.5, 4.6)) + d('M0 1V11M-4.5-3l3 3M4.5-3l-3 3M0 4.5V1'); },
    dandelion: function(){ var s = ''; for(var i = 0; i < 16; i++){ var a = i / 16 * Math.PI * 2; s += 'M0-2L' + (Math.cos(a) * 8).toFixed(1) + ' ' + (-2 + Math.sin(a) * 8).toFixed(1); } return d('M0 1V11') + '<path class="ba-d thin" d="' + s + '"/>' + b(c(0, -2, 3.2)) + w(c(0, -2, 1.4)); },
    plantain: function(){ return b('M0 8C-9 5-11-4-6-10C-3-6-1 0 0 8ZM0 8C9 5 11-4 6-10C3-6 1 0 0 8ZM0 8C-3 0-2-8 0-11C2-8 3 0 0 8Z') + d('M0 8C-1 0-1-6 0-10M0 8C-4 3-6-3-6-9M0 8C4 3 6-3 6-9'); },
    phytoplankton: function(){ return b('M-11 0C-11-5-6-7 0-7S11-5 11 0 6 7 0 7-11 5-11 0Z') + d('M-8-4V4M-4-6V6M0-7V7M4-6V6M8-4V4') + w('M-9-1C-6-5 6-5 9-1'); },
    /* ---- trees (one leaf or fruit per species: distinct outlines) */
    oak: function(){ return b('M0 11L-1 8-3 7-6 7-5 4-8 3-9 0-7-1-8-4-6-5-6-8-3-7-2-10 0-11 2-10 3-7 6-8 6-5 8-4 7-1 9 0 8 3 5 4 6 7 3 7 1 8Z') + d('M0 11V-9M0 4L-5 0M0 4L5 0M0-2L-4-5M0-2L4-5'); },
    maple: function(){ return b('M0 11V6L-5 7-4 4-10 1-8 0-10-4-6-3-6-7-3-5-2-10 0-8 2-10 3-5 6-7 6-3 10-4 8 0 10 1 4 4 5 7 0 6Z') + d('M0 9V-7M0 3L-7-1M0 3L7-1'); },
    birch: function(){ return b('M0-11C5-8 8-3 7 2 6 7 3 10 0 11-3 10-6 7-7 2-8-3-5-8 0-11Z') + d('M0 11V-10M0 5L-5 1M0 5L5 1M0 0L-5-4M0 0L5-4M0-5L-3-8M0-5L3-8') + '<path class="ba-d thin" d="M-7 2l-1 1M7 2l1 1M-6-4l-1 0M6-4l1 0M-4 8l-1 1M4 8l1 1"/>'; },
    beech: function(){ return b('M0-11C6-9 8-3 7 3 6 8 2 11 0 11-2 11-6 8-7 3-8-3-6-9 0-11Z') + d('M0 11V-10M0 7L-6 4M0 7L6 4M0 3L-7-1M0 3L7-1M0-1L-6-5M0-1L6-5M0-5L-4-8M0-5L4-8'); },
    ash: function(){ var s = 'M0 11V-11', l = ''; [[-7, 6], [-6, 1], [-5, -4]].forEach(function(p){ l += 'M0 ' + p[1] + 'C-2 ' + (p[1] - 3) + ' ' + (p[0] - 1) + ' ' + (p[1] - 3) + ' ' + p[0] + ' ' + p[1] + 'C' + (p[0] + 1) + ' ' + (p[1] + 2) + ' -2 ' + (p[1] + 2) + ' 0 ' + p[1] + 'ZM0 ' + p[1] + 'C2 ' + (p[1] - 3) + ' ' + (-p[0] + 1) + ' ' + (p[1] - 3) + ' ' + (-p[0]) + ' ' + p[1] + 'C' + (-p[0] - 1) + ' ' + (p[1] + 2) + ' 2 ' + (p[1] + 2) + ' 0 ' + p[1] + 'Z'; }); return b(l + 'M0-12C-2-10-2-7 0-6 2-7 2-10 0-12Z') + d(s); },
    pine: function(){ return b('M0-11L-6-3H-3L-8 4H-4L-9 9H9L4 4H8L3-3H6Z') + '<path class="ba-trunk" d="M-1.5 9H1.5V12H-1.5Z"/>' + d('M-3-3H3M-4 4H4'); },
    cherry: function(){ return d('M-4 1C-3-5 0-9 2-11M5 2C4-4 3-8 2-11') + b(c(-4.5, 5, 4.6) + c(5, 6, 4.6)) + w('M-6.5 3a1.6 1.2 0 1 0 1 0ZM3 4a1.6 1.2 0 1 0 1 0Z') + '<path class="ba-leaf" d="M2-11C6-12 10-10 11-7 7-6 4-8 2-11Z"/>'; },
    mushroom: function(){ return b('M-11 0C-11-7-6-10 0-10S11-7 11 0Z') + '<path class="ba-stem" d="M-3 0H3L4 10H-4Z"/>' + w(c(-5, -5, 1.6) + c(2, -7, 1.4) + c(6, -3, 1.3)) + d('M-11 0H11'); },
    sun: function(){ var r = ''; for(var i = 0; i < 12; i++){ var a = i / 12 * Math.PI * 2; r += 'M' + (Math.cos(a) * 8).toFixed(1) + ' ' + (Math.sin(a) * 8).toFixed(1) + 'L' + (Math.cos(a) * 11.5).toFixed(1) + ' ' + (Math.sin(a) * 11.5).toFixed(1); } return '<path class="ba-ray" d="' + r + '"/>' + b(c(0, 0, 6.5)); },
    /* ---- invertebrates */
    grasshopper: function(){ return b('M-11 1C-11-2-8-3-4-3H5C8-3 10-1 10 1S8 3 6 3H-6C-9 3-11 3-11 1ZM-2-2L4-9 8-8 2-1Z') + d('M4-9L1 6M-4 3L-6 9M0 3L1 9M9-2C11-6 12-8 11-11M9-2C12-5 13-6 12-9') + f(c(7.6, -0.4, 1.2)); },
    ladybug: function(){ return b('M-9 2C-9-5-5-9 0-9S9-5 9 2C9 7 5 10 0 10S-9 7-9 2Z') + '<path class="ba-head" d="M-5-8C-4-11 4-11 5-8C3-9-3-9-5-8Z"/>' + d('M0-9V10M-9 2H-11M9 2H11M-8-3L-10-5M8-3L10-5M-7 7L-9 9M7 7L9 9') + f(c(-4.5, -2, 1.8) + c(4.5, -2, 1.8) + c(-4, 5, 1.8) + c(4, 5, 1.8) + c(0, -6.4, 1.4)); },
    leafhopper: function(){ return b('M0-10C3-10 5-8 5-5L3 10H-3L-5-5C-5-8-3-10 0-10Z') + wing('M0-6L3 9H0Z') + d('M0-6V10M-5-5H5M-4 0L-8 3M4 0L8 3M-3-3L-7-4M3-3L7-4') + f(c(-2.5, -8, 1) + c(2.5, -8, 1)); },
    hoverfly: function(){ return wing('M-1-2C-6-9-11-8-11-4-11-1-5 0-1-1ZM1-2C6-9 11-8 11-4 11-1 5 0 1-1Z') + b('M0-8C2-8 3-6 3-4V6C3 9 1 11 0 11S-3 9-3 6V-4C-3-6-2-8 0-8Z') + f('M-3 0H3V2H-3ZM-3 4H3V6H-3Z' + c(0, -8, 2.4)) + d('M-11-4C-7-4-4-3-1-2M11-4C7-4 4-3 1-2'); },
    bee: function(){ return wing('M-2-3C-8-10-12-7-11-3-10 0-5 0-2-2ZM2-3C8-10 12-7 11-3 10 0 5 0 2-2Z') + b('M0-6C4-6 6-2 6 3S3 11 0 11-6 8-6 3-4-6 0-6Z') + f('M-6 1H6V3.5H-6ZM-5 6H5V8.5H-5Z' + c(0, -7.5, 3)) + d('M-1-10L-3-12M1-10L3-12M0 11V12.5'); },
    beetle: function(){ return b('M0-6C5-6 8-3 8 3 8 8 4 11 0 11S-8 8-8 3-5-6 0-6Z') + '<path class="ba-head" d="M-4-6C-4-10 4-10 4-6Z"/>' + d('M0-6V11M-8 0L-11-2M8 0L11-2M-8 4L-11 5M8 4L11 5M-6 9L-9 11M6 9L9 11M-2-9L-5-12M2-9L5-12') + w('M-5-3C-4-4-3-4-2-3'); },
    aphid: function(){ return b('M0-4C5-4 7 2 7 5 7 9 3 11 0 11S-7 9-7 5-5-4 0-4Z') + '<path class="ba-head" d="M-3-4C-3-8 3-8 3-4Z"/>' + d('M-1-7C-4-10-7-11-9-11M1-7C4-10 7-11 9-11M-6 2L-10 0M6 2L10 0M-6 6L-10 7M6 6L10 7M-4 10L-7 12M4 10L7 12M-3 9V12M3 9V12') + f(c(-1.4, -6, 0.8) + c(1.4, -6, 0.8)); },
    snail: function(){ return b('M-11 8C-11 6-9 5-6 5H7C9 5 10 3 10 1L12-3 11 2C11 6 9 9 5 9H-9C-10 9-11 9-11 8Z') + '<path class="ba-shell" d="M-6 5C-9 1-8-6-2-8 4-10 9-5 7 1 6 4 3 5 1 4-2 3-3-1-1-3 1-4 3-3 3-1"/>' + d('M10 1L12-5M10 2L13-2'); },
    midge: function(){ return b('M-9-6C-11-2-10 4-6 7-2 10 4 10 8 7L9 9 10 5C7 7 3 8-1 6-5 4-7-1-6-6Z') + d('M-8-2L-7-3M-7 2L-6 1M-5 5L-4 4M-1 7V6M3 8V7M6 7L6 6') + f(c(-8, -6, 1.4)); },
    mayfly: function(){ return b('M0-9C2-9 3-7 3-5V4C3 6 1 7 0 7S-3 6-3 4V-5C-3-7-2-9 0-9Z') + wing('M-3-2C-7-3-8 0-6 1L-3 1ZM3-2C7-3 8 0 6 1L3 1Z') + d('M0 7L-4 12M0 7V12M0 7L4 12M-3-5L-8-7M3-5L8-7M-3 2L-8 4M3 2L8 4M-1-9L-3-12M1-9L3-12') + f(c(-1.4, -7, 0.8) + c(1.4, -7, 0.8)); },
    mite: function(){ return d('M-5-2L-11-6M-6 1L-12 0M-6 4L-11 7M-4 6L-8 11M5-2L11-6M6 1L12 0M6 4L11 7M4 6L8 11') + b('M0-7C6-7 8-2 8 2 8 7 4 9 0 9S-8 7-8 2-6-7 0-7Z') + f(c(-2, -4, 1) + c(2, -4, 1)) + w('M-4-3C-2-5 2-5 4-3'); },
    worm: function(){ return b('M-11 3C-9-3-5-4-2 0S4 4 7-1C8-3 10-3 11-2 12 0 10 3 8 4 4 8-1 5-3 2S-8 0-9 4C-10 6-12 5-11 3Z') + d('M-7-1L-6 1M-3-1L-4 1M1 4L2 2M5 3L5 1') + w('M9-1a1 1 0 1 0 .1 0Z'); },
    leech: function(){ return b('M-11 5C-11 0-7-2-2-2 4-2 8-4 11-2 12 0 10 3 6 4 0 7-6 8-9 8-11 8-11 6-11 5Z') + d('M-6-1V7M-2-2V6M2-2V5M6-3V4') + f(c(-9, 5, 1.6)); },
    copepod: function(){ return b('M0-9C4-9 5-5 5-1 5 4 3 7 0 7S-5 4-5-1-4-9 0-9Z') + d('M-4-6C-8-6-11-3-12 1M4-6C8-6 11-3 12 1M0 7V11M0 11L-3 12M0 11L3 12M-5 0H-2M5 0H2M-5 3H-2M5 3H2') + f(c(0, -6, 1.4)); },
    /* ---- vertebrates */
    lancelet: function(){ return b('M-12 0C-9-3-2-3 4-2L12 0 4 2C-2 3-9 3-12 0Z') + d('M-8-1.6V1.6M-5-2V2M-2-2.2V2.2M1-2V2M4-1.8V1.8M-12 0H11'); },
    lamprey: function(){ return b('M-11 0C-11-3-8-4-4-3L6-2C9-2 12-1 12 1 12 3 9 3 6 3L-4 3C-8 4-11 3-11 0Z') + w(c(-10, 0, 2)) + f(c(-6.6, -1, .8) + 'M-4 0.5h.9v.9h-.9zM-2.4 0.5h.9v.9h-.9zM-.8 0.5h.9v.9h-.9z'); },
    shark: function(){ return b('M-12 1C-6-3 2-4 8-2L12-6 11 0 12 5 8 2C2 4-6 4-12 1ZM-2-3L1-9 4-3ZM-2 3L0 7 2 3Z') + w('M-11 1.4C-6 3 0 3 6 2') + d('M-6-1V1.6M-5-1.2V1.8M-4-1.3V1.9') + f(c(-8, -0.4, .9)); },
    lizard: function(){ return b('M-12 4C-9 2-6 1-3 1H4C7 1 9-1 12-1 11 1 9 3 6 3H-3C-6 3-9 4-12 4ZM-1 1L-4-3M-1 3L-4 7M3 1L5-3M3 3L5 7') + d('M-1 1L-4-3-5-3M-1 3L-4 7-5 7M3 1L5-3 6-3M3 3L5 7 6 7') + f(c(9.6, -0.4, .7)); },
    mouse: function(){ return b('M-7 6C-10 6-10 0-6-2-2-4 4-4 7-1L10 1C11 2 10 4 8 4 7 6 5 6 3 6Z' + c(1, -4, 3)) + w(c(1, -4, 1.6)) + d('M-9 4C-11 4-12 6-12 9M10 1L12 0M10 2L12 2') + f(c(7.4, -0.4, .8) + c(10.4, 1.2, .7)); },
    kangaroo: function(){ return b('M-2-6C-1-9 2-10 4-9L5-12 6-9C8-8 8-6 6-5 4-4 3-2 3 1 3 5 1 8-2 8H6V10H-4C-7 10-8 7-6 4L-12 10-11 7C-8 4-6 1-5-2-4-4-3-5-2-6Z') + d('M2-1L5 1M2 1L4 3') + f(c(5, -7, .8)); },
    fern: function(){ var l = ''; for(var i = 0; i < 7; i++){ var y = 9 - i * 3, w0 = 9 - i * 1.1; l += 'M0 ' + y + 'Q' + (-w0 * .6) + ' ' + (y - 2) + ' ' + (-w0) + ' ' + (y - 3) + 'Q' + (-w0 * .5) + ' ' + y + ' 0 ' + y + 'ZM0 ' + y + 'Q' + (w0 * .6) + ' ' + (y - 2) + ' ' + w0 + ' ' + (y - 3) + 'Q' + (w0 * .5) + ' ' + y + ' 0 ' + y + 'Z'; } return b(l) + d('M0 11V-11C1-12 2-11 1-10'); },
    moss: function(){ var t = ''; [-8, -4, 0, 4, 8].forEach(function(x, i){ var h = 5 + (i % 2) * 3; t += 'M' + (x - 2.4) + ' 8C' + (x - 2) + ' ' + (8 - h) + ' ' + (x + 2) + ' ' + (8 - h) + ' ' + (x + 2.4) + ' 8Z'; }); return b('M-12 8C-12 4-8 3-6 4-4 2 4 2 6 4 8 3 12 4 12 8Z' + t) + d('M-4 4V-8M4 4V-6') + f(c(-4, -8.4, 1.2) + c(4, -6.4, 1.2)); },
    rose: function(){ return d('M0 3V12M0 8L-4 6') + '<path class="ba-leaf" d="M-4 6C-8 5-9 8-8 9-6 9-4 8-4 6Z"/>' + b('M0-11C4-11 7-8 7-4 7 0 4 3 0 3S-7 0-7-4-4-11 0-11Z') + d('M-3-7C0-9 3-7 2-4-1-3-3-5-1-6M-5-2C-3 0 3 0 5-2M-6-6C-5-3-3-2-1-2M6-6C5-3 3-2 1-2'); },
    'charophyte alga': function(){ var w2 = ''; [-7, -1, 5].forEach(function(y){ for(var i = 0; i < 6; i++){ var a = i / 6 * Math.PI * 2; w2 += 'M0 ' + y + 'L' + (Math.cos(a) * 6).toFixed(1) + ' ' + (y + Math.sin(a) * 2.4).toFixed(1); } }); return '<path class="ba-b" style="fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round" d="' + w2 + 'M0-11V11"/>'; },
    primate: function(){ return b(c(0, 0, 9) + c(-9, -1, 3) + c(9, -1, 3)) + w('M-6 1C-6-4-3-6 0-4 3-6 6-4 6 1 6 5 3 7 0 7S-6 5-6 1Z') + f(c(-2.6, -1, 1.2) + c(2.6, -1, 1.2) + 'M-1.4 3h2.8l-1.4 1.2z') + d('M-2 5.2C-1 6 1 6 2 5.2'); },
    human: function(){ return b(c(0, -6, 4.4) + 'M-7 11C-7 3-4 0 0 0S7 3 7 11Z') + d('M-2.6 11V7M2.6 11V7'); },
    frog: function(){ return b('M0-6C6-6 9-1 9 3 9 6 6 7 0 7S-9 6-9 3-6-6 0-6ZM-9 4C-12 6-12 9-9 10H-4L-6 7ZM9 4C12 6 12 9 9 10H4L6 7Z') + w(c(-4, -6, 2.6) + c(4, -6, 2.6)) + f(c(-4, -6, 1.2) + c(4, -6, 1.2)) + d('M-4-1C-2 1 2 1 4-1'); },
    snake: function(){ return b('M-11 6C-11 2-8 1-5 3S1 7 3 3 2-3 5-5 11-6 11-3C11-1 9 0 7-1 6-2 5 0 6 2 7 7 2 10-2 8S-7 5-8 7C-9 9-11 8-11 6Z') + d('M10-2L12-1M10-2L12-3') + f(c(8.6, -4, 0.9)); },
    hawk: function(){ return b('M0-7C1.6-7 2.4-5.6 2.2-4L5-3.6C8-5 11-5 12.5-3.6 11-3 10-2 9.4-1 7-1 4.5-.4 2.4.4L2 5 4.6 9.4C2 10 1 9.6 0 9 -1 9.6-2 10-4.6 9.4L-2 5-2.4.4C-4.5-.4-7-1-9.4-1-10-2-11-3-12.5-3.6-11-5-8-5-5-3.6L-2.2-4C-2.4-5.6-1.6-7 0-7Z') + d('M-11.5-3.4L-12-1.4M-10-2.4L-10.6-.4M11.5-3.4L12-1.4M10-2.4L10.6-.4M-1.6 7.4L0 9.2 1.6 7.4') + '<path class="ba-beak" d="M-1-7 0-9 1-7Z"/>' + f(c(-.9, -5.4, .6) + c(.9, -5.4, .6)); },
    fish: function(){ return b('M-6 0C-3-6 5-7 9-2 10 0 10 1 9 2 5 7-3 6-6 0ZM-6 0L-11-5-10 0-11 5Z') + w('M-2 2C1 4 5 4 8 2') + d('M3-5C2-2 2 2 3 5M-2-5L0-7 3-6') + f(c(6, -1, 1)); },
    'big fish': function(){ return b('M-7 0C-4-7 6-8 10-2 11 0 11 1 10 2 6 8-4 7-7 0ZM-7 0L-12-7-10 0-12 7ZM-1-5L2-10 5-5ZM-1 5L1 8 3 5Z') + w('M-3 2C1 5 6 4 9 2') + d('M5-5C4-2 4 2 5 5M9 1H11') + f(c(7, -1.6, 1.1)); },
    seal: function(){ return b('M-11 6C-12 3-9 2-6 2 0 1 3-1 5-4 6-6 9-7 11-5 12-3 11-1 9 0 8 4 4 7-2 8-6 9-10 8-11 6ZM-11 6L-12 10-8 8ZM-2 8L-4 11 1 9Z') + w('M-6 6C-2 7 2 6 5 3') + f(c(8.4, -4.2, 0.9)) + d('M11-3L13-4M11-3L13-2'); },
    rabbit: function(){ return b('M-7 9C-11 9-11 3-8 0-6-2-2-2 1-1 3-1 4-3 5-4L4-11C4-12 6-12 6-11L7-5 8-11C8-12 10-12 10-11L9-4C11-3 12-1 11 1 10 3 8 3 6 3 6 6 5 9 2 9ZM-9 4a2.6 2.6 0 1 0 0.1 0Z') + w('M-10 2a2 2 0 1 0 .1 0Z') + f(c(8.4, -1, 0.9)) + d('M11 1L12.5 1.6M2 9H5'); },
    deer: function(){ return b('M-9-1C-9-4-6-5 0-5H4L6-9 9-9 10-7 7-5 7-1C7 1 5 2 4 2V10H2V3H-5V10H-7V2C-9 1-9 0-9-1Z') + d('M6-9L4-12M4-12L2-12M4-12L4-14M9-9L11-12M11-12L13-12M11-12L11-14') + f(c(8.2, -7.6, 0.8)); }
  };
  var ALIAS = { grasses: 'grass', grassland: 'grass', grasshoppers: 'grasshopper', ladybugs: 'ladybug', leafhoppers: 'leafhopper', hoverflies: 'hoverfly', bees: 'bee', beetles: 'beetle', aphids: 'aphid',
    snails: 'snail', 'midge larvae': 'midge', 'midge larva': 'midge', 'mayfly nymphs': 'mayfly', 'mayfly nymph': 'mayfly', 'water mites': 'mite', 'water mite': 'mite', worms: 'worm', leeches: 'leech',
    frogs: 'frog', snakes: 'snake', hawks: 'hawk', zooplankton: 'copepod', 'small fish': 'fish', 'large fish': 'big fish', seals: 'seal', rabbits: 'rabbit', deers: 'deer', macaque: 'primate', baboon: 'primate', orangutan: 'primate', gorilla: 'primate', chimpanzee: 'primate', humans: 'human', mice: 'mouse', grass: 'grass', ferns: 'fern', mosses: 'moss', roses: 'rose', 'phytoplankton': 'phytoplankton',
    clovers: 'clover', dandelions: 'dandelion', plantains: 'plantain', oaks: 'oak', maples: 'maple', pines: 'pine', cherries: 'cherry' };
  function key(name){ var k = String(name || '').toLowerCase().trim(); return ART[k] ? k : ALIAS[k] || (ART[k.replace(/s$/, '')] ? k.replace(/s$/, '') : null); }
  window.ApBioArt = {
    has: function(name){ return !!key(name); },
    icon: function(name, x, y, size, cls){
      var k = key(name), s = (size || 24) / 24;
      var inner = k ? ART[k]() : '<path class="ba-b" d="' + c(0, 0, 8) + '"/>';
      return '<g class="ba ' + (cls || '') + '" transform="translate(' + (+x).toFixed(1) + ' ' + (+y).toFixed(1) + ') scale(' + s.toFixed(3) + ')">' + inner + '</g>';
    }
  };
})();
