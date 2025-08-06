import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { Mic, MicOff, VolumeUp, VolumeDown } from '@mui/icons-material';

interface AudioLevelIndicatorProps {
  stream: MediaStream | null;
  isActive?: boolean;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const AudioLevelIndicator: React.FC<AudioLevelIndicatorProps> = ({
  stream,
  isActive = true,
  showLabel = true,
  size = 'medium'
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!stream || !isActive) {
      cleanup();
      setAudioLevel(0);
      setIsDetecting(false);
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setIsDetecting(false);
      return;
    }

    try {
      // Create audio context and analyser
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsDetecting(true);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isActive) {
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate RMS (Root Mean Square) for more accurate level detection
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const level = Math.min(100, Math.round((rms / 128) * 100));
          
          setAudioLevel(level);
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
      
    } catch (error) {
      console.error('Error setting up audio level monitoring:', error);
      setIsDetecting(false);
    }

    return cleanup;
  }, [stream, isActive]);

  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
  };

  const getBarColor = () => {
    if (!isDetecting) return '#e0e0e0';
    if (audioLevel < 10) return '#ff5722'; // Red - too quiet
    if (audioLevel < 30) return '#ff9800'; // Orange - quiet
    if (audioLevel < 70) return '#4caf50'; // Green - good
    if (audioLevel < 85) return '#2196f3'; // Blue - loud
    return '#f44336'; // Red - too loud
  };

  const getIcon = () => {
    if (!isDetecting) return <MicOff fontSize={size} />;
    if (audioLevel < 10) return <MicOff fontSize={size} />;
    if (audioLevel < 50) return <VolumeDown fontSize={size} />;
    return <VolumeUp fontSize={size} />;
  };

  const getLevelText = () => {
    if (!isDetecting) return 'No audio detected';
    if (audioLevel < 10) return 'Too quiet';
    if (audioLevel < 30) return 'Quiet';
    if (audioLevel < 70) return 'Good level';
    if (audioLevel < 85) return 'Loud';
    return 'Too loud!';
  };

  const getBarHeight = () => {
    switch (size) {
      case 'small': return 4;
      case 'large': return 12;
      default: return 8;
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      minWidth: size === 'small' ? '120px' : '160px'
    }}>
      {/* Microphone Icon */}
      <Box sx={{ 
        color: getBarColor(),
        display: 'flex',
        alignItems: 'center'
      }}>
        {getIcon()}
      </Box>
      
      {/* Audio Level Bar */}
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={audioLevel}
          sx={{
            height: getBarHeight(),
            borderRadius: 2,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: getBarColor(),
              borderRadius: 2,
              transition: 'background-color 0.2s ease'
            }
          }}
        />
        
        {showLabel && size !== 'small' && (
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '10px',
              color: 'text.secondary',
              display: 'block',
              textAlign: 'center',
              mt: 0.5
            }}
          >
            {getLevelText()} ({audioLevel}%)
          </Typography>
        )}
      </Box>
      
      {/* Numeric Level (for small size) */}
      {size === 'small' && (
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '10px',
            color: 'text.secondary',
            minWidth: '24px',
            textAlign: 'right'
          }}
        >
          {audioLevel}%
        </Typography>
      )}
    </Box>
  );
};

export default AudioLevelIndicator;