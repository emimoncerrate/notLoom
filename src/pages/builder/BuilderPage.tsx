import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import ScreenRecorder from '../../components/recorder/ScreenRecorder';
import SelfEvaluationForm from '../../components/feedback/SelfEvaluationForm';

const steps = ['Record Demo', 'Self Evaluation', 'Submit'];

const BuilderPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  const handleRecordingComplete = (blob: Blob) => {
    setVideoBlob(blob);
    setActiveStep(1);
  };

  const handleEvaluationComplete = () => {
    // TODO: Implement Google Drive upload and Firestore metadata storage
    setActiveStep(2);
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
          />
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Submission Complete!
            </Typography>
            <Typography color="text.secondary">
              Your demo has been submitted successfully. You can view it in your submissions list.
            </Typography>
          </Box>
        );
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
        </Paper>
      </Box>
    </Container>
  );
};

export default BuilderPage; 