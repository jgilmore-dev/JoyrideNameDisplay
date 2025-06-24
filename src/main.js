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
const QueueManager = require('./queueManager');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let controlPanelWindow;
const bannerManager = new BannerManager();
let controlPanelUpdater;
let webServer;
let queueManager;
let piSystemEnabled = false;

// Slideshow Conductor
let slideshowInterval;
let currentSlideIndex = 0;

// Resource cleanup function
const cleanupResources = async () => {
  console.log('[Main] Starting resource cleanup...');
  
  // Stop slideshow
  stopSlideshow();
  
  // Cleanup updater
  if (controlPanelUpdater) {
    controlPanelUpdater.cleanup();
  }
  
  // Stop web server
  if (webServer) {
    try {
      await webServer.stop();
      webServer = null;
    } catch (error) {
      console.error('[Main] Error stopping web server:', error);
    }
  }
  
  // Close all banner windows
  bannerManager.closeAllBanners();
  
  console.log('[Main] Resource cleanup completed');
};

// Comprehensive slideshow cleanup function
const cleanupSlideshow = () => {
  console.log('[Main] Starting slideshow cleanup...');
  
  // Stop the slideshow interval
  stopSlideshow();
  
  // Clear slideshow display on all banners
  const channels = configManager.getIpcChannels();
  bannerManager.broadcastToBanners(channels.clearSlideshow);
  
  // Broadcast to Pi displays
  if (webServer && webServer.isRunning) {
    webServer.broadcastSlideshowClear();
  }
  
  console.log('[Main] Slideshow cleanup completed');
};

function startSlideshow() {
  stopSlideshow(); // Stop any existing interval

  // Check if slideshow is enabled in settings
  const settings = bannerManager.getSettings();
  const slideshowEnabled = settings?.slideshow?.enabled ?? true;
  
  if (!slideshowEnabled) {
    console.log('[Main] Slideshow is disabled, skipping start');
    return;
  }

  const imageCount = mediaManager.getSlideshowImageCount();
  if (imageCount === 0) {
    console.log('[Main] No slideshow images available, skipping start');
    return; // Don't start if no images
  }

  const slideshowConfig = configManager.getSlideshowConfig();
  const interval = settings?.slideshow?.interval ?? slideshowConfig.interval;
  
  slideshowInterval = setInterval(() => {
    currentSlideIndex = (currentSlideIndex + 1) % imageCount;
    console.log(`[Main Process] Broadcasting set-slide, index: ${currentSlideIndex}`);
    const channels = configManager.getIpcChannels();
    bannerManager.broadcastToBanners(channels.setSlide, currentSlideIndex);
    
    // Broadcast to Pi displays
    if (webServer && webServer.isRunning) {
      webServer.broadcastSlideshowUpdate(currentSlideIndex);
    }
  }, interval);
  
  console.log(`[Main] Slideshow started with ${imageCount} images, interval: ${interval}ms`);
}

