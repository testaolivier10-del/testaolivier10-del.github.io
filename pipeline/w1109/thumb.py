import sys, math; sys.path[:0]=['/home/claude/short','/home/claude/mh']
import numpy as np, skia, cv2
import art as A, char as CH, kit
from lpk import P, SP, C, blur
ANTON = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Anton-Regular.ttf')
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
W, H = 1080, 1920
def make(out, words2, look):
    s = skia.Surface(W, H); c = s.getCanvas()
    # background: the stage, doors 1 and 2, blurred and darkened
    b = skia.Surface(W, H); bc = b.getCanvas()
    bc.save(); bc.translate(540, 1150); bc.scale(1.5, 1.5); bc.translate(-378, -840)
    A.backdrop(bc, 1.0); A.floor(bc, 1.0, {1: A.BLUE, 2: A.BLUE, 3: A.BLUE})
    A.door(bc, 1, frame_glow=(A.GOLD, 1.0)); A.door(bc, 2, frame_glow=(A.TEAL, 1.0)); A.door(bc, 3)
    for i in (1, 2): A.plaque(bc, i, 1.0, A.GOLD if i == 1 else A.TEAL)
    A.ghost_car(bc, A.DOORX[1], 0.9); A.ghost_car(bc, A.DOORX[2], 0.9)
    bc.restore()
    c.drawImage(b.makeImageSnapshot(), 0, 0, skia.SamplingOptions(), skia.Paint(ImageFilter=skia.ImageFilters.Blur(5, 5)))
    c.drawRect(skia.Rect(0, 0, W, H), P((10, 6, 34), 95))
    A.glow(c, 540, 1250, 900, (255, 200, 150), 110)
    # hero: her face, as a sticker with a white outline and a glow
    h = skia.Surface(W, H); hc = h.getCanvas(); hc.clear(0)
    hc.save(); hc.translate(540, 1240); hc.scale(1.12, 1.12); hc.translate(-540, -930)
    CH.face(hc, 1.0, look=look, worry=0.85, brow=0.3, smile=-0.4, opn=0.0, lid=1.12, key=(255, 214, 150), key_side=-1, fill=(120, 230, 220), tilt=-3)
    hc.restore()
    arr = h.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType)
    al = arr[..., 3]
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (29, 29)); dil = cv2.dilate(al, k)
    glowm = cv2.GaussianBlur(cv2.dilate(al, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (71, 71))), (0, 0), 26)
    def layer(mask, col):
        a = np.zeros((H, W, 4), np.uint8); a[..., 0], a[..., 1], a[..., 2] = col; a[..., 3] = mask
        a[..., :3] = (a[..., :3].astype(np.float32) * (mask[..., None] / 255.0)).astype(np.uint8)
        return skia.Image.fromarray(a, colorType=skia.kRGBA_8888_ColorType, alphaType=skia.kPremul_AlphaType)
    c.drawImage(layer((glowm * 0.75).astype(np.uint8), (255, 200, 90)), 0, 0)
    c.drawImage(layer(cv2.GaussianBlur(dil, (0, 0), 10), (0, 0, 0)), 10, 16, skia.SamplingOptions(), skia.Paint(Alphaf=0.6))
    c.drawImage(layer(dil, (255, 255, 255)), 0, 0)
    c.drawImage(h.makeImageSnapshot(), 0, 0)
    # dark fade under the words, then the words
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 760)], [C((6, 4, 22), 235), C((6, 4, 22), 0)])
    c.drawRect(skia.Rect(0, 0, W, 760), skia.Paint(Shader=sh))
    f1 = skia.Font(ANTON, 232); w1 = f1.measureText(words2[0])
    for dx, dy, col, st in ((0, 0, (10, 8, 30), 26), (0, 0, (255, 255, 255), 0)):
        pa = skia.Paint(AntiAlias=True, Color=C(col)); 
        if st: pa.setStyle(skia.Paint.kStroke_Style); pa.setStrokeWidth(st); pa.setStrokeJoin(skia.Paint.kRound_Join)
        c.drawString(words2[0], 540 - w1 / 2, 400, f1, pa)
    f2 = skia.Font(ANTON, 232); w2 = f2.measureText(words2[1])
    c.save(); c.translate(540, 600); c.rotate(-3.5)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 44, -128, w2 / 2 + 44, 122), 22, 22), P((0, 0, 0), 120, MaskFilter=blur(14)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 44, -136, w2 / 2 + 44, 112), 22, 22), P((255, 214, 64)))
    c.drawString(words2[1], -w2 / 2, 84, f2, P((16, 12, 40))); c.restore()
    # course pill and mark
    fp = skia.Font(MONT, 40); fp.setEmbolden(True); wp = fp.measureText('AP STATISTICS')
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(540 - wp / 2 - 34, 96, 540 + wp / 2 + 34, 172), 38, 38), P((110, 36, 112)))
    c.drawString('AP STATISTICS', 540 - wp / 2, 149, fp, P((255, 255, 255)))
    fm = skia.Font(MONT, 38); fm.setEmbolden(True); c.drawString('LevlPrep', 1080 - fm.measureText('LevlPrep') - 48, 1560, fm, P((64, 226, 206)))
    s.makeImageSnapshot().save(out)
make('out/thumb.png', ('STAY OR', 'SWITCH?'), -0.8)
make('out/thumb_b.png', ('3 DOORS', '1 CAR'), 0.8)
