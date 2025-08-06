// Popup script for Screen Recorder Extension
let isRecording = false;

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startRecording');
  const micCheckbox = document.getElementById('includeMicrophone');
  const systemAudioCheckbox = document.getElementById('includeSystemAudio');
  const status = document.getElementById('status');

  startBtn.addEventListener('click', async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  });

  async function startRecording() {
    try {
      startBtn.disabled = true;
      startBtn.textContent = 'Starting...';
      showStatus('Initializing screen capture...', 'success');

      // Get the current active tab only
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Check if it's a valid tab for injection
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        throw new Error('Cannot record on Chrome system pages. Please navigate to a regular website.');
      }

      console.log(`🔧 Injecting content script into current tab: ${tab.title}`);

      // Inject the content script into current tab only
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Inject the CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['floating-controls.css']
      });

      // Wait for injection to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Start recording in current tab
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'START_RECORDING',
        options: {
          includeMicrophone: micCheckbox.checked,
          includeSystemAudio: systemAudioCheckbox.checked
        }
      });

      if (response?.success) {
        isRecording = true;
        startBtn.textContent = '🔴 Recording...';
        startBtn.disabled = false;
        showStatus('Recording started! Use floating controls to stop.', 'success');
        
        // Auto-close popup after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        throw new Error(response?.error || 'Failed to start recording');
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      showStatus(`Error: ${error.message}`, 'error');
      startBtn.textContent = '🎬 Start Recording';
      startBtn.disabled = false;
      isRecording = false;
    }
  }

  async function stopRecording() {
    try {
      startBtn.disabled = true;
      showStatus('Stopping recording...', 'success');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, { action: 'STOP_RECORDING' });
      }

      isRecording = false;
      startBtn.textContent = '🎬 Start Recording';
      startBtn.disabled = false;
      showStatus('Recording stopped', 'success');

    } catch (error) {
      console.error('Error stopping recording:', error);
      showStatus(`Error stopping: ${error.message}`, 'error');
      startBtn.disabled = false;
    }
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    if (type === 'success') {
      setTimeout(() => {
        status.style.display = 'none';
      }, 3000);
    }
  }

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'RECORDING_STOPPED') {
      isRecording = false;
      startBtn.textContent = '🎬 Start Recording';
      startBtn.disabled = false;
      showStatus('Recording stopped and saved', 'success');
    }
  });
});