# Setting Up JoyRide Icons

## Current Status
We have successfully downloaded the JoyRide icons from your website, but they need to be converted to ICO format for Windows to display them properly.

## Files We Have
- `app-icon-512.png` (66KB) - JoyRide metal logo - **Perfect for app icon!**
- `joyride-favicon-192.webp` (12KB) - High-res favicon - **Perfect for favicon!**
- `joyride-favicon-180.webp` (11KB) - Apple touch icon size
- `joyride-favicon-32.webp` (1KB) - Small favicon

## Required Files
To make the icons work in Windows, we need:
1. `app-icon.ico` - For Windows application icon (taskbar, file explorer)
2. `favicon.ico` - For browser favicon

## Conversion Steps

### Option 1: Online Converter (Recommended)
1. **For app-icon.ico:**
   - Go to https://convertio.co/png-ico/
   - Upload `app-icon-512.png`
   - Download as `app-icon.ico`
   - Place in `src/assets/icons/`

2. **For favicon.ico:**
   - Go to https://convertio.co/webp-ico/
   - Upload `joyride-favicon-192.webp`
   - Download as `favicon.ico`
   - Place in `src/assets/icons/`

### Option 2: Use Image Editing Software
1. Open the PNG/WebP files in GIMP, Photoshop, or similar
2. Export as ICO with multiple sizes (16x16, 32x32, 48x48, 64x64, 128x128, 256x256)
3. Save as `app-icon.ico` and `favicon.ico`

### Option 3: Command Line (if you have ImageMagick)
```bash
# Convert PNG to ICO
magick app-icon-512.png -define icon:auto-resize=256,128,64,48,32,16 app-icon.ico

# Convert WebP to ICO
magick joyride-favicon-192.webp -define icon:auto-resize=256,128,64,48,32,16 favicon.ico
```

## After Conversion
1. Place both ICO files in `src/assets/icons/`
2. Restart the app: `npm start`
3. The JoyRide branding should now appear in:
   - Taskbar icon
   - Window title bars
   - File explorer
   - Browser tabs

## Testing
Once you have the ICO files, the app will automatically use them. You should see:
- JoyRide logo in the taskbar
- JoyRide favicon in browser tabs
- JoyRide branding throughout the app

## Fallback
If ICO conversion doesn't work immediately, the app will fall back to using the PNG file, but Windows may not display it properly in all contexts. 