"""Word timings for the Short. Real ones come from ElevenLabs with-timestamps (character alignment);
until the voice exists, an estimate (about 15.5 characters a second, 0.42 s between beats) keeps every cue keyed to its word."""
import json, re

GAP = 0.42


def words_from_alignment(al, t_offset=0.0):
    """al: ElevenLabs alignment {characters, character_start_times_seconds, character_end_times_seconds}."""
    ch, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    out, cur, t0 = [], '', None
    for c, a, b in zip(ch, st, en):
        if c.isspace():
            if cur:
                out.append((cur, t0 + t_offset, last + t_offset)); cur = ''
            continue
        if not cur:
            t0 = a
        cur += c; last = b
    if cur:
        out.append((cur, t0 + t_offset, last + t_offset))
    return out
