"""Word timings for the Short. Real ones come from ElevenLabs with-timestamps (character alignment);
until the voice exists, an estimate (about 15.5 characters a second, 0.42 s between beats) keeps every cue keyed to its word."""
import json, re
import sys; sys.path.insert(0, "/home/claude/runner"); from script import BEATS

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


def estimate():
    t = 0.05
    out = []
    for i, (beat, text) in enumerate(BEATS):
        if i:
            t += GAP
        for w in text.split():
            d = max(0.16, len(w) / 15.5 + (0.12 if re.search(r'[.,?!]$', w) else 0.0))
            out.append((w, t, t + d - 0.03)); t += d
    return out


class Timeline:
    def __init__(self, words):
        """words: [(display word, start, end)] in script order; assigned to beats by counting words."""
        self.words = words
        self.beat_of = []
        i = 0
        self.beats = {}
        for beat, text in BEATS:
            n = len(text.split())
            self.beats[beat] = list(range(i, i + n))
            i += n
        assert i == len(words), (i, len(words))
        self.end = words[-1][2]

    def k(self, beat, word, n=1, end=False):
        """Start (or end) time of the n-th word in beat matching word (case and punctuation ignored)."""
        hits = [j for j in self.beats[beat] if re.sub(r'[^a-z]', '', self.words[j][0].lower()) == word.lower()]
        j = hits[n - 1]
        return self.words[j][2 if end else 1]

    def beat_span(self, beat):
        ix = self.beats[beat]
        return self.words[ix[0]][1], self.words[ix[-1]][2]

    def chunks(self, size=3):
        """Caption chunks that never cross a beat: [(word indices)]."""
        out = []
        for beat, ix in self.beats.items():
            cur = []
            for j in ix:
                cur.append(j)
                if len(cur) >= size or re.search(r'[.,?!]$', self.words[j][0]):
                    out.append(cur); cur = []
            if cur:
                out.append(cur)
        return out


def load(path=None):
    if path:
        return Timeline(json.load(open(path)))
    return Timeline(estimate())
