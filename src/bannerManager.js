const { BrowserWindow, screen } = require('electron');
const path = require('node:path');
const fs = require('fs');
const configManager = require('./config/configManager');

class BannerManager {
  constructor() {
    this.banners = new Map(); // bannerId -> BrowserWindow
    this.settings = configManager.getDefaultBannerSettings();
    this.readyWindows = 0;
    this.expectedWindows = 0;
    this.onAllWindowsReady = null;
  }

  // Load settings from file
  loadSettings() {
    try {
      const settingsPath = path.join(require('electron').app.getPath('userData'), configManager.getPaths().settingsFile);
      if (fs.existsSync(settingsPath)) {
        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        const loadedSettings = JSON.parse(settingsData);
        
        // Convert old format to new format if needed
        if (loadedSettings.banner1Enabled !== undefined) {
          this.settings = {
            banners: [
              { id: 1, enabled: loadedSettings.banner1Enabled || false, display: loadedSettings.banner1Display || 0 },
              { id: 2, enabled: loadedSettings.banner2Enabled || false, display: loadedSettings.banner2Display || 1 }
            ],
            fontColor: loadedSettings.fontColor || configManager.getBannerConfig().defaultFontColor
          };
        } else {
          this.settings = { ...this.settings, ...loadedSettings };
        }
        
        // Validate settings against configuration
        configManager.validateBannerSettings(this.settings);
        
        console.log('Loaded settings:', this.settings);
      } else {
        console.log('No settings file found, using defaults:', this.settings);
      }
    } catch (error) {
      console.error(configManager.getErrors().settingsLoadError, error);
      // Fall back to default settings
      this.settings = configManager.getDefaultBannerSettings();
    }
  }

  // Save settings to file
  saveSettings(settings) {
    try {
      // Validate settings before saving
      configManager.validateBannerSettings(settings);
      
      const settingsPath = path.join(require('electron').app.getPath('userData'), configManager.getPaths().settingsFile);
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      this.settings = settings;
    } catch (error) {
      console.error(configManager.getErrors().settingsSaveError, error);
      throw error;
    }
  }

  // Get display bounds for a specific display index
  getDisplayBounds(displayIndex) {
    const displays = screen.getAllDisplays();
    if (displayIndex >= 0 && displayIndex < displays.length) {
      return displays[displayIndex].bounds;
    }
    // Fallback to primary display
    return displays[0].bounds;
  }

  // Get available displays information
  getAvailableDisplays() {
    const displays = screen.getAllDisplays();
    return displays.map((display, index) => ({
      index,
      bounds: display.bounds,
      isPrimary: display.bounds.x === 0 && display.bounds.y === 0,
      name: `Display ${index + 1}${display.bounds.x === 0 && display.bounds.y === 0 ? ' (Primary)' : ''}`
    }));
  }

  // Get icon path
  getIconPath() {
    const assetsDir = path.join(__dirname, configManager.getPaths().iconsDir);
    let iconPath = null;
    
    if (fs.existsSync(assetsDir)) {
      iconPath = fs.existsSync(path.join(assetsDir, 'app-icon.ico')) 
        ? path.join(assetsDir, 'app-icon.ico')
        : path.join(assetsDir, 'app-icon-512.png');
    }
    
    return iconPath && fs.existsSync(iconPath) ? iconPath : null;
  }

  // Create a single banner window
  createBannerWindow(bannerId, displayIndex, settings) {
    const bounds = this.getDisplayBounds(displayIndex);
    const iconPath = this.getIconPath();
    const windowConfig = configManager.getWindowConfig().banner;
    
    console.log(`[BannerManager] Attempting to create Banner ${bannerId} on display ${displayIndex} with bounds:`, bounds);
    console.log(`[BannerManager] Banner config:`, settings);
    
    const bannerConfig = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      fullscreen: windowConfig.fullscreen,
      frame: windowConfig.frame,
      webPreferences: {
        preload: RENDERER_PRELOAD_WEBPACK_ENTRY,
      },
      title: `${windowConfig.title} ${bannerId}`,
      show: true,
    };
    
    if (iconPath) {
      bannerConfig.icon = iconPath;
    }
    
