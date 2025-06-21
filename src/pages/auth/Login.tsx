import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  Container,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const { user, loading, signIn, error: authError, signOut } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Check for auth errors from context
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Check if user is already logged in
  useEffect(() => {
    if (user && !loading) {
      // Check if user has a valid Pursuit email
      const isPursuitEmail = user.email?.endsWith('@pursuit.org');
      
      if (isPursuitEmail) {
        navigate('/');
      } else {
        // If not a Pursuit email, sign out and show error
        signOut();
        setError('Only @pursuit.org accounts are allowed.');
      }
    }
  }, [user, loading, navigate, signOut]);

  const handleSignIn = async () => {
    setError(null);
    setIsSigningIn(true);
    
    try {
      await signIn();
      // Auth state change will be handled by the useEffect above
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#4646EF' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          width: '100%', 
          p: 5, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <img 
            src="/logo.svg" 
            alt="Pursuit Logo" 
            height="100"
            style={{ marginBottom: '1.5rem' }} 
          />
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#4646EF'
            }}
          >
            PursuitShipped
          </Typography>
        </Box>
        
        <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Welcome to PursuitShipped – ship your work with pride.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Button
          variant="contained"
          startIcon={<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" width="18" height="18" alt="Google" />}
          onClick={handleSignIn}
          disabled={isSigningIn}
          sx={{ 
            mt: 2, 
            py: 1.5,
            px: 3,
            borderRadius: 28,
            backgroundColor: '#4646EF',
            '&:hover': {
              backgroundColor: '#3838CC',
            }
          }}
          fullWidth
        >
          {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
        </Button>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
          Only @pursuit.org accounts are allowed to sign in.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login; 