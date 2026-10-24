"""Idle -> wave -> walk, all from real motion capture, on the traced paramedic."""
import sys, json, subprocess
sys.path.insert(0,'/home/claude/rig'); sys.path.insert(0,'/home/claude/trace')
import numpy as np, skia
from PIL import Image
import model, partrig, mocap_perf as MP
from mocap_perf import xfade
IDLE = MP.Take('82_08', near='Left')
WAVE = MP.Take('141_16', near='Right', skip=0.25)
WALK = MP.Take('104_19', near='Right')
def plan(t):
    w_wave = xfade(t, 1.7, 2.2) * (1 - xfade(t, 3.85, 4.35))
    w_walk = xfade(t, 4.7, 5.15)
    w_idle = 1 - w_walk
    return [('idle', IDLE, 1.0 + t, w_idle), ('wave', WAVE, 0.25 + (t - 1.7), w_wave, 'upper'), ('walk', WALK, 0.85 + (t - 4.7), w_walk)]
def run(out, dur=10.0, stills=(), scale=0.84, label=None, size=(1080,1080), origin=(420,519), bg=None, follow=True, blinks=(0.9,3.4,6.1,8.8)):
    rig, spec, joints, radius = model.build()
    rig.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
    P = MP.MocapPerformer(rig, spec, plan, ground_take=WALK)
    W_, H_ = size
    proc = subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','bgra','-s',f'{W_}x{H_}','-r','60','-i','-',
                             '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',out],stdin=subprocess.PIPE) if out else None
    cam=0; gaps=0
    for i in range(int(dur*60)):
        t=i/60; W=P.pose(t)
        rig.blink = 1.0 if any(b <= t < b + 5/60 for b in blinks) else 0.0
        if follow: cam += (P.x*scale - cam)*0.05
        xf=np.array([[scale,0,origin[0]-cam],[0,scale,origin[1]],[0,0,1.]])
        s=skia.Surface(W_,H_); c=s.getCanvas()
        if bg is not None: c.drawImage(bg,0,0)
        else: c.clear(skia.Color(205,205,205))
        hip=xf@np.array([*rig.joint(W,'body'),1]); gy=origin[1]+scale*(P.ground+model.ANKLE_H)
        c.drawOval(skia.Rect(hip[0]-150*scale,gy-14*scale,hip[0]+150*scale,gy+14*scale),
                   skia.Paint(AntiAlias=True,Color=skia.Color(0,0,0,50),MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle,9)))
        rig.draw(c,W,xf)
        if label:
            c.drawString(label,30,60,skia.Font(None,34),skia.Paint(AntiAlias=True,Color=skia.Color(255,255,255)))
        g=partrig.gap_check(rig,W,np.array([[0.5,0,540-0.5*P.x],[0,0.5,700],[0,0,1.]]),(1080,1920),joints,radius)
        if max(g[j] for j in joints)>0.02 or g['components']>1: gaps+=1
        fr=s.makeImageSnapshot().toarray()
        if i in stills: Image.fromarray(fr[...,[2,1,0]]).save(f'd_{i}.png')
        if proc: proc.stdin.write(fr.tobytes())
    if proc: proc.stdin.close(); proc.wait()
    return gaps
if __name__=='__main__':
    st=[int(v) for v in sys.argv[2:]]
    print('gaps', run(None if sys.argv[1]=='-' else sys.argv[1], stills=st))
