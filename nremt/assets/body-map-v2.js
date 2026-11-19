/* NREMT Body map, tools v2 Explore (docs/tools-v2-nremt-body-map-brief.md; standard docs/tools-v2-standard.md).
   Loaded only by nremt/body-map.html, after the kit (assets/course/tool-kit2.js), the 3D viewer
   (assets/body3d/viewer.js) and Burns (assets/burns.js). Nothing here changes what the body shows or says: the
   model, the 70 parts and every word of their cards come from viewer.js and body-content.js, the burn figures and
   the Rule of Nines from burns.js and body-figures.js. This file is the frame around them:

     two tabs, one idea each
       1 The body   tap a part of the 3D body: it lights, the rest fades, the camera comes to it, and its card opens
                    ON the picture beside it with a leader to the part (what it does, what goes wrong, EMT care)
       2 Burns      tap or drag over the front and back figures: each region's share adds to the total burned
     the purpose line and "Show me how" (K.head), one first-visit cue per tab (K.cue), the cause line (K.cause),
     "?" (the reference: view options, the Rule of Nines in words, the terms, the credits).

   NremtBodyMap.build({ studio, viewerEl, onTab, onCard, onBurns }) -> { stage, ref, home, slot(name, nodes),
     attach(viewer), onSelect, onPick, tab(id?), burns(), shown(), hidden(), card() }
     viewerEl: the element the viewer mounts on (#bodyViewer). It sits in `home` with Find a part; the page mounts the
     viewer, hands it over with attach(), and moves `home` to Test yourself's own stage and back (shown() brings it
     home). */
