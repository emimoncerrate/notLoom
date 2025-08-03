import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Grid2 as Grid,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  VideoLibrary,
  Person,
  Edit,
  ExitToApp,
  Search,
  FilterList,
  ThumbUp,
  Comment,
  Share,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CommunityDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    handleClose();
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Mock data for demo videos
  const mockDemoVideos = [
    {
      id: 1,
      title: "React Portfolio Project",
      author: "John Doe",
      thumbnail: "/api/placeholder/300/200",
      duration: "5:30",
      likes: 12,
      comments: 5,
      status: "Reviewed",
      cohort: "9.1"
    },
    {
      id: 2,
      title: "Full Stack E-commerce App",
      author: "Jane Smith",
      thumbnail: "/api/placeholder/300/200",
      duration: "8:45",
      likes: 8,
      comments: 3,
      status: "Pending",
      cohort: "9.2"
    },
    {
      id: 3,
      title: "Mobile Game Development",
      author: "Mike Johnson",
      thumbnail: "/api/placeholder/300/200",
      duration: "12:15",
      likes: 15,
      comments: 8,
      status: "Reviewed",
      cohort: "9.1"
    },
  ];

  // Mock data for user's videos
  const userVideos = [
    {
      id: 1,
      title: "My Capstone Project Demo",
      status: "Published",
      feedback: 7,
      likes: 5,
      views: 23,
      uploadDate: "2024-01-15"
    },
    {
      id: 2,
      title: "Sprint 3 Presentation",
      status: "Draft",
      feedback: 0,
      likes: 0,
      views: 0,
      uploadDate: "2024-01-20"
    }
  ];

  const AllVideosTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Community Demo Videos</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" startIcon={<VideoLibrary />} onClick={() => navigate('/builder/record')}>
            Record New Demo
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {mockDemoVideos.map((video) => (
          <Grid xs={12} sm={6} md={4} key={video.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="div"
                sx={{
                  height: 140,
                  bgcolor: 'grey.300',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <VideoLibrary sx={{ fontSize: 40, color: 'grey.600' }} />
                <Chip 
                  label={video.duration} 
                  size="small" 
                  sx={{ position: 'absolute', bottom: 8, right: 8 }}
                />
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div">
                  {video.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  by {video.author} • Cohort {video.cohort}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={video.status} 
                      color={video.status === 'Reviewed' ? 'success' : 'warning'} 
                      size="small" 
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <ThumbUp fontSize="small" />
                    <Typography variant="caption">{video.likes}</Typography>
                    <Comment fontSize="small" />
                    <Typography variant="caption">{video.comments}</Typography>
                  </Box>
                </Box>
                <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                  Watch & Give Feedback
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const ProfileTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>My Profile</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ width: 60, height: 60 }}>
            {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">{user?.displayName || 'Pursuit Fellow'}</Typography>
            <Typography color="text.secondary">{user?.email}</Typography>
          </Box>
        </Box>
      </Paper>

      <Typography variant="h6" gutterBottom>My Demo Videos</Typography>
      <Grid container spacing={2}>
        {userVideos.map((video) => (
          <Grid xs={12} md={6} key={video.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Typography variant="h6">{video.title}</Typography>
                  <Chip 
                    label={video.status} 
                    color={video.status === 'Published' ? 'success' : 'default'} 
                    size="small" 
                  />
                </Box>
                <Grid container spacing={2}>
                  <Grid xs={3}>
                    <Typography variant="caption" display="block">Feedback</Typography>
                    <Typography variant="h6">{video.feedback}</Typography>
                  </Grid>
                  <Grid xs={3}>
                    <Typography variant="caption" display="block">Likes</Typography>
                    <Typography variant="h6">{video.likes}</Typography>
                  </Grid>
                  <Grid xs={3}>
                    <Typography variant="caption" display="block">Views</Typography>
                    <Typography variant="h6">{video.views}</Typography>
                  </Grid>
                  <Grid xs={3}>
                    <Typography variant="caption" display="block">Uploaded</Typography>
                    <Typography variant="caption">{video.uploadDate}</Typography>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined">View Details</Button>
                  {video.status === 'Draft' && (
                    <Button size="small" variant="contained">Continue Editing</Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const EditingTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>Videos I'm Editing</Typography>
      <Typography color="text.secondary" gutterBottom>
        Draft videos and work-in-progress recordings
      </Typography>

      <Grid container spacing={2}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Untitled Recording</Typography>
              <Typography color="text.secondary" gutterBottom>
                Started 2 hours ago • 3:45 duration
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" startIcon={<Edit />}>Continue Editing</Button>
                <Button variant="outlined">Discard</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button 
          variant="outlined" 
          startIcon={<VideoLibrary />}
          onClick={() => navigate('/builder/record')}
        >
          Start New Recording
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#4646EF' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setTabValue(0)}>
              <img src="/logo.svg" alt="Pursuit Logo" height="32" style={{ marginRight: '10px' }} />
              <Typography variant="h6" component="div">
                PursuitShipped
              </Typography>
            </Box>
          </Box>
          {user && (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar src={user.photoURL || ''} alt={user.displayName || ''}>
                  {user.displayName?.charAt(0) || user.email?.charAt(0)}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem disabled>
                  {user.displayName || user.email}
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                  <ExitToApp fontSize="small" sx={{ mr: 1 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </div>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
            <Tab icon={<VideoLibrary />} label="All Videos" />
            <Tab icon={<Person />} label="My Profile" />
            <Tab icon={<Edit />} label="Editing Queue" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <AllVideosTab />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <ProfileTab />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <EditingTab />
        </TabPanel>
      </Container>
    </>
  );
};

export default CommunityDashboard; 