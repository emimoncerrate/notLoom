// Content script for Screen Recorder Extension
console.log('🎬 Screen Recorder content script loaded');

// Prevent multiple content script instances
if (window.screenRecorderExtensionLoaded) {
  console.log('⚠️ Screen Recorder content script already loaded, skipping...');
} else {
  window.screenRecorderExtensionLoaded = true;

// Global state
let mediaRecorder = null;
let recordedChunks = [];
let recordingStream = null;
let microphoneStream = null;
let isRecording = false;
let isPaused = false;
let startTime = null;
let controlsContainer = null;
let volumeCanvas = null;
let volumeContext = null;
let volumeAnalyzer = null;
let volumeUpdateInterval = null;

// Prevent multiple recording instances
let recordingInitiated = false;
const EXTENSION_ID = 'screen-recorder-' + Math.random().toString(36).substr(2, 9);

// Message listener for extension popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  switch (message.action) {
    case 'START_RECORDING':
      // Prevent multiple instances from starting recording
      if (recordingInitiated || isRecording) {
        console.log('⚠️ Recording already initiated or in progress, ignoring duplicate request');
        sendResponse({ success: false, error: 'Recording already in progress' });
        return true;
      }
      
      recordingInitiated = true;
      startRecording(message.options)
        .then(result => {
          sendResponse(result);
          if (!result.success) {
            recordingInitiated = false; // Reset on failure
          }
        })
        .catch(error => {
          recordingInitiated = false; // Reset on error
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open

    case 'STOP_RECORDING':
      stopRecording()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'PING':
      sendResponse({ success: true, message: 'Content script ready' });
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Listen for messages from the PursuitShipped web app
window.addEventListener('message', (event) => {
  // Only accept messages from same origin for security
  if (event.origin !== window.location.origin) return;
  
  if (event.data && event.data.type === 'PURSUITSHIPPED_EXTENSION') {
    console.log('🎬 Received message from PursuitShipped web app:', event.data);
    
    switch (event.data.action) {
      case 'START_RECORDING':
        // Prevent multiple instances from starting recording
        if (recordingInitiated || isRecording) {
          console.log('⚠️ Recording already initiated or in progress, ignoring duplicate request');
          window.postMessage({
            type: 'PURSUITSHIPPED_EXTENSION_RESPONSE',
            action: 'START_RECORDING',
            success: false,
            error: 'Recording already in progress'
          }, window.location.origin);
          return;
        }
        
        recordingInitiated = true;
        startRecording(event.data.options || {})
          .then(result => {
            // Send response back to web app
            window.postMessage({
              type: 'PURSUITSHIPPED_EXTENSION_RESPONSE',
              action: 'START_RECORDING',
              success: result.success,
              error: result.error
            }, window.location.origin);
            
            if (!result.success) {
              recordingInitiated = false; // Reset on failure
            }
          })
          .catch(error => {
            recordingInitiated = false; // Reset on error
            window.postMessage({
              type: 'PURSUITSHIPPED_EXTENSION_RESPONSE', 
              action: 'START_RECORDING',
              success: false,
              error: error.message
            }, window.location.origin);
          });
        break;
        
      case 'STOP_RECORDING':
        stopRecording()
          .then(result => {
            window.postMessage({
              type: 'PURSUITSHIPPED_EXTENSION_RESPONSE',
              action: 'STOP_RECORDING', 
              success: result.success,
              error: result.error
            }, window.location.origin);
          })
          .catch(error => {
            window.postMessage({
              type: 'PURSUITSHIPPED_EXTENSION_RESPONSE',
              action: 'STOP_RECORDING',
              success: false,
              error: error.message
            }, window.location.origin);
          });
        break;
        
      case 'GET_STATUS':
        window.postMessage({
          type: 'PURSUITSHIPPED_EXTENSION_RESPONSE',
          action: 'GET_STATUS',
          success: true,
          data: {
            isRecording,
            isPaused,
            startTime,
            available: true
          }
        }, window.location.origin);
        break;
    }
  }
});

async function startRecording(options = {}) {
  try {
    console.log('🎬 Starting recording with options:', options);

    // Clean up any existing recording
    await cleanupRecording();

    // Get screen capture
    console.log('📺 Requesting screen capture...');
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        mediaSource: 'screen',
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        frameRate: { ideal: 30, max: 60 }
      },
      audio: options.includeSystemAudio || false
    });

    console.log('✅ Got display stream:', displayStream);

    // Listen for when the user switches to the recorded tab to show controls there
    displayStream.getVideoTracks()[0].addEventListener('ended', () => {
      console.log('🛑 Screen capture ended (user stopped sharing)');
      stopRecording();
    });

    // Combine with microphone if requested
    let finalStream = displayStream;
    
    if (options.includeMicrophone) {
      try {
        console.log('🎤 Requesting microphone access...');
        microphoneStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        });

        console.log('✅ Got microphone stream:', microphoneStream);

        // Create a new MediaStream with all tracks
        const videoTracks = displayStream.getVideoTracks();
        const displayAudioTracks = displayStream.getAudioTracks();
        const micAudioTracks = microphoneStream.getAudioTracks();

        finalStream = new MediaStream([
          ...videoTracks,
          ...displayAudioTracks,
          ...micAudioTracks
        ]);

        // Setup volume analyzer for microphone
        setupVolumeAnalyzer(microphoneStream);

      } catch (micError) {
        console.warn('⚠️ Microphone access failed:', micError);
        // Continue with just screen recording
      }
    }

    // Validate final stream
    if (!finalStream || finalStream.getTracks().length === 0) {
      throw new Error('No media tracks available for recording');
    }

    console.log('🔀 Final stream tracks:', finalStream.getTracks().map(t => ({ 
      kind: t.kind, 
      label: t.label, 
      state: t.readyState 
    })));

    // Setup MediaRecorder with fallback options
    const mimeTypes = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];

    let selectedMimeType = null;
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    const recorderOptions = {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 2500000, // 2.5 Mbps
      audioBitsPerSecond: 128000   // 128 kbps
    };

    console.log('🎥 Creating MediaRecorder with options:', recorderOptions);

    // Stop any existing MediaRecorder
    if (mediaRecorder) {
      try {
        if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
          mediaRecorder.stop();
        }
      } catch (e) {
        console.warn('Error stopping existing MediaRecorder:', e);
      }
      mediaRecorder = null;
    }

    // Create fresh MediaRecorder
    mediaRecorder = new MediaRecorder(finalStream, recorderOptions);
    recordedChunks = [];
    recordingStream = finalStream;

    console.log('📊 MediaRecorder created with state:', mediaRecorder.state);

    // Setup MediaRecorder event handlers
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
        console.log('📊 Data chunk received:', event.data.size, 'bytes');
      }
    };

    mediaRecorder.onstop = async () => {
      console.log('⏹️ MediaRecorder stopped, saving video...');
      await saveRecording();
    };

    mediaRecorder.onerror = (event) => {
      console.error('❌ MediaRecorder error:', event.error);
    };

    mediaRecorder.onstart = () => {
      console.log('✅ MediaRecorder started successfully');
    };

    mediaRecorder.onpause = () => {
      console.log('⏸️ MediaRecorder paused');
    };

    mediaRecorder.onresume = () => {
      console.log('▶️ MediaRecorder resumed');
    };

    // Start recording
    console.log('▶️ Starting MediaRecorder...');
    
    // Ensure MediaRecorder is in correct state before starting
    if (mediaRecorder.state !== 'inactive') {
      console.warn('⚠️ MediaRecorder not in inactive state, recreating...');
      mediaRecorder = new MediaRecorder(finalStream, recorderOptions);
    }
    
    try {
      mediaRecorder.start(1000); // Collect data every second
      console.log('✅ MediaRecorder.start() called successfully');
      
      // Wait a moment to verify state change
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('📊 MediaRecorder state after start:', mediaRecorder.state);
      
    } catch (startError) {
      console.error('❌ Error calling MediaRecorder.start():', startError);
      throw new Error(`Failed to start MediaRecorder: ${startError.message}`);
    }

    // Update state
    isRecording = true;
    isPaused = false;
    startTime = Date.now();

    // Show floating controls
    createFloatingControls();

    // Notify background script that recording started
    try {
      chrome.runtime.sendMessage({ 
        action: 'RECORDING_STARTED',
        tabId: window.location.href 
      });
    } catch (e) {
      console.log('Note: Could not notify background script');
    }

    console.log('✅ Recording started successfully!');
    return { success: true };

  } catch (error) {
    console.error('❌ Failed to start recording:', error);
    await cleanupRecording();
    return { success: false, error: error.message };
  }
}

