# GitHub Workflow Updates for Unified Update System

This document explains the updates made to the GitHub workflow to ensure compatibility with the new unified cross-platform update system.

## Overview

The GitHub workflow has been enhanced to:
- Verify release assets are compatible with the update system
- Generate proper metadata for the update mechanism
- Organize artifacts for better platform detection
- Provide comprehensive release information

## Key Changes Made

### 1. Asset Verification Step

**Added**: `npm run verify-release` step after building

This step verifies that:
- All installer files follow proper naming conventions
- Version numbers match package.json
- File sizes are reasonable for installers
- All platforms are covered (Windows, macOS, Linux)

### 2. Artifact Organization

**Enhanced**: Artifact organization for better update system detection

```yaml
- name: Organize artifacts for update system
  run: |
    mkdir -p artifacts/${{ matrix.os }}
    cp -r out/make/* artifacts/${{ matrix.os }}/
```

This ensures:
- Clean artifact structure
- Platform-specific organization
- Better file discovery by the update system

### 3. Update Metadata Generation

**Added**: Automatic generation of update metadata

The workflow now generates `update-metadata.json` containing:
- Version information
- Release date
- Release notes from GitHub
- List of all installer files
- Platform-specific file mappings

### 4. Enhanced Release Information

**Enhanced**: Release body with update system information

The workflow now includes:
- Platform support information
- Update system capabilities
- Installation instructions
- Automatic update features

## File Naming Requirements

The update system expects installer files to follow these patterns:

### Windows
- Pattern: `MemberNameDisplay*Setup*.exe`
- Example: `MemberNameDisplay-1.4.1-Setup.exe`

### macOS
- Pattern: `MemberNameDisplay*.dmg` or `MemberNameDisplay*.zip`
- Example: `Member Name Display-1.4.1.dmg`

### Linux
- Pattern: `MemberNameDisplay*.deb`, `MemberNameDisplay*.rpm`, or `MemberNameDisplay*.AppImage`
- Example: `membernamedisplay_1.4.1_amd64.deb`

## Verification Script

The `scripts/verify-release-assets.js` script checks:

### Naming Conventions
- Files contain "Member" or "MemberName"
- Files include version numbers
- Files have appropriate extensions

### Version Consistency
- File versions match package.json version
- No version mismatches between files

### Platform Coverage
- Windows: .exe files present
- macOS: .dmg or .zip files present
- Linux: .deb, .rpm, or .AppImage files present

### File Integrity
- Reasonable file sizes for installers
- No corrupted or empty files

## Usage

### Local Verification

Before creating a release, verify your build:

```bash
# Build the application
npm run make

# Verify release assets
npm run verify-release

# Generate metadata (optional)
npm run verify-release -- --generate-metadata
```

### Workflow Integration

The verification is automatically run in the GitHub workflow:

1. **Build**: `npm run make` creates all platform installers
2. **Verify**: `npm run verify-release` checks compatibility
3. **Organize**: Artifacts are organized by platform
4. **Upload**: All assets are uploaded to GitHub release

## Expected Workflow Output

### Successful Verification
```
🔍 Verifying release assets for update system compatibility...
📦 Current version: 1.4.1

📁 Found 6 build assets:
  ✅ MemberNameDisplay-1.4.1-Setup.exe
  ✅ Member Name Display-1.4.1.dmg
  ✅ membernamedisplay_1.4.1_amd64.deb
  ✅ membernamedisplay-1.4.1.x86_64.rpm
  ✅ MemberNameDisplay-1.4.1.AppImage
  ✅ membernamedisplay-1.4.1.zip

📋 Summary:
✅ All assets are compatible with the update system!

🖥️  Platform Coverage:
  Windows: 1 assets
  macOS: 2 assets
  Linux: 3 assets
✅ All platforms covered
```

### Failed Verification
```
⚠️  Found 2 potential issues:
   - Naming convention: Should include "MemberNameDisplay" and version
   - Version mismatch: File version doesn't match package.json version

💡 Tips for fixing issues:
1. Ensure package.json version is correct
2. Run "npm run make" to rebuild all platforms
3. Check that forge.config.js is properly configured
4. Verify icon files exist in src/assets/icons/
```

## Troubleshooting

### Common Issues

**Version Mismatch**
- Ensure package.json version is correct
- Rebuild with `npm run make`
- Check that version is updated before building

**Missing Platforms**
- Verify forge.config.js has all required makers
- Check build environment for platform-specific tools
- Ensure all dependencies are installed

**Naming Issues**
- Verify productName in package.json
- Check forge.config.js executableName setting
- Ensure proper icon files exist

### Workflow Debugging

**Check Build Output**
```bash
# List all build artifacts
find out/ -name "*.exe" -o -name "*.dmg" -o -name "*.deb" -o -name "*.rpm" -o -name "*.AppImage"
```

**Verify Package Configuration**
```bash
# Check current version
npm version

# Check forge configuration
npm run make -- --help
```

## Best Practices

### Before Creating a Release

1. **Update Version**: Ensure package.json version is correct
2. **Test Build**: Run `npm run make` locally
3. **Verify Assets**: Run `npm run verify-release`
4. **Check Icons**: Ensure all platform icons exist
5. **Test Installers**: Test installers on target platforms

### Release Process

1. **Create Tag**: `git tag v1.4.1`
2. **Push Tag**: `git push origin v1.4.1`
3. **Create Release**: Use GitHub web interface
4. **Monitor Workflow**: Check GitHub Actions tab
5. **Verify Assets**: Download and test installers

### Maintenance

- Keep forge.config.js updated with new platforms
- Update verification script for new file types
- Monitor workflow success rates
- Update documentation for new features

## Future Enhancements

Planned improvements to the workflow:

- **Automated Testing**: Test installers in virtual machines
- **Code Signing**: Automated code signing for all platforms
- **Delta Updates**: Generate delta update packages
- **Release Notes**: Automated changelog generation
- **Quality Gates**: Additional verification steps
- **Rollback Support**: Automated rollback mechanisms 