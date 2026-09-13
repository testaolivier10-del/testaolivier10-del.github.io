# Sound files for the trainer

Drop audio files in this directory and the trainer prefers them over
everything else, with no code change. That is the point of the directory:
`sound-bank.js` tries a local file first, the remote URL second, and
synthesis last.

## Why this is worth doing

The lung sounds are currently streamed from Wikimedia. They are correctly
licensed and correctly credited, but they are cross-origin, and the service
worker cannot cache a cross-origin response (an opaque response reports
`response.ok === false`, so the cache-first branch never stores it). The
consequence is that the sound trainer is the one page in this PWA that stops
working offline while everything else keeps going.

A file in this directory fixes that for the sound it replaces.

## What to add

Name the file after the sound's `id` in `sound-trainer.html` and set
`localSrc` on that entry to `assets/audio/<name>`. Any format browsers play
is fine; `.ogg` and `.mp3` are the safe pair.

| Sound   | File to add     | Where the current clip comes from |
|---------|-----------------|-----------------------------------|
| wheeze  | `wheeze.ogg`    | Wikimedia Commons, `Wheeze2O.ogg` |
| crackles| `crackles.ogg`  | Wikimedia Commons, `Crackles_pneumoniaO.ogg` |
| stridor | `stridor.ogg`   | Wikimedia Commons, `Stridor_NP_OGG_2.ogg` |
| rhonchi | —               | already inlined as a data URI |
| normal  | —               | already inlined as a data URI |

Keep the `creditUrl` on each entry pointing at the original file page. These
are freely licensed, not public domain — attribution is a condition, and the
trainer renders it under every clip that has one.

## The heart sounds are generated, not recorded

`sound-bank.js` synthesizes them, and the page labels every one as generated
wherever it appears. That is a deliberate choice rather than a placeholder:
what a student has to learn from S1, S2, S3, S4 and the two murmur timings is
*where in the cycle each one falls*, and that structure is exactly what
synthesis reproduces faithfully.

Real recordings would still be better, and they slot in the same way — add
`heart-s3.ogg` and set `localSrc` on the entry. A sound with a `localSrc`
stops being labelled as generated, because it no longer is.

Lung sounds should **not** be synthesized. A wheeze is a texture, and a
student who learns a synthetic texture has learned the wrong thing.
