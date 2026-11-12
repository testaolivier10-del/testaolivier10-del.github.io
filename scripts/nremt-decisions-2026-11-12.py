"""Apply the owner's NREMT content decisions of 2026-11-12 to the notes and lessons.

Decision log: docs/nremt-reviews/decisions-2026-11-12.md. Every find must occur exactly once
(or the stated number of times) or the script stops without writing anything.
Run once: python3 scripts/nremt-decisions-2026-11-12.py
"""
import json, re, sys

NOTES = 'nremt/assets/study-notes.json'
notes = json.load(open(NOTES))

def strings(o, path=()):
    if isinstance(o, dict):
        for k, v in o.items():
            yield from strings(v, path + (k,))
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from strings(v, path + (i,))
    elif isinstance(o, str):
        yield path, o

def setp(root, path, val):
    for k in path[:-1]:
        root = root[k]
    root[path[-1]] = val

def rep(root, find, new, n=1, label=''):
    hits = [(p, s) for p, s in strings(root) if find in s]
    total = sum(s.count(find) for _, s in hits)
    if total != n:
        sys.exit(f'STOP {label!r}: expected {n}, found {total}: {find[:80]!r}')
    for p, s in hits:
        setp(root, p, s.replace(find, new))

R = lambda f, n_, label='', n=1: rep(notes, f, n_, n, label)

# Ch 1
R('No care was given at the scene.', 'Its purpose was transport to the surgeons, not care at the scene.', 'ch1')
# Ch 2 TB
R('<td>Highly contagious; assume any productive cough = possible TB</td>',
  '<td>Airborne; usually needs prolonged close contact. Assume any productive cough = possible TB</td>', 'ch2 tb')
# Ch 4 and Ch 25: capacity, not a flat rule
R('<strong>a patient intoxicated by alcohol or drugs cannot give a valid informed refusal.</strong>',
  '<strong>a patient whose decision-making capacity is impaired by alcohol, drugs, illness or injury cannot give a valid informed refusal.</strong> Assess capacity rather than assuming it either way, and involve medical direction per local protocol.', 'ch4 refusal')
R('Remember as well that a patient under the influence of alcohol cannot make an informed refusal of care.',
  'Remember as well that alcohol and drugs can take away a patient\'s capacity to make an informed refusal: do not simply accept a refusal from an intoxicated patient; assess capacity and follow local protocol and medical direction.', 'ch25 refusal')
R('An alcohol- or drug-intoxicated patient cannot give a valid informed refusal.',
  'Intoxication can remove decision-making capacity: assess capacity and contact medical direction before accepting a refusal.', 'ch25 takeaway')
# Ch 4 DNR
R('typically signed by both the patient and a physician, stating that the patient has a terminal illness and does not want resuscitative efforts.',
  'typically signed by the patient (or the patient\'s legal decision maker) and a physician, stating that the patient does not want resuscitative efforts. It is often written for a patient with a terminal illness, and who may have one is set by state law. If family members demand resuscitation despite a valid DNR, contact medical direction and follow local protocol on whether to begin resuscitation while you call.', 'ch4 dnr')
# Ch 6 and 7 acidosis
R("which injures cells and impairs the blood's ability to carry oxygen.", 'which injures cells and disrupts their function; untreated, it worsens shock.', 'ch6 acidosis')
R('The lactic acid it produces causes acidosis, and in an acidotic environment hemoglobin carries less oxygen. Less oxygen means worsening hypoxia, and the spiral continues downward.',
  "The lactic acid it produces causes acidosis, which injures cells and disrupts their function, including the heart's ability to pump. Weaker perfusion means worsening hypoxia, and the spiral continues downward.", 'ch7 acidosis')
# Ch 6 mastectomy: keep the exam answer, add when another arm is available
R('never take a blood pressure (BP) on the affected arm of a patient who has had a mastectomy, because lymphatic tissue has been removed from the armpit and the pressure of the cuff is a risk.',
  'do not take a blood pressure (BP) on the affected arm of a patient who has had a mastectomy when another arm is available, because lymphatic tissue has been removed from the armpit.', 'ch6 mastectomy')
