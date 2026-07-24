// Emits builder/auth/index.html as a physical copy of the SPA entry so the
// magic-link redirect target (https://thymos.fit/builder/auth/) is served as
// a real static asset — no dependency on _redirects rewrite behaviour for
// the auth-critical path. Asset URLs inside are absolute (/builder/...), so
// the copy renders identically from the nested path.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../builder");
mkdirSync(resolve(outDir, "auth"), { recursive: true });
copyFileSync(
  resolve(outDir, "index.html"),
  resolve(outDir, "auth", "index.html"),
);
console.log("postbuild: wrote builder/auth/index.html");
