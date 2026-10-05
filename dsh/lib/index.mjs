import { existsSync, readFileSync, writeFileSync, renameSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { installSkin, skinHome } from '../scripts/install.mjs';

export const name = 'rhine-lab-theme';
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function assetHash(directory) {
  const hash = createHash('sha256');
  function walk(path, relative = '') {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name,'en'))) {
      if (entry.isSymbolicLink()) throw new Error('Linked artwork is not supported');
      const key = relative + entry.name;
      if (entry.isDirectory()) walk(join(path, entry.name), key + '/');
      else if (entry.isFile()) hash.update(key).update('\0').update(readFileSync(join(path, entry.name))).update('\0');
    }
  }
  walk(directory);
  return hash.digest('hex');
}

export function prepareTheme({ target = skinHome(), source = join(project, 'skins', 'rhine-lab') } = {}) {
  const markerPath = join(target, '..', 'rhine-lab-plugin.json');
  const previous = existsSync(markerPath) ? JSON.parse(readFileSync(markerPath, 'utf8')) : null;
  if (previous !== null && (typeof previous !== 'object' || Array.isArray(previous))) throw new Error('Invalid Rhine Lab plugin state');
  const digest = assetHash(source);
  const destination = join(target, 'rhine-lab');
  const needsInstall = !existsSync(destination) || previous?.digest !== digest;
  if (!needsInstall) return { installed: false, activated: false };
  const firstInstall = previous === null;
  const installed = installSkin({ source, target, activate: firstInstall });
  const temporary = markerPath + '.' + randomUUID() + '.tmp';
  writeFileSync(temporary, JSON.stringify({ version: JSON.parse(readFileSync(join(project, 'package.json'), 'utf8')).version, digest }, null, 2) + '\n', { flag: 'wx' });
  renameSync(temporary, markerPath);
  return { ...installed, installed: true, activated: firstInstall };
}

export function apply() {
  const result = prepareTheme();
  if (result.installed) console.info('[rhine-lab-theme] Artwork installed' + (result.activated ? ' and selected' : ''));
}
