/* Article Analysis Studio trainer page (docs/appsych-spec.md sections 3.1 and 6). OWNED BY
   THIS TOOL ONLY (builder T1). Mounts into #app with ApPsychTools; the model is
   ApPsychMath.articleStudio (psychology/assets/tools/math/article-studio.js), the content
   psychology/data/tools/article-studio.json (served filtered as
   assets/tool-data/article-studio.json). The frame is ApPsychTools.modes
   (Explore, then Test yourself) on the Tool Studio.

   Explore: the stage is one invented study laid out as the exam lays it out
   (Introduction, Participants with a table, Method, Results with a graph
   drawn from the model's numbers). Every place an AAQ part is answered
   carries a small letter tag (A to F). The dock holds the part switch: pick
   a part (or tap its tag in the text) and its sentences light up and scroll
   into view, the dock says what earns the point, and "A typical miss"
   flips to the answer the readers refused with the slip named
   (docs/appsych-research/framework.md section 7). The result switch (as
   predicted, no real difference, the opposite) reruns the study, so the
   graph, the results text and parts C and F change together.
   Test yourself: ApPsychTools.drill over the model's generate(); the study
   is the stage, each step lights the section to read, and an answered step
   shows its tag and lights its sentences. */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.articleStudio || M.articleStudio.stub) return;
  var A = M.articleStudio, esc = T.esc;
  var PART = {}; A.PARTS.forEach(function(p){ PART[p.k] = p; });
  var STEP_PART = { method: 'A', what: 'B', how: 'B', diff: 'C', stat: 'C', rstat: 'C', ethics: 'D', ehow: 'D', gen: 'E', argue: 'F' };
  var SECTION_OF = { A: 'method', B: 'method', C: 'results', D: 'method', E: 'participants', F: 'results' };
  var RESULT = [{ v: 'support', label: 'As predicted' }, { v: 'null', label: 'No real difference' }, { v: 'reverse', label: 'The opposite' }];
  /* What each part asks and how the readers score it, in our own words (the
     2025-2026 scoring guidelines and Chief Reader Reports). */
  var ASK = {
    A: { verb: 'Identify', ask: 'the research method used in the study.', rule: 'One method, named exactly. An experiment needs a manipulated variable and random assignment; a correlational study only measures; naturalistic observation watches behavior where it happens.',
      slips: ['The wrong method (correlation, survey, naturalistic observation or meta-analysis when the study was an experiment).', 'Two methods at once, or a hybrid such as "an experimental correlation".', 'Mentioning random assignment or a questionnaire without naming the method.'] },
    B: { verb: 'State', ask: 'the operational definition of the variable.', rule: 'How this study measured it: what was counted or scored, on what scale, and when. Readers can repeat a study only from an operational definition.',
      slips: ['Describing the concept in general (what memory or stress is).', 'Naming a scale ("a Likert scale") without what was rated and the range.', 'Giving the other variable.'] },
    C: { verb: 'Explain', ask: 'what the statistic shows for these groups.', rule: 'Which group was higher, by how much, and what that means: a statistically significant difference is unlikely to be due to chance; a nonsignificant one could be. For r: the direction and strength of a relationship, never cause.',
      slips: ['Restating the means or r without saying what they show.', 'Reversing the direction or comparing the wrong pair of groups.', 'Defining "mean" or "statistically significant" in general.', '"Not significant" without saying it could be due to chance.'] },
    D: { verb: 'Identify and describe', ask: 'an ethical guideline the summary describes, and how the researchers applied it.', rule: 'Only a safeguard the summary actually describes, and the step the researchers took to apply it (since 2026 the "how" is required).',
      slips: ['A guideline the summary never mentions (debriefing, confidentiality or IRB review when absent).', 'A design feature such as random assignment.', 'The definition of the guideline instead of how it was applied.'] },
    E: { verb: 'Explain', ask: 'whether the results generalize to a named population.', rule: 'Yes, no or partly, argued from participant characteristics (age, place, culture, how they were recruited). "Partly" needs both sides.',
      slips: ['Arguing from sample size ("only 60 people").', 'Arguing from a design flaw, reliability or validity.', 'No population named.'] },
    F: { verb: 'Explain', ask: 'whether the results support or refute the hypothesis, using a specific result.', rule: 'Two points: a specific, accurately read result, and how it supports or refutes the hypothesis. A study supports an idea; it never proves it.',
      slips: ['Evidence with no explanation, or an explanation with no result.', 'Misreading the result.', 'Saying the study proves the idea.'] }
  };

  T.mount('article-studio', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'article-studio', labels: ['Explore', 'Test yourself'],
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------------ the paper */
  function graphSvg(ctx, st, phone){
    var W = phone ? 340 : 420, H = phone ? 230 : 240, L = 46, R = W - 14, top = 26, bot = H - 40, out = [], label;
    if(st.kind === 'means'){
      var max = ctx.dv.max || T.niceMax(Math.max.apply(null, st.means) * 1.18), step = T.niceStep(max, 5);
      var y = function(v){ return bot - v / max * (bot - top); };
      for(var v = 0; v <= max + 1e-9; v += step) out.push('<line class="as-grid" x1="' + L + '" x2="' + R + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="as-tk" x="' + (L - 6) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + M.fmt(v, 4) + '</text>');
      var n = ctx.groups.length, slot = (R - L) / n, bw = Math.min(70, slot * 0.56), cx = [];
      st.means.forEach(function(m, i){
        var x = L + slot * i + slot / 2; cx.push(x);
        out.push('<rect class="as-bar as-g' + i + '" x="' + (x - bw / 2).toFixed(1) + '" y="' + y(m).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (bot - y(m)).toFixed(1) + '" rx="3"/>');
        out.push('<text class="as-val" x="' + x.toFixed(1) + '" y="' + (y(m) - 6).toFixed(1) + '" text-anchor="middle">' + M.fixed(m, st.dec) + '</text>');
        out.push('<text class="as-cat" x="' + x.toFixed(1) + '" y="' + (bot + 17) + '" text-anchor="middle">' + esc(ctx.groups[i].label) + '</text>');
      });
      // The comparison the hypothesis makes, with its significance: the same fact as the results text.
      var a = Math.min(cx[st.hi], cx[st.lo]), b = Math.max(cx[st.hi], cx[st.lo]), yb = Math.min(y(st.means[st.hi]), y(st.means[st.lo])) - 24;
      yb = Math.max(top - 10, yb);
      out.push('<path class="as-brk" d="M' + a.toFixed(1) + ' ' + (yb + 7).toFixed(1) + 'V' + yb.toFixed(1) + 'H' + b.toFixed(1) + 'V' + (yb + 7).toFixed(1) + '"/><text class="as-sig" x="' + ((a + b) / 2).toFixed(1) + '" y="' + (yb - 5).toFixed(1) + '" text-anchor="middle">' + (st.sig ? 'p < .05' : 'not significant') + '</text>');
      out.push('<line class="as-axis" x1="' + L + '" x2="' + R + '" y1="' + bot + '" y2="' + bot + '"/><line class="as-axis" x1="' + L + '" x2="' + L + '" y1="' + top + '" y2="' + bot + '"/>');
      out.push('<text class="as-axl" x="' + L + '" y="' + (top - 12) + '">' + esc(ctx.dv.axis) + '</text>');
      label = 'Bar graph: ' + esc(ctx.dv.axis) + '. ' + ctx.groups.map(function(g, i){ return g.label + ' ' + M.fixed(st.means[i], st.dec); }).join(', ') + '. The difference between ' + ctx.groups[st.hi].label + ' and ' + ctx.groups[st.lo].label + ' is ' + (st.sig ? 'statistically significant.' : 'not statistically significant.');
    } else {
      var X = ctx.x, Y = ctx.y, sx = function(v){ return L + (v - X.range[0]) / (X.range[1] - X.range[0]) * (R - L); }, sy = function(v){ return bot - (v - Y.range[0]) / (Y.range[1] - Y.range[0]) * (bot - top); };
      var xs = T.niceStep(X.range[1] - X.range[0], 4), ys = T.niceStep(Y.range[1] - Y.range[0], 4);
      for(var gx = X.range[0]; gx <= X.range[1] + 1e-9; gx += xs) out.push('<line class="as-grid" x1="' + sx(gx).toFixed(1) + '" x2="' + sx(gx).toFixed(1) + '" y1="' + top + '" y2="' + bot + '"/><text class="as-tk" x="' + sx(gx).toFixed(1) + '" y="' + (bot + 15) + '" text-anchor="middle">' + M.fmt(gx, 4) + '</text>');
      for(var gy = Y.range[0]; gy <= Y.range[1] + 1e-9; gy += ys) out.push('<line class="as-grid" x1="' + L + '" x2="' + R + '" y1="' + sy(gy).toFixed(1) + '" y2="' + sy(gy).toFixed(1) + '"/><text class="as-tk" x="' + (L - 6) + '" y="' + (sy(gy) + 4).toFixed(1) + '" text-anchor="end">' + M.fmt(gy, 4) + '</text>');
      st.points.forEach(function(q){ out.push('<circle class="as-pt" cx="' + sx(q[0]).toFixed(1) + '" cy="' + sy(q[1]).toFixed(1) + '" r="4"/>'); });
      // The least-squares line (ApPsychStats.slope and intercept), clipped to the plot.
      var x0 = X.range[0], x1 = X.range[1], f = function(x){ return st.intercept + st.slope * x; };
      var y0 = Math.max(Y.range[0], Math.min(Y.range[1], f(x0))), y1 = Math.max(Y.range[0], Math.min(Y.range[1], f(x1)));
      if(st.slope){ x0 = (y0 - st.intercept) / st.slope; x1 = (y1 - st.intercept) / st.slope; x0 = Math.max(X.range[0], Math.min(X.range[1], x0)); x1 = Math.max(X.range[0], Math.min(X.range[1], x1)); }
      out.push('<line class="as-trend" x1="' + sx(x0).toFixed(1) + '" y1="' + sy(f(x0)).toFixed(1) + '" x2="' + sx(x1).toFixed(1) + '" y2="' + sy(f(x1)).toFixed(1) + '"/>');
      out.push('<line class="as-axis" x1="' + L + '" x2="' + R + '" y1="' + bot + '" y2="' + bot + '"/><line class="as-axis" x1="' + L + '" x2="' + L + '" y1="' + top + '" y2="' + bot + '"/>');
      out.push('<text class="as-axl" x="' + L + '" y="' + (top - 12) + '">' + esc(Y.axis) + '</text><text class="as-axl" x="' + R + '" y="' + (bot + 32) + '" text-anchor="end">' + esc(X.axis) + '</text>');
      out.push('<text class="as-sig" x="' + (R - 4) + '" y="' + (top + 14) + '" text-anchor="end">r = ' + A.rtxt(st.r2).replace(/<[^>]+>/g, '') + '</text>');
      label = 'Scatterplot of ' + Y.axis + ' against ' + X.axis + ' for ' + st.n + ' participants, with a line of best fit; r = ' + A.rtxt(st.r2) + ', ' + st.describe + '.';
    }
    return '<svg class="as-graph" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + out.join('') + '</svg>';
  }
  function paperHtml(ctx, st, o){
    o = o || {};
    var secs = A.summary(ctx, st);
    return '<article class="as-paper' + (o.tags ? ' has-tags' : '') + '" aria-label="Study summary: ' + esc(ctx.title) + '">' +
      '<header class="as-head"><p class="as-kicker">Invented study for practice</p><h3 class="as-title">' + esc(ctx.title) + '</h3></header>' +
      secs.map(function(s){
        var body = s.html;
        if(s.k === 'results') body += '<figure class="as-figure">' + graphSvg(ctx, st, o.phone) + '</figure>';
        return '<section class="as-sec" data-sec="' + s.k + '"><h4>' + s.title + '</h4>' + body + '</section>';
      }).join('') + '</article>';
  }
  /* A letter tag before the first sentence of each part: a button in explore,
     a quiet label once a drill step is answered. */
  function tag(paper, explore){
    var seen = {};
    Array.prototype.slice.call(paper.querySelectorAll('.as-hl')).forEach(function(el){
      var k = el.getAttribute('data-part');
      if(seen[k]) return; seen[k] = true;
      var b = document.createElement(explore ? 'button' : 'span');
      b.className = 'as-tag'; b.setAttribute('data-part', k); b.textContent = k;
      if(explore){ b.type = 'button'; b.setAttribute('aria-label', 'Part ' + k + ', ' + PART[k].name.toLowerCase()); }
      else b.setAttribute('aria-hidden', 'true');
      el.parentNode.insertBefore(b, el);
    });
  }
  function light(paper, k, on){
    paper.querySelectorAll('.as-hl').forEach(function(el){ if(el.getAttribute('data-part') === k) el.classList.toggle('is-on', on !== false); else if(on !== false && !el.classList.contains('is-kept')) el.classList.remove('is-on'); });
    paper.querySelectorAll('.as-tag').forEach(function(el){ el.classList.toggle('is-on', el.getAttribute('data-part') === k); if(el.tagName === 'BUTTON') el.setAttribute('aria-pressed', String(el.getAttribute('data-part') === k)); });
  }
  /* Bring an element into view inside its own scrolling box (the stage), never by scrolling the page. */
  function reveal(el){
    if(!el) return;
    var box = el.closest('.ls-stage-body') || el.closest('.as-fig');
    if(!box || box.scrollHeight <= box.clientHeight + 2) return;
    var a = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    var to = box.scrollTop + (a.top - b.top) - Math.max(16, (box.clientHeight - a.height) / 3);
    try{ box.scrollTo({ top: Math.max(0, to), behavior: T.reduced() ? 'auto' : 'smooth' }); }catch(e){ box.scrollTop = Math.max(0, to); }
  }
  function phone(){ return (window.innerWidth || 1280) <= 640; }

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var ctxs = data.contexts || [], ctx = ctxs[0], variant = 'support', seed = 11, part = 'A', view = 'earn', touched = false, LS = null, nid = T.nid('as');
    var st = A.study(ctx, variant, M.rng(seed));
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem as-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Article analysis studio</h2>' +
      '<div class="as-fig"></div>' +
      '<div class="as-ctl">' +
        '<div class="as-parts" role="group" aria-label="AAQ part">' + A.PARTS.map(function(p){ return '<button type="button" class="as-pbtn" data-part="' + p.k + '" aria-pressed="false"><span class="as-pk">' + p.k + '</span><span class="as-pn">' + esc(p.name) + '</span></button>'; }).join('') + '</div>' +
        '<div class="as-pcard" aria-live="polite"></div>' +
        '<div class="as-res-row"><span class="as-res-k" id="' + nid + '-r">Result</span><div class="ls-seg as-res" role="group" aria-labelledby="' + nid + '-r">' + RESULT.map(function(x){ return '<button type="button" data-v="' + x.v + '" aria-pressed="false">' + x.label + '</button>'; }).join('') + '</div></div>' +
      '</div>' +
      '<div class="as-say"></div>' +
      T.moreHtml('<div class="as-pick"></div><div class="bt-buttons"><button type="button" class="bt-btn as-new">Run it again (new numbers)</button></div>', 'choose a study') +
      '<div class="as-nums"></div><p class="sr-only as-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.as-live'));
    var cue = T.cue('Tap a part, A to F, to see where its answer is in the study.');
    $('.as-ctl').insertBefore(cue.el, $('.as-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var pick = T.choiceSelect({ label: 'Study', options: ctxs.map(function(c){ return { value: c.id, label: c.title }; }), value: ctx.id, onChange: function(v){ act(); ctx = ctxs.filter(function(c){ return c.id === v; })[0] || ctxs[0]; seed = 11; if(ctx.variants && ctx.variants.indexOf(variant) < 0) variant = ctx.variants[0]; rerun(); say('Study: ' + ctx.title + '. ' + plain(A.parts(ctx, st)[part].earns)); } });
    $('.as-pick').appendChild(pick.el);
    function plain(h){ var d = document.createElement('div'); d.innerHTML = h; return d.textContent; }
    function rerun(){ st = A.study(ctx, variant, M.rng(seed)); draw(); }
    function onClick(e){
      var b = e.target.closest('.as-pbtn, .as-tag');
      if(b && b.tagName === 'BUTTON'){ act(); setPart(b.getAttribute('data-part'), true); return; }
      var h = e.target.closest('.as-paper .as-hl');
      if(h){ act(); setPart(h.getAttribute('data-part'), false); return; }
      var rv = e.target.closest('.as-res button');
      if(rv){ act(); variant = rv.getAttribute('data-v'); rerun(); say('Result ' + rv.textContent.toLowerCase() + '. ' + plain(A.statRight(ctx, st))); return; }
      var fl = e.target.closest('.as-flip button');
      if(fl){ act(); view = fl.getAttribute('data-v'); card(); return; }
      if(e.target.closest('.as-new')){ act(); seed = 11 + Math.floor(Math.random() * 9000); rerun(); say('New numbers. ' + plain(A.statRight(ctx, st))); }
    }
    host.addEventListener('click', onClick);
    function setPart(k, scroll){
      part = k; view = 'earn';
      sync(); card();
      var first = $('.as-paper .as-hl[data-part="' + k + '"]');
      if(scroll !== false) reveal(first);
      say('Part ' + k + ', ' + PART[k].name.toLowerCase() + '. Look in ' + SECTION_OF[k] + '. ' + plain(A.parts(ctx, st)[k].earns));
    }
    function sync(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.as-pbtn').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-part') === part)); });
      root.querySelectorAll('.as-res button').forEach(function(b){
        var v = b.getAttribute('data-v'), ok = !ctx.variants || ctx.variants.indexOf(v) > -1;
        b.setAttribute('aria-pressed', String(v === variant)); b.disabled = !ok; b.hidden = !ok;
      });
      var paper = $('.as-paper'); if(paper) light(paper, part);
      if(LS && LS.setupRow) LS.setupRow.setup(ctx.title);
    }
    function card(){
      var P = A.parts(ctx, st)[part], a = ASK[part], pp = PART[part];
      var el = $('.as-pcard');
      el.innerHTML = '<p class="as-ph"><span class="as-pl">Part ' + part + '</span> ' + esc(pp.name) + ' <span class="as-pts">' + pp.pts + (pp.pts > 1 ? ' points' : ' point') + '</span></p>' +
        '<p class="as-ask"><b>' + a.verb + '</b> ' + a.ask + '</p>' +
        '<div class="ls-seg as-flip" role="group" aria-label="Show"><button type="button" data-v="earn" aria-pressed="' + (view === 'earn') + '">Earns the point</button><button type="button" data-v="miss" aria-pressed="' + (view === 'miss') + '">A typical miss</button></div>' +
        (view === 'earn' ? '<p class="as-ans is-earn"><span class="psy-mark ok">Earns</span> ' + P.earns + '</p>'
          : '<p class="as-ans is-miss"><span class="psy-mark no">Misses</span> ' + P.misses + '</p><p class="as-slip"><b>The slip:</b> ' + esc(P.slip) + '</p>');
      words();
    }
    function words(){
      var a = ASK[part], P = A.parts(ctx, st)[part];
      var head = '<b>Part ' + part + ': look in ' + SECTION_OF[part] + '.</b> ' + esc(P.where);
      var why = '<p>' + esc(a.rule) + '</p><p class="as-why-k">What the readers saw students miss</p><ul>' + a.slips.map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
      T.explain($('.as-say'), head, why);
      if(LS){
        LS.caption('<b>Part ' + part + ', ' + esc(PART[part].name.toLowerCase()) + ':</b> ' + esc(P.where), 'explore');
        LS.pills([{ html: 'Part ' + part + ' · ' + PART[part].pts + ' pt', tone: 'accent' }, { html: RESULT.filter(function(x){ return x.v === variant; })[0].label, tone: 'ghost' }], 'left', 'explore');
        if(LS.why) LS.why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      }
    }
    function nums(){
      var rows;
      if(st.kind === 'means') rows = '<table class="ls-tbl"><caption>The results, as the graph shows them</caption><thead><tr><th scope="col">Group</th><th scope="col">Participants</th><th scope="col">Mean</th></tr></thead><tbody>' +
        ctx.groups.map(function(g, i){ return '<tr><th scope="row">' + esc(g.label) + '</th><td>' + st.per + '</td><td>' + M.fixed(st.means[i], st.dec) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<p class="bt-small">Difference between ' + esc(ctx.groups[st.hi].label) + ' and ' + esc(ctx.groups[st.lo].label) + ': ' + M.fixed(st.diff, st.dec) + ', ' + (st.sig ? 'statistically significant (p &lt; .05).' : 'not statistically significant.') + '</p>';
      else rows = '<table class="ls-tbl"><caption>The results</caption><tbody><tr><th scope="row">Participants</th><td>' + st.n + '</td></tr><tr><th scope="row">Correlation</th><td>r = ' + A.rtxt(st.r2) + ' (' + esc(st.describe) + ')</td></tr><tr><th scope="row">Line of best fit</th><td>slope ' + M.fmt(st.slope, 3) + ' hours per mg</td></tr></tbody></table>';
      var rub = '<table class="ls-tbl"><caption>The 7 points of the AAQ</caption><thead><tr><th scope="col">Part</th><th scope="col">Asks for</th><th scope="col">Points</th></tr></thead><tbody>' +
        A.PARTS.map(function(p){ return '<tr><th scope="row">' + p.k + '</th><td>' + esc(p.name) + '</td><td>' + p.pts + '</td></tr>'; }).join('') + '</tbody></table>';
      $('.as-nums').innerHTML = '<h3 class="ls-title-l">This study\'s numbers</h3>' + rows + '<h3 class="ls-title-l">How the AAQ is scored</h3>' + rub;
    }
    function draw(){
      var fig = $('.as-fig'), keep = fig.querySelector('.as-paper'), top = 0, box = fig.closest('.ls-stage-body');
      if(box) top = box.scrollTop;
      fig.innerHTML = paperHtml(ctx, st, { tags: true, phone: phone() });
      tag(fig.querySelector('.as-paper'), true);
      if(box && keep) box.scrollTop = top;
      sync(); card(); nums();
    }
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.as-fig')], dock: [$('.as-ctl')], setup: 'Study', moreLabel: 'Choose a study', why: [$('.as-say')], details: [$('.as-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      draw();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.as-pbtn[data-part="C"]'), text: 'Start here: tap a part' });
      var w = window.innerWidth, t = null;
      window.addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(function(){ if((window.innerWidth <= 640) !== (w <= 640)){ w = window.innerWidth; draw(); } }, 120); });
    }
    draw();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    var byId = {}; (data.contexts || []).forEach(function(c){ byId[c.id] = c; });
    T.drill(host, data, { slug: 'article-studio', noun: 'drill',
      generate: function(r, ctx, type){ return A.generate(r, ctx, type); },
      types: A.TYPES.map(function(t){ return { value: t, label: A.TYPE_LABEL[t] }; }),
      typeLabel: 'Parts to practice',
      newLabel: 'New study',
      title: function(p){ return A.TYPE_LABEL[p.type] + ': ' + byId[p.ctx].title; },
      extra: function(el, p, api){
        el.innerHTML = paperHtml(byId[p.ctx], p.study, { phone: phone() });
        api.paper = el.querySelector('.as-paper');
        look(api, 0);
      },
      onStep: function(s, right, api){
        var k = STEP_PART[s.key], paper = api.paper;
        if(!paper.querySelector('.as-tag[data-part="' + k + '"]')){
          var first = paper.querySelector('.as-hl[data-part="' + k + '"]');
          if(first){ var t = document.createElement('span'); t.className = 'as-tag is-done'; t.setAttribute('data-part', k); t.setAttribute('aria-hidden', 'true'); t.textContent = k; first.parentNode.insertBefore(t, first); }
        }
        paper.querySelectorAll('.as-hl[data-part="' + k + '"]').forEach(function(el){ el.classList.add('is-on', 'is-kept'); });
        look(api, api.problem.steps.indexOf(s) + 1);
      }
    });
  }
  /* The section to read for the current step gets a soft edge (the readers'
     advice: mine the summary), and comes into view on the stage. */
  function look(api, i){
    var paper = api.paper, s = api.problem.steps[i];
    paper.querySelectorAll('.as-sec').forEach(function(x){ x.classList.remove('is-look'); });
    if(!s) return;
    var sec = paper.querySelector('.as-sec[data-sec="' + SECTION_OF[STEP_PART[s.key]] + '"]');
    if(sec){ sec.classList.add('is-look'); setTimeout(function(){ reveal(sec.querySelector('h4')); }, 30); }
  }
})();
