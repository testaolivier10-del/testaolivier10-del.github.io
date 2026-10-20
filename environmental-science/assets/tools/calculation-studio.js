/* Calculation studio trainer page (docs/apenv-spec.md section 6, the free flagship).
   OWNED BY THIS TOOL ONLY (builder T1). Mounts into #app with ApEnvTools.mount;
   the model is ApEnvMath.calculationStudio
   (environmental-science/assets/tools/math/calculation-studio.js), the content
   environmental-science/data/tools/calculation-studio.json (served filtered as
   assets/tool-data/calculation-studio.json).

   Explore, "the unit chain": an illustrated scenario (a power plant, a car, a
   home's water, a school's lights) and its start number. The student taps
   conversion factors from the tray onto the chain; each lands as a fraction,
   and every unit that cancels is struck through in the colour of its pair,
   the way a reader wants to see it on paper. A factor can be turned over (tap
   it); a true-but-useless factor (the decoy) is flagged. The running value is
   ApEnvCalc arithmetic; when only the goal unit is left the answer appears
   with its unit, and Why shows the setup exactly as it would be typed on the
   exam. Details: the start number (a slider), the typed setup and the answer
   written three ways (commas, scale word, power of ten).

   Test yourself: ApEnvTools.drill over the model's generate(): every
   calculation type of spec section 7, each a typed setup (brackets, × 100,
   units that cancel), then the answer and its unit in two boxes, then a
   follow-up (the year, the reason, scientific notation). The stage figure is
   drawn from the problem's own numbers and never shows a key before its step
   is answered. */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath, X = window.ApEnvTex;
  if(!T || !M || !M.calculationStudio) return;
  var S = M.calculationStudio, esc = T.esc, nf = S.nf;
  var NS = 'http://www.w3.org/2000/svg';
  var app0 = document.getElementById('app');
  if(app0 && !app0.getAttribute('data-details-title')) app0.setAttribute('data-details-title', 'Numbers & types');
  function tex(t){ return X ? X.render(t) : esc(t); }
  function phone(){ return (window.innerWidth || 1280) <= 640; }

  T.mount('calculation-studio', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'calculation-studio',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ---------------------------------------------------------- scenes */
  /* Flat illustrations, drawn in the course palette (tokens, so dark mode
     follows). Decorative: the ask beside them says what they show. */
  var SCENE = {
    plant: '<rect class="cs-sky" x="0" y="0" width="200" height="120" rx="14"/>' +
      '<circle class="cs-sun" cx="168" cy="26" r="11"/>' +
      '<path class="cs-smoke" d="M58 30c-8-4-6-14 3-15 2-9 15-9 18-1 9-2 14 8 7 13 4 6-3 12-10 9-5 6-15 3-18-6z"/>' +
      '<path class="cs-smoke is-2" d="M86 18c-6-3-4-11 3-11 2-7 12-6 13 0 7-1 10 6 5 10 2 5-3 9-8 7-4 4-11 2-13-6z"/>' +
      '<rect class="cs-stack" x="62" y="40" width="12" height="52"/><rect class="cs-stack" x="88" y="30" width="12" height="62"/>' +
      '<rect class="cs-band" x="62" y="46" width="12" height="5"/><rect class="cs-band" x="88" y="36" width="12" height="5"/>' +
      '<rect class="cs-bldg" x="30" y="70" width="90" height="34" rx="2"/><rect class="cs-win" x="40" y="80" width="12" height="9"/><rect class="cs-win" x="58" y="80" width="12" height="9"/><rect class="cs-win" x="76" y="80" width="12" height="9"/><rect class="cs-win" x="94" y="80" width="12" height="9"/>' +
      '<path class="cs-coal" d="M14 104l10-12 9 5 8-7 9 14z"/>' +
      '<path class="cs-tower" d="M150 104l9-56h4l9 56M153 84h16M156 64h10M146 50h30M150 58h22"/>' +
      '<path class="cs-wire" d="M120 76q15 6 30-26M176 50q10 2 24 10"/>' +
      '<rect class="cs-ground" x="0" y="104" width="200" height="16" rx="0"/>',
    car: '<rect class="cs-sky" x="0" y="0" width="200" height="120" rx="14"/>' +
      '<circle class="cs-sun" cx="30" cy="26" r="11"/>' +
      '<path class="cs-hill" d="M0 92q50-34 100-8t100-14v34H0z"/>' +
      '<rect class="cs-road" x="0" y="92" width="200" height="28"/><path class="cs-lane" d="M8 106h22M48 106h22M88 106h22M128 106h22M168 106h22"/>' +
      '<path class="cs-car" d="M54 92v-14q0-5 5-6l14-3 12-12q4-3 9-3h28q6 0 9 4l10 12 16 3q5 1 5 6v13z"/>' +
      '<path class="cs-glass" d="M90 70l9-9h12v9zM115 61h11q3 0 5 3l5 6h-21z"/>' +
      '<circle class="cs-tire" cx="78" cy="93" r="10"/><circle class="cs-hub" cx="78" cy="93" r="4"/><circle class="cs-tire" cx="140" cy="93" r="10"/><circle class="cs-hub" cx="140" cy="93" r="4"/>' +
      '<path class="cs-smoke" d="M42 86c-6 1-10-4-7-8-4-4 1-10 6-8 3-4 10-2 9 3 5 1 5 8 0 9 1 4-5 7-8 4z"/>' +
      '<path class="cs-smoke is-2" d="M22 80c-4 1-7-2-5-5-3-3 1-7 4-5 2-3 7-1 6 2 4 1 3 6 0 6 0 3-3 4-5 2z"/>',
    home: '<rect class="cs-sky" x="0" y="0" width="200" height="120" rx="14"/>' +
      '<rect class="cs-ground" x="0" y="100" width="200" height="20"/>' +
      '<path class="cs-roof" d="M40 58l46-32 46 32z"/><rect class="cs-bldg is-home" x="50" y="56" width="72" height="44"/>' +
      '<rect class="cs-door" x="78" y="74" width="16" height="26" rx="2"/><rect class="cs-win" x="58" y="66" width="13" height="12"/><rect class="cs-win" x="101" y="66" width="13" height="12"/>' +
      '<path class="cs-pipe" d="M122 86h26v-24h8"/><path class="cs-tap" d="M152 56h12v8h-4v4h-4v-4h-4z"/>' +
      '<path class="cs-drop" d="M158 74q-5 8 0 11 5-3 0-11z"/><path class="cs-drop is-2" d="M158 89q-4 6 0 8 4-2 0-8z"/>' +
      '<path class="cs-bucket" d="M146 98l3-8h18l3 8z"/>' +
      '<circle class="cs-tree" cx="20" cy="74" r="14"/><rect class="cs-trunk" x="18" y="84" width="4" height="16"/>',
    bulbs: '<rect class="cs-sky is-night" x="0" y="0" width="200" height="120" rx="14"/>' +
      '<path class="cs-ceiling" d="M10 14h180"/>' +
      [30, 70, 110, 150].map(function(x){ return '<path class="cs-cord" d="M' + (x + 10) + ' 14v20"/><circle class="cs-glow" cx="' + (x + 10) + '" cy="50" r="22"/><path class="cs-bulb" d="M' + (x + 3) + ' 46a7 7 0 1 1 14 0q0 5-3 8v4h-8v-4q-3-3-3-8z"/><rect class="cs-base" x="' + (x + 6) + '" y="58" width="8" height="5" rx="1"/>'; }).join('') +
      '<rect class="cs-desk" x="20" y="92" width="160" height="7" rx="2"/><path class="cs-leg" d="M30 99v14M170 99v14"/>'
  };
  function sceneSvg(id, title){
    return '<svg class="cs-scene-svg" viewBox="0 0 200 120" aria-hidden="true" focusable="false"><title>' + esc(title) + '</title>' + (SCENE[id] || '') + '</svg>';
  }

  /* ----------------------------------------------------- explore: chain */
  function explore(host, data){
    var ids = ((data.explore && data.explore.chains) || Object.keys(S.CHAINS)).filter(function(id){ return S.CHAINS[id]; });
    var scn = S.CHAINS[ids[0]], start = scn.start.value, placed = [], LS = null, touched = false, nid = T.nid('cs'), lastDone = false;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem cs-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">The unit chain</h2>' +
      '<div class="cs-stage">' +
        '<div class="cs-head"><div class="cs-scene"></div><div class="cs-ask"></div></div>' +
        '<div class="cs-chain" role="group" aria-label="Your chain of factors"></div>' +
        '<div class="cs-meter" aria-hidden="true"></div>' +
        '<div class="cs-trayw"><p class="cs-tray-h" id="' + nid + '-th">Factors: tap one to add it, tap it on the chain to turn it over</p><div class="cs-tray" role="group" aria-labelledby="' + nid + '-th"></div></div>' +
      '</div>' +
      '<div class="cs-ctl">' +
        '<div class="cs-scns ls-scroll" role="group" aria-label="Scenario">' + ids.map(function(id){ return '<button type="button" class="tchip cs-scn" data-id="' + id + '" aria-pressed="false">' + esc(S.CHAINS[id].label) + '</button>'; }).join('') + '</div>' +
        '<div class="cs-acts ls-act"><button type="button" class="bt-btn cs-undo">Undo</button><button type="button" class="bt-btn cs-clear">Start over</button></div>' +
      '</div>' +
      '<div class="cs-say"></div>' +
      T.moreHtml('<div class="cs-start"></div>', 'the start number') +
      '<div class="cs-nums"></div><p class="sr-only cs-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.cs-live'));
    var cue = T.cue('Tap the factor that cancels the start unit. Units that cancel are struck through.');
    $('.cs-ctl').insertBefore(cue.el, $('.cs-ctl').firstChild);
    // Keyboard: Delete or Backspace on a placed factor removes it.
    host.addEventListener('keydown', onKey);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var sl = null;
    function makeSlider(){
      var box = $('.cs-start'); box.innerHTML = '';
      sl = T.slider({ label: 'Start: ' + scn.start.what + ' (' + S.pretty(scn.start.unit) + ')', min: scn.start.min, max: scn.start.max, step: scn.start.step, value: start, decimals: 0,
        onInput: function(v){ start = v; act(); draw(); } });
      box.appendChild(sl.el);
    }
    function trayOf(id){ return scn.tray.filter(function(t){ return t.id === id; })[0]; }
    function frac(top, bot, o){
      o = o || {};
      return '<span class="cs-frac' + (o.cls ? ' ' + o.cls : '') + '"><span class="cs-num">' + top + '</span><span class="cs-bar"></span><span class="cs-den">' + (bot || '<span class="cs-one">1</span>') + '</span></span>';
    }
    function uSpan(cells){
      return cells.map(function(c){ return '<span class="cs-u' + (c.pair ? ' is-x p' + ((c.pair - 1) % 5 + 1) : '') + '">' + esc(S.pretty(c.u)) + '</span>'; }).join(' ');
    }
    function fnum(v){ return '<span class="cs-n">' + esc(nf(v, 4)) + '</span>'; }
    function setTray(){
      var tray = $('.cs-tray');
      tray.innerHTML = scn.tray.map(function(t){
        var used = placed.some(function(p){ return p.id === t.id; }), f = t.flip ? [t.f[2], t.f[3], t.f[0], t.f[1]] : t.f;
        return '<button type="button" class="cs-tile" data-id="' + t.id + '"' + (used ? ' disabled aria-disabled="true"' : '') + ' aria-label="Add ' + esc(nf(f[0], 4) + ' ' + S.pretty(f[1]) + ' per ' + nf(f[2], 4) + ' ' + S.pretty(f[3])) + (used ? ' (on the chain)' : '') + '">' +
          frac(fnum(f[0]) + ' ' + esc(S.pretty(f[1])), fnum(f[2]) + ' ' + esc(S.pretty(f[3]))) + '</button>';
      }).join('');
    }
    function draw(){
      var st = S.chainState(scn, start, placed), rows = st.rows;
      $('.cs-scene').innerHTML = sceneSvg(scn.scene, scn.title);
      $('.cs-ask').innerHTML = '<p class="cs-title">' + esc(scn.title) + '</p><p class="cs-q">' + esc(scn.ask) + '</p><p class="cs-goal"><span class="cs-k">Goal</span> ' + esc(st.targetText) + '</p>';
      var parts = [];
      parts.push('<span class="cs-link cs-startc" role="listitem" aria-label="Start: ' + esc(nf(start, 0) + ' ' + S.pretty(scn.start.unit)) + '">' + frac(fnum(start) + ' ' + uSpan(rows[0].top), rows[0].bot.length ? uSpan(rows[0].bot) : '') + '</span>');
      rows.slice(1).forEach(function(r, k){
        var tr = trayOf(r.id), f = r.flipped ? [tr.f[2], tr.f[3], tr.f[0], tr.f[1]] : tr.f;
        var cls = st.wrongWay.indexOf(r.id) > -1 ? 'is-wrong' : r.decoy ? 'is-decoy' : '';
        parts.push('<span class="cs-times" aria-hidden="true">×</span>');
        parts.push('<span class="cs-link cs-placed ' + cls + '" role="listitem"><button type="button" class="cs-pl" data-k="' + k + '" aria-label="Turn over (Delete removes it): ' + esc(nf(f[0], 4) + ' ' + S.pretty(f[1]) + ' per ' + nf(f[2], 4) + ' ' + S.pretty(f[3])) + (cls === 'is-wrong' ? ', upside down' : cls === 'is-decoy' ? ', not needed' : '') + '">' +
          frac(fnum(f[0]) + ' ' + uSpan(r.top), fnum(f[2]) + ' ' + uSpan(r.bot)) + '<span class="cs-flipi" aria-hidden="true">⇅</span></button>' +
          '<button type="button" class="cs-rm" data-k="' + k + '" aria-label="Remove this factor">×</button></span>');
      });
      parts.push('<span class="cs-eq" aria-hidden="true">=</span>');
      parts.push('<span class="cs-link cs-res' + (st.done ? ' is-done' : '') + '" role="listitem" aria-label="Result: ' + esc(nf(st.value, 4) + ' ' + st.leftText) + '"><span class="cs-res-v">' + esc(nf(st.value, st.value >= 100 ? 0 : 3)) + '</span><span class="cs-res-u">' + esc(st.leftText === '1' ? '' : st.leftText) + '</span></span>');
      var ch = $('.cs-chain'); ch.setAttribute('role', 'list'); ch.innerHTML = parts.join('');
      // The meter: what is left against the goal.
      var extra = st.left.filter(function(l){ return !st.target.some(function(g){ return g.u === l.u && g.s === l.s; }); });
      var need = st.target.filter(function(g){ return !st.left.some(function(l){ return g.u === l.u && g.s === l.s; }); });
      $('.cs-meter').innerHTML = st.done ? '<span class="cs-ok">✓ Only the goal unit is left.</span>' : '<span class="cs-k">Still to cancel</span> <span class="cs-left">' + esc(extra.map(function(e){ return S.pretty(e.u); }).join(', ') || '·') + '</span>';
      setTray();
      ['.cs-scn'].forEach(function(){ (LS ? LS.root : host).querySelectorAll('.cs-scn').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-id') === scn.id)); }); });
      $('.cs-undo').disabled = !placed.length; $('.cs-clear').disabled = !placed.length;
      words(st, extra, need);
      if(st.done && !lastDone && touched) T.event('apenv-tool-run', { tool: 'calculation-studio', chain: scn.id });
      lastDone = st.done;
    }
    function words(st, extra, need){
      var head, tone = 'warn', last = placed.length ? placed[placed.length - 1] : null, ltr = last && trayOf(last.id);
      var cancelled = []; st.rows.forEach(function(r){ r.top.concat(r.bot).forEach(function(c){ if(c.pair && cancelled.indexOf(c.u) < 0) cancelled.push(c.u); }); });
      if(!placed.length) head = 'Start with ' + nf(start, 0) + ' ' + S.pretty(scn.start.unit) + '. Tap the factor whose bottom unit cancels ' + S.pretty(S.tokens(scn.start.unit, 1)[0].u) + '.';
      else if(st.wrongWay.length && last && st.wrongWay.indexOf(last.id) > -1) head = 'Upside down: ' + S.pretty(S.tokens(last.flipped ? ltr.f[1] : ltr.f[3], 1)[0].u) + ' did not cancel. Tap the factor to turn it over.';
      else if(st.wrongWay.length) head = 'A factor is upside down (outlined). Tap it to turn it over so its units cancel.';
      else if(st.decoys.length) head = 'True but not needed: ' + trayOf(st.decoys[0]).note + ' Remove it with ×.';
      else if(st.done){ head = 'Done. Every unit but ' + st.targetText + ' cancels: ' + nf(st.value, 4) + ' ' + st.targetText + '.'; tone = 'good'; }
      else head = (cancelled.length ? 'Good: ' + S.pretty(cancelled[cancelled.length - 1]) + ' cancelled. ' : '') + 'Now cancel ' + extra.map(function(e){ return S.pretty(e.u); }).join(' and ') + '.';
      var why = whyHtml(st);
      T.explain($('.cs-say'), '<b>' + esc(head) + '</b>', why);
      nums(st);
      say(head + ' Chain: ' + chainText(st) + '.');
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>', 'explore');
        var short = function(t){ return t.replace(/metric ton/g, 't'); };
        LS.pills([{ k: 'Left', html: esc(short(st.leftText)), tone: st.done ? 'good' : 'warn' }], 'left', 'explore');
        LS.pills([{ k: 'Goal', html: esc(short(st.targetText)), tone: 'readout' }], 'right', 'explore');
      }
    }
    function chainText(st){
      return nf(start, 0) + ' ' + S.pretty(scn.start.unit) + st.rows.slice(1).map(function(r){ var tr = trayOf(r.id), f = r.flipped ? [tr.f[2], tr.f[3], tr.f[0], tr.f[1]] : tr.f; return ' times ' + nf(f[0], 4) + ' ' + S.pretty(f[1]) + ' per ' + nf(f[2], 4) + ' ' + S.pretty(f[3]); }).join('') + ' equals ' + nf(st.value, 4) + ' ' + st.leftText;
    }
    /* The setup as a reader sees it written out: each factor in brackets, units after every number. */
    function setupHtml(st){
      var f = st.rows.slice(1).map(function(r){ var tr = trayOf(r.id), x = r.flipped ? [tr.f[2], tr.f[3], tr.f[0], tr.f[1]] : tr.f; return ' × (' + nf(x[0], 4) + ' ' + S.pretty(x[1]) + ' / ' + nf(x[2], 4) + ' ' + S.pretty(x[3]) + ')'; }).join('');
      return '<p class="cs-mono">' + esc(nf(start, 0) + ' ' + S.pretty(scn.start.unit) + f) + '</p><p class="bt-small">Typed in the answer box: <code>' + esc(st.setup) + '</code></p>';
    }
    function whyHtml(st){
      var key = S.keyOrder(scn), p = [];
      p.push('<p><b>Dimensional analysis.</b> A conversion factor is a fraction worth 1: ' + esc('0.9 kg CO₂ per 1 kWh') + ' is the same amount on top and bottom, said two ways. Multiplying by it changes the units, not the amount. Put the unit you want to get rid of on the <b>bottom</b>, so it cancels the same unit on top.</p>');
      p.push('<p><b>Read the struck units.</b> Each cancelled pair has its own colour. When the only unit left is the goal (' + esc(st.targetText) + '), the number is the answer.</p>');
      if(st.done) p.push('<p><b>On the exam, write it like this</b> (the setup point):</p>' + setupHtml(st) + '<p>Then the answer with its unit (the second point): <b>' + esc(nf(st.value, 4) + ' ' + st.targetText) + '</b>.</p>');
      else p.push('<p><b>One way to finish:</b> ' + key.map(function(k){ var tr = trayOf(k.id); return esc(S.pretty(k.flipped ? tr.f[3] : tr.f[1])) + ' over ' + esc(S.pretty(k.flipped ? tr.f[1] : tr.f[3])); }).join(', then ') + '. Any order works if every unit cancels.</p>');
      p.push('<p><b>Without a calculator.</b> Multiply the tops, multiply the bottoms, then divide once. Powers of ten move the decimal point: × 1,000 is three places right, ÷ 1,000 three places left.</p>');
      return p.join('');
    }
    function nums(st){
      var w = S.words(st.value), box = $('.cs-nums');
      box.innerHTML = '<h3 class="ls-title-l">The setup, typed</h3><p class="cs-mono">' + esc(st.setup) + '</p>' +
        '<h3 class="ls-title-l">The result three ways</h3><dl class="cs-three"><div><dt>Commas</dt><dd>' + esc(w.comma) + '</dd></div>' + (w.words ? '<div><dt>Scale word</dt><dd>' + esc(w.words) + '</dd></div>' : '') + '<div><dt>Power of ten</dt><dd>' + esc(w.sci) + '</dd></div></dl>' +
        '<p class="bt-small">Unit: ' + esc(st.leftText) + (st.done ? '' : ' (not the goal yet)') + '.</p>';
    }
    function onClick(e){
      var b = e.target.closest('button'); if(!b || b.disabled) return;
      if(b.classList.contains('cs-scn')){ var nx = S.CHAINS[b.getAttribute('data-id')]; if(nx && nx !== scn){ scn = nx; start = scn.start.value; placed = []; act(); makeSlider(); draw(); } return; }
      // A factor lands the way the tray shows it (the way the problem states it); the student turns it over.
      if(b.classList.contains('cs-tile')){ var id = b.getAttribute('data-id'), tr = trayOf(id); placed.push({ id: id, flipped: !!tr.flip }); act(); draw(); focusAfter(); return; }
      if(b.classList.contains('cs-pl')){ var k = +b.getAttribute('data-k'); placed[k].flipped = !placed[k].flipped; act(); draw(); var again = (LS ? LS.root : host).querySelector('.cs-pl[data-k="' + k + '"]'); if(again) again.focus(); return; }
      if(b.classList.contains('cs-rm')){ placed.splice(+b.getAttribute('data-k'), 1); act(); draw(); focusAfter(); return; }
      if(b.classList.contains('cs-undo')){ placed.pop(); act(); draw(); return; }
      if(b.classList.contains('cs-clear')){ placed = []; act(); draw(); return; }
    }
    function onKey(e){
      var b = e.target.closest && e.target.closest('.cs-pl');
      if(b && (e.key === 'Delete' || e.key === 'Backspace')){ e.preventDefault(); placed.splice(+b.getAttribute('data-k'), 1); act(); draw(); focusAfter(true); }
    }
    function focusAfter(force){ var t = (LS ? LS.root : host).querySelector('.cs-tile:not([disabled])'); if(t && (force || !document.activeElement || document.activeElement === document.body || document.activeElement.disabled)) t.focus(); }
    host.addEventListener('click', onClick);
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.cs-stage')], dock: [$('.cs-ctl')], why: [$('.cs-say')], details: [$('.cs-nums')] });
      host.removeEventListener('click', onClick); host.removeEventListener('keydown', onKey);
      s.root.addEventListener('click', onClick); s.root.addEventListener('keydown', onKey);
      draw();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.cs-tile'), text: 'Start here: add a factor' });
    }
    makeSlider(); draw();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'calculation-studio', noun: 'calculation',
      generate: function(r, ctx, type){ return S.generate(r, ctx, type); },
      types: S.TYPES, typeLabel: 'Calculation type',
      title: function(p){ var t = S.TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Practice calculation'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); },
      newLabel: 'New calculation'
    });
  }

  /* -------------------------------------------------- drill figures */
  function box(){ var ph = phone(); return { W: ph ? 360 : 640, H: ph ? 320 : 340, ph: ph }; }
  function svgOpen(W, H, label){ return '<svg class="cs-fig-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '" preserveAspectRatio="xMidYMid meet">'; }
  function tx(x, y, s, cls, anchor){ return '<text x="' + r1(x) + '" y="' + r1(y) + '"' + (cls ? ' class="' + cls + '"' : '') + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(s) + '</text>'; }
  function r1(v){ return Math.round(v * 10) / 10; }
  function pill(x, y, s, cls, anchor){
    var w = Math.max(34, String(s).length * 8.2 + 18), x0 = anchor === 'end' ? x - w : anchor === 'start' ? x : x - w / 2;
    return '<g class="cs-pill ' + (cls || '') + '"><rect x="' + r1(x0) + '" y="' + r1(y - 15) + '" width="' + r1(w) + '" height="24" rx="12"/>' + tx(x0 + w / 2, y + 2, s, '', 'middle') + '</g>';
  }
  function figure(el, p, st){
    var g = p.figure;
    if(!g || !FIG[g.kind]){ el.innerHTML = ''; return; }
    var b = box(), out = FIG[g.kind](g, b, st || {}, p);
    el.innerHTML = '<figure class="cd-fig cs-fig">' + out + '</figure>';
  }
  var FIG = {};
  /* Two quantities as bars (a change, a part of a whole, a saving). */
  FIG.bars = function(g, b, st){
    var W = b.W, H = b.H, L = 40, R = W - 40, base = H - 46, top = 58, mx = Math.max(g.bars[0].value, g.bars[1].value) * 1.12;
    var bw = Math.min(110, (R - L) / 4), xs = [L + (R - L) * 0.28, L + (R - L) * 0.72], y = function(v){ return base - (base - top) * v / mx; };
    var o = [svgOpen(W, H, 'Bar chart: ' + g.bars.map(function(x){ return x.label + ' ' + (x.hide ? 'unknown' : nf(x.value) + ' ' + g.unit); }).join(', '))];
    o.push(tx(L - 8, 26, g.unit, 'cs-axl', 'start'));
    o.push('<line class="cs-base" x1="' + L + '" x2="' + R + '" y1="' + base + '" y2="' + base + '"/>');
    if(g.bars[1].hide){
      // the part inside the whole
      var x = W / 2 - bw * 0.7, w = bw * 1.4, yAll = y(g.bars[0].value), yPart = y(g.bars[1].value), shown = st.answer;
      o.push('<rect class="cs-b1" x="' + r1(x) + '" y="' + r1(yAll) + '" width="' + r1(w) + '" height="' + r1(base - yAll) + '" rx="4"/>');
      o.push('<rect class="cs-b2' + (shown ? '' : ' is-q') + '" x="' + r1(x) + '" y="' + r1(yPart) + '" width="' + r1(w) + '" height="' + r1(base - yPart) + '" rx="4"/>');
      o.push(tx(x + w + 10, yAll + 5, 'All: ' + nf(g.bars[0].value), 'cs-val', 'start'));
      o.push(tx(x + w + 10, yPart + (base - yPart) / 2 + 5, g.bars[1].label + ' = ' + (shown ? g.result : '?'), 'cs-val is-hi', 'start'));
      o.push(tx(W / 2, base + 22, 'The whole, and the part asked for', 'cs-lab', 'middle'));
    } else {
      g.bars.forEach(function(br, i){
        var yy = y(br.value);
        o.push('<rect class="' + (i ? 'cs-b2' : 'cs-b1') + '" x="' + r1(xs[i] - bw / 2) + '" y="' + r1(yy) + '" width="' + r1(bw) + '" height="' + r1(base - yy) + '" rx="4"/>');
        o.push(tx(xs[i], yy - 8, nf(br.value), 'cs-val', 'middle'));
        o.push(tx(xs[i], base + 22, br.label, 'cs-lab', 'middle'));
      });
      var y0 = y(g.bars[0].value), y1 = y(g.bars[1].value), mxX = (xs[0] + xs[1]) / 2;
      if(g.saving){
        o.push('<rect class="cs-gap" x="' + r1(xs[1] - bw / 2) + '" y="' + r1(y0) + '" width="' + r1(bw) + '" height="' + r1(y1 - y0) + '" rx="4"/>');
        o.push(tx(xs[1] + bw / 2 + 6, (y0 + y1) / 2 + 5, 'saved', 'cs-lab is-hi', 'start'));
      } else o.push('<path class="cs-arrow" d="M' + r1(xs[0] + bw / 2 + 6) + ' ' + r1(y0 - 2) + 'Q' + r1(mxX) + ' ' + r1(Math.min(y0, y1) - 40) + ' ' + r1(xs[1] - bw / 2 - 8) + ' ' + r1(y1 - 2) + '" marker-end="url(#cs-ah)"/>');
      o.push(pill(mxX, Math.max(30, Math.min(y0, y1) - 40), st.answer ? g.result : g.ask, st.answer ? 'is-good' : 'is-q'));
    }
    o.push(DEFS + '</svg>');
    return o.join('');
  };
  var DEFS = '<defs><marker id="cs-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="cs-ahp" d="M0 0L10 5L0 10z"/></marker></defs>';
  /* Rule of 70: the population doubling along a time line. */
  FIG.timeline = function(g, b, st){
    var W = b.W, H = b.H, L = 64, R = W - 22, base = H - 48, top = 40, t1 = g.td * 1.35, N = function(t){ return g.n0 * Math.pow(2, t / g.td); };
    var x = function(t){ return L + (R - L) * t / t1; }, y = function(v){ return base - (base - top) * (v - g.n0 * 0.6) / (N(t1) - g.n0 * 0.6); };
    var pts = []; for(var i = 0; i <= 60; i++){ var t = t1 * i / 60; pts.push(r1(x(t)) + ',' + r1(y(N(t)))); }
    var o = [svgOpen(W, H, 'Growth from ' + nf(g.n0) + ' in ' + g.y0 + ' to double that; the doubling year is ' + (st.year ? 'marked' : 'what you find'))];
    o.push('<line class="cs-base" x1="' + L + '" x2="' + R + '" y1="' + base + '" y2="' + base + '"/><line class="cs-base" x1="' + L + '" x2="' + L + '" y1="' + top + '" y2="' + base + '"/>');
    o.push('<polyline class="cs-curve" points="' + pts.join(' ') + '"/>');
    var yd = y(2 * g.n0), xd = x(g.td);
    o.push('<line class="cs-guide" x1="' + L + '" x2="' + r1(xd) + '" y1="' + r1(yd) + '" y2="' + r1(yd) + '"/><line class="cs-guide" x1="' + r1(xd) + '" x2="' + r1(xd) + '" y1="' + r1(yd) + '" y2="' + base + '"/>');
    o.push('<circle class="cs-dot" cx="' + r1(x(0)) + '" cy="' + r1(y(g.n0)) + '" r="5"/><circle class="cs-dot is-hi" cx="' + r1(xd) + '" cy="' + r1(yd) + '" r="6"/>');
    o.push(tx(L - 6, y(g.n0) + 4, nf(g.n0), 'cs-tk', 'end'), tx(L - 6, yd + 4, nf(2 * g.n0), 'cs-tk is-hi', 'end'));
    o.push(tx(x(0), base + 20, String(g.y0), 'cs-tk', 'middle'));
    o.push(tx(xd, base + 20, st.year ? M.fixed(g.y0 + g.td, 0) : '?', 'cs-tk is-hi', 'middle'));
    o.push(tx((x(0) + xd) / 2, base - 10, st.answer ? 'doubling time ' + nf(g.td, 1) + ' yr' : 'doubling time ?', 'cs-lab', 'middle'));
    o.push(tx(L, 22, (g.scale ? g.noun + ' (' + g.scale + ')' : g.noun), 'cs-axl', 'start'));
    o.push(tx(R, H - 10, 'year', 'cs-axl', 'end'));
    o.push('</svg>');
    return o.join('');
  };
  /* Births, deaths and migration as flows into and out of a town. */
  FIG.flows = function(g, b, st){
    var W = b.W, H = b.H, cx = W / 2, cy = H / 2 + 6, rr = b.ph ? 58 : 66;
    var o = [svgOpen(W, H, 'Flows: ' + nf(g.b) + ' births and ' + nf(g.im) + ' moving in; ' + nf(g.d) + ' deaths and ' + nf(g.em) + ' moving out; population ' + nf(g.N))];
    o.push('<circle class="cs-town" cx="' + cx + '" cy="' + cy + '" r="' + rr + '"/>');
    o.push(tx(cx, cy - 6, nf(g.N), 'cs-val', 'middle'), tx(cx, cy + 14, 'people', 'cs-lab', 'middle'));
    var arm = function(ang, inward, lab, v, cls){
      var a = ang * Math.PI / 180, x1 = cx + Math.cos(a) * (rr + (b.ph ? 70 : 110)), y1 = cy + Math.sin(a) * (rr + 52), x2 = cx + Math.cos(a) * (rr + 6), y2 = cy + Math.sin(a) * (rr + 6);
      var d = inward ? 'M' + r1(x1) + ' ' + r1(y1) + 'L' + r1(x2) + ' ' + r1(y2) : 'M' + r1(x2) + ' ' + r1(y2) + 'L' + r1(x1) + ' ' + r1(y1);
      var lx = cx + Math.cos(a) * (rr + (b.ph ? 70 : 110)), ly = cy + Math.sin(a) * (rr + 52) + (Math.sin(a) < 0 ? -18 : 26);
      return '<path class="cs-flow ' + cls + '" d="' + d + '" marker-end="url(#cs-ah)"/>' + tx(lx, ly, lab + ' ' + nf(v), 'cs-lab ' + cls, 'middle');
    };
    o.push(arm(-150, true, 'births', g.b, 'is-in'), arm(150, true, 'moved in', g.im, 'is-in'), arm(-30, false, 'deaths', g.d, 'is-out'), arm(30, false, 'moved out', g.em, 'is-out'));
    o.push(pill(cx, 26, 'growth rate ' + (st.answer ? g.result : '?'), st.answer ? 'is-good' : 'is-q'));
    o.push(DEFS + '</svg>');
    return o.join('');
  };
  /* Crude birth and death rates per 1,000 as two bars and their gap. */
  FIG.rates = function(g, b, st){
    var W = b.W, H = b.H, L = b.ph ? 70 : 110, R = W - 30, mx = 45, x = function(v){ return L + (R - L) * v / mx; }, y1 = H * 0.36, y2 = H * 0.62, bh = 34;
    var o = [svgOpen(W, H, 'Crude birth rate ' + g.cbr + ' and crude death rate ' + g.cdr + ' per 1,000 people')];
    o.push(tx(L - 10, y1 + 6, 'Births', 'cs-lab', 'end'), tx(L - 10, y2 + 6, 'Deaths', 'cs-lab', 'end'));
    o.push('<rect class="cs-b2" x="' + L + '" y="' + r1(y1 - bh / 2) + '" width="' + r1(x(g.cbr) - L) + '" height="' + bh + '" rx="4"/><rect class="cs-b1" x="' + L + '" y="' + r1(y2 - bh / 2) + '" width="' + r1(x(g.cdr) - L) + '" height="' + bh + '" rx="4"/>');
    o.push(tx(x(g.cbr) + 6, y1 + 6, g.cbr + ' per 1,000', 'cs-val', 'start'), tx(x(g.cdr) + 6, y2 + 6, g.cdr + ' per 1,000', 'cs-val', 'start'));
    o.push('<rect class="cs-gap" x="' + r1(x(g.cdr)) + '" y="' + r1(y1 - bh / 2) + '" width="' + r1(x(g.cbr) - x(g.cdr)) + '" height="' + bh + '" rx="2"/>');
    o.push('<path class="cs-brace" d="M' + r1(x(g.cdr)) + ' ' + r1(y2 + bh / 2 + 10) + 'v6h' + r1(x(g.cbr) - x(g.cdr)) + 'v-6"/>');
    o.push(tx((x(g.cdr) + x(g.cbr)) / 2, y2 + bh / 2 + 34, (g.cbr - g.cdr) + ' per 1,000 = ' + (st.answer ? g.result : '? %'), 'cs-lab is-hi', 'middle'));
    o.push(tx(L, 26, 'per 1,000 people per year', 'cs-axl', 'start'));
    o.push('</svg>');
    return o.join('');
  };
  /* Exponential growth by doublings or by yearly compounding. */
  FIG.growth = function(g, b, st){
    var W = b.W, H = b.H, L = 70, R = W - 26, base = H - 46, top = 46;
    var steps = g.yearly ? g.t : g.k, pts = [], vals = [];
    for(var i = 0; i <= steps; i++) vals.push(g.yearly ? g.n0 * Math.pow(1 + g.rate / 100, i) : g.n0 * Math.pow(2, i));
    var mx = vals[vals.length - 1] * 1.08, x = function(i){ return L + (R - L) * i / steps; }, y = function(v){ return base - (base - top) * v / mx; };
    var o = [svgOpen(W, H, (g.yearly ? 'Yearly growth' : 'Doublings') + ' from ' + nf(g.n0) + ' ' + g.unit)];
    o.push('<line class="cs-base" x1="' + L + '" x2="' + R + '" y1="' + base + '" y2="' + base + '"/><line class="cs-base" x1="' + L + '" x2="' + L + '" y1="' + top + '" y2="' + base + '"/>');
    var c = []; for(var j = 0; j <= 60; j++){ var u = steps * j / 60; c.push(r1(x(u)) + ',' + r1(y(g.yearly ? g.n0 * Math.pow(1 + g.rate / 100, u) : g.n0 * Math.pow(2, u)))); }
    o.push('<polyline class="cs-curve" points="' + c.join(' ') + '"/>');
    vals.forEach(function(v, i){
      var last = i === steps;
      o.push('<circle class="cs-dot' + (last ? ' is-hi' : '') + '" cx="' + r1(x(i)) + '" cy="' + r1(y(v)) + '" r="' + (last ? 6 : 4.5) + '"/>');
      o.push(tx(x(i), base + 20, g.yearly ? 'yr ' + i : (i ? '×' + Math.pow(2, i) : 'now'), 'cs-tk', 'middle'));
    });
    o.push(tx(x(0) + 8, y(vals[0]) - 10, nf(g.n0), 'cs-val', 'start'));
    o.push(pill(x(steps), Math.max(30, y(vals[steps]) - 20), st.answer ? g.result : '?', st.answer ? 'is-good' : 'is-q', 'end'));
    if(!g.yearly) o.push(tx((L + R) / 2, H - 8, 'each step: one doubling time, ' + nf(g.td, 1) + ' years', 'cs-axl', 'middle'));
    o.push(tx(L, 24, g.unit, 'cs-axl', 'start'));
    o.push('</svg>');
    return o.join('');
  };
  /* Trophic levels (energy shrinking 10x a level) or a food chain (a toxin
     growing up it): bars drawn on a log scale, every value labelled. */
  FIG.levels = function(g, b, st){
    var W = b.W, H = b.H, n = g.levels.length, cx = W / 2 + (b.ph ? 0 : 60), maxW = b.ph ? 220 : 320, minW = b.ph ? 58 : 80, top = 22, gap = 8, bh = Math.min(48, (H - top - 14 - gap * (n - 1)) / n);
    var o = [svgOpen(W, H, (g.up ? 'Concentration up a food chain: ' : 'Energy at each trophic level: ') + g.levels.map(function(l, i){ return l + ' ' + (i === g.ask && !st.answer ? 'unknown' : nf(g.values[i], 6)); }).join(', '))];
    for(var i = 0; i < n; i++){
      var lvl = i, wd = g.up ? minW + (maxW - minW) * i / Math.max(1, n - 1) : maxW - (maxW - minW) * i / Math.max(1, n - 1);
      var yy = H - 14 - (i + 1) * bh - i * gap, ask = i === g.ask, hidden = ask && !st.answer;
      o.push('<rect class="cs-lvl' + (ask ? ' is-ask' : '') + (g.up ? ' is-up' : '') + '" x="' + r1(cx - wd / 2) + '" y="' + r1(yy) + '" width="' + r1(wd) + '" height="' + r1(bh) + '" rx="6"/>');
      o.push(tx(cx, yy + bh / 2 + 5, hidden ? '?' : nf(g.values[i], 6) + (b.ph ? '' : ' ' + g.unit), 'cs-val' + (ask ? ' is-hi' : ''), 'middle'));
      o.push(tx(cx - (b.ph ? maxW / 2 + 4 : maxW / 2 + 12), yy + bh / 2 + 5, g.levels[lvl], 'cs-lab', 'end'));
    }
    if(b.ph) o.push(tx(W - 6, 16, g.unit.replace('/m2/yr', '/m²/yr'), 'cs-axl', 'end'));
    o.push(tx(b.ph ? 6 : W - 8, b.ph ? 16 : H - 4, g.up ? '× factor each step up' : '× 0.1 each step up', 'cs-axl', b.ph ? 'start' : 'end'));
    o.push('</svg>');
    return o.join('');
  };
  /* GPP split into respiration (heat) and NPP (new biomass). */
  FIG.npp = function(g, b, st){
    var W = b.W, H = b.H, L = 24, R = W - 24, y = H * 0.42, bh = 56, x = function(v){ return L + (R - L) * v / g.gpp; };
    var show = { npp: g.ask !== 'npp' || st.answer, gpp: g.ask !== 'gpp' || st.answer, r: g.ask !== 'r' || st.answer };
    var o = [svgOpen(W, H, 'Gross primary productivity split into respiration and net primary productivity')];
    o.push('<path class="cs-brace" d="M' + L + ' ' + r1(y - bh / 2 - 12) + 'v-6h' + r1(R - L) + 'v6"/>');
    o.push(tx((L + R) / 2, y - bh / 2 - 26, 'GPP: all energy captured = ' + (show.gpp ? nf(g.gpp) : '?'), 'cs-lab' + (g.ask === 'gpp' ? ' is-hi' : ''), 'middle'));
    o.push('<rect class="cs-heat' + (g.ask === 'r' && !st.answer ? ' is-q' : '') + '" x="' + L + '" y="' + r1(y - bh / 2) + '" width="' + r1(x(g.resp) - L) + '" height="' + bh + '" rx="6"/>');
    o.push('<rect class="cs-bio' + (g.ask === 'npp' && !st.answer ? ' is-q' : '') + '" x="' + r1(x(g.resp)) + '" y="' + r1(y - bh / 2) + '" width="' + r1(R - x(g.resp)) + '" height="' + bh + '" rx="6"/>');
    o.push(tx((L + x(g.resp)) / 2, y + 6, show.r ? nf(g.resp) : '?', 'cs-val is-on', 'middle'), tx((x(g.resp) + R) / 2, y + 6, show.npp ? nf(g.npp) : '?', 'cs-val is-on', 'middle'));
    o.push(tx((L + x(g.resp)) / 2, y + bh / 2 + 22, 'respiration', 'cs-lab', 'middle'), tx((L + x(g.resp)) / 2, y + bh / 2 + 40, '(lost as heat)', 'cs-axl', 'middle'));
    o.push(tx((x(g.resp) + R) / 2, y + bh / 2 + 22, 'NPP', 'cs-lab', 'middle'), tx((x(g.resp) + R) / 2, y + bh / 2 + 40, '(new biomass: food for consumers)', 'cs-axl', 'middle'));
    o.push(tx(W - 24, H - 8, g.unit.replace('m2', 'm²'), 'cs-axl', 'end'));
    o.push('</svg>');
    return o.join('');
  };
  /* Half-lives: the amount halving at each step. */
  FIG.decay = function(g, b, st){
    var W = b.W, H = b.H, L = 54, R = W - 20, base = H - 46, top = 34, n = g.n, bw = Math.min(54, (R - L) / (n + 1) * 0.6);
    var x = function(i){ return L + (R - L) * (i + 0.5) / (n + 1); }, y = function(v){ return base - (base - top) * v / g.a; };
    var o = [svgOpen(W, H, 'Amount left after each half-life of ' + nf(g.hl) + ' ' + g.tu + ', starting from ' + nf(g.a) + ' ' + g.unit)];
    o.push('<line class="cs-base" x1="' + L + '" x2="' + R + '" y1="' + base + '" y2="' + base + '"/>');
    var c = []; for(var j = 0; j <= 80; j++){ var u = (n + 0.4) * j / 80 - 0.0; c.push(r1(L + (R - L) * (u + 0.5) / (n + 1)) + ',' + r1(y(g.a * Math.pow(0.5, u)))); }
    o.push('<polyline class="cs-curve is-soft" points="' + c.join(' ') + '"/>');
    for(var i = 0; i <= n; i++){
      var v = g.a * Math.pow(0.5, i), last = i === n, hid = last && !st.answer;
      o.push('<rect class="' + (last ? 'cs-b2' : 'cs-b1') + (hid ? ' is-q' : '') + '" x="' + r1(x(i) - bw / 2) + '" y="' + r1(y(v)) + '" width="' + r1(bw) + '" height="' + r1(base - y(v)) + '" rx="3"/>');
      o.push(tx(x(i), y(v) - 7, hid ? '?' : nf(v, 3), 'cs-val' + (last ? ' is-hi' : ''), 'middle'));
      o.push(tx(x(i), base + 18, nf(i * g.hl), 'cs-tk', 'middle'));
    }
    o.push(tx((L + R) / 2, H - 8, g.tu + (st.n ? ' (' + n + ' half-lives)' : ''), 'cs-axl', 'middle'));
    o.push(tx(L - 30, 22, g.unit, 'cs-axl', 'start'));
    o.push('</svg>');
    return o.join('');
  };
  /* A chain of factors: the givens as cards first; once the setup is
     answered, the same cards as a chain with each cancelled pair struck. */
  FIG.chain = function(g, b, st){
    var W = b.W, H = b.H, o = [svgOpen(W, H, st.setup ? 'The chain of factors with the cancelled units struck through' : 'The givens of the problem as cards')];
    var cards = [{ top: nf(g.start.v, 4) + ' ' + g.start.u, bot: '' }].concat(g.factors.map(function(f){ return { top: (f.n === 1 && !f.nu ? '1' : nf(f.n, 4) + (f.nu ? ' ' + f.nu : '')), bot: nf(f.d, 4) + (f.du ? ' ' + f.du : '') }; }));
    if(!st.setup){
      var cw = b.ph ? 150 : 180, ch = 54, per = b.ph ? 2 : 3, gx = (W - per * cw - (per - 1) * 14) / 2;
      o.push(tx(W / 2, 30, 'The givens. Arrange them so the units cancel.', 'cs-lab', 'middle'));
      cards.forEach(function(c, i){
        var col = i % per, row = Math.floor(i / per), x0 = gx + col * (cw + 14), y0 = 56 + row * (ch + 16);
        o.push('<rect class="cs-card" x="' + r1(x0) + '" y="' + r1(y0) + '" width="' + cw + '" height="' + ch + '" rx="10"/>');
        o.push(tx(x0 + cw / 2, y0 + (c.bot ? 23 : 33), c.top, 'cs-val', 'middle'));
        if(c.bot) o.push(tx(x0 + cw / 2, y0 + 44, 'per ' + c.bot, 'cs-lab', 'middle'));
      });
      o.push(pill(W / 2, H - 24, '= ?', 'is-q'));
      o.push('</svg>'); return o.join('');
    }
    // Strike pairs: a unit on a bottom cancels the same unit on an earlier top.
    var units = cards.map(function(c){ return { top: unitOf(c.top), bot: unitOf(c.bot) }; }), pairs = [], used = {};
    units.forEach(function(u, i){ if(!u.bot) return; for(var j = 0; j < i; j++) if(units[j].top === u.bot && !used[j]){ used[j] = true; pairs.push([j, i]); break; } });
    var pc = function(i, side){ for(var k = 0; k < pairs.length; k++) if((side === 'top' && pairs[k][0] === i) || (side === 'bot' && pairs[k][1] === i)) return k % 5 + 1; return 0; };
    var n = cards.length, cw2 = Math.min(b.ph ? 104 : 150, (W - 24 - (n - 1) * 22) / n), x0s = 12 + (W - 24 - n * cw2 - (n - 1) * 22) / 2, ym = H / 2 - 18;
    cards.forEach(function(c, i){
      var x0 = x0s + i * (cw2 + 22), cx = x0 + cw2 / 2;
      if(i) o.push(tx(x0 - 11, ym + 5, '×', 'cs-op', 'middle'));
      o.push(strikeText(cx, ym - 10, c.top, pc(i, 'top'), cw2));
      o.push('<line class="cs-fbar" x1="' + r1(x0 + 4) + '" x2="' + r1(x0 + cw2 - 4) + '" y1="' + r1(ym) + '" y2="' + r1(ym) + '"/>');
      o.push(strikeText(cx, ym + 22, c.bot || '1', pc(i, 'bot'), cw2));
    });
    o.push(pill(W / 2, ym + 76, '= ' + (st.answer ? g.result : '?'), st.answer ? 'is-good' : 'is-q'));
    o.push('</svg>');
    return o.join('');
  };
  function unitOf(s){ var m = /^[\d.,−]+\s*(.*)$/.exec(String(s || '')); return m ? m[1].replace(/ CO₂$/, '').trim() : ''; }
  function strikeText(cx, y, s, pair, w){
    var fs = Math.min(15, Math.max(10.5, w / Math.max(6, String(s).length) * 1.7));
    var out = '<text class="cs-ft" x="' + r1(cx) + '" y="' + r1(y) + '" text-anchor="middle" style="font-size:' + r1(fs) + 'px">' + esc(s) + '</text>';
    if(pair){ var len = String(s).length * fs * 0.52; out += '<line class="cs-strike p' + pair + '" x1="' + r1(cx - len / 2) + '" x2="' + r1(cx + len / 2) + '" y1="' + r1(y - fs * 0.32) + '" y2="' + r1(y - fs * 0.32) + '"/>'; }
    return out;
  }
  /* An energy chain: a band that narrows at each step. */
  FIG.stages = function(g, b, st){
    var W = b.W, H = b.H, n = g.stages.length, L = 18, R = W - 18, bw = (R - L) / (n + 1), mid = H * 0.42, full = b.ph ? 96 : 120, cum = 1;
    var o = [svgOpen(W, H, 'Energy chain: ' + g.stages.map(function(s){ return s.name + ' ' + s.eff + '%'; }).join(', '))];
    for(var i = 0; i < n; i++){
      var h0 = full * cum, h1 = full * cum * g.stages[i].eff / 100, x0 = L + bw * (i + 0.5), x1 = x0 + bw;
      o.push('<path class="cs-band-e" d="M' + r1(x0) + ' ' + r1(mid - h0 / 2) + 'C' + r1(x0 + bw / 2) + ' ' + r1(mid - h0 / 2) + ' ' + r1(x0 + bw / 2) + ' ' + r1(mid - h1 / 2) + ' ' + r1(x1) + ' ' + r1(mid - h1 / 2) + 'V' + r1(mid + h1 / 2) + 'C' + r1(x0 + bw / 2) + ' ' + r1(mid + h1 / 2) + ' ' + r1(x0 + bw / 2) + ' ' + r1(mid + h0 / 2) + ' ' + r1(x0) + ' ' + r1(mid + h0 / 2) + 'z"/>');
      o.push('<path class="cs-flow is-out" d="M' + r1(x0 + bw / 2) + ' ' + r1(mid + h0 / 2 - 2) + 'q4 26 0 44" marker-end="url(#cs-ah)"/>');
      o.push(tx(x0 + bw / 2, mid + full / 2 + 40, 'heat', 'cs-axl', 'middle'));
      o.push(tx(x0 + bw / 2, mid - full / 2 - 26, g.stages[i].name, 'cs-lab', 'middle'));
      o.push(tx(x0 + bw / 2, mid - full / 2 - 8, g.stages[i].eff + '%', 'cs-val', 'middle'));
      cum *= g.stages[i].eff / 100;
    }
    o.push(tx(L + bw * 0.25, mid + 5, '100', 'cs-val is-on', 'middle'));
    o.push(pill(R - bw * 0.35, mid + 5, st.answer ? nf(g.overall, 1) + '%' : '?%', st.answer ? 'is-good' : 'is-q'));
    o.push(DEFS + '</svg>');
    return o.join('');
  };
  /* Dose-response: the measured points, then the LD50 read off at 50%. */
  FIG.curve = function(g, b, st){
    var W = b.W, H = b.H, L = 54, R = W - 20, base = H - 48, top = 30, mx = g.points[g.points.length - 1][0] * 1.05;
    var x = function(v){ return L + (R - L) * v / mx; }, y = function(v){ return base - (base - top) * v / 100; };
    var o = [svgOpen(W, H, 'Dose-response curve: percent died against dose in mg/kg' + (st.read ? '; LD50 ' + nf(g.ld, 1) + ' mg/kg' : ''))];
    [0, 25, 50, 75, 100].forEach(function(v){ o.push('<line class="cs-grid" x1="' + L + '" x2="' + R + '" y1="' + r1(y(v)) + '" y2="' + r1(y(v)) + '"/>' + tx(L - 8, y(v) + 4, String(v), 'cs-tk', 'end')); });
    o.push('<line class="cs-base" x1="' + L + '" x2="' + R + '" y1="' + base + '" y2="' + base + '"/><line class="cs-base" x1="' + L + '" x2="' + L + '" y1="' + top + '" y2="' + base + '"/>');
    o.push('<polyline class="cs-curve" points="' + g.points.map(function(p){ return r1(x(p[0])) + ',' + r1(y(p[1])); }).join(' ') + '"/>');
    g.points.forEach(function(p){ o.push('<circle class="cs-dot" cx="' + r1(x(p[0])) + '" cy="' + r1(y(p[1])) + '" r="4.5"/>'); if(p[0]) o.push(tx(x(p[0]), base + 18, nf(p[0], 1), 'cs-tk', 'middle')); });
    o.push('<line class="cs-guide' + (st.read ? ' is-hi' : '') + '" x1="' + L + '" x2="' + r1(st.read ? x(g.ld) : R) + '" y1="' + r1(y(50)) + '" y2="' + r1(y(50)) + '"/>');
    if(st.read){ o.push('<line class="cs-guide is-hi" x1="' + r1(x(g.ld)) + '" x2="' + r1(x(g.ld)) + '" y1="' + r1(y(50)) + '" y2="' + base + '"/><circle class="cs-dot is-hi" cx="' + r1(x(g.ld)) + '" cy="' + r1(y(50)) + '" r="6"/>'); o.push(pill(x(g.ld), y(50) - 22, 'LD50 ' + nf(g.ld, 1), 'is-good')); }
    else o.push(tx(R, y(50) - 8, '50% died', 'cs-lab is-hi', 'end'));
    o.push(tx(L, 20, '% died', 'cs-axl', 'start'), tx((L + R) / 2, H - 8, 'dose (mg/kg body mass)', 'cs-axl', 'middle'));
    o.push('</svg>');
    return o.join('');
  };
  /* Age-specific fertility rates as bars, and the TFR they add up to. */
  FIG.tfr = function(g, b, st){
    var W = b.W, H = b.H, L = 40, R = W - 14, base = H - 52, top = 50, n = g.asfr.length, mx = Math.max.apply(null, g.asfr) * 1.15, bw = (R - L) / n * 0.68;
    var x = function(i){ return L + (R - L) * (i + 0.5) / n; }, y = function(v){ return base - (base - top) * v / mx; };
    var o = [svgOpen(W, H, 'Births per 1,000 women by age group: ' + g.asfr.map(function(v, i){ return g.bands[i] + ' ' + v; }).join(', '))];
    o.push('<line class="cs-base" x1="' + L + '" x2="' + R + '" y1="' + base + '" y2="' + base + '"/>');
    g.asfr.forEach(function(v, i){
      o.push('<rect class="cs-b1" x="' + r1(x(i) - bw / 2) + '" y="' + r1(y(v)) + '" width="' + r1(bw) + '" height="' + r1(base - y(v)) + '" rx="3"/>');
      o.push(tx(x(i), y(v) - 6, String(v), 'cs-val', 'middle'), tx(x(i), base + 16, b.ph ? g.bands[i].split('–')[0] : g.bands[i], 'cs-tk', 'middle'));
    });
    o.push(tx(L, 22, 'births per 1,000 women', 'cs-axl', 'start'), tx((L + R) / 2, H - 10, 'age of mother', 'cs-axl', 'middle'));
    o.push(pill(R, 26, 'TFR ' + (st.answer ? nf(g.tfr, 2) : '?'), st.answer ? 'is-good' : 'is-q', 'end'));
    o.push('</svg>');
    return o.join('');
  };
  /* Scale words and powers of ten: the ladder to read them by. */
  FIG.scale = function(g, b, st){
    var W = b.W, H = b.H, rows = [['thousand', '1,000', '10³'], ['million', '1,000,000', '10⁶'], ['billion', '1,000,000,000', '10⁹'], ['trillion', '1,000,000,000,000', '10¹²']];
    var o = [svgOpen(W, H, 'Scale words and powers of ten: thousand 10 to the 3, million 10 to the 6, billion 10 to the 9, trillion 10 to the 12')];
    var L = b.ph ? 14 : 60, c2 = b.ph ? 110 : 220, c3 = W - (b.ph ? 20 : 70), y0 = 50, rh = b.ph ? 34 : 38;
    o.push(tx(L, 26, 'Scale word', 'cs-axl', 'start'), tx(c2, 26, 'Written out', 'cs-axl', 'start'), tx(c3, 26, 'Power', 'cs-axl', 'end'));
    rows.forEach(function(r, i){
      var yy = y0 + i * rh;
      o.push('<rect class="cs-row' + (i % 2 ? ' is-alt' : '') + '" x="' + (L - 8) + '" y="' + (yy - 4) + '" width="' + (c3 - L + 16) + '" height="' + (rh - 4) + '" rx="8"/>');
      o.push(tx(L, yy + 18, r[0], 'cs-lab', 'start'), tx(c2, yy + 18, r[1], 'cs-mono', 'start'), tx(c3, yy + 18, r[2], 'cs-val', 'end'));
    });
    var yb = y0 + 4 * rh + 26;
    if(st.setup) o.push(tx(W / 2, yb, nf(g.tot) + ' ' + g.tu + ' / ' + nf(g.N) + ' people', 'cs-mono', 'middle'));
    o.push(pill(W / 2, yb + (st.setup ? 34 : 6), st.answer ? nf(g.ans, 0) + ' ' + g.tu + ' per person' : 'per person = ?', st.answer ? 'is-good' : 'is-q'));
    o.push('</svg>');
    return o.join('');
  };
})();