# Ch 8 lifespan
R('Heart disease is the major killer after age 40.', 'Heart disease and cancer become the leading causes of death.', 'ch8 killer')
ch8 = notes['chapters'][7]
done = False
for s in ch8['sections']:
    for t in s['topics']:
        if not done and '</table></div>' in t['html']:
            t['html'] = t['html'].replace('</table></div>', '</table></div><p class="sub">Normal ranges vary by source (these follow the standard EMT text; AHA PALS tables differ slightly). The exam tests the trend: rates fall and blood pressure rises with age.</p>', 1)
            done = True
assert done, 'ch8 table'
# Ch 9 BVM order
R('work through the causes in this order, because the common ones come first:',
  'work through the causes starting with the two most common, the mask seal and the head position, which you check together:', 'ch9 bvm')
# Ch 10 valve
R('Open the valve fully, then back it off slightly.', 'Open the valve slowly and fully, following the manufacturer and local protocol.', 'ch10 valve')
# Ch 11 scene size-up stays four, note the skill sheet
R('and the number of patients together with the resources they will need.</p>',
  'and the number of patients together with the resources they will need. (The NREMT skill sheet lists determining the need for additional resources as its own step; the content is the same.)</p>', 'ch11')
# Ch 14 bowel sounds
R('Inspect the abdomen, auscultate for bowel sounds before you palpate, and then palpate the quadrants',
  'Inspect the abdomen, then palpate the quadrants', 'ch14 bowel')
# Ch 15 collars
R('A cervical collar must be rigid and correctly sized; soft collars have no role in prehospital care.',
  'A cervical collar must be rigid and correctly sized; that is the standard teaching and the exam answer, though some systems now use selective spinal motion restriction per protocol (2018 ACS-COT, ACEP and NAEMSP statement).', 'ch15 collar')
# Ch 16 FIRR label dropped, content kept
R('can be summarized by the four steps of FIRR: field impression, interventions, reassessments and report.',
  'can be summarized in four steps: field impression, interventions, reassessments and report.', 'ch16 firr')
R('Trending & FIRR', 'Trending & care after the assessment', 'ch16 heading')
R('Trending, Intervals & FIRR', 'Trending, Intervals & Care After Assessment', 'ch16 title')
leftover = [p for p, s in strings(notes) if 'FIRR' in s]
assert not leftover, f'FIRR left at {leftover}'
# Ch 18 nitro threshold
R('the systolic blood pressure is above the threshold,', 'the systolic blood pressure is above the threshold your protocol sets (commonly 100 mmHg),', 'ch18 sbp')
# Ch 19 MDI and croup
R('Wait 15–30 seconds between doses.', 'Wait about 1 minute between puffs, as the device label directs.', 'ch19 mdi')
R("<td>Don't put anything in the mouth — risk of vocal cord spasm</td>",
  "<td>Keep the child calm in a position of comfort; humidified O2 per protocol; do not look in the throat</td>", 'ch19 croup')
# Ch 20 ACS
R('the patient has taken no erectile dysfunction (ED) medication within 48–72 hours,',
  'the patient has taken no erectile dysfunction (ED) medication within the window your protocol sets (ACC/AHA: 24 hours for sildenafil or vardenafil, 48 hours for tadalafil; many protocols use 48 hours for any),', 'ch20 ed')
R('if the patient already took aspirin earlier today,', 'if the patient already took a full dose for this episode (follow local protocol for a patient on daily low-dose aspirin),', 'ch20 aspirin')
# Ch 21
R('The analysis phase usually requires about 15 to 20 seconds during which no one touches the patient.',
  'The analysis takes several seconds, depending on the device, and no one touches the patient while it runs.', 'ch21 aed')
R('<td>&gt;85%</td>', '<td>Most adult arrests</td>', 'ch21 85')
R('only about 20% of pediatric arrests result from a sudden dysrhythmia.', 'only a minority result from a sudden dysrhythmia.', 'ch21 peds')
R('Systems that practice it can push survival from witnessed arrest above 50%, against a national average under 15%.',
  'Nationally only about 1 in 10 people who arrest outside a hospital survive to leave it; systems that practice high-performance CPR do far better, especially for a witnessed arrest with a shockable rhythm.', 'ch21 survival')
# Ch 22 oral glucose (National Model EMS Clinical Guidelines; 2024 AHA and Red Cross first aid)
R('<li>The patient has a history of diabetes.</li>',
  '<li>The patient has a measured low blood glucose, or a history of diabetes that makes low glucose likely.</li>', 'ch22 glucose')
