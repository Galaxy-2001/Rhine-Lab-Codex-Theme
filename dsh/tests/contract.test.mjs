import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { validateSkinManifestV2, transformSkinCss, auditTokenContract, loadSkinCatalog } from '@linxin666/dsh-client-ui-skin-center';
const root=resolve('skins/rhine-lab');
const css=readFileSync(join(root,'skin.css'),'utf8');
test('published loader accepts the skin and its CSS with no compatibility warnings',()=>{
  const result=validateSkinManifestV2(JSON.parse(readFileSync(join(root,'skin.json'),'utf8')));
  assert.equal(result.ok,true,JSON.stringify(result));assert.deepEqual(result.warnings,[]);
  const transformed=transformSkinCss(css,{skinId:'rhine-lab',filename:'skin.css'});
  assert.deepEqual(transformed.warnings,[]);
  assert.match(transformed.code,/html\[data-dsh-skin="rhine-lab"\]/);
  assert.deepEqual(auditTokenContract([{filename:'skin.css',css}]).warnings,[]);
  const catalog=loadSkinCatalog({userDir:resolve('skins')});
  assert.ok(catalog.skins.some(s=>s.manifest.id==='rhine-lab'));
  assert.deepEqual(catalog.diagnostics.filter(d=>d.subject==='rhine-lab'),[]);
});
test('referenced artwork stays local and contains no executable SVG content',()=>{
  const manifest=JSON.parse(readFileSync(join(root,'skin.json'),'utf8'));
  for(const path of [...Object.values(manifest.preview),...Object.values(manifest.contributes.backgroundMedia).map(x=>x.src)]) assert.ok(existsSync(join(root,path)),path);
  const refs=[...css.matchAll(/url\(([^)]+)\)/g)].map(m=>m[1]);
  for(const path of refs) { assert.ok(path.startsWith('assets/'));assert.ok(existsSync(join(root,path)),path); }
  for(const name of readdirSync(join(root,'assets'))) {
    const svg=readFileSync(join(root,'assets',name),'utf8');
    assert.doesNotMatch(svg,/<script|foreignObject|\bon\w+=|(?:href|src)=/i);
    assert.doesNotMatch(svg,/CODEX/);
  }
});
