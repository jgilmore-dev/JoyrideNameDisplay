#!/bin/bash

# Raspberry Pi Boot Setup Script for Member Name Display
# Optimized for Raspberry Pi OS Lite (32-bit)
# This script configures a Raspberry Pi to boot automatically to the display client

set -e

echo "=== Member Name Display - Pi Boot Setup ==="
echo "Optimized for Raspberry Pi OS Lite (32-bit)"
echo "This script will configure your Raspberry Pi to boot automatically to the display client."
echo ""

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo; then
    echo "Warning: This script is designed for Raspberry Pi devices."
    echo "Continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Check if running Lite OS
if [ -d "/usr/share/raspi-ui-overrides" ]; then
    echo "Detected: Raspberry Pi OS with Desktop"
    echo "Note: For optimal performance, consider using Raspberry Pi OS Lite"
    echo "The system will work, but Lite OS is recommended for display-only use."
    echo ""
elif [ -f "/usr/bin/lxpanel" ]; then
    echo "Detected: Raspberry Pi OS with Desktop"
    echo "Note: For optimal performance, consider using Raspberry Pi OS Lite"
    echo "The system will work, but Lite OS is recommended for display-only use."
    echo ""
else
    echo "Detected: Raspberry Pi OS Lite - Perfect for display use!"
    echo ""
fi

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages for Lite OS
echo "Installing required packages for Lite OS..."
sudo apt install -y \
    chromium-browser \
    unclutter \
    x11-xserver-utils \
    xinit \
    lightdm \
    openbox \
    lxterminal \
    network-manager \
    curl \
    python3 \
    python3-json \
    nodejs \
    npm

# For Lite OS, we need to ensure X11 is properly configured
if [ ! -f "/etc/X11/xinit/xinitrc" ]; then
    echo "Configuring X11 for Lite OS..."
    sudo apt install -y x11-common
fi

# Create display client directory
DISPLAY_DIR="/home/pi/member-name-display"
echo "Creating display client directory: $DISPLAY_DIR"
mkdir -p "$DISPLAY_DIR"

# Create the autostart script optimized for Lite OS
AUTOSTART_SCRIPT="$DISPLAY_DIR/start-display.sh"
echo "Creating autostart script: $AUTOSTART_SCRIPT"

cat > "$AUTOSTART_SCRIPT" << 'EOF'
#!/bin/bash

# Member Name Display - Pi Display Client Autostart Script
# Optimized for Raspberry Pi OS Lite

# Wait for network to be ready
echo "Waiting for network..."
sleep 15

# Run updater before starting display client
/home/pi/member-name-display/update-client.sh

# Start the update server in the background
echo "Starting update server..."
cd /home/pi/member-name-display
node pi-update-server.js &
UPDATE_SERVER_PID=$!

# Ensure X11 is running
if [ -z "$DISPLAY" ]; then
    export DISPLAY=:0
fi

# Start X11 if not already running (for Lite OS)
if ! pgrep -x "X" > /dev/null; then
    echo "Starting X11 server..."
    startx &
    sleep 10
fi

# Disable screen saver and power management
xset s off
xset -dpms
xset s noblank

# Hide cursor
unclutter -idle 0.1 -root &

# Read configuration
CONFIG_FILE="$(dirname "$0")/config.json"
if [ -f "$CONFIG_FILE" ]; then
    CONTROL_PANEL_IP=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['controlPanel']['fallbackIP'])")
    CONTROL_PANEL_PORT=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['controlPanel']['port'])")
else
    CONTROL_PANEL_IP="192.168.1.100"
    CONTROL_PANEL_PORT="3000"
fi

echo "Starting display client..."
echo "Connecting to: http://$CONTROL_PANEL_IP:$CONTROL_PANEL_PORT"

