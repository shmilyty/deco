import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(scriptDir, '..', 'dist', 'assets');

if (!existsSync(assetsDir)) {
  console.error('Missing dist/assets. Run `npm run build` first.');
  process.exit(1);
}

const cssFile = readdirSync(assetsDir).find((name) => /^index-.*\.css$/.test(name));

if (!cssFile) {
  console.error('Could not find the built CSS bundle in dist/assets.');
  process.exit(1);
}

const css = readFileSync(join(assetsDir, cssFile), 'utf8');
const rootLayoutLeaks = [
  {
    name: 'body uses template flex centering',
    pattern: /body\{[^}]*display:flex[^}]*place-items:center/,
  },
  {
    name: '#app keeps the 1280px width cap',
    pattern: /#app\{[^}]*max-width:1280px/,
  },
  {
    name: '#app keeps the template padding',
    pattern: /#app\{[^}]*padding:2rem/,
  },
  {
    name: '#app keeps the template text alignment',
    pattern: /#app\{[^}]*text-align:center/,
  },
];

const failures = rootLayoutLeaks.filter(({ pattern }) => pattern.test(css));

if (failures.length > 0) {
  console.error('Built CSS still contains root layout constraints:');
  failures.forEach(({ name }) => console.error(`- ${name}`));
  process.exit(1);
}

console.log('Built CSS root layout is full-bleed.');
