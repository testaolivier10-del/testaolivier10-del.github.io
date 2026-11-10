/* ApHugModel: the `model` item of AP® Human Geography (docs/aphug-architecture.md,
   "Model items"). The student places pieces (land uses, zones, stages, tiers,
   labels) into the slots of a model drawn as rings, sectors, stages, tiers or
   free spots on a figure; it is graded piece by piece and position by
   position, and the first slip is named ("Dairying and grain are swapped").
   Used by bank items, lesson check items and trainer drill steps alike.

   The model (an item's `model`):
     { layout: 'rings' | 'sectors' | 'stages' | 'tiers' | 'free',
       title?, center?: 'Market' (rings and sectors: what sits in the middle),
       unit?: 'ring' (what one slot is called in feedback; a default per layout),
       slots: [{ id, name?, box?: [x%, y%, w%, h%] (free only) }],
               rings: center outward; sectors: clockwise from the top;
               stages: first to last; tiers: top to bottom
       pieces: [{ id, text }]   more pieces than slots = distractors
       key: { slotId: pieceId },
       slips?: [{ piece, slot, why }]   authored feedback for one wrong placement
       figure?: 'figure-id' (free: the drawing the slots sit on) }

   Pure (node and browser):
     check(model) -> problems[]
     grade(model, placed) -> { valid, correct, right, total, score, results: [{ slot, piece, ok, why }], slip }
     slotName(model, i) -> 'Ring 2' etc.;  artSvg(model) -> the drawing (numbers only, no words)
     html(model, id) -> the static markup (no script needed to read it)
   DOM (browser):
     mount(el, model, { onChange }) -> { get(), set(placed), lock(result), reset() }
       tap or click a piece, then a slot (or Enter and Space on each: every
       piece and slot is a button); or drag a piece onto a slot with a mouse
       or a finger. A filled slot tapped again sends its piece back. */
