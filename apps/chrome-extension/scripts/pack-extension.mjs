#!/usr/bin/env node

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const cmd = [
  'powershell',
  '-Command',
  [
    'if (Test-Path kotobaflow-extension.zip) { Remove-Item kotobaflow-extension.zip }',
    'Compress-Archive -Path dist\\* -DestinationPath kotobaflow-extension.zip -Force',
  ].join('; '),
];

execSync(cmd.join(' '), { cwd: root, stdio: 'inherit' });
console.log('✓ Packed extension to kotobaflow-extension.zip');
