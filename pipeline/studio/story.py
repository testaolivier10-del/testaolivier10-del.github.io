"""Story check: runs BEFORE any art is made. A Short (or a long video's first minute) is planned beat by beat and
checked against what LevlPrep's own analytics say wins (claude/levlprep-insights.md, 2026-10-20):
  * the mistake and its result are visible in the first 2 seconds (cost of inaction: the tourniquet Short, 10K views)
  * nothing explains before something moves (the sarcomere Short lost 72% by 10 s)
  * the person stays on screen while the diagram builds (the 5 to 10 s cliff is at the story to diagram switch)
  * something visibly changes at least every 2 seconds from 4 to 10 s
  * the answer is a visible place or action, not a definition
  * Shorts run 25 to 30 s (the three best were 26 to 33 s)
  * every science step names its source (accuracy covers the visuals)

usage: python3 story.py template <id> [short|long]  > out/<id>/story.json   (a filled example to edit)
       python3 story.py out/<id>/story.json         (prints PASS / FAIL lines; exit code 1 on any FAIL)

story.json:
{ "id": "...", "format": "short" | "long", "duration": 27.5,
  "answer": {"kind": "place" | "action" | "definition", "what": "two inches above the wound, never on a joint"},
  "long_reason": "",                   # only for a Short over 30 s (allowed up to 40 s): why the idea needs it
  "beats": [ {"t0": 0.0, "t1": 1.2, "kind": "mistake" | "surprise" | "question" | "result" | "explain" | "answer" | "payoff" | "cta" | "other",
              "person": true, "anchor": false, "diagram": false,     # anchor = the story's object (a flask, a ball) when there is no person
              "changes": [0.0, 0.6],          # times (s) of visible changes inside this beat (moves, cuts, pops)
              "what": "tourniquet goes on over the knee", "source": "" } ] }
For a long video the same checks run on the first 60 s with "promise" and "first_visual" beats due by 30 s.
"""
import json, sys

SHORT_MIN, SHORT_MAX = 25.0, 30.0


def template(vid, fmt="short"):
    if fmt == "long":
        return {"id": vid, "format": "long", "duration": 720.0,
                "answer": {"kind": "action", "what": "what the viewer will be able to do by the end"},
                "beats": [
                    {"t0": 0, "t1": 4, "kind": "mistake", "person": True, "diagram": False, "changes": [0, 1.5, 3], "what": "a real person gets it wrong on screen", "source": ""},
                    {"t0": 4, "t1": 9, "kind": "result", "person": True, "diagram": False, "changes": [4, 6, 8], "what": "what that costs, shown", "source": ""},
                    {"t0": 9, "t1": 20, "kind": "promise", "person": True, "diagram": True, "changes": [9, 11, 13, 15, 17, 19], "what": "the promise: by the end you can ...", "source": "site topic page"},
                    {"t0": 20, "t1": 60, "kind": "first_visual", "person": True, "diagram": True, "changes": [20, 22, 24, 26, 28, 30, 35, 40, 45, 50, 55], "what": "first concrete mechanism moving", "source": "textbook / protocol page"}]}
    return {"id": vid, "format": "short", "duration": 27.0,
            "answer": {"kind": "place", "what": "where or how, shown on the body or object"},
            "beats": [
                {"t0": 0.0, "t1": 1.0, "kind": "mistake", "person": True, "diagram": False, "changes": [0.0, 0.5], "what": "the wrong move, on screen", "source": ""},
                {"t0": 1.0, "t1": 2.0, "kind": "result", "person": True, "diagram": False, "changes": [1.0, 1.6], "what": "what it causes, visible", "source": ""},
                {"t0": 2.0, "t1": 4.0, "kind": "payoff", "person": True, "diagram": False, "changes": [2.0, 3.0], "what": "the line that says why it matters", "source": ""},
                {"t0": 4.0, "t1": 10.0, "kind": "explain", "person": True, "diagram": True, "changes": [4.0, 5.5, 7.0, 8.5, 10.0], "what": "mechanism builds next to the person", "source": "protocol or textbook"},
                {"t0": 10.0, "t1": 22.0, "kind": "explain", "person": False, "diagram": True, "changes": [10, 12, 14, 16, 18, 20], "what": "mechanism", "source": "protocol or textbook"},
                {"t0": 22.0, "t1": 27.0, "kind": "answer", "person": True, "diagram": False, "changes": [22, 24, 26], "what": "the right place or action, shown", "source": "protocol"}]}


