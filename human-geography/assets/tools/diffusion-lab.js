/* Diffusion lab page (docs/aphug-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T4). Mounts into #app with ApHugTools; the model is
   ApHugMath.diffusionLab (human-geography/assets/tools/math/diffusion-lab.js),
   the content human-geography/data/tools/diffusion-lab.json (served filtered as
   assets/tool-data/diffusion-lab.json). The frame is ApHugTools.modes
   (Explore, then Test yourself) on the Tool Studio.

   Explore: Country A (an invented country) and its 36 places, drawn at the
   page's own pixel size so every word stays legible at 360 px. Two scenes:
     Diffusion  a trait spreads from a hearth in steps: relocation,
                contagious, hierarchical, stimulus, or a real mix; Play
                animates the steps, the Step slider scrubs them
     Migration  push and pull, an intervening obstacle, an intervening
                opportunity, step migration, chain migration, and
                Ravenstein's laws, each as an animated sequence of moves
   Words on the map are short tags (Hearth, From, To, 1, 2, 3); everything
   else is in the caption, the legend under the map and Why.
   Test yourself: ApHugTools.drill over the model's generate(): read a map
   (hearth, type, relocation or expansion, a real case), mixed types,
   migration factors, kinds of migration, and Ravenstein from an invented
   survey; every wrong answer names the slip. */
