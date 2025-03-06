let tabs = [];
let currentTabId = null;
let closedTabs = [];
const defaultSearchEngine = "https://www.google.com/search?q=";

function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]');
}
function saveFavorites(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}
function updateFavoriteIcon(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (tab) {
    const favoriteElement = tab.button.querySelector('.favorite-tab');
    let favorites = getFavorites();
    if (favorites.find(fav => fav.id === tabId)) {
      favoriteElement.classList.add('favorited');
      favoriteElement.querySelector('.star-icon').setAttribute('fill', 'currentColor');
    } else {
      favoriteElement.classList.remove('favorited');
      favoriteElement.querySelector('.star-icon').removeAttribute('fill');
    }
  }
}
function toggleFavorite(tabId, title, url, favoriteElement) {
  let favorites = getFavorites();
  const index = favorites.findIndex(fav => fav.id === tabId);
  if (index === -1) {
    favorites.push({ id: tabId, title: title, url: url });
  } else {
    favorites.splice(index, 1);
  }
  saveFavorites(favorites);
  updateFavoriteIcon(tabId);
  if(window.updateHomepageFavorites) window.updateHomepageFavorites();
}

document.addEventListener('DOMContentLoaded', () => {
  setupWindowControls();
  setupNavBarButtons();
  setupTabBar();
  window.api.getSavedTabs().then(state => {
    if (state.tabs && state.tabs.length > 0) {
      state.tabs.forEach(tabState => {
        createNewTab(tabState.url, tabState.id);
      });
      if (state.currentTabId) {
        switchTab(state.currentTabId);
      } else {
        switchTab(state.tabs[0].id);
      }
    } else {
      createNewTab();
    }
  });
  document.getElementById('incognito-btn')?.addEventListener('click', () => {
    window.api.openIncognito();
  });
  document.getElementById('reopen-tab-btn')?.addEventListener('click', () => {
    if (closedTabs.length > 0) {
      const lastClosed = closedTabs.pop();
      createNewTab(lastClosed.url);
    }
  });
});

function setupWindowControls() {
  document.getElementById('min-btn')?.addEventListener('click', () => {
    window.api.windowControl('minimize');
  });
  document.getElementById('max-btn')?.addEventListener('click', () => {
    window.api.windowControl('maximize');
  });
  document.getElementById('close-btn')?.addEventListener('click', () => {
    window.api.windowControl('close');
  });
  document.getElementById('settings')?.addEventListener('click', () => {
    window.api.openSettings();
  });
  document.getElementById('back')?.addEventListener('click', () => {
    const webview = getCurrentWebview();
    if (webview && webview.canGoBack()) webview.goBack();
  });
  document.getElementById('forward')?.addEventListener('click', () => {
    const webview = getCurrentWebview();
    if (webview && webview.canGoForward()) webview.goForward();
  });
  document.getElementById('reload')?.addEventListener('click', () => {
    const webview = getCurrentWebview();
    if (webview) {
      webview.reload();
      document.getElementById('url-bar').classList.add('loading');
    }
  });
  document.getElementById('url-bar')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const newUrl = normalizeUrl(document.getElementById('url-bar').value);
      const webview = getCurrentWebview();
      if (webview) webview.loadURL(newUrl);
    }
  });
}

function setupNavBarButtons() {
  document.getElementById('google-home-btn')?.addEventListener('click', () => {
    const webview = getCurrentWebview();
    if (webview) {
      webview.loadURL('https://www.google.com');
    }
  });
  document.getElementById('login-btn')?.addEventListener('click', () => {
    if (window.api && window.api.openGoogleLogin) {
      window.api.openGoogleLogin();
    }
  });
}

function setupTabBar() {
  const newTabBtn = document.getElementById('new-tab-btn');
  newTabBtn?.addEventListener('click', () => {
    createNewTab();
  });
}

