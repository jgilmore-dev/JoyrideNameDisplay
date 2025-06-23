const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

class WebServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.io = null;
    this.port = 3000;
    this.connectedClients = new Set();
    this.isRunning = false;
  }

  // Initialize the web server
  initialize() {
    try {
      console.log('[WebServer] Starting initialization...');
      
      // Create HTTP server
      this.server = createServer(this.app);
      console.log('[WebServer] HTTP server created');
      
      // Create Socket.io server with CORS enabled
      this.io = new Server(this.server, {
        cors: {
          origin: "*", // Allow all origins for Pi displays
          methods: ["GET", "POST"]
        }
      });
      console.log('[WebServer] Socket.io server created');

      // Setup static files for Pi displays
      console.log('[WebServer] Setting up static routes...');
      this.setupStaticRoutes();
      console.log('[WebServer] Static routes setup complete');
      
      // Setup Socket.io event handlers
      console.log('[WebServer] Setting up Socket.io handlers...');
      this.setupSocketHandlers();
      console.log('[WebServer] Socket.io handlers setup complete');
      
      // Setup Express routes
      console.log('[WebServer] Setting up Express routes...');
      this.setupRoutes();
      console.log('[WebServer] Express routes setup complete');
      
      console.log('[WebServer] Web server initialized successfully');
      return true;
    } catch (error) {
      console.error('[WebServer] Failed to initialize web server:', error);
      return false;
    }
  }

  // Setup static file serving for Pi displays
  setupStaticRoutes() {
    console.log('[WebServer] Setting up route: /');
    // Serve the Pi display client (embedded HTML)
    this.app.get('/', (req, res) => {
      console.log('[WebServer] Serving root route');
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Member Name Display - Pi Client</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        @font-face {
            font-family: 'GothamRnd';
            src: url('/fonts/GothamRnd-Bold.otf') format('opentype');
            font-weight: bold;
            font-style: normal;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'GothamRnd', 'Arial', sans-serif;
            background: #000;
            color: #fff;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        #status-bar {
            background: #333;
            padding: 10px;
            text-align: center;
            font-size: 14px;
            border-bottom: 1px solid #555;
        }

        #status-bar.connected {
            background: #2d5a2d;
        }

        #status-bar.disconnected {
            background: #5a2d2d;
        }

        #display-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            background: #000;
        }

        #name-display {
            font-family: 'GothamRnd', 'Arial', sans-serif;
            font-size: 4vw;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            max-width: 90%;
            word-wrap: break-word;
            transition: all 0.3s ease;
        }

        #name-display div {
            font-family: 'GothamRnd', 'Arial', sans-serif;
            font-weight: bold;
        }

        #slideshow-display {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: -1;
        }

        #connection-info {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            max-width: 200px;
        }

        .hidden {
            display: none !important;
        }

        .fade-in {
            animation: fadeIn 0.5s ease-in;
        }

        .fade-out {
            animation: fadeOut 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="status-bar" class="disconnected">
        <span id="status-text">Connecting...</span>
        <span class="loading" id="loading-spinner"></span>
    </div>

    <div id="connection-info">
        <div>Connected: <span id="connection-status">No</span></div>
        <div>Last Update: <span id="last-update">Never</span></div>
        <div>Messages: <span id="message-count">0</span></div>
    </div>

    <div id="display-container">
        <div id="name-display" class="hidden"></div>
        <img id="slideshow-display" class="hidden" alt="Slideshow">
    </div>

    <script>
        class PiDisplayClient {
            constructor() {
                this.socket = null;
                this.isConnected = false;
                this.reconnectAttempts = 0;
                this.maxReconnectAttempts = 10;
                this.reconnectDelay = 2000;
                this.messageCount = 0;
                this.currentName = null;
                this.currentSlide = null;
                this.fontColor = '#ffffff';
                
                this.initializeElements();
                this.connect();
            }

            initializeElements() {
                this.statusBar = document.getElementById('status-bar');
                this.statusText = document.getElementById('status-text');
                this.loadingSpinner = document.getElementById('loading-spinner');
                this.connectionStatus = document.getElementById('connection-status');
                this.lastUpdate = document.getElementById('last-update');
                this.messageCountElement = document.getElementById('message-count');
                this.nameDisplay = document.getElementById('name-display');
                this.slideshowDisplay = document.getElementById('slideshow-display');
            }

            connect() {
                try {
                    console.log('[PiClient] Attempting to connect to server...');
                    this.updateStatus('Connecting...', 'disconnected');
                    
                    this.socket = io({
                        transports: ['websocket', 'polling'],
                        timeout: 5000,
                        reconnection: true,
                        reconnectionAttempts: this.maxReconnectAttempts,
                        reconnectionDelay: this.reconnectDelay
                    });

                    this.setupSocketEventHandlers();
                } catch (error) {
                    console.error('[PiClient] Connection error:', error);
                    this.handleConnectionError();
                }
            }

            setupSocketEventHandlers() {
                this.socket.on('connect', () => {
                    console.log('[PiClient] Connected to server');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.updateStatus('Connected', 'connected');
                    this.socket.emit('client-ready', { clientType: 'pi-display' });
                });

                this.socket.on('disconnect', () => {
                    console.log('[PiClient] Disconnected from server');
                    this.isConnected = false;
                    this.updateStatus('Disconnected', 'disconnected');
                });

                this.socket.on('connect_error', (error) => {
                    console.error('[PiClient] Connection error:', error);
                    this.handleConnectionError();
                });

                this.socket.on('server-ready', (data) => {
                    console.log('[PiClient] Server ready:', data);
                    this.updateStatus('Ready', 'connected');
                });

                this.socket.on('name-update', (message) => {
                    this.handleNameUpdate(message);
                });

                this.socket.on('slideshow-update', (message) => {
                    this.handleSlideshowUpdate(message);
                });

                this.socket.on('display-update', (message) => {
                    this.handleDisplayUpdate(message);
                });

                this.socket.on('state-update', (message) => {
                    this.handleStateUpdate(message);
                });
            }

            handleConnectionError() {
                this.reconnectAttempts++;
                if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                    this.updateStatus(\`Reconnecting... (\${this.reconnectAttempts}/\${this.maxReconnectAttempts})\`, 'disconnected');
                    setTimeout(() => this.connect(), this.reconnectDelay);
                } else {
                    this.updateStatus('Connection failed', 'disconnected');
                }
            }

            handleNameUpdate(message) {
                this.messageCount++;
                this.updateMessageCount();
                this.updateLastUpdate();

                console.log('[PiClient] Name update received:', message);

                if (message.type === 'display-name') {
                    this.displayName(message.data);
                } else if (message.type === 'clear-name') {
                    this.clearName();
                }
            }

            handleSlideshowUpdate(message) {
                this.messageCount++;
                this.updateMessageCount();
                this.updateLastUpdate();

                console.log('[PiClient] Slideshow update received:', message);
                this.currentSlide = message.data.slideIndex;
                console.log(\`[PiClient] Current slide: \${this.currentSlide}\`);
            }

            handleDisplayUpdate(message) {
                this.messageCount++;
                this.updateMessageCount();
                this.updateLastUpdate();

                console.log('[PiClient] Display update received:', message);

                if (message.type === 'font-color-update') {
                    this.fontColor = message.data.fontColor;
                    this.updateFontColor();
                }
            }

            handleStateUpdate(message) {
                console.log('[PiClient] State update received:', message);
                if (message.data.currentName) {
                    this.displayName(message.data.currentName);
                }
                if (message.data.fontColor) {
                    this.fontColor = message.data.fontColor;
                    this.updateFontColor();
                }
            }

            displayName(nameData) {
                this.currentName = nameData;
                let html = '';
                if (typeof nameData === 'object' && nameData !== null) {
                    if (nameData.firstLine || nameData.secondLine) {
                        html = '<div>' + (nameData.firstLine || '') + '</div><div>' + (nameData.secondLine || '') + '</div>';
                    } else if (nameData.name) {
                        html = nameData.name;
                    } else {
                        html = JSON.stringify(nameData);
                    }
                } else {
                    html = nameData;
                }
                this.nameDisplay.innerHTML = html;
                this.nameDisplay.style.color = this.fontColor;
                this.nameDisplay.classList.remove('hidden');
                this.nameDisplay.classList.add('fade-in');
                
                this.slideshowDisplay.classList.add('hidden');
                
                console.log('[PiClient] Displaying name:', nameData);
            }

            clearName() {
                this.currentName = null;
                this.nameDisplay.classList.add('fade-out');
                setTimeout(() => {
                    this.nameDisplay.classList.add('hidden');
                    this.nameDisplay.classList.remove('fade-out');
                }, 500);
                
                console.log('[PiClient] Name cleared');
            }

            updateFontColor() {
                if (this.currentName) {
                    this.nameDisplay.style.color = this.fontColor;
                }
            }

            updateStatus(text, className) {
                this.statusText.textContent = text;
                this.statusBar.className = className;
                this.connectionStatus.textContent = this.isConnected ? 'Yes' : 'No';
                
                if (this.isConnected) {
                    this.loadingSpinner.style.display = 'none';
                } else {
                    this.loadingSpinner.style.display = 'inline-block';
                }
            }

            updateMessageCount() {
                this.messageCountElement.textContent = this.messageCount;
            }

            updateLastUpdate() {
                this.lastUpdate.textContent = new Date().toLocaleTimeString();
            }

            sendStatus() {
                if (this.isConnected) {
                    this.socket.emit('client-status', {
                        connected: this.isConnected,
                        messageCount: this.messageCount,
                        currentName: this.currentName,
                        currentSlide: this.currentSlide,
                        fontColor: this.fontColor,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            console.log('[PiClient] Initializing Pi Display Client...');
            
            // Test font loading
            const testFont = new FontFace('GothamRnd', 'url(/fonts/GothamRnd-Bold.otf)');
            testFont.load().then(() => {
                console.log('[PiClient] GothamRnd font loaded successfully');
                document.fonts.add(testFont);
            }).catch((error) => {
                console.error('[PiClient] Failed to load GothamRnd font:', error);
                console.log('[PiClient] Falling back to Arial font');
            });
            
            window.piClient = new PiDisplayClient();
            
            setInterval(() => {
                if (window.piClient) {
                    window.piClient.sendStatus();
                }
            }, 30000);
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('[PiClient] Page hidden');
            } else {
                console.log('[PiClient] Page visible');
                if (window.piClient && !window.piClient.isConnected) {
                    window.piClient.connect();
                }
            }
        });
    </script>
</body>
</html>`;
      
      res.send(htmlContent);
    });

    // Serve font files
    console.log('[WebServer] Setting up route: /fonts/*');
    this.app.get('/fonts/:filename', (req, res) => {
      const filename = req.params.filename;
      
      // Try multiple possible paths for the font file
      const possiblePaths = [
        path.join(__dirname, 'assets', 'fonts', filename), // webpack build path
        path.join(__dirname, '..', 'src', 'assets', 'fonts', filename), // source path
        path.join(process.cwd(), 'src', 'assets', 'fonts', filename), // absolute source path
      ];
      
      console.log(`[WebServer] Font request: ${filename}`);
      console.log(`[WebServer] Checking paths:`, possiblePaths);
      
      let fontPath = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          fontPath = testPath;
          console.log(`[WebServer] Font found at: ${fontPath}`);
          break;
        }
      }
      
      if (fontPath) {
        // Set proper headers for font files
        res.setHeader('Content-Type', 'font/otf');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.sendFile(fontPath);
        console.log(`[WebServer] Font served successfully: ${filename}`);
      } else {
        console.error(`[WebServer] Font file not found in any of the expected locations`);
        console.error(`[WebServer] Searched paths:`, possiblePaths);
        res.status(404).json({ 
          error: 'Font file not found', 
          searchedPaths: possiblePaths,
          currentDir: __dirname,
          cwd: process.cwd()
        });
      }
    });

    // Serve status endpoint
    console.log('[WebServer] Setting up route: /status');
    this.app.get('/status', (req, res) => {
      console.log('[WebServer] Serving status route');
      res.json({
        status: 'running',
        connectedClients: this.connectedClients.size,
        uptime: process.uptime(),
        serverAddress: this.getServerAddress()
      });
    });

    // Serve connection info for Pi displays
    console.log('[WebServer] Setting up route: /connect-info');
    this.app.get('/connect-info', (req, res) => {
      console.log('[WebServer] Serving connect-info route');
      res.json({
        serverAddress: this.getServerAddress(),
        port: this.port,
        instructions: 'Connect to this address from your Pi display'
      });
    });

    // Serve health check endpoint
    console.log('[WebServer] Setting up route: /health');
    this.app.get('/health', (req, res) => {
      console.log('[WebServer] Serving health route');
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        clients: this.connectedClients.size 
      });
    });

    // Test font accessibility
    console.log('[WebServer] Setting up route: /test-font');
    this.app.get('/test-font', (req, res) => {
      const filename = 'GothamRnd-Bold.otf';
      
      // Try multiple possible paths for the font file
      const possiblePaths = [
        path.join(__dirname, 'assets', 'fonts', filename), // webpack build path
        path.join(__dirname, '..', 'src', 'assets', 'fonts', filename), // source path
        path.join(process.cwd(), 'src', 'assets', 'fonts', filename), // absolute source path
      ];
      
      let fontPath = null;
      let fontExists = false;
      let fontStats = null;
      
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          fontPath = testPath;
          fontExists = true;
          fontStats = fs.statSync(testPath);
          break;
        }
      }
      
      res.json({
        fontExists,
        fontPath,
        fontSize: fontStats ? fontStats.size : null,
        fontModified: fontStats ? fontStats.mtime : null,
        searchedPaths: possiblePaths,
        currentDir: __dirname,
        cwd: process.cwd(),
        message: fontExists ? 'Font file is accessible' : 'Font file not found in any expected location'
      });
    });

    // Handle 404 errors
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        availableRoutes: ['/', '/status', '/connect-info', '/health', '/test-font', '/fonts/*']
      });
    });
  }

  // Setup Socket.io event handlers
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`[WebServer] Pi display connected: ${socket.id}`);
      this.connectedClients.add(socket.id);

      // Send current state to new client
      this.sendCurrentState(socket);

      // Handle client disconnection
      socket.on('disconnect', () => {
        console.log(`[WebServer] Pi display disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

      // Handle client ready event
      socket.on('client-ready', () => {
        console.log(`[WebServer] Pi display ready: ${socket.id}`);
        socket.emit('server-ready', { message: 'Server ready to broadcast' });
      });

      // Handle client status updates
      socket.on('client-status', (status) => {
        console.log(`[WebServer] Pi display status: ${socket.id} - ${JSON.stringify(status)}`);
      });
    });
  }

  // Setup Express routes
  setupRoutes() {
    // Additional routes can be added here if needed
    console.log('[WebServer] Routes setup complete');
  }

  // Start the web server
  start() {
    if (this.isRunning) {
      console.log('[WebServer] Server is already running');
      return true;
    }

    const tryStartServer = (port) => {
      try {
        this.server.listen(port, () => {
          this.isRunning = true;
          this.port = port;
          console.log(`[WebServer] Web server started on port ${this.port}`);
          console.log(`[WebServer] Pi displays can connect to: ${this.getServerAddress()}`);
        });

        // Handle server errors
        this.server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`[WebServer] Port ${port} is in use, trying port ${port + 1}`);
            this.server.close();
            tryStartServer(port + 1);
          } else {
            console.error('[WebServer] Server error:', error);
            this.isRunning = false;
          }
        });

        return true;
      } catch (error) {
        console.error('[WebServer] Failed to start server:', error);
        return false;
      }
    };

    return tryStartServer(this.port);
  }

  // Stop the web server
  stop() {
    if (!this.isRunning) {
      console.log('[WebServer] Server is not running');
      return;
    }

    try {
      this.server.close(() => {
        this.isRunning = false;
        console.log('[WebServer] Web server stopped');
      });
    } catch (error) {
      console.error('[WebServer] Error stopping server:', error);
    }
  }

  // Broadcast name display to all connected Pi displays
  broadcastNameDisplay(nameData) {
    if (!this.isRunning || !this.io) {
      console.warn('[WebServer] Cannot broadcast - server not running');
      return;
    }

    const message = {
      type: 'display-name',
      data: nameData,
      timestamp: new Date().toISOString()
    };

    this.io.emit('name-update', message);
    console.log(`[WebServer] Broadcasted name display to ${this.connectedClients.size} Pi displays:`, nameData);
  }

  // Broadcast name clear to all connected Pi displays
  broadcastNameClear() {
    if (!this.isRunning || !this.io) {
      console.warn('[WebServer] Cannot broadcast - server not running');
      return;
    }

    const message = {
      type: 'clear-name',
      timestamp: new Date().toISOString()
    };

    this.io.emit('name-update', message);
    console.log(`[WebServer] Broadcasted name clear to ${this.connectedClients.size} Pi displays`);
  }

  // Broadcast slideshow update to all connected Pi displays
  broadcastSlideshowUpdate(slideIndex) {
    if (!this.isRunning || !this.io) {
      console.warn('[WebServer] Cannot broadcast - server not running');
      return;
    }

    const message = {
      type: 'slideshow-update',
      data: { slideIndex },
      timestamp: new Date().toISOString()
    };

    this.io.emit('slideshow-update', message);
    console.log(`[WebServer] Broadcasted slideshow update to ${this.connectedClients.size} Pi displays: slide ${slideIndex}`);
  }

  // Broadcast font color update to all connected Pi displays
  broadcastFontColorUpdate(fontColor) {
    if (!this.isRunning || !this.io) {
      console.warn('[WebServer] Cannot broadcast - server not running');
      return;
    }

    const message = {
      type: 'font-color-update',
      data: { fontColor },
      timestamp: new Date().toISOString()
    };

    this.io.emit('display-update', message);
    console.log(`[WebServer] Broadcasted font color update to ${this.connectedClients.size} Pi displays: ${fontColor}`);
  }

  // Send current state to a specific client
  sendCurrentState(socket) {
    // This will be populated with current app state
    const currentState = {
      type: 'current-state',
      data: {
        // Will be populated by main process
      },
      timestamp: new Date().toISOString()
    };

    socket.emit('state-update', currentState);
  }

  // Get server address for Pi displays
  getServerAddress() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    
    console.log('[WebServer] Available network interfaces:');
    Object.keys(interfaces).forEach(name => {
      interfaces[name].forEach(iface => {
        console.log(`[WebServer]   ${name}: ${iface.family} ${iface.address} (internal: ${iface.internal})`);
      });
    });
    
    // Priority order for finding the best interface:
    // 1. Non-internal IPv4 interfaces that are not loopback
    // 2. Prefer interfaces that are likely to be the primary network (not virtual adapters)
    const validInterfaces = [];
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Skip internal and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          // Skip loopback addresses
          if (!iface.address.startsWith('127.')) {
            // Skip common virtual adapter patterns
            const isVirtual = name.toLowerCase().includes('virtual') || 
                             name.toLowerCase().includes('vmware') ||
                             name.toLowerCase().includes('vbox') ||
                             name.toLowerCase().includes('hyper-v') ||
                             name.toLowerCase().includes('docker') ||
                             iface.address.startsWith('169.254.') || // Link-local
                             iface.address.startsWith('192.168.56.') || // VirtualBox
                             iface.address.startsWith('172.16.') && iface.address.endsWith('.1'); // Virtual adapters
            
            if (!isVirtual) {
              validInterfaces.push({
                name,
                address: iface.address,
                priority: this.getInterfacePriority(name, iface.address)
              });
            }
          }
        }
      }
    }
    
    // Sort by priority (higher priority first)
    validInterfaces.sort((a, b) => b.priority - a.priority);
    
    console.log('[WebServer] Valid network interfaces (sorted by priority):');
    validInterfaces.forEach(iface => {
      console.log(`[WebServer]   ${iface.name}: ${iface.address} (priority: ${iface.priority})`);
    });
    
    if (validInterfaces.length > 0) {
      const bestInterface = validInterfaces[0];
      console.log(`[WebServer] Selected interface: ${bestInterface.name} (${bestInterface.address})`);
      return `http://${bestInterface.address}:${this.port}`;
    }
    
    // Fallback: try to find any non-internal IPv4 interface
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('127.')) {
          console.log(`[WebServer] Fallback interface: ${name} (${iface.address})`);
          return `http://${iface.address}:${this.port}`;
        }
      }
    }
    
    // Final fallback to localhost
    console.log('[WebServer] Using localhost as fallback');
    return `http://localhost:${this.port}`;
  }

  // Get priority for network interface selection
  getInterfacePriority(name, address) {
    let priority = 0;
    
    // Higher priority for likely primary network interfaces
    if (name.toLowerCase().includes('ethernet') || name.toLowerCase().includes('lan')) {
      priority += 100;
    }
    
    // Higher priority for wireless interfaces
    if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless')) {
      priority += 80;
    }
    
    // Lower priority for virtual adapters
    if (name.toLowerCase().includes('virtual') || name.toLowerCase().includes('vmware') || 
        name.toLowerCase().includes('vbox') || name.toLowerCase().includes('hyper-v')) {
      priority -= 50;
    }
    
    // Higher priority for common private network ranges
    if (address.startsWith('192.168.')) {
      priority += 30;
    }
    if (address.startsWith('10.')) {
      priority += 20;
    }
    if (address.startsWith('172.')) {
      priority += 10;
    }
    
    return priority;
  }

  // Get connection status
  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      connectedClients: this.connectedClients.size,
      serverAddress: this.getServerAddress()
    };
  }

  // Set port (must be called before start())
  setPort(port) {
    if (this.isRunning) {
      console.warn('[WebServer] Cannot change port while server is running');
      return false;
    }
    
    this.port = port;
    return true;
  }
}

module.exports = WebServer; 