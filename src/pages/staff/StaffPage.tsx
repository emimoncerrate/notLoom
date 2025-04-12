import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Submission {
  id: string;
  clarity: number;
  technicalDepth: number;
  presentation: number;
  strengths: string;
  improvements: string;
  videoUrl: string;
  timestamp: Date;
  status: 'pending' | 'reviewed';
  reviewer?: string;
  feedback?: string;
}

const StaffPage: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    search: '',
  });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const q = query(collection(db, 'submissions'));
      const querySnapshot = await getDocs(q);
      const submissionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as Submission[];
      
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (submissionId: string, newStatus: 'pending' | 'reviewed') => {
    try {
      const submissionRef = doc(db, 'submissions', submissionId);
      await updateDoc(submissionRef, {
        status: newStatus,
        reviewer: user?.email,
      });
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filter.status !== 'all' && submission.status !== filter.status) {
      return false;
    }
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        submission.strengths.toLowerCase().includes(searchLower) ||
        submission.improvements.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Review Submissions
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Filter by Status"
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="reviewed">Reviewed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search"
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {filteredSubmissions.map((submission) => (
            <Grid item xs={12} key={submission.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Submission from {submission.timestamp.toLocaleDateString()}
                    </Typography>
                    <Chip
                      label={submission.status}
                      color={submission.status === 'reviewed' ? 'success' : 'warning'}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1">Ratings:</Typography>
                      <Typography>Clarity: {submission.clarity}/5</Typography>
                      <Typography>Technical Depth: {submission.technicalDepth}/5</Typography>
                      <Typography>Presentation: {submission.presentation}/5</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1">Self Evaluation:</Typography>
                      <Typography><strong>Strengths:</strong> {submission.strengths}</Typography>
                      <Typography><strong>Improvements:</strong> {submission.improvements}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    href={submission.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Watch Video
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleStatusChange(
                      submission.id,
                      submission.status === 'pending' ? 'reviewed' : 'pending'
                    )}
                  >
                    {submission.status === 'pending' ? 'Mark as Reviewed' : 'Mark as Pending'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default StaffPage; 