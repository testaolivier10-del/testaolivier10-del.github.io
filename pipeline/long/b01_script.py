# audited, not voiced
# Audit log (2026-10-14 long video build run):
# WHY AUDIT (independent agent): 9 why gaps, 9 terms early (joule, heat, ion, density, lattice, chloride...), 7 on-screen items unspoken
#   (q m c dT, CO2 double bonds, double arrow, 0 to 14, p/n/e symbols), 4 inconsistencies (recap "polar molecules attract",
#   capillary = adhesion only, self-ionization vs "steam is still H2O", intro "stick to each other"). All fixed in text; spec must:
#   label p+/n/e- with full words, no double arrow on screen, no "hydration shells" label, CO2 drawn with double bonds and spoken.
# FACT CHECK (independent agent, Campbell ch 2-3 and 36, LibreTexts, CSBSJU capillary data, steam tables, College Board CED):
#   52 claims + all answers matched. Fixed: 1 (core temp rises 1 to 2 degrees, not "stays at 37"), 27 (capillary rise: under 1 m
#   in typical vessels, a few m in the narrowest), 39 (humid air slows, not stops, evaporation), 42 (ice 8% less dense, not 9%).
#   Re-check of every revised beat: OK after w3 fix (electronegativity: 8 protons AND shared pair close to the nucleus).
#   Site note: levlprep.com/bio/notes/water-hydrogen-bonding.html still says ice is 9% less dense and capillary rise is
#   "well under a meter even in the narrowest xylem tubes"; both are off (flagged to Olivier, not changed here).
# Cut for length: practice problem on an air bubble in xylem (overlapped the cohesion quick check). 16,759 chars.
"""Script for long video AP Bio 01: Properties of Water and Hydrogen Bonding (AP Biology topic 1.1).
Source: levlprep.com/bio/notes/water-hydrogen-bonding.html (topic water-hydrogen-bonding).
Story frame (quality v2): Jordan (character library) on a long hot run; sweat cooling her is the payoff of the hook,
and the other properties are shown in real scenes (pond, tree, lake in winter, a glass of salt water).
Each chapter is voiced as one ElevenLabs request (under about 2,800 characters).
{n} marks a visual cue. 'pause' = seconds for pause-and-try beats.
'disp' (caption text) is built automatically at the bottom: respellings joined, caps emphasis lowered, tags removed.
"""
ID = "yt-apbio-01-water-hydrogen-bonding"

