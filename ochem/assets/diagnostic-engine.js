/* Ochem diagnostic engine — grades an answer, then works out WHY it was wrong.

   The point of this file is the difference between these two responses:

     "Incorrect. The answer was B."
     "You picked the tertiary substrate. That's not a leaving-group problem —
      bromide leaves fine either way. What you missed is steric hindrance:
      three methyl groups block the backside approach. [teach] [highlight]
      Here's a similar one."

   Getting the second requires knowing which *specific* misunderstanding the
   chosen wrong answer reveals, which is why interactive-bank.js authors a
   `diag` entry per wrong option. When a question has no authored diagnosis
   (the ~1900 legacy multiple-choice questions don't), the engine falls back
   to keyword inference over the question text and returns a diagnosis marked
   `precise: false` so the UI can say "this one was about X" rather than
   claiming to know what the student was thinking. Never fabricate a specific
   misconception you can't support — a confidently wrong diagnosis is worse
   than an honest general one.

   Grading and diagnosis are one file because they're one decision: the grade
   determines whether we diagnose at all, and the response object that
   determines the grade is also the evidence the diagnosis reads. */
(function(){
  var C = function(){ return window.OchemConcepts; };
  var Mo = function(){ return window.OchemMolecules; };

  function arrEq(a, b){
    if(a.length !== b.length) return false;
    for(var i=0;i<a.length;i++){ if(a[i] !== b[i]) return false; }
    return true;
  }
  function sameSet(a, b){
    if(a.length !== b.length) return false;
    var sa = a.slice().sort(), sb = b.slice().sort();
    return arrEq(sa, sb);
  }

  // Atom keys that count as correct for a click/multi-click question.
  function acceptedKeys(q){
    if(!q.answer) return [];
    if(q.answer.keys) return q.answer.keys.slice();
    if(q.answer.role && q.molecule){
      var mol = Mo().get(q.molecule);
      return mol ? Mo().keysWithRole(mol, q.answer.role) : [];
    }
    return [];
  }

  /* Is this response correct? One function for every kind, so callers never
     branch on kind themselves. */
  function grade(q, response){
    if(!response) return false;
    switch(q.kind){
      case 'click-atom':
        return acceptedKeys(q).indexOf(response.key) !== -1;
      case 'multi-click':
        return sameSet(response.keys || [], acceptedKeys(q));
      case 'arrow':
        return response.from === q.answer.from && response.to === q.answer.to;
      case 'order':
        return arrEq(response.order || [], q.answer);
      default: // mcq, tf, predict, mechanism
        return response.choice === q.answer;
    }
  }

  // The key the question's `diag` map is indexed by, for this response.
  function diagKey(q, response){
    switch(q.kind){
      case 'click-atom': return response.key;
      case 'multi-click':
        // Blame the first *extra* atom picked; if they only under-picked,
        // there's no single wrong atom to point at.
        var ok = acceptedKeys(q);
        var extra = (response.keys || []).filter(function(k){ return ok.indexOf(k) === -1; });
        return extra.length ? extra[0] : null;
      case 'arrow': return response.from + '>' + response.to;
      case 'order': return 'any';
      default: return String(response.choice);
    }
  }

  /* The headline sentence naming what the student actually did. Written from
     the response, so it reads like someone watched them answer. */
  function whatYouDid(q, response){
    switch(q.kind){
      case 'click-atom':
        return q.molecule ? 'You clicked ' + Mo().labelFor(q.molecule, response.key) + '.' : '';
      case 'multi-click':
        var ok = acceptedKeys(q);
        var picked = response.keys || [];
        var extra = picked.filter(function(k){ return ok.indexOf(k) === -1; });
        var missed = ok.filter(function(k){ return picked.indexOf(k) === -1; });
        if(extra.length && missed.length) return 'You included a position that does not react, and missed one that does.';
        if(extra.length) return 'You included a position that does not react.';
        if(missed.length) return 'You found ' + picked.length + ' of ' + ok.length + ' — one position is missing.';
        return '';
      case 'arrow':
        return 'You drew the arrow from ' + Mo().labelFor(q.molecule, response.from) +
               ' to ' + Mo().labelFor(q.molecule, response.to) + '.';
      case 'order':
        return 'Your ordering was not quite right.';
      default:
        return q.options ? 'You chose "' + q.options[response.choice] + '".' : '';
    }
  }

  /* ---- the main call -------------------------------------------------

     diagnose(question, response) -> {
       correct
       conceptId    the concept this answer is evidence about. On a miss this
                    is the misdiagnosed concept, which is often NOT the
                    question's primary concept — that's the whole point.
       concept      the concept record
       precise      true when an authored diagnosis matched; false when we
                    inferred it and should hedge the wording
       whatYouDid   one sentence describing the actual response
       diagnosis    why that specific answer is wrong
       teach        the concept's micro-lesson (only on a miss)
       why          the question's own explanation, shown either way
       highlight    atom keys worth ringing in the molecule
       lessonTopic  curriculum topic to link to for a fuller re-read
       prereqs      weak prerequisite concepts, when the real gap is upstream
     } */
  function diagnose(q, response){
    var correct = grade(q, response);
    var out = {
      correct: correct,
      question: q,
      why: q.why || '',
      highlight: (q.highlight || []).slice(),
      precise: false,
      whatYouDid: '',
      diagnosis: '',
      teach: '',
      prereqs: []
    };

    var primary = (q.concepts && q.concepts[0]) || C().defaultConceptFor(q.topic);

    if(correct){
      out.conceptId = primary;
      out.concept = C().get(primary);
      // On a correct answer, also ring the atoms that mattered so the right
      // answer is reinforced visually, not just asserted.
      if(q.kind === 'click-atom' && response.key) out.highlight = [response.key];
      return out;
    }

    // ---- a miss: work out which concept this reveals ----
    var key = diagKey(q, response);
    var authored = key !== null && q.diag ? (q.diag[key] || q.diag.any) : null;

    if(authored){
      out.precise = true;
      out.conceptId = authored.concept;
      out.diagnosis = authored.msg;
    } else {
      // No authored diagnosis. Infer from what the question is testing, then
      // from what they picked, then fall back to the topic's main concept.
      var chosenText = (q.options && response.choice !== undefined) ? q.options[response.choice] : '';
      out.conceptId =
        C().inferConcept(q.prompt || q.q || '', q.topic) ||
        C().inferConcept(chosenText, q.topic) ||
        primary;
      var c = C().get(out.conceptId);
      out.diagnosis = c
        ? 'This question turns on ' + c.title.toLowerCase() + ' — that is the idea to check.'
        : '';
    }

    out.concept = C().get(out.conceptId);
    out.whatYouDid = whatYouDid(q, response);
    if(out.concept) out.teach = out.concept.teach;

    // Ring the correct atoms so the student can SEE what they overlooked,
    // rather than reading a sentence about it.
    if(!out.highlight.length && (q.kind === 'click-atom' || q.kind === 'multi-click')){
      out.highlight = acceptedKeys(q);
    }

    // If the real gap is upstream, say so — more questions on the symptom
    // won't help someone whose prerequisite is missing.
    out.prereqs = window.OchemMastery.weakPrerequisites(out.conceptId).slice(0, 2);
    out.lessonTopic = C().lessonTopicFor(out.conceptId);

    return out;
  }

  /* Record the outcome against the mastery engine and return the diagnosis
     augmented with what moved. The primary concept always gets evidence; a
     diagnosed concept that differs from it gets evidence too, because a wrong
     click on "which atom is electrophilic" is real information about
     electrophile recognition even though the question was filed under SN2.
     Secondary concepts listed on the question get partial weight so a
     three-concept question doesn't triple-count one answer. */
  function applyResult(q, response){
    var d = diagnose(q, response);
    var M = window.OchemMastery;
    var primary = (q.concepts && q.concepts[0]) || C().defaultConceptFor(q.topic);
    var secondary = (q.concepts || []).slice(1);
    var tier = q.tier || 2;
    var moved = [];

    function push(conceptId, share){
      if(!conceptId) return;
      var before = M.profile(conceptId).strength;
      var after = M.record(conceptId, d.correct, { tier: tier, share: share });
      if(after) moved.push({ id: conceptId, before: before, after: after.strength, band: after.band });
    }

    push(primary, 1);
    secondary.forEach(function(id){ if(id !== primary) push(id, 0.45); });
    // The diagnosed concept, when the diagnosis pointed somewhere else.
    if(!d.correct && d.conceptId && d.conceptId !== primary && secondary.indexOf(d.conceptId) === -1){
      push(d.conceptId, d.precise ? 0.9 : 0.5);
    }

    if(d.correct){
      M.clearMistake(q.id);
    } else {
      M.recordMistake({
        qid: q.id, topicId: q.topic, conceptId: d.conceptId, tier: tier,
        prompt: q.prompt || q.q || '',
        chose: d.whatYouDid
      });
    }

    d.moved = moved;
    return d;
  }

  window.OchemDiagnostics = {
    grade: grade,
    diagnose: diagnose,
    applyResult: applyResult,
    acceptedKeys: acceptedKeys
  };
})();
