"""Pro Shorts thumbnails for w1104 (video standard section 9): the video's own clean scene as background, a hero cut
rendered alone from the same code, 2 concepts each."""
import sys, importlib, math
sys.path[:0] = ['/home/claude/lp/thumbpro', '/home/claude/w1104']
import skia, numpy as np
from PIL import Image
import thumbpro as T

OUT = '/home/claude/w1104/thumbs/'
import os; os.makedirs(OUT, exist_ok=True)


def load(mod):
    sys.path.insert(0, f'/home/claude/w1104/{mod}')
    for m in ('build', 'person', 'airman2'):
        sys.modules.pop(m, None)
    B = importlib.import_module('build'); sys.path.pop(0); return B


def scene_png(B, t, path):
    s = skia.Surface(1080, 1920); c = s.getCanvas(); B.scene(c, t)
    s.makeImageSnapshot().save(path); return path


def hero_png(draw, path, w=1400, h=1400):
    s = skia.Surface(w, h); c = s.getCanvas(); c.clear(skia.Color4f(0, 0, 0, 0)); draw(c)
    s.makeImageSnapshot().save(path); return path


# ---------------- ant
B = load('ant')
import antart as AA
bg = scene_png(B, B.T_STALK + 2.6, OUT + 'ant_bg.png')
hero = hero_png(lambda c: AA.ant(c, 300, 1100, 2.4, 1.0, rot=-140, stalk=1.0, still=True, dead=1.0, lock=1, shadow=False), OUT + 'ant_hero.png')
hero2 = hero_png(lambda c: AA.ant(c, 650, 900, 2.6, 1.0, travel=30, cut=1.0, hyph=1.0, shadow=False), OUT + 'ant_hero2.png')
BIO = T.COURSE['AP BIO']


def ant_a():
    c = T.background(bg, focus=(0.5, 0.45), zoom=1.2, blur=12, tint=BIO, dark=0.5, burst=(540, 1100), burst_col=(220, 255, 180))
    T.top_shade(c, 820, 225)
    s, p = T.subject(hero, 1050, glow=(230, 255, 200), glow_r=30)
    T.paste(c, s, 540 - s.width / 2, 1700 - s.height + p)
    T.text_line(c, 'A FUNGUS', 540, 190, 210)
    T.text_line(c, 'STEERS THIS ANT', 540, 430, 150, box=T.YELLOW)
    T.pill(c, 'AP BIO', BIO); T.mark(c); return c


def ant_b():
    c = T.background(bg, focus=(0.5, 0.5), zoom=1.0, blur=14, tint=BIO, dark=0.55, burst=(540, 1150), burst_col=(255, 250, 200))
    T.top_shade(c, 820, 225)
    s, p = T.subject(hero2, 800, glow=(255, 255, 255), glow_r=30)
    T.paste(c, s, 540 - s.width / 2, 1650 - s.height + p)
    T.ring(c, 450, 1180, 220, col=T.YELLOW)
    T.text_line(c, 'ZOMBIE ANT', 540, 190, 220)
    T.text_line(c, 'FUNGUS INSIDE', 540, 440, 160, box=T.RED, box_txt=T.WHITE)
    T.pill(c, 'AP BIO', BIO); T.mark(c); return c


# ---------------- sodium
B = load('sodium')
bg2 = scene_png(B, B.T_EXP + 0.6, OUT + 'sod_bg.png')
hero3 = hero_png(lambda c: (B.fireball(c, 700, 1100, 0.7, 2.8, seed=10), B.drum(c, 420, 1150, 20, 3.0, holes=1, seed=2)), OUT + 'sod_hero.png')
CHEM = T.COURSE['AP CHEM']


def sod_a():
    c = T.background(bg2, focus=(0.55, 0.55), zoom=1.3, blur=10, tint=CHEM, dark=0.5, burst=(540, 1100), burst_col=(255, 170, 80))
    T.top_shade(c, 820, 225)
    s, p = T.subject(hero3, 1000, glow=(255, 170, 90), glow_r=34)
    T.paste(c, s, 540 - s.width / 2, 1720 - s.height + p)
    T.text_line(c, 'SODIUM + LAKE', 540, 190, 190)
    T.text_line(c, '= FIREBALLS', 540, 430, 180, box=T.YELLOW)
    T.pill(c, 'AP CHEM', CHEM); T.mark(c); return c


def sod_b():
    c = T.background(bg2, focus=(0.5, 0.5), zoom=1.1, blur=14, tint=CHEM, dark=0.55, burst=(540, 1150), burst_col=(255, 200, 120))
    T.top_shade(c, 820, 225)
    s, p = T.subject(hero3, 900, glow=(255, 255, 255), glow_r=30)
    T.paste(c, s, 540 - s.width / 2, 1700 - s.height + p)
    T.arrow(c, (860, 760), (680, 1050), bend=-0.3, col=T.YELLOW)
    T.text_line(c, 'THEY DUMPED', 540, 190, 200)
    T.text_line(c, 'SODIUM IN A LAKE', 540, 430, 140, box=T.RED, box_txt=T.WHITE)
    T.pill(c, 'AP CHEM', CHEM); T.mark(c); return c


# ---------------- stunt
B = load('stunt')
bg3 = scene_png(B, B.T_LAND - 0.5, OUT + 'stunt_bg.png')
hero4 = hero_png(lambda c: B.man_rot(c, B.STUNT, 700, 700, 70, 2.2, face=-1, uarm_n=100, uarm_f=80, elbow_n=20, thigh_n=35, knee_n=-25, thigh_f=15, knee_f=-35), OUT + 'stunt_hero.png')
PHYS = T.COURSE['AP PHYSICS']


def stunt_a():
    c = T.background(bg3, focus=(0.5, 0.6), zoom=1.3, blur=10, tint=PHYS, dark=0.5, burst=(540, 1050), burst_col=(255, 210, 120))
    T.top_shade(c, 820, 225)
    s, p = T.subject(hero4, 760, glow=(255, 220, 140), glow_r=30)
    T.paste(c, s, 540 - s.width / 2, 1380 - s.height + p)
    T.text_line(c, '8 STORIES', 540, 190, 230)
    T.text_line(c, 'ONTO AIR?', 540, 440, 190, box=T.YELLOW)
    T.pill(c, 'AP PHYSICS 1', PHYS); T.mark(c); return c


def stunt_b():
    c = T.background(bg3, focus=(0.5, 0.55), zoom=1.1, blur=14, tint=PHYS, dark=0.55, burst=(540, 1100), burst_col=(255, 255, 255))
    T.top_shade(c, 820, 225)
    s, p = T.subject(hero4, 700, glow=(255, 255, 255), glow_r=30)
    T.paste(c, s, 540 - s.width / 2, 1350 - s.height + p)
    T.arrow(c, (900, 640), (700, 950), bend=-0.3, col=T.YELLOW)
    T.text_line(c, '50 MPH', 540, 190, 240)
    T.text_line(c, 'INTO A BAG', 540, 440, 190, box=T.RED, box_txt=T.WHITE)
    T.pill(c, 'AP PHYSICS 1', PHYS); T.mark(c); return c


ps = []
for name, fn in (('w1104-01-zombie-ant_a', ant_a), ('w1104-01-zombie-ant_b', ant_b), ('w1104-02-sodium-lake_a', sod_a),
                 ('w1104-02-sodium-lake_b', sod_b), ('w1104-03-stunt-airbag_a', stunt_a), ('w1104-03-stunt-airbag_b', stunt_b)):
    p = OUT + name + '.png'; T.save(fn(), p); ps.append(p)
T.preview(ps, OUT + 'preview.jpg'); print('ok')
