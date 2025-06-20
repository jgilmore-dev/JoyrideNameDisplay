# Joyride Event Display - User Guide

## Overview

The Joyride Event Display Application is designed to manage and display participant information for special needs joyride events. It provides a user-friendly interface for importing member data, managing displays, and creating engaging visual presentations.

## Getting Started

### Installation
1. Download the latest Windows installer from the [Releases page](https://github.com/jgilmore-dev/JoyrideNameDisplay/releases)
2. Run the installer and follow the setup wizard
3. Launch the application from your Start Menu or Desktop shortcut

### First Launch
When you first open the application, you'll see the Control Panel with options to:
- Import member data from a CSV file
- Add members manually
- Configure display settings
- Start the banner displays

## Importing Member Data

### CSV Format Requirements
Your CSV file must have the following columns:
- **LastName** (required): The family's last name
- **Member1** (required): First member's name
- **Member2** (optional): Second member's name (for families with multiple members)
- **Member3** (optional): Third member's name (for families with multiple members)

### Sample CSV Structure
```csv
LastName,Member1,Member2,Member3
Smith,Emma,,
Johnson,Michael,Sophia,
Williams,David,,
Brown,Sarah,Alex,Emma
```

### Multi-Member Families
- Leave empty cells for families with fewer than 3 members
- Each member will be displayed individually in the banner
- Members from the same family will be grouped together in the display

### Import Steps
1. Click "Import CSV" in the Control Panel
2. Select your CSV file
3. The application will automatically parse and display the imported data
4. Review the imported members in the member list
5. Make any necessary edits using the "Edit" button

## Adding Members Manually

1. Click "Add Member" in the Control Panel
2. Fill in the member information:
   - **Name**: Required field
   - **Age**: Optional
   - **Special Needs**: Optional
   - **Notes**: Optional
3. Click "Save" to add the member to the list

## Managing Members

### Editing Members
1. Select a member from the list
2. Click "Edit" to modify their information
3. Make your changes and click "Save"

### Removing Members
1. Select a member from the list
2. Click "Remove" to delete them from the list

### Reordering Members
- Use the up/down arrows to change the display order
- Members at the top of the list will appear first in the banner displays

## Display Configuration

### Banner Settings
- **Banner 1**: Primary display (always active)
- **Banner 2**: Secondary display (can be disabled)
- **Display Selection**: Choose which monitor each banner appears on

### Display Options
- **Enable/Disable Banner 2**: Toggle the second banner on or off
- **Display Selection**: Select which monitor to use for each banner
- **Auto-detect Displays**: Automatically detect available monitors

## Using the Banner Displays

### Starting the Displays
1. Configure your display settings
2. Click "Start Banner 1" to launch the primary display
3. Click "Start Banner 2" to launch the secondary display (if enabled)

### Display Features
- **Automatic Cycling**: Names cycle through automatically
- **Manual Control**: Use the control panel to advance names manually
- **Slideshow Mode**: Continuous automatic cycling
- **Pause/Resume**: Control the display timing

### Display Controls
- **Next**: Advance to the next name
- **Previous**: Go back to the previous name
- **Slideshow**: Start automatic cycling
- **Pause**: Stop automatic cycling
- **Reset**: Return to the first name

## Tips for Best Results

### CSV Preparation
- Use a spreadsheet program like Excel or Google Sheets
- Save as CSV format
- Ensure the first row contains column headers
- Check for any special characters that might cause issues

### Display Setup
- Test your display configuration before the event
- Ensure both monitors are connected and recognized
- Position the banner windows where they're easily visible
- Consider the viewing distance when setting up displays

### Event Management
- Import your member list well before the event
- Test the display functionality with your actual data
- Have a backup plan in case of technical issues
- Consider printing a backup list of names

## Troubleshooting

### Common Issues

**Display not showing on correct monitor:**
- Check your display settings in the Control Panel
- Ensure the target monitor is connected and active
- Try restarting the application

**CSV import errors:**
- Verify your CSV format matches the required structure
- Check for special characters or formatting issues
- Ensure the file is saved as CSV format

**Application not responding:**
- Close and restart the application
- Check if other applications are using the same ports
- Ensure you have sufficient system resources

### Getting Help
If you encounter issues not covered in this guide:
1. Check the application logs for error messages
2. Restart the application
3. Contact technical support with specific error details

## Keyboard Shortcuts

- **Spacebar**: Advance to next name (when banner is active)
- **Escape**: Close banner displays
- **Ctrl+N**: Add new member
- **Ctrl+E**: Edit selected member
- **Delete**: Remove selected member

## Data Management

### Saving Your Work
- Member data is automatically saved as you make changes
- No manual save is required
- Data persists between application sessions

### Exporting Data
- Currently, the application focuses on display functionality
- Keep your original CSV file as a backup
- Consider taking screenshots of important displays

---

*This guide covers the basic functionality of the Joyride Event Display Application. For technical support or feature requests, please contact the development team.* 