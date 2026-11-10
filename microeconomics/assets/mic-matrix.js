/* ApMicroMatrix: payoff matrices for game theory (docs/apmicro-architecture.md
   "Payoff matrices", spec section 5b item 6). A matrix is not a graph: a
   separate item format, `matrix`, usable as a bank item, a lesson check item,
   an FRQ part (type "matrix") and a drill step. Graded exactly, by code.

   PURE (node and browser)
     payoffs(spec)            the payoff table after spec.change (a tax, a
                              subsidy, a cost change on one player's strategy)
     best(spec, player, given)   the best responses (indices) of a player
                              to the other's strategy `given`
     dominant(spec, player)   the index of a player's dominant strategy, or null
     nash(spec)               every pure-strategy Nash equilibrium [[row, col]]
     joint(spec)              the cell(s) with the largest combined payoff
     comparisons(spec, player)  the two (or more) comparisons that prove or
                              disprove a dominant strategy, in words
     keyResponse(spec)        the full-credit response
     check(spec)              problems with an authored spec
     grade(spec, response)    { valid, correct, score, points, notes, slip }
     html(spec, opts)         the table as HTML (build time and runtime)
   DOM
     mount(host, spec, opts) -> { get(), set(r), reset(), showKey(on), lock(), el }

   spec: { players: [{ name, strategies: [..] }, { name, strategies: [..] }],
           payoffs: [[[rowPayoff, colPayoff], ...], ...]   (row i, column j),
           unit?, change?: { player: 0 | 1, strategy: <index> | null, amount },
           do: ['dominant', 'nash', 'best', 'joint'],
           ask?: { best: { player, given } }, slips?: { <task>: sentence } }
   Player 0 chooses the row, player 1 the column; in each cell the row
   player's payoff is listed first, as the exam writes it.
   response: { dominant: { 0: <index> | 'none', 1: <index> | 'none' },
               nash: [[row, col], ...], best: <index>, joint: [row, col] } */
