"""Per shot checklist gate (studio system section 9, 2026-10-21; scene life item added 2026-10-29).

Every build writes out/<id>/shots.json:
  {"video": "<id>", "shots": [{"id": "s1", "t0": 0.0, "t1": 4.2, "what": "EMT kneels, presses gauze",
     "motion_source": "mocap 15_06 + IK" | "science sim" | "procedural" | "reference clip <file>",
     "checks": {"art": "yes", "motion_source": "yes", "rig": "yes", "life": "yes", "liquids": "na", "face": "yes",
                "timing": "yes", "accuracy": "yes", "consistency": "yes", "camera": "yes", "scene": "yes"},
     "notes": "..."}]}
Values: yes | no | na (na only where the item does not apply, e.g. no person in the shot).
python3 shots.py out/<id>/shots.json          -> prints the table, exit 1 on any "no", a missing item, a gap
python3 shots.py template <id> <seconds> ... -> writes a starter file with every item blank to fill in honestly
"""
import json, sys

ITEMS = {
    "art": "full lit style B scene matching the approved scenes (and the style bible once it exists), moving parts split from the painting, same finish as the best shot, real reference checked, grayscale composition passes",
    "motion_source": "motion comes from science simulation, a real human reference, or simple procedural motion (never hand keyed full body acting, never a pan over a still standing in for animation)",
    "rig": "joints bend smoothly, no detached parts, contacts stay planted",
    "life": "breathing and blinks on every visible person, springs on loose parts",
    "liquids": "liquids, gases and particles from the studio systems, never fading drops or flat dots",
    "face": "lip sync when speaking, expression matches the narration on its word",
    "timing": "eased, no pops, smears on fast moves, a sound on every action",
    "accuracy": "matches the checked step list and protocol, nothing shown wrong",
    "consistency": "no visible drop or jump in quality from neighbouring shots",
    "camera": "purposeful framing; continuous moves between scales and places when the camera moves (na for a static calm teaching shot)",
    "scene": "scene life: the setting itself moves subtly where it makes sense (lights flashing or flickering, wind in plants, clouds drifting, water rippling, machines running down, steam, dust in light beams), so it never reads as a still background (na only for the calm teaching background, chapter cards and pause timers)",
}
NA_OK = {"rig", "life", "liquids", "face", "camera", "scene"}


def check(path):
    d = json.load(open(path)); bad = []
    shots = d.get("shots", [])
    if not shots: bad.append("no shots listed")
    last = None
    for s in shots:
        ch = s.get("checks", {})
        row = []
        for k in ITEMS:
            v = str(ch.get(k, "")).lower()
            if v not in ("yes", "no", "na"): bad.append(f"{s.get('id')}: '{k}' not filled in"); v = "?"
            elif v == "no": bad.append(f"{s.get('id')}: {k} = no ({ITEMS[k]})")
            elif v == "na" and k not in NA_OK: bad.append(f"{s.get('id')}: '{k}' cannot be na")
            row.append(v[:3])
        if not s.get("motion_source"): bad.append(f"{s.get('id')}: motion_source missing")
        if last is not None and abs(float(s.get("t0", 0)) - last) > 0.05:
            bad.append(f"{s.get('id')}: starts at {s.get('t0')} but the previous shot ended at {last} (a gap or overlap)")
        last = float(s.get("t1", 0))
        print(f"{s.get('id','?'):>6} {float(s.get('t0',0)):6.2f}-{float(s.get('t1',0)):6.2f}  " + " ".join(f"{k[:4]}={v}" for k, v in zip(ITEMS, row)))
    if bad:
        print("\nSHOT CHECKLIST FAILED:"); [print(" -", b) for b in bad]; return 1
    print("\nshot checklist: every shot passes"); return 0


if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "template":
        vid, cuts = a[1], [float(x) for x in a[2:]]
        shots = [dict(id=f"s{i+1}", t0=cuts[i], t1=cuts[i + 1], what="", motion_source="", checks={k: "" for k in ITEMS}, notes="")
                 for i in range(len(cuts) - 1)]
        import os; os.makedirs(f"/home/claude/lp/out/{vid}", exist_ok=True)
        json.dump(dict(video=vid, shots=shots), open(f"/home/claude/lp/out/{vid}/shots.json", "w"), indent=1)
        print("wrote", f"/home/claude/lp/out/{vid}/shots.json")
    elif a:
        sys.exit(check(a[0]))
    else:
        print(__doc__)
