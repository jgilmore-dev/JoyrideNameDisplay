const { autoUpdater } = require('electron-updater');
const { app, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const configManager = require('./config/configManager');

class OfflineUpdater {
  constructor() {
    this.isUpdateAvailable = false;
    this.updateInfo = null;
    this.updateProgress = 0;
    this.isUpdating = false;
    
    // Configure autoUpdater for offline updates
    this.configureAutoUpdater();
    
    // Set up IPC handlers
    this.setupIpcHandlers();
  }

  configureAutoUpdater() {
    // Disable automatic update checking
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    
    // Set up event listeners
    autoUpdater.on('checking-for-update', () => {
      console.log('[Updater] Checking for updates...');
      this.broadcastUpdateStatus('checking');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('[Updater] Update available:', info);
      this.isUpdateAvailable = true;
      this.updateInfo = info;
      this.broadcastUpdateStatus('available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('[Updater] Update not available:', info);
      this.isUpdateAvailable = false;
      this.updateInfo = null;
      this.broadcastUpdateStatus('not-available', info);
    });

    autoUpdater.on('error', (err) => {
      console.error('[Updater] Error:', err);
      this.broadcastUpdateStatus('error', { error: err.message });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.updateProgress = progressObj.percent;
      this.broadcastUpdateStatus('download-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('[Updater] Update downloaded:', info);
      this.isUpdating = false;
      this.broadcastUpdateStatus('downloaded', info);
    });
  }

  setupIpcHandlers() {
    const channels = configManager.getIpcChannels();

    // Check for updates
    ipcMain.handle(channels.checkForUpdates, async () => {
      try {
        await this.checkForUpdates();
        return { success: true };
      } catch (error) {
        console.error('[Updater] Check for updates failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Download update
    ipcMain.handle(channels.downloadUpdate, async () => {
      try {
        await this.downloadUpdate();
        return { success: true };
      } catch (error) {
        console.error('[Updater] Download update failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Install update
    ipcMain.handle(channels.installUpdate, async () => {
      try {
        await this.installUpdate();
        return { success: true };
      } catch (error) {
        console.error('[Updater] Install update failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Get update status
    ipcMain.handle(channels.getUpdateStatus, () => {
      return {
        isUpdateAvailable: this.isUpdateAvailable,
        updateInfo: this.updateInfo,
        updateProgress: this.updateProgress,
        isUpdating: this.isUpdating
      };
    });
  }

  async checkForUpdates() {
    console.log('[Updater] Starting update check...');
    
    // Try multiple update sources
    const updateSources = this.getUpdateSources();
    
    for (const source of updateSources) {
      try {
        console.log(`[Updater] Checking source: ${source.name}`);
        
        if (source.type === 'local') {
          await this.checkLocalUpdate(source.path);
        } else if (source.type === 'network') {
          await this.checkNetworkUpdate(source.path);
        }
        
        // If we found an update, stop checking other sources
        if (this.isUpdateAvailable) {
          break;
        }
      } catch (error) {
        console.warn(`[Updater] Failed to check source ${source.name}:`, error);
        // Continue to next source
      }
    }
  }

  getUpdateSources() {
    const sources = [];
    
    // Local update directory (same directory as executable)
    const localUpdateDir = path.join(process.resourcesPath, 'updates');
    sources.push({
      name: 'Local Updates',
      type: 'local',
      path: localUpdateDir
    });
    
    // Network share (configurable)
    const networkShare = process.env.JOYRIDE_UPDATE_SHARE;
    if (networkShare) {
      sources.push({
        name: 'Network Share',
        type: 'network',
        path: networkShare
      });
    }
    
    // USB drive detection (common drive letters)
    const driveLetters = ['D:', 'E:', 'F:', 'G:', 'H:', 'I:', 'J:', 'K:'];
    for (const drive of driveLetters) {
      const usbUpdateDir = path.join(drive, 'JoyRideUpdates');
      if (fs.existsSync(usbUpdateDir)) {
        sources.push({
          name: `USB Drive (${drive})`,
          type: 'local',
          path: usbUpdateDir
        });
      }
    }
    
    return sources;
  }

  async checkLocalUpdate(updateDir) {
    if (!fs.existsSync(updateDir)) {
      console.log(`[Updater] Update directory does not exist: ${updateDir}`);
      return;
    }

    // Look for update files
    const files = fs.readdirSync(updateDir);
    const updateFile = files.find(file => 
      file.endsWith('.exe') && 
      file.includes('JoyRide') && 
      file.includes('Setup')
    );

    if (updateFile) {
      const updatePath = path.join(updateDir, updateFile);
      console.log(`[Updater] Found local update: ${updatePath}`);
      
      // Set the update file path for autoUpdater
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: `file://${updatePath}`
      });
      
      // Check for update
      await autoUpdater.checkForUpdates();
    }
  }

  async checkNetworkUpdate(networkPath) {
    // Similar to local update but for network paths
    try {
      const files = fs.readdirSync(networkPath);
      const updateFile = files.find(file => 
        file.endsWith('.exe') && 
        file.includes('JoyRide') && 
        file.includes('Setup')
      );

      if (updateFile) {
        const updatePath = path.join(networkPath, updateFile);
        console.log(`[Updater] Found network update: ${updatePath}`);
        
        autoUpdater.setFeedURL({
          provider: 'generic',
          url: `file://${updatePath}`
        });
        
        await autoUpdater.checkForUpdates();
      }
    } catch (error) {
      console.warn(`[Updater] Network update check failed:`, error);
    }
  }

  async downloadUpdate() {
    if (!this.isUpdateAvailable) {
      throw new Error('No update available to download');
    }

    console.log('[Updater] Starting download...');
    this.isUpdating = true;
    this.broadcastUpdateStatus('downloading');
    
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      this.isUpdating = false;
      throw error;
    }
  }

  async installUpdate() {
    if (!this.isUpdateAvailable) {
      throw new Error('No update available to install');
    }

    console.log('[Updater] Installing update...');
    
    // Show confirmation dialog
    const result = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Install Now', 'Later'],
      defaultId: 0,
      title: 'Update Available',
      message: 'A new version of JoyRide Name Display is ready to install.',
      detail: `Version ${this.updateInfo.version} is ready to install. The application will restart after installation.`
    });

    if (result.response === 0) {
      // Install and restart
      autoUpdater.quitAndInstall();
    }
  }

  broadcastUpdateStatus(status, data = {}) {
    const channels = configManager.getIpcChannels();
    
    // Broadcast to all windows
    const { BrowserWindow } = require('electron');
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send(channels.updateStatus, { status, data });
      }
    });
  }

  // Manual update installation from file
  async installFromFile(filePath) {
    try {
      console.log(`[Updater] Installing from file: ${filePath}`);
      
      // Set the update file
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: `file://${filePath}`
      });
      
      // Check and install
      await autoUpdater.checkForUpdates();
      
      if (this.isUpdateAvailable) {
        await this.downloadUpdate();
        await this.installUpdate();
      } else {
        throw new Error('Invalid update file');
      }
    } catch (error) {
      console.error('[Updater] Install from file failed:', error);
      throw error;
    }
  }
}

module.exports = OfflineUpdater; 