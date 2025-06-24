const { autoUpdater } = require('electron-updater');
const { app, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const configManager = require('./config/configManager');

class ControlPanelUpdater {
  constructor() {
    this.isUpdateAvailable = false;
    this.updateInfo = null;
    this.updateProgress = 0;
    this.isUpdating = false;
    this.lastCheckTime = null;
    this.checkInterval = null;
    this.updateChannel = this.getUpdateChannel();
    this.channelFile = path.join(app.getPath('userData'), '.update-channel');
    
    // Configure autoUpdater
    this.configureAutoUpdater();
    
    // Set up IPC handlers
    this.setupIpcHandlers();
    
    // Start automatic update checking
    this.startAutoUpdateCheck();
  }

  getUpdateChannel() {
    try {
      if (fs.existsSync(this.channelFile)) {
        const channel = fs.readFileSync(this.channelFile, 'utf8').trim();
        return channel === 'testing' ? 'testing' : 'stable';
      }
    } catch (error) {
      console.error('[ControlPanelUpdater] Error reading channel file:', error);
    }
    return 'stable'; // Default to stable
  }

  setUpdateChannel(channel) {
    try {
      this.updateChannel = channel;
      fs.writeFileSync(this.channelFile, channel);
      console.log(`[ControlPanelUpdater] Update channel set to: ${channel}`);
      return true;
    } catch (error) {
      console.error('[ControlPanelUpdater] Error setting channel:', error);
      return false;
    }
  }

  configureAutoUpdater() {
    // Configure for manual control
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    
    // Set up event listeners
    autoUpdater.on('checking-for-update', () => {
      console.log('[ControlPanelUpdater] Checking for updates...');
      this.broadcastUpdateStatus('checking');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('[ControlPanelUpdater] Update available:', info);
      this.isUpdateAvailable = true;
      this.updateInfo = info;
      this.broadcastUpdateStatus('available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('[ControlPanelUpdater] Update not available:', info);
      this.isUpdateAvailable = false;
      this.updateInfo = null;
      this.broadcastUpdateStatus('not-available', info);
    });

    autoUpdater.on('error', (err) => {
      console.error('[ControlPanelUpdater] Error:', err);
      this.broadcastUpdateStatus('error', { error: err.message });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.updateProgress = progressObj.percent;
      this.broadcastUpdateStatus('download-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('[ControlPanelUpdater] Update downloaded:', info);
      this.isUpdating = false;
      this.broadcastUpdateStatus('downloaded', info);
    });
  }

  setupIpcHandlers() {
    const channels = configManager.getIpcChannels();

    // Check for updates manually
    ipcMain.handle('check-for-updates', async () => {
      try {
        await this.checkForUpdates();
        return { success: true };
      } catch (error) {
        console.error('[ControlPanelUpdater] Check for updates failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Download update
    ipcMain.handle('download-update', async () => {
      try {
        await this.downloadUpdate();
        return { success: true };
      } catch (error) {
        console.error('[ControlPanelUpdater] Download update failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Install update
    ipcMain.handle('install-update', async () => {
      try {
        await this.installUpdate();
        return { success: true };
      } catch (error) {
        console.error('[ControlPanelUpdater] Install update failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Get update status
    ipcMain.handle('get-update-status', () => {
      return {
        isUpdateAvailable: this.isUpdateAvailable,
        updateInfo: this.updateInfo,
        updateProgress: this.updateProgress,
        isUpdating: this.isUpdating,
        lastCheckTime: this.lastCheckTime,
        currentVersion: app.getVersion()
      };
    });

    // Open GitHub releases
    ipcMain.handle('open-github-releases', () => {
      shell.openExternal('https://github.com/jgilmore-dev/MemberNameDisplay/releases');
      return { success: true };
    });

    // Toggle auto-update checking
    ipcMain.handle('toggle-auto-update', (event, enabled) => {
      if (enabled) {
        this.startAutoUpdateCheck();
      } else {
        this.stopAutoUpdateCheck();
      }
      return { success: true };
    });

    // Get current update channel
    ipcMain.handle('get-update-channel', () => {
      return {
        channel: this.updateChannel,
        availableChannels: ['stable', 'testing']
      };
    });

    // Set update channel
    ipcMain.handle('set-update-channel', (event, channel) => {
      if (channel !== 'stable' && channel !== 'testing') {
        return { success: false, error: 'Invalid channel. Use "stable" or "testing".' };
      }
      
      const success = this.setUpdateChannel(channel);
      if (success) {
        // Trigger an immediate update check with the new channel
        setTimeout(async () => {
          try {
            await this.checkForUpdates();
          } catch (error) {
            console.error('[ControlPanelUpdater] Channel change update check failed:', error);
          }
        }, 1000);
      }
      
      return { success, channel };
    });
  }

  startAutoUpdateCheck() {
    // Check every 6 hours (21600000 ms)
    this.checkInterval = setInterval(async () => {
      try {
        await this.checkForUpdates();
      } catch (error) {
        console.error('[ControlPanelUpdater] Auto update check failed:', error);
      }
    }, 21600000);
    
    // Also check on startup
    setTimeout(async () => {
      try {
        await this.checkForUpdates();
      } catch (error) {
        console.error('[ControlPanelUpdater] Startup update check failed:', error);
      }
    }, 30000); // Check 30 seconds after startup
  }

  stopAutoUpdateCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async checkForUpdates() {
    console.log(`[ControlPanelUpdater] Starting update check on ${this.updateChannel} channel...`);
    this.lastCheckTime = new Date();
    
    try {
      if (this.updateChannel === 'testing') {
        // For testing channel, check for latest development version
        await this.checkTestingUpdates();
      } else {
        // For stable channel, check GitHub releases
        await this.checkGitHubUpdates();
      }
    } catch (error) {
      console.warn(`[ControlPanelUpdater] ${this.updateChannel} channel update check failed:`, error);
      
      // Fallback to local update sources
      await this.checkLocalUpdateSources();
    }
  }

  async checkTestingUpdates() {
    return new Promise((resolve, reject) => {
      // For testing channel, we'll check for the latest commit or pre-release
      const options = {
        hostname: 'api.github.com',
        path: '/repos/jgilmore-dev/MemberNameDisplay/releases',
        method: 'GET',
        headers: {
          'User-Agent': 'MemberNameDisplay-Updater/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const releases = JSON.parse(data);
            
            // Look for pre-releases first
            const preRelease = releases.find(release => release.prerelease);
            if (preRelease) {
              this.handleUpdateAvailable(preRelease);
              resolve();
              return;
            }
            
            // If no pre-release, check the latest commit
            this.checkLatestCommit().then(resolve).catch(reject);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async checkLatestCommit() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: '/repos/jgilmore-dev/MemberNameDisplay/commits/main',
        method: 'GET',
        headers: {
          'User-Agent': 'MemberNameDisplay-Updater/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const commit = JSON.parse(data);
            const commitHash = commit.sha.substring(0, 7);
            const currentVersion = app.getVersion();
            
            // Create a mock release info for the commit
            const mockRelease = {
              tag_name: `dev-${commitHash}`,
              name: `Development Build (${commitHash})`,
              body: `Latest development version from commit ${commitHash}`,
              prerelease: true,
              published_at: commit.commit.author.date
            };
            
            // For testing channel, always consider it an update
            this.handleUpdateAvailable(mockRelease);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  handleUpdateAvailable(release) {
    const latestVersion = release.tag_name.replace('v', '');
    const currentVersion = app.getVersion();
    
    console.log(`[ControlPanelUpdater] Found ${this.updateChannel} channel update:`, {
      current: currentVersion,
      latest: latestVersion,
      release: release
    });
    
    this.isUpdateAvailable = true;
    this.updateInfo = {
      version: latestVersion,
      releaseNotes: release.body || '',
      releaseDate: release.published_at,
      channel: this.updateChannel
    };
    
    this.broadcastUpdateStatus('available', this.updateInfo);
  }

  async checkGitHubUpdates() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: '/repos/jgilmore-dev/MemberNameDisplay/releases/latest',
        method: 'GET',
        headers: {
          'User-Agent': 'MemberNameDisplay-Updater/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            const latestVersion = release.tag_name.replace('v', '');
            const currentVersion = app.getVersion();
            
            console.log(`[ControlPanelUpdater] GitHub release check:`, {
              current: currentVersion,
              latest: latestVersion,
              release: release
            });
            
            // Only consider it an update if the version is newer
            if (this.compareVersions(latestVersion, currentVersion) > 0) {
              this.handleUpdateAvailable(release);
            } else {
              console.log('[ControlPanelUpdater] No newer stable release available');
              this.isUpdateAvailable = false;
              this.updateInfo = null;
              this.broadcastUpdateStatus('not-available', { version: latestVersion });
            }
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  findPlatformInstaller(assets) {
    const platform = process.platform;
    const arch = process.arch;
    
    // Define platform-specific patterns
    const patterns = {
      win32: [
        /MemberNameDisplay.*Setup.*\.exe$/i,
        /MemberNameDisplay.*win32.*\.exe$/i,
        /MemberNameDisplay.*windows.*\.exe$/i
      ],
      darwin: [
        /MemberNameDisplay.*\.dmg$/i,
        /MemberNameDisplay.*mac.*\.dmg$/i,
        /MemberNameDisplay.*\.app\.tar\.gz$/i,
        /MemberNameDisplay.*\.pkg$/i
      ],
      linux: [
        /MemberNameDisplay.*\.deb$/i,
        /MemberNameDisplay.*\.rpm$/i,
        /MemberNameDisplay.*\.AppImage$/i,
        /MemberNameDisplay.*linux.*\.AppImage$/i
      ]
    };
    
    const platformPatterns = patterns[platform] || [];
    
    // Find matching installer
    for (const pattern of platformPatterns) {
      const installer = assets.find(asset => pattern.test(asset.name));
      if (installer) {
        console.log(`[ControlPanelUpdater] Found platform installer: ${installer.name}`);
        return installer;
      }
    }
    
    // Fallback: look for any installer with platform name
    const fallbackPattern = new RegExp(`MemberNameDisplay.*${platform}.*`, 'i');
    const fallbackInstaller = assets.find(asset => fallbackPattern.test(asset.name));
    
    if (fallbackInstaller) {
      console.log(`[ControlPanelUpdater] Found fallback installer: ${fallbackInstaller.name}`);
      return fallbackInstaller;
    }
    
    console.warn(`[ControlPanelUpdater] No suitable installer found for platform: ${platform}`);
    return null;
  }

  async checkLocalUpdateSources() {
    const sources = this.getLocalUpdateSources();
    
    for (const source of sources) {
      try {
        console.log(`[ControlPanelUpdater] Checking local source: ${source.name}`);
        
        if (source.type === 'local') {
          await this.checkLocalUpdate(source.path);
        } else if (source.type === 'network') {
          await this.checkNetworkUpdate(source.path);
        }
        
        if (this.isUpdateAvailable) {
          break;
        }
      } catch (error) {
        console.warn(`[ControlPanelUpdater] Failed to check source ${source.name}:`, error);
      }
    }
  }

  getLocalUpdateSources() {
    const sources = [];
    
    // Local update directory
    const localUpdateDir = path.join(process.resourcesPath, 'updates');
    sources.push({
      name: 'Local Updates',
      type: 'local',
      path: localUpdateDir
    });
    
    // Network share
    const networkShare = process.env.MEMBERNAMEDISPLAY_UPDATE_SHARE;
    if (networkShare) {
      sources.push({
        name: 'Network Share',
        type: 'network',
        path: networkShare
      });
    }
    
    // USB drives
    const driveLetters = ['D:', 'E:', 'F:', 'G:', 'H:', 'I:', 'J:', 'K:'];
    for (const drive of driveLetters) {
      const usbUpdateDir = path.join(drive, 'MemberNameDisplayUpdates');
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
      return;
    }

    const files = fs.readdirSync(updateDir);
    const updateFile = files.find(file => this.isInstallerFile(file));

    if (updateFile) {
      const updatePath = path.join(updateDir, updateFile);
      console.log(`[ControlPanelUpdater] Found local update: ${updatePath}`);
      
      // Extract version from filename or use file modification time
      const version = this.extractVersionFromFilename(updateFile) || 
                     new Date(fs.statSync(updatePath).mtime).toISOString();
      
      this.isUpdateAvailable = true;
      this.updateInfo = {
        version: version,
        source: 'local',
        filePath: updatePath
      };
      this.broadcastUpdateStatus('available', this.updateInfo);
    }
  }

  isInstallerFile(filename) {
    const platform = process.platform;
    const nameLower = filename.toLowerCase();
    
    // Check if filename contains required elements
    const hasMember = nameLower.includes('member') || nameLower.includes('membername');
    const hasSetup = nameLower.includes('setup') || nameLower.includes('install');
    
    if (!hasMember || !hasSetup) {
      return false;
    }
    
    // Platform-specific extensions
    if (platform === 'win32') {
      return filename.endsWith('.exe');
    } else if (platform === 'darwin') {
      return filename.endsWith('.dmg') || filename.endsWith('.app') || filename.endsWith('.pkg');
    } else if (platform === 'linux') {
      return filename.endsWith('.deb') || filename.endsWith('.rpm') || filename.endsWith('.AppImage');
    }
    
    return false;
  }

  async checkNetworkUpdate(networkPath) {
    // Implementation for network update checking
    // This would check a network share for updates
    console.log(`[ControlPanelUpdater] Checking network path: ${networkPath}`);
  }

  async downloadUpdate() {
    if (!this.isUpdateAvailable || !this.updateInfo) {
      throw new Error('No update available to download');
    }

    this.isUpdating = true;
    this.broadcastUpdateStatus('downloading');

    if (this.updateInfo.downloadUrl) {
      // Download from GitHub
      await this.downloadFromUrl(this.updateInfo.downloadUrl);
    } else if (this.updateInfo.filePath) {
      // Local file - just copy it
      await this.copyLocalUpdate(this.updateInfo.filePath);
    } else {
      throw new Error('No download source available');
    }
  }

  async downloadFromUrl(url) {
    return new Promise((resolve, reject) => {
      const fileName = url.split('/').pop();
      const downloadPath = path.join(app.getPath('temp'), fileName);
      
      const file = fs.createWriteStream(downloadPath);
      const protocol = url.startsWith('https:') ? https : http;
      
      const req = protocol.get(url, (res) => {
        const totalSize = parseInt(res.headers['content-length'], 10);
        let downloadedSize = 0;
        
        res.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const progress = (downloadedSize / totalSize) * 100;
          this.updateProgress = progress;
          this.broadcastUpdateStatus('download-progress', { percent: progress });
        });
        
        res.pipe(file);
        
        file.on('finish', () => {
          file.close();
          this.updateInfo.localPath = downloadPath;
          this.broadcastUpdateStatus('downloaded', this.updateInfo);
          resolve();
        });
      });

      req.on('error', (error) => {
        fs.unlink(downloadPath, () => {}); // Delete partial file
        reject(error);
      });
    });
  }

  async copyLocalUpdate(filePath) {
    const fileName = path.basename(filePath);
    const tempPath = path.join(app.getPath('temp'), fileName);
    
    // Copy file to temp directory
    fs.copyFileSync(filePath, tempPath);
    this.updateInfo.localPath = tempPath;
    this.broadcastUpdateStatus('downloaded', this.updateInfo);
  }

  async installUpdate() {
    if (!this.updateInfo || !this.updateInfo.localPath) {
      throw new Error('No update downloaded to install');
    }

    try {
      const platform = process.platform;
      const installerPath = this.updateInfo.localPath;
      
      if (platform === 'win32') {
        // Windows installer
        const { exec } = require('child_process');
        exec(`"${installerPath}" /SILENT`, (error) => {
          if (error) {
            console.error('[ControlPanelUpdater] Installer execution failed:', error);
            this.broadcastUpdateStatus('error', { error: 'Installation failed' });
          } else {
            app.quit();
          }
        });
      } else if (platform === 'darwin') {
        // macOS installer
        const { exec } = require('child_process');
        if (installerPath.endsWith('.dmg')) {
          // Mount DMG and install
          exec(`hdiutil attach "${installerPath}" && cp -R "/Volumes/Member Name Display/Member Name Display.app" "/Applications/" && hdiutil detach "/Volumes/Member Name Display"`, (error) => {
            if (error) {
              console.error('[ControlPanelUpdater] macOS installer failed:', error);
              this.broadcastUpdateStatus('error', { error: 'Installation failed' });
            } else {
              app.quit();
            }
          });
        } else {
          // Direct app replacement
          exec(`cp -R "${installerPath}" "/Applications/"`, (error) => {
            if (error) {
              console.error('[ControlPanelUpdater] macOS app copy failed:', error);
              this.broadcastUpdateStatus('error', { error: 'Installation failed' });
            } else {
              app.quit();
            }
          });
        }
      } else if (platform === 'linux') {
        // Linux installer
        const { exec } = require('child_process');
        if (installerPath.endsWith('.deb')) {
          exec(`sudo dpkg -i "${installerPath}"`, (error) => {
            if (error) {
              console.error('[ControlPanelUpdater] Debian installer failed:', error);
              this.broadcastUpdateStatus('error', { error: 'Installation failed' });
            } else {
              app.quit();
            }
          });
        } else if (installerPath.endsWith('.rpm')) {
          exec(`sudo rpm -i "${installerPath}"`, (error) => {
            if (error) {
              console.error('[ControlPanelUpdater] RPM installer failed:', error);
              this.broadcastUpdateStatus('error', { error: 'Installation failed' });
            } else {
              app.quit();
            }
          });
        } else if (installerPath.endsWith('.AppImage')) {
          exec(`chmod +x "${installerPath}" && "${installerPath}" --install`, (error) => {
            if (error) {
              console.error('[ControlPanelUpdater] AppImage installer failed:', error);
              this.broadcastUpdateStatus('error', { error: 'Installation failed' });
            } else {
              app.quit();
            }
          });
        } else {
          // Use electron-updater for other formats
          autoUpdater.quitAndInstall();
        }
      } else {
        // Fallback to electron-updater for unknown platforms
        autoUpdater.quitAndInstall();
      }
    } catch (error) {
      console.error('[ControlPanelUpdater] Installation failed:', error);
      this.broadcastUpdateStatus('error', { error: error.message });
    }
  }

  compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  extractVersionFromFilename(filename) {
    const versionMatch = filename.match(/v?(\d+\.\d+\.\d+)/i);
    return versionMatch ? versionMatch[1] : null;
  }

  broadcastUpdateStatus(status, data = {}) {
    const channels = configManager.getIpcChannels();
    const updateData = {
      ...data,
      channel: this.updateChannel,
      timestamp: new Date().toISOString()
    };
    
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('update-status-changed', {
        status,
        data: updateData
      });
    }
  }

  cleanup() {
    this.stopAutoUpdateCheck();
  }
}

module.exports = ControlPanelUpdater; 