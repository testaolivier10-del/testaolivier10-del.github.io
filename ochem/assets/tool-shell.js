/* Shared chrome for a tool page.

   Above the tool: a way back to the hub, the tool's own name and one-line
   promise, and the share control, kept short so that on a phone the tool
   itself is on the first screen. Under it: the Keep going strip (lessons,
   glossary terms, Practice, the other tools), which build-tool-pages.mjs
   writes into the page from tools-registry.js, curriculum.js and the
   glossary. Rendering them from the registry rather than pasting them into
   eight files means a renamed tool is renamed everywhere.

   The page sets window.OCHEM_TOOL to its slug; everything else is looked up. */
(function(){
  var T = window.OchemTools;
  var mount = document.getElementById('tool-top');
  if(!T || !mount) return;

  var slug = window.OCHEM_TOOL || '';
  var tool = T.bySlug(slug);
  if(!tool) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* "Reaction Predictor" -> "Reaction predictor" (studio titles are sentence
     case); words with capitals inside (3D, SN2, Acid/Base) stay as they are. */
  function sentence(s){
    return String(s).split(' ').map(function(w, i){ return i && /^[A-Z][a-z]+$/.test(w) ? w.toLowerCase() : w; }).join(' ');
  }

  /* Same markup as topHtml() in build-tool-pages.mjs, which writes it into
     the page first; change both together. */
  mount.innerHTML =
    '<div class="tool-topbar">' +
      '<a class="tool-back" href="../tools.html">&larr; All tools</a>' +
      '<div class="tool-share" id="tool-share"></div>' +
    '</div>' +
    '<div class="tool-title">' +
      '<span class="tool-tile__mark"><svg viewBox="0 0 24 24" aria-hidden="true">' + tool.icon + '</svg></span>' +
      '<h1>' + esc(tool.name) + '</h1>' +
    '</div>' +
    '<p class="tool-lede">' + esc(tool.blurb) + '</p>';

  /* Premium tools (all but OchemPremium.FREE_TOOLS): a badge by the name,
     and once Premium launches, the gate in place of the tool for anyone
     without it. The tool's own script still runs underneath, unseen. */
  var G = window.OchemPremium, studio = null, quizEl = null, footEl = null, openAt = null, menuItems = [], kit2Api = null;

  /* Tool Studio (docs/tools-calm.md): a tool with `studio: true` in the
     registry gets the calm frame: slim top bar, stage + dock, Why / Details.
     The frame is built here; the tool's own script fills the stage and the
     dock through window.OchemStudio (see reaction-predictor.js). Keep going
     and Check yourself move into Details, the name and promise into About.
     Other tools are untouched until they set the flag. */
  if(tool.studio && window.LevlStudio){
    mount.parentNode.classList.add('ls-host');
    var about = document.createElement('div');
    about.className = 'ls-sec';
    about.innerHTML = '<p>' + esc(tool.blurb) + '</p><p class="ls-sub">' + esc(tool.tagline) + '</p>';
    var paid = G && !G.toolFree(slug);
    quizEl = document.getElementById('tool-quiz'); footEl = document.getElementById('tool-foot');
    openAt = function(el){ return function(){
      // a tools v2 page (kit2 below) keeps Check yourself in Test yourself, not in the "?" sheet
      if(el === quizEl && kit2Api && kit2Api.hasCheck){ studio.close(); kit2Api.go('quiz', 'check'); return; }
      studio.open('details', null); setTimeout(function(){ if(el && el.scrollIntoView) el.scrollIntoView({ block: 'start' }); var f = el && el.querySelector('h2, h3, summary, button, a'); if(f) try{ f.focus({ preventScroll: true }); }catch(e){} }, 80); }; }
    /* The standard frame (docs/tools-frame-2026-11.md, F1): name and one line in the bar, the modes there too,
       Share, "?" for the reference. Check yourself and Keep going stay in that sheet and are one tap from the menu
       (and from the finished card). */
    studio = window.LevlStudio.mount({
      title: sentence(tool.name), course: 'Organic Chemistry', back: '../tools.html', home: '../', slug: 'ochem-' + slug,
      host: mount, std: true,
      lede: ({ 'arrow-pusher': 'See how electrons move when bonds form and break.' })[slug] || tool.blurb,
      // "?" opens this sheet: named for what is in it
      detailsTitle: ({ 'synthesis': 'Problems and help', 'viewer-3d': 'View options and help', 'conformations': 'Numbers, builders and help' })[slug] || 'Help and reference',
      menu: {
        copyLink: true,
        report: { course: 'ochem', id: 'tool:' + slug },
        note: paid ? { label: 'Premium tool.', html: 'Part of Organic Chemistry Premium.' } : null,
        items: menuItems = [quizEl ? { label: 'Check yourself', icon: 'star', onClick: openAt(quizEl) } : null,
          footEl ? { label: 'Keep going', icon: 'chev', onClick: openAt(footEl) } : null].filter(Boolean)
      },
      about: about,
      details: [document.getElementById('tool-quiz'), document.getElementById('tool-foot')]
    });
    if(!document.querySelector('main')) studio.root.setAttribute('role', 'main');
    // The tool's drawings are styled under .tool-root (tools.css).
    studio.root.classList.add('tool-root');
    window.OchemStudio = studio;
  }

  /* Small helpers the ochem tools share when they arrange themselves in the
     studio (each tool's "Tool Studio" block uses them).
       seg(seg, attr)    adopt the tool's own .tseg as the mode switch; its
                         buttons' [attr] values are the mode names, and a
                         click switches the studio's mode-only parts. Returns
                         a function giving the mode now showing.
       builder(box)      a mounted molecule builder made calm: the type row
                         and its quick picks first, the canvas, palette and
                         atom tools behind "Draw it yourself".
       scrollChips(el)   every .tchips row inside el becomes one scrolling
                         row on a phone; group labels become .ls-lbl. */
  /* The finished card's extras, the same for every ochem tool: Full explanation (Why), Check yourself (the
     quiz, with its length), and the lesson (topic: a data-topic in Keep going; else its first lesson). */
  function extras(o){
    o = o || {};
    var out = [];
    if(o.why !== false) out.push({ label: o.whyLabel || 'Full explanation', open: 'why' });
    if(quizEl) out.push({ label: 'Check yourself, ' + (o.rounds || 6) + ' questions', onClick: openAt(quizEl) });
    var a = footEl && ((o.topic && footEl.querySelector('.tool-foot__list a[data-topic="' + o.topic + '"]')) || footEl.querySelector('.tool-foot__list a[data-topic]'));
    if(a) out.push({ label: 'Read the lesson: ' + a.textContent.trim(), href: a.getAttribute('href') });
    return out;
  }

  /* extras(o) above; menuItems: the menu's Check yourself and Keep going, for a tool that adds its own
     items (studio.menu({ items: Kit.menuItems.concat([...]) })). */
  /* chipPicker(sets, o): a tool's rows of scenario chips become ONE grouped dropdown on the stage (the standard
     frame). sets: [{ el, label }]; an .ap-group inside a set is its own group, named by its .ap-group__label.
     The chips stay in the page, out of sight: a pick clicks the chip, so the tool's own handler runs, and the
     dropdown follows whichever chip is on. o: { label, mode }. Returns the picker. */
  function chipPicker(sets, o){
    if(!studio || !studio.picker) return null;
    var groups = [], first = null;
    sets.forEach(function(set){
      if(!set.el) return;
      var gs = set.el.querySelectorAll('.ap-group');
      (gs.length ? [].slice.call(gs) : [set.el]).forEach(function(g){
        var lab = g.querySelector('.ap-group__label');
        var items = [].slice.call(g.querySelectorAll('[data-id]')).map(function(b){ return { value: b.getAttribute('data-id'), label: b.textContent.trim() }; });
        if(items.length){ groups.push({ label: lab ? lab.textContent.trim() : set.label, items: items }); if(!first) first = items[0].value; }
      });
    });
    function onChip(){ var on = null; sets.forEach(function(s){ if(!on && s.el) on = s.el.querySelector('[data-id].on'); }); return on; }
    var cur = onChip();
    var p = studio.picker({ label: o.label, groups: groups, value: cur ? cur.getAttribute('data-id') : first, onChange: function(v){
      var b = null; sets.forEach(function(s){ if(!b && s.el) b = s.el.querySelector('[data-id="' + v + '"]'); });
      if(b) b.click();
    } }, o.mode);
    sets.forEach(function(s){
      if(!s.el) return;
      s.el.classList.add('ls-chips-hidden');
      if(window.MutationObserver) new MutationObserver(function(){ var b = onChip(); if(b) p.value(b.getAttribute('data-id')); })
        .observe(s.el, { subtree: true, attributes: true, attributeFilter: ['class'] });
    });
    return p;
  }

  /* kit2(o): the tools v2 arrangement (docs/tools-v2-standard.md), this course layer's adapter for the shared kit
     (assets/course/tool-kit2.js; a tool with `kit2: true` in the registry loads it). The tool builds its own stage
     with the kit and hands it over:
       o.stage    element   the picture with its controls on it and the lines around it. EXPLORE shows it alone,
                            full width (no side panel, nothing graded).
       o.ref      element   the reference behind "?" (numbers, builders, how to read the picture), put first.
       o.parts    [{ value, label, dock: element, task: { kicker, title, todo } | fn }]   TEST YOURSELF parts that
                            ask on the same picture: the question goes in the side panel (dock).
       o.check    { label, task } | false   the page's Check yourself quiz (#tool-quiz) as the last part, in the
                            side panel with the picture left free (default on when the page has one).
       o.onShow(mode, part) after every switch: mode 'explore' | 'quiz', part the Test yourself part or null.
     Two modes only: Explore and Test yourself. With more than one part, ONE dropdown on the stage ("What to
     practice") picks it. #<part> in the address opens Test yourself there. Returns { mode(), part(), go(mode,
     part), hasCheck }. */
  function kit2(o){
    var K = window.LevlKit2;
    if(!studio || !K) return null;
    K.on(studio);
    var parts = (o.parts || []).slice();
    var hasCheck = !!quizEl && o.check !== false;
    if(hasCheck) parts.push({ value: 'check', label: (o.check && o.check.label) || 'Check yourself', dock: quizEl, task: (o.check && o.check.task) || null });
    var cur = { mode: 'explore', part: parts[0] ? parts[0].value : null };
    function partOf(v){ return parts.filter(function(p){ return p.value === v; })[0] || parts[0] || null; }
    studio.add('stage', o.stage, parts.length ? { mode: 'explore quiz' } : null);
    if(o.ref) studio.details.insertBefore(o.ref, studio.details.firstChild);
    parts.forEach(function(p){ if(p.dock) studio.add('dock', p.dock, { mode: 'quiz' }); });
    var pick = parts.length > 1 ? studio.picker({ label: 'What to practice', items: parts.map(function(p){ return { value: p.value, label: p.label }; }), value: cur.part,
      onChange: function(v){ show('quiz', v); } }, 'quiz') : null;
    function show(mode, part){
      var p = partOf(part), quiz = mode === 'quiz' && !!p;
      cur = { mode: quiz ? 'quiz' : 'explore', part: p ? p.value : null };
      if(studio.mode() !== cur.mode) studio.mode(cur.mode);
      studio.root.classList.toggle('tk2-qs', quiz);
      parts.forEach(function(x){ if(x.dock) x.dock.hidden = !(quiz && x === p); });
      if(pick && quiz && pick.value() !== p.value) pick.value(p.value);
      if(quiz){ studio.task(typeof p.task === 'function' ? p.task() : p.task || null, 'quiz'); studio.caption('', 'quiz'); }
      if(o.onShow) o.onShow(cur.mode, quiz ? cur.part : null);
    }
    if(parts.length) studio.modes({ items: [{ value: 'explore', label: 'Explore' }, { value: 'quiz', label: 'Test yourself' }], value: 'explore',
      onChange: function(v){ show(v, cur.part); } });
    var start = { mode: 'explore', part: cur.part };
    parts.forEach(function(p){ if(new RegExp('^#' + p.value + '\\b').test(location.hash)) start = { mode: 'quiz', part: p.value }; });
    if(parts.length) studio.mode(start.mode);
    show(start.mode, start.part);
    kit2Api = { mode: function(){ return cur.mode; }, part: function(){ return cur.part; }, go: function(m, p){ show(m, p == null ? cur.part : p); }, hasCheck: hasCheck };
    return kit2Api;
  }

  window.OchemStudioKit = {
    extras: extras,
    kit2: kit2,
    menuItems: menuItems,
    chipPicker: chipPicker,
    seg: function(seg, attr){
      if(!studio || !seg) return function(){ return null; };
      function now(){ var b = seg.querySelector('button.on') || seg.querySelector('button'); return b ? b.getAttribute(attr) : null; }
      seg.classList.add('ls-seg');
      studio.modes({ el: seg, value: now() });
      seg.addEventListener('click', function(e){
        if(e.target.closest('button')) studio.mode(now());
      });
      return now;
    },
    builder: function(box){
      var mb = box && box.querySelector('.mb');
      if(!mb || mb.getAttribute('data-ls')) return;
      mb.setAttribute('data-ls', '1');
      var d = document.createElement('details');
      d.className = 'tool-more mb-ls-draw';
      d.innerHTML = '<summary>Draw it yourself</summary>';
      ['.mb__canvaswrap', '.mb__tools'].forEach(function(s){ var e = mb.querySelector(s); if(e) d.appendChild(e); });
      // The checker's report goes in there too; a structure it cannot read
      // opens the drawer, so the reason is never hidden.
      var st = mb.querySelector('.mb__status');
      mb.appendChild(d);
      if(st){
        d.appendChild(st);
        if(window.MutationObserver) new MutationObserver(function(){ if(st.querySelector('.tnote--bad')) d.open = true; }).observe(st, { childList: true, subtree: true });
      }
      var q = mb.querySelector('.mb__quick'); if(q) q.classList.add('ls-scroll');
    },
    scrollChips: function(el){
      if(!el) return;
      el.querySelectorAll('.tchips').forEach(function(c){ c.classList.add('ls-scroll'); });
      el.querySelectorAll('.ap-group__label').forEach(function(l){ l.classList.add('ls-lbl'); });
    }
  };

  if(G && !G.toolFree(slug) && studio){
    // The gate takes the tool's place inside the studio, under its bar (back, ?, the menu), like every course's
    // locked tool (consistency audit 2026-11, C1). The page around it stays hidden, as for an open tool.
    var gateBox = document.createElement('div');
    G.lock({
      feature: 'tool', source: 'tool-' + slug,
      hide: [].slice.call(mount.parentNode.children).filter(function(el){ return el !== studio.root && el !== gateBox; }),
      after: gateBox,
      notes: '../learn.html', notesText: 'Read the free textbook',
      locked: function(){
        var on = G.locked();
        // gateBox goes into the studio's lock panel first, so lock() puts its card right after it, in the panel.
        if(on) studio.lock(gateBox); else studio.lock(false);
        return on;
      }
    });
  } else if(G && !G.toolFree(slug)){
    var top = mount;
    G.lock({
      feature: 'tool', source: 'tool-' + slug,
      hide: [].slice.call(top.parentNode.children).filter(function(el){ return el !== top; }),
      after: top,
      notes: '../learn.html', notesText: 'Read the free textbook',
      locked: function(){ return G.locked(); },
      badgeIn: top.querySelector('.eyebrow') || top.querySelector('h1'),
      badge: G.badge()
    });
  }

  /* Every tool can be linked to in the state you left it in, so the control
     is part of the shared chrome rather than something each tool remembers to
     add. Tools that keep nothing in the URL still get a working link to
     themselves, which is the honest floor. */
  if(window.OchemToolState){
    window.OchemToolState.mountShare(document.getElementById('tool-share'));
  }

  /* The Keep going strip (#tool-foot) is static markup from
     build-tool-pages.mjs, so it reads and links without JavaScript;
     tool-quiz.js points each answered question at its own lesson and term
     from the same links. */

  /* After a pick from a list that sits ABOVE or BELOW the work area, a phone may show no change
     at all because the work area is off-screen. showWork(el) brings it into view when it is not
     already mostly visible; on a wide screen it does nothing. */
  window.OchemShowWork = function(el){
    if(!el || window.innerWidth >= 900) return;
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    if(r.top >= 60 && r.top < vh * 0.55) return;
    var reduce = false; try{ reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
    var head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-h')) || 64;
    window.scrollTo({ top: window.scrollY + r.top - head - 8, behavior: reduce ? 'auto' : 'smooth' });
  };
})();