# Ch 24 communicable disease table: airborne vs droplet (CDC isolation precautions)
R('<td>Airborne, contact with sores</td>', '<td>Airborne (N-95), contact with sores</td>', 'ch24 pox')
R('<td>Measles</td><td>Airborne droplets</td>', '<td>Measles</td><td>Airborne (N-95)</td>', 'ch24 measles')
R('<td>Airborne droplets, contact</td>', '<td>Droplets (surgical mask), contact</td>', 'ch24 flu')
R('<td>Airborne droplets, fomites</td>', '<td>Droplets, fomites</td>', 'ch24 croup')
R('<td>Pertussis</td><td>Airborne droplets</td>', '<td>Pertussis</td><td>Droplets (surgical mask)</td>', 'ch24 pertussis')
R('<td>Tuberculosis</td><td>Airborne droplets</td>', '<td>Tuberculosis</td><td>Airborne (N-95)</td>', 'ch24 tb')
R('Influenza spreads both by airborne droplets and by contact.', 'Influenza spreads by respiratory droplets and by contact.', 'ch24 flu text')
R('After an exposure, report it to the receiving hospital and have a baseline skin test done, followed by a repeat test later.',
  "After an exposure, report it to your service's designated infection control officer, who follows up with the receiving hospital, and have a baseline TB test (a skin or blood test) done, followed by a repeat test later.", 'ch24 tb report')
# Ch 25 CO
R('The cherry-red skin of the older textbooks is a myth and is not typically seen.',
  'Cherry-red skin is a rare, late sign that is not typically seen, so never wait for it.', 'ch25 co')
# Ch 26 abdomen
R('Tearing pain can be produced by only two structures, the aorta and the stomach, so a patient who describes a tearing pain should make you think of an abdominal aortic aneurysm, which classically produces tearing back pain, or of a perforating stomach ulcer.',
  'Tearing pain points first to the aorta, so a patient who describes tearing pain, classically felt through to the back, should make you think of an aortic aneurysm or dissection.', 'ch26 tearing')
R('and the pulses may be unequal between the limbs.', 'and the leg pulses may be weak, absent or unequal.', 'ch26 aaa')
R('classically begins with nausea, followed by pain that starts around the umbilicus and then migrates',
  'classically begins with pain around the umbilicus, then nausea and vomiting, and the pain then migrates', 'ch26 appendix')
R('can be up to 9 times higher than in a younger patient', 'is much higher than in a younger patient', 'ch26 9x')
# Ch 27 restraint and psychosis
R('Use a minimum of 4 rescuers, one for each limb.', 'Use at least 4 rescuers, one for each limb, and ideally a fifth at the head, per local protocol.', 'ch27 rescuers')
R('It is associated with schizophrenia and is defined',
  'It is seen in schizophrenia but also with bipolar disorder, severe depression, substance use and medical illness, and it is defined', 'ch27 psychosis')
ch27 = notes['chapters'][26]
assert ch27['num'] == 27
sec = ch27['sections'][0]
psy = next(t for t in sec['topics'] if t['heading'] == 'Acute psychosis')
psy['html'] += ('<p>What the patient hears or believes is real to the patient. Do not argue with a delusion or a hallucination, '
                'and do not pretend to share it; stay calm, respectful and honest, acknowledge how the patient feels, and keep assessing.</p>')
if not any(t['heading'] == 'Suicide risk' for t in sec['topics']):
    sec['topics'].append({'heading': 'Suicide risk', 'html': (
        '<p>Treat every mention of suicide as serious. Many people who die by suicide told someone or showed warning signs first, '
        'and asking about it directly does not put the idea in anyone\'s head. Ask plainly and without judgment: '
        '"Are you thinking about killing yourself?" Then listen.</p>'
        '<p><strong>Warning signs</strong> include talking about wanting to die or being a burden, feeling hopeless or trapped, '
        'giving away belongings or saying goodbye, withdrawing from people, sudden calm after a period of depression, '
        'and increased alcohol or drug use. <strong>Risk factors</strong> include a previous attempt, depression or another mental '
        'illness, substance use, chronic pain or serious illness, a recent major loss, social isolation, and access to lethal means.</p>'
        '<p><strong>Care.</strong> Scene safety comes first: the patient may be a danger to you as well as to themselves, and police may '
        'need to secure the scene. After an attempt, treat the medical and traumatic injuries before anything else. Do not leave the '
        'patient alone, stay calm and respectful, and ask family or police to remove or secure anything the patient could use to harm '
        'themselves. The patient should be transported for evaluation; handling a refusal follows local protocol and medical direction. '
        'Use respectful language: say "died by suicide" or "attempted suicide", not "committed" or "failed".</p>'
        '<p class="sub">The 988 Suicide and Crisis Lifeline (call or text 988 in the US) is available 24 hours a day for patients, families '
        'and for EMTs themselves after a hard call.</p>')})
