import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Videocam, Stop, Replay } from '@mui/icons-material';

interface ScreenRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

const ScreenRecorder: React.FC<ScreenRecorderProps> = ({ onRecordingComplete }) => {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onRecordingComplete(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      setError('Failed to start recording. Please ensure you have granted the necessary permissions.');
      console.error('Recording error:', err);
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && streamRef.current) {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setPreviewUrl(null);
    startRecording();
  }, [startRecording]);

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {previewUrl ? (
        <Box sx={{ mb: 2 }}>
          <video
            src={previewUrl}
            controls
            style={{ width: '100%', borderRadius: 8 }}
          />
          <Button
            variant="contained"
            startIcon={<Replay />}
            onClick={handleRetry}
            sx={{ mt: 2 }}
          >
            Record Again
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
          }}
        >
          {recording ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography>Recording in progress...</Typography>
              <Button
                variant="contained"
                color="error"
                startIcon={<Stop />}
                onClick={stopRecording}
              >
                Stop Recording
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              startIcon={<Videocam />}
              onClick={startRecording}
              size="large"
            >
              Start Recording
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ScreenRecorder; 