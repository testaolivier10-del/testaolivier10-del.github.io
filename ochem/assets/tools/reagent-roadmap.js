/* Reagent Roadmap — every interconversion in the course, as a map you can
   route across.

   Synthesis is where the reagent list stops being a list. A student can know
   that PCC stops at the aldehyde and that hydroboration is anti-Markovnikov
   and still have no idea how to get from propan-2-ol to propan-1-ol, because
   that question is about the SHAPE of the whole list — which groups connect
   to which, and through what. The notes on functional group interconversion
   say so directly: memorize it as a map, not as a list. This is the map.

   Three ways in:
     Route    pick a start and a target; get the shortest routes, step by
              step, with the reagents for each and what each step needs
     Reagent  pick or search a reagent; see everything it does in the course
     Groups   pick a functional group; see what it becomes, what makes it,
              and what does NOT work on it

   Nothing here is stored as an answer. Routes are searched over the graph in
   reagent-roadmap-data.js, and two rules keep that search honest:

   1. Substitution patterns. A route through an alkene has to be satisfiable
      by one alkene: tert-butyl alcohol dehydrates to an alkene with no H on
      one carbon, so it cannot then be taken on to an alkyne. See the data
      file for how edges say what they give and need.

   2. "Keep the skeleton" (the default) refuses any step that makes or breaks
      a C–C bond, because "1° alcohol → carboxylic acid" through a nitrile
      gives you an acid one carbon longer, which is a different question. The
      other setting allows them and labels every carbon it adds or cuts.

   The engine is exposed as window.OchemRoadmapEngine so that the tests can
   hold its routes to known chemistry without a browser. */
