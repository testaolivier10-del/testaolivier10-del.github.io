/* Where a sound comes from, and what to do when it comes from nowhere.

   The trainer had five clips, all pulmonary, four of them hotlinked from
   Wikimedia — while the tools page and the page title both promised heart
   sounds. It also meant the one page on this site that needs the network was
   the one page that silently died without it: cross-origin audio is not
   cached by the service worker (an opaque response has response.ok false, so
   the cache-first branch never stores it), so the trainer broke offline while
   the rest of the app kept working.

   Three sources, tried in order:

     1. LOCAL — a file under assets/audio/. Nothing here yet; see the README in
        that directory for which files to drop in. The moment one appears it
        wins, with no code change, and that sound works offline.
     2. REMOTE — the Wikimedia URL the sound already had. Still correct, still
        properly credited, still the best recording available; just no longer
        the only option.
     3. SYNTHESIZED — generated here, from maths, in the browser.

   ON SYNTHESIZING A CLINICAL SOUND. This would be indefensible for lung
   sounds: a wheeze is a texture, and a student who learns a synthetic texture
   has learned the wrong thing. It is defensible for the heart, and only
   because of what heart sounds are actually diagnosed by — S1 and S2 are two
   short thumps, and nearly everything a student must distinguish is a matter
   of TIMING between them. Where the extra sound falls in the cycle is what
   separates an S3 from an S4; whether the noise sits between S1 and S2 or
   after S2 is what separates a systolic murmur from a diastolic one. That
   structure survives synthesis intact, which is why the heart sounds here are
   generated and the lung sounds are not.

   Every synthesized sound is labelled as synthesized on screen, every time.
   A student should never be unsure whether they are hearing a patient or a
   formula. */
