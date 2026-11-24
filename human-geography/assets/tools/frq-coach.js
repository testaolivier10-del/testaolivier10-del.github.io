/* FRQ coach page (docs/aphug-spec.md sections 3.2 and 6; tools v2: docs/tools-v2-hug-frq-coach-brief.md).
   Mounts into #app with ApHugTools.kit2 (the course's adapter for the shared kit, assets/course/tool-kit2.js). The model
   is ApHugMath.frqCoach (human-geography/assets/tools/math/frq-coach.js), the content
   human-geography/data/tools/frq-coach.json (served filtered as assets/tool-data/frq-coach.json).

   EXPLORE (free play, nothing graded): an exam booklet open on a desk. The left page is one question (a drawn stimulus
   and the prompt); the right page is one full-credit answer written by hand. The main control is the verb ladder on
   the booklet's edge (Identify, Describe, Explain, Compare, Explain the degree): drag it and the prompt's verb changes,
   then the answer writes or erases one piece at a time, each piece in its verb's color (name, features, the because
   link, the second side, the degree first). A piece the verb does not need stays in place, quiet. The rubric line
   under the answer names what the verb asks for; the cause line says verb -> what it adds -> the words that add it.
   Every word on the page is read from what is drawn: the rubric line and the quoted words wait until the piece is
   fully written. "Next question" turns to the next of the eight questions.
   TEST YOURSELF: ApHugTools.drill over the model's generate(): the old drills (part, verbs, earns, record ids
   frq-coach:<context>:<step>) and "Write a part yourself" (the old writing box with its checklist, the rubric line,
   then which answer earns the point once you have written; drafts kept on this device, aphug_frqcoach_v1). */
