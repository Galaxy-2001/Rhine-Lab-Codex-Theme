import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {transformSkinCss} from '@linxin666/dsh-client-ui-skin-center';

const css=transformSkinCss(readFileSync('skins/rhine-lab/skin.css','utf8'),{skinId:'rhine-lab',filename:'skin.css'}).code;
// DSH 0.2.1-rc.3 Windows structure: both brand and fixed toggle have
// aria-keyshortcuts. The skin must only resize the brand, never the toggle.
const fixture=`<!doctype html><html data-dsh-skin="rhine-lab"><style>
*{box-sizing:border-box}body{margin:0;--dsw-specific-sidebar-fill:#f8f9fa;--dsw-alias-label-primary:#000}.frame{padding-top:40px;height:800px}
[data-dsh-surface=sidebar]{display:contents}.sidebar{width:280px}
.brand-row{height:48px;display:flex}.brand{flex:1}.toggle{position:fixed;left:12px;top:6px;width:28px;height:28px;z-index:30}
[data-dsh-part=new-session]{display:flex;margin:8px 12px;width:256px}
[data-sidebar-collapsed=true] .sidebar{width:0}
[data-sidebar-collapsed=true] .brand{display:none}
[data-sidebar-collapsed=true] [data-dsh-part=new-session]{position:fixed;left:48px;top:6px;width:28px;margin:0;font-size:0;z-index:30}
[data-windows-menu]{position:fixed;top:0;height:40px;width:130px;z-index:1100;display:flex}
[data-windows-menu] button{width:65px}
.chat{position:absolute;left:320px;right:10px;top:300px;height:300px}
textarea{width:100%;height:160px}
</style><div data-dsh-surface="root"><div class="frame"><div data-dsh-surface="sidebar"><div class="sidebar">
<div class="brand-row" data-window-drag="true"><button class="brand" aria-keyshortcuts="Control+N"><span data-slot="sidebar.brand.name">DSH</span></button><button class="toggle" aria-keyshortcuts="Control+B">☷</button></div>
<button data-dsh-part="new-session"><svg width="16" height="16"></svg>新会话</button></div></div><main class="chat"><textarea placeholder="输入"></textarea></main></div></div><nav data-windows-menu><button>应用</button><button>编辑</button></nav>`;

test('native fixed toggle retains its hit area in both modes and sidebar states',async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage();
  for(const dark of [false,true])for(const width of [1280,850,510]){
   await page.setViewportSize({width,height:800});await page.setContent(fixture);await page.addStyleTag({content:css});
   await page.evaluate(dark=>{
    document.body.toggleAttribute('data-ds-dark-theme',dark);window.toggles=0;
    document.querySelector('.toggle').onclick=()=>{window.toggles++;const f=document.querySelector('.frame');f.toggleAttribute('data-sidebar-collapsed');if(f.hasAttribute('data-sidebar-collapsed'))f.setAttribute('data-sidebar-collapsed','true');};
   },dark);
   const nativeCaption=await page.evaluate(()=>{
    const probe=document.createElement('span');probe.style.backgroundColor='var(--dsw-specific-sidebar-fill)';document.body.append(probe);
    const c=getComputedStyle(probe).backgroundColor;probe.remove();return c;
   });
   assert.equal(nativeCaption,dark?'rgb(37, 43, 41)':'rgb(232, 226, 211)');
   assert.equal(await page.locator('[data-windows-menu]').evaluate(e=>getComputedStyle(e,'::after').content),'"DeepSeek Harness"');
   for(const collapsed of [false,true]){
    const r=await page.locator('.toggle').boundingBox();assert.deepEqual(r,{x:12,y:6,width:28,height:28});
    await page.locator('textarea').click();assert.equal(await page.evaluate(()=>window.toggles),collapsed?1:0);
    assert.equal(await page.locator('textarea').evaluate(e=>e===document.activeElement),true);
    const row=await page.locator('.brand-row').boundingBox();assert.equal(row.height,collapsed?0:144);
    const menu=await page.locator('[data-windows-menu]').boundingBox();assert.ok(menu.x+menu.width<=width-150);
    if(collapsed){const n=await page.locator('[data-dsh-part=new-session]').boundingBox();assert.equal(n.width,28);assert.equal(n.height,28);}
    await page.locator('.toggle').click();
   }
   assert.equal(await page.evaluate(()=>window.toggles),2);
  }
 }finally{await browser.close()}
});
