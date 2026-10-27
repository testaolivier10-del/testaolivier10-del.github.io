/* The AP® Statistics dashboard (docs/dashboard.md): the five-question dashboard of assets/course/dash.js,
   built by assets/course/dash-ap.js from ApStatCore (the answer records in apstat_progress_v1), the site's shared XP
   and streak (HubProgress), the flashcard schedule (apstat_flashcards_v1) and the free-response self-scores and exam
   history in apstat_prefs_v1. Nothing is stored here.

   Free: what to do next, weekly accuracy with every exam on the same line, coverage of the exam by unit weight, units
   and mathematical practices by what they cost, level and mastery, and in the drawers the panels this page always had (weakest
   topics, mastery by unit and topic, by mathematical practice, exam history, free-response self-scores, the exam-date card and the
   cram kit). Premium (ApStatCore.allowed('analytics')): mastery by skill and tool accuracy.

   Exam date: assets/exam-date.js counts down to the course's default exam day until the student sets their own
   (apstat_exam_date); the cram kit (cram.html) counts back from the same date. Every bar carries its number as text. */
document.addEventListener('DOMContentLoaded', function(){
  var app = document.getElementById('app');
  var M = window.LevlDashMastery, A = window.ApStatCore, CU = window.ApStatCurriculum;
  if(!app || !M || !A || !CU) return;
  var FRQ_TYPES = { collect: 'Q1: Formulate questions and collect data', analyze: 'Q2: Analyze and interpret data', inference: 'Q3: Inference (a test or an interval)', multi: 'Q4: Across several units' };
  function draw(){
    M.ap({ key: 'apstat', cls: 'stat', name: 'AP&reg; Statistics', A: A, CU: CU, base: window.ApStatBase || '', root: app, tools: window.ApStatToolList || [],
      band: false, practiceWord: 'mathematical practice', practiceLabel: 'Mathematical practices', frqTypes: FRQ_TYPES,
      skillHint: 'Each mathematical practice splits into skills (3.C: confirm a theorem’s hypotheses, and so on). Every question is tagged with the one it exercises.' });
  }
  draw();
  window.addEventListener('storage', function(e){ if(!e.key || /^apstat_|^hub/.test(e.key)) draw(); });
  document.addEventListener('apstat:progress', draw);
});
