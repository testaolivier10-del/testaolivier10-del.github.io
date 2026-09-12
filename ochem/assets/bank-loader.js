/* Loads the legacy practice bank without blocking the page.

   practice-bank.json is ~1MB — 1,860 multiple-choice questions across 62
   topics. It used to ship as practice-bank.js, a <script> tag that assigned
   window.OchemPracticeBank. That meant every visit to practice.html or
   review.html had to download and parse the whole megabyte before
   practice-page.js ran at all, even though the first thing either page shows
   is a setup screen that needs none of it.

   Now the data is JSON fetched in parallel with everything else, and only the
   two page bootstraps wait on it. JSON.parse is also markedly faster than
   parsing the equivalent JavaScript source, so the cost that remains is
   smaller than the one it replaces.

   Why the pages still wait rather than starting and filling in later: the
   home view both pages open with already reports counts ("N questions ready",
   the weakest-concept recommendation), and those numbers come from the pool.
   Rendering them against a half-loaded bank would show the user a wrong
   number and then silently change it. Waiting keeps one honest number.

   A failed fetch resolves rather than rejects. The interactive bank is a
   separate <script> and is already in memory by then, so practice still
   works — with fewer questions — instead of the page hanging on a dead
   network. window.OchemPracticeBank is left as an empty object, which is
   exactly what question-engine.js's build() already tolerates. */
(function(){
  window.OchemPracticeBank = {};

  var url = (window.OCHEM_BANK_URL || 'assets/practice-bank.json');

  window.OchemPracticeBankReady = fetch(url)
    .then(function(res){
      if(!res.ok) throw new Error('practice bank ' + res.status);
      return res.json();
    })
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