(function(){
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function fmt(n){ return (Math.round(n * 1000) / 1000).toString(); }

  /* One colour per idea, everywhere: each body system has its own (the card's system line, its pill in the cause
     line); a part you tapped is the course teal (the viewer's own "Selected" glow); a burn is burn red. */
  var SYS = ['resp', 'cardio', 'neuro', 'msk', 'abd', 'skin'];
  /* the card's three sections: every field of the part's card, one short section at a time */
  var SECTIONS = [
    { id: 'does', label: 'What it does', short: 'Job', rows: [['Where', 'location'], ['Job', 'funct']] },
    { id: 'wrong', label: 'Goes wrong', short: 'Problems', rows: [['What goes wrong', 'path'], ['What you find', 'findings']] },
    { id: 'care', label: 'EMT care', short: 'Care', rows: [['What you do', 'interv']] }
  ];
  /* Burns: why each region carries its share (the line burns.js said in its side panel, now in the cause line) */
  function shareOf(r, child){
    switch(r.whole){
      case 'head': return 'half of the head’s ' + (child ? '18%' : '9%');
      case 'antTrunk': return 'one nine of the front’s 18%';
      case 'postTrunk': return 'one nine of the back’s 18%';
      case 'genitals': return 'the last 1%';
      case 'rarm': case 'larm': return 'half of the arm’s 9%';
      default: return 'half of the leg’s ' + (child ? '13.5%' : '18%');
    }
  }
  var SHORT = { 'head-f': 'Head, front', 'head-b': 'Head, back', chest: 'Chest', abdomen: 'Abdomen', upback: 'Upper back',
    lowback: 'Lower back', genitals: 'Genitals', 'rarm-f': 'Right arm, front', 'rarm-b': 'Right arm, back', 'larm-f': 'Left arm, front',
    'larm-b': 'Left arm, back', 'rleg-f': 'Right leg, front', 'rleg-b': 'Right leg, back', 'lleg-f': 'Left leg, front', 'lleg-b': 'Left leg, back' };

  function build(o){
    var K = window.LevlKit2, studio = o.studio, viewerEl = o.viewerEl;
    var St = { tab: 'body', sel: null, card: null, pending: null, sec: 'does', ptr: 'mouse', on: true, cued: {}, burnsUp: false, flagOn: false };
    var V = null;   // the 3D viewer, once attached

    /* ---------------------------------------------------- the stage */
    var stage = el('div', 'bm2');
    stage.setAttribute('data-tab', St.tab);
    var tabs = K.tabs({ label: 'What to explore', big: true, value: St.tab,
      items: [{ value: 'body', label: 'The body', short: 'Body' }, { value: 'burns', label: 'Burns', short: 'Burns' }],
      onChange: function(v){ setTab(v, true); } });
    stage.appendChild(tabs.el);
    var PURPOSE = { body: 'Every part of the body has a place and a job.', burns: 'Each region of skin is a share of the body: add the burned ones.' };
    var head = K.head({ purpose: PURPOSE.body, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);

    var scene = el('div', 'bm2-scene');
    scene.id = 'bm2-scene';
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', scene.id); });
    stage.appendChild(scene);

    /* the body: the viewer's element, and over it the card, its leader, the hover name and Find a part */
    var body = el('div', 'bm2-3d');
    var home = el('div', 'bm2-home');   // where viewerEl lives while Explore has it
    body.appendChild(home);
    home.appendChild(viewerEl);
    var lead = document.createElementNS(NS, 'svg');
    lead.setAttribute('class', 'bm2-lead'); lead.setAttribute('aria-hidden', 'true');
    lead.innerHTML = '<path class="bm2-lead-l" d=""/><circle class="bm2-lead-r" r="11"/><circle class="bm2-lead-d" r="5"/>';
    body.appendChild(lead);
    var leadL = lead.querySelector('.bm2-lead-l'), leadR = lead.querySelector('.bm2-lead-r'), leadD = lead.querySelector('.bm2-lead-d');
    var card = el('section', 'bm2-card');
    card.setAttribute('aria-live', 'polite'); card.setAttribute('aria-label', 'The part you tapped'); card.hidden = true;
    card.innerHTML = '<button type="button" class="bm2-card-x" aria-label="Close the card"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<p class="bm2-card-s"></p><h3 class="bm2-card-n"></h3>' +
      '<div class="bm2-card-t" role="tablist" aria-label="About this part">' + SECTIONS.map(function(x, i){
        return '<button type="button" role="tab" class="bm2-card-tab" data-sec="' + x.id + '" aria-selected="' + (i ? 'false' : 'true') + '" tabindex="' + (i ? -1 : 0) + '">' +
          '<span class="bm2-l">' + x.label + '</span><span class="bm2-s" aria-hidden="true">' + x.short + '</span></button>';
      }).join('') + '</div><div class="bm2-card-b" role="tabpanel"></div>';
    body.appendChild(card);
    var cardS = card.querySelector('.bm2-card-s'), cardN = card.querySelector('.bm2-card-n'), cardB = card.querySelector('.bm2-card-b');
    var tip = el('div', 'bm2-tip'); tip.setAttribute('aria-hidden', 'true'); tip.hidden = true;
    body.appendChild(tip);
    var findW = el('label', 'bm2-find');
    findW.innerHTML = '<span class="tk2-sr">Find a part by name</span><select class="bm2-find-s"><option value="">Find a part</option></select>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>';
    home.appendChild(findW);   // Find a part travels with the body (Test yourself uses it too: a keyboard can answer)
    var find = findW.querySelector('select');
    scene.appendChild(body);
    var layer3 = K.layer(body);

    /* burns: the figures from burns.js, the chart switch and the total on them */
    var burn = el('div', 'bm2-burn');
    burn.hidden = true;
    burn.innerHTML = '<div class="bm2-bbar"><div class="bm2-seg bm2-age" role="radiogroup" aria-label="Patient">' +
      '<button type="button" role="radio" data-age="adult" aria-checked="true">Adult</button><button type="button" role="radio" data-age="child" aria-checked="false">Child</button></div>' +
      '<div class="bm2-tot"><span class="bm2-tot-k">Burned</span><span class="bm2-tot-n" aria-hidden="true">0%</span><span class="bm2-tot-f" hidden>Over 10%</span></div></div>';
    scene.appendChild(burn);
    var ageBtns = [].slice.call(burn.querySelectorAll('[data-age]')), totN = burn.querySelector('.bm2-tot-n'), totF = burn.querySelector('.bm2-tot-f');
    var burnRoot = el('div', 'bm2-burnroot'); burnRoot.hidden = true;   // burns.js's own side panel: kept out of sight
    stage.appendChild(burnRoot);
    var layerB = null, BI = null;

    /* under the picture: the cause line, and the tab's own quiet controls */
    var lines = el('div', 'bm2-lines');
    var cause = K.cause({ label: 'What happened' });
    var acts = el('div', 'bm2-acts');
    acts.innerHTML = '<div class="bm2-seg bm2-brush" role="radiogroup" aria-label="Brush">' +
      '<button type="button" role="radio" data-brush="1" aria-checked="true">Full</button><button type="button" role="radio" data-brush="0.5" aria-checked="false">Half</button>' +
      '<button type="button" role="radio" data-brush="0" aria-checked="false">Erase</button></div>' +
      '<button type="button" class="tk2-link bm2-reset">Start over</button>';
    var brushBtns = [].slice.call(acts.querySelectorAll('[data-brush]')), bReset = acts.querySelector('.bm2-reset');
    acts.hidden = true;
    lines.appendChild(cause.el); lines.appendChild(acts);
    stage.appendChild(lines);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite');
    stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 30); }

    /* ---------------------------------------------------- tabs */
    function setTab(v, user){
      if(v !== 'body' && v !== 'burns') return;
      if(tabs.value() !== v) tabs.value(v);
      var was = St.tab; St.tab = v;
      stage.setAttribute('data-tab', v);
      head.purpose(PURPOSE[v]);
      body.hidden = v !== 'body'; burn.hidden = v !== 'burns';
      acts.hidden = v !== 'burns';
      if(cue && cue.active()) cue.hide(false);
      if(v === 'burns') upBurns();
      if(v === 'body' && V) window.dispatchEvent(new Event('resize'));
      paintCause();
      if(was !== v && o.onTab) o.onTab(v, !!user);
      if(was !== v && user) tour.did('tab');
      setTimeout(showCue, 250);
    }

    /* ---------------------------------------------------- the body */
    function sysName(k){ return (window.LevlBodyViewer && window.LevlBodyViewer.SYSTEM_LABELS[k]) || k; }
    function info(k){ return V ? V.info(k) : (window.LevlBodyViewer ? window.LevlBodyViewer.info(k) : null); }
    function fillFind(){
      if(!V) return;
      var by = {}, cur = find.value;
      V.structures().filter(function(s){ return s.key !== 'skin' && s.name; }).forEach(function(s){ (by[s.system] = by[s.system] || []).push(s); });
      var h = '<option value="">Find a part</option>';
      SYS.filter(function(k){ return by[k]; }).forEach(function(k){
        var names = {}; by[k].forEach(function(s){ names[s.name] = (names[s.name] || 0) + 1; });
        h += '<optgroup label="' + esc(sysName(k)) + '">' + by[k].sort(function(a, b){ return a.name.localeCompare(b.name); }).map(function(s){
          var side = names[s.name] > 1 ? (/_R$/.test(s.key) ? ' (right)' : /_L$/.test(s.key) ? ' (left)' : '') : '';
          return '<option value="' + esc(s.key) + '">' + esc(s.name + side) + '</option>';
        }).join('') + '</optgroup>';
      });
      find.innerHTML = h;
      find.value = cur && find.querySelector('option[value="' + cur + '"]') ? cur : (St.sel || '');
    }
    find.addEventListener('change', function(){
      if(!V) return;
      hideCue(true); tour.did('find');
      if(find.value) V.select(find.value); else V.clear();
    });

    function onSelect(key, c){
      // the viewer said a part was selected (a tap, Find a part, ?focus=) or cleared
      if(!St.on) return;
      St.sel = c ? key : null;
      if(find.value !== (St.sel || '')) find.value = St.sel && find.querySelector('option[value="' + St.sel + '"]') ? St.sel : '';
      hideTip();
      if(!c){ St.pending = null; closeCard(); paintCause(); return; }
      hideCue(true); tour.did('tap');
      St.pending = key;
      if(St.card && St.card !== key) closeCard(true);
      // the cause line waits too: the card and the result words come once the camera is there (rule 14)
      cause.set([{ t: 'Finding it', role: 'tap' }]);
      later();
    }
    function onPick(key){ if(St.on && !key && St.sel && V) V.clear(); }
    function later(){ if(!lt) lt = requestAnimationFrame(frame); }
    var lt = 0;
    function frame(){
      lt = 0;
      if(!V || St.tab !== 'body' || body.hidden) return;
      if(St.pending && !V.flying()){ var k = St.pending; St.pending = null; openCard(k); }
      else if(St.pending) later();   // the camera is still on its way: check again next frame
      if(St.card) place(false);
    }
    function sectionHtml(c, id){
      var s = SECTIONS.filter(function(x){ return x.id === id; })[0] || SECTIONS[0];
      return s.rows.filter(function(r){ return c[r[1]]; }).map(function(r){ return '<p><b>' + r[0] + '.</b> ' + esc(c[r[1]]).replace(/\s*—\s*/g, ': ') + '</p>'; }).join('');
    }
    function setSec(id, focus){
      St.sec = id;
      card.querySelectorAll('.bm2-card-tab').forEach(function(b){ var on = b.getAttribute('data-sec') === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if(on && focus) b.focus(); });
      var c = St.card && info(St.card);
      if(!c) return;
      cardB.classList.remove('is-in'); void cardB.offsetWidth;
      cardB.innerHTML = sectionHtml(c, id);
      cardB.scrollTop = 0;
      cardB.classList.add('is-in');
      place(false);
    }
    card.querySelector('.bm2-card-t').addEventListener('click', function(e){ var b = e.target.closest('.bm2-card-tab'); if(b) setSec(b.getAttribute('data-sec')); });
    card.querySelector('.bm2-card-t').addEventListener('keydown', function(e){
      var ids = SECTIONS.map(function(x){ return x.id; }), i = ids.indexOf(St.sec);
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : null;
      if(j == null) return; e.preventDefault(); setSec(ids[(j + ids.length) % ids.length], true);
    });
    card.querySelector('.bm2-card-x').addEventListener('click', function(){ if(V) V.clear(); });
    function openCard(key){
      var c = info(key);
      if(!c) return;
      St.card = key;
      card.style.setProperty('--sys', 'var(--bm-' + (c.system || 'msk') + ')');
      card.setAttribute('data-sys', c.system || '');
      cardS.textContent = sysName(c.system);
      cardN.textContent = c.name;
      St.sec = 'does';
      card.querySelectorAll('.bm2-card-tab').forEach(function(b, i){ b.setAttribute('aria-selected', String(!i)); b.tabIndex = i ? -1 : 0; });
      cardB.innerHTML = sectionHtml(c, 'does');
      card.classList.remove('is-in'); lead.classList.remove('is-in');
      card.hidden = false; lead.style.display = '';
      stage.classList.add('has-card');
      place(true);
      void card.offsetWidth;
      card.classList.add('is-in'); lead.classList.add('is-in');
      cause.set([{ t: c.name, role: 'part' }, { t: sysName(c.system), role: 'sys-' + (c.system || 'msk') }], 'Tapped');
      say(c.name + ', ' + sysName(c.system) + '. ' + (c.funct || ''));
      if(o.onCard) o.onCard(key);
    }
    function closeCard(quick){
      St.card = null;
      card.classList.remove('is-in'); lead.classList.remove('is-in');
      stage.classList.remove('has-card');
      if(quick || K.reduced()){ card.hidden = true; lead.style.display = 'none'; return; }
      setTimeout(function(){ if(!St.card){ card.hidden = true; lead.style.display = 'none'; } }, 180);
    }
    /* where the card sits: beside the part on a wide picture (the side with more room), along the bottom on a
       narrow one; the leader runs from the card to the part's middle */
    function place(first){
      if(!St.card || !V) return;
      var p = V.project(St.card);
      var W = body.clientWidth, H = body.clientHeight;
      if(!p || !W) return;
      var wide = W >= 700;
      card.classList.toggle('is-dock', !wide);
      var cw = card.offsetWidth, ch = card.offsetHeight, x, y;
      var px = clamp(p.x, 8, W - 8), py = clamp(p.y, 8, H - 8);
      if(wide){
        var room = Math.max(p.r, 26) + 34, right = px + room + cw <= W - 14 || px < W / 2;
        x = right ? clamp(px + room, 14, W - cw - 14) : clamp(px - room - cw, 14, W - cw - 14);
        y = clamp(py - ch * 0.42, 62, Math.max(62, H - ch - 14));
        card.style.left = x + 'px'; card.style.top = y + 'px'; card.style.bottom = '';
        var ex = right ? x : x + cw, ey = clamp(py, y + 22, y + ch - 22);
        leadL.setAttribute('d', 'M' + ex.toFixed(1) + ' ' + ey.toFixed(1) + 'L' + px.toFixed(1) + ' ' + py.toFixed(1));
      } else {
        card.style.left = ''; card.style.top = ''; card.style.bottom = '';
        var r = card.getBoundingClientRect(), b = body.getBoundingClientRect(), top = r.top - b.top;
        var lx = clamp(px, r.left - b.left + 24, r.right - b.left - 24);
        leadL.setAttribute('d', py < top - 6 ? 'M' + lx.toFixed(1) + ' ' + top.toFixed(1) + 'L' + px.toFixed(1) + ' ' + py.toFixed(1) : '');
      }
      leadD.setAttribute('cx', px.toFixed(1)); leadD.setAttribute('cy', py.toFixed(1));
      leadR.setAttribute('cx', px.toFixed(1)); leadR.setAttribute('cy', py.toFixed(1));
      var vis = p.front && !(wide ? false : py >= card.getBoundingClientRect().top - body.getBoundingClientRect().top - 4);
      leadD.style.display = leadR.style.display = vis ? '' : 'none';
    }
    /* the name under the mouse before you tap (a mouse only: a finger has no hover) */
    var tipXY = [0, 0];
    body.addEventListener('pointermove', function(e){
      St.ptr = e.pointerType || 'mouse';
      var b = body.getBoundingClientRect(); tipXY = [e.clientX - b.left, e.clientY - b.top];
      if(!tip.hidden) placeTip();
    }, { passive: true });
    body.addEventListener('pointerdown', function(e){ St.ptr = e.pointerType || 'mouse'; if(St.ptr !== 'mouse') hideTip(); hideCue(true); }, { passive: true });
    body.addEventListener('pointerleave', hideTip);
    function placeTip(){
      var W = body.clientWidth, w = tip.offsetWidth;
      var x = clamp(tipXY[0] + 14, 6, W - w - 6), y = tipXY[1] - 34;
      if(y < 6) y = tipXY[1] + 22;
      tip.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
    }
    function onHover(key, c){
      if(!St.on || St.ptr !== 'mouse' || !c || key === St.sel || key === 'skin' || St.tab !== 'body'){ hideTip(); return; }
      tip.textContent = c.name; tip.hidden = false; placeTip();
    }
    function hideTip(){ tip.hidden = true; }

    /* ---------------------------------------------------- burns */
    function upBurns(){
      if(St.burnsUp || !window.NremtBurns) return;
      St.burnsUp = true;
      BI = window.NremtBurns.mount(burnRoot, { anim: true, onChange: onBurn, onSettle: onBurnSettle, onPaint: onBurnPaint });
      var figs = BI.figs;
      figs.classList.add('bm2-figs');
      var cr = figs.querySelector('.bn-credit'); if(cr) cr.remove();
      burn.appendChild(figs);
      layerB = K.layer(burn);
      burn.addEventListener('pointerdown', function(e){ if(!e.target.closest('.bm2-bbar')) hideCue(true); }, { passive: true });
      paintBurnCtl();
      if(o.onBurns) o.onBurns(BI);
    }
    function paintBurnCtl(){
      if(!BI) return;
      ageBtns.forEach(function(b){ b.setAttribute('aria-checked', String((b.getAttribute('data-age') === 'child') === BI.child())); });
      brushBtns.forEach(function(b){ b.setAttribute('aria-checked', String(+b.getAttribute('data-brush') === BI.brush())); });
    }
    ageBtns.forEach(function(b){ b.addEventListener('click', function(){ if(!BI) return; hideCue(true); BI.setChild(b.getAttribute('data-age') === 'child'); paintBurnCtl(); tour.did('age'); }); });
    burn.querySelector('.bm2-age').addEventListener('keydown', function(e){
      if(!BI || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
      e.preventDefault(); BI.setChild(!BI.child()); paintBurnCtl(); burn.querySelector('[data-age="' + (BI.child() ? 'child' : 'adult') + '"]').focus();
    });
    brushBtns.forEach(function(b){ b.addEventListener('click', function(){ if(!BI) return; BI.setBrush(+b.getAttribute('data-brush')); paintBurnCtl(); }); });
    acts.querySelector('.bm2-brush').addEventListener('keydown', function(e){
      if(!BI || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
      e.preventDefault();
      var vals = [1, 0.5, 0], i = vals.indexOf(BI.brush()), j = (i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + 3) % 3;
      BI.setBrush(vals[j]); paintBurnCtl(); acts.querySelector('[data-brush="' + vals[j] + '"]').focus();
    });
    bReset.addEventListener('click', function(){ if(BI) BI.clear(); });
    var lastBurn = null;
    function onBurn(ev){
      lastBurn = ev;
      if(ev.kind === 'mark'){
        hideCue(true); tour.did('paint');
        var r = BI.region(ev.id), name = SHORT[ev.id] || r.name;
        // the region and why it carries its share: shown as the burn starts; the numbers wait for the picture
        if(!ev.mark) cause.set([{ t: name, role: 'reg' }, { t: 'cleared', role: 'ink' }]);
        else cause.set([{ t: name, role: 'reg' }, { t: (ev.mark === 0.5 ? 'half of it: ' : '') + shareOf(r, ev.child), role: 'ink' }]);
      } else if(ev.kind === 'age'){
        burn.classList.remove('is-swap'); void burn.offsetWidth; burn.classList.add('is-swap');
        cause.set([{ t: ev.child ? 'Child chart' : 'Adult chart', role: 'reg' }]);
      } else if(ev.kind === 'clear'){
        cause.set([{ t: 'Start over', role: 'reg' }]);
      }
    }
    function onBurnSettle(ev){
      if(ev !== lastBurn) return;
      if(ev.kind === 'mark'){
        var r = BI.region(ev.id), name = SHORT[ev.id] || r.name, p = BI.pct(ev.id) * (ev.mark || 0);
        var parts = [{ t: name, role: 'reg' }];
        if(ev.mark) parts.push({ t: (ev.mark === 0.5 ? 'half of it: ' : '') + shareOf(r, ev.child), role: 'ink' }, { t: fmt(p) + '%', role: 'burn' });
        else parts.push({ t: 'cleared', role: 'ink' });
        parts.push({ t: 'Total ' + fmt(ev.total) + '%', role: 'tot' });
        cause.set(parts);
        say(r.name + (ev.mark ? ', ' + fmt(p) + ' percent' : ' cleared') + '. Total burned ' + fmt(ev.total) + ' percent.');
      } else if(ev.kind === 'age'){
        cause.set(ev.child ? [{ t: 'Child chart', role: 'reg' }, { t: 'head 18%', role: 'burn' }, { t: 'each leg 13.5%', role: 'burn', join: '+' }, { t: 'Total ' + fmt(ev.total) + '%', role: 'tot' }]
          : [{ t: 'Adult chart', role: 'reg' }, { t: 'head 9%', role: 'burn' }, { t: 'each leg 18%', role: 'burn', join: '+' }, { t: 'Total ' + fmt(ev.total) + '%', role: 'tot' }]);
        say((ev.child ? 'Child chart: head and neck 18 percent, each leg 13.5. ' : 'Adult chart: head and neck 9 percent, each leg 18. ') + 'Total burned ' + fmt(ev.total) + ' percent.');
      } else if(ev.kind === 'clear'){
        cause.take('Nothing is burned now. Tap a region to start again.');
        say('Cleared. Total burned 0 percent.');
      }
    }
    function onBurnPaint(t){
      // the total on the picture reads what is drawn this frame (burns.js gives it)
      totN.textContent = fmt(t) + '%';
      var over = t > 10;
      if(over !== St.flagOn){ St.flagOn = over; totF.hidden = !over; }
    }

    /* ---------------------------------------------------- the cause line at rest */
    function paintCause(){
      if(St.tab === 'body'){
        var c = St.card && info(St.card);
        if(c) cause.set([{ t: c.name, role: 'part' }, { t: sysName(c.system), role: 'sys-' + (c.system || 'msk') }], 'Tapped');
        else cause.set([{ t: 'Tap a part', role: 'tap' }, { t: 'its card opens beside it', role: 'ink' }]);
      } else {
        var t = BI ? BI.total() : 0;
        if(lastBurn && lastBurn.kind === 'mark' && BI && BI.settled()) onBurnSettle(lastBurn);
        else cause.set([{ t: 'Tap a region', role: 'reg' }, { t: 'its share adds up', role: 'ink' }, { t: 'Total ' + fmt(t) + '%', role: 'tot' }]);
      }
    }

    /* ---------------------------------------------------- the one cue per tab, and "Show me how" */
    var cue = null;
    function cueFor(tab){
      var narrow = body.clientWidth < 700;
      if(tab === 'body') return K.cue(layer3, { key: 'nremt-body-map', text: 'Tap a part of the body', side: narrow ? 'below' : 'right', at: function(){
        // beside the left shoulder of the model as it opens (the viewer's home view), so the bubble sits on empty
        // backdrop and never on the body it points at
        // (a narrow picture has no backdrop beside the body: the bubble hangs under the chest, on the belly)
        var W = body.clientWidth, H = body.clientHeight;
        return W < 700 ? [W * 0.5, H * 0.33] : [W * 0.5 + Math.min(H * 0.15, W * 0.2), H * 0.27];
      } });
      if(!layerB) return null;
      return K.cue(layerB, { key: 'nremt-body-map-burns', text: 'Tap a region', side: 'below', at: function(){
        var sv = burn.querySelector('svg[data-view="front"]'), k = layerB.scale() || 1, F = window.LevlBodyFigs;
        var f = F && F.figs[(BI && BI.child() ? 'child' : 'adult') + '-front'];
        if(!sv || !f) return [0, 0];
        var r = sv.getBoundingClientRect(), h = burn.getBoundingClientRect(), s = r.width / f.w;
        // below the front figure's feet, pointing up at the legs: clear of every number
        var a = f.anchors.legL, x = r.left - h.left + a[0] * s, y = r.top - h.top + Math.min(f.h * 0.93, a[1] + (f.h - a[1]) * 0.75) * s;
        return [x / k, y / k];
      } });
    }
    function showCue(){
      if(!St.on || stage.hidden || St.cued[St.tab]) return;
      if(St.tab === 'body' && (!V || !V.loaded() || St.sel)) { if(V && !V.loaded()) setTimeout(showCue, 400); return; }
      if(St.tab === 'burns' && (!BI || !burn.querySelector('svg[data-view="front"] image'))){ setTimeout(showCue, 300); return; }
      St.cued[St.tab] = true;
      if(cue) cue.hide(false);
      cue = cueFor(St.tab);
      if(cue && cue.show()) cue.place();
    }
    function hideCue(used){ if(cue && cue.active()) cue.hide(used); }
    var tour = K.tour({ key: 'nremt-body-map', label: 'Show me how', steps: [
      { id: 'tab', text: 'Pick what to explore: the body, or burns.', target: function(){ return tabs.el; } },
      { id: 'tap', text: 'Tap any part of the body. Drag to turn it, pinch or scroll to zoom.', target: function(){ return St.tab === 'body' ? body : burn; } },
      { id: 'find', text: 'Or find a part by name.', target: function(){ return St.tab === 'body' ? findW : burn.querySelector('.bm2-age'); } }
    ] });
    var tourB = K.tour({ key: 'nremt-body-map-burns', label: 'Show me how', steps: [
      { id: 'paint', text: 'Tap a region to burn it, or drag across several.', target: function(){ return burn.querySelector('.bn-fig') || burn; } },
      { id: 'age', text: 'A child’s chart is different: the head is bigger, the legs smaller.', target: function(){ return burn.querySelector('.bm2-age'); } },
      { id: 'tot', text: 'The total burned is here, and why each region counts is under the picture.', target: function(){ return burn.querySelector('.bm2-tot'); } }
    ] });
    var tourDid = tour.did;
    tour.did = function(id){ tourDid(id); tourB.did(id); };
    function startTour(){ hideCue(true); (St.tab === 'burns' ? tourB : tour).start(true); }

    /* ---------------------------------------------------- "?" */
    var ref = el('div', 'bm2-ref');
    ref.innerHTML =
      '<h3>What you are looking at</h3>' +
      '<p><b>The body.</b> A real anatomical model (bones, organs and the main vessels under see through skin), with 70 parts you can tap, each with what it does, what goes wrong, what you find and what you do as an EMT. Tap a part: it lights up, the rest fades so you can see it, and its card opens beside it. Tap it again, or empty space, to let go. Drag to turn the body; pinch or scroll to zoom; drag with two fingers (or the right mouse button) to move it. The dots are landmarks on the surface: red ones are pulse points (radial, brachial, femoral, popliteal, posterior tibial, dorsalis pedis), the others places you describe findings by (a rib space, the nipple line, the iliac crest).</p>' +
      '<p><b>Burns.</b> The same body, front and back. Each number is that region’s share of the skin by the Rule of Nines; tap or drag over regions to burn them and the total adds up.</p>' +
      '<p class="bm2-ref-p"><button type="button" class="tk2-how bm2-ref-how">Show me how</button></p>' +
      '<div class="bm2-ref-slot" data-slot="view"></div>' +
      '<h3>The Rule of Nines</h3><div class="bm2-ref-slot" data-slot="nines"></div>' +
      '<p><b>The child chart.</b> Only two regions change: the head and neck is 18% and each leg 13.5%. These are an infant’s or small child’s shares; as a child grows the head’s share shrinks and the legs’ grows toward the adult chart, and many protocols use a Lund and Browder chart for children.</p>' +
      '<p><b>Brush.</b> Full burns the whole region; Half marks part of it (half its share); Erase clears. Tapping a burned region again also clears it.</p>' +
      '<p><b>Over 10%.</b> Partial thickness (second degree) burns over 10% of the body surface are a burn center criterion. Cover large burns with dry sterile dressings: cool wet dressings over more than 10% risk hypothermia.</p>' +
      '<p><b>Palm rule.</b> The patient’s own palm, fingers included, is about 1% of their body surface. Use it for small or scattered burns the big regions do not fit.</p>' +
      '<div class="bm2-ref-slot" data-slot="terms"></div>' +
      '<p>Test yourself has two quizzes: find a part on the body by name (ten at a time, with a hint and Show me), and Rule of Nines questions (estimate a total, or paint one).</p>' +
      '<p class="bm2-ref-s">3D model and figures from BodyParts3D, © 2008 Life Science Integrated Database Center, CC BY-SA 2.1 Japan; 3D drawing by three.js (MIT). A real anatomical model, not to scale. For exam study only. Follow your local protocols and medical direction.</p>';
    ref.querySelector('.bm2-ref-how').addEventListener('click', function(){
      if(studio){ if(studio.kit2 && studio.kit2.mode() !== 'explore') studio.kit2.go('explore'); if(studio.close) studio.close(); }
      setTimeout(startTour, 60);
    });
    function slot(name, nodes){ var s = ref.querySelector('[data-slot="' + name + '"]'); [].concat(nodes).forEach(function(n){ if(n) s.appendChild(n); }); }

    /* ---------------------------------------------------- size */
    var rt = 0;
    function onSize(){ clearTimeout(rt); rt = setTimeout(function(){ if(St.card) place(false); if(cue && cue.active()) cue.place(); }, 60); }
    if(window.ResizeObserver) new ResizeObserver(onSize).observe(scene); else window.addEventListener('resize', onSize);

    var api = {
      stage: stage, ref: ref, slot: slot, home: home,
      attach: function(v){
        V = v;
        v.on('frame', function(){ if(St.on) frame(); });
        v.on('hover', onHover);
        v.on('layers', fillFind);
        v.on('load', function(){ fillFind(); showCue(); });
        fillFind();
      },
      onSelect: onSelect, onPick: onPick,
      tab: function(id){ if(id === undefined) return St.tab; setTab(id, false); },
      burns: function(){ upBurns(); return BI; },
      // Explore leaves the screen: every fade finishes at once, nothing keeps running, the card's place is kept
      hidden: function(){
        St.on = false;
        if(lt){ cancelAnimationFrame(lt); lt = 0; }
        hideTip(); hideCue(false); tour.stop(); tourB.stop();
        if(BI) BI.finish();
        if(St.pending){ St.pending = null; }
      },
      shown: function(){
        St.on = true;
        if(home.parentNode !== body) body.insertBefore(home, body.firstChild);
        if(V){ fillFind(); St.sel = V.selected(); if(!St.sel){ closeCard(true); } else if(St.card !== St.sel){ St.pending = St.sel; later(); } window.dispatchEvent(new Event('resize')); }
        if(St.tab === 'burns') upBurns();
        paintCause();
        setTimeout(showCue, 300);
      },
      _st: St, card: function(){ return St.card; }, cause: cause
    };
    paintCause();
    return api;
  }

  window.NremtBodyMap = { build: build, SECTIONS: SECTIONS };
})();
