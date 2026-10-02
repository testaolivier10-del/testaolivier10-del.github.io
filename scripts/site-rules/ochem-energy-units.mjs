/* Ochem energy units: kcal/mol is the primary unit, and kJ/mol never stands alone.

   Audit finding (site audit 2026-10, Notes): the kinetic/thermodynamic and
   conjugation pages worked in kJ/mol while energy diagrams, the tools and the
   bank used kcal/mol, so a student comparing "12 kJ/mol" with "3 kcal/mol"
   had no way to see they were the same size. Decision (docs/site-audit-notes/
   w5.md): kcal/mol is the course's primary unit; pages and questions built on
   kJ/mol data (heats of hydrogenation, conjugation) keep their tables in
   kJ/mol and give the kcal/mol value beside the numbers that matter.

   This rule fails on a bank question that mentions kJ/mol without kcal/mol
   anywhere in it, and on a notes or lesson page whose prose (outside figures)
   mentions kJ/mol but never kcal/mol. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export default function({ ROOT, fail }){
  const bank = JSON.parse(readFileSync(join(ROOT, 'ochem/assets/practice-bank.json'), 'utf8'));
  for(const topic of Object.keys(bank)){
    bank[topic].forEach((q, i) => {
      const text = [q.q, ...q.options, q.why].join(' ');
      if(/kJ/.test(text) && !/kcal/.test(text)) fail(`ochem bank ${topic}#${i}: gives kJ/mol with no kcal/mol value`);
    });
  }
  for(const dir of ['ochem/notes', 'ochem/lessons']){
    for(const f of readdirSync(join(ROOT, dir)).filter((n) => n.endsWith('.html'))){
      const prose = readFileSync(join(ROOT, dir, f), 'utf8').replace(/<svg[\s\S]*?<\/svg>/g, ' ');
      if(/kJ\/mol/.test(prose) && !/kcal\/mol/.test(prose)) fail(`${dir}/${f}: uses kJ/mol and never gives kcal/mol`);
    }
  }
}
