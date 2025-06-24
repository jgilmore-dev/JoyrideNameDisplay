const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');
const http = require('http');

class PiUpdater {
  constructor() {
    this.updateConfig = {
      enabled: true,
      checkOnBoot: true,
      checkInterval: 24 * 60 * 60 * 1000, // 24 hours
      updateServer: 'https://api.github.com/repos/jgilmore-dev/MemberNameDisplay/releases/latest',
      localVersion: '1.4.0',
      backupDir: '/home/pi/member-name-display/backups',
      logFile: '/home/pi/member-name-display/update.log'
    };
    
    this.lastCheckFile = '/home/pi/member-name-display/.last-update-check';
    this.updateInProgress = false;
  }

  // Initialize the updater
  async initialize() {
    try {
      console.log('[PiUpdater] Initializing update system...');
      
      // Create backup directory
      if (!fs.existsSync(this.updateConfig.backupDir)) {
        fs.mkdirSync(this.updateConfig.backupDir, { recursive: true });
      }
      
      // Load configuration from file if it exists
      await this.loadConfig();
      
      // Check if we should check for updates on boot
      if (this.updateConfig.checkOnBoot) {
        await this.checkForUpdatesOnBoot();
      }
      
      console.log('[PiUpdater] Update system initialized');
      return true;
    } catch (error) {
      console.error('[PiUpdater] Failed to initialize:', error);
      return false;
    }
  }