# Start Chromium in kiosk mode with Lite OS optimizations
chromium-browser \
    --noerrdialogs \
    --disable-infobars \
    --disable-web-security \
    --disable-features=VizDisplayCompositor \
    --disable-dev-shm-usage \
    --disable-gpu \
    --no-sandbox \
    --disable-setuid-sandbox \
    --disable-background-timer-throttling \
    --disable-backgrounding-occluded-windows \
    --disable-renderer-backgrounding \
    --disable-features=TranslateUI \
    --disable-ipc-flooding-protection \
    --kiosk \
    "http://$CONTROL_PANEL_IP:$CONTROL_PANEL_PORT" &

CHROMIUM_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "Shutting down display client..."
    kill $CHROMIUM_PID 2>/dev/null
    kill $UPDATE_SERVER_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Keep script running and monitor processes
while true; do
    if ! kill -0 $CHROMIUM_PID 2>/dev/null; then
        echo "Chromium process died, restarting..."
        chromium-browser \
            --noerrdialogs \
            --disable-infobars \
            --disable-web-security \
            --disable-features=VizDisplayCompositor \
            --disable-dev-shm-usage \
            --disable-gpu \
            --no-sandbox \
            --disable-setuid-sandbox \
            --disable-background-timer-throttling \
            --disable-backgrounding-occluded-windows \
            --disable-renderer-backgrounding \
            --disable-features=TranslateUI \
            --disable-ipc-flooding-protection \
            --kiosk \
            "http://$CONTROL_PANEL_IP:$CONTROL_PANEL_PORT" &
        CHROMIUM_PID=$!
    fi
    
    if ! kill -0 $UPDATE_SERVER_PID 2>/dev/null; then
        echo "Update server process died, restarting..."
        cd /home/pi/member-name-display
        node pi-update-server.js &
        UPDATE_SERVER_PID=$!
    fi
    
    sleep 30
done
EOF

# Make the script executable
chmod +x "$AUTOSTART_SCRIPT"

# Create systemd service optimized for Lite OS
SERVICE_FILE="/etc/systemd/system/member-name-display.service"
echo "Creating systemd service: $SERVICE_FILE"

sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Member Name Display Client
After=network.target
Wants=network.target

[Service]
Type=simple
User=pi
Group=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
ExecStartPre=/bin/bash -c 'if ! pgrep -x "X" > /dev/null; then startx & sleep 10; fi'
ExecStart=$AUTOSTART_SCRIPT
Restart=always
RestartSec=10
TimeoutStartSec=60

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
echo "Enabling autostart service..."
sudo systemctl daemon-reload
sudo systemctl enable member-name-display.service

# Create configuration file optimized for Lite OS
CONFIG_FILE="$DISPLAY_DIR/config.json"
echo "Creating configuration file: $CONFIG_FILE"

cat > "$CONFIG_FILE" << 'EOF'
{
  "controlPanel": {
    "autoDiscovery": true,
    "fallbackIP": "192.168.1.100",
    "port": 3000,
    "autoReconnect": true,
    "reconnectInterval": 5000,
    "discoveryMethods": [
      "hostname",
      "network-scan",
      "mdns"
    ]
  },
  "display": {
    "fontFamily": "GothamRnd, Arial, sans-serif",
    "defaultFontSize": "4vw",
    "defaultColor": "#ffffff",
    "autoScale": true
  },
  "network": {
    "discoveryEnabled": true,
    "heartbeatInterval": 30000,
    "scanTimeout": 5000
  },
  "system": {
    "osType": "lite",
    "optimizations": {
      "disableAnimations": true,
      "reduceMemoryUsage": true,
      "fastBoot": true
    }
  },
  "venue": {
    "name": "Auto-Detected",
    "location": "Auto-Detected",
    "eventType": "Auto-Detected"
  }
}
EOF

# Create network discovery script
DISCOVERY_SCRIPT="$DISPLAY_DIR/discover-control-panel.sh"
echo "Creating network discovery script: $DISCOVERY_SCRIPT"

cat > "$DISCOVERY_SCRIPT" << 'EOF'
#!/bin/bash

