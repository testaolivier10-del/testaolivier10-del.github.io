/* A&P 3D anatomy, tools v2 Explore (docs/tools-v2-anp-anatomy-3d-brief.md). One idea: every structure has its place
   in the body; tap it on the real 3D body and its name opens on it, the line under the picture says where it is.

   Five regions, one per tab (data: assets/tool-data/anatomy-3d.json, "explore.tabs"): the region's body systems are
   in play and drawn in full, every other structure stays as a faint ghost so the region keeps its place in the body;
   the camera frames the region. The one control is the body: tap a part (the shared viewer's own picking,
   assets/body3d/viewer.js), drag to turn it, or find a part by name (the magnifier on the picture). The part glows
   where it is (the camera stays, so the student sees where it sits), then its name opens on a card beside it (the
   shared K.spots of assets/course/tool-kit2.js, projected from the 3D view) and the cause line says where it is.
   Every change eases: the ghost fades in and out, the camera travels between regions, the glow grows, the card
   grows once the picture has settled. Nothing is graded here: naming, pointing, Study and the timed practical are
   Test yourself (anatomy-3d.js).

   One viewer serves both modes: anatomy-3d.js mounts it on o.view and moves that element between this stage and
   Test yourself's. build({ data, view, base, studio, onTest(tabId) }) -> { stage, ref, attach(viewer), shown(on),
   tab(id?), tabFor({ system, chapter, structure }), pick(id), current() } or null without the kit or the tabs. */
