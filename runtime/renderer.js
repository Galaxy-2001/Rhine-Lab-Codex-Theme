(function installRhine(payload) {
  const key = '__RHINE_LAB_THEME_V7__';
  const revision = 'pioneer-native-8';
  const root = document.documentElement;
  const existing = window[key];
  if (existing?.version === payload.version && existing.revision === revision && existing.root === root) {
    existing.configure(payload);
    return;
  }
  existing?.remove();

  const style = document.createElement('style');
  style.id = 'rhine-lab-theme-v7';
  style.textContent = payload.css;
  let config = payload;
  let queued = false;
  let removed = false;
  let hooks = {};

  // Markers and decorations written by one refresh. Anything the next refresh
  // does not write again is removed: React recycles nodes for other roles.
  let markers = new Map();
  let nextMarkers;
  const decorations = new Map();
  let wantedDecorations;

  const NEW_CHAT_ANY = /^(?:新(?:聊天|对话|会话|任务)|new[ -]?(?:chat|thread|conversation|task))$/i;

  function setAttribute(element, name, value) {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  }

  function mark(element, name, value) {
    if (!element) return;
    setAttribute(element, name, value);
    if (!nextMarkers.has(element)) nextMarkers.set(element, new Map());
    nextMarkers.get(element).set(name, value);
  }

  function decorate(parent, kind, content, first = false) {
    if (!parent) return;
    let entries = decorations.get(parent);
    if (!entries) { entries = new Map(); decorations.set(parent, entries); }
    let node = entries.get(kind);
    if (!node) {
      node = document.createElement('div');
      node.setAttribute('data-rhine-decoration', kind);
      node.setAttribute('aria-hidden', 'true');
      node.innerHTML = content;
      entries.set(kind, node);
    }
    if (node.parentElement !== parent) { if (first) parent.prepend(node); else parent.append(node); }
    wantedDecorations.add(node);
  }

  function visible(element) {
    return element.getClientRects().length > 0;
  }

  function decorateChrome(found) {
    for (const menu of document.querySelectorAll('[role="menubar"]')) {
      const bar = menu.parentElement;
      if (!bar?.matches('[class*="ApplicationMenuTopBar_"],[class*="ApplicationMenuTopBar-"], [data-app-shell-frame][data-app-shell-application-menu-bar] > *')) continue;
      found.chrome = true;
      mark(bar, 'data-rhine-chrome', 'true');
      decorate(bar, 'brand', '<b>R.</b><strong>RHINE LAB</strong>', true);
      decorate(bar, 'project', 'PIONEER PROJECT / RESEARCH TERMINAL');
      decorate(bar, 'client', 'Codex');
    }
  }

  // Empty pages can share the same header. Only pair a header with a visible
  // workspace that actually has conversation turns.
  function decorateThreadHeader(found, mains) {
    if (!mains.length) return;
    for (const header of document.querySelectorAll('header[data-app-shell-titlebar]:is([data-app-shell-header-layout="thread-edge-scroll"],[data-app-shell-application-menu-bar])')) {
      const rect = header.getBoundingClientRect();
      if (!rect.width) continue;
      const page = header.closest('[data-app-shell-active-page]');
      const main = mains.find(element => {
        if (page) return element.closest('[data-app-shell-active-page]') === page;
        const r = element.getBoundingClientRect();
        return r.width && Math.abs(r.x - rect.x) < 2 && Math.abs(r.width - rect.width) < 2;
      });
      const content = main?.querySelector('[class*="_WorkspaceContent_"],[class*="WorkspaceContent-"]');
      const inset = content || main?.querySelector(':scope > div > [data-app-shell-main-content-layout]')?.parentElement;
      if (!inset) continue;
      found.channel = true;
      mark(header, 'data-rhine-titlebar', 'true');
      mark(inset, 'data-rhine-content', 'true');
      decorate(header, 'channel', '<span>任务 / CONVERSATION</span><span>STRUCTURAL SECTION · STRU-001</span>');
    }
  }

  function decorateSettings(groups) {
    for (const group of groups) {
      // Desktop omits data-settings-mobile-header; the settings group itself
      // identifies the real, opaque scrollport.
      mark(group.closest('.scrollbar-stable') || group.parentElement, 'data-rhine-surface', 'settings');
      for (const heading of group.querySelectorAll('h1')) mark(heading, 'data-rhine-heading', heading.textContent.trim());
    }
  }

  // Station artwork: 220 x 112 drawn 16px from the left and 20px from the
  // bottom of the conversation list. It is paint only, so the native list
  // keeps its full height. Shown at full strength only when the rows end
  // above it; otherwise it falls back to a faint watermark behind the rows.
  function stationRoom(scroll) {
    const box = scroll.getBoundingClientRect();
    if (scroll.scrollHeight > scroll.clientHeight + 1) return false;
    let bottom = box.top;
    const pending = [...scroll.children];
    while (pending.length) {
      const child = pending.pop();
      const r = child.getBoundingClientRect();
      if (r.height) bottom = Math.max(bottom, r.bottom);
      else if (getComputedStyle(child).display === 'contents') pending.push(...child.children);
    }
    const width = Math.min(220, box.width - 32);
    return box.bottom - bottom >= width * 112 / 220 + 36;
  }

  // The outer aside wraps both the application rail and the navigation. Only
  // the native launch entry is restyled (paint only), never a virtualized
  // conversation row, even one titled "New chat".
  function decorateLauncher(found) {
    for (const sidebar of document.querySelectorAll('aside.app-shell-left-panel')) {
      const native = '[data-codex-tab-conversation-drop-target] > button.sidebar-item,[data-sidebar-destination="new-chat"]';
      const action = [...sidebar.querySelectorAll(`${native},button.sidebar-item`)].find(element => {
        if (element.closest('[data-app-action-sidebar-scroll],[data-app-action-sidebar-thread-row],[data-app-navigation-rail]')) return false;
        return element.matches(native) || NEW_CHAT_ANY.test(element.textContent.trim());
      });
      if (action) { found.launcher = true; mark(action, 'data-rhine-part', 'new-chat'); }
      const scroll = sidebar.querySelector('[data-app-action-sidebar-scroll]');
      if (scroll && visible(scroll) && !sidebar.closest('[data-app-shell-sidebar-open="false"]')) mark(scroll, 'data-rhine-station', stationRoom(scroll) ? 'full' : 'faint');
    }
  }

  function refresh() {
    queued = false;
    if (removed) return;
    if (!style.isConnected) (document.head || root).append(style);
    nextMarkers = new Map();
    wantedDecorations = new Set();
    const found = {chrome: false, channel: false, launcher: false, composer: false};

    const settingsGroups = [...document.querySelectorAll('.group\\/settings')].filter(visible);
    const mains = [...document.querySelectorAll('main[data-app-shell-main-surface]')];
    for (const element of mains) mark(element, 'data-rhine-surface', 'main');
    const threadMains = settingsGroups.length ? [] : mains.filter(main =>
      visible(main) && main.querySelector('[data-content-search-turn-key],[data-message-author-role]')
    );
    decorateChrome(found);
    decorateThreadHeader(found, threadMains);
    decorateSettings(settingsGroups);
    decorateLauncher(found);
    for (const editor of document.querySelectorAll('.ProseMirror')) {
      const composer = editor.closest('[data-composer-surface-variant],form,[data-composer-root]');
      if (composer) { found.composer = true; mark(composer, 'data-rhine-composer', 'true'); }
    }

    for (const [element, names] of markers) {
      for (const name of names.keys()) if (!nextMarkers.get(element)?.has(name)) element.removeAttribute(name);
    }
    markers = nextMarkers;
    for (const [parent, entries] of decorations) {
      for (const [kind, node] of entries) if (!wantedDecorations.has(node)) { node.remove(); entries.delete(kind); }
      if (!entries.size) decorations.delete(parent);
    }

    // The watermark animates only on the empty new-chat page. Thread and
    // settings pages show the still mark, which saves the per-frame repaint.
    const route = settingsGroups.length ? 'settings' : threadMains.length ? 'thread' : 'chat';
    setAttribute(root, 'data-rhine-enabled', String(config.enabled));
    setAttribute(root, 'data-rhine-route', route);
    setAttribute(root, 'data-rhine-motion', config.motion && route === 'chat' ? 'on' : 'off');
    hooks = found;
  }

  function schedule() {
    if (!queued && !removed) { queued = true; requestAnimationFrame(refresh); }
  }

  function verify() {
    const settings = document.querySelector('[data-rhine-surface="settings"]');
    const main = [...document.querySelectorAll('main[data-app-shell-main-surface]')].find(visible);
    // A hook is missing when its native anchor exists but no selector matched,
    // which usually means a client update renamed an internal class.
    const expected = {
      chrome: !!document.querySelector('[role="menubar"]'),
      channel: root.getAttribute('data-rhine-route') === 'thread',
      launcher: !!document.querySelector('aside.app-shell-left-panel'),
      composer: !!document.querySelector('.ProseMirror')
    };
    return {
      enabled: config.enabled,
      stylePresent: style.isConnected,
      route: root.getAttribute('data-rhine-route'),
      motion: root.getAttribute('data-rhine-motion'),
      settingsPainted: !!settings && getComputedStyle(settings).backgroundImage !== 'none',
      mainPresent: !!main,
      sidebarPresent: expected.launcher,
      composerPresent: expected.composer,
      design: 'pioneer',
      hooks: {...hooks},
      missingHooks: Object.keys(expected).filter(name => expected[name] && !hooks[name])
    };
  }

  function remove() {
    removed = true;
    domObserver.disconnect();
    window.removeEventListener('resize', schedule);
    style.remove();
    for (const [element, names] of markers) for (const name of names.keys()) element.removeAttribute(name);
    markers.clear();
    for (const entries of decorations.values()) for (const node of entries.values()) node.remove();
    decorations.clear();
    for (const name of ['data-rhine-enabled', 'data-rhine-route', 'data-rhine-motion']) root.removeAttribute(name);
    delete window[key];
  }

  const domObserver = new MutationObserver(schedule);
  domObserver.observe(root, {
    childList: true, characterData: true, subtree: true, attributes: true,
    attributeFilter: ['data-app-shell-header-layout', 'data-content-search-turn-key', 'data-message-author-role', 'aria-label', 'data-sidebar-destination', 'data-codex-tab-conversation-drop-target', 'data-app-action-sidebar-thread-row', 'data-app-action-sidebar-section-collapsed', 'data-app-shell-sidebar-open', 'data-composer-surface-variant']
  });
  window.addEventListener('resize', schedule);
  window[key] = {
    version: payload.version,
    revision,
    root,
    configure(next) { config = next; style.textContent = next.css; refresh(); },
    setEnabled(value) { config = {...config, enabled: value === true}; refresh(); },
    verify,
    remove
  };
  (document.head || root).append(style);
  refresh();
})
