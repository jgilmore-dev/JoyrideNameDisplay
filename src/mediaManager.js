const { app, dialog } = require('electron');
const path = require('node:path');
const fs = require('fs');
const configManager = require('./config/configManager');

// A persistent directory to store slideshow images
const mediaDir = path.join(app.getPath('userData'), configManager.getPaths().mediaDir);
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

let imageFiles = [];

/**
 * Loads the initial list of images from the media directory.
 */
function loadInitialImages() {
  imageFiles = fs.readdirSync(mediaDir).map(file => path.join(mediaDir, file));
}

/**
 * Returns the current list of slideshow image paths as media:// URLs.
 * @returns {Array}
 */
function getSlideshowImages() {
  // Return only the filename, prefixed with the custom protocol
  return imageFiles.map(file => `media://${path.basename(file)}`);
}

/**
 * Opens a dialog to import new slideshow images, copies them to the media directory,
 * and updates the internal list.
 * @param {BrowserWindow} mainWindow The main application window.
 * @returns {Promise<Array>} A promise that resolves with the array of newly added image paths.
 */
async function importSlideshowImages(mainWindow) {
  try {
    const slideshowConfig = configManager.getSlideshowConfig();
    const errors = configManager.getErrors();
    
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Slideshow Images',
      buttonLabel: 'Import',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: slideshowConfig.supportedFormats }],
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      console.log('Image import cancelled by user.');
      return []; // Return empty array on cancellation
    }

    const newImagePaths = [];
    filePaths.forEach(sourcePath => {
      const fileName = path.basename(sourcePath);
      const destPath = path.join(mediaDir, fileName);
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
        newImagePaths.push(destPath);
      }
    });

    if (newImagePaths.length > 0) {
      loadInitialImages(); // Refresh the full list only if new images were added
    }
    
    return newImagePaths; // Return only the paths of newly added images
  } catch (error) {
    console.error(configManager.getErrors().imageImportError, error);
    return []; // Return empty array on error
  }
}

/**
 * Deletes all files from the media directory.
 */
function clearSlideshowCache() {
  try {
    const files = fs.readdirSync(mediaDir);
    for (const file of files) {
      fs.unlinkSync(path.join(mediaDir, file));
    }
    console.log('All slideshow images have been deleted.');
    loadInitialImages(); // This will now result in an empty imageFiles array
  } catch (error) {
    console.error('Failed to clear slideshow cache:', error);
  }
}

/**
 * Returns the number of images in the slideshow.
 * @returns {number}
 */
function getSlideshowImageCount() {
  return imageFiles.length;
}

module.exports = {
  loadInitialImages,
  getSlideshowImages,
  importSlideshowImages,
  clearSlideshowCache,
  getSlideshowImageCount,
}; 