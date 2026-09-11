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
    { id:'benzyl-cation',label:'Benzyl cation' }
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
      '<div class="tpanel__head">Pick a delocalized species</div>' +
      '<div class="tchips" id="resPicker"></div>' +
    '</div>' +
    '<div class="tsplit tsplit--wide">' +
      '<div class="tpanel">' +
        '<div class="tpanel__head"><span>Move the electrons</span><span id="resName" class="tmuted"></span></div>' +
        '<div id="resEditor"></div>' +
        '<div id="resVerdict"></div>' +
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
    '<div id="resSummary"></div>';

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

  document.getElementById('resReset').addEventListener('click', function(){ select(current); });
  document.getElementById('resReveal').addEventListener('click', reveal);

  function select(sp){
    current = sp;
    found = {};
    arrows = [];
    elPicker.querySelectorAll('.tchip').forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-id') === sp.id);
    });

    var mol = Mol.get(sp.id);
    elName.textContent = mol.name;
    start = C.fromMolecule(mol);
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
      molecule: Mol.get(current.id),
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

  select(SPECIES[0]);
})();
