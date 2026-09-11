/* Assigning R/S from a wedge-dash drawing — the part of stereochemistry
   students actually fail.

   The R/S lesson explained the whole four-step algorithm and then asked
   the student to rank Br > Cl > F > H by atomic number. That is step 1 of
   4, and it is the step nobody gets wrong. The three that cost marks are:

     - reading a flat drawing as a three-dimensional centre at all;
     - noticing whether the lowest-priority group points toward you or away;
     - remembering to flip the answer when it points toward you.

   None of those were practised anywhere on the site. This module is the
   drill for them, shared so the R/S, chirality, stereocenters and Fischer
   lessons can all mount it instead of each drawing its own.

   A drill walks three graded stages against one drawing:

     1. rank the four substituents by CIP priority (click them in order);
     2. say which way the lowest-priority group points (toward / away);
     3. give the configuration, R or S.

   Stage 3 is the payoff: the two problems are deliberately laid out so
   one has the lowest priority on the dash and one has it on the wedge, so
   "trace the arrow and read it off" gets the second one wrong and the
   flip has to be understood rather than recited.

   The answer is DERIVED, never authored: given the screen coordinates of
   the three higher-priority substituents, the sign of the cross product
   gives their rotational sense, and a lowest-priority group on the wedge
   inverts it. That way a problem cannot be added with the wrong answer
   typed next to it, which for this topic is a very easy mistake to make.
*/
(function(){
  /* Room above and below is not slack: the priority badges sit outside the
     label boxes, and the lengthened out-of-plane bond pushes the bottom
     group further out than the other three. The top badge was being
     clipped by the viewBox before this. */
  var VW = 340, VH = 260;
  var CX = 170, CY = 116, R = 76;
  var LH = 26;              // label box height
  var GAP = 5;              // clear air between a bond's end and its label

  /* Labels are real formulas — CH₂CH₃ is six characters wide and will not
     fit in a fixed circle, which is what the first version of this drew.
     Boxes are sized to their text instead, and bonds stop short of the box
     rather than running under it. */
  function labelWidth(label){
    return Math.max(34, String(label).length * 8.4 + 14);
  }

  // Where a bond should stop: at the edge of the label box, along the bond
  // direction, so the hash rungs and the wedge have the full run to work in.
  function bondEnd(s, p){
    var a = s.angle * Math.PI / 180;
    var dx = Math.cos(a), dy = -Math.sin(a);
    var hw = labelWidth(s.label) / 2, hh = LH / 2;
    // Distance from the box centre to its edge in this direction.
    var tx = Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : Infinity;
    var ty = Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : Infinity;
    var inset = Math.min(tx, ty) + GAP;
    return { x: p.x - dx * inset, y: p.y - dy * inset };
  }

  // Screen coordinates are y-down, so a POSITIVE cross product here is a
  // clockwise turn on screen. (Top -> right -> bottom: v1=(1,1),
  // v2=(-1,1), cross = +2, and that reads clockwise.)
  function isClockwise(p1, p2, p3){
    var v1x = p2.x - p1.x, v1y = p2.y - p1.y;
    var v2x = p3.x - p2.x, v2y = p3.y - p2.y;
    return (v1x * v2y - v1y * v2x) > 0;
  }

  /* The out-of-plane bond is drawn longer than the three in-plane ones.
     With three groups in a Y at 90/205/335 the lower half of the figure is
     crowded, and the bond whose depth the student has to read is the one
     that must be unmistakable — so it gets the extra room, the same way a
     textbook draws it. */
  function radiusFor(s, problem){
    // A Fischer cross is drawn with four equal arms — the whole point of
    // the notation is that it looks flat and symmetric, with depth carried
    // by convention rather than by how the bond is drawn.
    if(problem && problem.layout === 'fischer') return R;
    return R * (s && (s.depth === 'wedge' || s.depth === 'dash') ? 1.32 : 1);
  }
  function pos(s, problem){
    var a = (typeof s === 'number' ? s : s.angle) * Math.PI / 180;
    var r = typeof s === 'number' ? R : radiusFor(s, problem);
    return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
  }

  /* A problem is four substituents, each with:
       label     what to draw
       priority  1 (highest) .. 4 (lowest)
       angle     degrees, standard maths convention (0 = right, 90 = up)
       depth     'plane' | 'wedge' (toward viewer) | 'dash' (away)
     Exactly one substituent must be the lowest priority, and it must sit
     on the wedge or the dash — which is how these are drawn in practice,
     and what makes the toward/away question meaningful.

     A problem may instead set layout:'fischer', in which case the four
     substituents sit on a cross at 0/90/180/270 and depth is implied by
     the projection's own convention rather than drawn: HORIZONTAL bonds
     come toward the viewer, VERTICAL bonds go away. Same three stages,
     same derivation — a Fischer projection is just a different notation
     for which bond points where, and the rule students are taught for it
     ("horizontal toward you") is exactly the toward/away question the
     drill already asks. */
  function isFischer(problem){ return problem.layout === 'fischer'; }

  function depthOf(problem, s){
    if(!isFischer(problem)) return s.depth;
    var a = ((s.angle % 360) + 360) % 360;
    var horizontal = (a > 45 && a < 135) || (a > 225 && a < 315) ? false : true;
    return horizontal ? 'wedge' : 'dash';
  }

  function solve(problem){
    var subs = problem.subs;
    var lowest = subs.filter(function(s){ return s.priority === 4; })[0];
    var top3 = subs.filter(function(s){ return s.priority !== 4; })
                   .sort(function(a, b){ return a.priority - b.priority; })
                   .map(function(s){ return pos(s); });
    var cw = isClockwise(top3[0], top3[1], top3[2]);
    // Clockwise with the lowest priority pointing away is R. If it points
    // toward the viewer you are reading the centre from the wrong side, so
    // the apparent sense is backwards and the answer flips.
    var towardViewer = depthOf(problem, lowest) === 'wedge';
    var config = (cw !== towardViewer) ? 'R' : 'S';
    return { clockwise: cw, towardViewer: towardViewer, config: config, lowest: lowest };
  }

  function bondSvg(s, problem){
    var e = bondEnd(s, pos(s, problem));
    var a = s.angle * Math.PI / 180;
    // Unit normal to the bond, for the wedge's base and the hash rungs.
    var nx = -Math.sin(a), ny = -Math.cos(a);
    // Fischer bonds are all plain lines; see radiusFor.
    if(problem && problem.layout === 'fischer'){
      return '<line x1="' + CX + '" y1="' + CY + '" x2="' + e.x + '" y2="' + e.y +
             '" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round"></line>';
    }

    if(s.depth === 'wedge'){
      /* Solid wedge: narrow at the stereocentre, widening toward the group
         — the convention that says "this bond comes out of the page at
         you". Getting the taper backwards would make the drawing say the
         opposite of what the step asks about. */
      return '<polygon points="' + CX + ',' + CY + ' ' +
        (e.x + nx * 8) + ',' + (e.y + ny * 8) + ' ' +
        (e.x - nx * 8) + ',' + (e.y - ny * 8) +
        '" fill="var(--ink)"></polygon>';
    }
    if(s.depth === 'dash'){
      // Hashed bond: rungs widening outward, receding behind the page.
      var out = '';
      var n = 6;
      for(var i = 0; i < n; i++){
        var t = 0.16 + (0.84 * i) / (n - 1);
        var mx = CX + (e.x - CX) * t, my = CY + (e.y - CY) * t;
        var w = 1.8 + 6.2 * t;
        out += '<line x1="' + (mx + nx * w) + '" y1="' + (my + ny * w) +
               '" x2="' + (mx - nx * w) + '" y2="' + (my - ny * w) +
               '" stroke="var(--ink)" stroke-width="2.3" stroke-linecap="round"></line>';
      }
      return out;
    }
    return '<line x1="' + CX + '" y1="' + CY + '" x2="' + e.x + '" y2="' + e.y +
           '" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round"></line>';
  }

  function drawing(problem, opts){
    opts = opts || {};
    var marks = opts.marks || {};
    var body = problem.subs.map(function(s){ return bondSvg(s, problem); }).join('');
    body += problem.subs.map(function(s){
      var p = pos(s, problem);
      var mark = marks[s.label];
      var w = labelWidth(s.label);
      /* The priority badge goes on whichever side of the label points away
         from the stereocentre, so it never lands on top of a bond. On a
         Fischer cross the left and right arms are horizontal, so their
         badges go beside the label rather than above or below it, where
         they would collide with the vertical arm's own label. */
      var sinA = Math.sin(s.angle * Math.PI / 180);
      var sideways = problem.layout === 'fischer' && Math.abs(sinA) < 0.3;
      var outward = sinA >= 0 ? -1 : 1;
      var badgeY = sideways ? p.y + 5 : p.y + outward * (LH / 2 + 11);
      var badgeX = sideways
        ? p.x + (Math.cos(s.angle * Math.PI / 180) >= 0 ? 1 : -1) * (w / 2 + 11)
        : p.x;
      return '<g class="sd-label">' +
        '<rect x="' + (p.x - w / 2) + '" y="' + (p.y - LH / 2) + '" width="' + w +
          '" height="' + LH + '" rx="9" fill="var(--paper)" ' +
          'stroke="var(--line)" stroke-width="2"></rect>' +
        '<text x="' + p.x + '" y="' + (p.y + 5) + '" text-anchor="middle" ' +
          'font-size="13.5" font-weight="800" fill="var(--ink)">' + s.label + '</text>' +
        (mark ? '<text x="' + badgeX + '" y="' + badgeY + '" text-anchor="middle" ' +
          'font-size="12" font-weight="900" fill="var(--accent)">' + mark + '</text>' : '') +
        '</g>';
    }).join('');
    body += '<circle cx="' + CX + '" cy="' + CY + '" r="5" fill="var(--ink)"></circle>';
    return '<div class="scene"><svg viewBox="0 0 ' + VW + ' ' + VH + '" role="img" aria-label="' +
      (problem.alt || 'Wedge-dash structure') + '">' + body + '</svg>' +
      (problem.caption ? '<div class="sd-caption">' + problem.caption + '</div>' : '') +
      '</div>';
  }

  /* mount(api, problem) runs the three stages inside one lesson step.
     `api` is the lesson engine's step api (record / advance / feedbackHtml
     / showFeedback / nextButtonHtml). */
  function mount(api, problem){
    var sol = solve(problem);
    var fischer = isFischer(problem);
    var stage = 0;
    var marks = {};
    var missed = false;

    function shell(eyebrow, title, body, extra){
      api.card.innerHTML =
        '<div class="step-eyebrow">' + eyebrow + '</div>' +
        '<h2 class="step-title">' + title + '</h2>' +
        (problem.intro && stage === 0 ? '<p class="step-body">' + problem.intro + '</p>' : '') +
        drawing(problem, { marks: marks }) +
        (body || '') +
        api.feedbackHtml('fb') +
        (extra || '');
    }

    function buttons(items){
      return '<div class="choice-row">' + items.map(function(it){
        return '<button class="choice-btn" data-v="' + it.v + '">' + it.label + '</button>';
      }).join('') + '</div>';
    }

    // ---- Stage 1: rank the four groups -------------------------------
    function rankStage(){
      var order = [];
      var wrong = false;
      var subs = problem.subs;
      shell('Visualize &amp; Interact',
        'Click the four groups in CIP priority order, highest first.',
        buttons(subs.map(function(s){ return { v: s.label, label: s.label }; })) +
        '<div class="count-hint" id="hint">Order so far: (none yet)</div>',
        api.nextButtonHtml('Next: which way does it point?', false));
      var fb = api.card.querySelector('#fb');
      var hint = api.card.querySelector('#hint');
      var next = api.card.querySelector('#nextBtn');
      api.card.querySelectorAll('.choice-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          if(btn.disabled) return;
          btn.disabled = true;
          var label = btn.getAttribute('data-v');
          var s = subs.filter(function(x){ return x.label === label; })[0];
          var expected = order.length + 1;
          order.push(label);
          if(s.priority !== expected){ wrong = true; btn.classList.add('wrong'); }
          else { btn.classList.add('correct'); }
          hint.textContent = 'Order so far: ' + order.join(' > ');
          if(order.length === subs.length){
            if(wrong) missed = true;
            api.record(!wrong);
            var right = subs.slice().sort(function(a, b){ return a.priority - b.priority; })
                            .map(function(x){ return x.label; }).join(' > ');
            api.showFeedback(fb, !wrong, (wrong ? 'Not quite. The order is ' + right + '. ' : 'Right — ' + right + '. ') + problem.priorityWhy);
            subs.forEach(function(x){ marks[x.label] = String(x.priority); });
            next.disabled = false;
          }
        });
      });
      next.addEventListener('click', function(){ stage = 1; render(); });
    }

    // ---- Stage 2: toward or away -------------------------------------
    function orientStage(){
      shell('Step 2 of 3',
        'Which way does the lowest-priority group (' + sol.lowest.label + ') point?',
        '<p class="step-body">' + (fischer
          ? 'Nothing here is drawn as a wedge — a Fischer projection carries depth by convention instead. <b>Horizontal bonds come toward you; vertical bonds go away from you.</b> So the answer depends only on which arm of the cross this group sits on.'
          : 'Look at how its bond is drawn. A solid wedge widens toward you, out of the page; a hashed bond recedes behind the page.') + '</p>' +
        buttons([
          { v: 'away', label: 'Away from you, behind the page' },
          { v: 'toward', label: 'Toward you, out of the page' }
        ]),
        api.nextButtonHtml('Next: read the rotation', false));
      var fb = api.card.querySelector('#fb');
      var next = api.card.querySelector('#nextBtn');
      api.card.querySelectorAll('.choice-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          var v = btn.getAttribute('data-v');
          var ok = (v === 'toward') === sol.towardViewer;
          api.card.querySelectorAll('.choice-btn').forEach(function(b){ b.disabled = true; });
          btn.classList.add(ok ? 'correct' : 'wrong');
          if(!ok) missed = true;
          api.record(ok);
          api.showFeedback(fb, ok, sol.towardViewer
            ? (sol.lowest.label + (fischer
                ? ' is on a horizontal arm, and horizontal means toward you in a Fischer projection.'
                : ' is on the bold wedge, so it points at you.') +
               ' That is the awkward case: you are looking at this centre from the wrong side, so whatever rotation you read off has to be flipped at the end.')
            : (sol.lowest.label + (fischer
                ? ' is on a vertical arm, and vertical means away from you in a Fischer projection.'
                : ' is on the hashed bond, so it points away from you.') +
               ' That is exactly the orientation the rule wants, so whatever rotation you read off is the answer directly, with no flip.'));
          next.disabled = false;
        });
      });
      next.addEventListener('click', function(){ stage = 2; render(); });
    }

    // ---- Stage 3: the configuration ----------------------------------
    function assignStage(){
      shell('Step 3 of 3 &middot; The assignment',
        'Trace 1 &rarr; 2 &rarr; 3. What is the configuration of this centre?',
        '<p class="step-body">' + (sol.towardViewer
          ? 'Remember what you just established: the lowest-priority group points <b>at you</b>, so the rotation you see is reversed.'
          : 'The lowest-priority group points away, so what you see is what you get.') + '</p>' +
        buttons([{ v: 'R', label: 'R' }, { v: 'S', label: 'S' }]),
        '<div id="doneBox"></div>');
      var fb = api.card.querySelector('#fb');
      api.card.querySelectorAll('.choice-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          var ok = btn.getAttribute('data-v') === sol.config;
          api.card.querySelectorAll('.choice-btn').forEach(function(b){ b.disabled = true; });
          btn.classList.add(ok ? 'correct' : 'wrong');
          if(!ok) missed = true;
          api.record(ok);
          var seen = sol.clockwise ? 'clockwise' : 'counterclockwise';
          api.showFeedback(fb, ok,
            'Tracing 1 → 2 → 3 as drawn goes ' + seen + '. ' +
            (sol.towardViewer
              ? ('The lowest-priority group points at you, so flip it: ' + seen +
                 ' as drawn becomes ' + (sol.clockwise ? 'counterclockwise' : 'clockwise') +
                 ' from the correct side. That makes this ' + sol.config + '.')
              : ('The lowest-priority group already points away, so no flip: ' +
                 seen + ' is ' + sol.config + '.')) +
            (problem.closing ? ' ' + problem.closing : ''));
          api.card.querySelector('#doneBox').innerHTML =
            api.nextButtonHtml(missed ? 'Continue' : 'Continue', true);
          api.card.querySelector('#nextBtn').addEventListener('click', api.advance);
        });
      });
    }

    function render(){
      if(stage === 0) rankStage();
      else if(stage === 1) orientStage();
      else assignStage();
    }
    render();
  }

  window.OchemStereoDrill = { mount: mount, solve: solve, drawing: drawing };
})();
