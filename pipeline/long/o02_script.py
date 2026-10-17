# audited, not voiced
# Audit log (2026-10-16 long video build run):
# WHY AUDIT (independent agent): fixed hook contradiction with video 1 (4 valence e give 4 bonds; only orbitals suggest 2), orbit
#   picture reason (shell rings = energy map), 90% cutoff reason, Pauli as rule of nature, shell 1 has one orbital, wave idea and
#   node before 2s, shape pattern per shell (s, +p, +d, +f), phase named and tied to the nodal plane, how a bond holds nuclei,
#   graph narrated, 3d never at the nucleus, K symbol vs K shell, argon in brackets spoken, unpaired e to bond link, block widths,
#   hydrogen exception, promise cut to "up to calcium". Spec must: label K as potassium, no 90 degree angles drawn on NH3/H2O,
#   periodic table rows 1 to 4 without I, helium shaded with the s block.
# FACT CHECK (independent agent, LibreTexts, OpenStax, Klein/McMurry): 34 claims + 8 questions. Fixed: sulfur past eight via
#   d orbitals (outdated, removed), 2s pair = ammonia lone pair (reworded), hydrogen is s block, Q7 wording, Hund repulsion only
#   explains spreading (parallel spin left as given). Re-check of all 18 revised beats: OK.
# HUMAN READ (independent agent): rewrote o1c, o3c, o3e, o4b, o5a, o5b, o5c, o6b, o6c, o7b, o7c, o8b, o9a, recap, p3a, hook.
# Cut for length: shell 3 capacity practice problem (covered in the count chapter). 12,190 chars.
"""Script for long video orgo 02: Atomic orbitals (s and p orbitals, electron configuration, Hund's rule).
Source: levlprep.com/ochem/notes/orbitals.html (Foundations, section 2). Builds on orgo 01 (atomic structure).
Each chapter is voiced as one ElevenLabs request (under about 2,800 characters).
{n} marks a visual cue. 'pause' = seconds for pause-and-try beats.
Respellings are written «spoken|shown»: vo gets the spoken form, disp (captions) the shown form.
Captions also drop emotion tags and lower the CAPS emphasis.
"""
ID = "yt-orgo-02-orbitals"

