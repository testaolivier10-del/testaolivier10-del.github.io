/* One notation for the ochem question bank and the text data beside it.

   The October 2026 audit counted 678 bank items writing formulas as H2SO4, 267
   with subscripts (H₂SO₄) and 14 mixing both, charges typed as "RCOO^-",
   "Huckel" beside "Hückel", and stray double spaces. None of it is wrong
   chemistry, but a student comparing two options that differ only in how a
   formula is typed reads a difference that is not there.

   What this rewrites, inside JSON string values only:
     - formula digits to Unicode subscripts: H2SO4 -> H₂SO₄, (CH3)3C -> (CH₃)₃C,
       Et3N -> Et₃N. A token is only treated as a formula when every piece of it
       is an element symbol or a standard group abbreviation (Me, Et, Ph, ...).
       Never touched: SN1/SN2, carbon and nitrogen locants (C2, N9), sp2/sp3,
       13C, 2H, and anything starting with a digit.
     - charges to superscripts: "^-" "^2-" anywhere, and a + or - written
       straight after a formula or a common ion (NH4+, H3O+, OH-, Br-) when it
       ends the token (followed by a space, punctuation or the end).
     - "Huckel" -> "Hückel".
     - two or more spaces between words -> one; before a numbered step
       ("1. KMnO4  2. H3O+") -> "; ".

   Files: ochem/assets/practice-bank.json (the generated core/why halves follow
   from build-ochem-bank.mjs), ochem/assets/concept-teach.json and
   ochem/data/glossary.json (ochem/assets/glossary.json follows from
   build-ochem-glossary.mjs). Each file is rewritten as raw text, string by
   string, so its formatting and key order are untouched.

     node scripts/normalize-ochem-notation.mjs           rewrite
     node scripts/normalize-ochem-notation.mjs --check   list what is not normal, exit 1 if any

   scripts/site-rules/ochem-notation.mjs runs the --check logic in check-site. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

export const NOTATION_FILES = [
  'ochem/assets/practice-bank.json',
  'ochem/assets/concept-teach.json',
  'ochem/data/glossary.json',
];

const SUB = { 0:'₀', 1:'₁', 2:'₂', 3:'₃', 4:'₄', 5:'₅', 6:'₆', 7:'₇', 8:'₈', 9:'₉' };
const SUP = { 0:'⁰', 1:'¹', 2:'²', 3:'³', 4:'⁴', 5:'⁵', 6:'⁶', 7:'⁷', 8:'⁸', 9:'⁹', '+':'⁺', '-':'⁻' };

// Element symbols that turn up in this course, and the group shorthands.
const UNITS = new Set(('H D B C N O F Na Mg Al Si P S Cl K Ca Cr Mn Fe Co Ni Cu Zn Br Ag Sn I Hg Pd Pt Li Os Se Rh Ru Ti Ce Cs Ba Sm ' +
                       'Me Et Pr Bu Ph Ac Ts Ms Bn Tf Bz Ar R X').split(' '));
// A single unit with a count is only a formula for these (gases, halogens).
const SINGLE_OK = new Set(['H2', 'D2', 'O2', 'O3', 'N2', 'Cl2', 'Br2', 'I2', 'F2']);
const NOT_FORMULA = /^(?:S[Nn][12]|SNAr|E1cB|E1cb)$/;
// Ions whose charge may be written straight after them without a digit.
const IONS = new Set(['H', 'D', 'OH', 'OR', 'RO', 'Cl', 'Br', 'I', 'F', 'CN', 'Na', 'K', 'Li', 'Ag', 'Cu', 'Hg', 'RS', 'HS', 'SH',
                      'RCOO', 'RO', 'MeO', 'EtO', 'HO', 'NC', 'X', 'Nu']);

function units(tok){
  // Pieces of a formula token: (, )n, Xn where X is a unit.
  const out = [];
  let i = 0;
  while(i < tok.length){
    const rest = tok.slice(i);
    let m = /^\(/.exec(rest) || /^\)\d*/.exec(rest);
    if(m){ out.push(m[0]); i += m[0].length; continue; }
    m = /^([A-Z][a-z]?)(\d*)/.exec(rest);
    if(!m) return null;
    let sym = m[1], digits = m[2];
    if(!UNITS.has(sym)){
      // 'Cl' read greedily might be C + l; a two-letter non-unit is not a formula.
      return null;
    }
    out.push(sym + digits);
    i += m[0].length;
  }
  return out;
}

function isFormula(tok){
  const bare = tok.replace(/^\((.*)\)$/, '$1');
  if(NOT_FORMULA.test(bare) || /S[Nn][12]/.test(tok)) return false;
  if(!/\d/.test(tok)) return false;
  // R1R2... numbers substituents; it is not a count.
  if(/R\dR/.test(tok)) return false;
  const u = units(tok);
  if(!u) return false;
  const atoms = u.filter(x => x !== '(' && !/^\)/.test(x));
  if(atoms.length === 1) return SINGLE_OK.has(atoms[0]) && !/\)\d/.test(tok);
  // Parentheses must balance.
  let d = 0;
  for(const x of u){ if(x === '(') d++; else if(x[0] === ')') { d--; if(d < 0) return false; } }
  return d === 0;
}

const subDigits = s => s.replace(/\d/g, c => SUB[c]);

