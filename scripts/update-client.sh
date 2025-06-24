#!/bin/bash

# Member Name Display - Pi Client Updater
# Enhanced update script with channel support, version check, backup, rollback, and logging

CLIENT_DIR="/home/pi/member-name-display"
CLIENT_FILE="$CLIENT_DIR/pi-display-client.html"
CONFIG_FILE="$CLIENT_DIR/config.json"
BACKUP_DIR="$CLIENT_DIR/backup"
LOG_FILE="$CLIENT_DIR/update.log"
VERSION_FILE="$CLIENT_DIR/.client-version"
CHANNEL_FILE="$CLIENT_DIR/.update-channel"
TMP_FILE="$CLIENT_DIR/pi-display-client.html.tmp"
GITHUB_API="https://api.github.com/repos/jgilmore-dev/MemberNameDisplay/releases"
RAW_CLIENT_URL="https://raw.githubusercontent.com/jgilmore-dev/MemberNameDisplay/main/src/pi-display-client.html"

# Default channel (can be overridden by .update-channel file)
DEFAULT_CHANNEL="stable"

# Helper: log message
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Get update channel
get_update_channel() {
  if [ -f "$CHANNEL_FILE" ]; then
    cat "$CHANNEL_FILE"
  else
    echo "$DEFAULT_CHANNEL"
  fi
}

# Set update channel
set_update_channel() {
  local channel="$1"
  echo "$channel" > "$CHANNEL_FILE"
  log "Update channel set to: $channel"
}

# Get latest version based on channel
get_latest_version() {
  local channel="$1"
  
  if [ "$channel" = "testing" ]; then
    # For testing channel, get the latest pre-release or development version
    # This could be a specific tag pattern or the latest commit from main
    log "Checking testing channel for updates..."
    
    # Option 1: Get latest pre-release
    LATEST_VERSION=$(curl -s "$GITHUB_API" | grep -A 10 '"prerelease": true' | grep 'tag_name' | head -1 | sed -E 's/.*"v?([0-9.]+[a-zA-Z0-9-]*)".*/\1/')
    
    if [ -z "$LATEST_VERSION" ]; then
      # Option 2: Get latest commit hash from main branch
      LATEST_VERSION=$(curl -s "https://api.github.com/repos/jgilmore-dev/MemberNameDisplay/commits/main" | grep '"sha"' | head -1 | sed -E 's/.*"([a-f0-9]{7})".*/\1/')
      if [ -n "$LATEST_VERSION" ]; then
        LATEST_VERSION="dev-$LATEST_VERSION"
      fi
    fi
    
    # For testing, always use main branch URL
    RAW_CLIENT_URL="https://raw.githubusercontent.com/jgilmore-dev/MemberNameDisplay/main/src/pi-display-client.html"
  else
    # For stable channel, get the latest release
    log "Checking stable channel for updates..."
    LATEST_VERSION=$(curl -s "$GITHUB_API/latest" | grep 'tag_name' | head -1 | sed -E 's/.*"v?([0-9.]+)".*/\1/')
    
    # For stable releases, use release-specific URL if available
    if [ -n "$LATEST_VERSION" ]; then
      RELEASE_CLIENT_URL="https://github.com/jgilmore-dev/MemberNameDisplay/releases/download/v$LATEST_VERSION/pi-display-client.html"
      # Test if release file exists
      if curl -fsSL -I "$RELEASE_CLIENT_URL" >/dev/null 2>&1; then
        RAW_CLIENT_URL="$RELEASE_CLIENT_URL"
        log "Using release-specific URL: $RAW_CLIENT_URL"
      else
        log "Release file not found, falling back to main branch"
        RAW_CLIENT_URL="https://raw.githubusercontent.com/jgilmore-dev/MemberNameDisplay/main/src/pi-display-client.html"
      fi
    fi
  fi
  
  echo "$LATEST_VERSION"
}

# Display current status
show_status() {
  local channel=$(get_update_channel)
  local current_version="0.0.0"
  
  if [ -f "$VERSION_FILE" ]; then
    current_version=$(cat "$VERSION_FILE")
  fi
  
  echo "=== Pi Client Status ==="
  echo "Channel: $channel"
  echo "Current Version: $current_version"
  echo "Update Log: $LOG_FILE"
  echo "========================"
}

