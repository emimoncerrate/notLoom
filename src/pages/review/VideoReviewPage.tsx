import React, { useState, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Rating,
  Divider,
  Chip,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { 
  ArrowBack, 
  Save,
  Send,
  Note,
  Assessment,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Mock submission data - in real app would fetch by ID
const mockSubmission = {
  id: '1',
  title: 'E-Commerce React App with Stripe Integration',
  description: 'Built a full-stack e-commerce application with React, Node.js, and Stripe payments. Features include user authentication, shopping cart, and admin dashboard.',
  videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', // Placeholder
  submitter: {
    name: 'Alex Johnson',
    email: 'alex.johnson@pursuit.org',
    avatar: 'AJ',
    cohort: 'Web Development 12.0'
  },
  submittedAt: '2024-01-15T10:30:00Z',
  tags: ['React', 'Node.js', 'Stripe', 'E-commerce']
};

const VideoReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { submissionId } = useParams<{ submissionId: string }>();
  
  // Notes state
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  
  // Evaluation state
  const [clarity, setClarity] = useState<number | null>(null);
  const [completeness, setCompleteness] = useState<number | null>(null);
  const [technical, setTechnical] = useState<number | null>(null);
  const [presentation, setPresentation] = useState<number | null>(null);
  const [overall, setOverall] = useState('');
  
  // Feedback state
  const [feedback, setFeedback] = useState('');
  const [currentStep, setCurrentStep] = useState<'watching' | 'evaluation' | 'feedback'>('watching');

  const addNote = () => {
    if (notes.trim()) {
      const timestamp = new Date().toLocaleTimeString();
      setSavedNotes(prev => [...prev, `[${timestamp}] ${notes.trim()}`]);
      setNotes('');
    }
  };

  const handleEvaluationComplete = () => {
    if (clarity && completeness && technical && presentation && overall) {
      setCurrentStep('feedback');
    }
  };

  const handleSubmitReview = () => {
    console.log('📝 Submitting review:', {
      submissionId,
      notes: savedNotes,
      evaluation: { clarity, completeness, technical, presentation, overall },
      feedback
    });
    
    // In real app, save to database
    alert('Review submitted! ✅');
    navigate('/dashboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const evaluationComplete = clarity && completeness && technical && presentation && overall;

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#4646EF' }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Review Demo - {mockSubmission.title}
          </Typography>
          {user && (
            <Typography variant="body2">
              Reviewing as {user.displayName || user.email}
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Left Side - Video & Project Info */}
          <Grid item xs={12} lg={8}>
            {/* Project Info */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                {mockSubmission.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {mockSubmission.description}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  By {mockSubmission.submitter.name} • {mockSubmission.submitter.cohort}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • {formatDate(mockSubmission.submittedAt)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {mockSubmission.tags.map(tag => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Paper>

            {/* Video Player */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📹 Demo Video
              </Typography>
              
              {/* Placeholder for video - in real app would be actual video */}
              <Box sx={{ 
                width: '100%', 
                height: 400, 
                backgroundColor: '#000', 
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <Typography variant="h6">
                  🎬 Video Player (Demo video would play here)
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                💡 Tip: Take notes while watching! Your thoughts will be saved as you type.
              </Typography>
            </Paper>
          </Grid>

          {/* Right Side - Notes & Evaluation */}
          <Grid item xs={12} lg={4}>
            {/* Live Notes */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                <Note sx={{ mr: 1, verticalAlign: 'middle' }} />
                Quick Notes
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jot down thoughts while watching..."
                variant="outlined"
                size="small"
              />
              
              <Button
                fullWidth
                variant="outlined"
                onClick={addNote}
                disabled={!notes.trim()}
                sx={{ mt: 1 }}
                startIcon={<Save />}
              >
                Save Note
              </Button>
              
              {/* Saved Notes */}
              {savedNotes.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Saved Notes ({savedNotes.length})
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {savedNotes.map((note, index) => (
                      <Box key={index} sx={{ p: 1, mb: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {note}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Evaluation Form */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Evaluation
              </Typography>
              
              {currentStep === 'watching' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Watch the demo first, then complete the evaluation below.
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Clarity Rating */}
                <Box>
                  <Typography component="legend" gutterBottom>
                    Explanation Clarity
                  </Typography>
                  <Rating
                    value={clarity}
                    onChange={(_, newValue) => setClarity(newValue)}
                    size="large"
                  />
                  <Typography variant="body2" color="text.secondary">
                    How clearly did they explain their project?
                  </Typography>
                </Box>
                
                {/* Completeness Rating */}
                <Box>
                  <Typography component="legend" gutterBottom>
                    Demo Completeness
                  </Typography>
                  <Rating
                    value={completeness}
                    onChange={(_, newValue) => setCompleteness(newValue)}
                    size="large"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Did they show all the key features?
                  </Typography>
                </Box>
                
                {/* Technical Understanding */}
                <Box>
                  <Typography component="legend" gutterBottom>
                    Technical Understanding
                  </Typography>
                  <Rating
                    value={technical}
                    onChange={(_, newValue) => setTechnical(newValue)}
                    size="large"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Do they understand the tech they used?
                  </Typography>
                </Box>
                
                {/* Presentation Skills */}
                <Box>
                  <Typography component="legend" gutterBottom>
                    Presentation Skills
                  </Typography>
                  <Rating
                    value={presentation}
                    onChange={(_, newValue) => setPresentation(newValue)}
                    size="large"
                  />
                  <Typography variant="body2" color="text.secondary">
                    How engaging was their presentation?
                  </Typography>
                </Box>
                
                {/* Overall Assessment */}
                <FormControl>
                  <FormLabel>Overall Assessment</FormLabel>
                  <RadioGroup
                    value={overall}
                    onChange={(e) => setOverall(e.target.value)}
                  >
                    <FormControlLabel value="exceeds" control={<Radio size="small" />} label="🌟 Exceeds Expectations" />
                    <FormControlLabel value="meets" control={<Radio size="small" />} label="✅ Meets Expectations" />
                    <FormControlLabel value="approaching" control={<Radio size="small" />} label="🔄 Approaching Expectations" />
                    <FormControlLabel value="below" control={<Radio size="small" />} label="🛠 Needs Improvement" />
                  </RadioGroup>
                </FormControl>
              </Box>
              
              {evaluationComplete && (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleEvaluationComplete}
                  sx={{ mt: 2 }}
                >
                  Continue to Feedback
                </Button>
              )}
            </Paper>

            {/* Feedback Section */}
            {currentStep === 'feedback' && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  💬 Personal Feedback
                </Typography>
                
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write your personalized feedback here... What did they do well? What could be improved? Any suggestions or encouragement?"
                  variant="outlined"
                />
                
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={handleSubmitReview}
                  disabled={!feedback.trim()}
                  sx={{ mt: 2 }}
                  startIcon={<Send />}
                >
                  Submit Review
                </Button>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default VideoReviewPage;