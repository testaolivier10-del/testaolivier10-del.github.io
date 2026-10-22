"""Cut one AI painted character into movable layers (2026-10-21, studio system section 2).

Inputs (all the same size, from the same painting):
  base.png             the approved painted character on a flat light background
  masks {name: png}    edits where ONE part was recoloured flat magenta (#FF00FF): its pixels are that part's mask
  fills {name: png}    edits where parts were removed and the hidden areas painted in (e.g. the torso behind the arm)
Layer recipe: list of dict(id, src: 'base' or a fill name, mask: a mask name, or 'rest' = whatever is left of the
figure minus the listed masks, z, bones=[...]); each layer = src pixels inside its mask (grown a few px so joints
overlap), on transparency. Output: PNGs + a paint part list for skin.build_paint, positioned in rig space with
the mapping (x0, y0, s): rig = image / s + (x0, y0).
"""
import json, os
import numpy as np
import cv2
from PIL import Image


def load(p): return np.array(Image.open(p).convert("RGB")).astype(np.int16)


def figure_alpha(rgb, bg=None, tol=22):
    """Alpha of the figure against the flat light background (sampled from the corners)."""
    if bg is None:
        c = np.concatenate([rgb[:12, :12].reshape(-1, 3), rgb[:12, -12:].reshape(-1, 3), rgb[-12:, :12].reshape(-1, 3), rgb[-12:, -12:].reshape(-1, 3)])
        bg = np.median(c, 0)
    d = np.abs(rgb - bg).max(2)
    a = np.clip((d - tol * 0.5) / tol, 0, 1)
    a = cv2.morphologyEx((a > 0.5).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(a)
    if n > 1:                                             # keep the big blobs only (drop specks)
        keep = np.zeros(n, bool); keep[1:] = st[1:, cv2.CC_STAT_AREA] > 400
        a = keep[lab].astype(np.uint8)
    soft = cv2.GaussianBlur(a.astype(np.float32), (0, 0), 0.8)
    return soft


def magenta_mask(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = (r > 170) & (b > 150) & (g < 110) & (np.abs(r - b) < 90)
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        keep = np.zeros(n, bool); keep[1:] = st[1:, cv2.CC_STAT_AREA] > 300
        m = keep[lab].astype(np.uint8)
    return m


def build(base, masks, fills, recipe, out_dir, mapping, grow=4):
    os.makedirs(out_dir, exist_ok=True)
    B = load(base); A = figure_alpha(B)
    M = {k: magenta_mask(load(v)) for k, v in masks.items()}
    F = {k: load(v) for k, v in fills.items()}
    FA = {k: figure_alpha(v) for k, v in F.items()}
    parts = []
    for L in recipe:
        src = B if L["src"] == "base" else F[L["src"]]
        alpha = A if L["src"] == "base" else FA[L["src"]]
        if L["mask"] == "rest":
            m = np.ones(alpha.shape, np.uint8)
            for k in L.get("minus", []): m &= (1 - M[k])
        else:
            m = M[L["mask"]].copy()
        if grow: m = cv2.dilate(m, np.ones((grow * 2 + 1, grow * 2 + 1), np.uint8))
        a = alpha * m
        a = cv2.GaussianBlur(a.astype(np.float32), (0, 0), 0.6)
        ys, xs = np.nonzero(a > 0.02)
        if len(xs) == 0: print("empty layer", L["id"]); continue
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        rgba = np.dstack([src[y0:y1, x0:x1].clip(0, 255).astype(np.uint8), (a[y0:y1, x0:x1] * 255).astype(np.uint8)])
        p = f"{out_dir}/{L['id']}.png"; Image.fromarray(rgba).save(p)
        s = mapping["s"]
        # store the layer at image scale; place it in rig space
        parts.append(dict(id=L["id"], img=p, x=x0 / s + mapping["x0"], y=y0 / s + mapping["y0"], scale=1 / s, bones=L["bones"], z=L["z"]))
    json.dump(parts, open(f"{out_dir}/parts.json", "w"), indent=1)
    return parts