# Network Discovery Script for Member Name Display
# Optimized for Raspberry Pi OS Lite

echo "=== Member Name Display - Network Discovery ==="
echo "Scanning network for control panel..."

# Get local network range
LOCAL_IP=$(hostname -I | awk '{print $1}')
NETWORK_RANGE=$(echo $LOCAL_IP | sed 's/\.[0-9]*$/.0\/24/')

echo "Local IP: $LOCAL_IP"
echo "Scanning network: $NETWORK_RANGE"

# Scan for control panel
echo "Scanning for Member Name Display control panel..."
for ip in $(seq 1 50); do
    IP_ADDRESS=$(echo $LOCAL_IP | sed "s/\.[0-9]*$/.$ip/")
    
    # Check if port 3000 is open and responds to discovery endpoint
    if timeout 1 bash -c "</dev/tcp/$IP_ADDRESS/3000" 2>/dev/null; then
        echo "Found potential control panel at: $IP_ADDRESS"
        
        # Try to get discovery info
        DISCOVERY_RESPONSE=$(curl -s --connect-timeout 2 "http://$IP_ADDRESS:3000/discovery" 2>/dev/null)
        if echo "$DISCOVERY_RESPONSE" | grep -q "MemberNameDisplay"; then
            echo "✓ Control panel found at: http://$IP_ADDRESS:3000"
            echo "Discovery response:"
            echo "$DISCOVERY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DISCOVERY_RESPONSE"
            break
        fi
    fi
done

echo "Discovery complete."
EOF

chmod +x "$DISCOVERY_SCRIPT"

# Create manual start script for Lite OS
MANUAL_START="$DISPLAY_DIR/manual-start.sh"
echo "Creating manual start script: $MANUAL_START"

cat > "$MANUAL_START" << 'EOF'
#!/bin/bash

# Manual start script for Member Name Display client
# Optimized for Raspberry Pi OS Lite

echo "Starting Member Name Display client manually..."

# Ensure X11 is running
if [ -z "$DISPLAY" ]; then
    export DISPLAY=:0
fi

if ! pgrep -x "X" > /dev/null; then
    echo "Starting X11 server..."
    startx &
    sleep 10
fi

# Read configuration
CONFIG_FILE="$(dirname "$0")/config.json"
if [ -f "$CONFIG_FILE" ]; then
    CONTROL_PANEL_IP=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['controlPanel']['fallbackIP'])")
    CONTROL_PANEL_PORT=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['controlPanel']['port'])")
else
    CONTROL_PANEL_IP="192.168.1.100"
    CONTROL_PANEL_PORT="3000"
fi

echo "Connecting to: http://$CONTROL_PANEL_IP:$CONTROL_PANEL_PORT"

# Start Chromium with Lite OS optimizations
chromium-browser \
    --noerrdialogs \
    --disable-infobars \
    --disable-web-security \
    --disable-features=VizDisplayCompositor \
    --disable-dev-shm-usage \
    --disable-gpu \
    --no-sandbox \
    --disable-setuid-sandbox \
    --disable-background-timer-throttling \
    --disable-backgrounding-occluded-windows \
    --disable-renderer-backgrounding \
    --disable-features=TranslateUI \
    --disable-ipc-flooding-protection \
    "http://$CONTROL_PANEL_IP:$CONTROL_PANEL_PORT"
EOF

chmod +x "$MANUAL_START"

# Create README for Pi Lite OS
README_FILE="$DISPLAY_DIR/README.md"
echo "Creating README file: $README_FILE"

cat > "$README_FILE" << 'EOF'
# Member Name Display - Raspberry Pi Client (Lite OS)

This directory contains the Raspberry Pi client for the Member Name Display system, optimized for Raspberry Pi OS Lite.

## System Requirements

- **Recommended**: Raspberry Pi OS Lite (32-bit)
- **Alternative**: Raspberry Pi OS with Desktop (32-bit)
- **Not Recommended**: 64-bit OS (unnecessary overhead)

