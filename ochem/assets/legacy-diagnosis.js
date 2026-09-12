/* Diagnosis for the 1,860 legacy practice-bank questions.

   The interactive bank authors a `diag` entry per wrong answer: this exact
   wrong choice reveals this exact misconception. The legacy bank has none —
   it carries a `why` for the correct answer and nothing else — so until now
   a miss there produced a keyword-inferred concept and a hedge. That is
   about 96% of the pool, which made "the site works out WHY you were wrong"
   true of roughly one question in six.

   Hand-authoring 4,710 individual diagnoses would produce slop by question
   two hundred, and it would not even work: 94% of the distinct distractors
   appear exactly once, and a great many are bare tokens — "False", "−1",
   "sp³", "Tetrahedral" — which carry no meaning on their own. You cannot
   diagnose "False" by looking at the word "False".

   So diagnosis is split in two, matching where the information actually is:

   1. The QUESTION says which concept is being tested. "What happens to the
      stereochemistry at the reacting carbon" is a stereochemical-outcome
      question no matter which wrong option was picked. Question rules are
      what fix the concept the mastery engine records, and that matters more
      than the wording — it is the difference between the engine learning
      "weak at SN2" and "weak at stereochemical outcome, in SN2 and in
      additions and in E2".

   2. The OPTION, when it is self-describing, says what the student was
      thinking. "Stepwise, via a carbocation intermediate" is an SN1 answer
      to an SN2 question, and that is a nameable, teachable mistake. Option
      rules carry those.

   A rule matches when every regex it specifies matches. Rules that pin both
   the question and the option are preferred over either alone, so a general
   rule cannot pre-empt a specific one. Concepts are checked against the
   topic's own concept list, so a stray keyword cannot drag a question into
   an unrelated part of the graph.

   Where no option rule matches, the student still gets the right concept,
   the concept's teach text, and the question's own `why` — and the UI
   hedges rather than inventing a misconception, exactly as it does today. */
(function(){
  var RULES = {};      // topicId -> [rule]
  var SHARED = [];     // rules tried in every topic, filtered by concept availability

  /* rule fields:
       q  regex the question text must match
       o  regex the wrong option must match
       c  concept the mistake reveals
       m  the sentence shown to the student
     At least one of q/o is required. `m` is optional on question-only rules,
     which exist to fix the concept attribution rather than to say anything. */

  /* Specificity order. A rule that pins both the question and the option
     beats one that pins either alone, and anything that actually names a
     chemistry error beats generic guidance — otherwise "that answer is
     phrased as an absolute" would shadow "you used the SN1 rate law", which
     is strictly worse feedback for the same wrong answer. */
  function ruleScore(r){
    return (r.q ? 1 : 0) + (r.o ? 2 : 0) + (r.soft ? 0 : 8);
  }

  function matches(r, qText, oText){
    if(r.q && !r.q.test(qText)) return false;
    if(r.o && !r.o.test(oText)) return false;
    return true;
  }

  /* '@q' means "whatever concept the question rules decided". Some
     misconceptions are about the ANSWER's shape rather than any one idea —
     picking the option that says "always", or the one that says all four
     choices are equivalent. Those messages are correct in any topic, but
     tying them to a fixed concept would confine them to the handful of
     topics that happen to carry it. Inheriting the question's concept keeps
     the message general and the attribution accurate. */
  function allowedConcept(topicId, c){
    if(c === '@q') return true;
    var pool = window.OchemConcepts.byTopic(topicId);
    return pool && pool.indexOf(c) !== -1;
  }

  function candidates(topicId){
    return (RULES[topicId] || []).concat(SHARED);
  }

  /* Best rule for this (question, option) pair. Option-bearing rules win over
     question-only ones, so "you picked the carbocation answer" beats "this is
     a mechanism question". */
  function bestRule(topicId, qText, oText, needMessage){
    var list = candidates(topicId), best = null, bestS = -1;
    for(var i = 0; i < list.length; i++){
      var r = list[i];
      if(needMessage && !r.m) continue;
      if(r.recall) continue;
      if(!allowedConcept(topicId, r.c)) continue;
      if(!matches(r, qText, oText || '')) continue;
      var sc = ruleScore(r);
      if(sc > bestS){ best = r; bestS = sc; }
    }
    return best;
  }

  /* Some legacy questions are not about any concept in the graph, and saying
     so is more honest than forcing them into one. "What suffix does IUPAC use
     for a carboxylic acid", "nylon is an example of which polymer", "esters
     smell fruity" — these are recall. Recording "weak at acyl reactivity"
     because someone did not know nylon is a polyamide would actively corrupt
     the model, and then Review would schedule acyl reactivity drills for a
     vocabulary gap. Rules can mark a question `recall: true`; the engine
     records no concept evidence for those. */
  function isRecall(topicId, qText){
    var list = candidates(topicId), best = null, bestS = -1;
    for(var i = 0; i < list.length; i++){
      var r = list[i];
      if(!r.q || !r.q.test(qText)) continue;
      if(r.o) continue;                       // option rules do not classify the question
      if(!r.recall && !allowedConcept(topicId, r.c)) continue;
      var sc = ruleScore(r);
      if(sc > bestS){ best = r; bestS = sc; }
    }
    return !!(best && best.recall);
  }

  // The concept a legacy question is really about, or null to fall back.
  function conceptFor(topicId, qText){
    if(isRecall(topicId, qText)) return null;
    var r = bestRule(topicId, qText, '', false);
    return r ? r.c : null;
  }

  /* {concept, msg} for one wrong option, or null. msg may be absent when only
     a question rule matched — the caller then shows the concept and the
     question's own explanation without pretending to name a misconception. */
  function forOption(topicId, qText, oText){
    var withMsg = bestRule(topicId, qText, oText, true);
    if(withMsg){
      var c = withMsg.c;
      if(c === '@q'){
        c = conceptFor(topicId, qText);
        // An inherited-concept rule has nothing to attach to on a question
        // with no concept of its own (recall questions), so it stands down.
        if(!c) return null;
      }
      /* `soft` rules give useful guidance without naming the chemistry error
         — "this answer is phrased as an absolute", "read the claim one clause
         at a time". They are worth showing, but they are not a diagnosis, so
         they report precise:false and the UI hedges exactly as it does for an
         inferred concept. Calling those precise would be the one thing this
         whole system is supposed not to do: sound confident about a
         misconception it has not actually identified. */
      return { concept: c, msg: withMsg.m, precise: !withMsg.soft, soft: !!withMsg.soft };
    }
    var any = bestRule(topicId, qText, oText, false);
    if(any && any.c !== '@q') return { concept: any.c, msg: null, precise: false };
    return null;
  }

  function define(topicId, rules){ RULES[topicId] = (RULES[topicId] || []).concat(rules); }
  function shared(rules){ SHARED = SHARED.concat(rules); }

  window.OchemLegacyDiagnosis = {
    define: define, shared: shared,
    conceptFor: conceptFor, forOption: forOption, isRecall: isRecall,
    _rules: RULES, _shared: function(){ return SHARED; }
  };
})();
