import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Snackbar,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import { ContentCopy, Home, Visibility, Check, HourglassEmpty, CheckCircle } from '@mui/icons-material';
import { db } from '../../services/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface ConfirmationPageProps {
  videoUrl: string;
  submissionId: string;
}

interface Submission {
  status: 'pending' | 'reviewed';
  feedback?: {
    comment: string;
    timestamp: Date;
    reviewer: string;
  }[];
  requirements?: {
    id: string;
    text: string;
    completed: boolean;
  }[];
}

const ConfirmationPage: React.FC<ConfirmationPageProps> = ({ videoUrl, submissionId }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      return;
    }
    
    const fetchSubmission = async () => {
      try {
        // For demo purposes, simulate data if no submissionId
        if (submissionId === 'demo-id') {
          // Create mock data
          setSubmission({
            status: 'pending',
            feedback: [
              {
                comment: "Great work on implementing the core features!",
                timestamp: new Date(),
                reviewer: "John Instructor"
              }
            ],
            requirements: [
              { id: "req1", text: "Working app navigation", completed: true },
              { id: "req2", text: "Authentication flow", completed: true },
              { id: "req3", text: "Styling and responsiveness", completed: false },
              { id: "req4", text: "Code organization", completed: true }
            ]
          });
          setLoading(false);
          return;
        }
        
        // Set up real-time listener for the submission
        const unsubscribe = onSnapshot(
          doc(db, 'submissions', submissionId),
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              setSubmission(docSnapshot.data() as Submission);
            } else {
              // Fallback for demo when no document exists
              setSubmission({
                status: 'pending',
                feedback: [],
                requirements: [
                  { id: "req1", text: "Completed all core requirements", completed: false },
                  { id: "req2", text: "Code follows best practices", completed: false },
                  { id: "req3", text: "UI is responsive and accessible", completed: false }
                ]
              });
            }
            setLoading(false);
          },
          (err) => {
            console.error("Error getting document:", err);
            setError("Failed to load submission data");
            setLoading(false);
          }
        );
        
        return () => unsubscribe();
      } catch (err) {
        console.error("Error setting up listener:", err);
        setError("Failed to connect to database");
        setLoading(false);
      }
    };
    
    fetchSubmission();
  }, [submissionId]);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  const getCompletionPercentage = () => {
    if (!submission?.requirements?.length) return 0;
    const completed = submission.requirements.filter(r => r.completed).length;
    return Math.round((completed / submission.requirements.length) * 100);
  };
  
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading submission details...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom align="center">
          Submission Complete!
        </Typography>
        
        <Typography align="center" color="text.secondary" paragraph>
          Your demo has been saved successfully. You can share it using the link below.
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TextField
            fullWidth
            value={videoUrl}
            variant="outlined"
            size="small"
            InputProps={{
              readOnly: true,
            }}
            sx={{ mr: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<ContentCopy />}
            onClick={handleCopyLink}
            size="small"
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Visibility />}
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mr: 2 }}
          >
            Watch Video
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={handleGoHome}
          >
            Go to Home
          </Button>
        </Box>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Feedback Thread
          </Typography>
          
          <Chip 
            icon={submission?.status === 'reviewed' ? <CheckCircle /> : <HourglassEmpty />}
            label={submission?.status === 'reviewed' ? "Reviewed" : "Pending Review"}
            color={submission?.status === 'reviewed' ? "success" : "default"}
          />
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Requirements Checklist */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Requirements Progress
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
              <CircularProgress
                variant="determinate"
                value={getCompletionPercentage()}
                size={40}
                thickness={4}
                color={getCompletionPercentage() === 100 ? "success" : "primary"}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" component="div" color="text.secondary">
                  {`${getCompletionPercentage()}%`}
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              {submission?.status === 'reviewed' 
                ? "Your submission has been reviewed"
                : "Waiting for instructor review"}
            </Typography>
          </Box>
          
          <List dense>
            {submission?.requirements?.map((req) => (
              <ListItem key={req.id}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {req.completed ? 
                    <Check color="success" /> : 
                    <HourglassEmpty color="disabled" fontSize="small" />
                  }
                </ListItemIcon>
                <ListItemText
                  primary={req.text}
                  primaryTypographyProps={{
                    color: req.completed ? 'text.primary' : 'text.secondary',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
        
        {/* Feedback Comments */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Instructor Comments
          </Typography>
          
          {submission?.feedback && submission.feedback.length > 0 ? (
            <Box>
              {submission.feedback.map((feedback, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {feedback.reviewer}
                    </Typography>
                    <Typography variant="body2">
                      {feedback.comment}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {feedback.timestamp instanceof Date 
                        ? feedback.timestamp.toLocaleString() 
                        : new Date(feedback.timestamp.seconds * 1000).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No comments yet. Check back after your demo has been reviewed.
            </Typography>
          )}
        </Box>
      </Paper>
      
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Link copied to clipboard"
      />
    </Box>
  );
};

export default ConfirmationPage; 