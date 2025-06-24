const dgram = require('dgram');
const { networkInterfaces } = require('os');

class NetworkDiscovery {
  constructor() {
    this.discoveredDevices = new Map();
    this.isScanning = false;
    this.scanInterval = null;
    this.broadcastSocket = null;
    this.listenSocket = null;
    this.port = 3001; // Discovery port (different from main server port)
  }

  // Start network discovery service
  start() {
    try {
      console.log('[NetworkDiscovery] Starting network discovery service...');
      
      // Create broadcast socket for sending discovery messages
      this.broadcastSocket = dgram.createSocket('udp4');
      this.broadcastSocket.bind();
      this.broadcastSocket.setBroadcast(true);
      
      // Create listen socket for receiving responses
      this.listenSocket = dgram.createSocket('udp4');
      this.listenSocket.bind(this.port);
      
      this.setupSocketHandlers();
      this.startPeriodicScan();
      
      console.log('[NetworkDiscovery] Network discovery service started');
      return true;
    } catch (error) {
      console.error('[NetworkDiscovery] Failed to start discovery service:', error);
      return false;
    }
  }

  // Stop network discovery service
  stop() {
    try {
      console.log('[NetworkDiscovery] Stopping network discovery service...');
      
      if (this.scanInterval) {
        clearInterval(this.scanInterval);
        this.scanInterval = null;
      }
      
      if (this.broadcastSocket) {
        this.broadcastSocket.close();
        this.broadcastSocket = null;
      }
      
      if (this.listenSocket) {
        this.listenSocket.close();
        this.listenSocket = null;
      }
      
      this.discoveredDevices.clear();
      this.isScanning = false;
      
      console.log('[NetworkDiscovery] Network discovery service stopped');
    } catch (error) {
      console.error('[NetworkDiscovery] Error stopping discovery service:', error);
    }
  }

  // Setup socket event handlers
  setupSocketHandlers() {
    // Handle incoming discovery responses
    this.listenSocket.on('message', (message, remote) => {
      try {
        const data = JSON.parse(message.toString());
        this.handleDiscoveryResponse(data, remote);
      } catch (error) {
        console.error('[NetworkDiscovery] Error parsing discovery response:', error);
      }
    });

    // Handle socket errors
    this.broadcastSocket.on('error', (error) => {
      console.error('[NetworkDiscovery] Broadcast socket error:', error);
    });

    this.listenSocket.on('error', (error) => {
      console.error('[NetworkDiscovery] Listen socket error:', error);
    });
  }

  // Start periodic network scanning
  startPeriodicScan() {
    // Initial scan
    this.scanNetwork();
    
    // Periodic scan every 30 seconds
    this.scanInterval = setInterval(() => {
      this.scanNetwork();
    }, 30000);
  }

  // Scan network for Pi displays
  scanNetwork() {
    if (this.isScanning) {
      console.log('[NetworkDiscovery] Scan already in progress, skipping...');
      return;
    }

    this.isScanning = true;
    console.log('[NetworkDiscovery] Starting network scan...');

    try {
      const discoveryMessage = JSON.stringify({
        type: 'discovery-request',
        service: 'MemberNameDisplay',
        version: '1.4.0',
        timestamp: new Date().toISOString()
      });

      // Get network interfaces for broadcasting
      const interfaces = this.getNetworkInterfaces();
      
      interfaces.forEach(iface => {
        if (iface.broadcast) {
          console.log(`[NetworkDiscovery] Broadcasting to ${iface.broadcast}:${this.port}`);
          this.broadcastSocket.send(discoveryMessage, this.port, iface.broadcast);
        }
      });

      // Also scan common IP ranges
      this.scanCommonIPRanges();
      
    } catch (error) {
      console.error('[NetworkDiscovery] Error during network scan:', error);
    } finally {
      // Reset scanning flag after a delay
      setTimeout(() => {
        this.isScanning = false;
      }, 5000);
    }
  }

