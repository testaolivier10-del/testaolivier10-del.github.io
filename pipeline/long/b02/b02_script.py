# audited, not voiced
# Audit log (2026-11-01 long video build; the 10-31 run left the item "building" with no draft, so it was restarted):
# WHY AUDIT (independent agent): added electrons in e1, covalent bond and polar defined (k1, k2), why energy can't cycle
#   (e4), organic vs CO2 wording, N-P-K and air nitrogen (c4), p2 reworded, amino acid defined before use, H plus,
#   phosphate charge, glucose tied to the plant's sugar and subscripts explained in p1q, enzyme shape fit, p7q wording.
# FACT CHECK (independent agent; OpenStax, LibreTexts, BioNumbers, csbsju van Helmont page): bean -> tomato (legumes fix
#   nitrogen), nitrogen shortage also cuts sugar making, C-14 a tiny trace, cheese is not cells, sulfur tracer wording,
#   digestion products, enzymes mostly proteins. RECHECK (second agent): soil loss "a few grams" not a pinch, phospholipids
#   not fats, DNA in almost every cell, bonds take centuries or longer, wood mostly the same sugar, grandma adds plant food
#   after the weighing. All practice answers confirmed.
# HUMAN READ (independent agent): rewrote hook, promise, why, e3, c3, k1, k3, f1, f3, f4, m2, y1, y2, b1, b5, rc.
# CUT for length: body mass percentages beat (c2), structure determines function beat (b6, teased in the outro), p6.
# PRONUNCIATION: sulfhydryl and cysteine respelled; levlprep respelled. RUNTIME: 11,431 chars, 42 beats, 36 s pauses,
#   8 cards -> about 14:50 estimated (check tl.py DUR after voicing).
"""Script for long video AP Bio 02: Elements of life and an intro to macromolecules (A&P 02 pilot format).
Source: levlprep.com/bio/notes/elements-of-life.html and macromolecules-intro.html (Unit 1, topics 1.2 and 1.3 intro).
Story (runs through the whole video): Jay plants one tomato seed in a pot of dried, weighed soil on his grandmother's
patio. Weeks later the plant is big but the soil weighs almost the same. Where did the plant come from? His grandma
feeds it plant food, he eats lunch with her, and at the end he breathes out next to the plant.
Each chapter: teaching, a story moment (story=True) where the idea happens, then a practice problem.
{n} marks a visual cue. 'pause' = seconds for pause and try beats. «spoken|shown» respellings.
"""
ID = "yt-apbio-02-elements-macromolecules"

