/* NREMT Protocol flowcharts, tools v2 Explore (docs/tools-v2-nremt-flowcharts-brief.md; standard
   docs/tools-v2-standard.md).

   THE IDEA: a protocol is a chain of decisions, and what you find on the patient picks each branch. Explore puts a
   drawn patient beside a protocol card (a clipboard on the floor): at each decision the picture shows the finding,
   the student taps the arm that fits, the action plays out on the patient and the chart grows one box at a time on
   the card. A wrong arm plays its consequence on the patient (more blood on the floor, blue lips, lost minutes on a
   clock), stays on the card struck in red, and the student takes another arm. Two calls: Primary assessment (a man
   who fell from a ladder onto glass) and Cardiac arrest (a man collapsed at home, AHA 2025 adult BLS).

   THE PICTURE: one svg for the whole stage (the floor, and the patient in a "camera" group that frames the part of
   him that matters), HTML over it for what must stay crisp and measurable: the protocol card (nodes, arm buttons,
   connectors in its own svg), labels (1 to 3 words), one speech bubble, the patient chip and the lost time clock.
   The patient is the course's rendered body (body-figs/, BodyParts3D) lying on his back, head left, seen from above;
   everything on him is drawn in the image's own pixels (480 x 1200).

   STATE: what is drawn is a pure function of St.fx (paintFx); a step only changes fx, waits for the drawing, then
   names it (labels, the cause line's last pill), so labels never run ahead of the picture. Timers are owned by
   run(); hidden() flushes the rest of a running sequence at once, so coming back shows a finished, clean state.

     var ex = NremtFlowExplore.build({ studio, onTab(id, user), onPick(id) })
        -> { stage, ref, tab(id?), hidden(), shown() }

   Medical content: the course notes, AHA 2025 adult BLS and the page's own charts; open points in
   docs/nremt-needs-author.md ("Flowcharts, tools v2 Explore"). */
