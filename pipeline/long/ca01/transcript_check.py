"""Transcript check: does the finished audio say exactly what the approved script says?

Transcribes the rendered video's audio with ElevenLabs speech to text (Scribe; billed in its own hours, not the
voice characters) and lines it up word by word with the script's spoken text. It catches what reading the script
cannot: a skipped or repeated line, a chapter voiced from an old draft, a cut in the wrong place, a word the voice
garbled, a key term said wrong.

usage: python3 transcript_check.py <script_or_spec_module> <video_or_audio> [--key FILE] [--out report.json]
  module: a long video script (CHAPTERS) or a Short spec (SPEC with beats), importable from the current folder
  --key: the ElevenLabs key file (default /root/.lpkey/k); read inside this script, never printed
Exit 0 = clean, 1 = a real gap (a missing, extra or reworded run of 3+ words), 2 = could not check (say so in the review).

What it reports:
  MISSING  script words the audio does not contain (3+ in a row is a failure: re-voice that chapter or beat)
  EXTRA    audio words not in the script (3+ in a row is a failure: usually a repeated line)
  CHANGED  3+ words said differently from the script (a line voiced from an old draft): a failure
  TERM     a key term (pronounce.json entries and long technical words) heard as something else. Not a failure on its
           own, since transcribers stumble on jargon too, but each one goes into the review message with its time so
           Olivier can listen, and a term flagged in two videos gets a respelling in pronounce.json.
It also prints the word match rate and, as a guard, how many voice characters the account used during the check
(should be 0; if it is not, say so to Olivier and stop using this check until he decides)."""
import sys, os, re, json, subprocess, importlib, difflib, tempfile
try:
    import requests
