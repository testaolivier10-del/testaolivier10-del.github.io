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

   URL: ?chapter=<id> or ?topic=<id> filter the list; ?id=<loop> opens one. */
(function(){
  'use strict';
  var app = document.getElementById('app');
  if(!app) return;
  var KIND = 'feedback-loops';
  var SLOTS = ['stimulus', 'sensor', 'afferent', 'control', 'efferent', 'effector', 'response'];
  var LABELS = { stimulus: 'Stimulus', sensor: 'Receptor (sensor)', afferent: 'Afferent pathway', control: 'Control center', efferent: 'Efferent pathway', effector: 'Effector', response: 'Response' };
  var DATA = null, filterCh = '', filterTopic = '', queue = [], qi = 0, uid = 0;

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
    if(direct){ queue = [direct]; qi = 0; renderLoop(); } else renderList();
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
    var chs = [];
    DATA.loops.forEach(function(l){ if(chs.indexOf(l.chapter) < 0) chs.push(l.chapter); });
    var list = visible();
    app.innerHTML =
      '<section class="fl-panel" aria-labelledby="fl-list-h">' +
        '<h2 id="fl-list-h" class="fl-h2">Pick a loop to build</h2>' +
        '<p class="fl-intro">Every feedback loop in your body has the same seven parts. Put each card in its slot, then decide whether the loop is negative or positive feedback, and predict what happens when one part fails.</p>' +
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
        '<div class="fl-startrow"><button type="button" class="btn-press fl-all">Build all ' + list.length + ' in order</button></div>' +
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
    app.querySelector('.fl-all').addEventListener('click', function(){ queue = visible(); qi = 0; renderLoop(); });
  }

  /* ------------------------------------------------------------ one loop */
  function renderLoop(){
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
      '<div class="fl-progress"><span class="anp-small">' + (n > 1 ? 'Loop ' + (qi + 1) + ' of ' + n : 'Feedback loop') + '</span>' +
        '<div class="track thin" aria-hidden="true"><i style="width:' + Math.round(100 * qi / n) + '%"></i></div>' +
        '<button type="button" class="link-quiet fl-back">All loops</button></div>' +
      '<article class="fl-card" aria-labelledby="' + p + '-t">' +
        '<div class="fl-meta">' + topicLink + '</div>' +
        '<h2 class="fl-title" id="' + p + '-t" tabindex="-1">' + esc(l.title) + '</h2>' +
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
      '</article>';

    var build = app.querySelector('.fl-build'), pool = app.querySelector('.fl-pool'), live = app.querySelector('.fl-live');
    var checkBtn = app.querySelector('.fl-check');
    app.querySelector('.fl-back').addEventListener('click', renderList);

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
    focusEl(app.querySelector('.fl-title'));

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
        var wrongWhy = !c ? '' : c.slot ? 'That card is the ' + LABELS[c.slot].toLowerCase().replace('receptor (sensor)', 'Receptor (sensor)') + ' of this loop, not the ' + LABELS[k].replace('Receptor (sensor)', 'Receptor (sensor)').toLowerCase().replace('receptor (sensor)', 'Receptor (sensor)') + '.' : c.why;
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
      sec.innerHTML = '<h3 class="fl-h3" id="' + p + '-f" tabindex="-1">Step 3: when the ' + esc(LABELS[f.part] === 'Receptor (sensor)' ? 'Receptor (sensor)' : LABELS[f.part].toLowerCase()) + ' fails</h3>' +
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
      var nx = sec.querySelector('.fl-next');
      if(nx) nx.addEventListener('click', function(){ qi++; renderLoop(); window.scrollTo(0, 0); });
      sec.querySelector('.fl-again').addEventListener('click', function(){ renderLoop(); window.scrollTo(0, 0); });
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
  function loopSvg(l){
    var W = 340, BW = 152, BH = 72, GAP = 26, X = [6, 182];
    function y(r){ return 12 + r * (BH + GAP); }
    var pos = { stimulus: [0, 0], sensor: [0, 1], afferent: [0, 2], control: [0, 3], efferent: [1, 3], effector: [1, 2], response: [1, 1] };
    var cls = { stimulus: 'shape', sensor: 'aff', afferent: 'aff', control: 'accent', efferent: 'eff', effector: 'eff', response: 'shape' };
    var H = y(3) + BH + 12;
    var s = '';
    SLOTS.forEach(function(k){
      var cx = X[pos[k][0]], cy = y(pos[k][1]);
      var lines = wrap(l.slots[k].short, 21);
      s += '<g><rect class="' + cls[k] + '" x="' + cx + '" y="' + cy + '" width="' + BW + '" height="' + BH + '" rx="11"/>' +
        '<text class="lbl-sm fl-svg-l" x="' + (cx + BW / 2) + '" y="' + (cy + 17) + '" text-anchor="middle">' + esc(LABELS[k]) + '</text>' +
        lines.map(function(t, i){ return '<text class="fl-svg-t" x="' + (cx + BW / 2) + '" y="' + (cy + (lines.length === 3 ? 33 : 38) + i * 14.5) + '" text-anchor="middle">' + esc(t) + '</text>'; }).join('') + '</g>';
    });
    var lx = X[0] + BW / 2, rx = X[1] + BW / 2;
    // down the left column
    for(var r = 0; r < 3; r++) s += '<path class="causes" d="M' + lx + ' ' + (y(r) + BH + 2) + ' V' + (y(r + 1) - 5) + '"/>';
    // across the bottom: control center to efferent pathway
    s += '<path class="causes" d="M' + (X[0] + BW + 2) + ' ' + (y(3) + BH / 2) + ' H' + (X[1] - 5) + '"/>';
    // up the right column
    for(r = 3; r > 1; r--) s += '<path class="causes" d="M' + rx + ' ' + (y(r) - 2) + ' V' + (y(r - 1) + BH + 5) + '"/>';
    // response feeds back on the stimulus
    var fx = X[1] + BW - 26, fy = y(0) + BH / 2;
    s += '<path class="causes fl-return" d="M' + fx + ' ' + (y(1) - 2) + ' V' + fy + ' H' + (X[0] + BW + 5) + '"/>';
    var neg = l.kind === 'negative';
    s += '<text class="fl-svg-k" x="' + (X[1] + 58) + '" y="' + (fy - 9) + '" text-anchor="middle">' + (neg ? 'Negative feedback' : 'Positive feedback') + '</text>' +
      '<text class="lbl-sm" x="' + (X[1] + 56) + '" y="' + (fy + 20) + '" text-anchor="middle">' + (neg ? 'the response opposes' : 'the response strengthens') + '</text>' +
      '<text class="lbl-sm" x="' + (X[1] + 56) + '" y="' + (fy + 35) + '" text-anchor="middle">the stimulus</text>';
    var aria = 'The finished loop. ' + SLOTS.map(function(k){ return LABELS[k] + ': ' + l.slots[k].text; }).join('. ') + '. ' + (neg ? 'Negative feedback: the response opposes the stimulus.' : 'Positive feedback: the response strengthens the stimulus.');
    return '<svg class="fl-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(aria) + '">' + s + '</svg>';
  }
})();
