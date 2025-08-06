# Browser Extension Conversion Plan

## Why Perfect for Your Cohort:
- ✅ **Always visible controls** during recording
- ✅ **Works on any webpage** (GitHub, deployed apps, etc.)
- ✅ **Easy install** - just load unpacked extension
- ✅ **No Chrome Web Store** needed for testing
- ✅ **Perfect for web demos** - most coding is browser-based

## Conversion Steps (4-6 hours):

### 1. Add Extension Manifest
```json
{
  "manifest_version": 3,
  "name": "Pursuit Screen Recorder",
  "version": "1.0",
  "permissions": ["tabs", "storage", "desktopCapture"],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }]
}
```

### 2. Overlay UI on Any Page
- Recording controls appear on ALL websites
- Draggable, always visible
- Works on GitHub, localhost, anywhere

### 3. Enhanced Permissions
- Access to Chrome's `desktopCapture` API
- Better screen recording quality
- Cross-tab functionality

### 4. Install for Cohort
1. Zip extension folder
2. Send to cohort
3. Load unpacked in Chrome developer mode
4. One-time setup, works everywhere

## Timeline:
- **Day 1**: Convert existing recorder to extension
- **Result**: Professional-grade tool for cohort