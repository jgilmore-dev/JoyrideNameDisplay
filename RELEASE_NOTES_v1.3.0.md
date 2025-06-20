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
- **Linux support** - Experimental support for Linux systems
- **Code signing ready** - Configuration for secure, signed executables
- **Enhanced documentation** - Comprehensive guides and troubleshooting

### Technical Improvements
- **Event listener cleanup** - Proper cleanup prevents memory leaks
- **Window management** - Better banner window lifecycle management
- **IPC communication** - Streamlined communication between main and renderer processes
- **Build system** - Updated Electron Forge configuration for better packaging

## Bug Fixes
- Fixed banner creation issues when enabling displays
- Resolved settings update conflicts
- Fixed slideshow transition artifacts
- Corrected control panel overflow issues

## System Requirements
- **Windows 10/11** (64-bit) - Primary platform
- **Linux** (64-bit) - Experimental support
- **4GB RAM** minimum
- **100MB** disk space

## Installation
- **Windows**: Download and run the installer
- **Linux**: Download the package, extract, and run the executable

## Known Issues
- Linux support is experimental and may have compatibility issues
- Some antivirus software may flag unsigned executables (see code signing guide)

## Migration from v1.2.0
- Settings will be automatically migrated
- No manual configuration changes required
- All existing member data remains compatible

## Support
- Check the [User Guide](docs/USER_GUIDE.md) for detailed instructions
- Review [troubleshooting tips](docs/USER_GUIDE.md#troubleshooting) for common issues
- Report bugs or request features through GitHub issues

---

*Built with love for the JoyRide community* 