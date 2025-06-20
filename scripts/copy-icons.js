#!/usr/bin/env node

/**
 * Copy Icons to Build Directory
 * 
 * This script copies icon files to the webpack build directory
 * so they're available at runtime.
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../src/assets/icons');
const buildDir = path.join(__dirname, '../.webpack/main/assets/icons');

console.log('> Copying icons to build directory...');
console.log('  Source:', sourceDir);
console.log('  Destination:', buildDir);

// Create build directory if it doesn't exist
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('> Created build directory');
}

// Copy all icon files
const files = fs.readdirSync(sourceDir);
let copiedCount = 0;

files.forEach(file => {
  if (file.match(/\.(ico|png|webp|svg)$/)) {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(buildDir, file);
    
    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`> Copied: ${file}`);
      copiedCount++;
    } catch (error) {
      console.log(`> Failed to copy ${file}: ${error.message}`);
    }
  }
});

console.log('');
console.log(`> Copied ${copiedCount} icon files to build directory`);
console.log('');
console.log('> To see changes, restart the application with: npm start'); 