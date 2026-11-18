import fs from 'node:fs/promises';
import path from 'node:path';
import {CDP} from './cdp.mjs';
import {buildArtCss} from './art.mjs';
const here=import.meta.dirname;
const runtime=path.join(process.env.LOCALAPPDATA,'RhineLabTheme7');
const readJson=async file=>JSON.parse((await fs.readFile(file,'utf8')).replace(/^﻿/,''));
const session=await readJson(path.join(runtime,'session.json'));
const {version:themeVersion}=await readJson(path.join(here,'manifest.json'));
const base=`http://127.0.0.1:${session.port}`;
const version=await (await fetch(`${base}/json/version`)).json();
if(version.webSocketDebuggerUrl!==session.identity.BrowserWebSocketDebuggerUrl)throw new Error('The verified browser session changed.');
const browser=new CDP(session.identity.BrowserWebSocketDebuggerUrl); await browser.ready;
const renderer=await fs.readFile(path.join(here,'renderer.js'),'utf8');
const css=(await fs.readFile(path.join(here,'assets/theme.css'),'utf8'))+'\n'+buildArtCss(path.join(here,'assets'));
const probe='(()=>{const theme=window.__RHINE_LAB_THEME_V7__;return theme?theme.verify():null})()';
const clients=new Map(); let lastVerification=''; let stamp=''; let source='';
// The payload carries several megabytes of artwork: serialize it once per
// preference change, not once per target and poll.
async function readConfig(){
  let config={enabled:true,motion:true};
  try{config=await readJson(path.join(runtime,'preferences.json'));}catch(e){if(e.code!=='ENOENT')throw e;}
  if(typeof config.enabled!=='boolean'||typeof config.motion!=='boolean')throw new Error('Invalid theme preferences.');
  const next=JSON.stringify({enabled:config.enabled,motion:config.motion});
  if(next!==stamp){stamp=next;source=`(${renderer})(${JSON.stringify({version:themeVersion,enabled:config.enabled,motion:config.motion,css})});`;}
}
function appTarget(t){
  if(t.type!=='page')return false;
  let url;try{url=new URL(t.url);}catch{return false;}
  return url.protocol==='app:'&&url.hostname==='-'&&['/index.html','/detached-window.html'].includes(url.pathname)&&url.searchParams.get('initialRoute')!=='/avatar-overlay';
}
async function cycle(){
  if(browser.closed)throw new Error('The official Codex session closed.');
  await readConfig();
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
        entry={client:new CDP(target.webSocketDebuggerUrl)};clients.set(target.id,entry);
      }
      if(entry.registered!==stamp){
        if(entry.registration)await entry.client.call('Page.removeScriptToEvaluateOnNewDocument',{identifier:entry.registration});
        entry.registration=(await entry.client.call('Page.addScriptToEvaluateOnNewDocument',{source})).identifier;entry.registered=stamp;
      }
      // Re-inject after a reload, a preference change, or a detached style.
      let state=await entry.client.evaluate(probe);
      if(!state?.stylePresent||entry.applied!==stamp){
        await entry.client.evaluate(source+' true');entry.applied=stamp;
        state=await entry.client.evaluate(probe);
      }
      results.push(state??{error:'The theme did not install in this renderer.'});
    }catch(e){results.push({error:e.message});}
  }
  const verification=JSON.stringify(results);
  if(verification!==lastVerification){await fs.writeFile(path.join(runtime,'verification.json'),JSON.stringify({time:new Date().toISOString(),official:session.official.Version,results},null,2));lastVerification=verification;}
  return results;
}
async function remove(){
  const targets=(await(await fetch(`${base}/json/list`)).json()).filter(appTarget);
  for(const target of targets){const client=new CDP(target.webSocketDebuggerUrl);try{await client.evaluate('window.__RHINE_LAB_THEME_V7__?.remove(); true');}finally{client.close();}}
}
const confirmed=results=>results.some(r=>r.stylePresent&&r.mainPresent);
try{
  if(process.argv.includes('--remove')){await remove();console.log(JSON.stringify({removed:true}));}
  else{
    let results=await cycle();
    const deadline=Date.now()+45000;
    while(!confirmed(results)&&Date.now()<deadline){await new Promise(resolve=>setTimeout(resolve,250));results=await cycle();}
    console.log(JSON.stringify({official:session.official.Version,results}));
    if(!confirmed(results))throw new Error('The live Codex renderer did not confirm the theme.');
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
      await fs.writeFile(path.join(runtime,'engine.json'),JSON.stringify({pid:process.pid,script:path.join(here,'engine.mjs'),node:process.execPath,browserId:session.identity.BrowserId}));
      while(!browser.closed){await new Promise(resolve=>setTimeout(resolve,1200));try{await cycle();}catch(e){if(browser.closed)break;console.error(e.message);}}
    }
  }
}finally{for(const entry of clients.values())entry.client.close();browser.close();}
