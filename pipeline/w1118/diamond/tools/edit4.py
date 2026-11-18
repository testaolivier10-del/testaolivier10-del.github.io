s=open('build.py').read()
a=s.index("    s = 2.4\n    rec = skia.PictureRecorder()"); b=s.index("    q_ = c.getTotalMatrix().mapXY(*wr); DRINK_WR[0] = (q_.x(), q_.y())\n")
new='''    s = 2.4
    mouth = (526, 820 + 60 * s * 0.86)
    ang_b = lerp(112, 128, tipu) + 12 * smooth((u - 0.3) / 0.6)                                  # bottle axis angle (open neck toward his lips)
    a_r = math.radians(ang_b)
    neck_len = 64 * s * 1.02
    bc = (mouth[0] - math.sin(a_r) * neck_len, mouth[1] + math.cos(a_r) * neck_len)
    hang = math.radians(ang_b - 180)                                # fingers across the bottle
    wr = (bc[0] - s * 52 * math.cos(hang) + math.sin(a_r) * 14, bc[1] - s * 52 * math.sin(hang) - math.cos(a_r) * 14)
    q_ = c.getTotalMatrix().mapXY(*wr)
    rec = skia.PictureRecorder(); dc = rec.beginRecording(skia.Rect(0, 0, 10, 10))
    dc.concat(c.getTotalMatrix()); person(dc, 'lost', ps, 540, 820 + 952 * s * 0.98, s); rec.finishRecordingAsPicture()
    el = PN.HANDS['r']['el']
    dx, dy = q_.x() - el[0], q_.y() - el[1]; a2 = math.degrees(math.atan2(dx, dy)); ps.r_fore = -a2 - ps.r_up   # his own forearm points at the hand
    face_close(c, t, s=s, head_y=820, ps=ps)
    el = PN.HANDS['r']['el']
    inv = skia.Matrix(); c.getTotalMatrix().invert(inv); e_ = inv.mapXY(*el); el = (e_.x(), e_.y())
'''
s=s[:a]+new+s[b+len("    q_ = c.getTotalMatrix().mapXY(*wr); DRINK_WR[0] = (q_.x(), q_.y())\n"):]
s=s.replace("two_shot(c, t, 1.5, 1.44, u, 560, 1150, seller_raise=0.3 + 0.7 * up","two_shot(c, t, 1.42, 1.38, u, 480, 1170, seller_raise=0.3 + 0.7 * up")
open('build.py','w').write(s); print('ok')