## Why Lite OS?

- **Faster boot times** - No desktop environment to load
- **Lower memory usage** - More resources for the display application
- **Better stability** - Fewer background processes
- **Optimized performance** - Designed for headless/display applications

## Files

- `start-display.sh` - Autostart script (runs automatically on boot)
- `manual-start.sh` - Manual start script (run this to start manually)
- `discover-control-panel.sh` - Network discovery script
- `config.json` - Configuration file
- `README.md` - This file

## Configuration

Edit `config.json` to change the control panel IP address and other settings:

```json
{
  "controlPanel": {
    "fallbackIP": "192.168.1.100",  // Change this to your control panel's IP
    "port": 3000
  }
}
```

## Commands

### Start manually
```bash
./manual-start.sh
```

### Discover control panel on network
```bash
./discover-control-panel.sh
```

### Check service status
```bash
sudo systemctl status member-name-display
```

### Restart service
```bash
sudo systemctl restart member-name-display
```

### View logs
```bash
sudo journalctl -u member-name-display -f
```

## Troubleshooting

1. **Display not starting**: Check if the control panel IP is correct in `config.json`
2. **Network issues**: Run `./discover-control-panel.sh` to find the control panel
3. **Service not starting**: Check logs with `sudo journalctl -u member-name-display`
4. **Display issues**: Try starting manually with `./manual-start.sh`
5. **X11 issues**: Ensure X11 is installed: `sudo apt install x11-common`

## Network Requirements

- Pi must be on the same network as the control panel
- Port 3000 must be accessible on the control panel
- No firewall blocking the connection

## Performance Tips for Lite OS

- Disable unnecessary services: `sudo systemctl disable bluetooth`
- Increase GPU memory: Add `gpu_mem=128` to `/boot/config.txt`
- Disable swap: `sudo dphys-swapfile swapoff && sudo systemctl disable dphys-swapfile`
- Use static IP for faster boot times
EOF

# Set default channel to stable
echo "stable" > "$DISPLAY_DIR/.update-channel"

# Copy the update server
UPDATE_SERVER_SOURCE="$DISPLAY_DIR/pi-update-server.js"
echo "Creating update server: $UPDATE_SERVER_SOURCE"

cat > "$UPDATE_SERVER_SOURCE" << 'EOF'
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
        this.port = 3001;
        
        this.setupRoutes();
    }

    setupRoutes() {
        this.app.use(express.static(path.join(__dirname)));
        
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });

        this.app.get('/update-channel', async (req, res) => {
            try {
                const channelFile = path.join(this.clientDir, '.update-channel');
                const channel = await fs.readFile(channelFile, 'utf8');
                res.send(channel.trim());
            } catch (error) {
                res.send('stable');
            }
        });

        this.app.get('/client-version', async (req, res) => {
            try {
                const versionFile = path.join(this.clientDir, '.client-version');
                const version = await fs.readFile(versionFile, 'utf8');
                res.send(version.trim());
            } catch (error) {
                res.send('1.0.0');
            }
        });

        this.app.get('/check-updates', async (req, res) => {
            try {
                const updateScript = path.join(this.clientDir, 'update-client.sh');
                const { stdout, stderr } = await execAsync(`bash ${updateScript} --check`);
                
                const hasUpdate = stdout.includes('Update available') || 
                                stdout.includes('Update to version') ||
                                !stdout.includes('Already up to date');
                
                if (hasUpdate) {
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
                res.status(500).json({
                    updateAvailable: false,
                    error: 'Update check failed'
                });
            }
        });

        this.app.post('/perform-update', async (req, res) => {
            try {
                const updateScript = path.join(this.clientDir, 'update-client.sh');
                const { stdout, stderr } = await execAsync(`bash ${updateScript} --update`);
                
                const success = stdout.includes('Update to version') && 
                              !stdout.includes('Update failed') &&
                              !stderr.includes('error');
                
                if (success) {
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
                res.status(500).json({
                    success: false,
                    error: 'Update failed',
                    details: error.message
                });
            }
        });

        this.app.get('/connect-info', async (req, res) => {
            try {
                const { stdout } = await execAsync("hostname -I | awk '{print $1}'");
                const ipAddress = stdout.trim();
                
                res.json({
                    ipAddress: ipAddress,
                    port: 3000,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.json({
                    ipAddress: 'Unknown',
                    port: 3000,
                    timestamp: new Date().toISOString()
                });
            }
        });

        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'PiUpdateServer',
                timestamp: new Date().toISOString()
            });
        });

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