except Exception:
    print("transcript_check: the requests library is missing (pip install requests). Could not transcribe."); sys.exit(2)

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = [os.getcwd(), HERE, os.path.join(HERE, "long")]
API = "https://api.elevenlabs.io/v1"

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
def say_int(n):
    if n < 20: return ONES[n]
    if n < 100: return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    if n < 1000: return ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " " + say_int(n % 100))
    if n < 1000000: return say_int(n // 1000) + " thousand" + ("" if n % 1000 == 0 else " " + say_int(n % 1000))
    return str(n)

NUMWORDS = set(ONES + TENS[2:] + ["oh", "hundred", "thousand", "point", "and", "a"])

def words(text):
    """Lowercase spoken words: numbers spelled out, symbols said, punctuation and emotion tags dropped."""
    t = re.sub(r"\[[^\]]+\]", " ", text)
    t = re.sub(r"\{\d+\}", " ", t)
    t = re.sub(r"(\d),(\d{3})", r"\1\2", t)
    t = re.sub(r"(?<=[A-Za-z])(?=\d)|(?<=\d)(?=[A-Za-z])", " ", t)       # SN2 -> SN 2
    t = t.replace("%", " percent").replace("°", " degrees").replace("&", " and ").replace("+", " plus ")
    t = re.sub(r"(\d+)\.(\d+)", lambda m: say_int(int(m.group(1))) + " point " + " ".join(ONES[int(c)] for c in m.group(2)), t)
    t = re.sub(r"\d+", lambda m: say_int(int(m.group(0).replace(",", ""))), t)
    t = t.lower().replace("’", "'")
    t = re.sub(r"[^a-z' ]+", " ", t)
    ws = [w.strip("'") for w in t.split() if w.strip("'")]
    out = []                                   # "n r e m t" and "nremt" are the same word: join runs of single letters
    for w in ws:
        if len(w) == 1 and w not in ("a", "i") and out and out[-1].startswith("\x00"):
            out[-1] += w
        elif len(w) == 1 and w not in ("a", "i"):
            out.append("\x00" + w)
        else:
            out.append(w)
    return [w.lstrip("\x00") for w in out]

def join_letters(heard):
    """The transcriber returns one word at a time, so spelled letters ("D", "O", "T") arrive as separate words: join them."""
    out = []
    for w, t in heard:
        if out and len(w) == 1 and w not in ("a", "i") and out[-1][2]:
            out[-1] = (out[-1][0] + w, out[-1][1], True)
        else:
            out.append((w, t, len(w) == 1 and w not in ("a", "i")))
    return [(w, t) for w, t, _ in out]

def shown_to_spoken(text):
    """The transcriber writes abbreviations the way they look (NREMT, SN2, SpO2): turn them into how the script says them."""
    try:
        T = json.load(open(os.path.join(HERE, "pronounce.json"), encoding="utf-8"))["terms"]
    except Exception:
        return text
    for t in sorted(T, key=lambda t: -len(t["shown"])):
        text = re.sub(r"(?<![A-Za-z0-9])" + re.escape(t["shown"]) + r"(?![A-Za-z0-9])", t["spoken"], text)
    return text

def script_text(name):
    mod = importlib.import_module(name)
    if hasattr(mod, "CHAPTERS"):
        beats = [b for ch in mod.CHAPTERS for b in ch["beats"]]
    else:
        beats = mod.SPEC["beats"]
    mark = re.compile(r"«([^|»]*)\|[^»]*»")
    return " ".join(mark.sub(r"\1", b["vo"]) for b in beats)

def key_terms():
    terms = set()
    try:
        for e in json.load(open(os.path.join(HERE, "pronounce.json")))["terms"]:
            terms.update(words(e["spoken"]))
    except Exception:
        pass
    return terms

def transcribe(media, keyfile):
    tmp = tempfile.mkdtemp(prefix="lp_stt_"); mp3 = os.path.join(tmp, "a.mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", media, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", mp3], check=True)
    key = open(keyfile, encoding="utf-8-sig").read().strip()
    h = {"xi-api-key": key}
    def used():
        try: return requests.get(f"{API}/user/subscription", headers=h, timeout=30).json().get("character_count")
        except Exception: return None
    before = used(); last = None
    for model in ("scribe_v2", "scribe_v1"):
        with open(mp3, "rb") as f:
            r = requests.post(f"{API}/speech-to-text", headers=h, timeout=600,
                              data={"model_id": model, "language_code": "en", "timestamps_granularity": "word", "tag_audio_events": "false"},
                              files={"file": ("a.mp3", f, "audio/mpeg")})
        if r.status_code == 200:
            after = used()
            delta = (after - before) if (before is not None and after is not None) else None
            return r.json(), model, delta
        last = f"{model}: HTTP {r.status_code} {r.text[:200]}"
    raise RuntimeError(last)

def compare(script_words, heard, terms):
    """heard: list of (word, start_seconds). Returns findings and match rate."""
    hw = [w for w, _ in heard]
    sm = difflib.SequenceMatcher(a=script_words, b=hw, autojunk=False)
    findings, same = [], 0
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal": same += i2 - i1; continue
        t = heard[j1][1] if j1 < len(heard) else (heard[-1][1] if heard else 0)
        a, b = script_words[i1:i2], hw[j1:j2]
        if op in ("delete", "replace") and len(a) >= 3 and (op == "delete" or len(a) - len(b) >= 3):
            findings.append(dict(kind="MISSING", t=round(t, 1), script=" ".join(a), heard=" ".join(b)))
        elif op in ("insert", "replace") and len(b) >= 3 and (op == "insert" or len(b) - len(a) >= 3):
            findings.append(dict(kind="EXTRA", t=round(t, 1), script=" ".join(a), heard=" ".join(b)))
        elif op == "replace" and min(len(a), len(b)) >= 3 and \
                difflib.SequenceMatcher(a=" ".join(a), b=" ".join(b)).ratio() < 0.6:
            findings.append(dict(kind="CHANGED", t=round(t, 1), script=" ".join(a), heard=" ".join(b)))
        elif op == "replace":
            if all(w in NUMWORDS for w in a + b): continue          # "one oh nine" vs "one hundred nine": same number
            hit = [w for w in a if (w in terms or len(w) >= 5) and w not in NUMWORDS]
            if hit:
                findings.append(dict(kind="TERM", t=round(t, 1), script=" ".join(a), heard=" ".join(b)))
    rate = same / max(1, len(script_words))
    return findings, rate

def mmss(t): t = int(t); return f"{t // 60}:{t % 60:02d}"

def main():
    a = sys.argv[1:]
    if len(a) < 2: sys.exit(__doc__)
    name, media = a[0], a[1]
    keyfile = a[a.index("--key") + 1] if "--key" in a else "/root/.lpkey/k"
    out = a[a.index("--out") + 1] if "--out" in a else None
    try:
        sw = words(script_text(name))
    except Exception as e:
        print(f"transcript_check: could not read the script module {name} ({type(e).__name__}: {e}). Could not check."); sys.exit(2)
    try:
        res, model, delta = transcribe(media, keyfile)
    except Exception as e:
        print(f"transcript_check: could not transcribe ({e}). Say so in the review message."); sys.exit(2)
    heard = []
    for w in res.get("words", []):
        if w.get("type", "word") != "word": continue
        for x in words(shown_to_spoken(w.get("text", ""))): heard.append((x, float(w.get("start", 0))))
    heard = join_letters(heard)
    findings, rate = compare(sw, heard, key_terms())
    fails = [f for f in findings if f["kind"] in ("MISSING", "EXTRA", "CHANGED")]
    rep = dict(module=name, media=media, model=model, script_words=len(sw), heard_words=len(heard),
               match_rate=round(rate, 4), voice_characters_used_by_check=delta, findings=findings)
    if out: json.dump(rep, open(out, "w"), indent=1)
    print(f"transcript_check {name}: {model}, {len(sw)} script words, {len(heard)} heard, match {rate*100:.1f}%, "
          f"{len(fails)} failures, {sum(f['kind']=='TERM' for f in findings)} terms to listen to; "
          f"voice characters used during the check: {delta} (another run voicing at the same time also counts here)")
    for f in findings:
        print(f"  {f['kind']:7s} {mmss(f['t'])}  script: {f['script'][:80]!r}  heard: {f['heard'][:80]!r}")
    sys.exit(1 if fails else 0)

if __name__ == "__main__":
    main()
