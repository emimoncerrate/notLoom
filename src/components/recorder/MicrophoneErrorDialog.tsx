import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, AlertTitle, Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Mic, Warning, Info, CheckCircle } from '@mui/icons-material';
import { MicrophonePermissionResult } from '../../utils/microphonePermissions';

interface MicrophoneErrorDialogProps {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  error: MicrophonePermissionResult;
}

const MicrophoneErrorDialog: React.FC<MicrophoneErrorDialogProps> = ({
  open,
  onClose,
  onRetry,
  error
}) => {
  const getAlertSeverity = () => {
    switch (error.errorType) {
      case 'permission-denied':
      case 'not-allowed':
        return 'warning';
      case 'not-found':
      case 'not-readable':
        return 'error';
      default:
        return 'info';
    }
  };

  const getIcon = () => {
    switch (error.errorType) {
      case 'permission-denied':
      case 'not-allowed':
        return <Warning />;
      case 'not-found':
      case 'not-readable':
        return <Mic />;
      default:
        return <Info />;
    }
  };

  const getTitle = () => {
    switch (error.errorType) {
      case 'permission-denied':
      case 'not-allowed':
        return 'Microphone Permission Required';
      case 'not-found':
        return 'No Microphone Found';
      case 'not-readable':
        return 'Microphone Not Available';
      default:
        return 'Microphone Issue';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getIcon()}
        {getTitle()}
      </DialogTitle>
      
      <DialogContent>
        <Alert severity={getAlertSeverity()} sx={{ mb: 2 }}>
          <AlertTitle>{error.error}</AlertTitle>
          {error.errorType === 'permission-denied' && (
            <>
              To record with your microphone, we need permission to access it. 
              This is required for screen + microphone recordings.
            </>
          )}
          {error.errorType === 'not-found' && (
            <>
              We couldn't detect a microphone on your device. 
              You can still record screen-only videos.
            </>
          )}
          {error.errorType === 'not-readable' && (
            <>
              Your microphone appears to be in use by another application.
            </>
          )}
        </Alert>

        {error.guidance && error.guidance.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              How to fix this:
            </Typography>
            <List dense>
              {error.guidance.map((step, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '32px' }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      {index + 1}
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={step}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {error.errorType === 'permission-denied' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Don't want to use your microphone?</strong><br/>
            You can switch to "Screen Only" mode to record without audio.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          {error.errorType === 'permission-denied' ? 'Record Without Mic' : 'Cancel'}
        </Button>
        <Button 
          onClick={onRetry} 
          variant="contained" 
          startIcon={<Mic />}
          color="primary"
        >
          Try Again
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MicrophoneErrorDialog;