import '@testing-library/jest-dom';

// Mock updateStatus response for UpdateManager
const mockUpdateStatusResponse = {
  isUpdateAvailable: false,
  updateInfo: null,
  updateProgress: 0,
  isUpdating: false,
  lastCheckTime: null,
  currentVersion: '1.4.0'
};

const mockChannelInfoResponse = {
  channel: 'stable',
  availableChannels: ['stable', 'testing']
};

// Mock window.require for Electron in tests
window.require = jest.fn((module) => {
  if (module === 'electron') {
    return {
      ipcRenderer: {
        on: jest.fn(),
        send: jest.fn(),
        invoke: jest.fn((channel, ...args) => {
          // Handle specific IPC calls that components make
          switch (channel) {
            case 'get-update-status':
              return Promise.resolve(mockUpdateStatusResponse);
            case 'get-update-channel':
              return Promise.resolve(mockChannelInfoResponse);
            case 'check-for-updates':
              return Promise.resolve({ success: true });
            case 'download-update':
              return Promise.resolve({ success: true });
            case 'install-update':
              return Promise.resolve({ success: true });
            case 'set-update-channel':
              return Promise.resolve({ success: true });
            case 'open-github-releases':
              return Promise.resolve();
            case 'get-members':
              return Promise.resolve([]);
            case 'display-member':
              return Promise.resolve({ success: true });
            case 'add-to-queue':
              return Promise.resolve({ success: true });
            case 'get-settings':
              return Promise.resolve({
                banners: [
                  { id: 1, enabled: true, display: 0, targetType: 'local' },
                  { id: 2, enabled: true, display: 1, targetType: 'local' }
                ],
                fontColor: '#8B9091'
              });
            case 'get-available-displays':
              return Promise.resolve([
                { index: 0, name: 'Display 1 (Primary)', bounds: { width: 1920, height: 1080 } },
                { index: 1, name: 'Display 2', bounds: { width: 1920, height: 1080 } }
              ]);
            case 'get-slideshow-status':
              return Promise.resolve({
                enabled: true,
                interval: 20000,
                imageCount: 5,
                isRunning: true,
                currentSlideIndex: 0
              });
            case 'get-queue':
              return Promise.resolve({
                1: [],
                2: []
              });
            default:
              return Promise.resolve({ success: true });
          }
        }),
        removeAllListeners: jest.fn(),
        removeListener: jest.fn(), // Add missing method
      },
    };
  }
  return {};
});

// Ensure window.electronAPI is always defined with all needed methods
window.electronAPI = {
  invoke: jest.fn((channel, ...args) => {
    // Handle specific IPC calls that components make
    switch (channel) {
      case 'get-update-status':
        return Promise.resolve(mockUpdateStatusResponse);
      case 'get-update-channel':
        return Promise.resolve(mockChannelInfoResponse);
      case 'check-for-updates':
        return Promise.resolve({ success: true });
      case 'download-update':
        return Promise.resolve({ success: true });
      case 'install-update':
        return Promise.resolve({ success: true });
      case 'set-update-channel':
        return Promise.resolve({ success: true });
      case 'open-github-releases':
        return Promise.resolve();
      case 'get-members':
        return Promise.resolve([]);
      case 'display-member':
        return Promise.resolve({ success: true });
      case 'add-to-queue':
        return Promise.resolve({ success: true });
      case 'get-settings':
        return Promise.resolve({
          banners: [
            { id: 1, enabled: true, display: 0, targetType: 'local' },
            { id: 2, enabled: true, display: 1, targetType: 'local' }
          ],
          fontColor: '#8B9091'
        });
      case 'get-available-displays':
        return Promise.resolve([
          { index: 0, name: 'Display 1 (Primary)', bounds: { width: 1920, height: 1080 } },
          { index: 1, name: 'Display 2', bounds: { width: 1920, height: 1080 } }
        ]);
      case 'get-slideshow-status':
        return Promise.resolve({
          enabled: true,
          interval: 20000,
          imageCount: 5,
          isRunning: true,
          currentSlideIndex: 0
        });
      case 'get-queue':
        return Promise.resolve({
          1: [],
          2: []
        });
      default:
        return Promise.resolve({ success: true });
    }
  }),
  send: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  removeListener: jest.fn(),
};

// Mock any other global properties that might be needed
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Mock global constants used in components
global.RENDERER_PRELOAD_WEBPACK_ENTRY = '';
global.RENDERER_WEBPACK_ENTRY = 'http://localhost';

// Mock window properties that might be needed
try {
  window.location.search = '?banner=1';
  window.location.href = 'http://localhost:3000?banner=1';
} catch (e) {
  // If assignment fails (e.g., jsdom restrictions), skip mocking these properties
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})); 