async function stopRecording() {
  try {
    console.log('⏹️ Stopping recording...');

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }

    // Wait for the stop event to complete
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      await new Promise((resolve) => {
        mediaRecorder.addEventListener('stop', resolve, { once: true });
      });
    }

    await cleanupRecording();
    
    // Reset recording initiation flag
    recordingInitiated = false;

    // Notify popup
    chrome.runtime.sendMessage({ action: 'RECORDING_STOPPED' });

    console.log('✅ Recording stopped successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ Error stopping recording:', error);
    await cleanupRecording();
    recordingInitiated = false; // Reset flag on error too
    return { success: false, error: error.message };
  }
}

async function pauseResumeRecording() {
  try {
    if (!mediaRecorder || !isRecording) return;

    if (isPaused) {
      mediaRecorder.resume();
      isPaused = false;
      updateControlsUI();
      console.log('▶️ Recording resumed');
    } else {
      mediaRecorder.pause();
      isPaused = true;
      updateControlsUI();
      console.log('⏸️ Recording paused');
    }
  } catch (error) {
    console.error('❌ Error pausing/resuming recording:', error);
  }
}

async function cleanupRecording() {
  console.log('🧹 Cleaning up recording resources...');

  // Clear volume monitoring
  if (volumeUpdateInterval) {
    clearInterval(volumeUpdateInterval);
    volumeUpdateInterval = null;
  }

  // Stop MediaRecorder if active
  if (mediaRecorder) {
    if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
      try {
        mediaRecorder.stop();
      } catch (e) {
        console.warn('Error stopping MediaRecorder:', e);
      }
    }
    mediaRecorder = null;
  }

  // Stop all media tracks
  if (recordingStream) {
    recordingStream.getTracks().forEach(track => {
      track.stop();
      console.log(`🛑 Stopped ${track.kind} track`);
    });
    recordingStream = null;
  }

  if (microphoneStream) {
    microphoneStream.getTracks().forEach(track => {
      track.stop();
      console.log(`🛑 Stopped microphone track`);
    });
    microphoneStream = null;
  }

  // Reset state
  isRecording = false;
  isPaused = false;
  startTime = null;
  recordedChunks = [];
  volumeAnalyzer = null;
  volumeContext = null;

  // Remove floating controls
  removeFloatingControls();

  console.log('✅ Cleanup completed');
}

