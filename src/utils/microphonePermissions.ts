export interface MicrophonePermissionResult {
  success: boolean;
  error?: string;
  errorType?: 'permission-denied' | 'not-found' | 'not-allowed' | 'abort' | 'not-readable' | 'unknown';
  guidance?: string[];
  stream?: MediaStream;
}

export class MicrophonePermissionManager {
  /**
   * Check if microphone permission is already granted
   */
  static async checkPermissionStatus(): Promise<PermissionState | 'unknown'> {
    try {
      if (!navigator.permissions) {
        return 'unknown';
      }
      
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state;
    } catch (error) {
      console.warn('Could not query microphone permission:', error);
      return 'unknown';
    }
  }

  /**
   * Request microphone access with detailed error handling
   */
  static async requestMicrophoneAccess(constraints: MediaStreamConstraints = { audio: true }): Promise<MicrophonePermissionResult> {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          success: false,
          errorType: 'unknown',
          error: 'Your browser does not support microphone recording',
          guidance: [
            'Use a modern browser like Chrome, Firefox, or Safari',
            'Make sure you\'re using HTTPS (not HTTP)',
            'Try updating your browser to the latest version'
          ]
        };
      }

      // Pre-check permission status
      const permissionStatus = await this.checkPermissionStatus();
      
      if (permissionStatus === 'denied') {
        return {
          success: false,
          errorType: 'permission-denied',
          error: 'Microphone access is blocked',
          guidance: [
            '1. Click the 🔒 lock icon in your browser\'s address bar',
            '2. Set "Microphone" to "Allow"',
            '3. Refresh the page and try again',
            'Or check your browser\'s site settings'
          ]
        };
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      return {
        success: true,
        stream: stream
      };

    } catch (error: any) {
      const errorName = error.name || error.code || 'unknown';
      
      // Handle specific error types
      switch (errorName) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          return {
            success: false,
            errorType: 'not-allowed',
            error: 'Microphone access was denied',
            guidance: [
              '1. Click "Allow" when your browser asks for microphone access',
              '2. Or click the 🔒 lock icon in the address bar',
              '3. Set "Microphone" to "Allow"',
              '4. Refresh the page and try again'
            ]
          };

        case 'NotFoundError':
        case 'DevicesNotFoundError':
          return {
            success: false,
            errorType: 'not-found',
            error: 'No microphone found',
            guidance: [
              'Check that a microphone is connected to your computer',
              'Try plugging in headphones with a built-in microphone',
              'Check your computer\'s audio settings',
              'Try restarting your browser'
            ]
          };

        case 'NotReadableError':
        case 'TrackStartError':
          return {
            success: false,
            errorType: 'not-readable',
            error: 'Microphone is busy or unavailable',
            guidance: [
              'Close other apps that might be using your microphone (Zoom, Teams, etc.)',
              'Check if another browser tab is using the microphone',
              'Try restarting your browser',
              'Check your computer\'s audio settings'
            ]
          };

        case 'AbortError':
          return {
            success: false,
            errorType: 'abort',
            error: 'Microphone request was cancelled',
            guidance: [
              'Try clicking "Start Recording" again',
              'Make sure to click "Allow" when prompted for microphone access'
            ]
          };

        case 'OverconstrainedError':
        case 'ConstraintNotSatisfiedError':
          return {
            success: false,
            errorType: 'unknown',
            error: 'Microphone doesn\'t support the requested settings',
            guidance: [
              'Your microphone may not support the audio quality settings',
              'Try using a different microphone',
              'Contact support if this issue persists'
            ]
          };

        default:
          return {
            success: false,
            errorType: 'unknown',
            error: `Microphone error: ${error.message || errorName}`,
            guidance: [
              'Try refreshing the page',
              'Check that your microphone is working in other apps',
              'Try using a different browser',
              'Contact support if this issue persists'
            ]
          };
      }
    }
  }

  /**
   * Test microphone by getting a brief stream
   */
  static async testMicrophone(): Promise<MicrophonePermissionResult> {
    const result = await this.requestMicrophoneAccess();
    
    if (result.success && result.stream) {
      // Stop the test stream immediately
      result.stream.getTracks().forEach(track => track.stop());
      
      return {
        success: true,
        error: undefined,
        guidance: ['✅ Microphone is working correctly!']
      };
    }
    
    return result;
  }

  /**
   * Get audio level from a microphone stream
   */
  static createAudioLevelMonitor(stream: MediaStream): {
    getLevel: () => number;
    cleanup: () => void;
  } {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    return {
      getLevel: () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        return Math.round((average / 255) * 100); // Return percentage
      },
      cleanup: () => {
        source.disconnect();
        audioContext.close();
      }
    };
  }
}