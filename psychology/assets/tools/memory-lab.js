/* Memory lab trainer page (docs/appsych-spec.md section 6). OWNED BY THIS
   TOOL ONLY (builder T3). Mounts into #app with ApPsychTools.mount; the model
   is ApPsychMath.memoryLab (psychology/assets/tools/math/memory-lab.js), the
   content psychology/data/tools/memory-lab.json (served filtered as
   assets/tool-data/memory-lab.json). The frame is ApPsychTools.modes
   (Explore, then Test yourself) on the Tool Studio.

   Explore: one stage, three scenes (the Scene switch), drawn at the stage's
   size (a box at most 760 units wide, so large screens scale it up):
     List          the serial position experiment, run on you. Start shows
                   ten words one at a time (the column of the curve lights
                   as each appears); choose recall at once or after 30
                   seconds of counting backward; type what you remember. Your
                   recall lands as a row of checks under the class curve (30
                   simulated learners, both conditions), with primacy and
                   recency marked.
     Forgetting    the forgetting curve over 30 days. Choose a review
                   schedule (none, massed, spaced, spaced wider) or tap the
                   day axis to add or remove a review; the no-review curve
                   stays faint behind for comparison; day 30 is read out.
     Interference  a timeline: something learned first, something similar
                   learned second, and now a recall. Choose which one you
                   are trying to remember: the arrow from the memory that
                   gets in the way shows the direction (forward: proactive;
                   backward: retroactive).
   Colors by role: the course cerulean for you and the memory you want,
   vermillion for what interferes, the delayed condition and the reviews.
   Every value is also written. Reduced motion: no fades; the study list
   keeps its pace (that is the experiment, not decoration).
   Test yourself: ApPsychTools.drill over the model's generate(), with a
   figure from the problem's own numbers (ApPsychPlot line and bar kinds, or
   the interference timeline). */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath, P = window.ApPsychPlot;
  if(!T || !M || !M.memoryLab || M.memoryLab.stub) return;
  var ML = M.memoryLab, S = M.Stats(), esc = T.esc;
  var VIEWS = [{ v: 'list', label: 'List' }, { v: 'forget', label: 'Forgetting' }, { v: 'interf', label: 'Interference' }];
  var N = 10, STUDY_MS = 1500, DELAY_S = 30;
  var MEAS = null;
  function tw(t, size, weight){
    try{
      if(!MEAS) MEAS = document.createElement('canvas').getContext('2d');
      MEAS.font = (weight || 800) + ' ' + size + 'px ' + ((getComputedStyle(document.body).getPropertyValue('--font-ui') || '').trim() || 'sans-serif');
      return MEAS.measureText(String(t)).width;
    }catch(e){ return String(t).length * size * 0.58; }
  }
  function txt(x, y, s, cls, anchor){ return '<text class="' + cls + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (anchor || 'middle') + '">' + esc(s) + '</text>'; }
  function r0(x){ return String(Math.round(x)); }

  T.mount('memory-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'memory-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* The first-run tip sits just above its target; an empty slot is opened
     there while the tip shows, so it never covers another control. */
  function hintSlot(s, target, text){
    if(!target) return;
    var slot = document.createElement('div');
    slot.className = 'psy-tipslot'; slot.setAttribute('aria-hidden', 'true');
    target.parentNode.insertBefore(slot, target);
    var h = s.hint({ target: target, text: text });
    if(!h){ slot.remove(); return; }
    var EV = ['pointerdown', 'keydown', 'input', 'change'];
    function done(e){ if(e && e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return; slot.remove(); EV.forEach(function(t){ s.root.removeEventListener(t, done, true); }); if(h.place) h.place(); }
    EV.forEach(function(t){ s.root.addEventListener(t, done, true); });
    if(h.place) h.place();
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var view = 'list', LS = null, touched = false, nid = T.nid('ml');
    // List scene state
    var seed = 1 + Math.floor(Math.random() * 9999), words = ML.list(seed, N), phase = 'ready', at = -1, delayed = false, left = 0, timer = null, typed = [], result = null, countFrom = 0;
    // The typical curves: the model's chance of recall at each position.
    var cls = { imm: M.repeat(N, function(i){ return 100 * ML.recallP(i + 1, N, false); }), del: M.repeat(N, function(i){ return 100 * ML.recallP(i + 1, N, true); }) };
    // Forgetting scene state
    var preset = 2, reviews = ML.PRESETS[2].reviews.slice();
    // Interference scene state
    var story = 0, wantOld = false;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem ml-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Memory lab</h2>' +
      '<div class="ml-fig"><svg class="ml-svg" xmlns="http://www.w3.org/2000/svg" role="img"></svg></div>' +
      '<div class="ml-ctl">' +
        '<div class="ls-seg ml-views" role="group" aria-label="Scene">' + VIEWS.map(function(v){ return '<button type="button" data-v="' + v.v + '" aria-pressed="false">' + v.label + '</button>'; }).join('') + '</div>' +
        '<div class="ml-grp ml-grp-list">' +
          '<div class="ls-seg ml-when" role="group" aria-label="When you recall"><button type="button" data-d="0" aria-pressed="true">Recall at once</button><button type="button" data-d="1" aria-pressed="false">After 30 s of counting</button></div>' +
          '<form class="ml-recall" hidden novalidate><label for="' + nid + '-in">Type a word you remember, then Enter</label><div class="ml-recall-row"><input id="' + nid + '-in" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="enter"><button type="submit" class="bt-btn">Add</button></div></form>' +
          '<div class="ml-go"><button type="button" class="btn-press sm ls-btn ls-pri ml-start">Start: study 10 words</button></div>' +
        '</div>' +
        '<div class="ml-grp ml-grp-forget"><div class="ml-presets" role="group" aria-label="Review schedule">' + ML.PRESETS.map(function(p, i){ return '<button type="button" class="ml-pre" data-i="' + i + '" aria-pressed="false">' + esc(p.name.split(':')[0]) + '</button>'; }).join('') + '</div></div>' +
        '<div class="ml-grp ml-grp-interf"><div class="ls-seg ml-want" role="group" aria-label="Which memory you are trying to recall"><button type="button" data-o="1" aria-pressed="false">Recall the older one</button><button type="button" data-o="0" aria-pressed="true">Recall the newer one</button></div></div>' +
      '</div>' +
      '<div class="ml-say"></div>' +
      T.moreHtml('<div class="ml-o ml-o-list"><button type="button" class="bt-btn ml-newlist">A new list of words</button></div><div class="ml-o ml-o-forget"></div><div class="ml-o ml-o-interf"></div>', 'list, review days, story') +
      '<div class="ml-nums"></div><p class="sr-only ml-live"></p></section>';
    var say = T.announcer($('.ml-live'));
    var cue = T.cue('Press Start, study the ten words, then type back what you remember.');
    $('.ml-ctl').insertBefore(cue.el, $('.ml-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var svg = $('.ml-svg');

    // More options: forgetting review day, interference story
    var sDay = T.slider({ label: 'Review on day', min: 1, max: 29, step: 1, value: 10 });
    $('.ml-o-forget').appendChild(sDay.el);
    $('.ml-o-forget').insertAdjacentHTML('beforeend', '<div class="ml-rv-act"><button type="button" class="bt-btn ml-add">Add this review</button><button type="button" class="bt-btn ml-clear">Clear reviews</button></div><p class="bt-small">Or tap the day axis on the graph to add a review, and tap a review to remove it.</p>');
    var selStory = T.choiceSelect({ label: 'Story', value: '0', options: ML.SCENES.map(function(s, i){ return { value: String(i), label: s.what.charAt(0).toUpperCase() + s.what.slice(1) }; }), onChange: function(v){ act(); story = +v; redraw(); say(interfLine()); } });
    $('.ml-o-interf').appendChild(selStory.el);

    function onClick(e){
      var b = e.target.closest('.ml-views button'); if(b){ setView(b.getAttribute('data-v')); return; }
      var w = e.target.closest('.ml-when button'); if(w){ if(phase === 'study' || phase === 'delay') return; act(); delayed = w.getAttribute('data-d') === '1'; sync(); redraw(); return; }
      if(e.target.closest('.ml-start')){ act(); if(phase === 'study' || phase === 'delay') stopRun(); else if(phase === 'recall') finish(); else start(); return; }
      if(e.target.closest('.ml-newlist')){ act(); stopRun(); seed = 1 + Math.floor(Math.random() * 9999); words = ML.list(seed, N); phase = 'ready'; result = null; typed = []; sync(); redraw(); say('A new list is ready. Press Start.'); return; }
      var pr = e.target.closest('.ml-pre'); if(pr){ act(); preset = +pr.getAttribute('data-i'); reviews = ML.PRESETS[preset].reviews.slice(); sync(); redraw(); say(forgetLine()); return; }
      if(e.target.closest('.ml-add')){ act(); toggleReview(sDay.value(), true); return; }
      if(e.target.closest('.ml-clear')){ act(); reviews = []; preset = 0; sync(); redraw(); say(forgetLine()); return; }
      var o = e.target.closest('.ml-want button'); if(o){ act(); wantOld = o.getAttribute('data-o') === '1'; sync(); redraw(); say(interfLine()); return; }
    }
    host.addEventListener('click', onClick);
    $('.ml-recall').addEventListener('submit', function(e){
      e.preventDefault();
      var inp = $('.ml-recall input'), v = inp.value.trim();
      if(!v) return;
      v.split(/[\s,]+/).filter(Boolean).forEach(function(x){ typed.push(x); });
      inp.value = ''; redraw();
      var sc = ML.score(words, typed); say(sc.n + ' of ' + N + ' so far.');
    });
    function setView(v){
      if(v === view) return;
      act(); if(v !== 'list') stopRun(true); view = v; sync(); redraw();
      say({ list: 'Serial position. ', forget: 'Forgetting curve. ', interf: 'Interference. ' }[v] + line());
    }
    function sync(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.ml-views button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === view)); });
      ['list', 'forget', 'interf'].forEach(function(k){ var g = $('.ml-grp-' + k), o = $('.ml-o-' + k); if(g) g.hidden = k !== view; if(o) o.hidden = k !== view; });
      root.querySelectorAll('.ml-when button').forEach(function(b){ b.setAttribute('aria-pressed', String((b.getAttribute('data-d') === '1') === delayed)); b.disabled = phase === 'study' || phase === 'delay'; });
      root.querySelectorAll('.ml-pre').forEach(function(b){ b.setAttribute('aria-pressed', String(+b.getAttribute('data-i') === preset && same(reviews, ML.PRESETS[preset].reviews))); });
      root.querySelectorAll('.ml-want button').forEach(function(b){ b.setAttribute('aria-pressed', String((b.getAttribute('data-o') === '1') === wantOld)); });
      var go = $('.ml-start'), rc = $('.ml-recall');
      if(go) go.textContent = phase === 'study' || phase === 'delay' ? 'Stop' : phase === 'recall' ? 'Done: score my recall' : phase === 'done' ? 'Try another list' : 'Start: study 10 words';
      if(rc) rc.hidden = phase !== 'recall';
      if(LS && LS.setupRow) LS.setupRow.setup(view === 'list' ? (delayed ? 'Recall after 30 s' : 'Recall at once') : view === 'forget' ? reviews.length + ' review' + (reviews.length === 1 ? '' : 's') : ML.SCENES[story].what);
    }
    function same(a, b){ return a.length === b.length && a.every(function(x, i){ return Math.abs(x - b[i]) < 1e-9; }); }

    /* ---------------------------------------------- the list experiment */
    function start(){
      if(phase === 'done'){ seed = 1 + Math.floor(Math.random() * 9999); words = ML.list(seed, N); }
      phase = 'study'; at = 0; typed = []; result = null; sync(); redraw(); say('Word 1: ' + words[0] + '.', true);
      timer = setInterval(function(){
        at++;
        if(at >= N){ clearInterval(timer); timer = null; if(delayed) beginDelay(); else beginRecall(); return; }
        redraw(); say('Word ' + (at + 1) + ': ' + words[at] + '.', true);
      }, STUDY_MS);
    }
    function beginDelay(){
      phase = 'delay'; left = DELAY_S; countFrom = 300 + Math.floor(Math.random() * 600); sync(); redraw();
      say('Count backward by threes from ' + countFrom + ', out loud, for 30 seconds.', true);
      timer = setInterval(function(){ left--; if(left <= 0){ clearInterval(timer); timer = null; beginRecall(); return; } redraw(); }, 1000);
    }
    function beginRecall(){
      phase = 'recall'; at = -1; sync(); redraw();
      // Focus the box on a desktop; on a phone the keyboard would cover the curve.
      var inp = $('.ml-recall input'); if(inp && !(LS && LS.root.classList.contains('ls-phone'))) try{ inp.focus(); }catch(e){}
      say('Type every word you remember, in any order. Then press Done.', true);
    }
    function finish(){ result = ML.score(words, typed); phase = 'done'; sync(); redraw(); say(listLine(), true); }
    function stopRun(quiet){ if(timer){ clearInterval(timer); timer = null; } if(phase === 'study' || phase === 'delay' || phase === 'recall'){ phase = 'ready'; at = -1; } sync(); if(!quiet) redraw(); }

    /* ------------------------------------------------ the review days */
    function toggleReview(d, addOnly){
      d = Math.max(1, Math.min(29, Math.round(d)));
      var i = reviews.findIndex(function(x){ return Math.abs(x - d) < 0.6; });
      if(i > -1 && !addOnly) reviews.splice(i, 1);
      else if(i < 0){ if(reviews.length >= 6) reviews.shift(); reviews.push(d); reviews.sort(function(a, b){ return a - b; }); }
      preset = -1; sync(); redraw(); say(forgetLine());
    }

    /* ------------------------------------------------ numbers and words */
    function parts(h){ var f = S.sum(h.slice(0, 3)), m = S.sum(h.slice(3, 7)), l = S.sum(h.slice(7)); return { f: f, m: m, l: l }; }
    function listLine(){
      if(!result) return phase === 'ready' ? 'Press Start to study ten words.' : '';
      var p = parts(result.hits);
      return 'You recalled ' + result.n + ' of ' + N + ': ' + p.f + ' of the first 3, ' + p.m + ' of the middle 4, ' + p.l + ' of the last 3.';
    }
    function d30(){ return ML.retention(reviews, 30); }
    function forgetLine(){ return (reviews.length ? 'Reviews on day ' + reviews.map(function(d){ return String(+d.toFixed(2)); }).join(', ') : 'No review') + ': about ' + r0(d30()) + '% kept on day 30 (no review: ' + r0(ML.retention([], 30)) + '%).'; }
    function sc(){ return ML.SCENES[story]; }
    function interfLine(){
      var s = sc();
      return wantOld ? 'Recalling the older memory (' + s.old + '), the newer one (' + s.nw + ') gets in the way: retroactive interference.' : 'Recalling the newer memory (' + s.nw + '), the older one (' + s.old + ') gets in the way: proactive interference.';
    }
    function line(){ return view === 'list' ? listLine() || phaseLine() : view === 'forget' ? forgetLine() : interfLine(); }
    function phaseLine(){ return phase === 'study' ? 'Word ' + (at + 1) + ' of ' + N + '.' : phase === 'delay' ? 'Count backward by threes: ' + left + ' seconds left.' : phase === 'recall' ? 'Type every word you remember.' : ''; }

    function words_(){
      var head, sub = '', why = '';
      if(view === 'list'){
        if(phase === 'ready'){ head = 'Study ten words, then recall them.'; sub = 'Choose when you recall, then press Start. The curves show the typical pattern.'; }
        else if(phase === 'study'){ head = 'Word ' + (at + 1) + ' of ' + N + '.'; sub = 'Just read each word once.'; }
        else if(phase === 'delay'){ head = 'Count backward by threes from ' + countFrom + ', out loud.'; sub = left + ' seconds left. This keeps the last words from being rehearsed.'; }
        else if(phase === 'recall'){ head = 'Type every word you remember, in any order.'; sub = ML.score(words, typed).n + ' so far. Press Done when you are out of words.'; }
        else { var p = parts(result.hits); head = 'You recalled ' + result.n + ' of ' + N + '.'; sub = 'First 3: ' + p.f + ', middle 4: ' + p.m + ', last 3: ' + p.l + '. ' + (delayed ? 'After counting, the end of the list usually loses its advantage.' : 'Most people recall the ends best.'); }
        why = '<p><b>Serial position effect.</b> Recall depends on where an item was in the list: the beginning and the end beat the middle, a U-shaped curve.</p>' +
          '<p><b>Primacy effect.</b> The first words get the most rehearsal, so more of them reach long-term memory.</p>' +
          '<p><b>Recency effect.</b> The last words are still in short-term memory when recall starts. Thirty seconds of counting backward displaces them, so recency disappears while primacy stays: evidence for separate short-term and long-term stores (the pattern Glanzer and Cunitz reported in 1966).</p>' +
          '<p><b>One person is not a curve.</b> Your own row is one try; a curve averages many learners. The curves here are a teaching model of the published shape, not real data.</p>';
      } else if(view === 'forget'){
        head = forgetLine();
        sub = reviews.length && reviews[reviews.length - 1] - reviews[0] < 0.5 ? 'Massed reviews come before any forgetting, so they add little.' : reviews.length ? 'Each review after some forgetting makes the curve fall more slowly.' : 'Without review, most is lost in the first days, then the curve levels off.';
        why = '<p><b>The forgetting curve.</b> Ebbinghaus (1885) memorized lists of nonsense syllables and tested himself after different delays: most forgetting came in the first hours and days, then the curve leveled off.</p>' +
          '<p><b>The spacing effect.</b> Reviews spread out over time (distributed practice) keep more than the same reviews crammed together (massed practice). Each review that comes after some forgetting makes the memory more durable.</p>' +
          '<p><b>Testing effect.</b> A review that makes you retrieve the material (a practice quiz) helps more than rereading it.</p>' +
          '<p><b>The model.</b> The curve is a simple teaching model of these shapes; its numbers are illustrative, not measurements.</p>';
      } else {
        var s = sc();
        head = wantOld ? 'Retroactive interference: new learning disrupts old.' : 'Proactive interference: old learning disrupts new.';
        sub = (wantOld ? s.nw + ' gets in the way of ' + s.old : s.old + ' gets in the way of ' + s.nw) + '.';
        why = '<p><b>Proactive interference.</b> Something learned earlier makes it harder to recall something learned later. Pro means forward: the old memory reaches forward in time.</p>' +
          '<p><b>Retroactive interference.</b> Something learned later makes it harder to recall something learned earlier. Retro means backward: the new memory reaches back.</p>' +
          '<p><b>How to tell them apart.</b> Ask which memory the person is trying to retrieve. If they want the older one, the newer one is interfering: retroactive. If they want the newer one, the older one is interfering: proactive.</p>' +
          '<p><b>Similarity matters.</b> Interference is strongest when the two memories are alike (two locker combinations, two languages with similar words).</p>';
      }
      T.explain($('.ml-say'), '<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), why);
      nums();
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), 'explore');
        if(view === 'list'){
          LS.pills(phase === 'study' ? [{ k: 'Word', html: (at + 1) + ' of ' + N, tone: 'readout' }] : phase === 'delay' ? [{ k: 'Counting', html: left + ' s', tone: 'warn' }] : result ? [{ k: 'You', html: result.n + ' of ' + N, tone: 'accent' }] : [], 'left', 'explore');
          LS.pills([{ k: 'Recall', html: delayed ? 'after 30 s' : 'at once', tone: 'readout' }], 'right', 'explore');
        } else if(view === 'forget'){
          LS.pills([{ k: 'Reviews', html: String(reviews.length), tone: 'readout' }], 'left', 'explore');
          LS.pills([{ k: 'Day 30', html: r0(d30()) + '% kept', tone: d30() >= 60 ? 'good' : d30() >= 40 ? 'warn' : 'bad' }], 'right', 'explore');
        } else {
          LS.pills([{ k: 'Recalling', html: wantOld ? 'older' : 'newer', tone: 'readout' }], 'left', 'explore');
          LS.pills([{ html: wantOld ? 'Retroactive' : 'Proactive', tone: 'accent' }], 'right', 'explore');
        }
      }
    }
    function nums(){
      var h = '';
      if(view === 'list'){
        h = T.dataTable(['Position', 'Recall at once (typical)', 'After 30 s (typical)'].concat(result ? ['You'] : []), cls.imm.map(function(v, i){ return [String(i + 1), r0(v) + '%', r0(cls.del[i]) + '%'].concat(result ? [result.hits[i] ? 'recalled' : 'missed'] : []); }), 'Typical percent recalled at each position (teaching model)');
        if(result && phase === 'done') h += '<p class="bt-small">The list: ' + words.map(esc).join(', ') + '.' + (result.extra.length ? ' Not on the list: ' + result.extra.map(esc).join(', ') + '.' : '') + '</p>';
      } else if(view === 'forget'){
        h = T.dataTable(['Day', 'No review', 'This schedule'], [1, 2, 7, 14, 30].map(function(d){ return [String(d), r0(ML.retention([], d)) + '%', r0(ML.retention(reviews, d)) + '%']; }), 'Percent kept (teaching model)');
      } else {
        var s = sc();
        h = T.dataTable(['', 'Learned', 'When'], [['Older memory', esc(s.old), 'first'], ['Newer memory', esc(s.nw), 'second']], s.what.charAt(0).toUpperCase() + s.what.slice(1));
      }
      $('.ml-nums').innerHTML = h;
    }

    /* ------------------------------------------------------- drawing */
    var hit = null;   // forgetting: the day axis mapping for taps
    svg.addEventListener('click', function(e){
      if(view !== 'forget' || !hit) return;
      var rc = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, k = vb.width / rc.width, x = (e.clientX - rc.left) * k, y = (e.clientY - rc.top) * k;
      if(x < hit.L - 10 || x > hit.R + 10 || y < hit.T) return;
      act(); toggleReview(hit.inv(x), false);
    });
    function size(){ var rc = $('.ml-fig').getBoundingClientRect(); return [Math.max(300, Math.min(1600, Math.round(rc.width) || 640)), Math.max(300, Math.min(1000, Math.round(rc.height) || 460))]; }
    function redraw(){
      var wh = size(), k = Math.max(1, wh[0] / 760), W = Math.round(wh[0] / k), H = Math.round(wh[1] / k);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', wh[0]); svg.setAttribute('height', wh[1]);
      var out = view === 'list' ? listScene(W, H) : view === 'forget' ? forgetScene(W, H) : interfScene(W, H);
      svg.innerHTML = out.svg; svg.setAttribute('aria-label', out.label);
      svg.classList.toggle('is-tap', view === 'forget');
      words_();
    }

    function listScene(W, H){
      var phone = W < 560, g = [], L = phone ? 40 : 56, R = W - (phone ? 36 : 26);
      var cardH = phase === 'ready' || phase === 'done' ? 0 : Math.min(150, H * 0.3), T0 = (phone ? 54 : 60) + (cardH ? cardH + 18 : 0);
      var you = phase === 'done' && result ? 58 : 0, B = H - (phone ? 52 : 58) - you;
      var x = function(i){ return L + (i + 0.5) / N * (R - L); }, y = function(v){ return B - v / 100 * (B - T0); };
      // the card: a word, the countdown or the typed words
      if(cardH){
        var cy = phone ? 50 : 56, cw = Math.min(R - L, 520), cx = (W - cw) / 2;
        g.push('<rect class="ml-cardbg" x="' + cx.toFixed(1) + '" y="' + cy + '" width="' + cw.toFixed(1) + '" height="' + cardH.toFixed(1) + '" rx="16"/>');
        if(phase === 'study'){
          g.push(txt(W / 2, cy + 26, 'Word ' + (at + 1) + ' of ' + N, 'ml-cardk'));
          g.push('<text class="ml-word" x="' + (W / 2).toFixed(1) + '" y="' + (cy + cardH / 2 + 20).toFixed(1) + '" text-anchor="middle">' + esc(words[at]) + '</text>');
        } else if(phase === 'delay'){
          g.push(txt(W / 2, cy + 26, 'Count backward by threes, out loud', 'ml-cardk'));
          g.push('<text class="ml-word" x="' + (W / 2).toFixed(1) + '" y="' + (cy + cardH / 2 + 14).toFixed(1) + '" text-anchor="middle">' + countFrom + ', ' + (countFrom - 3) + ', ' + (countFrom - 6) + '…</text>');
          var pw = cw - 60, frac = left / DELAY_S;
          g.push('<rect class="ml-bar0" x="' + (cx + 30).toFixed(1) + '" y="' + (cy + cardH - 26).toFixed(1) + '" width="' + pw.toFixed(1) + '" height="8" rx="4"/><rect class="ml-bar1" x="' + (cx + 30).toFixed(1) + '" y="' + (cy + cardH - 26).toFixed(1) + '" width="' + (pw * frac).toFixed(1) + '" height="8" rx="4"/>' + txt(cx + cw - 30, cy + 26, left + ' s', 'ml-cardk', 'end'));
        } else if(phase === 'recall'){
          var sc0 = ML.score(words, typed);
          g.push(txt(W / 2, cy + 26, 'Type what you remember: ' + sc0.n + ' so far', 'ml-cardk'));
          var chips = typed.slice(-12), xx = cx + 18, yy = cy + 46, ch = 28;
          chips.forEach(function(t){ var w = tw(t, 14) + 18; if(xx + w > cx + cw - 14){ xx = cx + 18; yy += ch + 6; } if(yy + ch > cy + cardH - 6) return; g.push('<rect class="ml-chip" x="' + xx.toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + ch + '" rx="8"/>' + txt(xx + w / 2, yy + 19, t, 'ml-chipt')); xx += w + 6; });
          if(!typed.length) g.push(txt(W / 2, cy + cardH / 2 + 18, 'Use the box below the picture.', 'ml-cardh'));
        }
      }
      // primacy and recency zones
      g.push('<rect class="ml-zone" x="' + (x(0) - (R - L) / N / 2).toFixed(1) + '" y="' + T0 + '" width="' + (3 * (R - L) / N).toFixed(1) + '" height="' + (B - T0).toFixed(1) + '"/>');
      g.push('<rect class="ml-zone" x="' + (x(7) - (R - L) / N / 2).toFixed(1) + '" y="' + T0 + '" width="' + (3 * (R - L) / N).toFixed(1) + '" height="' + (B - T0).toFixed(1) + '"/>');
      g.push(txt(x(1), T0 + 16, 'Primacy', 'ml-zt'), txt(x(8), T0 + 16, 'Recency', 'ml-zt'));
      [0, 25, 50, 75, 100].forEach(function(v){ g.push('<line class="ml-grid" x1="' + L + '" x2="' + R + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/>' + txt(L - 8, y(v) + 4, v + '%', 'ml-tv', 'end')); });
      if(phase === 'study' && at >= 0) g.push('<rect class="ml-now" x="' + (x(at) - (R - L) / N / 2 + 2).toFixed(1) + '" y="' + (T0 + 24) + '" width="' + ((R - L) / N - 4).toFixed(1) + '" height="' + (B - T0 - 24).toFixed(1) + '" rx="6"/>');
      // the two class curves; the chosen condition is drawn strong
      function poly(a, c2, dim){ var d = dim ? ' is-dim' : ''; return '<polyline class="' + c2 + d + '" points="' + a.map(function(v, i){ return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ') + '"/>' + a.map(function(v, i){ return '<circle class="' + c2 + '-pt' + d + '" cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="4.5"/>'; }).join(''); }
      // The dimmed condition first, so the chosen one is drawn on top.
      if(delayed) g.push(poly(cls.imm, 'ml-imm', true), poly(cls.del, 'ml-del', false)); else g.push(poly(cls.del, 'ml-del', true), poly(cls.imm, 'ml-imm', false));
      var li = txt(x(4.5), y(cls.imm[4]) - 14, 'recall at once', 'ml-lab ml-c-imm'), ld = txt(x(4.5), y(cls.del[4]) + 24, 'after 30 s of counting', 'ml-lab ml-c-del');
      g.push(li, ld);
      g.push('<line class="ml-axis" x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '"/>');
      for(var i = 0; i < N; i++) g.push(txt(x(i), B + 18, String(i + 1), 'ml-tv'));
      g.push(txt((L + R) / 2, B + 38, 'Position in the list', 'ml-axn'));
      if(you){
        var yy2 = B + 52;
        g.push(txt(L - 8, yy2 + 20, 'You', 'ml-axn', 'end'));
        result.hits.forEach(function(h, j){ var cx2 = x(j); g.push('<circle class="ml-you' + (h ? ' is-hit' : '') + '" cx="' + cx2.toFixed(1) + '" cy="' + (yy2 + 15) + '" r="' + (phone ? 10 : 12) + '"/>' + (h ? '<path class="ml-tick" d="M' + (cx2 - 5).toFixed(1) + ' ' + (yy2 + 15) + ' l3.5 4 l7 -8"/>' : '')); });
      }
      var label = 'Typical serial position curves (a teaching model): recall at once ' + cls.imm.map(r0).join(', ') + ' percent by position; after 30 seconds of counting ' + cls.del.map(r0).join(', ') + ' percent. ' + (result ? listLine() : phaseLine());
      return { svg: g.join(''), label: label };
    }

    function forgetScene(W, H){
      var phone = W < 560, g = [], L = phone ? 44 : 60, R = W - (phone ? 16 : 30), T0 = phone ? 60 : 66, B = H - (phone ? 64 : 70), D = 30;
      var x = function(d){ return L + d / D * (R - L); }, y = function(v){ return B - v / 100 * (B - T0); };
      hit = { L: L, R: R, T: T0, inv: function(px){ return (px - L) / (R - L) * D; } };
      [0, 20, 40, 60, 80, 100].forEach(function(v){ g.push('<line class="ml-grid" x1="' + L + '" x2="' + R + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/>' + txt(L - 8, y(v) + 4, v + '%', 'ml-tv', 'end')); });
      [0, 5, 10, 15, 20, 25, 30].forEach(function(d){ g.push(txt(x(d), B + 18, String(d), 'ml-tv')); });
      g.push(txt((L + R) / 2, B + 38, 'Days since learning', 'ml-axn'));
      function path(rv){ return ML.curve(rv, D).map(function(q, i){ return (i ? 'L' : 'M') + x(q[0]).toFixed(1) + ' ' + y(q[1]).toFixed(1); }).join(''); }
      g.push('<path class="ml-f0" d="' + path([]) + '"/>');
      g.push('<path class="ml-farea" d="' + path(reviews) + ' L' + R + ' ' + B + ' L' + L + ' ' + B + 'Z"/>');
      g.push('<path class="ml-f1" d="' + path(reviews) + '"/>');
      reviews.forEach(function(d){ g.push('<line class="ml-rvl" x1="' + x(d).toFixed(1) + '" x2="' + x(d).toFixed(1) + '" y1="' + y(100).toFixed(1) + '" y2="' + B + '"/><path class="ml-rvm" d="M' + x(d).toFixed(1) + ' ' + (B + 1) + ' l-7 11 h14 Z"/>'); });
      g.push('<line class="ml-axis" x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '"/>');
      // labels: no-review curve, day 30 value
      var v30 = d30(), v0 = ML.retention([], 30);
      g.push('<circle class="ml-f1-pt" cx="' + x(30).toFixed(1) + '" cy="' + y(v30).toFixed(1) + '" r="6"/>');
      var t30 = r0(v30) + '% on day 30', w30 = tw(t30, 14, 900) + 18, by = Math.max(T0 - 30, y(v30) - 44);
      g.push('<g class="ml-bub"><rect x="' + (R - w30).toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + w30.toFixed(1) + '" height="28" rx="8"/>' + txt(R - w30 / 2, by + 19, t30, 'ml-bt') + '</g>');
      if(Math.abs(v30 - v0) > 6) g.push(txt(R - 4, y(v0) - 8, 'no review: ' + r0(v0) + '%', 'ml-lab ml-c-f0', 'end'));
      if(reviews.length) g.push(txt(x(reviews[0]) + 6, T0 - 12, reviews.length === 1 ? 'review' : 'reviews', 'ml-lab ml-c-rv', 'start'));
      g.push(txt(L + 4, B + 56, phone ? 'Tap the day axis to add a review' : 'Tap the graph to add a review on that day; tap a review to remove it', 'ml-hint', 'start'));
      var label = 'Forgetting curve over 30 days, percent kept: ' + [1, 2, 7, 14, 30].map(function(d){ return 'day ' + d + ' ' + r0(ML.retention(reviews, d)) + '%'; }).join(', ') + '. ' + forgetLine();
      return { svg: g.join(''), label: label };
    }

    function interfScene(W, H){
      hit = null;
      var phone = W < 560, g = [], s = sc(), want = wantOld ? s.old : s.nw;
      var oldCls = wantOld ? 'is-want' : 'is-intr', newCls = wantOld ? 'is-intr' : 'is-want';
      function fit(cx, cy, t, maxW, c2){ var size = 22; while(size > 12 && tw(t, size, 900) > maxW) size -= 1; return '<text class="' + c2 + '" style="font-size:' + size + 'px" x="' + cx.toFixed(1) + '" y="' + cy.toFixed(1) + '" text-anchor="middle">' + esc(t) + '</text>'; }
      function card(x, y, w, h, k, v, when, cls2){
        return '<rect class="ml-tc ' + cls2 + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h + '" rx="14"/>' +
          txt(x + w / 2, y + 24, k, 'ml-tck') + fit(x + w / 2, y + h / 2 + 10, v, w - 24, 'ml-tcv') + txt(x + w / 2, y + h - 14, when, 'ml-tcw');
      }
      var lab = wantOld ? 'Retroactive: new blocks old' : 'Proactive: old blocks new', lw = tw(lab, 14, 900) + 22, label;
      if(phone){
        // A vertical timeline: time runs down the left edge, three cards in order.
        var L = 46, R = W - 10, cw = R - L - 40, ch = Math.max(84, Math.min(110, (H - 120) / 3 - 18)), gap = Math.max(22, (H - 3 * ch - 40) / 3), y1 = 26, y2 = y1 + ch + gap, y3 = y2 + ch + gap, tx = 22;
        g.push('<line class="ml-time" x1="' + tx + '" x2="' + tx + '" y1="' + (y1 - 6) + '" y2="' + (y3 + ch + 4) + '"/><path class="ml-timeh" d="M' + tx + ' ' + (y3 + ch + 16) + ' l-6 -12 h12 Z"/>');
        g.push('<text class="ml-tv" transform="translate(' + (tx - 8) + ' ' + (y1 + 22) + ') rotate(-90)" text-anchor="end">time</text>');
        [y1, y2, y3].forEach(function(yy, i){ g.push('<circle class="ml-tdot' + (i === 2 ? ' is-test' : '') + '" cx="' + tx + '" cy="' + (yy + ch / 2).toFixed(1) + '" r="6"/>'); });
        g.push(card(L, y1, cw, ch, 'Learned first', s.old, 'older memory', oldCls));
        g.push(card(L, y2, cw, ch, 'Learned second', s.nw, 'newer memory', newCls));
        g.push(card(L, y3, cw, ch, 'Now: trying to recall', want, wantOld ? 'the older one' : 'the newer one', 'is-test'));
        // the arrow on the right edge, from the intruder to the wanted card
        var fy = (wantOld ? y2 : y1) + ch / 2, ty2 = (wantOld ? y1 : y2) + ch / 2, ax = L + cw + 4, bend = R + 4;
        g.push('<path class="ml-arr" d="M' + ax + ' ' + fy.toFixed(1) + ' C' + bend + ' ' + fy.toFixed(1) + ' ' + bend + ' ' + ty2.toFixed(1) + ' ' + (ax + 10) + ' ' + ty2.toFixed(1) + '"/>');
        g.push('<path class="ml-arrh" d="M' + ax + ' ' + ty2.toFixed(1) + ' l12 -7 v14 Z"/>');
        var my = (y1 + ch + y2) / 2 + 5, mx = Math.min(L + cw / 2, R - lw / 2);
        g.push('<g class="ml-bub ml-bub-intr"><rect x="' + (mx - lw / 2).toFixed(1) + '" y="' + (my - 19).toFixed(1) + '" width="' + lw.toFixed(1) + '" height="28" rx="9"/>' + txt(mx, my, lab, 'ml-bt') + '</g>');
      } else {
        var L2 = 40, R2 = W - 40, cw2 = Math.min(220, (R2 - L2 - 80) / 3), ch2 = 132, step = (R2 - L2 - cw2) / 2, ty = H * 0.5 - ch2 / 2 + 10, ay = ty + ch2 + 46;
        var xs = [L2, L2 + step, L2 + 2 * step];
        g.push('<line class="ml-time" x1="' + L2 + '" x2="' + (R2 - 6) + '" y1="' + ay + '" y2="' + ay + '"/><path class="ml-timeh" d="M' + R2 + ' ' + ay + ' l-12 -6 v12 Z"/>' + txt(R2 - 4, ay + 22, 'time', 'ml-tv', 'end'));
        xs.forEach(function(x, i){ g.push('<line class="ml-tstem" x1="' + (x + cw2 / 2).toFixed(1) + '" x2="' + (x + cw2 / 2).toFixed(1) + '" y1="' + (ty + ch2) + '" y2="' + ay + '"/><circle class="ml-tdot' + (i === 2 ? ' is-test' : '') + '" cx="' + (x + cw2 / 2).toFixed(1) + '" cy="' + ay + '" r="6"/>'); });
        g.push(card(xs[0], ty, cw2, ch2, 'Learned first', s.old, 'older memory', oldCls));
        g.push(card(xs[1], ty, cw2, ch2, 'Learned second', s.nw, 'newer memory', newCls));
        g.push(card(xs[2], ty, cw2, ch2, 'Now: trying to recall', want, wantOld ? 'the older one' : 'the newer one', 'is-test'));
        var fromX = (wantOld ? xs[1] : xs[0]) + cw2 / 2, toX = (wantOld ? xs[0] : xs[1]) + cw2 / 2, topY = ty - 8, peak = topY - 74;
        g.push('<path class="ml-arr" d="M' + fromX.toFixed(1) + ' ' + topY + ' C' + fromX.toFixed(1) + ' ' + peak + ' ' + toX.toFixed(1) + ' ' + peak + ' ' + toX.toFixed(1) + ' ' + (topY - 6) + '"/>');
        g.push('<path class="ml-arrh" d="M' + toX.toFixed(1) + ' ' + (topY + 2) + ' l-7 -13 h14 Z"/>');
        var lx = (fromX + toX) / 2, ly = peak + 8;
        g.push('<g class="ml-bub ml-bub-intr"><rect x="' + (lx - lw / 2).toFixed(1) + '" y="' + (ly - 19).toFixed(1) + '" width="' + lw.toFixed(1) + '" height="28" rx="9"/>' + txt(lx, ly, lab, 'ml-bt') + '</g>');
      }
      label = 'Timeline: ' + s.old + ' learned first, ' + s.nw + ' learned second, now trying to recall ' + want + '. An arrow from ' + (wantOld ? s.nw + ' back to ' + s.old : s.old + ' forward to ' + s.nw) + ': ' + (wantOld ? 'retroactive' : 'proactive') + ' interference.';
      return { svg: g.join(''), label: label };
    }

    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.ml-fig')], dock: [$('.ml-ctl')], setup: 'Setup', moreLabel: 'List, review days and story', why: [$('.ml-say')], details: [$('.ml-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      sync(); redraw();
      if(s.mode() === 'explore') hintSlot(s, s.root.querySelector('.ml-go'), 'Start here: study ten words');
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(redraw, 60); }).observe($('.ml-fig')); }
      try{ new MutationObserver(function(){ redraw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
    }
    sync(); redraw();
    return { studio: studio, stop: function(){ stopRun(); } };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'memory-lab', noun: 'drill',
      generate: function(r, ctx, type){ return ML.generate(r, ctx, type); },
      types: [{ value: 'serial', label: 'Serial position curve' }, { value: 'spacing', label: 'Massed vs spaced study' }, { value: 'interference', label: 'Proactive or retroactive' }, { value: 'forgetting', label: 'The forgetting curve' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { serial: 'A serial position study', spacing: 'A spacing experiment', interference: 'Which interference?', forgetting: 'Reading a forgetting curve' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); }
    });
  }
  function figure(el, p, st){
    var g = p.figure, wide = (window.innerWidth || 1280) > 900, PW = wide ? 680 : 380, PH = wide ? 380 : 250, html = '';
    if(!g){ el.innerHTML = ''; return; }
    // Every value is written on the plot (no table on the stage), on the
    // side away from the other series.
    if(g.kind === 'serial'){
      var labs = [];
      g.imm.forEach(function(v, i){ var d = g.del[i], up = v >= d; labs.push({ at: [i + 1, v + (up ? 6 : -9)], text: String(v), cls: 's1' }, { at: [i + 1, d + (up ? -9 : 6)], text: String(d), cls: 's2' }); });
      html = P.svg({ label: 'Percent recalled by list position: at once ' + g.imm.join(', ') + '; after 30 seconds of counting ' + g.del.join(', ') + '.', kind: 'line', width: PW, height: PH, x: [0.6, 10.4], y: [0, 112], xStep: 1, yStep: 20,
        series: [{ name: 'Recall at once (%)', points: g.imm.map(function(v, i){ return [i + 1, v]; }) }, { name: 'After 30 s of counting (%)', points: g.del.map(function(v, i){ return [i + 1, v]; }), dashed: true }], labels: labs, xLabel: 'Position in the list', yLabel: 'Percent recalled' });
    } else if(g.kind === 'groups'){
      var show = st.massed && st.spaced, ms = S.mean(g.massed), ss = S.mean(g.spaced), bl = [];
      g.massed.forEach(function(v, j){ bl.push({ at: [j + 0.311, v + g.max * 0.035], text: String(v), cls: 's1' }, { at: [j + 0.661, g.spaced[j] + g.max * 0.035], text: String(g.spaced[j]), cls: 's2' }); });
      html = P.svg({ label: 'Each participant’s test score: massed ' + g.massed.join(', ') + '; spaced ' + g.spaced.join(', ') + (show ? '; group means ' + M.fixed(ms, 1) + ' and ' + M.fixed(ss, 1) : '') + '.', kind: 'bar', width: PW, height: PH,
        categories: g.massed.map(function(v, i){ return 'P' + (i + 1); }), series: [{ name: 'Massed', values: g.massed }, { name: 'Spaced', values: g.spaced }], y: [0, g.max * 1.08], yLabel: 'Score (out of ' + g.max + ')', labels: bl }) +
        (show ? '<p class="ml-means">Mean: massed <b>' + M.fixed(ms, 1) + '</b>, spaced <b>' + M.fixed(ss, 1) + '</b></p>' : '');
    } else if(g.kind === 'forget'){
      html = P.svg({ label: 'Percent remembered after each delay: ' + g.pts.map(function(q){ return 'day ' + q[0] + ' ' + q[1] + '%'; }).join(', ') + '.', kind: 'line', width: PW, height: PH, x: [-1, 34], y: [0, 112], xStep: 5, yStep: 20,
        series: [{ name: 'Remembered', points: g.pts }], labels: g.pts.map(function(q){ return { at: [q[0] + 0.6, q[1] + 4], text: q[1] + '%', anchor: 'start', cls: 's1' }; }), xLabel: 'Days since learning', yLabel: 'Percent remembered' });
    } else if(g.kind === 'interf'){
      var named = st.kind, want = g.testOld ? g.old : g.nw;
      html = '<div class="ml-qtl"><div class="ml-qc' + (named && !g.testOld ? ' is-intr' : '') + (named && g.testOld ? ' is-want' : '') + '"><span>Learned first</span><b>' + esc(g.old) + '</b></div><div class="ml-qa" aria-hidden="true">→</div>' +
        '<div class="ml-qc' + (named && g.testOld ? ' is-intr' : '') + (named && !g.testOld ? ' is-want' : '') + '"><span>Learned second</span><b>' + esc(g.nw) + '</b></div><div class="ml-qa" aria-hidden="true">→</div>' +
        '<div class="ml-qc is-test"><span>Now: trying to recall</span><b>' + (st.which ? esc(want) : '?') + '</b></div></div>' +
        (named ? '<p class="ml-means">' + (g.testOld ? 'The newer memory reaches back: retroactive interference.' : 'The older memory reaches forward: proactive interference.') + '</p>' : '');
    }
    el.innerHTML = '<figure class="cd-fig ml-qfig">' + html + '</figure>';
  }
})();
