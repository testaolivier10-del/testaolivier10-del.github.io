/* Loads the legacy practice bank without blocking the page any longer than it
   has to.

   It used to ship as practice-bank.js, a <script> tag assigning
   window.OchemPracticeBank, so every visit to practice.html or review.html
   downloaded and parsed a megabyte before practice-page.js ran at all — even
   though the first thing either page shows is a setup screen needing none of
   it. Moving it to JSON fetched in parallel fixed the blocking-script part.

   Why the pages still WAIT on it rather than starting and filling in later:
   the home view both pages open with already reports counts ("N questions
   ready", the weakest-concept recommendation), and those numbers come from the
   pool. Rendering them against a half-loaded bank would show a wrong number and
   then silently change it. Waiting keeps one honest number.

   THE SPLIT
   ---------
   Waiting on the whole file stopped being affordable as the course grew: the
   bank went from 1,860 questions to 2,340 across three new chapters and its
   page-weight budget had to be raised twice. So the bank now ships as two files
   (scripts/build-ochem-bank.mjs):

     practice-bank-core.json   stems, options, answers   168 KB gz  — waited on
     practice-bank-why.json    the explanations          121 KB gz  — not

   Nothing reads an explanation until somebody has already answered something,
   which is many seconds after the page became usable. So the core is what
   OchemPracticeBankReady resolves on, and the explanations are fetched straight
   afterwards without blocking anything.

   HOW A QUESTION FINDS ITS EXPLANATION
   ------------------------------------
   question-engine.js normalizes each legacy question ONCE, into a pooled
   object, and that can happen before the explanations land. Rather than
   rebuilding the pool when they do — which would leave any question already on
   screen permanently without one — the pooled object's `why` is a getter that
   reads through to window.OchemPracticeWhy at the moment it is displayed. A
   question answered in the gap simply picks its explanation up when the file
   arrives, and one answered before that shows the empty string rather than
   "undefined".

   FAILURE
   -------
   Either fetch failing resolves rather than rejects. The interactive bank is a
   separate <script> and already in memory, so practice still works — with fewer
   questions, or without explanations — instead of the page hanging on a dead
   network. window.OchemPracticeBank left as {} is exactly what
   question-engine.js's build() already tolerates. */
(function(){
  window.OchemPracticeBank = {};
  window.OchemPracticeWhy = {};

  var base = window.OCHEM_BANK_BASE || 'assets/';
  var coreUrl = window.OCHEM_BANK_URL || (base + 'practice-bank-core.json');
  var whyUrl = window.OCHEM_BANK_WHY_URL || (base + 'practice-bank-why.json');

  function get(url, label){
    return fetch(url).then(function(res){
      if(!res.ok) throw new Error(label + ' ' + res.status);
      return res.json();
    });
  }

  /* The explanations are deliberately NOT part of the returned promise. Anything
     awaiting OchemPracticeBankReady is waiting to render a count or a question,
     and neither needs them. */
  get(whyUrl, 'practice bank explanations')
    .then(function(why){ window.OchemPracticeWhy = why; })
    .catch(function(err){
      if(window.console && console.warn){
        console.warn('Practice bank explanations unavailable; questions will still be asked.', err);
      }
    });

  window.OchemPracticeBankReady = get(coreUrl, 'practice bank')
    .then(function(bank){
      window.OchemPracticeBank = bank;
      // If anything built the pool while the fetch was in flight it holds only
      // the interactive questions, and build() would never revisit it.
      if(window.OchemQuestionEngine) window.OchemQuestionEngine.invalidate();
      return bank;
    })
    .catch(function(err){
      // Not fatal — see above. Logged so a genuinely broken deploy is
      // visible in the console rather than looking like a thin question pool.
      if(window.console && console.warn){
        console.warn('Practice bank unavailable; continuing with the interactive bank only.', err);
      }
      return window.OchemPracticeBank;
    });
})();
