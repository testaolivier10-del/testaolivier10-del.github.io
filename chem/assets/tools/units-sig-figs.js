/* Units and significant figures, tools v2 (docs/tools-v2-units-sig-figs-brief.md; the standard:
   docs/tools-v2-standard.md). The first AP® Chemistry tool on the shared kit (assets/course/tool-kit2.js), through
   the course adapter ApChemTools.studioKit2 (chem-tools.js). Explore's data is chem/data/tools/units-sig-figs.json
   "explore"; the models are ApChemMath.units.chain and .read (chem-tool-math.js), recomputed by the validator.

   TWO IDEAS, so two tabs (rule 11):
   1 Units cancel. A flask of water on a lab bench, its amount (250. mL) written on the board, and four
     conversion factors as cards on the bench. Tap a card: it flies onto the board at the end of the chain;
     a unit on the bottom that matches a unit on top earlier in the chain is struck through (with its partner),
     and the flask's tag and the result card show what is left, in that unit. Tap a card on the board to flip
     it (a flipped card cancels nothing and the result's unit shows it); its × takes it off. The water never
     changes: only its number and unit do. Cause line: "mL cancels → g cancels → 13.9 mol".
   2 Significant figures. A graduated cylinder on the bench with a magnifier on its meniscus. Drag the water:
     the reading shows the digits read from the marks (blue) and one estimated digit (vermillion). Tap the beaker
     standing beside it to read the same water with marks every 10 mL instead of every 1 mL: one digit fewer is
     real. Cause line: "marks every 1 mL → 33 from the marks → 7 estimated → 3 significant figures".

   Two modes (the rule for every tool): EXPLORE is free play (nothing locked, graded or asked; no side panel).
   TEST YOURSELF, one dropdown: the graded problems as before (Any habit, or one habit; value, unit and
   significant figures graded by ApChemQuestions; recorded as "units-sig-figs:<context>:<kind>"; ?seed= and
   #quiz open them), and "Set it up", the old Explore (place each given on top or bottom until the units cancel
   to the goal; mass by difference lined up on the decimal point), not graded, as before.
   Every change of state is animated (a card flies, units are struck through, a card turns over, the water
   pours from one vessel to the other); words wait for the picture. Reduced motion: a short cross fade. */
