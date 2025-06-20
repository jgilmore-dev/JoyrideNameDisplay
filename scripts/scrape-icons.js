#!/usr/bin/env node

/**
 * Icon Scraper for JoyRide Website
 * 
 * This script scrapes icons from https://joyridecars.org/
 * and downloads them for use in the Electron app.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const WEBSITE_URL = 'https://joyridecars.org/';
const ICONS_DIR = path.join(__dirname, '../src/assets/icons');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Common favicon paths to check
const FAVICON_PATHS = [
  '/favicon.ico',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/icon.png',
  '/logo.png',
  '/images/favicon.ico',
  '/images/logo.png',
  '/assets/favicon.ico',
  '/assets/logo.png',
  '/static/favicon.ico',
  '/static/logo.png'
];

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const filePath = path.join(ICONS_DIR, filename);
      const fileStream = fs.createWriteStream(filePath);
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✅ Downloaded: ${filename}`);
        resolve(filePath);
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file if there was an error
        reject(err);
      });
    }).on('error', reject);
  });
}

function scrapeWebsite() {
  return new Promise((resolve, reject) => {
    const protocol = WEBSITE_URL.startsWith('https:') ? https : http;
    
    protocol.get(WEBSITE_URL, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}

function extractIconLinks(html) {
  const iconLinks = [];
  
  // Look for favicon links in HTML
  const faviconRegex = /<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]+href=["']([^"']+)["']/gi;
  let match;
  
  while ((match = faviconRegex.exec(html)) !== null) {
    const href = match[1];
    if (href && !href.startsWith('data:')) {
      iconLinks.push(href);
    }
  }
  
  // Look for logo images
  const logoRegex = /<img[^>]+src=["']([^"']*logo[^"']*)["']/gi;
  while ((match = logoRegex.exec(html)) !== null) {
    const src = match[1];
    if (src && !src.startsWith('data:')) {
      iconLinks.push(src);
    }
  }
  
  return iconLinks;
}

function resolveUrl(baseUrl, relativeUrl) {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch (error) {
    return null;
  }
}

async function main() {
  console.log('🎨 Scraping icons from JoyRide website...');
  console.log(`📍 Website: ${WEBSITE_URL}`);
  console.log('');
  
  try {
    // Scrape the website HTML
    console.log('📄 Scraping website HTML...');
    const html = await scrapeWebsite();
    
    // Extract icon links from HTML
    console.log('🔍 Extracting icon links...');
    const iconLinks = extractIconLinks(html);
    
    console.log(`Found ${iconLinks.length} icon links in HTML:`);
    iconLinks.forEach(link => console.log(`  - ${link}`));
    
    // Try to download found icons
    const downloadPromises = [];
    
    for (let i = 0; i < iconLinks.length; i++) {
      const link = iconLinks[i];
      const resolvedUrl = resolveUrl(WEBSITE_URL, link);
      
      if (resolvedUrl) {
        const extension = path.extname(link) || '.png';
        const filename = `scraped-icon-${i + 1}${extension}`;
        
        downloadPromises.push(
          downloadFile(resolvedUrl, filename)
            .catch(err => console.log(`❌ Failed to download ${link}: ${err.message}`))
        );
      }
    }
    
    // Also try common favicon paths
    console.log('');
    console.log('🔍 Trying common favicon paths...');
    
    for (const faviconPath of FAVICON_PATHS) {
      const faviconUrl = resolveUrl(WEBSITE_URL, faviconPath);
      if (faviconUrl) {
        const filename = `favicon-${faviconPath.replace(/[\/\\]/g, '-')}`;
        
        downloadPromises.push(
          downloadFile(faviconUrl, filename)
            .catch(err => console.log(`❌ Failed to download ${faviconPath}: ${err.message}`))
        );
      }
    }
    
    // Wait for all downloads to complete
    await Promise.all(downloadPromises);
    
    console.log('');
    console.log('🎉 Icon scraping complete!');
    console.log('');
    console.log('📁 Downloaded files are in: src/assets/icons/');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Check the downloaded files in src/assets/icons/');
    console.log('2. Rename the best ones to:');
    console.log('   - app-icon.ico (for Windows)');
    console.log('   - favicon.ico (for browser)');
    console.log('   - app-icon-512.png (for packaging)');
    console.log('3. Convert formats if needed using: npm run icons');
    console.log('');
    console.log('💡 Tip: You may need to convert PNG files to ICO format');
    console.log('   for the best Windows integration.');
    
  } catch (error) {
    console.error('❌ Error scraping website:', error.message);
    console.log('');
    console.log('🔧 Fallback: Use the placeholder icon or ask your designer');
    console.log('   for the official JoyRide branding assets.');
  }
}

// Run the scraper
main(); 