#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ReleaseAssetVerifier {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.outDir = path.join(this.projectRoot, 'out');
    this.packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
    this.currentVersion = this.packageJson.version;
  }

  verifyReleaseAssets() {
    console.log('🔍 Verifying release assets for update system compatibility...');
    console.log(`📦 Current version: ${this.currentVersion}`);

    if (!fs.existsSync(this.outDir)) {
      console.error('❌ Build output directory not found. Run "npm run make" first.');
      process.exit(1);
    }

    const issues = [];
    const assets = this.findAllAssets();
    const piAssets = this.findPiAssets();
    
    console.log(`\n📁 Found ${assets.length} build assets:`);
    
    // Check each asset
    for (const asset of assets) {
      const result = this.verifyAsset(asset);
      if (result.issues.length > 0) {
        issues.push(...result.issues);
      }
      console.log(`  ${result.status} ${path.basename(asset)}`);
    }

    // Check Pi assets
    if (piAssets.length > 0) {
      console.log(`\n🍓 Found ${piAssets.length} Pi client assets:`);
      for (const asset of piAssets) {
        const result = this.verifyPiAsset(asset);
        if (result.issues.length > 0) {
          issues.push(...result.issues);
        }
        console.log(`  ${result.status} ${path.basename(asset)}`);
      }
    } else {
      console.log('\n🍓 No Pi client assets found');
    }

    // Summary
    console.log('\n📋 Summary:');
    if (issues.length === 0) {
      console.log('✅ All assets are compatible with the update system!');
    } else {
      console.log(`⚠️  Found ${issues.length} potential issues:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

    // Platform coverage
    this.checkPlatformCoverage(assets);

    return issues.length === 0;
  }

  findAllAssets() {
    const assets = [];
    
    if (fs.existsSync(this.outDir)) {
      this.scanDirectory(this.outDir, assets);
    }
    
    return assets;
  }

  scanDirectory(dir, assets) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        this.scanDirectory(itemPath, assets);
      } else if (this.isInstallerFile(item)) {
        assets.push(itemPath);
      }
    }
  }

  isInstallerFile(filename) {
    const nameLower = filename.toLowerCase();
    
    // Check for installer extensions
    const installerExtensions = ['.exe', '.dmg', '.deb', '.rpm', '.appimage', '.zip'];
    const hasInstallerExt = installerExtensions.some(ext => filename.endsWith(ext));
    
    if (!hasInstallerExt) {
      return false;
    }
    
    // Check for required naming patterns
    const hasMember = nameLower.includes('member') || nameLower.includes('membername');
    const hasSetup = nameLower.includes('setup') || nameLower.includes('install');
    
    return hasMember || hasSetup;
  }

  verifyAsset(assetPath) {
    const filename = path.basename(assetPath);
    const issues = [];
    let status = '✅';

    // Check naming conventions
    if (!this.checkNamingConvention(filename)) {
      issues.push(`Naming convention: Should include "MemberNameDisplay" and version`);
      status = '⚠️';
    }

    // Check version consistency
    if (!this.checkVersionConsistency(filename)) {
      issues.push(`Version mismatch: File version doesn't match package.json version`);
      status = '❌';
    }

    // Check file size
    const stats = fs.statSync(assetPath);
    const sizeMB = stats.size / (1024 * 1024);
    if (sizeMB < 1) {
      issues.push(`File size: ${sizeMB.toFixed(1)}MB seems too small for an installer`);
      status = '⚠️';
    }

    return { status, issues };
  }

  checkNamingConvention(filename) {
    const nameLower = filename.toLowerCase();
    
    // Should contain "member" or "membername"
    const hasMember = nameLower.includes('member') || nameLower.includes('membername');
    
    // Should contain version number
    const hasVersion = /\d+\.\d+\.\d+/.test(filename);
    
    return hasMember && hasVersion;
  }

  checkVersionConsistency(filename) {
    // Extract version from filename
    const versionMatch = filename.match(/(\d+\.\d+\.\d+)/);
    if (!versionMatch) {
      return false;
    }
    
    const fileVersion = versionMatch[1];
    return fileVersion === this.currentVersion;
  }

  checkPlatformCoverage(assets) {
    const platforms = {
      windows: assets.filter(asset => asset.toLowerCase().includes('.exe')),
      macos: assets.filter(asset => asset.toLowerCase().includes('.dmg') || asset.toLowerCase().includes('.zip')),
      linux: assets.filter(asset => 
        asset.toLowerCase().includes('.deb') || 
        asset.toLowerCase().includes('.rpm') || 
        asset.toLowerCase().includes('.appimage')
      )
    };

    console.log('\n🖥️  Platform Coverage:');
    console.log(`  Windows: ${platforms.windows.length} assets`);
    console.log(`  macOS: ${platforms.macos.length} assets`);
    console.log(`  Linux: ${platforms.linux.length} assets`);

    const missingPlatforms = [];
    if (platforms.windows.length === 0) missingPlatforms.push('Windows');
    if (platforms.macos.length === 0) missingPlatforms.push('macOS');
    if (platforms.linux.length === 0) missingPlatforms.push('Linux');

    if (missingPlatforms.length > 0) {
      console.log(`⚠️  Missing platforms: ${missingPlatforms.join(', ')}`);
    } else {
      console.log('✅ All platforms covered');
    }
  }

  generateUpdateMetadata() {
    const assets = this.findAllAssets();
    const piAssets = this.findPiAssets();
    
    const metadata = {
      version: this.currentVersion,
      releaseDate: new Date().toISOString(),
      installerFiles: assets.map(asset => path.basename(asset)),
      platforms: {
        windows: assets.filter(asset => asset.toLowerCase().includes('.exe')).map(asset => path.basename(asset)),
        macos: assets.filter(asset => asset.toLowerCase().includes('.dmg') || asset.toLowerCase().includes('.zip')).map(asset => path.basename(asset)),
        linux: assets.filter(asset => 
          asset.toLowerCase().includes('.deb') || 
          asset.toLowerCase().includes('.rpm') || 
          asset.toLowerCase().includes('.appimage')
        ).map(asset => path.basename(asset))
      },
      piClient: {
        files: piAssets.map(asset => path.basename(asset)),
        updateUrl: `https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v${this.currentVersion}/pi-display-client.html`,
        setupUrl: `https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v${this.currentVersion}/pi-boot-setup.sh`,
        packageUrl: `https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v${this.currentVersion}/pi-client-${this.currentVersion}.tar.gz`
      }
    };

    const metadataPath = path.join(this.projectRoot, 'update-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`📄 Update metadata written to: ${metadataPath}`);
    return metadata;
  }

  findPiAssets() {
    const piAssets = [];
    const piFiles = [
      'src/pi-display-client.html',
      'scripts/pi-boot-setup.sh',
      'scripts/update-client.sh'
    ];
    
    for (const file of piFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        piAssets.push(filePath);
      }
    }
    
    return piAssets;
  }

  verifyPiAsset(assetPath) {
    const filename = path.basename(assetPath);
    const issues = [];
    let status = '✅';

    // Check file size
    const stats = fs.statSync(assetPath);
    const sizeKB = stats.size / 1024;
    
    if (sizeKB < 1) {
      issues.push(`File size: ${sizeKB.toFixed(1)}KB seems too small`);
      status = '⚠️';
    }

    // Check for required content based on file type
    const content = fs.readFileSync(assetPath, 'utf8');
    
    if (filename === 'pi-display-client.html') {
      if (!content.includes('Member Name Display')) {
        issues.push(`Missing application title in HTML`);
        status = '⚠️';
      }
      if (!content.includes('socket.io')) {
        issues.push(`Missing Socket.IO integration`);
        status = '⚠️';
      }
    } else if (filename === 'pi-boot-setup.sh') {
      if (!content.includes('#!/bin/bash')) {
        issues.push(`Missing shebang in shell script`);
        status = '⚠️';
      }
      if (!content.includes('member-name-display')) {
        issues.push(`Missing application directory reference`);
        status = '⚠️';
      }
    } else if (filename === 'update-client.sh') {
      if (!content.includes('#!/bin/bash')) {
        issues.push(`Missing shebang in shell script`);
        status = '⚠️';
      }
      if (!content.includes('github.com')) {
        issues.push(`Missing GitHub repository reference`);
        status = '⚠️';
      }
    }

    return { status, issues };
  }
}

// Run the script
if (require.main === module) {
  const verifier = new ReleaseAssetVerifier();
  
  const success = verifier.verifyReleaseAssets();
  
  if (process.argv.includes('--generate-metadata')) {
    verifier.generateUpdateMetadata();
  }
  
  if (!success) {
    console.log('\n💡 Tips for fixing issues:');
    console.log('1. Ensure package.json version is correct');
    console.log('2. Run "npm run make" to rebuild all platforms');
    console.log('3. Check that forge.config.js is properly configured');
    console.log('4. Verify icon files exist in src/assets/icons/');
    
    process.exit(1);
  }
}

module.exports = ReleaseAssetVerifier; 