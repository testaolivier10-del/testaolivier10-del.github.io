/* A&P Lab practical, tools v2 Explore (docs/tools-v2-anp-lab-practical-brief.md). One idea: every structure on a lab
   figure has a name and a job; tap it and the name opens on the picture, the job under it.

   Six specimens, one per tab (data: assets/tool-data/lab-specimens.json, built from data/tools/lab-specimens.json):
   a lab figure drawn clean (no printed labels, no leader lines; figures/specimens/, scripts/build-lab-specimens.py)
   with a pin on each structure where its printed leader line ended. The one control is the picture: tap a pin (the
   shared K.spots of assets/course/tool-kit2.js), or find one by name (the magnifier on the plate). The name opens on a card beside the pin
   (on the side its printed label was) and the cause line says what that structure does, in two pills. Nothing is
   graded here: naming against the clock, Study, Quiz and the timed practical are Test yourself (lab-practical.js).

   build({ data, base, studio, onQuiz(setId) }) -> { stage, ref, shown(on), tab(id?), tabFor({ set, figure,
   station, chapter, topic, topicOf }), setOf(id), pick(label) } or null without the kit or the data. */
(function(){
  'use strict';
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var PREF = 'anp_lab_explore_v1';
  function load(){ try{ return JSON.parse(localStorage.getItem(PREF) || '{}') || {}; }catch(e){ return {}; } }
  function save(p){ try{ localStorage.setItem(PREF, JSON.stringify(p)); }catch(e){} }

  function build(o){
    var K = window.LevlKit2, D = o.data, B = o.base || '../';
    if(!K || !D || !D.specimens || !D.specimens.length) return null;
    var specs = D.specimens, pref = load();
    var cur = specs.filter(function(s){ return s.id === pref.tab; })[0] || specs[0];
    var picks = pref.picks || {};               // each tab keeps the part last named on it
    var onScreen = false, started = false, spots = null, cue = null;

    var stage = document.createElement('div'); stage.className = 'lx';
    var tabs = K.tabs({ label: 'Which specimen', items: specs.map(function(s){ return { value: s.id, label: s.tab }; }), value: cur.id, big: true,
      onChange: function(v){ setTab(v, true); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: cur.purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var scene = document.createElement('div'); scene.className = 'lx-scene'; scene.id = 'lx-scene';
    scene.innerHTML = '<div class="lx-plate"><div class="lx-pic"><picture><source type="image/avif"><img class="lx-img" alt="" decoding="async"></picture>' +
      '<svg class="lx-svg" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<form class="lx-find" role="search"><button type="button" class="lx-find-b" aria-label="Find a part by name" aria-expanded="false"></button><label class="tk2-sr" for="lx-find-in">Find a part by name</label>' +
      '<input id="lx-find-in" class="lx-find-in" type="search" placeholder="Find a part" autocomplete="off" spellcheck="false" enterkeyhint="search"></form>' +
      '<p class="lx-credit">OpenStax, CC BY 4.0</p></div>';
    stage.appendChild(scene);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', scene.id); });
    var plate = scene.querySelector('.lx-plate'), pic = scene.querySelector('.lx-pic'), img = scene.querySelector('.lx-img'),
      src = scene.querySelector('source'), svg = scene.querySelector('.lx-svg'), form = scene.querySelector('.lx-find'), fin = scene.querySelector('.lx-find-in');
    var layer = K.layer(pic);
    var lines = document.createElement('div'); lines.className = 'lx-lines';
    var cause = K.cause({ label: 'What it does' });
    lines.appendChild(cause.el);
    stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    /* the picture fits the stage: as big as the width allows, and on a desktop as tall as the screen leaves room for */
    function fit(){
      if(!stage.isConnected || !plate.clientWidth) return;
      var c = cur.crop, w = plate.clientWidth - 16, H = window.innerHeight, room;
      if(window.innerWidth >= 1000){
        // a desktop: the studio's stage is a fixed box, so the picture takes the height left in it
        var sb = o.studio && o.studio.stage ? o.studio.stage.getBoundingClientRect().bottom : H;
        var bottom = Math.min(H, sb > 0 ? sb : H);
        room = Math.max(280, bottom - plate.getBoundingClientRect().top - lines.offsetHeight - 40);
      } else {
        // a phone or tablet: the stage has its natural height (the page scrolls), so the room is a share of the screen
        // (never measured from the stage itself, which would shrink with the picture)
        room = H * (window.innerWidth <= 640 ? 0.62 : 0.66);
      }
      var k = Math.min(w / c[2], room / c[3], 1.6);
      pic.style.width = Math.round(c[2] * k) + 'px'; pic.style.height = Math.round(c[3] * k) + 'px';
      if(spots) spots.place();
      if(cue && cue.active()) cue.place();
    }

    function itemOf(sp){ return { id: sp.label, name: sp.name, accept: sp.accept, side: sp.side, does: sp.does,
      at: sp.at.map(function(p){ return [p[0] - cur.crop[0], p[1] - cur.crop[1]]; }) }; }
    function line(it){
      if(!it){ cause.set([]); return; }
      cause.set([{ t: it.name, role: 'name' }, { t: it.does, role: 'does', say: it.does }]);
    }
    function setTab(id, user){
      var sp = specs.filter(function(s){ return s.id === id; })[0]; if(!sp) return;
      cur = sp; tabs.value(sp.id); head.purpose(sp.purpose);
      cause.set([]);   // the line waits with the card for the new picture
      pref.tab = sp.id; save(pref);
      var c = sp.crop;
      svg.setAttribute('viewBox', '0 0 ' + c[2] + ' ' + c[3]);
      pic.classList.add('is-swap');
      src.setAttribute('srcset', B + sp.avif); img.src = B + sp.src; img.alt = sp.alt + ' Printed labels are hidden; tap a dot to name a part.';
      img.width = c[2]; img.height = c[3];
      if(spots){ spots.el.remove(); spots = null; }
      if(cue && cue.active()) cue.hide(false);
      var items = sp.spots.map(itemOf);
      spots = K.spots(layer, { key: 'anp-lab-spots', label: 'Parts of the ' + sp.tab.toLowerCase(), items: items, chip: false, avoid: function(){ return [form.getBoundingClientRect()]; },
        onPick: function(it, how){
          line(it);
          if(it){ picks[cur.id] = it.id; pref.picks = picks; save(pref); }
          if(how === 'tap' || how === 'key' || how === 'find'){ hideCue(true); tourDid(how === 'find' ? 'find' : 'tap'); say(it ? it.name + ': ' + it.does + '.' : 'No part named.'); }
        } });
      fit();
      var first = picks[sp.id] && items.some(function(x){ return x.id === picks[sp.id]; }) ? picks[sp.id] : items[0].id;
      // the card waits for the picture: it opens once the image has drawn
      function ready(){ pic.classList.remove('is-swap'); fit(); if(spots){ spots.pick(first, 'set'); } if(user) say(sp.tab + '. ' + items.length + ' parts to name.'); if(onScreen && !started){ started = true; makeCue(); } }
      if(img.complete && img.naturalWidth) setTimeout(ready, 0); else { img.onload = ready; img.onerror = ready; }
      fin.value = ''; form.classList.remove('is-miss', 'is-open');
      refHtml();
      if(user){ try{ history.replaceState(null, '', location.pathname + location.search + '#specimen/' + sp.id); }catch(e){} }
    }

    /* find a part by name (forgiving: K.spots find) */
    function doFind(){
      var t = fin.value.trim(); if(!t){ form.classList.remove('is-miss'); return; }
      var it = spots && spots.find(t);
      form.classList.toggle('is-miss', !it);
      if(!it) say('No part called ' + t + ' on this ' + cur.tab.toLowerCase() + '.');
    }
    form.addEventListener('submit', function(e){ e.preventDefault(); doFind(); });
    var fb = form.querySelector('.lx-find-b');
    function openFind(on){ form.classList.toggle('is-open', on); fb.setAttribute('aria-expanded', String(on)); if(on){ fin.focus(); hideCue(true); } }
    fb.addEventListener('click', function(){ openFind(true); tourDid('find'); });
    fin.addEventListener('blur', function(){ setTimeout(function(){ if(!fin.value.trim() && document.activeElement !== fin){ openFind(false); form.classList.remove('is-miss'); } }, 120); });
    fin.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ fin.value = ''; openFind(false); fb.focus(); } });
    var ft = 0;
    fin.addEventListener('input', function(){ clearTimeout(ft); ft = setTimeout(function(){ if(fin.value.trim().length >= 3) doFind(); else form.classList.remove('is-miss'); }, 260); });

    /* the one first-visit cue: at a pin away from the open card */
    function makeCue(){
      if(!spots || !spots.picked()) return;
      var open = spots.picked(), its = spots.items.filter(function(it){ return it !== open; });
      // pins far from the open card first; the bubble goes where it covers no pin, the card or the find button
      its.sort(function(a, b){ return Math.hypot(b.at[0][0] - open.at[0][0], b.at[0][1] - open.at[0][1]) - Math.hypot(a.at[0][0] - open.at[0][0], a.at[0][1] - open.at[0][1]); });
      var R = function(e){ return e.getBoundingClientRect(); }, meet = function(a, b){ return a.left < b.right + 3 && a.right > b.left - 3 && a.top < b.bottom + 3 && a.bottom > b.top - 3; };
      for(var i = 0; i < its.length; i++){
        for(var k = 0; k < 2; k++){
          var it = its[i], right = (it.at[0][0] < cur.crop[2] / 2) !== (k === 1);
          var c = K.cue(layer, { key: 'anp-lab-explore', text: 'Tap a dot', side: right ? 'right' : 'left', at: (function(q){ return function(){ return q; }; })(it.at[0]) });
          if(!c.show()) return;
          var box = layer.el.querySelector('.tk2-cue'), r = box && R(box), pr = R(pic), bad = !r || r.left < pr.left || r.right > pr.right || r.top < pr.top || r.bottom > pr.bottom;
          if(!bad) [].forEach.call(layer.el.querySelectorAll('.tk2-spot-pin, .tk2-spot-dot, .tk2-spot-card:not([hidden])'), function(e){ if(e.closest('.tk2-spot') === it._b) return; if(meet(R(e), r)) bad = true; });
          if(!bad && fb.offsetParent && meet(R(fb), r)) bad = true;
          if(!bad){ cue = c; return; }
          c.hide(false);
        }
      }
    }
    function hideCue(used){ if(cue && cue.active()) cue.hide(used); }
    var tour = K.tour({ key: 'anp-lab-explore', label: 'Show me how', steps: [
      { id: 'tap', text: 'Tap a dot on the picture. Its name opens beside it.', target: function(){ var p = spots && spots.items[1]; return p ? p._b : pic; } },
      { id: 'why', text: 'The line below says what that part does.', target: function(){ return cause.el; } },
      { id: 'find', text: 'Or find a part by its name here.', target: function(){ return form.classList.contains('is-open') ? fin : fb; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(id){ if(tour.active()) tour.did(id); }
    function startTour(){ hideCue(false); tour.start(true); }

    /* "?" for this specimen */
    var ref = document.createElement('div'); ref.className = 'ls-sec lx-ref';
    function topic(id){ var ts = (window.AnpCurriculum || {}).topics || []; return ts.filter(function(t){ return t.id === id; })[0] || null; }
    function refHtml(){
      var t = topic(cur.topic);
      ref.innerHTML = '<h3 class="ls-h">' + esc(cur.title) + '</h3>' +
        '<p>Each dot sits where the figure’s own label pointed. Tap a dot, use the arrow keys between dots, or type a name in “Find a part”. The name opens on the picture; the line under it says what the part does.</p>' +
        '<p class="ls-sub">The printed labels are hidden, so the figure is a specimen to name. Every label of all 83 image sets, the masked Study view, the scored quiz (name it or point to it) and the timed practical with its stations are in Test yourself.</p>' +
        '<p><button type="button" class="btn-outline lx-ref-q" data-s="' + esc(cur.set) + '">Quiz me on this set</button></p>' +
        (t && t.built ? '<p>Topic: <a href="' + esc(B + 'lessons/' + t.id + '.html') + '">' + esc(t.title) + '</a> · <a href="' + esc(B + 'notes/' + t.id + '.html') + '">notes</a></p>' : '') +
        '<p class="ls-sub lx-ref-credit">' + cur.attribution + '</p>' +
        '<p><button type="button" class="tk2-link lx-ref-how">Show me how</button></p>';
    }
    ref.addEventListener('click', function(e){
      var q = e.target.closest('.lx-ref-q'); if(q){ if(o.studio) o.studio.close(); if(o.onQuiz) o.onQuiz(q.getAttribute('data-s')); return; }
      if(e.target.closest('.lx-ref-how')){ if(o.studio) o.studio.close(); setTimeout(startTour, 60); }
    });

    var rz = 0;
    function resized(){ clearTimeout(rz); rz = setTimeout(function(){ if(onScreen) fit(); }, 60); }
    window.addEventListener('resize', resized);
    if(window.ResizeObserver){ var ro = new ResizeObserver(resized); ro.observe(plate); }

    setTab(cur.id, false);
    function shown(on){
      onScreen = !!on;
      if(!on){ hideCue(false); if(tour.active()) tour.stop(); clearTimeout(ft); clearTimeout(rz); return; }
      setTimeout(function(){ fit(); if(!started && spots && spots.picked()){ started = true; makeCue(); } }, 30);
    }
    var api = {
      stage: stage, ref: ref, shown: shown,
      tab: function(v){ if(v === undefined) return cur.id; setTab(v, false); },
      setOf: function(id){ var s = specs.filter(function(x){ return x.id === id; })[0]; return s ? s.set : null; },
      /* tabFor({ tab } | { set, station } | { chapter, topic }) -> a specimen id or null */
      tabFor: function(q){
        var hit = null;
        specs.forEach(function(s){
          if(hit) return;
          if(q.tab && q.tab === s.id) hit = s.id;
          else if(q.set && q.set === s.set && (!q.station || q.station === s.station)) hit = s.id;
          else if(q.topic && q.topic === s.topic) hit = s.id;
          else if(q.chapter && !q.topic && q.chapter === s.chapter) hit = s.id;
        });
        return hit;
      },
      pick: function(label){ return spots ? spots.pick(label, 'set') : null; },
      _spots: function(){ return spots; }, _cur: function(){ return cur; }, _specs: specs, _fit: fit
    };
    window.AnpLabExplore.current = api;   // for the sweep test (scripts/tools-v2/anp-lab-practical-sweep.mjs)
    return api;
  }

  window.AnpLabExplore = { build: build };
})();
