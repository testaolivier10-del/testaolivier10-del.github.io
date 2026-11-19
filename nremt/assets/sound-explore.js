/* NREMT Sound trainer, tools v2 Explore (docs/tools-v2-nremt-sound-trainer-brief.md; standard docs/tools-v2-standard.md).

   THE IDEA: each lung and heart sound is loudest in one place on the chest, and it sounds the way it does because of
   what is happening inside. So Explore is a patient's chest with a stethoscope on it: drag the stethoscope (or tap a
   spot) and you hear the sound THERE, at the loudness it has there; a round lens beside the chest shows what makes
   the sound (a narrowed airway, fluid in the air sacs, a valve closing), and a monitor strip draws the sound as it
   plays. Normal and abnormal sit on one switch under the lens, so the two are compared at the same spot.

   Two tabs: Lung sounds (wheeze, crackles, stridor: real recordings) and Heart sounds (S3, S4, split S2, two murmurs:
   generated in the browser and labelled so; beyond the EMT exam).

   DATA comes from the page (SOUNDS: copy, clips, credits) and from sound-stage.js (SoundStage.pure: the listening
   sites, where each finding is loudest, the loudness mix per site), so Explore, Test yourself and the notes agree.
   Sounds play through sound-bank.js (one bank; starting one stops any other).

   RULES KEPT (docs/tools-v2-builder-brief.md): audio only ever starts from the student's own action (a drop, a tap,
   a key, Play), never on its own; every timer, frame loop and sound stops when Explore hides (Test yourself, "?",
   another tab, the page hidden); a word on the cause line appears only once the picture shows it (the trace has
   started, the lens is moving); reduced motion gets the full trace at once and a still lens.

     var ex = NremtSoundExplore.build({ studio, sounds, onAct() }) -> { stage, ref, hidden(), shown(), show(soundId),
                                                                       stop(), _state() } */
