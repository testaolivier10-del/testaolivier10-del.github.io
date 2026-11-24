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
      if(p.f > 0 && n === 0) n = 0;
      if(n === p.shown) return;
      for(var i = Math.min(n, p.shown); i < Math.max(n, p.shown); i++) p.words[i].classList.toggle('is-in', i < n);
      p.shown = n;
    }
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
        if(mv) P[mv].f = Math.min(1, P[mv].f + dt * (fast ? 52 : 32) / Math.max(4, P[mv].n));
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
      g.H = Math.round(Math.max(wide ? 430 : 470, Math.min(wide ? 640 : 720, room)));
      if(wide){
        g.ladW = 196;
        g.book = [g.pad + 4, g.pad + 6, W - g.pad * 2 - g.ladW - 8, g.H - g.pad * 2 - 12];
        var b = g.book, pw = b[2] / 2;
        g.left = [b[0], b[1], pw, b[3]]; g.right = [b[0] + pw, b[1], pw, b[3]];
        g.m = Math.max(20, Math.min(34, pw * 0.07));
        g.track = [b[0] + b[2] + 30, b[1] + b[3] - 64, b[0] + b[2] + 30, b[1] + 36];
      } else {
        g.book = [g.pad, g.pad, W - g.pad * 2, g.H - g.pad * 2];
        g.left = g.book.slice(); g.right = g.book.slice();
        g.m = W < 420 ? 14 : 20;
      }
      G = g;
      scene.style.height = g.H + 'px';
      scene.classList.toggle('is-wide', wide); scene.classList.toggle('is-mid', g.mid); scene.classList.toggle('is-narrow', !wide && !g.mid);
      place();
      return true;
    }
    // the page text boxes (html over the drawing); the phone order: question, ladder, answer, rubric
    function place(){
      var g = G; if(!g) return;
      var m = g.m, L = g.left, R = g.right, st = stopsEl.querySelectorAll('.fcx-stop');
      reservePrompt();
      if(g.wide){
        g.art = [L[0] + m, L[1] + 54, L[2] - m * 2, Math.min(L[3] * 0.5, (L[2] - m * 2) * 120 / 260)];
        box(qBox, L[0] + m, L[1] + 12, L[2] - m * 2, null);
        promptEl.style.marginTop = (g.art[3] + 18) + 'px';
        var ax = R[0] + m + 6, aw = R[2] - m * 2 - 6;
        box(aBox, ax, R[1] + 12, aw, null);
        var rubH = rubHeight(aw), rubTop = R[1] + R[3] - rubH - 16;
        box(rub, ax, rubTop, aw, null);
        var ansTop = R[1] + 12 + ans.offsetTop;
        g.ansBox = [ax, ansTop, aw, rubTop - 12 - ansTop];
        var t = g.track;
        st.forEach(function(b, i){ var y = t[1] + (t[3] - t[1]) * i / (st.length - 1); b.style.left = (t[0] + 26) + 'px'; b.style.top = (y - 22) + 'px'; b.style.width = (g.W - t[0] - 26 - g.pad) + 'px'; b.style.height = '44px'; });
        drag.place([t[0], t[1], t[2], t[3]]);
      } else {
        var x = L[0] + m, w = L[2] - m * 2;
        box(qBox, x, L[1] + 8, w, null);
        if(g.mid){ g.art = [x, L[1] + 52, w * 0.4, Math.min(150, w * 0.4 * 0.5)]; promptEl.style.marginTop = '0px'; promptEl.style.marginLeft = (w * 0.4 + 16) + 'px'; }
        else { g.art = [x, L[1] + 48, w, Math.min(g.W < 480 ? 92 : 124, w * 120 / 260)]; promptEl.style.marginLeft = '0px'; promptEl.style.marginTop = (g.art[3] + 10) + 'px'; }
        reservePrompt();
        var qBottom = Math.max(L[1] + 8 + qBox.offsetHeight, g.art[1] + g.art[3]);
        var ty = qBottom + 30, x0 = x + 26, x1 = x + w - 26;
        g.track = [x0, ty, x1, ty];
        st.forEach(function(b, i){ var cx = x0 + (x1 - x0) * i / (st.length - 1), bw = Math.min(84, (x1 - x0) / (st.length - 1) + 10); b.style.left = (cx - bw / 2) + 'px'; b.style.top = (ty + 22) + 'px'; b.style.width = bw + 'px'; b.style.height = '40px'; });
        drag.place([x0, ty, x1, ty]);
        var aTop = ty + 66;
        box(aBox, x, aTop, w, null);
        var rubH2 = rubHeight(w), rubTop2 = L[1] + L[3] - rubH2 - 10;
        box(rub, x, rubTop2, w, null);
        var ansTop2 = aTop + ans.offsetTop;
        g.ansBox = [x, ansTop2, w, rubTop2 - 10 - ansTop2];
      }
      fitText();
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
    // the hand-written answer: the largest size at which the whole answer (all five pieces) fits its lines
    function fitText(){
      if(!G) return;
      var hmax = Math.max(60, G.ansBox[3]), lo = G.wide ? 15 : 14, hi = G.wide ? 21 : 18.5, s = hi, LH = G.wide ? 1.62 : 1.52;
      ans.style.height = 'auto';
      for(; s >= lo; s -= 0.5){ ans.style.fontSize = s + 'px'; ans.style.setProperty('--lh', (s * LH).toFixed(2) + 'px'); if(ans.scrollHeight <= hmax) break; }
      if(s < lo){ s = lo; ans.style.fontSize = s + 'px'; ans.style.setProperty('--lh', (s * LH).toFixed(2) + 'px'); }
      ans.style.height = Math.max(hmax, ans.scrollHeight) + 'px';
      var need = Math.ceil(ans.scrollHeight - hmax);
      if(need > 0){ G.H += need; scene.style.height = G.H + 'px'; G.book[3] += need; G.left[3] = G.right[3] = G.book[3]; G.ansBox[3] += need; rub.style.top = (parseFloat(rub.style.top) + need) + 'px'; }
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
          var y2 = t[1] + (t[3] - t[1]) * j / (LAD.length - 1), x0 = b[0] + b[2] - 12, x1 = W - g.pad;
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
        o.push('<rect class="fcx-band" x="' + r1(b[0] + g.m - 4) + '" y="' + r1(tr[1] - 24) + '" width="' + r1(b[2] - g.m * 2 + 8) + '" height="82" rx="12"/>');
        o.push('<path class="fcx-rail" d="M' + tr[0] + ' ' + tr[1] + 'H' + tr[2] + '"/>');
        LAD.forEach(function(v, j){ var cx = tr[0] + (tr[2] - tr[0]) * j / (LAD.length - 1); o.push('<circle class="fcx-dot is-' + F.ADDS[v] + '" cx="' + r1(cx) + '" cy="' + tr[1] + '" r="7"/>'); });
        // the fold between the question and the answer
        var fy = tr[1] + 62;
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
      var a = g.art, k = Math.min(a[2] / 260, a[3] / 120), ox = a[0] + (a[2] - 260 * k) / 2, oy = a[1] + (a[3] - 120 * k) / 2;
      var fs = r1(12.5 / k);
      grp.setAttribute('transform', 'translate(' + r1(ox) + ' ' + r1(oy) + ') scale(' + k.toFixed(4) + ')');
      grp.innerHTML = ART[ctx.ladder.art] ? ART[ctx.ladder.art](fs) : '';
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
        at: function(){ var t = G.track, f = stop / (LAD.length - 1); return G.wide ? [t[0], t[1] + (t[3] - t[1]) * f + 24] : [t[0] + (t[2] - t[0]) * f + (stop >= 2 ? -24 : 24), t[1]]; } });
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
      '<p>The ladder shows five of the verbs in the order they usually grow. Compare is a step to the side: it needs both sides, not the because, so the because stays on the page in grey. Explain the degree needs the degree and the explanation, not the second side. Define is not on the ladder: it asks for a meaning in your own words, and it is in Test yourself.</p>' +
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
      _G: function(){ return G; }, _cue: function(){ touched = false; makeCue(); return !!(cue && cue.active()); } };
    window.FrqCoachExplore = api;   // for the sweep, frame and perf checks (scripts/tools-v2/hug-frq-coach-*.mjs)
    return api;
  }

  /* The stimulus drawings, one per question (a 260 x 120 box; fs: the label size that renders at 12.5 px). */
  function lbl(x, y, t, fs, anchor, cls){ return '<text class="fcx-al' + (cls ? ' ' + cls : '') + '" x="' + x + '" y="' + y + '" font-size="' + fs + '" text-anchor="' + (anchor || 'middle') + '">' + esc(t) + '</text>'; }
  var ART = {
    polders: function(fs){
      return '<rect class="a-sky" x="0" y="0" width="260" height="120" rx="6"/>' +
        '<path class="a-sea" d="M0 44H96L104 120H0Z"/><path class="a-wave" d="M6 52q6 -4 12 0t12 0t12 0M40 66q6 -4 12 0t12 0t12 0M10 82q6 -4 12 0t12 0t12 0"/>' +
        '<path class="a-dike" d="M88 120L100 34H118L132 120Z"/><path class="a-dike-top" d="M100 34H118"/>' +
        '<path class="a-land" d="M128 74H260V120H128Z"/><path class="a-field" d="M134 74H258V80H134Z"/>' +
        '<path class="a-canal" d="M150 80H250V86H150Z"/>' +
        '<g class="a-mill" transform="translate(218 44)"><path d="M-6 30L-3 0H3L6 30Z" class="a-millb"/><path d="M0 0L-16 -14M0 0L14 -16M0 0L16 14M0 0L-14 16" class="a-sail"/><circle r="2.5" class="a-hub"/></g>' +
        '<path class="a-sealev" d="M0 44H260"/>' +
        lbl(48, 36, 'Sea', fs) + lbl(109, 26, 'Dike', fs) + lbl(176, 106, 'Polder', fs);
    },
    wheat: function(fs){
      var o = '<rect class="a-sky" x="0" y="0" width="260" height="120" rx="6"/><circle class="a-sun" cx="226" cy="22" r="11"/>' +
        '<path class="a-land" d="M0 62H260V120H0Z"/>';
      for(var r = 0; r < 4; r++) for(var c = 0; c < 15; c++){ var x = 8 + c * 11 + (r % 2) * 5, y = 70 + r * 12; o += '<path class="a-stalk" d="M' + x + ' ' + (y + 10) + 'V' + y + '"/><ellipse class="a-ear" cx="' + x + '" cy="' + (y - 3) + '" rx="2.2" ry="5"/>'; }
      o += '<g transform="translate(200 52)"><rect class="a-well" x="-12" y="0" width="24" height="18" rx="2"/><path class="a-pipe" d="M12 10H30V22"/><path class="a-water" d="M30 24q-3 8 0 18M26 26q-6 9 -18 16"/></g>' +
        '<path class="a-chan" d="M204 120L230 76H238L214 120Z"/>';
      return o + lbl(70, 52, 'Punjab, India', fs) + lbl(200, 46, 'Well', fs);
    },
    city: function(fs){
      var o = '<rect class="a-sky" x="0" y="0" width="260" height="120" rx="6"/><path class="a-land" d="M0 82H260V120H0Z"/>';
      [[14, 40], [28, 26], [44, 34], [58, 18], [74, 38]].forEach(function(b){ o += '<rect class="a-tower" x="' + b[0] + '" y="' + b[1] + '" width="13" height="' + (82 - b[1]) + '"/>'; for(var y = b[1] + 5; y < 78; y += 8) o += '<path class="a-win" d="M' + (b[0] + 3) + ' ' + y + 'h7"/>'; });
      o += '<path class="a-road" d="M88 100C130 96 170 92 258 90"/><path class="a-roadln" d="M92 100C134 96 172 92 256 90"/>';
      [[112, 74], [134, 72], [156, 70], [180, 69], [204, 68], [228, 67], [150, 106], [190, 104], [230, 102]].forEach(function(h){ o += '<path class="a-house" d="M' + h[0] + ' ' + (h[1] + 10) + 'V' + (h[1] + 3) + 'L' + (h[0] + 6) + ' ' + (h[1] - 3) + 'L' + (h[0] + 12) + ' ' + (h[1] + 3) + 'V' + (h[1] + 10) + 'Z"/>'; });
      o += '<rect class="a-car" x="166" y="90" width="12" height="5" rx="2"/>';
      return o + lbl(46, 12, 'Downtown', fs) + lbl(196, 52, 'Suburbs', fs) + lbl(130, 116, 'Highway', fs);
    },
    chart: function(fs){
      var o = '<rect class="a-paper" x="0" y="0" width="260" height="120" rx="6"/>';
      for(var x = 30; x <= 250; x += 22) o += '<path class="a-grid" d="M' + x + ' 10V100"/>';
      for(var y = 10; y <= 100; y += 18) o += '<path class="a-grid" d="M30 ' + y + 'H250"/>';
      o += '<path class="a-axis" d="M30 8V100H252"/>' +
        '<path class="a-birth" d="M30 24C80 22 130 25 250 24"/>' +
        '<path class="a-death" d="M30 28C70 30 100 52 140 70S220 86 250 88"/>';
      return o + lbl(58, 16, 'Births', fs, 'start', 'is-birth') + lbl(210, 78, 'Deaths', fs, 'middle', 'is-death') + lbl(140, 114, 'Stage 2', fs);
    },
    ship: function(fs){
      return '<rect class="a-seab" x="0" y="0" width="260" height="120" rx="6"/>' +
        '<path class="a-landm" d="M14 30q10 -12 22 -6t14 18q-4 14 -18 14t-18 -26Z"/>' +
        '<path class="a-landm" d="M190 70q22 -20 46 -6q18 12 8 30q-14 16 -34 10q-22 -6 -20 -34Z"/>' +
        '<path class="a-route" d="M44 52C90 40 150 52 190 76"/>' +
        '<g transform="translate(116 46)"><path class="a-hull" d="M-14 6H14L9 13H-9Z"/><path class="a-mast" d="M0 6V-16"/><path class="a-sailw" d="M1 -15L13 2H1Z"/><path class="a-sailw" d="M-1 -13L-11 2H-1Z"/></g>' +
        lbl(34, 66, 'Britain', fs) + lbl(222, 112, 'Australia', fs) + lbl(130, 24, 'Settlers', fs);
    },
    borders: function(fs){
      return '<rect class="a-seab" x="0" y="0" width="260" height="120" rx="6"/>' +
        '<path class="a-landm" d="M30 14H220Q236 30 232 60Q226 96 190 112H60Q24 92 22 54Q22 26 30 14Z"/>' +
        '<path class="a-grp1" d="M44 30q40 -10 66 10q10 30 -14 46q-34 8 -52 -14q-10 -26 0 -42Z"/>' +
        '<path class="a-grp2" d="M120 46q34 -16 70 0q16 26 0 50q-34 14 -60 0q-20 -22 -10 -50Z"/>' +
        '<path class="a-border" d="M104 14V112M104 62H232"/>' +
        lbl(178, 36, 'Straight border', fs) + lbl(74, 104, 'Group A', fs, 'middle', 'is-g') + lbl(162, 84, 'Group B', fs, 'middle', 'is-g');
    },
    countrya: function(fs){
      return '<rect class="a-seab" x="0" y="0" width="260" height="120" rx="6"/>' +
        '<path class="a-landm" d="M24 20Q80 6 150 12Q226 14 238 46Q242 80 214 100Q160 114 100 108Q40 104 22 78Q12 46 24 20Z"/>' +
        '<path class="a-hills" d="M40 36l12 -12l12 12l12 -14l12 14l12 -12l12 12"/>' +
        '<g class="a-dots"><circle cx="120" cy="62" r="3"/><circle cx="128" cy="58" r="3"/><circle cx="114" cy="56" r="3"/><circle cx="126" cy="68" r="3"/><circle cx="134" cy="64" r="3"/><circle cx="118" cy="70" r="3"/>' +
        '<circle cx="80" cy="100" r="3"/><circle cx="96" cy="102" r="3"/><circle cx="112" cy="100" r="3"/><circle cx="130" cy="102" r="3"/><circle cx="148" cy="100" r="3"/><circle cx="166" cy="98" r="3"/><circle cx="184" cy="94" r="3"/>' +
        '<circle cx="70" cy="34" r="3"/><circle cx="200" cy="60" r="3"/></g>' +
        '<g class="a-trees"><circle cx="196" cy="40" r="5"/><circle cx="208" cy="46" r="5"/><circle cx="214" cy="34" r="5"/><circle cx="222" cy="52" r="5"/></g>' +
        lbl(130, 86, 'Capital Region', fs) + lbl(76, 52, 'Northern Hills', fs) + lbl(130, 118, 'South Coast', fs);
    },
    hdi: function(fs){
      return '<rect class="a-paper" x="0" y="0" width="260" height="120" rx="6"/>' +
        '<g transform="translate(46 52)"><path class="a-heart" d="M0 12C-22 -2 -14 -18 0 -8C14 -18 22 -2 0 12Z"/></g>' +
        '<g transform="translate(130 52)"><path class="a-book" d="M-18 -12H-2Q0 -10 2 -12H18V12H2Q0 14 -2 12H-18Z"/><path class="a-bookln" d="M0 -10V12"/></g>' +
        '<g transform="translate(214 52)"><circle class="a-coin" r="15"/><text class="a-coint" y="5" text-anchor="middle" font-size="15">$</text></g>' +
        '<path class="a-arrowh" d="M46 72L116 94M130 72V92M214 72L144 94"/>' +
        '<rect class="a-score" x="104" y="92" width="52" height="22" rx="11"/>' + lbl(130, 108, 'HDI', fs, 'middle', 'is-score') +
        lbl(46, 28, 'Health', fs) + lbl(130, 28, 'Education', fs) + lbl(214, 28, 'Income', fs);
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
