/* Tools: the ungraded half of the molecule editor.

   Practice asks "is this arrow right" and records the answer. Here there is
   no right answer and nothing is recorded — you pick a molecule and push
   electrons to see what the arrow looks like. Same component, same gesture,
   same visual language; only the grading is missing, which is the actual
   difference between a sandbox and a question.

   Kept out of an inline <script> like learn-page.js and mastery-page.js:
   the CI link-checker scans raw HTML for href="..." and misfires on
   generated markup. */
(function(){
  var Mol = window.OchemMolecules;
  var Editor = window.OchemMoleculeEditor;
  var stage = document.getElementById('toolStage');
  var picker = document.getElementById('toolPick');
  if(!stage || !picker || !Mol || !Editor) return;

  /* A spread across the mechanisms a student actually has to draw, rather
     than every molecule in the library — the point is to have somewhere to
     practise the gesture, not to browse a catalogue. */
  var PICKS = [
    { id:'sn2-bromoethane', label:'SN2',
      note:'Two arrows: hydroxide’s lone pair into the carbon, and the C–Br bond onto bromine. Both happen at once, which is why SN2 inverts the carbon.' },
    { id:'sn1-secondary', label:'SN1 ionization',
      note:'One arrow to start: the C–Br bond’s electrons leave with bromide. Nothing attacks yet — that is the whole point of SN1.' },
    { id:'e2-butane', label:'E2',
      note:'Three arrows: base to the beta hydrogen, that C–H bond into the C–C bond, and the C–Br bond onto bromine. The H and the Br must be anti-periplanar.' },
    { id:'acetone', label:'Carbonyl addition',
      note:'A nucleophile attacks the carbonyl carbon and the C=O pi bond goes up onto oxygen. Oxygen can take the charge; carbon cannot.' },
    { id:'methyl-acetate', label:'Acyl substitution',
      note:'Same first move as a ketone — but here the tetrahedral intermediate can collapse and push out the OR group, so addition becomes substitution.' },
    { id:'propene-hbr', label:'Markovnikov addition',
      note:'The pi bond is the nucleophile. Push it at the H of H–Br, and let the H–Br bond go to bromine. Which carbon keeps the H decides the product.' },
    { id:'propylene-oxide', label:'Epoxide opening',
      note:'Strain makes this a leaving group that cannot leave. A nucleophile attacks a ring carbon and the C–O bond opens onto oxygen.' },
    { id:'benzene', label:'Aromatic ring',
      note:'Benzene’s pi system attacks an electrophile, breaking aromaticity for one step. Everything after that is about getting the ring back.' },
    { id:'acetic-acid', label:'Carboxylic acid',
      note:'Deprotonate the O–H and the resulting charge spreads over both oxygens — that delocalization is the whole reason this is so much more acidic than an alcohol.' },
    { id:'ethylamine', label:'Amine',
      note:'The nitrogen lone pair is the reactive part, as a base or a nucleophile. Push it and see which role you have just made it play.' }
  ];

  var current = null;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  function select(pick){
    current = pick;
    picker.querySelectorAll('button').forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-id') === pick.id);
    });
    var host = document.getElementById('toolEditor');
    Editor.mount(host, {
      molecule: pick.id,
      maxArrows: 4,
      onChange: function(state, ed){
        var out = document.getElementById('toolReadout');
        out.innerHTML = state.arrows.length
          ? '<b>What you drew:</b> ' + esc(ed.describe())
          : '';
      }
    });
    document.getElementById('toolReadout').innerHTML = '';
    document.getElementById('toolNote').innerHTML = esc(pick.note);
  }

  picker.innerHTML = PICKS.map(function(p){
    return '<button type="button" data-id="' + esc(p.id) + '">' + esc(p.label) + '</button>';
  }).join('');
  picker.querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){
      var p = PICKS.filter(function(x){ return x.id === b.getAttribute('data-id'); })[0];
      if(p) select(p);
    });
  });

  stage.innerHTML =
    '<div id="toolEditor"></div>' +
    '<div class="tool-note" id="toolNote"></div>' +
    '<div class="tool-note" id="toolReadout"></div>';

  select(PICKS[0]);
})();
