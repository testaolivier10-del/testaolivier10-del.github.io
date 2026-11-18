/* NREMT Mnemonics, tools v2 Explore (docs/tools-v2-nremt-mnemonics-brief.md; standard docs/tools-v2-standard.md).

   THE IDEA: a mnemonic is the order of an assessment you actually do. Each letter is one thing you look for, feel
   for or ask, so Explore puts the letters on a drawn patient: tap a letter and the EMT does that check, and the
   picture shows what the letter finds. Four tabs, one patient story each: DCAP-BTLS (a rider after a crash),
   AVPU (a man found on the sidewalk), OPQRST and SAMPLE (a woman with chest pain on the stretcher).

   THE PICTURE is the course's rendered body (body-figs/, BodyParts3D; the body map's and the skill stations'
   figure), lying on its back and seen from above, on a drawn surface. Everything on the body is drawn in the
   image's own pixels (480 x 1200) inside one group, which lies across a wide stage (head left) or along a tall one
   (head up). Labels and speech bubbles are HTML over it, placed from the same transform.

   RULES KEPT (docs/tools-v2-builder-brief.md, lessons): a label or a result word appears only once the picture
   shows it; the cause line's last pill waits for the picture; every change animates (grow, fade, the hand moves
   in); reduced motion gets a short cross fade and the full result at once; the one cue never covers a key.

     var ex = NremtMnemonics.build({ studio })   -> { stage, ref, tab(id?), tabOf(cardId), onTest(fn) }

   The page (nremt/mnemonics.html) hands ex.stage and ex.ref to NremtStudio.kit2, with the old card screen as
   Test yourself. Medical content: checked against the course's notes and the sources in
   docs/nremt-lessons-spec.md; open points in docs/nremt-needs-author.md. */