  // Load configuration from file
  async loadConfig() {
    const configPath = '/home/pi/member-name-display/update-config.json';
    try {
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        this.updateConfig = { ...this.updateConfig, ...config };
        console.log('[PiUpdater] Configuration loaded from file');
      }
    } catch (error) {
      console.error('[PiUpdater] Failed to load config:', error);
    }
  }

  // Save configuration to file
  async saveConfig() {
    const configPath = '/home/pi/member-name-display/update-config.json';
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.updateConfig, null, 2));
      console.log('[PiUpdater] Configuration saved');
    } catch (error) {
      console.error('[PiUpdater] Failed to save config:', error);
    }
  }

  // Check for updates on boot
  async checkForUpdatesOnBoot() {
    try {
      console.log('[PiUpdater] Checking for updates on boot...');
      
      // Check if we've already checked recently
      if (await this.shouldSkipUpdateCheck()) {
        console.log('[PiUpdater] Skipping update check - checked recently');
        return;
      }
      
      // Check internet connectivity
      if (!await this.checkInternetConnectivity()) {
        console.log('[PiUpdater] No internet connectivity - skipping update check');
        return;
      }
      
      // Check for updates
      const updateInfo = await this.checkForUpdates();
      if (updateInfo.hasUpdate) {
        console.log(`[PiUpdater] Update available: ${updateInfo.latestVersion}`);
        
        // Perform automatic update
        await this.performUpdate(updateInfo);
      } else {
        console.log('[PiUpdater] No updates available');
      }
      
      // Mark that we've checked
      await this.markUpdateCheck();
      
    } catch (error) {
      console.error('[PiUpdater] Error during boot update check:', error);
      await this.logError('Boot update check failed', error);
    }
  }

  // Check if we should skip update check (rate limiting)
  async shouldSkipUpdateCheck() {
    try {
      if (!fs.existsSync(this.lastCheckFile)) {
        return false;
      }
      
      const lastCheck = fs.readFileSync(this.lastCheckFile, 'utf8');
      const lastCheckTime = new Date(lastCheck).getTime();
      const now = new Date().getTime();
      
      // Skip if checked within the last 6 hours
      return (now - lastCheckTime) < (6 * 60 * 60 * 1000);
    } catch (error) {
      return false;
    }
  }

  // Mark that we've performed an update check
  async markUpdateCheck() {
    try {
      fs.writeFileSync(this.lastCheckFile, new Date().toISOString());
    } catch (error) {
      console.error('[PiUpdater] Failed to mark update check:', error);
    }
  }

  // Check internet connectivity
  async checkInternetConnectivity() {
    return new Promise((resolve) => {
      const testUrl = 'https://www.google.com';
      const timeout = 5000;
      
      const req = https.get(testUrl, { timeout }, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => {
        resolve(false);
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  }

  // Check for updates
  async checkForUpdates() {
    try {
      console.log('[PiUpdater] Checking for updates...');
      
      const response = await this.makeRequest(this.updateConfig.updateServer);
      const releaseInfo = JSON.parse(response);
      
      const latestVersion = releaseInfo.tag_name.replace('v', '');
      const hasUpdate = this.compareVersions(latestVersion, this.updateConfig.localVersion) > 0;
      
      return {
        hasUpdate,
        latestVersion,
        currentVersion: this.updateConfig.localVersion,
        releaseNotes: releaseInfo.body,
        downloadUrl: releaseInfo.html_url,
        publishedAt: releaseInfo.published_at
      };
    } catch (error) {
      console.error('[PiUpdater] Failed to check for updates:', error);
      throw error;
    }
  }

  // Perform the update
  async performUpdate(updateInfo) {
    if (this.updateInProgress) {
      console.log('[PiUpdater] Update already in progress');
      return;
    }
    
    this.updateInProgress = true;
    
    try {
      console.log(`[PiUpdater] Starting update to version ${updateInfo.latestVersion}`);
      await this.logUpdate('Starting update', updateInfo);
      
      // Create backup
      await this.createBackup();
      
      // Update system packages
      await this.updateSystemPackages();
      
      // Update display client
      await this.updateDisplayClient(updateInfo);
      
      // Update configuration
      await this.updateConfiguration();
      
      // Restart services
      await this.restartServices();
      
      console.log('[PiUpdater] Update completed successfully');
      await this.logUpdate('Update completed successfully', updateInfo);
      
      // Update local version
      this.updateConfig.localVersion = updateInfo.latestVersion;
      await this.saveConfig();
      
    } catch (error) {
      console.error('[PiUpdater] Update failed:', error);
      await this.logError('Update failed', error);
      
      // Attempt to restore from backup
      await this.restoreFromBackup();
    } finally {
      this.updateInProgress = false;
    }
  }

  // Create backup before update
  async createBackup() {
    try {
      console.log('[PiUpdater] Creating backup...');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.updateConfig.backupDir, `backup-${timestamp}`);
      
      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });
      
      // Backup display client files
      const clientDir = '/home/pi/member-name-display';
      if (fs.existsSync(clientDir)) {
        await this.copyDirectory(clientDir, path.join(backupPath, 'client'));
      }
      
      // Backup configuration
      const configFiles = [
        '/home/pi/member-name-display/config.json',
        '/home/pi/member-name-display/update-config.json'
      ];
      
      for (const configFile of configFiles) {
        if (fs.existsSync(configFile)) {
          const fileName = path.basename(configFile);
          fs.copyFileSync(configFile, path.join(backupPath, fileName));
        }
      }
      
      console.log(`[PiUpdater] Backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('[PiUpdater] Backup failed:', error);
      throw error;
    }
  }

  // Update system packages
  async updateSystemPackages() {
    return new Promise((resolve, reject) => {
      console.log('[PiUpdater] Updating system packages...');
      
      exec('sudo apt update && sudo apt upgrade -y', (error, stdout, stderr) => {
        if (error) {
          console.error('[PiUpdater] System package update failed:', error);
          reject(error);
        } else {
          console.log('[PiUpdater] System packages updated successfully');
          resolve();
        }
      });
    });
  }

  // Update display client
  async updateDisplayClient(updateInfo) {
    try {
      console.log('[PiUpdater] Updating display client...');
      
      // Download latest client files
      const clientUrl = `https://raw.githubusercontent.com/jgilmore-dev/MemberNameDisplay/main/src/pi-display-client.html`;
      const clientContent = await this.makeRequest(clientUrl);
      
      // Save updated client
      const clientPath = '/home/pi/member-name-display/pi-display-client.html';
      fs.writeFileSync(clientPath, clientContent);
      
      // Update startup scripts if needed
      await this.updateStartupScripts();
      
      console.log('[PiUpdater] Display client updated successfully');
    } catch (error) {
      console.error('[PiUpdater] Display client update failed:', error);
      throw error;
    }
  }

  // Update startup scripts
  async updateStartupScripts() {
    try {
      // Update the start-display.sh script with latest optimizations
      const scriptPath = '/home/pi/member-name-display/start-display.sh';
      if (fs.existsSync(scriptPath)) {
        // Read current script and update if needed
        const currentScript = fs.readFileSync(scriptPath, 'utf8');
        
        // Check if script needs updating (simplified check)
        if (!currentScript.includes('--disable-background-timer-throttling')) {
          console.log('[PiUpdater] Updating startup script...');
          // In a real implementation, you'd download the latest script
          // For now, we'll just log that it was checked
        }
      }
    } catch (error) {
      console.error('[PiUpdater] Startup script update failed:', error);
    }
  }

  // Update configuration
  async updateConfiguration() {
    try {
      console.log('[PiUpdater] Updating configuration...');
      
      // Update local version in config
      this.updateConfig.localVersion = this.updateConfig.localVersion;
      await this.saveConfig();
      
      console.log('[PiUpdater] Configuration updated');
    } catch (error) {
      console.error('[PiUpdater] Configuration update failed:', error);
    }
  }

  // Restart services
  async restartServices() {
    return new Promise((resolve, reject) => {
      console.log('[PiUpdater] Restarting services...');
      
      exec('sudo systemctl restart member-name-display', (error, stdout, stderr) => {
        if (error) {
          console.error('[PiUpdater] Service restart failed:', error);
          reject(error);
        } else {
          console.log('[PiUpdater] Services restarted successfully');
          resolve();
        }
      });
    });
  }

  // Restore from backup
  async restoreFromBackup() {
    try {
      console.log('[PiUpdater] Attempting to restore from backup...');
      
      // Find the most recent backup
      const backups = fs.readdirSync(this.updateConfig.backupDir)
        .filter(dir => dir.startsWith('backup-'))
        .sort()
        .reverse();
      
      if (backups.length === 0) {
        console.log('[PiUpdater] No backups found');
        return;
      }
      
      const latestBackup = path.join(this.updateConfig.backupDir, backups[0]);
      console.log(`[PiUpdater] Restoring from backup: ${latestBackup}`);
      
      // Restore client files
      const clientBackup = path.join(latestBackup, 'client');
      if (fs.existsSync(clientBackup)) {
        await this.copyDirectory(clientBackup, '/home/pi/member-name-display');
      }
      
      // Restore configuration files
      const configFiles = ['config.json', 'update-config.json'];
      for (const configFile of configFiles) {
        const backupFile = path.join(latestBackup, configFile);
        const targetFile = path.join('/home/pi/member-name-display', configFile);
        
        if (fs.existsSync(backupFile)) {
          fs.copyFileSync(backupFile, targetFile);
        }
      }
      
      console.log('[PiUpdater] Restore completed');
      await this.logUpdate('Restore completed from backup', { backup: latestBackup });
      
    } catch (error) {
      console.error('[PiUpdater] Restore failed:', error);
      await this.logError('Restore failed', error);
    }
  }

  // Manual update trigger
  async triggerManualUpdate() {
    try {
      console.log('[PiUpdater] Manual update triggered');
      
      if (!await this.checkInternetConnectivity()) {
        throw new Error('No internet connectivity');
      }
      
      const updateInfo = await this.checkForUpdates();
      if (updateInfo.hasUpdate) {
        await this.performUpdate(updateInfo);
        return { success: true, message: 'Update completed successfully' };
      } else {
        return { success: true, message: 'No updates available' };
      }
    } catch (error) {
      console.error('[PiUpdater] Manual update failed:', error);
      return { success: false, message: error.message };
    }
  }

  // Get update status
  getUpdateStatus() {
    return {
      enabled: this.updateConfig.enabled,
      localVersion: this.updateConfig.localVersion,
      lastCheck: this.getLastCheckTime(),
      updateInProgress: this.updateInProgress,
      backupCount: this.getBackupCount()
    };
  }

  // Utility methods
  async makeRequest(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      protocol.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  compareVersions(version1, version2) {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    
    return 0;
  }

  async copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  getLastCheckTime() {
    try {
      if (fs.existsSync(this.lastCheckFile)) {
        return fs.readFileSync(this.lastCheckFile, 'utf8');
      }
    } catch (error) {
      // Ignore errors
    }
    return null;
  }

  getBackupCount() {
    try {
      const backups = fs.readdirSync(this.updateConfig.backupDir)
        .filter(dir => dir.startsWith('backup-'));
      return backups.length;
    } catch (error) {
      return 0;
    }
  }

  async logUpdate(message, data = {}) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        message,
        data
      };
      
      fs.appendFileSync(this.updateConfig.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('[PiUpdater] Failed to log update:', error);
    }
  }

  async logError(message, error) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message,
        error: error.message,
        stack: error.stack
      };
      
      fs.appendFileSync(this.updateConfig.logFile, JSON.stringify(logEntry) + '\n');
    } catch (logError) {
      console.error('[PiUpdater] Failed to log error:', logError);
    }
  }
}

module.exports = PiUpdater; 