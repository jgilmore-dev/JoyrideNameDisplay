# Member Name Display Application

**Making every moment memorable for your event or organization.**

Member Name Display is a desktop application built to enhance the VIP experience at any event. Display names, manage members, and create a professional, welcoming atmosphere for all participants.

## Quick Download

**Download Latest Version**

Visit the [releases page](https://github.com/jgilmore-dev/MemberNameDisplay/releases) to download the latest installer for your operating system (Windows, macOS, or Linux).

## Creating VIP Experiences

This application ensures every participant gets the recognition they deserve, with their name proudly displayed as they create memories that will last a lifetime.

### Features

* **Member Management**: Import your event registration data seamlessly
* **Professional Displays**: Show names on multiple monitors for banners or step-and-repeat
* **Day-of Flexibility**: Add walk-in members and adjust families during events
* **Volunteer-Friendly**: Simple controls designed for any team
* **Smooth Operations**: Manual control or automatic cycling
* **Family Support**: Handle siblings and multi-member families with ease
* **Font Customization**: Customize colors to match your event branding
* **Independent Banner Control**: Enable banners as needed for your setup
* **Local Display Support**: Display names on multiple local monitors
* **Raspberry Pi Network Support**: Opt-in system for remote Pi displays (disabled by default for efficiency)
* **Dual-Channel Updates**: Stable and testing update channels for both control panel and Pi clients
* **Queue Management**: Stage multiple members per banner with move functionality
* **Fuzzy Search**: Intelligent name matching with typo tolerance
* **Slideshow Support**: Background image rotation during events
* **Real-time Updates**: Instant name display across all connected devices
* **Automatic Updates**: Self-updating system for both control panel and Pi clients
* **Network Discovery**: Automatic Pi client detection and management

## Perfect For

* **Community events**
* **Special needs gatherings**
* **Fundraisers**
* **Any event** where participants deserve special recognition

## Get Started in Minutes

* **[Quick Start Guide](docs/QUICK_START.md)** - Be displaying names in 5 minutes
* **[User Instructions](docs/USER_GUIDE.md)** - Everything your team needs to know
* **[Sample Data](sample-members.csv)** - Test it out with our example file

## For Developers

* **[Project Specifications](docs/PROJECT_SPECIFICATIONS.md)** - Comprehensive project goals, requirements, and technical specifications
* **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project

## System Requirements

* **Windows 10/11** (64-bit)
* **macOS** (Intel & Apple Silicon, 64-bit)
* **Linux** (Debian/Ubuntu & Fedora/RPM, 64-bit)
* **4GB RAM** minimum
* **100MB** disk space
* **Multiple monitors** (recommended for dual banners)

## Installation

### Windows
1. Download the latest `.exe` installer from the [releases page](https://github.com/jgilmore-dev/MemberNameDisplay/releases).
2. Run the installer and follow the setup wizard.
3. Launch from your Start Menu or Desktop.

### macOS
1. Download the latest `.dmg` file from the [releases page](https://github.com/jgilmore-dev/MemberNameDisplay/releases).
2. Open the `.dmg` file.
3. Drag the "Member Name Display" application into your "Applications" folder.
4. Launch from your Applications folder.

### Linux
1. Download the appropriate package for your distribution (`.deb` for Debian/Ubuntu, `.rpm` for Fedora/CentOS) from the [releases page](https://github.com/jgilmore-dev/MemberNameDisplay/releases).
2. Install the package using your system's package manager.
   * For `.deb`: `sudo dpkg -i membernamedisplay_*.deb`
   * For `.rpm`: `sudo rpm -i membernamedisplay_*.rpm`
3. Launch the application from your system's application menu.

## Member Data Format

Use your existing registration data in this simple format:

```
LastName,Member1,Member2,Member3
Smith,Emma,,
Johnson,Michael,Sophia,,
Williams,David,,
Brown,Sarah,Alex,Emma
```

## How It Works

1. **Import Your Members**: Load your event registration CSV
2. **Set Up Displays**: Choose which monitors to use for banners
3. **Customize Appearance**: Select font colors to match your event
4. **Enable Banners**: Activate displays when ready for your event
5. **Create Joy**: Watch participants light up when they see their name displayed

## Getting Help

* Check our [User Guide](docs/USER_GUIDE.md) for step-by-step instructions
* Review troubleshooting tips for common questions
* Use our sample data file to practice

## Updates

The application includes a built-in update system that automatically checks for new versions and allows for easy updates from multiple sources:

* **Automatic Updates**: Checks for updates every 6 hours
* **Multiple Sources**: GitHub releases, local files, network shares, and USB drives
* **Safe Installation**: Automatic rollback if updates fail
* **User-Friendly Interface**: Integrated update manager in the control panel

### Control Panel Channel System

The control panel supports a dual-channel update system for flexible development and production workflows:

* **Stable Channel** (Default): Downloads from official GitHub releases
  * High stability and reliability
  * Updates only when releases are published
  * Recommended for production environments

* **Testing Channel**: Downloads from development builds and pre-releases
  * Latest features and fixes
  * Updates on every development build or pre-release
  * May contain bugs or instability
  * Recommended for development and testing

#### Managing Control Panel Channels

Use the Update Manager in the control panel to switch between channels:

1. **Open Update Manager**: Go to the "Software Updates" section
2. **View Current Channel**: See your current update channel
3. **Switch Channel**: Click "Switch to Testing" or "Switch to Stable"
4. **Confirm Change**: The channel will change immediately
5. **Check Updates**: An automatic update check will occur

This allows you to:
* Keep production control panels on stable releases by default
* Opt specific installations into testing for development work
* Test new features without building new executables
* Maintain system stability across your deployment

For detailed information about the control panel update system, see the [Control Panel Channel System Guide](docs/CONTROL_PANEL_CHANNEL_SYSTEM.md).

### Raspberry Pi Client Updates

The Raspberry Pi display clients support a dual-channel update system for flexible development and production workflows:

* **Stable Channel** (Default): Downloads from official GitHub releases
  * High stability and reliability
  * Updates only when releases are published
  * Recommended for production environments

* **Testing Channel**: Downloads from the main development branch
  * Latest features and fixes
  * Updates on every commit to main
  * May contain bugs or instability
  * Recommended for development and testing

#### Managing Pi Client Channels

Use the channel manager script to control update behavior:

```bash
# Show current status
./pi-channel-manager.sh status

# Switch to testing channel for development
./pi-channel-manager.sh set-channel testing

# Switch back to stable channel for production
./pi-channel-manager.sh set-channel stable

# Interactive setup
./pi-channel-manager.sh setup

# Check for updates
./pi-channel-manager.sh check
```

This allows you to:
* Keep production Pis on stable releases by default
* Opt specific Pis into testing for development work
* Test new features without recompiling
* Maintain system stability across your deployment

For detailed information about Pi client updates, see the [Pi Client Workflow Integration Guide](docs/PI_CLIENT_WORKFLOW_INTEGRATION.md).

* Visit the [releases page](https://github.com/jgilmore-dev/MemberNameDisplay/releases) for manual downloads
* Each new version includes improvements based on feedback from the community

## License

MIT License - Built with love by the open source community.

## Contributing

We welcome contributions! Whether you're a developer, tester, or just someone who wants to help, there are many ways to contribute:

* **Report bugs** or suggest improvements
* **Test the application** and provide feedback
* **Help with cross-platform support**
* **Improve documentation** or create guides
* **Share the project** with others who might benefit

See our [Contributing Guide](CONTRIBUTING.md) for more details on how to get involved.

---

**For developers**: This is an Electron application built with React. Feel free to explore the source code and contribute to making events even more special.

*Because every member deserves recognition.*