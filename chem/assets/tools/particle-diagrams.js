/* Trainer: particle diagrams (Units 3, 4, 7, 8). Job: turn a reaction into
   a correct particle picture, and read one.

   Build it (explore): for a limiting-reactant reaction (Unit 4) or an
   A₂ + B₂ ⇌ 2 AB equilibrium (Unit 7) from ApChemMath.particles.generate,
   the "before" box is given and the student fills the "after" box: drag a
   particle from the palette into the box, or tap it (or its + button);
   tap a particle in the box (or −) to take it out. A live tally counts the
   atoms of each element before and after (ApChemMath.atomsOf, from the same
   templates the pictures draw), so conservation is checked as you go;
   "Check my box" compares with the generator's answer and says what is
   wrong (atoms not conserved, the wrong leftover, products not in the
   coefficient ratio, or Q ≠ K with Q worked from the counts). Not recorded:
   it is practice for the picture-reading quiz.

   Pick the picture (test yourself): the seeded choice drill, unchanged
   (problem codes ?seed=, recorded as before). Pictures are drawn by
   ApChemMath.particles from a seed, each an SVG with a text alternative
   written from the counts it draws; each kind is served once its unit is
   published. */
(function(){
  'use strict';
  var T = window.ApChemTools;
  if(!T) return;
  var TITLE = { hydration: 'Ions in water', acid: 'Strong and weak acids', limiting: 'Limiting reactant', equilibrium: 'Equilibrium particle counts' };
  var NAMES = { A: 'A', B: 'B', A2: 'A₂', B2: 'B₂', AB: 'AB', H2: 'H₂', O2: 'O₂', N2: 'N₂', Cl2: 'Cl₂', CO: 'CO', H2O: 'H₂O', NH3: 'NH₃', CO2: 'CO₂', HCl: 'HCl' };
  T.mount('particle-diagrams', function(app, data){
    var M = window.ApChemMath;
    var buildable = (data.contexts || []).filter(function(c){ return c.kind === 'limiting' || c.kind === 'equilibrium'; });
    function quiz(host){
      T.drill(host, data, {
        slug: 'particle-diagrams',
        generate: function(r, ctx){ return M.particles.generate(r, ctx); },
        types: [{ value: 'hydration', label: TITLE.hydration + ' (Unit 3)' }, { value: 'limiting', label: TITLE.limiting + ' (Unit 4)' }, { value: 'equilibrium', label: TITLE.equilibrium + ' (Unit 7)' }, { value: 'acid', label: TITLE.acid + ' (Unit 8)' }],
        typeLabel: 'Kind of picture',
        title: function(p){ return TITLE[p.type]; },
        // Tool Studio: the before box on the stage, the equation and the question as the caption.
        studioAsk: true,
        extra: function(h, p){
          if(p.extra.before) h.innerHTML = '<figure class="cd-fig"><figcaption class="bt-small">' + (p.type === 'limiting' ? 'Before the reaction' : 'Before any reaction') + '</figcaption>' + p.extra.before + '</figure>';
        }
      });
    }
    if(!buildable.length){ quiz(app); return; }
    var ex = null;
    T.modes(app, { slug: 'particle-diagrams', labels: ['Build it', 'Pick the picture'], explore: function(h){ ex = build(h, buildable, M); }, quiz: quiz,
      studio: { explore: function(pane, s){ if(ex) ex.studio(pane, s); } } });
  });

  function build(host, ctxs, M){
    var esc = T.esc, BP = window.ApChemBeaker.pure;
    // Lookups reach the Tool Studio too, where these parts move (studio()).
    var LS = null, SP = null, showSlot = null;
    function $(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); }
    function $$(sel){ var a = [].slice.call(host.querySelectorAll(sel)); return LS ? a.concat([].slice.call(LS.root.querySelectorAll(sel))) : a; }
    // A phone in portrait stacks the two boxes (chem-tools.css), so each box
    // is drawn wider than tall (300 x 160 instead of 300 x 190) to fill the
    // stage's width (docs/tools-phone-pass.md). The particles keep their size.
    var BH = 190, BOX = { x0: 22, x1: 278, y0: 22, y1: 168 }, SL = BP.slots(20, 5, BOX);
    function boxes(){
      var h = window.matchMedia && window.matchMedia('(max-width:599.98px)').matches ? 160 : 190;
      if(h === BH) return;
      BH = h; BOX = { x0: 22, x1: 278, y0: h === 190 ? 22 : 16, y1: h - (h === 190 ? 22 : 16) }; SL = BP.slots(20, 5, BOX);
    }
    var ci = 0, seed = 1 + Math.floor(Math.random() * 9999), p, keys, before, mine = {}, placed = [], drag = null;
    host.innerHTML = '<section class="bt-problem pb-card" aria-labelledby="pb-h"><div class="tx-head"><h2 id="pb-h" class="pb-title"></h2><div class="pb-text"></div></div>' +
      '<div class="pb-boxes"><figure class="pb-fig"><figcaption class="bt-small">Before</figcaption><div class="pb-before"></div></figure>' +
      '<figure class="pb-fig"><figcaption class="bt-small">After: your box</figcaption><div class="pb-after"></div></figure></div>' +
      '<div class="pb-palette" role="group" aria-label="Particles to add"></div>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm pb-check">Check my box</button><button type="button" class="bt-btn pb-clear">Empty the box</button></div>' +
      '<div class="pb-fb" role="status" aria-live="polite"></div>' +
      '<details class="pb-tally-d"><summary>Atom tally <span class="pb-tally-s"></span></summary><div class="pb-tally" aria-live="polite"></div></details>' +
      T.moreHtml('<div class="bt-pick pb-pick"></div><div class="bt-buttons"><button type="button" class="bt-btn pb-new">New problem</button></div>', 'another kind of picture, new problem') + '</section>';
    var pick = $('.pb-pick'), start = T.cue('Drag a particle into your box, or tap it or +. Tap one in the box, or −, to take it out.');
    host.querySelector('.pb-palette').parentNode.insertBefore(start.el, host.querySelector('.pb-palette'));
    if(ctxs.length > 1){
      var sel = T.choiceSelect({ label: 'Kind', options: ctxs.map(function(c, i){ return { value: i, label: TITLE[c.kind] }; }), value: 0, onChange: function(v){ ci = +v; seed++; fresh(); } });
      sel.el.classList.add('bt-inline'); pick.appendChild(sel.el);
    }
    $('.pb-new').addEventListener('click', function(){ seed++; fresh(); });
    $('.pb-clear').addEventListener('click', function(){ keys.forEach(function(k){ mine[k] = 0; }); draw(); fb(''); });
    $('.pb-check').addEventListener('click', check);

    function fresh(){
      var ctx = ctxs[ci];
      p = M.particles.generate(M.rng(seed), ctx);
      if(p.type === 'limiting'){ before = p.extra.start; keys = Object.keys(p.extra.after); }
      else { var e = p.extra.eq, x = p.extra.x; before = { A2: e.A2 + x, B2: e.B2 + x, AB: 0 }; keys = ['A2', 'B2', 'AB']; }
      keys.forEach(function(k){ mine[k] = 0; });
      placed = [];
      $('.pb-title').textContent = TITLE[p.type] + ': build the box';
      $('.pb-text').innerHTML = p.type === 'limiting'
        ? '<p class="bt-eq">' + (ctx.reactions ? eqOf(p) : '') + '</p><p class="bt-small">The reaction goes to completion. Fill the after box: what is left, and what formed?</p>'
        : '<p class="bt-eq">A₂ + B₂ ⇌ 2 AB &nbsp; K = ' + M.fmt(p.extra.K, 3) + '</p><p class="bt-small">The gas particle count does not change, so Q can be worked from counts. Fill the box with the mixture at equilibrium.</p>';
      boxes();
      var bc = {}; Object.keys(before).forEach(function(k){ if(before[k]) bc[k] = before[k]; });
      $('.pb-before').innerHTML = M.particles.box(bc, seed + 9, { w: 300, h: BH, label: 'Before: a box containing ' + M.particles.describe(bc) });
      $('.pb-palette').innerHTML = keys.map(function(k){
        return '<div class="pb-pal" data-k="' + k + '"><button type="button" class="pb-chip" data-k="' + k + '" aria-label="Add one ' + esc(NAMES[k] || k) + '"><svg viewBox="-22 -18 44 36" aria-hidden="true">' + M.particles.mol(k, 0, 0, 0) + '</svg><span>' + esc(NAMES[k] || k) + '</span></button>' +
          '<button type="button" class="bt-step pb-minus" data-k="' + k + '" aria-label="Remove one ' + esc(NAMES[k] || k) + '">−</button><b class="pb-n" data-k="' + k + '">0</b><button type="button" class="bt-step pb-plus" data-k="' + k + '" aria-label="Add one ' + esc(NAMES[k] || k) + '">+</button></div>';
      }).join('');
      $$('.pb-plus').forEach(function(b){ b.addEventListener('click', function(){ add(b.getAttribute('data-k'), 1); }); });
      $$('.pb-minus').forEach(function(b){ b.addEventListener('click', function(){ add(b.getAttribute('data-k'), -1); }); });
      $$('.pb-chip').forEach(function(b){
        b.addEventListener('click', function(){ if(!b._dragged) add(b.getAttribute('data-k'), 1); b._dragged = false; });
        b.addEventListener('pointerdown', function(e){ startDrag(e, b); });
      });
      var svgHtml = '<svg class="chem-svg pt-box pb-svg" viewBox="0 0 300 ' + BH + '" role="img" aria-label="Your after box"><rect class="pt-frame" x="1" y="1" width="298" height="' + (BH - 2) + '" rx="10"/><g class="pb-parts"></g><text class="pb-empty" x="150" y="' + (BH / 2 + 5) + '" text-anchor="middle">Empty: add particles</text></svg>';
      $('.pb-after').innerHTML = svgHtml;
      $('.pb-after svg').addEventListener('click', function(e){
        var g = e.target.closest('.pb-p'); if(g) add(g.getAttribute('data-k'), -1);
      });
      fb('');
      draw();
    }
    function eqOf(p){ var m = /<p class="bt-eq">([\s\S]*?)<\/p>/.exec(p.text); return m ? m[1] : ''; }
    function add(k, d){
      var total = keys.reduce(function(s, x){ return s + mine[x]; }, 0);
      if(d > 0 && total >= SL.length) { fb('<span class="bt-small">The box is full (' + SL.length + ' particles). No answer needs that many.</span>'); return; }
      mine[k] = Math.max(0, mine[k] + d); draw(); fb('');
    }
    function startDrag(e, chip){
      if(e.button > 0) return;
      e.preventDefault();  // no text selection while dragging (click still fires)
      var k = chip.getAttribute('data-k'), ghost = null, sx = e.clientX, sy = e.clientY, moved = false;
      function mv(ev){
        if(!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        if(!moved){ moved = true; ghost = document.createElement('div'); ghost.className = 'pb-ghost'; ghost.innerHTML = chip.querySelector('svg').outerHTML; document.body.appendChild(ghost); $('.pb-after').classList.add('is-target'); }
        ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
        var over = isOver(ev); $('.pb-after').classList.toggle('is-over', over);
        ev.preventDefault();
      }
      function up(ev){
        window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        if(ghost) ghost.remove();
        $('.pb-after').classList.remove('is-over', 'is-target');
        if(moved){
          chip._dragged = true; setTimeout(function(){ chip._dragged = false; }, 0);
          if(ev.type === 'pointercancel') return;
          if(isOver(ev)) add(k, 1);
          else fb('<span class="bt-small">Drop it inside <b>After: your box</b> (or just tap the particle).</span>');
        }
      }
      // Forgiving drop: anywhere on the after box, with a finger's width of
      // margin around it, counts (a fingertip hides the exact edge).
      function isOver(ev){ var r = $('.pb-after svg').getBoundingClientRect(), m = 24; return ev.clientX >= r.left - m && ev.clientX <= r.right + m && ev.clientY >= r.top - m && ev.clientY <= r.bottom + m; }
      window.addEventListener('pointermove', mv, { passive: false }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    }
    function draw(){
      var counts = {}; keys.forEach(function(k){ counts[k] = mine[k]; });
      placed = BP.assign(placed, counts, SL.length);
      var g = $('.pb-parts'), reduced = T.reduced();
      var have = {}; g.querySelectorAll('.pb-p').forEach(function(n){ have[n.getAttribute('data-id')] = n; });
      var keep = {};
      placed.forEach(function(q){
        keep[q.id] = 1;
        if(have[q.id]) return;
        var s = SL[q.slot], n = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        n.setAttribute('class', 'pb-p' + (reduced ? '' : ' is-in')); n.setAttribute('data-id', q.id); n.setAttribute('data-k', q.key);
        n.setAttribute('transform', 'translate(' + s.x + ' ' + s.y + ')');
        n.innerHTML = '<title>' + esc(NAMES[q.key] || q.key) + ': tap to take it out</title><g transform="scale(1.15)">' + M.particles.mol(q.key, 0, 0, s.a) + '</g>';
        g.appendChild(n);
        if(!reduced) requestAnimationFrame(function(){ requestAnimationFrame(function(){ n.classList.remove('is-in'); }); });
      });
      Object.keys(have).forEach(function(id){ if(!keep[id]) have[id].remove(); });
      $('.pb-empty').style.display = placed.length ? 'none' : '';
      $('.pb-after svg').setAttribute('aria-label', 'Your after box: ' + M.particles.describe(counts));
      keys.forEach(function(k){ $('.pb-n[data-k="' + k + '"]').textContent = mine[k]; });
      tally(counts);
    }
    function tally(counts){
      var a0 = M.atomsOf(before), a1 = M.atomsOf(counts), els = Object.keys(a0);
      var rows = els.map(function(el){ var ok = a0[el] === (a1[el] || 0); return '<li class="' + (ok ? 'ok' : 'off') + '"><b>' + el + '</b> before ' + a0[el] + ', after ' + (a1[el] || 0) + ' <span>' + (ok ? '✓ conserved' : (a1[el] || 0) < a0[el] ? (a0[el] - (a1[el] || 0)) + ' missing' : ((a1[el] || 0) - a0[el]) + ' too many') + '</span></li>'; }).join('');
      var extra = p.type === 'equilibrium' && counts.A2 * counts.B2 > 0 && els.every(function(el){ return a0[el] === (a1[el] || 0); })
        ? '<p class="bt-small pb-q">Q from your counts = (' + counts.AB + ')² / (' + counts.A2 + ' × ' + counts.B2 + ') = ' + M.fmt(counts.AB * counts.AB / (counts.A2 * counts.B2), 3) + ', K = ' + M.fmt(p.extra.K, 3) + '.</p>' : '';
      var off = els.filter(function(el){ return a0[el] !== (a1[el] || 0); }).length;
      $('.pb-tally').innerHTML = '<ul class="pb-atoms">' + rows + '</ul>' + extra;
      $('.pb-tally-s').textContent = off ? '(' + off + ' element' + (off === 1 ? '' : 's') + ' not balanced yet)' : '(every atom conserved ✓)';
      if(Object.keys(counts).some(function(k){ return counts[k] > 0; })) start.done();
      studioDraw();
    }
    function fb(h){ $('.pb-fb').innerHTML = h; if(LS) studioFb(); }
    /* Tool Studio: the verdict lands on the stage (a pill and the caption);
       the full message stays in Why, and Show the answer moves to the dock. */
    function studioFb(){
      var el = $('.pb-fb'), mark = el.querySelector('.chem-mark'), btn = el.querySelector('.pb-show');
      showSlot.innerHTML = '';
      if(btn){ btn.classList.add('ls-btn'); showSlot.appendChild(btn); }
      var c = el.cloneNode(true); [].slice.call(c.querySelectorAll('.chem-mark, button')).forEach(function(x){ x.remove(); });
      var msg = c.textContent.replace(/\s+/g, ' ').trim();
      LS.pills(mark ? [{ html: mark.textContent, tone: mark.classList.contains('ok') ? 'good' : /Shown/.test(mark.textContent) ? 'warn' : 'bad' }] : [], 'left', 'explore');
      LS.caption(mark ? '<b>' + esc(mark.textContent) + '.</b> ' + esc(msg) : msg ? esc(msg) : esc(instruction()), 'explore');
    }
    function instruction(){ var t = $('.pb-text .bt-small'); return t ? t.textContent : ''; }
    /* Tool Studio arrangement: the equation and the two boxes on the stage;
       the particles to add, Check my box and Empty the box in the dock; the
       atom tally, the problem and another kind in Details. */
    function studio(pane, s){
      LS = s;
      showSlot = document.createElement('div'); showSlot.className = 'pb-ls-show';
      var row = document.createElement('div'); row.className = 'pb-ls-btns';
      var chk = $('.pb-check'), clr = $('.pb-clear');
      chk.classList.add('ls-btn', 'ls-pri'); clr.classList.add('ls-btn');
      row.appendChild(chk); row.appendChild(clr);
      var f = $('.pb-fb'); f.removeAttribute('aria-live'); f.removeAttribute('role');
      var tally = $('details.pb-tally-d'); tally.open = true;
      SP = T.studioPane(pane, s, { stage: [$('.pb-text'), $('.pb-boxes')], dock: [$('.pb-palette'), row, showSlot], setup: 'Kind', moreLabel: 'Another kind of picture, new problem',
        why: [f], details: [tally] });
      studioDraw(); studioFb();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.pb-chip'), text: 'Tap or drag a particle into your box' });
    }
    function studioDraw(){
      if(!LS || !SP) return;
      var counts = {}; keys.forEach(function(k){ counts[k] = mine[k]; });
      var a0 = M.atomsOf(before), a1 = M.atomsOf(counts), off = Object.keys(a0).filter(function(el){ return a0[el] !== (a1[el] || 0); }).length;
      var any = keys.some(function(k){ return mine[k] > 0; });
      LS.pills([!any ? { html: 'Your box is empty', tone: 'ghost' } : off ? { html: off + ' element' + (off === 1 ? '' : 's') + ' not balanced', tone: 'warn' } : { html: 'Every atom conserved ✓', tone: 'good' }], 'right', 'explore');
      SP.setup(TITLE[p.type]);
    }
    function check(){
      var counts = {}; keys.forEach(function(k){ counts[k] = mine[k]; });
      var a0 = M.atomsOf(before), a1 = M.atomsOf(counts);
      var lost = Object.keys(a0).filter(function(el){ return a0[el] !== (a1[el] || 0); });
      var right = p.type === 'limiting' ? p.extra.after : p.extra.eq;
      var ok = keys.every(function(k){ return (right[k] || 0) === counts[k]; });
      if(ok){ fb('<span class="chem-mark ok">Correct</span> ' + p.why[0]); return; }
      var msg;
      if(lost.length) msg = 'Atoms are not conserved: ' + lost.map(function(el){ return el + ' (' + (a1[el] || 0) + ' after, ' + a0[el] + ' before)'; }).join(', ') + '. Every atom in the before box must appear in the after box.';
      else if(p.type === 'limiting'){
        var lim = Object.keys(before).filter(function(k){ return right[k] === 0 && before[k] > 0; })[0];
        msg = counts[lim] > 0 ? 'Atoms balance, but there is still ' + (NAMES[lim] || lim) + ' left. The reaction goes to completion: it runs until ' + (NAMES[lim] || lim) + ', the limiting reactant, is gone.'
          : 'Atoms balance, but too much reacted: with no ' + (NAMES[lim] || lim) + ' left, the reaction cannot go further, so the other reactant must have some left over in the coefficient ratio.';
        if(keys.some(function(k){ return before[k] === undefined && counts[k] !== right[k]; }) && counts[lim] === 0) msg = 'Atoms balance, but the products are not in the ratio of the coefficients. Count the reaction events: each one uses the reactants and makes the products exactly as the equation says.';
      } else {
        var q = counts.A2 * counts.B2 ? counts.AB * counts.AB / (counts.A2 * counts.B2) : Infinity;
        msg = !isFinite(q) ? 'Atoms balance, but a reactant is gone: that is complete reaction. At equilibrium some of every species remains.'
          : counts.AB === 0 ? 'Atoms balance, but nothing has reacted: Q = 0, far below K.'
          : 'Atoms balance, but Q = ' + M.fmt(q, 3) + ' is ' + (q < p.extra.K ? 'below' : 'above') + ' K = ' + M.fmt(p.extra.K, 3) + ': ' + (q < p.extra.K ? 'let more A₂ and B₂ react (each event turns one A₂ and one B₂ into 2 AB).' : 'undo some reaction events (each turns 2 AB back into one A₂ and one B₂).');
      }
      fb('<span class="chem-mark no">Not yet</span> ' + msg + ' <button type="button" class="bt-btn pb-show">Show the answer</button>');
      $('.pb-show').addEventListener('click', function(){ keys.forEach(function(k){ mine[k] = right[k] || 0; }); draw(); fb('<span class="chem-mark no">Shown</span> ' + p.why[0]); });
    }
    fresh();
    return { studio: studio };
  }
})();
