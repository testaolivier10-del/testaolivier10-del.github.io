"""Motion check on the RENDERED video (Shorts and long videos), for what still frames cannot show.

Every other review looks at stills. This one reads every frame of final.mp4 and finds:
  FROZEN while talking: the picture does not change while the narrator speaks (video standard section 1 rule 2:
      no narration over a frozen image). Freezes during silence (pause timers, chapter cards) are fine.
  JUMPS: a single frame that changes far more than its neighbours (an element popping in, a layer flashing,
      a skipped animation, a hard cut nobody planned). Planned cuts show up too; the reviewer decides.
  STUTTER: duplicate frames in the middle of motion (a dropped or repeated frame makes movement judder).
For each finding, and around every big change, it saves a frame strip (every 2nd frame across about 0.8 s)
so the fresh eyes reviewer sees the motion itself, not one still on either side of it.

usage: python3 motion_qc.py <video.mp4> [--long] [--audio VOICE] [--out DIR]
  --audio  file whose sound marks when the narrator talks: final_nomusic.mp4 for Shorts, the voice only mix for long
           videos (default: final_nomusic.mp4 next to the video if it exists, else the video itself; music then
           counts as talking, so give the voice file whenever there is one)
  --long  long video limits (a freeze while talking is flagged after 6 s, not 1.5 s; calm teaching is allowed)
output: DIR/report.json, DIR/strip_<n>_<time>.png, and a short summary on stdout. Exit 1 if any FROZEN or JUMP.
Needs ffmpeg, ffprobe, numpy, Pillow (all in setup.sh / setup_long.sh)."""
import sys, os, json, subprocess, re
import numpy as np
from PIL import Image

W, H = 64, 112          # tiny grey frames are enough to measure change (portrait; swapped for landscape)

def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate:format=duration", "-of", "json", path],
                         capture_output=True, text=True, check=True).stdout
    j = json.loads(out); s = j["streams"][0]; n, d = s["r_frame_rate"].split("/")
    return int(s["width"]), int(s["height"]), float(n) / float(d), float(j["format"]["duration"])

def frames(path, w, h):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={w}:{h}:flags=area,format=gray",
                          "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)

def speech(path, dur):
    """Spans where there is sound above about -38 dB (the narration; music beds are quieter in our mixes)."""
    err = subprocess.run(["ffmpeg", "-i", path, "-af", "silencedetect=n=-38dB:d=0.35", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    sil, cur = [], None
    for line in err.splitlines():
        if m := re.search(r"silence_start: ([\d.]+)", line): cur = float(m.group(1))
        if (m := re.search(r"silence_end: ([\d.]+)", line)) and cur is not None: sil.append((cur, float(m.group(1)))); cur = None
    if cur is not None: sil.append((cur, dur))
    talk, t = [], 0.0
    for a, b in sil:
        if a > t: talk.append((t, a))
        t = b
    if t < dur: talk.append((t, dur))
    return talk

def overlap(a, b, spans): return sum(max(0, min(b, y) - max(a, x)) for x, y in spans)

def strip(path, t, fps, out, w, every=2):
    """12 frames side by side, small: every 2nd frame from t-0.3 s (transitions), or every frame from t-0.17 s (findings)."""
    n = 12; start = max(0, t - (0.3 if every == 2 else 5 / fps))
    sel = f"select='not(mod(n\\,{every}))'," if every > 1 else ""
    sub = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-i", path, "-vf",
                          f"{sel}scale={w}:-2,tile={n}x1:padding=4:color=white",
                          "-frames:v", "1", "-vsync", "vfr", "-y", out], capture_output=True)
    return out if sub.returncode == 0 and os.path.exists(out) else None