(function(root){
  'use strict';
  var LAYOUTS = ['rings', 'sectors', 'stages', 'tiers', 'free'];
  var UNIT = { rings: 'ring', sectors: 'sector', stages: 'stage', tiers: 'tier', free: 'spot' };
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function plain(s){ return String(s == null ? '' : s).replace(/<[^>]+>/g, ''); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function pieceText(m, id){ for(var i = 0; i < m.pieces.length; i++) if(m.pieces[i].id === id) return m.pieces[i].text; return id; }

  function slotName(m, i){
    var s = m.slots[i];
    if(s && s.name) return s.name;
    var u = m.unit || UNIT[m.layout] || 'slot';
    var n = u.charAt(0).toUpperCase() + u.slice(1) + ' ' + (i + 1);
    if(m.layout === 'rings' && i === 0) n += ' (innermost)';
    if(m.layout === 'rings' && i === m.slots.length - 1 && i > 0) n += ' (outermost)';
    return n;
  }

  function check(m){
    var out = [], p = function(x){ out.push(x); };
    if(!m || typeof m !== 'object') return ['a model is an object'];
    if(LAYOUTS.indexOf(m.layout) < 0) p('layout must be one of ' + LAYOUTS.join(', '));
    var slots = m.slots || [], pieces = m.pieces || [], key = m.key || {};
    if(slots.length < 2) p('a model has at least two slots');
    if(slots.length > 8) p('a model has at most eight slots (more will not fit a phone)');
    var sid = {}, pid = {};
    slots.forEach(function(s){ if(!s.id) p('every slot has an id'); if(sid[s.id]) p('slot id "' + s.id + '" is used twice'); sid[s.id] = 1; if(m.layout === 'free' && !(Array.isArray(s.box) && s.box.length === 4)) p('a free slot needs box [x%, y%, w%, h%]'); });
    pieces.forEach(function(x){ if(!x.id || !x.text) p('every piece has an id and text'); if(pid[x.id]) p('piece id "' + x.id + '" is used twice'); pid[x.id] = 1; if(plain(x.text).length > 40) p('piece "' + plain(x.text) + '" is longer than 40 characters (it must fit a phone)'); });
    if(pieces.length < slots.length) p('fewer pieces than slots');
    if(pieces.length > slots.length + 3) p('at most three distractor pieces');
    var used = {};
    slots.forEach(function(s){ var k = key[s.id]; if(!k) p('slot "' + s.id + '" has no key'); else if(!pid[k]) p('slot "' + s.id + '" is keyed to unknown piece "' + k + '"'); else if(used[k]) p('piece "' + k + '" is the key of two slots'); used[k] = 1; });
    Object.keys(key).forEach(function(k){ if(!sid[k]) p('key names unknown slot "' + k + '"'); });
    (m.slips || []).forEach(function(s){ if(!pid[s.piece] || !sid[s.slot] || !s.why) p('a slip names a piece, a slot and why'); if(key[s.slot] === s.piece) p('slip "' + s.why + '" is the right answer'); });
    if((m.layout === 'rings' || m.layout === 'sectors') && m.center && plain(m.center).length > 14) p('center label "' + m.center + '" is longer than 14 characters');
    return out;
  }

  /* placed: { slotId: pieceId }. */
  function grade(m, placed){
    placed = placed || {};
    var results = [], right = 0, slip = null, idx = {}, keyOf = {};
    m.slots.forEach(function(s, i){ idx[s.id] = i; keyOf[m.key[s.id]] = s.id; });
    m.slots.forEach(function(s, i){
      var got = placed[s.id], ok = got != null && got === m.key[s.id], why = '';
      if(ok) right++;
      else if(got == null) why = 'Nothing is placed in ' + slotName(m, i) + '.';
      else {
        var authored = (m.slips || []).filter(function(x){ return x.piece === got && x.slot === s.id; })[0];
        var home = keyOf[got];
        if(authored) why = authored.why;
        else if(home == null) why = plain(pieceText(m, got)) + ' is not part of this model.';
        else if(placed[home] === m.key[s.id]) why = plain(pieceText(m, got)) + ' and ' + plain(pieceText(m, m.key[s.id])) + ' are swapped.';
        else if(Math.abs(idx[home] - i) === 1 && m.layout !== 'free') why = plain(pieceText(m, got)) + ' is one ' + (m.unit || UNIT[m.layout]) + ' off: it belongs in ' + slotName(m, idx[home]) + '.';
        else why = plain(pieceText(m, got)) + ' belongs in ' + slotName(m, idx[home]) + ', not ' + slotName(m, i) + '.';
        if(!slip) slip = why;
      }
      results.push({ slot: s.id, piece: got == null ? null : got, ok: ok, why: why });
    });
    var total = m.slots.length, filled = m.slots.filter(function(s){ return placed[s.id] != null; }).length;
    return { valid: filled === total, correct: right === total, right: right, total: total, score: right / total, results: results, slip: slip };
  }

  /* The drawing: shapes and slot numbers only (the words are in the slot list,
     at the page's own size). */
  function artSvg(m){
    var n = m.slots.length, o = [], W = 240, H = 240, cx = 120, cy = 120;
    if(m.layout === 'rings'){
      var core = 26, step = (116 - core) / n;
      for(var i = n - 1; i >= 0; i--) o.push('<circle class="hug-model-band b' + (i % 4) + '" data-n="' + (i + 1) + '" cx="' + cx + '" cy="' + cy + '" r="' + r1(core + step * (i + 1)) + '"/>');
      o.push('<circle class="hug-model-core" cx="' + cx + '" cy="' + cy + '" r="' + core + '"/>');
      for(var j = 0; j < n; j++) o.push('<text class="hug-model-num" x="' + cx + '" y="' + r1(cy - core - step * (j + 0.5) + 5) + '" text-anchor="middle">' + (j + 1) + '</text>');
    } else if(m.layout === 'sectors'){
      for(var k = 0; k < n; k++){
        var a0 = -Math.PI / 2 + 2 * Math.PI * k / n, a1 = a0 + 2 * Math.PI / n, R = 110, am = (a0 + a1) / 2;
        o.push('<path class="hug-model-band b' + (k % 4) + '" d="M' + cx + ' ' + cy + 'L' + r1(cx + R * Math.cos(a0)) + ' ' + r1(cy + R * Math.sin(a0)) + 'A' + R + ' ' + R + ' 0 0 1 ' + r1(cx + R * Math.cos(a1)) + ' ' + r1(cy + R * Math.sin(a1)) + 'Z"/>');
        o.push('<text class="hug-model-num" x="' + r1(cx + 72 * Math.cos(am)) + '" y="' + r1(cy + 72 * Math.sin(am) + 5) + '" text-anchor="middle">' + (k + 1) + '</text>');
      }
      o.push('<circle class="hug-model-core" cx="' + cx + '" cy="' + cy + '" r="26"/>');
    } else if(m.layout === 'stages'){
      W = 60 * n + 10; H = 80;
      for(var s = 0; s < n; s++){ o.push('<rect class="hug-model-band b' + (s % 4) + '" x="' + (5 + 60 * s) + '" y="10" width="54" height="60" rx="6"/><text class="hug-model-num" x="' + (32 + 60 * s) + '" y="46" text-anchor="middle">' + (s + 1) + '</text>'); if(s < n - 1) o.push('<path class="hug-model-arrow" d="M' + (59 + 60 * s) + ' 40l6 0"/>'); }
    } else if(m.layout === 'tiers'){
      W = 240; H = 40 * n + 10;
      for(var t = 0; t < n; t++){ var inset = 18 * (n - 1 - t); o.push('<rect class="hug-model-band b' + (t % 4) + '" x="' + (5 + inset) + '" y="' + (5 + 40 * t) + '" width="' + (230 - 2 * inset) + '" height="36" rx="6"/><text class="hug-model-num" x="120" y="' + (28 + 40 * t) + '" text-anchor="middle">' + (t + 1) + '</text>'); }
    } else return '';
    return '<svg class="hug-model-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc((m.title || 'Model') + ': ' + n + ' numbered ' + (m.unit || UNIT[m.layout]) + 's' + (m.center ? ' around ' + plain(m.center) : '')) + '">' + o.join('') + '</svg>' +
      (m.center && (m.layout === 'rings' || m.layout === 'sectors') ? '<span class="hug-model-center">' + esc(m.center) + '</span>' : '');
  }

  function html(m, id, figureHtml){
    id = id || 'mdl';
    var slots = m.slots.map(function(s, i){
      var nm = esc(slotName(m, i));
      var style = m.layout === 'free' ? ' style="left:' + s.box[0] + '%;top:' + s.box[1] + '%;width:' + s.box[2] + '%;height:' + s.box[3] + '%"' : '';
      return '<li class="hug-model-row" data-slot="' + esc(s.id) + '"' + style + '><span class="hug-model-sn" id="' + id + '-sn' + i + '">' + nm + '</span><button type="button" class="hug-model-slot" data-slot="' + esc(s.id) + '" aria-describedby="' + id + '-sn' + i + '"><span class="hug-model-ph">Place here</span></button><span class="hug-model-why" aria-live="polite"></span></li>';
    }).join('');
    var pieces = m.pieces.map(function(x){ return '<button type="button" class="hug-model-piece" data-piece="' + esc(x.id) + '" aria-pressed="false">' + x.text + '</button>'; }).join('');
    var art = m.layout === 'free' ? '<div class="hug-model-fig">' + (figureHtml || '') + '<ol class="hug-model-spots">' + slots + '</ol></div>' : '<div class="hug-model-art">' + artSvg(m) + '</div>';
    return '<div class="hug-model" data-layout="' + esc(m.layout) + '" id="' + id + '">' + (m.title ? '<p class="hug-model-title">' + esc(m.title) + '</p>' : '') +
      '<div class="hug-model-grid">' + art + (m.layout === 'free' ? '' : '<ol class="hug-model-slots">' + slots + '</ol>') + '</div>' +
      '<p class="hug-small hug-model-help">Pick a piece, then the place it belongs. Drag works too. Pick a filled place to take its piece back.</p>' +
      '<div class="hug-model-tray" role="group" aria-label="Pieces to place">' + pieces + '</div></div>';
  }

  /* ---------------------------------------------------------- DOM */
  function mount(el, m, opts){
    opts = opts || {};
    var placed = {}, sel = null, locked = false;
    var q = function(s){ return el.querySelector(s); }, qa = function(s){ return [].slice.call(el.querySelectorAll(s)); };
    var tray = q('.hug-model-tray');
    function piece(id){ return el.querySelector('.hug-model-piece[data-piece="' + id + '"]'); }
    function slotBtn(id){ return el.querySelector('.hug-model-slot[data-slot="' + id + '"]'); }
    function select(id){
      sel = id;
      qa('.hug-model-piece').forEach(function(b){ var on = b.getAttribute('data-piece') === id; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('is-sel', on); });
      el.classList.toggle('has-sel', !!id);
    }
    function paint(){
      m.slots.forEach(function(s, i){
        var b = slotBtn(s.id), got = placed[s.id];
        b.innerHTML = got ? '<span class="hug-model-put">' + pieceText(m, got) + '</span>' : '<span class="hug-model-ph">Place here</span>';
        b.setAttribute('aria-label', slotName(m, i) + ': ' + (got ? plain(pieceText(m, got)) + '. Select to take it back.' : 'empty. Select to place the chosen piece.'));
        b.classList.toggle('is-filled', !!got);
      });
      var inSlots = {}; Object.keys(placed).forEach(function(k){ inSlots[placed[k]] = 1; });
      qa('.hug-model-piece').forEach(function(b){ b.hidden = !!inSlots[b.getAttribute('data-piece')]; });
      if(opts.onChange) opts.onChange(Object.assign({}, placed));
    }
    function place(slotId, pieceId){
      if(locked) return;
      Object.keys(placed).forEach(function(k){ if(placed[k] === pieceId) delete placed[k]; });
      placed[slotId] = pieceId;
      select(null); paint();
      var next = tray.querySelector('.hug-model-piece:not([hidden])');
      var sb = slotBtn(slotId); if(sb) sb.focus();
      void next;
    }
    tray.addEventListener('click', function(e){
      var b = e.target.closest('.hug-model-piece'); if(!b || locked || dragMoved) return;
      var id = b.getAttribute('data-piece'); select(sel === id ? null : id);
    });
    qa('.hug-model-slot').forEach(function(b){
      b.addEventListener('click', function(){
        if(locked) return;
        var sid = b.getAttribute('data-slot');
        if(sel) place(sid, sel);
        else if(placed[sid]){ var back = placed[sid]; delete placed[sid]; paint(); select(back); var pb = piece(back); if(pb) pb.focus(); }
      });
    });
    // Drag with a mouse or a finger (pointer events); a short press is a tap.
    var drag = null, dragMoved = false;
    tray.addEventListener('pointerdown', function(e){
      var b = e.target.closest('.hug-model-piece'); if(!b || locked) return;
      drag = { b: b, x: e.clientX, y: e.clientY, ghost: null }; dragMoved = false;
    });
    document.addEventListener('pointermove', function(e){
      if(!drag) return;
      if(!dragMoved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
      if(!dragMoved){ dragMoved = true; drag.ghost = drag.b.cloneNode(true); drag.ghost.className += ' hug-model-ghost'; drag.ghost.removeAttribute('id'); document.body.appendChild(drag.ghost); select(drag.b.getAttribute('data-piece')); }
      drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
      qa('.hug-model-slot').forEach(function(s){ s.classList.remove('is-over'); });
      var over = document.elementFromPoint(e.clientX, e.clientY), sb = over && over.closest && over.closest('.hug-model-slot');
      if(sb && el.contains(sb)) sb.classList.add('is-over');
      e.preventDefault();
    }, { passive: false });
    document.addEventListener('pointerup', function(e){
      if(!drag) return;
      var d = drag; drag = null;
      if(d.ghost){ d.ghost.remove(); qa('.hug-model-slot').forEach(function(s){ s.classList.remove('is-over'); }); }
      if(!dragMoved) return;
      var over = document.elementFromPoint(e.clientX, e.clientY), sb = over && over.closest && over.closest('.hug-model-slot');
      if(sb && el.contains(sb)) place(sb.getAttribute('data-slot'), d.b.getAttribute('data-piece'));
      setTimeout(function(){ dragMoved = false; }, 0);
    });
    paint();
    return {
      get: function(){ return Object.assign({}, placed); },
      set: function(p){ placed = Object.assign({}, p || {}); paint(); },
      reset: function(){ placed = {}; locked = false; el.classList.remove('is-locked'); select(null); paint(); qa('.hug-model-row').forEach(function(r){ r.classList.remove('pos-ok', 'pos-no'); r.querySelector('.hug-model-why').textContent = ''; }); },
      lock: function(result){
        locked = true; el.classList.add('is-locked'); select(null);
        qa('.hug-model-slot, .hug-model-piece').forEach(function(b){ b.setAttribute('aria-disabled', 'true'); });
        if(!result) return;
        result.results.forEach(function(r){
          var row = el.querySelector('.hug-model-row[data-slot="' + r.slot + '"]'); if(!row) return;
          row.classList.add(r.ok ? 'pos-ok' : 'pos-no');
          row.querySelector('.hug-model-why').textContent = r.ok ? 'In place' : r.why;
        });
      }
    };
  }

  root.ApHugModel = { LAYOUTS: LAYOUTS, check: check, grade: grade, slotName: slotName, artSvg: artSvg, html: html, mount: mount, pieceText: pieceText };
})(typeof window !== 'undefined' ? window : globalThis);
