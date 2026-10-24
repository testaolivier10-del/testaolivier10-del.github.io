"""Render one performer over a painted background, with the joint gap check on every frame."""
import sys, json, math, subprocess
import numpy as np, skia
from PIL import Image
import partrig, acting

def bg_image(path, size, crop=None):
    im = Image.open(path).convert("RGB")
    if crop: im = im.crop(crop)
    im = im.resize(size, Image.LANCZOS)
    return skia.Image.fromarray(np.ascontiguousarray(np.array(im.convert("RGBA"))), colorType=skia.ColorType.kRGBA_8888_ColorType)

def run(mod, out, size=(1080, 1080), scale=0.9, origin=(300, 120), dur=9.0, bg=None, stills=None,
        label=None, follow=True):
    rig, spec, joints, radius = mod.build()
    P = acting.Performer(rig, spec)
    W_, H_ = size
    n = int(dur * acting.FPS)
    proc = None
    if out:
        proc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra",
                                 "-s", f"{W_}x{H_}", "-r", str(acting.FPS), "-i", "-", "-c:v", "libx264",
                                 "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", out],
                                stdin=subprocess.PIPE)
    report = []
    cam = 0.0
    for i in range(n):
        t = i / acting.FPS
        W = P.pose(t, acting.script)
        if hasattr(rig, 'blink'):   # blinks: 5 frames closed, never during a big move
            rig.blink = 1.0 if any(b <= t < b + 5 / 60 for b in (0.85, 3.25, 5.05, 7.55)) else 0.0
        # camera follows the hips once walking, eased
        target = P.x * scale if follow else 0.0
        cam += (target - cam) * 0.06
        xf = np.array([[scale, 0, origin[0] - cam], [0, scale, origin[1]], [0, 0, 1]])
        surf = skia.Surface(W_, H_)
        cv = surf.getCanvas()
        if bg is not None:
            cv.drawImage(bg, -((cam * 0.6) % 1) , 0)
        else:
            cv.clear(skia.Color(200, 200, 200))
        # contact shadow under the hips
        hx = (xf @ np.array([*rig.joint(W, spec["spine"]), 1]))[0]
        gy = (xf @ np.array([0, P.ground + spec["ankle_h"], 1]))[1]
        sp = skia.Paint(AntiAlias=True, Color=skia.Color(0, 0, 0, 55),
                        MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 9))
        cv.drawOval(skia.Rect(hx - 150 * scale, gy - 14 * scale, hx + 150 * scale, gy + 14 * scale), sp)
        rig.draw(cv, W, xf)
        if label:
            f = skia.Font(None, 34)
            cv.drawString(label, 30, 60, f, skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255)))
        g = partrig.gap_check(rig, W, xf, size, joints, radius)
        report.append(g)
        frame = surf.makeImageSnapshot().toarray()
        if stills and i in stills:
            Image.fromarray(frame[..., [2, 1, 0, 3]]).save(f"{stills[i]}")
        if proc: proc.stdin.write(frame.tobytes())
    if proc:
        proc.stdin.close(); proc.wait()
    worst = {j: max(r[j] for r in report) for j in joints}
    return dict(frames=n, worst_joint_gap=worst, max_components=max(r["components"] for r in report),
                frames_with_gap=sum(1 for r in report if max(r[j] for j in joints) > 0.02))

if __name__ == "__main__":
    import importlib
    mod = importlib.import_module(sys.argv[1])
    st = {int(k): f"/tmp/rt_{k}.png" for k in sys.argv[3:]}
    r = run(mod, sys.argv[2] if sys.argv[2] != "-" else None, stills=st)
    print(json.dumps(r, indent=1))
