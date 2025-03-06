const { app, BrowserWindow, ipcMain, session, Menu, MenuItem } = require('electron');
const path = require('path');
const fs = require('fs');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');

let mainWindow;
let settingsWindow;
let blocker;

const configPath = path.join(app.getPath('userData'), 'config.json');

let config = {
  adblockEnabled: false,
  autoSkipAds: false,
  homepageBackground: "#1a1a1a",
  homepageBackgroundImage: "3.png", // Background padrão
  theme: "dark",
  tabs: [],
  currentTabId: null,
  maliciousWarningEnabled: false,
  renameTabEnabled: false,
  vpnEnabled: false
};

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(data);
    } else {
      // Cria uma aba default se não existir arquivo de configuração
      config.tabs = [{ id: 'tab-' + Date.now(), url: 'homepage.html' }];
      config.currentTabId = config.tabs[0].id;
      saveConfig();
    }
  } catch (e) {
    console.error("Erro ao carregar config:", e);
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config));
  } catch (e) {
    console.error("Erro ao salvar config:", e);
  }
}

loadConfig();

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
    if (config.adblockEnabled) {
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

  ipcMain.handle('get-settings', () => {
    return { 
      adblockEnabled: config.adblockEnabled, 
      autoSkipAds: config.autoSkipAds,
      maliciousWarningEnabled: config.maliciousWarningEnabled,
      renameTabEnabled: config.renameTabEnabled,
      vpnEnabled: config.vpnEnabled
    };
  });

  ipcMain.on('toggle-adblock', (event, enable) => {
    config.adblockEnabled = enable;
    if (blocker) {
      if (enable) {
        blocker.enableBlockingInSession(mainWindow.webContents.session);
      } else {
        blocker.disableBlockingInSession(mainWindow.webContents.session);
      }
    }
    saveConfig();
  });

  ipcMain.on('toggle-auto-skip', (event, enable) => {
    config.autoSkipAds = enable;
    if (mainWindow) {
      mainWindow.webContents.send('toggle-auto-skip', config.autoSkipAds);
    }
    saveConfig();
  });

  ipcMain.handle('get-theme-settings', () => {
    return { 
      homepageBackground: config.homepageBackground, 
      homepageBackgroundImage: config.homepageBackgroundImage,
      theme: config.theme 
    };
  });

  ipcMain.on('set-homepage-background', (event, color) => {
    config.homepageBackground = color;
    saveConfig();
  });

  ipcMain.on('set-homepage-background-image', (event, imageUrl) => {
    config.homepageBackgroundImage = imageUrl;
    saveConfig();
  });

  ipcMain.on('set-theme', (event, value) => {
    config.theme = value;
    saveConfig();
  });

  ipcMain.on('update-tabs', (event, tabs, currentTabId) => {
    config.tabs = tabs;
    config.currentTabId = currentTabId;
    saveConfig();
  });

  ipcMain.handle('get-saved-tabs', () => {
    return { tabs: config.tabs, currentTabId: config.currentTabId };
  });

  ipcMain.on('open-google-login', () => {
    let loginWindow = new BrowserWindow({
      width: 500,
      height: 600,
      parent: mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    loginWindow.loadURL('https://accounts.google.com/');
    loginWindow.on('closed', () => {
      loginWindow = null;
    });
  });

  // Incognito navigation
  ipcMain.on('open-incognito', () => {
    const incognitoSession = session.fromPartition('incognito' + Date.now());
    let incognitoWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        session: incognitoSession,
        nodeIntegration: false,
        contextIsolation: true,
        webviewTag: true,
      }
    });
    incognitoWindow.loadFile('index.html');
  });

  // Handler para abrir a janela do tradutor
  ipcMain.on('open-translator', () => {
    let translatorWindow = new BrowserWindow({
      width: 800,
      height: 600,
      parent: mainWindow,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });
    translatorWindow.loadURL('https://translate.google.com');
  });

  // Handler para abrir a janela de notificações
  ipcMain.on('open-notifications', () => {
    let notificationsWindow = new BrowserWindow({
      width: 400,
      height: 600,
      parent: mainWindow,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });
    notificationsWindow.loadFile('notifications.html');
  });

  // VPN settings
  ipcMain.handle('get-vpn', () => {
    return config.vpnEnabled;
  });
  ipcMain.on('toggle-vpn', (event, enable) => {
    config.vpnEnabled = enable;
    if (mainWindow) {
      if (enable) {
        mainWindow.webContents.session.setProxy({ proxyRules: 'http=proxy.example.com:8080;https=proxy.example.com:8080' });
      } else {
        mainWindow.webContents.session.setProxy({ proxyRules: '' });
      }
    }
    saveConfig();
  });
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 500,
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

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
