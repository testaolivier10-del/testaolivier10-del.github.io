s = open('build.py').read()
def rep(a, b):
    global s
    assert a in s, a[:70]; s = s.replace(a, b, 1)
def rep_block(start, end, new):
    global s
    a = s.index(start); b = s.index(end, a + len(start)); s = s[:a] + new + s[b:]

rep("WD = Words('/home/claude/w1118/diamond/out/words.json')\nT_END = WD.end() + 0.35\nDUR = round(T_END + 1.4, 2)\nT2, T3, T4, T5, T6 = 6.2, 10.1, 11.6, 19.3, 23.5\nT7, T8, T9, T10 = 31.84, 34.4, 36.0, 38.3\n",
"""WD = Words('/home/claude/w1118/diamond/out/words_t.json')      # word times after two silent pauses were trimmed (trim_voice.py)
SP_END = WD.end()
T2 = WD.at('a') - 0.12; T3 = WD.at('would') - 0.06; T4 = WD.at('back') - 0.04; T5 = WD.at('economists') - 0.06
T6A = WD.at('what') - 0.05; T6B = WD.at('what', 2) - 0.05; T6C = WD.at('at') - 0.05; T6D = WD.at('so') - 0.05
T7 = WD.at('out') - 0.05; T8 = WD.at('he') - 0.12; T9 = T8 + 1.6; T9B = T9 + 0.75; T10 = WD.at('is') - 0.06
T6 = T6A
T_FIN = SP_END + 0.06
DUR = round(SP_END + 1.9, 2)
T_END = DUR + 1.0                                               # titles and watermark run to the end; the URL is drawn by frame() below
OPEN = (1.2, 1.26)                                              # opening zoom (around y 900, so heads sit just below the poll band)
""")
rep("lid=1.0 if (t % 3.7) > 0.12 else 0.15, l_up=8", "lid=1.0 if ((t + 1.1) % 3.7) > 0.12 else 0.15, l_up=8")
rep("""def lost_pose(t, yaw=0.45, look=(0.6, 0.0), arm_out=0.0, sq=0.62, worry=0.6, bottle_lvl=None):
    ps = pose(head_yaw=yaw, look=look, lid=sq if (t % 4.3) > 0.12 else 0.08, worry=worry, brow=-0.2,""",
"""def lost_pose(t, yaw=0.45, look=(0.6, 0.0), arm_out=0.0, sq=0.62, worry=0.6, bottle_lvl=None, smile=0.0, bottle_fore=105):
    ps = pose(head_yaw=yaw, look=look, lid=sq if ((t + 1.7) % 4.3) > 0.12 else 0.08, worry=worry, brow=-0.2, smile=smile,""")
