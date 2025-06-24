// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

// Import configuration for IPC channel names
const configManager = require('./config/configManager');

// Get IPC channels from configuration
const channels = configManager.getIpcChannels();

// A secure API for the renderer process to communicate with the main process.
contextBridge.exposeInMainWorld('electronAPI', {
  // Main -> Renderer (one-way)
  on: (channel, callback) => {
    const validChannels = [
      channels.displayName,
      channels.clearName,
      channels.setBannerNumberVisibility,
      channels.slideshowUpdated,
      channels.setSlide,
      channels.setFontColor,
      channels.updateStatus,
      'update-status-changed'
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  // Remove all listeners for a specific channel
  removeAllListeners: (channel) => {
    const validChannels = [
      channels.displayName,
      channels.clearName,
      channels.setBannerNumberVisibility,
      channels.slideshowUpdated,
      channels.setSlide,
      channels.setFontColor,
      'update-status-changed'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },

  // Renderer -> Main (one-way)
  send: (channel, ...args) => {
    const validChannels = [
      channels.toggleBannerNumber,
      channels.rendererReady,
      channels.updateFontColor
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },

  // Renderer -> Main -> Renderer (two-way)
  invoke: (channel, ...args) => {
    const validChannels = [
      channels.loadCsv,
      channels.getMembers,
      channels.addMember,
      channels.updateMember,
      channels.markAsDisplayed,
      channels.importImages,
      channels.getSlideshowImages,
      channels.clearSlideshowCache,
      channels.getCurrentSlideIndex,
      channels.bannerDisplay,
      channels.bannerClear,
      channels.getSettings,
      channels.saveSettings,
      channels.applyDisplaySettings,
      channels.getAvailableDisplays,
      channels.checkForUpdates,
      channels.downloadUpdate,
      channels.installUpdate,
      channels.getUpdateStatus,
      // Additional channels used by components
      'get-update-status',
      'get-update-channel',
      'set-update-channel',
      'check-for-updates',
      'download-update',
      'install-update',
      'open-github-releases',
      'get-all-queues',
      'display-next-from-queue',
      'clear-current-display',
      'remove-from-queue',
      'move-up-in-queue',
      'move-down-in-queue',
      'move-to-banner',
      'clear-queue',
      'clear-all-queues',
      'get-pi-system-status',
      'enable-pi-system',
      'disable-pi-system',
      'restart-pi-system',
      'scan-pi-clients',
      'get-pi-client-details',
      'add-to-queue',
      'get-slideshow-status',
      'load-csv',
      'banner-display',
      'banner-clear',
      'import-images',
      'clear-slideshow-cache',
      'apply-display-settings',
      'set-slideshow-interval'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
});