CHAPTERS = [
 dict(id="intro", title="Start here", beats=[
  dict(key="hook", story=True, vo="{1}Eight weeks ago, Jay planted one tomato seed in a pot of dry soil, and he weighed the soil first. {2}Now the plant comes up past his knee. {3}He pulls it out, dries the soil again, and puts it back on the scale. {4}It's lost only a few grams, about half a teaspoon of salt. [curious] So where did all that plant come from?"),
  dict(key="promise", vo="By the end of this video you'll be able to answer that. {1}You'll also know the six elements almost every living thing is built from, {2}the four big families of molecules they make, {3}and the two reactions that build those molecules and take them apart."),
  dict(key="why", vo="[warmly] Your body is made of atoms, {1}and every one of them came from somewhere else. {2}Once you see how they snap together, the rest of this unit gets a lot easier."),
 ]),
 dict(id="atoms", title="Atoms come from somewhere", beats=[
  dict(key="e1", vo="An element is made of only one kind of atom, like carbon or oxygen. {1}What makes an atom carbon is its number of protons. Every carbon atom has six, {2}and around the nucleus it has six electrons. Atoms bond by sharing or trading those electrons. {3}But the number of neutrons can vary. Most carbon has six, a little has seven, and a tiny trace has eight. {4}Those are isotopes, named by protons plus neutrons: carbon twelve, thirteen, and fourteen."),
  dict(key="e2", vo="Some isotopes are unstable and give off radiation as they break down, like phosphorus thirty two. {1}Chemistry depends on electrons, and an isotope has the same electrons as the normal atom. {2}So a cell uses radioactive phosphorus just like normal phosphorus, {3}and scientists can follow where those atoms end up. That's called a tracer."),
  dict(key="e3", vo="Living things can't make atoms. {1}Every atom in that tomato plant was taken in from its surroundings. {2}In photosynthesis, a plant uses the energy in light to build sugar out of carbon dioxide and water, and it releases oxygen. {3}Then in cellular respiration, nearly every cell, the plant's own cells too, breaks that sugar down with oxygen. {4}That releases carbon dioxide and water, and the energy gets captured in a molecule called ATP."),
  dict(key="e4", vo="Atoms go around in a loop. {1}Energy doesn't. It comes in as light and is stored for a while in chemical bonds. {2}Every time it's used, some of it turns into heat, and no living thing can turn heat back into fuel. [serious] So matter cycles, and energy flows through."),
  dict(key="e5", story=True, vo="{1}Which solves Jay's puzzle. The plant wasn't built out of the soil. {2}Most of it was built out of carbon dioxide from the air, and water. {3}Those few grams the soil lost were minerals the roots pulled up."),
  dict(key="p1q", vo="Your turn. {1}Glucose, the sugar plants make, is C six H twelve O six. The small numbers count the atoms. {2}How many atoms are in one molecule, and where does a plant get the carbon and the hydrogen?", pause=5),
  dict(key="p1a", vo="Six carbon, twelve hydrogen, and six oxygen, so twenty four atoms. {1}The carbon comes from carbon dioxide in the air, {2}and the hydrogen comes from water."),
 ]),
 dict(id="chonps", title="The six elements of life", beats=[
  dict(key="c1", vo="About twenty five elements show up in living things, but six of them make up roughly ninety eight percent of a cell's mass. {1}Carbon, hydrogen, oxygen, nitrogen, phosphorus, and sulfur. {2}A lot of students remember them as «chonps|CHONPS»."),
  dict(key="c3", vo="Each one has a job. {1}Carbon is the skeleton of every carbon based molecule in you. {2}Hydrogen and oxygen show up in nearly all of them, and in water. {3}You need nitrogen for every protein and for DNA. {4}Phosphorus goes into DNA, ATP, and the phospholipids in cell membranes. {5}And sulfur sits in a couple of protein building blocks, so a lot of proteins carry it."),
  dict(key="c4", story=True, vo="{1}Jay and his grandma plant the tomato out in her garden, and she tips in a scoop of plant food. {2}The label says N, P, K. That's nitrogen, phosphorus, and potassium. {3}Air is mostly nitrogen gas, but a tomato can't use that form, so it needs nitrogen from the soil. [laughs softly] So the soil did matter after all, just not for the bulk of the plant."),
  dict(key="p2q", vo="Your turn. {1}Say the tomato gets plenty of light, air, and water, but its soil has almost no nitrogen. {2}Does sugar itself contain nitrogen? Does protein? {3}So which one is the plant going to struggle to build?", pause=5),
  dict(key="p2a", vo="Sugar has no nitrogen, but every protein does, so proteins are the problem. {1}And the plant's photosynthesis runs on proteins and on chlorophyll, which also needs nitrogen. {2}So the leaves turn yellow, it makes less sugar too, and it can't grow normally."),
 ]),
 dict(id="carbon", title="Carbon, the backbone", beats=[
  dict(key="k1", vo="Organic molecules are built on a skeleton of carbon, usually bonded to hydrogen. {1}Water, salts, and small carbon compounds like carbon dioxide count as inorganic. {2}Carbon is special because each carbon atom makes four covalent bonds, and a covalent bond is two atoms sharing a pair of electrons. {3}So carbons can link up into long chains, {4}branched chains, {5}and rings, {6}and two carbons can share two pairs, which is a double bond. That framework is the carbon skeleton."),
  dict(key="k2", vo="A molecule of only carbon and hydrogen is a hydrocarbon, like the wax in a candle. {1}When two atoms share electrons unevenly, the bond is polar, with one slightly negative end and one slightly positive end. {2}Water is polar, and it clings to other water molecules and to many polar molecules through hydrogen bonds. {3}But carbon and hydrogen share almost evenly, so hydrocarbons are nonpolar, and they don't mix with water."),
  dict(key="k3", vo="The same atoms can also be put together in different ways. {1}Glucose and fructose are both C six H twelve O six, {2}but their atoms are bonded in a different order, so they have different shapes, {3}and fructose tastes sweeter. {4}Same formula, different structure. Those are isomers."),
  dict(key="p3q", vo="Your turn. {1}Two molecules both have the formula C two H six O. {2}One is ethanol, the alcohol in drinks, and the other is a gas used in spray cans. {3}How can they be different molecules, and what's the word for them?", pause=5),
  dict(key="p3a", vo="They're isomers. {1}Same atoms, same formula, but bonded in a different arrangement, {2}so they behave differently."),
 ]),
 dict(id="groups", title="Functional groups", beats=[
  dict(key="f1", vo="A bare carbon skeleton is just a hydrocarbon. {1}What makes molecules behave differently is the small clusters of atoms stuck onto it. {2}Those are functional groups, and each one behaves about the same no matter which molecule it's on."),
  dict(key="f2", vo="Hydroxyl is O H. It's polar, so it hydrogen bonds with water and helps a molecule dissolve. {1}Carbonyl, a carbon double bonded to an oxygen, is polar too. {2}You'll find both of them all over sugars."),
  dict(key="f3", vo="Next, carboxyl, C O O H. It's an acid, because it gives off a hydrogen ion, H plus. {1}Amino, N H two, does the opposite. It's a base, because it picks one up. {2}Every amino acid, the building blocks of proteins, has both. {3}And phosphate has given off its hydrogen ions, so it's negatively charged. You'll find it in DNA and ATP."),
  dict(key="f4", vo="Two «sul fie drils|sulfhydryls», S H, can bond to each other {1}and link two parts of a protein together. {2}And methyl, C H three, is nonpolar. {3}Stick one on DNA, and it can change how a gene is read."),
  dict(key="p4q", vo="Your turn. {1}The amino acid «sis teen|cysteine» is drawn here. {2}Name its three functional groups, and tell me which elements a cell needs to make it.", pause=6),
  dict(key="p4a", vo="It has a «sul fie dril|sulfhydryl» group, S H, {1}an amino group, N H two, {2}and a carboxyl group, C O O H. {3}So a cell needs carbon, hydrogen, oxygen, nitrogen, and sulfur. [serious] Without sulfur, it can't make «sis teen|cysteine», or any protein that has it."),
 ]),
 dict(id="families", title="Four families of molecules", beats=[
  dict(key="m0", story=True, vo="{1}Jay's grandma calls him in for lunch. {2}Bread, a bit of butter, cheese, and sliced tomatoes from the garden."),
  dict(key="m1", vo="Most molecules in a cell belong to four families, and his lunch has all four. {1}Carbohydrates are sugars and the bigger molecules built from them, like the starch in bread. They're made of carbon, hydrogen, and oxygen. {2}Lipids are fats and oils, like butter. They're mostly carbon and hydrogen bonds, like candle wax, so they don't mix with water. The main lipids in membranes, phospholipids, also carry phosphorus."),
  dict(key="m2", vo="Proteins, like the ones in cheese, are chains of amino acids. {1}Every amino acid has carbon, hydrogen, oxygen, and nitrogen, and a few have sulfur. {2}Nucleic acids, like DNA, store the information in genes, and they use those same four plus phosphorus. {3}The wheat, the tomato, and the cow all had DNA in almost every cell."),
  dict(key="p5q", vo="Your turn. {1}Scientists feed cells sulfur thirty five, a radioactive tracer. {2}Which family of molecules does most of the radioactive sulfur show up in?", pause=5),
  dict(key="p5a", vo="Proteins. {1}Sulfur is in a couple of the amino acids, {2}and DNA, simple sugars, and fats don't have any."),
 ]),
 dict(id="build", title="Building big molecules", beats=[
  dict(key="y1", vo="Most of these big molecules, the macromolecules, are polymers. {1}Poly means many parts. {2}A polymer is a long chain of small, similar units called monomers, mono meaning one, linked by covalent bonds. {3}Think of a bead necklace. The beads are monomers, and each bit of string is a bond."),
  dict(key="y2", vo="A polymer can be one kind of bead repeated over and over, {1}or lots of kinds in a particular order, where the order spells out a message. Biology uses both. {2}Carbohydrates, proteins, and nucleic acids are all polymers. {3}[serious] But lipids are the exception. They aren't chains of repeating monomers, so they're not true polymers."),
  dict(key="b1", vo="So how do you join two beads? {1}One monomer gives up an O H from its end, {2}the other gives up an H, {3}and those combine into a water molecule that's released. {4}The two monomers are now joined by a new covalent bond. {5}Water out, something built. That's why it's called dehydration synthesis."),
  dict(key="b2", vo="Repeat it, and you get a polymer. {1}Every new bond releases one water. {2}So in a straight chain, n monomers release n minus one waters."),
  dict(key="b3", vo="Breaking a polymer is the same reaction run backwards. {1}A water molecule gets split across the bond. {2}Its H goes to one monomer and its O H to the other, {3}and the bond breaks. That's hydrolysis, which means splitting with water."),
  dict(key="b4", story=True, vo="{1}And that's what's happening to Jay's lunch right now. Digestion is mostly hydrolysis. {2}Starch and proteins get cut into sugars and amino acids, small enough to get into his blood. {3}Then his cells use dehydration synthesis to build his own polymers out of those same pieces. {4}[warmly] The bread becomes part of Jay."),
  dict(key="b5", vo="Without help, those bonds can take centuries or longer to break. {1}So cells use enzymes, which are mostly proteins, to make reactions go much faster. {2}Each enzyme's shape fits only its own target. The enzyme in your saliva that cuts starch does nothing to proteins."),
  dict(key="p7q", vo="Your turn. {1}A cell links ten sugar monomers into one straight chain. {2}How many water molecules are released? {3}And when that chain gets hydrolyzed again, do the ten monomers together weigh more or less than the chain did?", pause=6),
  dict(key="p7a", vo="Nine waters, one for each bond. {1}And the monomers weigh MORE. {2}Hydrolysis adds the atoms of one water back in for every bond it breaks. [exhales] A lot of people say less, because they think breaking something makes it lighter."),
 ]),
 dict(id="recap", title="Recap", beats=[
  dict(key="rc", vo="Here it all is in one picture. {1}Living things can't make atoms. Matter cycles through photosynthesis and respiration, and energy flows through. {2}Six elements, C H O N P S, make up almost all of a cell. {3}Carbon builds the skeletons, and functional groups give molecules their behavior. {4}Those molecules come in four families, {5}and three of them are polymers, built by dehydration synthesis and taken apart by hydrolysis."),
 ]),
 dict(id="outro", title="Next: carbohydrates", beats=[
  dict(key="end", story=True, vo="{1}Back on the patio, Jay leans in to look at his tomato plant, and he breathes out. {2}Some of the carbon in that breath was in his lunch an hour ago. {3}[warmly] And some of it could end up back in a leaf. {4}The notes and practice for this topic are free on «levl prep dot com|levlprep.com». {5}Next time, we'll look at the first family up close, carbohydrates, and why you can eat starch but not wood, even though wood is mostly built from the same sugar."),
 ]),
]

