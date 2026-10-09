/* The 3D body: model, picking, layers and the "find it on the model" hunt.

   One module so any page can embed the same model the body map uses:

     var v = LevlBodyViewer.mount(el, {
       base:     'assets/',          // where body3d.glb and vendor/three live (default: next to this file)
       autoload: 'visible',          // 'visible' (default) | 'now' | 'tap'
       systems:  ['cardio','resp'],  // body systems shown at start (default: all six)
       skin:     true,               // translucent skin layer
       hint:     'Click any part to select it',   // false for none
       focus:    'heart',            // select and frame this structure once ready
       onSelect: function(key, info){},   // a structure was selected (null = cleared)
       onPick:   function(key, info){},   // the canvas was clicked on a structure
       onLoad:   function(){},
       pickSelects: true             // false: a canvas pick only fires onPick
     });
     v.select('Heart'); v.find('liver'); v.highlight(['Heart','Aorta']); v.clear(); v.reset();
     v.setSystems(['cardio']); v.setSkin(false); v.structures(); v.info(key); v.on('select', fn);
     v.hunt({ panel, live, onAnswer, onStop }).start() / .stop() / .active()

   Names are the labels in the body map's Browse-by-name list, matched
   case-insensitively; keys work too. The host page needs the three.js import
   map (body-map.html has it); if it is missing, mount() adds one.

   three.js and the model are NOT imported up front. Together they are about
   4 MB (3.3 MB of model, 670 KB of three.js), and everything else on a page —
   the list of structures, the info panel, the quiz — is plain data that works
   without either. So those work at once, and the 3D viewer is fetched when it
   scrolls into view, or, on a data-saver or 2G/3G connection, only when the
   reader taps to load it. */