CHAPTERS = [
 dict(id="intro", title="Start here", beats=[
  dict(key="hook", vo="[excited] It's thirty three degrees out, and Jordan has been running for an hour. {1}Her muscles are pumping out heat the whole time, {2}and yet her core temperature has only crept up a degree or two. {3}What's keeping it there is the sweat on her skin, plain water. {4}[curious] So here's the question. How can a little water drying off your skin pull that much heat out of your body?"),
  dict(key="promise", vo="By the end of this video, you'll know exactly why. {1}And you'll see the same one idea explain how a water strider stands on a pond, {2}how water climbs to the top of a tree, {3}why ice floats, {4}and why salt dissolves but oil doesn't. {5}It's topic one point one of A P Biology, and it sets up almost everything after it."),
  dict(key="why", vo="[warmly] Most students learn the properties of water as a list to memorize. {1}Cohesion, adhesion, high specific heat, and so on. {2}But they all come from ONE thing. {3}Water molecules are polar, so they stick to each other, and to other charged things. {4}If you understand why they stick, you never have to memorize the list again. {5}So let's start with one molecule."),
 ]),
 dict(id="polar", title="Why water is polar", beats=[
  dict(key="w1", vo="Everything is made of atoms. {1}An atom has a tiny center, the nucleus, made of protons, which are positive, and neutrons, which have no charge. {2}Around it is a cloud of much lighter electrons, which are negative. {3}Atoms join by sharing electrons. {4}When two atoms share a pair of electrons, that's a covalent bond, {5}and a group of atoms held together by covalent bonds is a molecule."),
  dict(key="w2", vo="A water molecule is one oxygen atom bonded to two hydrogen atoms. {1}That's H two O. {2}Two covalent bonds, each one a shared pair of electrons."),
  dict(key="w3", vo="[thoughtful] But here's the thing. The sharing isn't fair. {1}Electronegativity is how strongly an atom pulls on the electrons it shares. {2}Oxygen pulls HARD, because its nucleus has eight protons, and the shared pair sits close to it. {3}Hydrogen's nucleus has just one proton, so it pulls weakly. {4}So the shared electrons spend more of their time near the oxygen. {5}That's called a polar covalent bond, polar meaning it has two ends with different charges."),
  dict(key="w4", vo="Because the electrons crowd toward the oxygen, the oxygen end gets a small negative charge. {1}We write that with the Greek letter delta and a minus sign, delta minus, meaning a partial negative charge. {2}Each hydrogen, with its electrons pulled away, gets a partial positive charge, delta plus. {3}These aren't full charges, like an ion, an atom that has gained or lost a whole electron. Just a lean."),
  dict(key="w5", vo="Now the shape matters too. {1}Water isn't a straight line. It's bent, at an angle of about one hundred four and a half degrees, because oxygen also has two pairs of electrons it doesn't share, and they push the two bonds closer together. {2}So both hydrogens sit on the same side, {3}and the oxygen sits on the other. {4}[excited] That gives the whole molecule a negative end and a positive end. Water is a polar molecule."),
  dict(key="w6", vo="[thoughtful] And the bend really is essential. {1}Carbon dioxide also has polar bonds. Each oxygen shares two pairs of electrons with carbon, a double bond, and pulls them away from the carbon. {2}But carbon dioxide is a straight line, with one oxygen on each side, {3}so the two pulls point in opposite directions and cancel out. {4}Carbon dioxide has no negative end and no positive end. It's nonpolar. {5}Polar bonds, plus a bent shape, that's what makes water polar."),
  dict(key="c1q", vo="Quick check. {1}Why does the oxygen end of a water molecule carry a partial negative charge?", pause=4.0),
  dict(key="c1a", vo="Because oxygen is more electronegative than hydrogen. {1}It pulls the shared electrons closer, so they spend more time on its side. {2}Now let's put a second water molecule next to this one."),
 ]),
 dict(id="hbond", title="Hydrogen bonds", beats=[
  dict(key="h1", vo="[curious] What happens when two water molecules meet? {1}Opposite charges attract. {2}The partial positive hydrogen of one molecule is pulled toward the partial negative oxygen of its neighbor. {3}That attraction is a hydrogen bond. {4}We draw it as a dashed line, to show it's much weaker than the solid covalent bonds inside each molecule."),
  dict(key="h2", vo="Each water molecule has two hydrogens it can offer, {1}and two unshared pairs on its oxygen that can each attract a hydrogen. {2}So one water molecule can hydrogen bond with up to FOUR neighbors at once. {3}And every neighbor is linked to more neighbors, so the whole glass of water is one huge, shifting network."),
  dict(key="h3", vo="[thoughtful] A single hydrogen bond is weak, roughly one twentieth as strong as a covalent bond. {1}And in liquid water, each one lasts only a tiny fraction of a second. It breaks, and a new one forms somewhere else. {2}But there are so MANY of them, all the time, {3}that together they give water almost every property in this video."),
  dict(key="h4", vo="[serious] Here's a trap that shows up on tests. {1}A covalent bond is INSIDE one molecule, oxygen to its own hydrogens. {2}A hydrogen bond is BETWEEN molecules, the hydrogen of one to the oxygen of another. {3}So when water boils, the hydrogen bonds between molecules break, {4}but each molecule stays whole. Steam is still H two O."),
  dict(key="h5", vo="And hydrogen bonds aren't only a water thing. {1}They form wherever a hydrogen attached to oxygen or nitrogen meets another oxygen or nitrogen. {2}You'll see them again holding D N A and proteins together."),
  dict(key="c2q", vo="Quick check. {1}When an ice cube melts, are covalent bonds breaking, or hydrogen bonds?", pause=4.0),
  dict(key="c2a", vo="Hydrogen bonds. {1}Melting only loosens the links between molecules. {2}The covalent bonds inside each H two O are untouched. {3}[warmly] Now let's see what all that sticking actually does."),
 ]),
 dict(id="cohesion", title="Cohesion, adhesion and trees", beats=[
  dict(key="k1", vo="Cohesion is water sticking to water, through hydrogen bonds. {1}Look at the surface of this pond. {2}A molecule in the middle gets pulled by neighbors in every direction. {3}But a molecule at the top has no water above it, only air, {4}so its neighbors pull it sideways and down. {5}The surface gets pulled tight, like a stretched skin. That's surface tension."),
  dict(key="k2", vo="[excited] And it's strong enough to hold up an insect. {1}This water strider weighs so little that it just dents the surface, {2}and the hydrogen bonds hold it up. "),
  dict(key="k3", vo="Adhesion is water sticking to a DIFFERENT surface, one that's polar or charged, like glass, paper, or the walls of tubes inside a plant. {1}Water's partial charges are attracted to the charges on that surface."),
  dict(key="k4", vo="[curious] Put the two together in a narrow tube and something cool happens. {1}Adhesion pulls water up along the walls, {2}and cohesion drags the water in the middle along with it. {3}The water climbs. That's capillary action, {4}and it's why a paper towel soaks up a spill."),
  dict(key="k5", vo="[thoughtful] Now, the big one. How does water get from the roots of a tree all the way up to leaves that might be fifty meters high? {1}Plants carry water in xylem, bundles of narrow, hollow tubes made of dead cells. {2}And the leaves have tiny pores called stomata, {3}each one opened and closed by a pair of guard cells."),
  dict(key="k6", vo="When the stomata are open, water evaporates inside the leaf and escapes as vapor. {1}That loss of water vapor from a plant is called transpiration. {2}[excited] And here's the key. Every molecule that leaves pulls on the molecule behind it, because cohesion links them in one continuous chain. {3}That pull passes all the way down the water column in the xylem, {4}to the roots, which draw in more water from the soil."),
  dict(key="k7", vo="Adhesion helps too. {1}Water clinging to the xylem walls helps the column hold up against gravity, so it doesn't break. {2}[serious] But be careful. Capillary action by itself lifts water less than a meter in typical xylem tubes, and only a few meters even in the narrowest ones. {3}The real lift in a tall tree is the pull from evaporation at the top, carried down a cohesive column. {4}And if an air bubble breaks that chain, that tube stops carrying water."),
  dict(key="c3q", vo="Quick check. {1}Which property lets the pull from a leaf travel all the way down to the roots, cohesion or adhesion?", pause=4.0),
  dict(key="c3a", vo="Cohesion. {1}Water molecules hydrogen bonded to each other form the unbroken chain that passes the pull along. {2}Adhesion holds that chain to the walls. {3}Okay, now let's go back to Jordan, and heat."),
 ]),
 dict(id="heat", title="Specific heat", beats=[
  dict(key="t1", vo="First, a few words about energy. {1}Kinetic energy is energy of motion. {2}Temperature measures the average kinetic energy of a substance's molecules, how fast they're moving. {3}Heat is energy flowing from something hotter to something colder, {4}and we measure energy in joules. One food Calorie is about four thousand two hundred of them."),
  dict(key="t2", vo="Specific heat is how much energy it takes to raise the temperature of one gram of a substance by one degree Celsius. {1}For water, it's four point one eight joules per gram per degree. {2}That's higher than almost any other common liquid."),
  dict(key="t3", vo="[curious] So why does water take so much energy to warm up? {1}Because when water absorbs heat, a lot of that energy goes into BREAKING hydrogen bonds, {2}instead of making the molecules move faster. {3}So the temperature climbs slowly. {4}And when water cools, the hydrogen bonds form again and release energy, so it cools slowly too."),
  dict(key="t4", vo="Let's try a number. {1}How much heat does it take to warm five hundred grams of water from twenty to thirty degrees? {2}We write it as q equals m c delta T. The heat, q, equals the mass, m, times the specific heat, c, times delta T, the change in temperature. {3}Five hundred grams, times four point one eight, times ten degrees, {4}is twenty thousand nine hundred joules. {5}A liquid with half of water's specific heat would warm up by TWENTY degrees with that same energy."),
  dict(key="t5", vo="That's why big lakes change temperature so slowly, {1}why coastal cities have milder weather, {2}and why the water inside Jordan steadies her temperature."),
 ]),
 dict(id="sweat", title="Evaporation and sweat", beats=[
  dict(key="t6", vo="[thoughtful] Now, sweat. {1}Heat of vaporization is the energy it takes to turn one gram of a liquid into a gas. {2}For water at boiling, it's about two thousand two hundred sixty joules per gram. {3}That's more than five times the energy it takes to heat that same gram all the way from zero to one hundred degrees."),
  dict(key="t7", vo="[curious] Why so much? {1}To escape into the air, a water molecule has to break EVERY hydrogen bond holding it to the liquid. {2}So only the fastest moving molecules make it out. {3}Each one carries a big chunk of energy away with it, {4}and the molecules left behind are, on average, slower. {5}Slower means cooler, and that cooler sweat soaks up more heat from the skin underneath."),
  dict(key="t8", vo="[excited] And that's the answer to our opening question. At thirty three degrees, the air is almost as warm as Jordan's skin, so her body can barely shed heat into it. Evaporation is what's left. {1}Every gram of sweat that evaporates from Jordan's skin carries away more than two thousand joules of heat. {2}That's evaporative cooling. {3}It's the same trick a leaf uses when transpiration cools it in the sun."),
  dict(key="c4q", vo="Quick check. {1}On a really humid day, sweat drips off you instead of drying. Why do you feel hotter?", pause=4.0),
  dict(key="c4a", vo="Because the cooling only happens when sweat EVAPORATES. {1}Humid air is already full of water vapor, so sweat evaporates slowly, and a lot of it just drips off without ever carrying that heat away. {2}Next, what happens when water gets cold."),
 ]),
 dict(id="ice", title="Why ice floats", beats=[
  dict(key="i1", vo="[curious] Density is how much mass is packed into a given space. Most substances get denser when they freeze, so their solid sinks in their own liquid. {1}Water is a famous exception. {2}As water cools toward zero degrees, its molecules slow down, {3}and once they're slow enough that the bonds stop breaking, each molecule holds all four of its hydrogen bonds at fixed angles. {4}That locks them into an open, six sided grid, with every molecule held at arm's length. In the liquid, molecules jostle and slip into those gaps."),
  dict(key="i2", vo="So ice has fewer molecules packed into the same space. {1}It's about eight percent less dense than liquid water, {2}and that's why it floats."),
  dict(key="i3", vo="[warmly] And life depends on that. {1}A pond freezes from the top down. {2}The ice layer on top insulates the water underneath, {3}so the fish below spend the winter in liquid water. {4}If ice sank, lakes could freeze solid from the bottom up."),
 ]),
 dict(id="solvent", title="Water as a solvent", beats=[
  dict(key="v1", vo="A solution is a mixture where one substance is spread evenly through another. {1}The substance that gets dissolved is the solute. {2}The one doing the dissolving is the solvent. {3}Water dissolves so many things that it's sometimes called the universal solvent, though, as you'll see, not everything."),
  dict(key="v2", vo="Let's drop in some table salt. {1}Salt is sodium chloride. {2}In the crystal, sodium has given an electron to chlorine, {3}so sodium is a positive ion, and chlorine, which we call chloride once it carries that extra electron, is a negative ion. {4}Opposite ions attract strongly, and that attraction is an ionic bond."),
  dict(key="v3", vo="[excited] Now watch the water molecules. {1}Around each sodium ion, they turn their partial negative oxygens inward. {2}Around each chloride ion, they turn their partial positive hydrogens inward. {3}These shells of water pull the ions out of the crystal and keep them apart. {4}The salt dissolves."),
  dict(key="v4", vo="Sugar isn't made of ions, but it's covered in O H groups, so water hydrogen bonds to them and carries each molecule off whole. {1}Anything that dissolves in water or is attracted to it is called hydrophilic, which means water loving."),
  dict(key="v5", vo="But oil is different. {1}Oil molecules are mostly carbon and hydrogen, and those two pull on electrons about equally. {2}So oil has no partial charges for water to grab onto. {3}The water molecules hydrogen bond with each other instead, and squeeze the oil out of the way, {4}so the oil gathers into drops. {5}Substances like that are hydrophobic, water avoiding."),
  dict(key="c5q", vo="Quick check. {1}Which part of a water molecule faces a chloride ion?", pause=4.0),
  dict(key="c5a", vo="The hydrogen side, because it's partial positive, and chloride is negative. {1}[serious] The trap is picking oxygen. {2}Opposites attract, so oxygen faces the POSITIVE sodium. {3}[warmly] One last thing water does. A tiny bit of it falls apart."),
 ]),
 dict(id="ph", title="Acids, bases and pH", beats=[
  dict(key="p1", vo="This isn't heat breaking water apart. Every so often, one water molecule hands a hydrogen ion to a neighbor. {1}That hydrogen ion, H plus, is a hydrogen atom without its electron, so it's just a proton, and it rides along on the neighbor. {2}What's left behind is a hydroxide ion, O H minus. {3}In pure water the two form in equal numbers."),
  dict(key="p2", vo="An acid adds hydrogen ions to a solution. {1}A base lowers the hydrogen ion concentration, by grabbing H plus, or by adding hydroxide, which joins H plus to make water."),
  dict(key="p3", vo="The p H scale describes how many hydrogen ions there are. {1}It usually runs from zero to fourteen, and pure water at room temperature is p H seven, neutral. {2}The scale runs backward: below seven is acidic, MORE H plus. {3}Above seven is basic. {4}[serious] And here's the part students miss. Each whole step is a factor of TEN. {5}Going from p H seven to p H six means ten times more hydrogen ions, not a little more."),
  dict(key="p4", vo="Your blood stays near p H seven point four because of a buffer, {1}a pair of substances that soaks up hydrogen ions when there are too many and releases them when there are too few. {2}In blood, that's carbonic acid and bicarbonate. {3}For now, know the scale, and know that each step is ten times."),
 ]),
 dict(id="recap", title="Recap in one picture", beats=[
  dict(key="r1", vo="[warmly] Let's put it all in one picture. {1}Oxygen pulls harder on electrons, and the molecule is bent, so water is polar. {2}Water molecules attract each other, and those attractions are hydrogen bonds. {3}And everything else comes from that. {4}Cohesion and surface tension, water sticking to water. {5}Adhesion, water sticking to other polar surfaces, and with cohesion, capillary action."),
  dict(key="r2", vo="{1}High specific heat, because energy goes into breaking hydrogen bonds first. {2}High heat of vaporization, because an escaping molecule must break all of them, which is why sweat cools. {3}Ice floats, because hydrogen bonds lock an open lattice. {4}And water is a great solvent, because its partial charges surround ions and polar molecules. {5}[excited] One idea, six properties."),
 ]),
 dict(id="practice", title="Practice problems", beats=[
  dict(key="q1q", vo="[warmly] Time to practice. Pause the video and try each one. {1}Problem one. A student says that when water boils, the heat breaks water molecules apart into hydrogen and oxygen gas. Right or wrong?", pause=6.0),
  dict(key="q1a", vo="Wrong. {1}Boiling breaks the hydrogen bonds BETWEEN molecules. {2}The covalent bonds inside each molecule stay intact, so the bubbles are water vapor, still H two O. {3}[serious] The trap is mixing up the two kinds of bonds."),
  dict(key="q2q", vo="Problem two. {1}How much heat does it take to warm two hundred grams of water by five degrees Celsius? Use four point one eight joules per gram per degree.", pause=6.0),
  dict(key="q2a", vo="[thoughtful] Heat equals mass times specific heat times temperature change. {1}Two hundred grams, times four point one eight, times five degrees, {2}is four thousand one hundred eighty joules. {3}The trap is forgetting the mass, and getting just twenty point nine. {4}Check your units: the grams and degrees cancel, leaving joules."),
  dict(key="q4q", vo="Problem three. {1}Solution A has a p H of four. Solution B has a p H of six. {2}How many times more hydrogen ions does solution A have?", pause=6.0),
  dict(key="q4a", vo="Six minus four is two p H units. {1}Each unit is a factor of ten, so ten times ten, {2}is one hundred times more hydrogen ions. {3}[serious] The trap answer is two times. The scale isn't a straight count. Every step multiplies by ten."),
 ]),
 dict(id="outro", title="Next: the elements of life", beats=[
  dict(key="end", vo="And that's water, from one bent molecule to Jordan cooling off at the finish. {1}The notes and practice questions for this topic are free on levl prep dot com. {2}[warmly] Next up: the elements of life, and the four big families of molecules that do their work in water. {3}See you there."),
 ]),
]

