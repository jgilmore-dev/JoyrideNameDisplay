const fs = require('fs');
const path = require('path');
const { networkInterfaces } = require('os');

class VenueConfig {
  constructor() {
    this.configPath = path.join(process.cwd(), 'venue-config.json');
    this.venues = this.loadVenues();
    this.currentVenue = null;
  }

  // Load venue configurations
  loadVenues() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[VenueConfig] Error loading venue config:', error);
    }
    
    // Return default configuration
    return {
      venues: [],
      defaultVenue: null,
      autoDiscovery: true
    };
  }

  // Save venue configurations
  saveVenues() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.venues, null, 2));
      console.log('[VenueConfig] Venue configuration saved');
      return true;
    } catch (error) {
      console.error('[VenueConfig] Error saving venue config:', error);
      return false;
    }
  }

  // Add a new venue
  addVenue(venueData) {
    const venue = {
      id: this.generateVenueId(),
      name: venueData.name,
      location: venueData.location,
      eventType: venueData.eventType,
      networkConfig: {
        autoDiscovery: true,
        fallbackIP: venueData.fallbackIP || null,
        port: venueData.port || 3000,
        subnet: venueData.subnet || this.detectSubnet()
      },
      displayConfig: {
        fontColor: venueData.fontColor || '#ffffff',
        fontSize: venueData.fontSize || '4vw',
        autoScale: venueData.autoScale !== false
      },
      createdAt: new Date().toISOString(),
      lastUsed: null
    };

    this.venues.venues.push(venue);
    this.saveVenues();
    
    console.log(`[VenueConfig] Added venue: ${venue.name}`);
    return venue;
  }

  // Update venue configuration
  updateVenue(venueId, updates) {
    const venue = this.venues.venues.find(v => v.id === venueId);
    if (!venue) {
      console.error(`[VenueConfig] Venue not found: ${venueId}`);
      return false;
    }

    Object.assign(venue, updates);
    venue.lastModified = new Date().toISOString();
    this.saveVenues();
    
    console.log(`[VenueConfig] Updated venue: ${venue.name}`);
    return true;
  }

  // Remove venue
  removeVenue(venueId) {
    const index = this.venues.venues.findIndex(v => v.id === venueId);
    if (index === -1) {
      console.error(`[VenueConfig] Venue not found: ${venueId}`);
      return false;
    }

    const venue = this.venues.venues.splice(index, 1)[0];
    this.saveVenues();
    
    console.log(`[VenueConfig] Removed venue: ${venue.name}`);
    return true;
  }

  // Get all venues
  getVenues() {
    return this.venues.venues;
  }

  // Get venue by ID
  getVenue(venueId) {
    return this.venues.venues.find(v => v.id === venueId);
  }

  // Set current venue
  setCurrentVenue(venueId) {
    const venue = this.getVenue(venueId);
    if (!venue) {
      console.error(`[VenueConfig] Venue not found: ${venueId}`);
      return false;
    }

    this.currentVenue = venue;
    venue.lastUsed = new Date().toISOString();
    this.venues.defaultVenue = venueId;
    this.saveVenues();
    
    console.log(`[VenueConfig] Set current venue: ${venue.name}`);
    return true;
  }

  // Get current venue
  getCurrentVenue() {
    if (this.currentVenue) {
      return this.currentVenue;
    }
    
    if (this.venues.defaultVenue) {
      return this.getVenue(this.venues.defaultVenue);
    }
    
    return null;
  }

  // Auto-detect venue based on network
  autoDetectVenue() {
    const networkInfo = this.getNetworkInfo();
    
    // Try to match based on network characteristics
    for (const venue of this.venues.venues) {
      if (venue.networkConfig.subnet === networkInfo.subnet) {
        console.log(`[VenueConfig] Auto-detected venue: ${venue.name}`);
        this.setCurrentVenue(venue.id);
        return venue;
      }
    }
    
    // Create a new venue if none found
    const newVenue = this.addVenue({
      name: `Venue ${new Date().toLocaleDateString()}`,
      location: networkInfo.location || 'Auto-Detected',
      eventType: 'Auto-Detected',
      fallbackIP: networkInfo.gateway
    });
    
    this.setCurrentVenue(newVenue.id);
    return newVenue;
  }

  // Get network information
  getNetworkInfo() {
    const interfaces = networkInterfaces();
    const networkInfo = {
      subnet: null,
      gateway: null,
      location: 'Unknown'
    };

    // Find the primary network interface
    for (const [name, ifaces] of Object.entries(interfaces)) {
      for (const iface of ifaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          const ipParts = iface.address.split('.');
          networkInfo.subnet = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/24`;
          networkInfo.gateway = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.1`;
          
          // Try to determine location based on network
          if (ipParts[0] === '192' && ipParts[1] === '168') {
            networkInfo.location = 'Local Network';
          } else if (ipParts[0] === '10') {
            networkInfo.location = 'Corporate Network';
          }
          
          return networkInfo;
        }
      }
    }

    return networkInfo;
  }

  // Generate unique venue ID
  generateVenueId() {
    return 'venue-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Export venue configuration for Pi displays
  exportForPi(venueId) {
    const venue = this.getVenue(venueId);
    if (!venue) {
      return null;
    }

    return {
      controlPanel: {
        autoDiscovery: venue.networkConfig.autoDiscovery,
        fallbackIP: venue.networkConfig.fallbackIP,
        port: venue.networkConfig.port,
        autoReconnect: true,
        reconnectInterval: 5000,
        discoveryMethods: ['hostname', 'network-scan', 'mdns']
      },
      display: {
        fontFamily: 'GothamRnd, Arial, sans-serif',
        defaultFontSize: venue.displayConfig.fontSize,
        defaultColor: venue.displayConfig.fontColor,
        autoScale: venue.displayConfig.autoScale
      },
      network: {
        discoveryEnabled: true,
        heartbeatInterval: 30000,
        scanTimeout: 5000
      },
      venue: {
        name: venue.name,
        location: venue.location,
        eventType: venue.eventType
      }
    };
  }

  // Import venue from Pi configuration
  importFromPi(configData) {
    const venueData = {
      name: configData.venue?.name || 'Imported Venue',
      location: configData.venue?.location || 'Unknown',
      eventType: configData.venue?.eventType || 'Unknown',
      fallbackIP: configData.controlPanel?.fallbackIP,
      port: configData.controlPanel?.port || 3000,
      fontColor: configData.display?.defaultColor || '#ffffff',
      fontSize: configData.display?.defaultFontSize || '4vw',
      autoScale: configData.display?.autoScale !== false
    };

    return this.addVenue(venueData);
  }

  // Get venue statistics
  getVenueStats() {
    const stats = {
      totalVenues: this.venues.venues.length,
      recentlyUsed: [],
      mostUsed: [],
      networkTypes: {}
    };

    // Get recently used venues (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    stats.recentlyUsed = this.venues.venues
      .filter(v => v.lastUsed && new Date(v.lastUsed) > thirtyDaysAgo)
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .slice(0, 5);

    // Count network types
    this.venues.venues.forEach(venue => {
      const networkType = venue.networkConfig.subnet?.split('.')[0] || 'unknown';
      stats.networkTypes[networkType] = (stats.networkTypes[networkType] || 0) + 1;
    });

    return stats;
  }

  // Backup venue configuration
  backup() {
    const backupPath = this.configPath.replace('.json', `.backup.${Date.now()}.json`);
    try {
      fs.copyFileSync(this.configPath, backupPath);
      console.log(`[VenueConfig] Backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('[VenueConfig] Backup failed:', error);
      return null;
    }
  }

  // Restore venue configuration
  restore(backupPath) {
    try {
      const backupData = fs.readFileSync(backupPath, 'utf8');
      const backup = JSON.parse(backupData);
      
      this.venues = backup;
      this.saveVenues();
      
      console.log(`[VenueConfig] Restored from backup: ${backupPath}`);
      return true;
    } catch (error) {
      console.error('[VenueConfig] Restore failed:', error);
      return false;
    }
  }
}

module.exports = VenueConfig; 