(function(){
  'use strict';
  if(window.NremtSoundExplore) return;
  var NS = 'http://www.w3.org/2000/svg';
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function sv(tag, attrs, parent){ var e = document.createElementNS(NS, tag); for(var a in attrs) if(attrs[a] != null) e.setAttribute(a, attrs[a]); if(parent) parent.appendChild(e); return e; }
  function f1(v){ return (Math.round(v * 10) / 10).toString(); }
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function ease(u){ return u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }

  /* ---- what Explore shows for each sound ------------------------------------------------------------------
     key: the key's name (phone: short); lens: the 1 to 3 word name of what the lens draws; normal: the lens name
     for the normal side of the switch; cause: the cause line's last pill; take: the takeaway once it has played. */
  var INFO = {
    wheeze:   { key: 'Wheeze', lens: 'Narrowed airway', normal: 'Open airway', draw: 'bronchiole',
      cause: 'air forced through narrowed small airways', ncause: 'air flows freely through open airways',
      take: 'A wheeze is air forced through narrowed small airways (asthma, COPD): heard over every lung field, mostly breathing out.' },
    crackles: { key: 'Crackles', lens: 'Fluid in air sacs', normal: 'Dry air sacs', draw: 'alveoli',
      cause: 'fluid filled air sacs pop open', ncause: 'dry air sacs fill quietly',
      take: 'Crackles are small airways and air sacs with fluid in them popping open, mostly breathing in: listen low, at the bases, first.' },
    stridor:  { key: 'Stridor', lens: 'Swollen upper airway', normal: 'Open upper airway', draw: 'larynx',
      cause: 'air forced through a narrowed upper airway', ncause: 'air flows freely past the larynx',
      take: 'Stridor is a narrowed upper airway (swelling, croup, a foreign body): loudest over the neck, mostly breathing in. An emergency.' },
    'heart-s3': { key: 'S3', lens: 'Stretched ventricle', cause: 'blood rushes into a stretched ventricle',
      take: 'S3 falls just after S2: blood rushing into a stretched ventricle early in filling (heart failure in an older adult; can be normal when young).' },
    'heart-s4': { key: 'S4', lens: 'Stiff ventricle', cause: 'the atrium pushes blood into a stiff ventricle',
      take: 'S4 falls just before S1: the atrium squeezing blood into a stiff ventricle at the end of filling (long standing high blood pressure).' },
    'heart-split-s2': { key: 'Split S2', lens: 'Two valves closing', cause: 'the aortic valve closes just before the pulmonic',
      take: 'A split S2 is the aortic and pulmonic valves closing a moment apart; it widens when the patient breathes in.' },
    'heart-systolic-murmur': { key: 'Systolic murmur', short: 'Systolic', lens: 'Narrow aortic valve', cause: 'blood squeezes through a narrow valve',
      take: 'A systolic murmur fills the gap between S1 and S2: turbulent flow while the ventricles squeeze (here, a narrow aortic valve).' },
    'heart-diastolic-murmur': { key: 'Diastolic murmur', short: 'Diastolic', lens: 'Leaky aortic valve', cause: 'blood leaks back while the heart fills',
      take: 'A diastolic murmur sits after S2, while the heart fills: here blood leaking back through an aortic valve that does not close.' },
    'heart-normal': { key: 'Normal', lens: 'Valves closing', cause: 'S1 and S2 are the valves closing',
      take: 'Normal: S1 is the mitral and tricuspid valves closing, S2 the aortic and pulmonic; the short gap is systole.' }
  };
  var TABS = [
    { id: 'lung', name: 'Lung sounds', purpose: 'Hear where each breath sound is loudest, and why.', keys: ['wheeze', 'crackles', 'stridor'],
      sites: ['trachea', 'lung-ru', 'lung-lu', 'lung-rl', 'lung-ll', 'back-lu', 'back-ru', 'back-ll', 'back-rl'], views: ['front', 'back'], kind: 'lung' },
    { id: 'heart', name: 'Heart sounds', purpose: 'Beyond the EMT exam: hear where each heart sound is loudest.',
      keys: ['heart-s3', 'heart-s4', 'heart-split-s2', 'heart-systolic-murmur', 'heart-diastolic-murmur'],
      sites: ['aortic', 'pulmonic', 'erb', 'tricuspid', 'mitral'], views: ['front'], kind: 'heart' }
  ];
  // the short name on the picture of each listening spot (1 to 3 words); the full one is the button's name
  var SHORT = { trachea: 'Trachea', aortic: 'Aortic area', pulmonic: 'Pulmonic area', erb: 'Erb’s point', tricuspid: 'Tricuspid area',
    mitral: 'Mitral area', 'lung-ru': 'Right apex', 'lung-lu': 'Left apex', 'lung-rl': 'Right base', 'lung-ll': 'Left base',
    'back-lu': 'Left upper back', 'back-ru': 'Right upper back', 'back-ll': 'Left lower back', 'back-rl': 'Right lower back' };
  var PRE = 0.25; // the heart strip starts this long before S1 (as the timing test's strip does)

  function build(o){
    var K = window.LevlKit2, Bank = window.LevlSoundBank, P = window.SoundStage && window.SoundStage.pure, studio = o.studio;
    var SOUNDS = o.sounds, byId = {}; SOUNDS.forEach(function(s){ byId[s.id] = s; });
    var SITE = {}; P.SITES.forEach(function(s){ SITE[s.id] = s; });
    var reduced = function(){ return K.reduced(); };
    var St = { tab: 'lung', on: true, per: {} };
    TABS.forEach(function(t){ St.per[t.id] = { key: t.keys[0], normal: false, site: null, view: 'front' }; });
    function T(){ return TABS.filter(function(t){ return t.id === St.tab; })[0]; }
    function S(){ return St.per[St.tab]; }
    // the sound heard now: the selected key, or the normal one on the switch's other side
    function cur(){ var s = S(); return s.normal ? (T().kind === 'heart' ? byId['heart-normal'] : null) : byId[s.key]; }

    /* ---------------------------------------------------------------- the stage */
    var stage = el('div', 'snd2');
    var tabs = K.tabs({ label: 'Which sounds', items: TABS.map(function(t){ return { value: t.id, label: t.name }; }), value: St.tab, big: true,
      onChange: function(v){ setTab(v, true); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: T().purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var box = el('div', 'snd2-scene');
    box.id = 'snd2-scene';
    box.innerHTML =
      '<svg class="snd2-svg" role="img" aria-label="" xmlns="' + NS + '" data-ls-text="keep">' +
        '<g class="snd2-bg"></g><g class="snd2-fig"></g><g class="snd2-sites"></g><g class="snd2-lead"></g><g class="snd2-lens"></g>' +
        '<g class="snd2-strip"></g><g class="snd2-tube"></g></svg>' +
      '<div class="snd2-keys" role="radiogroup" aria-label="Sound"></div>' +
      '<div class="snd2-view" role="group" aria-label="Side of the chest"><button type="button" data-view="front">Front</button><button type="button" data-view="back">Back</button></div>' +
      '<div class="snd2-hits"></div>' +
      '<p class="snd2-lab snd2-sitelab" aria-hidden="true"></p>' +
      '<p class="snd2-lab snd2-lenslab" aria-hidden="true"></p>' +
      '<div class="snd2-ab" role="radiogroup" aria-label="Compare"><button type="button" role="radio" data-ab="n"></button><button type="button" role="radio" data-ab="a"></button></div>' +
      '<button type="button" class="snd2-play" aria-label="Play"></button>' +
      '<button type="button" class="snd2-steth" aria-label="Stethoscope. Arrow keys move it from spot to spot; Enter plays or stops.">' +
        '<svg viewBox="-30 -30 60 60" aria-hidden="true"><circle class="snd2-dia-rim" r="27"/><circle class="snd2-dia" r="21"/><circle class="snd2-dia-shine" cx="-7" cy="-8" r="6"/><circle class="snd2-dia-c" r="4"/></svg></button>';
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', box.id); });
    stage.appendChild(box);
    var svg = box.querySelector('svg'), gBg = svg.querySelector('.snd2-bg'), gFig = svg.querySelector('.snd2-fig'), gSites = svg.querySelector('.snd2-sites'),
      gLead = svg.querySelector('.snd2-lead'), gLens = svg.querySelector('.snd2-lens'), gStrip = svg.querySelector('.snd2-strip'), gTube = svg.querySelector('.snd2-tube');
    var keys = box.querySelector('.snd2-keys'), viewSw = box.querySelector('.snd2-view'), hits = box.querySelector('.snd2-hits'),
      siteLab = box.querySelector('.snd2-sitelab'), lensLab = box.querySelector('.snd2-lenslab'), ab = box.querySelector('.snd2-ab'),
      bPlay = box.querySelector('.snd2-play'), steth = box.querySelector('.snd2-steth');
    var layer = K.layer(box);
    var cause = K.cause({ label: 'What you hear and why' });
    var lines = el('div', 'snd2-lines'); lines.appendChild(cause.el); stage.appendChild(lines);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    var FIG = null, G = null;
    if(window.LevlBodyFigs) window.LevlBodyFigs.load('chest', function(F){ if(F){ FIG = F; draw(); } });

    /* ---------------------------------------------------------------- geometry (stage px) */
    function layout(){
      var W = box.clientWidth, H = box.clientHeight;
      if(!W || !H) return null;
      var phone = W < 640, kh = keys.offsetHeight + 12, wide = W >= 760 && W >= H * 1.02, g = { W: W, H: H, phone: phone, wide: wide, kh: kh };
      var fa, lr, lx, ly, sx, sy, sw, sh;
      if(wide){
        fa = { x: 12, y: kh + 2, w: Math.round(W * 0.55), h: H - kh - 12 };
        var rx = fa.x + fa.w + 18, rw = W - rx - 16;
        lr = Math.min(rw * 0.33, (H - kh) * 0.25, 128);
        lx = rx + rw / 2; ly = kh + 34 + lr;
        sx = rx; sw = rw; sy = ly + lr + 64; sh = Math.min(190, H - sy - 14);
        g.abY = ly + lr + 12; g.abX = lx; g.abW = Math.min(rw, 360);
      } else {
        var bandH = phone ? 214 : 250;
        fa = { x: 8, y: kh, w: W - 16, h: H - kh - bandH - 6 };
        var y0 = fa.y + fa.h + 6;
        lr = Math.min(phone ? W * 0.19 : 96, (bandH - 46) / 2);
        lx = 12 + lr; ly = y0 + 30 + lr;
        sx = lx + lr + 16; sw = W - sx - 10; sy = y0 + 54; sh = bandH - 60;
        g.abY = y0 + 4; g.abX = sx + sw / 2; g.abW = sw;
      }
      var k = Math.min(fa.w / 600, fa.h / 666), ox = fa.x + (fa.w - 600 * k) / 2, oy = fa.y + Math.max(0, (fa.h - 666 * k) / 2);
      g.fa = fa; g.k = k; g.ox = ox; g.oy = oy;
      g.lens = { x: lx, y: ly, r: lr }; g.strip = { x: sx, y: sy, w: sw, h: sh };
      g.rest = toStage([70, 92], g);
      g.pr = clamp(26 * k * 1.25, 19, 28); // the chest piece's radius
      return g;
    }
    function toStage(p, g){ g = g || G; return [g.ox + p[0] * g.k, g.oy + p[1] * g.k]; }
    function sitePos(id, g){
      var s = SITE[id], f = FIG && FIG.figs['chest-' + s.view], L = f && f.landmarks[id];
      return toStage(L || [s.x, s.y], g);
    }
    function visibleSites(){ var v = S().view; return T().sites.filter(function(id){ return SITE[id].view === v; }); }

    /* ---------------------------------------------------------------- the scene */
    function draw(){
      if(!St.on) return;
      paintKeys();
      var g = layout(); if(!g) return;
      G = g;
      svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H);
      drawBg(); drawFig(); drawSites(); drawLensFrame(); drawStripFrame(); placeHtml();
      paintKeys(); placeSteth(S().site ? sitePos(S().site) : g.rest, true);
      frame(true);
      if(cue) cue.place();
    }
    function drawBg(){
      var g = G, h = [];
      // a clinic wall with a curtain on its rail, the patient sitting in front of it
      h.push('<defs><linearGradient id="snd2-wall" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="snd2-wall0"/><stop offset="1" class="snd2-wall1"/></linearGradient>' +
        '<linearGradient id="snd2-curt" x1="0" x2="1"><stop offset="0" class="snd2-c0"/><stop offset=".5" class="snd2-c1"/><stop offset="1" class="snd2-c0"/></linearGradient>' +
        '<radialGradient id="snd2-spot" cx=".5" cy=".42" r=".6"><stop offset="0" class="snd2-spot0"/><stop offset="1" class="snd2-spot1"/></radialGradient></defs>');
      h.push('<rect class="snd2-wall" x="0" y="0" width="' + g.W + '" height="' + g.H + '" fill="url(#snd2-wall)"/>');
      for(var y = 60; y < g.H; y += 60) h.push('<line class="snd2-panel" x1="0" y1="' + y + '" x2="' + g.W + '" y2="' + y + '"/>');
      var cw = Math.max(36, g.W * (g.wide ? 0.06 : 0.07));
      h.push('<rect class="snd2-rail" x="0" y="' + (g.kh - 4) + '" width="' + g.W + '" height="4"/>');
      for(var i = 0; i < 4; i++) h.push('<rect x="' + f1(i * cw / 4) + '" y="' + g.kh + '" width="' + f1(cw / 4 + 1) + '" height="' + (g.H - g.kh) + '" fill="url(#snd2-curt)"/>');
      var fa = g.fa;
      h.push('<ellipse cx="' + f1(fa.x + fa.w / 2) + '" cy="' + f1(fa.y + fa.h * .45) + '" rx="' + f1(fa.w * .55) + '" ry="' + f1(fa.h * .6) + '" fill="url(#snd2-spot)"/>');
      // the panel behind the lens and the strip: a small exam light box
      gBg.innerHTML = h.join('');
    }
    function drawFig(){
      var g = G, f = FIG && FIG.figs['chest-' + S().view];
      gFig.innerHTML = '';
      if(!f) return;
      sv('image', { href: FIG.url(f), x: f1(g.ox), y: f1(g.oy), width: f1(600 * g.k), height: f1(666 * g.k), class: 'snd2-img', preserveAspectRatio: 'none' }, gFig);
      // R and L: which side of the patient is which (front view: his right on your left)
      var front = S().view === 'front', y = g.oy + 150 * g.k;
      [[g.ox + 48 * g.k, front ? 'R' : 'L'], [g.ox + 552 * g.k, front ? 'L' : 'R']].forEach(function(a){
        var t = sv('text', { x: f1(a[0]), y: f1(y), class: 'snd2-rl' }, gFig); t.textContent = a[1];
      });
    }
    var siteEls = {};
    function drawSites(){
      gSites.innerHTML = ''; hits.innerHTML = ''; siteEls = {};
      var r = clamp(15 * G.k * 1.4, 12, 17);
      visibleSites().forEach(function(id){
        var p = sitePos(id), gg = sv('g', { class: 'snd2-site snd2-site--' + T().kind, 'data-site': id }, gSites);
        var halo = sv('circle', { cx: f1(p[0]), cy: f1(p[1]), r: r, class: 'snd2-halo' }, gg);
        sv('circle', { cx: f1(p[0]), cy: f1(p[1]), r: f1(r * .62), class: 'snd2-ring' }, gg);
        sv('circle', { cx: f1(p[0]), cy: f1(p[1]), r: f1(r * .22), class: 'snd2-core' }, gg);
        var b = el('button', 'snd2-hit');
        b.type = 'button'; b.setAttribute('data-site', id);
        b.setAttribute('aria-label', 'Listen at the ' + SITE[id].name + ': ' + SITE[id].where);
        b.style.left = f1(p[0]) + 'px'; b.style.top = f1(p[1]) + 'px';
        hits.appendChild(b);
        siteEls[id] = { g: gg, halo: halo, b: b, p: p, r: r };
      });
      paintSites();
    }
    function strengthAt(id){
      var snd = cur(), s = SITE[id];
      if(!snd) return 0.55; // normal breath sounds: heard over every lung field and the trachea
      return P.strength(snd, s);
    }
    function paintSites(){
      Object.keys(siteEls).forEach(function(id){
        var e = siteEls[id], k = strengthAt(id);
        e.halo.setAttribute('r', f1(e.r * (1 + 1.1 * k)));
        e.halo.style.opacity = (0.1 + 0.42 * k).toFixed(2);
        e.g.classList.toggle('is-on', S().site === id);
      });
    }

    /* the sound keys, the normal / abnormal switch, Play */
    function paintKeys(){
      var t = T(), s = S();
      if(keys.getAttribute('data-tab') !== t.id){
        keys.setAttribute('data-tab', t.id);
        keys.innerHTML = t.keys.map(function(id){
          var I = INFO[id];
          return '<button type="button" class="snd2-key" role="radio" data-key="' + id + '" aria-label="' + esc(byId[id].label) + '"><span class="snd2-key-l">' + esc(I.key) + '</span>' +
            (I.short ? '<span class="snd2-key-s" aria-hidden="true">' + esc(I.short) + '</span>' : '') + '</button>';
        }).join('') + (t.kind === 'heart' ? '<span class="snd2-made">Generated, not recorded</span>' : '<span class="snd2-made">Real recordings</span>');
      }
      keys.querySelectorAll('.snd2-key').forEach(function(b){ var on = b.getAttribute('data-key') === s.key; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
      viewSw.hidden = t.views.length < 2;
      viewSw.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === s.view)); });
      var I = INFO[s.key], nb = ab.querySelector('[data-ab="n"]'), axb = ab.querySelector('[data-ab="a"]');
      nb.textContent = 'Normal';
      axb.innerHTML = '<span class="snd2-key-l">' + esc(I.key) + '</span>' + (I.short ? '<span class="snd2-key-s">' + esc(I.short) + '</span>' : '');
      axb.setAttribute('aria-label', byId[s.key].label);
      nb.setAttribute('aria-checked', String(s.normal)); axb.setAttribute('aria-checked', String(!s.normal));
      nb.tabIndex = s.normal ? 0 : -1; axb.tabIndex = s.normal ? -1 : 0;
      paintPlay();
    }
    function paintPlay(){
      var on = !!play.on, can = !!(S().site && cur());
      bPlay.classList.toggle('is-on', on);
      bPlay.disabled = !can && !on;
      bPlay.setAttribute('aria-label', on ? 'Stop' : 'Play');
      bPlay.innerHTML = on ? '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="5" width="10" height="10" rx="1.5"/></svg>'
        : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z"/></svg>';
    }
    function placeHtml(){
      var g = G, L = g.lens, Sx = g.strip;
      ab.style.left = f1(g.abX) + 'px'; ab.style.top = f1(g.abY) + 'px'; ab.style.width = f1(g.abW) + 'px';
      var pb = Math.min(44, Sx.h - 20);
      bPlay.style.width = bPlay.style.height = pb + 'px';
      bPlay.style.left = f1(Sx.x + 10) + 'px'; bPlay.style.top = f1(Sx.y + Sx.h / 2 - pb / 2) + 'px';
      lensLab.style.left = f1(L.x) + 'px'; lensLab.style.top = f1(L.y - L.r - 8) + 'px';
      viewSw.style.top = f1(g.kh + 6) + 'px'; viewSw.style.left = f1(g.fa.x + g.fa.w - 6) + 'px';
    }

    /* ---------------------------------------------------------------- the lens: what makes the sound */
    var LZ = null;
    function drawLensFrame(){
      var L = G.lens;
      gLens.innerHTML = '';
      sv('circle', { cx: f1(L.x), cy: f1(L.y + 3), r: f1(L.r + 6), class: 'snd2-lens-sh' }, gLens);
      var cp = sv('clipPath', { id: 'snd2-lc' }, sv('defs', {}, gLens));
      sv('circle', { cx: f1(L.x), cy: f1(L.y), r: f1(L.r) }, cp);
      var inner = sv('g', { 'clip-path': 'url(#snd2-lc)' }, gLens);
      var body = sv('g', { class: 'snd2-lz', transform: 'translate(' + f1(L.x) + ' ' + f1(L.y) + ') scale(' + (L.r / 100).toFixed(4) + ')' }, inner);
      sv('circle', { cx: f1(L.x), cy: f1(L.y), r: f1(L.r), class: 'snd2-lens-rim' }, gLens);
      LZ = { body: body, kind: null, parts: {} };
      buildLens();
    }
    // design units: the lens is a circle of radius 100 around 0, 0
    function buildLens(){
      if(!LZ) return;
      var snd = byId[S().key], I = INFO[S().key], normal = S().normal, b = LZ.body, d = I.draw || 'heart';
      b.innerHTML = ''; LZ.parts = {}; LZ.kind = d; LZ.normal = normal; LZ.sid = S().key;
      var P_ = LZ.parts, i;
      if(d === 'bronchiole'){
        sv('rect', { x: -110, y: -110, width: 220, height: 220, class: 'snd2-tis' }, b);
        for(i = 0; i < 26; i++){ var a = i * 2.39996, rr = 22 + (i * 37 % 80); sv('circle', { cx: f1(Math.cos(a) * rr * 1.2), cy: f1(Math.sin(a) * rr * 1.2), r: 9 + i % 4, class: 'snd2-alv-bg' }, b); }
        // the airway, lengthwise: its wall squeezed in at the middle when narrowed
        var gap = normal ? 30 : 9;
        function wall(sign){
          var y0 = sign * 44, y1 = sign * (gap + 10), pts = 'M-112 ' + (sign * 70) + ' L-112 ' + y0 + ' C-60 ' + y0 + ' -40 ' + y1 + ' 0 ' + y1 + ' C40 ' + y1 + ' 60 ' + y0 + ' 112 ' + y0 + ' L112 ' + (sign * 70) + ' Z';
          sv('path', { d: pts, class: 'snd2-wall-t' }, b);
          var inner = 'M-112 ' + (sign * 34) + ' C-60 ' + (sign * 34) + ' -40 ' + (sign * gap) + ' 0 ' + (sign * gap) + ' C40 ' + (sign * gap) + ' 60 ' + (sign * 34) + ' 112 ' + (sign * 34);
          sv('path', { d: inner + ' L112 ' + y0 + ' C60 ' + y0 + ' 40 ' + y1 + ' 0 ' + y1 + ' C-40 ' + y1 + ' -60 ' + y0 + ' -112 ' + y0 + ' Z', class: 'snd2-muc' }, b);
          if(!normal) for(var m = -2; m <= 2; m++) sv('path', { d: 'M' + (m * 14 - 5) + ' ' + (sign * (gap + 4)) + ' q5 ' + (sign * 6) + ' 10 0', class: 'snd2-musc' }, b);
        }
        sv('rect', { x: -112, y: -36, width: 224, height: 72, class: 'snd2-lumen' }, b);
        wall(-1); wall(1);
        P_.air = []; for(i = 0; i < 16; i++) P_.air.push(sv('circle', { r: 3.2, class: 'snd2-air' }, b));
        P_.half = function(x){ var u = Math.min(1, Math.abs(x) / 70); var e2 = u < 1 ? (1 - Math.cos(Math.PI * u)) / 2 : 1; return gap + (34 - gap) * e2 - 4; };
        if(!normal){ P_.waves = []; for(i = 0; i < 3; i++) P_.waves.push(sv('path', { class: 'snd2-wave', d: 'M0 0' }, b)); }
      } else if(d === 'alveoli'){
        sv('rect', { x: -110, y: -110, width: 220, height: 220, class: 'snd2-tis' }, b);
        sv('path', { d: 'M-110 -14 C-70 -14 -50 -8 -28 -4 L-28 6 C-50 4 -70 8 -110 8 Z', class: 'snd2-bron' }, b);
        var SAC = [[-6, -2, 24], [30, -40, 25], [44, 8, 26], [22, 50, 24], [-24, 44, 22], [-26, -44, 23], [70, -26, 20], [62, 48, 20], [8, -78, 18], [80, 14, 0]];
        P_.sacs = [];
        SAC.forEach(function(s, j){
          if(!s[2]) return;
          var wet = !normal && j % 2 === 0 && j > 0, gS = sv('g', { class: 'snd2-sac' + (wet ? ' is-wet' : ''), transform: 'translate(' + s[0] + ' ' + s[1] + ')' }, b);
          var c = sv('circle', { r: s[2], class: 'snd2-sac-w' }, gS);
          var fl = wet ? sv('path', { d: 'M' + (-s[2]) + ' ' + (s[2] * .25) + ' Q0 ' + (s[2] * .05) + ' ' + s[2] + ' ' + (s[2] * .25) + ' A' + s[2] + ' ' + s[2] + ' 0 0 1 ' + (-s[2]) + ' ' + (s[2] * .25) + 'Z', class: 'snd2-fluid' }, gS) : null;
          var pop = wet ? sv('path', { class: 'snd2-pop', d: 'M-9 -9l-6 -6M9 -9l6 -6M0 -12v-8M-12 0h-8M12 0h8' }, gS) : null;
          P_.sacs.push({ g: gS, c: c, r: s[2], wet: wet, pop: pop, x: s[0], y: s[1] });
        });
      } else if(d === 'larynx'){
        sv('rect', { x: -110, y: -110, width: 220, height: 220, class: 'snd2-neck' }, b);
        // the trachea from the front, its cartilage rings, and the larynx at the top
        sv('path', { d: 'M-34 -110 L-34 110 L34 110 L34 -110 Z', class: 'snd2-trach' }, b);
        for(i = 0; i < 7; i++) sv('path', { d: 'M-34 ' + (-10 + i * 18) + ' Q0 ' + (-4 + i * 18) + ' 34 ' + (-10 + i * 18), class: 'snd2-cart' }, b);
        var n = normal ? 18 : 5;
        sv('path', { d: 'M-34 -110 L-34 -30 C-34 -40 ' + (-n - 10) + ' -52 ' + (-n) + ' -52 L' + (-n) + ' -66 C-20 -80 -34 -90 -34 -110 Z', class: normal ? 'snd2-fold' : 'snd2-swell' }, b);
        sv('path', { d: 'M34 -110 L34 -30 C34 -40 ' + (n + 10) + ' -52 ' + n + ' -52 L' + n + ' -66 C20 -80 34 -90 34 -110 Z', class: normal ? 'snd2-fold' : 'snd2-swell' }, b);
        sv('rect', { x: -110, y: -110, width: 76, height: 220, class: 'snd2-neck-s' }, b);
        sv('rect', { x: 34, y: -110, width: 76, height: 220, class: 'snd2-neck-s' }, b);
        P_.gap = n;
        P_.air = []; for(i = 0; i < 14; i++) P_.air.push(sv('circle', { r: 3.2, class: 'snd2-air' }, b));
        if(!normal){ P_.waves = []; for(i = 0; i < 3; i++) P_.waves.push(sv('path', { class: 'snd2-wave', d: 'M0 0' }, b)); }
      } else {
        buildHeart(b, snd.synth || 'normal');
      }
      lensLab.textContent = normal ? (I.normal || INFO['heart-normal'].lens) : (I.lens);
      lensLab.className = 'snd2-lab snd2-lenslab' + (normal ? ' is-normal' : '');
    }
    // the heart, cut open from the front: right atrium and ventricle on the viewer's left, left on the right
    function buildHeart(b, kind){
      var P_ = LZ.parts, dil = kind === 's3', stiff = kind === 's4';
      sv('rect', { x: -110, y: -110, width: 220, height: 220, class: 'snd2-peri' }, b);
      var gH = sv('g', { class: 'snd2-heart' }, b);
      P_.ra = sv('path', { class: 'snd2-ch is-blue', d: 'M-70 -52 C-86 -50 -88 -8 -64 -4 L-12 -4 L-12 -44 C-26 -56 -54 -56 -70 -52Z' }, gH);
      P_.la = sv('path', { class: 'snd2-ch is-red', d: 'M14 -46 C30 -58 66 -56 78 -44 C88 -28 80 -8 66 -4 L14 -4Z' }, gH);
      var lv = dil ? 'M10 4 L92 4 C106 40 84 96 30 96 C14 80 10 40 10 4Z' : 'M14 4 L80 4 C92 36 72 84 34 88 C22 70 14 40 14 4Z';
      P_.rv = sv('path', { class: 'snd2-ch is-blue', d: 'M-74 4 L-12 4 L-12 60 C-14 76 -26 86 -34 88 C-62 70 -80 40 -74 4Z' }, gH);
      P_.lvWall = sv('path', { class: 'snd2-myo' + (stiff ? ' is-thick' : ''), d: lv }, gH);
      P_.lv = sv('path', { class: 'snd2-ch is-red', d: lv, transform: stiff ? 'translate(50 44) scale(.72) translate(-50 -44)' : 'translate(50 44) scale(.86) translate(-50 -44)' }, gH);
      // the great vessels: the pulmonary artery from the right ventricle, the aorta from the left
      sv('path', { class: 'snd2-ves is-blue', d: 'M-28 -6 L-28 -64 C-28 -84 -40 -96 -60 -100 L-56 -112 C-30 -106 -14 -90 -14 -64 L-14 -6Z' }, gH);
      sv('path', { class: 'snd2-ves is-red', d: 'M-6 -6 L-6 -70 C-6 -100 30 -112 56 -98 L50 -86 C32 -96 8 -90 8 -70 L8 -6Z' }, gH);
      function valve(x, y, w, horiz){ var g2 = sv('g', { class: 'snd2-valve', transform: 'translate(' + x + ' ' + y + ')' }, gH);
        var a = sv('line', { x1: -w, y1: 0, x2: 0, y2: 0 }, g2), c = sv('line', { x1: w, y1: 0, x2: 0, y2: 0 }, g2);
        var fl = sv('circle', { r: w + 6, class: 'snd2-flash' }, g2);
        return { g: g2, a: a, b: c, w: w, flash: fl, dir: horiz ? -1 : 1 }; }
      P_.tri = valve(-40, 0, 16); P_.mit = valve(46, 0, 18);
      P_.pul = valve(-21, -30, 7, true); P_.aor = valve(1, -36, 7, true);
      if(kind === 'systolic-murmur'){ P_.aor.g.classList.add('is-stenotic'); }
      if(kind === 'diastolic-murmur'){ P_.aor.g.classList.add('is-leaky'); }
      P_.flashLV = sv('path', { class: 'snd2-flash-w', d: lv }, gH);
      P_.blood = []; for(var i = 0; i < 12; i++) P_.blood.push(sv('circle', { r: 3, class: 'snd2-blood' }, gH));
      P_.kind = kind;
    }
    // valve state: 0 closed, 1 open
    function setValve(v, open, flash){
      // AV valves open down into the ventricles, the aortic and pulmonic valves up into the vessels
      var leaky = v.g.classList.contains('is-leaky'), ang = open * (v.g.classList.contains('is-stenotic') ? 26 : 62) + (leaky && open < .5 ? 18 : 0);
      var w = v.w, ca = Math.cos(ang * Math.PI / 180), sa = Math.sin(ang * Math.PI / 180) * v.dir;
      v.a.setAttribute('x2', f1(-w + w * ca)); v.a.setAttribute('y2', f1(w * sa));
      v.b.setAttribute('x2', f1(w - w * ca)); v.b.setAttribute('y2', f1(w * sa));
      v.flash.style.opacity = flash.toFixed(2);
    }

    /* paint the lens at time t (s since the sound started; null: the still picture) and loudness lvl (0-1) */
    var lensT = 0;
    function paintLens(t, lvl){
      if(!LZ) return;
      var P_ = LZ.parts, d = LZ.kind, still = t == null, i, x, y;
      if(d === 'bronchiole' || d === 'larynx'){
        var speed = LZ.normal ? 34 : 70, n = P_.air.length;
        for(i = 0; i < n; i++){
          var ph = still ? i / n : ((t * speed / 230) + i / n) % 1;
          if(d === 'bronchiole'){
            x = -112 + ph * 224; var hw = P_.half(x); y = ((i * 7 % 11) / 10 - .5) * 2 * hw * .8;
            // air moves out of the lung (expiration: toward the viewer's left, the way to the mouth)
            x = -x;
          } else {
            y = -110 + ph * 220; var hw2 = y < -30 && y > -80 ? P_.gap - 3 : 30; x = ((i * 7 % 11) / 10 - .5) * 2 * hw2 * .8;
          }
          P_.air[i].setAttribute('cx', f1(x)); P_.air[i].setAttribute('cy', f1(y));
          P_.air[i].style.opacity = still ? '.55' : '.9';
        }
        if(P_.waves) P_.waves.forEach(function(w, j){
          var a = still ? 0 : (lvl == null ? .7 : clamp(lvl * 2.4, 0, 1));
          var r0 = 16 + j * 13 + (still ? 0 : (t * 40) % 13), cx = 0, cy = d === 'larynx' ? -58 : 0, s1 = d === 'larynx' ? 1 : 0;
          w.setAttribute('d', s1 ? 'M' + f1(cx - 46 - r0 * .3) + ' ' + f1(cy - r0 * .6) + ' q-' + f1(r0 * .4) + ' ' + f1(r0 * .6) + ' 0 ' + f1(r0 * 1.2) + ' M' + f1(cx + 46 + r0 * .3) + ' ' + f1(cy - r0 * .6) + ' q' + f1(r0 * .4) + ' ' + f1(r0 * .6) + ' 0 ' + f1(r0 * 1.2)
            : 'M' + f1(-r0 * .6) + ' ' + f1(-44 - r0 * .3) + ' q' + f1(r0 * .6) + ' -' + f1(r0 * .4) + ' ' + f1(r0 * 1.2) + ' 0 M' + f1(-r0 * .6) + ' ' + f1(44 + r0 * .3) + ' q' + f1(r0 * .6) + ' ' + f1(r0 * .4) + ' ' + f1(r0 * 1.2) + ' 0');
          w.style.opacity = (a * (1 - j * .25)).toFixed(2);
        });
      } else if(d === 'alveoli'){
        P_.sacs.forEach(function(s, j){
          var open = 1, pop = 0;
          if(!still){
            if(s.wet){
              // a wet sac sticks shut, then snaps open (the crackle) and slowly closes again
              var per = 1.6 + j * .13, u = ((t + j * .37) % per) / per;
              open = u < .55 ? .55 : u < .6 ? .55 + .45 * (u - .55) / .05 : 1 - .45 * (u - .6) / .4;
              pop = u >= .55 && u < .75 ? 1 - (u - .55) / .2 : 0;
              if(lvl != null) pop *= clamp(lvl * 3, .3, 1);
            } else open = .92 + .08 * Math.sin(t * 2.2 + j);
          } else open = s.wet ? .55 : 1;
          s.c.setAttribute('r', f1(s.r * open));
          if(s.pop){ s.pop.style.opacity = pop.toFixed(2); }
          s.g.style.setProperty('--open', open.toFixed(2));
        });
      } else {
        heartAt(still ? null : t);
      }
    }
    function heartAt(t){
      var P_ = LZ.parts, ev = Bank.heartEvents(P_.kind, 72), cyc = ev.cycle, sys = ev.systole, k = P_.kind;
      var tt = t == null ? (k === 's4' ? cyc - .1 : k === 's3' ? sys + .17 : k === 'diastolic-murmur' ? sys + .2 : k === 'split-s2' ? sys + .03 : .15) : ((t % cyc) + cyc) % cyc;
      var inSys = tt < sys, flashAt = function(at, len){ if(t == null) return 0; var u = tt - at; if(u < 0) u += cyc; return u < len ? 1 - u / len : 0; };
      var av = inSys ? 0 : clamp((tt - sys - .03) / .06, 0, 1);
      var aorOpen = inSys ? clamp(tt / .05, 0, 1) * clamp((sys - tt) / .02, 0, 1) : 0;
      var s2pul = k === 'split-s2' ? .045 : 0;
      var pulOpen = inSys ? clamp(tt / .05, 0, 1) * (s2pul ? 1 : clamp((sys - tt) / .02, 0, 1)) : (tt < sys + s2pul ? clamp((sys + s2pul - tt) / .02, 0, 1) : 0);
      setValve(P_.tri, av, flashAt(0, .12)); setValve(P_.mit, av, flashAt(0, .12));
      setValve(P_.aor, aorOpen, flashAt(sys, .12));
      setValve(P_.pul, pulOpen, flashAt(sys + s2pul, .12));
      // the ventricles squeeze in systole; the atria at the very end of filling
      var sq = inSys ? Math.sin(Math.PI * tt / sys) : 0, atr = tt > cyc - .16 ? Math.sin(Math.PI * (tt - (cyc - .16)) / .16) : 0;
      P_.lv.setAttribute('transform', 'translate(50 44) scale(' + ((k === 's4' ? .72 : .86) * (1 - .12 * sq)).toFixed(3) + ') translate(-50 -44)');
      P_.rv.setAttribute('transform', 'translate(-40 44) scale(' + (1 - .1 * sq).toFixed(3) + ') translate(40 -44)');
      P_.la.setAttribute('transform', 'translate(46 -28) scale(' + (1 - (k === 's4' ? .18 : .1) * atr).toFixed(3) + ') translate(-46 28)');
      P_.ra.setAttribute('transform', 'translate(-46 -28) scale(' + (1 - .1 * atr).toFixed(3) + ') translate(46 28)');
      var wallF = k === 's3' ? flashAt(sys + .15, .14) : k === 's4' ? flashAt(cyc - .13, .14) : 0;
      if(t == null && (k === 's3' || k === 's4')) wallF = .55;
      P_.flashLV.style.opacity = wallF.toFixed(2);
      // blood: out through the aorta in systole (a jet through a narrow valve), in from the left atrium in diastole,
      // and back through a leaky aortic valve in diastole
      P_.blood.forEach(function(c, i){
        var u = ((t == null ? i / 12 : t * 1.6 + i / 12) % 1), x, y, show = 1;
        if(inSys){ x = 1 + Math.sin(i * 1.7 + u * 9) * (k === 'systolic-murmur' && u > .3 ? 14 * u : 3); y = 40 - u * 140; }
        else if(k === 'diastolic-murmur' && i % 2){ x = 1 + Math.sin(i + u * 10) * 10 * u; y = -60 + u * 110; }
        else { x = 46 + Math.sin(i * 2.1) * 10; y = -30 + u * (k === 's3' ? 100 : 80); }
        if(t == null) show = (k === 'systolic-murmur' && inSys) || (k === 'diastolic-murmur' && !inSys && i % 2) ? 1 : 0;
        c.setAttribute('cx', f1(x)); c.setAttribute('cy', f1(y)); c.style.opacity = String(show);
        c.setAttribute('class', 'snd2-blood' + ((k === 'systolic-murmur' && inSys && u > .3) || (k === 'diastolic-murmur' && !inSys && i % 2) ? ' is-turb' : ''));
      });
    }

    /* ---------------------------------------------------------------- the monitor strip: the sound, drawn */
    var SZ = null;
    function drawStripFrame(){
      var R = G.strip;
      gStrip.innerHTML = '';
      var px = R.x + 64, pw = R.w - 74;
      sv('rect', { x: f1(R.x), y: f1(R.y), width: f1(R.w), height: f1(R.h), rx: 12, class: 'snd2-mon' }, gStrip);
      var grid = sv('g', { class: 'snd2-grid' }, gStrip);
      for(var gx = px; gx <= px + pw + .5; gx += pw / 8) sv('line', { x1: f1(gx), x2: f1(gx), y1: f1(R.y + 22), y2: f1(R.y + R.h - 20) }, grid);
      var cp = sv('clipPath', { id: 'snd2-sc' }, sv('defs', {}, gStrip)), clip = sv('rect', { x: f1(px), y: f1(R.y), width: 0, height: f1(R.h) }, cp);
      var title = sv('text', { x: f1(px), y: f1(R.y + 16), class: 'snd2-mon-t' }, gStrip);
      var band = sv('rect', { class: 'snd2-band', y: f1(R.y + 22), height: f1(R.h - 42), x: 0, width: 0 }, gStrip);
      var mid = R.y + 22 + (R.h - 42) / 2;
      sv('line', { x1: f1(px), x2: f1(px + pw), y1: f1(mid), y2: f1(mid), class: 'snd2-base' }, gStrip);
      var trace = sv('g', { 'clip-path': 'url(#snd2-sc)' }, gStrip);
      var fill = sv('path', { class: 'snd2-tr-f', d: '' }, trace), line = sv('path', { class: 'snd2-tr', d: '' }, trace);
      var ticks = sv('g', { class: 'snd2-ticks' }, gStrip);
      var phase = sv('g', { class: 'snd2-phase' }, gStrip);
      var head = sv('line', { class: 'snd2-head', x1: 0, x2: 0, y1: f1(R.y + 22), y2: f1(R.y + R.h - 20) }, gStrip);
      SZ = { px: px, pw: pw, mid: mid, amp: (R.h - 42) / 2 - 3, clip: clip, title: title, band: band, fill: fill, line: line, ticks: ticks, phase: phase, head: head, R: R, shown: {} };
      setupStrip();
    }
    function txH(t, cyc){ var u = ((t + PRE) % cyc + cyc) % cyc; return SZ.px + u / cyc * SZ.pw; }
    function setupStrip(){
      if(!SZ) return;
      var snd = cur(), site = S().site ? SITE[S().site] : null, R = SZ.R;
      SZ.kind = null; SZ.ticks.innerHTML = ''; SZ.phase.innerHTML = ''; SZ.fill.setAttribute('d', ''); SZ.line.setAttribute('d', '');
      SZ.band.setAttribute('width', 0); SZ.head.style.opacity = 0; SZ.shown = {}; SZ.events = [];
      SZ.clip.setAttribute('x', f1(SZ.px)); SZ.clip.setAttribute('width', 0);
      if(!site){ SZ.title.textContent = 'Nothing heard'; return; }
      if(snd && snd.synth){
        SZ.kind = 'heart';
        var ev = Bank.heartEvents(snd.synth, 72), cyc = ev.cycle, sr = 4000, mix = P.heartMix(snd.synth, site);
        var data = Bank.heartData(snd.synth, 72, 3, mix, sr), from = Math.floor((cyc - PRE) * sr), N = Math.max(60, Math.round(SZ.pw / 3));
        var env = Bank.envelope(data, from, from + Math.floor(cyc * sr), N), top = [], bot = [];
        for(var i = 0; i < N; i++){ var x = SZ.px + (i + .5) / N * SZ.pw, h = Math.max(.6, env[i] / .82 * SZ.amp); top.push([x, SZ.mid - h]); bot.push([x, SZ.mid + h]); }
        var dT = 'M' + top.map(function(p){ return f1(p[0]) + ' ' + f1(p[1]); }).join('L'), dB = 'M' + bot.map(function(p){ return f1(p[0]) + ' ' + f1(p[1]); }).join('L');
        SZ.line.setAttribute('d', dT + dB);
        SZ.fill.setAttribute('d', dT + 'L' + bot.slice().reverse().map(function(p){ return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + 'Z');
        SZ.title.textContent = 'This heartbeat';
        SZ.cyc = cyc; SZ.sys = ev.systole; SZ.env = env; SZ.N = N;
        var x1 = txH(0, cyc), x2 = txH(ev.systole, cyc);
        SZ.band.setAttribute('x', f1(x1)); SZ.band.setAttribute('width', f1(x2 - x1));
        SZ.band.setAttribute('class', 'snd2-band is-sys');
        // the events, each named once the trace has reached it
        ev.points.forEach(function(p){ SZ.events.push({ key: p.key, x: txH(p.at, cyc), extra: !/^(S1|S2|A2|P2)$/.test(p.key) }); });
        ev.spans.forEach(function(sp){ var a = txH(sp.from, cyc), b2 = txH(sp.to, cyc); SZ.events.push({ key: 'murmur', x: a, x2: b2, extra: true, span: true }); });
        layoutEventLabels();
      } else {
        SZ.kind = 'lung';
        SZ.title.textContent = snd ? 'This recording' : 'Typical breath';
        SZ.live = []; SZ.lungNormal = !snd;
        if(!snd) drawBreath();
      }
    }
    // event pills: S1 and S2 above the trace, the extra one in the finding's colour; P2 to the right of A2
    function layoutEventLabels(){
      var R = SZ.R, placed = [];
      SZ.events.forEach(function(e){
        var w = (e.key.length * 7.4 + 12), x = e.span ? (e.x + e.x2) / 2 : e.x;
        if(e.key === 'P2') x += w / 2 + 2; if(e.key === 'A2') x -= w / 2 + 2;
        x = clamp(x, SZ.px + w / 2, SZ.px + SZ.pw - w / 2);
        var y = R.y + R.h - 17;
        var gE = sv('g', { class: 'snd2-ev' + (e.extra ? ' is-x' : ''), style: 'opacity:0' }, SZ.ticks);
        if(!e.span) sv('line', { x1: f1(e.x), x2: f1(e.x), y1: f1(R.y + 22), y2: f1(y - 2), class: 'snd2-ev-t' }, gE);
        else sv('rect', { x: f1(Math.min(e.x, e.x2)), width: f1(Math.abs(e.x2 - e.x)), y: f1(y - 6), height: 3, rx: 1.5, class: 'snd2-ev-s' }, gE);
        sv('rect', { x: f1(x - w / 2), y: f1(y), width: f1(w), height: 15, rx: 7.5, class: 'snd2-ev-b' }, gE);
        var tx_ = sv('text', { x: f1(x), y: f1(y + 11.5), class: 'snd2-ev-l' }, gE); tx_.textContent = e.key;
        e.g = gE; e.lx = x; e.lw = w; placed.push(e);
      });
    }
    function drawBreath(){
      // one typical breath: in for a third, out for two thirds (I:E about 1:2); not traced from any recording
      var R = SZ.R, d = '', n = 80, INSP = P.INSP / P.BREATH;
      for(var i = 0; i <= n; i++){ var u = i / n, v = u < INSP ? (1 - Math.cos(Math.PI * u / INSP)) / 2 : (1 + Math.cos(Math.PI * (u - INSP) / (1 - INSP))) / 2;
        d += (i ? 'L' : 'M') + f1(SZ.px + u * SZ.pw) + ' ' + f1(SZ.mid + SZ.amp * .8 - v * SZ.amp * 1.6); }
      SZ.line.setAttribute('d', d); SZ.fill.setAttribute('d', '');
      var xi = SZ.px + INSP * SZ.pw;
      [['in', SZ.px + INSP * SZ.pw / 2], ['out', (xi + SZ.px + SZ.pw) / 2]].forEach(function(a){
        var t = sv('text', { x: f1(a[1]), y: f1(R.y + R.h - 6), class: 'snd2-ph' }, SZ.phase); t.textContent = a[0];
      });
      sv('line', { x1: f1(xi), x2: f1(xi), y1: f1(R.y + 22), y2: f1(R.y + R.h - 20), class: 'snd2-ev-t' }, SZ.phase);
      SZ.clip.setAttribute('width', f1(SZ.pw));
    }
    /* the strip at time t: the heart trace revealed up to the playhead (it sweeps once a beat); the lung recording's
       own loudness, scrolling, when the browser can measure it */
    function paintStrip(t, lvl, done){
      if(!SZ || !SZ.kind) return;
      if(SZ.kind === 'heart'){
        var x0 = txH(0, SZ.cyc), from, to;
        if(done || reduced()){ from = SZ.px; to = SZ.px + SZ.pw; SZ.head.style.opacity = 0; }
        else if(t == null){ from = SZ.px; to = SZ.px; SZ.head.style.opacity = 0; }
        else {
          var sweep = Math.floor((t + PRE) / SZ.cyc), x = txH(t, SZ.cyc);
          from = sweep === 0 ? x0 : SZ.px; to = x;
          SZ.head.setAttribute('x1', f1(x)); SZ.head.setAttribute('x2', f1(x)); SZ.head.style.opacity = 1;
        }
        SZ.clip.setAttribute('x', f1(from)); SZ.clip.setAttribute('width', f1(Math.max(0, to - from)));
        SZ.drawnTo = to; SZ.drawnFrom = from;
        SZ.events.forEach(function(e){
          var reached = e.x >= from - .5 && e.x <= to + .5;
          if(reached) SZ.shown[e.key] = 1;
          var on = done || reduced() ? 1 : SZ.shown[e.key] ? 1 : 0;
          if(e.g.style.opacity !== String(on)) e.g.style.opacity = String(on);
        });
      } else if(!SZ.lungNormal){
        var R = SZ.R;
        if(lvl == null){
          // no measured loudness (a clip from another site that the browser may not measure): nothing is drawn
          if(t != null && !SZ.noLive){ SZ.noLive = true; SZ.title.textContent = 'This recording (no trace)'; }
          return;
        }
        SZ.live.push(lvl); var max = Math.round(SZ.pw / 2);
        if(SZ.live.length > max) SZ.live.shift();
        var d = '', f = '', n = SZ.live.length;
        for(var i = 0; i < n; i++){ var xx = SZ.px + SZ.pw - (n - 1 - i) * 2, h = Math.min(1, SZ.live[i] * 1.6) * SZ.amp; d += 'M' + f1(xx) + ' ' + f1(SZ.mid - h) + 'V' + f1(SZ.mid + h); }
        SZ.line.setAttribute('d', d); SZ.clip.setAttribute('x', f1(SZ.px)); SZ.clip.setAttribute('width', f1(SZ.pw));
        SZ.drawnTo = SZ.px + SZ.pw; SZ.drawnFrom = SZ.px + SZ.pw - (n - 1) * 2;
      }
    }

    /* ---------------------------------------------------------------- the stethoscope */
    var sp = [0, 0];
    function placeSteth(p, now){
      sp = [p[0], p[1]];
      var r = G.pr;
      steth.style.width = steth.style.height = (r * 2) + 'px';
      steth.style.transform = 'translate(' + f1(p[0] - r) + 'px,' + f1(p[1] - r) + 'px)';
      // the tubing runs from the chest piece up out of the picture (to the EMT's ears)
      var ax = clamp(p[0] + G.W * .16, 40, G.W - 30), ay = G.kh - 6;
      gTube.innerHTML = '<path class="snd2-tube-s" d="M' + f1(p[0]) + ' ' + f1(p[1] - r * .8) + ' C' + f1(p[0] + 4) + ' ' + f1(p[1] - r - 70) + ' ' + f1(ax) + ' ' + f1(ay + 110) + ' ' + f1(ax) + ' ' + f1(ay) + '"/>' +
        '<path class="snd2-tube" d="M' + f1(p[0]) + ' ' + f1(p[1] - r * .8) + ' C' + f1(p[0] + 4) + ' ' + f1(p[1] - r - 70) + ' ' + f1(ax) + ' ' + f1(ay + 110) + ' ' + f1(ax) + ' ' + f1(ay) + '"/>';
      // the leader from the chest piece to the lens, once it is on a spot
      var on = !!S().site && !St.moving, L = G.lens, dx = p[0] - L.x, dy = p[1] - L.y, dd = Math.sqrt(dx * dx + dy * dy) || 1;
      gLead.innerHTML = on ? '<line class="snd2-leader" x1="' + f1(p[0]) + '" y1="' + f1(p[1]) + '" x2="' + f1(L.x + dx / dd * L.r) + '" y2="' + f1(L.y + dy / dd * L.r) + '"/>' : '';
      placeSiteLab();
    }
    function placeSiteLab(){
      var id = S().site;
      if(!id || St.moving){ siteLab.hidden = true; return; }
      siteLab.hidden = false; siteLab.textContent = SHORT[id];
      var r = G.pr, p = sp, w = siteLab.offsetWidth, h = siteLab.offsetHeight;
      // beside the chest piece, on the side away from the lens, inside the figure's area
      var left = p[0] + r + 8, top = p[1] - h / 2;
      if(left + w > G.fa.x + G.fa.w - 4 || (G.wide && left + w > G.fa.x + G.fa.w)) left = p[0] - r - 8 - w;
      if(left < G.fa.x + 2) left = clamp(p[0] - w / 2, G.fa.x + 2, G.fa.x + G.fa.w - w - 2), top = p[1] + r + 6;
      siteLab.style.left = f1(left) + 'px'; siteLab.style.top = f1(top) + 'px';
    }
    var anim = null;
    function slideTo(id, then){
      var to = id ? sitePos(id) : G.rest, from = sp.slice();
      if(reduced() || (Math.abs(to[0] - from[0]) < 1 && Math.abs(to[1] - from[1]) < 1)){
        St.moving = false; placeSteth(to); if(reduced()){ steth.classList.remove('is-fade'); void steth.offsetWidth; steth.classList.add('is-fade'); } then && then(); return;
      }
      St.moving = true; siteLab.hidden = true;
      var t0 = performance.now(), dur = 260;
      anim = { tick: function(now){
        var u = clamp((now - t0) / dur, 0, 1), e = ease(u);
        placeSteth([from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e]);
        if(u >= 1){ anim = null; St.moving = false; placeSteth(to); then && then(); }
      } };
      loop();
    }

    /* ---------------------------------------------------------------- playing */
    var play = { on: false, info: null, sid: null, t0: 0, ended: false };
    function stopSound(keepTrace){
      var was = play.on;
      play.on = false; play.info = null; play.token = (play.token || 0) + 1;
      if(was) Bank.stop();
      timers.forEach(clearTimeout); timers = [];
      if(!keepTrace){ paintStrip(null, null, false); }
      paintLens(null, null);
      paintPlay();
    }
    var timers = [];
    function later(ms, fn){ var tk = play.token; timers.push(setTimeout(function(){ if(tk === play.token) fn(); }, ms)); }
    function listen(){
      var site = S().site, snd = cur(), I = INFO[S().key];
      stopSound(false);
      setupStrip(); buildLens(); paintLens(null, null);
      if(!site){ chain(); return; }
      var tk = play.token;
      if(!snd){
        // the normal side of the lung switch: no free recording of normal breath sounds yet
        chain(); later(700, function(){ cause.take('Normal breath sounds are soft and even over every lung field: there is no extra sound. (No free recording yet, so nothing plays.)'); });
        paintPlay(); return;
      }
      play.on = true; play.sid = snd.id; play.started = false; play.ended = false;
      var s = SITE[site], h = {
        onStart: function(info){ if(tk !== play.token) return; play.info = info; play.t0 = performance.now(); play.started = true; loop(); },
        onEnd: function(){ if(tk !== play.token) return; finish(); },
        onStop: function(){ if(tk !== play.token) return; play.on = false; paintPlay(); },
        onError: function(msg){ if(tk !== play.token) return; play.on = false; paintPlay(); chain(); cause.take(msg); }
      };
      if(snd.synth){ h.mix = P.heartMix(snd.synth, s); h.beats = 6; }
      else { var g = P.LUNG_GAIN[snd.id]; h.gain = g ? g(s) : 1; h.analyse = true; }
      chain(); paintPlay();
      Bank.play(snd, h);
      if(o.onAct) o.onAct();
    }
    function finish(){
      play.on = false; play.ended = true; paintPlay();
      paintStrip(null, null, true); paintLens(null, null);
      chain(true);
      later(reduced() ? 300 : 900, function(){ var I = INFO[S().normal && T().kind === 'heart' ? 'heart-normal' : S().key]; cause.take(I.take); say(I.take); });
    }
    /* the cause line: where the stethoscope is -> what is heard there -> what makes it. The second pill waits for
       the trace (or the sound) to start; the third for the lens to move. */
    function loudWord(snd, id){
      var best = P.BEST[snd.id], s = SITE[id];
      if(best && best.at.indexOf(id) >= 0) return 'loudest here';
      if(!P.assessedHere(snd, s)) return 'faint here';
      return P.strength(snd, s) >= .5 ? 'heard here' : 'faint here';
    }
    function chain(all){
      var id = S().site, snd = cur(), I = INFO[S().key];
      if(!id){ cause.set([{ t: 'Off the chest', role: 'place' }, { t: 'nothing heard', role: 'snd' }]); return; }
      var parts = [{ t: SHORT[id], role: 'place' }], heard = all || (play.started && (!SZ || SZ.kind !== 'heart' || (SZ.drawnTo - SZ.drawnFrom) > 2)) || (!snd && !play.on);
      if(!snd){ parts.push({ t: 'Normal: no extra sound', role: 'snd' }); parts.push({ t: I.ncause, role: 'why' }); cause.set(parts); return; }
      if(heard) parts.push({ t: (snd.id === 'heart-normal' ? 'Normal S1 S2' : I.key) + ', ' + loudWord(snd, id), role: 'snd', say: snd.label + ', ' + loudWord(snd, id) });
      if(heard && (all || play.lensOn)) parts.push({ t: snd.id === 'heart-normal' ? INFO['heart-normal'].cause : I.cause, role: 'why' });
      cause.set(parts);
      St.chain = parts.map(function(p){ return p.t; });
    }

    /* ---------------------------------------------------------------- the frame loop (only while something moves) */
    var raf = 0;
    function loop(){ if(!raf && St.on) raf = requestAnimationFrame(frame); }
    function frame(once){
      raf = 0;
      if(!St.on || !G) return;
      var now = performance.now();
      if(anim) anim.tick(now);
      if(play.on && play.started && play.info){
        var info = play.info, t = info.synth ? info.now() - info.startAt : info.now(), lvl = info.level ? info.level() : null;
        if(info.synth && t < 0) t = 0;
        paintStrip(t, lvl, false);
        if(!reduced()) paintLens(t, lvl);
        if(!play.lensOn && (now - play.t0 > (reduced() ? 0 : 500))){ play.lensOn = true; }
        chain();
      }
      if(once !== true && (anim || (play.on && play.started))) loop();
    }

    /* ---------------------------------------------------------------- actions */
    function setSite(id, user){
      var s = S();
      if(cue && cue.active()) cue.hide(true);
      if(id && !siteEls[id]) return;
      s.site = id || null; play.lensOn = false;
      paintSites(); paintPlay();
      stopSound(false); setupStrip(); chain();
      slideTo(s.site, function(){ if(s.site && user) listen(); else { chain(); } });
      if(id) say('Stethoscope on the ' + SITE[id].name + '.');
    }
    function setKey(id, user){
      var s = S(); if(s.key === id && !s.normal) return;
      s.key = id; s.normal = false; play.lensOn = false;
      paintKeys(); paintSites(); buildLens();
      if(s.site && user) listen(); else { stopSound(false); setupStrip(); paintLens(null, null); chain(); }
      if(o.onAct && user) o.onAct();
    }
    function setNormal(on, user){
      var s = S(); if(s.normal === on) return;
      s.normal = on; play.lensOn = false;
      paintKeys(); paintSites(); buildLens();
      if(s.site && user) listen(); else { stopSound(false); setupStrip(); paintLens(null, null); chain(); }
    }
    function setView(v){
      var s = S(); if(s.view === v) return;
      stopSound(false); s.view = v;
      if(s.site && SITE[s.site].view !== v) s.site = null;
      draw(); chain();
    }
    function setTab(id){
      stopSound(false); St.tab = id; tabs.value(id); head.purpose(T().purpose); play.lensOn = false;
      draw(); setupStrip(); chain();
    }
    keys.addEventListener('click', function(e){ var b = e.target.closest('.snd2-key'); if(b) setKey(b.getAttribute('data-key'), true); });
    keys.addEventListener('keydown', function(e){
      var ks = [].slice.call(keys.querySelectorAll('.snd2-key')), i = ks.indexOf(document.activeElement); if(i < 0) return;
      var j = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? ks.length - 1 : null;
      if(j == null) return; e.preventDefault(); j = (j + ks.length) % ks.length; setKey(ks[j].getAttribute('data-key'), true); ks[j].focus();
    });
    ab.addEventListener('click', function(e){ var b = e.target.closest('[data-ab]'); if(b) setNormal(b.getAttribute('data-ab') === 'n', true); });
    ab.addEventListener('keydown', function(e){
      if(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
      e.preventDefault(); setNormal(!S().normal, true); ab.querySelector('[data-ab="' + (S().normal ? 'n' : 'a') + '"]').focus();
    });
    viewSw.addEventListener('click', function(e){ var b = e.target.closest('[data-view]'); if(b) setView(b.getAttribute('data-view')); });
    bPlay.addEventListener('click', function(){ if(play.on) stopSound(true), finishQuiet(); else if(S().site) listen(); });
    function finishQuiet(){ paintStrip(null, null, true); chain(true); }
    hits.addEventListener('click', function(e){ var b = e.target.closest('.snd2-hit'); if(b) setSite(b.getAttribute('data-site'), true); });

    // drag the chest piece; let go near a spot and it lands there (and plays); anywhere else it goes back
    var drag = null;
    function nearest(x, y, within){
      var best = null, bd = within * within;
      Object.keys(siteEls).forEach(function(id){ var p = siteEls[id].p, d = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y); if(d < bd){ bd = d; best = id; } });
      return best;
    }
    function local(e){ var r = box.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    steth.addEventListener('pointerdown', function(e){
      if(e.button > 0) return;
      e.preventDefault();
      if(cue && cue.active()) cue.hide(true);
      stopSound(false); anim = null; St.moving = true; siteLab.hidden = true; gLead.innerHTML = '';
      var p = local(e);
      drag = { id: e.pointerId, dx: sp[0] - p[0], dy: sp[1] - p[1], moved: false, x0: p[0], y0: p[1] };
      try{ steth.setPointerCapture(e.pointerId); }catch(err){}
      steth.classList.add('is-drag');
    });
    steth.addEventListener('pointermove', function(e){
      if(!drag || e.pointerId !== drag.id) return;
      var p = local(e), x = clamp(p[0] + drag.dx, G.fa.x, G.fa.x + G.fa.w), y = clamp(p[1] + drag.dy, G.fa.y, G.fa.y + G.fa.h);
      if(Math.abs(p[0] - drag.x0) + Math.abs(p[1] - drag.y0) > 4) drag.moved = true;
      placeSteth([x, y]);
      var n = nearest(x, y, 46);
      Object.keys(siteEls).forEach(function(id){ siteEls[id].g.classList.toggle('is-near', id === n); });
    });
    function endDrag(e){
      if(!drag || (e && e.pointerId !== drag.id)) return;
      var moved = drag.moved; drag = null; steth.classList.remove('is-drag');
      Object.keys(siteEls).forEach(function(id){ siteEls[id].g.classList.remove('is-near'); });
      St.moving = false;
      if(!moved){ // a tap on the chest piece: play or stop where it is
        if(S().site){ if(play.on) stopSound(true), finishQuiet(); else listen(); }
        placeSteth(sp); return;
      }
      var n = nearest(sp[0], sp[1], 64);
      S().site = null; setSite(n, true);
    }
    steth.addEventListener('pointerup', endDrag);
    steth.addEventListener('pointercancel', function(e){ if(drag){ drag.moved = true; } endDrag(e); });
    steth.addEventListener('keydown', function(e){
      var ids = visibleSites(), i = ids.indexOf(S().site);
      if(e.key === 'ArrowRight' || e.key === 'ArrowDown'){ e.preventDefault(); setSite(ids[(i + 1) % ids.length], true); }
      else if(e.key === 'ArrowLeft' || e.key === 'ArrowUp'){ e.preventDefault(); setSite(ids[(i - 1 + ids.length) % ids.length], true); }
      else if(e.key === 'Home'){ e.preventDefault(); setSite(ids[0], true); }
      else if(e.key === 'End'){ e.preventDefault(); setSite(ids[ids.length - 1], true); }
    });
    steth.addEventListener('click', function(e){ if(e.detail === 0){ if(!S().site) setSite(visibleSites()[0], true); else if(play.on){ stopSound(true); finishQuiet(); } else listen(); } });
    // a tap on the chest away from a spot's button: the nearest spot, if one is close (forgiving)
    svg.addEventListener('click', function(e){
      var p = local(e), n = nearest(p[0], p[1], 64);
      if(n && e.target.closest('.snd2-fig, .snd2-sites')) setSite(n, true);
    });

    var rt = null;
    if(window.ResizeObserver) new ResizeObserver(function(){ clearTimeout(rt); rt = setTimeout(function(){ var w = box.clientWidth, h = box.clientHeight; if(!G || Math.abs(w - G.W) > 1 || Math.abs(h - G.H) > 1){ var was = play.on; draw(); if(was) loop(); } }, 60); }).observe(box);
    else window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(draw, 80); });

    // the sound and every frame loop stop when "?" opens over the stage, and when the page is hidden
    if(studio && studio.root && window.MutationObserver) new MutationObserver(function(){ if(studio.root.classList.contains('is-sheet') && play.on){ stopSound(true); finishQuiet(); } })
      .observe(studio.root, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', function(){ if(document.hidden && play.on){ stopSound(true); finishQuiet(); } });

    /* ---------------------------------------------------------------- the cue and "Show me how" */
    var cue = K.cue(layer, { key: 'nremt-sound-trainer', text: 'Drag the stethoscope onto the chest', side: 'right', at: function(){ return G ? [sp[0] + G.pr * .5, sp[1]] : [0, 0]; } });
    var tour = K.tour({ key: 'nremt-sound-trainer', label: 'Show me how', steps: [
      { id: 'steth', text: 'Drag the stethoscope onto a spot on the chest (or tap a spot): you hear the sound there.', target: function(){ return steth; } },
      { id: 'key', text: 'Pick a sound. The rings show where it is loudest.', target: function(){ return keys; } },
      { id: 'ab', text: 'Switch between normal and this sound at the same spot. The lens shows what makes it.', target: function(){ return ab; } }
    ] });
    function startTour(){ if(cue) cue.hide(true); tour.start(true); }
    box.addEventListener('pointerdown', function(e){ if(cue && cue.active() && !e.target.closest('.snd2-steth')) cue.hide(true); });

    /* ---------------------------------------------------------------- "?" */
    var ref = el('div', 'snd2-ref');
    ref.innerHTML =
      '<h3>What you are looking at</h3>' +
      '<p>A patient’s chest with the ribs, sternum and heart drawn under the skin. Drag the stethoscope onto a spot (or tap a spot) to hear the chosen sound there, as loud as it is at that spot: the bigger a spot’s glow, the louder it is there. The round lens shows what makes the sound, and the strip draws the sound as it plays. The switch under the lens compares it with normal at the same spot.</p>' +
      '<ul class="snd2-ref-l">' +
      '<li><b>Where to listen.</b> Lungs: below each clavicle (the apices), the sides low down (the bases, midaxillary line) and the back, comparing right with left at the same level. Stridor: over the trachea. Heart: aortic area (2nd intercostal space, right sternal border), pulmonic (2nd, left sternal border), Erb’s point (3rd, left), tricuspid (4th to 5th, lower left sternal border), mitral or apex (5th, left midclavicular line).</li>' +
      '<li><b>Lung sounds</b> are real recordings by James Heilman, MD (stridor processed by Natural Philo), from Wikimedia Commons, CC BY-SA 3.0. They stream from Wikimedia, so they need a connection. When the browser can measure the clip, the strip draws its loudness live; otherwise it says so and draws nothing. There is no free recording of normal breath sounds yet, so the Normal side of the lung switch plays nothing.</li>' +
      '<li><b>Heart sounds</b> are generated in your browser, not recorded: what separates them is where each falls in the beat, which a generated sound gets exactly; the timbre of a real chest it does not. Murmurs, S3 and S4 are beyond the EMT exam. The murmurs drawn are one example each: the systolic one shaped like aortic stenosis, the diastolic one aortic regurgitation; other valves make murmurs heard best elsewhere.</li>' +
      '<li><b>Loudness by spot</b> is a teaching approximation: which spot is loudest, not the exact ratio.</li>' +
      '</ul>' +
      '<p><b>Not in Explore:</b> snoring, gurgling and diminished breath sounds have no clip (described below); naming a sound, where to listen and when in the beat are in <button type="button" class="tk2-link snd2-ref-test">Test yourself</button>.</p>' +
      '<p class="snd2-ref-p"><button type="button" class="tk2-how snd2-ref-how">Show me how</button></p>' +
      '<div class="snd2-ref-more"></div>' +
      '<p class="snd2-ref-s">Chest figure rendered from BodyParts3D, © 2008 Life Science Integrated Database Center, CC BY-SA 2.1 Japan. This trainer is a study aid, not a substitute for hands on practice with an instructor. For exam study only. Follow your local protocols and medical direction.</p>';
    ref.querySelector('.snd2-ref-how').addEventListener('click', function(){ if(studio){ if(studio.kit2 && studio.kit2.mode() !== 'explore') studio.kit2.go('explore'); if(studio.close) studio.close(); } setTimeout(startTour, 60); });
    ref.querySelector('.snd2-ref-test').addEventListener('click', function(){ if(studio && studio.kit2){ if(studio.close) studio.close(); studio.kit2.go('quiz'); } });

    paintKeys(); chain();
    var api = {
      stage: stage, ref: ref, more: ref.querySelector('.snd2-ref-more'),
      // Explore leaves the screen: the sound, every timer and the frame loop stop; the trace is left whole
      hidden: function(){ if(drag){ drag = null; steth.classList.remove('is-drag'); St.moving = false; } anim = null; if(play.on){ stopSound(true); if(SZ) finishQuiet(); } else stopSound(true); St.on = false; if(raf){ cancelAnimationFrame(raf); raf = 0; } },
      shown: function(){
        St.on = true; draw();
        if(!St.cued){ St.cued = true; setTimeout(function(){ if(St.on && !S().site && cue.show()) cue.place(); }, 300); }
      },
      // a deep link to one sound: its tab and key, the stethoscope on its best spot, nothing playing
      show: function(id){
        var t = TABS.filter(function(x){ return x.keys.indexOf(id) >= 0 || (id === 'heart-normal' && x.id === 'heart'); })[0]; if(!t) return false;
        St.tab = t.id; tabs.value(t.id); head.purpose(t.purpose);
        var s = S(); if(id === 'heart-normal'){ s.normal = true; } else { s.key = id; s.normal = false; }
        var best = P.defaultSite(byId[id]); if(best && t.sites.indexOf(best.id) >= 0){ s.view = best.view; s.site = best.id; }
        St.cued = true; if(G) draw(); paintKeys(); chain();
        return true;
      },
      stop: function(){ stopSound(true); },
      TABS: TABS,
      _state: function(){ return { tab: St.tab, per: St.per, playing: play.on, started: play.started, lensOn: !!play.lensOn, chain: cause.text(), sp: sp.slice(), G: G,
        strip: SZ && { kind: SZ.kind, from: SZ.drawnFrom, to: SZ.drawnTo, shown: Object.keys(SZ.shown), title: SZ.title.textContent, live: SZ.live ? SZ.live.length : 0 },
        raf: !!raf, timers: timers.length, anim: !!anim, on: St.on }; }
    };
    return api;
  }

  window.NremtSoundExplore = { build: build, INFO: INFO, TABS: TABS };
})();