(function(root){
  'use strict';
  var TASKS = ['dominant', 'nash', 'best', 'joint'];
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function rows(spec){ return spec.players[0].strategies.length; }
  function cols(spec){ return spec.players[1].strategies.length; }
  function payoffs(spec){
    var P = spec.payoffs.map(function(r){ return r.map(function(c){ return [c[0], c[1]]; }); }), ch = spec.change;
    if(ch){ P.forEach(function(r, i){ r.forEach(function(c, j){ var mine = ch.player === 0 ? i : j; if(ch.strategy == null || ch.strategy === mine) c[ch.player] = Math.round((c[ch.player] + ch.amount) * 1e9) / 1e9; }); }); }
    return P;
  }
  // The payoff player p gets from its own strategy s when the other plays o.
  function pay(P, p, s, o){ return p === 0 ? P[s][o][0] : P[o][s][1]; }
  function count(spec, p){ return p === 0 ? rows(spec) : cols(spec); }
  function best(spec, p, o){
    var P = payoffs(spec), n = count(spec, p), top = -Infinity, out = [];
    for(var s = 0; s < n; s++){ var v = pay(P, p, s, o); if(v > top + 1e-9){ top = v; out = [s]; } else if(Math.abs(v - top) < 1e-9) out.push(s); }
    return out;
  }
  // Strictly dominant: better than every other strategy whatever the other player does.
  function dominant(spec, p){
    var P = payoffs(spec), n = count(spec, p), m = count(spec, 1 - p);
    for(var s = 0; s < n; s++){
      var ok = true;
      for(var o = 0; o < m && ok; o++) for(var t = 0; t < n; t++) if(t !== s && !(pay(P, p, s, o) > pay(P, p, t, o) + 1e-9)){ ok = false; break; }
      if(ok) return s;
    }
    return null;
  }
  function nash(spec){
    var out = [];
    for(var i = 0; i < rows(spec); i++) for(var j = 0; j < cols(spec); j++) if(best(spec, 0, j).indexOf(i) > -1 && best(spec, 1, i).indexOf(j) > -1) out.push([i, j]);
    return out;
  }
  function joint(spec){
    var P = payoffs(spec), top = -Infinity, out = [];
    for(var i = 0; i < rows(spec); i++) for(var j = 0; j < cols(spec); j++){ var v = P[i][j][0] + P[i][j][1]; if(v > top + 1e-9){ top = v; out = [[i, j]]; } else if(Math.abs(v - top) < 1e-9) out.push([i, j]); }
    return out;
  }
  function money(spec, v){ return (spec.unit === '$' ? '$' + v : String(v) + (spec.unit ? ' ' + spec.unit : '')); }
  /* The comparisons that settle a dominant-strategy claim, one per strategy of
     the other player (the exam's rule: state both). */
  function comparisons(spec, p){
    var P = payoffs(spec), me = spec.players[p], other = spec.players[1 - p], n = count(spec, p), m = count(spec, 1 - p), out = [];
    for(var o = 0; o < m; o++){
      var parts = [];
      for(var s = 0; s < n; s++) parts.push(money(spec, pay(P, p, s, o)) + ' from ' + me.strategies[s]);
      var b = best(spec, p, o).map(function(s){ return me.strategies[s]; }).join(' or ');
      out.push('If ' + other.name + ' chooses ' + other.strategies[o] + ', ' + me.name + ' earns ' + parts.join(' or ') + ', so ' + b + ' is better');
    }
    return out;
  }
  function sameCell(a, b){ return a && b && a[0] === b[0] && a[1] === b[1]; }
  function cellName(spec, c){ return '(' + spec.players[0].strategies[c[0]] + ', ' + spec.players[1].strategies[c[1]] + ')'; }
  function keyResponse(spec){
    var d = spec.do || [], r = {};
    if(d.indexOf('dominant') > -1){ r.dominant = {}; [0, 1].forEach(function(p){ var s = dominant(spec, p); r.dominant[p] = s == null ? 'none' : s; }); }
    if(d.indexOf('nash') > -1){ r.nash = nash(spec); if(!r.nash.length) r.nashNone = true; }
    if(d.indexOf('best') > -1){ var a = (spec.ask || {}).best || {}; r.best = best(spec, a.player || 0, a.given || 0)[0]; }
    if(d.indexOf('joint') > -1) r.joint = joint(spec)[0];
    return r;
  }
  function check(spec){
    var out = [], bad = function(m){ out.push(m); };
    if(!spec || typeof spec !== 'object') return ['matrix: needs a matrix object'];
    if(!Array.isArray(spec.players) || spec.players.length !== 2) return ['matrix.players lists the two players, each { name, strategies }'];
    spec.players.forEach(function(p, i){ if(!p || !p.name || !Array.isArray(p.strategies) || p.strategies.length < 2 || p.strategies.length > 3) bad('matrix.players[' + i + '] needs a name and 2 or 3 strategies'); });
    if(out.length) return out;
    if(!Array.isArray(spec.payoffs) || spec.payoffs.length !== rows(spec) || spec.payoffs.some(function(r){ return !Array.isArray(r) || r.length !== cols(spec) || r.some(function(c){ return !Array.isArray(c) || c.length !== 2 || !c.every(function(v){ return typeof v === 'number' && isFinite(v); }); }); }))
      return ['matrix.payoffs is ' + rows(spec) + ' rows of ' + cols(spec) + ' cells, each [row player\'s payoff, column player\'s payoff]'];
    var d = spec.do || [];
    if(!Array.isArray(d) || !d.length) bad('matrix.do lists the tasks: ' + TASKS.join(', '));
    d.forEach(function(t){ if(TASKS.indexOf(t) < 0) bad('matrix.do: unknown task "' + t + '"'); });
    if(spec.change){ var c = spec.change; if((c.player !== 0 && c.player !== 1) || typeof c.amount !== 'number' || !c.amount || (c.strategy != null && !(c.strategy >= 0 && c.strategy < count(spec, c.player)))) bad('matrix.change is { player: 0 or 1, strategy: an index or null (every strategy), amount: the change to that player\'s payoffs, not 0 }'); }
    // Ties make "better" ambiguous: every comparison a player makes is strict.
    var P = payoffs(spec);
    [0, 1].forEach(function(p){ for(var o = 0; o < count(spec, 1 - p); o++){ var seen = {}; for(var s = 0; s < count(spec, p); s++){ var v = pay(P, p, s, o); if(seen[v]) bad('matrix: ' + spec.players[p].name + ' gets ' + v + ' from two strategies when the other plays ' + spec.players[1 - p].strategies[o] + ' (a tie leaves "better" undecided)'); seen[v] = 1; } } });
    if(d.indexOf('best') > -1){ var a = (spec.ask || {}).best; if(!a || (a.player !== 0 && a.player !== 1) || !(a.given >= 0 && a.given < count(spec, 1 - a.player))) bad('matrix.ask.best { player, given } names whose best response, to which of the other\'s strategies'); }
    if(d.indexOf('joint') > -1 && joint(spec).length > 1) bad('matrix: two cells tie for the largest combined payoff');
    Object.keys(spec.slips || {}).forEach(function(t){ if(TASKS.indexOf(t) < 0) bad('matrix.slips: "' + t + '" is not a task'); else if(String(spec.slips[t]).length < 15) bad('matrix.slips.' + t + ' explains the slip in a sentence'); });
    return out;
  }
  function grade(spec, resp){
    var d = spec.do || [], r = resp || {}, pts = [];
    var valid = d.some(function(t){ return t === 'nash' ? Array.isArray(r.nash) && r.nash.length > 0 || r.nashNone === true : t === 'dominant' ? r.dominant && Object.keys(r.dominant).length : r[t] != null; });
    var P = payoffs(spec);
    if(d.indexOf('dominant') > -1){
      var bad = null, note = '';
      [0, 1].forEach(function(p){
        if(bad != null) return;
        var want = dominant(spec, p), got = r.dominant ? r.dominant[p] : undefined, name = spec.players[p].name;
        if(got === undefined || got === '' || got === null){ bad = p; note = 'Decide whether ' + name + ' has a dominant strategy.'; return; }
        var g = got === 'none' ? null : +got;
        if(g === want) return;
        bad = p;
        var cmp = comparisons(spec, p).join('; ') + '.';
        // The slip readers report: picking the strategy with the single highest payoff.
        var top = -Infinity, topS = null; for(var s = 0; s < count(spec, p); s++) for(var o = 0; o < count(spec, 1 - p); o++){ var v = pay(P, p, s, o); if(v > top){ top = v; topS = s; } }
        var big = g != null && g === topS ? 'That strategy holds the single largest payoff, but a dominant strategy wins every comparison, not one. ' : '';
        if(want == null) note = big + name + ' has no dominant strategy: ' + cmp + ' The best choice depends on what the other player does.';
        else if(g == null) note = name + ' does have a dominant strategy, ' + spec.players[p].strategies[want] + ': ' + cmp;
        else note = cmp + ' So ' + name + "'s dominant strategy is " + spec.players[p].strategies[want] + '.';
      });
      pts.push({ id: 'dominant', ok: bad == null, note: bad == null ? '' : (spec.slips && spec.slips.dominant) || note });
    }
    if(d.indexOf('nash') > -1){
      var want = nash(spec), got = (r.nash || []).map(function(c){ return [+c[0], +c[1]]; }), n4 = '';
      var missing = want.filter(function(w){ return !got.some(function(g){ return sameCell(g, w); }); }), extra = got.filter(function(g){ return !want.some(function(w){ return sameCell(g, w); }); });
      if(!want.length && r.nashNone && !got.length) n4 = '';
      else if(!want.length) n4 = 'No cell is a Nash equilibrium in pure strategies: in every cell one player gains by switching.';
      else if(!got.length) n4 = r.nashNone ? 'There is a Nash equilibrium: ' + want.map(function(c){ return cellName(spec, c); }).join(' and ') + '.' : 'Mark every Nash equilibrium.';
      else if(extra.length){
        var e = extra[0], i = e[0], j = e[1], br0 = best(spec, 0, j), who = br0.indexOf(i) < 0 ? 0 : 1, alt = who === 0 ? br0[0] : best(spec, 1, i)[0];
        var isJoint = joint(spec).some(function(c){ return sameCell(c, e); });
        n4 = (isJoint ? 'That cell gives the most combined payoff, but it is not an equilibrium: ' : 'Not an equilibrium: ') + 'in ' + cellName(spec, e) + ', ' + spec.players[who].name + ' would switch to ' + spec.players[who].strategies[alt] + ' (' + money(spec, pay(P, who, alt, who === 0 ? j : i)) + ' instead of ' + money(spec, pay(P, who, who === 0 ? i : j, who === 0 ? j : i)) + ').';
      }
      else if(missing.length) n4 = want.length > 1 ? 'There are ' + want.length + ' Nash equilibria; you found ' + got.length + '. Check every cell: in each equilibrium, neither player gains by switching alone.' : 'The Nash equilibrium is ' + cellName(spec, want[0]) + '.';
      pts.push({ id: 'nash', ok: !n4, note: n4 ? (spec.slips && spec.slips.nash) || n4 : '' });
    }
    if(d.indexOf('best') > -1){
      var a = (spec.ask || {}).best || {}, bw = best(spec, a.player || 0, a.given || 0), ok = r.best != null && bw.indexOf(+r.best) > -1, pl = spec.players[a.player || 0], ot = spec.players[1 - (a.player || 0)];
      pts.push({ id: 'best', ok: ok, note: ok ? '' : r.best == null ? 'Choose the best response.' : (spec.slips && spec.slips.best) || 'Hold ' + ot.name + "'s choice fixed at " + ot.strategies[a.given || 0] + ' and compare only ' + pl.name + "'s payoffs: " + comparisons(spec, a.player || 0)[a.given || 0] + '.' });
    }
    if(d.indexOf('joint') > -1){
      var jw = joint(spec)[0], jg = r.joint ? [+r.joint[0], +r.joint[1]] : null, okj = sameCell(jw, jg);
      pts.push({ id: 'joint', ok: okj, note: okj ? '' : !jg ? 'Choose the cell with the largest combined payoff.' : (spec.slips && spec.slips.joint) || 'Add the two payoffs in each cell (do not add across cells): ' + cellName(spec, jw) + ' gives ' + money(spec, P[jw[0]][jw[1]][0] + P[jw[0]][jw[1]][1]) + ', the most.' });
    }
    var right = pts.filter(function(x){ return x.ok; }).length, badPts = pts.filter(function(x){ return !x.ok; });
    return { valid: !!valid, correct: pts.length > 0 && !badPts.length, score: pts.length ? right / pts.length : 0, points: pts, right: right, total: pts.length,
      notes: badPts.map(function(x){ return x.note; }).filter(Boolean), slip: badPts.length ? badPts[0].note : '' };
  }

  /* The table: the column player across the top, the row player down the side;
     each cell lists (row payoff, column payoff), each in its player's color. */
  function html(spec, opts){
    opts = opts || {};
    var P = payoffs(spec), a = spec.players[0], b = spec.players[1], tap = opts.tap, on = opts.on || [], keyOn = opts.key || [];
    var cap = '<caption class="mic-mx-cap">' + esc(opts.caption || ('Payoffs' + (spec.unit ? ' (' + (spec.unit === '$' ? 'dollars' : spec.unit) + ')' : '') + ': ' + a.name + ' first, ' + b.name + ' second')) + '</caption>';
    var head = '<tr><td class="mic-mx-corner" rowspan="2" colspan="2"></td><th scope="colgroup" colspan="' + b.strategies.length + '" class="mic-mx-pl is-b">' + esc(b.name) + '</th></tr><tr>' +
      b.strategies.map(function(s){ return '<th scope="col" class="mic-mx-st is-b">' + esc(s) + '</th>'; }).join('') + '</tr>';
    var body = a.strategies.map(function(s, i){
      return '<tr>' + (i === 0 ? '<th scope="rowgroup" rowspan="' + a.strategies.length + '" class="mic-mx-pl is-a"><span>' + esc(a.name) + '</span></th>' : '') + '<th scope="row" class="mic-mx-st is-a">' + esc(s) + '</th>' +
        b.strategies.map(function(t, j){
          var c = P[i][j], lab = esc(s + ' and ' + t + ': ' + a.name + ' ' + money(spec, c[0]) + ', ' + b.name + ' ' + money(spec, c[1]));
          var pick = on.some(function(x){ return x[0] === i && x[1] === j; }), isKey = keyOn.some(function(x){ return x[0] === i && x[1] === j; });
          var inner = '<span class="mic-mx-a">' + esc(money(spec, c[0])) + '</span><span class="mic-mx-sep">, </span><span class="mic-mx-b">' + esc(money(spec, c[1])) + '</span>';
          return '<td class="mic-mx-cell' + (pick ? ' is-on' : '') + (isKey ? ' is-key' : '') + '">' + (tap ? '<button type="button" class="mic-mx-btn" data-cell="' + i + ',' + j + '" aria-pressed="' + (pick ? 'true' : 'false') + '" aria-label="' + lab + '">' + inner + '</button>' : inner) + '</td>';
        }).join('') + '</tr>';
    }).join('');
    return '<div class="mic-mx-wrap"><table class="mic-mx">' + cap + '<thead>' + head + '</thead><tbody>' + body + '</tbody></table>' +
      (spec.change && !opts.noChange ? '<p class="mic-small mic-mx-note">' + esc(changeWords(spec)) + '</p>' : '') + '</div>';
  }
  function changeWords(spec){
    var c = spec.change, p = spec.players[c.player], amt = Math.abs(c.amount);
    return 'Payoffs shown after the change: ' + p.name + "'s payoff " + (c.amount < 0 ? 'falls' : 'rises') + ' by ' + money(spec, amt) + (c.strategy == null ? ' in every cell.' : ' whenever it chooses ' + p.strategies[c.strategy] + '.');
  }

  var uid = 0;
  function mount(host, spec, opts){
    opts = opts || {};
    var d = spec.do || [], id = 'mx' + (++uid), st;
    function reset(){ st = { dominant: {}, nash: [], nashNone: false, best: null, joint: null, key: false }; }
    reset();
    host.classList.add('mic-matrix');
    function tapMode(){ return d.indexOf('nash') > -1 ? 'nash' : d.indexOf('joint') > -1 ? 'joint' : null; }
    function paint(){
      var mode = tapMode(), key = st.key ? (mode === 'nash' ? nash(spec) : mode === 'joint' ? joint(spec) : []) : [];
      var on = mode === 'nash' ? st.nash : mode === 'joint' && st.joint ? [st.joint] : [];
      var parts = [html(spec, { tap: !!mode && !opts.readonly, on: on, key: key })];
      if(mode === 'nash') parts.push('<p class="mic-small mic-mx-help" id="' + id + '-h">Tap every cell that is a Nash equilibrium (tap again to clear).</p><label class="mic-mx-none"><input type="checkbox" data-none="1"' + (st.nashNone ? ' checked' : '') + (opts.readonly ? ' disabled' : '') + '> No cell is a Nash equilibrium</label>');
      if(mode === 'joint' && d.indexOf('nash') < 0) parts.push('<p class="mic-small mic-mx-help">Tap the cell with the largest combined payoff.</p>');
      if(d.indexOf('nash') > -1 && d.indexOf('joint') > -1) parts.push('<label class="mic-mx-field"><span>Largest combined payoff</span><select data-joint="1"' + (opts.readonly ? ' disabled' : '') + '><option value="">Choose a cell</option>' + cellsList().map(function(c){ return '<option value="' + c[0] + ',' + c[1] + '"' + (st.joint && st.joint[0] === c[0] && st.joint[1] === c[1] ? ' selected' : '') + '>' + esc(cellName(spec, c)) + '</option>'; }).join('') + '</select></label>');
      if(d.indexOf('dominant') > -1) parts.push('<div class="mic-mx-fields">' + [0, 1].map(function(p){
        var v = st.dominant[p], pl = spec.players[p];
        return '<label class="mic-mx-field"><span>' + esc(pl.name) + "'s dominant strategy</span><select data-dom=\"" + p + '"' + (opts.readonly ? ' disabled' : '') + '><option value="">Choose</option>' + pl.strategies.map(function(s, i){ return '<option value="' + i + '"' + (String(v) === String(i) ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '<option value="none"' + (v === 'none' ? ' selected' : '') + '>No dominant strategy</option></select></label>';
      }).join('') + '</div>');
      if(d.indexOf('best') > -1){ var a = (spec.ask || {}).best || {}, pl = spec.players[a.player || 0], ot = spec.players[1 - (a.player || 0)];
        parts.push('<label class="mic-mx-field"><span>' + esc(pl.name) + "'s best response if " + esc(ot.name) + ' chooses ' + esc(ot.strategies[a.given || 0]) + '</span><select data-best="1"' + (opts.readonly ? ' disabled' : '') + '><option value="">Choose</option>' + pl.strategies.map(function(s, i){ return '<option value="' + i + '"' + (st.best === i ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></label>'); }
      if(!opts.readonly) parts.push('<p class="mic-mx-actions"><button type="button" class="btn-outline sm mic-mx-reset">Start over</button></p>');
      host.innerHTML = parts.join('');
    }
    function cellsList(){ var out = []; for(var i = 0; i < rows(spec); i++) for(var j = 0; j < cols(spec); j++) out.push([i, j]); return out; }
    function fire(){ var r = get(); if(opts.onChange) opts.onChange(r); try{ host.dispatchEvent(new CustomEvent('micmatrix:change', { detail: r })); }catch(e){} }
    host.addEventListener('click', function(e){
      if(opts.readonly) return;
      if(e.target.closest('.mic-mx-reset')){ reset(); paint(); fire(); return; }
      var b = e.target.closest('[data-cell]'); if(!b) return;
      var c = b.getAttribute('data-cell').split(',').map(Number), mode = tapMode();
      if(mode === 'nash'){ var k = -1; st.nash.forEach(function(x, i){ if(sameCell(x, c)) k = i; }); if(k > -1) st.nash.splice(k, 1); else { st.nash.push(c); st.nashNone = false; } }
      else if(mode === 'joint') st.joint = sameCell(st.joint, c) ? null : c;
      paint(); fire();
      var again = host.querySelector('[data-cell="' + c.join(',') + '"]'); if(again) again.focus();
    });
    host.addEventListener('change', function(e){
      if(opts.readonly) return;
      var t = e.target;
      if(t.hasAttribute('data-dom')){ var p = +t.getAttribute('data-dom'); if(t.value === '') delete st.dominant[p]; else st.dominant[p] = t.value === 'none' ? 'none' : +t.value; }
      else if(t.hasAttribute('data-best')) st.best = t.value === '' ? null : +t.value;
      else if(t.hasAttribute('data-joint')) st.joint = t.value === '' ? null : t.value.split(',').map(Number);
      else if(t.hasAttribute('data-none')){ st.nashNone = t.checked; if(t.checked) st.nash = []; paint(); }
      fire();
    });
    function get(){ var r = {}; if(d.indexOf('dominant') > -1){ r.dominant = {}; for(var p in st.dominant) r.dominant[p] = st.dominant[p]; }
      if(d.indexOf('nash') > -1){ r.nash = st.nash.map(function(c){ return c.slice(); }); if(st.nashNone) r.nashNone = true; }
      if(d.indexOf('best') > -1) r.best = st.best; if(d.indexOf('joint') > -1) r.joint = st.joint ? st.joint.slice() : null; return r; }
    function set(r){ reset(); r = r || {}; if(r.dominant) for(var p in r.dominant) st.dominant[p] = r.dominant[p]; if(r.nash) st.nash = r.nash.map(function(c){ return [+c[0], +c[1]]; }); st.nashNone = !!r.nashNone; if(r.best != null) st.best = +r.best; if(r.joint) st.joint = [+r.joint[0], +r.joint[1]]; paint(); }
    paint();
    return { el: host, get: get, set: set, reset: function(){ reset(); paint(); }, showKey: function(on){ st.key = on !== false; paint(); }, lock: function(){ opts.readonly = true; paint(); } };
  }

  root.ApMicroMatrix = { TASKS: TASKS, payoffs: payoffs, best: best, dominant: dominant, nash: nash, joint: joint, comparisons: comparisons, keyResponse: keyResponse,
    check: check, grade: grade, html: html, mount: mount, cellName: cellName };
})(typeof window !== 'undefined' ? window : globalThis);
