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
      channels.updateStatus
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
      channels.setFontColor
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
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
});
