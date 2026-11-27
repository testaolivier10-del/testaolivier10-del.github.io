"""Ship gate 1: every spoken sentence has a subject and a finished verb (spaCy en_core_web_sm)."""
import re, sys, spacy
sys.path.insert(0, '/home/claude/lv')
import n02_script as S
nlp = spacy.load('en_core_web_sm'); n = 0; tot = 0
for ch in S.CHAPTERS:
    for b in ch['beats']:
        txt = re.sub(r"\[[^\]]+\]\s*", "", S.clean(b['vo'])).replace('...', ',')
        for s in nlp(txt).sents:
            tot += 1
            root = s.root
            subj = any(t.dep_ in ('nsubj', 'nsubjpass', 'expl', 'csubj') for t in s)
            ok = root.pos_ in ('VERB', 'AUX') and subj
            if not ok:
                n += 1; print(b['key'], '|', s.text.strip(), '|', root.text, root.pos_, subj)
print('sentences', tot, 'flags', n)
