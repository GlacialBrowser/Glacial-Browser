const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('api', {
  windowControl: (action) => ipcRenderer.send('window-control', action),
  openSettings: () => ipcRenderer.send('open-settings'),
  openExternal: (url) => shell.openExternal(url),
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
  },
});
