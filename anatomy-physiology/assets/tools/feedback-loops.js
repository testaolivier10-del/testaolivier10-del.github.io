/* Feedback loop builder (docs/anp-spec.md section 8.3).

   Every loop in the course has the same seven slots: Stimulus, Receptor
   (sensor), Afferent pathway, Control center, Efferent pathway, Effector,
   Response. The learner fills them from shuffled cards (some cards belong in
   no slot) by tapping or by keyboard: pick a slot, then the card for it; the
   next empty slot is picked automatically. Each slot is checked on its own
   with an explanation. Then the learner classifies the loop (negative or
   positive feedback) and predicts what happens when one named part fails.
   The finished loop is drawn as a ring in the course's visual language:
   afferent parts in the afferent color, efferent parts in the efferent
   color, "causes" arrows all the way round.

   Content: data/tools/feedback-loops.json (checked by
   scripts/lib/anp-tool-checks/feedback-loops.mjs). Items are recorded with
   AnpCore.toolResult('feedback-loops', ...) as feedback-loops:<loop>:<slot>,
   feedback-loops:<loop>:kind and feedback-loops:<loop>:failure. A finished
   loop sends the anp-loop-complete event.

   URL: ?chapter=<id> or ?topic=<id> filter the list; ?id=<loop> opens one.
   With no ?id the page opens on the next loop not yet built right (in the
   filtered list), with the whole list one tap away in a compact picker
   (AnpToolKit.picker); "Next loop" walks on through the list. */
