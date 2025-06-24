# Event Name Display System - Project Specifications

## Project Overview

Create a networked name display system for events requiring participant identification and queue management. The system consists of a central control application and multiple networked display clients running on Raspberry Pi or similar micro PCs, enabling operators to manage name displays across multiple stations or photo opportunities.

## System Architecture

### Network Components
- **Control Station**: Desktop/laptop application for operator management
- **Display Clients**: Raspberry Pi devices with dedicated monitors/TVs
- **Network Communication**: WebSocket or HTTP API for real-time display control
- **Local Network**: System operates on local WiFi/Ethernet without internet dependency

## Core Requirements

### 1. Participant Data Management
- **CSV Import**: Load participant data from CSV file with columns:
  - `LastName` (required)
  - `Participant1` (first name - required)
  - `Participant2` (optional - for groups/families with multiple participants)
  - `Participant3` (optional)
  - `Participant4` (optional)
- **Manual Entry**: Add new participants or groups during the event
- **Participant Management**: 
  - Edit existing entries (add/remove group members)
  - Delete entries if needed
  - All changes maintained in memory during event session
- **Offline Operation**: System must function completely offline with no internet dependency
- **Future extensibility**: Design with modularity to replace CSV import with API integrations later

### 2. Name Display Format
- **Two-line layout**: Participant name(s) on top line, last name on bottom line
- **Font requirements**: Configurable font family and base font size
- **Auto-scaling**: If text doesn't fit on one line, automatically reduce font size to fit
- **Multi-participant groups**: Display multiple first names on the same slide (e.g., "John & Sarah" on first line, "Smith" on second line)
- **Customizable branding**: Configurable colors, logos, and styling per event

### 3. Control Interface (Desktop Application)
- **Multi-display management**:
  - Central control panel for operator use
  - Support for multiple networked display clients
  - Each display independently controllable
  - Real-time status monitoring of all connected displays
- **Search functionality**: Real-time search to find and select names from loaded data
- **Queue management**:
  - Queue system for participants waiting at stations
  - Drag-and-drop or button-based assignment to specific displays
  - Visual queue showing next participants in line
  - Clear indication of which display each queued participant is assigned to
- **Participant management**:
  - "Add New Participant/Group" button with quick entry form
  - "Edit Group" option to add/remove members from existing entries
  - Confirmation dialogs for destructive actions
- **Display controls**: 
  - Separate show/clear buttons for each networked display
  - Current display status indicator for all screens
  - Queue position indicators
  - Display health monitoring (connection status, last ping)

### 4. Display Client System (Raspberry Pi)
- **Lightweight client**: Minimal resource usage for reliable operation on Pi hardware
- **Network connectivity**: Automatic discovery and connection to control station
- **Fullscreen display**: Clean, distraction-free name presentation
- **Slideshow mode**: Default rotating content when not displaying participant names
- **Auto-recovery**: Automatic reconnection on network interruption
- **Remote configuration**: Font, color, and layout settings pushed from control station

### 5. Slideshow Mode
- **Default state**: When no name is actively displayed, shows rotating slideshow content
- **Independent operation**: Each display can be in slideshow or name display mode independently
- **Customizable content**: Event branding, sponsor logos, welcome messages, or custom slides
- **Seamless transition**: Smooth switch between slideshow and name display modes
- **Content management**: Upload and manage slideshow images from control station

### 6. Technical Specifications
- **Control Station Platform**: Cross-platform desktop application (Windows, macOS, Linux)
- **Framework**: Electron with modern web technologies for UI
- **Display Client Platform**: Raspberry Pi OS (Debian-based Linux)
- **Client Framework**: Web browser in kiosk mode or lightweight display application
- **Network Protocol**: WebSocket for real-time communication, HTTP for file transfers
- **Discovery**: mDNS/Bonjour for automatic device discovery
- **File handling**: CSV parsing, validation, and image management
- **UI Framework**: Modern, responsive interface (React/Vue.js recommended)
- **Data persistence**: Local storage with optional export functionality

## Network Communication
- **Device Discovery**: Automatic detection of display clients on local network
- **Real-time Updates**: Instant display changes via WebSocket connections
- **Offline Resilience**: Graceful handling of temporary network interruptions
- **Security**: Optional authentication for production environments
- **Status Monitoring**: Heartbeat system to track display client health

## User Workflow
1. **Setup**: Start control station, displays auto-connect to network
2. **Data Loading**: Operator loads CSV file with participant names
3. **Day-of adjustments**: Add new walk-ins or edit groups as needed
4. **Queue management**: As participants arrive, operator searches and adds them to queue
5. **Display assignment**: Operator assigns queued participants to specific displays
6. **Remote display control**: Operator shows selected name on appropriate display when participant reaches station
7. **Clear and advance**: After session, operator clears display and advances queue
8. Each display returns to slideshow mode when cleared

