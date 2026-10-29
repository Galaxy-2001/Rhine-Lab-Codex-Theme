import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from '../dsh/node_modules/playwright/index.mjs';
import {transformSkinCss} from '../dsh/node_modules/@linxin666/dsh-client-ui-skin-center/lib/index.js';

const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const css=read('runtime/assets/theme.css'),renderer=read('runtime/renderer.js');
const dshCss=transformSkinCss(read('dsh/skins/rhine-lab/skin.css'),{skinId:'rhine-lab',filename:'skin.css'}).code;
const art={};
for(const mode of ['light','dark'])for(const motion of ['motion','still']){
  const group={};
  for(const kind of ['identity','watermark','rail','structure','terminal','instrument'])group[kind]='data:image/svg+xml;base64,'+Buffer.from(read(`runtime/assets/${kind}-${mode}${motion==='still'?'-still':''}.svg`)).toString('base64');
  art[`${mode}-${motion}`]=group;
}
function fixture(client,mode,settings=false){
  // Native public hooks, with synthetic content. This is an isolated layout
  // fixture, not a screenshot or verification of a running desktop client.
  return `<!doctype html><html ${client==='codex'?`data-theme="${mode}"`:'data-dsh-skin="rhine-lab"'}><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;font:15px Arial,"Microsoft YaHei",sans-serif;background:#fff;color:var(--rhine-ink,#222)}
  .shell{display:flex;height:820px;width:100%}.side{flex:0 0 240px;width:240px;height:100%;display:flex;flex-direction:column;overflow:hidden;padding:14px;background:#eee}
  .side-wrapper{height:100%;min-height:0;display:flex;flex-direction:column}.side h2{font-size:20px;margin:4px 0 14px}.side a,.side button{display:block;min-height:38px;padding:10px;text-align:left;color:inherit;text-decoration:none;font:inherit;border:0;background:transparent}
  .side button{width:100%}.main{flex:1;min-width:0;position:relative;display:flex;flex-direction:column;overflow:hidden}.header{padding:20px 28px;border-bottom:1px solid var(--rhine-line,#ccc)}.thread{padding:32px;flex:1;line-height:1.85}.content{margin:0 auto;max-width:650px}.content p{margin-bottom:22px}.content small{color:var(--rhine-muted,var(--dsw-alias-label-secondary,#555))}.foot{margin-top:auto;padding:20px 28px}form{padding:16px;min-height:120px;border:1px solid #aaa;border-radius:16px;background:var(--rhine-panel,var(--rhine-card,#fafafa))}textarea,.ProseMirror{min-height:38px;border:0;background:transparent;color:inherit}h1{font-size:32px;margin:25px 0}.scrollbar-stable{overflow:auto;height:100%;padding:10px 34px}.setting{padding:18px 0;border-bottom:1px solid var(--rhine-line,#ccc);display:flex;justify-content:space-between}.group\\/settings{min-height:700px}input{accent-color:var(--rhine-accent)}.muted{color:var(--rhine-muted,var(--dsw-alias-label-secondary,#555))}
  </style></head><body ${client==='dsh'&&mode==='dark'?'data-ds-dark-theme':''}><div class="shell" data-slot="root">
  ${client==='codex'?'<aside class="side app-shell-left-panel">':'<aside class="side" data-dsh-surface="sidebar"><div class="side-wrapper">'}
  <h2>${client==='codex'?'Codex':'deepseek HARNESS'}</h2><button ${client==='dsh'?'data-dsh-part="new-session"':'data-sidebar-destination="new-chat"'}>新会话</button><p class="muted">工作区 / 莱茵生命研究所</p><a href="#design" data-sidebar-destination="design" aria-current="page">主题设计讨论</a><a href="#notes">实验记录整理</a><a href="#reading">文献阅读笔记</a><div style="margin-top:auto;padding-top:16px">研究员 / 本地预览</div>${client==='dsh'?'</div>':''}</aside>
  <main class="main" ${client==='codex'?'data-app-shell-main-surface':'data-dsh-surface="conversation"'}><header class="header" data-dsh-surface="session-header">莱茵生命研究所 / ${settings?'外观设置':'主题设计讨论'}</header>
  ${settings?`<div class="scrollbar-stable" ${client==='dsh'?'data-dsh-surface="settings"':''}><div class="group/settings" data-slot="settings.section"><h1>外观设置</h1><p class="muted">PERSONAL TERMINAL / CONFIGURATION</p><label class="setting">深色模式<input aria-label="深色模式" type="checkbox" ${mode==='dark'?'checked':''}></label><label class="setting">仪表动画<input aria-label="仪表动画" type="checkbox" checked></label><label class="setting">背景水印<input aria-label="背景水印" type="range" min="0" max="100" value="16"></label><label class="setting">正文字号<select><option>默认</option><option>较大</option></select></label></div></div>`:`<div class="thread"><div class="content"><p style="text-align:right">这版可以保留莱茵生命的感觉，同时让聊天区更清爽吗？</p><h2>把仪器感留在细节里。</h2><p>保留奶油白底色和莱茵橙，用更明确的层次组织导航、正文与操作。</p><p><b>标题有力量，正文安静一些</b><br><small>粗体英文用于终端标题，正文保持正常字重。</small></p><p><b>圆形仪表成为视觉记忆点</b><br><small>刻度、细线与彩色边条集中在侧栏，避免挤占聊天空间。</small></p><p><b>从聊天到设置，延续同一套设计</b><br><small>中央品牌水印采用 16% 强度。</small></p></div></div><div class="foot" data-dsh-surface="composer"><form data-composer-card><div class="ProseMirror" contenteditable="true" role="textbox" aria-label="消息输入">描述你想要构建的内容</div><p class="muted">本地布局回归 · 未连接模型</p></form></div>`}</main></div></body></html>`;
}

