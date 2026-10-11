import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";

// Assembles the installable package: a thin launcher + the Next standalone
// build under app/. Layout matters — npm strips node_modules at the ROOT of a
// package, but a nested app/node_modules is shipped, which is what carries the
// traced runtime (next, react, sql.js) to machines without a repo checkout.
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = process.env.NEXT_DIST_DIR || ".next";
const standaloneDir = resolve(projectRoot, distDir, "standalone");
const sourcesDir = resolve(projectRoot, "scripts", "npm-package");
const outDir = resolve(projectRoot, process.env.NPM_PACKAGE_DIR || "npm-package");

for (const required of ["server.js", "custom-server.js"]) {
  if (!existsSync(join(standaloneDir, required))) {
    console.error(`[npm-package] ${relative(projectRoot, standaloneDir)}/${required} is missing — run \`npm run build\` first.`);
    process.exit(1);
  }
}

const rootPkg = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8"));

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(standaloneDir, join(outDir, "app"), { recursive: true, force: true });
cpSync(join(sourcesDir, "cli.js"), join(outDir, "cli.js"), { force: true });
cpSync(join(sourcesDir, "README.md"), join(outDir, "README.md"), { force: true });
cpSync(join(projectRoot, "LICENSE"), join(outDir, "LICENSE"), { force: true });

const manifest = {
  name: "lllrouter",
  version: rootPkg.version,
  description: "LLLRouter — local AI gateway dashboard (standalone build)",
  bin: { lllrouter: "cli.js" },
  files: ["cli.js", "app", "README.md", "LICENSE"],
  engines: { node: ">=20.9.0" },
  license: "MIT",
};

writeFileSync(join(outDir, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`[npm-package] ${relative(projectRoot, outDir)}/ ready — app/ ← ${relative(projectRoot, standaloneDir)}`);
console.log(`[npm-package] package with: npm pack ./${relative(projectRoot, outDir)}`);
