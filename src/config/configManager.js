const appConfig = require('./app.config');

/**
 * Configuration Manager
 * Handles loading, validating, and accessing application configuration
 */
class ConfigManager {
  constructor() {
    this.config = appConfig;
    this.validateConfig();
  }

  /**
   * Validates the configuration structure
   */
  validateConfig() {
    const requiredSections = [
      'slideshow', 'banners', 'data', 'windows', 
      'paths', 'development', 'ipc', 'errors', 'messages'
    ];

    for (const section of requiredSections) {
      if (!this.config[section]) {
        throw new Error(`Missing required configuration section: ${section}`);
      }
    }

    // Validate specific configuration values
    this.validateSlideshowConfig();
    this.validateBannerConfig();
    this.validateDataConfig();
  }

  /**
   * Validates slideshow configuration
   */
  validateSlideshowConfig() {
    const { slideshow } = this.config;
    
    if (typeof slideshow.interval !== 'number' || slideshow.interval <= 0) {
      throw new Error('Slideshow interval must be a positive number');
    }

    if (!Array.isArray(slideshow.supportedFormats) || slideshow.supportedFormats.length === 0) {
      throw new Error('Slideshow supported formats must be a non-empty array');
    }

    if (typeof slideshow.maxFileSize !== 'number' || slideshow.maxFileSize <= 0) {
      throw new Error('Slideshow max file size must be a positive number');
    }
  }

  /**
   * Validates banner configuration
   */
  validateBannerConfig() {
    const { banners } = this.config;
    
    if (typeof banners.maxBanners !== 'number' || banners.maxBanners <= 0) {
      throw new Error('Banner max count must be a positive number');
    }

    if (!banners.defaultSettings || !Array.isArray(banners.defaultSettings.banners)) {
      throw new Error('Banner default settings must include a banners array');
    }

    if (typeof banners.defaultFontColor !== 'string' || !banners.defaultFontColor.startsWith('#')) {
      throw new Error('Banner default font color must be a valid hex color');
    }
  }

  /**
   * Validates data configuration
   */
  validateDataConfig() {
    const { data } = this.config;
    
    if (!Array.isArray(data.supportedCsvFormats) || data.supportedCsvFormats.length === 0) {
      throw new Error('Data supported CSV formats must be a non-empty array');
    }

    if (!Array.isArray(data.memberFields) || data.memberFields.length === 0) {
      throw new Error('Data member fields must be a non-empty array');
    }

    if (!data.idPrefixes || typeof data.idPrefixes.csv !== 'string' || typeof data.idPrefixes.manual !== 'string') {
      throw new Error('Data ID prefixes must include csv and manual properties');
    }
  }

  /**
   * Gets the entire configuration object
   */
  getConfig() {
    return this.config;
  }

  /**
   * Gets a specific configuration section
   */
  getSection(section) {
    if (!this.config[section]) {
      throw new Error(`Configuration section '${section}' not found`);
    }
    return this.config[section];
  }

