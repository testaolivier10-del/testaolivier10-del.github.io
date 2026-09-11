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
  var Ed = function(){ return window.OchemMoleculeEditor; };
  var LG = function(){ return window.OchemLegacyDiagnosis; };

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
      case 'draw':
        /* The student produced the mechanism rather than picking it, so
           correctness is set equality over the arrows: order does not matter
           (a mechanism's arrows are simultaneous), direction does, and an
           extra arrow is a different mechanism, not a near miss. */
        return Ed() ? Ed().matches(Mo().get(q.molecule), response.arrows || [], q.answer.arrows || []) : false;
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
      case 'draw':
        /* Blame the first arrow that is not in the expected set. A drawn
           mechanism usually has one wrong arrow among right ones, and that
           single arrow is what the misconception is about — "you sent the
           carbonyl's electrons to carbon" is a specific, teachable error. */
        var exp = (q.answer && q.answer.arrows) || [];
        var mol = Mo().get(q.molecule);
        var bad = (response.arrows || []).filter(function(a){
          return !exp.some(function(e){ return Ed() && Ed().matches(mol, [a], [e]); });
        });
        if(bad.length) return bad[0].from + '>' + bad[0].to;
        // Nothing wrong drawn, so the miss is something missing.
        return (response.arrows || []).length < exp.length ? 'missing' : 'any';
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
      case 'draw':
        var drawn = response.arrows || [];
        if(!drawn.length) return 'You did not draw any arrows.';
        var need = ((q.answer && q.answer.arrows) || []).length;
        var lead = drawn.map(function(a){
          return Ed().labelOf(Mo().get(q.molecule), a.from) + ' \u2192 ' + Ed().labelOf(Mo().get(q.molecule), a.to);
        }).join(', ');
        return 'You drew ' + drawn.length + (drawn.length === 1 ? ' arrow' : ' arrows') +
               ' (' + lead + ')' + (need && drawn.length !== need ? '; this step needs ' + need + '.' : '.');
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

    var chosenText = (q.options && response.choice !== undefined) ? String(q.options[response.choice]) : '';

    if(authored){
      out.precise = true;
      out.conceptId = authored.concept;
      out.diagnosis = authored.msg;
    } else if(LG() && q.legacy){
      /* Legacy bank. The rules in legacy-rules.js do two separate jobs here.
         The concept attribution is the important one — it is what the mastery
         engine records, and rules fix it for 95% of the bank where keyword
         inference got it right only 61% of the time. The message is a bonus
         on top, and only some wrong answers carry enough information to earn
         one: "False" and "sp³" say nothing on their own. */
      var d = LG().forOption(q.topic, q.prompt || '', chosenText);
      var recall = LG().isRecall(q.topic, q.prompt || '');
      if(d){
        out.conceptId = d.concept;
        out.diagnosis = d.msg || '';
        out.precise = !!d.precise;
        out.soft = !!d.soft;
      }
      if(!out.conceptId){
        out.conceptId = C().inferConcept(q.prompt || '', q.topic) ||
                        C().inferConcept(chosenText, q.topic) || primary;
      }
      /* Recall questions — IUPAC suffixes, "nylon is which polymer", trivia —
         are not about any concept in the graph. Recording one would have the
         review scheduler drilling mechanisms to fix a vocabulary gap, so this
         flag tells applyResult to write no concept evidence at all. */
      out.recall = recall;
      if(!out.diagnosis){
        var rc = C().get(out.conceptId);
        out.diagnosis = rc
          ? 'This question turns on ' + rc.title.toLowerCase() + ' — that is the idea to check.'
          : '';
      }
    } else {
      // No authored diagnosis. Infer from what the question is testing, then
      // from what they picked, then fall back to the topic's main concept.
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

    /* A recall question is vocabulary, not a concept. Writing mastery for it
       would put "weak at acyl reactivity" on the record because someone did
       not know nylon is a polyamide — and Review would then schedule
       mechanism drills to fix a naming gap. The mistake is still logged so
       the question can come back; only the concept evidence is withheld. */
    if(q.recall || d.recall){
      if(d.correct) M.clearMistake(q.id);
      else M.recordMistake({
        qid: q.id, topicId: q.topic, conceptId: null, tier: tier,
        prompt: q.prompt || q.q || '', chose: d.whatYouDid
      });
      d.moved = [];
      d.recall = true;
      return d;
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
