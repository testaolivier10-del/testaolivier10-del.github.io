/* Graded arrow-pushing as a lesson step.

   The ten mechanism walkthroughs are the best teaching on the site: they
   mount the molecule editor graded, so you place every arrow of a step
   yourself and a wrong arrow is named as the specific misconception it
   reveals rather than marked wrong. Only ten pages had it. The 58 lessons
   could not, because that step type lived inside mechanism-page.js, wired
   to that file's own card, progress and recorder.

   This is the same step, lifted out and given the lesson engine's step
   api instead, so a lesson's one hands-on step can be "draw the arrows"
   rather than "click these four sentences into order" — which is what
   most of them were.

   A config is the same shape the mechanism pages already use:

     molecule   molecule id from molecules.js
     arrows     [{from, to}] — every arrow the step requires. Keys are
                atom keys ('o2') or bonds ('bond:c-o1').
     hint       what to look for, shown above the editor
     why        shown after checking, right or wrong
     wrong      { 'from>to': 'why that particular arrow is wrong' } —
                the diagnosis, keyed by the arrow actually drawn
     concepts   concept ids this step is evidence about

   Order does not matter: `matches` pairs each drawn arrow against the
   expected set, so a student who draws a two-arrow step in the other
   order is not penalised for it. */
(function(){
  function mount(api, cfg){
    var Mo = window.OchemMolecules;
    var Ed = window.OchemMoleculeEditor;
    if(!Mo || !Ed){
      // Nothing to draw on; say so rather than rendering an empty card.
      api.card.innerHTML = '<div class="step-eyebrow">Draw the mechanism</div>' +
        '<p class="step-body">This step needs the molecule editor, which did not load.</p>' +
        api.nextButtonHtml('Continue', true);
      api.card.querySelector('#nextBtn').addEventListener('click', api.advance);
      return;
    }

    var need = cfg.arrows.length;
    api.card.innerHTML =
      '<div class="step-eyebrow">' + (cfg.eyebrow || 'Draw the mechanism') + '</div>' +
      '<h2 class="step-title">' + (cfg.title || 'Push the arrows.') + '</h2>' +
      (cfg.bodyHtml || '') +
      '<div class="click-hint">' + (cfg.hint ||
        ('Draw ' + (need === 1 ? 'the arrow' : 'all ' + need + ' arrows') +
         ' for this step. Click an electron source — a lone pair, an atom or a bond — then click where the electrons go.')) + '</div>' +
      '<div id="arrowHost"></div>' +
      api.feedbackHtml('fb') +
      '<div class="actions" style="justify-content:flex-start;">' +
        '<button class="btn-press" id="checkBtn" disabled>Check arrows</button>' +
      '</div>' +
      '<div id="afterBox"></div>';

    var fb = api.card.querySelector('#fb');
    var check = api.card.querySelector('#checkBtn');
    var editor = Ed.mount(api.card.querySelector('#arrowHost'), {
      molecule: cfg.molecule,
      // One spare, so a student can draw an extra arrow and be told it is
      // extra rather than being silently prevented from expressing it.
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
      api.record(correct, (cfg.concepts || [])[0]);

      var good = [], bad = [];
      drawn.forEach(function(a, i){
        (cfg.arrows.some(function(e){ return Ed.matches(mol, [a], [e]); }) ? good : bad).push(i);
      });
      editor.markResult(good, bad, '');
      check.remove();

      // Name the first wrong arrow the lesson authored a diagnosis for.
      var note = '';
      if(!correct && bad.length && cfg.wrong){
        var a = drawn[bad[0]];
        note = cfg.wrong[a.from + '>' + a.to] || '';
      }
      if(!correct && !note && !bad.length){
        var left = need - good.length;
        note = 'Right as far as it goes — ' + left + ' more ' +
               (left === 1 ? 'arrow is' : 'arrows are') + ' needed.';
      }
      api.showFeedback(fb, correct, '');
      fb.innerHTML = correct
        ? '<b>That is it.</b> ' + cfg.why
        : (note ? '<b>' + note + '</b> ' : '') + cfg.why;
      api.card.querySelector('#afterBox').innerHTML =
        api.nextButtonHtml(cfg.nextLabel || 'Continue', true);
      api.card.querySelector('#nextBtn').addEventListener('click', api.advance);
    });
  }

  window.OchemArrowStep = { mount: mount };
})();
