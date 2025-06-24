# Raspberry Pi Deployment Guide

## Overview

This guide will help you set up Raspberry Pi devices as remote displays for the Member Name Display system. The Pi displays will automatically connect to your control panel and display participant names and slideshow content.

## Prerequisites

### Hardware Requirements
- **Raspberry Pi** (3B+, 4B, or newer recommended)
- **MicroSD card** (16GB or larger, Class 10 recommended)
- **Power supply** (5V/3A for Pi 4, 5V/2.5A for Pi 3)
- **HDMI cable** or **DisplayPort cable**
- **Monitor or TV** for display
- **Network connection** (WiFi or Ethernet)

### Software Requirements
- **Raspberry Pi OS** (Bullseye or newer)
- **Internet connection** for initial setup

## Quick Setup

### Option 1: Automated Setup (Recommended)

1. **Download the setup script**:
   ```bash
   wget https://raw.githubusercontent.com/jgilmore-dev/MemberNameDisplay/main/scripts/pi-boot-setup.sh
   ```

2. **Make it executable and run**:
   ```bash
   chmod +x pi-boot-setup.sh
   ./pi-boot-setup.sh
   ```

3. **Follow the prompts** and the script will:
   - Update the system
   - Install required packages
   - Create autostart configuration
   - Set up the display client

### Option 2: Manual Setup

If you prefer to set up manually or the automated script doesn't work:

#### Step 1: Install Required Packages
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y chromium-browser unclutter x11-xserver-utils
```

#### Step 2: Create Display Client Directory
```bash
mkdir -p ~/member-name-display
cd ~/member-name-display
```

#### Step 3: Create Configuration File
Create `config.json`:
```json
{
  "controlPanel": {
    "ipAddress": "192.168.1.100",
    "port": 3000,
    "autoReconnect": true,
    "reconnectInterval": 5000
  },
  "display": {
    "fontFamily": "GothamRnd, Arial, sans-serif",
    "defaultFontSize": "4vw",
    "defaultColor": "#ffffff",
    "autoScale": true
  },
  "network": {
    "discoveryEnabled": true,
    "heartbeatInterval": 30000
  }
}
```

**Important**: Replace `192.168.1.100` with your control panel's actual IP address.

#### Step 4: Create Autostart Script
Create `start-display.sh`:
```bash
#!/bin/bash

# Member Name Display - Pi Display Client Autostart Script

# Wait for network to be ready
echo "Waiting for network..."
sleep 10

# Disable screen saver and power management
xset s off
xset -dpms
xset s noblank

# Hide cursor
unclutter -idle 0.1 -root &

# Read configuration
CONFIG_FILE="$(dirname "$0")/config.json"
if [ -f "$CONFIG_FILE" ]; then
    CONTROL_PANEL_IP=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['controlPanel']['ipAddress'])")
    CONTROL_PANEL_PORT=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['controlPanel']['port'])")
else
    CONTROL_PANEL_IP="192.168.1.100"
    CONTROL_PANEL_PORT="3000"
fi

echo "Starting display client..."
echo "Connecting to: http://$CONTROL_PANEL_IP:$CONTROL_PANEL_PORT"

chromium-browser \
    --noerrdialogs \
    --disable-infobars \
    --disable-web-security \
    --disable-features=VizDisplayCompositor \
    --disable-dev-shm-usage \
    --disable-gpu \
    --no-sandbox \
    --disable-setuid-sandbox \
    --kiosk \
    "http://$CONTROL_PANEL_IP:$CONTROL_PANEL_PORT" &

# Keep script running
wait
```

Make it executable:
```bash
chmod +x start-display.sh
```

#### Step 5: Create Systemd Service
Create `/etc/systemd/system/member-name-display.service`:
```ini
[Unit]
Description=Member Name Display Client
After=network.target graphical-session.target
Wants=network.target

[Service]
Type=simple
User=pi
Group=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
ExecStart=/home/pi/member-name-display/start-display.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable member-name-display.service
```

## Configuration

### Finding Your Control Panel IP

1. **On the control panel computer**, run the Member Name Display application
2. **Check the console output** for the server address, or
3. **Use the network discovery script** on the Pi:
   ```bash
   ./discover-control-panel.sh
   ```

### Updating Configuration

Edit the configuration file:
```bash
nano ~/member-name-display/config.json
```

Key settings:
- `controlPanel.ipAddress`: Your control panel's IP address
- `controlPanel.port`: Usually 3000
- `display.defaultColor`: Default font color (hex format)
- `network.discoveryEnabled`: Enable/disable network discovery

## Testing

### Manual Start
To test the display client manually:
```bash
cd ~/member-name-display
./manual-start.sh
```

### Check Service Status
```bash
sudo systemctl status member-name-display
```

### View Logs
```bash
sudo journalctl -u member-name-display -f
```

### Network Discovery
To find control panels on your network:
```bash
./discover-control-panel.sh
```

## Troubleshooting

### Common Issues

#### 1. Display Not Starting
**Symptoms**: Black screen or no display
**Solutions**:
- Check if the control panel is running
- Verify the IP address in `config.json`
- Check network connectivity: `ping [control-panel-ip]`
- View service logs: `sudo journalctl -u member-name-display`

#### 2. Network Connection Issues
**Symptoms**: "Connecting..." message stays on screen
**Solutions**:
- Ensure Pi and control panel are on the same network
- Check firewall settings on control panel
- Verify port 3000 is accessible
- Run network discovery: `./discover-control-panel.sh`

#### 3. Display Resolution Issues
**Symptoms**: Text too small/large or not centered
**Solutions**:
- Adjust display settings in Raspberry Pi configuration
- Check monitor/TV settings
- Verify HDMI connection

#### 4. Service Not Starting
**Symptoms**: Service fails to start on boot
**Solutions**:
- Check service status: `sudo systemctl status member-name-display`
- View detailed logs: `sudo journalctl -u member-name-display -n 50`
- Verify file permissions: `ls -la ~/member-name-display/`
- Check if X11 is running: `echo $DISPLAY`

### Debug Commands

#### Check Network Connectivity
```bash
# Test connection to control panel
curl -v http://[control-panel-ip]:3000/status

