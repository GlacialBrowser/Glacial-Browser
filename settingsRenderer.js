document.addEventListener('DOMContentLoaded', async () => {
    const adblockCheckbox = document.getElementById('adblock-checkbox');
    const skipAdsCheckbox = document.getElementById('skipads-checkbox');
  
    const settings = await window.settingsApi.getSettings();
    adblockCheckbox.checked = settings.adblockEnabled;
    skipAdsCheckbox.checked = settings.autoSkipAds;
  
    adblockCheckbox.addEventListener('change', () => {
      window.settingsApi.setAdblock(adblockCheckbox.checked);
    });
  
    skipAdsCheckbox.addEventListener('change', () => {
      window.settingsApi.setSkipAds(skipAdsCheckbox.checked);
    });
  });
  