if (require.main === module) {
    const server = new PiUpdateServer();
    server.start().catch(console.error);
    
    process.on('SIGINT', () => {
        console.log('[PiUpdateServer] Shutting down...');
        server.stop().then(() => process.exit(0));
    });
}
EOF

# Install Express dependency for the update server
echo "Installing Express for update server..."
cd "$DISPLAY_DIR"
npm init -y
npm install express

# Set ownership
sudo chown -R pi:pi "$DISPLAY_DIR"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Optimized for Raspberry Pi OS Lite (32-bit)"
echo ""
echo "Next steps:"
echo "1. Edit the configuration file: $CONFIG_FILE"
echo "   - Change the IP address to your control panel's IP"
echo ""
echo "2. Test the connection:"
echo "   ./discover-control-panel.sh"
echo ""
echo "3. Start manually to test:"
echo "   ./manual-start.sh"
echo ""
echo "4. Reboot to test autostart:"
echo "   sudo reboot"
echo ""
echo "5. Check service status:"
echo "   sudo systemctl status member-name-display"
echo ""
echo "=== Update Channel System ==="
echo "The Pi is configured with a dual-channel update system:"
echo ""
echo "• Stable Channel (Default): Downloads from GitHub releases"
echo "  - High stability, recommended for production"
echo "  - Updates only when releases are published"
echo ""
echo "• Testing Channel: Downloads from main development branch"
echo "  - Latest features, may contain bugs"
echo "  - Updates on every commit to main"
echo "  - Recommended for development and testing"
echo ""
echo "Channel Management Commands:"
echo "  ./pi-channel-manager.sh status        # Show current status"
echo "  ./pi-channel-manager.sh setup         # Interactive channel setup"
echo "  ./pi-channel-manager.sh set-channel testing  # Switch to testing"
echo "  ./pi-channel-manager.sh set-channel stable   # Switch to stable"
echo "  ./pi-channel-manager.sh check         # Check for updates"
echo ""
echo "Update Server:"
echo "  • Runs on port 3001"
echo "  • Provides update status to the display client"
echo "  • Handles automatic update checks"
echo "  • Manages channel and version information"
echo ""
echo "The Pi will now automatically start the display client on boot."
echo "Make sure your control panel is running and accessible on the network."
echo ""
echo "Note: This setup is optimized for Raspberry Pi OS Lite for better performance."
echo "For detailed channel system documentation, see: docs/PI_CLIENT_CHANNEL_SYSTEM.md"

# Create the robust update script
UPDATE_SCRIPT="$DISPLAY_DIR/update-client.sh"
echo "Creating enhanced update script with channel support: $UPDATE_SCRIPT"

cat > "$UPDATE_SCRIPT" << 'EOF'
#!/bin/bash

# Member Name Display - Pi Client Updater
# Enhanced update script with channel support, version check, backup, rollback, and logging

CLIENT_DIR="/home/pi/member-name-display"
CLIENT_FILE="$CLIENT_DIR/pi-display-client.html"
CONFIG_FILE="$CLIENT_DIR/config.json"
BACKUP_DIR="$CLIENT_DIR/backup"
LOG_FILE="$CLIENT_DIR/update.log"
VERSION_FILE="$CLIENT_DIR/.client-version"
CHANNEL_FILE="$CLIENT_DIR/.update-channel"
TMP_FILE="$CLIENT_DIR/pi-display-client.html.tmp"
GITHUB_API="https://api.github.com/repos/jgilmore-dev/MemberNameDisplay/releases"
RAW_CLIENT_URL="https://raw.githubusercontent.com/jgilmore-dev/MemberNameDisplay/main/src/pi-display-client.html"

