/* Game Theory Lab page (docs/apmicro-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T4). Mounts into #app with ApMicroTools.mount; the model is
   ApMicroMath.gameLab (assets/tools/math/game-lab.js), the content
   data/tools/game-lab.json (served filtered as assets/tool-data/game-lab.json).
   Frame: ApMicroTools.modes (Explore, then Test yourself) on the Tool Studio.

   Explore: one payoff matrix, drawn by ApMicroMatrix.html (no second
   renderer: this file only adds classes and small tags to its cells). Tap a
   cell to test it: would either firm switch alone, and to what (an arrow
   to that cell, one color per firm). "Best
   responses" lights one firm's two comparisons column by column (or row by
   row), marking the payoff it picks; with both firms marked, the cells
   marked twice are the Nash equilibria; every cell where a firm is not at
   its best response gets that firm's arrow, so a cell with no arrow
   leaving it is a Nash equilibrium. A tax or subsidy slider changes one
   firm's payoffs on one strategy (ApMicroMatrix change) and the matrix,
   the verdicts and the equilibria follow. Details: edit any payoff, choose
   whose strategy the policy hits, every comparison in words.

   Test yourself: ApMicroTools.drill over the model's generate(); matrix
   steps mount ApMicroMatrix on the stage figure (graphHost), graded by
   ApMicroGrade.matrix with the slip named; first tries recorded as
   "game-lab:<context>:<step>". */
