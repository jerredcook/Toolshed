// scripts/build.mjs — sync the source-of-truth core into the self-contained app.
// Reads tools/par-avion/lib/chunk-core.mjs, strips the `export` keywords, and
// replaces the region between the CHUNK-CORE:START / CHUNK-CORE:END markers in
// tools/par-avion/index.html. Idempotent: running it twice produces the same file.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const corePath = join(root, 'tools', 'par-avion', 'lib', 'chunk-core.mjs');
const htmlPath = join(root, 'tools', 'par-avion', 'index.html');

const START = '// ==CHUNK-CORE:START==';
const END = '// ==CHUNK-CORE:END==';
const BANNER = '// generated from tools/par-avion/lib/chunk-core.mjs — do not edit here; run `npm run build`';

const indent = '      '; // matches the <script> body indentation in index.html

const core = await readFile(corePath, 'utf8');

// Drop the file-level header comment (everything up to the first `export`), then
// strip `export ` so the declarations become plain top-level functions.
const firstExport = core.indexOf('\nexport ');
const bodySrc = (firstExport >= 0 ? core.slice(firstExport + 1) : core)
  .replace(/^export\s+/gm, '')
  .trim();

const inlined = [BANNER, bodySrc]
  .join('\n')
  .split('\n')
  .map(line => (line.length ? indent + line : line))
  .join('\n');

const html = await readFile(htmlPath, 'utf8');
const startIdx = html.indexOf(START);
const endIdx = html.indexOf(END);
if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) {
  console.error('error: CHUNK-CORE markers not found (or out of order) in tools/par-avion/index.html');
  process.exit(1);
}

const before = html.slice(0, startIdx + START.length);
const after = html.slice(endIdx);
const next = `${before}\n${inlined}\n${indent}${after}`;

if (next === html) {
  console.log('chunk-core.mjs already in sync with index.html — no change.');
} else {
  await writeFile(htmlPath, next);
  console.log('synced chunk-core.mjs -> tools/par-avion/index.html');
}
