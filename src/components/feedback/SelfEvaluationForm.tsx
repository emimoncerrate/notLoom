import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface SelfEvaluationFormProps {
  onSubmit: (submissionId: string, videoUrl: string) => void;
  videoBlob: Blob | null;
  videoNotes: string[];
}

interface FormData {
  meetsAllCriteria: 'yes' | 'no';
  proudOf: string;
  improve: string;
}

const SelfEvaluationForm: React.FC<SelfEvaluationFormProps> = ({
  onSubmit,
  videoBlob,
  videoNotes,
}) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    meetsAllCriteria: 'yes',
    proudOf: '',
    improve: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleChange('meetsAllCriteria', event.target.value as 'yes' | 'no');
  };

  const isValid = () => {
    return formData.proudOf.trim().length > 0 && formData.improve.trim().length > 0;
  };

  const simulateVideoUpload = (): Promise<string> => {
    // In a real app, this would upload to Google Drive and return a share link
    // For now, we'll simulate the upload process with a delay
    
    return new Promise((resolve) => {
      const totalSteps = 10;
      let currentStep = 0;
      
      const interval = setInterval(() => {
        currentStep++;
        setUploadProgress(Math.floor((currentStep / totalSteps) * 100));
        
        if (currentStep === totalSteps) {
          clearInterval(interval);
          // Simulate a Google Drive link
          const mockVideoUrl = `https://drive.google.com/file/d/${Math.random().toString(36).substring(2, 15)}/view`;
          resolve(mockVideoUrl);
        }
      }, 500);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid()) {
      setError('Please fill out all required fields');
      return;
    }
    
    if (!videoBlob) {
      setError('No recording found. Please go back and record your screen.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Simulate uploading video to Google Drive
      const videoUrl = await simulateVideoUpload();
      
      // 2. Save evaluation data to Firestore
      const submissionData = {
        ...formData,
        videoUrl,
        videoNotes,
        timestamp: serverTimestamp(),
        status: 'pending',
        user: {
          uid: currentUser?.uid || 'anonymous',
          email: currentUser?.email || 'anonymous',
          displayName: currentUser?.displayName || 'Anonymous User',
        },
        // These fields would be populated in a real app based on user profile
        cohort: 'Demo Cohort',
        assignment: 'React App Demo',
      };
      
      const docRef = await addDoc(collection(db, 'submissions'), submissionData);
      
      // 3. Call onSubmit with submission ID and video URL
      onSubmit(docRef.id, videoUrl);
      
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit evaluation. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Submitting Your Evaluation
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Uploading video ({uploadProgress}%)
        </Typography>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Self-Evaluation
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <FormControl component="fieldset" fullWidth required>
            <FormLabel component="legend">Does your app meet all assignment criteria?</FormLabel>
            <RadioGroup
              value={formData.meetsAllCriteria}
              onChange={handleRadioChange}
              row
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="What are you most proud of in this project?"
            multiline
            rows={3}
            value={formData.proudOf}
            onChange={(e) => handleChange('proudOf', e.target.value)}
            required
            placeholder="Describe what you think worked well or what you enjoyed building..."
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="What would you improve if you had more time?"
            multiline
            rows={3}
            value={formData.improve}
            onChange={(e) => handleChange('improve', e.target.value)}
            required
            placeholder="Describe what features you would add or refine..."
          />
        </Box>

        {videoNotes.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" gutterBottom>
              Your Video Notes
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, maxHeight: '150px', overflowY: 'auto' }}>
              {videoNotes.map((note, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                  • {note}
                </Typography>
              ))}
            </Paper>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={isSubmitting || !isValid()}
          fullWidth
        >
          Submit Evaluation
        </Button>
      </Paper>
    </Box>
  );
};

export default SelfEvaluationForm; 