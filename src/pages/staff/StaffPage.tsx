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
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Submission {
  id: string;
  meetsAllCriteria: string;
  proudOf: string;
  improve: string;
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
    cohort: 'all',
    assignment: 'all',
    reviewed: 'all',
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
        timestamp: doc.data().timestamp?.toDate() || new Date(),
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

  const handleFilterChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setFilter(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filter.reviewed !== 'all' && submission.status !== filter.reviewed) {
      return false;
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
          Staff Dashboard
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Cohort</InputLabel>
                <Select
                  name="cohort"
                  value={filter.cohort}
                  label="Cohort"
                  onChange={handleFilterChange as any}
                >
                  <MenuItem value="all">All Cohorts</MenuItem>
                  <MenuItem value="9.1">Cohort 9.1</MenuItem>
                  <MenuItem value="9.2">Cohort 9.2</MenuItem>
                  <MenuItem value="9.3">Cohort 9.3</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Assignment</InputLabel>
                <Select
                  name="assignment"
                  value={filter.assignment}
                  label="Assignment"
                  onChange={handleFilterChange as any}
                >
                  <MenuItem value="all">All Assignments</MenuItem>
                  <MenuItem value="capstone">Capstone</MenuItem>
                  <MenuItem value="portfolio">Portfolio</MenuItem>
                  <MenuItem value="sprint">Build Sprint</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Reviewed</InputLabel>
                <Select
                  name="reviewed"
                  value={filter.reviewed}
                  label="Reviewed"
                  onChange={handleFilterChange as any}
                >
                  <MenuItem value="all">All Submissions</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="pending">Pending Review</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ mb: 4 }}>
          {filteredSubmissions.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No submissions found</Typography>
            </Paper>
          ) : (
            filteredSubmissions.map((submission) => (
              <Card key={submission.id} sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Jane Doe
                    </Typography>
                    <Chip
                      label={submission.status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
                      color={submission.status === 'reviewed' ? 'success' : 'warning'}
                    />
                  </Box>

                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 150, 
                      bgcolor: 'rgba(0,0,0,0.1)', 
                      mb: 2,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Video Preview
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      Meets all criteria: {submission.meetsAllCriteria === 'yes' ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2"><strong>Proud of:</strong> {submission.proudOf}</Typography>
                    <Typography variant="body2"><strong>Would improve:</strong> {submission.improve}</Typography>
                  </Box>
                </CardContent>
                <Divider />
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
                    variant="outlined"
                  >
                    Leave Feedback
                  </Button>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={submission.status === 'reviewed'}
                        onChange={() => handleStatusChange(
                          submission.id,
                          submission.status === 'pending' ? 'reviewed' : 'pending'
                        )}
                      />
                    }
                    label="Marked as Reviewed"
                  />
                </CardActions>
              </Card>
            ))
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default StaffPage; 