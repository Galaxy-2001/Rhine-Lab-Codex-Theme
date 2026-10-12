import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { transformSkinCss } from '@linxin666/dsh-client-ui-skin-center';

const css=transformSkinCss(readFileSync('skins/rhine-lab/skin.css','utf8'),{skinId:'rhine-lab',filename:'skin.css'}).code;
// Installed cost-meter 1.8.21 CSS, deliberately loaded AFTER the transformed theme.
const native=readFileSync('tests/fixtures/cost-meter-periods.css','utf8');
function luminance(rgb) {
  const c=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
function contrast(a,b) {const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (hi+.05)/(lo+.05);}
const layouts=[['strip','chip','track','high','low','marker'],['classic','classic-chip','track','high','low','classic-marker'],['rail','rail-label','rail-track','rail-high','rail-low','rail-marker'],['rail-classic','rail-classic-label','rail-classic-track','rail-classic-segment peak','rail-classic-segment off','rail-classic-marker']];
const cls=name=>'cm-peak-'+name;
test('billing periods retain distinct readable colors in all native layouts and both themes',async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  try {
    const page=await browser.newPage();
    for(const mode of ['light','dark']) {
      const html=layouts.flatMap(([layout,label,track,high,low,marker])=>['peak','off','weekend'].map(state=>`<section class="${cls(layout)} ${state}" data-case="${layout}-${state}"><div class="${cls(track)}"><i class="${cls(high)} high"></i><i class="${cls(low)} low"></i><i class="${cls(marker)} marker"></i></div><span class="${cls(label)} label">${state} · 5小时22分后切换</span></section>`)).join('');
      await page.setContent(`<html data-dsh-skin="rhine-lab"><head><style>${css}</style><style>${native}</style><style>body{background:var(--rhine-surface)}main{background:var(--dsw-alias-bg-layer-2);padding:24px;width:420px}.cm-peak-track{width:180px}section{margin:20px 0}</style></head><body ${mode==='dark'?'data-ds-dark-theme':''}><main>${html}<aside class="cm-peak-alert cm-peak-alert-peak"><b class="cm-peak-alert-badge">高峰</b></aside><aside class="cm-peak-alert cm-peak-alert-offpeak"><b class="cm-peak-alert-badge">平价</b></aside></main></body></html>`);
      const results=await page.evaluate(()=>[...document.querySelectorAll('section')].map(section=>{
        const style=el=>getComputedStyle(el);
        return {name:section.dataset.case,label:style(section.querySelector('.label')).color,bg:style(document.querySelector('main')).backgroundColor,high:style(section.querySelector('.high')).backgroundColor,low:style(section.querySelector('.low')).backgroundColor,stripes:style(section.querySelector('.low')).backgroundImage,marker:style(section.querySelector('.marker')).backgroundColor};
      }));
      const expected={peak:results[0].high,off:results[0].low,weekend:results[2].label};
      assert.equal(new Set(Object.values(expected)).size,3,mode+': three distinct period colors');
      for(const r of results) {
        assert.equal(r.label,expected[r.name.split('-').at(-1)],`${mode} ${r.name}: correct semantic color`);
        assert.ok(contrast(r.label,r.bg)>=4.5,`${mode} ${r.name}: text contrast ${contrast(r.label,r.bg).toFixed(2)}`);
        assert.ok(contrast(r.high,r.bg)>=3 && contrast(r.low,r.bg)>=3,`${mode} ${r.name}: bar contrast`);
        assert.ok(r.stripes.includes('gradient'),`${mode} ${r.name}: off-peak also differs by pattern`);
        assert.ok(contrast(r.marker,r.high)>=3 && contrast(r.marker,r.low)>=3,`${mode} ${r.name}: marker visibility`);
      }
      const badges=await page.locator('.cm-peak-alert-badge').evaluateAll(nodes=>nodes.map(n=>({color:getComputedStyle(n).color,bg:getComputedStyle(n.parentElement).backgroundColor})));
      for(const badge of badges) assert.ok(contrast(badge.color,badge.bg)>=4.5,mode+': alert badge contrast');
      // Compatibility rules must be inert after selecting a different skin.
      await page.locator('html').evaluate(el=>el.removeAttribute('data-dsh-skin'));
      assert.equal(await page.locator('section .high').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 152, 0)');
      console.log(`${mode}: 12 billing layouts and 2 alert badges verified; label contrast >=4.5:1`);
    }
  } finally {await browser.close();}
});
