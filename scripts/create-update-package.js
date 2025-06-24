#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class UpdatePackageCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.packageJsonPath = path.join(this.projectRoot, 'package.json');
    this.packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    this.currentVersion = this.packageJson.version;
  }

  async createUpdatePackage() {
    console.log('Creating update package for Member Name Display...');
    console.log(`Current version: ${this.currentVersion}`);

    try {
      // Get new version from user
      const newVersion = await this.promptNewVersion();
      
      // Update package.json version
      this.updatePackageVersion(newVersion);
      
      // Build the application
      this.buildApplication();
      
      // Create installer
      this.createInstaller();
      
      // Create update metadata
      this.createUpdateMetadata(newVersion);
      
      // Create update package
      this.createUpdatePackage(newVersion);
      
      console.log('\n✅ Update package created successfully!');
      console.log(`📦 Version: ${newVersion}`);
      console.log('📁 Check the "updates" directory for the update files.');
      
    } catch (error) {
      console.error('❌ Failed to create update package:', error.message);
      process.exit(1);
    }
  }

  async promptNewVersion() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`Enter new version (current: ${this.currentVersion}): `, (answer) => {
        rl.close();
        resolve(answer.trim() || this.suggestNextVersion());
      });
    });
  }

  suggestNextVersion() {
    const parts = this.currentVersion.split('.');
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  updatePackageVersion(newVersion) {
    console.log(`📝 Updating package.json version to ${newVersion}...`);
    
    this.packageJson.version = newVersion;
    fs.writeFileSync(this.packageJsonPath, JSON.stringify(this.packageJson, null, 2) + '\n');
    
    // Update package-lock.json if it exists
    const packageLockPath = path.join(this.projectRoot, 'package-lock.json');
    if (fs.existsSync(packageLockPath)) {
      const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
      packageLock.version = newVersion;
      fs.writeFileSync(packageLockPath, JSON.stringify(packageLock, null, 2) + '\n');
    }
  }

  buildApplication() {
    console.log('🔨 Building application...');
    
    try {
      // Install dependencies if needed
      if (!fs.existsSync(path.join(this.projectRoot, 'node_modules'))) {
        console.log('📦 Installing dependencies...');
        execSync('npm install', { cwd: this.projectRoot, stdio: 'inherit' });
      }
      
      // Build the application
      console.log('🏗️ Running build process...');
      execSync('npm run make', { cwd: this.projectRoot, stdio: 'inherit' });
      
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  createInstaller() {
    console.log('📦 Creating installer...');
    
    try {
      // The installer should already be created by the build process
      // We just need to locate it
      const outDir = path.join(this.projectRoot, 'out');
      if (!fs.existsSync(outDir)) {
        throw new Error('Build output directory not found');
      }
      
      // Find the installer file
      const installerFiles = this.findInstallerFiles(outDir);
      if (installerFiles.length === 0) {
        throw new Error('No installer files found in build output');
      }
      
      console.log(`📁 Found installer files: ${installerFiles.map(f => path.basename(f)).join(', ')}`);
      
    } catch (error) {
      throw new Error(`Installer creation failed: ${error.message}`);
    }
  }

  findInstallerFiles(dir) {
    const files = [];
    
    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          files.push(...this.findInstallerFiles(itemPath));
        } else if (this.isInstallerFile(item)) {
          files.push(itemPath);
        }
      }
    }
    
    return files;
  }

  isInstallerFile(filename) {
    const installerPatterns = [
      /MemberNameDisplay.*Setup.*\.exe$/i,
      /MemberNameDisplay.*\.dmg$/i,
      /MemberNameDisplay.*\.deb$/i,
      /MemberNameDisplay.*\.rpm$/i,
      /MemberNameDisplay.*\.AppImage$/i
    ];
    
    return installerPatterns.some(pattern => pattern.test(filename));
  }

  createUpdateMetadata(newVersion) {
    console.log('📋 Creating update metadata...');
    
    const updatesDir = path.join(this.projectRoot, 'updates');
    if (!fs.existsSync(updatesDir)) {
      fs.mkdirSync(updatesDir, { recursive: true });
    }
    
    const metadata = {
      version: newVersion,
      releaseDate: new Date().toISOString(),
      releaseNotes: this.generateReleaseNotes(newVersion),
      installerFiles: this.findInstallerFiles(path.join(this.projectRoot, 'out')),
      checksums: {}
    };
    
    // Calculate checksums for installer files
    const crypto = require('crypto');
    for (const file of metadata.installerFiles) {
      const content = fs.readFileSync(file);
      metadata.checksums[path.basename(file)] = crypto.createHash('sha256').update(content).digest('hex');
    }
    
    const metadataPath = path.join(updatesDir, `update-${newVersion}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n');
    
    console.log(`📄 Update metadata saved to: ${metadataPath}`);
  }

  generateReleaseNotes(newVersion) {
    // This could be enhanced to read from CHANGELOG.md or similar
    return `Version ${newVersion} - ${new Date().toLocaleDateString()}

New Features:
• Enhanced update system with automatic checking
• Improved Pi display client management
• Better venue configuration options

Bug Fixes:
• Various stability improvements
• Enhanced error handling

For detailed release notes, visit: https://github.com/jgilmore-dev/MemberNameDisplay/releases`;
  }

  createUpdatePackage(newVersion) {
    console.log('📦 Creating update package...');
    
    const updatesDir = path.join(this.projectRoot, 'updates');
    const packageDir = path.join(updatesDir, `v${newVersion}`);
    
    if (!fs.existsSync(packageDir)) {
      fs.mkdirSync(packageDir, { recursive: true });
    }
    
    // Copy installer files to update package
    const installerFiles = this.findInstallerFiles(path.join(this.projectRoot, 'out'));
    for (const file of installerFiles) {
      const destPath = path.join(packageDir, path.basename(file));
      fs.copyFileSync(file, destPath);
      console.log(`📋 Copied: ${path.basename(file)}`);
    }
    
    // Copy metadata
    const metadataPath = path.join(updatesDir, `update-${newVersion}.json`);
    const destMetadataPath = path.join(packageDir, 'update-info.json');
    if (fs.existsSync(metadataPath)) {
      fs.copyFileSync(metadataPath, destMetadataPath);
    }
    
    console.log(`📁 Update package created in: ${packageDir}`);
  }

  createGitTag(newVersion) {
    console.log('🏷️ Creating Git tag...');
    
    try {
      execSync(`git add .`, { cwd: this.projectRoot, stdio: 'inherit' });
      execSync(`git commit -m "Release version ${newVersion}"`, { cwd: this.projectRoot, stdio: 'inherit' });
      execSync(`git tag -a v${newVersion} -m "Version ${newVersion}"`, { cwd: this.projectRoot, stdio: 'inherit' });
      console.log(`✅ Git tag v${newVersion} created successfully`);
    } catch (error) {
      console.warn(`⚠️ Git operations failed: ${error.message}`);
      console.log('You may need to manually create a Git tag and push to GitHub');
    }
  }
}

// Run the script
if (require.main === module) {
  const creator = new UpdatePackageCreator();
  creator.createUpdatePackage()
    .then(() => {
      console.log('\n🎉 Update package creation completed!');
      console.log('\nNext steps:');
      console.log('1. Test the update package');
      console.log('2. Create a GitHub release');
      console.log('3. Upload the installer files to the release');
      console.log('4. Update the release notes');
    })
    .catch((error) => {
      console.error('❌ Failed to create update package:', error);
      process.exit(1);
    });
}

module.exports = UpdatePackageCreator; 