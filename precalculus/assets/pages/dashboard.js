/* The AP® Precalculus dashboard (docs/dashboard.md): the five-question dashboard of assets/course/dash.js,
   built by assets/course/dash-ap.js from ApPrecalcCore (the answer records in apprecalc_progress_v1), the site's shared XP
   and streak (HubProgress), the flashcard schedule (apprecalc_flashcards_v1) and the free-response self-scores and exam
   history in apprecalc_prefs_v1. Nothing is stored here.

   Free: what to do next, weekly accuracy with every exam on the same line, coverage of the exam by unit weight, units
   and mathematical practices by what they cost, level and mastery, and in the drawers the panels this page always had (weakest
   topics, mastery by unit and topic, by mathematical practice, exam history, free-response self-scores, the exam-date card and the
   cram kit). Premium (ApPrecalcCore.allowed('analytics')): mastery by skill and tool accuracy.

   Exam date: assets/exam-date.js counts down to the course's default exam day until the student sets their own
   (apprecalc_exam_date); the cram kit (cram.html) counts back from the same date. Every bar carries its number as text. */
document.addEventListener('DOMContentLoaded', function(){
  var app = document.getElementById('app');
  var M = window.LevlDashMastery, A = window.ApPrecalcCore, CU = window.ApPrecalcCurriculum;
  if(!app || !M || !A || !CU) return;
  var FRQ_TYPES = { concepts: 'Q1: Function Concepts', modeling: 'Q2: Modeling a Non-Periodic Context', periodic: 'Q3: Modeling a Periodic Context', symbolic: 'Q4: Symbolic Manipulations' };
  function draw(){
    M.ap({ key: 'apprecalc', cls: 'pcalc', name: 'AP&reg; Precalculus', A: A, CU: CU, base: window.ApPrecalcBase || '', root: app, tools: window.ApPrecalcToolList || [],
      band: false, practiceWord: 'mathematical practice', practiceLabel: 'Mathematical practices', frqTypes: FRQ_TYPES,
      skillHint: 'Each mathematical practice splits into skills (3.C: support a conclusion with values or a rationale, and so on). Every question is tagged with the one it exercises.' });
  }
  draw();
  window.addEventListener('storage', function(e){ if(!e.key || /^apprecalc_|^hub/.test(e.key)) draw(); });
  document.addEventListener('apprecalc:progress', draw);
});