## Display Client Features
- **Automatic startup**: Boot directly to display application
- **Network resilience**: Continue displaying last content during brief disconnections
- **Remote monitoring**: Report status, temperature, and performance metrics
- **Easy deployment**: Simple SD card image for quick setup
- **Configuration management**: Remote updates to display settings
- **Health monitoring**: Automatic restart on critical errors

## Additional Features
- **Multi-event support**: Save and load different event configurations
- **Display grouping**: Organize displays by location or function
- **Batch operations**: Simultaneously control multiple displays
- **Analytics**: Track usage patterns and queue metrics
- **Template system**: Pre-configured layouts for different event types
- **Backup and restore**: Event data and configuration backup
- **Remote troubleshooting**: Diagnostic tools for display clients
- **Performance monitoring**: Network latency and display response metrics

## Deployment Considerations
- **Scalability**: Support for 2-20+ display clients per control station
- **Network requirements**: Standard WiFi or Ethernet infrastructure
- **Hardware specifications**: Minimum requirements for Pi devices and displays
- **Setup documentation**: Step-by-step deployment guide
- **Troubleshooting tools**: Network diagnostics and connection testing
- **Update mechanism**: Remote software updates for display clients

## Event Types and Use Cases
- **Photo events**: Name displays for photo opportunities
- **Registration events**: Queue management and participant identification
- **Award ceremonies**: Sequential name display for recognition
- **Check-in stations**: Multi-location participant processing
- **Trade shows**: Booth visitor identification
- **Sporting events**: Participant announcements
- **School events**: Student recognition displays

## Development Priorities
1. **Core functionality**: Basic name display and queue management
2. **Network reliability**: Robust communication between control and displays
3. **User experience**: Intuitive operator interface
4. **Display quality**: Clear, readable name presentation
5. **Deployment ease**: Simple setup and configuration process
6. **Scalability**: Support for varying event sizes
7. **Extensibility**: Plugin architecture for future enhancements

## Success Criteria
- Operators can quickly find and queue any participant's name
- Smooth management of multiple simultaneous stations
- Names are clearly visible and readable on all displays
- Efficient queue management during peak periods
- Reliable network communication between control and displays
- Easy setup requiring minimal technical expertise
- System stability throughout multi-hour events
- Responsive performance with 100+ participants loaded

## Future Enhancements
- **Mobile control app**: Tablet/phone interface for roaming operators
- **API integrations**: Direct connection to registration systems
- **Advanced analytics**: Detailed event metrics and reporting
- **Cloud synchronization**: Optional backup and multi-event management
- **Voice control**: Hands-free operation capabilities
- **Digital signage integration**: Extended display functionality
- **Multi-language support**: Internationalization capabilities

## Current Implementation Status

### Completed Features
- Basic desktop application with Electron
- CSV import functionality
- Local display management
- Font customization
- Multi-participant group support
- Auto-scaling text display
- Manual participant entry
- Basic UI with React

### In Progress / Planned Features
- Network communication (WebSocket/HTTP API)
- Raspberry Pi display clients
- Multi-display management
- Queue system
- Slideshow mode
- Device discovery
- Remote configuration
- Health monitoring

### Development Roadmap
1. **Phase 1**: Network communication infrastructure
2. **Phase 2**: Display client development
3. **Phase 3**: Multi-display management
4. **Phase 4**: Queue system implementation
5. **Phase 5**: Slideshow mode and content management
6. **Phase 6**: Advanced features and optimizations

## Technical Architecture Decisions

### Current Stack
- **Frontend**: React with modern JavaScript
- **Backend**: Electron main process
- **Build System**: Webpack with Electron Forge
- **Styling**: CSS with responsive design
- **Data Storage**: Local file system with CSV

### Planned Additions
- **Network Layer**: WebSocket server/client
- **Discovery**: mDNS/Bonjour implementation
- **Client Framework**: Lightweight web application for Pi
- **Configuration**: JSON-based settings management
- **Monitoring**: Health check and status reporting

## Contributing Guidelines

When contributing to this project, please ensure your code aligns with these specifications:

1. **Maintain offline-first operation**
2. **Follow the established UI/UX patterns**
3. **Ensure cross-platform compatibility**
4. **Implement proper error handling**
5. **Add comprehensive documentation**
6. **Test network resilience scenarios**
7. **Consider scalability implications**

## Related Documentation

- [Quick Start Guide](QUICK_START.md) - Getting started with the current version
- [User Guide](USER_GUIDE.md) - Detailed usage instructions
- [Configuration Management](CONFIGURATION_MANAGEMENT_SUMMARY.md) - Settings and customization
- [Performance Optimizations](PERFORMANCE_OPTIMIZATIONS.md) - Performance considerations

---

*This document serves as the authoritative reference for all project goals, requirements, and technical specifications. All development decisions should align with these specifications to ensure consistent project direction and successful delivery of the networked name display system.* 