(function installRhine(payload) {
  const key = '__RHINE_LAB_THEME_V7__';
  const revision = 'pioneer-native-4';
  if (window[key]?.version === payload.version && window[key]?.revision === revision) { window[key].configure(payload); return; }
  window[key]?.remove();
  const style = document.createElement('style'); style.id = 'rhine-lab-theme-v7';
  style.textContent = payload.css; (document.head || document.documentElement).append(style);
  let config = payload; let queued = false; let removed = false;
  const marked = new Set();
  let parts = new Map(); let nextParts;
  const decorations=new Map();let wantedDecorations;
  function decorate(parent,kind,content,first=false){
    if(!parent)return;
    let entries=decorations.get(parent);if(!entries){entries=new Map();decorations.set(parent,entries);}
    let node=entries.get(kind);
    if(!node){node=document.createElement('div');node.setAttribute('data-rhine-decoration',kind);node.setAttribute('aria-hidden','true');node.innerHTML=content;entries.set(kind,node);}
    if(node.parentElement!==parent){if(first)parent.prepend(node);else parent.append(node);}
    wantedDecorations.add(node);
  }
  function attribute(element,name,value) {
    if(!element)return;
    if(element.getAttribute(name)!==value)element.setAttribute(name,value);
    if(!nextParts.has(element))nextParts.set(element,new Map());
    nextParts.get(element).set(name,value);
  }
  function mark(element,kind) {
    if (!element) return;
    if (element.getAttribute('data-rhine-surface') !== kind) element.setAttribute('data-rhine-surface',kind);
    marked.add(element);
  }
  function refresh() {
    queued=false; if (removed) return;
    nextParts=new Map();
    wantedDecorations=new Set();
    const html=document.documentElement;
    html.setAttribute('data-rhine-enabled',String(config.enabled));
    const groups=[...document.querySelectorAll('.group\\/settings')].filter(element=>element.getClientRects().length);
    html.setAttribute('data-rhine-route',groups.length?'settings':'chat');
    for (const element of document.querySelectorAll('main[data-app-shell-main-surface]')) mark(element,'main');
    for(const menu of document.querySelectorAll('[role="menubar"]')){
      const bar=menu.parentElement;
      if(!bar?.matches('[class*="ApplicationMenuTopBar_"]'))continue;
      attribute(bar,'data-rhine-chrome','true');
      decorate(bar,'brand','<b>R.</b><strong>RHINE LAB</strong>',true);
      decorate(bar,'project','PIONEER PROJECT / RESEARCH TERMINAL');
      decorate(bar,'client','Codex');
    }
    for(const header of document.querySelectorAll('header[data-app-shell-titlebar][data-app-shell-header-layout="thread-edge-scroll"]')){
      if(!header.getBoundingClientRect().width||groups.length)continue;
      const rect=header.getBoundingClientRect();
      const main=[...document.querySelectorAll('main[data-app-shell-main-surface]')].find(e=>{
        const r=e.getBoundingClientRect();return r.width&&Math.abs(r.x-rect.x)<2&&Math.abs(r.width-rect.width)<2;
      });
      const content=main?.querySelector('[class*="_WorkspaceContent_"]');
      // Reserve the same 32px below the native 52px toolbar; never cover text.
      if(!content)continue;
      attribute(header,'data-rhine-titlebar','true');attribute(content,'data-rhine-content','true');
      decorate(header,'channel','<span>任务 / CONVERSATION</span><span>STRUCTURAL SECTION · STRU-001</span>');
    }
    for (const group of groups) {
      // Desktop omits data-settings-mobile-header. The native settings group
      // itself identifies its real, opaque scrollport without depending on it.
      const scrollport=group.closest('.scrollbar-stable') || group.parentElement;
      mark(scrollport,'settings');
      for(const heading of group.querySelectorAll('h1')) attribute(heading,'data-rhine-heading',heading.textContent.trim());
    }
    for(const sidebar of document.querySelectorAll('aside.app-shell-left-panel')) {
      // Current desktop wraps BOTH the application rail and navigation in aside.
      // Scope the banner to the native launch list, never the outer panel or a
      // virtualized conversation row (even one titled "New chat").
      const action=[...sidebar.querySelectorAll('[data-codex-tab-conversation-drop-target] > button.sidebar-item,[data-sidebar-destination="new-chat"],button.sidebar-item')].find(element=>{
        if(element.closest('[data-app-action-sidebar-scroll],[data-app-action-sidebar-thread-row],[data-app-navigation-rail]'))return false;
        return element.matches('[data-codex-tab-conversation-drop-target] > button.sidebar-item,[data-sidebar-destination="new-chat"]') || /^(?:新(?:聊天|对话|会话|任务)|new[ -]?(?:chat|thread|conversation|task))$/i.test(element.textContent.trim());
      });
      if(action){
        attribute(action,'data-rhine-part','new-chat');
        const launcher=action.closest('.group\\/nav-list');
        attribute(launcher,'data-rhine-launcher','true');
        decorate(launcher,'station','<div class="rhine-station-kicker">RHINE LAB / PERSONAL<br>WORKSPACE</div><div class="rhine-station-title">Terminal<span>Terminal</span></div>',true);
      }
    }
    for(const editor of document.querySelectorAll('.ProseMirror')) attribute(editor.closest('[data-composer-surface-variant],form,[data-composer-root]'),'data-rhine-composer','true');
    for (const element of marked) if (!element.isConnected) marked.delete(element);
    // React reuses sidebar nodes: clear markers as soon as their role changes.
    for(const [element,attributes]of parts)for(const name of attributes.keys())if(!nextParts.get(element)?.has(name))element.removeAttribute(name);
    parts=nextParts;
    for(const [parent,entries]of decorations){
      for(const [kind,node]of entries)if(!wantedDecorations.has(node)){node.remove();entries.delete(kind);}
      if(!entries.size)decorations.delete(parent);
    }
    const mode=html.getAttribute('data-theme')==='dark'?'dark':'light';
    const urls=config.art[`${mode}-${config.motion?'motion':'still'}`];
    for (const [kind,url] of Object.entries(urls)) html.style.setProperty(`--rhine-${kind}`,`url("${url}")`);
  }
  function schedule() { if(!queued&&!removed) { queued=true; requestAnimationFrame(refresh); } }
  const domObserver=new MutationObserver(schedule); domObserver.observe(document.documentElement,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['aria-label','data-sidebar-destination','data-codex-tab-conversation-drop-target','data-app-action-sidebar-thread-row','data-composer-surface-variant']});
  const appearanceObserver=new MutationObserver(schedule); appearanceObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window.addEventListener('resize',schedule);
  window[key]={version:payload.version,revision,configure(next){config=next;style.textContent=next.css;refresh();},setEnabled(value){config={...config,enabled:value===true};refresh();},verify(){
    const settings=document.querySelector('[data-rhine-surface="settings"]');
    const main=[...document.querySelectorAll('main[data-app-shell-main-surface]')].find(element=>element.getClientRects().length);
    return {enabled:config.enabled,stylePresent:style.isConnected,route:document.documentElement.getAttribute('data-rhine-route'),settingsPainted:!!settings&&getComputedStyle(settings).backgroundImage!=='none',mainPresent:!!main,sidebarPresent:!!document.querySelector('aside.app-shell-left-panel'),composerPresent:!!document.querySelector('.ProseMirror'),design:'pioneer',watermarkOpacity:.16};
  },remove(){removed=true;domObserver.disconnect();appearanceObserver.disconnect();window.removeEventListener('resize',schedule);style.remove();for(const e of marked)e.removeAttribute('data-rhine-surface');for(const [e,attributes]of parts)for(const k of attributes.keys())e.removeAttribute(k);for(const entries of decorations.values())for(const node of entries.values())node.remove();decorations.clear();for(const k of ['data-rhine-enabled','data-rhine-route'])document.documentElement.removeAttribute(k);for(const k of ['identity','watermark','rail','structure','terminal','instrument'])document.documentElement.style.removeProperty(`--rhine-${k}`);delete window[key];}};
  refresh();
})
