/* The AP® Calculus AB dashboard (docs/dashboard.md): the five-question dashboard of assets/course/dash.js,
   built by assets/course/dash-ap.js from ApCalcCore (the answer records in apcalc_progress_v1), the site's shared XP
   and streak (HubProgress), the flashcard schedule (apcalc_flashcards_v1) and the free-response self-scores and exam
   history in apcalc_prefs_v1. Nothing is stored here.

   Free: what to do next, weekly accuracy with every exam on the same line, coverage of the exam by unit weight, units
   and mathematical practices by what they cost, level and mastery, and in the drawers the panels this page always had (weakest
   topics, mastery by unit and topic, by mathematical practice, exam history, free-response self-scores, the exam-date card and the
   cram kit). Premium (ApCalcCore.allowed('analytics')): mastery by skill and tool accuracy.

   Exam date: assets/exam-date.js counts down to the course's default exam day until the student sets their own
   (apcalc_exam_date); the cram kit (cram.html) counts back from the same date. Every bar carries its number as text. */
document.addEventListener('DOMContentLoaded', function(){
  var app = document.getElementById('app');
  var M = window.LevlDashMastery, A = window.ApCalcCore, CU = window.ApCalcCurriculum;
  if(!app || !M || !A || !CU) return;
  var FRQ_TYPES = { table: 'Rate in context from a table', model: 'Modeling with a given function', motion: 'Particle motion', area: 'Area and volume', de: 'Differential equation and slope field', graph: 'Graph of f\u2032 or graphical FTC', implicit: 'Implicit differentiation and related rates', fg: 'Table of f, g and their derivatives' };
  function draw(){
    M.ap({ key: 'apcalc', cls: 'calc', name: 'AP&reg; Calculus AB', A: A, CU: CU, base: window.ApCalcBase || '', root: app, tools: window.ApCalcToolList || [],
      band: true, practiceWord: 'mathematical practice', practiceLabel: 'Mathematical practices', frqTypes: FRQ_TYPES,
      skillHint: 'Each mathematical practice splits into skills (3.C: confirm a theorem’s hypotheses, and so on). Every question is tagged with the one it exercises.' });
  }
  draw();
  window.addEventListener('storage', function(e){ if(!e.key || /^apcalc_|^hub/.test(e.key)) draw(); });
  document.addEventListener('apcalc:progress', draw);
});
