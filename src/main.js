const { app, BrowserWindow, ipcMain, session, protocol, screen } = require('electron');
const path = require('node:path');
const fs = require('fs');
const fetch = require('node-fetch');
const dataSource = require('./dataSource');
const mediaManager = require('./mediaManager');
const BannerManager = require('./bannerManager');
const configManager = require('./config/configManager');
const ControlPanelUpdater = require('./controlPanelUpdater');
const WebServer = require('./webServer');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let controlPanelWindow;
const bannerManager = new BannerManager();
let controlPanelUpdater;
let webServer;

// Slideshow Conductor
let slideshowInterval;
let currentSlideIndex = 0;

function startSlideshow() {
  stopSlideshow(); // Stop any existing interval

  const imageCount = mediaManager.getSlideshowImageCount();
  if (imageCount === 0) return; // Don't start if no images

  const slideshowConfig = configManager.getSlideshowConfig();
  slideshowInterval = setInterval(() => {
    currentSlideIndex = (currentSlideIndex + 1) % imageCount;
    console.log(`[Main Process] Broadcasting set-slide, index: ${currentSlideIndex}`);
    const channels = configManager.getIpcChannels();
    bannerManager.broadcastToBanners(channels.setSlide, currentSlideIndex);
    
    // Broadcast to Pi displays
    if (webServer && webServer.isRunning) {
      webServer.broadcastSlideshowUpdate(currentSlideIndex);
    }
  }, slideshowConfig.interval);
}

function stopSlideshow() {
  if (slideshowInterval) {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
  }
}

const createWindows = () => {
  // Load settings before creating windows
  bannerManager.loadSettings();
  console.log('Creating windows with settings:', bannerManager.getSettings());

  // Determine icon path - use PNG as fallback if ICO doesn't exist
  const assetsDir = path.join(__dirname, 'assets/icons');
  let iconPath = path.join(assetsDir, 'MemberNameDisplayLogo.png');
  if (!fs.existsSync(iconPath)) {
    iconPath = fs.existsSync(path.join(assetsDir, 'app-icon.ico'))
      ? path.join(assetsDir, 'app-icon.ico')
      : path.join(assetsDir, 'app-icon-512.png');
  }
  
  console.log('Assets directory exists:', fs.existsSync(assetsDir));
  console.log('Using icon path:', iconPath);
  if (iconPath) {
    console.log('Icon file exists:', fs.existsSync(iconPath));
  }

  // Control Panel Window
  const windowConfig = configManager.getWindowConfig().controlPanel;
  const controlPanelConfig = {
    width: windowConfig.width,
    height: windowConfig.height,
    minWidth: windowConfig.minWidth,
    minHeight: windowConfig.minHeight,
    webPreferences: {
      preload: RENDERER_PRELOAD_WEBPACK_ENTRY,
    },
    title: 'Member Name Display Control Panel',
  };
  
  // Only add icon if we have a valid path
  if (iconPath && fs.existsSync(iconPath)) {
    controlPanelConfig.icon = iconPath;
  }
  
  controlPanelWindow = new BrowserWindow(controlPanelConfig);
  controlPanelWindow.loadURL(RENDERER_WEBPACK_ENTRY);
  
  // Make main window globally accessible for update broadcasts
  global.mainWindow = controlPanelWindow;
  
  const devConfig = configManager.getDevelopmentConfig();
  if (!app.isPackaged && devConfig.devTools.openOnStart) {
    controlPanelWindow.webContents.openDevTools({ mode: devConfig.devTools.mode });
  }

  // Create banner windows using BannerManager
  bannerManager.createAllBanners();
  
  // Set callback for when all banner windows are ready
  bannerManager.setOnAllWindowsReady(() => {
    startSlideshow();
  });
};

// IPC Handlers
const channels = configManager.getIpcChannels();

ipcMain.handle(channels.bannerDisplay, (event, { banner, nameData }) => {
  bannerManager.sendToBanner(banner, channels.displayName, nameData);
  
  // Broadcast to Pi displays
  if (webServer && webServer.isRunning) {
    webServer.broadcastNameDisplay(nameData);
  }
});

ipcMain.handle(channels.bannerClear, (event, { banner }) => {
  bannerManager.sendToBanner(banner, channels.clearName);
  
  // Broadcast to Pi displays
  if (webServer && webServer.isRunning) {
    webServer.broadcastNameClear();
  }
});

ipcMain.on(channels.rendererReady, (event) => {
  bannerManager.handleRendererReady();
});

// Settings IPC handlers
ipcMain.handle(channels.getSettings, () => {
  return bannerManager.getSettings();
});

