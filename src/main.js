const { app, BrowserWindow, ipcMain, session, protocol, screen } = require('electron');
const path = require('node:path');
const fs = require('fs');
const dataSource = require('./dataSource');
const mediaManager = require('./mediaManager');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let controlPanelWindow;
let bannerWindow1;
let bannerWindow2;
let currentSettings = {
  banner2Enabled: false,
  banner1Display: 0,
  banner2Display: 1
};

// Load settings from file
const loadSettings = () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const loadedSettings = JSON.parse(settingsData);
      currentSettings = { ...currentSettings, ...loadedSettings };
      console.log('Loaded settings:', currentSettings);
    } else {
      console.log('No settings file found, using defaults:', currentSettings);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
};

// Save settings to file
const saveSettings = (settings) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    currentSettings = settings;
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

// Get display bounds for a specific display index
const getDisplayBounds = (displayIndex) => {
  const displays = screen.getAllDisplays();
  if (displayIndex >= 0 && displayIndex < displays.length) {
    return displays[displayIndex].bounds;
  }
  // Fallback to primary display
  return displays[0].bounds;
};

// Get available displays information
const getAvailableDisplays = () => {
  const displays = screen.getAllDisplays();
  return displays.map((display, index) => ({
    index,
    bounds: display.bounds,
    isPrimary: display.bounds.x === 0 && display.bounds.y === 0,
    name: `Display ${index + 1}${display.bounds.x === 0 && display.bounds.y === 0 ? ' (Primary)' : ''}`
  }));
};

