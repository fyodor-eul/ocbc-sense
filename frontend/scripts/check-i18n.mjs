// Usage: node scripts/check-i18n.mjs
// Checks the three dictionaries and the Simple/Standard wording coverage.
// Exits 1 on errors (missing keys, mismatched {placeholders}, orphan .simple).
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "../src");
const load = async (l) =>
  (await import(pathToFileURL(path.join(root, "i18n", `${l}.js`)).href)).default;
const dicts = { en: await load("en"), zh: await load("zh"), ms: await load("ms") };
const en = dicts.en;
let errors = 0;
const err = (m) => { errors++; console.error("ERROR  " + m); };
const warn = (m) => console.warn("warn   " + m);
const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

// 1. Same keys and same {placeholders} in every language
for (const [lang, d] of Object.entries(dicts)) {
  if (lang === "en") continue;
  for (const k of Object.keys(en)) {
    if (!(k in d)) err(`${lang}: missing "${k}"`);
    else if (vars(en[k]) !== vars(d[k])) err(`${lang}: placeholders differ in "${k}" (${vars(en[k])} vs ${vars(d[k])})`);
  }
  for (const k of Object.keys(d)) if (!(k in en)) err(`${lang}: extra "${k}"`);
}

// 2. Every .simple needs a Standard text to fall back to
for (const k of Object.keys(en)) {
  const m = k.match(/^(.*)\.simple$/);
  if (m && !(m[1] in en) && !(`${m[1]}.standard` in en)) err(`"${k}" has no Standard text`);
}

// 3. Which keys are used in the source?
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(jsx?|json)$/.test(f.name) && !p.includes("/i18n/")) files.push(p);
  }
})(root);
const source = files.map((f) => fs.readFileSync(f, "utf8")).join("\n");
const used = (k) => source.includes(k);

// 4. Guidance: every guidance sentence should have a Simple version
for (const k of Object.keys(en)) {
  if (/\.guidance\.\w+$/.test(k) && !(`${k}.simple` in en)) err(`guidance "${k}" has no .simple`);
}
// 5. Info: unused guidance keys, and Simple text that is longer than Standard
for (const k of Object.keys(en)) {
  if (/\.guidance\.\w+$/.test(k) && !used(k)) warn(`guidance key not used by any screen: ${k}`);
  const m = k.match(/^(.*)\.simple$/);
  const std = m && (en[m[1]] ?? en[`${m[1]}.standard`]);
  if (std && en[k].length > std.length) warn(`Simple is longer than Standard: ${k}`);
}

const simpleCount = Object.keys(en).filter((k) => k.endsWith(".simple")).length;
console.log(`\n${Object.keys(en).length} keys per language · ${simpleCount} Simple variants · ${errors} error(s)`);
process.exit(errors ? 1 : 0);
