"""Plate geometry: Gemini plates are 1026x573 screenshots; trim 13 px, scale to 1080 high, centre crop 1920 wide."""
import numpy as np, cv2
from PIL import Image
ART = '/home/claude/lp/art/n35/'
TRIM = 13
SC = 1080 / (573 - 27)


def X(x):
    return (x - TRIM) * SC - ((1026 - 26) * SC - 1920) / 2


def Y(y):
    return (y - TRIM) * SC


def P(x, y):
    return (X(x), Y(y))


def plate(name, sharpen=True):
    a = np.array(Image.open(ART + name).convert('RGBA' if name.startswith('l_') else 'RGB'))
    a = a[TRIM:573 - 14, TRIM:1026 - TRIM]
    b = cv2.resize(a, (int(round(a.shape[1] * SC)), 1080), interpolation=cv2.INTER_LANCZOS4)
    if sharpen:
        b = cv2.addWeighted(b, 1.3, cv2.GaussianBlur(b, (0, 0), 1.2), -0.3, 0)
    x0 = (b.shape[1] - 1920) // 2
    return np.ascontiguousarray(b[:, x0:x0 + 1920])
