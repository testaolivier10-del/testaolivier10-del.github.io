# audited, not voiced
# Audit log (2026-10-13/14, long video build run):
# WHY AUDIT (independent agent): 6 missing reasons, 4 terms early, 6 on-screen items unspoken, 3 inconsistencies, 1 jump. All fixed (heat vs
#   "temperature barely moves", capillary leak reason, vein pressure reason, brain energy, gravity for ankle swelling, arteries defined at first use,
#   pulmonary arteries named in v3, 70 to 180 bpm spoken, C H O N and H2O spoken, seven characteristics, bridge v3 to alive, breathing as mechanism).
#   Spec notes: arrows for direction use neutral colors (gold away, teal toward), never red/blue for artery/vein; no nuclei on the fiber; no "levers" label; no O2/CO2 symbols on screen.
# FACT CHECK (independent agent, OpenStax A&P 2e, StatPearls, MedlinePlus, etymonline, eLife 2020): 41 claims + 4 practice answers; answers matched.
#   Fixed 2 (anatome = a cutting up), 16 (many fibers), 25 (crine = secrete), 36 (pressure gradient breathing), 37 (many run lower), 38, 40 (heart works
#   harder, not "against"). Re-check of all revisions: OK. No unconfirmed claim kept. Problem 4 cut for length (16,828 chars).
"""Script for long video A&P 01: Intro to Anatomy and Physiology (levels of organization and organ systems).
Source: levlprep.com/anatomy-physiology/notes/body-organization.html (topic body-organization).
Story frame (quality v2): one runner, Jordan, in the last 200 meters of a race; every idea is shown on her body.
Each chapter is voiced as one ElevenLabs request (under about 2,800 characters).
{n} marks a visual cue. 'pause' = seconds for pause-and-try beats.
'disp' (caption text) is built automatically at the bottom: spaced letters joined, caps emphasis lowered, tags removed.
"""
ID = "yt-ap-01-intro-levels-of-organization"

