/* Turns the protocol diagrams into something you can be asked about.

   The page was eight correct flowcharts and no way to interact with them,
   which makes it a textbook with boxes. Reading a sequence and being able to
   produce it are different skills, and only the first one was available here —
   you can read "airway, then breathing, then circulation" twenty times and
   still stall at a scene, because recognition is not recall.

   THE DIAGRAMS ARE NOT DUPLICATED. This reads the DOM the page already
   renders, so the drill and the diagram are the same content by construction.
   Writing the eight protocols out again as a JavaScript array would have
   created exactly the failure this site keeps designing away from: two copies
   of a clinical sequence, one of which quietly goes stale — and in this
   subject a stale copy is not a cosmetic bug.

   Two question shapes, because the diagrams have two shapes:

     NEXT STEP   — here is the sequence so far, what follows?
     BRANCH      — here is the decision and which way it went, now what?

   Distractors come from the other diagrams. That matters: a wrong answer that
   is obviously wrong teaches nothing, and every box on this page is a real
   thing an EMT does — just not here, or not yet. Confusing "high-flow oxygen"
   with "control bleeding immediately" is the actual failure mode, so those are
   the choices offered.

   Nothing is scored, kept, or reported. This is a study aid on a page whose
   own banner says it is not a scored skill sheet, and it stays that way. */
