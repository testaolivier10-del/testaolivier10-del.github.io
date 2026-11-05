Browser checks for class assignments on course pages (assets/class/class-run.js, docs/teacher-classes.md v2 A2).
Serve the repo (`python3 -m http.server 8765`), then, with Playwright for Python and Chrome at /usr/bin/google-chrome:

    python3 run.py http://127.0.0.1:8765 <shots dir> [course dirs]   all ten courses: clock, held answers, tabs, teacher questions, mastery, exams, pages without la=
    python3 held-resume-start.py http://127.0.0.1:8765 [course dirs]  held answers kept out of progress, exam clock resume, failed start, used free exam
    python3 submit-card.py http://127.0.0.1:8765                     class_submit grading, card announcements and live link
