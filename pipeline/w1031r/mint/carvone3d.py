"""(R)-carvone 3D coordinates from RDKit (ETKDG + MMFF), heavy atoms plus the H on the stereocentre.
CIP checked with rdCIPLabeler: CC1=CC[C@H](CC1=O)C(C)=C is (R) (spearmint); its mirror image (x -> -x) is (S) (caraway)."""
import json
from rdkit import Chem
from rdkit.Chem import AllChem, rdCIPLabeler
import numpy as np
smi = 'CC1=CC[C@H](CC1=O)C(C)=C'
m = Chem.AddHs(Chem.MolFromSmiles(smi))
AllChem.EmbedMolecule(m, randomSeed=11); AllChem.MMFFOptimizeMolecule(m)
rdCIPLabeler.AssignCIPLabels(m)
st = [a.GetIdx() for a in m.GetAtoms() if a.HasProp('_CIPCode')][0]
assert m.GetAtomWithIdx(st).GetProp('_CIPCode') == 'R'
keep = [a.GetIdx() for a in m.GetAtoms() if a.GetSymbol() != 'H' or a.GetNeighbors()[0].GetIdx() == st]
X = m.GetConformer().GetPositions()[keep]
X -= X.mean(0)
# orient: ring plane faces the viewer (principal axes), so the ring reads as a hexagon
ring = [i for i, k in enumerate(keep) if m.GetAtomWithIdx(k).IsInRing()]
u, s, vt = np.linalg.svd(X[ring] - X[ring].mean(0))
R = vt.copy()
if np.linalg.det(R) < 0: R[2] *= -1          # proper rotation only (never a reflection)
X = X @ R.T
idx = {k: i for i, k in enumerate(keep)}
atoms = [dict(e=m.GetAtomWithIdx(k).GetSymbol(), p=[round(float(v), 4) for v in X[i]], st=(k == st)) for i, k in enumerate(keep)]
bonds = [dict(a=idx[b.GetBeginAtomIdx()], b=idx[b.GetEndAtomIdx()], o=int(b.GetBondTypeAsDouble())) for b in m.GetBonds()
         if b.GetBeginAtomIdx() in idx and b.GetEndAtomIdx() in idx]
json.dump(dict(smiles=smi, cip='R', atoms=atoms, bonds=bonds), open('carvone_R.json', 'w'), indent=1)
# check the chirality survived: signed volume at the stereocentre
c = idx[st]; nb = [idx[n.GetIdx()] for n in m.GetAtomWithIdx(st).GetNeighbors()]
print(len(atoms), 'atoms', len(bonds), 'bonds; signed vol', np.linalg.det(np.array([X[n] - X[c] for n in nb[:3]])))
