// Emits physical folder copies of the SPA entry so nested /builder/ URLs are
// served as real static files. Cloudflare Pages does NOT honour the
// `/builder/* /builder/index.html 200` rewrite in _redirects (proven: every
// unmatched /builder/* path falls through to the marketing landing page),
// but it DOES serve /builder/<dir>/index.html for /builder/<dir>. So each
// entry URL we want to work needs a real index.html here.
//
//   /builder/auth/  -> magic-link redirect target
//   /builder/en/    -> force English (locale read from the path)
//   /builder/tr/    -> force Turkish
//
// Asset URLs inside are absolute (/builder/...), so the copies render
// identically from any nested path.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../builder");
const entry = resolve(outDir, "index.html");

for (const sub of ["auth", "en", "tr"]) {
  mkdirSync(resolve(outDir, sub), { recursive: true });
  copyFileSync(entry, resolve(outDir, sub, "index.html"));
  console.log(`postbuild: wrote builder/${sub}/index.html`);
}
