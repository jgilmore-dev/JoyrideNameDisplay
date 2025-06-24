# Control Panel Update System

The Member Name Display control panel includes a comprehensive, cross-platform update system that allows for automatic and manual updates from multiple sources.

## Overview

The update system provides:
- **Cross-platform support**: Windows, macOS, and Linux
- Automatic update checking every 6 hours
- Manual update checking
- Multiple update sources (GitHub, local files, network shares, USB drives)
- Progress tracking during downloads
- Safe installation with rollback capabilities
- User-friendly interface integrated into the control panel

## Platform Support

### Windows
- **Installer Types**: `.exe` (Setup installers)
- **Installation Method**: Silent installer execution
- **File Detection**: `MemberNameDisplay*Setup*.exe`

### macOS
- **Installer Types**: `.dmg`, `.app`, `.pkg`
- **Installation Method**: DMG mounting and app copying
- **File Detection**: `MemberNameDisplay*.dmg`, `MemberNameDisplay*.app`

### Linux
- **Installer Types**: `.deb`, `.rpm`, `.AppImage`
- **Installation Method**: Package manager or AppImage installation
- **File Detection**: `MemberNameDisplay*.deb`, `MemberNameDisplay*.rpm`, `MemberNameDisplay*.AppImage`

## How It Works

### Update Sources

The system checks for updates in the following order:

1. **GitHub Releases** (Primary)
   - Automatically checks the latest release on GitHub
   - Downloads platform-specific installer files directly from GitHub
   - Provides release notes and version information

2. **Local Update Directory**
   - Checks `resources/updates` directory in the app installation
   - Useful for offline environments or controlled deployments

3. **Network Shares**
   - Checks network shares specified via `MEMBERNAMEDISPLAY_UPDATE_SHARE` environment variable
   - Ideal for enterprise deployments

4. **USB Drives**
   - Automatically detects USB drives with `MemberNameDisplayUpdates` folder
   - Perfect for portable update distribution

### Update Process

1. **Check for Updates**
   - Compares current version with available versions
   - Downloads update metadata and release notes
   - Determines if an update is needed

2. **Download Update**
   - Downloads platform-specific installer files to temporary directory
   - Shows progress bar during download
   - Validates file integrity

3. **Install Update**
   - Platform-specific installation process
   - Quits application to allow installation
   - Handles different installer types appropriately

## User Interface

### Update Manager Component

The update system is integrated into the control panel as a collapsible section under "Software Updates". The interface includes:

- **Current Version Display**: Shows the currently installed version
- **Last Check Time**: Displays when updates were last checked
- **Update Status**: Visual indicator of update availability
- **Release Notes**: Shows what's new in available updates
- **Progress Bar**: Displays download progress
- **Action Buttons**: Check, download, and install updates

### Status Indicators

- **Up to Date**: Green indicator when no updates are available
- **Update Available**: Green indicator when updates are found
- **Updating**: Blue indicator during download/installation
- **Error**: Red indicator when errors occur

## Configuration

### Environment Variables

- `MEMBERNAMEDISPLAY_UPDATE_SHARE`: Path to network share for updates
  ```
  # Windows
  set MEMBERNAMEDISPLAY_UPDATE_SHARE=\\server\updates\MemberNameDisplay
  
  # macOS/Linux
  export MEMBERNAMEDISPLAY_UPDATE_SHARE=/mnt/server/updates/MemberNameDisplay
  ```

### Update Sources Configuration

The system automatically detects update sources, but you can configure:

1. **Local Updates Directory**
   - Create `updates` folder in app resources
   - Place platform-specific installer files in this directory

2. **Network Share**
   - Set environment variable for network path
   - Ensure network access is available

3. **USB Drive Updates**
   - Create `MemberNameDisplayUpdates` folder on USB drive
   - Place platform-specific installer files in this folder

## Creating Updates

### Using the Update Package Creator

The project includes a script to automate update creation:

```bash
npm run create-update
```

This script will:
1. Prompt for new version number
2. Update package.json version
3. Build the application for all platforms
4. Create installer packages
5. Generate update metadata
6. Package everything for distribution

### Manual Update Creation

1. **Update Version**
   ```json
   {
     "version": "1.4.1"
   }
   ```

