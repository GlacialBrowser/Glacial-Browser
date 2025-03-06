document.addEventListener('DOMContentLoaded', async () => {
  const adblockCheckbox = document.getElementById('adblock-checkbox');
  const skipAdsCheckbox = document.getElementById('skipads-checkbox');
  const maliciousWarningCheckbox = document.getElementById('malicious-warning-checkbox');
  const renameTabCheckbox = document.getElementById('rename-tab-checkbox');
  const vpnCheckbox = document.getElementById('vpn-checkbox');
  const backgroundInput = document.getElementById('background-input');
  const backgroundImageInput = document.getElementById('background-image-input');
  const themeSelect = document.getElementById('theme-select');

  // Carrega configurações básicas (Adblock, pular anúncios, aviso malicioso, renomear aba, VPN)
  const settings = await window.settingsApi.getSettings();
  adblockCheckbox.checked = settings.adblockEnabled;
  skipAdsCheckbox.checked = settings.autoSkipAds;
  maliciousWarningCheckbox.checked = settings.maliciousWarningEnabled;
  renameTabCheckbox.checked = settings.renameTabEnabled;
  vpnCheckbox.checked = settings.vpnEnabled;

  // Carrega as configurações de tema
  const themeSettings = await window.settingsApi.getThemeSettings();
  backgroundInput.value = themeSettings.homepageBackground;
  backgroundImageInput.value = themeSettings.homepageBackgroundImage;
  themeSelect.value = themeSettings.theme;

  adblockCheckbox.addEventListener('change', () => {
    window.settingsApi.setAdblock(adblockCheckbox.checked);
  });

  skipAdsCheckbox.addEventListener('change', () => {
    window.settingsApi.setSkipAds(skipAdsCheckbox.checked);
  });

  maliciousWarningCheckbox.addEventListener('change', () => {
    window.settingsApi.setMaliciousWarning(maliciousWarningCheckbox.checked);
  });

  renameTabCheckbox.addEventListener('change', () => {
    window.settingsApi.setRenameTab(renameTabCheckbox.checked);
  });

  vpnCheckbox.addEventListener('change', () => {
    window.settingsApi.setVPN(vpnCheckbox.checked);
  });

  backgroundInput.addEventListener('change', () => {
    window.settingsApi.setHomepageBackground(backgroundInput.value);
  });

  backgroundImageInput.addEventListener('change', () => {
    window.settingsApi.setHomepageBackgroundImage(backgroundImageInput.value);
  });

  themeSelect.addEventListener('change', () => {
    window.settingsApi.setTheme(themeSelect.value);
  });
});
