import requests, json, sys, os
K=open('/mnt/user-data/uploads/Downloads/levlprep/elevenlabs_key.txt').read().strip()
L = {
 'amb_altitude': ("Inside the steady roar of a World War Two bomber formation at high altitude, many four engine propeller planes droning together, cold wind rushing past, no music", 10),
 'flak_close': ("A single anti aircraft flak shell bursting close by in the sky, sharp crack, then a heavy rolling boom echoing, World War Two", 3),
 'flak_far': ("Distant anti aircraft flak bursts thudding far away across the sky, two muffled booms", 3),
 'hit_engine': ("A propeller aircraft engine is hit by flak: metallic bang, the engine coughs and sputters, catches fire crackling, then the plane dives away with a descending engine whine", 5),
 'down_far': ("A distant bomber going down far away, its engine whine slowly falling in pitch as it dives, over the drone of other planes", 4),
 'landing': ("A World War Two bomber landing at dawn: propeller engines throttling down, tires chirp and thump on the concrete runway, birds singing in the distance", 4),
 'hangar_room': ("Large empty aircraft hangar room tone, tall echoing space, faint distant metal clinks, a little wind outside the doors, no music", 10),
 'marks': ("Quick taps of a grease pencil marking small dots on an aluminum aircraft panel, close up, several taps in a row", 3),
 'chains_plate': ("A heavy steel armor plate lowered fast on rattling iron chains, it swings and settles with one deep heavy metallic clank and a creak of the chains, in a big hangar", 4),
 'plates_drop': ("Three heavy steel plates set down onto an aircraft wing one after another, three deep metal clanks with hangar echo", 3),
 'office_night': ("Quiet 1940s office at night, an old wall clock ticking softly, faint hum of a desk lamp, distant crickets through a closed window, no music", 8),
 'page': ("A single sheet of paper slid across a wooden desk and turned over", 2),
 'pencil': ("Close up pencil on paper: quick small dots being tapped, then a pencil drawing four fast circles", 5),
 'plates_move': ("Steel plates lifted off an aircraft with a metal scrape, then set down onto the engines with solid clanks and a ratchet tightening bolts, in a hangar", 4),
 'field_dusk': ("An airfield at dusk, light wind over grass, distant birds settling, footsteps on gravel nearby, no music", 8),
 'engines_start': ("World War Two bomber propeller engines coughing to life one after another and settling into an idle", 3),
}
for name, (txt, d) in L.items():
    if os.path.exists(name + '.mp3'): continue
    r = requests.post('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192', headers={'xi-api-key': K},
                      json={'text': txt, 'duration_seconds': d, 'prompt_influence': 0.5}, timeout=300)
    print(name, r.status_code, '' if r.status_code == 200 else r.text[:200])
    if r.status_code == 200: open(name + '.mp3', 'wb').write(r.content)