  /**
   * Gets a nested configuration value
   */
  get(path) {
    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        throw new Error(`Configuration path '${path}' not found`);
      }
    }

    return value;
  }

  /**
   * Gets slideshow configuration
   */
  getSlideshowConfig() {
    return this.getSection('slideshow');
  }

  /**
   * Gets banner configuration
   */
  getBannerConfig() {
    return this.getSection('banners');
  }

  /**
   * Gets data configuration
   */
  getDataConfig() {
    return this.getSection('data');
  }

  /**
   * Gets window configuration
   */
  getWindowConfig() {
    return this.getSection('windows');
  }

  /**
   * Get IPC channel names for communication between main and renderer processes
   */
  getIpcChannels() {
    return {
      // Data management
      loadCsv: 'load-csv',
      getMembers: 'get-members',
      addMember: 'add-member',
      updateMember: 'update-member',
      markAsDisplayed: 'mark-as-displayed',
      
      // Media management
      importImages: 'import-images',
      getSlideshowImages: 'get-slideshow-images',
      clearSlideshowCache: 'clear-slideshow-cache',
      getCurrentSlideIndex: 'get-current-slide-index',
      
      // Banner management
      bannerDisplay: 'banner-display',
      bannerClear: 'banner-clear',
      
      // Settings management
      getSettings: 'get-settings',
      saveSettings: 'save-settings',
      applyDisplaySettings: 'apply-display-settings',
      getAvailableDisplays: 'get-available-displays',
      
      // Renderer events
      displayName: 'display-name',
      clearName: 'clear-name',
      setBannerNumberVisibility: 'set-banner-number-visibility',
      slideshowUpdated: 'slideshow-updated',
      setSlide: 'set-slide',
      setFontColor: 'set-font-color',
      
      // Renderer to main
      toggleBannerNumber: 'toggle-banner-number',
      rendererReady: 'renderer-ready',
      updateFontColor: 'update-font-color',
      
      // Update management
      checkForUpdates: 'check-for-updates',
      downloadUpdate: 'download-update',
      installUpdate: 'install-update',
      getUpdateStatus: 'get-update-status',
      updateStatus: 'update-status'
    };
  }

  /**
   * Gets error messages
   */
  getErrors() {
    return this.getSection('errors');
  }

  /**
   * Gets success messages
   */
  getMessages() {
    return this.getSection('messages');
  }

  /**
   * Gets development configuration
   */
  getDevelopmentConfig() {
    return this.getSection('development');
  }

  /**
   * Gets file paths configuration
   */
  getPaths() {
    return this.getSection('paths');
  }

  /**
   * Validates banner settings against configuration
   */
  validateBannerSettings(settings) {
    const bannerConfig = this.getBannerConfig();
    
    if (!settings.banners || !Array.isArray(settings.banners)) {
      throw new Error('Banner settings must include a banners array');
    }

    if (settings.banners.length > bannerConfig.maxBanners) {
      throw new Error(`Maximum number of banners (${bannerConfig.maxBanners}) exceeded`);
    }

    for (const banner of settings.banners) {
      if (typeof banner.id !== 'number' || banner.id <= 0) {
        throw new Error('Banner ID must be a positive number');
      }

      if (typeof banner.enabled !== 'boolean') {
        throw new Error('Banner enabled must be a boolean');
      }

      if (!['local', 'pi'].includes(banner.targetType)) {
        throw new Error('Banner targetType must be "local" or "pi"');
      }

      if (banner.targetType === 'local') {
        if (typeof banner.targetId !== 'number' || banner.targetId < 0) {
          throw new Error('Banner targetId must be a non-negative number for local banners');
        }
        if (typeof banner.display !== 'number' || banner.display < 0) {
          throw new Error('Banner display must be a non-negative number for local banners');
        }
      } else if (banner.targetType === 'pi') {
        if (banner.targetId !== null && typeof banner.targetId !== 'string') {
          throw new Error('Banner targetId must be null or a string for pi banners');
        }
        // display is not required for pi banners
      }
    }

    if (settings.fontColor && !settings.fontColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      throw new Error('Font color must be a valid hex color');
    }

    return true;
  }

  /**
   * Gets default banner settings
   */
  getDefaultBannerSettings() {
    return this.getBannerConfig().defaultSettings;
  }

  /**
   * Checks if a file format is supported for slideshow
   */
  isSlideshowFormatSupported(format) {
    const supportedFormats = this.getSlideshowConfig().supportedFormats;
    return supportedFormats.includes(format.toLowerCase());
  }

  /**
   * Checks if a file format is supported for CSV
   */
  isCsvFormatSupported(format) {
    const supportedFormats = this.getDataConfig().supportedCsvFormats;
    return supportedFormats.includes(format.toLowerCase());
  }
}

// Create and export a singleton instance
const configManager = new ConfigManager();

module.exports = configManager; 