test('Pioneer paint preserves native chat geometry, settings controls and theme removal',async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1120,height:820}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    for(const client of ['codex','dsh'])for(const mode of ['light','dark'])for(const settings of [false,true]){
      await page.setContent(fixture(client,mode,settings));
      const before=await page.locator('main').boundingBox();
      if(client==='codex')await page.evaluate(`(${renderer})(${JSON.stringify({version:'pioneer-test',enabled:true,motion:true,css,art})})`);
      else{
        // URLs use the same bytes as the native CSS loader, embedded only for
        // file-independent regression. Published CSS keeps local asset URLs.
        const embedded=dshCss.replace(/url\(([^)]+)\)/g,(all,url)=>{const name=url.replace(/["']/g,'');const match=name.match(/assets\/([^/]+\.svg)/);if(!match)return all;return 'url("data:image/svg+xml;base64,'+Buffer.from(read('dsh/skins/rhine-lab/assets/'+match[1])).toString('base64')+'")';});
        await page.addStyleTag({content:embedded});
      }
      const after=await page.locator('main').boundingBox();assert.deepEqual(after,before,client+': decoration must not move or resize the conversation');
      const colors=await page.locator('main').evaluate(el=>{const s=getComputedStyle(el);return {bg:s.backgroundColor,opacity:s.opacity,filter:s.filter}});
      assert.equal(colors.bg,mode==='light'?'rgb(238, 233, 221)':'rgb(29, 34, 34)');assert.equal(colors.opacity,'1');assert.equal(colors.filter,'none');
      if(settings){
        const toggle=page.getByLabel('仪表动画');await toggle.uncheck();assert.equal(await toggle.isChecked(),false);
        const painted=client==='codex'?'[data-rhine-surface="settings"]':'[data-dsh-surface="settings"]';assert.notEqual(await page.locator(painted).evaluate(el=>getComputedStyle(el).backgroundImage),'none');
      }else{
        await page.getByRole('textbox').fill('本地排版测试');assert.equal(await page.getByRole('textbox').textContent(),'本地排版测试');
        if(client==='codex')assert.equal(await page.locator('[data-rhine-part="new-chat"]').count(),1);
      }
      if(process.env.RHINE_CAPTURE==='1'){
        await page.evaluate(()=>{
          document.activeElement?.blur();
          const editor=document.querySelector('[contenteditable]');if(editor)editor.textContent='描述你想要构建的内容';
          const note=document.createElement('small');note.textContent='Pioneer · 设计适配示意，非客户端截图';note.style.cssText='float:right;font-size:10px;font-weight:400;color:inherit;opacity:.75';document.querySelector('.header').append(note);
        });
        const out=resolve(root,'.checks/pioneer');mkdirSync(out,{recursive:true});await page.screenshot({path:resolve(out,`${client}-${mode}-${settings?'settings':'chat'}.png`)});
      }
      if(client==='codex'){
        await page.evaluate('window.__RHINE_LAB_THEME_V7__.remove()');
        assert.equal(await page.locator('[data-rhine-surface],[data-rhine-part],[data-rhine-heading],[data-rhine-composer]').count(),0);
        assert.equal(await page.locator('html').getAttribute('data-rhine-enabled'),null);
      }else{
        await page.locator('html').evaluate(el=>el.removeAttribute('data-dsh-skin'));
        assert.equal(await page.locator('main').evaluate(el=>getComputedStyle(el).backgroundImage),'none');
      }
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close()}
});

test('all four central assets use the approved 16 percent without changing ribbon entry mechanics',()=>{
  for(const prefix of ['runtime/assets','dsh/skins/rhine-lab/assets'])for(const mode of ['light','dark']){
    const motion=read(`${prefix}/watermark-${mode}.svg`),still=read(`${prefix}/watermark-${mode}-still.svg`);
    assert.match(motion,/<g opacity="\.16" filter=/);assert.match(still,/<g opacity="\.16">/);
    assert.match(motion,/scale\(0\) rotate\(-90deg\)/);assert.match(motion,/scale\(\.008,1\)/);
  }
});

test('desktop rail, launch header, recycled rows and div composer stay in their native regions',async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1225,height:830}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    for(const mode of ['light','dark'])for(const width of [290,240,400]){
      // Reproduce the actual 26.1023 desktop hierarchy: absolute outer panel,
      // 52px app rail, separate navigation header, virtualized scroll and div
      // composer. No real account titles/content are captured in this fixture.
      await page.setContent(`<!doctype html><html data-theme="${mode}"><style>
        *{box-sizing:border-box}body{margin:0;font:14px Arial}aside{position:absolute;top:44px;bottom:4px;width:${width}px}.absolute{position:absolute;inset:0;display:flex}.rail{width:52px;flex:none;background:#ddd}.rail button{width:36px;height:36px;margin:8px}.navigation{flex:1;min-width:0;overflow:hidden}.navigation nav{height:100%;display:flex;flex-direction:column}.header{padding:0 8px;flex:none}.native-title{height:52px;display:flex;align-items:center}.launch{display:flex;flex-direction:column;margin-bottom:8px}.sidebar-item{display:flex;width:100%;height:32px;flex-shrink:0}.scroll{flex:1;min-height:0;overflow:auto}.row{height:32px;margin:4px 8px}.separator{position:absolute;top:0;bottom:0;right:-8px;width:16px}.icon{width:24px;height:24px}.main{position:absolute;left:${width}px;top:44px;right:0;bottom:4px}.chat{height:75%;padding:30px}.compose{margin:0 28px;height:98px;border-radius:22px;background:#eee}.ProseMirror{height:44px;padding:14px}.rail button,.icon{border:0}
      </style><aside class="app-shell-left-panel"><div class="absolute"><nav class="rail" data-app-navigation-rail><button aria-current="page" data-sidebar-destination="home">H</button></nav><div class="navigation" data-sidebar-navigation-root><nav><div class="header"><div class="native-title">Codex</div><div class="launch group/nav-list"><div data-codex-tab-conversation-drop-target><button class="sidebar-item" id="launch">新聊天</button></div></div></div><div class="scroll" data-app-action-sidebar-scroll>${Array.from({length:40},(_,i)=>`<div class="row" role="button" data-app-action-sidebar-thread-row ${i===0?'data-app-action-sidebar-thread-selected="true"':''}>${i===1?'新聊天':'示例会话 '+i}<button class="icon" aria-label="新聊天">+</button></div>`).join('')}</div></nav></div></div><div class="separator" role="separator"></div></aside><main class="main" data-app-shell-main-surface><div class="chat">隔离布局检查</div><div class="compose" data-composer-surface-variant="default"><div class="ProseMirror" contenteditable>草稿</div></div></main></html>`);
      const before=await page.locator('.main').boundingBox(),composeBefore=await page.locator('.compose').boundingBox();
      await page.evaluate(`(${renderer})(${JSON.stringify({version:'native-test',enabled:true,motion:false,css,art})})`);
      await page.waitForFunction(()=>document.querySelector('[data-rhine-launcher]'));
      const layout=await page.evaluate(()=>{
        const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom}};
        const launcher=document.querySelector('[data-rhine-launcher]');
        return {rail:box('.rail'),title:box('.native-title'),banner:box('[data-rhine-launcher]'),station:box('[data-rhine-decoration="station"]'),button:box('#launch'),scroll:box('.scroll'),compose:box('.compose'),rowHeight:box('.row').h,iconHeight:box('.icon').h,marked:document.querySelectorAll('[data-rhine-part="new-chat"]').length,outerPseudo:getComputedStyle(document.querySelector('aside'),'::after').content,composerMarked:document.querySelector('.compose').hasAttribute('data-rhine-composer'),railShadow:getComputedStyle(document.querySelector('.rail button')).boxShadow};
      });
      assert.deepEqual(await page.locator('.main').boundingBox(),before);
      assert.deepEqual(await page.locator('.compose').boundingBox(),composeBefore);
      assert.equal(layout.marked,1);assert.equal(layout.rowHeight,32);assert.equal(layout.iconHeight,24);
      assert.ok(layout.banner.x>=layout.rail.x+layout.rail.w);assert.ok(layout.banner.y>=layout.title.b);
      assert.ok(layout.button.y>=layout.station.b);assert.equal(layout.button.h,78);
      assert.ok(layout.station.x>=layout.banner.x&&layout.station.x+layout.station.w<=layout.banner.x+layout.banner.w);
      assert.ok(layout.scroll.y>=layout.button.b);assert.equal(layout.outerPseudo,'none');
      assert.equal(layout.composerMarked,true);assert.equal(layout.railShadow,'none');
      // A header node reused as an unrelated action must lose its marker and
      // banner. Keep the physical node to cover React virtualization.
      await page.evaluate(()=>{
        const action=document.querySelector('#launch');action.textContent='打开归档';
        action.parentElement.removeAttribute('data-codex-tab-conversation-drop-target');
      });
      await page.waitForFunction(()=>!document.querySelector('[data-rhine-part],[data-rhine-launcher]'));
      await page.evaluate('window.__RHINE_LAB_THEME_V7__.remove()');
      assert.equal(await page.locator('[data-rhine-composer]').count(),0);
      assert.equal(await page.locator('[data-rhine-decoration]').count(),0);
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close()}
});