(function(){
  'use strict';
  var T = window.ApMicroTools, M = window.ApMicroMath, X = window.ApMicroMatrix;
  if(!T || !M || !M.gameLab || M.gameLab.stub || !X) return;
  var GL = M.gameLab, esc = T.esc;

  T.mount('game-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'game-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var nid = T.nid('gl'), LS = null, touched = false, tip = null, timers = [];
    var game = null, pay = null, sel = null, show = '', lit = { 0: -1, 1: -1 }, seen = { 0: false, 1: false }, tested = {};
    var pol = { player: 0, strategy: 0, amount: 0 }, cur = null;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem gl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Game theory lab</h2>' +
      '<div class="gl-fig"><p class="gl-story"></p><div class="gl-mx"></div><p class="gl-key" aria-hidden="true"></p><ul class="gl-read" aria-label="What the matrix shows"></ul></div>' +
      '<div class="gl-ctl">' +
        '<div class="gl-games ls-scroll" role="group" aria-label="Game">' + GL.GAMES.map(function(g){ return '<button type="button" class="ls-btn gl-game" data-g="' + g.id + '" aria-pressed="false">' + esc(g.short) + '</button>'; }).join('') + '</div>' +
        '<p class="gl-show-l" aria-hidden="true">Show best responses</p><div class="ls-seg gl-show" role="group" aria-label="Show best responses"><button type="button" data-s="0" aria-pressed="false"></button><button type="button" data-s="1" aria-pressed="false"></button><button type="button" data-s="both" aria-pressed="false">Both</button></div>' +
      '</div>' +
      '<div class="gl-say"></div>' +
      '<div class="gl-det"><h3 class="ls-title-l">A tax or subsidy</h3><div class="gl-pol"></div><h3 class="ls-title-l">Who the policy hits</h3><div class="gl-target"></div><h3 class="ls-title-l">Edit the payoffs</h3><div class="gl-edit"></div><p class="bt-small gl-tie" hidden></p><button type="button" class="bt-btn gl-reset">Put this game back</button><h3 class="ls-title-l">Every comparison</h3><div class="gl-cmps"></div></div>' +
      '<p class="sr-only gl-live"></p></section>';
    var say = T.announcer($('.gl-live'));
    var cue = T.cue('Tap any cell of the matrix: would either firm switch?');
    $('.gl-ctl').insertBefore(cue.el, $('.gl-ctl').firstChild);
    var slider = T.slider({ label: 'Tax or subsidy', min: -40, max: 40, step: 5, value: 0, decimals: 0, onInput: function(v){ act(); pol.amount = v; redraw(); say(policyLine()); } });
    $('.gl-pol').appendChild(slider.el);
    function act(){ if(!touched){ touched = true; cue.done(); if(tip && tip.dismiss) tip.dismiss(); } }

    function spec(){ var g = { players: game.players, payoffs: pay }; return GL.spec(g, pol.amount ? pol : null); }
    function load(id){
      game = GL.gameOf(id); pay = game.payoffs.map(function(r){ return r.map(function(c){ return [c[0], c[1]]; }); });
      sel = null; show = ''; lit = { 0: -1, 1: -1 }; seen = { 0: false, 1: false }; tested = {};
      pol = { player: game.policy.player, strategy: game.policy.strategy, amount: 0 }; slider.set(0);
      stop(); target(); edit();
    }
    function stop(){ timers.forEach(clearTimeout); timers = []; cur = null; }
    function names(p){ return game.players[p].name; }
    function per(){ return /^millions/.test(game.unitLabel || '') ? 'million' : 'thousand'; }
    function policyLine(){
      if(!pol.amount) return 'No tax or subsidy.';
      return (pol.amount < 0 ? 'A tax of ' + (-pol.amount) : 'A subsidy of ' + pol.amount) + ' ' + per() + ' dollars on ' + names(pol.player) + ' whenever it chooses ' + game.players[pol.player].strategies[pol.strategy] + '.';
    }
    function sliderLabel(){
      var lab = slider.el.querySelector('label');
      lab.textContent = 'Tax (−) or subsidy (+) on ' + names(pol.player) + ', ' + game.players[pol.player].strategies[pol.strategy] + ' (' + per() + 's)';
      slider.el.querySelectorAll('.bt-step')[0].setAttribute('aria-label', 'More tax'); slider.el.querySelectorAll('.bt-step')[1].setAttribute('aria-label', 'More subsidy');
    }

    /* The cells marked: player p's best response to each choice of the other, lit up to index lit[p]. */
    function marks(s, A){
      var on = { a: [], b: [] };
      [0, 1].forEach(function(p){ for(var o = 0; o <= lit[p]; o++) A.best[p][o].forEach(function(b){ on[p === 0 ? 'a' : 'b'].push(p === 0 ? b + ',' + o : o + ',' + b); }); });
      return on;
    }
    function draw(){
      var s = spec(), A = GL.analyze(s), bad = X.check(s), tie = bad.filter(function(m){ return /tie/.test(m); })[0];
      $('.gl-story').innerHTML = '<b>' + esc(game.name) + '.</b> ' + esc(game.story);
      var box = $('.gl-mx');
      box.innerHTML = X.html(s, { tap: true, on: sel ? [sel] : [] });
      // The comparison being lit: a column (the row firm compares) or a row (the column firm).
      var mk = marks(s, A), cmpCol = cur;
      box.querySelectorAll('[data-cell]').forEach(function(b){
        var c = b.getAttribute('data-cell'), ij = c.split(',').map(Number), td = b.parentNode;
        if(mk.a.indexOf(c) > -1) b.querySelector('.mic-mx-a').classList.add('gl-br');
        if(mk.b.indexOf(c) > -1) b.querySelector('.mic-mx-b').classList.add('gl-br');
        var nash = A.nash.some(function(n){ return n[0] === ij[0] && n[1] === ij[1]; });
        if(nash && ((lit[0] > 0 && lit[1] > 0) || (sel && sel[0] === ij[0] && sel[1] === ij[1]))){ td.classList.add('gl-nash'); b.insertAdjacentHTML('beforeend', '<span class="gl-tag">Nash</span>'); }
        if(cmpCol && (cmpCol.p === 0 ? ij[1] === cmpCol.o : ij[0] === cmpCol.o)) td.classList.add('gl-cmp');
      });
      var moves = [];
      if(sel){
        var t = GL.test(s, sel[0], sel[1]);
        t.moves.forEach(function(m){
          var to = m.player === 0 ? [m.to, sel[1]] : [sel[0], m.to], b = box.querySelector('[data-cell="' + to.join(',') + '"]');
          if(b){ b.parentNode.classList.add('gl-to'); b.insertAdjacentHTML('beforeend', '<span class="gl-tag is-to">' + esc(names(m.player)) + ' moves here</span>'); }
          moves.push({ p: m.player, from: sel, to: to, hot: true });
        });
        if(t.nash) box.querySelector('[data-cell="' + sel.join(',') + '"]').parentNode.classList.add('gl-stay');
      } else {
        // Best responses: from every cell where a firm is not at its best response, an arrow to the cell it would switch to.
        [0, 1].forEach(function(p){
          for(var o = 0; o <= lit[p]; o++){
            var best = A.best[p][o]; if(!best.length) continue;
            [0, 1].forEach(function(k){
              if(best.indexOf(k) > -1) return;
              moves.push({ p: p, from: p === 0 ? [k, o] : [o, k], to: p === 0 ? [best[0], o] : [o, best[0]], hot: cur && cur.p === p && cur.o === o });
            });
          }
        });
      }
      st.moves = moves; arrows();
      $('.gl-key').innerHTML = moves.length ? [0, 1].filter(function(p){ return moves.some(function(m){ return m.p === p; }); }).map(function(p){ return '<span class="gl-k gl-k' + p + '">' + esc(names(p)) + ' would switch</span>'; }).join('') + (sel ? '' : '<span class="gl-k gl-kn">No arrow out: Nash</span>') : '';
      // Readout: each verdict appears once the student has looked for it.
      var rows = [];
      [0, 1].forEach(function(p){
        if(!seen[p]) return;
        var d = A.dom[p];
        rows.push('<li class="gl-r' + (d == null ? ' is-none' : '') + '"><span class="gl-rk">' + esc(names(p)) + '</span> ' + (d == null ? 'no dominant strategy' : 'dominant: <b>' + esc(game.players[p].strategies[d]) + '</b>') + '</li>');
      });
      if(seen[0] && seen[1] || Object.keys(tested).length === 4){
        rows.push('<li class="gl-r is-nash"><span class="gl-rk">Nash</span> ' + (A.nash.length ? A.nash.map(function(c){ return '<b>' + esc(GL.cellName(s, c)) + '</b>'; }).join(' and ') : 'none in pure strategies') + '</li>');
        // (pass 2: the most combined payoff is in Details, under Every comparison)
      }
      if(tie) rows.unshift('<li class="gl-r is-warn">' + esc(tie.replace(/^matrix: /, '')) + '</li>');
      $('.gl-read').innerHTML = rows.join('');
      $('.gl-read').hidden = !rows.length;
      return { s: s, A: A };
    }
    /* Each switch drawn as an arrow from the cell to the cell the firm moves to, one color per firm
       (tools review 2026-11-10): a cell with no arrow leaving it is a Nash equilibrium, and a game
       with none shows its arrows chasing round in a circle. */
    var st = { moves: [] };
    function arrows(){
      var box = $('.gl-mx'); if(!box) return;
      var old = box.querySelector('.gl-arrows'); if(old) old.remove();
      if(!st.moves.length) return;
      var R = box.getBoundingClientRect(); if(!R.width) return;
      function rect(c){ var b = box.querySelector('[data-cell="' + c.join(',') + '"]'); if(!b) return null; var r = b.getBoundingClientRect(); return { l: r.left - R.left, t: r.top - R.top, w: r.width, h: r.height }; }
      var out = [];
      st.moves.forEach(function(m){
        var a = rect(m.from), b = rect(m.to); if(!a || !b) return;
        var x1, y1, x2, y2;
        if(m.p === 0){ // the row firm switches rows: a vertical arrow on the cell's right side
          var x = a.l + a.w - Math.max(11, a.w * 0.07); x1 = x2 = x;
          var down = b.t > a.t; y1 = down ? a.t + a.h * 0.62 : a.t + a.h * 0.38; y2 = down ? b.t + b.h * 0.3 : b.t + b.h * 0.7;
        } else { // the column firm switches columns: a horizontal arrow low in the cell
          var y = a.t + a.h * 0.8; y1 = y2 = y;
          var right = b.l > a.l; x1 = right ? a.l + a.w * 0.62 : a.l + a.w * 0.38; x2 = right ? b.l + b.w * 0.3 : b.l + b.w * 0.7;
        }
        out.push('<path class="gl-arr gl-arr' + m.p + (m.hot ? ' is-hot' : '') + '" d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" marker-end="url(#gl-ah' + m.p + ')"/>');
      });
      box.insertAdjacentHTML('beforeend', '<svg class="gl-arrows" aria-hidden="true" width="' + box.scrollWidth + '" height="' + box.scrollHeight + '"><defs>' + [0, 1].map(function(p){ return '<marker id="gl-ah' + p + '" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto"><path class="gl-ah gl-ah' + p + '" d="M0 0L10 5L0 10z"/></marker>'; }).join('') + '</defs>' + out.join('') + '</svg>');
    }
    function why(r){
      var s = r.s, A = r.A, head, body = '', short = null;
      if(sel){
        var t = GL.test(s, sel[0], sel[1]), P = A.P[sel[0]][sel[1]];
        head = '<b>' + esc(GL.cellName(s, sel)) + '</b>: ' + esc(names(0)) + ' ' + P[0] + ', ' + esc(names(1)) + ' ' + P[1] + '. ' + (t.nash ? 'Neither firm gains by switching alone: a Nash equilibrium.' :
          t.moves.map(function(m){ return esc(names(m.player)) + ' would switch to ' + esc(game.players[m.player].strategies[m.to]) + ' (' + m.gain + ' instead of ' + m.got + ')'; }).join('; ') + '. Not an equilibrium.');
        body = '<p>To test a cell, hold the other firm’s choice fixed and ask each firm alone: does switching pay? If neither gains, the cell is a Nash equilibrium.</p>';
      } else if(show){
        var ps = show === 'both' ? [0, 1] : [+show];
        head = ps.map(function(p){ return esc(GL.proof(s, p)); }).join(' ');
        // The verdicts are the chips under the matrix; the caption says how to read the arrows (pass 2).
        short = show === 'both' ? 'Each arrow is a firm switching to its better choice. A cell with no arrow leaving it is a Nash equilibrium.' : 'The arrows show where ' + esc(names(+show)) + ' would switch, whatever ' + esc(names(1 - show)) + ' does.';
        body = '<p>A dominant strategy is better <b>whatever</b> the other firm does, so it takes two comparisons, one for each of the other firm’s choices, with the numbers. One comparison is not enough, and the largest single payoff proves nothing.</p>' +
          (show === 'both' ? '<p>A cell marked for both firms is a best response for each to the other: a Nash equilibrium. ' + esc(cap(GL.nashWords(s, A.nash))) + '.</p>' : '');
      } else {
        head = 'Tap any cell: would either firm switch alone?';
        body = '<p>Each firm compares only its own payoffs. ' + esc(names(0)) + ' picks the row and is paid first in each cell; ' + esc(names(1)) + ' picks the column and is paid second.</p>';
      }
      if(pol.amount) body += '<p><b>Policy:</b> ' + esc(policyLine()) + ' ' + esc(GL.verdict(s, pol.player)) + '. ' + esc(cap(GL.nashWords(s, A.nash))) + '.</p>';
      T.explain($('.gl-say'), head, body);
      if(LS){
        LS.caption(short || head, 'explore');
        var pills = [];
        // (pass 2: no verdict pill for a tested cell: the caption says it and the cell shows it)
        if(pol.amount) pills.push({ html: (pol.amount < 0 ? 'Tax ' + (-pol.amount) : 'Subsidy ' + pol.amount), tone: 'accent' });
        LS.pills(pills, 'left', 'explore');
      }
      var jj = A.joint.length === 1 ? A.joint[0] : null;
      $('.gl-cmps').innerHTML = [0, 1].map(function(p){ return '<p><b>' + esc(names(p)) + ':</b> ' + esc(GL.proof(s, p)) + '</p>'; }).join('') +
        (jj ? '<p><b>Most combined:</b> ' + esc(GL.cellName(s, jj)) + ', ' + A.sums[jj[0]][jj[1]] + '</p>' : '') +
        '<p class="bt-small">Combined payoffs: ' + [0, 1].map(function(i){ return [0, 1].map(function(k){ return esc(GL.cellName(s, [i, k])) + ' ' + A.sums[i][k]; }).join(', '); }).join(', ') + '.</p>';
    }
    function cap(t){ return t.charAt(0).toUpperCase() + t.slice(1); }
    function sync(){
      ($('.gl-games') ? $('.gl-games').querySelectorAll('.gl-game') : []).forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-g') === game.id)); });
      var sb = $('.gl-show').querySelectorAll('button');
      sb[0].textContent = names(0); sb[1].textContent = names(1);
      sb.forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-s') === show)); });
      sliderLabel();
    }
    function redraw(){ var r = draw(); why(r); sync(); }
    // Light the comparisons one choice of the other firm at a time.
    function reveal(v){
      stop(); sel = null; show = v;
      var ps = v === 'both' ? [0, 1] : [+v];
      [0, 1].forEach(function(p){ if(ps.indexOf(p) < 0) lit[p] = -1; });
      ps.forEach(function(p){ seen[p] = true; });
      if(T.reduced()){ ps.forEach(function(p){ lit[p] = 1; }); redraw(); return; }
      ps.forEach(function(p){ lit[p] = -1; });
      redraw();
      var k = 0;
      ps.forEach(function(p){ [0, 1].forEach(function(o){ timers.push(setTimeout(function(){ lit[p] = o; cur = { p: p, o: o }; redraw(); }, 650 * (++k))); }); });
      timers.push(setTimeout(function(){ cur = null; redraw(); }, 650 * (k + 1)));
    }
    function onClick(e){
      var b;
      if((b = e.target.closest('.gl-game'))){ act(); load(b.getAttribute('data-g')); redraw(); say(game.name + '. ' + game.story); return; }
      if((b = e.target.closest('.gl-show button'))){ act(); reveal(b.getAttribute('data-s')); say(GL.proof(spec(), b.getAttribute('data-s') === 'both' ? 0 : +b.getAttribute('data-s'))); return; }
      if((b = e.target.closest('.gl-mx [data-cell]'))){
        act(); stop();
        var c = b.getAttribute('data-cell').split(',').map(Number);
        sel = sel && sel[0] === c[0] && sel[1] === c[1] ? null : c; tested[c.join(',')] = 1;
        if(show){ show = ''; }
        redraw();
        var again = $('.gl-mx [data-cell="' + c.join(',') + '"]'); if(again) again.focus();
        say(T.sayHead ? T.sayHead($('.gl-say')).replace(/<[^>]+>/g, '') : '');
        return;
      }
      if(e.target.closest('.gl-reset')){ act(); load(game.id); redraw(); say('The game is back as it was.'); }
    }
    host.addEventListener('click', onClick);
    if(window.ResizeObserver) new ResizeObserver(function(){ arrows(); }).observe($('.gl-mx'));

    function target(){
      var el = $('.gl-target');
      el.innerHTML = '';
      var who = T.choiceSelect({ label: 'Firm', options: game.players.map(function(p, i){ return { value: i, label: p.name }; }), value: pol.player, onChange: function(v){ pol.player = +v; fill(); redraw(); } });
      var what = T.choiceSelect({ label: 'Strategy', options: [], value: pol.strategy, onChange: function(v){ pol.strategy = +v; redraw(); } });
      function fill(){ what.select.innerHTML = game.players[pol.player].strategies.map(function(s, i){ return '<option value="' + i + '"' + (i === pol.strategy ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join(''); }
      fill();
      el.appendChild(who.el); el.appendChild(what.el);
    }
    function edit(){
      var a = game.players[0], b = game.players[1], rows = '';
      a.strategies.forEach(function(sa, i){
        rows += '<tr><th scope="row">' + esc(sa) + '</th>' + b.strategies.map(function(sb, j){
          return '<td>' + [0, 1].map(function(p){ var lab = (p === 0 ? a.name : b.name) + ' payoff in (' + sa + ', ' + sb + ')'; return '<input type="number" inputmode="numeric" step="5" class="gl-in is-' + (p ? 'b' : 'a') + '" data-i="' + i + '" data-j="' + j + '" data-p="' + p + '" value="' + pay[i][j][p] + '" aria-label="' + esc(lab) + '">'; }).join('') + '</td>';
        }).join('') + '</tr>';
      });
      $('.gl-edit').innerHTML = T.wrapTables('<table class="ls-tbl gl-etbl"><caption>' + esc(a.name) + ' first, ' + esc(b.name) + ' second, before any policy</caption><thead><tr><th scope="col"></th>' + b.strategies.map(function(s){ return '<th scope="col">' + esc(s) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table>');
    }
    host.addEventListener('input', onInput);
    function onInput(e){
      var t = e.target.closest('.gl-in'); if(!t) return;
      var v = +t.value; if(!isFinite(v) || t.value === '') return;
      act(); pay[+t.getAttribute('data-i')][+t.getAttribute('data-j')][+t.getAttribute('data-p')] = Math.max(-99, Math.min(199, Math.round(v)));
      redraw();
    }

    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.gl-fig')], dock: [$('.gl-ctl')], why: [$('.gl-say')], details: [$('.gl-det')] });
      s.root.addEventListener('click', onClick); host.removeEventListener('click', onClick);
      s.root.addEventListener('input', onInput); host.removeEventListener('input', onInput);
      redraw();
      if(s.mode() === 'explore' && !touched){ var first = s.root.querySelector('.gl-mx [data-cell="1,0"]') || s.root.querySelector('.gl-mx [data-cell]'); tip = T.hintSlot(s, first, 'Start here: tap a cell to test it', { before: s.root.querySelector('.gl-mx') }); }
    }
    load(GL.GAMES[0].id); redraw();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  var TITLES = { dominant: 'Dominant strategies, proved', nash: 'Every Nash equilibrium', best: 'Best responses', change: 'A tax or subsidy changes the game' };
  function quiz(host, data){
    T.drill(host, data, { slug: 'game-lab', noun: 'drill', studioAsk: true,
      generate: function(r, ctx, type){ return GL.generate(r, ctx, type); },
      types: [{ value: 'dominant', label: 'Dominant strategies and the proof' }, { value: 'nash', label: 'Every Nash equilibrium' }, { value: 'best', label: 'Best responses' }, { value: 'change', label: 'A tax or subsidy' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return TITLES[p.type] || 'Practice problem'; },
      extra: function(el, p, api){
        el.innerHTML = '<figure class="cd-fig gl-qfig"><figcaption class="gl-qcap"></figcaption><div class="gl-qmx"></div><ul class="gl-qnote" aria-label="Found so far"></ul></figure>';
        api.mx = el.querySelector('.gl-qmx'); api.note = el.querySelector('.gl-qnote');
        api.story = (data.contexts.filter(function(c){ return c.id === p.ctx; })[0] || {}).story || '';
        el.querySelector('.gl-qcap').textContent = (p.after ? 'Before the ' + (p.change.amount < 0 ? 'tax' : 'subsidy') + '. ' : '') + api.story;
        api.mx.innerHTML = X.html(p.matrix);
      },
      graphHost: function(s, api){
        var d = document.createElement('div');
        api.mx.innerHTML = ''; api.mx.appendChild(d);
        var cap = api.mx.parentNode.querySelector('.gl-qcap'); if(cap && api.problem.after && s.spec.change) cap.textContent = 'After the ' + (api.problem.change.amount < 0 ? 'tax' : 'subsidy') + '. ' + api.story;
        return d;
      },
      onStep: function(s, right, api){
        if(s.kind !== 'matrix' || !api.note) return;
        var sp = s.spec, k = X.keyResponse(sp), out = [];
        if(k.dominant) [0, 1].forEach(function(p){ out.push(esc(sp.players[p].name) + ': ' + (k.dominant[p] === 'none' ? 'no dominant strategy' : 'dominant ' + esc(sp.players[p].strategies[k.dominant[p]]))); });
        if(k.nash) out.push('Nash: ' + (k.nash.length ? k.nash.map(function(c){ return esc(X.cellName(sp, c)); }).join(' and ') : 'none'));
        if(k.joint) out.push('Most combined: ' + esc(X.cellName(sp, k.joint)));
        if(k.best != null) out.push('Best response: ' + esc(sp.players[sp.ask.best.player].strategies[k.best]));
        api.note.insertAdjacentHTML('beforeend', out.map(function(t){ return '<li class="' + (right ? 'is-ok' : 'is-shown') + '">' + t + '</li>'; }).join(''));
      }
    });
  }
})();
