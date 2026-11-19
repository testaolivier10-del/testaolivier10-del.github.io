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
      cause: 'small airways and air sacs stuck by fluid snap open', ncause: 'dry air sacs fill quietly',
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
      take: 'A diastolic murmur sits after S2, while the heart fills: here blood leaking back through an aortic valve that does not close fully.' },
    'heart-normal': { key: 'Normal', lens: 'Valves closing', cause: 'S1 and S2 are the valves closing',
      take: 'Normal: S1 is the mitral and tricuspid valves closing, S2 the aortic and pulmonic; the short gap is systole.' }
  };
  var TABS = [
    { id: 'lung', name: 'Lung sounds', purpose: 'Hear where each breath sound is loudest, and why.', keys: ['wheeze', 'crackles', 'stridor'],
      sites: ['trachea', 'lung-ru', 'lung-lu', 'lung-rl', 'lung-ll', 'back-lu', 'back-ru', 'back-ll', 'back-rl'], views: ['front', 'back'], kind: 'lung' },
    { id: 'heart', name: 'Heart sounds', purpose: 'Hear where each heart sound is loudest, and why.',
      keys: ['heart-s3', 'heart-s4', 'heart-split-s2', 'heart-systolic-murmur', 'heart-diastolic-murmur'],
      sites: ['aortic', 'pulmonic', 'erb', 'tricuspid', 'mitral'], views: ['front'], kind: 'heart' }
  ];
  // the short name on the picture of each listening spot (1 to 3 words); the full one is the button's name
  var SHORT = { trachea: 'Trachea', aortic: 'Aortic area', pulmonic: 'Pulmonic area', erb: 'Erb’s point', tricuspid: 'Tricuspid area',
    mitral: 'Mitral area', 'lung-ru': 'Right apex', 'lung-lu': 'Left apex', 'lung-rl': 'Right base', 'lung-ll': 'Left base',
    'back-lu': 'Left upper back', 'back-ru': 'Right upper back', 'back-ll': 'Left lower back', 'back-rl': 'Right lower back' };
  /* Normal breath sounds, for the Normal side of the lung switch (never silence: silence over a lung field is the
     finding "diminished or absent breath sounds"). Over the lung fields a real recording (Fraiwan et al., CC BY 4.0);
     over the trachea a generated tracheal breath (louder and harsher, heard both ways), tagged "Generated". */
  var NORMAL_LUNG = { id: 'lung-normal', label: 'Normal breath sounds', group: 'lung', localSrc: 'assets/audio/normal-vesicular.wav' };
  var NORMAL_TRACHEA = { id: 'trachea-normal', label: 'Normal tracheal breath sounds', group: 'airway', synth: 'breath-tracheal' };
  var NORMAL_TAKE = 'Normal breath sounds over the lungs are soft and low (vesicular): heard all through breathing in, fading early in breathing out. Over the trachea they are louder and harsher.';
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
    function cur(){ var s = S(); return s.normal ? (T().kind === 'heart' ? byId['heart-normal'] : s.site === 'trachea' ? NORMAL_TRACHEA : NORMAL_LUNG) : byId[s.key]; }
    function isNormalBreath(snd){ return snd === NORMAL_LUNG || snd === NORMAL_TRACHEA; }

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
        sx = lx + lr + 16; sw = W - sx - 10; sy = y0 + 60; sh = bandH - 66;
        // Play sits left of the switch, so the strip keeps its whole width for the sound
        g.abY = y0 + 4; g.abX = sx + 52 + (sw - 52) / 2; g.abW = sw - 52; g.playOut = [sx, y0 + 7];
      }
      var k = Math.min(fa.w / 600, fa.h / 666), ox = fa.x + (fa.w - 600 * k) / 2, oy = fa.y + Math.max(0, (fa.h - 666 * k) / 2);
      g.pr = clamp(26 * k * 1.25, 19, 28); // the chest piece's radius
      g.zoom = 1;
      // the heart's five spots sit close (Erb's point is 49 image px below the pulmonic area): on a small chest the
      // picture zooms in on the heart so the chest piece on one spot never covers the next
      if(T().kind === 'heart'){
        var z = clamp((g.pr + 30) / (48.6 * k), 1, 2.2);
        if(z > 1.02){ g.zoom = z; k *= z; ox = fa.x + fa.w / 2 - 335 * k; oy = fa.y + fa.h * .5 - 340 * k; }
      }
      g.fa = fa; g.k = k; g.ox = ox; g.oy = oy;
      g.lens = { x: lx, y: ly, r: lr }; g.strip = { x: sx, y: sy, w: sw, h: sh };
      g.rest = toStage([110, 44], g); // beside the neck, off the chest, under nothing
      if(g.zoom > 1) g.rest = [fa.x + g.pr + 10, fa.y + g.pr + 10]; // zoomed in: the top left corner of the view
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
      drawBg(); drawFig(); drawSites(); drawLensFrame(); paintLens(null, null); drawStripFrame(); placeHtml();
      paintKeys(); placeSteth(S().site ? sitePos(S().site) : g.rest, true);
      frame(true);
      if(!play.on && play.ended){ paintStrip(null, null, true); }
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
      var host = gFig;
      if(g.zoom > 1){ // zoomed on the heart: the chest is cut to its own area
        var cpz = sv('clipPath', { id: 'snd2-fz' }, sv('defs', {}, gFig));
        sv('rect', { x: f1(g.fa.x), y: f1(g.fa.y), width: f1(g.fa.w), height: f1(g.fa.h), rx: 12 }, cpz);
        host = sv('g', { 'clip-path': 'url(#snd2-fz)' }, gFig);
      }
      sv('image', { href: FIG.url(f), x: f1(g.ox), y: f1(g.oy), width: f1(600 * g.k), height: f1(666 * g.k), class: 'snd2-img', preserveAspectRatio: 'none' }, host);
      // R and L: which side of the patient is which (front view: his right on your left)
      var front = S().view === 'front', y = g.oy + 330 * g.k;
      if(g.zoom > 1) y = g.fa.y + g.fa.h * .3;
      [[Math.max(g.ox + 26 * g.k, g.fa.x + 14), front ? 'R' : 'L'], [Math.min(g.ox + 574 * g.k, g.fa.x + g.fa.w - 14), front ? 'L' : 'R']].forEach(function(a){
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
      if(isNormalBreath(snd) || (S().normal && T().kind === 'lung')) return id === 'trachea' ? 0.85 : 0.55; // heard everywhere; loudest and harshest over the trachea
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
        }).join('') + (t.kind === 'heart' ? '<span class="snd2-made">Generated, not recorded. Beyond the EMT exam</span>' : '<span class="snd2-made">Real recordings</span>');
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
      if(g.playOut){ bPlay.style.left = f1(g.playOut[0]) + 'px'; bPlay.style.top = f1(g.playOut[1]) + 'px'; }
      else { bPlay.style.left = f1(Sx.x + 10) + 'px'; bPlay.style.top = f1(Sx.y + Sx.h / 2 - pb / 2) + 'px'; }
      placeLensLab();
      // Front / Back at the foot of the chest's area, out of the way of the cue, the keys and the lens
      viewSw.style.top = f1(g.fa.y + g.fa.h - 50) + 'px'; viewSw.style.left = f1(g.fa.x + g.fa.w - 6) + 'px';
    }

    // what the lens draws: the key's picture; for a normal breath, what is under the stethoscope (the trachea, or the
    // lung's airways and air sacs)
    var NORMAL_NAME = { bronchiole: 'Open airway', alveoli: 'Dry air sacs', larynx: 'Open upper airway' };
    function lensKind(){
      var I = INFO[S().key], d = I.draw || 'heart';
      if(S().normal && T().kind === 'lung') d = S().site === 'trachea' ? 'larynx' : d === 'larynx' ? 'bronchiole' : d;
      return d;
    }
    function normalCause(){ var d = lensKind(); return d === 'larynx' ? 'air rushes through the wide trachea' : d === 'alveoli' ? INFO.crackles.ncause : INFO.wheeze.ncause; }
    // off the chest nothing is heard, so the lens is dim and unnamed (the cause line says "nothing heard")
    function lensIdle(){ var off = !S().site; lensLab.hidden = off; gLens.classList.toggle('is-idle', off); if(!off) placeLensLab(); }
    function placeLensLab(){
      if(!G) return;
      var L = G.lens, w = lensLab.offsetWidth, x = L.x - w / 2, bottom = L.y - L.r - 8;
      var right = G.playOut ? G.playOut[0] - 6 : G.W - 8; // in the narrow layout Play and the switch sit to its right
      if(8 + w > right){ x = clamp(x, 8, G.W - 8 - w); bottom = Math.min(bottom, G.playOut[1] - 6); } // too long: it rises above them
      else x = clamp(x, 8, right - w);
      lensLab.style.left = f1(x) + 'px'; lensLab.style.top = f1(bottom) + 'px';
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
      buildLens(true);
    }
    // design units: the lens is a circle of radius 100 around 0, 0
    function buildLens(force){
      if(!LZ) return;
      var snd = byId[S().key], I = INFO[S().key], normal = S().normal, b = LZ.body, d = lensKind();
      if(!force && LZ.sid === S().key && LZ.normal === S().normal && LZ.kind === d && LZ.body.firstChild) return; // already drawn
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
        var dfa = sv('defs', {}, b), sg = sv('radialGradient', { id: 'snd2-sac-g', cx: '.36', cy: '.3', r: '.75' }, dfa);
        sv('stop', { offset: '0', 'stop-color': '#FFF6F3' }, sg); sv('stop', { offset: '.7', 'stop-color': '#F6D2CA' }, sg); sv('stop', { offset: '1', 'stop-color': '#E3A79C' }, sg);
        // a bronchiole ending in a grape like cluster of air sacs, each on its own short duct
        sv('path', { d: 'M-110 -14 C-70 -14 -50 -8 -28 -4 L-28 6 C-50 4 -70 8 -110 8 Z', class: 'snd2-bron' }, b);
        var SAC = [[-6, -2, 24], [30, -40, 25], [44, 8, 26], [22, 50, 24], [-24, 44, 22], [-26, -44, 23], [70, -26, 20], [62, 48, 20], [8, -78, 18], [80, 14, 0]];
        P_.sacs = [];
        SAC.forEach(function(s){ if(s[2]) sv('line', { x1: s[0], y1: s[1], x2: -24, y2: 1, class: 'snd2-duct' }, b); });
        SAC.forEach(function(s, j){
          if(!s[2]) return;
          var wet = !normal && j % 2 === 0 && j > 0, gO = sv('g', { class: 'snd2-sac' + (wet ? ' is-wet' : ''), transform: 'translate(' + s[0] + ' ' + s[1] + ')' }, b);
          var gS = sv('g', {}, gO); // scaled as the sac opens and closes: the fluid stays inside it
          var c = sv('circle', { r: s[2], class: 'snd2-sac-w', fill: 'url(#snd2-sac-g)' }, gS);
          var fl = wet ? sv('path', { d: 'M' + (-s[2]) + ' ' + (s[2] * .25) + ' Q0 ' + (s[2] * .05) + ' ' + s[2] + ' ' + (s[2] * .25) + ' A' + s[2] + ' ' + s[2] + ' 0 0 1 ' + (-s[2]) + ' ' + (s[2] * .25) + 'Z', class: 'snd2-fluid' }, gS) : null;
          var pop = wet ? sv('path', { class: 'snd2-pop', d: 'M-9 -9l-6 -6M9 -9l6 -6M0 -12v-8M-12 0h-8M12 0h8' }, gO) : null;
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
      lensLab.textContent = normal ? (T().kind === 'heart' ? INFO['heart-normal'].lens : NORMAL_NAME[d]) : I.lens;
      lensIdle();
      lensLab.className = 'snd2-lab snd2-lenslab' + (normal ? ' is-normal' : '');
      placeLensLab();
    }
    // the heart, cut open from the front (patient's right on the viewer's left): right atrium and ventricle on the
    // left, left atrium and ventricle on the right; the aorta rises from the left ventricle and arches over, the
    // pulmonary trunk rises from the right ventricle in front of it and to the patient's left. Shaded like the
    // rendered chest: soft light from the upper left.
    function buildHeart(b, kind){
      var P_ = LZ.parts, dil = kind === 's3', stiff = kind === 's4';
      var df = sv('defs', {}, b);
      function rg(id, c0, c1){ var g = sv('radialGradient', { id: id, cx: '.38', cy: '.32', r: '.8' }, df); sv('stop', { offset: '0', 'stop-color': c0 }, g); sv('stop', { offset: '1', 'stop-color': c1 }, g); }
      rg('snd2-hg-b', '#B9CCEB', '#6F8DC4'); rg('snd2-hg-r', '#F2A79C', '#C0544A'); rg('snd2-hg-m', '#D8796C', '#8E3B31'); rg('snd2-hg-p', '#FBF1EA', '#E6D2C6');
      sv('rect', { x: -110, y: -110, width: 220, height: 220, fill: 'url(#snd2-hg-p)' }, b);
      var gH = sv('g', { class: 'snd2-heart' }, b);
      // the aorta first (it lies behind the pulmonary trunk): up from the left ventricle, arching to the right
      sv('path', { class: 'snd2-ves is-red', fill: 'url(#snd2-hg-r)', d: 'M-4 -4 L-6 -62 C-8 -92 14 -108 40 -104 C58 -101 70 -92 72 -76 L60 -72 C56 -86 46 -92 34 -92 C16 -92 8 -80 8 -62 L10 -4Z' }, gH);
      sv('path', { class: 'snd2-myo-out', fill: 'url(#snd2-hg-m)', d: 'M-92 -18 C-98 34 -44 96 34 104 C96 84 114 24 100 -18 C94 -46 74 -60 44 -58 C14 -62 -18 -62 -50 -58 C-80 -56 -90 -42 -92 -18Z' }, gH);
      P_.ra = sv('path', { class: 'snd2-ch is-blue', fill: 'url(#snd2-hg-b)', d: 'M-70 -52 C-86 -50 -88 -8 -64 -4 L-12 -4 L-12 -44 C-26 -56 -54 -56 -70 -52Z' }, gH);
      P_.la = sv('path', { class: 'snd2-ch is-red', fill: 'url(#snd2-hg-r)', d: 'M14 -46 C30 -58 66 -56 78 -44 C88 -28 80 -8 66 -4 L14 -4Z' }, gH);
      var lv = dil ? 'M10 4 L92 4 C106 40 84 96 30 96 C14 80 10 40 10 4Z' : 'M14 4 L80 4 C92 36 72 84 34 88 C22 70 14 40 14 4Z';
      P_.rv = sv('path', { class: 'snd2-ch is-blue', fill: 'url(#snd2-hg-b)', d: 'M-74 4 L-12 4 L-12 60 C-14 76 -26 86 -34 88 C-62 70 -80 40 -74 4Z' }, gH);
      P_.lvWall = sv('path', { class: 'snd2-myo' + (stiff ? ' is-thick' : ''), fill: 'url(#snd2-hg-m)', d: lv }, gH);
      P_.lv = sv('path', { class: 'snd2-ch is-red', fill: 'url(#snd2-hg-r)', d: lv, transform: stiff ? 'translate(50 44) scale(.72) translate(-50 -44)' : 'translate(50 44) scale(.86) translate(-50 -44)' }, gH);
      // the pulmonary trunk, in front: up from the right ventricle and over to the patient's left
      sv('path', { class: 'snd2-ves is-blue', fill: 'url(#snd2-hg-b)', d: 'M-30 -4 L-30 -40 C-30 -66 -10 -82 18 -86 L30 -88 L32 -74 L20 -72 C2 -68 -16 -58 -16 -40 L-16 -4Z' }, gH);
      function valve(x, y, w, up){ var g2 = sv('g', { class: 'snd2-valve', transform: 'translate(' + x + ' ' + y + ')' }, gH);
        var fl = sv('circle', { r: w + 6, class: 'snd2-flash' }, g2);
        var a = sv('line', { x1: -w, y1: 0, x2: 0, y2: 0 }, g2), c = sv('line', { x1: w, y1: 0, x2: 0, y2: 0 }, g2);
        return { g: g2, a: a, b: c, w: w, flash: fl, dir: up ? -1 : 1 }; }
      P_.tri = valve(-40, 0, 16); P_.mit = valve(46, 0, 18);
      P_.pul = valve(-23, -26, 7, true); P_.aor = valve(2, -30, 7, true);
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
          s.g.setAttribute('transform', 'scale(' + open.toFixed(3) + ')');
          if(s.pop){ s.pop.style.opacity = pop.toFixed(2); }
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
        var u = ((t == null ? i / 12 : t * 1.6 + i / 12) % 1), x, y, show = 1, turb = false;
        function seg(p0, p1, v){ return [p0[0] + (p1[0] - p0[0]) * v, p0[1] + (p1[1] - p0[1]) * v]; }
        var pt;
        if(inSys){ // out of the left ventricle, through the aortic valve, up the aorta
          pt = u < .5 ? seg([46, 56], [3, -26], u / .5) : seg([3, -26], [-1, -96], (u - .5) / .5);
          if(k === 'systolic-murmur' && u > .5){ turb = true; pt[0] += Math.sin(i * 1.7 + u * 12) * 12 * (u - .4); }
        } else if(k === 'diastolic-murmur' && i % 2){ // back through the leaky valve into the left ventricle
          pt = u < .4 ? seg([0, -70], [3, -30], u / .4) : seg([3, -30], [40, 40], (u - .4) / .6);
          pt[0] += Math.sin(i + u * 10) * 6 * u; turb = true;
        } else { pt = seg([48, -30], [42, k === 's3' ? 70 : 56], u); pt[0] += Math.sin(i * 2.1) * 8; } // filling from the left atrium
        x = pt[0]; y = pt[1];
        if(t == null) show = (k === 'systolic-murmur' && inSys) || (k === 'diastolic-murmur' && !inSys && i % 2) ? 1 : 0;
        c.setAttribute('cx', f1(x)); c.setAttribute('cy', f1(y)); c.style.opacity = String(show);
        c.setAttribute('class', 'snd2-blood' + (turb ? ' is-turb' : ''));
      });
    }

    /* ---------------------------------------------------------------- the monitor strip: the sound, drawn */
    var SZ = null, ENV = {};
    function drawStripFrame(){
      var R = G.strip;
      gStrip.innerHTML = '';
      var px = R.x + (G.playOut ? 10 : 64), pw = R.w - (G.playOut ? 20 : 74);
      sv('rect', { x: f1(R.x), y: f1(R.y), width: f1(R.w), height: f1(R.h), rx: 12, class: 'snd2-mon' }, gStrip);
      var grid = sv('g', { class: 'snd2-grid' }, gStrip);
      for(var gx = px; gx <= px + pw + .5; gx += pw / 8) sv('line', { x1: f1(gx), x2: f1(gx), y1: f1(R.y + 22), y2: f1(R.y + R.h - 20) }, grid);
      var cp = sv('clipPath', { id: 'snd2-sc' }, sv('defs', {}, gStrip)), clip = sv('rect', { x: f1(px), y: f1(R.y), width: 0, height: f1(R.h) }, cp),
        clip2 = sv('rect', { x: f1(px), y: f1(R.y), width: 0, height: f1(R.h) }, cp);
      var title = sv('text', { x: f1(px), y: f1(R.y + 16), class: 'snd2-mon-t' }, gStrip);
      var band = sv('rect', { class: 'snd2-band', y: f1(R.y + 22), height: f1(R.h - 42), x: 0, width: 0 }, gStrip);
      var mid = R.y + 22 + (R.h - 42) / 2;
      sv('line', { x1: f1(px), x2: f1(px + pw), y1: f1(mid), y2: f1(mid), class: 'snd2-base' }, gStrip);
      var trace = sv('g', { 'clip-path': 'url(#snd2-sc)' }, gStrip);
      var fill = sv('path', { class: 'snd2-tr-f', d: '' }, trace), line = sv('path', { class: 'snd2-tr', d: '' }, trace);
      var ticks = sv('g', { class: 'snd2-ticks' }, gStrip);
      var phase = sv('g', { class: 'snd2-phase' }, gStrip);
      var head = sv('line', { class: 'snd2-head', x1: 0, x2: 0, y1: f1(R.y + 22), y2: f1(R.y + R.h - 20) }, gStrip);
      SZ = { px: px, pw: pw, mid: mid, amp: (R.h - 42) / 2 - 3, clip: clip, clip2: clip2, title: title, band: band, fill: fill, line: line, ticks: ticks, phase: phase, head: head, R: R, shown: {} };
      setupStrip();
    }
    function txH(t, cyc){ var u = ((t + PRE) % cyc + cyc) % cyc; return SZ.px + u / cyc * SZ.pw; }
    function setupStrip(){
      if(!SZ) return;
      var snd = cur(), site = S().site ? SITE[S().site] : null, R = SZ.R;
      SZ.kind = null; SZ.ticks.innerHTML = ''; SZ.phase.innerHTML = ''; SZ.fill.setAttribute('d', ''); SZ.line.setAttribute('d', '');
      SZ.band.setAttribute('width', 0); SZ.head.style.opacity = 0; SZ.shown = {}; SZ.events = [];
      SZ.clip.setAttribute('x', f1(SZ.px)); SZ.clip.setAttribute('width', 0); SZ.clip2.setAttribute('width', 0);
      if(!site){ SZ.title.textContent = 'Nothing heard'; return; }
      if(snd && snd.synth && !isNormalBreath(snd)){
        SZ.kind = 'heart';
        var ev = Bank.heartEvents(snd.synth, 72), cyc = ev.cycle, sr = 4000, mix = P.heartMix(snd.synth, site);
        var N = Math.max(60, Math.round(SZ.pw / 3)), ck = snd.synth + '|' + site.id + '|' + N, env = ENV[ck], top = [], bot = [];
        if(!env){ // the samples that are played, at this spot's mix (cached: the same sound at the same spot is the same)
          var data = Bank.heartData(snd.synth, 72, 3, mix, sr), from = Math.floor((cyc - PRE) * sr);
          env = ENV[ck] = Bank.envelope(data, from, from + Math.floor(cyc * sr), N);
        }
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
        SZ.title.textContent = snd && snd.synth ? 'Generated breath' : 'This recording';
        SZ.live = [];
      }
    }
    // event pills: S1 and S2 above the trace, the extra one in the finding's colour; P2 to the right of A2
    function layoutEventLabels(){
      var R = SZ.R, placed = [];
      // where each pill goes: under its tick, then pushed apart (5 px at least) and kept inside the strip
      var L = SZ.events.map(function(e){
        var w = e.key.length * 7.4 + 12, x = e.x;
        if(e.span) x = e.x2 > e.x ? (e.x + e.x2) / 2 : (SZ.px + SZ.pw - e.x > e.x2 - SZ.px ? (e.x + SZ.px + SZ.pw) / 2 : (SZ.px + e.x2) / 2);
        return { e: e, w: w, x: x }; }).sort(function(a, b){ return a.x - b.x; });
      for(var it = 0; it < 6; it++){
        for(var j = 1; j < L.length; j++){ var a = L[j - 1], b = L[j], need = (a.w + b.w) / 2 + 5 - (b.x - a.x); if(need > 0){ a.x -= need / 2; b.x += need / 2; } }
        L.forEach(function(l){ l.x = clamp(l.x, SZ.px + l.w / 2, SZ.px + SZ.pw - l.w / 2); });
      }
      L.forEach(function(l){ l.e.px_ = l.x; });
      SZ.events.forEach(function(e){
        var w = (e.key.length * 7.4 + 12), x = e.px_;
        var y = R.y + R.h - 17;
        var gE = sv('g', { class: 'snd2-ev' + (e.extra ? ' is-x' : ''), style: 'opacity:0' }, SZ.ticks);
        if(!e.span) sv('line', { x1: f1(e.x), x2: f1(e.x), y1: f1(R.y + 22), y2: f1(y - 2), class: 'snd2-ev-t' }, gE);
        else (e.x2 > e.x ? [[e.x, e.x2]] : [[e.x, SZ.px + SZ.pw], [SZ.px, e.x2]]).forEach(function(seg){
          sv('rect', { x: f1(seg[0]), width: f1(seg[1] - seg[0]), y: f1(y - 6), height: 3, rx: 1.5, class: 'snd2-ev-s' }, gE); });
        sv('rect', { x: f1(x - w / 2), y: f1(y), width: f1(w), height: 15, rx: 7.5, class: 'snd2-ev-b' }, gE);
        var tx_ = sv('text', { x: f1(x), y: f1(y + 11.5), class: 'snd2-ev-l' }, gE); tx_.textContent = e.key;
        e.g = gE; e.lx = x; e.lw = w; placed.push(e);
      });
    }
    function drawBreath(phase){
      // one typical breath: in for a third, out for two thirds (I:E about 1:2); not traced from any recording
      var R = SZ.R, d = '', n = 80, INSP = P.INSP / P.BREATH;
      for(var i = 0; i <= n; i++){ var u = i / n, v = u < INSP ? (1 - Math.cos(Math.PI * u / INSP)) / 2 : (1 + Math.cos(Math.PI * (u - INSP) / (1 - INSP))) / 2;
        d += (i ? 'L' : 'M') + f1(SZ.px + u * SZ.pw) + ' ' + f1(SZ.mid + SZ.amp * .8 - v * SZ.amp * 1.6); }
      SZ.line.setAttribute('d', d); SZ.fill.setAttribute('d', '');
      var xi = SZ.px + INSP * SZ.pw;
      if(phase){ SZ.band.setAttribute('x', f1(phase === 'insp' ? SZ.px : xi)); SZ.band.setAttribute('width', f1(phase === 'insp' ? xi - SZ.px : SZ.px + SZ.pw - xi)); SZ.band.setAttribute('class', 'snd2-band is-phase'); }
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
        // a monitor sweep: the first pass draws from S1; after that the new pass draws up to the playhead and the
        // last pass stays drawn beyond it (every beat here is the same beat, so the trace is whole once drawn)
        var x0 = txH(0, SZ.cyc), from, to, from2 = 0, to2 = 0, sweep = 0;
        if(done || reduced()){ from = SZ.px; to = SZ.px + SZ.pw; SZ.head.style.opacity = 0; }
        else if(t == null){ from = SZ.px; to = SZ.px; SZ.head.style.opacity = 0; }
        else {
          sweep = Math.floor((t + PRE) / SZ.cyc); var x = txH(t, SZ.cyc);
          from = sweep === 0 ? x0 : SZ.px; to = x;
          if(sweep > 0){ from2 = x; to2 = SZ.px + SZ.pw; }
          else if(x < x0){ to = SZ.px + SZ.pw; from = x0; } // the end of the first pass, before the playhead wraps
          SZ.head.setAttribute('x1', f1(x)); SZ.head.setAttribute('x2', f1(x)); SZ.head.style.opacity = 1;
        }
        SZ.clip.setAttribute('x', f1(from)); SZ.clip.setAttribute('width', f1(Math.max(0, to - from)));
        SZ.clip2.setAttribute('x', f1(from2)); SZ.clip2.setAttribute('width', f1(Math.max(0, to2 - from2)));
        SZ.drawnTo = to; SZ.drawnFrom = from; SZ.drawn2 = [from2, to2];
        SZ.events.forEach(function(e){
          var reached = (e.x >= from - .5 && e.x <= to + .5) || (e.x >= from2 - .5 && e.x <= to2 + .5 && to2 > from2);
          if(reached) SZ.shown[e.key] = 1;
          var on = done || reduced() ? 1 : SZ.shown[e.key] ? 1 : 0;
          if(e.g.style.opacity !== String(on)) e.g.style.opacity = String(on);
        });
      } else {
        var R = SZ.R;
        if(lvl == null){
          // the browser cannot measure this clip (no CORS from its server): a typical breath, named as one, with the
          // part of the breath this sound lives in shaded, as the old page drew it
          if(t != null && !SZ.noLive){ SZ.noLive = true; SZ.title.textContent = 'Typical breath'; drawBreath(P.PHASE[cur().id]); } /* a normal breath: no phase shaded */
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
      // the tubing hangs from the chest piece down and outward, off the bottom of the picture (to the EMT's ears)
      var cxm = G.ox + 300 * G.k, out = p[0] < cxm ? -1 : 1, bx, by, c2;
      if(G.wide){ bx = clamp(p[0] + out * Math.max(50, 90 * G.k), G.fa.x + 6, G.fa.x + G.fa.w - 6); by = G.H + 12; c2 = [bx, by - 90]; }
      else { bx = out < 0 ? -12 : G.W + 12; by = Math.min(p[1] + 40, G.fa.y + G.fa.h - 10); c2 = [bx - out * 60, by]; }
      // wide: down, off the bottom; narrow: straight out to the side, so it never lies over the next spot down
      var c1 = G.wide ? [p[0] + out * 6, p[1] + r + 50] : [p[0] + out * 70, p[1] + 6], st0 = G.wide ? [p[0], p[1] + r * .8] : [p[0] + out * r * .8, p[1]];
      var dT = 'M' + f1(st0[0]) + ' ' + f1(st0[1]) + ' C' + f1(c1[0]) + ' ' + f1(c1[1]) + ' ' + f1(c2[0]) + ' ' + f1(c2[1]) + ' ' + f1(bx) + ' ' + f1(by);
      // one element per drawn thing, updated in place (a drag moves them every frame)
      if(!gTube.firstChild){ sv('path', { class: 'snd2-tube-s' }, gTube); sv('path', { class: 'snd2-tube' }, gTube); }
      gTube.firstChild.setAttribute('d', dT); gTube.lastChild.setAttribute('d', dT);
      // the leader from the chest piece to the lens, once it is on a spot
      var on = !!S().site && !St.moving && !G.wide, L = G.lens, dx = p[0] - L.x, dy = p[1] - L.y, dd = Math.sqrt(dx * dx + dy * dy) || 1;
      if(!gLead.firstChild) sv('line', { class: 'snd2-leader' }, gLead);
      var ld = gLead.firstChild; ld.style.display = on ? '' : 'none';
      if(on){ ld.setAttribute('x1', f1(p[0])); ld.setAttribute('y1', f1(p[1])); ld.setAttribute('x2', f1(L.x + dx / dd * L.r)); ld.setAttribute('y2', f1(L.y + dy / dd * L.r)); }
      placeSiteLab();
    }
    function placeSiteLab(){
      var id = S().site;
      if(!id || St.moving){ siteLab.hidden = true; return; }
      siteLab.hidden = false; siteLab.textContent = SHORT[id];
      var r = G.pr, p = sp, w = siteLab.offsetWidth, h = siteLab.offsetHeight, B = box.getBoundingClientRect();
      // the first place beside the chest piece that stays in the chest's area and clear (6 px) of the switches
      var avoid = [viewSw, ab, lensLab].filter(function(e){ return !e.hidden && e.offsetWidth; }).concat([].slice.call(gFig.querySelectorAll('.snd2-rl'))).map(function(e){ var q = e.getBoundingClientRect(); return [q.left - B.left - 6, q.top - B.top - 6, q.right - B.left + 6, q.bottom - B.top + 6]; });
      var C = [[p[0] + r + 8, p[1] - h / 2], [p[0] - r - 8 - w, p[1] - h / 2], [p[0] + r * .4, p[1] - r - 6 - h], [p[0] + r * .4, p[1] + r + 6],
        [p[0] - r * .4 - w, p[1] - r - 6 - h], [p[0] - r * .4 - w, p[1] + r + 6], [p[0] - w / 2, p[1] + r + 6], [p[0] - w / 2, p[1] - r - 6 - h]];
      // first try to keep the other spots' rings visible too; then only the labels and switches
      var rings = Object.keys(siteEls).filter(function(k){ return k !== id; }).map(function(k){ var e = siteEls[k], rr = e.r * .62 + 3; return [e.p[0] - rr, e.p[1] - rr, e.p[0] + rr, e.p[1] + rr]; });
      var pick = null;
      [avoid.concat(rings), avoid].forEach(function(av){
        for(var i = 0; i < C.length && !pick; i++){
          var x = C[i][0], y = C[i][1];
          if(x < G.fa.x + 2 || x + w > G.fa.x + G.fa.w - 2 || y < G.kh + 2 || y + h > G.H - 4) continue;
          if(av.some(function(a){ return x < a[2] && x + w > a[0] && y < a[3] && y + h > a[1]; })) continue;
          pick = C[i];
        }
      });
      if(!pick) pick = [clamp(p[0] - w / 2, G.fa.x + 2, G.fa.x + G.fa.w - w - 2), p[1] + r + 6];
      siteLab.style.left = f1(pick[0]) + 'px'; siteLab.style.top = f1(pick[1]) + 'px';
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
      keepCause();
      var tk = play.token;
      play.on = true; play.sid = snd.id; play.started = false; play.ended = false;
      var s = SITE[site], h = {
        onStart: function(info){ if(tk !== play.token) return; if(play.info) setupStrip(); /* a retry without CORS */ play.info = info; play.t0 = performance.now(); play.started = true; loop(); },
        onEnd: function(){ if(tk !== play.token) return; finish(); },
        onStop: function(){ if(tk !== play.token) return; play.on = false; paintPlay(); },
        onError: function(msg){ if(tk !== play.token) return; play.on = false; paintPlay(); chain(); cause.take(msg); }
      };
      if(snd === NORMAL_TRACHEA){ h.mix = { level: 1 }; h.beats = 3; h.analyse = true; }
      else if(snd.synth){ h.mix = P.heartMix(snd.synth, s); h.beats = 6; warmSites(snd); }
      else { var g = P.LUNG_GAIN[snd.id]; h.gain = g ? g(s) : 1; h.analyse = true; }
      chain(); paintPlay();
      Bank.play(snd, h);
      if(o.onAct) o.onAct();
    }
    // the same sound at the other heart spots, rendered while the browser is idle, so the next drop plays at once
    function warmSites(snd){
      if(!Bank.warm) return;
      var idle = window.requestIdleCallback || function(f){ return setTimeout(f, 200); };
      T().sites.forEach(function(id, i){ idle(function(){ if(St.on) Bank.warm(snd, P.heartMix(snd.synth, SITE[id]), 6); }, { timeout: 3000 + i * 400 }); });
    }
    function finish(){
      play.on = false; play.ended = true; paintPlay();
      paintStrip(null, null, true); paintLens(null, null);
      chain(true);
      later(reduced() ? 300 : 900, function(){ var tk2 = S().normal ? (T().kind === 'heart' ? INFO['heart-normal'].take : NORMAL_TAKE) : INFO[S().key].take; cause.take(tk2); say(tk2); });
    }
    /* the cause line: where the stethoscope is -> what is heard there -> what makes it. The second pill waits for
       the trace (or the sound) to start; the third for the lens to move. */
    function loudWord(snd, id){
      if(snd === NORMAL_TRACHEA) return 'louder, harsher here';
      if(snd === NORMAL_LUNG) return 'heard here';
      var best = P.BEST[snd.id], s = SITE[id];
      if(best && best.at.indexOf(id) >= 0) return 'loudest here';
      if(!P.assessedHere(snd, s)) return 'faint here';
      return P.strength(snd, s) >= .5 ? 'heard here' : 'faint here';
    }
    function drawnW(){ return (SZ.drawnTo - SZ.drawnFrom || 0) + (SZ.drawn2 ? SZ.drawn2[1] - SZ.drawn2[0] : 0); }
    function chain(all){
      var id = S().site, snd = cur(), I = INFO[S().key];
      if(!id){ cause.set([{ t: 'Off the chest', role: 'place' }, { t: 'nothing heard', role: 'snd' }]); label(); return; }
      var parts = [{ t: SHORT[id], role: 'place' }], heard = all || (play.started && (!SZ || SZ.kind !== 'heart' || drawnW() > 2));
      var nb = isNormalBreath(snd);
      if(heard) parts.push({ t: (snd.id === 'heart-normal' ? 'Normal S1 S2' : nb ? 'Normal' : I.key) + ', ' + loudWord(snd, id), role: 'snd', say: snd.label + ', ' + loudWord(snd, id) });
      if(heard && (all || play.lensOn)) parts.push({ t: snd.id === 'heart-normal' ? INFO['heart-normal'].cause : nb ? normalCause() : I.cause, role: 'why' });
      cause.set(parts);
      St.chain = parts.map(function(p){ return p.t; });
      label();
    }
    // the picture's name for a screen reader: what is drawn and heard now
    function label(){ svg.setAttribute('aria-label', 'A patient\u2019s chest, ' + S().view + ' view, with a stethoscope. ' + cause.text()); }
    // a phone: after the student puts the stethoscope down, the cause line under the picture comes into view
    function keepCause(){
      if(!G || !G.phone) return;
      var r = cause.el.getBoundingClientRect(), over = r.bottom + 8 - window.innerHeight;
      if(over > 0) try{ window.scrollBy({ top: over, behavior: reduced() ? 'auto' : 'smooth' }); }catch(e){ window.scrollBy(0, over); }
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
      s.site = id || null; play.lensOn = false; lensIdle();
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
    function finishQuiet(){ play.ended = true; paintStrip(null, null, true); chain(true); }
    hits.addEventListener('click', function(e){
      var b = e.target.closest('.snd2-hit'); if(!b) return;
      // spots sit close together (the heart's five): act on the one nearest the finger, not the top button
      var id = b.getAttribute('data-site');
      if(e.detail > 0){ var p = local(e), n = nearest(p[0], p[1], 40); if(n) id = n; }
      setSite(id, true);
    });

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
      stopSound(false); anim = null; St.moving = true; siteLab.hidden = true; if(gLead.firstChild) gLead.firstChild.style.display = 'none';
      var p = local(e);
      drag = { id: e.pointerId, dx: sp[0] - p[0], dy: sp[1] - p[1], moved: false, x0: p[0], y0: p[1] };
      try{ steth.setPointerCapture(e.pointerId); }catch(err){}
      steth.classList.add('is-drag');
    });
    steth.addEventListener('pointermove', function(e){
      if(!drag || e.pointerId !== drag.id) return;
      var p = local(e), x = clamp(p[0] + drag.dx, G.fa.x, G.fa.x + G.fa.w), y = clamp(p[1] + drag.dy, G.fa.y, G.fa.y + G.fa.h);
      if(Math.abs(p[0] - drag.x0) + Math.abs(p[1] - drag.y0) > 4) drag.moved = true;
      drag.to = [x, y];
      if(drag.raf) return; // one paint a frame, however many moves arrive
      var d0 = drag;
      d0.raf = requestAnimationFrame(function(){
        d0.raf = 0; if(drag !== d0 || !d0.to) return;
        placeSteth(d0.to);
        var n = nearest(d0.to[0], d0.to[1], 46);
        if(n !== d0.near){ if(d0.near && siteEls[d0.near]) siteEls[d0.near].g.classList.remove('is-near'); if(n) siteEls[n].g.classList.add('is-near'); d0.near = n; }
      });
    });
    function endDrag(e){
      if(!drag || (e && e.pointerId !== drag.id)) return;
      if(drag.raf){ cancelAnimationFrame(drag.raf); if(drag.to) placeSteth(drag.to); }
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
    var cue = null; // made when Explore first shows, at its real width (a phone gets the short cue below the stethoscope)
    function makeCue(){
      cue = K.cue(layer, { key: 'nremt-sound-trainer', text: box.clientWidth < 640 ? 'Drag the stethoscope' : 'Drag the stethoscope onto the chest', side: 'right', at: function(){ return !G ? [0, 0] : [sp[0] + G.pr * .5, sp[1]]; } });
    }
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
      '<li><b>Lung sounds</b> are real recordings by James Heilman, MD (stridor processed by Natural Philo), from Wikimedia Commons, CC BY-SA 3.0. They stream from Wikimedia, so they need a connection. When the browser can measure the clip, the strip draws its loudness live; otherwise it draws a typical breath (not this clip) with the part of the breath the sound lives in shaded.</li>' +
      '<li><b>Normal breath sounds</b> over the lung fields are a real recording (normal, posterior left middle, an adult; heart sounds may be heard under it) from Fraiwan M, Fraiwan L, Khassawneh B, Ibnian A, \u201cA dataset of lung sounds recorded from the chest wall using an electronic stethoscope\u201d, Mendeley Data (jwyy9np4gv), <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Over the trachea, normal breath sounds are louder and harsher, heard both breathing in and out: that one is generated in your browser and marked so.</li>' +
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
    // the chest figure (it may already be loaded, and then this calls back at once: everything above is ready)
    if(window.LevlBodyFigs) window.LevlBodyFigs.load('chest', function(F){ if(F){ FIG = F; draw(); } });
    var api = {
      stage: stage, ref: ref, more: ref.querySelector('.snd2-ref-more'),
      // Explore leaves the screen: the sound, every timer and the frame loop stop; the trace is left whole
      hidden: function(){ if(drag){ drag = null; steth.classList.remove('is-drag'); St.moving = false; } anim = null; if(play.on){ stopSound(true); if(SZ) finishQuiet(); } else stopSound(true); St.on = false; if(raf){ cancelAnimationFrame(raf); raf = 0; } },
      shown: function(){
        St.on = true; draw();
        if(!St.cued){ St.cued = true; setTimeout(function(){ if(!cue) makeCue(); if(St.on && !S().site && cue.show()) cue.place(); }, 300); }
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
    window.NremtSoundExplore.last = api; // for the sweep and the tests
    return api;
  }

  window.NremtSoundExplore = { build: build, INFO: INFO, TABS: TABS };
})();
