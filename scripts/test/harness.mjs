/* Loads the site's browser modules into a Node test.

   Everything in assets/ is an IIFE that assigns itself onto `window` and talks
   to localStorage directly — there is no build step and no module system, which
   is the point of the stack and not something worth changing to get tests. So
   the tests bring the browser to the code: a VM context with just enough of a
   window, a real-enough localStorage, and a clock the test controls.

   The clock matters more than it looks. Both engines under test are about
   *time* — a streak is "did something happen yesterday", spaced repetition is
   "is this due yet", decay is "how long since you saw it". None of that can be
   tested against a real Date.now() without either sleeping or asserting
   nothing. setNow() moves the sandbox's clock; the code inside sees an
   ordinary Date. */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function createBrowser(){
  let clock = Date.UTC(2026, 0, 15, 12, 0, 0);

  function MockStorage(){
    const map = new Map();
    return {
      getItem: k => (map.has(String(k)) ? map.get(String(k)) : null),
      setItem: (k, v) => { map.set(String(k), String(v)); },
      removeItem: k => { map.delete(String(k)); },
      clear: () => map.clear(),
      key: i => Array.from(map.keys())[i] ?? null,
      get length(){ return map.size; },
    };
  }

  // A Date that reports the sandbox clock for "now" but behaves normally when
  // handed an explicit value, so date arithmetic inside the modules is real.
  class MockDate extends Date {
    constructor(...args){
      if(args.length === 0) super(clock);
      else super(...args);
    }
    static now(){ return clock; }
  }

  const localStorage = MockStorage();
  const window = {
    localStorage,
    sessionStorage: MockStorage(),
    Date: MockDate,
    matchMedia: () => ({ matches: false, addEventListener(){}, removeEventListener(){} }),
    addEventListener(){}, removeEventListener(){},
    requestAnimationFrame(){ return 0; },
    setTimeout, clearTimeout, setInterval, clearInterval,
    console,
  };
  window.window = window;

  // Minimal document: the engines touch it only to look for chrome that is
  // not present in a test, so every query legitimately finds nothing.
  const document = {
    readyState: 'complete',
    addEventListener(){}, removeEventListener(){},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    createElement: () => ({ style: {}, classList: { add(){}, remove(){}, toggle(){} },
                            setAttribute(){}, appendChild(){}, addEventListener(){} }),
    body: null, head: null,
  };

  const sandbox = {
    window, document, localStorage,
    sessionStorage: window.sessionStorage,
    navigator: { userAgent: 'node' },
    location: { href: 'http://localhost/', pathname: '/', search: '' },
    Date: MockDate,
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    requestAnimationFrame: () => 0,
    matchMedia: window.matchMedia,
    fetch: () => Promise.reject(new Error('no network in tests')),
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  return {
    window,
    localStorage,
    /* Load one of the site's files into this context. */
    load(path){
      vm.runInContext(readFileSync(path, 'utf8'), sandbox, { filename: path });
      return window;
    },
    /* Move the sandbox clock. Both take effect immediately for any code that
       calls Date.now() or new Date() afterwards. */
    setNow(ms){ clock = ms; },
    advanceDays(n){ clock += n * 86400000; },
    now(){ return clock; },
  };
}

/* The day-key format both the streak code and these tests use, computed for an
   offset from the sandbox's current day in local time — which is what the
   product code does, so the tests have to agree with it rather than with UTC. */
export function dayKeyFor(ms, offsetDays = 0){
  const d = new Date(ms);
  if(offsetDays) d.setDate(d.getDate() + offsetDays);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
