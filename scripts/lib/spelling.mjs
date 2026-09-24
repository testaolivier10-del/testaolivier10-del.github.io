/* British spellings, and where on the page a reader would actually see one.

   This site teaches an American exam and an American chemistry course, so its
   prose is American. Two earlier passes converted what a text-node sweep could
   reach; what they could not reach was everything held in a JavaScript string
   — the study-notes chapters, the scenario nodes, the ochem question banks,
   the tool copy — which is most of the words on the site.

   The hard part is not the word list. It is knowing which occurrences are
   TEXT. `stereocentre` in a sentence is a misspelling; `stereocentre` as an
   object key is a name, and renaming it silently breaks a lookup. So a string
   literal counts only if it reads like prose — three words or more — and
   nothing outside a string, text node or visible attribute is ever touched.

   Used by scripts/check-site.mjs (check 27). The conversion itself was applied
   with this same module, and verified by stripping every string literal from
   every changed .js file and confirming the code residue was byte-identical,
   and by comparing the tag structure of every changed .html file.  */
export const FIX = [
  ['memoris', 'memoriz'], ['localis', 'localiz'], ['delocalis', 'delocaliz'],
  ['stabilis', 'stabiliz'], ['destabilis', 'destabiliz'],
  ['recognis', 'recogniz'], ['unrecognis', 'unrecogniz'],
  ['generalis', 'generaliz'], ['standardis', 'standardiz'],
  ['ionis', 'ioniz'], ['polaris', 'polariz'], ['synthesis', 'synthesiz'],
  ['analyse', 'analyze'], ['analysing', 'analyzing'], ['catalysed', 'catalyzed'],
  ['catalyses', 'catalyzes'], ['catalysing', 'catalyzing'],
  ['neighbour', 'neighbor'], ['behaviour', 'behavior'], ['colour', 'color'],
  ['favour', 'favor'], ['unfavour', 'unfavor'], ['vapour', 'vapor'],
  ['centre', 'center'], ['centred', 'centered'], ['centres', 'centers'],
  ['stereocentre', 'stereocenter'],
  ['grey', 'gray'],
  ['anaemi', 'anemi'], ['haemoglobin', 'hemoglobin'], ['haemat', 'hemat'],
  ['aluminium', 'aluminum'],
  ['labelled', 'labeled'], ['relabelled', 'relabeled'], ['levelled', 'leveled'],
  ['signalling', 'signaling'], ['cancelled', 'canceled'],
  ['practise', 'practice'], ['practised', 'practiced'], ['practises', 'practices'],
  ['programmes', 'programs'], ['draughtsman', 'draftsman'],
];
// Correct American words that contain one of the fragments above.
export const SAFE = /^(?:synthesis|photosynthesis|biosynthesis|retrosynthesis|analysis|analyses|analyst\w*|analytic\w*|catalysis|catalyst\w*|paralysis|hydrolysis|organism\w*|microorganism\w*|emphasis|dialysis|greyhound|labelledby|styrene\w*|gastroesophageal|haemophilus|angioedema|programmed|programming|distill\w*|specialist\w*|characteristic\w*|fulfill\w*|reanalysis|cancelledAt|analyser|analysernode)$/i;


export function findAll(text) {
  const out = [];
  for (const [brit, amer] of FIX) {
    for (const m of text.matchAll(new RegExp('[A-Za-z]*' + brit + '[A-Za-z]*', 'gi'))) {
      if (SAFE.test(m[0])) continue;
      out.push({ word: m[0], at: m.index, brit, amer });
    }
  }
  return out;
}

export function americanize(word, brit, amer) {
  const i = word.toLowerCase().indexOf(brit);
  const head = word.slice(0, i);
  const mid = word.slice(i, i + brit.length);
  const tail = word.slice(i + brit.length);
  // Preserve the original casing shape of the replaced fragment.
  let rep = amer;
  if (mid === mid.toUpperCase() && mid !== mid.toLowerCase()) rep = amer.toUpperCase();
  else if (mid[0] === mid[0].toUpperCase()) rep = amer[0].toUpperCase() + amer.slice(1);
  return head + rep + tail;
}

// A string literal counts as prose only if it reads like a sentence fragment:
// at least three words. "stereocentre" alone could be an object key; "the
// stereocentre is inverted" could not.
const PROSE = (s) => {
  const words = s.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean);
  return words.length >= 3;
};

function stringSpans(src, from, to) {
  // Quoted strings and template literals within [from, to).
  const spans = [];
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
  re.lastIndex = from;
  let m;
  while ((m = re.exec(src)) && m.index < to) {
    const body = m[1] ?? m[2] ?? m[3] ?? '';
    if (PROSE(body)) spans.push([m.index + 1, m.index + 1 + body.length]);
  }
  return spans;
}

export function visibleSpans(path, src) {
  const spans = [];
  if (path.endsWith('.json')) {
    // Prose fields of the banks; everything else in a JSON file is structure.
    const re = /"(?:q|explain|why|text|blurb|consequence|title|heading|label|stem|prompt|note|answer|hint|caption|alt|summary|body|desc|description)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    let m;
    while ((m = re.exec(src))) {
      const start = m.index + m[0].length - m[1].length - 1;
      if (PROSE(m[1])) spans.push([start, start + m[1].length]);
    }
    // Bare strings inside an options/array of prose. An "accept" list is the
    // answers a typed-answer tool takes, so it deliberately includes the
    // British spelling a student might type ("grey ramus"); it is never shown.
    const accepted = [];
    const reAcc = /"accept"\s*:\s*\[[^\]]*\]/g;
    while ((m = reAcc.exec(src))) accepted.push([m.index, m.index + m[0].length]);
    const re2 = /"((?:[^"\\]|\\.)*)"/g;
    while ((m = re2.exec(src))) {
      const body = m[1];
      if (!PROSE(body)) continue;
      if (accepted.some(([a, b]) => m.index >= a && m.index < b)) continue;
      // Skip anything that is a key (followed by a colon).
      if (/^\s*:/.test(src.slice(m.index + m[0].length))) continue;
      spans.push([m.index + 1, m.index + 1 + body.length]);
    }
    return spans;
  }

  if (path.endsWith('.js') || path.endsWith('.mjs')) {
    return stringSpans(src, 0, src.length);
  }

  if (path.endsWith('.md') || path.endsWith('.xml')) {
    return [[0, src.length]];
  }

  // HTML: text nodes outside script/style, the attributes a reader sees, and
  // prose string literals inside inline scripts.
  const blocked = [];
  for (const m of src.matchAll(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    blocked.push([m.index, m.index + m[0].length, m[1].toLowerCase(), m.index + m[0].indexOf('>') + 1, m.index + m[0].length - (m[1].length + 3)]);
  }
  const inBlocked = (i) => blocked.find((b) => i >= b[0] && i < b[1]);

  let cursor = 0;
  for (const m of src.matchAll(/<[^>]+>/g)) {
    if (m.index > cursor && !inBlocked(cursor)) spans.push([cursor, m.index]);
    // Visible attribute values on this tag.
    for (const a of m[0].matchAll(/\b(?:alt|title|aria-label|placeholder|content)\s*=\s*"([^"]*)"/gi)) {
      const start = m.index + a.index + a[0].length - a[1].length - 1;
      spans.push([start, start + a[1].length]);
    }
    cursor = m.index + m[0].length;
  }
  if (cursor < src.length && !inBlocked(cursor)) spans.push([cursor, src.length]);

  for (const b of blocked) {
    if (b[2] === 'script') spans.push(...stringSpans(src, b[3], b[4]));
  }
  return spans;
}