# Ch 26 renal arrest
R('Cardiac arrest in an ESRD patient may not respond to standard defibrillation.',
  'If an ESRD patient arrests, give standard CPR and AED care, and tell ALS and the hospital about any missed dialysis, because high potassium makes the arrest harder to reverse and needs treatment they can give.', 'ch28 renal')
# Ch 36 third stage of labor
ch36 = notes['chapters'][35]
st = next(t for t in ch36['sections'][0]['topics'] if t['heading'].startswith('Labor & delivery'))
if 'fundal massage' not in st['html']:
    st['html'] += ('<p><strong>The third stage.</strong> The placenta usually delivers within about 30 minutes of the birth. Never pull on the cord; '
                   'let it deliver on its own, then place it in a bag and bring it to the hospital so it can be checked. Expect up to about '
                   '500 mL of blood loss. If bleeding is heavier, massage the uterus firmly through the abdomen (fundal massage), let the mother '
                   'breastfeed if she wishes, treat for shock and transport, and do not wait at the scene for the placenta.</p>')
# Ch 37 devices and abuse
R('cover the opening with an occlusive dressing and transport the patient.', 'cover the opening with a clean dressing and transport the patient.', 'ch37 tube')
m_old = 'Never disclose your suspicion to the victim or to anyone else on the scene, and report immediately to law enforcement instead.'
R(m_old, 'Do not confront the companion or voice your suspicion on the scene. For a child, report to law enforcement at once. For an adult, speak with the patient alone when it is safe, offer the hotline, and report as state law and agency policy direct.', 'ch37 traffick')
R('Never disclose suspicion of trafficking to the victim or anyone on scene — it escalates danger.',
  'Never confront the companion or voice suspicion on scene: children are reported to law enforcement; adults are offered help alone and reported per state law.', 'ch37 traffick takeaway')
vad_hits = [(p, s) for p, s in strings(notes) if s.count('<tr><td>VAD</td>') == 1]
assert len(vad_hits) == 1, 'vad'
p, s = vad_hits[0]
i = s.index('<tr><td>VAD</td>'); j = s.index('</td></tr>', i)
if 'VAD coordinator' not in s:
    setp(notes, p, s[:j] + '. Bring the controller, spare batteries and the caregiver, and call the VAD coordinator number on the device' + s[j:])
# Ch 38 operations
R('less than 5% of transports genuinely require them, so ask on each call whether this one does.',
  'they save from under a minute to about 4 minutes while raising the risk of a crash, and only a small share of transports truly need them, so ask on each call whether this one does.', 'ch38 lights')
R('Less than 5% of ambulance transports genuinely require lights and siren.',
  'Only a small share of transports truly need lights and siren; they save little time and raise crash risk.', 'ch38 lights takeaway')
R('and one across the lower extremities.', 'and one across the lower extremities, plus the over-the-shoulder straps whenever the stretcher has them (NHTSA and NASEMSO guidance).', 'ch38 straps')
R('sits on a slope of less than 8 degrees,', 'sits on ground as level as possible (the flight service sets the limits),', 'ch38 lz')

# Ch 34 field triage: keep the thresholds students must know, summarize the lists in our own words, link ACS
ft = next(t for s in notes['chapters'][33]['sections'] for t in s['topics'] if t['heading'].startswith('Field triage'))
h = ft['html']
a = h.index('<p><strong>Red: injury patterns.</strong>'); b = h.index('<div class="table-wrap">', a)
h = h[:a] + ('<p><strong>Red: injury patterns.</strong> In short, the serious injuries: penetrating wounds of the head, neck, torso or upper limbs '
             'and thighs, skull and spinal injuries with deficits, an unstable chest or pelvis, multiple long bone fractures, a mangled or '
             'pulseless limb or a high amputation, and bleeding that needs a tourniquet or packing.</p>') + h[b:]
