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
      { id: 'resonance', title: 'Resonance', href: null },
      { id: 'curved-arrows', title: 'Curved arrows', href: null },
      { id: 'nucleophiles', title: 'Nucleophiles', href: null },
      { id: 'electrophiles', title: 'Electrophiles', href: null },
      { id: 'leaving-groups', title: 'Leaving groups', href: null },
      { id: 'electron-rich-poor', title: 'Electron-rich vs. electron-poor atoms', href: null }
    ]},
    { id: 'acids-bases', title: 'Acids & Bases', topics: [
      { id: 'bronsted', title: 'Brønsted acids/bases', href: null },
      { id: 'lewis-acids', title: 'Lewis acids/bases', href: null },
      { id: 'pka', title: 'pKa', href: null },
      { id: 'conjugate', title: 'Conjugate acids/bases', href: null },
      { id: 'acidity-factors', title: 'Factors affecting acidity', href: null }
    ]},
    { id: 'alkanes-conformations', title: 'Alkanes & Conformations', topics: [
      { id: 'newman', title: 'Newman projections', href: null },
      { id: 'cyclohexanes', title: 'Cyclohexanes', href: null },
      { id: 'axial-equatorial', title: 'Axial/equatorial', href: null },
      { id: 'ring-flips', title: 'Ring flips', href: null },
      { id: 'conformational-analysis', title: 'Conformational analysis', href: null }
    ]},
    { id: 'stereochemistry', title: 'Stereochemistry', topics: [
      { id: 'chirality', title: 'Chirality', href: null },
      { id: 'stereocenters', title: 'Stereocenters', href: null },
      { id: 'enantiomers', title: 'Enantiomers', href: null },
      { id: 'diastereomers', title: 'Diastereomers', href: null },
      { id: 'meso', title: 'Meso compounds', href: null },
      { id: 'rs-configuration', title: 'R/S configuration', href: null },
      { id: 'fischer', title: 'Fischer projections', href: null }
    ]},
    { id: 'substitution-elimination', title: 'Substitution & Elimination', topics: [
      { id: 'sn2', title: 'SN2', href: 'mechanisms/sn2.html' },
      { id: 'sn1', title: 'SN1', href: 'mechanisms/sn1.html' },
      { id: 'e1', title: 'E1', href: null },
      { id: 'e2', title: 'E2', href: 'mechanisms/e2.html', dependsOn: ['conformational-analysis', 'leaving-groups', 'bronsted'] },
      { id: 'substrate-effects', title: 'Substrate & solvent effects', href: null }
    ]},
    { id: 'alkenes-alkynes', title: 'Alkenes & Alkynes', topics: [
      { id: 'alkene-structure', title: 'Alkene structure', href: null },
      { id: 'addition-reactions', title: 'Addition reactions', href: null },
      { id: 'markovnikov', title: 'Markovnikov / anti-Markovnikov', href: null },
      { id: 'alkynes', title: 'Alkynes', href: null }
    ]},
    { id: 'alcohols-ethers', title: 'Alcohols, Ethers & Related Chemistry', topics: [
      { id: 'alcohol-reactions', title: 'Alcohol reactions', href: null },
      { id: 'ether-chemistry', title: 'Ether chemistry', href: null },
      { id: 'epoxides', title: 'Epoxides', href: null }
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
