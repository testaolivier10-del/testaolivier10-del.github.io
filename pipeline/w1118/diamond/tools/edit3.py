s=open('build.py').read()
def rep(a,b):
    global s
    assert a in s, a[:60]; s=s.replace(a,b,1)
rep("    mouth = (540 + 0, 820 + 58 * s * 0.86)", "    mouth = (522, 820 + 50 * s * 0.86)")
rep("    ang_b = lerp(150, 118, tipu)", "    ang_b = lerp(118, 142, tipu) + 14 * smooth((u - 0.3) / 0.6)")
rep("ang = math.radians(-48 + 3 * math.sin(t * 1.3))", "ang = math.radians(-30 + 3 * math.sin(t * 1.3))")
rep("Wf = hand_at(c, 'lost', wr, ang, -1, s, (0.3, 0.3, 0.36, 0.42, 0.5), 0.12)", "Wf = hand_at(c, 'lost', wr, ang, -1, s, (0.34, 0.36, 0.42, 0.5, 0.58), 0.08)")
rep("two_shot(c, t, 1.34, 1.28, u, 540, 1180, seller_raise=0.3 + 0.7 * up", "two_shot(c, t, 1.5, 1.44, u, 560, 1150, seller_raise=0.3 + 0.7 * up")
open('build.py','w').write(s); print('ok')
