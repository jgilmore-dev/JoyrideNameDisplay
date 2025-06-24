# Development Quick Reference

## Project Goals Summary

**Event Name Display System**: A networked name display system for events requiring participant identification and queue management, consisting of a central control application and multiple networked display clients.

## Core Requirements Checklist

### Current Implementation
- [x] Basic desktop application with Electron
- [x] CSV import functionality
- [x] Local display management
- [x] Font customization
- [x] Multi-participant group support
- [x] Auto-scaling text display
- [x] Manual participant entry
- [x] Basic UI with React

### Next Priority Features
- [ ] Network communication (WebSocket/HTTP API)
- [ ] Raspberry Pi display clients
- [ ] Multi-display management
- [ ] Queue system
- [ ] Slideshow mode
- [ ] Device discovery
- [ ] Remote configuration
- [ ] Health monitoring

## Technical Stack

### Current
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

## Key Design Principles

1. **Offline-First**: System must function completely offline
2. **Network Resilience**: Graceful handling of network interruptions
3. **Scalability**: Support for 2-20+ display clients
4. **User-Friendly**: Intuitive interface for non-technical operators
5. **Cross-Platform**: Windows, macOS, Linux compatibility
6. **Modularity**: Design for future extensibility

## Data Format Requirements

### CSV Import Format
```
LastName,Participant1,Participant2,Participant3,Participant4
Smith,Emma,,
Johnson,Michael,Sophia,,
Williams,David,,
Brown,Sarah,Alex,Emma
```

### Display Format
- **Two-line layout**: Participant name(s) on top, last name on bottom
- **Auto-scaling**: Reduce font size if text doesn't fit
- **Multi-participant**: "John & Sarah" on first line, "Smith" on second line

## Network Architecture

### Control Station → Display Clients
- **Protocol**: WebSocket for real-time communication
- **Discovery**: mDNS/Bonjour for automatic device detection
- **File Transfer**: HTTP for image and configuration updates
- **Status Monitoring**: Heartbeat system for health checks

### Display Client Features
- **Automatic startup**: Boot directly to display application
- **Network resilience**: Continue displaying last content during disconnections
- **Remote configuration**: Settings pushed from control station
- **Health monitoring**: Report status and performance metrics

## User Workflow

1. **Setup**: Start control station, displays auto-connect
2. **Data Loading**: Load CSV file with participant names
3. **Day-of adjustments**: Add walk-ins or edit groups
4. **Queue management**: Search and add participants to queue
5. **Display assignment**: Assign queued participants to specific displays
6. **Remote control**: Show selected name on appropriate display
7. **Clear and advance**: Clear display and advance queue
8. **Return to slideshow**: Display returns to slideshow mode when cleared

## Development Guidelines

### Code Standards
- Maintain offline-first operation
- Follow established UI/UX patterns
- Ensure cross-platform compatibility
- Implement proper error handling
- Add comprehensive documentation
- Test network resilience scenarios
- Consider scalability implications

### Testing Priorities
- Network interruption handling
- Multi-display synchronization
- Queue management under load
- Auto-scaling text display
- Cross-platform compatibility
- Performance with 100+ participants

## Success Criteria

- [ ] Operators can quickly find and queue any participant's name
- [ ] Smooth management of multiple simultaneous stations
- [ ] Names are clearly visible and readable on all displays
- [ ] Efficient queue management during peak periods
- [ ] Reliable network communication between control and displays
- [ ] Easy setup requiring minimal technical expertise
- [ ] System stability throughout multi-hour events
- [ ] Responsive performance with 100+ participants loaded

## Quick Commands

### Development
```bash
npm install          # Install dependencies
npm start            # Start development server
npm run build        # Build for production
npm run package      # Package for distribution
```

### Testing
```bash
npm test             # Run tests
npm run lint         # Check code style
```

## Related Documentation

- **[Full Project Specifications](PROJECT_SPECIFICATIONS.md)** - Complete requirements and technical details
- **[Quick Start Guide](QUICK_START.md)** - Getting started with current version
- **[User Guide](USER_GUIDE.md)** - End-user documentation
- **[Configuration Management](CONFIGURATION_MANAGEMENT_SUMMARY.md)** - Settings and customization

---

*Use this reference during development to ensure alignment with project goals and requirements.* 