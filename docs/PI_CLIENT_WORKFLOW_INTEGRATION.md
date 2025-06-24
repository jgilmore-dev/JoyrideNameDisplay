# Pi Client Workflow Integration

This document explains how the Raspberry Pi display client is integrated into the GitHub workflow and update system.

## Overview

The Pi client update system is designed to work seamlessly with the GitHub release workflow, providing automatic updates for Raspberry Pi display clients alongside the desktop application releases.

## Pi Client Files

The following files are included in each release for Pi clients:

### Core Files
- **`pi-display-client.html`**: Main Pi display client interface
- **`pi-boot-setup.sh`**: Initial setup and configuration script
- **`update-client.sh`**: Automatic update script for Pi clients

### Metadata Files
- **`pi-client-metadata.json`**: Pi-specific release metadata
- **`pi-client-{version}.tar.gz`**: Complete Pi client package

## Workflow Integration

### 1. Pi Asset Preparation

The workflow automatically prepares Pi client assets:

```yaml
- name: Prepare Pi client assets
  run: |
    # Copy Pi client files
    cp src/pi-display-client.html pi-assets/
    cp scripts/pi-boot-setup.sh pi-assets/
    cp scripts/update-client.sh pi-assets/
    
    # Create Pi client package
    tar -czf pi-client-$VERSION.tar.gz -C pi-assets .
```

### 2. Asset Verification

The verification script checks Pi client files:

```bash
npm run verify-release
```

This verifies:
- File sizes are reasonable
- Required content is present
- Scripts have proper shebangs
- HTML includes necessary components

### 3. Release Upload

Pi client assets are uploaded to GitHub releases:

- Individual files for direct download
- Complete package for bulk deployment
- Metadata for update system integration

## Update System Integration

### Current Pi Update Process

1. **Version Check**: Pi clients check GitHub releases API
2. **File Download**: Download `pi-display-client.html` from release
3. **Backup & Install**: Backup current version and install new version
4. **Verification**: Verify new client loads correctly
5. **Rollback**: Restore backup if update fails

### Release-Based Updates

With the workflow integration, Pi clients can now:

1. **Download from Releases**: Get files from specific release versions
2. **Version-Specific URLs**: Access files with version tags
3. **Package Downloads**: Download complete Pi client packages
4. **Metadata Access**: Use release metadata for update decisions

## URL Structure

### Direct File Downloads
```
https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v1.4.1/pi-display-client.html
https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v1.4.1/pi-boot-setup.sh
https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v1.4.1/update-client.sh
```

### Package Downloads
```
https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v1.4.1/pi-client-1.4.1.tar.gz
```

### Metadata Access
```
https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v1.4.1/pi-client-metadata.json
```

## Benefits of Workflow Integration

### For Pi Clients
- **Versioned Updates**: Access specific release versions
- **Reliable Downloads**: Files are part of official releases
- **Rollback Support**: Easy to revert to previous versions
- **Package Management**: Complete client packages available

### For Administrators
- **Centralized Management**: All assets in one release
- **Version Tracking**: Clear version history
- **Quality Assurance**: Verified assets before release
- **Deployment Options**: Multiple download methods

### For Developers
- **Automated Process**: No manual file management
- **Consistent Releases**: All platforms updated together
- **Testing Integration**: Verification before release
- **Documentation**: Release notes include Pi client info

## Usage Examples

### Initial Pi Setup
```bash
# Download setup script from latest release
wget https://github.com/jgilmore-dev/MemberNameDisplay/releases/latest/download/pi-boot-setup.sh
chmod +x pi-boot-setup.sh
./pi-boot-setup.sh
```

### Manual Pi Client Update
```bash
# Download specific version
wget https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v1.4.1/pi-display-client.html
```

### Bulk Pi Deployment
```bash
# Download complete package
wget https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v1.4.1/pi-client-1.4.1.tar.gz
tar -xzf pi-client-1.4.1.tar.gz
```

### Automated Updates
The existing `update-client.sh` script automatically:
- Checks for new releases
- Downloads from release URLs
- Installs and verifies updates
- Rolls back on failure

## Release Information

Each release includes Pi client information:

### Release Body
```
## Release v1.4.1

### Platform Support
- **Windows**: .exe installer
- **macOS**: .dmg and .zip packages
- **Linux**: .deb, .rpm, and .AppImage packages
- **Raspberry Pi**: HTML client and setup scripts

### Installation
**Raspberry Pi Clients**: 
- Use `pi-boot-setup.sh` for initial setup
- Clients will automatically update from this release
- Manual update: `wget https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v1.4.1/pi-display-client.html`
```

### Release Assets
- `pi-display-client.html` - Main Pi client
- `pi-boot-setup.sh` - Setup script
- `update-client.sh` - Update script
- `pi-client-metadata.json` - Pi metadata
- `pi-client-1.4.1.tar.gz` - Complete package

## Verification Process

### Pre-Release Verification
```bash
# Verify all assets including Pi clients
npm run verify-release
```

Expected output:
```
🔍 Verifying release assets for update system compatibility...
📦 Current version: 1.4.1

📁 Found 6 build assets:
  ✅ MemberNameDisplay-1.4.1-Setup.exe
  ✅ Member Name Display-1.4.1.dmg
  ✅ membernamedisplay_1.4.1_amd64.deb

🍓 Found 3 Pi client assets:
  ✅ pi-display-client.html
  ✅ pi-boot-setup.sh
  ✅ update-client.sh

📋 Summary:
✅ All assets are compatible with the update system!
```

### Post-Release Verification
```bash
# Test Pi client download
wget https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v1.4.1/pi-display-client.html
# Verify file content and functionality
```

## Troubleshooting

### Common Issues

**Pi Client Not Found**
- Check that Pi client files exist in repository
- Verify workflow includes Pi asset preparation
- Ensure files are properly copied to pi-assets directory

**Download Failures**
- Verify release URLs are correct
- Check file permissions on Pi devices
- Ensure network connectivity

**Update Script Issues**
- Verify shebang in shell scripts
- Check script permissions (should be executable)
- Test scripts on target Pi devices

### Debugging

**Check Pi Assets**
```bash
# List Pi client files
ls -la src/pi-display-client.html scripts/pi-*.sh

# Verify file content
head -10 src/pi-display-client.html
head -10 scripts/pi-boot-setup.sh
```

**Test Release URLs**
```bash
# Test direct download
curl -I https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v1.4.1/pi-display-client.html

# Test package download
curl -I https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v1.4.1/pi-client-1.4.1.tar.gz
```

## Future Enhancements

Planned improvements for Pi client workflow integration:

- **Automated Testing**: Test Pi clients in virtual Pi environments
- **Delta Updates**: Generate delta update packages for Pi clients
- **Configuration Management**: Include Pi-specific configurations
- **Health Monitoring**: Pi client health check integration
- **Rollback Automation**: Automated rollback mechanisms
- **Deployment Scripts**: Enhanced deployment automation 