# Default channel (can be overridden by .update-channel file)
DEFAULT_CHANNEL="stable"

# Helper: log message
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Get update channel
get_update_channel() {
  if [ -f "$CHANNEL_FILE" ]; then
    cat "$CHANNEL_FILE"
  else
    echo "$DEFAULT_CHANNEL"
  fi
}

# Get latest version based on channel
get_latest_version() {
  local channel="$1"
  
  if [ "$channel" = "testing" ]; then
    # For testing channel, get the latest pre-release or development version
    log "Checking testing channel for updates..."
    
    # Option 1: Get latest pre-release
    LATEST_VERSION=$(curl -s "$GITHUB_API" | grep -A 10 '"prerelease": true' | grep 'tag_name' | head -1 | sed -E 's/.*"v?([0-9.]+[a-zA-Z0-9-]*)".*/\1/')
    
    if [ -z "$LATEST_VERSION" ]; then
      # Option 2: Get latest commit hash from main branch
      LATEST_VERSION=$(curl -s "https://api.github.com/repos/jgilmore-dev/MemberNameDisplay/commits/main" | grep '"sha"' | head -1 | sed -E 's/.*"([a-f0-9]{7})".*/\1/')
      if [ -n "$LATEST_VERSION" ]; then
        LATEST_VERSION="dev-$LATEST_VERSION"
      fi
    fi
    
    # For testing, always use main branch URL
    RAW_CLIENT_URL="https://raw.githubusercontent.com/jgilmore-dev/MemberNameDisplay/main/src/pi-display-client.html"
  else
    # For stable channel, get the latest release
    log "Checking stable channel for updates..."
    LATEST_VERSION=$(curl -s "$GITHUB_API/latest" | grep 'tag_name' | head -1 | sed -E 's/.*"v?([0-9.]+)".*/\1/')
    
    # For stable releases, use release-specific URL if available
    if [ -n "$LATEST_VERSION" ]; then
      RELEASE_CLIENT_URL="https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v$LATEST_VERSION/pi-display-client.html"
      # Test if release file exists
      if curl -fsSL -I "$RELEASE_CLIENT_URL" >/dev/null 2>&1; then
        RAW_CLIENT_URL="$RELEASE_CLIENT_URL"
        log "Using release-specific URL: $RAW_CLIENT_URL"
      else
        log "Release file not found, falling back to main branch"
        RAW_CLIENT_URL="https://raw.githubusercontent.com/jgilmore-dev/MemberNameDisplay/main/src/pi-display-client.html"
      fi
    fi
  fi
  
  echo "$LATEST_VERSION"
}

# Get current channel
CHANNEL=$(get_update_channel)
log "Using update channel: $CHANNEL"

# 1. Check for internet connectivity
ping -c 1 8.8.8.8 &>/dev/null || {
  log "No internet connection. Skipping update."
  exit 0
}

# 2. Get latest version from GitHub based on channel
LATEST_VERSION=$(get_latest_version "$CHANNEL")
if [ -z "$LATEST_VERSION" ]; then
  log "Could not determine latest version. Skipping update."
  exit 1
fi

# 3. Get current version
if [ -f "$VERSION_FILE" ]; then
  CURRENT_VERSION=$(cat "$VERSION_FILE")
else
  CURRENT_VERSION="0.0.0"
fi

# 4. Compare versions
verlte() { [ "$1" = "$2" ] || [  "$(printf '%s\n%s' "$1" "$2" | sort -V | head -n1)" = "$1" ]; }
vergte() { [ "$1" = "$2" ] || [  "$(printf '%s\n%s' "$1" "$2" | sort -V | head -n1)" != "$1" ]; }

