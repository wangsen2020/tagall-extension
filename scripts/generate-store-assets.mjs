/**
 * Renders the TagAll SVG mark to the PNG sizes Chrome expects.
 *
 * One-time setup (outside this repository):
 *   npm install --prefix %TEMP%\\tagall-icon-tools @resvg/resvg-js
 *
 * Then run:
 *   set NODE_PATH=%TEMP%\\tagall-icon-tools\\node_modules && node scripts/generate-store-assets.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const toolRoot = process.env.TAGALL_ICON_TOOLS;
if (!toolRoot) {
  throw new Error('Set TAGALL_ICON_TOOLS to the temporary npm prefix before running this script.');
}
const require = createRequire(import.meta.url);
const { Resvg } = require(require.resolve('@resvg/resvg-js', { paths: [toolRoot] }));

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = resolve(repositoryRoot, 'store-assets');
const sourceSvg = resolve(assetsDir, 'logo.svg');
const outputs = [
  ['icon-16.png', 16],
  ['icon-32.png', 32],
  ['icon-48.png', 48],
  ['icon-128.png', 128],
  ['store-icon-128.png', 128],
];

await mkdir(assetsDir, { recursive: true });
const svg = await readFile(sourceSvg);

for (const [filename, size] of outputs) {
  const renderer = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'transparent',
  });
  await writeFile(resolve(assetsDir, filename), renderer.render().asPng());
}
