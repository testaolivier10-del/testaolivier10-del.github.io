"""The cast: one farmer, designed new for 1820s Mecklenburg (people standard: a new design, not a recolour).
Who: a farmer in his forties who works his own land. Build broad (bw 1.07), weathered tan skin, sandy brown hair cut short under the hat,
stubble. Clothes: undyed linen shirt with the sleeves rolled to below the elbow, a brown wool waistcoat with brass buttons, a red
neckerchief, dark brown wool trousers tucked into tall leather work boots, a wide woven straw hat with a dark band.
Props he handles: a tall tin milk churn (two shoulder handles) and a linen seed bag on a strap across his chest."""
import sys, math
sys.path[:0] = ['/home/claude/w1118/thunen']
import person as PN
import skia
from guy import Pose
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed
from art import shaded, diffp, op

FARMER = dict(TOP=(242, 238, 228), TOP_SH=(212, 204, 192), TOP_HI=(255, 255, 252),
              PANT=(92, 76, 66), PANT_SH=(64, 52, 50), PANT_HI=(140, 120, 102),
              SKIN=(218, 160, 118), SKIN_SH=(172, 112, 88), SKIN_HI=(246, 200, 160),
              HAIR=(150, 108, 64), HAIR_SH=(104, 70, 46), HAIR_HI=(204, 162, 110),
              cfg=dict(bw=1.07, top='linen', rolled=True, waistcoat=(116, 82, 56), kerchief=(184, 58, 50), bottom='chinos',
                       boots=((86, 58, 42), (58, 38, 32), (44, 32, 30)), hair='straw', hat=(234, 198, 124), band=(70, 46, 40),
                       beard='stubble', fw=1.03, fl=1.0))


def pose(**kw):
    ps = Pose(); ps.r_hand = PN.RELAX; ps.l_hand = PN.RELAX; ps.head_yaw = 0.0
    for k, v in kw.items(): setattr(ps, k, v)
    return ps


def farmer(c, ps, x, ground, s):
    for k, v in FARMER.items():
        if k != 'cfg': setattr(PN, k, v)
    ps.cfg = FARMER['cfg']
    return PN.draw(c, ps, x=x, ground=ground, s=s)


# ---------------- the milk churn, in the farmer's own (local) units
TIN, TIN_SH, TIN_HI, TIN_DK = (184, 192, 200), (120, 130, 150), (244, 248, 252), (84, 92, 112)


def cpt(C_, th, u, v):
    ct, st = math.cos(th), math.sin(th)
    return (C_[0] + u * ct - v * st, C_[1] + u * st + v * ct)


def churn(c, C_, th, fill=0.0):
    """a tall tin milk churn centred at C_, tilted th radians clockwise (0 = upright, mouth up). Local frame: v down, mouth at v=-196"""
    c.save(); c.translate(*C_); c.rotate(math.degrees(th))
    body = smooth_closed([(-80, 192), (-82, 120), (-82, -100), (-74, -122), (-50, -146), (-44, -160), (-44, -186), (-52, -194), (52, -194), (44, -186), (44, -160), (50, -146),
                          (74, -122), (82, -100), (82, 120), (80, 192), (0, 196)])
    c.drawPath(body, P(TIN))
    c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    # the light is fixed in the world (upper left): turn it into the churn's frame to place the shade and the bright strip
    lx, ly = math.cos(-th) * -0.7 - math.sin(-th) * -0.6, math.sin(-th) * -0.7 + math.cos(-th) * -0.6
    sd = 1 if lx < 0 else -1
    c.drawRect(skia.Rect(sd * 30, -260, sd * 100, 260), P(TIN_SH, 210, MaskFilter=blur(10)))
    c.drawRect(skia.Rect(-sd * 52 - 9, -200, -sd * 52 + 9, 200), P(TIN_HI, 200, MaskFilter=blur(4)))
    for v in (176, 40, -96):                                 # rolled bands round the churn
        c.drawRect(skia.Rect(-90, v - 7, 90, v + 7), P(TIN_SH, 200)); c.drawRect(skia.Rect(-90, v - 7, 90, v - 3), P(TIN_HI, 160))
    c.drawRect(skia.Rect(-60, -196, 60, -186), P(TIN_DK, 200))
    c.restore()
    c.drawOval(skia.Rect(-44, -202, 44, -186), P(TIN_DK)); c.drawOval(skia.Rect(-36, -200, 36, -190), P((40, 44, 60)))   # the open mouth
    if fill > 0: c.drawOval(skia.Rect(-34, -199, 34, -191), P((236, 230, 204), 255 * fill))
    for sx in (-1, 1):                                       # two loop handles on the shoulder
        hp = skia.Path(); hp.moveTo(sx * 72, -150); hp.cubicTo(sx * 128, -150, sx * 130, -52, sx * 76, -50)
        c.drawPath(hp, SP(TIN_DK, 14)); c.drawPath(hp, SP(TIN, 8)); c.drawPath(hp, SP(TIN_HI, 2.4, 160))
    c.restore()


def handle_pt(C_, th, side=-1):
    """the middle of a handle's loop (side -1 = the handle on the churn's -u side)"""
    return cpt(C_, th, side * 116, -100)


def hand_wrist(target, ang, reach=50.0):
    """where the wrist goes so the middle of the closed fist lands on target, for a hand pointing along ang"""
    return (target[0] - math.cos(ang) * reach, target[1] - math.sin(ang) * reach)
