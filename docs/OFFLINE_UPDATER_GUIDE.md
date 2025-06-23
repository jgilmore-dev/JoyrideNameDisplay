# Offline Updater Guide

This guide explains how to use the built-in offline auto-updater for Member Name Display.

## Overview

The offline updater allows you to distribute updates without requiring internet access. It supports both USB drives and network shares.

## Supported Update Sources

1. **USB Drive** - Any drive with a `MemberDisplayUpdates` folder
2. **Network Share** - Shared folder accessible via UNC path
3. **Local Folder** - Any folder on the local machine

## USB Drive Updates

### Setup

1. **Create the update folder** on your USB drive
2. **Place the installer** in the update folder
3. **Name the file** to include "Member" and "Setup" (e.g., `Member-Name-Display-Setup-1.3.0.exe`)

### Folder Structure

```
USB Drive/
└── MemberDisplayUpdates/
    └── Member-Name-Display-Setup-1.3.0.exe
```

### Usage

1. **Create a `MemberDisplayUpdates` folder** on a USB drive
2. **Place the new installer** in the MemberDisplayUpdates folder
3. **Insert the USB drive** into the target computer
4. **Start the application** - it will automatically detect and install updates

### Example Structure

```
E:\
└── MemberDisplayUpdates/
    └── Member-Name-Display-Setup-1.3.0.exe
```

## Network Share Updates

### Setup

1. **Set the environment variable** `MEMBERDISPLAY_UPDATE_SHARE` to point to your network share
2. **Place installers** in the network share folder
3. **Ensure network access** from target machines

### Configuration

```bash
# Set environment variable
set MEMBERDISPLAY_UPDATE_SHARE=\\server\updates\MemberDisplay
```

### Example Structure

```
\\server\updates\MemberDisplay\
└── Member-Name-Display-Setup-1.3.0.exe
```

## Build Output

After running `npm run make`, you'll find:

- `out/membernamedisplay-win32-x64/` - Portable version
- `out/Member Name Display Setup 1.2.0.exe` - Installer

## File Naming Requirements

### Required Elements

- **Include "Member"** in the filename
- **Include "Setup"** in the filename
- **Include version number** (e.g., 1.3.0)

### Valid Examples

- `Member-Name-Display-Setup-1.3.0.exe`
- `Member Name Display Setup 1.2.1.exe`
- `MemberSetup-1.3.0.exe`

### Invalid Examples

- `setup-1.3.0.exe` (missing "Member")
- `member-display.exe` (missing "Setup")
- `MemberSetup.exe` (missing version)

## Update Process

### Automatic Detection

1. **Application starts** and checks for updates
2. **Scans USB drives** for MemberDisplayUpdates folders
3. **Checks network share** if configured
4. **Downloads and installs** updates automatically

### Manual Check

1. **Open the application**
2. **Check for updates** in the menu
3. **Follow prompts** to install

### Installation Process

1. **Downloads installer** to temp folder
2. **Runs installer** silently
3. **Restarts application** with new version
4. **Cleans up** temporary files

## Configuration Options

### Environment Variables

- `MEMBERDISPLAY_UPDATE_SHARE` - Network share path for updates
- `MEMBERDISPLAY_UPDATE_CHECK_INTERVAL` - How often to check for updates (in minutes)

### Default Settings

- **Check interval**: 30 minutes
- **Auto-download**: Enabled
- **Auto-install**: Enabled
- **Restart after install**: Enabled

## Troubleshooting

### Common Issues

**Update Not Detected**
- Check file naming requirements
- Verify folder structure
- Ensure file permissions

**Installation Fails**
- Check disk space
- Verify installer integrity
- Run as administrator

**Network Share Issues**
- Verify network connectivity
- Check share permissions
- Test UNC path access

### Debug Information

The application logs update attempts to:
- Windows Event Log
- Application log file
- Console output (development)

### Manual Installation

If automatic updates fail:

1. **Download installer** manually
2. **Close application** completely
3. **Run installer** as administrator
4. **Restart application**

## Security Considerations

### File Integrity

- Installers are verified before installation
- Checksums are validated
- Digital signatures are verified (if present)

### Network Security

- Use secure network connections
- Implement proper access controls
- Monitor for unauthorized access

### USB Security

- Scan USB drives for malware
- Use dedicated update drives
- Implement drive policies

## Best Practices

### Distribution

1. **Test updates** thoroughly before distribution
2. **Use consistent naming** conventions
3. **Document changes** in release notes
4. **Provide rollback options**

### Monitoring

1. **Track update success rates**
2. **Monitor for failed installations**
3. **Collect user feedback**
4. **Maintain update logs**

### Maintenance

1. **Clean up old installers** regularly
2. **Update documentation** with changes
3. **Test update process** periodically
4. **Backup update infrastructure**

## Advanced Configuration

### Custom Update Sources

You can configure multiple update sources:

```javascript
// In your application configuration
{
  "updateSources": [
    "E:\\MemberDisplayUpdates",
    "\\\\server\\updates\\MemberDisplay",
    "C:\\local-updates"
  ]
}
```

### Update Scheduling

Configure when updates are checked:

```javascript
{
  "updateCheckInterval": 60, // minutes
  "updateCheckOnStartup": true,
  "updateCheckOnResume": true
}
```

### User Notifications

Control update notifications:

```javascript
{
  "notifyOnUpdateAvailable": true,
  "notifyOnUpdateDownloaded": true,
  "notifyOnUpdateInstalled": true
}
```

This offline updater provides a robust solution for distributing updates in environments without internet access, ensuring your users always have the latest version of Member Name Display. 