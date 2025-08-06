import React, { useState } from 'react';
import { Button, Box, Typography, Alert, CircularProgress } from '@mui/material';
import { Mic, Check, Warning, PlayArrow, Stop } from '@mui/icons-material';
import AudioLevelIndicator from './AudioLevelIndicator';
import { MicrophonePermissionManager, MicrophonePermissionResult } from '../../utils/microphonePermissions';

interface MicrophoneTestProps {
  onTestComplete?: (success: boolean, stream?: MediaStream) => void;
  size?: 'small' | 'medium';
}

const MicrophoneTest: React.FC<MicrophoneTestProps> = ({
  onTestComplete,
  size = 'medium'
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testStream, setTestStream] = useState<MediaStream | null>(null);
  const [testResult, setTestResult] = useState<MicrophonePermissionResult | null>(null);
  const [testStarted, setTestStarted] = useState(false);

  const startTest = async () => {
    setIsTesting(true);
    setTestStarted(true);
    setTestResult(null);
    
    try {
      const result = await MicrophonePermissionManager.requestMicrophoneAccess();
      setTestResult(result);
      
      if (result.success && result.stream) {
        setTestStream(result.stream);
        onTestComplete?.(true, result.stream);
      } else {
        onTestComplete?.(false);
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Microphone test failed',
        errorType: 'unknown'
      });
      onTestComplete?.(false);
    }
    
    setIsTesting(false);
  };

  const stopTest = () => {
    if (testStream) {
      // Don't stop the stream - keep it for ongoing monitoring
      // testStream.getTracks().forEach(track => track.stop());
      setTestStream(null); // Just hide the test UI
    }
    // Keep testResult so we show success state
    setTestStarted(false);
  };

  const getTestStatusIcon = () => {
    if (isTesting) return <CircularProgress size={16} />;
    if (testResult?.success) return <Check color="success" />;
    if (testResult && !testResult.success) return <Warning color="error" />;
    return <Mic />;
  };

  const getTestStatusText = () => {
    if (isTesting) return 'Testing microphone...';
    if (testResult?.success) return 'Microphone working!';
    if (testResult && !testResult.success) return testResult.error || 'Test failed';
    return 'Test your microphone';
  };

  const getTestStatusColor = () => {
    if (testResult?.success) return 'success';
    if (testResult && !testResult.success) return 'error';
    return 'info';
  };

  return (
    <Box sx={{ 
      backgroundColor: '#f8f9fa',
      padding: size === 'small' ? '8px' : '12px',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    }}>
      {/* Test Button */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        mb: testStream ? 1 : 0
      }}>
        {!testStream ? (
          <Button
            variant="outlined"
            size={size}
            startIcon={getTestStatusIcon()}
            onClick={startTest}
            disabled={isTesting}
            color={testResult?.success ? 'success' : 'primary'}
            sx={{ minWidth: '140px' }}
          >
            {isTesting ? 'Testing...' : testStarted ? 'Test Again' : 'Test Mic'}
          </Button>
        ) : (
          <Button
            variant="contained"
            size={size}
            startIcon={<Stop />}
            onClick={stopTest}
            color="error"
            sx={{ minWidth: '140px' }}
          >
            Stop Test
          </Button>
        )}
        
        <Typography variant="caption" sx={{ 
          color: testResult?.success ? 'success.main' : 
                 testResult && !testResult.success ? 'error.main' : 'text.secondary',
          fontWeight: testResult ? 'bold' : 'normal'
        }}>
          {getTestStatusText()}
        </Typography>
      </Box>

      {/* Audio Level Indicator during test */}
      {testStream && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ 
            display: 'block',
            mb: 0.5,
            fontWeight: 'bold',
            color: 'text.secondary'
          }}>
            Speak into your microphone:
          </Typography>
          <AudioLevelIndicator 
            stream={testStream}
            isActive={true}
            size={size === 'small' ? 'small' : 'medium'}
            showLabel={size !== 'small'}
          />
        </Box>
      )}

      {/* Test Result Alert */}
      {testResult && !testStream && (
        <Alert 
          severity={getTestStatusColor() as any}
          sx={{ mt: 1, fontSize: '12px' }}
          icon={getTestStatusIcon()}
        >
          {testResult.success ? (
            <strong>✅ Your microphone is working correctly!</strong>
          ) : (
            <strong>{testResult.error}</strong>
          )}
        </Alert>
      )}
    </Box>
  );
};

export default MicrophoneTest;