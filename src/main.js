const { app, BrowserWindow, ipcMain, session, protocol } = require('electron');
const path = require('node:path');
const dataSource = require('./dataSource');
const mediaManager = require('./mediaManager');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let controlPanelWindow;
let bannerWindow1;
let bannerWindow2;

const createWindows = () => {
  // Control Panel Window
  controlPanelWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: CONTROL_PANEL_PRELOAD_WEBPACK_ENTRY,
    },
    title: 'Joyride Control Panel',
  });
  controlPanelWindow.loadURL(CONTROL_PANEL_WEBPACK_ENTRY);
  if (!app.isPackaged) controlPanelWindow.webContents.openDevTools({ mode: 'detach' });

  // Banner 1 Window
  bannerWindow1 = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    frame: false,
    webPreferences: {
      preload: BANNER_PRELOAD_WEBPACK_ENTRY,
    },
    title: 'Joyride Banner 1',
    show: true,
  });
  bannerWindow1.loadURL(BANNER_WEBPACK_ENTRY + '?banner=1');
  bannerWindow1.setMenu(null);
  if (!app.isPackaged) bannerWindow1.webContents.openDevTools({ mode: 'detach' });

  // Banner 2 Window
  bannerWindow2 = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    frame: false,
    webPreferences: {
      preload: BANNER_PRELOAD_WEBPACK_ENTRY,
    },
    title: 'Joyride Banner 2',
    show: true,
  });
  bannerWindow2.loadURL(BANNER_WEBPACK_ENTRY + '?banner=2');
  bannerWindow2.setMenu(null);
  if (!app.isPackaged) bannerWindow2.webContents.openDevTools({ mode: 'detach' });
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
  if (readyWindows === 2) {
    startSlideshow();
  }
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
    if (bannerWindow2) bannerWindow2.webContents.send('slideshow-updated');
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
  if (bannerWindow2) bannerWindow2.webContents.send('slideshow-updated');
  stopSlideshow();
  currentSlideIndex = 0;
});

// UI Toggles
ipcMain.on('toggle-banner-number', (event, { isVisible }) => {
  if (bannerWindow1 && !bannerWindow1.isDestroyed()) {
    bannerWindow1.webContents.send('set-banner-number-visibility', isVisible);
  }
  if (bannerWindow2 && !bannerWindow2.isDestroyed()) {
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