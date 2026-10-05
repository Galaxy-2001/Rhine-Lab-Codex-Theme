import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installSkin, skinHome } from '../scripts/install.mjs';

test('install and update preserve active settings and the previous asset directory', () => {
  const home = mkdtempSync(join(tmpdir(), 'rhine-dsh-install-'));
  try {
    const target = join(home,'skins');
    const previous = '{"active":"other","background":{"inputCardBlur":4},"future":true}\n';
    writeFileSync(join(home,'skin-center-active.json'), previous);
    const first = installSkin({ target });
    assert.equal(readFileSync(join(home,'skin-center-active.json'),'utf8'), previous);
    writeFileSync(join(first.destination,'custom.txt'),'keep me');
    const updated = installSkin({ target, activate:true });
    assert.equal(readFileSync(join(updated.backup,'custom.txt'),'utf8'),'keep me');
    assert.equal(readFileSync(updated.stateBackup,'utf8'),previous);
    assert.deepEqual(JSON.parse(readFileSync(join(home,'skin-center-active.json'),'utf8')), { active:'rhine-lab', background:{inputCardBlur:4}, future:true, initialized:true });
  } finally { rmSync(home,{recursive:true,force:true}); }
});
test('invalid active state refuses activation before installing any files', () => {
  const home=mkdtempSync(join(tmpdir(),'rhine-dsh-invalid-'));
  try {
    writeFileSync(join(home,'skin-center-active.json'),'broken');
    assert.throws(()=>installSkin({ target:join(home,'skins'),activate:true }));
    assert.equal(existsSync(join(home,'skins','rhine-lab')),false);
  } finally { rmSync(home,{recursive:true,force:true}); }
});
test('skin directory overrides follow the skin-center precedence',()=>{
  assert.equal(skinHome({DSH_SKINS_HOME:'C:/one',DSH_SKINS_DIR:'C:/two',DSH_HOME:'C:/three'}).replaceAll('\\','/'),'C:/one');
  assert.equal(skinHome({DSH_HOME:'C:/three'}).replaceAll('\\','/'),'C:/three/skins');
});