async function saveRecording() {
  try {
    if (recordedChunks.length === 0) {
      console.warn('⚠️ No recorded data to save');
      return;
    }

    console.log('💾 Saving recording with', recordedChunks.length, 'chunks');

    // Create blob from recorded chunks
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    
    // Try to send to PursuitShipped web app first
    const savedToPursuitShipped = await saveToPursuitShippedApp(blob);
    
    if (!savedToPursuitShipped) {
      // Fallback: download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screen-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Recording downloaded as fallback');
    }

  } catch (error) {
    console.error('❌ Error saving recording:', error);
  }
}

async function saveToPursuitShippedApp(videoBlob) {
  try {
    console.log('🎯 Attempting to save to PursuitShipped web app...');
    
    // Check if we're on a PursuitShipped domain
    const isPursuitShippedSite = window.location.hostname.includes('pursuitshipped') || 
                                 window.location.hostname.includes('localhost') ||
                                 window.location.hostname.includes('127.0.0.1');
    
    if (!isPursuitShippedSite) {
      console.log('📍 Not on PursuitShipped site, will download instead');
      return false;
    }

    // Create recording metadata
    const recordingData = {
      id: `ext_rec_${Date.now()}`,
      title: `Screen Recording ${new Date().toLocaleString()}`,
      url: URL.createObjectURL(videoBlob),
      timestamp: new Date().toISOString(),
      mode: 'extension-recording',
      duration: Math.floor((Date.now() - startTime) / 1000),
      size: videoBlob.size,
      source: 'chrome-extension'
    };

    // Try to communicate with the web app
    if (window.PursuitShipped && window.PursuitShipped.addRecording) {
      // Direct integration if available
      await window.PursuitShipped.addRecording(recordingData, videoBlob);
      console.log('✅ Recording saved directly to PursuitShipped app');
      return true;
    }

    // Fallback: Use localStorage (same method as web app)
    const existingRecordings = JSON.parse(localStorage.getItem('pursuitshipped_recordings') || '[]');
    existingRecordings.unshift(recordingData);
    
    // Keep only last 50 recordings
    if (existingRecordings.length > 50) {
      existingRecordings.splice(50);
    }
    
    localStorage.setItem('pursuitshipped_recordings', JSON.stringify(existingRecordings));
    localStorage.setItem('lastRecording', recordingData.url);

    // Dispatch custom event to notify the web app
    window.dispatchEvent(new CustomEvent('pursuitshipped:new-recording', {
      detail: recordingData
    }));

    console.log('✅ Recording saved to PursuitShipped library via localStorage');
    
    // Show success notification
    showSuccessNotification('Recording saved to PursuitShipped library!');
    
    return true;

  } catch (error) {
    console.error('❌ Failed to save to PursuitShipped app:', error);
    return false;
  }
}