import re
# Respelled words: spoken form in vo -> normal spelling in captions.
_JOIN = [("levl prep dot com", "levlprep.com"), ("A P Biology", "AP Biology"), ("D N A", "DNA"), ("H two O", "H2O"),
         ("O H minus", "OH−"), ("p H seven point four", "pH 7.4"), ("p H", "pH"), ("O H groups", "OH groups"), ("delta T", "ΔT"),
         ("thirty three degrees", "33 °C"), ("At thirty three degrees", "At 33 °C"), ("four thousand two hundred of them", "4,200 of them"), ("eight protons", "8 protons"), ("zero to fourteen", "0 to 14"),
         ("topic one point one", "topic 1.1"), ("one hundred four and a half degrees", "104.5°"),
         ("four point one eight joules per gram per degree", "4.18 J/g·°C"), ("four point one eight", "4.18"),
         ("five hundred grams", "500 g"), ("from twenty to thirty degrees", "from 20 to 30 °C"), ("ten degrees", "10 °C"),
         ("twenty thousand nine hundred joules", "20,900 J"), ("TWENTY degrees", "20 °C"),
         ("two thousand two hundred sixty joules per gram", "2,260 J/g"), ("from zero to one hundred degrees", "from 0 to 100 °C"),
         ("two thousand joules", "2,000 J"), 
         ("zero degrees", "0 °C"), ("eight percent", "8%"), ("fifty meters", "50 meters"),
         ("two hundred grams", "200 g"), ("five degrees Celsius", "5 °C"), ("five degrees", "5 °C"),
         ("four thousand one hundred eighty joules", "4,180 J"), ("twenty point nine", "20.9"),
         ("p H of four", "pH of 4"), ("p H of six", "pH of 6"), ("seven", "7")]
