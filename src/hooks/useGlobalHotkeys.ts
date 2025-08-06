import { useEffect, useCallback, useRef } from 'react';

interface GlobalHotkeyConfig {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
  description: string;
  enabled?: boolean;
}

interface UseGlobalHotkeysProps {
  hotkeys: GlobalHotkeyConfig[];
  isRecording?: boolean;
}

export const useGlobalHotkeys = ({ hotkeys, isRecording = false }: UseGlobalHotkeysProps) => {
  const enabledRef = useRef(true);
  const recordingRef = useRef(isRecording);

  // Update recording ref when prop changes
  useEffect(() => {
    recordingRef.current = isRecording;
  }, [isRecording]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabledRef.current) return;

    // Don't trigger if user is typing in an input
    const target = event.target as HTMLElement;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.contentEditable === 'true') {
      return;
    }

    for (const hotkey of hotkeys) {
      if (hotkey.enabled === false) continue;

      const matches = 
        event.key.toLowerCase() === hotkey.key.toLowerCase() &&
        !!event.ctrlKey === !!hotkey.ctrlKey &&
        !!event.altKey === !!hotkey.altKey &&
        !!event.shiftKey === !!hotkey.shiftKey &&
        !!event.metaKey === !!hotkey.metaKey;

      if (matches) {
        event.preventDefault();
        event.stopPropagation();
        hotkey.callback();
        break;
      }
    }
  }, [hotkeys]);

  useEffect(() => {
    // Listen on document for maximum coverage
    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);

  // Browser notification system for recording status
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'pursuit-recording',
        ...options
      });

      // Auto-close after 3 seconds
      setTimeout(() => notification.close(), 3000);
      
      return notification;
    }
    return null;
  }, []);

  const notifyRecordingStart = useCallback(() => {
    showNotification('🎬 Recording Started', {
      body: 'PursuitShipped is now recording. Press Ctrl+Q to stop.',
      silent: false
    });
  }, [showNotification]);

  const notifyRecordingStop = useCallback(() => {
    showNotification('⏹️ Recording Stopped', {
      body: 'Your recording has been saved successfully.',
      silent: true
    });
  }, [showNotification]);

  const notifyRecordingPaused = useCallback(() => {
    showNotification('⏸️ Recording Paused', {
      body: 'Press Ctrl+Space to resume recording.',
      silent: true
    });
  }, [showNotification]);

  const notifyRecordingResumed = useCallback(() => {
    showNotification('▶️ Recording Resumed', {
      body: 'Recording is now active again.',
      silent: true
    });
  }, [showNotification]);

  // Window focus detection for enhanced hotkey behavior
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Picture-in-Picture API for floating controls (experimental)
  const requestPictureInPicture = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      if ('pictureInPictureEnabled' in document && (videoElement as any).requestPictureInPicture) {
        await (videoElement as any).requestPictureInPicture();
        return true;
      }
    } catch (error) {
      console.warn('Picture-in-Picture not supported or failed:', error);
    }
    return false;
  }, []);

  const disable = useCallback(() => {
    enabledRef.current = false;
  }, []);

  const enable = useCallback(() => {
    enabledRef.current = true;
  }, []);

  return {
    requestNotificationPermission,
    showNotification,
    notifyRecordingStart,
    notifyRecordingStop,
    notifyRecordingPaused,
    notifyRecordingResumed,
    isWindowFocused,
    requestPictureInPicture,
    disable,
    enable
  };
};

// Helper to format hotkey combinations for display
export const formatHotkey = (hotkey: GlobalHotkeyConfig): string => {
  const parts: string[] = [];
  
  if (hotkey.ctrlKey) parts.push('Ctrl');
  if (hotkey.altKey) parts.push('Alt');
  if (hotkey.shiftKey) parts.push('Shift');
  if (hotkey.metaKey) parts.push('Cmd');
  
  parts.push(hotkey.key.toUpperCase());
  
  return parts.join(' + ');
};

// Add missing import
import { useState } from 'react';