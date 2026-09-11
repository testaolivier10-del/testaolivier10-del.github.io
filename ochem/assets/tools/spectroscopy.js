/* Spectroscopy Lab — read the peaks, name the compound.

   Spectroscopy is taught as two tables to memorize and then tested as a
   puzzle, and the gap between those is where students get stuck. What is
   missing in the middle is the experience of looking at a spectrum and having
   somewhere to put each feature.

   So there are three modes and they are the same material three ways. The
   reference charts let you interrogate a region rather than look it up. The
   predictor takes a known compound apart peak by peak, with every signal
   linked to the protons that make it, so the connection between structure and
   spectrum runs in the direction it is learned in. And the puzzle runs it the
   other way — formula, IR, NMR, four candidates — which is the direction it is
   examined in.

   The spectra are drawn, not photographed: each band is a Gaussian at its
   real wavenumber with a width and depth that match how it actually appears,
   and each NMR signal is split into its true n+1 lines at a realistic coupling
   constant. That means the picture and the peak table can never drift apart,
   and a multiplet looks like a multiplet rather than a labelled stick. */
(function(){
  var root = document.getElementById('spRoot');
  if(!root) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* ---- Reference data --------------------------------------------------- */

  var IR_BANDS = [
    { lo:3200, hi:3600, label:'O–H',            shape:'broad',  note:'Alcohols and, much broader and lower, carboxylic acids. Hydrogen bonding is what smears it out — a dilute, non-hydrogen-bonded O–H is a sharp spike near 3600 instead.' },
    { lo:3300, hi:3500, label:'N–H',            shape:'medium', note:'A primary amine gives TWO bands here (symmetric and antisymmetric stretch); a secondary amine gives one. Counting them tells you how substituted the nitrogen is.' },
    { lo:3270, hi:3330, label:'≡C–H',           shape:'sharp',  note:'A terminal alkyne. Sharp and narrow, sitting right on top of the O–H region — the sharpness is how you tell them apart.' },
    { lo:3000, hi:3100, label:'sp² C–H',        shape:'medium', note:'Alkene and aromatic C–H. The line at 3000 is the one to watch: anything above it is sp², anything below is sp³.' },
    { lo:2850, hi:3000, label:'sp³ C–H',        shape:'medium', note:'Present in essentially every organic compound, which is why it tells you almost nothing on its own.' },
    { lo:2700, hi:2830, label:'aldehyde C–H',   shape:'medium', note:'Two weak bands, often described as a doublet around 2820 and 2720. Small, easy to miss, and the one thing that separates an aldehyde from a ketone in an IR.' },
    { lo:2220, hi:2260, label:'C≡N',            shape:'sharp',  note:'A nitrile. Sharp, medium, and in a region where almost nothing else absorbs — one of the most reliable peaks in the whole spectrum.' },
    { lo:2100, hi:2200, label:'C≡C',            shape:'sharp',  note:'An alkyne, and weak — a symmetrical internal alkyne can be invisible here because the stretch produces no change in dipole.' },
    { lo:1735, hi:1750, label:'ester C=O',      shape:'strong', note:'Esters sit higher than ketones. The single oxygen lone pair donating into the carbonyl is offset by its inductive pull, and the net effect stiffens the bond.' },
    { lo:1700, hi:1730, label:'ketone / aldehyde C=O', shape:'strong', note:'The reference point for every other carbonyl. Around 1715 for a simple ketone, a little higher for an aldehyde.' },
    { lo:1690, hi:1720, label:'carboxylic acid C=O', shape:'strong', note:'Near the ketone, but you will never mistake it — the enormous O–H trough from 2500 to 3300 gives it away first.' },
    { lo:1630, hi:1690, label:'amide C=O',      shape:'strong', note:'The LOWEST carbonyl there is. The nitrogen lone pair delocalizes into the C=O, giving the bond real single-bond character and softening it.' },
    { lo:1620, hi:1680, label:'C=C alkene',     shape:'weak',   note:'Weak, and weaker still the more symmetrical the alkene. Worth checking against the sp² C–H band above 3000 before believing it.' },
    { lo:1450, hi:1620, label:'aromatic C=C',   shape:'medium', note:'Usually a set of two to four bands. On its own it is suggestive; together with C–H above 3000 it is convincing.' },
    { lo:1000, hi:1300, label:'C–O',            shape:'strong', note:'Strong and hard to assign precisely, because so much lives here. Useful mainly to confirm an oxygen you already suspect.' },
    { lo:690,  hi:900,  label:'aromatic substitution', shape:'medium', note:'The out-of-plane bending pattern, which encodes how the ring is substituted: mono-substituted rings give two bands near 730 and 700, para-substituted give one near 820.' }
  ];

  var NMR_ZONES = [
    { lo:0.7, hi:1.7, label:'alkyl C–H',        note:'Ordinary CH₃, CH₂ and CH with nothing electronegative nearby. A methyl on a chain sits near 0.9.' },
    { lo:1.6, hi:2.6, label:'next to C=O or C=C', note:'Alpha to a carbonyl, or allylic. The pi system deshields moderately — enough to move a methyl from 0.9 to about 2.1.' },
    { lo:2.2, hi:2.9, label:'benzylic',         note:'Attached to an aromatic ring. Toluene’s methyl is the canonical 2.36.' },
    { lo:3.2, hi:4.2, label:'next to oxygen',   note:'C–H on a carbon bonded to O. Electronegativity pulls electron density off the hydrogen and leaves it exposed to the field.' },
    { lo:4.5, hi:6.5, label:'vinyl',            note:'Hydrogens on a C=C. The ring current of the pi bond deshields them strongly.' },
    { lo:6.5, hi:8.2, label:'aromatic',         note:'The aromatic ring current is much stronger than an alkene’s — which is itself evidence of aromaticity, not just a shift to memorize.' },
    { lo:9.4, hi:10.4,label:'aldehyde',         note:'Almost unmistakable. On a carbon that is both sp² and attached to oxygen, and nothing else lands here.' },
    { lo:10,  hi:13,  label:'carboxylic acid',  note:'The furthest downfield you will normally see, and usually broad. Exchangeable, so it disappears when the sample is shaken with D₂O.' },
    { lo:0.5, hi:5.5, label:'O–H / N–H',        note:'Anywhere in this range, depending on concentration and solvent, and usually broad with no coupling — because the proton exchanges faster than the coupling can register.', variable:true }
  ];

  /* ---- Compounds -------------------------------------------------------- */

  /* IR peaks carry a width and depth so the drawn spectrum matches the table.
     NMR signals carry integration and multiplicity, and the multiplicity is
     drawn as real lines rather than a label. */
  var COMPOUNDS = [
    {
      id:'ethanol', name:'Ethanol', formula:'C₂H₆O', structure:'CH₃CH₂OH',
      ir:[
        { cm:3350, w:180, d:55, label:'O–H stretch', note:'Broad and strong. The breadth is hydrogen bonding: every molecule is in a slightly different environment, so the band is a blur of slightly different frequencies.' },
        { cm:2970, w:40,  d:38, label:'sp³ C–H',     note:'Below 3000, so every carbon here is saturated.' },
        { cm:1050, w:40,  d:60, label:'C–O stretch', note:'Strong, and confirms the oxygen is in an alcohol or ether rather than a carbonyl.' }
      ],
      nmr:[
        { ppm:1.22, h:3, mult:'t', j:7, label:'CH₃', note:'Three hydrogens, split into a triplet by the two on the neighbouring CH₂. Furthest upfield because it is furthest from the oxygen.' },
        { ppm:2.60, h:1, mult:'s', label:'OH',  note:'Broad singlet, and it does not couple to anything — the proton swaps between molecules faster than the coupling can be felt. Shake with D₂O and this peak vanishes.' },
        { ppm:3.69, h:2, mult:'q', j:7, label:'CH₂', note:'Quartet from the three hydrogens next door, and pushed downfield to 3.7 by the oxygen it is attached to.' }
      ],
      tell:'A broad O–H trough with no carbonyl anywhere. The 3.7 quartet fixes which carbon carries the oxygen.'
    },
    {
      id:'acetone', name:'Acetone', formula:'C₃H₆O', structure:'CH₃COCH₃',
      ir:[
        { cm:2960, w:40, d:30, label:'sp³ C–H', note:'Saturated carbons only.' },
        { cm:1715, w:22, d:78, label:'C=O stretch', note:'Strong, sharp, and at the textbook position for a simple ketone. Nothing above 3000 and no O–H, so this is a ketone rather than an acid or an aldehyde.' }
      ],
      nmr:[
        { ppm:2.17, h:6, mult:'s', label:'2 × CH₃', note:'One signal for all six hydrogens. The molecule is symmetrical, so both methyls are in identical environments — and with no hydrogen on the neighbouring carbon there is nothing to couple to.' }
      ],
      tell:'One NMR signal and a carbonyl at 1715. The symmetry is the whole clue.'
    },
    {
      id:'acetic', name:'Acetic acid', formula:'C₂H₄O₂', structure:'CH₃COOH',
      ir:[
        { cm:3000, w:420, d:48, label:'O–H (acid)', note:'The enormous trough from about 2500 to 3300, wider than anything else in spectroscopy. A carboxylic acid dimerizes through two hydrogen bonds at once, and this is what that looks like.' },
        { cm:1710, w:24, d:80, label:'C=O stretch', note:'Sitting inside the shoulder of the O–H trough, which is itself a recognizable signature.' }
      ],
      nmr:[
        { ppm:2.10, h:3, mult:'s', label:'CH₃', note:'A singlet — nothing on the adjacent carbon to couple with.' },
        { ppm:11.4, h:1, mult:'s', label:'COOH', note:'Further downfield than anything else you will meet in a first course. Broad, exchangeable, and diagnostic on its own.' }
      ],
      tell:'A proton past 11 ppm, and an O–H trough that swallows the C–H region.'
    },
    {
      id:'etac', name:'Ethyl acetate', formula:'C₄H₈O₂', structure:'CH₃COOCH₂CH₃',
      ir:[
        { cm:2980, w:40, d:30, label:'sp³ C–H', note:'Saturated.' },
        { cm:1740, w:22, d:80, label:'ester C=O', note:'Notice it is higher than acetone’s 1715. That 25 cm⁻¹ is how you separate an ester from a ketone.' },
        { cm:1240, w:40, d:65, label:'C–O stretch', note:'Esters give two strong C–O bands; ketones give none.' }
      ],
      nmr:[
        { ppm:1.26, h:3, mult:'t', j:7, label:'OCH₂CH₃', note:'Triplet, coupled to the CH₂ next to it.' },
        { ppm:2.04, h:3, mult:'s', label:'CH₃C=O', note:'Singlet, alpha to the carbonyl. No neighbouring hydrogens.' },
        { ppm:4.12, h:2, mult:'q', j:7, label:'OCH₂', note:'Quartet, and pushed all the way to 4.1 — further than ethanol’s 3.7, because this oxygen is attached to a carbonyl as well.' }
      ],
      tell:'Carbonyl at 1740 rather than 1715, no O–H at all, and a 3:3:2 pattern with a quartet past 4 ppm.'
    },
    {
      id:'toluene', name:'Toluene', formula:'C₇H₈', structure:'C₆H₅CH₃',
      ir:[
        { cm:3030, w:30, d:28, label:'sp² C–H', note:'Above 3000 — there are unsaturated carbons here.' },
        { cm:2920, w:35, d:30, label:'sp³ C–H', note:'And below 3000 too, so there are saturated ones as well. Both sides of the 3000 line means both kinds of carbon.' },
        { cm:1500, w:28, d:45, label:'aromatic C=C', note:'Ring stretching. Usually a cluster of bands rather than one.' },
        { cm:730,  w:22, d:60, label:'mono-substituted ring', note:'Together with the band near 695, this pair is the fingerprint of a ring with exactly one substituent.' },
        { cm:695,  w:20, d:58, label:'mono-substituted ring', note:'The partner band. Two peaks here rather than one near 820 is what says mono- rather than para-.' }
      ],
      nmr:[
        { ppm:2.36, h:3, mult:'s', label:'CH₃', note:'Benzylic, so shifted from 0.9 up to 2.36 by the ring current. A singlet, because the ring carbon next to it has no hydrogen.' },
        { ppm:7.20, h:5, mult:'m', label:'5 × Ar–H', note:'Five aromatic hydrogens in a multiplet. The 5:3 integration ratio settles the structure almost by itself.' }
      ],
      tell:'C–H on both sides of 3000, a 5:3 integration, and the 730/695 pair.'
    },
    {
      id:'benzaldehyde', name:'Benzaldehyde', formula:'C₇H₆O', structure:'C₆H₅CHO',
      ir:[
        { cm:3060, w:28, d:24, label:'sp² C–H', note:'Aromatic.' },
        { cm:2820, w:24, d:22, label:'aldehyde C–H', note:'Small and easy to miss, and the reason you can call this an aldehyde rather than a ketone from the IR alone.' },
        { cm:2720, w:22, d:20, label:'aldehyde C–H', note:'The second of the pair. Two weak bands here is the aldehyde signature.' },
        { cm:1700, w:24, d:76, label:'conjugated C=O', note:'Slightly lower than an unconjugated aldehyde would be, because the ring delocalizes into the carbonyl and weakens it.' }
      ],
      nmr:[
        { ppm:9.99, h:1, mult:'s', label:'CHO', note:'The aldehyde proton. Nothing else in a first-year spectrum appears near 10 ppm.' },
        { ppm:7.55, h:3, mult:'m', label:'meta + para Ar–H', note:'The three ring hydrogens furthest from the carbonyl.' },
        { ppm:7.87, h:2, mult:'m', label:'ortho Ar–H', note:'The two next to the carbonyl, pulled further downfield by it. Aromatic hydrogens are not all equivalent once the ring is substituted.' }
      ],
      tell:'A singlet at 10 ppm plus two weak IR bands near 2800. Either one alone would do it.'
    },
    {
      id:'ether', name:'Diethyl ether', formula:'C₄H₁₀O', structure:'CH₃CH₂OCH₂CH₃',
      ir:[
        { cm:2970, w:42, d:36, label:'sp³ C–H', note:'Saturated.' },
        { cm:1120, w:40, d:62, label:'C–O stretch', note:'Strong. There is an oxygen in this molecule, and with no O–H and no C=O anywhere, an ether is what is left.' }
      ],
      nmr:[
        { ppm:1.20, h:6, mult:'t', j:7, label:'2 × CH₃', note:'Six hydrogens as one triplet. Both halves of the molecule are identical.' },
        { ppm:3.40, h:4, mult:'q', j:7, label:'2 × OCH₂', note:'Four hydrogens as one quartet, next to the oxygen.' }
      ],
      tell:'An oxygen with no O–H and no carbonyl, and a 6:4 two-signal spectrum. Symmetry again.'
    },
    {
      id:'ethylamine', name:'Ethylamine', formula:'C₂H₇N', structure:'CH₃CH₂NH₂',
      ir:[
        { cm:3370, w:60, d:34, label:'N–H (antisym)', note:'The first of two. A primary amine gives a pair of bands here.' },
        { cm:3290, w:60, d:30, label:'N–H (sym)', note:'The second. Count them: two means primary, one means secondary, none means tertiary.' },
        { cm:2960, w:40, d:36, label:'sp³ C–H', note:'Saturated.' }
      ],
      nmr:[
        { ppm:1.10, h:3, mult:'t', j:7, label:'CH₃', note:'Triplet.' },
        { ppm:1.30, h:2, mult:'s', label:'NH₂', note:'Broad, exchangeable, and does not couple — the same behaviour as an O–H.' },
        { ppm:2.72, h:2, mult:'q', j:7, label:'CH₂N', note:'Quartet at 2.7. Nitrogen shifts a neighbouring C–H less than oxygen does, because it is less electronegative — compare ethanol’s 3.69.' }
      ],
      tell:'Two N–H bands rather than one broad O–H, and a CH₂ at 2.7 rather than 3.7.'
    },
    {
      id:'hexyne', name:'1-hexyne', formula:'C₆H₁₀', structure:'HC≡C(CH₂)₃CH₃',
      ir:[
        { cm:3300, w:18, d:48, label:'≡C–H stretch', note:'Sharp and narrow, right where a broad O–H would be. The shape is the difference — an alcohol here is a wide valley, this is a spike.' },
        { cm:2930, w:40, d:38, label:'sp³ C–H', note:'The chain.' },
        { cm:2120, w:16, d:22, label:'C≡C stretch', note:'Weak, but in a region where nothing else absorbs. A symmetrical internal alkyne would show nothing here at all.' }
      ],
      nmr:[
        { ppm:0.92, h:3, mult:'t', j:7, label:'CH₃', note:'The end of the chain.' },
        { ppm:1.45, h:4, mult:'m', label:'2 × CH₂', note:'The middle of the chain, overlapping into a multiplet.' },
        { ppm:1.93, h:1, mult:'t', j:2, label:'≡CH', note:'Only 1.9 ppm — far upfield for a hydrogen on an sp carbon. The ring current of the triple bond actually shields it, which is the opposite of what an alkene does.' },
        { ppm:2.18, h:2, mult:'m', label:'≡C–CH₂', note:'Propargylic, next to the triple bond.' }
      ],
      tell:'A sharp spike at 3300 with a weak partner at 2120. The sharpness is what rules out an alcohol.'
    },
    {
      id:'pxylene', name:'p-xylene', formula:'C₈H₁₀', structure:'CH₃–C₆H₄–CH₃',
      ir:[
        { cm:3020, w:28, d:24, label:'sp² C–H', note:'Aromatic.' },
        { cm:2920, w:35, d:30, label:'sp³ C–H', note:'The two methyls.' },
        { cm:1515, w:26, d:46, label:'aromatic C=C', note:'Ring stretching.' },
        { cm:795,  w:24, d:62, label:'para-substituted ring', note:'ONE band near 800, not the two that toluene shows near 730 and 695. That single band is what says para.' }
      ],
      nmr:[
        { ppm:2.30, h:6, mult:'s', label:'2 × CH₃', note:'Both methyls equivalent by symmetry.' },
        { ppm:7.05, h:4, mult:'s', label:'4 × Ar–H', note:'All four aromatic hydrogens equivalent, so they appear as a singlet. A mono- or ortho-substituted ring could never give this.' }
      ],
      tell:'Two singlets, 6:4, and a single out-of-plane band near 800. The aromatic singlet is only possible for para.'
    }
  ];

  /* ---- Degrees of unsaturation ------------------------------------------ */

  /* DoU = (2C + 2 + N − H − X) / 2. Each unit is one ring or one pi bond, and
     knowing the number before you look at a spectrum tells you what to look
     for — four is nearly always a benzene ring. */
  function parseFormula(text){
    var counts = {};
    var normal = String(text || '').replace(/[₀₁₂₃₄₅₆₇₈₉]/g, function(c){
      return '₀₁₂₃₄₅₆₇₈₉'.indexOf(c);
    });
    var re = /([A-Z][a-z]?)(\d*)/g, m, seen = false;
    while((m = re.exec(normal))){
      if(!m[1]) continue;
      seen = true;
      counts[m[1]] = (counts[m[1]] || 0) + (m[2] ? parseInt(m[2], 10) : 1);
    }
    return seen ? counts : null;
  }

  function degreesOfUnsaturation(counts){
    var C = counts.C || 0;
    var H = (counts.H || 0) + (counts.D || 0);
    var N = counts.N || 0;
    var X = (counts.F || 0) + (counts.Cl || 0) + (counts.Br || 0) + (counts.I || 0);
    return (2 * C + 2 + N - H - X) / 2;
  }

  /* ---- Drawing an IR spectrum -------------------------------------------- */

  var IR_W = 640, IR_H = 220, IR_L = 42, IR_B = 30, IR_T = 12;
  var IR_MAX = 4000, IR_MIN = 500;

  // Wavenumber runs right to left, the way an IR is always printed.
  function irX(cm){
    return IR_L + (IR_MAX - cm) / (IR_MAX - IR_MIN) * (IR_W - IR_L - 10);
  }
  function irY(t){ return IR_T + (100 - t) / 100 * (IR_H - IR_T - IR_B); }

  function irSpectrum(c, highlight){
    var pts = [];
    for(var cm = IR_MAX; cm >= IR_MIN; cm -= 6){
      var t = 100;
      c.ir.forEach(function(p){
        // Each band is a Gaussian in transmittance, so the drawn curve and the
        // peak table are the same data rather than two things to keep in sync.
        var z = (cm - p.cm) / p.w;
        t -= p.d * Math.exp(-z * z);
      });
      // A little baseline drift, so it does not read as a diagram of a spectrum.
      t -= 2 + 1.5 * Math.sin(cm / 260);
      pts.push(irX(cm).toFixed(1) + ' ' + irY(Math.max(2, t)).toFixed(1));
    }

    var grid = [4000, 3500, 3000, 2500, 2000, 1500, 1000, 500].map(function(cm){
      return '<line x1="' + irX(cm).toFixed(1) + '" y1="' + IR_T + '" x2="' + irX(cm).toFixed(1) + '" y2="' + (IR_H - IR_B) + '" stroke="var(--line-soft)" stroke-width="1"/>' +
        '<text class="sp-axis" x="' + irX(cm).toFixed(1) + '" y="' + (IR_H - IR_B + 15) + '" text-anchor="middle">' + cm + '</text>';
    }).join('');

    var markers = c.ir.map(function(p, i){
      var on = highlight === i;
      return '<g class="sp-peak' + (on ? ' is-on' : '') + '" data-peak="' + i + '" tabindex="0" role="button">' +
        '<circle cx="' + irX(p.cm).toFixed(1) + '" cy="' + irY(100 - p.d).toFixed(1) + '" r="' + (on ? 7 : 5) + '" ' +
          'fill="' + (on ? 'var(--accent)' : 'var(--white)') + '" stroke="var(--accent)" stroke-width="2"/>' +
        '<title>' + esc(p.label) + '</title>' +
      '</g>';
    }).join('');

    return '<svg viewBox="0 0 ' + IR_W + ' ' + IR_H + '" role="img" aria-label="Infrared spectrum of ' + esc(c.name) + '">' +
      grid +
      '<line x1="' + IR_L + '" y1="' + (IR_H - IR_B) + '" x2="' + (IR_W - 10) + '" y2="' + (IR_H - IR_B) + '" stroke="var(--line)" stroke-width="1.5"/>' +
      '<line x1="' + IR_L + '" y1="' + IR_T + '" x2="' + IR_L + '" y2="' + (IR_H - IR_B) + '" stroke="var(--line)" stroke-width="1.5"/>' +
      '<text class="sp-axis" x="6" y="' + (IR_T + 9) + '">100</text>' +
      '<text class="sp-axis" x="6" y="' + (IR_H - IR_B) + '">0</text>' +
      '<text class="sp-axis" x="' + (IR_W / 2) + '" y="' + (IR_H - 4) + '" text-anchor="middle">wavenumber (cm⁻¹)</text>' +
      '<polyline points="' + pts.join(' ') + '" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/>' +
      markers +
    '</svg>';
  }

  /* ---- Drawing a ¹H NMR spectrum ----------------------------------------- */

  var NM_W = 640, NM_H = 230, NM_L = 20, NM_B = 30, NM_T = 14;
  var NM_MAX = 12, NM_MIN = 0;

  function nmX(ppm){
    return NM_L + (NM_MAX - ppm) / (NM_MAX - NM_MIN) * (NM_W - NM_L - 14);
  }

  var MULT_LINES = { s:1, d:2, t:3, q:4, quint:5, sext:6, m:5 };

  function nmrSpectrum(c, highlight){
    var base = NM_H - NM_B;
    var maxH = Math.max.apply(null, c.nmr.map(function(s){ return s.h; }));

    var sticks = c.nmr.map(function(s, i){
      var on = highlight === i;
      var n = MULT_LINES[s.mult] || 1;
      // Height is integration, so tall means "more hydrogens" the way it does
      // on a real spectrum, and the multiplet's lines share that total.
      var h = 30 + (s.h / maxH) * 110;
      var spacing = s.mult === 'm' ? 3.4 : (s.j ? s.j * 0.55 : 3);
      var lines = '';
      for(var k = 0; k < n; k++){
        var off = (k - (n - 1) / 2) * spacing;
        /* Binomial intensities, and the AREA is what integration fixes — so a
           singlet of three hydrogens stands taller than a triplet of three,
           whose intensity is split 1:2:1 across its lines. Scaling height by
           the weight directly makes a quartet's tallest line almost invisible,
           so the contrast is softened with a fractional power while keeping
           the ordering right. */
        var weight = binomial(n - 1, k) / Math.pow(2, n - 1);
        var lh = h * 0.92 * Math.pow(weight, 0.6);
        lines += '<line x1="' + (nmX(s.ppm) + off).toFixed(1) + '" y1="' + base + '" ' +
                 'x2="' + (nmX(s.ppm) + off).toFixed(1) + '" y2="' + (base - lh).toFixed(1) + '" ' +
                 'stroke="' + (on ? 'var(--accent)' : 'var(--ink)') + '" stroke-width="2" stroke-linecap="round"/>';
      }
      return '<g class="sp-sig' + (on ? ' is-on' : '') + '" data-sig="' + i + '" tabindex="0" role="button">' +
        '<rect x="' + (nmX(s.ppm) - 22) + '" y="' + (base - h - 26) + '" width="44" height="' + (h + 30) + '" fill="transparent"/>' +
        lines +
        '<text class="sp-int" x="' + nmX(s.ppm).toFixed(1) + '" y="' + (base - h - 14).toFixed(1) + '" text-anchor="middle">' + s.h + 'H</text>' +
        '<title>' + esc(s.label) + '</title>' +
      '</g>';
    }).join('');

    var grid = [12,10,8,6,4,2,0].map(function(p){
      return '<line x1="' + nmX(p).toFixed(1) + '" y1="' + NM_T + '" x2="' + nmX(p).toFixed(1) + '" y2="' + base + '" stroke="var(--line-soft)" stroke-width="1"/>' +
        '<text class="sp-axis" x="' + nmX(p).toFixed(1) + '" y="' + (base + 15) + '" text-anchor="middle">' + p + '</text>';
    }).join('');

    return '<svg viewBox="0 0 ' + NM_W + ' ' + NM_H + '" role="img" aria-label="Proton NMR spectrum of ' + esc(c.name) + '">' +
      grid +
      '<line x1="' + NM_L + '" y1="' + base + '" x2="' + (NM_W - 14) + '" y2="' + base + '" stroke="var(--line)" stroke-width="1.5"/>' +
      '<text class="sp-axis" x="' + (NM_W / 2) + '" y="' + (NM_H - 3) + '" text-anchor="middle">chemical shift (ppm)</text>' +
      sticks +
    '</svg>';
  }

  function binomial(n, k){
    var r = 1;
    for(var i = 1; i <= k; i++) r = r * (n - i + 1) / i;
    return r;
  }

  var MULT_NAME = { s:'singlet', d:'doublet', t:'triplet', q:'quartet', quint:'quintet', sext:'sextet', m:'multiplet' };

  /* ====================================================================== */
  /* Page                                                                    */
  /* ====================================================================== */

  var compound = COMPOUNDS[0];
  var hlIR = null, hlNMR = null;
  var puzzle = null, puzzleGuess = null;
  var score = { right:0, total:0 };

  root.innerHTML =
    '<div class="tpanel">' +
      '<div class="tpanel__head">' +
        '<div class="tseg" id="spMode">' +
          '<button type="button" data-mode="predict" class="on">Read a spectrum</button>' +
          '<button type="button" data-mode="puzzle">Identify it</button>' +
          '<button type="button" data-mode="ref">Reference</button>' +
        '</div>' +
        '<span class="tmuted" id="spScore"></span>' +
      '</div>' +
    '</div>' +

    '<div id="spPredict">' +
      '<div class="tpanel"><div class="tpanel__head">Pick a compound</div>' +
        '<div class="tchips" id="spPicker"></div></div>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head"><span>Infrared</span><span class="tmuted" id="spName"></span></div>' +
        '<div class="sp-chart" id="spIR"></div>' +
        '<div id="spIRNote"></div>' +
      '</div>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head">¹H NMR</div>' +
        '<div class="sp-chart" id="spNMR"></div>' +
        '<div id="spNMRNote"></div>' +
      '</div>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head">Degrees of unsaturation</div>' +
        '<div id="spDou"></div>' +
      '</div>' +
    '</div>' +

    '<div id="spPuzzle" hidden>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head"><span>The data</span>' +
          '<button type="button" class="tchip" id="spNew">New unknown</button></div>' +
        '<div id="spPuzzleData"></div>' +
      '</div>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head">Which compound is it?</div>' +
        '<div class="tchips" id="spOptions"></div>' +
        '<div id="spPuzzleVerdict" style="margin-top:14px;"></div>' +
      '</div>' +
    '</div>' +

    '<div id="spRef" hidden>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head">Where things absorb — infrared</div>' +
        '<div id="spRefIR"></div>' +
      '</div>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head">Where things appear — ¹H NMR</div>' +
        '<div id="spRefNMR"></div>' +
      '</div>' +
      '<div class="tpanel">' +
        '<div class="tpanel__head">Degrees of unsaturation from a formula</div>' +
        '<div class="trow">' +
          '<input type="text" class="tselect" id="spFormula" value="C7H6O" style="max-width:220px;" aria-label="Molecular formula">' +
          '<span class="tmuted">try C₇H₆O, C₆H₆, C₄H₈O₂</span>' +
        '</div>' +
        '<div id="spDouCalc" style="margin-top:14px;"></div>' +
      '</div>' +
    '</div>';

  document.getElementById('spMode').querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){
      var m = b.getAttribute('data-mode');
      document.getElementById('spMode').querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === b); });
      document.getElementById('spPredict').hidden = m !== 'predict';
      document.getElementById('spPuzzle').hidden = m !== 'puzzle';
      document.getElementById('spRef').hidden = m !== 'ref';
      if(m === 'puzzle' && !puzzle) newPuzzle();
    });
  });

  /* ---- Predict mode ------------------------------------------------------ */

  document.getElementById('spPicker').innerHTML = COMPOUNDS.map(function(c){
    return '<button type="button" class="tchip" data-id="' + esc(c.id) + '">' + esc(c.name) + '</button>';
  }).join('');
  document.getElementById('spPicker').querySelectorAll('.tchip').forEach(function(b){
    b.addEventListener('click', function(){
      COMPOUNDS.forEach(function(c){ if(c.id === b.getAttribute('data-id')) compound = c; });
      hlIR = null; hlNMR = null;
      renderPredict();
    });
  });

  function renderPredict(){
    document.getElementById('spPicker').querySelectorAll('.tchip').forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-id') === compound.id);
    });
    document.getElementById('spName').textContent = compound.structure + ' · ' + compound.formula;

    document.getElementById('spIR').innerHTML = irSpectrum(compound, hlIR);
    document.getElementById('spIR').querySelectorAll('.sp-peak').forEach(function(g){
      var pick = function(){ hlIR = parseInt(g.getAttribute('data-peak'), 10); renderPredict(); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pick(); } });
    });

    document.getElementById('spIRNote').innerHTML =
      '<div class="ttable-scroll"><table class="ttable"><thead><tr><th>cm⁻¹</th><th>Assignment</th><th>What it tells you</th></tr></thead><tbody>' +
      compound.ir.map(function(p, i){
        return '<tr class="' + (hlIR === i ? 'sp-row-on' : '') + '"><td class="num">' + p.cm + '</td>' +
          '<td style="white-space:nowrap;"><b>' + esc(p.label) + '</b></td><td>' + esc(p.note) + '</td></tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<p class="tmuted" style="margin-top:10px;">Click a marker on the spectrum to highlight its row. The curve is drawn from these ' +
      'numbers, so the picture and the table cannot disagree.</p>';

    document.getElementById('spNMR').innerHTML = nmrSpectrum(compound, hlNMR);
    document.getElementById('spNMR').querySelectorAll('.sp-sig').forEach(function(g){
      var pick = function(){ hlNMR = parseInt(g.getAttribute('data-sig'), 10); renderPredict(); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pick(); } });
    });

    var totalH = compound.nmr.reduce(function(n, s){ return n + s.h; }, 0);
    document.getElementById('spNMRNote').innerHTML =
      '<div class="ttable-scroll"><table class="ttable"><thead><tr><th>ppm</th><th>Integration</th><th>Shape</th><th>Assignment</th><th>Why</th></tr></thead><tbody>' +
      compound.nmr.slice().sort(function(a, b){ return a.ppm - b.ppm; }).map(function(s){
        var i = compound.nmr.indexOf(s);
        return '<tr class="' + (hlNMR === i ? 'sp-row-on' : '') + '"><td class="num">' + s.ppm.toFixed(2) + '</td>' +
          '<td class="num">' + s.h + 'H</td>' +
          '<td style="white-space:nowrap;">' + esc(MULT_NAME[s.mult] || s.mult) +
            (s.j ? ' <span class="tmuted">J ≈ ' + s.j + ' Hz</span>' : '') + '</td>' +
          '<td style="white-space:nowrap;"><b>' + esc(s.label) + '</b></td><td>' + esc(s.note) + '</td></tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<p class="tmuted" style="margin-top:10px;">' + compound.nmr.length + ' signal' + (compound.nmr.length === 1 ? '' : 's') +
      ' for ' + totalH + ' hydrogens. The number of signals counts distinct environments, not hydrogens — ' +
      'symmetry is why those two numbers differ.</p>';

    renderDou(document.getElementById('spDou'), compound.formula, compound);
  }

  function renderDou(el, formula, c){
    var counts = parseFormula(formula);
    if(!counts){ el.innerHTML = '<div class="tempty">Enter a molecular formula.</div>'; return; }
    var d = degreesOfUnsaturation(counts);

    if(d < 0 || d % 0.5 !== 0){
      el.innerHTML = '<div class="tnote tnote--bad"><span class="tnote__k">That formula does not work</span>' +
        'Degrees of unsaturation came out as ' + d + '. A real neutral molecule always gives a whole number ' +
        'that is zero or more, so there is a typo in the formula.</div>';
      return;
    }

    var reading = d === 0 ? 'No rings and no pi bonds — this is fully saturated.'
      : d === 1 ? 'One ring OR one double bond. Exactly one of the two, and the spectra have to tell you which.'
      : d === 4 ? 'Four is the number to recognize on sight: a benzene ring is three pi bonds plus one ring. If a formula gives four and the IR shows C–H above 3000, look for an aromatic ring before anything else.'
      : d === 5 ? 'Five. Most often a benzene ring (which accounts for four) plus one more pi bond — a carbonyl, usually. Check the carbonyl region next.'
      : d >= 6 ? d + ' — likely a ring or two plus several pi bonds.'
      : d + ' rings and pi bonds between them, in some combination.';

    el.innerHTML =
      '<div class="tstat">' +
        '<div><div class="k">Formula</div><div class="v" style="font-size:16px;">' + esc(formula) + '</div></div>' +
        '<div><div class="k">Degrees of unsaturation</div><div class="v">' + d + '</div></div>' +
      '</div>' +
      '<div class="tnote tnote--info"><span class="tnote__k">What that means</span>' + esc(reading) + '</div>' +
      '<p class="tmuted" style="margin:0;">DoU = (2C + 2 + N − H − halogens) ÷ 2 = ' +
      '(2×' + (counts.C || 0) + ' + 2 + ' + (counts.N || 0) + ' − ' + (counts.H || 0) + ' − ' +
      ((counts.F||0)+(counts.Cl||0)+(counts.Br||0)+(counts.I||0)) + ') ÷ 2 = <b>' + d + '</b>. ' +
      'Oxygen is absent from the formula because adding an oxygen into a chain changes nothing about how ' +
      'saturated it is.' + (c ? ' ' + esc(c.tell) : '') + '</p>';
  }

  /* ---- Reference mode ---------------------------------------------------- */

  /* Regions overlap — that is the point of them — so they are packed onto as
     many rows as it takes for no two to collide. The collision test uses the
     LABEL's extent, not the band's: "≡C–H" occupies sixty wavenumbers and
     about forty pixels of text, and packing by the band alone produced a chart
     whose labels sat on top of each other and were then clipped to
     unreadable stubs ("p² C–", "atic substit"). */
  function packRows(items, spanOf){
    var rows = [];
    items.forEach(function(it){
      var span = spanOf(it);
      for(var r = 0; r < rows.length; r++){
        if(rows[r] <= span.left){ it.row = r; rows[r] = span.right; return; }
      }
      it.row = rows.length;
      rows.push(span.right);
    });
    return rows.length;
  }

  var ROW_H = 30;

  // Roughly how much horizontal room a label needs, as a percentage of the
  // chart width. Approximate on purpose: it only has to be close enough to
  // keep two labels from sharing a row.
  function labelSpan(leftPct, widthPct, label){
    var estPct = (label.length * 6.4 + 14) / 900 * 100;
    return { left: leftPct, right: leftPct + Math.max(widthPct, estPct) + 1 };
  }

  function bandMarkup(items, note){
    var count = packRows(items, function(it){ return it.span; });
    return '<div class="sp-bands" style="height:' + (count * ROW_H + 4) + 'px;">' +
      items.map(function(it){
        return '<button type="button" class="sp-band' + (it.variable ? ' sp-band--variable' : '') + '" ' +
          'data-idx="' + it.idx + '" style="left:' + it.left.toFixed(2) + '%;width:' + it.width.toFixed(2) + '%;' +
          'top:' + (it.row * ROW_H) + 'px;">' +
          '<span class="sp-band__bar"></span>' +
          '<span class="sp-band__label">' + esc(it.label) + '</span>' +
        '</button>';
      }).join('') +
    '</div>';
  }

  function renderRef(){
    var irItems = IR_BANDS.map(function(b, i){
      var left = (IR_MAX - b.hi) / (IR_MAX - IR_MIN) * 100;
      var width = Math.max((b.hi - b.lo) / (IR_MAX - IR_MIN) * 100, 1);
      return { idx:i, label:b.label, left:left, width:width, span:labelSpan(left, width, b.label) };
    });

    document.getElementById('spRefIR').innerHTML =
      bandMarkup(irItems) +
      '<div class="sp-scale">' + [4000,3500,3000,2500,2000,1500,1000,500].map(function(cm){
        return '<span style="left:' + ((IR_MAX - cm) / (IR_MAX - IR_MIN) * 100).toFixed(2) + '%">' + cm + '</span>';
      }).join('') + '</div>' +
      '<div id="spBandNote" class="tnote" style="margin-top:24px;"><span class="tnote__k">Pick a band</span>' +
        'Every region above is a place something absorbs, and they overlap because real spectra do. Click one to ' +
        'find out what it is and what its shape adds. The single most useful line on the whole axis is 3000: ' +
        'C–H above it is sp², C–H below it is sp³.</div>';

    document.getElementById('spRefIR').querySelectorAll('.sp-band').forEach(function(b){
      b.addEventListener('click', function(){
        var band = IR_BANDS[parseInt(b.getAttribute('data-idx'), 10)];
        document.getElementById('spRefIR').querySelectorAll('.sp-band').forEach(function(x){ x.classList.toggle('on', x === b); });
        document.getElementById('spBandNote').innerHTML =
          '<span class="tnote__k">' + esc(band.label) + ' · ' + band.lo + '–' + band.hi + ' cm⁻¹ · ' + esc(band.shape) + '</span>' + esc(band.note);
      });
    });

    var nmrItems = NMR_ZONES.map(function(z, i){
      // The carboxylic-acid region runs past the top of the axis; clamp it so
      // the band starts at the edge rather than off the left of the chart.
      var hi = Math.min(z.hi, NM_MAX);
      var left = (NM_MAX - hi) / NM_MAX * 100;
      var width = Math.max((hi - z.lo) / NM_MAX * 100, 1);
      return { idx:i, label:z.label, variable:z.variable, left:left, width:width,
               span:labelSpan(left, width, z.label) };
    });

    document.getElementById('spRefNMR').innerHTML =
      bandMarkup(nmrItems) +
      '<div class="sp-scale">' + [12,10,8,6,4,2,0].map(function(p){
        return '<span style="left:' + ((NM_MAX - p) / NM_MAX * 100).toFixed(2) + '%">' + p + '</span>';
      }).join('') + '</div>' +
      '<div id="spZoneNote" class="tnote" style="margin-top:24px;"><span class="tnote__k">Pick a region</span>' +
        'Downfield is to the LEFT, which catches people out. Everything on this axis comes down to one idea: ' +
        'anything that pulls electron density away from a hydrogen leaves it exposed to the magnetic field, ' +
        'and exposed hydrogens appear further left.</div>';

    document.getElementById('spRefNMR').querySelectorAll('.sp-band').forEach(function(b){
      b.addEventListener('click', function(){
        var z = NMR_ZONES[parseInt(b.getAttribute('data-idx'), 10)];
        document.getElementById('spRefNMR').querySelectorAll('.sp-band').forEach(function(x){ x.classList.toggle('on', x === b); });
        document.getElementById('spZoneNote').innerHTML =
          '<span class="tnote__k">' + esc(z.label) + ' · ' + z.lo + '–' + z.hi + ' ppm</span>' + esc(z.note);
      });
    });

    var input = document.getElementById('spFormula');
    var update = function(){ renderDou(document.getElementById('spDouCalc'), input.value, null); };
    input.addEventListener('input', update);
    update();
  }

  /* ---- Puzzle mode ------------------------------------------------------- */

  function newPuzzle(){
    var pool = COMPOUNDS.slice();
    var answer = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    var options = [answer];
    while(options.length < 4 && pool.length){
      options.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    options.sort(function(){ return Math.random() - 0.5; });
    puzzle = { answer: answer, options: options };
    puzzleGuess = null;
    renderPuzzle();
  }

  function renderPuzzle(){
    if(!puzzle) return;
    var c = puzzle.answer;
    var counts = parseFormula(c.formula);
    var d = degreesOfUnsaturation(counts);

    /* The unknown is presented the way an exam presents one: formula, a peak
       list, a signal list, and no name anywhere. The drawn spectra are shown
       too, because reading the shape is half the skill and a table of numbers
       quietly removes that half. */
    document.getElementById('spPuzzleData').innerHTML =
      '<div class="tstat">' +
        '<div><div class="k">Molecular formula</div><div class="v" style="font-size:16px;">' + esc(c.formula) + '</div></div>' +
        '<div><div class="k">Degrees of unsaturation</div><div class="v">' + d + '</div></div>' +
        '<div><div class="k">NMR signals</div><div class="v">' + c.nmr.length + '</div></div>' +
      '</div>' +
      '<div class="sp-chart">' + irSpectrum(c, null) + '</div>' +
      '<div class="sp-chart" style="margin-top:12px;">' + nmrSpectrum(c, null) + '</div>' +
      '<div class="ttable-scroll" style="margin-top:12px;"><table class="ttable">' +
        '<thead><tr><th>IR (cm⁻¹)</th><th>¹H NMR</th></tr></thead><tbody><tr>' +
        '<td>' + c.ir.map(function(p){ return p.cm + (p.d > 60 ? ' (strong)' : p.d < 30 ? ' (weak)' : ''); }).join('<br>') + '</td>' +
        '<td>' + c.nmr.slice().sort(function(a, b){ return b.ppm - a.ppm; }).map(function(s){
          return s.ppm.toFixed(2) + ' ppm, ' + s.h + 'H, ' + (MULT_NAME[s.mult] || s.mult);
        }).join('<br>') + '</td>' +
        '</tr></tbody></table></div>';

    document.getElementById('spOptions').innerHTML = puzzle.options.map(function(o){
      var state = '';
      if(puzzleGuess){
        if(o.id === c.id) state = ' sp-opt--right';
        else if(o.id === puzzleGuess) state = ' sp-opt--wrong';
      }
      return '<button type="button" class="tchip' + state + (puzzleGuess ? ' ' : '') + '" data-id="' + esc(o.id) + '"' +
        (puzzleGuess ? ' disabled' : '') + '>' + esc(o.structure) + '</button>';
    }).join('');

    document.getElementById('spOptions').querySelectorAll('.tchip').forEach(function(b){
      b.addEventListener('click', function(){
        if(puzzleGuess) return;
        puzzleGuess = b.getAttribute('data-id');
        score.total++;
        if(puzzleGuess === c.id) score.right++;
        renderPuzzle();
      });
    });

    document.getElementById('spScore').textContent = score.total ? score.right + ' of ' + score.total + ' right' : '';

    var elV = document.getElementById('spPuzzleVerdict');
    if(!puzzleGuess){
      elV.innerHTML = '<p class="tmuted" style="margin:0;">Work from the largest clues down: the degrees of unsaturation, ' +
        'then the carbonyl region, then whether there is an O–H or N–H, then the integration ratio.</p>';
      return;
    }

    var right = puzzleGuess === c.id;
    elV.innerHTML =
      '<div class="tnote ' + (right ? 'tnote--good' : 'tnote--bad') + '">' +
        '<span class="tnote__k">' + (right ? 'Correct' : 'It was ' + esc(c.name)) + '</span>' +
        esc(c.name) + ', ' + esc(c.structure) + '. ' + esc(c.tell) +
      '</div>' +
      '<div class="ttable-scroll"><table class="ttable"><thead><tr><th>Peak</th><th>Why it is there</th></tr></thead><tbody>' +
      c.ir.map(function(p){
        return '<tr><td class="num" style="white-space:nowrap;">' + p.cm + ' — ' + esc(p.label) + '</td><td>' + esc(p.note) + '</td></tr>';
      }).join('') +
      c.nmr.map(function(s){
        return '<tr><td class="num" style="white-space:nowrap;">' + s.ppm.toFixed(2) + ' ppm — ' + esc(s.label) + '</td><td>' + esc(s.note) + '</td></tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<button type="button" class="tchip" id="spNext" style="margin-top:12px;">Next unknown</button>';

    document.getElementById('spNext').addEventListener('click', newPuzzle);
  }

  document.getElementById('spNew').addEventListener('click', newPuzzle);

  renderPredict();
  renderRef();
})();