2. **Build Application for All Platforms**
   ```bash
   npm run make
   ```

3. **Create Update Package**
   - Copy platform-specific installers from `out/` directory
   - Create metadata file with version info
   - Package for distribution

### Update Metadata Format

```json
{
  "version": "1.4.1",
  "releaseDate": "2024-01-15T10:30:00.000Z",
  "releaseNotes": "Version 1.4.1 - Bug fixes and improvements...",
  "installerFiles": {
    "win32": "MemberNameDisplay-1.4.1-Setup.exe",
    "darwin": "MemberNameDisplay-1.4.1.dmg",
    "linux": "MemberNameDisplay-1.4.1.AppImage"
  },
  "checksums": {
    "MemberNameDisplay-1.4.1-Setup.exe": "sha256-hash-here",
    "MemberNameDisplay-1.4.1.dmg": "sha256-hash-here",
    "MemberNameDisplay-1.4.1.AppImage": "sha256-hash-here"
  }
}
```

## Deployment Options

### GitHub Releases

1. Create a new release on GitHub
2. Upload platform-specific installer files as release assets
3. Add release notes
4. Tag with version number (e.g., v1.4.1)

### Local Network Deployment

1. Set up network share with updates
2. Configure environment variable
3. Place platform-specific installer files in share
4. Control panel will automatically detect updates

### USB Drive Distribution

1. Create `MemberNameDisplayUpdates` folder on USB drive
2. Copy platform-specific installer files to folder
3. Insert USB drive into control panel computer
4. Updates will be detected automatically

### Offline Deployment

1. Create `updates` folder in app resources
2. Place platform-specific installer files in folder
3. Distribute with application
4. Updates available without internet connection

## Troubleshooting

### Common Issues

**Update Check Fails**
- Check internet connection
- Verify GitHub API access
- Review firewall settings

**Download Fails**
- Check available disk space
- Verify file permissions
- Review antivirus software

**Installation Fails**
- Ensure installer has proper permissions
- Check for running instances
- Review platform-specific requirements:
  - **Windows**: Run as administrator
  - **macOS**: Allow apps from identified developers
  - **Linux**: Ensure sudo privileges for package managers

### Logs and Debugging

Update system logs are written to the main application log. Look for entries starting with `[ControlPanelUpdater]`.

### Manual Update Installation

If automatic updates fail:
1. Download platform-specific installer manually from GitHub
2. Close the application
3. Run installer with appropriate permissions
4. Restart the application

## Security Considerations

### File Integrity
- SHA256 checksums are calculated for all installer files
- Files are validated before installation
- Corrupted downloads are automatically retried

### Update Sources
- Only trusted sources are checked
- GitHub releases are verified through official API
- Local files require proper file permissions

### Installation Safety
- Platform-specific installation methods
- Application quits cleanly before installation
- Rollback mechanisms are available

## Best Practices

### For Users
- Keep automatic updates enabled
- Check for updates before major events
- Test updates in non-production environment first
- Keep backup of current version

### For Administrators
- Test updates thoroughly before deployment
- Use network shares for controlled rollouts
- Monitor update success rates
- Maintain update documentation

### For Developers
- Follow semantic versioning
- Provide clear release notes
- Test installer packages on all platforms
- Maintain backward compatibility

## API Reference

### IPC Channels

The update system uses these IPC channels:

- `check-for-updates`: Manually check for updates
- `download-update`: Download available update
- `install-update`: Install downloaded update
- `get-update-status`: Get current update status
- `open-github-releases`: Open GitHub releases page
- `toggle-auto-update`: Enable/disable automatic updates

### Events

- `update-status-changed`: Broadcasted when update status changes

### Update Status Object

```javascript
{
  isUpdateAvailable: boolean,
  updateInfo: {
    version: string,
    releaseNotes: string,
    downloadUrl: string,
    localPath: string
  },
  updateProgress: number,
  isUpdating: boolean,
  lastCheckTime: Date,
  currentVersion: string
}
```

## Future Enhancements

Planned improvements to the update system:

- Delta updates for smaller download sizes
- Background update downloads
- Update scheduling options
- Rollback to previous versions
- Update notifications
- Enterprise update server support
- Update analytics and reporting
- Platform-specific update channels 