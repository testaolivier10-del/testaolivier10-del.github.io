/* Tool kit 2: the shared pieces of a "v2" tool (docs/tools-v2-water-pollution-brief.md, flagship: AP® Environmental
   Science Water pollution). Opt in per tool: a page loads tool-kit2.css and tool-kit2.js after tool-studio.*, and
   the tool calls LevlKit2.on(s). Nothing else on the site changes behavior.

   The v2 pattern: the STAGE holds the chapters (named tabs on its top), the picture with its controls ON it, a named
   step timeline and a graph that share one cursor; the SIDE PANEL holds only the loop for the chapter: the goal (the
   studio's s.task), Predict, a live Readout and one Challenge at a time. "?" opens the reference as a sheet over
   the stage (desktop) instead of a third column.

   One look for "you can change this" (the translatable part): a white knob with a course-colour ring and an arrow
   along the way it moves (drag), or a dashed course-colour outline with a hand badge (tap); a soft pulse and a small
   "Drag" / "Tap" chip until that control is first used (once per device); the same 3 px focus ring. Every control is
   a real <input type="range"> or <button>, so keys and screen readers work: arrows, Page Up / Down, Home, End.

   API (window.LevlKit2; every builder returns { el, ... } and never moves the tool's other nodes)
   ---------------------------------------------------------------------------------------------
   K.on(s, { modes: ['explore'] })   opt the Tool Studio root in (class tk2; data-mode scopes the CSS): "?" as a sheet
                                    over the stage on a desktop; on a phone the stage keeps its natural height (scene,
                                    timeline and graph stacked, the page scrolls). Returns s.
   K.tabs({ label, items: [{ value, label, short }], value, onChange(v) }) -> { el, value(v?) }
                                    chapter tabs (role tablist, arrow keys move and select). Numbered "1 ...";
                                    short: the name a phone shows (the full one stays the accessible name).
   K.layer(host) -> { el, scale(), map(x, y) }   a layer over a picture for the controls; host is the positioned box
                                    that holds the svg. scale() = shown px per viewBox unit (the svg's own width).
   K.drag(layer, { key, label, min, max, step, value, valuetext(v), track: [x0, y0, x1, y1], onInput(v), hint,
           chip, tag(v), tagSide }) -> { el, input, value(v?, fire), place(track), hide(on) }
                                    a knob on the picture that moves along a track (viewBox units); its value is a
                                    real range input. tag(v): a short text beside the knob ("3 sacks").
   K.tap(layer, { key, label, box: [x, y, w, h], pressed, onClick, hint, chip }) -> { el, place(box), pressed(on?) }
                                    a tappable part of the picture (a button over it, aria-pressed when given).
   K.predict({ q, choices: [{ value, label }], answer, then, onPick(v) }) -> { el, picked(), settled(), note(html),
                result(held, html), reset() }   one tap before the first run; note() changes the line under the
                                    choices; result(true | false | null, html) after the run (marks answer).
   K.readout({ items: [{ k, label }] }) -> { el, set(k, { value, unit, status, tone, sub }), say(text) }
                                    two or three big numbers with a status word (tone good | warn | bad).
   K.challenges({ items: [{ id, text }], store, done: { text, action: { label, onClick } }, onShow(item) })
                -> { el, current(), met(id, html), isMet(id), body(html | node), show(id), reset() }
                                    one challenge at a time with a check mark when met, then Next challenge.
   K.timeline({ label, steps: [{ name, tone }], onPick(i) }) -> { el, set({ reached: [], current, sub: [], off: [] }),
                                    flash(i, tone) }   named steps that light as the day reaches them; a tap jumps.
   K.scrub(host, { key, label, min, max, step, value, valuetext(v), onInput(v), onStart(), rect: [x0, y0, x1, y1], chip })
                -> { el, input, value(v?, fire), place(rect, min?, max?) }   the graph's cursor: drag anywhere on
                                    the plot (or the knob, or arrow keys) and the scene follows. The knob sits
                                    14 px above the plot's top (leave about 30 px of margin there).
   K.player({ min, max, speed, get(), set(v), onEnd(), labels: { play, pause, again } })
                -> { el, toggle(), stop(), playing() }   Play / Pause on the stage (requestAnimationFrame; with
                                    reduced motion Play jumps to the end).
   K.reduced()                      motion off (site toggle or the OS setting).
   K.used(key) / K.markUsed(key)    the first-time hint store (localStorage 'tk2h:' + key). A control with a key pulses
                                    until first used; chip: false keeps the pulse but drops the "Drag" / "Tap" chip
                                    (one chip per screen reads best: give it to the first thing to touch). */