(function(){
  'use strict';
  if(window.NremtFlowExplore) return;
  var NS = 'http://www.w3.org/2000/svg';
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function rng(seed){ var s = seed >>> 0; return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  /* ------------------------------------------------------------------ the two calls
     Each step: q (the decision box), see (what the picture shows: the cause line's first pill), look (the camera's
     image y range on a narrow stage), check (the scene played before the arms appear), arms. An arm: t (its button),
     ok, act (the action box it adds, if any), res (the cause line's last pill), fx (what it does to the picture);
     a wrong arm: con (1 to 3 words under it on the card), bad (what it does to the picture), lost (minutes). */
  var CALLS = [
    { id: 'primary', name: 'Primary assessment', short: 'Primary', scene: 'garage', chart: 'flow-primary-assessment-sequence',
      who: 'Man, 45, fell from a ladder onto glass', purpose: 'What you find on him picks the next step.',
      whole: [-30, 1000], start: ['Scene safe, gloves on'],
      take: 'Fix each threat as you find it: bleeding, airway, breathing, shock.',
      end: 'Reassess every 5 min',
      steps: [
        { id: 'avpu', q: 'Responds to?', see: 'Eyes open to voice', look: [-40, 520], check: 'voice',
          arms: [
            { t: 'Alert', con: 'Not alert', res: 'he only opens his eyes', bad: 'misread' },
            { t: 'Voice', ok: true, res: 'responds to voice: V' },
            { t: 'Pain', con: 'Voice was enough', res: 'pain is not needed', bad: 'pain' },
            { t: 'Nothing', con: 'He did respond', res: 'he opened his eyes', bad: 'misread' }] },
        { id: 'bleed', q: 'Severe bleeding?', see: 'Bright red, spurting', look: [430, 960], check: 'bleed',
          arms: [
            { t: 'Yes', ok: true, act: 'Tourniquet', res: 'the spurting stops', fx: 'tourniquet' },
            { t: 'No', con: 'Pool grows', res: 'more blood lost', bad: 'pool', lost: 1 }] },
        { id: 'airway', q: 'Airway open?', see: 'Snoring', look: [-40, 520], check: 'snore',
          arms: [
            { t: 'Yes', con: 'Lips turn blue', res: 'tongue still blocks it', bad: 'blue' },
            { t: 'No', ok: true, act: 'Jaw thrust', res: 'air moves freely', fx: 'jaw' }] },
        { id: 'breath', q: 'Breathing OK?', see: 'Deep, 18 a minute', look: [-40, 470], check: 'breathe',
          arms: [
            { t: 'Yes', ok: true, res: 'on to circulation' },
            { t: 'No', con: 'Time lost', res: 'he did not need the bag', bad: 'bvm', lost: 1 }] },
        { id: 'shock', q: 'Signs of shock?', see: 'Pale, sweaty, fast pulse', look: [-30, 620], check: 'shock',
          arms: [
            { t: 'Yes', ok: true, act: 'Keep him warm', res: 'blanket on, kept warm', fx: 'blanket' },
            { t: 'No', con: 'Gets worse', res: 'paler and colder', bad: 'paler' }] },
        { id: 'prio', q: 'High priority?', see: 'Altered and in shock', look: [-40, 640], check: 'prio',
          arms: [
            { t: 'Yes', ok: true, act: 'Rapid exam, transport', res: 'transport now', fx: 'transport' },
            { t: 'No', con: 'Time lost', res: 'a slow scene delays surgery', bad: 'slow', lost: 10 }] }
      ] },
    { id: 'arrest', name: 'Cardiac arrest', short: 'Arrest', scene: 'home', chart: 'flow-adult-bls-cpr-sequence-no-advanced-airway',
      who: 'Man, 62, collapsed at home', purpose: 'What you find on him picks the next step.',
      whole: [-40, 760], start: ['Scene safe'],
      take: 'No pulse: push hard and fast, and shock when the AED says so.',
      end: 'CPR 2 min, AED rechecks',
      steps: [
        { id: 'resp', q: 'Responds?', see: 'No response', look: [-40, 560], check: 'tap',
          arms: [
            { t: 'Yes', con: 'No AED coming', res: 'nobody sent for help', bad: 'wait', lost: 1 },
            { t: 'No', ok: true, act: 'Call for help, AED', res: 'partner gets the AED', fx: 'call' }] },
        { id: 'pulse', q: 'Breathing, pulse?', see: 'Gasping, no pulse', look: [-40, 560], check: 'pulse',
          arms: [
            { t: 'Both normal', con: 'Gasps aren’t breaths', res: 'no CPR, no blood flow', bad: 'gray', lost: 1 },
            { t: 'Pulse only', con: 'No blood moves', res: 'breaths alone move no blood', bad: 'breaths', lost: 1 },
            { t: 'No pulse', ok: true, act: 'CPR 30:2', res: 'blood pushed to the brain', fx: 'cpr' }] },
        { id: 'aed', q: 'Shock advised?', see: 'AED: Shock advised', look: [-40, 560], check: 'aed', pre: 'AED on, pads on',
          arms: [
            { t: 'Shock', ok: true, act: 'Clear, shock', res: 'shock, then CPR at once', fx: 'shock' },
            { t: 'No shock', con: 'VF goes on', res: 'the rhythm stays', bad: 'noshock', lost: 2 }] }
      ] }
  ];
  var BY = {}; CALLS.forEach(function(c){ BY[c.id] = c; });

  /* the face, in image px (from the mnemonics tool: the head is about 200..282 across, 8..150 down) */
  var FACE = {
    brow: 'M215 66Q224 60 233 64M247 64Q256 60 265 66',
    lidC: 'M216 77Q224 81 232 77M248 77Q256 81 264 77',
    nose: 'M240 80Q237 92 236 99Q240 103 245 99',
    mouthN: 'M230 119Q240 123 250 119',
    mouthO: 'M231 117Q240 113 249 117Q248 128 240 129Q232 128 231 117Z'
  };
  // a gloved hand seen from above, fingers toward -y, wrist at +y (local px, about 40 wide)
  var GLOVE = '<path class="fx2-glove" d="M-18 6C-20 -6 -19 -22 -16 -30L-12 -44C-11 -48 -6 -48 -5 -44L-4 -30L-2 -48C-1 -52 4 -52 5 -48L6 -30L9 -46C10 -50 15 -50 15 -46L13 -28L17 -40C18 -44 23 -43 22 -39L18 -16C17 -4 14 6 10 12L-12 14Z"/><rect class="fx2-cuff" x="-13" y="10" width="24" height="12" rx="6"/>';

  // a glove at (x, y) turned rot degrees; adult hand size (a hand is about 7 inches, the figure about 70 tall)
  function glove(x, y, rot, cls, sc){ return '<g' + (cls ? ' class="' + cls + '"' : '') + ' transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + (sc || 1.9) + ')">' + GLOVE + '</g>'; }

  function build(o){
    var K = window.LevlKit2, studio = o && o.studio;
    function reduced(){ return K.reduced(); }
    var St = { tab: 'primary' };

    /* ---------------------------------------------------- the stage */
    var stage = el('div', 'fx2');
    var tabs = K.tabs({ label: 'Which call', items: CALLS.map(function(c){ return { value: c.id, label: c.name, short: c.short }; }), value: St.tab, big: true, onChange: function(v){ setTab(v, true); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: BY[St.tab].purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var box = el('div', 'fx2-scene');
    box.id = 'fx2-scene';
    box.innerHTML = '<svg class="fx2-svg" role="img" aria-label="" xmlns="' + NS + '" data-ls-text="keep"><defs></defs><g class="fx2-bg"></g>' +
      '<g class="fx2-clipg"><g class="fx2-cam"><g class="fx2-under"></g><g class="fx2-fig"></g><g class="fx2-on"></g></g><g class="fx2-props"></g></g><g class="fx2-lead"></g></svg>' +
      '<div class="fx2-board"><div class="fx2-clip" aria-hidden="true"><svg viewBox="0 0 120 34"><rect class="fx2-clip-b" x="8" y="10" width="104" height="22" rx="5"/><rect class="fx2-clip-t" x="34" y="2" width="52" height="16" rx="6"/><circle class="fx2-clip-h" cx="60" cy="10" r="4"/></svg></div>' +
      '<div class="fx2-paper"><p class="fx2-ptitle"></p><div class="fx2-view"><div class="fx2-chart"><svg class="fx2-lines" aria-hidden="true"><defs><marker id="fx2-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="fx2-ah"/></marker></defs></svg></div></div></div></div>' +
      '<div class="fx2-labels" aria-hidden="true"></div>' +
      '<p class="fx2-bub" aria-hidden="true"><b class="fx2-bub-k"></b><span class="fx2-bub-t"></span></p>' +
      '<div class="fx2-who" aria-hidden="true"></div>' +
      '<div class="fx2-clock" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8.5"/><path d="M12 8.5V13l3 2M9.5 2.5h5"/></svg><span></span></div>';
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', box.id); });
    stage.appendChild(box);
    var svg = box.querySelector('.fx2-svg'), defs = svg.querySelector('defs'), gBg = svg.querySelector('.fx2-bg'), gClip = svg.querySelector('.fx2-clipg'),
      gCam = svg.querySelector('.fx2-cam'), gUnder = svg.querySelector('.fx2-under'), gFig = svg.querySelector('.fx2-fig'), gOn = svg.querySelector('.fx2-on'),
      gProps = svg.querySelector('.fx2-props'), gLead = svg.querySelector('.fx2-lead');
    var board = box.querySelector('.fx2-board'), paper = box.querySelector('.fx2-paper'), ptitle = box.querySelector('.fx2-ptitle'),
      chart = box.querySelector('.fx2-chart'), view = box.querySelector('.fx2-view'), lines = box.querySelector('.fx2-lines');
    var labels = box.querySelector('.fx2-labels'), bub = box.querySelector('.fx2-bub'), who = box.querySelector('.fx2-who'), clock = box.querySelector('.fx2-clock');
    var layer = K.layer(box);
    var foot = el('div', 'fx2-lines-row');
    var cause = K.cause({ label: 'What you found and what it led to' });
    var acts = el('div', 'fx2-acts', '<button type="button" class="tk2-link fx2-reset">Start over</button>');
    var bReset = acts.querySelector('.fx2-reset');
    foot.appendChild(cause.el); foot.appendChild(acts);
    stage.appendChild(foot);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite');
    stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    /* ---------------------------------------------------- timers: one owner; flush() finishes a sequence at once */
    var queue = [], timer = null, token = 0;
    function run(list){
      // list: [[ms after the previous, fn], ...]; reduced motion runs it all at once (the CSS cross fades)
      stopAll();
      queue = list.slice();
      next(token);
    }
    function next(my){
      if(my !== token) return;
      if(!queue.length){ timer = null; return; }
      var it = queue[0], ms = reduced() ? 0 : it[0];
      if(ms <= 0){ queue.shift(); it[1](); next(my); return; }
      timer = setTimeout(function(){ if(my !== token) return; queue.shift(); it[1](); next(my); }, ms);
    }
    function stopAll(){ token++; clearTimeout(timer); timer = null; queue = []; }
    function flush(){ for(var n = 0; n < 30 && queue.length; n++){ var q = queue; stopAll(); q.forEach(function(it){ it[1](); }); } }

    /* ---------------------------------------------------- state */
    function C(){ return BY[St.tab]; }
    var S = {};
    function fresh(c){
      return { i: 0, phase: 'check', picks: {}, lost: 0, done: false,
        fx: { eyes: 'closed', mouth: 'n', bleed: c.id === 'primary' ? 'spurt' : 'none', pool: c.id === 'primary' ? 1 : 0, pale: 0, gray: 0, blue: false, snore: false,
          tq: false, jaw: false, chest: '', pulse: false, sweat: false, blanket: false, bvm: false, exam: false, tap: false,
          carotid: false, cpr: false, bare: false, aed: false, pads: false, screen: '', clear: false, flash: false },
        items: [] };
    }
    CALLS.forEach(function(c){ S[c.id] = fresh(c); });
    function T(){ return S[St.tab]; }

    /* ---------------------------------------------------- geometry */
    var G = null;
    function layout(){
      var W = box.clientWidth, H = box.clientHeight;
      if(!W || !H) return null;
      var wide = W >= 900, sc, card;
      if(wide){
        var cw = clamp(Math.round(W * 0.32), 260, 400);
        sc = { x: 0, y: 0, w: W - cw - 16, h: H };
        card = { x: W - cw - 6, y: 12, w: cw - 6, h: H - 24 };
      } else {
        var ch = 226, sh = H - ch - 14;
        sc = { x: 0, y: 0, w: W, h: sh };
        card = { x: 8, y: sh + 8, w: W - 16, h: H - sh - 14 };
      }
      return { W: W, H: H, wide: wide, phone: W < 600, sc: sc, card: card, full: sc.w >= 820 && sc.w / sc.h >= 1.35 };
    }
    // the camera: frames image y range [y0, y1] (along the body) inside the scene; head left
    function cam(range){
      var sc = G.sc, m = G.phone ? 6 : 14, span = range[1] - range[0], across = G.full ? 470 : 330;
      var k = Math.min((sc.w - 2 * m) / span, (sc.h - 2 * m) / across);
      var ym = (range[0] + range[1]) / 2, xm = 240;
      return { k: k, cx: sc.x + sc.w / 2, cy: sc.y + sc.h / 2 + (G.wide ? 0 : 4), xm: xm, ym: ym };
    }
    var V = null; // the camera now
    function P(x, y, v){ v = v || V; if(!v) return [0, 0]; return [v.cx + v.k * (y - v.ym), v.cy - v.k * (x - v.xm)]; }
    function camTo(range, instant){
      V = cam(range);
      gCam.style.transition = instant || reduced() ? 'none' : '';
      gCam.style.transform = 'translate(' + V.cx.toFixed(1) + 'px,' + V.cy.toFixed(1) + 'px) rotate(-90deg) scale(' + V.k.toFixed(4) + ') translate(' + (-V.xm) + 'px,' + (-V.ym) + 'px)';
      if(instant || reduced()){ void gCam.getBoundingClientRect(); gCam.style.transition = ''; }
    }
    function lookFor(step){ return G && G.full ? C().whole : step ? step.look : C().whole; }

    /* ---------------------------------------------------- the floor (stage px) */
    function svgEl(tag, attrs, parent){ var e = document.createElementNS(NS, tag); for(var a in attrs) e.setAttribute(a, attrs[a]); if(parent) parent.appendChild(e); return e; }
    function floor(c){
      var W = G.W, H = G.H, r = rng(c.id === 'primary' ? 5 : 9), h = [], i;
      if(c.scene === 'garage'){
        h.push('<rect class="fx2-conc" x="0" y="0" width="' + W + '" height="' + H + '"/>');
        var slab = 260;
        for(i = 1; i < W / slab + 1; i++) h.push('<line class="fx2-joint" x1="' + (i * slab - 40) + '" y1="0" x2="' + (i * slab - 40) + '" y2="' + H + '"/>');
        for(i = 1; i < H / slab + 1; i++) h.push('<line class="fx2-joint" x1="0" y1="' + (i * slab - 60) + '" x2="' + W + '" y2="' + (i * slab - 60) + '"/>');
        for(i = 0; i < Math.round(W * H / 1500); i++) h.push('<circle class="fx2-speck" cx="' + (r() * W).toFixed(1) + '" cy="' + (r() * H).toFixed(1) + '" r="' + (0.5 + r()).toFixed(1) + '"/>');
        h.push('<ellipse class="fx2-oil" cx="' + (W * 0.12).toFixed(0) + '" cy="' + (H * 0.18).toFixed(0) + '" rx="46" ry="22"/>');
      } else {
        h.push('<rect class="fx2-wood" x="0" y="0" width="' + W + '" height="' + H + '"/>');
        var pl = 34, off = 0;
        for(i = 0; i * pl < H; i++){
          h.push('<rect class="fx2-plank' + (i % 3) + '" x="0" y="' + (i * pl) + '" width="' + W + '" height="' + (pl - 2) + '"/>');
          off = (i * 137) % 260;
          for(var x = off - 260; x < W; x += 260) h.push('<line class="fx2-seam" x1="' + x + '" y1="' + (i * pl) + '" x2="' + x + '" y2="' + (i * pl + pl - 2) + '"/>');
        }
      }
      gBg.innerHTML = h.join('');
    }

    /* ---------------------------------------------------- the patient and what is drawn on him (image px) */
    var FIGS = null;
    function figure(c){
      var F = FIGS && FIGS.figs['adult-front'], u = [], h = [], on = [];
      defs.innerHTML = '<clipPath id="fx2-sc"><rect x="' + G.sc.x + '" y="' + G.sc.y + '" width="' + G.sc.w + '" height="' + G.sc.h + '" rx="' + (G.wide ? 16 : 12) + '"/></clipPath>' +
        '<radialGradient id="fx2-poolg"><stop offset="0" stop-color="#7A0A06"/><stop offset=".75" stop-color="#9E1209"/><stop offset="1" stop-color="#B5190E"/></radialGradient>' +
        '<linearGradient id="fx2-blg" x1="0" x2="1"><stop offset="0" stop-color="#7C5E96"/><stop offset=".45" stop-color="#9677B2"/><stop offset="1" stop-color="#7A5C94"/></linearGradient>' +
        '<radialGradient id="fx2-flash"><stop offset="0" stop-color="#FFF7C2" stop-opacity=".95"/><stop offset="1" stop-color="#FFE45C" stop-opacity="0"/></radialGradient>' +
        (F ? '<clipPath id="fx2-body"><path d="' + F.outline + '"/></clipPath>' : '');
      gClip.setAttribute('clip-path', 'url(#fx2-sc)');
      // under him: the scene's things on the floor, and the pool of blood
      if(c.scene === 'garage'){
        u.push('<g class="fx2-ladder" transform="translate(560 120) rotate(8)"><rect class="fx2-rail" x="0" y="0" width="22" height="980" rx="6"/><rect class="fx2-rail" x="150" y="0" width="22" height="980" rx="6"/>' +
          [60, 200, 340, 480, 620, 760, 900].map(function(y){ return '<rect class="fx2-rung" x="16" y="' + y + '" width="140" height="16" rx="4"/>'; }).join('') + '</g>');
        var r = rng(31);
        for(var i = 0; i < 16; i++){ var gx = 20 + r() * 120, gy = 820 + r() * 300; u.push('<path class="fx2-glass" d="M' + gx.toFixed(0) + ' ' + gy.toFixed(0) + 'l' + (10 + r() * 16).toFixed(0) + ' ' + (-6 - r() * 10).toFixed(0) + 'l' + (4 + r() * 10).toFixed(0) + ' ' + (14 + r() * 10).toFixed(0) + 'z"/>'); }
        u.push('<g class="fx2-pool"><ellipse cx="96" cy="800" rx="78" ry="104" fill="url(#fx2-poolg)"/><ellipse class="fx2-pool-hi" cx="78" cy="770" rx="20" ry="30"/></g>');
      } else {
        u.push('<rect class="fx2-rug" x="-40" y="140" width="560" height="900" rx="10"/><rect class="fx2-rug-b" x="-16" y="164" width="512" height="852" rx="6"/>' +
          '<g class="fx2-sofa"><rect x="520" y="-60" width="200" height="760" rx="40"/><rect class="fx2-sofa-k" x="660" y="-60" width="60" height="760" rx="24"/><rect class="fx2-sofa-c" x="540" y="-30" width="130" height="330" rx="26"/><rect class="fx2-sofa-c" x="540" y="320" width="130" height="330" rx="26"/><path class="fx2-sofa-s" d="M560 0Q600 130 560 270M560 350Q600 480 560 620"/></g>' +
          '<g class="fx2-mug" transform="translate(-60 470)"><circle r="26"/><circle class="fx2-mug-c" r="18"/><path class="fx2-spill" d="M20 10C60 20 90 60 70 100C50 120 10 90 4 50Z"/></g>');
      }
      if(F){
        h.push('<path class="fx2-shadow" d="' + F.outline + '" transform="translate(-12 10)"/>');
        h.push('<image href="' + FIGS.url(F) + '" x="0" y="0" width="' + F.w + '" height="' + F.h + '"/>');
        // clothes, clipped to the body: work trousers and a T-shirt (the fall); trousers and a shirt that the EMT
        // opens before CPR (the arrest)
        var cl = [];
        if(c.scene === 'garage') cl.push('<path class="fx2-cl fx2-tee" d="M0 168L480 168L480 300L380 300L380 520L100 520L100 300L0 300Z"/>' +
          '<path class="fx2-cl fx2-work" d="M100 520L380 520L386 1130L240 1130L240 700L230 709L214 697L198 710L182 698L166 709L150 698L134 709L118 699L100 706Z"/>');
        else cl.push('<path class="fx2-cl fx2-pants" d="M100 540L380 540L386 1140L94 1140Z"/><g class="fx2-shirt"><path class="fx2-cl fx2-blue" d="M0 168L480 168L480 560L0 560Z"/><path class="fx2-placket" d="M240 214L240 556"/></g>');
        h.push('<g clip-path="url(#fx2-body)"><path class="fx2-paleo" d="' + F.outline + '"/><path class="fx2-grayo" d="' + F.outline + '"/>' + cl.join('') + '</g>');
        h.push(c.scene === 'garage' ? '<path class="fx2-hair" d="M199 70C196 30 214 5 240 4C267 5 285 30 281 70C276 50 266 38 254 34C244 31 236 31 226 34C214 38 204 50 199 70Z"/>'
          : '<path class="fx2-hair is-gray" d="M200 60C200 40 210 22 222 18C230 30 250 30 258 18C270 22 280 40 280 60C272 46 262 40 240 40C218 40 208 46 200 60Z"/>');
        h.push('<g class="fx2-face"><path class="fx2-nose" d="' + FACE.nose + '"/><path class="fx2-brow" d="' + FACE.brow + '"/>' +
          '<g class="fx2-eo">' + eye(224) + eye(256) + '</g><g class="fx2-ec"><path class="fx2-lid" d="' + FACE.lidC + '"/></g>' +
          '<path class="fx2-mouth fx2-mn" d="' + FACE.mouthN + '"/><path class="fx2-mo" d="' + FACE.mouthO + '"/>' +
          '<ellipse class="fx2-lips" cx="240" cy="120" rx="13" ry="6"/>' +
          '<path class="fx2-sweat" d="M222 40q-3 6 0 9q3 -3 0 -9zM252 36q-3 6 0 9q3 -3 0 -9zM268 52q-3 6 0 9q3 -3 0 -9zM212 88q-3 6 0 9q3 -3 0 -9zM270 94q-3 6 0 9q3 -3 0 -9z"/></g>');
      }
      // on him: each effect its own group, shown by state (paintFx)
      if(c.id === 'primary'){
        on.push('<g class="fx2-wound"><ellipse class="fx2-wound-r" cx="176" cy="784" rx="16" ry="30" transform="rotate(-8 176 784)"/><path class="fx2-wound-c" d="M172 760Q180 784 174 808"/></g>');
        on.push('<g class="fx2-jets">' + [0, 1, 2].map(function(n){ return '<path class="fx2-jet fx2-jet' + n + '" d="M168 786C140 ' + (776 - n * 10) + ' 110 ' + (770 - n * 16) + ' 74 ' + (780 - n * 20) + '"/>'; }).join('') + '</g>');
        on.push('<g class="fx2-tq"><rect class="fx2-tq-b" x="118" y="728" width="128" height="20" rx="6"/><rect class="fx2-tq-s" x="118" y="733" width="128" height="4"/>' +
          '<g class="fx2-wind" transform="translate(150 738)"><rect class="fx2-wind-r" x="-6" y="-34" width="12" height="68" rx="5"/></g><rect class="fx2-tq-tab" x="200" y="722" width="30" height="32" rx="4"/></g>');
        on.push('<g class="fx2-snore">' + [0, 1, 2].map(function(n){ return '<path class="fx2-arc fx2-arc' + n + '" d="M' + (226 - n * 8) + ' ' + (134 + n * 12) + 'Q240 ' + (148 + n * 16) + ' ' + (254 + n * 8) + ' ' + (134 + n * 12) + '"/>'; }).join('') + '</g>');
        on.push('<g class="fx2-jaw">' + glove(188, 52, 196) + glove(292, 52, 164) + '</g>');
        on.push('<g class="fx2-rise"><path class="fx2-rl" d="M118 250Q104 330 118 410"/><path class="fx2-rl" d="M362 250Q376 330 362 410"/><ellipse class="fx2-rglow" cx="240" cy="310" rx="96" ry="80"/></g>');
        on.push('<g class="fx2-wrist">' + glove(128, 604, -90) + '<circle class="fx2-pring" cx="44" cy="602" r="12"/></g>');
        on.push('<g class="fx2-blanket"><path class="fx2-bl" d="M58 214C120 200 360 200 422 214C430 330 424 470 434 690C380 702 330 694 300 700C250 708 200 694 160 702C120 708 80 698 46 690C56 520 50 360 58 214Z"/>' +
          '<path class="fx2-bl-e" d="M58 214C120 200 360 200 422 214"/><path class="fx2-bl-f" d="M120 260C140 380 120 520 150 660M330 250C310 380 340 520 316 670M236 300C246 420 226 560 240 690"/></g>');
        on.push('<g class="fx2-sweep"><g class="fx2-sweep-h">' + glove(0, 0, 90) + '</g></g>');
      } else {
        on.push('<g class="fx2-taps"><g class="fx2-tapl">' + glove(146, 118, 180) + '</g><g class="fx2-tapr">' + glove(334, 118, 180) + '</g></g>');
        on.push('<g class="fx2-carotid">' + glove(128, 186, 90) + '</g>');
        on.push('<g class="fx2-gasp"><path class="fx2-rl" d="M118 250Q104 330 118 410"/><path class="fx2-rl" d="M362 250Q376 330 362 410"/></g>');
        on.push('<g class="fx2-pads"><rect class="fx2-pad" x="160" y="226" width="64" height="46" rx="10" transform="rotate(-10 192 249)"/><rect class="fx2-pad" x="318" y="318" width="50" height="66" rx="10"/>' +
          '<path class="fx2-wire" d="M190 228C200 160 320 120 520 90M346 318C380 260 470 160 520 110"/></g>');
        on.push('<g class="fx2-cpr"><g class="fx2-cpr-h">' + glove(236, 300, 90) + glove(244, 296, 78, '', 1.8) + '</g></g>');
        on.push('<g class="fx2-zap"><circle cx="270" cy="300" r="120" fill="url(#fx2-flash)"/><path class="fx2-bolt" d="M196 250L248 300L232 306L300 360"/></g>');
      }
      on.push('<g class="fx2-bvm"><ellipse class="fx2-mask" cx="240" cy="108" rx="34" ry="44"/><ellipse class="fx2-mask-r" cx="240" cy="108" rx="24" ry="32"/><rect class="fx2-valve" x="226" y="34" width="28" height="22" rx="6"/>' +
        '<ellipse class="fx2-bag" cx="240" cy="-46" rx="34" ry="70"/></g>');
      gUnder.innerHTML = u.join('');
      gFig.innerHTML = h.join('');
      gOn.innerHTML = on.join('');
      paintFx(true);
    }
    function eye(x){ return '<ellipse class="fx2-white" cx="' + x + '" cy="77" rx="7.5" ry="4.2"/><circle class="fx2-iris" cx="' + x + '" cy="77" r="3.4"/><circle class="fx2-pupil" cx="' + x + '" cy="77" r="1.5"/>'; }

    /* props in stage px (never rotated, so their words read): the AED and the cot */
    function props(c){
      var f = T().fx, h = [];
      if(c.id === 'arrest' && G){
        var v = cam(lookFor(c.steps[2])), a = P(560, 60, v), s = clamp(v.k * 1.25, 0.68, 1.1), w = 170 * s, hh = 118 * s;
        var x = clamp(a[0] - w / 2, G.sc.x + 8, G.sc.x + G.sc.w - w - 8), y = clamp(a[1] - hh / 2, G.sc.y + 8, G.sc.y + G.sc.h - hh - 8);
        f.aedBox = [x, y, w, hh];
        h.push('<g class="fx2-aed" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s.toFixed(3) + ')">' +
          '<rect class="fx2-aed-b" x="0" y="0" width="170" height="118" rx="16"/><rect class="fx2-aed-s" x="10" y="10" width="150" height="64" rx="6"/>' +
          '<path class="fx2-vf" transform="translate(0 64) scale(1 .62) translate(0 -54)" d="M22 54q6 -16 10 0t10 0t9 -2t11 4t9 -14t10 12t10 -6t9 10t10 -12t9 4t9 -6t9 6t9 -8"/>' +
          '<text class="fx2-aed-t" x="85" y="32" text-anchor="middle">Shock advised</text><text class="fx2-aed-t2" x="85" y="48" text-anchor="middle">Shock given</text>' +
          '<circle class="fx2-aed-btn" cx="85" cy="96" r="14"/><path class="fx2-aed-bolt" d="M82 88l-5 9h6l-3 8l9 -11h-6l3 -6z"/></g>');
      }
      gProps.innerHTML = h.join('');
      paintFx(true);
    }

    function cls(sel, on, c){ gCam.querySelectorAll(sel).forEach(function(e){ e.classList.toggle(c || 'is-on', !!on); }); }
    function paintFx(){
      var f = T().fx;
      cls('.fx2-eo', f.eyes === 'open'); cls('.fx2-ec', f.eyes !== 'open');
      cls('.fx2-mo', f.mouth === 'o'); cls('.fx2-mn', f.mouth !== 'o');
      var pool = gCam.querySelector('.fx2-pool');
      if(pool){ pool.style.transform = 'scale(' + (0.55 + 0.45 * f.pool).toFixed(3) + ')'; }
      cls('.fx2-jets', f.bleed === 'spurt'); cls('.fx2-wound', f.bleed !== 'none');
      var pa = gCam.querySelector('.fx2-paleo'); if(pa) pa.style.opacity = [0, 0.22, 0.34, 0.44][Math.min(3, f.pale)];
      var gr = gCam.querySelector('.fx2-grayo'); if(gr) gr.style.opacity = [0, 0.2, 0.32, 0.4][Math.min(3, f.gray)];
      cls('.fx2-lips', f.blue); cls('.fx2-sweat', f.sweat);
      cls('.fx2-tq', f.tq); cls('.fx2-snore', f.snore); cls('.fx2-jaw', f.jaw);
      cls('.fx2-rise', f.chest === 'rise'); cls('.fx2-gasp', f.chest === 'gasp');
      cls('.fx2-wrist', f.pulse); cls('.fx2-blanket', f.blanket); cls('.fx2-bvm', f.bvm); cls('.fx2-sweep', f.exam);
      cls('.fx2-taps', f.tap); cls('.fx2-carotid', f.carotid); cls('.fx2-cpr', f.cpr && !f.clear); cls('.fx2-shirt', f.bare, 'is-off');
      cls('.fx2-pads', f.pads); cls('.fx2-zap', f.flash);
      gCam.classList.toggle('is-jolt', !!f.flash);
      var aed = gProps.querySelector('.fx2-aed');
      if(aed){ aed.classList.toggle('is-on', !!f.aed); aed.classList.toggle('is-vf', f.screen === 'vf' || f.screen === 'shock'); aed.classList.toggle('is-adv', f.screen === 'shock'); aed.classList.toggle('is-done', f.screen === 'done'); }
      clock.classList.toggle('is-on', T().lost > 0);
      clock.querySelector('span').textContent = T().lost + ' min lost';
    }

    /* ---------------------------------------------------- labels, the bubble, the chip, the clock */
    var LABS = []; // { text, at: [x, y] image px, tone }
    function setLabels(list){ LABS = list || []; placeLabels(); }
    function placeLabels(){
      labels.innerHTML = ''; gLead.innerHTML = '';
      if(!G || !V) return;
      var taken = [];
      [bub, who, clock].forEach(function(b){ if(b.classList.contains('is-on') || b === who){ var r = rel(b); if(r) taken.push(r); } });
      var aedB = T().fx.aed && T().fx.aedBox; if(aedB) taken.push({ l: aedB[0], t: aedB[1], r: aedB[0] + aedB[2], b: aedB[1] + aedB[3] });
      var sc = G.sc;
      LABS.forEach(function(L){
        var e = el('span', 'fx2-lab is-' + (L.tone || 'see'), esc(L.text));
        labels.appendChild(e);
        var w = e.offsetWidth, h = e.offsetHeight, ab = T().fx.aedBox, p = L.at === 'aed' && ab ? [ab[0] + ab[2] / 2, ab[1] + ab[3] * 0.32] : P(L.at[0], L.at[1]), best = null;
        var dirs = [[0, -1], [0, 1], [1, -1], [-1, -1], [1, 1], [-1, 1], [1, 0], [-1, 0]];
        [26, 44, 64, 88].some(function(d){
          return dirs.some(function(dd){
            var cx = p[0] + dd[0] * (d + w / 2), cy = p[1] + dd[1] * (d * 0.8 + h / 2);
            var b = { l: cx - w / 2, t: cy - h / 2, r: cx + w / 2, b: cy + h / 2 };
            if(b.l < sc.x + 6 || b.r > sc.x + sc.w - 6 || b.t < sc.y + 6 || b.b > sc.y + sc.h - 6) return false;
            if(taken.some(function(t){ return !(b.r + 5 < t.l || b.l > t.r + 5 || b.b + 5 < t.t || b.t > t.b + 5); })) return false;
            best = b; return true;
          });
        });
        if(!best){ var bx = clamp(p[0] - w / 2, sc.x + 6, sc.x + sc.w - w - 6), by = clamp(p[1] - h - 20, sc.y + 6, sc.y + sc.h - h - 6); best = { l: bx, t: by, r: bx + w, b: by + h }; }
        e.style.left = best.l.toFixed(1) + 'px'; e.style.top = best.t.toFixed(1) + 'px';
        taken.push(best);
        var ex = clamp(p[0], best.l + 6, best.r - 6), ey = p[1] < best.t ? best.t : p[1] > best.b ? best.b : (best.t + best.b) / 2;
        if(Math.hypot(ex - p[0], ey - p[1]) > 8) svgEl('line', { class: 'fx2-leader is-' + (L.tone || 'see'), x1: p[0].toFixed(1), y1: p[1].toFixed(1), x2: ex.toFixed(1), y2: ey.toFixed(1) }, gLead);
        svgEl('circle', { class: 'fx2-dot is-' + (L.tone || 'see'), cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 3.5 }, gLead);
        requestAnimationFrame(function(){ e.classList.add('is-in'); });
      });
    }
    function rel(node){ var r = node.getBoundingClientRect(), h = box.getBoundingClientRect(); if(!r.width) return null; return { l: r.left - h.left, t: r.top - h.top, r: r.right - h.left, b: r.bottom - h.top }; }
    function speak(kind, text){
      if(!text){ bub.classList.remove('is-on'); return; }
      bub.className = 'fx2-bub is-' + kind;
      bub.querySelector('.fx2-bub-k').textContent = kind === 'emt' ? 'EMT' : kind === 'aed' ? 'AED' : '';
      bub.querySelector('.fx2-bub-t').textContent = text;
      placeBub();
      bub.classList.add('is-on');
    }
    function placeBub(){
      if(!G || !V) return;
      var sc = G.sc, w = bub.offsetWidth || 180, hb = bub.offsetHeight || 40, hd = P(240, -10);
      // above his head when there is room, else below it; never over the face
      var x = clamp(hd[0] - 30, sc.x + 8, sc.x + sc.w - w - 8), y = hd[1] - hb - (G.phone ? 34 : 60);
      if(y < sc.y + 8) y = hd[1] + (G.phone ? 34 : 70);
      bub.style.left = x.toFixed(1) + 'px'; bub.style.top = clamp(y, sc.y + 8, sc.y + sc.h - hb - 8).toFixed(1) + 'px';
    }
    function placeChips(){
      var sc = G.sc;
      who.textContent = C().who;
      who.style.left = (sc.x + 10) + 'px'; who.style.top = (sc.y + sc.h - who.offsetHeight - 10) + 'px';
      clock.style.left = (sc.x + sc.w - clock.offsetWidth - 10) + 'px'; clock.style.top = (sc.y + 10) + 'px';
    }

    /* ---------------------------------------------------- the protocol card */
    var NODES = {}; // id -> { el, h, kind }
    function node(id, kind, text){
      var n = NODES[id];
      if(!n){
        var e = el('div', 'fx2-node is-' + kind + ' is-new', '<span class="fx2-node-t">' + esc(text) + '</span>');
        e.setAttribute('data-id', id);
        chart.appendChild(e);
        n = NODES[id] = { el: e, kind: kind };
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ e.classList.remove('is-new'); }); });
      }
      return n;
    }
    function armsEl(id, step){
      var n = NODES[id + ':arms'];
      if(!n){
        var e = el('div', 'fx2-arms is-new');
        e.setAttribute('role', 'group'); e.setAttribute('aria-label', step.q);
        step.arms.forEach(function(a, j){
          var b = el('button', 'fx2-arm', '<span class="fx2-arm-t">' + esc(a.t) + '</span><span class="fx2-arm-c"></span>');
          b.type = 'button'; b.setAttribute('data-j', j);
          e.appendChild(b);
        });
        chart.appendChild(e);
        n = NODES[id + ':arms'] = { el: e, kind: 'arms' };
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ e.classList.remove('is-new'); }); });
      }
      return n;
    }
    function clearChart(){ NODES = {}; [].slice.call(chart.children).forEach(function(c){ if(c !== lines) c.remove(); }); [].slice.call(lines.querySelectorAll('path')).forEach(function(p){ if(!p.closest('marker')) p.remove(); }); }
    // the chart model -> positions; connectors drawn once (new ones draw in), pan so the newest part shows
    var LINES = {};
    function line(id, d, tone){
      var p = LINES[id];
      if(!p || !p.isConnected){ p = LINES[id] = svgEl('path', { class: 'fx2-ln is-new' }, lines); requestAnimationFrame(function(){ requestAnimationFrame(function(){ p.classList.remove('is-new'); }); }); }
      p.setAttribute('d', d); p.setAttribute('class', p.getAttribute('class').replace(/ is-(ok|bad|off)/g, '') + (tone ? ' is-' + tone : ''));
      p.setAttribute('marker-end', tone === 'off' ? '' : 'url(#fx2-ah)');
      p.setAttribute('pathLength', '1');
    }
    function layoutChart(){
      if(!G) return;
      var t = T(), c = C(), PW = paper.clientWidth, NW = Math.min(PW - 20, 250), x0 = (PW - NW) / 2, y = 4, gap = G.phone ? 16 : 20;
      var seen = {}, prev = null; // prev: { x, y } the point the next box's arrow starts from
      chart.style.width = PW + 'px';
      t.items.forEach(function(it){
        var n = node(it.id, it.kind, it.text);
        seen[it.id] = true;
        n.el.style.width = NW + 'px'; n.el.style.left = x0 + 'px'; n.el.style.top = y + 'px';
        var h = n.el.offsetHeight;
        if(prev) line('to:' + it.id, 'M' + prev.x + ' ' + prev.y + 'V' + ((prev.y + y) / 2) + 'H' + (PW / 2) + 'V' + (y - 1), 'ok');
        y += h;
        prev = { x: PW / 2, y: y };
        if(it.kind === 'dec'){
          var step = c.steps[it.step], a = armsEl(it.id, step), AW = Math.min(PW - 12, step.arms.length > 2 ? 420 : 330);
          seen[it.id + ':arms'] = true;
          a.el.style.width = AW + 'px'; a.el.style.left = ((PW - AW) / 2) + 'px';
          var ay = y + (G.phone ? 14 : 18);
          a.el.style.top = ay + 'px';
          paintArms(it, step, a.el);
          var ah = a.el.offsetHeight, okAt = null;
          [].forEach.call(a.el.children, function(b, j){
            var bx = (PW - AW) / 2 + b.offsetLeft + b.offsetWidth / 2, st = (t.picks[it.step] || {})[j];
            line('arm:' + it.id + ':' + j, 'M' + (PW / 2) + ' ' + y + 'V' + (y + (ay - y) / 2) + 'H' + bx.toFixed(1) + 'V' + (ay + b.offsetTop - 1), st === 'ok' ? 'ok' : st === 'bad' ? 'bad' : 'off');
            if(st === 'ok') okAt = { x: bx, y: ay + b.offsetTop + b.offsetHeight };
          });
          y = ay + ah;
          prev = okAt;
        }
        y += gap;
      });
      Object.keys(NODES).forEach(function(k){ if(!seen[k]){ NODES[k].el.remove(); delete NODES[k]; } });
      Object.keys(LINES).forEach(function(k){ var id = k.replace(/^(to|arm):/, '').replace(/:\d+$/, ''); if(!seen[id]){ LINES[k].remove(); delete LINES[k]; } });
      var total = y;
      lines.setAttribute('width', PW); lines.setAttribute('height', Math.max(total, 10));
      chart.style.height = total + 'px';
      // pan: the newest box and its arms in view, with a little of the box before it
      var vis = view.clientHeight - 6, pan = Math.max(0, total - vis + 8);
      var last = t.items[t.items.length - 1], lastN = last && NODES[last.id];
      if(lastN && lastN.el.offsetTop - pan < 4) pan = Math.max(0, lastN.el.offsetTop - 4);
      chart.style.transform = 'translateY(' + (-pan).toFixed(1) + 'px)';
      chart.classList.toggle('is-panned', pan > 0);
    }
    function paintArms(it, step, a){
      var t = T(), picks = t.picks[it.step] || {}, ask = t.i === it.step && t.phase === 'ask' && !t.done, okDone = Object.keys(picks).some(function(j){ return picks[j] === 'ok'; });
      [].forEach.call(a.children, function(b, j){
        var arm = step.arms[j], st = picks[j] || (okDone ? 'off' : '');
        b.className = 'fx2-arm' + (st ? ' is-' + st : '') + (ask && !st ? ' is-live' : '');
        b.disabled = !(ask && !st);
        b.querySelector('.fx2-arm-c').textContent = st === 'bad' ? arm.con : '';
        b.setAttribute('aria-label', arm.t + (st === 'ok' ? ', chosen' : st === 'bad' ? ', wrong: ' + arm.con : st === 'off' ? ', not taken' : ''));
      });
    }

    /* ---------------------------------------------------- the calls, step by step */
    function cz(parts){ cause.set(parts); }
    function seeAsk(step){ cz([{ t: step.see, role: 'see' }, { t: step.q, role: 'ask' }]); }
    function setPhase(p){ var t = T(); t.phase = p; box.setAttribute('data-phase', p); layoutChart(); }
    function addItem(kind, text, step){ var t = T(); t.items.push({ id: 'n' + t.items.length, kind: kind, text: text, step: step }); layoutChart(); }

    // the check that shows a step's finding (the student sees it before the arms appear)
    function checkSeq(step){
      var f = T().fx, c = C(), L = [];
      function look(){ camTo(lookFor(step)); setLabels([]); speak(null); }
      switch(step.check){
        case 'voice': return [[0, look], [500, function(){ speak('emt', 'Sir, can you hear me?'); }], [1000, function(){ f.eyes = 'open'; paintFx(); }],
          [450, function(){ speak('pt', 'Mmh…'); setLabels([{ text: 'Eyes open to voice', at: [240, 77] }]); }]];
        case 'bleed': return [[0, look], [600, function(){ speak(null); f.eyes = 'closed'; f.bleed = 'spurt'; paintFx(); }], [500, function(){ setLabels([{ text: 'Spurting blood', at: [150, 784] }]); }]];
        case 'snore': return [[0, look], [500, function(){ f.snore = true; paintFx(); }], [700, function(){ setLabels([{ text: 'Snoring', at: [240, 150] }]); }]];
        case 'breathe': return [[0, function(){ look(); f.snore = false; paintFx(); }], [500, function(){ f.chest = 'rise'; paintFx(); }], [1400, function(){ setLabels([{ text: 'Chest rises fully', at: [240, 310] }]); }]];
        case 'shock': return [[0, function(){ look(); f.chest = ''; paintFx(); }], [500, function(){ f.pale = Math.max(f.pale, 1); f.sweat = true; paintFx(); }], [700, function(){ f.pulse = true; paintFx(); }],
          [700, function(){ setLabels([{ text: 'Pale, sweaty', at: [240, 60] }, { text: 'Fast, weak pulse', at: [50, 600] }]); }]];
        case 'prio': return [[0, look], [600, function(){ setLabels([{ text: 'Responds to voice', at: [240, 77] }, { text: 'Shock', at: [240, 400] }]); }]];
        case 'tap': return [[0, look], [400, function(){ f.tap = true; paintFx(); speak('emt', 'Sir! Are you OK?'); }], [1300, function(){ f.tap = false; paintFx(); setLabels([{ text: 'No response', at: [240, 77] }]); }]];
        case 'pulse': return [[0, function(){ look(); speak(null); }], [400, function(){ f.carotid = true; paintFx(); }], [550, function(){ setLabels([{ text: 'Carotid, 10 s', at: [212, 188], tone: 'act' }]); }],
          [600, function(){ f.mouth = 'o'; f.chest = 'gasp'; paintFx(); }], [700, function(){ f.mouth = 'n'; paintFx(); }],
          [600, function(){ setLabels([{ text: 'No pulse', at: [212, 188] }, { text: 'Gasping', at: [240, 120] }]); }]];
        case 'aed': return [[0, function(){ look(); speak(null); f.cpr = true; paintFx(); }], [500, function(){ f.aed = true; paintFx(); }], [600, function(){ f.bare = true; f.pads = true; paintFx(); }],
          [700, function(){ f.cpr = false; f.screen = 'vf'; paintFx(); speak('aed', 'Analyzing. Don’t touch the patient.'); }],
          [1400, function(){ f.screen = 'shock'; paintFx(); speak(null); setLabels([{ text: 'Pads', at: [192, 249], tone: 'act' }]); }]];
      }
      return [[0, look]];
    }
    function startStep(instant){
      var t = T(), c = C(), step = c.steps[t.i];
      if(step.pre && !t.items.some(function(x){ return x.pre === t.i; })){ t.items.push({ id: 'n' + t.items.length, kind: 'act', text: step.pre, pre: t.i }); }
      addItem('dec', step.q, t.i);
      setPhase('check');
      cz([{ t: step.q, role: 'ask' }]);
      var seq = checkSeq(step);
      seq.push([300, function(){ setPhase('ask'); seeAsk(step); say(step.see + '. ' + step.q + ' ' + step.arms.map(function(a){ return a.t; }).join(', ') + '.'); showCue(); }]);
      if(instant) { run(seq); flush(); } else run(seq);
    }
    function pick(j, how){
      var t = T(), c = C(), step = c.steps[t.i], arm = step.arms[j];
      if(t.phase !== 'ask' || t.done || !arm) return;
      var picks = t.picks[t.i] = t.picks[t.i] || {};
      if(picks[j]) return;
      if(cue && cue.active()) cue.hide(true);
      if(o && o.onPick) o.onPick(St.tab);
      keepInView();
      var f = t.fx, see = { t: step.see, role: 'see' };
      setLabels([]); speak(null);
      if(!arm.ok){
        picks[j] = 'bad';
        setPhase('cons');
        cz([see, { t: arm.t, role: 'bad' }]);
        var seq = badSeq(arm, step);
        seq.push([200, function(){ cz([see, { t: arm.t, role: 'bad' }, { t: arm.res, role: 'bad' }]); say(arm.t + ': ' + arm.con + '. ' + arm.res + '.'); }]);
        seq.push([700, function(){ setLabels(findLabels(step)); }]);
        seq.push([350, function(){ setPhase('ask'); focusArm(how); }]);
        run(seq);
        return;
      }
      picks[j] = 'ok';
      setPhase('act');
      cz([see, { t: arm.t, role: 'ask' }]);
      if(arm.act) addItem('act', arm.act);
      var s2 = okSeq(arm, step);
      s2.push([150, function(){ cz([see, { t: arm.t, role: 'ask' }, { t: arm.res, role: 'do' }]); say(arm.t + '. ' + (arm.act ? arm.act + ': ' : '') + arm.res + '.'); }]);
      s2.push([1300, function(){
        if(t.i < c.steps.length - 1){ t.i++; startStep(); return; }
        // the end of the call: the last box, then the takeaway
        t.done = true; setPhase('end'); addItem('end', c.end);
        cz([see, { t: arm.t, role: 'ask' }, { t: arm.res, role: 'do' }]);
      }]);
      s2.push([1400, function(){ cause.take(c.take); say(c.take); keepInView(); }]);
      run(s2);
    }
    function findLabels(step){
      return ({ voice: [{ text: 'Eyes open to voice', at: [240, 77] }], bleed: [{ text: 'Spurting blood', at: [150, 784] }], snore: [{ text: 'Snoring', at: [240, 150] }],
        breathe: [{ text: 'Chest rises fully', at: [240, 310] }], shock: [{ text: 'Pale, sweaty', at: [240, 60] }, { text: 'Fast, weak pulse', at: [50, 600] }],
        prio: [{ text: 'Responds to voice', at: [240, 77] }, { text: 'Shock', at: [240, 400] }], tap: [{ text: 'No response', at: [240, 77] }],
        pulse: [{ text: 'No pulse', at: [212, 188] }, { text: 'Gasping', at: [240, 120] }], aed: [{ text: 'Pads', at: [192, 249], tone: 'act' }] })[step.check] || [];
    }
    function lose(n){ T().lost += n; paintFx(); placeChips(); }
    // a wrong arm: its consequence happens on the picture, then the label names it
    function badSeq(arm, step){
      var f = T().fx;
      switch(arm.bad){
        case 'misread': return [[300, function(){ speak('emt', 'What’s your name?'); }], [900, function(){ speak('pt', 'Mmh…'); setLabels([{ text: 'Only groans', at: [240, 120], tone: 'bad' }]); }]];
        case 'pain': return [[300, function(){ speak('emt', 'Squeezes his shoulder hard'); }], [900, function(){ speak('pt', 'Ow!'); setLabels([{ text: 'Needless pain', at: [300, 200], tone: 'bad' }]); }]];
        case 'pool': return [[200, function(){ f.pool = 2.2; f.pale = Math.min(3, f.pale + 1); paintFx(); }], [1500, function(){ lose(arm.lost); setLabels([{ text: 'Pool grows', at: [96, 700], tone: 'bad' }]); }]];
        case 'blue': return [[200, function(){ f.blue = true; paintFx(); }], [1100, function(){ setLabels([{ text: 'Lips turn blue', at: [240, 120], tone: 'bad' }]); }]];
        case 'bvm': return [[200, function(){ f.bvm = true; paintFx(); }], [1400, function(){ f.bvm = false; paintFx(); lose(arm.lost); setLabels([{ text: 'Time lost', at: [240, 60], tone: 'bad' }]); }]];
        case 'paler': return [[200, function(){ f.pale = Math.min(3, f.pale + 1); paintFx(); }], [1100, function(){ setLabels([{ text: 'Paler, colder', at: [240, 60], tone: 'bad' }]); }]];
        case 'slow': return [[200, function(){ lose(arm.lost); }], [900, function(){ setLabels([{ text: 'Still on the floor', at: [240, 500], tone: 'bad' }]); }]];
        case 'wait': return [[200, function(){ lose(arm.lost); }], [900, function(){ setLabels([{ text: 'No AED coming', at: [240, 77], tone: 'bad' }]); }]];
        case 'gray': return [[200, function(){ f.gray = Math.min(3, f.gray + 1); paintFx(); }], [1000, function(){ lose(arm.lost); setLabels([{ text: 'Turning gray', at: [240, 300], tone: 'bad' }]); }]];
        case 'breaths': return [[200, function(){ f.bvm = true; f.chest = 'rise'; paintFx(); }], [1500, function(){ f.bvm = false; f.chest = 'gasp'; f.gray = Math.min(3, f.gray + 1); paintFx(); }],
          [700, function(){ lose(arm.lost); setLabels([{ text: 'No blood moves', at: [240, 300], tone: 'bad' }]); }]];
        case 'noshock': return [[200, function(){ f.cpr = true; paintFx(); }], [1400, function(){ f.cpr = false; paintFx(); lose(arm.lost); setLabels([{ text: 'No shock given', at: [240, 300], tone: 'bad' }]); }]];
      }
      return [];
    }
    // a right arm: the action happens on the picture, then the label names it
    function okSeq(arm, step){
      var f = T().fx;
      switch(arm.fx){
        case 'tourniquet': return [[200, function(){ f.tq = true; paintFx(); }], [900, function(){ f.bleed = 'held'; paintFx(); }], [700, function(){ setLabels([{ text: 'Tourniquet', at: [182, 738], tone: 'act' }]); }]];
        case 'jaw': return [[200, function(){ f.jaw = true; paintFx(); }], [700, function(){ f.snore = false; f.blue = false; paintFx(); }], [600, function(){ setLabels([{ text: 'Jaw thrust', at: [274, 128], tone: 'act' }]); }]];
        case 'blanket': return [[200, function(){ f.pulse = false; f.blanket = true; paintFx(); }], [900, function(){ setLabels([{ text: 'Blanket', at: [240, 450], tone: 'act' }]); }]];
        case 'transport': return [[200, function(){ f.exam = true; paintFx(); }], [2000, function(){ f.exam = false; paintFx(); setLabels([{ text: 'Rapid exam', at: [240, 300], tone: 'act' }]); }]];
        case 'call': return [[200, function(){ speak('emt', 'No response! Get the AED.'); }], [1100, function(){ setLabels([{ text: 'Help called', at: [240, 77], tone: 'act' }]); }]];
        case 'cpr': return [[200, function(){ f.carotid = false; f.chest = ''; f.bare = true; paintFx(); }], [500, function(){ f.cpr = true; paintFx(); speak('emt', 'One, two, three…'); }],
          [1800, function(){ f.cpr = false; f.bvm = true; f.chest = 'rise'; paintFx(); speak(null); }], [1300, function(){ f.bvm = false; f.chest = ''; f.cpr = true; paintFx(); setLabels([{ text: '30 pushes, 2 breaths', at: [240, 300], tone: 'act' }]); }]];
        case 'shock': return [[200, function(){ f.clear = true; f.cpr = false; paintFx(); speak('emt', 'Clear!'); }], [800, function(){ f.flash = true; paintFx(); }], [500, function(){ f.flash = false; f.screen = 'done'; f.clear = false; f.cpr = true; paintFx(); speak(null); }],
          [500, function(){ setLabels([{ text: 'CPR again', at: [240, 300], tone: 'act' }]); }]];
      }
      return [[200, function(){}]];
    }
    function focusArm(how){
      if(how !== 'key') return;
      var b = chart.querySelector('.fx2-arm.is-live'); if(b) try{ b.focus({ preventScroll: true }); }catch(e){}
    }
    function keepInView(){
      // a phone: the picture and the cause line both on screen
      if(!G || !G.phone) return;
      var lr = foot.getBoundingClientRect(), sr = box.getBoundingClientRect(), dy = 0;
      if(lr.bottom > innerHeight - 4) dy = lr.bottom - innerHeight + 8;
      if(sr.top - dy < 0) dy = sr.top - 8;
      if(Math.abs(dy) > 2) try{ window.scrollBy({ top: dy, behavior: reduced() ? 'auto' : 'smooth' }); }catch(e){ window.scrollBy(0, dy); }
    }

    chart.addEventListener('click', function(e){ var b = e.target.closest('.fx2-arm'); if(b && !b.disabled) pick(+b.getAttribute('data-j'), e.detail === 0 ? 'key' : 'tap'); });
    chart.addEventListener('keydown', function(e){
      var b = e.target.closest('.fx2-arm'); if(!b) return;
      var live = [].slice.call(chart.querySelectorAll('.fx2-arm.is-live')), i = live.indexOf(b);
      if(i < 0) return;
      var j = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? live.length - 1 : null;
      if(j == null) return;
      e.preventDefault(); live[(j + live.length) % live.length].focus();
    });

    /* ---------------------------------------------------- tabs, start over */
    function begin(instant){
      var t = T(), c = C();
      clearChart(); LINES = {};
      t.items = [];
      c.start.forEach(function(s, k){ t.items.push({ id: 's' + k, kind: 'act', text: s }); });
      startStep(instant);
    }
    function setTab(id, user){
      if(!BY[id]) return;
      stopAll();
      St.tab = id;
      tabs.value(id);
      head.purpose(BY[id].purpose);
      stage.setAttribute('data-tab', id);
      S[id] = fresh(BY[id]);
      if(!layout()){ St.pending = true; return; }
      box.classList.add('is-swap');
      draw();
      begin();
      setTimeout(function(){ box.classList.remove('is-swap'); }, 30);
      say(BY[id].name + ': ' + BY[id].who + '.');
      if(o && o.onTab) o.onTab(id, user);
    }
    function startOver(){
      stopAll();
      box.classList.add('is-clear');
      setTimeout(function(){
        S[St.tab] = fresh(C());
        draw();
        begin();
        box.classList.remove('is-clear');
        say(C().name + ': started over.');
      }, reduced() ? 60 : 260);
    }
    bReset.addEventListener('click', startOver);

    /* ---------------------------------------------------- draw (resize, tab, figure loaded) */
    function draw(){
      var g = layout();
      if(!g) return;
      G = g;
      var c = C(), t = T();
      box.classList.toggle('is-wide', G.wide); box.classList.toggle('is-tall', !G.wide); box.classList.toggle('is-phone', G.phone);
      svg.setAttribute('viewBox', '0 0 ' + G.W + ' ' + G.H);
      board.style.left = G.card.x + 'px'; board.style.top = G.card.y + 'px'; board.style.width = G.card.w + 'px'; board.style.height = G.card.h + 'px';
      ptitle.textContent = c.name;
      floor(c);
      figure(c);
      camTo(lookFor(c.steps[Math.min(t.i, c.steps.length - 1)]), true);
      props(c);
      placeChips();
      layoutChart();
      placeBub();
      placeLabels();
      svg.setAttribute('aria-label', c.who + ', lying on his back, seen from above, with the ' + c.name.toLowerCase() + ' protocol card beside him.');
      if(cue) cue.place();
      if(!FIGS) loadFig();
    }
    function loadFig(){
      if(!window.LevlBodyFigs) return;
      window.LevlBodyFigs.load('body', function(F){ if(!F || FIGS) return; FIGS = F; if(G){ figure(C()); props(C()); } });
    }
    var rt = null;
    if(window.ResizeObserver) new ResizeObserver(function(){ clearTimeout(rt); rt = setTimeout(function(){ var w = box.clientWidth, h = box.clientHeight; if(!G || Math.abs(w - G.W) > 1 || Math.abs(h - G.H) > 1) draw(); }, 60); }).observe(box);
    else window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(draw, 80); });

    /* ---------------------------------------------------- the one cue and "Show me how" */
    var cue = K.cue(layer, { key: 'nremt-flowcharts', text: 'Look at him, then pick', side: 'below', at: function(){
      var all = chart.querySelectorAll('.fx2-arms'), a = all[all.length - 1], k = layer.scale(); if(!a || !k) return [0, 0];
      // under the arms (the card is empty there), so it covers no arm and no box text
      var r = a.getBoundingClientRect(), h = box.getBoundingClientRect();
      return [(r.left - h.left + r.width / 2) / k, (r.bottom - h.top - 22) / k];
    } });
    function showCue(){ if(St.cued || !G || !box.clientWidth) return; St.cued = true; if(cue.show()) cue.place(); }
    var tour = K.tour({ key: 'nremt-flowcharts', label: 'Show me how', steps: [
      { id: 'see', text: 'Look at the patient: the picture shows what you find.', target: function(){ return gCam; } },
      { id: 'arm', text: 'Tap the answer that fits. The chart grows on the card.', target: function(){ return chart.querySelector('.fx2-arm.is-live') || board; } },
      { id: 'cause', text: 'This line says what you found and what it led to.', target: function(){ return cause.el; } }
    ] });
    function startTour(){ if(cue) cue.hide(true); tour.start(true); }
    box.addEventListener('pointerdown', function(){ if(cue && cue.active()) cue.hide(true); });

    /* ---------------------------------------------------- "?" */
    var ref = el('div', 'fx2-ref');
    ref.innerHTML =
      '<h3>What you are looking at</h3>' +
      '<p>A patient lying on his back, seen from above, with the protocol card on the floor beside him. At each question the picture shows what you find; tap the answer that fits and the next box of the chart is drawn on the card while the EMT does it. A wrong answer shows what it would cost (more blood lost, blue lips, minutes lost), stays struck on the card, and you pick again. Lost time stays on the clock until Start over; its minutes are rough figures for illustration, not measured delays.</p>' +
      '<h3>Primary assessment</h3>' +
      '<ul class="fx2-ref-l"><li><b>Responds to?</b> AVPU: he opens his eyes and groans when you speak, so V. Altered mental status raises his priority.</li>' +
      '<li><b>Severe bleeding?</b> Bright red blood spurting from the thigh is life threatening: a tourniquet 2 to 3 inches above the wound, never over the knee, tightened until the bleeding stops. In trauma it comes before the airway.</li>' +
      '<li><b>Airway open?</b> Snoring is the tongue partly blocking the airway. A fall puts the spine in question, so open it with a jaw thrust, not a head tilt.</li>' +
      '<li><b>Breathing OK?</b> Rate, depth and effort: 18 a minute with full chest rise is adequate.</li>' +
      '<li><b>Signs of shock?</b> Pale, cool, sweaty skin and a fast, weak radial pulse after blood loss. Keep him supine and warm (the tourniquet stays in sight), give oxygen if indicated, and transport fast.</li>' +
      '<li><b>High priority?</b> Altered mental status and shock make him high priority: a rapid head to toe exam and transport now; reassess every 5 minutes.</li></ul>' +
      '<p>The page\'s Primary assessment chart (Test yourself) asks about circulation as "bleeding still uncontrolled or perfusion adequate"; Explore asks "signs of shock?", because bleeding can be controlled while he is still in shock.</p>' +
      '<h3>Cardiac arrest (adult, AHA 2025)</h3>' +
      '<ul class="fx2-ref-l"><li><b>Responds?</b> Tap and shout. No response: shout for help, activate EMS and send for the AED.</li>' +
      '<li><b>Breathing, pulse?</b> Check both together, no more than 10 seconds. Three answers: normal breathing and a pulse (monitor him), a pulse but no normal breathing (a breath every 6 seconds, recheck the pulse every 2 minutes), or no pulse with no breathing or only gasping (start CPR). Gasps are not breathing.</li>' +
      '<li><b>CPR 30:2.</b> Hands on the lower half of the breastbone, 100 to 120 a minute, at least 2 inches deep, full recoil; 2 breaths with the bag and mask after every 30.</li>' +
      '<li><b>Shock advised?</b> The AED reads the rhythm. Shock advised: everyone clear, one shock, then compressions at once for 2 minutes until the AED checks again. No shock advised: compressions at once.</li></ul>' +
      '<p>Explore leaves out the second rhythm check, naloxone for a suspected opioid overdose and the other nine protocols. Every protocol, with Build it and Drill me, is in <button type="button" class="tk2-link fx2-ref-test">Test yourself</button>.</p>' +
      '<p class="fx2-ref-p"><button type="button" class="tk2-how fx2-ref-how">Show me how</button></p>' +
      '<p class="fx2-ref-s">The patients are made up for practice. Body figure derived from BodyParts3D, © 2008 Life Science Integrated Database Center, CC BY-SA 2.1 Japan. General, widely taught sequences, not scored sheets. For exam study only. Follow your local protocols and medical direction.</p>';
    ref.querySelector('.fx2-ref-how').addEventListener('click', function(){ if(studio){ if(studio.kit2 && studio.kit2.mode() !== 'explore') studio.kit2.go('explore'); if(studio.close) studio.close(); } setTimeout(startTour, 60); });
    ref.querySelector('.fx2-ref-test').addEventListener('click', function(){ if(studio && studio.kit2){ if(studio.close) studio.close(); studio.kit2.go('quiz'); } });

    stage.setAttribute('data-tab', St.tab);
    var started = false;
    var api = {
      stage: stage, ref: ref, CALLS: CALLS,
      tab: function(id){ if(id === undefined) return St.tab; if(id !== St.tab || !started){ started = !!layout(); setTab(id, false); } },
      // Explore leaves the screen: every timer stops and a sequence still running is finished at once, so coming
      // back shows a clean, finished state
      hidden: function(){ flush(); },
      shown: function(){
        draw();
        if(!started || St.pending){ started = true; St.pending = false; begin(); }
      },
      _state: function(){ return { tab: St.tab, t: T(), lost: T().lost }; }, _pick: pick, _flush: flush
    };
    return api;
  }

  window.NremtFlowExplore = { build: build, CALLS: CALLS };
})();
