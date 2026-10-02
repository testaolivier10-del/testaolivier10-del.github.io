/* Every OpenStax figure the A&P course shows carries its full credit, and every
   one shown with printed labels hidden says so.

   Guards audit 2026-10, fix 11 (and the A&P rows "OpenStax third-party photo
   credits dropped" and "authors and Rice University never named; masked
   figures not marked"). The credit text is built from each figure's data by
   scripts/lib/anp-build.mjs (attribution()); this checks what the built pages,
   the question bank and the lab practical data actually carry. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BOOK = /J\. Gordon Betts et al\., (<i>)?Anatomy and Physiology 2e(<\/i>)?, OpenStax, (&copy;|©) Rice University/;
const ADAPTED = 'Adapted: labels hidden.';

export default function anpFigureCredits({ ROOT, fail }) {
  const A = join(ROOT, 'anatomy-physiology');
  if (!existsSync(A)) return;
  for (const dir of ['lessons', 'notes']) {
    for (const name of readdirSync(join(A, dir)).filter((n) => n.endsWith('.html'))) {
      const html = readFileSync(join(A, dir, name), 'utf8');
      for (const m of html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/g)) {
        const inner = m[1];
        const os = inner.match(/src="[^"]*figures\/(os-[\w-]+)\./);
        if (!os) continue;
        const cap = (inner.match(/<figcaption>([\s\S]*?)<\/figcaption>/) || [])[1] || '';
        const where = `anatomy-physiology/${dir}/${name} (${os[1]})`;
        if (!BOOK.test(cap) || !/CC BY 4\.0/.test(cap)) fail(`${where}: caption lacks the OpenStax credit (J. Gordon Betts et al., Anatomy and Physiology 2e, OpenStax, © Rice University, CC BY 4.0)`);
        if (/class="anp-(mask|cover)"/.test(inner) && !cap.includes(ADAPTED)) fail(`${where}: labels are hidden but the caption does not say "${ADAPTED}"`);
      }
    }
  }
  const bank = join(A, 'assets', 'bank');
  if (existsSync(bank)) {
    for (const name of readdirSync(bank).filter((n) => n.endsWith('.json') && !n.endsWith('-why.json') && n !== 'index.json')) {
      for (const q of JSON.parse(readFileSync(join(bank, name), 'utf8'))) {
        if (!q.fig || !/figures\/os-/.test(q.fig.src)) continue;
        if (!BOOK.test(q.fig.credit || '')) fail(`anatomy-physiology/assets/bank/${name} ${q.id}: figure question has no OpenStax credit`);
        else if ((q.fig.covers || q.fig.pin) && !q.fig.credit.includes(ADAPTED)) fail(`anatomy-physiology/assets/bank/${name} ${q.id}: labels are covered but the credit does not say "${ADAPTED}"`);
      }
    }
  }
  const lab = join(A, 'assets', 'tool-data', 'lab-practical.json');
  if (existsSync(lab)) {
    for (const [id, f] of Object.entries(JSON.parse(readFileSync(lab, 'utf8')).figures || {})) {
      if (!/^os-/.test(id)) continue;
      if (!BOOK.test(f.attribution || '') || !(f.attribution || '').includes(ADAPTED)) fail(`anatomy-physiology/assets/tool-data/lab-practical.json ${id}: lab figure lacks its full credit with "${ADAPTED}"`);
    }
  }
  const credits = join(A, 'credits.html');
  if (existsSync(credits) && !BOOK.test(readFileSync(credits, 'utf8'))) fail('anatomy-physiology/credits.html: does not name J. Gordon Betts et al., Anatomy and Physiology 2e, OpenStax, © Rice University');
}
