/* Phylogenetic tree reading, tools v2 (docs/tools-v2-bio-tree-reading-brief.md; the standard:
   docs/tools-v2-standard.md), on the shared kit (assets/course/tool-kit2.js) through the course adapter
   ApBioTools.studioKit2. The tree logic is ApBioMath.phylo (bio-tool-math.js); the trees, character tables, the
   "How this model works" box, the questions and the mini FRQ are data (bio/data/tools/tree-reading.json; Explore's
   own words are its "explore" block). The organisms are ApBioTreeArt (top of this file).

   THE ONE IDEA: relatedness is read from the most recent common ancestor, not from how close the tips sit.

   EXPLORE (free play, nothing graded), two tabs on one drawn scene: a living tree on a soft ground, its root at the
   bottom, every tip ending in a drawn organism, a quiet time arrow from "past" to "now".
   1 Common ancestor: tap tips. The paths from each tapped tip down to their most recent common ancestor glow amber,
     that node swells with a "common ancestor" pill and its clade is tinted; "a clade" or "sister taxa" is added to
     the pill only when true. Tap a node: its two branches swing around it (300 ms), the tips trade places, the glow
     stays on the same organisms, and the takeaway says nothing changed. Tap the picture's sky to clear.
   2 Traits: trait chips on the ground. A tap sends a tick from the root up the trunk to the branch where the trait
     arose; on arrival every organism above it is painted with the trait. Tap again to take it off.
   The cause line (K.cause) is read from what is drawn: the ancestor is named only once the glow has reached it,
   a trait only once its tick has arrived. One control never moves another. Start over unwinds every rotation.
   TEST YOURSELF: Place the traits (graded, record tree-reading:<tree>:characters), Build a tree (the old
   interaction, record tree-reading:build-<tree>:tree), Questions and the mini FRQ (ids unchanged). #place, #build,
   #questions and #frq open them. "?": how the model works, this drawing in words, the character table and the
   primates' DNA differences.
   One colour per idea: tapped tips blue, the common ancestor and its clade amber, traits violet. Reduced motion:
   every change at once with a short cross fade. */
/* AP® Biology, Phylogenetic tree reading (tools v2): the drawn organisms at the tips of the tree
   (docs/tools-v2-bio-tree-reading-brief.md). Pure strings, no DOM: window.ApBioTreeArt.
     defs()        one hidden <svg> of <symbol>s, id "tr2-o-<taxon id>", put in the page once and reused by <use>
                   (one element per drawn organism, never rebuilt per frame).
     has(id)       true when the taxon has a drawing (the invented species P to U do not: they get a lettered disc).
   Every drawing sits in the box -50..50 across and -100..0 up, its feet (or base) at 0,0, so a <use> of size S
   stands on the tip of its branch. Flat fills in two or three tones (body, shade, light) with a soft outline for
   material and depth; no gradients, so a symbol renders the same wherever it is used. Each organism is drawn as
   the real thing, side on (animals), whole (plants) or as a face (the six primates, so they are told apart). */
