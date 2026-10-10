/* The sound trainer's stage: the sounds on a chest you can tap.

   window.SoundStage.mount(root, { sounds, record, mode, q })

   One job: hear each sound where it is actually listened for, and see when
   in the heartbeat or the breath it falls.

   Why a 2D chest and not the 3D body (LevlBodyViewer): auscultation points
   are defined by surface landmarks (the 2nd intercostal space at the right
   sternal border, the 5th at the midclavicular line). The 3D model is bones
   and organs, 4 MB, lazy-loaded, and rotates; on a 390 px phone five heart
   sites sit within about 2 cm of each other on it and a rotated view moves
   them. A flat front and back view with the ribs drawn puts each site at a
   fixed, countable place, loads at once and is tappable on a phone.

   Modes: explore (pick a finding, tap a site, hear it there, see the strip,
   compare two side by side), where (tap where you would listen for X) and
   timing (hear a beat, tap where in the cycle the extra sound falls). The
   page's own "name it" quiz is the fourth mode; this module only shows and
   hides it.

   Loudness by site is a teaching approximation (docs/tools-upgrade-notes/
   nremt-body.md, For accuracy review): the point is which site is loudest,
   not the exact ratio. */
(function(){
  'use strict';
  var Bank = window.LevlSoundBank;
  var NS = 'http://www.w3.org/2000/svg';
  function reduced(){ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function say(t){ if(window.LevlAnnounce) window.LevlAnnounce.say(t); }

  /* ---- The sites ---------------------------------------------------------
     x, y in a 300 x 330 drawing of the torso. Front view: the patient's right
     is on the viewer's left. Back view: the patient's left is on the viewer's
     left. */
  var SITES = [
    { id:'trachea',  view:'front', x:150, y:22,  kind:'airway', name:'Over the trachea',
      where:'Front of the neck, above the sternal notch.',
      note:'Stridor is made in the upper airway, so it is loudest here; often you can hear it without a stethoscope.' },
    { id:'aortic',   view:'front', x:128, y:100, kind:'heart', name:'Aortic area',
      where:'2nd intercostal space, right sternal border.',
      note:'The base of the heart: S2 is louder than S1 here. The murmur of aortic stenosis is loudest here and carries up into the neck.' },
    { id:'pulmonic', view:'front', x:172, y:100, kind:'heart', name:'Pulmonic area',
      where:'2nd intercostal space, left sternal border.',
      note:'Also the base, so S2 is loud. The pulmonic part of S2 (P2) is soft and heard mainly here, which makes this the place to hear S2 split.' },
    { id:'erb',      view:'front', x:172, y:126, kind:'heart', name:'Erb’s point',
      where:'3rd intercostal space, left sternal border.',
      note:'Halfway between base and apex: S1 and S2 come through about equally. The diastolic murmur of aortic regurgitation is often loudest here.' },
    { id:'tricuspid',view:'front', x:166, y:158, kind:'heart', name:'Tricuspid area',
      where:'4th to 5th intercostal space, lower left sternal border.',
      note:'Over the right ventricle. S1 is louder than S2 here.' },
    { id:'mitral',   view:'front', x:212, y:170, kind:'heart', name:'Mitral area (apex)',
      where:'5th intercostal space, left midclavicular line.',
      note:'The apex: S1 is loudest here. S3 and S4 are best heard here with the bell, with the patient rolled onto the left side.' },
    { id:'lung-ru',  view:'front', x:86,  y:84,  kind:'lung', side:'right', level:'upper', name:'Right lung apex',
      where:'Just below the right clavicle, midclavicular line.',
      note:'Compare with the same spot on the left: a difference side to side is the finding.' },
    { id:'lung-lu',  view:'front', x:214, y:76,  kind:'lung', side:'left', level:'upper', name:'Left lung apex',
      where:'Just below the left clavicle, midclavicular line.',
      note:'Compare with the same spot on the right.' },
    { id:'lung-rl',  view:'front', x:52,  y:214, kind:'lung', side:'right', level:'lower', name:'Right lung base (side)',
      where:'Right midaxillary line, lower ribs.',
      note:'The bases are where fluid settles, so the crackles of early pulmonary edema show up here first.' },
    { id:'lung-ll',  view:'front', x:248, y:214, kind:'lung', side:'left', level:'lower', name:'Left lung base (side)',
      where:'Left midaxillary line, lower ribs.',
      note:'Compare with the right base at the same level.' },
    { id:'back-lu',  view:'back',  x:118, y:96,  kind:'lung', side:'left', level:'upper', name:'Left upper back',
      where:'Between the left shoulder blade and the spine.',
      note:'Most lung tissue lies behind: the back is where breath sounds are easiest to compare side to side.' },
    { id:'back-ru',  view:'back',  x:182, y:96,  kind:'lung', side:'right', level:'upper', name:'Right upper back',
      where:'Between the right shoulder blade and the spine.',
      note:'Compare with the left at the same level.' },
    { id:'back-ll',  view:'back',  x:104, y:226, kind:'lung', side:'left', level:'lower', name:'Left lower back (base)',
      where:'Below the tip of the left shoulder blade.',
      note:'The lung bases are largely posterior. Crackles from fluid are heard here first, in a patient sitting up.' },
    { id:'back-rl',  view:'back',  x:196, y:226, kind:'lung', side:'right', level:'lower', name:'Right lower back (base)',
      where:'Below the tip of the right shoulder blade.',
      note:'Compare with the left base at the same level.' }
  ];
  var SITE = {}; SITES.forEach(function(s){ SITE[s.id] = s; });
  var HEART_SITES = ['aortic','pulmonic','erb','tricuspid','mitral'];

  /* ---- How loud each part of a finding is at each site -------------------
     Heart findings: { s1, s2, extra, p2, level } per site, fed to the bank's
     mix (level scales the whole sound after it is normalized). Away from the
     heart everything is quieter. Recordings: one gain per site. */
  var S1_AT = { mitral:1, tricuspid:1, erb:.75, aortic:.45, pulmonic:.45 };
  var S2_AT = { aortic:1, pulmonic:1, erb:.8, tricuspid:.55, mitral:.5 };
  var EXTRA_AT = {
    's3': { mitral:1, tricuspid:.5, erb:.35, aortic:.2, pulmonic:.2 },
    's4': { mitral:1, tricuspid:.5, erb:.35, aortic:.2, pulmonic:.2 },
    'systolic-murmur': { aortic:1, erb:.7, pulmonic:.6, mitral:.55, tricuspid:.45 },
    'diastolic-murmur': { erb:1, aortic:.75, tricuspid:.7, mitral:.7, pulmonic:.6 }
  };
  var P2_AT = { pulmonic:1, erb:.6, tricuspid:.3, aortic:.25, mitral:.15 };
  function awayLevel(site){
    if(site.id === 'trachea') return .15;
    if(site.view === 'back') return .08;
    return site.level === 'upper' ? .25 : .12;
  }
  function heartMix(synth, site){
    if(HEART_SITES.indexOf(site.id) < 0){
      return { level: awayLevel(site) };
    }
    var m = { s1: S1_AT[site.id], s2: S2_AT[site.id], level: 1 };
    if(EXTRA_AT[synth]) m.extra = EXTRA_AT[synth][site.id];
    if(synth === 'split-s2') m.p2 = P2_AT[site.id];
    return m;
  }
  var LUNG_GAIN = {
    wheeze:   function(s){ return s.kind === 'lung' ? 1 : s.kind === 'heart' ? .8 : .6; },
    crackles: function(s){ return s.kind === 'lung' ? (s.level === 'lower' ? 1 : .45) : s.kind === 'heart' ? .45 : .2; },
    stridor:  function(s){ return s.id === 'trachea' ? 1 : s.kind === 'heart' ? .55 : s.level === 'upper' ? (s.view === 'back' ? .5 : .6) : .3; }
  };
  /* A single 0-1 "how well you hear the finding here", for the halo on each site. */
  function strength(sound, site){
    if(sound.synth){
      if(HEART_SITES.indexOf(site.id) < 0) return awayLevel(site);
      var m = heartMix(sound.synth, site);
      if(sound.synth === 'normal') return Math.max(m.s1, m.s2);
      if(sound.synth === 'split-s2') return m.p2;
      return m.extra;
    }
    var g = LUNG_GAIN[sound.id];
    return g ? g(site) : 0;
  }

  /* Where each finding is best heard, and why: what the site card says. */
  var BEST = {
    'heart-normal': { at:['mitral','aortic'], why:'S1 is loudest at the apex (mitral area), S2 at the base (aortic and pulmonic areas). Listening at both is how you tell which is which.' },
    'heart-s3': { at:['mitral'], why:'S3 is a low, soft, left-sided sound: best at the apex with the bell, patient turned to the left.' },
    'heart-s4': { at:['mitral'], why:'S4 is a low, soft, left-sided sound: best at the apex with the bell, patient turned to the left.' },
    'heart-split-s2': { at:['pulmonic'], why:'The split needs P2, and P2 is soft: it is heard mainly at the pulmonic area.' },
    'heart-systolic-murmur': { at:['aortic'], why:'This one is shaped like aortic stenosis (swelling then fading), which is loudest at the aortic area. A mitral regurgitation murmur would be loudest at the apex instead.' },
    'heart-diastolic-murmur': { at:['erb'], why:'Depends on the valve: aortic regurgitation is loudest along the left sternal border (Erb’s point); mitral stenosis at the apex.' },
    'wheeze': { at:['lung-ru','lung-lu','lung-rl','lung-ll','back-lu','back-ru','back-ll','back-rl'], why:'Wheezes come from narrowed small airways all through the lungs, so they are heard over every lung field, mostly on breathing out.' },
    'crackles': { at:['lung-rl','lung-ll','back-ll','back-rl'], why:'Fluid settles at the bases first, so the crackles of pulmonary edema start low; pneumonia crackles sit over the affected part of the lung.' },
    'stridor': { at:['trachea'], why:'Stridor is an upper airway sound: loudest over the neck, carried down into the chest.' }
  };

  /* ---- Breath timing (schematic) -----------------------------------------
     A normal adult breath: inspiration about a third of the cycle, expiration
     about two thirds (I:E roughly 1:2). Drawn, not traced: the recordings
     carry no inspiration/expiration markers, so the strip shows when in a
     breath each sound typically falls and says so. */
  var BREATH = 4, INSP = BREATH / 3;
  var PHASE = { wheeze:'exp', crackles:'insp', stridor:'insp' };
  var PHASE_TEXT = {
    wheeze:'Mostly on breathing out (expiration), when the narrowed airways close down further.',
    crackles:'Mostly on breathing in (inspiration), as fluid-filled or collapsed small airways pop open.',
    stridor:'Mostly on breathing in (inspiration), when the upper airway is pulled narrower.'
  };

  /* ---- Drawing helpers --------------------------------------------------- */
  function el(tag, attrs, parent){
    var n = document.createElementNS(NS, tag);
    for(var k in attrs) if(attrs[k] != null) n.setAttribute(k, attrs[k]);
    if(parent) parent.appendChild(n);
    return n;
  }
  var HALF = [[128,0],[128,34],[96,44],[62,52],[38,64],[26,90],[32,130],[38,180],[40,240],[46,290],[52,330]];
  function torsoPath(){
    var l = HALF.map(function(p){ return p[0] + ' ' + p[1]; });
    var r = HALF.slice().reverse().map(function(p){ return (300 - p[0]) + ' ' + p[1]; });
    return 'M' + l.join(' L') + ' L' + r.join(' L') + ' Z';
  }
  function drawBody(svg, view){
    while(svg.firstChild) svg.removeChild(svg.firstChild);
    var g = el('g', { 'aria-hidden':'true' }, svg);
    el('path', { d: torsoPath(), class:'st-skin' }, g);
    if(view === 'front'){
      // lungs and heart, faint
      el('path', { d:'M138 64 C110 60 70 80 60 140 C54 190 56 230 62 252 C90 246 120 238 136 232 Z', class:'st-organ' }, g);
      el('path', { d:'M162 64 C190 60 230 80 240 140 C246 190 244 230 238 252 C214 246 200 240 196 236 C206 200 204 170 190 150 C180 120 168 100 162 64 Z', class:'st-organ' }, g);
      el('path', { d:'M136 104 C150 96 176 100 190 116 C210 138 222 160 214 178 C200 190 170 184 150 172 C132 160 124 128 136 104 Z', class:'st-heart' }, g);
      // ribs and intercostal spaces
      for(var i = 0; i < 7; i++){
        var y = 66 + i * 22 + (i ? 4 : 0);
        el('path', { d:'M140 ' + y + ' Q100 ' + (y + 4) + ' ' + (58 - i) + ' ' + (y + 22), class:'st-rib' }, g);
        el('path', { d:'M160 ' + y + ' Q200 ' + (y + 4) + ' ' + (242 + i) + ' ' + (y + 22), class:'st-rib' }, g);
      }
      el('path', { d:'M146 56 Q110 46 66 54 M154 56 Q190 46 234 54', class:'st-bone' }, g); // clavicles
      el('rect', { x:141, y:56, width:18, height:136, rx:7, class:'st-bone st-sternum' }, g);
      // landmark lines
      el('line', { x1:86, y1:60, x2:86, y2:260, class:'st-guide' }, g);
      el('line', { x1:214, y1:60, x2:214, y2:260, class:'st-guide' }, g);
      ['2','3','4','5'].forEach(function(n, k){
        var t = el('text', { x:150, y:104 + k * 24, class:'st-ics' }, g); t.textContent = n;
      });
      lab(g, 18, 18, 'R'); lab(g, 282, 18, 'L');
      var cap = el('text', { x:86, y:274, class:'st-cap' }, g); cap.textContent = 'MCL';
      var cap2 = el('text', { x:214, y:274, class:'st-cap' }, g); cap2.textContent = 'MCL';
    } else {
      el('path', { d:'M138 60 C110 56 66 80 58 150 C52 210 56 250 64 272 L138 272 Z', class:'st-organ' }, g);
      el('path', { d:'M162 60 C190 56 234 80 242 150 C248 210 244 250 236 272 L162 272 Z', class:'st-organ' }, g);
      for(var v = 0; v < 13; v++) el('rect', { x:144, y:40 + v * 19, width:12, height:13, rx:3, class:'st-bone' }, g);
      el('path', { d:'M66 66 L132 70 L120 112 L94 178 Z', class:'st-scap' }, g);
      el('path', { d:'M234 66 L168 70 L180 112 L206 178 Z', class:'st-scap' }, g);
      lab(g, 18, 18, 'L'); lab(g, 282, 18, 'R');
    }
  }
  function lab(g, x, y, t){ var n = el('text', { x:x, y:y, class:'st-rl' }, g); n.textContent = t; }

  function drawSites(svg, view, opts){
    var out = {};
    SITES.filter(function(s){ return s.view === view; }).forEach(function(s){
      var g = el('g', { class:'st-site st-site--' + s.kind, 'data-site': s.id, role:'button', tabindex:'0',
        'aria-label': s.name + ', ' + s.where }, svg);
      el('circle', { cx:s.x, cy:s.y, r:22, class:'st-halo' }, g);
      el('circle', { cx:s.x, cy:s.y, r:19, class:'st-hit' }, g);
      el('circle', { cx:s.x, cy:s.y, r:10, class:'st-dot' }, g);
      el('circle', { cx:s.x, cy:s.y, r:3.5, class:'st-core' }, g);
      g.addEventListener('click', function(){ opts.onTap(s); });
      g.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); opts.onTap(s); }
      });
      out[s.id] = g;
    });
    return out;
  }

  /* ---- The strip ---------------------------------------------------------
     Heart: the real loudness envelope of the generated sound (the same
     samples that are played, at a lower rate), one beat, from just before S1
     to just before the next S1, with each event labelled from the bank's own
     timing table. Lung: a schematic breath with the phase the finding lives
     in shaded. */
  /* W is the strip's drawing width, set to its real pixel width when it is
     made so labels stay their true size on a phone (no stretching). */
  var W = 600, H = 132, PRE = 0.25;
  function heartWindow(cycle){ return { from: -PRE, to: cycle - PRE }; }
  function tx(t, cycle){ var w = heartWindow(cycle); var u = t - w.from; u = ((u % cycle) + cycle) % cycle; return u / cycle * W; }

  function makeStrip(host, opts){
    opts = opts || {};
    host.innerHTML = '';
    var myW = Math.round(Math.max(300, Math.min(720, (host.clientWidth || 600) - 12)));
    W = myW;
    var svg = el('svg', { viewBox:'0 0 ' + myW + ' ' + H, class:'st-strip-svg', role:'img' }, host);
    var title = el('title', {}, svg);
    var layer = el('g', {}, svg);
    var head = el('line', { x1:0, x2:0, y1:14, y2:H - 18, class:'st-playhead' }, svg);
    head.style.display = 'none';
    var marker = el('g', { class:'st-marker' }, svg); marker.style.display = 'none';
    el('line', { x1:0, x2:0, y1:14, y2:H - 18 }, marker);
    el('path', { d:'M-7 10 L7 10 L0 20 Z' }, marker);
    var state = { svg: svg, layer: layer, head: head, marker: marker, title: title, sound: null, W: myW };

    state.drawHeart = function(sound, mix, hide){
      W = myW;
      state.sound = sound; state.kind = 'heart';
      while(layer.firstChild) layer.removeChild(layer.firstChild);
      var ev = Bank.heartEvents(sound.synth, sound.bpm || 72);
      state.cycle = ev.cycle;
      var sr = 4000, data = Bank.heartData(sound.synth, sound.bpm || 72, 3, mix || {}, sr);
      var from = Math.floor((ev.cycle - PRE) * sr), to = from + Math.floor(ev.cycle * sr);
      var N = 150, env = Bank.envelope(data, from, to, N);
      var mid = (H - 18 + 14) / 2, amp = (H - 18 - 14) / 2 - 4;
      // systole band
      var x1 = tx(0, ev.cycle), x2 = tx(ev.systole, ev.cycle);
      el('rect', { x:x1, y:14, width:x2 - x1, height:H - 32, class:'st-band' }, layer);
      var t1 = el('text', { x:(x1 + x2) / 2, y:H - 4, class:'st-phase' }, layer); t1.textContent = 'systole';
      var t2 = el('text', { x:(x2 + W) / 2, y:H - 4, class:'st-phase' }, layer); t2.textContent = 'diastole';
      var t3 = el('text', { x:x1 / 2, y:H - 4, class:'st-phase' }, layer); t3.textContent = 'diastole';
      el('line', { x1:0, x2:W, y1:mid, y2:mid, class:'st-axis' }, layer);
      if(!hide){
        var d = '';
        for(var i = 0; i < N; i++){
          var x = (i + .5) / N * W, h = Math.max(.6, env[i] / 0.82 * amp);
          d += 'M' + x.toFixed(1) + ' ' + (mid - h).toFixed(1) + 'V' + (mid + h).toFixed(1);
        }
        el('path', { d:d, class:'st-trace' }, layer);
      }
      var names = [];
      ev.points.forEach(function(p){
        var show = !hide || p.key === 'S1' || p.key === 'S2' || p.key === 'A2';
        if(!show) return;
        var x = tx(p.at, ev.cycle);
        el('line', { x1:x, x2:x, y1:12, y2:H - 18, class:'st-tick' + (/S1|S2|A2|P2/.test(p.key) ? '' : ' st-tick--x') }, layer);
        var label = hide && p.key === 'A2' ? 'S2' : p.key;
        var t = el('text', { x:x + (p.key === 'P2' ? 9 : p.key === 'A2' && !hide ? -9 : 0), y:10, class:'st-evt' + (/S1|S2|A2|P2/.test(p.key) ? '' : ' st-evt--x') }, layer);
        t.textContent = label;
        names.push(label);
      });
      if(!hide) ev.spans.forEach(function(sp){
        var a = tx(sp.from, ev.cycle), b = tx(sp.to, ev.cycle);
        var segs = b > a ? [[a, b]] : [[a, W], [0, b]];
        segs.forEach(function(sg){ el('rect', { x:sg[0], y:H - 22, width:sg[1] - sg[0], height:4, rx:2, class:'st-span' }, layer); });
        var t = el('text', { x:(segs[0][0] + segs[0][1]) / 2, y:H - 25, class:'st-evt st-evt--x' }, layer); t.textContent = 'murmur';
        names.push('murmur');
      });
      title.textContent = hide
        ? 'One heartbeat, S1 and S2 marked. Where the extra sound falls is hidden.'
        : 'One heartbeat of ' + sound.label + ': ' + describeHeart(sound.synth);
    };

    state.drawLung = function(sound){
      W = myW;
      state.sound = sound; state.kind = 'lung';
      while(layer.firstChild) layer.removeChild(layer.firstChild);
      var xi = INSP / BREATH * W, ph = PHASE[sound.id];
      el('rect', { x: ph === 'insp' ? 0 : xi, y:14, width: ph === 'insp' ? xi : W - xi, height:H - 32, class:'st-band' }, layer);
      // lung volume through one breath: up during inspiration, down during expiration
      var d = '', base = H - 26, top = 26;
      for(var i = 0; i <= 120; i++){
        var x = i / 120 * W, t = i / 120 * BREATH, v;
        v = t < INSP ? (1 - Math.cos(Math.PI * t / INSP)) / 2 : (1 + Math.cos(Math.PI * (t - INSP) / (BREATH - INSP))) / 2;
        d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (base - v * (base - top)).toFixed(1);
      }
      el('path', { d:d, class:'st-breath' }, layer);
      el('line', { x1:xi, x2:xi, y1:12, y2:H - 18, class:'st-tick' }, layer);
      var a = el('text', { x:xi / 2, y:H - 4, class:'st-phase' }, layer); a.textContent = 'breathe in';
      var b = el('text', { x:(xi + W) / 2, y:H - 4, class:'st-phase' }, layer); b.textContent = 'breathe out';
      var c = el('text', { x: ph === 'insp' ? xi / 2 : (xi + W) / 2, y:10, class:'st-evt st-evt--x' }, layer);
      c.textContent = sound.label.replace(/ \(.*\)/, '') + ' here';
      title.textContent = 'Schematic breath: ' + PHASE_TEXT[sound.id];
    };

    state.play = function(info){
      state.info = info;
      if(reduced() || !info){ head.style.display = 'none'; return; }
      head.style.display = '';
      cancelAnimationFrame(state.raf);
      (function frame(){
        if(state.info !== info) return;
        W = myW;
        var x;
        if(state.kind === 'heart' && info.synth){
          var t = info.now() - info.startAt;
          if(t < 0) t = 0;
          x = tx(t % state.cycle, state.cycle);
        } else {
          var tt = info.now() || 0;
          x = (tt % BREATH) / BREATH * W;
        }
        head.setAttribute('x1', x); head.setAttribute('x2', x);
        state.raf = requestAnimationFrame(frame);
      })();
    };
    state.stop = function(){ state.info = null; cancelAnimationFrame(state.raf); head.style.display = 'none'; };
    state.mark = function(x){
      if(x == null){ marker.style.display = 'none'; return; }
      marker.style.display = '';
      marker.setAttribute('transform', 'translate(' + x + ',0)');
    };
    return state;
  }

  function describeHeart(synth){
    return {
      'normal':'S1, then S2 about a third of a second later; the longer gap after S2 is diastole.',
      's3':'S1, S2, then a low S3 early in diastole, soon after S2 (Ken-TUC-ky).',
      's4':'a low S4 late in diastole, just before S1 (TEN-nes-see), then S1 and S2.',
      'split-s2':'S1, then S2 heard as two parts, A2 then P2, about 45 milliseconds apart.',
      'systolic-murmur':'a murmur filling the gap between S1 and S2, rising then falling.',
      'diastolic-murmur':'a murmur after S2, through the filling phase until the next S1.'
    }[synth] || '';
  }

  /* ---- Weighted draw: a miss comes back more often (as the name-it quiz) */
  function weightedPick(pool, misses, lastId){
    var bag = [];
    pool.forEach(function(p){ var w = 10 + Math.min(misses[p.id] || 0, 3) * 5; for(var i = 0; i < w; i++) bag.push(p); });
    var pick, n = 0;
    do { pick = bag[Math.floor(Math.random() * bag.length)]; n++; } while(n < 40 && pool.length > 1 && pick.id === lastId);
    return pick;
  }

  /* ---- "Where would you listen?" questions ------------------------------ */
  var WHERE = [
    { id:'stridor', ask:'Where is stridor loudest?', sound:'stridor', ok:['trachea'],
      why:'Stridor comes from a narrowed upper airway (larynx, trachea), so it is loudest over the neck.' },
    { id:'s1', ask:'Where is S1 loudest?', sound:'heart-normal', ok:['mitral','tricuspid'],
      why:'S1 is the mitral and tricuspid valves closing, so it is loudest toward the apex and lower left sternal border.' },
    { id:'s2', ask:'Where is S2 loudest?', sound:'heart-normal', ok:['aortic','pulmonic'],
      why:'S2 is the aortic and pulmonic valves closing, so it is loudest at the base of the heart: the 2nd intercostal spaces either side of the sternum.' },
    { id:'s3', ask:'Where is an S3 best heard?', sound:'heart-s3', ok:['mitral'],
      why:'A left-sided S3 is low and soft: at the apex, with the bell, patient turned onto the left side.' },
    { id:'s4', ask:'Where is an S4 best heard?', sound:'heart-s4', ok:['mitral'],
      why:'Like S3, a left-sided S4 is low and soft and best at the apex with the bell.' },
    { id:'split', ask:'Where do you listen for a split S2?', sound:'heart-split-s2', ok:['pulmonic'],
      why:'P2 is soft and heard mainly at the pulmonic area, so the split is heard there.' },
    { id:'as', ask:'Where is the murmur of aortic stenosis loudest?', sound:'heart-systolic-murmur', ok:['aortic'],
      why:'Aortic stenosis is loudest at the aortic area (2nd intercostal space, right sternal border) and carries into the neck.' },
    { id:'edema', ask:'Early pulmonary edema: where do crackles show up first?', sound:'crackles', ok:['lung-rl','lung-ll','back-ll','back-rl'],
      why:'Fluid settles at the lung bases first, so listen low: the bases at the sides and below the shoulder blades.' },
    { id:'apices', ask:'Checking breath sounds: tap one of the lung apices.', sound:'wheeze', ok:['lung-ru','lung-lu','back-lu','back-ru'],
      why:'The apices are the tops of the lungs: listened to just below the clavicles in front, or high on the back, between the top of the shoulder blade and the spine. Compare right with left.' }
  ];

  /* ---- Timing questions -------------------------------------------------- */
  var TIMING = [
    { id:'s3', sound:'heart-s3', zone:function(t, ev){ return t >= ev.systole + .05 && t <= ev.systole + .3; },
      where:'in early diastole, just after S2', why:'S3 is blood rushing into a stretched ventricle as filling begins, so it falls just after S2: Ken-TUC-ky.' },
    { id:'s4', sound:'heart-s4', zone:function(t){ return t >= -PRE && t <= -.04; },
      where:'in late diastole, just before S1', why:'S4 is the atrium squeezing against a stiff ventricle at the very end of filling, so it falls just before S1: TEN-nes-see.' },
    { id:'split', sound:'heart-split-s2', zone:function(t, ev){ return t >= ev.systole - .04 && t <= ev.systole + .09; },
      where:'at S2, which is doubled', why:'The aortic valve closes a moment before the pulmonic: S2 itself is the extra sound, heard as two.' },
    { id:'sys', sound:'heart-systolic-murmur', zone:function(t, ev){ return t >= .03 && t <= ev.systole - .01; },
      where:'between S1 and S2, in systole', why:'A systolic murmur is turbulent flow while the ventricles squeeze, so it fills the short gap from S1 to S2.' },
    { id:'dia', sound:'heart-diastolic-murmur', zone:function(t, ev){ return t >= ev.systole + .03 || t <= -.02; },
      where:'after S2, in diastole', why:'A diastolic murmur is noise while the heart fills, so it sits in the longer gap after S2.' }
  ];
  function zoneName(t, ev){
    if(Math.abs(t) <= .04) return 'right on S1';
    if(Math.abs(t - ev.systole) <= .04) return 'right on S2';
    if(t > 0 && t < ev.systole) return 'between S1 and S2 (systole)';
    if(t > ev.systole && t <= ev.systole + .3) return 'just after S2 (early diastole)';
    if(t < 0) return 'just before S1 (late diastole)';
    return 'in mid diastole';
  }

  /* ======================================================================= */

  function mount(root, opts){
    var SOUNDS = opts.sounds;
    var byId = {}; SOUNDS.forEach(function(s){ byId[s.id] = s; });
    var playable = SOUNDS.filter(function(s){ return s.available; });
    var record = opts.record || function(){};
    var misses = Object.create(null);

    var st = {
      mode: 'explore', view: 'front', finding: opts.finding && byId[opts.finding] && byId[opts.finding].available ? opts.finding : 'heart-normal', site: null,
      compare: false, against: null, playing: null, // playing: 'a' | 'b' | null
      where: null, whereAnswered: false, timing: null, timingAnswered: false,
      tally: { where:[0,0], timing:[0,0] }
    };

    root.innerHTML =
      '<div class="st-top">' +
        '<div class="st-tabs" role="group" aria-label="Mode">' +
          '<button type="button" data-mode="explore">Explore</button>' +
          '<button type="button" data-mode="name">Name it</button>' +
          '<button type="button" data-mode="where">Where to listen</button>' +
          '<button type="button" data-mode="timing">Timing</button>' +
        '</div>' +
        '<div class="st-vol"><button type="button" class="st-mute" aria-pressed="false"></button>' +
          '<input type="range" min="0" max="100" step="5" aria-label="Volume" class="st-range"></div>' +
      '</div>' +
      '<div class="st-main">' +
        '<div class="st-fig">' +
          '<div class="st-views" role="group" aria-label="Side of the body">' +
            '<button type="button" data-view="front">Front</button><button type="button" data-view="back">Back</button></div>' +
          '<svg class="st-body" viewBox="0 0 300 330" aria-label="Chest, front view. Each listening spot is a button."></svg>' +
        '</div>' +
        '<div class="st-side"></div>' +
      '</div>' +
      '<div class="st-timing" hidden></div>' +
      '<div class="st-live sr-only" aria-live="polite"></div>';

    var svg = root.querySelector('.st-body');
    var side = root.querySelector('.st-side');
    var main = root.querySelector('.st-main');
    var timingBox = root.querySelector('.st-timing');
    var quizSection = opts.quizSection;
    var siteEls = {};

    /* volume */
    var mute = root.querySelector('.st-mute'), range = root.querySelector('.st-range');
    var lastVol = Bank.getVolume() || 1;
    function showVol(){
      var v = Bank.getVolume();
      range.value = Math.round(v * 100);
      mute.setAttribute('aria-pressed', v === 0 ? 'true' : 'false');
      mute.innerHTML = (v === 0 ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6" class="st-x"/></svg><span>Muted</span>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" class="st-x"/></svg><span>Sound</span>');
      mute.setAttribute('aria-label', v === 0 ? 'Unmute' : 'Mute');
    }
    mute.addEventListener('click', function(){
      var v = Bank.getVolume();
      if(v > 0){ lastVol = v; Bank.setVolume(0); } else Bank.setVolume(lastVol || 1);
      showVol();
    });
    range.addEventListener('input', function(){ Bank.setVolume(range.value / 100); if(+range.value > 0) lastVol = range.value / 100; showVol(); });
    showVol();

    /* modes and views */
    root.querySelectorAll('[data-mode]').forEach(function(b){
      b.addEventListener('click', function(){ setMode(b.dataset.mode); });
    });
    root.querySelectorAll('[data-view]').forEach(function(b){
      b.addEventListener('click', function(){ setView(b.dataset.view); });
    });

    function setView(v){
      st.view = v;
      root.querySelectorAll('[data-view]').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.view === v ? 'true' : 'false'); });
      svg.setAttribute('aria-label', 'Chest, ' + (v === 'front' ? 'front' : 'back') + ' view. Each listening spot is a button.');
      drawBody(svg, v);
      siteEls = drawSites(svg, v, { onTap: tapSite });
      paintSites();
      if(st.mode === 'where' && st.whereAnswered && st.where){
        Object.keys(siteEls).forEach(function(id){ if(st.where.ok.indexOf(id) >= 0) siteEls[id].classList.add('is-right'); });
        if(st.lastWrong && siteEls[st.lastWrong]) siteEls[st.lastWrong].classList.add('is-wrong');
      }
    }

    function setMode(m){
      stopAll();
      st.mode = m;
      root.querySelectorAll('[data-mode]').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.mode === m ? 'true' : 'false'); });
      main.hidden = !(m === 'explore' || m === 'where');
      timingBox.hidden = m !== 'timing';
      if(quizSection) quizSection.hidden = m !== 'name';
      root.classList.toggle('is-name', m === 'name');
      root.classList.toggle('is-where', m === 'where');
      if(m === 'explore') renderExplore();
      if(m === 'where'){ st.where = null; nextWhere(); }
      if(m === 'timing'){ st.timing = null; nextTiming(); }
      paintSites();
    }

    /* ---- playing ---- */
    var stripA = null, stripB = null;
    function stopAll(){
      Bank.stop();
      st.playing = null;
      if(stripA) stripA.stop(); if(stripB) stripB.stop();
      updatePlayButtons();
    }
    function play(sound, site, strip, which){
      if(st.playing === which){ stopAll(); return; }
      stopAll();
      var h = {
        onStart: function(info){ st.playing = which; if(strip) strip.play(info); updatePlayButtons(); },
        onEnd: function(){ if(st.playing === which){ st.playing = null; } if(strip) strip.stop(); updatePlayButtons(); },
        onStop: function(){ if(strip) strip.stop(); if(st.playing === which){ st.playing = null; updatePlayButtons(); } },
        onError: function(msg){ st.playing = null; if(strip) strip.stop(); updatePlayButtons(); showError(msg); }
      };
      if(sound.synth){ h.mix = heartMix(sound.synth, site || SITE.mitral); h.beats = 6; }
      else if(site){ var g = LUNG_GAIN[sound.id]; h.gain = g ? g(site) : 1; }
      showError('');
      Bank.play(sound, h);
    }
    function showError(msg){
      var e = root.querySelector('.st-err');
      if(e){ e.textContent = msg; e.hidden = !msg; }
    }
    function updatePlayButtons(){
      root.querySelectorAll('[data-play-which]').forEach(function(b){
        var on = st.playing === b.dataset.playWhich;
        b.classList.toggle('playing', on);
        b.innerHTML = on ? '<span aria-hidden="true">&#9724;</span> Stop' : '<span aria-hidden="true">&#9658;</span> ' + esc(b.dataset.label);
      });
      Object.keys(siteEls).forEach(function(id){ siteEls[id].classList.toggle('is-playing', !!st.playing && st.site === id && st.mode === 'explore'); });
    }

    function paintSites(){
      var sound = byId[st.finding];
      Object.keys(siteEls).forEach(function(id){
        var g = siteEls[id], s = SITE[id];
        g.classList.toggle('is-on', st.site === id);
        var halo = g.querySelector('.st-halo');
        if(st.mode === 'explore' && sound){
          var k = strength(sound, s);
          halo.setAttribute('r', (11 + 9 * k).toFixed(1));
          halo.style.opacity = (0.06 + 0.34 * k).toFixed(2);
          g.classList.toggle('is-best', BEST[sound.id] && BEST[sound.id].at.indexOf(id) >= 0);
        } else {
          halo.style.opacity = 0; g.classList.remove('is-best');
        }
        g.classList.remove('is-right', 'is-wrong');
      });
    }

    /* ---- explore ---- */
    var HEART = playable.filter(function(s){ return s.group === 'heart'; });
    var LUNG = playable.filter(function(s){ return s.group !== 'heart'; });
    function chip(s, cur, attr){
      return '<button type="button" ' + attr + '="' + s.id + '" aria-pressed="' + (cur === s.id) + '">' + esc(short(s)) + '</button>';
    }
    function short(s){ return s.label.replace(' (Rales)', '').replace('Normal S1 / S2', 'Normal'); }

    function renderExplore(){
      var sound = byId[st.finding];
      if(!st.against || st.against === st.finding || byId[st.against].group === 'heart' !== (sound.group === 'heart')) st.against = sound.group === 'heart' ? (st.finding === 'heart-normal' ? 'heart-s3' : 'heart-normal') : (st.finding === 'wheeze' ? 'crackles' : 'wheeze');
      var other = byId[st.against];
      var site = st.site ? SITE[st.site] : null;
      var best = BEST[sound.id];
      var bestNames = best ? best.at.filter(function(id){ return SITE[id].view === 'front' || sound.group !== 'heart'; })
        .map(function(id){ return SITE[id].name; }) : [];
      var here = '';
      if(site){
        var isBest = best && best.at.indexOf(site.id) >= 0;
        var k = strength(sound, site);
        here = '<p class="st-here ' + (isBest ? 'is-best' : '') + '"><b>' + (isBest ? 'Loudest here.' : k >= .5 ? 'Heard here, but not at its loudest.' : k >= .2 ? 'Faint here.' : 'Barely heard here.') + '</b> ' +
          (isBest ? esc(best.why) : 'Best at the ' + esc(uniq(bestNames).slice(0, 2).join(' or ')) + '.') + '</p>' +
          '<p class="st-sitenote">' + esc(site.note) + '</p>';
      }
      side.innerHTML =
        '<div class="st-pick"><span class="st-k">Patient finding</span>' +
          '<div class="st-chips" role="group" aria-label="Heart sounds (generated)"><span class="st-gl">Heart <span class="synth-tag">generated</span></span>' + HEART.map(function(s){ return chip(s, st.finding, 'data-finding'); }).join('') + '</div>' +
          '<div class="st-chips" role="group" aria-label="Lung and airway sounds (recorded)"><span class="st-gl">Lung &amp; airway <span class="st-rec">recorded</span></span>' + LUNG.map(function(s){ return chip(s, st.finding, 'data-finding'); }).join('') + '</div>' +
        '</div>' +
        '<div class="st-site-card">' +
          (site ? '<div class="st-site-name">' + esc(site.name) + '</div><div class="st-site-where">' + esc(site.where) + '</div>' + here
                : '<div class="st-site-name">Tap a spot on the chest to listen</div><div class="st-site-where">Bigger glow = louder there. The ringed spots are where ' + esc(short(sound)) + ' is loudest.</div>') +
        '</div>' +
        '<div class="st-row"><span class="st-k">' + esc(short(sound)) + (site ? ' at the ' + esc(site.name.replace(/ \(.*\)/, '').toLowerCase()) : '') + '</span>' +
          '<button type="button" class="st-play" data-play-which="a" data-label="Play"></button></div>' +
        '<div class="st-strip" data-strip="a"></div>' +
        '<p class="st-cap-line">' + capLine(sound) + '</p>' +
        '<div class="st-err" role="alert" hidden></div>' +
        '<label class="st-compare"><input type="checkbox"' + (st.compare ? ' checked' : '') + '> Compare side by side</label>' +
        (st.compare ?
          '<div class="st-chips st-chips--b" role="group" aria-label="Compare with">' +
            (sound.group === 'heart' ? HEART : LUNG).filter(function(s){ return s.id !== st.finding; }).map(function(s){ return chip(s, st.against, 'data-against'); }).join('') + '</div>' +
          '<div class="st-row"><span class="st-k">' + esc(short(other)) + (site ? ' at the same spot' : '') + '</span>' +
          '<button type="button" class="st-play st-play--b" data-play-which="b" data-label="Play"></button></div>' +
          '<div class="st-strip" data-strip="b"></div><p class="st-cap-line">' + capLine(other) + '</p>' : '');

      side.querySelectorAll('[data-finding]').forEach(function(b){ b.addEventListener('click', function(){
        stopAll(); st.finding = b.dataset.finding; renderExplore(); paintSites();
        say(short(byId[st.finding]) + ' selected. ' + (BEST[st.finding] ? BEST[st.finding].why : ''));
      }); });
      side.querySelectorAll('[data-against]').forEach(function(b){ b.addEventListener('click', function(){ stopAll(); st.against = b.dataset.against; renderExplore(); }); });
      side.querySelector('.st-compare input').addEventListener('change', function(e){ st.compare = e.target.checked; renderExplore(); });
      stripA = makeStrip(side.querySelector('[data-strip="a"]'));
      drawStrip(stripA, sound, site);
      stripB = null;
      if(st.compare){ stripB = makeStrip(side.querySelector('[data-strip="b"]')); drawStrip(stripB, other, site); }
      side.querySelector('[data-play-which="a"]').addEventListener('click', function(){ play(sound, site, stripA, 'a'); });
      var pb = side.querySelector('[data-play-which="b"]');
      if(pb) pb.addEventListener('click', function(){ play(other, site, stripB, 'b'); });
      updatePlayButtons();
    }
    function uniq(a){ return a.filter(function(x, i){ return a.indexOf(x) === i; }); }
    function capLine(sound){
      return sound.synth ? esc(describeHeart(sound.synth).replace(/^./, function(c){ return c.toUpperCase(); }))
        : esc(PHASE_TEXT[sound.id]) + ' <span class="st-muted">(Schematic breath: the recording carries no in/out markers.)</span>';
    }
    function drawStrip(strip, sound, site){
      if(sound.synth) strip.drawHeart(sound, site ? heartMix(sound.synth, site) : {});
      else strip.drawLung(sound);
    }

    function tapSite(site){
      if(st.mode === 'where') return answerWhere(site);
      if(st.mode !== 'explore') return;
      var same = st.site === site.id;
      st.site = site.id;
      renderExplore(); paintSites();
      var sound = byId[st.finding];
      if(same && st.playing === 'a'){ stopAll(); return; }
      play(sound, site, stripA, 'a');
      var k = strength(sound, site);
      say(site.name + '. ' + short(sound) + (BEST[sound.id] && BEST[sound.id].at.indexOf(site.id) >= 0 ? ' is loudest here.' : k >= .5 ? ' is heard here.' : ' is faint here.'));
    }

    /* ---- where to listen ---- */
    function nextWhere(force){
      var pool = WHERE.filter(function(w){ return byId[w.sound]; });
      var q = force ? pool.filter(function(w){ return w.id === force; })[0] : null;
      st.where = q || weightedPick(pool, misses, st.where && st.where.id);
      st.whereAnswered = false;
      st.site = null;
      // Open on the side that holds an answer (the student can still flip).
      var view = st.where.ok.some(function(id){ return SITE[id].view === 'front'; }) ? 'front' : 'back';
      if(st.view !== view) setView(view);
      renderWhere();
      paintSites();
      say('Question. ' + st.where.ask + ' Tap a spot on the chest.');
    }
    function renderWhere(result){
      var q = st.where, t = st.tally.where;
      side.innerHTML =
        '<div class="st-q"><span class="st-k">Where to listen</span><strong>' + esc(q.ask) + '</strong>' +
        (t[1] ? '<div class="st-tally">' + t[0] + ' of ' + t[1] + ' right</div>' : '') + '</div>' +
        (result ? result : '<p class="st-hint">Tap the spot on the chest. Flip to Back if you need the back.</p>');
      var n = side.querySelector('.st-next');
      if(n) n.addEventListener('click', function(){ nextWhere(); });
      var p = side.querySelector('[data-play-which="a"]');
      if(p){
        stripA = makeStrip(side.querySelector('[data-strip="a"]'));
        var sound = byId[q.sound], site = SITE[q.ok[0]];
        drawStrip(stripA, sound, site);
        p.addEventListener('click', function(){ play(sound, site, stripA, 'a'); });
        updatePlayButtons();
      }
    }
    /* Green on every right spot, red on the tapped one; if no right spot is on
       this side, flip to the side that has them so the answer is visible. */
    function markWhere(site, ok){
      var q = st.where;
      if(!q.ok.some(function(id){ return SITE[id].view === st.view; })){
        setView(SITE[q.ok[0]].view);
      }
      Object.keys(siteEls).forEach(function(id){
        if(q.ok.indexOf(id) >= 0) siteEls[id].classList.add('is-right');
      });
      if(!ok && siteEls[site.id]) siteEls[site.id].classList.add('is-wrong');
    }
    function answerWhere(site){
      if(st.whereAnswered){ return; }
      st.whereAnswered = true;
      st.lastWrong = null;
      var q = st.where, ok = q.ok.indexOf(site.id) >= 0;
      st.tally.where[1]++; if(ok) st.tally.where[0]++; else misses[q.id] = (misses[q.id] || 0) + 1;
      if(!ok) st.lastWrong = site.id;
      markWhere(site, ok);
      var right = q.ok.map(function(id){ return SITE[id].name; });
      var sound = byId[q.sound];
      var html = '<div class="st-verdict ' + (ok ? 'ok' : 'no') + '">' + (ok ? 'Right: ' + esc(site.name) + '.' : 'Not there. You tapped: ' + esc(site.name) + '.') + '</div>' +
        '<p>' + esc(q.why) + '</p>' +
        (ok ? '' : '<p class="st-sitenote"><b>' + esc(site.name) + ':</b> ' + esc(site.note) + '</p>') +
        '<p class="st-sitenote"><b>Answer:</b> ' + esc(uniq(right).join(', ')) + '.</p>' +
        '<div class="st-row"><span class="st-k">Hear ' + esc(short(sound)) + ' there</span><button type="button" class="st-play" data-play-which="a" data-label="Play"></button></div>' +
        '<div class="st-strip" data-strip="a"></div><div class="st-err" role="alert" hidden></div>' +
        '<div class="st-actions"><button type="button" class="st-next">Next question</button></div>';
      renderWhere(html);
      if(window.LevlSound) window.LevlSound.answer(ok);
      if(window.LevlAnnounce) window.LevlAnnounce.answer(ok, q.why);
      record({ tool:'sound-trainer', id:'where-' + q.id, correct: ok,
        label:'Where to listen: ' + q.ask.replace(/\?$/, ''), href:'sound-trainer.html?mode=where&q=' + q.id });
      var nx = side.querySelector('.st-next'); if(nx) nx.focus({ preventScroll: true });
    }

    /* ---- timing ---- */
    var tStrip = null;
    function nextTiming(force){
      var pool = TIMING.filter(function(q){ return byId[q.sound]; });
      var q = force ? pool.filter(function(x){ return x.id === force; })[0] : null;
      st.timing = q || weightedPick(pool, misses, st.timing && st.timing.id);
      st.timingAnswered = false; st.cursor = null;
      renderTiming();
    }
    function renderTiming(result){
      var q = st.timing, sound = byId[q.sound], t = st.tally.timing;
      timingBox.innerHTML =
        '<div class="st-q"><span class="st-k">Timing</span><strong>Play the beat, then tap the strip where the extra sound falls.</strong>' +
        (t[1] ? '<div class="st-tally">' + t[0] + ' of ' + t[1] + ' right</div>' : '') + '</div>' +
        '<div class="st-row"><span class="st-k">' + (st.timingAnswered ? esc(sound.label) : 'Mystery heart sound') + ' <span class="synth-tag">generated</span></span>' +
        '<button type="button" class="st-play" data-play-which="t" data-label="Play the beat"></button></div>' +
        '<div class="st-strip st-strip--tap" data-strip="t" tabindex="0" aria-label="Heartbeat timeline. Left and right arrow keys move the marker, Enter answers."></div>' +
        '<p class="st-hint">' + (st.timingAnswered ? '' : 'S1 and S2 are marked. Shaded = systole. Arrow keys move a marker; Enter answers.') + '</p>' +
        '<div class="st-err" role="alert" hidden></div>' +
        (result || '');
      var host = timingBox.querySelector('[data-strip="t"]');
      tStrip = makeStrip(host);
      tStrip.drawHeart(sound, {}, !st.timingAnswered);
      if(st.answerX != null && st.timingAnswered) tStrip.mark(st.answerX);
      timingBox.querySelector('[data-play-which="t"]').addEventListener('click', function(){ play(sound, null, tStrip, 't'); });
      if(!st.timingAnswered){
        host.addEventListener('click', function(e){
          var r = tStrip.svg.getBoundingClientRect();
          answerTiming((e.clientX - r.left) / r.width * tStrip.W);
        });
        host.addEventListener('keydown', function(e){
          if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
            e.preventDefault();
            var TW = tStrip.W;
            st.cursor = Math.max(0, Math.min(TW, (st.cursor == null ? TW / 2 : st.cursor) + (e.key === 'ArrowLeft' ? -TW / 50 : TW / 50)));
            tStrip.mark(st.cursor);
            var ev = Bank.heartEvents(sound.synth, sound.bpm || 72);
            say('Marker ' + zoneName(xToT(st.cursor, ev.cycle), ev));
          } else if(e.key === 'Enter' && st.cursor != null){ e.preventDefault(); answerTiming(st.cursor); }
        });
      }
      var n = timingBox.querySelector('.st-next');
      if(n) n.addEventListener('click', function(){ stopAll(); nextTiming(); });
      updatePlayButtons();
    }
    function xToT(x, cycle){ return x / tStrip.W * cycle - PRE; }
    function answerTiming(x){
      if(st.timingAnswered) return;
      var q = st.timing, sound = byId[q.sound];
      var ev = Bank.heartEvents(sound.synth, sound.bpm || 72);
      var t = xToT(x, ev.cycle);
      var ok = q.zone(t, ev);
      st.timingAnswered = true; st.answerX = x;
      st.tally.timing[1]++; if(ok) st.tally.timing[0]++; else misses['t-' + q.id] = (misses['t-' + q.id] || 0) + 1;
      var html = '<div class="st-verdict ' + (ok ? 'ok' : 'no') + '">' +
        (ok ? 'Right: that was ' + esc(sound.label) + ', ' + esc(q.where) + '.' : 'You tapped ' + esc(zoneName(t, ev)) + '. That was ' + esc(sound.label) + ': it falls ' + esc(q.where) + '.') + '</div>' +
        '<p>' + esc(q.why) + '</p><p class="st-sitenote">The strip now shows the whole sound: play it again and watch the extra sound pass under the line.</p>' +
        '<div class="st-actions"><button type="button" class="st-next">Next beat</button></div>';
      stopAll();
      renderTiming(html);
      if(window.LevlSound) window.LevlSound.answer(ok);
      if(window.LevlAnnounce) window.LevlAnnounce.answer(ok, 'That was ' + sound.label + ', ' + q.where + '. ' + q.why);
      record({ tool:'sound-trainer', id:'timing-' + q.id, correct: ok,
        label:'Heart sound timing: ' + sound.label, href:'sound-trainer.html?mode=timing&q=' + q.id });
      var nx = timingBox.querySelector('.st-next'); if(nx) nx.focus({ preventScroll: true });
    }

    /* start */
    setView('front');
    var m = opts.mode && /^(explore|name|where|timing)$/.test(opts.mode) ? opts.mode : 'explore';
    setMode(m);
    if(m === 'where' && opts.q && WHERE.some(function(w){ return w.id === opts.q; })) nextWhere(opts.q);
    if(m === 'timing' && opts.q && TIMING.some(function(w){ return w.id === opts.q; })) nextTiming(opts.q);

    return {
      setMode: setMode,
      /* A labelled strip of one sound, for the name-it quiz's feedback. */
      strip: function(host, sound){
        var s = makeStrip(host);
        drawStrip(s, sound, sound.synth ? SITE.mitral : null);
        return s;
      }
    };
  }

  window.SoundStage = {
    mount: mount,
    /* No DOM: for the tests and for the notes file's accuracy list. */
    pure: { SITES: SITES, BEST: BEST, WHERE: WHERE, TIMING: TIMING, heartMix: heartMix, strength: strength, LUNG_GAIN: LUNG_GAIN,
      PHASE: PHASE, BREATH: BREATH, INSP: INSP, zoneName: zoneName }
  };
})();
