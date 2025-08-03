import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Dialog,
  Paper,
} from '@mui/material';
import { ExitToApp, VideoLibrary, Edit, Delete, PlayArrow, Download } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SimpleVideoEditor from '../../components/editor/SimpleVideoEditor';

// Interface for saved recordings
interface SavedRecording {
  id: string;
  title: string;
  url: string;
  timestamp: string;
  mode: string;
  duration?: number;
  size?: number;
}

const SimpleDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [savedRecordings, setSavedRecordings] = useState<SavedRecording[]>([]);
  const [editingVideo, setEditingVideo] = useState<SavedRecording | null>(null);
  const [showReviewedOnly, setShowReviewedOnly] = useState(false);

  // Load saved recordings from localStorage
  useEffect(() => {
    const loadSavedRecordings = () => {
      const recordings: SavedRecording[] = [];
      
      // Get all localStorage keys that start with 'recording_'
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('recording_')) {
          try {
            const recordingData = localStorage.getItem(key);
            if (recordingData) {
              const recording = JSON.parse(recordingData);
              recordings.push(recording);
            }
          } catch (error) {
            console.error('Error parsing saved recording:', error);
          }
        }
      }
      
      // Sort by timestamp (newest first)
      recordings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSavedRecordings(recordings);
    };

    loadSavedRecordings();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleDeleteRecording = (recordingId: string) => {
    // Remove from localStorage
    localStorage.removeItem(`recording_${recordingId}`);
    // Update state
    setSavedRecordings(prev => prev.filter(r => r.id !== recordingId));
  };

  const handleDownloadRecording = (recording: SavedRecording) => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `${recording.title}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown duration';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEditRecording = (recording: SavedRecording) => {
    setEditingVideo(recording);
  };

  const handleSaveEditedVideo = (editedVideo: { url: string; title: string; duration: number }) => {
    // Update the recording in localStorage with edited metadata
    if (editingVideo) {
      const updatedRecording = {
        ...editingVideo,
        title: editedVideo.title,
        duration: editedVideo.duration,
      };
      
      localStorage.setItem(`recording_${editingVideo.id}`, JSON.stringify(updatedRecording));
      
      // Update state
      setSavedRecordings(prev => 
        prev.map(r => r.id === editingVideo.id ? updatedRecording : r)
      );
      
      console.log('✅ Edited video saved to library');
    }
    
    setEditingVideo(null);
  };

  const handleCloseEditor = () => {
    setEditingVideo(null);
  };

  const handleReRecord = () => {
    // Delete the current recording and navigate to record page
    if (editingVideo) {
      handleDeleteRecording(editingVideo.id);
      setEditingVideo(null);
      navigate('/record');
    }
  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#4646EF' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              PursuitShipped
            </Typography>
          </Box>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">
                {user.displayName || user.email}
              </Typography>
              <Avatar>
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </Avatar>
              <IconButton color="inherit" onClick={handleSignOut}>
                <ExitToApp />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to PursuitShipped!
          </Typography>
          
          {/* Tab Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={currentTab} onChange={handleTabChange}>
              <Tab label="🌟 Community Feed" />
              <Tab label="📁 My Library" />
              <Tab label="👤 Profile" />
            </Tabs>
          </Box>

          {/* Community Feed Tab */}
          {currentTab === 0 && (
            <Box>
              {/* Header with Record Button */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Community Feed 🌟
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<VideoLibrary />}
                  onClick={() => navigate('/record')}
                >
                  Record Demo
                </Button>
              </Box>

              {/* Simple Toggle for Reviewed/Unreviewed */}
              <Box sx={{ mb: 3 }}>
                <Button 
                  variant="text" 
                  sx={{ mr: 2, textDecoration: showReviewedOnly ? 'none' : 'underline' }}
                  onClick={() => setShowReviewedOnly(false)}
                >
                  All Posts (4)
                </Button>
                <Button 
                  variant="text" 
                  color={showReviewedOnly ? 'primary' : 'text.secondary'}
                  sx={{ textDecoration: showReviewedOnly ? 'underline' : 'none' }}
                  onClick={() => setShowReviewedOnly(true)}
                >
                  Reviewed by Me (2)
                </Button>
              </Box>

              {/* Community Submissions Feed */}
              <Grid container spacing={3}>
                {[
                  {
                    id: '1',
                    title: 'E-Commerce React App with Stripe Integration',
                    description: 'Built a full-stack e-commerce application with React, Node.js, and Stripe payments. Features include user authentication, shopping cart, and admin dashboard.',
                    submitter: { name: 'Alex Johnson', avatar: 'AJ', cohort: 'Web Dev 12.0' },
                    submittedAt: '2 hours ago',
                    status: 'reviewed',
                    thumbnailUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
                    tags: ['React', 'Node.js', 'Stripe']
                  },
                  {
                    id: '2', 
                    title: 'Machine Learning Price Prediction Model',
                    description: 'Developed a machine learning model to predict housing prices using Python, scikit-learn, and deployed with Flask. Achieved 85% accuracy on test data.',
                    submitter: { name: 'Maria Rodriguez', avatar: 'MR', cohort: 'Data Science 8.0' },
                    submittedAt: '1 day ago',
                    status: 'unreviewed',
                    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
                    tags: ['Python', 'ML', 'Flask']
                  },
                  {
                    id: '3',
                    title: 'Mobile Finance Tracker App', 
                    description: 'React Native app for personal finance tracking with real-time expense categorization, budget alerts, and data visualization charts.',
                    submitter: { name: 'Jordan Chen', avatar: 'JC', cohort: 'Mobile Dev 5.0' },
                    submittedAt: '2 days ago',
                    status: 'reviewed',
                    thumbnailUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400',
                    tags: ['React Native', 'Finance']
                  },
                  {
                    id: '4',
                    title: 'AI-Powered Recipe Recommendation System',
                    description: 'Built an intelligent recipe recommendation system using collaborative filtering and natural language processing to suggest recipes based on dietary preferences.',
                    submitter: { name: 'Taylor Kim', avatar: 'TK', cohort: 'Data Science 8.0' },
                    submittedAt: '3 days ago', 
                    status: 'unreviewed',
                    thumbnailUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
                    tags: ['AI', 'NLP', 'Python']
                  }
                ].filter(submission => 
                  showReviewedOnly ? submission.status === 'reviewed' : true
                ).map((submission) => (
                  <Grid item xs={12} md={6} key={submission.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardMedia
                        component="img"
                        height="180"
                        image={submission.thumbnailUrl}
                        alt={submission.title}
                        sx={{ backgroundColor: '#f5f5f5' }}
                      />
                      
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" component="h2" sx={{ lineHeight: 1.2, fontSize: '1rem' }}>
                            {submission.title}
                          </Typography>
                          <Chip 
                            label={submission.status === 'reviewed' ? '👁️ Reviewed' : '🆕 New'}
                            color={submission.status === 'reviewed' ? 'success' : 'primary'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: '0.875rem' }}>
                          {submission.description.substring(0, 100)}...
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {submission.submitter.avatar}
                          </Avatar>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {submission.submitter.name} • {submission.submittedAt}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {submission.tags.map(tag => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                          ))}
                        </Box>
                      </CardContent>
                      
                      <CardActions sx={{ pt: 0 }}>
                        <Button 
                          size="small"
                          onClick={() => navigate(`/review/${submission.id}`)}
                        >
                          Watch & Review
                        </Button>
                        <Button size="small" color="text.secondary">
                          💬 Give Feedback
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Editing Library Tab */}
          {currentTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  My Recording Library ({savedRecordings.length})
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<VideoLibrary />}
                  onClick={() => navigate('/record')}
                >
                  Record New Video
                </Button>
              </Box>

              {savedRecordings.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No recordings yet! 🎬
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Record your first demo and it will automatically appear here.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {savedRecordings.map((recording) => (
                    <Grid item xs={12} sm={6} md={4} key={recording.id}>
                      <Card>
                        <CardMedia
                          component="video"
                          height="200"
                          src={recording.url}
                          controls
                          sx={{ backgroundColor: '#f5f5f5' }}
                        />
                        <CardContent>
                          <Typography variant="h6" component="div" noWrap>
                            {recording.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            <Chip 
                              label={recording.mode} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                            <Chip 
                              label={formatDuration(recording.duration)} 
                              size="small" 
                              variant="outlined"
                            />
                            <Chip 
                              label={formatFileSize(recording.size)} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {new Date(recording.timestamp).toLocaleDateString()} at{' '}
                            {new Date(recording.timestamp).toLocaleTimeString()}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            startIcon={<Download />}
                            onClick={() => handleDownloadRecording(recording)}
                          >
                            Download
                          </Button>
                          <Button 
                            size="small" 
                            startIcon={<Edit />}
                            onClick={() => handleEditRecording(recording)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="small" 
                            startIcon={<Delete />}
                            onClick={() => handleDeleteRecording(recording.id)}
                            color="error"
                          >
                            Delete
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Profile Tab */}
          {currentTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Profile & Portfolio
              </Typography>
              <Typography color="text.secondary">
                Coming soon: Your submission history, feedback given, and portfolio export tools.
              </Typography>
            </Box>
          )}
        </Box>
      </Container>

      {/* Video Editor Dialog */}
      <Dialog 
        open={!!editingVideo} 
        onClose={handleCloseEditor}
        maxWidth="lg"
        fullWidth
      >
        {editingVideo && (
          <SimpleVideoEditor
            videoUrl={editingVideo.url}
            videoTitle={editingVideo.title}
            onSave={handleSaveEditedVideo}
            onClose={handleCloseEditor}
            onReRecord={handleReRecord}
          />
        )}
      </Dialog>
    </>
  );
};

export default SimpleDashboard; 