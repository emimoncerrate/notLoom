import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Avatar,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
} from '@mui/material';
import { 
  ArrowBack, 
  ThumbUp, 
  Comment, 
  Share,
  FilterList,
  Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Mock submission data
interface Submission {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  submitter: {
    name: string;
    email: string;
    avatar: string;
    cohort: string;
  };
  submittedAt: string;
  status: 'approved' | 'in-review' | 'needs-revision';
  likes: number;
  comments: number;
  tags: string[];
}

const mockSubmissions: Submission[] = [
  {
    id: '1',
    title: 'E-Commerce React App with Stripe Integration',
    description: 'Built a full-stack e-commerce application with React, Node.js, and Stripe payments. Features include user authentication, shopping cart, and admin dashboard.',
    videoUrl: '#',
    thumbnailUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
    submitter: {
      name: 'Alex Johnson',
      email: 'alex.johnson@pursuit.org',
      avatar: 'AJ',
      cohort: 'Web Development 12.0'
    },
    submittedAt: '2024-01-15T10:30:00Z',
    status: 'approved',
    likes: 12,
    comments: 5,
    tags: ['React', 'Node.js', 'Stripe', 'E-commerce']
  },
  {
    id: '2',
    title: 'Machine Learning Price Prediction Model',
    description: 'Developed a machine learning model to predict housing prices using Python, scikit-learn, and deployed with Flask. Achieved 85% accuracy on test data.',
    videoUrl: '#',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    submitter: {
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@pursuit.org',
      avatar: 'MR',
      cohort: 'Data Science 8.0'
    },
    submittedAt: '2024-01-14T15:45:00Z',
    status: 'in-review',
    likes: 8,
    comments: 3,
    tags: ['Python', 'Machine Learning', 'Flask', 'scikit-learn']
  },
  {
    id: '3',
    title: 'Mobile Finance Tracker App',
    description: 'React Native app for personal finance tracking with real-time expense categorization, budget alerts, and data visualization charts.',
    videoUrl: '#',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400',
    submitter: {
      name: 'Jordan Chen',
      email: 'jordan.chen@pursuit.org',
      avatar: 'JC',
      cohort: 'Mobile Development 5.0'
    },
    submittedAt: '2024-01-13T09:20:00Z',
    status: 'needs-revision',
    likes: 6,
    comments: 8,
    tags: ['React Native', 'Finance', 'Mobile', 'Charts']
  },
  {
    id: '4',
    title: 'AI-Powered Recipe Recommendation System',
    description: 'Built an intelligent recipe recommendation system using collaborative filtering and natural language processing to suggest recipes based on dietary preferences and available ingredients.',
    videoUrl: '#',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    submitter: {
      name: 'Taylor Kim',
      email: 'taylor.kim@pursuit.org',
      avatar: 'TK',
      cohort: 'Data Science 8.0'
    },
    submittedAt: '2024-01-12T14:10:00Z',
    status: 'approved',
    likes: 15,
    comments: 7,
    tags: ['AI', 'NLP', 'Python', 'Recommendation System']
  }
];

const SubmissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions] = useState(mockSubmissions);
  const [filteredSubmissions, setFilteredSubmissions] = useState(mockSubmissions);
  const [cohortFilter, setCohortFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique cohorts for filter
  const uniqueCohorts = Array.from(new Set(submissions.map(s => s.submitter.cohort)));

  // Filter submissions
  React.useEffect(() => {
    let filtered = submissions;
    
    if (cohortFilter !== 'all') {
      filtered = filtered.filter(s => s.submitter.cohort === cohortFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredSubmissions(filtered);
  }, [cohortFilter, statusFilter, searchQuery, submissions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'in-review': return 'warning';
      case 'needs-revision': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '✅ Approved';
      case 'in-review': return '🔄 In Review';
      case 'needs-revision': return '🛠 Needs Revision';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#4646EF' }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Staff Dashboard - Review Submissions
          </Typography>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                {user.displayName || user.email}
              </Typography>
              <Avatar size="small">
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </Avatar>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
            Staff Review Filters
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, or tags..."
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Cohort</InputLabel>
                <Select
                  value={cohortFilter}
                  onChange={(e) => setCohortFilter(e.target.value)}
                  label="Cohort"
                >
                  <MenuItem value="all">All Cohorts</MenuItem>
                  {uniqueCohorts.map(cohort => (
                    <MenuItem key={cohort} value={cohort}>{cohort}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="approved">✅ Approved</MenuItem>
                  <MenuItem value="in-review">🔄 In Review</MenuItem>
                  <MenuItem value="needs-revision">🛠 Needs Revision</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Showing {filteredSubmissions.length} of {submissions.length} submissions
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Submissions Grid */}
        <Grid container spacing={3}>
          {filteredSubmissions.map((submission) => (
            <Grid item xs={12} md={6} lg={4} key={submission.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={submission.thumbnailUrl}
                  alt={submission.title}
                  sx={{ backgroundColor: '#f5f5f5' }}
                />
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h2" sx={{ lineHeight: 1.2 }}>
                      {submission.title}
                    </Typography>
                    <Chip 
                      label={getStatusText(submission.status)}
                      color={getStatusColor(submission.status) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {submission.description.substring(0, 120)}...
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {submission.submitter.avatar}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {submission.submitter.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • {formatDate(submission.submittedAt)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {submission.submitter.cohort}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                    {submission.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
                
                <CardActions>
                  <Button size="small" startIcon={<ThumbUp />}>
                    {submission.likes}
                  </Button>
                  <Button size="small" startIcon={<Comment />}>
                    {submission.comments}
                  </Button>
                  <Button size="small" startIcon={<Share />}>
                    Share
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredSubmissions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No submissions found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters or search query
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
};

export default SubmissionsPage;