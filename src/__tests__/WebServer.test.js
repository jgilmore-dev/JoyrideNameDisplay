const WebServer = require('../webServer.js');

// Mock console.log to suppress verbose output during tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

// Mock Express app and HTTP server
const mockApp = {
  get: jest.fn(),
  use: jest.fn(),
};
const mockServer = {
  listen: jest.fn((port, cb) => cb && cb()),
  close: jest.fn((cb) => cb && cb()),
  on: jest.fn(),
};
const mockIo = {
  emit: jest.fn(),
  on: jest.fn(),
  sockets: {
    sockets: new Map(),
  },
};

jest.mock('express', () => jest.fn(() => mockApp));
jest.mock('http', () => ({ createServer: jest.fn(() => mockServer) }));
jest.mock('socket.io', () => ({ Server: jest.fn(() => mockIo) }));

describe('WebServer - Core Functionality', () => {
  let webServer;

  beforeEach(() => {
    jest.clearAllMocks();
    webServer = new WebServer();
    // Initialize the server properly
    webServer.initialize();
    webServer.isRunning = true;
  });

  test('broadcastNameDisplay emits correct event', () => {
    const nameData = { Member1: 'John', LastName: 'Smith' };
    webServer.broadcastNameDisplay(nameData);
    expect(mockIo.emit).toHaveBeenCalledWith('name-update', expect.objectContaining({ type: 'display-name', data: nameData }));
  });

  test('broadcastNameClear emits correct event', () => {
    webServer.broadcastNameClear();
    expect(mockIo.emit).toHaveBeenCalledWith('name-update', expect.objectContaining({ type: 'clear-name' }));
  });

  test('broadcastSlideshowUpdate emits correct event', () => {
    webServer.broadcastSlideshowUpdate(2);
    expect(mockIo.emit).toHaveBeenCalledWith('slideshow-update', { slideIndex: 2 });
  });

  test('broadcastSlideshowClear emits correct event', () => {
    webServer.broadcastSlideshowClear();
    expect(mockIo.emit).toHaveBeenCalledWith('slideshow-clear');
  });

  test('broadcastFontColorUpdate emits correct event', () => {
    webServer.broadcastFontColorUpdate('#FF0000');
    expect(mockIo.emit).toHaveBeenCalledWith('display-update', expect.objectContaining({ type: 'font-color-update', data: { fontColor: '#FF0000' } }));
  });

  test('start calls server.listen', () => {
    webServer.isRunning = false;
    webServer.port = 3000;
    webServer.start();
    expect(mockServer.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  });

  test('stop calls server.close', async () => {
    webServer.isRunning = true;
    await webServer.stop();
    expect(mockServer.close).toHaveBeenCalled();
    expect(webServer.isRunning).toBe(false);
  });
});

describe('WebServer - Edge Cases and Error Handling', () => {
  let webServer;

  beforeEach(() => {
    jest.clearAllMocks();
    webServer = new WebServer();
    // Initialize the server properly
    webServer.initialize();
    webServer.isRunning = true;
  });

  test('broadcastNameDisplay does not throw if not running', () => {
    webServer.isRunning = false;
    expect(() => webServer.broadcastNameDisplay({})).not.toThrow();
  });

  test('broadcastNameClear does not throw if not running', () => {
    webServer.isRunning = false;
    expect(() => webServer.broadcastNameClear()).not.toThrow();
  });

  test('broadcastFontColorUpdate does not throw if not running', () => {
    webServer.isRunning = false;
    expect(() => webServer.broadcastFontColorUpdate('#000')).not.toThrow();
  });

  test('stop resolves if server is not running', async () => {
    webServer.isRunning = false;
    await expect(webServer.stop()).resolves.toBeUndefined();
  });
});

describe('WebServer - Performance and Load Testing', () => {
  let webServer;
  beforeEach(() => {
    jest.clearAllMocks();
    webServer = new WebServer();
    // Initialize the server properly
    webServer.initialize();
    webServer.isRunning = true;
  });
  test('handles rapid broadcastNameDisplay calls', () => {
    for (let i = 0; i < 100; i++) {
      webServer.broadcastNameDisplay({ Member1: `Member${i}`, LastName: `LastName${i}` });
    }
    expect(mockIo.emit).toHaveBeenCalledTimes(100);
  });
  test('handles rapid broadcastNameClear calls', () => {
    for (let i = 0; i < 50; i++) {
      webServer.broadcastNameClear();
    }
    expect(mockIo.emit).toHaveBeenCalled();
  });
});

describe('WebServer - Memory Management', () => {
  let webServer;
  beforeEach(() => {
    jest.clearAllMocks();
    webServer = new WebServer();
    // Initialize the server properly
    webServer.initialize();
  });
  test('repeated start and stop does not throw', async () => {
    for (let i = 0; i < 10; i++) {
      webServer.isRunning = false;
      if (!webServer.server) {
        webServer.initialize();
      }
      webServer.start();
      webServer.isRunning = true;
      await webServer.stop();
    }
    expect(webServer.isRunning).toBe(false);
  });
});

describe('WebServer - Real-world Scenarios', () => {
  let webServer;
  beforeEach(() => {
    jest.clearAllMocks();
    webServer = new WebServer();
    // Initialize the server properly
    webServer.initialize();
    webServer.isRunning = true;
  });
  test('broadcastNameDisplay to multiple events', () => {
    for (let i = 0; i < 3; i++) {
      webServer.broadcastNameDisplay({ Member1: `Member${i}`, LastName: `LastName${i}` });
    }
    expect(mockIo.emit).toHaveBeenCalled();
  });
  test('broadcastSlideshowUpdate for multiple slides', () => {
    for (let i = 0; i < 5; i++) {
      webServer.broadcastSlideshowUpdate(i);
    }
    expect(mockIo.emit).toHaveBeenCalledWith('slideshow-update', { slideIndex: 4 });
  });
}); 