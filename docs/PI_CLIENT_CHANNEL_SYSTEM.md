# Pi Client Channel System

The Raspberry Pi display clients support a dual-channel update system that allows you to manage development and production workflows efficiently. This system enables you to test new features without affecting production devices while maintaining stability across your deployment.

## Overview

The channel system provides two update channels:

- **Stable Channel**: Downloads from official GitHub releases
- **Testing Channel**: Downloads from the main development branch

## Channel Behavior

### Stable Channel (Default)

- **Source**: GitHub releases
- **Stability**: High - Production ready
- **Update Frequency**: When releases are published
- **Recommended For**: Production environments
- **Risk Level**: Low

### Testing Channel

- **Source**: Main development branch
- **Stability**: Variable - May contain bugs
- **Update Frequency**: On every commit to main
- **Recommended For**: Development and testing
- **Risk Level**: Medium to High

## Managing Channels

### Channel Manager Script

The `pi-channel-manager.sh` script provides a user-friendly interface for managing update channels.

#### Basic Commands

```bash
# Show current status
./pi-channel-manager.sh status

# Set channel directly
./pi-channel-manager.sh set-channel stable
./pi-channel-manager.sh set-channel testing

# Interactive setup
./pi-channel-manager.sh setup

# Check for updates
./pi-channel-manager.sh check

# Show help
./pi-channel-manager.sh help
```

#### Interactive Setup

Run the interactive setup for guided channel selection:

```bash
./pi-channel-manager.sh setup
```

This will present you with options and explain the implications of each choice.

### Manual Channel Configuration

You can also manually set the channel by creating or editing the `.update-channel` file:

```bash
# Set to stable channel
echo "stable" > /home/pi/member-name-display/.update-channel

# Set to testing channel
echo "testing" > /home/pi/member-name-display/.update-channel
```

## Development Workflow

### Scenario: Testing New Features

1. **Identify a Pi for testing**: Choose a Pi that you can dedicate to testing
2. **Switch to testing channel**:
   ```bash
   ./pi-channel-manager.sh set-channel testing
   ```
3. **Develop and test**: Make changes to the main branch
4. **Monitor updates**: The Pi will automatically pull the latest changes
5. **Validate features**: Test new functionality on the Pi
6. **Switch back when ready**: Once features are stable, switch back to stable channel

### Scenario: Production Deployment

1. **Keep production Pis on stable**: All production Pis should use the stable channel by default
2. **Test on development Pi**: Use a dedicated testing Pi with the testing channel
3. **Release when ready**: When features are validated, create a GitHub release
4. **Production updates**: Production Pis will automatically update to the new release

## Update Process

### Stable Channel Updates

1. Check GitHub releases for the latest version
2. If a release-specific file exists, download from the release
3. Otherwise, fall back to the main branch
4. Update the client and log the version

### Testing Channel Updates

1. Check for pre-releases first
2. If no pre-releases, get the latest commit hash from main
3. Download from the main branch
4. Update the client and log the version

## Configuration Files

### Channel Configuration

- **File**: `/home/pi/member-name-display/.update-channel`
- **Purpose**: Stores the current update channel
- **Values**: `stable` or `testing`
- **Default**: `stable` (if file doesn't exist)

### Version Tracking

- **File**: `/home/pi/member-name-display/.client-version`
- **Purpose**: Tracks the current client version
- **Format**: Version string (e.g., `1.4.0` or `dev-a1b2c3d`)

### Update Logs

- **File**: `/home/pi/member-name-display/update.log`
- **Purpose**: Logs all update activities
- **Format**: Timestamped entries with status information

## Best Practices

### Production Environments

1. **Use stable channel**: Always use the stable channel for production Pis
2. **Test before deployment**: Use a testing Pi to validate new releases
3. **Monitor updates**: Check update logs regularly
4. **Have a rollback plan**: Keep backups of working configurations

### Development Environments

1. **Dedicated testing Pi**: Use a separate Pi for testing new features
2. **Regular validation**: Test features thoroughly before releasing
3. **Clear communication**: Document what's being tested
4. **Quick rollback**: Be prepared to switch back to stable if issues arise

### Mixed Environments

1. **Label your Pis**: Clearly mark which Pis are for testing vs production
2. **Document configurations**: Keep track of which channel each Pi uses
3. **Regular audits**: Periodically check channel configurations
4. **Gradual rollout**: Test new features on a subset of Pis before full deployment

## Troubleshooting

### Common Issues

#### Pi Not Updating

1. Check the channel configuration:
   ```bash
   cat /home/pi/member-name-display/.update-channel
   ```

2. Check for internet connectivity:
   ```bash
   ping -c 1 8.8.8.8
   ```

3. Check update logs:
   ```bash
   tail -f /home/pi/member-name-display/update.log
   ```

#### Wrong Channel Active

1. Verify the channel file:
   ```bash
   cat /home/pi/member-name-display/.update-channel
   ```

2. Reset to desired channel:
   ```bash
   ./pi-channel-manager.sh set-channel stable
   ```

#### Update Failures

1. Check the backup directory:
   ```bash
   ls -la /home/pi/member-name-display/backup/
   ```

2. Restore from backup if needed:
   ```bash
   cp /home/pi/member-name-display/backup/pi-display-client.html.bak /home/pi/member-name-display/pi-display-client.html
   ```

### Debugging Commands

```bash
# Check current status
./pi-channel-manager.sh status

# Force an update check
./pi-channel-manager.sh check

# View recent update logs
tail -20 /home/pi/member-name-display/update.log

# Check network connectivity
curl -s https://api.github.com/repos/jgilmore-dev/MemberNameDisplay/releases/latest

# Verify file permissions
ls -la /home/pi/member-name-display/
```

## Integration with GitHub Workflow

The channel system integrates with the GitHub release workflow:

1. **Development**: Push changes to main branch
2. **Testing**: Pis on testing channel automatically update
3. **Validation**: Test features on testing Pis
4. **Release**: Create GitHub release when ready
5. **Production**: Pis on stable channel automatically update

For detailed information about the GitHub workflow integration, see the [Pi Client Workflow Integration Guide](PI_CLIENT_WORKFLOW_INTEGRATION.md).

## Security Considerations

- **Channel files**: The `.update-channel` file should be readable only by the pi user
- **Update logs**: Logs may contain sensitive information about your network
- **Backup files**: Backup files contain previous versions of the client
- **Network access**: The update system requires internet access to GitHub

## Performance Impact

- **Stable channel**: Minimal impact, updates only when releases are published
- **Testing channel**: More frequent updates, may impact performance during development
- **Update process**: Updates are quick and don't interrupt display operation
- **Rollback**: Automatic rollback ensures minimal downtime

## Future Enhancements

Potential improvements to the channel system:

- **Multiple testing channels**: Support for different development branches
- **Scheduled updates**: Control when updates occur
- **Update notifications**: Alert when updates are available
- **Remote management**: Control channels from the control panel
- **Update policies**: Define rules for automatic updates 