(function(){
  'use strict';
  var T = window.ApHugTools, M = window.ApHugMath;
  if(!T || !M || !M.diffusionLab || M.diffusionLab.stub) return;
  var D = M.diffusionLab, esc = T.esc, BOUNDS = { W: 600, H: 420 };
  function n1(v){ return Math.round(v * 10) / 10; }
  function phone(){ return (window.innerWidth || 1280) <= 640; }

  /* ------------------------------------------------------------ drawing */
  /* A frame for Country A inside W x H: P(x, y) gives page pixels; k is the
     scale. Country A spans x 50-560, y 20-370 in its own pixels. */
  function fit(W, H, pad){
    pad = pad == null ? 10 : pad;
    BOUNDS = { W: W, H: H };
    var k = Math.min((W - 2 * pad) / 510, (H - 2 * pad) / 350), ox = (W - 510 * k) / 2 - 50 * k, oy = (H - 350 * k) / 2 - 20 * k;
    return { k: k, P: function(x, y){ return [n1(ox + x * k), n1(oy + y * k)]; } };
  }
  function country(F){
    return Object.keys(D.POLY).map(function(id){
      return '<path class="dl-prov" d="M' + D.POLY[id].map(function(q){ var p = F.P(q[0], q[1]); return p[0] + ' ' + p[1]; }).join('L') + 'Z"/>';
    }).join('');
  }
  var RADIUS = { 1: 7.5, 2: 6, 3: 4.6, 4: 3.3 };
  function dot(F, pl, cls, changed){
    var p = F.P(pl.x, pl.y), r = RADIUS[pl.rank] * Math.max(0.85, Math.min(1.25, F.k * 1.1));
    if(changed) return '<path class="dl-pl ' + cls + ' dl-chg" d="M' + p[0] + ' ' + n1(p[1] - r * 1.35) + 'L' + n1(p[0] + r * 1.35) + ' ' + p[1] + 'L' + p[0] + ' ' + n1(p[1] + r * 1.35) + 'L' + n1(p[0] - r * 1.35) + ' ' + p[1] + 'Z"/>';
    if(pl.rank === 1) return '<rect class="dl-pl ' + cls + '" x="' + n1(p[0] - r) + '" y="' + n1(p[1] - r) + '" width="' + n1(2 * r) + '" height="' + n1(2 * r) + '" rx="2"/>';
    return '<circle class="dl-pl ' + cls + '" cx="' + p[0] + '" cy="' + p[1] + '" r="' + n1(r) + '"/>';
  }
  function arrow(F, a, b, o){
    o = o || {};
    var p = Array.isArray(a) ? F.P(a[0], a[1]) : a, q = Array.isArray(b) ? F.P(b[0], b[1]) : b;
    var dx = q[0] - p[0], dy = q[1] - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
    var s = o.gap0 == null ? 9 : o.gap0, e = o.gap1 == null ? 11 : o.gap1, f = o.frac == null ? 1 : o.frac;
    var x0 = p[0] + ux * s, y0 = p[1] + uy * s, x1 = p[0] + ux * (s + (L - s - e) * f), y1 = p[1] + uy * (s + (L - s - e) * f);
    // A gentle bend, so two arrows between the same places never sit on each other.
    var bend = o.bend || 0, mx = (x0 + x1) / 2 - uy * bend, my = (y0 + y1) / 2 + ux * bend;
    var w = o.w || 2.6, hl = 7 + w * 1.4, ang = Math.atan2(y1 - my, x1 - mx);
    var head = 'M' + n1(x1) + ' ' + n1(y1) + 'L' + n1(x1 - hl * Math.cos(ang - 0.42)) + ' ' + n1(y1 - hl * Math.sin(ang - 0.42)) + 'L' + n1(x1 - hl * Math.cos(ang + 0.42)) + ' ' + n1(y1 - hl * Math.sin(ang + 0.42)) + 'Z';
    return '<g class="dl-arrow ' + (o.cls || '') + '"><path class="dl-arr-l' + (o.dashed ? ' is-dashed' : '') + '" d="M' + n1(x0) + ' ' + n1(y0) + 'Q' + n1(mx) + ' ' + n1(my) + ' ' + n1(x1) + ' ' + n1(y1) + '" style="stroke-width:' + n1(w) + 'px"/>' + (f >= 0.999 ? '<path class="dl-arr-h" d="' + head + '"/>' : '') + '</g>';
  }
  function tag(p, text, cls, where){
    // A short tag in a pill, placed above (default), below, left or right of its point.
    var w = text.length * 7.6 + 14, h = 22, x = p[0], y = p[1];
    var dx = where === 'right' ? w / 2 + 10 : where === 'left' ? -w / 2 - 10 : 0, dy = where === 'below' ? 22 : where === 'right' || where === 'left' ? 0 : -22;
    // Never past the picture's edge.
    var cx = Math.max(w / 2 + 3, Math.min(BOUNDS.W - w / 2 - 3, x + dx)), cy = Math.max(h / 2 + 3, Math.min(BOUNDS.H - h / 2 - 3, y + dy));
    dx = cx - x; dy = cy - y;
    return '<g class="dl-tag ' + (cls || '') + '"><rect x="' + n1(x + dx - w / 2) + '" y="' + n1(y + dy - h / 2) + '" width="' + n1(w) + '" height="' + h + '" rx="11"/><text x="' + n1(x + dx) + '" y="' + n1(y + dy + 4.5) + '" text-anchor="middle">' + esc(text) + '</text></g>';
  }
  function numTag(p, n, cls){ return '<g class="dl-num ' + (cls || '') + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="12"/><text x="' + p[0] + '" y="' + n1(p[1] + 5) + '" text-anchor="middle">' + n + '</text></g>'; }
  function letter(F, id, L){
    var pl = D.BY[id], p = F.P(pl.x, pl.y);
    var left = p[0] + 24 > BOUNDS.W;
    return '<text class="dl-letter" x="' + n1(left ? p[0] - 9 : p[0] + 9) + '" y="' + n1(p[1] - 6 < 16 ? p[1] + 18 : p[1] - 6) + '"' + (left ? ' text-anchor="end"' : '') + '>' + L + '</text>';
  }
  function mountains(F, x, y){
    var out = '';
    for(var i = -2; i <= 2; i++){ var p = F.P(x + i * 14, y + Math.abs(i) * 6); out += '<path class="dl-mtn" d="M' + n1(p[0] - 9) + ' ' + n1(p[1] + 7) + 'L' + p[0] + ' ' + n1(p[1] - 9) + 'L' + n1(p[0] + 9) + ' ' + n1(p[1] + 7) + 'Z"/>'; }
    return out;
  }
  function stepLegend(last, o){
    o = o || {};
    var items = [];
    for(var s = 1; s <= last; s++) items.push('<li><span class="dl-sw dl-s' + s + '" aria-hidden="true"></span>Step ' + s + (s === 1 ? ' (hearth)' : '') + '</li>');
    items.push('<li><span class="dl-sw dl-off" aria-hidden="true"></span>Not yet</li>');
    if(o.changed) items.push('<li><span class="dl-sw dl-diam" aria-hidden="true"></span>Took the idea, changed it</li>');
    if(o.arrows) items.push('<li><span class="dl-sw dl-ln" aria-hidden="true"></span>People moving</li>');
    return '<ul class="dl-legend" aria-label="Legend">' + items.join('') + '<li class="dl-sizes"><span class="dl-sz r1" aria-hidden="true"></span>Capital <span class="dl-sz r2" aria-hidden="true"></span>Large city <span class="dl-sz r3" aria-hidden="true"></span>Town <span class="dl-sz r4" aria-hidden="true"></span>Village</li></ul>';
  }

  /* A spread on the map, shown up to step `upto`. */
  function spreadSvg(W, H, sp, upto, o){
    o = o || {};
    var F = fit(W, H, o.pad), out = [country(F)];
    var moving = o.moving || 0; // 0..1 along each relocation arrow while it animates
    sp.arrows.forEach(function(a, i){
      if(upto >= 2 || moving) out.push(arrow(F, [D.BY[a[0]].x, D.BY[a[0]].y], [D.BY[a[1]].x, D.BY[a[1]].y], { w: 2.6, bend: i % 2 ? -26 : 26, frac: upto >= 2 ? 1 : moving, cls: 'is-move' }));
    });
    D.PLACES.slice().sort(function(a, b){ return b.rank - a.rank; }).forEach(function(pl){
      var s = sp.steps[pl.id], on = s && s <= upto;
      out.push(dot(F, pl, on ? 'dl-on dl-s' + s : 'dl-off', on && sp.changed[pl.id]));
    });
    var hp = D.BY[sp.hearth], hpt = F.P(hp.x, hp.y);
    // Explore marks the hearth; a drill never does (finding it is a step).
    if(o.labelHearth) out.push('<circle class="dl-hearth" cx="' + hpt[0] + '" cy="' + hpt[1] + '" r="' + n1(RADIUS[hp.rank] + 6) + '"/>', tag(hpt, 'Hearth', 'is-hearth', hp.y < 70 ? 'below' : 'above'));
    if(o.letters) Object.keys(o.letters).forEach(function(L){ out.push(letter(F, o.letters[L], L)); });
    return out.join('');
  }

  /* -------------------------------------------------- migration scenes */
  var C = D.CENTER;
  function at(id){ var p = D.BY[id]; return [p.x, p.y]; }
  var SCENES = {
    pushpull: { label: 'Push and pull', last: 3,
      cap: ['Kofi lives in a village in the Western Uplands. The sawmill there closed: a push factor.', 'In the capital, factories are hiring at good pay: a pull factor.', 'Kofi weighs the push and the pull, and moves to the capital.'],
      draw: function(F, u, f){ var o = [], A = F.P(at('v9')[0], at('v9')[1]), B = F.P(at('cap')[0], at('cap')[1]);
        o.push(tag(A, 'Push', 'is-push', 'below'), tag(A, 'From', 'is-place', 'above'));
        if(u >= 2) o.push(tag(B, 'Pull', 'is-pull', 'below'), tag(B, 'To', 'is-place', 'above'));
        if(u >= 3 || f) o.push(arrow(F, at('v9'), at('cap'), { w: 3.2, frac: u >= 3 ? 1 : f, cls: 'is-move', bend: 22 }));
        return o; } },
    obstacle: { label: 'Intervening obstacle', last: 3,
      cap: ['Ana in the Northern Hills wants to move to the South Coast for work.', 'Between them rise mountains whose only road closes all winter: an intervening obstacle.', 'Some movers turn back; others wait for spring. The obstacle slows the flow or stops it.'],
      draw: function(F, u, f){ var o = [], A = F.P(at('n1')[0], at('n1')[1]), B = F.P(at('n4')[0], at('n4')[1]);
        o.push(tag(A, 'From', 'is-place', 'above'), tag(B, 'To', 'is-place', 'below'));
        if(u >= 2) o.push(mountains(F, 330, 160), tag(F.P(330, 172), 'Obstacle', 'is-obst', 'below'));
        if(u >= 3 || f){ o.push(arrow(F, at('n1'), [316, 150], { w: 3, frac: u >= 3 ? 1 : f, cls: 'is-move', gap1: 4, bend: 12 }));
          if(u >= 3) o.push(arrow(F, [306, 158], at('n1'), { w: 2, cls: 'is-back', dashed: true, gap0: 6, bend: 12 })); }
        return o; } },
    opportunity: { label: 'Intervening opportunity', last: 3,
      cap: ['Yusuf leaves a village in the Lake District, heading for the South Coast.', 'On the way, a new port in the Eastern Plains is hiring: an intervening opportunity.', 'Yusuf takes the job and stays. He never reaches the South Coast.'],
      draw: function(F, u, f){ var o = [], A = F.P(at('v4')[0], at('v4')[1]), B = F.P(at('v16')[0], at('v16')[1]), Mid = F.P(at('t3')[0], at('t3')[1]);
        o.push(tag(A, 'From', 'is-place', 'above'), tag(B, 'Heading for', 'is-place', 'below'));
        if(u >= 2) o.push(tag(Mid, 'Jobs', 'is-opp', 'right'));
        if(u >= 3 || f) o.push(arrow(F, at('v4'), at('t3'), { w: 3, frac: u >= 3 ? 1 : f, cls: 'is-move', bend: -16 }));
        if(u < 3) o.push(arrow(F, at('t3'), at('v16'), { w: 2, dashed: true, cls: 'is-plan', bend: -10 }));
        return o; } },
    step: { label: 'Step migration', last: 3,
      cap: ['Mei leaves a village in the Southern Forest for a nearby town.', 'Two years later she moves on to a larger city.', 'Then she moves to the capital: a move in steps, village to town to city.'],
      draw: function(F, u, f){ var o = [], path = ['v13', 't6', 't5', 'cap'];
        for(var i = 0; i < 3; i++) if(u > i || (u === i && f)) o.push(arrow(F, at(path[i]), at(path[i + 1]), { w: 3, frac: u > i ? 1 : f, cls: 'is-move', bend: i % 2 ? -10 : 10 }));
        o.push(tag(F.P(at('v13')[0], at('v13')[1]), 'Village', 'is-place', 'below'));
        if(u >= 1) o.push(tag(F.P(at('t6')[0], at('t6')[1]), 'Town', 'is-place', 'right'));
        if(u >= 2) o.push(tag(F.P(at('t5')[0], at('t5')[1]), 'City', 'is-place', 'left'));
        if(u >= 3) o.push(tag(F.P(at('cap')[0], at('cap')[1]), 'Capital', 'is-place', 'above'));
        return o; } },
    chain: { label: 'Chain migration', last: 3,
      cap: ['Ravi moves from a village in the Western Uplands to a large city in the Lake District.', 'He sends news and money home; his sister and her husband follow him.', 'Now cousins and neighbors from the same village join them: chain migration.'],
      draw: function(F, u, f){ var o = [], A = at('v7'), B = at('n2'), nPeople = [0, 1, 3, 7][u] || 0;
        o.push(tag(F.P(A[0], A[1]), 'From', 'is-place', 'below'), tag(F.P(B[0], B[1]), 'To', 'is-place', 'above'));
        for(var i = 0; i < Math.min(u, 3); i++) o.push(arrow(F, A, B, { w: 1.6 + i * 1.4, bend: 18 + i * 22, cls: 'is-move' }));
        if(u < 3 && f) o.push(arrow(F, A, B, { w: 1.6 + u * 1.4, bend: 18 + u * 22, frac: f, cls: 'is-move' }));
        var pB = F.P(B[0], B[1]);
        for(var j = 0; j < nPeople; j++){ var col = j % 4, row = Math.floor(j / 4); o.push('<circle class="dl-person" cx="' + n1(pB[0] + 16 + col * 9) + '" cy="' + n1(pB[1] + 12 + row * 9) + '" r="3.4"/>'); }
        return o; } },
    ravenstein: { label: 'Ravenstein\'s laws', last: 3,
      cap: ['Most moves from the Western Uplands are short: to nearby towns (thick arrows).', 'Fewer people move far, and most who do head for big centers of trade and industry.', 'Each flow has a smaller counterflow back (dashed arrows).'],
      draw: function(F, u, f){ var o = [], O = C.west;
        var near = ['t5', 'v8', 'v21'], far = ['cap', 'n2'];
        near.forEach(function(id, i){ o.push(arrow(F, O, at(id), { w: 5.5, bend: i % 2 ? 6 : -6, frac: u >= 1 ? 1 : f, cls: 'is-move', gap0: 6 })); });
        if(u >= 2 || (u === 1 && f)) far.forEach(function(id, i){ o.push(arrow(F, O, at(id), { w: 2, bend: i ? -30 : 24, frac: u >= 2 ? 1 : f, cls: 'is-move', gap0: 6 })); });
        if(u >= 3 || (u === 2 && f)){ o.push(arrow(F, at('cap'), O, { w: 1.4, bend: 24, dashed: true, cls: 'is-back', frac: u >= 3 ? 1 : f, gap1: 8 })); o.push(arrow(F, at('t5'), O, { w: 1.4, bend: 14, dashed: true, cls: 'is-back', frac: u >= 3 ? 1 : f, gap1: 8 })); }
        o.push(tag(F.P(O[0], O[1]), 'From', 'is-place', 'left'));
        return o; } }
  };
  var SCENE_IDS = ['pushpull', 'obstacle', 'opportunity', 'step', 'chain', 'ravenstein'];
  function sceneSvg(W, H, id, u, f){
    var F = fit(W, H), sc = SCENES[id], out = [country(F)];
    D.PLACES.slice().sort(function(a, b){ return b.rank - a.rank; }).forEach(function(pl){ out.push(dot(F, pl, 'dl-quiet')); });
    return out.concat(sc.draw(F, u, f)).join('');
  }

  /* ---------------------------------------------------------- the words */
  var KIND_KEYS = ['relocation', 'contagious', 'hierarchical', 'stimulus', 'mixed'];
  var KIND_LABEL = { relocation: 'Relocation', contagious: 'Contagious', hierarchical: 'Hierarchical', stimulus: 'Stimulus', mixed: 'A real mix' };
  var DEMO = { relocation: { hearth: 'v9', dest: ['n2', 'n4'] }, contagious: { hearth: 'v13' }, hierarchical: { hearth: 'cap' }, stimulus: { hearth: 'v5' }, mixed: { hearth: 'cap' } };
  var STEP_CAP = {
    relocation: ['A family in a village in the Western Uplands has the trait: the hearth.', 'Some of them move to two far cities and take it with them. The places between never get it.'],
    contagious: ['A village in the Southern Forest is the hearth.', 'The nearest places pick it up first, whatever their size.', 'It ripples outward, place by place.', 'Distance slows it: the far corners get it last, or not yet.'],
    hierarchical: ['It starts in the capital.', 'Next, every large city has it, however far away.', 'Then the towns.', 'Last, the villages, even the ones right next to the capital.'],
    stimulus: ['It starts in a village in the Eastern Plains.', 'Neighbors like the idea but change it to fit their own ways (diamonds).', 'Each new place takes the idea, not the exact trait.', 'The idea spread; the trait itself did not.'],
    mixed: ['It starts in the capital.', 'It jumps to every large city at once: hierarchical.', 'Then it spreads to the places near each city: contagious.', 'Real diffusion mixes types: hierarchical between cities, contagious around them.']
  };
  var WHY = {
    relocation: '<p><b>Relocation diffusion</b> happens when people who move carry a trait with them to a new place. The places they pass through do not get it. ' + D.REAL.relocation + '</p>',
    contagious: '<p><b>Contagious diffusion</b> is a kind of expansion diffusion: the trait spreads from place to nearby place, and the hearth keeps it. Contact falls with distance (distance decay), so the nearest places go first. Example: ' + D.REAL.contagious.charAt(0).toLowerCase() + D.REAL.contagious.slice(1) + '</p>',
    hierarchical: '<p><b>Hierarchical diffusion</b> is a kind of expansion diffusion that moves from the largest or best-connected places, or people with the most power, down to smaller ones. It skips places in between. Example: ' + D.REAL.hierarchical.charAt(0).toLowerCase() + D.REAL.hierarchical.slice(1) + '</p>',
    stimulus: '<p><b>Stimulus diffusion</b> is a kind of expansion diffusion where the idea behind a trait spreads but people change the trait itself. ' + D.REAL.stimulus + '</p>',
    mixed: '<p><b>Real diffusion mixes types.</b> A new idea often reaches the biggest cities first (hierarchical), then spreads to the places around each one (contagious). A trait carried by migrants (relocation) can then spread outward from where they settled (expansion).</p>'
  };
  var LIMITS = '<p><b>Relocation or expansion?</b> In relocation, the trait moves with people. In expansion (contagious, hierarchical, stimulus), it spreads outward while the hearth keeps it. A trait can travel both ways at once.</p>';
  var MWHY = {
    pushpull: '<p><b>Push factors</b> are reasons to leave a place; <b>pull factors</b> are reasons to move to a new one. Each can be economic (jobs, pay), political (laws, conflict, rights), environmental (drought, floods, climate) or cultural (language, religion, family ties). Most moves have both.</p>',
    obstacle: '<p>An <b>intervening obstacle</b> is something between the origin and the destination that makes the move harder: mountains, a closed road, a border, a high fare, a visa rule. It can slow the flow, stop it or turn people back.</p>',
    opportunity: '<p>An <b>intervening opportunity</b> is a chance on the way, such as a job or land, that makes a migrant stop short of the place they set out for. It is one reason most moves are short.</p>',
    step: '<p><b>Step migration</b> is a move in stages, often from a village to a town to a city. Each step is short, which fits Ravenstein\'s observation that migration proceeds step by step.</p>',
    chain: '<p><b>Chain migration</b> is moving to a place because relatives or people from your home moved there first. They send news, money and help, so others follow. It is why many cities have neighborhoods of people from the same region.</p>',
    ravenstein: '<p><b>Ravenstein\'s laws of migration</b> (1885 and 1889, from British census data): most migrants move only a short distance; migration often happens in steps; long-distance migrants usually head for big centers of trade and industry; each flow produces a smaller counterflow; and women migrated more within their own country, while men more often went abroad. Many still fit, but long-distance and international moves are far more common now than in the 1880s.</p>'
  };

  /* ---------------------------------------------------------- mount */
  T.mount('diffusion-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'diffusion-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });
  function chips(cls, label, items){
    return '<div class="dl-row ' + cls + '" role="group" aria-label="' + esc(label) + '"><p class="dl-lbl" aria-hidden="true">' + esc(label) + '</p><div class="dl-chips">' + items.map(function(x){ return '<button type="button" class="tchip" data-k="' + x[0] + '" aria-pressed="false">' + esc(x[1]) + '</button>'; }).join('') + '</div></div>';
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var scene = 'diffusion', kind = 'hierarchical', mig = 'pushpull', upto = 1, frac = 0, timer = null, LS = null, nid = T.nid('dl'), touched = false;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem dl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Diffusion and migration on a map</h2>' +
      '<div class="dl-fig"><div class="dl-pic"><svg class="dl-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg></div><div class="dl-leg"></div></div>' +
      '<div class="dl-ctl">' + chips('dl-scene', 'Show', [['diffusion', 'Diffusion'], ['migration', 'Migration']]) +
        '<div class="dl-grp dl-grp-diffusion">' + chips('dl-kind', 'Type of diffusion', KIND_KEYS.map(function(k){ return [k, KIND_LABEL[k]]; })) + '</div>' +
        '<div class="dl-grp dl-grp-migration">' + chips('dl-mig', 'Migration idea', SCENE_IDS.map(function(k){ return [k, SCENES[k].label]; })) + '</div>' +
        '<div class="dl-play"><div class="dl-stepslot"></div><button type="button" class="btn-press sm dl-go">Play</button></div>' +
      '</div>' +
      '<div class="dl-say"></div>' +
      '<div class="dl-more"></div><p class="sr-only dl-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.dl-live'));
    var cue = T.cue('Pick a type, then press Play and watch where the trait goes next.');
    $('.dl-ctl').insertBefore(cue.el, $('.dl-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var sStep = T.slider({ label: 'Step', min: 1, max: 4, step: 1, value: 1, onInput: function(v){ act(); stop(); if(v > last()){ v = last(); sStep.set(v); } upto = v; frac = 0; draw(); words(); say(capLine()); } });
    $('.dl-stepslot').appendChild(sStep.el);
    function last(){ return scene === 'diffusion' ? spreadNow().last : SCENES[mig].last; }
    function spreadNow(){ var d = DEMO[kind]; return D.spread(kind, d.hearth, d.dest); }
    function setMax(){ var mx = last(); sStep.input.max = String(mx); if(upto > mx) upto = mx; sStep.set(upto); }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } frac = 0; var b = $('.dl-go'); if(b) b.textContent = upto >= last() ? 'Replay' : 'Play'; }
    function play(){
      act();
      if(timer){ stop(); draw(); return; }
      if(T.reduced()){ upto = last(); sStep.set(upto); draw(); words(); say(capLine()); return; }
      if(upto >= last()) upto = 1;
      var t0 = Date.now(), per = 1100;
      $('.dl-go').textContent = 'Pause';
      sStep.set(upto); draw(); words();
      timer = setInterval(function(){
        var t = (Date.now() - t0) / per;
        if(t >= 1){
          t0 = Date.now(); frac = 0;
          if(upto >= last()){ stop(); draw(); words(); return; }
          upto++; sStep.set(upto); words(); say(capLine());
        } else frac = upto < last() ? t : 0;
        draw();
      }, 60);
    }
    $('.dl-go').addEventListener('click', play);
    function onClick(e){
      var b = e.target.closest('.dl-row button'); if(!b || !(LS ? LS.root : host).contains(b)) return;
      var row = b.closest('.dl-row'), k = b.getAttribute('data-k');
      act(); stop();
      if(row.classList.contains('dl-scene')) scene = k;
      else if(row.classList.contains('dl-kind')) kind = k;
      else if(row.classList.contains('dl-mig')) mig = k;
      upto = 1; setMax(); sync(); draw(); words(); say(capLine());
    }
    host.addEventListener('click', onClick);
    function sync(){
      var root = LS ? LS.root : host, on = { 'dl-scene': scene, 'dl-kind': kind, 'dl-mig': mig };
      Object.keys(on).forEach(function(cls){ root.querySelectorAll('.' + cls + ' button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === on[cls])); }); });
      ['diffusion', 'migration'].forEach(function(k){ var el = $('.dl-grp-' + k); if(el) el.hidden = k !== scene; });
      var b = $('.dl-go'); if(b && !timer) b.textContent = upto >= last() ? 'Replay' : 'Play';
    }
    function size(){ var f = $('.dl-pic'), r = f ? f.getBoundingClientRect() : { width: 600, height: 420 }; return { W: Math.max(300, Math.round(r.width) || 600), H: Math.max(240, Math.round(r.height) || 420) }; }
    function draw(){
      var z = size(), svg = $('.dl-svg'), html, label;
      if(scene === 'diffusion'){
        var sp = spreadNow();
        html = spreadSvg(z.W, z.H, sp, upto, { labelHearth: true, moving: kind === 'relocation' && upto === 1 ? frac : 0 });
        label = 'Map of Country A: ' + KIND_LABEL[kind].toLowerCase() + ' diffusion at step ' + upto + ' of ' + sp.last + '. ' + capLine();
        $('.dl-leg').innerHTML = stepLegend(sp.last, { changed: kind === 'stimulus', arrows: kind === 'relocation' });
      } else {
        html = sceneSvg(z.W, z.H, mig, upto, frac);
        label = 'Map of Country A: ' + SCENES[mig].label + ', step ' + upto + ' of ' + SCENES[mig].last + '. ' + capLine();
        $('.dl-leg').innerHTML = '<ul class="dl-legend" aria-label="Legend"><li><span class="dl-sw dl-ln" aria-hidden="true"></span>A move (thicker: more people)</li>' + (mig === 'ravenstein' || mig === 'obstacle' ? '<li><span class="dl-sw dl-ln is-dashed" aria-hidden="true"></span>Back the other way</li>' : '') + (mig === 'opportunity' ? '<li><span class="dl-sw dl-ln is-dashed" aria-hidden="true"></span>The trip planned</li>' : '') + '<li class="dl-sizes"><span class="dl-sz r1 is-q" aria-hidden="true"></span>Capital <span class="dl-sz r2 is-q" aria-hidden="true"></span>Large city <span class="dl-sz r3 is-q" aria-hidden="true"></span>Town <span class="dl-sz r4 is-q" aria-hidden="true"></span>Village</li></ul>';
      }
      svg.setAttribute('viewBox', '0 0 ' + z.W + ' ' + z.H);
      svg.innerHTML = html;
      svg.setAttribute('aria-label', label);
    }
    function capLine(){ return scene === 'diffusion' ? STEP_CAP[kind][Math.min(upto, STEP_CAP[kind].length) - 1] : SCENES[mig].cap[upto - 1]; }
    function words(){
      var head = scene === 'diffusion' ? KIND_LABEL[kind] + (kind === 'mixed' ? ': hierarchical, then contagious.' : ' diffusion.') : SCENES[mig].label + '.';
      var why = scene === 'diffusion' ? WHY[kind] + LIMITS : MWHY[mig];
      T.explain($('.dl-say'), '<b>' + esc(head) + '</b> ' + esc(capLine()), why);
      more();
      if(LS){ LS.caption('<b>' + esc(head) + '</b> ' + esc(capLine()), 'explore'); LS.pills([{ k: 'Step', html: upto + ' of ' + last(), tone: 'readout' }], 'left', 'explore'); LS.pills([], 'right', 'explore'); }
    }
    function more(){
      var el = $('.dl-more'); if(!el) return;
      el.innerHTML = '<h3 class="ls-title-l">The types, side by side</h3>' + T.dataTable(['Type', 'How it spreads', 'A real case'], D.ORDER.map(function(k){ return [D.KINDS[k].name, D.KINDS[k].def, D.REAL[k]]; }), 'Diffusion types (CED 3.4)') +
        '<h3 class="ls-title-l">Kinds of migration</h3>' + T.dataTable(['Kind', 'What it means'], Object.keys(D.MKINDS).map(function(k){ return [D.MKINDS[k].name + (D.MKINDS[k].forced ? ' (forced)' : ' (voluntary)'), D.MKINDS[k].def]; }), 'Forced and voluntary migration (CED 2.11)') +
        '<p class="bt-small">Country A and every person in the scenes are invented. The real cases are the usual textbook examples.</p>';
    }
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.dl-fig')], dock: [$('.dl-ctl')], why: [$('.dl-say')], details: [$('.dl-more')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      sync(); draw(); words();
      if(s.mode() === 'explore') T.hintSlot(s, $('.dl-go'), 'Start here: press Play', { cls: 'dl-tipslot' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe($('.dl-pic')); }
    }
    setMax(); sync(); draw(); words();
    if(!T.studioOf(host) && window.ResizeObserver){ var t2 = null; new ResizeObserver(function(){ clearTimeout(t2); t2 = setTimeout(draw, 60); }).observe($('.dl-pic')); }
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  var TITLES = { diffusion: 'Read a diffusion map', mixed: 'Mixed diffusion', migration: 'Why people move', kinds: 'Kinds of migration', ravenstein: 'Ravenstein\'s laws' };
  function quiz(host, data){
    T.drill(host, data, { slug: 'diffusion-lab', noun: 'drill',
      generate: function(r, ctx, type){ return D.generate(r, ctx, type); },
      types: [{ value: 'diffusion', label: 'Diffusion types' }, { value: 'mixed', label: 'Mixed diffusion' }, { value: 'migration', label: 'Push, pull and obstacles' }, { value: 'kinds', label: 'Kinds of migration' }, { value: 'ravenstein', label: 'Ravenstein\'s laws' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return TITLES[p.type] || 'Practice problem'; },
      extra: function(el, p){ figure(el, p); }
    });
  }
  function figure(el, p){
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var W = phone() ? 360 : 600, H = phone() ? 240 : 420, inner = '', label = '', leg = '';
    if(g.kind === 'spread'){
      inner = spreadSvg(W, H, g.spread, 4, { letters: g.letters });
      label = 'Map of Country A: places shaded by the step when they first had the trait, with four places lettered A to D.';
      leg = stepLegend(g.spread.last, { changed: Object.keys(g.spread.changed).length > 0, arrows: g.spread.arrows.length > 0 });
    } else if(g.kind === 'move'){
      var F = fit(W, H), o = [country(F)];
      D.PLACES.slice().sort(function(a, b){ return b.rank - a.rank; }).forEach(function(pl){ o.push(dot(F, pl, 'dl-quiet')); });
      var A = F.P(C[g.from][0], C[g.from][1]), B = F.P(C[g.to][0], C[g.to][1]), Mi = F.P(C[g.via][0], C[g.via][1]);
      o.push(arrow(F, C[g.from], g.stop ? C[g.via] : C[g.to], { w: 3, cls: 'is-move', bend: 18, gap0: 16, gap1: 16 }));
      if(g.stop) o.push(arrow(F, C[g.via], C[g.to], { w: 2, dashed: true, cls: 'is-plan', bend: 12, gap0: 16, gap1: 16 }));
      else o.push('<circle class="dl-via" cx="' + Mi[0] + '" cy="' + Mi[1] + '" r="5"/>');
      // From and To sit below their place, each factor's number above it: never on each other.
      o.push(tag([A[0], A[1] + 2], 'From', 'is-place', 'below'), tag([B[0], B[1] + 2], 'To', 'is-place', 'below'));
      g.tags.forEach(function(t){ var q = F.P(C[t.at][0], C[t.at][1]); o.push(numTag([q[0], n1(q[1] - 18)], t.num)); });
      inner = o.join('');
      label = 'Map of Country A: a move from one province to another, with the three numbered factors at the origin, on the way and at the destination.';
      leg = '<ul class="dl-legend" aria-label="Legend"><li><span class="dl-sw dl-ln" aria-hidden="true"></span>The move</li>' + (g.stop ? '<li><span class="dl-sw dl-ln is-dashed" aria-hidden="true"></span>The trip planned</li>' : '') + '<li><span class="dl-sw dl-numsw" aria-hidden="true">1</span>A numbered factor in the text</li></ul>';
    } else if(g.kind === 'flows'){
      var F2 = fit(W, H), o2 = [country(F2)], mx = Math.max.apply(null, g.flows.map(function(f){ return f.w; }));
      D.PLACES.slice().sort(function(a, b){ return b.rank - a.rank; }).forEach(function(pl){ o2.push(dot(F2, pl, 'dl-quiet')); });
      g.flows.forEach(function(f, i){ o2.push(arrow(F2, f.from, f.to, { w: 1.4 + 6 * f.w / mx, bend: f.back ? 30 : i % 2 ? 14 : -14, cls: f.back ? 'is-back' : 'is-move', dashed: !!f.back, gap0: 8 })); });
      var O = F2.P(C[g.from][0], C[g.from][1]);
      o2.push(tag(O, 'From', 'is-place', 'left'));
      inner = o2.join('');
      label = 'Map of Country A: arrows show the moves in the survey; thicker arrows carry more people.';
      leg = '<ul class="dl-legend" aria-label="Legend"><li><span class="dl-sw dl-ln" aria-hidden="true"></span>Moves (thicker: more people)</li>' + (g.flows.some(function(f){ return f.back; }) ? '<li><span class="dl-sw dl-ln is-dashed" aria-hidden="true"></span>The flow back</li>' : '') + '</ul>';
    }
    el.innerHTML = '<figure class="cd-fig dl-qfig"><svg class="dl-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + inner + '</svg>' + leg + '<figcaption class="bt-small">Country A is an invented country for practice.</figcaption></figure>';
  }
})();