def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    path = a[0]; long = "--long" in a
    out = a[a.index("--out") + 1] if "--out" in a else os.path.join(os.path.dirname(os.path.abspath(path)), "motion_qc")
    os.makedirs(out, exist_ok=True)
    vw, vh, fps, dur = probe(path)
    w, h = (W, H) if vh >= vw else (H, W)
    F = frames(path, w, h)
    d = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2))          # change from frame i to i+1, in grey levels
    t_of = lambda i: (i + 1) / fps
    voice = a[a.index("--audio") + 1] if "--audio" in a else None
    if not voice:
        nm = os.path.join(os.path.dirname(os.path.abspath(path)), "final_nomusic.mp4")
        voice = nm if os.path.exists(nm) and os.path.abspath(nm) != os.path.abspath(path) else path
    talk = speech(voice, dur)
    still = d < 0.15                                           # practically no change
    freeze_min = 6.0 if long else 1.5
    findings = []

    # FROZEN while talking
    i = 0
    while i < len(d):
        if still[i]:
            j = i
            while j + 1 < len(d) and still[j + 1]: j += 1
            a_, b_ = t_of(i) - 1 / fps, t_of(j)
            if b_ - a_ >= freeze_min and overlap(a_, b_, talk) >= freeze_min * 0.8:
                end_card = b_ >= dur - 1.0     # the closing card that runs to the end is meant to hold still
                findings.append(dict(kind="END_CARD" if end_card else "FROZEN", t=round(a_, 2), end=round(b_, 2),
                                     note=(f"closing card holds {b_ - a_:.1f} s (fine if the narration is over; check the voice file was given)"
                                           if end_card else f"picture unchanged {b_ - a_:.1f} s while the narrator talks")))
            i = j + 1
        else:
            i += 1

    # JUMPS: one frame changes far more than the frames around it
    med = np.array([np.median(d[max(0, k - 8):k + 9]) for k in range(len(d))])
    big = d > np.maximum(12.0, 6 * med + 3)                     # a real visual event, much bigger than its neighbourhood
    small = lambda k, ref: k < 0 or k >= len(d) or d[k] < ref / 3
    k = 0
    while k < len(d):
        if big[k]:
            # a pop or cut is one spike; a flash (one odd frame) is two spikes in a row: on, then off
            span = 2 if (k + 1 < len(d) and big[k + 1]) else 1
            ref = min(d[k:k + span])
            if small(k - 1, ref) and small(k + span, ref):
                findings.append(dict(kind="JUMP", t=round(t_of(k), 2), score=round(float(d[k]), 1),
                                     note=("a single odd frame (a flash or a frame from somewhere else)" if span == 2
                                           else "one frame changes much more than its neighbours (a pop or an unplanned cut)")))
            k += span
        else:
            k += 1

    # STUTTER: a duplicate frame between two moving frames, repeatedly within one second
    dup = [k for k in range(1, len(d) - 1) if d[k] < 0.05 and d[k - 1] > 1.5 and d[k + 1] > 1.5]
    k = 0
    while k < len(dup):
        grp = [x for x in dup if dup[k] <= x < dup[k] + fps]
        if len(grp) >= 3:
            findings.append(dict(kind="STUTTER", t=round(t_of(grp[0]), 2), count=len(grp),
                                 note="repeated frames inside motion (judder)"))
            k += len(grp)
        else:
            k += 1

    # transitions worth a strip even when fine: the biggest changes (one per second at most)
    order = np.argsort(-d); picked = []
    for k in order[: max(10, int(dur // 6))]:
        if d[k] < 3: break
        if all(abs(t_of(k) - p) > 1.0 for p in picked): picked.append(t_of(k))
    picked = sorted(picked)[: (24 if long else 10)]

    strips = []
    tw = 160 if vh >= vw else 240
    for n, f in enumerate(findings):
        s = strip(path, f["t"], fps, os.path.join(out, f"strip_{n:02d}_{f['kind'].lower()}_{f['t']:.1f}.png"), tw,
                  every=1 if f["kind"] in ("JUMP", "STUTTER") else 2)
        f["strip"] = s
    for n, t in enumerate(picked):
        s = strip(path, t, fps, os.path.join(out, f"strip_t{n:02d}_{t:.1f}.png"), tw)
        if s: strips.append(dict(t=round(t, 2), strip=s))

    rep = dict(video=path, voice_file=voice, duration=round(dur, 2), fps=round(fps, 3), long=long, talking_seconds=round(sum(b - a for a, b in talk), 1),
               moving_share=round(float((d >= 0.15).mean()), 3), findings=findings, transition_strips=strips)
    json.dump(rep, open(os.path.join(out, "report.json"), "w"), indent=1)
    bad = [f for f in findings if f["kind"] in ("FROZEN", "JUMP")]
    print(f"motion_qc {os.path.basename(path)}: {dur:.1f} s, moving {rep['moving_share']*100:.0f}% of frames, "
          f"{len(findings)} findings ({sum(f['kind']=='FROZEN' for f in findings)} frozen, {sum(f['kind']=='JUMP' for f in findings)} jumps, "
          f"{sum(f['kind']=='STUTTER' for f in findings)} stutter), {len(strips)} transition strips -> {out}")
    for f in findings: print(f"  {f['kind']:8s} {f['t']:7.2f}s  {f['note']}")
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
