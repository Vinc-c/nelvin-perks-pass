// Lists translation keys used in the source but missing from src/i18n/messages (and keys missing languages).
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
const defined = new Map();
for (const f of walk("src/i18n/messages")) {
  for (const m of readFileSync(f, "utf8").matchAll(/^\s*\[\s*"([^"]+)"\s*,\s*((?:"(?:[^"\\]|\\.)*"\s*,?\s*){1,5})\]/gm)) {
    const n = (m[2].match(/"(?:[^"\\]|\\.)*"/g) || []).length;
    defined.set(m[1], n);
  }
}
const base = readFileSync("src/i18n/translations.js", "utf8");
for (const m of base.matchAll(/"([a-zA-Z0-9_.]+)":\s*"/g)) if (!defined.has(m[1])) defined.set(m[1], 5);
const used = new Map();
const PREFIX = /["'`]((?:mb|ac|bl|mc|hr|lg|dash|nav|role|ui|auth|land|cat|pass|cta|wallet|welcome|portal)\.[A-Za-z0-9_.]+)["'`]/g;
for (const f of walk("src").filter((x) => /\.(jsx?|mjs)$/.test(x) && !x.includes("i18n/messages") && !x.includes("translations.js"))) {
  for (const m of readFileSync(f, "utf8").matchAll(PREFIX)) if (!used.has(m[1])) used.set(m[1], f);
}
const missing = [...used].filter(([k]) => !defined.has(k) && !/\.$/.test(k));
console.log(`keys defined: ${defined.size}, used: ${used.size}, missing: ${missing.length}`);
for (const [k, f] of missing.slice(0, 400)) console.log(" MISSING", k, "<-", f);
const short = [...defined].filter(([, n]) => n < 5 && n > 0).length;
if (short) console.log(`rows with fewer than 5 languages: ${short}`);
