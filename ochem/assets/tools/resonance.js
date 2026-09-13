/* Resonance Explorer — draw a form, have it recognized, hunt for the rest.

   Most resonance practice is a picture of the answer. You are shown two
   structures with an arrow between them and asked to agree. The thing that
   never gets tested is the move itself: whether the arrow you would have
   drawn produces a resonance structure or a different compound.

   So this checks the move. Because resonance-engine.js can enumerate the
   forms of a species rather than looking them up, the tool knows how many
   there are without anyone writing them down — which is what makes "you have
   found two of the five" possible, and what lets the nudge reveal a form you
   actually have not found rather than a fixed hint.

   The forms are ranked as you collect them, and once you have them all the
   panel explains which contributes most using the same four rules in the same
   order a marker would apply them. */
(function(){
  var Mol = window.OchemMolecules;
  var Editor = window.OchemMoleculeEditor;
  var C = window.OchemChem;
  var R = window.OchemResonance;
  var root = document.getElementById('resRoot');
  if(!Mol || !Editor || !C || !R || !root) return;

  var SPECIES = [
    { id:'acetate-ion',  label:'Acetate' },
    { id:'formate',      label:'Formate' },
    { id:'allyl-cation', label:'Allyl cation' },
    { id:'allyl-anion',  label:'Allyl anion' },
    { id:'enolate',      label:'Enolate' },
    { id:'acetamide',    label:'Amide' },
    { id:'nitromethane', label:'Nitro group' },
    { id:'carbonate',    label:'Carbonate' },
    { id:'benzene',      label:'Benzene' },
    { id:'phenoxide',    label:'Phenoxide' },
    { id:'benzyl-cation',label:'Benzyl cation' },
    { id:'nitrate',      label:'Nitrate' },
    { id:'ozone',        label:'Ozone' }
  ];

  var current = SPECIES[0];
  var start = null;       // the species as a structure
  var target = [];        // every contributing form, best first
  var found = {};         // key -> 'found' | 'revealed'
  var arrows = [];
  var editorApi = null;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* The gallery gets the full width of the page rather than half of it.

     It started inside the right-hand column, and at that width a form was
     130px across — the atom labels rendered at about five pixels, which makes
     a gallery of structures you cannot read. Since the whole point is
     comparing forms against each other, the comparison gets the room and the
     drawing board keeps the split. */
  root.innerHTML =
    '<div class="tpanel">' +
      '<div class="tpanel__head">' +
        '<span>Pick a delocalized species</span>' +
        '<div class="tseg" id="resMode">' +
          '<button type="button" data-mode="hunt" class="on">Find the forms</button>' +
          '<button type="button" data-mode="compare">Compare two</button>' +
        '</div>' +
      '</div>' +
      '<div class="tchips" id="resPicker"></div>' +
      '<div class="trow" style="margin-top:12px;">' +
        '<button type="button" class="tchip tchip--ghost" id="resBuildToggle">Build your own &rarr;</button>' +
      '</div>' +
      '<div id="resBuilder" hidden></div>' +
      '<div id="resBuildMsg"></div>' +
      '<div id="resSend"></div>' +
    '</div>' +
    '<div id="resCompare" hidden></div>' +
    '<div id="resHunt">' +
    '<div class="tsplit tsplit--wide">' +
      '<div class="tpanel">' +
        '<div class="tpanel__head"><span>Move the electrons</span><span id="resName" class="tmuted"></span></div>' +
        '<div id="resEditor"></div>' +
        '<div aria-live="polite" id="resVerdict"></div>' +
      '</div>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head"><span>Progress</span><span id="resCount" class="tmuted"></span></div>' +
        '<div id="resProgress"></div>' +
        '<div class="trow" style="margin-top:14px;">' +
          '<button type="button" class="tchip" id="resReveal">Show me one I’m missing</button>' +
          '<button type="button" class="tchip" id="resReset">Start over</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="tpanel">' +
      '<div class="tpanel__head">Forms found</div>' +
      '<div id="resFound"></div>' +
    '</div>' +
    '<div id="resSummary"></div>' +
    '</div>';

  var elPicker  = document.getElementById('resPicker');
  var elName    = document.getElementById('resName');
  var elVerdict = document.getElementById('resVerdict');
  var elFound   = document.getElementById('resFound');
  var elCount   = document.getElementById('resCount');
  var elSummary = document.getElementById('resSummary');
  var elProgress = document.getElementById('resProgress');

  elPicker.innerHTML = SPECIES.map(function(s){
    return '<button type="button" class="tchip" data-id="' + esc(s.id) + '">' + esc(s.label) + '</button>';
  }).join('');
  elPicker.querySelectorAll('.tchip').forEach(function(b){
    b.addEventListener('click', function(){
      SPECIES.forEach(function(s){ if(s.id === b.getAttribute('data-id')) select(s); });
    });
  });

  document.getElementById('resReset').addEventListener('click', function(){
    begin(start, elName.textContent);
  });
  document.getElementById('resReveal').addEventListener('click', reveal);

  function select(sp){
    current = sp;
    elPicker.querySelectorAll('.tchip').forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-id') === sp.id);
    });
    var mol = Mol.get(sp.id);
    begin(C.fromMolecule(mol), mol.name);
  }

  /* Everything select() used to do, minus the assumption that the structure
     came out of the picker. The enumerator works from the structure itself —
     it does not look anything up — so a species the student drew is worth
     exactly as much to it as one of the eleven on the list. */
  function begin(st, name){
    if(window.OchemToolState){
      var m = document.getElementById('resMode');
      var on = m && m.querySelector('.on');
      window.OchemToolState.write({
        mode: on && on.getAttribute('data-mode') === 'compare' ? 'compare' : null,
        sp: current && !st.builtHere ? current.id : null,
        a: cmpLeft ? cmpLeft.id : null,
        b: cmpRight ? cmpRight.id : null
      });
    }
    found = {};
    arrows = [];
    elName.textContent = name || '';
    start = st;
    target = R.contributors(start);

    // The structure you are handed counts as one you have already got.
    found[R.key(start)] = 'given';

    mountEditor();
    renderVerdict(null);
    renderFound();
  }

  function mountEditor(){
    arrows = [];
    editorApi = Editor.mount(document.getElementById('resEditor'), {
      molecule: C.toMolecule(start),
      caption: '',
      maxArrows: 3,
      // No custom hint: the editor's own hint tracks the half-drawn state
      // ("now click where those electrons go"), and overriding it would trade
      // a progressive prompt for a static one.
      onChange: function(state){
        arrows = state.arrows;
        renderVerdict(arrows.length ? R.validate(start, arrows) : null);
      }
    });
  }

  /* ---- Live verdict ----------------------------------------------------- */

  function renderVerdict(v){
    if(!v){
      elVerdict.innerHTML = '<div class="tnote"><span class="tnote__k">Waiting</span>' +
        'Every form shares this skeleton — same atoms, same connections. Only the pi electrons and the ' +
        'lone pairs are allowed to move.</div>';
      return;
    }

    if(!v.valid){
      var already = v.code === 'no-change';
      elVerdict.innerHTML = '<div class="tnote ' + (already ? 'tnote--warn' : 'tnote--bad') + '">' +
        '<span class="tnote__k">' + (already ? 'No movement' : 'Not a resonance form') + '</span>' +
        esc(v.reason) + '</div>';
      return;
    }

    var k = R.key(v.structure);
    if(found[k]){
      elVerdict.innerHTML = '<div class="tnote tnote--warn"><span class="tnote__k">Already have it</span>' +
        'That is a valid form, but it is one you have already got. There ' +
        (remaining() === 1 ? 'is one other' : 'are ' + remaining() + ' others') + ' to find.</div>';
      return;
    }

    var d = R.describe(v.structure, target);
    elVerdict.innerHTML =
      '<div class="tnote tnote--good"><span class="tnote__k">That is a resonance form</span>' +
        esc(v.steps.join('. ').replace(/^./, function(c){ return c.toUpperCase(); })) + '. ' +
        'All octets intact, skeleton unchanged.' +
      '</div>' +
      '<button type="button" class="btn-press" id="resAdd" style="width:100%;">Add it to the collection</button>';

    document.getElementById('resAdd').addEventListener('click', function(){
      found[k] = 'found';
      mountEditor();
      renderVerdict(null);
      renderFound();
    });
  }

  /* ---- The collection --------------------------------------------------- */

  function remaining(){
    return target.filter(function(f){ return !found[R.key(f)]; }).length;
  }

  function renderFound(){
    var got = target.filter(function(f){ return found[R.key(f)]; });
    elCount.textContent = got.length + ' of ' + target.length;

    var cards = got.map(function(f){
      var d = R.describe(f, target);
      var how = found[R.key(f)];
      return '<div class="res-card' + (d.rank.indexOf('Major') === 0 ? ' res-card--major' : '') + '">' +
        '<div class="tstage">' + Mol.svg(C.toMolecule(f), { caption:'' }) + '</div>' +
        '<div class="res-card__rank">' + esc(d.rank) +
          (how === 'revealed' ? ' <span class="res-card__tag">revealed</span>' :
           how === 'given' ? ' <span class="res-card__tag">given</span>' : '') +
        '</div>' +
        '<div class="res-card__why">' + esc(d.summary) + '.</div>' +
      '</div>';
    }).join('');

    var blanks = '';
    for(var i = 0; i < target.length - got.length; i++){
      blanks += '<div class="res-card res-card--blank"><span>?</span></div>';
    }

    elFound.innerHTML = '<div class="res-grid">' + cards + blanks + '</div>';

    var left = remaining();
    elProgress.innerHTML =
      '<div class="res-bar"><span style="width:' + Math.round(got.length / target.length * 100) + '%"></span></div>' +
      '<p class="tmuted" style="margin:12px 0 0;">' +
        (left === 0
          ? 'That is all of them. The panel below works out which one the molecule most resembles.'
          : 'This species has <b>' + target.length + '</b> contributing resonance form' +
            (target.length === 1 ? '' : 's') + '. You have ' + got.length + '. ' +
            (left === 1 ? 'One left.' : left + ' left to find.')) +
      '</p>';

    document.getElementById('resReveal').disabled = remaining() === 0;
    renderSummary(got.length === target.length);
  }

  function reveal(){
    var missing = target.filter(function(f){ return !found[R.key(f)]; });
    if(!missing.length) return;
    found[R.key(missing[0])] = 'revealed';
    renderFound();
  }

  /* Once every form is on the table, the interesting question stops being
     "what are they" and becomes "which one is the molecule most like". */
  function renderSummary(complete){
    if(!complete){ elSummary.innerHTML = ''; return; }

    var best = target[0];
    var worst = target[target.length - 1];
    var html = '<div class="tpanel"><div class="tpanel__head">Which one is the molecule really like?</div>';

    if(target.length > 1){
      var cmp = R.compare(best, worst);
      if(cmp.winner === 'tie'){
        html += '<div class="tnote tnote--info"><span class="tnote__k">All equivalent</span>' +
          esc(cmp.text) + ' So the charge is not hopping back and forth between them — it is spread across ' +
          'all ' + target.length + ' positions at once, permanently, and each one carries a fraction of it.</div>';
      } else {
        var d = R.describe(best, target);
        html += '<div class="tnote tnote--good"><span class="tnote__k">Major contributor</span>' +
          esc(cmp.text) + '</div>' +
          '<div class="tstage">' + Mol.svg(C.toMolecule(best), { caption:'' }) + '</div>' +
          '<p class="tmuted">This form has ' + esc(d.summary) + ', so the real molecule resembles it most. ' +
          'The others still contribute — that is why the minor form’s atoms show some of the character it gives them — ' +
          'but the weighting is not equal.</p>';
      }
    }

    html += '<div class="ttable-scroll"><table class="ttable" style="margin-top:8px;">' +
      '<thead><tr><th>Form</th><th>Octets</th><th>Formal charges</th><th>Standing</th></tr></thead><tbody>' +
      target.map(function(f, i){
        var s = R.score(f), d = R.describe(f, target);
        return '<tr>' +
          '<td class="num">' + (i + 1) + '</td>' +
          '<td>' + (s.incomplete ? '<span class="lose">' + s.incomplete + ' short</span>' : '<span class="win">all complete</span>') + '</td>' +
          '<td class="num">' + s.charges + '</td>' +
          '<td>' + esc(d.rank) + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>';

    html += '<p class="tmuted" style="margin-top:10px;">The rules, in the order they are applied: complete octets first, ' +
      'then fewest formal charges, then no like charges side by side, then negative charge on the most ' +
      'electronegative atom available. Each one only gets consulted when the one above it ties.</p>';

    html += '</div>';
    elSummary.innerHTML = html;
  }

  /* ---- Build your own ----------------------------------------------------

     Eleven species is eleven species. The enumerator does not consult a list,
     so the only thing stopping it from working on an arbitrary anion was that
     nothing offered one. */
  var builderApi = null;
  var sendApi = null;
  var lastBuilt = null;
  var elBuilder = document.getElementById('resBuilder');
  var elBuildMsg = document.getElementById('resBuildMsg');

  document.getElementById('resBuildToggle').addEventListener('click', function(){
    var open = elBuilder.hidden;
    elBuilder.hidden = !open;
    this.classList.toggle('on', open);
    this.textContent = open ? 'Hide the builder' : 'Build your own →';
    if(open && !builderApi && window.OchemBuilderUI){
      builderApi = window.OchemBuilderUI.mount(elBuilder, {
        onChange: function(st, rep){
          lastBuilt = (rep.empty || !rep.ok) ? null : st;
          if(sendApi) sendApi.refresh();
          if(rep.empty){ elBuildMsg.innerHTML = ''; return; }
          if(!rep.ok){
            elBuildMsg.innerHTML = '<div class="tnote tnote--bad" style="margin-top:12px;">' +
              'Fix what is flagged below — a structure that cannot exist has no resonance forms to find.</div>';
            return;
          }
          var forms = R.contributors(C.clone(st));
          if(forms.length <= 1){
            elBuildMsg.innerHTML = '<div class="tnote tnote--warn" style="margin-top:12px;">' +
              '<span class="tnote__k">No delocalization</span>' +
              'This one has exactly one contributing form — there is nowhere for the pi electrons or a lone pair to go. ' +
              'That is a real answer about the molecule, not a failure: most molecules have no resonance at all. ' +
              'Try a species with a charge next to a pi bond, or a lone pair next to one.</div>';
            return;
          }
          elBuildMsg.innerHTML = '<div class="tnote tnote--good" style="margin-top:12px;">' +
            '<span class="tnote__k">' + forms.length + ' forms</span>' +
            'Loaded. Move a lone pair or a pi bond and see which of them you can find.</div>';
          elPicker.querySelectorAll('.tchip').forEach(function(b){ b.classList.remove('on'); });
          begin(C.clone(st), st.name || rep.formula);
        }
      });
    }
  });

  /* ---- Compare two -------------------------------------------------------

     "Which of these is more stabilized by resonance" is the form the question
     takes in every exam and in none of the practice. Finding the forms of one
     species does not answer it: the comparison is between how far the charge
     is spread in each, and that is a different measurement.

     Four questions in order, the same order a marker would use. Does it have
     resonance at all; are its major forms equivalent, which is what "fully
     delocalized" actually means; over how many atoms does the charge move;
     and finally, what is it sitting on. */
  var cmpLeft = null, cmpRight = null, cmpGuess = null;
  var elCompare = document.getElementById('resCompare');
  var elHunt = document.getElementById('resHunt');

  function stabilization(st){
    var forms = R.contributors(st);
    var best = forms.reduce(function(m, f){ return R.score(f).total > R.score(m).total ? f : m; }, forms[0]);
    var bestTotal = R.score(best).total;
    var equivalentMajors = forms.filter(function(f){ return R.score(f).total === bestTotal; }).length;

    /* Atoms that carry charge in at least one form: how far the charge roams,
       and what it sits on when it gets there. Electronegativity is signed —
       a negative charge wants the most electronegative atom it can find and a
       positive charge wants the least, so the same number read the same way
       for both would rank every cation backwards. */
    var carriers = {}, comfort = 0, n = 0, net = 0;
    Object.keys(st.atoms).forEach(function(k){ net += C.formalCharge(st, k); });

    forms.forEach(function(f){
      Object.keys(f.atoms).forEach(function(k){
        var a = f.atoms[k];
        if(!a.el || a.group) return;
        var fc = C.formalCharge(f, k);
        if(fc === 0) return;
        carriers[k] = a.el;
      });
    });
    Object.keys(carriers).forEach(function(k){
      var info = C.info(carriers[k]);
      var en = info ? info.en : 2.5;
      comfort += (net < 0 ? en : -en);
      n++;
    });

    return {
      forms: forms, count: forms.length, equivalentMajors: equivalentMajors,
      spread: n, net: net,
      carriers: Object.keys(carriers).map(function(k){ return carriers[k]; }),
      comfort: n ? comfort / n : 0
    };
  }

  /* The rules in the order that actually decides it.

     A first pass had "how many atoms does it spread over" above "what does it
     land on", which ranks phenoxide over acetate — and acetic acid is five pKa
     units stronger than phenol, so that is not a close call, it is backwards.
     Spreading a charge onto carbon is barely worth anything; getting it onto a
     second oxygen is worth a great deal. Electronegativity first.

     Equivalence drops below it for the same reason: the allyl anion has two
     perfectly equivalent forms and is still a far worse place for a negative
     charge than an enolate, which has two unequal ones and an oxygen. */
  function judge(a, b){
    if((a.count > 1) !== (b.count > 1)){
      var w = a.count > 1 ? 'a' : 'b';
      return { winner:w, rule:'Resonance at all',
        text:'One of these delocalizes and the other does not. A charge stuck on a single atom has nothing helping it; ' +
             'a charge that can be drawn in more than one place is spread over all of them at once. Nothing further down the list comes close to mattering as much.' };
    }

    if(a.net !== 0 && b.net !== 0 && (a.net > 0) !== (b.net > 0)){
      return { winner:'tie', rule:'Different questions',
        text:'One of these is an anion and the other a cation. Both are helped by resonance, but what counts as a good ' +
             'home for the charge is opposite in the two cases — the anion wants the most electronegative atom it can ' +
             'reach and the cation wants the least. Compare two of the same sign and the question has an answer.' };
    }

    if((a.spread === 0) !== (b.spread === 0)){
      return { winner:'tie', rule:'Different questions',
        text:'One of these carries a charge and the other does not. Resonance helps both, but it is doing two different ' +
             'jobs — spreading a charge in one case, delocalizing a neutral pi system in the other — and there is no ' +
             'honest way to rank those against each other. Compare two anions, or two neutral systems, and the question ' +
             'becomes answerable.' };
    }

    if(a.spread && b.spread && Math.abs(a.comfort - b.comfort) > 0.05){
      var w2 = a.comfort > b.comfort ? 'a' : 'b';
      var hi = w2 === 'a' ? a : b, lo = w2 === 'a' ? b : a;
      var neg = a.net < 0;
      return { winner:w2, rule:'What the charge lands on',
        text:'Both spread the charge, but not onto equally good atoms. ' +
             (neg
               ? 'A negative charge is far more comfortable on oxygen than on carbon, and moving it onto another oxygen ' +
                 'is worth more than moving it onto three more carbons — which is why acetate beats phenoxide even though ' +
                 'phenoxide spreads over more atoms.'
               : 'A positive charge is better off on the least electronegative atom available, since that is the atom ' +
                 'least reluctant to give up electron density in the first place.') +
             ' Here the winner shares it with ' + hi.carriers.join(', ') + '; the other with ' + lo.carriers.join(', ') + '.' };
    }

    if(a.equivalentMajors !== b.equivalentMajors){
      var w3 = a.equivalentMajors > b.equivalentMajors ? 'a' : 'b';
      var hi3 = w3 === 'a' ? a : b, lo3 = w3 === 'a' ? b : a;
      return { winner:w3, rule:'Equivalent contributors',
        text:'The charge lands on the same kind of atom in both, so what separates them is how evenly it is shared. ' +
             hi3.equivalentMajors + ' of the winner’s forms are equally good, which means the charge genuinely sits ' +
             'between them rather than mostly in one place and occasionally elsewhere. ' +
             (lo3.equivalentMajors === 1
               ? 'The other has a single best form, so most of the charge really is where that form puts it.'
               : 'The other manages ' + lo3.equivalentMajors + '.') };
    }

    if(a.spread !== b.spread){
      var w4 = a.spread > b.spread ? 'a' : 'b';
      return { winner:w4, rule:'How far it spreads',
        text:'Same atoms, same evenness — so it comes down to how many places the charge can be. One moves it over ' +
             Math.max(a.spread, b.spread) + ' atoms and the other over ' + Math.min(a.spread, b.spread) + '. ' +
             'The same charge spread more thinly is a lower energy.' };
    }

    return { winner:'tie', rule:'Level',
      text:'By every rule that separates these, they come out the same. That happens, and the honest answer is that ' +
           'resonance does not distinguish them — whatever separates them is something else, like induction or solvation.' };
  }

  function renderCompare(){
    var picks = SPECIES.map(function(sp){ return sp; });
    function options(sel){
      return picks.map(function(sp){
        return '<option value="' + esc(sp.id) + '"' + (sel === sp.id ? ' selected' : '') + '>' + esc(sp.label) + '</option>';
      }).join('');
    }

    var la = cmpLeft ? stabilization(cmpLeft.st) : null;
    var rb = cmpRight ? stabilization(cmpRight.st) : null;
    var verdict = (la && rb) ? judge(la, rb) : null;

    function side(which, pick, sta){
      if(!pick) return '<div class="tempty">Pick one.</div>';
      var revealed = cmpGuess !== null;
      return '<div class="tstage">' + Mol.svg(C.toMolecule(sta.forms[0]), { caption:'' }) + '</div>' +
        (revealed
          ? '<div class="tstat" style="margin-top:12px;">' +
              '<div><div class="k">Forms</div><div class="v">' + sta.count + '</div></div>' +
              '<div><div class="k">Equally good</div><div class="v">' + sta.equivalentMajors + '</div></div>' +
              '<div><div class="k">Charge roams over</div><div class="v">' + sta.spread + '</div></div>' +
            '</div>'
          : '<p class="tmuted" style="margin:12px 0 0;">Numbers appear once you have called it.</p>');
    }

    elCompare.innerHTML =
      '<div class="tpanel">' +
        '<div class="tpanel__head">Which is more stabilized by resonance?</div>' +
        '<div class="trow" style="gap:10px;flex-wrap:wrap;">' +
          '<select class="mb__input" id="cmpA" style="max-width:220px;">' + options(cmpLeft && cmpLeft.id) + '</select>' +
          '<span class="tmuted" style="font-weight:900;">vs</span>' +
          '<select class="mb__input" id="cmpB" style="max-width:220px;">' + options(cmpRight && cmpRight.id) + '</select>' +
        '</div>' +
      '</div>' +
      '<div class="tsplit tsplit--wide">' +
        '<div class="tpanel' + (verdict && cmpGuess !== null && verdict.winner === 'a' ? ' tpanel--win' : '') + '">' +
          '<div class="tpanel__head">' + esc(cmpLeft ? cmpLeft.label : 'A') + '</div>' + side('a', cmpLeft, la) +
        '</div>' +
        '<div class="tpanel' + (verdict && cmpGuess !== null && verdict.winner === 'b' ? ' tpanel--win' : '') + '">' +
          '<div class="tpanel__head">' + esc(cmpRight ? cmpRight.label : 'B') + '</div>' + side('b', cmpRight, rb) +
        '</div>' +
      '</div>' +
      '<div class="tpanel" id="cmpVerdict">' +
        (cmpGuess === null
          ? '<div class="tpanel__head">Call it first</div>' +
            '<p class="tmuted" style="margin:0 0 12px;">A tool that reveals as you click is a lookup table, and you already have one of those. ' +
            'Commit to an answer and the reasoning comes back broken into the rule that decided it.</p>' +
            '<div class="trow">' +
              '<button type="button" class="btn-press" data-guess="a">' + esc(cmpLeft ? cmpLeft.label : 'A') + '</button>' +
              '<button type="button" class="btn-press" data-guess="b">' + esc(cmpRight ? cmpRight.label : 'B') + '</button>' +
              '<button type="button" class="tchip" data-guess="tie">About the same</button>' +
            '</div>'
          : renderVerdictBlock(verdict)) +
      '</div>';

    var a = document.getElementById('cmpA'), b = document.getElementById('cmpB');
    a.addEventListener('change', function(){ setSide('a', a.value); });
    b.addEventListener('change', function(){ setSide('b', b.value); });
    elCompare.querySelectorAll('[data-guess]').forEach(function(btn){
      btn.addEventListener('click', function(){
        cmpGuess = btn.getAttribute('data-guess');
        renderCompare();
      });
    });
  }

  function renderVerdictBlock(v){
    if(!v) return '<div class="tempty">Pick two species.</div>';
    var right = cmpGuess === v.winner;
    var name = v.winner === 'tie' ? 'neither' : (v.winner === 'a' ? cmpLeft.label : cmpRight.label);
    return '<div class="tpanel__head">' + (right ? 'Right' : 'Not quite') + '</div>' +
      '<div class="tnote ' + (right ? 'tnote--good' : 'tnote--bad') + '">' +
        '<span class="tnote__k">' + esc(v.rule) + '</span>' +
        (v.winner === 'tie' ? '' : esc(name) + ' is the more stabilized. ') + esc(v.text) +
      '</div>' +
      '<div class="trow" style="margin-top:12px;">' +
        '<button type="button" class="tchip" id="cmpAgain">Try another pair</button>' +
      '</div>';
  }

  function syncCompare(){
    if(!window.OchemToolState) return;
    window.OchemToolState.write({
      mode:'compare',
      a: cmpLeft ? cmpLeft.id : null,
      b: cmpRight ? cmpRight.id : null
    });
  }

  function setSide(which, id){
    var sp = SPECIES.filter(function(x){ return x.id === id; })[0];
    if(!sp) return;
    var mol = Mol.get(sp.id);
    var entry = { id: sp.id, label: sp.label, st: C.fromMolecule(mol) };
    if(which === 'a') cmpLeft = entry; else cmpRight = entry;
    cmpGuess = null;
    syncCompare();
    renderCompare();
  }

  elCompare.addEventListener('click', function(e){
    if(e.target && e.target.id === 'cmpAgain'){ cmpGuess = null; renderCompare(); }
  });

  document.getElementById('resMode').querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){
      var mode = b.getAttribute('data-mode');
      document.getElementById('resMode').querySelectorAll('button').forEach(function(x){
        x.classList.toggle('on', x === b);
      });
      elHunt.hidden = (mode !== 'hunt');
      elCompare.hidden = (mode !== 'compare');
      elPicker.hidden = (mode !== 'hunt');
      document.getElementById('resBuildToggle').hidden = (mode !== 'hunt');
      if(mode === 'compare' && !cmpLeft){
        setSide('a', 'acetate-ion');
        setSide('b', 'enolate');
      }
    });
  });

  if(window.OchemToolState){
    var q = window.OchemToolState.read();

    /* A structure sent from another tool. Opening the builder with it is the
       right landing: the student can see what arrived, adjust it, and the
       tool treats it exactly as one they drew here — which it effectively is. */
    if(q.build && window.OchemToolHandoff){
      var toggle = document.getElementById('resBuildToggle');
      if(toggle){
        toggle.click();
        if(builderApi) builderApi.build(q.build);
      }
    }
    var sp = SPECIES.filter(function(x){ return x.id === q.sp; })[0];
    select(sp || SPECIES[0]);
    if(q.mode === 'compare'){
      var mb = document.getElementById('resMode').querySelector('[data-mode="compare"]');
      if(mb) mb.click();
      if(q.a) setSide('a', q.a);
      if(q.b) setSide('b', q.b);
    }
  } else {
    select(SPECIES[0]);
  }
  /* ---- Check yourself ---------------------------------------------------
     The count comes from resonance-engine.js enumerating the species, not
     from a number typed next to it — which is the same property that lets the
     tool say "you have found two of five" while you are drawing. So the quiz
     is asking about a fact the engine derives, and adding a species to the
     list adds a question with it. */
  if(window.OchemToolQuiz){
    window.OchemToolQuiz.mount(document.getElementById('tool-quiz'), {
      slug: 'resonance',
      rounds: 6,
      intro: 'How far the charge really spreads, and which form carries the most weight.',
      make: function(recent){
        var pool = SPECIES.filter(function(s){ return recent.indexOf(s.id) < 0; });
        if(!pool.length) pool = SPECIES;
        var pick = pool[Math.floor(Math.random() * pool.length)];

        /* contributors(), not enumerate(): enumerate finds every structure the
           arrows can reach, contributors keeps the ones that actually count as
           resonance forms — and it is contributors the panel above counts when
           it says "two of five". A quiz answering a different question from the
           tool it sits under would be worse than no quiz. */
        var startMol = Mol.get(pick.id);
        if(!startMol) return null;
        var forms = R.contributors(C.fromMolecule(startMol));
        if(!forms || !forms.length) return null;

        var n = forms.length;
        var opts = [n];
        [n + 1, n - 1, n + 2, n * 2].forEach(function(v){
          if(v >= 1 && opts.indexOf(v) < 0 && opts.length < 4) opts.push(v);
        });

        return {
          id: pick.id,
          prompt: 'How many contributing <b>resonance forms</b> does <b>' + esc(pick.label) +
                  '</b> have?',
          options: opts.map(function(v){
            return { id:String(v), label:String(v), correct: v === n };
          }),
          explain: '<b>' + n + '</b>. Counting them is not a memory exercise: every form is one legal ' +
                   'push of a lone pair or a pi bond away from another, so the count is however many ' +
                   'distinct structures that operation can reach before it starts repeating itself. ' +
                   /* Phenoxide and the benzyl cation come out at five here and four in most
                      textbooks, and the difference is real rather than a bug: a benzene ring
                      has its own two Kekulé forms, which a book showing "the three
                      delocalized forms" is quietly holding fixed. Saying so is better than
                      hiding a form to match the expected number. */
                   (/benzene|phenoxide|benzyl/.test(pick.id)
                     ? 'That includes the ring’s own two Kekulé forms — a textbook picture usually holds those fixed and shows you one fewer. '
                     : '') +
                   'Draw them in the tool above and it will tell you which ones you have left to find.'
        };
      }
    });
  }

})();