CHAPTERS = [
 dict(id="intro", title="Start here", beats=[
  dict(key="hook", vo="Carbon has four valence electrons, and it makes four bonds. {1}But look closer at where those four electrons actually sit, and carbon looks like it should only make TWO. {2}Yet methane has four. {3}Four identical bonds, pointing to the corners of a tetrahedron, a little triangular pyramid. {4}[curious] So we're missing something about where electrons live. That's what orbitals are about."),
  dict(key="promise", vo="In this video you'll learn to write the electron configuration of any atom up to calcium, {1}and draw its electrons box by box. {2}And you'll see why carbon seems stuck at two bonds."),
  dict(key="why", vo="[warmly] Orbitals usually get taught as weird quantum stuff you just have to accept. {1}But you don't need the math. You need ONE picture. {2}An orbital is a space around the nucleus where an electron is likely to be, and each one holds two electrons. {3}Almost everything in this video falls out of that."),
  dict(key="need", vo="Quick recap from last time. {1}Electrons sit in shells. The inner one, K, holds two. The next one, L, holds eight. {2}The outer ones, the valence electrons, do the bonding. {3}We never said WHY two and eight. We will."),
 ]),
 dict(id="what", title="What an orbital is", beats=[
  dict(key="o1a", vo="Start with the simplest atom. Hydrogen. {1}One proton in the middle, one electron. {2}Those shell rings from last time were a map of energy levels, not tracks. The electron doesn't circle the nucleus like a planet. {3}Measure where it is, and you get a snapshot. {4}Measure again, somewhere else. {5}And again. Every snapshot finds it somewhere new."),
  dict(key="o1b", vo="Mark each sighting with a dot, {1}and keep going for thousands of them. {2}The dots build a cloud. Thick near the nucleus, {3}and thinner the farther out you go. {4}[thoughtful] So you can't say where the electron IS. Only where it's likely to be."),
  dict(key="o1c", vo="The cloud never really ends, so chemists pick a cutoff. {1}Draw a boundary around the space where the electron turns up «ninety percent|90%» of the time. {2}That space is an orbital. A cloud of chances, not a path. {3}Hydrogen's electron is in one called «one s|1s». {4}The one is the shell, the first shell, K. Chemists call that number n. {5}The s is the shape, and s orbitals are round."),
 ]),
 dict(id="pauli", title="Two electrons per orbital", beats=[
  dict(key="o2a", vo="Next, helium. Two electrons. {1}Both fit in that same «one s|1s» orbital. {2}But they're not identical. They differ in something called spin. {3}Each electron acts like a tiny magnet pointing one of two ways, up or down. {4}And helium's two point opposite ways. We draw them as an up arrow and a down arrow."),
  dict(key="o2b", vo="Now lithium, three electrons. {1}The third one can't squeeze into «one s|1s». {2}That's called the Pauli exclusion principle. You can't really ask why on this one, it's just how electrons are. {3}No two electrons in an atom can have the same orbital AND the same spin. {4}There are only two spins, so an orbital holds two electrons, max. One up, one down. {5}And shell one has only that one orbital, so lithium's third electron has to start shell two."),
  dict(key="k1q", vo="Quick check. {1}Could an orbital ever hold three electrons?", pause=3.0),
  dict(key="k1a", vo="Never. {1}Only two spins, so two electrons. A third would match one of the others in both orbital and spin, and Pauli doesn't allow that."),
 ]),
 dict(id="shapes", title="s and p orbital shapes", beats=[
  dict(key="o3a", vo="So what's in shell two? {1}One thing first. Electrons behave a lot like waves, and a wave can have spots where it's exactly zero. Those spots are called nodes. {2}Shell two has its own s orbital, «two s|2s». Same round shape, just bigger, because an electron in shell two spends most of its time farther out. {3}And hidden inside it is a node, a small sphere where the electron is never found. {4}It's not a wall it has to climb over. The wave is just zero there."),
  dict(key="o3b", vo="Shell two also brings a new shape. The p orbital. {1}Two lobes, on opposite sides of the nucleus, along the x axis. {2}People call it a dumbbell. {3}Between the lobes is a flat sheet called a nodal plane. It runs right through the nucleus, and the electron is never found on it. {4}[thoughtful] And this one's a really common mix up. Those two lobes are ONE orbital, not two. {5}So the whole thing still holds just two electrons."),
  dict(key="o3c", vo="And there are three of them. {1}«Two p x|2px», along x. {2}«Two p y|2py», along y. {3}And «two p z|2pz», pointing straight out at you. {4}Each one sits at «ninety degrees|90°» to the other two. {5}They're the same shape and the same energy. They just point different ways. And when orbitals have exactly the same energy, chemists call them degenerate."),
  dict(key="o3d", vo="[curious] Now wait a second. {1}If carbon bonds using orbitals at «ninety degrees|90°», its bonds should be «ninety degrees|90°» apart. {2}But methane's angles are «one oh nine point five|109.5°». {3}Keep that in your back pocket. It's a big clue."),
  dict(key="o3e", vo="There's a pattern to which shapes show up. {1}Shell one only gets s. Shell two adds p. {2}Shell three adds five d orbitals, mostly four leaf clovers. {3}Shell four adds seven f's. {4}But organic chemistry lives almost entirely in s and p."),
 ]),
 dict(id="count", title="Why 2 and 8", beats=[
  dict(key="o4a", vo="[excited] Okay, now we can answer the question from last time. {1}Shell one has just one orbital. Two electrons each, so it holds two. {2}Shell two has «two s|2s» plus three p's. Four orbitals. {3}Four times two... eight. {4}That's where the two and the eight come from."),
  dict(key="o4b", vo="And that's what's behind the octet rule. {1}Carbon, nitrogen, oxygen and fluorine bond with shell two, which has exactly four orbitals. That's eight electrons, and there's no room for a ninth. {2}A ninth would have to go up into a higher shell, farther out and way higher in energy. {3}So a full shell two is a really low energy arrangement, and these atoms share or gain electrons to get there."),
  dict(key="k2q", vo="Quick check. {1}How many electrons can the whole set of three p orbitals in one shell hold?", pause=3.0),
  dict(key="k2a", vo="Three orbitals, two each. {1}Six. {2}If you said two, you counted one p orbital instead of the set."),
 ]),
 dict(id="phase", title="Phase: the two colors", beats=[
  dict(key="o5a", vo="You've probably noticed the p orbital is drawn in two colors. {1}Remember, the electron behaves like a wave, and a wave has a part above the line and a part below. A plus part and a minus part. {2}That sign is called the phase, and the two colors just mark it. {3}It flips right at the nodal plane, which is why the wave is zero there. {4}And they're NOT charges. Neither lobe is positive or negative like a proton."),
  dict(key="o5b", vo="So why care? Because phase decides what happens when two atoms' orbitals overlap. {1}Say two hydrogens come together, and their «one s|1s» orbitals are in the same phase. {2}The waves add up between the nuclei. {3}The electron pair gathers right there, and both positive nuclei get pulled toward that negative pair in the middle. That's a bond."),
  dict(key="o5c", vo="Now flip one. Opposite phase. {1}The waves cancel in the middle, {2}and a node shows up right between the nuclei. {3}So the electrons get pushed out of exactly the spot that would hold the atoms together. {4}We call that antibonding, and it means no bond. {5}You can park phase for now. It comes back with double bonds."),
 ]),
 dict(id="filling", title="Filling order and configurations", beats=[
  dict(key="o6a", vo="So which orbitals fill first? {1}The lowest energy ones. That's the Aufbau principle, German for building up. {2}And inside a shell, s is lower than p. {3}Boron, five electrons. {4}Two in «one s|1s». {5}Two in «two s|2s». {6}Only the fifth goes into «two p|2p»."),
  dict(key="o6b", vo="We write that as an electron configuration. {1}You write the orbital label, then a little raised number that says how many electrons are in it. {2}So boron is «one s two|1s²», {3}«two s two|2s²», {4}«two p one|2p¹». {5}The raised numbers should add up to the electron count. Five. Good."),
  dict(key="o6c", vo="But why is s lower than p? {1}The «one s|1s» pair sits close in and partly blocks the nucleus's pull on anything farther out. That's shielding. {2}This graph shows how likely an electron is at each distance. See that little «two s|2s» bump inside the «one s|1s» hump? It dives in past the shield. {3}A «two p|2p» electron gets in less, and it's NEVER right at the nucleus, because the nucleus sits on its nodal plane. {4}That diving in has a name. Penetration. {5}More penetration means a stronger pull, and that means lower energy."),
  dict(key="o6d", vo="Let's do one together. Phosphorus, fifteen electrons. {1}«One s|1s» takes two. {2}«Two s|2s» takes two. {3}«Two p|2p» takes six. That's ten. {4}«Three s|3s», two more. Twelve. {5}And «three p|3p» gets the last three. {6}Fifteen."),
  dict(key="t1q", vo="Your turn. Pause and write the configuration for chlorine. Seventeen electrons.", pause=5.0),
  dict(key="t1a", vo="Same start as phosphorus, {1}up through «three s two|3s²». Twelve. {2}Five left, so «three p five|3p⁵». {3}That's it."),
 ]),
 dict(id="fours", title="The 4s and 3d trap", beats=[
  dict(key="o7a", vo="Now the one that catches people. Potassium, symbol K. Not the K shell, just a coincidence. {1}Nineteen electrons, and the first eighteen fill just like argon. {2}So where does the nineteenth go? {3}«Three d|3d» feels obvious, right? Three comes before four. {4}[thoughtful] But it goes into «four s|4s»."),
  dict(key="o7b", vo="Same reason as before. Penetration. {1}A «three d|3d» electron, like p, is never right at the nucleus. A «four s|4s» electron dives in close a lot. {2}That's enough to put «four s|4s» lower. {3}So energy sets the order. Not the shell number."),
  dict(key="o7c", vo="These get long, so chemists shorten the filled part. {1}Argon's symbol in brackets stands for all eighteen of argon's electrons. {2}So potassium is argon in brackets, then «four s one|4s¹». {3}[warmly] If you wrote «three d one|3d¹», that's the trap."),
  dict(key="t2q", vo="Your turn. Calcium, twenty electrons. Pause and write it the short way.", pause=4.0),
  dict(key="t2a", vo="Eighteen are argon. {1}Two left, and «four s|4s» holds two. {2}Argon in brackets, «four s two|4s²». {3}«Three d|3d» only starts after that."),
 ]),
 dict(id="hund", title="Hund's rule, box by box", beats=[
  dict(key="o8a", vo="One more rule, and it's the one that ties all this to bonding. {1}Nitrogen, seven electrons. «One s two, two s two|1s² 2s²», and three left for «two p|2p». {2}Draw each orbital as a box. {3}Do they go in as a pair plus one? {4}No. One goes into each box. {5}All pointing the same way."),
  dict(key="o8b", vo="That's Hund's rule. {1}Orbitals with the same energy get one electron each before any of them pair up. {2}Why? Two electrons in one box share the same space, and they're both negative, so they shove each other. {3}An empty box lets them stay apart. {4}Why they all point the same way takes quantum mechanics we're skipping, so take that part as given. {5}An electron alone in its box is called unpaired."),
  dict(key="o8c", vo="[excited] And this is the cool part. Count nitrogen's unpaired electrons. {1}Three. {2}Each one pairs up with an electron from a hydrogen, and each shared pair is a bond. Three bonds. {3}And the pair nitrogen already had shows up as ammonia's lone pair."),
  dict(key="o8d", vo="Oxygen, eight electrons. {1}The first three «two p|2p» electrons take a box each. {2}The fourth has to pair up. {3}So two unpaired, {4}and oxygen makes two bonds. {5}And its two pairs in shell two show up as its two lone pairs."),
  dict(key="t3q", vo="Your turn. Fluorine, nine electrons. Pause, fill the boxes, and count the unpaired ones.", pause=5.0),
  dict(key="t3a", vo="Five go into «two p|2p». {1}One per box, then two of them pair. {2}One unpaired, so one bond. {3}And three lone pairs. Exactly what fluorine does."),
  dict(key="o8e", vo="[curious] So now try carbon. Six electrons. {1}«One s two, two s two, two p two|1s² 2s² 2p²». {2}Hund puts those two in separate boxes. {3}Two unpaired, one empty box. {4}So carbon should make two bonds. Something like «C H two|CH₂». {5}But it makes FOUR, in basically every stable organic molecule you'll ever draw. {6}So carbon's electrons have to rearrange before it bonds. And that's the whole next video."),
 ]),
 dict(id="blocks", title="Reading the periodic table", beats=[
  dict(key="o9a", vo="Last thing, and it saves a lot of counting. {1}The periodic table is sorted by which orbital the last electron goes into. {2}The two columns on the left are the s block. Two, because an s orbital holds two. {3}The six on the right are the p block. Six, because three p's hold six. {4}The ten in the middle are the d block, {5}and the two rows hanging off the bottom are the f block. {6}Besides hydrogen, pretty much every element you'll use in organic chemistry is in the p block."),
 ]),
 dict(id="recap", title="Recap", beats=[
  dict(key="recap", vo="So, in one picture. {1}An orbital is a space where an electron is likely to be. It holds two, with opposite spins. {2}S orbitals are spheres, and p orbitals are dumbbells, three per shell, at right angles to each other. {3}Shell two has four orbitals, so it holds eight, and that's your octet. {4}Lowest energy fills first, and «four s|4s» comes before «three d|3d». {5}Hund spreads them out before pairing, and the unpaired ones predict the bonds. {6}Except for carbon."),
 ]),
 dict(id="practice", title="Practice problems", beats=[
  dict(key="p1q", vo="Alright, practice. Pause, try each one, then I'll walk through it. {1}Problem one. Sulfur, sixteen electrons. Write its configuration, and say how many unpaired electrons it has.", pause=6.0),
  dict(key="p1a", vo="Up through «three s two|3s²» is twelve. {1}Four left, so «three p four|3p⁴». {2}Now the boxes. One in each, then the fourth pairs up. {3}Two unpaired. {4}The trap is pairing them two and two, and getting zero. Always spread out first."),
  dict(key="p3q", vo="Problem two. {1}Two hydrogen «one s|1s» orbitals overlap, in opposite colors. A student says opposite colors attract, so it's a strong bond. {2}[curious] Right or wrong?", pause=5.0),
  dict(key="p3a", vo="Wrong. {1}The colors are the phase of the wave, not charges. {2}Opposite phase means the waves cancel between the nuclei, {3}so there's a node right in the middle. Antibonding. No bond. {4}It's matching colors, the same phase, that make a bond."),
 ]),
 dict(id="outro", title="Next: hybridization", beats=[
  dict(key="end", vo="[warmly] And that's orbitals. {1}The notes and practice for this topic are free on «levl prep dot com|levlprep.com». {2}Next up, hybridization. How carbon turns two unpaired electrons into four identical bonds. {3}See you there."),
 ]),
]

import re
_CAPS_KEEP = {"K", "L", "I", "CH"}
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
        _b["vo"] = _MARK.sub(r"\1", _b["src"])   # spoken text keeps {n} cues and emotion tags

def disp(b):
    return b["disp"]

if __name__ == "__main__":
    tot = 0; tags = 0
    for ch in CHAPTERS:
        n = sum(len(clean(b["vo"])) + 1 for b in ch["beats"])
        tags += sum(len(re.findall(r"\[[^\]]+\]", b["vo"])) for b in ch["beats"])
        tot += n; print(f'{ch["id"]:12s} {n:5d}')
    print("total", tot, "chars, about", round(tot / 810, 1), "min;", tags, "emotion cues")
