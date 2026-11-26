# audited, voiced 2026-11-26
# Audit log (2026-11-25 long video build; Downloads folder not attached, so script only: spec steps 2 to 5):
# SPLIT: the coverage map entry was split (see the docstring); this is part 1.
# WHY AUDIT (independent agent, 22 items): fixed "a carbon in a double bond is sp2" against CO2 (d4 says one double
#   bond, e3 says two pi bonds need two leftover p); shape vs direction of groups (why, e5, rc); why a multiple bond is
#   one group and why each group needs a hybrid (e1, e2); why the second bond cannot be head on (d3); where graphite's
#   leftover p orbitals go and why sheets hold weakly (d5); the end no longer claims orbital mixing explains the flame;
#   double bond defined (d3); wedge and dash spoken (c2); tetrahedron vs ammonia's pyramid worded apart (c6, e5);
#   "almost any atom" (promise); forward pointer in d1; other atoms hybridize too (e4); Ines's trade and "mark it and
#   cut it out" (hook). VISUALS MUST: label p orbital colours only if spoken (leave them one colour or say phase), show
#   an oxygen tank beside the acetylene tank, never show 109.5 on ammonia or water (real angles 107.3 and 104.5),
#   show the two C-H hybrids on each ethene carbon, no x y z axis labels, no unexplained formula on screen before d3.
# FACT CHECK (independent agent; OpenStax Organic Chemistry 1.6, 1.8, 1.9, OpenStax Chemistry 2e 8.2 and 10.5,
#   Chemguide, Britannica): 27 claims, practice answers matched. Fixed: pencil is "mostly graphite" (clay); promotion
#   wording now "the two extra bonds give back far more energy than the move cost"; one double bond vs two; pencil mark
#   is "thin flakes rub off"; oxy fuel cutting is the flame heating the steel until an oxygen jet burns through it.
# HUMAN READ (independent agent): mishearing fixes ("plain S P, with no number", "a pair of groups", "also S P three",
#   the spoken configuration replaced by plain words, "pi bond uses up one unmixed p orbital", "ethene, also called
#   ethylene"), slide style lines rewritten (e1, e2, rc, d3, why), repeated openers varied, lost referents fixed.
# RECHECK of the 13 reworded lines by the same fact checker: all confirmed (wedge and dash, the tetrahedron's faces and
#   the p overlap inside a graphite sheet from standard knowledge, the rest from the sources above).
# SHIP GATE 1 (full fluid sentences; spaCy en_core_web_sm, root a verb or auxiliary with a subject; practice prompts
#   may be imperatives): 0 flags on the final text (gate1.py).
# PRONUNCIATION: sp3, sp2, sp spoken as letters; levlprep respelled; numbers in words. To check on first voicing:
#   "ethene", "ethylene", "acetylene", "sigma", "pi", "tetrahedron", "Ines" (ee NESS).
# RUNTIME: see the count printed by this file; yt-stats-01 ran 17:31 from about 11,560 characters at natural tempo.
"""Script for long video orgo 03: hybridization (carbon's two bond problem, promotion, sp3, sp2 and sp hybrids,
leftover p orbitals, sigma and pi bonds, counting electron groups, lone pairs, hybridization vs shape).
Source: levlprep.com/ochem/notes/hybridization.html, first half. Builds on orgo 02 (orbitals), which ended on "next:
hybridization, 2 unpaired to 4 identical bonds". SPLIT 2026-11-25: the full page ran to about 13,800 spoken
characters (about 21 minutes at the 2026-11-24 pacing), so the coverage map entry was split. Part 2
(yt-orgo-03b-hybridization-s-character) takes charged carbons, the radical, the lone pair beside a pi bond
exception, whole molecule examples, s character (bond length, electronegativity, the acidity preview) and
more than four groups; drafted beats for it are kept at the end of this file's audit log.
Pilot format, premium standard, 2026-11-05 rules, SHORTS PARITY (2026-11-17), ship gates (2026-11-18),
pacing rules (2026-11-24: natural tempo, aim for 15:00, over is fine).
Story (runs through the whole video): Ines, a metal sculptor of about thirty, has one night to finish a steel heron
that the town unveils in its square in the morning. She sketches it in pencil on paper (graphite, sp2), scratches the
outline into the steel plate with a diamond tipped scribe (diamond, sp3), and cuts it out with an oxyacetylene
torch (acetylene, sp). The puzzle: pencil graphite and diamond are both pure carbon. At sunrise she pulls the cover
off the finished heron.
Staging (nobody turns on screen; people are the front view Shorts model): Ines stands behind her workbench facing
the camera for the whole night; the paper lies on the bench in front of her, the steel plate leans on an easel
stand to her right (screen right) so she reaches across her body without turning, and the torch cart is parked at
screen right from the first shot. Hands: three grips only, each built and checked on its own to ship gate 3
before any scene (pencil in a writing grip, scribe held like a pencil, torch handle in a fist with the other hand
on the hose valve). Close face shots of Ines at the hook question, when the flame lights (dark goggles down, so
the reflection shows in the lenses), and at the unveiling. In the square she stands at screen left of the covered
heron facing the camera and pulls the cloth toward herself.
Each chapter: teaching, a story moment (story=True) where the idea happens, then a practice problem.
{n} marks a visual cue. 'pause' = seconds for pause and try beats. «spoken|shown» respellings. energy = delivery note.
"""
ID = "yt-orgo-03-hybridization"

