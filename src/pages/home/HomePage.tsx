import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { VideoLibrary, Videocam, ExitToApp } from '@mui/icons-material';

// Define props interface
interface HomePageProps {
  roleSpecificView: 'builder' | 'staff' | 'alumni';
}

// Update component signature to accept props
const HomePage: React.FC<HomePageProps> = ({ roleSpecificView }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  // Comment out this log
  // console.log("HomePage rendering for roleSpecificView:", roleSpecificView);

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

  const navigateTo = (path: string) => {
    navigate(path);
  };

  // Render the dashboard content
  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#4646EF' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <img src="/logo.svg" alt="Pursuit Logo" height="32" style={{ marginRight: '10px' }} />
            <Typography variant="h6" component="div">
              PursuitShipped
            </Typography>
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
                {user.photoURL ? (
                  <Avatar src={user.photoURL} alt={user.displayName || ''} />
                ) : (
                  <Avatar>{user.displayName?.charAt(0) || user.email?.charAt(0)}</Avatar>
                )}
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
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

      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#4646EF', fontWeight: 'bold' }}>
            Welcome to PursuitShipped ({roleSpecificView.charAt(0).toUpperCase() + roleSpecificView.slice(1)} View)
          </Typography>
          
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} sm={6}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 4, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 24px rgba(70, 70, 239, 0.15)',
                    }
                  }}
                >
                  <Videocam sx={{ fontSize: 60, color: '#4646EF', mb: 2 }} />
                  <Typography variant="h5" gutterBottom align="center">
                    Record Demo
                  </Typography>
                  <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
                    Create a screen recording to showcase your work
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigateTo('/builder/record')}
                    sx={{ 
                      mt: 'auto', 
                      backgroundColor: '#4646EF',
                      '&:hover': {
                        backgroundColor: '#3838CC',
                      }
                    }}
                  >
                    Start Recording
                  </Button>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 4, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 24px rgba(70, 70, 239, 0.15)',
                    }
                  }}
                >
                  <VideoLibrary sx={{ fontSize: 60, color: '#4646EF', mb: 2 }} />
                  <Typography variant="h5" gutterBottom align="center">
                    View Submissions
                  </Typography>
                  <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
                    Browse and review previously submitted demos
                  </Typography>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigateTo('/submissions')}
                    sx={{ 
                      mt: 'auto',
                      borderColor: '#4646EF',
                      color: '#4646EF',
                      '&:hover': {
                        borderColor: '#3838CC',
                        backgroundColor: 'rgba(70, 70, 239, 0.04)',
                      }
                    }}
                  >
                    View All
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default HomePage; 