# Show help
show_help() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --check          Check for updates without installing"
  echo "  --update         Check and install updates (default)"
  echo "  --channel CHANNEL Set update channel (stable/testing)"
  echo "  --status         Show current status"
  echo "  --help           Show this help message"
  echo ""
  echo "Channels:"
  echo "  stable           Use official releases (default)"
  echo "  testing          Use latest development version"
  echo ""
  echo "Examples:"
  echo "  $0                    # Check and update using current channel"
  echo "  $0 --check            # Check for updates only"
  echo "  $0 --channel testing  # Switch to testing channel"
  echo "  $0 --status           # Show current status"
}

# Parse command line arguments
ACTION="update"
while [[ $# -gt 0 ]]; do
  case $1 in
    --check)
      ACTION="check"
      shift
      ;;
    --update)
      ACTION="update"
      shift
      ;;
    --channel)
      if [ -n "$2" ]; then
        set_update_channel "$2"
        shift 2
      else
        echo "Error: --channel requires a value"
        exit 1
      fi
      ;;
    --status)
      show_status
      exit 0
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Get current channel
CHANNEL=$(get_update_channel)
log "Using update channel: $CHANNEL"

# 1. Check for internet connectivity
ping -c 1 8.8.8.8 &>/dev/null || {
  log "No internet connection. Skipping update."
  exit 0
}

# 2. Get latest version from GitHub based on channel
LATEST_VERSION=$(get_latest_version "$CHANNEL")
if [ -z "$LATEST_VERSION" ]; then
  log "Could not determine latest version. Skipping update."
  exit 1
fi

# 3. Get current version
if [ -f "$VERSION_FILE" ]; then
  CURRENT_VERSION=$(cat "$VERSION_FILE")
else
  CURRENT_VERSION="0.0.0"
fi

# 4. Compare versions
verlte() { [ "$1" = "$2" ] || [  "$(printf '%s\n%s' "$1" "$2" | sort -V | head -n1)" = "$1" ]; }
vergte() { [ "$1" = "$2" ] || [  "$(printf '%s\n%s' "$1" "$2" | sort -V | head -n1)" != "$1" ]; }

if verlte "$LATEST_VERSION" "$CURRENT_VERSION"; then
  log "Already up to date (current: $CURRENT_VERSION, latest: $LATEST_VERSION)."
  exit 0
fi

log "Update available: $CURRENT_VERSION -> $LATEST_VERSION (channel: $CHANNEL)"

# If just checking, exit here
if [ "$ACTION" = "check" ]; then
  log "Update check complete. Run with --update to install."
  exit 0
fi

# 5. Download new client to temp file
log "Downloading from: $RAW_CLIENT_URL"
curl -fsSL "$RAW_CLIENT_URL" -o "$TMP_FILE"
if [ $? -ne 0 ] || [ ! -s "$TMP_FILE" ]; then
  log "Failed to download new client. Aborting update."
  rm -f "$TMP_FILE"
  exit 1
fi

# 6. Backup current client and config
mkdir -p "$BACKUP_DIR"
cp "$CLIENT_FILE" "$BACKUP_DIR/pi-display-client.html.bak" 2>/dev/null
cp "$CONFIG_FILE" "$BACKUP_DIR/config.json.bak" 2>/dev/null
log "Backup of current client and config completed."

# 7. Replace client with new version
cp "$TMP_FILE" "$CLIENT_FILE"
rm -f "$TMP_FILE"
log "Client updated to version $LATEST_VERSION."

echo "$LATEST_VERSION" > "$VERSION_FILE"

# 8. Verify new client loads (basic check: file is not empty)
if [ ! -s "$CLIENT_FILE" ]; then
  log "Update failed: new client file is empty. Rolling back."
  cp "$BACKUP_DIR/pi-display-client.html.bak" "$CLIENT_FILE"
  cp "$BACKUP_DIR/config.json.bak" "$CONFIG_FILE" 2>/dev/null
  log "Rollback complete."
  exit 1
fi

log "Update to version $LATEST_VERSION successful (channel: $CHANNEL)."
exit 0 