function createNewTab(url = 'homepage.html', providedTabId = null) {
  const tabId = providedTabId || 'tab-' + Date.now();
  const webviewContainer = document.getElementById('webview-container');
  const tabBar = document.getElementById('tab-bar');

  const tabButton = document.createElement('div');
  tabButton.className = 'tab-btn';
  tabButton.id = 'btn-' + tabId;
  tabButton.style['-webkit-app-region'] = 'no-drag';

  const titleSpan = document.createElement('span');
  titleSpan.className = 'tab-title';
  titleSpan.innerText = 'Nova Aba';

  const favoriteIcon = document.createElement('span');
  favoriteIcon.className = 'favorite-tab';
  favoriteIcon.setAttribute('data-tabid', tabId);
  favoriteIcon.title = 'Favoritar';
  favoriteIcon.innerHTML = `
    <svg class="star-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
    </svg>`;

  const closeIcon = document.createElement('span');
  closeIcon.className = 'close-tab';
  closeIcon.setAttribute('data-tabid', tabId);
  closeIcon.innerText = 'x';

  tabButton.appendChild(titleSpan);
  tabButton.appendChild(favoriteIcon);
  tabButton.appendChild(closeIcon);

  tabButton.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-tab')) {
      closeTab(tabId);
      e.stopPropagation();
      return;
    }
    if (e.target.closest('.favorite-tab')) {
      toggleFavorite(tabId, titleSpan.innerText, url, favoriteIcon);
      e.stopPropagation();
      return;
    }
    switchTab(tabId);
  });
  tabBar.insertBefore(tabButton, document.getElementById('new-tab-btn'));

  const webview = document.createElement('webview');
  webview.id = tabId;
  webview.src = url;
  webview.setAttribute('preload', 'preload.js');
  webview.setAttribute('webpreferences', 'nodeIntegration=no, contextIsolation=yes, javascript=yes, webSecurity=yes');
  webview.style.width = '100%';
  webview.style.height = '100%';
  webview.style.display = 'none';

  // Permite o menu de contexto padrão (para inspecionar, copiar, etc.)
  webview.addEventListener('contextmenu', (e) => {
    // Não previne o comportamento padrão
  });

  webview.addEventListener('new-window', (e) => {
    createNewTab(e.url);
  });
  webview.addEventListener('did-navigate', async (e) => {
    if (tabId === currentTabId) {
      document.getElementById('url-bar').value = e.url;
    }
    const warningEnabled = await window.api.getMaliciousWarning();
    if (warningEnabled && e.url.includes("malicious.com")) {
       alert("Aviso: Este site pode ser malicioso!");
    }
  });
  const tabData = { id: tabId, customName: null };
  webview.addEventListener('page-title-updated', (e) => {
    if (!tabData.customName) {
      titleSpan.innerText = e.title;
    }
  });
  webview.addEventListener('did-start-loading', () => {
    document.getElementById('url-bar').classList.add('loading');
    document.getElementById('reload').classList.add('spin');
  });
  webview.addEventListener('did-stop-loading', () => {
    document.getElementById('url-bar').classList.remove('loading');
    document.getElementById('reload').classList.remove('spin');
    if (tabId === currentTabId) {
      document.getElementById('url-bar').value = webview.getURL();
    }
  });

  webviewContainer.appendChild(webview);
  tabs.push({ id: tabId, button: tabButton, webview: webview, data: tabData });
  updateFavoriteIcon(tabId);
  switchTab(tabId);
  updateTabsState();
}

function switchTab(tabId) {
  tabs.forEach(tab => {
    tab.webview.style.display = 'none';
    tab.button.classList.remove('active-tab');
  });
  const tab = tabs.find(t => t.id === tabId);
  if (tab) {
    tab.webview.style.display = 'flex';
    tab.button.classList.add('active-tab');
    currentTabId = tabId;
    document.getElementById('url-bar').value = tab.webview.getURL();
  }
  updateTabsState();
}

function closeTab(tabId) {
  const tabIndex = tabs.findIndex(t => t.id === tabId);
  if (tabIndex > -1) {
    const tab = tabs[tabIndex];
    tab.button.remove();
    tab.webview.remove();
    closedTabs.push({ url: tab.webview.src });
    tabs.splice(tabIndex, 1);
    if (currentTabId === tabId) {
      if (tabs.length > 0) {
        switchTab(tabs[0].id);
      } else {
        currentTabId = null;
        document.getElementById('url-bar').value = "";
      }
    }
    updateTabsState();
  }
}

function getCurrentWebview() {
  const tab = tabs.find(t => t.id === currentTabId);
  return tab ? tab.webview : null;
}

function normalizeUrl(input) {
  const url = input.trim();
  if (/^(https?:\/\/)/i.test(url)) return url;
  if (/^[a-z0-9-]+(\.[a-z]{2,})+$/i.test(url)) return `https://${url}`;
  return defaultSearchEngine + encodeURIComponent(url);
}

function updateTabsState() {
  const tabsState = tabs.map(tab => ({ id: tab.id, url: tab.webview.src }));
  window.api.updateTabs(tabsState, currentTabId);
}