ipcMain.handle(channels.getAvailableDisplays, () => {
  return bannerManager.getAvailableDisplays();
});

ipcMain.handle(channels.saveSettings, (event, settings) => {
  bannerManager.saveSettings(settings);
  return true;
});

ipcMain.handle(channels.applyDisplaySettings, async (event, settings) => {
  console.log('Applying display settings:', settings);
  
  // Update settings and recreate banners if needed
  bannerManager.updateSettings(settings);
  
  // Save settings to file after updating
  bannerManager.saveSettings(settings);
  
  // Restart slideshow with new configuration
  setTimeout(() => {
    startSlideshow();
  }, 1000);

  return true;
});

// Data source IPC handlers
ipcMain.handle(channels.loadCsv, async () => {
  const result = await dataSource.loadDataFromCsv();
  return result;
});

ipcMain.handle(channels.getMembers, () => {
  return dataSource.getMembers();
});

ipcMain.handle(channels.addMember, (event, newMember) => {
  return dataSource.addMember(newMember);
});

ipcMain.handle(channels.updateMember, (event, updatedMember) => {
  return dataSource.updateMember(updatedMember);
});

ipcMain.handle(channels.markAsDisplayed, (event, memberId) => {
  return dataSource.markAsDisplayed(memberId);
});

// Media Manager IPC handlers
ipcMain.handle(channels.importImages, async () => {
  const newImages = await mediaManager.importSlideshowImages(controlPanelWindow);
  if (newImages && newImages.length > 0) {
    // Notify banner windows that the slides have changed and restart the slideshow
    bannerManager.broadcastToBanners(channels.slideshowUpdated);
    startSlideshow();
  }
  return newImages; // Return only the newly added images
});

ipcMain.handle(channels.getSlideshowImages, () => {
  return mediaManager.getSlideshowImages();
});

ipcMain.handle(channels.clearSlideshowCache, async () => {
  mediaManager.clearSlideshowCache();
  // Notify banners that the slideshow is now empty
  bannerManager.broadcastToBanners(channels.slideshowUpdated);
  stopSlideshow();
  currentSlideIndex = 0;
});

// UI Toggles
ipcMain.on(channels.toggleBannerNumber, (event, { isVisible }) => {
  bannerManager.broadcastToBanners(channels.setBannerNumberVisibility, isVisible);
});

ipcMain.on(channels.updateFontColor, (event, fontColor) => {
  bannerManager.broadcastToBanners(channels.setFontColor, fontColor);
  
  // Broadcast to Pi displays
  if (webServer && webServer.isRunning) {
    webServer.broadcastFontColorUpdate(fontColor);
  }
});

ipcMain.handle(channels.getCurrentSlideIndex, () => {
  return currentSlideIndex;
});

// Web Server IPC handlers
ipcMain.handle('get-web-server-status', () => {
  return webServer ? webServer.getStatus() : { isRunning: false };
});

ipcMain.handle('restart-web-server', () => {
  if (webServer) {
    webServer.stop();
    setTimeout(() => {
      webServer.start();
    }, 1000);
    return true;
  }
  return false;
});

ipcMain.handle('get-connected-pi-count', () => {
  return webServer ? webServer.connectedClients.size : 0;
});

// Pi Client Management IPC handlers
ipcMain.handle('scan-pi-clients', async () => {
  try {
    const clients = [];
    
    // Get local IP address
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let localIP = '127.0.0.1';
    
    for (const name of Object.keys(interfaces)) {
      for (const interface of interfaces[name]) {
        if (interface.family === 'IPv4' && !interface.internal) {
          localIP = interface.address;
          break;
        }
      }
      if (localIP !== '127.0.0.1') break;
    }
    
    // Scan local network for Pi clients
    const baseIP = localIP.substring(0, localIP.lastIndexOf('.'));
    const promises = [];
    
    for (let i = 1; i <= 50; i++) {
      const testIP = `${baseIP}.${i}`;
      promises.push(scanPiClient(testIP));
    }
    
    const results = await Promise.all(promises);
    return results.filter(client => client !== null);
  } catch (error) {
    console.error('Error scanning for Pi clients:', error);
    return [];
  }
});

