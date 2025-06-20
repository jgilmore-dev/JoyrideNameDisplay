#!/usr/bin/env node

const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ICONS_DIR = path.join(__dirname, '../src/assets/icons');
const TMP_DIR = path.join(ICONS_DIR, 'tmp');
const SRC_APP_ICON = path.join(ICONS_DIR, 'app-icon-512.png');
const SRC_FAVICON = path.join(ICONS_DIR, 'joyride-favicon-192.webp');

const APP_ICON_SIZES = [16, 32, 48, 64, 128, 256, 512];
const FAVICON_SIZES = [16, 32, 48, 64, 128, 192];

function setup() {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

async function generatePngVariants(src, sizes, prefix) {
  const outPngs = [];
  for (const size of sizes) {
    const outPath = path.join(TMP_DIR, `${prefix}-${size}.png`);
    await sharp(src).resize(size, size).png().toFile(outPath);
    outPngs.push(outPath);
    console.log(`> Resized ${src} to ${size}x${size}`);
  }
  return outPngs;
}

async function generateIco(pngs, outPath) {
  try {
    const buf = await pngToIco(pngs);
    fs.writeFileSync(outPath, buf);
    console.log(`> Created ICO: ${outPath}`);
  } catch (error) {
    console.error(`> Failed to create ICO: ${outPath}`, error);
    throw error;
  }
}

async function generateIcns(pngs, outPath) {
  if (os.platform() !== 'darwin') {
    console.log('> Skipping ICNS generation on non-Mac platform.');
    return;
  }

  console.log('> Generating ICNS for macOS...');
  const iconsetDir = path.join(TMP_DIR, 'app.iconset');
  if (fs.existsSync(iconsetDir)) {
    fs.rmSync(iconsetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(iconsetDir, { recursive: true });

  const sizeMap = {
    16: ['icon_16x16.png'],
    32: ['icon_16x16@2x.png', 'icon_32x32.png'],
    64: ['icon_32x32@2x.png'],
    128: ['icon_128x128.png'],
    256: ['icon_128x128@2x.png', 'icon_256x256.png'],
    512: ['icon_256x256@2x.png', 'icon_512x512.png'],
  };

  for (const png of pngs) {
    const sizeMatch = path.basename(png).match(/-(\d+)\.png$/);
    if (!sizeMatch) continue;
    const size = parseInt(sizeMatch[1], 10);
    if (sizeMap[size]) {
      for (const targetName of sizeMap[size]) {
        fs.copyFileSync(png, path.join(iconsetDir, targetName));
      }
    }
  }

  console.log(`> Created iconset at: ${iconsetDir}`);

  try {
    execSync(`iconutil --convert icns --output "${outPath}" "${iconsetDir}"`);
    console.log(`> Created ICNS: ${outPath}`);
  } catch (error) {
    console.error('> Error using iconutil:', error.message);
    console.error('  Stderr:', error.stderr ? error.stderr.toString() : 'N/A');
    console.error('  Stdout:', error.stdout ? error.stdout.toString() : 'N/A');
    console.log('   Please ensure Xcode Command Line Tools are installed on your Mac.');
    throw error;
  }
}

async function main() {
  console.log('Starting cross-platform icon generation...');
  console.log(`Platform: ${os.platform()}`);
  
  setup();

  const appPngs = await generatePngVariants(SRC_APP_ICON, APP_ICON_SIZES, 'app');
  const faviconPngs = await generatePngVariants(SRC_FAVICON, FAVICON_SIZES, 'favicon');

  await generateIco(appPngs, path.join(ICONS_DIR, 'app-icon.ico'));
  await generateIco(faviconPngs, path.join(ICONS_DIR, 'favicon.ico'));

  await generateIcns(appPngs, path.join(ICONS_DIR, 'app-icon.icns'));

  // Copy largest PNGs for Linux/general use
  const largestFavicon = faviconPngs[faviconPngs.length - 1];
  fs.copyFileSync(SRC_APP_ICON, path.join(ICONS_DIR, 'app-icon.png'));
  fs.copyFileSync(largestFavicon, path.join(ICONS_DIR, 'favicon.png'));
  console.log('> Copied PNGs for Linux/general use');
  
  // No need to clean TMP_DIR, it's removed at the start of the script.

  console.log('Icon generation complete!');
}

main().catch(err => {
  console.error('An error occurred during icon generation:');
  console.error(err);
  process.exit(1);
}); 