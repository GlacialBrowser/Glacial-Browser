const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');

let mainWindow;
let settingsWindow;
let blocker;


let adblockEnabled = false;
let autoSkipAds = false;


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, 
    },
  });

  mainWindow.loadFile('index.html');

 
  ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((b) => {
    blocker = b;
    if (adblockEnabled) {
      blocker.enableBlockingInSession(mainWindow.webContents.session);
    }
  });


  ipcMain.on('window-control', (event, arg) => {
    if (arg === 'minimize') mainWindow.minimize();
    if (arg === 'maximize') {
      mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
    }
    if (arg === 'close') mainWindow.close();
  });


  ipcMain.on('open-settings', () => {
    if (!settingsWindow) {
      createSettingsWindow();
    } else {
      settingsWindow.show();
    }
  });
}


function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 300,
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'settingsPreload.js'),
      contextIsolation: true,
    },
  });

  settingsWindow.loadFile('settings.html');

  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}


ipcMain.handle('get-settings', () => {
  return { adblockEnabled, autoSkipAds };
});

ipcMain.on('toggle-adblock', (event, enable) => {
  adblockEnabled = enable;
  if (blocker) {
    if (enable) {
      blocker.enableBlockingInSession(mainWindow.webContents.session);
    } else {
      blocker.disableBlockingInSession(mainWindow.webContents.session);
    }
  }
});

ipcMain.on('toggle-auto-skip', (event, enable) => {
  autoSkipAds = enable;
  if (mainWindow) {
    mainWindow.webContents.send('toggle-auto-skip', autoSkipAds);
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
