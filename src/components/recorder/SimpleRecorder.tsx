import React, { useState, useRef, useEffect } from 'react';
import { googleDriveService } from '../../services/googleDrive';
import { useAuth } from '../../contexts/AuthContext';
import FloatingStopButton from './FloatingStopButton';
import RecordingControlsWindow from './RecordingControlsWindow';
import MicrophoneErrorDialog from './MicrophoneErrorDialog';
import AudioLevelIndicator from './AudioLevelIndicator';
import MicrophoneTest from './MicrophoneTest';
import { MicrophonePermissionManager, MicrophonePermissionResult } from '../../utils/microphonePermissions';
import { useGlobalHotkeys } from '../../hooks/useGlobalHotkeys';

interface SimpleRecorderProps {
  onRecordingComplete?: (videoBlob: Blob) => void;
}

const SimpleRecorder: React.FC<SimpleRecorderProps> = ({ onRecordingComplete }) => {
  const { getDriveAccessToken } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingMode, setRecordingMode] = useState<'screen' | 'screen+mic' | 'mic-only' | 'silent-screen'>('screen+mic');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<MicrophonePermissionResult | null>(null);
  const [showMicError, setShowMicError] = useState(false);
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef<boolean>(false);

  // Load saved recording from localStorage on component mount
  useEffect(() => {
    const savedRecording = localStorage.getItem('lastRecording');
    if (savedRecording) {
      setRecordedVideoUrl(savedRecording);
    }
  }, []);

  // Chrome Extension Integration
  useEffect(() => {
    const checkExtensionAvailability = () => {
      // Check if Chrome extension is available
      window.postMessage({
        type: 'PURSUITSHIPPED_EXTENSION',
        action: 'GET_STATUS'
      }, window.location.origin);
    };

    const handleExtensionResponse = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data && event.data.type === 'PURSUITSHIPPED_EXTENSION_RESPONSE') {
        console.log('📱 Extension response:', event.data);
        
        switch (event.data.action) {
          case 'START_RECORDING':
            if (event.data.success) {
              setIsRecording(true);
              setError(null);
              console.log('✅ Recording started via extension');
            } else {
              setError(`Extension recording failed: ${event.data.error}`);
            }
            break;
            
          case 'STOP_RECORDING':
            if (event.data.success) {
              setIsRecording(false);
              console.log('✅ Recording stopped via extension');
            }
            break;
            
          case 'GET_STATUS':
            if (event.data.success && event.data.data.available) {
              console.log('✅ Chrome extension is available');
            }
            break;
        }
      }
    };

    window.addEventListener('message', handleExtensionResponse);
    
    // Check extension availability on mount
    setTimeout(checkExtensionAvailability, 500);

    return () => {
      window.removeEventListener('message', handleExtensionResponse);
    };
  }, []);

  // Try to use Chrome Extension for recording
  const tryExtensionRecording = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log('🎬 Attempting to start recording via Chrome extension...');
      
      const timeout = setTimeout(() => {
        console.log('⏰ Extension timeout - falling back to built-in recording');
        resolve(false);
      }, 3000); // 3 second timeout
      
      const handleResponse = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data && event.data.type === 'PURSUITSHIPPED_EXTENSION_RESPONSE' && 
            event.data.action === 'START_RECORDING') {
          clearTimeout(timeout);
          window.removeEventListener('message', handleResponse);
          
          if (event.data.success) {
            console.log('✅ Extension recording started successfully');
            resolve(true);
          } else {
            console.log('❌ Extension recording failed:', event.data.error);
            resolve(false);
          }
        }
      };
      
      window.addEventListener('message', handleResponse);
      
      // Send recording request to extension
      window.postMessage({
        type: 'PURSUITSHIPPED_EXTENSION',
        action: 'START_RECORDING',
        options: {
          includeMicrophone: recordingMode.includes('mic'),
          includeSystemAudio: recordingMode.includes('screen')
        }
      }, window.location.origin);
    });
  };

  // Save recording to localStorage with enhanced metadata
  const saveRecordingLocally = (videoUrl: string, videoBlob: Blob) => {
    const recordingId = `rec_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // Create recording metadata
    const recordingData = {
      id: recordingId,
      title: `Demo Recording ${new Date().toLocaleDateString()}`,
      url: videoUrl,
      timestamp: timestamp,
      mode: recordingMode === 'screen+mic' ? 'Screen + Mic' : 
             recordingMode === 'screen' ? 'Screen Only' : 'Audio Only',
      size: videoBlob.size,
      duration: undefined, // Will be set when video loads
    };

    // Save to new format for editing library
    localStorage.setItem(`recording_${recordingId}`, JSON.stringify(recordingData));
    
    // Keep legacy format for backward compatibility
    localStorage.setItem('lastRecording', videoUrl);
    localStorage.setItem('lastRecordingTimestamp', timestamp);
    
    console.log('📁 Recording saved to library:', recordingData.title);
  };

  const handleMicrophoneRequest = async (): Promise<MediaStream | null> => {
    const result = await MicrophonePermissionManager.requestMicrophoneAccess();
    
    if (!result.success) {
      setMicrophoneError(result);
      setShowMicError(true);
      return null;
    }
    
    const stream = result.stream || null;
    setMicrophoneStream(stream); // Store for audio level monitoring
    return stream;
  };

  // Global hotkeys setup
  const {
    requestNotificationPermission,
    notifyRecordingStart,
    notifyRecordingStop,
    notifyRecordingPaused,
    notifyRecordingResumed,
    isWindowFocused
  } = useGlobalHotkeys({
    hotkeys: [
      {
        key: 'r',
        ctrlKey: true,
        callback: () => {
          if (isRecording) {
            stopRecording();
          } else {
            startRecording();
          }
        },
        description: 'Start/Stop Recording',
        enabled: true
      },
      {
        key: 'q',
        ctrlKey: true,
        callback: () => {
          if (isRecording) {
            stopRecording();
          }
        },
        description: 'Stop Recording',
        enabled: isRecording
      },
      {
        key: ' ',
        ctrlKey: true,
        callback: () => {
          if (isRecording) {
            if (isPaused) {
              resumeRecording();
            } else {
              pauseRecording();
            }
          }
        },
        description: 'Pause/Resume Recording',
        enabled: isRecording
      }
    ],
    isRecording
  });

  // Request notification permission on component mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Test microphone when component mounts (for modes that need microphone)
  useEffect(() => {
    if (recordingMode === 'screen+mic' || recordingMode === 'mic-only') {
      const testMic = async () => {
        const result = await MicrophonePermissionManager.testMicrophone();
        if (result.success) {
          // Get a stream for level monitoring (not for recording yet)
          const testResult = await MicrophonePermissionManager.requestMicrophoneAccess();
          if (testResult.success && testResult.stream) {
            setMicrophoneStream(testResult.stream);
          }
        }
      };
      testMic();
    } else {
      // Clear microphone stream for screen-only and silent-screen modes
      if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
        setMicrophoneStream(null);
      }
    }
  }, [recordingMode]);

  const startRecording = async () => {
    try {
      setError(null);
      
      // Clear previous recording
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
        setRecordedVideoUrl(null);
        localStorage.removeItem('lastRecording');
      }
      
      chunksRef.current = [];

      // Temporarily disable extension integration to avoid conflicts
      // TODO: Re-enable after fixing multiple popup issue
      // const extensionSuccess = await tryExtensionRecording();
      // if (extensionSuccess) {
      //   return; // Extension is handling the recording
      // }
      
      // Use built-in recording

      let stream: MediaStream;

      if (recordingMode === 'mic-only') {
        // Microphone only - use enhanced permission handling
        const micStream = await handleMicrophoneRequest();
        if (!micStream) {
          return; // Error dialog will be shown
        }
        stream = micStream;
      } else if (recordingMode === 'silent-screen') {
        // Silent screen recording - no audio for maximum performance
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
              frameRate: { ideal: 60, max: 60 }, // Higher framerate for smooth recording
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false // Explicitly no audio for performance
          });
        } catch (screenError: any) {
          throw new Error(`Silent screen recording failed: ${screenError.message}`);
        }
      } else {
        // Screen recording (with optional audio)
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true // This captures system audio
          });

          if (recordingMode === 'screen+mic') {
            // Add microphone to screen recording with enhanced error handling
            const micStream = await handleMicrophoneRequest();
            if (micStream) {
              // Combine streams
              const audioTracks = [
                ...screenStream.getAudioTracks(),
                ...micStream.getAudioTracks()
              ];
              
              stream = new MediaStream([
                ...screenStream.getVideoTracks(),
                ...audioTracks
              ]);
            } else {
              // User declined microphone or error occurred
              // Continue with screen-only recording
              stream = screenStream;
              setError('Recording screen only - microphone not available');
            }
          } else {
            stream = screenStream;
          }
        } catch (screenError: any) {
          throw new Error(`Screen recording failed: ${screenError.message}`);
        }
      }

      // Create MediaRecorder with fallback options for better compatibility
      let options = { mimeType: 'video/webm;codecs=vp8' }; // VP8 is more compatible than VP9
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: '' };
        }
      }
      
      // Optimize settings based on recording mode  
      const isHighPerformanceMode = recordingMode === 'silent-screen';
      const mediaRecorder = new MediaRecorder(stream, {
        ...options,
        videoBitsPerSecond: isHighPerformanceMode ? 4000000 : 2500000, // Higher quality for silent mode
      });
      
      mediaRecorderRef.current = mediaRecorder;

      // Handle data chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        setRecordedVideoUrl(videoUrl);
        saveRecordingLocally(videoUrl, videoBlob);
        
        if (onRecordingComplete) {
          onRecordingComplete(videoBlob);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer for recording duration
      isPausedRef.current = false;
      timerRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          setRecordingTime(prev => prev + 1);
        }
      }, 1000);

      console.log(`🎬 Started ${recordingMode} recording`);
      
      // Show notification when recording starts
      notifyRecordingStart();

    } catch (error: any) {
      console.error('Recording failed:', error);
      setError(`Failed to start recording: ${error.message}`);
      setIsRecording(false);
    }
  };

  const handleMicErrorRetry = () => {
    setShowMicError(false);
    setMicrophoneError(null);
    // Try starting recording again
    setTimeout(() => startRecording(), 100);
  };

  const handleMicErrorClose = () => {
    setShowMicError(false);
    setMicrophoneError(null);
    // If user cancels and was trying screen+mic, switch to screen-only
    if (recordingMode === 'screen+mic') {
      setRecordingMode('screen');
      setError('Switched to screen-only recording mode');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      isPausedRef.current = false; // Reset ref
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      console.log('🛑 Recording stopped');
      
      // Show notification when recording stops
      notifyRecordingStop();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      isPausedRef.current = true; // Update ref for timer
      console.log('⏸️ Recording paused');
      
      // Show notification when recording pauses
      notifyRecordingPaused();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      isPausedRef.current = false; // Update ref for timer
      console.log('▶️ Recording resumed');
      
      // Show notification when recording resumes
      notifyRecordingResumed();
    }
  };

  const downloadVideo = () => {
    if (recordedVideoUrl) {
      const a = document.createElement('a');
      a.href = recordedVideoUrl;
      a.download = `Pursuit Demo ${new Date().toLocaleDateString().replace(/\//g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log('📥 Video downloaded');
      
      // Show helpful message about opening WebM files
      setTimeout(() => {
        alert('📹 Video downloaded!\n\nIf the video won\'t open:\n• Try VLC Media Player (free)\n• Use Chrome/Firefox browser\n• Convert to MP4 using online converters');
      }, 500);
    }
  };

  const resetRecording = () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
    localStorage.removeItem('lastRecording');
    localStorage.removeItem('lastRecordingTimestamp');
    setError(null);
    setUploadProgress(0);
    setIsUploading(false);
    setRecordingTime(0);
    setIsPaused(false);
    isPausedRef.current = false; // Reset ref
    chunksRef.current = [];
    
    // Clear microphone stream
    if (microphoneStream) {
      microphoneStream.getTracks().forEach(track => track.stop());
      setMicrophoneStream(null);
    }
    
    // Clear timer if running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const convertWebmToMp4 = async (webmBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Create MediaRecorder with MP4 support
        let mimeType = 'video/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          // Fallback to WebM if MP4 not supported
          mimeType = 'video/webm;codecs=vp8';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
          }
        }
        
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        
        recorder.onstop = () => {
          const mp4Blob = new Blob(chunks, { type: mimeType });
          resolve(mp4Blob);
        };
        
        recorder.start();
        
        // Draw video frames to canvas
        const drawFrame = () => {
          if (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0);
            requestAnimationFrame(drawFrame);
          } else {
            recorder.stop();
          }
        };
        
        video.onended = () => recorder.stop();
        video.play();
        drawFrame();
      };
      
      video.onerror = reject;
      video.src = URL.createObjectURL(webmBlob);
    });
  };

  const uploadToGoogleDrive = async () => {
    if (!recordedVideoUrl) {
      setError('No recording to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Get access token
      console.log('🔑 Getting Google Drive access token...');
      const accessToken = await getDriveAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get Google Drive access token');
      }

      console.log('✅ Got access token, initializing Drive service...');
      // Initialize Google Drive service
      await googleDriveService.initialize(accessToken);

      // Convert recorded video URL to blob
      console.log('📹 Converting video to blob...');
      const response = await fetch(recordedVideoUrl);
      const webmBlob = await response.blob();
      console.log(`📦 Original WebM size: ${webmBlob.size} bytes`);

      // Try to convert to MP4 for better compatibility
      console.log('🔄 Converting to MP4 for better compatibility...');
      let uploadBlob = webmBlob;
      let fileName = `Pursuit Demo ${new Date().toLocaleDateString()}.webm`;
      let mimeType = 'video/webm';
      
      try {
        uploadBlob = await convertWebmToMp4(webmBlob);
        fileName = fileName.replace('.webm', '.mp4');
        mimeType = 'video/mp4';
        console.log(`✅ Converted to MP4, size: ${uploadBlob.size} bytes`);
      } catch (conversionError) {
        console.warn('⚠️ MP4 conversion failed, uploading as WebM:', conversionError);
      }

      // Upload to Google Drive (will try folder creation, fallback to root)
      console.log('☁️ Starting upload to Google Drive...');
      const result = await googleDriveService.uploadVideo(uploadBlob, {
        name: fileName,
        description: `Demo recording created with PursuitShipped on ${new Date().toLocaleString()}`,
        mimeType: mimeType
      }, (progress) => {
        console.log(`📊 Upload progress: ${progress}%`);
        setUploadProgress(progress);
      });

      console.log('✅ Video uploaded to Google Drive:', result);
      setUploadProgress(100);
      
      // Show success message with folder location hint and format info
      alert(`✅ Video uploaded successfully as ${mimeType.includes('mp4') ? 'MP4' : 'WebM'}!\n\nLook for it in your Google Drive in the "Pursuit Demos" folder.\n\nDirect link: ${result.webViewLink}`);
      
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
              if (event.ctrlKey && event.key === 'r') {
          event.preventDefault();
          if (isRecording) {
            stopRecording();
          } else {
            startRecording();
          }
        } else if (event.ctrlKey && event.code === 'Space') {
          event.preventDefault();
          if (isRecording) {
            if (isPaused) {
              resumeRecording();
            } else {
              pauseRecording();
            }
          }
        }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRecording]);

  return (
    <>
      {/* Recording Controls - Both Floating and Popup Window */}
      <FloatingStopButton
        isVisible={isRecording}
        onStop={stopRecording}
        onPause={pauseRecording}
        onResume={resumeRecording}
        isPaused={isPaused}
        recordingTime={recordingTime}
        microphoneStream={microphoneStream}
      />
      
      <RecordingControlsWindow
        isRecording={isRecording}
        isPaused={isPaused}
        recordingTime={recordingTime}
        onStop={stopRecording}
        onPause={pauseRecording}
        onResume={resumeRecording}
        microphoneStream={microphoneStream}
      />
      
      {/* Microphone Error Dialog */}
      {microphoneError && (
        <MicrophoneErrorDialog
          open={showMicError}
          onClose={handleMicErrorClose}
          onRetry={handleMicErrorRetry}
          error={microphoneError}
        />
      )}

      <div style={{ 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
      {/* Recording Controls - Main Section */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        alignItems: 'flex-start'
      }}>
        
        {/* Left Column - Recording Mode */}
        <div style={{ 
          flex: '1', 
          minWidth: '300px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '2px solid #4646EF'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            color: '#4646EF',
            fontSize: '18px'
          }}>
            🎬 Choose Recording Mode
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            {[
              { value: 'screen+mic', label: '🖥️ + 🎤 Screen + Microphone', desc: 'Best for demos with narration' },
              { value: 'screen', label: '🖥️ Screen Only', desc: 'Screen with optional system audio' },
              { value: 'silent-screen', label: '🎬 Silent Screen (Pro)', desc: 'High-quality recording for voiceover later' },
              { value: 'mic-only', label: '🎤 Audio Only', desc: 'Voice recording only' }
            ].map((mode) => (
              <label key={mode.value} style={{ 
                display: 'block', 
                marginBottom: '12px',
                padding: '12px',
                border: recordingMode === mode.value ? '2px solid #4646EF' : '2px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: recordingMode === mode.value ? '#f7fafc' : 'white',
                cursor: isRecording ? 'not-allowed' : 'pointer',
                opacity: isRecording ? 0.6 : 1
              }}>
                <input
                  type="radio"
                  name="recordingMode"
                  value={mode.value}
                  checked={recordingMode === mode.value}
                  onChange={(e) => setRecordingMode(e.target.value as any)}
                  disabled={isRecording}
                  style={{ marginRight: '10px' }}
                />
                <strong>{mode.label}</strong>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '24px' }}>
                  {mode.desc}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Right Column - Recording Controls */}
        <div style={{ 
          flex: '1', 
          minWidth: '250px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            fontSize: '18px'
          }}>
            🎮 Controls
          </h3>

          {!isRecording ? (
            <button
              onClick={startRecording}
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: '18px',
                backgroundColor: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '15px',
                fontWeight: 'bold'
              }}
            >
              🔴 Start Recording
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  fontSize: '16px',
                  backgroundColor: isPaused ? '#28a745' : '#ffa500',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
              
              <button
                onClick={stopRecording}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  fontSize: '16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ⏹️ Stop Recording
              </button>
            </div>
          )}

          {/* Microphone Test & Level Indicator */}
          {(recordingMode === 'screen+mic' || recordingMode === 'mic-only') && !isRecording && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#495057'
              }}>
                🎤 Microphone Setup
              </div>
              
              {/* Microphone Test */}
              <MicrophoneTest 
                onTestComplete={(success, stream) => {
                  if (success && stream) {
                    setMicrophoneStream(stream);
                  }
                }}
                size="medium"
              />
              
              {/* Show current microphone level if available */}
              {microphoneStream && (
                <div style={{ 
                  backgroundColor: '#f8f9fa',
                  padding: '8px',
                  marginTop: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    marginBottom: '4px',
                    color: '#6c757d'
                  }}>
                    Live Mic Level:
                  </div>
                  <AudioLevelIndicator 
                    stream={microphoneStream}
                    isActive={true}
                    size="small"
                    showLabel={false}
                  />
                </div>
              )}
            </div>
          )}

          {/* Live Mic Level During Recording */}
          {(recordingMode === 'screen+mic' || recordingMode === 'mic-only') && isRecording && microphoneStream && (
            <div style={{ 
              backgroundColor: '#e8f5e8',
              padding: '8px',
              marginBottom: '15px',
              borderRadius: '4px',
              border: '1px solid #c3e6c3'
            }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: 'bold',
                marginBottom: '4px',
                color: '#2d5a2d'
              }}>
                🔴 Recording - Mic Level:
              </div>
              <AudioLevelIndicator 
                stream={microphoneStream}
                isActive={true}
                size="small"
                showLabel={false}
              />
            </div>
          )}

          {/* Silent Screen Recording Info */}
          {recordingMode === 'silent-screen' && !isRecording && (
            <div style={{ 
              backgroundColor: '#e8f5e8',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid #c3e6c3'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#2d5a2d'
              }}>
                🎬 Silent Screen Mode
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#4a7c4a',
                lineHeight: '1.4'
              }}>
                • <strong>High-performance recording</strong> - No audio processing overhead<br/>
                • <strong>Perfect for voiceover later</strong> - Add narration in post-production<br/>
                • <strong>Higher quality video</strong> - 4 Mbps bitrate, 60fps capable<br/>
                • <strong>No microphone setup</strong> - Skip audio configuration entirely
              </div>
            </div>
          )}

          <div style={{ 
            fontSize: '12px', 
            color: '#666',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            padding: '8px',
            borderRadius: '4px'
          }}>
            💡 Global Hotkeys:<br/>
            • Ctrl+R: Start/Stop recording<br/>
            • Ctrl+Q: Stop recording (works anywhere)<br/>
            • Ctrl+Space: Pause/Resume<br/>
            {!isWindowFocused && isRecording && (
              <div style={{ 
                color: '#28a745', 
                fontWeight: 'bold', 
                marginTop: '4px' 
              }}>
                🔔 Recording in background - hotkeys active!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#fed7d7', 
          border: '1px solid #fc8181',
          borderRadius: '8px',
          color: '#c53030'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Recording Status */}
      {isRecording && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '20px', 
          backgroundColor: '#e6fffa', 
          border: '2px solid #4fd1c7',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            backgroundColor: '#e53e3e', 
            borderRadius: '50%',
            animation: 'pulse 1s infinite'
          }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>🎬 Recording in Progress</div>
            <div style={{ fontSize: '14px', color: '#4a5568' }}>
              Click "Stop Recording" above or press Ctrl+R when finished
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#2563eb',
              marginTop: '6px',
              padding: '6px 10px',
              backgroundColor: '#eff6ff',
              borderRadius: '6px',
              border: '1px solid #bfdbfe'
            }}>
              📱 <strong>Recording controls opened in popup window</strong> - stays visible when you switch apps!
            </div>
          </div>
        </div>
      )}

      {/* Video Preview */}
      {recordedVideoUrl && (
        <div style={{ 
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#4646EF' }}>📹 Your Recorded Demo</h3>
          
          <video
            src={recordedVideoUrl}
            controls
            style={{ 
              width: '100%', 
              maxWidth: '100%', 
              height: 'auto',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              marginBottom: '15px'
            }}
          />
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={downloadVideo}
              style={{
                padding: '12px 20px',
                backgroundColor: '#4646EF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📥 Download Video
            </button>
            <button
              onClick={uploadToGoogleDrive}
              disabled={isUploading}
              style={{
                padding: '12px 20px',
                backgroundColor: isUploading ? '#a0aec0' : '#34d399',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                marginRight: '10px'
              }}
            >
              {isUploading ? `☁️ Uploading... ${uploadProgress}%` : '☁️ Save to Google Drive'}
            </button>
            <button
              onClick={resetRecording}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🔄 Record Again
            </button>
          </div>
          
          {localStorage.getItem('lastRecordingTimestamp') && (
            <div style={{ 
              marginTop: '10px', 
              fontSize: '12px', 
              color: '#666'
            }}>
              💾 Auto-saved: {new Date(localStorage.getItem('lastRecordingTimestamp')!).toLocaleString()}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
    </>
  );
};

export default SimpleRecorder; 