(function(){
  var D = window.OchemRoadmap;
  if(!D) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* ======================================================================
     The engine
     ====================================================================== */

  function patternsOf(nodeId){
    var n = D.node(nodeId);
    if(!n || !n.patterns) return ['*'];
    return Object.keys(D.PATTERNS[n.patterns].set);
  }

  function union(a, b){
    var out = a.slice();
    b.forEach(function(x){ if(out.indexOf(x) < 0) out.push(x); });
    return out;
  }
  function inter(a, b){ return a.filter(function(x){ return b.indexOf(x) >= 0; }); }

  /* What an edge can produce, given the patterns its start might have. */
  function through(e, inSet){
    var ok = e.needs ? inter(inSet, e.needs) : inSet.slice();
    if(!ok.length) return [];
    if(e.map){
      var o = [];
      ok.forEach(function(p){ o = union(o, e.map[p] || []); });
      return o;
    }
    // `keep`: the pattern walks through unchanged (an aldehyde oxidized to
    // an acid is still ArC(=O)– if it started as one).
    if(e.keep) return inter(ok, patternsOf(e.to));
    return e.gives ? e.gives.slice() : patternsOf(e.to);
  }

  var OUT = {}, IN = {};
  D.NODES.forEach(function(n){ OUT[n.id] = []; IN[n.id] = []; });
  D.EDGES.forEach(function(e){ OUT[e.from].push(e); IN[e.to].push(e); });

  function allowed(e, opts, target){
    if(e.from === e.to) return false;
    if(opts.skeleton && e.cc) return false;
    // A step that fastens a second molecule on can only end a route: after
    // it, "the product" is two things and the next step would not say which.
    if(e.final && e.to !== target) return false;
    return true;
  }

  /* Hops from each node to the target, ignoring patterns — a lower bound
     that lets the search skip everything that cannot arrive in time. */
  function distancesTo(target, opts){
    var dist = {}; dist[target] = 0;
    var queue = [target];
    while(queue.length){
      var v = queue.shift();
      IN[v].forEach(function(e){
        if(!allowed(e, opts, target)) return;
        if(dist[e.from] === undefined){ dist[e.from] = dist[v] + 1; queue.push(e.from); }
      });
    }
    return dist;
  }

  /* Every simple path of exactly `len` hops from `from` to `to` whose
     patterns can be satisfied, capped so a well-connected pair cannot
     produce a wall of near-identical routes. */
  function pathsOfLength(from, to, len, opts, dist, cap){
    var found = [];
    var seen = {}; seen[from] = true;
    function go(node, set, nodes){
      if(found.length >= cap) return;
      if(node === to){ if(nodes.length - 1 === len) found.push(nodes.slice()); return; }
      if(nodes.length - 1 >= len) return;
      var byNext = {};
      OUT[node].forEach(function(e){
        if(!allowed(e, opts, to)) return;
        (byNext[e.to] = byNext[e.to] || []).push(e);
      });
      Object.keys(byNext).forEach(function(v){
        if(seen[v]) return;
        if(dist[v] === undefined || nodes.length + dist[v] > len) return;
        var next = [];
        byNext[v].forEach(function(e){ next = union(next, through(e, set)); });
        if(!next.length) return;
        seen[v] = true; nodes.push(v);
        go(v, next, nodes);
        nodes.pop(); seen[v] = false;
      });
    }
    go(from, patternsOf(from), [from]);
    return found;
  }

  /* Turns a path of groups into a route: at each hop, the reactions that
     actually work given what came before AND what has to come after, and at
     each patterned group, which patterns the route relies on. A reaction that
     reaches the right group but in a form the next step cannot use is left
     out rather than offered as an alternative that dead-ends. */
  function refine(nodes, opts){
    var k = nodes.length - 1, target = nodes[k];
    var cand = [], R = [patternsOf(nodes[0])];
    for(var i = 0; i < k; i++){
      cand[i] = OUT[nodes[i]].filter(function(e){ return e.to === nodes[i + 1] && allowed(e, opts, target); });
      var nx = [];
      cand[i].forEach(function(e){ nx = union(nx, through(e, R[i])); });
      R[i + 1] = nx;
    }
    var N = []; N[k] = R[k];
    for(i = k - 1; i >= 0; i--){
      N[i] = R[i].filter(function(p){
        return cand[i].some(function(e){ return inter(through(e, [p]), N[i + 1]).length > 0; });
      });
    }
    var F = [inter(R[0], N[0])], hops = [];
    for(i = 0; i < k; i++){
      var ok = cand[i].filter(function(e){ return inter(through(e, F[i]), N[i + 1]).length > 0; });
      if(!ok.length) return null;
      var nxt = [];
      ok.forEach(function(e){ nxt = union(nxt, inter(through(e, F[i]), N[i + 1])); });
      F[i + 1] = nxt;
      hops.push(ok);
    }
    return { nodes: nodes, hops: hops, states: F };
  }

  /* The shortest routes, and the ones a single step longer — those are often
     the ones worth knowing (the anti diol is one step longer than the syn). */
  function routes(from, to, opts){
    opts = opts || {};
    var res = { shortest: [], longer: [], length: 0 };
    if(!from || !to || from === to) return res;
    var dist = distancesTo(to, opts);
    if(dist[from] === undefined) return res;
    var MAX = 7;
    for(var len = dist[from]; len <= MAX; len++){
      var ps = pathsOfLength(from, to, len, opts, dist, 40).map(function(p){ return refine(p, opts); }).filter(Boolean);
      if(ps.length){
        res.length = len;
        res.shortest = rank(ps);
        if(len + 1 <= MAX){
          res.longer = rank(pathsOfLength(from, to, len + 1, opts, dist, 40)
            .map(function(p){ return refine(p, opts); }).filter(Boolean));
        }
        return res;
      }
    }
    return res;
  }

  /* Fewer carbon-changing steps first, then fewer steps that need a special
     substrate, then the order the data lists things in (stable). */
  function rank(list){
    function cost(r){
      var c = 0;
      r.hops.forEach(function(h){
        if(h.every(function(e){ return e.cc; })) c += 10;
        if(h.every(function(e){ return e.needs || e.sub; })) c += 1;
      });
      return c;
    }
    return list.map(function(r, i){ return { r: r, c: cost(r), i: i }; })
      .sort(function(a, b){ return a.c - b.c || a.i - b.i; })
      .map(function(x){ return x.r; });
  }

  function edgesForReagent(key){
    return D.EDGES.filter(function(e){ return e.keys.indexOf(key) >= 0; });
  }

  /* Search that forgives how people type formulas: "nabh4" finds NaBH₄,
     "h2cro4" finds Jones, "na/nh3" finds the dissolving-metal entry. */
  var SUB = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','⁺':'+','⁻':'-','′':'\'' };
  function norm(s){
    return String(s).replace(/[₀-₉⁺⁻′]/g, function(c){ return SUB[c]; })
      .toLowerCase().replace(/[\s·\-–—\/(),.]/g, '');
  }
  function searchReagents(q){
    var n = norm(q || '');
    if(!n) return D.REAGENTS.slice();
    return D.REAGENTS.filter(function(r){
      return [r.name, r.full, r.id].concat(r.aka || []).some(function(s){ return norm(s).indexOf(n) >= 0; });
    });
  }

  window.OchemRoadmapEngine = {
    routes: routes, through: through, patternsOf: patternsOf,
    edgesFrom: function(id){ return OUT[id] ? OUT[id].slice() : []; },
    edgesInto: function(id){ return IN[id] ? IN[id].slice() : []; },
    edgesForReagent: edgesForReagent, searchReagents: searchReagents, norm: norm
  };

  /* ======================================================================
     Rendering
     ====================================================================== */

  var root = document.getElementById('rrRoot');
  if(!root) return;

  function nodeName(id){ var n = D.node(id); return n ? n.name : id; }
  function nodeFull(id){ var n = D.node(id); return n ? n.name + ' (' + n.short + ')' : id; }

  function rxHtml(e){
    if(e.rx.length === 1) return esc(e.rx[0]);
    return e.rx.map(function(s, i){ return '<span class="rr-rx__n">' + (i + 1) + '.</span> ' + esc(s); }).join(' ');
  }
  function rxText(e){
    return e.rx.length === 1 ? e.rx[0] : e.rx.map(function(s, i){ return (i + 1) + '. ' + s; }).join('  ');
  }

  var KIND = {
    up:     { cls: 'up',     text: '↑ oxidation' },
    down:   { cls: 'down',   text: '↓ reduction' },
    across: { cls: 'across', text: '→ no redox' },
    join:   { cls: 'join',   text: '+ joins a second molecule' },
    ring:   { cls: 'across', text: 'on the ring' },
    cc:     null
  };
  function tags(e){
    var out = '';
    var k = KIND[e.kind];
    if(k) out += '<span class="rr-tag rr-tag--' + k.cls + '">' + k.text + '</span>';
    if(e.cc) out += '<span class="rr-tag rr-tag--cc">C–C: ' + esc(e.cc) + '</span>';
    return out;
  }

  function topicLink(id){
    var C = window.OchemCurriculum;
    var t = C && C.findTopic ? C.findTopic(id) : null;
    var title = t ? t.title : id;
    return '<a class="rr-learn" href="../notes/' + esc(id) + '.html">Read: ' + esc(title) + ' &rarr;</a>';
  }

  function example(e){
    if(!e.ex) return '';
    return '<div class="rr-ex"><span class="rr-ex__k">e.g.</span> ' +
      '<span class="rr-ex__f">' + esc(e.ex[0]) + '</span>' +
      ' <span class="rr-ex__arrow">' + (e.with ? '<small>' + esc(e.with) + '</small>' : '') + '&rarr;</span> ' +
      '<span class="rr-ex__f">' + esc(e.ex[1]) + '</span></div>';
  }

  function notes(e){
    var rows = [];
    if(e.sub) rows.push(['Needs', e.sub]);
    if(e.regio) rows.push(['Where', e.regio]);
    if(e.stereo) rows.push(['Stereo', e.stereo]);
    if(e.note) rows.push(['Note', e.note]);
    if(e.final) rows.push(['Mind', 'Your molecule becomes one half of the product; the other half comes from the reagent.']);
    if(!rows.length) return '';
    return '<dl class="rr-notes">' + rows.map(function(r){
      return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>';
    }).join('') + '</dl>';
  }

  /* One reaction. `head` says whether to show "from → to" (the lists that
     are not already organized by group need it). */
  function card(e, head){
    return '<article class="rr-card">' +
      (head ? '<div class="rr-card__route">' + esc(nodeName(e.from)) + ' <span aria-hidden="true">&rarr;</span><span class="sr-only"> to </span> ' +
        esc(e.spec ? nodeName(e.to) + ' — ' + e.spec : nodeName(e.to)) + '</div>' : '') +
      '<div class="rr-card__top"><span class="rr-card__name">' + esc(e.name) + '</span>' + tags(e) + '</div>' +
      '<div class="rr-rx">' + rxHtml(e) + '</div>' +
      example(e) + notes(e) + topicLink(e.topic) +
    '</article>';
  }

  /* ---- The ladder map --------------------------------------------------- */

  function mapHtml(marks, pressed){
    return '<div class="rr-map">' + D.BANDS.map(function(b){
      var nodes = D.NODES.filter(function(n){ return n.band === b.id; });
      return '<div class="rr-band' + (b.id === 'ar' ? ' rr-band--ring' : '') + '">' +
        '<div class="rr-band__k"><b>' + esc(b.title) + '</b><small>' + esc(b.sub) + '</small></div>' +
        '<div class="rr-band__row">' + nodes.map(function(n){
          var m = marks && marks[n.id];
          var cls = 'rr-node' + (m ? ' ' + m.cls : '') + (marks && !m ? ' is-dim' : '');
          return '<button type="button" class="' + cls + '" data-node="' + esc(n.id) + '"' +
            (pressed !== undefined ? ' aria-pressed="' + (pressed === n.id) + '"' : '') + '>' +
            (m && m.badge !== undefined ? '<span class="rr-node__n" aria-hidden="true">' + m.badge + '</span>' : '') +
            '<span class="rr-node__name">' + esc(n.name) + '</span>' +
            '<span class="rr-node__f">' + esc(n.short) + '</span>' +
            (m && m.label ? '<span class="sr-only"> (' + esc(m.label) + ')</span>' : '') +
          '</button>';
        }).join('') + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* ---- State ------------------------------------------------------------- */

  var S = {
    mode: 'route',
    from: 'alcohol-2', to: 'alcohol-1', skeleton: true, pick: 0,
    reagent: 'NaBH4', q: '',
    group: 'alkene'
  };

  function sync(){
    if(!window.OchemToolState) return;
    window.OchemToolState.write({
      m: S.mode === 'route' ? null : S.mode,
      f: S.mode === 'route' ? S.from : null,
      t: S.mode === 'route' ? S.to : null,
      c: S.mode === 'route' && !S.skeleton ? 1 : null,
      r: S.mode === 'reagent' ? S.reagent : null,
      g: S.mode === 'groups' ? S.group : null
    });
  }

  function options(sel){
    return D.BANDS.map(function(b){
      return '<optgroup label="' + esc(b.title) + '">' +
        D.NODES.filter(function(n){ return n.band === b.id; }).map(function(n){
          return '<option value="' + esc(n.id) + '"' + (n.id === sel ? ' selected' : '') + '>' +
            esc(n.name) + ' — ' + esc(n.short) + '</option>';
        }).join('') + '</optgroup>';
    }).join('');
  }

  root.innerHTML =
    '<div class="tpanel rr-modes">' +
      '<div class="tseg" id="rrMode" role="group" aria-label="What to do">' +
        '<button type="button" data-mode="route" aria-pressed="true" class="on">Route</button>' +
        '<button type="button" data-mode="reagent" aria-pressed="false">Reagent</button>' +
        '<button type="button" data-mode="groups" aria-pressed="false">Groups</button>' +
      '</div>' +
      '<p class="tmuted rr-modes__say" id="rrModeSay"></p>' +
    '</div>' +
    '<div id="rrRoute"></div>' +
    '<div id="rrReagent" hidden></div>' +
    '<div id="rrGroups" hidden></div>';

  var MODE_SAY = {
    route: 'Pick where you start and where you need to end up. Height on the map is oxidation level: climbing needs an oxidant, falling a reductant, and moving sideways needs neither.',
    reagent: 'Everything one reagent does in this course, and what it leaves alone.',
    groups: 'Pick a functional group: what it becomes, what makes it, and what does not work on it.'
  };

  var elRoute = document.getElementById('rrRoute');
  var elReagent = document.getElementById('rrReagent');
  var elGroups = document.getElementById('rrGroups');

  function setMode(m){
    S.mode = m;
    var seg = document.getElementById('rrMode');
    seg.querySelectorAll('button').forEach(function(b){
      var on = b.getAttribute('data-mode') === m;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    document.getElementById('rrModeSay').textContent = MODE_SAY[m];
    elRoute.hidden = m !== 'route';
    elReagent.hidden = m !== 'reagent';
    elGroups.hidden = m !== 'groups';
    if(m === 'route') renderRoute();
    if(m === 'reagent') renderReagent();
    if(m === 'groups') renderGroups();
    sync();
  }

  document.getElementById('rrMode').querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){ setMode(b.getAttribute('data-mode')); });
  });

  /* ---- Route ------------------------------------------------------------ */

  /* Where a route leans on a particular kind of alkene, alkyne, epoxide or
     ketone, say which — at the start ("start from"), in the middle ("only
     works through") and at the end ("you get"). Silent when any kind works. */
  function stateNote(r, i){
    var id = r.nodes[i], n = D.node(id);
    if(!n || !n.patterns) return '';
    var all = patternsOf(id), have = r.states[i];
    if(!have || !have.length || have.length === all.length) return '';
    var P = D.PATTERNS[n.patterns];
    var lead = i === 0 ? 'Start from ' : (i === r.nodes.length - 1 ? 'You end up with ' : 'This only works through ');
    return '<p class="rr-via">' + lead + esc(P.label) + ' ' +
      have.map(function(p){ return '<b>' + esc(P.set[p]) + '</b>'; }).join(' or ') + '.</p>';
  }

  function strip(r){
    return '<div class="rr-strip">' + r.nodes.map(function(id, i){
      return (i ? '<span class="rr-strip__arrow" aria-hidden="true">&rarr;</span>' : '') +
        '<span class="rr-strip__node">' + esc(nodeName(id)) + '</span>';
    }).join('') + '</div>';
  }

  function routeHtml(r, n, open){
    return '<div class="rr-route' + (open ? ' is-on' : '') + '">' +
      '<div class="rr-route__head">' +
        '<span class="rr-route__k">Route ' + n + '</span>' + strip(r) +
        '<button type="button" class="tchip tchip--mini rr-route__show" data-pick="' + (n - 1) + '" aria-pressed="' + open + '">' +
          (open ? 'On the map' : 'Show on map') + '</button>' +
      '</div>' +
      stateNote(r, 0) +
      '<ol class="rr-steps">' + r.hops.map(function(alts, i){
        var e = alts[0];
        return '<li class="rr-step">' +
          '<div class="rr-step__to">' + esc(nodeName(r.nodes[i])) + ' &rarr; <b>' + esc(nodeName(r.nodes[i + 1])) + '</b>' +
            (e.spec && alts.length === 1 ? ' <span class="tmuted">(' + esc(e.spec) + ')</span>' : '') + '</div>' +
          card(e, false) +
          (alts.length > 1 ? '<details class="rr-alts"><summary>' + (alts.length - 1) + ' other way' + (alts.length > 2 ? 's' : '') + ' to do this step</summary>' +
            alts.slice(1).map(function(a){ return card(a, false); }).join('') + '</details>' : '') +
          stateNote(r, i + 1) +
        '</li>';
      }).join('') + '</ol>' +
    '</div>';
  }

  function renderRoute(){
    var res = routes(S.from, S.to, { skeleton: S.skeleton });
    if(S.pick >= res.shortest.length) S.pick = 0;
    var picked = res.shortest[S.pick];

    var marks = null;
    if(picked){
      marks = {};
      picked.nodes.forEach(function(id, i){
        marks[id] = { cls: i === 0 ? 'is-start' : (i === picked.nodes.length - 1 ? 'is-end' : 'is-on'), badge: i === 0 ? 'A' : (i === picked.nodes.length - 1 ? 'B' : i),
                      label: i === 0 ? 'start' : (i === picked.nodes.length - 1 ? 'target' : 'step ' + i) };
      });
    } else {
      marks = {};
      marks[S.from] = { cls: 'is-start', badge: 'A', label: 'start' };
      if(S.to !== S.from) marks[S.to] = { cls: 'is-end', badge: 'B', label: 'target' };
    }

    var body;
    if(S.from === S.to){
      body = '<div class="tempty">Start and target are the same group. Pick two different ones.</div>';
    } else if(!res.shortest.length){
      var other = routes(S.from, S.to, { skeleton: !S.skeleton });
      body = '<div class="tnote tnote--warn"><span class="tnote__k">No route</span>' +
        (S.skeleton
          ? (other.shortest.length
              ? 'Not without making or breaking a C–C bond. The shortest route that does takes ' + other.length + ' step' + (other.length > 1 ? 's' : '') +
                ' — switch to <b>Allow C–C steps</b> to see it, and count the carbons.'
              : 'Nothing in this course gets from ' + esc(nodeName(S.from)) + ' to ' + esc(nodeName(S.to)) + '.')
          : 'Nothing in this course gets from ' + esc(nodeName(S.from)) + ' to ' + esc(nodeName(S.to)) + '.') +
        (D.node(S.to).band === 'ar' && D.node(S.from).band !== 'ar'
          ? ' The ring groups are reached from a benzene ring, not built from a chain.' : '') +
        '</div>';
    } else {
      body =
        '<p class="rr-found"><b>' + res.length + ' step' + (res.length > 1 ? 's' : '') + '</b> at the shortest' +
          (res.shortest.length > 1 ? ', ' + res.shortest.length + ' ways' : '') + '.' +
          (S.skeleton ? ' Same carbon skeleton throughout.' : ' Carbon-changing steps allowed — watch the C–C tags.') + '</p>' +
        res.shortest.slice(0, 4).map(function(r, i){ return routeHtml(r, i + 1, i === S.pick); }).join('') +
        (res.shortest.length > 4 ? '<p class="tmuted">…and ' + (res.shortest.length - 4) + ' more of the same length.</p>' : '') +
        (res.longer.length
          ? '<details class="rr-longer"><summary>One step longer (' + res.longer.length + (res.longer.length >= 40 ? '+' : '') + ')</summary>' +
              '<p class="tmuted">Often the one you actually want: a different reagent pair, a different stereochemical outcome, or a step you already know.</p>' +
              res.longer.slice(0, 4).map(function(r, i){ return routeHtml(r, res.shortest.length + i + 1, false); }).join('') +
            '</details>'
          : '');
    }

    elRoute.innerHTML =
      '<div class="tpanel">' +
        '<div class="rr-pick">' +
          '<div class="tfield"><label for="rrFrom">Start</label><select class="tselect" id="rrFrom">' + options(S.from) + '</select></div>' +
          '<button type="button" class="tchip rr-swap" id="rrSwap" aria-label="Swap start and target">&#8646;</button>' +
          '<div class="tfield"><label for="rrTo">Target</label><select class="tselect" id="rrTo">' + options(S.to) + '</select></div>' +
        '</div>' +
        '<div class="tseg rr-cc" id="rrCC" role="group" aria-label="Carbon skeleton">' +
          '<button type="button" data-cc="keep" aria-pressed="' + S.skeleton + '"' + (S.skeleton ? ' class="on"' : '') + '>Keep the skeleton</button>' +
          '<button type="button" data-cc="any" aria-pressed="' + !S.skeleton + '"' + (!S.skeleton ? ' class="on"' : '') + '>Allow C–C steps</button>' +
        '</div>' +
      '</div>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head rr-maphead"><span>The map</span><span class="rr-legend"><span class="rr-dot rr-dot--a">A</span> start <span class="rr-dot rr-dot--b">B</span> target — tap a group to make it the target</span></div>' +
        mapHtml(marks) +
      '</div>' +
      '<div aria-live="polite" id="rrRoutes">' + body + '</div>';

    document.getElementById('rrFrom').addEventListener('change', function(){ S.from = this.value; S.pick = 0; renderRoute(); sync(); });
    document.getElementById('rrTo').addEventListener('change', function(){ S.to = this.value; S.pick = 0; renderRoute(); sync(); });
    document.getElementById('rrSwap').addEventListener('click', function(){
      var t = S.from; S.from = S.to; S.to = t; S.pick = 0; renderRoute(); sync();
      document.getElementById('rrSwap').focus();
    });
    document.getElementById('rrCC').querySelectorAll('button').forEach(function(b){
      b.addEventListener('click', function(){
        S.skeleton = b.getAttribute('data-cc') === 'keep'; S.pick = 0; renderRoute(); sync();
        var again = document.getElementById('rrCC').querySelector('[data-cc="' + b.getAttribute('data-cc') + '"]');
        if(again) again.focus();
      });
    });
    elRoute.querySelectorAll('.rr-node').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-node');
        if(id === S.from) return;
        S.to = id; S.pick = 0; renderRoute(); sync();
        var again = elRoute.querySelector('.rr-node[data-node="' + id + '"]');
        if(again) again.focus();
      });
    });
    elRoute.querySelectorAll('.rr-route__show').forEach(function(b){
      b.addEventListener('click', function(){
        var n = parseInt(b.getAttribute('data-pick'), 10);
        if(n >= res.shortest.length) return;
        S.pick = n; renderRoute();
        var again = elRoute.querySelector('.rr-route__show[data-pick="' + n + '"]');
        if(again) again.focus();
      });
    });
  }

  /* ---- Reagent ------------------------------------------------------------ */

  function reagentList(){
    var list = searchReagents(S.q);
    if(!list.length) return '<p class="tmuted">No reagent in the course matches that.</p>';
    var fams = [];
    list.forEach(function(r){ if(fams.indexOf(r.fam) < 0) fams.push(r.fam); });
    return fams.map(function(f){
      return '<div class="rr-fam"><span class="rr-fam__k">' + esc(f) + '</span><div class="tchips">' +
        list.filter(function(r){ return r.fam === f; }).map(function(r){
          return '<button type="button" class="tchip tchip--mini rr-reagent' + (r.id === S.reagent ? ' on' : '') + '" data-r="' + esc(r.id) + '" aria-pressed="' + (r.id === S.reagent) + '">' + esc(r.name) + '</button>';
        }).join('') + '</div></div>';
    }).join('');
  }

  function reagentDetail(){
    var r = D.reagent(S.reagent);
    if(!r) return '';
    var es = edgesForReagent(r.id);
    return '<div class="tpanel">' +
      '<div class="rr-reagent__head"><h2 class="rr-reagent__name">' + esc(r.name) + '</h2><span class="tmuted">' + esc(r.full) + '</span></div>' +
      '<p class="rr-reagent__does">' + esc(r.does) + '</p>' +
      '<div class="tpanel__head"><span>In this course (' + es.length + ')</span></div>' +
      '<div class="rr-cards">' + es.map(function(e){ return card(e, true); }).join('') + '</div>' +
    '</div>';
  }

  function bindReagentChips(){
    elReagent.querySelectorAll('.rr-reagent').forEach(function(b){
      b.addEventListener('click', function(){
        S.reagent = b.getAttribute('data-r');
        document.getElementById('rrReagentList').innerHTML = reagentList();
        document.getElementById('rrReagentOut').innerHTML = reagentDetail();
        bindReagentChips();
        sync();
        var again = elReagent.querySelector('.rr-reagent[data-r="' + S.reagent + '"]');
        if(again) again.focus();
      });
    });
  }

  function renderReagent(){
    elReagent.innerHTML =
      '<div class="tpanel">' +
        '<div class="tfield"><label for="rrSearch">Find a reagent</label>' +
          '<input type="search" class="tselect rr-search" id="rrSearch" placeholder="NaBH4, PCC, Grignard, ozone…" autocomplete="off" spellcheck="false" value="' + esc(S.q) + '"></div>' +
        '<div id="rrReagentList">' + reagentList() + '</div>' +
      '</div>' +
      '<div aria-live="polite" id="rrReagentOut">' + reagentDetail() + '</div>';

    var input = document.getElementById('rrSearch');
    input.addEventListener('input', function(){
      S.q = input.value;
      var list = searchReagents(S.q);
      // Typing a name that picks out one reagent is the same as clicking it.
      if(list.length && list.every(function(r){ return r.id !== S.reagent; })) S.reagent = list[0].id;
      document.getElementById('rrReagentList').innerHTML = reagentList();
      document.getElementById('rrReagentOut').innerHTML = reagentDetail();
      bindReagentChips();
      sync();
    });
    bindReagentChips();
  }

  /* ---- Groups ------------------------------------------------------------- */

  function groupBlock(title, list, headFn){
    if(!list.length) return '';
    return '<div class="tpanel"><div class="tpanel__head"><span>' + title + ' (' + list.length + ')</span></div>' +
      '<div class="rr-cards">' + list.map(function(e){
        return '<div class="rr-grouped"><div class="rr-card__route">' + headFn(e) + '</div>' + card(e, false) + '</div>';
      }).join('') + '</div></div>';
  }

  function renderGroups(){
    var n = D.node(S.group) || D.NODES[0];
    var out = OUT[n.id], into = IN[n.id].filter(function(e){ return e.from !== e.to; });
    var P = n.patterns ? D.PATTERNS[n.patterns] : null;

    elGroups.innerHTML =
      '<div class="tpanel">' +
        '<div class="tpanel__head"><span>Pick a group</span></div>' +
        mapHtml(null, n.id) +
      '</div>' +
      '<div aria-live="polite" id="rrGroupOut">' +
        '<div class="tpanel rr-group">' +
          '<h2 class="rr-group__name">' + esc(n.name) + ' <span class="rr-group__f">' + esc(n.short) + '</span></h2>' +
          (P ? '<p class="tmuted">The map tracks which kind: ' + Object.keys(P.set).map(function(k){ return esc(P.set[k]); }).join(', ') +
                '. Each reaction says which ones it needs or makes.</p>' : '') +
          '<div class="trow">' +
            '<button type="button" class="tchip" id="rrRouteFrom">Route from here</button>' +
            '<button type="button" class="tchip" id="rrRouteTo">Route to here</button>' +
            topicLink(n.topic) +
          '</div>' +
        '</div>' +
        (n.dead && n.dead.length
          ? '<div class="tpanel"><div class="tpanel__head"><span>What does not work</span></div>' +
              n.dead.map(function(d){ return '<div class="tnote tnote--bad"><span class="tnote__k">' + esc(d[0]) + '</span>' + esc(d[1]) + '</div>'; }).join('') +
            '</div>'
          : '') +
        groupBlock('What it becomes', out, function(e){
          return '&rarr; <b>' + esc(nodeName(e.to)) + '</b>' + (e.spec ? ' <span class="tmuted">(' + esc(e.spec) + ')</span>' : '');
        }) +
        groupBlock('What makes it', into, function(e){
          return 'from <b>' + esc(nodeName(e.from)) + '</b>';
        }) +
      '</div>';

    elGroups.querySelectorAll('.rr-node').forEach(function(b){
      b.addEventListener('click', function(){
        S.group = b.getAttribute('data-node'); renderGroups(); sync();
        var again = elGroups.querySelector('.rr-node[data-node="' + S.group + '"]');
        if(again) again.focus();
      });
    });
    document.getElementById('rrRouteFrom').addEventListener('click', function(){
      S.from = n.id; if(S.to === n.id) S.to = S.from === 'alcohol-1' ? 'aldehyde' : 'alcohol-1'; S.pick = 0; setMode('route');
    });
    document.getElementById('rrRouteTo').addEventListener('click', function(){
      S.to = n.id; if(S.from === n.id) S.from = S.to === 'alkene' ? 'alcohol-2' : 'alkene'; S.pick = 0; setMode('route');
    });
  }

  /* ---- Start ---------------------------------------------------------------- */

  if(window.OchemToolState){
    var q = window.OchemToolState.read();
    if(q.f && D.node(q.f)) S.from = q.f;
    if(q.t && D.node(q.t)) S.to = q.t;
    if(q.c === '1') S.skeleton = false;
    if(q.r && D.reagent(q.r)) S.reagent = q.r;
    if(q.g && D.node(q.g)) S.group = q.g;
    setMode(q.m === 'reagent' || q.m === 'groups' ? q.m : 'route');
  } else {
    setMode('route');
  }

  /* ======================================================================
     Check yourself
     ======================================================================

     Two kinds of question, both built from the edges rather than written by
     hand, so they cannot drift from the map above.

       "Which reagents take X to Y?"   the wrong options are the other things
                                       X does — so they are all plausible, and
                                       each explanation says what it would
                                       have made instead
       "What does X give with R?"      the wrong options are the other places
                                       X goes

     Exactly one option may be right, and that is enforced here rather than
     hoped for: an option is only a distractor if no reaction from X that
     shares a reagent with it reaches the answer. Where two reactions share
     a start and an end but not an outcome (Lindlar and Na/NH₃ both make an
     alkene), the question names the outcome, and the pair becomes the
     question. */

  // "Alkene" on a chip, "an alkene" mid-sentence; "1,2-diol" and "2° alcohol" as they are.
  function lc(s){ return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function sharesKey(a, b){ return a.keys.some(function(k){ return b.keys.indexOf(k) >= 0; }); }
  function label(e){ return nodeName(e.to) + (e.spec ? ' — ' + e.spec : ''); }
  function sameOutcome(a, b){ return a.to === b.to && (a.spec || '') === (b.spec || ''); }

  function exampleLine(e){
    return e.ex ? '<span class="tformula">' + esc(e.ex[0]) + '</span>' + (e.with ? ' + <span class="tformula">' + esc(e.with) + '</span>' : '') : '';
  }

  function whyLine(e){
    return [e.regio, e.stereo, e.note].filter(Boolean).slice(0, 2).map(esc).join(' ');
  }

  function askReagent(e){
    var from = e.from;
    var pool = OUT[from].filter(function(d){
      if(d === e || d.from === d.to) return false;
      if(sameOutcome(d, e)) return false;                       // also right
      if(rxText(d) === rxText(e)) return false;
      // Would this reagent ALSO make the answer? Then it is not wrong.
      return !OUT[from].some(function(x){ return sameOutcome(x, e) && sharesKey(x, d); });
    });
    // Shuffled first, then thinned so no two wrong options share a reagent:
    // three Grignard variants side by side teach nothing about Grignards.
    if(window.OchemToolQuiz) pool = window.OchemToolQuiz.shuffle(pool);
    var distract = [];
    pool.forEach(function(d){
      if(distract.length >= 3) return;
      if(distract.some(function(x){ return sharesKey(x, d) || rxText(x) === rxText(d); })) return;
      distract.push(d);
    });
    if(distract.length < 2) return null;

    return {
      id: 'rx:' + e.id,
      prompt: 'Which reagents take <b>' + esc(lc(nodeName(from))) + '</b> to <b>' + esc(lc(label(e))) + '</b>?' +
        (e.ex ? '<br><span class="tmuted">e.g. <span class="tformula">' + esc(e.ex[0]) + '</span> &rarr; <span class="tformula">' + esc(e.ex[1]) + '</span></span>' : ''),
      options: [{ id: e.id, label: '<span class="rr-rx">' + rxHtml(e) + '</span>', correct: true }].concat(
        distract.map(function(d){ return { id: d.id, label: '<span class="rr-rx">' + rxHtml(d) + '</span>', correct: false }; })),
      explain: '<b>' + esc(e.name) + '.</b> ' + whyLine(e) +
        '<br>' + distract.map(function(d){
          return esc(rxText(d)) + ' would give ' + esc(lc(label(d))) + ' instead.';
        }).join(' ')
    };
  }

  function askProduct(e){
    var from = e.from;
    // The reagent has to mean one thing from here, or the question is unfair.
    if(OUT[from].some(function(x){ return x !== e && sharesKey(x, e) && !sameOutcome(x, e); })) return null;
    if(!e.ex) return null;
    var seen = {}, distract = [];
    OUT[from].forEach(function(d){
      if(d.from === d.to || sameOutcome(d, e)) return;
      var l = label(d);
      if(seen[l]) return;
      // A place this reagent can also reach from here is not a wrong answer.
      if(OUT[from].some(function(x){ return sameOutcome(x, d) && sharesKey(x, e); })) return;
      seen[l] = true;
      distract.push(d);
    });
    if(distract.length < 2) return null;
    distract = window.OchemToolQuiz ? window.OchemToolQuiz.shuffle(distract).slice(0, 3) : distract.slice(0, 3);

    return {
      id: 'pr:' + e.id,
      prompt: exampleLine(e) + ' treated with <span class="rr-rx">' + rxHtml(e) + '</span> gives…',
      options: [{ id: e.id, label: esc(label(e)), correct: true }].concat(
        distract.map(function(d){ return { id: d.id, label: esc(label(d)), correct: false }; })),
      explain: '<b>' + esc(label(e)) + '</b>: <span class="tformula">' + esc(e.ex[1]) + '</span>. ' +
        esc(e.name) + '. ' + whyLine(e)
    };
  }

  if(window.OchemToolQuiz){
    var askable = D.EDGES.filter(function(e){ return e.from !== e.to; });
    window.OchemToolQuiz.mount(document.getElementById('tool-quiz'), {
      slug: 'reagent-roadmap',
      rounds: 6,
      intro: 'Name the reagent for a step, or the product of one — the pairs the course says exams are built on.',
      make: function(recent){
        var e = askable[Math.floor(Math.random() * askable.length)];
        if(recent.some(function(id){ return id.slice(3) === e.id; })) return null;
        return Math.random() < 0.5 ? askReagent(e) : askProduct(e);
      }
    });
  }
})();
