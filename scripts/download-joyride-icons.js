#!/usr/bin/env node

/**
 * Download JoyRide Icons
 * 
 * Downloads specific icons from the JoyRide website
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../src/assets/icons');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Specific JoyRide icons we found
const ICONS_TO_DOWNLOAD = [
  {
    url: 'https://joyridecars.org/wp-content/uploads/2022/02/JoyRide-Metal-Logo-Large-1-1-287x300.png',
    filename: 'joyride-logo.png',
    description: 'JoyRide Metal Logo (287x300)'
  },
  {
    url: 'https://joyridecars.org/wp-content/uploads/2022/03/cropped-favicon-32x32.webp',
    filename: 'joyride-favicon-32.webp',
    description: 'JoyRide Favicon (32x32)'
  },
  {
    url: 'https://joyridecars.org/wp-content/uploads/2022/03/cropped-favicon-192x192.webp',
    filename: 'joyride-favicon-192.webp',
    description: 'JoyRide Favicon (192x192)'
  },
  {
    url: 'https://joyridecars.org/wp-content/uploads/2022/03/cropped-favicon-180x180.webp',
    filename: 'joyride-favicon-180.webp',
    description: 'JoyRide Favicon (180x180)'
  }
];

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading: ${filename}`);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const filePath = path.join(ICONS_DIR, filename);
      const fileStream = fs.createWriteStream(filePath);
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        const stats = fs.statSync(filePath);
        console.log(`✅ Downloaded: ${filename} (${stats.size} bytes)`);
        resolve(filePath);
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file if there was an error
        reject(err);
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🎨 Downloading JoyRide Icons');
  console.log('============================');
  console.log('');
  
  for (const icon of ICONS_TO_DOWNLOAD) {
    try {
      await downloadFile(icon.url, icon.filename);
      console.log(`   ${icon.description}`);
    } catch (error) {
      console.log(`❌ Failed to download ${icon.filename}: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🎉 Download complete!');
  console.log('');
  console.log('📁 Files downloaded to: src/assets/icons/');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Check the downloaded files');
  console.log('2. Convert WebP files to PNG/ICO if needed');
  console.log('3. Rename the best ones to:');
  console.log('   - app-icon.ico (for Windows)');
  console.log('   - favicon.ico (for browser)');
  console.log('   - app-icon-512.png (for packaging)');
  console.log('');
  console.log('💡 The JoyRide logo looks perfect for the app icon!');
}

main(); 