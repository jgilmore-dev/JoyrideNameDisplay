# JoyRide Name Display v1.3.0 Release Notes

## Major Improvements

### Performance & Stability
- **Memory leak fixes** - Eliminated memory leaks in banner components and event listeners
- **Optimized search** - Added debouncing and memoization for faster member search
- **Improved font sizing** - Binary search algorithm with caching for better performance
- **Enhanced image preloading** - Priority queue system for smoother slideshows
- **Seamless transitions** - Dual-image approach eliminates black flashes during slideshow wrap-around

### Code Architecture
- **Unified renderer system** - Single entry point for all windows (banners and control panel)
- **Centralized BannerManager** - Eliminated code duplication and improved banner management
- **Configuration system** - Centralized settings management with app.config.js
- **Better error handling** - Improved reliability during events

### User Experience
- **Streamlined control panel** - Combined data and member management for easier workflow
- **Better display controls** - Moved clear banner buttons to more prominent positions
- **Font color reset** - Added reset button for quick color restoration
- **Professional interface** - Removed emojis for cleaner, more professional appearance
- **Improved scrolling** - Fixed control panel scrolling issues

### New Features
- **Offline auto-updater** - Automatic updates from local folders, USB drives, and network shares
- **Cross-platform support** - Windows, Linux, and macOS builds with proper icons
- **Automated builds** - GitHub Actions workflow for consistent, automated releases
- **Code signing ready** - Configuration for secure, signed executables
- **Enhanced documentation** - Comprehensive guides and troubleshooting

### Technical Improvements
- **Event listener cleanup** - Proper cleanup prevents memory leaks
- **Window management** - Better banner window lifecycle management
- **IPC communication** - Streamlined communication between main and renderer processes
- **Build system** - Updated Electron Forge configuration for better packaging
- **Icon generation** - Automated cross-platform icon creation for all builds

## Bug Fixes
- Fixed banner creation issues when enabling displays
- Resolved settings update conflicts
- Fixed slideshow transition artifacts
- Corrected control panel overflow issues

## System Requirements
- **Windows 10/11** (64-bit) - Primary platform
- **Linux** (64-bit) - Full support with DEB and RPM packages
- **macOS** (64-bit) - Full support with DMG and ZIP packages
- **4GB RAM** minimum
- **100MB** disk space

## Installation
- **Windows**: Download and run the installer (.exe)
- **Linux**: Download DEB or RPM package and install
- **macOS**: Download DMG file and drag to Applications

## Build & Distribution
- **Automated builds** via GitHub Actions for all platforms
- **Consistent packaging** with proper icons for each platform
- **Manual trigger** available for testing builds without releases
- **Cross-platform icon generation** during build process

## Known Issues
- Linux and macOS support is experimental and may have compatibility issues
- Some antivirus software may flag unsigned executables (see code signing guide)
- macOS builds are unsigned by default (users may need to right-click → Open)

## Migration from v1.2.0
- Settings will be automatically migrated
- No manual configuration changes required
- All existing member data remains compatible

## Support
- Check the [User Guide](docs/USER_GUIDE.md) for detailed instructions
- Review [troubleshooting tips](docs/USER_GUIDE.md#troubleshooting) for common issues
- Report bugs or request features through GitHub issues
- See [Contributing Guide](CONTRIBUTING.md) for development information

---

*Built with love for the JoyRide community* 