if verlte "$LATEST_VERSION" "$CURRENT_VERSION"; then
  log "Already up to date (current: $CURRENT_VERSION, latest: $LATEST_VERSION)."
  exit 0
fi

log "Update available: $CURRENT_VERSION -> $LATEST_VERSION (channel: $CHANNEL)"

# 5. Download new client to temp file
log "Downloading from: $RAW_CLIENT_URL"
curl -fsSL "$RAW_CLIENT_URL" -o "$TMP_FILE"
if [ $? -ne 0 ] || [ ! -s "$TMP_FILE" ]; then
  log "Failed to download new client. Aborting update."
  rm -f "$TMP_FILE"
  exit 1
fi

# 6. Backup current client and config
mkdir -p "$BACKUP_DIR"
cp "$CLIENT_FILE" "$BACKUP_DIR/pi-display-client.html.bak" 2>/dev/null
cp "$CONFIG_FILE" "$BACKUP_DIR/config.json.bak" 2>/dev/null
log "Backup of current client and config completed."

# 7. Replace client with new version
cp "$TMP_FILE" "$CLIENT_FILE"
rm -f "$TMP_FILE"
log "Client updated to version $LATEST_VERSION."

echo "$LATEST_VERSION" > "$VERSION_FILE"

# 8. Verify new client loads (basic check: file is not empty)
if [ ! -s "$CLIENT_FILE" ]; then
  log "Update failed: new client file is empty. Rolling back."
  cp "$BACKUP_DIR/pi-display-client.html.bak" "$CLIENT_FILE"
  cp "$BACKUP_DIR/config.json.bak" "$CONFIG_FILE" 2>/dev/null
  log "Rollback complete."
  exit 1
fi

log "Update to version $LATEST_VERSION successful (channel: $CHANNEL)."
exit 0
EOF

chmod +x "$UPDATE_SCRIPT"

# Create the channel manager script
CHANNEL_MANAGER="$DISPLAY_DIR/pi-channel-manager.sh"
echo "Creating channel manager script: $CHANNEL_MANAGER"

cat > "$CHANNEL_MANAGER" << 'EOF'
#!/bin/bash

# Member Name Display - Pi Client Channel Manager
# User-friendly script to manage update channels for Pi clients

CLIENT_DIR="/home/pi/member-name-display"
CHANNEL_FILE="$CLIENT_DIR/.update-channel"
UPDATE_SCRIPT="$CLIENT_DIR/update-client.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Get current channel
get_current_channel() {
  if [ -f "$CHANNEL_FILE" ]; then
    cat "$CHANNEL_FILE"
  else
    echo "stable"
  fi
}

# Set channel
set_channel() {
  local channel="$1"
  
  # Validate channel
  if [ "$channel" != "stable" ] && [ "$channel" != "testing" ]; then
    log_error "Invalid channel: $channel. Use 'stable' or 'testing'."
    return 1
  fi
  
  # Create directory if it doesn't exist
  mkdir -p "$CLIENT_DIR"
  
  # Set the channel
  echo "$channel" > "$CHANNEL_FILE"
  log_success "Update channel set to: $channel"
  
  # Show channel information
  show_channel_info "$channel"
}

# Show channel information
show_channel_info() {
  local channel="$1"
  
  echo ""
  echo "=== Channel Information ==="
  case "$channel" in
    "stable")
      echo "Channel: Stable"
      echo "Description: Official releases only"
      echo "Update Source: GitHub releases"
      echo "Stability: High - Production ready"
      echo "Update Frequency: When releases are published"
      echo "Recommended for: Production environments"
      ;;
    "testing")
      echo "Channel: Testing"
      echo "Description: Latest development version"
      echo "Update Source: Main branch"
      echo "Stability: Variable - May contain bugs"
      echo "Update Frequency: On every commit to main"
      echo "Recommended for: Development and testing"
      ;;
  esac
  echo "=========================="
  echo ""
}

