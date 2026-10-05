(function installRhine(payload) {
  const key = '__RHINE_LAB_THEME_V7__';
  if (window[key]?.version === payload.version) { window[key].configure(payload); return; }
  window[key]?.remove();
  const style = document.createElement('style'); style.id = 'rhine-lab-theme-v7';
  style.textContent = payload.css; (document.head || document.documentElement).append(style);
  let config = payload; let queued = false; let removed = false;
  const marked = new Set();
  function mark(element,kind) {
    if (!element) return;
    if (element.getAttribute('data-rhine-surface') !== kind) element.setAttribute('data-rhine-surface',kind);
    marked.add(element);
  }
  function refresh() {
    queued=false; if (removed) return;
    const html=document.documentElement;
    html.setAttribute('data-rhine-enabled',String(config.enabled));
    const groups=[...document.querySelectorAll('.group\\/settings')];
    html.setAttribute('data-rhine-route',groups.length?'settings':'chat');
    for (const element of document.querySelectorAll('main[data-app-shell-main-surface]')) mark(element,'main');
    for (const group of groups) {
      // Desktop omits data-settings-mobile-header. The native settings group
      // itself identifies its real, opaque scrollport without depending on it.
      const scrollport=group.closest('.scrollbar-stable') || group.parentElement;
      mark(scrollport,'settings');
    }
    for (const element of marked) if (!element.isConnected) marked.delete(element);
    const mode=html.getAttribute('data-theme')==='dark'?'dark':'light';
    const urls=config.art[`${mode}-${config.motion?'motion':'still'}`];
    for (const [kind,url] of Object.entries(urls)) html.style.setProperty(`--rhine-${kind}`,`url("${url}")`);
  }
  function schedule() { if(!queued&&!removed) { queued=true; requestAnimationFrame(refresh); } }
  const domObserver=new MutationObserver(schedule); domObserver.observe(document.documentElement,{childList:true,subtree:true});
  const appearanceObserver=new MutationObserver(schedule); appearanceObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window[key]={version:payload.version,configure(next){config=next;refresh();},setEnabled(value){config={...config,enabled:value===true};refresh();},verify(){
    const settings=document.querySelector('[data-rhine-surface="settings"]');
    const main=document.querySelector('main[data-app-shell-main-surface]');
    return {enabled:config.enabled,stylePresent:style.isConnected,route:document.documentElement.getAttribute('data-rhine-route'),settingsPainted:!!settings&&getComputedStyle(settings).backgroundImage!=='none',mainPresent:!!main,sidebarPresent:!!document.querySelector('aside.app-shell-left-panel'),composerPresent:!!document.querySelector('.ProseMirror')};
  },remove(){removed=true;domObserver.disconnect();appearanceObserver.disconnect();style.remove();for(const e of marked)e.removeAttribute('data-rhine-surface');for(const k of ['data-rhine-enabled','data-rhine-route'])document.documentElement.removeAttribute(k);for(const k of ['identity','watermark','rail','structure'])document.documentElement.style.removeProperty(`--rhine-${k}`);delete window[key];}};
  refresh();
})