a = h.index('<p><strong>Yellow: mechanism of injury.</strong>'); b = h.index('<p><strong>Yellow: EMS judgment.</strong>')
h = h[:a] + ('<p><strong>Yellow: mechanism of injury.</strong> High-energy events: a serious vehicle crash (ejection, major intrusion, '
             'entrapment, a death in the same compartment, an unrestrained young child), a rider thrown from a motorcycle, ATV or horse, '
             'a pedestrian or cyclist struck hard, and a fall from more than 10 ft (3 m).</p>') + h[b:]
a = h.index('<p><strong>Yellow: EMS judgment.</strong>'); b = h.index('</p>', a) + 4
h = h[:a] + ('<p><strong>Yellow: EMS judgment.</strong> Risk factors that make the same forces more dangerous, such as older age or a young '
             'child with a head strike, anticoagulant use, pregnancy beyond 20 weeks, suspected child abuse, and burns with trauma. Injured '
             'children go preferentially to pediatric-capable trauma centers.</p>') + h[b:]
h = h.replace('and the vital-sign thresholds above are the ones to know.</p>',
              'and the vital-sign thresholds above are the ones to know. The complete criteria are published by the American College of Surgeons: '
              '<a href="https://www.facs.org/quality-programs/trauma/systems/field-triage-guidelines/" rel="noopener">ACS field triage guidelines</a>.</p>')
assert 'facs.org' in h, 'triage link'
ft['html'] = h

open(NOTES, 'w').write('{\n"chapters": [\n' + ',\n'.join(json.dumps(c, ensure_ascii=False, separators=(',', ':')) for c in notes['chapters']) + '\n]\n}\n')

# Lessons
def lesson(name):
    p = f'nremt/data/lessons/{name}.json'; return p, json.load(open(p))
p, L = lesson('reassessment-and-trending')
rep(L, '<b>FIRR</b> sums up care after the assessment: Field impression', '<b>Care after the assessment</b> comes in four steps: Field impression', label='lesson firr')
rep(L, 'In FIRR, what is the field impression?', 'What is a field impression?', label='lesson firr q')
rep(L, 'Care after the assessment follows FIRR: field impression', 'Care after the assessment comes in four steps: field impression', label='lesson firr summary')
assert not [x for _, x in strings(L) if 'FIRR' in x], 'FIRR left in lesson'
open(p, 'w').write(json.dumps(L, ensure_ascii=False, indent=2) + '\n')
p, L = lesson('multisystem-trauma-and-field-triage')
for i, s in enumerate(L['ideas']):
    if s.startswith('<b>Red criteria, injury patterns:</b>'):
        L['ideas'][i] = ('<b>Red criteria, injury patterns:</b> the serious injuries, such as penetrating wounds of the head, neck, torso or upper '
                         'limbs and thighs, skull or spinal injury with deficits, an unstable chest or pelvis, multiple long bone fractures, a mangled '
                         'or pulseless limb, and bleeding that needs a tourniquet or packing.')
    if s.startswith('<b>Yellow criteria, mechanism:</b>'):
        L['ideas'][i] = ('<b>Yellow criteria, mechanism:</b> high-energy events, such as a serious crash with ejection, major intrusion or '
                         'entrapment, a rider thrown from a motorcycle or horse, a pedestrian or cyclist struck hard, or a fall from more than 10 feet. '
                         'The full lists are in the American College of Surgeons field triage guideline.')
open(p, 'w').write(json.dumps(L, ensure_ascii=False, indent=2) + '\n')
print('ok')

# Question bank decisions (needs-decision list, second half). Ids are kept: no item is deleted, because
# answer history and stats are keyed by id; near duplicates and above-scope items stay as they are.
QP = 'nremt/assets/questions.json'
raw = open(QP).read()
qs = json.loads(raw)
Q = {i['id']: i for i in qs}
def qrep(qid, field, find, new, idx=None):
    obj = Q[qid]
    if idx is None:
        assert obj[field].count(find) == 1, f'q{qid} {field}: {find[:60]!r}'
        obj[field] = obj[field].replace(find, new)
    else:
        assert obj[field][idx].count(find) == 1, f'q{qid} {field}[{idx}]'
        obj[field][idx] = obj[field][idx].replace(find, new)