# Show current status
show_status() {
  local current_channel=$(get_current_channel)
  local current_version="Unknown"
  
  if [ -f "$CLIENT_DIR/.client-version" ]; then
    current_version=$(cat "$CLIENT_DIR/.client-version")
  fi
  
  echo "=== Pi Client Status ==="
  echo "Current Channel: $current_channel"
  echo "Current Version: $current_version"
  echo "Client Directory: $CLIENT_DIR"
  echo "Update Script: $UPDATE_SCRIPT"
  echo "========================"
  echo ""
  
  show_channel_info "$current_channel"
}

# Check for updates
check_updates() {
  local current_channel=$(get_current_channel)
  
  log_info "Checking for updates on $current_channel channel..."
  
  if [ -f "$UPDATE_SCRIPT" ]; then
    "$UPDATE_SCRIPT"
  else
    log_error "Update script not found: $UPDATE_SCRIPT"
    return 1
  fi
}

# Interactive channel selection
interactive_setup() {
  echo "=== Pi Client Channel Setup ==="
  echo ""
  echo "Choose your update channel:"
  echo ""
  echo "1) Stable Channel"
  echo "   - Official releases only"
  echo "   - High stability"
  echo "   - Recommended for production"
  echo ""
  echo "2) Testing Channel"
  echo "   - Latest development version"
  echo "   - May contain new features and bugs"
  echo "   - Recommended for development/testing"
  echo ""
  
  read -p "Enter your choice (1 or 2): " choice
  
  case "$choice" in
    1)
      set_channel "stable"
      ;;
    2)
      log_warning "You're switching to the testing channel."
      log_warning "This may result in unstable behavior."
      read -p "Are you sure? (y/N): " confirm
      if [[ "$confirm" =~ ^[Yy]$ ]]; then
        set_channel "testing"
      else
        log_info "Channel selection cancelled."
      fi
      ;;
    *)
      log_error "Invalid choice. Please run the script again."
      exit 1
      ;;
  esac
}

# Show help
show_help() {
  echo "Usage: $0 [COMMAND] [OPTIONS]"
  echo ""
  echo "Commands:"
  echo "  status              Show current status"
  echo "  set-channel CHANNEL Set update channel (stable/testing)"
  echo "  check               Check for updates"
  echo "  setup               Interactive setup"
  echo "  help                Show this help message"
  echo ""
  echo "Channels:"
  echo "  stable              Use official releases (default)"
  echo "  testing             Use latest development version"
  echo ""
  echo "Examples:"
  echo "  $0 status                    # Show current status"
  echo "  $0 set-channel testing       # Switch to testing channel"
  echo "  $0 check                     # Check for updates"
  echo "  $0 setup                     # Interactive setup"
  echo ""
  echo "Channel Behavior:"
  echo "  Stable Channel:"
  echo "    - Downloads from GitHub releases"
  echo "    - High stability and reliability"
  echo "    - Updates only when releases are published"
  echo ""
  echo "  Testing Channel:"
  echo "    - Downloads from main branch"
  echo "    - Latest features and fixes"
  echo "    - May contain bugs or instability"
  echo "    - Updates on every commit to main"
}

# Main script logic
case "${1:-}" in
  "status")
    show_status
    ;;
  "set-channel")
    if [ -n "$2" ]; then
      set_channel "$2"
    else
      log_error "Channel not specified. Use 'stable' or 'testing'."
      exit 1
    fi
    ;;
  "check")
    check_updates
    ;;
  "setup")
    interactive_setup
    ;;
  "help"|"--help"|"-h")
    show_help
    ;;
  "")
    # No arguments - show status and help
    show_status
    echo ""
    echo "Run '$0 help' for available commands."
    ;;
  *)
    log_error "Unknown command: $1"
    echo ""
    show_help
    exit 1
    ;;
esac
EOF

chmod +x "$CHANNEL_MANAGER" 