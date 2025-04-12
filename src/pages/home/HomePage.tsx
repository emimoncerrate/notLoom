import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = async (role: 'builder' | 'staff') => {
    if (!user) {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Attempting to sign in...");
        await signIn();
        console.log("Sign in successful, navigating to", role);
        navigate(`/${role}`);
      } catch (err) {
        console.error("Error in handleRoleSelect:", err);
        setError("Failed to sign in. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log("User already signed in, navigating to", role);
      navigate(`/${role}`);
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <Typography variant="h1" component="h1" align="center">
          Screen Recording Demo
        </Typography>
        
        <Typography variant="h5" align="center" color="text.secondary">
          Select your role to continue
        </Typography>

        {error && (
          <Typography color="error" align="center">
            {error}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            gap: 4,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              cursor: isLoading ? 'default' : 'pointer',
              '&:hover': {
                boxShadow: isLoading ? 3 : 6,
              },
            }}
            onClick={() => !isLoading && handleRoleSelect('builder')}
          >
            <Typography variant="h4">Builder</Typography>
            <Typography align="center" color="text.secondary">
              Record and submit your demo
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Enter as Builder'}
            </Button>
          </Paper>

          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              cursor: isLoading ? 'default' : 'pointer',
              '&:hover': {
                boxShadow: isLoading ? 3 : 6,
              },
            }}
            onClick={() => !isLoading && handleRoleSelect('staff')}
          >
            <Typography variant="h4">Staff</Typography>
            <Typography align="center" color="text.secondary">
              Review and provide feedback
            </Typography>
            <Button 
              variant="contained" 
              color="secondary"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Enter as Staff'}
            </Button>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage; 