CHAPTERS = [
 dict(id="intro", title="Start here", beats=[
  dict(key="hook", story=True, energy="curious", vo="{1}Ines is a sculptor, and tonight she's sketching a heron in pencil, so the tip leaves a soft gray line on the paper. {2}Then she picks up a scribe with a tiny diamond at its tip, and she scratches that same outline into a plate of hard steel. [softly] She has one night to mark this heron and cut it out, because the town unveils it in the morning. {3}The gray in her pencil is mostly graphite, and graphite is pure carbon. Her diamond is pure carbon too. {4}[curious] So how can the same atom be soft enough to rub off on paper... and hard enough to scratch steel?"),
  dict(key="promise", energy="warm", vo="By the end of this video, you'll look at almost any atom in a molecule and name its hybridization in a few seconds. {1}Along the way, you'll see why carbon makes four bonds, {2}where double and triple bonds come from, {3}and what makes Ines's pencil and her diamond so different."),
  dict(key="why", energy="steady", vo="[curious] So why does one little label deserve this much attention? {1}Tell me an atom's hybridization, and I can tell you which way its bonds point and the angles between them. {2}I can also tell you whether that atom can make a double bond or a triple bond. {3}[warmly] You'll lean on hybridization in almost every chapter of organic chemistry from here on."),
 ]),
 dict(id="sp3", title="Why carbon makes four bonds", beats=[
  dict(key="c1", energy="steady", vo="We ended the last video with a problem. {1}Carbon's outer shell holds four electrons. {2}One pair fills the two s orbital, and the other two electrons sit unpaired in p orbitals. {3}An unpaired electron is what an atom uses to make a bond, so carbon should make just TWO bonds."),
  dict(key="c2", energy="curious", vo="But then you look at methane, which is one carbon holding four hydrogens. {1}It has four bonds, and all four are identical. In this drawing, the solid wedge is a bond coming toward you, and the striped one is a bond going away. {2}Every pair of those bonds meets at the same angle, which is one hundred nine point five degrees. {3}[curious] So where did the two extra bonds come from, and why do all four match?"),
  dict(key="c3", energy="steady", vo="The answer comes in two steps, and the first step is called promotion. {1}An electron leaves the full two s orbital and moves up into the empty p orbital. {2}Now carbon has four unpaired electrons, with one in each of its four outer orbitals. {3}That move costs energy, but the two extra bonds give back far more energy than the move cost, so it's worth it every time carbon bonds."),
  dict(key="c4", energy="thoughtful", vo="There's still a problem, though, because those four orbitals aren't alike. {1}One is a round s orbital, and three are p orbitals shaped like dumbbells, set at right angles to each other. {2}If carbon bonded with them just as they are, three bonds would sit ninety degrees apart, and the fourth would be different from the rest. {3}Methane doesn't look like that at all."),
  dict(key="c5", energy="steady", vo="So this is the second step, and you can think of it like mixing paint. {1}[warmly] If you pour one can of red and three cans of white into a tub and stir, you can fill four cans again, and now every can holds the same pink. {2}Carbon does that with its orbitals. It mixes the one s orbital and the three p orbitals into four new orbitals that are all identical. {3}We call them hybrid orbitals, and this kind is named «S P three|sp³», because it's made from one s and three p."),
  dict(key="c6", energy="steady", vo="Four orbitals went in, and four came out. Mixing changes their shape, but it never changes how many there are. {1}Each hybrid has one big lobe, and since every lobe holds electrons and electrons repel each other, the four lobes push as far apart as they can. {2}That points them at the four corners of a tetrahedron, a shape with four corners and four triangle faces. {3}And the angle between any two of them is... one hundred nine point five degrees, which is EXACTLY what methane shows."),
  dict(key="c7", story=True, energy="warm", vo="{1}Now we can look inside the diamond on Ines's scribe. Every carbon atom in it is «S P three|sp³». {2}Each carbon uses its four hybrids to bond to four more carbons, and each of those carbons bonds to four more. {3}The pattern runs on in every direction with strong bonds all the way through, so there's no weak layer anywhere that could slip. {4}[serious] That's why the diamond tip bites into the steel, and the steel can't scratch it back."),
  dict(key="p1q", energy="curious", vo="[curious] Now it's your turn. {1}Suppose an atom mixes its s orbital with only TWO of its three p orbitals. {2}How many hybrid orbitals does it get? And how many p orbitals are left over, unmixed?", pause=6),
  dict(key="p1a", energy="warm", vo="One s plus two p gives three orbitals going in, so three hybrids come out. {1}The atom started with three p orbitals and it used two, so one p orbital is left over. {2}[thoughtful] The trap is thinking that mixing uses orbitals up, when the number going in always equals the number coming out. {3}And that leftover p orbital is about to matter a lot."),
 ]),
 dict(id="sp2", title="sp², sp and the leftover p orbitals", beats=[
  dict(key="d1", energy="steady", vo="An atom doesn't have to mix all three of its p orbitals, and you'll see in a minute why it would hold one back. {1}When it mixes the s with two of them, it gets three hybrids, and they're called «S P two|sp²». {2}Those three lobes spread out FLAT, one hundred twenty degrees apart, like the blades of a ceiling fan. {3}The one leftover p orbital stands straight up through that flat plane, with one lobe above it and one below."),
  dict(key="d2", energy="steady", vo="An atom can also mix the s with just one p orbital. {1}Then it gets only a pair of hybrids, and they're called plain «S P|sp», with no number. Those lobes get as far apart as they can by pointing in opposite directions, so the angle is one hundred eighty degrees, a straight line. {2}This time TWO p orbitals are left over. They stand at right angles to that line, and at right angles to each other."),
  dict(key="d3", energy="curious", vo="So what are the leftover p orbitals for? {1}We can see their job in ethene, also called ethylene. It's two carbons joined by a double bond, meaning they share two pairs of electrons, and each carbon also holds two hydrogens. Both carbons are «S P two|sp²». {2}Each carbon points one hybrid straight at the other carbon and its other two hybrids at its hydrogens. Where two orbitals overlap head on like that, chemists call it a sigma bond, and every single bond you've drawn is one. {3}[thoughtful] The spot between the two carbons is now taken, so the second bond has to form somewhere else. Each carbon still has its leftover p orbital, and those two p orbitals stand side by side. They overlap sideways, above and below the plane, and that sideways overlap is called a pi bond."),
  dict(key="d4", energy="steady", vo="So a double bond is one sigma bond plus one pi bond. {1}A triple bond is one sigma bond plus TWO pi bonds, and every pi bond uses up one unmixed p orbital on each atom. {2}You can read that rule backwards, too. A carbon with one double bond has to keep one p orbital out of the mix, so it's «S P two|sp²»... and a carbon with a triple bond has to keep two of them out, so it's plain «S P|sp»."),
  dict(key="d5", story=True, energy="warm", vo="{1}This is the secret of Ines's pencil. In graphite, every carbon is «S P two|sp²». {2}Each carbon is bonded to three neighbors in a flat sheet of hexagons, a lot like chicken wire, and the leftover p orbitals overlap sideways across that same sheet. {3}[thoughtful] All the strong bonding stays inside a sheet, so when the sheets stack up, only weak attractions hold one sheet to the next. {4}[softly] When she drags the tip across the paper, thin flakes rub off and stay behind... and those flakes are her gray line."),
  dict(key="p2q", energy="curious", vo="This one's for you to try. {1}A carbon atom is part of a triple bond. {2}What is its hybridization? How many leftover p orbitals does it have? And what angle do its bonds make?", pause=6),
  dict(key="p2a", energy="warm", vo="[warmly] A triple bond has two pi bonds, and each pi bond uses up one unmixed p orbital, so this carbon has two left over. {1}That leaves the s and one p to mix, so the carbon is plain «S P|sp». {2}Its two hybrids point in opposite directions, so the angle is one hundred eighty degrees. {3}[thoughtful] Most people slip by seeing the word triple and writing a three after the «S P|sp». That little number counts the p orbitals in the mix, and it doesn't count bonds."),
 ]),
 dict(id="count", title="The shortcut: count electron groups", beats=[
  dict(key="e1", energy="steady", vo="You won't redo the mixing for every atom you meet, because there's a shortcut, and it's just counting. {1}You count the electron groups around the atom. {2}A group can be a bond to a neighboring atom. It can also be a lone pair, meaning two electrons that the atom keeps to itself. {3}And a double or triple bond is counted as ONE group. Only its sigma bond sits in a hybrid, because the pi bonds are made from the leftover p orbitals."),
  dict(key="e2", energy="steady", vo="Then you read off the answer. {1}If you count four groups, the atom is «S P three|sp³». {2}With three groups, it's «S P two|sp²». {3}And with only a pair of groups, it's plain «S P|sp». Why does that work? Every sigma bond and every lone pair needs one hybrid orbital to sit in, so the number of groups tells you how many orbitals the atom had to mix."),
  dict(key="e3", energy="steady", vo="We can test it on two molecules. {1}Methane's carbon has four bonds and no lone pairs. That's four groups, so it's «S P three|sp³». {2}Carbon dioxide has one carbon with two double bonds, one to each oxygen. Each double bond counts once, so the carbon has two groups and it's plain «S P|sp». That fits, because two pi bonds need two leftover p orbitals, and the whole molecule is a straight line."),
  dict(key="e4", energy="serious", vo="Lone pairs are where most people slip, and they show up on atoms like nitrogen and oxygen, which mix their orbitals just as carbon does. {1}In ammonia, nitrogen has three bonds to hydrogen and one lone pair. Three plus one is four groups, so the nitrogen is «S P three|sp³». {2}In water, oxygen has two bonds and two lone pairs, which makes four groups again, so water's oxygen is also «S P three|sp³». {3}If you forgot the lone pairs, you'd get the wrong answer for both of them."),
  dict(key="e5", energy="thoughtful", vo="This next detail confuses a lot of students. {1}Methane, ammonia and water are all «S P three|sp³», so in each one the four groups point toward the corners of a tetrahedron. But the three molecules don't have the same shape. {2}Shape describes where the ATOMS are, so it leaves the lone pairs out. Methane is a tetrahedron, ammonia is a shallow three sided pyramid with nitrogen on top, and water is bent. {3}So hybridization counts every group, and shape only shows the atoms."),
  dict(key="e6", story=True, energy="warm", vo="{1}Back in the workshop, Ines rolls her cutting torch over to the steel. One of its tanks holds acetylene, which is two carbons joined by a triple bond, with one hydrogen on each end. {2}If you count the groups on one of those carbons, you find the bond to hydrogen and the triple bond. That makes two groups, so the carbon is plain «S P|sp». {3}Both carbons are the same, so all four atoms sit in one straight line. {4}[serious] She lights the torch, and the acetylene burns in pure oxygen at more than three thousand degrees Celsius. That flame heats the steel until a jet of oxygen can burn right through it, along the line her diamond scratched."),
  dict(key="p3q", energy="curious", vo="[curious] It's your turn again. {1}In this molecule, a carbon with three hydrogens is bonded to a second carbon. That second carbon has a triple bond to a nitrogen, and the nitrogen carries one lone pair. {2}What is the hybridization of each carbon, and of the nitrogen?", pause=8),
  dict(key="p3a", energy="warm", vo="The first carbon has three bonds to hydrogen and one bond to carbon. That's four groups, so it's «S P three|sp³». {1}[warmly] The second carbon is plain «S P|sp», because its single bond and its triple bond make only two groups. {2}The nitrogen has the triple bond and one lone pair, so it has two groups and it's «S P|sp» as well. {3}[thoughtful] The trap is forgetting the lone pair on the nitrogen, or counting the triple bond as three groups."),
 ]),
 dict(id="recap", title="Recap", beats=[
  dict(key="rc", energy="steady", vo="We can put the whole idea in one picture. {1}Carbon promotes one electron and mixes its orbitals, and what it mixes decides where its groups point. {2}If you count four groups, the atom is «S P three|sp³». Its groups point to the corners of a tetrahedron, one hundred nine point five degrees apart, and it keeps no p orbital back. {3}[warmly] Three groups make it «S P two|sp²», so it's flat with angles of one hundred twenty degrees, and it has one p orbital left over for a pi bond. {4}And a pair of groups makes it plain «S P|sp», a straight line at one hundred eighty degrees, with two p orbitals left for two pi bonds."),
 ]),
 dict(id="outro", title="Next: hybridization, part 2", beats=[
  dict(key="end", story=True, energy="warm", vo="{1}[warmly] By morning, the steel heron stands in the town square, and Ines pulls the cover off. {2}Her pencil drew it, her diamond marked it, and her flame cut it out. [thoughtful] Carbon was in all three tools, and what made the soft pencil and the hard diamond so different was how each carbon atom had mixed its orbitals. {3}You'll find the notes and practice for this topic, free, on «levl prep dot com|levlprep.com». {4}And next time, we'll finish hybridization with charged carbons, the one case where the count misleads you, and what a hybrid's makeup does to the length of a bond."),
 ]),
]

import re
_CAPS_KEEP = {'AP', 'ONE'}
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
        n = sum(len(re.sub(r"\[[^\]]+\]\s*", "", clean(b["vo"]))) + 1 for b in ch["beats"])
        pz += sum(b.get("pause", 0) for b in ch["beats"]); nb += len(ch["beats"])
        tot += n; print(f'{ch["id"]:12s} {n:5d}')
    print("total", tot, "chars", nb, "beats", pz, "s pauses")
