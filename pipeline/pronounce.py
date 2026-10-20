"""Shared pronunciation check for every LevlPrep script (Shorts and long videos), run before voicing.

pronounce.json holds how each tricky term is SHOWN on screen and how the narration must SAY it (spelled letters for
abbreviations, orbital labels as words, the brand name). Before this list, each script respelled terms on its own,
so a term fixed in one video could be wrong in the next.

usage (from the folder that holds the module, or with it on the path):
  python3 pronounce.py check <module>     exit 1 if the SPOKEN text still contains a shown form; prints each hit and
                                          the fix: in a long script write «spoken|shown», in a Short put the spoken
                                          form in vo and keep the shown form in disp
  python3 pronounce.py harvest <module>   lists «spoken|shown» pairs in a script that are not in the list yet
                                          (add the ones that will come up again to pronounce.json)
The check reads the text that will actually be voiced: a long script's vo after its «spoken|shown» marks are
resolved, a Short's beat vo. Emotion tags and {n} cues are ignored."""
import sys, os, re, json, importlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = [os.getcwd(), HERE, os.path.join(HERE, "long")]
ONES = "zero one two three four five six seven eight nine".split()
SUP = dict(zip("⁰¹²³⁴⁵⁶⁷⁸⁹", ONES))
ORB = re.compile(r"(?<![A-Za-z0-9])([1-7])([spdf])([xyz])?([⁰¹²³⁴⁵⁶⁷⁸⁹]{1,2})?(?![A-Za-z0-9])")

def terms():
    return json.load(open(os.path.join(HERE, "pronounce.json"), encoding="utf-8"))["terms"]

def pattern(shown):
    plural = r"(s)?" if shown.isupper() else r"()"          # EMTs, AEDs: the plural is caught too
    return re.compile(r"(?<![A-Za-z0-9])" + re.escape(shown) + plural + r"(?![A-Za-z0-9])")

def orbital_spoken(m):
    n, l, ax, sup = m.groups()
    out = [ONES[int(n)], l] + ([ax] if ax else []) + ([" ".join(SUP[c] for c in sup)] if sup else [])
    return " ".join(out)

def beats(mod):
    if hasattr(mod, "CHAPTERS"): return [b for ch in mod.CHAPTERS for b in ch["beats"]]
    return mod.SPEC["beats"]

def spoken(vo, mod=None):
    """The text that will be voiced: the module's own clean() when it has one (that is what voice_all.py sends)."""
    if mod is not None and hasattr(mod, "clean"): vo = mod.clean(vo)
    else: vo = re.sub(r"«([^|»]*)\|[^»]*»", r"\1", vo)
    return re.sub(r"\{\d+\}|\[[^\]]+\]", " ", vo)

def check(name):
    mod = importlib.import_module(name); long = hasattr(mod, "CHAPTERS"); hits = []
    T = terms()
    for b in beats(mod):
        text = spoken(b["vo"], mod)
        if "«" in text or "»" in text:      # a mark that would be read aloud: this script's clean() does not resolve them
            hits.append((b["key"], "«…»", "resolve the marks (copy the o02 script's _MARK block) or write the spoken form directly"))
        for t in T:
            for m in pattern(t["shown"]).finditer(text):
                hits.append((b["key"], m.group(0), t["spoken"] + (m.group(1) or "")))
        for m in ORB.finditer(text):
            hits.append((b["key"], m.group(0), orbital_spoken(m)))
    for key, shown, say in hits:
        if shown == "«…»": print(f"  {key}: a «spoken|shown» mark would be read aloud. Fix: {say}"); continue
        fix = f"«{say}|{shown}»" if long else f"vo: {say!r}, disp keeps {shown!r}"
        print(f"  {key}: {shown!r} is in the spoken text. Fix: {fix}")
    print(f"pronounce check {name}: {len(hits)} term(s) to respell" + ("" if hits else ", clean"))
    return 1 if hits else 0

def harvest(name):
    mod = importlib.import_module(name)
    src = open(mod.__file__, encoding="utf-8").read()
    known = {t["shown"] for t in terms()}
    pairs = sorted(set(re.findall(r"«([^|»]+)\|([^»]+)»", src)))
    new = [(s, h) for s, h in pairs if h not in known and not ORB.fullmatch(h) and h != "shown"]
    for s, h in new: print(json.dumps({"shown": h, "spoken": s}, ensure_ascii=False))
    print(f"{len(new)} respelling(s) not in pronounce.json")

if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) != 2 or a[0] not in ("check", "harvest"): sys.exit(__doc__)
    sys.exit(check(a[1]) if a[0] == "check" else harvest(a[1]) or 0)
