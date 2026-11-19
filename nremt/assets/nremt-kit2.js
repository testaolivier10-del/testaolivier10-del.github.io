/* NREMT's adapter for the tools v2 kit (assets/course/tool-kit2.js; docs/tools-v2-standard.md). Loaded only by a
   page rebuilt to v2 (the first: nremt/mnemonics.html), after nremt-studio.js, so no other NREMT page changes.
   The pattern of ApBioTools.studioKit2 (bio/assets/tools/bio-tools.js).

     NremtStudio.kit2(s, o) -> { mode(), part(), go(mode, part) }   (also at s.kit2)
       o.stage    element   the picture with its controls on it and the lines around it. EXPLORE shows it alone,
                            full width (no side panel, nothing graded).
       o.ref      element   the reference behind "?".
       o.parts    [{ value, label, stage, dock, task: {..} | fn }]   TEST YOURSELF parts. A part with its own stage
                            shows it in place of the Explore picture; its dock is the side panel.
       o.start    fn(hash) -> { mode, part } | null   where a deep link opens (default: #test or #<part value>
                            opens that part; anything else Explore).
       o.onShow   fn(mode, part, user) after every switch (mode 'explore' | 'quiz').
     Two modes only: Explore and Test yourself; with more than one part, one dropdown on the stage picks it. */
(function(){
  'use strict';
  if(!window.NremtStudio || window.NremtStudio.kit2) return;

  function kit2(s, o){
    var K = window.LevlKit2;
    if(!s || !K) return null;
    K.on(s);
    var parts = (o.parts || []).slice(), cur = { mode: 'explore', part: parts[0] ? parts[0].value : null };
    function partOf(v){ return parts.filter(function(p){ return p.value === v; })[0] || parts[0] || null; }
    s.add('stage', o.stage, parts.length ? { mode: 'explore' } : null);
    if(o.ref) s.add('details', o.ref);
    parts.forEach(function(p){
      if(p.stage) s.add('stage', p.stage, { mode: 'quiz' });
      if(p.dock) s.add('dock', p.dock, { mode: 'quiz' });
    });
    var pick = parts.length > 1 ? s.picker({ label: 'What to practice', items: parts.map(function(p){ return { value: p.value, label: p.label }; }), value: cur.part,
      onChange: function(v){ show('quiz', v, true); } }, 'quiz') : null;
    function show(mode, part, user){
      var p = partOf(part), quiz = mode === 'quiz' && !!p;
      cur = { mode: quiz ? 'quiz' : 'explore', part: p ? p.value : null };
      if(s.mode() !== cur.mode) s.mode(cur.mode);
      o.stage.hidden = quiz;
      parts.forEach(function(x){ var on = quiz && x === p; if(x.stage) x.stage.hidden = !on; if(x.dock) x.dock.hidden = !on; });
      if(pick && quiz && pick.value() !== p.value) pick.value(p.value);
      if(quiz && p.task) s.task(typeof p.task === 'function' ? p.task() : p.task, 'quiz');
      if(o.onShow) o.onShow(cur.mode, quiz ? cur.part : null, user);
    }
    if(parts.length) s.modes({ items: [{ value: 'explore', label: 'Explore' }, { value: 'quiz', label: 'Test yourself' }], value: 'explore',
      onChange: function(v){ show(v, cur.part, true); } });
    var h = location.hash, start = { mode: 'explore', part: cur.part };
    var custom = o.start ? o.start(h) : null;
    if(custom) start = { mode: custom.mode, part: custom.part || cur.part };
    else if(/^#test\b/.test(h)) start = { mode: 'quiz', part: cur.part };
    else parts.forEach(function(p){ if(new RegExp('^#' + p.value + '\\b').test(h)) start = { mode: 'quiz', part: p.value }; });
    s.mode(start.mode);
    show(start.mode, start.part, false);
    s.kit2 = { mode: function(){ return cur.mode; }, part: function(){ return cur.part; }, go: function(m, p){ show(m, p == null ? cur.part : p, false); } };
    return s.kit2;
  }
  window.NremtStudio.kit2 = kit2;
})();
