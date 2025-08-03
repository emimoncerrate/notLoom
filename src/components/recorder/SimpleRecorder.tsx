import React, { useState, useRef, useEffect } from 'react';
import { googleDriveService } from '../../services/googleDrive';
import { useAuth } from '../../contexts/AuthContext';

interface SimpleRecorderProps {
  onRecordingComplete?: (videoBlob: Blob) => void;
}

const SimpleRecorder: React.FC<SimpleRecorderProps> = ({ onRecordingComplete }) => {
  const { getDriveAccessToken } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingMode, setRecordingMode] = useState<'screen' | 'screen+mic' | 'mic-only'>('screen+mic');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Load saved recording from localStorage on component mount
  useEffect(() => {
    const savedRecording = localStorage.getItem('lastRecording');
    if (savedRecording) {
      setRecordedVideoUrl(savedRecording);
    }
  }, []);

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

      let stream: MediaStream;

      if (recordingMode === 'mic-only') {
        // Microphone only
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } else {
        // Screen recording
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true // This captures system audio
        });

        if (recordingMode === 'screen+mic') {
          // Add microphone to screen recording
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Combine streams
            const audioTracks = [
              ...screenStream.getAudioTracks(),
              ...micStream.getAudioTracks()
            ];
            
            stream = new MediaStream([
              ...screenStream.getVideoTracks(),
              ...audioTracks
            ]);
          } catch (micError) {
            console.warn('Could not access microphone, continuing with screen audio only:', micError);
            setError('Microphone access denied - recording screen audio only');
            stream = screenStream;
          }
        } else {
          stream = screenStream;
        }
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9' // Use VP9 for better compression
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

      console.log(`🎬 Started ${recordingMode} recording`);

    } catch (error: any) {
      console.error('Recording failed:', error);
      setError(`Failed to start recording: ${error.message}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('🛑 Recording stopped');
    }
  };

  const downloadVideo = () => {
    if (recordedVideoUrl) {
      const a = document.createElement('a');
      a.href = recordedVideoUrl;
      a.download = `pursuit-demo-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log('📥 Video downloaded');
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
    chunksRef.current = [];
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
      const videoBlob = await response.blob();
      console.log(`📦 Video blob size: ${videoBlob.size} bytes`);

      // Upload to Google Drive (will try folder creation, fallback to root)
      console.log('☁️ Starting upload to Google Drive...');
      const result = await googleDriveService.uploadVideo(videoBlob, {
        name: `Pursuit Demo ${new Date().toLocaleDateString()}.webm`,
        description: `Demo recording created with PursuitShipped on ${new Date().toLocaleString()}`,
        mimeType: 'video/webm'
      });

      console.log('✅ Video uploaded to Google Drive:', result);
      setUploadProgress(100);
      
      // Show success message
      alert(`✅ Video uploaded successfully!\nYou can view it at: ${result.webViewLink}`);
      
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
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRecording]);

  return (
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
              { value: 'screen', label: '🖥️ Screen Only', desc: 'Silent screen recording' },
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
            <button
              onClick={stopRecording}
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: '18px',
                backgroundColor: '#4a5568',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '15px',
                fontWeight: 'bold'
              }}
            >
              ⏹️ Stop Recording
            </button>
          )}

          <div style={{ 
            fontSize: '12px', 
            color: '#666',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            padding: '8px',
            borderRadius: '4px'
          }}>
            💡 Tip: Use Ctrl+R to start/stop recording
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
  );
};

export default SimpleRecorder; 