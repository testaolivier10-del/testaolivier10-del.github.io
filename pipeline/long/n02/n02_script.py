# audited, voiced 2026-11-27
# Audit log (2026-11-27 long video build):
# SPLIT: the coverage map entry (sections 1.4, 1.5, 1.6) ran to about 12,400 spoken characters (about 19 minutes at the
#   2026-11-24 pacing), so it was split. This is part 1: provider levels, the EMT's responsibilities and traits, the
#   Medical Director and medical direction. Part 2 (yt-nremt-02b) takes certification and the National Registry,
#   recertification, quality improvement in full, public health, mobile integrated health care and evidence based
#   practice (the oxygen example); its drafted beats are in n02b_draft_beats.txt (m4 to m6, h1 to h4, p4).
# WHY AUDIT (independent agent, 22 items): fixed EMS never spelled out; the 911 call; AED, airway, protocol, naloxone
#   and heart attack defined; why aspirin needs the allergy and bleeding questions; why nitroglycerin needs the call;
#   why the crew comes before the patient; off line and on line names explained; the hospital choice is decided; Joan
#   joining and Marcus's IV are said; "hands him up" removed (Priya leads the call); Ruiz is from the sheriff's office.
#   VISUALS MUST: say or drop "no cath lab" (now "the lab that can open that artery"), no "57 kg", no unspoken labels.
# FACT CHECK (independent agent; 2019 National EMS Scope of Practice Model, 2025 ACC/AHA ACS guideline, nremt.org):
#   37 claims, practice answers matched. Fixed: 125 pounds is "a commonly cited benchmark"; IV for EMTs "under the
#   national model"; practice 2 asks "which one should usually come first". Recheck of 16 reworded lines: one fix
#   (a hospital without a cath lab can still give clot dissolving drugs, so it "doesn't have the lab that can open that
#   artery with a thin tube"). Aspirin 4 x 81 mg chewed confirmed; oxygen only below 90 percent (AHA), many protocols 94.
#   Visual notes: colour change looks different on darker skin (show lips); EMTs may acquire a 12 lead, only paramedics
#   interpret it.
# HUMAN READ (independent agent): textbook lines rewritten (l5, j2, j3, m1, rc), a question added in l4 and j5, letter
#   clashes removed ("advanced EMT" beside EMT), vague pronouns fixed (why, l2, l4, m3), fewer "So" openers, one
#   "The trap is" varied.
# SHIP GATE 1 (spaCy en_core_web_sm; root a verb or auxiliary with a subject): 120 sentences, 0 flags (gate1.py).
# PRONUNCIATION: pronounce.py clean; abbreviations spoken as letters; to check on first voicing: "nitroglycerin",
#   "naloxone", "Ruiz", "Priya", "A E D", "I O".
"""Script for long video NREMT 02: EMS provider levels, the EMT's responsibilities, medical direction, certification,
quality improvement, public health and evidence based practice.
Source: levlprep.com/nremt/notes/introduction-to-ems.html sections 1.4, 1.5 and 1.6. Builds on NREMT 01 (history, the
system today, 911). Pilot format, premium standard, 2026-11-05 rules, SHORTS PARITY (2026-11-17), ship gates (2026-11-18),
pacing rules (2026-11-24: natural tempo, aim for 15:00, over is fine).
Story (runs through the whole video): Walt, 58, owns a small town hardware store and gets crushing chest pressure at his
counter on a Saturday morning. Four trained people help him in twenty minutes: Deputy Ruiz (EMR, first on scene), Priya
(EMT, the main person; the viewer is training for her job), her partner Marcus (AEMT) and Joan (paramedic, meets them on
the way). The puzzle: Priya has aspirin in her bag. Is she allowed to give it, or does she have to ask someone first?
Answer (chapter 3): a standing order (off line medical direction) covers the aspirin; helping with Walt's own
nitroglycerin needs a radio call (on line) in her system. The oxygen she does NOT give is the evidence example.
Each chapter: teaching, a story moment (story=True) where the idea happens, then a practice problem.
{n} marks a visual cue. 'pause' = seconds for pause and try beats. «spoken|shown» respellings. energy = delivery note.
"""
ID = "yt-nremt-02-provider-levels"

