/* Extra structures the tools need that the course itself does not.

   molecules.js is the library the practice questions draw from, and every
   entry in it exists because some question points at it. The tools want a
   handful of species no question asks about — an allyl cation to delocalize,
   a carbonate to find the third form of, a set of acids to line up by pKa —
   and folding those into the question library would leave it full of
   molecules nothing references.

   So they register themselves into the same namespace from here, and
   Mol.get() finds them either way. Loaded only by the pages that need them. */
(function(){
  var Mol = window.OchemMolecules;
  if(!Mol) return;
  var M = Mol.ALL;

  /* Six points of a hexagon, first vertex at the top — the same construction
     molecules.js uses for benzene, repeated because it keeps it private. */
  function ring6(cx, cy, r){
    var out = [];
    for(var i=0;i<6;i++){
      var a = (-90 + i*60) * Math.PI/180;
      out.push({ x: Math.round(cx + r*Math.cos(a)), y: Math.round(cy + r*Math.sin(a)) });
    }
    return out;
  }

  /* ---- Delocalized species for the Resonance Explorer ------------------ */

  M['allyl-cation'] = {
    name: 'Allyl cation', formula: 'C₃H₅⁺',
    atoms: {
      c1: { x:62,  y:118, r:17, label:'C' },
      c2: { x:160, y:66,  r:17, label:'C' },
      c3: { x:258, y:118, r:17, label:'C', charge:'⁺', role:'electrophile',
            note:'An empty p orbital sitting right next to a pi bond. That is the whole setup for delocalization.' }
    },
    bonds: [{a:'c1',b:'c2',order:2},{a:'c2',b:'c3'}],
    caption: 'A pi bond and an empty orbital, one atom apart.'
  };

  M['allyl-anion'] = {
    name: 'Allyl anion', formula: 'C₃H₅⁻',
    atoms: {
      c1: { x:62,  y:118, r:17, label:'C' },
      c2: { x:160, y:66,  r:17, label:'C' },
      c3: { x:258, y:118, r:17, label:'C', charge:'⁻', lp:1, role:'nucleophile',
            note:'A lone pair in a p orbital, conjugated with the pi bond next door.' }
    },
    bonds: [{a:'c1',b:'c2',order:2},{a:'c2',b:'c3'}],
    caption: 'The same skeleton as the cation, two electrons richer.'
  };

  M['enolate'] = {
    name: 'Enolate', formula: 'C₂H₃O⁻',
    atoms: {
      c1: { x:62,  y:118, r:17, label:'C', role:'nucleophile',
            note:'The carbon end of the enolate. It is the end that usually does the attacking, even though the charge prefers oxygen.' },
      c2: { x:160, y:66,  r:17, label:'C' },
      o:  { x:258, y:118, r:17, label:'O', charge:'⁻', lp:3, role:'electron-rich',
            note:'Oxygen holds the charge more comfortably than carbon does — which is why this is the major contributor.' }
    },
    bonds: [{a:'c1',b:'c2',order:2},{a:'c2',b:'o'}],
    caption: 'One anion, two places to put it — and they are not equally good.'
  };

  M['nitromethane'] = {
    name: 'Nitromethane', formula: 'CH₃NO₂', viewBox: '0 0 320 180',
    atoms: {
      c:  { x:56,  y:90, r:17, label:'C' },
      n:  { x:150, y:90, r:17, label:'N', charge:'⁺',
            note:'Nitrogen is positive in every resonance form of a nitro group. Four bonds and no lone pair leaves it one electron short of neutral.' },
      o1: { x:226, y:40, r:16, label:'O', lp:2 },
      o2: { x:226, y:140,r:16, label:'O', charge:'⁻', lp:3 }
    },
    bonds: [{a:'c',b:'n'},{a:'n',b:'o1',order:2},{a:'n',b:'o2'}],
    caption: 'Charge-separated even at its best — there is no neutral way to draw it.'
  };

  M['carbonate'] = {
    name: 'Carbonate', formula: 'CO₃²⁻', viewBox: '0 0 320 180',
    atoms: {
      c:  { x:160, y:80, r:17, label:'C' },
      o1: { x:160, y:22, r:16, label:'O', lp:2 },
      o2: { x:96,  y:134,r:16, label:'O', charge:'⁻', lp:3 },
      o3: { x:224, y:134,r:16, label:'O', charge:'⁻', lp:3 }
    },
    bonds: [{a:'c',b:'o1',order:2},{a:'c',b:'o2'},{a:'c',b:'o3'}],
    caption: 'Three oxygens, two charges, and no reason to prefer any one of them.'
  };

  M['phenoxide'] = (function(){
    var p = ring6(160, 112, 46), atoms = {};
    ['c1','c2','c3','c4','c5','c6'].forEach(function(k, i){
      atoms[k] = { x:p[i].x, y:p[i].y, r:15, label:'C' };
    });
    atoms.o = { x:160, y:22, r:16, label:'O', charge:'⁻', lp:3, role:'electron-rich',
      note:'Push this lone pair into the ring and the charge has to go somewhere. Where it can go is the whole question.' };
    return {
      name:'Phenoxide', formula:'C₆H₅O⁻', viewBox:'0 0 320 180',
      atoms: atoms,
      bonds:[
        {a:'c1',b:'c2',order:2},{a:'c2',b:'c3'},{a:'c3',b:'c4',order:2},
        {a:'c4',b:'c5'},{a:'c5',b:'c6',order:2},{a:'c6',b:'c1'},{a:'c1',b:'o'}
      ],
      caption:'The conjugate base of phenol. The charge does not stay on the oxygen.'
    };
  })();

  M['benzyl-cation'] = (function(){
    var p = ring6(160, 112, 46), atoms = {};
    ['c1','c2','c3','c4','c5','c6'].forEach(function(k, i){
      atoms[k] = { x:p[i].x, y:p[i].y, r:15, label:'C' };
    });
    atoms.c7 = { x:160, y:22, r:16, label:'C', charge:'⁺', role:'electrophile',
      note:'An empty p orbital pointed straight at an aromatic ring. It does not stay empty.' };
    return {
      name:'Benzyl cation', formula:'C₇H₇⁺', viewBox:'0 0 320 180',
      atoms: atoms,
      bonds:[
        {a:'c1',b:'c2',order:2},{a:'c2',b:'c3'},{a:'c3',b:'c4',order:2},
        {a:'c4',b:'c5'},{a:'c5',b:'c6',order:2},{a:'c6',b:'c1'},{a:'c1',b:'c7'}
      ],
      caption:'A primary carbocation that behaves like a tertiary one. Resonance is why.'
    };
  })();

  M['formate'] = {
    name: 'Formate', formula: 'CHO₂⁻',
    atoms: {
      h:  { x:60,  y:86, r:12, label:'H' },
      c:  { x:140, y:86, r:17, label:'C' },
      o1: { x:220, y:38, r:16, label:'O', lp:2 },
      o2: { x:220, y:134,r:16, label:'O', charge:'⁻', lp:3 }
    },
    bonds: [{a:'h',b:'c'},{a:'c',b:'o1',order:2},{a:'c',b:'o2'}],
    caption: 'The simplest carboxylate. Two oxygens, one charge, no alkyl group in the way.'
  };
})();
