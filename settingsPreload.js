const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsApi', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setAdblock: (enable) => ipcRenderer.send('toggle-adblock', enable),
  setSkipAds: (enable) => ipcRenderer.send('toggle-auto-skip', enable),
});