CHAPTERS = [
 dict(id="intro", title="Start here", beats=[
  dict(key="hook", story=True, energy="curious", vo="{1}Walt is fifty eight, and he's leaning on the counter of his hardware store, because his chest feels like something heavy is sitting on it. A customer has already called nine one one. {2}In the next twenty minutes, four trained people are going to help him, and each of them is allowed to do something the one before was not. {3}Priya is one of them. She's an «E M T|EMT», and she has aspirin in her bag that could help Walt right now. {4}[curious] So is she allowed to just give it... or does she have to ask somebody first?"),
  dict(key="promise", energy="warm", vo="By the end of this video, you'll know the four levels of providers in «E M S|EMS», which stands for emergency medical services. {1}You'll know what each level adds, {2}what an «E M T|EMT» is responsible for on every call, {3}and who gives an «E M T|EMT» permission to treat a patient."),
  dict(key="why", energy="steady", vo="[curious] So why should you care about this before you've touched a single patient? {1}Everything you'll ever do as an «E M T|EMT» happens inside the «E M S|EMS» system. {2}That system decides what you're allowed to do and who you answer to. {3}[warmly] The national exam asks about it too, and those questions get much easier once you see how the pieces fit."),
 ]),
 dict(id="levels", title="Four levels of training", beats=[
  dict(key="l1", energy="steady", vo="We'll start with who shows up. {1}People who give care before the hospital in the United States are trained to one of four national levels. {2}Each level includes everything in the level below it and then adds more, so you can picture them as four steps on a staircase."),
  dict(key="l2", energy="steady", vo="{1}The first step is the emergency medical responder, or «E M R|EMR». {2}An «E M R|EMR» is often the first trained person on scene, and many of them are police officers or firefighters. {3}An «E M R|EMR» calls in more help and gives basic care for the problems that kill fastest. That means opening the airway, which is the path air takes to the lungs, stopping heavy bleeding, and starting «C P R|CPR» with an «A E D|AED», a machine that can shock a heart out of a deadly rhythm."),
  dict(key="l3", energy="warm", vo="{1}The second step is the emergency medical technician, the «E M T|EMT», and that's the level you're training for. {2}In most places, it's the minimum certification for staffing an ambulance. {3}An «E M T|EMT» assesses the patient and gives basic care for illness and injury. That care includes oxygen and a short list of medications, and some of those are the patient's own prescriptions. Then the «E M T|EMT» transports the patient to the hospital."),
  dict(key="l4", energy="curious", vo="{1}[curious] So what does the third step add? That step is the advanced «E M T|EMT», or «A E M T|AEMT». {2}An advanced «E M T|EMT» does everything that an «E M T|EMT» does, and then adds a few advanced skills. {3}An «A E M T|AEMT» can start an «I V|IV», which is a line into a vein, or an «I O|IO», which is a line into a bone, so fluids can go straight in. An «A E M T|AEMT» can also place certain advanced airway devices and give several more medications."),
  dict(key="l5", energy="thoughtful", vo="{1}The top step is the paramedic. That's the highest of the four levels. {2}A paramedic has all the skills of the «E M T|EMT» and of the advanced «E M T|EMT». {3}[thoughtful] On top of those, a paramedic adds advanced assessment and decision making, like reading a tracing of the heart's electrical signals and choosing from a much LONGER list of drugs."),
  dict(key="l6", story=True, energy="warm", vo="{1}Those four steps are about to arrive at Walt's store. Deputy Ruiz, from the sheriff's office, gets there first. He's an «E M R|EMR», so he sits Walt down, keeps him calm, and sets an «A E D|AED» within reach. {2}Priya's ambulance pulls up next. She tells Walt her name, and she starts her assessment while her partner Marcus, who's an advanced «E M T|EMT», gets an «I V|IV» ready. {3}A paramedic named Joan is already driving out to meet them. {4}[warmly] So Walt gets four people at four levels, and each one adds something the last one couldn't."),
  dict(key="p1q", energy="curious", vo="[curious] Now it's your turn. {1}A patient needs an «I V|IV» started so she can get fluids. {2}What's the lowest level of provider who can start it? And which level is the usual minimum for staffing an ambulance?", pause=6),
  dict(key="p1a", energy="warm", vo="The «I V|IV» belongs to the advanced «E M T|EMT», because lines into a vein start at that third step. {1}The minimum for the ambulance is the «E M T|EMT». {2}[thoughtful] The trap is assuming that anyone on an ambulance can start an «I V|IV». An «E M T|EMT» gives important care, but under the national model, that skill sits one step higher."),
 ]),
 dict(id="job", title="What an EMT is responsible for", beats=[
  dict(key="j1", energy="serious", vo="So what is an «E M T|EMT» actually responsible for on a call? {1}The list has an order, and the order matters. {2}Your own safety comes first, and I know that can sound selfish. [serious] But an injured «E M T|EMT» can't help anybody, and now the scene has TWO patients. {3}Your crew comes next, for the same reason. The patient comes after that, and then the bystanders."),
  dict(key="j2", energy="steady", vo="{1}Once the scene is safe, assessment always comes before care, because you can't treat what you haven't found. {2}After care, you lift and move the patient safely, then you transport, and then you transfer care at the hospital. {3}You never leave a patient before that handoff is complete. And through all of it, you speak up for what the patient needs, which is called being the patient's advocate."),
  dict(key="j3", energy="thoughtful", vo="{1}Running through that list isn't enough by itself, though, because the job also takes judgment. {2}To think like an «E M T|EMT», you gather information from the scene, from your assessment, and from the patient, and then you put all of that together to decide. {3}When you don't have enough information, you ask more questions or examine the patient further before you act."),
  dict(key="j4", story=True, energy="thoughtful", vo="{1}Priya is doing exactly that with Walt. Before she reaches for the aspirin, she asks about allergies and bleeding problems. Aspirin makes blood clot less, which can help the heart but is dangerous for someone who already bleeds easily. {2}Then she has to think about where Walt should go. A heart attack happens when an artery that feeds the heart gets blocked. The nearest hospital is eight minutes away, but it doesn't have the lab that can open that artery with a thin tube. {3}A heart center that DOES is twenty five minutes away. {4}[thoughtful] The closest hospital isn't always the right one... so Priya's crew heads for the heart center, just as their local rules direct."),
  dict(key="j5", energy="warm", vo="{1}[curious] And what does the job ask from you, the person doing it? A commonly cited benchmark is being able to lift and carry about a hundred and twenty five pounds. {2}You need good eyesight, including color vision, since lips or skin turning pale or blue is a real clue. {3}[warmly] A good «E M T|EMT» also stays calm under pressure, listens without judging, and treats every patient fairly."),
  dict(key="p2q", energy="curious", vo="This one's for you to try. {1}You pull up to a car crash on a dark highway. The driver is slumped over the wheel, fuel is leaking, and traffic is still passing. {2}What's your first responsibility? And once you reach a patient, which one should usually come first, assessment or care?", pause=6),
  dict(key="p2a", energy="serious", vo="Your first responsibility is your own safety, so you deal with the traffic and the fuel before you go to the driver. {1}[serious] The trap is running straight to the patient, which is the instinct almost everyone has. {2}Then, as a general rule, you assess before you treat, because you can't treat what you haven't found."),
 ]),
 dict(id="behind", title="Who stands behind the EMT", beats=[
  dict(key="m1", energy="curious", vo="[curious] That brings us back to the question from the start. Who says Priya can give Walt anything at all? {1}Every «E M S|EMS» system operates under the authority of a physician, who is called the Medical Director. {2}The Medical Director has the final responsibility for patient care in that system. This physician writes the protocols, which are the written plans for treating each kind of problem, and also oversees the training and helps review the care. {3}When an «E M T|EMT» treats a patient, that «E M T|EMT» is acting on the physician's authority."),
  dict(key="m2", energy="steady", vo="{1}That authority reaches you in two ways, and together they're called medical direction. {2}The first is OFF line medical direction, which means standing orders. Those are written instructions that let you act without calling anyone, so nobody has to be on the line with you. {3}The second is ON line medical direction, where a physician on duty gives you an order in real time, over the phone or the radio."),
  dict(key="m3", story=True, energy="warm", vo="{1}Here's how both kinds look with Walt. Priya's protocols include a standing order for chest pain that might be coming from the heart. Once she's checked for allergies and bleeding, she hands him four small aspirin tablets to chew. {2}She doesn't have to ask anyone... because the physician already gave that order in writing. {3}Walt also carries his own nitroglycerin tablets. Nitroglycerin can drop a patient's blood pressure, so in Priya's system, the protocol says to call first. {4}She gets a physician on the radio, reports what she's found, and hears the order before she helps Walt take one."),
  dict(key="m4", energy="steady", vo="{1}The Medical Director also checks how the care went. After a call, the «E M T|EMT» writes a report, and the Medical Director's team reviews reports like that one to find problems and fix them. {2}[warmly] So the physician you rarely see is there before the call, in the protocols, and after the call, in the review."),
  dict(key="p3q", energy="curious", vo="[curious] It's your turn again. {1}Naloxone is a drug that reverses an opioid overdose. Your protocol says that you may give it to a patient with a suspected overdose, and you don't need to call anyone. {2}Which kind of medical direction are you using? And if you radio a physician for an order instead, which kind is that?", pause=6),
  dict(key="p3a", energy="thoughtful", vo="The naloxone is off line medical direction, because it's a standing order. {1}The radio call is on line medical direction, since the order comes from a physician in real time. {2}[thoughtful] This is where people slip. They think that off line means no doctor is involved. The physician IS involved, and simply gave the order ahead of time, in writing."),
 ]),
 dict(id="recap", title="The whole system in one picture", beats=[
  dict(key="rc", energy="steady", vo="We can put the whole system in one picture. {1}There are four levels, the emergency medical responder, the «E M T|EMT», the advanced «E M T|EMT», and the paramedic, and each one adds to the level below. {2}On a call, your safety comes first, and assessment comes before care. {3}[warmly] And a physician called the Medical Director stands behind everything you do, through standing orders, which are off line, and through real time orders, which are on line."),
 ]),
 dict(id="outro", title="Next: staying certified", beats=[
  dict(key="end", story=True, energy="warm", vo="{1}Joan meets the ambulance on the road and climbs in. Marcus already has the «I V|IV» running, so the line is ready for her. Twenty minutes after the call for help, she reads Walt's heart tracing, and she warns the heart center that he's coming. {2}Four people at four levels took care of him, and a Medical Director none of them saw that day stood behind every step. [softly] The heart center opens his blocked artery, and Walt goes home three days later. {3}You'll find the notes and practice for this topic, free, on «levl prep dot com|levlprep.com». {4}And next time, we'll cover how you stay certified, how «E M S|EMS» checks its own care, and why Priya never gave Walt any oxygen."),
 ]),
]

import re
_CAPS_KEEP = {'AP', 'EMT', 'EMR', 'AEMT', 'EMS', 'NREMT', 'IV', 'IO', 'CPR', 'QI', 'EMTs', 'AED'}
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
