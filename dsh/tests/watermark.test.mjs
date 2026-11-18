import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {transformSkinCss} from '@linxin666/dsh-client-ui-skin-center';

const css = transformSkinCss(readFileSync('skins/rhine-lab/skin.css','utf8'), {skinId:'rhine-lab', filename:'skin.css'}).code;
const layout = `<!doctype html><html data-dsh-skin="rhine-lab"><style>
  * {box-sizing:border-box} body {margin:0} main {height:100vh} form {max-width:736px;margin:auto}
  [role=dialog] {position:fixed;inset:20px} </style><body>
  <main data-dsh-surface="conversation"><div data-conversation-content data-content-phase="hero">
  <div data-slot="conversation.composer"><form><textarea></textarea></form></div></div></main>
  <aside data-dsh-surface="details"><div></div></aside></body></html>`;
const images = locator => locator.evaluate(e=>getComputedStyle(e).backgroundImage);
const asset = (mode,still=false) => 'watermark-'+mode+(still?'-still':'')+'.svg';

test('only the visible empty conversation can paint an animated watermark',async()=>{
  const browser=await chromium.launch(process.env.RHINE_BROWSER
    ? {executablePath:process.env.RHINE_BROWSER}
    : process.platform==='win32' ? {channel:'msedge'} : {});
  try {
    const page=await browser.newPage({viewport:{width:1920,height:960}});
    await page.setContent(layout);
    await page.addStyleTag({content:css});
    const main=page.locator('main'), content=page.locator('[data-conversation-content]');
    const phase=value=>content.evaluate((el,v)=>el.setAttribute('data-content-phase',v),value);
    for(const mode of ['light','dark']){
      await page.evaluate(v=>document.body.toggleAttribute('data-ds-dark-theme',v==='dark'),mode);
      await phase('hero');
      await page.emulateMedia({reducedMotion:'no-preference'});
      assert.ok((await images(main)).includes(asset(mode)));
      const paint=await main.evaluate(el=>{const s=getComputedStyle(el);return [s.backgroundRepeat,s.backgroundSize,s.backgroundPosition]});
      assert.match(paint[0],/, repeat$/);
      assert.match(paint[1],/140px 600px, 100% 100%, 44px 44px$/);
      assert.match(paint[2],/100% 38%/);
      assert.ok((await images(page.locator('aside'))).includes(asset(mode,true)));
      for(const state of ['settling','active']){
        await phase(state);
        assert.ok((await images(main)).includes(asset(mode,true)),state);
      }
      await phase('hero');
      await content.evaluate(e=>{const row=document.createElement('div');row.dataset.chatFlowKind='user';e.prepend(row)});
      assert.ok((await images(main)).includes(asset(mode,true)),'message before phase change');
      await content.locator('[data-chat-flow-kind]').evaluate(e=>e.remove());
      await page.evaluate(()=>{const dialog=document.createElement('section');dialog.setAttribute('role','dialog');dialog.dataset.dshSurface='settings';document.body.append(dialog)});
      const settings=await images(page.getByRole('dialog'));
      assert.ok(!settings.includes('watermark')&&settings.includes('grid-'+mode)&&settings.includes('ring-'+mode));
      assert.ok(!(await images(main)).includes('watermark'),'portal must stop the underlying hero');
      await page.getByRole('dialog').evaluate(e=>e.remove());
      assert.ok((await images(main)).includes(asset(mode)),'closing settings restores hero');
      await page.emulateMedia({reducedMotion:'reduce'});
      assert.ok((await images(main)).includes(asset(mode,true)));
    }
    await page.setViewportSize({width:390,height:844});
    assert.match(await main.evaluate(el=>getComputedStyle(el).backgroundSize),/0px 0px, 100% 100%, 44px 44px$/);
    await page.locator('html').evaluate(el=>el.removeAttribute('data-dsh-skin'));
    assert.equal(await images(main),'none');
  } finally { await browser.close(); }
});
