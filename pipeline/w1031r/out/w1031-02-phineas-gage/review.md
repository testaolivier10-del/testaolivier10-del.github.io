# Review notes w1031-02-phineas-gage (premium rebuild 2026-11-09)

Gate A: script rewritten for story first premises (accuracy.md); pronounce clean; fact check by the builder against Wikipedia
(Harlow, Macmillan citations). No independent subagent could be spawned in this session (no agent tool): the human read and
fresh eyes passes were done by the builder; the parent session should run the independent fresh eyes review (Gate D).
Story check: PASSED (41.1 s, long_reason). Voice: eleven_v4 Jeremy, stability 0.5, similarity 0.75, take 3 of 3.
Flatness check: FLAGGED on all 3 takes (sentences 6 to 8: per sentence median pitch within 1.1 to 1.4 st); every sentence moves
6.7 to 11.4 st inside itself; two re-voices used (the limit), take 3 kept.
Gate B: 1080x1920, 30 fps, H.264 10.0 Mbps, AAC 192 kbps, 41.1 s; -14.4 LUFS, peak -1.2 dBFS; no silence over 1.2 s; first word 0.00 s;
search phrase "Phineas Gage" at 0.00 s and on screen from frame 0; transcript 99.1 percent (only "eighteen forty eight" heard as
"one thousand eight hundred", a number spelling). Music take B (gage_b.mp3, A minor, accent on the blast, rise into "after"),
20.1 dB under the voice with a 4 dB duck; ambience 25.9 dB under; 4 effects 9.9 dB under (blast, iron landing, running steps,
paper drop); no whooshes. The take resolved at 38.5 s, so its last soft chord is time stretched to the end line.
Gate C: motion_qc 100 percent moving, 6 JUMP findings all planned (blast flash 5.63 s, zoom cuts 10.50, 12.83, 26.03, 30.57,
36.37); stills every 2 s checked; hand crops at 4 fps: both fists on the iron through every push (arm solve error under 2 px),
hands planted as he sits up, worker's hand on his shoulder from 15 s, contractor's hand on his shoulder in F1, the plan held in
his near fist until it drops; shots.py passes.
Builder self review (not independent): hook 8, blast and flight 7.5 (the iron is small in the wide sky shot), landing 8, survival 8,
x ray 8.5, before and after 8, ending 8, whole video 8.

## Fix round 1 (2026-11-09, after an independent reviewer scored 5)
Changes: a 1 s hook flash forward of the injury; tamping with his head down to the hole, both fists drawn on the iron, clear
strokes, the iron deep in the drill hole; the injury drawn over 8 frames (in under the left cheekbone, out the top, tapered
end first) instead of hidden by the flash; a wide pull back with his whole body, then a push in on the iron in the sky;
palms planted before he sits up, the worker's head in frame; a round front view lens (track left of the midline, left lobe
lit); chips moved inboard and the x ray fades out; the contractor's hand on top of his shoulder with a pat; the hand opens
before the plan drops; a "swore" gesture; camera push and drift in the before and after shots; slow push, breathing, a head
drop and a head turn on the friends; music 23 dB under the voice; thumbnail shows the iron through his head.
Gates: story check pass, shots.py pass, -14.4 LUFS, transcript 99.1 percent, motion_qc only planned jumps.
Gate D with two NEW independent reviewers (claude -p, given only the video stills, strips, crops, narration and checklist):
reviewer 1 overall 6 (sections 7, 6, 6, 6, 7, 7, 6, 6); reviewer 2 overall 6 (sections 6, 7, 6, 6, 6, 6, 5, 5).
Below the bar: per the coordinator, the new video and thumbnail are NOT published; the old file stays on the branch.
