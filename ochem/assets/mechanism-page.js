/* Generic driver for the mechanism walkthroughs.

   The four original mechanism pages (sn1, sn2, e1, e2) each hand-rolled their
   own step loop, their own atom-click handling and their own inline SVG —
   about four hundred lines apiece, and four slightly different answers to the
   same problems. Adding six more that way would have meant six more copies
   drifting apart, so these are driven from a config instead: each page
   supplies window.OCHEM_MECHANISM and this file does the rest.

   The important difference from the originals is the `draw` step. Those pages
   ask you to click one atom and then another, which is arrow-pushing with the
   answer half-given. Here the molecule editor is mounted graded, so you place
   every arrow of the step yourself and a wrong one is diagnosed by name.

   Progress deliberately does NOT go through OchemCurriculum.beginLessonRun:
   these share a topic id with the lesson of the same name, and both writing
   run state for one topic would have each clobbering the other's resume
   position. Concept mastery is recorded, through the same shared recorder
   the lessons use, so a mechanism walkthrough counts exactly like a lesson. */
(function(){
  var CFG = window.OCHEM_MECHANISM;
  if(!CFG) return;

  var Mo = window.OchemMolecules;
  var Ed = window.OchemMoleculeEditor;
  var M  = window.OchemMastery;
  var CU = window.OchemCurriculum;

  var card = document.getElementById('card');
  var progFill = document.getElementById('progFill');
  var progLabel = document.getElementById('progLabel');
  if(!card) return;

  var steps = CFG.steps;
  var step = 0;
  var rec = M ? M.lessonRecorder(CFG.topicId) : null;

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  var SB = window.OchemStepBack;

  function record(correct, cfg){
    /* Answering a step again after stepping back is a re-read, not new
       evidence — see step-back.js. */
    if(SB && SB.isReplay()) return;
    if(CU) CU.recordAttempt(CFG.topicId, correct);
    if(rec) rec(correct, step, { concepts: cfg.concepts });
  }

  function updateProgress(){
    var pct = Math.round((step / (steps.length - 1)) * 100);
    progFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    progLabel.textContent = 'Step ' + (step + 1) + ' / ' + steps.length;
  }

  function head(cfg){
    return (cfg.eyebrow ? '<div class="step-eyebrow">' + esc(cfg.eyebrow) + '</div>' : '') +
           (cfg.title ? '<h2 class="step-title">' + cfg.title + '</h2>' : '') +
           (cfg.bodyHtml || '');
  }
  function nextBtn(label, enabled){
    return '<div class="actions"><button class="btn-press" id="nextBtn"' +
           (enabled ? '' : ' disabled') + '>' + esc(label || 'Continue') + '</button></div>';
  }
  function doneBox(){
    return '<div class="actions" style="margin-top:8px;flex-wrap:wrap;">' +
      '<a href="../practice.html?topic=' + esc(CFG.topicId) + '" class="btn-press">Practise this</a>' +
      '<a href="../learn.html" class="btn-press alt">Back to Learn</a>' +
    '</div>';
  }
  function advance(){ step++; render(); }
  function goBack(){ if(step > 0){ step--; render(); } }
  if(SB) SB.mount(card, goBack);

  function renderExplain(cfg){
    card.innerHTML = head(cfg) +
      (cfg.molecule ? Mo.svg(cfg.molecule, { clickable: [], caption: cfg.caption }) : '') +
      nextBtn(cfg.nextLabel, true);
    card.querySelector('#nextBtn').addEventListener('click', advance);
  }

  /* The graded editor. Unlike the older pages' two-click prompts, nothing here
     tells you where the arrow starts — you have to know. */
  function renderDraw(cfg){
    var need = cfg.arrows.length;
    card.innerHTML = head(cfg) +
      '<div class="click-hint">' + esc(cfg.hint ||
        ('Draw ' + (need === 1 ? 'the arrow' : 'all ' + need + ' arrows') +
         ' for this step. Click an electron source — a lone pair, an atom or a bond — then click where the electrons go.')) + '</div>' +
      '<div id="mechHost"></div>' +
      '<div class="feedback" id="fb"></div>' +
      '<div class="actions" style="justify-content:flex-start;">' +
        '<button class="btn-press" id="checkBtn" disabled>Check arrows</button>' +
      '</div>' +
      '<div id="afterBox"></div>';

    var host = card.querySelector('#mechHost');
    var fb = card.querySelector('#fb');
    var check = card.querySelector('#checkBtn');
    var editor = Ed.mount(host, {
      molecule: cfg.molecule,
      maxArrows: need + 1,
      caption: cfg.caption,
      onChange: function(state){
        check.disabled = !state.arrows.length;
        check.textContent = state.arrows.length === need
          ? 'Check arrows' : 'Check ' + state.arrows.length + ' of ' + need;
      }
    });

    check.addEventListener('click', function(){
      var drawn = editor.state().arrows;
      if(!drawn.length) return;
      var mol = Mo.get(cfg.molecule);
      var correct = Ed.matches(mol, drawn, cfg.arrows);
      record(correct, cfg);

      var good = [], bad = [];
      drawn.forEach(function(a, i){
        (cfg.arrows.some(function(e){ return Ed.matches(mol, [a], [e]); }) ? good : bad).push(i);
      });
      editor.markResult(good, bad, '');
      check.remove();

      // Name the first wrong arrow where the page authored a diagnosis for it.
      var note = '';
      if(!correct && bad.length && cfg.wrong){
        var a = drawn[bad[0]];
        note = cfg.wrong[a.from + '>' + a.to] || '';
      }
      if(!correct && !note && bad.length === 0){
        note = 'Right as far as it goes — ' + (need - good.length) +
               ' more ' + (need - good.length === 1 ? 'arrow is' : 'arrows are') + ' needed.';
      }
      fb.className = 'feedback show ' + (correct ? 'good' : 'bad');
      fb.innerHTML = correct
        ? '<b>That is it.</b> ' + cfg.why
        : (note ? '<b>' + note + '</b> ' : '') + cfg.why;
      card.querySelector('#afterBox').innerHTML = nextBtn(cfg.nextLabel, true);
      card.querySelector('#nextBtn').addEventListener('click', advance);
    });
  }

  function renderChoice(cfg){
    var isFinal = cfg.type === 'final';
    card.innerHTML = head(cfg) +
      (cfg.molecule ? Mo.svg(cfg.molecule, { clickable: [], caption: cfg.caption }) : '') +
      '<div class="choice-row">' + cfg.options.map(function(o, i){
        return '<button class="choice-btn" data-i="' + i + '">' + o + '</button>';
      }).join('') + '</div>' +
      '<div class="feedback" id="fb"></div>' +
      (isFinal ? '<div id="afterBox"></div>' : nextBtn(cfg.nextLabel, false));

    var fb = card.querySelector('#fb');
    var next = isFinal ? null : card.querySelector('#nextBtn');
    card.querySelectorAll('.choice-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var i = parseInt(btn.getAttribute('data-i'), 10);
        var ok = i === cfg.correctIndex;
        record(ok, cfg);
        card.querySelectorAll('.choice-btn').forEach(function(b){ b.disabled = true; });
        btn.classList.add(ok ? 'correct' : 'wrong');
        fb.className = 'feedback show ' + (ok ? 'good' : 'bad');
        fb.innerHTML = ok
          ? '<b>Correct.</b> ' + cfg.why
          : '<b>' + ((cfg.wrong && cfg.wrong[i]) || 'Not quite.') + '</b> ' + cfg.why;
        if(isFinal){
          if(M) M.noteLesson(CFG.topicId, 'mechanism');
          if(CU && CU.completeLessonRun) CU.completeLessonRun(CFG.topicId);
          card.querySelector('#afterBox').innerHTML = doneBox();
        } else {
          next.disabled = false;
        }
      });
    });
    if(next) next.addEventListener('click', advance);
  }

  function render(){
    updateProgress();
    if(SB) SB.sync(step);
    var cfg = steps[step];
    if(cfg.type === 'explain') return renderExplain(cfg);
    if(cfg.type === 'draw') return renderDraw(cfg);
    return renderChoice(cfg);
  }

  render();
})();