(function(){
  'use strict';
  var SLUG = 'units-sig-figs';
  var T = window.ApChemTools;
  if(!T) return;
  var KIND = { muldiv: 'Multiplying and dividing', addsub: 'Adding and subtracting', gas: 'Gas law: kelvin and R', rchoice: 'Which R?', calorimetry: 'Calorimetry: J, kJ and sign', pH: 'pH: decimal places' };
  var SETUP = ['gas', 'calorimetry', 'muldiv', 'addsub'];
  var UNITS = ['mL', 'L', 'g', 'mol', 'molecules'];
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function ease(t){ return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function f1(x){ return (+x).toFixed(1); }
  function supU(u){ return String(u).replace(/\^(\d)/g, function(m, d){ return '⁰¹²³⁴⁵⁶⁷⁸⁹'.charAt(+d); }); }
  function uKey(u){ return UNITS.indexOf(u) > -1 ? u : 'x'; }

  function boot(){
    var K = window.LevlKit2, M = window.ApChemMath;
    T.mount(SLUG, function(app, data, ctx){
      var esc = T.esc, U = M.units, EX = data.explore, CV = EX.convert, RD = EX.read;
      var FAC = CV.factors.map(function(f){ return { id: f.id, top: f.top, bot: f.bot, sf: f.sf, name: f.name, why: f.why }; });
      function facById(id){ return FAC.filter(function(f){ return f.id === id; })[0]; }
      function instById(id){ return RD.instruments.filter(function(x){ return x.id === id; })[0]; }
      var S = { tab: 'units', mode: 'explore', part: null, chain: [], v: RD.value, inst: RD.instruments[0].id };
      var phone = false, G = null;

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'us3';
      var tabs = K.tabs({ label: 'Which idea', big: true, value: S.tab, items: [{ value: 'units', label: 'Units cancel', short: 'Units' }, { value: 'read', label: 'Significant figures', short: 'Sig figs' }],
        onChange: function(v){ setTab(v); } });
      stage.appendChild(tabs.el);
      var head = K.head({ purpose: '', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'us3-scene'; sceneBox.id = T.nid('us3');
      sceneBox.innerHTML = '<svg class="us3-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"></svg>';
      stage.appendChild(sceneBox);
      tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
      var svg = sceneBox.querySelector('svg'), layer = K.layer(sceneBox);
      var cards = document.createElement('div'); cards.className = 'us3-cards'; layer.el.appendChild(cards);
      var lines = document.createElement('div'); lines.className = 'us3-lines';
      var cause = K.cause({ label: 'Why' });
      var clearB = document.createElement('button'); clearB.type = 'button'; clearB.className = 'tk2-btn us3-clear'; clearB.textContent = 'Clear the board';
      clearB.addEventListener('click', function(){ hideCue(true); clearChain(); });
      lines.appendChild(cause.el); lines.appendChild(clearB);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

      /* ================================================== TAB 1: units cancel */
      // One card element per factor (it flies between the bench and the board), the start card and the result card.
      function cardHtml(f, flip){
        var t = flip ? f.bot : f.top, b = flip ? f.top : f.bot;
        var half = function(x, k){ return '<span class="us3-h us3-' + k + '"><span class="us3-v">' + esc(valText(x[0])) + '</span><span class="us3-u is-' + uKey(x[1]) + '" data-u="' + esc(x[1]) + '">' + esc(x[1]) + '</span></span>'; };
        return half(t, 'top') + '<span class="us3-bar" aria-hidden="true"></span>' + half(b, 'bot');
      }
      function valText(v){ return /e/.test(v) ? (+v / Math.pow(10, Math.floor(Math.log10(+v)))).toPrecision(4) + ' × 10' + String(Math.floor(Math.log10(+v))).replace(/\d/g, function(d){ return '⁰¹²³⁴⁵⁶⁷⁸⁹'.charAt(+d); }) : v; }
      function factorWords(f, flip){ var t = flip ? f.bot : f.top, b = flip ? f.top : f.bot; return valText(t[0]) + ' ' + t[1] + ' over ' + valText(b[0]) + ' ' + b[1]; }
      var CEL = {};
      FAC.forEach(function(f){
        var w = document.createElement('div'); w.className = 'us3-card is-tray'; w.setAttribute('data-f', f.id);
        w.innerHTML = '<button type="button" class="us3-face"></button><button type="button" class="us3-x" hidden><span aria-hidden="true">×</span></button><span class="us3-op" aria-hidden="true">×</span>';
        cards.appendChild(w);
        w.querySelector('.us3-face').addEventListener('click', function(){ hideCue(true); var i = inChain(f.id); if(i < 0) addCard(f.id); else flipCard(i); });
        w.querySelector('.us3-x').addEventListener('click', function(){ hideCue(true); var i = inChain(f.id); if(i > -1) removeCard(i); });
        CEL[f.id] = w;
      });
      var startEl = document.createElement('div'); startEl.className = 'us3-card is-start';
      startEl.innerHTML = '<span class="us3-h us3-top"><span class="us3-v">' + esc(CV.start.v) + '</span><span class="us3-u is-' + uKey(CV.start.u) + '" data-u="' + esc(CV.start.u) + '">' + esc(CV.start.u) + '</span></span><span class="us3-name">' + esc(CV.start.what) + '</span>';
      cards.appendChild(startEl);
      var resEl = document.createElement('div'); resEl.className = 'us3-card is-res'; resEl.hidden = true;
      resEl.innerHTML = '<span class="us3-op" aria-hidden="true">=</span><span class="us3-h us3-top"><span class="us3-v"></span><span class="us3-u"></span></span><span class="us3-name">' + esc(CV.start.what) + '</span>';
      cards.appendChild(resEl);
      var tagEl = document.createElement('div'); tagEl.className = 'us3-tag'; tagEl.setAttribute('aria-hidden', 'true');
      tagEl.innerHTML = '<span class="us3-tag-v"></span><span class="us3-tag-u"></span>';
      cards.appendChild(tagEl);
      function inChain(id){ for(var i = 0; i < S.chain.length; i++) if(S.chain[i].id === id) return i; return -1; }
      function chainNow(list){ return U.chain(CV.start, (list || S.chain).map(function(c){ var f = facById(c.id); return { top: f.top, bot: f.bot, sf: f.sf, flip: c.flip }; })); }
      var shownRes = chainNow([]), busyT = 0, seq = 0;
      /* A change: the cards move at once (CSS moves them, 0.36 s); when they have landed the units that now cancel
         are struck through (0.26 s each, one after the other), and only then do the tag, the result card and the
         cause line say what is left. A change during a change starts from where things are. */
      function changed(kind){
        var my = ++seq, r = chainNow(), red = K.reduced();
        layoutCards(red);
        clearTimeout(busyT);
        if(red){ crossFade(); strikes(r, true); settle(r); return; }
        stage.classList.add('is-moving');
        busyT = setTimeout(function(){
          if(my !== seq) return;
          var n = strikes(r, false);
          busyT = setTimeout(function(){ if(my !== seq) return; stage.classList.remove('is-moving'); settle(r); }, n ? 140 + n * 200 : 60);
        }, kind === 'flip' ? 330 : 380);
      }
      function crossFade(){ cards.classList.remove('is-fade'); void cards.offsetWidth; cards.classList.add('is-fade'); }
      /* Strike through every unit in a cancelled pair; returns how many are new (they animate one by one). */
      function strikes(r, instant){
        var want = {};
        r.pairs.forEach(function(p, k){ [p.a, p.b].forEach(function(x){ want[x.card + ':' + x.half] = k; }); });
        var els = [{ el: startEl, card: 0 }].concat(S.chain.map(function(c, i){ return { el: CEL[c.id], card: i + 1, flip: c.flip }; })), fresh = 0;
        els.forEach(function(x){
          ['top', 'bot'].forEach(function(h){
            var u = x.el.querySelector('.us3-' + h + ' .us3-u'); if(!u) return;
            var k = want[x.card + ':' + h];
            if(k != null && !u.classList.contains('is-x')){ u.style.transitionDelay = instant ? '0ms' : (Math.floor(fresh / 1) * 200) + 'ms'; u.classList.add('is-x'); fresh++; }
            else if(k == null && u.classList.contains('is-x')){ u.style.transitionDelay = '0ms'; u.classList.remove('is-x'); }
          });
        });
        return fresh;
      }
      function settle(r){
        shownRes = r;
        resEl.hidden = !S.chain.length;
        var resU = resEl.querySelector('.us3-u');
        resEl.querySelector('.us3-v').textContent = U.sigText(r.value, r.sf);
        resU.textContent = supU(r.unit); resU.className = 'us3-u is-' + uKey(r.unit);
        tagEl.querySelector('.us3-tag-v').textContent = U.sigText(r.value, r.sf);
        var tu = tagEl.querySelector('.us3-tag-u'); tu.textContent = supU(r.unit); tu.className = 'us3-tag-u is-' + uKey(r.unit);
        tagEl.classList.remove('is-new'); void tagEl.offsetWidth; if(S.chain.length || tagEl.getAttribute('data-was') !== r.text) tagEl.classList.add('is-new');
        tagEl.setAttribute('data-was', r.text);
        clearB.hidden = !S.chain.length;
        words();
        say(cause.text());
        refHtml();
        layoutCards(true);
      }
      function addCard(id){ if(inChain(id) > -1 || S.chain.length >= FAC.length) return; S.chain.push({ id: id, flip: false }); tourDid('add'); changed('add'); }
      function removeCard(i){ var id = S.chain[i].id; S.chain.splice(i, 1); paintCard(id); var f = CEL[id].querySelector('.us3-face'); try{ f.focus({ preventScroll: true }); }catch(e){} changed('remove'); }
      function flipCard(i){
        var c = S.chain[i], w = CEL[c.id];
        c.flip = !c.flip; tourDid('flip');
        if(K.reduced()){ paintCard(c.id); changed('flip'); return; }
        // the card turns over: it narrows to an edge, the halves swap, it opens again
        w.classList.remove('is-turn'); void w.offsetWidth; w.classList.add('is-turn');
        [].forEach.call(w.querySelectorAll('.us3-u'), function(u){ u.style.transitionDelay = '0ms'; u.classList.remove('is-x'); });
        setTimeout(function(){ paintCard(c.id); }, 160);
        setTimeout(function(){ w.classList.remove('is-turn'); }, 340);
        changed('flip');
      }
      function clearChain(){ var ids = S.chain.map(function(c){ return c.id; }); S.chain = []; ids.forEach(paintCard); changed('clear'); }
      function paintCard(id){
        var f = facById(id), i = inChain(id), c = i > -1 ? S.chain[i] : null, w = CEL[id], face = w.querySelector('.us3-face'), x = w.querySelector('.us3-x');
        var flip = !!(c && c.flip), key = (c ? 'b' : 't') + (flip ? 'f' : '');
        if(w.getAttribute('data-k') !== key){ face.innerHTML = cardHtml(f, flip); w.setAttribute('data-k', key); }
        w.classList.toggle('is-tray', !c); w.classList.toggle('is-board', !!c); w.classList.toggle('is-flip', flip);
        face.setAttribute('aria-label', c ? factorWords(f, flip) + ', on the board. Press to turn it over.' : f.name + ': ' + factorWords(f, false) + '. Press to put it on the board.');
        x.hidden = !c; x.setAttribute('aria-label', 'Take ' + factorWords(f, flip) + ' off the board');
      }
      FAC.forEach(function(f){ paintCard(f.id); });
      function words(){
        var r = shownRes, parts = [];
        if(!S.chain.length){ cause.set([{ t: CV.start.v + ' ' + CV.start.u + ' of ' + CV.start.what, role: 'u-' + uKey(CV.start.u) }], 'Start:'); return; }
        if(!r.pairs.length) parts.push({ t: 'nothing cancels', role: 'ink', say: 'no unit cancels' });
        r.pairs.forEach(function(p){ parts.push({ t: p.u + ' cancels', role: 'u-' + uKey(p.u), say: p.u + ' on top and on the bottom cancels' }); });
        parts.push({ t: U.sigText(r.value, r.sf) + (r.unit ? ' ' + supU(r.unit) : ''), role: UNITS.indexOf(r.unit) > -1 ? 'u-' + r.unit : 'mix', say: 'left: ' + r.text.replace(/\^2/g, ' squared') });
        cause.set(parts);
      }
      /* ---- tab 1 geometry: the board on the wall, the bench, the flask, the tray */
      function geoUnits(W, H){
        var g = { W: W, H: H }, narrow = W < 700;
        g.cw = narrow ? (W < 380 ? 90 : 98) : clamp(Math.round(W * 0.085), 104, 132);
        g.ch = narrow ? 104 : 116; g.op = narrow ? 16 : 22; g.gap = 12;
        if(narrow){
          g.bx0 = 10; g.bx1 = W - 10; g.by0 = 10;
          var inner = g.bx1 - g.bx0 - 20;
          g.per = Math.max(2, Math.floor((inner + g.op) / (g.cw + g.op)));
          g.rows = Math.ceil((FAC.length + 2) / g.per);
          g.by1 = g.by0 + 30 + g.rows * g.ch + (g.rows - 1) * g.gap;
          g.bench = g.by1 + 26;
          var tcols = 2, tw = tcols * g.cw + (tcols - 1) * 10;
          g.trayX = W - 12 - tw; g.trayY = g.bench + 22; g.tcols = tcols;
          g.need = g.trayY + 2 * g.ch + 10 + 18;
          g.fx = Math.max(54, (g.trayX - 6) / 2 + 2); g.fh = Math.min(200, g.need - g.bench - 14); g.fy = g.need - 26;
        } else {
          g.bench = Math.round(H * 0.66);
          g.fh = Math.min(H * 0.62, 330); g.fx = clamp(W * 0.115, 96, 190); g.fy = H - Math.max(26, H * 0.07);
          g.bx0 = Math.round(g.fx + g.fh * 0.36 + 34); g.bx1 = W - 18; g.by0 = 16;
          var inner2 = g.bx1 - g.bx0 - 32;
          g.per = Math.max(3, Math.floor((inner2 + g.op) / (g.cw + g.op)));
          g.rows = Math.ceil((FAC.length + 2) / g.per);
          g.by1 = Math.min(g.bench - 14, g.by0 + 40 + g.rows * g.ch + (g.rows - 1) * g.gap + 20);
          g.trayY = g.bench + Math.max(14, (H - g.bench - g.ch) / 2 - 4); g.tcols = FAC.length;
          var tw2 = FAC.length * g.cw + (FAC.length - 1) * 18;
          g.trayX = g.bx0 + Math.max(0, (g.bx1 - g.bx0 - tw2) / 2);
          g.need = Math.max(g.trayY + g.ch + 14, 0);
        }
        return g;
      }
      function trayPos(i){
        var g = G, c = i % g.tcols, r = Math.floor(i / g.tcols), gx = phone ? 10 : 18;
        return [g.trayX + c * (g.cw + gx), g.trayY + r * (g.ch + 10)];
      }
      function slotPos(k){   // k: 0 start, 1..n the factors, n + 1 the result
        var g = G, row = Math.floor(k / g.per), col = k % g.per, inRow = Math.min(g.per, S.chain.length + 2 - row * g.per);
        var rowW = inRow * g.cw + (inRow - 1) * g.op, x0 = g.bx0 + Math.max(14, (g.bx1 - g.bx0 - rowW) / 2);
        var top = g.by0 + 22 + ((g.by1 - g.by0 - 22) - (g.rows * g.ch + (g.rows - 1) * g.gap)) / 2;
        return [x0 + col * (g.cw + g.op), top + row * (g.ch + g.gap)];
      }
      function put(el, p, instant){
        if(instant) el.classList.add('is-still');
        el.style.left = Math.round(p[0]) + 'px'; el.style.top = Math.round(p[1]) + 'px'; el.style.width = G.cw + 'px'; el.style.height = G.ch + 'px';
        if(instant){ void el.offsetWidth; el.classList.remove('is-still'); }
      }
      function layoutCards(instant){
        if(!G || S.tab !== 'units') return;
        put(startEl, slotPos(0), instant);
        FAC.forEach(function(f, i){
          var k = inChain(f.id), el = CEL[f.id];
          el.classList.toggle('is-wrap', k > -1 && (k + 1) % G.per === 0);
          put(el, k > -1 ? slotPos(k + 1) : trayPos(i), instant);
        });
        put(resEl, slotPos(S.chain.length + 1), instant);
        resEl.classList.toggle('is-wrap', (S.chain.length + 1) % G.per === 0);
        var t = G.tag; tagEl.style.left = Math.round(t[0]) + 'px'; tagEl.style.top = Math.round(t[1]) + 'px';
      }
      function drawUnits(){
        var g = G, W = g.W, H = g.H, fx = g.fx, fh = g.fh, fy = g.fy;
        var p = [];
        p.push('<defs><linearGradient id="us3g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="us3s-wall0"/><stop offset="1" class="us3s-wall1"/></linearGradient>' +
          '<linearGradient id="us3g-bench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="us3s-bn0"/><stop offset="1" class="us3s-bn1"/></linearGradient>' +
          '<linearGradient id="us3g-board" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="us3s-bd0"/><stop offset="1" class="us3s-bd1"/></linearGradient>' +
          '<linearGradient id="us3g-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="us3s-w0"/><stop offset="1" class="us3s-w1"/></linearGradient>' +
          '<linearGradient id="us3g-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="us3s-gl0"/><stop offset=".5" class="us3s-gl1"/><stop offset="1" class="us3s-gl0"/></linearGradient></defs>');
        p.push('<rect class="us3-wall" x="0" y="0" width="' + W + '" height="' + g.bench + '"/>');
        // a few wall tiles, faint
        for(var ty = 40; ty < g.bench; ty += 56) p.push('<path class="us3-grout" d="M0 ' + ty + 'H' + W + '"/>');
        p.push('<rect class="us3-bench" x="0" y="' + g.bench + '" width="' + W + '" height="' + (H - g.bench) + '"/><path class="us3-benchedge" d="M0 ' + (g.bench + 0.5) + 'H' + W + '"/>');
        // the whiteboard
        var bx0 = g.bx0, bx1 = g.bx1, by0 = g.by0, by1 = g.by1;
        p.push('<rect class="us3-boardshadow" x="' + (bx0 + 3) + '" y="' + (by0 + 5) + '" width="' + (bx1 - bx0) + '" height="' + (by1 - by0) + '" rx="10"/>');
        p.push('<rect class="us3-board" x="' + bx0 + '" y="' + by0 + '" width="' + (bx1 - bx0) + '" height="' + (by1 - by0) + '" rx="10"/>');
        p.push('<rect class="us3-boardin" x="' + (bx0 + 7) + '" y="' + (by0 + 7) + '" width="' + (bx1 - bx0 - 14) + '" height="' + (by1 - by0 - 14) + '" rx="5"/>');
        p.push('<path class="us3-boardshine" d="M' + (bx0 + 24) + ' ' + (by0 + 18) + 'L' + (bx0 + 70) + ' ' + (by0 + 18) + '"/>');
        p.push('<rect class="us3-ledge" x="' + (bx0 + 30) + '" y="' + (by1 - 2) + '" width="' + (bx1 - bx0 - 60) + '" height="7" rx="3"/>');
        // a marker on the ledge
        p.push('<rect class="us3-marker" x="' + (bx1 - 110) + '" y="' + (by1 - 6) + '" width="44" height="7" rx="3"/><rect class="us3-markercap" x="' + (bx1 - 70) + '" y="' + (by1 - 6) + '" width="12" height="7" rx="2"/>');
        // the flask (an Erlenmeyer flask of water) on the bench
        var nw = fh * 0.16, bw = fh * 0.66, top = fy - fh, neckB = fy - fh * 0.58, lvl = fy - fh * 0.40;
        var flask = 'M' + (fx - nw / 2) + ' ' + top + 'V' + neckB + 'L' + (fx - bw / 2) + ' ' + (fy - 10) + 'Q' + (fx - bw / 2) + ' ' + fy + ' ' + (fx - bw / 2 + 12) + ' ' + fy + 'H' + (fx + bw / 2 - 12) + 'Q' + (fx + bw / 2) + ' ' + fy + ' ' + (fx + bw / 2) + ' ' + (fy - 10) + 'L' + (fx + nw / 2) + ' ' + neckB + 'V' + top + 'Z';
        var wl = (lvl - neckB) / (fy - 10 - neckB), wx = nw / 2 + (bw / 2 - nw / 2) * wl;
        var water = 'M' + (fx - wx) + ' ' + lvl + 'L' + (fx - bw / 2 + 1.5) + ' ' + (fy - 10) + 'Q' + (fx - bw / 2 + 1.5) + ' ' + (fy - 1.5) + ' ' + (fx - bw / 2 + 12) + ' ' + (fy - 1.5) + 'H' + (fx + bw / 2 - 12) + 'Q' + (fx + bw / 2 - 1.5) + ' ' + (fy - 1.5) + ' ' + (fx + bw / 2 - 1.5) + ' ' + (fy - 10) + 'L' + (fx + wx) + ' ' + lvl + 'Z';
        p.push('<ellipse class="us3-shadow" cx="' + fx + '" cy="' + (fy + 2) + '" rx="' + (bw * 0.55) + '" ry="5"/>');
        p.push('<path class="us3-water" d="' + water + '"/><path class="us3-surf" d="M' + (fx - wx + 2) + ' ' + lvl + 'Q' + fx + ' ' + (lvl + 4) + ' ' + (fx + wx - 2) + ' ' + lvl + '"/>');
        p.push('<path class="us3-glass" d="' + flask + '"/>');
        p.push('<path class="us3-rim" d="M' + (fx - nw / 2 - 4) + ' ' + top + 'H' + (fx + nw / 2 + 4) + '"/>');
        p.push('<path class="us3-shine" d="M' + (fx - nw / 2 + 4) + ' ' + (top + 10) + 'V' + (neckB - 4) + 'M' + (fx - bw / 2 + bw * 0.16) + ' ' + (fy - 16) + 'L' + (fx - nw / 2 - 4) + ' ' + (neckB + fh * 0.12) + '"/>');
        // the tag's string, from the neck
        var tg = [fx + nw / 2 + 6, neckB - fh * 0.10];
        g.tag = phone ? [fx - 44, Math.max(g.bench + 8, top - 4) ] : [fx - 52, Math.max(g.by0, top - 64)];
        if(!phone){ g.tag = [Math.max(8, fx - 58), Math.max(10, top - 70)]; }
        var tx = g.tag[0] + 58, ty2 = g.tag[1] + 50;
        p.push('<path class="us3-string" d="M' + tg[0] + ' ' + tg[1] + 'Q' + (tg[0] + 14) + ' ' + (tg[1] - 20) + ' ' + tx + ' ' + ty2 + '"/>');
        svg.innerHTML = p.join('');
      }

      /* ================================================== TAB 2: significant figures */
      var instNow = function(){ return instById(S.inst); };
      var other = function(){ return RD.instruments.filter(function(x){ return x.id !== S.inst; })[0]; };
      var swap = null;   // { from, to, t0 } while the water is poured into the other vessel
      var cLevel = K.drag(layer, { key: 'apchem-us-water', label: 'Water in the ' + instNow().name.toLowerCase(), min: RD.min, max: RD.max, step: RD.step, value: S.v, track: [0, 0, 0, 1], chip: false,
        valuetext: function(v){ var r = U.read(v, instNow()); return 'Reads ' + r.shown + ' milliliters, ' + r.sf + ' significant figure' + (r.sf === 1 ? '' : 's'); },
        tag: function(){ return ''; },
        onInput: function(v){ hideCue(true); S.v = v; prevInst = null; tourDid('drag'); drawRead(); readWords(); },
        onEnd: function(){ say(cause.text()); refHtml(); } });
      var cSwap = K.tap(layer, { key: 'apchem-us-swap', label: 'Pour the water into the ' + other().name.toLowerCase(), box: [0, 0, 10, 10], chip: false, onClick: function(){ hideCue(true); pour(); } });
      var prevInst = null;
      function pour(){
        if(swap) return;
        var from = S.inst, to = other().id;
        prevInst = { id: from, r: U.read(S.v, instById(from)) };
        S.inst = to; tourDid('swap');
        cLevel.input.setAttribute('aria-label', 'Water in the ' + instNow().name.toLowerCase());
        cSwap.el.setAttribute('aria-label', 'Pour the water into the ' + other().name.toLowerCase());
        if(K.reduced()){ swap = null; layoutRead(); crossSvg(); readWords(); say(cause.text()); refHtml(); return; }
        swap = { from: from, to: to, t0: now() };
        stage.classList.add('is-moving'); cLevel.hide(true); cSwap.el.hidden = true;
        readWords();
        (function step(){
          if(!swap) return;
          var f = Math.min(1, (now() - swap.t0) / 900);
          drawRead(f);
          if(f < 1) requestAnimationFrame(step);
          else { swap = null; stage.classList.remove('is-moving'); layoutRead(); readWords(); say(cause.text()); refHtml(); }
        })();
      }
      function crossSvg(){ var old = svg.innerHTML; layoutRead(); var g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'us3-fade'); g.innerHTML = old; svg.appendChild(g);
        if(g.animate){ var an = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240 }); an.onfinish = function(){ g.remove(); }; } else g.remove(); }
      function geoRead(W, H){
        var g = { W: W, H: H }, narrow = W < 700;
        g.bench = Math.round(H * (narrow ? 0.86 : 0.84));
        g.floor = g.bench + (narrow ? 10 : 14);
        if(narrow){
          g.mx = W * 0.25; g.top = 26; g.lx = W * 0.71; g.ly = H * 0.29; g.R = Math.min(W * 0.25, H * 0.21);
          g.rx = W * 0.71; g.ry = H * 0.62; g.digits = Math.min(46, W * 0.12); g.sx = W * 0.9; g.ss = 0.3;
        } else {
          g.mx = clamp(W * 0.25, 170, 360); g.top = 26; g.lx = W * 0.56; g.ly = H * 0.40; g.R = Math.min(H * 0.30, W * 0.135, 170);
          g.rx = W * 0.83; g.ry = H * 0.38; g.digits = clamp(W * 0.05, 48, 72); g.sx = W * 0.075; g.ss = 0.34;
          if(g.mx - 120 < g.sx + 70){ g.sx = Math.max(56, g.mx - 200); }
        }
        return g;
      }
      /* The two vessels, drawn in their own units: the origin at the middle of the foot, up is negative. */
      var VES = {
        cylinder: { h: 400, w: 64, base: 16, y0: 26, y50: 362, marks: function(v){ return v % 10 === 0 ? 26 : v % 5 === 0 ? 17 : 10; }, mx: -27, labelEvery: 10 },
        beaker: { h: 250, w: 210, base: 0, y0: 8, y50: 196, marks: function(){ return 44; }, mx: -78, labelEvery: 10 }
      };
      function vScale(id){ var g = G, V = VES[id], room = g.floor - g.top - 6; return id === 'cylinder' ? room / V.h : Math.min(room / V.h * 0.82, (phone ? g.W * 0.44 : 260) / V.w); }
      function yOf(id, v, sc){ var V = VES[id]; return G.floor - (V.y0 + (V.y50 - V.y0) * v / 50) * sc; }
      function vesselSvg(id, cx, sc, level, detail, alpha){
        var V = VES[id], inst = instById(id), y = function(u){ return G.floor - u * sc; }, x = function(u){ return cx + u * sc; }, p = [];
        var hw = V.w / 2, wall = 4;
        p.push('<g class="us3-ves is-' + id + (detail ? ' is-main' : ' is-side') + '"' + (alpha < 1 ? ' opacity="' + alpha.toFixed(3) + '"' : '') + '>');
        p.push('<ellipse class="us3-shadow" cx="' + cx + '" cy="' + (G.floor + 2) + '" rx="' + ((id === 'cylinder' ? 70 : hw + 10) * sc) + '" ry="' + Math.max(2, 6 * sc) + '"/>');
        if(id === 'cylinder') p.push('<path class="us3-foot" d="M' + x(-60) + ' ' + y(0) + 'L' + x(-48) + ' ' + y(16) + 'H' + x(48) + 'L' + x(60) + ' ' + y(0) + 'Z"/><path class="us3-foottop" d="M' + x(-48) + ' ' + y(16) + 'H' + x(48) + '"/>');
        var bot = V.base, inL = x(-hw + wall), inR = x(hw - wall);
        if(level > 0.01){
          var ly = yOf(id, level, sc), m = Math.min(6, (hw - wall) * 0.18) * sc + 1.2;
          p.push('<path class="us3-liq" d="M' + inL + ' ' + (ly - m) + 'Q' + cx + ' ' + (ly + m) + ' ' + inR + ' ' + (ly - m) + 'V' + y(bot + wall + 2) + (id === 'beaker' ? 'Q' + inR + ' ' + y(bot + wall) + ' ' + (inR - 6 * sc) + ' ' + y(bot + wall) + 'H' + (inL + 6 * sc) + 'Q' + inL + ' ' + y(bot + wall) + ' ' + inL + ' ' + y(bot + wall + 2) : 'H' + inL) + 'Z"/>');
          p.push('<path class="us3-menis" d="M' + inL + ' ' + (ly - m) + 'Q' + cx + ' ' + (ly + m) + ' ' + inR + ' ' + (ly - m) + '"/>');
          if(detail) G.menY = ly;
        } else if(detail) G.menY = yOf(id, 0, sc);
        // the glass
        var gl = id === 'cylinder'
          ? 'M' + x(-hw) + ' ' + y(bot) + 'V' + y(V.h - 8) + 'Q' + x(-hw - 6) + ' ' + y(V.h - 2) + ' ' + x(-hw - 10) + ' ' + y(V.h) + 'H' + x(hw + 4) + 'Q' + x(hw + 1) + ' ' + y(V.h - 4) + ' ' + x(hw) + ' ' + y(V.h - 10) + 'V' + y(bot) + 'Z'
          : 'M' + x(-hw) + ' ' + y(V.h - 6) + 'Q' + x(-hw - 14) + ' ' + y(V.h + 2) + ' ' + x(-hw - 18) + ' ' + y(V.h) + 'L' + x(-hw - 8) + ' ' + y(V.h - 4) + 'L' + x(-hw) + ' ' + y(V.h - 18) + 'V' + y(10) + 'Q' + x(-hw) + ' ' + y(0) + ' ' + x(-hw + 10) + ' ' + y(0) + 'H' + x(hw - 10) + 'Q' + x(hw) + ' ' + y(0) + ' ' + x(hw) + ' ' + y(10) + 'V' + y(V.h - 6) + 'Z';
        p.push('<path class="us3-glassv" d="' + gl + '"/>');
        p.push('<path class="us3-shine" d="M' + x(hw - 10) + ' ' + y(V.h - 30) + 'V' + y(id === 'cylinder' ? 60 : 40) + '"/>');
        // the marks: every inst.every mL, numbered every 10 (and "mL" by the 50)
        if(sc > 0.2){
          var lab = [];
          for(var v = (id === 'cylinder' ? 1 : 10); v <= 50; v += inst.every){
            var my = yOf(id, v, sc), L = V.marks(v);
            p.push('<path class="us3-mark' + (v % 10 === 0 ? ' is-major' : '') + '" d="M' + x(V.mx) + ' ' + my.toFixed(1) + 'H' + x(V.mx + L).toFixed(1) + '"/>');
            if(detail && v % V.labelEvery === 0) lab.push('<text class="us3-num" x="' + (x(V.mx + L) + 4).toFixed(1) + '" y="' + (my + 4.5).toFixed(1) + '">' + v + (v === 50 ? ' mL' : '') + '</text>');
          }
          p.push(lab.join(''));
        }
        p.push('</g>');
        return p.join('');
      }
      var READ = null;
      function layoutRead(){
        if(!G || S.tab !== 'read') return;
        var id = S.inst, sc = vScale(id), g = G;
        cLevel.place([g.mx + (VES[id].w / 2 + 30) * sc, yOf(id, RD.min, sc), g.mx + (VES[id].w / 2 + 30) * sc, yOf(id, RD.max, sc)]);
        var oid = other().id, os = vScale(oid) * g.ss, ow = (oid === 'cylinder' ? 120 : VES[oid].w + 36) * os, oh = VES[oid].h * os;
        cSwap.place([g.sx - ow / 2 - 8, g.floor - oh - 8, ow + 16, oh + 14]);
        drawRead();
      }
      function drawRead(f){
        var g = G, id = S.inst, inst = instNow(), p = [], W = g.W, H = g.H;
        var sw = swap && f != null ? ease(f) : null;
        p.push('<defs><linearGradient id="us3g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="us3s-wall0"/><stop offset="1" class="us3s-wall1"/></linearGradient>' +
          '<linearGradient id="us3g-bench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="us3s-bn0"/><stop offset="1" class="us3s-bn1"/></linearGradient>' +
          '<linearGradient id="us3g-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="us3s-w0"/><stop offset="1" class="us3s-w1"/></linearGradient>' +
          '<radialGradient id="us3g-lens" cx=".4" cy=".35" r=".75"><stop offset="0" class="us3s-ln0"/><stop offset="1" class="us3s-ln1"/></radialGradient>' +
          '<clipPath id="us3c-lens"><circle cx="' + g.lx + '" cy="' + g.ly + '" r="' + (g.R - 7) + '"/></clipPath></defs>');
        p.push('<rect class="us3-wall" x="0" y="0" width="' + W + '" height="' + g.bench + '"/>');
        for(var ty = 40; ty < g.bench; ty += 56) p.push('<path class="us3-grout" d="M0 ' + ty + 'H' + W + '"/>');
        p.push('<rect class="us3-bench" x="0" y="' + g.bench + '" width="' + W + '" height="' + (H - g.bench) + '"/><path class="us3-benchedge" d="M0 ' + (g.bench + 0.5) + 'H' + W + '"/>');
        // the vessels: the one being read stands in the middle, the other beside it; a pour moves them past each other
        var oid = RD.instruments.filter(function(x){ return x.id !== id; })[0].id;
        if(sw == null){
          p.push(vesselSvg(oid, g.sx, vScale(oid) * g.ss, 0, false, 1));
          p.push(vesselSvg(id, g.mx, vScale(id), S.v, true, 1));
        } else {
          var from = swap.from, to = swap.to;
          var sF = vScale(from) * (1 + (g.ss - 1) * sw), sT = vScale(to) * (g.ss + (1 - g.ss) * sw);
          var xF = g.mx + (g.sx - g.mx) * sw, xT = g.sx + (g.mx - g.sx) * sw;
          var drain = clamp((f - 0.05) / 0.6, 0, 1), fill = clamp((f - 0.25) / 0.7, 0, 1);
          p.push(vesselSvg(from, xF, sF, S.v * (1 - ease(drain)), false, 1));
          p.push(vesselSvg(to, xT, sT, S.v * ease(fill), true, 1));
        }
        // the name of the vessel being read, on the bench under it
        var nm = inst.name, ny = Math.min(H - 8, g.floor + (phone ? 22 : 26));
        if(sw == null){
          p.push('<text class="us3-vname" x="' + g.mx + '" y="' + ny + '" text-anchor="middle">' + esc(nm) + '</text>');
          p.push('<text class="us3-oname" x="' + g.sx + '" y="' + ny + '" text-anchor="middle">' + esc(other().name) + '</text>');
        }
        // the magnifier on the meniscus
        var settled = sw == null, sc = vScale(id), mk = settled ? g.mx + VES[id].mx * sc + 10 * sc : null, my = settled ? g.menY : null;
        var r = U.read(S.v, inst), lensOn = settled;
        if(lensOn){
          var R = g.R, lx = g.lx, ly = g.ly, d = Math.hypot(lx - mk, ly - my), ux = (mk - lx) / d, uy = (my - ly) / d, nx = -uy, ny2 = ux, spot = Math.max(10, 16 * sc);
          p.push('<path class="us3-cone" d="M' + (lx + nx * R) + ' ' + (ly + ny2 * R) + 'L' + (mk + nx * spot) + ' ' + (my + ny2 * spot) + 'L' + (mk - nx * spot) + ' ' + (my - ny2 * spot) + 'L' + (lx - nx * R) + ' ' + (ly - ny2 * R) + 'Z"/>');
          p.push('<circle class="us3-spot" cx="' + mk + '" cy="' + my + '" r="' + spot + '"/>');
          // what the lens shows: the scale around the level, magnified
          var span = inst.every * 4, pxPer = (R * 1.72) / span, yv = function(v){ return ly - (v - S.v) * pxPer; }, x0 = lx - R * 0.98;
          p.push('<g clip-path="url(#us3c-lens)"><rect class="us3-lensbg" x="' + (lx - R) + '" y="' + (ly - R) + '" width="' + (2 * R) + '" height="' + (2 * R) + '"/>');
          var m2 = R * 0.16;
          p.push('<path class="us3-liq" d="M' + (lx - R) + ' ' + (ly - m2) + 'Q' + (lx + R * 0.15) + ' ' + (ly + m2 * 1.02) + ' ' + (lx + R * 1.3) + ' ' + (ly - m2) + 'V' + (ly + R) + 'H' + (lx - R) + 'Z"/>');
          p.push('<path class="us3-menis is-big" d="M' + (lx - R) + ' ' + (ly - m2) + 'Q' + (lx + R * 0.15) + ' ' + (ly + m2 * 1.02) + ' ' + (lx + R * 1.3) + ' ' + (ly - m2) + '"/>');
          // the stretch between the two marks the water sits between, in the "from the marks" colour
          p.push('<rect class="us3-band" x="' + x0 + '" y="' + yv(r.high) + '" width="' + (R * 0.2) + '" height="' + (yv(r.low) - yv(r.high)) + '"/>');
          var lo = Math.floor((S.v - span / 2) / inst.every) * inst.every, step2 = inst.every === 1 ? 1 : inst.every;
          for(var mv = lo; mv <= S.v + span / 2 + inst.every; mv += step2){
            if(mv < 0 || mv > 50) continue;
            var yy = yv(mv), big = mv % 10 === 0 || inst.every >= 10, L = big ? R * 0.42 : mv % 5 === 0 ? R * 0.32 : R * 0.24;
            p.push('<path class="us3-lmark' + (big ? ' is-major' : '') + '" d="M' + x0 + ' ' + yy.toFixed(1) + 'H' + (x0 + L).toFixed(1) + '"/>');
            p.push('<text class="us3-lnum" x="' + (x0 + L + 6).toFixed(1) + '" y="' + (yy + 6).toFixed(1) + '">' + mv + '</text>');
          }
          // the reading line from the bottom of the meniscus to the scale
          p.push('<path class="us3-readline" d="M' + (x0 + R * 0.2) + ' ' + ly + 'H' + (lx + R * 0.12) + '"/><circle class="us3-readdot" cx="' + (lx + R * 0.15) + '" cy="' + ly + '" r="4.5"/>');
          p.push('</g>');
          // the lens: a thick rim and a handle
          var ha = Math.PI * 0.30, hx = lx + Math.cos(ha) * R, hy = ly + Math.sin(ha) * R, hl = R * (phone ? 0.42 : 0.55);
          p.push('<path class="us3-handle" d="M' + hx + ' ' + hy + 'L' + (hx + Math.cos(ha) * hl) + ' ' + (hy + Math.sin(ha) * hl) + '"/>');
          p.push('<circle class="us3-lensglass" cx="' + lx + '" cy="' + ly + '" r="' + (R - 7) + '"/><circle class="us3-rim2" cx="' + lx + '" cy="' + ly + '" r="' + (R - 3.5) + '"/>');
          p.push('<path class="us3-lensshine" d="M' + (lx - R * 0.62) + ' ' + (ly - R * 0.42) + 'A' + (R * 0.78) + ' ' + (R * 0.78) + ' 0 0 1 ' + (lx - R * 0.18) + ' ' + (ly - R * 0.74) + '"/>');
          // the reading: digits from the marks, the estimated digit, the unit
          p.push(readingSvg(r));
        }
        svg.innerHTML = p.join('');
        G.lensBox = lensOn ? [g.lx - g.R, g.ly - g.R, 2 * g.R, 2 * g.R] : null;
        if(!swap){ cLevel.hide(S.mode !== 'explore' || S.tab !== 'read'); cSwap.el.hidden = S.mode !== 'explore' || S.tab !== 'read'; }
        if(cue.active()) cue.place();
      }
      function readingSvg(r){
        var g = G, fs = g.digits, cw = fs * 0.6, p = [], ds = r.digits.filter(function(d){ return d.k !== 'z'; });
        var wNum = ds.reduce(function(a, d){ return a + (d.k === 'p' ? cw * 0.45 : cw); }, 0), uw = fs * 0.95, total = wNum + 10 + uw;
        var x = g.rx - total / 2, y = g.ry, xs = [];
        p.push('<g class="us3-reading">');
        ds.forEach(function(d){ var w = d.k === 'p' ? cw * 0.45 : cw; xs.push({ d: d, x: x, w: w }); p.push('<text class="us3-dig is-' + d.k + '" x="' + (x + w / 2) + '" y="' + y + '" text-anchor="middle" style="font-size:' + fs.toFixed(1) + 'px">' + d.ch + '</text>'); x += w; });
        p.push('<text class="us3-dunit" x="' + (x + 10) + '" y="' + y + '" style="font-size:' + (fs * 0.55).toFixed(1) + 'px">mL</text>');
        // brackets under the digits, with 1 to 3 word names
        var cs = xs.filter(function(q){ return q.d.k === 'c'; }), es = xs.filter(function(q){ return q.d.k === 'e'; })[0], by = y + fs * 0.24, ty = by + 22;
        var small = phone ? 12.5 : 14;
        if(cs.length){
          var c0 = cs[0].x + 3, c1 = cs[cs.length - 1].x + cs[cs.length - 1].w - 3;
          p.push('<path class="us3-brk is-c" d="M' + c0 + ' ' + (by - 5) + 'V' + by + 'H' + c1 + 'V' + (by - 5) + '"/>');
          p.push('<text class="us3-brkt is-c" x="' + ((c0 + c1) / 2) + '" y="' + ty + '" text-anchor="' + (es ? 'end' : 'middle') + '" dx="' + (es ? (c1 - c0) / 2 : 0) + '" style="font-size:' + small + 'px">from the marks</text>');
        }
        if(es){
          var e0 = es.x + 3, e1 = es.x + es.w - 3;
          p.push('<path class="us3-brk is-e" d="M' + e0 + ' ' + (by - 5) + 'V' + by + 'H' + e1 + 'V' + (by - 5) + '"/>');
          p.push('<text class="us3-brkt is-e" x="' + (cs.length ? e0 + 2 : (e0 + e1) / 2) + '" y="' + (ty + (cs.length ? 18 : 0)) + '" text-anchor="' + (cs.length ? 'start' : 'middle') + '" style="font-size:' + small + 'px">estimated</text>');
        }
        var py = ty + (cs.length ? 46 : 30), pw = (phone ? 8.2 : 9.2) * (String(r.sf).length + (r.sf === 1 ? 20 : 21)), ph = phone ? 28 : 32;
        p.push('<g class="us3-count"><rect x="' + (g.rx - pw / 2) + '" y="' + (py - ph / 2) + '" width="' + pw + '" height="' + ph + '" rx="' + (ph / 2) + '"/><text x="' + g.rx + '" y="' + (py + 5) + '" text-anchor="middle" style="font-size:' + (phone ? 14 : 15.5) + 'px">' + r.sf + ' significant figure' + (r.sf === 1 ? '' : 's') + '</text></g>');
        if(prevInst && prevInst.id !== S.inst) p.push('<text class="us3-was" x="' + g.rx + '" y="' + (py + ph / 2 + 22) + '" text-anchor="middle">' + esc(instById(prevInst.id).name) + ' read ' + esc(prevInst.r.shown) + ' mL</text>');
        p.push('</g>');
        return p.join('');
      }
      function readWords(){
        if(swap){ cause.set([{ t: 'pouring into the ' + instNow().name.toLowerCase(), role: 'ink' }]); return; }
        var inst = instNow(), r = U.read(S.v, inst), parts = [{ t: 'marks every ' + inst.every + ' mL', role: 'c', say: 'the marks are every ' + inst.every + ' mL' }];
        parts.push(r.certain ? { t: r.certain + ' from the marks', role: 'c' } : { t: 'no digit from the marks', role: 'c' });
        parts.push({ t: r.est + ' estimated', role: 'e', say: 'the ' + r.est + ' is estimated' });
        parts.push({ t: r.sf + ' significant figure' + (r.sf === 1 ? '' : 's'), role: 'n' });
        cause.set(parts);
        svg.setAttribute('aria-label', inst.name + ' with water. It reads ' + r.shown + ' mL: ' + (r.certain ? r.certain + ' read from the marks and ' : '') + r.est + ' estimated, ' + r.sf + ' significant figure' + (r.sf === 1 ? '' : 's') + '.');
      }

      /* ---------------------------------------------------- tabs, layout, cue, tour */
      var PURPOSE = { units: 'See how conversion factors cancel units, one by one.', read: 'See how an instrument’s marks decide the real digits.' };
      function setTab(v){
        S.tab = v; tour.stop(); swap = null; stage.classList.remove('is-moving');
        stage.setAttribute('data-tab', v);
        head.purpose(PURPOSE[v]);
        cards.hidden = v !== 'units'; clearB.hidden = v !== 'units' || !S.chain.length;
        cLevel.hide(v !== 'read'); cSwap.el.hidden = v !== 'read';
        hideCue(false);
        layoutNow();
        if(v === 'units'){ words(); svg.setAttribute('aria-label', 'A flask of water on a lab bench and a whiteboard with the conversion: ' + shownRes.text.replace(/\^2/g, ' squared') + '.'); }
        else readWords();
        refHtml();
        setTimeout(function(){ if(S.mode === 'explore' && !tour.active()) cue.show(); }, 30);
      }
      function layoutNow(){
        if(stage.hidden) return;
        var r = sceneBox.getBoundingClientRect(), W = Math.max(280, Math.round(r.width));
        phone = W < 700;
        if(phone){
          var need = S.tab === 'units' ? geoUnits(W, 600).need : Math.round(Math.min(560, Math.max(430, W * 1.18)));
          sceneBox.style.height = Math.round(need) + 'px';
        } else sceneBox.style.height = '';
        r = sceneBox.getBoundingClientRect();
        var H = Math.max(300, Math.round(r.height));
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
        sceneBox.classList.toggle('is-narrow', phone);
        if(S.tab === 'units'){ G = geoUnits(W, H); drawUnits(); layoutCards(true); }
        else { G = geoRead(W, H); layoutRead(); }
        if(cue.active()) cue.place();
      }
      var cue;
      // the cue's words follow the tab (one cue per tab and device)
      var cueKey = { units: 'apchem-units-sig-figs', read: 'apchem-units-sig-figs-read' }, cueText = { units: 'Tap a card', read: 'Drag the water' }, cueSide = { units: 'above', read: 'right' };
      var cues = {};
      ['units', 'read'].forEach(function(k){ cues[k] = K.cue(layer, { key: cueKey[k], text: cueText[k], side: cueSide[k], at: function(){
        if(!G) return [0, 0];
        if(k === 'units'){ var p = trayPos(0); return [p[0] + G.cw / 2, p[1] + 2]; }
        var sc = vScale(S.inst); return [G.mx + (VES[S.inst].w / 2 + 30) * sc, yOf(S.inst, S.v, sc)];
      } }); });
      cue = { show: function(){ return cues[S.tab].show(); }, hide: function(u){ cues[S.tab].hide(u); }, place: function(){ cues[S.tab].place(); }, active: function(){ return cues[S.tab].active(); } };
      function hideCue(used){ ['units', 'read'].forEach(function(k){ if(cues[k].active()) cues[k].hide(used && k === S.tab); }); }
      stage.addEventListener('pointerdown', function(e){ if(sceneBox.contains(e.target)) hideCue(true); }, true);
      stage.addEventListener('keydown', function(e){ if(sceneBox.contains(e.target) && /^(Arrow|Page|Home|End|Enter| )/.test(e.key)) hideCue(true); }, true);
      var tour = K.tour({ key: 'apchem-units-sig-figs', label: 'Show me how', steps: [
        { id: 'add', text: 'Tap a card on the bench. It goes on the board, and units that match cancel.', target: function(){ return S.tab === 'units' ? CEL[FAC[0].id].querySelector('.us3-face') : cLevel.el.querySelector('.tk2-knob'); } },
        { id: 'flip', text: 'Tap a card on the board to turn it over. Now nothing cancels.', target: function(){ var c = S.chain[0]; return c ? CEL[c.id].querySelector('.us3-face') : resEl.hidden ? sceneBox : resEl; } },
        { id: 'read', text: 'The tag on the flask and the line below say what is left.', target: function(){ return tagEl; } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      var tourR = K.tour({ key: 'apchem-units-sig-figs-read', label: 'Show me how', steps: [
        { id: 'drag', text: 'Drag the water. The magnifier shows the marks it sits between.', target: function(){ return cLevel.el.querySelector('.tk2-knob'); } },
        { id: 'look', text: 'Digits read from the marks, then one estimated digit. That is all that is real.', target: function(){ var b = G && G.lensBox; if(!b) return sceneBox; var r0 = svg.getBoundingClientRect(); return { left: r0.left + b[0], top: r0.top + b[1], right: r0.left + b[0] + b[2], bottom: r0.top + b[1] + b[3], width: b[2], height: b[3] }; } },
        { id: 'swap', text: 'Tap the other vessel to pour the water in. Coarser marks, fewer real digits.', target: function(){ return cSwap.el; } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      var tour1 = tour;
      tour = { start: function(f){ return (S.tab === 'units' ? tour1 : tourR).start(f); }, stop: function(){ tour1.stop(); tourR.stop(); }, active: function(){ return tour1.active() || tourR.active(); },
        did: function(id){ if(tour1.active()) tour1.did(id); if(tourR.active()) tourR.did(id); } };
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tour.start(true); }

      /* ---------------------------------------------------- "?": the reference for the tab shown */
      var ref = document.createElement('div'); ref.className = 'ls-sec us3-ref';
      function refHtml(){
        var how = '<p class="us3-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>';
        var notes = '<p class="bt-small">Notes: <a href="../notes/math-units.html">Units and conversions</a> · <a href="../notes/math-sig-figs.html">Significant figures</a></p>';
        var rules = '<h3 class="ls-title-l">' + esc(data.howItWorksTitle || 'The rules Test yourself checks') + '</h3>' + T.wrapTables(data.howItWorks);
        if(S.tab === 'units'){
          var r = shownRes, used = S.chain.map(function(c){ return facById(c.id); });
          var meas = [{ n: CV.start.v + ' ' + CV.start.u + ' (measured)', sf: CV.start.sf }].concat(used.filter(function(f){ return f.sf != null; }).map(function(f){ return { n: f.name, sf: f.sf }; }));
          ref.innerHTML = how + '<h3 class="ls-title-l">Why a unit cancels</h3><p>A conversion factor is a fraction worth exactly 1: 1 L and 1000 mL are the same amount, so (1 L / 1000 mL) = 1. Multiplying by it changes the number and the unit, never the amount of water. A unit on top and the same unit on the bottom divide out, just as 5 ÷ 5 = 1. Put the unit you have on the bottom of the next factor and it cancels; turned over, the same factor cancels nothing.</p>' +
            '<h3 class="ls-title-l">This board</h3><p class="bt-eq">' + esc(CV.start.v + ' ' + CV.start.u) + S.chain.map(function(c){ var f = facById(c.id); return ' × (' + esc(factorWords(f, c.flip).replace(' over ', ' / ')) + ')'; }).join('') + ' = ' + esc(r.text.replace(/\^2/g, '²')) + '</p>' +
            '<p class="bt-small">Significant figures: the fewest among the measured numbers (' + meas.map(function(m){ return esc(m.n) + ': ' + m.sf; }).join('; ') + '), so ' + r.sf + '. A defined equality (1 L = 1000 mL) and a count are exact and never limit the answer.</p>' +
            '<h3 class="ls-title-l">Where each factor comes from</h3><ul class="us3-list">' + FAC.map(function(f){ return '<li><b>' + esc(f.name) + '</b> (' + esc(factorWords(f, false).replace(' over ', ' / ')) + '): ' + esc(f.why) + '.</li>'; }).join('') + '</ul>' + rules + notes;
        } else {
          var inst = instNow(), rr = U.read(S.v, inst);
          ref.innerHTML = how + '<h3 class="ls-title-l">How to read a scale</h3><ol class="us3-list"><li>Look at the bottom of the curved surface (the meniscus), with your eye level with it.</li><li>Write every digit the marks give you for certain.</li><li>Estimate one more digit, in tenths of the space between two marks. Stop there: it is the last significant figure.</li></ol>' +
            '<h3 class="ls-title-l">This reading</h3><p>The ' + esc(inst.name.toLowerCase()) + ' has marks every ' + inst.every + ' mL. The water sits between ' + rr.low + ' and ' + rr.high + ' mL, so it reads <b>' + esc(rr.shown) + ' mL</b>: ' + (rr.certain ? esc(rr.certain) + ' from the marks and ' : 'no digit from the marks, and ') + esc(rr.est) + ' estimated, ' + rr.sf + ' significant figure' + (rr.sf === 1 ? '' : 's') + '.' + (/\.$/.test(rr.shown) ? ' The decimal point after the 0 says that the zero was read (estimated), so it counts.' : '') + '</p>' +
            '<p>The same water in the graduated cylinder (marks every 1 mL) reads one more digit than in the beaker (marks every 10 mL). Finer marks, more real digits; a digit past the estimated one would be a guess.</p>' +
            '<h3 class="ls-title-l">Counting significant figures</h3><ul class="us3-list"><li>Nonzero digits always count; so do zeros between them (4005: 4).</li><li>Leading zeros never count (0.0045: 2).</li><li>Trailing zeros count after a decimal point (4.50: 3); with no point they are unclear (2500), so write 2.50 × 10³ or 2500.</li><li>Exact numbers (a count, 1 L = 1000 mL) have no uncertainty and never limit an answer.</li></ul>' + rules + notes;
        }
      }
      ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(ctx.studio) ctx.studio.close(); if(S.mode !== 'explore' && ctx.studio && ctx.studio.kit2) ctx.studio.kit2.go('explore'); setTimeout(startTour, 60); });

      /* ================================================== TEST YOURSELF */
      /* ---- the graded problems (the old quiz, unchanged in content, grading and records) */
      var kinds = data.contexts.map(function(c){ return c.kind; }).filter(function(k, i, a){ return a.indexOf(k) === i; });
      var qStage = document.createElement('div'); qStage.className = 'us3-qstage ls-drill-stage us-ls-q';
      var qDock = document.createElement('div'); qDock.className = 'us3-qdock';
      var gid = T.nid('us');
      qDock.innerHTML = '<div class="bt-problem cd-problem ls-drill" aria-labelledby="' + gid + '-h"></div><div class="us3-code"></div>';
      var area = qDock.querySelector('.bt-problem'), codeBox = qDock.querySelector('.us3-code');
      var qOnly = '', qSeed = 0, qMade = false;
      function freshSeed(){ return 10000 + Math.floor(Math.random() * 89999); }
      try{ var sm = /[?&#]seed=(\d+)/.exec(location.search + location.hash); qSeed = sm ? +sm[1] : freshSeed(); }catch(e){ qSeed = freshSeed(); }
      function drawProblem(focus, renew){
        if(renew) qSeed = freshSeed();
        qMade = true;
        var r = M.rng(qSeed), pool = data.contexts.filter(function(c){ return !qOnly || c.kind === qOnly; }), c = r.pick(pool.length ? pool : data.contexts);
        var item = U.generate(r, Object.assign({ slug: SLUG }, c)).item;
        area.innerHTML = '<div class="bt-prob-head"><h2 id="' + gid + '-h" class="sr-only" tabindex="-1">' + esc(KIND[c.kind]) + '</h2></div><div class="us-q"></div><div class="bt-next"></div>';
        codeBox.innerHTML = '<p class="bt-code">Problem code <b>' + qSeed + '</b> <a href="?seed=' + qSeed + '">Link to this problem</a></p>';
        T.questions(area.querySelector('.us-q'), [item], {}, SLUG);
        qStage.innerHTML = '';
        var stem = area.querySelector('.chem-q-stem'); if(stem){ stem.classList.add('ls-drill-text'); qStage.appendChild(stem); }
        var st = ctx.studio;
        if(st){ st.done(false, 'quiz'); st.pills([{ html: esc(KIND[c.kind]), tone: 'ghost' }], 'left', 'quiz'); }
        area.querySelector('.us-q').addEventListener('chem:answered', function(e){
          var res = e.detail || {}, nx = area.querySelector('.bt-next');
          nx.innerHTML = '<div class="bt-actions"><button type="button" class="btn-press sm us-again">New problem</button></div>';
          var again = nx.querySelector('.us-again');
          again.addEventListener('click', function(){ drawProblem(true, true); });
          T.keepGoing(nx, { topic: item.topic });
          if(!st) return;
          var fb = area.querySelector('.chem-q-feedback'), v = fb && fb.querySelector('.chem-verdict'), word = v ? v.textContent : res.correct ? 'Correct.' : 'Not quite.';
          st.pills([{ html: esc(word.replace(/\.$/, '')), tone: res.correct ? 'good' : res.score > 0 ? 'warn' : 'bad' }], 'left', 'quiz');
          var keep = nx.querySelector('.bt-keep'), les = keep && keep.querySelector('a[href*="lessons/"]');
          again.classList.add('ls-btn', 'ls-pri');
          st.done({ kicker: res.correct ? 'Solved' : 'Finished', title: esc(word), text: res.correct ? 'Value, unit and significant figures all right.' : 'What went wrong, and the answer, are in the feedback.',
            next: { label: 'New problem', onClick: function(){ again.click(); } },
            links: [{ label: 'Review your answer', onClick: function(){ st.done(false, 'quiz'); } }]
              .concat(les ? [{ label: 'Read the lesson: ' + les.textContent.replace(/^\s*Lesson\s*/, '').trim(), href: les.getAttribute('href') }] : []) }, 'quiz');
        });
        if(focus){ var h = area.querySelector('h2'); if(h) try{ h.focus({ preventScroll: true }); }catch(e){} }
      }

      /* ---- Set it up (the old Explore: place each given so the units cancel to the goal; not graded) */
      var setupCtx = data.contexts.filter(function(c){ return SETUP.indexOf(c.kind) > -1; }).sort(function(a, b){ return SETUP.indexOf(a.kind) - SETUP.indexOf(b.kind); });
      var sStage = document.createElement('div'); sStage.className = 'us3-sstage us-ls-stage';
      sStage.innerHTML = '<p class="us-stem"></p><div class="us-build"></div>';
      var sDock = document.createElement('div'); sDock.className = 'us3-sdock';
      sDock.innerHTML = '<div class="us3-salt"></div><div class="bt-actions"><button type="button" class="bt-btn ls-btn us-new">New numbers</button></div>';
      var sp = { ci: 0, seed: 1 + Math.floor(Math.random() * 9999), p: null, place: [], order: [] };
      sDock.querySelector('.us-new').addEventListener('click', function(){ sp.seed++; setupFresh(); });
      function $s(sel){ return sStage.querySelector(sel) || sDock.querySelector(sel); }
      function setupFresh(){
        var c = setupCtx[sp.ci]; if(!c) return;
        var p = sp.p = U.generate(M.rng(sp.seed), Object.assign({ slug: SLUG }, c));
        $s('.us-stem').innerHTML = p.item.q;
        if(p.setup.addsub) return setupAddsub();
        sp.place = p.setup.factors.map(function(){ return 0; });
        // tiles in a fixed shuffled order, so position gives nothing away
        sp.order = p.setup.factors.map(function(f, i){ return i; }); var r = M.rng(sp.seed + 3);
        for(var i = sp.order.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)), t = sp.order[i]; sp.order[i] = sp.order[j]; sp.order[j] = t; }
        $s('.us-build').innerHTML = '<div class="us-sticky"><div class="us-frac"></div><div class="us-live" role="status" aria-live="polite"></div></div>';
        sDock.querySelector('.us3-salt').innerHTML = '<h3 class="ls-h">Place each quantity by name</h3><div class="us-tiles">' + sp.order.map(function(i){
          var f = p.setup.factors[i], nm = 'usx-' + sp.seed + '-' + i;
          return '<fieldset class="us-tile" data-i="' + i + '"><legend><b>' + esc(f.v) + '</b> <span class="us-u">' + esc(f.u) + '</span><span class="bt-small"> ' + esc(f.label) + (f.note ? ' (' + esc(f.note) + ')' : '') + '</span></legend>' +
            '<div class="us-seg">' + [[1, '× top'], [-1, '÷ bottom'], [0, 'leave out']].map(function(o){
              return '<input type="radio" name="' + nm + '" id="' + nm + o[0] + '" value="' + o[0] + '"' + (o[0] === 0 ? ' checked' : '') + '><label for="' + nm + o[0] + '">' + o[1] + '</label>';
            }).join('') + '</div></fieldset>';
        }).join('') + '</div>';
        sDock.querySelectorAll('.us-tile input').forEach(function(inp){ inp.addEventListener('change', function(){ sp.place[+inp.closest('.us-tile').getAttribute('data-i')] = +inp.value; setupDraw(); }); });
        $s('.us-frac').addEventListener('click', function(e){
          var b = e.target.closest('[data-q]'); if(!b) return;
          var i = +b.getAttribute('data-q'), nx = sp.place[i] === 0 ? 1 : sp.place[i] === 1 ? -1 : 0;
          sp.place[i] = nx;
          sDock.querySelectorAll('.us-tile[data-i="' + i + '"] input').forEach(function(inp){ inp.checked = +inp.value === nx; });
          setupDraw();
          var bb = $s('.us-frac [data-q="' + i + '"]'); if(bb) bb.focus({ preventScroll: true });
        });
        setupDraw();
      }
      function tokens(u, sign){
        var m = M.unitParse(u), out = [];
        Object.keys(m).forEach(function(k){ var e = m[k] * sign; for(var n = 0; n < Math.abs(e); n++) out.push({ u: k, top: e > 0 }); });
        return out;
      }
      function setupDraw(){
        var p = sp.p, SP = p.setup, used = [], place = sp.place, order = sp.order;
        SP.factors.forEach(function(f, i){ if(place[i]) used.push({ f: f, p: place[i], i: i }); });
        var top = [], bot = [];
        used.forEach(function(x){ tokens(x.f.u, x.p).forEach(function(t){ (t.top ? top : bot).push({ u: t.u, i: x.i, cancel: false }); }); });
        var pair = 0;
        top.forEach(function(a){ var b = bot.filter(function(c){ return !c.cancel && c.u === a.u; })[0]; if(b){ a.cancel = b.cancel = true; a.pair = b.pair = (pair++ % 4) + 1; } });
        var chip = function(c){ return '<span class="us-chip' + (c.cancel ? ' is-cancel us-p' + c.pair : '') + '">' + esc(c.u) + '</span>'; };
        var left = M.unitText(M.unitMul(used.map(function(x){ return { u: x.f.u, p: x.p }; })));
        var val = used.reduce(function(v, x){ var n = x.f.u === 'kJ/J' ? 1 / 1000 : +x.f.v; return x.p > 0 ? v * n : v / n; }, 1);
        var bad = used.filter(function(x){ return !x.f.place || x.f.place !== x.p; });
        var meas = used.filter(function(x){ return x.f.sf; }), sf = meas.length ? Math.min.apply(null, meas.map(function(x){ return x.f.sf; })) : 0;
        var WHERE = { '1': 'on top', '-1': 'on the bottom', '0': 'left out' }, NEXT = { '0': 'top', '1': 'bottom', '-1': 'out' };
        var qb = function(i){ var f = SP.factors[i]; return '<button type="button" class="us-qty us-qty' + (place[i] > 0 ? 't' : place[i] < 0 ? 'b' : 'o') + '" data-q="' + i + '" aria-label="' + esc(f.v + ' ' + f.u + ', ' + f.label + ', ' + WHERE[String(place[i])] + '. Tap to move it ' + NEXT[String(place[i])]) + '"><b>' + esc(f.v) + '</b> <span>' + esc(f.u) + '</span></button>'; };
        var topQ = order.filter(function(i){ return place[i] > 0; }), botQ = order.filter(function(i){ return place[i] < 0; }), trayQ = order.filter(function(i){ return !place[i]; });
        var slot = function(list, word){ return list.length ? list.map(qb).join('<span class="us-times" aria-hidden="true">×</span>') : '<span class="us-slot">' + word + '</span>'; };
        var ok = used.length && left === SP.target && !bad.length;
        var goal = '<div class="us-goal"><span class="us-eq" aria-hidden="true">=</span><span class="us-chip us-target' + (ok ? ' is-done' : '') + '">' + esc(SP.target) + '</span></div>';
        $s('.us-frac').innerHTML = '<div class="us-eqn"><div class="us-fr"><div class="us-num"><span class="us-vals">' + slot(topQ, '× top') + '</span>' +
          (top.length ? '<span class="us-chips">' + top.map(chip).join('') + '</span>' : '') + '</div>' +
          '<div class="us-bar"></div><div class="us-den"><span class="us-vals">' + slot(botQ, '÷ bottom') + '</span>' + (bot.length ? '<span class="us-chips">' + bot.map(chip).join('') + '</span>' : '') + '</div></div>' + goal + '</div>' +
          (trayQ.length ? '<div class="us-tray"><span class="us-tray-k">' + (used.length ? 'Not used' : 'Given') + '</span>' + trayQ.map(qb).join('') + '</div>' : '');
        var html;
        if(!used.length) html = '<p class="tx-where"><b>Goal: ' + esc(SP.target) + '.</b> Tap each quantity to put it on top, then on the bottom, then out again.</p>';
        else if(ok){
          var shown = (SP.sign ? -1 : 1) * val;
          html = '<p class="tx-where us-ok"><b>Units cancel to ' + esc(SP.target) + '. ✓</b> The setup gives ' + esc(String(+val.toPrecision(6))) + ' on a calculator.' +
            ' Significant figures: ' + meas.map(function(x){ return esc(x.f.label) + ' ' + x.f.sf; }).join(', ') + (used.some(function(x){ return !x.f.sf; }) ? ' (1000 J per kJ is exact, so it does not count)' : '') + ', so ' + sf + '. Report <b>' + esc(M.fmt(shown, sf)) + ' ' + esc(SP.target) + '</b>.' +
            (SP.sign ? ' The water warmed, so dissolving released heat: ΔH is negative.' : '') + '</p>';
        } else {
          var msg = bad.length ? bad.map(function(x){ var f = x.f; return f.why ? esc(f.why) : esc(f.label) + ' goes ' + (f.place > 0 ? 'on top' : 'on the bottom') + '.'; })[0] : '';
          var miss = SP.factors.filter(function(f, i){ return f.place && !place[i]; });
          html = '<p class="tx-where"><b>Left over: ' + (left ? esc(left) : 'no units') + '.</b> ' + (left === SP.target ? 'The units work, but ' + msg : msg ? msg : miss.length ? 'Not ' + esc(SP.target) + ' yet: something is missing. ' : 'These units do not give ' + esc(SP.target) + '. ') + ' Goal: ' + esc(SP.target) + '.</p>';
        }
        $s('.us-live').innerHTML = html;
        if(ctx.studio && S.part && /^setup/.test(S.part)) ctx.studio.pills(ok ? [{ html: 'Units cancel', tone: 'good' }] : [{ k: 'Goal', html: esc(SP.target), tone: 'ghost' }], 'left', 'quiz');
      }
      function setupAddsub(){
        var p = sp.p, a = p.setup.addsub, pl = p.setup.places, dp = Math.min(pl[0], pl[1]), w = Math.max(pl[0], pl[1]);
        var row = function(s, lab){ var d = s.split('.'), dec = (d[1] || ''), pad = w - dec.length;
          return '<div class="us-row"><span class="us-lab">' + lab + '</span><span class="us-int">' + d[0] + '</span><span class="us-dot">.</span><span class="us-dec">' + dec.split('').map(function(ch, k){ return '<span class="' + (k < dp ? 'us-k' : 'us-x') + '">' + ch + '</span>'; }).join('') + '<span class="us-pad">' + '0'.repeat(pad).replace(/0/g, '?') + '</span></span></div>'; };
        var res = p.setup.result.split('.');
        $s('.us-build').innerHTML = '<div class="us-col" role="img" aria-label="' + esc(a[0] + ' grams minus ' + a[1] + ' grams; ' + a[0] + ' has ' + pl[0] + ' decimal places and ' + a[1] + ' has ' + pl[1] + ', so the difference keeps ' + dp + ': ' + p.setup.result + ' grams') + '">' + row(a[0], 'beaker + sample') + row(a[1], '− empty beaker') +
          '<div class="us-row us-sum"><span class="us-lab">= sample</span><span class="us-int">' + res[0] + '</span><span class="us-dot">' + (res[1] ? '.' : '') + '</span><span class="us-dec">' + (res[1] || '') + '</span></div></div><div class="us-live" role="status" aria-live="polite"></div>';
        sDock.querySelector('.us3-salt').innerHTML = '<p class="bt-small us-how">Line the numbers up on the decimal point. A place one of them does not report is unknown (?), so the answer stops at the last place both share.</p>';
        $s('.us-live').innerHTML = '<p class="tx-where us-ok"><b>' + p.setup.result + ' g, to ' + dp + ' decimal place' + (dp === 1 ? '' : 's') + '.</b> Adding and subtracting keeps the fewest decimal places (' + pl[0] + ' and ' + pl[1] + '), not the fewest significant figures; the answer has ' + U.sigFigsOf(p.setup.result) + ' significant figures.</p>';
        if(ctx.studio) ctx.studio.pills([{ k: 'Goal', html: 'g', tone: 'ghost' }], 'left', 'quiz');
      }

      /* ---- the parts of Test yourself, and the two modes (the adapter calls shown) */
      var parts = [{ value: 'quiz', label: 'Any habit', group: 'Problems, graded', stage: qStage, dock: qDock, task: { kicker: 'Test yourself', title: 'Give the value with its units and the right significant figures.' } }];
      kinds.forEach(function(k){ parts.push({ value: 'quiz-' + k, label: KIND[k], group: 'Problems, graded', stage: qStage, dock: qDock, task: { kicker: 'Test yourself', title: 'Give the value with its units and the right significant figures.' } }); });
      setupCtx.forEach(function(c, i){ parts.push({ value: 'setup-' + c.kind, label: KIND[c.kind], group: 'Set it up (not graded)', stage: sStage, dock: sDock,
        task: function(){ return c.kind === 'addsub' ? { kicker: 'Set it up', title: 'Adding and subtracting keeps the fewest decimal places.', todo: 'New numbers for another one.' } : { kicker: 'Set it up', title: 'Put each quantity on top or on the bottom so the units cancel to the goal.', todo: 'Tap a quantity on the stage, or place it by name below.' }; } }); });
      function shown(mode, part){
        S.mode = mode; S.part = part;
        tour.stop(); swap = null; stage.classList.remove('is-moving');
        var ex = mode === 'explore';
        stage.setAttribute('data-view', ex ? 'explore' : 'quiz');
        codeBox.classList.toggle('ls-drill-det', !ex && /^quiz/.test(part || ''));
        if(ex){ setTimeout(function(){ layoutNow(); if(!tour.active()) cue.show(); }, 30); refHtml(); return; }
        hideCue(false);
        if(/^quiz/.test(part)){
          var k = part === 'quiz' ? '' : part.slice(5);
          if(!qMade || k !== qOnly){ qOnly = k; drawProblem(false, qMade); }
        } else if(/^setup-/.test(part)){
          var ci = setupCtx.map(function(c){ return 'setup-' + c.kind; }).indexOf(part);
          if(ctx.studio) ctx.studio.done(false, 'quiz');
          if(ci > -1 && (ci !== sp.ci || !sp.p)){ sp.ci = ci; setupFresh(); } else if(sp.p){ if(sp.p.setup.addsub) setupAddsub(); else setupDraw(); }
        }
      }
      function kindOfShown(){ var h = area.querySelector('h2'), t = h ? h.textContent : ''; for(var k in KIND) if(KIND[k] === t) return k; return kinds[0]; }
      ctx.kit2 = { stage: stage, ref: ref, parts: parts, onShow: shown,
        about: [(function(){ var d = document.createElement('div'); d.className = 'bt-intro'; d.innerHTML = data.intro; return d; })()],
        start: function(){ try{ if(/[?&#]seed=\d+/.test(location.search + location.hash) || /^#quiz\b/.test(location.hash)) return { mode: 'quiz', part: 'quiz' }; var m = /^#(setup-[a-z]+)\b/.exec(location.hash); if(m) return { mode: 'quiz', part: m[1] }; }catch(e){} return null; } };
      FAC.forEach(function(f){ paintCard(f.id); });
      settle(chainNow([]));
      setTab(S.tab);
      // Without the frame (no Tool Studio on the page) the stage still works on its own.
      if(!ctx.studio){ app.appendChild(stage); app.appendChild(ref); shown('explore', null); }
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(layoutNow, 50); }).observe(sceneBox); }
      else window.addEventListener('resize', layoutNow);
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApChemBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var l2 = document.createElement('link'); l2.rel = 'stylesheet'; l2.href = (window.ApChemBase || '../') + 'assets/tools/units-sig-figs.css'; document.head.appendChild(l2);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
