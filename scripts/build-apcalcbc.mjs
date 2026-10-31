/* The AP® Calculus BC course generator (docs/apcalcbc-spec.md, docs/apcalcbc-architecture.md).

   One generator, two courses: this runs scripts/build-apcalc.mjs with the BC
   profile (APCALC_COURSE=bc, scripts/lib/apcalc-build.mjs PROFILES.bc). It reads
   the BC map (docs/apcalcbc-dependency-map.json, an overlay merged onto AB's),
   AB's authored topics from calculus/data/ and BC's own from calculus-bc/data/,
   and writes calculus-bc/. Nothing of AB is copied; BC pages run AB's runtime
   from /calculus/assets/ with window.ApCalcCourse saying which course they are.

     node scripts/build-apcalcbc.mjs            write everything
     node scripts/build-apcalcbc.mjs --check    exit 1 if anything on disk is stale
     --out <dir>                                write the calculus-bc/ tree there (tests)
     APCALCBC_PUBLISHED=unit-10,skills-math     override calculus-bc/data/published.json (tests)
     APCALCBC_DATA=<dir>                        read BC's authored data from <dir> (tests)
     APCALC_DATA=<dir>                          read AB's authored data from <dir> (tests)

   Nothing it writes is edited by hand. No served path carries the token "ap". */
process.env.APCALC_COURSE = 'bc';
await import('./build-apcalc.mjs');
