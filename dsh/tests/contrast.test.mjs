import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function luminance(hex) {
  const channels=hex.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255)
    .map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
}
function contrast(a,b) {const values=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (values[0]+.05)/(values[1]+.05);}
const css=readFileSync('skins/rhine-lab/skin.css','utf8');
const light=css.match(/:root(?:,\s*body)?\s*\{([^}]+)\}/)[1];
const dark=css.match(/body\[data-ds-dark-theme\]\s*\{([^}]+)\}/)[1];
function token(block,name) {return block.match(new RegExp(name+':\\s*(#[A-Fa-f\\d]{6});'))?.[1];}

for(const [mode,block] of [['light',light],['dark',dark]]) {
  test(`${mode}: toast label and native fixed-white tooltip remain readable`,()=>{
    const bg=token(block,'--dsw-alias-toast-bg');
    const text=token(block,'--dsw-alias-toast-label');
    assert.ok(bg && text,'toast background and label must be explicitly paired');
    assert.ok(contrast(bg,text)>=7,`toast contrast ${contrast(bg,text).toFixed(2)}:1`);
    const tooltipBg=token(block,'--dsw-alias-tooltip-bg');
    // DSH 0.2 Tooltip.module.css uses static white, not tooltip-fg.
    assert.ok(contrast(tooltipBg,'#FFFFFF')>=7,`tooltip contrast ${contrast(tooltipBg,'#FFFFFF').toFixed(2)}:1`);
    assert.ok(contrast(tooltipBg,token(block,'--dsw-alias-tooltip-fg'))>=7);
  });
}