const createWindows = () => {
  // Load settings before creating windows
  loadSettings();
  console.log('Creating windows with settings:', currentSettings);

  // Determine icon path - use PNG as fallback if ICO doesn't exist
  const assetsDir = path.join(__dirname, 'assets/icons');
  let iconPath = null;
  
  // Check if assets directory exists first
  if (fs.existsSync(assetsDir)) {
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
  const controlPanelConfig = {
    width: 900,
    height: 700,
    webPreferences: {
      preload: CONTROL_PANEL_PRELOAD_WEBPACK_ENTRY,
    },
    title: 'Joyride Control Panel',
  };
  
  // Only add icon if we have a valid path
  if (iconPath && fs.existsSync(iconPath)) {
    controlPanelConfig.icon = iconPath;
  }
  
  controlPanelWindow = new BrowserWindow(controlPanelConfig);
  controlPanelWindow.loadURL(CONTROL_PANEL_WEBPACK_ENTRY);
  if (!app.isPackaged) controlPanelWindow.webContents.openDevTools({ mode: 'detach' });

  // Banner 1 Window
  const banner1Bounds = getDisplayBounds(currentSettings.banner1Display);
  console.log('Creating Banner 1 with bounds:', banner1Bounds);
  
  const banner1Config = {
    width: banner1Bounds.width,
    height: banner1Bounds.height,
    x: banner1Bounds.x,
    y: banner1Bounds.y,
    fullscreen: true,
    frame: false,
    webPreferences: {
      preload: BANNER_PRELOAD_WEBPACK_ENTRY,
    },
    title: 'Joyride Banner 1',
    show: true,
  };
  
  // Only add icon if we have a valid path
  if (iconPath && fs.existsSync(iconPath)) {
    banner1Config.icon = iconPath;
  }
  
  bannerWindow1 = new BrowserWindow(banner1Config);
  bannerWindow1.loadURL(BANNER_WEBPACK_ENTRY + '?banner=1');
  bannerWindow1.setMenu(null);
  if (!app.isPackaged) bannerWindow1.webContents.openDevTools({ mode: 'detach' });

  // Banner 2 Window (only if enabled)
  if (currentSettings.banner2Enabled) {
    const banner2Bounds = getDisplayBounds(currentSettings.banner2Display);
    console.log('Creating Banner 2 with bounds:', banner2Bounds);
    
    const banner2Config = {
      width: banner2Bounds.width,
      height: banner2Bounds.height,
      x: banner2Bounds.x,
      y: banner2Bounds.y,
      fullscreen: true,
      frame: false,
      webPreferences: {
        preload: BANNER_PRELOAD_WEBPACK_ENTRY,
      },
      title: 'Joyride Banner 2',
      show: true,
    };
    
    // Only add icon if we have a valid path
    if (iconPath && fs.existsSync(iconPath)) {
      banner2Config.icon = iconPath;
    }
    
    bannerWindow2 = new BrowserWindow(banner2Config);
    bannerWindow2.loadURL(BANNER_WEBPACK_ENTRY + '?banner=2');
    bannerWindow2.setMenu(null);
    if (!app.isPackaged) bannerWindow2.webContents.openDevTools({ mode: 'detach' });
  } else {
    console.log('Banner 2 is disabled, not creating window');
    bannerWindow2 = null;
  }
};

// Slideshow Conductor
let slideshowInterval;
let currentSlideIndex = 0;

function startSlideshow() {
  stopSlideshow(); // Stop any existing interval

  const imageCount = mediaManager.getSlideshowImageCount();
  if (imageCount === 0) return; // Don't start if no images

  slideshowInterval = setInterval(() => {
    currentSlideIndex = (currentSlideIndex + 1) % imageCount;
    console.log(`[Main Process] Broadcasting set-slide, index: ${currentSlideIndex}`);
    if (bannerWindow1 && !bannerWindow1.isDestroyed()) {
      bannerWindow1.webContents.send('set-slide', currentSlideIndex);
    }
    if (bannerWindow2 && !bannerWindow2.isDestroyed()) {
      bannerWindow2.webContents.send('set-slide', currentSlideIndex);
    }
  }, 20000); // 20 seconds
}

function stopSlideshow() {
  if (slideshowInterval) {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
  }
}

// IPC Handlers
ipcMain.handle('banner-display', (event, { banner, nameData }) => {
  const targetWindow = banner === 1 ? bannerWindow1 : bannerWindow2;
  if (targetWindow && !targetWindow.isDestroyed()) {
    targetWindow.webContents.send('display-name', nameData);
  }
});

ipcMain.handle('banner-clear', (event, { banner }) => {
  const targetWindow = banner === 1 ? bannerWindow1 : bannerWindow2;
  if (targetWindow && !targetWindow.isDestroyed()) {
    targetWindow.webContents.send('clear-name');
  }
});

let readyWindows = 0;
ipcMain.on('renderer-ready', (event) => {
  readyWindows++;
  const expectedWindows = currentSettings.banner2Enabled ? 2 : 1;
  if (readyWindows === expectedWindows) {
    startSlideshow();
  }
});

// Settings IPC handlers
ipcMain.handle('get-settings', () => {
  return currentSettings;
});

ipcMain.handle('get-available-displays', () => {
  return getAvailableDisplays();
});

ipcMain.handle('save-settings', (event, settings) => {
  saveSettings(settings);
  return true;
});

ipcMain.handle('apply-display-settings', async (event, settings) => {
  console.log('Applying display settings:', settings);
  
  // Close existing banner windows
  if (bannerWindow1 && !bannerWindow1.isDestroyed()) {
    console.log('Closing Banner 1 window');
    bannerWindow1.close();
  }
  if (bannerWindow2 && !bannerWindow2.isDestroyed()) {
    console.log('Closing Banner 2 window');
    bannerWindow2.close();
  }

  // Reset ready windows counter
  readyWindows = 0;

  // Determine icon path - use PNG as fallback if ICO doesn't exist
  const assetsDir = path.join(__dirname, 'assets/icons');
  let iconPath = null;
  
  // Check if assets directory exists first
  if (fs.existsSync(assetsDir)) {
    iconPath = fs.existsSync(path.join(assetsDir, 'app-icon.ico')) 
      ? path.join(assetsDir, 'app-icon.ico')
      : path.join(assetsDir, 'app-icon-512.png');
  }
  
  console.log('Assets directory exists:', fs.existsSync(assetsDir));
  console.log('Using icon path:', iconPath);
  if (iconPath) {
    console.log('Icon file exists:', fs.existsSync(iconPath));
  }

  // Create new banner windows with updated settings
  const banner1Bounds = getDisplayBounds(settings.banner1Display);
  console.log('Creating Banner 1 with bounds:', banner1Bounds);
  
  const banner1Config = {
    width: banner1Bounds.width,
    height: banner1Bounds.height,
    x: banner1Bounds.x,
    y: banner1Bounds.y,
    fullscreen: true,
    frame: false,
    webPreferences: {
      preload: BANNER_PRELOAD_WEBPACK_ENTRY,
    },
    title: 'Joyride Banner 1',
    show: true,
  };
  
  // Only add icon if we have a valid path
  if (iconPath && fs.existsSync(iconPath)) {
    banner1Config.icon = iconPath;
  }
  
  bannerWindow1 = new BrowserWindow(banner1Config);
  bannerWindow1.loadURL(BANNER_WEBPACK_ENTRY + '?banner=1');
  bannerWindow1.setMenu(null);
  if (!app.isPackaged) bannerWindow1.webContents.openDevTools({ mode: 'detach' });

  if (settings.banner2Enabled) {
    const banner2Bounds = getDisplayBounds(settings.banner2Display);
    console.log('Creating Banner 2 with bounds:', banner2Bounds);
    
    const banner2Config = {
      width: banner2Bounds.width,
      height: banner2Bounds.height,
      x: banner2Bounds.x,
      y: banner2Bounds.y,
      fullscreen: true,
      frame: false,
      webPreferences: {
        preload: BANNER_PRELOAD_WEBPACK_ENTRY,
      },
      title: 'Joyride Banner 2',
      show: true,
    };
    
    // Only add icon if we have a valid path
    if (iconPath && fs.existsSync(iconPath)) {
      banner2Config.icon = iconPath;
    }
    
    bannerWindow2 = new BrowserWindow(banner2Config);
    bannerWindow2.loadURL(BANNER_WEBPACK_ENTRY + '?banner=2');
    bannerWindow2.setMenu(null);
    if (!app.isPackaged) bannerWindow2.webContents.openDevTools({ mode: 'detach' });
  } else {
    console.log('Banner 2 is disabled, not creating window');
    bannerWindow2 = null;
  }

  // Restart slideshow with new configuration
  setTimeout(() => {
    startSlideshow();
  }, 1000);

  return true;
});

// Data source IPC handlers
ipcMain.handle('load-csv', async () => {
  const result = await dataSource.loadDataFromCsv();
  return result;
});

ipcMain.handle('get-members', () => {
  return dataSource.getMembers();
});

ipcMain.handle('add-member', (event, newMember) => {
  return dataSource.addMember(newMember);
});

ipcMain.handle('update-member', (event, updatedMember) => {
  return dataSource.updateMember(updatedMember);
});

ipcMain.handle('mark-as-displayed', (event, memberId) => {
  return dataSource.markAsDisplayed(memberId);
});

// Media Manager IPC handlers
ipcMain.handle('import-images', async () => {
  const newImages = await mediaManager.importSlideshowImages(controlPanelWindow);
  if (newImages && newImages.length > 0) {
    // Notify banner windows that the slides have changed and restart the slideshow
    if (bannerWindow1) bannerWindow1.webContents.send('slideshow-updated');
    if (bannerWindow2 && currentSettings.banner2Enabled) bannerWindow2.webContents.send('slideshow-updated');
    startSlideshow();
  }
  return newImages; // Return only the newly added images
});

ipcMain.handle('get-slideshow-images', () => {
  return mediaManager.getSlideshowImages();
});

ipcMain.handle('clear-slideshow-cache', async () => {
  mediaManager.clearSlideshowCache();
  // Notify banners that the slideshow is now empty
  if (bannerWindow1) bannerWindow1.webContents.send('slideshow-updated');
  if (bannerWindow2 && currentSettings.banner2Enabled) bannerWindow2.webContents.send('slideshow-updated');
  stopSlideshow();
  currentSlideIndex = 0;
});

// UI Toggles
ipcMain.on('toggle-banner-number', (event, { isVisible }) => {
  if (bannerWindow1 && !bannerWindow1.isDestroyed()) {
    bannerWindow1.webContents.send('set-banner-number-visibility', isVisible);
  }
  if (bannerWindow2 && !bannerWindow2.isDestroyed() && currentSettings.banner2Enabled) {
    bannerWindow2.webContents.send('set-banner-number-visibility', isVisible);
  }
});

ipcMain.handle('get-current-slide-index', () => {
  return currentSlideIndex;
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Suppress the harmless "Autofill" errors in the console
  app.commandLine.appendSwitch('disable-features', 'AutofillServiceDownIndication');

  // Register a custom protocol to serve media files securely.
  const mediaDir = path.join(app.getPath('userData'), 'slideshow_media');
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
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.