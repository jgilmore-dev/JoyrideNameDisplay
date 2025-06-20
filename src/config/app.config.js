/**
 * Application Configuration
 * Centralized configuration for all application settings and constants
 */

module.exports = {
  // Slideshow Configuration
  slideshow: {
    interval: 20000, // 20 seconds between slides
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },

  // Banner Configuration
  banners: {
    defaultFontColor: '#8B9091',
    maxBanners: 10,
    defaultSettings: {
      banners: [
        { id: 1, enabled: false, display: 0 },
        { id: 2, enabled: false, display: 1 }
      ],
      fontColor: '#8B9091'
    }
  },

  // Data Management Configuration
  data: {
    supportedCsvFormats: ['csv'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    memberFields: ['Member1', 'Member2', 'Member3', 'Member4', 'LastName'],
    idPrefixes: {
      csv: 'csv',
      manual: 'manual'
    }
  },

  // Window Configuration
  windows: {
    controlPanel: {
      width: 900,
      height: 700,
      title: 'JoyRide Control Panel',
      minWidth: 800,
      minHeight: 600
    },
    banner: {
      fullscreen: true,
      frame: false,
      title: 'JoyRide Banner'
    }
  },

  // File Paths
  paths: {
    mediaDir: 'slideshow_media',
    settingsFile: 'settings.json',
    iconsDir: 'assets/icons'
  },

  // Development Configuration
  development: {
    devTools: {
      mode: 'detach',
      openOnStart: true
    },
    logging: {
      level: 'info',
      enableConsoleLogs: true
    }
  },

  // IPC Channel Names
  ipc: {
    channels: {
      // Main -> Renderer (one-way)
      displayName: 'display-name',
      clearName: 'clear-name',
      setBannerNumberVisibility: 'set-banner-number-visibility',
      slideshowUpdated: 'slideshow-updated',
      setSlide: 'set-slide',
      setFontColor: 'set-font-color',

      // Renderer -> Main (one-way)
      toggleBannerNumber: 'toggle-banner-number',
      rendererReady: 'renderer-ready',
      updateFontColor: 'update-font-color',

      // Two-way communication
      loadCsv: 'load-csv',
      getMembers: 'get-members',
      addMember: 'add-member',
      updateMember: 'update-member',
      markAsDisplayed: 'mark-as-displayed',
      importImages: 'import-images',
      getSlideshowImages: 'get-slideshow-images',
      clearSlideshowCache: 'clear-slideshow-cache',
      getCurrentSlideIndex: 'get-current-slide-index',
      bannerDisplay: 'banner-display',
      bannerClear: 'banner-clear',
      getSettings: 'get-settings',
      saveSettings: 'save-settings',
      applyDisplaySettings: 'apply-display-settings',
      getAvailableDisplays: 'get-available-displays'
    }
  },

  // Error Messages
  errors: {
    fileSelectionCanceled: 'File selection was canceled.',
    csvParseError: 'Error parsing CSV file:',
    imageImportError: 'Error importing slideshow images:',
    settingsLoadError: 'Error loading settings:',
    settingsSaveError: 'Error saving settings:',
    displaySettingsError: 'Error applying display settings:',
    memberNotFound: 'Member not found',
    invalidBannerId: 'Invalid banner ID',
    invalidDisplayIndex: 'Invalid display index'
  },

  // Success Messages
  messages: {
    imagesImported: (count) => `${count} new image(s) imported successfully.`,
    noNewImages: 'No new images were imported. The files may already exist.',
    slideshowCleared: 'Slideshow images have been cleared.',
    settingsSaved: 'Settings saved successfully.',
    memberAdded: 'Member added successfully.',
    memberUpdated: 'Member updated successfully.'
  }
}; 