_KEEP_CAPS = {"A", "B"}

def clean(vo):
    return re.sub(r"\s+", " ", re.sub(r"\{\d+\}", "", vo)).strip()

def _auto_disp(vo):
    d = re.sub(r"\[[^\]]+\]\s*", "", re.sub(r"\{\d+\}", "", vo))
    for a, b in _JOIN:
        if a == "seven":
            d = re.sub(r"\bpH seven\b", "pH 7", d); d = re.sub(r"\bBelow seven\b", "Below 7", d); d = re.sub(r"\bAbove seven\b", "Above 7", d)
            d = re.sub(r"\bpH six\b", "pH 6", d)
            continue
        d = d.replace(a, b)
    d = re.sub(r"\b[A-Z]{2,}\b", lambda m: m.group(0) if m.group(0) in _KEEP_CAPS or m.group(0) in ("DNA", "AP", "OH") else m.group(0).lower(), d)
    return d

for _ch in CHAPTERS:
    for _b in _ch["beats"]:
        _b.setdefault("disp", _auto_disp(_b["vo"]))

def disp(b):
    d = b.get("disp") or clean(b["vo"])
    return re.sub(r"\s+", " ", re.sub(r"\[[^\]]+\]\s*", "", re.sub(r"\{\d+\}", "", d))).strip()

if __name__ == "__main__":
    tot = 0; tags = 0
    for ch in CHAPTERS:
        n = sum(len(clean(b["vo"])) + 1 for b in ch["beats"])
        tags += sum(len(re.findall(r"\[[^\]]+\]", b["vo"])) for b in ch["beats"])
        tot += n; print(f'{ch["id"]:12s} {n:5d}')
    print("total", tot, "chars, about", round(tot / 810, 1), "min;", tags, "emotion cues")