(function(){
  'use strict';
  var app = document.getElementById('app');
  if(!app) return;
  var KIND = 'feedback-loops';
  var SLOTS = ['stimulus', 'sensor', 'afferent', 'control', 'efferent', 'effector', 'response'];
  var LABELS = { stimulus: 'Stimulus', sensor: 'Receptor (sensor)', afferent: 'Afferent pathway', control: 'Control center', efferent: 'Efferent pathway', effector: 'Effector', response: 'Response' };
  var DATA = null, filterCh = '', filterTopic = '', queue = [], qi = 0, uid = 0, booted = false;
  var startTab = param('mode') === 'test' ? 'test' : 'live', activeLive = null;
  function stopLive(){ if(activeLive){ activeLive.stop(); activeLive = null; } }

  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function core(){ return window.AnpCore || null; }
  function cur(){ return window.AnpCurriculum || { chapters: [], topics: [] }; }
  function base(){ return window.ANP_BASE || '../'; }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function param(k){ try{ return new URLSearchParams(window.location.search).get(k); }catch(e){ return null; } }
  function topicOf(id){ var ts = cur().topics; for(var i = 0; i < ts.length; i++) if(ts[i].id === id) return ts[i]; return { id: id, title: id, chapter: '' }; }
  function chapterOf(id){ var cs = cur().chapters; for(var i = 0; i < cs.length; i++) if(cs[i].id === id) return cs[i]; return { id: id, title: id }; }
  function report(id){ return window.LevlReport ? window.LevlReport.button('anp', id) : ''; }
  function focusEl(el){ if(!el) return; if(!el.hasAttribute('tabindex') && !/^(BUTTON|A|SELECT|INPUT)$/.test(el.tagName)) el.setAttribute('tabindex', '-1'); el.focus(); }
  // Slot names in running text: lower case, except the fixed label "Receptor (sensor)".
  function lower(k){ return k === 'sensor' ? LABELS[k] : LABELS[k].toLowerCase(); }
  function itemBase(l){ return 'feedback-loops:' + l.id + ':'; }

  /* ------------------------------------------------------------ load */
  app.classList.add('fl-app');
  app.innerHTML = '<p class="fl-loading anp-hint">Loading feedback loops…</p>';
  fetch(app.getAttribute('data-src') || (base() + 'data/tools/feedback-loops.json'))
    .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(init)
    .catch(function(){ app.innerHTML = '<p class="anp-hint">The loops could not be loaded. Check your connection and reload the page.</p>'; });

  function init(data){
    DATA = data;
    DATA.loops.forEach(function(l){ l.chapter = topicOf(l.topic).chapter; });
    var ch = param('chapter'), tp = param('topic'), one = param('id');
    if(tp && DATA.loops.some(function(l){ return l.topic === tp; })){ filterTopic = tp; filterCh = topicOf(tp).chapter; }
    else if(ch && DATA.loops.some(function(l){ return l.chapter === ch; })) filterCh = ch;
    var direct = one && DATA.loops.filter(function(l){ return l.id === one; })[0];
    if(direct){ queue = [direct]; qi = 0; renderLoop(); return; }
    queue = visible(); qi = nextUnfinished(queue);
    if(queue.length) renderLoop(); else renderList();
  }
  // The first loop in the list not yet built fully right, else the first.
  function nextUnfinished(list){
    for(var i = 0; i < list.length; i++){ var last = lastScore(list[i]); if(!last || last.right < last.total) return i; }
    return 0;
  }

  function visible(){
    return DATA.loops.filter(function(l){ return (!filterCh || l.chapter === filterCh) && (!filterTopic || l.topic === filterTopic); });
  }
  function lastScore(l){
    var c = core(); if(!c) return null;
    var q = c.load().q, ids = SLOTS.concat(['kind', 'failure']), n = 0, right = 0;
    ids.forEach(function(k){ var r = q[itemBase(l) + k]; if(r && r.n){ n++; if(r.right) right++; } });
    return n === ids.length ? { right: right, total: n } : null;
  }

  /* ------------------------------------------------------------ list */
  function renderList(){
    stopLive();
    var chs = [];
    DATA.loops.forEach(function(l){ if(chs.indexOf(l.chapter) < 0) chs.push(l.chapter); });
    var list = visible();
    app.innerHTML =
      '<section class="fl-panel" aria-labelledby="fl-list-h">' +
        '<h2 id="fl-list-h" class="fl-h2">Pick a loop to build</h2>' +
        '<p class="fl-intro">Every feedback loop in your body has the same seven parts. Watch a loop work: push its variable off and see each part answer, or cut one part and see what goes wrong. Then test yourself: put each card in its slot, decide whether the loop is negative or positive feedback, and predict what happens when one part fails.</p>' +
        '<div class="fl-seg" role="group" aria-label="Chapter">' +
          '<button type="button" data-ch="" aria-pressed="' + (!filterCh) + '">All loops</button>' +
          chs.map(function(c){ return '<button type="button" data-ch="' + esc(c) + '" aria-pressed="' + (filterCh === c) + '">' + esc(chapterOf(c).title) + '</button>'; }).join('') +
        '</div>' +
        (filterTopic ? '<p class="anp-small">Showing loops for <b>' + esc(topicOf(filterTopic).title) + '</b>. <button type="button" class="link-quiet fl-clear">Show all</button></p>' : '') +
        '<ul class="fl-list">' + list.map(function(l){
          var last = lastScore(l);
          return '<li><button type="button" class="fl-pick" data-id="' + esc(l.id) + '"><span class="fl-pick-t">' + esc(l.title) + '</span>' +
            '<span class="fl-pick-m">' + esc(topicOf(l.topic).title) + '</span>' +
            (last ? '<span class="fl-pick-s' + (last.right === last.total ? ' full' : '') + '">Last build: ' + last.right + ' of ' + last.total + '</span>' : '') + '</button></li>';
        }).join('') + '</ul>' +
        '<div class="fl-startrow"><button type="button" class="btn-press fl-all">Test yourself on all ' + list.length + ' in order</button></div>' +
      '</section>' +
      '<section class="fl-panel" aria-labelledby="fl-parts-h">' +
        '<h2 id="fl-parts-h" class="fl-h3">The seven slots</h2>' +
        '<ol class="fl-parts">' + SLOTS.map(function(k){ return '<li class="fl-part-' + k + '">' + esc(LABELS[k]) + '</li>'; }).join('') + '</ol>' +
        '<p class="anp-small">Afferent means carried toward the control center; efferent means carried away from it. The response feeds back on the stimulus.</p>' +
      '</section>';
    app.querySelectorAll('[data-ch]').forEach(function(b){
      b.addEventListener('click', function(){ filterCh = b.getAttribute('data-ch'); filterTopic = ''; renderList(); focusEl(app.querySelector('[data-ch="' + filterCh + '"]')); });
    });
    var clear = app.querySelector('.fl-clear');
    if(clear) clear.addEventListener('click', function(){ filterTopic = ''; filterCh = ''; renderList(); });
    app.querySelectorAll('.fl-pick').forEach(function(b){
      b.addEventListener('click', function(){ var id = b.getAttribute('data-id'); queue = DATA.loops.filter(function(l){ return l.id === id; }); qi = 0; renderLoop(); });
    });
    app.querySelector('.fl-all').addEventListener('click', function(){ queue = visible(); qi = 0; startTab = 'test'; renderLoop(); });
  }
  function kit(){ return window.AnpToolKit || null; }
  function addPicker(l){
    var K = kit(), host = app.querySelector('.fl-pickhost');
    if(!K || !host) return;
    var chs = [];
    DATA.loops.forEach(function(x){ if(chs.indexOf(x.chapter) < 0) chs.push(x.chapter); });
    K.picker(host, {
      label: 'Loop', noun: 'loops', current: l.id, allLabel: 'All loops by chapter, and the seven slots',
      groups: chs.map(function(c){ return { title: chapterOf(c).title, items: DATA.loops.filter(function(x){ return x.chapter === c; }).map(function(x){
        var last = lastScore(x);
        return { id: x.id, title: x.title, meta: topicOf(x.topic).title, done: !!(last && last.right === last.total) };
      }) }; }),
      onPick: function(id){
        var k = -1; queue.forEach(function(x, i){ if(x.id === id) k = i; });
        if(k < 0){ queue = DATA.loops.filter(function(x){ return x.id === id; }); k = 0; }
        qi = k; renderLoop(); focusEl(app.querySelector('.fl-title'));
      },
      onAll: function(){ renderList(); focusEl(app.querySelector('#fl-list-h')); }
    });
  }

  /* ------------------------------------------------------------ one loop */
  function renderLoop(){
    stopLive();
    var l = queue[qi], n = queue.length, t = topicOf(l.topic);
    var cards = SLOTS.map(function(k){ return { id: k, text: l.slots[k].text, why: l.slots[k].why, slot: k }; })
      .concat((l.distractors || []).map(function(d, i){ return { id: 'x' + i, text: d.text, why: d.why, slot: null }; }));
    cards = shuffle(cards);
    var placed = {};    // slot -> card id
    var active = 0;     // index into SLOTS of the slot being filled, or -1
    var score = { right: 0, total: 0 };
    var p = 'fl' + (++uid);
    var topicLink = t.built ? '<a class="fl-tag" href="' + esc(base() + 'lessons/' + t.id + '.html') + '">' + esc(t.title) + '</a>' : '<span class="fl-tag">' + esc(t.title) + '</span>';
    app.innerHTML =
      '<div class="fl-pickhost"></div>' +
      '<div class="fl-progress"><span class="anp-small">' + (n > 1 ? 'Loop ' + (qi + 1) + ' of ' + n : 'Feedback loop') + '</span>' +
        '<div class="track thin" aria-hidden="true"><i style="width:' + Math.round(100 * qi / n) + '%"></i></div>' +
        '<button type="button" class="link-quiet fl-back">All loops</button></div>' +
      '<article class="fl-card" aria-labelledby="' + p + '-t">' +
        '<div class="fl-meta">' + topicLink + '</div>' +
        '<h2 class="fl-title" id="' + p + '-t" tabindex="-1">' + esc(l.title) + '</h2>' +
        '<div class="fl-tabs" role="tablist" aria-label="Mode">' +
          '<button type="button" role="tab" id="' + p + '-tab-live" aria-controls="' + p + '-live" aria-selected="true">Watch it work</button>' +
          '<button type="button" role="tab" id="' + p + '-tab-test" aria-controls="' + p + '-test" aria-selected="false" tabindex="-1">Test yourself</button>' +
        '</div>' +
        '<section class="fl-livepanel" role="tabpanel" id="' + p + '-live" aria-labelledby="' + p + '-tab-live">' + liveHtml(l, p) + '</section>' +
        '<section class="fl-testpanel" role="tabpanel" id="' + p + '-test" aria-labelledby="' + p + '-tab-test" hidden>' +
        '<p class="fl-scenario">' + esc(l.scenario) + '</p>' +
        '<ol class="fl-stepper" aria-label="Steps"><li class="is-on" data-step="1">Build</li><li data-step="2">Classify</li><li data-step="3">Predict a failure</li></ol>' +
        '<section class="fl-build" aria-labelledby="' + p + '-b">' +
          '<h3 class="fl-h3" id="' + p + '-b">Step 1: build the loop</h3>' +
          '<p class="anp-small fl-how">Choose a slot, then the card that belongs in it. The next empty slot is chosen for you. Some cards belong in no slot. Tap a filled slot to empty it.</p>' +
          '<div class="fl-board">' +
            '<ol class="fl-slots">' + SLOTS.map(function(k, i){
              return '<li class="fl-slotrow" data-slot="' + k + '"><button type="button" class="fl-slot fl-s-' + k + '" data-i="' + i + '" aria-pressed="false">' +
                '<span class="fl-slot-n" aria-hidden="true">' + (i + 1) + '</span><span class="fl-slot-body"><span class="fl-slot-l">' + esc(LABELS[k]) + '</span><span class="fl-slot-v"></span></span></button>' +
                '<div class="fl-slot-fb" hidden></div></li>';
            }).join('') + '</ol>' +
            '<div class="fl-poolwrap"><h4 class="fl-pool-h" id="' + p + '-pool">Cards</h4><div class="fl-pool" role="group" aria-labelledby="' + p + '-pool"></div></div>' +
          '</div>' +
          '<div class="fl-actions"><button type="button" class="btn-press sm fl-check" disabled>Check the loop</button><button type="button" class="btn-outline fl-reset">Clear all</button></div>' +
          '<p class="fl-live anp-small" role="status" aria-live="polite"></p>' +
        '</section>' +
        '<section class="fl-classify" aria-labelledby="' + p + '-c" hidden></section>' +
        '<section class="fl-failure" aria-labelledby="' + p + '-f" hidden></section>' +
        '<section class="fl-done" hidden></section>' +
        '</section>' +
      '</article>';

    var build = app.querySelector('.fl-build'), pool = app.querySelector('.fl-pool'), live = app.querySelector('.fl-live');
    var checkBtn = app.querySelector('.fl-check');
    app.querySelector('.fl-back').addEventListener('click', renderList);
    addPicker(l);
    var liveCtl = activeLive = mountLive(l, app.querySelector('.fl-livepanel'), p);
    tabs(app.querySelector('.fl-tabs'));
    if(startTab === 'test') showTab('test');

    function showTab(which){
      startTab = which;
      app.querySelectorAll('.fl-tabs [role="tab"]').forEach(function(t){
        var on = t.id === p + '-tab-' + which;
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      });
      app.querySelector('.fl-livepanel').hidden = which !== 'live';
      app.querySelector('.fl-testpanel').hidden = which !== 'test';
      if(which === 'test') liveCtl.stop();
    }
    function tabs(bar){
      var ts = [].slice.call(bar.querySelectorAll('[role="tab"]'));
      ts.forEach(function(t, i){
        t.addEventListener('click', function(){ showTab(t.id.slice(t.id.lastIndexOf('-') + 1)); });
        t.addEventListener('keydown', function(e){
          var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if(!d) return;
          e.preventDefault();
          var n = ts[(i + d + ts.length) % ts.length]; n.click(); n.focus();
        });
      });
    }
    function cardById(id){ for(var i = 0; i < cards.length; i++) if(cards[i].id === id) return cards[i]; return null; }
    function used(id){ for(var k in placed) if(placed[k] === id) return true; return false; }
    function nextEmpty(from){
      for(var d = 0; d < SLOTS.length; d++){ var i = (from + d) % SLOTS.length; if(!placed[SLOTS[i]]) return i; }
      return -1;
    }
    function paint(){
      app.querySelectorAll('.fl-slot').forEach(function(b, i){
        var k = SLOTS[i], c = placed[k] ? cardById(placed[k]) : null;
        b.setAttribute('aria-pressed', String(i === active));
        b.classList.toggle('is-filled', !!c);
        b.querySelector('.fl-slot-v').textContent = c ? c.text : (i === active ? 'Choose a card for this slot' : 'Empty');
        b.setAttribute('aria-label', LABELS[k] + ': ' + (c ? c.text + '. Activate to empty this slot.' : (i === active ? 'empty, choosing now.' : 'empty.')));
      });
      pool.innerHTML = cards.filter(function(c){ return !used(c.id); }).map(function(c){
        return '<button type="button" class="fl-tile" data-card="' + esc(c.id) + '">' + esc(c.text) + '</button>';
      }).join('') || '<p class="anp-small fl-pool-empty">Every slot is filled. Check the loop, or tap a slot to change it.</p>';
      pool.querySelectorAll('.fl-tile').forEach(function(tb){ tb.addEventListener('click', function(){ place(tb.getAttribute('data-card')); }); });
      var filled = SLOTS.filter(function(k){ return placed[k]; }).length;
      checkBtn.disabled = filled < SLOTS.length;
    }
    function place(cardId){
      if(active < 0) active = nextEmpty(0);
      if(active < 0) return;
      var k = SLOTS[active], pos = [].indexOf.call(pool.querySelectorAll('.fl-tile'), pool.querySelector('[data-card="' + cardId + '"]'));
      placed[k] = cardId;
      var nx = nextEmpty(active + 1);
      live.textContent = 'Placed in ' + LABELS[k] + '. ' + (nx > -1 ? 'Now choosing: ' + LABELS[SLOTS[nx]] + '.' : 'All seven slots are filled.');
      active = nx;
      paint();
      var tiles = pool.querySelectorAll('.fl-tile');
      if(tiles.length) tiles[Math.min(Math.max(pos, 0), tiles.length - 1)].focus(); else checkBtn.focus();
    }
    app.querySelectorAll('.fl-slot').forEach(function(b, i){
      b.addEventListener('click', function(){
        if(build.classList.contains('is-done')) return;
        var k = SLOTS[i];
        if(placed[k]){ delete placed[k]; live.textContent = LABELS[k] + ' emptied. Choose a card for it.'; }
        else live.textContent = 'Choosing a card for ' + LABELS[k] + '.';
        active = i;
        paint();
        b.focus();
      });
    });
    app.querySelector('.fl-reset').addEventListener('click', function(){ placed = {}; active = 0; live.textContent = 'All slots emptied.'; paint(); });
    paint();
    if(booted) focusEl(app.querySelector('.fl-title'));
    booted = true;

    checkBtn.addEventListener('click', function(){
      build.classList.add('is-done');
      active = -1;
      var items = [], right = 0;
      SLOTS.forEach(function(k, i){
        var c = cardById(placed[k]), ok = c && c.slot === k;
        if(ok) right++;
        items.push(item(l, k, ok, 'apply', 1));
        var row = app.querySelector('.fl-slotrow[data-slot="' + k + '"]');
        var btn = row.querySelector('.fl-slot');
        btn.disabled = true;
        btn.setAttribute('aria-pressed', 'false');
        row.classList.add(ok ? 'is-ok' : 'is-no');
        var fb = row.querySelector('.fl-slot-fb');
        var wrongWhy = !c ? '' : c.slot ? 'That card is the ' + lower(c.slot) + ' of this loop, not the ' + lower(k) + '.' : c.why;
        fb.innerHTML = (ok
          ? '<p><b class="ok">✓ Right.</b> ' + esc(l.slots[k].why) + '</p>'
          : '<p><b class="no">✗ Not this card.</b> ' + esc(wrongWhy) + '</p><p><b>Belongs here:</b> ' + esc(l.slots[k].text) + '. ' + esc(l.slots[k].why) + '</p>') +
          '<div class="fl-report">' + report(itemBase(l) + k) + '</div>';
        fb.hidden = false;
      });
      score.right += right; score.total += SLOTS.length;
      if(core()) core().toolResult(KIND, items);
      if(window.LevlSound && window.LevlSound.answer) try{ window.LevlSound.answer(right === SLOTS.length); }catch(e){}
      pool.parentNode.hidden = true;
      app.querySelector('.fl-how').hidden = true;
      app.querySelector('.fl-actions').hidden = true;
      live.textContent = right + ' of 7 slots right.';
      live.classList.add('fl-live-score');
      stepper(2);
      renderClassify();
    });

    function renderClassify(){
      var sec = app.querySelector('.fl-classify');
      sec.innerHTML = '<h3 class="fl-h3" id="' + p + '-c" tabindex="-1">Step 2: what kind of loop is it?</h3>' +
        '<p class="anp-small">Does the response oppose the stimulus, or make it stronger?</p>' +
        '<div class="fl-choices" role="group" aria-labelledby="' + p + '-c"><button type="button" class="fl-choice" data-k="negative">Negative feedback</button><button type="button" class="fl-choice" data-k="positive">Positive feedback</button></div>' +
        '<div class="fl-cfb" hidden></div>';
      sec.hidden = false;
      focusEl(sec.querySelector('h3'));
      sec.querySelectorAll('.fl-choice').forEach(function(b){
        b.addEventListener('click', function(){
          var pick = b.getAttribute('data-k'), ok = pick === l.kind;
          sec.querySelectorAll('.fl-choice').forEach(function(x){
            x.disabled = true;
            if(x.getAttribute('data-k') === l.kind) x.classList.add('is-right');
            else if(x === b) x.classList.add('is-wrong');
          });
          score.right += ok ? 1 : 0; score.total++;
          if(core()) core().toolResult(KIND, [item(l, 'kind', ok, 'apply', 1)]);
          var fb = sec.querySelector('.fl-cfb');
          fb.innerHTML = '<p><b class="' + (ok ? 'ok' : 'no') + '">' + (ok ? '✓ Right.' : '✗ Not quite.') + '</b> ' + esc(l.classify) + '</p><div class="fl-report">' + report(itemBase(l) + 'kind') + '</div>';
          fb.hidden = false;
          stepper(3);
          renderFailure();
        });
      });
    }

    function renderFailure(){
      var f = l.failure, sec = app.querySelector('.fl-failure');
      var opts = shuffle(f.options.map(function(o, i){ return { o: o, i: i }; }));
      sec.innerHTML = '<h3 class="fl-h3" id="' + p + '-f" tabindex="-1">Step 3: when the ' + esc(lower(f.part)) + ' fails</h3>' +
        '<p class="fl-q">' + esc(f.q) + '</p>' +
        '<div class="fl-opts" role="group" aria-labelledby="' + p + '-f">' + opts.map(function(x){ return '<button type="button" class="fl-opt" data-i="' + x.i + '">' + esc(x.o.text) + '</button>'; }).join('') + '</div>';
      sec.hidden = false;
      focusEl(sec.querySelector('h3'));
      sec.querySelectorAll('.fl-opt').forEach(function(b){
        b.addEventListener('click', function(){
          var pick = +b.getAttribute('data-i'), ok = pick === f.correct;
          sec.querySelectorAll('.fl-opt').forEach(function(x){
            var i = +x.getAttribute('data-i');
            x.disabled = true;
            if(i === f.correct) x.classList.add('is-right'); else if(i === pick) x.classList.add('is-wrong');
            x.insertAdjacentHTML('beforeend', '<span class="fl-opt-why">' + esc(f.options[i].why) + '</span>');
          });
          sec.insertAdjacentHTML('beforeend', '<div class="fl-report">' + report(itemBase(l) + 'failure') + '</div>');
          score.right += ok ? 1 : 0; score.total++;
          if(core()){
            core().toolResult(KIND, [item(l, 'failure', ok, 'analyze', 2)]);
            core().event('anp-loop-complete', { loop: l.id, correct: score.right, total: score.total });
          }
          if(window.LevlSound && window.LevlSound.answer) try{ window.LevlSound.answer(ok); }catch(e){}
          renderDone();
        });
      });
    }

    function renderDone(){
      var sec = app.querySelector('.fl-done'), more = qi < queue.length - 1;
      sec.innerHTML = '<h3 class="fl-h3" tabindex="-1">The finished loop</h3>' +
        '<figure class="anp-fig fl-figure">' + loopSvg(l) + '<figcaption>Arrows mean “causes”. Afferent parts carry information toward the control center; efferent parts carry commands away from it. The response feeds back on the stimulus.</figcaption></figure>' +
        '<p class="fl-final" role="status"><b>' + score.right + ' of ' + score.total + '</b> right on this loop.' + (score.right < score.total ? ' Missed parts are in your review queue.' : '') + '</p>' +
        '<div class="fl-after-btns">' +
          (more ? '<button type="button" class="btn-press sm fl-next">Next loop</button>' : '') +
          '<button type="button" class="btn-outline fl-again">Build it again</button>' +
          '<button type="button" class="' + (more ? 'link-quiet' : 'btn-press sm') + ' fl-list-btn">All loops</button>' +
        '</div>';
      sec.hidden = false;
      if(kit()) kit().strip(sec, { topic: l.topic, text: l.title + ' ' + l.scenario + ' ' + SLOTS.map(function(k){ return l.slots[k].text; }).join(' ') });
      var nx = sec.querySelector('.fl-next');
      if(nx) nx.addEventListener('click', function(){ qi++; renderLoop(); window.scrollTo(0, 0); });
      sec.querySelector('.fl-again').addEventListener('click', function(){ startTab = 'test'; renderLoop(); window.scrollTo(0, 0); });
      sec.querySelector('.fl-list-btn').addEventListener('click', function(){ renderList(); window.scrollTo(0, 0); });
    }

    function stepper(n){
      app.querySelectorAll('.fl-stepper li').forEach(function(li){
        var s = +li.getAttribute('data-step');
        li.classList.toggle('is-on', s === n);
        li.classList.toggle('is-done', s < n);
      });
    }
  }

  function item(l, k, ok, level, diff){
    var t = topicOf(l.topic);
    return { id: itemBase(l) + k, correct: !!ok, topic: l.topic, core: l.core, level: level, diff: Math.min(3, diff + (t.chapter === 'cardiovascular' ? 1 : 0)), group: chapterOf(t.chapter).title };
  }

  /* ------------------------------------------------------------ the live loop
     "Watch it work": the loop's controlled variable sits on a gauge with its
     set point in the middle. Dragging the marker off the set point (only on
     the side this loop answers; the other side is a different loop), or
     pressing the stimulus button, sends a signal round the ring one part at
     a time; then the response acts on the variable. Negative feedback pulls
     it back toward the set point, cycle by cycle; positive feedback pushes it
     further each cycle until the loop's own ending (live.end). The motion is
     qualitative: direction and approach only. Numbers appear only where the
     loop's own text gives them (live.setPoint, live.shift).
     "Cut a part" breaks one part. For the part the loop's failure question
     is about, the gauge follows live.broken (read from that question's right
     answer) and the case and its outcome are shown. For any other part the
     signal stops there and nothing pushes the variable back (a positive loop
     cannot build). A part the loop does not have ("None: same cells") cannot
     be cut, and says why. */
  function reduced(){ try{ return window.LevlMotion ? window.LevlMotion.reduced() : window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
  function noPart(l, k){ return /^none\b/i.test(l.slots[k].short); }
  var BROKEN_CUT = { uncorrected: 1, worse: 1, stalls: 1, text: 1, never: 0, reset: 0, partial: 0, slower: 0, corrected: 0 };
  function partner(l){
    var v = l.live.variable, best = null;
    DATA.loops.forEach(function(x){
      if(x === l || x.live.variable !== v || x.live.dir === l.live.dir || x.kind !== l.kind) return;
      var score = (x.topic === l.topic ? 2 : 0) + (x.chapter === l.chapter ? 1 : 0);
      if(!best || score > best.s) best = { x: x, s: score };
    });
    return best && best.x;
  }
  function liveHtml(l, p){
    var lv = l.live, pos = l.kind === 'positive';
    var cuts = ['sensor', 'afferent', 'control', 'efferent', 'effector'];
    if(cuts.indexOf(l.failure.part) < 0) cuts = (l.failure.part === 'stimulus' ? [l.failure.part] : []).concat(cuts).concat(l.failure.part === 'response' ? [l.failure.part] : []);
    return '<p class="fl-live-how anp-small">' + (lv.shift ? 'Raise the set point, or drag' : 'Drag') + ' the marker off the ' + (pos ? 'starting level' : 'set point') + ' (or press the button) and watch each part of the loop answer.</p>' +
      '<figure class="anp-fig fl-gaugefig">' + gaugeSvg(l, p) + '</figure>' +
      '<div class="fl-live-btns">' +
        (lv.shift ? '<button type="button" class="btn-press sm fl-shift">' + esc(lv.shift.label) + '</button>' : '') +
        '<button type="button" class="' + (lv.shift ? 'btn-outline' : 'btn-press sm') + ' fl-push"><span class="fl-push-k">Stimulus:</span> ' + esc(l.slots.stimulus.short) + '</button>' +
        '<button type="button" class="link-quiet fl-lreset">Reset</button>' +
      '</div>' +
      '<p class="fl-now" aria-hidden="true"></p>' +
      '<figure class="anp-fig fl-ringfig">' + loopSvg(l, true) + '</figure>' +
      '<div class="fl-cut"><h3 class="fl-h3" id="' + p + '-cut">Cut a part</h3>' +
        '<p class="anp-small">Break one part, then push the variable again.</p>' +
        '<div class="fl-cutrow" role="group" aria-labelledby="' + p + '-cut">' +
          '<button type="button" class="fl-cutb" data-cut="" aria-pressed="true">Nothing cut</button>' +
          cuts.map(function(k){ return '<button type="button" class="fl-cutb fl-cutb-' + k + '" data-cut="' + k + '" aria-pressed="false">' + esc(LABELS[k]) + (k === l.failure.part ? ' <span class="fl-case">a case</span>' : '') + '</button>'; }).join('') +
        '</div><div class="fl-cutfb" hidden></div></div>' +
      '<p class="fl-sr" role="status" aria-live="polite"></p>';
  }
  /* The gauge: a track with the set point in the middle. Only the half on the
     side this loop answers is live. */
  var GX0 = 24, GX1 = 316, GC = 170, GY = 66;
  function gaugeSvg(l, p){
    var lv = l.live, up = lv.dir === 'up', pos = l.kind === 'positive';
    var liveX = up ? GC : GX0, liveW = (GX1 - GX0) / 2;
    var sp = lv.setPoint ? lv.setPoint : (pos ? 'Starting level' : 'Set point');
    var other = partner(l);
    return '<svg class="fl-gauge" viewBox="0 0 340 114" role="group" aria-labelledby="' + p + '-gl">' +
      '<title id="' + p + '-gl">' + esc(lv.variable) + ' gauge</title>' +
      '<text class="fl-g-name" x="' + GX0 + '" y="16">' + esc(lv.variable) + '</text>' +
      '<text class="fl-g-state" x="' + GX0 + '" y="34"></text>' +
      '<rect class="fl-g-track" x="' + GX0 + '" y="' + (GY - 7) + '" width="' + (GX1 - GX0) + '" height="14" rx="7"/>' +
      '<rect class="fl-g-live ' + (up ? 'hi' : 'lo') + '" x="' + liveX + '" y="' + (GY - 7) + '" width="' + liveW + '" height="14" rx="7"/>' +
      '<text class="lbl-sm" x="' + GX0 + '" y="' + (GY + 30) + '">' + (pos ? 'less' : 'lower') + '</text>' +
      '<text class="lbl-sm" x="' + GX1 + '" y="' + (GY + 30) + '" text-anchor="end">' + (pos ? 'more' : 'higher') + '</text>' +
      '<g class="fl-g-sp"><path class="fl-g-spline" d="M' + GC + ' ' + (GY - 18) + ' V' + (GY + 18) + '"/><text class="fl-g-spt" x="' + GC + '" y="' + (GY + 34) + '" text-anchor="middle">' + esc(sp) + '</text></g>' +
      (lv.shift ? '<g class="fl-g-sp0" opacity="0"><path class="fl-g-spline ghost" d="M' + GC + ' ' + (GY - 14) + ' V' + (GY + 14) + '"/><text class="lbl-sm" x="' + GC + '" y="' + (GY - 22) + '" text-anchor="middle">was ' + esc(lv.setPoint) + '</text></g>' : '') +
      '<g class="fl-g-mk" tabindex="0" role="slider" aria-label="' + esc(lv.variable) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
        '<rect class="fl-g-hit" x="-22" y="' + (GY - 30) + '" width="44" height="60" fill="transparent"/>' +
        '<path class="fl-g-ptr" d="M0 ' + (GY - 22) + ' V' + (GY + 8) + '"/><circle class="fl-g-dot" cx="0" cy="' + GY + '" r="11"/>' +
      '</g>' +
      '</svg>' +
      (other ? '<p class="anp-small fl-other">' + (up ? 'A fall' : 'A rise') + ' is answered by another loop: <button type="button" class="link-quiet fl-otherb" data-id="' + esc(other.id) + '">' + esc(other.title) + '</button></p>' : '');
  }

  function mountLive(l, panel, p){
    var lv = l.live, up = lv.dir === 'up', pos = l.kind === 'positive', f = l.failure;
    var svg = panel.querySelector('.fl-gauge'), mk = panel.querySelector('.fl-g-mk'), state = panel.querySelector('.fl-g-state');
    var spG = panel.querySelector('.fl-g-sp'), spT = panel.querySelector('.fl-g-spt'), sp0 = panel.querySelector('.fl-g-sp0');
    var ring = panel.querySelector('.fl-ringfig svg'), now = panel.querySelector('.fl-now'), sr = panel.querySelector('.fl-sr');
    var cutfb = panel.querySelector('.fl-cutfb'), band = panel.querySelector('.fl-g-live');
    var v = 0;          // how far the variable is off its set point, 0..1, on this loop's side
    var spOff = 0;      // how far the set point itself has moved, 0..1, on this loop's side (fever, reset)
    var cut = '';       // the part cut, or ''
    var timers = [], raf = 0, running = false;
    var half = (GX1 - GX0) / 2;
    function xOf(val){ return GC + (up ? 1 : -1) * val * half; }
    function word(){
      var d = v - spOff, a = Math.abs(d), side = (up ? d : -d) > 0 ? 'above' : 'below';
      if(pos) return a < 0.04 ? 'at the starting level' : (a > 0.85 ? 'far ' : '') + side + ' the start';
      if(a < 0.04) return spOff ? 'at the new set point' : 'at the set point';
      return (a > 0.6 ? 'far ' : a < 0.25 ? 'a little ' : '') + side + ' the ' + (spOff ? 'new ' : '') + 'set point';
    }
    function draw(){
      mk.setAttribute('transform', 'translate(' + xOf(v).toFixed(1) + ' 0)');
      spG.setAttribute('transform', 'translate(' + (xOf(spOff) - GC).toFixed(1) + ' 0)');
      var w = word();
      state.textContent = w.charAt(0).toUpperCase() + w.slice(1);
      mk.setAttribute('aria-valuenow', String(Math.round(Math.max(0, v) * 100)));
      mk.setAttribute('aria-valuetext', lv.variable + ': ' + w);
      svg.classList.toggle('is-off', Math.abs(v - spOff) >= 0.04);
    }
    function clearRing(){ svg.classList.remove('is-na'); ring.querySelectorAll('.is-lit,.is-stop').forEach(function(x){ x.classList.remove('is-lit'); x.classList.remove('is-stop'); }); }
    function stop(){ timers.forEach(clearTimeout); timers = []; if(raf) cancelAnimationFrame(raf); raf = 0; running = false; panel.classList.remove('is-running'); }
    function later(fn, ms){ timers.push(setTimeout(fn, ms)); }
    function tween(to, ms, done, which){
      if(raf) cancelAnimationFrame(raf);
      var key = which || 'v', from = key === 'v' ? v : spOff, t0 = 0;
      if(reduced() || ms <= 0){ if(key === 'v') v = to; else spOff = to; draw(); if(done) done(); return; }
      function step(t){
        if(!t0) t0 = t;
        var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3), x = from + (to - from) * e;
        if(key === 'v') v = x; else spOff = x;
        draw();
        if(k < 1) raf = requestAnimationFrame(step); else { raf = 0; if(done) done(); }
      }
      raf = requestAnimationFrame(step);
    }
    function caption(k, extra){
      now.innerHTML = '<span class="fl-now-n fl-now-' + k + '">' + (SLOTS.indexOf(k) + 1) + '</span><b>' + esc(LABELS[k]) + ':</b> ' + esc(l.slots[k].text) + (extra ? ' <span class="fl-now-x">' + esc(extra) + '</span>' : '');
    }
    function light(k){
      var g = ring.querySelector('[data-k="' + k + '"]'), a = ring.querySelector('[data-from="' + k + '"]');
      if(g) g.classList.add('is-lit');
      if(a) a.classList.add('is-lit');
    }
    function brokenMode(){ return cut && cut === f.part ? lv.broken : cut ? 'cut' : ''; }
    function stopsAt(){ var m = brokenMode(); return m === 'cut' || (m && BROKEN_CUT[m]) ? cut : ''; }
    function say(t){ sr.textContent = ''; later(function(){ sr.textContent = t; }, 30); }

    /* One trip round the ring. fast: a quick pulse (later cycles). */
    function cycle(fast, done){
      clearRing();
      var halt = stopsAt(), dt = fast ? 170 : 520, i = 0;
      if(reduced()){
        var end = halt ? SLOTS.indexOf(halt) : SLOTS.length - 1;
        for(var j = 0; j <= end; j++) light(SLOTS[j]);
        if(halt){ ring.querySelector('[data-k="' + halt + '"]').classList.add('is-stop'); caption(halt, 'The signal stops here.'); }
        else caption('response');
        done(!halt);
        return;
      }
      (function next(){
        var k = SLOTS[i];
        light(k);
        if(!fast) caption(k);
        if(k === halt){
          ring.querySelector('[data-k="' + k + '"]').classList.add('is-stop');
          caption(k, 'The signal stops here.');
          later(function(){ done(false); }, dt);
          return;
        }
        if(++i < SLOTS.length) later(next, dt); else later(function(){ done(true); }, dt * 0.6);
      })();
    }

    function run(){
      stop();
      var mode = brokenMode(), n = 0;
      if(Math.abs(v - spOff) < 0.04 && mode !== 'never'){
        var q = 'At the ' + (pos ? 'starting level' : spOff ? 'new set point' : 'set point') + ': no stimulus, so the loop is quiet.';
        now.textContent = q; say(q); return;
      }
      running = true; panel.classList.add('is-running');
      if(mode === 'never'){ tween(0, 600, finish); return; }
      cycle(false, function after(reached){
        n++;
        if(!reached){
          // The signal stopped at the cut part: nothing drives the effector.
          if(mode === 'text'){ svg.classList.add('is-na'); return finish(); }
          if(mode === 'stalls' || pos) return finish();
          if(mode === 'worse') return tween(1, 1400, finish);
          return tween(Math.min(1, v + 0.2), 1400, finish);   // 'cut', 'uncorrected': the stimulus goes on
        }
        if(mode === 'reset'){
          // The sensors now read the higher level as normal: the set point moves to it.
          return tween(v, 1200, finish, 'sp');
        }
        if(pos){
          tween(Math.min(1, v * 1.6 + 0.12), 520, function(){
            if(v >= 0.99 || n > 8){ v = 1; draw(); return finish(); }
            cycle(true, after);
          });
          return;
        }
        // Negative feedback: the response pulls the variable back toward the set point.
        var gap = v - spOff;
        var keep = mode === 'slower' ? 0.8 : mode === 'corrected' ? 0.55 : mode === 'partial' ? 0.7 : 0.42;
        var rest = mode === 'partial' ? Math.min(gap, 0.3) : 0;
        var next = spOff + Math.max(rest, gap * keep);
        if(reduced()){ v = spOff + rest; draw(); return finish(); }
        tween(next, mode === 'slower' ? 1100 : 650, function(){
          if(v - spOff - rest < 0.035 || n > 10){ tween(spOff + rest, 300, finish); return; }
          cycle(true, after);
        });
      });
    }
    function finish(){
      running = false; panel.classList.remove('is-running');
      var mode = brokenMode(), msg;
      if(mode === 'cut'){
        msg = 'With the ' + lower(cut) + ' cut, the signal stops at ' + l.slots[cut].short.charAt(0).toLowerCase() + l.slots[cut].short.slice(1) + '. Nothing reaches the effector, so ' +
          (pos ? 'the loop cannot build: ' + lv.variable.toLowerCase() + ' gets no stronger.'
               : 'nothing pushes ' + lv.variable.toLowerCase() + ' back: it stays off the set point, and drifts further while the stimulus lasts.');
        now.innerHTML = '<b class="no">Loop broken.</b> ' + esc(msg);
      } else if(mode){
        var o = f.options[f.correct];
        msg = (mode === 'text' ? 'The gauge cannot show this one; here is what happens. ' : '') + o.text + '. ' + o.why.replace(/^Right\.\s*/, '');
        now.innerHTML = '<b class="no">' + esc(LABELS[cut]) + ' failing:</b> ' + esc(msg);
      } else if(pos){
        msg = 'Each cycle the response made the stimulus stronger: positive feedback. ' + (lv.end || '');
        now.innerHTML = '<b class="ok">Positive feedback.</b> ' + esc(msg);
        if(lv.end && !reduced()) later(function(){ tween(0, 1400); }, 2200);
      } else {
        msg = 'The response opposed the stimulus and pulled ' + lv.variable.toLowerCase() + ' back to the ' + (spOff ? 'new ' : '') + 'set point: negative feedback. As the gap closed, the stimulus faded and the loop went quiet.';
        now.innerHTML = '<b class="ok">Back at the ' + (spOff ? 'new ' : '') + 'set point.</b> ' + esc(msg);
      }
      say(msg);
    }

    /* Dragging and keys */
    function valFromEvent(e){
      var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * 340 / r.width;
      var d = (x - GC) / half * (up ? 1 : -1);
      return Math.max(0, Math.min(1, d));
    }
    var dragging = false;
    mk.addEventListener('pointerdown', function(e){ dragging = true; stop(); clearRing(); if(spOff) unshift(); try{ mk.setPointerCapture(e.pointerId); }catch(x){} e.preventDefault(); });
    svg.addEventListener('pointerdown', function(e){ if(dragging) return; if(e.target.closest('.fl-g-mk')) return; stop(); clearRing(); if(spOff) unshift(); v = valFromEvent(e); draw(); dragging = true; try{ svg.setPointerCapture(e.pointerId); }catch(x){} });
    function move(e){ if(!dragging) return; v = valFromEvent(e); draw(); }
    function up_(){ if(!dragging) return; dragging = false; run(); }
    mk.addEventListener('pointermove', move); svg.addEventListener('pointermove', move);
    mk.addEventListener('pointerup', up_); svg.addEventListener('pointerup', up_);
    mk.addEventListener('pointercancel', up_); svg.addEventListener('pointercancel', up_);
    var keyT = 0;
    mk.addEventListener('keydown', function(e){
      var d = 0;
      if(e.key === 'ArrowRight' || e.key === 'ArrowUp') d = up ? 0.1 : -0.1;
      else if(e.key === 'ArrowLeft' || e.key === 'ArrowDown') d = up ? -0.1 : 0.1;
      else if(e.key === 'Home'){ v = 0; d = 0.0001; }
      else if(e.key === 'End'){ v = 1; d = 0.0001; }
      if(!d) return;
      e.preventDefault(); stop(); clearRing(); if(spOff) unshift();
      v = Math.max(0, Math.min(1, v + (Math.abs(d) < 0.001 ? 0 : d))); draw();
      clearTimeout(keyT); keyT = setTimeout(run, 700);
    });
    function unshift(){ spOff = 0; if(lv.shift){ spT.textContent = lv.setPoint; sp0.setAttribute('opacity', '0'); } band.removeAttribute('opacity'); }
    panel.querySelector('.fl-push').addEventListener('click', function(){ stop(); clearRing(); v = spOff + (pos ? 0.22 : 0.7); draw(); run(); });
    panel.querySelector('.fl-lreset').addEventListener('click', function(){ stop(); clearRing(); v = 0; unshift(); draw(); now.textContent = ''; say(lv.variable + ' is back at the ' + (pos ? 'starting level' : 'set point') + '.'); });
    var sh = panel.querySelector('.fl-shift');
    if(sh) sh.addEventListener('click', function(){
      // The set point itself moves away (fever): the variable has not changed,
      // but it is now on the stimulus side of the new set point.
      stop(); clearRing(); v = 0; draw();
      spT.textContent = lv.shift.to; sp0.setAttribute('opacity', '1'); band.setAttribute('opacity', '0');
      now.innerHTML = '<b>' + esc(lv.shift.label) + '.</b> ' + esc(lv.variable) + ' has not changed, but it is now below the new set point: that gap is the stimulus.';
      say(now.textContent);
      tween(-0.6, 900, function(){ later(run, reduced() ? 0 : 500); }, 'sp');
    });
    panel.querySelectorAll('.fl-cutb').forEach(function(b){
      b.addEventListener('click', function(){
        stop(); clearRing();
        cut = b.getAttribute('data-cut');
        panel.querySelectorAll('.fl-cutb').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        ring.querySelectorAll('.is-cut').forEach(function(x){ x.classList.remove('is-cut'); });
        if(cut){ var g = ring.querySelector('[data-k="' + cut + '"]'); if(g) g.classList.add('is-cut'); }
        if(!cut){ cutfb.hidden = true; say('Nothing cut. The loop is whole again.'); }
        else if(noPart(l, cut)){
          cutfb.innerHTML = '<p>' + esc(l.slots[cut].text) + '. There is nothing separate to cut; to break this loop, cut a part it has.</p>';
          cutfb.hidden = false; cut = ''; ring.querySelectorAll('.is-cut').forEach(function(x){ x.classList.remove('is-cut'); });
          panel.querySelectorAll('.fl-cutb').forEach(function(x){ x.setAttribute('aria-pressed', String(x.getAttribute('data-cut') === '')); });
          say(cutfb.textContent);
        } else if(cut === f.part){
          cutfb.innerHTML = '<p><b>The case:</b> ' + esc(f.q) + '</p><p class="anp-small">Push ' + esc(lv.variable.toLowerCase()) + ' off again to see what happens.</p>';
          cutfb.hidden = false; say('Case: ' + f.q);
        } else {
          cutfb.innerHTML = '<p>' + esc(LABELS[cut]) + ' cut: ' + esc(l.slots[cut].short) + ' no longer works. Push ' + esc(lv.variable.toLowerCase()) + ' off again to see what happens.</p>';
          cutfb.hidden = false; say(cutfb.textContent);
        }
        v = 0; unshift(); draw(); now.textContent = '';
      });
    });
    var ob = panel.querySelector('.fl-otherb');
    if(ob) ob.addEventListener('click', function(){
      var id = ob.getAttribute('data-id'), k = -1;
      queue.forEach(function(x, i){ if(x.id === id) k = i; });
      if(k < 0){ queue = DATA.loops.filter(function(x){ return x.id === id; }); k = 0; }
      stop(); qi = k; startTab = 'live'; renderLoop(); focusEl(app.querySelector('.fl-title'));
    });
    draw();
    return { stop: function(){ stop(); clearRing(); } };
  }

  /* ------------------------------------------------------------ the diagram
     A ring of seven boxes: down the left (stimulus to control center), across
     the bottom, up the right (efferent pathway to response), and a return
     arrow from the response back to the stimulus. */
  function wrap(text, max){
    var words = String(text).split(/\s+/), lines = [], line = '';
    words.forEach(function(w){
      if(!line) line = w;
      else if((line + ' ' + w).length <= max) line += ' ' + w;
      else { lines.push(line); line = w; }
    });
    if(line) lines.push(line);
    return lines.slice(0, 3);
  }
  function loopSvg(l, live){
    var W = 340, BW = 152, BH = 72, GAP = 26, X = [6, 182];
    function y(r){ return 12 + r * (BH + GAP); }
    var pos = { stimulus: [0, 0], sensor: [0, 1], afferent: [0, 2], control: [0, 3], efferent: [1, 3], effector: [1, 2], response: [1, 1] };
    var cls = { stimulus: 'shape', sensor: 'aff', afferent: 'aff', control: 'accent', efferent: 'eff', effector: 'eff', response: 'shape' };
    var H = y(3) + BH + 12;
    var s = '';
    SLOTS.forEach(function(k){
      var cx = X[pos[k][0]], cy = y(pos[k][1]);
      var lines = wrap(l.slots[k].short, 21);
      s += '<g data-k="' + k + '"><rect class="' + cls[k] + '" x="' + cx + '" y="' + cy + '" width="' + BW + '" height="' + BH + '" rx="11"/>' +
        '<text class="lbl-sm fl-svg-l" x="' + (cx + BW / 2) + '" y="' + (cy + 17) + '" text-anchor="middle">' + esc(LABELS[k]) + '</text>' +
        lines.map(function(t, i){ return '<text class="fl-svg-t" x="' + (cx + BW / 2) + '" y="' + (cy + (lines.length === 3 ? 33 : lines.length === 2 ? 39 : 46) + i * 14.5) + '" text-anchor="middle">' + esc(t) + '</text>'; }).join('') + '</g>';
    });
    var lx = X[0] + BW / 2, rx = X[1] + BW / 2;
    // down the left column
    for(var r = 0; r < 3; r++) s += '<path class="causes" data-from="' + SLOTS[r] + '" d="M' + lx + ' ' + (y(r) + BH + 2) + ' V' + (y(r + 1) - 5) + '"/>';
    // across the bottom: control center to efferent pathway
    s += '<path class="causes" data-from="control" d="M' + (X[0] + BW + 2) + ' ' + (y(3) + BH / 2) + ' H' + (X[1] - 5) + '"/>';
    // up the right column
    for(r = 3; r > 1; r--) s += '<path class="causes" data-from="' + (r === 3 ? 'efferent' : 'effector') + '" d="M' + rx + ' ' + (y(r) - 2) + ' V' + (y(r - 1) + BH + 5) + '"/>';
    // response feeds back on the stimulus
    var fx = X[1] + BW - 26, fy = y(0) + BH / 2;
    s += '<path class="causes fl-return" data-from="response" d="M' + fx + ' ' + (y(1) - 2) + ' V' + fy + ' H' + (X[0] + BW + 5) + '"/>';
    var neg = l.kind === 'negative';
    if(live){
      s += '<text class="lbl-sm" x="' + (X[1] + BW / 2) + '" y="' + (fy - 8) + '" text-anchor="middle">acts on the variable</text>';
      var la = 'The loop as a ring of seven parts. ' + SLOTS.map(function(k){ return LABELS[k] + ': ' + l.slots[k].short; }).join('. ') + '. The response acts back on the variable.';
      return '<svg class="fl-svg fl-ring" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(la) + '">' + s + '</svg>';
    }
    s += '<text class="fl-svg-k" x="' + (X[1] + 58) + '" y="' + (fy - 9) + '" text-anchor="middle">' + (neg ? 'Negative feedback' : 'Positive feedback') + '</text>' +
      '<text class="lbl-sm" x="' + (X[1] + 56) + '" y="' + (fy + 20) + '" text-anchor="middle">' + (neg ? 'the response opposes' : 'the response strengthens') + '</text>' +
      '<text class="lbl-sm" x="' + (X[1] + 56) + '" y="' + (fy + 35) + '" text-anchor="middle">the stimulus</text>';
    var aria = 'The finished loop. ' + SLOTS.map(function(k){ return LABELS[k] + ': ' + l.slots[k].text; }).join('. ') + '. ' + (neg ? 'Negative feedback: the response opposes the stimulus.' : 'Positive feedback: the response strengthens the stimulus.');
    return '<svg class="fl-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(aria) + '">' + s + '</svg>';
  }
})();
