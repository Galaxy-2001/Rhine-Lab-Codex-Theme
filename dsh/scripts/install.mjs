import { existsSync, mkdirSync, cpSync, renameSync, readFileSync, writeFileSync, rmSync, lstatSync } from 'node:fs';
import { resolve, dirname, join, isAbsolute } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function skinHome(env = process.env) {
  return resolve(env.DSH_SKINS_HOME?.trim() || env.DSH_SKINS_DIR?.trim() || join(env.DSH_HOME?.trim() || join(homedir(), '.dsh'), 'skins'));
}
export function installSkin({ source = join(project, 'skins', 'rhine-lab'), target = skinHome(), activate = false } = {}) {
  const manifest = JSON.parse(readFileSync(join(source, 'skin.json'), 'utf8'));
  if (manifest.id !== 'rhine-lab' || manifest.skinManifestVersion !== 2) throw new Error('Invalid Rhine Lab skin manifest');
  for (const path of [manifest.contributes.stylesheet, ...Object.values(manifest.contributes.backgroundMedia ?? {}).map(x => x.src)]) {
    if (isAbsolute(path) || path.split(/[\\/]/).includes('..') || !existsSync(join(source, path))) throw new Error('Invalid skin asset: ' + path);
  }
  mkdirSync(target, { recursive: true });
  const destination = join(target, 'rhine-lab');
  const statePath = join(target, '..', 'skin-center-active.json');
  const previous = activate && existsSync(statePath) ? readFileSync(statePath) : null;
  const state = previous ? JSON.parse(previous.toString('utf8')) : {};
  if (activate && (!state || Array.isArray(state) || typeof state !== 'object')) throw new Error('Invalid existing skin-center state; no files changed');
  if (existsSync(destination) && lstatSync(destination).isSymbolicLink()) throw new Error('Refusing to replace a linked skin directory');
  if (resolve(source) === resolve(destination)) throw new Error('Source and target must differ');
  const suffix = randomUUID();
  const staged = join(target, '.rhine-lab-stage-' + suffix);
  const backup = join(target, '..', 'rhine-lab-backups', suffix);
  let moved = false;
  try {
    cpSync(source, staged, { recursive: true, dereference: false });
    if (existsSync(destination)) { mkdirSync(dirname(backup),{recursive:true}); renameSync(destination, backup); moved = true; }
    renameSync(staged, destination);
  } catch (error) {
    if (moved && !existsSync(destination)) renameSync(backup, destination);
    throw error;
  } finally { rmSync(staged, { recursive: true, force: true }); }
  let stateBackup;
  if (activate) {
    // Preserve background controls and any future state fields.
    if (previous) { stateBackup = statePath + '.rhine-backup-' + suffix; writeFileSync(stateBackup, previous, { flag: 'wx' }); }
    const temporary = statePath + '.rhine-stage-' + suffix;
    try {
      writeFileSync(temporary, JSON.stringify({ ...state, active: 'rhine-lab', initialized: true }, null, 2) + '\n', { flag: 'wx' });
      renameSync(temporary, statePath);
    } finally { rmSync(temporary, { force: true }); }
  }
  return { destination, backup: moved ? backup : null, stateBackup };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(x => x !== '--activate')) throw new Error('Usage: node scripts/install.mjs [--activate]');
  console.log(JSON.stringify(installSkin({ activate: args.includes('--activate') }), null, 2));
  console.log('Installed. Open DSH Settings > Skin Center and apply Rhine Lab.');
}
