"""Frame folders (1080x1920, 30 fps) for full screen AI shots. usage: python3 clips_full.py caffeine|pulse"""
import os, sys, json, glob, shutil, subprocess
sys.path.insert(0, "/home/claude/lp")
import engine2, lpx
FB = "/tmp/m/characters/style_b/clips"

def frames(src, dst, speed=1.0):
    shutil.rmtree(dst, ignore_errors=True); os.makedirs(dst)
    vf = (f"setpts=PTS/{speed}," if speed != 1 else "") + "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,scale=1080:1920:flags=lanczos,unsharp=5:5:0.6"
    if src.endswith(".png"):
        vf = "scale=1080:1920:flags=lanczos,fps=30"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", src, "-t", "1", "-vf", vf, f"{dst}/%04d.png"], check=True)
    else:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-vf", vf, f"{dst}/%04d.png"], check=True)
    fs = sorted(glob.glob(f"{dst}/*.png"))
    for i, f in enumerate(fs): os.rename(f, f"{dst}/{i:04d}.tmp")
    for f in sorted(glob.glob(f"{dst}/*.tmp")): os.rename(f, f[:-4] + ".png")
    return len(fs)

def pick(*c):
    for p in c:
        if os.path.exists(p): return p

class X: pass
which = sys.argv[1]
if which == "caffeine":
    import t1018_caffeine_full as V
    os.makedirs(V.OUT, exist_ok=True)
    nA = frames(pick(f"{FB}/cafA.mp4", "/tmp/m/characters/style_b/dorm_fb.png"), f"{V.OUT}/clipA", 1.45)
    nB = frames(pick(f"{FB}/cafB.mp4", f"{FB}/cafA.mp4", "/tmp/m/characters/style_b/dorm_fb.png"), f"{V.OUT}/clipB", 2.6)
    T, D, C = engine2.plan(V.SPEC, V.OUT); c = X(); c.spec = V.SPEC; c.T = T
    tb2 = lpx.wt(c, "trap", "hits") - 0.15 + 0.45
    json.dump({"A": {"dir": "clipA", "start": 0.0, "n": nA}, "B": {"dir": "clipB", "start": tb2, "n": nB}}, open(f"{V.OUT}/clips.json", "w"))
    print("A", nA, "B", nB)
else:
    import t1018_pulse_full as V
    os.makedirs(V.OUT, exist_ok=True)
    nA = frames(pick(f"{FB}/kitA.mp4", "/tmp/m/characters/style_b/kit_fb.png"), f"{V.OUT}/rawA")
    nB = frames(pick(f"{FB}/kitB.mp4", f"{FB}/kitA.mp4", "/tmp/m/characters/style_b/kit_fb.png"), f"{V.OUT}/clipB")
    T, D, C = engine2.plan(V.SPEC, V.OUT); c = X(); c.spec = V.SPEC; c.T = T
    t_back = lpx.wt(c, "ask", "his") - 0.25
    total = int(round((t_back + 0.02) * 30)) + 1
    tail = list(range(max(0, nA - 60), nA)); loop = tail[::-1] + tail
    need = max(0, total - nA); seq = list(range(nA))
    for off in range(len(loop)):
        body = (loop * (need // len(loop) + 2))[off:off + need]
        cand = list(range(nA)) + body
        if cand[-1] == nA - 1: seq = cand; break
    shutil.rmtree(f"{V.OUT}/clipA", ignore_errors=True); os.makedirs(f"{V.OUT}/clipA")
    for i, fi in enumerate(seq): shutil.copy(f"{V.OUT}/rawA/{fi:04d}.png", f"{V.OUT}/clipA/{i:04d}.png")
    json.dump({"A": {"dir": "clipA", "start": 0.0, "n": len(seq)}, "B": {"dir": "clipB", "start": t_back, "n": nB}}, open(f"{V.OUT}/clips.json", "w"))
    print("A", nA, "->", len(seq), "B", nB)
