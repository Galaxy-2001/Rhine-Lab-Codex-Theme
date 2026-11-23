import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {transformSkinCss} from '@linxin666/dsh-client-ui-skin-center';

const dir = new URL('../skins/rhine-lab/', import.meta.url);
const css = transformSkinCss(readFileSync(new URL('skin.css',dir),'utf8'), {skinId:'rhine-lab',filename:'skin.css'}).code;
const html = readFileSync(new URL('fixtures/sidebar.html',import.meta.url),'utf8');

test('DSH paints the station in free space and yields to scrolling rows', async () => {
  const browser = await chromium.launch(process.env.RHINE_BROWSER ? {executablePath:process.env.RHINE_BROWSER} : process.platform==='win32' ? {channel:'msedge'} : {});
  try {
    const page = await browser.newPage({viewport:{width:320,height:560}});
    await page.route('http://rhine.test/**',route=>{
      const path = new URL(route.request().url()).pathname;
      if (path==='/') return route.fulfill({contentType:'text/html',body:html});
      if (/^\/assets\/terminal-(light|dark)(-faint)?\.svg$/.test(path)) return route.fulfill({contentType:'image/svg+xml',body:readFileSync(new URL(path.slice(1),dir))});
      return route.fulfill({status:404});
    });
    await page.goto('http://rhine.test/');
    await page.addStyleTag({content:css});
    const region = page.locator('.scroll-region');
    const rows = n=>page.locator('[data-sidebar-list-area]').evaluate((list,n)=>{
      list.replaceChildren(...Array.from({length:n},(_,i)=>{
        const b=document.createElement('button'); b.className='session'; b.textContent='研究记录 '+(i+1); return b;
      }));
    },n);
    // The orange stripe is opaque in the full artwork and 9% in the faint one.
    async function stripe(){
      const r=await region.boundingBox();
      const pixel=await page.screenshot({clip:{x:r.x+32,y:r.y+r.height-22,width:1,height:1}});
      return page.evaluate(async base64=>{
        const img=new Image(); img.src='data:image/png;base64,'+base64; await img.decode();
        const ctx=document.createElement('canvas').getContext('2d'); ctx.drawImage(img,0,0);
        return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3);
      },pixel.toString('base64'));
    }
    for(const dark of [false,true]){
      await page.setViewportSize({width:320,height:560});
      await page.evaluate(d=>document.body.toggleAttribute('data-ds-dark-theme',d),dark);
      await rows(2);
      const full=dark?[194,124,83]:[220,121,70];
      assert.deepEqual(await stripe(),full);
      await page.setViewportSize({width:320,height:300});
      const faint=await stripe(); assert.notDeepEqual(faint,full);
      await page.setViewportSize({width:320,height:560});
      await rows(40); assert.deepEqual(await stripe(),faint);
      await page.locator('[data-sidebar-scrollport]').evaluate(e=>e.scrollTop=e.scrollHeight);
      assert.deepEqual(await stripe(),faint);
      await rows(2); assert.deepEqual(await stripe(),full);
      await page.locator('.session').first().click();
      assert.equal(await page.locator('.session').first().evaluate(e=>e===document.activeElement),true);
      await page.locator('[data-sidebar-scrollport]').evaluate(e=>e.removeAttribute('data-sidebar-scrollport'));
      assert.equal(await region.evaluate(e=>getComputedStyle(e,'::after').content),'none');
      await region.locator(':scope > div').evaluate(e=>e.setAttribute('data-sidebar-scrollport',''));
    }
  } finally { await browser.close(); }
});
