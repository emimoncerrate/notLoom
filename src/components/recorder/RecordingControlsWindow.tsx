import React, { useEffect, useRef } from 'react';

interface RecordingControlsWindowProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  onStop: () => void;
  onPause?: () => void;
  onResume?: () => void;
  microphoneStream?: MediaStream | null;
}

const RecordingControlsWindow: React.FC<RecordingControlsWindowProps> = ({
  isRecording,
  isPaused,
  recordingTime,
  onStop,
  onPause,
  onResume,
  microphoneStream
}) => {
  const popupRef = useRef<Window | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Create popup window when recording starts
  useEffect(() => {
    if (isRecording && !popupRef.current) {
      const popup = window.open(
        '',
        'recordingControls',
        'width=300,height=150,top=50,left=50,alwaysRaised=yes,resizable=no,scrollbars=no,menubar=no,toolbar=no,location=no,status=no'
      );

      if (popup) {
        popupRef.current = popup;
        
        // Style the popup window
        popup.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>🔴 Recording Controls</title>
            <style>
              body {
                margin: 0;
                padding: 15px;
                font-family: system-ui, -apple-system, sans-serif;
                background: linear-gradient(135deg, #1e1e1e, #2d2d2d);
                color: white;
                display: flex;
                flex-direction: column;
                gap: 10px;
                min-height: 120px;
                box-sizing: border-box;
              }
              
              .header {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 8px;
              }
              
              .recording-dot {
                width: 8px;
                height: 8px;
                background: #ff4444;
                border-radius: 50%;
                animation: pulse 1.5s infinite;
              }
              
              .paused-dot {
                background: #ffa500;
                animation: none;
              }
              
              .controls {
                display: flex;
                gap: 10px;
                align-items: center;
              }
              
              .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-weight: bold;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
              }
              
              .btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              }
              
              .pause-btn {
                background: #ffa500;
                color: white;
              }
              
              .resume-btn {
                background: #28a745;
                color: white;
              }
              
              .stop-btn {
                background: #ff4444;
                color: white;
              }
              
              .mic-level {
                margin-top: 8px;
                padding: 8px;
                background: rgba(255,255,255,0.1);
                border-radius: 4px;
                font-size: 11px;
              }
              
              .time {
                font-size: 16px;
                font-weight: bold;
                color: #00ff88;
              }
              
              .paused-text {
                color: #ffa500;
                font-size: 11px;
                font-weight: bold;
              }
              
              @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.3; }
                100% { opacity: 1; }
              }
              
              .hotkeys {
                margin-top: auto;
                font-size: 10px;
                opacity: 0.7;
                line-height: 1.2;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div id="recordingDot" class="recording-dot"></div>
              <span>Recording</span>
              <span id="timeDisplay" class="time">00:00</span>
              <span id="pausedText" class="paused-text" style="display: none;">PAUSED</span>
            </div>
            
            <div class="controls">
              <button id="pauseBtn" class="btn pause-btn">⏸ Pause</button>
              <button id="stopBtn" class="btn stop-btn">⏹ Stop</button>
            </div>
            
            <div id="micLevel" class="mic-level" style="display: none;">
              🎤 Microphone Active
            </div>
            
            <div class="hotkeys">
              Ctrl+Space: Pause/Resume<br>
              Ctrl+Q: Stop Recording
            </div>
          </body>
          </html>
        `);

        popup.document.close();

        // Add event listeners to popup buttons
        const pauseBtn = popup.document.getElementById('pauseBtn');
        const stopBtn = popup.document.getElementById('stopBtn');

        if (pauseBtn) {
          pauseBtn.addEventListener('click', () => {
            if (isPaused && onResume) {
              onResume();
            } else if (!isPaused && onPause) {
              onPause();
            }
          });
        }

        if (stopBtn) {
          stopBtn.addEventListener('click', onStop);
        }

        // Add keyboard shortcuts to popup
        popup.document.addEventListener('keydown', (e) => {
          if (e.ctrlKey && e.key === 'q') {
            e.preventDefault();
            onStop();
          } else if (e.key === ' ' && e.ctrlKey) {
            e.preventDefault();
            if (isPaused && onResume) {
              onResume();
            } else if (!isPaused && onPause) {
              onPause();
            }
          }
        });

        // Focus the popup
        popup.focus();

        // Handle popup close
        popup.addEventListener('beforeunload', () => {
          popupRef.current = null;
        });
      }
    }

    // Update popup content when state changes
    if (popupRef.current && !popupRef.current.closed) {
      const timeDisplay = popupRef.current.document.getElementById('timeDisplay');
      const pausedText = popupRef.current.document.getElementById('pausedText');
      const recordingDot = popupRef.current.document.getElementById('recordingDot');
      const pauseBtn = popupRef.current.document.getElementById('pauseBtn');
      const micLevel = popupRef.current.document.getElementById('micLevel');

      if (timeDisplay) {
        timeDisplay.textContent = formatTime(recordingTime);
      }

      if (pausedText) {
        pausedText.style.display = isPaused ? 'block' : 'none';
      }

      if (recordingDot) {
        recordingDot.className = isPaused ? 'recording-dot paused-dot' : 'recording-dot';
      }

      if (pauseBtn) {
        pauseBtn.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
        pauseBtn.className = isPaused ? 'btn resume-btn' : 'btn pause-btn';
      }

      if (micLevel) {
        micLevel.style.display = microphoneStream ? 'block' : 'none';
      }
    }

    // Close popup when recording stops
    if (!isRecording && popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
      popupRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, isPaused, recordingTime, microphoneStream, onStop, onPause, onResume]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  return null; // This component doesn't render anything in the main window
};

export default RecordingControlsWindow;