(function(){
  'use strict';
  if(window.NremtMnemonics) return;
  var NS = 'http://www.w3.org/2000/svg';
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function rng(seed){ var s = seed >>> 0; return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ------------------------------------------------------------------ the four patients
     at: the point on the body (image px; the patient's left is the image's right). label: 1 to 3 words, names
     what is drawn. find: the cause line's last pill. ask / say: the EMT's question and the patient's answer. */
  var TABS = [
    { id: 'dcap', card: 'm-dcap-btls', name: 'DCAP-BTLS', fig: 'adult-front', set: 'body', scene: 'road', kind: 'marks',
      purpose: 'Each letter is one injury you look and feel for.',
      who: 'Rider after a motorcycle crash',
      idle: [{ t: '8 letters', role: 'key' }, { t: '8 things to look and feel for', role: 'word' }],
      take: 'Eight letters, eight things to look and feel for. On a real patient you check every body region for all eight.',
      letters: [
        { k: 'D', word: 'Deformity', label: 'Deformity', at: [432, 522], find: 'left forearm bent out of line' },
        { k: 'C', word: 'Contusion', label: 'Contusion', at: [190, 292], find: 'bruise on the right chest' },
        { k: 'A', word: 'Abrasion', label: 'Abrasion', at: [300, 870], find: 'road rash on the left knee' },
        { k: 'P', word: 'Puncture', label: 'Puncture', at: [184, 806], find: 'small hole in the right thigh' },
        { k: 'B', word: 'Burn', label: 'Burn', at: [196, 992], find: 'exhaust pipe burn on the right calf' },
        { k: 'T', word: 'Tenderness', label: 'Tenderness', at: [284, 440], find: 'pain when you press the belly', feel: true },
        { k: 'L', word: 'Laceration', label: 'Laceration', at: [244, 50], find: 'cut on the forehead' },
        { k: 'S', word: 'Swelling', label: 'Swelling', at: [180, 1118], find: 'right ankle puffed up' }
      ] },
    { id: 'avpu', card: 'm-avpu', name: 'AVPU', fig: 'adult-front', set: 'body', scene: 'walk', kind: 'ladder',
      purpose: 'Each letter is how much it takes to get a response.',
      who: 'Man found on the sidewalk',
      idle: [{ t: '4 letters', role: 'key' }, { t: 'voice first, then pain', role: 'word' }],
      take: 'Voice before pain: the first thing that gets a response sets the letter.',
      letters: [
        { k: 'A', word: 'Alert', find: 'eyes open on their own', steps: ['open'] },
        { k: 'V', word: 'Verbal', find: 'responds to your voice', steps: ['voice', 'open'] },
        { k: 'P', word: 'Pain', find: 'responds only to pain', steps: ['voice', 'none', 'squeeze', 'grimace'] },
        { k: 'U', word: 'Unresponsive', find: 'no response to voice or pain', steps: ['voice', 'none', 'squeeze', 'none2'] }
      ] },
    { id: 'opqrst', card: 'm-opqrst', name: 'OPQRST', fig: 'female-front', set: 'case', scene: 'store', kind: 'talk',
      purpose: 'Each letter is one question about her pain.',
      who: 'Woman, 58, with chest pain',
      idle: [{ t: '6 letters', role: 'key' }, { t: '6 questions about one pain', role: 'word' }],
      take: 'Six questions turn "my chest hurts" into a full picture of the pain.',
      letters: [
        { k: 'O', word: 'Onset', ask: 'What were you doing when it started?', say: 'Pushing my cart. It came on all at once.', find: 'sudden, while shopping', mark: 'cart', label: 'Her cart' },
        { k: 'P', word: 'Provocation', ask: 'Does anything make it better or worse?', say: 'Walking makes it worse. Resting doesn’t help.', find: 'worse with walking', mark: 'legs', label: 'Worse walking' },
        { k: 'Q', word: 'Quality', ask: 'What does it feel like?', say: 'Crushing. Like a weight on my chest.', find: 'crushing', mark: 'chest', label: 'Crushing' },
        { k: 'R', word: 'Radiation', ask: 'Does it spread anywhere?', say: 'Down my left arm.', find: 'spreads down the left arm', mark: 'arm', label: 'Left arm' },
        { k: 'S', word: 'Severity', ask: 'From 0 to 10, how bad is it?', say: 'An 8.', find: '8 out of 10', mark: 'scale', label: '8 of 10' },
        { k: 'T', word: 'Time', ask: 'How long has it been going on?', say: 'About 20 minutes. It hasn’t let up.', find: '20 minutes, constant', mark: 'watch', label: '20 minutes' }
      ] },
    { id: 'sample', card: 'm-sample', name: 'SAMPLE', fig: 'female-front', set: 'case', scene: 'store', kind: 'talk',
      purpose: 'Each letter is one part of her history.',
      who: 'Woman, 58, with chest pain',
      idle: [{ t: '6 letters', role: 'key' }, { t: 'her whole history', role: 'word' }],
      take: 'Six letters, her whole history. OPQRST is how you dig into the S.',
      letters: [
        { k: 'S', word: 'Signs and symptoms', ask: 'What’s bothering you most?', say: 'My chest hurts, and I feel sick.', find: 'chest pain; pale and sweaty', mark: 'signs', label: 'Pale, sweaty' },
        { k: 'A', word: 'Allergies', ask: 'Are you allergic to any medicines?', say: 'No. None that I know of.', find: 'no known allergies', mark: 'none', label: '' },
        { k: 'M', word: 'Medications', ask: 'What medicines do you take?', say: 'Nitroglycerin, and a blood pressure pill.', find: 'nitroglycerin, blood pressure pill', mark: 'pills', label: 'Her pills' },
        { k: 'P', word: 'Past history', ask: 'Any heart or other medical problems?', say: 'High blood pressure. A heart stent two years ago.', find: 'high blood pressure, heart stent', mark: 'none', label: '' },
        { k: 'L', word: 'Last oral intake', ask: 'When did you last eat or drink?', say: 'Just this coffee, an hour ago.', find: 'coffee, an hour ago', mark: 'cup', label: 'Coffee' },
        { k: 'E', word: 'Events', ask: 'What happened right before it started?', say: 'I was pushing my cart, and it hit me.', find: 'pushing her cart', mark: 'cart', label: 'Her cart' }
      ] }
  ];
  var BY = {}; TABS.forEach(function(t){ BY[t.id] = t; });

  /* the face, in image px (the head is about 200..282 across, 8..150 down) */
  var FACE = {
    browN: 'M215 66Q224 60 233 64M247 64Q256 60 265 66',
    browG: 'M215 62Q225 63 234 69M246 69Q255 63 265 62',
    lidC: 'M216 77Q224 81 232 77M248 77Q256 81 264 77',
    lidG: 'M215 76Q224 80 233 75M247 75Q256 80 265 76M214 72L218 74M266 72L262 74',
    nose: 'M240 80Q237 92 236 99Q240 103 245 99',
    mouthN: 'M230 119Q240 123 250 119',
    mouthG: 'M228 120Q234 113 240 115Q246 113 252 120Q240 125 228 120Z'
  };
  var HAND = 'M-17 -34C-19 -22 -16 -8 -9 -2C-4 2 4 2 9 -2C16 -8 19 -22 17 -34L15 -64L-15 -64Z';

  function build(o){
    var K = window.LevlKit2, studio = o && o.studio;
    var reduced = function(){ return K.reduced(); };
    var St = { tab: 'dcap', done: {}, cur: {}, took: {} };
    TABS.forEach(function(t){ St.done[t.id] = {}; St.cur[t.id] = -1; });

    /* ---------------------------------------------------- the stage */
    var stage = el('div', 'mn2');
    var tabs = K.tabs({ label: 'Which mnemonic', items: TABS.map(function(t){ return { value: t.id, label: t.name }; }), value: St.tab, big: true, onChange: function(v){ setTab(v, true); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: BY[St.tab].purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var box = el('div', 'mn2-scene');
    box.id = 'mn2-scene';
    box.innerHTML = '<svg class="mn2-svg" role="img" aria-label="" xmlns="' + NS + '" data-ls-text="keep"><g class="mn2-bg"></g><g class="mn2-fig"></g><g class="mn2-fx"></g></svg>' +
      '<div class="mn2-who" aria-hidden="true"></div>' +
      '<div class="mn2-talk" aria-hidden="true"><p class="mn2-bub is-emt"><b class="mn2-bub-k">EMT</b><span class="mn2-bub-t"></span></p><p class="mn2-bub is-pt"><span class="mn2-bub-t"></span></p></div>' +
      '<div class="mn2-labels" aria-hidden="true"></div>' +
      '<div class="mn2-keys" role="radiogroup" aria-label="Letters"></div>';
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', box.id); });
    stage.appendChild(box);
    var svg = box.querySelector('svg'), gBg = svg.querySelector('.mn2-bg'), gFig = svg.querySelector('.mn2-fig'), gFx = svg.querySelector('.mn2-fx');
    var who = box.querySelector('.mn2-who'), talk = box.querySelector('.mn2-talk'), bubE = talk.querySelector('.is-emt'), bubP = talk.querySelector('.is-pt');
    var labels = box.querySelector('.mn2-labels'), keys = box.querySelector('.mn2-keys');
    var layer = K.layer(box);
    var lines = el('div', 'mn2-lines');
    var cause = K.cause({ label: 'What this letter finds' });
    var acts = el('div', 'mn2-acts', '<button type="button" class="tk2-btn mn2-next">Next letter</button><button type="button" class="tk2-link mn2-reset">Start over</button>');
    var bNext = acts.querySelector('.mn2-next'), bReset = acts.querySelector('.mn2-reset');
    lines.appendChild(cause.el); lines.appendChild(acts);
    stage.appendChild(lines);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite');
    stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    var FIGS = {}, G = null, timers = [], token = 0;
    function later(ms, fn){ var my = token; timers.push(setTimeout(function(){ if(my === token) fn(); }, reduced() ? 0 : ms)); }
    function stopAll(){ token++; timers.forEach(clearTimeout); timers = []; }

    /* ---- geometry: image px -> stage px */
    function layout(){
      var W = box.clientWidth, H = box.clientHeight;
      if(!W || !H) return null;
      var wide = W >= H * 1.05, phone = W < 600;
      var keyH = phone ? 62 : 70, top = wide ? (phone ? 92 : 104) : 10, side = wide ? 0 : Math.min(170, W * 0.4);
      var k, cx, cy, availH = H - keyH - top - 8;
      if(wide){
        k = Math.min((W - (phone ? 24 : 70)) / 1200, availH / 470);
        cx = W / 2; cy = top + availH / 2 + 4;
      } else {
        k = Math.min(availH / 1205, (W - side - 16) / 470);
        cx = 8 + (W - side - 16) / 2 + 4; cy = top + availH / 2 + 2;
      }
      var a = wide ? -Math.PI / 2 : 0;
      return { W: W, H: H, wide: wide, phone: phone, k: k, cx: cx, cy: cy, a: a, top: top, keyH: keyH, side: side,
        tf: 'translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') rotate(' + (wide ? -90 : 0) + ') scale(' + k.toFixed(4) + ') translate(-240 -600)' };
    }
    function P(x, y){ // image px -> stage px
      var dx = (x - 240) * G.k, dy = (y - 600) * G.k;
      return G.wide ? [G.cx + dy, G.cy - dx] : [G.cx + dx, G.cy + dy];
    }
    // the outward direction from the body's long axis at an image point (where a label goes)
    function outward(x){ var s = x >= 240 ? 1 : -1; return G.wide ? [0, -s] : [s, 0]; }

    /* ---- the surface under the patient (stage px) */
    function svgEl(tag, attrs, parent){ var e = document.createElementNS(NS, tag); for(var a in attrs) e.setAttribute(a, attrs[a]); if(parent) parent.appendChild(e); return e; }
    function surface(t){
      var W = G.W, H = G.H, r = rng(t.scene === 'road' ? 7 : t.scene === 'walk' ? 11 : 3), h = [], i;
      h.push('<defs>' +
        '<filter id="mn2-blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="' + (8 * G.k + 2).toFixed(1) + '"/></filter>' +
        '<radialGradient id="mn2-pain"><stop offset="0" stop-color="#E5482F" stop-opacity=".75"/><stop offset=".55" stop-color="#E5482F" stop-opacity=".35"/><stop offset="1" stop-color="#E5482F" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="mn2-ring"><stop offset=".6" stop-color="#FFE9A8" stop-opacity="0"/><stop offset=".82" stop-color="#FFE9A8" stop-opacity=".55"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="mn2-scale" x1="0" x2="1"><stop offset="0" stop-color="#3FA34D"/><stop offset=".5" stop-color="#F2C230"/><stop offset="1" stop-color="#D2382B"/></linearGradient>' +
        '</defs>');
      if(t.scene === 'road'){
        h.push('<rect class="mn2-asph" x="0" y="0" width="' + W + '" height="' + H + '"/>');
        for(i = 0; i < Math.round(W * H / 900); i++) h.push('<circle class="mn2-grit' + (i % 3) + '" cx="' + (r() * W).toFixed(1) + '" cy="' + (r() * H).toFixed(1) + '" r="' + (0.6 + r() * 1.3).toFixed(1) + '"/>');
        // lane line along the road and a skid mark toward the patient's feet
        var ly = G.wide ? G.top * 0.45 : 0, lx = G.wide ? 0 : G.W - G.side * 0.35;
        if(G.wide) for(i = -1; i < W / 90 + 1; i++) h.push('<rect class="mn2-lane" x="' + (i * 90 + 10) + '" y="' + (ly - 3) + '" width="52" height="7" rx="2"/>');
        else for(i = -1; i < H / 90 + 1; i++) h.push('<rect class="mn2-lane" x="' + (lx - 3) + '" y="' + (i * 90 + 10) + '" width="7" height="52" rx="2"/>');
        var f = P(240, 1210), f2 = G.wide ? [W + 20, f[1] + 30] : [f[0] + 40, H + 20];
        h.push('<path class="mn2-skid" d="M' + f[0].toFixed(1) + ' ' + f[1].toFixed(1) + 'Q' + ((f[0] + f2[0]) / 2 + 20) + ' ' + ((f[1] + f2[1]) / 2 - 10) + ' ' + f2[0] + ' ' + f2[1] + '"/>');
        for(i = 0; i < 9; i++){ var p = P(60 + r() * 380, 1150 + r() * 180); h.push('<path class="mn2-shard" d="M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + 'l' + (4 + r() * 5).toFixed(1) + ' ' + (-2 - r() * 3).toFixed(1) + 'l' + (2 + r() * 3).toFixed(1) + ' ' + (4 + r() * 3).toFixed(1) + 'z"/>'); }
      } else if(t.scene === 'walk'){
        h.push('<rect class="mn2-conc" x="0" y="0" width="' + W + '" height="' + H + '"/>');
        var slab = Math.max(110, 330 * G.k);
        for(i = 1; i < W / slab + 1; i++) h.push('<line class="mn2-joint" x1="' + (i * slab).toFixed(1) + '" y1="0" x2="' + (i * slab).toFixed(1) + '" y2="' + H + '"/>');
        for(i = 1; i < H / slab + 1; i++) h.push('<line class="mn2-joint" x1="0" y1="' + (i * slab).toFixed(1) + '" x2="' + W + '" y2="' + (i * slab).toFixed(1) + '"/>');
        for(i = 0; i < Math.round(W * H / 1400); i++) h.push('<circle class="mn2-speck" cx="' + (r() * W).toFixed(1) + '" cy="' + (r() * H).toFixed(1) + '" r="' + (0.5 + r()).toFixed(1) + '"/>');
        // the curb and a strip of road along the far edge
        if(G.wide) h.push('<rect class="mn2-road" x="0" y="' + (H - G.keyH - 2) + '" width="' + W + '" height="' + (G.keyH + 2) + '"/><rect class="mn2-curb" x="0" y="' + (H - G.keyH - 14) + '" width="' + W + '" height="14"/>');
        else h.push('<rect class="mn2-road" x="' + (W - 26) + '" y="0" width="26" height="' + H + '"/><rect class="mn2-curb" x="' + (W - 38) + '" y="0" width="12" height="' + H + '"/>');
      } else {
        h.push('<rect class="mn2-floor" x="0" y="0" width="' + W + '" height="' + H + '"/>');
        var tile = Math.max(46, 120 * G.k);
        for(i = 0; i < W / tile + 1; i++) for(var j = 0; j < H / tile + 1; j++) if((i + j) % 2) h.push('<rect class="mn2-tile" x="' + (i * tile).toFixed(1) + '" y="' + (j * tile).toFixed(1) + '" width="' + tile.toFixed(1) + '" height="' + tile.toFixed(1) + '"/>');
        h.push(shelves());
      }
      gBg.innerHTML = h.join('');
    }
    // store shelves along the edges, seen from above: rows of packages
    function shelves(){
      var W = G.W, H = G.H, r = rng(19), h = [], cols = ['#C8463A', '#E9B23C', '#3C7DBF', '#5BA35A', '#F2EDE2', '#8E5BB5', '#E07B39'];
      function row(x0, y0, len, depth, along){
        h.push('<rect class="mn2-shelf" x="' + x0 + '" y="' + y0 + '" width="' + (along ? len : depth) + '" height="' + (along ? depth : len) + '" rx="3"/>');
        var at = 4;
        while(at < len - 10){
          var w = 14 + r() * 22, c = cols[Math.floor(r() * cols.length)], d = depth * (0.55 + r() * 0.3);
          if(along) h.push('<rect class="mn2-pack" fill="' + c + '" x="' + (x0 + at).toFixed(1) + '" y="' + (y0 + (depth - d) / 2).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + d.toFixed(1) + '" rx="2"/>');
          else h.push('<rect class="mn2-pack" fill="' + c + '" x="' + (x0 + (depth - d) / 2).toFixed(1) + '" y="' + (y0 + at).toFixed(1) + '" width="' + d.toFixed(1) + '" height="' + w.toFixed(1) + '" rx="2"/>');
          at += w + 3;
        }
      }
      var d = G.phone ? 26 : 34;
      if(G.wide){ row(0, 0, W, d, true); }
      else { row(W - d, 0, H, d, false); }
      return h.join('');
    }

    /* ---- the patient (image px, inside the transformed group) */
    function figure(t){
      var F = FIGS[t.set] && FIGS[t.set].figs[t.fig], h = [];
      if(!F){ gFig.innerHTML = ''; return; }
      var url = FIGS[t.set].url(F), female = t.fig === 'female-front';
      h.push('<defs><clipPath id="mn2-body-' + t.id + '"><path d="' + F.outline + '"/></clipPath>' +
        '<clipPath id="mn2-headc-' + t.id + '"><ellipse cx="240" cy="80" rx="44" ry="74"/></clipPath></defs>');
      if(t.scene === 'store'){
        // the stretcher: frame, mattress, pillow
        h.push('<rect class="mn2-cot" x="62" y="-60" width="356" height="1300" rx="34"/><rect class="mn2-mat" x="76" y="-46" width="328" height="1272" rx="28"/>' +
          '<ellipse class="mn2-pillow" cx="240" cy="60" rx="110" ry="74"/>');
      } else h.push('<path class="mn2-shadow" d="' + F.outline + '" transform="translate(10 14)" filter="url(#mn2-blur)"/>');
      // the rider's shirt, cut up the front and spread under him for the exam
      if(t.scene === 'road') h.push('<path class="mn2-shirt" d="M58 232L132 194L348 194L422 232L440 300L428 340L436 380L420 410L424 452L396 470L84 470L56 452L60 410L44 380L52 340L40 300Z"/>');
      if(female) h.push('<path class="mn2-hairb" d="M170 92C150 40 186 -18 240 -16C296 -18 332 40 310 94C306 128 290 150 282 156L282 70L198 70L198 156C188 148 172 126 170 92Z"/>');
      if(t.scene === 'walk') h.push('<path class="mn2-hood" d="M140 214Q150 150 240 140Q330 150 340 214Q300 186 240 184Q180 186 140 214Z"/>');
      h.push('<image href="' + url + '" x="0" y="0" width="' + F.w + '" height="' + F.h + '"/>');
      // clothes, clipped to the body: shorts (rider; shirt cut away for the exam), hoodie and jeans, a blouse
      var c = [];
      if(t.scene === 'road') c.push('<path class="mn2-cl mn2-denim" d="M110 526Q240 542 370 526L356 772L258 778L243 716L237 716L222 778L124 772Z"/><path class="mn2-cl mn2-belt" d="M110 526Q240 542 370 526L370 536Q240 552 110 536Z"/>');
      if(t.scene === 'walk') c.push('<path class="mn2-cl mn2-hood" d="M0 168L480 168L480 590L0 590Z"/><path class="mn2-cl mn2-denim" d="M110 590L370 590L384 1130L96 1130Z"/>');
      if(female) c.push('<path class="mn2-cl mn2-blouse" d="M0 176L480 176L480 440L360 440L360 580L120 580L120 440L0 440Z"/>');
      if(c.length) h.push('<g clip-path="url(#mn2-body-' + t.id + ')">' + c.join('') + '</g>');
      if(t.scene === 'walk') h.push('<path class="mn2-pocket" d="M196 470Q240 486 284 470L292 548Q240 560 188 548Z"/>' + shoe(168) + shoe(312));
      if(female){
        // the sheet over her legs, with folds
        h.push('<path class="mn2-sheet" d="M96 560C160 540 320 540 384 560L392 1196C320 1214 160 1214 88 1196Z"/><path class="mn2-fold" d="M150 640C190 700 170 860 200 1000M330 620C300 760 320 900 290 1120M240 600C246 720 230 860 244 1180"/>');
        h.push('<path class="mn2-hairf" d="M197 66C198 30 214 8 240 6C268 8 284 32 283 66C276 46 262 34 240 33C220 34 205 46 197 66Z"/>');
      } else h.push('<path class="mn2-hair" d="M199 70C196 30 214 5 240 4C267 5 285 30 281 70C276 50 266 38 254 34C244 31 236 31 226 34C214 38 204 50 199 70Z"/>');
      // the face: brows, eyes (open or closed), nose, mouth; each state a group that fades
      h.push('<g class="mn2-face">' +
        '<path class="mn2-nose" d="' + FACE.nose + '"/>' +
        '<g class="mn2-f is-open"><path class="mn2-brow" d="' + FACE.browN + '"/>' + eye(224) + eye(256) + '<path class="mn2-mouth" d="' + FACE.mouthN + '"/></g>' +
        '<g class="mn2-f is-closed"><path class="mn2-brow" d="' + FACE.browN + '"/><path class="mn2-lid" d="' + FACE.lidC + '"/><path class="mn2-mouth" d="' + FACE.mouthN + '"/></g>' +
        '<g class="mn2-f is-grim"><path class="mn2-brow" d="' + FACE.browG + '"/><path class="mn2-lid" d="' + FACE.lidG + '"/><path class="mn2-mouthg" d="' + FACE.mouthG + '"/></g>' +
        '</g>');
      h.push(marksSvg(t));
      gFig.innerHTML = '<g class="mn2-body" transform="' + G.tf + '">' + h.join('') + '</g>';
    }
    function shoe(x){ return '<path class="mn2-shoe" d="M' + (x - 19) + ' 1150C' + (x - 22) + ' 1180 ' + (x - 14) + ' 1198 ' + x + ' 1198C' + (x + 14) + ' 1198 ' + (x + 22) + ' 1180 ' + (x + 19) + ' 1150C' + (x + 12) + ' 1140 ' + (x - 12) + ' 1140 ' + (x - 19) + ' 1150Z"/><path class="mn2-lace" d="M' + (x - 7) + ' 1156h14M' + (x - 7) + ' 1164h14M' + (x - 7) + ' 1172h14"/>'; }
    function eye(x){ return '<ellipse class="mn2-white" cx="' + x + '" cy="77" rx="7.5" ry="4.2"/><circle class="mn2-iris" cx="' + x + '" cy="77" r="3.4"/><circle class="mn2-pupil" cx="' + x + '" cy="77" r="1.5"/><path class="mn2-lidu" d="M' + (x - 8) + ' 76Q' + x + ' 71 ' + (x + 8) + ' 76"/>'; }

    // what each letter draws on the body (image px); shown by state, each its own group
    function marksSvg(t){
      var h = [];
      if(t.id === 'dcap'){
        h.push(mk(0, '<path class="mn2-deform" d="M426 484C434 500 452 512 452 524C452 536 436 548 427 564Z"/><path class="mn2-deform-e" d="M426 484C434 500 452 512 452 524C452 536 436 548 427 564"/><path class="mn2-crease" d="M400 530Q418 524 440 534"/><ellipse class="mn2-bruise" cx="438" cy="524" rx="10" ry="16" opacity=".35"/>'));
        h.push(mk(1, '<ellipse class="mn2-bruise" cx="190" cy="292" rx="30" ry="24" transform="rotate(-20 190 292)"/><ellipse class="mn2-bruise2" cx="186" cy="290" rx="16" ry="12"/>'));
        h.push(mk(2, '<ellipse class="mn2-abr" cx="300" cy="870" rx="24" ry="30"/>' + streaks(300, 870)));
        h.push(mk(3, '<circle class="mn2-punc-r" cx="184" cy="806" r="9"/><circle class="mn2-punc" cx="184" cy="806" r="4.2"/><path class="mn2-drip" d="M184 811Q182 822 185 830Q188 822 186 811Z"/>'));
        h.push(mk(4, '<ellipse class="mn2-burn" cx="196" cy="992" rx="11" ry="32"/><ellipse class="mn2-blister" cx="195" cy="980" rx="5" ry="7"/><ellipse class="mn2-blister" cx="198" cy="1004" rx="4" ry="5"/>'));
        h.push(mk(5, '<path class="mn2-ouch" d="M284 392v-14M318 406l10 -10M250 406l-10 -10M330 440h14M238 440h-14"/>'));
        h.push(mk(6, '<path class="mn2-lac-e" d="M228 52Q244 46 262 50"/><path class="mn2-lac" d="M229 52Q244 47 261 50"/><path class="mn2-drip" d="M252 50Q250 58 253 64Q256 58 254 50Z"/>'));
        h.push(mk(7, '<path class="mn2-swell" d="M162 1094C150 1106 150 1132 162 1144L198 1144C210 1132 210 1106 198 1094Z"/><path class="mn2-swell-s" d="M166 1104Q160 1120 167 1136M194 1104Q200 1120 193 1136"/>'));
      } else if(t.id === 'opqrst'){
        h.push(mk('chest', '<circle cx="246" cy="296" r="70" fill="url(#mn2-pain)" class="mn2-glow"/><path class="mn2-press" d="M234 212L258 212L246 236ZM234 380L258 380L246 356ZM162 284L162 308L186 296ZM330 284L330 308L306 296Z"/>'));
        h.push(mk('arm', '<path class="mn2-rad" d="M270 290C306 262 334 236 350 238C374 250 388 330 400 400C410 460 418 520 424 586"/><path class="mn2-radh" d="M412 568L424 594L436 568"/>'));
        h.push(mk('watch', '<rect class="mn2-band" x="412" y="586" width="32" height="20" rx="4"/><circle class="mn2-wface" cx="428" cy="596" r="11"/><path class="mn2-whand" d="M428 596V588M428 596L434 600"/>'));
        h.push(mk('legs', '<path class="mn2-walk" d="M150 760C140 860 160 980 170 1090M330 760C340 860 320 980 310 1090"/>'));
      } else if(t.id === 'sample'){
        h.push(mk('signs', '<g clip-path="url(#mn2-headc-sample)"><rect class="mn2-pale" x="190" y="0" width="100" height="160"/></g>' +
          '<path class="mn2-sweat" d="M222 48q-3 6 0 9q3 -3 0 -9zM252 42q-3 6 0 9q3 -3 0 -9zM268 58q-3 6 0 9q3 -3 0 -9zM212 92q-3 6 0 9q3 -3 0 -9zM266 98q-3 6 0 9q3 -3 0 -9z"/>' +
          '<circle cx="246" cy="296" r="58" fill="url(#mn2-pain)" class="mn2-glow"/>'));
      }
      return h.join('');
    }
    function mk(i, inner){ return '<g class="mn2-mk" data-m="' + i + '">' + inner + '</g>'; }
    function streaks(cx, cy){ var s = ''; for(var i = -3; i <= 3; i++) s += '<path class="mn2-streak" d="M' + (cx + i * 6 - 4) + ' ' + (cy - 22) + 'L' + (cx + i * 6 + 3) + ' ' + (cy + 24) + '"/>'; return s; }

    /* ---- props in stage px: the cart (with the coffee), her pills, the pain scale */
    function props(t){
      gFx.innerHTML = '';
      if(t.scene !== 'store' || !G) return;
      var u = G.k, h = [];
      // the cart beside her feet
      var f = P(470, 1080), cw = 170 * u, ch = 250 * u;
      if(!G.wide){ f = P(-40, 1020); }
      var cx = f[0], cy = f[1], tr = G.wide ? 'translate(' + (cx + 10).toFixed(1) + ' ' + (cy - ch / 2 - 10).toFixed(1) + ')' : 'translate(' + (cx - cw - 4).toFixed(1) + ' ' + (cy - ch / 2).toFixed(1) + ')';
      if(G.wide){ tr = 'translate(' + (P(240, 1250)[0] - cw * 0.2).toFixed(1) + ' ' + (P(470, 1000)[1] - ch * 0.15).toFixed(1) + ')'; }
      else { cw = Math.min(cw, G.side * 0.6); ch = cw * 250 / 170; tr = 'translate(' + (G.W - G.side + (G.side - cw) / 2 - 10).toFixed(1) + ' ' + (G.H - G.keyH - ch - 26).toFixed(1) + ')'; }
      h.push('<g class="mn2-cart" data-p="cart" transform="' + tr + '">' + cartSvg(cw, ch) + '</g>');
      // her purse with her pills, at the foot of the stretcher
      var ph = P(240, 1130), ps = Math.max(0.5, u * 1.25);
      h.push('<g class="mn2-prop mn2-purse" data-p="pills" transform="translate(' + ph[0].toFixed(1) + ' ' + ph[1].toFixed(1) + ') scale(' + ps.toFixed(3) + ')">' +
        '<path class="mn2-bag" d="M-34 -18Q-36 26 -30 30L30 30Q36 26 34 -18Z"/><path class="mn2-strap" d="M-24 -18Q0 -50 24 -18"/>' +
        '<rect class="mn2-bottle" x="-22" y="-28" width="16" height="26" rx="3"/><rect class="mn2-cap" x="-23" y="-34" width="18" height="8" rx="2"/>' +
        '<rect class="mn2-bottle" x="2" y="-24" width="14" height="22" rx="3"/><rect class="mn2-cap" x="1" y="-29" width="16" height="7" rx="2"/></g>');
      // the 0 to 10 scale, laid on the sheet over her legs
      var sc = P(240, 840), sw = Math.max(110, Math.min(240, (G.wide ? 420 : 280) * u)), sx = sc[0] - sw / 2, sy = sc[1] - 14;
      h.push('<g class="mn2-prop mn2-scale" data-p="scale" transform="translate(' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ')">' +
        '<rect class="mn2-scale-bg" x="-10" y="-10" width="' + (sw + 20) + '" height="48" rx="10"/>' +
        '<rect x="0" y="0" width="' + sw + '" height="10" rx="5" fill="url(#mn2-scale)"/>' +
        [0, 5, 10].map(function(n){ return '<text class="mn2-scale-n" x="' + (sw * n / 10).toFixed(1) + '" y="30" text-anchor="middle">' + n + '</text>'; }).join('') +
        '<circle class="mn2-scale-d" cx="' + (sw * 0.8).toFixed(1) + '" cy="5" r="8"/></g>');
      gFx.innerHTML = h.join('');
    }
    function cartSvg(w, h){
      var s = '<rect class="mn2-cart-b" x="0" y="0" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="6"/>', i, n = 7;
      for(i = 1; i < n; i++) s += '<line class="mn2-cart-w" x1="' + (w * i / n).toFixed(1) + '" y1="0" x2="' + (w * i / n).toFixed(1) + '" y2="' + h.toFixed(1) + '"/>';
      for(i = 1; i < 10; i++) s += '<line class="mn2-cart-w" x1="0" y1="' + (h * i / 10).toFixed(1) + '" x2="' + w.toFixed(1) + '" y2="' + (h * i / 10).toFixed(1) + '"/>';
      s += '<rect class="mn2-cart-h" x="' + (-w * 0.06).toFixed(1) + '" y="' + (h + 4).toFixed(1) + '" width="' + (w * 1.12).toFixed(1) + '" height="' + Math.max(6, h * 0.05).toFixed(1) + '" rx="4"/>';
      // groceries and the coffee in the cart
      s += '<rect class="mn2-pack" fill="#E9B23C" x="' + (w * 0.12) + '" y="' + (h * 0.5) + '" width="' + (w * 0.34) + '" height="' + (h * 0.18) + '" rx="3"/>' +
        '<rect class="mn2-pack" fill="#3C7DBF" x="' + (w * 0.52) + '" y="' + (h * 0.58) + '" width="' + (w * 0.3) + '" height="' + (h * 0.26) + '" rx="3"/>' +
        '<g class="mn2-cup" data-p="cup"><circle class="mn2-cup-o" cx="' + (w * 0.3) + '" cy="' + (h * 0.24) + '" r="' + (w * 0.13).toFixed(1) + '"/><circle class="mn2-cup-l" cx="' + (w * 0.3) + '" cy="' + (h * 0.24) + '" r="' + (w * 0.09).toFixed(1) + '"/></g>';
      return s;
    }

    /* ---------------------------------------------------- state -> picture */
    function T(){ return BY[St.tab]; }
    function face(state){ box.querySelectorAll('.mn2-f').forEach(function(g){ g.classList.toggle('is-on', g.classList.contains('is-' + state)); }); }
    function markOn(id, on){ var g = gFig.querySelector('.mn2-mk[data-m="' + id + '"]'); if(g) g.classList.toggle('is-on', !!on); }
    function propOn(id, on){ box.querySelectorAll('[data-p="' + id + '"]').forEach(function(g){ g.classList.toggle('is-lit', !!on); }); }
    var hand = null;
    function handTo(x, y, on, squeeze){
      if(!G) return;
      if(!hand){ hand = svgEl('g', { 'class': 'mn2-hand' }, gFx); hand.innerHTML = '<g class="mn2-hand-i"><rect class="mn2-sleeve" x="-19" y="-260" width="38" height="200" rx="10"/><rect class="mn2-cuff" x="-17" y="-72" width="34" height="12" rx="4"/><path class="mn2-glove" d="' + HAND + '"/><path class="mn2-knuck" d="M-8 -14v-10M0 -12v-12M8 -14v-10"/></g>'; }
      var p = P(x, y), d = outward(x), ang = Math.atan2(-d[1], -d[0]) * 180 / Math.PI - 90, s = Math.max(0.55, G.k * 1.15);
      hand.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') rotate(' + ang.toFixed(1) + ') scale(' + s.toFixed(3) + ')');
      hand.classList.toggle('is-on', !!on);
      hand.classList.toggle('is-squeeze', !!squeeze);
      if(gFx.lastChild !== hand) gFx.appendChild(hand);
    }

    /* put a label at (lx, ly), inside the picture and clear of the speech, the patient chip, the other labels and the
       badges: it slides along one axis until it is clear. A leader runs from it to the point it names. */
    function rel(e){ var r = e.getBoundingClientRect(), h = box.getBoundingClientRect(); return { l: r.left - h.left, t: r.top - h.top, r: r.right - h.left, b: r.bottom - h.top }; }
    function obstacles(self){
      var o = [];
      [bubE, bubP].forEach(function(x){ if(x.querySelector('.mn2-bub-t').textContent) o.push(rel(x)); });
      if(who.textContent) o.push(rel(who));
      labels.querySelectorAll('.mn2-lab, .mn2-badge').forEach(function(x){ if(x !== self) o.push(rel(x)); });
      return o;
    }
    function put(b, lx, ly, axis, pt){
      var bw = b.offsetWidth, bh = b.offsetHeight, obs = obstacles(b), best = null;
      function clampX(x){ return Math.max(4, Math.min(G.W - bw - 4, x)); }
      function clampY(y){ return Math.max(4, Math.min(G.H - G.keyH - bh - 4, y)); }
      function hits(x, y){ return obs.some(function(r){ return x < r.r + 3 && x + bw > r.l - 3 && y < r.b + 3 && y + bh > r.t - 3; }); }
      for(var i = 0; i < 40 && !best; i++){
        var sh = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 10, x = clampX(axis === 'x' ? lx + sh : lx), y = clampY(axis === 'y' ? ly + sh : ly);
        if(!hits(x, y)) best = [x, y];
      }
      if(!best) best = [clampX(lx), clampY(ly)];
      b.style.left = best[0].toFixed(1) + 'px'; b.style.top = best[1].toFixed(1) + 'px';
      if(pt){
        var ln = el('i', 'mn2-lead'), ax = best[0] + bw / 2, ay = best[1] + bh / 2;
        var len = Math.hypot(pt[0] - ax, pt[1] - ay), ang = Math.atan2(pt[1] - ay, pt[0] - ax);
        ln.style.left = ax.toFixed(1) + 'px'; ln.style.top = ay.toFixed(1) + 'px'; ln.style.width = Math.max(0, len - 4).toFixed(1) + 'px';
        ln.style.transform = 'rotate(' + ang.toFixed(3) + 'rad)';
        labels.insertBefore(ln, b);
        requestAnimationFrame(function(){ ln.classList.add('is-in'); });
      }
      requestAnimationFrame(function(){ b.classList.add('is-in'); });
      return b;
    }
    function label(text, x, y, cls, along){
      var p = P(x, y), d = along ? (G.wide ? [1, 0] : [0, 1]) : outward(x), b = el('span', 'mn2-lab' + (cls ? ' ' + cls : ''), esc(text));
      labels.appendChild(b);
      var bw = b.offsetWidth, bh = b.offsetHeight, gap = along ? 26 + 30 * G.k : 18 + 26 * G.k;
      var lx = p[0] + d[0] * gap - (d[0] < 0 ? bw : d[0] > 0 ? 0 : bw / 2), ly = p[1] + d[1] * gap - (d[1] < 0 ? bh : d[1] > 0 ? 0 : bh / 2);
      return put(b, lx, ly, d[0] ? 'y' : 'x', p);
    }
    function badge(text, x, y){
      var p = P(x, y), b = el('span', 'mn2-badge', esc(text));
      b.style.left = p[0].toFixed(1) + 'px'; b.style.top = p[1].toFixed(1) + 'px';
      labels.appendChild(b);
      requestAnimationFrame(function(){ b.classList.add('is-in'); });
    }
    var SQUEEZE = 'Squeezes the trapezius muscle (a painful stimulus)';
    function preset(e, p){ bubE.classList.remove('is-act');
      bubE.querySelector('.mn2-bub-t').textContent = e || ''; bubP.querySelector('.mn2-bub-t').textContent = p || ''; bubE.classList.remove('is-in'); bubP.classList.remove('is-in'); }
    function bubble(which, text){
      var b = which === 'emt' ? bubE : bubP;
      if(!text){ b.classList.remove('is-in'); b.querySelector('.mn2-bub-t').textContent = ''; return; }
      b.querySelector('.mn2-bub-t').textContent = text;
      b.classList.remove('is-in'); void b.offsetWidth; b.classList.add('is-in');
    }
    function placeTalk(){
      if(!G) return;
      var hp = P(240, 120);
      talk.style.left = ''; talk.style.top = ''; talk.style.width = '';
      if(G.wide){
        // above the patient, the EMT's line on the right, hers by her head
        talk.className = 'mn2-talk is-wide';
        talk.style.left = '10px'; talk.style.right = '10px'; talk.style.top = '8px'; talk.style.height = (G.top - 10) + 'px';
        bubP.style.left = Math.max(0, hp[0] - 30).toFixed(1) + 'px';
        bubP.style.maxWidth = Math.min(340, G.W * 0.42).toFixed(0) + 'px';
      } else {
        talk.className = 'mn2-talk is-tall';
        talk.style.left = (G.W - G.side - 2).toFixed(1) + 'px'; talk.style.right = '8px'; talk.style.top = (who.offsetHeight + 18) + 'px'; talk.style.height = '';
        bubP.style.left = ''; bubP.style.maxWidth = '';
      }
    }
    function placeWho(){
      who.textContent = T().who;
    }

    // paint the picture for the state with no animation (after a resize or a tab change)
    function paint(){
      var t = T(), done = St.done[t.id], cur = St.cur[t.id];
      labels.innerHTML = '';
      gFig.querySelectorAll('.mn2-mk').forEach(function(g){ g.classList.add('is-now'); });
      if(t.kind === 'marks'){
        t.letters.forEach(function(L, i){ markOn(i, !!done[i]); if(done[i] && i !== cur) badge(L.k, L.at[0], L.at[1]); });
        if(cur >= 0 && done[cur]){ var L = t.letters[cur]; label(L.label, L.at[0], L.at[1], 'is-cur'); }
        face(cur >= 0 && t.letters[cur].feel && done[cur] ? 'grim' : 'open');
        handTo(284, 440, cur >= 0 && t.letters[cur].feel && done[cur], false);
        bubble('emt', ''); bubble('pt', '');
      } else if(t.kind === 'ladder'){
        var L2 = cur >= 0 ? t.letters[cur] : null, end = L2 && done[cur];
        face(!L2 ? 'closed' : end ? (L2.k === 'A' || L2.k === 'V' ? 'open' : L2.k === 'P' ? 'grim' : 'closed') : 'closed');
        handTo(300, 212, !!(end && (L2.k === 'P' || L2.k === 'U')), false);
        bubble('emt', end && L2.k !== 'A' ? (L2.k === 'P' || L2.k === 'U' ? SQUEEZE : 'Sir! Can you hear me? Open your eyes!') : '');
        bubE.classList.toggle('is-act', !!(end && (L2.k === 'P' || L2.k === 'U')));
        bubble('pt', end ? (L2.k === 'V' ? 'Mm… what?' : L2.k === 'P' ? 'Nngh!' : '') : '');
        if(end) ladderLabel(L2);
      } else {
        var L3 = cur >= 0 ? t.letters[cur] : null;
        ['cart', 'pills', 'scale', 'cup'].forEach(function(p){ propOn(p, false); });
        gFig.querySelectorAll('.mn2-mk').forEach(function(g){ g.classList.remove('is-on'); });
        face('open');
        // marks stay: anything a done letter drew is still there; the current one is lit and labeled
        t.letters.forEach(function(L, i){ if(done[i]) showTalkMark(L, i === cur); });
        if(L3 && done[cur]){ bubble('emt', L3.ask); bubble('pt', L3.say); talkLabel(L3); }
        else { bubble('emt', ''); bubble('pt', ''); }
        handTo(0, 0, false);
      }
      requestAnimationFrame(function(){ gFig.querySelectorAll('.mn2-mk').forEach(function(g){ g.classList.remove('is-now'); }); });
      paintKeys(); paintCause();
    }
    function ladderLabel(L){
      var txt = { A: 'Eyes open', V: 'Responds to voice', P: 'Responds to pain', U: 'No response' }[L.k];
      label(txt, 262, 78, 'is-cur');
    }
    var TALKAT = { cart: null, legs: [330, 900], chest: [246, 296], arm: [404, 440], scale: null, watch: [428, 596], signs: [282, 64], pills: null, cup: null };
    function showTalkMark(L, cur){
      var m = L.mark;
      if(m === 'cart' || m === 'pills' || m === 'scale' || m === 'cup'){ propOn(m, true); if(m === 'cup') propOn('cart', false); }
      else if(m !== 'none') markOn(m, true);
      if(!cur && m !== 'none' && L.label){ var at = talkAt(m); if(at) badgeAtStage(L.k, at[0], at[1]); }
    }
    function talkAt(m){
      if(TALKAT[m]) return P(TALKAT[m][0], TALKAT[m][1]);
      var g = box.querySelector('[data-p="' + m + '"]');
      if(!g) return null;
      var r = g.getBoundingClientRect(), b = box.getBoundingClientRect();
      return [r.left - b.left + Math.min(14, r.width / 2), r.top - b.top + Math.min(14, r.height / 2)];
    }
    function badgeAtStage(text, x, y){ var b = el('span', 'mn2-badge', esc(text)); b.style.left = x.toFixed(1) + 'px'; b.style.top = y.toFixed(1) + 'px'; labels.appendChild(b); requestAnimationFrame(function(){ b.classList.add('is-in'); }); }
    function talkLabel(L){
      if(!L.label) return;
      var m = L.mark;
      if(TALKAT[m]) return label(L.label, TALKAT[m][0], TALKAT[m][1], 'is-cur');
      var g = box.querySelector('[data-p="' + m + '"]');
      if(!g) return;
      var r = rel(g), b = el('span', 'mn2-lab is-cur', esc(L.label));
      labels.appendChild(b);
      var bw = b.offsetWidth, bh = b.offsetHeight, ly = r.b + 8;
      if(ly + bh > G.H - G.keyH - 4) ly = r.t - bh - 8;
      put(b, (r.l + r.r) / 2 - bw / 2, ly, 'x', null);
    }

    /* ---------------------------------------------------- the letter keys */
    function buildKeys(){
      var t = T();
      keys.innerHTML = t.letters.map(function(L, i){ return '<button type="button" class="mn2-key" role="radio" aria-checked="false" data-i="' + i + '" aria-label="' + esc(L.k + ': ' + L.word) + '"><b>' + esc(L.k) + '</b><i class="mn2-tick" aria-hidden="true"></i></button>'; }).join('');
      keys.setAttribute('aria-label', t.name + ' letters');
      keys.classList.toggle('is-many', t.letters.length > 6);
    }
    function paintKeys(){
      var t = T(), done = St.done[t.id], cur = St.cur[t.id];
      keys.querySelectorAll('.mn2-key').forEach(function(b, i){
        b.setAttribute('aria-checked', String(i === cur));
        b.classList.toggle('is-done', !!done[i]);
        b.tabIndex = (cur < 0 ? i === 0 : i === cur) ? 0 : -1;
      });
      var all = t.letters.every(function(L, i){ return done[i]; });
      bNext.textContent = cur < 0 ? 'First letter' : 'Next letter';
      bNext.disabled = all && cur === t.letters.length - 1;
      bReset.disabled = cur < 0;
    }
    function paintCause(){
      var t = T(), cur = St.cur[t.id];
      if(cur < 0){ cause.set(t.idle); return; }
      var L = t.letters[cur], parts = [{ t: L.k, role: 'key' }, { t: L.word, role: 'word' }];
      if(St.done[t.id][cur]) parts.push({ t: L.find, role: 'find' });
      cause.set(parts);
      if(St.takeShown === t.id) cause.take(t.take);
    }

    /* ---------------------------------------------------- doing a letter */
    function go(i, focus){
      var t = T();
      if(i < 0 || i >= t.letters.length) return;
      stopAll();
      // a letter still mid change finishes at once
      St.cur[t.id] = i;
      St.takeShown = null;
      var L = t.letters[i];
      if(cue) cue.hide(true);
      if(tour && tour.active()) tour.did('key');
      if(focus){ var kb = keys.querySelector('[data-i="' + i + '"]'); if(kb) kb.focus(); }
      var wasDone = !!St.done[t.id][i];
      St.done[t.id][i] = false; // the result words wait for the picture
      if(t.kind === 'marks') playMark(t, L, i, wasDone);
      else if(t.kind === 'ladder') playLadder(t, L, i);
      else playTalk(t, L, i);
      if(studio && studio.reveal && G && G.phone) revealPicture();
    }
    function finish(t, i){
      St.done[t.id][i] = true;
      var all = t.letters.every(function(x, j){ return St.done[t.id][j]; });
      // the takeaway, once, when the last letter of the set lands on the picture
      if(all && !St.took[t.id]){ St.took[t.id] = true; St.takeShown = t.id; }
      paintKeys(); paintCause();
      var L = t.letters[i];
      say(L.k + ', ' + L.word + ': ' + L.find + '.' + (St.takeShown === t.id ? ' ' + t.take : ''));
    }
    function playMark(t, L, i, wasDone){
      // earlier marks keep their badges; this letter's mark grows in, then its label, then the result word
      labels.innerHTML = '';
      t.letters.forEach(function(M, j){ if(j !== i && St.done[t.id][j]) badge(M.k, M.at[0], M.at[1]); });
      paintKeys(); paintCause();
      face('open'); handTo(L.at[0], L.at[1], false);
      ring(L.at[0], L.at[1]);
      if(L.feel){
        later(60, function(){ handTo(L.at[0], L.at[1], true, false); });
        later(560, function(){ handTo(L.at[0], L.at[1], true, true); markOn(i, true); face('grim'); });
        later(1000, function(){ label(L.label, L.at[0], L.at[1], 'is-cur'); finish(t, i); });
      } else {
        later(wasDone ? 40 : 260, function(){ markOn(i, true); });
        later(wasDone ? 300 : 820, function(){ label(L.label, L.at[0], L.at[1], 'is-cur'); finish(t, i); });
      }
    }
    function ring(x, y){
      if(!G) return;
      var p = P(x, y), r = Math.max(22, 60 * G.k), c = svgEl('circle', { 'class': 'mn2-ring', cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: r.toFixed(1) }, gFx);
      setTimeout(function(){ c.remove(); }, reduced() ? 300 : 1100);
    }
    function playLadder(t, L, i){
      labels.innerHTML = '';
      bubble('emt', ''); bubble('pt', ''); bubE.classList.remove('is-act');
      handTo(300, 212, false);
      paintKeys(); paintCause();
      if(L.k === 'A'){
        face('closed');
        later(120, function(){ face('open'); });
        later(700, function(){ label('Eyes open', 262, 78, 'is-cur'); finish(t, i); });
        return;
      }
      face('closed');
      preset('Sir! Can you hear me? Open your eyes!', L.k === 'V' ? 'Mm\u2026 what?' : L.k === 'P' ? 'Nngh!' : '');
      later(150, function(){ bubble('emt', 'Sir! Can you hear me? Open your eyes!'); });
      if(L.k === 'V'){
        later(1300, function(){ face('open'); bubble('pt', 'Mm… what?'); });
        later(1900, function(){ label('Responds to voice', 262, 78, 'is-cur'); finish(t, i); });
        return;
      }
      later(1400, function(){ label('No response', 262, 78, 'is-wait'); });
      later(2100, function(){ labels.innerHTML = ''; handTo(300, 212, true, false); bubble('emt', SQUEEZE); bubE.classList.add('is-act'); });
      later(2600, function(){ handTo(300, 212, true, true); });
      if(L.k === 'P'){
        later(3200, function(){ face('grim'); bubble('pt', 'Nngh!'); });
        later(3800, function(){ label('Responds to pain', 262, 78, 'is-cur'); finish(t, i); });
      } else later(3500, function(){ label('No response', 262, 78, 'is-cur'); finish(t, i); });
    }
    function playTalk(t, L, i){
      labels.innerHTML = '';
      ['cart', 'pills', 'scale', 'cup'].forEach(function(p){ propOn(p, false); });
      gFig.querySelectorAll('.mn2-mk').forEach(function(g){ g.classList.remove('is-on'); });
      t.letters.forEach(function(M, j){ if(j !== i && St.done[t.id][j]) showTalkMark(M, false); });
      paintKeys(); paintCause();
      preset(L.ask, L.say); bubble('emt', L.ask);
      later(900, function(){ bubble('pt', L.say); });
      later(1300, function(){ showTalkMark(L, true); });
      later(1800, function(){ talkLabel(L); finish(t, i); });
    }

    function revealPicture(){
      // a phone: a run started below the picture scrolls the picture into view
      var r = box.getBoundingClientRect();
      if(r.top < 0 || r.bottom > window.innerHeight){ try{ box.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); }catch(e){} }
    }

    /* ---------------------------------------------------- tabs, start over, keys */
    function setTab(id, user){
      if(!BY[id]) return;
      stopAll();
      St.tab = id; St.takeShown = null;
      tabs.value(id);
      head.purpose(BY[id].purpose);
      box.classList.add('is-swap');
      buildKeys();
      if(hand){ hand.remove(); hand = null; }
      draw();
      setTimeout(function(){ box.classList.remove('is-swap'); }, 20);
      say(BY[id].name + ': ' + BY[id].who + '.');
      if(o && o.onTab) o.onTab(id, user);
    }
    function startOver(){
      var t = T();
      stopAll();
      box.classList.add('is-clear');
      setTimeout(function(){
        St.done[t.id] = {}; St.cur[t.id] = -1; St.took[t.id] = false; St.takeShown = null;
        if(hand) hand.classList.remove('is-on');
        paint();
        box.classList.remove('is-clear');
        say(t.name + ': started over.');
      }, reduced() ? 60 : 260);
    }
    keys.addEventListener('click', function(e){ var b = e.target.closest('.mn2-key'); if(b) go(+b.getAttribute('data-i'), false); });
    keys.addEventListener('keydown', function(e){
      var t = T(), n = t.letters.length, cur = St.cur[t.id], at = +((document.activeElement && document.activeElement.getAttribute('data-i')) || 0);
      var j = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? at + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? at - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
      if(j == null){ if((e.key === ' ' || e.key === 'Enter') && cur !== at){ e.preventDefault(); go(at, true); } return; }
      e.preventDefault(); go((j + n) % n, true);
    });
    bNext.addEventListener('click', function(){ var t = T(), c = St.cur[t.id]; go(Math.min(t.letters.length - 1, c + 1), false); });
    bReset.addEventListener('click', startOver);

    /* ---------------------------------------------------- draw (resize, tab, figure loaded) */
    function draw(){
      G = layout();
      if(!G) return;
      var t = T();
      box.classList.toggle('is-wide', G.wide); box.classList.toggle('is-tall', !G.wide);
      box.style.setProperty('--mn2-keyh', G.keyH + 'px');
      placeWho(); surface(t); figure(t); props(t); placeTalk();
      hand = null;
      svg.setAttribute('viewBox', '0 0 ' + G.W + ' ' + G.H);
      svg.setAttribute('aria-label', t.who + ', lying on their back, seen from above. ' + t.name + ': ' + t.letters.map(function(L){ return L.k + ' ' + L.word; }).join(', ') + '.');
      paint();
      if(cue) cue.place();
      if(!FIGS[t.set]) loadFig(t.set);
    }
    function loadFig(set){
      if(!window.LevlBodyFigs) return;
      window.LevlBodyFigs.load(set, function(F){ if(!F) return; FIGS[set] = F; if(T().set === set) draw(); });
    }
    var rt = null;
    if(window.ResizeObserver) new ResizeObserver(function(){ clearTimeout(rt); rt = setTimeout(function(){ var w = box.clientWidth, h = box.clientHeight; if(!G || Math.abs(w - G.W) > 1 || Math.abs(h - G.H) > 1) draw(); }, 60); }).observe(box);
    else window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(draw, 80); });

    /* ---------------------------------------------------- the one cue and "Show me how" */
    var cue = K.cue(layer, { key: 'nremt-mnemonics', text: 'Tap a letter', side: 'above', at: function(){
      var b = keys.querySelector('.mn2-key'), k = layer.scale(); if(!b || !k) return [0, 0];
      var r = b.getBoundingClientRect(), h = box.getBoundingClientRect();
      return [(r.left - h.left + r.width / 2) / k, (r.top - h.top - 4) / k];
    } });
    var tour = K.tour({ key: 'nremt-mnemonics', label: 'Show me how', steps: [
      { id: 'tab', text: 'Pick a mnemonic: each tab is one patient.', target: function(){ return tabs.el; } },
      { id: 'key', text: 'Tap a letter: the EMT does that check on the patient.', target: function(){ return keys; } },
      { id: 'cause', text: 'This line says what the letter stands for and what it found.', target: function(){ return cause.el; } }
    ] });
    function startTour(){ if(cue) cue.hide(true); tour.start(true); }
    box.addEventListener('pointerdown', function(){ if(cue && cue.active()) cue.hide(true); });

    /* ---------------------------------------------------- "?" */
    var ref = el('div', 'mn2-ref');
    ref.innerHTML =
      '<h3>What you are looking at</h3>' +
      '<p>A patient lying on their back, seen from above. Each tab is one mnemonic used on one patient; tap its letters to do each check. Every letter you have done keeps its mark, so the last letter leaves the whole assessment on the patient.</p>' +
      '<ul class="mn2-ref-l">' +
      '<li><b>DCAP-BTLS</b> (trauma): Deformities, Contusions, Abrasions, Punctures or penetrations, Burns, Tenderness, Lacerations, Swelling. Explore shows one finding per letter on one body; on a real patient you look at and feel every region (head, neck, chest, abdomen, pelvis, each limb, back) for all eight. Tenderness is the one you can only find by feeling.</li>' +
      '<li><b>AVPU</b> (level of responsiveness): Alert, responds to Verbal, responds to Pain, Unresponsive. Try your voice first; use a painful stimulus, such as a trapezius squeeze, only when voice gets nothing. Any response counts: eyes opening, a sound, a movement. Reassess and report the trend.</li>' +
      '<li><b>OPQRST</b> (a symptom, usually pain): Onset, Provocation or palliation, Quality, Radiation, Severity (0 to 10), Time.</li>' +
      '<li><b>SAMPLE</b> (the history): Signs and symptoms, Allergies, Medications, Pertinent past history, Last oral intake, Events leading up. OPQRST is how you explore the S.</li>' +
      '</ul>' +
      '<p>The other 15 mnemonics and scales on this page (Cincinnati, FAST, BE-FAST, AEIOU-TIPS, CUPS, APGAR, SLUDGEM, RPM, GCS, PERRL, the rules of nines and palm, scene size up, the pediatric assessment triangle) are in <button type="button" class="tk2-link mn2-ref-test">Test yourself</button>, with every card and its Fill the letters check.</p>' +
      '<p class="mn2-ref-p"><button type="button" class="tk2-how mn2-ref-how">Show me how</button></p>' +
      '<p class="mn2-ref-s">The patients are made up for practice. Body figure derived from BodyParts3D, © 2008 Life Science Integrated Database Center, CC BY-SA 2.1 Japan. For exam study only. Follow your local protocols and medical direction.</p>';
    ref.querySelector('.mn2-ref-how').addEventListener('click', function(){ if(studio){ if(studio.kit2 && studio.kit2.mode() !== 'explore') studio.kit2.go('explore'); if(studio.close) studio.close(); } setTimeout(startTour, 60); });
    ref.querySelector('.mn2-ref-test').addEventListener('click', function(){ if(studio && studio.kit2){ if(studio.close) studio.close(); studio.kit2.go('quiz'); } });

    buildKeys();
    var api = {
      stage: stage, ref: ref,
      tab: function(id){ if(id === undefined) return St.tab; setTab(id, false); },
      tabOf: function(cardId){ var f = TABS.filter(function(t){ return t.card === cardId; })[0]; return f ? f.id : null; },
      shown: function(){
        // Explore is on screen: draw at its real size, then the cue (once per device)
        draw();
        if(!St.cued){ St.cued = true; setTimeout(function(){ if(cue.show()) cue.place(); }, 300); }
      },
      _state: St, _go: go
    };
    return api;
  }

  window.NremtMnemonics = { build: build, TABS: TABS };
})();
