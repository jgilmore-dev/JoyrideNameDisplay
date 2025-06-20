// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

// A secure API for the renderer process to communicate with the main process.
contextBridge.exposeInMainWorld('electronAPI', {
  // Main -> Renderer (one-way)
  on: (channel, callback) => {
    const validChannels = ['display-name', 'clear-name', 'set-banner-number-visibility', 'slideshow-updated', 'set-slide'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  // Renderer -> Main (one-way)
  send: (channel, ...args) => {
    const validChannels = ['toggle-banner-number', 'renderer-ready'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },

  // Renderer -> Main -> Renderer (two-way)
  invoke: (channel, ...args) => {
    const validChannels = [
      'load-csv',
      'get-members',
      'add-member',
      'update-member',
      'mark-as-displayed',
      'import-images',
      'get-slideshow-images',
      'clear-slideshow-cache',
      'get-current-slide-index',
      'banner-display', // Moving these to invoke for better flow control
      'banner-clear',
      'get-settings',
      'save-settings',
      'apply-display-settings',
      'get-available-displays',
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
});
