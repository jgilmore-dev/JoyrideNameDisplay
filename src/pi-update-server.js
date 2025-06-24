const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class PiUpdateServer {
    constructor() {
        this.app = express();
        this.clientDir = '/home/pi/member-name-display';
        this.port = 3001; // Different port from main control panel
        
        this.setupRoutes();
    }

    setupRoutes() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname)));
        
        // CORS headers for cross-origin requests
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });

        // Get update channel
        this.app.get('/update-channel', async (req, res) => {
            try {
                const channelFile = path.join(this.clientDir, '.update-channel');
                const channel = await fs.readFile(channelFile, 'utf8');
                res.send(channel.trim());
            } catch (error) {
                console.log('[PiUpdateServer] Could not read channel file, using default');
                res.send('stable');
            }
        });

        // Get client version
        this.app.get('/client-version', async (req, res) => {
            try {
                const versionFile = path.join(this.clientDir, '.client-version');
                const version = await fs.readFile(versionFile, 'utf8');
                res.send(version.trim());
            } catch (error) {
                console.log('[PiUpdateServer] Could not read version file, using default');
                res.send('1.0.0');
            }
        });

        // Check for updates
        this.app.get('/check-updates', async (req, res) => {
            try {
                const updateScript = path.join(this.clientDir, 'update-client.sh');
                
                // Run update script with --check flag
                const { stdout, stderr } = await execAsync(`bash ${updateScript} --check`);
                
                // Parse the output to determine if update is available
                const hasUpdate = stdout.includes('Update available') || 
                                stdout.includes('Update to version') ||
                                !stdout.includes('Already up to date');
                
                if (hasUpdate) {
                    // Extract version information if available
                    const versionMatch = stdout.match(/Update available: .* -> ([\w.-]+)/);
                    const latestVersion = versionMatch ? versionMatch[1] : 'unknown';
                    
                    res.json({
                        updateAvailable: true,
                        latestVersion: latestVersion,
                        message: 'Update available'
                    });
                } else {
                    res.json({
                        updateAvailable: false,
                        message: 'Already up to date'
                    });
                }
            } catch (error) {
                console.error('[PiUpdateServer] Update check failed:', error);
                res.status(500).json({
                    updateAvailable: false,
                    error: 'Update check failed'
                });
            }
        });

        // Perform update
        this.app.post('/perform-update', async (req, res) => {
            try {
                const updateScript = path.join(this.clientDir, 'update-client.sh');
                
                // Run update script
                const { stdout, stderr } = await execAsync(`bash ${updateScript} --update`);
                
                // Check if update was successful
                const success = stdout.includes('Update to version') && 
                              !stdout.includes('Update failed') &&
                              !stderr.includes('error');
                
                if (success) {
                    // Extract new version
                    const versionMatch = stdout.match(/Update to version ([\w.-]+) successful/);
                    const newVersion = versionMatch ? versionMatch[1] : 'unknown';
                    
                    res.json({
                        success: true,
                        newVersion: newVersion,
                        message: 'Update completed successfully'
                    });
                } else {
                    res.json({
                        success: false,
                        error: 'Update failed',
                        details: stdout + stderr
                    });
                }
            } catch (error) {
                console.error('[PiUpdateServer] Update failed:', error);
                res.status(500).json({
                    success: false,
                    error: 'Update failed',
                    details: error.message
                });
            }
        });

        // Get connection info
        this.app.get('/connect-info', async (req, res) => {
            try {
                // Get local IP address
                const { stdout } = await execAsync("hostname -I | awk '{print $1}'");
                const ipAddress = stdout.trim();
                
                res.json({
                    ipAddress: ipAddress,
                    port: 3000,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('[PiUpdateServer] Could not get connection info:', error);
                res.json({
                    ipAddress: 'Unknown',
                    port: 3000,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'PiUpdateServer',
                timestamp: new Date().toISOString()
            });
        });

        // Discovery endpoint
        this.app.get('/discovery', (req, res) => {
            res.json({
                service: 'MemberNameDisplay',
                type: 'pi-update-server',
                version: '1.0.0',
                timestamp: new Date().toISOString()
            });
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`[PiUpdateServer] Update server running on port ${this.port}`);
                resolve();
            });

            this.server.on('error', (error) => {
                console.error('[PiUpdateServer] Server error:', error);
                reject(error);
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('[PiUpdateServer] Update server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

// Export for use in other modules
module.exports = PiUpdateServer;

// Start server if run directly
if (require.main === module) {
    const server = new PiUpdateServer();
    server.start().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('[PiUpdateServer] Shutting down...');
        server.stop().then(() => process.exit(0));
    });
} 