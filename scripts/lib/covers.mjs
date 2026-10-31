/* Course cover art (site redesign 2026-10, docs/site-redesign.md): each course's
   own drawing in assets/covers/<key>.svg with its two-tone title and handwritten
   line written over it in HTML, so the headline uses the site's display face.
   Used by the homepage cards (scripts/build-pricing.mjs) and the banner at the
   top of every course home (the course builders, nremt/ and ochem/ by hand). */
export const COVERS = {
  nremt: { t1: 'NREMT', t2: 'EMT Prep', hand: '911 call to hospital' },
  ochem: { t1: 'Organic', t2: 'Chemistry', hand: 'push the arrows yourself' },
  anp: { t1: 'Anatomy &amp;', t2: 'Physiology', hand: 'how your body is built' },
  apbio: { t1: 'AP®', t2: 'Biology', hand: 'every unit, data questions' },
  apchem: { t1: 'AP®', t2: 'Chemistry', hand: 'units and sig figs, checked' },
  apphys: { t1: 'AP®', t2: 'Physics 1', hand: 'force by force' },
  apcalc: { t1: 'AP®', t2: 'Calculus AB', hand: 'typed like real math' },
  apstat: { t1: 'AP®', t2: 'Statistics', hand: 'conclusions in context' },
  apenv: { t1: 'AP® Environmental', t2: 'Science', hand: 'every calculation, with units' },
  appsych: { t1: 'AP®', t2: 'Psychology', hand: 'every concept, applied' },
  apprecalc: { t1: 'AP®', t2: 'Precalculus', hand: 'see every function move' },
};

/* The banner over a course home's hero. Decorative: the course is named by the
   eyebrow and the headline right under it, so screen readers skip it. `up` is
   the path back to the site root ('../' from a course home). */
export function courseBanner(key, up = '../') {
  const c = COVERS[key];
  if (!c) throw new Error(`covers: no cover for "${key}"`);
  return `<div class="course-banner" data-cover="${key}" aria-hidden="true"><img src="${up}assets/covers/${key}.svg" alt="" width="640" height="320" decoding="async"><span class="cv-t"><b>${c.t1}<span>${c.t2}</span></b><em>${c.hand}</em></span></div>`;
}
