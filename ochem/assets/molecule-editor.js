/* An editable molecule: click to push electrons.

   Every interactive question up to now has been a *selection* — click the
   right atom, pick the right order, choose the right arrow from a list. This
   is the first thing on the site where the student produces the answer
   rather than recognizing it, which is the whole difference between knowing
   that an arrow goes from the hydroxide to the carbon and being able to draw
   a mechanism on an exam.

   One component, two mounts, because the difference between Tools and
   Practice is grading, not interactivity:
     - Tools mounts it ungraded. No right answer, nothing recorded; you push
       electrons around to see what happens.
     - Practice mounts the same widget with an expected answer attached, and
       a wrong arrow feeds the diagnostic engine like any other wrong answer.

   Drawing an arrow is two clicks: the source (a lone pair, an atom, or a
   BOND — half of arrow-pushing starts at a bond) then the destination. Click
   a drawn arrow to remove it. That is deliberately the same gesture the four
   hand-written mechanism pages already use, so the skill transfers.

   State is `{ arrows: [{from, to}] }` where each endpoint is an atom key or
   "bond:a-b". Nothing here writes to the mastery engine; the caller decides
   whether this was an answer. */
(function(){
  var Mol = window.OchemMolecules;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* Arrow identity is order-sensitive (C->Br is not Br->C) but bond endpoints
     are not, so compare through the molecule's own bond matcher. */
  function sameEndpoint(mol, a, b){
    if(a === b) return true;
    if(!a || !b) return false;
    if(a.indexOf('bond:') === 0 && b.indexOf('bond:') === 0){
      var m = /^bond:(.+?)-(.+)$/.exec(b);
      return m ? Mol.sameBond(a, { a:m[1], b:m[2] }) : false;
    }
    return false;
  }
  function sameArrow(mol, x, y){
    return sameEndpoint(mol, x.from, y.from) && sameEndpoint(mol, x.to, y.to);
  }

  function labelOf(mol, key){
    if(!key) return '';
    if(key.indexOf('bond:') === 0){
      var m = /^bond:(.+?)-(.+)$/.exec(key);
      if(!m) return 'a bond';
      return 'the ' + Mol.labelFor(mol, m[1]) + '–' + Mol.labelFor(mol, m[2]) + ' bond';
    }
    return Mol.labelFor(mol, key);
  }

  /* mount(container, config) -> controller

       molecule    molecule id or object
       arrows      starting arrows (default none)
       readonly    render only, no interaction
       toolbar     show Undo / Clear (default true when editable)
       maxArrows   stop accepting new arrows past this many (default 4)
       caption     override the molecule's caption ('' hides it)
       onChange(state, editor)   after every add/remove
       hint        text under the toolbar; defaults to a usage line
  */
  function mount(container, config){
    config = config || {};
    var mol = typeof config.molecule === 'string' ? Mol.get(config.molecule) : config.molecule;
    if(!container || !mol) return null;

    var arrows = (config.arrows || []).slice();
    var pending = null;          // first click of an in-progress arrow
    var readonly = !!config.readonly;
    var showToolbar = config.toolbar !== undefined ? config.toolbar : !readonly;
    var maxArrows = config.maxArrows === undefined ? 4 : config.maxArrows;
    var locked = false;          // set by markResult so feedback can't be edited over
    var status = '';
    var marks = {};              // {correct:[], wrong:[]} arrow indices after grading

    function state(){ return { arrows: arrows.slice() }; }

    function defaultHint(){
      if(readonly || locked) return '';
      if(pending) return 'Now click where those electrons go.';
      if(arrows.length >= maxArrows) return 'That is as many arrows as this step needs. Undo one to change it.';
      return 'Click an electron source — a lone pair, an atom, or a bond — then click where the electrons go.';
    }

    function render(){
      var interactive = !readonly && !locked;
      var chosen = pending ? [pending] : [];
      var drawn = arrows.map(function(a, i){
        var color = 'var(--accent)';
        if(marks.correct && marks.correct.indexOf(i) !== -1) color = 'var(--good)';
        if(marks.wrong && marks.wrong.indexOf(i) !== -1) color = 'var(--bad)';
        return { from: a.from, to: a.to, color: color };
      });

      container.innerHTML =
        Mol.svg(mol, {
          clickable: interactive ? 'all' : [],
          clickableBonds: interactive ? 'all' : [],
          chosen: chosen,
          arrows: drawn,
          caption: config.caption
        }) +
        // Toolbar goes away once the answer is graded: live-looking Undo and
        // Clear buttons that silently do nothing are worse than no buttons.
        (showToolbar && !locked ? toolbarHtml() : '') +
        (status ? '<div class="med-status">' + esc(status) + '</div>' : '') +
        (defaultHint() || config.hint
          ? '<div class="click-hint">' + esc(config.hint || defaultHint()) + '</div>' : '');

      if(interactive) bind();
      if(showToolbar && !locked) bindToolbar();
    }

    function toolbarHtml(){
      var n = arrows.length;
      return '<div class="med-bar">' +
        '<span class="med-count">' + n + (n === 1 ? ' arrow' : ' arrows') + '</span>' +
        '<button type="button" class="med-btn" data-act="undo"' + (n ? '' : ' disabled') + '>Undo</button>' +
        '<button type="button" class="med-btn" data-act="clear"' + (n ? '' : ' disabled') + '>Clear</button>' +
      '</div>';
    }

    function bindToolbar(){
      container.querySelectorAll('.med-bar .med-btn').forEach(function(b){
        b.addEventListener('click', function(){
          if(locked) return;
          if(b.getAttribute('data-act') === 'undo') arrows.pop();
          else arrows = [];
          pending = null; status = '';
          render();
          if(config.onChange) config.onChange(state(), api);
        });
      });
    }

    function bind(){
      var targets = container.querySelectorAll('.atom, .obond');
      targets.forEach(function(el){
        var key = el.getAttribute('data-key');
        el.addEventListener('click', function(e){ e.stopPropagation(); pick(key); });
        el.addEventListener('keydown', function(e){
          if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pick(key); }
        });
      });
      // Clicking an existing arrow removes it — the same target you'd reach
      // for with an eraser. The group carries its own index, so this does not
      // depend on DOM order matching the arrows array.
      container.querySelectorAll('svg .oarrow').forEach(function(g){
        g.addEventListener('click', function(e){
          e.stopPropagation();
          var i = parseInt(g.getAttribute('data-arrow'), 10);
          if(isNaN(i)) return;
          arrows.splice(i, 1); pending = null; status = '';
          render();
          if(config.onChange) config.onChange(state(), api);
        });
      });
      // Clicking empty space abandons a half-drawn arrow, so a misclick isn't
      // a trap you have to complete.
      var svgEl = container.querySelector('svg');
      if(svgEl) svgEl.addEventListener('click', function(){
        if(pending){ pending = null; status = ''; render(); }
      });
    }

    function pick(key){
      if(locked) return;
      if(!pending){
        if(arrows.length >= maxArrows){
          status = 'Undo an arrow first — this step only needs ' + maxArrows + '.';
          render(); return;
        }
        pending = key; status = '';
        render(); return;
      }
      if(sameEndpoint(mol, pending, key)){   // clicked the source again: cancel
        pending = null; status = ''; render(); return;
      }
      var next = { from: pending, to: key };
      if(arrows.some(function(a){ return sameArrow(mol, a, next); })){
        status = 'That arrow is already drawn.';
        pending = null; render(); return;
      }
      arrows.push(next);
      pending = null; status = '';
      render();
      if(config.onChange) config.onChange(state(), api);
    }

    var api = {
      state: state,
      arrows: function(){ return arrows.slice(); },
      /* Describe what the student drew, in words, for feedback: "You sent the
         C–Br bond's electrons to the carbon." The diagnostic engine needs a
         sentence, not a key pair. */
      describe: function(){
        if(!arrows.length) return 'You did not draw an arrow.';
        return arrows.map(function(a){
          return 'You pushed electrons from ' + labelOf(mol, a.from) + ' to ' + labelOf(mol, a.to) + '.';
        }).join(' ');
      },
      set: function(next){ arrows = (next || []).slice(); pending = null; render(); },
      clear: function(){ arrows = []; pending = null; status = ''; render(); },
      lock: function(){ locked = true; render(); },
      /* Show which of the drawn arrows were right. Locks the editor: once the
         answer is graded, editing over the feedback would let a student
         "fix" it into a correct answer they never gave. */
      markResult: function(correctIdx, wrongIdx, note){
        marks = { correct: correctIdx || [], wrong: wrongIdx || [] };
        locked = true;
        status = note || '';
        render();
      },
      molecule: mol
    };

    render();
    return api;
  }

  /* Does what the student drew match what was expected? Order of arrows does
     not matter (a mechanism's arrows are simultaneous), but direction does,
     and every expected arrow must be present with no extras — an extra arrow
     is a wrong mechanism, not a near miss. */
  function matches(mol, drawn, expected){
    if(drawn.length !== expected.length) return false;
    var used = [];
    return expected.every(function(e){
      for(var i=0;i<drawn.length;i++){
        if(used.indexOf(i) !== -1) continue;
        if(sameArrow(mol, drawn[i], e)){ used.push(i); return true; }
      }
      return false;
    });
  }

  window.OchemMoleculeEditor = { mount: mount, matches: matches, labelOf: labelOf };
})();
