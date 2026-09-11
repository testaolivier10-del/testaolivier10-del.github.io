/* Ochem curriculum — a single source of truth for modules/topics/lessons so
   Learn, Mastery, and the sub-nav all read the same structure instead of
   each page hand-listing modules and drifting out of sync.

   A topic's `href` is null until its lesson actually exists — Learn renders
   those as locked "coming soon" cards instead of dead links, and Mastery
   excludes them from the mastery calculation entirely (no content yet means
   nothing to have mastered, not 0%).

   Progress is read from localStorage under 'ochem_progress': a plain object
   keyed by topic id -> { correct, attempts } accumulated by each lesson via
   OchemCurriculum.recordAttempt(topicId, isCorrect). Lessons own recording;
   this file only owns the shape of the curriculum and reading it back. */
(function(){
  var MODULES = [
    { id: 'foundations', title: 'Foundations', topics: [
      { id: 'atomic-structure', title: 'Atomic structure', href: 'lessons/atomic-structure.html' },
      { id: 'orbitals', title: 'Orbitals', href: 'lessons/orbitals.html' },
      { id: 'hybridization', title: 'Hybridization', href: 'lessons/hybridization.html' },
      { id: 'bonding', title: 'Bonding', href: 'lessons/bonding.html' },
      { id: 'electronegativity', title: 'Electronegativity', href: 'lessons/electronegativity.html' },
      { id: 'formal-charge', title: 'Formal charge', href: 'lessons/formal-charge.html' },
      { id: 'lewis-structures', title: 'Lewis structures', href: 'lessons/lewis-structures.html' },
      { id: 'molecular-geometry', title: 'Molecular geometry', href: 'lessons/molecular-geometry.html' },
      { id: 'bond-polarity', title: 'Bond polarity', href: 'lessons/bond-polarity.html' }
    ]},
    { id: 'electron-movement', title: 'Organic Structure & Electron Movement', topics: [
      { id: 'resonance', title: 'Resonance', href: 'lessons/resonance.html' },
      { id: 'curved-arrows', title: 'Curved arrows', href: 'lessons/curved-arrows.html', dependsOn: ['resonance'] },
      { id: 'nucleophiles', title: 'Nucleophiles', href: 'lessons/nucleophiles.html', dependsOn: ['electronegativity'] },
      { id: 'electrophiles', title: 'Electrophiles', href: 'lessons/electrophiles.html', dependsOn: ['electronegativity'] },
      { id: 'leaving-groups', title: 'Leaving groups', href: 'lessons/leaving-groups.html', dependsOn: ['electrophiles'] },
      { id: 'electron-rich-poor', title: 'Electron-rich vs. electron-poor atoms', href: 'lessons/electron-rich-poor.html', dependsOn: ['nucleophiles', 'electrophiles'] }
    ]},
    { id: 'acids-bases', title: 'Acids & Bases', topics: [
      { id: 'bronsted', title: 'Brønsted acids/bases', href: 'lessons/bronsted.html' },
      { id: 'lewis-acids', title: 'Lewis acids/bases', href: 'lessons/lewis-acids.html', dependsOn: ['nucleophiles', 'electrophiles'] },
      { id: 'pka', title: 'pKa', href: 'lessons/pka.html', dependsOn: ['bronsted'] },
      { id: 'conjugate', title: 'Conjugate acids/bases', href: 'lessons/conjugate.html', dependsOn: ['pka'] },
      { id: 'acidity-factors', title: 'Factors affecting acidity', href: 'lessons/acidity-factors.html', dependsOn: ['pka', 'resonance', 'electronegativity', 'hybridization'] }
    ]},
    { id: 'alkanes-conformations', title: 'Alkanes & Conformations', topics: [
      { id: 'newman', title: 'Newman projections', href: 'lessons/newman.html' },
      { id: 'cyclohexanes', title: 'Cyclohexanes', href: 'lessons/cyclohexanes.html', dependsOn: ['newman'] },
      { id: 'axial-equatorial', title: 'Axial/equatorial', href: 'lessons/axial-equatorial.html', dependsOn: ['cyclohexanes'] },
      { id: 'ring-flips', title: 'Ring flips', href: 'lessons/ring-flips.html', dependsOn: ['axial-equatorial'] },
      { id: 'conformational-analysis', title: 'Conformational analysis', href: 'lessons/conformational-analysis.html', dependsOn: ['ring-flips'] }
    ]},
    { id: 'stereochemistry', title: 'Stereochemistry', topics: [
      { id: 'chirality', title: 'Chirality', href: 'lessons/chirality.html' },
      { id: 'stereocenters', title: 'Stereocenters', href: 'lessons/stereocenters.html', dependsOn: ['chirality'] },
      { id: 'enantiomers', title: 'Enantiomers', href: 'lessons/enantiomers.html', dependsOn: ['stereocenters'] },
      { id: 'diastereomers', title: 'Diastereomers', href: 'lessons/diastereomers.html', dependsOn: ['enantiomers'] },
      { id: 'meso', title: 'Meso compounds', href: 'lessons/meso.html', dependsOn: ['diastereomers'] },
      { id: 'rs-configuration', title: 'R/S configuration', href: 'lessons/rs-configuration.html', dependsOn: ['stereocenters', 'electronegativity'] },
      { id: 'fischer', title: 'Fischer projections', href: 'lessons/fischer.html', dependsOn: ['rs-configuration'] }
    ]},
    { id: 'substitution-elimination', title: 'Substitution & Elimination', topics: [
      { id: 'sn2', title: 'SN2', href: 'mechanisms/sn2.html' },
      { id: 'sn1', title: 'SN1', href: 'mechanisms/sn1.html' },
      { id: 'e1', title: 'E1', href: 'mechanisms/e1.html', dependsOn: ['sn1'] },
      { id: 'e2', title: 'E2', href: 'mechanisms/e2.html', dependsOn: ['conformational-analysis', 'leaving-groups', 'bronsted'] },
      { id: 'substrate-effects', title: 'Substrate & solvent effects', href: 'lessons/substrate-effects.html', dependsOn: ['sn2', 'sn1', 'e1', 'e2'] }
    ]},
    { id: 'alkenes-alkynes', title: 'Alkenes & Alkynes', topics: [
      { id: 'alkene-structure', title: 'Alkene structure', href: 'lessons/alkene-structure.html', dependsOn: ['hybridization'] },
      { id: 'addition-reactions', title: 'Addition reactions', href: 'lessons/addition-reactions.html', dependsOn: ['alkene-structure', 'nucleophiles', 'electrophiles'] },
      { id: 'markovnikov', title: 'Markovnikov / anti-Markovnikov', href: 'lessons/markovnikov.html', dependsOn: ['addition-reactions', 'sn1'] },
      { id: 'alkynes', title: 'Alkynes', href: 'lessons/alkynes.html', dependsOn: ['alkene-structure', 'acidity-factors', 'sn2'] }
    ]},
    { id: 'alcohols-ethers', title: 'Alcohols, Ethers & Related Chemistry', topics: [
      { id: 'alcohol-reactions', title: 'Alcohol reactions', href: 'lessons/alcohol-reactions.html', dependsOn: ['leaving-groups', 'e1'] },
      { id: 'ether-chemistry', title: 'Ether chemistry', href: 'lessons/ether-chemistry.html', dependsOn: ['sn2', 'alcohol-reactions'] },
      { id: 'epoxides', title: 'Epoxides', href: 'lessons/epoxides.html', dependsOn: ['ether-chemistry', 'cyclohexanes', 'substrate-effects'] }
    ]},
    { id: 'carbonyl-chemistry', title: 'Carbonyl Chemistry', topics: [
      { id: 'aldehydes-ketones', title: 'Aldehydes & ketones', href: null },
      { id: 'nucleophilic-addition', title: 'Nucleophilic addition', href: null },
      { id: 'acetals', title: 'Acetals & hemiacetals', href: null }
    ]},
    { id: 'carboxylic-acids', title: 'Carboxylic Acids & Derivatives', topics: [
      { id: 'carboxylic-acids', title: 'Carboxylic acids', href: null },
      { id: 'esters-amides', title: 'Esters & amides', href: null },
      { id: 'acyl-substitution', title: 'Nucleophilic acyl substitution', href: null }
    ]},
    { id: 'enolate-chemistry', title: 'Enolate Chemistry', topics: [
      { id: 'alpha-hydrogens', title: 'Alpha hydrogens & enolates', href: null },
      { id: 'aldol', title: 'Aldol reactions', href: null },
      { id: 'claisen', title: 'Claisen reactions', href: null }
    ]},
    { id: 'amines', title: 'Amines', topics: [
      { id: 'amine-structure', title: 'Structure & basicity', href: null },
      { id: 'amine-reactions', title: 'Reactions', href: null }
    ]},
    { id: 'aromatic-chemistry', title: 'Aromatic Chemistry', topics: [
      { id: 'aromaticity', title: 'Aromaticity', href: null },
      { id: 'eas', title: 'Electrophilic aromatic substitution', href: null },
      { id: 'directing-effects', title: 'Ortho/meta/para directing effects', href: null }
    ]},
    { id: 'spectroscopy', title: 'Spectroscopy', topics: [
      { id: 'ir', title: 'IR', href: null },
      { id: 'h-nmr', title: '¹H NMR', href: null },
      { id: 'c-nmr', title: '¹³C NMR', href: null },
      { id: 'mass-spec', title: 'Mass spectrometry', href: null }
    ]}
  ];

  function readProgress(){
    try{ var raw = localStorage.getItem('ochem_progress'); return raw ? JSON.parse(raw) : {}; }
    catch(e){ return {}; }
  }
  function writeProgress(p){
    try{ localStorage.setItem('ochem_progress', JSON.stringify(p)); }catch(e){}
  }

  // Every lesson calls this on each answered question so mastery reflects
  // performance across attempts, not just whether the lesson was opened.
  function recordAttempt(topicId, isCorrect){
    var p = readProgress();
    var t = p[topicId] || { correct: 0, attempts: 0 };
    t.attempts++;
    if(isCorrect) t.correct++;
    p[topicId] = t;
    writeProgress(p);
  }

  function topicMastery(topicId){
    var p = readProgress();
    var t = p[topicId];
    if(!t || t.attempts < 1) return null; // not started
    return Math.round((t.correct / t.attempts) * 100);
  }

  // A module's mastery only counts topics that have a lesson AND have been
  // attempted — modules with no shipped lessons yet report null, not 0%.
  function moduleMastery(mod){
    var scored = mod.topics
      .filter(function(t){ return t.href; })
      .map(function(t){ return topicMastery(t.id); })
      .filter(function(m){ return m !== null; });
    if(!scored.length) return null;
    return Math.round(scored.reduce(function(a,b){ return a+b; }, 0) / scored.length);
  }

  function overallMastery(){
    var scored = MODULES.map(moduleMastery).filter(function(m){ return m !== null; });
    if(!scored.length) return null;
    return Math.round(scored.reduce(function(a,b){ return a+b; }, 0) / scored.length);
  }

  function findTopic(topicId){
    for(var i=0;i<MODULES.length;i++){
      for(var j=0;j<MODULES[i].topics.length;j++){
        if(MODULES[i].topics[j].id === topicId) return MODULES[i].topics[j];
      }
    }
    return null;
  }

  // The concept-dependency check from the spec: "you're struggling with E2,
  // so review conformational analysis first" — rather than just serving more
  // E2 questions. A topic only counts as "struggling" once there's enough
  // signal (5+ attempts) to mean something, not one unlucky first try.
  // Prerequisite topics are surfaced whether or not their own lesson exists
  // yet — the recommendation is honest either way ("review this" vs
  // "this hasn't been built yet"), rather than hiding the dependency.
  var STRUGGLING_THRESHOLD = 60;
  var MIN_ATTEMPTS_TO_JUDGE = 5;
  function strugglingPrerequisites(topicId){
    var topic = findTopic(topicId);
    if(!topic || !topic.dependsOn || !topic.dependsOn.length) return null;
    var p = readProgress();
    var t = p[topicId];
    if(!t || t.attempts < MIN_ATTEMPTS_TO_JUDGE) return null;
    var score = Math.round((t.correct / t.attempts) * 100);
    if(score >= STRUGGLING_THRESHOLD) return null;
    return {
      topic: topic,
      score: score,
      prerequisites: topic.dependsOn.map(findTopic).filter(Boolean)
    };
  }

  window.OchemCurriculum = {
    MODULES: MODULES,
    recordAttempt: recordAttempt,
    topicMastery: topicMastery,
    moduleMastery: moduleMastery,
    overallMastery: overallMastery,
    findTopic: findTopic,
    strugglingPrerequisites: strugglingPrerequisites
  };
})();
