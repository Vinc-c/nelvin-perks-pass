// Splits the i18n source (src/i18n/source.js + messages/*) into one JSON file per
// language (src/i18n/locales/<code>.json). English ships in the main bundle; the
// other languages are fetched only when a visitor selects them.
// Run automatically before `npm run build`; also `node scripts/check-i18n-keys.mjs`
// fails when the committed JSON files are out of date.
import { createServer } from "vite";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

export async function buildLocales({ check = false } = {}) {
  // Vite's own module loader resolves the extensionless imports of the source files.
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom", logLevel: "silent", optimizeDeps: { noDiscovery: true, include: [] } });
  let translations;
  try {
    ({ translations } = await vite.ssrLoadModule("/src/i18n/source.js"));
  } finally {
    await vite.close();
  }
  mkdirSync("src/i18n/locales", { recursive: true });
  const stale = [];
  for (const [code, dict] of Object.entries(translations)) {
    const sorted = Object.fromEntries(Object.keys(dict).sort().map((k) => [k, dict[k]]));
    const json = JSON.stringify(sorted) + "\n";
    const file = `src/i18n/locales/${code}.json`;
    if (check) {
      if (!existsSync(file) || readFileSync(file, "utf8") !== json) stale.push(file);
    } else {
      writeFileSync(file, json);
    }
  }
  return stale;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildLocales();
  console.log("i18n locales written to src/i18n/locales");
}
