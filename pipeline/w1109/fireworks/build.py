"""w1109-02-firework-blue (AP Chemistry): why blue is the hardest firework color. 1080x1920, 30 fps, all code, built to the 2026-11-09 standard
(the main person's face in close shots, the one hand model, a body with real anatomy).
Shots: 1 wide lake, she holds the blue shell (0-2.6) / close on her face and the shell (2.6-5.8) / 2 sky: three metals, three colors (5.8-13.5) /
close: "why?" (13.5-16.3) / 3 inside a burning star: the atom, heat lifts the electron, it falls and gives off light (16.3-24.2) / energy level
drops: big = blue, small = red (24.2-28.8) / 4 the workbench: her hands pack copper stars (28.8-31.0) / 5 wide: a test shell runs too hot and
washes out (31.0-36.7) / 6 the cooler shell climbs, the whole sky turns blue, her face in blue light (36.7-43.2).
Motion list: strontium red, barium green, sodium yellow, copper blue; heat raises the electron to the higher level, light leaves only when it falls;
the bigger energy drop gives the shorter wavelength (bluer) wave; the too hot burst fades to white, it does not change to another color."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/fw']
import skia
import kit, lpk, art as A, char as CH, fwart as F, hands as H
from kit import Words, Short, ease_io, Wt, Y, R, TL
from lpk import P, SP, C, blur, smooth, lerp, mix
from fwart import RED, GREEN, YELLOW, BLUE, GOLDW, HZ, Burst

# a new person for this story: mustard work jacket, dark hair in a bun
CH.SW, CH.SW_SH, CH.SW_HI = (226, 168, 72), (170, 112, 60), (255, 226, 160)
CH.SKIN, CH.SKIN_SH, CH.SKIN_HI = (218, 164, 128), (172, 116, 96), (246, 204, 170)
CH.HAIR, CH.HAIR_SH, CH.HAIR_HI = (44, 38, 58), (26, 22, 40), (120, 110, 160)
CH.JEAN, CH.JEAN_SH = (60, 64, 84), (38, 40, 58)
CH.HAIRSTYLE = 'bun'
BL = (110, 170, 255)

WD = Words('/home/claude/fw/out/words.json')
DUR, T_END = 43.2, 41.7
T_SKY, T_WHY, T_ATOM, T_LAD, T_BENCH, T_HOT, T_FIN = 5.84, 13.52, 16.32, 24.16, 28.8, 31.0, 36.72
CUS = ((2.64, 5.84), (13.52, 16.32), (41.25, 42.05))
T_BLUE = 40.32

BURSTS = [Burst(0.15, 770, 640, GOLDW, 210, 80, 1, 2.2), Burst(1.3, 900, 800, (255, 190, 210), 150, 60, 2, 1.9), Burst(1.9, 640, 560, GOLDW, 140, 60, 3, 1.9),
          Burst(6.0, 300, 720, RED, 200, 80, 4, 2.1), Burst(6.45, 790, 640, GREEN, 200, 80, 5, 2.1), Burst(6.95, 540, 880, YELLOW, 180, 80, 6, 2.1),
          Burst(9.05, 330, 660, RED, 380, 170, 7, 3.0), Burst(9.4, 150, 900, RED, 130, 50, 17, 1.7), Burst(9.6, 560, 520, (255, 120, 120), 120, 50, 18, 1.7),
          Burst(10.65, 770, 640, GREEN, 380, 170, 8, 3.0), Burst(11.0, 960, 900, GREEN, 130, 50, 19, 1.7), Burst(11.2, 560, 480, (150, 255, 170), 120, 50, 20, 1.6),
          Burst(12.42, 540, 760, YELLOW, 370, 170, 9, 2.7), Burst(12.75, 240, 620, YELLOW, 130, 50, 21, 1.5), Burst(12.9, 850, 600, (255, 236, 150), 130, 50, 22, 1.5),
          Burst(31.5, 600, 700, BLUE, 360, 160, 10, 5.0, wash=(33.0, 35.4)),
          Burst(T_BLUE, 560, 640, BLUE, 640, 300, 11, 3.6, col2=(190, 225, 255)), Burst(T_BLUE + 0.12, 560, 640, (140, 200, 255), 330, 120, 14, 2.6),
          Burst(40.95, 220, 860, (130, 190, 255), 260, 100, 12, 2.4), Burst(41.25, 900, 800, BLUE, 250, 100, 13, 2.4),
          Burst(42.1, 380, 560, BLUE, 300, 120, 15, 2.4), Burst(42.45, 800, 620, (150, 205, 255), 280, 110, 16, 2.4)]
TRAILS = [(8.3, 9.05, 420, HZ, 330, 660), (9.9, 10.65, 700, HZ, 770, 640), (11.67, 12.42, 560, HZ, 540, 760), (31.0, 31.5, 760, 1410, 600, 700), (38.5, T_BLUE, 760, 1410, 570, 640)]


def track(keys, t):
    if t <= keys[0][0]: return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t0 <= t < t1: return lerp(v0, v1, smooth((t - t0) / (t1 - t0)))
    return keys[-1][1]


def pulse(t, t0, rise=0.12, hold=0.3, fall=0.5):
    if t < t0: return 0.0
    if t < t0 + rise: return smooth((t - t0) / rise)
    if t < t0 + rise + hold: return 1.0
    return 1 - smooth((t - t0 - rise - hold) / fall)


def back_out(u, k=1.6):
    u = min(1.0, max(0.0, u)); u -= 1
    return 1 + (k + 1) * u ** 3 + k * u ** 2


def pop(t, t0, d=0.28):
    return 0.0 if t < t0 else back_out((t - t0) / d, 2.2)


def sky_light(t):
    tot = 0.0; col = [0.0, 0.0, 0.0]
    for b in BURSTS:
        l = b.light(t) * min(1.4, b.R / 300.0)
        if l > 0:
            tot += l
            for i in range(3): col[i] += b.col[i] * l
    if tot <= 0: return (255, 220, 170), 0.0
    return tuple(min(255, v / tot) for v in col), min(1.7, tot)


def lake(c, t, z=1.0, shift=0.0, her=None, sh=None):
    tint, ta = sky_light(t)
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-540, -960 + shift)
    F.sky(c, t, tint, ta * 0.8)
    F.water(c, t, tint, ta)

    def fw(cc):
        for tr in TRAILS: F.trail(cc, t, *tr)
        for b in BURSTS: b.draw(cc, t)
    F.with_reflection(c, fw)
    F.dock(c, t, tint, ta)
    if sh is not None: F.shell(c, *sh)
    if her is not None: CH.back(c, t, rim_boost=min(1.0, 0.25 + ta), rimcol=mix((255, 232, 170), tint, min(1.0, ta * 1.2)), **her)
    if ta > 0.05: c.drawRect(skia.Rect(-400, 900, 1480, 2400), skia.Paint(Color=C(tint, min(26, 16 * ta)), BlendMode=skia.BlendMode.kScreen))
    F.fireflies(c, t); F.reeds(c, t)
    c.restore()


def closeup(c, t):
    for i, (a, b) in enumerate(CUS):
        if a <= t < b:
            u = (t - a) / (b - a)
            c.save(); z = 1.0 + 0.06 * u; c.translate(540, 950); c.scale(z, z); c.translate(-540, -900)
            if i == 0:      # she studies the blue shell in her hand
                fl = 0.75 + 0.25 * math.sin(t * 7) * math.sin(t * 2.3)
                F.night_bg(c, t, GOLDW, 1, fl)
                lid = 0.05 if 0.5 < u < 0.54 else 1.0
                CH.face(c, t, look=-0.55, looky=0.85, worry=0.7, smile=-0.3, lid=lid, key=GOLDW, key_side=1, tilt=-4)
                sx, sy = 262, 1300 + 6 * math.sin(t * 1.7)
                F.shell(c, sx, sy, 138, -12)
                H.hand(c, (sx + 14, sy + 262), math.radians(-93), -1, 3.3, skin=CH.SKIN, shade=CH.SKIN_SH, hi=CH.SKIN_HI, nails=True, curls=(0.25, 0.4, 0.36, 0.38, 0.44), spread=0.55)
            elif i == 1:    # looking up at the colors, then at us: "why?"
                k = smooth((t - 14.3) / 0.35); key = mix(YELLOW, GOLDW, smooth(u * 1.5))
                F.night_bg(c, t, key, -1, 1 - 0.4 * u)
                CH.face(c, t, look=lerp(-0.3, 0.0, k), looky=lerp(-0.9, 0.0, k), brow=lerp(0.3, 0.95, k), worry=0.3 * k, smile=lerp(0.15, -0.05, k), tilt=6 * k, key=key, key_side=-1)
            else:           # the blue
                k = smooth(u / 0.4)
                F.night_bg(c, t, BL, -1, 1.3)
                CH.face(c, t, look=-0.2, looky=-0.7, brow=1.0, lid=1.2, smile=lerp(0.3, 0.95, k), opn=lerp(0.3, 0.8, k), key=BL, key_side=-1, fill=(150, 200, 255))
            c.restore(); return True
    return False


SHP = (548, 1206)


def scene(c, t):
    if closeup(c, t): return
    if t < T_SKY:                                   # 1 wide: she holds the shell up and looks at it
        hand = (SHP[0] - 6, SHP[1] + 78 + 3 * math.sin(t * 1.7))
        lake(c, t, lerp(1.0, 1.05, t / T_SKY), her=dict(yaw=0.55, pony=0, hr=hand, grab=(SHP[0], SHP[1] - 20), sway=3 * math.sin(t * 0.8)), sh=(SHP[0], SHP[1] + 3 * math.sin(t * 1.7), 44, 8))
    elif t < T_WHY:                                 # 2 the sky: three metals
        u = (t - T_SKY) / (T_WHY - T_SKY)
        lake(c, t, lerp(1.0, 1.06, u), shift=110)
        for name, col, x, y, t0 in (('STRONTIUM', RED, 330, 1150, 8.24), ('BARIUM', GREEN, 770, 1150, 9.92), ('SODIUM', YELLOW, 540, 1250, 11.68)):
            A.tag(c, name, x, y, col, 50, pop(t, t0), 1.0 if t >= t0 else 0.0)
    elif t < T_LAD:                                 # 3 inside a burning star
        heat = pulse(t, 16.45, 0.4, 2.4, 1.0)
        F.ember_bg(c, t, heat)
        lvl = track([(17.6, 0.0), (18.35, 1.0), (20.5, 1.0), (21.05, 0.0)], t)
        fl = max(pulse(t, 17.6, 0.2, 0.4, 0.5), pulse(t, 20.9, 0.15, 0.3, 0.6))
        wu = (t - 21.3) / 1.2
        if wu > 0: F.wave(c, 690, 800, 1010, 520, GOLDW, 70, 24, wu, ph=t * 9)
        F.atom(c, t, lvl, fl)
        A.tag(c, 'HEAT', 540, 1330, (255, 150, 80), 60, pop(t, 16.48), (1 - smooth((t - 19.6) / 0.4)) if t >= 16.48 else 0.0)
        A.tag(c, 'HIGHER ENERGY LEVEL', 540, 566, (170, 190, 255), 44, pop(t, 18.76), (1 - smooth((t - 20.5) / 0.4)) if t >= 18.76 else 0.0)
        A.tag(c, 'LIGHT', 860, 600, GOLDW, 60, pop(t, 23.2), 1.0 if t >= 23.2 else 0.0)
    elif t < T_BENCH:                               # energy drops: big = blue, small = red
        F.ember_bg(c, t, 0.3)
        F.ladder(c, t, 290, 640, 520, min(1.0, max(0.0, (t - 24.4) / 0.75)), BL, 46, (t - 25.2) / 0.7, 'BLUER', pop(t, 25.44))
        if t >= 26.3: F.ladder(c, t, 790, 940, 220, min(1.0, max(0.0, (t - 26.66) / 0.6)), RED, 110, (t - 27.4) / 0.7, 'REDDER', pop(t, 27.76))
    elif t < T_HOT:                                 # 4 the workbench: copper stars go into the shell
        u = (t - T_BENCH) / (T_HOT - T_BENCH)
        c.save(); z = 1.0 + 0.05 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
        F.bench(c, t)
        t_drop = 30.02
        F.shell_half(c, 430, 800, 15 if t >= t_drop else 14)
        F.bowl(c, 850, 1190)
        sk = dict(skin=CH.SKIN, shade=CH.SKIN_SH, hi=CH.SKIN_HI, sleeve=CH.SW, sleeve_sh=CH.SW_SH)
        F.pinch_hand(c, (238 + 2 * math.sin(t * 2), 968), math.radians(-42), -1, s=3.0, pinch=0.0, holding=False, **sk)        # her left hand steadies the shell
        src = (842, 1150); dst = F.slot(14)
        if t < 29.05: tip = (src[0], src[1] - 30 * smooth((t - T_BENCH) / 0.25)); pin = 1.0
        elif t < t_drop:
            k = ease_io((t - 29.05) / (t_drop - 29.05)); tip = (lerp(src[0], dst[0], k), lerp(src[1] - 30, dst[1], k) - 90 * math.sin(math.pi * k)); pin = 1.0
        else:
            k = smooth((t - t_drop) / 0.5); tip = (dst[0] + 60 * k, dst[1] - 10 + 70 * k); pin = 1 - smooth((t - t_drop) / 0.16)
        F.pinch_hand(c, tip, math.radians(-128), 1, s=3.0, pinch=pin, holding=t < t_drop, **sk)
        A.tag(c, 'COPPER', 850, 960, TL, 60, pop(t, 30.08), 1.0 if t >= 30.08 else 0.0)
        c.restore()
    elif t < T_FIN:                                 # 5 too hot: the blue washes out
        u = (t - T_HOT) / (T_FIN - T_HOT)
        slump = smooth((t - 34.9) / 0.7)
        lake(c, t, lerp(1.0, 1.05, u), her=dict(yaw=0.45 - 0.5 * slump, pony=0, dy=10 * slump, sway=3 * math.sin(t * 0.8), tilt=5 * slump))
        A.tag(c, 'TOO HOT', 720, 1060, A.RED, 62, pop(t, 32.4), (1 - smooth((t - 36.2) / 0.4)) if t >= 32.4 else 0.0)
    else:                                           # 6 the cooler shell: the whole sky turns blue
        u = (t - T_FIN) / (DUR - T_FIN)
        hl = hr = None; dy = 0.0; sq = 1.0
        k = t - T_BLUE - 0.25
        if k > 0:                                   # both arms go up when it bursts
            e = back_out(k / 0.5, 1.2); rl, rr = CH.rest_hand(-1), CH.rest_hand(1)
            hl = (lerp(rl[0], 196, e) - 40 * math.sin(math.pi * min(1, k / 0.5)), lerp(rl[1], 1010, e)); hr = (lerp(rr[0], 560, e) + 40 * math.sin(math.pi * min(1, k / 0.5)), lerp(rr[1], 1004, e))
            if 0.2 < k < 1.85:
                ph = ((k - 0.2) % 0.55) / 0.55; dy = -30 * math.sin(math.pi * ph); sq = 1 - 0.02 * math.cos(2 * math.pi * ph)
        yaw = track([(T_FIN, -0.05), (38.3, 0.5), (38.6, 0.5), (39.6, 0.15), (43.2, 0.1)], t)
        lake(c, t, lerp(1.0, 1.08, ease_io(u)), her=dict(yaw=yaw, pony=0, hl=hl, hr=hr, dy=dy, sq=sq, sway=3 * math.sin(t * 0.8)))
        fl = pulse(t, T_BLUE, 0.1, 0.1, 0.9)
        if fl > 0: c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Color=C((170, 210, 255), 60 * fl), BlendMode=skia.BlendMode.kScreen))


TITLES = [
    (0.0, [[('FIREWORK COLORS', Wt)], [('WHY ', Wt), ('BLUE', BL), (' IS HARDEST', Wt)]]),
    (T_SKY, [[('EVERY COLOR', Wt)], [('A DIFFERENT ', Wt), ('METAL', Y)]]),
    (8.24, [[('STRONTIUM', RED)], [('BURNS RED', Wt)]]),
    (9.92, [[('BARIUM', GREEN)], [('BURNS GREEN', Wt)]]),
    (11.68, [[('SODIUM', YELLOW)], [('BURNS YELLOW', Wt)]]),
    (T_WHY, [[('WHY DOES EACH METAL', Wt)], [('GET ITS OWN ', Wt), ('COLOR?', Y)]]),
    (T_ATOM, [[('HEAT KICKS', Wt)], [('ELECTRONS ', Wt), ('UP', Y)]]),
    (20.08, [[('THEY FALL BACK', Wt)], [('AND GIVE OFF ', Wt), ('LIGHT', Y)]]),
    (T_LAD, [[('BIGGER DROP', Wt)], [('BLUER LIGHT', BL)]]),
    (26.4, [[('SMALLER DROP', Wt)], [('REDDER LIGHT', RED)]]),
    (T_BENCH, [[('FOR BLUE', BL)], [('SHE PACKS ', Wt), ('COPPER', TL)]]),
    (T_HOT, [[('TOO HOT', R)], [('AND THE BLUE WASHES OUT', Wt)]]),
    (T_FIN, [[('SO SHE KEEPS IT', Wt)], [('COOLER', BL)]]),
    (T_BLUE, [[('THE WHOLE SKY', Wt)], [('TURNS ', Wt), ('BLUE', BL)]]),
]

SHORT = Short(WD, 'AP CHEMISTRY', TITLES, scene, DUR, T_END, lift=lambda t: 1.04, fix={'BLUE': 'blue'}, cuts=(T_ATOM,))

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/fw/out/stills')