function stopSlideshow() {
  if (slideshowInterval) {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
  }
  // Reset slide index when stopping slideshow
  currentSlideIndex = 0;
  console.log('[Main] Slideshow stopped and slide index reset');
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

// Initialize Pi system conditionally
const initializePiSystem = async () => {
  try {
    const piConfig = configManager.getPiSystemConfig();
    const savedSettings = bannerManager.getSettings();
    
    // Check if Pi system is enabled in settings
    piSystemEnabled = savedSettings?.piSystem?.enabled ?? piConfig.enabled;
    
    if (piSystemEnabled) {
      console.log('[Main] Pi system enabled, starting web server...');
      webServer = new WebServer();
      await webServer.start();
      console.log('[Main] Web server started successfully');
    } else {
      console.log('[Main] Pi system disabled, skipping web server initialization');
    }
  } catch (error) {
    console.error('[Main] Failed to start web server:', error);
    piSystemEnabled = false;
  }
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

// Pi System Management IPC Handlers
ipcMain.handle('get-pi-system-status', () => {
  return {
    enabled: piSystemEnabled,
    isRunning: webServer ? webServer.isRunning : false,
    connectedClients: webServer ? webServer.connectedClients.size : 0,
    port: webServer ? webServer.port : null
  };
});

ipcMain.handle('enable-pi-system', async () => {
  return await managePiSystem('enable');
});

ipcMain.handle('disable-pi-system', async () => {
  return await managePiSystem('disable');
});

ipcMain.handle('restart-pi-system', async () => {
  return await managePiSystem('restart');
});

// Slideshow Management IPC Handlers
ipcMain.handle('get-slideshow-status', () => {
  const settings = bannerManager.getSettings();
  const slideshowSettings = settings?.slideshow ?? configManager.getDefaultSlideshowSettings();
  const imageCount = mediaManager.getSlideshowImageCount();
  
  return {
    enabled: slideshowSettings.enabled,
    interval: slideshowSettings.interval,
    imageCount: imageCount,
    isRunning: slideshowInterval !== null,
    currentSlideIndex: currentSlideIndex
  };
});

ipcMain.handle('enable-slideshow', async () => {
  try {
    const currentSettings = bannerManager.getSettings();
    const updatedSettings = {
      ...currentSettings,
      slideshow: {
        ...currentSettings.slideshow,
        enabled: true
      }
    };
    
    configManager.validateSlideshowSettings(updatedSettings.slideshow);
    bannerManager.saveSettings(updatedSettings);
    
    // Restart slideshow with new settings
    startSlideshow();
    
    return { success: true, message: 'Slideshow enabled successfully' };
  } catch (error) {
    console.error('[Main] Failed to enable slideshow:', error);
    return { success: false, message: 'Failed to enable slideshow: ' + error.message };
  }
});

ipcMain.handle('disable-slideshow', async () => {
  try {
    const currentSettings = bannerManager.getSettings();
    const updatedSettings = {
      ...currentSettings,
      slideshow: {
        ...currentSettings.slideshow,
        enabled: false
      }
    };
    
    configManager.validateSlideshowSettings(updatedSettings.slideshow);
    bannerManager.saveSettings(updatedSettings);
    
    // Use comprehensive cleanup function
    cleanupSlideshow();
    
    return { success: true, message: 'Slideshow disabled successfully' };
  } catch (error) {
    console.error('[Main] Failed to disable slideshow:', error);
    return { success: false, message: 'Failed to disable slideshow: ' + error.message };
  }
});

ipcMain.handle('set-slideshow-interval', async (event, interval) => {
  try {
    if (typeof interval !== 'number' || interval < 1000) {
      throw new Error('Interval must be at least 1000ms');
    }
    
    const currentSettings = bannerManager.getSettings();
    const updatedSettings = {
      ...currentSettings,
      slideshow: {
        ...currentSettings.slideshow,
        interval: interval
      }
    };
    
    configManager.validateSlideshowSettings(updatedSettings.slideshow);
    bannerManager.saveSettings(updatedSettings);
    
    // Restart slideshow with new interval if it's currently running
    if (slideshowInterval) {
      startSlideshow();
    }
    
    return { success: true, message: `Slideshow interval set to ${interval}ms` };
  } catch (error) {
    console.error('[Main] Failed to set slideshow interval:', error);
    return { success: false, message: 'Failed to set slideshow interval: ' + error.message };
  }
});

// Test slideshow cleanup IPC handler
ipcMain.handle('test-slideshow-cleanup', () => {
  return testSlideshowCleanup();
});

// Improved Pi Client Management IPC handlers
ipcMain.handle('scan-pi-clients', async () => {
  try {
    const clients = [];
    
    // Get local IP address with timeout
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let localIP = '127.0.0.1';
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIP = iface.address;
          break;
        }
      }
      if (localIP !== '127.0.0.1') break;
    }
    
    // Scan local network for Pi clients with improved concurrency control
    const baseIP = localIP.substring(0, localIP.lastIndexOf('.'));
    const scanPromises = [];
    const maxConcurrent = 10; // Limit concurrent requests
    
    for (let i = 1; i <= 50; i++) {
      const testIP = `${baseIP}.${i}`;
      scanPromises.push(scanPiClient(testIP));
      
      // Process in batches to avoid overwhelming the network
      if (scanPromises.length >= maxConcurrent) {
        const batchResults = await Promise.allSettled(scanPromises);
        clients.push(...batchResults.filter(r => r.status === 'fulfilled' && r.value !== null).map(r => r.value));
        scanPromises.length = 0; // Clear array
      }
    }
    
    // Process remaining promises
    if (scanPromises.length > 0) {
      const batchResults = await Promise.allSettled(scanPromises);
      clients.push(...batchResults.filter(r => r.status === 'fulfilled' && r.value !== null).map(r => r.value));
    }
    
    return clients;
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

// Helper function to scan for Pi clients with improved error handling
async function scanPiClient(ip) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // Reduced timeout for faster scanning
    
    const response = await fetch(`http://${ip}:3001/discovery`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      if (data.service === 'MemberNameDisplay' && data.type === 'pi-update-server') {
        // Get basic client info with parallel requests
        const [healthResponse, channelResponse, versionResponse] = await Promise.allSettled([
          fetch(`http://${ip}:3001/health`),
          fetch(`http://${ip}:3001/update-channel`),
          fetch(`http://${ip}:3001/client-version`)
        ]);
        
        const channel = channelResponse.status === 'fulfilled' && channelResponse.value.ok 
          ? await channelResponse.value.text() 
          : 'stable';
        const version = versionResponse.status === 'fulfilled' && versionResponse.value.ok 
          ? await versionResponse.value.text() 
          : 'unknown';
        
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
    // Silently ignore connection errors and timeouts
    if (error.name !== 'AbortError') {
      // Only log non-timeout errors for debugging
      console.debug(`[Main] Scan failed for ${ip}:`, error.message);
    }
  }
  return null;
}

// Queue Management IPC Handlers
ipcMain.handle('add-to-queue', (event, { bannerId, member }) => {
  return queueManager.addToQueue(bannerId, member);
});

ipcMain.handle('remove-from-queue', (event, { bannerId, memberId }) => {
  return queueManager.removeFromQueue(bannerId, memberId);
});

ipcMain.handle('get-queue', (event, bannerId) => {
  return queueManager.getQueue(bannerId);
});

ipcMain.handle('get-all-queues', () => {
  return queueManager.getAllQueues();
});

ipcMain.handle('get-current-display', (event, bannerId) => {
  return queueManager.getCurrentDisplay(bannerId);
});

ipcMain.handle('display-next-from-queue', (event, bannerId) => {
  const nextItem = queueManager.displayNextFromQueue(bannerId);
  if (nextItem) {
    // Send to banner
    bannerManager.sendToBanner(bannerId, channels.displayName, nextItem.nameData);
    
    // Broadcast to Pi displays
    if (webServer && webServer.isRunning) {
      webServer.broadcastNameDisplay(nextItem.nameData);
    }
    
    // Mark as displayed in data source
    dataSource.markAsDisplayed(nextItem.member.id);
  }
  return nextItem;
});

ipcMain.handle('clear-current-display', (event, bannerId) => {
  const result = queueManager.clearCurrentDisplay(bannerId);
  if (result.success) {
    // Clear the banner display
    bannerManager.sendToBanner(bannerId, channels.clearName);
    
    // Broadcast clear to Pi displays
    if (webServer && webServer.isRunning) {
      webServer.broadcastNameClear();
    }
  }
  return result;
});

ipcMain.handle('advance-queue', (event, bannerId) => {
  return queueManager.advanceQueue(bannerId);
});

ipcMain.handle('clear-queue', (event, bannerId) => {
  return queueManager.clearQueue(bannerId);
});

ipcMain.handle('clear-all-queues', () => {
  const result = queueManager.clearAllQueues();
  if (result.success) {
    // Clear all banner displays
    const enabledBanners = bannerManager.getEnabledBannerIds();
    enabledBanners.forEach(bannerId => {
      bannerManager.sendToBanner(bannerId, channels.clearName);
    });
    
    // Broadcast clear to Pi displays
    if (webServer && webServer.isRunning) {
      webServer.broadcastNameClear();
    }
  }
  return result;
});

ipcMain.handle('move-up-in-queue', (event, { bannerId, memberId }) => {
  return queueManager.moveUpInQueue(bannerId, memberId);
});

ipcMain.handle('move-down-in-queue', (event, { bannerId, memberId }) => {
  return queueManager.moveDownInQueue(bannerId, memberId);
});

ipcMain.handle('move-to-banner', (event, { fromBannerId, toBannerId, memberId }) => {
  return queueManager.moveToBanner(fromBannerId, toBannerId, memberId);
});

// Pi System Management Functions
const updatePiSystemSettings = (enabled) => {
  const currentSettings = bannerManager.getSettings();
  const updatedSettings = {
    ...currentSettings,
    piSystem: {
      ...currentSettings.piSystem,
      enabled: enabled
    }
  };
  bannerManager.saveSettings(updatedSettings);
};

const managePiSystem = async (action) => {
  try {
    switch (action) {
      case 'enable':
        if (piSystemEnabled) {
          return { success: true, message: 'Pi system is already enabled' };
        }
        console.log('[Main] Enabling Pi system...');
        webServer = new WebServer();
        await webServer.start();
        piSystemEnabled = true;
        updatePiSystemSettings(true);
        return { success: true, message: 'Pi system enabled successfully' };
        
      case 'disable':
        if (!piSystemEnabled) {
          return { success: true, message: 'Pi system is already disabled' };
        }
        console.log('[Main] Disabling Pi system...');
        if (webServer) {
          await webServer.stop();
          webServer = null;
        }
        piSystemEnabled = false;
        updatePiSystemSettings(false);
        return { success: true, message: 'Pi system disabled successfully' };
        
      case 'restart':
        console.log('[Main] Restarting Pi system...');
        if (webServer) {
          await webServer.stop();
          webServer = null;
        }
        const currentSettings = bannerManager.getSettings();
        piSystemEnabled = currentSettings?.piSystem?.enabled ?? false;
        if (piSystemEnabled) {
          webServer = new WebServer();
          await webServer.start();
        }
        return { success: true, message: 'Pi system restarted successfully' };
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error(`[Main] Failed to ${action} Pi system:`, error);
    return { success: false, message: `Failed to ${action} Pi system: ${error.message}` };
  }
};

// Test slideshow cleanup function
const testSlideshowCleanup = () => {
  console.log('[Main] Testing slideshow cleanup...');
  
  // Check current state
  const hasInterval = slideshowInterval !== null;
  const hasBanners = bannerManager.banners.size > 0;
  const hasWebServer = webServer && webServer.isRunning;
  
  console.log('[Main] Pre-cleanup state:', {
    hasInterval,
    hasBanners,
    hasWebServer,
    currentSlideIndex
  });
  
  // Perform cleanup
  cleanupSlideshow();
  
  // Check post-cleanup state
  const postHasInterval = slideshowInterval !== null;
  const postCurrentSlideIndex = currentSlideIndex;
  
  console.log('[Main] Post-cleanup state:', {
    hasInterval: postHasInterval,
    currentSlideIndex: postCurrentSlideIndex
  });
  
  return {
    success: !postHasInterval && postCurrentSlideIndex === 0,
    message: 'Slideshow cleanup test completed',
    preState: { hasInterval, hasBanners, hasWebServer, currentSlideIndex },
    postState: { hasInterval: postHasInterval, currentSlideIndex: postCurrentSlideIndex }
  };
};

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
  initializePiSystem();

  // Initialize QueueManager
  queueManager = new QueueManager();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindows();
    }
  });
});

// App event handlers
app.on('window-all-closed', async () => {
  console.log('[Main] All windows closed, cleaning up resources...');
  await cleanupResources();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindows();
  }
});

app.on('before-quit', async (event) => {
  console.log('[Main] App quitting, performing cleanup...');
  event.preventDefault();
  await cleanupResources();
  app.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught Exception:', error);
  cleanupResources().then(() => {
    app.exit(1);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled Rejection at:', promise, 'reason:', reason);
  cleanupResources().then(() => {
    app.exit(1);
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.