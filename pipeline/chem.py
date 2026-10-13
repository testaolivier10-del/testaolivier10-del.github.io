"""Accurate molecules for LevlPrep chem videos (ochem, AP Chem, AP Bio), free and offline.

    import chem
    svg = chem.mol2d("CC(=O)O", out, prefix="ace", x=200, y=120, w=680, h=500, highlight=[1, 2])
        -> <g> with the RDKit drawing (correct bonds, angles, charges, stereo wedges) in the LevlPrep
           palette. Atoms have class ace_atom-<i>, bonds ace_bond-<i>, so GSAP can pop atoms or draw bonds
           in the order the narration mentions them. Use chem.atoms("CC(=O)O") to see atom indices.
    html = chem.mol3d("CC(=O)O", out, prefix="ace3", x=140, y=100, w=800, h=700, start=4.0, turns=1.0, dur=6.0)
        -> a 3Dmol.js ball and stick view (real 3D coordinates from RDKit) that render.js rotates frame by
           frame: it is seeked on every frame, so stills, thumbnails and renders are exact. Put it in the
           stage markup OUTSIDE the <svg> (it is an HTML div). Show and hide it with c.fade_in / c.fade_out on
           "#<prefix>".
    chem.reaction("CCBr.[OH-]>>CCO.[Br-]", out, ...) -> 2D reaction scheme group, same palette.
"""
import os, shutil, json
from rdkit import Chem
from rdkit.Chem import AllChem, rdDepictor
from rdkit.Chem.Draw import rdMolDraw2D

PAL = {-1: (0.92, 0.95, 1.0), 6: (0.92, 0.95, 1.0), 8: (1.0, 0.42, 0.42), 7: (0.42, 0.62, 1.0), 9: (0.25, 0.88, 0.48), 17: (0.25, 0.88, 0.48),
       35: (0.85, 0.45, 0.25), 53: (0.61, 0.48, 1.0), 16: (1.0, 0.82, 0.25), 15: (1.0, 0.6, 0.2), 1: (0.66, 0.73, 0.85)}
HL = (1.0, 0.82, 0.25, 0.4)


def atoms(smiles):
    m = Chem.MolFromSmiles(smiles)
    return [(a.GetIdx(), a.GetSymbol()) for a in m.GetAtoms()]


def _opts(d, bond_px):
    o = d.drawOptions()
    o.clearBackground = False
    o.bondLineWidth = bond_px
    o.minFontSize = 30
    o.maxFontSize = 56
    o.scalingFactor = 120
    o.annotationFontScale = 0.8
    o.setAtomPalette(PAL)
    o.setHighlightColour(HL)
    o.highlightRadius = 0.32
    o.padding = 0.08


def _wrap(svg, prefix, x, y, w=None, h=None):
    import re
    body = svg.split("?>", 1)[-1]
    m = re.search(r"width='([\d.]+)px' height='([\d.]+)px'", body)
    k, dx, dy = 1, 0, 0
    if w and h and m:
        cw, ch = float(m.group(1)), float(m.group(2))
        k = min(w / cw, h / ch, 1.6); dx = (w - cw * k) / 2; dy = (h - ch * k) / 2
    body = body[body.index(">", body.index("<svg")) + 1: body.rindex("</svg>")]
    body = body.replace("class='atom-", f"class='{prefix}_atom-").replace("class='bond-", f"class='{prefix}_bond-")
    body = body.replace("<rect style='opacity:1.0;fill:#FFFFFF", "<rect style='opacity:0;fill:#FFFFFF")
    return f'<g id="{prefix}" transform="translate({x + dx:.1f},{y + dy:.1f}) scale({k:.4f})">{body}</g>'


def mol2d(smiles, out, prefix, x=0, y=0, w=600, h=450, highlight=None, bond_px=4, hs=False):
    m = Chem.MolFromSmiles(smiles)
    if hs:
        m = Chem.AddHs(m)
    rdDepictor.SetPreferCoordGen(True); rdDepictor.Compute2DCoords(m)
    d = rdMolDraw2D.MolDraw2DSVG(-1, -1)
    _opts(d, bond_px)
    hl = highlight or []
    d.DrawMolecule(m, highlightAtoms=hl, highlightBonds=[b.GetIdx() for b in m.GetBonds() if b.GetBeginAtomIdx() in hl and b.GetEndAtomIdx() in hl])
    d.FinishDrawing()
    return _wrap(d.GetDrawingText(), prefix, x, y, w, h)


def reaction(rxn_smarts, out, prefix, x=0, y=0, w=900, h=360, bond_px=4):
    from rdkit.Chem import rdChemReactions
    r = rdChemReactions.ReactionFromSmarts(rxn_smarts, useSmiles=True)
    d = rdMolDraw2D.MolDraw2DSVG(w, h)
    _opts(d, bond_px)
    d.DrawReaction(r)
    d.FinishDrawing()
    return _wrap(d.GetDrawingText(), prefix, x, y, w, h)


def mol3d(smiles, out, prefix, x=0, y=0, w=700, h=700, start=0.0, turns=1.0, dur=6.0, style="ballstick", spin_axis="y", zoom=2.0):
    os.makedirs(out, exist_ok=True)
    src = "/home/claude/lp/node_modules/3dmol/build/3Dmol-min.js"
    if not os.path.exists(f"{out}/3Dmol-min.js"):
        shutil.copy(src, out)
    m = Chem.AddHs(Chem.MolFromSmiles(smiles))
    AllChem.EmbedMolecule(m, randomSeed=7); AllChem.MMFFOptimizeMolecule(m)
    sdf = Chem.MolToMolBlock(m)
    st = {"ballstick": "{stick:{radius:0.16,colorscheme:'Jmol'},sphere:{scale:0.28,colorscheme:'Jmol'}}",
          "space": "{sphere:{colorscheme:'Jmol'}}"}[style]
    cfg = json.dumps(dict(start=start, turns=turns, dur=dur, axis=spin_axis, zoom=zoom))
    return f'''<div id="{prefix}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;opacity:0"></div>
<script src="3Dmol-min.js"></script>
<script>(function(){{
  const el=document.getElementById("{prefix}"), cfg={cfg};
  const v=$3Dmol.createViewer(el,{{backgroundAlpha:0,antialias:true}});
  v.addModel({json.dumps(sdf)},"sdf"); v.setStyle({{}},{st}); v.zoomTo(); v.zoom(cfg.zoom); v.render();
  const base=v.getView(); let last=null;
  const prev=window.__onSeek;
  window.__onSeek=async function(t){{
    if(prev) await prev(t);
    const p=Math.max(0,Math.min(1,(t-cfg.start)/cfg.dur));
    const ang=p*360*cfg.turns; if(ang===last) return; last=ang;
    v.setView(base); v.rotate(ang,cfg.axis); v.render();
  }};
}})();</script>'''
