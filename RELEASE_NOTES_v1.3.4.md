# JoyRide Name Display v1.3.4 Release Notes

This release is dedicated to finalizing and hardening the automated build and release pipeline. The application now benefits from a professional, cross-platform CI/CD process that ensures consistent, reliable, and version-accurate builds for Windows, macOS, and Linux.

While there are no new end-user features, this update represents a major leap forward in project stability, maintainability, and distribution.

## Build System & Automation

-   **Fully Automated Releases**: A new GitHub Actions workflow automatically builds, packages, and releases the application for all target platforms when a new version tag is pushed.
-   **Dynamic Versioning**: Builds are now automatically versioned using the Git tag (e.g., `v1.3.4`), ensuring that all packaged files have the correct version number.
-   **Cross-Platform Icon Generation**: The icon generation process has been completely rewritten to be more robust, removing faulty dependencies and using platform-native tooling (`iconutil` on macOS) for reliable outcomes.
-   **Official Multi-Platform Support**: With the new stable pipeline, macOS and Linux are now officially supported platforms alongside Windows.

## Fixes & Improvements

-   **CI: Windows Build Fix**: Resolved a PowerShell compatibility issue by explicitly setting the shell to `bash` for versioning scripts.
-   **CI: Linux Build Fix**: The Linux build no longer fails due to executable name mismatches; the `executableName` is now explicitly set in the build configuration.
-   **CI: macOS Build Fix**: Added the missing `@electron-forge/maker-dmg` dependency to resolve macOS build failures.
-   **CI: Release Upload Permissions**: Corrected a permissions issue that prevented the workflow from uploading built applications to the GitHub Release.
-   **CI: Logging Cleanup**: All build scripts have been updated to produce clean, professional log output, with all emojis removed.
-   **Docs: Updated README**: The project `README.md` has been updated with improved installation instructions for all platforms and now links directly to the latest release page for easy downloads.

## Installation

1.  Visit the **[Latest Release Page](https://github.com/jgilmore-dev/JoyrideNameDisplay/releases/latest)**.
2.  Download the appropriate installer for your operating system:
    -   **Windows**: The `.exe` file.
    -   **macOS**: The `.dmg` file.
    -   **Linux**: The `.deb` (for Debian/Ubuntu) or `.rpm` (for Fedora/CentOS) file.
3.  Follow the standard installation procedure for your operating system.

---

*This update provides a solid foundation for all future development and ensures that every release is a smooth and professional experience for our users and volunteers.* 