test('brand chrome and two-line native header retain controls and responsive hit areas',async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  try{
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    for(const mode of ['light','dark'])for(const width of [1225,850,640,510]){
      await page.setViewportSize({width,height:830});
      await page.setContent(`<!doctype html><html data-theme="${mode}"><style>
      *{box-sizing:border-box}body{margin:0;font:14px Arial;--app-shell-titlebar-height:8px;--app-shell-header-height:52px}.frame{height:830px;position:relative}.native-top{height:36px;width:100%;display:flex;align-items:center;padding-left:6px;-webkit-app-region:drag}.nav-tools{width:102px;display:flex;flex:none}.nav-tools button{width:28px;height:28px}.native-top [role=menubar]{display:flex;padding:0 8px 0 4px;gap:2px}.native-top button{height:28px;border:0;color:var(--color-text-tertiary,#444);background:none;-webkit-app-region:no-drag;white-space:nowrap}.native-top [role=menuitem]{padding:0 10px}.caption{position:absolute;right:0;top:0;width:136px;height:36px;pointer-events:none}.page-head{--app-shell-titlebar-height:52px;position:absolute;left:0;top:44px;right:0;height:52px;display:flex;pointer-events:none;-webkit-app-region:drag}.native-toolbar{position:absolute;left:0;right:0;top:0;height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 26px}.native-toolbar button{pointer-events:auto;-webkit-app-region:no-drag}main{position:absolute;left:0;right:0;top:44px;bottom:0}.workspace{height:100%;padding-top:52px;display:flex;flex-direction:column}.thread{flex:1;min-height:0;overflow:auto}.message{height:900px;padding:30px}.composer{height:98px;flex:none;margin:10px 26px;padding:20px}
      </style><div class="frame"><div class="native-top _ApplicationMenuTopBar_fixture"><div class="nav-tools"><button id="back">←</button><button>→</button><button>☷</button></div><div role="menubar"><button role="menuitem" id="menu">文件</button><button role="menuitem">编辑</button><button role="menuitem">视图</button><button role="menuitem">帮助</button></div></div><div class="caption"></div><main data-app-shell-main-surface><div class="workspace _WorkspaceContent_fixture"><div class="thread"><div class="message">主题效果检查</div></div><div class="composer" data-composer-surface-variant="default"><div class="ProseMirror" contenteditable>保留草稿</div></div></div></main><header class="page-head" data-app-shell-titlebar data-app-shell-header-layout="thread-edge-scroll"><div class="native-toolbar"><span>莱茵生命研究所 / 实验记录</span><button id="action">原生操作</button></div></header></div>`);
      await page.evaluate(()=>{window.events=[];window.originalButtons=[...document.querySelectorAll('button')];for(const b of window.originalButtons)b.addEventListener('click',()=>window.events.push(b.id||'other'));});
      const mainBefore=await page.locator('main').boundingBox(),composeBefore=await page.locator('.composer').boundingBox();
      const payload={version:'chrome-test',enabled:true,motion:false,css,art};
      await page.evaluate(`(${renderer})(${JSON.stringify(payload)})`);
      const geometry=await page.evaluate(()=>{
        const rect=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom,right:r.right}};
        const bar=document.querySelector('[data-rhine-chrome]');
        return {top:rect('[data-rhine-chrome]'),menu:rect('[role=menubar]'),caption:rect('.caption'),header:rect('header'),channel:rect('[data-rhine-decoration="channel"]'),thread:rect('.thread'),lastMenu:rect('[role=menuitem]:last-child'),drag:getComputedStyle(bar).webkitAppRegion,buttonDrag:getComputedStyle(document.querySelector('#menu')).webkitAppRegion,sameButtons:window.originalButtons.every(b=>b.isConnected),draft:document.querySelector('.ProseMirror').textContent,decorations:document.querySelectorAll('[data-rhine-decoration]').length,channelOverflow:document.querySelector('[data-rhine-decoration="channel"]').scrollWidth>document.querySelector('[data-rhine-decoration="channel"]').clientWidth};
      });
      assert.deepEqual(await page.locator('main').boundingBox(),mainBefore);
      assert.deepEqual(await page.locator('.composer').boundingBox(),composeBefore);
      assert.equal(geometry.top.h,36);assert.equal(geometry.header.h,84);assert.equal(geometry.channel.h,32);
      assert.equal(geometry.thread.y,geometry.header.b);assert.equal(geometry.sameButtons,true);
      assert.ok(geometry.lastMenu.right<=geometry.caption.x,`menu enters native caption region at ${width}`);
      assert.equal(geometry.drag,'drag');assert.equal(geometry.buttonDrag,'no-drag');assert.equal(geometry.channelOverflow,false);
      assert.equal(geometry.draft,'保留草稿');assert.equal(geometry.decorations,4);
      for(const id of ['menu','back','action'])await page.locator('#'+id).click();
      assert.deepEqual(await page.evaluate('window.events'),['menu','back','action']);
      await page.evaluate(`(${renderer})(${JSON.stringify(payload)})`);await page.waitForTimeout(50);
      assert.equal(await page.locator('[data-rhine-decoration]').count(),4,'repeat application must not duplicate chrome');
      await page.evaluate('window.__RHINE_LAB_THEME_V7__.setEnabled(false)');
      assert.equal(await page.locator('[data-rhine-decoration="brand"]').isVisible(),false);
      assert.equal(await page.locator('header').evaluate(e=>e.getBoundingClientRect().height),52);
      await page.evaluate('window.__RHINE_LAB_THEME_V7__.remove()');
      assert.equal(await page.locator('[data-rhine-decoration],[data-rhine-titlebar],[data-rhine-chrome],[data-rhine-content]').count(),0);
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close()}
});

test('secondary text and links retain 4.5:1 over the strongest flat watermark',()=>{
  const hex=s=>s.slice(1).match(/../g).map(x=>parseInt(x,16));
  const lum=c=>{const a=c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722};
  const contrast=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
  for(const mode of ['light','dark']){
    const block=mode==='light'?css.slice(0,css.indexOf('[data-theme="dark"]')):css.slice(css.indexOf('[data-theme="dark"]'));
    const token=name=>hex(block.match(new RegExp(name+':(#[A-Fa-f0-9]{6})'))[1]);
    const surface=token('--rhine-surface'),mark=token('--rhine-ink'),strong=surface.map((v,i)=>v*.84+mark[i]*.16);
    for(const name of ['--rhine-ink','--rhine-muted','--rhine-accent'])assert.ok(contrast(token(name),strong)>=4.5,`${mode} ${name} over 16% watermark`);
  }
});