(function(){
  var mount = document.getElementById('flowDrill');
  var host  = document.getElementById('flowDiagrams');
  if(!mount || !host) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  function shuffle(list){
    var a = list.slice();
    for(var i = a.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function text(el){ return (el.textContent || '').replace(/\s+/g, ' ').trim(); }

  /* ---- Read the page ----------------------------------------------------- */

  /* One entry per <h2> + .diagram-card pair, in document order. `steps` is the
     spine of the chart — the boxes you meet going straight down — and each
     branch hangs off whichever step preceded it. */
  function readDiagrams(){
    var out = [];
    host.querySelectorAll('.diagram-card').forEach(function(card){
      var title = '';
      var prev = card.previousElementSibling;
      while(prev && !title){
        if(prev.tagName === 'H2') title = text(prev);
        prev = prev.previousElementSibling;
      }

      var steps = [], branches = [], lastStep = null;
      Array.prototype.forEach.call(card.children, function(child){
        if(child.classList.contains('flow-box')){
          lastStep = text(child);
          steps.push({ text: lastStep, decision: child.classList.contains('decision') });
        } else if(child.classList.contains('flow-branch')){
          var arms = [];
          Array.prototype.forEach.call(child.children, function(col){
            var label = col.querySelector('.branch-label');
            var box   = col.querySelector('.flow-box');
            if(label && box) arms.push({ label: text(label), text: text(box) });
          });
          if(arms.length > 1 && lastStep) branches.push({ from: lastStep, arms: arms });
        }
      });

      if(steps.length > 1 || branches.length) out.push({ title: title, steps: steps, branches: branches });
    });
    return out;
  }

  var DIAGRAMS = readDiagrams();
  if(!DIAGRAMS.length) return;

  // Every box on the page, for drawing plausible wrong answers from.
  var ALL_BOXES = [];
  DIAGRAMS.forEach(function(d){
    d.steps.forEach(function(s){ ALL_BOXES.push(s.text); });
    d.branches.forEach(function(b){ b.arms.forEach(function(a){ ALL_BOXES.push(a.text); }); });
  });

  /* Distractors are drawn from other diagrams rather than from anywhere,
     and never from the diagram in play — a box that belongs to THIS protocol
     but comes later is not a wrong answer, it is a differently-timed right
     one, and marking it wrong would teach a falsehood. */
  function distractors(correct, diagram, n){
    var mine = {};
    diagram.steps.forEach(function(s){ mine[s.text] = true; });
    diagram.branches.forEach(function(b){ b.arms.forEach(function(a){ mine[a.text] = true; }); });

    var pool = ALL_BOXES.filter(function(t){
      return t !== correct && !mine[t] && t.length > 12;
    });
    var seen = {}, out = [];
    shuffle(pool).forEach(function(t){
      if(out.length >= n || seen[t]) return;
      seen[t] = true; out.push(t);
    });
    return out;
  }

  /* ---- Questions --------------------------------------------------------- */

  function nextStepQuestion(d){
    if(d.steps.length < 3) return null;
    // Never ask for the first box: "what happens before anything happens" has
    // no context to reason from, it is pure recall of an opening line.
    var i = 1 + Math.floor(Math.random() * (d.steps.length - 1));
    var correct = d.steps[i].text;
    var before = d.steps.slice(Math.max(0, i - 3), i);

    return {
      kind: 'next',
      title: d.title,
      lead: 'What comes next?',
      context: before.map(function(s){ return s.text; }),
      correct: correct,
      options: shuffle([correct].concat(distractors(correct, d, 3))),
      note: i === d.steps.length - 1 ? 'That is the last step of this sequence.' : ''
    };
  }

  function branchQuestion(d){
    if(!d.branches.length) return null;
    var b = d.branches[Math.floor(Math.random() * d.branches.length)];
    var arm = b.arms[Math.floor(Math.random() * b.arms.length)];

    /* The other arm of the same branch is the best wrong answer there is:
       it is what you do when the decision goes the other way, which is
       precisely the confusion worth catching. */
    var others = b.arms.filter(function(a){ return a !== arm; }).map(function(a){ return a.text; });
    var fill = distractors(arm.text, d, Math.max(0, 3 - others.length));

    return {
      kind: 'branch',
      title: d.title,
      lead: 'The decision goes this way — now what?',
      context: [b.from],
      branchLabel: arm.label,
      correct: arm.text,
      options: shuffle([arm.text].concat(others, fill)),
      note: ''
    };
  }

  var recent = [];
  function nextQuestion(){
    for(var tries = 0; tries < 30; tries++){
      var d = DIAGRAMS[Math.floor(Math.random() * DIAGRAMS.length)];
      var q = (Math.random() < 0.45 && d.branches.length) ? branchQuestion(d) : nextStepQuestion(d);
      if(!q || q.options.length < 2) continue;
      var key = q.kind + ':' + q.correct;
      if(recent.indexOf(key) >= 0) continue;
      recent.push(key);
      if(recent.length > 6) recent.shift();
      return q;
    }
    return null;
  }

  /* ---- Rendering --------------------------------------------------------- */

  var current = null, answered = false, tally = { right:0, total:0 };

  function render(){
    current = nextQuestion();
    answered = false;
    if(!current){ mount.innerHTML = '<div class="drill-card">Nothing left to ask.</div>'; return; }

    mount.innerHTML =
      '<div class="drill-card">' +
        '<div class="drill-head">' +
          '<span class="drill-proto">' + esc(current.title) + '</span>' +
          '<span class="drill-tally">' + (tally.total ? tally.right + ' / ' + tally.total : '') + '</span>' +
        '</div>' +
        '<div class="drill-context">' +
          current.context.map(function(t, i){
            return '<div class="drill-step">' + esc(t) + '</div>' +
                   (i < current.context.length - 1 ? '<div class="drill-arrow" aria-hidden="true">&darr;</div>' : '');
          }).join('') +
          (current.branchLabel
            ? '<div class="drill-arrow" aria-hidden="true">&darr;</div>' +
              '<div class="drill-branchlabel">' + esc(current.branchLabel) + '</div>'
            : '<div class="drill-arrow" aria-hidden="true">&darr;</div>') +
          '<div class="drill-step drill-step--blank">?</div>' +
        '</div>' +
        '<div class="drill-lead">' + esc(current.lead) + '</div>' +
        '<div class="drill-opts" role="group" aria-label="Choices">' +
          current.options.map(function(t, i){
            return '<button type="button" class="drill-opt" data-i="' + i + '">' + esc(t) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="drill-after" id="drillAfter" role="status" aria-live="polite"></div>' +
      '</div>';

    mount.querySelectorAll('.drill-opt').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(answered) return;
        choose(current.options[parseInt(btn.getAttribute('data-i'), 10)], btn);
      });
    });
  }

  function choose(picked, btn){
    answered = true;
    var right = picked === current.correct;
    tally.total++;
    if(right) tally.right++;

    mount.querySelectorAll('.drill-opt').forEach(function(b){
      b.disabled = true;
      if(b.textContent === current.correct) b.classList.add('is-right');
      else if(b === btn) b.classList.add('is-wrong');
    });

    var blank = mount.querySelector('.drill-step--blank');
    if(blank){
      blank.textContent = current.correct;
      blank.classList.remove('drill-step--blank');
      blank.classList.add('drill-step--filled');
    }

    var after = document.getElementById('drillAfter');
    after.innerHTML =
      '<div class="drill-verdict ' + (right ? 'ok' : 'no') + '">' +
        (right ? 'Yes.' : 'Not here.') +
        (current.note ? ' ' + esc(current.note) : '') +
        (right ? '' : ' The step that follows is shown above — the option you picked belongs to a different protocol.') +
      '</div>' +
      '<button type="button" class="drill-next" id="drillNext">Next</button>';
    var next = document.getElementById('drillNext');
    next.addEventListener('click', render);
    next.focus();
  }

  /* ---- Mode switch ------------------------------------------------------- */

  var toggle = document.getElementById('flowMode');
  if(toggle){
    toggle.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click', function(){
        var mode = b.getAttribute('data-mode');
        toggle.querySelectorAll('button').forEach(function(x){
          x.classList.toggle('on', x === b);
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        host.hidden = (mode !== 'read');
        mount.hidden = (mode !== 'drill');
        if(mode === 'drill' && !current) render();
      });
    });
  }
})();
