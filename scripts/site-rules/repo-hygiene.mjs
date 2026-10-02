/* Repository hygiene: secrets stay out of git, CI runs with a read-only token
   and pinned actions, and the CI tools are pinned by a lockfile.

   Audit findings (site audit 2026-10, "Performance, repo and infrastructure"):
   .gitignore lacked .wrangler/, .dev.vars, .env* and *.pem; the workflows had
   no permissions block and used actions by tag; Playwright was installed
   unpinned on every run. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const IGNORED = ['.wrangler/', '.dev.vars', '.env*', '*.pem'];

export default function ({ ROOT, fail }) {
  const gi = readFileSync(join(ROOT, '.gitignore'), 'utf8').split('\n').map((l) => l.trim());
  for (const e of IGNORED) if (!gi.includes(e)) fail(`repo-hygiene: .gitignore is missing "${e}".`);

  const wf = join(ROOT, '.github', 'workflows');
  for (const f of readdirSync(wf).filter((n) => /\.ya?ml$/.test(n))) {
    const y = readFileSync(join(wf, f), 'utf8');
    if (!/^permissions:\s*\n\s+contents: read/m.test(y)) fail(`repo-hygiene: ${f} needs a top-level "permissions: contents: read".`);
    for (const m of y.matchAll(/uses:\s*([^\s#]+)/g)) {
      if (!/@[0-9a-f]{40}$/.test(m[1])) fail(`repo-hygiene: ${f} uses ${m[1]} by tag; pin it to a commit SHA.`);
    }
    if (/npm i(nstall)? --no-save/.test(y)) fail(`repo-hygiene: ${f} installs tools unpinned; use npm ci with package-lock.json.`);
  }
  if (!existsSync(join(ROOT, 'package-lock.json'))) fail('repo-hygiene: package-lock.json is missing (CI runs npm ci).');
  else {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    if (pkg.dependencies && Object.keys(pkg.dependencies).length) fail('repo-hygiene: package.json has runtime dependencies; the site has no build step, only CI devDependencies.');
  }
}
