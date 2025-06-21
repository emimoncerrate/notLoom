import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import ScreenRecorder from '../../components/recorder/ScreenRecorder';
import SelfEvaluationForm from '../../components/feedback/SelfEvaluationForm';
import ConfirmationPage from './ConfirmationPage';
import { ArrowBack, ArrowForward, Refresh } from '@mui/icons-material';

const steps = ['Record Demo', 'Self Evaluation', 'Submit'];

const BuilderPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoNotes, setVideoNotes] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [submissionId, setSubmissionId] = useState<string>('');
  const [notification, setNotification] = useState<{ open: boolean, message: string, type: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    type: 'info'
  });

  // Reset notification after 5 seconds
  useEffect(() => {
    if (notification.open) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, open: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.open]);

  const handleRecordingComplete = (blob: Blob, notes: string[]) => {
    setVideoBlob(blob);
    setVideoNotes(notes);
    setActiveStep(1);
    setNotification({
      open: true,
      message: 'Your recording is ready! Now complete the self-evaluation.',
      type: 'success'
    });
  };

  const handleEvaluationComplete = (submissionId: string, videoUrl: string) => {
    setSubmissionId(submissionId);
    setVideoUrl(videoUrl);
    setActiveStep(2);
    setNotification({
      open: true,
      message: 'Submission successful! Your demo has been saved.',
      type: 'success'
    });
  };

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(0, prevStep - 1));
  };

  const handleReset = () => {
    setVideoBlob(null);
    setVideoNotes([]);
    setVideoUrl('');
    setSubmissionId('');
    setActiveStep(0);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <ScreenRecorder onRecordingComplete={handleRecordingComplete} />;
      case 1:
        return (
          <SelfEvaluationForm
            onSubmit={handleEvaluationComplete}
            videoBlob={videoBlob}
            videoNotes={videoNotes}
          />
        );
      case 2:
        return <ConfirmationPage videoUrl={videoUrl} submissionId={submissionId} />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Record Your Demo
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper
          elevation={3}
          sx={{
            p: 4,
            minHeight: 400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderStepContent(activeStep)}

          {activeStep !== 0 && activeStep !== 2 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                startIcon={<ArrowBack />}
              >
                Back
              </Button>
            </Box>
          )}
        </Paper>
        
        <Snackbar
          open={notification.open}
          autoHideDuration={5000}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        >
          <Alert severity={notification.type} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default BuilderPage; 