CHAPTERS = [
 dict(id="intro", title="Start here", beats=[
  dict(key="hook", vo="[excited] Two hundred meters to go, and Jordan is sprinting all out. {1}Her legs are burning, {2}her heart is pounding, {3}she's gasping for air, {4}and sweat is pouring down her face. {5}[curious] So here's a question. How many parts of her body have to work together, RIGHT now, just to keep her running?"),
  dict(key="promise", vo="By the end of this video, you'll be able to zoom from Jordan's whole body down to the molecules in one muscle, and back out. {1}Those are the six levels of organization. {2}You'll know all eleven organ systems and what each one is doing in this sprint, {3}what makes something alive, {4}and why her temperature barely moves while she runs. {5}It's the frame for the whole course."),
  dict(key="why", vo="[warmly] Most students treat this chapter like a vocabulary list. {1}But ONE idea ties it all together. {2}How a body part is BUILT decides what it can do. {3}That's the link between anatomy and physiology, {4}and it's why the body is built in levels, each able to do something its parts can't. {5}Keep that idea handy, it comes back in every chapter."),
 ]),
 dict(id="anatphys", title="Anatomy vs physiology", beats=[
  dict(key="a1", vo="[curious] So what's actually the difference between anatomy and physiology? Let's use Jordan's heart. {1}You can ask what it looks like. It's about the size of a fist, it's mostly muscle, and it has four chambers inside. {2}That's anatomy. {3}Or you can ask how it works. How does that muscle squeeze, and what pushes it from about seventy beats a minute at rest to around one eighty in this sprint? {4}That's physiology."),
  dict(key="a2", vo="Anatomy is the study of the body's structures: their shape, size, parts and position. {1}The word comes from the Greek for a cutting up, {2}because for most of history, dissection, cutting a body open, was the main way to see inside."),
  dict(key="a3", vo="Anatomy splits two ways. {1}By scale: gross anatomy is what you can see with your eyes, like the heart, {2}and microscopic anatomy needs a microscope, like the cells in the heart wall. {3}And by approach: regional anatomy studies everything in ONE part of the body together, every bone, muscle, vessel and nerve in the hand. {4}Systemic anatomy follows one body system through the whole body, all the bones, then all the muscles. {5}Most courses work that way, and we'll define a system exactly in a few minutes."),
  dict(key="a4", vo="Physiology is the study of how those structures work. {1}Physio means nature, logy means study of. {2}[thoughtful] And we'll always describe physiology as a mechanism, one thing causing the next. {3}So we WON'T say her heart speeds up because she needs oxygen, as if it had a plan. {4}We'll say signals from her nerves, plus adrenaline, a chemical messenger carried in her blood, make her heart beat faster and harder. {5}That's a chain of causes you can follow."),
  dict(key="a5", vo="[excited] Here's the big idea in action. {1}You can't pull anatomy and physiology apart, because what a structure can do depends on how it's built. {2}Take the tiniest blood vessels, the capillaries. {3}Their wall is just ONE layer of thin, flat cells, {4}so oxygen slips right through it, out of the blood and into Jordan's leg muscle. {5}A thick walled vessel couldn't do that. Structure decides function."),
  dict(key="c1q", vo="Quick check. {1}A student measures how fast blood is flowing through Jordan's arteries, the vessels carrying blood away from her heart. Is that anatomy or physiology?", pause=4.0),
  dict(key="c1a", vo="Physiology, because it's about how something WORKS. {1}Measuring how thick the artery wall is would be anatomy. {2}[warmly] Now let's see how that structure is put together."),
 ]),
 dict(id="levels", title="Six levels of organization", beats=[
  dict(key="l1", vo="[curious] So how is a body built? Let's dive into Jordan's thigh. {1}This big muscle on the front is one of her quadriceps, the group that straightens her knee every stride. {2}It's built in levels, each made from units of the level below, {3}and each level can do things its parts can't do alone."),
  dict(key="l2", vo="At the very bottom is the chemical level. {1}An atom is the smallest unit of an element, a pure substance like carbon, hydrogen, oxygen or nitrogen, written C, H, O and N. {2}Atoms join to make a molecule, {3}like water, two hydrogen atoms bonded to one oxygen. That's H two O. {4}Her muscle is mostly water, plus huge molecules built mainly from those four elements, like the protein strands that do the pulling."),
  dict(key="l3", vo="[thoughtful] But a pile of molecules isn't alive. {1}Arrange them just right and you get a cell, the smallest unit that can carry out the activities of life on its own, and we'll pin down what those are later in this video. Cell is Latin for small room. {2}Her thigh's cells are long, thin muscle cells, called muscle fibers, {3}and each one can shorten and pull. {4}A loose pile of molecules can't do that."),
  dict(key="l4", vo="Next, the tissue level. {1}A tissue is a group of similar cells, plus the material around them, working together on one job. {2}The word comes from the French for woven, {3}and you can see why: thousands of fibers lie side by side, bundled in thin wrappings, {4}and many of them shorten together, so the bundle pulls as one. {5}Studying tissues is called histology."),
  dict(key="l5", vo="[excited] Zoom out to the organ level. {1}An organ is made of TWO or more kinds of tissue, has a recognizable shape, and does a specific job. {2}That whole thigh muscle is an organ. {3}It has muscle tissue to pull, tough connective tissue holding it together and tying it to bone through a tendon, {4}blood vessels bringing oxygen, and nerves telling it when to pull. {5}Organon is Greek for tool, and this is a tool for straightening her knee."),
  dict(key="l6", vo="An organ system is a group of organs working together on a shared job. {1}Her thigh muscle is one organ of her muscular system, {2}along with the other muscles attached to her bones, more than six hundred of them."),
  dict(key="l7", vo="And the organism level is Jordan herself, {1}a whole living individual, all her systems working together. {2}So from the bottom: chemical, cellular, tissue, organ, organ system, organism. {3}Six levels."),
  dict(key="l8", vo="[thoughtful] Notice the pattern. {1}One fiber can pull, but it can't straighten a knee. {2}That takes a whole muscle anchored to bone. {3}And one muscle can't run a race. {4}That takes whole systems. {5}[excited] Every level gains abilities its parts DON'T have."),
  dict(key="c2q", vo="Quick check. {1}Similar cells, plus the material around them, working on one job. Which level?", pause=4.0),
  dict(key="c2a", vo="A tissue. {1}[warmly] The trap is saying organ. {2}An organ needs TWO or more kinds of tissue. {3}Now let's zoom back out and meet all her organ systems."),
 ]),
 dict(id="systems1", title="Systems that cover, move and control", beats=[
  dict(key="s0", vo="Most A and P courses group the organs into eleven organ systems. {1}[excited] The easiest way to learn them is to ask what each one is doing for Jordan in this sprint. {2}Learn each one's main organs and main job."),
  dict(key="s1", vo="Let's start on the outside. {1}The integumentary system is her skin plus what grows from it: hair, nails, sweat glands. {2}Integumentum is Latin for covering. {3}It protects her, limits water loss and helps control body temperature. {4}Right now it's pouring out sweat, and as sweat evaporates, it carries heat away."),
  dict(key="s2", vo="The skeletal system is her bones and joints. {1}It supports her and protects organs like her brain and heart, {2}gives muscles something to pull on, {3}stores calcium, and makes blood cells inside the bones."),
  dict(key="s3", vo="The muscular system is the muscles attached to those bones. {1}They pull on the bones to move her, {2}and they make a lot of heat as they work. [curious] So why doesn't her temperature shoot up? We'll get there."),
  dict(key="s4", vo="[thoughtful] So what tells those muscles when to pull? {1}The nervous system: brain, spinal cord, and nerves running everywhere. {2}It detects changes and sends fast electrical signals that control responses, {3}like the signals racing down her nerves to her legs every stride."),
  dict(key="s5", vo="The endocrine system controls too, but with slower, longer lasting signals. {1}Endo means within, and crine means to secrete, to release: its glands release hormones, chemical messengers, into the blood. {2}The main ones are the pituitary, thyroid, adrenal glands, pancreas, and the gonads, meaning the testes or ovaries. {3}It runs slow processes like growth, {4}and right now her adrenal glands are releasing adrenaline, which helps push her heart rate up."),
  dict(key="c3q", vo="Quick check. {1}Nervous and endocrine systems both control her body. How are their signals DIFFERENT?", pause=4.0),
  dict(key="c3a", vo="The nervous system sends fast electrical signals along nerves. {1}The endocrine system sends hormones through the blood, and those are usually slower, but they last longer. {2}[warmly] Now, all that work needs fuel and oxygen, so let's meet the systems that supply her and clean up."),
 ]),
 dict(id="systems2", title="Systems that supply and clean", beats=[
  dict(key="s6", vo="The cardiovascular system is the heart, blood vessels and blood. {1}Cardio means heart, vascular means small vessel. {2}It pumps blood carrying oxygen, nutrients, wastes and heat around her body, {3}and in a sprint, because nerve signals and adrenaline make it beat faster and harder, her heart can pump several times more blood a minute than at rest."),
  dict(key="s7", vo="Beside it is the lymphatic system: the thymus, the spleen, and thin vessels with small filtering nodes along them. {1}[thoughtful] Here's why it matters. Blood pressure always pushes some fluid out through those thin capillary walls into the tissues, {2}and lymphatic vessels bring it back to the blood. {3}It also houses many immune cells, which fight infection."),
  dict(key="s8", vo="The respiratory system is the nose, the trachea or windpipe, and the lungs. {1}Re means again, spire means breathe. {2}It brings oxygen into her blood and removes carbon dioxide. {3}Her muscles are using oxygen and making carbon dioxide much faster now, and signals from her brain speed up her breathing to match. {4}How her brain sets that pace gets its own video later."),
  dict(key="s9", vo="The digestive system is the mouth, esophagus, stomach, intestines, liver, gallbladder, pancreas and appendix. {1}It breaks food down, absorbs nutrients, and gets rid of the rest as feces. {2}Her muscles' fuel came in this way."),
  dict(key="s10", vo="The urinary system is the kidneys, two ureters, the urinary bladder and the urethra. {1}It filters blood, removes wastes as urine, and controls water balance. {2}[serious] And students mix up this pair ALL the time. {3}Ureters are two tubes, one from each kidney down to the bladder. {4}The urethra is one tube from the bladder out of the body. Two ureters, one urethra."),
  dict(key="s11", vo="Last, the reproductive system: testes in males; ovaries, uterine tubes, uterus and vagina in females. {1}It makes sex cells, and the female system can support a developing baby. {2}[curious] It's the one system Jordan doesn't need to stay alive. {3}It keeps the species going, not the individual."),
  dict(key="s12", vo="Some organs belong to TWO systems. {1}The pancreas sends digestive juices into the intestine, so it's digestive, {2}and hormones into the blood, so it's endocrine. {3}The gonads make sex cells and hormones: reproductive and endocrine."),
 ]),
 dict(id="vessels", title="Arteries, veins and capillaries", beats=[
  dict(key="v1", vo="Every system depends on blood getting around, so let's look at the three kinds of vessels. {1}[serious] Here's the rule that beats a classic exam trap. {2}Vessels are named by the DIRECTION of flow relative to the heart, not by how much oxygen the blood carries."),
  dict(key="v2", vo="An artery carries blood AWAY from the heart, {1}with thick, muscular walls, because the heart pushes blood into it under high pressure. {2}A vein carries blood back TOWARD the heart, {3}with thinner walls and lower pressure, because by the time blood gets through the capillaries, most of the heart's push is used up. {4}Capillaries, one cell thick, link the smallest arteries to the smallest veins. That's where exchange happens."),
  dict(key="v3", vo="[thoughtful] Arteries away, veins toward, capillaries exchange. {1}Now the trap. Most arteries carry oxygen rich blood, but not all. {2}The pulmonary arteries, pulmo meaning lung, run from her heart to her lungs, and they carry blood that's LOW in oxygen, {3}because it just came back from her body and is going to pick up more. {4}They're still arteries: they carry blood away from the heart. {5}So her blood keeps every cell supplied. But what makes those cells alive in the first place?"),
 ]),
 dict(id="alive", title="What makes something alive", beats=[
  dict(key="al1", vo="[curious] Here's a strange question. A rock and one of Jordan's cells are both made of atoms. Why is only one alive? {1}Because living things share seven characteristics."),
  dict(key="al2", vo="First, organization, the six levels we just saw. {1}Then metabolism, from meta, meaning change, which is all the chemical changes in her body. Some build big molecules and use energy, and others break them down and release it. {2}Responsiveness: sensing a change and reacting, like yanking her foot off a sharp rock before she's thought about it. {3}And movement, of her body and of things inside it."),
  dict(key="al3", vo="There's growth, from more cells, bigger cells, or more material between them. {1}Development, the changes over a lifetime, like cells specializing into muscle fibers. {2}And reproduction, making new cells for growth and repair, and new organisms. {3}[warmly] A rock does none of this."),
  dict(key="al4", vo="To stay alive, her cells also need things from outside. {1}Oxygen, to release most of the energy stored in food. Without it, energy falls within minutes, and brain cells fail first, because the brain uses a lot of energy and stores almost none. {2}Nutrients, the substances from food she uses for energy, building material and chemical control, including minerals and vitamins. {3}And water, because most of her mass is water, and nearly every chemical change in her cells happens dissolved in it."),
  dict(key="al5", vo="She also needs a narrow temperature range, because chemical changes speed up when it's warmer and slow when it's colder, {1}and too far either way, big molecules lose their working shape. {2}And suitable air pressure. Her breathing muscles expand her chest, which lowers the pressure inside her lungs, so air flows in from the higher pressure outside, and that pressure also helps push oxygen into her blood. {3}[thoughtful] High on a mountain, with lower pressure, less oxygen gets in with each breath."),
 ]),
 dict(id="normal", title="Normal ranges and teamwork", beats=[
  dict(key="n1", vo="That temperature need brings us back to the promise from the start. {1}Take Jordan's temperature before the race and right after. {2}It's up a little, and her body is already pushing it back. {3}It stays near thirty seven degrees Celsius, about ninety eight point six Fahrenheit, though plenty of healthy people run a little lower, inside a normal range, the band of values found in healthy people. {4}So do the water, sodium and oxygen in her blood."),
  dict(key="n2", vo="[curious] So how does it do that? {1}Her body detects a change, which triggers a response that pushes the value back. {2}As her muscles heat her up, her sweat glands pour out sweat, {3}and as it evaporates, it carries heat away. {4}In the cold it's reversed: cold sensed by her skin and brain triggers shivering, small fast muscle contractions that make heat. {5}When this fails and a value drifts out of range, that's often what illness is. The full mechanism, the feedback loop, comes later in the Foundations part of this course."),
  dict(key="n3", vo="Last big idea: no organ system works alone. {1}Her thigh muscle needs, right now, {2}oxygen brought in by the respiratory system, {3}delivered by the cardiovascular system, {4}fuel absorbed by the digestive system, {5}and wastes carried off in the blood, to be removed by her lungs and urinary system."),
  dict(key="n4", vo="[serious] Watch what happens when one fails. If the kidneys stop working, they stop removing water and wastes from the blood. {1}Water builds up in the blood and around cells, so ankles swell, as gravity pulls the extra fluid down, and fluid can collect in the lungs. {2}The lungs then move less oxygen into the blood, {3}and the extra fluid and higher blood pressure make the heart work harder. {4}One failing organ, three systems in trouble. {5}[warmly] So for every system, ask what it depends on, and what depends on it."),
 ]),
 dict(id="recap", title="Recap in one picture", beats=[
  dict(key="r1", vo="[warmly] Let's put it all in one picture. {1}Anatomy is structure, physiology is how it works, and structure decides function. {2}The body is built in six levels: chemical, cellular, tissue, organ, organ system, organism, each one gaining abilities its parts don't have. {3}Eleven organ systems, each with its own job, all depending on each other. {4}Arteries away, veins toward, capillaries exchange. {5}And a living body stays alive by holding conditions like temperature inside a normal range."),
 ]),
 dict(id="practice", title="Practice problems", beats=[
  dict(key="p1q", vo="[warmly] Okay, your turn. Problem one. {1}Put these in order from smallest to largest: organ, cell, organ system, molecule, tissue.", pause=6.0),
  dict(key="p1a", vo="Molecule, the chemical level, then cell, tissue, organ, organ system, {1}and the organism on top. {2}[serious] The trap is swapping tissue and organ. {3}An organ is built FROM tissues, so it comes after them."),
  dict(key="p2q", vo="Problem two. {1}The pulmonary arteries carry blood from the heart to the lungs, and that blood is low in oxygen. {2}A student says that means they should really be called veins. Right or wrong?", pause=5.0),
  dict(key="p2a", vo="[curious] Wrong. {1}Vessels are named by direction, not oxygen. {2}These carry blood AWAY from the heart, so they're arteries. {3}The trap is thinking artery means oxygen rich. Usually true, but not the definition."),
  dict(key="p3q", vo="Problem three. {1}A patient's kidney is fine, but a stone is stuck in the tube that carries urine from that kidney to the bladder. {2}Which tube is blocked?", pause=5.0),
  dict(key="p3a", vo="It's a ureter. {1}There are two of them, one for each kidney, running down to the bladder. {2}[serious] The trap is the urethra, the single tube from the bladder out of the body. {3}Two ureters, one urethra."),
 ]),
 dict(id="outro", title="Next: the language of A&P", beats=[
  dict(key="end", vo="And that's the big picture of anatomy and physiology, from molecules in one muscle to Jordan crossing the finish line. {1}For more practice, there are free questions on levl prep dot com. {2}[warmly] Next up: the language of A and P, the word parts and directional terms that make every name in this course make sense. {3}See you there."),
 ]),
]

import re
# Respelled words: spaced letters in vo -> normal spelling in captions.
_JOIN = [("A and P", "A&P"), ("levl prep dot com", "levlprep.com"),
         ("thirty seven degrees Celsius, about ninety eight point six Fahrenheit", "37 °C, about 98.6 °F"), ("about seventy beats", "about 70 beats"), ("around one eighty", "around 180"), ("H two O", "H2O"),
         ("Two hundred meters", "200 meters"), ("six hundred", "600")]
_KEEP_CAPS = {"A"}

def clean(vo):
    return re.sub(r"\s+", " ", re.sub(r"\{\d+\}", "", vo)).strip()

def _auto_disp(vo):
    d = re.sub(r"\[[^\]]+\]\s*", "", vo)
    for a, b in _JOIN:
        d = d.replace(a, b)
    d = re.sub(r"\b[A-Z]{2,}\b", lambda m: m.group(0) if m.group(0) in _KEEP_CAPS else m.group(0).lower(), d)
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
    print("total", tot, "chars, about", round(tot / 900, 1), "min;", tags, "emotion cues")