    try {
      const bannerWindow = new BrowserWindow(bannerConfig);
      bannerWindow.loadURL(RENDERER_WEBPACK_ENTRY + `?banner=${bannerId}`);
      bannerWindow.setMenu(null);
      
      const devConfig = configManager.getDevelopmentConfig();
      if (!require('electron').app.isPackaged && devConfig.devTools.openOnStart) {
        bannerWindow.webContents.openDevTools({ mode: devConfig.devTools.mode });
      }
      
      // Set font color after window is ready
      setTimeout(() => {
        if (bannerWindow && !bannerWindow.isDestroyed()) {
          const channels = configManager.getIpcChannels();
          bannerWindow.webContents.send(channels.setFontColor, settings.fontColor);
        }
      }, 1000);
      
      // Add window cleanup listeners to prevent memory leaks
      bannerWindow.on('closed', () => {
        console.log(`[BannerManager] Banner ${bannerId} window closed, removing from map`);
        this.banners.delete(bannerId);
      });
      
      bannerWindow.on('unresponsive', () => {
        console.warn(`[BannerManager] Banner ${bannerId} window became unresponsive`);
      });
      
      bannerWindow.on('responsive', () => {
        console.log(`[BannerManager] Banner ${bannerId} window became responsive again`);
      });
      
      return bannerWindow;
    } catch (err) {
      console.error(`[BannerManager] Failed to create Banner ${bannerId}:`, err);
      return null;
    }
  }

  // Create all banner windows based on settings
  createAllBanners(settings = null) {
    if (settings) {
      this.settings = settings;
    }
    
    // Close existing banners
    this.closeAllBanners();
    
    // Reset ready counter
    this.readyWindows = 0;
    this.expectedWindows = this.settings.banners.filter(b => b.enabled).length;
    
    console.log(`[BannerManager] Creating banners. Enabled count: ${this.expectedWindows}`);
    // Create enabled banners
    this.settings.banners.forEach(bannerConfig => {
      console.log(`[BannerManager] Banner config:`, bannerConfig);
      if (bannerConfig.enabled && bannerConfig.targetType === 'local') {
        const bannerWindow = this.createBannerWindow(
          bannerConfig.id, 
          bannerConfig.display, 
          this.settings
        );
        if (bannerWindow) {
          this.banners.set(bannerConfig.id, bannerWindow);
        } else {
          console.error(`[BannerManager] Banner window for id ${bannerConfig.id} was not created.`);
        }
      }
    });
    
    console.log(`[BannerManager] Created ${this.banners.size} banner windows`);
  }

  // Close all banner windows
  closeAllBanners() {
    this.banners.forEach((window, id) => {
      if (window && !window.isDestroyed()) {
        console.log(`Closing Banner ${id} window`);
        window.close();
      }
    });
    this.banners.clear();
  }

  // Get a specific banner window
  getBanner(bannerId) {
    return this.banners.get(bannerId);
  }

  // Send message to a specific banner
  sendToBanner(bannerId, event, data) {
    const banner = this.getBanner(bannerId);
    if (banner && !banner.isDestroyed()) {
      banner.webContents.send(event, data);
    }
  }

  // Broadcast message to all banners
  broadcastToBanners(event, data) {
    this.banners.forEach((banner, id) => {
      if (banner && !banner.isDestroyed()) {
        banner.webContents.send(event, data);
      }
    });
  }

  // Handle renderer ready event
  handleRendererReady() {
    this.readyWindows++;
    console.log(`Banner ready: ${this.readyWindows}/${this.expectedWindows}`);
    
    if (this.readyWindows === this.expectedWindows && this.onAllWindowsReady) {
      this.onAllWindowsReady();
    }
  }

  // Set callback for when all windows are ready
  setOnAllWindowsReady(callback) {
    this.onAllWindowsReady = callback;
  }

  // Get current settings
  getSettings() {
    return this.settings;
  }

  // Update settings and recreate banners if needed
  updateSettings(newSettings) {
    try {
      console.log(`[BannerManager] updateSettings called with:`, newSettings);
      const oldSettings = { ...this.settings };
      console.log(`[BannerManager] Old settings:`, oldSettings);
      
      // Check if banner configuration changed BEFORE updating settings
      const bannersChanged = JSON.stringify(oldSettings.banners) !== JSON.stringify(newSettings.banners);
      console.log(`[BannerManager] Banners changed: ${bannersChanged}`);
      console.log(`[BannerManager] Old banners:`, oldSettings.banners);
      console.log(`[BannerManager] New banners:`, newSettings.banners);
      
      // Close windows for banners that were enabled and are now disabled
      if (oldSettings && oldSettings.banners && newSettings && newSettings.banners) {
        oldSettings.banners.forEach(oldBanner => {
          const newBanner = newSettings.banners.find(b => b.id === oldBanner.id);
          if (oldBanner.enabled && newBanner && !newBanner.enabled) {
            const win = this.getBanner(oldBanner.id);
            if (win && !win.isDestroyed()) {
              console.log(`[BannerManager] Closing window for disabled banner ${oldBanner.id}`);
              win.close();
              this.banners.delete(oldBanner.id);
            }
          }
        });
      }
      
      // Update settings
      this.settings = newSettings;
      
      if (bannersChanged) {
        console.log(`[BannerManager] Calling createAllBanners() due to banner configuration change`);
        this.createAllBanners();
      } else if (oldSettings.fontColor !== newSettings.fontColor) {
        console.log(`[BannerManager] Only font color changed, updating banners`);
        // Only font color changed, update all banners
        const channels = configManager.getIpcChannels();
        this.broadcastToBanners(channels.setFontColor, newSettings.fontColor);
      } else {
        console.log(`[BannerManager] No relevant changes detected`);
      }
    } catch (error) {
      console.error(configManager.getErrors().displaySettingsError, error);
      throw error;
    }
  }

  // Get enabled banner IDs
  getEnabledBannerIds() {
    return this.settings.banners
      .filter(b => b.enabled)
      .map(b => b.id);
  }

  // Check if a banner is enabled
  isBannerEnabled(bannerId) {
    return this.settings.banners.some(b => b.id === bannerId && b.enabled);
  }

  // Example method showing how easy it is to add a third banner
  addBanner(bannerId, displayIndex = 0) {
    // Check if banner already exists
    if (this.settings.banners.some(b => b.id === bannerId)) {
      console.warn(`Banner ${bannerId} already exists`);
      return false;
    }

    // Check if we've reached the maximum number of banners
    const maxBanners = configManager.getBannerConfig().maxBanners;
    if (this.settings.banners.length >= maxBanners) {
      console.warn(`Maximum number of banners (${maxBanners}) reached`);
      return false;
    }

    // Add new banner to settings
    this.settings.banners.push({
      id: bannerId,
      enabled: false,
      display: displayIndex
    });

    console.log(`Added Banner ${bannerId} to configuration`);
    return true;
  }

  // Example method showing how to enable a third banner
  enableBanner(bannerId) {
    const banner = this.settings.banners.find(b => b.id === bannerId);
    if (banner) {
      banner.enabled = true;
      this.createAllBanners(); // Recreate banners with new configuration
      return true;
    }
    return false;
  }
}

module.exports = BannerManager; 