function showSuccessNotification(message) {
  // Create a temporary success notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 2147483647;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideInFromRight 0.3s ease-out;
  `;
  
  notification.textContent = `✅ ${message}`;
  document.body.appendChild(notification);
  
  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutToRight 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

function setupVolumeAnalyzer(audioStream) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    volumeAnalyzer = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(audioStream);
    
    volumeAnalyzer.fftSize = 256;
    volumeAnalyzer.smoothingTimeConstant = 0.8;
    source.connect(volumeAnalyzer);

    console.log('✅ Volume analyzer setup complete');
  } catch (error) {
    console.warn('⚠️ Failed to setup volume analyzer:', error);
  }
}

function createFloatingControls() {
  // Remove existing controls
  removeFloatingControls();

  console.log('🎮 Creating floating controls...');

  // Inject CSS if not already present
  if (!document.getElementById('screen-recorder-css')) {
    const cssLink = document.createElement('link');
    cssLink.id = 'screen-recorder-css';
    cssLink.rel = 'stylesheet';
    cssLink.href = chrome.runtime.getURL('floating-controls.css');
    document.head.appendChild(cssLink);
    console.log('📝 Injected floating controls CSS');
  }

  // Create container
  controlsContainer = document.createElement('div');
  controlsContainer.id = 'screen-recorder-controls';
  controlsContainer.className = 'screen-recorder-floating-controls';
  
  // Add critical inline styles as fallback
  controlsContainer.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    z-index: 2147483647 !important;
    background: rgba(0, 0, 0, 0.9) !important;
    backdrop-filter: blur(10px) !important;
    border-radius: 12px !important;
    padding: 12px !important;
    min-width: 200px !important;
    color: white !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 12px !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    user-select: none !important;
    cursor: default !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  `;

  // Create controls HTML
  controlsContainer.innerHTML = `
    <div class="controls-header">
      <div class="recording-indicator">
        <div class="rec-dot"></div>
        <span>REC</span>
      </div>
      <div class="timer" id="recording-timer">00:00</div>
    </div>
    
    <div class="controls-body">
      <button class="control-btn pause-btn" id="pause-resume-btn" title="Pause/Resume">
        <span class="pause-icon">⏸️</span>
        <span class="resume-icon" style="display: none;">▶️</span>
      </button>
      
      <div class="volume-indicator" id="volume-indicator">
        <canvas id="volume-canvas" width="60" height="20"></canvas>
        <span class="volume-label">🎤</span>
      </div>
      
      <button class="control-btn stop-btn" id="stop-btn" title="Stop Recording">
        ⏹️
      </button>
    </div>
    
    <div class="drag-handle" id="drag-handle">⋮⋮</div>
  `;

  // Add to page
  document.body.appendChild(controlsContainer);
  console.log('📍 Floating controls added to page:', controlsContainer);

  // Setup canvas for volume visualization
  volumeCanvas = document.getElementById('volume-canvas');
  if (volumeCanvas) {
    volumeContext = volumeCanvas.getContext('2d');
  }

  // Setup event handlers
  setupControlsEventHandlers();

  // Start timer and volume monitoring
  startTimer();
  startVolumeMonitoring();

  // Make draggable
  makeDraggable();

  console.log('✅ Floating controls created');
  
  // Force visibility and debugging
  setTimeout(() => {
    if (controlsContainer) {
      controlsContainer.style.display = 'block !important';
      controlsContainer.style.visibility = 'visible !important';
      controlsContainer.style.opacity = '1 !important';
      console.log('🔍 Controls visibility check:', {
        display: controlsContainer.style.display,
        visibility: controlsContainer.style.visibility,
        opacity: controlsContainer.style.opacity,
        position: controlsContainer.getBoundingClientRect()
      });
    }
  }, 500);
}

