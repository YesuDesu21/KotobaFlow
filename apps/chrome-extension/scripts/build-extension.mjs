#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Rollup input keys in vite.config.ts determine built filenames
const PATH_MAP = {
  'src/background/index.ts': 'assets/background.js',
  'src/content/furigana.ts': 'assets/furigana.js',
  'src/content/overlay.ts':   'assets/overlay.js',
};

function main() {
  const manifestPath = resolve(root, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  // Rewrite content script paths using path map
  for (const cs of manifest.content_scripts || []) {
    cs.js = cs.js.map(p => PATH_MAP[p] || p);
  }

  // Rewrite background worker path
  if (manifest.background?.service_worker) {
    manifest.background.service_worker = PATH_MAP[manifest.background.service_worker] || manifest.background.service_worker;
  }

  // Strip public/ prefix from icon paths (Vite copies publicDir to output root)
  if (manifest.icons) {
    for (const key of Object.keys(manifest.icons)) {
      manifest.icons[key] = manifest.icons[key].replace(/^public\//, '');
    }
  }

  const dist = resolve(root, 'dist');
  writeFileSync(resolve(dist, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  console.log('✓ Generated dist/manifest.json with production paths');
}

main();