# Check network interfaces
ip addr show

# Test DNS resolution
nslookup [control-panel-ip]
```

#### Check Display Configuration
```bash
# Check display settings
xrandr

# Check if X11 is running
ps aux | grep X

# Check display environment
echo $DISPLAY
```

#### Check Service Configuration
```bash
# Check service configuration
sudo systemctl cat member-name-display

# Check service dependencies
sudo systemctl list-dependencies member-name-display

# Test service manually
sudo systemctl start member-name-display
sudo systemctl status member-name-display
```

## Advanced Configuration

### Custom Display Settings

#### Adjust Font Size
Edit `config.json`:
```json
{
  "display": {
    "defaultFontSize": "6vw",  // Larger text
    "autoScale": true
  }
}
```

#### Custom Colors
```json
{
  "display": {
    "defaultColor": "#ff0000"  // Red text
  }
}
```

#### Disable Auto-Scaling
```json
{
  "display": {
    "autoScale": false,
    "defaultFontSize": "48px"
  }
}
```

### Network Configuration

#### Static IP Address
To set a static IP for the Pi:

1. Edit network configuration:
   ```bash
   sudo nano /etc/dhcpcd.conf
   ```

2. Add at the end:
   ```
   interface eth0
   static ip_address=192.168.1.200/24
   static routers=192.168.1.1
   static domain_name_servers=8.8.8.8
   ```

3. Restart networking:
   ```bash
   sudo systemctl restart dhcpcd
   ```

#### WiFi Configuration
For headless WiFi setup, create `wpa_supplicant.conf` on the boot partition:
```
country=US
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="YourWiFiNetwork"
    psk="YourWiFiPassword"
    key_mgmt=WPA-PSK
}
```

### Performance Optimization

#### Disable Unnecessary Services
```bash
# Disable Bluetooth
sudo systemctl disable bluetooth

# Disable WiFi power management
sudo iwconfig wlan0 power off

# Disable HDMI audio
sudo nano /boot/config.txt
# Add: hdmi_audio=0
```

#### Memory Optimization
```bash
# Increase GPU memory split
sudo nano /boot/config.txt
# Add: gpu_mem=128

# Disable swap
sudo dphys-swapfile swapoff
sudo systemctl disable dphys-swapfile
```

## Security Considerations

### Network Security
- Use a dedicated network for displays if possible
- Configure firewall rules to restrict access
- Use static IP addresses for predictable addressing
- Consider VLAN separation for large deployments

### Physical Security
- Secure Pi devices to prevent tampering
- Use strong passwords for SSH access
- Disable unnecessary network services
- Regular security updates

### Access Control
- Disable SSH if not needed: `sudo systemctl disable ssh`
- Use read-only filesystem for production
- Implement network access controls

## Maintenance

### Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update display client
cd ~/member-name-display
git pull origin main  # If using git
```

### Monitoring
```bash
# Check system resources
htop

# Monitor network connections
netstat -tuln

# Check disk usage
df -h

# Monitor temperature
vcgencmd measure_temp
```

### Backup Configuration
```bash
# Backup configuration
cp ~/member-name-display/config.json ~/member-name-display/config.json.backup

# Restore configuration
cp ~/member-name-display/config.json.backup ~/member-name-display/config.json
```

## Support

### Getting Help
1. Check the troubleshooting section above
2. Review service logs: `sudo journalctl -u member-name-display`
3. Test network connectivity
4. Verify control panel is running and accessible

### Reporting Issues
When reporting issues, include:
- Raspberry Pi model and OS version
- Control panel version
- Network configuration
- Error messages and logs
- Steps to reproduce the issue

### Community Resources
- GitHub Issues: [Member Name Display Repository](https://github.com/jgilmore-dev/MemberNameDisplay)
- Documentation: Check the `/docs` directory
- Release Notes: Review latest release notes for known issues

---

*This guide covers the essential setup and configuration for Raspberry Pi displays. For advanced configurations or troubleshooting, refer to the project documentation or community resources.* 