(function(){
  'use strict';
  function p(cls, d){ return '<path class="' + cls + '" d="' + d + '"/>'; }
  function c(cls, x, y, r){ return '<circle class="' + cls + '" cx="' + x + '" cy="' + y + '" r="' + r + '"/>'; }
  function e(cls, x, y, rx, ry, rot){ return '<ellipse class="' + cls + '" cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '"' + (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + '/>'; }
  var ART = {
    /* ---- chordates */
    lancelet: function(){
      // a small, see-through filter feeder: pointed at both ends, a fin along the back, V-shaped muscle blocks
      var v = ''; for(var i = 0; i < 9; i++){ var x = -26 + i * 6.5; v += 'M' + (x + 2) + ' -33L' + (x - 2) + ' -27L' + (x + 2) + ' -21'; }
      return p('o-fin', 'M-40 -30C-20 -40 20 -40 44 -28L44 -26C20 -34 -20 -34 -40 -27Z') +
        p('o-lanc', 'M-46 -26C-30 -36 18 -36 46 -27C20 -15 -30 -15 -46 -26Z') +
        p('o-lanc-s', 'M-44 -25C-26 -19 18 -18 44 -26C20 -15 -30 -15 -44 -25Z') +
        p('o-line', 'M-40 -27H38') + p('o-thin', v) + c('o-eye', -38, -27, 1.6);
    },
    lamprey: function(){
      // an eel shape with a round sucking disc for a mouth and a row of seven gill openings
      var g = ''; for(var i = 0; i < 7; i++) g += c('o-dark', -26 + i * 4.4, -27, 1.4);
      return p('o-lamp', 'M-44 -26C-44 -34 -36 -36 -28 -34C-10 -31 10 -38 26 -33C36 -30 46 -26 48 -22C40 -20 30 -24 22 -22C8 -19 -14 -16 -30 -18C-38 -18 -44 -20 -44 -26Z') +
        p('o-lamp-s', 'M-42 -21C-30 -17 -10 -18 8 -21C22 -24 34 -23 46 -22C38 -18 28 -21 20 -20C6 -17 -14 -14 -30 -16C-36 -16 -40 -18 -42 -21Z') +
        p('o-fin', 'M4 -34C14 -40 24 -38 30 -33Z') + e('o-mouth', -45, -26, 3.2, 6) + c('o-eye', -36, -30, 1.8);
    },
    shark: function(){
      return p('o-shark', 'M-46 -26C-34 -38 -4 -42 20 -36L34 -52L36 -34C40 -32 44 -32 48 -40L46 -24L48 -10C44 -16 40 -18 36 -18C20 -14 -20 -12 -46 -26Z') +
        p('o-shark-s', 'M-44 -24C-30 -16 -4 -14 22 -18C10 -22 -20 -20 -44 -24Z') +
        p('o-shark', 'M-12 -38L-2 -56L8 -38Z') + p('o-shark', 'M-14 -18L-8 -6L0 -17Z') +
        p('o-line', 'M-30 -31V-24M-27 -32V-23M-24 -32V-23') + c('o-eye', -38, -30, 1.8);
    },
    frog: function(){
      return p('o-frog-s', 'M-34 -2C-40 -2 -42 -10 -34 -12L-22 -14L-26 -2Z') +
        p('o-frog', 'M-30 -8C-34 -26 -18 -44 4 -44C20 -44 34 -34 36 -22C38 -12 30 -4 18 -4H-22C-28 -4 -30 -6 -30 -8Z') +
        p('o-frog-s', 'M-20 -14C-30 -20 -32 -30 -24 -34C-18 -36 -10 -30 -8 -20C-8 -12 -14 -8 -20 -14Z') +
        p('o-belly', 'M0 -8C4 -16 20 -20 32 -18C32 -10 24 -5 16 -5H2Z') +
        p('o-frog', 'M16 -10L20 -2H30') + p('o-line', 'M16 -10L20 -1H30') +
        c('o-frog', 14, -44, 8) + c('o-eyew', 15, -45, 5.6) + c('o-eye', 16.5, -45, 3) + p('o-line', 'M18 -30C24 -28 30 -29 35 -31');
    },
    lizard: function(){
      return p('o-liz', 'M-48 -10C-36 -8 -24 -14 -14 -16H18C26 -16 34 -22 44 -22C48 -22 50 -18 48 -16C44 -12 36 -12 30 -10H-12C-24 -6 -36 -4 -48 -10Z') +
        p('o-liz-s', 'M-12 -11H30C24 -10 18 -9 12 -9H-10Z') +
        p('o-liz', 'M-6 -14L-14 -2H-8L-2 -12M18 -14L12 -2H18L24 -12M-2 -12L4 -2H10L4 -13M22 -12L28 -2H34L28 -13') +
        p('o-dots', 'M-4 -15h3M4 -16h3M12 -16h3M20 -16h3') + c('o-eye', 40, -19, 1.8);
    },
    kangaroo: function(){
      return p('o-roo', 'M-46 -4C-36 -8 -24 -14 -16 -22C-10 -30 -10 -46 -4 -56C0 -64 8 -68 14 -66L16 -78L20 -66C26 -64 28 -58 24 -54C20 -50 16 -50 12 -44C8 -38 8 -30 8 -22C8 -14 4 -6 -4 -4H14V0H-10C-18 0 -22 -4 -20 -10L-34 -2Z') +
        p('o-roo-s', 'M-14 -12C-14 -24 -6 -32 2 -30C6 -24 6 -14 0 -6H-10Z') +
        p('o-roo', 'M4 -44L14 -38L12 -36L2 -40') + p('o-line', 'M4 -44L14 -38') + c('o-eye', 17, -60, 1.8) + c('o-dark', 25, -56, 1.2);
    },
    mouse: function(){
      return p('o-tail', 'M-26 -10C-36 -10 -42 -4 -48 -12') +
        p('o-mouse', 'M-30 -8C-34 -22 -20 -34 0 -34C14 -34 24 -28 32 -20L40 -16C42 -14 40 -10 36 -10L28 -8C22 -2 10 -2 0 -2H-22C-28 -2 -30 -4 -30 -8Z') +
        p('o-mouse-s', 'M-26 -6C-20 -12 -6 -12 6 -6C0 -3 -10 -3 -22 -3Z') +
        c('o-mouse', 14, -34, 9) + c('o-ear', 14, -34, 5.6) + c('o-eye', 27, -22, 1.8) + c('o-nose', 40, -14, 1.8) +
        p('o-thin', 'M36 -16L46 -20M36 -14L47 -14') + p('o-line', 'M-10 -3V0M8 -3V0');
    },
    /* ---- plants (the charophyte alga in its pool of fresh water) */
    alga: function(){
      var w = '';
      [-34, -22, -10].forEach(function(y){ w += 'M0 ' + y + 'C-8 ' + (y - 6) + ' -16 ' + (y - 6) + ' -20 ' + (y - 2) + 'M0 ' + y + 'C8 ' + (y - 6) + ' 16 ' + (y - 6) + ' 20 ' + (y - 2) + 'M0 ' + y + 'C-4 ' + (y - 8) + ' -8 ' + (y - 12) + ' -12 ' + (y - 13) + 'M0 ' + y + 'C4 ' + (y - 8) + ' 8 ' + (y - 12) + ' 12 ' + (y - 13); });
      return e('o-pool', 0, -4, 40, 7) + p('o-pool-s', 'M-30 -6C-14 -9 14 -9 30 -6') + p('o-stalk', 'M0 -2V-44') + p('o-whorl', w) + c('o-alga', 0, -44, 3);
    },
    moss: function(){
      return p('o-moss-s', 'M-38 0C-38 -10 -28 -18 -16 -16C-8 -24 8 -24 16 -16C28 -18 38 -10 38 0Z') +
        p('o-moss', 'M-34 -2C-34 -10 -26 -14 -18 -12C-12 -20 0 -20 6 -14C14 -20 26 -16 28 -10C34 -10 36 -6 34 -2Z') +
        p('o-thin', 'M-26 -6l-3 -5M-18 -8l-2 -6M-10 -10l0 -6M0 -12l1 -6M10 -10l2 -6M20 -8l3 -5') +
        p('o-seta', 'M-8 -14C-10 -30 -6 -44 -4 -52M8 -14C10 -26 12 -36 10 -44') + e('o-caps', -3, -56, 3, 5.5, 18) + e('o-caps', 11, -48, 2.8, 5, -12);
    },
    fern: function(){
      var f = '';
      function frond(sx, sy, ex, ey, k){
        var s = '', n = 9;
        for(var i = 1; i < n; i++){
          var t = i / n, x = sx + (ex - sx) * t, y = sy + (ey - sy) * t - Math.sin(t * Math.PI) * k, L = (1 - t) * 12 + 3;
          s += 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'l' + (-L * 0.4).toFixed(1) + ' ' + (-L).toFixed(1) + 'l' + (L * 0.5).toFixed(1) + ' ' + (L * 0.3).toFixed(1) + 'ZM' + x.toFixed(1) + ' ' + y.toFixed(1) + 'l' + (L * 0.4).toFixed(1) + ' ' + (L * 0.9).toFixed(1) + 'l' + (-L * 0.5).toFixed(1) + ' ' + (-L * 0.2).toFixed(1) + 'Z';
        }
        return s;
      }
      f += frond(0, 0, -40, -46, 14) + frond(0, 0, 38, -50, 14) + frond(0, 0, -6, -84, 6);
      return p('o-fern', f) + p('o-rach', 'M0 0Q-26 -32 -40 -46M0 0Q26 -36 38 -50M0 0Q-4 -50 -6 -84') + p('o-curl', 'M8 -8C14 -14 16 -22 10 -24C6 -25 5 -20 8 -19');
    },
    pine: function(){
      return p('o-trunk', 'M-4 0V-20H4V0Z') +
        p('o-pine-s', 'M0 -96L-16 -70H-8L-26 -46H-14L-34 -20H34L14 -46H26L8 -70H16Z') +
        p('o-pine', 'M0 -96L-16 -70H-8L-26 -46H-14L-34 -20H0Z') + p('o-cone', 'M14 -30c4 0 6 3 5 7c-1 3 -5 3 -6 0c-1 -3 -1 -7 1 -7Z');
    },
    rose: function(){
      return p('o-stem', 'M0 0C2 -20 -2 -40 0 -58') + p('o-leaf', 'M0 -26C-12 -30 -20 -24 -22 -16C-12 -14 -4 -18 0 -26Z') + p('o-leaf', 'M1 -40C12 -46 20 -40 22 -32C12 -30 4 -34 1 -40Z') +
        p('o-petal-s', 'M-16 -66C-18 -80 -8 -92 0 -92C10 -92 18 -80 16 -66C12 -56 -12 -56 -16 -66Z') +
        p('o-petal', 'M-12 -68C-14 -80 -6 -88 0 -88C8 -88 14 -80 12 -68C8 -60 -8 -60 -12 -68Z') +
        p('o-petal-l', 'M-6 -76C-4 -82 4 -84 6 -78C4 -72 -4 -72 -6 -76Z') + p('o-sepal', 'M-10 -60L0 -56L10 -60L4 -58L0 -54L-4 -58Z');
    },
    grass: function(){
      return p('o-grass-s', 'M-10 0C-22 -22 -30 -40 -40 -52C-24 -40 -14 -24 -4 0Z M10 0C20 -20 30 -34 42 -44C28 -36 18 -22 4 0Z') +
        p('o-grass', 'M-4 0C-8 -26 -10 -50 -18 -72C-6 -52 -2 -28 2 0Z M2 0C6 -28 14 -50 24 -66C14 -46 8 -26 8 0Z') +
        p('o-stalk2', 'M0 0C0 -30 2 -60 4 -86') + p('o-head', 'M4 -86c3 4 3 10 0 14c-3 -4 -3 -10 0 -14Zm0 10c3 4 3 10 0 14c-3 -4 -3 -10 0 -14Zm-1 -6l-7 -4m8 12l7 -4m-8 4l-7 -4m8 12l7 -4');
    },
    /* ---- primates: faces, so the six are told apart at a glance */
    human: function(){
      return p('o-hair-h', 'M-24 -56C-26 -80 -12 -92 2 -92C18 -92 28 -80 26 -58C22 -68 12 -74 0 -74C-10 -74 -20 -68 -24 -56Z') +
        p('o-skin', 'M-22 -60C-22 -78 -10 -84 0 -84C12 -84 22 -78 22 -60C22 -40 12 -28 0 -28C-12 -28 -22 -40 -22 -60Z') +
        e('o-skin', -23, -56, 3.5, 6) + e('o-skin', 23, -56, 3.5, 6) +
        p('o-hair-h', 'M-22 -62C-18 -76 -6 -82 6 -80C14 -79 20 -72 22 -64C14 -70 4 -74 -6 -72C-14 -70 -20 -66 -22 -62Z') +
        c('o-eye', -8, -58, 2) + c('o-eye', 8, -58, 2) + p('o-line', 'M-12 -64h7M5 -64h7M0 -56v8l-3 2M-6 -40C-2 -37 2 -37 6 -40') +
        p('o-shirt', 'M-26 0C-26 -16 -14 -24 0 -24S26 -16 26 0Z');
    },
    chimp: function(){
      return p('o-fur', 'M-30 0C-30 -18 -20 -26 0 -26S30 -18 30 0Z') + e('o-ear-c', -27, -58, 9, 11) + e('o-ear-c', 27, -58, 9, 11) +
        p('o-fur', 'M-24 -58C-24 -82 -10 -90 0 -90C12 -90 24 -82 24 -58C24 -38 14 -26 0 -26C-14 -26 -24 -38 -24 -58Z') +
        p('o-face-c', 'M-16 -62C-16 -72 -8 -74 0 -70C8 -74 16 -72 16 -62C16 -52 12 -50 12 -44C12 -34 6 -30 0 -30C-6 -30 -12 -34 -12 -44C-12 -50 -16 -52 -16 -62Z') +
        p('o-brow', 'M-15 -66C-10 -71 -4 -70 0 -66C4 -70 10 -71 15 -66') + c('o-eye', -7, -61, 2) + c('o-eye', 7, -61, 2) +
        p('o-line', 'M-4 -50h2M2 -50h2M-8 -40C-3 -36 3 -36 8 -40');
    },
    gorilla: function(){
      return p('o-fur-g', 'M-36 0C-36 -22 -22 -30 0 -30S36 -22 36 0Z') +
        p('o-fur-g', 'M-26 -54C-28 -78 -14 -96 0 -96C14 -96 28 -78 26 -54C26 -36 14 -28 0 -28C-14 -28 -26 -36 -26 -54Z') +
        p('o-face-g', 'M-18 -58C-18 -66 -10 -68 0 -66C10 -68 18 -66 18 -58C20 -48 16 -36 0 -34C-16 -36 -20 -48 -18 -58Z') +
        p('o-brow-g', 'M-20 -62C-14 -70 -4 -68 0 -64C4 -68 14 -70 20 -62L18 -60C12 -64 4 -64 0 -61C-4 -64 -12 -64 -18 -60Z') +
        c('o-eye', -8, -58, 2) + c('o-eye', 8, -58, 2) + p('o-nose-g', 'M-9 -50C-9 -56 9 -56 9 -50C9 -46 -9 -46 -9 -50Z') + p('o-thin', 'M-8 -40C-3 -38 3 -38 8 -40');
    },
    orangutan: function(){
      return p('o-fur-o', 'M-34 0C-40 -18 -24 -28 0 -28S40 -18 34 0Z') +
        p('o-fur-o', 'M-22 -60C-24 -84 -10 -92 0 -92C10 -92 24 -84 22 -60C22 -42 12 -32 0 -32C-12 -32 -22 -42 -22 -60Z') +
        p('o-pad', 'M-34 -64C-40 -50 -34 -38 -22 -36C-18 -44 -18 -56 -22 -64C-26 -68 -30 -68 -34 -64ZM34 -64C40 -50 34 -38 22 -36C18 -44 18 -56 22 -64C26 -68 30 -68 34 -64Z') +
        p('o-face-o', 'M-14 -62C-14 -72 -6 -76 0 -76C6 -76 14 -72 14 -62C14 -50 10 -38 0 -36C-10 -38 -14 -50 -14 -62Z') +
        c('o-eye', -6, -62, 2) + c('o-eye', 6, -62, 2) + p('o-line', 'M-3 -52h2M1 -52h2M-7 -44C-2 -41 2 -41 7 -44') + p('o-thin', 'M-30 -12C-28 -4 -26 -2 -24 0M30 -12C28 -4 26 -2 24 0');
    },
    macaque: function(){
      return p('o-fur-m', 'M-28 0C-28 -16 -18 -24 0 -24S28 -16 28 0Z') +
        p('o-fur-m', 'M-26 -58C-28 -80 -14 -90 0 -90C14 -90 28 -80 26 -58C26 -38 14 -28 0 -28C-14 -28 -26 -38 -26 -58Z') +
        p('o-face-m', 'M-15 -64C-15 -74 -6 -76 0 -72C6 -76 15 -74 15 -64C15 -56 12 -48 10 -42C8 -36 4 -34 0 -34C-4 -34 -8 -36 -10 -42C-12 -48 -15 -56 -15 -64Z') +
        c('o-eye', -6, -62, 2) + c('o-eye', 6, -62, 2) + p('o-line', 'M-3 -50h2M1 -50h2M-6 -42C-2 -40 2 -40 6 -42') + p('o-thin', 'M-20 -74l-4 -4M20 -74l4 -4M-24 -60l-5 -1M24 -60l5 -1');
    },
    baboon: function(){
      return p('o-fur-b', 'M-30 0C-30 -18 -20 -26 0 -26S30 -18 30 0Z') +
        p('o-fur-b', 'M-24 -62C-26 -84 -12 -92 0 -92C12 -92 26 -84 24 -62C24 -50 18 -44 14 -42L0 -40L-14 -42C-18 -44 -24 -50 -24 -62Z') +
        p('o-face-b', 'M-8 -66C-8 -72 8 -72 8 -66L10 -36C10 -30 -10 -30 -10 -36Z') +
        p('o-brow', 'M-14 -70C-10 -74 -4 -73 -2 -70M2 -70C4 -73 10 -74 14 -70') + c('o-eye', -8, -66, 2) + c('o-eye', 8, -66, 2) +
        p('o-nose-b', 'M-6 -36C-6 -40 6 -40 6 -36C6 -33 -6 -33 -6 -36Z') + p('o-thin', 'M-4 -60V-42M4 -60V-42');
    }
  };
  // how high each drawing reaches in its box (0..1), so a tip's name sits just above what is drawn
  var TOP = { lancelet: 0.42, lamprey: 0.42, shark: 0.58, frog: 0.54, lizard: 0.3, kangaroo: 0.8, mouse: 0.45, alga: 0.5, moss: 0.62, fern: 0.9, pine: 0.97, rose: 0.93, grass: 0.9,
    human: 0.93, chimp: 0.92, gorilla: 0.97, orangutan: 0.93, macaque: 0.91, baboon: 0.93 };
  function defs(){
    var s = '';
    for(var k in ART) s += '<symbol id="tr2-o-' + k + '" viewBox="-50 -100 100 100" overflow="visible">' + ART[k]() + '</symbol>';
    return '<svg class="tr2-defs" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden">' + s + '</svg>';
  }
  window.ApBioTreeArt = { defs: defs, has: function(id){ return !!ART[id]; }, top: function(id){ return TOP[id] || 0.86; } };
})();

(function(){
  'use strict';
  var SLUG = 'tree-reading';
  var T = window.ApBioTools, M = window.ApBioMath, A = window.ApBioTreeArt;
  if(!T || !M || !A) return;
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function n1(v){ return (Math.round(v * 10) / 10).toString(); }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function ease(x){ x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function list(a){ return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  var FONT = 'Nunito, system-ui, sans-serif', mctx = null, mCache = {};
  function tw(s, px, wt){
    var k = s + '|' + px + '|' + (wt || 800);
    if(mCache[k] != null) return mCache[k];
    try{ if(!mctx) mctx = document.createElement('canvas').getContext('2d'); mctx.font = (wt || 800) + ' ' + px + 'px ' + FONT; return (mCache[k] = mctx.measureText(s).width); }
    catch(e){ return s.length * px * 0.58; }
  }
  /* a point and the direction along a branch (a cubic from parent to child), t in 0..1 */
  function bez(a, b, t){
    var dy = a.y - b.y, p1x = a.x + (b.x - a.x) * 0.08, p1y = a.y - dy * 0.55, p2x = b.x, p2y = b.y + dy * 0.45, u = 1 - t;
    return { x: u * u * u * a.x + 3 * u * u * t * p1x + 3 * u * t * t * p2x + t * t * t * b.x, y: u * u * u * a.y + 3 * u * u * t * p1y + 3 * u * t * t * p2y + t * t * t * b.y };
  }
  function bezD(a, b){ var dy = a.y - b.y; return 'M' + n1(a.x) + ' ' + n1(a.y) + 'C' + n1(a.x + (b.x - a.x) * 0.08) + ' ' + n1(a.y - dy * 0.55) + ' ' + n1(b.x) + ' ' + n1(b.y + dy * 0.45) + ' ' + n1(b.x) + ' ' + n1(b.y); }
  function bezR(a, b){ var dy = a.y - b.y; return 'M' + n1(b.x) + ' ' + n1(b.y) + 'C' + n1(b.x) + ' ' + n1(b.y + dy * 0.45) + ' ' + n1(a.x + (b.x - a.x) * 0.08) + ' ' + n1(a.y - dy * 0.55) + ' ' + n1(a.x) + ' ' + n1(a.y); }
  /* a tapered limb: wide (w0) at the parent, narrow (w1) at the child */
  function limb(a, b, w0, w1){
    var L = [], R = [], N = 10;
    for(var i = 0; i <= N; i++){
      var t = i / N, q = bez(a, b, t), q2 = bez(a, b, Math.min(1, t + 0.02)), q1 = bez(a, b, Math.max(0, t - 0.02));
      var dx = q2.x - q1.x, dy = q2.y - q1.y, l = Math.sqrt(dx * dx + dy * dy) || 1, w = (w0 + (w1 - w0) * t) / 2;
      L.push(n1(q.x - dy / l * w) + ' ' + n1(q.y + dx / l * w)); R.push(n1(q.x + dy / l * w) + ' ' + n1(q.y - dx / l * w));
    }
    return 'M' + L.join('L') + 'L' + R.reverse().join('L') + 'Z';
  }

  function boot(){
    var K = window.LevlKit2;
    T.mount(SLUG, function(app, data, ctx){
      var esc = T.esc, F = T.F, P = M.phylo, EX = data.explore;
      var byId = function(id){ return data.trees.filter(function(t){ return t.id === id; })[0]; };
      var placeTrees = data.trees.filter(function(t){ return t.read && t.characters; });
      var builds = data.trees.filter(function(t){ return t.build; });
      function calm(){ return K.reduced() || !window.requestAnimationFrame; }
      if(!document.querySelector('.tr2-defs')) document.body.insertAdjacentHTML('beforeend', A.defs());

      /* ---------------------------------------------------- state */
      // roots: each tree as drawn now (rotations kept per tree, shared by both tabs and Place the traits)
      var roots = {};
      function rootOf(id){ return roots[id] || (roots[id] = P.parse(byId(id).newick)); }
      var St = { mode: 'explore', part: null, tab: 'anc', treeA: EX.trees[0].id, treeT: EX.traitTrees[0], treeP: placeTrees[0].id,
        sel: [], lastPair: null, prevPair: null, traits: {}, place: {}, checked: {}, recorded: {}, armed: null, took: null };
      function treeId(){ return St.mode === 'quiz' && St.part === 'place' ? St.treeP : St.tab === 'anc' ? St.treeA : St.treeT; }
      function tree(){ return byId(treeId()); }
      function root(){ return rootOf(treeId()); }
      function taxon(t, id){ return t.taxa.filter(function(x){ return x.id === id; })[0] || { id: id, name: id }; }
      function nm(t, id){ var x = taxon(t, id); return x.short || x.name; }
      function lower(s){ return /^[A-Z][a-z]/.test(s) && !/^(Species)/.test(s) ? s.toLowerCase() : s; }
      function word(t){ return t.id === 'plants' ? 'plants' : t.id === 'primates' ? 'primates' : 'animals'; }
      function charOf(t, cid){ return (t.characters || []).filter(function(c){ return c.id === cid; })[0]; }
      function nodeById(r, id){ return P.internal(r).filter(function(n){ return n.id === id; })[0]; }
      function ordered(r){ return P.leaves(r).map(function(n){ return n.name; }); }

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'tr2';
      var tabs = K.tabs({ label: 'What to explore', big: true, value: 'anc', items: [{ value: 'anc', label: 'Common ancestor', short: 'Ancestor' }, { value: 'traits', label: 'Traits' }],
        onChange: function(v){ goTab(v); } });
      stage.appendChild(tabs.el);
      var head = K.head({ purpose: EX.purpose.anc, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'tr2-scene';
      sceneBox.innerHTML = '<svg class="tr2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><defs><clipPath id="tr2-grow"><rect class="tr2-growr" x="-10" y="0" width="5000" height="5000"/></clipPath></defs>' +
        '<g class="tr2-bg"></g><g class="tr2-tree" clip-path="url(#tr2-grow)"><g class="tr2-halos"></g><g class="tr2-limbs"></g><g class="tr2-glows"></g><g class="tr2-hits"></g><g class="tr2-tips"></g><g class="tr2-nodes"></g><g class="tr2-ticks"></g><g class="tr2-pills"></g></g></svg>';
      stage.appendChild(sceneBox);
      var svg = sceneBox.querySelector('svg'), gBg = svg.querySelector('.tr2-bg'), gHalo = svg.querySelector('.tr2-halos'), gLimb = svg.querySelector('.tr2-limbs'),
        gGlow = svg.querySelector('.tr2-glows'), gHit = svg.querySelector('.tr2-hits'), gTips = svg.querySelector('.tr2-tips'), gNodes = svg.querySelector('.tr2-nodes'),
        gTicks = svg.querySelector('.tr2-ticks'), gPills = svg.querySelector('.tr2-pills'), growR = svg.querySelector('.tr2-growr'), gTree = svg.querySelector('.tr2-tree');
      var layer = K.layer(sceneBox);
      var keys = document.createElement('div'); keys.className = 'tr2-keys'; layer.el.appendChild(keys);
      var chipBox = document.createElement('div'); chipBox.className = 'tr2-chips'; chipBox.setAttribute('role', 'group'); chipBox.setAttribute('aria-label', 'Traits: tap one to place it on the tree'); layer.el.appendChild(chipBox);
      var lines = document.createElement('div'); lines.className = 'tr2-lines';
      var cause = K.cause({ label: 'Why' });
      var acts = document.createElement('div'); acts.className = 'tr2-acts';
      acts.innerHTML = '<span class="tr2-trees" role="group" aria-label="Tree"></span><button type="button" class="tk2-link tr2-reset">Start over</button>';
      var treeBtns = acts.querySelector('.tr2-trees'), bReset = acts.querySelector('.tr2-reset');
      lines.appendChild(cause.el); lines.appendChild(acts);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      var lastSaid = '';
      function say(t){ if(!t || t === lastSaid) return; lastSaid = t; live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

      /* ---------------------------------------------------- the height of the picture: from the room the window has */
      function fitHeight(){
        var vh = window.innerHeight || 800, wd = sceneBox.clientWidth || stage.clientWidth || 360;
        var rootEl = stage.closest('.ls-root') || stage.parentNode, rt = rootEl ? rootEl.getBoundingClientRect() : null, sb = sceneBox.getBoundingClientRect();
        var above = rt ? clamp(sb.top - rt.top, 0, 280) : 60, below = lines.offsetHeight + 12;
        var bar = 0, tb = document.querySelector('.site-top, .lp-top, header.top'); if(tb){ var cs = getComputedStyle(tb); if(cs.position === 'sticky' || cs.position === 'fixed') bar = tb.offsetHeight; }
        var phone = wd < 600, lo = phone ? 360 : 380, hi = phone ? 640 : 720;
        var h = Math.round(clamp(vh - above - below - bar - 14, lo, hi));
        if(sceneBox.style.height !== h + 'px') sceneBox.style.height = h + 'px';
      }

      /* ---------------------------------------------------- geometry (picture units = CSS px of the scene) */
      var G = null;
      function chipRows(W, t){
        if(!(St.mode === 'explore' && St.tab === 'traits') || !t.characters) return 0;
        var fs = W < 600 ? 13 : 14, avail = W - 20, x = 0, rows = 1;
        t.characters.forEach(function(c){ var w = tw(c.short || c.name, fs, 800) + (W < 600 ? 38 : 46); if(x && x + 8 + w > avail){ rows++; x = w; } else x += (x ? 8 : 0) + w; });
        return rows;
      }
      function layout(){
        var W = sceneBox.clientWidth, H = sceneBox.clientHeight;
        if(!W || !H) return null;
        var t = tree(), r = root(), n = t.taxa.length, ph = W < 600;
        var g = { W: W, H: H, ph: ph, n: n, tid: t.id, dna: t.kind === 'dna' };
        g.padL = ph ? 34 : 56; g.padR = ph ? 6 : 24;
        g.col = (W - g.padL - g.padR) / n;
        g.fs = ph ? 12 : 14; g.fsN = ph ? 11 : 12;
        // the names: one row when every name (as a pill, when tapped) fits its column, otherwise two staggered rows
        var widest = 0; t.taxa.forEach(function(x){ widest = Math.max(widest, tw(x.short || x.name, g.fs, 900) + 16); });
        g.rows = widest + 6 > g.col ? 2 : 1;
        g.nameH = g.fs + 9;
        g.top = 6;
        g.rowY = [g.top + g.rows * g.nameH - 7, g.top + (g.rows - 1) * g.nameH - 7];   // baselines: [lower, upper]
        var cr = chipRows(W, t);
        g.chipRows = cr;
        g.groundH = cr ? cr * 44 + (cr - 1) * 6 + (ph ? 14 : 18) : (ph ? 30 : 38);
        g.groundY = H - g.groundH;
        // the organisms: as large as the column and the height allow
        g.S = clamp(ph ? Math.min(g.col * 0.96, 56, H * 0.13) : Math.min(g.col * 0.8, 116, (H - g.groundH) * 0.2), 30, 116);
        g.tipY = g.top + g.rows * g.nameH + 2 + g.S;
        g.rootY = g.groundY - (ph ? 22 : 30);
        g.rootX = null;
        g.bw = ph ? 4 : 6.5;
        // node heights: cladograms by how far a node is from its tips; the DNA tree drawn to scale
        var leaves = P.leaves(r), maxD = Math.max.apply(null, leaves.map(function(x){ return x.dist; })) || 1;
        function ht(nd){ return nd.kids.length ? 1 + Math.max.apply(null, nd.kids.map(ht)) : 0; }
        var H0 = ht(r);
        g.hy = {};
        P.nodes(r).forEach(function(nd){
          var f = g.dna ? (maxD - nd.dist) / maxD : ht(nd) / H0;
          g.hy[nd.id || nd.name] = g.tipY + f * (g.rootY - g.tipY);
        });
        g.knot = ph ? 9 : 11;
        return g;
      }
      function slotX(s){ return G.padL + (s + 0.5) * G.col; }

      /* ---------------------------------------------------- the scene's parts, built once per tree and layout */
      var E = null;   // { limbs: {key: {g, body, hi}}, glows, halos, hits, tips: {id: {...}}, nodes: {id: {...}} }
      function keyOf(nd){ return nd.kids.length ? 'n' + nd.id : 't' + nd.name; }
      function drawBg(){
        var g = G, W = g.W, b = [];
        b.push('<rect class="tr2-sky" x="0" y="0" width="' + W + '" height="' + g.groundY + '"/>');
        // far hills and a soft light: a calm cue for "outdoors", nothing to read
        var hy = g.groundY, hh = g.ph ? 18 : 34;
        b.push('<path class="tr2-hill is-far" d="M0 ' + hy + 'V' + n1(hy - hh * 0.6) + 'C' + n1(W * 0.2) + ' ' + n1(hy - hh * 1.6) + ' ' + n1(W * 0.38) + ' ' + n1(hy - hh * 0.3) + ' ' + n1(W * 0.55) + ' ' + n1(hy - hh) + 'S' + n1(W * 0.85) + ' ' + n1(hy - hh * 1.5) + ' ' + W + ' ' + n1(hy - hh * 0.5) + 'V' + hy + 'Z"/>');
        b.push('<path class="tr2-hill" d="M0 ' + hy + 'V' + n1(hy - hh * 0.25) + 'C' + n1(W * 0.25) + ' ' + n1(hy - hh * 0.8) + ' ' + n1(W * 0.45) + ' ' + n1(hy - hh * 0.1) + ' ' + n1(W * 0.65) + ' ' + n1(hy - hh * 0.5) + 'S' + n1(W * 0.92) + ' ' + n1(hy - hh * 0.7) + ' ' + W + ' ' + n1(hy - hh * 0.2) + 'V' + hy + 'Z"/>');
        b.push('<rect class="tr2-soil" x="0" y="' + g.groundY + '" width="' + W + '" height="' + (g.H - g.groundY) + '"/><path class="tr2-turf" d="M0 ' + n1(g.groundY + 1) + 'H' + W + '"/>');
        // pebbles in the soil (fixed places, out of the chips' way)
        for(var i = 0; i < 9; i++){ var px = (i * 0.137 + 0.06) % 1 * W, py = g.groundY + 8 + ((i * 7) % 5) * (g.groundH - 14) / 5; b.push('<ellipse class="tr2-peb" cx="' + n1(px) + '" cy="' + n1(py) + '" rx="' + (2 + i % 3) + '" ry="' + (1.4 + i % 2) + '"/>'); }
        // the time arrow: "past" at the root, "now" at the tips (every tip is alive today)
        var ax = g.ph ? 14 : 22, f = g.fsN;
        b.push('<path class="tr2-time" d="M' + ax + ' ' + n1(g.rootY) + 'V' + n1(g.tipY - g.S * 0.4 + 10) + '"/><path class="tr2-time-h" d="M' + ax + ' ' + n1(g.tipY - g.S * 0.4) + 'l-5 10h10Z"/>');
        b.push('<text class="tr2-tword" x="' + ax + '" y="' + n1(g.tipY - g.S * 0.4 - 6) + '" text-anchor="middle" style="font-size:' + f + 'px">now</text>');
        b.push('<text class="tr2-tword" x="' + ax + '" y="' + n1(g.rootY + f + 3) + '" text-anchor="middle" style="font-size:' + f + 'px">past</text>');
        gBg.innerHTML = b.join('');
      }
      function build(){
        var r = root(), t = tree(), b = { limbs: '', halos: '', glows: '', hits: '', tips: '', nodes: '' };
        P.nodes(r).forEach(function(nd){
          var k = keyOf(nd);
          b.halos += '<path class="tr2-halo" data-k="' + k + '" d=""/>';
          b.limbs += '<g class="tr2-limb" data-k="' + k + '"><path class="tr2-bark" d=""/><path class="tr2-bark-hi" d=""/></g>';
          if(nd !== r){
            b.glows += '<path class="tr2-glow" data-k="' + k + '" pathLength="1" d=""/>';
            b.hits += '<path class="tr2-brhit" data-br="' + nd.tips.join(',') + '" data-k="' + k + '" d=""/>';
          }
        });
        P.leaves(r).forEach(function(nd){
          var id = nd.name, x = taxon(t, id), art = A.has(id);
          b.tips += '<g class="tr2-tip" data-tip="' + esc(id) + '"><rect class="tr2-thit" x="0" y="0" width="0" height="0"/><ellipse class="tr2-ring" rx="0" ry="0"/>' +
            '<ellipse class="tr2-pad" rx="0" ry="0"/>' +
            (art ? '<use class="tr2-org" href="#tr2-o-' + id + '" width="10" height="10"/>' : '<circle class="tr2-disc" r="0"/><text class="tr2-dl" text-anchor="middle">' + esc(id) + '</text>') +
            '<g class="tr2-name"><rect class="tr2-npill" rx="9"/><text class="tr2-nt" text-anchor="middle">' + esc(x.short || x.name) + '</text></g></g>';
        });
        P.internal(r).forEach(function(nd){
          b.nodes += '<g class="tr2-node" data-node="' + nd.id + '"><circle class="tr2-nhit" r="22"/><circle class="tr2-knot" r="0"/><text class="tr2-nn" text-anchor="middle">' + nd.id + '</text></g>';
        });
        gHalo.innerHTML = b.halos; gLimb.innerHTML = b.limbs; gGlow.innerHTML = b.glows; gHit.innerHTML = b.hits; gTips.innerHTML = b.tips; gNodes.innerHTML = b.nodes;
        gTicks.innerHTML = ''; gPills.innerHTML = '<g class="tr2-pill" opacity="0"><rect rx="12"/><text class="tr2-pt1" text-anchor="middle"></text><text class="tr2-pt2" text-anchor="middle"></text><text class="tr2-pt3" text-anchor="middle"></text></g>';
        E = { limbs: {}, halos: {}, glows: {}, hits: {}, tips: {}, nodes: {}, pill: gPills.querySelector('.tr2-pill'), ticks: {} };
        gLimb.querySelectorAll('.tr2-limb').forEach(function(x){ E.limbs[x.getAttribute('data-k')] = { body: x.querySelector('.tr2-bark'), hi: x.querySelector('.tr2-bark-hi') }; });
        gHalo.querySelectorAll('.tr2-halo').forEach(function(x){ E.halos[x.getAttribute('data-k')] = x; });
        gGlow.querySelectorAll('.tr2-glow').forEach(function(x){ E.glows[x.getAttribute('data-k')] = x; });
        gHit.querySelectorAll('.tr2-brhit').forEach(function(x){ E.hits[x.getAttribute('data-k')] = x; });
        gTips.querySelectorAll('.tr2-tip').forEach(function(x){ E.tips[x.getAttribute('data-tip')] = { g: x, hit: x.querySelector('.tr2-thit'), ring: x.querySelector('.tr2-ring'), pad: x.querySelector('.tr2-pad'), org: x.querySelector('.tr2-org'), disc: x.querySelector('.tr2-disc'), dl: x.querySelector('.tr2-dl'), name: x.querySelector('.tr2-name'), npill: x.querySelector('.tr2-npill'), nt: x.querySelector('.tr2-nt'), last: {} }; });
        gNodes.querySelectorAll('.tr2-node').forEach(function(x){ E.nodes[x.getAttribute('data-node')] = { g: x, hit: x.querySelector('.tr2-nhit'), knot: x.querySelector('.tr2-knot'), nn: x.querySelector('.tr2-nn') }; });
        // the keyboard and screen reader path: a real button over each tip and node
        keys.innerHTML = '';
        P.leaves(r).forEach(function(nd){ var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'tr2-key is-tip'; bt.setAttribute('data-tip', nd.name); keys.appendChild(bt); });
        P.internal(r).forEach(function(nd){ var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'tr2-key is-node'; bt.setAttribute('data-node', nd.id); keys.appendChild(bt); });
        buildChips();
        keyLabels();
      }

      /* ---------------------------------------------------- what is drawn: tip slots (animated), glow, traits */
      var V = { slot: {}, swing: null, glow: { tips: [], m: null, p: 0, to: 0 }, pop: 0, ticks: [], grow: 1, growT0: 0, raf: 0, last: 0 };
      function targetSlots(){ var o = {}; ordered(root()).forEach(function(id, i){ o[id] = i; }); return o; }
      function snapSlots(){ V.slot = targetSlots(); V.swing = null; }
      function drawnSlot(id){
        var s = V.swing; if(!s) return V.slot[id];
        var f = ease((now() - s.t0) / s.dur);
        return s.from[id] + (s.to[id] - s.from[id]) * f;
      }
      // positions of every node as drawn at this frame (tips from their slots, a node over the middle of its children)
      function positions(){
        var r = root(), pos = {};
        (function walk(nd){
          if(!nd.kids.length){ pos[keyOf(nd)] = { x: slotX(drawnSlot(nd.name)), y: G.hy[nd.name] }; return pos[keyOf(nd)]; }
          var xs = nd.kids.map(walk), x = 0; xs.forEach(function(q){ x += q.x; });
          pos[keyOf(nd)] = { x: x / xs.length, y: G.hy[nd.id] };
          return pos[keyOf(nd)];
        })(r);
        return pos;
      }
      function widthOf(nd){ return G.bw + (G.ph ? 2 : 3.4) * Math.sqrt(nd.tips.length - 1) * (nd.kids.length ? 1 : 0) + (nd.kids.length ? 1.5 : 0); }
      var POS = {};

      /* ---------------------------------------------------- one frame */
      function paint(){
        if(!G || !E) return;
        var r = root(), t = tree(), pos = positions(); POS = pos;
        var rp = pos[keyOf(r)], base = { x: rp.x, y: G.groundY + 2 };
        // limbs: the trunk from the ground, then every branch, tapering toward the tips
        P.nodes(r).forEach(function(nd){
          var k = keyOf(nd), L = E.limbs[k], q = pos[k];
          if(nd === r){
            var w = widthOf(nd) * 1.6;
            L.body.setAttribute('d', limb(base, q, w * 1.35, w));
            L.hi.setAttribute('d', 'M' + n1(q.x - w * 0.18) + ' ' + n1(base.y - 2) + 'V' + n1(q.y));
            E.halos[k].setAttribute('d', '');
            return;
          }
          var pa = pos[keyOf(nd.parent)], w0 = widthOf(nd) * 1.25 + 1, w1 = nd.kids.length ? widthOf(nd) : G.bw * 0.8;
          var tipEnd = nd.kids.length ? q : { x: q.x, y: q.y - 1 };
          L.body.setAttribute('d', limb(pa, tipEnd, w0, w1));
          L.hi.setAttribute('d', bezD({ x: pa.x - w0 * 0.15, y: pa.y }, { x: q.x - w1 * 0.15, y: q.y }));
          L.hi.setAttribute('stroke-width', n1(Math.max(1, w1 * 0.3)));
          var cd = bezR(pa, q);
          E.glows[k].setAttribute('d', cd);
          E.halos[k].setAttribute('d', bezD(pa, q));
          E.hits[k].setAttribute('d', bezD(pa, q));
        });
        E.halos[keyOf(r)].setAttribute('d', '');
        // tips: the organism on its branch end, its name above
        var sel = St.mode === 'explore' && St.tab === 'anc' ? St.sel : [];
        var sw = V.swing, moving = sw ? sw.moving : null;
        // where each name goes: just above its organism; on two staggered rows, the upper row clears both neighbours
        var tgt = sw ? sw.to : V.slot, bySlot = [], baseOf = {};
        P.leaves(r).forEach(function(nd){ bySlot[tgt[nd.name]] = nd.name; baseOf[nd.name] = G.hy[nd.name] - G.S * (A.has(nd.name) ? A.top(nd.name) : 0.8) - 13; });
        var nameY = {};
        bySlot.forEach(function(id, s){
          if(G.rows === 2 && s % 2 === 1){ var b = baseOf[id]; [bySlot[s - 1], bySlot[s + 1]].forEach(function(o){ if(o) b = Math.min(b, baseOf[o]); }); nameY[id] = b - G.nameH; }
          else nameY[id] = baseOf[id];
        });
        P.leaves(r).forEach(function(nd){
          var id = nd.name, e = E.tips[id], q = pos[keyOf(nd)], S = G.S, x = q.x, y = q.y, on = sel.indexOf(id) >= 0;
          var by = nameY[id];
          e.hit.setAttribute('x', n1(x - G.col / 2)); e.hit.setAttribute('y', n1(by - G.fs - 4)); e.hit.setAttribute('width', n1(G.col)); e.hit.setAttribute('height', n1(y + 6 - (by - G.fs - 4)));
          e.pad.setAttribute('cx', n1(x)); e.pad.setAttribute('cy', n1(y + 1)); e.pad.setAttribute('rx', n1(S * 0.26)); e.pad.setAttribute('ry', n1(Math.max(2.5, S * 0.06)));
          if(e.org){ e.org.setAttribute('x', n1(x - S / 2)); e.org.setAttribute('y', n1(y - S)); e.org.setAttribute('width', n1(S)); e.org.setAttribute('height', n1(S)); }
          else { e.disc.setAttribute('cx', n1(x)); e.disc.setAttribute('cy', n1(y - S * 0.42)); e.disc.setAttribute('r', n1(S * 0.36)); e.dl.setAttribute('x', n1(x)); e.dl.setAttribute('y', n1(y - S * 0.42 + S * 0.14)); e.dl.style.fontSize = n1(S * 0.4) + 'px'; }
          var tp = A.has(id) ? A.top(id) : 0.8; e.ring.setAttribute('cx', n1(x)); e.ring.setAttribute('cy', n1(y - S * tp / 2)); e.ring.setAttribute('rx', n1(Math.min(S * 0.54, G.col * 0.46))); e.ring.setAttribute('ry', n1(S * tp / 2 + 5));
          // the name: hidden while its organism swings to a new place, back once it has landed
          var hideName = moving && moving[id] && sw && (now() - sw.t0) < sw.dur;
          var w = tw(e.nt.textContent, G.fs, 900) + 16;
          e.nt.setAttribute('x', n1(x)); e.nt.setAttribute('y', n1(by)); e.nt.style.fontSize = G.fs + 'px';
          e.npill.setAttribute('x', n1(x - w / 2)); e.npill.setAttribute('y', n1(by - G.fs - 2)); e.npill.setAttribute('width', n1(w)); e.npill.setAttribute('height', n1(G.fs + 8));
          e.name.setAttribute('opacity', hideName ? '0' : '1');
          e.g.classList.toggle('is-sel', on);
        });
        // nodes: a knot where the branch splits, its number on it
        var gl = V.glow, mrca = gl.m && St.mode === 'explore' && St.tab === 'anc' ? gl.m : null, popF = ease(V.pop);
        P.internal(r).forEach(function(nd){
          var e = E.nodes[nd.id], q = pos[keyOf(nd)], isM = mrca && mrca === nd, rk = G.knot * (isM ? 1 + 0.45 * popF : 1);
          e.hit.setAttribute('cx', n1(q.x)); e.hit.setAttribute('cy', n1(q.y));
          e.knot.setAttribute('cx', n1(q.x)); e.knot.setAttribute('cy', n1(q.y)); e.knot.setAttribute('r', n1(rk));
          e.nn.setAttribute('x', n1(q.x)); e.nn.setAttribute('y', n1(q.y + G.fsN * 0.36)); e.nn.style.fontSize = G.fsN + 'px';
          e.g.classList.toggle('is-m', !!isM && popF > 0.5);
        });
        paintGlow(pos);
        paintTicks(pos);
        paintPill(pos);
        placeKeys(pos);
        if(cue.active()) cue.place();
      }
      /* the glow from each tapped tip down to their common ancestor (it grows from the tips), and the clade's tint */
      var glowK = {};
      function glowPlan(){
        // each branch on the way, by how many steps it is from the nearest tapped tip below it
        var gl = V.glow, out = {}, K = 0;
        if(!gl.m) return { lv: out, K: 1 };
        gl.tips.forEach(function(id){
          var nd = P.find(root(), [id]), k = 0;
          while(nd && nd !== gl.m){ var key = keyOf(nd); out[key] = out[key] == null ? k : Math.min(out[key], k); K = Math.max(K, k + 1); k++; nd = nd.parent; }
        });
        return { lv: out, K: Math.max(1, K) };
      }
      function paintGlow(){
        var gl = V.glow, plan = glowK, tint = St.mode === 'explore' && St.tab === 'anc';
        Object.keys(E.glows).forEach(function(k){
          var e = E.glows[k], lv = plan.lv ? plan.lv[k] : null;
          var f = lv == null || !tint ? 0 : clamp(gl.p * plan.K - lv, 0, 1);
          var s = f.toFixed(3);
          if(e.__f !== s){ e.__f = s; e.style.strokeDashoffset = (1 - f).toFixed(3); e.setAttribute('opacity', f > 0 ? '1' : '0'); }
        });
        // the clade of the common ancestor (Common ancestor) or of the newest trait (Traits): tinted branches and rings
        var cl = null, cls = '', op = 0;
        if(tint && gl.m){ cl = gl.m; cls = 'is-anc'; op = ease(V.pop); }
        else if(St.mode === 'explore' && St.tab === 'traits'){ var tk = newestTick(); if(tk){ cl = P.find(root(), charOf(tree(), tk.cid).has); cls = 'is-trait'; op = ease(tk.paint); } }
        var inCl = {};
        if(cl) P.nodes(cl).forEach(function(nd){ inCl[keyOf(nd)] = 1; });
        Object.keys(E.halos).forEach(function(k){ var h = E.halos[k], on = !!inCl[k] && op > 0; h.setAttribute('class', 'tr2-halo ' + cls); h.setAttribute('opacity', on ? (op * 0.9).toFixed(2) : '0'); h.setAttribute('stroke-width', G.ph ? 13 : 20); });
        Object.keys(E.tips).forEach(function(id){ var e = E.tips[id], on = !!inCl['t' + id] && op > 0; e.ring.setAttribute('class', 'tr2-ring ' + cls); e.ring.setAttribute('opacity', on ? op.toFixed(2) : '0'); });
      }
      /* the pill beside the common ancestor: "common ancestor", and "a clade" or "sister taxa" when true */
      function pillWords(){
        var gl = V.glow; if(!gl.m) return null;
        var c = P.classify(root(), gl.tips), two = '';
        if(c.kind === 'clade') two = gl.tips.length === 2 && gl.m.kids.length === 2 && gl.m.kids.every(function(k){ return !k.kids.length; }) ? 'sister taxa' : 'a clade';
        return ['common ancestor', two];
      }
      function paintPill(pos){
        var e = E.pill, gl = V.glow, show = St.mode === 'explore' && St.tab === 'anc' && gl.m && V.pop > 0;
        if(!show){ e.setAttribute('opacity', '0'); e.__box = null; return; }
        var w = pillWords(), fs = G.ph ? 12 : 13.5, q = pos[keyOf(gl.m)], rk = G.knot * 1.45 + 6;
        // one line ("common ancestor") or stacked ("common" over "ancestor"), whichever sits clear beside the knot
        var shapes = [[w[0]].concat(w[1] ? [w[1]] : []), ['common', 'ancestor'].concat(w[1] ? [w[1]] : [])], pick = null;
        shapes.forEach(function(ls, i){
          var lw = Math.max.apply(null, ls.map(function(x){ return tw(x, fs, 900); })) + 20, lh = ls.length * (fs + 4) + 10, sp = pillSpot(q, lw, lh, rk, pos);
          if(!pick || sp[2] + i * 25 < pick.bad){ pick = { ls: ls, lw: lw, lh: lh, x0: sp[0], y0: sp[1], bad: sp[2] + i * 25 }; }
        });
        var lw = pick.lw, lh = pick.lh, x0 = pick.x0, y0 = pick.y0;
        var s = ease(V.pop), cx = x0 + lw / 2, cy = y0 + lh / 2;
        e.setAttribute('opacity', s > 0.02 ? '1' : '0');
        e.setAttribute('transform', 'translate(' + n1(cx) + ' ' + n1(cy) + ') scale(' + (0.4 + 0.6 * s).toFixed(3) + ') translate(' + n1(-cx) + ' ' + n1(-cy) + ')');
        var rc = e.querySelector('rect');
        rc.setAttribute('x', n1(x0)); rc.setAttribute('y', n1(y0)); rc.setAttribute('width', n1(lw)); rc.setAttribute('height', n1(lh));
        e.querySelectorAll('text').forEach(function(t, i){ t.textContent = pick.ls[i] || ''; t.setAttribute('x', n1(cx)); t.setAttribute('y', n1(y0 + 5 + fs + i * (fs + 4))); t.style.fontSize = fs + 'px'; });
        e.setAttribute('data-words', w[0] + '|' + w[1]);
        e.__box = [x0, y0, x0 + lw, y0 + lh];
      }
      // a place beside the ancestor with room: clear of every other knot, the names, the organisms and the trait labels
      function pillSpot(q, lw, lh, rk, pos){
        var xs = [q.x + rk, q.x - rk - lw, q.x - lw / 2, q.x + rk + 12, q.x - rk - lw - 12], ys = [q.y - lh / 2, q.y + rk, q.y - rk - lh, q.y + rk + 14, q.y - rk - lh - 14, q.y - lh / 2 - lh - 6, q.y + lh / 2 + 6], best = null, bestBad = 1e9;
        var avoid = nameBoxes().concat(orgBoxes(), tickBoxes());
        xs.forEach(function(xa, i){ ys.forEach(function(ya, j){
          if(i === 2 && (j === 0 || j === 5 || j === 6)) return;   // never over the knot itself
          var x0 = clamp(xa, 4, G.W - 4 - lw), y0 = clamp(ya, 4, G.groundY - lh - 2), bad = (Math.abs(x0 - xa) + Math.abs(y0 - ya)) * 3 + Math.hypot(x0 + lw / 2 - q.x, y0 + lh / 2 - q.y) * 0.4;
          var x1 = x0 + lw, y1 = y0 + lh;
          if(q.x > x0 - rk && q.x < x1 + rk && q.y > y0 - rk && q.y < y1 + rk) bad += 2000;
          P.internal(root()).forEach(function(nd){ var p = pos[keyOf(nd)]; if(p.x > x0 - G.knot - 5 && p.x < x1 + G.knot + 5 && p.y > y0 - G.knot - 5 && p.y < y1 + G.knot + 5) bad += 600; });
          avoid.forEach(function(b){ if(b[0] < x1 + 5 && b[2] > x0 - 5 && b[1] < y1 + 5 && b[3] > y0 - 5) bad += 400; });
          if(bad < bestBad){ bestBad = bad; best = [x0, y0, bad]; }
        }); });
        return best;
      }
      function orgBoxes(){
        var out = [];
        Object.keys(E.tips).forEach(function(id){ var x = +E.tips[id].pad.getAttribute('cx'), y = +E.tips[id].pad.getAttribute('cy'), S = G.S, tp = A.has(id) ? A.top(id) : 0.8; out.push([x - S / 2, y - S * tp - 2, x + S / 2, y + 2]); });
        return out;
      }

      /* ---------------------------------------------------- traits: a tick that climbs from the root to its branch */
      // V.ticks: [{ cid, s (0..1 of the climb), paint (0..1), out (0..1 leaving), t0, mode }]
      function newestTick(){ for(var i = V.ticks.length - 1; i >= 0; i--){ var k = V.ticks[i]; if(!k.leaving && k.s >= 1) return k; } return null; }
      function climb(pos, br){
        // the path from the ground up the trunk and every branch to the middle of the branch leading to the clade
        var r = root(), target = P.find(r, br.split(',')), chain = [], nd = target;
        while(nd){ chain.unshift(nd); nd = nd.parent; }
        var pts = [{ x: pos[keyOf(r)].x, y: G.groundY }], i, k;
        pts.push(pos[keyOf(r)]);
        for(i = 1; i < chain.length; i++){
          var a = pos[keyOf(chain[i - 1])], b = pos[keyOf(chain[i])], last = i === chain.length - 1, N = 8;
          for(k = 1; k <= N; k++){ var tt = k / N * (last ? tickT(chain[i]) : 1); pts.push(bez(a, b, tt)); }
        }
        return pts;
      }
      function tickT(nd){ return nd.kids.length ? 0.55 : 0.4; }
      function along(pts, s){
        var tot = 0, i, d = [];
        for(i = 1; i < pts.length; i++){ var l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); d.push(l); tot += l; }
        var want = s * tot;
        for(i = 1; i < pts.length; i++){ if(want <= d[i - 1] || i === pts.length - 1){ var f = d[i - 1] ? clamp(want / d[i - 1], 0, 1) : 1; return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f, a: Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x) }; } want -= d[i - 1]; }
        return pts[pts.length - 1];
      }
      var TB = [];
      function tickBoxes(){ return TB; }
      function tickLabel(k){
        var t = tree(), c = charOf(t, k.cid);
        if(k.num != null) return String(k.num);
        return c.short || c.name;
      }
      function paintTicks(pos){
        var t = tree(), seen = {}, boxes = [];
        var fs = G.ph ? 12 : 13;
        // the newest trait is named first (it always gets the best place), then the older ones where there is room
        V.ticks.slice().reverse().forEach(function(k){
          var c = charOf(t, k.cid); if(!c) return;
          var br = k.br || c.has.slice().sort().join(','), node = P.find(root(), br.split(','));
          if(!node) return;
          var el = E.ticks[k.id];
          if(!el){ el = gTicks.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g'); el.setAttribute('class', 'tr2-tick' + (k.num != null ? ' is-num' : '') + (k.ok === false ? ' is-wrong' : k.ok === true ? ' is-right' : '')); el.setAttribute('data-cid', k.cid); el.innerHTML = '<circle class="tr2-bead" r="6"/><rect class="tr2-bar" rx="2"/><g class="tr2-tl"><path class="tr2-lead" d=""/><rect rx="10"/><text text-anchor="middle"></text></g>'; gTicks.appendChild(el); E.ticks[k.id] = el; }
          seen[k.id] = 1;
          if(el.__br !== br){ el.__br = br; el.setAttribute('data-br', br); }
          var pts = climb(pos, br), q = along(pts, k.s), arrived = k.s >= 1;
          var op = k.leaving ? 1 - ease(k.out) : 1;
          el.setAttribute('opacity', op.toFixed(2));
          var bead = el.querySelector('.tr2-bead'), bar = el.querySelector('.tr2-bar'), lab = el.querySelector('.tr2-tl');
          bead.setAttribute('cx', n1(q.x)); bead.setAttribute('cy', n1(q.y)); bead.setAttribute('opacity', arrived ? '0' : '1');
          var bw = G.ph ? 18 : 24, bh = G.ph ? 6 : 7;
          bar.setAttribute('x', n1(q.x - bw / 2)); bar.setAttribute('y', n1(q.y - bh / 2)); bar.setAttribute('width', bw); bar.setAttribute('height', bh);
          bar.setAttribute('opacity', arrived ? '1' : '0');
          // its name beside it once it has arrived, on the side with room
          var txt = tickLabel(k), w = tw(txt, fs, 900) + 18, h = fs + 9, ok = null;
          if(arrived){
            var tries = [[q.x + bw / 2 + 5, q.y - h / 2], [q.x - bw / 2 - 5 - w, q.y - h / 2], [q.x - w / 2, q.y + bh / 2 + 4], [q.x - w / 2, q.y - bh / 2 - 4 - h]];
            [1, -1, 2, -2].forEach(function(m){ tries.push([q.x + bw / 2 + 5, q.y - h / 2 + m * (h + 5)], [q.x - bw / 2 - 5 - w, q.y - h / 2 + m * (h + 5)]); });
            [16, 32].forEach(function(dx){ tries.push([q.x + bw / 2 + 5 + dx, q.y - h / 2], [q.x - bw / 2 - 5 - w - dx, q.y - h / 2]); });
            for(var i = 0; i < tries.length && !ok; i++){
              var x0 = tries[i][0], y0 = tries[i][1], bx = [x0, y0, x0 + w, y0 + h];
              if(x0 < 3 || x0 + w > G.W - 3 || y0 < 3 || y0 + h > G.groundY - 2) continue;
              if(boxes.some(function(b){ return b[0] < bx[2] + 4 && b[2] > bx[0] - 4 && b[1] < bx[3] + 4 && b[3] > bx[1] - 4; })) continue;
              if(nameBoxes().some(function(b){ return b[0] < bx[2] + 4 && b[2] > bx[0] - 4 && b[1] < bx[3] + 4 && b[3] > bx[1] - 4; })) continue;
              if(P.internal(root()).some(function(nd){ var p = pos[keyOf(nd)]; return p.x > bx[0] - G.knot - 4 && p.x < bx[2] + G.knot + 4 && p.y > bx[1] - G.knot - 4 && p.y < bx[3] + G.knot + 4; })) continue;
              ok = bx; ok.far = i >= 4;
            }
          }
          if(ok){
            boxes.push(ok);
            lab.setAttribute('opacity', '1');
            lab.querySelector('rect').setAttribute('x', n1(ok[0])); lab.querySelector('rect').setAttribute('y', n1(ok[1])); lab.querySelector('rect').setAttribute('width', n1(w)); lab.querySelector('rect').setAttribute('height', n1(h));
            // a label that had to sit a step away keeps a thin line to its tick
            var ld = lab.querySelector('.tr2-lead');
            if(ok.far){ var lx = clamp(q.x, ok[0], ok[2]), ly = clamp(q.y, ok[1], ok[3]); ld.setAttribute('d', 'M' + n1(q.x) + ' ' + n1(q.y) + 'L' + n1(lx) + ' ' + n1(ly)); } else ld.setAttribute('d', '');
            var tx = lab.querySelector('text'); tx.textContent = txt; tx.setAttribute('x', n1(ok[0] + w / 2)); tx.setAttribute('y', n1(ok[1] + h / 2 + fs * 0.36)); tx.style.fontSize = fs + 'px';
            el.__box = ok;
          } else { lab.setAttribute('opacity', '0'); el.__box = null; }
          el.__at = [q.x, q.y]; el.__arr = arrived;
        });
        Object.keys(E.ticks).forEach(function(id){ if(!seen[id]){ E.ticks[id].remove(); delete E.ticks[id]; } });
        TB = boxes;
      }
      function nameBoxes(){
        var out = [];
        Object.keys(E.tips).forEach(function(id){ var p = E.tips[id].npill; out.push([+p.getAttribute('x'), +p.getAttribute('y'), +p.getAttribute('x') + +p.getAttribute('width'), +p.getAttribute('y') + +p.getAttribute('height')]); });
        return out;
      }

      /* ---------------------------------------------------- the keyboard buttons follow what they name */
      function keyLabels(){
        var t = tree(), r = root();
        keys.querySelectorAll('.tr2-key.is-tip').forEach(function(b){
          var id = b.getAttribute('data-tip'), on = St.sel.indexOf(id) >= 0, nmx = taxon(t, id).name;
          var tipOn = St.mode === 'explore' && St.tab === 'anc';
          b.hidden = !tipOn; b.setAttribute('aria-pressed', String(on));
          b.setAttribute('aria-label', nmx + (on ? ', tapped' : '') + '. Tap to ' + (on ? 'let go of it' : 'find its common ancestor with the others you tap') + '.');
        });
        keys.querySelectorAll('.tr2-key.is-node').forEach(function(b){
          var nd = nodeById(r, +b.getAttribute('data-node'));
          b.setAttribute('aria-label', 'Node ' + nd.id + ', the common ancestor of ' + list(nd.tips.map(function(x){ return nm(t, x); })) + '. Tap to rotate it: its two branches swap sides.');
        });
      }
      function placeKeys(pos){
        if(!pos) return;
        var k = layer.scale();
        keys.querySelectorAll('.tr2-key').forEach(function(b){
          var tip = b.getAttribute('data-tip'), q, w, h;
          if(tip){ var e = E.tips[tip]; if(!e) return; q = pos['t' + tip]; w = G.col; h = G.S + G.fs + 10; b.style.left = n1((q.x - w / 2) * k) + 'px'; b.style.top = n1((q.y - G.S - G.fs - 8) * k) + 'px'; }
          else { q = pos['n' + b.getAttribute('data-node')]; if(!q) return; w = h = 44; b.style.left = n1((q.x - 22) * k) + 'px'; b.style.top = n1((q.y - 22) * k) + 'px'; }
          b.style.width = n1(w * k) + 'px'; b.style.height = n1(h * k) + 'px';
        });
      }

      /* ---------------------------------------------------- the animation loop: runs only while something moves */
      function busy(){ return !!V.swing || V.glow.p !== V.glow.to || (V.glow.m && V.pop < 1) || (!V.glow.m && V.pop > 0) || V.grow < 1 || V.ticks.some(function(k){ return k.s < 1 || k.paint < 1 || k.leaving; }); }
      function kick(){ if(!V.raf && window.requestAnimationFrame){ V.last = 0; V.raf = requestAnimationFrame(tick); } }
      function stopAll(){
        if(V.raf){ cancelAnimationFrame(V.raf); V.raf = 0; }
        if(V.swing) V.swing = null;
        snapSlots();
        V.glow.p = V.glow.to; if(!V.glow.to) V.glow.m = null; V.pop = V.glow.m && V.glow.p >= 1 ? 1 : 0;
        V.ticks = V.ticks.filter(function(k){ return !k.leaving; }); V.ticks.forEach(function(k){ k.s = 1; k.paint = 1; });
        V.grow = 1; growR.setAttribute('y', '-10');
      }
      function tick(ts){
        V.raf = 0;
        var dt = V.last ? Math.min(0.05, (ts - V.last) / 1000) : 0.016; V.last = ts;
        if(V.swing && now() - V.swing.t0 >= V.swing.dur){ V.slot = V.swing.to; var after = V.swing.after; V.swing = null; if(after) after(); }
        // the glow grows (about 420 ms) or pulls back (180 ms)
        var gl = V.glow;
        if(gl.p < gl.to) gl.p = Math.min(gl.to, gl.p + dt / 0.42);
        else if(gl.p > gl.to) gl.p = Math.max(gl.to, gl.p - dt / 0.18);
        if(gl.m && gl.p >= 1) V.pop = Math.min(1, V.pop + dt / 0.2);
        else V.pop = Math.max(0, V.pop - dt / 0.12);
        if(!gl.to && gl.p <= 0 && V.pop <= 0 && gl.m){ gl.m = null; gl.tips = []; glowK = glowPlan(); }
        // ticks climb (about 650 ms), then the clade is painted (220 ms); a tick taken off fades (200 ms)
        V.ticks.forEach(function(k){ if(k.leaving){ k.out = Math.min(1, k.out + dt / 0.2); return; } if(k.s < 1) k.s = Math.min(1, k.s + dt / k.dur); else if(k.paint < 1) k.paint = Math.min(1, k.paint + dt / 0.22); });
        V.ticks = V.ticks.filter(function(k){ return !(k.leaving && k.out >= 1); });
        // a new tree grows from the ground up (600 ms)
        if(V.grow < 1){ V.grow = Math.min(1, (now() - V.growT0) / 600); growR.setAttribute('y', n1(G ? G.groundY + 4 - ease(V.grow) * (G.groundY + 14) : -10)); }
        paint(); words();
        if(busy()) V.raf = requestAnimationFrame(tick);
        else settled();
      }
      function fade(){ sceneBox.classList.remove('is-fade'); void sceneBox.offsetWidth; sceneBox.classList.add('is-fade'); }
      function settled(){ paint(); words(); keyLabels(); refHtml(); }

      /* ---------------------------------------------------- acting on the picture */
      function tapTip(id, how){
        if(!(St.mode === 'explore' && St.tab === 'anc')) return;
        hideCue(true); tourDid('tip');
        var i = St.sel.indexOf(id);
        if(i >= 0) St.sel.splice(i, 1); else St.sel.push(id);
        if(St.sel.length === 2) tourDid('two');
        St.took = null;
        selChanged();
        var t = tree(); say(St.sel.length ? 'Tapped: ' + list(St.sel.map(function(x){ return taxon(t, x).name; })) + '.' : 'Nothing tapped.');
        if(how === 'key'){ var b = keys.querySelector('.tr2-key[data-tip="' + id + '"]'); if(b) b.focus(); }
      }
      function selChanged(){
        var gl = V.glow, r = root();
        if(St.sel.length === 2){ var key = St.sel.slice().sort().join(','); if(!St.lastPair || St.lastPair.key !== key){ St.prevPair = St.lastPair; St.lastPair = { key: key, tips: St.sel.slice(), m: P.mrca(r, St.sel).id }; } }
        if(St.sel.length >= 2){
          var m = P.mrca(r, St.sel), same = gl.m === m && gl.tips.length && gl.p >= 1;
          gl.tips = St.sel.slice(); gl.m = m; gl.to = 1; glowK = glowPlan();
          if(!same){ gl.p = 0; V.pop = 0; }
        } else { gl.to = 0; }
        if(calm()){ stopAll(); fade(); settled(); return; }
        kick(); paint(); words(); keyLabels();
      }
      function rotate(id, how){
        hideCue(true); tourDid('node');
        var r = root(), nd = nodeById(r, id); if(!nd) return;
        var from = {}; P.leaves(r).forEach(function(l){ from[l.name] = drawnSlot(l.name); });
        P.rotate(nd);
        var to = targetSlots(), moving = {}; nd.tips.forEach(function(x){ moving[x] = 1; });
        St.took = null;
        var t = tree(), msg = 'Node ' + id + ' rotated: its two branches swapped sides. Tips from left to right: ' + ordered(r).map(function(x){ return taxon(t, x).name; }).join(', ') + '. Every node keeps the same descendants.';
        if(calm()){ V.slot = to; V.swing = null; fade(); St.took = EX.takeRotate; settled(); say(msg); return; }
        V.swing = { t0: now(), dur: 300, from: from, to: to, moving: moving, after: function(){ St.took = EX.takeRotate; say(msg); } };
        kick();
        if(how === 'key'){ var b = keys.querySelector('.tr2-key[data-node="' + id + '"]'); if(b) b.focus(); }
      }
      var tickId = 0;
      function tapTrait(cid){
        if(!(St.mode === 'explore' && St.tab === 'traits')) return;
        hideCue(true); tourDid('trait');
        var tid = treeId(), on = (St.traits[tid] = St.traits[tid] || []), i = on.indexOf(cid);
        St.took = null;
        if(i >= 0){ on.splice(i, 1); V.ticks.forEach(function(k){ if(k.cid === cid && !k.leaving){ k.leaving = true; k.out = 0; } }); }
        else { on.push(cid); V.ticks.push({ id: 'k' + (++tickId), cid: cid, s: 0, paint: 0, dur: climbDur(cid) }); }
        paintChips();
        if(calm()){ stopAll(); fade(); settled(); }
        else { kick(); }
        var c = charOf(tree(), cid);
        say(i >= 0 ? c.name + ' taken off the tree.' : c.name + ': it arose once, on the branch leading to ' + list(c.has.map(function(x){ return taxon(tree(), x).name; })) + ', and all of them inherit it.');
      }
      function climbDur(cid){
        // longer climbs take a little longer, never past 0.8 s
        var c = charOf(tree(), cid), nd = P.find(root(), c.has), d = 0; while(nd){ d++; nd = nd.parent; }
        return clamp(0.3 + d * 0.08, 0.35, 0.8);
      }
      /* taps act on what is drawn under the finger: the nearest node within reach, else the tip column */
      function hitAt(cx, cy){
        var sr = svg.getBoundingClientRect(), k = sr.width ? G.W / sr.width : 1, x = (cx - sr.left) * k, y = (cy - sr.top) * k, best = null, bd = 23;
        // a trait picked up in Place the traits: the branch nearest the finger (within 26 px), before anything else
        if(St.mode === 'quiz' && St.part === 'place' && St.armed){
          var bb = null, bdd = 26;
          P.nodes(root()).forEach(function(nd){
            if(!nd.parent) return;
            var a = POS[keyOf(nd.parent)], b = POS[keyOf(nd)];
            for(var i = 0; i <= 20; i++){ var q = bez(a, b, i / 20), d = Math.hypot(q.x - x, q.y - y); if(d < bdd){ bdd = d; bb = nd; } }
          });
          if(bb) return { br: bb.tips.join(',') };
        }
        P.internal(root()).forEach(function(nd){ var q = POS[keyOf(nd)]; if(!q) return; var d = Math.hypot(q.x - x, q.y - y); if(d < bd){ bd = d; best = nd; } });
        if(best) return { node: best.id };
        var el = document.elementFromPoint(cx, cy), g = el && el.closest ? el.closest('[data-tip],[data-br]') : null;
        if(g && g.hasAttribute('data-tip') && svg.contains(g)) return { tip: g.getAttribute('data-tip') };
        if(g && g.hasAttribute('data-br') && svg.contains(g)) return { br: g.getAttribute('data-br') };
        return { blank: y < G.groundY };
      }
      var downAt = null;
      svg.addEventListener('pointerdown', function(e){ downAt = [e.clientX, e.clientY]; hideCue(true); });
      svg.addEventListener('click', function(e){
        if(!G) return;
        if(downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 12) return;   // a scroll, not a tap
        var h = hitAt(e.clientX, e.clientY);
        if(h.node != null) rotate(h.node);
        else if(h.tip) tapTip(h.tip);
        else if(h.br && St.mode === 'quiz' && St.part === 'place' && St.armed) placeChar(St.armed, h.br);
        else if(h.blank && St.mode === 'explore' && St.tab === 'anc' && St.sel.length){ St.sel = []; St.took = null; selChanged(); say('Nothing tapped.'); }
      });
      keys.addEventListener('click', function(e){
        var b = e.target.closest('.tr2-key'); if(!b) return;
        if(b.hasAttribute('data-node')) rotate(+b.getAttribute('data-node'), 'key'); else tapTip(b.getAttribute('data-tip'), 'key');
      });

      /* ---------------------------------------------------- the trait chips on the ground (Traits) */
      function buildChips(){
        var t = tree(), on = St.mode === 'explore' && St.tab === 'traits' && !!t.characters;
        chipBox.hidden = !on;
        if(!on){ chipBox.innerHTML = ''; return; }
        chipBox.innerHTML = t.characters.map(function(c){ return '<button type="button" class="tr2-chip" data-ch="' + esc(c.id) + '" aria-pressed="false"><span class="tr2-tickmark" aria-hidden="true"></span>' + esc(c.short || c.name) + '</button>'; }).join('');
        chipBox.querySelectorAll('.tr2-chip').forEach(function(b){ b.setAttribute('aria-label', charOf(t, b.getAttribute('data-ch')).name + ': place it on the tree'); });
        paintChips();
      }
      function paintChips(){
        var on = St.traits[treeId()] || [];
        chipBox.querySelectorAll('.tr2-chip').forEach(function(b){ var p = on.indexOf(b.getAttribute('data-ch')) >= 0; b.setAttribute('aria-pressed', String(p)); b.classList.toggle('is-on', p); });
      }
      chipBox.addEventListener('click', function(e){ var b = e.target.closest('.tr2-chip'); if(b) tapTrait(b.getAttribute('data-ch')); });
      function placeChipBox(){
        if(!G) return;
        var k = layer.scale();
        chipBox.style.top = n1((G.groundY + (G.ph ? 7 : 9)) * k) + 'px'; chipBox.style.left = '10px'; chipBox.style.right = '10px';
      }

      /* ---------------------------------------------------- the cause line, read from what is drawn */
      function rowsOf(parts){
        var W = cause.el.clientWidth || (lines.clientWidth || 340), fs = W < 560 ? 14 : 15, pad = W < 560 ? 18 : 26, arrow = W < 560 ? 18 : 24, row = 1, x = 0;
        parts.forEach(function(q, i){ var w = tw(q.t, fs, 800) + pad + (i ? arrow : 0); if(x && x + w > W){ row++; x = w - (i ? arrow : 0) + arrow; } else x += w; });
        return row;
      }
      function fit(parts, must){
        var out = parts.slice();
        while(out.length > must && rowsOf(out) > 2) out.pop();
        return out;
      }
      function names(t, ids){ var a = ids.map(function(x){ return lower(nm(t, x)); }); return a.length <= 3 ? a.join(' + ') : a.length + ' ' + word(t); }
      var wKey = '';
      function words(){
        var t = tree(), r = root(), parts = [], took = null;
        if(St.mode === 'quiz'){ if(St.part === 'place') cause.set([]); return; }
        if(St.tab === 'anc'){
          var gl = V.glow, sel = St.sel;
          if(!sel.length) parts = [{ t: 'tap 2 ' + word(t), role: 'tip' }, { t: 'see their common ancestor', role: 'anc' }];
          else if(sel.length === 1) parts = [{ t: lower(nm(t, sel[0])), role: 'tip' }, { t: 'tap one more', role: 'ink' }];
          else {
            parts.push({ t: names(t, sel), role: 'tip', say: 'You tapped ' + list(sel.map(function(x){ return taxon(t, x).name; })) });
            // the ancestor is named only once the glow has reached it on the picture
            if(gl.m && gl.p >= 1 && V.pop >= 1){
              var m = gl.m, c = P.classify(r, sel);
              parts.push({ t: 'common ancestor ' + m.id, role: 'anc', say: 'their most recent common ancestor is node ' + m.id });
              var cmp = compare();
              if(cmp) parts.push(cmp);
              if(t.kind === 'dna' && sel.length === 2) parts.push({ t: F(P.distance(r, sel[0], sel[1]), 1) + '% of DNA differs', role: 'dna', say: F(P.distance(r, sel[0], sel[1]), 1) + ' percent of their DNA bases differ' });
              if(!cmp) parts.push(c.kind === 'clade' ? { t: 'a clade', role: 'anc', say: 'together they form a clade: the ancestor and all its descendants' } :
                { t: 'not a clade: leaves out ' + names(t, c.missing), role: 'ink', say: 'they are not a clade, because the ancestor also has ' + list(c.missing.map(function(x){ return taxon(t, x).name; })) + ' among its descendants' });
            }
            parts = fit(parts, 2);
          }
          took = St.took;
        } else {
          var tk = newestTick(), on = (St.traits[treeId()] || []);
          if(!tk || tk.paint < 1){
            var og = t.outgroup ? lower(nm(t, t.outgroup)) : null;
            parts = og ? [{ t: og + ' = outgroup', role: 'tip', say: 'The ' + og + ' is the outgroup' }, { t: 'has none of these traits', role: 'ink' }, { t: 'tap a trait', role: 'trait' }] : [{ t: 'tap a trait', role: 'trait' }];
            parts = fit(parts, 1);
          } else {
            var ch = charOf(t, tk.cid), cl = P.find(r, ch.has), k = ch.has.length;
            parts = [{ t: ch.short || ch.name, role: 'trait', say: ch.name }, { t: 'arose once, below node ' + (cl.kids.length ? cl.id : '') , role: 'trait', say: 'it arose once, on the branch leading to ' + (cl.kids.length ? 'node ' + cl.id : nm(t, cl.name)) },
              { t: k <= 3 ? names(t, ch.has) + ' inherit it' : 'all ' + k + ' tips above inherit it', role: 'tip', say: list(ch.has.map(function(x){ return taxon(t, x).name; })) + ' inherit it' }];
            if(!cl.kids.length) parts[1].t = 'arose on one branch';
            parts = fit(parts, 2);
            if(on.length === t.characters.length && V.ticks.every(function(x){ return x.s >= 1 && x.paint >= 1 && !x.leaving; })) took = EX.takeTraits;
          }
          if(St.took && !took) took = St.took;
        }
        var key = JSON.stringify(parts) + '|' + (took || '');
        if(key === wKey) return; wKey = key;
        if(took) cause.take(took); else cause.set(parts);
        if(!busy()) say(took || cause.text());
      }
      // the new pair against the one before it: closer kin share a more recent common ancestor
      function compare(){
        var a = St.lastPair, b = St.prevPair, t = tree(), r = root();
        if(!a || !b || St.sel.length !== 2 || a.key !== St.sel.slice().sort().join(',')) return null;
        var ma = nodeById(r, a.m), mb = nodeById(r, b.m), what = names(t, b.tips);
        if(!ma || !mb) return null;
        if(ma === mb) return { t: 'as close as ' + what, role: 'ink', say: 'they are as closely related as ' + list(b.tips.map(function(x){ return taxon(t, x).name; })) + ': the same common ancestor' };
        function under(x, y){ while(x){ if(x === y) return true; x = x.parent; } return false; }
        var closer = under(ma, mb) ? true : under(mb, ma) ? false : t.kind === 'dna' ? ma.dist > mb.dist : null;
        if(closer == null) return null;
        return closer ? { t: 'closer kin than ' + what, role: 'ink', say: 'they are more closely related than ' + list(b.tips.map(function(x){ return taxon(t, x).name; })) + ': a more recent common ancestor' } :
          { t: 'less close than ' + what, role: 'ink', say: 'they are less closely related than ' + list(b.tips.map(function(x){ return taxon(t, x).name; })) + ': an older common ancestor' };
      }

      /* ---------------------------------------------------- the first visit cue and Show me how */
      var cue = K.cue(layer, { key: 'apbio-tree', text: 'Tap two ' + word(tree()), side: 'below', at: function(){ return cueAt(); } });
      var cueT = K.cue(layer, { key: 'apbio-tree-traits', text: 'Tap a trait', side: 'above', at: function(){ return cueAtT(); } });
      function cueAt(){
        if(!G || !POS) return [0, 0];
        var ids = ordered(root()), id = ids[Math.min(1, ids.length - 1)], q = POS['t' + id];
        return q ? [q.x, q.y + 2] : [0, 0];
      }
      function cueAtT(){ var b = chipBox.querySelector('.tr2-chip'); if(!b || !G) return [0, 0]; var k = layer.scale(), lr = layer.el.getBoundingClientRect(), r = b.getBoundingClientRect(); return [(r.left + r.width / 2 - lr.left) / k, (r.top - lr.top) / k - 2]; }
      function hideCue(used){ if(cue.active()) cue.hide(used); if(cueT.active() && (used || St.tab !== 'traits')) cueT.hide(used); }
      function showCue(){
        if(St.mode !== 'explore' || tour.active()) return;
        if(St.tab === 'anc'){ if(cue.show()) cue.place(); }
        else if(cueT.show()) cueT.place();
      }
      var tour = K.tour({ key: 'apbio-tree', label: 'Show me how', steps: [
        { id: 'tip', text: 'Tap one organism, then another.', target: function(){ return keys.querySelector('.tr2-key.is-tip:not([hidden])') || sceneBox; } },
        { id: 'two', text: 'Their paths glow down to their most recent common ancestor. Closer kin share a more recent one.', target: function(){ var m = V.glow.m; return m ? keys.querySelector('.tr2-key[data-node="' + m.id + '"]') : keys.querySelector('.tr2-key.is-tip:not([hidden])'); } },
        { id: 'node', text: 'Tap a numbered node: its branches swing round, and nobody’s relatives change.', target: function(){ return keys.querySelector('.tr2-key.is-node') || sceneBox; } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      var tourT = K.tour({ key: 'apbio-tree-traits', label: 'Show me how', steps: [
        { id: 'trait', text: 'Tap a trait: a tick climbs to the branch where it first appeared.', target: function(){ return chipBox.querySelector('.tr2-chip') || sceneBox; } },
        { id: 'trait2', text: 'Every organism above the tick inherits it. Tap another trait to see a smaller clade inside.', target: function(){ return chipBox.querySelectorAll('.tr2-chip')[1] || sceneBox; } },
        { id: 'node', text: 'Rotate a node: the ticks ride along, and the clades stay the same.', target: function(){ return keys.querySelector('.tr2-key.is-node') || sceneBox; } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      function tourDid(id){ if(tour.active()) tour.did(id); if(tourT.active()){ if(id === 'trait' && (St.traits[treeId()] || []).length > 1) tourT.did('trait2'); else tourT.did(id); } }
      function startTour(){ if(St.mode !== 'explore') return; hideCue(false); if(St.tab === 'anc') tour.start(true); else tourT.start(true); }

      /* ---------------------------------------------------- the tree chips and Start over (quiet, under the picture) */
      function paintTreeBtns(){
        var list0 = St.tab === 'anc' ? EX.trees : EX.trees.filter(function(x){ return EX.traitTrees.indexOf(x.id) >= 0; });
        treeBtns.innerHTML = list0.map(function(x){ var on = x.id === treeId(); return '<button type="button" class="tr2-tb' + (on ? ' is-on' : '') + '" data-tree="' + x.id + '" aria-pressed="' + on + '">' + esc(x.chip) + '</button>'; }).join('');
      }
      treeBtns.addEventListener('click', function(e){
        var b = e.target.closest('.tr2-tb'); if(!b) return;
        var id = b.getAttribute('data-tree'); if(id === treeId()) return;
        hideCue(true); tourDid('tree');
        if(St.tab === 'anc') St.treeA = id; else St.treeT = id;
        newTree();
        showPic();
      });
      function newTree(){
        stopAll();
        St.sel = []; St.lastPair = St.prevPair = null; St.took = null; V.glow = { tips: [], m: null, p: 0, to: 0 }; V.pop = 0; glowK = {};
        V.ticks = (St.traits[treeId()] || []).map(function(cid){ return { id: 'k' + (++tickId), cid: cid, s: 1, paint: 1, dur: 0.5 }; });
        paintTreeBtns(); lastWH = ''; layoutNow(true);
        if(!calm()){ V.grow = 0; V.growT0 = now(); growR.setAttribute('y', n1(G.groundY + 4)); kick(); } else fade();
        settled();
      }
      function reset(){
        // Start over: every rotation unwinds (shown), the taps and traits go
        hideCue(true);
        var r = root(), from = {}; P.leaves(r).forEach(function(l){ from[l.name] = drawnSlot(l.name); });
        var fresh = P.parse(tree().newick), oldR = r;
        // keep the same node objects where the tree is the same: rotate back only the nodes that differ
        (function undo(a, b){ if(!a.kids.length) return; if(a.kids[0].tips.join() !== b.kids[0].tips.join()) P.rotate(a); a.kids.forEach(function(k, i){ undo(k, b.kids[i]); }); })(oldR, fresh);
        St.sel = []; St.took = null; St.lastPair = St.prevPair = null; V.glow.to = 0; glowK = glowPlan();
        if(St.tab === 'traits'){ St.traits[treeId()] = []; V.ticks.forEach(function(k){ k.leaving = true; k.out = 0; }); paintChips(); }
        var to = targetSlots(), moving = {}; Object.keys(to).forEach(function(x){ if(Math.abs(to[x] - from[x]) > 0.01) moving[x] = 1; });
        if(calm()){ stopAll(); fade(); settled(); return; }
        V.swing = Object.keys(moving).length ? { t0: now(), dur: 360, from: from, to: to, moving: moving } : null;
        kick();
      }
      bReset.addEventListener('click', function(){ showPic(); reset(); });
      // a button under the picture on a phone: bring the picture back into view so the change is seen
      function showPic(){ var r = sceneBox.getBoundingClientRect(); if(r.top < 0 && window.scrollBy) window.scrollBy({ top: r.top - 8, behavior: calm() ? 'auto' : 'smooth' }); }

      /* ---------------------------------------------------- tabs */
      function goTab(v){
        if(St.tab === v) return;
        stopAll(); hideCue(false); if(tour.active()) tour.stop(); if(tourT.active()) tourT.stop();
        St.tab = v; St.took = null;
        head.purpose(EX.purpose[v]);
        sceneBox.setAttribute('data-tab', v);
        V.glow = { tips: St.sel.slice(), m: null, p: 0, to: 0 }; V.pop = 0;
        V.ticks = v === 'traits' ? (St.traits[treeId()] || []).map(function(cid){ return { id: 'k' + (++tickId), cid: cid, s: 1, paint: 1, dur: 0.5 }; }) : [];
        if(v === 'anc' && St.sel.length >= 2){ V.glow = { tips: St.sel.slice(), m: P.mrca(root(), St.sel), p: 1, to: 1 }; V.pop = 1; }
        glowK = glowPlan();
        paintTreeBtns(); lastWH = ''; layoutNow(true); fade(); settled();
        setTimeout(showCue, 40);
      }

      /* ---------------------------------------------------- layout */
      var lastWH = '';
      function layoutNow(force){
        if(stage.hidden) return;
        fitHeight();
        var key = sceneBox.clientWidth + 'x' + sceneBox.clientHeight + '|' + treeId() + '|' + St.tab + '|' + St.mode + St.part;
        if(!force && key === lastWH) return;
        if(!sceneBox.clientWidth) return;
        lastWH = key;
        var g = layout(); if(!g) return;
        G = g; svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H);
        sceneBox.setAttribute('data-rows', g.rows);
        drawBg(); build(); E.ticks = {}; gTicks.innerHTML = '';
        if(!V.swing) snapSlots();
        placeChipBox();
        paint(); words();
        if(cue.active()) cue.place(); if(cueT.active()) cueT.place();
      }

      /* ---------------------------------------------------- "?": how the model works, this drawing in words, the tables */
      var ref = document.createElement('div'); ref.className = 'ls-sec tr2-ref';
      ref.innerHTML = '<p class="tr2-ref-how"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p><div class="tr2-ref-live"></div>';
      var refLive = ref.querySelector('.tr2-ref-live');
      ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(ctx.studio) ctx.studio.close(); if(St.mode !== 'explore' && ctx.studio && ctx.studio.kit2) ctx.studio.kit2.go('explore'); setTimeout(startTour, 60); });
      function nodeLabel(t, n){ return n.kids.length ? 'node ' + n.id + ' (' + P.leaves(n).map(function(x){ return taxon(t, x.name).name; }).join(', ') + ')' : taxon(t, n.name).name; }
      function nested(t, n){ return n.kids.length ? '(' + n.kids.map(function(k){ return nested(t, k); }).join(', ') + ')' : taxon(t, n.name).name; }
      function describe(t, r){
        var items = P.internal(r).slice().sort(function(a, b){ return a.id - b.id; }).map(function(n){
          return '<li>Node ' + n.id + (n === r ? ' (the root, the common ancestor of every tip here)' : '') + ' splits into ' + list(n.kids.map(function(k){ return esc(nodeLabel(t, k)) + (t.kind === 'dna' && k.len != null ? ' (branch ' + F(k.len, 2) + ')' : ''); })) + '.</li>';
        }).join('');
        return '<ol class="tr-steps">' + items + '</ol><p class="bt-small">Tips from left to right: ' + esc(P.leaves(r).map(function(x){ return taxon(t, x.name).name; }).join(', ')) + '. Each pair of brackets is a clade: ' + esc(nested(t, r)) + '.' +
          (t.kind === 'dna' ? ' Branch lengths are drawn to scale, in ' + esc(t.unit) + '; the difference between two tips is the sum of the branches between them.' : ' This is a cladogram: only the branching order matters; branch lengths mean nothing.') + '</p>';
      }
      function refHtml(){
        var t = tree(), r = root(), h = '<h3 class="ls-title-l">This drawing: ' + esc(t.title) + '</h3><p class="bt-small">' + esc(t.about) + '</p>' + describe(t, r);
        if(t.characters) h += '<h3 class="ls-title-l">Which organisms have each trait</h3>' + T.dataTable(['Taxon'].concat(t.characters.map(function(c){ return esc(c.name); })), t.taxa.map(function(x){ return [esc(x.name)].concat(t.characters.map(function(c){ return c.has.indexOf(x.id) >= 0 ? 'Yes' : 'No'; })); }), 'Yes = has the shared derived trait (' + esc(taxon(t, t.outgroup).name) + ' is the outgroup)') +
          '<p class="bt-small">A shared derived trait arose once, in the common ancestor of a clade, and every descendant inherits it (unless it is lost later). The outgroup branched off first: what it has is treated as the older state.</p>';
        if(t.kind === 'dna'){ var ids = t.taxa.map(function(x){ return x.id; }); h += '<h3 class="ls-title-l">DNA differences read from the tree</h3><p class="bt-small">Each value is the sum of the branch lengths between two tips, in ' + esc(t.unit) + '. The smallest difference marks the most recent common ancestor.</p>' +
          T.dataTable(['Taxon'].concat(t.taxa.map(function(x){ return esc(x.name); })), ids.map(function(a){ return [esc(taxon(t, a).name)].concat(ids.map(function(b){ return a === b ? '—' : F(P.distance(r, a, b), 1); })); }), 'Percent of DNA bases that differ'); }
        h += '<h3 class="ls-title-l">Reading a tree</h3><ul class="bt-small"><li>Time runs from the root (the past) up to the tips; every tip is alive today, so no tip is the ancestor of another.</li><li>Two tips are closer kin when their most recent common ancestor is more recent (nearer the tips), not when they stand side by side.</li><li>Rotating a node swaps the order of its branches, like spinning a hanging mobile: the tips move, every node keeps the same descendants.</li><li>No tip is “more evolved”: the left and right of a tree mean nothing.</li></ul>';
        if(refLive.__h !== h){ refLive.__h = h; refLive.innerHTML = h; }
      }

      /* ---------------------------------------------------- Test yourself: Place the traits (graded) */
      var pDock = document.createElement('div'); pDock.className = 'tr2-dock tr2-pdock';
      pDock.innerHTML = '<div class="tr2-ppick"></div><p class="bt-small tr2-phow">Or choose each branch from its list.</p><div class="tr2-plist"></div><div class="bt-buttons"><button type="button" class="btn-press sm" data-c="check">Check my placements</button></div><div class="tr2-pfb" role="status" aria-live="polite"></div>';
      var pPick = T.choiceSelect({ label: 'Tree', value: St.treeP, options: placeTrees.map(function(t){ return { value: t.id, label: t.title }; }),
        onChange: function(v){ St.treeP = v; St.armed = null; placeOpen(); } });
      pDock.querySelector('.tr2-ppick').appendChild(pPick.el);
      function branchOptions(t){
        var r = rootOf(t.id);
        return [{ value: '', label: 'Choose a branch…' }].concat(P.nodes(r).filter(function(n){ return n !== r; }).sort(function(a, b){ return (b.kids.length ? 1 : 0) - (a.kids.length ? 1 : 0) || (a.id || 0) - (b.id || 0); }).map(function(n){
          return { value: n.tips.join(','), label: 'Branch leading to ' + nodeLabel(t, n) };
        }));
      }
      function placeTicks(){
        var t = byId(St.treeP), pl = St.place[t.id] || {}, chk = St.checked[t.id];
        V.ticks = V.ticks.filter(function(k){ return k.place; });
        var want = {};
        t.characters.forEach(function(c, i){
          var br = chk ? c.has.slice().sort().join(',') : pl[c.id];
          if(!br) return;
          want[c.id] = 1;
          var k = V.ticks.filter(function(x){ return x.cid === c.id; })[0];
          if(!k){ k = { id: 'k' + (++tickId), cid: c.id, s: 1, paint: 1, dur: 0.6, place: true, num: i + 1 }; V.ticks.push(k); }
          if(k.br !== br){ if(k.br) { k.s = 0; } k.br = br; }
        });
        V.ticks = V.ticks.filter(function(k){ return want[k.cid]; });
      }
      function plist(){
        var t = byId(St.treeP), pl = St.place[t.id] = St.place[t.id] || {}, box = pDock.querySelector('.tr2-plist'), chk = St.checked[t.id];
        box.innerHTML = '';
        t.characters.forEach(function(c, i){
          var row = document.createElement('div'); row.className = 'tr2-prow';
          row.innerHTML = '<button type="button" class="tr2-pchip' + (St.armed === c.id ? ' is-armed' : '') + (pl[c.id] ? ' is-placed' : '') + '" data-pc="' + esc(c.id) + '" aria-pressed="' + (St.armed === c.id) + '"' + (chk ? ' disabled' : '') + '><b>' + (i + 1) + '</b> ' + esc(c.name) + '</button>';
          var s = T.choiceSelect({ label: 'Branch for ' + (i + 1) + '. ' + c.short, value: pl[c.id] || '', options: branchOptions(t), onChange: function(v){ pl[c.id] = v; St.armed = null; placeTicks(); plist(); kick(); paint(); } });
          if(chk) s.select.disabled = true;
          row.appendChild(s.el); box.appendChild(row);
        });
      }
      pDock.addEventListener('click', function(e){
        var b = e.target.closest('.tr2-pchip'); if(b){ var id = b.getAttribute('data-pc'); St.armed = St.armed === id ? null : id; plist(); var nb = pDock.querySelector('[data-pc="' + id + '"]'); if(nb) nb.focus(); sceneBox.classList.toggle('is-armed', !!St.armed); say(St.armed ? 'Now tap the branch where this trait first appeared.' : ''); return; }
        var c = e.target.closest('[data-c]'); if(!c) return;
        if(c.getAttribute('data-c') === 'check') checkPlace();
        else if(c.getAttribute('data-c') === 'again'){ var t = byId(St.treeP); St.checked[t.id] = false; St.place[t.id] = {}; placeOpen(); var f = pDock.querySelector('.tr2-pchip'); if(f) f.focus(); }
      });
      function placeChar(cid, br){
        var t = byId(St.treeP), pl = St.place[t.id] = St.place[t.id] || {};
        pl[cid] = br; St.armed = null; sceneBox.classList.remove('is-armed');
        placeTicks(); V.ticks.forEach(function(k){ if(k.cid === cid){ k.s = 0; k.paint = 1; k.dur = 0.55; } });
        plist(); kick();
        var n = P.find(rootOf(t.id), br.split(',')); say('Placed ' + charOf(t, cid).name + ' on the branch leading to ' + nodeLabel(t, n) + '.');
      }
      function checkPlace(){
        var t = byId(St.treeP), pl = St.place[t.id] || {}, fb = pDock.querySelector('.tr2-pfb');
        if(!t.characters.some(function(c){ return pl[c.id]; })){ fb.textContent = 'Place at least one trait first.'; return; }
        St.checked[t.id] = true; St.armed = null;
        if(!St.recorded[t.id]){
          St.recorded[t.id] = true;
          var items = t.characters.map(function(c){ return { id: SLUG + ':' + t.id + ':char-' + c.id, correct: pl[c.id] === c.has.slice().sort().join(','), topic: data.topic, practice: '2.D', level: 'apply', diff: 2, group: 'characters' }; });
          T.record(SLUG, items);
          T.event('apbio-tool-question', { tool: SLUG, correct: items.every(function(x){ return x.correct; }) });
        }
        placeOpen(true);
      }
      function feedback(){
        var t = byId(St.treeP), pl = St.place[t.id] || {}, right = 0, el = pDock.querySelector('.tr2-pfb');
        var rows = t.characters.map(function(c, i){
          var want = c.has.slice().sort().join(','), ok = pl[c.id] === want, n = P.find(rootOf(t.id), c.has);
          if(ok) right++;
          return '<li class="' + (ok ? 'ok' : 'no') + '"><b>' + (ok ? 'Right' : pl[c.id] ? 'Not quite' : 'Not placed') + ':</b> ' + (i + 1) + '. ' + esc(c.name) + ' belongs on the branch leading to ' + esc(nodeLabel(t, n)) + ', because exactly those organisms have it.</li>';
        }).join('');
        el.innerHTML = '<h3 tabindex="-1">' + right + ' of ' + t.characters.length + ' placed on the right branch</h3><ul class="tr-fb">' + rows + '</ul><p class="bt-small">The tree now shows every trait on its right branch. Only your first check of each tree is recorded.</p><div class="bt-buttons"><button type="button" class="bt-btn" data-c="again">Try again</button></div>' + T.report(SLUG + ':' + t.id + ':characters');
      }
      function placeOpen(focusFb){
        var t = byId(St.treeP), chk = St.checked[t.id];
        V.ticks = []; placeTicks(); plist();
        pDock.querySelector('[data-c="check"]').disabled = !!chk;
        if(chk){ feedback(); V.ticks.forEach(function(k){ k.s = 0; k.dur = 0.5; }); } else pDock.querySelector('.tr2-pfb').innerHTML = '';
        lastWH = ''; layoutNow(true); kick();
        if(focusFb){ var h = pDock.querySelector('.tr2-pfb h3'); if(h) h.focus(); }
      }

      /* ---------------------------------------------------- Test yourself: Build a tree (the old interaction) */
      var bStage = document.createElement('div'); bStage.className = 'tr2-bstage';
      bStage.innerHTML = '<div class="tb-pick"></div><div class="tb-table"></div><div class="tb-out"></div>';
      var bDock = document.createElement('div'); bDock.className = 'tr2-dock tr2-bdock';
      bDock.innerHTML = '<fieldset class="bt-ctl tb-pieces"><legend>Your pieces: check two or more that share a derived trait, then join them</legend><div class="tr-checks"></div>' +
        '<div class="bt-buttons"><button type="button" class="btn-press sm" data-b="join">Join the checked pieces into a clade</button><button type="button" class="bt-btn" data-b="undo">Undo the last join</button>' +
        '<button type="button" class="bt-btn" data-b="reset">Start over</button><button type="button" class="btn-press sm alt" data-b="check">Check my tree</button></div></fieldset><div class="tb-status bt-summary" role="status" aria-live="polite"></div>';
      var bs = { set: builds[0].id, pieces: [], history: [], checked: {} };
      function bset(){ return byId(bs.set); }
      function bstart(){ bs.pieces = bset().taxa.map(function(x){ return { name: x.id, kids: [] }; }); bs.history = []; }
      function plabel(t, n){ return n.kids.length ? '(' + n.kids.map(function(k){ return plabel(t, k); }).join(', ') + ')' : taxon(t, n.name).name; }
      function pnewick(n){ return n.kids.length ? '(' + n.kids.map(pnewick).join(',') + ')' : n.name; }
      var bpick = T.choiceSelect({ label: 'Character table', value: bs.set, options: builds.map(function(t){ return { value: t.id, label: t.title }; }),
        onChange: function(v){ bs.set = v; bstart(); buildAll(); bDock.querySelector('.tb-status').textContent = 'New table: ' + bset().title + '. Every organism starts as its own piece.'; } });
      bStage.querySelector('.tb-pick').appendChild(bpick.el);
      bDock.querySelectorAll('[data-b]').forEach(function(b){ b.addEventListener('click', function(){ bact(b.getAttribute('data-b')); }); });
      function buildAll(){
        var t = bset();
        bStage.querySelector('.tb-table').innerHTML = '<p class="bt-small">' + esc(t.about) + ' Join the organisms that share the least widespread derived trait first; the trait every ingroup member shares comes last. Any rotation of the right tree is accepted.</p>' +
          T.dataTable(['Taxon'].concat(t.characters.map(function(c){ return esc(c.name); })), t.taxa.map(function(x){ return [esc(x.name)].concat(t.characters.map(function(c){ return c.has.indexOf(x.id) >= 0 ? 'Yes' : 'No'; })); }), 'Traits (Yes = has the derived trait; ' + esc(taxon(t, t.outgroup).name) + ' is the outgroup)');
        pieces(); bStage.querySelector('.tb-out').innerHTML = '';
      }
      function pieces(){
        var t = bset(), box = bDock.querySelector('.tb-pieces .tr-checks');
        box.innerHTML = bs.pieces.map(function(n, i){ var id = T.nid('tb-p'); return '<div class="bt-check-row"><input type="checkbox" id="' + id + '" value="' + i + '"><label for="' + id + '">' + esc(plabel(t, n)) + '</label></div>'; }).join('');
        bDock.querySelector('[data-b="undo"]').disabled = !bs.history.length;
      }
      function bact(a){
        var t = bset(), status = bDock.querySelector('.tb-status');
        if(a === 'reset'){ bstart(); pieces(); bStage.querySelector('.tb-out').innerHTML = ''; status.textContent = 'Started over: every organism is its own piece.'; return; }
        if(a === 'undo'){ if(bs.history.length){ bs.pieces = bs.history.pop(); pieces(); bStage.querySelector('.tb-out').innerHTML = ''; status.textContent = 'Last join undone. Pieces: ' + bs.pieces.map(function(n){ return plabel(t, n); }).join('; ') + '.'; } return; }
        if(a === 'join'){
          var idx = Array.prototype.filter.call(bDock.querySelectorAll('.tb-pieces input'), function(x){ return x.checked; }).map(function(x){ return +x.value; });
          if(idx.length < 2){ status.textContent = 'Check at least two pieces to join them.'; return; }
          bs.history.push(bs.pieces.slice());
          var group = { kids: idx.map(function(i){ return bs.pieces[i]; }) }, next = [];
          bs.pieces.forEach(function(n, i){ if(i === idx[0]) next.push(group); else if(idx.indexOf(i) < 0) next.push(n); });
          bs.pieces = next; pieces();
          status.textContent = 'Joined ' + plabel(t, group) + ' into one clade. ' + (bs.pieces.length === 1 ? 'One piece is left: your tree is complete. Use Check my tree.' : bs.pieces.length + ' pieces left.');
          return;
        }
        if(a === 'check'){
          if(bs.pieces.length > 1){ status.textContent = 'Keep joining until one piece is left; it will be your whole tree. ' + bs.pieces.length + ' pieces now.'; return; }
          var mine = P.parse(pnewick(bs.pieces[0])), ids = t.taxa.map(function(x){ return x.id; });
          var want = P.parse(P.fromCharacters(ids, t.characters).tree), ok = P.same(mine, want);
          var wantC = P.clades(want), mineC = P.clades(mine);
          var charFor = function(key){ var c = t.characters.filter(function(x){ return x.has.slice().sort().join(',') === key; })[0]; return c ? c.name : null; };
          var rows = P.internal(mine).filter(function(n){ return n !== mine; }).map(function(n){
            var key = n.tips.join(','), good = wantC.indexOf(key) >= 0;
            return '<li class="' + (good ? 'ok' : 'no') + '"><b>' + (good ? 'Supported' : 'Not supported') + ':</b> the clade ' + esc(plabel(t, n)) + (good ? ', marked by ' + esc(charFor(key)) + '.' : ': no derived trait is shared by exactly these organisms.') + '</li>';
          });
          wantC.forEach(function(key){ if(mineC.indexOf(key) < 0 && key.split(',').length < ids.length) rows.push('<li class="no"><b>Missing:</b> a clade of ' + esc(list(key.split(',').map(function(x){ return taxon(t, x).name; }))) + ', marked by ' + esc(charFor(key)) + '.</li>'); });
          if(!bs.checked[t.id]){
            bs.checked[t.id] = true;
            T.record(SLUG, [{ id: SLUG + ':build-' + t.id + ':tree', correct: ok, topic: data.topic, practice: '2.D', level: 'apply', diff: 2, group: 'build' }]);
            T.event('apbio-tool-question', { tool: SLUG, correct: ok });
          }
          status.textContent = ok ? 'Right: your tree has exactly the clades the table supports.' : 'Not quite: compare your clades with the list beside your tree.';
          bStage.querySelector('.tb-out').innerHTML = '<h3>' + (ok ? 'Your tree matches the table' : 'Your tree differs from the one the table supports') + '</h3>' +
            '<div class="bt-fig tr2-stillwrap">' + still(t, mine, Math.min(600, Math.max(300, bStage.clientWidth || 520)), 'Your tree') + '</div><ul class="tr-fb">' + rows.join('') + '</ul>' +
            (ok ? '' : '<p class="bt-small">Only your first check of each table is recorded. Undo or start over and try again.</p>') + T.report(SLUG + ':build-' + t.id + ':tree');
        }
      }

      /* ---------------------------------------------------- a still drawing of a tree (Build a tree, the question drawings) */
      function still(t, r, W, title){
        var leaves = P.leaves(r), n = leaves.length, col = (W - 16) / n, S = clamp(col * 0.7, 26, 52), fs = 12.5, nameRows = leaves.some(function(l){ return tw(nm(t, l.name), fs, 900) + 8 > col; }) ? 2 : 1;
        var top = 6 + nameRows * (fs + 6), tipY = top + S, rootY = tipY + Math.max(120, (n - 1) * 34), H = rootY + 28, out = [], pos = {};
        function ht(nd){ return nd.kids.length ? 1 + Math.max.apply(null, nd.kids.map(ht)) : 0; }
        var H0 = ht(r) || 1, maxD = Math.max.apply(null, leaves.map(function(x){ return x.dist; })) || 1, dna = t.kind === 'dna';
        (function walk(nd){
          if(!nd.kids.length){ var i = leaves.indexOf(nd); pos[keyOf(nd)] = { x: 8 + (i + 0.5) * col, y: tipY }; return pos[keyOf(nd)]; }
          var xs = nd.kids.map(walk), x = 0; xs.forEach(function(q){ x += q.x; });
          var f = dna ? (maxD - nd.dist) / maxD : ht(nd) / H0;
          pos[keyOf(nd)] = { x: x / xs.length, y: tipY + f * (rootY - tipY) }; return pos[keyOf(nd)];
        })(r);
        out.push('<rect class="tr2-sky" x="0" y="0" width="' + W + '" height="' + (H - 18) + '"/><rect class="tr2-soil" x="0" y="' + (H - 18) + '" width="' + W + '" height="18"/>');
        P.nodes(r).forEach(function(nd){
          var q = pos[keyOf(nd)];
          if(nd === r){ out.push('<path class="tr2-bark" d="' + limb({ x: q.x, y: H - 16 }, q, 10, 8) + '"/>'); return; }
          var pa = pos[keyOf(nd.parent)], w = 3 + 1.8 * Math.sqrt(nd.tips.length - 1) + (nd.kids.length ? 1.5 : 0);
          out.push('<path class="tr2-bark" d="' + limb(pa, q, w * 1.25 + 1, nd.kids.length ? w : 2.4) + '"/>');
        });
        P.internal(r).forEach(function(nd){ var q = pos[keyOf(nd)]; out.push('<circle class="tr2-knot" cx="' + n1(q.x) + '" cy="' + n1(q.y) + '" r="8"/><text class="tr2-nn" x="' + n1(q.x) + '" y="' + n1(q.y + 4) + '" text-anchor="middle" style="font-size:11px">' + nd.id + '</text>'); });
        leaves.forEach(function(l, i){
          var q = pos[keyOf(l)], row = nameRows === 2 ? i % 2 : 0, by = 6 + (nameRows - row) * (fs + 6) - 6;
          out.push(A.has(l.name) ? '<use href="#tr2-o-' + l.name + '" x="' + n1(q.x - S / 2) + '" y="' + n1(q.y - S) + '" width="' + n1(S) + '" height="' + n1(S) + '"/>' : '<circle class="tr2-disc" cx="' + n1(q.x) + '" cy="' + n1(q.y - S * 0.42) + '" r="' + n1(S * 0.36) + '"/><text class="tr2-dl" x="' + n1(q.x) + '" y="' + n1(q.y - S * 0.42 + S * 0.14) + '" text-anchor="middle" style="font-size:' + n1(S * 0.4) + 'px">' + esc(l.name) + '</text>');
          out.push('<text class="tr2-nt" x="' + n1(q.x) + '" y="' + n1(by) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(nm(t, l.name)) + '</text>');
        });
        var label = (title || 'Tree') + ': ' + nested(t, r) + '. Tips from left to right: ' + leaves.map(function(x){ return taxon(t, x.name).name; }).join(', ') + '.';
        return '<svg class="tr2-still" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + out.join('') + '</svg>';
      }

      /* ---------------------------------------------------- the two modes (the adapter calls this) */
      function shown(mode, part){
        St.mode = mode; St.part = part;
        stopAll();
        var ex = mode === 'explore', pl = mode === 'quiz' && part === 'place';
        stage.setAttribute('data-view', ex ? 'explore' : pl ? 'place' : 'other');
        tabs.el.hidden = !ex; head.el.hidden = !ex; lines.hidden = !ex;
        if(!ex){ hideCue(false); if(tour.active()) tour.stop(); if(tourT.active()) tourT.stop(); }
        St.armed = null; sceneBox.classList.remove('is-armed');
        if(pl){ setTimeout(function(){ placeOpen(); }, 30); return; }
        if(!ex) return;
        V.ticks = St.tab === 'traits' ? (St.traits[treeId()] || []).map(function(cid){ return { id: 'k' + (++tickId), cid: cid, s: 1, paint: 1, dur: 0.5 }; }) : [];
        V.glow = St.sel.length >= 2 ? { tips: St.sel.slice(), m: P.mrca(root(), St.sel), p: 1, to: 1 } : { tips: [], m: null, p: 0, to: 0 }; V.pop = V.glow.m ? 1 : 0; glowK = glowPlan();
        wKey = '';
        setTimeout(function(){ paintTreeBtns(); lastWH = ''; layoutNow(true); settled(); showCue(); }, 30);
      }
      app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
        '<section class="bt-card" aria-labelledby="tr-q"><h2 id="tr-q">Questions about these trees</h2><div class="bt-qs bio-qs"></div></section>');
      ctx.kit2 = { stage: stage, ref: ref, questionsLabel: 'Questions',
        parts: [
          { value: 'place', label: 'Place the traits', dock: pDock, task: { kicker: 'Place the traits', title: 'Put each shared derived trait on the branch where it first appeared.', todo: 'Tap a trait, then a branch.' } },
          { value: 'build', label: 'Build a tree', dock: bDock, stage: bStage, task: { kicker: 'Build a tree', title: 'Build the tree a character table supports.', todo: 'Join pieces that share a trait.' } }],
        onShow: function(m, p){ shown(m, p); } };
      bstart(); buildAll();
      /* The stimulus describes "Drawing 1" and "Drawing 2" of the plant tree (one rotated at two nodes); question 3
         compares them, so they are drawn (still, nothing to tap). */
      var dr = data.stimuli && data.stimuli['tr-s1'] && data.stimuli['tr-s1'].drawings, dt = dr && byId(dr.tree);
      if(dt && !/tr-draw2/.test(data.stimuli['tr-s1'].text || '')){
        var r1 = P.parse(dt.newick), r2 = P.parse(dt.newick);
        dr.rotate.forEach(function(set){ var n = P.find(r2, set); if(n) P.rotate(n); });
        data.stimuli['tr-s1'].text = (data.stimuli['tr-s1'].text || '') + '<div class="tr-draw2">' + [[r1, 'Drawing 1'], [r2, 'Drawing 2 (two nodes rotated)']].map(function(d){ return '<figure><figcaption>' + d[1] + '</figcaption>' + still(dt, d[0], 440, d[1]) + '</figure>'; }).join('') + '</div>';
      }
      T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
      if(data.frq) T.frq(app, data.frq, SLUG);
      paintTreeBtns(); refHtml();
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); shown('explore', null); }
      // the whole stage stops when it is hidden (Test yourself, "?" on a phone, another page tab)
      if(window.IntersectionObserver) new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting && busy()){ stopAll(); settled(); } }); }).observe(sceneBox);
      document.addEventListener('visibilitychange', function(){ if(document.hidden && busy()){ stopAll(); settled(); } });
      if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ mCache = {}; lastWH = ''; layoutNow(true); });
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(function(){ if(busy()) stopAll(); layoutNow(false); settled(); }, 60); }).observe(sceneBox); }
      window.addEventListener('resize', function(){ fitHeight(); });
      // for the sweep (scripts/tools-v2/bio-tree-reading-sweep.mjs): the drawn state and the geometry
      window.__tr2 = { G: function(){ return G; }, POS: function(){ return POS; }, St: St, V: V, busy: busy, root: root, tree: tree, P: P,
        tap: function(id){ tapTip(id); }, rot: function(id){ rotate(id); }, trait: function(cid){ tapTrait(cid); }, tab: function(v){ tabs.value(v); goTab(v); }, reset: reset,
        setTree: function(id){ if(St.tab === 'anc') St.treeA = id; else St.treeT = id; newTree(); }, stopAll: function(){ stopAll(); settled(); }, noCue: function(){ hideCue(true); },
        place: function(cid, br){ placeChar(cid, br); }, fit: fitHeight, layout: function(){ lastWH = ''; layoutNow(true); } };
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApBioBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var l2 = document.createElement('link'); l2.rel = 'stylesheet'; l2.href = (window.ApBioBase || '../') + 'assets/tools/tree-reading.css'; document.head.appendChild(l2);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
