#!/usr/bin/env node

const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ICONS_DIR = path.join(__dirname, '../src/assets/icons');
const TMP_DIR = path.join(ICONS_DIR, 'tmp');

// Ensure directories exist
if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const appPng = path.join(ICONS_DIR, 'app-icon-512.png');
const faviconWebp = path.join(ICONS_DIR, 'joyride-favicon-192.webp');

const appPngSizes = [16, 32, 48, 64, 128, 256, 512];
const faviconSizes = [16, 32, 48, 64, 128, 192];

async function convertWebpToPng(webpPath, outPath, size) {
  await sharp(webpPath).resize(size, size).png().toFile(outPath);
  console.log(`✅ Converted ${webpPath} to ${outPath}`);
}

async function generatePngVariants(src, sizes, prefix) {
  const outPngs = [];
  for (const size of sizes) {
    const outPath = path.join(TMP_DIR, `${prefix}-${size}.png`);
    await sharp(src).resize(size, size).png().toFile(outPath);
    outPngs.push(outPath);
    console.log(`✅ Resized ${src} to ${size}x${size}`);
  }
  return outPngs;
}

async function generateIco(pngs, outPath) {
  const buf = await pngToIco(pngs);
  fs.writeFileSync(outPath, buf);
  console.log(`✅ Created ICO: ${outPath}`);
}

async function generateIcns(pngs, outPath) {
  const platform = os.platform();
  
  if (platform === 'darwin') {
    // On Mac, try to use png2icns if available
    try {
      const png2icns = require('png2icns');
      const largestPng = pngs[pngs.length - 1]; // Use the largest PNG (512x512)
      
      await new Promise((resolve, reject) => {
        png2icns({
          in: largestPng,
          out: outPath,
          sizes: [16, 32, 64, 128, 256, 512]
        }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      console.log(`✅ Created ICNS: ${outPath}`);
    } catch (error) {
      console.warn(`⚠️  ICNS generation failed: ${error.message}`);
      console.log('   Creating ICNS manually...');
      await createIcnsManually(pngs, outPath);
    }
  } else {
    console.log('📋 ICNS generation skipped (Mac-only format)');
    console.log('   To create ICNS on Mac:');
    console.log('   1. Copy the generated PNG files to a Mac');
    console.log('   2. Use iconutil or a tool like Icon Composer');
    console.log('   3. Or run this script on a Mac system');
  }
}

async function createIcnsManually(pngs, outPath) {
  // Create a temporary iconset directory
  const iconsetDir = path.join(TMP_DIR, 'app.iconset');
  if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir, { recursive: true });
  
  // Copy PNG files with proper naming for iconutil
  const sizeMap = {
    16: 'icon_16x16.png',
    32: 'icon_16x16@2x.png',
    32: 'icon_32x32.png',
    64: 'icon_32x32@2x.png',
    128: 'icon_128x128.png',
    256: 'icon_128x128@2x.png',
    256: 'icon_256x256.png',
    512: 'icon_256x256@2x.png',
    512: 'icon_512x512.png'
  };
  
  for (const png of pngs) {
    const size = parseInt(path.basename(png).split('-')[1]);
    const targetName = sizeMap[size];
    if (targetName) {
      fs.copyFileSync(png, path.join(iconsetDir, targetName));
    }
  }
  
  console.log(`📁 Created iconset at: ${iconsetDir}`);
  console.log(`   Run on Mac: iconutil --convert icns --output "${outPath}" "${iconsetDir}"`);
}

async function main() {
  console.log('🎨 Generating cross-platform icons...');
  console.log(`🖥️  Platform: ${os.platform()}`);

  // 1. Convert favicon WebP to PNG (always to a unique temp file)
  const faviconPngTemp = path.join(TMP_DIR, `favicon-192-${Date.now()}.png`);
  await convertWebpToPng(faviconWebp, faviconPngTemp, 192);

  // 2. Generate PNG variants for app icon and favicon
  const appPngs = await generatePngVariants(appPng, appPngSizes, 'app');
  const faviconPngs = await generatePngVariants(faviconPngTemp, faviconSizes, 'favicon');

  // 3. Generate ICO (Windows)
  await generateIco(appPngs, path.join(ICONS_DIR, 'app-icon.ico'));
  await generateIco(faviconPngs, path.join(ICONS_DIR, 'favicon.ico'));

  // 4. Generate ICNS (Mac) - platform dependent
  await generateIcns(appPngs, path.join(ICONS_DIR, 'app-icon.icns'));

  // 5. Copy PNGs for Linux (largest size)
  fs.copyFileSync(appPng, path.join(ICONS_DIR, 'app-icon.png'));
  fs.copyFileSync(faviconPngTemp, path.join(ICONS_DIR, 'favicon.png'));
  console.log('✅ Copied PNGs for Linux');

  // 6. Clean up temp files (but keep iconset if created)
  const iconsetDir = path.join(TMP_DIR, 'app.iconset');
  if (fs.existsSync(iconsetDir)) {
    console.log(`📁 Iconset preserved at: ${iconsetDir}`);
    console.log('   Use this for manual ICNS creation on Mac');
  }
  
  // Remove other temp files
  const tempFiles = fs.readdirSync(TMP_DIR).filter(f => !f.includes('app.iconset'));
  for (const file of tempFiles) {
    fs.unlinkSync(path.join(TMP_DIR, file));
  }
  console.log('🧹 Cleaned up temp files');

  console.log('\n🎉 Icon generation complete!');
  console.log('📁 Generated files:');
  console.log('  - app-icon.ico (Windows)');
  console.log('  - app-icon.png (Linux)');
  console.log('  - favicon.ico (browser)');
  console.log('  - favicon.png (browser/Linux)');
  
  if (os.platform() !== 'darwin') {
    console.log('\n🍎 For Mac builds:');
    console.log('   - ICNS files need to be created on a Mac system');
    console.log('   - Use the iconset directory or run this script on Mac');
  }
}

main().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
}); 