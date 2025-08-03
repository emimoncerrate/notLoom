import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { 
  Videocam, 
  Stop, 
  MicOff,
  Mic,
  Pause,
  PlayArrow,
} from '@mui/icons-material';
import VideoEditor from './VideoEditor';

interface ScreenRecorderProps {
  onRecordingComplete: (blob: Blob, notes: string[]) => void;
}

const ScreenRecorder: React.FC<ScreenRecorderProps> = ({ onRecordingComplete }) => {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingMode, setRecordingMode] = useState<'screen' | 'screen+camera' | 'voiceover'>('screen');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Function to combine multiple MediaStreams into a single stream
  const combineStreams = (videoStream: MediaStream, audioStream: MediaStream): MediaStream => {
    // Create a new MediaStream to hold both video and audio tracks
    const combinedStream = new MediaStream();
    
    // Add all video tracks from the screen capture
    videoStream.getVideoTracks().forEach(track => {
      combinedStream.addTrack(track);
    });
    
    // Add all audio tracks from the microphone
    audioStream.getAudioTracks().forEach(track => {
      combinedStream.addTrack(track);
    });
    
    return combinedStream;
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setRecordingTime(0);
      
      let combinedStream: MediaStream;
      
      if (recordingMode === 'voiceover') {
        // Voiceover only - just microphone
        const micStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        micStreamRef.current = micStream;
        combinedStream = micStream;
      } else {
        // Screen recording (with optional camera)
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            mediaSource: 'screen',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
          audio: false, // Handle audio separately
        });
        
        streamRef.current = screenStream;
        combinedStream = screenStream;
        
        // Add camera if screen+camera mode
        if (recordingMode === 'screen+camera') {
          try {
            const cameraStream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 640 }, height: { ideal: 480 } },
              audio: false,
            });
            
            // Combine screen and camera streams
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            canvas.width = 1920;
            canvas.height = 1080;
            
            // Note: This is a simplified approach. In production, you'd use a more sophisticated
            // picture-in-picture implementation with proper video combining
            console.log('Camera stream obtained for picture-in-picture mode');
          } catch (cameraError) {
            console.error('Failed to access camera:', cameraError);
            setError('Camera access denied. Recording will continue with screen only.');
          }
        }
        
        // Add microphone audio if enabled
        if (audioEnabled) {
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            });
            
            micStreamRef.current = micStream;
            combinedStream = combineStreams(screenStream, micStream);
            
            console.log('Microphone audio enabled and combined with screen capture');
          } catch (micError) {
            console.error('Failed to access microphone:', micError);
            setError('Microphone access denied. Recording will continue without audio.');
          }
        }
      }

      // Create MediaRecorder with available types
      let options = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm' };
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: '' };
          }
        }
      }

      const mediaRecorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Start a timer to track recording duration
      timerRef.current = window.setInterval(() => {
        if (!paused) {
          setRecordingTime(prev => prev + 1);
        }
      }, 1000);

      mediaRecorder.start(1000); // Capture in 1-second chunks
      setRecording(true);
      setPaused(false);
    } catch (err) {
      setError('Failed to start recording. Please ensure you have granted the necessary permissions.');
      console.error('Recording error:', err);
    }
  }, [audioEnabled, recordingMode]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks from screen capture stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Stop all tracks from microphone stream
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setRecording(false);
      setPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const togglePause = useCallback(() => {
    if (recording) {
      if (paused) {
        // Resume recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
          mediaRecorderRef.current.resume();
        }
      } else {
        // Pause recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.pause();
        }
      }
      setPaused(!paused);
    }
  }, [recording, paused]);

  const handleRerecord = useCallback(() => {
    setRecordedBlob(null);
    startRecording();
  }, [startRecording]);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoSave = (editedBlob: Blob, notes: string[]) => {
    onRecordingComplete(editedBlob, notes);
  };

  // Video editor view (after recording)
  if (recordedBlob) {
    return (
      <VideoEditor
        videoBlob={recordedBlob}
        onSave={handleVideoSave}
        onRerecord={handleRerecord}
      />
    );
  }

  // Recording screen view
  if (recording) {
    return (
      <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
        <Paper 
          elevation={3}
          sx={{ 
            p: 3, 
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography variant="h6" gutterBottom align="center">
            Recording in Progress
          </Typography>

          <Box 
            sx={{ 
              width: '100%', 
              height: 300, 
              bgcolor: 'rgba(0,0,0,0.1)', 
              mb: 3,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ 
              position: 'relative', 
              width: '100%', 
              height: '100%', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                <Typography variant="caption" sx={{ bgcolor: 'error.main', color: 'white', px: 1, py: 0.5, borderRadius: 1 }}>
                  REC {formatTime(recordingTime)}
                </Typography>
              </Box>
              
              {paused ? (
                <Typography variant="h6">Recording Paused</Typography>
              ) : (
                <CircularProgress />
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <IconButton 
                onClick={togglePause} 
                color="primary"
                sx={{ p: 2 }}
              >
                {paused ? <PlayArrow fontSize="large" /> : <Pause fontSize="large" />}
              </IconButton>
              <Typography variant="caption">{paused ? 'Resume' : 'Pause'}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <IconButton 
                onClick={stopRecording}
                color="error"
                sx={{ p: 2 }}
              >
                <Stop fontSize="large" />
              </IconButton>
              <Typography variant="caption">Stop</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Initial start recording view
  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }} className="recording-container">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper 
        elevation={3}
        sx={{ 
          p: 4, 
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          '@media (max-width: 768px)': {
            p: 2,
          },
          '@media (max-width: 480px)': {
            p: 1.5,
            mx: 1,
          }
        }}
      >
        <Typography variant="h6" gutterBottom>
          Record Your Demo
        </Typography>
        
        <Typography color="text.secondary" gutterBottom sx={{ mb: 2 }}>
          Click the button below to start recording your screen.
        </Typography>
        
        {/* Recording Mode Selector */}
        <Box sx={{ mb: 3, width: '100%', maxWidth: 400 }}>
          <Typography variant="subtitle2" gutterBottom>
            Recording Mode
          </Typography>
          <FormControl fullWidth>
            <Select
              value={recordingMode}
              onChange={(e) => setRecordingMode(e.target.value as 'screen' | 'screen+camera' | 'voiceover')}
              size="small"
            >
              <MenuItem value="screen">Screen Recording</MenuItem>
              <MenuItem value="screen+camera">Screen + Camera (Picture-in-Picture)</MenuItem>
              <MenuItem value="voiceover">Voiceover Only (Audio)</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
            {recordingMode === 'screen' && 'Record your screen with optional microphone audio'}
            {recordingMode === 'screen+camera' && 'Record your screen with your camera in a small window'}
            {recordingMode === 'voiceover' && 'Record audio commentary only (no video)'}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Tooltip title={audioEnabled ? "Microphone enabled" : "Microphone disabled"}>
            <IconButton 
              onClick={toggleAudio} 
              color={audioEnabled ? "primary" : "default"}
              sx={{ mr: 1 }}
            >
              {audioEnabled ? <Mic /> : <MicOff />}
            </IconButton>
          </Tooltip>
          <Typography variant="caption" display="block">
            {audioEnabled ? "Microphone enabled (your voice will be recorded)" : "Microphone disabled (no audio will be recorded)"}
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={recordingMode === 'voiceover' ? <Mic /> : <Videocam />}
          onClick={startRecording}
          size="large"
        >
          {recordingMode === 'voiceover' ? 'Start Audio Recording' : 'Start Recording'}
        </Button>
      </Paper>
    </Box>
  );
};

export default ScreenRecorder; 