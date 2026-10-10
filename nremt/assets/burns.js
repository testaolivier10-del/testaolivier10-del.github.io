/* Burns mode of the body map: the Rule of Nines, on a body you paint.

   window.NremtBurns.mount(root, { record, q })

   One job: estimate how much of the body is burned, fast, by the Rule of
   Nines, and know which regions carry how much.

   Why a 2D front and back outline and not the 3D body: the Rule of Nines is a
   map of surface regions (front of the trunk, back of a leg), and the 3D model
   is bones and organs with a skin layer that has no region boundaries, so
   painting "the back of the left leg" on it would be guesswork. Two flat
   figures side by side show front and back at once, which is how the rule is
   taught and how the total adds up.

   Percentages (docs/tools-upgrade-notes/nremt-body.md, For accuracy review):
   adult: head and neck 9, each arm 9, anterior trunk 18 (chest 9, abdomen 9),
   posterior trunk 18 (upper back 9, lower back and buttocks 9), each leg 18,
   genitals 1. Child (the course's own study notes, chapter 30, and bank
   question 533): head and neck 18 and each leg 13.5; everything else as adult.
   Each limb and the head split evenly front and back. */
(function(){
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function say(t){ if(window.LevlAnnounce) window.LevlAnnounce.say(t); }

  /* ---- The regions -------------------------------------------------------- */
  var REGIONS = [
    { id:'head-f',  view:'front', name:'Head and neck, front', whole:'head', adult:4.5, child:9 },
    { id:'head-b',  view:'back',  name:'Head and neck, back',  whole:'head', adult:4.5, child:9 },
    { id:'chest',   view:'front', name:'Chest',                whole:'antTrunk', adult:9, child:9 },
    { id:'abdomen', view:'front', name:'Abdomen',              whole:'antTrunk', adult:9, child:9 },
    { id:'upback',  view:'back',  name:'Upper back',           whole:'postTrunk', adult:9, child:9 },
    { id:'lowback', view:'back',  name:'Lower back and buttocks', whole:'postTrunk', adult:9, child:9 },
    { id:'genitals',view:'front', name:'Genitals',             whole:'genitals', adult:1, child:1 },
    { id:'rarm-f',  view:'front', name:'Right arm, front',     whole:'rarm', adult:4.5, child:4.5 },
    { id:'rarm-b',  view:'back',  name:'Right arm, back',      whole:'rarm', adult:4.5, child:4.5 },
    { id:'larm-f',  view:'front', name:'Left arm, front',      whole:'larm', adult:4.5, child:4.5 },
    { id:'larm-b',  view:'back',  name:'Left arm, back',       whole:'larm', adult:4.5, child:4.5 },
    { id:'rleg-f',  view:'front', name:'Right leg, front',     whole:'rleg', adult:9, child:6.75 },
    { id:'rleg-b',  view:'back',  name:'Right leg, back',      whole:'rleg', adult:9, child:6.75 },
    { id:'lleg-f',  view:'front', name:'Left leg, front',      whole:'lleg', adult:9, child:6.75 },
    { id:'lleg-b',  view:'back',  name:'Left leg, back',       whole:'lleg', adult:9, child:6.75 }
  ];
  var R = {}; REGIONS.forEach(function(r){ R[r.id] = r; });
  var WHOLE = {
    head:{ name:'The head and neck', adult:9, child:18 },
    antTrunk:{ name:'The front of the trunk', adult:18, child:18 },
    postTrunk:{ name:'The back of the trunk', adult:18, child:18 },
    genitals:{ name:'The genitals', adult:1, child:1 },
    rarm:{ name:'Each arm', adult:9, child:9 }, larm:{ name:'Each arm', adult:9, child:9 },
    rleg:{ name:'Each leg', adult:18, child:13.5 }, lleg:{ name:'Each leg', adult:18, child:13.5 }
  };
  /* Groups a scenario can name: a whole part, both of its halves. */
  var PARTS = {
    'head':['head-f','head-b'], 'right arm':['rarm-f','rarm-b'], 'left arm':['larm-f','larm-b'],
    'right leg':['rleg-f','rleg-b'], 'left leg':['lleg-f','lleg-b'], 'anterior trunk':['chest','abdomen'],
    'back':['upback','lowback'], 'genitals':['genitals']
  };

  function pct(id, child){ return child ? R[id].child : R[id].adult; }
  /* marks: { regionId: 1 (full) | 0.5 (half) } */
  function total(marks, child){
    var t = 0;
    for(var id in marks) if(R[id]) t += pct(id, child) * marks[id];
    return Math.round(t * 1000) / 1000;
  }
  function fmt(n){ return (Math.round(n * 1000) / 1000).toString(); }

  /* ---- Quiz bank ----------------------------------------------------------
     estimate: the regions burned (whole regions), the student picks the TBSA.
     paint: a target the student paints, any combination that adds up. */
  var ESTIMATE = [
    { id:'arm-trunk', child:false, text:'An adult has burns to the entire right arm and the entire front of the trunk (chest and abdomen).', parts:['right arm','anterior trunk'] },
    { id:'both-arms', child:false, text:'An adult has burns covering both arms completely, front and back.', parts:['right arm','left arm'] },
    { id:'leg-back', child:false, text:'An adult has burns to the entire left leg and the entire back.', parts:['left leg','back'] },
    { id:'head-arm', child:false, text:'An adult has burns to the head and neck and the entire left arm.', parts:['head','left arm'] },
    { id:'legs-front', child:false, text:'An adult has burns to the front of both legs only.', regions:['rleg-f','lleg-f'] },
    { id:'genital-legs', child:false, text:'An adult has burns to the genitals and the front of both legs.', regions:['genitals','rleg-f','lleg-f'] },
    { id:'lowback-legs', child:false, text:'An adult who sat in a hot liquid has burns to the lower back and buttocks and the back of both legs.', regions:['lowback','rleg-b','lleg-b'] },
    { id:'c-head', child:true, text:'A small child has burns to the entire head and neck.', parts:['head'] },
    { id:'c-head-legs', child:true, text:'A small child has burns to the head and neck and both legs.', parts:['head','right leg','left leg'] },
    { id:'c-arm-trunk', child:true, text:'A small child has burns to the entire right arm and the front of the trunk.', parts:['right arm','anterior trunk'] },
    { id:'c-leg', child:true, text:'A small child has burns to the entire right leg.', parts:['right leg'] }
  ];
  var PAINT = [
    { id:'paint-27', child:false, target:27 },
    { id:'paint-36', child:false, target:36 },
    { id:'paint-18', child:false, target:18 },
    { id:'paint-45', child:false, target:45 },
    { id:'paint-c27', child:true, target:27 }
  ];
  function scenarioRegions(q){
    if(q.regions) return q.regions.slice();
    var out = []; q.parts.forEach(function(p){ out = out.concat(PARTS[p]); });
    return out;
  }
  function scenarioAnswer(q, child){
    var m = {}; scenarioRegions(q).forEach(function(id){ m[id] = 1; });
    return total(m, child == null ? q.child : child);
  }
  /* Choices: the answer and the classic mistakes: the other age's chart, a
     region counted as half or double (front only / both sides), one region off. */
  function choices(q){
    var ans = scenarioAnswer(q), set = [ans];
    var alt = scenarioAnswer(q, !q.child);
    [alt, ans + 9, ans - 9, ans / 2, ans + 4.5, ans * 2].forEach(function(v){
      v = Math.round(v * 100) / 100;
      if(v > 0 && v <= 100 && set.indexOf(v) < 0 && set.length < 4) set.push(v);
    });
    return set.sort(function(a, b){ return a - b; });
  }

  /* ---- Drawing ------------------------------------------------------------ */
  function mirror(d){ return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, function(m, x, y){ return (200 - +x) + ' ' + y; }); }
  var ARM = 'M58 78 L42 84 L30 150 L22 214 L18 240 L24 252 L34 250 L36 236 L44 196 L50 160 L60 122 Z';
  var LEG_F = 'M60 214 L96 232 L96 300 L94 380 L96 404 L70 406 L72 384 L66 300 L60 250 Z';
  var LEG_B = 'M58 232 L98 232 L96 300 L94 380 L96 404 L70 406 L72 384 L66 300 L60 258 Z';
  var SHAPES = {
    'head-f': ['E', 'M89 56 L111 56 L112 74 L88 74 Z'],
    'head-b': ['E', 'M89 56 L111 56 L112 74 L88 74 Z'],
    'chest': ['M60 76 Q100 68 140 76 L144 150 L56 150 Z'],
    'abdomen': ['M56 150 L144 150 L140 214 L104 232 L96 232 L60 214 Z'],
    'genitals': ['M92 222 L108 222 L104 238 L96 238 Z'],
    'upback': ['M60 76 Q100 68 140 76 L144 150 L56 150 Z'],
    'lowback': ['M56 150 L144 150 L142 232 L58 232 Z'],
    // front view: the patient's right is on the viewer's left; back view: the reverse
    'rarm-f': [ARM], 'larm-f': [mirror(ARM)], 'rleg-f': [LEG_F], 'lleg-f': [mirror(LEG_F)],
    'larm-b': [ARM], 'rarm-b': [mirror(ARM)], 'lleg-b': [LEG_B], 'rleg-b': [mirror(LEG_B)]
  };
  var LABEL_AT = {
    'head-f':[100,36], 'head-b':[100,36], 'chest':[100,116], 'abdomen':[100,186], 'genitals':[100,252],
    'upback':[100,116], 'lowback':[100,196], 'rarm-f':[38,180], 'larm-f':[162,180], 'larm-b':[38,180], 'rarm-b':[162,180],
    'rleg-f':[80,320], 'lleg-f':[120,320], 'lleg-b':[80,320], 'rleg-b':[120,320]
  };
  function el(tag, attrs, parent){
    var n = document.createElementNS(NS, tag);
    for(var k in attrs) n.setAttribute(k, attrs[k]);
    if(parent) parent.appendChild(n);
    return n;
  }
  function drawFigure(svg, view, uid){
    var defs = el('defs', {}, svg);
    var pat = el('pattern', { id:'bnHalf' + uid, width:'7', height:'7', patternUnits:'userSpaceOnUse', patternTransform:'rotate(45)' }, defs);
    el('rect', { width:'7', height:'7', class:'bn-half-bg' }, pat);
    el('rect', { width:'3.4', height:'7', class:'bn-half-st' }, pat);
    var regs = {};
    REGIONS.filter(function(r){ return r.view === view; }).forEach(function(r){
      var g = el('g', { class:'bn-reg', 'data-region': r.id, role:'button', tabindex:'0' }, svg);
      SHAPES[r.id].forEach(function(d){
        if(d === 'E') el('ellipse', { cx:'100', cy:'32', rx:'22', ry:'26', class:'bn-shape' }, g);
        else el('path', { d:d, class:'bn-shape' }, g);
      });
      var at = LABEL_AT[r.id];
      var t = el('text', { x:at[0], y:at[1], class:'bn-pct' + (r.id === 'genitals' ? ' bn-pct--sm' : '') }, g);
      regs[r.id] = { g:g, t:t };
    });
    return regs;
  }

  /* ---- Weighted pick: a missed question comes back more often (session) -- */
  function pick(pool, misses, lastId){
    var bag = [];
    pool.forEach(function(p){ var w = 10 + Math.min(misses[p.id] || 0, 3) * 5; for(var i = 0; i < w; i++) bag.push(p); });
    var p, n = 0;
    do { p = bag[Math.floor(Math.random() * bag.length)]; n++; } while(n < 40 && pool.length > 1 && p.id === lastId);
    return p;
  }

  /* ======================================================================= */
  function mount(root, opts){
    opts = opts || {};
    var record = opts.record || function(){};
    var st = { child:false, brush:1, marks:{}, quiz:null, answered:false, misses:Object.create(null), tally:[0,0], last:null, show:null };

    root.innerHTML =
      '<div class="bn-bar">' +
        '<div class="bn-seg" role="group" aria-label="Patient">' +
          '<button type="button" data-age="adult">Adult</button><button type="button" data-age="child">Child</button></div>' +
        '<div class="bn-seg" role="group" aria-label="Brush">' +
          '<button type="button" data-brush="1">Full</button><button type="button" data-brush="0.5">Half</button><button type="button" data-brush="0">Erase</button></div>' +
        '<button type="button" class="bn-clear">Clear</button>' +
        '<button type="button" class="bn-quiz" aria-pressed="false">Quiz me</button>' +
      '</div>' +
      '<div class="bn-grid">' +
        '<div class="bn-figs">' +
          '<figure class="bn-fig"><figcaption>Front</figcaption><svg viewBox="0 0 200 412" class="bn-svg" data-view="front" aria-label="Body, front. Each region is a button."></svg></figure>' +
          '<figure class="bn-fig"><figcaption>Back</figcaption><svg viewBox="0 0 200 412" class="bn-svg" data-view="back" aria-label="Body, back. Each region is a button."></svg></figure>' +
        '</div>' +
        '<div class="bn-side">' +
          '<div class="bn-qpanel" hidden></div>' +
          '<div class="bn-total" aria-live="polite"><span class="bn-k">Total body surface area burned</span><span class="bn-num">0%</span><span class="bn-age"></span></div>' +
          '<div class="bn-info"></div>' +
          '<ul class="bn-list"></ul>' +
          '<p class="bn-palm"><b>Palm rule.</b> The patient’s own palm, fingers included, is about 1% of their body surface. Use it for small or scattered burns the big regions do not fit.</p>' +
        '</div>' +
      '</div>';

    var regs = {};
    ['front','back'].forEach(function(v, i){
      var svg = root.querySelector('svg[data-view="' + v + '"]');
      var r = drawFigure(svg, v, i + '' + Math.floor(Math.random() * 1e6));
      for(var k in r) regs[k] = r[k];
      // a hatch fill id per figure
      svg._half = svg.querySelector('pattern').id;
    });
    var total$ = root.querySelector('.bn-num'), age$ = root.querySelector('.bn-age');
    var info = root.querySelector('.bn-info'), list = root.querySelector('.bn-list');
    var qpanel = root.querySelector('.bn-qpanel');

    function paint(){
      REGIONS.forEach(function(r){
        var x = regs[r.id], m = st.marks[r.id] || 0;
        var shown = st.show && st.show.indexOf(r.id) >= 0;
        x.g.classList.toggle('is-full', m === 1);
        x.g.classList.toggle('is-half', m === 0.5);
        x.g.classList.toggle('is-shown', !!shown);
        var fill = m === 0.5 ? 'url(#' + x.g.ownerSVGElement._half + ')' : '';
        x.g.querySelectorAll('.bn-shape').forEach(function(s){ s.style.fill = fill; });
        var p = pct(r.id, st.child);
        var hideNum = st.quiz && st.quiz.kind === 'estimate' && !st.answered;
        x.t.textContent = hideNum ? '' : fmt(p);
        x.g.setAttribute('aria-label', r.name + ', ' + fmt(p) + ' percent' + (m === 1 ? ', burned' : m === 0.5 ? ', half burned' : ''));
      });
      var t = total(st.marks, st.child);
      /* In "paint a 27% burn" the total is the answer, so it is hidden until Check. */
      var hideTotal = st.quiz && st.quiz.kind === 'paint' && !st.answered;
      total$.textContent = hideTotal ? '?' : fmt(t) + '%';
      age$.textContent = st.child ? 'Child chart: head 18%, each leg 13.5%' : 'Adult Rule of Nines';
      root.querySelectorAll('[data-age]').forEach(function(b){ b.setAttribute('aria-pressed', (b.dataset.age === 'child') === st.child ? 'true' : 'false'); });
      root.querySelectorAll('[data-brush]').forEach(function(b){ b.setAttribute('aria-pressed', +b.dataset.brush === st.brush ? 'true' : 'false'); });
      var ids = REGIONS.filter(function(r){ return st.marks[r.id]; });
      list.innerHTML = ids.map(function(r){
        var m = st.marks[r.id];
        return '<li><span>' + esc(r.name) + (m === 0.5 ? ' <em>(half)</em>' : '') + '</span><b>' + fmt(pct(r.id, st.child) * m) + '%</b></li>';
      }).join('');
      var big = t > 10 && !hideTotal ? '<p class="bn-flag">Over 10%: if these are partial-thickness burns, that alone meets burn center criteria. Cover with dry sterile dressings: cool wet dressings over more than 10% risk hypothermia.</p>' : '';
      var old = root.querySelector('.bn-flag'); if(old) old.remove();
      if(big) list.insertAdjacentHTML('afterend', big);
      return t;
    }

    function explain(r){
      var p = pct(r.id, st.child), w = WHOLE[r.whole], whole = st.child ? w.child : w.adult;
      var s = '<b>' + esc(r.name) + ': ' + fmt(p) + '%.</b> ';
      if(r.whole === 'genitals') s += 'The 1% that makes the nines add up to 100.';
      else if(r.whole === 'antTrunk' || r.whole === 'postTrunk') s += w.name + ' is ' + whole + '% (two nines: ' + (r.whole === 'antTrunk' ? 'chest and abdomen' : 'upper back, and lower back with buttocks') + ').';
      else s += w.name + ' is ' + fmt(whole) + '%, half on the front and half on the back.';
      if(r.whole === 'head') s += st.child ? ' A child’s head is a much bigger share of the body: 18%, twice the adult 9%.' : ' In a child the head and neck is 18%.';
      if(r.whole === 'rleg' || r.whole === 'lleg') s += st.child ? ' A child’s legs are a smaller share: 13.5% each, against 18% in an adult.' : ' In a child each leg is 13.5%.';
      if(r.whole === 'rarm' || r.whole === 'larm') s += ' The same in a child.';
      return s;
    }

    function apply(id, brush, isTap){
      if(st.quiz && (st.quiz.kind === 'estimate' || st.answered)) return;
      var cur = st.marks[id] || 0;
      var next = isTap && cur === brush && brush !== 0 ? 0 : brush;
      if(next) st.marks[id] = next; else delete st.marks[id];
      st.last = id;
      var t = paint();
      info.innerHTML = '<p>' + explain(R[id]) + (next === 0.5 ? ' Half of it: ' + fmt(pct(id, st.child) / 2) + '%.' : '') + '</p>';
      var quizPaint = st.quiz && st.quiz.kind === 'paint';
      if(isTap) say(R[id].name + (next === 1 ? ' marked, ' : next === 0.5 ? ' half marked, ' : ' cleared, ') + fmt(pct(id, st.child) * (next || 0)) + ' percent.' + (quizPaint ? '' : ' Total ' + fmt(t) + ' percent.'));
    }

    /* tap, keyboard, and drag to paint */
    var dragging = false, dragSeen = null, downId = null, moved = false;
    root.querySelectorAll('.bn-svg').forEach(function(svg){
      svg.addEventListener('pointerdown', function(e){
        var g = e.target.closest && e.target.closest('[data-region]');
        dragging = true; moved = false; dragSeen = {}; downId = g ? g.dataset.region : null;
        if(g) dragSeen[downId] = 1;
      });
    });
    document.addEventListener('pointermove', function(e){
      if(!dragging) return;
      var t = document.elementFromPoint(e.clientX, e.clientY);
      var g = t && t.closest && t.closest('.bn-svg [data-region]');
      if(!g || !root.contains(g)) return;
      var id = g.dataset.region;
      if(dragSeen[id]) return;
      if(!moved && downId){ moved = true; apply(downId, st.brush, false); }
      moved = true; dragSeen[id] = 1;
      apply(id, st.brush, false);
    });
    document.addEventListener('pointerup', function(){
      if(dragging && moved){ var t = total(st.marks, st.child); say(st.quiz ? 'Painted.' : 'Painted. Total ' + fmt(t) + ' percent.'); }
      dragging = false;
    });
    REGIONS.forEach(function(r){
      var g = regs[r.id].g;
      g.addEventListener('click', function(){ if(!moved) apply(r.id, st.brush, true); });
      g.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); apply(r.id, st.brush, true); } });
    });

    root.querySelectorAll('[data-age]').forEach(function(b){ b.addEventListener('click', function(){
      if(st.quiz) return;
      st.child = b.dataset.age === 'child'; var t = paint();
      info.innerHTML = '<p>' + (st.child
        ? '<b>Child chart.</b> Only two regions change: the head and neck becomes 18% and each leg 13.5%. Everything else is counted as in an adult. These are the infant and small-child figures; as a child grows the head’s share shrinks and the legs’ grows toward the adult chart, and many protocols use a Lund-Browder chart for children.'
        : '<b>Adult Rule of Nines.</b> Head and neck 9%, each arm 9%, front of trunk 18%, back of trunk 18%, each leg 18%, genitals 1%.') + '</p>';
      say((st.child ? 'Child chart. ' : 'Adult chart. ') + 'Total ' + fmt(t) + ' percent.');
    }); });
    root.querySelectorAll('[data-brush]').forEach(function(b){ b.addEventListener('click', function(){ st.brush = +b.dataset.brush; paint(); }); });
    root.querySelector('.bn-clear').addEventListener('click', function(){
      if(st.quiz && (st.quiz.kind === 'estimate' || st.answered)) return;
      st.marks = {}; paint(); info.innerHTML = ''; say('Cleared. Total 0 percent.');
    });
    var quizBtn = root.querySelector('.bn-quiz');
    quizBtn.addEventListener('click', function(){ if(st.quiz) stopQuiz(); else nextQ(); });

    /* ---- quiz ---- */
    function lockAge(on){ root.querySelectorAll('[data-age]').forEach(function(b){ b.disabled = on; }); }
    function stopQuiz(){
      st.quiz = null; st.answered = false; st.show = null; st.marks = {};
      qpanel.hidden = true; quizBtn.setAttribute('aria-pressed', 'false'); quizBtn.textContent = 'Quiz me';
      lockAge(false); info.innerHTML = ''; paint();
    }
    function nextQ(forceId){
      var pool = ESTIMATE.map(function(q){ return { id:q.id, kind:'estimate', q:q }; })
        .concat(PAINT.map(function(q){ return { id:q.id, kind:'paint', q:q }; }));
      var p = forceId ? pool.filter(function(x){ return x.id === forceId; })[0] : null;
      p = p || pick(pool, st.misses, st.quiz && st.quiz.id);
      st.quiz = p; st.answered = false; st.show = null; st.marks = {};
      st.child = p.q.child; lockAge(true);
      quizBtn.setAttribute('aria-pressed', 'true'); quizBtn.textContent = 'Stop the quiz';
      info.innerHTML = '';
      if(p.kind === 'estimate') st.show = scenarioRegions(p.q);
      renderQ();
      paint();
      say('Question. ' + qText(p));
    }
    function qText(p){
      return p.kind === 'estimate' ? p.q.text + ' Estimate the total body surface area burned.'
        : 'Paint a ' + p.q.target + '% burn on ' + (p.q.child ? 'a small child' : 'an adult') + '. Any regions that add up to it.';
    }
    function renderQ(result){
      var p = st.quiz;
      var head = '<span class="bn-k">' + (p.kind === 'estimate' ? 'Estimate the TBSA' : 'Paint it') + ' · ' + (p.q.child ? 'child' : 'adult') + '</span>' +
        '<strong>' + esc(qText(p)) + '</strong>' + (st.tally[1] ? '<div class="bn-tally">' + st.tally[0] + ' of ' + st.tally[1] + ' right</div>' : '');
      var body = '';
      if(p.kind === 'estimate'){
        body = '<div class="bn-choices">' + choices(p.q).map(function(v){ return '<button type="button" data-ans="' + v + '">' + fmt(v) + '%</button>'; }).join('') + '</div>';
      } else if(!st.answered){
        body = '<p class="bn-hint">Tap or drag over regions, adding up the numbers yourself; the total shows when you check.</p><button type="button" class="bn-check">Check</button>';
      }
      qpanel.innerHTML = head + body + (result || '');
      qpanel.hidden = false;
      qpanel.querySelectorAll('[data-ans]').forEach(function(b){ b.addEventListener('click', function(){ answerEstimate(+b.dataset.ans, b); }); });
      var c = qpanel.querySelector('.bn-check'); if(c) c.addEventListener('click', answerPaint);
      var n = qpanel.querySelector('.bn-next'); if(n) n.addEventListener('click', function(){ nextQ(); });
    }
    function done(ok, label){
      st.tally[1]++; if(ok) st.tally[0]++; else st.misses[st.quiz.id] = (st.misses[st.quiz.id] || 0) + 1;
      if(window.LevlSound) window.LevlSound.answer(ok);
      record({ tool:'body-map', id:'burns-' + st.quiz.id, correct: ok, label: label, href:'body-map.html?mode=burns&q=' + st.quiz.id });
    }
    function breakdown(ids, child){
      // group halves of the same part into the part
      var used = {}, parts = [];
      Object.keys(PARTS).forEach(function(name){
        var ids2 = PARTS[name];
        if(ids2.length > 1 && ids2.every(function(i){ return ids.indexOf(i) >= 0; })){
          ids2.forEach(function(i){ used[i] = 1; });
          parts.push([name.replace(/^./, function(c){ return c.toUpperCase(); }), ids2.reduce(function(a, i){ return a + pct(i, child); }, 0)]);
        }
      });
      ids.forEach(function(i){ if(!used[i]) parts.push([R[i].name, pct(i, child)]); });
      return parts.map(function(p){ return esc(p[0]) + ' ' + fmt(p[1]); }).join(' + ');
    }
    function answerEstimate(v, btn){
      if(st.answered) return;
      st.answered = true;
      var q = st.quiz.q, ans = scenarioAnswer(q), ok = Math.abs(v - ans) < 0.01;
      var ids = scenarioRegions(q);
      ids.forEach(function(id){ st.marks[id] = 1; });
      st.show = null;
      var alt = scenarioAnswer(q, !q.child);
      var why = breakdown(ids, q.child) + ' = <b>' + fmt(ans) + '%</b>.';
      var trap = !ok && Math.abs(v - alt) < 0.01 ? ' ' + fmt(v) + '% is the ' + (q.child ? 'adult' : 'child') + ' chart: ' + (q.child ? 'a child’s head is 18% and each leg 13.5%.' : 'in an adult the head is 9% and each leg 18%.') : '';
      if(!ok && !trap && Math.abs(v - ans / 2) < 0.01) trap = ' Half the answer: each limb counts front and back together.';
      done(ok, 'Burn estimate: ' + q.text.replace(/\.$/, ''));
      renderQ('<div class="bn-verdict ' + (ok ? 'ok' : 'no') + '">' + (ok ? 'Right: ' : 'Not quite: ') + fmt(ans) + '%.</div><p>' + why + trap + '</p>' +
        '<div class="bn-actions"><button type="button" class="bn-next">Next question</button></div>');
      qpanel.querySelectorAll('[data-ans]').forEach(function(b){
        b.disabled = true;
        if(Math.abs(+b.dataset.ans - ans) < 0.01) b.classList.add('ok');
        else if(Math.abs(+b.dataset.ans - v) < 0.01) b.classList.add('no');
      });
      paint();
      if(window.LevlAnnounce) window.LevlAnnounce.answer(ok, breakdown(ids, q.child).replace(/<[^>]+>/g, '') + ' equals ' + fmt(ans) + ' percent.');
      var n = qpanel.querySelector('.bn-next'); if(n) n.focus({ preventScroll:true });
    }
    function answerPaint(){
      if(st.answered) return;
      var q = st.quiz.q, t = total(st.marks, q.child);
      if(t === 0){ qpanel.querySelector('.bn-hint').textContent = 'Paint some regions first: tap or drag over the body.'; return; }
      st.answered = true;
      var ok = Math.abs(t - q.target) < 0.01, diff = Math.round((t - q.target) * 100) / 100;
      var ids = Object.keys(st.marks);
      var full = ids.filter(function(i){ return st.marks[i] === 1; });
      var parts = breakdown(full, q.child);
      var halves = ids.filter(function(i){ return st.marks[i] === 0.5; }).map(function(i){ return esc(R[i].name) + ' half ' + fmt(pct(i, q.child) / 2); });
      var sum = [parts].concat(halves).filter(Boolean).join(' + ');
      var fix = '';
      if(!ok){
        var a = Math.abs(diff);
        fix = ' You are ' + fmt(a) + '% ' + (diff > 0 ? 'over' : 'under') + '. ' +
          (a === 9 ? 'One nine: an arm, the chest, the abdomen, or the front of an adult leg.' :
           a === 18 ? 'Two nines: an adult leg, or the whole front of the trunk.' :
           a === 4.5 ? 'Half a nine: the front or back of an arm, or of an adult head.' :
           a === 1 ? 'That is the genitals.' : 'Adult regions come in 9s and 4.5s, plus the 1% genitals.');
      }
      done(ok, 'Paint a ' + q.target + '% burn' + (q.child ? ' on a child' : ''));
      renderQ('<div class="bn-verdict ' + (ok ? 'ok' : 'no') + '">' + (ok ? 'Right: exactly ' + q.target + '%.' : 'You painted ' + fmt(t) + '%, not ' + q.target + '%.') + '</div>' +
        '<p>' + sum + ' = <b>' + fmt(t) + '%</b>.' + fix + (ok ? ' Many combinations work; what matters is knowing each region’s share.' : '') + '</p>' +
        '<div class="bn-actions"><button type="button" class="bn-next">Next question</button></div>');
      paint();
      if(window.LevlAnnounce) window.LevlAnnounce.answer(ok, 'You painted ' + fmt(t) + ' percent.' + fix);
      var n = qpanel.querySelector('.bn-next'); if(n) n.focus({ preventScroll:true });
    }

    paint();
    info.innerHTML = '<p>Tap a region to mark it burned, or drag across the body to paint. <b>Half</b> marks part of a region. Each number is that region’s share of the body.</p>';
    if(opts.q && (ESTIMATE.concat(PAINT)).some(function(x){ return x.id === opts.q; })) nextQ(opts.q);
    return { quiz: nextQ, stop: stopQuiz };
  }

  window.NremtBurns = {
    mount: mount,
    pure: { REGIONS: REGIONS, WHOLE: WHOLE, PARTS: PARTS, ESTIMATE: ESTIMATE, PAINT: PAINT, total: total,
      scenarioAnswer: scenarioAnswer, choices: choices }
  };
})();
