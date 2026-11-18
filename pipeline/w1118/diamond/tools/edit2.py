s=open('build.py').read()
def rep(a,b,cnt=1):
    global s
    assert a in s, a[:60]; s=s.replace(a,b,cnt)
rep("BL = (130, 210, 255); ICE = (200, 236, 255)", "BL = (130, 210, 255); ICE = (200, 236, 255)\nWBAR = (70, 170, 250); DBAR = (196, 160, 255)")
rep("card(c, 905, 590, 'BOTTLE', water, BL, a)", "card(c, 905, 590, 'BOTTLE', water, WBAR, a)")
rep("card(c, 175, 590, 'DIAMOND', dia, ICE, a)", "card(c, 175, 590, 'DIAMOND', dia, DBAR, a)")
rep("""    card(c, 210, 600, 'BOTTLE', water, BL, 1.0)
    card(c, 210 + 0, 940, 'DIAMOND', dia, ICE, 0.0)
    card(c, 860, 600, 'DIAMOND', dia, ICE, 1.0)""", """    card(c, 175, 600, 'BOTTLE', water, WBAR, 1.0)
    card(c, 905, 600, 'DIAMOND', dia, DBAR, 1.0)""")
rep("""    wr = (430 + tr, 1330 - 30 * u); ang = math.radians(-72 + 3 * math.sin(t * 1.3))""", """    wr = (330 + tr, 1420 - 30 * u); ang = math.radians(-48 + 3 * math.sin(t * 1.3))""")
rep("""    LK = CH.LOOKS['lost']; s = 4.2
    Wf = hand_at(c, 'lost', wr, ang, -1, s, (0.2, 0.18, 0.22, 0.28, 0.34), 0.3)""", """    LK = CH.LOOKS['lost']; s = 6.4
    Wf = hand_at(c, 'lost', wr, ang, -1, s, (0.3, 0.3, 0.36, 0.42, 0.5), 0.12)""")
rep("sleeve_arm(c, 'lost', el, (wr[0] - math.cos(ang) * 20, wr[1] - math.sin(ang) * 20), 230, 170)", "sleeve_arm(c, 'lost', el, (wr[0] - math.cos(ang) * 30, wr[1] - math.sin(ang) * 30), 330, 250)")
rep("""    bx, by = wr[0] + s * 52 * math.cos(ang), wr[1] + s * 52 * math.sin(ang)""", """    bx, by = wr[0] + s * 52 * math.cos(ang), wr[1] + s * 52 * math.sin(ang) - 34 * s""")
rep("""    ps.head_tilt = 0; ps.drink = 1
    ps.r_up = 18; ps.r_fore = 150""", """    ps.head_tilt = 0; ps.drink = 1
    ps.r_up = 22; ps.r_fore = 150; ps.hide = ('r',)""")
rep("""    face_close(c, t, s=s, head_y=820, ps=ps)
    hd = PN.HANDS['r']
    el = hd['el']""", """    rec = skia.PictureRecorder(); dc = rec.beginRecording(skia.Rect(0, 0, 10, 10))
    dc.concat(c.getTotalMatrix()); person(dc, 'lost', ps, 540, 820 + 952 * s * 0.98, s); rec.finishRecordingAsPicture()
    el = PN.HANDS['r']['el']; WR_ = DRINK_WR[0]
    if WR_ is not None:
        dx, dy = WR_[0] - el[0], WR_[1] - el[1]; a2 = math.degrees(math.atan2(dx, dy)); ps.r_fore = -a2 - ps.r_up
    face_close(c, t, s=s, head_y=820, ps=ps)
    el = PN.HANDS['r']['el']""")
rep("""    sleeve_arm(c, 'lost', el, (wr[0] - 18 * math.cos(hang), wr[1] - 18 * math.sin(hang)), 92 * s * 0.86 / 1.0 * 0.95, 70 * s * 0.86 * 0.95)""",
    """    q_ = c.getTotalMatrix().mapXY(*wr); DRINK_WR[0] = (q_.x(), q_.y())
    sleeve_arm(c, 'lost', el, (wr[0] - 18 * math.cos(hang), wr[1] - 18 * math.sin(hang)), 64 * s * 0.9, 56 * s * 0.9)""")
rep("def shot9(c, t):", "DRINK_WR = [None]\n\n\ndef shot9(c, t):")
rep("""    two_shot(c, t, 1.06, 1.0, u, 560, 1240, seller_raise=0.3 + 0.7 * up""", """    two_shot(c, t, 1.34, 1.28, u, 540, 1180, seller_raise=0.3 + 0.7 * up""")
rep("""        c.drawCircle(hx, hy - 60, 160 * fl, P((255, 250, 230), 90 * fl, MaskFilter=blur(60)))""", """        c.drawCircle(hx + 40, hy - 40, 190 * fl, P((255, 250, 230), 110 * fl, MaskFilter=blur(60)))
        for a_ in (0, 60, 120):
            c.save(); c.translate(hx + 40, hy - 40); c.rotate(a_ + 10 * t); L_ = 120 * fl
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-L_, -2.5, L_, 2.5), 2, 2), P((255, 255, 240), 200 * fl)); c.restore()""")
rep("two_shot(c, t, 1.12, 1.17, u, 560, 1240, seller_raise=0.55", "two_shot(c, t, 1.22, 1.28, u, 540, 1200, seller_raise=0.55")
rep("two_shot(c, t, 1.17, 1.24, u, 560, 1240, seller_raise=1.0, lost_arm=arm", "two_shot(c, t, 1.28, 1.34, u, 540, 1200, seller_raise=1.0, lost_arm=arm")
rep("memory_endless(c, t, me, (330, 600, 750, 880), 0)", "memory_endless(c, t, me, (310, 570, 770, 930), 0)")
a=s.index("def memory_endless"); b=s.index("# ------------------------------------------------------------------ shots")
s=s[:a]+'''def memory_endless(c, t, a, rect, u_shrink):
    """at home there's always more water: three shelves of bottles running off into the distance"""
    if a <= 0: return
    pa = haze_panel(c, t, rect, a)
    c.save(); c.saveLayerAlpha(None, int(255 * a)); c.clipPath(pa, skia.ClipOp.kIntersect, True)
    x0, y0, x1, y1 = rect
    c.drawRect(skia.Rect(x0, y0, x1, y1), P((238, 236, 232)))
    vx, vy = x1 + 40, (y0 + y1) / 2                                 # vanishing point off the right edge
    for r_, by in enumerate((y0 + 120, y0 + 230, y0 + 340)):
        c.drawLine(x0, by + 4, vx, vy, SP((176, 156, 136), 8))
        x = x0 + 30 - ((t * 40) % 60); sz = 1.0
        while x < x1 and sz > 0.08:
            sz = (vx - x) / (vx - x0)
            yy = vy + (by - vy) * sz
            bottle(c, x, yy - 52 * sz * 0.9, 0, 0.8 * sz, level=0.9, t=t + x * 0.01, wet=0)
            x += 70 * sz + 6
    c.drawRect(skia.Rect(x1 - 140, y0, x1, y1), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(x1 - 140, 0), skia.Point(x1, 0)], [C((238, 236, 232), 0), C((238, 236, 232), 255)])))
    c.restore(); c.restore()
    c.drawPath(pa, SP((255, 255, 255), 4, 150 * a))


'''+s[b:]
open('build.py','w').write(s)
print('ok')