(function(){
  'use strict';
  var T = window.ApHugTools, M = window.ApHugMath;
  if(!T || !M || !M.frqCoach || M.frqCoach.stub) return;
  var F = M.frqCoach, esc = T.esc, KEY = 'aphug_frqcoach_v1', PREF = 'aphug_frqcoach_x1';
  var LINKS = {
    explain: ['because', 'so', 'which leads to'],
    'explain-degree': ['To a high degree,', 'To a moderate degree,', 'To a low degree,', 'because'],
    compare: ['Both', 'whereas', 'but'],
    describe: [], identify: [], define: []
  };
  var CHECK_OK = { mechanism: 'The link is stated (because, so, which).', both: 'Both sides are named.', degree: 'The degree is stated.', scale: 'A scale is named.' };
  var CHECK_NAME = { mechanism: 'Link', both: 'Both sides', degree: 'Degree', scale: 'Scale' };
  // Explore's question order: the most visual first.
  var ORDER = ['polders', 'green-revolution', 'city-models', 'transition', 'diffusion', 'boundaries', 'country-a-people', 'development'];
  var STOP_LINES = { identify: ['Identify'], describe: ['Describe'], explain: ['Explain'], compare: ['Compare'], 'explain-degree': ['Explain the', 'degree'] };

  T.mount('frq-coach', function(app, data){
    T.kit2(app, { slug: 'frq-coach',
      explore: function(host){ return explore(host, data); },
      quiz: function(host){ quiz(host, data); } });
  });

  function load(k){ try{ return JSON.parse(localStorage.getItem(k) || '{}') || {}; }catch(e){ return {}; } }
  function save(k, d){ try{ localStorage.setItem(k, JSON.stringify(d)); }catch(e){} }
  function r1(v){ return Math.round(v * 10) / 10; }

  /* =============================================================== EXPLORE */
  function explore(host, data){
    var K = window.LevlKit2;
    if(!K) return { stage: host, shown: function(){} };
    var ctxs = ORDER.map(function(id){ return (data.contexts || []).filter(function(c){ return c.id === id && c.ladder; })[0]; }).filter(Boolean);
    if(!ctxs.length) return { stage: host, shown: function(){} };
    var pref = load(PREF), qi = Math.max(0, Math.min(ctxs.length - 1, ctxs.map(function(c){ return c.id; }).indexOf(pref.q))), stop = Math.max(0, Math.min(4, pref.v | 0));
    var LAD = F.LADDER, ctx = ctxs[qi], onScreen = false, LS = null, touched = false, seen = {}, took = false, taking = false;

    var stage = document.createElement('div'); stage.className = 'fcx';
    var head = K.head({ purpose: 'Each verb asks for its own piece', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var scene = document.createElement('div'); scene.className = 'fcx-scene'; scene.id = 'fcx-scene';
    scene.innerHTML = '<svg class="fcx-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" data-ls-text="keep"></svg>' +
      '<div class="fcx-q"><div class="fcx-qtop"><p class="fcx-kick"></p><button type="button" class="fcx-next"><span>Next question</span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7"/></svg></button></div>' +
        '<p class="fcx-prompt" aria-live="off"></p></div>' +
      '<div class="fcx-a" role="group" aria-label="A full-credit answer"><p class="fcx-akick">A full-credit answer</p><div class="fcx-ans"></div></div>' +
      '<p class="fcx-rub"><span class="fcx-rubk">Rubric</span> <span class="fcx-rubt"></span></p>' +
      '<div class="fcx-stops" role="group" aria-label="Task verbs"></div>';
    stage.appendChild(scene);
    var svg = scene.querySelector('.fcx-svg'), qBox = scene.querySelector('.fcx-q'), kick = scene.querySelector('.fcx-kick'), nextB = scene.querySelector('.fcx-next'),
      promptEl = scene.querySelector('.fcx-prompt'), aBox = scene.querySelector('.fcx-a'), ans = scene.querySelector('.fcx-ans'), rub = scene.querySelector('.fcx-rub'),
      rubT = scene.querySelector('.fcx-rubt'), stopsEl = scene.querySelector('.fcx-stops');
    LAD.forEach(function(v, i){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fcx-stop is-' + F.ADDS[v]; b.setAttribute('data-i', i);
      b.setAttribute('aria-label', F.VERBS[v].name);
      b.innerHTML = STOP_LINES[v].map(function(t){ return '<span>' + esc(t) + '</span>'; }).join('');
      stopsEl.appendChild(b);
    });
    var layer = K.layer(scene);
    var lines = document.createElement('div'); lines.className = 'fcx-lines';
    var cause = K.cause({ label: 'What the verb adds' });
    lines.appendChild(cause.el);
    stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    var sayT = 0;
    function say(t){ clearTimeout(sayT); sayT = setTimeout(function(){ live.textContent = t; }, 60); }

    /* ---------------------------------------------- the answer: pieces of words */
    // P[role] = { el, words: [span], n, f (fraction written, 0..1), shown (words visible) }
    var P = {};
    function buildAnswer(){
      ans.innerHTML = '';
      P = {};
      F.PIECES.forEach(function(k){
        var sp = document.createElement('span'); sp.className = 'fcx-p is-' + k; sp.setAttribute('data-role', k);
        var ws = String(ctx.ladder.pieces[k]).split(/\s+/);
        sp.innerHTML = ws.map(function(w, i){ return '<span class="fcx-w">' + esc(w) + (i < ws.length - 1 ? ' ' : '') + '</span>'; }).join('');
        if(k !== 'degree') sp.appendChild(document.createTextNode(' '));
        var wrap = sp;
        if(k === 'degree'){ wrap = document.createElement('span'); wrap.className = 'fcx-dline'; wrap.appendChild(sp); }
        ans.appendChild(wrap);
        P[k] = { el: sp, words: [].slice.call(sp.querySelectorAll('.fcx-w')), n: ws.length, f: 0, shown: 0 };
      });
    }
    function paintPiece(k){
      var p = P[k], n = Math.round(p.f * p.n);
      if(n === p.shown){ gone(k); return; }
      for(var i = Math.min(n, p.shown); i < Math.max(n, p.shown); i++) p.words[i].classList.toggle('is-in', i < n);
      p.shown = n;
      gone(k);
    }
    // An empty slot takes no room, so a rung's answer reads as one run of text (Compare has no hole where the because
    // would be). Only empty slots fold and open, and the piece being written opens first: a slot opens or folds only
    // after every visible word (writing and erasing go in climb order), so no visible word ever moves. The degree's
    // first line is always kept.
    function gone(k){ if(k === 'degree') return; var p = P[k], g = p.f <= 0 && p.shown === 0; if(p.el.classList.contains('is-gone') !== g) p.el.classList.toggle('is-gone', g); }
    function setAll(stopI){
      var w = F.WRITTEN[LAD[stopI]];
      F.PIECES.forEach(function(k){ P[k].f = w.indexOf(k) > -1 ? 1 : 0; paintPiece(k); });
    }
    // the rung whose pieces are exactly what is drawn (every word in or out), else -1 (mid change)
    function drawn(){
      for(var i = 0; i < LAD.length; i++){
        var w = F.WRITTEN[LAD[i]], okAll = true;
        F.PIECES.forEach(function(k){ var p = P[k], full = p.shown === p.n, none = p.shown === 0; if(w.indexOf(k) > -1 ? !full : !none) okAll = false; });
        if(okAll) return i;
      }
      return -1;
    }
    var WRITE_ORDER = ['name', 'features', 'link', 'side', 'degree'];
    var raf = 0, last = 0;
    function want(k){ return F.WRITTEN[LAD[stop]].indexOf(k) > -1 ? 1 : 0; }
    function tick(t){
      raf = 0;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
      // erase first (the last written piece first), then write in climb order: one piece moves at a time
      var mv = null, k, i;
      for(i = WRITE_ORDER.length - 1; i >= 0; i--){ k = WRITE_ORDER[i]; if(P[k].f > 0 && !want(k)){ mv = k; break; } }
      if(mv){ P[mv].f = Math.max(0, P[mv].f - dt * 70 / P[mv].n); }
      else {
        for(i = 0; i < WRITE_ORDER.length; i++){ k = WRITE_ORDER[i]; if(P[k].f < 1 && want(k)){ mv = k; break; } }
        if(mv){ P[mv].f = Math.min(1, P[mv].f + dt * (fast ? 52 : 32) / Math.max(4, P[mv].n)); P[mv].el.classList.remove('is-gone'); }
      }
      if(mv) paintPiece(mv);
      words();
      if(mv && onScreen) raf = requestAnimationFrame(tick);
      else { last = 0; fast = false; settled(); }
    }
    var fast = false;
    function run(){ if(!raf){ last = 0; raf = requestAnimationFrame(tick); } }
    function finish(){
      if(raf){ cancelAnimationFrame(raf); raf = 0; } last = 0; fast = false;
      if(promptEl.classList.contains('is-swap')){ clearTimeout(pfT); promptEl.classList.remove('is-swap'); paintQuestion(); }
      setAll(stop); words(); settled();
    }

    /* ---------------------------------------------- everything on the page read from the drawn answer */
    var shownStop = -2, rubShown = '';
    function words(){
      var v = LAD[stop], d = drawn(), need = F.NEEDED[v];
      // the verb asked: the prompt, the ladder and the color of each written piece
      F.PIECES.forEach(function(k){
        var p = P[k], on = p.shown > 0;
        p.el.classList.toggle('is-on', on && need.indexOf(k) > -1);
        p.el.classList.toggle('is-quiet', on && need.indexOf(k) < 0);
      });
      // the rubric line and the quoted words: only when the answer drawn is the one for this verb
      var add = F.ADDS[v], full = d === stop;
      var parts = [{ t: F.VERBS[v].name, role: add, say: F.VERBS[v].name }, { t: F.ADD_LABEL[v], role: add, say: 'adds ' + F.ADD_LABEL[v] }];
      if(full) parts.push({ t: '“' + ctx.ladder.keys[add] + '”', role: add, say: '“' + ctx.ladder.keys[add] + '”' });
      if(!taking) cause.set(parts);
      cause.el.setAttribute('data-drawn', full ? v : '');
      var rt = full ? F.RUBRIC_LINE[v] : '';
      if(rt !== rubShown){ rubShown = rt; if(rt) rubT.textContent = rt; rub.classList.toggle('is-in', !!rt); rub.setAttribute('data-v', full ? v : ''); }
      if(full && shownStop !== stop){
        shownStop = stop;
        say(F.VERBS[v].name + ' adds ' + F.ADD_LABEL[v] + '. Rubric: ' + F.RUBRIC_LINE[v] + ' Answer: ' + answerText() + '.');
      }
      if(!full) shownStop = -2;
    }
    function answerText(){ return F.ladderAnswer(ctx, LAD[stop]).map(function(x){ return x.text; }).join(' ').replace(/\.$/, ''); }
    function settled(){
      seen[stop] = true;
      if(!took && Object.keys(seen).length >= LAD.length && drawn() === stop){
        took = taking = true;
        cause.take('Each task verb asks for its own piece: read the verb, then write that piece.');
      }
    }

    /* ---------------------------------------------- the question page */
    function promptHtml(v){
      var pr = ctx.ladder.prompts[v], name = F.VERBS[v].name, re = new RegExp('^' + name.replace(/ /g, '\\s+'), 'i');
      return esc(pr).replace(re, function(m){ return '<b class="fcx-verb is-' + F.ADDS[v] + '">' + m + '</b>'; });
    }
    function paintQuestion(){
      kick.textContent = 'Question ' + (qi + 1) + ' of ' + ctxs.length + (ctx.id === 'country-a-people' ? ' · invented country' : '');
      promptEl.innerHTML = promptHtml(LAD[stop]);
      stopsEl.querySelectorAll('.fcx-stop').forEach(function(b, i){ b.setAttribute('aria-pressed', String(i === stop)); });
    }
    var pfT = 0;
    function swapPrompt(){
      if(K.reduced()){ paintQuestion(); return; }
      promptEl.classList.add('is-swap');
      clearTimeout(pfT);
      pfT = setTimeout(function(){ paintQuestion(); promptEl.classList.remove('is-swap'); }, 130);
    }

    /* ---------------------------------------------- controls */
    function setStop(i, how){
      i = Math.max(0, Math.min(LAD.length - 1, i | 0));
      act();
      if(i === stop){ if(drag.value() !== i) drag.value(i); return; }
      taking = false;
      stop = i; pref.v = i; save(PREF, pref);
      if(drag.value() !== i) drag.value(i);
      if(tour.active()) tour.did('drag');
      swapPrompt();
      stopsEl.querySelectorAll('.fcx-stop').forEach(function(b, j){ b.setAttribute('aria-pressed', String(j === stop)); });
      if(K.reduced()){ crossfade(); setAll(stop); words(); settled(); }
      else { words(); run(); }
      if(how === 'tap') bringIntoView();
    }
    function crossfade(){ ans.classList.remove('is-fade'); void ans.offsetWidth; ans.classList.add('is-fade'); }
    function act(){ if(!touched){ touched = true; hideCue(true); } }
    function nextQuestion(){
      act();
      if(tour.active()) tour.did('next');
      taking = false;
      qi = (qi + 1) % ctxs.length; pref.q = ctxs[qi].id; save(PREF, pref);
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
      var turn = function(){
        ctx = ctxs[qi]; buildAnswer(); paintQuestion(); if(G) place();
        if(K.reduced()){ setAll(stop); crossfade(); words(); settled(); }
        else { fast = true; words(); run(); }
      };
      if(K.reduced()){ turn(); return; }
      scene.classList.add('is-turn');
      setTimeout(function(){ turn(); scene.classList.remove('is-turn'); }, 170);
    }
    nextB.addEventListener('click', nextQuestion);
    stopsEl.addEventListener('click', function(e){ var b = e.target.closest('.fcx-stop'); if(b) setStop(+b.getAttribute('data-i'), 'tap'); });

    var drag = K.drag(layer, { key: 'aphug-frq-ladder', label: 'Task verb', min: 0, max: LAD.length - 1, step: 1, value: stop, track: [0, 0, 1, 1],
      valuetext: function(v){ return F.VERBS[LAD[v]].name + ', rung ' + (v + 1) + ' of ' + LAD.length; },
      onInput: function(v){ setStop(v); }, chip: false });
    drag.el.classList.add('fcx-drag');

    function bringIntoView(){
      if(window.innerWidth > 700) return;
      var r = aBox.getBoundingClientRect();
      if(r.top < 0 || r.bottom > window.innerHeight) try{ aBox.scrollIntoView({ block: 'nearest', behavior: K.reduced() ? 'auto' : 'smooth' }); }catch(e){}
    }

    /* ---------------------------------------------- layout: the booklet fits the stage */
    var G = null;   // geometry in px (the svg's viewBox is the scene in px)
    function fit(){
      if(!stage.isConnected || !scene.clientWidth) return false;
      var W = scene.clientWidth, vh = window.innerHeight, wide = W >= 880;
      var top = scene.getBoundingClientRect().top + (window.scrollY || 0);
      var room = vh - Math.min(top, vh * 0.4) - lines.offsetHeight - 22;
      var g = { W: W, wide: wide, pad: wide ? 16 : 8 };
      g.mid = W >= 560 && !wide;   // medium: one page, the art beside the prompt
      dims(g, Math.round(Math.max(wide ? 430 : 470, Math.min(wide ? 800 : 720, room))));
      G = g;
      scene.classList.toggle('is-wide', wide); scene.classList.toggle('is-mid', g.mid); scene.classList.toggle('is-narrow', !wide && !g.mid);
      g.shrunk = false; g.pw = 0;
      dims(g, g.H);
      place();
      return true;
    }
    function dims(g, H){
      var W = g.W;
      g.H = H;
      if(g.wide){
        g.ladW = 196;
        // pages keep a booklet's shape (about 4 wide to 5 tall): on a wide screen the desk shows at the sides
        // instead of the answer spreading into a few long lines with empty paper under them
        var avail = W - g.pad * 2 - g.ladW - 8, bh = g.H - g.pad * 2 - 12, pw0 = Math.min(avail / 2, g.pw || Math.max(360, bh * 0.8));
        g.book = [g.pad + 4 + Math.round((avail - pw0 * 2) / 2), g.pad + 6, Math.round(pw0 * 2), bh];
        var b = g.book, pw = b[2] / 2;
        g.left = [b[0], b[1], pw, b[3]]; g.right = [b[0] + pw, b[1], pw, b[3]];
        g.m = Math.max(20, Math.min(34, pw * 0.07));
        g.track = [b[0] + b[2] + 30, b[1] + b[3] - 100, b[0] + b[2] + 30, b[1] + 34];
      } else {
        g.book = [g.pad, g.pad, W - g.pad * 2, g.H - g.pad * 2];
        g.left = g.book.slice(); g.right = g.book.slice();
        g.m = W < 420 ? 14 : 20;
      }
      scene.style.height = g.H + 'px';
    }
    // the page text boxes (html over the drawing); the phone order: question, ladder, answer, rubric
    function place(){
      var g = G; if(!g) return;
      var m = g.m, L = g.left, R = g.right, st = stopsEl.querySelectorAll('.fcx-stop');
      reservePrompt();
      if(g.wide){
        // the stimulus takes the left page's height that the prompt does not need (a taller drawing, not a blank band)
        var lw = L[2] - m * 2;
        box(qBox, L[0] + m, L[1] + 12, lw, null);
        promptEl.style.marginTop = '0px'; reservePrompt();
        var pH = promptEl.offsetHeight, artTop = L[1] + 56, ah = L[1] + L[3] - 22 - pH - 18 - artTop;
        g.leftMin = 56 + lw * 120 / 260 + 18 + pH + 22;
        ah = Math.max(lw * 120 / 260, Math.min(lw * 1.08, ah));
        g.art = [L[0] + m, artTop, lw, ah];
        promptEl.style.marginTop = (g.art[3] + 18) + 'px';
        var ax = R[0] + m + 6, aw = R[2] - m * 2 - 18;
        box(aBox, ax, R[1] + 12, aw, null);
        var rubH = rubHeight(aw), rubTop = R[1] + R[3] - rubH - 16;
        box(rub, ax, rubTop, aw, null);
        var ansTop = R[1] + 12 + ans.offsetTop;
        g.ansBox = [ax, ansTop, aw, rubTop - 12 - ansTop];
        var t = g.track;
        st.forEach(function(b, i){ var y = t[1] + (t[3] - t[1]) * i / (st.length - 1); b.style.left = (t[0] + 26) + 'px'; b.style.top = (y - 22) + 'px'; b.style.width = (g.book[0] + g.book[2] + g.ladW - 6 - t[0] - 26) + 'px'; b.style.height = '44px'; });
        drag.place([t[0], t[1], t[2], t[3]]);
      } else {
        var x = L[0] + m, w = L[2] - m * 2;
        box(qBox, x, L[1] + 8, w, null);
        if(g.mid){ g.art = [x, L[1] + 56, w * 0.4, Math.min(150, w * 0.4 * 120 / 260)]; promptEl.style.marginTop = '10px'; promptEl.style.marginLeft = (w * 0.4 + 16) + 'px'; }
        else { g.art = [x, L[1] + 48, w, Math.min(g.W < 480 ? 92 : 124, w * 120 / 260)]; promptEl.style.marginLeft = '0px'; promptEl.style.marginTop = (g.art[3] + 10) + 'px'; }
        reservePrompt();
        var qBottom = Math.max(L[1] + 8 + qBox.offsetHeight, g.art[1] + g.art[3]);
        var ty = qBottom + 30, x0 = x + 18, x1 = x + w - 16;
        g.track = [x0, ty, x1, ty];
        // a narrow phone: the long last name takes three short lines, so it stays clear of Compare
        var lastB = st[st.length - 1], three = (x1 - x0) / (st.length - 1) < 84, lines3 = three ? ['Explain', 'the', 'degree'] : STOP_LINES['explain-degree'];
        if(lastB.getAttribute('data-lines') !== String(lines3.length)){ lastB.setAttribute('data-lines', lines3.length); lastB.innerHTML = lines3.map(function(t){ return '<span>' + esc(t) + '</span>'; }).join(''); }
        st.forEach(function(b, i){ var cx = x0 + (x1 - x0) * i / (st.length - 1), bw = Math.min(84, (x1 - x0) / (st.length - 1) + 10), last = i === st.length - 1, first = i === 0;
          // the end names hang inward from the page edge, so the long last name never crowds Compare
          b.classList.toggle('is-end', last); b.classList.toggle('is-start', first);
          b.style.left = (first ? x : last ? x + w - bw : cx - bw / 2) + 'px'; b.style.top = (ty + 26) + 'px'; b.style.width = bw + 'px'; b.style.height = (last && three ? 44 : 40) + 'px'; });
        g.three = three;
        drag.place([x0, ty, x1, ty]);
        var aTop = ty + 70;
        box(aBox, x, aTop, w, null);
        var rubH2 = rubHeight(w), rubTop2 = L[1] + L[3] - rubH2 - 10;
        box(rub, x, rubTop2, w, null);
        var ansTop2 = aTop + ans.offsetTop;
        g.ansBox = [x, ansTop2, w, rubTop2 - 10 - ansTop2];
      }
      var slack = fitText();
      // the scene is as tall as its content: the longest answer at the hand size chosen, never extra ruled lines
      // wide: first narrow the pages (the answer takes more lines), then, at the narrowest, shrink the scene
      if(g.wide && slack > 24 && g.book[2] / 2 > 380){
        g.pw = Math.max(370, g.book[2] / 2 - Math.max(16, slack * 0.35)); dims(g, g.H); place(); return;
      }
      if(!g.shrunk && slack > 4){
        var cut = g.wide ? Math.min(slack, g.book[3] - g.leftMin) : slack;
        if(cut > 4){ g.shrunk = true; dims(g, Math.round(g.H - cut)); place(); return; }
      }
      drawBook();
      if(cue && cue.active()) cue.place();
    }
    // the question's box keeps the height of its longest prompt, so nothing under it moves when the verb changes
    function reservePrompt(){
      var keep = promptEl.innerHTML, hMax = 0;
      promptEl.style.minHeight = '0px';
      LAD.forEach(function(v){ promptEl.innerHTML = promptHtml(v); hMax = Math.max(hMax, promptEl.offsetHeight); });
      promptEl.innerHTML = keep; promptEl.style.minHeight = hMax + 'px';
    }
    function box(el, x, y, w, h){ el.style.left = r1(x) + 'px'; el.style.top = r1(y) + 'px'; el.style.width = r1(w) + 'px'; if(h != null) el.style.height = r1(h) + 'px'; }
    function rubHeight(w){
      // the longest rubric line, measured once per width: the rubric box never changes height between rungs
      var keep = rubT.textContent; rub.style.width = w + 'px'; var hMax = 0;
      LAD.forEach(function(v){ rubT.textContent = F.RUBRIC_LINE[v]; hMax = Math.max(hMax, rub.offsetHeight); });
      rubT.textContent = keep || F.RUBRIC_LINE[LAD[stop]];
      return hMax;
    }
    // the hand-written answer: the largest size (up to 30 px wide, 20 px on a phone) at which this question's longest
    // rung fits its lines; returns the spare height (the caller shrinks the scene by it)
    function longest(){
      var keep = F.PIECES.map(function(k){ return P[k].el.classList.contains('is-gone'); }), h = 0;
      LAD.forEach(function(v){ F.PIECES.forEach(function(k){ if(k !== 'degree') P[k].el.classList.toggle('is-gone', F.WRITTEN[v].indexOf(k) < 0); }); h = Math.max(h, ans.scrollHeight); });
      F.PIECES.forEach(function(k, i){ P[k].el.classList.toggle('is-gone', keep[i]); });
      return h;
    }
    function fitText(){
      if(!G) return 0;
      var hmax = Math.max(60, G.ansBox[3]), lo = G.wide ? 15 : 14, hi = G.wide ? 30 : 20, s = hi, LH = G.wide ? 1.6 : 1.52, h = 0;
      ans.style.height = 'auto';
      function size(x){ ans.style.fontSize = x + 'px'; ans.style.setProperty('--lh', (x * LH).toFixed(2) + 'px'); }
      for(; s >= lo; s -= 0.5){ size(s); h = longest(); if(h <= hmax) break; }
      if(s < lo){ s = lo; size(s); h = longest(); }
      ans.style.height = Math.max(hmax, h) + 'px';
      var need = Math.ceil(h - hmax);
      if(need > 0){ G.H += need; scene.style.height = G.H + 'px'; G.book[3] += need; G.left[3] = G.right[3] = G.book[3]; G.ansBox[3] += need; rub.style.top = (parseFloat(rub.style.top) + need) + 'px'; return 0; }
      return Math.floor(hmax - h);
    }

    /* ---------------------------------------------- the drawing: desk, booklet, ladder */
    function drawBook(){
      var g = G; if(!g) return;
      var W = g.W, H = g.H, b = g.book, o = [];
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      o.push('<defs><linearGradient id="fcx-desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="fcx-desk-a"/><stop offset="1" class="fcx-desk-b"/></linearGradient>' +
        '<linearGradient id="fcx-gut" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="fcx-gut-0"/><stop offset=".5" class="fcx-gut-1"/><stop offset="1" class="fcx-gut-0"/></linearGradient>' +
        '<linearGradient id="fcx-pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="fcx-pg-a"/><stop offset="1" class="fcx-pg-b"/></linearGradient>' +
        '<filter id="fcx-sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-opacity=".28"/></filter></defs>');
      o.push('<rect class="fcx-desk" x="0" y="0" width="' + W + '" height="' + H + '" rx="14" fill="url(#fcx-desk)"/>');
      // wood grain
      for(var i = 0; i < 9; i++){ var y = H * (i + 0.5) / 9 + Math.sin(i * 1.7) * 6; o.push('<path class="fcx-grain" d="M0 ' + r1(y) + 'C' + r1(W * 0.3) + ' ' + r1(y - 8) + ' ' + r1(W * 0.6) + ' ' + r1(y + 9) + ' ' + W + ' ' + r1(y - 3) + '"/>'); }
      if(g.wide){
        // the ladder: index tabs that stick out of the booklet's right edge, one per verb, in its color
        var t = g.track;
        LAD.forEach(function(v, j){
          var y2 = t[1] + (t[3] - t[1]) * j / (LAD.length - 1), x0 = b[0] + b[2] - 12, x1 = b[0] + b[2] + g.ladW - 6;
          o.push('<path class="fcx-tab is-' + F.ADDS[v] + '" d="M' + r1(x0) + ' ' + r1(y2 - 20) + 'H' + r1(x1 - 12) + 'Q' + r1(x1) + ' ' + r1(y2 - 20) + ' ' + r1(x1) + ' ' + r1(y2 - 8) + 'V' + r1(y2 + 8) + 'Q' + r1(x1) + ' ' + r1(y2 + 20) + ' ' + r1(x1 - 12) + ' ' + r1(y2 + 20) + 'H' + r1(x0) + 'Z"/>');
        });
        o.push('<path class="fcx-rail" d="M' + t[0] + ' ' + r1(t[1] + 6) + 'V' + r1(t[3] - 6) + '"/>');
        // the open booklet: shadow, two pages, the gutter, the page edges
        o.push('<g filter="url(#fcx-sh)"><path class="fcx-page" d="M' + b[0] + ' ' + (b[1] + 6) + 'Q' + r1(b[0] + b[2] * 0.25) + ' ' + (b[1] - 2) + ' ' + r1(b[0] + b[2] / 2) + ' ' + (b[1] + 4) + 'Q' + r1(b[0] + b[2] * 0.75) + ' ' + (b[1] - 2) + ' ' + (b[0] + b[2]) + ' ' + (b[1] + 6) +
          'V' + (b[1] + b[3]) + 'Q' + r1(b[0] + b[2] * 0.75) + ' ' + (b[1] + b[3] - 7) + ' ' + r1(b[0] + b[2] / 2) + ' ' + (b[1] + b[3]) + 'Q' + r1(b[0] + b[2] * 0.25) + ' ' + (b[1] + b[3] - 7) + ' ' + b[0] + ' ' + (b[1] + b[3]) + 'Z" fill="url(#fcx-pg)"/></g>');
        o.push('<rect x="' + r1(b[0] + b[2] / 2 - 26) + '" y="' + (b[1] + 2) + '" width="52" height="' + (b[3] - 4) + '" fill="url(#fcx-gut)"/>');
        o.push('<path class="fcx-edge" d="M' + (b[0] + 3) + ' ' + (b[1] + b[3] + 3) + 'Q' + r1(b[0] + b[2] * 0.25) + ' ' + (b[1] + b[3] - 4) + ' ' + r1(b[0] + b[2] / 2) + ' ' + (b[1] + b[3] + 3) + 'Q' + r1(b[0] + b[2] * 0.75) + ' ' + (b[1] + b[3] - 4) + ' ' + (b[0] + b[2] - 3) + ' ' + (b[1] + b[3] + 3) + '"/>');
        rules(o, g.ansBox);
      } else {
        o.push('<g filter="url(#fcx-sh)"><rect class="fcx-page" x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '" rx="6" fill="url(#fcx-pg)"/></g>');
        o.push('<path class="fcx-edge" d="M' + (b[0] + 4) + ' ' + (b[1] + b[3] + 3) + 'H' + (b[0] + b[2] - 4) + '"/>');
        // the ladder printed across the page, in the verbs' colors
        var tr = g.track;
        o.push('<rect class="fcx-band" x="' + r1(b[0] + g.m - 4) + '" y="' + r1(tr[1] - 24) + '" width="' + r1(b[2] - g.m * 2 + 8) + '" height="' + (g.three ? 90 : 86) + '" rx="12"/>');
        o.push('<path class="fcx-rail" d="M' + tr[0] + ' ' + tr[1] + 'H' + tr[2] + '"/>');
        LAD.forEach(function(v, j){ var cx = tr[0] + (tr[2] - tr[0]) * j / (LAD.length - 1); o.push('<circle class="fcx-dot is-' + F.ADDS[v] + '" cx="' + r1(cx) + '" cy="' + tr[1] + '" r="7"/>'); });
        // the fold between the question and the answer
        var fy = tr[1] + 66;
        o.push('<path class="fcx-fold" d="M' + (b[0] + 2) + ' ' + r1(fy) + 'H' + (b[0] + b[2] - 2) + '"/>');
        rules(o, g.ansBox);
      }
      var aw = g.art;
      o.push('<g class="fcx-artg"><rect class="fcx-artbg" x="' + r1(aw[0]) + '" y="' + r1(aw[1]) + '" width="' + r1(aw[2]) + '" height="' + r1(aw[3]) + '" rx="8"/></g>');
      o.push('<g class="fcx-art"></g>');
      svg.innerHTML = o.join('');
      drawArt();
    }
    // ruled lines under the hand-written answer, at the answer's line height
    function rules(o, a){
      var lh = parseFloat(ans.style.getPropertyValue('--lh')) || 28, y0 = a[1], n = Math.floor((a[3] + 4) / lh);
      for(var i = 1; i <= n; i++) o.push('<path class="fcx-rule" d="M' + r1(a[0] - 4) + ' ' + r1(y0 + i * lh - lh * 0.22) + 'H' + r1(a[0] + a[2] + 2) + '"/>');
      o.push('<path class="fcx-margin" d="M' + r1(a[0] - 9) + ' ' + r1(y0 - 2) + 'V' + r1(a[1] + a[3]) + '"/>');
    }

    /* ---------------------------------------------- the stimulus drawings (a 260 x 120 box, scaled) */
    function drawArt(){
      var g = G, grp = svg.querySelector('.fcx-art'); if(!g || !grp) return;
      // the drawing is 260 wide and 120 to 210 tall (VH): a taller box gets a taller scene, not empty bands
      var a = g.art, k, VH;
      if(a[3] / a[2] < 120 / 260){ k = a[3] / 120; VH = 120; } else { k = a[2] / 260; VH = Math.min(282, a[3] / k); }
      var ox = a[0] + (a[2] - 260 * k) / 2, oy = a[1] + (a[3] - VH * k) / 2;
      var fs = r1(Math.max(12.5, Math.min(16, a[2] * 0.03)) / k);
      grp.setAttribute('transform', 'translate(' + r1(ox) + ' ' + r1(oy) + ') scale(' + k.toFixed(4) + ')');
      grp.innerHTML = ART[ctx.ladder.art] ? ART[ctx.ladder.art](fs, Math.round(VH)) : '';
      grp.setAttribute('data-art', ctx.ladder.art);
    }

    /* ---------------------------------------------- the first visit cue and "Show me how" */
    var cue = null;
    function makeCue(){
      if(touched || !G || !onScreen) return;
      if(cue) cue.hide(false);
      // wide: under the knob, below its tab; phone: beside the knob on the printed ladder (over the line, never a name)
      var side = G.wide ? 'below' : stop >= 2 ? 'left' : 'right';
      cue = K.cue(layer, { key: 'aphug-frq-ladder', text: 'Drag the verb', side: side,
        at: function(){ var t = G.track, f = stop / (LAD.length - 1); return G.wide ? [t[0] + 16, t[1] + (t[3] - t[1]) * f + 18] : [t[0] + (t[2] - t[0]) * f + (stop >= 2 ? -24 : 24), t[1]]; } });
      if(!cue.show()) cue = null;
    }
    function hideCue(used){ if(cue && cue.active()) cue.hide(used); }
    var tour = K.tour({ key: 'aphug-frq-coach', label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag the verb up the ladder. The question asks for more, and the answer grows by one piece.', target: function(){ return drag.el.querySelector('.tk2-knob'); } },
      { id: 'read', text: 'The new piece is in the verb’s color. The rubric line under the answer names it.', target: function(){ return rub; } },
      { id: 'next', text: 'Turn to the next question to see the same ladder on another topic.', target: function(){ return nextB; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function startTour(){ hideCue(false); tour.start(true); }
    rub.addEventListener('pointerdown', function(){ if(tour.active()) tour.did('read'); });

    /* ---------------------------------------------- "?" */
    var ref = document.createElement('div'); ref.className = 'ls-sec fcx-ref';
    ref.innerHTML = '<p class="fcx-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use the ladder.</p>' +
      '<h3 class="ls-h">The six task verbs</h3>' +
      T.dataTable(['Verb', 'What earns the point', 'The slip readers see most'], F.VERB_ORDER.map(function(v){ return [F.VERBS[v].name, F.VERBS[v].demand, F.VERBS[v].slip]; }), 'Task verbs on the free-response questions') +
      '<h3 class="ls-h">How a part is scored</h3>' +
      '<p>Each part earns one point or none. Readers score what you wrote against the rubric line, so the verb decides what counts: a name earns an identify point, but not a describe or an explain point. Extra correct detail does not cost the point.</p>' +
      '<p>For explain the degree, state the degree first (high, moderate or low) and then explain it. Any degree can earn the point when the explanation supports it.</p>' +
      '<h3 class="ls-h">About the ladder</h3>' +
      '<p>The ladder shows five of the verbs in the order they usually grow. Compare is a step to the side: it needs both sides, not the because, so the because stays on the page in gray. Explain the degree needs the degree and the explanation, not the second side. Define is not on the ladder: it asks for a meaning in your own words, and it is in Test yourself.</p>' +
      '<p class="ls-sub">The questions are original and short, never released exam questions. On the exam each free-response question has parts A to G, one point each. Country A is an invented country. Facts: polders (Rijkswaterstaat); the Green Revolution in India from the late 1960s; the HDI of the UN Development Programme.</p>';
    ref.addEventListener('click', function(e){ if(e.target.closest('[data-how]')){ if(LS && LS.close) LS.close(); setTimeout(startTour, 280); } });

    /* ---------------------------------------------- resize and life cycle */
    var rz = 0;
    function relayout(){ if(!onScreen) return; if(fit()){ words(); if(cue && cue.active()) makeCue(); } }
    function resized(){ clearTimeout(rz); rz = setTimeout(relayout, 60); }
    window.addEventListener('resize', resized);
    if(window.ResizeObserver) new ResizeObserver(function(){ resized(); }).observe(scene);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ resized(); });

    function shown(m){
      onScreen = m === 'explore';
      if(!onScreen){ finish(); hideCue(false); if(tour.active()) tour.stop(); clearTimeout(rz); clearTimeout(pfT); promptEl.classList.remove('is-swap'); paintQuestion(); scene.classList.remove('is-turn'); return; }
      setTimeout(function(){ relayout(); makeCue(); }, 40);
      setTimeout(function(){ if(onScreen && !touched) makeCue(); }, 700);
    }
    function ready(s){ LS = s; setTimeout(relayout, 30); }

    buildAnswer(); setAll(stop); paintQuestion();
    scene.addEventListener('pointerdown', function(e){ if(e.target.closest('.tk2-knob, .tk2-groove, .fcx-stop, .fcx-next')) act(); });
    if(!T.studioOf || !T.studioOf(host)){ host.appendChild(stage); setTimeout(function(){ onScreen = true; relayout(); }, 0); }

    var api = { stage: stage, ref: ref, shown: shown, ready: ready,
      stop: function(i, instant){ if(i === undefined) return stop; setStop(i); if(instant) finish(); },
      next: nextQuestion, finish: finish, drawn: drawn, running: function(){ return !!raf; },
      ctx: function(){ return ctx.id; }, question: function(id){ var j = ctxs.map(function(c){ return c.id; }).indexOf(id); if(j > -1 && j !== qi){ qi = (j - 1 + ctxs.length) % ctxs.length; nextQuestion(); } },
      // what is on screen, read from the page (for the frame checks)
      state: function(){
        var out = { stop: stop, verb: LAD[stop], drawn: drawn(), pieces: {}, prompt: promptEl.textContent, promptVerb: (promptEl.querySelector('.fcx-verb') || {}).textContent || '',
          cause: [].map.call(cause.el.querySelectorAll('.tk2-cz'), function(e){ return e.textContent; }), take: cause.el.classList.contains('is-take'),
          rubric: rub.classList.contains('is-in') ? rubT.textContent : '', rubricFor: rub.getAttribute('data-v') || '' };
        F.PIECES.forEach(function(k){ var p = P[k]; out.pieces[k] = { shown: p.shown, n: p.n, on: p.el.classList.contains('is-on'), quiet: p.el.classList.contains('is-quiet') }; });
        return out;
      },
      _key: function(){ return ctx.ladder.keys[F.ADDS[LAD[stop]]]; }, _G: function(){ return G; }, _cue: function(){ touched = false; makeCue(); return !!(cue && cue.active()); } };
    window.FrqCoachExplore = api;   // for the sweep, frame and perf checks (scripts/tools-v2/hug-frq-coach-*.mjs)
    return api;
  }

  /* The stimulus drawings, one per question (a 260 x 120 box; fs: the label size that renders at 12.5 px). */
  function lbl(x, y, t, fs, anchor, cls){ return '<text class="fcx-al' + (cls ? ' ' + cls : '') + '" x="' + x + '" y="' + y + '" font-size="' + fs + '" text-anchor="' + (anchor || 'middle') + '">' + esc(t) + '</text>'; }
  // VH: the drawing's height (120 to 210) in a 260 wide box; the landscapes keep their ground at the bottom and grow
  // their sky, the maps and charts use the whole height.
  function clouds(VH){
    if(VH < 150) return '';
    var y = (VH - 120) * 0.45;
    return '<g class="a-cloud"><ellipse cx="60" cy="' + r1(y) + '" rx="22" ry="8"/><ellipse cx="74" cy="' + r1(y - 5) + '" rx="14" ry="8"/>' +
      '<ellipse cx="170" cy="' + r1(y + 10) + '" rx="26" ry="8"/><ellipse cx="186" cy="' + r1(y + 5) + '" rx="14" ry="7"/></g>';
  }
  function up(VH, inner){ return '<g transform="translate(0 ' + (VH - 120) + ')">' + inner + '</g>'; }
  var ART = {
    polders: function(fs, VH){
      var d = VH - 120;
      return '<rect class="a-sky" x="0" y="0" width="260" height="' + VH + '" rx="6"/>' + clouds(VH) +
        '<path class="a-sea" d="M0 ' + (44 + d) + 'H96L104 ' + VH + 'H0Z"/>' +
        up(VH, '<path class="a-wave" d="M6 52q6 -4 12 0t12 0t12 0M40 66q6 -4 12 0t12 0t12 0M10 82q6 -4 12 0t12 0t12 0"/>' +
        '<path class="a-dike" d="M88 120L100 34H118L132 120Z"/><path class="a-dike-top" d="M100 34H118"/>' +
        '<path class="a-land" d="M128 74H260V120H128Z"/><path class="a-field" d="M134 74H258V80H134Z"/>' +
        '<path class="a-canal" d="M150 80H250V86H150Z"/>' +
        '<g class="a-mill" transform="translate(218 44)"><path d="M-6 30L-3 0H3L6 30Z" class="a-millb"/><path d="M0 0L-16 -14M0 0L14 -16M0 0L16 14M0 0L-14 16" class="a-sail"/><circle r="2.5" class="a-hub"/></g>' +
        '<g class="a-cow" transform="translate(166 66)"><rect x="-7" y="-5" width="14" height="7" rx="3"/><path d="M-5 2v4M5 2v4M7 -4l3 -2"/></g>' +
        '<path class="a-sealev" d="M0 44H260"/>' +
        lbl(48, 36, 'Sea', fs) + lbl(109, 26, 'Dike', fs) + lbl(190, 106, 'Polder', fs));
    },
    wheat: function(fs, VH){
      var o = '<rect class="a-sky" x="0" y="0" width="260" height="' + VH + '" rx="6"/>' + clouds(VH) + '<circle class="a-sun" cx="226" cy="22" r="11"/>' +
        '<path class="a-hill" d="M0 ' + (62 + VH - 120) + 'Q60 ' + (40 + VH - 120) + ' 130 ' + (58 + VH - 120) + 'T260 ' + (54 + VH - 120) + 'V' + VH + 'H0Z"/>';
      var g = '<path class="a-land" d="M0 62H260V120H0Z"/>';
      for(var r = 0; r < 4; r++) for(var c = 0; c < 15; c++){ var x = 8 + c * 11 + (r % 2) * 5, y = 70 + r * 12; g += '<path class="a-stalk" d="M' + x + ' ' + (y + 10) + 'V' + y + '"/><ellipse class="a-ear" cx="' + x + '" cy="' + (y - 3) + '" rx="2.2" ry="5"/>'; }
      g += '<g transform="translate(200 52)"><rect class="a-well" x="-12" y="0" width="24" height="18" rx="2"/><path class="a-pipe" d="M12 10H30V22"/><path class="a-water" d="M30 24q-3 8 0 18M26 26q-6 9 -18 16"/></g>' +
        '<path class="a-chan" d="M204 120L230 76H238L214 120Z"/>';
      return o + up(VH, g + lbl(70, 52, 'Punjab, India', fs) + lbl(200, 46, 'Well', fs));
    },
    city: function(fs, VH){
      var d = VH - 120, o = '<rect class="a-sky" x="0" y="0" width="260" height="' + VH + '" rx="6"/>' + clouds(VH), g = '<path class="a-land" d="M0 82H260V120H0Z"/>';
      [[14, 40 - d * 0.5], [28, 26 - d * 0.6], [44, 34 - d * 0.4], [58, 18 - d * 0.7], [74, 38 - d * 0.3]].forEach(function(b){ var y0 = Math.round(b[1]); g += '<rect class="a-tower" x="' + b[0] + '" y="' + y0 + '" width="13" height="' + (82 - y0) + '"/>'; for(var y = y0 + 5; y < 78; y += 8) g += '<path class="a-win" d="M' + (b[0] + 3) + ' ' + y + 'h7"/>'; });
      g += '<path class="a-road" d="M88 100C130 96 170 92 258 90"/><path class="a-roadln" d="M92 100C134 96 172 92 256 90"/>';
      [[112, 74], [134, 72], [156, 70], [180, 69], [204, 68], [228, 67], [150, 106], [190, 104], [230, 102]].forEach(function(h){ g += '<path class="a-house" d="M' + h[0] + ' ' + (h[1] + 10) + 'V' + (h[1] + 3) + 'L' + (h[0] + 6) + ' ' + (h[1] - 3) + 'L' + (h[0] + 12) + ' ' + (h[1] + 3) + 'V' + (h[1] + 10) + 'Z"/>'; });
      g += '<rect class="a-car" x="166" y="90" width="12" height="5" rx="2"/><rect class="a-car" x="120" y="95" width="12" height="5" rx="2"/>';
      return o + up(VH, g + lbl(46, Math.round(8 - d * 0.7), 'Downtown', fs) + lbl(196, 52, 'Suburbs', fs) + lbl(130, 116, 'Highway', fs));
    },
    chart: function(fs, VH){
      // a figure on graph paper: births stay high, deaths fall (stage 2), with its axis titles
      var t = 12, b = VH - 30, l = 34, r = 250, o = '<rect class="a-paper" x="0" y="0" width="260" height="' + VH + '" rx="6"/>';
      for(var x = l; x <= r; x += 18) o += '<path class="a-grid" d="M' + x + ' ' + t + 'V' + b + '"/>';
      for(var y = b; y >= t; y -= 18) o += '<path class="a-grid" d="M' + l + ' ' + y + 'H' + r + '"/>';
      var Y = function(f){ return r1(t + (b - t) * f); };
      o += '<path class="a-axis" d="M' + l + ' ' + (t - 2) + 'V' + b + 'H' + (r + 2) + '"/>' +
        '<path class="a-nat" d="M' + l + ' ' + Y(0.17) + 'C90 ' + Y(0.15) + ' 150 ' + Y(0.17) + ' ' + r + ' ' + Y(0.16) + 'V' + Y(0.85) + 'C210 ' + Y(0.82) + ' 170 ' + Y(0.7) + ' 140 ' + Y(0.55) + 'S80 ' + Y(0.25) + ' ' + l + ' ' + Y(0.22) + 'Z"/>' +
        '<path class="a-birth" d="M' + l + ' ' + Y(0.17) + 'C90 ' + Y(0.15) + ' 150 ' + Y(0.17) + ' ' + r + ' ' + Y(0.16) + '"/>' +
        '<path class="a-death" d="M' + l + ' ' + Y(0.22) + 'C80 ' + Y(0.25) + ' 110 ' + Y(0.4) + ' 140 ' + Y(0.55) + 'S210 ' + Y(0.82) + ' ' + r + ' ' + Y(0.85) + '"/>';
      return o + lbl(62, Y(0.08), 'Births', fs, 'start', 'is-birth') + lbl(206, Y(0.74), 'Deaths', fs, 'middle', 'is-death') +
        lbl(142, VH - 10, 'Time, stage 2', fs) + '<text class="fcx-al" font-size="' + fs + '" transform="translate(' + r1(14 + fs * 0.35) + ' ' + r1((t + b) / 2) + ') rotate(-90)" text-anchor="middle">Rate</text>';
    },
    ship: function(fs, VH){
      var d = (VH - 120) / 2, o = '<rect class="a-seab" x="0" y="0" width="260" height="' + VH + '" rx="6"/>';
      for(var i = 0; i < Math.floor(VH / 30); i++) o += '<path class="a-wave2" d="M' + (20 + (i % 3) * 70) + ' ' + (16 + i * 28) + 'q6 -4 12 0t12 0"/>';
      return o + '<g transform="translate(0 ' + r1(d) + ')"><path class="a-landm" d="M14 30q10 -12 22 -6t14 18q-4 14 -18 14t-18 -26Z"/>' +
        '<path class="a-landm" d="M190 70q22 -20 46 -6q18 12 8 30q-14 16 -34 10q-22 -6 -20 -34Z"/>' +
        '<path class="a-route" d="M44 52C90 40 150 52 190 76"/>' +
        '<g transform="translate(116 46)"><path class="a-hull" d="M-14 6H14L9 13H-9Z"/><path class="a-mast" d="M0 6V-16"/><path class="a-sailw" d="M1 -15L13 2H1Z"/><path class="a-sailw" d="M-1 -13L-11 2H-1Z"/></g>' +
        lbl(34, 66, 'Britain', fs) + lbl(222, 112, 'Australia', fs) + lbl(130, 24, 'Settlers', fs) + '</g>';
    },
    borders: function(fs, VH){
      var sy = VH / 120;
      return '<rect class="a-seab" x="0" y="0" width="260" height="' + VH + '" rx="6"/>' +
        '<g transform="scale(1 ' + sy.toFixed(3) + ')"><path class="a-landm" d="M30 14H220Q236 30 232 60Q226 96 190 112H60Q24 92 22 54Q22 26 30 14Z"/>' +
        '<path class="a-grp1" d="M44 30q40 -10 66 10q10 30 -14 46q-34 8 -52 -14q-10 -26 0 -42Z"/>' +
        '<path class="a-grp2" d="M120 46q34 -16 70 0q16 26 0 50q-34 14 -60 0q-20 -22 -10 -50Z"/>' +
        '<path class="a-border" d="M104 14V112M104 62H232" vector-effect="non-scaling-stroke"/></g>' +
        lbl(178, r1(36 * sy), 'Straight border', fs) + lbl(74, r1(104 * sy), 'Group A', fs, 'middle', 'is-g') + lbl(162, r1(84 * sy), 'Group B', fs, 'middle', 'is-g');
    },
    countrya: function(fs, VH){
      var sy = VH / 120, P2 = function(x, y){ return x + ' ' + r1(y * sy); };
      var dots = [[120, 62], [128, 58], [114, 56], [126, 68], [134, 64], [118, 70], [80, 100], [96, 102], [112, 100], [130, 102], [148, 100], [166, 98], [184, 94], [70, 34], [200, 60], [104, 64], [140, 72]];
      return '<rect class="a-seab" x="0" y="0" width="260" height="' + VH + '" rx="6"/>' +
        '<path class="a-landm" d="M' + P2(24, 20) + 'Q' + P2(80, 6) + ' ' + P2(150, 12) + 'Q' + P2(226, 14) + ' ' + P2(238, 46) + 'Q' + P2(242, 80) + ' ' + P2(214, 100) + 'Q' + P2(160, 114) + ' ' + P2(100, 108) + 'Q' + P2(40, 104) + ' ' + P2(22, 78) + 'Q' + P2(12, 46) + ' ' + P2(24, 20) + 'Z"/>' +
        '<path class="a-hills" d="M40 ' + r1(36 * sy) + 'l12 -12l12 12l12 -14l12 14l12 -12l12 12"/>' +
        '<g class="a-dots">' + dots.map(function(q){ return '<circle cx="' + q[0] + '" cy="' + r1(q[1] * sy) + '" r="3"/>'; }).join('') + '</g>' +
        '<g class="a-trees">' + [[196, 40], [208, 46], [214, 34], [222, 52], [204, 58]].map(function(q){ return '<circle cx="' + q[0] + '" cy="' + r1(q[1] * sy) + '" r="5"/>'; }).join('') + '</g>' +
        lbl(130, r1(84 * sy), 'Capital Region', fs) + lbl(76, r1(36 * sy + 16), 'Northern Hills', fs) + lbl(130, r1(VH - 4), 'South Coast', fs);
    },
    hdi: function(fs, VH){
      // three small scenes (a clinic, a school, a paycheck) that feed one score from 0 to 1
      var z = Math.min(1.7, VH / 120), iy = Math.max(62, Math.round(VH * 0.4)), gy = VH - 24, o = '<rect class="a-paper" x="0" y="0" width="260" height="' + VH + '" rx="6"/>';
      o += '<g transform="translate(46 ' + iy + ') scale(' + z.toFixed(2) + ')"><path class="a-bld" d="M-22 14V-8L0 -20L22 -8V14Z"/><rect class="a-cross" x="-3" y="-14" width="6" height="16"/><rect class="a-cross" x="-8" y="-9" width="16" height="6"/><rect class="a-door" x="-5" y="4" width="10" height="10"/></g>' +
        '<g transform="translate(130 ' + iy + ') scale(' + z.toFixed(2) + ')"><path class="a-bld2" d="M-24 14V-6H24V14Z"/><path class="a-roof" d="M-28 -6L0 -20L28 -6Z"/><path class="a-flag" d="M18 -20V-34L28 -30L18 -26"/><rect class="a-door" x="-5" y="4" width="10" height="10"/><rect class="a-winb" x="-18" y="-1" width="8" height="6"/><rect class="a-winb" x="10" y="-1" width="8" height="6"/></g>' +
        '<g transform="translate(214 ' + iy + ') scale(' + z.toFixed(2) + ')"><rect class="a-check" x="-24" y="-14" width="48" height="26" rx="3"/><path class="a-checkln" d="M-18 -6H6M-18 0H0M-18 6H12"/><circle class="a-coin" cx="18" cy="8" r="8"/></g>' +
        '<path class="a-arrowh" d="M46 ' + r1(iy + 18 * z) + 'L112 ' + (gy - 8) + 'M130 ' + r1(iy + 18 * z) + 'V' + (gy - 12) + 'M214 ' + r1(iy + 18 * z) + 'L148 ' + (gy - 8) + '"/>' +
        '<rect class="a-score" x="' + r1(130 - fs * 3.3) + '" y="' + r1(gy + 6 - fs * 1.05) + '" width="' + r1(fs * 6.6) + '" height="' + r1(fs * 1.6) + '" rx="' + r1(fs * 0.8) + '"/>';
      return o + lbl(130, gy + 6, 'HDI, 0 to 1', fs, 'middle', 'is-score') +
        lbl(46, r1(iy - 26 * z), 'Health', fs) + lbl(130, r1(iy - 38 * z), 'Education', fs) + lbl(214, r1(iy - 20 * z), 'Income', fs);
    }
  };

  /* ========================================================= TEST YOURSELF */
  function quiz(host, data){
    var byId = {}; (data.contexts || []).forEach(function(c){ byId[c.id] = c; });
    T.drill(host, data, { slug: 'frq-coach', noun: 'drill',
      generate: function(r, ctx, type){ return F.generate(r, ctx, type); },
      types: F.TYPES.map(function(t){ return { value: t, label: F.TYPE_LABEL[t] }; }),
      typeLabel: 'Practice',
      newLabel: 'New question',
      title: function(p){ return F.TYPE_LABEL[p.type] + ': ' + byId[p.ctx].title; },
      extra: function(el, p, api){ if(p.type === 'write') writeBox(el, byId[p.ctx], p, api); }
    });
  }
  /* "Write a part yourself": the old Explore's writing box. Write, with link words and a checklist that gives hints,
     never a score; the rubric line any time; the step (which answer earns the point) waits for a real try (four
     letters), as the full-credit sample did before (owner F6, F8). Drafts are kept on this device. */
  function writeBox(el, ctx, p, api){
    var part = ctx.parts.filter(function(x){ return x.label === p.parts[0]; })[0], v = F.VERBS[part.verb], nid = T.nid('fw'), key = ctx.id + ':' + part.label;
    var drafts = load(KEY), area = api.area;
    el.innerHTML = '<div class="hug-fc-w"><div class="hug-fc-verbcard"><p class="hug-fc-vk">Part ' + esc(part.label) + ' asks you to</p><p class="hug-fc-vn">' + esc(v.name) + '</p><p class="hug-fc-vd">' + esc(v.demand) + '</p></div>' +
      '<p class="hug-fc-wq">' + F.promptHtml(part) + '</p>' +
      '<label class="hug-fc-sh" for="' + nid + '">Write your answer</label>' +
      (LINKS[part.verb].length ? '<div class="hug-fc-ins-row" role="group" aria-label="Add a link word">' + LINKS[part.verb].map(function(w){ return '<button type="button" class="hug-fc-ins" data-w="' + esc(w) + '">' + esc(w) + '</button>'; }).join('') + '</div>' : '') +
      '<textarea id="' + nid + '" class="hug-fc-write" rows="4" aria-describedby="' + nid + '-f">' + esc(drafts[key] || '') + '</textarea>' +
      '<ul class="hug-fc-flags" id="' + nid + '-f" aria-live="polite"></ul><p class="bt-small">The checklist gives hints, never a score.</p>' +
      '<div class="hug-fc-rubw"><button type="button" class="bt-btn hug-fc-show">Show the rubric line</button></div></div>';
    var note = document.createElement('p'); note.className = 'hug-fcw-note bt-small';
    note.textContent = 'Write your answer first (a few words). Then pick which of two answers earns the point.';
    var steps = area.querySelector('.cd-steps'); if(steps) area.insertBefore(note, steps);
    var ta = el.querySelector('textarea'), ul = el.querySelector('.hug-fc-flags');
    function tried(){ return ((ta.value || '').match(/[A-Za-z]/g) || []).length >= 4; }
    function gate(){ area.classList.toggle('hug-fcw-wait', !tried()); }
    function flags(){
      var G = window.ApHugGrade, spec = F.flagsFor(part), rules = Object.keys(spec.write), text = ta.value;
      if(!G || !rules.length){ ul.innerHTML = ''; return; }
      if(!text.trim()){ ul.innerHTML = rules.map(function(r){ return '<li class="is-todo"><span class="hug-mark">' + CHECK_NAME[r] + '</span> ' + esc(hintOf(r)) + '</li>'; }).join(''); return; }
      var out = G.flags(spec, text);
      if(part.verb === 'explain-degree'){ var first = G.flags({ write: { degree: true } }, text.split(/[:.;]/)[0]); out = out.map(function(f){ return f.rule === 'degree' ? first[0] : f; }); }
      ul.innerHTML = out.map(function(f){ return '<li class="' + (f.ok ? 'is-ok' : 'is-no') + '"><span class="hug-mark ' + (f.ok ? 'ok' : 'no') + '">' + (CHECK_NAME[f.rule] || f.rule) + '</span> ' + esc(f.ok ? CHECK_OK[f.rule] || 'OK' : f.hint) + '</li>'; }).join('');
    }
    function hintOf(r){ return { mechanism: 'Give the link: a cause, then "because" or "so", then its effect.', both: 'Say it about both things: "whereas", "both", "but".', degree: 'Open with the degree: "To a moderate degree,".', scale: 'Name the scale: global, regional, national or local.' }[r]; }
    function onWrite(){ drafts = load(KEY); drafts[key] = ta.value; save(KEY, drafts); flags(); gate(); }
    ta.addEventListener('input', onWrite);
    el.addEventListener('click', function(e){
      var t = e.target.closest('button'); if(!t) return;
      if(t.classList.contains('hug-fc-ins')){
        var w = t.getAttribute('data-w'), s = ta.selectionStart != null ? ta.selectionStart : ta.value.length, e2 = ta.selectionEnd != null ? ta.selectionEnd : s;
        var before = ta.value.slice(0, s), after = ta.value.slice(e2), cap = /^[A-Z]/.test(w), pad = before && !/\s$/.test(before) ? ' ' : '';
        var ins = (cap && before.trim() ? w.charAt(0).toLowerCase() + w.slice(1) : w) + ' ';
        if(cap && !before.trim()){ ta.value = ins + after.replace(/^\s+/, ''); s = ins.length; }
        else { ta.value = before + pad + ins + after; s = (before + pad + ins).length; }
        ta.focus(); try{ ta.setSelectionRange(s, s); }catch(x){}
        onWrite();
      } else if(t.classList.contains('hug-fc-show')){
        t.parentNode.innerHTML = '<div class="hug-fc-rub" tabindex="-1"><p class="hug-fc-rk">Rubric line (1 point)</p><p>' + esc(part.rubric) + '</p></div>';
        var r = el.querySelector('.hug-fc-rub'); if(r) r.focus();
      }
    });
    flags(); gate();
  }
})();
