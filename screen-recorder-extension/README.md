# Screen Recorder Chrome Extension

A modern Manifest V3 Chrome extension for screen recording with audio and floating controls.

## Features

- 🎬 **Screen Recording**: Capture your entire screen, specific windows, or browser tabs
- 🎤 **Audio Recording**: Include microphone and system audio
- 🎮 **Floating Controls**: Draggable control bar with pause/resume and stop buttons
- 📊 **Volume Indicator**: Real-time microphone level visualization
- ⚡ **Modern Tech**: Built with Manifest V3, async/await, and clean ES6+ code
- 🛡️ **No Background Script**: Fully in-browser recording without service worker dependencies

## Installation & Testing

### 1. Download the Extension
Clone or download this repository to your local machine.

### 2. Load in Chrome (Icons Included)
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `screen-recorder-extension` folder

### 3. Test the Extension
1. **Navigate to any website** (not chrome:// pages)
2. **Click the extension icon** in the toolbar (🎬)
3. **Configure options**:
   - ✅ Include microphone audio (recommended)
   - ⚪ Include system audio (if supported by browser)
4. **Click "Start Recording"**
5. **Select what to record** in the browser's native screen picker:
   - Entire screen
   - Specific application window
   - Browser tab
6. **Use floating controls**:
   - ⏸️ **Pause/Resume**: Toggle recording
   - 🎤 **Volume indicator**: Shows microphone levels
   - ⏹️ **Stop**: End recording and download video
   - **Drag handle**: Move controls around the screen

### 4. Expected Behavior
- ✅ Popup closes automatically after starting
- ✅ Floating controls appear on the webpage
- ✅ Timer shows recording duration
- ✅ Volume bar shows microphone activity (if enabled)
- ✅ Video downloads as `.webm` file when stopped

## File Structure

```
screen-recorder-extension/
├── manifest.json          # Extension configuration (Manifest V3)
├── popup.html             # Extension popup interface
├── popup.js              # Popup logic and tab injection
├── content.js            # Main recording logic and controls
├── floating-controls.css # Styling for floating controls
└── README.md            # This file
```

## How It Works

### 1. **Popup Script (`popup.js`)**
- Handles user interaction
- Injects content script into active tab
- Sends recording configuration to content script

### 2. **Content Script (`content.js`)**
- Requests screen capture using `getDisplayMedia()`
- Optionally captures microphone with `getUserMedia()`
- Creates and manages `MediaRecorder` instance
- Renders floating controls with volume visualization
- Handles recording state (start/pause/stop)
- Downloads recorded video file

### 3. **State Management**
- Proper cleanup of MediaRecorder and streams
- State validation to prevent "Invalid State" errors
- Graceful error handling with user feedback

## Browser Compatibility

- ✅ **Chrome 88+** (Manifest V3 support)
- ✅ **Edge 88+** (Chromium-based)
- ❌ Firefox (uses different extension format)
- ❌ Safari (uses different extension format)

## Permissions Explained

- `activeTab`: Access to current tab for script injection
- `scripting`: Inject content script and CSS
- `<all_urls>`: Allow recording on any website

## Troubleshooting

### "Cannot record on Chrome system pages"
- Navigate to a regular website (not chrome://, extension pages)
- Try recording from sites like google.com, github.com, etc.

### No floating controls appear
- Check browser console for error messages
- Ensure content script injection succeeded
- Try refreshing the page and recording again

### Recording fails to start
- Grant screen capture permission when prompted
- Check microphone permissions if audio is enabled
- Ensure MediaRecorder is supported in your browser

### No audio in recording
- Verify microphone permissions
- System audio requires specific browser support
- Check volume indicator shows microphone activity

## Development

### Adding Features
1. Modify `content.js` for recording logic
2. Update `popup.html`/`popup.js` for UI changes
3. Adjust `floating-controls.css` for styling
4. Update permissions in `manifest.json` if needed

### Debugging
1. Open DevTools on the webpage (not popup)
2. Check Console tab for content script logs
3. Use `chrome://extensions/` to inspect extension

## Technical Details

- **MediaRecorder API**: For video/audio encoding
- **getDisplayMedia API**: For screen capture
- **getUserMedia API**: For microphone access
- **Web Audio API**: For volume level analysis
- **Canvas API**: For volume visualization
- **File API**: For video download

## License

MIT License - feel free to modify and distribute.