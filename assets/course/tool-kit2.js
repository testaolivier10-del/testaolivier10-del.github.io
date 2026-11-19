/* Tool kit 2: the shared pieces of a "v2" tool (docs/tools-v2-water-pollution-brief.md, flagship: AP® Environmental
   Science Water pollution). Opt in per tool: a page loads tool-kit2.css and tool-kit2.js after tool-studio.*, and
   the tool calls LevlKit2.on(s). Nothing else on the site changes behavior.

   The v2 pattern, two modes (owner, 2026-11-16; docs/tools-v2-water-pollution-brief.md "Owner round: play vs quiz"):
   EXPLORE is for playing with it: no side panel (the stage goes full width), nothing locked or graded; compact
   chapter tabs, a one line purpose ("See how ...") with a small "Show me how" link, the picture with its controls ON
   it and labels that say what each is and how to use it ("Fertilizer: drag to add more"), Play and a thin progress
   line (K.progress: only the current step's name), one short caption that becomes a takeaway sentence when a run
   ends, and a simple graph with a plain title; at most about 35 words and 3 controls (plus the link) outside the
   picture. A skippable first-visit tour (K.tour) points at the real controls (owner round 2, 2026-11-17).
   TEST YOURSELF is where you get quizzed: one question at a time in the side panel, on the same stage (add .tk2-qs
   to the root while it is), with the hint ladder (s.hints) and the finished card (s.done). The predict, readout,
   challenge, timeline and speed pieces below are kept for tools not yet moved. "?" opens the reference as a sheet
   over the stage (desktop) instead of a third column.

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
           chip, tag(v), tagSide, quiet }) -> { el, input, value(v?, fire), place(track), hide(on) }
                                    quiet: a setting, not the thing to touch first (small plain knob, no pulse or chip;
                                    toggle .is-quiet on el to make it loud for a moment)
                                    a knob on the picture that moves along a track (viewBox units); its value is a
                                    real range input. tag(v): a short text beside the knob ("3 sacks").
   K.handle(layer, { key, label, value, min, max, step, at(v) -> [x, y], pick(x, y, v) -> v | null, dir(v) -> deg,
           keys(v, key, shift) -> v | null | undefined, valuetext(v), tag(v), tagSide(v) -> 'up' | 'down' | 'left' |
           'right', bounds(v) -> [x0, y0, x1, y1], onStart(v), onInput(v), onEnd(v), hint, chip, chipSide(v), quiet,
           beforeLabel }) -> { el, knob, value(v?, fire), grab(event), dragging(), place(), hide(on), before(v | null),
           used() }
                                    GRAPH EXPLORERS (first: AP® Calculus AB Tangent tracer). A point the student drags
                                    on the picture itself: a point on a curve, on an axis, in an inset. The tool owns
                                    the geometry: at(v) is where value v sits (picture units, the svg viewBox), pick()
                                    turns the finger's spot into a value (snap there; null keeps the old one), dir(v)
                                    turns the knob's arrow to the way it moves (a curve's direction). The knob is the
                                    kit's (white, course ring, pulse and chip until first used) and a real
                                    role="slider": arrows step, Shift and Page Up / Down ten steps, Home / End the ends;
                                    keys() replaces that (return undefined for the default). grab(e) starts a drag
                                    from the tool's own pointerdown (a press on the curve away from the knob). tag(v):
                                    a short text by the knob (bounds(): a tag above or below slides sideways to stay
                                    inside that box). before(v): a small tick where the change began, named
                                    "before" once the knob is 58 px away (never a ghost of the shape); before(null)
                                    clears it. quiet: a secondary point (small plain knob, no pulse). chipSide(v):
                                    where the first-time chip sits ('up', 'down', 'left', 'right'; default below), so it
                                    never covers the tag. used(): a control elsewhere that moves this point (a "Slide
                                    in" button) counts as its first use (the pulse and chip go).
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
   K.progress({ label, min, max, step, value, valuetext(v), onInput(v), onStart(), lowLabel, onLow(v) })
                -> { el, input, value(v?), name(t), marks([v]), low(v | null, ariaLabel) }
                                    the thin progress line under the scene (a real range: tap, drag, arrow keys) with
                                    only the current step's name above it and faint unlabeled ticks at the steps.
                                    low(): ONE derived value shown as a mark (a notch on the bar and a small labeled
                                    button under it; a tap calls onLow). A setting never moves the handle: it moves
                                    the mark.
   K.scrub(host, { key, label, min, max, step, value, valuetext(v), onInput(v), onStart(), rect: [x0, y0, x1, y1], chip, knob })
                -> { el, input, value(v?, fire), place(rect, min?, max?) }   the graph's cursor: drag anywhere on
                                    the plot (or the knob, or arrow keys) and the scene follows. The knob sits
                                    14 px above the plot's top (leave about 30 px of margin there). knob: false: no
                                    knob and no tab stop (pointer only), when another control sets the same value.
   K.player({ min, max, speed (number, or function(v) for a pace that changes), get(), set(v), onEnd(),
              stops() -> [values], hold (s), onHold(v), before() -> false to not start, labels: { play, pause, again, next, rest } })
                -> { el, toggle(), stop(), start(), playing(), paint(), rate(x), reset(), holding() }
                                    Play / Pause on the stage (requestAnimationFrame). At each stop it holds `hold`
                                    seconds (a step can be watched and read); with reduced motion each press goes to
                                    the next stop ("Next step"), then to the end.
   K.speed({ label, onChange(x) }) -> { el }    a 1x / 2x toggle (pass x to player.rate).
   K.tries({ label }) -> { el, add(key, html, tone), has(key), get(key), clear() }   the values a challenge has
                                    checked ("2 sacks: no dead zone"), so a boundary is found by committed checks,
                                    never by sweeping a control.
   K.order({ items, why(i, pos), onDone() }) -> { el, reset() }   explain back: tap the steps in order.
   predict extras: nudge(html, noFocus) (Play pressed before a prediction), fold(on) (once settled: one line and a Why
                                    button). challenges extras: done.title, onAll(), onReset(). drag extras: onEnd(v)
                                    (pointer up or a key's change), place(track, tagSide). timeline: names(list of
                                    strings or { name, short }: short is the name a phone shows under the dot),
                                    blank(on) (dots only, for an explain back). scrub: onEnd(v). challenges:
                                    done.more() -> html under the recap (first tries).
   K.tour({ key, label, steps: [{ id, text, target() }], onClose(had) }) -> { start(force), stop(), did(id), active(), place() }
                                    "Show me how" (owner round 2, every tool): 3 short callouts in order, each pointing
                                    at a real control (target() returns an element or a viewport rect), Next / Skip,
                                    Esc closes. No overlay: the page stays live, and the tool calls did(id) when the
                                    student does a step's action, so the tour moves on. Once per device on its own
                                    (localStorage 'tk2t:' + key); start(true) re-opens it (a "Show me how" link,
                                    class tk2-how, beside the purpose line, and one at the top of "?").
   K.cue(layer, { key, text, at() -> [x, y] (picture units), side })  -> { show(), hide(used), place(), active() }
                                    The ONE first-visit cue (owner round 3, every tool): a short message at the first
                                    control that names it ("Drag the fertilizer"). It sits still, never blocks, and
                                    hide(true) (the first interaction anywhere on the stage) removes it for good on
                                    this device (localStorage 'tk2c:' + key). It replaces the automatic tour; K.tour
                                    opens only from its "Show me how" link and from "?".
   tabs: big (large, filled, the first thing to notice after the picture). progress: big (a bar thick enough to grab,
                                    a 28 px thumb). player: labels({ play, again }) renames it per mode; class is-sm
                                    is the small secondary look ("Watch it happen" beside the time bar).
   K.head({ purpose, how: { label, onClick } }) -> { el, purpose(text), how }
                                    the line above the picture: what to understand (about 8 words) and, when how is
                                    given, the small "Show me how" link beside it.
   K.cause({ label }) -> { el, set(parts, pre), take(text | null), text() }
                                    THE CAUSE LINE under the picture (standard rule 4: it is clear why): the chain for
                                    this setting in a few words with arrows, live as a control moves. parts:
                                    [{ t, role, join: '+', say }]; role names the idea ("is-" + role on the pill): the
                                    tool gives each role its colour with --cz (fill) and --cz-ink (text), the same
                                    colour the idea has in the picture. pre: a tiny grey lead ("Over 60 days:").
                                    take(text): the takeaway sentence in its place (a tinted line with a bulb) until
                                    the next set(). text(): the chain as a sentence (for a live region or a label).
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
    arrows: '<path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/>',
    dot: '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>'
  };
  function icon(n, cls){ return '<svg class="tk2-i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICON[n] + '</svg>'; }

  var K = { reduced: reduced, used: used, markUsed: markUsed, icon: icon, esc: esc };

  /* ------------------------------------------------------------ opt in */
  K.on = function(s){
    if(s && s.root){ s.root.classList.add('tk2'); sheetDialog(s); }
    return s;
  };

  /* ------------------------------------------------------------ chapter tabs */
  K.tabs = function(o){
    var box = el('div', 'tk2-tabs' + (o.big ? ' is-big' : '')), cur = o.value;
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
    var w = el('div', 'tk2-drag' + (o.quiet ? ' is-quiet' : ''));
    w.innerHTML = '<span class="tk2-groove" aria-hidden="true"></span>' +
      '<span class="tk2-knob" aria-hidden="true"><span class="tk2-dot">' + icon('arrows', 'tk2-ar') + '</span></span>' +
      '<span class="tk2-tag" aria-hidden="true"></span>' +
      '<input class="tk2-in" type="range" id="' + id + '" min="' + o.min + '" max="' + o.max + '" step="' + step + '" value="' + val + '" aria-label="' + esc(o.label) + '">';
    layer.el.appendChild(w);
    var inp = w.querySelector('input'), knob = w.querySelector('.tk2-knob'), groove = w.querySelector('.tk2-groove'), tag = w.querySelector('.tk2-tag');
    var done = o.quiet ? function(){} : firstHint(w, o.key, o.hint || 'Drag', o.chip === false);
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
    // a key press or a released drag ends a change (o.onEnd: grade or record it then, not on every step of a drag)
    inp.addEventListener('change', function(){ if(pid == null && o.onEnd) o.onEnd(val); });
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
      place: function(t, side){ if(t) track = t; if(side !== undefined) o.tagSide = side; paint(); }, hide: function(on){ w.hidden = !!on; } };
  };

  /* ------------------------------------------------------------ a draggable point on a picture (graph explorers) */
  /* K.handle: a knob that sits wherever the tool says its value is (o.at(v), picture units), so it can ride a curve,
     an axis or an inset. Dragging asks the tool for the value under the finger (o.pick(x, y), picture units); the
     tool snaps or refuses (return null) as its idea needs. The knob is a real role="slider" (keys: arrows, Shift or
     Page Up / Down for ten steps, Home, End; o.keys(v, key, shift) -> value | null replaces them, for a log scale). */
  K.handle = function(layer, o){
    var val = o.value, step = o.step || 1, pid = null, mk = null;
    var w = el('div', 'tk2-handle' + (o.quiet ? ' is-quiet' : ''));
    w.innerHTML = '<span class="tk2-knob" role="slider" tabindex="0"><span class="tk2-dot">' + icon('arrows', 'tk2-ar') + '</span></span>' +
      '<span class="tk2-tag" aria-hidden="true" hidden></span><span class="tk2-before" aria-hidden="true" hidden><i></i><b></b></span>';
    layer.el.appendChild(w);
    var knob = w.querySelector('.tk2-knob'), tag = w.querySelector('.tk2-tag'), bef = w.querySelector('.tk2-before');
    knob.setAttribute('aria-label', o.label);
    if(o.min != null) knob.setAttribute('aria-valuemin', String(o.min));
    if(o.max != null) knob.setAttribute('aria-valuemax', String(o.max));
    var done = o.quiet ? function(){} : firstHint(w, o.key, o.hint || 'Drag', o.chip === false);
    function lim(v){ return clamp(v, o.min == null ? -Infinity : o.min, o.max == null ? Infinity : o.max); }
    function px(p){ var k = layer.scale(); return [p[0] * k, p[1] * k]; }
    function paint(){
      var p = o.at(val);
      if(!p || !isFinite(p[0]) || !isFinite(p[1])){ knob.style.visibility = 'hidden'; tag.hidden = true; return; }
      knob.style.visibility = '';
      var q = px(p), ang = o.dir ? o.dir(val) : 0;
      knob.style.left = q[0] + 'px'; knob.style.top = q[1] + 'px';
      w.querySelector('.tk2-ar').style.transform = 'rotate(' + (isFinite(ang) ? ang : 0) + 'deg)';
      var chip = w.querySelector('.tk2-chip'); if(chip){ chip.style.left = q[0] + 'px'; chip.style.top = q[1] + 'px'; if(o.chipSide) chip.className = 'tk2-chip is-' + (o.chipSide(val) || 'down'); }
      knob.setAttribute('aria-valuenow', String(+(+val).toFixed(6)));
      knob.setAttribute('aria-valuetext', o.valuetext ? o.valuetext(val) : String(val));
      var t = o.tag ? o.tag(val) : '';
      tag.textContent = t || ''; tag.hidden = !t;
      if(t){
        var side = (o.tagSide && o.tagSide(val)) || 'up';
        tag.style.left = q[0] + 'px'; tag.style.top = q[1] + 'px'; tag.className = 'tk2-tag is-' + side; tag.style.marginLeft = '';
        // o.bounds(v) -> [x0, y0, x1, y1] (picture units): a tag above or below the knob slides sideways to stay inside
        var bd = o.bounds && (side === 'up' || side === 'down') ? o.bounds(val) : null;
        if(bd){ var k = layer.scale(), tw = tag.offsetWidth, l = q[0] - tw / 2, r = q[0] + tw / 2, dx = l < bd[0] * k ? bd[0] * k - l : r > bd[2] * k ? bd[2] * k - r : 0; if(dx) tag.style.marginLeft = dx.toFixed(1) + 'px'; }
      }
      paintMark();
    }
    // the "before" tick: where the value was when this change began (a mark, never a moved handle)
    function paintMark(){
      if(mk == null){ bef.hidden = true; return; }
      var p = o.at(mk), q0 = o.at(val);
      if(!p || !isFinite(p[0]) || !isFinite(p[1])){ bef.hidden = true; return; }
      var a = px(p), b = q0 ? px(q0) : a, far = Math.hypot(a[0] - b[0], a[1] - b[1]);
      bef.hidden = far < 18;
      bef.style.left = a[0] + 'px'; bef.style.top = a[1] + 'px';
      bef.querySelector('i').style.transform = 'rotate(' + ((o.dir ? o.dir(mk) : 0) + 90) + 'deg)';
      var lb = bef.querySelector('b'); lb.textContent = o.beforeLabel || 'before'; lb.hidden = far < 58;
    }
    function set(v, fire){
      if(v == null || !isFinite(v)){ paint(); return; }
      v = lim(+(+v).toFixed(9));
      var ch = v !== val; val = v; paint();
      if(fire && ch && o.onInput) o.onInput(v);
    }
    function local(e){ var r = layer.el.getBoundingClientRect(), k = layer.scale() || 1; return [(e.clientX - r.left) / k, (e.clientY - r.top) / k]; }
    function down(e){
      if(pid != null || (e.pointerType === 'mouse' && e.button !== 0)) return false;
      pid = e.pointerId; try{ knob.setPointerCapture(pid); }catch(x){}
      e.preventDefault(); done(); w.classList.add('is-drag');
      try{ knob.focus({ preventScroll: true }); }catch(x){}
      if(o.onStart) o.onStart(val);
      return true;
    }
    function move(e){ if(e.pointerId !== pid) return; var p = local(e); set(o.pick(p[0], p[1], val), true); }
    function up(e){ if(e.pointerId !== pid) return; pid = null; w.classList.remove('is-drag'); if(o.onEnd) o.onEnd(val); }
    knob.addEventListener('pointerdown', function(e){ if(down(e)) move(e); });
    knob.addEventListener('pointermove', move); knob.addEventListener('pointerup', up); knob.addEventListener('pointercancel', up);
    knob.addEventListener('lostpointercapture', function(e){ if(e.pointerId === pid) up(e); });
    knob.addEventListener('keydown', function(e){
      var k = e.key, big = e.shiftKey, to = null;
      if(o.keys) to = o.keys(val, k, big);
      if(to === undefined || (to === null && !o.keys)){
        if(k === 'ArrowRight' || k === 'ArrowUp') to = val + step * (big ? 10 : 1);
        else if(k === 'ArrowLeft' || k === 'ArrowDown') to = val - step * (big ? 10 : 1);
        else if(k === 'PageUp') to = val + step * 10; else if(k === 'PageDown') to = val - step * 10;
        else if(k === 'Home' && o.min != null) to = o.min; else if(k === 'End' && o.max != null) to = o.max;
      }
      if(to == null) return;
      e.preventDefault(); done();
      if(o.onStart) o.onStart(val);
      set(to, true);
      if(o.onEnd) o.onEnd(val);
    });
    knob.addEventListener('focus', function(){ w.classList.add('is-focus'); });
    knob.addEventListener('blur', function(){ w.classList.remove('is-focus'); });
    paint();
    return { el: w, knob: knob,
      value: function(v, fire){ if(v === undefined) return val; set(v, fire); },
      // grab(e): a press elsewhere on the picture (the tool decided it is near enough) starts a drag of this knob
      grab: function(e){ if(down(e)) move(e); },
      dragging: function(){ return pid != null; },
      place: paint, hide: function(on){ w.hidden = !!on; },
      before: function(v){ mk = v == null ? null : v; paintMark(); },
      used: function(){ done(); } };
  };

  /* ------------------------------------------------------------ a tappable part of the picture */
  K.tap = function(layer, o){
    var b = el('button', 'tk2-tap', '<span class="tk2-badge" aria-hidden="true">' + icon('hand') + '</span>');
    b.type = 'button'; b.setAttribute('aria-label', o.label);
    if(o.pressed != null) b.setAttribute('aria-pressed', String(!!o.pressed));
    layer.el.appendChild(b);
    var box = o.box, done = firstHint(b, o.key, o.hint || 'Tap', o.chip === false);
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
      '<p class="tk2-sum" hidden></p><p class="tk2-verdict" role="status" hidden></p>';
    var q = c.querySelector('.tk2-q'), ops = c.querySelector('.tk2-opts'), then = c.querySelector('.tk2-then'), ver = c.querySelector('.tk2-verdict'), sum = c.querySelector('.tk2-sum'), sumB = null, folded = false, heldV = null;
    // fold(true): once settled, only the one line "You predicted: ... Held." with a Why button (keeps the panel short)
    function fold(on){ folded = !!on; c.classList.toggle('is-fold', folded && settled); if(sumB){ sumB.setAttribute('aria-expanded', String(!folded)); sumB.textContent = folded ? 'Why' : 'Hide why'; } }
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
      // once settled the card folds to "You predicted: ..." and the verdict (the question and choices step aside)
      result: function(held, html){
        settled = true; c.classList.add('is-done'); then.hidden = true;
        var pk = o.choices.filter(function(ch){ return String(ch.value) === String(pick); })[0];
        heldV = held;
        sum.innerHTML = (pk ? 'You predicted: <b>' + esc(pk.label) + '</b>' : 'No prediction made') + '<span class="tk2-sum-v">' + (held === true ? '. Held.' : held === false ? '. Not quite.' : pk ? '.' : '') + '</span>' +
          ' <button type="button" class="tk2-link tk2-sum-b" aria-expanded="true">Hide why</button>';
        sum.hidden = false; sumB = sum.querySelector('.tk2-sum-b'); sumB.addEventListener('click', function(){ fold(!c.classList.contains('is-fold')); });
        c.classList.toggle('is-fold', folded);
        sumB.setAttribute('aria-expanded', String(!folded)); sumB.textContent = folded ? 'Why' : 'Hide why';
        ops.querySelectorAll('.tk2-opt').forEach(function(x){ x.disabled = true; x.classList.toggle('is-right', x.getAttribute('data-v') === o.answer); });
        ver.className = 'tk2-verdict ' + (held === true ? 'is-good' : held === false ? 'is-bad' : 'is-warn');
        ver.innerHTML = (held === true ? icon('check') : held === false ? icon('cross') : '') + '<span>' + html + '</span>';
        ver.hidden = false;
      },
      fold: fold,
      reset: function(nq){ if(nq) o = Object.assign({}, o, nq); pick = null; settled = false; folded = false; c.classList.remove('is-picked', 'is-done', 'is-fold'); then.hidden = true; ver.hidden = true; sum.hidden = true; build(); },
      // draw the eye to the choices (Play pressed before a prediction): a short pulse and focus on the first choice
      // noFocus: the student is told next to the control they used (focus stays there)
      nudge: function(html, noFocus){ if(html){ then.innerHTML = html; then.hidden = false; } c.classList.remove('is-nudge'); void c.offsetWidth; c.classList.add('is-nudge'); var f = ops.querySelector('.tk2-opt'); if(f && !noFocus) try{ f.focus({ preventScroll: true }); }catch(e){} }
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
    c.setAttribute('data-ls-allchips', '');
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
        txt.innerHTML = '<span class="tk2-alldone">' + icon('check') + '<span>' + (o.done && o.done.title ? '<b>' + esc(o.done.title) + '</b> ' : '') + esc(o.done && o.done.text || 'All done.') + '</span></span>';
        if(o.done && o.done.more){ var mo = o.done.more(); if(mo) txt.insertAdjacentHTML('beforeend', '<span class="tk2-more">' + mo + '</span>'); }
        if(o.onAll) setTimeout(o.onAll, 0);
        body.innerHTML = ''; ok.innerHTML = '';
        if(o.done && o.done.action){ var b = el('button', 'tk2-btn tk2-btn-pri', esc(o.done.action.label)); b.type = 'button'; b.addEventListener('click', o.done.action.onClick); ok.appendChild(b); }
        var again = el('button', 'tk2-link', 'Try them again'); again.type = 'button';
        again.addEventListener('click', function(){ met = {}; save(); cur = 0; if(o.onReset) o.onReset(); paint(); show(); });
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
    function show(){ if(o.onShow && cur < o.items.length) o.onShow(o.items[cur]); fit(); }
    // keep the card's foot (its answer or Next button) in view when the side panel scrolls on its own (never the page)
    var ready = false;
    function fit(){
      if(!ready || c.hidden || !c.offsetParent) return;
      var sc = c.closest('.ls-dock'); if(!sc || sc.scrollHeight <= sc.clientHeight + 2) return;
      setTimeout(function(){ var r = c.getBoundingClientRect(), R = sc.getBoundingClientRect(); if(r.bottom > R.bottom) sc.scrollTop += Math.min(r.bottom - R.bottom + 10, r.top - R.top); }, 30);
    }
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
        if(i === cur){
          // the answer's buttons go with the body: if focus was in the card (or already lost), it moves to the
          // success line, so a keyboard or screen reader user stays here (Tab then reaches Next challenge)
          var ae = document.activeElement, had = !ae || ae === document.body || c.contains(ae);
          body.innerHTML = ''; paint(); c.classList.remove('is-pop'); void c.offsetWidth; c.classList.add('is-pop'); fit();
          var okt = ok.querySelector('.tk2-ok-t');
          if(had && okt){ okt.tabIndex = -1; try{ okt.focus({ preventScroll: true }); }catch(e){} }
        }
        else paint();
        return true;
      },
      body: function(x){ body.innerHTML = ''; if(x == null) return body; if(typeof x === 'string') body.innerHTML = x; else body.appendChild(x); return body; },
      show: function(id){ var i = o.items.map(function(x){ return x.id; }).indexOf(id); if(i > -1){ cur = i; paint(); show(); } },
      reset: function(){ met = {}; save(); cur = 0; if(o.onReset) o.onReset(); paint(); show(); }
    };
    setTimeout(function(){ show(); ready = true; }, 0);
    return api;
  };

  /* ------------------------------------------------------------ the named step timeline */
  K.timeline = function(o){
    var ol = el('ol', 'tk2-tl'), st = { reached: [], current: -1, sub: [], off: [] };
    ol.setAttribute('aria-label', o.label || 'Steps'); ol.setAttribute('data-ls-allchips', '');
    ol.innerHTML = o.steps.map(function(s, i){
      return '<li class="tk2-tl-i' + (s.tone ? ' is-' + s.tone : '') + '"><button type="button" class="tk2-step" data-i="' + i + '">' +
        '<span class="tk2-sn" aria-hidden="true">' + (i + 1) + '</span><span class="tk2-sm"><span class="tk2-snm">' + esc(s.name) + '</span><span class="tk2-sd"></span></span>' +
        '<span class="tk2-sns" aria-hidden="true">' + esc(s.short || s.name) + '</span></button></li>';
    }).join('');
    var btns = [].slice.call(ol.querySelectorAll('.tk2-step'));
    ol.addEventListener('click', function(e){ var b = e.target.closest('.tk2-step'); if(b && o.onPick) o.onPick(+b.getAttribute('data-i')); });
    function paint(){
      ol.classList.toggle('is-blank', !!st.blank);
      btns.forEach(function(b, i){
        var li = b.parentNode, on = !!st.reached[i], cur = st.current === i;
        li.classList.toggle('is-on', on); li.classList.toggle('is-cur', cur);
        b.setAttribute('aria-current', cur ? 'step' : 'false');
        var sub = st.sub[i] || '';
        b.querySelector('.tk2-sd').textContent = sub;
        b.setAttribute('aria-label', st.blank ? 'Step ' + (i + 1) : (i + 1) + '. ' + o.steps[i].name + (sub ? ', ' + sub : '') + (cur ? ', now' : on ? ', reached' : ''));
        b.setAttribute('aria-disabled', String(!!st.off[i]));
      });
    }
    paint();
    return { el: ol, set: function(x){ Object.assign(st, x); paint(); },
      // names(list): strings, or { name, short } (short: the name a phone shows under the dot)
      names: function(list){ list.forEach(function(n, i){ var nm = typeof n === 'string' ? n : n.name, sh = typeof n === 'string' ? n : (n.short || n.name); o.steps[i].name = nm; o.steps[i].short = sh; var b = btns[i]; if(b){ b.querySelector('.tk2-snm').textContent = nm; b.querySelector('.tk2-sns').textContent = sh; } }); paint(); },
      blank: function(on){ st.blank = !!on; paint(); },
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
    // knob: false: no knob and no tab stop (pointer only), for a graph whose value another control already sets
    if(o.knob === false){ w.classList.add('is-bare'); knob.hidden = true; inp.tabIndex = -1; inp.setAttribute('aria-hidden', 'true'); }
    var done = o.knob === false ? function(){} : firstHint(w, o.key, o.hint || 'Drag', o.chip === false);
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
    function up(e){ if(e.pointerId !== pid) return; pid = null; w.classList.remove('is-drag'); if(o.onEnd) o.onEnd(val); }
    inp.addEventListener('change', function(){ if(pid == null && o.onEnd) o.onEnd(val); });
    [hit, knob].forEach(function(t){ t.addEventListener('pointerdown', down); t.addEventListener('pointermove', move); t.addEventListener('pointerup', up); t.addEventListener('pointercancel', up); });
    paint();
    return { el: w, input: inp, value: function(v, fire){ if(v === undefined) return val; set(v, fire); },
      place: function(r, mn, mx){ if(r) rect = r; if(mn != null){ min = mn; inp.min = mn; } if(mx != null){ max = mx; inp.max = mx; } paint(); } };
  };


  /* ------------------------------------------------------------ the thin progress line (Explore) */
  /* K.progress({ label, min, max, step, value, valuetext(v), onInput(v), onStart() }) -> { el, input, value(v?), name(text), marks(list) }
     One thin line under the scene: a real range input (tap or drag anywhere on it, or arrow keys), the part played
     filled in, faint unlabeled ticks at the steps (marks), and ONLY the current step's name above it. */
  K.progress = function(o){
    var id = nid('pg'), w = el('div', 'tk2-prog' + (o.big ? ' is-big' : '')), val = o.value, min = o.min, max = o.max;
    w.innerHTML = '<span class="tk2-prog-n" aria-hidden="true"></span><span class="tk2-prog-l"><span class="tk2-prog-t" aria-hidden="true"><i class="tk2-prog-f"></i></span>' +
      '<input class="tk2-prog-in" type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + (o.step || 'any') + '" value="' + val + '" aria-label="' + esc(o.label || 'Progress') + '"></span>';
    var inp = w.querySelector('input'), fill = w.querySelector('.tk2-prog-f'), nm = w.querySelector('.tk2-prog-n'), track = w.querySelector('.tk2-prog-t');
    var lowB = null, lowM = null, lowV = null;
    function paint(){ var f = clamp((val - min) / (max - min || 1), 0, 1); fill.style.width = (f * 100).toFixed(2) + '%'; w.style.setProperty('--tk2-f', f.toFixed(4)); inp.setAttribute('aria-valuetext', o.valuetext ? o.valuetext(val) : String(val)); }
    inp.addEventListener('pointerdown', function(){ if(o.onStart) o.onStart(); });
    inp.addEventListener('keydown', function(){ if(o.onStart) o.onStart(); });
    inp.addEventListener('input', function(){ val = +inp.value; paint(); if(o.onInput) o.onInput(val); });
    paint();
    return { el: w, input: inp,
      value: function(v){ if(v === undefined) return val; val = clamp(v, min, max); inp.value = val; paint(); },
      name: function(t){ if(nm.textContent !== (t || '')) nm.textContent = t || ''; },
      marks: function(list){ track.querySelectorAll('.tk2-prog-m').forEach(function(m){ m.remove(); }); (list || []).forEach(function(v){ var m = el('b', 'tk2-prog-m'); m.style.left = (clamp((v - min) / (max - min || 1), 0, 1) * 100).toFixed(2) + '%'; track.appendChild(m); }); },
      /* low(v, ariaLabel): a derived value (say the day of a run's lowest point) as a mark, never by moving the handle:
         a notch on the bar and, under it, a small real button with a tiny label (o.lowLabel); a tap calls o.onLow(v).
         low(null) removes it. Both sit where the thumb's center is at v (the thumb stops half its width from each end). */
      low: function(v, aria){
        if(v == null){ if(lowB){ lowB.hidden = true; lowM.hidden = true; } lowV = null; w.classList.remove('has-low'); return; }
        if(!lowB){
          lowM = el('b', 'tk2-prog-lm'); lowM.setAttribute('aria-hidden', 'true'); track.parentNode.insertBefore(lowM, inp);
          lowB = el('button', 'tk2-prog-low'); lowB.type = 'button';
          lowB.innerHTML = '<i aria-hidden="true"></i><span aria-hidden="true">' + esc(o.lowLabel || 'lowest') + '</span>';
          lowB.addEventListener('click', function(){ if(lowV != null && o.onLow) o.onLow(lowV); });
          track.parentNode.appendChild(lowB);
        }
        if(v !== lowV || lowB.hidden){
          lowV = v; lowB.hidden = false; lowM.hidden = false; w.classList.add('has-low');
          var f = clamp((v - min) / (max - min || 1), 0, 1).toFixed(4);
          lowB.style.setProperty('--tk2-lf', f); lowM.style.setProperty('--tk2-lf', f);
        }
        if(aria && lowB.getAttribute('aria-label') !== aria) lowB.setAttribute('aria-label', aria);
      } };
  };

  /* ------------------------------------------------------------ Play / Pause */
  K.player = function(o){
    var L = Object.assign({ play: 'Play', pause: 'Pause', again: 'Play again', next: 'Next step', rest: 'To the end' }, o.labels || {});
    var b = el('button', 'tk2-play'); b.type = 'button';
    var raf = 0, last = 0, on = false, rate = 1, holdLeft = 0, held = null;
    function stops(){ return (o.stops ? o.stops() : []).filter(function(x){ return x != null && x > o.min && x < o.max; }).sort(function(a, c){ return a - c; }); }
    function speedAt(v){ return typeof o.speed === 'function' ? o.speed(v) : o.speed; }
    function paint(){
      var end = o.get() >= o.max - 1e-9, step = reduced() && stops().some(function(x){ return x > o.get() + 1e-6; });
      b.innerHTML = icon(on ? 'pause' : end ? 'again' : 'play') + '<span>' + esc(on ? L.pause : end ? L.again : reduced() && o.get() > o.min ? (step ? L.next : L.rest) : L.play) + '</span>';
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('is-on', on);
    }
    function frame(t){
      if(!on) return;
      var dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t;
      if(holdLeft > 0){ holdLeft -= dt * rate; raf = requestAnimationFrame(frame); return; }
      var v0 = o.get(), v = Math.min(o.max, v0 + dt * speedAt(v0) * rate);
      // a step on the way: stop there and hold it (o.hold seconds), so it can be watched and read
      var st = stops().filter(function(x){ return x > v0 + 1e-6 && x <= v && x !== held; })[0];
      if(st != null){ v = st; held = st; holdLeft = o.hold || 0; if(o.onHold) o.onHold(st); }
      o.set(v);
      if(v >= o.max){ stop(); if(o.onEnd) o.onEnd(); return; }
      raf = requestAnimationFrame(frame);
    }
    function start(){
      if(o.before && o.before() === false) return;
      if(o.get() >= o.max - 1e-9){ o.set(o.min); held = null; }
      if(reduced()){
        // no motion: each press goes to the next step and stays there
        var nx = stops().filter(function(x){ return x > o.get() + 1e-6; })[0];
        o.set(nx != null ? nx : o.max); if(nx != null && o.onHold) o.onHold(nx);
        paint(); if(nx == null && o.onEnd) o.onEnd(); return;
      }
      on = true; last = 0; holdLeft = 0; paint(); raf = requestAnimationFrame(frame);
      if(o.onStart) o.onStart();
    }
    function stop(){ on = false; cancelAnimationFrame(raf); paint(); }
    b.addEventListener('click', function(){ if(on) stop(); else start(); });
    paint();
    return { el: b, toggle: function(){ if(on) stop(); else start(); }, stop: stop, start: start, playing: function(){ return on; }, paint: paint,
      rate: function(x){ if(x === undefined) return rate; rate = x; }, reset: function(){ held = null; holdLeft = 0; },
      labels: function(x){ Object.assign(L, x || {}); paint(); },
      holding: function(){ return on && holdLeft > 0 ? held : null; } };
  };

  /* ------------------------------------------------------------ speed toggle (1x / 2x) */
  K.speed = function(o){
    var b = el('button', 'tk2-speed', '1×'); b.type = 'button';
    b.setAttribute('aria-label', o.label || 'Faster'); b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function(){ var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '2×' : '1×'; if(o.onChange) o.onChange(on ? 2 : 1); });
    return { el: b };
  };

  /* ------------------------------------------------------------ values tried (a challenge's committed checks) */
  K.tries = function(o){
    var ul = el('ul', 'tk2-tries'), list = [];
    ul.setAttribute('aria-label', (o && o.label) || 'Tried so far');
    function paint(){ ul.innerHTML = list.map(function(x){ return '<li class="is-' + (x.tone || 'info') + '">' + icon(x.tone === 'bad' ? 'cross' : x.tone === 'good' ? 'check' : 'dot') + '<span>' + x.html + '</span></li>'; }).join(''); ul.hidden = !list.length; }
    paint();
    return { el: ul,
      add: function(key, html, tone){ list = list.filter(function(x){ return x.key !== key; }); list.push({ key: key, html: html, tone: tone }); list.sort(function(a, b){ return (a.sort || 0) - (b.sort || 0); }); paint(); },
      has: function(key){ return list.some(function(x){ return x.key === key; }); },
      get: function(key){ return list.filter(function(x){ return x.key === key; })[0] || null; },
      clear: function(){ list = []; paint(); }, paint: paint };
  };

  /* ------------------------------------------------------------ explain back: put the steps in order */
  K.order = function(o){
    var box = el('div', 'tk2-order'), got = [], order = o.items.map(function(x, i){ return i; });
    // a fixed shuffle that is never already in order
    for(var i = order.length - 1; i > 0; i--){ var j = (i * 7 + 3) % (i + 1), t = order[i]; order[i] = order[j]; order[j] = t; }
    if(order.every(function(x, i){ return x === i; })) order.reverse();
    box.innerHTML = '<ol class="tk2-ord-got" aria-label="Your order"></ol><div class="tk2-ord-pool" role="group" aria-label="Tap the next step" data-ls-allchips></div><p class="tk2-ord-fb" role="status"></p>';
    var gotEl = box.querySelector('.tk2-ord-got'), pool = box.querySelector('.tk2-ord-pool'), fb = box.querySelector('.tk2-ord-fb');
    function paint(){
      gotEl.innerHTML = got.map(function(i){ return '<li>' + esc(o.items[i]) + '</li>'; }).join('') + (got.length < o.items.length ? '<li class="is-next" aria-hidden="true">?</li>' : '');
      pool.innerHTML = order.filter(function(i){ return got.indexOf(i) < 0; }).map(function(i){ return '<button type="button" class="tk2-btn tk2-ord-b" data-i="' + i + '">' + esc(o.items[i]) + '</button>'; }).join('');
    }
    pool.addEventListener('click', function(e){
      var b = e.target.closest('.tk2-ord-b'); if(!b) return;
      var i = +b.getAttribute('data-i');
      if(i === got.length){ got.push(i); fb.textContent = ''; paint(); var f = pool.querySelector('button'); if(f) f.focus(); if(got.length === o.items.length && o.onDone) o.onDone(); }
      else { fb.textContent = o.why ? o.why(i, got.length) : 'Not next. What has to happen first?'; b.classList.remove('is-no'); void b.offsetWidth; b.classList.add('is-no'); }
    });
    paint();
    return { el: box, reset: function(){ got = []; fb.textContent = ''; paint(); } };
  };

  /* ------------------------------------------------------------ "Show me how": a skippable first-visit tour */
  /* K.tour({ key, label, steps: [{ id, text, target() -> Element | { left, top, width, height } (viewport px) }],
             onClose() }) -> { start(force), stop(), did(id), active() }
     Small callouts, one at a time, each pointing at a real control (owner round 2, 2026-11-16: every tool). It never
     blocks: there is no overlay, the page stays live, and when the student does the step's action the tool calls
     did(id) and the tour moves on (or closes after the last). Next / Skip on each callout; Esc closes it. Shown once
     per device on its own (localStorage 'tk2t:' + key, set the moment it shows); start(true) re-opens it (the tool's
     "Show me how" link, the "?" sheet). A tour that starts on its own does not move focus; one the student opened
     focuses its Next button. */
  K.tour = function(o){
    var cur = -1, box = null, ring = null, raf = 0, timer = 0, manual = false;
    function seen(){ try{ return !!localStorage.getItem('tk2t:' + o.key); }catch(e){ return false; } }
    function mark(){ try{ localStorage.setItem('tk2t:' + o.key, '1'); }catch(e){} }
    function rectOf(t){
      if(!t) return null;
      if(t.getBoundingClientRect){ if(t.offsetParent === null && t.getClientRects().length === 0) return null; var r = t.getBoundingClientRect(); return r.width || r.height ? r : null; }
      return t;
    }
    function build(){
      box = el('div', 'tk2-tour');
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', o.label || 'Show me how');
      box.innerHTML = '<span class="tk2-tour-ar" aria-hidden="true"></span><p class="tk2-tour-n"></p><p class="tk2-tour-t" aria-live="polite"></p>' +
        '<div class="tk2-tour-b"><button type="button" class="tk2-tour-skip">Skip</button><button type="button" class="tk2-tour-next"></button></div>';
      ring = el('div', 'tk2-tour-ring'); ring.setAttribute('aria-hidden', 'true');
      document.body.appendChild(ring); document.body.appendChild(box);
      box.querySelector('.tk2-tour-skip').addEventListener('click', function(){ stop(); });
      box.querySelector('.tk2-tour-next').addEventListener('click', function(){ go(cur + 1, true); });
      box.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ e.stopPropagation(); stop(true); } });
    }
    function place(){
      raf = 0;
      if(cur < 0 || !box) return;
      var st = o.steps[cur], r = rectOf(st.target());
      if(!r){ box.style.visibility = 'hidden'; ring.style.visibility = 'hidden'; return; }
      box.style.visibility = ''; ring.style.visibility = '';
      var vw = document.documentElement.clientWidth, vh = window.innerHeight, pad = 6;
      ring.style.left = (r.left - pad) + 'px'; ring.style.top = (r.top - pad) + 'px'; ring.style.width = (r.width + pad * 2) + 'px'; ring.style.height = (r.height + pad * 2) + 'px';
      var bw = box.offsetWidth, bh = box.offsetHeight, gap = 14, below = vh - r.bottom, above = r.top;
      var side = below >= bh + gap + 8 || below >= above ? 'below' : 'above';
      var top = side === 'below' ? r.bottom + gap : r.top - gap - bh;
      top = clamp(top, 8, Math.max(8, vh - bh - 8));
      var cx = r.left + r.width / 2, left = clamp(cx - bw / 2, 8, Math.max(8, vw - bw - 8));
      box.style.left = left + 'px'; box.style.top = top + 'px';
      box.setAttribute('data-side', side);
      box.querySelector('.tk2-tour-ar').style.left = clamp(cx - left, 18, bw - 18) + 'px';
    }
    function later(){ if(!raf) raf = requestAnimationFrame(place); }
    function go(i, byNext){
      clearTimeout(timer);
      if(i >= o.steps.length){ stop(); return; }
      cur = i;
      if(!box) build();
      var st = o.steps[i], last = i === o.steps.length - 1;
      box.querySelector('.tk2-tour-n').textContent = 'Show me how: ' + (i + 1) + ' of ' + o.steps.length;
      box.querySelector('.tk2-tour-t').textContent = st.text;
      box.querySelector('.tk2-tour-next').textContent = last ? 'Done' : 'Next';
      box.querySelector('.tk2-tour-skip').hidden = last;
      // bring the target into view when the student moved the tour on (never on its own first show)
      var t = st.target();
      if((byNext || manual) && t && t.scrollIntoView && t.getBoundingClientRect){ var r = t.getBoundingClientRect(); if(r.top < 0 || r.bottom > window.innerHeight) t.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); }
      place(); setTimeout(place, 320);
      if(byNext || manual){ var nb = box.querySelector('.tk2-tour-next'); try{ nb.focus({ preventScroll: true }); }catch(e){} }
    }
    function stop(keyed){
      clearTimeout(timer);
      if(cur < 0) return;
      var had = box && box.contains(document.activeElement);
      cur = -1;
      if(box){ box.remove(); ring.remove(); box = null; ring = null; }
      window.removeEventListener('resize', later); window.removeEventListener('scroll', later, true);
      document.removeEventListener('keydown', esc_);
      if(o.onClose) o.onClose(had || keyed);
    }
    function esc_(e){ if(e.key === 'Escape' && cur >= 0 && !document.querySelector('.ls-root.is-sheet')) stop(); }
    function start(force){
      if(!force && seen()) return false;
      mark(); manual = !!force;
      window.addEventListener('resize', later); window.addEventListener('scroll', later, true);
      document.addEventListener('keydown', esc_);
      go(0, false);
      return true;
    }
    return { start: start, stop: function(){ stop(); }, active: function(){ return cur >= 0; }, place: later,
      // the student did a step's action: move on after a beat (so the result can be seen first)
      did: function(id){ if(cur < 0) return; var k = -1; o.steps.forEach(function(s, i){ if(s.id === id && i >= cur) k = k < 0 ? i : k; }); if(k < 0) return; clearTimeout(timer); timer = setTimeout(function(){ go(k + 1, false); }, 900); } };
  };

  /* ------------------------------------------------------------ the one first-visit cue */
  K.cue = function(layer, o){
    var b = null, on = false;
    function seen(){ try{ return !!localStorage.getItem('tk2c:' + o.key); }catch(e){ return false; } }
    function place(){
      if(!b) return;
      var p = o.at(), k = layer.scale();
      b.style.left = (p[0] * k) + 'px'; b.style.top = (p[1] * k) + 'px';
      // keep the bubble inside the picture: slide it along its arrow when it would stick out
      b.style.setProperty('--tk2-cue-dx', '0px');
      var r = b.getBoundingClientRect(), h = layer.el.getBoundingClientRect(), dx = r.left < h.left + 4 ? h.left + 4 - r.left : r.right > h.right - 4 ? h.right - 4 - r.right : 0;
      b.style.setProperty('--tk2-cue-dx', dx.toFixed(1) + 'px');
    }
    function show(){
      if(on || seen()) return false;
      b = el('div', 'tk2-cue is-' + (o.side || 'below'), '<span class="tk2-cue-ar"></span>' + icon('hand') + '<span>' + esc(o.text) + '</span>');
      b.setAttribute('aria-hidden', 'true');
      layer.el.appendChild(b); on = true; place();
      return true;
    }
    function hide(usedIt){
      if(usedIt && on) try{ localStorage.setItem('tk2c:' + o.key, '1'); }catch(e){}
      if(b){ b.remove(); b = null; }
      on = false;
    }
    return { show: show, hide: hide, place: place, active: function(){ return on; } };
  };

  /* ------------------------------------------------------------ "?" as a real dialog (K.on) */
  function sheetDialog(s){
    var sheet = s.root.querySelector('.ls-sheet'), back = null;
    if(!sheet) return;
    function open(){ return s.root.classList.contains('is-sheet') && !sheet.hidden; }
    var was = false;
    function sync(){
      var on = open() && s.root.getAttribute('data-mode') === 'explore';
      if(on === was) return; was = on;
      if(on){
        back = document.activeElement;
        sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
        var h = sheet.querySelector('.ls-sheet-t'); if(h){ h.tabIndex = -1; setTimeout(function(){ h.focus({ preventScroll: true }); }, 30); }
      } else {
        sheet.removeAttribute('role'); sheet.removeAttribute('aria-modal');
        if(back && document.contains(back) && !s.root.querySelector('.ls-sheet').contains(document.activeElement)) try{ back.focus({ preventScroll: true }); }catch(e){}
        back = null;
      }
    }
    sheet.addEventListener('keydown', function(e){
      if(e.key !== 'Tab' || !was) return;
      var f = [].slice.call(sheet.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')).filter(function(x){ return x.offsetParent !== null; });
      if(!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if(e.shiftKey && (document.activeElement === a || !sheet.contains(document.activeElement) || document.activeElement === sheet.querySelector('.ls-sheet-t'))){ e.preventDefault(); z.focus(); }
      else if(!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); }
    });
    if(window.MutationObserver){ var mo = new MutationObserver(sync); mo.observe(s.root, { attributes: true, attributeFilter: ['class', 'data-mode'] }); mo.observe(sheet, { attributes: true, attributeFilter: ['hidden'] }); }
  }

  /* ------------------------------------------------------------ the purpose line and the cause line */
  K.head = function(o){
    var box = el('div', 'tk2-head'), p = el('p', 'tk2-purpose'), how = null;
    p.textContent = o.purpose || ''; box.appendChild(p);
    if(o.how){
      how = el('button', 'tk2-how'); how.type = 'button'; how.textContent = o.how.label || 'Show me how';
      how.addEventListener('click', function(){ if(o.how.onClick) o.how.onClick(); });
      box.appendChild(how);
    }
    return { el: box, how: how, purpose: function(t){ p.textContent = t; } };
  };
  K.cause = function(o){
    o = o || {};
    var p = el('p', 'tk2-cause'), parts = [], pre = '';
    if(o.label) p.setAttribute('aria-label', o.label);
    function text(){ return (pre ? pre + ' ' : '') + parts.map(function(x, i){ return (i ? (x.join === '+' ? ' and ' : ', then ') : '') + (x.say || x.t); }).join('') + (parts.length ? '.' : ''); }
    function set(list, lead){
      parts = list || []; pre = lead || '';
      p.classList.remove('is-take');
      var h = (pre ? '<span class="tk2-cz-pre">' + esc(pre) + '</span>' : '') + parts.map(function(x, i){
        return (i ? '<span class="tk2-cz-a" aria-hidden="true">' + (x.join === '+' ? '+' : '\u2192') + '</span>' : '') + '<span class="tk2-cz is-' + esc(x.role || 'ink') + '">' + esc(x.t) + '</span>';
      }).join('');
      if(p.innerHTML !== h) p.innerHTML = h;
    }
    function take(t){ if(t == null) return set(parts, pre); p.classList.add('is-take'); p.textContent = t; }
    return { el: p, set: set, take: take, text: text };
  };

  window.LevlKit2 = K;
})();