def check(st):
    out = []
    ok = lambda c, msg: out.append(("PASS" if c else "FAIL", msg))
    fmt, beats = st.get("format", "short"), sorted(st.get("beats", []), key=lambda b: b["t0"])
    dur = float(st.get("duration", 0))
    if not beats:
        return [("FAIL", "no beats")]
    if fmt == "short":
        if SHORT_MIN <= dur <= SHORT_MAX:
            ok(True, f"length {dur:.1f}s is within {SHORT_MIN:.0f} to {SHORT_MAX:.0f}s")
        elif SHORT_MAX < dur <= 40.0:
            ok(bool((st.get("long_reason") or "").strip()), f"length {dur:.1f}s is over 30s, allowed up to 40s only with a long_reason saying why the idea needs it")
        else:
            ok(False, f"length {dur:.1f}s is within 25 to 40s")
        hook_end, window, first = 2.0, (4.0, 10.0), [b for b in beats if b["t0"] < 2.0]
        HOOK = ("mistake", "surprise", "question")   # a visible mistake (best), a surprising change, or a visual question
        ok(any(b["kind"] in HOOK for b in first), "a mistake, a surprising change or a visual question is on screen before 2s")
        ok(any(b["kind"] == "result" and b["t0"] < 3.0 for b in beats) or not any(b["kind"] == "mistake" for b in first),
           "a mistake's result is visible by about 2s (by 3s at the latest)")
    else:
        hook_end, window, first = 4.0, (4.0, 30.0), [b for b in beats if b["t0"] < 4.0]
        ok(any(b["kind"] == "mistake" for b in first) or any(b["kind"] == "first_visual" and b["t0"] < 4 for b in beats),
           "something concrete happens on screen in the first 4s")
        ok(any(b["kind"] == "promise" and b["t0"] <= 30 for b in beats), "the promise of the video lands by 30s")
        ok(any(b["kind"] == "first_visual" and b["t0"] <= 30 for b in beats), "the first concrete visual of the topic starts by 30s")
    ok(not any(b["kind"] == "explain" and b["t0"] < hook_end for b in beats), f"nothing explains before {hook_end:.0f}s")
    # person stays on screen when the diagram first appears
    d0 = next((b for b in beats if b.get("diagram")), None)
    if d0:
        ok(bool(d0.get("person") or d0.get("anchor")), f"the person (or the story's object, \"anchor\": true) is still on screen when the diagram first appears ({d0['t0']:.1f}s)")
    # visible change cadence in the window
    ts = sorted({float(t) for b in beats for t in (b.get("changes") or [])} | {float(b["t0"]) for b in beats})
    a, z = window
    pts = [a] + [t for t in ts if a < t < z] + [z]
    gaps = [(pts[i], pts[i + 1]) for i in range(len(pts) - 1) if pts[i + 1] - pts[i] > 2.0 + 1e-6]
    ok(not gaps, f"something visibly changes at least every 2s from {a:.0f} to {z:.0f}s" +
       (f" (gaps: {', '.join(f'{x:.1f} to {y:.1f}s' for x, y in gaps)})" if gaps else ""))
    # every beat says what changes; science beats name a source
    ok(all((b.get("what") or "").strip() for b in beats), "every beat says what is on screen")
    sci = [b for b in beats if b.get("diagram") or b["kind"] in ("explain", "answer", "first_visual")]
    ok(all((b.get("source") or "").strip() for b in sci), "every science or answer beat names its source")
    # answer
    ans = st.get("answer", {})
    ok(ans.get("kind") in ("place", "action"), "the answer is a visible place or action, not a definition")
    ok(any(b["kind"] == "answer" for b in beats) or fmt == "long", "the answer is shown on screen")
    # coverage: beats tile the video without holes
    holes = [(beats[i]["t1"], beats[i + 1]["t0"]) for i in range(len(beats) - 1) if beats[i + 1]["t0"] - beats[i]["t1"] > 0.05]
    ok(not holes and beats[0]["t0"] <= 0.05, "the beats cover the video from 0s with no holes")
    return out


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "template":
        print(json.dumps(template(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "short"), indent=1)); sys.exit(0)
    res = check(json.load(open(sys.argv[1])))
    for s, m in res:
        print(f"{s}  {m}")
    bad = sum(s == "FAIL" for s, _ in res)
    print('\nSTORY CHECK PASSED' if not bad else f'\nSTORY CHECK FAILED ({bad}): fix the plan before making any art.')
    sys.exit(1 if bad else 0)
