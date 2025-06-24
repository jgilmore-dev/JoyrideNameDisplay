# Integrated Channel System

The Member Name Display system now includes a comprehensive channel management system that allows you to manage update channels for both the control panel and Raspberry Pi clients from a unified interface.

## Overview

The integrated channel system provides:

- **Dual-Channel Updates**: Stable and testing channels for both control panel and Pi clients
- **Remote Management**: Control Pi client channels from the control panel
- **Visual Status**: Real-time status display for all connected devices
- **Automatic Updates**: Seamless update management across the entire system
- **Network Discovery**: Automatic discovery of Pi clients on the network

## Pi System Opt-In Feature

### Overview

The Pi system is now opt-in by default to maximize adaptability and efficiency. When disabled, the application runs with lower resource usage, making it ideal for events that only need local displays.

### Benefits

- **Efficiency**: Lower resource usage when Pi system is not needed
- **Flexibility**: Easy to enable/disable based on event requirements
- **Performance**: Faster startup and reduced memory footprint for local-only setups
- **Scalability**: Can be enabled when network displays are required

### Configuration

The Pi system can be controlled through the control panel interface:

1. **Enable Pi System**: Starts the web server and enables Pi client discovery
2. **Disable Pi System**: Stops the web server and reduces resource usage
3. **Restart Pi System**: Restarts the web server with current settings

### Default Behavior

- **Default State**: Pi system is disabled by default
- **Settings Persistence**: Pi system state is saved and restored on application restart
- **Automatic Discovery**: When enabled, automatically discovers Pi clients on the network

## Channel Types

### Stable Channel (Default)
- **Source**: GitHub releases
- **Stability**: High - Production ready
- **Update Frequency**: When releases are published
- **Risk Level**: Low
- **Recommended For**: Production environments

### Testing Channel
- **Source**: Main development branch
- **Stability**: Variable - May contain bugs
- **Update Frequency**: On every commit to main
- **Risk Level**: Medium to High
- **Recommended For**: Development and testing

## Control Panel Integration

### Pi Client Manager

The control panel includes a dedicated Pi Client Manager section that provides:

#### Network Discovery
- **Automatic Scanning**: Scans the local network for Pi clients
- **Real-time Status**: Shows connection status and channel information
- **Auto-refresh**: Updates client list every 30 seconds

#### Client Management
- **Channel Switching**: Change Pi client channels remotely
- **Update Checking**: Check for available updates on Pi clients
- **Update Installation**: Install updates remotely
- **Status Monitoring**: Monitor update progress and status

#### Visual Interface
- **Client Cards**: Individual cards for each discovered Pi client
- **Status Indicators**: Color-coded status indicators
- **Channel Badges**: Visual channel identification
- **Detailed Information**: Comprehensive client details

### Usage

1. **Open Pi Client Manager**: Expand the "Pi Client Manager" section in the control panel
2. **Scan for Clients**: Click "Scan for Pi Clients" to discover devices on the network
3. **Select a Client**: Click on a client card to view detailed information
4. **Manage Channels**: Use the "Switch to Testing/Stable" button to change channels
5. **Check Updates**: Click "Check Updates" to see if updates are available
6. **Install Updates**: Click "Install Update" to perform updates remotely

## Pi Client Features

### Update Server
Each Pi client runs a local update server (port 3001) that provides:

- **REST API**: HTTP endpoints for update management
- **Status Information**: Channel, version, and update status
- **Update Operations**: Check and perform updates
- **Health Monitoring**: Service health and status

### Visual Status Display
Pi clients display update information in the bottom-right corner:

- **Update Indicator**: Color-coded status indicator
- **Channel Badge**: Current update channel
- **Version Info**: Current client version
- **Real-time Updates**: Status changes during update process

### Automatic Features
- **Periodic Checks**: Automatic update checks every 6 hours
- **Status Updates**: Real-time status display updates
- **Process Monitoring**: Automatic restart if services fail
- **Error Handling**: Comprehensive error management and recovery

## Network Architecture

### Discovery Process
1. **Control Panel**: Scans local network (first 50 IPs)
2. **Pi Clients**: Respond to discovery requests on port 3001
3. **Status Collection**: Gathers channel, version, and status information
4. **Real-time Updates**: Continuous monitoring and status updates

### Communication Flow
```
Control Panel ←→ Pi Client Update Server (Port 3001)
     ↓
Pi Client Display ←→ Pi Client Update Server (Port 3001)
     ↓
Pi Client Update Script ←→ GitHub API
```

## API Endpoints

### Pi Client Update Server Endpoints

#### Discovery and Health
- `GET /discovery` - Service discovery endpoint
- `GET /health` - Health check endpoint
- `GET /connect-info` - Connection information

