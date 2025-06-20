const { app, BrowserWindow, ipcMain, session, protocol, screen } = require('electron');
const path = require('node:path');
const fs = require('fs');
const dataSource = require('./dataSource');
const mediaManager = require('./mediaManager');
const BannerManager = require('./bannerManager');
const configManager = require('./config/configManager');
const OfflineUpdater = require('./updater');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let controlPanelWindow;
const bannerManager = new BannerManager();
let updater;

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
  const assetsDir = path.join(__dirname, configManager.getPaths().iconsDir);
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
  const windowConfig = configManager.getWindowConfig().controlPanel;
  const controlPanelConfig = {
    width: windowConfig.width,
    height: windowConfig.height,
    minWidth: windowConfig.minWidth,
    minHeight: windowConfig.minHeight,
    webPreferences: {
      preload: RENDERER_PRELOAD_WEBPACK_ENTRY,
    },
    title: windowConfig.title,
  };
  
  // Only add icon if we have a valid path
  if (iconPath && fs.existsSync(iconPath)) {
    controlPanelConfig.icon = iconPath;
  }
  
  controlPanelWindow = new BrowserWindow(controlPanelConfig);
  controlPanelWindow.loadURL(RENDERER_WEBPACK_ENTRY);
  
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
});

ipcMain.handle(channels.bannerClear, (event, { banner }) => {
  bannerManager.sendToBanner(banner, channels.clearName);
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
});

ipcMain.handle(channels.getCurrentSlideIndex, () => {
  return currentSlideIndex;
});

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

  // Initialize offline updater
  updater = new OfflineUpdater();

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