import re
_CAPS_KEEP = {'CHONPS', 'ATP', 'DNA'}
_MARK = re.compile(r"«([^|»]*)\|([^»]*)»")


def clean(vo):
    return re.sub(r"\s+", " ", re.sub(r"\{\d+\}", "", _MARK.sub(r"\1", vo))).strip()


def _shown(src):
    d = _MARK.sub(r"\2", re.sub(r"\[[^\]]+\]\s*", "", re.sub(r"\{\d+\}", "", src)))
    d = re.sub(r"\b[A-Z]{2,}\b", lambda m: m.group(0) if m.group(0) in _CAPS_KEEP else m.group(0).lower(), d)
    return re.sub(r"\s+", " ", d).strip()


for _ch in CHAPTERS:
    for _b in _ch["beats"]:
        _b.setdefault("src", _b["vo"])
        _b["disp"] = _shown(_b["src"])
        _b["vo"] = _MARK.sub(r"\1", _b["src"])

if __name__ == "__main__":
    tot = 0; pz = 0; nb = 0
    for ch in CHAPTERS:
        n = sum(len(clean(b["vo"])) + 1 for b in ch["beats"])
        pz += sum(b.get("pause", 0) for b in ch["beats"]); nb += len(ch["beats"])
        tot += n; print(f'{ch["id"]:12s} {n:5d}')
    print("total", tot, "chars", nb, "beats", pz, "s pauses")