rep("ps.l_up = 30; ps.l_fore = 105; ps.l_habs = BOTTLE_HABS", "ps.l_up = 30; ps.l_fore = bottle_fore; ps.l_habs = BOTTLE_HABS")
# opaque painted wooden sign
rep_block("    sg = skia.Rect(x0 + 40, top + 80, x0 + 250, top + 170)", "    # the cooler",
"""    sg = skia.Rect(x0 + 34, top + 74, x0 + 262, top + 176)            # a painted wooden board nailed to the crates
    c.drawRect(skia.Rect(sg.left() + 6, sg.top() + 8, sg.right() + 6, sg.bottom() + 8), P((70, 40, 26), 120, MaskFilter=blur(6)))
    c.drawRect(sg, P((150, 98, 62)))
    for k in range(1, 3): yy = sg.top() + k * sg.height() / 3; c.drawLine(sg.left(), yy, sg.right(), yy, SP((112, 70, 44), 3))
    c.drawRect(skia.Rect(sg.left(), sg.top(), sg.right(), sg.top() + 6), P((186, 134, 90)))
    for nx in (sg.left() + 12, sg.right() - 12): c.drawCircle(nx, sg.top() + 16, 4, P((90, 80, 76)))
    text_c(c, 'COLD WATER', sg.centerX(), sg.top() + 66, 38, (252, 240, 210))
""")
rep_block("def card(c, x, y, lab, val, col", "def leader(",
'''def card(c, x, y, lab, val, col, a=1.0, w=300, h=420, unknown=False):
    """a card hanging in the scene: the VALUE OF ONE MORE of this, here. val 0..1.2 fills the bar (it can spill over the top)"""
    if a <= 0: return
    c.save(); c.saveLayerAlpha(None, int(255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2 + 4, y + 8, x + w / 2 + 4, y + h + 8), 28, 28), P((60, 30, 20), 100, MaskFilter=blur(12)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2, y, x + w / 2, y + h), 28, 28), P((24, 22, 44), 235))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2, y, x + w / 2, y + h), 28, 28), SP((255, 255, 255), 3, 130))
    text_c(c, 'VALUE OF', x, y + 52, 40, (255, 210, 63)); text_c(c, 'ONE MORE', x, y + 98, 40, (255, 210, 63))
    text_c(c, lab, x, y + 150, 46, (255, 255, 255))
    bx0, bx1, by0, by1 = x - 40, x + 40, y + 180, y + h - 24
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx0, by0, bx1, by1), 16, 16), P((255, 255, 255), 40))
    if unknown:
        text_c(c, '?', x, (by0 + by1) / 2 + 22, 64, (255, 255, 255), 200)
    else:
        hh = (by1 - by0) * max(0.0, val); top_ = by1 - hh
        c.save()
        if val <= 1.0: c.clipRRect(skia.RRect.MakeRectXY(skia.Rect(bx0, by0, bx1, by1), 16, 16), True)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx0, top_, bx1, by1), 16, 16), P(col))
        c.drawRect(skia.Rect(bx0 + 9, top_ + 7, bx0 + 20, by1 - 9), P((255, 255, 255), 90))
        if val > 1.0: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx0 - 10, top_ - 10, bx1 + 10, top_ + 34), 18, 18), P(col, 130, MaskFilter=blur(12)))
        c.restore()
    c.restore(); c.restore()


''')
rep_block("def memory_home(c, t, a, rect, show):", "def tag(",
'''def memory_home(c, t, a, rect, show):
    """home: a jeweller's window (glass, brass frame, velvet stand, an open ring box, a price tag on a string) and a kitchen
    (tiles, a shelf of water bottles with a price tag, a chrome tap running into a steel sink)"""
    if a <= 0: return
    pa = haze_panel(c, t, rect, a)
    c.save(); c.saveLayerAlpha(None, int(255 * a)); c.clipPath(pa, skia.ClipOp.kIntersect, True)
    x0, y0, x1, y1 = rect; mxp = (x0 + x1) / 2
    # ---- left: the jeweller's shop front
    c.drawRect(skia.Rect(x0, y0, mxp, y1), P((70, 46, 40)))                                       # dark wood shop front
    jw = skia.Rect(x0 + 50, y0 + 70, mxp - 30, y1 - 70)
    c.drawRect(skia.Rect(jw.left() - 14, jw.top() - 14, jw.right() + 14, jw.bottom() + 14), P((206, 168, 92)))   # brass frame
    c.drawRect(jw, P((34, 26, 48)))
    for k in range(3): c.drawCircle(jw.left() + (k + 1) * jw.width() / 4, jw.top() + 10, 70, P((255, 228, 170), 70, MaskFilter=blur(34)))   # spot lights
    hl = show.get('jewel', 0)
    cx, base = jw.centerX(), jw.bottom() - 40
    c.drawRect(skia.Rect(jw.left(), base, jw.right(), jw.bottom()), P((96, 34, 60)))              # velvet floor of the window
    c.drawPath(smooth_closed([(cx - 120, base), (cx - 100, base - 70), (cx + 100, base - 70), (cx + 120, base)]), P((120, 44, 74)))   # display step
    bx_ = skia.Rect(cx - 70, base - 150, cx + 70, base - 70)                                      # the ring box, open
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx_.left(), bx_.top() - 70, bx_.right(), bx_.top() + 4), 12, 12), P((40, 22, 40)))   # lid, open
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx_.left() + 10, bx_.top() - 62, bx_.right() - 10, bx_.top() - 4), 8, 8), P((236, 226, 236)))   # satin lining
    c.drawRRect(skia.RRect.MakeRectXY(bx_, 10, 10), P((58, 30, 52))); c.drawRect(skia.Rect(bx_.left(), bx_.top(), bx_.right(), bx_.top() + 26), P((110, 40, 70)))   # cushion
    ring_loose(c, cx, bx_.top() - 4, 34, 0, 0.5 * hl + 0.3 * (0.5 + 0.5 * math.sin(t * 3)), t)
    stx, sty = cx + 90, base - 100                                                                # the price tag on a thread
    c.drawLine(bx_.right() - 8, bx_.top() + 20, stx - 40, sty - 20, SP((240, 230, 210), 2))
    tag(c, stx + 10, sty + 20, 'THOUSANDS', (255, 210, 63), max(0.35, hl))
    c.save(); c.clipRect(jw)                                                                      # the glass: two slanted reflections
    for k, (o, wd) in enumerate(((0.15, 46), (0.32, 18))):
        xx = jw.left() + o * jw.width() + 40 * math.sin(t * 0.3)
        pg = skia.Path(); pg.addPoly([skia.Point(xx, jw.bottom()), skia.Point(xx + wd, jw.bottom()), skia.Point(xx + wd + 220, jw.top()), skia.Point(xx + 220, jw.top())], True)
        c.drawPath(pg, P((255, 255, 255), 46))
    c.restore()
    # ---- right: the kitchen
    c.drawRect(skia.Rect(mxp, y0, x1, y1), P((242, 240, 234)))
    for j in range(int((x1 - mxp) / 46) + 1):                                                    # tiles
        for i in range(int((y1 - y0) / 46) + 1):
            c.drawRect(skia.Rect(mxp + j * 46 + 2, y0 + i * 46 + 2, mxp + j * 46 + 44, y0 + i * 46 + 44), P((226, 232, 236)))
    sh = y0 + 0.36 * (y1 - y0)
    c.drawRect(skia.Rect(mxp + 30, sh, x1 - 40, sh + 14), P((176, 140, 104))); c.drawRect(skia.Rect(mxp + 30, sh + 14, x1 - 40, sh + 22), P((120, 90, 70), 160))
    nb = 6
    for j in range(nb):
        bottle(c, mxp + 70 + j * (x1 - 110 - mxp - 70) / (nb - 1), sh - 54, 0, 0.66, level=0.9, t=t + j, wet=0)
    hb = show.get('bottle', 0)
    tag(c, mxp + (x1 - mxp) * 0.5, sh + 74, 'ABOUT $1', (90, 220, 200), max(0.35, hb), ink=(20, 18, 44))
    # counter, sink and tap
    cy_ = y1 - 120
    c.drawRect(skia.Rect(mxp, cy_, x1, y1), P((206, 196, 184))); c.drawRect(skia.Rect(mxp, cy_, x1, cy_ + 12), P((232, 224, 214)))
    sk = skia.Rect(mxp + 90, cy_ + 6, x1 - 90, cy_ + 50)
    c.drawRRect(skia.RRect.MakeRectXY(sk, 14, 14), P((150, 160, 172))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(sk.left() + 8, sk.top() + 6, sk.right() - 8, sk.bottom()), 12, 12), P((112, 122, 136)))
    tx = sk.centerX() - 60
    neck = skia.Path(); neck.moveTo(tx, cy_); neck.lineTo(tx, cy_ - 110); neck.quadTo(tx, cy_ - 170, tx + 60, cy_ - 170); neck.quadTo(tx + 110, cy_ - 170, tx + 110, cy_ - 120)
    c.drawPath(neck, SP((150, 158, 170), 22)); c.drawPath(neck, SP((214, 222, 232), 12)); c.drawPath(neck, SP((255, 255, 255), 4, 200))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(tx - 22, cy_ - 12, tx + 22, cy_ + 4), 6, 6), P((170, 178, 190)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(tx - 50, cy_ - 50, tx - 22, cy_ - 38), 6, 6), P((200, 208, 220)))   # the handle
    run = show.get('tap', 0)
    if run > 0:
        sx_, top_ = tx + 110, cy_ - 118
        bot = lerp(top_, sk.bottom() - 6, min(1.0, run * 1.6))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(sx_ - 7, top_, sx_ + 7, bot), 6, 6), P((150, 210, 246), 235))
        c.drawRect(skia.Rect(sx_ - 2, top_, sx_ + 1, bot), P((255, 255, 255), 200))
        for k in range(6):
            yy = top_ + ((t * 420 + k * 30) % max(1, bot - top_)); c.drawLine(sx_ + 3, yy, sx_ + 3, yy + 12, SP((255, 255, 255), 2, 180))
        if run > 0.6:
            for k in range(5):
                u_ = (t * 3 + k * 0.2) % 1.0; ang = math.radians(200 + k * 35)
                c.drawCircle(sx_ + math.cos(ang) * 30 * u_, sk.bottom() - 10 - 22 * u_ * (1 - u_) * 4, 3.5, P((200, 236, 255), 220 * (1 - u_)))
    c.restore(); c.restore()
    c.drawPath(pa, SP((255, 255, 255), 4, 150 * a))


''')
open('build.py', 'w').write(s); print('head ok')