(function(){
  'use strict';
  var SCRIPT_BASE = (function(){
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^/]*$/, '') : 'assets/';
  })();

  // Generated content: one entry per structure group, the model's part ids, and the point landmarks.
  const GROUP_CONTENT = {"frontal_bone":{"name":"Frontal bone","system":"msk","kind":"bone","location":"The forehead region of the skull.","funct":"Protects the frontal lobes of the brain and forms the upper eye sockets.","path":"Fractures here can occur from direct frontal impact and may be associated with underlying brain injury.","findings":"Deformity, swelling, or bruising over the forehead; assess mental status closely given proximity to the brain.","interv":"Manage as a potential head injury: monitor airway and mental status, control any external bleeding, and transport promptly.","color":15128760},"parietal_bones":{"name":"Parietal bones","system":"msk","kind":"bone","location":"The paired bones forming the sides and roof of the skull, between the frontal and occipital bones.","funct":"Form the largest portion of the skull's protective vault around the brain.","path":"A common site of skull fracture from a direct blow or fall; the middle meningeal artery runs just beneath the thin temporal edge, so a fracture here raises concern for epidural hematoma.","findings":"Scalp swelling, deformity, or tenderness; a brief lucid interval followed by rapid deterioration suggests an epidural bleed.","interv":"Maintain spinal motion restriction if mechanism warrants, monitor mental status and pupils closely, and transport promptly — a deteriorating patient needs rapid transport to a trauma center.","color":15128760},"temporal_bones":{"name":"Temporal bones","system":"msk","kind":"bone","location":"The paired bones at the sides of the skull, housing the ear structures.","funct":"Protects the middle and inner ear and forms part of the jaw joint.","path":"Two different injuries share this bone. A fracture through the thin squamous portion at the side of the skull can tear the middle meningeal artery running beneath it, which is the classic cause of an epidural hematoma. A fracture through the petrous portion at the skull base is a basilar skull fracture, which disrupts the ear and produces Battle’s sign and CSF leak. The two are not the same injury and do not present the same way.","findings":"Battle's sign (bruising behind the ear), blood or clear fluid (CSF) from the ear canal, or hearing loss.","interv":"Do not pack the ear canal — loosely cover any drainage, maintain spinal motion restriction, monitor mental status closely, and transport promptly.","color":15128760},"occipital_bone":{"name":"Occipital bone","system":"msk","kind":"bone","location":"The back and base of the skull.","funct":"Protects the back of the brain and the area where the spinal cord exits the skull.","path":"Fractures here can occur from a fall backward or a direct blow to the back of the head, and may involve the brainstem given the location.","findings":"Tenderness, deformity, or bruising at the back/base of the skull; assess mental status and pupils closely.","interv":"Maintain spinal motion restriction, monitor airway and mental status closely, and transport promptly.","color":15128760},"mandible":{"name":"Mandible","system":"msk","kind":"bone","location":"The lower jawbone.","funct":"Forms the lower jaw and anchors the lower teeth; its position is manipulated during a jaw-thrust maneuver.","path":"A common facial fracture site, especially from a direct blow or fall onto the chin.","findings":"Malocclusion (teeth not lining up normally), pain with jaw movement, or visible deformity/swelling along the jawline.","interv":"Monitor the airway closely (bilateral mandible fractures can compromise it), and use a jaw-thrust rather than head-tilt if spinal injury is also suspected.","color":15128760},"cervical_spine":{"name":"Cervical spine (C1–C7)","system":"msk","kind":"bone","location":"The neck portion of the vertebral column, 7 vertebrae between the skull and the upper back.","funct":"Supports the head and protects the cervical spinal cord running through it.","path":"The focus of spinal motion restriction after a significant mechanism of injury, given the risk of cord injury.","findings":"Neck pain, tenderness, or any neurological deficit (numbness, weakness) in the arms or legs.","interv":"Apply a cervical collar and full spinal motion restriction per current protocol; maintain in-line stabilization during airway management.","color":15128760},"thoracic_spine":{"name":"Thoracic spine (T1–T12)","system":"msk","kind":"bone","location":"The mid-back portion of the vertebral column, 12 vertebrae each paired with a rib.","funct":"Supports the rib cage and protects the thoracic spinal cord.","path":"Can be injured in falls or high-force trauma; associated rib fractures are common given the rib attachments.","findings":"Mid-back pain/tenderness, or any neurological deficit in the legs.","interv":"Spinal motion restriction per protocol; assess for associated chest wall injury.","color":15128760},"lumbar_spine":{"name":"Lumbar spine (L1–L5)","system":"msk","kind":"bone","location":"The lower back portion of the vertebral column, 5 vertebrae between the thoracic spine and sacrum.","funct":"Bears significant body weight and protects the lower spinal cord and nerve roots.","path":"A common site of both traumatic injury and everyday non-traumatic lower back pain.","findings":"Lower back pain, and — in trauma — any leg weakness, numbness, or loss of bowel/bladder control.","interv":"Spinal motion restriction per protocol for a traumatic mechanism; for non-traumatic back pain, focus on comfortable positioning and transport.","color":15128760},"sacrum":{"name":"Sacrum & coccyx","system":"msk","kind":"bone","location":"The fused triangular bone at the base of the spine, ending in the small tailbone (coccyx).","funct":"Connects the spine to the pelvis and bears weight when sitting.","path":"Can be fractured or bruised in a fall onto the buttocks.","findings":"Pain and tenderness at the very base of the spine, worse with sitting.","interv":"Spinal motion restriction per protocol if the mechanism is significant; otherwise, position for comfort and transport.","color":15128760},"spinal_cord":{"name":"Spinal cord","system":"neuro","kind":"organ","location":"Runs through the protective canal formed by the vertebral column, from the base of the brain to the lower back.","funct":"The main communication pathway between the brain and the rest of the body, organized by level (cervical, thoracic, lumbar, sacral) corresponding to the body regions each part serves.","path":"Traumatic spinal cord injury (partial or complete) from a significant mechanism of injury to the head, neck, or back.","findings":"Numbness, tingling, weakness, or paralysis below the level of injury; possibly bowel/bladder involvement.","interv":"Spinal motion restriction per current protocol, careful handling to avoid worsening injury, and prompt transport.","color":15391142},"sternum":{"name":"Sternum","system":"msk","kind":"bone","location":"The breastbone, running down the center of the chest; its upper portion (the manubrium) is where the collarbones attach.","funct":"Part of the bony chest wall, protecting the heart and great vessels that lie just behind it.","path":"Can fracture from direct blunt chest trauma (e.g., a steering wheel impact), which raises concern for underlying cardiac or great-vessel injury.","findings":"Point tenderness or deformity over the upper chest, especially after a high-force mechanism.","interv":"Monitor closely for signs of underlying cardiac/pulmonary injury (irregular pulse, respiratory distress); treat as a high-priority trauma patient.","color":15128760},"rib_cage":{"name":"Rib cage","system":"msk","kind":"bone","location":"The 12 paired ribs and their cartilage, encircling the chest from the spine to the sternum.","funct":"Protects the heart and lungs and drives breathing through its expansion and recoil.","path":"Rib fractures from blunt chest trauma; two or more adjacent ribs each broken in two or more places create a flail segment, and any fracture risks underlying lung injury (pneumothorax, hemothorax). Lower ribs guard solid organs: on the left, the spleen; on the right, the liver. Lower rib fractures on either side should raise suspicion for internal bleeding from the organ beneath them.","findings":"Localized pain worse with breathing or palpation, shallow breathing, or paradoxical (inward-on-inspiration) movement of a flail segment.","interv":"Support ventilation, allow a position of comfort, treat a flail segment by supporting the segment and providing high-flow oxygen or ventilatory support, and watch closely for signs of pneumothorax.","color":15128760},"clavicle":{"name":"Clavicle","system":"msk","kind":"bone","location":"The collarbone, running horizontally between the sternum and shoulder.","funct":"Connects the arm to the trunk skeleton and helps hold the shoulder in position.","path":"One of the most common fracture sites, especially from a fall onto an outstretched arm or the point of the shoulder.","findings":"Visible deformity, swelling, or the patient holding the arm close to the body to guard the injury.","interv":"Support the arm in a position of comfort with a sling and swathe; check distal PMS before and after.","color":15128760},"scapula":{"name":"Scapula","system":"msk","kind":"bone","location":"The shoulder blade, on the upper back.","funct":"Anchors many shoulder and upper back muscles and forms part of the shoulder joint.","path":"Fractures here are uncommon and generally indicate a high-force mechanism of injury, raising suspicion for associated chest/lung injury.","findings":"Pain and tenderness over the upper back/shoulder blade area; consider associated rib or lung injury.","interv":"Treat as a marker of significant force — assess thoroughly for associated chest trauma, splint the arm for comfort, and transport.","color":15128760},"hip_bone":{"name":"Pelvis (pelvic ring)","system":"msk","kind":"bone","location":"The ring of bone connecting the spine to the legs, including the iliac crests at the waistline and the pubic symphysis at the midline front. The iliac crests are a landmark for finding the pelvis, not for placing a pelvic binder — a binder is centered over the greater trochanters, the bony points at the sides of the hips, roughly a hand's width lower.","funct":"Bears the body's weight and protects major pelvic blood vessels and organs (bladder, rectum, reproductive organs).","path":"An unstable pelvic fracture is life-threatening due to the risk of massive internal hemorrhage from the vessels running through this highly vascular area.","findings":"Pain, instability, or deformity on gentle assessment; avoid rocking or repeatedly springing the pelvis, which can worsen bleeding.","interv":"Apply a pelvic binder per protocol, minimize movement, treat for shock, and prioritize rapid transport.","color":15128760},"humerus":{"name":"Humerus","system":"msk","kind":"bone","location":"The single long bone of the upper arm, between the shoulder and elbow.","funct":"The longest bone in the arm, providing attachment points for the major arm and shoulder muscles.","path":"Fractures can occur mid-shaft (direct trauma) or near either end (falls); can injure the nearby brachial artery or radial nerve.","findings":"Deformity, swelling, pain, and possibly an altered distal pulse or sensation if the nearby artery/nerve is involved.","interv":"Splint in the position found (or per protocol) with a rigid or sling-and-swathe splint, checking distal PMS before and after.","color":15128760},"forearm_bones":{"name":"Radius & ulna","system":"msk","kind":"bone","location":"The two parallel bones of the forearm, between the elbow and wrist.","funct":"Support the forearm's structure and allow rotation of the wrist (pronation/supination).","path":"Fractured by a fall onto an outstretched hand or a direct blow; both bones may break together or individually.","findings":"Pain, swelling, deformity, or an obvious angulation of the forearm; check distal pulse, movement, and sensation.","interv":"Splint in the position found (or gently realigned per protocol if distal pulses are absent), check distal PMS before and after splinting, and transport.","color":15128760},"hand_bones_R":{"name":"Hand bones","system":"msk","kind":"bone","location":"The many small bones of the wrist, palm, and fingers.","funct":"Provide the fine structure for grip and dexterity.","path":"Crush injuries, fractures, and dislocations from falls or machinery; a common site of significant bleeding and swelling given the density of blood vessels and nerves.","findings":"Deformity, swelling, inability to move the fingers normally, or diminished sensation.","interv":"Control bleeding, splint in a position of function with padding, and check distal circulation/sensation before and after.","color":15128760},"hand_bones_L":{"name":"Hand bones","system":"msk","kind":"bone","location":"The many small bones of the wrist, palm, and fingers.","funct":"Provide the fine structure for grip and dexterity.","path":"Crush injuries, fractures, and dislocations from falls or machinery; a common site of significant bleeding and swelling given the density of blood vessels and nerves.","findings":"Deformity, swelling, inability to move the fingers normally, or diminished sensation.","interv":"Control bleeding, splint in a position of function with padding, and check distal circulation/sensation before and after.","color":15128760},"femur":{"name":"Femur","system":"msk","kind":"bone","location":"The single long bone of the thigh, between the hip and knee — the longest and strongest bone in the body.","funct":"Bears the majority of the body's weight during standing and walking.","path":"A femur fracture can cause significant internal blood loss (up to 1-1.5 liters) into the thigh, even without an open wound.","findings":"Severe pain, deformity, swelling, and possible signs of shock from associated blood loss.","interv":"A traction splint is generally indicated for an isolated, closed mid-shaft femur fracture; check distal PMS before and after, and treat for shock.","color":15128760},"patella":{"name":"Patella","system":"msk","kind":"bone","location":"The kneecap, at the front of the knee joint.","funct":"Protects the knee joint and improves the mechanical leverage of the thigh muscles during leg extension.","path":"Can fracture or dislocate from a direct blow to the front of the knee.","findings":"Pain, swelling, or visible deformity at the front of the knee; a dislocated patella may look obviously out of place.","interv":"Splint the knee in the position found (or per protocol) and check distal PMS before and after.","color":15128760},"tib_fib":{"name":"Tibia / fibula","system":"msk","kind":"bone","location":"The two long bones of the lower leg, between the knee and ankle — the tibia (shin bone) bears most of the weight.","funct":"Support the body's weight below the knee and anchor the lower leg muscles.","path":"Common fracture site in falls, direct blows, or twisting injuries to the lower leg; can be open or closed.","findings":"Deformity, swelling, pain, and possible bone protrusion in an open fracture.","interv":"Splint to immobilize the joint above and below the injury, check distal PMS before and after, and control any bleeding from an open fracture.","color":15128760},"foot_bones_R":{"name":"Foot bones","system":"msk","kind":"bone","location":"The many small bones of the ankle, midfoot, and toes.","funct":"Bear body weight and provide the structure for standing and walking.","path":"Fractures from a fall, crush injury, or direct impact (e.g., a heavy object dropped on the foot).","findings":"Pain, swelling, deformity, or inability to bear weight.","interv":"Splint in the position found, avoid weight-bearing, and check distal circulation/sensation before and after.","color":15128760},"foot_bones_L":{"name":"Foot bones","system":"msk","kind":"bone","location":"The many small bones of the ankle, midfoot, and toes.","funct":"Bear body weight and provide the structure for standing and walking.","path":"Fractures from a fall, crush injury, or direct impact (e.g., a heavy object dropped on the foot).","findings":"Pain, swelling, deformity, or inability to bear weight.","interv":"Splint in the position found, avoid weight-bearing, and check distal circulation/sensation before and after.","color":15128760},"brain":{"name":"Brain","system":"neuro","kind":"organ","location":"Housed within the skull, above the brainstem and spinal cord.","funct":"Controls virtually all voluntary and involuntary body functions, from movement and speech to breathing and heart rate regulation.","path":"Stroke, traumatic brain injury, seizure, and increased intracranial pressure are the major EMS-relevant brain emergencies.","findings":"Altered mental status, unequal pupils, one-sided weakness, or an abnormal GCS score.","interv":"Protect the airway, monitor for deterioration, avoid hypoxia/hypotension (both worsen brain injury), and transport promptly to an appropriate facility.","color":14264738},"heart":{"name":"Heart","system":"cardio","kind":"vessel","location":"Center-left of the chest, behind the sternum, tilted slightly left.","funct":"Pumps blood through two circuits — to the lungs and to the body.","path":"Heart attack (MI), heart failure, cardiac arrest, and arrhythmias.","findings":"Chest pain, irregular or absent pulse, or signs of poor perfusion.","interv":"Oxygen if hypoxic, CPR/AED if in cardiac arrest, assist with prescribed cardiac medications per protocol, and rapid transport.","color":10365739},"mitral_valve":{"name":"Mitral valve","system":"cardio","kind":"vessel","location":"Between the left atrium and left ventricle.","funct":"A one-way valve that keeps blood flowing from the left atrium into the left ventricle without backing up.","path":"Mitral valve regurgitation or stenosis can lead to heart failure symptoms over time.","findings":"Symptoms of heart failure (shortness of breath, edema) in a known valve disease patient.","interv":"Manage per presenting symptoms (e.g., pulmonary edema protocol); valve repair/replacement is a hospital-level intervention.","color":15259848},"tricuspid_valve":{"name":"Tricuspid valve","system":"cardio","kind":"vessel","location":"Between the right atrium and right ventricle.","funct":"A one-way valve that keeps blood flowing from the right atrium into the right ventricle.","path":"Tricuspid regurgitation can develop from right heart strain (e.g., from severe lung disease or pulmonary hypertension).","findings":"Jugular venous distension and peripheral edema in significant tricuspid disease.","interv":"Supportive care and transport; manage any associated respiratory or perfusion symptoms per protocol.","color":15259848},"pulmonary_valve":{"name":"Pulmonary valve","system":"cardio","kind":"vessel","location":"Where the right ventricle empties into the pulmonary artery.","funct":"A one-way valve preventing blood from flowing backward into the right ventricle after it's pumped toward the lungs.","path":"Pulmonary valve disease is less common but can contribute to right heart strain.","findings":"Generally not distinguishable in the field without advanced diagnostics.","interv":"Supportive care per presenting symptoms; not a field-level target for intervention.","color":15259848},"aorta":{"name":"Aorta","system":"cardio","kind":"vessel","location":"The large artery arising from the left ventricle, arching through the chest and running down through the abdomen.","funct":"The main trunk artery distributing oxygenated blood to the entire body.","path":"Aortic dissection or abdominal aortic aneurysm (AAA) rupture — both life-threatening.","findings":"Sudden, severe tearing chest/back pain (dissection) or severe abdominal/back pain with a pulsating mass (AAA); unequal blood pressures between arms can suggest dissection.","interv":"Treat for shock, avoid raising blood pressure further where possible, and prioritize rapid, gentle transport — a load-and-go emergency EMTs can't definitively treat in the field.","color":12853280},"carotid":{"name":"Carotid artery","system":"cardio","kind":"vessel","location":"Either side of the neck, lateral to the trachea, beneath the jaw angle.","funct":"Carries oxygenated blood from the heart to the brain and face; the strongest centrally-located pulse in the body.","path":"Carotid artery disease/stenosis; it's also the pulse point checked for cardiac arrest.","findings":"Absent bilateral carotid pulse (with unresponsiveness and abnormal/absent breathing) confirms cardiac arrest; check gently, one side at a time.","interv":"If absent, begin CPR immediately per BLS protocol; never compress both sides at once or use excessive pressure.","color":12853280},"jugular":{"name":"Jugular vein","system":"cardio","kind":"vessel","location":"Along the side of the neck, running roughly parallel to the carotid artery.","funct":"Drains venous blood from the head back toward the heart.","path":"Distension (JVD) is associated with conditions that raise right-heart pressure, such as heart failure or tension pneumothorax.","findings":"Assess with the patient at roughly a 45-degree incline; flat neck veins with hypotension may instead suggest hypovolemia.","interv":"JVD combined with respiratory distress and unequal breath sounds should raise suspicion for tension pneumothorax — treat per protocol and transport promptly.","color":2776992},"great_vessels":{"name":"Pulmonary vessels & vena cava","system":"cardio","kind":"vessel","location":"The large vessels connecting the heart to the lungs (pulmonary artery/vein) and returning blood from the body (superior and inferior vena cava).","funct":"Carry blood between the heart and lungs for oxygenation, and return blood from the body back to the heart.","path":"Injury here from penetrating chest trauma or severe deceleration is rapidly life-threatening given the volume and pressure of blood flow.","findings":"Signs of massive internal bleeding or shock following significant chest trauma; distended neck veins can suggest impaired return through the vena cava (e.g., tension pneumothorax, cardiac tamponade).","interv":"High-flow oxygen, treat aggressively for shock, and prioritize rapid transport — this is a load-and-go presentation.","color":4151968},"lung_R":{"name":"Lung","system":"resp","kind":"organ","location":"Fill most of the chest cavity on both sides.","funct":"Perform the mechanical work of gas exchange, moving oxygen into the blood and carbon dioxide out.","path":"Pneumothorax, hemothorax, pneumonia, pulmonary edema, and asthma/COPD exacerbation.","findings":"Diminished/unequal breath sounds, abnormal work of breathing, or crackles/wheezing on auscultation.","interv":"Support oxygenation/ventilation as needed, manage specific findings per protocol (e.g., seal an open chest wound), and transport promptly.","color":15246236},"lung_L":{"name":"Lung","system":"resp","kind":"organ","location":"Fill most of the chest cavity on both sides.","funct":"Perform the mechanical work of gas exchange, moving oxygen into the blood and carbon dioxide out.","path":"Pneumothorax, hemothorax, pneumonia, pulmonary edema, and asthma/COPD exacerbation.","findings":"Diminished/unequal breath sounds, abnormal work of breathing, or crackles/wheezing on auscultation.","interv":"Support oxygenation/ventilation as needed, manage specific findings per protocol (e.g., seal an open chest wound), and transport promptly.","color":15246236},"trachea":{"name":"Trachea","system":"resp","kind":"organ","location":"The airway tube in the anterior neck, continuing down into the chest to the mainstem bronchi.","funct":"Conducts air between the larynx and the lungs; reinforced with cartilage rings to stay open.","path":"Can be deviated from its normal midline position by a tension pneumothorax (a late, unreliable sign) or injured directly by penetrating neck trauma.","findings":"Midline position should be checked; tracheal deviation, subcutaneous emphysema (crackling under the skin), or visible neck wounds are significant findings.","interv":"Maintain a patent airway, give oxygen, and transport promptly; a suspected tension pneumothorax requires rapid transport for advanced decompression, beyond typical EMT scope.","color":15591124},"diaphragm":{"name":"Diaphragm","system":"resp","kind":"organ","location":"A dome-shaped muscle separating the chest cavity from the abdominal cavity.","funct":"The primary muscle of breathing — contracting flattens it, expanding the chest and drawing air in.","path":"Can rupture in severe blunt abdominal/chest trauma (allowing abdominal organs to herniate into the chest), or its motion can be impaired by abdominal distension or severe pain.","findings":"Respiratory distress with diminished breath sounds, or bowel sounds heard in the chest, after significant trauma can suggest diaphragmatic injury.","interv":"Support ventilation as needed, position of comfort, and prompt transport — surgical repair of a ruptured diaphragm is a hospital-level intervention.","color":11891034},"esophagus":{"name":"Esophagus","system":"abd","kind":"organ","location":"The muscular tube connecting the throat to the stomach, running behind the trachea and heart.","funct":"Carries swallowed food and liquid down to the stomach.","path":"Can tear/rupture (rare, but life-threatening) from severe vomiting; also the source of bleeding from esophageal varices in liver disease, and food/foreign body obstruction.","findings":"Severe chest pain after forceful vomiting, or vomiting blood (hematemesis).","interv":"Treat for shock if significant bleeding is suspected, keep the airway clear if vomiting, and transport promptly.","color":13999270},"stomach":{"name":"Stomach","system":"abd","kind":"organ","location":"Upper-left abdomen (left upper quadrant), just below the diaphragm.","funct":"Breaks down swallowed food with acid and enzymes before it passes to the small intestine.","path":"Peptic ulcers can bleed or perforate; also a common source of vomiting-related complaints.","findings":"Upper abdominal pain, vomiting (possibly blood or coffee-ground material), or a rigid, tender abdomen if perforated.","interv":"Position of comfort, withhold food/water, treat for shock if bleeding/perforation is suspected, and transport.","color":13212259},"liver":{"name":"Liver","system":"abd","kind":"organ","location":"Right upper quadrant of the abdomen, behind the lower right ribs.","funct":"Filters blood, processes nutrients, and produces bile and clotting factors.","path":"A common site of blunt abdominal injury; also affected by chronic disease (cirrhosis, hepatitis) which increases bleeding risk.","findings":"Right upper quadrant pain/tenderness, sometimes radiating to the right shoulder blade.","interv":"Treat for shock if trauma-related internal bleeding is suspected, minimize movement, and prioritize rapid transport — a load-and-go presentation for significant injury.","color":9124398},"gallbladder":{"name":"Gall bladder","system":"abd","kind":"organ","location":"Right upper quadrant, tucked beneath the liver.","funct":"Stores and concentrates bile, released to help digest fats.","path":"Gallstones and gallbladder inflammation (cholecystitis) are the classic conditions here.","findings":"Right upper quadrant pain, sometimes radiating to the right shoulder blade, often after a fatty meal.","interv":"Position of comfort, withhold food/water, and transport — EMTs don't treat the underlying pathology in the field.","color":6064710},"pancreas":{"name":"Pancreas","system":"abd","kind":"organ","location":"Behind the stomach, deep in the upper abdomen.","funct":"Produces digestive enzymes and hormones (including insulin) that regulate blood sugar.","path":"Pancreatitis (often from gallstones or alcohol use) causes severe upper abdominal pain; also central to Type 1 diabetes (insulin production).","findings":"Severe, steady upper abdominal pain, sometimes radiating to the back, often with nausea/vomiting.","interv":"Position of comfort, withhold food/water, treat for shock if severe, and transport.","color":15123855},"spleen":{"name":"Spleen","system":"abd","kind":"organ","location":"Left upper quadrant of the abdomen, tucked under the lower left ribs.","funct":"Filters blood and supports immune function.","path":"The abdominal organ most commonly injured in blunt trauma, and a source of significant internal bleeding when it ruptures.","findings":"Left upper quadrant pain or tenderness after blunt trauma (e.g., a steering wheel or bicycle handlebar injury).","interv":"Treat for shock, minimize unnecessary movement, and prioritize rapid transport for suspected splenic injury — a load-and-go presentation.","color":7024462},"small_intestine":{"name":"Small intestine","system":"abd","kind":"organ","location":"A long, coiled tube filling much of the central abdomen, between the stomach and large intestine.","funct":"The main site of nutrient absorption from digested food.","path":"Bowel obstruction or ischemia (reduced blood flow) both cause severe abdominal pain and are surgical emergencies.","findings":"Diffuse or crampy abdominal pain, distension, vomiting, or an absence of bowel sounds.","interv":"Position of comfort, withhold food/water, treat for shock, and transport.","color":14851234},"colon":{"name":"Colon","system":"abd","kind":"organ","location":"Frames the outer abdomen, connecting the small intestine to the rectum.","funct":"Absorbs water and forms stool from digested waste.","path":"Diverticulitis (small pouches becoming inflamed, most often on the left side) is a common condition here.","findings":"Pain or tenderness localized to the affected quadrant (often left lower), sometimes with fever or altered bowel habits.","interv":"Position of comfort, supportive care, and transport.","color":13924478},"appendix":{"name":"Appendix","system":"abd","kind":"organ","location":"A small pouch off the caecum, in the right lower quadrant.","funct":"No clear digestive function in adults; thought to play a minor immune role.","path":"Appendicitis is the classic condition associated with this structure.","findings":"Pain that often starts near the umbilicus and migrates to the right lower quadrant, with localized tenderness.","interv":"Position of comfort, avoid palpating repeatedly/aggressively, withhold food/water, and transport.","color":13924478},"rectum":{"name":"Rectum","system":"abd","kind":"organ","location":"The final section of the large intestine, just before the anus.","funct":"Stores stool before elimination.","path":"A source of lower GI bleeding (e.g., hemorrhoids here, or more seriously, diverticular bleeding from the colon above).","findings":"Bright red blood from the rectum, or dark, tarry stool if bleeding is higher up.","interv":"Treat for shock if bleeding is significant, position of comfort, and transport.","color":12610415},"kidney":{"name":"Kidney","system":"abd","kind":"organ","location":"Either side of the spine, behind the abdominal organs, roughly at waist level.","funct":"Filters blood to remove waste and excess fluid, producing urine.","path":"Kidney stones and kidney infections (pyelonephritis) are the classic field-relevant conditions.","findings":"Flank pain that can radiate to the groin, often severe and colicky (comes in waves) with a kidney stone; costovertebral angle (CVA) tenderness with infection.","interv":"Position of comfort (patients often can't find one), treat nausea/pain per protocol, and transport.","color":8208440},"adrenal":{"name":"Adrenal gland","system":"abd","kind":"organ","location":"A small gland sitting atop each kidney.","funct":"Produces hormones including adrenaline/epinephrine and cortisol, regulating stress response, blood pressure, and metabolism.","path":"Adrenal insufficiency (e.g., Addison's disease) can cause a life-threatening adrenal crisis with severe hypotension.","findings":"Profound weakness, hypotension unresponsive to typical measures, and altered mental status in a patient with known adrenal insufficiency.","interv":"Treat for shock, oxygen as needed, and rapid transport — an adrenal crisis requires hospital-level hormone replacement.","color":14927698},"ureter":{"name":"Ureters","system":"abd","kind":"organ","location":"The paired tubes carrying urine from each kidney down to the bladder.","funct":"Transport urine from the kidneys to the bladder via peristalsis.","path":"A kidney stone can become lodged here, causing sudden, severe flank pain.","findings":"Sudden, severe flank or lower abdominal pain that may radiate to the groin, often with nausea and restlessness (the patient can't find a comfortable position).","interv":"Position of comfort, treat nausea/vomiting per protocol, and transport for evaluation.","color":9198140},"bladder":{"name":"Urinary bladder","system":"abd","kind":"organ","location":"Lower-central pelvis, behind the pubic bone.","funct":"Stores urine before elimination.","path":"Can rupture in severe pelvic trauma, especially if full at the time of injury; also a common site of infection.","findings":"Lower abdominal pain, inability to urinate, or blood in the urine after trauma.","interv":"Treat pelvic trauma per protocol (minimize movement, pelvic binder if indicated), and transport.","color":10251077},"testis":{"name":"Testis","system":"abd","kind":"organ","location":"Within the scrotum.","funct":"Produces sperm and testosterone.","path":"Testicular torsion — the testis twists on its blood supply — is a true time-critical surgical emergency.","findings":"Sudden, severe scrotal pain and swelling, sometimes with nausea/vomiting, in an adolescent or young adult.","interv":"Position of comfort (avoid unnecessary exam beyond what's needed), and transport promptly — testicular salvage is time-dependent.","color":14927272},"prostate":{"name":"Prostate gland","system":"abd","kind":"organ","location":"Below the bladder, surrounding the urethra, in males.","funct":"Produces fluid that's part of semen.","path":"Acute urinary retention (inability to urinate) can occur with prostate enlargement or infection (prostatitis).","findings":"Inability to urinate with lower abdominal pain/distension, or fever with pelvic pain in prostatitis.","interv":"Position of comfort and transport; field-level treatment is supportive only.","color":12951728},"thyroid_cartilage":{"name":"Thyroid cartilage (larynx)","system":"resp","kind":"organ","location":"The firm cartilage at the front of the neck (the \"Adam's apple\") forming the front wall of the voice box.","funct":"Protects the vocal cords and airway opening.","path":"Blunt trauma here (e.g., a clothesline-type injury) can fracture the cartilage and cause airway swelling or obstruction.","findings":"Hoarseness, difficulty breathing, subcutaneous emphysema (crackling under the skin), or visible deformity of the neck.","interv":"Closely monitor the airway for progressive swelling, be prepared for airway obstruction, provide oxygen, and transport promptly — this can deteriorate quickly.","color":13092800},"eyeball":{"name":"Eye","system":"neuro","kind":"organ","location":"Paired organs in the orbits (eye sockets) of the skull.","funct":"Vision — light-sensing organs connected to the brain via the optic nerve.","path":"Direct trauma (blunt or penetrating), chemical exposure, or a foreign body are the main field-relevant emergencies.","findings":"Pain, redness, unequal pupils, visible blood in the eye (hyphema), or an obviously abnormal globe shape after trauma.","interv":"Avoid pressure on an injured eye, irrigate copiously for a chemical exposure, shield (don't patch tightly) a penetrating injury, and transport promptly.","color":14472904,"emissiveFactor":0.4},"skin":{"name":"Skin","system":"skin","kind":"skin","location":"The body's largest organ, covering the entire external surface.","funct":"Protects against infection and fluid loss, regulates temperature, and provides sensation.","path":"Burns (thermal, chemical, electrical), lacerations, abrasions, and pressure injuries.","findings":"Depth, size (% body surface area), and location of a burn or wound all affect severity and priority.","interv":"Stop the burning process, cool (don't ice) thermal burns, cover with a dry sterile dressing, and treat for shock/transport per burn severity.","isSkin":true}};
  const PART_GROUP_MAP = {"FMA52734":"frontal_bone","FMA52788":"parietal_bones","FMA52789":"parietal_bones","FMA52738":"temporal_bones","FMA52739":"temporal_bones","FMA52735":"occipital_bone","FMA52748":"mandible","FMA12521":"cervical_spine","FMA12522":"cervical_spine","FMA12523":"cervical_spine","FMA12524":"cervical_spine","FMA12525":"cervical_spine","FMA9165":"thoracic_spine","FMA9187":"thoracic_spine","FMA9209":"thoracic_spine","FMA9248":"thoracic_spine","FMA9922":"thoracic_spine","FMA9945":"thoracic_spine","FMA9968":"thoracic_spine","FMA9991":"thoracic_spine","FMA10014":"thoracic_spine","FMA10037":"thoracic_spine","FMA10059":"thoracic_spine","FMA10081":"thoracic_spine","FMA13072":"lumbar_spine","FMA13073":"lumbar_spine","FMA13074":"lumbar_spine","FMA13075":"lumbar_spine","FMA13076":"lumbar_spine","FMA16202":"sacrum","FMA78497":"spinal_cord","FMA7487":"sternum","FMA7857":"rib_cage","FMA7882":"rib_cage","FMA7909":"rib_cage","FMA7957":"rib_cage","FMA8066":"rib_cage","FMA8175":"rib_cage","FMA8229":"rib_cage","FMA8283":"rib_cage","FMA8364":"rib_cage","FMA8445":"rib_cage","FMA8531":"rib_cage","FMA8533":"rib_cage","FMA7987":"rib_cage","FMA8012":"rib_cage","FMA8039":"rib_cage","FMA8148":"rib_cage","FMA8093":"rib_cage","FMA8202":"rib_cage","FMA8256":"rib_cage","FMA8310":"rib_cage","FMA8391":"rib_cage","FMA8472":"rib_cage","FMA8532":"rib_cage","FMA8534":"rib_cage","BP24":"rib_cage","BP28":"rib_cage","FMA7886":"rib_cage","FMA8031":"rib_cage","FMA8248":"rib_cage","FMA8275":"rib_cage","FMA13322":"clavicle","FMA13323":"clavicle","FMA13395":"scapula","FMA13396":"scapula","FMA16586":"hip_bone","FMA16587":"hip_bone","FMA23130":"humerus","FMA23131":"humerus","FMA23464":"forearm_bones","FMA23465":"forearm_bones","FMA23467":"forearm_bones","FMA23468":"forearm_bones","FMA24464":"hand_bones_R","FMA24466":"hand_bones_R","FMA24468":"hand_bones_R","FMA24470":"hand_bones_R","FMA24472":"hand_bones_R","FMA24435":"hand_bones_R","FMA24437":"hand_bones_R","FMA24443":"hand_bones_R","FMA23725":"hand_bones_R","FMA24446":"hand_bones_R","FMA24448":"hand_bones_R","FMA24441":"hand_bones_R","FMA24465":"hand_bones_L","FMA24467":"hand_bones_L","FMA24469":"hand_bones_L","FMA24471":"hand_bones_L","FMA24473":"hand_bones_L","FMA24436":"hand_bones_L","FMA24438":"hand_bones_L","FMA24444":"hand_bones_L","FMA24445":"hand_bones_L","FMA24447":"hand_bones_L","FMA24449":"hand_bones_L","FMA24442":"hand_bones_L","FMA24474":"femur","FMA24475":"femur","FMA24486":"patella","FMA24487":"patella","FMA24477":"tib_fib","FMA24478":"tib_fib","FMA24480":"tib_fib","FMA24481":"tib_fib","FMA24507":"foot_bones_R","FMA24509":"foot_bones_R","FMA24511":"foot_bones_R","FMA24513":"foot_bones_R","FMA24515":"foot_bones_R","FMA24482":"foot_bones_R","FMA24497":"foot_bones_R","FMA24500":"foot_bones_R","FMA24528":"foot_bones_R","FMA24521":"foot_bones_R","FMA24523":"foot_bones_R","FMA24525":"foot_bones_R","FMA24508":"foot_bones_L","FMA24510":"foot_bones_L","FMA24512":"foot_bones_L","FMA24514":"foot_bones_L","FMA24516":"foot_bones_L","FMA24483":"foot_bones_L","FMA24498":"foot_bones_L","FMA24501":"foot_bones_L","FMA24529":"foot_bones_L","FMA24522":"foot_bones_L","FMA24524":"foot_bones_L","FMA24526":"foot_bones_L","FMA67944":"brain","FMA78450":"brain","FMA78449":"brain","FMA78469":"brain","FMA78454":"brain","FMA78467":"brain","FMA274029":"brain","FMA274027":"brain","FMA61822":"brain","FMA62394":"brain","FMA61993nsn":"brain","FMA72925":"brain","FMA72924":"brain","FMA61970":"brain","FMA7274":"heart","FMA9352nsn":"heart","FMA7266":"heart","FMA7260":"heart","FMA7261":"heart","FMA7262":"heart","FMA71669":"heart","FMA71670":"heart","FMA4706":"heart","FMA4685":"heart","FMA3802":"heart","FMA3818":"heart","FMA76751":"heart","FMA7235":"mitral_valve","FMA7234":"tricuspid_valve","FMA7246":"pulmonary_valve","FMA3736":"aorta","FMA3768":"aorta","FMA3784":"aorta","FMA3941":"carotid","FMA4058":"carotid","FMA4754":"jugular","FMA4762":"jugular","FMA66326":"great_vessels","FMA66643":"great_vessels","FMA4720":"great_vessels","FMA10951":"great_vessels","FMA7337":"lung_R","FMA7333":"lung_R","FMA7383":"lung_R","FMA7371":"lung_L","FMA7370":"lung_L","FMA7394":"trachea","FMA13295":"diaphragm","FMA7131":"esophagus","FMA7148":"stomach","FMA7197":"liver","FMA7202":"gallbladder","FMA7198nsn":"pancreas","FMA7196":"spleen","FMA7206":"small_intestine","FMA7207":"small_intestine","FMA7208":"small_intestine","FMA14543nsn":"colon","FMA14542":"appendix","FMA14544":"rectum","FMA7204":"kidney","FMA7205":"kidney","FMA15629":"adrenal","FMA15630":"adrenal","FMA15571":"ureter","FMA15572":"ureter","FMA15900":"bladder","FMA7211":"testis","FMA7212":"testis","FMA9600":"prostate","FMA55099":"thyroid_cartilage","FMA12513":"eyeball","FMA7163":"skin"};
  const POINTS_3D = [{"key":"p7","name":"2nd intercostal space, midclavicular line","system":"msk","x":-60.8,"y":-116.4,"z":1293.4,"location":"A rib-space landmark located roughly along an imaginary line through the middle of the collarbone.","funct":"A commonly referenced anatomical landmark for describing chest findings and certain advanced procedures.","path":"Referenced when describing the location of a suspected tension pneumothorax for decompression, generally a paramedic-level (or above) procedure per local protocol.","findings":"Used as a reference point in documentation rather than a finding itself.","interv":"As an EMT, recognize and report signs of tension pneumothorax (severe distress, unequal breath sounds, JVD, tracheal deviation) and transport rapidly for advanced intervention."},{"key":"p8","name":"Nipple line","system":"msk","x":-70.8,"y":-116.4,"z":1243.4,"location":"A commonly used visual reference line across the chest.","funct":"A quick visual landmark for describing chest findings and procedures.","path":"Referenced when describing AED pad placement and the general location of penetrating chest wounds.","findings":"Used as a reference point in documentation rather than a finding itself.","interv":"Use as a guide for standard AED pad placement (one pad upper-right chest, one pad lower-left side/ribs, per the pad diagram)."},{"key":"p9","name":"Xiphoid process","system":"msk","x":-0.8,"y":-96.4,"z":1193.4,"location":"The small, pointed lower tip of the breastbone.","funct":"The lowest point of the sternum; compression hand placement is on the lower half of the sternum, just above it.","path":"Can fracture or detach with forceful or misplaced chest compressions if pressure is applied directly to it.","findings":"Point tenderness at the very bottom of the sternum.","interv":"During CPR, center compressions on the chest, avoiding direct pressure on this fragile structure."},{"key":"p10","name":"Brachial artery","system":"cardio","x":-160.8,"y":23.6,"z":1083.4,"location":"Inside of the upper arm, between the biceps and triceps, above the elbow crease.","funct":"Main blood supply to the forearm and hand; used as the reference point for auscultating blood pressure.","path":"Can be injured in upper-arm fractures or lacerations, causing distal ischemia.","findings":"Preferred pulse-check site in an infant (in place of carotid); Korotkoff sounds are heard here during a manual BP.","interv":"Check before/after splinting a humerus fracture; direct pressure controls bleeding from this vessel."},{"key":"p12","name":"Radial artery","system":"cardio","x":-260.8,"y":3.6,"z":828.4,"location":"Wrist, on the thumb side, just proximal to the base of the thumb.","funct":"Supplies the hand; used to gauge adequacy of central perfusion (a palpable radial pulse is a rough field indicator of an adequate systolic BP).","path":"Distal pulse loss from a wrist/forearm fracture or from a proximal tourniquet.","findings":"Standard pulse-check site in a responsive adult or child; assess rate, rhythm, and strength.","interv":"Recheck after any splinting of the arm; if absent with a deformed forearm, follow local protocol on realignment."},{"key":"p13","name":"Umbilicus","system":"msk","x":-0.8,"y":-76.4,"z":953.4,"location":"The navel, at the midline of the abdomen.","funct":"A fixed, central reference point used to divide the abdomen into its four quadrants.","path":"Bruising around the umbilicus (Cullen's sign) can be a delayed sign of internal abdominal bleeding.","findings":"Used as a landmark for describing the location of pain, wounds, or distension.","interv":"Document findings relative to this landmark (e.g., \"pain in the right lower quadrant\") for clear hand-off communication."},{"key":"p14","name":"Iliac crest","system":"msk","x":-110.8,"y":33.6,"z":953.4,"location":"The top ridge of the pelvic bone, felt at the waistline.","funct":"Part of the pelvic ring; a landmark used when assessing for pelvic instability (a pelvic binder goes lower, centered over the greater trochanters).","path":"An unstable pelvic fracture is life-threatening due to the risk of massive internal hemorrhage from the vessels running through this highly vascular area.","findings":"Pain, instability, or deformity on gentle assessment; avoid rocking or repeatedly springing the pelvis, which can worsen bleeding.","interv":"Apply a pelvic binder per protocol, minimize movement, treat for shock, and prioritize rapid transport."},{"key":"p16","name":"Femoral artery","system":"cardio","x":-50.8,"y":-1.4,"z":803.4,"location":"Groin crease, midway between the hip bone and pubic bone.","funct":"Main blood supply to the leg; a large, easily-palpated central pulse.","path":"Site of major hemorrhage in proximal leg/groin trauma; also a common IV access/catheterization site in-hospital.","findings":"Strong pulse normally; diminished or absent pulse suggests proximal arterial injury or severe shock.","interv":"Groin bleeding too high for a limb tourniquet (junctional hemorrhage) is controlled by packing the wound and holding firm direct pressure over this artery; for severe thigh bleeding below the groin, apply a tourniquet 2–3 inches above the wound (not over a joint)."},{"key":"p20","name":"Medial malleolus","system":"msk","x":-45.8,"y":23.6,"z":63.4,"location":"The bony bump on the inner ankle, at the end of the shin bone (tibia).","funct":"Forms part of the ankle joint and helps stabilize it.","path":"A common site of ankle fracture and sprain, especially from a twisting injury.","findings":"Pain, swelling, and tenderness over the inner ankle; may be accompanied by deformity in a significant fracture.","interv":"Splint the ankle in the position found, and check the posterior tibial and dorsalis pedis pulses before and after."},{"key":"p21","name":"Dorsalis pedis","system":"cardio","x":-55.8,"y":-6.4,"z":18.4,"location":"Top of the foot, between the first and second metatarsal bones.","funct":"One of the two standard distal pulse points in the foot.","path":"Can be congenitally absent in a small percentage of people, so use the posterior tibial as the alternate check.","findings":"Checked as a distal pulse when assessing circulation in a lower-leg injury.","interv":"Reassess distal pulses, motor function, and sensation before and after splinting any lower-leg injury."},{"key":"q4","name":"Posterior lung fields (bases)","system":"resp","x":-0.8,"y":128.6,"z":1083.4,"location":"Fill most of the chest cavity, with the diaphragm forming the floor of the chest below them.","funct":"Together, perform the mechanical work of breathing and gas exchange; the bases are a key spot for detecting fluid buildup.","path":"Pulmonary edema, pneumonia, hemothorax, and pneumothorax can all be detected via posterior auscultation.","findings":"Crackles at the bases suggest fluid (pulmonary edema); diminished sounds on one side suggest pneumo/hemothorax.","interv":"Support oxygenation/ventilation as needed, position upright if tolerated for pulmonary edema, and transport promptly."},{"key":"q7","name":"Costovertebral angle (CVA)","system":"msk","x":-90.8,"y":103.6,"z":903.4,"location":"The angle formed on the back where the lowest rib meets the spine, on either side.","funct":"An examination landmark overlying the kidneys.","path":"Tenderness here (CVA tenderness) is classically associated with a kidney infection (pyelonephritis) or kidney stone.","findings":"Pain with gentle percussion/pressure over this area, often with flank pain radiating to the groin.","interv":"Position of comfort and supportive care; generally a medical (non-traumatic) transport priority unless trauma is also involved."},{"key":"q10","name":"Popliteal artery","system":"cardio","x":-90.8,"y":108.6,"z":406.4,"location":"Behind the knee, in the popliteal fossa.","funct":"Continues blood supply from the femoral artery into the lower leg.","path":"Vulnerable to injury in knee dislocations, which can compromise distal circulation.","findings":"Checked when assessing circulation after a knee or lower-leg injury; harder to palpate than other pulse points.","interv":"Its absence after a knee injury is a time-sensitive finding warranting prompt transport for vascular evaluation."},{"key":"q11","name":"Posterior tibial artery","system":"cardio","x":-45.8,"y":103.6,"z":63.4,"location":"Just behind and below the medial ankle bone (medial malleolus).","funct":"One of two distal pulse points supplying the foot.","path":"Diminished/absent pulse can indicate peripheral vascular disease or distal limb injury.","findings":"Checked alongside the dorsalis pedis as one of the two standard distal lower-leg pulse points.","interv":"Document and compare bilaterally; recheck after splinting a lower-leg injury."}];

  const SYSTEM_LABELS = {
    resp:"Respiratory / Airway", cardio:"Cardiovascular", neuro:"Neurological",
    msk:"Musculoskeletal", abd:"Abdominal / GI / GU", skin:"Integumentary"
  };
  const ALL_SYSTEMS = ["resp","cardio","neuro","msk","abd","skin"];

  const KIND_COLORS = {
    bone:0xD8CFB8, organ:0x8A9B7E, vessel:0xB23A3A, skin:0xE8C9A8,
  };
  // Bone reads dry/matte; organs and vessels get a moister, glossier finish
  // so the material itself signals what kind of tissue you're looking at.
  const ROUGHNESS_BY_KIND = { bone:0.75, organ:0.32, vessel:0.25, skin:0.55 };
  const METALNESS_BY_KIND = { bone:0.04, organ:0.03, vessel:0.05, skin:0 };
  const SELECT_GLOW_HEX = 0x0F5C50;
  // The backdrop follows the site theme; [inner, outer, fog].
  const BACKDROP = { light:['#fbfbfa', '#e4e6e2', 0xF4F5F3], dark:['#26332f', '#121a18', 0x0F1917] };

  // Organs, vessels, and skin are the things that most often sit in front of
  // whatever you actually clicked, hiding it — so once something is selected,
  // fade every OTHER organ/vessel/skin mesh down to a ghost. Bones stay fully
  // solid throughout, since they rarely fully block a selection and keeping
  // them opaque preserves a stable frame of reference to orient by.
  const FADE_KINDS = new Set(['organ', 'vessel', 'skin']);
  const FADE_OPACITY = 0.1;
  const HOME_POS = [0, -2700, 1000], HOME_TARGET = [0, 0, 900];

  function allEntries(){
    // Returns [key, content] for every selectable thing: mesh groups + point landmarks
    const out = [];
    for (const k in GROUP_CONTENT) out.push([k, GROUP_CONTENT[k]]);
    for (const p of POINTS_3D) out.push(['pt_' + p.key, { name:p.name, system:p.system, kind:'point',
      location:p.location, funct:p.funct, path:p.path, findings:p.findings, interv:p.interv }]);
    return out;
  }
  const ENTRIES = allEntries();
  const CONTENT_BY_KEY = {};
  for (const [k, c] of ENTRIES) CONTENT_BY_KEY[k] = c;
  // Browse-by-name labels, lower case -> key. The first of a repeated name
  // (left and right lung) wins, which is the one the sorted list shows first.
  const KEY_BY_NAME = {};
  ENTRIES.slice().sort((a, b) => a[1].name.localeCompare(b[1].name))
    .forEach(([k, c]) => { const n = c.name.toLowerCase(); if (!(n in KEY_BY_NAME)) KEY_BY_NAME[n] = k; });

  function resolve(nameOrKey){
    if (nameOrKey == null) return null;
    const s = String(nameOrKey).trim();
    if (CONTENT_BY_KEY[s]) return s;
    const k = KEY_BY_NAME[s.toLowerCase().replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ')] || KEY_BY_NAME[s.toLowerCase()];
    return k || null;
  }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  }
  function infoHtml(data){
    const sysLabel = SYSTEM_LABELS[data.system] || data.system;
    return `
      <span class="info-cat">${sysLabel}</span>
      <p class="info-label">${data.name}</p>
      <p class="info-field"><b>Location:</b> ${data.location}</p>
      <p class="info-field"><b>Function:</b> ${data.funct}</p>
      <p class="info-field"><b>Common pathologies:</b> ${data.path}</p>
      <p class="info-field"><b>Assessment findings:</b> ${data.findings}</p>
      <p class="info-field"><b>Field interventions:</b> ${data.interv}</p>
    `;
  }
  function reducedMotion(){
    if (window.LevlMotion) return window.LevlMotion.reduced();
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function isDark(){ return document.documentElement.getAttribute('data-theme') === 'dark'; }

  /* ---- three.js, once per page ------------------------------------------ */

  let libsPromise = null;
  function ensureImportMap(base){
    if (document.querySelector('script[type="importmap"]')) return;
    const s = document.createElement('script');
    s.type = 'importmap';
    s.textContent = JSON.stringify({ imports: { three: new URL(base + 'vendor/three/build/three.module.min.js', location.href).href } });
    document.head.appendChild(s);
  }
  function loadLibs(base){
    if (libsPromise) return libsPromise;
    ensureImportMap(base);
    const v = new URL(base + 'vendor/three/', location.href).href;
    libsPromise = Promise.all([
      import('three'),
      import(v + 'controls/OrbitControls.js'),
      import(v + 'loaders/GLTFLoader.js'),
      import(v + 'libs/meshopt_decoder.module.js'),
      import(v + 'environments/RoomEnvironment.js'),
    ]).then(([three, oc, gl, md, re]) => ({
      THREE: three, OrbitControls: oc.OrbitControls, GLTFLoader: gl.GLTFLoader,
      MeshoptDecoder: md.MeshoptDecoder, RoomEnvironment: re.RoomEnvironment,
    }), (err) => { libsPromise = null; throw err; });
    return libsPromise;
  }

  function slowConnection(){
    const c = navigator.connection;
    if (!c) return false;
    return !!c.saveData || /2g|3g/.test(c.effectiveType || '');
  }

  /* The viewer's own pieces, so a page that embeds it needs no stylesheet. */
  function injectCss(){
    if (document.getElementById('bv-css')) return;
    const st = document.createElement('style');
    st.id = 'bv-css';
    st.textContent = `
.bv{position:relative;overflow:hidden;}
.bv-canvas{width:100%;height:min(72vh,560px);display:block;touch-action:none;cursor:grab;}
.bv-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;background:var(--paper);font-family:var(--font-mono);font-size:12.5px;color:var(--muted);letter-spacing:0.04em;}
.bv-loading[hidden],.bv-spinner[hidden],.bv-load-btn[hidden]{display:none;}
.bv-load-btn{font:700 13px var(--font-ui);padding:10px 18px;border:0;border-radius:20px;background:var(--navy);color:var(--on-accent);cursor:pointer;letter-spacing:0;}
.bv-load-text{max-width:34ch;text-align:center;line-height:1.5;}
.bv-spinner{width:22px;height:22px;border-radius:50%;border:2.5px solid var(--line);border-top-color:var(--accent);animation:bv-spin .8s linear infinite;}
@keyframes bv-spin{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion: reduce){.bv-spinner{animation-duration:2.4s;}}
.bv-hint{position:absolute;top:10px;right:10px;background:var(--overlay-bg);border:2px solid var(--line);border-radius:8px;padding:6px 9px;font-size:11px;color:var(--muted);text-align:right;line-height:1.5;pointer-events:none;}
`;
    document.head.appendChild(st);
  }

  /* ---- One viewer ------------------------------------------------------- */

  function mount(el, opts){
    if (!el) throw new Error('LevlBodyViewer.mount: no element');
    opts = opts || {};
    injectCss();
    const base = opts.base || SCRIPT_BASE;
    const listeners = { select:[], pick:[], load:[], layers:[] };
    if (opts.onSelect) listeners.select.push(opts.onSelect);
    if (opts.onPick) listeners.pick.push(opts.onPick);
    if (opts.onLoad) listeners.load.push(opts.onLoad);
    if (opts.onLayers) listeners.layers.push(opts.onLayers);
    function emit(name, a, b){ listeners[name].forEach(fn => { try { fn(a, b); } catch(e){ console.error(e); } }); }

    let L = null;   // the three.js libraries, once loaded
    let scene, camera, renderer, controls, raycaster, pointer, bgTex;
    const meshByGroup = {};   // groupKey -> [mesh,...]
    const allPickable = [];   // meshes + point markers, raycast targets
    let selectedGroupKey = null;
    let hoveredGroupKey = null;
    let highlighted = [];
    let activeSystems = new Set(opts.systems || ALL_SYSTEMS);
    let skinOn = opts.skin !== false;
    let pointerDownPos = null;
    let flyAnim = null;
    let loaded = false, started = false, destroyed = false, rafId = 0;

    el.classList.add('bv');
    const canvas = document.createElement('canvas');
    canvas.className = 'bv-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', opts.label || '3D model of the human body. Drag to rotate; choose a structure by name to select it with the keyboard.');
    const loading = document.createElement('div');
    loading.className = 'bv-loading';
    loading.innerHTML = '<div class="bv-spinner"></div><div class="bv-load-text">Loading 3D model&hellip;</div>' +
      '<button type="button" class="bv-load-btn" hidden>Load 3D model (3.3&nbsp;MB)</button>';
    const spinner = loading.querySelector('.bv-spinner');
    const loadText = loading.querySelector('.bv-load-text');
    const loadBtn = loading.querySelector('.bv-load-btn');
    el.insertBefore(loading, el.firstChild);
    el.insertBefore(canvas, el.firstChild);
    if (opts.hint !== false) {
      const hint = document.createElement('div');
      hint.className = 'bv-hint';
      hint.textContent = opts.hint || 'Click any part to select it';
      el.insertBefore(hint, loading.nextSibling);
    }
    const listEl = opts.list || null;
    const infoEl = opts.info || null;
    const placeholder = opts.placeholder || '<p class="info-placeholder">Click any part of the model, or a name below.</p>';

    function visible(key){
      const c = CONTENT_BY_KEY[key];
      return !!c && activeSystems.has(c.system) && !(key === 'skin' && !skinOn);
    }

    /* ---- scene ---- */

    function backdrop(){
      const THREE = L.THREE;
      const [inner, outer, fog] = BACKDROP[isDark() ? 'dark' : 'light'];
      const size = 512;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(size/2, size*0.42, size*0.08, size/2, size/2, size*0.72);
      grad.addColorStop(0, inner);
      grad.addColorStop(1, outer);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      if (bgTex) bgTex.dispose();
      bgTex = new THREE.CanvasTexture(c);
      bgTex.colorSpace = THREE.SRGBColorSpace;
      scene.background = bgTex;
      scene.fog = new THREE.Fog(fog, 2400, 6000);
    }

    function initScene(){
      const THREE = L.THREE;
      scene = new THREE.Scene();
      backdrop();

      const w = el.clientWidth, h = canvas.clientHeight || 560;
      camera = new THREE.PerspectiveCamera(32, w / h, 1, 12000);
      camera.up.set(0, 0, 1);
      camera.position.set(...HOME_POS);

      renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new L.RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();

      controls = new L.OrbitControls(camera, renderer.domElement);
      controls.target.set(...HOME_TARGET);
      controls.enableDamping = true;
      controls.dampingFactor = 0.09;
      controls.minDistance = 120;
      controls.maxDistance = 4200;
      controls.zoomSpeed = 0.9;
      controls.panSpeed = 0.7;
      controls.screenSpacePanning = true;
      controls.update();

      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const dl1 = new THREE.DirectionalLight(0xffffff, 0.55);
      dl1.position.set(400, -1400, 1600);
      dl1.target.position.set(0, 0, 650);
      dl1.castShadow = true;
      dl1.shadow.mapSize.set(2048, 2048);
      dl1.shadow.camera.left = -900;
      dl1.shadow.camera.right = 900;
      dl1.shadow.camera.top = 900;
      dl1.shadow.camera.bottom = -900;
      dl1.shadow.camera.near = 10;
      dl1.shadow.camera.far = 4000;
      dl1.shadow.bias = -0.0015;
      dl1.shadow.normalBias = 2;
      scene.add(dl1);
      scene.add(dl1.target);
      const dl2 = new THREE.DirectionalLight(0xffffff, 0.35);
      dl2.position.set(-600, 900, 400);
      scene.add(dl2);
      const dl3 = new THREE.DirectionalLight(0xffffff, 0.25);
      dl3.position.set(300, 1200, 1200);
      scene.add(dl3);

      raycaster = new THREE.Raycaster();
      pointer = new THREE.Vector2();

      window.addEventListener('resize', onResize);
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerleave', onPointerLeave);
    }

    function onResize(){
      if (!camera) return;
      const w = el.clientWidth, h = canvas.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }

    function materialFor(content){
      const THREE = L.THREE;
      const isSkin = content.kind === 'skin';
      const color = content.color ?? KIND_COLORS[content.kind] ?? 0xBFBFBF;
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: ROUGHNESS_BY_KIND[content.kind] ?? 0.6,
        metalness: METALNESS_BY_KIND[content.kind] ?? 0.02,
        transparent: isSkin,
        opacity: isSkin ? 0.24 : 1,
        depthWrite: !isSkin,
        side: THREE.DoubleSide,
      });
      if (content.emissiveFactor) {
        mat.emissive = new THREE.Color(color);
        mat.emissiveIntensity = content.emissiveFactor;
      }
      return mat;
    }

    function loadModel(){
      const loader = new L.GLTFLoader();
      loader.setMeshoptDecoder(L.MeshoptDecoder);
      loader.load(base + 'body3d.glb?v=hires2', (gltf) => {
        if (destroyed) return;
        const modelRoot = gltf.scene;
        modelRoot.traverse(obj => {
          if (!obj.isMesh) return;
          const parentName = obj.parent && obj.parent.name;
          const partId = (parentName && PART_GROUP_MAP[parentName]) ? parentName : obj.name;
          const groupKey = PART_GROUP_MAP[partId];
          if (!groupKey) return;
          const content = GROUP_CONTENT[groupKey];
          if (!content) return;
          if (!obj.geometry.attributes.normal) obj.geometry.computeVertexNormals();
          obj.material = materialFor(content);
          obj.userData.groupKey = groupKey;
          obj.userData.kind = content.kind;
          obj.userData.baseColor = obj.material.color.getHex();
          obj.userData.baseEmissive = obj.material.emissive.getHex();
          obj.userData.baseEmissiveIntensity = obj.material.emissiveIntensity;
          obj.userData.baseOpacity = obj.material.opacity;
          obj.userData.baseTransparent = obj.material.transparent;
          obj.userData.isSkin = content.kind === 'skin';
          obj.castShadow = content.kind !== 'skin';
          obj.receiveShadow = true;
          (meshByGroup[groupKey] = meshByGroup[groupKey] || []).push(obj);
          allPickable.push(obj);
        });
        scene.add(modelRoot);
        loaded = true;
        applyLayers();
        /* The list works before the model arrives, so something may already be
           selected (or asked for by ?focus=); show it on the model now. */
        highlighted.forEach(k => highlightGroup(k, 0.35));
        if (selectedGroupKey && meshByGroup[selectedGroupKey]) {
          highlightGroup(selectedGroupKey);
          updateOcclusionFade();
          flyToGroup(selectedGroupKey);
        }
        loading.hidden = true;
        emit('load');
      }, (xhr) => {
        if (xhr.total) loadText.textContent = 'Loading 3D model… ' + Math.round((xhr.loaded / xhr.total) * 100) + '%';
      }, (err) => {
        console.error(err);
        spinner.hidden = true;
        loadText.textContent = 'Could not load the 3D model. Try reloading the page.';
      });
    }

    function animate(){
      if (destroyed) return;
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    function start(){
      if (started) return;
      started = true;
      loadBtn.hidden = true;
      spinner.hidden = false;
      loadText.textContent = 'Loading 3D model…';
      loadLibs(base).then((libs) => {
        if (destroyed) return;
        L = libs;
        initScene();
        loadModel();
        animate();
      }, (err) => {
        console.error(err);
        started = false;
        spinner.hidden = true;
        loadText.textContent = 'Could not load the 3D viewer.';
        loadBtn.textContent = 'Try again';
        loadBtn.hidden = false;
      });
    }
    loadBtn.addEventListener('click', start);

    /* ---- picking ---- */

    function onPointerDown(e){ pointerDownPos = { x: e.clientX, y: e.clientY }; }
    function onPointerUp(e){
      if (!pointerDownPos) return;
      const dx = e.clientX - pointerDownPos.x, dy = e.clientY - pointerDownPos.y;
      pointerDownPos = null;
      if (Math.sqrt(dx*dx + dy*dy) < 6) handlePick(e);
    }
    function onPointerLeave(){ setHover(null); }
    function keyAt(e){
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return firstNonSkinGroupKey(raycaster.intersectObjects(allPickable, false));
    }
    function handlePick(e){
      const groupKey = keyAt(e);
      if (!groupKey) return;
      emit('pick', groupKey, CONTENT_BY_KEY[groupKey]);
      if (opts.pickSelects !== false) selectGroup(groupKey);
    }
    function onPointerMove(e){
      const groupKey = keyAt(e);
      setHover(groupKey);
      canvas.style.cursor = groupKey ? 'pointer' : 'grab';
    }
    function firstNonSkinGroupKey(hits){
      // Three.js's raycaster doesn't check mesh.visible on its own, so a part
      // hidden by a system filter (or the skin toggle) would otherwise still be
      // pickable through the gap it left behind — filter those out first.
      const visibleHits = hits.filter(h => h.object.visible);
      for (const h of visibleHits) {
        const gk = h.object.userData.groupKey;
        if (gk && gk !== 'skin') return gk;
      }
      if (visibleHits.length && visibleHits[0].object.userData.groupKey === 'skin' && skinOn) return 'skin';
      return null;
    }
    function setHover(groupKey){
      if (groupKey === hoveredGroupKey) return;
      if (hoveredGroupKey && hoveredGroupKey !== selectedGroupKey) {
        for (const m of meshByGroup[hoveredGroupKey] || []) restore(m);
      }
      hoveredGroupKey = groupKey;
      if (groupKey && groupKey !== selectedGroupKey) {
        for (const m of meshByGroup[groupKey] || []) m.material.emissive = new L.THREE.Color(0x2a2a2a);
      }
    }

    /* ---- looks ---- */

    function resetMeshColor(m){
      m.material.color.setHex(m.userData.baseColor);
      m.material.emissive.setHex(m.userData.baseEmissive || 0x000000);
      m.material.emissiveIntensity = m.userData.baseEmissiveIntensity ?? 1;
    }
    // Back to base, or back to a highlight() glow if it has one.
    function restore(m){
      resetMeshColor(m);
      if (highlighted.indexOf(m.userData.groupKey) !== -1) glow(m, 0.35);
    }
    // Selection keeps each part's own color and glows with a soft accent-colored
    // emissive instead of flat-filling the mesh — easier to read as "this is
    // highlighted" rather than "this part turned teal". A pure emissive add
    // washes out on brightly-lit surfaces, so the base color is blended toward
    // the glow too — that stays visible under any lighting.
    function glow(m, amount){
      const g = new L.THREE.Color(SELECT_GLOW_HEX);
      m.material.color.setHex(m.userData.baseColor).lerp(g, amount);
      m.material.emissive = g.clone();
      m.material.emissiveIntensity = amount === 0.55 ? 0.75 : 0.45;
    }
    function highlightGroup(groupKey, amount){
      if (!L) return;
      for (const m of meshByGroup[groupKey] || []) glow(m, amount || 0.55);
    }
    function updateOcclusionFade(){
      for (const m of allPickable) {
        if (!FADE_KINDS.has(m.userData.kind)) continue;
        const isSelected = selectedGroupKey && m.userData.groupKey === selectedGroupKey;
        if (isSelected) {
          m.material.transparent = m.userData.baseTransparent;
          m.material.opacity = 1;
          m.material.depthWrite = !m.userData.baseTransparent;
        } else if (selectedGroupKey) {
          m.material.transparent = true;
          m.material.opacity = FADE_OPACITY;
          m.material.depthWrite = false;
        } else {
          m.material.transparent = m.userData.baseTransparent;
          m.material.opacity = m.userData.baseOpacity;
          m.material.depthWrite = !m.userData.baseTransparent;
        }
      }
    }

    /* ---- camera ---- */

    function groupBounds(groupKey){
      const THREE = L.THREE;
      const meshes = meshByGroup[groupKey];
      if (!meshes || !meshes.length) return null;
      const box = new THREE.Box3(), tmp = new THREE.Box3();
      let has = false;
      for (const m of meshes) {
        if (m.userData.isPoint) tmp.setFromCenterAndSize(m.position, new THREE.Vector3(30,30,30));
        else tmp.setFromObject(m);
        if (!has) { box.copy(tmp); has = true; } else box.union(tmp);
      }
      if (!has) return null;
      const center = new THREE.Vector3(), size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);
      return { center, size };
    }
    function flyToGroup(groupKey){
      if (!camera) return;
      const b = groupBounds(groupKey);
      if (!b) return;
      const radius = Math.max(b.size.length() * 0.55, 60);
      const isPoint = meshByGroup[groupKey] && meshByGroup[groupKey][0] && meshByGroup[groupKey][0].userData.isPoint;
      const distance = Math.min(Math.max(radius * (isPoint ? 6.5 : 2.8), 190), 3200);
      const dir = new L.THREE.Vector3().subVectors(camera.position, controls.target);
      if (dir.lengthSq() < 1e-6) dir.set(0, -1, 0.3);
      dir.normalize();
      const newTarget = b.center.clone();
      animateCamera(newTarget.clone().addScaledVector(dir, distance), newTarget, 650);
    }
    function animateCamera(newPos, newTarget, duration){
      if (flyAnim) cancelAnimationFrame(flyAnim.raf);
      /* Flying the camera across the body is the largest piece of motion on the
         site and the one most likely to make someone queasy. Under "reduce
         motion" the view still goes exactly where it was asked to go — it just
         arrives instead of travelling. */
      if (reducedMotion()) {
        camera.position.copy(newPos);
        controls.target.copy(newTarget);
        controls.update();
        flyAnim = null;
        return;
      }
      const startPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const t0 = performance.now();
      function step(now){
        const t = Math.min((now - t0) / duration, 1);
        const e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; // easeInOutQuad
        camera.position.lerpVectors(startPos, newPos, e);
        controls.target.lerpVectors(startTarget, newTarget, e);
        controls.update();
        flyAnim = t < 1 ? { raf: requestAnimationFrame(step) } : null;
      }
      flyAnim = { raf: requestAnimationFrame(step) };
    }

    /* ---- selection ---- */

    function selectGroup(groupKey, how){
      /* While the hunt is running, every selection is an answer to it. Hooked
         here rather than on the canvas so that picking a name out of the list
         counts too — the skill is naming the structure, and a student who can
         find it in a list has demonstrated something real even if it is not
         the harder version. */
      if (hunt.active && hunt.target && !hunt.answered && how !== 'reveal') answerHunt(groupKey);
      // Clicking the already-selected part again toggles it off: zoom back out
      // and clear the selection, instead of re-selecting a no-op.
      if (groupKey === selectedGroupKey) {
        if (how === 'focus' || how === 'reveal') return;
        reset();
        return;
      }
      if (selectedGroupKey && meshByGroup[selectedGroupKey]) {
        for (const m of meshByGroup[selectedGroupKey]) restore(m);
      }
      selectedGroupKey = groupKey;
      highlightGroup(groupKey);
      updateOcclusionFade();
      const content = CONTENT_BY_KEY[groupKey];
      if (content && infoEl) infoEl.innerHTML = infoHtml(content);
      flyToGroup(groupKey);
      renderList();
      emit('select', groupKey, content);
    }
    function clear(){
      if (selectedGroupKey && meshByGroup[selectedGroupKey]) {
        for (const m of meshByGroup[selectedGroupKey]) restore(m);
      }
      const had = selectedGroupKey;
      selectedGroupKey = null;
      updateOcclusionFade();
      if (infoEl) infoEl.innerHTML = placeholder;
      renderList();
      if (had) emit('select', null, null);
    }
    function reset(){
      clear();
      if (!camera) return;
      animateCamera(new L.THREE.Vector3(...HOME_POS), new L.THREE.Vector3(...HOME_TARGET), 650);
    }

    function applyLayers(){
      for (const groupKey in meshByGroup) {
        const content = CONTENT_BY_KEY[groupKey];
        if (!content) continue;
        const show = visible(groupKey);
        for (const m of meshByGroup[groupKey]) m.visible = show;
      }
      renderList();
    }

    function renderList(){
      if (!listEl) return;
      const items = ENTRIES.filter(([k]) => visible(k))
        .sort((a, b) => a[1].name.localeCompare(b[1].name));
      listEl.innerHTML = items.map(([k, c]) => {
        const sel = k === selectedGroupKey;
        return `<button type="button" data-key="${k}"${sel ? ' class="selected"' : ''} aria-pressed="${sel}">${c.name}</button>`;
      }).join('');
    }
    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-key]');
        if (btn) selectGroup(btn.dataset.key);
      });
    }

    /* ---- The hunt ----------------------------------------------------------

       "Where is the xiphoid process" is the question this model is for, and the
       model could only answer the reverse one: click a thing, be told its name.
       That is recognition, and recognition is what feels like knowing right up
       until someone asks you to point at it. So the hunt names a structure and
       makes you find it. The tally is for the current run; what happens to each
       answer beyond that is the host page's business (onAnswer).

       Only structures that are actually visible are asked about: asking someone
       to click a lung they have filtered out is a question about the interface
       rather than anatomy. */
    const hunt = { active:false, target:null, answered:false, asked:[], right:0, total:0, o:{} };

    function huntPool(){
      return ENTRIES.filter(([key, c]) => key !== 'skin' && visible(key) && !!c.name);
    }
    function huntSet(html){ if (hunt.o.panel) hunt.o.panel.innerHTML = html; }
    function huntSay(text){ if (hunt.o.live) hunt.o.live.textContent = text; }
    function nextHunt(firstKey){
      const pool = huntPool();
      if (!pool.length) {
        huntSet('<div class="hunt-q">No structures are visible — turn a system back on.</div>');
        return;
      }
      let pick = firstKey && pool.find(([k]) => k === firstKey), tries = 0;
      if (!pick) {
        do { pick = pool[Math.floor(Math.random() * pool.length)]; tries++; }
        while (tries < 60 && hunt.asked.includes(pick[0]) && hunt.asked.length < pool.length);
      }
      hunt.target = { key: pick[0], content: pick[1] };
      hunt.answered = false;
      hunt.asked.push(pick[0]);
      if (hunt.asked.length > pool.length - 1) hunt.asked = [];
      renderHunt();
    }
    function renderHunt(){
      const t = hunt.target;
      huntSet(`
        <div class="hunt-q">
          <span class="hunt-k">Find it on the model</span>
          <strong>${t.content.name}</strong>
          <span class="hunt-sys">${SYSTEM_LABELS[t.content.system] || t.content.system}</span>
        </div>
        <div class="hunt-tally">${hunt.total ? hunt.right + ' of ' + hunt.total : 'Click the structure on the model, or pick it from the list.'}</div>
        <div class="hunt-after"></div>
        <div class="hunt-actions">
          <button type="button" class="hunt-skip" data-hunt="show">Show me</button>
          <button type="button" class="hunt-stop" data-hunt="stop">Stop</button>
        </div>
      `);
      huntSay('Find the ' + t.content.name + '.');
    }
    function huntAfter(html){
      const after = hunt.o.panel && hunt.o.panel.querySelector('.hunt-after');
      if (!after) return;
      after.innerHTML = html + '<button type="button" class="hunt-next" data-hunt="next">Next</button>';
      const next = after.querySelector('[data-hunt="next"]');
      if (next && hunt.o.panel.contains(document.activeElement)) next.focus();
    }
    function answerHunt(pickedKey){
      const t = hunt.target;
      hunt.answered = true;
      hunt.total++;
      const right = pickedKey === t.key;
      if (right) hunt.right++;
      const picked = CONTENT_BY_KEY[pickedKey];
      huntAfter(right
        ? `<div class="hunt-verdict ok">That is the ${t.content.name}.</div>`
        : `<div class="hunt-verdict no">That is the ${picked ? picked.name : 'the wrong structure'}.${t.content.location ? ` The ${t.content.name} is ${t.content.location.charAt(0).toLowerCase() + t.content.location.slice(1)}` : ''}</div>`);
      if (window.LevlSound) window.LevlSound.answer(right);
      huntSay(right
        ? 'Correct, that is the ' + t.content.name + '.'
        : 'Not quite. That is the ' + (picked ? picked.name : 'a different structure') + '.');
      if (hunt.o.onAnswer) {
        try { hunt.o.onAnswer({ correct: right, key: t.key, name: t.content.name, picked: pickedKey, pickedName: picked ? picked.name : '' }); }
        catch(e){ console.error(e); }
      }
    }
    /* "Show me" selects the answer rather than describing it, because the whole
       question was where the thing is. It does not count as a miss; asking to
       be shown is a reasonable thing to do and punishing it teaches guessing. */
    function revealHunt(){
      const t = hunt.target;
      hunt.answered = true;
      huntAfter(`<div class="hunt-verdict">Highlighted: the ${t.content.name}.</div>`);
      selectGroup(t.key, 'reveal');
      huntSay('Showing the ' + t.content.name + '.');
    }
    function startHunt(o){
      hunt.o = Object.assign({}, opts.hunt || {}, o || {});
      hunt.active = true;
      hunt.right = 0; hunt.total = 0; hunt.asked = [];
      if (hunt.o.panel) hunt.o.panel.hidden = false;
      clear();
      nextHunt(resolve(hunt.o.first));
    }
    function stopHunt(){
      if (!hunt.active) return;
      hunt.active = false;
      hunt.target = null;
      if (hunt.o.panel) hunt.o.panel.hidden = true;
      huntSay(hunt.total ? 'Quiz stopped. ' + hunt.right + ' of ' + hunt.total + '.' : '');
      if (hunt.o.onStop) hunt.o.onStop({ right: hunt.right, total: hunt.total });
    }
    function huntClick(e){
      const b = e.target.closest('[data-hunt]');
      if (!b || !hunt.active) return;
      const act = b.getAttribute('data-hunt');
      if (act === 'show') revealHunt();
      else if (act === 'stop') stopHunt();
      else if (act === 'next') nextHunt();
    }
    const huntPanels = new Set();
    function wireHuntPanel(){
      const p = hunt.o.panel;
      if (p && !huntPanels.has(p)) { huntPanels.add(p); p.addEventListener('click', huntClick); }
    }

    /* ---- theme ---- */
    const themeWatch = new MutationObserver(() => { if (scene) backdrop(); });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    /* ---- When to load (see the note at the top) ---- */
    let io = null;
    const mode = opts.autoload || 'visible';
    if (mode === 'now') start();
    else if (mode === 'tap' || slowConnection()) {
      spinner.hidden = true;
      loadText.textContent = mode === 'tap' ? 'The 3D model loads when you ask for it.'
        : 'Your connection looks slow or data-saving, so the 3D model waits until you ask for it. Everything else on this page works without it.';
      loadBtn.hidden = false;
    } else if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) { io.disconnect(); io = null; start(); }
      }, { rootMargin: '300px 0px' });
      io.observe(el);
    } else start();

    if (infoEl) infoEl.innerHTML = placeholder;
    renderList();
    const focusKey = resolve(opts.focus);
    if (focusKey) selectGroup(focusKey, 'focus');

    const api = {
      el,
      /* Select and frame a structure by Browse-by-name label or key. Returns the key, or null if unknown. */
      select(name){ const k = resolve(name); if (k) selectGroup(k, 'focus'); return k; },
      find: resolve,
      clear,
      reset,
      selected(){ return selectedGroupKey; },
      /* A softer glow on several structures at once, without selecting; [] clears. */
      highlight(names){
        const keys = (Array.isArray(names) ? names : [names]).map(resolve).filter(Boolean);
        const old = highlighted;
        highlighted = keys;
        if (L) old.forEach(k => { if (k !== selectedGroupKey) for (const m of meshByGroup[k] || []) restore(m); });
        if (L) keys.forEach(k => { if (k !== selectedGroupKey) highlightGroup(k, 0.35); });
        return keys;
      },
      setSystems(list){ activeSystems = new Set(list || ALL_SYSTEMS); applyLayers(); emit('layers', api.layers()); },
      setSkin(on){ skinOn = !!on; applyLayers(); emit('layers', api.layers()); },
      layers(){ return { systems: Array.from(activeSystems), skin: skinOn }; },
      info(name){ const k = resolve(name); return k ? Object.assign({ key: k }, CONTENT_BY_KEY[k]) : null; },
      structures(all){
        return ENTRIES.filter(([k]) => all || visible(k)).map(([k, c]) => ({ key: k, name: c.name, system: c.system, kind: c.kind }));
      },
      load: start,
      loaded(){ return loaded; },
      on(name, fn){ if (listeners[name]) listeners[name].push(fn); return api; },
      hunt: {
        start(o){ startHunt(o); wireHuntPanel(); return api.hunt; },
        stop(){ stopHunt(); return api.hunt; },
        active(){ return hunt.active; },
        score(){ return { right: hunt.right, total: hunt.total }; },
      },
      destroy(){
        destroyed = true;
        if (io) io.disconnect();
        themeWatch.disconnect();
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', onResize);
        if (renderer) renderer.dispose();
      },
    };
    return api;
  }

  window.LevlBodyViewer = {
    mount,
    SYSTEM_LABELS,
    systems: ALL_SYSTEMS.slice(),
    find: resolve,
    info(name){ const k = resolve(name); return k ? Object.assign({ key: k }, CONTENT_BY_KEY[k]) : null; },
    structures(){ return ENTRIES.map(([k, c]) => ({ key: k, name: c.name, system: c.system, kind: c.kind })); },
  };
})();