ipcMain.handle('get-pi-client-details', async (event, client) => {
  try {
    const response = await fetch(`http://${client.ip}:3001/health`);
    if (!response.ok) throw new Error('Client not reachable');
    
    const health = await response.json();
    
    // Get channel information
    const channelResponse = await fetch(`http://${client.ip}:3001/update-channel`);
    const channel = channelResponse.ok ? await channelResponse.text() : 'stable';
    
    // Get version information
    const versionResponse = await fetch(`http://${client.ip}:3001/client-version`);
    const currentVersion = versionResponse.ok ? await versionResponse.text() : 'unknown';
    
    // Check for updates
    const updateResponse = await fetch(`http://${client.ip}:3001/check-updates`);
    const updateInfo = updateResponse.ok ? await updateResponse.json() : { updateAvailable: false };
    
    return {
      clientId: health.service || 'unknown',
      channel: channel.trim(),
      currentVersion: currentVersion.trim(),
      latestVersion: updateInfo.latestVersion || 'unknown',
      updateStatus: updateInfo.updateAvailable ? 'update-available' : 'up-to-date',
      updateAvailable: updateInfo.updateAvailable,
      lastCheck: new Date().toISOString(),
      status: 'connected'
    };
  } catch (error) {
    console.error('Error getting Pi client details:', error);
    return {
      clientId: 'unknown',
      channel: 'unknown',
      currentVersion: 'unknown',
      latestVersion: 'unknown',
      updateStatus: 'error',
      updateAvailable: false,
      lastCheck: new Date().toISOString(),
      status: 'disconnected'
    };
  }
});

ipcMain.handle('set-pi-client-channel', async (event, { client, channel }) => {
  try {
    // This would require SSH access to the Pi, which is complex
    // For now, we'll simulate the operation
    console.log(`Setting channel for ${client.ip} to ${channel}`);
    
    // In a real implementation, you would:
    // 1. SSH into the Pi
    // 2. Update the .update-channel file
    // 3. Restart the update service
    
    return { success: true, message: `Channel set to ${channel}` };
  } catch (error) {
    console.error('Error setting Pi client channel:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-pi-client-updates', async (event, client) => {
  try {
    const response = await fetch(`http://${client.ip}:3001/check-updates`);
    if (!response.ok) throw new Error('Failed to check updates');
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking Pi client updates:', error);
    return { updateAvailable: false, error: error.message };
  }
});

ipcMain.handle('perform-pi-client-update', async (event, client) => {
  try {
    const response = await fetch(`http://${client.ip}:3001/perform-update`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to perform update');
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error performing Pi client update:', error);
    return { success: false, error: error.message };
  }
});

// Helper function to scan for Pi clients
async function scanPiClient(ip) {
  try {
    const response = await fetch(`http://${ip}:3001/discovery`, {
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.service === 'MemberNameDisplay' && data.type === 'pi-update-server') {
        // Get basic client info
        const healthResponse = await fetch(`http://${ip}:3001/health`);
        const channelResponse = await fetch(`http://${ip}:3001/update-channel`);
        const versionResponse = await fetch(`http://${ip}:3001/client-version`);
        
        const channel = channelResponse.ok ? await channelResponse.text() : 'stable';
        const version = versionResponse.ok ? await versionResponse.text() : 'unknown';
        
        return {
          ip: ip,
          status: 'connected',
          channel: channel.trim(),
          version: version.trim(),
          lastUpdate: 'Unknown'
        };
      }
    }
  } catch (error) {
    // Silently ignore connection errors
  }
  return null;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Suppress the harmless "Autofill" errors in the console
  app.commandLine.appendSwitch('disable-features', 'AutofillServiceDownIndication');

  // Register a custom protocol to serve media files securely.
  const mediaDir = path.join(app.getPath('userData'), configManager.getPaths().mediaDir);
  protocol.registerFileProtocol('media', (request, callback) => {
    const url = request.url.replace(/^media:\/\//, '');
    const filePath = path.join(mediaDir, url);
    callback({ path: path.normalize(filePath) });
  });

  // Set a Content Security Policy
  const isDev = !app.isPackaged;
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' media:; style-src 'self' 'unsafe-inline'; font-src 'self';"
      : "script-src 'self'; img-src 'self' media:; style-src 'self' 'unsafe-inline'; font-src 'self';";
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });

  mediaManager.loadInitialImages();
  createWindows();

  // Initialize control panel updater
  controlPanelUpdater = new ControlPanelUpdater();

  // Initialize web server for Pi displays
  webServer = new WebServer();
  if (webServer.initialize()) {
    webServer.start();
    console.log('[Main] Web server started for Pi displays');
  } else {
    console.error('[Main] Failed to start web server');
  }

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindows();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Cleanup updaters
    if (controlPanelUpdater) {
      controlPanelUpdater.cleanup();
    }
    
    // Stop web server before quitting
    if (webServer) {
      webServer.stop();
    }
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.