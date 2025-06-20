const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const fs = require('fs');
const path = require('path');

// Determine icon path - use PNG as fallback if ICO doesn't exist
const iconPath = fs.existsSync('./src/assets/icons/app-icon.ico') 
  ? './src/assets/icons/app-icon.ico'
  : './src/assets/icons/app-icon-512.png';

module.exports = {
  packagerConfig: {
    asar: true,
    icon: iconPath, // Windows icon
    // macOS icon (if needed later)
    // icon: './src/assets/icons/app-icon.icns',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        iconUrl: 'https://raw.githubusercontent.com/your-repo/joyride-name-display/main/src/assets/icons/app-icon.ico',
        setupIcon: './src/assets/icons/app-icon.ico',
        certificateFile: process.env.CODE_SIGNING_CERT_PATH,
        certificatePassword: process.env.CODE_SIGNING_CERT_PASSWORD,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './src/assets/icons/app-icon-512.png',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: './src/assets/icons/app-icon-512.png',
        },
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-generic',
      config: {
        repository: {
          owner: 'your-username',
          name: 'joyride-name-display'
        }
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.js',
              name: 'renderer',
              preload: {
                js: './src/preload.js',
              },
            },
          ],
        },
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
