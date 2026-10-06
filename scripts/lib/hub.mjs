/* assets/course/hub.js (window.LevlHub) for the generators: the static
   tools hub cards are rendered with the same function the browser uses, so
   a generated hub and a script-rendered hub cannot differ. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const sandbox = { globalThis: {} };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(ROOT, 'assets', 'course', 'hub.js'), 'utf8'), sandbox);
export const Hub = sandbox.LevlHub;
