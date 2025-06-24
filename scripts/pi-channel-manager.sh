#!/bin/bash

# Member Name Display - Pi Client Channel Manager
# User-friendly script to manage update channels for Pi clients

CLIENT_DIR="/home/pi/member-name-display"
CHANNEL_FILE="$CLIENT_DIR/.update-channel"
UPDATE_SCRIPT="$CLIENT_DIR/update-client.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Get current channel
get_current_channel() {
  if [ -f "$CHANNEL_FILE" ]; then
    cat "$CHANNEL_FILE"
  else
    echo "stable"
  fi
}

# Set channel
set_channel() {
  local channel="$1"
  
  # Validate channel
  if [ "$channel" != "stable" ] && [ "$channel" != "testing" ]; then
    log_error "Invalid channel: $channel. Use 'stable' or 'testing'."
    return 1
  fi
  
  # Create directory if it doesn't exist
  mkdir -p "$CLIENT_DIR"
  
  # Set the channel
  echo "$channel" > "$CHANNEL_FILE"
  log_success "Update channel set to: $channel"
  
  # Show channel information
  show_channel_info "$channel"
}

# Show channel information
show_channel_info() {
  local channel="$1"
  
  echo ""
  echo "=== Channel Information ==="
  case "$channel" in
    "stable")
      echo "Channel: Stable"
      echo "Description: Official releases only"
      echo "Update Source: GitHub releases"
      echo "Stability: High - Production ready"
      echo "Update Frequency: When releases are published"
      echo "Recommended for: Production environments"
      ;;
    "testing")
      echo "Channel: Testing"
      echo "Description: Latest development version"
      echo "Update Source: Main branch"
      echo "Stability: Variable - May contain bugs"
      echo "Update Frequency: On every commit to main"
      echo "Recommended for: Development and testing"
      ;;
  esac
  echo "=========================="
  echo ""
}

# Show current status
show_status() {
  local current_channel=$(get_current_channel)
  local current_version="Unknown"
  
  if [ -f "$CLIENT_DIR/.client-version" ]; then
    current_version=$(cat "$CLIENT_DIR/.client-version")
  fi
  
  echo "=== Pi Client Status ==="
  echo "Current Channel: $current_channel"
  echo "Current Version: $current_version"
  echo "Client Directory: $CLIENT_DIR"
  echo "Update Script: $UPDATE_SCRIPT"
  echo "========================"
  echo ""
  
  show_channel_info "$current_channel"
}

# Check for updates
check_updates() {
  local current_channel=$(get_current_channel)
  
  log_info "Checking for updates on $current_channel channel..."
  
  if [ -f "$UPDATE_SCRIPT" ]; then
    "$UPDATE_SCRIPT" --check
  else
    log_error "Update script not found: $UPDATE_SCRIPT"
    return 1
  fi
}

# Perform update
perform_update() {
  local current_channel=$(get_current_channel)
  
  log_info "Performing update on $current_channel channel..."
  
  if [ -f "$UPDATE_SCRIPT" ]; then
    "$UPDATE_SCRIPT" --update
  else
    log_error "Update script not found: $UPDATE_SCRIPT"
    return 1
  fi
}

# Interactive channel selection
interactive_setup() {
  echo "=== Pi Client Channel Setup ==="
  echo ""
  echo "Choose your update channel:"
  echo ""
  echo "1) Stable Channel"
  echo "   - Official releases only"
  echo "   - High stability"
  echo "   - Recommended for production"
  echo ""
  echo "2) Testing Channel"
  echo "   - Latest development version"
  echo "   - May contain new features and bugs"
  echo "   - Recommended for development/testing"
  echo ""
  
  read -p "Enter your choice (1 or 2): " choice
  
  case "$choice" in
    1)
      set_channel "stable"
      ;;
    2)
      log_warning "You're switching to the testing channel."
      log_warning "This may result in unstable behavior."
      read -p "Are you sure? (y/N): " confirm
      if [[ "$confirm" =~ ^[Yy]$ ]]; then
        set_channel "testing"
      else
        log_info "Channel selection cancelled."
      fi
      ;;
    *)
      log_error "Invalid choice. Please run the script again."
      exit 1
      ;;
  esac
}

# Show help
show_help() {
  echo "Usage: $0 [COMMAND] [OPTIONS]"
  echo ""
  echo "Commands:"
  echo "  status              Show current status"
  echo "  set-channel CHANNEL Set update channel (stable/testing)"
  echo "  check               Check for updates"
  echo "  update              Perform update"
  echo "  setup               Interactive setup"
  echo "  help                Show this help message"
  echo ""
  echo "Channels:"
  echo "  stable              Use official releases (default)"
  echo "  testing             Use latest development version"
  echo ""
  echo "Examples:"
  echo "  $0 status                    # Show current status"
  echo "  $0 set-channel testing       # Switch to testing channel"
  echo "  $0 check                     # Check for updates"
  echo "  $0 update                    # Perform update"
  echo "  $0 setup                     # Interactive setup"
  echo ""
  echo "Channel Behavior:"
  echo "  Stable Channel:"
  echo "    - Downloads from GitHub releases"
  echo "    - High stability and reliability"
  echo "    - Updates only when releases are published"
  echo ""
  echo "  Testing Channel:"
  echo "    - Downloads from main branch"
  echo "    - Latest features and fixes"
  echo "    - May contain bugs or instability"
  echo "    - Updates on every commit to main"
}

# Main script logic
case "${1:-}" in
  "status")
    show_status
    ;;
  "set-channel")
    if [ -n "$2" ]; then
      set_channel "$2"
    else
      log_error "Channel not specified. Use 'stable' or 'testing'."
      exit 1
    fi
    ;;
  "check")
    check_updates
    ;;
  "update")
    perform_update
    ;;
  "setup")
    interactive_setup
    ;;
  "help"|"--help"|"-h")
    show_help
    ;;
  "")
    # No arguments - show status and help
    show_status
    echo ""
    echo "Run '$0 help' for available commands."
    ;;
  *)
    log_error "Unknown command: $1"
    echo ""
    show_help
    exit 1
    ;;
esac 