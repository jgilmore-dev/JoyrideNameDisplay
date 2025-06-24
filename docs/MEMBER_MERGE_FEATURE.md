# Member Merge Feature

## Overview

The Member Merge feature allows you to display multiple members together on a single banner, with their names arranged on separate lines. This is particularly useful for cases where members with different last names need to be displayed as a group, such as:

- Family members with different last names
- Couples who haven't taken the same surname
- Group presentations or awards
- Special event announcements

## How It Works

### Basic Concept
When you merge members, their names are displayed in this format:
```
First Name 1
First Name 2
First Name 3

Last Name 1
Last Name 2
Last Name 3
```

### Features
- **Multi-selection**: Click on multiple members to select them for merging
- **Live Preview**: See exactly how the merged display will look before showing it
- **Queue Support**: Add merged displays to the queue system
- **Status Tracking**: All selected members are marked as displayed when shown
- **Responsive Design**: Works on all banner sizes and orientations

## Using the Merge Feature

### Step 1: Enable Merge Mode
1. In the Member Management section, click the **"🔗 Enable Merge Mode"** button
2. The interface will change to show the merge selection interface

### Step 2: Select Members
1. Click on the members you want to merge together
2. Selected members will be highlighted in green
3. You can select any number of members (recommended: 2-4 for readability)

### Step 3: Preview the Display
1. As you select members, a live preview will show exactly how they'll appear
2. The preview uses the same styling as the actual banner display
3. Review the preview to ensure the names are formatted correctly

### Step 4: Display or Queue
1. **Direct Display**: Click "Display on Banner X" to show immediately
2. **Queue**: Click "Queue for Banner X" to add to the queue system
3. All selected members will be marked as displayed

### Step 5: Exit Merge Mode
1. Click "Exit Merge Mode" to return to normal member management
2. Or click "Clear Selection" to start over

## Interface Elements

### Merge Mode Button
- **Location**: Member Management section
- **Appearance**: Green button with link icon
- **Function**: Toggles merge mode on/off

### Selection Controls
- **Selected Count**: Shows how many members are currently selected
- **Clear Selection**: Removes all selected members
- **Exit Merge Mode**: Returns to normal interface

### Preview Display
- **Background**: Black background matching banner display
- **Font**: Same font family as banner display
- **Colors**: Uses current font color setting
- **Layout**: Shows first names on top, last names below

### Action Buttons
- **Display on Banner X**: Blue button for immediate display
- **Queue for Banner X**: Purple button for queue addition

### Member List
- **Checkboxes**: Click to select/deselect members
- **Row Highlighting**: Selected rows are highlighted in green
- **Status Indicators**: Shows if members have been displayed before
- **Clickable Rows**: Click anywhere on a row to select it

## Technical Details

### Data Structure
Merged displays use the same data structure as individual members:
```javascript
{
  firstLine: "John\nSarah\nDavid",
  secondLine: "Smith\nJohnson\nWilliams",
  isMerged: true,
  memberIds: [1, 2, 3]
}
```

### Display Formatting
- **Line Breaks**: Uses `\n` for line separation
- **CSS**: `white-space: pre-line` preserves line breaks
- **Font Sizing**: Automatically adjusts to fit content
- **Alignment**: Center-aligned for optimal visibility

### Queue Integration
- Merged displays work seamlessly with the queue system
- Can be moved between banners using queue management
- Maintains merge information in queue entries

## Best Practices

### Selection Guidelines
- **Optimal Count**: 2-4 members for best readability
- **Name Length**: Consider total character count for font sizing
- **Grouping**: Select related members (families, couples, etc.)

### Display Considerations
- **Font Size**: Longer names may result in smaller font sizes
- **Screen Space**: Ensure adequate vertical space for multiple lines
- **Readability**: Test with actual banner displays when possible

### Workflow Tips
1. **Plan Ahead**: Decide which members to merge before starting
2. **Use Preview**: Always review the preview before displaying
3. **Queue Management**: Use queues for complex multi-banner setups
4. **Clear Selection**: Start fresh for each new merge group

## Use Cases

### Family Displays
- Parents with different last names
- Blended families
- Multi-generational presentations

### Event Announcements
- Award recipients
- Guest speakers
- Special recognition

### Group Presentations
- Team introductions
- Committee members
- Board presentations

### Couple Displays
- Engaged couples
- Wedding announcements
- Anniversary celebrations

## Troubleshooting

### Common Issues

**Font Too Small**
- Reduce the number of selected members
- Check for very long names
- Consider splitting into multiple displays

**Names Not Aligning**
- Ensure all members have complete name data
- Check for missing first or last names
- Verify CSV data format

**Preview Not Updating**
- Click on members again to refresh selection
- Check browser console for errors
- Refresh the page if needed

**Queue Issues**
- Verify banner is enabled and connected
- Check queue management interface
- Ensure proper permissions

### Performance Notes
- Merge mode uses efficient React state management
- Large member lists are handled with virtualization
- Preview updates are optimized for smooth interaction

## Future Enhancements

### Planned Features
- **Custom Formatting**: User-defined name arrangements
- **Template System**: Predefined merge templates
- **Batch Operations**: Merge multiple groups at once
- **Export/Import**: Save and load merge configurations

### Potential Improvements
- **Drag & Drop**: Visual member selection
- **Smart Grouping**: Automatic member suggestions
- **Advanced Preview**: Multiple banner previews
- **Merge History**: Track previous merge combinations

## Support

For issues or questions about the merge feature:
1. Check this documentation first
2. Review the troubleshooting section
3. Test with a small group of members
4. Contact support with specific error details

The merge feature is designed to be intuitive and powerful, providing flexibility for complex display scenarios while maintaining the simplicity of the core system. 