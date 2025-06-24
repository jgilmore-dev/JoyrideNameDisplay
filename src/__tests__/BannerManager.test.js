const BannerManager = require('../bannerManager.js');

// Mock Electron BrowserWindow
const mockWebContents = {
  send: jest.fn(),
};
const mockBrowserWindow = {
  loadURL: jest.fn(),
  setMenu: jest.fn(),
  on: jest.fn(),
  isDestroyed: jest.fn(() => false),
  webContents: mockWebContents,
  close: jest.fn(),
};

// Patch global constants used in bannerManager.js
global.RENDERER_PRELOAD_WEBPACK_ENTRY = '';
global.RENDERER_WEBPACK_ENTRY = 'http://localhost';

jest.mock('electron', () => {
  // All mock variables must be defined inside this factory
  const mockBrowserWindowInstances = [];
  function createMockBrowserWindow() {
    return {
      loadURL: jest.fn(),
      setMenu: jest.fn(),
      on: jest.fn(),
      isDestroyed: jest.fn(() => false),
      webContents: { send: jest.fn() },
      close: jest.fn(),
    };
  }
  const BrowserWindow = jest.fn(() => {
    const instance = createMockBrowserWindow();
    mockBrowserWindowInstances.push(instance);
    return instance;
  });
  // Expose the array globally for test assertions
  global.mockBrowserWindowInstances = mockBrowserWindowInstances;
  return {
    BrowserWindow,
    screen: {
      getAllDisplays: jest.fn(() => [
        { bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
        { bounds: { x: 1920, y: 0, width: 1920, height: 1080 } },
        { bounds: { x: 3840, y: 0, width: 1920, height: 1080 } },
      ]),
    },
    app: {
      getPath: jest.fn(() => '.'),
      isPackaged: true,
    },
  };
});

const configManager = require('../config/configManager');
jest.mock('../config/configManager');
configManager.getDefaultBannerSettings.mockReturnValue({
  banners: [
    { id: 1, enabled: true, display: 0, targetType: 'local' },
    { id: 2, enabled: true, display: 1, targetType: 'local' },
    { id: 3, enabled: true, display: 2, targetType: 'local' },
  ],
  fontColor: '#FFFFFF',
});
configManager.getWindowConfig.mockReturnValue({ banner: { fullscreen: true, frame: false, title: 'Banner' } });
configManager.getPaths.mockReturnValue({ iconsDir: '.', settingsFile: 'settings.json' });
configManager.getIpcChannels.mockReturnValue({ setFontColor: 'set-font-color' });
configManager.getBannerConfig.mockReturnValue({ maxBanners: 3, defaultFontColor: '#FFFFFF', defaultSettings: { banners: [] } });
configManager.getDefaultPiSystemSettings.mockReturnValue({});
configManager.getDefaultSlideshowSettings.mockReturnValue({});
configManager.getDevelopmentConfig.mockReturnValue({ devTools: { openOnStart: false, mode: 'undocked' } });
configManager.validateBannerSettings.mockImplementation(() => {});
configManager.validatePiSystemSettings.mockImplementation(() => {});
configManager.validateSlideshowSettings.mockImplementation(() => {});
configManager.getErrors.mockReturnValue({ settingsLoadError: 'Settings load error', settingsSaveError: 'Settings save error', displaySettingsError: 'Display settings error' });

describe('BannerManager - Core Functionality', () => {
  let bannerManager;

  beforeEach(() => {
    jest.clearAllMocks();
    global.mockBrowserWindowInstances.length = 0;
    const settings = {
      banners: [
        { id: 1, enabled: true, display: 0, targetType: 'local' },
        { id: 2, enabled: true, display: 1, targetType: 'local' },
        { id: 3, enabled: true, display: 2, targetType: 'local' },
      ],
      fontColor: '#FFFFFF',
    };
    bannerManager = new BannerManager();
    bannerManager.createAllBanners(settings);
  });

  test('creates banner windows on initialization', () => {
    expect(bannerManager.banners.size).toBe(3);
  });

  test('sendToBanner sends event/data to correct banner', () => {
    bannerManager.sendToBanner(1, 'display-member', { Member1: 'John', LastName: 'Smith' });
    const banner = bannerManager.banners.get(1);
    expect(banner.webContents.send).toHaveBeenCalledWith('display-member', { Member1: 'John', LastName: 'Smith' });
  });

  test('broadcastToBanners sends event/data to all banners', () => {
    bannerManager.broadcastToBanners('clear-display', { bannerId: 1 });
    for (const banner of bannerManager.banners.values()) {
      expect(banner.webContents.send).toHaveBeenCalledWith('clear-display', { bannerId: 1 });
    }
  });

  test('closeAllBanners closes all windows', () => {
    bannerManager.closeAllBanners();
    for (const banner of global.mockBrowserWindowInstances) {
      expect(banner.close).toHaveBeenCalled();
    }
    expect(bannerManager.banners.size).toBe(0);
  });
});

describe('BannerManager - Edge Cases and Error Handling', () => {
  let bannerManager;

  beforeEach(() => {
    jest.clearAllMocks();
    bannerManager = new BannerManager();
    bannerManager.createAllBanners();
  });

  test('sendToBanner does not throw for invalid bannerId', () => {
    expect(() => {
      bannerManager.sendToBanner(999, 'display-member', { Member1: 'John' });
    }).not.toThrow();
  });

  test('sendToBanner does not throw for null/undefined data', () => {
    expect(() => {
      bannerManager.sendToBanner(1, 'display-member', null);
      bannerManager.sendToBanner(1, 'display-member', undefined);
    }).not.toThrow();
  });

  test('broadcastToBanners handles empty banners map', () => {
    bannerManager.banners.clear();
    expect(() => {
      bannerManager.broadcastToBanners('clear-display', {});
    }).not.toThrow();
  });
});

describe('BannerManager - Performance and Load Testing', () => {
  let bannerManager;
  beforeEach(() => {
    jest.clearAllMocks();
    global.mockBrowserWindowInstances.length = 0;
    const settings = {
      banners: [
        { id: 1, enabled: true, display: 0, targetType: 'local' },
        { id: 2, enabled: true, display: 1, targetType: 'local' },
        { id: 3, enabled: true, display: 2, targetType: 'local' },
      ],
      fontColor: '#FFFFFF',
    };
    bannerManager = new BannerManager();
    bannerManager.createAllBanners(settings);
  });
  test('handles rapid sendToBanner calls', () => {
    for (let i = 0; i < 100; i++) {
      bannerManager.sendToBanner(1, 'display-member', { Member1: `Member${i}`, LastName: `LastName${i}` });
    }
    const banner = bannerManager.banners.get(1);
    expect(banner.webContents.send).toHaveBeenCalledTimes(100);
  });
  test('handles rapid broadcastToBanners calls', () => {
    for (let i = 0; i < 50; i++) {
      bannerManager.broadcastToBanners('clear-display', { bannerId: i });
    }
    for (const banner of bannerManager.banners.values()) {
      expect(banner.webContents.send).toHaveBeenCalled();
    }
  });
});

describe('BannerManager - Memory Management', () => {
  let bannerManager;
  beforeEach(() => {
    jest.clearAllMocks();
    bannerManager = new BannerManager();
  });
  test('repeated createAllBanners and closeAllBanners does not throw', () => {
    for (let i = 0; i < 10; i++) {
      bannerManager.createAllBanners();
      bannerManager.closeAllBanners();
    }
    expect(bannerManager.banners.size).toBe(0);
  });
});

describe('BannerManager - Real-world Scenarios', () => {
  let bannerManager;
  beforeEach(() => {
    jest.clearAllMocks();
    global.mockBrowserWindowInstances.length = 0;
    const settings = {
      banners: [
        { id: 1, enabled: true, display: 0, targetType: 'local' },
        { id: 2, enabled: true, display: 1, targetType: 'local' },
        { id: 3, enabled: true, display: 2, targetType: 'local' },
      ],
      fontColor: '#FFFFFF',
    };
    bannerManager = new BannerManager();
    bannerManager.createAllBanners(settings);
  });
  test('sendToBanner to multiple banners', () => {
    [1, 2, 3].forEach(id => {
      bannerManager.sendToBanner(id, 'display-member', { Member1: `Member${id}`, LastName: `LastName${id}` });
    });
    for (const banner of bannerManager.banners.values()) {
      expect(banner.webContents.send).toHaveBeenCalled();
    }
  });
  test('broadcastToBanners for slideshow event', () => {
    bannerManager.broadcastToBanners('slideshow-update', { slideIndex: 1 });
    for (const banner of bannerManager.banners.values()) {
      expect(banner.webContents.send).toHaveBeenCalledWith('slideshow-update', { slideIndex: 1 });
    }
  });
}); 