(function(){
  'use strict';
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var PREF = 'anp_3d_explore_v1';
  function load(){ try{ return JSON.parse(localStorage.getItem(PREF) || '{}') || {}; }catch(e){ return {}; } }
  function save(p){ try{ localStorage.setItem(PREF, JSON.stringify(p)); }catch(e){} }
  var touch = (function(){ try{ return matchMedia('(pointer: coarse)').matches; }catch(e){ return false; } })();

  function build(o){
    var K = window.LevlKit2, D = o.data, B = o.base || '../';
    var TABS = D && D.explore && D.explore.tabs ? D.explore.tabs.slice() : [];
    if(!K || !TABS.length) return null;
    var BY = {}; D.structures.forEach(function(s){ BY[s.id] = s; });
    // a tab holds the structures of its systems that are published (the data is filtered by built topic)
    TABS.forEach(function(t){ t.items = D.structures.filter(function(s){ return t.systems.indexOf(s.system) > -1; }); });
    TABS = TABS.filter(function(t){ return t.items.length; });
    if(!TABS.length) return null;
    var tabOfSys = {}; TABS.forEach(function(t){ t.systems.forEach(function(k){ tabOfSys[k] = t; }); });
    var pref = load(), picks = pref.picks || {};
    var cur = TABS.filter(function(t){ return t.id === pref.tab; })[0] || TABS[0];
    var viewer = null, spots = null, cue = null, cueAt = null, onScreen = false, started = false, piece = {}, drawnBox = null;

    var stage = document.createElement('div'); stage.className = 'ax';
    var tabs = K.tabs({ label: 'Which part of the body', items: TABS.map(function(t){ return { value: t.id, label: t.label, short: t.short }; }), value: cur.id, big: true,
      onChange: function(v){ setTab(v, true); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: cur.purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var scene = document.createElement('div'); scene.className = 'ax-scene'; scene.id = 'ax-scene';
    scene.innerHTML = '<div class="ax-slot"></div><div class="ax-over"><svg class="ax-zero" aria-hidden="true" focusable="false"></svg></div>' +
      '<form class="ax-find" role="search"><button type="button" class="ax-find-b" aria-label="Find a part by name" aria-expanded="false"></button><label class="tk2-sr" for="ax-find-in">Find a part by name</label>' +
      '<input id="ax-find-in" class="ax-find-in" type="search" placeholder="Find a part" autocomplete="off" spellcheck="false" enterkeyhint="search"></form>' +
      '<button type="button" class="ax-reset"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>Reset view</button>' +
      '<p class="ax-credit">BodyParts3D, CC BY 4.0</p>';
    stage.appendChild(scene);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', scene.id); });
    var slot = scene.querySelector('.ax-slot'), over = scene.querySelector('.ax-over'), form = scene.querySelector('.ax-find'),
      fin = scene.querySelector('.ax-find-in'), fb = scene.querySelector('.ax-find-b'), resetB = scene.querySelector('.ax-reset');
    var layer = K.layer(over);
    var lines = document.createElement('div'); lines.className = 'ax-lines';
    var cause = K.cause({ label: 'Where it is' });
    lines.appendChild(cause.el);
    stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    /* the body fills the stage: the full width, and on a desktop as tall as the screen leaves room for */
    function fit(){
      if(!stage.isConnected || !scene.clientWidth) return;
      var H = window.innerHeight, h;
      if(window.innerWidth >= 1000){
        var sb = o.studio && o.studio.stage ? o.studio.stage.getBoundingClientRect().bottom : H;
        var bottom = Math.min(H, sb > 0 ? sb : H);
        h = Math.max(380, bottom - scene.getBoundingClientRect().top - lines.offsetHeight - 22);
      } else {
        // a phone or tablet: a share of the screen (the page scrolls), never measured from the stage itself
        h = Math.round(Math.max(340, Math.min(H * (window.innerWidth <= 640 ? 0.6 : 0.62), window.innerWidth * 1.5)));
      }
      scene.style.height = Math.round(h) + 'px';
      var cv = o.view.querySelector('canvas');
      if(cv && cv.style.height !== '100%') cv.style.height = '100%';
      if(viewer && cv && o.view.parentNode === slot) window.dispatchEvent(new Event('resize'));
      place();
    }

    function ids(t){ return t.items.map(function(s){ return s.id; }); }
    function where(it){ return it ? [{ t: it.label || it.name, role: 'name', say: it.name }, { t: it.at, role: 'at', say: it.at }] : []; }
    var pending = null;            // the line waits with the card until the picture has settled
    function place(){
      if(!spots || !onScreen) return;
      spots.place();
      var cardEl = spots.el.querySelector('.tk2-spot-card');
      if(pending && viewer && !viewer.settling() && spots.picked() === pending.it && cardEl && !cardEl.hidden){
        var it = pending.it; pending = null;
        cause.set(where(BY[it.id]));   // the piece tapped ("Right humerus") is the card's second line, on the picture
        if(pendingSay){ say(pendingSay); pendingSay = ''; }
        if(onScreen && !started){ started = true; makeCue(); }
      } else if(pending && viewer && !viewer.settling() && spots.picked() === pending.it && !pending.framed){
        // a part found by name that lies off the region's picture (the far end of the inferior vena cava): the camera
        // takes in the region and that part, once, then the card grows
        var pp = viewer.project(pending.it.id), w = over.clientWidth, h = over.clientHeight;
        if(!pp || !pp.front || pp.x < 0 || pp.y < 0 || pp.x > w || pp.y > h){
          pending.framed = true; wide = pending.it.id;
          viewer.frame((cur.frame && cur.frame.length ? cur.frame : ids(cur)).concat([pending.it.id]), cur.pad || 1.3, cur.dir || null);
        }
      }
    }
    var pendingSay = '', wide = null;

    // the card names the part in 1 to 3 words (its short label when the full name is longer); find knows both
    function itemOf(s){ return { id: s.id, name: s.label || s.name, accept: (s.label ? [s.name] : []).concat(s.accept || []) }; }
    var items = D.structures.filter(function(s){ return tabOfSys[s.system]; }).map(itemOf);
    var itemBy = {}; items.forEach(function(it){ itemBy[it.id] = it; });
    /* the region's other parts' drawn middles, read at most every quarter second (the camera may be turning) */
    var nb = { t: 0, id: null, pts: [] };
    function neighbours(it){
      var now = performance.now();
      if(viewer && (now - nb.t > 250 || nb.id !== (it && it.id))){
        nb.t = now; nb.id = it && it.id; nb.pts = [];
        cur.items.forEach(function(s){ if(it && s.id === it.id) return; var p = viewer.project(s.id); if(p && p.front) nb.pts.push([p.x, p.y]); });
      }
      return nb.pts;
    }
    function makeSpots(){
      spots = K.spots(layer, { key: 'anp-anatomy-3d-spots', label: 'Parts of the body', items: items, chip: false,
        project: function(it){
          if(!viewer) return null;
          var pc = piece[it.id], p = viewer.project(it.id, pc ? pc.part : null), w = over.clientWidth, h = over.clientHeight;
          if(!p || !p.front || p.x < 0 || p.y < 0 || p.x > w || p.y > h) return null;
          drawnBox = p.box;
          return [p.x, p.y, p.r];
        },
        wait: function(){ return !!viewer && viewer.settling(); },
        // the card keeps off the buttons and off the whole named structure (both of a pair, every rib)
        avoid: function(){
          var a = [form.getBoundingClientRect(), resetB.getBoundingClientRect()];
          if(drawnBox){ var r = over.getBoundingClientRect(), b = drawnBox; a.push({ left: r.left + b[0], top: r.top + b[1], width: b[2] - b[0], height: b[3] - b[1] }); }
          return a;
        },
        // the other parts of the region, where they are drawn: the card keeps off them when it can (a lower weight)
        others: function(it){ return neighbours(it); },
        onPick: function(it, how){
          cause.set([]);
          pending = it ? { it: it } : null;
          // after the camera widened for a part off the region's picture, the next part goes back to the region's
          // own frame once (if that one is off the picture too, the camera widens for it again)
          if(it && wide && it.id !== wide){ wide = null; frameTab(); }
          if(it){ picks[cur.id] = it.id; pref.picks = picks; save(pref); }
          if(how === 'tap' || how === 'key' || how === 'find'){ hideCue(true); tourDid(how === 'find' ? 'find' : 'tap'); }
          pendingSay = it ? BY[it.id].name + (piece[it.id] ? ', ' + piece[it.id].name : '') + ': ' + BY[it.id].at + '.' : '';
          refHtml();
        } });
    }

    /* the viewer tells us what was tapped; a part of another region is named after its tab comes in */
    var quiet = 0;
    function onSelect(key, c, part){
      if(!onScreen || quiet) return;
      if(!key){ if(spots && spots.picked()) spots.pick(null, 'tap'); cause.set([]); refHtml(); return; }
      var s = BY[key]; if(!s || !tabOfSys[s.system]) return;
      setPiece(s, part);
      if(tabOfSys[s.system] !== cur){ go(s.id, 'tap'); return; }
      spots.pick(s.id, 'tap');
    }
    function setPiece(s, part){
      var pn = part && D.partNames && D.partNames[part];
      piece[s.id] = pn && s.parts.length > 1 && pn !== s.name ? { part: part, name: pn } : null;
      if(itemBy[s.id]) itemBy[s.id].sub = piece[s.id] ? piece[s.id].name : '';
    }
    function select(id){ quiet++; try{ viewer.select(id); } finally { quiet--; } }

    /* go(id): name a structure, switching to its tab first when it is on another */
    function go(id, how){
      var s = BY[id]; if(!s || !tabOfSys[s.system]) return;
      var t = tabOfSys[s.system];
      if(t !== cur){ picks[t.id] = id; setTab(t.id, true, how || 'find'); return; }
      if(viewer) select(id);
      spots.pick(id, how || 'set');
    }

    var token = 0;
    /* run fn once the camera and the looks have settled (or at once without the model yet) */
    function settled(fn){
      var my = token, n = 0;
      (function wait(){
        if(my !== token || !onScreen) return;
        if(viewer && viewer.loaded() && (viewer.settling() || n < 2)){ n++; setTimeout(wait, 40); return; }
        fn();
      })();
    }
    // the camera frames the tab's own list when it has one (the heart, not every vessel of the trunk), from its side
    function frameTab(){ if(viewer && viewer.loaded()) viewer.frame(cur.frame && cur.frame.length ? cur.frame : ids(cur), cur.pad || 1.3, cur.dir || null); }
    function setTab(id, user, how, reframe){
      var t = TABS.filter(function(x){ return x.id === id; })[0]; if(!t) return;
      var was = cur;
      cur = t; tabs.value(t.id); head.purpose(t.purpose);
      pref.tab = t.id; save(pref);
      token++;
      if(spots && spots.picked()) spots.pick(null, 'set');
      cause.set([]); pending = null; wide = null;
      hideCue(!!user);
      fin.value = ''; form.classList.remove('is-miss');
      if(viewer && viewer.loaded()){
        quiet++;
        try{ viewer.clear(); viewer.setOnly(ids(t)); } finally { quiet--; }
        if(was !== t || user || reframe) frameTab();
      }
      var first = picks[t.id] && BY[picks[t.id]] && t.systems.indexOf(BY[picks[t.id]].system) > -1 ? picks[t.id] : t.first;
      settled(function(){
        if(!viewer || !viewer.loaded()) return;
        if(spots.picked()) return;   // a part the student tapped while the camera travelled stays named
        select(first); spots.pick(first, how || (user ? 'set' : 'set'));
        if(user && !how) say(t.label + '. ' + t.items.length + ' parts to find.');
      });
      refHtml();
      if(user){ try{ history.replaceState(null, '', location.pathname + location.search + '#body/' + t.id); }catch(e){} }
    }

    /* find a part by name (forgiving: K.spots find), across every tab */
    function doFind(){
      var t = fin.value.trim(); if(!t){ form.classList.remove('is-miss'); return; }
      var it = spots && spots.match(t);
      form.classList.toggle('is-miss', !it);
      if(!it){ say('No part called ' + t + ' in this model.'); return; }
      hideCue(true); tourDid('find');
      if(BY[it.id]) setPiece(BY[it.id], null);
      if(spots.picked() === it){ frameTab(); return; }
      go(it.id, 'find');
    }
    form.addEventListener('submit', function(e){ e.preventDefault(); doFind(); });
    function openFind(on){ form.classList.toggle('is-open', on); fb.setAttribute('aria-expanded', String(on)); if(on){ fin.focus(); hideCue(true); } place(); }
    fb.addEventListener('click', function(){ openFind(true); tourDid('find'); });
    fin.addEventListener('blur', function(){ setTimeout(function(){ if(!fin.value.trim() && document.activeElement !== fin){ openFind(false); form.classList.remove('is-miss'); } }, 120); });
    fin.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ fin.value = ''; openFind(false); fb.focus(); } });
    var ft = 0;
    fin.addEventListener('input', function(){ clearTimeout(ft); ft = setTimeout(function(){ if(fin.value.trim().length >= 3) doFind(); else form.classList.remove('is-miss'); }, 320); });
    resetB.addEventListener('click', function(){ hideCue(true); frameTab(); });
    // the first touch anywhere on the body (a tap or a turn) is the first move
    slot.addEventListener('pointerdown', function(){ hideCue(true); });

    /* the one first-visit cue: at another part of the region, clear of the card and the buttons */
    function makeCue(){
      if(!spots || !viewer || cue) return;
      var open = spots.picked(), cand = cur.items.filter(function(s){ return !open || s.id !== open.id; });
      var R = function(e){ return e.getBoundingClientRect(); }, meet = function(a, b){ return a.left < b.right + 4 && a.right > b.left - 4 && a.top < b.bottom + 4 && a.bottom > b.top - 4; };
      var w = over.clientWidth, h = over.clientHeight, P = [];
      // a point where a tap really names that part: the middle of one of its pieces, checked with the viewer's own pick
      cand.forEach(function(s){
        (s.parts.length > 1 ? s.parts.slice(0, 3) : [null]).some(function(part){
          var p = viewer.project(s.id, part);
          if(p && p.front && p.x > 40 && p.y > 50 && p.x < w - 40 && p.y < h - 40 && viewer.hit(p.x, p.y) === s.id){ P.push({ s: s, p: p }); return true; }
          return false;
        });
      });
      // the biggest drawn parts first: the cue points at something easy to hit
      P.sort(function(a, b){ return b.p.r - a.p.r; });
      var text = cur.id === 'skeleton' ? (touch ? 'Tap a bone' : 'Click a bone') : (touch ? 'Tap a part' : 'Click a part');
      for(var i = 0; i < Math.min(P.length, 8); i++){
        var sides = P[i].p.x < w / 2 ? ['right', 'left', 'below', 'above'] : ['left', 'right', 'below', 'above'];
        for(var k = 0; k < sides.length; k++){
          var at = [P[i].p.x, P[i].p.y];
          var c = K.cue(layer, { key: 'anp-anatomy-3d', text: text, side: sides[k], at: (function(q){ return function(){ return q; }; })(at) });
          if(!c.show()) return;
          var box = layer.el.querySelector('.tk2-cue'), r = box && R(box), sr = R(over);
          var bad = !r || r.left < sr.left + 2 || r.right > sr.right - 2 || r.top < sr.top + 2 || r.bottom > sr.bottom - 2;
          [].forEach.call(layer.el.querySelectorAll('.tk2-spot-card:not([hidden])'), function(e){ if(meet(R(e), r)) bad = true; });
          if(!bad && (meet(R(form), r) || meet(R(resetB), r))) bad = true;
          if(!bad){ cue = c; cueAt = { id: P[i].s.id, x: at[0], y: at[1] }; return; }
          c.hide(false);
        }
      }
    }
    function hideCue(used){ if(cue && cue.active()) cue.hide(used); if(used) cue = cue || { active: function(){ return false; }, hide: function(){}, place: function(){} }; }
    var tour = K.tour({ key: 'anp-anatomy-3d', label: 'Show me how', steps: [
      { id: 'tap', text: (touch ? 'Tap' : 'Click') + ' a part of the body. It glows where it is and its name opens beside it. Drag to turn the body.', target: function(){ return slot; } },
      { id: 'why', text: 'The line below says where that part is.', target: function(){ return cause.el; } },
      { id: 'find', text: 'Or find a part by its name here.', target: function(){ return form.classList.contains('is-open') ? fin : fb; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(id){ if(tour.active()) tour.did(id); }
    function startTour(){ hideCue(false); tour.start(true); }

    /* "?": how to use it, the named part's full card, every part of the region by name, the model and its credit */
    var ref = document.createElement('div'); ref.className = 'ls-sec ax-ref';
    function topic(id){ var ts = (window.AnpCurriculum || {}).topics || []; return ts.filter(function(t){ return t.id === id; })[0] || null; }
    function refHtml(){
      var p = spots && spots.picked() && BY[spots.picked().id], t = p && topic(p.topic);
      var rel = p ? (p.related || []).map(function(r){ return BY[r]; }).filter(function(r){ return r && tabOfSys[r.system]; }) : [];
      ref.innerHTML = '<h3 class="ls-h">' + esc(cur.label) + '</h3>' +
        '<p>' + (touch ? 'Tap' : 'Click') + ' any part of the body: it glows where it is, its name opens beside it and the line under the picture says where it is. Drag to turn the body, pinch or scroll to zoom, and Reset view brings the region back. Tap the same part again, or empty space, to let it go. The rest of the body stays as a faint ghost, so you can see where this region sits.</p>' +
        (p ? '<div class="ax-card"><p class="ax-k">' + esc((D.systems || {})[p.system] || p.system) + '</p><h4 class="ax-n">' + esc(p.name) + '</h4>' +
          '<dl class="ax-dl"><dt>What it is</dt><dd>' + esc(p.what) + '</dd><dt>Where it is</dt><dd>' + esc(p.where) + '</dd><dt>Key features</dt><dd>' + esc(p.features) + '</dd></dl>' +
          (p.note ? '<p class="ls-sub">' + esc(p.note) + '</p>' : '') +
          (rel.length ? '<p class="ax-k">Related</p><p class="ax-rel">' + rel.map(function(r){ return '<button type="button" class="ax-go" data-go="' + esc(r.id) + '">' + esc(r.name) + '</button>'; }).join('') + '</p>' : '') +
          (t && t.built ? '<p>Taught in <a href="' + esc(B + 'lessons/' + t.id + '.html') + '">' + esc(t.title) + '</a> · <a href="' + esc(B + 'notes/' + t.id + '.html') + '">notes</a></p>' : '') + '</div>' : '') +
        '<p class="ax-k">Every part here</p><p class="ax-rel">' + cur.items.slice().sort(function(a, b){ return a.name.localeCompare(b.name); }).map(function(s){ return '<button type="button" class="ax-go" data-go="' + esc(s.id) + '">' + esc(s.name) + '</button>'; }).join('') + '</p>' +
        '<p class="ls-sub">Naming each part, pointing to it, Study and the timed practical are in Test yourself, for every structure of the model.</p>' +
        '<p><button type="button" class="btn-outline ax-test">Quiz me on this region</button></p>' +
        '<p class="ls-sub">' + esc(D.model.contains) + ' ' + esc(D.model.missing) + '</p>' +
        '<p class="ls-sub">' + D.model.credit + ' 3D rendering: three.js (MIT).</p>' +
        '<p><button type="button" class="tk2-link ax-how">Show me how</button></p>';
    }
    ref.addEventListener('click', function(e){
      var g = e.target.closest('.ax-go');
      if(g){ if(o.studio) o.studio.close(); var id = g.getAttribute('data-go'); if(BY[id]) setPiece(BY[id], null); go(id, 'key'); return; }
      if(e.target.closest('.ax-test')){ if(o.studio) o.studio.close(); if(o.onTest) o.onTest(cur.id); return; }
      if(e.target.closest('.ax-how')){ if(o.studio) o.studio.close(); setTimeout(startTour, 60); }
    });

    var rz = 0;
    function resized(){ clearTimeout(rz); rz = setTimeout(function(){ if(onScreen) fit(); }, 60); }
    window.addEventListener('resize', function(e){ if(e.isTrusted) resized(); });
    if(window.ResizeObserver){ var ro = new ResizeObserver(resized); ro.observe(scene); }

    makeSpots();
    refHtml();

    /* attach(viewer): the shared viewer, once mounted (anatomy-3d.js) */
    function attach(v){
      viewer = v;
      v.on('select', onSelect);
      v.on('frame', function(){ if(onScreen) place(); });
      v.on('pick', function(key){ if(onScreen && !key && spots.picked()){ quiet++; try{ v.clear(); } finally { quiet--; } spots.pick(null, 'tap'); cause.set([]); refHtml(); hideCue(true); } });
      v.on('load', function(){ if(onScreen) enter(true); });
    }
    /* Explore takes the viewer: its region in play, the skin off, every tap selects, nothing marked */
    function enter(first){
      if(!viewer) return;
      if(o.view.parentNode !== slot) slot.appendChild(o.view);
      fit();
      if(!viewer.loaded()) return;
      quiet++;
      try{
        viewer.set({ selectFly: false, fadeOthers: 0.42, selectOnTop: true }); viewer.marks({}); viewer.highlight([]); viewer.tag(null); viewer.setPickSelects(true); viewer.setSkin(false);
      } finally { quiet--; }
      // after the loading still has cross faded to the live body, the camera travels into the region
      // every entry (the first, and each return from Test yourself, whose camera flew close) frames the region again
      if(first) setTimeout(function(){ if(onScreen) setTab(cur.id, false, null, true); }, K.reduced() ? 0 : 520);
      else setTab(cur.id, false, null, true);
    }
    function shown(on){
      var was = onScreen;
      onScreen = !!on;
      if(!on){ token++; pending = null; hideCue(false); if(tour.active()) tour.stop(); clearTimeout(ft); clearTimeout(rz); if(spots && spots.picked()) spots.pick(null, 'set'); cause.set([]); return; }
      if(!was) setTimeout(function(){ if(onScreen) enter(false); }, 0);
    }
    var api = {
      stage: stage, ref: ref, attach: attach, shown: shown,
      tab: function(v){ if(v === undefined) return cur.id; if(onScreen) setTab(v, false); else { var t = TABS.filter(function(x){ return x.id === v; })[0]; if(t){ cur = t; tabs.value(t.id); head.purpose(t.purpose); } } },
      tabs: TABS,
      /* tabFor({ tab } | { structure } | { system } | { chapter, chapterOf }) -> a tab id or null */
      tabFor: function(q){
        if(q.tab) return TABS.some(function(t){ return t.id === q.tab; }) ? q.tab : null;
        if(q.structure){ var s = BY[q.structure]; return s && tabOfSys[s.system] ? tabOfSys[s.system].id : null; }
        if(q.system) return tabOfSys[q.system] ? tabOfSys[q.system].id : null;
        if(q.chapter && q.chapterOf){
          var n = {}; D.structures.forEach(function(s){ if(q.chapterOf(s) === q.chapter && tabOfSys[s.system]) n[tabOfSys[s.system].id] = (n[tabOfSys[s.system].id] || 0) + 1; });
          var best = null; Object.keys(n).forEach(function(k){ if(!best || n[k] > n[best]) best = k; });
          return best;
        }
        return null;
      },
      /* pick(id): open on that structure (?focus=, "See it in 3D") */
      pick: function(id){ var s = BY[id]; if(!s || !tabOfSys[s.system]) return false; var t = tabOfSys[s.system]; picks[t.id] = id; pref.picks = picks; save(pref); api.tab(t.id); return true; },
      current: function(){ return spots && spots.picked() ? spots.picked().id : null; },
      show: function(id, how){ go(id, how || 'find'); },
      _spots: function(){ return spots; }, _cueAt: function(){ return cue && cue.active() ? cueAt : null; }, _cause: function(){ return cause; }, _viewer: function(){ return viewer; }
    };
    window.AnpAnatomyExplore.current = api;   // for the sweep test (scripts/tools-v2/anp-anatomy-3d-sweep.mjs)
    return api;
  }

  window.AnpAnatomyExplore = { build: build };
})();
