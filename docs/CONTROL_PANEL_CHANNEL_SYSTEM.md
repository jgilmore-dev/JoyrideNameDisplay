# Control Panel Channel System

The Member Name Display control panel now includes a dual-channel update system that allows you to choose between stable production releases and testing development builds.

## Overview

The control panel channel system provides:

- **Dual-Channel Updates**: Stable and testing channels for the control panel application
- **Easy Channel Switching**: Simple UI to switch between channels
- **Automatic Updates**: Seamless update management based on selected channel
- **Development Workflow**: Test new features without building new executables
- **Production Stability**: Keep production installations on stable releases

## Channel Types

### Stable Channel (Default)
- **Source**: GitHub releases
- **Stability**: High - Production ready
- **Update Frequency**: When releases are published
- **Risk Level**: Low
- **Recommended For**: Production environments

### Testing Channel
- **Source**: Development builds and pre-releases
- **Stability**: Variable - May contain bugs
- **Update Frequency**: On every development build or pre-release
- **Risk Level**: Medium to High
- **Recommended For**: Development and testing

## How It Works

### Channel Selection
The control panel stores its update channel preference in a configuration file:
- **Location**: `%APPDATA%/MemberNameDisplay/.update-channel` (Windows)
- **Location**: `~/Library/Application Support/MemberNameDisplay/.update-channel` (macOS)
- **Location**: `~/.config/MemberNameDisplay/.update-channel` (Linux)
- **Default**: `stable` (if file doesn't exist)

### Update Process

#### Stable Channel Updates
1. Check GitHub releases for the latest version
2. Compare with current version
3. Download and install if newer version available
4. Provide release notes and version information

#### Testing Channel Updates
1. Check for pre-releases first
2. If no pre-releases, check latest commit from main branch
3. Create development build information
4. Always consider it an update (for testing purposes)
5. Provide development build details

## User Interface

### Update Manager Section
The control panel includes an enhanced Update Manager section with:

#### Channel Display
- **Current Channel**: Shows the active update channel
- **Channel Badge**: Color-coded indicator (green for stable, yellow for testing)
- **Description**: Explains what each channel provides

#### Channel Switching
- **Switch Button**: Easy toggle between stable and testing
- **Confirmation**: Clear indication of channel change
- **Immediate Check**: Automatic update check after channel change

#### Update Information
- **Version Display**: Shows available version with channel indicator
- **Release Notes**: Displays release information
- **Warning Messages**: Special warnings for testing channel updates
- **Progress Tracking**: Download and installation progress

### Visual Indicators

#### Channel Badges
- **🟢 Stable**: Green badge for production releases
- **🟡 Testing**: Yellow badge for development builds

#### Status Colors
- **Green**: Update available
- **Blue**: Currently updating
- **Red**: Error occurred
- **Gray**: Up to date

## Usage

### Switching Channels

1. **Open Update Manager**: Go to the "Software Updates" section
2. **View Current Channel**: See your current update channel
3. **Switch Channel**: Click "Switch to Testing" or "Switch to Stable"
4. **Confirm Change**: The channel will change immediately
5. **Check Updates**: An automatic update check will occur

### Development Workflow

1. **Switch to Testing**: Change your channel to testing
2. **Develop Features**: Work on new features in your development environment
3. **Test Changes**: The control panel will automatically pick up development builds
4. **Validate Features**: Test thoroughly on the testing channel
5. **Switch Back**: Return to stable when ready for production

### Production Deployment

1. **Keep on Stable**: Production installations should use the stable channel
2. **Monitor Updates**: Check for updates regularly
3. **Test Before Deploy**: Use testing channel for validation
4. **Deploy Confidently**: Stable channel provides reliable updates

## Configuration

### Channel File Format
The channel configuration file contains a single line with the channel name:
```
stable
```
or
```
testing
```

### Automatic Behavior
- **Default Channel**: New installations default to stable
- **Persistent Setting**: Channel preference is saved between sessions
- **Immediate Effect**: Channel changes take effect immediately
- **Automatic Checks**: Update checks respect the selected channel

## Technical Details

### Update Sources

#### Stable Channel Sources
- GitHub releases (primary)
- Local update directory (fallback)
- Network shares (if configured)
- USB drives (if available)

#### Testing Channel Sources
- GitHub pre-releases (primary)
- Latest commit from main branch (fallback)
- Local development builds
- Network development builds

### API Integration

#### GitHub API Endpoints
- **Stable**: `/repos/jgilmore-dev/MemberNameDisplay/releases/latest`
- **Testing**: `/repos/jgilmore-dev/MemberNameDisplay/releases` (for pre-releases)
- **Development**: `/repos/jgilmore-dev/MemberNameDisplay/commits/main`

#### IPC Handlers
- `get-update-channel`: Get current channel information
- `set-update-channel`: Change update channel
- `check-for-updates`: Check for updates on current channel
- `get-update-status`: Get current update status

### Version Comparison
- **Stable**: Standard semantic versioning comparison
- **Testing**: Always considers development builds as updates
- **Fallback**: Graceful fallback to local sources if GitHub unavailable

## Best Practices

### Development Environment
1. **Use Testing Channel**: Switch to testing for development work
2. **Regular Testing**: Test features thoroughly before release
3. **Quick Iteration**: Use testing channel for rapid development cycles
4. **Feature Validation**: Ensure features work correctly before switching back

### Production Environment
1. **Stable Channel Only**: Keep production on stable channel
2. **Test Before Deploy**: Validate updates on testing channel first
3. **Monitor Updates**: Check for updates regularly
4. **Backup Configurations**: Keep backup of working configurations

### Mixed Environment
1. **Clear Labeling**: Clearly mark testing vs production installations
2. **Documentation**: Document which installations use which channel
3. **Regular Audits**: Periodically check channel configurations
4. **Gradual Rollout**: Test new features before full deployment

## Troubleshooting

### Common Issues

#### Channel Not Changing
1. **Check Permissions**: Ensure write access to user data directory
2. **Restart Application**: Restart the control panel after channel change
3. **File Location**: Verify the channel file is in the correct location
4. **File Format**: Ensure the file contains only "stable" or "testing"

#### Updates Not Available
1. **Check Channel**: Verify you're on the correct channel
2. **Network Connectivity**: Ensure GitHub API access
3. **Version Comparison**: Check if you already have the latest version
4. **API Limits**: GitHub API may have rate limits

#### Testing Channel Issues
1. **No Pre-releases**: Testing channel may not have pre-releases available
2. **Development Builds**: Check if development builds are being created
3. **Commit Access**: Ensure access to main branch commits
4. **Fallback Sources**: Check local and network update sources

### Debugging Commands

#### Check Channel Configuration
```bash
# Windows
type "%APPDATA%\MemberNameDisplay\.update-channel"

# macOS
cat ~/Library/Application\ Support/MemberNameDisplay/.update-channel

# Linux
cat ~/.config/MemberNameDisplay/.update-channel
```

#### Manual Channel Change
```bash
# Windows
echo stable > "%APPDATA%\MemberNameDisplay\.update-channel"

# macOS
echo stable > ~/Library/Application\ Support/MemberNameDisplay/.update-channel

# Linux
echo stable > ~/.config/MemberNameDisplay/.update-channel
```

#### Check Update Sources
```bash
# Test GitHub API access
curl https://api.github.com/repos/jgilmore-dev/MemberNameDisplay/releases/latest

# Test pre-releases
curl https://api.github.com/repos/jgilmore-dev/MemberNameDisplay/releases
```

## Security Considerations

### Update Integrity
- **Signed Updates**: GitHub releases provide update integrity
- **Source Verification**: Updates come from verified GitHub repository
- **Rollback Protection**: Automatic rollback on failed updates

### Channel Security
- **Local Configuration**: Channel settings stored locally
- **No External Access**: Channel configuration doesn't expose external services
- **User Control**: Users have full control over channel selection

### Network Security
- **HTTPS Only**: All GitHub API communication uses HTTPS
- **API Rate Limits**: Respects GitHub API rate limits
- **Fallback Sources**: Local sources provide offline update capability

## Future Enhancements

### Planned Features
- **Multiple Testing Channels**: Support for different development branches
- **Update Scheduling**: Control when updates occur
- **Channel Policies**: Define rules for automatic channel switching
- **Advanced Monitoring**: Detailed update history and analytics

### Potential Improvements
- **Channel Validation**: Verify channel integrity and authenticity
- **Update Notifications**: Alert when updates are available
- **Bulk Channel Management**: Manage multiple installations
- **Update Rollback**: Ability to rollback to previous versions

## Integration with Development Workflow

The channel system integrates seamlessly with the development workflow:

1. **Development**: Work on features in development environment
2. **Testing**: Switch control panel to testing channel
3. **Validation**: Test features on testing channel
4. **Release**: Create GitHub release when ready
5. **Production**: Production installations automatically update via stable channel

This provides a complete development-to-production pipeline with automatic testing and deployment capabilities. 