import fs from 'node:fs/promises';
import path from 'node:path';
import {CDP} from './cdp.mjs';
const runtime=path.join(process.env.LOCALAPPDATA,'RhineLabTheme7');
const session=JSON.parse((await fs.readFile(path.join(runtime,'session.json'),'utf8')).replace(/^\uFEFF/,''));
const base=`http://127.0.0.1:${session.port}`;
const version=await (await fetch(`${base}/json/version`)).json();
if(version.webSocketDebuggerUrl!==session.identity.BrowserWebSocketDebuggerUrl)throw new Error('The verified browser session changed.');
const browser=new CDP(session.identity.BrowserWebSocketDebuggerUrl); await browser.ready;
const renderer=await fs.readFile(path.join(import.meta.dirname,'renderer.js'),'utf8');
const css=await fs.readFile(path.join(import.meta.dirname,'assets/theme.css'),'utf8');
const art={};
for(const mode of ['light','dark'])for(const motion of ['motion','still']){
  const group={};
  for(const kind of ['identity','watermark','rail','structure']){
    const svg=await fs.readFile(path.join(import.meta.dirname,`assets/${kind}-${mode}${motion==='still'?'-still':''}.svg`),'utf8');
    group[kind]=`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
  art[`${mode}-${motion}`]=group;
}
const clients=new Map(); let lastConfig=''; let lastVerification=''; let payload;
async function readConfig(){
  let config={enabled:true,motion:true};
  try{config=JSON.parse((await fs.readFile(path.join(runtime,'preferences.json'),'utf8')).replace(/^\uFEFF/,''));}catch(e){if(e.code!=='ENOENT')throw e;}
  if(typeof config.enabled!=='boolean'||typeof config.motion!=='boolean')throw new Error('Invalid theme preferences.');
  const stamp=JSON.stringify(config);
  payload={version:'1.1.0',enabled:config.enabled,motion:config.motion,css,art};
  return stamp;
}
function appTarget(t){
  if(t.type!=='page')return false;
  const url=new URL(t.url);
  return url.protocol==='app:'&&url.hostname==='-'&&['/index.html','/detached-window.html'].includes(url.pathname)&&url.searchParams.get('initialRoute')!=='/avatar-overlay';
}
async function cycle(){
  if(browser.closed)throw new Error('The official Codex session closed.');
  const stamp=await readConfig();
  const targets=(await(await fetch(`${base}/json/list`)).json()).filter(appTarget);
  const active=new Set(targets.map(t=>t.id));
  for(const [id,entry]of clients)if(!active.has(id)||entry.client.closed){entry.client.close();clients.delete(id);}
  const results=[];
  for(const target of targets){
    try{
      let entry=clients.get(target.id);
      if(!entry){
        const ws=new URL(target.webSocketDebuggerUrl);
        if(Number(ws.port)!==session.port)throw new Error('Renderer port mismatch.');
        const client=new CDP(target.webSocketDebuggerUrl);
        entry={client};clients.set(target.id,entry);
      }
      if(entry.stamp!==stamp){
        if(entry.registration)await entry.client.call('Page.removeScriptToEvaluateOnNewDocument',{identifier:entry.registration});
        const registered=await entry.client.call('Page.addScriptToEvaluateOnNewDocument',{source:`(${renderer})(${JSON.stringify(payload)});`});
        entry.registration=registered.identifier;entry.stamp=stamp;
      }
      const present=await entry.client.evaluate('!!window.__RHINE_LAB_THEME_V7__');
      if(!present||stamp!==lastConfig)await entry.client.evaluate(`(${renderer})(${JSON.stringify(payload)}); true`);
      results.push(await entry.client.evaluate('window.__RHINE_LAB_THEME_V7__.verify()'));
    }catch(e){results.push({error:e.message});}
  }
  lastConfig=stamp;
  const verification=JSON.stringify(results);
  if(verification!==lastVerification){await fs.writeFile(path.join(runtime,'verification.json'),JSON.stringify({time:new Date().toISOString(),official:session.official.Version,results},null,2));lastVerification=verification;}
  return results;
}
async function remove(){
  const targets=(await(await fetch(`${base}/json/list`)).json()).filter(appTarget);
  for(const target of targets){const client=new CDP(target.webSocketDebuggerUrl);try{await client.evaluate('window.__RHINE_LAB_THEME_V7__?.remove(); true');}finally{client.close();}}
}
try{
  if(process.argv.includes('--remove')){await remove();console.log(JSON.stringify({removed:true}));}
  else{
    let results=await cycle();
    const deadline=Date.now()+15000;
    while(!results.some(r=>r.stylePresent&&r.mainPresent)&&Date.now()<deadline){await new Promise(resolve=>setTimeout(resolve,250));results=await cycle();}
    console.log(JSON.stringify({official:session.official.Version,results}));
    if(!results.some(r=>r.stylePresent&&r.mainPresent))throw new Error('The live Codex renderer did not confirm the theme.');
    await fs.writeFile(path.join(runtime,'verification.json'),JSON.stringify({time:new Date().toISOString(),official:session.official.Version,results},null,2));
    if(process.argv.includes('--show')){
      const targets=(await(await fetch(`${base}/json/list`)).json()).filter(appTarget);
      const main=targets.find(t=>new URL(t.url).pathname==='/index.html');
      if(main){
        const entry=clients.get(main.id);
        // Electron exposes renderer CDP but may not expose Chromium window IDs.
        // The launcher restores the verified native app window when necessary.
        try{await entry.client.call('Page.bringToFront');}catch(e){console.error(`Window focus: ${e.message}`);}
      }
    }
    if(process.argv.includes('--watch')){
      await fs.writeFile(path.join(runtime,'engine.json'),JSON.stringify({pid:process.pid,script:path.join(import.meta.dirname,'engine.mjs'),node:process.execPath,browserId:session.identity.BrowserId}));
      while(!browser.closed){await new Promise(resolve=>setTimeout(resolve,1200));try{await cycle();}catch(e){if(browser.closed)break;console.error(e.message);}}
    }
  }
}finally{for(const entry of clients.values())entry.client.close();browser.close();}