/* Tokens: runs of letters, digits and parentheses, not preceded by a letter or
   digit (so "13C", "sp3" and "Q2" are never split into a formula). */
const TOKEN = /(?<![A-Za-z0-9₀-₉])[A-Z(][A-Za-z0-9()]*(?![A-Za-z0-9])/g;
const SPECIAL_IONS = { 'RCOO2-':'RCOO²⁻', 'O2-':'O²⁻', 'S2-':'S²⁻', 'N3-':'N₃⁻', 'Cu2+':'Cu²⁺', 'Fe2+':'Fe²⁺',
                       'Fe3+':'Fe³⁺', 'Mg2+':'Mg²⁺', 'Zn2+':'Zn²⁺', 'Ca2+':'Ca²⁺', 'Hg2+':'Hg²⁺' };
const SPECIAL = /(?<![A-Za-z0-9₀-₉])(RCOO2-|O2-|S2-|N3-|Cu2\+|Fe2\+|Fe3\+|Mg2\+|Zn2\+|Ca2\+|Hg2\+)(?=$|[\s,.;:!?)\]'"’”/])/g;
const CHARGED = /(?<![A-Za-z0-9₀-₉⁺⁻])([A-Z][A-Za-z0-9₀-₉()]*)([+-])(?=$|[\s,.;:!?)\]'"’”/])/g;

export function normalizeText(s){
  let out = s;
  // Caret charges: ^-, ^+, ^2-, ^2+.
  // Exponents first ("10^-5", "10^3"): sign then digits, all superscript.
  // A decimal exponent (10^1.6) has no superscript point, so it stays as written.
  out = out.replace(/\^([+\-−]?)(\d+)(?![+\-\d]|\.\d)/g, (m, sign, d) => (sign ? SUP[sign === '−' ? '-' : sign] : '') + d.replace(/\d/g, (c) => SUP[c]));
  out = out.replace(/\^(\d?)([+-])/g, (m, n, sign) => (n ? SUP[n] : '') + SUP[sign]);
  // A half-converted power of ten ("10⁻5") gets its digits raised too.
  out = out.replace(/(10[⁺⁻])(\d+)/g, (m, base, d) => base + d.replace(/\d/g, (c) => SUP[c]));
  // Ions whose digit is a charge, not a count (O2- is oxide, not O2 with a dash).
  out = out.replace(SPECIAL, (m, ion) => SPECIAL_IONS[ion]);
  // Formula tokens.
  out = out.replace(TOKEN, tok => {
    // An unbalanced bracket at either end is prose, not part of the formula.
    let pre = '', post = '', core = tok;
    const count = (s, c) => s.split(c).length - 1;
    while(core.endsWith(')') && count(core, '(') < count(core, ')')){ post = ')' + post; core = core.slice(0, -1); }
    while(core.startsWith('(') && count(core, '(') > count(core, ')')){ pre += '('; core = core.slice(1); }
    return pre + (isFormula(core) ? subDigits(core) : core) + post;
  });
  // A + or - closing a formula (now carrying a subscript) or a common ion is a charge.
  out = out.replace(CHARGED, (m, body, sign) =>
    ((/[₀-₉]/.test(body) && !body.endsWith(')')) || IONS.has(body)) ? body + SUP[sign] : m);
  out = out.replace(/Huckel/g, 'Hückel');
  out = out.replace(/(\S)[ \t]{2,}(?=\d+\.\s)/g, '$1; ');
  out = out.replace(/(\S)[ \t]{2,}(?=\S)/g, '$1 ');
  return out;
}

/* Every JSON string literal in a raw file, normalized in place. */
export function normalizeJsonText(raw){
  return raw.replace(/"((?:[^"\\]|\\.)*)"/g, (m, body) => '"' + normalizeText(body) + '"');
}

export function findIssues(ROOT){
  const issues = [];
  for(const f of NOTATION_FILES){
    const raw = readFileSync(join(ROOT, f), 'utf8');
    const lits = raw.match(/"((?:[^"\\]|\\.)*)"/g) || [];
    for(const lit of lits){
      const body = lit.slice(1, -1);
      const n = normalizeText(body);
      if(n !== body) issues.push({ file: f, before: body, after: n });
    }
  }
  return issues;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if(isMain){
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
  if(process.argv.includes('--check')){
    const issues = findIssues(ROOT);
    for(const x of issues.slice(0, 40)) console.log(x.file + ': ' + x.before.slice(0, 120));
    if(issues.length){ console.error(issues.length + ' string(s) not in normal notation; run node scripts/normalize-ochem-notation.mjs'); process.exit(1); }
    console.log('ochem notation: normal');
  } else {
    let total = 0;
    for(const f of NOTATION_FILES){
      const p = join(ROOT, f);
      const raw = readFileSync(p, 'utf8');
      const next = normalizeJsonText(raw);
      if(next !== raw){
        writeFileSync(p, next);
        const after = next.match(/"((?:[^"\\]|\\.)*)"/g) || [];
        const changed = (raw.match(/"((?:[^"\\]|\\.)*)"/g) || []).filter((lit, i) => lit !== after[i]).length;
        total += changed;
        console.log(f + ': ' + changed + ' string(s) rewritten');
      }
    }
    if(!total) console.log('nothing to rewrite');
  }
}
