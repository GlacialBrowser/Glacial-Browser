const webview = document.getElementById('webview');
const urlBar = document.getElementById('url-bar');
let autoSkipAds = false;

document.addEventListener('DOMContentLoaded', () => {
  setupWindowControls();
  setupNavigation();
  setupWebview();
  setupUrlBar();
});


function setupWindowControls() {
  document.getElementById('min-btn').addEventListener('click', () => {
    window.api.windowControl('minimize');
  });
  document.getElementById('max-btn').addEventListener('click', () => {
    window.api.windowControl('maximize');
  });
  document.getElementById('close-btn').addEventListener('click', () => {
    window.api.windowControl('close');
  });
  document.getElementById('settings').addEventListener('click', () => {
    window.api.openSettings();
  });
}


function setupNavigation() {
  const updateNavButtons = () => {
    document.getElementById('back').disabled = !webview.canGoBack();
    document.getElementById('forward').disabled = !webview.canGoForward();
  };

  webview.addEventListener('did-navigate', updateNavButtons);
  webview.addEventListener('did-navigate-in-page', updateNavButtons);

  document.getElementById('back').addEventListener('click', () => webview.goBack());
  document.getElementById('forward').addEventListener('click', () => webview.goForward());
  document.getElementById('reload').addEventListener('click', () => {
    webview.reload();
    urlBar.classList.add('loading');
  });
}


function setupWebview() {
  const modernUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
  webview.setAttribute('useragent', modernUserAgent);

  webview.addEventListener('did-start-loading', () => {
    urlBar.classList.add('loading');
    document.getElementById('reload').classList.add('spin');
  });

  webview.addEventListener('did-stop-loading', () => {
    urlBar.classList.remove('loading');
    document.getElementById('reload').classList.remove('spin');
  });

  webview.addEventListener('did-navigate', (e) => {
    urlBar.value = e.url;
  });

  webview.addEventListener('did-fail-load', (e) => {
    console.error('Erro de carregamento:', e);
    if (!e.validatedURL.includes('google.com')) {
      webview.src = `https://downforeveryoneorjustme.com/${encodeURIComponent(e.validatedURL)}`;
    }
  });

 
  webview.addEventListener('dom-ready', async () => {
    await webview.executeJavaScript(`
      delete navigator.__proto__.webdriver;
      Object.defineProperty(navigator, 'userAgent', {
        value: '${modernUserAgent}',
        configurable: false,
        writable: false
      });
    `);

   
    const currentUrl = webview.getURL();
    if (autoSkipAds && currentUrl.includes('youtube.com')) {
      injectAdSkipScript();
    }
  });


  webview.addEventListener('will-navigate', (event) => {
    if (event.url.includes('accounts.google.com')) {
      event.preventDefault();
      window.api.openExternal(event.url);
    }
  });


  webview.addEventListener('new-window', (event) => {
    if (event.url.includes('accounts.google.com')) {
      event.preventDefault();
      window.api.openExternal(event.url);
    } else {
  
      webview.loadURL(event.url);
    }
  });

 
  window.api.receive('toggle-auto-skip', (event, enable) => {
    autoSkipAds = enable;
    const currentUrl = webview.getURL();
    if (autoSkipAds && currentUrl.includes('youtube.com')) {
      injectAdSkipScript();
    }
  });
}


function injectAdSkipScript() {
  webview.executeJavaScript(`
    console.log('Injetando script para pular anúncios no YouTube...');
    setInterval(() => {
      const skipBtn = document.querySelector('.ytp-ad-skip-button');
      if (skipBtn) {
        skipBtn.click();
      }
    }, 1000);
  `);
}


function setupUrlBar() {
  urlBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const newUrl = normalizeUrl(urlBar.value);
      webview.src = newUrl;
    }
  });
  urlBar.addEventListener('click', () => urlBar.select());
}


function normalizeUrl(input) {
  const url = input.trim().toLowerCase();
  if (/^(?:https?|ftp):\/\//i.test(url)) return url;
  if (/^[a-z0-9-]+(\.[a-z]{2,})+$/i.test(url)) return `https://${url}`;
  return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
}