(function(){
  'use strict';
  if(window.LevlKit2) return;
  var uid = 0;
  function nid(p){ return 'tk2-' + (p || 'x') + '-' + (++uid); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function reduced(){
    try{ if(window.LevlMotion && window.LevlMotion.reduced) return !!window.LevlMotion.reduced(); return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; }
  }
  function used(k){ try{ return !!localStorage.getItem('tk2h:' + k); }catch(e){ return false; } }
  function markUsed(k){ try{ localStorage.setItem('tk2h:' + k, '1'); }catch(e){} }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  var ICON = {
    hand: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10"/><path d="M12 10V8.5a1.5 1.5 0 0 1 3 0V11"/><path d="M15 11v-1a1.5 1.5 0 0 1 3 0v4.5A6.5 6.5 0 0 1 11.5 21h-.6a5 5 0 0 1-4-2l-2.6-3.6a1.5 1.5 0 0 1 2.3-1.9L9 15.5V11"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    cross: '<path d="M7 7l10 10M17 7L7 17"/>',
    play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" stroke="none"/>',
    again: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>',
    arrows: '<path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/>'
  };
  function icon(n, cls){ return '<svg class="tk2-i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICON[n] + '</svg>'; }

  var K = { reduced: reduced, used: used, markUsed: markUsed, icon: icon, esc: esc };

  /* ------------------------------------------------------------ opt in */
  K.on = function(s){
    if(s && s.root) s.root.classList.add('tk2');
    return s;
  };

  /* ------------------------------------------------------------ chapter tabs */
  K.tabs = function(o){
    var box = el('div', 'tk2-tabs'), cur = o.value;
    box.setAttribute('role', 'tablist'); box.setAttribute('aria-label', o.label || 'Chapters'); box.setAttribute('data-ls-allchips', '');
    o.items.forEach(function(it, i){
      var b = el('button', 'tk2-tab', '<span class="tk2-tab-n" aria-hidden="true">' + (i + 1) + '</span><span class="tk2-tab-t">' + esc(it.label) + '</span>' +
        (it.short ? '<span class="tk2-tab-s" aria-hidden="true">' + esc(it.short) + '</span>' : ''));
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('data-v', it.value); b.id = nid('tab');
      if(it.controls) b.setAttribute('aria-controls', it.controls);
      box.appendChild(b);
    });
    function paint(){ box.querySelectorAll('.tk2-tab').forEach(function(b){ var on = b.getAttribute('data-v') === cur; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }); }
    function pick(v, focus){ if(v === cur) return; cur = v; paint(); if(focus){ var b = box.querySelector('[data-v="' + v + '"]'); if(b) b.focus(); } if(o.onChange) o.onChange(v); }
    box.addEventListener('click', function(e){ var b = e.target.closest('.tk2-tab'); if(b) pick(b.getAttribute('data-v')); });
    box.addEventListener('keydown', function(e){
      var tabs = [].slice.call(box.querySelectorAll('.tk2-tab')), i = tabs.indexOf(document.activeElement);
      if(i < 0) return;
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
      if(j == null) return;
      e.preventDefault(); j = (j + tabs.length) % tabs.length;
      pick(tabs[j].getAttribute('data-v'), true);
    });
    paint();
    return { el: box, value: function(v){ if(v === undefined) return cur; cur = v; paint(); } };
  };

  /* ------------------------------------------------------------ the control layer over a picture */
  K.layer = function(host){
    var L = el('div', 'tk2-layer');
    host.appendChild(L);
    function svg(){ return host.querySelector('svg'); }
    function scale(){ var s = svg(), vb = s && s.viewBox && s.viewBox.baseVal; if(!vb || !vb.width) return 1; var w = s.getBoundingClientRect().width; return w ? w / vb.width : 1; }
    return { el: L, host: host, scale: scale, map: function(x, y){ var k = scale(); return [x * k, y * k]; } };
  };
  /* The first-time chip ("Drag", "Tap") and the pulse, until the control is used once on this device. */
  function firstHint(wrap, key, text, noChip){
    if(!key || used(key)) return function(){};
    wrap.classList.add('is-new');
    var chip = null;
    if(!noChip){ chip = el('span', 'tk2-chip', icon('hand') + '<span>' + esc(text) + '</span>'); chip.setAttribute('aria-hidden', 'true'); wrap.appendChild(chip); }
    return function(){ if(!wrap.classList.contains('is-new')) return; wrap.classList.remove('is-new'); if(chip) chip.remove(); markUsed(key); };
  }

  /* ------------------------------------------------------------ a knob that drags along a track */
  K.drag = function(layer, o){
    var id = nid('dr'), step = o.step || 1, val = o.value, track = o.track;
    var w = el('div', 'tk2-drag');
    w.innerHTML = '<span class="tk2-groove" aria-hidden="true"></span>' +
      '<span class="tk2-knob" aria-hidden="true"><span class="tk2-dot">' + icon('arrows', 'tk2-ar') + '</span></span>' +
      '<span class="tk2-tag" aria-hidden="true"></span>' +
      '<input class="tk2-in" type="range" id="' + id + '" min="' + o.min + '" max="' + o.max + '" step="' + step + '" value="' + val + '" aria-label="' + esc(o.label) + '">';
    layer.el.appendChild(w);
    var inp = w.querySelector('input'), knob = w.querySelector('.tk2-knob'), groove = w.querySelector('.tk2-groove'), tag = w.querySelector('.tk2-tag');
    var done = firstHint(w, o.key, o.hint || 'Drag', o.chip === false);
    function frac(v){ return (v - o.min) / (o.max - o.min); }
    function paint(){
      var k = layer.scale(), x0 = track[0] * k, y0 = track[1] * k, x1 = track[2] * k, y1 = track[3] * k, f = frac(val);
      var x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f, len = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
      groove.style.left = x0 + 'px'; groove.style.top = y0 + 'px'; groove.style.width = len + 'px'; groove.style.transform = 'rotate(' + ang + 'deg)';
      knob.style.left = x + 'px'; knob.style.top = y + 'px';
      w.querySelector('.tk2-ar').style.transform = 'rotate(' + ang + 'deg)';
      var chip = w.querySelector('.tk2-chip'); if(chip){ chip.style.left = x + 'px'; chip.style.top = y + 'px'; }
      var vt = o.valuetext ? o.valuetext(val) : String(val);
      inp.setAttribute('aria-valuetext', vt);
      var t = o.tag ? o.tag(val) : '';
      tag.textContent = t; tag.hidden = !t;
      if(t){
        // the tag sits beside the knob, away from the track (above a level track, left of a steep one)
        var vert = Math.abs(y1 - y0) > Math.abs(x1 - x0);
        tag.style.left = x + 'px'; tag.style.top = y + 'px';
        tag.className = 'tk2-tag ' + (o.tagSide ? 'is-' + o.tagSide : vert ? 'is-left' : 'is-up');
      }
    }
    function set(v, fire){
      v = clamp(Math.round((v - o.min) / step) * step + o.min, o.min, o.max);
      v = +v.toFixed(6);
      if(v === val && !fire){ paint(); return; }
      var ch = v !== val; val = v; inp.value = v; paint();
      if(fire && ch && o.onInput) o.onInput(v);
    }
    inp.addEventListener('input', function(){ done(); set(+inp.value, true); });
    inp.addEventListener('focus', function(){ w.classList.add('is-focus'); });
    inp.addEventListener('blur', function(){ w.classList.remove('is-focus'); });
    var pid = null;
    function fromPt(e){
      var r = layer.el.getBoundingClientRect(), k = layer.scale(), px = e.clientX - r.left, py = e.clientY - r.top;
      var x0 = track[0] * k, y0 = track[1] * k, dx = track[2] * k - x0, dy = track[3] * k - y0, L2 = dx * dx + dy * dy || 1;
      var f = clamp(((px - x0) * dx + (py - y0) * dy) / L2, 0, 1);
      return o.min + f * (o.max - o.min);
    }
    function down(e){
      if(pid != null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      pid = e.pointerId; try{ e.target.setPointerCapture(pid); }catch(x){}
      e.preventDefault(); done(); w.classList.add('is-drag'); inp.focus({ preventScroll: true }); set(fromPt(e), true);
    }
    function move(e){ if(e.pointerId === pid) set(fromPt(e), true); }
    function up(e){ if(e.pointerId !== pid) return; pid = null; w.classList.remove('is-drag'); if(o.onEnd) o.onEnd(val); }
    [knob, groove].forEach(function(t){ t.addEventListener('pointerdown', down); t.addEventListener('pointermove', move); t.addEventListener('pointerup', up); t.addEventListener('pointercancel', up); });
    paint();
    return { el: w, input: inp, value: function(v, fire){ if(v === undefined) return val; set(v, fire); },
      place: function(t){ if(t) track = t; paint(); }, hide: function(on){ w.hidden = !!on; } };
  };

  /* ------------------------------------------------------------ a tappable part of the picture */
  K.tap = function(layer, o){
    var b = el('button', 'tk2-tap', '<span class="tk2-badge" aria-hidden="true">' + icon('hand') + '</span>');
    b.type = 'button'; b.setAttribute('aria-label', o.label);
    if(o.pressed != null) b.setAttribute('aria-pressed', String(!!o.pressed));
    layer.el.appendChild(b);
    var box = o.box, done = firstHint(b, o.key, o.hint || 'Tap');
    function paint(){ var k = layer.scale(); b.style.left = box[0] * k + 'px'; b.style.top = box[1] * k + 'px'; b.style.width = box[2] * k + 'px'; b.style.height = box[3] * k + 'px'; }
    b.addEventListener('click', function(){ done(); if(o.onClick) o.onClick(); });
    paint();
    return { el: b, place: function(bx){ if(bx) box = bx; paint(); }, pressed: function(on){ if(on === undefined) return b.getAttribute('aria-pressed') === 'true'; b.setAttribute('aria-pressed', String(!!on)); }, done: done };
  };

  /* ------------------------------------------------------------ predict */
  K.predict = function(o){
    var c = el('section', 'tk2-card tk2-predict'), hid = nid('pr'), pick = null, settled = false;
    c.setAttribute('aria-labelledby', hid);
    c.innerHTML = '<h3 class="tk2-k" id="' + hid + '">Predict</h3><p class="tk2-q"></p><div class="tk2-opts" role="group" data-ls-allchips></div><p class="tk2-then" hidden></p>' +
      '<p class="tk2-verdict" role="status" hidden></p>';
    var q = c.querySelector('.tk2-q'), ops = c.querySelector('.tk2-opts'), then = c.querySelector('.tk2-then'), ver = c.querySelector('.tk2-verdict');
    function build(){
      q.textContent = o.q; ops.setAttribute('aria-label', 'Your prediction');
      ops.innerHTML = o.choices.map(function(ch){ return '<button type="button" class="tk2-opt" data-v="' + esc(ch.value) + '" aria-pressed="false">' + esc(ch.label) + '</button>'; }).join('');
    }
    ops.addEventListener('click', function(e){
      var b = e.target.closest('.tk2-opt'); if(!b || settled) return;
      pick = b.getAttribute('data-v');
      ops.querySelectorAll('.tk2-opt').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
      c.classList.add('is-picked');
      if(o.then){ then.innerHTML = o.then; then.hidden = false; }
      if(o.onPick) o.onPick(pick);
    });
    build();
    return {
      el: c,
      picked: function(){ return pick; },
      note: function(html){ then.innerHTML = html; then.hidden = !html; },
      settled: function(){ return settled; },
      result: function(held, html){
        settled = true; c.classList.add('is-done'); then.hidden = true;
        ops.querySelectorAll('.tk2-opt').forEach(function(x){ x.disabled = true; x.classList.toggle('is-right', x.getAttribute('data-v') === o.answer); });
        ver.className = 'tk2-verdict ' + (held === true ? 'is-good' : held === false ? 'is-bad' : 'is-warn');
        ver.innerHTML = (held === true ? icon('check') : held === false ? icon('cross') : '') + '<span>' + html + '</span>';
        ver.hidden = false;
      },
      reset: function(nq){ if(nq) o = Object.assign({}, o, nq); pick = null; settled = false; c.classList.remove('is-picked', 'is-done'); then.hidden = true; ver.hidden = true; build(); }
    };
  };

  /* ------------------------------------------------------------ live readout */
  K.readout = function(o){
    var c = el('section', 'tk2-card tk2-read');
    c.setAttribute('aria-label', o.label || 'Live readout');
    c.innerHTML = '<h3 class="tk2-k">' + esc(o.title || 'Right now') + '</h3><div class="tk2-rows"></div><p class="tk2-sr" aria-live="polite"></p>';
    var rows = c.querySelector('.tk2-rows'), live = c.querySelector('.tk2-sr'), sayT = 0, items = {};
    function build(list){
      rows.innerHTML = ''; items = {};
      list.forEach(function(it){
        var r = el('div', 'tk2-r', '<span class="tk2-rk">' + esc(it.label) + '</span><span class="tk2-rv"><b></b><small></small></span><span class="tk2-st"></span><span class="tk2-rs"></span>');
        r.setAttribute('data-k', it.k); rows.appendChild(r); items[it.k] = r;
      });
    }
    build(o.items);
    return {
      el: c,
      items: function(list, title){ build(list); if(title) c.querySelector('.tk2-k').textContent = title; },
      set: function(k, v){
        var r = items[k]; if(!r) return;
        r.querySelector('b').textContent = v.value; r.querySelector('small').textContent = v.unit || '';
        var st = r.querySelector('.tk2-st'); st.textContent = v.status || ''; st.hidden = !v.status; st.className = 'tk2-st' + (v.tone ? ' is-' + v.tone : '');
        var sb = r.querySelector('.tk2-rs'); sb.textContent = v.sub || ''; sb.hidden = !v.sub;
        if(v.label) r.querySelector('.tk2-rk').textContent = v.label;
      },
      // polite and debounced (a scrub or a run does not flood a screen reader)
      say: function(t){ clearTimeout(sayT); sayT = setTimeout(function(){ live.textContent = t; }, 450); }
    };
  };

  /* ------------------------------------------------------------ challenges, one at a time */
  K.challenges = function(o){
    var c = el('section', 'tk2-card tk2-chal'), hid = nid('ch'), met = {}, cur = 0;
    try{ met = JSON.parse(localStorage.getItem('tk2c:' + o.store) || '{}') || {}; }catch(e){ met = {}; }
    c.setAttribute('aria-labelledby', hid);
    c.innerHTML = '<div class="tk2-chal-h"><h3 class="tk2-k" id="' + hid + '">Challenge</h3><span class="tk2-dots" aria-hidden="true"></span></div>' +
      '<p class="tk2-chal-t"></p><div class="tk2-chal-b"></div><div class="tk2-chal-ok" role="status"></div>';
    var head = c.querySelector('.tk2-k'), dots = c.querySelector('.tk2-dots'), txt = c.querySelector('.tk2-chal-t'), body = c.querySelector('.tk2-chal-b'), ok = c.querySelector('.tk2-chal-ok');
    function first(){ for(var i = 0; i < o.items.length; i++) if(!met[o.items[i].id]) return i; return -1; }
    function save(){ try{ localStorage.setItem('tk2c:' + o.store, JSON.stringify(met)); }catch(e){} }
    function paint(){
      var n = o.items.length, all = first() < 0 && cur >= n;
      dots.innerHTML = o.items.map(function(it, i){ return '<i class="' + (met[it.id] ? 'is-met' : '') + (i === cur ? ' is-cur' : '') + '"></i>'; }).join('');
      if(all){
        head.textContent = 'Challenges';
        txt.innerHTML = '<span class="tk2-alldone">' + icon('check') + '<span>' + esc(o.done && o.done.text || 'All done.') + '</span></span>';
        body.innerHTML = ''; ok.innerHTML = '';
        if(o.done && o.done.action){ var b = el('button', 'tk2-btn tk2-btn-pri', esc(o.done.action.label)); b.type = 'button'; b.addEventListener('click', o.done.action.onClick); ok.appendChild(b); }
        var again = el('button', 'tk2-link', 'Try them again'); again.type = 'button';
        again.addEventListener('click', function(){ met = {}; save(); cur = 0; paint(); show(); });
        ok.appendChild(again);
        c.classList.add('is-all'); c.classList.remove('is-met');
        return;
      }
      c.classList.remove('is-all');
      var it = o.items[cur];
      head.innerHTML = 'Challenge <span class="tk2-of">' + (cur + 1) + ' of ' + n + '</span>';
      txt.textContent = it.text;
      c.classList.toggle('is-met', !!met[it.id]);
      if(met[it.id]){
        ok.innerHTML = '<p class="tk2-ok-t">' + icon('check') + '<span>' + (met[it.id] === true ? 'Done.' : met[it.id]) + '</span></p>';
        var nx = el('button', 'tk2-btn tk2-btn-pri', cur + 1 < n ? 'Next challenge' : 'Finish'); nx.type = 'button';
        nx.addEventListener('click', function(){ var f = first(); cur = f < 0 ? n : f > cur ? f : Math.min(n, cur + 1); if(cur < n && met[o.items[cur].id]){ var g = first(); cur = g < 0 ? n : g; } paint(); show(); var t = c.querySelector('.tk2-chal-t'); if(t){ t.tabIndex = -1; t.focus({ preventScroll: true }); } });
        ok.appendChild(nx);
      } else ok.innerHTML = '';
    }
    function show(){ if(o.onShow && cur < o.items.length) o.onShow(o.items[cur]); }
    cur = first(); if(cur < 0) cur = o.items.length;
    paint();
    var api = {
      el: c,
      current: function(){ return cur < o.items.length ? o.items[cur] : null; },
      isMet: function(id){ return !!met[id]; },
      met: function(id, html){
        if(met[id]) return false;
        met[id] = html || true; save();
        var i = o.items.findIndex ? o.items.findIndex(function(x){ return x.id === id; }) : -1;
        if(i === cur){ body.innerHTML = ''; paint(); c.classList.remove('is-pop'); void c.offsetWidth; c.classList.add('is-pop'); }
        else paint();
        return true;
      },
      body: function(x){ body.innerHTML = ''; if(x == null) return body; if(typeof x === 'string') body.innerHTML = x; else body.appendChild(x); return body; },
      show: function(id){ var i = o.items.map(function(x){ return x.id; }).indexOf(id); if(i > -1){ cur = i; paint(); show(); } },
      reset: function(){ met = {}; save(); cur = 0; paint(); show(); }
    };
    setTimeout(show, 0);
    return api;
  };

  /* ------------------------------------------------------------ the named step timeline */
  K.timeline = function(o){
    var ol = el('ol', 'tk2-tl'), st = { reached: [], current: -1, sub: [], off: [] };
    ol.setAttribute('aria-label', o.label || 'Steps'); ol.setAttribute('data-ls-allchips', '');
    ol.innerHTML = o.steps.map(function(s, i){
      return '<li class="tk2-tl-i' + (s.tone ? ' is-' + s.tone : '') + '"><button type="button" class="tk2-step" data-i="' + i + '">' +
        '<span class="tk2-sn" aria-hidden="true">' + (i + 1) + '</span><span class="tk2-sm"><span class="tk2-snm">' + esc(s.name) + '</span><span class="tk2-sd"></span></span></button></li>';
    }).join('');
    var btns = [].slice.call(ol.querySelectorAll('.tk2-step'));
    ol.addEventListener('click', function(e){ var b = e.target.closest('.tk2-step'); if(b && o.onPick) o.onPick(+b.getAttribute('data-i')); });
    function paint(){
      btns.forEach(function(b, i){
        var li = b.parentNode, on = !!st.reached[i], cur = st.current === i;
        li.classList.toggle('is-on', on); li.classList.toggle('is-cur', cur);
        b.setAttribute('aria-current', cur ? 'step' : 'false');
        var sub = st.sub[i] || '';
        b.querySelector('.tk2-sd').textContent = sub;
        b.setAttribute('aria-label', (i + 1) + '. ' + o.steps[i].name + (sub ? ', ' + sub : '') + (cur ? ', now' : on ? ', reached' : ''));
        b.setAttribute('aria-disabled', String(!!st.off[i]));
      });
    }
    paint();
    return { el: ol, set: function(x){ Object.assign(st, x); paint(); },
      flash: function(i, tone){ var li = btns[i] && btns[i].parentNode; if(!li) return; li.classList.remove('is-flash-good', 'is-flash-bad'); void li.offsetWidth; li.classList.add('is-flash-' + tone); setTimeout(function(){ li.classList.remove('is-flash-' + tone); }, 1400); } };
  };

  /* ------------------------------------------------------------ the graph's scrubbable cursor */
  K.scrub = function(host, o){
    var id = nid('sc'), step = o.step || 1, val = o.value, rect = o.rect, min = o.min, max = o.max;
    var w = el('div', 'tk2-scrub');
    w.innerHTML = '<span class="tk2-hit" aria-hidden="true"></span><span class="tk2-cur" aria-hidden="true"></span>' +
      '<span class="tk2-knob tk2-sk" aria-hidden="true"><span class="tk2-dot">' + icon('arrows', 'tk2-ar') + '</span></span>' +
      '<input class="tk2-in" type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" aria-label="' + esc(o.label) + '">';
    host.appendChild(w);
    var inp = w.querySelector('input'), hit = w.querySelector('.tk2-hit'), cur = w.querySelector('.tk2-cur'), knob = w.querySelector('.tk2-knob');
    var done = firstHint(w, o.key, o.hint || 'Drag', o.chip === false);
    function sc(){ var s = host.querySelector('svg'), vb = s && s.viewBox && s.viewBox.baseVal; if(!vb || !vb.width) return 1; var ww = s.getBoundingClientRect().width; return ww ? ww / vb.width : 1; }
    function paint(){
      var k = sc(), x0 = rect[0] * k, y0 = rect[1] * k, x1 = rect[2] * k, y1 = rect[3] * k, x = x0 + (x1 - x0) * ((val - min) / (max - min || 1));
      hit.style.left = x0 - 12 + 'px'; hit.style.top = y0 + 'px'; hit.style.width = x1 - x0 + 24 + 'px'; hit.style.height = y1 - y0 + 'px';
      cur.style.left = x + 'px'; cur.style.top = y0 - 14 + 'px'; cur.style.height = y1 - y0 + 14 + 'px';
      knob.style.left = x + 'px'; knob.style.top = y0 - 14 + 'px';
      var chip = w.querySelector('.tk2-chip'); if(chip){ chip.style.left = x + 'px'; chip.style.top = y0 - 14 + 'px'; }
      inp.setAttribute('aria-valuetext', o.valuetext ? o.valuetext(val) : String(val));
    }
    function set(v, fire){
      v = clamp(Math.round((v - min) / step) * step + min, min, max); v = +v.toFixed(6);
      var ch = v !== val; val = v; inp.value = v; paint();
      if(fire && ch && o.onInput) o.onInput(v);
    }
    inp.addEventListener('input', function(){ done(); set(+inp.value, true); });
    inp.addEventListener('focus', function(){ w.classList.add('is-focus'); });
    inp.addEventListener('blur', function(){ w.classList.remove('is-focus'); });
    var pid = null;
    function fromPt(e){ var r = host.getBoundingClientRect(), k = sc(), x0 = rect[0] * k, x1 = rect[2] * k; return min + clamp((e.clientX - r.left - x0) / (x1 - x0 || 1), 0, 1) * (max - min); }
    function down(e){
      if(pid != null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      pid = e.pointerId; try{ e.target.setPointerCapture(pid); }catch(x){}
      if(e.pointerType !== 'touch') e.preventDefault();
      done(); w.classList.add('is-drag'); if(o.onStart) o.onStart(); inp.focus({ preventScroll: true }); set(fromPt(e), true);
    }
    function move(e){ if(e.pointerId === pid) set(fromPt(e), true); }
    function up(e){ if(e.pointerId !== pid) return; pid = null; w.classList.remove('is-drag'); }
    [hit, knob].forEach(function(t){ t.addEventListener('pointerdown', down); t.addEventListener('pointermove', move); t.addEventListener('pointerup', up); t.addEventListener('pointercancel', up); });
    paint();
    return { el: w, input: inp, value: function(v, fire){ if(v === undefined) return val; set(v, fire); },
      place: function(r, mn, mx){ if(r) rect = r; if(mn != null){ min = mn; inp.min = mn; } if(mx != null){ max = mx; inp.max = mx; } paint(); } };
  };

  /* ------------------------------------------------------------ Play / Pause */
  K.player = function(o){
    var L = Object.assign({ play: 'Play', pause: 'Pause', again: 'Play again' }, o.labels || {});
    var b = el('button', 'tk2-play'); b.type = 'button';
    var raf = 0, last = 0, on = false;
    function paint(){
      var end = o.get() >= o.max - 1e-9;
      b.innerHTML = icon(on ? 'pause' : end ? 'again' : 'play') + '<span>' + esc(on ? L.pause : end ? L.again : L.play) + '</span>';
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('is-on', on);
    }
    function frame(t){
      if(!on) return;
      var dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t;
      var v = Math.min(o.max, o.get() + dt * o.speed);
      o.set(v);
      if(v >= o.max){ stop(); if(o.onEnd) o.onEnd(); return; }
      raf = requestAnimationFrame(frame);
    }
    function start(){
      if(o.get() >= o.max - 1e-9) o.set(o.min);
      if(reduced()){ o.set(o.max); paint(); if(o.onEnd) o.onEnd(); return; }
      on = true; last = 0; paint(); raf = requestAnimationFrame(frame);
      if(o.onStart) o.onStart();
    }
    function stop(){ on = false; cancelAnimationFrame(raf); paint(); }
    b.addEventListener('click', function(){ if(on) stop(); else start(); });
    paint();
    return { el: b, toggle: function(){ if(on) stop(); else start(); }, stop: stop, start: start, playing: function(){ return on; }, paint: paint };
  };

  window.LevlKit2 = K;
})();
