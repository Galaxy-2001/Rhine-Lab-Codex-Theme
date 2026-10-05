import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { prepareTheme } from '../lib/index.mjs';

test('first plugin boot installs and applies; later boots preserve user choices',()=>{
  const home=mkdtempSync(join(tmpdir(),'rhine-plugin-'));
  try{
    const target=join(home,'skins');
    const first=prepareTheme({target});assert.equal(first.activated,true);
    const statePath=join(home,'skin-center-active.json');
    const state={active:null,initialized:true,background:{enabled:false},future:'keep'};
    writeFileSync(statePath,JSON.stringify(state));
    assert.deepEqual(prepareTheme({target}),{installed:false,activated:false});
    assert.deepEqual(JSON.parse(readFileSync(statePath,'utf8')),state);
    const update=join(home,'update');cpSync(resolve('skins/rhine-lab'),update,{recursive:true});
    writeFileSync(join(update,'skin.css'),readFileSync(join(update,'skin.css'),'utf8')+'\n/* updated */');
    const changed=prepareTheme({target,source:update});assert.equal(changed.installed,true);assert.equal(changed.activated,false);
    assert.deepEqual(JSON.parse(readFileSync(statePath,'utf8')),state);assert.ok(existsSync(changed.backup));
  }finally{rmSync(home,{recursive:true,force:true});}
});

test('corrupt plugin marker fails without changing selection',()=>{
  const home=mkdtempSync(join(tmpdir(),'rhine-plugin-invalid-'));
  try{
    writeFileSync(join(home,'rhine-lab-plugin.json'),'[]');
    assert.throws(()=>prepareTheme({target:join(home,'skins')}),/Invalid/);
    assert.equal(existsSync(join(home,'skin-center-active.json')),false);
  }finally{rmSync(home,{recursive:true,force:true});}
});