  // Scan common IP ranges for control panels
  async scanCommonIPRanges() {
    const interfaces = this.getNetworkInterfaces();
    
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const baseIP = iface.address.substring(0, iface.address.lastIndexOf('.'));
        console.log(`[NetworkDiscovery] Scanning range ${baseIP}.0/24`);
        
        // Scan first 50 IPs in the range
        for (let i = 1; i <= 50; i++) {
          const testIP = `${baseIP}.${i}`;
          this.testControlPanel(testIP);
          
          // Small delay to avoid overwhelming the network
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
  }

  // Test if an IP address is running a control panel
  async testControlPanel(ipAddress) {
    try {
      const response = await fetch(`http://${ipAddress}:3000/discovery`, {
        method: 'GET',
        timeout: 2000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.service === 'MemberNameDisplay') {
          console.log(`[NetworkDiscovery] Found control panel at ${ipAddress}:3000`);
          this.addDiscoveredDevice({
            type: 'control-panel',
            ipAddress: ipAddress,
            port: 3000,
            service: data.service,
            version: data.version,
            capabilities: data.capabilities,
            connectedClients: data.connectedClients,
            discoveredAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      // Silently ignore connection errors
    }
  }

  // Handle discovery response from Pi displays
  handleDiscoveryResponse(data, remote) {
    console.log(`[NetworkDiscovery] Received discovery response from ${remote.address}:`, data);
    
    if (data.type === 'discovery-response' && data.service === 'MemberNameDisplay') {
      this.addDiscoveredDevice({
        type: 'pi-display',
        ipAddress: remote.address,
        port: data.port || 3000,
        service: data.service,
        version: data.version,
        clientId: data.clientId,
        capabilities: data.capabilities,
        discoveredAt: new Date().toISOString()
      });
    }
  }

  // Add discovered device to the list
  addDiscoveredDevice(device) {
    const key = `${device.type}-${device.ipAddress}`;
    this.discoveredDevices.set(key, device);
    
    console.log(`[NetworkDiscovery] Added device: ${device.type} at ${device.ipAddress}`);
    
    // Emit event for UI updates
    this.emit('deviceDiscovered', device);
  }

  // Get list of discovered devices
  getDiscoveredDevices() {
    return Array.from(this.discoveredDevices.values());
  }

  // Get discovered Pi displays
  getPiDisplays() {
    return this.getDiscoveredDevices().filter(device => device.type === 'pi-display');
  }

  // Get discovered control panels
  getControlPanels() {
    return this.getDiscoveredDevices().filter(device => device.type === 'control-panel');
  }

  // Clear discovered devices
  clearDiscoveredDevices() {
    this.discoveredDevices.clear();
    console.log('[NetworkDiscovery] Cleared discovered devices');
  }

  // Get network interfaces for broadcasting
  getNetworkInterfaces() {
    const interfaces = networkInterfaces();
    const validInterfaces = [];

    Object.keys(interfaces).forEach(name => {
      interfaces[name].forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
          validInterfaces.push({
            name: name,
            address: iface.address,
            netmask: iface.netmask,
            broadcast: this.calculateBroadcast(iface.address, iface.netmask),
            family: iface.family
          });
        }
      });
    });

    return validInterfaces;
  }

  // Calculate broadcast address
  calculateBroadcast(ip, netmask) {
    const ipParts = ip.split('.').map(Number);
    const maskParts = netmask.split('.').map(Number);
    
    const broadcast = ipParts.map((part, i) => {
      return (part & maskParts[i]) | (~maskParts[i] & 255);
    });
    
    return broadcast.join('.');
  }

  // Manual scan trigger
  triggerScan() {
    console.log('[NetworkDiscovery] Manual scan triggered');
    this.scanNetwork();
  }

  // Get discovery status
  getStatus() {
    return {
      isRunning: this.isScanning,
      discoveredDevices: this.discoveredDevices.size,
      piDisplays: this.getPiDisplays().length,
      controlPanels: this.getControlPanels().length,
      lastScan: this.lastScanTime
    };
  }
}

module.exports = NetworkDiscovery; 