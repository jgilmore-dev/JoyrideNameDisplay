# Offline Auto-Updater Guide

This guide explains how to use the built-in offline auto-updater for JoyRide Name Display.

## Overview

The offline updater allows you to update the application without requiring internet connectivity. It checks for updates from multiple local sources and handles the entire update process automatically.

## How It Works

### Update Sources
The updater checks for updates in the following order:

1. **Local Updates Folder** - `[App Directory]/updates/`
2. **USB Drive** - Any drive with a `JoyRideUpdates` folder
3. **Network Share** - Configurable via environment variable

### Update Process
1. **Check for Updates** - Scans available sources for newer versions
2. **Download Update** - Downloads the update file to a temporary location
3. **Install Update** - Installs the update and restarts the application

## Using the Updater

### From the Control Panel

1. **Open the Application Updates section** in the control panel
2. **Click "Check for Updates"** to scan for available updates
3. **If an update is found**, click "Download Update"
4. **Once downloaded**, click "Install Update"
5. **Confirm the installation** when prompted

### Update Status Indicators

- **Idle** - No update check in progress
- **Checking** - Currently scanning for updates
- **Available** - Update found and ready to download
- **Downloading** - Update is being downloaded
- **Downloaded** - Update ready to install
- **Error** - An error occurred during the process

## Distributing Updates

### Method 1: Local Updates Folder

1. **Create an `updates` folder** in the same directory as the executable
2. **Place the new installer** in the updates folder
3. **Name the file** to include "JoyRide" and "Setup" (e.g., `JoyRide-Name-Display-Setup-1.3.0.exe`)

```
JoyRide Name Display/
├── JoyRide Name Display.exe
├── updates/
│   └── JoyRide-Name-Display-Setup-1.3.0.exe
└── [other files...]
```

### Method 2: USB Drive Updates

1. **Create a `JoyRideUpdates` folder** on a USB drive
2. **Place the new installer** in the JoyRideUpdates folder
3. **Insert the USB drive** into the target machine
4. **Run the update check** from the control panel

```
USB Drive (D:)
└── JoyRideUpdates/
    └── JoyRide-Name-Display-Setup-1.3.0.exe
```

### Method 3: Network Share

1. **Set the environment variable** `JOYRIDE_UPDATE_SHARE` to point to your network share
2. **Place the new installer** in the network share
3. **Run the update check** from the control panel

```batch
set JOYRIDE_UPDATE_SHARE=\\server\updates\JoyRide
```

## Building Updates

### Creating Update Files

1. **Build the new version** with an incremented version number:
   ```bash
   npm run make
   ```

2. **The build process creates**:
   - `out/joyridenamedisplay-win32-x64/` - Portable version
   - `out/JoyRide Cars Name Display Setup 1.2.0.exe` - Installer

3. **Use the installer file** for updates (not the portable version)

### Version Management

- **Always increment the version** in `package.json` before building
- **Use semantic versioning** (e.g., 1.2.0, 1.2.1, 1.3.0)
- **The updater compares versions** to determine if an update is needed

## Update File Requirements

### File Naming Convention
Update files must:
- **End with `.exe`**
- **Include "JoyRide"** in the filename
- **Include "Setup"** in the filename
- **Be valid Electron installers**

### Examples of Valid Names
- `JoyRide-Name-Display-Setup-1.3.0.exe`
- `JoyRide Cars Name Display Setup 1.2.1.exe`
- `JoyRideSetup-1.3.0.exe`

## Troubleshooting

### Common Issues

**Update not found**
- Verify the update file is in the correct location
- Check that the filename includes "JoyRide" and "Setup"
- Ensure the file is a valid installer

**Download fails**
- Check available disk space
- Verify file permissions
- Ensure the update file is not corrupted

**Installation fails**
- Close all instances of the application
- Run the application as administrator
- Check Windows security settings

### Logs and Debugging

Update-related logs appear in the console with the `[Updater]` prefix:

```
[Updater] Checking for updates...
[Updater] Found local update: C:\path\to\update.exe
[Updater] Update available: { version: '1.3.0', ... }
[Updater] Starting download...
[Updater] Update downloaded: { version: '1.3.0', ... }
```

## Security Considerations

### File Integrity
- **Always verify update files** before distribution
- **Use trusted sources** for update files
- **Consider code signing** for production deployments

### Network Security
- **Use secure network shares** when distributing via network
- **Implement access controls** on update directories
- **Monitor update distribution** for unauthorized access

## Best Practices

### For Administrators
1. **Test updates** on a non-production machine first
2. **Backup user data** before major updates
3. **Schedule updates** during maintenance windows
4. **Document update procedures** for your team

### For Users
1. **Save your work** before starting an update
2. **Don't interrupt** the update process
3. **Report issues** if updates fail
4. **Keep update files** in a safe location

## Advanced Configuration

### Custom Update Sources
You can modify the `getUpdateSources()` method in `src/updater.js` to add custom update sources:

```javascript
// Add custom network path
sources.push({
  name: 'Custom Network',
  type: 'network',
  path: '\\\\custom-server\\updates'
});
```

### Environment Variables
- `JOYRIDE_UPDATE_SHARE` - Network share path for updates
- `JOYRIDE_UPDATE_CHECK_INTERVAL` - How often to check for updates (in minutes)

## Migration from Manual Updates

If you're currently using manual updates:

1. **Deploy the new version** with the updater
2. **Create update folders** on target machines
3. **Place the next update** in the update folders
4. **Users can now update** automatically

The updater preserves all user settings and data during the update process. 