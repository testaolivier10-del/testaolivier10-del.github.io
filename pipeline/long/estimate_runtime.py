"""Estimate a long video's FINISHED runtime from its script, before voicing (no credits spent).
usage: python3 estimate_runtime.py <script_module> [<script_module> ...]      (run from pipeline/long or with it on sys.path)
       python3 estimate_runtime.py --log <script_module> <actual seconds>     after the render: record predicted vs actual

Model (mirrors engine_long.plan): 0.4 s lead in, per chapter after the first 0.6 s plus a 2.0 s chapter card,
per beat its gap (default 0.45 s) and its pause timer, plus the voice itself = spoken characters / CPS.
Spoken characters = the text voice_all.py sends with emotion tags removed (tags are not spoken).
CPS (Liam on eleven_v3, measured from the voiced videos) is recalibrated from runtime_log.json whenever it has entries.
Target 10 to 15 minutes finished (Olivier). Over 15:00 -> tighten repetition first, else split the topic (ops-long-build step 3)."""
import sys, os, re, json, importlib
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = [HERE, os.getcwd()]
LOG = os.path.join(HERE, "runtime_log.json")
CPS_DEFAULT = 13.6          # measured 2026-10-19 from a01, b01, o02 (see runtime_log.json)
TARGET, MAX = 13 * 60, 15 * 60

def notag(s): return re.sub(r"\s+", " ", re.sub(r"\[[^\]]+\]\s*", "", s)).strip()
def clean(vo): return re.sub(r"\s+", " ", re.sub(r"\{\d+\}", "", vo)).strip()
def spoken(vo):
    vo = re.sub(r"«([^|»]*)\|[^»]*»", r"\1", vo)    # respellings: spoken form
    return notag(clean(vo))

def parts(mod):
    chars = beats = 0; pause = gap = cards = 0.0; chapters = mod.CHAPTERS
    for ci, ch in enumerate(chapters):
        if ci > 0: cards += 0.6 + (2.0 if ch.get("card", True) else 0)
        for b in ch["beats"]:
            beats += 1; chars += len(spoken(b["vo"])); gap += b.get("gap", 0.45); pause += b.get("pause", 0)
    return dict(chars=chars, beats=beats, fixed=round(0.4 + cards + gap + pause, 1), pause=pause, chapters=len(chapters))

def load_log():
    try: return json.load(open(LOG))
    except Exception: return []

def cps():
    rows = [r for r in load_log() if r.get("actual_s") and r["actual_s"] > r["fixed_s"]]
    if not rows: return CPS_DEFAULT
    return round(sum(r["chars"] for r in rows) / sum(r["actual_s"] - r["fixed_s"] for r in rows), 2)

def mmss(s): return f"{int(s // 60)}:{int(round(s % 60)):02d}"

def estimate(name):
    mod = importlib.import_module(name); p = parts(mod); c = cps()
    total = p["fixed"] + p["chars"] / c
    # characters that fit the 13 minute target and the 15 minute ceiling with this script's fixed time
    fit13 = int((TARGET - p["fixed"]) * c); fit15 = int((MAX - p["fixed"]) * c)
    verdict = "OK" if total <= MAX else "OVER 15:00: tighten, else split the topic before voicing"
    print(f"{getattr(mod, 'ID', name)}: {p['chars']} spoken chars, {p['beats']} beats, {p['chapters']} chapters, "
          f"{p['pause']:.0f} s of pause timers, {p['fixed']} s fixed -> about {mmss(total)} finished "
          f"(at {c} chars/s). Room: {fit13} chars for 13:00, {fit15} for 15:00. {verdict}")
    return p, total

if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "--log":
        name, actual = a[1], float(a[2]); p, total = estimate(name)
        rows = [r for r in load_log() if r["id"] != getattr(importlib.import_module(name), "ID", name)]
        rows.append(dict(id=getattr(importlib.import_module(name), "ID", name), chars=p["chars"], fixed_s=p["fixed"],
                         predicted_s=round(total), actual_s=round(actual)))
        json.dump(rows, open(LOG, "w"), indent=1)
        print(f"logged: predicted {mmss(total)}, actual {mmss(actual)} ({round((actual - total) / total * 100, 1)}%); new rate {cps()} chars/s")
    else:
        for n in a: estimate(n)
