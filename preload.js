const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('api', {
  windowControl: (action) => ipcRenderer.send('window-control', action),
  openSettings: () => ipcRenderer.send('open-settings'),
  openExternal: (url) => shell.openExternal(url),
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
  },
  openGoogleLogin: () => ipcRenderer.send('open-google-login'),
  getThemeSettings: () => ipcRenderer.invoke('get-theme-settings'),
  updateTabs: (tabs, currentTabId) => ipcRenderer.send('update-tabs', tabs, currentTabId),
  getSavedTabs: () => ipcRenderer.invoke('get-saved-tabs'),
  openAITab: () => ipcRenderer.sendToHost('open-ai-tab'),
  // Novas funções para notificações e tradutor
  openNotifications: () => ipcRenderer.send('open-notifications'),
  openTranslator: () => ipcRenderer.send('open-translator'),
  getMaliciousWarning: () => ipcRenderer.invoke('get-malicious-warning'),
  getRenameTab: () => ipcRenderer.invoke('get-rename-tab'),
  // Para atualização do ícone de favorito (se necessário)
  updateFavoriteIcon: (tabId) => ipcRenderer.send('update-favorite-icon', tabId)
});

// REMOVIDO: Bloqueio do botão direito para permitir o menu de contexto nativo.
// window.addEventListener('contextmenu', (e) => {
//   e.preventDefault();
//   window.api.openContextMenu(e.x, e.y);
// });