#### Update Management
- `GET /update-channel` - Get current update channel
- `GET /client-version` - Get current client version
- `GET /check-updates` - Check for available updates
- `POST /perform-update` - Perform update installation

### Control Panel IPC Handlers

#### Client Discovery
- `scan-pi-clients` - Scan network for Pi clients
- `get-pi-client-details` - Get detailed client information

#### Channel Management
- `set-pi-client-channel` - Change client update channel
- `check-pi-client-updates` - Check for updates on client
- `perform-pi-client-update` - Perform update on client

## Configuration Files

### Pi Client Configuration
- **Channel File**: `/home/pi/member-name-display/.update-channel`
- **Version File**: `/home/pi/member-name-display/.client-version`
- **Update Log**: `/home/pi/member-name-display/update.log`
- **Backup Directory**: `/home/pi/member-name-display/backup/`

### Control Panel Configuration
- **Settings**: Stored in user data directory
- **Update Sources**: Configurable update sources
- **Network Settings**: Configurable network discovery

## Security Considerations

### Network Security
- **Local Network Only**: All communication is local network only
- **No External Access**: Pi clients don't expose services externally
- **Firewall Friendly**: Uses standard HTTP ports (3000, 3001)

### Update Security
- **Signed Updates**: GitHub releases provide update integrity
- **Rollback Protection**: Automatic rollback on failed updates
- **Backup System**: Automatic backup before updates

### Access Control
- **Local Access Only**: Pi clients only accessible from local network
- **No Authentication**: Simplified for local network use
- **Process Isolation**: Update server runs in isolated process

## Best Practices

### Production Deployment
1. **Use Stable Channel**: Keep production Pis on stable channel
2. **Test Before Deploy**: Use testing channel for validation
3. **Monitor Updates**: Regularly check update status
4. **Backup Configurations**: Keep backup of working configurations

### Development Workflow
1. **Dedicated Testing Pi**: Use separate Pi for testing
2. **Channel Management**: Switch channels as needed for testing
3. **Regular Validation**: Test features thoroughly before release
4. **Quick Rollback**: Be prepared to switch back to stable

### Network Management
1. **Static IPs**: Use static IPs for reliable discovery
2. **Network Segmentation**: Separate production and development networks
3. **Firewall Rules**: Configure firewalls to allow necessary ports
4. **Monitoring**: Monitor network connectivity and client status

## Troubleshooting

### Common Issues

#### Pi Clients Not Discovered
1. **Check Network**: Ensure Pi clients are on the same network
2. **Verify Ports**: Check that port 3001 is accessible
3. **Firewall**: Ensure firewall allows port 3001
4. **Service Status**: Verify update server is running

#### Update Failures
1. **Internet Connection**: Check Pi client internet connectivity
2. **GitHub Access**: Verify GitHub API access
3. **Disk Space**: Ensure sufficient disk space for updates
4. **Permissions**: Check file permissions on Pi client

#### Channel Switching Issues
1. **File Permissions**: Check .update-channel file permissions
2. **Service Restart**: Restart update server after channel change
3. **Network Connectivity**: Verify network connectivity
4. **Configuration**: Check channel configuration file

### Debugging Commands

#### Pi Client Commands
```bash
# Check update server status
curl http://pi-ip:3001/health

# Check current channel
curl http://pi-ip:3001/update-channel

# Check for updates
curl http://pi-ip:3001/check-updates

# View update logs
tail -f /home/pi/member-name-display/update.log
```

#### Control Panel Commands
```bash
# Check network interfaces
ipconfig (Windows) / ifconfig (Linux/Mac)

# Test Pi client connectivity
ping pi-ip-address

# Check port accessibility
telnet pi-ip-address 3001
```

## Future Enhancements

### Planned Features
- **SSH Integration**: Direct SSH access for channel management
- **Bulk Operations**: Manage multiple Pi clients simultaneously
- **Update Scheduling**: Schedule updates for off-peak hours
- **Advanced Monitoring**: Detailed performance and health monitoring

### Potential Improvements
- **Authentication**: Optional authentication for enhanced security
- **Encryption**: Encrypted communication between control panel and Pi clients
- **Remote Management**: Web-based remote management interface
- **Update Policies**: Configurable update policies and rules

## Integration with GitHub Workflow

The channel system integrates seamlessly with the GitHub release workflow:

1. **Development**: Push changes to main branch
2. **Testing**: Pi clients on testing channel automatically update
3. **Validation**: Test features on testing Pi clients
4. **Release**: Create GitHub release when ready
5. **Production**: Pi clients on stable channel automatically update

This provides a complete development-to-production pipeline with automatic testing and deployment capabilities. 