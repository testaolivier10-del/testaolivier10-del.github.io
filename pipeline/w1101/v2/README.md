# w1101 v2: the premium standard reference builds (Olivier approved 2026-11-02)

The three Shorts rebuilt after Olivier's review: the B-17 armor plane (posted), the fainting guard and the cane toads.
They are the model for every Short and the style reference for long videos (spec-shorts and spec-long, "The premium standard"; video standard sections 0a, 5d and 6).

- plane/: build4.py (picture), art_b17.py (B-17 art), sound5.py (restrained mix), snd/judge.py (music take judge).
- guard/: build5.py (picture; x ray never covers the bearskin), sound4.py, person.py and airman2.py (the guard as one skinned body).
- toads/: build5.py (picture), snd/ music and sfx scripts.
- ../../people/: person.py, airman2.py, head_shapes.json (one skinned body per person, linear blend skinning).
- ../../sound/: judge_music.py, music_plan_example.py (ElevenLabs music_v1 composition plan timed to the edit).

Each build imports its older siblings (build3.py etc.) and the house layout.py from the codechar studio (/home/claude/short/layout.py after setup_codechar.sh).
Levels: music about 20 dB under the voice with a 4 dB duck, ambience about 26 dB under, 3 to 5 effects about 10 dB under, no whooshes, -14 LUFS, 10 Mbps H.264.
