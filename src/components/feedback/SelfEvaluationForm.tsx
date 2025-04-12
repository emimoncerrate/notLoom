import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Rating,
  FormControl,
  FormLabel,
  FormHelperText,
} from '@mui/material';
import { db } from '../../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface SelfEvaluationFormProps {
  onSubmit: () => void;
  videoBlob: Blob | null;
}

const SelfEvaluationForm: React.FC<SelfEvaluationFormProps> = ({
  onSubmit,
  videoBlob,
}) => {
  const [formData, setFormData] = useState({
    clarity: 0,
    technicalDepth: 0,
    presentation: 0,
    strengths: '',
    improvements: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: number | string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // TODO: Implement Google Drive upload here
      const videoUrl = 'https://drive.google.com/file/d/...'; // Placeholder

      // Store metadata in Firestore
      await addDoc(collection(db, 'submissions'), {
        ...formData,
        videoUrl,
        timestamp: new Date(),
        status: 'pending',
      });

      onSubmit();
    } catch (err) {
      setError('Failed to submit evaluation. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Self Evaluation
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <FormLabel>Clarity of Explanation</FormLabel>
          <Rating
            value={formData.clarity}
            onChange={(_, value) => handleChange('clarity', value || 0)}
          />
          <FormHelperText>How clearly did you explain your project?</FormHelperText>
        </FormControl>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <FormLabel>Technical Depth</FormLabel>
          <Rating
            value={formData.technicalDepth}
            onChange={(_, value) => handleChange('technicalDepth', value || 0)}
          />
          <FormHelperText>How well did you demonstrate technical understanding?</FormHelperText>
        </FormControl>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <FormLabel>Presentation Skills</FormLabel>
          <Rating
            value={formData.presentation}
            onChange={(_, value) => handleChange('presentation', value || 0)}
          />
          <FormHelperText>How effective was your presentation style?</FormHelperText>
        </FormControl>
      </Box>

      <TextField
        fullWidth
        label="Key Strengths"
        multiline
        rows={3}
        value={formData.strengths}
        onChange={(e) => handleChange('strengths', e.target.value)}
        sx={{ mb: 3 }}
      />

      <TextField
        fullWidth
        label="Areas for Improvement"
        multiline
        rows={3}
        value={formData.improvements}
        onChange={(e) => handleChange('improvements', e.target.value)}
        sx={{ mb: 3 }}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={submitting}
        fullWidth
      >
        {submitting ? 'Submitting...' : 'Submit Evaluation'}
      </Button>
    </Box>
  );
};

export default SelfEvaluationForm; 