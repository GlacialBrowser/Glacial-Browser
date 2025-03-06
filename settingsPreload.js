const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsApi', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setAdblock: (enable) => ipcRenderer.send('toggle-adblock', enable),
  setSkipAds: (enable) => ipcRenderer.send('toggle-auto-skip', enable),
  getThemeSettings: () => ipcRenderer.invoke('get-theme-settings'),
  setHomepageBackground: (color) => ipcRenderer.send('set-homepage-background', color),
  setHomepageBackgroundImage: (imageUrl) => ipcRenderer.send('set-homepage-background-image', imageUrl),
  setTheme: (value) => ipcRenderer.send('set-theme', value),
  getMaliciousWarning: () => ipcRenderer.invoke('get-malicious-warning'),
  setMaliciousWarning: (enable) => ipcRenderer.send('toggle-malicious-warning', enable),
  getRenameTab: () => ipcRenderer.invoke('get-rename-tab'),
  setRenameTab: (enable) => ipcRenderer.send('toggle-rename-tab', enable),
  getVPN: () => ipcRenderer.invoke('get-vpn'),
  setVPN: (enable) => ipcRenderer.send('toggle-vpn', enable),
});
