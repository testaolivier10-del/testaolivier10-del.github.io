/* "Build it": put a protocol back together from shuffled tiles.

   ONE JOB: make the student produce the sequence, step by step, and tell
   them exactly why a step does not go where they put it.

   Read from the same diagram DOM as the drill (flow-drill.js reads it, and
   calls window.NremtFlowBuild.mount). Nothing is written out twice: every
   tile, every slot, every branch label and every "why" note is the page's own
   text. The reasons for a bounce are built from the chart's structure only:
   where the tile really goes (after which step, on which answer to which
   question, or in which other protocol).

   Interaction: drag a tile onto a slot, or tap a tile then tap a slot (or
   use Tab/Enter). Decision boxes are diamonds; their arms are labeled with
   the answer, so the student places what you do on "yes" and on "no". */
(function(){
  'use strict';

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; });
  }
  function text(el){ return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function reduced(){ return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function shuffle(a){
    a = a.slice();
    for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function slug(t){ return String(t).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60); }
  function short(t){ return t.length > 70 ? t.slice(0, 67).replace(/\s+\S*$/, '') + '…' : t; }

  /* ---- Read every diagram as an ordered list of items ------------------ */
  /* item: { type:'step', slot } | { type:'branch', from, arms:[{label, slot, end}] }
     slot: { id, text, kind:'decision'|'action'|'terminal'|'plain', item }
     notes after an item hang on it and appear once it is complete. */
  function read(host){
    var out = [];
    host.querySelectorAll('.diagram-card').forEach(function(card){
      var h = card.previousElementSibling;
      while(h && h.tagName !== 'H2') h = h.previousElementSibling;
      var title = h ? text(h) : 'Protocol';
      var d = { title: title, anchor: (h && h.id) || ('flow-' + slug(title)), items: [], slots: [] };
      var lastStep = null, n = 0;
      Array.prototype.forEach.call(card.children, function(c){
        var cl = c.classList;
        if(cl.contains('flow-box')){
          var kind = cl.contains('decision') ? 'decision' : cl.contains('terminal') ? 'terminal' : cl.contains('action') ? 'action' : 'plain';
          var it = { type: 'step', notes: [] };
          it.slot = { id: d.anchor + ':' + (n++), text: text(c), kind: kind, item: it, prev: lastStep };
          d.items.push(it); d.slots.push(it.slot);
          lastStep = it.slot.text;
        } else if(cl.contains('flow-branch')){
          var br = { type: 'branch', from: lastStep, arms: [], notes: [] };
          Array.prototype.forEach.call(c.children, function(col){
            var lab = col.querySelector('.branch-label'), box = col.querySelector('.flow-box'), rej = col.querySelector('.flow-rejoin');
            if(!lab || !box) return;
            var kind = box.classList.contains('terminal') ? 'terminal' : box.classList.contains('action') ? 'action' : 'plain';
            var arm = { label: text(lab), end: rej ? text(rej).replace(/^↓\s*/, '') : '' };
            arm.slot = { id: d.anchor + ':' + (n++), text: text(box), kind: kind, item: br, arm: arm, from: lastStep };
            br.arms.push(arm); d.slots.push(arm.slot);
          });
          if(br.arms.length) d.items.push(br);
        } else if(cl.contains('flow-note') && d.items.length){
          d.items[d.items.length - 1].notes.push(c.innerHTML);
        }
      });
      if(d.slots.length > 2) out.push(d);
    });
    return out;
  }

  /* ---- Why a tile does not go in a slot ----------------------------------- */
  function reason(tileText, slot, d, all){
    var home = d.slots.filter(function(s){ return s.text === tileText; });
    if(!home.length){
      var other = all.filter(function(x){ return x !== d && x.slots.some(function(s){ return s.text === tileText; }); })[0];
      return 'Not part of this protocol' + (other ? ': that box is from “' + other.title + '”.' : '.');
    }
    /* A box can sit in several places ("IMMEDIATE (red)" ends four arms of
       START). Explain against the copy that answers the same question as the
       slot when there is one, and say when it has other homes, so the reason
       never implies its first place is its only one. */
    var h = home.filter(function(x){ return slot.arm && x.item === slot.item; })[0] || home[0];
    var also = home.length > 1 ? ' (It ends ' + home.length + ' different arms of this chart; that is one of them.)' : '';
    return because(h) + also;
    function because(h){
    if(slot.arm){
      if(h.arm && h.item === slot.item){
        return 'That is the other answer. “' + short(h.text) + '” is what you do if ' + h.arm.label.toLowerCase().replace(/—/g, '-') + ', not if ' + slot.arm.label.toLowerCase().replace(/—/g, '-') + '.';
      }
      if(h.arm) return 'That answers a different question: “' + short(h.from || '') + '”, if ' + h.arm.label.toLowerCase() + '.';
      return 'This slot is only for the patient where “' + short(slot.from || '') + '” comes out ' + slot.arm.label.toLowerCase() + '. “' + short(h.text) + '” is on the main line, for everyone' + (h.prev ? ', after “' + short(h.prev) + '”.' : ', at the start.');
    }
    if(h.arm) return 'Not everyone gets that. It is for when “' + short(h.from || '') + '” is answered ' + h.arm.label.toLowerCase() + '.';
    var hi = d.slots.indexOf(h), si = d.slots.indexOf(slot);
    if(h.kind === 'decision' && slot.kind !== 'decision') return 'That is a question you ask, not something you do: it goes in a diamond' + (h.prev ? ', after “' + short(h.prev) + '”.' : '.');
    return (hi > si ? 'Too early. ' : 'Too late. ') + (h.prev ? 'It comes straight after “' + short(h.prev) + '”.' : 'It is the very first step.');
    }
  }

  /* ---- The board ------------------------------------------------------------ */
  function mount(el, diagrams){
    if(!diagrams.length){ el.innerHTML = ''; return; }
    var d = null, placed = {}, tiles = [], picked = null, misses = 0, missed = {};

    function pickerHtml(){
      return '<div class="bd-pick" role="group" aria-label="Choose a protocol">' + diagrams.map(function(x, i){
        return '<button type="button" class="bd-proto' + (x === d ? ' on' : '') + '" data-proto="' + i + '" aria-pressed="' + (x === d) + '">' + esc(x.title) + '</button>';
      }).join('') + '</div>';
    }

    function start(i){
      d = diagrams[i];
      placed = {}; picked = null; misses = 0; missed = {};
      var own = d.slots.map(function(s){ return s.text; });
      var uniq = own.filter(function(t, k){ return own.indexOf(t) === k; });
      // Two decoys from other protocols, so "does this belong here at all" is part of it.
      var pool = [];
      diagrams.forEach(function(x){ if(x !== d) x.slots.forEach(function(s){ if(uniq.indexOf(s.text) < 0 && s.text.length > 14) pool.push(s.text); }); });
      var decoys = shuffle(pool).slice(0, 2);
      tiles = shuffle(own.concat(decoys)).map(function(t, k){ return { id: 't' + k, text: t, decoy: uniq.indexOf(t) < 0, used: false }; });
      render();
      try{ history.replaceState(null, '', '#build-' + d.anchor); }catch(e){}
    }

    function slotHtml(s){
      var fill = placed[s.id];
      var cls = 'bd-slot k-' + s.kind + (fill ? ' is-filled' : '');
      return '<button type="button" class="' + cls + '" data-slot="' + s.id + '"' + (fill ? ' disabled' : '') +
        ' aria-label="' + (fill ? esc(s.text) : (s.kind === 'decision' ? 'Empty decision' : 'Empty step') + (s.arm ? ' for ' + esc(s.arm.label) : '')) + '">' +
        (fill ? '<span>' + esc(s.text) + '</span>' : '<span class="bd-q">' + (s.kind === 'decision' ? '?' : '') + '</span>') + '</button>';
    }
    function done(it){
      return it.type === 'step' ? !!placed[it.slot.id] : it.arms.every(function(a){ return placed[a.slot.id]; });
    }

    function chartHtml(){
      var h = '';
      d.items.forEach(function(it, k){
        if(it.type === 'step'){
          if(k > 0 && d.items[k - 1].type === 'step') h += '<div class="bd-arrow" aria-hidden="true">↓</div>';
          h += slotHtml(it.slot);
        } else {
          h += '<div class="bd-branch">' + it.arms.map(function(a){
            return '<div class="bd-arm"><div class="bd-label">if ' + esc(a.label) + '</div>' + slotHtml(a.slot) +
              (a.end ? '<div class="bd-end">↓ ' + esc(a.end) + '</div>' : a.slot.kind === 'terminal' ? '<div class="bd-end bd-stop">stop here</div>' : '') + '</div>';
          }).join('') + '</div>';
        }
        if(it.notes.length && done(it)) h += it.notes.map(function(n){ return '<div class="bd-note">' + n + '</div>'; }).join('');
      });
      return h;
    }

    function trayHtml(){
      var left = tiles.filter(function(t){ return !t.used; });
      return left.map(function(t){
        return '<button type="button" class="bd-tile' + (picked === t.id ? ' is-picked' : '') + '" data-tile="' + t.id + '" aria-pressed="' + (picked === t.id) + '">' + esc(t.text) + '</button>';
      }).join('');
    }

    function render(){
      var total = d.slots.length, n = Object.keys(placed).length;
      el.innerHTML =
        '<div class="bd-card">' +
          '<p class="bd-intro">Drag each step into the chart, or tap a step and then tap where it goes. Diamonds are questions; each arm is labeled with its answer. Two tiles are from other protocols.</p>' +
          pickerHtml() +
          '<div class="bd-board">' +
            '<div class="bd-chart" aria-label="' + esc(d.title) + ' chart">' + chartHtml() + '</div>' +
            '<div class="bd-side">' +
              '<div class="bd-status"><span class="bd-count">' + n + ' / ' + total + ' placed</span>' +
                '<span class="bd-miss">' + (misses ? misses + ' bounced' : '') + '</span></div>' +
              '<div class="bd-fb" id="bdFb" role="status" aria-live="polite"></div>' +
              '<div class="bd-tray" role="group" aria-label="Steps to place">' + trayHtml() + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      if(n === total) finish();
    }

    function feedback(html, kind){
      var fb = el.querySelector('#bdFb');
      if(!fb) return;
      fb.className = 'bd-fb ' + (kind || '');
      fb.innerHTML = html;
    }

    function refresh(){
      var chart = el.querySelector('.bd-chart'), tray = el.querySelector('.bd-tray');
      if(chart) chart.innerHTML = chartHtml();
      if(tray) tray.innerHTML = trayHtml();
      var c = el.querySelector('.bd-count'); if(c) c.textContent = Object.keys(placed).length + ' / ' + d.slots.length + ' placed';
      var m = el.querySelector('.bd-miss'); if(m) m.textContent = misses ? misses + ' bounced' : '';
      el.querySelector('.bd-card').classList.toggle('has-pick', !!picked);
    }

    function place(tileId, slotId, fromEl){
      var t = tiles.filter(function(x){ return x.id === tileId; })[0];
      var s = d.slots.filter(function(x){ return x.id === slotId; })[0];
      if(!t || !s || placed[s.id]) return;
      if(t.text === s.text){
        placed[s.id] = true; t.used = true; picked = null;
        refresh();
        var it = s.item, extra = '';
        if(done(it) && it.notes.length) extra = ' <span class="bd-why">Why: see the note under it.</span>';
        feedback('<b>Yes.</b> ' + (s.arm ? 'If ' + esc(s.arm.label.toLowerCase()) + ': ' : '') + esc(short(s.text)) + extra, 'ok');
        var sEl = el.querySelector('[data-slot="' + s.id + '"]');
        if(sEl && !reduced()) sEl.classList.add('pop');
        if(window.LevlAnnounce) window.LevlAnnounce.say('Placed. ' + s.text);
        if(Object.keys(placed).length === d.slots.length) finish();
        else {
          var nextT = el.querySelector('.bd-tile');
          if(nextT && document.activeElement === document.body) nextT.focus({ preventScroll: true });
        }
      } else {
        misses++;
        if(!t.decoy) missed[t.text] = true;
        var why = reason(t.text, s, d, diagrams);
        picked = tileId;
        refresh();
        feedback('<b>Bounced.</b> ' + esc(why), 'no');
        var slotEl = el.querySelector('[data-slot="' + s.id + '"]');
        if(slotEl && !reduced()){ slotEl.classList.remove('shake'); void slotEl.offsetWidth; slotEl.classList.add('shake'); }
        if(window.LevlAnnounce) window.LevlAnnounce.say('Does not go there. ' + why);
        if(t.decoy){ t.used = true; picked = null; refresh(); feedback('<b>Bounced, and out.</b> ' + esc(why), 'no'); }
      }
    }

    function finish(){
      var clean = misses === 0;
      if(window.NremtToolResults) window.NremtToolResults.record({
        tool: 'flowcharts', id: 'build:' + d.anchor, correct: Object.keys(missed).length === 0,
        label: 'Build the ' + d.title + ' chart from its steps',
        href: 'flowcharts.html#build-' + d.anchor
      });
      var side = el.querySelector('.bd-side');
      if(!side) return;
      var wrong = Object.keys(missed);
      side.innerHTML =
        '<div class="bd-done">' +
          '<div class="bd-done-h">' + (clean ? 'Built clean.' : 'Built, with ' + misses + ' bounce' + (misses === 1 ? '' : 's') + '.') + '</div>' +
          (wrong.length ? '<p>Steps you tried in the wrong place:</p><ul>' + wrong.map(function(w){ return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' +
            '<p class="bd-small">This chart went to your Review list. It leaves when you build it without misplacing a step.</p>' : '') +
          '<div class="bd-actions"><button type="button" class="drill-next" data-again>Build it again</button>' +
          '<a class="drill-see" href="#' + d.anchor + '" data-see="' + d.anchor + '">See the diagram</a></div>' +
        '</div>';
      if(window.LevlAnnounce) window.LevlAnnounce.say(clean ? 'Chart complete with no misplaced steps.' : 'Chart complete. ' + misses + ' bounced.');
    }

    /* ---- Input: tap, keyboard ---- */
    el.onclick = function(e){
      var p = e.target.closest('[data-proto]');
      if(p){ start(+p.getAttribute('data-proto')); return; }
      if(e.target.closest('[data-again]')){ start(diagrams.indexOf(d)); return; }
      var t = e.target.closest('[data-tile]');
      if(t){
        if(suppressClick){ suppressClick = false; return; }
        picked = picked === t.getAttribute('data-tile') ? null : t.getAttribute('data-tile');
        refresh();
        if(picked){
          feedback('Now tap the slot where it goes.', '');
          var first = el.querySelector('.bd-slot:not(:disabled)');
          if(first && e.detail === 0) first.focus();
        }
        return;
      }
      var s = e.target.closest('[data-slot]');
      if(s && picked) place(picked, s.getAttribute('data-slot'));
      else if(s) feedback('Pick a step from the tray first.', '');
    };

    /* ---- Input: drag (pointer) ---- */
    var drag = null, suppressClick = false;
    el.onpointerdown = function(e){
      var t = e.target.closest('[data-tile]');
      if(!t || e.button > 0) return;
      // A mouse drag would otherwise start selecting the chart's text.
      if(e.pointerType === 'mouse') e.preventDefault();
      drag = { id: t.getAttribute('data-tile'), el: t, x: e.clientX, y: e.clientY, ghost: null, over: null };
    };
    window.addEventListener('pointermove', function(e){
      if(!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if(!drag.ghost){
        if(Math.abs(dx) + Math.abs(dy) < 8) return;
        var r = drag.el.getBoundingClientRect();
        drag.ox = r.left; drag.oy = r.top;
        drag.ghost = drag.el.cloneNode(true);
        drag.ghost.className = 'bd-tile bd-ghost';
        drag.ghost.style.width = r.width + 'px';
        drag.ghost.style.left = r.left + 'px'; drag.ghost.style.top = r.top + 'px';
        document.body.appendChild(drag.ghost);
        drag.el.classList.add('is-dragging');
        el.querySelector('.bd-card').classList.add('is-dragging');
      }
      e.preventDefault();
      drag.ghost.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(-1.5deg)';
      drag.ghost.style.visibility = 'hidden';
      var under = document.elementFromPoint(e.clientX, e.clientY);
      drag.ghost.style.visibility = '';
      var s = under && under.closest && under.closest('.bd-slot:not(:disabled)');
      if(drag.over && drag.over !== s) drag.over.classList.remove('is-over');
      if(s) s.classList.add('is-over');
      drag.over = s;
    }, { passive: false });
    window.addEventListener('pointerup', function(){
      if(!drag) return;
      var dd = drag; drag = null;
      if(!dd.ghost) return;
      suppressClick = true;
      setTimeout(function(){ suppressClick = false; }, 0);
      var card = el.querySelector('.bd-card'); if(card) card.classList.remove('is-dragging');
      if(dd.over){ dd.over.classList.remove('is-over'); }
      var target = dd.over ? dd.over.getAttribute('data-slot') : null;
      var ok = target && tiles.filter(function(x){ return x.id === dd.id; })[0].text === d.slots.filter(function(s){ return s.id === target; })[0].text;
      if(ok || reduced()){ dd.ghost.remove(); }
      else {
        // Bounce home.
        dd.ghost.style.transition = 'transform .28s cubic-bezier(.3,1.4,.5,1)';
        dd.ghost.style.transform = 'translate(0,0)';
        setTimeout(function(){ dd.ghost.remove(); }, 300);
      }
      dd.el.classList.remove('is-dragging');
      if(target) place(dd.id, target);
    });
    window.addEventListener('pointercancel', function(){
      if(drag && drag.ghost) drag.ghost.remove();
      drag = null;
    });

    var want = (location.hash.match(/^#build-(.+)$/) || [])[1];
    var idx = 0;
    diagrams.forEach(function(x, i){ if(x.anchor === want) idx = i; });
    start(idx);
  }

  window.NremtFlowBuild = { read: read, mount: mount, reason: reason };
})();
