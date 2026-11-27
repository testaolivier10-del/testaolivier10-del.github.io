# Shared brief for everyone building scenes of yt-nremt-02-provider-levels (LevlPrep long video, 1920x1080, 30 fps)

Work dir: /home/claude/lv (a link to /home/claude/lv_n02). The voice is DONE (out/vo, 12:57). Do NOT voice anything, do not
touch n02_script.py, tl.py, render.py, base.py, kit.py, fin.py or out/vo. Several agents work here at once: write ONLY the
files named in your task, never edit another agent's file, keep your scratch files under /tmp/<your file stem>/.

What to read first (in this order, only these):
- PLAN.md: what each beat shows, cue by cue. n02_script.py: the narration ({n} are the cues; b['disp'] is the shown text).
- base.py (cue, cues, ww/wt word times, ua, tx, hw handwriting, panel, lightbar, board, check, cross) and kit.py (palette,
  text, hand, pill, chip, arrow, label, calm_bg). fin.py has finish(), camera(), glow(), lgrad(), rr(), poly().
- old_o03/ holds the previous video's files in the same format as worked examples (boards_a.py, boards_b.py, boards_p.py,
  story.py, shop.py, cast.py). Copy their patterns, not their content.

How a scene file works: it defines draw functions f(c, t) (c = skia canvas, t = global seconds) and a dict
SCENES = {beat_key: f}. scenes.py merges boards_a, boards_b, boards_p and story. A beat's scene is drawn from its start
through the gap after it. Get times with `t0, c1, c2, c3 = cues(k, 3)` and word times with ww(k, 'word').
Check stills: `python3 beatsheet.py <key> ...` writes /tmp/bs/<key>_<i>.png (full size) and /tmp/bs/<key>_sheet.png.
LOOK at your stills with the Read tool, full size, every beat, and fix what you see before you finish.

Rules that decide whether this video ships (Olivier's standing rules):
- Teaching boards: call base.board(c, t) first (the one navy grid background). The board NEVER zooms or pans. Motion comes
  from what is written, drawn, struck, lit or moved ON THE WORD it is spoken (use the cue and word times).
- Everything on screen is spoken in that beat. Few words on screen. No label the narration does not say.
- Text: Inter via kit.text; handwriting (Kalam) via base.hw for things "written". Helper labels at least 40 px, main lines
  56 px or more; nothing clipped, nothing overlapping, at least 90 px margin from every frame edge. Keep the bottom 60 px clear.
- Icons and diagrams are drawn in code in the house flat style: flat colour shapes, no outlines, at most two tones per
  shape plus a soft rim or highlight, real proportions, a soft shadow. NO placeholder shapes (plain circles, stick
  figures, clip art look, emoji). An icon must read at phone size. Same finish on every board.
- Quality is even across the whole video: your boards must look like one system with the others (title top centre in
  cream 54 px xb via base.title; course accent NREMT mint (63, 194, 169); amber for the thing being explained now).
- Accuracy: draw things the way they really are (an AED is a small case with pads and a shock button; an IV goes into a
  forearm vein; an IO needle goes into the upper shin bone just below the knee; an ambulance is a US box ambulance).
- No em dashes or hyphens as punctuation in any on screen text. Write "off line" and "on line" as two words.
- Never leave a frame empty: from the first second of a beat something of that beat is already on screen (the title or
  the previous state), and each cue adds or changes something.
- Performance: a frame should draw in well under 0.15 s. Cache static pictures (skia.Picture or a module level image).

When you finish, reply with: the files you wrote, the beats covered, anything in PLAN.md you changed and why, and any
flaw you could not fix. Be honest: a named flaw is far better than a hidden one.
