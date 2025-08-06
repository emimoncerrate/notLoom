import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip, Fade } from '@mui/material';
import { Stop, Pause, PlayArrow, DragIndicator, Mic } from '@mui/icons-material';
import AudioLevelIndicator from './AudioLevelIndicator';

interface FloatingStopButtonProps {
  isVisible: boolean;
  onStop: () => void;
  onPause?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
  recordingTime?: number;
  microphoneStream?: MediaStream | null;
}

const FloatingStopButton: React.FC<FloatingStopButtonProps> = ({
  isVisible,
  onStop,
  onPause,
  onResume,
  isPaused = false,
  recordingTime = 0,
  microphoneStream = null
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.stop-button')) {
      return; // Don't drag when clicking the stop button
    }
    
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 200; // width of floating button
    const maxY = window.innerHeight - 80; // height of floating button
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
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
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, onStop, onPause, onResume, isPaused]);

  if (!isVisible) return null;

  return (
    <Fade in={isVisible}>
      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 999999, // Very high z-index to appear above everything
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '12px',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: microphoneStream ? 'column' : 'row',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(10px)',
          border: '2px solid #ff4444',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          minWidth: microphoneStream ? '200px' : 'auto',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Drag handle */}
            {/* Main controls row */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      width: '100%'
    }}>
      <DragIndicator
        style={{
          color: '#ffffff',
          fontSize: '16px',
          opacity: 0.7
        }}
      />

      {/* Recording indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flex: 1
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          backgroundColor: isPaused ? '#ffa500' : '#ff4444',
          borderRadius: '50%',
          animation: isPaused ? 'none' : 'pulse 1.5s infinite'
        }} />
        <span style={{
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'bold',
          minWidth: '35px'
        }}>
          {formatTime(recordingTime)}
        </span>
        {isPaused && (
          <span style={{
            color: '#ffa500',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            PAUSED
          </span>
        )}
      </div>

      {/* Pause/Resume button */}
      {(onPause || onResume) && (
        <Tooltip title={isPaused ? "Resume (Ctrl+Space)" : "Pause (Ctrl+Space)"} arrow>
          <IconButton
            className="pause-button"
            onClick={isPaused ? onResume : onPause}
            size="small"
            style={{
              backgroundColor: isPaused ? '#28a745' : '#ffa500',
              color: 'white',
              width: '32px',
              height: '32px',
              padding: '4px'
            }}
          >
            {isPaused ? <PlayArrow fontSize="small" /> : <Pause fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}

      {/* Stop button */}
      <Tooltip title="Stop Recording (Ctrl+Q)" arrow>
        <IconButton
          className="stop-button"
          onClick={onStop}
          size="small"
          style={{
            backgroundColor: '#ff4444',
            color: 'white',
            width: '32px',
            height: '32px',
            padding: '4px'
          }}
        >
          <Stop fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>

    {/* Microphone level indicator */}
    {microphoneStream && (
      <div style={{
        width: '100%',
        padding: '4px 8px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <Mic style={{ color: '#ffffff', fontSize: '14px' }} />
        <div style={{ flex: 1 }}>
          <AudioLevelIndicator 
            stream={microphoneStream}
            isActive={true}
            size="small"
            showLabel={false}
          />
        </div>
      </div>
    )}
        
        {/* Inline styles for animation */}
        <style>{`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>
    </Fade>
  );
};

export default FloatingStopButton;