function setupControlsEventHandlers() {
  const pauseResumeBtn = document.getElementById('pause-resume-btn');
  const stopBtn = document.getElementById('stop-btn');

  if (pauseResumeBtn) {
    pauseResumeBtn.addEventListener('click', pauseResumeRecording);
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', stopRecording);
  }
}

function updateControlsUI() {
  const pauseIcon = controlsContainer?.querySelector('.pause-icon');
  const resumeIcon = controlsContainer?.querySelector('.resume-icon');

  if (pauseIcon && resumeIcon) {
    if (isPaused) {
      pauseIcon.style.display = 'none';
      resumeIcon.style.display = 'inline';
    } else {
      pauseIcon.style.display = 'inline';
      resumeIcon.style.display = 'none';
    }
  }
}

function startTimer() {
  const timerElement = document.getElementById('recording-timer');
  if (!timerElement) return;

  const updateTimer = () => {
    if (!isRecording || !startTime) return;

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update immediately and then every second
  updateTimer();
  const interval = setInterval(() => {
    if (isRecording) {
      updateTimer();
    } else {
      clearInterval(interval);
    }
  }, 1000);
}

function startVolumeMonitoring() {
  if (!volumeAnalyzer || !volumeContext) return;

  const bufferLength = volumeAnalyzer.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  volumeUpdateInterval = setInterval(() => {
    if (!volumeAnalyzer || !volumeContext) return;

    volumeAnalyzer.getByteFrequencyData(dataArray);

    // Calculate volume level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const volume = sum / bufferLength / 255; // Normalize to 0-1

    // Draw volume bar
    drawVolumeBar(volume);
  }, 100); // Update 10 times per second
}

function drawVolumeBar(volume) {
  if (!volumeContext || !volumeCanvas) return;

  const { width, height } = volumeCanvas;
  
  // Clear canvas
  volumeContext.clearRect(0, 0, width, height);

  // Draw background
  volumeContext.fillStyle = '#e5e7eb';
  volumeContext.fillRect(0, 0, width, height);

  // Draw volume level
  const volumeWidth = width * volume;
  const gradient = volumeContext.createLinearGradient(0, 0, width, 0);
  
  if (volume > 0.8) {
    gradient.addColorStop(0, '#10b981'); // Green
    gradient.addColorStop(0.7, '#f59e0b'); // Yellow
    gradient.addColorStop(1, '#ef4444'); // Red
  } else if (volume > 0.5) {
    gradient.addColorStop(0, '#10b981'); // Green
    gradient.addColorStop(1, '#f59e0b'); // Yellow
  } else {
    gradient.addColorStop(0, '#10b981'); // Green
    gradient.addColorStop(1, '#10b981'); // Green
  }

  volumeContext.fillStyle = gradient;
  volumeContext.fillRect(0, 0, volumeWidth, height);
}

function makeDraggable() {
  const dragHandle = document.getElementById('drag-handle');
  if (!dragHandle || !controlsContainer) return;

  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = controlsContainer.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    dragHandle.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;

    // Keep within viewport bounds
    const maxX = window.innerWidth - controlsContainer.offsetWidth;
    const maxY = window.innerHeight - controlsContainer.offsetHeight;

    controlsContainer.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    controlsContainer.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    controlsContainer.style.right = 'auto';
    controlsContainer.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      dragHandle.style.cursor = 'grab';
    }
  });
}

function removeFloatingControls() {
  if (controlsContainer) {
    controlsContainer.remove();
    controlsContainer = null;
  }
  
  volumeCanvas = null;
  volumeContext = null;
  
  if (volumeUpdateInterval) {
    clearInterval(volumeUpdateInterval);
    volumeUpdateInterval = null;
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  cleanupRecording();
});

console.log('✅ Screen Recorder content script ready');

} // End of else block - only run if not already loaded