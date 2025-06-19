const { app, BrowserWindow } = require('electron');
const path = require('node:path');

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

  // Banner 1 Window
  bannerWindow1 = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    webPreferences: {
      preload: BANNER_PRELOAD_WEBPACK_ENTRY,
    },
    title: 'Joyride Banner 1',
    show: true,
  });
  bannerWindow1.loadURL(BANNER_WEBPACK_ENTRY + '?banner=1');

  // Banner 2 Window
  bannerWindow2 = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    webPreferences: {
      preload: BANNER_PRELOAD_WEBPACK_ENTRY,
    },
    title: 'Joyride Banner 2',
    show: true,
  });
  bannerWindow2.loadURL(BANNER_WEBPACK_ENTRY + '?banner=2');
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
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

console.log('Banner number:', getBannerNumber(), 'Search:', window.location.search);

function getBannerNumber() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('banner') || '1', 10);
}

const Banner = () => {
  const [displayName, setDisplayName] = useState(null);
  const bannerNumber = getBannerNumber();

  useEffect(() => {
    window.electronAPI.on('display-name', (nameData) => {
      setDisplayName(nameData);
    });
    window.electronAPI.on('clear-name', () => {
      setDisplayName(null);
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#222', color: '#fff' }}>
      <h1 style={{ fontSize: 64 }}>Banner {bannerNumber}</h1>
      {displayName ? (
        <>
          <div style={{ fontSize: 72, fontWeight: 'bold' }}>{displayName.firstLine}</div>
          <div style={{ fontSize: 48 }}>{displayName.secondLine}</div>
        </>
      ) : (
        <p style={{ fontSize: 24 }}>Waiting for name display...</p>
      )}
    </div>
  );
};

export default Banner;