qrep(801, 'q', 'presents with generalized weakness. The cardiac monitor your paramedic partner has applied shows tall, peaked T waves, and his pulse is irregular.',
     'presents with generalized weakness and an irregular pulse.')
qrep(661, 'q', 'For a patient to meet the field definition of anaphylaxis rather than a milder allergic reaction, which combination of findings is required?',
     'Which combination of findings most clearly indicates anaphylaxis rather than a milder allergic reaction?')
qrep(1448, 'q', 'a suspected infectious illness?', 'a suspected infectious respiratory illness?')
Q[536]['options'][1] = 'Wait for ALS to arrive before covering the wound'
Q[536]['options'][2] = 'Cover it with a gloved hand, then a chest seal or occlusive dressing'
Q[536]['explain'] = ('Seal the wound at once: a gloved hand first, then a vented chest seal or an occlusive dressing reaching about 2 inches past the wound, per local protocol. '
                     'Whichever is used, watch for tension pneumothorax and lift an edge (burp the dressing) if the patient worsens. Leaving the wound open, packing it, '
                     'or waiting for ALS all let air keep entering the chest.')
qrep(538, 'explain', 'three or more adjacent ribs', 'two or more adjacent ribs (some texts say three or more)')
qrep(1672, 'q', 'when a patient dies in the ambulance during transport?', 'when a patient goes into cardiac arrest in the ambulance during transport?')
Q[1150]['options'][1] = 'Pushed blindly deep past the base of the tongue'
qrep(1150, 'explain', 'Midline insertion and upward angling both provoke the gag reflex,', 'Midline insertion and blind deep insertion both provoke gagging or injury,')
qrep(15, 'q', 'SpO2 of 88%', 'SpO2 of 91%')
qrep(934, 'q', 'an SpO2 of 95% on room air', 'an SpO2 of 91% on room air')
qrep(934, 'explain', 'A patient already at 95% likely needs little', 'A patient at 91% needs only a little')
qrep(1723, 'q', 'Which of the following would most likely be considered an ethical rather than a legal obligation?',
     'Which of the following is primarily an ethical rather than a legal obligation?')
Q[2018]['options'][1] = 'Secure the leg with the rest of the body on a long board, scoop or vacuum mattress and transport rapidly'
qrep(2018, 'explain', 'during full-body immobilization', 'during spinal motion restriction')
Q[1659]['options'][2] = 'Don high-visibility and protective equipment before stepping out'
qrep(572, 'options', ', especially when the transport time is extended', '', 3)
qrep(1828, 'options', ', continuing this approach for the rest of the transport', '', 2)
qrep(1898, 'options', ', most often seen after a low-speed collision', '', 1)
qrep(1917, 'options', ', especially when the transport time is extended', '', 2)
qrep(425, 'q', 'opens his eyes only in response to pain,', 'opens his eyes only in response to pain (called "to pressure" in the 2014 revision of the scale),')
Q[445]['explain'] += ' The 2014 revision of the scale calls this response "to sound"; the score is the same.'
Q[24]['explain'] += ' Texts differ: some teach 15 seconds for an adult, others no more than 10; local protocol sets the number.'
Q[1909]['explain'] += ' Some hemorrhage control courses now teach removing soaked gauze to repack or press directly on the bleeding point; follow local protocol.'
Q[1088]['explain'] += ' Some EMT texts allow up to 15 seconds for an adult; local protocol sets the limit.'
Q[1426]['topic'] = 'Cardiac'
Q[665]['topic'] = 'Bleeding & Shock'; Q[665]['system'] = 'Trauma'
Q[2162]['topic'] = 'Trauma Systems & Special Situations'; Q[2162]['system'] = 'Trauma'
lines = raw.split('\n')
assert lines[0] == '[' and raw.endswith(']\n'), 'questions format'
open(QP, 'w').write('[\n' + ',\n'.join(json.dumps(i, ensure_ascii=False, separators=(',', ':')) for i in qs) + '\n]\n')
print('questions ok')