(function(){

  /* One AudioContext, created on the first play — browsers refuse to start one
     without a user gesture, and creating it eagerly just produces a suspended
     context and a console warning. */
  var ctx = null;
  function audio(){
    if(!ctx){
      var AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return null;
      ctx = new AC();
    }
    if(ctx.state === 'suspended' && ctx.resume) ctx.resume();
    return ctx;
  }

  /* ---- Synthesis --------------------------------------------------------- */

  /* A heart sound is a short, heavily damped thud, not a tone: the valve
     closing is an impulse and the chest is what rings. So each one is a
     decaying sine at the right pitch with noise mixed in for body, which is
     much closer to the real thing than a clean oscillator. */
  function thump(data, sr, at, opts){
    var start = Math.floor(at * sr);
    var len = Math.floor((opts.dur || 0.09) * sr);
    var tau = (opts.dur || 0.09) / 3.2;
    for(var i = 0; i < len; i++){
      var t = i / sr;
      var env = Math.exp(-t / tau);
      var tone = Math.sin(2 * Math.PI * opts.freq * t);
      var noise = (Math.random() * 2 - 1) * (opts.noise === undefined ? 0.35 : opts.noise);
      var v = (tone + noise) * env * (opts.gain || 0.5);
      var at2 = start + i;
      if(at2 >= 0 && at2 < data.length) data[at2] += v;
    }
  }

  /* A murmur is turbulent flow: filtered noise, shaped over its window. The
     one-pole pair is a cheap band-pass, which is all that is needed — the
     point of the sound here is WHERE it sits in the cycle, and a student
     hearing "noise between the two thumps" has read it correctly. */
  /* 3, chosen by measuring: it puts the murmur's energy on a par with S1
     while leaving S2 clearly present. Higher and the murmur swamps S2, which
     would teach a student to stop listening for the second heart sound in
     exactly the patients whose S2 matters most. */
  var HP_MAKEUP = 3;

  function murmur(data, sr, from, to, opts){
    var start = Math.floor(from * sr), end = Math.floor(to * sr);
    var lp = 0, hp = 0, prev = 0;
    var a = (opts.bright || 0.35), b = (opts.body || 0.06);
    var n = end - start;
    for(var i = 0; i < n; i++){
      var x = Math.random() * 2 - 1;
      lp += a * (x - lp);          // low-pass: take the edge off
      hp = lp - prev; prev = lp;   // high-pass by differencing: drop the rumble
      var u = i / n;
      /* Crescendo-decrescendo — the diamond shape a textbook draws for a
         systolic murmur, and the reason it is described as "diamond-shaped". */
      var env = opts.flat ? Math.sin(Math.PI * u) * 0.8 + 0.2 : Math.sin(Math.PI * u);
      var at2 = start + i;
      /* HP_MAKEUP compensates for the differencing high-pass, which is a
         first difference and therefore throws away most of the amplitude at
         these frequencies. Without it the murmur measures at 2% of the beat's
         energy and is effectively inaudible next to S1 — which would teach
         that a murmur is a subtle thing you have to strain for, when the
         grade III murmur a student is meant to recognize is not. */
      if(at2 >= 0 && at2 < data.length) data[at2] += hp * HP_MAKEUP * env * (opts.gain || 0.22) * (1 + b);
    }
  }

  /* The cardiac cycle these are all scheduled against. Systole (S1 to S2) is
     roughly 320 ms and barely changes with rate; diastole is what shortens
     when the heart speeds up, which is exactly why a fast rate makes the two
     halves hard to tell apart. */
  var SYSTOLE = 0.32;

  /* Where every sound of one beat falls, in seconds from that beat's S1.
     The single source of the timing: renderHeart() schedules from it and the
     trainer's phonocardiogram strip draws and labels from it, so the picture
     can never drift from what is heard. Points are {key, at}; noise windows
     are {key, from, to}. */
  function heartEvents(kind, bpm){
    var cycle = 60 / (bpm || 72);
    var ev = { cycle: cycle, systole: SYSTOLE, points: [], spans: [] };
    ev.points.push({ key: 'S1', at: 0 });
    if(kind === 'split-s2'){
      /* A2 then P2, about 45 ms apart: wide enough to hear as two, which is
         the whole finding. */
      ev.points.push({ key: 'A2', at: SYSTOLE });
      ev.points.push({ key: 'P2', at: SYSTOLE + 0.045 });
    } else {
      ev.points.push({ key: 'S2', at: SYSTOLE });
    }
    // Early diastole, after S2. "Ken-TUC-ky": S1, S2, S3.
    if(kind === 's3') ev.points.push({ key: 'S3', at: SYSTOLE + 0.15 });
    // Late diastole, just before the next S1. "TEN-nes-see": S4, S1, S2.
    if(kind === 's4') ev.points.push({ key: 'S4', at: cycle - 0.13 });
    if(kind === 'systolic-murmur') ev.spans.push({ key: 'murmur', from: 0.06, to: SYSTOLE - 0.01 });
    if(kind === 'diastolic-murmur') ev.spans.push({ key: 'murmur', from: SYSTOLE + 0.05, to: cycle - 0.04 });
    return ev;
  }

  /* mix: relative loudness of S1, S2 and the extra finding, set by WHERE the
     stethoscope is (the trainer's auscultation sites). Defaults are all 1.
     After the mix the buffer is normalized, so only the ratios matter. */
  function renderHeart(kind, bpm, beats, mix){
    var c = audio();
    if(!c) return null;
    var data = renderHeartData(kind, bpm, beats, mix, c.sampleRate);
    var buf = c.createBuffer(1, data.length, c.sampleRate);
    buf.getChannelData(0).set(data);
    return buf;
  }

  /* The samples themselves, with no AudioContext needed, so a page can draw a
     sound's trace before anyone has tapped (browsers allow no audio until a
     tap; drawing needs none). */
  function renderHeartData(kind, bpm, beats, mix, sr){
    mix = mix || {};
    var m1 = mix.s1 == null ? 1 : mix.s1, m2 = mix.s2 == null ? 1 : mix.s2;
    var mx = mix.extra == null ? 1 : mix.extra, mp2 = mix.p2 == null ? 1 : mix.p2;
    var ev = heartEvents(kind, bpm);
    var cycle = ev.cycle;
    var d = new Float32Array(Math.ceil(sr * cycle * beats));

    for(var n = 0; n < beats; n++){
      var t0 = n * cycle;
      ev.points.forEach(function(p){
        var at = t0 + p.at;
        if(p.key === 'S1') thump(d, sr, at, { freq: 48, dur: 0.11, gain: 0.55 * m1 });          // "lub": mitral and tricuspid
        else if(p.key === 'S2') thump(d, sr, at, { freq: 68, dur: 0.08, gain: 0.45 * m2 });     // "dub": aortic and pulmonic
        else if(p.key === 'A2') thump(d, sr, at, { freq: 70, dur: 0.07, gain: 0.36 * m2 });
        else if(p.key === 'P2') thump(d, sr, at, { freq: 74, dur: 0.07, gain: 0.32 * m2 * mp2 });
        else if(p.key === 'S3') thump(d, sr, at, { freq: 34, dur: 0.10, gain: 0.30 * mx, noise: 0.2 });
        else if(p.key === 'S4') thump(d, sr, at, { freq: 36, dur: 0.09, gain: 0.28 * mx, noise: 0.2 });
      });
      ev.spans.forEach(function(sp){
        if(kind === 'systolic-murmur') murmur(d, sr, t0 + sp.from, t0 + sp.to, { gain: 0.20 * mx, bright: 0.42 });
        else murmur(d, sr, t0 + sp.from, t0 + sp.to, { gain: 0.15 * mx, bright: 0.3, flat: true });
      });
    }

    // Normalize so no synthesized sound is wildly louder than another.
    var peak = 0, i;
    for(i = 0; i < d.length; i++) if(Math.abs(d[i]) > peak) peak = Math.abs(d[i]);
    /* mix.level scales the whole sound AFTER normalizing: a spot far from the
       heart hears everything quieter, not just in a different balance. */
    var lvl = mix.level == null ? 1 : Math.max(0, Math.min(1, mix.level));
    if(peak > 0){ for(i = 0; i < d.length; i++) d[i] = d[i] / peak * 0.82 * lvl; }

    return d;
  }

  /* The loudness envelope of a buffer, one value (0-1) per bucket: what the
     trainer draws as the phonocardiogram trace. */
  function envelope(data, from, to, buckets){
    var out = new Array(buckets), n = to - from;
    for(var b = 0; b < buckets; b++){
      var s = from + Math.floor(n * b / buckets), e = from + Math.floor(n * (b + 1) / buckets), mx = 0;
      for(var i = s; i < e && i < data.length; i++){ var v = Math.abs(data[i]); if(v > mx) mx = v; }
      out[b] = mx;
    }
    return out;
  }

  /* Master volume, 0-1, shared by generated and recorded sounds. Remembered
     per browser as a convenience; a failed read just means full volume. */
  var VOL_KEY = 'nremt_sound_volume';
  var volume = 1;
  try{ var sv = parseFloat(localStorage.getItem(VOL_KEY)); if(sv >= 0 && sv <= 1) volume = sv; }catch(e){}
  var gainNode = null, elGain = 1;
  function setVolume(v){
    volume = Math.max(0, Math.min(1, +v || 0));
    try{ localStorage.setItem(VOL_KEY, String(volume)); }catch(e){}
    if(gainNode) gainNode.gain.value = volume;
    if(playingEl) playingEl.volume = volume * elGain;
  }

  /* ---- Playing ----------------------------------------------------------- */

  var playingNode = null, playingEl = null;

  /* The handlers of whatever is sounding now. Two parts of a page can play
     through this one bank (the trainer's body and its quiz); when one starts,
     the other's onStop tells it its sound was cut off, so neither is left
     showing a Stop button for a sound that is no longer playing. */
  var active = null;
  function stop(){
    if(playingNode){ try{ playingNode.stop(); }catch(e){} playingNode = null; }
    if(playingEl){ try{ playingEl.pause(); playingEl.currentTime = 0; }catch(e){} playingEl = null; }
    var a = active; active = null;
    if(a && a.onStop) try{ a.onStop(); }catch(e){}
  }

  /* play(sound, handlers) — resolves the source and plays it.

     handlers.onStart / onEnd / onError are all optional. onError is called
     with a human-readable reason, because "nothing happened when I pressed
     play" is the worst possible outcome and the page needs to be able to say
     why. */
  function play(sound, handlers){
    handlers = handlers || {};
    stop();
    active = handlers;

    function fail(msg){ if(active === handlers) active = null; if(handlers.onError) handlers.onError(msg); }

    if(sound.synth){
      var c = audio();
      if(!c) return fail('This browser has no Web Audio support, so the generated sounds cannot play.');
      var buf;
      try{ buf = renderHeart(sound.synth, sound.bpm || 72, handlers.beats || sound.beats || 6, handlers.mix); }
      catch(e){ return fail('Could not generate this sound.'); }
      if(!buf) return fail('Could not generate this sound.');
      var src = c.createBufferSource();
      src.buffer = buf;
      if(!gainNode){ gainNode = c.createGain(); gainNode.connect(c.destination); }
      gainNode.gain.value = volume;
      src.connect(gainNode);
      src.onended = function(){ if(playingNode === src){ playingNode = null; active = null; if(handlers.onEnd) handlers.onEnd(); } };
      var t0 = c.currentTime + 0.03;
      src.start(t0);
      playingNode = src;
      /* What a page needs to draw in sync: the clock, when beat 1 starts, the
         beat timing, and the buffer itself for the trace. */
      if(handlers.onStart) handlers.onStart({
        synth: true, buffer: buf, events: heartEvents(sound.synth, sound.bpm || 72),
        startAt: t0, now: function(){ return c.currentTime; }
      });
      return;
    }

    var url = sound.localSrc || sound.audioUrl;
    if(!url) return fail('No recording available for this sound yet.');

    var el = new Audio();
    el.preload = 'auto';
    el.src = url;
    /* handlers.gain: a recording heard quieter at one spot than another (a
       sound transmitted from somewhere else), on top of the master volume. */
    elGain = handlers.gain == null ? 1 : Math.max(0, Math.min(1, handlers.gain));
    el.volume = volume * elGain;
    el.addEventListener('ended', function(){ if(playingEl === el){ playingEl = null; active = null; if(handlers.onEnd) handlers.onEnd(); } });
    el.addEventListener('error', function(){
      if(playingEl !== el) return;
      playingEl = null; active = null;
      /* The honest message. A local file would work offline; this one is
         fetched from Wikimedia, and if the network is gone so is the clip. */
      fail(sound.localSrc
        ? 'That audio file could not be loaded.'
        : 'This clip is streamed from Wikimedia and could not be reached — it needs a connection.');
    });
    var p = el.play();
    if(p && p.catch) p.catch(function(){ fail('Playback was blocked. Press play again.'); });
    playingEl = el;
    if(handlers.onStart) handlers.onStart({ synth: false, el: el, now: function(){ return el.currentTime; } });
  }

  window.LevlSoundBank = {
    play: play,
    stop: stop,
    heartEvents: heartEvents,
    heartData: renderHeartData,
    envelope: envelope,
    setVolume: setVolume,
    getVolume: function(){ return volume; },
    /* Exposed so the page can say "generated" next to the right sounds
       without duplicating the knowledge of which ones those are. */
    isSynthetic: function(s){ return !!(s && s.synth); }
  };
})();
